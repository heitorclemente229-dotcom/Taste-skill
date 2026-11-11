"use client";

import Link from "next/link";
import { MapPin, Phone, X } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { address, contact, navigation, type SectionId } from "@/config/site";
import { cta } from "@/content/home";
import { cn } from "@/lib/cn";
import { loopFocus } from "@/lib/focus-loop";
import { Logo } from "@/components/brand/logo";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  current: SectionId | null;
};

/**
 * Menu do celular em um <dialog> nativo: foco preso, Esc fecha e o fundo não
 * rola. A entrada é a persiana da marca: frisos turquesa se abrem e os links
 * sobem em sequência. O conteúdo só existe enquanto o menu está aberto, então
 * a animação (CSS) toca a cada abertura.
 */
export function MobileMenu({ open, onClose, current }: MobileMenuProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onKeyDown={loopFocus}
      aria-label="Menu"
      className="sheet fixed inset-0 m-0 h-dvh w-full overflow-y-auto bg-paper text-forest xl:hidden"
    >
      {open ? (
        <div className="relative flex min-h-full flex-col" data-load="">
          <div className="container-edge flex h-(--header-h) shrink-0 items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center gap-2 rounded-brand border border-forest/25 px-3.5 text-[0.9375rem] font-semibold transition-colors duration-300 hover:border-forest"
            >
              <X aria-hidden="true" size={18} strokeWidth={1.75} />
              Fechar
            </button>
          </div>

          <nav aria-label="Principal" className="container-edge flex-1 pt-6 pb-8">
            <ul>
              {navigation.map((item, index) => {
                const isActive = current === item.id;
                return (
                  <li key={item.id} className="border-b border-fog">
                    <Link
                      href={`/#${item.id}`}
                      onClick={onClose}
                      aria-current={isActive ? "location" : undefined}
                      className="mask-line rv-rise group block"
                      style={{ "--i": index, "--d": "180ms" } as CSSProperties}
                    >
                      <span className="flex items-center justify-between py-3.5">
                        <span className={cn("display text-[clamp(1.75rem,8vw,2.5rem)]", isActive ? "[--wght:640]" : "[--wght:440]")}>
                          {item.label}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn("h-0.5 w-8 origin-right bg-turquoise transition-transform duration-500 ease-friso", isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")}
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="container-edge rv-fade pb-8" style={{ "--d": "620ms" } as CSSProperties}>
            <WhatsAppLink label={cta.button} size="lg" className="w-full" />
            <ul className="mt-6 space-y-3 text-[0.9375rem] text-stone">
              <li>
                <a href={contact.phoneHref} className="inline-flex items-center gap-2.5 py-1 text-forest">
                  <Phone aria-hidden="true" size={17} strokeWidth={1.75} className="text-teal" />
                  {contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin aria-hidden="true" size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-teal" />
                <span>
                  {address.street}, {address.district}, {address.city}
                </span>
              </li>
            </ul>
          </div>

          {/* Persiana de abertura: frisos turquesa que se recolhem. */}
          <div aria-hidden="true" className="slats pointer-events-none !absolute inset-0 !rounded-none" data-slats="load" style={{ "--n": 7, "--slat-color": "var(--color-turquoise)" } as CSSProperties}>
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index} className="slat" style={{ "--i": index } as CSSProperties} />
            ))}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
