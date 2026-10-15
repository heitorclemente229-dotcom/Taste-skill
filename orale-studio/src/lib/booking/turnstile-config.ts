/**
 * Regra única de "Turnstile configurado": as duas chaves com conteúdo depois de
 * remover os espaços das pontas (valor só com espaços conta como ausente).
 *
 * Usada pelo servidor (server/env.ts), pelo proxy (CSP) e pelas páginas, para
 * que verificação, CSP e widget liguem e desliguem juntos. Fica fora de
 * server/ porque o proxy também a importa; só olha a presença das chaves e não
 * devolve nenhuma delas.
 */
export function isTurnstileConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.TURNSTILE_SITE_KEY?.trim() && env.TURNSTILE_SECRET_KEY?.trim());
}
