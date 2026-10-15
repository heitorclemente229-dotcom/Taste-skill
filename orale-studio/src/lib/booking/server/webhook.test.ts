import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { bookingSchema } from "@/lib/booking/schema";
import { PRIVACY_NOTICE_VERSION, buildWebhookPayload, signWebhook } from "./webhook";

describe("signWebhook", () => {
  it("assina timestamp + '.' + corpo com HMAC-SHA256 em hex", () => {
    // Vetor fixo calculado com: printf '1700000000.{"a":1}' | openssl dgst -sha256 -hmac segredo
    expect(signWebhook("segredo", 1700000000, '{"a":1}')).toBe(
      "sha256=41634607aa61528682a37f94a43a64ca2d3a6a30bc8f2fb88f8f754286d90e85",
    );
  });

  it("confere com o cálculo do receptor e muda com qualquer alteração", () => {
    const body = JSON.stringify({ hello: "mundo" });
    const expected = createHmac("sha256", "k").update(`123.${body}`).digest("hex");
    expect(signWebhook("k", "123", body)).toBe(`sha256=${expected}`);
    expect(signWebhook("k", "124", body)).not.toBe(`sha256=${expected}`);
    expect(signWebhook("k2", "123", body)).not.toBe(`sha256=${expected}`);
    expect(signWebhook("k", "123", `${body} `)).not.toBe(`sha256=${expected}`);
  });
});

describe("buildWebhookPayload", () => {
  it("contém somente os dados do formulário, sem IP nem detalhes internos", () => {
    const data = bookingSchema.parse({
      name: "Ana Souza",
      phone: "(11) 3123-4567",
      contactPreference: "ligacao",
      period: "tarde",
      consent: true,
      hp_field: "",
      turnstileToken: "tok",
    });
    const payload = buildWebhookPayload(data, "0b7a4c1e-0000-4000-8000-000000000000", new Date("2026-10-14T18:30:00Z"));
    expect(payload).toEqual({
      id: "0b7a4c1e-0000-4000-8000-000000000000",
      receivedAt: "2026-10-14T18:30:00.000Z",
      source: "site",
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      data: {
        name: "Ana Souza",
        phone: "+551131234567",
        email: null,
        contactPreference: "ligacao",
        period: "tarde",
        topic: null,
        message: null,
        consent: true,
      },
    });
  });
});
