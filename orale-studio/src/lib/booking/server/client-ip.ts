import "server-only";
import { createHash } from "node:crypto";
import { isIP } from "node:net";

/**
 * Identificação do cliente para o limite de requisições.
 *
 * O IP só é lido de cabeçalho quando TRUST_PROXY=true, porque qualquer
 * cliente pode forjar X-Forwarded-For quando não há proxy confiável na
 * frente. Sem proxy confiável, todos compartilham a chave "direct".
 * O IP bruto nunca é armazenado: guardamos apenas um hash com sal.
 *
 * Com proxy confiável, o valor é lido da DIREITA para a esquerda: nginx
 * ($proxy_add_x_forwarded_for), AWS ALB, Cloudflare e outros ACRESCENTAM o
 * IP real ao final do que o cliente enviou, então os valores à esquerda podem
 * ser forjados. `hops` é o número de proxies confiáveis que acrescentam
 * valores (padrão 1). Um proxy que sobrescreve o cabeçalho deixa um único
 * valor, que também é o mais à direita.
 */

export type ClientIpOptions = { trustProxy: boolean; header: string; hops?: number };

/** Valor usado quando não há proxy confiável. */
export const DIRECT_CLIENT = "direct";
/** Valor usado quando o proxy é confiável mas o cabeçalho falta ou é inválido. */
export const UNKNOWN_CLIENT = "unknown";

/** Remove porta, colchetes e zona de um endereço; retorna null se não for IP. */
export function parseIp(raw: string): string | null {
  let value = raw.trim();
  if (!value || value.length > 64) return null;
  // [IPv6]:porta ou [IPv6]
  const bracketed = /^\[([^\]]+)\](?::\d{1,5})?$/.exec(value);
  if (bracketed) value = bracketed[1];
  // IPv4:porta
  else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d{1,5}$/.test(value)) value = value.slice(0, value.lastIndexOf(":"));
  // Identificador de zona (fe80::1%eth0) não faz parte do endereço.
  const zone = value.indexOf("%");
  if (zone !== -1) value = value.slice(0, zone);
  value = value.toLowerCase();
  const version = isIP(value);
  if (version === 4) return value;
  if (version === 6) {
    // IPv4 mapeado em IPv6 (::ffff:1.2.3.4) equivale ao IPv4.
    const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value);
    if (mapped && isIP(mapped[1]) === 4) return mapped[1];
    return value;
  }
  return null;
}

/** Retorna o IP do cliente, `UNKNOWN_CLIENT` ou `DIRECT_CLIENT`. */
export function getClientIp(headers: Headers, options: ClientIpOptions): string {
  if (!options.trustProxy) return DIRECT_CLIENT;
  const raw = headers.get(options.header);
  if (!raw) return UNKNOWN_CLIENT;
  // Valor acrescentado pelo proxy confiável mais distante (contando da direita).
  const entries = raw.split(",");
  const hops = Math.max(1, Math.floor(options.hops ?? 1));
  const entry = entries[entries.length - hops];
  if (entry === undefined) return UNKNOWN_CLIENT;
  return parseIp(entry) ?? UNKNOWN_CLIENT;
}

/** Expande um IPv6 válido para 8 grupos de 4 dígitos hexadecimais. */
function expandIpv6(ip: string): string[] {
  let address = ip;
  // IPv4 embutido no final (64:ff9b::1.2.3.4) vira dois grupos hexadecimais.
  const embedded = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address);
  if (embedded) {
    const [a, b, c, d] = embedded[1].split(".").map(Number);
    const hex = `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
    address = address.slice(0, embedded.index) + hex;
  }
  const [head, tail] = address.split("::");
  const left = head ? head.split(":") : [];
  const right = tail !== undefined && tail !== "" ? tail.split(":") : [];
  const missing = tail === undefined ? 0 : 8 - left.length - right.length;
  return [...left, ...Array<string>(missing).fill("0"), ...right].map((group) => group.padStart(4, "0"));
}

/**
 * Sujeito do limite: o próprio IPv4, ou o prefixo /64 do IPv6 (um único
 * cliente costuma controlar o /64 inteiro e poderia trocar de endereço).
 */
export function rateLimitSubject(clientIp: string): string {
  if (isIP(clientIp) === 6) return `${expandIpv6(clientIp).slice(0, 4).join(":")}::/64`;
  return clientIp;
}

/** Chave do cliente: SHA-256(sal + sujeito), truncado. Nunca guarda o IP. */
export function deriveClientKey(clientIp: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${rateLimitSubject(clientIp)}`).digest("hex").slice(0, 32);
}
