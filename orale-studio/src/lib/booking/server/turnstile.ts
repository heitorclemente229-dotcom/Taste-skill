import "server-only";
import { discardBody, isTimeoutError } from "./http";

/**
 * Verificação opcional do Cloudflare Turnstile (anti-robô).
 *
 * Ativa somente quando TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY estão
 * definidas. O IP do visitante NÃO é enviado à Cloudflare (minimização).
 *
 * Quando `expectedHostnames` é informado (produção), o hostname em que o
 * desafio foi resolvido precisa ser um dos domínios do site: um token obtido
 * em outro domínio com a mesma chave pública não vale aqui.
 */

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const TURNSTILE_TIMEOUT_MS = 5000;

export type TurnstileResult =
  | { status: "ok"; upstreamStatus: number }
  | { status: "failed"; upstreamStatus: number; reason?: "hostname_mismatch" }
  | { status: "misconfigured"; upstreamStatus: number }
  | { status: "unavailable"; reason: "timeout" | "network" | "upstream_status"; upstreamStatus?: number };

// Erros que indicam problema da nossa configuração, não do visitante.
const CONFIG_ERRORS = new Set(["missing-input-secret", "invalid-input-secret"]);

export async function verifyTurnstile(
  token: string,
  secret: string,
  options: { fetch: typeof fetch; timeoutMs?: number; expectedHostnames?: ReadonlySet<string> },
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

  const { success, hostname, "error-codes": errorCodes } = result as {
    success?: unknown;
    hostname?: unknown;
    "error-codes"?: unknown;
  };
  if (success === true) {
    const expected = options.expectedHostnames;
    if (expected && typeof hostname === "string" && !expected.has(hostname.toLowerCase())) {
      return { status: "failed", upstreamStatus, reason: "hostname_mismatch" };
    }
    return { status: "ok", upstreamStatus };
  }
  const codes = Array.isArray(errorCodes) ? errorCodes.filter((code): code is string => typeof code === "string") : [];
  if (codes.some((code) => CONFIG_ERRORS.has(code))) return { status: "misconfigured", upstreamStatus };
  if (codes.includes("internal-error")) return { status: "unavailable", reason: "upstream_status", upstreamStatus };
  return { status: "failed", upstreamStatus };
}
