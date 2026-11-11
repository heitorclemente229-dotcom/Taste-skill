"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { address, maps } from "@/config/site";
import { contactSection } from "@/content/home";
import { buttonClasses } from "@/components/ui/button";

/**
 * Mapa interativo do Google carregado sob demanda.
 *
 * Antes do clique nada do Google é carregado: a página fica mais leve (o mapa
 * não pesa no carregamento inicial) e nenhum dado de navegação é enviado a
 * terceiros sem que a pessoa peça. Depois do clique, o mapa é navegável como
 * qualquer mapa incorporado.
 */
export function MapEmbed() {
  const [loaded, setLoaded] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  // O botão some ao carregar o mapa: o foco vai para o mapa, e não se perde.
  useEffect(() => {
    if (loaded) frame.current?.focus({ preventScroll: true });
  }, [loaded]);

  if (loaded) {
    return (
      <iframe
        ref={frame}
        title={`Mapa: ${address.street}, ${address.district}, ${address.city}`}
        src={maps.embedUrl}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer"
        className="h-full w-full animate-[fade-in_0.6s_ease_both] border-0"
      />
    );
  }

  return (
    <div className="relative isolate flex h-full w-full flex-col items-start justify-end overflow-hidden bg-turquoise-wash p-6 lg:p-9">
      {/* Fundo gráfico: ruas em frisos e o marcador da clínica. Não é um mapa. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {[18, 39, 61, 83].map((top, index) => (
          <span key={top} className="rv-grow absolute inset-x-0 block h-2 origin-left bg-paper" style={{ top: `${top}%`, "--i": index } as CSSProperties} />
        ))}
        {[22, 58, 81].map((left, index) => (
          <span key={left} className="absolute inset-y-0 block w-2 bg-paper" style={{ left: `${left}%`, opacity: 0.9 - index * 0.15 }} />
        ))}
        <span className="absolute top-[39%] left-[58%] grid size-12 -translate-x-1/2 -translate-y-full place-items-center bg-forest text-turquoise">
          <MapPin size={22} strokeWidth={1.75} />
        </span>
      </div>

      <h3 className="display text-heading [--wght:600]">{contactSection.mapTitle}</h3>
      <p className="mt-2 max-w-[36ch] text-[0.9375rem] leading-relaxed text-forest/85">{contactSection.mapText}</p>
      <button type="button" onClick={() => setLoaded(true)} className={`${buttonClasses("solid")} mt-5`}>
        <MapPin aria-hidden="true" size={17} strokeWidth={1.75} />
        <span>{contactSection.mapButton}</span>
      </button>
    </div>
  );
}
