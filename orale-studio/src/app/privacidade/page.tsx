import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { contact, formatAddress, legal } from "@/config/site";
import { MaskLines, Reveal } from "@/components/motion/primitives";
import { DemoNote } from "@/components/ui/demo-note";

export const metadata: Metadata = {
  title: "Aviso de privacidade",
  description: "Como tratamos os dados enviados pelo formulário de agendamento, em linguagem direta e de acordo com a LGPD.",
  alternates: { canonical: "/privacidade" },
};

/**
 * MODELO de aviso de privacidade (LGPD, Lei 13.709/2018).
 * Os dados da clínica vêm de src/config/site.ts. Os campos abaixo são
 * específicos deste aviso. Depois da revisão jurídica, preencha-os e mude
 * isPlaceholder para false: o selo de modelo e as orientações somem.
 */
const notice = {
  isPlaceholder: true,
  updatedAt: "[data da última atualização]",
  dpoName: "[Nome do encarregado ou da empresa responsável]",
  retention: "[prazo definido pela clínica]",
} as const;

type Section = { id: string; title: string; body: ReactNode };

export default function PrivacidadePage() {
  // Mesma regra do layout: a verificação anti-robô só existe com as duas chaves.
  const turnstileEnabled = Boolean(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);

  const sections: Section[] = [
    {
      id: "controlador",
      title: "Quem é o controlador",
      body: (
        <>
          <p>O controlador é quem decide por que e como os dados pessoais são tratados. Neste site, o controlador é:</p>
          <Facts
            items={[
              ["Razão social", legal.companyName],
              ["CNPJ", <span key="cnpj" className="tabular">{legal.cnpj}</span>],
              ["Endereço", formatAddress()],
              ["Contato", <MailLink key="mail" email={contact.email} />],
            ]}
          />
        </>
      ),
    },
    {
      id: "encarregado",
      title: "Encarregado de dados",
      body: (
        <>
          <p>
            O encarregado recebe pedidos e dúvidas sobre dados pessoais e é o canal de comunicação com a Autoridade
            Nacional de Proteção de Dados (ANPD).
          </p>
          <Facts
            items={[
              ["Encarregado", notice.dpoName],
              ["E-mail", <MailLink key="dpo" email={contact.privacyEmail} />],
            ]}
          />
          <Hint>a LGPD pede que a identidade e o contato do encarregado sejam divulgados de forma clara.</Hint>
        </>
      ),
    },
    {
      id: "dados",
      title: "Quais dados coletamos",
      body: (
        <>
          <p>Pelo formulário de agendamento, pedimos apenas o necessário para responder ao seu pedido:</p>
          <List
            items={[
              "Nome.",
              "Telefone, para retorno por ligação ou WhatsApp.",
              "E-mail, opcional. Só é obrigatório se você escolher retorno por e-mail.",
              "Preferência de contato: WhatsApp, ligação ou e-mail.",
              "Melhor período: manhã, tarde ou sem preferência.",
              "Assunto, opcional.",
              "Mensagem, opcional.",
              "Confirmação de que você leu este aviso.",
            ]}
          />
          <p className="text-deep">
            O formulário não pede informações de saúde. Pedimos que você não as inclua na mensagem: detalhes clínicos são
            tratados na consulta, com sigilo profissional.
          </p>
          <p>
            Para limitar envios abusivos, o servidor usa por pouco tempo um código derivado do endereço de conexão (hash),
            sem guardar o endereço em si.
          </p>
        </>
      ),
    },
    {
      id: "finalidade",
      title: "Para que usamos",
      body: (
        <>
          <p>
            Usamos esses dados somente para responder à sua solicitação: entrar em contato pelo canal que você escolheu e
            combinar data e horário da consulta.
          </p>
          <p>Os dados do formulário não são usados para publicidade, criação de perfis ou listas de envio.</p>
        </>
      ),
    },
    {
      id: "base-legal",
      title: "Base legal",
      body: (
        <>
          <p>
            O tratamento se apoia no art. 7º, inciso V, da LGPD: uso de dados em procedimentos preliminares a um contrato,
            a pedido do próprio titular. Aqui, o procedimento é o agendamento que você solicitou.
          </p>
          {notice.isPlaceholder ? (
            <p>
              <span className="inline-flex rounded-full bg-ice px-3 py-1 text-[0.8rem] font-medium text-accent-ink">
                A validar com a assessoria jurídica
              </span>
            </p>
          ) : null}
          <p>
            A confirmação de leitura no formulário registra que você teve acesso a este aviso. Ela não é um pedido de
            autorização para outros usos.
          </p>
        </>
      ),
    },
    {
      id: "compartilhamento",
      title: "Compartilhamento",
      body: (
        <>
          <p className="text-deep">Não vendemos, alugamos nem cedemos dados pessoais.</p>
          <p>Os dados passam apenas pelos operadores necessários para que a mensagem chegue à clínica, como:</p>
          <List
            items={[
              "O provedor de hospedagem do site.",
              "O serviço de e-mail ou o sistema de agendamento que a clínica usa para receber as solicitações.",
              ...(turnstileEnabled ? ["A verificação anti-robô do formulário (veja Cookies e rastreamento)."] : []),
            ]}
          />
          <p>Esses operadores tratam os dados somente conforme as instruções da clínica.</p>
          <Hint>
            liste os operadores efetivamente usados e informe se algum deles armazena dados fora do Brasil (transferência
            internacional, arts. 33 a 36 da LGPD).
          </Hint>
        </>
      ),
    },
    {
      id: "retencao",
      title: "Retenção",
      body: (
        <>
          <p>Mantemos as solicitações apenas pelo tempo necessário para responder e agendar.</p>
          <p>
            Solicitações que não resultarem em consulta são eliminadas após{" "}
            <span className="text-deep">{notice.retention}</span>.
          </p>
          <p>
            Se a solicitação resultar em atendimento, os dados passam a seguir as obrigações legais e profissionais da
            clínica, informadas no próprio atendimento.
          </p>
          <Hint>defina o prazo e aplique-o também na caixa de e-mail ou no sistema que recebe as solicitações.</Hint>
        </>
      ),
    },
    {
      id: "direitos",
      title: "Direitos do titular",
      body: (
        <>
          <p>A LGPD (art. 18) garante a você, a qualquer momento:</p>
          <List
            items={[
              "Confirmação de que tratamos seus dados.",
              "Acesso aos dados.",
              "Correção de dados incompletos, inexatos ou desatualizados.",
              "Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desacordo com a lei.",
              "Portabilidade dos dados a outro fornecedor, conforme a regulamentação da ANPD.",
              "Informação sobre com quem compartilhamos seus dados.",
              "Revogação do consentimento, quando o tratamento depender dele.",
            ]}
          />
          <p>
            Para exercer qualquer um desses direitos, escreva para <MailLink email={contact.privacyEmail} />. Podemos pedir
            uma confirmação de identidade antes de responder, para proteger seus próprios dados. Você também pode
            apresentar reclamação à ANPD.
          </p>
        </>
      ),
    },
    {
      id: "seguranca",
      title: "Segurança",
      body: (
        <>
          <p>Adotamos medidas proporcionais ao tipo de dado tratado:</p>
          <List
            items={[
              "Conexão protegida por HTTPS.",
              "Coleta mínima: apenas os campos necessários.",
              "O site não armazena as solicitações. Elas são encaminhadas à clínica no momento do envio.",
              "Acesso restrito às pessoas da equipe que respondem aos pedidos.",
              "Os registros técnicos do servidor do site não guardam o conteúdo do formulário.",
            ]}
          />
          <p>
            Se ocorrer um incidente de segurança que possa trazer risco ou dano relevante, a clínica comunicará os titulares
            afetados e a ANPD, conforme a lei.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies e rastreamento",
      body: (
        <>
          <p>
            Este site não usa cookies de publicidade nem de análise de audiência e não carrega rastreadores de terceiros.
            Fontes e imagens são servidas pelo próprio site.
          </p>
          {turnstileEnabled ? (
            <p>
              Para bloquear envios automatizados, o formulário usa a verificação anti-robô Cloudflare Turnstile. Ela
              processa dados técnicos do navegador e da conexão apenas para diferenciar pessoas de robôs.
            </p>
          ) : (
            <Hint>
              se a verificação anti-robô (Cloudflare Turnstile) for ativada, este trecho passa a informá-la
              automaticamente.
            </Hint>
          )}
          <p>Os links para WhatsApp, mapas e redes sociais levam a serviços de terceiros, com políticas de privacidade próprias.</p>
        </>
      ),
    },
    {
      id: "alteracoes",
      title: "Alterações deste aviso",
      body: (
        <>
          <p>
            Este aviso pode ser atualizado quando mudar a forma de tratar os dados. A versão em vigor é sempre a publicada
            nesta página.
          </p>
          <p className="text-deep">
            Última atualização: <span className="tabular">{notice.updatedAt}</span>.
          </p>
        </>
      ),
    },
  ];

  return (
    <article aria-labelledby="privacidade-title" className="relative isolate pt-[var(--header-h)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[48rem] overflow-hidden">
        <div className="halo absolute -right-[18rem] -top-[14rem] size-[46rem] rounded-full lg:-right-[8rem]" />
      </div>

      <header className="container-edge pb-16 pt-10 sm:pt-14 lg:pb-24 lg:pt-20">
        <MaskLines
          as="h1"
          id="privacidade-title"
          mount
          delay={0.1}
          lines={["Aviso de", "privacidade"]}
          className="text-title font-light tracking-[-0.05em]"
          lineClassNames={[undefined, "pl-[0.9em] text-accent-display"]}
        />
        <Reveal mount delay={0.45} className="mt-8 max-w-[44ch] text-lead text-slate lg:ml-[0.3rem]">
          <p>
            Como tratamos os dados que você envia pelo formulário de agendamento, em linguagem direta e de acordo com a Lei
            Geral de Proteção de Dados Pessoais (Lei 13.709/2018).
          </p>
        </Reveal>
        <Reveal mount delay={0.55} className="mt-8 flex flex-col items-start gap-5 lg:ml-[0.3rem]">
          <p className="text-sm text-slate">
            Última atualização: <span className="tabular text-deep">{notice.updatedAt}</span>
          </p>
          {notice.isPlaceholder ? (
            <DemoNote>
              Este texto é um modelo. Ele precisa ser revisado pela assessoria jurídica da clínica antes da publicação. O
              site, por si só, não garante conformidade com a LGPD.
            </DemoNote>
          ) : null}
        </Reveal>
      </header>

      <div className="container-edge grid gap-12 pb-section lg:grid-cols-12 lg:gap-6">
        <aside className="lg:col-span-3">
          {/* Celular: índice recolhível. */}
          <details className="group rounded-surface border border-line bg-white/70 lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-surface px-5 text-[0.95rem] font-medium text-deep [&::-webkit-details-marker]:hidden">
              Nesta página
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-open:rotate-180"
                strokeWidth={1.6}
              />
            </summary>
            <nav aria-label="Nesta página" className="px-5 pb-4">
              <TocList sections={sections} />
            </nav>
          </details>

          {/* Desktop: índice fixo ao lado do texto. */}
          <nav aria-label="Nesta página" className="hidden lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:block">
            <p className="text-sm font-medium text-deep">Nesta página</p>
            <div className="mt-5 border-l border-line">
              <TocList sections={sections} />
            </div>
          </nav>
        </aside>

        <div className="flex flex-col gap-16 lg:col-span-8 lg:col-start-5 lg:gap-24 xl:col-span-7 xl:col-start-5">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="max-w-[64ch]">
              <h2
                id={`${section.id}-title`}
                className="flex items-baseline gap-4 text-[1.75rem] font-light leading-[1.1] tracking-[-0.03em] sm:text-[2.125rem]"
              >
                <span aria-hidden="true" className="tabular shrink-0 text-xs font-normal tracking-[0.12em] text-accent-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              <div className="mt-6 flex flex-col gap-5 text-[1.0625rem] leading-relaxed text-deep/80">{section.body}</div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

function TocList({ sections }: { sections: Section[] }) {
  return (
    <ol className="flex flex-col">
      {sections.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="flex min-h-11 items-center gap-3 text-[0.9rem] text-slate transition-colors duration-300 hover:text-deep lg:-ml-px lg:border-l lg:border-transparent lg:pl-4 lg:hover:border-deep"
          >
            <span aria-hidden="true" className="tabular w-5 shrink-0 text-[0.6875rem] tracking-[0.12em] text-accent-ink">
              {String(index + 1).padStart(2, "0")}
            </span>
            {section.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Lista com marcador em linha fina (a linha de referência da marca). */
function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, index) => (
        <li
          key={index}
          className="relative pl-6 before:absolute before:left-0 before:top-[0.8em] before:h-px before:w-3 before:bg-periwinkle"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-8 gap-y-3 border-t border-line pt-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
      {items.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-sm leading-relaxed text-slate sm:pt-[0.15rem]">{term}</dt>
          <dd className="text-deep">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="break-words font-medium text-deep underline decoration-deep/30 underline-offset-4 transition-colors hover:decoration-deep"
    >
      {email}
    </a>
  );
}

/** Orientação de preenchimento do modelo. Some quando notice.isPlaceholder for false. */
function Hint({ children }: { children: ReactNode }) {
  const show: boolean = notice.isPlaceholder;
  if (!show) return null;
  return (
    <p className="border-l border-dashed border-field/70 pl-4 text-sm leading-relaxed text-slate">
      <span className="font-medium text-accent-ink">Para a clínica: </span>
      {children}
    </p>
  );
}
