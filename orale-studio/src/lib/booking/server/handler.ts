import "server-only";
import { randomUUID } from "node:crypto";
import { HONEYPOT_FIELD, LIMITS, bookingSchema, toFieldErrors, type BookingApiResponse } from "@/lib/booking/schema";
import { deriveClientKey, getClientIp } from "./client-ip";
import { deliverBooking } from "./delivery";
import { readBookingEnv } from "./env";
import { jsonResponse } from "./http";
import { errorName, log, warnOnce, type LogFields } from "./log";
import { checkOrigin } from "./origin";
import { consumeClient, consumeGlobal, toRetryAfterSeconds } from "./rate-limit";
import { isJsonContentType, readJsonBody } from "./read-body";
import { verifyTurnstile } from "./turnstile";

/**
 * Processa POST /api/agendamento.
 *
 * Ordem das verificações (das mais baratas para as mais caras):
 * 1. Origem (Sec-Fetch-Site e Origin)        -> 403 forbidden
 * 2. Content-Type JSON                       -> 415 invalid_request
 * 3. Corpo: tamanho, UTF-8, JSON, objeto     -> 413/408/400 invalid_request
 * 4. Limite por cliente                      -> 429 rate_limited
 * 5. Campo-armadilha (honeypot)              -> 400 invalid_request
 * 6. Validação do esquema                    -> 400 invalid / invalid_request
 * 7. Entrega configurada                     -> 503 unavailable
 * 8. Turnstile (se ativo)                    -> 400 verification_failed / 503
 * 9. Teto global (protege a cota de e-mail)  -> 429 rate_limited
 * 10. Entrega real                           -> 200 ok / 502 delivery_failed
 *
 * Este módulo não depende do Next.js: os testes chamam a mesma função.
 */

export type HandlerOptions = {
  /** Substitui o fetch global (testes). */
  fetch?: typeof fetch;
  /** Substitui process.env (testes). */
  env?: Record<string, string | undefined>;
  /** Relógio em milissegundos (testes). */
  now?: () => number;
  timeouts?: { bodyReadMs?: number; turnstileMs?: number; deliveryMs?: number };
};

const INVALID_REQUEST: BookingApiResponse = { ok: false, code: "invalid_request" };

