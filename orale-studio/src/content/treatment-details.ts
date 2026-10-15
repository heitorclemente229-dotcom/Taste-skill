/**
 * Conteúdo das páginas de detalhe de cada tratamento (/tratamentos/[slug]).
 *
 * REVISÃO OBRIGATÓRIA: textos educativos de base, escritos de forma geral.
 * Devem ser revisados e aprovados pelo responsável técnico da clínica antes da
 * publicação. Pela regulamentação da publicidade odontológica (CFO), não
 * acrescente promessas de resultado, prazos, números de sessões, preços,
 * estatísticas, marcas de equipamentos ou imagens de "antes e depois".
 */

export type TreatmentStep = {
  title: string;
  text: string;
};

export type TreatmentCare = {
  title: string;
  text: string;
};

export type TreatmentDetail = {
  /** Título principal (h1) quebrado em linhas para a animação de máscara. */
  titleLines: readonly string[];
  /** Abertura da página, com até 30 palavras. */
  lead: string;
  /** "O que é": dois parágrafos curtos. */
  about: readonly [string, string];
  /** "Quando pode ser indicado": situações gerais, de 3 a 4 itens. */
  indications: readonly string[];
  /** Nota que fecha a lista de indicações (depende de avaliação clínica). */
  indicationNote: string;
  /** "Como acontece": de 3 a 4 etapas, sem prazos nem número de sessões. */
  steps: readonly TreatmentStep[];
  /** "Cuidados": de 2 a 3 orientações gerais. */
  care: readonly TreatmentCare[];
};

