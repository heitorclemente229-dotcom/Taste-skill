import { describe, expect, it } from "vitest";
import {
  LIMITS,
  bookingSchema,
  formatBrazilianPhone,
  normalizeBrazilianPhone,
  normalizeLine,
  normalizeMultiline,
  toFieldErrors,
} from "./schema";

const valid = {
  name: "Maria Souza",
  phone: "(11) 91234-5678",
  email: "",
  contactPreference: "whatsapp",
  period: "tarde",
  consent: true,
};

function parse(overrides: Record<string, unknown>) {
  return bookingSchema.safeParse({ ...valid, ...overrides });
}

function fieldErrorsOf(overrides: Record<string, unknown>) {
  const result = parse(overrides);
  if (result.success) throw new Error("esperava falha de validação");
  return toFieldErrors(result.error);
}

describe("normalizeBrazilianPhone", () => {
  it.each([
    ["(11) 91234-5678", "11912345678"],
    ["11912345678", "11912345678"],
    ["+55 (11) 91234-5678", "11912345678"],
    ["55 11 91234 5678", "11912345678"],
    ["+55 11 3123-4567", "1131234567"],
    ["(21) 2555-0000", "2125550000"],
    ["(55) 3123-4567", "5531234567"],
    ["(55) 99123-4567", "55991234567"],
    ["+55 55 99123-4567", "55991234567"],
    ["  (31)\t98888-7777 ", "31988887777"],
  ])("aceita %s", (input, expected) => {
    expect(normalizeBrazilianPhone(input)).toBe(expected);
  });

  it.each([
    ["vazio", ""],
    ["somente letras", "telefone"],
    ["curto demais", "91234-5678"],
    ["longo demais", "(11) 91234-56789"],
    ["DDD com zero", "(01) 91234-5678"],
    ["DDD terminando em zero", "(10) 91234-5678"],
    ["prefixo de operadora (0 + DDD)", "011 91234-5678"],
    ["celular sem 9", "(11) 81234-5678"],
    ["fixo começando com 6", "(11) 6123-4567"],
    ["fixo começando com 9", "(11) 9123-4567"],
    ["fixo começando com 1", "(11) 1123-4567"],
    ["código de outro país", "+1 415 555 0100"],
  ])("recusa %s", (_label, input) => {
    expect(normalizeBrazilianPhone(input)).toBeNull();
  });

  it("formata celular e fixo", () => {
    expect(formatBrazilianPhone("11912345678")).toBe("(11) 91234-5678");
    expect(formatBrazilianPhone("1131234567")).toBe("(11) 3123-4567");
    expect(formatBrazilianPhone("123")).toBe("123");
  });
});

describe("normalização de texto", () => {
  it("remove caracteres de controle e de direção de texto", () => {
    expect(normalizeLine("Jo\u0000a\u0007na‮ Souza​")).toBe("Joana Souza");
    expect(normalizeLine("  Ana \n\t Maria  ")).toBe("Ana Maria");
  });

  it("aplica NFC", () => {
    expect(normalizeLine("José")).toBe("José");
  });

  it("limita linhas em branco e converte CRLF", () => {
    expect(normalizeMultiline("a\r\n\r\n\r\n\r\nb\rc")).toBe("a\n\nb\nc");
    expect(normalizeMultiline("a\t\tb    c")).toBe("a b c");
  });
});

