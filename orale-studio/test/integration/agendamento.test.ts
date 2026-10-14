import { createHmac, timingSafeEqual } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as routeModule from "@/app/api/agendamento/route";
import { POST } from "@/app/api/agendamento/route";
import { LIMITS } from "@/lib/booking/schema";
import { handleBookingRequest } from "@/lib/booking/server/handler";
import { resetLogState } from "@/lib/booking/server/log";
import { resetRateLimits } from "@/lib/booking/server/rate-limit";
import {
  PERSON,
  PII_FRAGMENTS,
  RESEND_ENV,
  SITE_ORIGIN,
  TURNSTILE_ENV,
  WEBHOOK_ENV,
  WEBHOOK_SECRET,
  WEBHOOK_URL,
  bookingRequest,
  captureConsole,
  headerOf,
  mockFetch,
  readJson,
  useEnv,
  validInput,
} from "../helpers";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ok = () => new Response(JSON.stringify({ received: true }), { status: 200 });

let consoleLines: string[] = [];

beforeEach(async () => {
  await resetRateLimits();
  resetLogState();
  useEnv(WEBHOOK_ENV);
  consoleLines = captureConsole();
});

afterEach(() => {
  // Vale para todos os cenários: nenhum dado pessoal vai para o log.
  const output = consoleLines.join("\n");
  for (const fragment of PII_FRAGMENTS) expect(output).not.toContain(fragment);
});

function expectApiHeaders(response: Response) {
  expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("content-security-policy")).toBe("default-src 'none'; frame-ancestors 'none'");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
}

describe("módulo da rota", () => {
  it("exporta somente POST (o Next responde 405 para os demais métodos) e o runtime Node", () => {
    expect(Object.keys(routeModule).sort()).toEqual(["POST", "runtime"]);
    expect(routeModule.runtime).toBe("nodejs");
  });
});

describe("entrega por webhook", () => {
  it("responde 200 somente depois do 2xx e envia payload assinado sem IP", async () => {
    useEnv({ ...WEBHOOK_ENV, TRUST_PROXY: "true" });
    const { calls } = mockFetch(ok);
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    const before = Math.floor(Date.now() / 1000);

    const response = await POST(
      bookingRequest({
        headers: { "x-forwarded-for": "203.0.113.77, 10.0.0.1", "user-agent": "AgenteDeTeste/9.9" },
        body: validInput({ hp_field: "" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true });
    expectApiHeaders(response);
    expect(timeoutSpy).toHaveBeenCalledWith(8000);

    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url).toBe(WEBHOOK_URL);
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("error");
    expect(headerOf(init, "content-type")).toBe("application/json");

    const rawBody = String(init.body);
    const timestamp = headerOf(init, "x-orale-timestamp") ?? "";
    expect(Number(timestamp)).toBeGreaterThanOrEqual(before);
    expect(Number(timestamp)).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));

    const signature = headerOf(init, "x-orale-signature") ?? "";
    const expected = `sha256=${createHmac("sha256", WEBHOOK_SECRET).update(`${timestamp}.${rawBody}`).digest("hex")}`;
    expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
    expect(timingSafeEqual(Buffer.from(signature), Buffer.from(expected))).toBe(true);

    const payload = JSON.parse(rawBody);
    expect(payload).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      receivedAt: expect.any(String),
      source: "site",
      privacyNoticeVersion: expect.any(String),
      data: {
        name: PERSON.name,
        phone: `+55${PERSON.phoneDigits}`,
        email: PERSON.email,
        contactPreference: "whatsapp",
        period: "manha",
        topic: "avaliacao",
        message: "Gostaria de marcar uma avaliação.\nPode ser às terças.",
        consent: true,
      },
    });
    expect(new Date(payload.receivedAt).toISOString()).toBe(payload.receivedAt);
    // Nada de IP, user agent, honeypot ou token no que sai do servidor.
    expect(rawBody).not.toContain("203.0.113.77");
    expect(rawBody).not.toContain("10.0.0.1");
    expect(rawBody).not.toContain("AgenteDeTeste");
    expect(rawBody).not.toMatch(/"(ip|userAgent|hp_field|turnstileToken)"/);
  });

  it("envia null para campos opcionais vazios", async () => {
    const { calls } = mockFetch(ok);
    const response = await POST(bookingRequest({ body: validInput({ email: "", topic: "", message: "" }) }));
    expect(response.status).toBe(200);
    const payload = JSON.parse(String(calls[0].init.body));
    expect(payload.data).toMatchObject({ email: null, topic: null, message: null });
  });

  it("responde 502 quando o webhook devolve 500, sem repassar o corpo externo", async () => {
    mockFetch(() => new Response("stack trace secreto do receptor", { status: 500 }));
    const response = await POST(bookingRequest());
    expect(response.status).toBe(502);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ ok: false, code: "delivery_failed" });
    expect(text).not.toContain("secreto");
    expectApiHeaders(response);
  });

  it("trata 3xx e 4xx do receptor como falha", async () => {
    mockFetch(() => new Response(null, { status: 401 }));
    expect((await POST(bookingRequest())).status).toBe(502);
  });

  it("responde 502 quando o envio estoura o prazo", async () => {
    mockFetch(() => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    });
    const response = await POST(bookingRequest());
    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({ ok: false, code: "delivery_failed" });
  });

  it("o prazo realmente aborta um receptor que não responde", async () => {
    const fetchStub = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );
    const response = await handleBookingRequest(bookingRequest(), {
      fetch: fetchStub as unknown as typeof fetch,
      timeouts: { deliveryMs: 30 },
    });
    expect(response.status).toBe(502);
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it("responde 502 em falha de rede", async () => {
    mockFetch(() => {
      throw new TypeError("fetch failed");
    });
    expect((await POST(bookingRequest())).status).toBe(502);
  });
});

