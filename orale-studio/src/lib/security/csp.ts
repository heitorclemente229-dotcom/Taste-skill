/**
 * Monta a Content-Security-Policy da aplicação.
 *
 * - Scripts: somente os do próprio site, autorizados por nonce por requisição
 *   ('strict-dynamic' permite que esses scripts carreguem os próprios chunks).
 * - Estilos: arquivos do próprio site e blocos com nonce. Atributos `style`
 *   inline são permitidos (style-src-attr) porque o React e a biblioteca de
 *   animação definem estados iniciais por atributo; isso não permite executar
 *   scripts.
 * - Imagens e fontes: somente locais (fontes são auto-hospedadas no build).
 * - Nenhum iframe, objeto ou incorporação por terceiros.
 */
export type CspOptions = {
  nonce: string;
  isDev: boolean;
  /** true quando a requisição chegou por HTTPS. */
  isHttps: boolean;
  /** Habilita o domínio do Cloudflare Turnstile (anti-robô opcional). */
  turnstile: boolean;
  /** Endpoint opcional para relatórios de violação. */
  reportUri?: string;
};

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

export function buildCsp({ nonce, isDev, isHttps, turnstile, reportUri }: CspOptions): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (isDev) scriptSrc.push("'unsafe-eval'");
  if (turnstile) scriptSrc.push(TURNSTILE_ORIGIN);

  // Em desenvolvimento o servidor injeta estilos sem nonce (recarregamento a quente).
  const styleSrc = isDev ? ["'self'", "'unsafe-inline'"] : ["'self'", `'nonce-${nonce}'`];

  const connectSrc = ["'self'"];
  if (turnstile) connectSrc.push(TURNSTILE_ORIGIN);
  if (isDev) connectSrc.push("ws:", "wss:");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": styleSrc,
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": connectSrc,
    "frame-src": turnstile ? [TURNSTILE_ORIGIN] : ["'none'"],
    "media-src": ["'self'"],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (isHttps && !isDev) parts.push("upgrade-insecure-requests");
  if (reportUri) parts.push(`report-uri ${reportUri}`);
  return parts.join("; ");
}

/** Gera um nonce imprevisível (128 bits) em base64. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
