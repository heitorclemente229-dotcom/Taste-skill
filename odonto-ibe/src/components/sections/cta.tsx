import type { CSSProperties } from "react";
import { cta } from "@/content/home";
import { Tooth } from "@/components/brand/tooth";
import { Magnetic } from "@/components/motion/magnetic";
import { MaskHeading } from "@/components/ui/mask-heading";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";

/**
 * Chamada para agendamento: o painel turquesa da fachada em tela cheia.
 * O contorno do dente se desenha conforme a seção atravessa a tela e os
 * frisos deslizam com a rolagem (as duas coisas em CSS).
 */
export function Cta() {
  return (
    <section data-dock-hide="" aria-labelledby="cta-title" className="on-turquoise relative isolate overflow-clip bg-turquoise text-forest">
      <div className="container-edge relative grid grid-cols-1 gap-y-12 py-(--spacing-section) lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-8">
          <MaskHeading id="cta-title" lines={cta.titleLines} className="text-[clamp(2.375rem,6vw,5.25rem)] leading-none [--wght:600]" />
          <p data-reveal="" className="rv-fade mt-6 max-w-[40ch] text-lead" style={{ "--d": "200ms" } as CSSProperties}>
            {cta.text}
          </p>
          <div data-reveal="" className="rv-fade mt-9" style={{ "--d": "320ms" } as CSSProperties}>
            <Magnetic>
              <WhatsAppLink label={cta.button} variant="forest" size="lg" />
            </Magnetic>
          </div>
        </div>

        <div aria-hidden="true" className="relative hidden justify-end lg:col-span-4 lg:flex">
          <Tooth className="h-80 w-auto text-paper" strokeWidth={0.9} pathClassName="draw-on-scroll" />
        </div>
      </div>

      {/* Frisos claros no canto, como os da fachada. */}
      <div aria-hidden="true" className="drift-x absolute right-0 bottom-10 -z-10 w-40 space-y-3 [--drift:-18%] lg:w-72">
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className="block h-3 bg-paper/35" />
        ))}
      </div>
    </section>
  );
}
