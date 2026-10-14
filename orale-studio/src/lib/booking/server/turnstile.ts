import "server-only";
import { discardBody, isTimeoutError } from "./http";

/**
 * Verificação opcional do Cloudflare Turnstile (anti-robô).
 *
 * Ativa somente quando TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY estão
 * definidas. O IP do visitante NÃO é enviado à Cloudflare (minimização).
 */

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const TURNSTILE_TIMEOUT_MS = 5000;

export type TurnstileResult =
  | { status: "ok"; upstreamStatus: number }
  | { status: "failed"; upstreamStatus: number }
  | { status: "misconfigured"; upstreamStatus: number }
  | { status: "unavailable"; reason: "timeout" | "network" | "upstream_status"; upstreamStatus?: number };

// Erros que indicam problema da nossa configuração, não do visitante.
const CONFIG_ERRORS = new Set(["missing-input-secret", "invalid-input-secret"]);

export async function verifyTurnstile(
  token: string,
  secret: string,
  options: { fetch: typeof fetch; timeoutMs?: number },
): Promise<TurnstileResult> {
  let response: Response;
  try {
    response = await options.fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? TURNSTILE_TIMEOUT_MS),
    });
  } catch (error) {
    return { status: "unavailable", reason: isTimeoutError(error) ? "timeout" : "network" };
  }

  const upstreamStatus = response.status;
  if (!response.ok) {
    await discardBody(response);
    return { status: "unavailable", reason: "upstream_status", upstreamStatus };
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    return { status: "unavailable", reason: "upstream_status", upstreamStatus };
  }
  if (typeof result !== "object" || result === null) {
    return { status: "unavailable", reason: "upstream_status", upstreamStatus };
  }

  const { success, "error-codes": errorCodes } = result as { success?: unknown; "error-codes"?: unknown };
  if (success === true) return { status: "ok", upstreamStatus };
  const codes = Array.isArray(errorCodes) ? errorCodes.filter((code): code is string => typeof code === "string") : [];
  if (codes.some((code) => CONFIG_ERRORS.has(code))) return { status: "misconfigured", upstreamStatus };
  if (codes.includes("internal-error")) return { status: "unavailable", reason: "upstream_status", upstreamStatus };
  return { status: "failed", upstreamStatus };
}
