import * as z from "zod";

/**
 * Contrato da solicitação de agendamento.
 *
 * Este esquema é compartilhado entre o navegador (feedback imediato) e o
 * servidor (validação que realmente vale). O servidor nunca confia no
 * resultado da validação feita no navegador.
 *
 * Minimização de dados (LGPD): coletamos apenas o necessário para retornar
 * o contato e combinar a consulta. Não pedimos informações de saúde.
 */

export const LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 120,
  messageMax: 500,
  /** Tamanho máximo do corpo da requisição, em bytes. */
  bodyMaxBytes: 8 * 1024,
} as const;

export const CONTACT_PREFERENCES = ["whatsapp", "ligacao", "email"] as const;
export const PERIODS = ["manha", "tarde", "indiferente"] as const;
export const TOPICS = [
  "avaliacao",
  "ortodontia",
  "clareamento",
  "implantes",
  "estetica",
  "prevencao",
  "restauradores",
  "outro",
] as const;

export type ContactPreference = (typeof CONTACT_PREFERENCES)[number];
export type Period = (typeof PERIODS)[number];
export type Topic = (typeof TOPICS)[number];

export const CONTACT_PREFERENCE_LABELS: Record<ContactPreference, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  email: "E-mail",
};

export const PERIOD_LABELS: Record<Period, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  indiferente: "Sem preferência",
};

export const TOPIC_LABELS: Record<Topic, string> = {
  avaliacao: "Primeira avaliação",
  ortodontia: "Ortodontia",
  clareamento: "Clareamento dental",
  implantes: "Implantes",
  estetica: "Estética odontológica",
  prevencao: "Prevenção e limpeza",
  restauradores: "Tratamentos restauradores",
  outro: "Outro assunto",
};

/** Nome do campo-armadilha (honeypot). Pessoas não o veem; robôs costumam preenchê-lo. */
export const HONEYPOT_FIELD = "hp_field" as const;

// Caracteres de controle C0 e C1 (exceto tabulação e quebras de linha) e todos
// os caracteres invisíveis: formatação (Cf: largura zero, hífen condicional,
// controles de direção de texto, marcas de tag) e os ignoráveis por padrão
// (preenchedores, seletores de variação). Servem para ofuscar texto e para
// esconder links do filtro abaixo. Escritos com escapes, nunca literais.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\p{Cf}\p{Default_Ignorable_Code_Point}]/gu;
const URL_PATTERN = /(https?:\/\/|www\.)\S+/i;

/** true quando o texto contém um link, inclusive em caracteres de largura total (NFKC). */
function containsLink(value: string): boolean {
  return URL_PATTERN.test(value) || URL_PATTERN.test(value.normalize("NFKC"));
}

/** Normaliza texto de uma linha: NFC, sem caracteres de controle, espaços colapsados. */
export function normalizeLine(value: string): string {
  return value.normalize("NFC").replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
}

