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
  | "turnstile_invalid"
  | "turnstile_secret_rejected"
  | "site_url_invalid"
  | "allowed_origin_invalid"
  | "client_ip_header_invalid"
  | "trust_proxy_hops_invalid"
  | "trust_proxy_disabled";

export type ResendConfig = { driver: "resend"; apiKey: string; from: string; to: string };
export type WebhookConfig = { driver: "webhook"; url: string; secret: string };
export type DeliveryConfig = ResendConfig | WebhookConfig;

export type DeliveryConfigResult =
  | { ok: true; config: DeliveryConfig }
  | { ok: false; issue: ConfigIssue; driver?: DeliveryDriver };

export type TurnstileConfig =
  | { enabled: false; issue?: ConfigIssue }
  | { enabled: true; siteKey: string; secretKey: string; issue?: undefined }
  /**
   * As duas chaves existem (então o layout mostra o widget e a CSP libera a
   * Cloudflare), mas o formato é inválido. A API falha fechada (503) em vez
   * de aceitar envios sem verificação.
   */
  | { enabled: true; siteKey: null; secretKey: null; issue: ConfigIssue };

export type BookingEnv = {
  isProduction: boolean;
  /** Origens aceitas no cabeçalho Origin, já normalizadas. */
  allowedOrigins: ReadonlySet<string>;
  trustProxy: boolean;
  /** Proxies confiáveis que acrescentam ao cabeçalho do IP (lido da direita). */
  trustProxyHops: number;
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
const MAX_TRUST_PROXY_HOPS = 5;
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

function readTrustProxyHops(env: Env, warnings: ConfigIssue[]): number {
  const value = clean(env.TRUST_PROXY_HOPS);
  if (!value) return 1;
  const hops = Number(value);
  if (!/^\d{1,2}$/.test(value) || hops < 1 || hops > MAX_TRUST_PROXY_HOPS) {
    warnings.push("trust_proxy_hops_invalid");
    return 1;
  }
  return hops;
}

function readTurnstile(env: Env): TurnstileConfig {
  // Mesma regra de presença do layout e do proxy (valores brutos): se o widget
  // aparece para o visitante, o servidor exige e verifica o token.
  if (!env.TURNSTILE_SITE_KEY || !env.TURNSTILE_SECRET_KEY) {
    const partial = clean(env.TURNSTILE_SITE_KEY) || clean(env.TURNSTILE_SECRET_KEY);
    return partial ? { enabled: false, issue: "turnstile_incomplete" } : { enabled: false };
  }
  const siteKey = clean(env.TURNSTILE_SITE_KEY);
  const secretKey = clean(env.TURNSTILE_SECRET_KEY);
  const valid = (key: string) => /^[A-Za-z0-9_.-]{1,200}$/.test(key);
  if (!valid(siteKey) || !valid(secretKey)) {
    return { enabled: true, siteKey: null, secretKey: null, issue: "turnstile_invalid" };
  }
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

/** Endereço de loopback (o tráfego não sai da máquina). A URL já normaliza IPv4. */
export function isLoopbackHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "[::1]") return true;
  return /^127(?:\.\d{1,3}){3}$/.test(hostname);
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
  // HTTP sem TLS só é aceito fora de produção ou em loopback (receptor local
  // de teste ou sidecar na mesma máquina): nesses casos nada passa pela rede.
  if (url.protocol === "http:" && isProduction && !isLoopbackHost(url.hostname)) {
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
  const trustProxyHops = readTrustProxyHops(env, warnings);
  const clientIpHeader = readClientIpHeader(env, warnings);
  if (isProduction && !trustProxy) warnings.push("trust_proxy_disabled");
  const turnstile = readTurnstile(env);
  if (turnstile.issue) warnings.push(turnstile.issue);
  const salt = clean(env.RATE_LIMIT_SALT);

  return {
    isProduction,
    allowedOrigins,
    trustProxy,
    trustProxyHops,
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
