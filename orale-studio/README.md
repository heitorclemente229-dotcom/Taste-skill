# ORALÉ STUDIO · site da clínica

Site de uma clínica odontológica com landing page, páginas de tratamento, aviso de privacidade e formulário de solicitação de agendamento. O nome ORALÉ STUDIO é provisório.

**Tecnologias:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Motion e Zod. Os testes usam Vitest (unidade e integração) e Playwright com axe (ponta a ponta e acessibilidade).

## Rodar localmente

Requisitos: Node.js 22 ou mais recente.

```bash
npm install
cp .env.example .env.local   # preencha as variáveis (veja abaixo)
npm run dev                  # http://localhost:3000
```

Build de produção:

```bash
npm run build
npm start
```

## Personalizar para a clínica

Todo dado real fica em poucos arquivos:

| O quê | Onde |
| --- | --- |
| Nome, contatos, endereço, horários, redes, CNPJ, responsável técnico | `src/config/site.ts` |
| Textos da página inicial, equipe e depoimentos | `src/content/home.ts` |
| Tratamentos (resumo e página de detalhe) | `src/content/treatments.ts` e `src/content/treatment-details.ts` |
| Fotografias (mesmo nome de arquivo) e créditos | `src/assets/photos/` e `src/assets/photos/CREDITS.md` |
| Aviso de privacidade | `src/app/privacidade/page.tsx` |

O comando `npm run check:content` lista os placeholders que ainda faltam substituir. Com `-- --strict`, ele falha enquanto restar algum, o que serve como trava antes de publicar.

Enquanto `isPlaceholder: true` estiver em `site.ts` e `home.ts`, o site mostra os selos "Demonstrativo". Nesse estado, os dados estruturados (JSON-LD) não são publicados.

Para trocar os ícones depois de mudar o símbolo, rode `npm run icons`.

## Agendamento

O formulário envia uma **solicitação**: não reserva horário e nunca simula sucesso. A mensagem de envio confirmado só aparece depois que o servidor entrega os dados ao destino configurado e recebe a confirmação dele.

Escolha o destino com `BOOKING_DELIVERY`:

- `resend`: e-mail para a recepção pela API do Resend (`RESEND_API_KEY`, `BOOKING_EMAIL_FROM`, `BOOKING_EMAIL_TO`).
- `webhook`: JSON assinado com HMAC-SHA256 enviado para `BOOKING_WEBHOOK_URL`, que pode ser um sistema de agenda, n8n, Make ou outro. Use `BOOKING_WEBHOOK_SECRET` com pelo menos 32 caracteres.

Sem configuração, o endpoint responde "indisponível" e o formulário mostra os contatos diretos. Há também a verificação anti-robô Cloudflare Turnstile, opcional (`TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`).

Detalhes técnicos e todas as proteções estão em [`docs/backend-agendamento.md`](docs/backend-agendamento.md). Para testar o envio localmente, rode `npm run mock:webhook`.

## Testes

```bash
npm run lint
npx tsc --noEmit
npm test                     # Vitest: validação, limites, assinatura, cabeçalhos
npm run build && npm run test:e2e   # Playwright (desktop e celular) + axe
```

Os testes de ponta a ponta sobem o build de produção e um receptor de webhook local, então o envio do formulário é testado de verdade.

## Publicar

1. Hospede em um serviço com Node.js, como Vercel, Render, Fly.io ou um servidor próprio com `npm run build && npm start`.
2. Configure as variáveis de ambiente no painel da hospedagem. Nunca envie um arquivo `.env` ao repositório.
3. Defina `SITE_URL` com o domínio final em HTTPS.
4. Atrás de um proxy reverso que não force HTTPS, use `FORCE_HTTPS=true`.
5. Depois de confirmar que o HTTPS funciona, ative `HSTS_ENABLED=true`.
6. Se a hospedagem tiver um proxy confiável na frente, configure `TRUST_PROXY=true` e `CLIENT_IP_HEADER` para que o limite de requisições conte por visitante.
7. Com mais de uma instância (por exemplo, em serverless), troque o limitador em memória por um armazenamento compartilhado, como Redis ou Upstash. A interface já está pronta em `src/lib/booking/server/rate-limit.ts`.
8. Rode `npm run check:content -- --strict` antes de publicar.

## Segurança, em resumo

- Content-Security-Policy com nonce por requisição e `strict-dynamic`, sem `unsafe-inline` nem `unsafe-eval` para scripts em produção.
- Cabeçalhos `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`/`frame-ancestors` e COOP.
- O formulário é validado no servidor com esquema estrito, limite de tamanho do corpo e verificação de origem.
- Limite de requisições por visitante e um limite global.
- Campo-armadilha (honeypot) contra robôs, além do Turnstile opcional.
- Destinatário fixo, definido no servidor.
- Logs sem dados pessoais e respostas de erro sem detalhes internos.
- Nenhum cookie, rastreador ou script de terceiros.

Nenhuma medida garante segurança absoluta. Os pontos que dependem da hospedagem e as validações jurídicas da LGPD estão descritos em `docs/backend-agendamento.md` e no próprio aviso de privacidade.
