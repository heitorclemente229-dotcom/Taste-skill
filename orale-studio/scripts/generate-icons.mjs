#!/usr/bin/env node
/**
 * Gera os ícones do site a partir da geometria do símbolo da marca.
 *
 * Fonte única: SYMBOL_PATHS em src/components/brand/logo.tsx (lido como
 * texto, sem executar o módulo). Saídas:
 *   src/app/icon.svg        símbolo em fundo transparente (navegadores modernos)
 *   src/app/apple-icon.png  180 × 180, fundo porcelana (o iOS aplica a máscara)
 *   src/app/favicon.ico     16 × 16 e 32 × 32 (PNG dentro de ICO), quadrado arredondado
 *
 * Uso: npm run icons
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const path = (relative) => `${root}${relative}`;

const COLORS = {
  porcelain: "#f8f9fb",
  deep: "#152b3a",
  periwinkle: "#758cf0",
  /** Linha clara para abas de navegador em modo escuro. */
  lineOnDark: "#f8f9fb",
};

// Área ocupada pelo símbolo no viewBox 48 × 48 (linha com ponta arredondada
// até o ponto de luz; topo da linha até a base do arco). Usada para centralizar.
const BOUNDS = { x: 5, y: 15.5, width: 39.5, height: 18.7 };

/** Lê SYMBOL_PATHS do componente do logo, para não duplicar a geometria. */
async function readSymbol() {
  const source = await readFile(path("src/components/brand/logo.tsx"), "utf8");
  const block = source.match(/export const SYMBOL_PATHS = \{([\s\S]*?)\} as const;/);
  if (!block) throw new Error("SYMBOL_PATHS não encontrado em src/components/brand/logo.tsx");
  const body = block[1];
  const line = body.match(/line:\s*"([^"]+)"/)?.[1];
  const crescent = body.match(/crescent:\s*"([^"]+)"/)?.[1];
  const point = body.match(/point:\s*\{\s*cx:\s*([\d.]+),\s*cy:\s*([\d.]+),\s*r:\s*([\d.]+)\s*\}/);
  if (!line || !crescent || !point) throw new Error("Formato de SYMBOL_PATHS inesperado; atualize scripts/generate-icons.mjs");
  return { line, crescent, point: { cx: Number(point[1]), cy: Number(point[2]), r: Number(point[3]) } };
}

/** Desenho do símbolo (sem o elemento <svg>), nas coordenadas do viewBox 48 × 48. */
function symbolMarkup(symbol, { strokeWidth = 2, lineClass = "" } = {}) {
  const { line, crescent, point } = symbol;
  const cls = lineClass ? ` class="${lineClass}"` : "";
  return [
    `<path${cls} d="${line}" fill="none" stroke="${COLORS.deep}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`,
    `<path d="${crescent}" fill="${COLORS.periwinkle}"/>`,
    `<circle cx="${point.cx}" cy="${point.cy}" r="${point.r}" fill="${COLORS.periwinkle}"/>`,
  ].join("");
}

/** icon.svg: transparente, com recorte justo e linha clara no modo escuro. */
function iconSvg(symbol) {
  const size = 42;
  const x = BOUNDS.x + BOUNDS.width / 2 - size / 2;
  const y = BOUNDS.y + BOUNDS.height / 2 - size / 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(x)} ${round(y)} ${size} ${size}">`,
    `<style>@media (prefers-color-scheme: dark){.l{stroke:${COLORS.lineOnDark}}}</style>`,
    symbolMarkup(symbol, { lineClass: "l" }),
    `</svg>`,
    "",
  ].join("\n");
}

/**
 * Ícone rasterizado: símbolo centralizado sobre porcelana.
 * `fill` é a fração da largura ocupada pelo símbolo; `radius` arredonda o
 * fundo (0 = quadrado inteiro). Em tamanhos mínimos, `linePx` fixa a
 * espessura da linha em pixels inteiros e alinha a linha à grade, para que
 * ela fique nítida (ajuste óptico, mesma geometria).
 */
function tileSvg(symbol, { size, fill, radius, strokeWidth = 2, linePx }) {
  const scale = (size * fill) / BOUNDS.width;
  const tx = size / 2 - (BOUNDS.x + BOUNDS.width / 2) * scale;
  let ty = size / 2 - (BOUNDS.y + BOUNDS.height / 2) * scale;
  if (linePx) {
    strokeWidth = linePx / scale;
    const lineY = lineBaseY(symbol) * scale + ty;
    const target = linePx % 2 === 1 ? Math.floor(lineY) + 0.5 : Math.round(lineY);
    ty += target - lineY;
  }
  const background =
    radius > 0
      ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${COLORS.porcelain}"/>`
      : `<rect width="${size}" height="${size}" fill="${COLORS.porcelain}"/>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    background,
    `<g transform="translate(${round(tx)} ${round(ty)}) scale(${round(scale)})">`,
    symbolMarkup(symbol, { strokeWidth }),
    `</g></svg>`,
  ].join("");
}

async function renderPng(svg) {
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

/**
 * Codificador ICO mínimo: cabeçalho ICONDIR, uma entrada ICONDIRENTRY por
 * imagem e os PNGs em sequência (formato aceito desde o Windows Vista e por
 * todos os navegadores atuais).
 */
function encodeIco(images) {
  const headerSize = 6;
  const entrySize = 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo 1 = ícone
  header.writeUInt16LE(images.length, 4);

  let offset = headerSize + entrySize * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // largura (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // altura
    entry.writeUInt8(0, 2); // paleta
    entry.writeUInt8(0, 3); // reservado
    entry.writeUInt16LE(1, 4); // planos de cor
    entry.writeUInt16LE(32, 6); // bits por pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

/** O OG image mantém uma cópia da geometria; avisa se ela divergir. */
async function checkOpenGraphCopy(symbol) {
  try {
    const og = await readFile(path("src/app/opengraph-image.tsx"), "utf8");
    const missing = [symbol.line, symbol.crescent].filter((d) => !og.includes(d));
    if (missing.length) {
      console.warn("Aviso: a geometria do símbolo em src/app/opengraph-image.tsx difere de SYMBOL_PATHS.");
    }
  } catch {
    // Arquivo ausente: nada a comparar.
  }
}

/** Altura (y) da linha de referência, lida do caminho "M x y H x2". */
function lineBaseY(symbol) {
  const y = Number(symbol.line.match(/^M\s*[\d.]+[\s,]+([\d.]+)/)?.[1]);
  return Number.isFinite(y) ? y : symbol.point.cy;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

async function main() {
  const symbol = await readSymbol();

  await writeFile(path("src/app/icon.svg"), iconSvg(symbol));

  const apple = await renderPng(tileSvg(symbol, { size: 180, fill: 0.62, radius: 0, strokeWidth: 2.2 }));
  await writeFile(path("src/app/apple-icon.png"), apple);

  const ico = encodeIco([
    { size: 16, data: await renderPng(tileSvg(symbol, { size: 16, fill: 0.86, radius: 3.5, linePx: 1 })) },
    { size: 32, data: await renderPng(tileSvg(symbol, { size: 32, fill: 0.8, radius: 7, linePx: 2 })) },
  ]);
  await writeFile(path("src/app/favicon.ico"), ico);

  await checkOpenGraphCopy(symbol);

  console.log("Ícones gerados:");
  console.log("  src/app/icon.svg");
  console.log(`  src/app/apple-icon.png (180 × 180, ${apple.length} bytes)`);
  console.log(`  src/app/favicon.ico (16 × 16 e 32 × 32, ${ico.length} bytes)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
