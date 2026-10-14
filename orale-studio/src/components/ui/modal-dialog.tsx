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
      className={cn(
        "fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-deep open:block",
        className,
      )}
    >
      <AnimatePresence onExitComplete={finishClose}>{open ? children : null}</AnimatePresence>
    </dialog>
  );
}
