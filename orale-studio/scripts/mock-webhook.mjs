#!/usr/bin/env node
/**
 * Receptor de webhook local para testes (e2e e desenvolvimento).
 *
 * Verifica a assinatura exatamente como src/lib/booking/server/webhook.ts a
 * produz: "sha256=" + hex(HMAC-SHA256(segredo, timestamp + "." + corpo bruto)),
 * com comparação em tempo constante e janela de 5 minutos para o timestamp.
 *
 * Variáveis de ambiente:
 * - BOOKING_WEBHOOK_SECRET (obrigatória): o mesmo segredo do site.
 * - MOCK_WEBHOOK_PORT ou PORT: porta em 127.0.0.1 (padrão 4010).
 * - MOCK_WEBHOOK_FAIL=1: responde 500 a todo POST (simula falha do receptor).
 * - MOCK_WEBHOOK_DUMP=<caminho>: grava o último payload verificado em JSON.
 *   O arquivo contém os dados do formulário: use somente com dados fictícios.
 *
 * Rotas: GET /health -> 200; POST em qualquer caminho -> 200, 401, 400, 413 ou 500.
 * O log tem apenas { verified, fieldCount, receivedAt }, nunca dados pessoais.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Mesmos nomes de src/lib/booking/server/webhook.ts (o Node os entrega em minúsculas).
export const SIGNATURE_HEADER = "x-orale-signature";
export const TIMESTAMP_HEADER = "x-orale-timestamp";
/** Tolerância do timestamp, em segundos, para trás e para a frente. */
export const MAX_AGE_SECONDS = 5 * 60;
export const MAX_BODY_BYTES = 64 * 1024;
export const DEFAULT_PORT = 4010;

/**
 * Confere a assinatura de um envio.
 *
 * @param {{ secret: string; timestamp: string | null | undefined; signature: string | null | undefined; body: Buffer | string; nowSeconds?: number }} input
 * @returns {{ ok: true } | { ok: false; reason: "missing" | "timestamp_invalid" | "timestamp_expired" | "signature_format" | "signature_mismatch" }}
 */
export function verifySignature({ secret, timestamp, signature, body, nowSeconds = Math.floor(Date.now() / 1000) }) {
  if (!secret || !timestamp || !signature) return { ok: false, reason: "missing" };
  if (!/^\d{1,12}$/.test(timestamp)) return { ok: false, reason: "timestamp_invalid" };
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_AGE_SECONDS) return { ok: false, reason: "timestamp_expired" };

  const match = /^sha256=([0-9a-f]{64})$/.exec(signature.trim());
  if (!match) return { ok: false, reason: "signature_format" };

  // HMAC sobre os bytes recebidos, sem decodificar e recodificar o corpo.
  const expected = createHmac("sha256", secret).update(`${timestamp}.`).update(body).digest();
  const received = Buffer.from(match[1], "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: "signature_mismatch" };
  }
  return { ok: true };
}

/** Número de campos em `data` (ou do objeto raiz), sem olhar os valores. */
function countFields(payload) {
  if (!payload || typeof payload !== "object") return 0;
  const target = payload.data && typeof payload.data === "object" ? payload.data : payload;
  return Object.keys(target).length;
}

/** Grava o JSON por arquivo temporário + rename, para que o leitor nunca veja um arquivo pela metade. */
async function dumpPayload(path, payload) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temp, target);
}

function send(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

/**
 * Cria o servidor (sem iniciar). Usado pelo modo de linha de comando e pelos testes.
 *
 * @param {{ secret: string; fail?: boolean; dumpPath?: string; log?: (entry: { verified: boolean; fieldCount: number; receivedAt: string }) => void; now?: () => number }} options
 */
export function createMockWebhookServer({ secret, fail = false, dumpPath, log = defaultLog, now = () => Date.now() }) {
  if (!secret) throw new Error("BOOKING_WEBHOOK_SECRET é obrigatório.");

  return createServer((request, response) => {
    const path = (request.url ?? "/").split("?")[0];

    if (request.method === "GET" || request.method === "HEAD") {
      if (path === "/health") return send(response, 200, { ok: true });
      return send(response, 404, { ok: false });
    }
    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, HEAD, POST");
      return send(response, 405, { ok: false });
    }

    const chunks = [];
    let size = 0;
    let tooLarge = false;
    request.on("data", (chunk) => {
      if (tooLarge) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        send(response, 413, { ok: false });
        request.resume();
        return;
      }
      chunks.push(chunk);
    });
    request.on("error", () => {
      if (!response.headersSent) send(response, 400, { ok: false });
    });
    request.on("end", async () => {
      if (tooLarge) return;
      const body = Buffer.concat(chunks);
      const receivedAt = new Date(now()).toISOString();
      const result = verifySignature({
        secret,
        timestamp: request.headers[TIMESTAMP_HEADER],
        signature: request.headers[SIGNATURE_HEADER],
        body,
        nowSeconds: Math.floor(now() / 1000),
      });

      if (!result.ok) {
        log({ verified: false, fieldCount: 0, receivedAt });
        return send(response, 401, { ok: false });
      }

      let payload;
      try {
        payload = JSON.parse(body.toString("utf8"));
      } catch {
        log({ verified: true, fieldCount: 0, receivedAt });
        return send(response, 400, { ok: false });
      }
      log({ verified: true, fieldCount: countFields(payload), receivedAt });

      if (fail) return send(response, 500, { ok: false });

      try {
        if (dumpPath) await dumpPayload(dumpPath, payload);
      } catch {
        return send(response, 500, { ok: false });
      }
      return send(response, 200, { ok: true });
    });
  });
}

function defaultLog(entry) {
  console.log(JSON.stringify(entry));
}

/**
 * Porta a partir de MOCK_WEBHOOK_PORT ou PORT (nesta ordem).
 *
 * @param {Record<string, string | undefined>} [env]
 */
export function resolvePort(env = process.env) {
  const raw = env.MOCK_WEBHOOK_PORT || env.PORT;
  if (!raw) return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Porta inválida: ${raw}`);
  return port;
}

function main() {
  const secret = (process.env.BOOKING_WEBHOOK_SECRET ?? "").trim();
  if (!secret) {
    console.error("[mock-webhook] Defina BOOKING_WEBHOOK_SECRET (o mesmo segredo usado pelo site).");
    process.exit(1);
  }
  if (secret.length < 32) {
    // O site (env.ts) recusa segredos curtos e responderia 503 sem chamar o receptor.
    console.warn("[mock-webhook] Aviso: o site exige BOOKING_WEBHOOK_SECRET com pelo menos 32 caracteres.");
  }

  let port;
  try {
    port = resolvePort();
  } catch (error) {
    console.error(`[mock-webhook] ${error instanceof Error ? error.message : "Porta inválida."}`);
    process.exit(1);
  }

  const server = createMockWebhookServer({
    secret,
    fail: process.env.MOCK_WEBHOOK_FAIL === "1",
    dumpPath: process.env.MOCK_WEBHOOK_DUMP || undefined,
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`[mock-webhook] ouvindo em http://127.0.0.1:${port}`);
  });

  const stop = () => server.close(() => process.exit(0));
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) main();