describe("entrega por Resend", () => {
  beforeEach(() => useEnv(RESEND_ENV));

  it("envia para o destinatário do ambiente, com reply_to e HTML escapado", async () => {
    const { calls } = mockFetch(() => new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
    const message = `<script>alert('x')</script> & "aspas"`;
    const response = await POST(bookingRequest({ body: validInput({ message }) }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    const { url, init } = calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(headerOf(init, "authorization")).toBe(`Bearer ${RESEND_ENV.RESEND_API_KEY}`);
    expect(headerOf(init, "content-type")).toBe("application/json");

    const payload = JSON.parse(String(init.body));
    expect(payload.from).toBe(RESEND_ENV.BOOKING_EMAIL_FROM);
    expect(payload.to).toEqual([RESEND_ENV.BOOKING_EMAIL_TO]);
    expect(payload.reply_to).toBe(PERSON.email);
    expect(payload.subject).toBe(`Nova solicitação de agendamento: ${PERSON.firstName}`);

    expect(payload.html).not.toContain("<script>");
    expect(payload.html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt; &amp; &quot;aspas&quot;");
    expect(payload.html).toContain("Joana D&#39;Ávila Testemunha");
    expect(payload.html).toContain("(21) 99876-5432");
    expect(payload.html).toContain("WhatsApp");
    expect(payload.html).toContain("Manhã");
    expect(payload.html).toContain("Primeira avaliação");
    expect(payload.text).toContain(message);
    expect(payload.text).toContain("(horário de Brasília)");
  });

  it("o visitante não escolhe o destinatário (chaves extras são recusadas)", async () => {
    const { fn } = mockFetch(ok);
    const response = await POST(bookingRequest({ body: validInput({ to: "atacante@example.com" }) }));
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ ok: false, code: "invalid_request" });
    expect(text).not.toContain('"to"');
    expect(text).not.toContain("atacante");
    expect(fn).not.toHaveBeenCalled();
  });

  it("omite reply_to quando a pessoa não informou e-mail", async () => {
    const { calls } = mockFetch(ok);
    const response = await POST(bookingRequest({ body: validInput({ email: "" }) }));
    expect(response.status).toBe(200);
    expect(JSON.parse(String(calls[0].init.body))).not.toHaveProperty("reply_to");
  });

  it("responde 502 quando a Resend falha", async () => {
    mockFetch(() => new Response(JSON.stringify({ message: "API key is invalid" }), { status: 403 }));
    const response = await POST(bookingRequest());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("API key");
  });
});

describe("configuração ausente ou incompleta", () => {
  const cases: [string, Record<string, string>, string?][] = [
    ["sem BOOKING_DELIVERY", { SITE_URL: SITE_ORIGIN }],
    ["driver desconhecido", { SITE_URL: SITE_ORIGIN, BOOKING_DELIVERY: "smtp" }],
    ["resend sem destinatário", { ...RESEND_ENV, BOOKING_EMAIL_TO: "" }],
    ["resend com chave de exemplo", { ...RESEND_ENV, RESEND_API_KEY: "re_xxxxxxxx" }],
    ["resend com remetente inválido", { ...RESEND_ENV, BOOKING_EMAIL_FROM: "nao-e-email" }],
    ["webhook sem segredo", { ...WEBHOOK_ENV, BOOKING_WEBHOOK_SECRET: "" }],
    ["webhook com segredo curto", { ...WEBHOOK_ENV, BOOKING_WEBHOOK_SECRET: "curto" }],
    ["webhook com URL inválida", { ...WEBHOOK_ENV, BOOKING_WEBHOOK_URL: "nao-e-url" }],
    ["webhook http em produção", { ...WEBHOOK_ENV, BOOKING_WEBHOOK_URL: "http://hooks.orale.example/x" }, "production"],
  ];

  it.each(cases)("%s responde 503 sem chamar serviços externos", async (_label, env, nodeEnv) => {
    useEnv(env, nodeEnv);
    const { fn } = mockFetch(ok);
    const response = await POST(bookingRequest());
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ ok: false, code: "unavailable" });
    expect(text).not.toMatch(/BOOKING|RESEND|WEBHOOK|re_/);
    expect(fn).not.toHaveBeenCalled();
    expectApiHeaders(response);
    expect(consoleLines.some((line) => line.includes('"event":"booking.config"'))).toBe(true);
  });

  it("o aviso de configuração não contém segredos", async () => {
    useEnv({ ...RESEND_ENV, BOOKING_EMAIL_TO: "" });
    mockFetch(ok);
    await POST(bookingRequest());
    const output = consoleLines.join("\n");
    expect(output).toContain("resend_to_invalid");
    expect(output).not.toContain(RESEND_ENV.RESEND_API_KEY);
    expect(output).not.toContain("agendamento@orale.example");
  });

  it("aceita http para o receptor local fora de produção", async () => {
    useEnv({ ...WEBHOOK_ENV, BOOKING_WEBHOOK_URL: "http://127.0.0.1:4010/webhook" });
    const { calls } = mockFetch(ok);
    expect((await POST(bookingRequest())).status).toBe(200);
    expect(calls[0].url).toBe("http://127.0.0.1:4010/webhook");
  });
});

