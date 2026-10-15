"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef, useState, type PointerEvent } from "react";
import { treatments } from "@/content/treatments";
import { photos } from "@/content/photos";
import { cn } from "@/lib/cn";
import { EASE_OUT, MaskLines, Reveal, useFinePointerDesktop, useReduced } from "@/components/motion/primitives";

/** Espaço ocupado pela prévia à direita do ponteiro, em px. */
const PREVIEW_SPACE = 16 * (13 + 2.5);

/**
 * Outros cuidados: lista em linhas, começando pelo próximo tratamento.
 * No desktop com mouse, uma prévia da fotografia acompanha o ponteiro;
 * no celular, cada linha mostra uma miniatura.
 */
export function OtherTreatments({ currentSlug }: { currentSlug: string }) {
  const start = treatments.findIndex((treatment) => treatment.slug === currentSlug);
  const others = treatments
    .map((_, offset) => treatments[(start + 1 + offset) % treatments.length])
    .filter((treatment) => treatment.slug !== currentSlug);

  const listRef = useRef<HTMLDivElement>(null);
  const desktop = useFinePointerDesktop();
  const reduce = useReduced();
  const preview = desktop && !reduce;
  const [active, setActive] = useState<string | null>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 260, damping: 30, mass: 0.6 });
  const y = useSpring(pointerY, { stiffness: 260, damping: 30, mass: 0.6 });

  const track = (event: PointerEvent<HTMLDivElement>, jump = false) => {
    const rect = listRef.current?.getBoundingClientRect();
    if (!preview || !rect) return;
    // Limita a prévia à largura da lista (13rem + deslocamento de 2,5rem).
    pointerX.set(Math.min(event.clientX - rect.left, rect.width - PREVIEW_SPACE));
    pointerY.set(event.clientY - rect.top);
    // Ao entrar na lista, a prévia nasce sob o ponteiro, sem deslizar do canto.
    if (jump) {
      x.jump(pointerX.get());
      y.jump(pointerY.get());
    }
  };

  return (
    <section aria-labelledby="outros-cuidados-titulo" className="py-section">
      <div className="container-edge grid gap-y-12 lg:grid-cols-12 lg:gap-x-6">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2.5rem)]">
            <MaskLines
              as="h2"
              id="outros-cuidados-titulo"
              lines={["Outros", "cuidados"]}
              className="text-heading font-light tracking-[-0.045em]"
              lineClassNames={[undefined, "pl-[1em] text-accent-display"]}
            />
          </div>
        </div>

        <div
          ref={listRef}
          className="relative lg:col-span-8 lg:col-start-5"
          onPointerEnter={(event) => track(event, true)}
          onPointerMove={(event) => track(event)}
          onPointerLeave={() => setActive(null)}
        >
          <ul className="border-t border-line">
            {others.map((treatment, index) => {
              const photo = photos[treatment.photo];
              const number = String(treatments.indexOf(treatment) + 1).padStart(2, "0");
              return (
                <li
                  key={treatment.slug}
                  className="group/row relative border-b border-line"
                  onPointerEnter={() => setActive(treatment.slug)}
                >
                  <Reveal y={16} delay={index * 0.05} className="flex items-center gap-4 py-6 sm:gap-8 lg:py-8">
                    <span aria-hidden="true" className="tabular hidden w-6 shrink-0 text-[0.6875rem] tracking-[0.12em] text-accent-ink sm:block">
                      {number}
                    </span>
                    <span aria-hidden="true" className="relative size-12 shrink-0 overflow-hidden rounded-full bg-ice sm:size-14 lg:hidden">
                      <Image
                        src={photo.src}
                        alt=""
                        placeholder="blur"
                        quality={70}
                        sizes="56px"
                        className="absolute inset-0 size-full object-cover"
                        style={{ objectPosition: photo.position }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/tratamentos/${treatment.slug}`}
                        className="block text-[clamp(1.5rem,2.8vw,2.375rem)] font-light leading-[1.08] tracking-[-0.035em] outline-none after:absolute after:inset-0 after:z-10 focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent-ink"
                      >
                        <span className="inline-block transition-transform duration-500 ease-out-expo group-hover/row:translate-x-1.5 lg:group-hover/row:translate-x-3">
                          {treatment.title}
                        </span>
                      </Link>
                      <p className="mt-2 hidden max-w-[52ch] text-[0.95rem] leading-relaxed text-slate sm:block">{treatment.summary}</p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-full sm:size-11 ring-1 ring-inset ring-deep/15 transition-[transform,background-color,color,box-shadow] duration-500 ease-out-expo group-hover/row:rotate-45 group-hover/row:bg-deep group-hover/row:text-white group-hover/row:ring-deep"
                    >
                      <ArrowUpRight className="size-4" strokeWidth={1.6} />
                    </span>
                  </Reveal>
                  {/* Linha de luz que se desenha sob a linha em foco. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-periwinkle transition-transform duration-700 ease-out-expo group-focus-within/row:scale-x-100 group-hover/row:scale-x-100"
                  />
                </li>
              );
            })}
          </ul>

          {preview ? (
            <motion.div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-20 w-[13rem]" style={{ x, y }}>
              <motion.div
                className="relative aspect-[4/5] -translate-y-1/2 translate-x-10 overflow-hidden rounded-surface bg-ice shadow-[0_30px_60px_-30px_rgb(21_43_58/0.5)]"
                initial={false}
                animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.9 }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
              >
                {others.map((treatment) => {
                  const photo = photos[treatment.photo];
                  return (
                    <Image
                      key={treatment.slug}
                      src={photo.src}
                      alt=""
                      quality={70}
                      sizes="208px"
                      className={cn(
                        "absolute inset-0 size-full object-cover transition-opacity duration-500",
                        active === treatment.slug ? "opacity-100" : "opacity-0",
                      )}
                      style={{ objectPosition: photo.position }}
                    />
                  );
                })}
              </motion.div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
