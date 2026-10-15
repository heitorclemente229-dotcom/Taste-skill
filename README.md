# Taste Skill

Skill `design-taste-frontend` para Claude Code: uma skill "anti-slop" para landing pages, portfólios e redesigns.

## Uso

- **Neste repositório:** a skill fica em `.claude/skills/design-taste-frontend/SKILL.md` e é carregada automaticamente pelo Claude Code.
- **Em outro projeto:** copie a pasta `design-taste-frontend` para `.claude/skills/` do projeto, ou para `~/.claude/skills/` para usá-la em todos os projetos.

Depois, peça algo como "crie uma landing page para..." ou chame `/design-taste-frontend`.

## Skills de terceiros

- **`apple-design`** ([dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill)): revisor de UI/UX baseado nas Human Interface Guidelines da Apple, em `.claude/skills/apple-design/`. Instalada com `npx skills add dickwu/apple-design-skill --agent claude-code --copy`; a versão fica registrada em `skills-lock.json` e pode ser atualizada com `npx skills update`. Chame `/apple-design` ou peça "revise o design deste app".
