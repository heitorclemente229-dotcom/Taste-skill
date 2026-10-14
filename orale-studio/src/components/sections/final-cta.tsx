"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { contact } from "@/config/site";
import { finalCta } from "@/content/home";
import { ArcDivider } from "@/components/motion/arc-divider";
import { ArcLine, EASE_SMILE, Halo, MaskLines, Reveal, useReduced } from "@/components/motion/primitives";
import { BookingTrigger } from "@/components/booking/booking-context";

/**
 * Vamos conversar: encerramento em azul profundo. Retoma a primeira dobra
 * com o halo de luz, o anel de precisão e o arco, agora invertido em cúpula.
 */
export function FinalCta() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const ringRotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-40, 40]);

  return (
    <section ref={ref} aria-labelledby="conversar-title" className="on-deep relative isolate bg-deep pb-24 pt-section text-white lg:pb-32">
      <ArcDivider fill="deep" shape="dome" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <Halo tone="deep" className="-right-[10%] top-[-10%] size-[58rem] max-w-none" scrollProgress={scrollYProgress} drift={-80} />
      </div>

      <div className="container-edge relative grid gap-14 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-7">
          <MaskLines
            as="h2"
            id="conversar-title"
            lines={["Vamos", "conversar"]}
            className="text-display font-light leading-[0.94] tracking-[-0.055em] lg:text-[min(8vw,7.5rem)]"
            lineClassNames={[undefined, "pl-[0.8em] text-periwinkle-soft"]}
          />
          <Reveal className="mt-10 max-w-[36ch] text-lead text-mineral lg:ml-[0.4rem]">
            <p>{finalCta.text}</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5 lg:ml-[0.4rem]">
            <BookingTrigger variant="light" />
            <a
              href={contact.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group/wa inline-flex items-center gap-2 py-2 text-[0.95rem] font-medium text-white"
            >
              <span className="border-b border-white/30 pb-1 transition-colors duration-300 group-hover/wa:border-white">
                WhatsApp {contact.whatsapp.display}
              </span>
            </a>
          </Reveal>
        </div>

        <div aria-hidden="true" className="relative hidden lg:col-span-5 lg:block">
          <motion.div className="absolute right-[6%] top-[4%] size-[22rem]" style={{ rotate: ringRotate }}>
            <svg viewBox="0 0 200 200" className="size-full overflow-visible" fill="none">
              <motion.circle
                cx="100"
                cy="100"
                r="98"
                className="stroke-periwinkle-soft/45"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={reduce ? { duration: 0 } : { duration: 2.2, ease: EASE_SMILE }}
              />
              <circle cx="2" cy="100" r="4" className="fill-periwinkle-soft" />
            </svg>
          </motion.div>
          <ArcLine
            flip
            width={600}
            sag={120}
            className="absolute bottom-[8%] right-0 w-[92%]"
            strokeClassName="stroke-periwinkle-soft/50"
            pointClassName="fill-periwinkle-soft"
            lightPoint
          />
        </div>
      </div>
    </section>
  );
}
