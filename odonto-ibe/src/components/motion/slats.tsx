import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type SlatsProps = {
  children: ReactNode;
  className?: string;
  /**
   * "load": abre no carregamento da página (CSS puro, não espera o JavaScript).
   * "view": abre conforme a mídia atravessa a tela (rolagem em CSS).
   */
  mode?: "load" | "view";
  /** Quantidade de frisos. */
  count?: number;
  /** Cor dos frisos: use a cor de fundo da seção. */
  color?: string;
  /** Atraso inicial em milissegundos (modo "load"). */
  delay?: number;
};

/**
 * "Persiana": assinatura de movimento da Odonto Ibe. A mídia aparece por trás
 * de frisos horizontais que se abrem em sequência, como os da fachada.
 *
 * É só marcação e CSS: os frisos animam `transform`, a mídia nunca fica com
 * opacidade zero nem recortada (o LCP não é atrasado) e, sem suporte ou com
 * movimento reduzido, os frisos simplesmente não aparecem.
 */
export function Slats({ children, className, mode = "view", count = 6, color, delay = 0 }: SlatsProps) {
  const style = { "--n": count, "--d": `${delay}ms`, ...(color ? { "--slat-color": color } : {}) } as CSSProperties;
  return (
    <div className={cn("slats", className)} data-slats={mode} style={style}>
      <div className="slats-media">{children}</div>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} aria-hidden="true" className="slat" style={{ "--i": index } as CSSProperties} />
      ))}
    </div>
  );
}
