# Taste Skill

Skill `design-taste-frontend` para Claude Code: uma skill "anti-slop" para landing pages, portfólios e redesigns.

## Uso

- **Neste repositório:** a skill fica em `.claude/skills/design-taste-frontend/SKILL.md` e é carregada automaticamente pelo Claude Code.
- **Em outro projeto:** copie a pasta `design-taste-frontend` para `.claude/skills/` do projeto, ou para `~/.claude/skills/` para usá-la em todos os projetos.

Depois, peça algo como "crie uma landing page para..." ou chame `/design-taste-frontend`.

## Comando `/web-interface-guidelines`

Em `.claude/commands/web-interface-guidelines.md` há o comando de revisão das [Web Interface Guidelines da Vercel](https://github.com/vercel-labs/web-interface-guidelines). Ele audita arquivos de UI (acessibilidade, foco, formulários, animação, tipografia, performance etc.) e lista os problemas no formato `arquivo:linha`.

```
/web-interface-guidelines src/components/**/*.tsx
```

Combina bem com a skill: gere a interface com `design-taste-frontend` e revise-a com `/web-interface-guidelines`.
