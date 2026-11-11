import Image from "next/image";
import { ArrowDown } from "lucide-react";
import type { CSSProperties } from "react";
import { hero } from "@/content/home";
import { photos } from "@/content/photos";
import { Tooth } from "@/components/brand/tooth";
import { Magnetic } from "@/components/motion/magnetic";
import { Slats } from "@/components/motion/slats";
import { ButtonLink } from "@/components/ui/button";
import { PhotoDraftCaption } from "@/components/ui/draft-note";
import { MaskHeading } from "@/components/ui/mask-heading";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";

/**
 * Primeira dobra. A entrada inteira é CSS (data-load): não espera o
 * JavaScript, então a página já "abre" no primeiro quadro.
 *
 * Sequência (cerca de 1,2 s): o título sobe linha a linha enquanto a fonte
 * assenta no peso final, a foto se abre em persiana de frisos turquesa, o
 * contorno do dente é desenhado e os frisos laterais crescem.
 *
 * A composição cita a fachada da clínica: painel turquesa, frisos cinza e o
 * dente em linha.
 */
export function Hero() {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative isolate overflow-clip pt-(--header-h)">
      <div className="container-edge grid min-h-[calc(100dvh-var(--header-h))] grid-cols-1 items-center gap-x-8 gap-y-12 pt-8 pb-16 lg:grid-cols-12 lg:pt-6 lg:pb-20">
        <div className="lg:col-span-7" data-load="">
          <p className="rv-fade text-[0.9375rem] font-medium text-teal" style={{ "--d": "60ms" } as CSSProperties}>
            Clínica odontológica no Jardim São Luís, São Paulo
          </p>

          <MaskHeading
            as="h1"
            id="hero-title"
            load
            delay={120}
            lines={hero.titleLines}
            className="hero-title mt-5 [--wght:590]"
          />

          <p className="rv-fade mt-7 max-w-[46ch] text-lead text-stone" style={{ "--d": "520ms" } as CSSProperties}>
            {hero.subtitle}
          </p>

          <div className="rv-fade mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ "--d": "640ms" } as CSSProperties}>
            <Magnetic>
              <WhatsAppLink label={hero.primaryCta} size="lg" className="w-full sm:w-auto" />
            </Magnetic>
            <ButtonLink href="/#clinica" variant="outline" size="lg">
              {hero.secondaryCta}
            </ButtonLink>
          </div>

          {/* Indicador de rolagem (pedido no briefing): um friso vertical que escorre. */}
          <a
            href="#clinica"
            className="rv-fade mt-14 hidden items-center gap-3 text-[0.8125rem] font-medium text-stone transition-colors duration-300 hover:text-forest lg:inline-flex"
            style={{ "--d": "900ms" } as CSSProperties}
          >
            <span aria-hidden="true" className="relative block h-10 w-px overflow-hidden bg-fog">
              <span className="scroll-cue absolute inset-0 bg-teal" />
            </span>
            Role para conhecer
            <ArrowDown aria-hidden="true" size={14} strokeWidth={1.75} />
          </a>
        </div>

        <figure className="lg:col-span-5" data-load="">
          <div className="relative">
            {/* Painel turquesa da fachada, deslocado atrás da foto. */}
            <div aria-hidden="true" className="drift-y absolute -right-(--spacing-gutter) -bottom-8 h-[62%] w-[72%] bg-turquoise [--drift:-5%] lg:-right-10 lg:-bottom-10" />

            {/* Frisos cinza, como os das laterais da fachada. */}
            <div aria-hidden="true" className="drift-x absolute top-10 -left-14 hidden w-24 space-y-2.5 [--drift:10%] lg:block">
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index} className="rv-grow block h-2.5 origin-right bg-slat" style={{ "--i": index, "--d": "500ms" } as CSSProperties} />
              ))}
            </div>

            <Slats mode="load" count={7} delay={150} color="var(--color-turquoise)" className="aspect-[4/5] w-full bg-mist">
              <Image
                src={photos.hero.src}
                alt={photos.hero.alt}
                placeholder="blur"
                preload
                fetchPriority="high"
                loading="eager"
                quality={80}
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="h-full w-full object-cover"
              />
            </Slats>

            {/* Abertura da marca: o contorno do dente desenhado em traço único. */}
            <Tooth
              className="absolute -bottom-10 -left-6 h-32 w-auto text-turquoise lg:-bottom-14 lg:-left-20 lg:h-52"
              strokeWidth={1.2}
              pathClassName="rv-draw [--d:450ms] [--draw-duration:1.15s]"
            />
          </div>

          {photos.hero.provisional ? <PhotoDraftCaption className="mt-12 text-right lg:mt-14" /> : null}
        </figure>
      </div>
    </section>
  );
}
