import type { PhotoKey } from "@/content/photos";

/**
 * Textos da página inicial. Tudo que descreve a clínica (ambiente, equipe,
 * depoimentos) deve ser validado com a clínica antes da publicação.
 */

export const hero = {
  titleLines: ["Sorrir,", "naturalmente."],
  lead: "Odontologia contemporânea, planejada para você.",
  secondary: { label: "Conheça a clínica", href: "#manifesto" },
  /** Marcadores editoriais da base da primeira dobra. */
  markers: ["Escuta atenta", "Planejamento individual", "Acompanhamento contínuo"],
} as const;

export const manifesto = {
  title: "Além do sorriso",
  statement:
    "Cuidar de um sorriso é cuidar de quem sorri. Cada tratamento começa com escuta e segue com acompanhamento. Precisão técnica, tempo para conversar e respeito ao que é natural em você.",
} as const;

export const experience = {
  title: ["Um novo", "olhar"],
  lead: "Um espaço pensado para que cada etapa seja clara, confortável e sem pressa.",
  items: [
    {
      key: "ambiente",
      title: "Ambiente",
      text: "Luz suave, silêncio e privacidade durante todo o atendimento.",
      photo: "interior" as PhotoKey,
    },
    {
      key: "precisao",
      title: "Precisão",
      text: "Diagnóstico e planejamento apoiados em exames e registros detalhados.",
      photo: "detail" as PhotoKey,
    },
    {
      key: "acolhimento",
      title: "Acolhimento",
      text: "Tempo para ouvir, explicar cada opção e decidir junto com você.",
      photo: "care" as PhotoKey,
    },
  ],
} as const;

/**
 * Equipe: PERFIS DEMONSTRATIVOS. Não publique nomes, especialidades ou
 * registros que não tenham sido fornecidos e conferidos pela clínica.
 */
export const team = {
  title: "Quem cuida",
  lead: "Profissionais que acompanham você do primeiro contato ao pós-tratamento.",
  isPlaceholder: true,
  members: [
    { name: "[Nome da profissional]", role: "[Especialidade]", registry: "CRO-UF 00000", photo: "team1" as PhotoKey },
    { name: "[Nome do profissional]", role: "[Especialidade]", registry: "CRO-UF 00000", photo: "team2" as PhotoKey },
    { name: "[Nome da profissional]", role: "[Especialidade]", registry: "CRO-UF 00000", photo: "team3" as PhotoKey },
  ],
} as const;

export const process = {
  title: "Como funciona",
  steps: [
    {
      title: "Primeiro contato",
      text: "Você envia uma solicitação ou fala conosco. Retornamos para entender o que procura e combinar a consulta.",
    },
    {
      title: "Avaliação",
      text: "Exame clínico completo e uma conversa sobre histórico, expectativas e dúvidas.",
    },
    {
      title: "Planejamento",
      text: "Apresentamos as opções de tratamento, as etapas, os prazos e o investimento, com clareza.",
    },
    {
      title: "Acompanhamento",
      text: "Revisões periódicas para cuidar da sua saúde bucal ao longo do tempo.",
    },
  ],
} as const;

/**
 * Depoimentos: ESPAÇOS DEMONSTRATIVOS. Substitua apenas por relatos reais,
 * com autorização por escrito do paciente. Não invente nomes nem resultados.
 */
export const testimonials = {
  title: "Histórias reais",
  isPlaceholder: true,
  items: [
    {
      quote: "Espaço reservado para o relato de um paciente, publicado somente com autorização por escrito.",
      author: "[Nome do paciente]",
      context: "[Tratamento realizado]",
    },
    {
      quote: "Use até três linhas por depoimento, sem promessas de resultado e conforme as normas do CFO.",
      author: "[Nome do paciente]",
      context: "[Tratamento realizado]",
    },
    {
      quote: "Avaliações públicas, como as do Google, podem aparecer aqui com o consentimento de quem as escreveu.",
      author: "[Nome do paciente]",
      context: "[Tratamento realizado]",
    },
  ],
} as const;

export const finalCta = {
  title: "Vamos conversar",
  text: "Conte o que você procura. Retornamos para combinar o melhor horário.",
} as const;

export const footer = {
  title: "Estamos por perto",
} as const;
