import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

// Gerado a cada requisição: o domínio vem de SITE_URL no ambiente de execução,
// e não do que estava definido no momento do build.
export const dynamic = "force-dynamic";
import { treatments } from "@/content/treatments";

/**
 * Sitemap. As páginas de tratamento só entram depois de confirmadas pela
 * clínica (`confirmed: true` em src/content/treatments.ts).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const url = (path: string) => new URL(path, base).href;
  return [
    { url: url("/"), changeFrequency: "monthly", priority: 1 },
    ...treatments
      .filter((treatment) => treatment.confirmed)
      .map((treatment) => ({ url: url(`/tratamentos/${treatment.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: url("/privacidade"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
