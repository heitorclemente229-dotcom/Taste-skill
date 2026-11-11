/**
 * Textos da página inicial. Edite aqui para mudar o que aparece no site.
 * Não há travessões nos textos: use vírgula, ponto ou dois-pontos.
 *
 * Em `titleLines`, cada item é uma linha do título no desktop. Mantenha as
 * linhas curtas (até cerca de 30 caracteres) para que caibam sem quebrar.
 */

export const hero = {
  /** Cada item é uma linha do título. */
  titleLines: ["Seu sorriso merece", "um cuidado completo."],
  subtitle:
    "Odontologia integrada, atendimento humanizado e cuidado em cada detalhe para transformar sua experiência com a saúde bucal.",
  primaryCta: "Agendar avaliação",
  secondaryCta: "Conheça a clínica",
} as const;

export const about = {
  titleLines: ["Mais do que cuidar de sorrisos,", "cuidamos de pessoas."],
  lead: "A Odonto Ibe é uma clínica de odontologia integrada no Jardim São Luís, na Zona Leste de São Paulo. Aqui, cada atendimento começa por ouvir você com calma, para então cuidar do seu sorriso.",
  highlights: [
    { title: "Atendimento humanizado", text: "Escuta, respeito e explicações claras em cada etapa." },
    { title: "Ambiente acolhedor", text: "Um espaço para você se sentir à vontade desde a recepção." },
    { title: "Profissionais qualificados", text: "Uma equipe preparada para cuidar de você com responsabilidade." },
    { title: "Estrutura preparada", text: "Consultórios organizados para atender bem cada paciente." },
  ],
  /** Informações que constam no perfil da clínica no Google (referência enviada). */
  profileFacts: {
    title: "Um lugar para todo mundo",
    source: "Informações do perfil da clínica no Google.",
    items: ["Acessível para cadeira de rodas", "Acolhe a comunidade LGBTQ+", "Empresa de empreendedoras"],
  },
  galleryTitle: "Por dentro da clínica",
} as const;

export const treatmentsSection = {
  title: "Tratamentos",
  lead: "Odontologia integrada significa reunir diferentes cuidados em um só lugar, com um plano pensado para você.",
  draftNote:
    "Lista provisória, em validação com a clínica. Confirme pelo WhatsApp se o tratamento que você procura está disponível.",
  linkLabel: "Conhecer",
} as const;

export const teamSection = {
  title: "Nossa equipe",
  lead: "Quem recebe você na Odonto Ibe: profissionais dedicados a cuidar com atenção, do primeiro contato ao fim do tratamento.",
  draftNote:
    "Perfis provisórios. Fotos, nomes, funções e especialidades entram aqui assim que a clínica enviar as informações.",
} as const;

export const differentials = {
  title: "O que torna o cuidado completo",
  items: [
    { title: "Atendimento acolhedor", text: "Você é recebido com atenção desde o primeiro contato." },
    { title: "Cuidado individualizado", text: "Cada plano de tratamento considera a sua história e as suas necessidades." },
    { title: "Ambiente agradável", text: "Um espaço limpo, organizado e tranquilo para o seu atendimento." },
    { title: "Equipe profissional", text: "Profissionais que explicam cada etapa e cuidam com responsabilidade." },
    { title: "Odontologia integrada", text: "Diferentes áreas da odontologia reunidas em um só lugar." },
  ],
} as const;

export const reviewsSection = {
  title: "A confiança de quem já conhece nosso trabalho.",
  ratingLabel: "de 5 no Google",
  countLabel: "avaliações no Google",
  cta: "Ver avaliações no Google",
  attribution: "Avaliação no Google",
  source: "Nota, total e trechos conforme o perfil da clínica no Google.",
} as const;

export const faqSection = {
  title: "Dúvidas frequentes",
} as const;

export const cta = {
  titleLines: ["Está na hora de cuidar", "do seu sorriso?"],
  text: "Agende seu atendimento e conheça uma nova experiência em odontologia.",
  button: "Agendar pelo WhatsApp",
} as const;

export const contactSection = {
  title: "Localização e contato",
  routeButton: "Abrir rota",
  whatsappButton: "Agendar pelo WhatsApp",
  hoursPending: "Horários de atendimento em confirmação. Consulte pelo WhatsApp.",
  mapTitle: "Mapa interativo",
  mapText: "O mapa do Google só é carregado quando você pede, para proteger sua privacidade.",
  mapButton: "Ver mapa interativo",
  formTitle: "Prefere que a gente fale com você?",
  formLead: "Deixe seu contato e a clínica retorna. Não é preciso informar dados de saúde.",
} as const;
