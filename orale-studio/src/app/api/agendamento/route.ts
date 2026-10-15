import { handleBookingRequest } from "@/lib/booking/server/handler";

/**
 * POST /api/agendamento: recebe a solicitação de agendamento do formulário.
 *
 * Somente POST é exportado. Para outros métodos o Next.js responde 405
 * automaticamente (e 204 com `Allow` para OPTIONS). Handlers que não são GET
 * nunca entram em cache, então `dynamic` não é necessário (e essa opção nem
 * existe com Cache Components). Toda a lógica fica em `handler.ts`.
 */

// Usa módulos do Node (crypto, net); o runtime Edge está descontinuado.
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleBookingRequest(request);
}
