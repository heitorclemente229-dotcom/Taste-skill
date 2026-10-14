# Taste Skill

Skills para Claude Code:

- **`design-taste-frontend`**: uma skill "anti-slop" para landing pages, portfólios e redesigns.
- **`caveman`**: respostas curtas e diretas, sem enrolação, mantendo todo o conteúdo técnico.
- **`ultracave`**: caveman com compressão máxima (fragmentos, uma palavra quando basta). Só por `/ultracave` ou `/caveman ultra`.
- **`megacave`**: caveman em chinês clássico (文言文), com termos técnicos intactos. Só por `/megacave` ou `/caveman wenyan`.
- **`caveman-explore`**: explorador do repositório, somente leitura, que devolve apenas citações `arquivo:linha`.
- **`caveman-setup`**: conecta as chamadas de LLM de um repositório ao gateway Caveman Cloud para medir custos. Exige URL do gateway e `CAVE_API_KEY`, e faz uma requisição real (cobrada) para verificar.
- **`caveman-learn`**: aplica, com sua aprovação a cada edição, as correções sugeridas por `caveman learn` para reduzir o custo de tokens. Exige o CLI `caveman` instalado.

As skills caveman foram instaladas com `npx @caveman-ai/cli@latest skills install <nome> --no-pixel`.

## Uso

- **Neste repositório:** as skills ficam em `.claude/skills/<nome>/SKILL.md` e são carregadas automaticamente pelo Claude Code.
- **Em outro projeto:** copie a pasta da skill para `.claude/skills/` do projeto, ou para `~/.claude/skills/` para usá-la em todos os projetos.

Depois, peça algo como "crie uma landing page para..." ou chame `/design-taste-frontend`.

Para o modo caveman, chame `/caveman` (ou diga "caveman mode"). Ele continua ativo até você dizer "stop caveman" ou "normal mode".
