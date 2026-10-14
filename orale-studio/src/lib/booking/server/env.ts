import "server-only";
import * as z from "zod";

/**
 * Configuração do backend de agendamento, lida das variáveis de ambiente.
 *
 * É lida a cada requisição (não no carregamento do módulo), para que
 * mudanças de ambiente valham sem reiniciar módulos e para que os testes
 * possam alterar `process.env`. Valores com formato inválido contam como
 * "não configurado": o servidor falha de forma fechada e nunca simula envio.
 */

export type DeliveryDriver = "resend" | "webhook";

/** Códigos de problema de configuração. Vão para o log, nunca para a resposta. */
export type ConfigIssue =
  | "delivery_driver_missing"
  | "delivery_driver_invalid"
  | "resend_api_key_invalid"
  | "resend_from_invalid"
  | "resend_to_invalid"
  | "webhook_url_invalid"
  | "webhook_url_insecure"
  | "webhook_secret_invalid"
  | "turnstile_incomplete"
  | "turnstile_secret_rejected"
  | "site_url_invalid"
  | "allowed_origin_invalid"
  | "client_ip_header_invalid"
  | "trust_proxy_disabled";

export type ResendConfig = { driver: "resend"; apiKey: string; from: string; to: string };
export type WebhookConfig = { driver: "webhook"; url: string; secret: string };
export type DeliveryConfig = ResendConfig | WebhookConfig;

export type DeliveryConfigResult =
  | { ok: true; config: DeliveryConfig }
  | { ok: false; issue: ConfigIssue; driver?: DeliveryDriver };

export type TurnstileConfig =
  | { enabled: false; issue?: ConfigIssue }
  | { enabled: true; siteKey: string; secretKey: string };

export type BookingEnv = {
  isProduction: boolean;
  /** Origens aceitas no cabeçalho Origin, já normalizadas. */
  allowedOrigins: ReadonlySet<string>;
  trustProxy: boolean;
  /** Nome do cabeçalho com o IP do cliente, em minúsculas. */
  clientIpHeader: string;
  rateLimitSalt: string;
  turnstile: TurnstileConfig;
  delivery: DeliveryConfigResult;
  /** Problemas não fatais encontrados na leitura (para log). */
  warnings: ConfigIssue[];
};

type Env = Record<string, string | undefined>;

const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"] as const;
const DEFAULT_CLIENT_IP_HEADER = "x-forwarded-for";
const WEBHOOK_SECRET_MIN_LENGTH = 32;

/** Sal aleatório por processo, usado quando RATE_LIMIT_SALT não é definido. */
let processSalt: string | null = null;

function getProcessSalt(): string {
  if (!processSalt) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    processSalt = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return processSalt;
}

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

/** Retorna a origem (esquema + host + porta) de uma URL http(s), ou null. */
export function toOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const emailSchema = z.email();

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && !/[\r\n<>,;\s]/.test(value) && emailSchema.safeParse(value).success;
}

