"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { useReduced } from "@/components/motion/primitives";

const FILLS = {
  ice: "fill-ice",
  porcelain: "fill-porcelain",
  deep: "fill-deep",
  white: "fill-white",
} as const;

/**
 * Transição proprietária "do arco à linha": a borda superior de uma seção
 * nasce curva (arco do sorriso ou cúpula de luz) e se assenta em linha reta
 * conforme a seção sobe na tela. Posicione dentro de uma seção `relative`.
 */
export function ArcDivider({
  fill,
  shape = "smile",
  className,
}: {
  fill: keyof typeof FILLS;
  shape?: "smile" | "dome";
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReduced();
  const { scrollYProgress } = useScroll({ target: ref as unknown as RefObject<HTMLElement | null>, offset: ["start end", "end 0.35"] });
  const amplitude = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [110, 0]);
  const d = useTransform(amplitude, (a) => {
    const c = (a * 4) / 3;
    if (shape === "dome") {
      return `M0 120 C 403 ${120 - c}, 1037 ${120 - c}, 1440 120 L1440 121 L0 121 Z`;
    }
    const edge = 120 - a;
    return `M0 121 L0 ${edge} C 403 ${edge + c}, 1037 ${edge + c}, 1440 ${edge} L1440 121 Z`;
  });

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-x-0 bottom-full h-[clamp(3rem,8vw,7.5rem)] w-full", className)}
    >
      <motion.path d={d} className={FILLS[fill]} />
    </svg>
  );
}
