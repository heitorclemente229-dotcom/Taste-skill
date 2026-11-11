import { Fragment, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type MaskHeadingProps = {
  lines: readonly ReactNode[];
  as?: "h1" | "h2" | "h3" | "p";
  id?: string;
  className?: string;
  /** true: anima no carregamento (CSS puro). false: anima ao entrar na tela. */
  load?: boolean;
  /** Atraso em milissegundos. */
  delay?: number;
  /**
   * Anima os eixos da fonte (peso e largura) no desktop. Desligue em títulos
   * que podem quebrar em mais de uma linha por item, como nomes editáveis:
   * a mudança de largura deslocaria o conteúdo abaixo.
   */
  settle?: boolean;
};

/**
 * Título com máscara por linha e "tipografia viva": cada linha sobe de trás
 * da própria linha de base enquanto o peso e a largura da fonte variável
 * assentam no valor final. O texto continua sendo texto real; entre as
 * linhas vai um espaço para o nome acessível não juntar as palavras.
 */
export function MaskHeading({ lines, as: Tag = "h2", id, className, load = false, delay = 0, settle = true }: MaskHeadingProps) {
  const trigger = load ? { "data-load": "" } : { "data-reveal": "" };
  return (
    <Tag id={id} className={cn("display", settle && "rv-type", className)} style={{ "--d": `${delay}ms` } as CSSProperties} {...trigger}>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 ? " " : null}
          <span className="mask-line rv-rise" style={{ "--i": index } as CSSProperties}>
            <span>{line}</span>
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
