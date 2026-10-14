import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de ponta a ponta contra o build de produção (`next start`).
 *
 * O servidor sobe com a entrega por webhook apontando para o receptor local
 * (scripts/mock-webhook.mjs), de modo que o envio do formulário é testado de
 * verdade, com assinatura HMAC verificada, sem simular sucesso na interface.
 *
 * Pré-requisito: `npm run build`.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const WEBHOOK_PORT = Number(process.env.E2E_WEBHOOK_PORT ?? 4010);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SECRET = "e2e-segredo-apenas-para-teste";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: `node scripts/mock-webhook.mjs`,
      port: WEBHOOK_PORT,
      reuseExistingServer: false,
      env: {
        PORT: String(WEBHOOK_PORT),
        BOOKING_WEBHOOK_SECRET: SECRET,
        MOCK_WEBHOOK_DUMP: ".e2e/last-webhook.json",
      },
    },
    {
      command: `npx next start -p ${PORT} -H 127.0.0.1`,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        SITE_URL: BASE_URL,
        BOOKING_DELIVERY: "webhook",
        BOOKING_WEBHOOK_URL: `http://127.0.0.1:${WEBHOOK_PORT}/hook`,
        BOOKING_WEBHOOK_SECRET: SECRET,
        // Cada teste envia um X-Forwarded-For próprio (como faria um proxy
        // reverso), para que o limitador de requisições trate cada um como um
        // cliente diferente. O limitador em si é coberto pelos testes da API.
        TRUST_PROXY: "true",
        CLIENT_IP_HEADER: "x-forwarded-for",
      },
    },
  ],
});