export const treatmentDetails: Record<string, TreatmentDetail> = {
  ortodontia: {
    titleLines: ["Ortodontia"],
    lead: "Correção da posição dos dentes e do encaixe da mordida, com um plano definido a partir da avaliação de cada pessoa.",
    about: [
      "A ortodontia é a área da odontologia que cuida do posicionamento dos dentes e da relação entre as arcadas. Além da aparência, o alinhamento influencia a mastigação e a facilidade de higienizar os dentes.",
      "Existem diferentes tipos de aparelho, fixos e removíveis. A escolha considera o tipo de correção necessária, a idade, a rotina e as preferências de cada paciente.",
    ],
    indications: [
      "Dentes apinhados, girados ou com espaços entre si.",
      "Mordida que não se encaixa de forma equilibrada ao fechar a boca.",
      "Dificuldade de limpar áreas com dentes sobrepostos.",
      "Preparo para outros tratamentos, como implantes ou próteses.",
    ],
    indicationNote: "A indicação e o tipo de aparelho dependem de avaliação clínica individual.",
    steps: [
      { title: "Avaliação", text: "Exame clínico e conversa sobre o que incomoda e o que você espera do tratamento." },
      { title: "Planejamento", text: "Definição do tipo de aparelho e das etapas, explicadas com clareza antes de começar." },
      { title: "Tratamento", text: "Início com o recurso escolhido e consultas periódicas de ajuste." },
      { title: "Acompanhamento", text: "Ao final, o uso de contenção ajuda a manter os dentes na nova posição." },
    ],
    care: [
      { title: "Higiene redobrada", text: "Aparelhos acumulam resíduos com mais facilidade. Escovação cuidadosa e fio dental fazem parte da rotina." },
      { title: "Retornos em dia", text: "As consultas permitem ajustar o tratamento e conversar sobre qualquer desconforto." },
      { title: "Contenção", text: "Seguir as orientações sobre a contenção é parte importante da fase final." },
    ],
  },

  "clareamento-dental": {
    titleLines: ["Clareamento", "dental"],
    lead: "Clareamento supervisionado pelo dentista, com protocolo definido depois de avaliar o esmalte, a gengiva e a sensibilidade.",
    about: [
      "O clareamento usa géis clareadores para reduzir pigmentos acumulados nos dentes. Pode ser feito no consultório, em casa com moldeiras individuais ou combinando as duas formas, sempre com acompanhamento profissional.",
      "A resposta ao clareamento varia de pessoa para pessoa. Restaurações, coroas e facetas não mudam de cor com o gel, e isso é considerado no planejamento.",
    ],
    indications: [
      "Dentes que escureceram com o tempo ou por alimentos e bebidas com pigmento.",
      "Desejo de um tom mais claro sem desgastar os dentes.",
      "Preparo para novas restaurações ou facetas, para definir a cor de referência.",
    ],
    indicationNote: "A indicação depende de avaliação clínica, que verifica cáries, gengiva e sensibilidade antes de começar.",
    steps: [
      { title: "Avaliação", text: "Exame dos dentes e da gengiva e registro da cor inicial." },
      { title: "Planejamento", text: "Escolha do protocolo, no consultório, em casa ou combinado, de acordo com o seu caso." },
      { title: "Clareamento", text: "Aplicação do gel conforme o protocolo, com orientação sobre o que fazer em caso de sensibilidade." },
      { title: "Acompanhamento", text: "Revisão da cor e orientações para conservar o tom ao longo do tempo." },
    ],
    care: [
      { title: "Sensibilidade", text: "Uma sensibilidade passageira pode acontecer. Avise a equipe se ela surgir." },
      { title: "Alimentação", text: "Durante o tratamento, pode ser orientado reduzir café, chá, vinho e outros alimentos com pigmento." },
      { title: "Manutenção", text: "Higiene diária e consultas periódicas ajudam a conservar a cor por mais tempo." },
    ],
  },

  implantes: {
    titleLines: ["Implantes"],
    lead: "Reposição de dentes perdidos planejada em etapas, da avaliação do osso e da gengiva até a prótese sobre o implante.",
    about: [
      "O implante é uma peça instalada no osso que serve de base para um dente artificial, a prótese. Ele pode repor um único dente, vários dentes ou apoiar próteses maiores.",
      "Antes de indicar o implante, é preciso avaliar a saúde geral, o osso disponível e a condição da gengiva. Em alguns casos, procedimentos complementares fazem parte do planejamento.",
    ],
    indications: [
      "Perda de um ou mais dentes.",
      "Dificuldade para mastigar pela falta de dentes.",
      "Desconforto com próteses removíveis.",
      "Espaços que favorecem a movimentação dos dentes vizinhos.",
    ],
    indicationNote: "A indicação depende de avaliação clínica e de exames de imagem.",
    steps: [
      { title: "Avaliação", text: "Exame clínico, histórico de saúde e exames de imagem para conhecer o osso e a gengiva." },
      { title: "Planejamento", text: "Definição da posição do implante, do tipo de prótese e das etapas, explicadas antes de começar." },
      { title: "Tratamento", text: "Instalação do implante e, depois do período de integração ao osso, confecção da prótese." },
      { title: "Acompanhamento", text: "Revisões periódicas para cuidar do implante, da prótese e da gengiva ao redor." },
    ],
    care: [
      { title: "Higiene ao redor", text: "Escovação, fio dental e escovas específicas mantêm limpa a região do implante." },
      { title: "Pós-operatório", text: "Seguir as orientações recebidas sobre alimentação, repouso e uso de medicamentos prescritos." },
      { title: "Revisões", text: "Consultas regulares permitem verificar a prótese e a saúde da gengiva." },
    ],
  },

  "estetica-odontologica": {
    titleLines: ["Estética", "odontológica"],
    lead: "Ajustes de forma, cor e proporção dos dentes, planejados para conversar com o rosto e com os traços de cada pessoa.",
    about: [
      "A estética odontológica reúne procedimentos que alteram a forma, a cor ou o tamanho dos dentes, como restaurações em resina, facetas e ajustes no contorno da gengiva.",
      "O planejamento parte da observação do sorriso em conjunto com o rosto. A ideia é buscar harmonia e preservar ao máximo a estrutura natural dos dentes.",
    ],
    indications: [
      "Dentes com formato, tamanho ou proporção que incomodam.",
      "Manchas que não respondem ao clareamento.",
      "Pequenos desgastes, lascas ou espaços entre os dentes.",
      "Gengiva muito aparente ao sorrir.",
    ],
    indicationNote: "A indicação depende de avaliação clínica e de uma conversa franca sobre expectativas.",
    steps: [
      { title: "Avaliação", text: "Conversa sobre o que você gostaria de mudar e exame da saúde dos dentes e da gengiva." },
      { title: "Planejamento", text: "Fotografias e registros do sorriso para estudar as possibilidades antes de qualquer procedimento." },
      { title: "Tratamento", text: "Execução dos procedimentos combinados, na ordem definida no planejamento." },
      { title: "Acompanhamento", text: "Revisões para avaliar restaurações e facetas e orientar a manutenção." },
    ],
    care: [
      { title: "Hábitos", text: "Evitar roer unhas ou morder objetos duros ajuda a proteger restaurações e facetas." },
      { title: "Pigmentos", text: "Café, chá, vinho e cigarro podem manchar dentes e materiais ao longo do tempo." },
      { title: "Revisões", text: "Consultas periódicas permitem polir, ajustar e acompanhar cada trabalho." },
    ],
  },

  "prevencao-e-limpeza": {
    titleLines: ["Prevenção", "e limpeza"],
    lead: "Consultas periódicas de limpeza, exame e orientação, que ajudam a identificar alterações ainda no início.",
    about: [
      "A limpeza profissional remove o tártaro, a placa bacteriana endurecida que a escovação em casa não consegue retirar. Na mesma consulta, dentes e gengiva são examinados com calma.",
      "A prevenção também inclui orientação sobre escovação, fio dental e hábitos. A frequência das consultas é definida conforme as necessidades de cada pessoa.",
    ],
    indications: [
      "Acompanhamento de rotina, mesmo sem queixas.",
      "Sangramento ao escovar ou ao usar o fio dental.",
      "Acúmulo de tártaro ou manchas superficiais.",
      "Mau hálito persistente.",
    ],
    indicationNote: "A frequência das consultas e a necessidade de outros cuidados dependem de avaliação clínica.",
    steps: [
      { title: "Avaliação", text: "Exame dos dentes, da gengiva e dos tecidos da boca, com atenção ao seu histórico." },
      { title: "Limpeza", text: "Remoção de placa e tártaro e polimento das superfícies dos dentes." },
      { title: "Orientação", text: "Dicas práticas de escovação, fio dental e hábitos para o dia a dia." },
      { title: "Acompanhamento", text: "Retornos periódicos, com intervalo definido para o seu caso." },
    ],
    care: [
      { title: "Escovação", text: "Escovar os dentes e a língua com cuidado, depois das refeições e antes de dormir." },
      { title: "Fio dental", text: "Usar o fio todos os dias para limpar entre os dentes, onde a escova não alcança." },
      { title: "Retornos", text: "Manter as consultas periódicas, mesmo sem dor ou desconforto." },
    ],
  },

  "tratamentos-restauradores": {
    titleLines: ["Tratamentos", "restauradores"],
    lead: "Recuperação de dentes com cárie, desgaste ou fratura, buscando preservar ao máximo a estrutura natural.",
    about: [
      "Os tratamentos restauradores devolvem forma e função a dentes danificados. Vão de pequenas restaurações a coroas que recobrem o dente, conforme a extensão do problema.",
      "Quanto mais cedo o problema é identificado, mais conservador tende a ser o tratamento. Por isso, sinais como sensibilidade ou dor merecem atenção.",
    ],
    indications: [
      "Cáries ou restaurações antigas com infiltração.",
      "Dentes lascados, trincados ou fraturados.",
      "Desgaste causado por apertar ou ranger os dentes.",
      "Sensibilidade ou dor ao mastigar.",
    ],
    indicationNote: "A indicação e o tipo de restauração dependem de avaliação clínica e, quando necessário, de radiografias.",
    steps: [
      { title: "Avaliação", text: "Exame clínico e, quando necessário, radiografias para entender a extensão do problema." },
      { title: "Planejamento", text: "Explicação das opções de restauração e da ordem de atendimento, se houver mais de um dente." },
      { title: "Tratamento", text: "Remoção da parte comprometida e reconstrução do dente com o material indicado." },
      { title: "Acompanhamento", text: "Revisões para verificar as restaurações e a saúde dos dentes ao redor." },
    ],
    care: [
      { title: "Atenção aos sinais", text: "Sensibilidade, dor ou uma borda áspera são motivos para avisar a equipe." },
      { title: "Hábitos", text: "Para quem aperta ou range os dentes, pode ser indicada uma placa de proteção." },
      { title: "Higiene", text: "Escovação e fio dental diários ajudam a prevenir novas cáries nas bordas das restaurações." },
    ],
  },
};

/** Texto exibido ao final do conteúdo de cada página de tratamento. */
export const TREATMENT_DISCLAIMER = "Conteúdo informativo. Não substitui a avaliação clínica individual.";

export function getTreatmentDetail(slug: string): TreatmentDetail | undefined {
  return Object.hasOwn(treatmentDetails, slug) ? treatmentDetails[slug] : undefined;
}
