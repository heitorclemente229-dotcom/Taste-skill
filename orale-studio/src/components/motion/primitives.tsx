"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Fragment, useEffect, useRef, useState, type ElementType, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { smilePolygon } from "@/lib/smile";

/** Curva padrão da marca: entrada rápida, assentamento longo e suave. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
/** Curva da "Abertura": simétrica, como um sorriso que se abre. */
export const EASE_SMILE = [0.65, 0, 0.35, 1] as const;

/**
 * Preferência de movimento reduzido. Os componentes mantêm o mesmo estado
 * inicial no servidor e no cliente e apenas zeram a duração das transições,
 * o que evita divergências de hidratação.
 */
export function useReduced(): boolean {
  return Boolean(useReducedMotion());
}

/** true em telas grandes com ponteiro preciso (mouse/trackpad). */
export function useFinePointerDesktop(): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setMatches(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return matches;
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "li" | "p" | "span" | "article" | "figure" | "header" | "footer" | "aside" | "dl";
  amount?: number;
  /** Anima na montagem (primeira dobra) em vez de ao entrar na tela. */
  mount?: boolean;
  duration?: number;
};

/** Revelação discreta: opacidade + pequeno deslocamento vertical. */
export function Reveal({ children, className, delay = 0, y = 24, as = "div", amount = 0.25, mount = false, duration = 0.9 }: RevealProps) {
  const reduce = useReduced();
  const Component = motion[as] as typeof motion.div;
  const target = { opacity: 1, y: 0 };
  return (
    <Component
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y }}
      {...(mount ? { animate: target } : { whileInView: target, viewport: { once: true, amount } })}
      transition={reduce ? { duration: 0 } : { duration, delay, ease: EASE_OUT }}
    >
      {children}
    </Component>
  );
}

type MaskLinesProps = {
  lines: readonly ReactNode[];
  as?: ElementType;
  className?: string;
  lineClassNames?: readonly (string | undefined)[];
  delay?: number;
  stagger?: number;
  mount?: boolean;
  id?: string;
};

/**
 * Máscara tipográfica: cada linha sobe de trás de uma linha de base invisível.
 * O texto continua sendo texto real (acessível e indexável). Entre as linhas
 * vai um espaço real: sem ele o textContent e o nome acessível juntam as
 * palavras ("Clareamentodental"). Entre blocos o espaço não aparece na tela.
 */
export function MaskLines({ lines, as: Tag = "h2", className, lineClassNames = [], delay = 0, stagger = 0.09, mount = false, id }: MaskLinesProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReduced();
  const shown = mount || inView;
  return (
    <Tag ref={ref} id={id} className={className}>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 ? " " : null}
          <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
            <motion.span
              data-reveal=""
              className={cn("block will-change-transform", lineClassNames[index])}
              initial={{ y: "110%" }}
              animate={shown ? { y: "0%" } : { y: "110%" }}
              transition={reduce ? { duration: 0 } : { duration: 1.15, delay: delay + index * stagger, ease: EASE_OUT }}
            >
              {line}
            </motion.span>
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}

type SmileRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  mount?: boolean;
  /**
   * "smile": termina com a base em arco (recorte-assinatura da fotografia principal).
   * "settle": abre em arco e assenta em retângulo.
   */
  shape?: "smile" | "settle";
  depth?: number;
  /** Faixa de luz que atravessa a imagem depois da abertura. */
  sweep?: boolean;
  amount?: number;
};

/** A "Abertura": a imagem nasce de uma linha e se abre em arco. */
export function SmileReveal({
  children,
  className,
  delay = 0,
  duration = 1.5,
  mount = false,
  shape = "settle",
  depth = 0.08,
  sweep = true,
  amount = 0.25,
}: SmileRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const reduce = useReduced();
  // -1 = aguardando entrar na tela: oculto por opacidade, sem recorte. O
  // IntersectionObserver do Chromium aplica o clip-path do próprio alvo, e com
  // o recorte fechado (área zero) a fração visível nunca chegaria a `amount`.
  const progress = useMotionValue(mount ? 0 : -1);
  const clipPath = useTransform(progress, (value) =>
    value < 0 ? "none" : smilePolygon(value, shape === "smile" ? depth : depth * 1.4 * Math.sin(Math.PI * value)),
  );
  const opacity = useTransform(progress, (value) => (value < 0 ? 0 : 1));
  const shown = mount || inView;

  useEffect(() => {
    if (!shown) return;
    // Começa da linha fechada (invisível), como no primeiro quadro da abertura.
    if (progress.get() < 0) progress.set(0);
    const controls = animate(progress, 1, reduce ? { duration: 0 } : { duration, delay, ease: EASE_SMILE });
    return () => controls.stop();
  }, [shown, reduce, duration, delay, progress]);

  return (
    <motion.div ref={ref} data-reveal="" className={cn("relative overflow-hidden", className)} style={{ clipPath, opacity }}>
      {children}
      {sweep ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[60%] bg-[linear-gradient(100deg,transparent_10%,rgb(255_255_255/0.32)_50%,transparent_90%)] mix-blend-soft-light"
          initial={{ x: "-110%", opacity: 0 }}
          animate={shown && !reduce ? { x: "190%", opacity: [0, 1, 0] } : { x: "-110%", opacity: 0 }}
          transition={{ duration: 1.6, delay: delay + duration * 0.7, ease: EASE_SMILE }}
        />
      ) : null}
    </motion.div>
  );
}

