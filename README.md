# Taste Skill

Skills para Claude Code:

- **`design-taste-frontend`**: uma skill "anti-slop" para landing pages, portfólios e redesigns.
- **`caveman`**: respostas curtas e diretas, sem enrolação, mantendo todo o conteúdo técnico. Instalada com `npx @caveman-ai/cli@latest skills install caveman --no-pixel`.

## Uso

- **Neste repositório:** as skills ficam em `.claude/skills/<nome>/SKILL.md` e são carregadas automaticamente pelo Claude Code.
- **Em outro projeto:** copie a pasta da skill para `.claude/skills/` do projeto, ou para `~/.claude/skills/` para usá-la em todos os projetos.

Depois, peça algo como "crie uma landing page para..." ou chame `/design-taste-frontend`.

Para o modo caveman, chame `/caveman` (ou diga "caveman mode"). Ele continua ativo até você dizer "stop caveman" ou "normal mode".
