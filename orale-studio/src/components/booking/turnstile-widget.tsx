"use client";

import { useEffect, useRef, useState } from "react";
import { contact } from "@/config/site";

/**
 * Widget do Cloudflare Turnstile (anti-robô opcional).
 *
 * O script da Cloudflare é carregado uma única vez, sob demanda, por um
 * elemento criado aqui. A CSP usa 'strict-dynamic': scripts inseridos por um
 * script já autorizado por nonce (este bundle) também são aceitos. O iframe
 * do desafio depende de frame-src https://challenges.cloudflare.com.
 *
 * O token vai para o formulário por `onToken` e segue no corpo JSON; nenhum
 * campo oculto é criado. Ele expira e é de uso único: o formulário incrementa
 * `resetSignal` após cada envio para gerar outro.
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": (code?: string) => void;
  language: string;
  theme: "light" | "dark" | "auto";
  "response-field": boolean;
};

/** Tipagem mínima da API global `window.turnstile`. */
type TurnstileApi = {
  render(container: HTMLElement, options: TurnstileRenderOptions): string | null | undefined;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

function getApi(): TurnstileApi | null {
  return (window as Window & { turnstile?: TurnstileApi }).turnstile ?? null;
}

let loader: Promise<TurnstileApi> | null = null;

/** Carrega api.js uma vez por página. Em caso de falha, permite nova tentativa. */
function loadTurnstile(): Promise<TurnstileApi> {
  const ready = getApi();
  if (ready) return Promise.resolve(ready);
  if (loader) return loader;

  loader = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    const fail = () => {
      script.remove();
      loader = null;
      reject(new Error("turnstile_load_failed"));
    };
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      const api = getApi();
      if (api) resolve(api);
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loader;
}

export function TurnstileWidget({
  siteKey,
  onToken,
  resetSignal = 0,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  resetSignal?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const lastSignalRef = useRef(resetSignal);
  const [failed, setFailed] = useState(false);

  // Mantém o callback atual sem recriar o widget a cada renderização do pai.
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let active = true;
    loadTurnstile()
      .then((api) => {
        const container = containerRef.current;
        if (!active || !container) return;
        const id = api.render(container, {
          sitekey: siteKey,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
          language: "pt-br",
          theme: "light",
          "response-field": false,
        });
        widgetIdRef.current = id ?? null;
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      const id = widgetIdRef.current;
      widgetIdRef.current = null;
      if (id) {
        try {
          getApi()?.remove(id);
        } catch {
          // O widget já pode ter sido removido junto com o container.
        }
      }
      onTokenRef.current(null);
    };
  }, [siteKey]);

  // Novo desafio a cada envio: o token anterior já foi consumido pelo servidor.
  useEffect(() => {
    if (lastSignalRef.current === resetSignal) return;
    lastSignalRef.current = resetSignal;
    onTokenRef.current(null);
    const id = widgetIdRef.current;
    if (!id) return;
    try {
      getApi()?.reset(id);
    } catch {
      // Sem widget ativo: nada a reiniciar.
    }
  }, [resetSignal]);

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className={failed ? "hidden" : "min-h-[65px]"} />
      {failed ? (
        <p role="alert" className="text-sm leading-relaxed text-danger">
          Não foi possível carregar a verificação anti-robô. Desative bloqueadores para este site e recarregue a página,
          ou fale com a clínica pelo WhatsApp {contact.whatsapp.display}.
        </p>
      ) : null}
    </div>
  );
}