type ParallaxProps = {
  children?: ReactNode;
  className?: string;
  /** Deslocamento máximo em px no desktop (metade no mobile). */
  offset?: number;
  scale?: [number, number];
};

/** Parallax moderado, ligado ao progresso do elemento na tela. */
export function Parallax({ children, className, offset = 60, scale }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReduced();
  const desktop = useFinePointerDesktop();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const distance = reduce ? 0 : desktop ? offset : offset / 2;
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const s = useTransform(scrollYProgress, [0, 1], reduce || !scale ? [1, 1] : scale);
  return (
    <motion.div ref={ref} className={className} style={{ y, scale: s }}>
      {children}
    </motion.div>
  );
}

/**
 * Halo de luz: campo azul-gelo que segue o ponteiro com mola (apenas desktop)
 * e acompanha a rolagem. Puramente decorativo.
 */
export function Halo({
  className,
  strength = 26,
  tone = "light",
  scrollProgress,
  drift = 80,
}: {
  className?: string;
  strength?: number;
  tone?: "light" | "deep";
  scrollProgress?: MotionValue<number>;
  drift?: number;
}) {
  const reduce = useReduced();
  const desktop = useFinePointerDesktop();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 45, damping: 18, mass: 0.8 });
  const springY = useSpring(pointerY, { stiffness: 45, damping: 18, mass: 0.8 });
  const fallback = useMotionValue(0);
  const scrollY = useTransform(scrollProgress ?? fallback, [0, 1], reduce ? [0, 0] : [0, drift]);
  const y = useTransform(() => springY.get() + scrollY.get());

  useEffect(() => {
    if (reduce || !desktop) return;
    const onMove = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth - 0.5) * strength * 2);
      pointerY.set((event.clientY / window.innerHeight - 0.5) * strength * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, desktop, strength, pointerX, pointerY]);

  return (
    <motion.div
      aria-hidden="true"
      className={cn("pointer-events-none absolute rounded-full", tone === "deep" ? "halo-deep" : "halo", className)}
      style={{ x: springX, y }}
    />
  );
}

type ArcLineProps = {
  className?: string;
  /** Largura e flecha do arco no viewBox. */
  width?: number;
  sag?: number;
  /** "draw": desenha ao entrar na tela. "scroll": desenha conforme a rolagem. */
  mode?: "draw" | "scroll";
  delay?: number;
  duration?: number;
  /** Ponto de luz que percorre o arco com a rolagem. */
  lightPoint?: boolean;
  strokeClassName?: string;
  pointClassName?: string;
  mount?: boolean;
  flip?: boolean;
};

/** O arco do sorriso como linha fina: o fio que conecta as seções. */
export function ArcLine({
  className,
  width = 1000,
  sag = 160,
  mode = "draw",
  delay = 0,
  duration = 1.8,
  lightPoint = false,
  strokeClassName = "stroke-periwinkle/60",
  pointClassName = "fill-periwinkle",
  mount = false,
  flip = false,
}: ArcLineProps) {
  const ref = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const reduce = useReduced();
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const { scrollYProgress } = useScroll({ target: ref as unknown as RefObject<HTMLElement | null>, offset: ["start end", "end start"] });
  const drawn = useMotionValue(0);
  const scrollDraw = useTransform(scrollYProgress, [0.05, 0.6], [0, 1]);
  const pathLength = mode === "scroll" ? (reduce ? drawn : scrollDraw) : drawn;

  const c = (sag * 4) / 3;
  const d = flip
    ? `M0 ${sag} C ${width * 0.28} ${sag - c}, ${width * 0.72} ${sag - c}, ${width} ${sag}`
    : `M0 0 C ${width * 0.28} ${c}, ${width * 0.72} ${c}, ${width} 0`;

  useEffect(() => {
    if (mode === "scroll" && !reduce) return;
    if (!(mount || inView)) return;
    const controls = animate(drawn, 1, reduce ? { duration: 0 } : { duration, delay, ease: EASE_SMILE });
    return () => controls.stop();
  }, [mode, reduce, mount, inView, drawn, duration, delay]);

  const pointProgress = useTransform(scrollYProgress, [0.1, 0.9], [0.08, 0.92]);
  const cx = useMotionValue(width * 0.08);
  const cy = useMotionValue(0);
  const pointOpacity = useTransform(pathLength, [0.4, 0.8], [0, 1]);

  useEffect(() => {
    if (!lightPoint) return;
    const update = (value: number) => {
      const path = pathRef.current;
      if (!path) return;
      const length = path.getTotalLength();
      const point = path.getPointAtLength(length * (reduce ? 0.5 : value));
      cx.set(point.x);
      cy.set(point.y);
    };
    update(pointProgress.get());
    return pointProgress.on("change", update);
  }, [lightPoint, pointProgress, cx, cy, reduce]);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none overflow-visible", className)}
      viewBox={`0 -8 ${width} ${sag + 16}`}
      fill="none"
    >
      <motion.path
        ref={pathRef}
        d={d}
        className={strokeClassName}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        style={{ pathLength }}
      />
      {lightPoint ? (
        <motion.circle r={4} cx={cx} cy={cy} className={pointClassName} style={{ opacity: pointOpacity }} />
      ) : null}
    </svg>
  );
}
