import { describe, expect, it } from "vitest";
import { bookingSchema, type BookingData } from "@/lib/booking/schema";
import {
  EMAIL_SUBJECT,
  buildHtml,
  buildResendPayload,
  buildSubject,
  buildText,
  escapeHtml,
  formatReceivedAt,
  stripHeaderBreaks,
} from "./email";

function data(overrides: Record<string, unknown> = {}): BookingData {
  return bookingSchema.parse({
    name: "Ana O'Neil",
    phone: "11912345678",
    email: "ana@example.org",
    contactPreference: "email",
    period: "indiferente",
    topic: "clareamento",
    message: "Linha 1\nLinha <2> & \"3\"",
    consent: true,
    ...overrides,
  });
}

const AT = new Date("2026-10-14T18:30:00Z");

describe("escapeHtml", () => {
  it("escapa os cinco caracteres especiais", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;");
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
    expect(escapeHtml("texto comum")).toBe("texto comum");
  });

  it("neutraliza marcação e atributos", () => {
    const attack = `"><img src=x onerror=alert(1)>`;
    expect(escapeHtml(attack)).toBe("&quot;&gt;&lt;img src=x onerror=alert(1)&gt;");
  });
});

describe("assunto", () => {
  it("usa o primeiro nome", () => {
    expect(buildSubject({ name: "Ana Maria Souza" })).toBe(`${EMAIL_SUBJECT}: Ana`);
  });

  it("remove CR/LF (injeção de cabeçalho)", () => {
    const subject = buildSubject({ name: "Ana\r\nBcc: x@y.co" });
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toBe(`${EMAIL_SUBJECT}: Ana`);
    expect(stripHeaderBreaks("a\r\n b")).toBe("a b");
  });

  it("sem nome, usa só o assunto fixo", () => {
    expect(buildSubject({ name: "  " })).toBe(EMAIL_SUBJECT);
  });
});

describe("corpo do e-mail", () => {
  it("horário de Brasília", () => {
    expect(formatReceivedAt(AT)).toBe("14/10/2026 às 15:30 (horário de Brasília)");
  });

  it("HTML escapa todos os valores do visitante", () => {
    const html = buildHtml(data(), AT);
    expect(html).toContain("Ana O&#39;Neil");
    expect(html).toContain("Linha 1<br>Linha &lt;2&gt; &amp; &quot;3&quot;");
    expect(html).not.toContain("<2>");
    expect(html).toContain("(11) 91234-5678");
    expect(html).toContain("ana@example.org");
    expect(html).toContain("E-mail");
    expect(html).toContain("Sem preferência");
    expect(html).toContain("Clareamento dental");
    expect(html).toContain("14/10/2026 às 15:30");
  });

  it("texto simples traz todos os campos", () => {
    const text = buildText(data({ topic: "", message: "" }), AT);
    expect(text).toContain("Nome: Ana O'Neil");
    expect(text).toContain("Telefone: (11) 91234-5678");
    expect(text).toContain("E-mail: ana@example.org");
    expect(text).toContain("Prefere contato por: E-mail");
    expect(text).toContain("Período preferido: Sem preferência");
    expect(text).toContain("Assunto: Não informado");
    expect(text).toContain("Mensagem:\nSem mensagem");
  });

  it("payload da Resend: destinatário do ambiente e reply_to opcional", () => {
    const config = { from: "Clínica <agenda@orale.example>", to: "recepcao@orale.example" };
    const withEmail = buildResendPayload(config, data(), AT);
    expect(withEmail.to).toEqual(["recepcao@orale.example"]);
    expect(withEmail.from).toBe(config.from);
    expect(withEmail.reply_to).toBe("ana@example.org");

    const withoutEmail = buildResendPayload(config, data({ email: "", contactPreference: "whatsapp" }), AT);
    expect(withoutEmail).not.toHaveProperty("reply_to");
    expect(buildHtml(data({ email: "", contactPreference: "whatsapp" }), AT)).toContain("Não informado");
  });
});
