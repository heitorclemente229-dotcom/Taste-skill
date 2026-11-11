import { handleContactRequest } from "@/lib/contact/server/handler";

/**
 * POST /api/contato: recebe a mensagem do formulário de contato.
 *
 * Somente POST é exportado. Para outros métodos o Next.js responde 405
 * automaticamente. Handlers que não são GET nunca entram em cache. Toda a
 * lógica (origem, limite de requisições, validação, entrega) fica em
 * `src/lib/contact/server/handler.ts`.
 */

// Usa módulos do Node (crypto, net).
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleContactRequest(request);
}
