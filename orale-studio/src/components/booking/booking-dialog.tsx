"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import { useId } from "react";
import type { Topic } from "@/lib/booking/schema";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { BookingForm } from "@/components/booking/booking-form";
import { EASE_OUT, useReduced } from "@/components/motion/primitives";

export function BookingDialog({
  open,
  topic,
  onRequestClose,
  onClosed,
  turnstileSiteKey,
}: {
  open: boolean;
  topic?: Topic;
  onRequestClose: () => void;
  onClosed: () => void;
  turnstileSiteKey?: string;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const reduce = useReduced();
  const transition = reduce ? { duration: 0 } : { duration: 0.7, ease: EASE_OUT };

  return (
    <ModalDialog
      open={open}
      onRequestClose={onRequestClose}
      onClosed={onClosed}
      labelledBy={titleId}
      describedBy={descriptionId}
    >
      <motion.div
        key="backdrop"
        aria-hidden="true"
        className="absolute inset-0 bg-deep/35 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.45 }}
        onClick={onRequestClose}
      />
      <motion.div
        key="panel"
        className="absolute inset-y-0 right-0 flex w-full max-w-[38rem] flex-col overflow-hidden bg-porcelain shadow-[-30px_0_80px_-40px_rgb(21_43_58/0.45)] sm:rounded-l-[2rem]"
        initial={{ x: "8%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "6%", opacity: 0 }}
        transition={transition}
      >
        {/* Halo de luz no topo do painel, ecoando a primeira dobra. */}
        <div aria-hidden="true" className="halo pointer-events-none absolute -right-24 -top-32 size-[26rem] rounded-full" />

        <div className="relative flex items-start justify-between gap-6 px-6 pb-2 pt-6 sm:px-10 sm:pt-9">
          <div>
            <h2 id={titleId} className="text-[2rem] font-light leading-[1.05] tracking-[-0.035em] sm:text-[2.5rem]">
              Agendar consulta
            </h2>
            <p id={descriptionId} className="mt-3 max-w-[34ch] text-[0.95rem] leading-relaxed text-slate">
              Envie seus dados e retornamos para confirmar data e horário.
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestClose}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-deep ring-1 ring-inset ring-deep/10 transition-[background-color,transform] duration-300 hover:bg-ice active:scale-95"
            aria-label="Fechar agendamento"
          >
            <X className="size-5" strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto overscroll-contain px-6 pb-10 pt-6 sm:px-10">
          <BookingForm context="dialog" defaultTopic={topic} turnstileSiteKey={turnstileSiteKey} onDismiss={onRequestClose} />
        </div>
      </motion.div>
    </ModalDialog>
  );
}
