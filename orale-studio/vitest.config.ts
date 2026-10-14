import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src/", import.meta.url));
const serverOnlyStub = fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // "server-only" lança erro fora do React Server; nos testes vira módulo vazio.
      { find: /^server-only$/, replacement: serverOnlyStub },
      { find: /^@\//, replacement: src },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
