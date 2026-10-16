import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Treatment } from "@/content/treatments";
import type { TreatmentDetail } from "@/content/treatment-details";
import { photos } from "@/content/photos";
import { BookingTrigger } from "@/components/booking/booking-context";
import { Halo, MaskLines, Reveal, SmileReveal } from "@/components/motion/primitives";
import { TREATMENT_SECTIONS } from "@/components/treatment/section-title";

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Primeira dobra do tratamento: retorno à lista no topo, título com máscara
 * alinhado à base da fotografia e índice da página sobre a linha de referência.
 */
export function TreatmentHero({
  treatment,
  detail,
  position,
  total,
}: {
  treatment: Treatment;
  detail: TreatmentDetail;
  /** Posição do tratamento na lista (a partir de 1). */
  position: number;
  total: number;
}) {
  const photo = photos[treatment.photo];

  return (
    <section aria-labelledby="tratamento-titulo" className="relative isolate overflow-hidden pt-[var(--header-h)]">
      <div className="container-edge grid grid-cols-1 gap-y-14 pt-6 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-20 lg:pt-10">
        <div className="relative z-10 flex flex-col lg:col-span-7 lg:pr-4">
          <Reveal mount y={8} duration={0.8}>
            <nav aria-label="Navegação estrutural">
              <Link
                href="/#tratamentos"
                className="group/back -ml-1 inline-flex min-h-11 items-center gap-3 rounded-full py-1 pl-1 pr-3 text-[0.9rem] text-slate transition-colors duration-300 hover:text-deep"
              >
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-full ring-1 ring-inset ring-deep/15 transition-[background-color,color,box-shadow] duration-500 ease-out-expo group-hover/back:bg-deep group-hover/back:text-white group-hover/back:ring-deep"
                >
                  <ArrowLeft
                    className="size-4 transition-transform duration-500 ease-out-expo group-hover/back:-translate-x-0.5"
                    strokeWidth={1.6}
                  />
                </span>
                Todos os cuidados
              </Link>
            </nav>
          </Reveal>

          <div className="mt-14 sm:mt-20 lg:mt-auto lg:pt-24">
            <MaskLines
              as="h1"
              id="tratamento-titulo"
              mount
              delay={0.2}
              lines={detail.titleLines}
              className="text-title font-light tracking-[-0.05em] text-deep"
              lineClassNames={[undefined, "pl-[0.6em] text-accent-display sm:pl-[0.9em]"]}
            />
            <Reveal mount delay={0.6} className="mt-8 max-w-[36ch] text-lead text-slate lg:ml-[0.3rem]">
              <p>{detail.lead}</p>
            </Reveal>
            <Reveal mount delay={0.75} className="mt-10 lg:ml-[0.3rem]">
              <BookingTrigger topic={treatment.topic} />
            </Reveal>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[30rem] sm:max-w-[34rem] lg:col-span-5 lg:col-start-8 lg:max-w-none">
          <Halo className="-right-[40%] -top-[25%] size-[140%]" strength={20} />
          <figure className="relative">
            <SmileReveal mount delay={0.35} duration={1.5} className="aspect-[4/5] rounded-media bg-ice">
              <Image
                src={photo.src}
                alt={photo.alt}
                preload
                fetchPriority="high"
                quality={80}
                placeholder="blur"
                sizes="(min-width: 1024px) 40vw, (min-width: 640px) 34rem, 92vw"
                className="absolute inset-0 size-full object-cover"
                style={{ objectPosition: photo.position }}
              />
            </SmileReveal>
            <figcaption className="mt-4 flex items-baseline justify-between gap-6 text-[0.8125rem] text-slate">
              <span>Imagem ilustrativa</span>
              <span aria-hidden="true" className="tabular text-[0.6875rem] tracking-[0.12em] text-accent-ink">
                {pad(position)} / {pad(total)}
              </span>
            </figcaption>
          </figure>
        </div>

        {/* Índice da página sobre a linha de referência. */}
        <Reveal mount delay={1} y={12} className="lg:col-span-12">
          <nav aria-labelledby="nesta-pagina" className="grid gap-y-3 border-t border-deep/10 pt-5 lg:grid-cols-12 lg:gap-x-6">
            <p id="nesta-pagina" className="text-[0.8125rem] text-slate lg:col-span-3">
              Nesta página
            </p>
            <ol className="grid grid-cols-2 gap-x-6 sm:grid-cols-4 lg:col-span-8 lg:col-start-5">
              {TREATMENT_SECTIONS.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="group/toc inline-flex min-h-11 items-center gap-3 text-[0.875rem] text-slate transition-colors duration-300 hover:text-deep"
                  >
                    <span aria-hidden="true" className="tabular text-[0.6875rem] tracking-[0.12em] text-accent-ink">
                      {pad(index + 1)}
                    </span>
                    <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat pb-0.5 transition-[background-size] duration-500 ease-out-expo group-hover/toc:bg-[length:100%_1px]">
                      {section.label}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </Reveal>
      </div>
    </section>
  );
}
