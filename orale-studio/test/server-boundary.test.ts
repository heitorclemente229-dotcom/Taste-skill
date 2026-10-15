import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SERVER_DIR = join(ROOT, "src/lib/booking/server");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("fronteira servidor/navegador", () => {
  it("todo módulo do backend de agendamento importa server-only", () => {
    const modules = walk(SERVER_DIR).filter((path) => !path.endsWith(".test.ts"));
    expect(modules.length).toBeGreaterThan(5);
    for (const path of modules) {
      expect(readFileSync(path, "utf8"), relative(ROOT, path)).toMatch(/^import "server-only";/);
    }
  });

  it("nenhum componente cliente importa módulos do servidor", () => {
    const clientFiles = walk(join(ROOT, "src")).filter((path) => /^["']use client["']/m.test(readFileSync(path, "utf8")));
    expect(clientFiles.length).toBeGreaterThan(0);
    for (const path of clientFiles) {
      const source = readFileSync(path, "utf8");
      expect(source, relative(ROOT, path)).not.toMatch(/from\s+["'][^"']*booking\/server/);
      expect(source, relative(ROOT, path)).not.toMatch(/process\.env\.(?!NEXT_PUBLIC_|NODE_ENV)/);
    }
  });

  it("nenhuma variável NEXT_PUBLIC_ carrega segredo", () => {
    for (const path of walk(join(ROOT, "src"))) {
      for (const match of readFileSync(path, "utf8").matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) {
        expect(match[0], relative(ROOT, path)).not.toMatch(/SECRET|KEY|TOKEN|SALT|PASSWORD/);
      }
    }
  });
});
