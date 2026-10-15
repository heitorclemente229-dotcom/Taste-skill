import Image from "next/image";
import { team } from "@/content/home";
import { photos } from "@/content/photos";
import { cn } from "@/lib/cn";
import { ArcDivider } from "@/components/motion/arc-divider";
import { MaskLines, Reveal, SmileReveal } from "@/components/motion/primitives";
import { DemoNote } from "@/components/ui/demo-note";

/**
 * Quem cuida: retratos editoriais em alturas escalonadas.
 * No celular, os perfis viram uma faixa deslizante.
 */
const OFFSETS = ["lg:mt-0", "lg:mt-28", "lg:mt-14"];

export function Team() {
  return (
    <section id="equipe" aria-labelledby="equipe-title" className="relative bg-porcelain py-section">
      <ArcDivider fill="porcelain" shape="dome" />
      <div className="container-edge">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-6">
            <MaskLines as="h2" id="equipe-title" lines={[team.title]} className="text-heading font-light tracking-[-0.045em]" />
            <Reveal className="mt-6 max-w-[40ch] text-lead text-slate">
              <p>{team.lead}</p>
            </Reveal>
          </div>
          {team.isPlaceholder ? (
            <Reveal className="lg:col-span-5 lg:col-start-8 lg:self-end lg:justify-self-end">
              <DemoNote>Perfis ilustrativos. Substitua por nomes, fotos e registros profissionais (CRO) reais da equipe.</DemoNote>
            </Reveal>
          ) : null}
        </div>

        <ul
          aria-label="Profissionais"
          tabIndex={0}
          className="-mx-[var(--spacing-gutter)] mt-16 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--spacing-gutter)] pb-4 outline-offset-4 [scrollbar-width:none] lg:mx-0 lg:mt-24 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {team.members.map((member, index) => {
            const photo = photos[member.photo];
            return (
              <Reveal as="li" key={index} delay={index * 0.1} className={cn("w-[74%] shrink-0 snap-start sm:w-[44%] lg:w-auto", OFFSETS[index])}>
                <figure className="group/member">
                  <SmileReveal className="aspect-[3/4] rounded-media bg-ice">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      placeholder="blur"
                      quality={70}
                      sizes="(min-width: 1024px) 28vw, 74vw"
                      className="absolute inset-0 size-full object-cover saturate-[0.82] transition-[transform,filter] duration-[1400ms] ease-out-expo group-hover/member:scale-[1.03] group-hover/member:saturate-100"
                      style={{ objectPosition: photo.position }}
                    />
                  </SmileReveal>
                  <figcaption className="mt-6 flex flex-col gap-1">
                    <span className="text-[1.3rem] font-light tracking-[-0.02em] text-deep">{member.name}</span>
                    <span className="text-[0.95rem] text-slate">{member.role}</span>
                    <span className="tabular mt-2 text-xs tracking-[0.06em] text-slate">{member.registry}</span>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
