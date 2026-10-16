# Taste Skill

Skill `design-taste-frontend` para Claude Code: uma skill "anti-slop" para landing pages, portfólios e redesigns.

## Uso

- **Neste repositório:** a skill fica em `.claude/skills/design-taste-frontend/SKILL.md` e é carregada automaticamente pelo Claude Code.
- **Em outro projeto:** copie a pasta `design-taste-frontend` para `.claude/skills/` do projeto, ou para `~/.claude/skills/` para usá-la em todos os projetos.

Depois, peça algo como "crie uma landing page para..." ou chame `/design-taste-frontend`.

## Skills de terceiros

- **`apple-design`** ([dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill)): revisor de UI/UX baseado nas Human Interface Guidelines da Apple, em `.claude/skills/apple-design/`. Instalada com `npx skills add dickwu/apple-design-skill --agent claude-code --copy`; a versão fica registrada em `skills-lock.json` e pode ser atualizada com `npx skills update`. Chame `/apple-design` ou peça "revise o design deste app".
- **Vercel Agent Skills** ([vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)): 9 skills instaladas com `npx skills add vercel-labs/agent-skills --agent claude-code --copy`:
  - `web-design-guidelines`: revisa código de UI contra as Web Interface Guidelines da Vercel.
  - `writing-guidelines`: revisa textos e documentação contra o guia de escrita da Vercel.
  - `vercel-react-best-practices`: padrões de performance para React e Next.js.
  - `vercel-composition-patterns`: padrões de composição de componentes React.
  - `vercel-react-view-transitions`: animações com a View Transition API do React.
  - `vercel-react-native-skills`: boas práticas para React Native e Expo.
  - `deploy-to-vercel`: faz deploy do projeto na Vercel (envia o código para o endpoint de deploy da Vercel).
  - `vercel-cli-with-tokens`: usa a CLI da Vercel com token de acesso.
  - `vercel-optimize`: analisa custo e performance de projetos já publicados na Vercel (precisa da CLI `vercel` autenticada).
