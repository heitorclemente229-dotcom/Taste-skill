import { ImageResponse } from "next/og";
import { address, brand } from "@/config/site";
import { TOOTH_PATH } from "@/components/brand/tooth";

export const alt = `${brand.name}, ${brand.descriptor}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagem de compartilhamento: o painel turquesa da fachada, os frisos e o dente em linha. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#2cb7ab", color: "#0a2e2b", padding: 72, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
          <svg width="150" height="180" viewBox="0 0 100 120" fill="none">
            <path d={TOOTH_PATH} stroke="#fafcfb" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>{brand.name}</div>
            <div style={{ fontSize: 44, marginTop: 18 }}>{brand.descriptor}</div>
            <div style={{ fontSize: 30, marginTop: 28, opacity: 0.85 }}>{`${address.district}, ${address.region} de ${address.city}`}</div>
          </div>
        </div>
        <div style={{ position: "absolute", right: 0, top: 96, display: "flex", flexDirection: "column", gap: 22 }}>
          {[0, 1, 2, 3, 4].map((bar) => (
            <div key={bar} style={{ width: 260, height: 22, background: "rgba(250,252,251,0.4)" }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
