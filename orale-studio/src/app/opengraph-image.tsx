import { ImageResponse } from "next/og";
import { brand } from "@/config/site";

/**
 * Imagem de compartilhamento (Open Graph), gerada no build.
 * Usa a fonte padrão embutida no next/og (nenhuma fonte é baixada).
 */

export const alt = `${brand.fullName}, odontologia contemporânea. Sorrir, naturalmente.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Cópia de SYMBOL_PATHS (src/components/brand/logo.tsx). Aquele módulo é
// "use client" e não pode ser lido em uma rota de servidor. `npm run icons`
// avisa se as duas versões divergirem.
const SYMBOL = {
  line: "M6 16.5 H37.5",
  crescent: "M9 16.5 C 13 40, 35 40, 39 16.5 C 34 28.5, 14 28.5, 9 16.5 Z",
  point: { cx: 42.25, cy: 16.5, r: 2.25 },
} as const;

const C = {
  porcelain: "#f8f9fb",
  deep: "#152b3a",
  periwinkle: "#758cf0",
  display: "#6a80ea",
  slate: "#56657a",
};

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          backgroundColor: C.porcelain,
          color: C.deep,
          padding: "64px 80px 56px",
        }}
      >
        {/* Luz pervinca suave, como o halo da primeira dobra (dentro da tela: o
            renderizador corta gradientes de elementos com deslocamento negativo). */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            backgroundImage:
              "radial-gradient(circle 520px at 1000px 190px, rgba(117,140,240,0.34) 0%, rgba(169,184,245,0.22) 42%, rgba(232,238,250,0.5) 64%, rgba(232,238,250,0) 100%)",
          }}
        />

        {/* Anel de precisão com o ponto de luz. */}
        <div
          style={{
            position: "absolute",
            top: 64,
            right: 80,
            width: 248,
            height: 248,
            borderRadius: 9999,
            border: "1.5px solid rgba(117,140,240,0.55)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 182,
            right: 74,
            width: 12,
            height: 12,
            borderRadius: 9999,
            backgroundColor: C.periwinkle,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="76" height="76" viewBox="0 0 48 48">
            <path d={SYMBOL.line} stroke={C.deep} strokeWidth={2} strokeLinecap="round" fill="none" />
            <path d={SYMBOL.crescent} fill={C.periwinkle} />
            <circle cx={SYMBOL.point.cx} cy={SYMBOL.point.cy} r={SYMBOL.point.r} fill={C.periwinkle} />
          </svg>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, fontSize: 30 }}>
            <span style={{ letterSpacing: 6 }}>{brand.name}</span>
            <span style={{ color: C.slate, letterSpacing: 0.5 }}>{brand.descriptor}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 132,
              fontWeight: 300,
              lineHeight: 0.98,
              letterSpacing: -6.5,
            }}
          >
            <span>Sorrir,</span>
            <span style={{ color: C.display, paddingLeft: 118 }}>naturalmente.</span>
          </div>

          <div style={{ display: "flex", marginTop: 52, height: 1, backgroundColor: "rgba(21,43,58,0.14)" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 20,
              fontSize: 22,
              color: C.slate,
            }}
          >
            <span>Odontologia contemporânea</span>
            <span>Planejamento individual</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
