import type { MetadataRoute } from "next";
import { brand } from "@/config/site";

// Manifesto mínimo: nome, cores da marca e ícones gerados por `npm run icons`.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.fullName,
    short_name: brand.name,
    description: brand.description,
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: "#f8f9fb",
    theme_color: "#f8f9fb",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/favicon.ico", sizes: "16x16 32x32", type: "image/x-icon" },
    ],
  };
}
