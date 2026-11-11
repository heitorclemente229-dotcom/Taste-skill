import type { ReactNode } from "react";
import { showDraftNotes } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * Aviso de conteúdo provisório: identifica com clareza o que ainda precisa
 * ser confirmado ou substituído pela clínica. Some por completo quando
 * `showDraftNotes` (src/config/site.ts) for `false`.
 */
export function DraftNote({ children, className, tone = "light" }: { children: ReactNode; className?: string; tone?: "light" | "forest" }) {
  if (!showDraftNotes) return null;
  return (
    <p
      data-draft-note=""
      className={cn(
        "flex max-w-[58ch] items-baseline gap-2.5 text-[0.8125rem] leading-snug",
        tone === "light" ? "text-stone" : "text-paper/75",
        className,
      )}
    >
      <span
        className={cn(
          "shrink-0 rounded-brand border border-dashed px-1.5 py-0.5 text-[0.6875rem] font-semibold",
          tone === "light" ? "border-stone/60 text-stone" : "border-paper/50 text-paper/85",
        )}
      >
        Provisório
      </span>
      <span>{children}</span>
    </p>
  );
}

/** Legenda curta para fotos provisórias, sempre fora da imagem. */
export function PhotoDraftCaption({ className }: { className?: string }) {
  if (!showDraftNotes) return null;
  return (
    <figcaption data-draft-note="" className={cn("mt-2 text-[0.75rem] leading-snug text-stone", className)}>
      Foto provisória de banco de imagens.
    </figcaption>
  );
}
