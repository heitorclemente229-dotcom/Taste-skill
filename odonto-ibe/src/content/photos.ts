import type { StaticImageData } from "next/image";
import hero from "@/assets/photos/hero.jpg";
import clinicaAtendimento from "@/assets/photos/clinica-atendimento.jpg";
import clinicaAmbiente from "@/assets/photos/clinica-ambiente.jpg";
import clinicaEstrutura from "@/assets/photos/clinica-estrutura.jpg";
import galeriaConsulta from "@/assets/photos/galeria-consulta.jpg";
import galeriaSorriso from "@/assets/photos/galeria-sorriso.jpg";
import galeriaConversa from "@/assets/photos/galeria-conversa.jpg";
import galeriaConsultorio from "@/assets/photos/galeria-consultorio.jpg";
import prevencao from "@/assets/photos/tratamento-prevencao.jpg";
import restauracoes from "@/assets/photos/tratamento-restauracoes.jpg";
import clareamento from "@/assets/photos/tratamento-clareamento.jpg";
import ortodontia from "@/assets/photos/tratamento-ortodontia.jpg";
import canal from "@/assets/photos/tratamento-canal.jpg";
import proteses from "@/assets/photos/tratamento-proteses.jpg";

/**
 * Fotografias do site.
 *
 * TODAS as fotos atuais são provisórias (banco de imagens, ver
 * src/assets/photos/CREDITS.md) e não mostram a Odonto Ibe. Para trocar por
 * uma foto real: substitua o arquivo em src/assets/photos mantendo o nome,
 * ajuste o texto alternativo aqui e mude `provisional` para `false`.
 */
export type Photo = {
  src: StaticImageData;
  /** Descrição para leitores de tela e buscadores. */
  alt: string;
  /** true enquanto a foto não for da própria clínica. */
  provisional: boolean;
};

const photo = (src: StaticImageData, alt: string): Photo => ({ src, alt, provisional: true });

export const photos = {
  hero: photo(hero, "Paciente sorrindo na cadeira do consultório odontológico"),
  clinicaAtendimento: photo(clinicaAtendimento, "Dentista conversando com uma paciente sorridente antes do atendimento"),
  clinicaAmbiente: photo(clinicaAmbiente, "Consultório odontológico claro e organizado, visto do corredor"),
  clinicaEstrutura: photo(clinicaEstrutura, "Equipamentos e instrumentos preparados sobre a bandeja do consultório"),
  galeriaConsulta: photo(galeriaConsulta, "Dentista atendendo uma paciente no consultório"),
  galeriaSorriso: photo(galeriaSorriso, "Paciente sorrindo com um espelho na mão depois do atendimento"),
  galeriaConversa: photo(galeriaConversa, "Dentista e paciente rindo durante a conversa no consultório"),
  galeriaConsultorio: photo(galeriaConsultorio, "Dentista em atendimento, com os equipamentos do consultório em primeiro plano"),
  prevencao: photo(prevencao, "Dentista examinando uma paciente durante a consulta de rotina"),
  restauracoes: photo(restauracoes, "Aplicação de luz azul sobre uma restauração durante o atendimento"),
  clareamento: photo(clareamento, "Dentista comparando a cor dos dentes de uma paciente com uma escala de tons"),
  ortodontia: photo(ortodontia, "Dentista mostrando um modelo da arcada dentária para uma paciente"),
  canal: photo(canal, "Dentista usando um microscópio durante o atendimento"),
  proteses: photo(proteses, "Dentista e paciente sorrindo enquanto observam um modelo odontológico"),
} as const;

/** Galeria da seção "A clínica". Adicione, remova ou reordene à vontade. */
export const gallery: ReadonlyArray<{ photo: Photo; caption: string }> = [
  { photo: photos.clinicaAmbiente, caption: "Ambiente" },
  { photo: photos.galeriaConsulta, caption: "Atendimento" },
  { photo: photos.clinicaEstrutura, caption: "Estrutura" },
  { photo: photos.galeriaSorriso, caption: "Depois da consulta" },
  { photo: photos.galeriaConsultorio, caption: "Consultório" },
  { photo: photos.galeriaConversa, caption: "Conversa antes do cuidado" },
];
