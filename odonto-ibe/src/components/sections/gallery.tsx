"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { gallery } from "@/content/photos";
import { cn } from "@/lib/cn";
import { loopFocus } from "@/lib/focus-loop";
import { SwipeRow } from "@/components/ui/swipe-row";

/**
 * Galeria interativa: fileira que desliza (toque) ou arrasta (mouse); cada
 * foto abre ampliada em um <dialog> nativo, com setas, teclado e contador.
 */
export function Gallery() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const total = gallery.length;

  const open = (next: number) => {
    setIndex(next);
    dialogRef.current?.showModal();
  };

  const close = () => dialogRef.current?.close();

  const step = useCallback(
    (delta: number) => setIndex((current) => (current === null ? current : (current + delta + total) % total)),
    [total],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, step]);

  const current = index === null ? null : gallery[index];

  return (
    <>
      <SwipeRow label="Fotos da clínica" hint="Deslize ou arraste para ver mais" listClassName="gap-3 pr-(--spacing-gutter) lg:gap-5 [@media(pointer:fine)]:cursor-grab">
        {gallery.map((item, itemIndex) => {
          const portrait = item.photo.src.height > item.photo.src.width;
          return (
            <li key={item.caption}>
              <figure>
                <button
                  type="button"
                  onClick={() => open(itemIndex)}
                  className={cn(
                    "group relative block h-[56vw] max-h-[30rem] overflow-hidden rounded-brand bg-mist sm:h-[40vw] lg:h-[27vw]",
                    portrait ? "aspect-[3/4]" : "aspect-[3/2]",
                  )}
                  aria-label={`Ampliar foto: ${item.photo.alt}`}
                >
                  <Image
                    src={item.photo.src}
                    alt=""
                    placeholder="blur"
                    sizes="(min-width: 1024px) 38vw, 84vw"
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.04]"
                  />
                  {/* Hover de lente: um quadrado turquesa abre no canto com o ícone de ampliar. */}
                  <span
                    aria-hidden="true"
                    className="absolute right-0 bottom-0 flex size-12 origin-bottom-right scale-0 items-center justify-center bg-turquoise text-forest transition-transform duration-500 ease-friso group-hover:scale-100 group-focus-visible:scale-100"
                  >
                    <Expand size={18} strokeWidth={1.75} />
                  </span>
                </button>
                <figcaption className="mt-3 text-[0.9375rem] font-medium">{item.caption}</figcaption>
              </figure>
            </li>
          );
        })}
      </SwipeRow>

      <dialog
        ref={dialogRef}
        onClose={() => setIndex(null)}
        onKeyDown={loopFocus}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        aria-label="Foto ampliada"
        className="sheet on-forest fixed inset-0 m-0 h-dvh w-full bg-forest/97 text-paper"
      >
        {current && index !== null ? (
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between px-4 py-3 lg:px-8">
              <p className="tabular text-[0.9375rem] text-paper/80" aria-live="polite">
                {current.caption}, foto {index + 1} de {total}
              </p>
              <button
                type="button"
                onClick={close}
                className="inline-flex min-h-11 items-center gap-2 rounded-brand border border-paper/30 px-3.5 text-[0.9375rem] font-semibold transition-colors duration-300 hover:border-paper"
              >
                <X aria-hidden="true" size={18} strokeWidth={1.75} />
                Fechar
              </button>
            </div>

            <div className="relative min-h-0 flex-1 px-4 lg:px-24">
              <Image
                key={current.caption}
                src={current.photo.src}
                alt={current.photo.alt}
                sizes="100vw"
                quality={80}
                className="h-full w-full animate-[fade-in_0.5s_ease_both] object-contain"
              />
            </div>

            <div className="flex shrink-0 items-center justify-center gap-3 px-4 py-4">
              <button
                type="button"
                onClick={() => step(-1)}
                className="inline-flex size-12 items-center justify-center rounded-brand border border-paper/30 transition-colors duration-300 hover:border-paper hover:bg-paper hover:text-forest"
                aria-label="Foto anterior"
              >
                <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                className="inline-flex size-12 items-center justify-center rounded-brand border border-paper/30 transition-colors duration-300 hover:border-paper hover:bg-paper hover:text-forest"
                aria-label="Próxima foto"
              >
                <ChevronRight aria-hidden="true" size={20} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
