import { expect, test, type Page } from "@playwright/test";
import { cspViolations, scrollThrough, testClientIp, watchProblems } from "./helpers";

const WHATSAPP_PREFIX = "https://wa.me/5511976556438?text=";
const WHATSAPP_MESSAGE = "Olá! Conheci a Odonto Ibe pelo site e gostaria de saber mais sobre os atendimentos.";

test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": testClientIp(testInfo) });
});

/** O mapa nunca chega a sair do computador de teste. */
async function blockGoogle(page: Page) {
  await page.route(/^https:\/\/([a-z0-9-]+\.)*google\.com\//, (route) => route.abort());
}

test("página inicial: conteúdo principal, sem erros de console nem violações de CSP", async ({ page }) => {
  const problems = await watchProblems(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seu sorriso merece um cuidado completo.");
  await scrollThrough(page);
  for (const id of ["inicio", "clinica", "tratamentos", "equipe", "diferenciais", "avaliacoes", "contato"]) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  await expect(page.getByRole("heading", { name: "Mais do que cuidar de sorrisos, cuidamos de pessoas." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A confiança de quem já conhece nosso trabalho." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Está na hora de cuidar do seu sorriso?" })).toBeVisible();
  expect(problems.errors).toEqual([]);
  expect(problems.console).toEqual([]);
  expect(await cspViolations(page)).toEqual([]);
});

test("as fotos ficam realmente visíveis depois de roladas (persiana aberta)", async ({ page }) => {
  await page.goto("/");
  const figures = page.locator("#clinica .slats");
  const count = await figures.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const figure = figures.nth(index);
    // Leva a foto para o terço superior da tela: ali os frisos já precisam estar abertos.
    await figure.evaluate((node) => {
      const top = node.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top - window.innerHeight * 0.15), behavior: "instant" });
    });
    await page.waitForTimeout(300);
    const state = await figure.evaluate((node) => {
      const image = node.querySelector("img");
      const covered = [...node.querySelectorAll<HTMLElement>(".slat")].map((slat) => slat.getBoundingClientRect().height);
      const style = image ? getComputedStyle(image) : null;
      return {
        loaded: Boolean(image && image.complete && image.naturalWidth > 0),
        opacity: style ? Number(style.opacity) : 0,
        height: image ? image.getBoundingClientRect().height : 0,
        maxSlatHeight: Math.max(0, ...covered),
      };
    });
    expect(state.loaded).toBe(true);
    expect(state.opacity).toBe(1);
    expect(state.height).toBeGreaterThan(100);
    // Friso aberto = altura visual zero (scaleY(0)).
    expect(state.maxSlatHeight).toBeLessThan(1);
  }
});

test("links de WhatsApp abrem a conversa certa com a mensagem inicial", async ({ page }) => {
  await page.goto("/");
  const links = page.locator("a[data-whatsapp]");
  expect(await links.count()).toBeGreaterThanOrEqual(3);
  const hero = page.locator("#inicio").getByRole("link", { name: /Agendar avaliação/ });
  const href = await hero.getAttribute("href");
  expect(href?.startsWith(WHATSAPP_PREFIX)).toBe(true);
  expect(decodeURIComponent(href!.slice(WHATSAPP_PREFIX.length))).toBe(WHATSAPP_MESSAGE);
  await expect(hero).toHaveAttribute("target", "_blank");
  await expect(hero).toHaveAttribute("rel", /noopener/);
  const cta = page.getByRole("link", { name: /Agendar pelo WhatsApp/ }).first();
  expect((await cta.getAttribute("href"))?.startsWith(WHATSAPP_PREFIX)).toBe(true);
});

for (const width of [360, 390]) {
  test(`cabeçalho em ${width}px: logo e botão Menu inteiros na tela, sem rolagem lateral`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 });
    await page.goto("/");
    const menu = page.getByRole("button", { name: "Menu" });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    const logo = await page.getByRole("link", { name: "Odonto Ibe, página inicial" }).boundingBox();
    expect(logo!.x + logo!.width).toBeLessThan(box!.x);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    // O título da primeira dobra cabe em duas linhas.
    const lines = await page.locator("#hero-title .mask-line").evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().height / parseFloat(getComputedStyle(node).lineHeight))),
    );
    expect(lines).toEqual([1, 1]);
  });
}

