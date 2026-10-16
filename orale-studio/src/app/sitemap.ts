import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { treatments } from "@/content/treatments";

/**
 * Páginas públicas indexáveis. Sem `lastModified`: uma data inventada
 * atrapalha mais do que ajuda os buscadores.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const url = (path: string) => new URL(path, base).href;

  return [
    { url: url("/"), changeFrequency: "monthly", priority: 1 },
    { url: url("/agendar"), changeFrequency: "yearly", priority: 0.8 },
    ...treatments.map((treatment) => ({
      url: url(`/tratamentos/${treatment.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    { url: url("/privacidade"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
