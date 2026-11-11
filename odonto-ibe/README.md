# Odonto Ibe

Site da clínica **Odonto Ibe Odontologia Integrada** (Jardim São Luís, Zona Leste de São Paulo).
Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion e Lucide.

> **Estado: pré-lançamento.** O site está completo e funcional, mas usa fotos provisórias e
> tem itens que aguardam confirmação da clínica. Tudo o que é provisório aparece marcado na
> própria página com a etiqueta "Provisório". A lista do que falta está em
> [Antes de publicar](#antes-de-publicar).

Capturas em [`docs/capturas/`](docs/capturas/).

## Rodar

```bash
npm ci
cp .env.example .env.local   # ajuste SITE_URL e a entrega do formulário
npm run dev                  # http://localhost:3000
```

Produção: `npm run build` e `npm start`. É um servidor Node (não é exportação estática), porque
a política de segurança de conteúdo (CSP) usa um nonce por requisição e o formulário tem backend.

## Direção criativa: "Frisos"

A linguagem vem da fachada da clínica: painel turquesa, contorno do dente em linha e frisos
horizontais cinza nas laterais.

- **Cor:** branco como base, turquesa como único acento, verde escuro para contraste e cinzas
  neutros. O turquesa nunca recebe texto branco (contraste insuficiente); texto sobre turquesa é
  sempre verde escuro.
- **Forma:** tudo reto, com 2px de raio. Nada de pílulas nem cartões arredondados.
- **Tipografia:** Bricolage Grotesque (títulos, fonte variável) e Figtree (texto), servidas pelo
  próprio site.
- **Tema:** claro, como pede a paleta da marca. O rodapé verde escuro é o único bloco escuro.

Os tokens e as regras estão comentados em `src/app/globals.css`.

## Sistema de movimento

Cada movimento tem uma função. Todos respeitam `prefers-reduced-motion`.

| Movimento | Onde | Para quê | Como |
| --- | --- | --- | --- |
| **Persiana** (assinatura) | Fotos | A imagem aparece por trás de frisos que se abrem, como os da fachada | CSS: `transform` nos frisos; na primeira dobra roda no carregamento, nas demais acompanha a rolagem (`animation-timeline: view()`) |
| **Abertura da marca** | Cabeçalho e primeira dobra | O contorno do dente se desenha em cerca de 1,2 s, sem bloquear o conteúdo | CSS (`stroke-dashoffset`) |
| **Tipografia viva** | Títulos | A letra chega leve e estreita e assenta no peso final; no hover de tratamentos e FAQ o peso muda | Eixos `wght` e `wdth` da fonte variável |
| **Narrativa fixada** | Diferenciais | A cena fica presa e os cinco diferenciais completam o contorno do dente | `position: sticky` + `useScroll` (Motion), sem re-render por quadro |
| **Transição entre páginas** | Tratamentos | A foto do tratamento viaja da lista até o topo da página de detalhe | View Transitions (`<ViewTransition>` do React) |
| **Rolagem em CSS** | Barra de progresso, deriva das fotos, traço do CTA | Efeitos contínuos sem JavaScript | `animation-timeline: scroll()` e `view()`, com estado final estático onde não há suporte |
| **Microinterações** | Botões, links, campos | Resposta a cada ação: botão magnético, preenchimento que sobe, friso de foco, visto no campo válido | Motion (mola) e CSS |
| **Celular** | Carrosséis e barra de ações | Dica explícita de deslizar (texto, empurrões e barra de progresso) e agendar sempre a um toque | `scroll-snap` + Motion |

Decisões que valem lembrar:

- A entrada da primeira dobra é só CSS: começa no primeiro quadro, sem esperar o JavaScript.
- As revelações usam um único `IntersectionObserver` para a página (`RevealObserver`) e
  animações em CSS. O Motion fica para o que precisa de física ou de progresso contínuo.
- Sem JavaScript, o conteúdo aparece no estado final.

## Estrutura

```
src/
  app/                    páginas, API, SEO (robots, sitemap, manifest, Open Graph)
    page.tsx              página inicial (10 seções)
    tratamentos/[slug]/   página de cada tratamento
    privacidade/          política de privacidade (LGPD)
    api/contato/          POST do formulário
  config/site.ts          dados da clínica: contato, endereço, mapas, horários, avisos
  content/                TUDO o que é texto, lista ou foto (ver docs/conteudo.md)
  components/
    sections/             uma seção por arquivo
    motion/               persiana, botão magnético, contador, observador de revelação
    contact/              formulário, mapa sob demanda, anti-robô opcional
    layout/               cabeçalho, menu do celular, rodapé, barra de ações
    ui/                   botões, títulos com máscara, carrossel, avisos de provisório
  lib/contact/            esquema de validação e backend do formulário
  lib/security/csp.ts     política de segurança de conteúdo
  proxy.ts                CSP com nonce, HTTPS e HSTS por requisição
```

## Editar o conteúdo

Guia completo em [`docs/conteudo.md`](docs/conteudo.md). Em resumo:

- **Tratamentos:** `src/content/treatments.ts`. Adicionar ou remover um bloco já ajusta a lista,
  a página do tratamento e o sitemap.
- **Equipe:** `src/content/team.ts` (começa vazia de propósito).
- **Fotos:** `src/content/photos.ts` e `src/assets/photos/`.
- **Textos da página inicial:** `src/content/home.ts`. **FAQ:** `src/content/faq.ts`.
- **Contato, endereço, horários, Instagram:** `src/config/site.ts`.

## Formulário de contato

`POST /api/contato`. O servidor valida de novo, limita envios e só confirma depois que a entrega
real respondeu. Sem entrega configurada, a página informa que o envio está indisponível e
encaminha ao WhatsApp (nunca finge sucesso). Configuração e detalhes em
[`docs/backend-contato.md`](docs/backend-contato.md).

Entrega por e-mail (Resend) ou por webhook assinado (HMAC), definida em `.env`.

## Segurança

- Validação e normalização no navegador e no servidor (Zod), com limites de tamanho.
- Proteção contra XSS: CSP estrita com nonce por requisição, sem `unsafe-inline` em scripts;
  todo dado do visitante é escapado no e-mail.
- Envios de outros sites são recusados (cabeçalhos `Origin` e `Sec-Fetch-Site`). A API não usa
  cookies nem sessão, então não há CSRF clássico.
- Limite de requisições por cliente e teto global; campo-armadilha contra robôs; Cloudflare
  Turnstile opcional.
- Cabeçalhos: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy`; HSTS e redirecionamento para HTTPS por
  variável de ambiente.
- Nenhum segredo vai para o navegador. Os registros do servidor não guardam dados pessoais.
- LGPD: o formulário não pede dados de saúde, exige consentimento e não armazena as mensagens.
- O mapa do Google só é carregado quando a pessoa pede (nenhum dado vai a terceiros antes disso).

## SEO

- Títulos, descrições e canônicos por página; Open Graph com imagem gerada.
- Dados estruturados `Dentist` (endereço, telefone, área atendida, mapa).
- `sitemap.xml` e `robots.txt` gerados com o domínio de `SITE_URL`.
- SEO local: Jardim São Luís e Zona Leste de São Paulo no título, na descrição e no conteúdo.
- Tratamentos ainda não confirmados ficam com `noindex` e fora do sitemap.
- A nota do Google aparece na página, mas não nos dados estruturados: o Google não aceita
  avaliações de terceiros marcadas pelo próprio negócio.

## Testes

```bash
npm run lint
npm run typecheck
npm test                 # 336 testes unitários e de integração (Vitest)
npm run build
npm run test:e2e         # 54 testes de ponta a ponta no build de produção (Playwright + axe)
```

Os testes de ponta a ponta sobem o site e um receptor local de webhook, então o envio do
formulário é testado de verdade, com a assinatura conferida. Se o Chromium do Playwright não
estiver instalado, aponte um já existente com `PLAYWRIGHT_CHROMIUM_PATH=/caminho/para/chromium`.

Cobrem, entre outros: conteúdo e ausência de erros de console e de CSP, fotos realmente
visíveis depois de roladas, cabeçalho em 360 e 390 px, menu do celular, galeria, mapa sob
demanda, formulário (validação, envio real, falhas), movimento reduzido, SEO, cabeçalhos de
segurança e acessibilidade WCAG 2.1 AA com axe.

## Antes de publicar

Tudo aqui depende de informação ou material da clínica.

1. **Fotos reais** da fachada, recepção, consultórios, equipe e atendimentos, com autorização de
   uso de imagem. As atuais são de banco de imagens (`src/assets/photos/CREDITS.md`).
2. **Logotipo oficial** em SVG. O atual é uma assinatura tipográfica provisória
   (`src/components/brand/logo.tsx`).
3. **Tratamentos:** validar a lista e marcar `confirmed: true` em cada um.
4. **Equipe:** nomes, funções, especialidades, CRO e fotos.
5. **Horários de funcionamento** completos (`openingHours` em `src/config/site.ts`).
6. **Avaliações:** os três trechos vêm do resumo público do perfil no Google. Confirmar a
   autorização para exibi-los ou desligar em `src/content/reviews.ts`.
7. **Informações do perfil no Google** usadas em "Um lugar para todo mundo" (acessibilidade,
   comunidade LGBTQ+, empresa de empreendedoras): confirmar.
8. **Telefone fixo:** a fachada mostra um segundo número. Só o WhatsApp informado está no site.
9. **Instagram** e e-mail de contato, se houver (`src/config/site.ts`).
10. **FAQ:** respostas sobre horários, convênios e formas de pagamento.
11. **Política de privacidade:** razão social, CNPJ, contato do encarregado e revisão jurídica.
12. **Link oficial do perfil no Google Maps** (`maps.placeUrl`), para o botão de avaliações abrir
    direto no perfil.
13. **Domínio e entrega do formulário:** `SITE_URL` e as variáveis de e-mail ou webhook.
14. Por fim, `showDraftNotes: false` em `src/config/site.ts` para tirar as etiquetas "Provisório".

## Limites conhecidos

- **Tema claro apenas.** A paleta da marca pede branco como base; não há tema escuro.
- **Rolagem em CSS** depende de `animation-timeline` (Chrome, Edge e Safari recentes). Em
  navegadores sem suporte, as fotos e os traços aparecem prontos, sem a animação.
- **Transição entre páginas** depende da View Transitions API. Sem suporte, a troca é direta.
- **Limite de requisições em memória:** vale por processo. Com mais de uma instância, use um
  armazenamento compartilhado (ver `docs/backend-contato.md`).
