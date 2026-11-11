"use client";

import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { differentials } from "@/content/home";
import { TOOTH_PATH, TOOTH_VIEWBOX } from "@/components/brand/tooth";

const items = differentials.items;
const count = items.length;

/**
 * Narrativa fixada na rolagem. A cena fica presa (position: sticky) enquanto
 * os cinco diferenciais se sucedem; a cada um, o contorno do dente avança.
 * Ao chegar em "Odontologia integrada" o traço se fecha e o símbolo fica
 * completo: o cuidado completo do título.
 *
 * O progresso vem de useScroll (motion values, nenhum re-render por quadro);
 * o React só renderiza de novo quando o item ativo muda. Com movimento
 * reduzido a cena vira uma lista comum, com o símbolo já desenhado. Essa
 * troca é feita só em CSS (classes pin-*): o HTML é idêntico no servidor e no
 * navegador, então não há divergência de hidratação.
 */
export function Differentials() {
  const track = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });

  // O traço termina um pouco antes do fim, para o símbolo completo "respirar".
  const drawn = useTransform(scrollYProgress, [0, 0.9], [0.03, 1], { clamp: true });
  const fill = useTransform(scrollYProgress, [0.86, 0.97], [0, 1], { clamp: true });
  const headX = useMotionValue(50);
  const headY = useMotionValue(20);
  const headOpacity = useTransform(scrollYProgress, [0, 0.02, 0.88, 0.92], [0, 1, 1, 0]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(count - 1, Math.max(0, Math.floor(value * count)));
    setActive((current) => (current === next ? current : next));
  });

  // Ponto que conduz o traço: segue a ponta do caminho.
  useEffect(() => {
    const node = path.current;
    if (!node) return;
    const total = node.getTotalLength();
    const place = (value: number) => {
      const point = node.getPointAtLength(total * value);
      headX.set(point.x);
      headY.set(point.y);
    };
    place(drawn.get());
    return drawn.on("change", place);
  }, [drawn, headX, headY]);

  return (
    <section id="diferenciais" aria-labelledby="diferenciais-title" className="bg-turquoise-wash">
      <div ref={track} className="pin-track" style={{ "--steps": count } as CSSProperties}>
        <div className="pin-stage">
          <div className="container-edge grid h-full grid-cols-1 content-center items-center gap-x-8 gap-y-8 lg:grid-cols-12">
            <div className="order-2 lg:order-1 lg:col-span-6">
              <h2 id="diferenciais-title" className="text-[0.9375rem] font-semibold text-teal">
                {differentials.title}
              </h2>

              <ol className="pin-list mt-5 lg:mt-7">
                {items.map((item, index) => (
                  <li key={item.title} className="pin-item" data-state={index === active ? "active" : index < active ? "past" : "future"}>
                    <h3 className="display text-[clamp(2.125rem,5vw,4.25rem)] leading-[1.02] [--wght:590]">{item.title}</h3>
                    <p className="mt-4 max-w-[36ch] text-lead text-stone lg:mt-6">{item.text}</p>
                  </li>
                ))}
              </ol>

              {/* Um friso por diferencial: cada um se preenche conforme a rolagem. */}
              <div aria-hidden="true" className="pin-progress mt-8 flex max-w-sm gap-2 lg:mt-12">
                {items.map((item, index) => (
                  <StepBar key={item.title} progress={scrollYProgress} index={index} />
                ))}
              </div>
            </div>

            <div className="order-1 flex justify-center lg:order-2 lg:col-span-5 lg:col-start-8">
              <svg aria-hidden="true" focusable="false" viewBox={TOOTH_VIEWBOX} fill="none" className="h-[30dvh] w-auto overflow-visible lg:h-[62dvh]">
                <motion.path d={TOOTH_PATH} fill="var(--color-turquoise)" className="pin-fill" style={{ opacity: fill }} />
                <path d={TOOTH_PATH} stroke="var(--color-turquoise-soft)" strokeWidth={0.4} />
                <motion.path
                  ref={path}
                  d={TOOTH_PATH}
                  stroke="var(--color-forest)"
                  strokeWidth={0.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pin-stroke"
                  style={{ pathLength: drawn }}
                />
                <motion.circle r={1.3} fill="var(--color-forest)" className="pin-head" style={{ cx: headX, cy: headY, opacity: headOpacity }} />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepBar({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const scaleX = useTransform(progress, [index / count, (index + 1) / count], [0, 1], { clamp: true });
  return (
    <span className="relative block h-1 flex-1 overflow-hidden bg-forest/15">
      <motion.span className="pin-step-fill absolute inset-0 origin-left bg-forest" style={{ scaleX }} />
    </span>
  );
}
