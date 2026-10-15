import "server-only";
import type { ConfigIssue, DeliveryDriver } from "./env";
import type { BodyFailure } from "./read-body";

/**
 * Log estruturado (uma linha JSON por evento) que NUNCA registra dados
 * pessoais: nada de nome, telefone, e-mail, mensagem, IP, user agent ou
 * corpo da requisição. Somente os campos abaixo são aceitos, e textos
 * passam por uma lista fechada de caracteres para que nada livre entre.
 */

export type LogOutcome =
  | "ok"
  | "invalid"
  | "invalid_request"
  | "forbidden"
  | "rate_limited"
  | "verification_failed"
  | "unavailable"
  | "delivery_failed"
  | "error";

/** Categorias técnicas de recusa ou falha. Lista fechada, sem texto livre. */
export type LogReason =
  | BodyFailure
  | "sec_fetch_site"
  | "origin_mismatch"
  | "origin_missing"
  | "content_type"
  | "client_limit"
  | "global_limit"
  | "honeypot"
  | "unknown_keys"
  | "fields"
  | "token_missing"
  | "token_rejected"
  | "hostname_mismatch"
  | "misconfigured"
  | "timeout"
  | "network"
  | "upstream_status"
  | "not_configured";

export type LogFields = {
  requestId?: string;
  outcome?: LogOutcome;
  /** Status HTTP devolvido ao navegador. */
  status?: number;
  driver?: DeliveryDriver;
  /** Status HTTP do serviço externo (Resend, webhook, Turnstile). */
  upstreamStatus?: number;
  durationMs?: number;
  reason?: LogReason;
  issue?: ConfigIssue;
  /** Somente o nome da classe do erro (por exemplo "TypeError"), nunca a mensagem. */
  errorName?: string;
};

type Level = "info" | "warn" | "error";

const ALLOWED_KEYS = [
  "requestId",
  "outcome",
  "status",
  "driver",
  "upstreamStatus",
  "durationMs",
  "reason",
  "issue",
  "errorName",
] as const satisfies readonly (keyof LogFields)[];

const SAFE_TEXT = /^[a-z0-9_.]{1,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ERROR_NAME = /^[A-Za-z]{1,40}$/;

function sanitize(fields: LogFields): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const key of ALLOWED_KEYS) {
    const value = fields[key];
    if (typeof value === "number") {
      if (Number.isFinite(value)) result[key] = Math.round(value);
      continue;
    }
    if (typeof value !== "string") continue;
    const pattern = key === "requestId" ? UUID : key === "errorName" ? ERROR_NAME : SAFE_TEXT;
    if (pattern.test(value)) result[key] = value;
  }
  return result;
}

export function log(level: Level, event: string, fields: LogFields = {}): void {
  if (!SAFE_TEXT.test(event)) return;
  const line = JSON.stringify({ level, event, ...sanitize(fields) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

const warned = new Set<string>();

/** Registra um aviso de configuração uma única vez por processo. */
export function warnOnce(issue: ConfigIssue): void {
  if (warned.has(issue)) return;
  warned.add(issue);
  log("warn", "booking.config", { issue });
}

/** Para testes: permite que avisos únicos apareçam de novo. */
export function resetLogState(): void {
  warned.clear();
}

/** Nome seguro de um erro desconhecido (apenas letras, sem a mensagem). */
export function errorName(error: unknown): string {
  const name = error instanceof Error ? error.name : typeof error;
  return ERROR_NAME.test(name) ? name : "Error";
}