describe("bookingSchema", () => {
  it("aceita o mínimo necessário e aplica padrões", () => {
    const result = parse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({ phone: "11912345678", email: "", topic: "", message: "" });
  });

  it("recusa chaves desconhecidas (objeto estrito)", () => {
    const result = parse({ role: "admin" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.code === "unrecognized_keys")).toBe(true);
    // O nome da chave não vira erro de campo exibível.
    expect(toFieldErrors(result.error)).toEqual({});
  });

  it("valida o nome", () => {
    expect(fieldErrorsOf({ name: " A " }).name).toBeDefined();
    expect(fieldErrorsOf({ name: "Maria 2" }).name).toBe("Use apenas letras no nome.");
    expect(fieldErrorsOf({ name: "<b>Maria</b>" }).name).toBeDefined();
    expect(fieldErrorsOf({ name: "a".repeat(LIMITS.nameMax + 1) }).name).toBeDefined();
    expect(fieldErrorsOf({ name: "a".repeat(LIMITS.nameMax * 2 + 1) }).name).toBe("Nome muito longo.");
    expect(parse({ name: "a".repeat(LIMITS.nameMax) }).success).toBe(true);
    expect(parse({ name: "Ana-Lúcia D'Ávila" }).success).toBe(true);
    expect(fieldErrorsOf({ name: 42 }).name).toBe("Informe seu nome.");
  });

  it("remove caracteres de controle antes de validar o nome", () => {
    const result = parse({ name: "‮Maria\u0000 Souza" });
    expect(result.success && result.data.name).toBe("Maria Souza");
  });

  it("valida o telefone", () => {
    expect(fieldErrorsOf({ phone: "123" }).phone).toContain("DDD");
    expect(fieldErrorsOf({ phone: "1".repeat(41) }).phone).toBe("Telefone inválido.");
  });

  it("valida e normaliza o e-mail", () => {
    const result = parse({ email: "  Maria@Example.COM " });
    expect(result.success && result.data.email).toBe("maria@example.com");
    expect(fieldErrorsOf({ email: "maria@" }).email).toBe("Informe um e-mail válido.");
    expect(fieldErrorsOf({ email: `${"a".repeat(LIMITS.emailMax)}@x.com` }).email).toBe("E-mail muito longo.");
  });

  it("exige e-mail quando a preferência de contato é e-mail", () => {
    expect(fieldErrorsOf({ contactPreference: "email", email: "" }).email).toBe(
      "Informe um e-mail para receber o retorno por e-mail.",
    );
    expect(parse({ contactPreference: "email", email: "maria@example.com" }).success).toBe(true);
  });

  it("valida opções fechadas", () => {
    expect(fieldErrorsOf({ contactPreference: "telegram" }).contactPreference).toBeDefined();
    expect(fieldErrorsOf({ period: "noite" }).period).toBeDefined();
    expect(fieldErrorsOf({ topic: "cirurgia" }).topic).toBeDefined();
    expect(parse({ topic: "" }).success).toBe(true);
  });

  it("limita o tamanho da mensagem", () => {
    expect(parse({ message: "a".repeat(LIMITS.messageMax) }).success).toBe(true);
    expect(fieldErrorsOf({ message: "a".repeat(LIMITS.messageMax + 1) }).message).toBeDefined();
    // Espaços extras são removidos antes de contar.
    expect(parse({ message: `${"a ".repeat(200)}${" ".repeat(400)}` }).success).toBe(true);
  });

  it.each(["veja http://exemplo.com", "https://x.co/a", "acesse www.exemplo.com.br", "HTTP://EXEMPLO.COM"])(
    "recusa link na mensagem: %s",
    (message) => {
      expect(fieldErrorsOf({ message }).message).toBe("Por segurança, não inclua links na mensagem.");
    },
  );

  it("permite texto com pontos que não são links", () => {
    expect(parse({ message: "Tenho sensibilidade. Prefiro às 10h." }).success).toBe(true);
  });

  it("exige consentimento verdadeiro", () => {
    expect(fieldErrorsOf({ consent: false }).consent).toBeDefined();
    expect(fieldErrorsOf({ consent: "true" }).consent).toBeDefined();
  });

  it("limita honeypot e token", () => {
    expect(parse({ hp_field: "a".repeat(201) }).success).toBe(false);
    expect(parse({ turnstileToken: "a".repeat(2049) }).success).toBe(false);
    expect(parse({ turnstileToken: "a".repeat(2048) }).success).toBe(true);
  });
});
