import { vi } from "vitest";

/** Pessoa fictícia usada nos testes. Nada disso pode aparecer nos logs. */
export const PERSON = {
  name: "Joana D'Ávila Testemunha",
  firstName: "Joana",
  phone: "(21) 99876-5432",
  phoneDigits: "21998765432",
  email: "joana.testemunha@example.org",
} as const;

export const SITE_ORIGIN = "https://www.orale.example";
export const WEBHOOK_URL = "https://hooks.orale.example/agendamento";
export const WEBHOOK_SECRET = "whsec_test_0123456789abcdef0123456789abcdef";

export const ENV_KEYS = [
  "SITE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "ALLOWED_ORIGINS",
  "BOOKING_DELIVERY",
  "RESEND_API_KEY",
  "BOOKING_EMAIL_FROM",
  "BOOKING_EMAIL_TO",
  "BOOKING_WEBHOOK_URL",
  "BOOKING_WEBHOOK_SECRET",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "TRUST_PROXY",
  "TRUST_PROXY_HOPS",
  "CLIENT_IP_HEADER",
  "RATE_LIMIT_SALT",
] as const;

export const WEBHOOK_ENV = {
  SITE_URL: SITE_ORIGIN,
  BOOKING_DELIVERY: "webhook",
  BOOKING_WEBHOOK_URL: WEBHOOK_URL,
  BOOKING_WEBHOOK_SECRET: WEBHOOK_SECRET,
  RATE_LIMIT_SALT: "sal-de-teste",
} as const;

export const RESEND_ENV = {
  SITE_URL: SITE_ORIGIN,
  BOOKING_DELIVERY: "resend",
  RESEND_API_KEY: "re_test_1234567890abcdef",
  BOOKING_EMAIL_FROM: "Oralé Studio <agendamento@orale.example>",
  BOOKING_EMAIL_TO: "recepcao@orale.example",
  RATE_LIMIT_SALT: "sal-de-teste",
} as const;

/** Cloudflare: chaves públicas de teste (sempre aprovam no widget). */
export const TURNSTILE_ENV = {
  TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
} as const;

/** Limpa as variáveis do agendamento e aplica as informadas. */
export function useEnv(vars: Record<string, string | undefined>, nodeEnv = "test"): void {
  for (const key of ENV_KEYS) vi.stubEnv(key, undefined);
  vi.stubEnv("NODE_ENV", nodeEnv);
  for (const [key, value] of Object.entries(vars)) vi.stubEnv(key, value);
}

export function validInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: PERSON.name,
    phone: PERSON.phone,
    email: PERSON.email,
    contactPreference: "whatsapp",
    period: "manha",
    topic: "avaliacao",
    message: "Gostaria de marcar uma avaliação.\nPode ser às terças.",
    consent: true,
    ...overrides,
  };
}

export type RequestOptions = {
  body?: unknown;
  rawBody?: BodyInit;
  /** null remove o cabeçalho padrão. */
  headers?: Record<string, string | null>;
};

export function bookingRequest(options: RequestOptions = {}): Request {
  const headers = new Headers({
    "content-type": "application/json",
    origin: SITE_ORIGIN,
    "sec-fetch-site": "same-origin",
  });
  for (const [key, value] of Object.entries(options.headers ?? {})) {
    if (value === null) headers.delete(key);
    else headers.set(key, value);
  }
  const body = options.rawBody ?? JSON.stringify(options.body ?? validInput());
  return new Request(`${SITE_ORIGIN}/api/agendamento`, {
    method: "POST",
    headers,
    body,
    duplex: "half",
  } as RequestInit);
}

export type FetchCall = { url: string; init: RequestInit };

/** Substitui o fetch global e registra as chamadas. */
export function mockFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: FetchCall[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init: init ?? {} });
    return handler(url, init ?? {});
  });
  vi.stubGlobal("fetch", fn);
  return { fn, calls };
}

/** Captura tudo o que vai para o console. */
export function captureConsole(): string[] {
  const lines: string[] = [];
  for (const method of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      lines.push(args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))).join(" "));
    });
  }
  return lines;
}

/** Fragmentos que nunca podem aparecer no log. */
export const PII_FRAGMENTS = [
  PERSON.firstName,
  "Testemunha",
  PERSON.email,
  "joana.testemunha",
  PERSON.phoneDigits,
  PERSON.phone,
  "99876-5432",
  "203.0.113",
  "2001:db8",
];

export async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

export function headerOf(init: RequestInit, name: string): string | null {
  return new Headers(init.headers).get(name);
}
