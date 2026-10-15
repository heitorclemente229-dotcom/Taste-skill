#!/usr/bin/env node
/**
 * Lista os placeholders que ainda restam no conteúdo do site.
 *
 * Varre src/config/site.ts, src/content/**\/*.ts e o modelo do aviso de
 * privacidade (src/app/privacidade/page.tsx) em busca de valores
 * demonstrativos: textos entre colchetes, números zerados, domínio de
 * exemplo, endereço genérico e marcações isPlaceholder.
 *
 * Uso:
 *   npm run check:content             lista e sai com código 0
 *   npm run check:content -- --strict sai com código 1 se houver pendências
 *
 * Sem dependências: apenas Node.
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { relative, join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const strict = process.argv.includes("--strict");

const RULES = [
  {
    label: "Texto entre colchetes",
    // "[Nome ...]", "[data]": colchete precedido de espaço, aspas ou início de
    // linha e seguido de letra. Ignora acesso por índice (obj[chave]).
    pattern: /(?<![\w\])$.])\[\p{L}[\p{L}\p{M}\p{N} ./'-]{0,80}\]/u,
  },
  { label: "Número zerado (00000)", pattern: /00000/ },
  { label: "Telefone zerado (0000-0000)", pattern: /0000-0000/ },
  { label: "CNPJ demonstrativo", pattern: /00\.000\.000\/0000-00/ },
  { label: "Domínio de exemplo (seudominio)", pattern: /seudominio/i },
  { label: "Marcação isPlaceholder: true", pattern: /isPlaceholder:\s*true/ },
  { label: "Endereço de exemplo (Rua Exemplo)", pattern: /Rua[\s+]Exemplo/i },
  { label: "Estado genérico (UF)", pattern: /\bUF\b/ },
  { label: "Bairro ou cidade genéricos", pattern: /["'](?:Bairro|Cidade)["']/ },
];

async function listFiles() {
  const files = [join(root, "src/config/site.ts"), join(root, "src/app/privacidade/page.tsx")];
  const walk = async (dir) => {
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) files.push(full);
    }
  };
  await walk(join(root, "src/content"));
  return files;
}

/** Linhas que são só comentário não contam (podem citar exemplos de placeholder). */
function isCommentLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("{/*");
}

async function scan(file) {
  let source;
  try {
    source = await readFile(file, "utf8");
  } catch {
    return [];
  }
  const findings = [];
  source.split(/\r?\n/).forEach((line, index) => {
    if (isCommentLine(line)) return;
    const labels = RULES.filter((rule) => rule.pattern.test(line)).map((rule) => rule.label);
    if (labels.length) findings.push({ line: index + 1, text: line.trim(), labels });
  });
  return findings;
}

function truncate(text, max = 96) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

async function main() {
  const files = await listFiles();
  const results = [];
  for (const file of files) {
    const findings = await scan(file);
    if (findings.length) results.push({ file: relative(root, file), findings });
  }

  const total = results.reduce((sum, result) => sum + result.findings.length, 0);
  if (!total) {
    console.log("Nenhum placeholder encontrado. Conteúdo pronto para revisão final.");
    return;
  }

  console.log(`Placeholders encontrados: ${total} linha(s) em ${results.length} arquivo(s).\n`);
  for (const { file, findings } of results) {
    console.log(file);
    for (const finding of findings) {
      console.log(`  ${file}:${finding.line}  ${finding.labels.join(", ")}`);
      console.log(`      ${truncate(finding.text)}`);
    }
    console.log("");
  }

  const byRule = new Map();
  for (const { findings } of results) {
    for (const finding of findings) {
      for (const label of finding.labels) byRule.set(label, (byRule.get(label) ?? 0) + 1);
    }
  }
  console.log("Resumo por tipo:");
  for (const [label, count] of byRule) console.log(`  ${String(count).padStart(3)}  ${label}`);
  console.log("\nSubstitua os valores e rode novamente. Use --strict para falhar (código 1) enquanto houver pendências.");

  if (strict) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
});
