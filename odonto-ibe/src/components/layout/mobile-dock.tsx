"use client";

import { Navigation } from "lucide-react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { maps } from "@/config/site";
import { cta } from "@/content/home";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";

/**
 * Barra de ações do celular: depois da primeira dobra, agendar e abrir a rota
 * ficam sempre a um toque do polegar. Some quando uma área que já tem esses
 * botões está na tela (elementos com `data-dock-hide`), para não repetir nem
 * cobrir conteúdo.
 */
export function MobileDock() {
  const [past, setPast] = useState(false);
  const [covered, setCovered] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setPast(y > window.innerHeight * 0.7);
  });

  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setCovered(visible.size > 0);
    });
    for (const node of document.querySelectorAll("[data-dock-hide]")) observer.observe(node);
    return () => observer.disconnect();
    // Reobserva a cada página: os elementos mudam com a rota.
  }, [pathname]);

  const shown = past && !covered;

  return (
    <div
      inert={!shown}
      className={cn(
        "fixed inset-x-0 bottom-0 z-(--z-dock) border-t border-fog bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-[translate] duration-500 ease-out-expo lg:hidden",
        shown ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex gap-2">
        <WhatsAppLink label={cta.button} className="min-w-0 flex-1" />
        <ButtonLink
          href={maps.directionsUrl}
          variant="outline"
          leading={<Navigation aria-hidden="true" size={17} strokeWidth={1.75} />}
        >
          Rota
        </ButtonLink>
      </div>
    </div>
  );
}
