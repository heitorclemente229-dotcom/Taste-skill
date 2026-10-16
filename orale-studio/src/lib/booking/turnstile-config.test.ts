import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readBookingEnv } from "./server/env";
import { isTurnstileConfigured } from "./turnstile-config";

const VALUES = [undefined, "", "   ", "\t\n", "0x4AAA", " 0x4AAA ", "chave com espaço"];

describe("isTurnstileConfigured", () => {
  it("exige as duas chaves com conteúdo; só espaços conta como ausente", () => {
    expect(isTurnstileConfigured({})).toBe(false);
    expect(isTurnstileConfigured({ TURNSTILE_SITE_KEY: "0x4AAA" })).toBe(false);
    expect(isTurnstileConfigured({ TURNSTILE_SITE_KEY: "0x4AAA", TURNSTILE_SECRET_KEY: "   " })).toBe(false);
    expect(isTurnstileConfigured({ TURNSTILE_SITE_KEY: "\n", TURNSTILE_SECRET_KEY: "0x4BBB" })).toBe(false);
    expect(isTurnstileConfigured({ TURNSTILE_SITE_KEY: " 0x4AAA ", TURNSTILE_SECRET_KEY: "0x4BBB" })).toBe(true);
  });

  it("concorda com o servidor em todas as combinações", () => {
    for (const site of VALUES) {
      for (const secret of VALUES) {
        const env = { TURNSTILE_SITE_KEY: site, TURNSTILE_SECRET_KEY: secret };
        expect(isTurnstileConfigured(env), JSON.stringify(env)).toBe(readBookingEnv(env).turnstile.enabled);
      }
    }
  });

  it("nenhum outro módulo decide sozinho a partir de process.env", () => {
    const root = fileURLToPath(new URL("../../", import.meta.url));
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return walk(path);
        return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [path] : [];
      });
    for (const path of walk(root)) {
      expect(readFileSync(path, "utf8"), relative(root, path)).not.toMatch(/process\.env\.TURNSTILE_/);
    }
  });
});
