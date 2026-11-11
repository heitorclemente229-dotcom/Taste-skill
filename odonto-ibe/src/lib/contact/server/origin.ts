import "server-only";

/**
 * Bloqueia envios de outros sites feitos pelo navegador.
 *
 * A API não usa cookies nem sessão, então não há CSRF clássico. Ainda assim
 * recusamos requisições entre sites para que páginas de terceiros não
 * usem o formulário (e a nossa cota de e-mail) em nome de visitantes.
 *
 * Regras:
 * - Sec-Fetch-Site, quando presente, precisa ser "same-origin".
 * - Origin, quando presente, precisa estar na lista de origens permitidas.
 * - Em produção, Origin é obrigatório (navegadores sempre o enviam em POST).
 *   Fora de produção, a ausência é tolerada para testes com curl.
 */

export type OriginCheck = { ok: true } | { ok: false; reason: "sec_fetch_site" | "origin_mismatch" | "origin_missing" };

export type OriginOptions = { allowedOrigins: ReadonlySet<string>; isProduction: boolean };

export function checkOrigin(headers: Headers, options: OriginOptions): OriginCheck {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite.trim().toLowerCase() !== "same-origin") {
    return { ok: false, reason: "sec_fetch_site" };
  }
  const origin = headers.get("origin");
  if (origin === null) {
    return options.isProduction ? { ok: false, reason: "origin_missing" } : { ok: true };
  }
  // Comparação exata com a origem serializada; "null" (contexto opaco) nunca está na lista.
  if (!options.allowedOrigins.has(origin.trim())) return { ok: false, reason: "origin_mismatch" };
  return { ok: true };
}
