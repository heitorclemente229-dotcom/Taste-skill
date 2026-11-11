import type { Page, TestInfo } from "@playwright/test";

/** IP de documentação (RFC 5737) diferente por teste, para o limitador de requisições. */
export function testClientIp(testInfo: TestInfo): string {
  const key = `${testInfo.project.name}:${testInfo.titlePath.join("/")}:${testInfo.retry}`;
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `198.51.100.${(hash % 250) + 1}`;
}

export type PageProblems = { console: string[]; errors: string[]; csp: string[] };

/** Coleta erros de console, exceções e violações de CSP desde o carregamento. */
export async function watchProblems(page: Page): Promise<PageProblems> {
  const problems: PageProblems = { console: [], errors: [], csp: [] };
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { __csp: string[] }).__csp.push(`${event.violatedDirective} ${event.blockedURI} ${event.sample}`);
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error") problems.console.push(message.text());
  });
  page.on("pageerror", (error) => problems.errors.push(error.message));
  return problems;
}

export async function cspViolations(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
}

/** Rola a página inteira aos poucos, disparando as animações de entrada. */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
}
