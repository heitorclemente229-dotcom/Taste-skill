/**
 * Perguntas frequentes.
 *
 * `draft: true` marca respostas que dependem de confirmação da clínica.
 * Elas aparecem com o aviso "a confirmar" enquanto os avisos estiverem ligados
 * (ver `showDraftNotes` em src/config/site.ts).
 */
export type FaqItem = {
  question: string;
  answer: string;
  draft?: boolean;
};

export const faq: readonly FaqItem[] = [
  {
    question: "Como faço para agendar uma avaliação?",
    answer:
      "Pelo WhatsApp (11) 97655-6438, com o botão de agendamento desta página, ou pelo formulário de contato. A equipe retorna para combinar o melhor horário.",
  },
  {
    question: "Onde fica a Odonto Ibe?",
    answer:
      "Na Rua Manuel Bueno da Fonseca, 131, no Jardim São Luís, Zona Leste de São Paulo. Na seção de contato há um botão que abre a rota no seu aplicativo de mapas.",
  },
  {
    question: "O que é odontologia integrada?",
    answer:
      "É reunir diferentes áreas da odontologia em um mesmo lugar. Assim, a avaliação olha para a sua saúde bucal como um todo e o plano de cuidado é pensado de forma conjunta.",
  },
  {
    question: "Quais são os horários de atendimento?",
    answer: "Os horários completos estão em confirmação. Enquanto isso, consulte a disponibilidade pelo WhatsApp.",
    draft: true,
  },
  {
    question: "A clínica atende convênios? Quais as formas de pagamento?",
    answer: "Essas informações ainda serão confirmadas pela clínica. Pergunte pelo WhatsApp antes da sua consulta.",
    draft: true,
  },
  {
    question: "O que acontece com os dados que envio pelo formulário?",
    answer:
      "Eles são usados apenas para retornar o seu contato. O formulário não pede informações de saúde, e você pode solicitar a exclusão dos seus dados a qualquer momento. Os detalhes estão na política de privacidade.",
  },
];
