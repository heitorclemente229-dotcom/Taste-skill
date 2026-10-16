import "server-only";
import { createHmac } from "node:crypto";
import type { BookingData, ContactPreference, Period, Topic } from "@/lib/booking/schema";

/**
 * Entrega por webhook assinado (HMAC-SHA256).
 *
 * Cabeçalhos enviados:
 * - X-Orale-Timestamp: segundos Unix do envio.
 * - X-Orale-Signature: "sha256=" + hex(HMAC(segredo, timestamp + "." + corpo)).
 *
 * O receptor deve recalcular a assinatura sobre o corpo bruto, comparar em
 * tempo constante e recusar timestamps antigos (proteção contra repetição).
 * O payload não contém IP, user agent nem detalhes internos do consentimento.
 */

/** Versão do aviso de privacidade aceito. Atualize ao mudar o texto do aviso. */
export const PRIVACY_NOTICE_VERSION = "2026-10";

export const SIGNATURE_HEADER = "X-Orale-Signature";
export const TIMESTAMP_HEADER = "X-Orale-Timestamp";

export type WebhookPayload = {
  id: string;
  receivedAt: string;
  source: "site";
  privacyNoticeVersion: string;
  data: {
    name: string;
    /** Formato E.164, por exemplo "+5511912345678". */
    phone: string;
    email: string | null;
    contactPreference: ContactPreference;
    period: Period;
    topic: Topic | null;
    message: string | null;
    consent: true;
  };
};

export function buildWebhookPayload(data: BookingData, id: string, receivedAt: Date): WebhookPayload {
  return {
    id,
    receivedAt: receivedAt.toISOString(),
    source: "site",
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    data: {
      name: data.name,
      phone: `+55${data.phone}`,
      email: data.email || null,
      contactPreference: data.contactPreference,
      period: data.period,
      topic: data.topic || null,
      message: data.message || null,
      consent: true,
    },
  };
}

export function signWebhook(secret: string, timestamp: number | string, rawBody: string): string {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")}`;
}
