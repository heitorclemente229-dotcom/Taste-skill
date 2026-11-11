"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useState, ViewTransition } from "react";
import type { Treatment } from "@/content/treatments";
import { cn } from "@/lib/cn";
import { SwipeRow } from "@/components/ui/swipe-row";

type Item = Pick<Treatment, "slug" | "name" | "summary" | "photo">;

/**
 * Tratamentos, com uma marcação só para dois comportamentos:
 *
 * - Desktop: índice tipográfico à direita e um palco de fotos à esquerda. O
 *   item sob o ponteiro (ou com foco) ganha peso na fonte variável e traz a
 *   sua foto para o palco.
 * - Celular: os mesmos itens viram cartões em um carrossel com dica de deslizar.
 *
 * A foto é um elemento compartilhado (<ViewTransition name>): ao abrir um
 * tratamento, ela viaja até o topo da página de detalhe.
 */
export function TreatmentsList({ items, linkLabel }: { items: readonly Item[]; linkLabel: string }) {
  const [state, setState] = useState({ active: 0, previous: -1 });
  const activate = (index: number) =>
    setState((current) => (current.active === index ? current : { active: index, previous: current.active }));

  return (
    <SwipeRow until="lg" label="Tratamentos" listClassName="gap-4 pr-(--spacing-gutter) lg:relative lg:block lg:pr-0 lg:pl-[46%]">
      {items.map((item, index) => {
        const status = index === state.active ? "active" : index === state.previous ? "previous" : "idle";
        return (
          <li
            key={item.slug}
            data-state={status}
            onPointerEnter={() => activate(index)}
            onFocus={() => activate(index)}
            className="w-[76vw] sm:w-[44vw] lg:w-auto"
          >
            <Link
              href={`/tratamentos/${item.slug}`}
              transitionTypes={["nav-forward"]}
              className="group block rounded-brand lg:border-b lg:border-forest/15 lg:py-7"
            >
              <div className="t-stage lg:absolute lg:inset-y-0 lg:left-0 lg:w-[40%]">
                <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
                  <ViewTransition name={`tratamento-${item.slug}`} share="vt-photo" default="none">
                    <div className="aspect-[4/5] overflow-hidden rounded-brand bg-fog">
                      <Image
                        src={item.photo.src}
                        alt={item.photo.alt}
                        placeholder="blur"
                        sizes="(min-width: 1024px) 34vw, (min-width: 640px) 44vw, 76vw"
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </ViewTransition>
                </div>
              </div>

              <div className="mt-4 lg:mt-0 lg:flex lg:items-start lg:justify-between lg:gap-8">
                <div className="relative lg:pl-0">
                  <h3
                    className={cn(
                      "display text-[1.5rem] leading-[1.1] transition-[font-variation-settings,color] duration-500 ease-out-expo [--wght:600] lg:text-[clamp(1.875rem,2.9vw,2.75rem)]",
                      // O item ativo ganha peso e cor; os demais ficam leves, sem perder contraste.
                      status === "active" ? "lg:[--wght:640]" : "lg:text-stone lg:[--wght:380]",
                    )}
                  >
                    {item.name}
                  </h3>
                  <p className="mt-2 max-w-[44ch] text-[0.9375rem] leading-relaxed text-stone lg:mt-3 lg:text-base">{item.summary}</p>
                </div>
                <span className="mt-3 inline-flex shrink-0 items-center gap-1.5 text-[0.9375rem] font-semibold text-teal lg:mt-3">
                  {linkLabel}
                  <ArrowUpRight
                    aria-hidden="true"
                    size={17}
                    strokeWidth={1.75}
                    className="transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </SwipeRow>
  );
}
