import { address, brand, contact, maps, openingHours, siteUrl } from "@/config/site";

/**
 * Dados estruturados (schema.org/Dentist) para o Google entender a clínica
 * como negócio local.
 *
 * De propósito NÃO inclui:
 * - nota e avaliações (aggregateRating): o Google não aceita avaliações de
 *   terceiros marcadas pelo próprio negócio;
 * - horários de funcionamento, enquanto não forem confirmados por completo.
 */
export function JsonLd({ nonce }: { nonce?: string }) {
  const base = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": new URL("/#clinica", base).href,
    name: brand.fullName,
    alternateName: brand.name,
    description: brand.description,
    url: base.href,
    image: new URL("/opengraph-image", base).href,
    telephone: "+55 11 97655-6438",
    address: {
      "@type": "PostalAddress",
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    areaServed: [
      { "@type": "Place", name: `${address.district}, ${address.city}` },
      { "@type": "Place", name: `${address.region} de ${address.city}` },
    ],
    hasMap: maps.placeUrl,
    ...(contact.instagramUrl ? { sameAs: [contact.instagramUrl] } : {}),
    ...(openingHours ? { openingHours: openingHours.map((entry) => `${entry.days} ${entry.hours}`) } : {}),
  };
  // JSON.stringify não escapa "<": sem a troca, um "</script>" no conteúdo fecharia a tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: json }} />;
}
