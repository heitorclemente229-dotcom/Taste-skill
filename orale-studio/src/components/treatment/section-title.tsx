import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Seções do conteúdo de um tratamento, na ordem da página (usadas no índice e nas âncoras). */
export const TREATMENT_SECTIONS = [
  { id: "o-que-e", label: "O que é" },
  { id: "indicacoes", label: "Indicações" },
  { id: "como-acontece", label: "Como acontece" },
  { id: "cuidados", label: "Cuidados" },
] as const;

export type TreatmentSectionId = (typeof TREATMENT_SECTIONS)[number]["id"];

export function sectionNumber(id: TreatmentSectionId): string {
  return String(TREATMENT_SECTIONS.findIndex((section) => section.id === id) + 1).padStart(2, "0");
}

/**
 * Título de seção pequeno e leve, com índice editorial. Ocupa a coluna da
 * esquerda da grade e acompanha a leitura (fixo) no desktop.
 */
export function SectionTitle({
  id,
  section,
  children,
  tone = "porcelain",
  sticky = true,
  className,
}: {
  id: string;
  section: TreatmentSectionId;
  children: ReactNode;
  /** Fundo sobre o qual o título aparece (ajusta o contraste do índice). */
  tone?: "porcelain" | "ice";
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("lg:col-span-3", className)}>
      <div className={cn(sticky && "lg:sticky lg:top-[calc(var(--header-h)+2.5rem)]")}>
        <span
          aria-hidden="true"
          className={cn(
            "tabular block text-[0.6875rem] tracking-[0.12em]",
            tone === "ice" ? "text-slate" : "text-accent-ink",
          )}
        >
          {sectionNumber(section)}
        </span>
        <h2 id={id} className="mt-3 max-w-[14ch] text-[1.625rem] font-light leading-[1.12] tracking-[-0.03em] lg:text-[1.875rem]">
          {children}
        </h2>
      </div>
    </div>
  );
}
