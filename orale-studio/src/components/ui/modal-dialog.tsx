"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// Contador de diálogos abertos: a rolagem só é liberada quando todos fecham.
let openDialogs = 0;
function lockScroll() {
  openDialogs += 1;
  document.documentElement.dataset.modalOpen = "true";
}
function unlockScroll() {
  openDialogs = Math.max(0, openDialogs - 1);
  if (openDialogs === 0) delete document.documentElement.dataset.modalOpen;
}

const FOCUSABLE = 'a[href], area[href], button, input, select, textarea, iframe, summary, [contenteditable="true"], [tabindex]';

/** Elementos alcançáveis por Tab dentro de `root`, na ordem do documento. */
function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => {
    if (element.tabIndex < 0 || element.matches(":disabled") || element.closest("[inert]")) return false;
    if (!element.getClientRects().length || getComputedStyle(element).visibility === "hidden") return false;
    // Num grupo de rádio só a opção marcada (ou a primeira, se nenhuma estiver) recebe Tab.
    if (element instanceof HTMLInputElement && element.type === "radio" && element.name) {
      const group = Array.from(root.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(element.name)}"]`));
      return element === (group.find((radio) => radio.checked) ?? group[0]);
    }
    return true;
  });
}

/**
 * Diálogo modal sobre o elemento nativo <dialog> (showModal):
 * foco preso dentro do diálogo, conteúdo de fundo inerte, tecla Esc e
 * camada superior do navegador, sem bibliotecas extras. A animação de saída
 * termina antes de o diálogo ser fechado de fato.
 */
export function ModalDialog({
  open,
  onRequestClose,
  onClosed,
  labelledBy,
  describedBy,
  className,
  children,
  id,
}: {
  open: boolean;
  onRequestClose: () => void;
  onClosed?: () => void;
  labelledBy: string;
  describedBy?: string;
  className?: string;
  /** Deve conter elementos motion com `key` e animação de `exit`. */
  children: ReactNode;
  id?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const holdsLock = useRef(false);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    if (!holdsLock.current) {
      holdsLock.current = true;
      lockScroll();
    }
  }, [open]);

  // Garante que a rolagem seja liberada se o componente sair da tela aberto.
  useEffect(() => {
    return () => {
      if (holdsLock.current) {
        holdsLock.current = false;
        unlockScroll();
      }
    };
  }, []);

  const finishClose = () => {
    const dialog = ref.current;
    if (open || !dialog) return;
    if (dialog.open) dialog.close();
    if (holdsLock.current) {
      holdsLock.current = false;
      unlockScroll();
    }
    onClosed?.();
  };

  return (
    <dialog
      ref={ref}
      id={id}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      // O <dialog> nativo deixa o Tab sair para a interface do navegador depois
      // do último elemento. Aqui o foco dá a volta, como no padrão de diálogo
      // modal da WAI-ARIA.
      onKeyDown={(event) => {
        if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
        const dialog = ref.current;
        if (!dialog) return;
        const items = tabbables(dialog);
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) {
          event.preventDefault();
          return;
        }
        const active = document.activeElement;
        const atEdge = event.shiftKey ? active === first || active === dialog : active === last;
        if (atEdge) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }}
      className={cn(
        "fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-deep open:block",
        className,
      )}
    >
      <AnimatePresence onExitComplete={finishClose}>{open ? children : null}</AnimatePresence>
    </dialog>
  );
}
