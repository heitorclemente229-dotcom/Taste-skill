# Taste Skill

Skills para Claude Code:

- **`design-taste-frontend`**: uma skill "anti-slop" para landing pages, portfólios e redesigns.
- **`caveman`**: respostas curtas e diretas, sem enrolação, mantendo todo o conteúdo técnico.
- **`ultracave`**: caveman com compressão máxima (fragmentos, uma palavra quando basta). Só por `/ultracave` ou `/caveman ultra`.
- **`megacave`**: caveman em chinês clássico (文言文), com termos técnicos intactos. Só por `/megacave` ou `/caveman wenyan`.
- **`caveman-explore`**: explorador do repositório, somente leitura, que devolve apenas citações `arquivo:linha`.
- **`caveman-setup`**: conecta as chamadas de LLM de um repositório ao gateway Caveman Cloud para medir custos. Exige URL do gateway e `CAVE_API_KEY`, e faz uma requisição real (cobrada) para verificar.
- **`caveman-learn`**: aplica, com sua aprovação a cada edição, as correções sugeridas por `caveman learn` para reduzir o custo de tokens. Exige o CLI `caveman` instalado.

- **`impeccable`**: skill de design de frontend (criar, auditar, criticar, polir interfaces), com 4 subagentes em `.claude/agents/impeccable-*.md`. Comece com `/impeccable init`.

As skills caveman foram instaladas com `npx @caveman-ai/cli@latest skills install <nome> --no-pixel`. A impeccable foi instalada com `npx impeccable install --providers=claude --project -y`.

O binário da impeccable (~20 MB, por plataforma) não fica no git: o launcher `.claude/skills/impeccable/scripts/impeccable` baixa e verifica (sha256) na primeira execução. Os hooks de detecção de design da impeccable ficam em `.claude/settings.json`: rodam o detector após cada Edit/Write, ao fim de cada resposta e no início da sessão.

Nas sessões do Claude Code na nuvem, o hook `.claude/hooks/session-start.sh` instala o [`agent-browser`](https://www.npmjs.com/package/agent-browser) (automação de navegador por CLI) e o aponta para o Chromium que já vem no container (`/opt/pw-browsers/chromium`), via `~/.agent-browser/config.json`, sem baixar o Chrome. Se esse Chromium não existir, ele roda `agent-browser install`. Fora da nuvem o hook não faz nada; para usar localmente, rode `npm install -g agent-browser && agent-browser install`.

## Uso

- **Neste repositório:** as skills ficam em `.claude/skills/<nome>/SKILL.md` e são carregadas automaticamente pelo Claude Code.
- **Em outro projeto:** copie a pasta da skill para `.claude/skills/` do projeto, ou para `~/.claude/skills/` para usá-la em todos os projetos.

Depois, peça algo como "crie uma landing page para..." ou chame `/design-taste-frontend`.

Para o modo caveman, chame `/caveman` (ou diga "caveman mode"). Ele continua ativo até você dizer "stop caveman" ou "normal mode".
