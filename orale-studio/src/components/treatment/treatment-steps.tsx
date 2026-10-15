"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { TreatmentStep } from "@/content/treatment-details";
import { cn } from "@/lib/cn";
import { EASE_OUT, useReduced } from "@/components/motion/primitives";

const COLUMNS: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/**
 * Etapas em sequência, ligadas pela linha de referência da marca, que se
 * desenha com a rolagem: vertical no celular, horizontal no desktop.
 */
export function TreatmentSteps({ steps, className }: { steps: readonly TreatmentStep[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.6"] });
  const draw = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0, 1]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Celular e tablet: linha vertical */}
      <span aria-hidden="true" className="absolute bottom-2 left-[0.55rem] top-2 w-px bg-deep/10 lg:hidden" />
      <motion.span
        aria-hidden="true"
        className="absolute bottom-2 left-[0.55rem] top-2 w-px origin-top bg-periwinkle lg:hidden"
        style={{ scaleY: draw }}
      />
      {/* Desktop: linha horizontal sobre as etapas */}
      <span aria-hidden="true" className="absolute inset-x-0 top-[0.55rem] hidden h-px bg-deep/10 lg:block" />
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 top-[0.55rem] hidden h-px origin-left bg-periwinkle lg:block"
        style={{ scaleX: draw }}
      />

      <ol className={cn("relative grid gap-12 pl-10 lg:gap-x-8 lg:pl-0 lg:pt-14", COLUMNS[steps.length] ?? "lg:grid-cols-4")}>
        {steps.map((step, index) => (
          <li key={step.title} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-10 top-2 grid size-[1.15rem] place-items-center rounded-full bg-ice ring-1 ring-periwinkle lg:-top-14 lg:left-0"
            >
              <motion.span
                className="size-1.5 rounded-full bg-periwinkle"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={reduce ? { duration: 0 } : { duration: 0.6, delay: 0.2 + index * 0.12, ease: EASE_OUT }}
              />
            </span>
            <motion.div
              data-reveal=""
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={reduce ? { duration: 0 } : { duration: 0.9, delay: index * 0.1, ease: EASE_OUT }}
              className="max-w-[32ch]"
            >
              <span aria-hidden="true" className="tabular font-serif text-[2.25rem] font-light italic leading-none text-accent-display">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-[1.25rem] font-normal tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-2.5 leading-relaxed text-slate">{step.text}</p>
            </motion.div>
          </li>
        ))}
      </ol>
    </div>
  );
}
