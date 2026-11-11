"use client";

import { MoveHorizontal } from "lucide-react";
import { motion, useInView, useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type SwipeRowProps = {
  /** Itens da fileira: elementos <li>. */
  children: ReactNode;
  /** Nome da fileira para leitores de tela. */
  label: string;
  className?: string;
  listClassName?: string;
  /** "lg": só é carrossel abaixo de 1024px; acima, o layout é definido por `listClassName`. */
  until?: "lg";
  hint?: string;
  tone?: "light" | "forest";
  /** true quando os itens não têm nada focável: a própria fileira recebe foco para rolar com o teclado. */
  focusable?: boolean;
};

/**
 * Fileira horizontal pensada primeiro para o toque: encaixe por item, barra
 * de progresso ligada à rolagem e uma dica explícita de que dá para deslizar
 * (texto + três pequenos empurrões quando a fileira entra na tela). A dica
 * some depois do primeiro gesto. Com mouse, dá para arrastar.
 */
export function SwipeRow({ children, label, className, listClassName, until, hint = "Deslize para ver mais", tone = "light", focusable = false }: SwipeRowProps) {
  const scroller = useRef<HTMLUListElement>(null);
  const { scrollXProgress } = useScroll({ container: scroller, axis: "x" });
  const inView = useInView(scroller, { once: true, amount: 0.4 });
  const [touched, setTouched] = useState(false);
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0 });

  useMotionValueEvent(scrollXProgress, "change", (value) => {
    if (value > 0.03) setTouched(true);
  });

  const onPointerDown = (event: PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || !scroller.current) return;
    drag.current = { active: true, moved: false, startX: event.clientX, startLeft: scroller.current.scrollLeft };
  };

  const onPointerMove = (event: PointerEvent<HTMLUListElement>) => {
    const state = drag.current;
    const node = scroller.current;
    if (!state.active || !node) return;
    const delta = event.clientX - state.startX;
    if (!state.moved && Math.abs(delta) > 6) {
      state.moved = true;
      // O encaixe volta ao soltar; durante o arrasto ele brigaria com o mouse.
      node.style.scrollSnapType = "none";
    }
    if (state.moved) node.scrollLeft = state.startLeft - delta;
  };

  const endDrag = () => {
    const node = scroller.current;
    if (drag.current.active && node) node.style.scrollSnapType = "";
    drag.current.active = false;
  };

  // Um arrasto não deve virar clique no item sob o ponteiro.
  const onClickCapture = (event: MouseEvent<HTMLUListElement>) => {
    if (!drag.current.moved) return;
    drag.current.moved = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const responsive = until === "lg";

  return (
    <div className={className}>
      <ul
        ref={scroller}
        aria-label={label}
        tabIndex={focusable ? 0 : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(event) => event.preventDefault()}
        className={cn(
          responsive ? "max-lg:snap-row" : "snap-row",
          inView && !touched ? (responsive ? "max-lg:swipe-nudge" : "swipe-nudge") : null,
          listClassName,
        )}
      >
        {children}
      </ul>

      <div className={cn("mt-6 flex items-center gap-4 pr-(--spacing-gutter)", responsive && "lg:hidden")}>
        <span aria-hidden="true" className={cn("relative block h-0.5 flex-1 overflow-hidden", tone === "light" ? "bg-fog" : "bg-paper/20")}>
          <motion.span
            className={cn("absolute inset-0 origin-left", tone === "light" ? "bg-teal" : "bg-turquoise")}
            style={{ scaleX: scrollXProgress }}
          />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-2 text-[0.8125rem] font-medium transition-opacity duration-500",
            tone === "light" ? "text-stone" : "text-paper/75",
            touched ? "opacity-0" : "opacity-100",
          )}
          aria-hidden={touched}
        >
          <MoveHorizontal aria-hidden="true" size={16} strokeWidth={1.75} />
          {hint}
        </span>
      </div>
    </div>
  );
}
