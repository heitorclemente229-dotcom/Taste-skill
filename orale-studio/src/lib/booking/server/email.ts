import "server-only";
import {
  CONTACT_PREFERENCE_LABELS,
  PERIOD_LABELS,
  TOPIC_LABELS,
  formatBrazilianPhone,
  type BookingData,
} from "@/lib/booking/schema";
import { brand } from "@/config/site";
import { PRIVACY_NOTICE_VERSION } from "./webhook";

/**
 * Conteúdo do e-mail de aviso para a clínica.
 *
 * Todo valor vindo do visitante é escapado no HTML. O destinatário vem
 * somente do ambiente do servidor; o visitante nunca escolhe para quem vai.
 */

export const EMAIL_SUBJECT = "Nova solicitação de agendamento";
const TIME_ZONE = "America/Sao_Paulo";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Remove quebras de linha e caracteres de controle (evita injeção de cabeçalho). */
export function stripHeaderBreaks(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim();
}

export function buildSubject(data: Pick<BookingData, "name">): string {
  const firstName = stripHeaderBreaks(data.name).split(" ")[0]?.slice(0, 40) ?? "";
  return firstName ? `${EMAIL_SUBJECT}: ${firstName}` : EMAIL_SUBJECT;
}

/** Data e hora no fuso de Brasília, por exemplo "14/10/2026 às 15:30". */
export function formatReceivedAt(date: Date): string {
  const day = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day} às ${time} (horário de Brasília)`;
}

type Row = { label: string; value: string; multiline?: boolean };

function rows(data: BookingData, receivedAt: Date): Row[] {
  return [
    { label: "Nome", value: data.name },
    { label: "Telefone", value: formatBrazilianPhone(data.phone) },
    { label: "E-mail", value: data.email || "Não informado" },
    { label: "Prefere contato por", value: CONTACT_PREFERENCE_LABELS[data.contactPreference] },
    { label: "Período preferido", value: PERIOD_LABELS[data.period] },
    { label: "Assunto", value: data.topic ? TOPIC_LABELS[data.topic] : "Não informado" },
    { label: "Mensagem", value: data.message || "Sem mensagem", multiline: true },
    { label: "Recebido em", value: formatReceivedAt(receivedAt) },
    { label: "Aviso de privacidade", value: `Aceito (versão ${PRIVACY_NOTICE_VERSION})` },
  ];
}

const FOOTER =
  "Esta mensagem contém dados pessoais (LGPD). Use-os apenas para retornar o contato e não encaminhe sem necessidade.";

export function buildText(data: BookingData, receivedAt: Date): string {
  const lines = rows(data, receivedAt).map((row) =>
    row.multiline ? `${row.label}:\n${row.value}` : `${row.label}: ${row.value}`,
  );
  return [`${EMAIL_SUBJECT} pelo site ${brand.fullName}.`, "", ...lines, "", FOOTER].join("\n");
}

export function buildHtml(data: BookingData, receivedAt: Date): string {
  const cell = "padding:8px 12px;border-bottom:1px solid #e5e5e5;vertical-align:top;text-align:left;";
  const body = rows(data, receivedAt)
    .map((row) => {
      const value = escapeHtml(row.value);
      const content = row.multiline ? value.replace(/\n/g, "<br>") : value;
      return `<tr><th scope="row" style="${cell}font-weight:600;white-space:nowrap;">${escapeHtml(row.label)}</th><td style="${cell}">${content}</td></tr>`;
    })
    .join("");
  return [
    "<!doctype html>",
    '<html lang="pt-BR"><head><meta charset="utf-8"><title>',
    escapeHtml(EMAIL_SUBJECT),
    '</title></head><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;background:#ffffff;">',
    `<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(EMAIL_SUBJECT)} pelo site ${escapeHtml(brand.fullName)}.</p>`,
    `<table role="presentation" style="border-collapse:collapse;font-size:14px;line-height:1.5;">${body}</table>`,
    `<p style="margin:16px 0 0;font-size:12px;color:#555555;">${escapeHtml(FOOTER)}</p>`,
    "</body></html>",
  ].join("");
}

export type ResendPayload = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  reply_to?: string;
};

export function buildResendPayload(
  config: { from: string; to: string },
  data: BookingData,
  receivedAt: Date,
): ResendPayload {
  const payload: ResendPayload = {
    from: config.from,
    to: [config.to],
    subject: buildSubject(data),
    text: buildText(data, receivedAt),
    html: buildHtml(data, receivedAt),
  };
  // Responder vai direto para a pessoa, somente se ela informou um e-mail (já validado).
  if (data.email) payload.reply_to = data.email;
  return payload;
}