/** Normaliza texto de várias linhas, preservando no máximo uma linha em branco seguida. */
export function normalizeMultiline(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\r\n?|[\u2028\u2029]/g, "\n")
    .replace(CONTROL_CHARS, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Normaliza um telefone brasileiro para apenas dígitos (DDD + número).
 * Aceita o prefixo do país (+55). Retorna null quando o formato é inválido.
 */
export function normalizeBrazilianPhone(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  if (digits.length !== 10 && digits.length !== 11) return null;
  const ddd = digits.slice(0, 2);
  if (!/^[1-9][1-9]$/.test(ddd)) return null;
  // Celulares têm 11 dígitos e começam com 9 após o DDD.
  if (digits.length === 11 && digits[2] !== "9") return null;
  // Fixos têm 10 dígitos e começam com 2 a 5 após o DDD.
  if (digits.length === 10 && !/[2-5]/.test(digits[2])) return null;
  return digits;
}

export function formatBrazilianPhone(digits: string): string {
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return digits;
}

const requiredText = (message: string) => z.string({ error: message });

export const bookingSchema = z
  .strictObject({
    name: requiredText("Informe seu nome.")
      .max(LIMITS.nameMax * 2, { error: "Nome muito longo." })
      .transform(normalizeLine)
      .pipe(
        z
          .string()
          .min(LIMITS.nameMin, { error: "Informe seu nome." })
          .max(LIMITS.nameMax, { error: `Use até ${LIMITS.nameMax} caracteres.` })
          .regex(/^[\p{L}\p{M}' .-]+$/u, { error: "Use apenas letras no nome." })
          .regex(/\p{L}/u, { error: "Informe seu nome." }),
      ),
    phone: requiredText("Informe um telefone para contato.")
      .max(40, { error: "Telefone inválido." })
      .transform((value, ctx) => {
        const normalized = normalizeBrazilianPhone(value);
        if (!normalized) {
          ctx.addIssue({ code: "custom", message: "Informe um telefone com DDD, por exemplo (11) 91234-5678." });
          return z.NEVER;
        }
        return normalized;
      }),
    email: z
      .string({ error: "E-mail inválido." })
      .max(LIMITS.emailMax, { error: "E-mail muito longo." })
      .transform((value) => normalizeLine(value).toLowerCase())
      .pipe(z.union([z.literal(""), z.email({ error: "Informe um e-mail válido." })]))
      .optional()
      .default(""),
    contactPreference: z.enum(CONTACT_PREFERENCES, { error: "Escolha como prefere ser contatado." }),
    period: z.enum(PERIODS, { error: "Escolha um período." }),
    topic: z
      .union([z.literal(""), z.enum(TOPICS, { error: "Assunto inválido." })])
      .optional()
      .default(""),
    message: z
      .string({ error: "Mensagem inválida." })
      .max(LIMITS.messageMax * 2, { error: `Use até ${LIMITS.messageMax} caracteres.` })
      .transform(normalizeMultiline)
      .pipe(
        z
          .string()
          .max(LIMITS.messageMax, { error: `Use até ${LIMITS.messageMax} caracteres.` })
          .refine((value) => !containsLink(value), { error: "Por segurança, não inclua links na mensagem." }),
      )
      .optional()
      .default(""),
    consent: z.literal(true, { error: "Confirme a leitura do aviso de privacidade para continuar." }),
    [HONEYPOT_FIELD]: z.string().max(200).optional(),
    turnstileToken: z.string().max(2048).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.contactPreference === "email" && !data.email) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Informe um e-mail para receber o retorno por e-mail.",
      });
    }
  });

/** Dados como saem do formulário (antes da normalização). */
export type BookingInput = z.input<typeof bookingSchema>;
/** Dados validados e normalizados (o que o servidor entrega). */
export type BookingData = z.output<typeof bookingSchema>;

export type BookingField =
  | "name"
  | "phone"
  | "email"
  | "contactPreference"
  | "period"
  | "topic"
  | "message"
  | "consent";

export type FieldErrors = Partial<Record<BookingField, string>>;

/** Converte o erro do Zod em uma mensagem por campo (a primeira de cada). */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const result: FieldErrors = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.length && isBookingField(key)) result[key] = messages[0];
  }
  return result;
}

const FIELDS: readonly BookingField[] = [
  "name",
  "phone",
  "email",
  "contactPreference",
  "period",
  "topic",
  "message",
  "consent",
];

function isBookingField(key: string): key is BookingField {
  return (FIELDS as readonly string[]).includes(key);
}

/** Respostas da API, compartilhadas com o formulário. */
export type BookingApiResponse =
  | { ok: true }
  | {
      ok: false;
      code:
        | "invalid"
        | "invalid_request"
        | "forbidden"
        | "rate_limited"
        | "verification_failed"
        | "unavailable"
        | "delivery_failed"
        | "error";
      fieldErrors?: FieldErrors;
      retryAfter?: number;
    };
