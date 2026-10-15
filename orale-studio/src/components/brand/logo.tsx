"use client";

import { motion } from "motion/react";
import { brand } from "@/config/site";
import { cn } from "@/lib/cn";
import { EASE_OUT, EASE_SMILE, useReduced } from "@/components/motion/primitives";

/**
 * Símbolo ORALÉ: a linha de referência (precisão, como o plano oclusal),
 * o ponto de luz na extremidade e o arco do sorriso logo abaixo.
 * Geometria definida em um viewBox 48 × 48.
 */
export const SYMBOL_PATHS = {
  line: "M6 16.5 H37.5",
  crescent: "M9 16.5 C 13 40, 35 40, 39 16.5 C 34 28.5, 14 28.5, 9 16.5 Z",
  point: { cx: 42.25, cy: 16.5, r: 2.25 },
} as const;

type SymbolProps = {
  className?: string;
  tone?: "deep" | "light";
  animated?: boolean;
  delay?: number;
};

export function BrandSymbol({ className, tone = "deep", animated = false, delay = 0 }: SymbolProps) {
  const reduce = useReduced();
  const run = animated;
  const t = (duration: number, extra: number, ease: typeof EASE_OUT | typeof EASE_SMILE) =>
    reduce ? { duration: 0 } : { duration, delay: delay + extra, ease };
  const lineClass = tone === "deep" ? "stroke-deep" : "stroke-white";
  const fillClass = tone === "deep" ? "fill-periwinkle" : "fill-periwinkle-soft";
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={cn("shrink-0", className)}>
      <motion.path
        d={SYMBOL_PATHS.line}
        className={lineClass}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        initial={run ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={t(0.9, 0, EASE_SMILE)}
      />
      <motion.path
        d={SYMBOL_PATHS.crescent}
        className={fillClass}
        style={{ transformOrigin: "24px 16.5px" }}
        initial={run ? { scaleY: 0, opacity: 0 } : false}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={t(1, 0.45, EASE_OUT)}
      />
      <motion.circle
        {...SYMBOL_PATHS.point}
        className={fillClass}
        style={{ transformOrigin: `${SYMBOL_PATHS.point.cx}px ${SYMBOL_PATHS.point.cy}px` }}
        initial={run ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        transition={t(0.6, 0.8, EASE_OUT)}
      />
    </svg>
  );
}

export function Logo({
  className,
  tone = "deep",
  animated = false,
}: {
  className?: string;
  tone?: "deep" | "light";
  animated?: boolean;
}) {
  const reduce = useReduced();
  const run = animated;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandSymbol className="size-9" tone={tone} animated={animated} />
      <motion.span
        className="flex items-baseline gap-1.5 leading-none"
        initial={run ? { opacity: 0, x: -6 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.8, delay: 0.35, ease: EASE_OUT }}
      >
        <span className={cn("text-[0.95rem] font-semibold tracking-[0.2em]", tone === "deep" ? "text-deep" : "text-white")}>
          {brand.name}
        </span>
        <span className={cn("text-[0.95rem] font-light tracking-[0.02em]", tone === "deep" ? "text-slate" : "text-mineral")}>
          {brand.descriptor}
        </span>
      </motion.span>
    </span>
  );
}
