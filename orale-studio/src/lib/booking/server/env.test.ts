import { describe, expect, it } from "vitest";
import { getTurnstileSiteKey, isValidEmail, isValidSender, readBookingEnv } from "./env";

const SECRET = "s".repeat(32);

describe("entrega", () => {
  it("sem driver: não configurado", () => {
    expect(readBookingEnv({}).delivery).toEqual({ ok: false, issue: "delivery_driver_missing" });
  });

  it("driver desconhecido: não configurado", () => {
    expect(readBookingEnv({ BOOKING_DELIVERY: "smtp" }).delivery).toEqual({ ok: false, issue: "delivery_driver_invalid" });
  });

  it("resend completo", () => {
    const env = readBookingEnv({
      BOOKING_DELIVERY: " Resend ",
      RESEND_API_KEY: "re_AbC123_xyz789",
      BOOKING_EMAIL_FROM: "Clínica <agenda@orale.example>",
      BOOKING_EMAIL_TO: "recepcao@orale.example",
    });
    expect(env.delivery).toEqual({
      ok: true,
      config: {
        driver: "resend",
        apiKey: "re_AbC123_xyz789",
        from: "Clínica <agenda@orale.example>",
        to: "recepcao@orale.example",
      },
    });
  });

  it.each([
    ["chave sem prefixo", { RESEND_API_KEY: "abc12345678" }, "resend_api_key_invalid"],
    ["chave de exemplo", { RESEND_API_KEY: "re_xxxxxxxx" }, "resend_api_key_invalid"],
    ["chave com espaço", { RESEND_API_KEY: "re_abc 12345678" }, "resend_api_key_invalid"],
    ["remetente inválido", { BOOKING_EMAIL_FROM: "agenda" }, "resend_from_invalid"],
    ["remetente com quebra de linha", { BOOKING_EMAIL_FROM: "A <a@b.co>\r\nBcc: x@y.co" }, "resend_from_invalid"],
    ["destinatário ausente", { BOOKING_EMAIL_TO: "" }, "resend_to_invalid"],
    ["vários destinatários", { BOOKING_EMAIL_TO: "a@b.co,c@d.co" }, "resend_to_invalid"],
  ])("resend incompleto: %s", (_label, override, issue) => {
    const env = readBookingEnv({
      BOOKING_DELIVERY: "resend",
      RESEND_API_KEY: "re_AbC123_xyz789",
      BOOKING_EMAIL_FROM: "agenda@orale.example",
      BOOKING_EMAIL_TO: "recepcao@orale.example",
      ...override,
    });
    expect(env.delivery).toEqual({ ok: false, issue, driver: "resend" });
  });

  it("webhook completo", () => {
    const env = readBookingEnv({ BOOKING_DELIVERY: "webhook", BOOKING_WEBHOOK_URL: "https://h.example/x", BOOKING_WEBHOOK_SECRET: SECRET });
    expect(env.delivery).toEqual({ ok: true, config: { driver: "webhook", url: "https://h.example/x", secret: SECRET } });
  });

  it.each([
    ["URL inválida", { BOOKING_WEBHOOK_URL: "h.example/x" }, "webhook_url_invalid"],
    ["URL com credenciais", { BOOKING_WEBHOOK_URL: "https://u:p@h.example/x" }, "webhook_url_invalid"],
    ["outro protocolo", { BOOKING_WEBHOOK_URL: "ftp://h.example/x" }, "webhook_url_invalid"],
    ["http em produção", { BOOKING_WEBHOOK_URL: "http://h.example/x", NODE_ENV: "production" }, "webhook_url_insecure"],
    ["segredo curto", { BOOKING_WEBHOOK_SECRET: "curto" }, "webhook_secret_invalid"],
  ])("webhook incompleto: %s", (_label, override, issue) => {
    const env = readBookingEnv({
      BOOKING_DELIVERY: "webhook",
      BOOKING_WEBHOOK_URL: "https://h.example/x",
      BOOKING_WEBHOOK_SECRET: SECRET,
      ...override,
    });
    expect(env.delivery).toEqual({ ok: false, issue, driver: "webhook" });
  });

  it("http é aceito fora de produção (receptor local)", () => {
    const env = readBookingEnv({ BOOKING_DELIVERY: "webhook", BOOKING_WEBHOOK_URL: "http://127.0.0.1:4010/", BOOKING_WEBHOOK_SECRET: SECRET });
    expect(env.delivery.ok).toBe(true);
  });
});

describe("Turnstile", () => {
  it("ativo somente com as duas chaves", () => {
    expect(readBookingEnv({}).turnstile).toEqual({ enabled: false });
    expect(readBookingEnv({ TURNSTILE_SITE_KEY: "1x00000000000000000000AA" }).turnstile).toEqual({
      enabled: false,
      issue: "turnstile_incomplete",
    });
    expect(readBookingEnv({ TURNSTILE_SITE_KEY: "a", TURNSTILE_SECRET_KEY: "b" }).turnstile).toEqual({
      enabled: true,
      siteKey: "a",
      secretKey: "b",
    });
  });

  it("expõe só a chave pública para o widget", () => {
    expect(getTurnstileSiteKey({ TURNSTILE_SITE_KEY: "pub" })).toBeNull();
    expect(getTurnstileSiteKey({ TURNSTILE_SITE_KEY: "pub", TURNSTILE_SECRET_KEY: "sec" })).toBe("pub");
  });
});

describe("proxy e limite", () => {
  it("TRUST_PROXY só vale com 'true'", () => {
    expect(readBookingEnv({ TRUST_PROXY: "1" }).trustProxy).toBe(false);
    expect(readBookingEnv({ TRUST_PROXY: "TRUE" }).trustProxy).toBe(true);
  });

  it("CLIENT_IP_HEADER tem padrão e é validado", () => {
    expect(readBookingEnv({}).clientIpHeader).toBe("x-forwarded-for");
    expect(readBookingEnv({ CLIENT_IP_HEADER: "CF-Connecting-IP" }).clientIpHeader).toBe("cf-connecting-ip");
    const invalid = readBookingEnv({ CLIENT_IP_HEADER: "x: y" });
    expect(invalid.clientIpHeader).toBe("x-forwarded-for");
    expect(invalid.warnings).toContain("client_ip_header_invalid");
  });

  it("usa RATE_LIMIT_SALT ou um sal aleatório estável por processo", () => {
    expect(readBookingEnv({ RATE_LIMIT_SALT: "abc" }).rateLimitSalt).toBe("abc");
    const a = readBookingEnv({}).rateLimitSalt;
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(readBookingEnv({}).rateLimitSalt).toBe(a);
  });

  it("avisa em produção sem TRUST_PROXY", () => {
    expect(readBookingEnv({ NODE_ENV: "production", SITE_URL: "https://a.example" }).warnings).toContain("trust_proxy_disabled");
    expect(readBookingEnv({ NODE_ENV: "production", SITE_URL: "https://a.example", TRUST_PROXY: "true" }).warnings).toEqual([]);
  });
});

describe("validação de e-mail da configuração", () => {
  it("isValidEmail", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a@b.co\r\nBcc: c@d.co")).toBe(false);
  });

  it("isValidSender", () => {
    expect(isValidSender("Oralé Studio <agenda@orale.example>")).toBe(true);
    expect(isValidSender("agenda@orale.example")).toBe(true);
    expect(isValidSender("<agenda@orale.example>")).toBe(false);
    expect(isValidSender('"X" <agenda@orale.example>')).toBe(false);
  });
});
