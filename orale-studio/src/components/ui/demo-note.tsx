import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Sinaliza conteúdo demonstrativo (placeholders) de forma explícita.
 * Remova quando o conteúdo real for inserido.
 */
export function DemoNote({ children, className, tone = "deep" }: { children: ReactNode; className?: string; tone?: "deep" | "light" }) {
  return (
    <p
      className={cn(
        "inline-flex max-w-[52ch] items-start gap-3 rounded-surface border border-dashed px-4 py-3 text-sm leading-relaxed",
        tone === "deep" ? "border-field/70 bg-white/60 text-slate" : "border-white/25 text-mineral",
        className,
      )}
    >
      <span
        className={cn(
          "mt-px shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em]",
          tone === "deep" ? "bg-ice text-accent-ink" : "bg-white/10 text-white",
        )}
      >
        Demonstrativo
      </span>
      <span>{children}</span>
    </p>
  );
}
