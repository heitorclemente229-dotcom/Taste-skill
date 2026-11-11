import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "solid" | "accent" | "outline" | "light" | "forest";
type Size = "md" | "lg";

/**
 * Botões da marca: retos, com uma camada de cor que sobe da base no hover
 * (a cor "preenche" o botão, como um friso que se fecha). O texto troca de
 * cor junto, sempre com contraste AA nos dois estados.
 */
const VARIANTS: Record<Variant, string> = {
  // Verde escuro; no hover preenche de turquesa e o texto volta a ser verde.
  solid: "bg-forest text-paper before:bg-turquoise hover:text-forest",
  // Turquesa com texto verde; no hover preenche de verde escuro.
  accent: "bg-turquoise text-forest before:bg-forest hover:text-paper",
  // Contorno; no hover preenche de verde escuro.
  outline: "border border-forest/30 text-forest before:bg-forest hover:border-forest hover:text-paper",
  // Claro, para o rodapé verde escuro.
  light: "bg-paper text-forest before:bg-turquoise hover:text-forest",
  // Verde escuro sobre o painel turquesa; no hover preenche de branco.
  forest: "bg-forest text-paper before:bg-paper hover:text-forest",
};

const SIZES: Record<Size, string> = {
  md: "min-h-11 px-5 text-[0.9375rem]",
  lg: "min-h-13 px-7 text-base",
};

export function buttonClasses(variant: Variant = "solid", size: Size = "md", className?: string): string {
  return cn(
    "group/btn relative isolate inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-brand font-semibold whitespace-nowrap",
    "transition-[color,border-color,scale] duration-300 ease-out-expo active:scale-[0.98]",
    "before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:transition-transform before:duration-500 before:ease-friso hover:before:scale-y-100",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Ícone à direita; desliza um pouco no hover. */
  icon?: ReactNode;
  /** Ícone à esquerda (fixo). */
  leading?: ReactNode;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">;

/** Link com aparência de botão. Links externos abrem em nova aba, com aviso para leitores de tela. */
export function ButtonLink({ href, children, variant, size, className, icon, leading, ...rest }: ButtonLinkProps) {
  const external = /^https?:\/\//.test(href);
  const content = (
    <>
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span>{children}</span>
      {icon ? (
        <span className="shrink-0 transition-transform duration-500 ease-out-expo group-hover/btn:translate-x-1">{icon}</span>
      ) : null}
      {external ? <span className="visually-hidden"> (abre em nova aba)</span> : null}
    </>
  );
  const classes = buttonClasses(variant, size, className);
  if (external || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={classes} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {content}
    </Link>
  );
}
