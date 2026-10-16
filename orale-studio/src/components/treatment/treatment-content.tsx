import { TREATMENT_DISCLAIMER, type TreatmentDetail } from "@/content/treatment-details";
import { cn } from "@/lib/cn";
import { ArcDivider } from "@/components/motion/arc-divider";
import { Reveal } from "@/components/motion/primitives";
import { SectionTitle } from "@/components/treatment/section-title";
import { TreatmentSteps } from "@/components/treatment/treatment-steps";

/**
 * Corpo da página de tratamento. Grade de 12 colunas com títulos pequenos à
 * esquerda e texto a partir da quinta coluna; a faixa "Como acontece" quebra
 * o ritmo em largura total, sobre o azul-gelo.
 */
export function TreatmentContent({ detail }: { detail: TreatmentDetail }) {
  return (
    <>
      <div className="container-edge flex flex-col gap-24 pb-section pt-20 lg:gap-36 lg:pt-28">
        <About detail={detail} />
        <Indications detail={detail} />
      </div>

      <section id="como-acontece" aria-labelledby="como-acontece-titulo" className="relative bg-ice py-section">
        <ArcDivider fill="ice" shape="smile" />
        <div className="container-edge">
          <div className="grid gap-y-6 lg:grid-cols-12 lg:gap-x-6">
            <SectionTitle id="como-acontece-titulo" section="como-acontece" tone="ice" sticky={false}>
              Como acontece
            </SectionTitle>
            <Reveal className="lg:col-span-6 lg:col-start-5 lg:self-end">
              <p className="max-w-[44ch] text-lead text-slate">As etapas gerais. O plano de cada pessoa é definido na avaliação.</p>
            </Reveal>
          </div>
          <TreatmentSteps steps={detail.steps} className="mt-16 lg:mt-24" />
        </div>
      </section>

      <div className="container-edge pt-section">
        <Care detail={detail} />
      </div>
    </>
  );
}

function About({ detail }: { detail: TreatmentDetail }) {
  const [first, second] = detail.about;
  return (
    <section id="o-que-e" aria-labelledby="o-que-e-titulo" className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-6">
      <SectionTitle id="o-que-e-titulo" section="o-que-e">
        O que é
      </SectionTitle>
      <div className="lg:col-span-7 lg:col-start-5">
        <Reveal>
          <p className="max-w-[40ch] text-[clamp(1.375rem,2.2vw,1.875rem)] font-light leading-[1.38] tracking-[-0.02em]">{first}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-8 max-w-[62ch] text-[1.0625rem] leading-relaxed text-slate">{second}</p>
        </Reveal>
      </div>
    </section>
  );
}

function Indications({ detail }: { detail: TreatmentDetail }) {
  return (
    <section id="indicacoes" aria-labelledby="indicacoes-titulo" className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-6">
      <SectionTitle id="indicacoes-titulo" section="indicacoes">
        Quando pode ser indicado
      </SectionTitle>
      <div className="lg:col-span-8 lg:col-start-5">
        <ul className="grid gap-x-10 sm:grid-cols-2">
          {detail.indications.map((item, index) => (
            <Reveal
              as="li"
              key={item}
              delay={(index % 2) * 0.06}
              className="flex gap-4 border-t border-line py-5 text-[1.0625rem] leading-relaxed"
            >
              <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-periwinkle" />
              <span>{item}</span>
            </Reveal>
          ))}
        </ul>
        <Reveal>
          <p className="mt-8 flex max-w-[60ch] gap-4 text-[0.95rem] leading-relaxed text-slate">
            <span aria-hidden="true" className="mt-[0.8em] h-px w-6 shrink-0 bg-slate/60" />
            <span>{detail.indicationNote}</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Care({ detail }: { detail: TreatmentDetail }) {
  const columns = detail.care.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return (
    <section id="cuidados" aria-labelledby="cuidados-titulo" className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-6">
      <SectionTitle id="cuidados-titulo" section="cuidados">
        Cuidados
      </SectionTitle>
      <div className="lg:col-span-8 lg:col-start-5">
        <Reveal>
          <ul
            className={cn(
              "grid divide-y divide-line rounded-surface bg-white ring-1 ring-inset ring-line md:divide-x md:divide-y-0",
              columns,
            )}
          >
            {detail.care.map((item, index) => (
              <li key={item.title} className="p-7 lg:p-8">
                <span aria-hidden="true" className="tabular text-[0.6875rem] tracking-[0.12em] text-accent-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-[1.125rem] font-normal tracking-[-0.015em]">{item.title}</h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-slate">{item.text}</p>
              </li>
            ))}
          </ul>
        </Reveal>
        <p className="mt-10 max-w-[60ch] text-[0.8125rem] leading-relaxed text-slate">{TREATMENT_DISCLAIMER}</p>
      </div>
    </section>
  );
}
