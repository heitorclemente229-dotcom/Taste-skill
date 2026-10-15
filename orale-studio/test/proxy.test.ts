import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";

const PROXY_ENV = ["FORCE_HTTPS", "HSTS_ENABLED", "SITE_URL", "CSP_REPORT_URI", "TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"];

function useProxyEnv(vars: Record<string, string>, nodeEnv = "production") {
  for (const key of PROXY_ENV) vi.stubEnv(key, undefined);
  vi.stubEnv("NODE_ENV", nodeEnv);
  for (const [key, value] of Object.entries(vars)) vi.stubEnv(key, value);
}

function request(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

beforeEach(() => useProxyEnv({}));

describe("CSP por requisição", () => {
  it("aplica a CSP com um nonce novo e o repassa para a renderização", () => {
    const first = proxy(request("https://www.orale.example/"));
    const second = proxy(request("https://www.orale.example/"));
    const csp = first.headers.get("content-security-policy") ?? "";
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeDefined();
    expect(first.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
    expect(second.headers.get("content-security-policy")).not.toBe(csp);
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("libera a Cloudflare somente com as duas chaves do Turnstile", () => {
    useProxyEnv({ TURNSTILE_SITE_KEY: "0x4AAA" });
    expect(proxy(request("https://www.orale.example/")).headers.get("content-security-policy")).not.toContain("cloudflare");
    // Chave só com espaços conta como ausente, como no servidor.
    useProxyEnv({ TURNSTILE_SITE_KEY: "0x4AAA", TURNSTILE_SECRET_KEY: "   " });
    expect(proxy(request("https://www.orale.example/")).headers.get("content-security-policy")).not.toContain("cloudflare");
    useProxyEnv({ TURNSTILE_SITE_KEY: "0x4AAA", TURNSTILE_SECRET_KEY: "0x4BBB" });
    expect(proxy(request("https://www.orale.example/")).headers.get("content-security-policy")).toContain(
      "frame-src https://challenges.cloudflare.com",
    );
  });

  it("CSP_REPORT_URI malformado não derruba a página nem injeta diretivas", () => {
    useProxyEnv({ CSP_REPORT_URI: "https://r.example/x\r\nSet-Cookie: a=b; script-src *" });
    const response = proxy(request("https://www.orale.example/"));
    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).not.toContain("report-uri");
    expect(csp).not.toContain("script-src *");
  });
});

describe("HSTS", () => {
  it("somente com HSTS_ENABLED=true e requisição HTTPS", () => {
    useProxyEnv({ HSTS_ENABLED: "true" });
    expect(proxy(request("https://www.orale.example/")).headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
    expect(proxy(request("http://www.orale.example/")).headers.get("strict-transport-security")).toBeNull();
    useProxyEnv({});
    expect(proxy(request("https://www.orale.example/")).headers.get("strict-transport-security")).toBeNull();
  });
});

describe("redirecionamento para HTTPS", () => {
  beforeEach(() => useProxyEnv({ FORCE_HTTPS: "true", SITE_URL: "https://www.orale.example" }));

  it("usa o domínio canônico, não o Host da requisição", () => {
    const response = proxy(request("http://atacante.example/agendar?x=1", { "x-forwarded-proto": "http" }));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://www.orale.example/agendar?x=1");
  });

  it.each(["http://www.orale.example//evil.example/x", "http://www.orale.example/%2F%2Fevil.example"])(
    "caminho com barras duplas não troca o domínio (%s)",
    (url) => {
      const location = proxy(request(url)).headers.get("location") ?? "";
      expect(new URL(location).host).toBe("www.orale.example");
    },
  );

  it("SITE_URL com esquema estranho não derruba o proxy", () => {
    useProxyEnv({ FORCE_HTTPS: "true", SITE_URL: "mailto:x@orale.example" });
    const response = proxy(request("http://www.orale.example/a"));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://www.orale.example/a");
  });

  it("não redireciona em desenvolvimento", () => {
    useProxyEnv({ FORCE_HTTPS: "true", SITE_URL: "https://www.orale.example" }, "development");
    expect(proxy(request("http://localhost:3000/")).status).toBe(200);
  });
});
