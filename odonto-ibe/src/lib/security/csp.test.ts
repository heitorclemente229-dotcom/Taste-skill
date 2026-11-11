import { describe, expect, it } from "vitest";
import { buildCsp, createNonce, safeReportUri } from "./csp";

const NONCE = "bm9uY2UtZGUtdGVzdGU=";

function directives(csp: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const part of csp.split(";")) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) map.set(name, values);
  }
  return map;
}

const prod = (overrides: Partial<Parameters<typeof buildCsp>[0]> = {}) =>
  directives(buildCsp({ nonce: NONCE, isDev: false, isHttps: true, turnstile: false, ...overrides }));

describe("buildCsp em produção", () => {
  it("scripts só por nonce com strict-dynamic, sem eval nem inline", () => {
    const csp = prod();
    expect(csp.get("script-src")).toEqual(["'self'", `'nonce-${NONCE}'`, "'strict-dynamic'"]);
    expect(csp.get("style-src")).toEqual(["'self'", `'nonce-${NONCE}'`]);
    const all = [...csp.values()].flat();
    expect(all).not.toContain("'unsafe-eval'");
    expect(csp.get("script-src")).not.toContain("'unsafe-inline'");
    expect(csp.get("connect-src")).toEqual(["'self'"]);
    expect(all).not.toContain("ws:");
  });

  it("bloqueia objetos, base, formulários externos e enquadramento", () => {
    const csp = prod();
    expect(csp.get("default-src")).toEqual(["'self'"]);
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("base-uri")).toEqual(["'self'"]);
    expect(csp.get("form-action")).toEqual(["'self'"]);
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
    expect(csp.get("frame-src")).toEqual(["'none'"]);
  });

  it("upgrade-insecure-requests somente em HTTPS fora de desenvolvimento", () => {
    expect(prod().has("upgrade-insecure-requests")).toBe(true);
    expect(prod({ isHttps: false }).has("upgrade-insecure-requests")).toBe(false);
    expect(prod({ isDev: true }).has("upgrade-insecure-requests")).toBe(false);
  });

  it("libera a Cloudflare somente com o Turnstile ativo", () => {
    const origin = "https://challenges.cloudflare.com";
    const off = buildCsp({ nonce: NONCE, isDev: false, isHttps: true, turnstile: false });
    expect(off).not.toContain("cloudflare");
    const on = prod({ turnstile: true });
    expect(on.get("script-src")).toContain(origin);
    expect(on.get("connect-src")).toContain(origin);
    expect(on.get("frame-src")).toEqual([origin]);
  });
});

describe("buildCsp em desenvolvimento", () => {
  it("relaxa eval, estilos e websockets somente com isDev", () => {
    const csp = directives(buildCsp({ nonce: NONCE, isDev: true, isHttps: false, turnstile: false }));
    expect(csp.get("script-src")).toContain("'unsafe-eval'");
    expect(csp.get("style-src")).toContain("'unsafe-inline'");
    expect(csp.get("connect-src")).toEqual(expect.arrayContaining(["ws:", "wss:"]));
  });
});

describe("report-uri", () => {
  it("aceita URL https e caminho do próprio site", () => {
    expect(prod({ reportUri: "https://r.example/csp" }).get("report-uri")).toEqual(["https://r.example/csp"]);
    expect(prod({ reportUri: "/csp-relatorio" }).get("report-uri")).toEqual(["/csp-relatorio"]);
  });

  it.each([
    ["injeção de diretiva", "https://r.example/x; script-src *"],
    ["injeção sem espaço", "https://r.example/x;script-src"],
    ["quebra de linha", "https://r.example/x\r\nSet-Cookie: a=b"],
    ["javascript", "javascript:alert(1)"],
    ["http em produção", "http://r.example/csp"],
    ["protocolo relativo", "//r.example/csp"],
    ["barra invertida", "/\\r.example/csp"],
    ["credenciais", "https://u:p@r.example/csp"],
    ["aspas", "https://r.example/'unsafe-inline'"],
  ])("ignora valor inválido (%s)", (_label, reportUri) => {
    const csp = buildCsp({ nonce: NONCE, isDev: false, isHttps: true, turnstile: false, reportUri });
    expect(csp).not.toContain("report-uri");
    expect(csp).not.toMatch(/[\r\n]/);
    expect(directives(csp).get("script-src")).toEqual(["'self'", `'nonce-${NONCE}'`, "'strict-dynamic'"]);
  });

  it("http só em desenvolvimento", () => {
    expect(safeReportUri("http://localhost:3000/csp", true)).toBe("http://localhost:3000/csp");
    expect(safeReportUri("http://localhost:3000/csp", false)).toBeNull();
  });
});

describe("createNonce", () => {
  it("128 bits aleatórios em base64, sem repetição", () => {
    const nonces = new Set(Array.from({ length: 2000 }, () => createNonce()));
    expect(nonces.size).toBe(2000);
    for (const nonce of nonces) {
      expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
      expect(Buffer.from(nonce, "base64")).toHaveLength(16);
    }
  });
});
