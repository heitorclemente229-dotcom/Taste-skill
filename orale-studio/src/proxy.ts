import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, createNonce } from "@/lib/security/csp";

/**
 * Executado antes de cada página:
 * 1. Redireciona HTTP para HTTPS quando FORCE_HTTPS=true (atrás de proxy reverso).
 * 2. Gera um nonce por requisição e aplica a Content-Security-Policy.
 * 3. Envia Strict-Transport-Security somente quando HSTS_ENABLED=true e a
 *    requisição chegou por HTTPS (ative após confirmar o HTTPS do domínio).
 */
export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isHttps = forwardedProto ? forwardedProto === "https" : request.nextUrl.protocol === "https:";

  if (!isDev && process.env.FORCE_HTTPS === "true" && !isHttps) {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, canonicalOrigin(request));
    target.protocol = "https:";
    return NextResponse.redirect(target, 308);
  }

  const nonce = createNonce();
  const csp = buildCsp({
    nonce,
    isDev,
    isHttps,
    turnstile: Boolean(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY),
    reportUri: process.env.CSP_REPORT_URI || undefined,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  if (isHttps && process.env.HSTS_ENABLED === "true") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

/** Usa o domínio canônico configurado (evita redirecionar para um Host forjado). */
function canonicalOrigin(request: NextRequest): string {
  const configured = process.env.SITE_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Valor inválido: cai para a origem da própria requisição.
    }
  }
  return request.nextUrl.origin;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico|txt|xml|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
