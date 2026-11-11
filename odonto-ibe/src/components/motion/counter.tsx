"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type CounterProps = {
  value: number;
  /** Casas decimais (por exemplo 1 para "4,9"). */
  decimals?: number;
  duration?: number;
  className?: string;
};

const format = (value: number, decimals: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * Contador que sobe até o valor quando entra na tela. O HTML do servidor já
 * traz o valor final (bom para leitores de tela, buscadores e sem JavaScript);
 * a contagem é só visual e escreve direto no nó de texto, sem re-render.
 */
export function Counter({ value, decimals = 0, duration = 1.6, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const final = format(value, decimals);

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = format(latest, decimals);
      },
      onComplete: () => {
        node.textContent = final;
      },
    });
    return () => {
      controls.stop();
      node.textContent = final;
    };
  }, [inView, reduce, value, decimals, duration, final]);

  return (
    <span className={className}>
      <span className="visually-hidden">{final}</span>
      <span ref={ref} aria-hidden="true">
        {final}
      </span>
    </span>
  );
}
