import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { address, brand, contact } from "@/config/site";
import { DraftNote } from "@/components/ui/draft-note";
import { MaskHeading } from "@/components/ui/mask-heading";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: `Como a ${brand.name} trata os dados pessoais enviados pelo site, de acordo com a Lei Geral de Proteção de Dados (LGPD).`,
  alternates: { canonical: "/privacidade" },
};

/** Data da última revisão deste texto. Atualize sempre que o conteúdo mudar. */
const UPDATED_AT = "11 de novembro de 2026";

export default function PrivacyPage() {
  return (
    <article className="pt-(--header-h)">
      <div className="container-edge pt-12 pb-(--spacing-section) lg:pt-20">
        <MaskHeading as="h1" load lines={["Política de privacidade"]} className="text-title [--wght:580]" />
        <p className="mt-5 text-stone">Última atualização: {UPDATED_AT}.</p>
        <DraftNote className="mt-4">
          Texto-base a ser revisado pela clínica e por sua assessoria jurídica antes da publicação. Faltam a razão social, o CNPJ e o
          contato do encarregado de dados.
        </DraftNote>

        <div className="mt-12 max-w-[68ch] space-y-12 leading-relaxed lg:mt-16">
          <Block title="Quem é responsável pelos seus dados">
            <p>
              A {brand.fullName}, localizada na {address.street}, {address.district}, {address.city} - {address.state}, CEP{" "}
              {address.postalCode}, é a controladora dos dados pessoais tratados por este site.
            </p>
          </Block>

          <Block title="Quais dados coletamos">
            <p>Somente o que você escolhe enviar pelo formulário de contato:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>nome;</li>
              <li>telefone ou WhatsApp;</li>
              <li>e-mail, se você informar;</li>
              <li>preferência de contato, período e assunto;</li>
              <li>a mensagem que você escrever.</li>
            </ul>
            <p className="mt-3">
              O formulário não pede informações de saúde, e pedimos que você não as inclua na mensagem. Esses assuntos são tratados
              na consulta, com o sigilo profissional.
            </p>
          </Block>

          <Block title="Para que usamos">
            <p>
              Para retornar o seu contato e combinar o atendimento. Não usamos seus dados para publicidade e não os vendemos nem
              cedemos a terceiros para outros fins.
            </p>
          </Block>

          <Block title="Base legal">
            <p>
              O tratamento acontece com o seu consentimento, dado ao enviar o formulário, e para atender a um pedido seu antes de
              uma eventual contratação de serviço (art. 7º, incisos I e V, da Lei nº 13.709/2018, a LGPD).
            </p>
          </Block>

          <Block title="Com quem os dados são compartilhados">
            <p>
              Com os fornecedores que fazem o site e o envio de mensagens funcionarem (hospedagem e serviço de e-mail), que atuam
              como operadores e só tratam os dados para essa finalidade.
            </p>
          </Block>

          <Block title="Por quanto tempo guardamos">
            <p>
              Pelo tempo necessário para responder ao seu contato e, depois disso, pelo prazo exigido por lei ou até você pedir a
              exclusão. O site não mantém um banco de dados com as mensagens: elas são entregues à clínica e não ficam armazenadas
              aqui.
            </p>
          </Block>

          <Block title="Cookies e serviços de terceiros">
            <p>
              Este site não usa cookies de publicidade nem ferramentas de rastreamento. O mapa do Google só é carregado quando
              você pede para ver o mapa interativo; a partir daí, o Google pode coletar dados conforme a política dele. Os botões
              de WhatsApp abrem o aplicativo ou o site do WhatsApp, que tem regras próprias de privacidade.
            </p>
          </Block>

          <Block title="Seus direitos">
            <p>
              Você pode pedir, a qualquer momento, a confirmação do tratamento, o acesso, a correção ou a exclusão dos seus dados,
              além de retirar o consentimento (art. 18 da LGPD). Para isso, fale com a clínica pelo telefone ou WhatsApp{" "}
              <a href={contact.phoneHref} className="font-semibold text-teal underline underline-offset-4">
                {contact.phoneDisplay}
              </a>
              . Você também pode recorrer à Autoridade Nacional de Proteção de Dados (ANPD).
            </p>
          </Block>

          <Block title="Segurança">
            <p>
              O site usa conexão criptografada (HTTPS), valida e limita os envios do formulário e não registra dados pessoais nos
              seus registros técnicos.
            </p>
          </Block>
        </div>

        <p className="mt-14">
          <Link href="/" className="font-semibold text-teal underline underline-offset-4">
            Voltar para a página inicial
          </Link>
        </p>
      </div>
    </article>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="display text-heading [--wght:580]">{title}</h2>
      <div className="mt-4 text-forest/90">{children}</div>
    </section>
  );
}