test("menu do celular: abre, prende o foco, navega e fecha com Esc", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Menu" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Menu" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 14; i += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole("link", { name: "Tratamentos" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/#tratamentos$/);
  await expect(page.locator("#tratamentos")).toBeInViewport();
});

test("navegação do cabeçalho leva às seções e marca a seção ativa", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Principal" });
  await nav.getByRole("link", { name: "Avaliações" }).click();
  await expect(page).toHaveURL(/#avaliacoes$/);
  await expect(page.locator("#avaliacoes")).toBeInViewport();
  await expect(nav.getByRole("link", { name: "Avaliações" })).toHaveAttribute("aria-current", "location");
});

test("tratamento: a lista leva à página de detalhe, que fica fora do Google enquanto não confirmada", async ({ page }) => {
  const problems = await watchProblems(page);
  await page.goto("/");
  await page.locator("#tratamentos").scrollIntoViewIfNeeded();
  await page.locator('#tratamentos a[href="/tratamentos/ortodontia"]').click();
  await expect(page).toHaveURL(/\/tratamentos\/ortodontia$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ortodontia");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const ask = page.getByRole("link", { name: /Perguntar sobre este tratamento/ });
  expect(decodeURIComponent((await ask.getAttribute("href")) ?? "")).toContain("gostaria de saber mais sobre ortodontia");
  await page.getByRole("link", { name: "Todos os tratamentos" }).click();
  await expect(page).toHaveURL(/\/#tratamentos$/);
  expect(problems.errors).toEqual([]);
  expect(await cspViolations(page)).toEqual([]);
});

test("mapa interativo só carrega depois do clique", async ({ page }) => {
  await blockGoogle(page);
  await page.goto("/");
  const section = page.locator("#contato");
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator("iframe")).toHaveCount(0);
  await section.getByRole("button", { name: "Ver mapa interativo" }).click();
  const frame = section.locator("iframe");
  await expect(frame).toHaveCount(1);
  expect(await frame.getAttribute("src")).toMatch(/^https:\/\/www\.google\.com\/maps\?q=Odonto/);
  const route = section.getByRole("link", { name: /Abrir rota/ });
  expect(await route.getAttribute("href")).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
});

test("FAQ abre e fecha as respostas", async ({ page }) => {
  await page.goto("/");
  const question = page.getByText("O que é odontologia integrada?");
  await question.scrollIntoViewIfNeeded();
  const answer = page.getByText(/É reunir diferentes áreas da odontologia/);
  await expect(answer).toBeHidden();
  await question.click();
  await expect(answer).toBeVisible();
});

test("galeria: abre a foto ampliada, troca com as setas e fecha com Esc", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const first = page.getByRole("button", { name: /^Ampliar foto/ }).first();
  await first.scrollIntoViewIfNeeded();
  await first.click();
  const dialog = page.getByRole("dialog", { name: "Foto ampliada" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/foto 1 de \d+/)).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByText(/foto 2 de \d+/)).toBeVisible();
  await dialog.getByRole("button", { name: "Foto anterior" }).click();
  await expect(dialog.getByText(/foto 1 de \d+/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(first).toBeFocused();
});

test("movimento reduzido: todo o conteúdo aparece, sem cena fixada", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const items = page.locator("#diferenciais .pin-item");
  await expect(items).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) await expect(items.nth(index)).toBeVisible();
  const sticky = await page.locator("#diferenciais .pin-stage").evaluate((node) => getComputedStyle(node).position);
  expect(sticky).toBe("static");
});

test("textos sem travessão e sem conteúdo de preenchimento", async ({ page }) => {
  for (const path of ["/", "/privacidade", "/tratamentos/clareamento-dental"]) {
    await page.goto(path);
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).not.toMatch(/[—–]/);
    expect(text.toLowerCase()).not.toContain("lorem ipsum");
  }
});

test("SEO: metadados, dados estruturados, robots e sitemap", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Odonto Ibe \| Clínica odontológica no Jardim São Luís/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Jardim São Luís/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https?:\/\/[^/]+\/?$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");

  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(data["@type"]).toBe("Dentist");
  expect(data.telephone).toBe("+55 11 97655-6438");
  expect(data.address.postalCode).toBe("08121-000");
  // Avaliações de terceiros e horários não confirmados ficam fora dos dados estruturados.
  expect(data.aggregateRating).toBeUndefined();
  expect(data.openingHours).toBeUndefined();

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap:");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("/privacidade");
  // Tratamentos ainda não confirmados não vão para o sitemap.
  expect(xml).not.toContain("/tratamentos/");
  expect((await request.get("/opengraph-image")).status()).toBe(200);
  expect((await request.get("/manifest.webmanifest")).status()).toBe(200);
});

test("cabeçalhos de segurança e página 404", async ({ request, page }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("frame-src https://www.google.com");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();

  const missing = await page.goto("/pagina-que-nao-existe");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Esta página não existe.");
});
