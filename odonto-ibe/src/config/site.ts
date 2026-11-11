/**
 * Dados institucionais da Odonto Ibe. Fonte única para cabeçalho, rodapé,
 * contato, SEO e dados estruturados.
 *
 * Tudo aqui veio do briefing e da referência do perfil da clínica no Google.
 * O que ainda não foi confirmado fica como `null` e o site mostra um aviso de
 * "a confirmar" no lugar (nunca um dado inventado).
 */

export const brand = {
  name: "Odonto Ibe",
  descriptor: "Odontologia Integrada",
  fullName: "Odonto Ibe Odontologia Integrada",
  description:
    "Clínica de odontologia integrada no Jardim São Luís, Zona Leste de São Paulo. Atendimento humanizado e cuidado em cada detalhe. Agende sua avaliação pelo WhatsApp.",
} as const;

export const contact = {
  /** Número do WhatsApp no formato internacional, só dígitos. */
  whatsappNumber: "5511976556438",
  whatsappMessage: "Olá! Conheci a Odonto Ibe pelo site e gostaria de saber mais sobre os atendimentos.",
  phoneDisplay: "(11) 97655-6438",
  phoneHref: "tel:+5511976556438",
  /** Perfil oficial do Instagram. Preencha com a URL completa para exibir o link. */
  instagramUrl: null as string | null,
  /** E-mail público de contato. Preencha para exibir no rodapé. */
  email: null as string | null,
} as const;

export const address = {
  street: "Rua Manuel Bueno da Fonseca, 131",
  district: "Jardim São Luís",
  region: "Zona Leste",
  city: "São Paulo",
  state: "SP",
  postalCode: "08121-000",
  country: "BR",
} as const;

/** Endereço em uma linha, usado em links do mapa e nos dados estruturados. */
export const addressLine = `${address.street} - ${address.district}, ${address.city} - ${address.state}, ${address.postalCode}`;

const mapsQuery = encodeURIComponent(`${brand.name}, ${addressLine}`);

export const maps = {
  /** Abre a rota até a clínica no Google Maps (API oficial de URLs do Maps). */
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`,
  /**
   * Abre o perfil da clínica no Google Maps, onde ficam as avaliações.
   * Quando a clínica informar o link curto oficial do perfil, troque aqui.
   */
  placeUrl: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
  /** Mapa incorporado (só é carregado depois que a pessoa pede para ver). */
  embedUrl: `https://www.google.com/maps?q=${mapsQuery}&z=16&hl=pt-BR&output=embed`,
} as const;

/**
 * Horários de funcionamento. O briefing pede que só apareçam depois de
 * confirmados por completo. Para publicar, troque `null` por uma lista como:
 * [{ days: "Segunda a sexta", hours: "9h às 19h" }, { days: "Sábado", hours: "9h às 13h" }]
 */
export const openingHours = null as ReadonlyArray<{ days: string; hours: string }> | null;

/** Nota e total de avaliações do perfil no Google, conforme a referência enviada. */
export const googleRating = {
  value: 4.9,
  count: 124,
} as const;

/**
 * Avisos de conteúdo provisório. Enquanto `true`, o site sinaliza fotos,
 * tratamentos e perfis que aguardam confirmação da clínica. Mude para `false`
 * somente quando todo o conteúdo provisório tiver sido substituído.
 */
export const showDraftNotes = true;

export const navigation = [
  { id: "inicio", label: "Início" },
  { id: "clinica", label: "A clínica" },
  { id: "tratamentos", label: "Tratamentos" },
  { id: "equipe", label: "Nossa equipe" },
  { id: "avaliacoes", label: "Avaliações" },
  { id: "contato", label: "Contato" },
] as const;

export type SectionId = (typeof navigation)[number]["id"];

/**
 * Endereço público do site (metadados, sitemap e dados estruturados).
 *
 * Ordem: SITE_URL (o domínio definitivo), depois o endereço que a Vercel
 * informa sozinha em cada publicação e, por fim, o endereço local.
 */
export function siteUrl(): URL {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const raw =
    process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") return new URL(url.origin);
  } catch {
    // Valor inválido: usa o endereço local.
  }
  return new URL("http://localhost:3000");
}
