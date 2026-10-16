import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

// Todo o site pode ser rastreado; o endereço do sitemap usa o domínio configurado.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
