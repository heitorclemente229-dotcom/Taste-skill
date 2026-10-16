"use client";

import { useEffect } from "react";
import { ArrowLink, Button } from "@/components/ui/button";

/**
 * Falha inesperada em uma página. Não mostra detalhes do erro ao visitante;
 * no console registra apenas o identificador (digest), que permite achar o
 * erro nos logs do servidor sem expor dados.
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    if (error.digest) console.error(`Erro ao carregar a página. Identificador: ${error.digest}`);
  }, [error.digest]);

  return (
    <section aria-labelledby="erro-title" className="relative isolate overflow-hidden pt-[var(--header-h)]">
      <div aria-hidden="true" className="halo pointer-events-none absolute -right-[14rem] top-[6%] -z-10 size-[40rem] rounded-full" />

      <div className="container-edge flex min-h-[calc(80dvh-var(--header-h))] flex-col justify-center py-20 lg:py-28">
        <h1 id="erro-title" className="text-heading font-light tracking-[-0.045em]">
          Algo deu errado
        </h1>
        <p className="mt-8 max-w-[38ch] text-lead text-slate lg:ml-[0.2rem]">
          Não foi possível carregar esta página agora. Tente de novo em alguns instantes.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 lg:ml-[0.2rem]">
          <Button icon="arrow-right" onClick={() => retry()}>
            Tentar novamente
          </Button>
          <ArrowLink href="/">Voltar ao início</ArrowLink>
        </div>
      </div>
    </section>
  );
}