export async function handleBookingRequest(request: Request, options: HandlerOptions = {}): Promise<Response> {
  const started = performance.now();
  const requestId = randomUUID();
  const clock = options.now ?? (() => Date.now());
  const fetchImpl: typeof fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));

  const finish = (status: number, body: BookingApiResponse, fields: LogFields = {}, headers?: Record<string, string>) => {
    const outcome = body.ok ? "ok" : body.code;
    const level = status >= 500 ? "error" : status === 429 ? "warn" : "info";
    log(level, "booking.request", { requestId, outcome, status, durationMs: performance.now() - started, ...fields });
    return jsonResponse(status, body, headers);
  };

  const rateLimited = (retryAfterMs: number, reason: "client_limit" | "global_limit") => {
    const retryAfter = toRetryAfterSeconds(retryAfterMs);
    return finish(429, { ok: false, code: "rate_limited", retryAfter }, { reason }, { "Retry-After": String(retryAfter) });
  };

  try {
    const env = readBookingEnv(options.env ?? process.env);
    for (const issue of env.warnings) warnOnce(issue);

    // 1. Origem.
    const origin = checkOrigin(request.headers, env);
    if (!origin.ok) return finish(403, { ok: false, code: "forbidden" }, { reason: origin.reason });

    // 2. Tipo de conteúdo. Também impede envios "simples" entre sites sem preflight.
    if (!isJsonContentType(request.headers.get("content-type"))) {
      return finish(415, INVALID_REQUEST, { reason: "content_type" });
    }

    // 3. Corpo com limite rígido de bytes.
    const body = await readJsonBody(request, { maxBytes: LIMITS.bodyMaxBytes, timeoutMs: options.timeouts?.bodyReadMs });
    if (!body.ok) return finish(body.status, INVALID_REQUEST, { reason: body.reason });

    // 4. Limite por cliente, antes de qualquer trabalho caro.
    const clientIp = getClientIp(request.headers, { trustProxy: env.trustProxy, header: env.clientIpHeader });
    const client = await consumeClient(deriveClientKey(clientIp, env.rateLimitSalt), clock());
    if (!client.allowed) return rateLimited(client.retryAfterMs, "client_limit");

    // 5. Honeypot: recusa genérica. Nunca simulamos um envio bem-sucedido.
    const trap = body.value[HONEYPOT_FIELD];
    if (typeof trap === "string" && trap.trim() !== "") return finish(400, INVALID_REQUEST, { reason: "honeypot" });

    // 6. Validação. Chaves desconhecidas são recusadas sem ecoar os nomes.
    const parsed = bookingSchema.safeParse(body.value);
    if (!parsed.success) {
      if (parsed.error.issues.some((issue) => issue.code === "unrecognized_keys")) {
        return finish(400, INVALID_REQUEST, { reason: "unknown_keys" });
      }
      const fieldErrors = toFieldErrors(parsed.error);
      if (Object.keys(fieldErrors).length === 0) return finish(400, INVALID_REQUEST, { reason: "fields" });
      return finish(400, { ok: false, code: "invalid", fieldErrors }, { reason: "fields" });
    }
    const data = parsed.data;

    // 7. Sem entrega configurada não há como cumprir o pedido (e não fingimos).
    // Vem antes do Turnstile para não gastar o token (de uso único) à toa.
    if (!env.delivery.ok) {
      log("warn", "booking.config", { requestId, issue: env.delivery.issue, driver: env.delivery.driver });
      return finish(503, { ok: false, code: "unavailable" }, { reason: "not_configured" });
    }
    const delivery = env.delivery.config;

    // 8. Turnstile, quando ativo.
    if (env.turnstile.enabled) {
      const token = data.turnstileToken?.trim();
      if (!token) return finish(400, { ok: false, code: "verification_failed" }, { reason: "token_missing" });
      const result = await verifyTurnstile(token, env.turnstile.secretKey, {
        fetch: fetchImpl,
        timeoutMs: options.timeouts?.turnstileMs,
      });
      if (result.status === "failed") {
        return finish(400, { ok: false, code: "verification_failed" }, { reason: "token_rejected", upstreamStatus: result.upstreamStatus });
      }
      if (result.status === "misconfigured") {
        warnOnce("turnstile_secret_rejected");
        return finish(503, { ok: false, code: "unavailable" }, { reason: "misconfigured", upstreamStatus: result.upstreamStatus });
      }
      if (result.status === "unavailable") {
        return finish(503, { ok: false, code: "unavailable" }, { reason: result.reason, upstreamStatus: result.upstreamStatus });
      }
    }

    // 9. Teto global: conta somente envios que chegariam ao serviço de entrega,
    // para que lixo e robôs barrados antes não esgotem o formulário de todos.
    const global = await consumeGlobal(clock());
    if (!global.allowed) return rateLimited(global.retryAfterMs, "global_limit");

    // 10. Entrega real. Sucesso somente após 2xx do serviço externo.
    const result = await deliverBooking(delivery, data, {
      id: requestId,
      receivedAt: new Date(clock()),
      fetch: fetchImpl,
      timeoutMs: options.timeouts?.deliveryMs,
    });
    if (!result.ok) {
      return finish(
        502,
        { ok: false, code: "delivery_failed" },
        { driver: delivery.driver, reason: result.reason, upstreamStatus: result.upstreamStatus },
      );
    }
    return finish(200, { ok: true }, { driver: delivery.driver, upstreamStatus: result.upstreamStatus });
  } catch (error) {
    log("error", "booking.unexpected_error", { requestId, errorName: errorName(error) });
    return finish(500, { ok: false, code: "error" });
  }
}
