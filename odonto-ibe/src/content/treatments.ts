import { photos, type Photo } from "./photos";

/**
 * Tratamentos exibidos no site.
 *
 * Para ADICIONAR um tratamento: copie um bloco, troque `slug` (endereço da
 * página, só letras minúsculas e hífens), os textos e a foto.
 * Para REMOVER: apague o bloco. A página, o menu e o sitemap se ajustam sozinhos.
 *
 * `confirmed: false` significa que a clínica ainda não validou o item. Enquanto
 * estiver assim, o site avisa que a disponibilidade deve ser confirmada e a
 * página do tratamento fica fora do Google (noindex e fora do sitemap).
 * Mude para `true` depois que a clínica confirmar que realiza o tratamento.
 *
 * Os textos são informativos e gerais. Não prometem resultado e não
 * substituem a avaliação presencial.
 */
export type Treatment = {
  slug: string;
  name: string;
  /** Resumo curto, usado na lista da página inicial. */
  summary: string;
  photo: Photo;
  confirmed: boolean;
  /** Parágrafos da página do tratamento. */
  about: readonly string[];
  /** Situações em que vale conversar com o dentista. */
  whenToSeek: readonly string[];
};

export const treatments: readonly Treatment[] = [
  {
    slug: "prevencao-e-limpeza",
    name: "Prevenção e limpeza",
    summary: "Consultas de rotina e limpeza profissional para manter dentes e gengivas saudáveis.",
    photo: photos.prevencao,
    confirmed: false,
    about: [
      "A prevenção é a base da saúde bucal. Na consulta de rotina, o dentista examina dentes e gengivas e orienta os cuidados do dia a dia.",
      "A limpeza profissional remove a placa e o tártaro que a escovação não alcança. A frequência ideal das consultas é definida na avaliação, de acordo com cada pessoa.",
    ],
    whenToSeek: [
      "Faz tempo desde a sua última consulta",
      "A gengiva sangra ao escovar ou ao usar o fio dental",
      "Você quer orientação sobre escovação e cuidados diários",
    ],
  },
  {
    slug: "restauracoes",
    name: "Restaurações",
    summary: "Recuperação de dentes afetados por cárie ou pequenas fraturas, devolvendo forma e função.",
    photo: photos.restauracoes,
    confirmed: false,
    about: [
      "A restauração recupera a parte do dente que foi perdida por cárie, desgaste ou fratura, para que ele volte a cumprir sua função.",
      "Quanto antes o problema é identificado, mais simples costuma ser o cuidado. A indicação de cada caso é feita na avaliação.",
    ],
    whenToSeek: [
      "Sensibilidade ao frio, ao calor ou a doces",
      "Um dente lascou ou uma restauração antiga se soltou",
      "Você notou uma mancha escura ou uma pequena cavidade",
    ],
  },
  {
    slug: "clareamento-dental",
    name: "Clareamento dental",
    summary: "Tratamento estético que clareia a cor dos dentes, com indicação e acompanhamento do dentista.",
    photo: photos.clareamento,
    confirmed: false,
    about: [
      "O clareamento dental é um tratamento estético que suaviza o tom dos dentes. O resultado varia de pessoa para pessoa.",
      "Antes de começar, o dentista avalia a saúde dos dentes e das gengivas e indica a melhor forma de fazer o tratamento com segurança.",
    ],
    whenToSeek: [
      "Você gostaria de dentes com um tom mais claro",
      "Tem dúvidas sobre sensibilidade durante o clareamento",
      "Quer saber se o clareamento é indicado para o seu caso",
    ],
  },
  {
    slug: "ortodontia",
    name: "Ortodontia",
    summary: "Correção do alinhamento dos dentes e da mordida, com planejamento individual.",
    photo: photos.ortodontia,
    confirmed: false,
    about: [
      "A ortodontia cuida da posição dos dentes e do encaixe da mordida. Além da estética, um bom alinhamento facilita a higiene e a mastigação.",
      "O tipo de aparelho e o tempo de tratamento dependem de cada caso e são definidos depois da avaliação e dos exames.",
    ],
    whenToSeek: [
      "Dentes desalinhados ou com pouco espaço",
      "Desconforto ao morder ou mastigar",
      "Você já usou aparelho e os dentes voltaram a se mover",
    ],
  },
  {
    slug: "tratamento-de-canal",
    name: "Tratamento de canal",
    summary: "Cuidado com a parte interna do dente quando há inflamação ou infecção, para preservar o dente natural.",
    photo: photos.canal,
    confirmed: false,
    about: [
      "O tratamento de canal cuida da parte interna do dente quando ela inflama ou infecciona, em geral por cárie profunda ou trauma.",
      "O objetivo é aliviar a dor e manter o dente natural na boca. O dentista explica cada etapa antes de começar.",
    ],
    whenToSeek: [
      "Dor de dente forte ou que não passa",
      "Sensibilidade prolongada ao quente ou ao frio",
      "Inchaço na gengiva próximo a um dente",
    ],
  },
  {
    slug: "proteses-e-implantes",
    name: "Próteses e implantes",
    summary: "Reposição de dentes perdidos para recuperar a mastigação, a fala e a confiança ao sorrir.",
    photo: photos.proteses,
    confirmed: false,
    about: [
      "Próteses e implantes repõem dentes perdidos e devolvem conforto para mastigar, falar e sorrir.",
      "Existem diferentes soluções, fixas e removíveis. A escolha depende de uma avaliação cuidadosa da saúde bucal e das necessidades de cada pessoa.",
    ],
    whenToSeek: [
      "Você perdeu um ou mais dentes",
      "Sua prótese atual está frouxa ou incomoda",
      "Quer conhecer as opções para o seu caso",
    ],
  },
];

export function getTreatment(slug: string): Treatment | undefined {
  return treatments.find((treatment) => treatment.slug === slug);
}

/** true quando algum tratamento ainda aguarda validação da clínica. */
export const hasUnconfirmedTreatments = treatments.some((treatment) => !treatment.confirmed);
