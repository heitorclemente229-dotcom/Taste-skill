/**
 * "Abertura": a assinatura de movimento da marca.
 *
 * Todo recorte nasce como uma linha horizontal (a linha de referência, como o
 * plano oclusal no planejamento odontológico) e se abre em uma curva suave
 * (o arco do sorriso). Esta função gera o polígono do recorte para cada
 * instante da abertura.
 *
 * @param open  0 = fechado (uma linha na altura média), 1 = totalmente aberto
 * @param depth profundidade do arco na base, em fração da altura (0 = reto)
 * @param steps quantidade de segmentos da curva (constante para interpolar)
 */
export function smilePolygon(open: number, depth = 0.08, steps = 18): string {
  const t = Math.min(1, Math.max(0, open));
  const mid = 50;
  const top = mid - t * mid;
  const base = 100 - depth * 100;
  const points: string[] = [`0% ${round(top)}%`, `100% ${round(top)}%`];
  for (let i = steps; i >= 0; i -= 1) {
    const x = (i / steps) * 100;
    const finalY = base + depth * 100 * Math.sin((Math.PI * x) / 100);
    const y = mid + t * (finalY - mid);
    points.push(`${round(x)}% ${round(y)}%`);
  }
  return `polygon(${points.join(", ")})`;
}

/**
 * Arco do sorriso como caminho SVG: começa em (0, 0), termina em (width, 0)
 * e desce até `sag` no centro. Os pontos de controle usam 4/3 da flecha para
 * que a curva atinja exatamente `sag` no meio.
 */
export function smileArcPath(width: number, sag: number): string {
  const c = (sag * 4) / 3;
  return `M0 0 C ${round(width * 0.28)} ${round(c)}, ${round(width * 0.72)} ${round(c)}, ${round(width)} 0`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
