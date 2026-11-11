"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { navigation, type SectionId } from "@/config/site";
import { hero } from "@/content/home";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/logo";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { MobileMenu } from "./mobile-menu";

/**
 * Cabeçalho com comportamento inteligente:
 * - começa transparente sobre a primeira dobra e ganha fundo sólido ao rolar;
 * - recolhe ao rolar para baixo e volta ao rolar para cima (ou ao receber foco);
 * - um friso desliza sob o item da seção que está na tela;
 * - a barra de progresso de leitura é CSS puro (animation-timeline: scroll()).
 */
export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState<SectionId | null>(isHome ? "inicio" : null);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = lastY.current;
    lastY.current = y;
    setSolid(y > 24);
    // Só recolhe depois da primeira dobra e ignora variações mínimas.
    if (y < 320 || y < previous - 4) setHidden(false);
    else if (y > previous + 4) setHidden(true);
  });

  // Seção ativa: a que cruza a faixa central da tela.
  useEffect(() => {
    if (!isHome) return;
    const sections = navigation
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [isHome]);

  const current = isHome ? active : null;

  return (
    <header
      data-solid={solid || undefined}
      className={cn(
        "fixed inset-x-0 top-0 z-(--z-header) transition-[translate,background-color,box-shadow] duration-500 ease-out-expo focus-within:translate-y-0",
        hidden && !menuOpen ? "-translate-y-full" : "translate-y-0",
        solid ? "bg-paper/92 shadow-[0_1px_0_0_var(--color-fog)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="container-edge flex h-(--header-h) items-center justify-between gap-6">
        <Link href="/" aria-label="Odonto Ibe, página inicial" className="-ml-1 rounded-brand p-1 text-forest">
          <Logo animated />
        </Link>

        <nav aria-label="Principal" className="hidden xl:block">
          <ul className="flex items-center gap-7">
            {navigation.map((item) => {
              const isActive = current === item.id;
              return (
                <li key={item.id}>
                  <Link
                    href={`/#${item.id}`}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "group relative block py-2 text-[0.9375rem] font-medium transition-colors duration-300",
                      isActive ? "text-forest" : "text-stone hover:text-forest",
                    )}
                  >
                    {item.label}
                    {isActive ? (
                      <motion.span
                        layoutId="nav-friso"
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-turquoise"
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-slat transition-transform duration-500 ease-friso group-hover:scale-x-100"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <WhatsAppLink label={hero.primaryCta} />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className="inline-flex min-h-11 items-center gap-2 rounded-brand border border-forest/25 px-3.5 text-[0.9375rem] font-semibold text-forest transition-colors duration-300 hover:border-forest xl:hidden"
          >
            <Menu aria-hidden="true" size={18} strokeWidth={1.75} />
            Menu
          </button>
        </div>
      </div>

      {/* Progresso de leitura. Decorativo; só anima onde há suporte a scroll() em CSS. */}
      <span aria-hidden="true" className="scroll-progress absolute inset-x-0 bottom-0 block h-0.5 bg-turquoise" />

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} current={current} />
    </header>
  );
}
