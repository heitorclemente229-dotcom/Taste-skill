import "server-only";
import type { BookingApiResponse } from "@/lib/booking/schema";

/** Cabeçalhos de toda resposta da API: JSON, sem cache, sem conteúdo ativo. */
export const API_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
};

export function jsonResponse(status: number, body: BookingApiResponse, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...API_RESPONSE_HEADERS, ...extraHeaders },
  });
}

/** true para o erro lançado pelo fetch quando AbortSignal.timeout expira. */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

/** Descarta o corpo de uma resposta externa sem lê-lo (libera a conexão). */
export async function discardBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Sem importância: a resposta já foi avaliada pelo status.
  }
}