describe("corpo da requisição", () => {
  it("400 para JSON inválido", async () => {
    const response = await POST(bookingRequest({ rawBody: "{nome: Joana" }));
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ ok: false, code: "invalid_request" });
    expectApiHeaders(response);
  });

  it.each([
    ["lista", "[]"],
    ["null", "null"],
    ["texto", '"oi"'],
    ["número", "42"],
    ["vazio", ""],
  ])("400 quando o corpo é %s", async (_label, rawBody) => {
    const response = await POST(bookingRequest({ rawBody }));
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ ok: false, code: "invalid_request" });
  });

  it("400 para UTF-8 inválido", async () => {
    const response = await POST(bookingRequest({ rawBody: new Uint8Array([0x7b, 0x22, 0xff, 0xfe, 0x22, 0x7d]) }));
    expect(response.status).toBe(400);
  });

  it("413 quando o Content-Length declarado passa do limite", async () => {
    const { fn } = mockFetch(ok);
    const response = await POST(bookingRequest({ headers: { "content-length": String(LIMITS.bodyMaxBytes + 1) } }));
    expect(response.status).toBe(413);
    expect(await readJson(response)).toEqual({ ok: false, code: "invalid_request" });
    expect(fn).not.toHaveBeenCalled();
  });

  it("413 sem Content-Length quando o fluxo passa do limite", async () => {
    const chunk = new TextEncoder().encode("a".repeat(1024));
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        // Fluxo "infinito": o servidor precisa parar sozinho.
        sent += 1;
        controller.enqueue(chunk);
        if (sent > 1000) controller.close();
      },
    });
    const request = bookingRequest({ rawBody: stream });
    expect(request.headers.get("content-length")).toBeNull();
    const response = await POST(request);
    expect(response.status).toBe(413);
    expect(sent).toBeLessThan(20);
  });

  it("413 quando o Content-Length mente para menos", async () => {
    const big = JSON.stringify(validInput({ message: "a".repeat(LIMITS.bodyMaxBytes) }));
    const response = await POST(bookingRequest({ rawBody: big, headers: { "content-length": "100" } }));
    expect(response.status).toBe(413);
  });

  it("400 para Content-Length malformado", async () => {
    const response = await POST(bookingRequest({ headers: { "content-length": "12abc" } }));
    expect(response.status).toBe(400);
  });

  it.each([
    ["text/plain", "text/plain;charset=UTF-8"],
    ["form", "application/x-www-form-urlencoded"],
    ["multipart", "multipart/form-data; boundary=x"],
    ["charset errado", "application/json; charset=iso-8859-1"],
    ["parecido", "application/jsonp"],
  ])("415 para Content-Type %s", async (_label, contentType) => {
    const { fn } = mockFetch(ok);
    const response = await POST(bookingRequest({ headers: { "content-type": contentType } }));
    expect(response.status).toBe(415);
    expect(await readJson(response)).toEqual({ ok: false, code: "invalid_request" });
    expect(fn).not.toHaveBeenCalled();
    expectApiHeaders(response);
  });

  it("415 sem Content-Type", async () => {
    const request = new Request(`${SITE_ORIGIN}/api/agendamento`, {
      method: "POST",
      headers: { origin: SITE_ORIGIN, "sec-fetch-site": "same-origin" },
      body: new Blob([JSON.stringify(validInput())]),
    });
    expect((await POST(request)).status).toBe(415);
  });

  it("aceita application/json com charset UTF-8", async () => {
    mockFetch(ok);
    const response = await POST(bookingRequest({ headers: { "content-type": "Application/JSON; charset=UTF-8" } }));
    expect(response.status).toBe(200);
  });
});

