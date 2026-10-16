import { mkdtemp, readFile, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bookingSchema } from "@/lib/booking/schema";
import { sendViaWebhook } from "@/lib/booking/server/delivery";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, signWebhook } from "@/lib/booking/server/webhook";
import {
  MAX_AGE_SECONDS,
  SIGNATURE_HEADER as MOCK_SIGNATURE_HEADER,
  TIMESTAMP_HEADER as MOCK_TIMESTAMP_HEADER,
  createMockWebhookServer,
  resolvePort,
  verifySignature,
} from "../scripts/mock-webhook.mjs";
import { PERSON, PII_FRAGMENTS, WEBHOOK_SECRET, validInput } from "./helpers";

const NOW = 1_800_000_000;
const BODY = JSON.stringify({ id: "x", data: { name: "Ana" } });

describe("verifySignature (scripts/mock-webhook.mjs)", () => {
  it("usa os mesmos cabeçalhos do site", () => {
    expect(MOCK_SIGNATURE_HEADER).toBe(SIGNATURE_HEADER.toLowerCase());
    expect(MOCK_TIMESTAMP_HEADER).toBe(TIMESTAMP_HEADER.toLowerCase());
  });

  it("aceita a assinatura gerada por signWebhook, em string ou bytes", () => {
    const signature = signWebhook(WEBHOOK_SECRET, NOW, BODY);
    const base = { secret: WEBHOOK_SECRET, timestamp: String(NOW), signature, nowSeconds: NOW };
    expect(verifySignature({ ...base, body: BODY })).toEqual({ ok: true });
    expect(verifySignature({ ...base, body: Buffer.from(BODY, "utf8") })).toEqual({ ok: true });
  });

  it("aceita corpo com acentos (HMAC sobre os bytes UTF-8)", () => {
    const body = JSON.stringify({ data: { name: PERSON.name } });
    const signature = signWebhook(WEBHOOK_SECRET, NOW, body);
    expect(
      verifySignature({ secret: WEBHOOK_SECRET, timestamp: String(NOW), signature, body: Buffer.from(body), nowSeconds: NOW }),
    ).toEqual({ ok: true });
  });

  it("recusa corpo alterado, segredo errado e timestamp trocado", () => {
    const signature = signWebhook(WEBHOOK_SECRET, NOW, BODY);
    const base = { secret: WEBHOOK_SECRET, timestamp: String(NOW), signature, body: BODY, nowSeconds: NOW };
    expect(verifySignature({ ...base, body: `${BODY} ` })).toEqual({ ok: false, reason: "signature_mismatch" });
    expect(verifySignature({ ...base, secret: `${WEBHOOK_SECRET}x` })).toEqual({ ok: false, reason: "signature_mismatch" });
    expect(verifySignature({ ...base, timestamp: String(NOW + 1) })).toEqual({ ok: false, reason: "signature_mismatch" });
  });

  it("recusa timestamps fora da janela de 5 minutos", () => {
    const old = NOW - MAX_AGE_SECONDS - 1;
    const future = NOW + MAX_AGE_SECONDS + 1;
    const edge = NOW - MAX_AGE_SECONDS;
    const check = (timestamp: number) =>
      verifySignature({
        secret: WEBHOOK_SECRET,
        timestamp: String(timestamp),
        signature: signWebhook(WEBHOOK_SECRET, timestamp, BODY),
        body: BODY,
        nowSeconds: NOW,
      });
    expect(check(old)).toEqual({ ok: false, reason: "timestamp_expired" });
    expect(check(future)).toEqual({ ok: false, reason: "timestamp_expired" });
    expect(check(edge)).toEqual({ ok: true });
  });

  it("recusa cabeçalhos ausentes ou malformados", () => {
    const signature = signWebhook(WEBHOOK_SECRET, NOW, BODY);
    const base = { secret: WEBHOOK_SECRET, timestamp: String(NOW), signature, body: BODY, nowSeconds: NOW };
    expect(verifySignature({ ...base, signature: undefined })).toEqual({ ok: false, reason: "missing" });
    expect(verifySignature({ ...base, timestamp: null })).toEqual({ ok: false, reason: "missing" });
    expect(verifySignature({ ...base, timestamp: "1.5e9" })).toEqual({ ok: false, reason: "timestamp_invalid" });
    expect(verifySignature({ ...base, signature: signature.replace("sha256=", "") })).toEqual({
      ok: false,
      reason: "signature_format",
    });
    expect(verifySignature({ ...base, signature: `${signature}00` })).toEqual({ ok: false, reason: "signature_format" });
    expect(verifySignature({ ...base, secret: "" })).toEqual({ ok: false, reason: "missing" });
  });
});

