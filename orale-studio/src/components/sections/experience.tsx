"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { experience } from "@/content/home";
import { photos } from "@/content/photos";
import { cn } from "@/lib/cn";
import { ArcDivider } from "@/components/motion/arc-divider";
import { EASE_OUT, MaskLines, Parallax, Reveal, SmileReveal, useReduced } from "@/components/motion/primitives";

/**
 * Um novo olhar: narrativa com coluna de texto fixa e fotografias que passam
 * ao lado. A qualidade correspondente à foto em foco se acende (desktop).
 */
export function Experience() {
  const [active, setActive] = useState(0);
  const photoRefs = useRef<(HTMLElement | null)[]>([]);
  const reduce = useReduced();

  useEffect(() => {
    const elements = photoRefs.current.filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="clinica" aria-labelledby="clinica-title" className="relative bg-ice py-section">
      <ArcDivider fill="ice" shape="smile" />
      <div className="container-edge grid gap-16 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+4rem)]">
            <MaskLines
              as="h2"
              id="clinica-title"
              lines={experience.title}
              className="text-title font-light tracking-[-0.05em]"
              lineClassNames={[undefined, "text-accent-display pl-[1.6em]"]}
            />
            <Reveal className="mt-8 max-w-[34ch] text-lead text-slate">
              <p>{experience.lead}</p>
            </Reveal>

            <ol className="mt-14 flex flex-col">
              {experience.items.map((item, index) => {
                const isActive = active === index;
                return (
                  <li key={item.key} className="relative border-t border-deep/10 py-6 last:border-b">
                    <motion.span
                      aria-hidden="true"
                      className="absolute -top-px left-0 hidden h-px w-full origin-left bg-periwinkle lg:block"
                      initial={false}
                      animate={{ scaleX: isActive ? 1 : 0 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE_OUT }}
                    />
                    <div
                      className={cn(
                        "grid grid-cols-[7.5rem_1fr] gap-6 transition-opacity duration-500 sm:grid-cols-[9rem_1fr]",
                        isActive ? "lg:opacity-100" : "lg:opacity-45",
                      )}
                    >
                      <h3 className="text-[1.15rem] font-medium tracking-[-0.01em]">{item.title}</h3>
                      <p className="leading-relaxed text-slate">{item.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div
          role="region"
          aria-label="Fotografias da clínica"
          tabIndex={0}
          className="-mx-[var(--spacing-gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--spacing-gutter)] pb-2 [scrollbar-width:none] lg:col-span-6 lg:col-start-7 lg:mx-0 lg:flex-col lg:gap-[18vh] lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {experience.items.map((item, index) => {
            const photo = photos[item.photo];
            return (
              <figure
                key={item.key}
                ref={(element) => {
                  photoRefs.current[index] = element;
                }}
                data-index={index}
                className={cn(
                  "w-[78%] shrink-0 snap-center sm:w-[56%] lg:w-full",
                  index === 1 ? "lg:ml-[14%] lg:w-[86%]" : "",
                )}
              >
                <Parallax offset={index === 1 ? 50 : 30}>
                  <SmileReveal className={cn("rounded-media bg-white", index === 1 ? "aspect-[4/5]" : "aspect-[5/6] lg:aspect-[4/5]")}>
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      placeholder="blur"
                      quality={70}
                      sizes="(min-width: 1024px) 42vw, 78vw"
                      className="absolute inset-0 size-full object-cover"
                      style={{ objectPosition: photo.position }}
                    />
                  </SmileReveal>
                </Parallax>
                <figcaption className="mt-4 text-sm text-slate lg:sr-only">{item.title}</figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
