"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { hero } from "@/content/home";
import { photos } from "@/content/photos";
import { ArrowLink } from "@/components/ui/button";
import { BookingTrigger } from "@/components/booking/booking-context";
import { EASE_OUT, EASE_SMILE, Halo, MaskLines, Reveal, SmileReveal, useReduced } from "@/components/motion/primitives";

/**
 * Primeira dobra: composição editorial assimétrica.
 * Tipografia à esquerda, fotografia com recorte "sorriso" à direita, halo de
 * luz que segue o ponteiro, anel de precisão que gira com a rolagem e um
 * detalhe macro sobreposto.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const ringRotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 70]);
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 70]);
  const photoScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.06, 1.16]);
  const detailY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -50]);
  const copyY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 40]);

  return (
    <section ref={ref} id="inicio" aria-labelledby="hero-title" className="relative isolate overflow-hidden pt-[var(--header-h)]">
      <div className="container-edge relative grid min-h-[calc(100dvh-var(--header-h))] grid-cols-1 content-center gap-y-14 pb-14 pt-8 lg:grid-cols-12 lg:gap-x-6 lg:pb-16 lg:pt-4">
        <motion.div style={{ y: copyY }} className="relative z-10 lg:col-span-7 lg:self-center">
          <MaskLines
            as="h1"
            id="hero-title"
            mount
            delay={0.25}
            lines={hero.titleLines}
            className="text-[12.4vw] font-light leading-[0.94] tracking-[-0.055em] text-deep sm:text-[11vw] lg:text-[min(7.6vw,7rem)]"
            lineClassNames={[undefined, "pl-[0.9em] text-accent-display lg:pl-[1.15em]"]}
          />

          <Reveal mount delay={0.9} className="mt-9 max-w-[30ch] text-lead text-slate sm:mt-11 lg:ml-[0.4rem]">
            <p>{hero.lead}</p>
          </Reveal>

          <Reveal mount delay={1.05} className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4 lg:ml-[0.4rem]">
            <BookingTrigger />
            <ArrowLink href={hero.secondary.href}>{hero.secondary.label}</ArrowLink>
          </Reveal>
        </motion.div>

        <div className="relative mx-auto w-full max-w-[30rem] sm:max-w-[34rem] lg:col-span-5 lg:col-start-8 lg:max-w-none lg:self-center">
          <Halo className="-left-[45%] -top-[30%] size-[150%] sm:-left-[35%]" scrollProgress={scrollYProgress} drift={120} />

          {/* Anel de precisão: gira com a rolagem; o ponto marca a luz. */}
          <motion.div
            aria-hidden="true"
            className="absolute -left-[13%] -top-[9%] z-10 size-[42%] lg:-left-[18%] lg:-top-[7%]"
            style={{ rotate: ringRotate }}
          >
            <svg viewBox="0 0 200 200" className="size-full overflow-visible" fill="none">
              <motion.circle
                cx="100"
                cy="100"
                r="98"
                className="stroke-periwinkle/55"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={reduce ? { duration: 0 } : { duration: 2, delay: 0.9, ease: EASE_SMILE }}
              />
              <motion.circle
                cx="198"
                cy="100"
                r="4"
                className="fill-periwinkle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ transformOrigin: "198px 100px" }}
                transition={reduce ? { duration: 0 } : { duration: 0.6, delay: 2.2, ease: EASE_OUT }}
              />
            </svg>
          </motion.div>

          <motion.div style={{ y: photoY }} className="relative">
            <SmileReveal mount shape="smile" depth={0.075} delay={0.45} duration={1.6} className="aspect-[4/5] rounded-t-media bg-ice">
              <motion.div className="absolute inset-0" style={{ scale: photoScale }}>
                <Image
                  src={photos.heroSmile.src}
                  alt={photos.heroSmile.alt}
                  preload
                  fetchPriority="high"
                  quality={80}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 34rem, 92vw"
                  className="size-full object-cover"
                  style={{ objectPosition: photos.heroSmile.position }}
                />
              </motion.div>
            </SmileReveal>
          </motion.div>

          {/* Detalhe macro sobreposto, em outra profundidade de rolagem. */}
          <motion.div
            style={{ y: detailY }}
            className="absolute -bottom-[7%] -left-[6%] z-10 w-[36%] sm:-left-[12%] lg:-left-[24%] lg:bottom-[9%] lg:w-[38%]"
          >
            <SmileReveal mount delay={1.15} duration={1.3} className="aspect-[4/5] rounded-surface bg-ice shadow-[0_30px_60px_-30px_rgb(21_43_58/0.5)] ring-[6px] ring-porcelain">
              <Image
                src={photos.heroDetail.src}
                alt={photos.heroDetail.alt}
                quality={70}
                placeholder="blur"
                sizes="(min-width: 1024px) 15vw, 34vw"
                className="size-full object-cover"
                style={{ objectPosition: photos.heroDetail.position }}
              />
            </SmileReveal>
          </motion.div>
        </div>

        {/* Indicador de rolagem: um traço de luz descendo pela linha. */}
        <motion.div
          aria-hidden="true"
          className="absolute bottom-8 left-[var(--spacing-gutter)] hidden h-16 w-px overflow-hidden bg-deep/12 lg:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduce ? { duration: 0 } : { duration: 1, delay: 1.8 }}
        >
          <span className="absolute inset-x-0 top-0 h-6 animate-scroll-light bg-gradient-to-b from-transparent via-periwinkle to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