/** Aceita "email@dominio" ou "Nome <email@dominio>" (formato aceito pela Resend). */
export function isValidSender(value: string): boolean {
  if (/[\r\n]/.test(value) || value.length > 320) return false;
  const named = /^([^<>"]{1,100}) <([^<>\s]+)>$/.exec(value);
  if (named) return isValidEmail(named[2]);
  return isValidEmail(value);
}

function readAllowedOrigins(env: Env, isProduction: boolean, warnings: ConfigIssue[]): Set<string> {
  const origins = new Set<string>();
  const siteUrl = clean(env.SITE_URL);
  if (siteUrl) {
    const origin = toOrigin(siteUrl);
    if (origin) origins.add(origin);
    else warnings.push("site_url_invalid");
  } else if (isProduction) {
    warnings.push("site_url_invalid");
  }
  if (!isProduction) for (const origin of DEV_ORIGINS) origins.add(origin);
  for (const entry of clean(env.ALLOWED_ORIGINS).split(",")) {
    const value = entry.trim();
    if (!value) continue;
    const origin = toOrigin(value);
    if (origin) origins.add(origin);
    else warnings.push("allowed_origin_invalid");
  }
  return origins;
}

function readClientIpHeader(env: Env, warnings: ConfigIssue[]): string {
  const value = clean(env.CLIENT_IP_HEADER).toLowerCase();
  if (!value) return DEFAULT_CLIENT_IP_HEADER;
  if (!/^[a-z0-9-]{1,64}$/.test(value)) {
    warnings.push("client_ip_header_invalid");
    return DEFAULT_CLIENT_IP_HEADER;
  }
  return value;
}

function readTurnstile(env: Env): TurnstileConfig {
  const siteKey = clean(env.TURNSTILE_SITE_KEY);
  const secretKey = clean(env.TURNSTILE_SECRET_KEY);
  if (!siteKey && !secretKey) return { enabled: false };
  const valid = (key: string) => /^[A-Za-z0-9_.-]{1,200}$/.test(key);
  if (!valid(siteKey) || !valid(secretKey)) return { enabled: false, issue: "turnstile_incomplete" };
  return { enabled: true, siteKey, secretKey };
}

function readResend(env: Env): DeliveryConfigResult {
  const apiKey = clean(env.RESEND_API_KEY);
  const from = clean(env.BOOKING_EMAIL_FROM);
  const to = clean(env.BOOKING_EMAIL_TO);
  // Rejeita também o valor de exemplo do .env.example (re_xxxxxxxx).
  if (!/^re_[A-Za-z0-9_-]{8,200}$/.test(apiKey) || /^re_x+$/i.test(apiKey)) {
    return { ok: false, issue: "resend_api_key_invalid", driver: "resend" };
  }
  if (!isValidSender(from)) return { ok: false, issue: "resend_from_invalid", driver: "resend" };
  if (!isValidEmail(to)) return { ok: false, issue: "resend_to_invalid", driver: "resend" };
  return { ok: true, config: { driver: "resend", apiKey, from, to } };
}

function readWebhook(env: Env, isProduction: boolean): DeliveryConfigResult {
  const raw = clean(env.BOOKING_WEBHOOK_URL);
  const secret = clean(env.BOOKING_WEBHOOK_SECRET);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, issue: "webhook_url_invalid", driver: "webhook" };
  }
  if (url.username || url.password || (url.protocol !== "https:" && url.protocol !== "http:")) {
    return { ok: false, issue: "webhook_url_invalid", driver: "webhook" };
  }
  // HTTP sem TLS só é aceito fora de produção (receptor local de teste).
  if (url.protocol === "http:" && isProduction) {
    return { ok: false, issue: "webhook_url_insecure", driver: "webhook" };
  }
  if (secret.length < WEBHOOK_SECRET_MIN_LENGTH || /\s/.test(secret)) {
    return { ok: false, issue: "webhook_secret_invalid", driver: "webhook" };
  }
  return { ok: true, config: { driver: "webhook", url: url.toString(), secret } };
}

function readDelivery(env: Env, isProduction: boolean): DeliveryConfigResult {
  const driver = clean(env.BOOKING_DELIVERY).toLowerCase();
  if (!driver) return { ok: false, issue: "delivery_driver_missing" };
  if (driver === "resend") return readResend(env);
  if (driver === "webhook") return readWebhook(env, isProduction);
  return { ok: false, issue: "delivery_driver_invalid" };
}

export function readBookingEnv(env: Env = process.env): BookingEnv {
  const isProduction = env.NODE_ENV === "production";
  const warnings: ConfigIssue[] = [];
  const allowedOrigins = readAllowedOrigins(env, isProduction, warnings);
  const trustProxy = clean(env.TRUST_PROXY).toLowerCase() === "true";
  const clientIpHeader = readClientIpHeader(env, warnings);
  if (isProduction && !trustProxy) warnings.push("trust_proxy_disabled");
  const turnstile = readTurnstile(env);
  if (!turnstile.enabled && turnstile.issue) warnings.push(turnstile.issue);
  const salt = clean(env.RATE_LIMIT_SALT);

  return {
    isProduction,
    allowedOrigins,
    trustProxy,
    clientIpHeader,
    rateLimitSalt: salt || getProcessSalt(),
    turnstile,
    delivery: readDelivery(env, isProduction),
    warnings,
  };
}

/**
 * Chave pública do Turnstile para o widget, ou null quando o Turnstile está
 * desativado. Use em um Server Component e passe o valor como prop para
 * `<TurnstileWidget siteKey={...} />`.
 */
export function getTurnstileSiteKey(env: Env = process.env): string | null {
  const turnstile = readTurnstile(env);
  return turnstile.enabled ? turnstile.siteKey : null;
}
