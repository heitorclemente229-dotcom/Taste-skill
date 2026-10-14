"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useId } from "react";
import { brand, contact, navigation } from "@/config/site";
import { Logo } from "@/components/brand/logo";
import { BookingTrigger } from "@/components/booking/booking-context";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { EASE_OUT, useReduced } from "@/components/motion/primitives";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  const reduce = useReduced();
  const t = (delay = 0) => (reduce ? { duration: 0 } : { duration: 0.8, delay, ease: EASE_OUT });

  return (
    <ModalDialog id="menu-principal" open={open} onRequestClose={onClose} labelledBy={titleId}>
      <motion.div
        key="menu"
        className="absolute inset-0 flex flex-col overflow-y-auto bg-porcelain"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.4 }}
      >
        <div aria-hidden="true" className="halo pointer-events-none absolute -right-40 top-24 size-[32rem] rounded-full" />
        <div className="container-edge relative flex h-[var(--header-h)] shrink-0 items-center justify-between">
          <Link href="/" onClick={onClose} className="-ml-1 rounded-full p-1" aria-label={`${brand.fullName}, página inicial`}>
            <Logo />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center gap-2.5 rounded-full pl-4 pr-3 text-[0.9rem] font-medium text-deep ring-1 ring-inset ring-deep/15"
          >
            Fechar
            <X className="size-4" strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>

        <nav aria-labelledby={titleId} className="container-edge relative flex flex-1 flex-col justify-center py-10">
          <h2 id={titleId} className="visually-hidden">
            Menu
          </h2>
          <ul className="flex flex-col gap-1">
            {navigation.map((item, index) => (
              <li key={item.id} className="overflow-hidden">
                <motion.div initial={{ y: "105%" }} animate={{ y: 0 }} transition={t(0.08 + index * 0.06)}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="group/m flex items-baseline justify-between gap-6 py-2.5 text-[2.75rem] font-light leading-none tracking-[-0.04em] text-deep"
                  >
                    {item.label}
                    <span aria-hidden="true" className="h-px flex-1 translate-y-[-0.35em] bg-line transition-colors duration-300 group-hover/m:bg-periwinkle" />
                  </Link>
                </motion.div>
              </li>
            ))}
          </ul>
        </nav>

        <motion.div
          className="container-edge relative flex shrink-0 flex-col gap-6 pb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.35)}
        >
          <BookingTrigger className="w-full" onOpen={onClose} />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem] text-slate">
            <a href={contact.whatsapp.href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-deep hover:underline">
              WhatsApp {contact.whatsapp.display}
            </a>
            <a href={contact.phone.href} className="underline-offset-4 hover:text-deep hover:underline">
              {contact.phone.display}
            </a>
          </div>
        </motion.div>
      </motion.div>
    </ModalDialog>
  );
}
