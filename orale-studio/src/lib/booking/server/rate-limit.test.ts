import { afterEach, describe, expect, it } from "vitest";
import {
  CLIENT_RULES,
  GLOBAL_KEY,
  GLOBAL_RULES,
  MemoryRateLimitStore,
  consumeClient,
  consumeGlobal,
  evaluate,
  resetRateLimits,
  setRateLimitStore,
  toRetryAfterSeconds,
  type RateLimitDecision,
  type RateLimitRule,
  type RateLimitStore,
} from "./rate-limit";

const T0 = 1_800_000_000_000;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

afterEach(async () => {
  await resetRateLimits();
});

describe("evaluate", () => {
  it("permite abaixo do limite e calcula a espera exata acima dele", () => {
    const rules: RateLimitRule[] = [{ limit: 2, windowMs: MINUTE }];
    expect(evaluate([T0], rules, T0 + 1000)).toEqual({ allowed: true });
    expect(evaluate([T0, T0 + 1000], rules, T0 + 5000)).toEqual({ allowed: false, retryAfterMs: MINUTE - 5000 });
    // Registros fora da janela não contam.
    expect(evaluate([T0, T0 + 1000], rules, T0 + MINUTE + 1)).toEqual({ allowed: true });
  });

  it("usa a maior espera entre as regras violadas", () => {
    const timestamps = Array.from({ length: 8 }, (_, i) => T0 + i * 2 * MINUTE);
    const now = T0 + 15 * MINUTE;
    const decision = evaluate(timestamps, CLIENT_RULES, now);
    expect(decision).toEqual({ allowed: false, retryAfterMs: T0 + HOUR - now });
  });
});

describe("MemoryRateLimitStore", () => {
  it("3 por minuto, depois libera quando o primeiro registro sai da janela", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 3; i += 1) expect(await store.consume("a", CLIENT_RULES, T0 + i * 1000)).toEqual({ allowed: true });
    expect(await store.consume("a", CLIENT_RULES, T0 + 10_000)).toEqual({ allowed: false, retryAfterMs: MINUTE - 10_000 });
    expect((await store.consume("a", CLIENT_RULES, T0 + MINUTE)).allowed).toBe(true);
  });

  it("8 por hora em janela deslizante", async () => {
    const store = new MemoryRateLimitStore();
    let now = T0;
    for (let i = 0; i < 8; i += 1) {
      expect((await store.consume("a", CLIENT_RULES, now)).allowed).toBe(true);
      now += 2 * MINUTE;
    }
    const denied = await store.consume("a", CLIENT_RULES, now);
    expect(denied).toEqual({ allowed: false, retryAfterMs: T0 + HOUR - now });
    expect((await store.consume("a", CLIENT_RULES, T0 + HOUR + 1)).allowed).toBe(true);
  });

  it("recusas não são registradas (o Retry-After continua exato)", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 3; i += 1) await store.consume("a", CLIENT_RULES, T0);
    for (let i = 1; i <= 20; i += 1) expect((await store.consume("a", CLIENT_RULES, T0 + i * 1000)).allowed).toBe(false);
    expect((await store.consume("a", CLIENT_RULES, T0 + MINUTE + 1)).allowed).toBe(true);
  });

  it("chaves diferentes não interferem", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 3; i += 1) await store.consume("a", CLIENT_RULES, T0);
    expect((await store.consume("a", CLIENT_RULES, T0)).allowed).toBe(false);
    expect((await store.consume("b", CLIENT_RULES, T0)).allowed).toBe(true);
  });

  it("teto global de 120 por hora", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 120; i += 1) expect((await store.consume(GLOBAL_KEY, GLOBAL_RULES, T0 + i)).allowed).toBe(true);
    const denied = (await store.consume(GLOBAL_KEY, GLOBAL_RULES, T0 + 1000)) as Extract<RateLimitDecision, { allowed: false }>;
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterMs).toBe(HOUR - 1000);
  });

  it("limita a memória descartando a chave menos usada", async () => {
    const store = new MemoryRateLimitStore({ maxKeys: 3 });
    await store.consume("a", CLIENT_RULES, T0);
    await store.consume("b", CLIENT_RULES, T0 + 1);
    await store.consume("c", CLIENT_RULES, T0 + 2);
    // "a" volta a ser usada; "b" passa a ser a menos recente.
    await store.consume("a", CLIENT_RULES, T0 + 3);
    await store.consume("d", CLIENT_RULES, T0 + 4);
    expect(store.size).toBe(3);
    expect(store.has("b")).toBe(false);
    expect(store.has("a")).toBe(true);
    expect(store.has("d")).toBe(true);
  });

  it("nunca descarta o teto global por falta de espaço", async () => {
    const store = new MemoryRateLimitStore({ maxKeys: 3 });
    await store.consume(GLOBAL_KEY, GLOBAL_RULES, T0);
    for (let i = 0; i < 50; i += 1) await store.consume(`cliente-${i}`, CLIENT_RULES, T0 + i);
    expect(store.size).toBe(3);
    expect(store.has(GLOBAL_KEY)).toBe(true);
  });

  it("remove chaves expiradas antes de descartar ativas", async () => {
    const store = new MemoryRateLimitStore({ maxKeys: 2 });
    await store.consume("velha", CLIENT_RULES, T0);
    await store.consume("ativa", CLIENT_RULES, T0 + HOUR);
    await store.consume("nova", CLIENT_RULES, T0 + HOUR + 1);
    expect(store.has("velha")).toBe(false);
    expect(store.has("ativa")).toBe(true);
    expect(store.has("nova")).toBe(true);
  });

  it("prune remove somente o que expirou", async () => {
    const store = new MemoryRateLimitStore();
    await store.consume("a", CLIENT_RULES, T0);
    await store.consume("b", CLIENT_RULES, T0 + 30 * MINUTE);
    store.prune(T0 + HOUR);
    expect(store.has("a")).toBe(false);
    expect(store.has("b")).toBe(true);
  });
});

describe("API do limitador", () => {
  it("consumeClient e consumeGlobal usam chaves separadas", async () => {
    for (let i = 0; i < 3; i += 1) expect((await consumeClient("k", T0)).allowed).toBe(true);
    expect((await consumeClient("k", T0)).allowed).toBe(false);
    expect((await consumeGlobal(T0)).allowed).toBe(true);
  });

  it("aceita um armazenamento compartilhado (ex.: Redis) pela interface", async () => {
    const calls: string[] = [];
    const custom: RateLimitStore = {
      async consume(key) {
        calls.push(key);
        return { allowed: false, retryAfterMs: 1234 };
      },
      async reset() {},
    };
    setRateLimitStore(custom);
    expect(await consumeClient("abc", T0)).toEqual({ allowed: false, retryAfterMs: 1234 });
    expect(await consumeGlobal(T0)).toEqual({ allowed: false, retryAfterMs: 1234 });
    expect(calls).toEqual(["client:abc", GLOBAL_KEY]);
    await resetRateLimits();
    expect((await consumeClient("abc", T0)).allowed).toBe(true);
  });

  it("Retry-After em segundos, arredondado para cima, mínimo 1", () => {
    expect(toRetryAfterSeconds(1)).toBe(1);
    expect(toRetryAfterSeconds(0)).toBe(1);
    expect(toRetryAfterSeconds(1000)).toBe(1);
    expect(toRetryAfterSeconds(1001)).toBe(2);
    expect(toRetryAfterSeconds(59_500)).toBe(60);
  });
});
