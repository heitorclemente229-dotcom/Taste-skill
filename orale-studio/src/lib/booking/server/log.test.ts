import { afterEach, describe, expect, it, vi } from "vitest";
import { errorName, log, resetLogState, warnOnce, type LogFields } from "./log";

function capture() {
  const lines: string[] = [];
  for (const method of ["info", "warn", "error"] as const) {
    vi.spyOn(console, method).mockImplementation((line: string) => {
      lines.push(`${method}:${line}`);
    });
  }
  return lines;
}

afterEach(() => resetLogState());

describe("log", () => {
  it("escreve uma linha JSON no nível certo", () => {
    const lines = capture();
    log("info", "booking.request", { requestId: "0b7a4c1e-0000-4000-8000-000000000000", outcome: "ok", status: 200, durationMs: 12.7 });
    log("warn", "booking.config", { issue: "resend_to_invalid" });
    log("error", "booking.unexpected_error", { errorName: "TypeError" });
    expect(lines).toEqual([
      'info:{"level":"info","event":"booking.request","requestId":"0b7a4c1e-0000-4000-8000-000000000000","outcome":"ok","status":200,"durationMs":13}',
      'warn:{"level":"warn","event":"booking.config","issue":"resend_to_invalid"}',
      'error:{"level":"error","event":"booking.unexpected_error","errorName":"TypeError"}',
    ]);
  });

  it("descarta campos fora da lista e textos livres", () => {
    const lines = capture();
    const fields = {
      requestId: "Maria Souza",
      outcome: "Maria Souza",
      reason: "ana@example.org",
      errorName: "Error: telefone 11912345678",
      name: "Maria",
      email: "ana@example.org",
      ip: "203.0.113.5",
      body: { a: 1 },
      status: Number.NaN,
    } as unknown as LogFields;
    log("info", "booking.request", fields);
    expect(lines).toEqual(['info:{"level":"info","event":"booking.request"}']);
  });

  it("ignora nomes de evento inválidos", () => {
    const lines = capture();
    log("info", "Nome: Maria", {});
    expect(lines).toEqual([]);
  });

  it("warnOnce avisa uma vez por processo", () => {
    const lines = capture();
    warnOnce("trust_proxy_disabled");
    warnOnce("trust_proxy_disabled");
    expect(lines).toHaveLength(1);
    resetLogState();
    warnOnce("trust_proxy_disabled");
    expect(lines).toHaveLength(2);
  });

  it("errorName nunca devolve a mensagem", () => {
    expect(errorName(new TypeError("dados de Maria"))).toBe("TypeError");
    expect(errorName("texto")).toBe("string");
    const weird = new Error("x");
    weird.name = "Nome com espaço";
    expect(errorName(weird)).toBe("Error");
  });
});
