import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { scrollThrough, testClientIp } from "./helpers";

test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": testClientIp(testInfo) });
});

const PAGES = ["/", "/agendar", "/privacidade", "/tratamentos/ortodontia"];

for (const path of PAGES) {
  test(`acessibilidade (axe, WCAG 2.1 AA): ${path}`, async ({ page }) => {
    // Movimento reduzido: avalia o estado final dos elementos, sem animações em curso.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await scrollThrough(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
    expect(
      serious.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });
}

test("acessibilidade do diálogo de agendamento aberto", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#inicio").getByRole("link", { name: "Agendar consulta" }).click();
  await expect(page.getByRole("dialog", { name: "Agendar consulta" })).toBeVisible();
  const results = await new AxeBuilder({ page }).include("dialog[open]").withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
  expect(serious.map((violation) => violation.id)).toEqual([]);
});
