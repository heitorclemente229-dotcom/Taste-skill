import { readFile, rm } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { cspViolations, testClientIp, watchProblems } from "./helpers";

const DUMP = ".e2e/last-webhook.json";

test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": testClientIp(testInfo) });
});

async function openBooking(page: Page) {
  await page.goto("/");
  const trigger = page.locator("#inicio").getByRole("link", { name: "Agendar consulta" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Agendar consulta" });
  await expect(dialog).toBeVisible();
  return { dialog, trigger };
}

async function fillValid(page: Page, name = "Ana Teste") {
  const dialog = page.getByRole("dialog", { name: "Agendar consulta" });
  await dialog.getByLabel("Nome completo").fill(name);
  await dialog.getByLabel("Telefone ou WhatsApp").fill("11912345678");
  await dialog.getByText("Tarde", { exact: true }).click();
  await dialog.getByLabel(/Assunto/).selectOption("clareamento");
  await dialog.getByLabel(/Mensagem/).fill("Gostaria de agendar uma avaliação.");
  await dialog.getByRole("checkbox").check({ force: true });
  return dialog;
}

test("o diálogo abre pelo botão, fecha com Esc e devolve o foco", async ({ page }) => {
  const { dialog, trigger } = await openBooking(page);
  await expect(page.locator("html")).toHaveAttribute("data-modal-open", "true");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator("html")).not.toHaveAttribute("data-modal-open", "true");
});

test("o foco fica preso no diálogo durante a navegação por teclado", async ({ page }) => {
  const { dialog } = await openBooking(page);
  for (let i = 0; i < 25; i += 1) {
    await page.keyboard.press("Tab");
    const inside = await dialog.evaluate((element) => element.contains(document.activeElement));
    expect(inside).toBe(true);
  }
});

test("validação: campos obrigatórios, telefone e e-mail condicional", async ({ page }) => {
  const { dialog } = await openBooking(page);
  await dialog.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(dialog.getByText("Revise os campos destacados para continuar.")).toBeVisible();
  await expect(dialog.getByText("Informe seu nome.")).toBeVisible();
  await expect(dialog.getByText(/Informe um telefone com DDD/)).toBeVisible();
  await expect(dialog.getByText(/Confirme a leitura do aviso de privacidade/)).toBeVisible();
  await expect(dialog.getByLabel("Nome completo")).toBeFocused();
  await expect(dialog.getByLabel("Nome completo")).toHaveAttribute("aria-invalid", "true");

  await dialog.getByLabel("Telefone ou WhatsApp").fill("1234");
  await dialog.getByLabel("Telefone ou WhatsApp").blur();
  await expect(dialog.getByText(/Informe um telefone com DDD/)).toBeVisible();

  await dialog.getByText("E-mail", { exact: true }).last().click();
  await dialog.getByLabel("Nome completo").fill("Ana");
  await dialog.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(dialog.getByText("Informe um e-mail para receber o retorno por e-mail.")).toBeVisible();

  // "E-mail" também é uma opção de retorno (rádio): o campo é o textbox.
  await dialog.getByRole("textbox", { name: /^E-mail/ }).fill("ana@exemplo");
  await dialog.getByRole("textbox", { name: /^E-mail/ }).blur();
  await expect(dialog.getByText("Informe um e-mail válido.")).toBeVisible();
});

test("envio real: o servidor entrega ao webhook e só então confirma", async ({ page }) => {
  await rm(DUMP, { force: true });
  const problems = await watchProblems(page);
  await openBooking(page);
  const dialog = await fillValid(page, "Ana Teste");
  await dialog.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(dialog.getByRole("heading", { name: "Solicitação enviada, Ana." })).toBeVisible();
  await expect(dialog.getByText(/Este envio ainda não reserva um horário/)).toBeVisible();

  const payload = JSON.parse(await readFile(DUMP, "utf8"));
  expect(payload.data).toMatchObject({
    name: "Ana Teste",
    // O payload do webhook leva o telefone em E.164 (src/lib/booking/server/webhook.ts).
    phone: "+5511912345678",
    contactPreference: "whatsapp",
    period: "tarde",
    topic: "clareamento",
  });
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toContain("198.51.100.");
  expect(serialized).not.toContain("hp_field");
  expect(problems.errors).toEqual([]);
  expect(await cspViolations(page)).toEqual([]);
});

test("estado de indisponibilidade mostra canais alternativos", async ({ page }) => {
  await page.route("**/api/agendamento", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, code: "unavailable" }) }),
  );
  await openBooking(page);
  const dialog = await fillValid(page);
  await dialog.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(dialog.getByText(/O envio online está indisponível no momento/)).toBeVisible();
  await expect(dialog.getByRole("link", { name: /WhatsApp/ })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: /Solicitação enviada/ })).toHaveCount(0);
});

test("excesso de tentativas e falha de rede têm mensagens claras", async ({ page }) => {
  let mode: "rate" | "abort" = "rate";
  await page.route("**/api/agendamento", (route) =>
    mode === "rate"
      ? route.fulfill({
          status: 429,
          contentType: "application/json",
          headers: { "Retry-After": "120" },
          body: JSON.stringify({ ok: false, code: "rate_limited", retryAfter: 120 }),
        })
      : route.abort("failed"),
  );
  await openBooking(page);
  const dialog = await fillValid(page);
  await dialog.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(dialog.getByText("Muitas tentativas em pouco tempo. Tente novamente em 2 minutos.")).toBeVisible();
  mode = "abort";
  await dialog.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(dialog.getByText(/Sem conexão com o servidor/)).toBeVisible();
});

test("página /agendar funciona como destino direto e sem JavaScript não expõe dados na URL", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/agendar");
  await expect(page.getByRole("heading", { level: 1, name: "Agendar consulta" })).toBeVisible();
  await expect(page.locator("form")).toHaveAttribute("method", "post");
  await expect(page.getByText(/ative o JavaScript/)).toBeVisible();
  await context.close();
});

test("API recusa origem cruzada, tipo de conteúdo errado, corpo grande e métodos não permitidos", async ({ request, baseURL }) => {
  const valid = {
    name: "Ana",
    phone: "11912345678",
    contactPreference: "whatsapp",
    period: "manha",
    consent: true,
  };
  const crossSite = await request.post("/api/agendamento", {
    data: valid,
    headers: { Origin: "https://site-malicioso.example", "Sec-Fetch-Site": "cross-site", "x-forwarded-for": "198.51.100.251" },
  });
  expect(crossSite.status()).toBe(403);

  const wrongType = await request.post("/api/agendamento", {
    data: "name=Ana",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: baseURL!, "x-forwarded-for": "198.51.100.252" },
  });
  expect(wrongType.status()).toBe(415);

  const big = await request.post("/api/agendamento", {
    data: JSON.stringify({ ...valid, message: "a".repeat(20_000) }),
    headers: { "Content-Type": "application/json", Origin: baseURL!, "x-forwarded-for": "198.51.100.253" },
  });
  expect(big.status()).toBe(413);

  const get = await request.get("/api/agendamento");
  expect(get.status()).toBe(405);

  const body = await crossSite.json();
  expect(JSON.stringify(body)).not.toMatch(/stack|Error:|at \w+ \(/);
  expect(crossSite.headers()["cache-control"]).toContain("no-store");
});
