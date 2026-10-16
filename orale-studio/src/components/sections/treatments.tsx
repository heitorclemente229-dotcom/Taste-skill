import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { treatments, type Treatment } from "@/content/treatments";
import { photos } from "@/content/photos";
import { cn } from "@/lib/cn";
import { MaskLines, Reveal, SmileReveal } from "@/components/motion/primitives";

/**
 * Nossos cuidados: grade editorial com três composições alternadas
 * (fotografia em destaque, painel com imagem embutida e cartão tipográfico),
 * espelhadas entre a primeira e a segunda metade para criar ritmo.
 */
const LAYOUT: Record<string, { variant: "feature" | "inset" | "text"; className: string }> = {
  ortodontia: { variant: "feature", className: "lg:col-span-7 lg:row-span-2 lg:col-start-1 lg:row-start-1" },
  "clareamento-dental": { variant: "text", className: "lg:col-span-5 lg:col-start-8 lg:row-start-1" },
  implantes: { variant: "inset", className: "lg:col-span-5 lg:col-start-8 lg:row-start-2" },
  "estetica-odontologica": { variant: "feature", className: "lg:col-span-7 lg:row-span-2 lg:col-start-6 lg:row-start-3" },
  "prevencao-e-limpeza": { variant: "inset", className: "lg:col-span-5 lg:col-start-1 lg:row-start-3" },
  "tratamentos-restauradores": { variant: "text", className: "lg:col-span-5 lg:col-start-1 lg:row-start-4" },
};

export function Treatments() {
  return (
    <section id="tratamentos" aria-labelledby="tratamentos-title" className="relative pb-section">
      <div className="container-edge">
        <div className="max-w-3xl">
          <MaskLines
            as="h2"
            id="tratamentos-title"
            lines={["Nossos", "cuidados"]}
            className="text-title font-light tracking-[-0.05em]"
            lineClassNames={[undefined, "pl-[1.2em]"]}
          />
          <Reveal className="mt-8 max-w-[38ch] text-lead text-slate lg:ml-[0.3rem]">
            <p>Tratamentos indicados a partir de uma avaliação individual, sem pacotes prontos.</p>
          </Reveal>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-24 lg:grid-cols-12 lg:gap-6">
          {treatments.map((treatment, index) => {
            const layout = LAYOUT[treatment.slug] ?? { variant: "text", className: "lg:col-span-6" };
            return (
              <Reveal
                as="li"
                key={treatment.slug}
                delay={(index % 2) * 0.08}
                className={cn(layout.variant === "feature" ? "sm:col-span-2" : "", layout.className)}
              >
                {layout.variant === "feature" ? (
                  <FeatureCard treatment={treatment} />
                ) : layout.variant === "inset" ? (
                  <InsetCard treatment={treatment} />
                ) : (
                  <TextCard treatment={treatment} />
                )}
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function CardLink({ treatment, className }: { treatment: Treatment; className?: string }) {
  return (
    <Link
      href={`/tratamentos/${treatment.slug}`}
      className={cn(
        "outline-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent-ink",
        className,
      )}
    >
      {treatment.title}
    </Link>
  );
}

function DetailsCue({ tone = "deep" }: { tone?: "deep" | "light" }) {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-3 text-[0.9rem] font-medium">
      Ver detalhes
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full transition-[transform,background-color] duration-500 ease-out-expo group-hover/card:rotate-45",
          tone === "deep" ? "bg-deep text-white group-hover/card:bg-periwinkle" : "bg-white text-deep",
        )}
      >
        <ArrowUpRight className="size-4" strokeWidth={1.6} />
      </span>
    </span>
  );
}

function FeatureCard({ treatment }: { treatment: Treatment }) {
  const photo = photos[treatment.photo];
  return (
    <article className="group/card relative flex h-full flex-col rounded-media">
      <SmileReveal className="aspect-[4/3] rounded-media bg-ice lg:aspect-auto lg:min-h-[34rem] lg:flex-1">
        <Image
          src={photo.src}
          alt={photo.alt}
          placeholder="blur"
          quality={70}
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="absolute inset-0 size-full object-cover transition-transform duration-[1400ms] ease-out-expo group-hover/card:scale-[1.04]"
          style={{ objectPosition: photo.position }}
        />
      </SmileReveal>
      <div className="flex flex-col gap-4 pt-7 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
        <div>
          <h3 className="text-[2rem] font-light leading-[1.05] tracking-[-0.035em] lg:text-[2.4rem]">
            <CardLink treatment={treatment} />
          </h3>
          <p className="mt-3 max-w-[42ch] leading-relaxed text-slate">{treatment.summary}</p>
        </div>
        <DetailsCue />
      </div>
    </article>
  );
}

function InsetCard({ treatment }: { treatment: Treatment }) {
  const photo = photos[treatment.photo];
  return (
    <article className="group/card relative grid h-full grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] gap-5 rounded-surface bg-ice p-5 transition-colors duration-500 hover:bg-ice-strong sm:p-6">
      <div className="flex flex-col justify-between gap-8 py-1 pl-1">
        <div>
          <h3 className="text-[1.65rem] font-light leading-[1.08] tracking-[-0.03em]">
            <CardLink treatment={treatment} />
          </h3>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">{treatment.summary}</p>
        </div>
        <DetailsCue />
      </div>
      <div className="relative overflow-hidden rounded-[1rem] bg-white">
        <Image
          src={photo.src}
          alt={photo.alt}
          placeholder="blur"
          quality={70}
          sizes="(min-width: 1024px) 18vw, (min-width: 640px) 22vw, 42vw"
          className="absolute inset-0 size-full object-cover transition-transform duration-[1400ms] ease-out-expo group-hover/card:scale-[1.06]"
          style={{ objectPosition: photo.position }}
        />
      </div>
    </article>
  );
}

function TextCard({ treatment }: { treatment: Treatment }) {
  const photo = photos[treatment.photo];
  return (
    <article className="group/card relative flex h-full flex-col justify-between gap-10 rounded-surface bg-white p-7 ring-1 ring-inset ring-line transition-shadow duration-500 hover:ring-periwinkle/40 sm:p-8">
      <div className="flex items-start justify-between gap-6">
        <h3 className="text-[1.9rem] font-light leading-[1.05] tracking-[-0.035em]">
          <CardLink treatment={treatment} />
        </h3>
        <span className="relative size-20 shrink-0 overflow-hidden rounded-full bg-ice ring-4 ring-porcelain sm:size-24">
          <Image
            src={photo.src}
            alt=""
            placeholder="blur"
            quality={70}
            sizes="96px"
            className="absolute inset-0 size-full object-cover transition-transform duration-[1400ms] ease-out-expo group-hover/card:scale-110"
            style={{ objectPosition: photo.position }}
          />
        </span>
      </div>
      <div className="flex flex-col gap-6">
        <p className="max-w-[40ch] text-[0.95rem] leading-relaxed text-slate">{treatment.summary}</p>
        <DetailsCue />
      </div>
    </article>
  );
}
