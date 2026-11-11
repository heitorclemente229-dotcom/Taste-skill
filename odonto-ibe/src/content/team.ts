import type { Photo } from "./photos";

/**
 * Equipe da clínica.
 *
 * A lista começa VAZIA de propósito: o site não inventa nomes, funções nem
 * especialidades. Enquanto estiver vazia, a seção mostra molduras provisórias
 * claramente identificadas.
 *
 * Para publicar um perfil, adicione um item como este (a foto precisa de
 * autorização de uso de imagem da pessoa retratada):
 *
 *   {
 *     name: "Nome completo",
 *     role: "Cirurgiã-dentista",
 *     specialty: "Ortodontia",        // opcional
 *     registration: "CRO-SP 00000",   // opcional, recomendado
 *     photo: { src: fotoImportada, alt: "Retrato de Nome completo", provisional: false },
 *   }
 */
export type TeamMember = {
  name: string;
  role: string;
  specialty?: string;
  registration?: string;
  photo?: Photo;
};

export const team: readonly TeamMember[] = [];

/** Quantas molduras provisórias aparecem enquanto a lista estiver vazia. */
export const teamPlaceholderCount = 3;
