import Image from "next/image";
import { Accessibility, Rainbow, Store } from "lucide-react";
import type { CSSProperties } from "react";
import { showDraftNotes } from "@/config/site";
import { about } from "@/content/home";
import { photos } from "@/content/photos";
import { Slats } from "@/components/motion/slats";
import { DraftNote, PhotoDraftCaption } from "@/components/ui/draft-note";
import { MaskHeading } from "@/components/ui/mask-heading";
import { Gallery } from "./gallery";

const FACT_ICONS = [Accessibility, Rainbow, Store] as const;

/**
 * "A clínica": composição editorial. O título ocupa a largura, a foto grande
 * e a foto menor ficam em alturas diferentes (e deslizam em velocidades
 * diferentes com a rolagem, em CSS) e os quatro destaques entram como uma
 * lista tipográfica com frisos que crescem.
 */
export function About() {
  return (
    <section id="clinica" aria-labelledby="clinica-title" className="pt-(--spacing-section)">
      <div className="container-edge">
        <MaskHeading id="clinica-title" lines={about.titleLines} className="text-title [--wght:570]" />

        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 lg:mt-20 lg:grid-cols-12">
          <figure className="lg:col-span-7">
            <Slats mode="view" count={6} className="aspect-[3/2] bg-mist">
              <Image
                src={photos.clinicaAtendimento.src}
                alt={photos.clinicaAtendimento.alt}
                placeholder="blur"
                sizes="(min-width: 1024px) 56vw, 100vw"
                className="h-full w-full object-cover"
              />
            </Slats>
            {photos.clinicaAtendimento.provisional ? <PhotoDraftCaption /> : null}
          </figure>

          <div className="lg:col-span-4 lg:col-start-9 lg:pt-6">
            <p data-reveal="" className="rv-fade text-lead text-forest">
              {about.lead}
            </p>
            {showDraftNotes ? (
              <DraftNote className="mt-6">
                Texto institucional a validar. Ele usa apenas o que foi informado e pode ganhar a história da clínica.
              </DraftNote>
            ) : null}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 lg:mt-8 lg:grid-cols-12 lg:items-end">
          <ul data-reveal="" className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:col-span-7 lg:pt-16">
            {about.highlights.map((item, index) => (
              <li key={item.title} className="relative pt-5">
                <span aria-hidden="true" className="rv-grow absolute inset-x-0 top-0 block h-0.5 origin-left bg-turquoise" style={{ "--i": index } as CSSProperties} />
                <h3 className="rv-fade display text-heading [--wght:560]" style={{ "--i": index } as CSSProperties}>
                  {item.title}
                </h3>
                <p className="rv-fade mt-2.5 max-w-[34ch] text-stone" style={{ "--i": index + 1 } as CSSProperties}>
                  {item.text}
                </p>
              </li>
            ))}
          </ul>

          <figure className="drift-y lg:col-span-4 lg:col-start-9 lg:-mt-40 [--drift:7%]">
            <Slats mode="view" count={6} className="aspect-[3/4] bg-mist">
              <Image
                src={photos.clinicaEstrutura.src}
                alt={photos.clinicaEstrutura.alt}
                placeholder="blur"
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="h-full w-full object-cover"
              />
            </Slats>
            {photos.clinicaEstrutura.provisional ? <PhotoDraftCaption /> : null}
          </figure>
        </div>

        <div data-reveal="" className="mt-16 border-t border-fog pt-8 lg:mt-24 lg:flex lg:items-baseline lg:gap-12">
          <h3 className="rv-fade display shrink-0 text-[1.25rem] [--wght:580]">{about.profileFacts.title}</h3>
          <div className="mt-5 lg:mt-0">
            <ul className="flex flex-col gap-x-10 gap-y-3 sm:flex-row sm:flex-wrap">
              {about.profileFacts.items.map((item, index) => {
                const Icon = FACT_ICONS[index % FACT_ICONS.length];
                return (
                  <li key={item} className="rv-fade flex items-center gap-2.5 text-[0.9375rem] font-medium" style={{ "--i": index + 1 } as CSSProperties}>
                    <Icon aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0 text-teal" />
                    {item}
                  </li>
                );
              })}
            </ul>
            <p className="rv-fade mt-3 text-[0.8125rem] text-stone" style={{ "--i": 4 } as CSSProperties}>
              {about.profileFacts.source}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-(--spacing-section)">
        <div className="container-edge">
          <h3 data-reveal="" className="rv-fade display text-heading [--wght:560]">
            {about.galleryTitle}
          </h3>
          {showDraftNotes ? <DraftNote className="mt-3">Galeria com fotos de banco de imagens, até a chegada das fotos reais da clínica.</DraftNote> : null}
        </div>
        <div className="bleed-right mt-8 lg:mt-10">
          <Gallery />
        </div>
      </div>
    </section>
  );
}
