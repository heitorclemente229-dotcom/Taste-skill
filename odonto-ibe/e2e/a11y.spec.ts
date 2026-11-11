import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { scrollThrough, testClientIp } from "./helpers";

test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": testClientIp(testInfo) });
});

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const PAGES = ["/", "/privacidade", "/tratamentos/ortodontia"];

function seriousOf(results: Awaited<ReturnType<AxeBuilder["analyze"]>>) {
  return results.violations
    .filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
}

for (const path of PAGES) {
  test(`acessibilidade (axe, WCAG 2.1 AA): ${path}`, async ({ page }) => {
    // Movimento reduzido: avalia o estado final dos elementos, sem animações em curso.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await scrollThrough(page);
    expect(seriousOf(await new AxeBuilder({ page }).withTags(TAGS).analyze())).toEqual([]);
  });
}

test("acessibilidade com animações ligadas, depois de rolar a página inteira", async ({ page }) => {
  await page.goto("/");
  await scrollThrough(page);
  await page.waitForTimeout(1600);
  expect(seriousOf(await new AxeBuilder({ page }).withTags(TAGS).analyze())).toEqual([]);
});

test("acessibilidade do menu do celular aberto", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  expect(seriousOf(await new AxeBuilder({ page }).include("dialog[open]").withTags(TAGS).analyze())).toEqual([]);
});

test("acessibilidade do formulário com erros de validação à mostra", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const form = page.locator("#contato form");
  await form.scrollIntoViewIfNeeded();
  await form.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(form.getByText("Informe seu nome.")).toBeVisible();
  expect(seriousOf(await new AxeBuilder({ page }).include("#contato").withTags(TAGS).analyze())).toEqual([]);
});
