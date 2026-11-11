import type { MetadataRoute } from "next";
import { brand } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.fullName,
    short_name: brand.name,
    description: brand.description,
    lang: "pt-BR",
    start_url: "/",
    display: "browser",
    background_color: "#fafcfb",
    theme_color: "#2cb7ab",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
