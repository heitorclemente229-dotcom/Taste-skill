"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { manifesto } from "@/content/home";
import { ArcLine, MaskLines, useReduced } from "@/components/motion/primitives";

/**
 * Manifesto: uma declaração editorial em serifa, com muito espaço negativo.
 * As palavras ganham presença conforme a leitura avança na rolagem.
 */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.55"] });
  const words = manifesto.statement.split(" ");

  return (
    <section ref={ref} id="manifesto" aria-labelledby="manifesto-title" className="relative py-section">
      <div className="container-edge">
        {/* O fio do arco continua a partir da primeira dobra, com o ponto de luz. */}
        <ArcLine mode="scroll" lightPoint width={1200} sag={96} className="mb-16 w-full lg:mb-28" />

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-3">
            <MaskLines
              as="h2"
              id="manifesto-title"
              lines={["Além do", "sorriso"]}
              className="text-[2.6rem] font-light leading-[1] tracking-[-0.045em] lg:text-[3.1rem]"
            />
            <span aria-hidden="true" className="mt-8 flex items-center gap-1.5">
              <span className="h-px w-16 bg-deep/30" />
              <span className="size-1.5 rounded-full bg-periwinkle" />
            </span>
          </div>

          <p className="font-serif text-statement font-light tracking-[-0.01em] text-deep lg:col-span-8 lg:col-start-5">
            {words.map((word, index) => (
              <Word key={index} progress={scrollYProgress} range={[index / words.length, (index + 1) / words.length]} reduce={reduce}>
                {word}
              </Word>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

function Word({
  children,
  progress,
  range,
  reduce,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  reduce: boolean;
}) {
  const opacity = useTransform(progress, range, reduce ? [1, 1] : [0.18, 1]);
  return (
    <>
      <motion.span style={{ opacity }} className="inline">
        {children}
      </motion.span>{" "}
    </>
  );
}
