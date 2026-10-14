"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { process } from "@/content/home";
import { cn } from "@/lib/cn";
import { MaskLines, Reveal, useReduced } from "@/components/motion/primitives";

const W = 1200;
const SAG = 150;
const C = (SAG * 4) / 3;
const PATH = `M0 0 C ${W * 0.28} ${C}, ${W * 0.72} ${C}, ${W} 0`;
function pointAt(u: number) {
  const x = 3 * (1 - u) ** 2 * u * (W * 0.28) + 3 * (1 - u) * u ** 2 * (W * 0.72) + u ** 3 * W;
  const y = 3 * (1 - u) * u * C;
  return { x, y };
}

/** Encontra o parâmetro da curva cujo x corresponde à fração desejada da largura. */
function solveU(fraction: number): number {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    if (pointAt(mid).x / W < fraction) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// As colunas usam espaçamento percentual (gap de 2,5%), então o início de cada
// coluna é uma fração fixa da largura. Cada nó pousa no início da sua coluna.
const COLUMN_STARTS = [0.012, 0.266, 0.5225, 0.779];
const STOPS = COLUMN_STARTS.map(solveU);

/**
 * Como funciona: as quatro etapas pousam sobre o arco do sorriso, que se
 * desenha com a rolagem. Cada etapa se acende quando a linha chega até ela.
 */
export function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.6"] });
  const draw = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0, 1]);

  return (
    <section aria-labelledby="processo-title" className="relative py-section">
      <div className="container-edge">
        <MaskLines
          as="h2"
          id="processo-title"
          lines={["Como", "funciona"]}
          className="text-title font-light tracking-[-0.05em] lg:ml-[33%]"
          lineClassNames={[undefined, "pl-[1.4em]"]}
        />

        <div ref={ref} className="relative mt-16 lg:mt-24">
          {/* Desktop: etapas sobre o arco */}
          <div className="relative hidden lg:block">
            <svg aria-hidden="true" viewBox={`0 -10 ${W} ${SAG + 20}`} className="w-full overflow-visible" fill="none">
              <path d={PATH} className="stroke-deep/10" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <motion.path d={PATH} className="stroke-periwinkle" strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ pathLength: draw }} />
              {STOPS.map((u, index) => {
                const { x, y } = pointAt(u);
                return <Node key={index} x={x} y={y} progress={draw} threshold={u} />;
              })}
            </svg>
            <ol className="relative mt-8 grid grid-cols-4 gap-x-[2.5%]">
              {process.steps.map((step, index) => {
                const { y } = pointAt(STOPS[index]);
                return (
                  <li key={step.title} className="-ml-1.5" style={{ marginTop: `${(y / SAG) * 5}rem` }}>
                    <Step index={index} title={step.title} text={step.text} progress={draw} threshold={STOPS[index]} />
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Celular e tablet: linha vertical */}
          <ol className="relative flex flex-col gap-12 pl-10 lg:hidden">
            <span aria-hidden="true" className="absolute bottom-2 left-[0.55rem] top-2 w-px bg-deep/10" />
            <motion.span
              aria-hidden="true"
              className="absolute bottom-2 left-[0.55rem] top-2 w-px origin-top bg-periwinkle"
              style={{ scaleY: draw }}
            />
            {process.steps.map((step, index) => (
              <li key={step.title} className="relative">
                <span aria-hidden="true" className="absolute -left-10 top-1.5 grid size-[1.15rem] place-items-center rounded-full bg-porcelain ring-1 ring-periwinkle">
                  <span className="size-1.5 rounded-full bg-periwinkle" />
                </span>
                <Reveal>
                  <StepText index={index} title={step.title} text={step.text} />
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Node({ x, y, progress, threshold }: { x: number; y: number; progress: MotionValue<number>; threshold: number }) {
  const fill = useTransform(progress, [threshold - 0.04, threshold], [0, 1]);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={9} className="fill-porcelain stroke-periwinkle" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <motion.circle r={4.5} className="fill-periwinkle" style={{ scale: fill, opacity: fill }} />
    </g>
  );
}

function Step({
  index,
  title,
  text,
  progress,
  threshold,
}: {
  index: number;
  title: string;
  text: string;
  progress: MotionValue<number>;
  threshold: number;
}) {
  const opacity = useTransform(progress, [threshold - 0.08, threshold], [0.35, 1]);
  const y = useTransform(progress, [threshold - 0.08, threshold], [12, 0]);
  return (
    <motion.div style={{ opacity, y }}>
      <StepText index={index} title={title} text={text} />
    </motion.div>
  );
}

function StepText({ index, title, text }: { index: number; title: string; text: string }) {
  return (
    <div className="max-w-[30ch]">
      <span aria-hidden="true" className={cn("tabular font-serif text-[2.75rem] font-light italic leading-none text-accent-display")}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="mt-4 text-[1.35rem] font-normal tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 leading-relaxed text-slate">{text}</p>
    </div>
  );
}
