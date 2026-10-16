import type { Metadata } from "next";
import { ArcLine, Halo, MaskLines, Reveal } from "@/components/motion/primitives";
import { ArrowLink, ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

// 404: o Next injeta noindex automaticamente.
export default function NotFound() {
  return (
    <section aria-labelledby="nao-encontrada-title" className="relative isolate overflow-hidden pt-[var(--header-h)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Halo className="-right-[16rem] top-[8%] size-[40rem] max-w-none lg:right-[-6rem] lg:size-[52rem]" strength={18} />
      </div>

      <div className="container-edge flex min-h-[calc(88dvh-var(--header-h))] flex-col justify-center py-20 lg:py-28">
        <p className="tabular text-sm tracking-[0.12em] text-accent-ink">Erro 404</p>
        <MaskLines
          as="h1"
          id="nao-encontrada-title"
          mount
          delay={0.1}
          lines={["Página não", "encontrada"]}
          className="mt-6 text-heading font-light tracking-[-0.045em] sm:text-title"
          lineClassNames={[undefined, "pl-[0.9em] text-accent-display"]}
        />
        <Reveal mount delay={0.45} className="mt-8 max-w-[36ch] text-lead text-slate lg:ml-[0.3rem]">
          <p>O endereço pode ter mudado ou não existe mais.</p>
        </Reveal>
        <Reveal mount delay={0.6} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 lg:ml-[0.3rem]">
          <ButtonLink href="/">Voltar ao início</ButtonLink>
          <ArrowLink href="/#tratamentos">Ver tratamentos</ArrowLink>
        </Reveal>

        <ArcLine mount delay={0.5} width={1000} sag={90} className="mt-20 w-full max-w-4xl lg:mt-28" lightPoint />
      </div>
    </section>
  );
}
