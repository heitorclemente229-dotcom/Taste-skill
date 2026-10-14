import { describe, expect, it, vi } from "vitest";
import { SITEVERIFY_URL, verifyTurnstile } from "./turnstile";

function fetchReturning(response: Response | (() => never)) {
  return vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    typeof response === "function" ? response() : response,
  );
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("verifyTurnstile", () => {
  it("envia secret e response em formulário, sem IP, com prazo de 5 s", async () => {
    const fetchMock = fetchReturning(json({ success: true }));
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    const result = await verifyTurnstile("tok", "sec", { fetch: fetchMock as unknown as typeof fetch });
    expect(result).toEqual({ status: "ok", upstreamStatus: 200 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(SITEVERIFY_URL);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("content-type")).toBe("application/x-www-form-urlencoded");
    const form = new URLSearchParams(String(init?.body));
    expect([...form.keys()].sort()).toEqual(["response", "secret"]);
    expect(form.get("secret")).toBe("sec");
    expect(form.get("response")).toBe("tok");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(timeoutSpy).toHaveBeenCalledWith(5000);
  });

  it.each([
    [json({ success: false, "error-codes": ["invalid-input-response"] }), { status: "failed", upstreamStatus: 200 }],
    [json({ success: false, "error-codes": ["timeout-or-duplicate"] }), { status: "failed", upstreamStatus: 200 }],
    [json({ success: "true" }), { status: "failed", upstreamStatus: 200 }],
    [json({ success: false, "error-codes": ["invalid-input-secret"] }), { status: "misconfigured", upstreamStatus: 200 }],
    [json({ success: false, "error-codes": ["internal-error"] }), { status: "unavailable", reason: "upstream_status", upstreamStatus: 200 }],
    [json({}, 500), { status: "unavailable", reason: "upstream_status", upstreamStatus: 500 }],
    [new Response("<html>", { status: 200 }), { status: "unavailable", reason: "upstream_status", upstreamStatus: 200 }],
  ])("interpreta a resposta %#", async (response, expected) => {
    const result = await verifyTurnstile("tok", "sec", { fetch: fetchReturning(response) as unknown as typeof fetch });
    expect(result).toEqual(expected);
  });

  it("indisponível em falha de rede ou prazo", async () => {
    const network = fetchReturning(() => {
      throw new TypeError("fetch failed");
    });
    expect(await verifyTurnstile("t", "s", { fetch: network as unknown as typeof fetch })).toEqual({
      status: "unavailable",
      reason: "network",
    });

    const slow = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason))),
    );
    expect(await verifyTurnstile("t", "s", { fetch: slow as unknown as typeof fetch, timeoutMs: 20 })).toEqual({
      status: "unavailable",
      reason: "timeout",
    });
  });
});