describe("resolvePort", () => {
  it("usa MOCK_WEBHOOK_PORT, depois PORT, depois 4010", () => {
    expect(resolvePort({ MOCK_WEBHOOK_PORT: "4500", PORT: "4600" })).toBe(4500);
    expect(resolvePort({ PORT: "4600" })).toBe(4600);
    expect(resolvePort({})).toBe(4010);
    expect(() => resolvePort({ PORT: "abc" })).toThrow();
  });
});

describe("servidor do mock com a entrega real do site", () => {
  let dir: string;
  let entries: Record<string, unknown>[];
  let close: (() => Promise<void>) | null = null;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "mock-webhook-"));
    entries = [];
  });

  afterEach(async () => {
    await close?.();
    close = null;
    await rm(dir, { recursive: true, force: true });
  });

  async function start(options: { fail?: boolean; dumpPath?: string } = {}) {
    const server = createMockWebhookServer({ secret: WEBHOOK_SECRET, log: (entry) => entries.push(entry), ...options });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    close = () => new Promise<void>((resolve) => server.close(() => resolve()));
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }

  const data = bookingSchema.parse(validInput());
  const context = () => ({ id: "0b7a4c1e-0000-4000-8000-000000000000", receivedAt: new Date(), fetch: globalThis.fetch });

  it("GET /health responde 200", async () => {
    const base = await start();
    const response = await fetch(`${base}/health`);
    expect(response.status).toBe(200);
  });

  it("aceita o envio assinado pelo site e grava o payload (criando a pasta)", async () => {
    const dumpPath = join(dir, "aninhada", "last-webhook.json");
    const base = await start({ dumpPath });
    const result = await sendViaWebhook({ driver: "webhook", url: `${base}/hook`, secret: WEBHOOK_SECRET }, data, context());
    expect(result).toEqual({ ok: true, upstreamStatus: 200 });

    const saved = JSON.parse(await readFile(dumpPath, "utf8"));
    expect(saved.data).toMatchObject({ name: PERSON.name, phone: `+55${PERSON.phoneDigits}`, period: "manha" });

    expect(entries).toHaveLength(1);
    expect(Object.keys(entries[0]).sort()).toEqual(["fieldCount", "receivedAt", "verified"]);
    expect(entries[0]).toMatchObject({ verified: true, fieldCount: Object.keys(saved.data).length });
    const logged = JSON.stringify(entries);
    for (const fragment of PII_FRAGMENTS) expect(logged).not.toContain(fragment);
  });

  it("responde 401 a assinatura inválida e não grava nada", async () => {
    const dumpPath = join(dir, "last-webhook.json");
    const base = await start({ dumpPath });
    const result = await sendViaWebhook({ driver: "webhook", url: `${base}/hook`, secret: "outro-segredo-com-mais-de-32-caracteres" }, data, context());
    expect(result).toEqual({ ok: false, reason: "upstream_status", upstreamStatus: 401 });
    await expect(readFile(dumpPath, "utf8")).rejects.toThrow();
    expect(entries).toEqual([{ verified: false, fieldCount: 0, receivedAt: expect.any(String) }]);
  });

  it("responde 401 a envio sem cabeçalhos de assinatura", async () => {
    const base = await start();
    const response = await fetch(`${base}/hook`, { method: "POST", body: BODY });
    expect(response.status).toBe(401);
  });

  it("com fail=true responde 500, e o site trata como falha de entrega", async () => {
    const base = await start({ fail: true, dumpPath: join(dir, "last-webhook.json") });
    const result = await sendViaWebhook({ driver: "webhook", url: `${base}/hook`, secret: WEBHOOK_SECRET }, data, context());
    expect(result).toEqual({ ok: false, reason: "upstream_status", upstreamStatus: 500 });
  });

  it("recusa outros métodos", async () => {
    const base = await start();
    const response = await fetch(`${base}/hook`, { method: "PUT", body: "x" });
    expect(response.status).toBe(405);
  });
});