describe("validação", () => {
  it("400 com erros por campo", async () => {
    const { fn } = mockFetch(ok);
    const response = await POST(bookingRequest({ body: validInput({ name: "J", phone: "123", consent: false }) }));
    expect(response.status).toBe(400);
    const body = await readJson(response);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("invalid");
    expect(body.fieldErrors).toEqual({
      name: expect.any(String),
      phone: expect.any(String),
      consent: expect.any(String),
    });
    expect(fn).not.toHaveBeenCalled();
    expectApiHeaders(response);
  });

  it("exige e-mail quando a preferência é e-mail", async () => {
    const response = await POST(bookingRequest({ body: validInput({ contactPreference: "email", email: "" }) }));
    expect(response.status).toBe(400);
    expect((await readJson(response)).fieldErrors).toEqual({
      email: "Informe um e-mail para receber o retorno por e-mail.",
    });
  });

  it("recusa links na mensagem", async () => {
    const response = await POST(bookingRequest({ body: validInput({ message: "veja www.exemplo.com" }) }));
    expect(response.status).toBe(400);
    expect((await readJson(response)).fieldErrors).toHaveProperty("message");
  });

  it("recusa chaves desconhecidas sem ecoar o nome", async () => {
    const response = await POST(bookingRequest({ body: validInput({ campoSecretoXyz: 1 }) }));
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ ok: false, code: "invalid_request" });
    expect(text).not.toContain("campoSecretoXyz");
  });

  it("recusa __proto__ como chave desconhecida", async () => {
    const rawBody = `{"__proto__":{"admin":true},${JSON.stringify(validInput()).slice(1)}`;
    const response = await POST(bookingRequest({ rawBody }));
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ ok: false, code: "invalid_request" });
    expect(({} as Record<string, unknown>).admin).toBeUndefined();
  });

  it("400 genérico quando o erro não é de um campo do formulário", async () => {
    const response = await POST(bookingRequest({ body: validInput({ turnstileToken: 123 }) }));
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ ok: false, code: "invalid_request" });
  });
});

