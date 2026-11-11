import Image from "next/image";
import type { CSSProperties } from "react";
import { teamSection } from "@/content/home";
import { team, teamPlaceholderCount } from "@/content/team";
import { Tooth } from "@/components/brand/tooth";
import { Slats } from "@/components/motion/slats";
import { DraftNote } from "@/components/ui/draft-note";
import { MaskHeading } from "@/components/ui/mask-heading";
import { SwipeRow } from "@/components/ui/swipe-row";

const itemClass = "w-[68vw] sm:w-[40vw] lg:w-auto lg:[&:nth-child(3n+2)]:mt-14 lg:[&:nth-child(3n)]:mt-28";

/**
 * Equipe. Com perfis cadastrados em src/content/team.ts, mostra retratos,
 * nomes, funções e especialidades. Sem perfis, mostra molduras provisórias
 * claramente identificadas (nenhum nome é inventado).
 */
export function Team() {
  const hasMembers = team.length > 0;
  return (
    <section id="equipe" aria-labelledby="equipe-title" className="py-(--spacing-section)">
      <div className="container-edge grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)]">
            <MaskHeading id="equipe-title" lines={[teamSection.title]} className="text-title [--wght:570]" />
            <p data-reveal="" className="rv-fade mt-5 max-w-[40ch] text-lead text-stone">
              {teamSection.lead}
            </p>
            {hasMembers ? null : <DraftNote className="mt-5">{teamSection.draftNote}</DraftNote>}
          </div>
        </div>

        <div className="-mr-(--spacing-gutter) lg:col-span-8 lg:mr-0">
          <SwipeRow until="lg" label="Equipe" focusable={!hasMembers} listClassName="gap-4 pr-(--spacing-gutter) lg:grid lg:grid-cols-3 lg:gap-6 lg:pr-0">
            {hasMembers
              ? team.map((member) => (
                  <li key={member.name} className={itemClass}>
                    <figure>
                      {member.photo ? (
                        <Slats mode="view" count={6} className="aspect-[3/4] bg-mist">
                          <Image
                            src={member.photo.src}
                            alt={member.photo.alt}
                            placeholder="blur"
                            sizes="(min-width: 1024px) 20vw, 68vw"
                            className="h-full w-full object-cover"
                          />
                        </Slats>
                      ) : (
                        <PortraitFrame />
                      )}
                      <figcaption className="mt-4">
                        <p className="display text-[1.375rem] leading-tight [--wght:600]">{member.name}</p>
                        <p className="mt-1.5 text-[0.9375rem] text-stone">
                          {[member.role, member.specialty].filter(Boolean).join(", ")}
                        </p>
                        {member.registration ? <p className="tabular mt-1 text-[0.8125rem] text-stone">{member.registration}</p> : null}
                      </figcaption>
                    </figure>
                  </li>
                ))
              : Array.from({ length: teamPlaceholderCount }, (_, index) => (
                  <li key={index} className={itemClass}>
                    <PortraitFrame />
                    <p className="display mt-4 text-[1.375rem] leading-tight [--wght:600]">Perfil a publicar</p>
                    <p className="mt-1.5 text-[0.9375rem] text-stone">Nome, função e especialidade</p>
                  </li>
                ))}
          </SwipeRow>
        </div>
      </div>
    </section>
  );
}

/** Moldura de retrato vazia: frisos e o contorno do dente, sem rosto genérico. */
function PortraitFrame() {
  return (
    <div data-reveal="" className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-brand bg-mist">
      <div aria-hidden="true" className="absolute inset-x-0 top-[12%] space-y-[7%] px-[14%]">
        {Array.from({ length: 3 }, (_, index) => (
          <span key={index} className="rv-grow block h-[3px] origin-left bg-fog" style={{ "--i": index } as CSSProperties} />
        ))}
      </div>
      <Tooth className="h-[34%] w-auto text-slat" strokeWidth={1.6} pathClassName="rv-draw [--draw-duration:1.6s]" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-[12%] space-y-[7%] px-[14%]">
        {Array.from({ length: 3 }, (_, index) => (
          <span key={index} className="rv-grow block h-[3px] origin-right bg-fog" style={{ "--i": index + 3 } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
