import "server-only";

/**
 * Leitura defensiva do corpo JSON.
 *
 * Não confia no Content-Length: lê o fluxo com limite rígido de bytes e
 * interrompe assim que o limite é ultrapassado. Também impõe um prazo total
 * de leitura, para que clientes lentos não segurem a requisição.
 */

export type BodyResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; status: 400 | 408 | 413; reason: BodyFailure };

export type BodyFailure =
  | "content_length_invalid"
  | "too_large"
  | "timeout"
  | "empty"
  | "encoding"
  | "json"
  | "not_object";

/** Aceita somente application/json, com charset opcional igual a UTF-8. */
export function isJsonContentType(header: string | null): boolean {
  if (!header) return false;
  const [type, ...params] = header.split(";");
  if (type.trim().toLowerCase() !== "application/json") return false;
  for (const param of params) {
    const [name, rawValue = ""] = param.split("=");
    if (name.trim().toLowerCase() !== "charset") continue;
    const value = rawValue.trim().replace(/^"|"$/g, "").toLowerCase();
    if (value !== "utf-8" && value !== "utf8") return false;
  }
  return true;
}

/** Recusa cedo quando o Content-Length declarado já passa do limite. */
export function checkContentLength(header: string | null, maxBytes: number): BodyResult | null {
  if (header === null) return null;
  if (!/^\d{1,15}$/.test(header.trim())) return { ok: false, status: 400, reason: "content_length_invalid" };
  if (Number(header.trim()) > maxBytes) return { ok: false, status: 413, reason: "too_large" };
  return null;
}

const TIMEOUT = Symbol("timeout");

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T | typeof TIMEOUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<typeof TIMEOUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMEOUT), Math.max(0, ms));
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

/** Lê até `maxBytes` bytes do fluxo, ou informa estouro de tamanho ou de prazo. */
async function readLimited(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
  timeoutMs: number,
): Promise<Uint8Array | "too_large" | "timeout"> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  const deadline = Date.now() + timeoutMs;
  try {
    for (;;) {
      const result = await withDeadline(reader.read(), deadline - Date.now());
      if (result === TIMEOUT) {
        void reader.cancel().catch(() => {});
        return "timeout";
      }
      if (result.done) break;
      total += result.value.byteLength;
      if (total > maxBytes) {
        void reader.cancel().catch(() => {});
        return "too_large";
      }
      chunks.push(result.value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Leitor já liberado ou fluxo cancelado: nada a fazer.
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export type ReadBodyOptions = { maxBytes: number; timeoutMs?: number };

export async function readJsonBody(request: Request, options: ReadBodyOptions): Promise<BodyResult> {
  const { maxBytes, timeoutMs = 10_000 } = options;
  const declared = checkContentLength(request.headers.get("content-length"), maxBytes);
  if (declared) return declared;
  if (!request.body) return { ok: false, status: 400, reason: "empty" };

  const bytes = await readLimited(request.body, maxBytes, timeoutMs);
  if (bytes === "too_large") return { ok: false, status: 413, reason: "too_large" };
  if (bytes === "timeout") return { ok: false, status: 408, reason: "timeout" };
  if (bytes.byteLength === 0) return { ok: false, status: 400, reason: "empty" };

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, status: 400, reason: "encoding" };
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, reason: "json" };
  }
  if (!isPlainObject(value)) return { ok: false, status: 400, reason: "not_object" };
  return { ok: true, value };
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