describe("honeypot", () => {
  it("400 genérico, sem simular sucesso e sem entregar", async () => {
    const { fn } = mockFetch(ok);
    const response = await POST(bookingRequest({ body: validInput({ hp_field: "http://spam.example" }) }));
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ ok: false, code: "invalid_request" });
    expect(fn).not.toHaveBeenCalled();
  });

  it("conta para o limite de requisições", async () => {
    mockFetch(ok);
    for (let i = 0; i < 3; i += 1) {
      expect((await POST(bookingRequest({ body: validInput({ hp_field: "robô" }) }))).status).toBe(400);
    }
    expect((await POST(bookingRequest())).status).toBe(429);
  });
});

describe("origem", () => {
  it("403 para Origin de outro site", async () => {
    const { fn } = mockFetch(ok);
    const response = await POST(bookingRequest({ headers: { origin: "https://evil.example", "sec-fetch-site": null } }));
    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ ok: false, code: "forbidden" });
    expect(fn).not.toHaveBeenCalled();
    expectApiHeaders(response);
  });

  it.each(["cross-site", "same-site", "none"])("403 para Sec-Fetch-Site %s", async (value) => {
    const response = await POST(bookingRequest({ headers: { "sec-fetch-site": value } }));
    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ ok: false, code: "forbidden" });
  });

  it("403 para Origin null", async () => {
    expect((await POST(bookingRequest({ headers: { origin: "null" } }))).status).toBe(403);
  });

  it("em produção exige Origin e não aceita localhost", async () => {
    useEnv(WEBHOOK_ENV, "production");
    mockFetch(ok);
    expect((await POST(bookingRequest({ headers: { origin: null } }))).status).toBe(403);
    expect((await POST(bookingRequest({ headers: { origin: "http://localhost:3000" } }))).status).toBe(403);
    expect((await POST(bookingRequest())).status).toBe(200);
  });

  it("fora de produção aceita localhost e ausência de Origin", async () => {
    mockFetch(ok);
    expect((await POST(bookingRequest({ headers: { origin: "http://localhost:3000" } }))).status).toBe(200);
    expect((await POST(bookingRequest({ headers: { origin: null, "sec-fetch-site": null } }))).status).toBe(200);
  });

  it("aceita origens extras de ALLOWED_ORIGINS", async () => {
    useEnv({ ...WEBHOOK_ENV, ALLOWED_ORIGINS: "https://orale.example, https://agenda.orale.example/" }, "production");
    mockFetch(ok);
    expect((await POST(bookingRequest({ headers: { origin: "https://agenda.orale.example" } }))).status).toBe(200);
    expect((await POST(bookingRequest({ headers: { origin: "https://outra.orale.example" } }))).status).toBe(403);
  });
});

