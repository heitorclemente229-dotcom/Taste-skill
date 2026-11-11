"use client";

/**
 * Último recurso: erro no próprio layout. Sem dependências do restante do
 * site (o CSS global pode não ter carregado), por isso os estilos são inline.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fafcfb", color: "#0a2e2b" }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "2rem" }}>
          <div style={{ maxWidth: "32rem" }}>
            <h1 style={{ fontSize: "2rem", lineHeight: 1.1, margin: 0 }}>Algo não saiu como esperado.</h1>
            <p style={{ lineHeight: 1.6, color: "#55625f" }}>Tente de novo em instantes ou fale com a clínica pelo WhatsApp (11) 97655-6438.</p>
            <button
              type="button"
              onClick={reset}
              style={{ minHeight: "3rem", padding: "0 1.5rem", border: 0, borderRadius: 2, background: "#0a2e2b", color: "#fafcfb", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}
            >
              Tentar de novo
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
