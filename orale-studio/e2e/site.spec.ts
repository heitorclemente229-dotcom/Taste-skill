import { expect, test } from "@playwright/test";
import { treatments } from "../src/content/treatments";
import { cspViolations, scrollThrough, testClientIp, watchProblems } from "./helpers";

test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": testClientIp(testInfo) });
});

test("página inicial carrega sem erros de console, exceções ou violações de CSP", async ({ page }) => {
  const problems = await watchProblems(page);
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await scrollThrough(page);
  await page.waitForTimeout(500);
  expect(problems.errors, "exceções na página").toEqual([]);
  expect(problems.console, "erros de console").toEqual([]);
  expect(await cspViolations(page), "violações de CSP").toEqual([]);
});

test("cabeçalhos de segurança estão presentes na página", async ({ page }) => {
  const response = await page.goto("/");
  const headers = response!.headers();
  const csp = headers["content-security-policy"];
  expect(csp).toContain("default-src 'self'");
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain("unsafe-eval");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("o nonce muda a cada requisição", async ({ request }) => {
  const first = (await request.get("/")).headers()["content-security-policy"];
  const second = (await request.get("/")).headers()["content-security-policy"];
  expect(first).not.toEqual(second);
});

test("estrutura semântica: título, um h1 e marcos principais", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ORALÉ STUDIO/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Sorrir,\s*naturalmente\./);
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeAttached();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
});

test("não há rolagem horizontal indevida", async ({ page }) => {
  await page.goto("/");
  await scrollThrough(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("navegação do cabeçalho leva às seções", async ({ page, isMobile }) => {
  test.skip(isMobile, "no celular a navegação fica no menu");
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Principal" });
  for (const [label, id] of [
    ["Tratamentos", "tratamentos"],
    ["Clínica", "clinica"],
    ["Equipe", "equipe"],
    ["Contato", "contato"],
  ] as const) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test("menu móvel abre, prende o foco, fecha com Esc e navega", async ({ page, isMobile }) => {
  test.skip(!isMobile, "menu móvel");
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Menu" });
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await trigger.click();
  await menu.getByRole("link", { name: "Equipe" }).click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/#equipe$/);
  await expect(page.locator("#equipe")).toBeInViewport();
});

test("cada tratamento leva à sua página de detalhes", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#tratamentos");
  for (const treatment of treatments) {
    await expect(section.getByRole("link", { name: treatment.title, exact: true })).toHaveAttribute(
      "href",
      `/tratamentos/${treatment.slug}`,
    );
  }
  await section.getByRole("link", { name: treatments[0].title, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/tratamentos/${treatments[0].slug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(treatments[0].title);
});

test("todas as páginas de tratamento respondem e têm h1 próprio", async ({ page }) => {
  for (const treatment of treatments) {
    const response = await page.goto(`/tratamentos/${treatment.slug}`);
    expect(response?.status(), treatment.slug).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(treatment.title);
  }
});

test("rota inexistente responde 404 com página da marca", async ({ page }) => {
  const response = await page.goto("/tratamentos/nao-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const other = await page.goto("/qualquer-coisa");
  expect(other?.status()).toBe(404);
});

test("páginas institucionais carregam", async ({ page }) => {
  for (const path of ["/privacidade", "/agendar"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("com movimento reduzido o conteúdo aparece sem depender de animação", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const heroImage = page.locator("#inicio img").first();
  await expect(heroImage).toBeVisible();
  await page.waitForTimeout(300);
  const opacity = await page.locator("#inicio p").first().evaluate((element) => getComputedStyle(element.parentElement!).opacity);
  expect(Number(opacity)).toBe(1);
  await context.close();
});

test("robots, sitemap e manifesto respondem", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap:");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const treatment of treatments) expect(xml).toContain(`/tratamentos/${treatment.slug}`);
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
});
