import { cn } from "@/lib/cn";

/**
 * Contorno do dente em traço único e fechado, inspirado no símbolo da fachada.
 * É o mesmo caminho em todo o site: marca no cabeçalho, desenho da primeira
 * dobra e a cena fixada dos diferenciais.
 */
export const TOOTH_PATH =
  "M50 20 C42 12 26 10 17 21 C8 33 12 50 18 64 C24 78 22 102 30 108 C39 114 39 80 50 78 C61 80 61 114 70 108 C78 102 76 78 82 64 C88 50 92 33 83 21 C74 10 58 12 50 20 Z";

export const TOOTH_VIEWBOX = "0 0 100 120";

type ToothProps = {
  className?: string;
  /**
   * Espessura em unidades do viewBox (100 x 120), ou seja, ela escala com o
   * desenho. Não usamos `vector-effect: non-scaling-stroke`: com ele o
   * navegador mede o tracejado em pixels de tela e a animação do traço
   * (pathLength) aparece quebrada em pedaços.
   */
  strokeWidth?: number;
  /** Classe aplicada ao caminho (por exemplo "rv-draw" para desenhar o traço). */
  pathClassName?: string;
};

/** Símbolo decorativo. Quem lê a página com leitor de tela não o percebe. */
export function Tooth({ className, strokeWidth = 2, pathClassName }: ToothProps) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox={TOOTH_VIEWBOX} fill="none" className={cn("overflow-visible", className)}>
      <path
        d={TOOTH_PATH}
        pathLength={1}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("draw-path", pathClassName)}
      />
    </svg>
  );
}
