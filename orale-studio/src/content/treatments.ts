import type { PhotoKey } from "@/content/photos";

/**
 * Tratamentos exibidos na landing e nas páginas de detalhe.
 * Textos institucionais de base: revisar com o responsável técnico antes de
 * publicar (publicidade odontológica não pode prometer resultados).
 */
export type Treatment = {
  slug: string;
  title: string;
  /** Título curto para a landing (pode quebrar em duas linhas). */
  shortTitle: string;
  summary: string;
  photo: PhotoKey;
};

export const treatments: Treatment[] = [
  {
    slug: "ortodontia",
    title: "Ortodontia",
    shortTitle: "Ortodontia",
    summary: "Alinhamento dos dentes e ajuste da mordida, com a técnica indicada para o seu caso.",
    photo: "orthodontics",
  },
  {
    slug: "clareamento-dental",
    title: "Clareamento dental",
    shortTitle: "Clareamento",
    summary: "Clareamento supervisionado, com protocolo definido após avaliação do esmalte e da sensibilidade.",
    photo: "whitening",
  },
  {
    slug: "implantes",
    title: "Implantes",
    shortTitle: "Implantes",
    summary: "Reposição de dentes perdidos com planejamento cuidadoso, da avaliação inicial à prótese final.",
    photo: "implants",
  },
  {
    slug: "estetica-odontologica",
    title: "Estética odontológica",
    shortTitle: "Estética",
    summary: "Ajustes de forma, cor e proporção para um sorriso harmônico, que respeita os seus traços.",
    photo: "aesthetics",
  },
  {
    slug: "prevencao-e-limpeza",
    title: "Prevenção e limpeza",
    shortTitle: "Prevenção",
    summary: "Consultas periódicas, limpeza profissional e orientação para manter a saúde bucal em dia.",
    photo: "prevention",
  },
  {
    slug: "tratamentos-restauradores",
    title: "Tratamentos restauradores",
    shortTitle: "Restauração",
    summary: "Recuperação de dentes desgastados, fraturados ou com cárie, preservando a estrutura natural.",
    photo: "restorative",
  },
];

export function getTreatment(slug: string): Treatment | undefined {
  return treatments.find((treatment) => treatment.slug === slug);
}
