"use client";

import { useEffect } from "react";
import { buttonClasses } from "@/components/ui/button";

/** Tela de erro de uma página. Não mostra detalhes técnicos ao visitante. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Só o identificador vai para o console; a mensagem completa fica no servidor.
    if (error.digest) console.error("Erro de renderização:", error.digest);
  }, [error]);

  return (
    <section className="pt-(--header-h)">
      <div className="container-edge flex min-h-[70dvh] flex-col items-start justify-center py-20">
        <h1 className="display text-title [--wght:580]">Algo não saiu como esperado.</h1>
        <p className="mt-5 max-w-[44ch] text-lead text-stone">
          Tente de novo em instantes. Se preferir, fale com a clínica pelo WhatsApp (11) 97655-6438.
        </p>
        <button type="button" onClick={reset} className={`${buttonClasses("solid", "lg")} mt-8`}>
          <span>Tentar de novo</span>
        </button>
      </div>
    </section>
  );
}
