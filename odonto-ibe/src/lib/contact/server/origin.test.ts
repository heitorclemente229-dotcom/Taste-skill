import { describe, expect, it } from "vitest";
import { readContactEnv } from "./env";
import { checkOrigin } from "./origin";

const SITE = "https://www.odontoibe.example";

function check(headers: Record<string, string>, env: Record<string, string | undefined> = {}) {
  const config = readContactEnv({ NODE_ENV: "test", SITE_URL: SITE, ...env });
  return checkOrigin(new Headers(headers), config);
}

describe("origens da Vercel", () => {
  it("aceita os endereços informados pela plataforma e ignora valores inválidos", () => {
    const env = readContactEnv({
      NODE_ENV: "production",
      VERCEL_URL: "odonto-ibe-abc123.vercel.app",
      VERCEL_BRANCH_URL: " odonto-ibe-git-main.vercel.app ",
      VERCEL_PROJECT_PRODUCTION_URL: "nao e um host",
    });
    expect([...env.allowedOrigins].sort()).toEqual(["https://odonto-ibe-abc123.vercel.app", "https://odonto-ibe-git-main.vercel.app"]);
    // Na Vercel, a falta de SITE_URL não é um problema de configuração.
    expect(env.warnings).not.toContain("site_url_invalid");
  });

  it("fora da Vercel, produção sem SITE_URL continua sem aceitar origem alguma", () => {
    const env = readContactEnv({ NODE_ENV: "production" });
    expect(env.allowedOrigins.size).toBe(0);
    expect(env.warnings).toContain("site_url_invalid");
  });
});

describe("origens permitidas", () => {
  it("inclui SITE_URL e, fora de produção, localhost", () => {
    const { allowedOrigins } = readContactEnv({ NODE_ENV: "development", SITE_URL: `${SITE}/agendar?x=1` });
    expect([...allowedOrigins].sort()).toEqual([SITE, "http://127.0.0.1:3000", "http://localhost:3000"].sort());
  });

  it("em produção não inclui localhost", () => {
    const { allowedOrigins } = readContactEnv({ NODE_ENV: "production", SITE_URL: SITE });
    expect([...allowedOrigins]).toEqual([SITE]);
  });

  it("normaliza ALLOWED_ORIGINS e ignora entradas inválidas", () => {
    const env = readContactEnv({
      NODE_ENV: "production",
      SITE_URL: SITE,
      ALLOWED_ORIGINS: " https://odontoibe.example/ , ftp://x.example, nao-e-url, https://user:pw@evil.example,HTTPS://AGENDA.Odontoibe.example:443 ",
    });
    expect([...env.allowedOrigins].sort()).toEqual(["https://agenda.odontoibe.example", "https://odontoibe.example", SITE].sort());
    expect(env.warnings).toContain("allowed_origin_invalid");
  });

  it("produção sem SITE_URL não aceita nenhuma origem e avisa", () => {
    const env = readContactEnv({ NODE_ENV: "production" });
    expect(env.allowedOrigins.size).toBe(0);
    expect(env.warnings).toContain("site_url_invalid");
  });
});

describe("checkOrigin", () => {
  it("aceita mesma origem", () => {
    expect(check({ origin: SITE, "sec-fetch-site": "same-origin" })).toEqual({ ok: true });
  });

  it.each(["cross-site", "same-site", "none", "SAME-SITE", ""])("recusa Sec-Fetch-Site %j", (value) => {
    expect(check({ origin: SITE, "sec-fetch-site": value })).toEqual({ ok: false, reason: "sec_fetch_site" });
  });

  it("recusa Sec-Fetch-Site entre sites mesmo sem Origin", () => {
    expect(check({ "sec-fetch-site": "cross-site" })).toEqual({ ok: false, reason: "sec_fetch_site" });
  });

  it.each([
    "https://evil.example",
    "null",
    "https://www.odontoibe.example.evil.example",
    "http://www.odontoibe.example",
    "https://www.odontoibe.example:8443",
  ])("recusa Origin %s", (origin) => {
    expect(check({ origin })).toEqual({ ok: false, reason: "origin_mismatch" });
  });

  it("fora de produção tolera Origin ausente (curl, testes)", () => {
    expect(check({})).toEqual({ ok: true });
  });

  it("em produção exige Origin", () => {
    expect(check({}, { NODE_ENV: "production" })).toEqual({ ok: false, reason: "origin_missing" });
    expect(check({ "sec-fetch-site": "same-origin" }, { NODE_ENV: "production" })).toEqual({
      ok: false,
      reason: "origin_missing",
    });
    expect(check({ origin: SITE }, { NODE_ENV: "production" })).toEqual({ ok: true });
  });

  it("em produção recusa localhost", () => {
    expect(check({ origin: "http://localhost:3000" }, { NODE_ENV: "production" }).ok).toBe(false);
    expect(check({ origin: "http://localhost:3000" }).ok).toBe(true);
  });
});
