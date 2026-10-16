/**
 * Configuração central da marca e da clínica.
 *
 * Tudo que é dado real da clínica fica aqui, em um único lugar.
 * Os valores entre colchetes ou com zeros (00000) são PLACEHOLDERS
 * demonstrativos e precisam ser substituídos antes da publicação.
 * Execute `npm run check:content` para listar os que ainda restam.
 */

export const brand = {
  /** Nome provisório. Troque aqui para renomear o site inteiro. */
  name: "ORALÉ",
  descriptor: "studio",
  /** Nome completo usado em títulos, metadados e rodapé. */
  fullName: "ORALÉ STUDIO",
  tagline: "Odontologia contemporânea, planejada para você.",
  description:
    "Clínica de odontologia contemporânea. Ortodontia, clareamento, implantes, estética, prevenção e tratamentos restauradores com planejamento individual.",
} as const;

export const contact = {
  /** true enquanto os dados abaixo forem demonstrativos. */
  isPlaceholder: true,
  phone: { display: "(00) 0000-0000", href: "tel:+550000000000" },
  whatsapp: {
    display: "(00) 00000-0000",
    /** Formato oficial de link do WhatsApp: https://wa.me/<DDI><DDD><número> */
    href: "https://wa.me/5500000000000",
  },
  email: "contato@seudominio.com.br",
  /** Canal do encarregado de dados (LGPD). */
  privacyEmail: "privacidade@seudominio.com.br",
  address: {
    street: "Rua Exemplo, 000, sala 00",
    district: "Bairro",
    city: "Cidade",
    state: "UF",
    postalCode: "00000-000",
    /** Link externo para rotas. Não usamos mapa incorporado (evita rastreamento de terceiros). */
    mapsHref: "https://www.google.com/maps/search/?api=1&query=Rua+Exemplo+000",
  },
  hours: [
    { days: "Segunda a sexta", time: "8h às 19h" },
    { days: "Sábado", time: "8h às 12h" },
  ],
  social: [
    { label: "Instagram", href: "https://www.instagram.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
  ],
} as const;

/**
 * Identificação profissional exigida na publicidade odontológica.
 * Validar com o responsável técnico e com o CRO da sua região.
 */
export const legal = {
  isPlaceholder: true,
  companyName: "[Razão social da clínica]",
  cnpj: "00.000.000/0000-00",
  technicalLead: { name: "[Nome do responsável técnico]", registry: "CRO-UF 00000" },
  clinicRegistry: "CRO-UF EPAO 0000",
} as const;

export const navigation = [
  { label: "Tratamentos", href: "/#tratamentos", id: "tratamentos" },
  { label: "Clínica", href: "/#clinica", id: "clinica" },
  { label: "Equipe", href: "/#equipe", id: "equipe" },
  { label: "Contato", href: "/#contato", id: "contato" },
] as const;

export const booking = {
  /** Rótulo único para a intenção de agendar, usado em todo o site. */
  ctaLabel: "Agendar consulta",
  /** Página de agendamento (funciona sem JavaScript e como link direto). */
  href: "/agendar",
  /**
   * Link oficial de um sistema de reservas externo, se a clínica usar um.
   * Quando definido, aparece como alternativa ao formulário de solicitação.
   */
  externalUrl: process.env.NEXT_PUBLIC_BOOKING_URL || null,
} as const;

export function siteUrl(): URL {
  const raw = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function formatAddress(): string {
  const a = contact.address;
  return `${a.street}, ${a.district}, ${a.city}/${a.state}, ${a.postalCode}`;
}
