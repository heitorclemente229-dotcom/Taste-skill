import { headers } from "next/headers";
import { brand, contact, legal, siteUrl } from "@/config/site";

/**
 * Dados estruturados da clínica (schema.org "Dentist") em JSON-LD.
 *
 * Não renderiza nada enquanto os dados de contato ou de identificação legal
 * forem demonstrativos: dados estruturados falsos nunca devem ser publicados.
 */
export async function DentistJsonLd() {
  const isPlaceholder: boolean = contact.isPlaceholder || legal.isPlaceholder;
  if (isPlaceholder) return null;

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const base = siteUrl();
  const a = contact.address;
  const openingHours = openingHoursSpecification();
  const sameAs = contact.social.map((item) => item.href).filter(isProfileUrl);

  const data = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": new URL("/#clinica", base).href,
    name: brand.fullName,
    legalName: legal.companyName,
    description: brand.description,
    url: base.href,
    image: new URL("/opengraph-image", base).href,
    telephone: contact.phone.href.replace(/^tel:/, ""),
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${a.street}, ${a.district}`,
      addressLocality: a.city,
      addressRegion: a.state,
      postalCode: a.postalCode,
      addressCountry: "BR",
    },
    hasMap: a.mapsHref,
    ...(openingHours ? { openingHoursSpecification: openingHours } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // JSON serializado com "<" escapado: impede o fechamento da tag por conteúdo injetado.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Perfis reais (com caminho); o domínio raiz da rede social não identifica a clínica. */
function isProfileUrl(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "https:" && url.pathname.replace(/\/+$/, "") !== "";
  } catch {
    return false;
  }
}

const DAYS: Record<string, string> = {
  segunda: "Monday",
  terca: "Tuesday",
  quarta: "Wednesday",
  quinta: "Thursday",
  sexta: "Friday",
  sabado: "Saturday",
  domingo: "Sunday",
};
const WEEK = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

/**
 * Converte os horários de texto livre ("Segunda a sexta", "8h às 19h") em
 * OpeningHoursSpecification. Se alguma linha não for reconhecida, omite o
 * campo inteiro em vez de publicar um horário errado.
 */
function openingHoursSpecification() {
  const result = [];
  for (const slot of contact.hours) {
    const days = parseDays(slot.days);
    const time = parseTime(slot.time);
    if (!days || !time) return null;
    result.push({ "@type": "OpeningHoursSpecification", dayOfWeek: days, opens: time.opens, closes: time.closes });
  }
  return result.length ? result : null;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/-feira/g, "")
    .trim();
}

function parseDays(value: string): string[] | null {
  const text = normalize(value);
  const range = text.match(/^(\p{L}+) a (\p{L}+)$/u);
  if (range) {
    const start = WEEK.indexOf(range[1]);
    const end = WEEK.indexOf(range[2]);
    if (start < 0 || end < start) return null;
    return WEEK.slice(start, end + 1).map((day) => DAYS[day]);
  }
  const list = text.split(/\s*(?:,|\be\b)\s*/).filter(Boolean);
  if (!list.length || list.some((day) => !DAYS[day])) return null;
  return list.map((day) => DAYS[day]);
}

function parseTime(value: string): { opens: string; closes: string } | null {
  const match = normalize(value).match(/^(\d{1,2})h(\d{2})?\s*(?:as|a|-)\s*(\d{1,2})h(\d{2})?$/);
  if (!match) return null;
  const hhmm = (hours: string, minutes?: string) => `${hours.padStart(2, "0")}:${minutes ?? "00"}`;
  return { opens: hhmm(match[1], match[2]), closes: hhmm(match[3], match[4]) };
}
