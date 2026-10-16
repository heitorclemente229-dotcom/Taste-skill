"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { booking } from "@/config/site";
import type { Topic } from "@/lib/booking/schema";
import { buttonClasses, ButtonContent, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { BookingDialog } from "@/components/booking/booking-dialog";

type OpenOptions = { topic?: Topic };

type BookingContextValue = {
  open: (options?: OpenOptions) => void;
  close: () => void;
  isOpen: boolean;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children, turnstileSiteKey }: { children: ReactNode; turnstileSiteKey?: string }) {
  const [state, setState] = useState<{ open: boolean; topic?: Topic; session: number }>({ open: false, session: 0 });
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = useCallback((options?: OpenOptions) => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setState((current) => ({ open: true, topic: options?.topic, session: current.session + 1 }));
  }, []);

  const close = useCallback(() => setState((current) => ({ ...current, open: false })), []);

  const handleClosed = useCallback(() => {
    const target = returnFocus.current;
    returnFocus.current = null;
    if (target && document.contains(target)) target.focus({ preventScroll: true });
  }, []);

  const value = useMemo(() => ({ open, close, isOpen: state.open }), [open, close, state.open]);

  return (
    <BookingContext.Provider value={value}>
      {children}
      <BookingDialog
        key={state.session}
        open={state.open}
        topic={state.topic}
        onRequestClose={close}
        onClosed={handleClosed}
        turnstileSiteKey={turnstileSiteKey}
      />
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking precisa estar dentro de BookingProvider");
  return context;
}

type BookingTriggerProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: "arrow-up-right" | "arrow-right" | "none";
  className?: string;
  topic?: Topic;
  children?: ReactNode;
  /** Renderiza como link de texto em vez de botão. */
  plain?: boolean;
  onOpen?: () => void;
};

/**
 * Abre o diálogo de agendamento. É um link real para /agendar: sem JavaScript,
 * ou com Ctrl/Cmd+clique, a página de agendamento abre normalmente.
 */
export function BookingTrigger({
  variant = "primary",
  size = "md",
  icon,
  className,
  topic,
  children = booking.ctaLabel,
  plain = false,
  onOpen,
}: BookingTriggerProps) {
  const { open } = useBooking();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen?.();
    open({ topic });
  };
  return (
    <Link
      href={booking.href}
      onClick={handleClick}
      aria-haspopup="dialog"
      className={plain ? className : buttonClasses(variant, size, className)}
    >
      {plain ? (
        children
      ) : (
        <ButtonContent variant={variant} size={size} icon={icon}>
          {children}
        </ButtonContent>
      )}
    </Link>
  );
}
