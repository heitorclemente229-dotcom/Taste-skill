"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { brand, navigation } from "@/config/site";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/logo";
import { BookingTrigger } from "@/components/booking/booking-context";
import { EASE_OUT, useReduced } from "@/components/motion/primitives";
import { MobileMenu } from "@/components/layout/mobile-menu";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const reduce = useReduced();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 24));

  // Indica a seção visível na navegação (somente na página inicial).
  useEffect(() => {
    if (!isHome) return;
    const sections = navigation
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHome]);

  const currentSection = isHome ? active : null;

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-out-expo",
          scrolled ? "bg-porcelain/85 shadow-[0_1px_0_rgb(21_43_58/0.07)] backdrop-blur-lg" : "bg-transparent",
        )}
      />
      <div className="container-edge relative flex h-[var(--header-h)] items-center justify-between gap-6">
        <Link href="/" className="-ml-1 rounded-full p-1" aria-label={`${brand.fullName}, página inicial`}>
          <Logo animated />
        </Link>

        <motion.nav
          aria-label="Principal"
          className="hidden lg:block"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.9, delay: 0.25, ease: EASE_OUT }}
        >
          <ul className="flex items-center gap-10">
            {navigation.map((item) => {
              const isActive = currentSection === item.id;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "group/nav relative inline-flex py-2 text-[0.9rem] transition-colors duration-300",
                      isActive ? "text-deep" : "text-slate hover:text-deep",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-0 bottom-0.5 h-px origin-center bg-current transition-transform duration-500 ease-out-expo",
                        isActive ? "scale-x-100 bg-periwinkle" : "scale-x-0 group-hover/nav:scale-x-100",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </motion.nav>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.9, delay: 0.35, ease: EASE_OUT }}
        >
          {/* O wrapper controla a exibição: o botão já traz inline-flex e o cn() não resolve conflitos. */}
          <span className="hidden sm:inline-flex">
            <BookingTrigger size="sm" />
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="menu-principal"
            className="group/menu inline-flex h-11 items-center gap-3 rounded-full pl-4 pr-3 text-[0.9rem] font-medium text-deep ring-1 ring-inset ring-deep/15 transition-[box-shadow,background-color] duration-300 hover:ring-deep/40 lg:hidden"
          >
            Menu
            <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]">
              <span className="h-px w-full bg-deep transition-transform duration-500 ease-out-expo group-hover/menu:translate-x-0.5" />
              <span className="h-px w-3.5 self-end bg-deep transition-[width] duration-500 ease-out-expo group-hover/menu:w-full" />
            </span>
          </button>
        </motion.div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
