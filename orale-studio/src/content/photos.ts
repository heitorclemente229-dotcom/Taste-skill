import type { StaticImageData } from "next/image";

import heroSmile from "@/assets/photos/hero-smile.jpg";
import heroDetail from "@/assets/photos/hero-detail.jpg";
import orthodontics from "@/assets/photos/orthodontics.jpg";
import whitening from "@/assets/photos/whitening.jpg";
import implants from "@/assets/photos/implants.jpg";
import aesthetics from "@/assets/photos/aesthetics.jpg";
import prevention from "@/assets/photos/prevention.jpg";
import restorative from "@/assets/photos/restorative.jpg";
import interior from "@/assets/photos/interior.jpg";
import detail from "@/assets/photos/detail.jpg";
import care from "@/assets/photos/care.jpg";
import team1 from "@/assets/photos/team-1.jpg";
import team2 from "@/assets/photos/team-2.jpg";
import team3 from "@/assets/photos/team-3.jpg";

/**
 * Registro central de fotografias. Para trocar uma foto, substitua o arquivo
 * em src/assets/photos/ (mesmo nome) ou altere o import aqui.
 *
 * Fotos provisórias de banco de imagens sob a Licença Unsplash (uso comercial
 * permitido, sem necessidade de atribuição). Créditos e origem em
 * src/assets/photos/CREDITS.md. Recomenda-se substituí-las por fotografia
 * própria da clínica, com autorização de uso de imagem das pessoas retratadas.
 */
export type Photo = {
  src: StaticImageData;
  alt: string;
  /** Ponto focal (CSS object-position). */
  position?: string;
};

export const photos = {
  heroSmile: { src: heroSmile, alt: "", position: "50% 40%" },
  heroDetail: { src: heroDetail, alt: "", position: "50% 50%" },
  orthodontics: { src: orthodontics, alt: "", position: "50% 50%" },
  whitening: { src: whitening, alt: "", position: "50% 50%" },
  implants: { src: implants, alt: "", position: "50% 50%" },
  aesthetics: { src: aesthetics, alt: "", position: "50% 50%" },
  prevention: { src: prevention, alt: "", position: "50% 50%" },
  restorative: { src: restorative, alt: "", position: "50% 50%" },
  interior: { src: interior, alt: "", position: "50% 50%" },
  detail: { src: detail, alt: "", position: "50% 50%" },
  care: { src: care, alt: "", position: "50% 50%" },
  team1: { src: team1, alt: "", position: "50% 30%" },
  team2: { src: team2, alt: "", position: "50% 30%" },
  team3: { src: team3, alt: "", position: "50% 30%" },
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;
