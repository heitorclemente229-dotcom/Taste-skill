import { brand } from "@/config/site";
import { cn } from "@/lib/cn";
import { Tooth } from "./tooth";

/**
 * Assinatura tipográfica provisória: símbolo do dente em linha + nome.
 * Quando a clínica enviar o arquivo oficial do logotipo (SVG), troque o
 * conteúdo deste componente e mantenha o texto acessível.
 */
export function Logo({ className, animated = false, descriptor = true }: { className?: string; animated?: boolean; descriptor?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} {...(animated ? { "data-load": "" } : {})}>
      <Tooth className="h-8 w-[1.7rem] shrink-0 text-turquoise" strokeWidth={8} pathClassName={animated ? "rv-draw" : undefined} />
      <span className="flex flex-col leading-none">
        <span className="display text-[1.3rem] [--wght:640]">{brand.name}</span>
        {descriptor ? (
          <span className="mt-1 text-[0.6875rem] font-medium tracking-[0.04em] opacity-70">{brand.descriptor}</span>
        ) : null}
      </span>
    </span>
  );
}
