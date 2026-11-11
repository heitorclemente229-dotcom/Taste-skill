import { readFile, rm } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { cspViolations, testClientIp, watchProblems } from "./helpers";

const DUMP = ".e2e/last-webhook.json";

test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": testClientIp(testInfo) });
});

async function openForm(page: Page) {
  await page.goto("/");
  const form = page.locator("#contato form");
  await form.scrollIntoViewIfNeeded();
  return form;
}

async function fillValid(page: Page, name = "Ana Teste") {
  const form = page.locator("#contato form");
  await form.getByLabel("Nome").fill(name);
  await form.getByLabel("Telefone ou WhatsApp").fill("11912345678");
  await form.getByText("Tarde", { exact: true }).click();
  await form.getByLabel(/Assunto/).selectOption("avaliacao");
  await form.getByLabel(/Mensagem/).fill("Gostaria de agendar uma avaliação.");
  await form.getByRole("checkbox").check({ force: true });
  return form;
}

test("validação: campos obrigatórios, telefone e e-mail condicional", async ({ page }) => {
  const form = await openForm(page);
  await form.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(form.getByText("Revise os campos destacados e envie de novo.")).toBeVisible();
  await expect(form.getByText("Informe seu nome.")).toBeVisible();
  await expect(form.getByText(/Informe um telefone com DDD/)).toBeVisible();
  await expect(form.getByText(/Confirme a leitura do aviso de privacidade/)).toBeVisible();
  await expect(form.getByLabel("Nome")).toBeFocused();
  await expect(form.getByLabel("Nome")).toHaveAttribute("aria-invalid", "true");

  // "E-mail" também é uma opção de retorno (rádio): o campo é o textbox.
  await form.getByText("E-mail", { exact: true }).last().click();
  await form.getByLabel("Nome").fill("Ana");
  await form.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(form.getByText("Informe um e-mail para receber o retorno por e-mail.")).toBeVisible();
  await form.getByRole("textbox", { name: /^E-mail/ }).fill("ana@exemplo");
  await form.getByRole("textbox", { name: /^E-mail/ }).blur();
  await expect(form.getByText("Informe um e-mail válido.")).toBeVisible();
});

test("envio real: o servidor entrega ao webhook assinado e só então confirma", async ({ page }) => {
  await rm(DUMP, { force: true });
  const problems = await watchProblems(page);
  await openForm(page);
  const form = await fillValid(page, "Ana Teste");
  await form.getByRole("button", { name: "Enviar mensagem" }).click();
  const section = page.locator("#contato");
  await expect(section.getByRole("heading", { name: "Mensagem enviada, Ana." })).toBeVisible();
  await expect(section.getByText(/Este envio ainda não reserva um horário/)).toBeVisible();

  const payload = JSON.parse(await readFile(DUMP, "utf8"));
  expect(payload.data).toMatchObject({
    name: "Ana Teste",
    // O webhook leva o telefone em E.164 (src/lib/contact/server/webhook.ts).
    phone: "+5511912345678",
    contactPreference: "whatsapp",
    period: "tarde",
    topic: "avaliacao",
  });
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toContain("198.51.100.");
  expect(serialized).not.toContain("hp_field");
  expect(problems.errors).toEqual([]);
  expect(await cspViolations(page)).toEqual([]);

  // Depois do sucesso dá para enviar outra mensagem, com o formulário limpo.
  await section.getByRole("button", { name: "Enviar outra mensagem" }).click();
  await expect(section.locator("form").getByLabel("Nome")).toHaveValue("");
});

test("indisponível: não finge sucesso e encaminha ao WhatsApp", async ({ page }) => {
  await page.route("**/api/contato", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, code: "unavailable" }) }),
  );
  await openForm(page);
  const form = await fillValid(page);
  await form.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(form.getByText(/O envio pelo site está indisponível no momento/)).toBeVisible();
  await expect(form.getByRole("link", { name: /fale com a clínica pelo WhatsApp/ })).toHaveAttribute("href", /^https:\/\/wa\.me\/5511976556438/);
  await expect(page.getByRole("heading", { name: /Mensagem enviada/ })).toHaveCount(0);
});

test("excesso de tentativas e falha de rede têm mensagens claras", async ({ page }) => {
  let mode: "rate" | "abort" = "rate";
  await page.route("**/api/contato", (route) =>
    mode === "rate"
      ? route.fulfill({
          status: 429,
          contentType: "application/json",
          headers: { "Retry-After": "120" },
          body: JSON.stringify({ ok: false, code: "rate_limited", retryAfter: 120 }),
        })
      : route.abort("failed"),
  );
  await openForm(page);
  const form = await fillValid(page);
  await form.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(form.getByText(/Muitas tentativas em pouco tempo. Aguarde 2 min/)).toBeVisible();
  mode = "abort";
  await form.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(form.getByText(/Não foi possível conectar/)).toBeVisible();
});

test("sem JavaScript o formulário não expõe dados na URL e indica o WhatsApp", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#contato form")).toHaveAttribute("method", "post");
  await expect(page.locator("#contato").getByText(/ative o JavaScript/)).toBeVisible();
  // Sem JavaScript, o conteúdo revelado na rolagem aparece no estado final.
  await expect(page.getByRole("heading", { name: "Localização e contato" })).toBeVisible();
  await context.close();
});

test("API recusa origem cruzada, tipo de conteúdo errado, corpo grande, armadilha e métodos não permitidos", async ({ request, baseURL }) => {
  const valid = { name: "Ana", phone: "11912345678", contactPreference: "whatsapp", period: "manha", consent: true };
  const crossSite = await request.post("/api/contato", {
    data: valid,
    headers: { Origin: "https://site-malicioso.example", "Sec-Fetch-Site": "cross-site", "x-forwarded-for": "198.51.100.251" },
  });
  expect(crossSite.status()).toBe(403);

  const wrongType = await request.post("/api/contato", {
    data: "name=Ana",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: baseURL!, "x-forwarded-for": "198.51.100.252" },
  });
  expect(wrongType.status()).toBe(415);

  const big = await request.post("/api/contato", {
    data: JSON.stringify({ ...valid, message: "a".repeat(20_000) }),
    headers: { "Content-Type": "application/json", Origin: baseURL!, "x-forwarded-for": "198.51.100.253" },
  });
  expect(big.status()).toBe(413);

  const trap = await request.post("/api/contato", {
    data: { ...valid, hp_field: "sou um robô" },
    headers: { Origin: baseURL!, "x-forwarded-for": "198.51.100.254" },
  });
  expect(trap.status()).toBe(400);

  expect((await request.get("/api/contato")).status()).toBe(405);

  const body = await crossSite.json();
  expect(JSON.stringify(body)).not.toMatch(/stack|Error:|at \w+ \(/);
  expect(crossSite.headers()["cache-control"]).toContain("no-store");
});
