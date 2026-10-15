import { describe, expect, it } from "vitest";
import { readBookingEnv } from "./env";
import { checkOrigin } from "./origin";

const SITE = "https://www.orale.example";

function check(headers: Record<string, string>, env: Record<string, string | undefined> = {}) {
  const config = readBookingEnv({ NODE_ENV: "test", SITE_URL: SITE, ...env });
  return checkOrigin(new Headers(headers), config);
}

describe("origens permitidas", () => {
  it("inclui SITE_URL e, fora de produção, localhost", () => {
    const { allowedOrigins } = readBookingEnv({ NODE_ENV: "development", SITE_URL: `${SITE}/agendar?x=1` });
    expect([...allowedOrigins].sort()).toEqual([SITE, "http://127.0.0.1:3000", "http://localhost:3000"].sort());
  });

  it("em produção não inclui localhost", () => {
    const { allowedOrigins } = readBookingEnv({ NODE_ENV: "production", SITE_URL: SITE });
    expect([...allowedOrigins]).toEqual([SITE]);
  });

  it("normaliza ALLOWED_ORIGINS e ignora entradas inválidas", () => {
    const env = readBookingEnv({
      NODE_ENV: "production",
      SITE_URL: SITE,
      ALLOWED_ORIGINS: " https://orale.example/ , ftp://x.example, nao-e-url, https://user:pw@evil.example,HTTPS://AGENDA.Orale.example:443 ",
    });
    expect([...env.allowedOrigins].sort()).toEqual(["https://agenda.orale.example", "https://orale.example", SITE].sort());
    expect(env.warnings).toContain("allowed_origin_invalid");
  });

  it("produção sem SITE_URL não aceita nenhuma origem e avisa", () => {
    const env = readBookingEnv({ NODE_ENV: "production" });
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
    "https://www.orale.example.evil.example",
    "http://www.orale.example",
    "https://www.orale.example:8443",
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
