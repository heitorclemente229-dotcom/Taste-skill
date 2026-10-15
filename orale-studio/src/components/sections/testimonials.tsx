"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { testimonials } from "@/content/home";
import { cn } from "@/lib/cn";
import { DemoNote } from "@/components/ui/demo-note";
import { EASE_OUT, MaskLines, Reveal, useReduced } from "@/components/motion/primitives";

/**
 * Histórias reais: um relato por vez, em serifa editorial.
 * Os conteúdos atuais são espaços demonstrativos (ver src/content/home.ts).
 */
export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduce = useReduced();
  const regionId = useId();
  const items = testimonials.items;
  const current = items[index];

  const go = (step: number) => {
    setDirection(step);
    setIndex((value) => (value + step + items.length) % items.length);
  };

  return (
    <section aria-labelledby="historias-title" className="relative overflow-hidden py-section">
      <div aria-hidden="true" className="halo pointer-events-none absolute -left-[20%] top-[10%] size-[46rem] rounded-full opacity-70" />
      <div className="container-edge relative grid gap-14 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col justify-between gap-10 lg:col-span-4">
          <div>
            <MaskLines as="h2" id="historias-title" lines={["Histórias", "reais"]} className="text-heading font-light tracking-[-0.045em]" />
            {testimonials.isPlaceholder ? (
              <Reveal className="mt-8">
                <DemoNote>Espaços para relatos reais e autorizados. Nenhum depoimento foi inventado.</DemoNote>
              </Reveal>
            ) : null}
          </div>

          <div className="flex items-center gap-5">
            <div className="flex gap-2">
              <ControlButton label="Relato anterior" onClick={() => go(-1)} controls={regionId}>
                <ArrowLeft className="size-[1.1rem]" strokeWidth={1.6} aria-hidden="true" />
              </ControlButton>
              <ControlButton label="Próximo relato" onClick={() => go(1)} controls={regionId}>
                <ArrowRight className="size-[1.1rem]" strokeWidth={1.6} aria-hidden="true" />
              </ControlButton>
            </div>
            <div aria-hidden="true" className="flex gap-1.5">
              {items.map((_, itemIndex) => (
                <span key={itemIndex} className="relative h-px w-10 overflow-hidden bg-deep/15">
                  <motion.span
                    className="absolute inset-0 origin-left bg-deep"
                    initial={false}
                    animate={{ scaleX: itemIndex === index ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.7, ease: EASE_OUT }}
                  />
                </span>
              ))}
            </div>
            <span className="sr-only" aria-live="polite">
              Relato {index + 1} de {items.length}
            </span>
          </div>
        </div>

        <div id={regionId} className="relative min-h-[18rem] lg:col-span-7 lg:col-start-6 lg:min-h-[22rem]">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.figure
              key={index}
              custom={direction}
              initial={{ opacity: 0, x: reduce ? 0 : direction * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduce ? 0 : direction * -20 }}
              transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT }}
              className="flex flex-col gap-10"
            >
              <blockquote className="font-serif text-[clamp(1.85rem,3.4vw,3rem)] font-light italic leading-[1.22] tracking-[-0.01em] text-deep">
                <span aria-hidden="true" className="mr-1 text-accent-display">
                  &ldquo;
                </span>
                {current.quote}
                <span aria-hidden="true" className="ml-1 text-accent-display">
                  &rdquo;
                </span>
              </blockquote>
              <figcaption className="flex items-center gap-4">
                <span aria-hidden="true" className="h-px w-10 bg-deep/30" />
                <span className="flex flex-col">
                  <span className="text-[0.95rem] font-medium text-deep">{current.author}</span>
                  <span className="text-sm text-slate">{current.context}</span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ControlButton({
  label,
  onClick,
  controls,
  children,
}: {
  label: string;
  onClick: () => void;
  controls: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        "grid size-12 place-items-center rounded-full text-deep ring-1 ring-inset ring-deep/20 transition-[background-color,color,box-shadow,transform] duration-300 ease-out-expo",
        "hover:bg-deep hover:text-white hover:ring-deep active:scale-95",
      )}
    >
      {children}
    </button>
  );
}
