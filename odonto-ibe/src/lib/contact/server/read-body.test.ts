import { describe, expect, it } from "vitest";
import { checkContentLength, isJsonContentType, isPlainObject, readJsonBody } from "./read-body";

function request(body: BodyInit | null, headers: Record<string, string> = {}) {
  return new Request("https://x.example/api", { method: "POST", body, headers, duplex: "half" } as RequestInit);
}

function streamOf(chunks: Uint8Array[], options: { endless?: boolean } = {}) {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      else if (!options.endless) controller.close();
    },
  });
}

describe("isJsonContentType", () => {
  it.each([
    ["application/json", true],
    ["application/json; charset=utf-8", true],
    ["APPLICATION/JSON;charset=UTF-8", true],
    ['application/json; charset="utf-8"', true],
    ["application/json; charset=latin1", false],
    ["application/json-patch+json", false],
    ["text/json", false],
    ["text/plain", false],
    ["", false],
  ])("%j -> %s", (value, expected) => {
    expect(isJsonContentType(value)).toBe(expected);
  });

  it("null -> false", () => {
    expect(isJsonContentType(null)).toBe(false);
  });
});

describe("checkContentLength", () => {
  it("aceita ausente ou dentro do limite", () => {
    expect(checkContentLength(null, 10)).toBeNull();
    expect(checkContentLength("10", 10)).toBeNull();
  });

  it("recusa acima do limite ou malformado", () => {
    expect(checkContentLength("11", 10)).toMatchObject({ status: 413 });
    expect(checkContentLength("-1", 10)).toMatchObject({ status: 400 });
    expect(checkContentLength("1e3", 10)).toMatchObject({ status: 400 });
    expect(checkContentLength("99999999999999999999", 10)).toMatchObject({ status: 400 });
  });
});

describe("readJsonBody", () => {
  it("lê um objeto JSON válido", async () => {
    expect(await readJsonBody(request('{"a":1}'), { maxBytes: 100 })).toEqual({ ok: true, value: { a: 1 } });
  });

  it("aceita BOM UTF-8 e acentos divididos entre pedaços", async () => {
    const bytes = new TextEncoder().encode('﻿{"nome":"Conceição"}');
    const middle = bytes.indexOf(0xc3) + 1;
    const result = await readJsonBody(request(streamOf([bytes.slice(0, middle), bytes.slice(middle)])), { maxBytes: 100 });
    expect(result).toEqual({ ok: true, value: { nome: "Conceição" } });
  });

  it("para de ler assim que passa do limite, sem depender do Content-Length", async () => {
    const chunk = new Uint8Array(64).fill(0x20);
    let pulls = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(chunk);
      },
    });
    const result = await readJsonBody(request(endless), { maxBytes: 256 });
    expect(result).toEqual({ ok: false, status: 413, reason: "too_large" });
    expect(pulls).toBeLessThan(10);
  });

  it("aceita exatamente o limite", async () => {
    const body = `{"a":"${"x".repeat(92)}"}`;
    expect(body.length).toBe(100);
    expect((await readJsonBody(request(body), { maxBytes: 100 })).ok).toBe(true);
    expect(await readJsonBody(request(`${body} `), { maxBytes: 100 })).toMatchObject({ status: 413 });
  });

  it("408 quando o cliente envia devagar demais", async () => {
    const stalled = streamOf([new TextEncoder().encode('{"a":')], { endless: true });
    expect(await readJsonBody(request(stalled), { maxBytes: 100, timeoutMs: 30 })).toEqual({
      ok: false,
      status: 408,
      reason: "timeout",
    });
  });

  it.each([
    ["vazio", "", "empty"],
    ["JSON inválido", "{a:1}", "json"],
    ["lista", "[1]", "not_object"],
    ["null", "null", "not_object"],
    ["texto", '"x"', "not_object"],
  ])("400 para %s", async (_label, body, reason) => {
    expect(await readJsonBody(request(body), { maxBytes: 100 })).toEqual({ ok: false, status: 400, reason });
  });

  it("400 sem corpo", async () => {
    expect(await readJsonBody(request(null), { maxBytes: 100 })).toEqual({ ok: false, status: 400, reason: "empty" });
  });

  it("400 para UTF-8 inválido (decodificação estrita)", async () => {
    const bytes = new Uint8Array([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]);
    expect(await readJsonBody(request(bytes), { maxBytes: 100 })).toEqual({ ok: false, status: 400, reason: "encoding" });
  });
});

describe("isPlainObject", () => {
  it("somente objetos simples", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject(JSON.parse('{"__proto__":{"x":1}}'))).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(null)).toBe(false);
  });
});
