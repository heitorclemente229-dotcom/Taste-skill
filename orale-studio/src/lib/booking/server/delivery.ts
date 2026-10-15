import "server-only";
import type { BookingData } from "@/lib/booking/schema";
import type { DeliveryConfig, ResendConfig, WebhookConfig } from "./env";
import { buildResendPayload } from "./email";
import { discardBody, isTimeoutError } from "./http";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, buildWebhookPayload, signWebhook } from "./webhook";

/**
 * Entrega real da solicitação. Nunca é simulada: o sucesso só é informado
 * depois que o serviço externo responde 2xx.
 */

export const RESEND_ENDPOINT = "https://api.resend.com/emails";
export const DELIVERY_TIMEOUT_MS = 8000;

export type DeliveryResult =
  | { ok: true; upstreamStatus: number }
  | { ok: false; reason: "timeout" | "network" | "upstream_status"; upstreamStatus?: number };

export type DeliveryContext = {
  id: string;
  receivedAt: Date;
  fetch: typeof fetch;
  timeoutMs?: number;
};

async function send(url: string, init: RequestInit, context: DeliveryContext): Promise<DeliveryResult> {
  let response: Response;
  try {
    response = await context.fetch(url, {
      ...init,
      method: "POST",
      // Não segue redirecionamentos: o corpo assinado não deve ir para outro destino.
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(context.timeoutMs ?? DELIVERY_TIMEOUT_MS),
    });
  } catch (error) {
    return { ok: false, reason: isTimeoutError(error) ? "timeout" : "network" };
  }
  // O corpo externo nunca é lido nem repassado ao visitante.
  await discardBody(response);
  if (response.status >= 200 && response.status < 300) return { ok: true, upstreamStatus: response.status };
  return { ok: false, reason: "upstream_status", upstreamStatus: response.status };
}

export function sendViaResend(config: ResendConfig, data: BookingData, context: DeliveryContext) {
  const payload = buildResendPayload(config, data, context.receivedAt);
  return send(
    RESEND_ENDPOINT,
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    context,
  );
}

export function sendViaWebhook(config: WebhookConfig, data: BookingData, context: DeliveryContext) {
  const rawBody = JSON.stringify(buildWebhookPayload(data, context.id, context.receivedAt));
  const timestamp = Math.floor(context.receivedAt.getTime() / 1000);
  return send(
    config.url,
    {
      headers: {
        "Content-Type": "application/json",
        [TIMESTAMP_HEADER]: String(timestamp),
        [SIGNATURE_HEADER]: signWebhook(config.secret, timestamp, rawBody),
      },
      body: rawBody,
    },
    context,
  );
}

export function deliverBooking(config: DeliveryConfig, data: BookingData, context: DeliveryContext) {
  return config.driver === "resend"
    ? sendViaResend(config, data, context)
    : sendViaWebhook(config, data, context);
}
