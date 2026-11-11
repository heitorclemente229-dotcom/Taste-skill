# Instruções para o Claude neste repositório

## Regra principal: cada site novo supera o anterior

O usuário quer que cada projeto novo seja melhor que o último, principalmente em motion design e acabamento. Antes de começar qualquer site ou landing page:

1. **Estude o portfólio abaixo**: abra o código e, se possível, rode o site anterior e tire capturas. Ele é o **piso de qualidade**, não o teto.
2. **Escolha de 2 a 4 evoluções concretas** sobre ele (veja "Próximos saltos") e diga ao usuário quais são, logo no início.
3. **Não repita a mesma identidade.** Reaproveite técnicas e qualidade, não o visual: cada marca precisa de linguagem própria.
4. **Mantenha o que não se negocia:** acessibilidade (WCAG AA, `prefers-reduced-motion`), performance, segurança, nenhum dado inventado e testes rodados de verdade.

## Portfólio (referências internas)

### ORALÉ STUDIO: clínica odontológica premium (pasta `orale-studio/`, branch `claude/fervent-brown-gh3u3p`)
- **Stack:** Next.js 16, React 19, Tailwind 4, Motion, Zod, Vitest e Playwright com axe.
- **Assinatura de movimento "Abertura":** a imagem nasce de uma linha e se abre em arco de sorriso (`SmileReveal` em `src/components/motion/primitives.tsx`).
- **Primitivas:**
  - `MaskLines`: títulos revelados por máscara, linha a linha.
  - `ArcLine` e `ArcDivider`: um fio em arco que conecta as seções e um ponto de luz que percorre a rolagem.
  - `Halo`: campo de luz que segue o ponteiro com mola.
  - `Parallax`: deslocamento moderado ligado à rolagem.
  - Manifesto com palavras que ganham opacidade conforme a leitura.
- **Primeira dobra:** composição assimétrica, foto com recorte em arco, anel de precisão que gira com a rolagem, detalhe macro sobreposto e linha de referência com marcadores editoriais.
- **Backend:** formulário de agendamento seguro, com CSP com nonce, limite de requisições, webhook assinado e logs sem dados pessoais.
- **O que ficou para trás e deve ser superado:**
  - motion apenas "correto" (entrada, máscara, parallax);
  - nenhuma transição entre páginas;
  - nenhuma seção fixada com narrativa na rolagem;
  - microinterações discretas demais;
  - carrosséis do celular sem dica de que dá para deslizar.

### ODONTO IBE: clínica odontológica de bairro (pasta `odonto-ibe/`)
- **Stack:** a mesma do ORALÉ (Next.js 16, React 19, Tailwind 4, Motion, Zod, Vitest e Playwright com axe). O backend do formulário foi portado de lá.
- **Identidade "Frisos":** tirada da fachada real (painel turquesa, dente em linha e frisos horizontais). Turquesa como único acento, tudo reto com 2px de raio, Bricolage Grotesque variável nos títulos e Figtree no texto.
- **Assinatura de movimento "Persiana":** a mídia aparece por trás de frisos que se abrem (`Slats` em `src/components/motion/slats.tsx`), só com marcação e CSS.
- **Saltos entregues sobre o ORALÉ:**
  - narrativa fixada na rolagem (os diferenciais completam o contorno do dente, `sections/differentials.tsx`);
  - transição entre páginas com elemento compartilhado (`<ViewTransition name>` na foto do tratamento);
  - rolagem em CSS (`animation-timeline: view()` e `scroll()`) para persiana, deriva, progresso e traços;
  - tipografia viva (eixos `wght` e `wdth`), botões magnéticos, contadores e formulário com retorno em cada estado;
  - celular com intenção própria: carrosséis com dica de deslizar (`ui/swipe-row.tsx`) e barra de ações fixa.
- **Padrões que valem reaproveitar:**
  - entrada da primeira dobra só em CSS (`data-load`), sem esperar a hidratação;
  - um único `IntersectionObserver` para a página (`RevealObserver`) com animações em CSS;
  - conteúdo provisório marcado na própria página (`DraftNote`) e tratamentos não confirmados com `noindex`;
  - mapa do Google carregado só depois do clique.
- **O que ficou para trás e deve ser superado:**
  - fotos de banco de imagens e logotipo tipográfico provisório (faltou material real da marca);
  - tema claro apenas;
  - nenhuma textura, luz ou WebGL;
  - a abertura da marca é discreta (traço no cabeçalho e na foto), sem sequência própria;
  - a transição entre páginas só leva a foto; títulos e o restante trocam com um fade simples.

