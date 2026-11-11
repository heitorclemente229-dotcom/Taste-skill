import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

// Gerado a cada requisição: o domínio vem de SITE_URL no ambiente de execução,
// e não do que estava definido no momento do build.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  // Pré-visualizações na Vercel não devem aparecer no Google.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: new URL("/sitemap.xml", base).href,
    host: base.origin,
  };
}
