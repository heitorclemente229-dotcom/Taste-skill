/**
 * Trechos de avaliações.
 *
 * Os três trechos abaixo são reais: aparecem no resumo público de avaliações
 * do perfil da clínica no Google (referência enviada pela clínica). Estão
 * transcritos como aparecem lá, sem nome nem foto de quem avaliou.
 *
 * O briefing pede avaliações "autorizadas e verificadas". Se a clínica
 * preferir aguardar a autorização de quem escreveu, mude `published` para
 * `false`: a seção continua mostrando a nota, o total e o botão do Google.
 *
 * Nunca adicione aqui um depoimento que não exista de verdade.
 */
export type Review = {
  text: string;
  published: boolean;
};

export const reviews: readonly Review[] = [
  { text: "Clínica com ótimos profissionais ...ambiente limpo e agradável!!", published: true },
  { text: "Ótimo atendimento na recepção e um excelente tratamento com a Dr Gabriela", published: true },
  { text: "A dra Itanaly é uma fofa e virou minha doutora e da minha família.", published: true },
];

export const publishedReviews = reviews.filter((review) => review.published);