describe("limite de requisições", () => {
  it("429 depois de 3 por minuto, com Retry-After", async () => {
    mockFetch(ok);
    for (let i = 0; i < 3; i += 1) expect((await POST(bookingRequest())).status).toBe(200);
    const response = await POST(bookingRequest());
    expect(response.status).toBe(429);
    const retryAfter = Number(response.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
    expect(await readJson(response)).toEqual({ ok: false, code: "rate_limited", retryAfter });
    expectApiHeaders(response);
  });

  it("conta também requisições inválidas e separa clientes quando TRUST_PROXY=true", async () => {
    useEnv({ ...WEBHOOK_ENV, TRUST_PROXY: "true" });
    mockFetch(ok);
    const from = (ip: string, body?: unknown) => bookingRequest({ headers: { "x-forwarded-for": ip }, body });
    for (let i = 0; i < 3; i += 1) expect((await POST(from("203.0.113.10", { name: "" }))).status).toBe(400);
    expect((await POST(from("203.0.113.10"))).status).toBe(429);
    expect((await POST(from("203.0.113.11"))).status).toBe(200);
  });

  it("sem TRUST_PROXY o cabeçalho de IP é ignorado (todos compartilham a chave)", async () => {
    mockFetch(ok);
    for (let i = 0; i < 3; i += 1) {
      const response = await POST(bookingRequest({ headers: { "x-forwarded-for": `203.0.113.${i + 20}` } }));
      expect(response.status).toBe(200);
    }
    expect((await POST(bookingRequest({ headers: { "x-forwarded-for": "203.0.113.99" } }))).status).toBe(429);
  });

  it("aplica o limite por hora (8) com janela deslizante", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const start = new Date("2026-10-14T12:00:00Z").getTime();
      vi.setSystemTime(start);
      mockFetch(ok);
      let sent = 0;
      while (sent < 8) {
        for (let i = 0; i < 3 && sent < 8; i += 1, sent += 1) expect((await POST(bookingRequest())).status).toBe(200);
        vi.setSystemTime(Date.now() + 61_000);
      }
      const response = await POST(bookingRequest());
      expect(response.status).toBe(429);
      // A primeira solicitação (às 12:00) expira às 13:00.
      const expected = Math.ceil((start + 3_600_000 - Date.now()) / 1000);
      expect(Number(response.headers.get("retry-after"))).toBe(expected);
      vi.setSystemTime(start + 3_600_001);
      expect((await POST(bookingRequest())).status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it("aplica o teto global de 120 por hora entre todos os clientes", async () => {
    useEnv({ ...WEBHOOK_ENV, TRUST_PROXY: "true" });
    const { fn } = mockFetch(ok);
    const from = (i: number) =>
      bookingRequest({ headers: { "x-forwarded-for": `198.51.${Math.floor(i / 250)}.${(i % 250) + 1}` } });
    for (let i = 0; i < 120; i += 1) expect((await POST(from(i))).status).toBe(200);
    const response = await POST(from(500));
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(3500);
    expect(fn).toHaveBeenCalledTimes(120);
  });
});

describe("Turnstile", () => {
  beforeEach(() => useEnv({ ...WEBHOOK_ENV, ...TURNSTILE_ENV }));

  const turnstileFetch = (verdict: unknown, status = 200) =>
    mockFetch((url) => (url === SITEVERIFY ? new Response(JSON.stringify(verdict), { status }) : ok()));

  it("verifica o token (sem enviar o IP) e entrega", async () => {
    useEnv({ ...WEBHOOK_ENV, ...TURNSTILE_ENV, TRUST_PROXY: "true" });
    const { calls } = turnstileFetch({ success: true });
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    const response = await POST(
      bookingRequest({ headers: { "x-forwarded-for": "203.0.113.50" }, body: validInput({ turnstileToken: "token-valido" }) }),
    );
    expect(response.status).toBe(200);
    expect(calls.map((call) => call.url)).toEqual([SITEVERIFY, WEBHOOK_URL]);
    const verify = calls[0].init;
    expect(verify.method).toBe("POST");
    expect(headerOf(verify, "content-type")).toBe("application/x-www-form-urlencoded");
    const form = new URLSearchParams(String(verify.body));
    expect(form.get("secret")).toBe(TURNSTILE_ENV.TURNSTILE_SECRET_KEY);
    expect(form.get("response")).toBe("token-valido");
    expect(form.has("remoteip")).toBe(false);
    expect(String(verify.body)).not.toContain("203.0.113.50");
    expect(timeoutSpy).toHaveBeenCalledWith(5000);
    // O token não segue para o webhook.
    expect(String(calls[1].init.body)).not.toContain("token-valido");
  });

  it("400 verification_failed quando o token é recusado", async () => {
    const { calls } = turnstileFetch({ success: false, "error-codes": ["invalid-input-response"] });
    const response = await POST(bookingRequest({ body: validInput({ turnstileToken: "token-ruim" }) }));
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ ok: false, code: "verification_failed" });
    expect(calls).toHaveLength(1);
  });

  it("400 verification_failed quando o token falta", async () => {
    const { fn } = turnstileFetch({ success: true });
    const response = await POST(bookingRequest());
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ ok: false, code: "verification_failed" });
    expect(fn).not.toHaveBeenCalled();
  });

  it("503 quando a Cloudflare não responde", async () => {
    const { calls } = mockFetch(() => {
      throw new TypeError("fetch failed");
    });
    const response = await POST(bookingRequest({ body: validInput({ turnstileToken: "t" }) }));
    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({ ok: false, code: "unavailable" });
    expect(calls).toHaveLength(1);
  });

  it("503 quando a Cloudflare devolve erro HTTP", async () => {
    turnstileFetch({}, 500);
    expect((await POST(bookingRequest({ body: validInput({ turnstileToken: "t" }) }))).status).toBe(503);
  });

  it("503 quando a chave secreta é recusada (erro de configuração)", async () => {
    turnstileFetch({ success: false, "error-codes": ["invalid-input-secret"] });
    const response = await POST(bookingRequest({ body: validInput({ turnstileToken: "t" }) }));
    expect(response.status).toBe(503);
    expect(consoleLines.join("\n")).toContain("turnstile_secret_rejected");
  });

  it("fica desativado quando só uma das chaves existe", async () => {
    useEnv({ ...WEBHOOK_ENV, TURNSTILE_SITE_KEY: TURNSTILE_ENV.TURNSTILE_SITE_KEY });
    const { calls } = mockFetch(ok);
    expect((await POST(bookingRequest())).status).toBe(200);
    expect(calls.map((call) => call.url)).toEqual([WEBHOOK_URL]);
  });

  it("não gasta o token quando a entrega não está configurada", async () => {
    useEnv({ SITE_URL: SITE_ORIGIN, ...TURNSTILE_ENV });
    const { fn } = mockFetch(ok);
    const response = await POST(bookingRequest({ body: validInput({ turnstileToken: "t" }) }));
    expect(response.status).toBe(503);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("erros inesperados e logs", () => {
  it("500 genérico quando algo inesperado acontece, sem detalhes", async () => {
    const broken = {
      headers: {
        get() {
          throw new Error(`falha interna com ${PERSON.email}`);
        },
      },
    } as unknown as Request;
    const response = await POST(broken);
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ ok: false, code: "error" });
    expect(text).not.toContain("falha");
    expectApiHeaders(response);
    const output = consoleLines.join("\n");
    expect(output).toContain('"errorName":"Error"');
    expect(output).not.toContain("falha interna");
  });

  it("o log de um envio completo não contém nome, telefone, e-mail nem IP", async () => {
    useEnv({ ...RESEND_ENV, TRUST_PROXY: "true" });
    mockFetch(ok);
    await POST(bookingRequest({ headers: { "x-forwarded-for": "2001:db8::77" } }));
    await POST(bookingRequest({ headers: { "x-forwarded-for": "203.0.113.9" }, body: validInput({ phone: "abc" }) }));
    expect(consoleLines.length).toBeGreaterThan(0);
    for (const line of consoleLines) {
      const entry = JSON.parse(line);
      expect(Object.keys(entry).every((key) =>
        ["level", "event", "requestId", "outcome", "status", "driver", "upstreamStatus", "durationMs", "reason", "issue", "errorName"].includes(key),
      )).toBe(true);
    }
    const output = consoleLines.join("\n");
    for (const fragment of PII_FRAGMENTS) expect(output).not.toContain(fragment);
    expect(output).toContain('"outcome":"ok"');
    expect(output).toContain('"driver":"resend"');
    expect(output).toContain('"upstreamStatus":200');
  });
});
