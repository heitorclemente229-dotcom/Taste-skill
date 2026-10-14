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
  heroSmile: { src: heroSmile, alt: "Mulher de cabelos castanhos sorrindo para a câmera, de blazer branco, diante de um fundo cinza-claro.", position: "50% 15%" },
  heroDetail: { src: heroDetail, alt: "Espelho clínico em primeiro plano, com a cadeira e o refletor do consultório desfocados ao fundo.", position: "50% 50%" },
  orthodontics: { src: orthodontics, alt: "Alinhador ortodôntico transparente sobre uma superfície branca.", position: "50% 55%" },
  whitening: { src: whitening, alt: "Detalhe de um sorriso de perfil, com dentes brancos e lábios rosados, sobre fundo branco.", position: "90% 50%" },
  implants: { src: implants, alt: "Mão com luva segurando um modelo de implante dentário com coroa, com o consultório desfocado ao fundo.", position: "50% 35%" },
  aesthetics: { src: aesthetics, alt: "Mulher de cabelos castanhos olhando para baixo, com um sorriso largo de dentes claros e alinhados.", position: "50% 18%" },
  prevention: { src: prevention, alt: "Escova de dentes de cabo verde-escuro e cerdas brancas sobre uma superfície cinza-clara.", position: "92% 50%" },
  restorative: { src: restorative, alt: "Dentista de touca, máscara e lupas de aumento atende um paciente sob a luz do refletor.", position: "50% 30%" },
  interior: { src: interior, alt: "Consultório claro com cadeira odontológica branca e cinza, refletor e janela ao fundo.", position: "50% 70%" },
  detail: { src: detail, alt: "Mão com luva azul sobre instrumentos odontológicos de aço alinhados em uma superfície branca.", position: "50% 42%" },
  care: { src: care, alt: "Dentista de camisa branca mostra um modelo dental a uma paciente sentada na cadeira odontológica.", position: "50% 50%" },
  team1: { src: team1, alt: "Foto ilustrativa: mulher de cabelos escuros ondulados, sorrindo, de jaleco branco e braços cruzados, diante de fundo claro.", position: "50% 30%" },
  team2: { src: team2, alt: "Foto ilustrativa: homem de barba, sorrindo, de jaleco branco e mãos unidas à frente do corpo, diante de fundo claro.", position: "50% 30%" },
  team3: { src: team3, alt: "Foto ilustrativa: mulher de cabelos escuros longos e lisos, de jaleco branco e braços cruzados, diante de fundo claro.", position: "50% 30%" },
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;
