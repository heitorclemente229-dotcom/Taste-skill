import "server-only";

/**
 * Limite de requisições por janela deslizante.
 *
 * O armazenamento padrão fica na memória do processo: serve para um único
 * servidor Node. Em ambiente serverless ou com várias instâncias cada
 * instância teria o próprio contador, então troque por um armazenamento
 * compartilhado (Redis, Upstash) que implemente `RateLimitStore` e
 * registre-o com `setRateLimitStore`.
 */

export type RateLimitRule = { limit: number; windowMs: number };

export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterMs: number };

export interface RateLimitStore {
  /**
   * Verifica todas as regras da chave e, somente se nenhuma for excedida,
   * registra o evento. Precisa ser atômico por chave. Eventos recusados não
   * são registrados, para que o Retry-After informado seja exato.
   */
  consume(key: string, rules: readonly RateLimitRule[], now: number): Promise<RateLimitDecision>;
  reset(): Promise<void>;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Por cliente: 3 por minuto e 8 por hora. */
export const CLIENT_RULES: readonly RateLimitRule[] = [
  { limit: 3, windowMs: MINUTE },
  { limit: 8, windowMs: HOUR },
];

/** Teto global por hora, somado entre todos os clientes (protege a cota de e-mail). */
export const GLOBAL_RULES: readonly RateLimitRule[] = [{ limit: 120, windowMs: HOUR }];

export const GLOBAL_KEY = "global";

/** Calcula a decisão a partir dos registros (em ordem crescente) de uma chave. */
export function evaluate(timestamps: readonly number[], rules: readonly RateLimitRule[], now: number): RateLimitDecision {
  let retryAfterMs = 0;
  for (const rule of rules) {
    const since = now - rule.windowMs;
    const inWindow = timestamps.filter((t) => t > since);
    if (inWindow.length >= rule.limit) {
      // O registro que precisa expirar para abrir uma vaga nesta regra.
      const blocking = inWindow[inWindow.length - rule.limit];
      retryAfterMs = Math.max(retryAfterMs, blocking + rule.windowMs - now);
    }
  }
  return retryAfterMs > 0 ? { allowed: false, retryAfterMs } : { allowed: true };
}

export type MemoryStoreOptions = {
  /** Número máximo de chaves guardadas (padrão 5000). */
  maxKeys?: number;
  /** Chaves que nunca são descartadas por falta de espaço (padrão: o teto global). */
  protectedKeys?: readonly string[];
};

/** Armazenamento em memória com número máximo de chaves (descarta a menos usada). */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, { timestamps: number[]; expiresAt: number }>();
  private readonly maxKeys: number;
  private readonly protectedKeys: ReadonlySet<string>;
  private calls = 0;

  constructor(options: MemoryStoreOptions = {}) {
    this.maxKeys = Math.max(2, options.maxKeys ?? 5000);
    this.protectedKeys = new Set(options.protectedKeys ?? [GLOBAL_KEY]);
  }

  get size(): number {
    return this.entries.size;
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  async consume(key: string, rules: readonly RateLimitRule[], now: number): Promise<RateLimitDecision> {
    this.calls += 1;
    if (this.calls % 256 === 0) this.prune(now);

    const maxWindow = Math.max(...rules.map((rule) => rule.windowMs));
    const entry = this.entries.get(key);
    const timestamps = entry ? entry.timestamps.filter((t) => t > now - maxWindow) : [];

    const decision = evaluate(timestamps, rules, now);
    if (!decision.allowed) return decision;

    timestamps.push(now);
    // Reinsere para manter a ordem do Map do menos para o mais recente.
    this.entries.delete(key);
    if (this.entries.size >= this.maxKeys) {
      this.prune(now);
      // Pula chaves protegidas: sem isso, muitas chaves novas apagariam o teto global.
      for (const candidate of this.entries.keys()) {
        if (this.entries.size < this.maxKeys) break;
        if (!this.protectedKeys.has(candidate)) this.entries.delete(candidate);
      }
    }
    this.entries.set(key, { timestamps, expiresAt: now + maxWindow });
    return decision;
  }

  /** Remove chaves cujos registros já expiraram. */
  prune(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }

  async reset(): Promise<void> {
    this.entries.clear();
    this.calls = 0;
  }
}

let store: RateLimitStore = new MemoryRateLimitStore();

/** Troca o armazenamento (por exemplo, por um adaptador Redis). */
export function setRateLimitStore(next: RateLimitStore): void {
  store = next;
}

export function getRateLimitStore(): RateLimitStore {
  return store;
}

/** Limpa os contadores e volta ao armazenamento em memória padrão. Para testes. */
export async function resetRateLimits(): Promise<void> {
  await store.reset();
  store = new MemoryRateLimitStore();
}

export function consumeClient(clientKey: string, now = Date.now()): Promise<RateLimitDecision> {
  return store.consume(`client:${clientKey}`, CLIENT_RULES, now);
}

export function consumeGlobal(now = Date.now()): Promise<RateLimitDecision> {
  return store.consume(GLOBAL_KEY, GLOBAL_RULES, now);
}

/** Converte milissegundos para o valor do cabeçalho Retry-After (segundos, mínimo 1). */
export function toRetryAfterSeconds(ms: number): number {
  return Math.max(1, Math.ceil(ms / 1000));
}