## Próximos saltos (escolha alguns a cada projeto)
- **Transições entre páginas** com a View Transitions API (`next/navigation` + `document.startViewTransition`), levando um elemento compartilhado de uma página à outra (ex.: a foto do card vira o topo da página de detalhe).
- **Narrativa fixada na rolagem:** uma seção presa (`position: sticky`) cuja cena evolui com o progresso da rolagem (etapas, antes e depois conceitual, montagem da composição).
- **Animações guiadas pela rolagem em CSS** (`animation-timeline: view()` e `scroll()`) para tirar trabalho do JavaScript, com alternativa via Motion.
- **Tipografia viva:** animar o eixo de peso das fontes variáveis, texto dividido por caractere em momentos-chave e contadores ou marcadores que se desenham.
- **Microinterações de estúdio:**
  - botões magnéticos com mola;
  - cursor contextual no desktop;
  - hover com "lente" ou revelação em fotos;
  - feedback de formulário animado em cada estado.
- **Abertura da marca:** uma sequência de entrada curta (até 1,2 s) desenhando o símbolo, que nunca bloqueia o conteúdo e é pulada com movimento reduzido.
- **Texturas e luz:** gradientes de malha ou shader WebGL sutil, só quando reforçar a identidade, com orçamento de performance e alternativa estática.
- **Celular com intenção própria:** gestos e indicadores de deslizar, e animações pensadas para toque, não só versões reduzidas do desktop.

Toda evolução precisa ter propósito, respeitar `prefers-reduced-motion` e manter LCP < 2,5 s e CLS < 0,1.

## Lições do projeto anterior (evite repetir)
- **Teste o cabeçalho em 360 e 390 px.** O projeto de celular do Playwright (Pixel 7, 412 px) escondeu um botão Menu fora da tela.
- **`cn()` só concatena classes.** Classes conflitantes do Tailwind, como `hidden` contra o `inline-flex` de um componente, não se resolvem. Controle a exibição num elemento envolvente ou use tailwind-merge.
- **Teste as fontes de destaque com acentos do português** (é, ê, ã, ç) no tamanho real. A Cormorant Garamond mostrou acentos soltos e foi trocada pela Newsreader.
- **Recortes animados com `clip-path` fechado zeram a área observada pelo `IntersectionObserver`** no Chromium. Comece invisível sem recorte e só então abra.
- **Olhe o site rodando (capturas em várias larguras) cedo**, não só no fim: os testes passavam com as fotos invisíveis.
- **O ambiente roda poucos agentes em paralelo e o container reinicia.** Trabalhe direto quando der, faça commit e push com frequência e prefira uma rodada de QA enxuta e focada.
- O usuário quer agilidade sem erros: priorize corrigir o que é visível e funcional e reporte com honestidade o que ficou pendente.

## Lições do ODONTO IBE (evite repetir)
- **`overflow: hidden` cria um contêiner de rolagem.** Um elemento com `animation-timeline: view()` dentro dele deixa de acompanhar a página. Use `overflow: clip` no recorte.
- **`vector-effect: non-scaling-stroke` quebra o traço animado.** Com ele o tracejado é medido em pixels de tela e `pathLength` desenha pedaços soltos. Tire o atributo e defina a espessura em unidades do `viewBox`.
- **Não ramifique o HTML com `useReducedMotion()`.** O servidor não conhece a preferência: a hidratação diverge e o React recria a árvore. Mantenha o mesmo HTML e trate o movimento reduzido em CSS.
- **Animar peso ou largura da fonte muda a largura do texto.** Em títulos que quebram linha isso empurra o conteúdo abaixo (CLS). Anime os eixos só onde cada linha é uma linha só, ou só no desktop.
- **Meça o título da primeira dobra de verdade.** A estimativa por caractere errou duas vezes; confira em 360, 390, 768, 1024, 1280 e 1440 px.
- **`<dialog>` nativo deixa o Tab escapar para a interface do navegador.** Faça o foco circular dentro do diálogo (`src/lib/focus-loop.ts`).
- **Variantes como `lg:` só funcionam em classes próprias declaradas com `@utility`** (Tailwind 4), não em classes comuns dentro de `@layer`.
- **Com `scroll-behavior: smooth`, capturas e testes precisam esperar a rolagem terminar** ou rolar com `behavior: "instant"`.
- **Neste ambiente, `npx lighthouse` é bloqueado.** Meça LCP, CLS e peso com o Playwright (`PerformanceObserver` e CDP, com rede e CPU limitadas).
- **Bancos de imagens bloqueiam robôs no site, mas não na CDN.** Baixe direto de `images.pexels.com/photos/<id>/…` e prefira fotos de uma mesma série para dar unidade.
