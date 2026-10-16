"use client";

import "./globals.css";
import { useEffect } from "react";
import { brand, contact } from "@/config/site";
import { Button } from "@/components/ui/button";

/**
 * Falha no layout raiz: substitui o documento inteiro, por isso define
 * <html> e <body> e importa os estilos globais. Sem <style> ou <script>
 * inline (CSP). A fonte da marca não é carregada aqui; a classe no <html>
 * aponta a variável da fonte para a fonte do sistema.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    if (error.digest) console.error(`Erro ao carregar o site. Identificador: ${error.digest}`);
  }, [error.digest]);

  return (
    <html lang="pt-BR" className="[--font-manrope:system-ui]">
      <body>
        <title>{`Algo deu errado · ${brand.fullName}`}</title>
        <main className="container-edge flex min-h-dvh flex-col justify-center py-20">
          <p className="flex items-baseline gap-1.5 text-[0.95rem] leading-none">
            <span className="font-semibold tracking-[0.2em] text-deep">{brand.name}</span>
            <span className="font-light tracking-[0.02em] text-slate">{brand.descriptor}</span>
          </p>
          <h1 className="mt-16 text-heading font-light tracking-[-0.045em] text-deep">Algo deu errado</h1>
          <p className="mt-8 max-w-[38ch] text-lead text-slate">
            O site encontrou um problema inesperado. Tente de novo em alguns instantes.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Button icon="arrow-right" onClick={() => retry()}>
              Tentar novamente
            </Button>
            {/* Link comum de propósito: recarrega o documento inteiro. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="inline-flex min-h-11 items-center text-[0.95rem] font-medium text-deep underline decoration-deep/30 underline-offset-4 hover:decoration-deep">
              Voltar ao início
            </a>
          </div>
          <p className="mt-14 max-w-[42ch] text-sm leading-relaxed text-slate">
            Para falar com a clínica agora, use o{" "}
            <a
              href={contact.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-deep underline decoration-deep/30 underline-offset-4 hover:decoration-deep"
            >
              WhatsApp {contact.whatsapp.display}
            </a>{" "}
            ou o telefone{" "}
            <a href={contact.phone.href} className="font-medium text-deep underline decoration-deep/30 underline-offset-4 hover:decoration-deep">
              {contact.phone.display}
            </a>
            .
          </p>
        </main>
      </body>
    </html>
  );
}
