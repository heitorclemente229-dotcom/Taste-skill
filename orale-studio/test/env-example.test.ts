import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readBookingEnv } from "@/lib/booking/server/env";

/** Lê o .env.example como o dotenv faria (KEY=valor, aspas opcionais, comentários ignorados). */
function readExample(): Record<string, string> {
  const text = readFileSync(fileURLToPath(new URL("../.env.example", import.meta.url)), "utf8");
  const env: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match) continue;
    env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
  }
  return env;
}

const example = readExample();

describe(".env.example", () => {
  it("copiado sem revisão, não entrega nada (o formulário fica indisponível)", () => {
    expect(readBookingEnv({ ...example, NODE_ENV: "production" }).delivery.ok).toBe(false);
  });

  it("um destino de exemplo esquecido nunca recebe dados (Resend com chave real)", () => {
    const env = readBookingEnv({ ...example, NODE_ENV: "production", RESEND_API_KEY: "re_chaveReal_1234567890" });
    expect(env.delivery).toMatchObject({ ok: false, issue: "resend_to_invalid" });
  });

  it("um destino de exemplo esquecido nunca recebe dados (webhook com segredo real)", () => {
    const env = readBookingEnv({
      ...example,
      NODE_ENV: "production",
      BOOKING_DELIVERY: "webhook",
      BOOKING_WEBHOOK_SECRET: "a".repeat(64),
    });
    expect(env.delivery).toMatchObject({ ok: false, issue: "webhook_url_invalid" });
  });

  it("não traz segredos preenchidos nem segredos em NEXT_PUBLIC_", () => {
    for (const key of ["TURNSTILE_SECRET_KEY", "TURNSTILE_SITE_KEY", "RATE_LIMIT_SALT", "BOOKING_EMAIL_TO", "BOOKING_WEBHOOK_URL"]) {
      expect(example[key], key).toBe("");
    }
    for (const key of Object.keys(example).filter((name) => name.startsWith("NEXT_PUBLIC_"))) {
      expect(key).not.toMatch(/SECRET|KEY|TOKEN|SALT|PASSWORD/);
    }
  });

  it("documenta todas as variáveis lidas pelo backend", () => {
    const source = ["src/lib/booking/server/env.ts", "src/proxy.ts"]
      .map((path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8"))
      .join("\n");
    const used = new Set([...source.matchAll(/env\.([A-Z][A-Z0-9_]+)/g)].map((match) => match[1]));
    used.delete("NODE_ENV");
    for (const key of used) expect(Object.keys(example), key).toContain(key);
  });
});
