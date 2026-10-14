# Backend do formulário de agendamento

Este documento descreve como o site recebe uma **solicitação** de agendamento,
quais proteções existem e por quê, como conectar a entrega (Resend ou webhook)
e o que o site deliberadamente **não** faz.

O formulário não reserva horário. Ele envia um pedido de contato para a equipe
da clínica, que confirma data e horário no retorno.

## Arquivos envolvidos

| Arquivo | Papel |
| --- | --- |
| `src/components/booking/booking-form.tsx` | Formulário (validação imediata, envio por `fetch`, estados de erro). |
| `src/components/booking/turnstile-widget.tsx` | Widget opcional do Cloudflare Turnstile. |
| `src/lib/booking/schema.ts` | Esquema zod compartilhado entre navegador e servidor. |
| `src/app/api/agendamento/route.ts` | Rota `POST /api/agendamento` (somente repassa ao handler). |
| `src/lib/booking/server/handler.ts` | Ordem das verificações e resposta. |
| `src/lib/booking/server/env.ts` | Leitura e validação das variáveis de ambiente. |
| `src/lib/booking/server/origin.ts` | Bloqueio de envios de outros sites. |
| `src/lib/booking/server/read-body.ts` | Leitura do corpo com limite de bytes e prazo. |
| `src/lib/booking/server/client-ip.ts` | IP do cliente (somente atrás de proxy confiável) e hash. |
| `src/lib/booking/server/rate-limit.ts` | Limite de requisições (memória do processo por padrão). |
| `src/lib/booking/server/turnstile.ts` | Verificação do token no Cloudflare. |
| `src/lib/booking/server/delivery.ts`, `email.ts`, `webhook.ts` | Entrega real por Resend ou webhook assinado. |
| `src/lib/booking/server/log.ts` | Log estruturado sem dados pessoais. |
| `src/proxy.ts`, `src/lib/security/csp.ts` | CSP com nonce, HTTPS e HSTS. |
| `scripts/mock-webhook.mjs` | Receptor local que verifica a assinatura (testes). |

## Fluxo de uma solicitação

```
Navegador                         Servidor (Next.js, runtime Node)            Serviço externo
---------                         --------------------------------            ---------------
valida com o esquema zod
(Turnstile gera token, se ativo)
POST /api/agendamento  ---------> 1. origem (Sec-Fetch-Site, Origin)
JSON, same-origin                 2. Content-Type application/json
                                  3. corpo: até 8 KiB, UTF-8, JSON, objeto
                                  4. limite por cliente (3/min, 8/h)
                                  5. campo-armadilha (honeypot)
                                  6. validação zod (servidor é quem vale)
                                  7. entrega configurada?
                                  8. Turnstile (se ativo)  -----------------> siteverify (Cloudflare)
                                  9. teto global (120/h)
                                  10. entrega real  ------------------------> Resend ou webhook
                                      sucesso somente após 2xx  <------------
resposta JSON  <----------------- { ok: true } ou { ok: false, code }
```

As verificações vão da mais barata para a mais cara: nada de rede externa
acontece antes de o pedido passar por origem, tamanho, limite e validação.

### Respostas da API

| Status | `code` | Quando |
| --- | --- | --- |
| 200 | (`ok: true`) | O serviço de entrega respondeu 2xx. |
| 400 | `invalid` | Campos inválidos (vem com `fieldErrors`, mensagens em português). |
| 400 | `invalid_request` | JSON malformado, chaves desconhecidas, honeypot preenchido. |
| 400 | `verification_failed` | Token do Turnstile ausente ou recusado. |
| 403 | `forbidden` | Origem não permitida. |
| 408, 413, 415 | `invalid_request` | Corpo lento, grande demais ou com tipo errado. |
| 429 | `rate_limited` | Limite atingido (com `retryAfter` e cabeçalho `Retry-After`). |
| 502 | `delivery_failed` | O serviço de entrega falhou ou não respondeu a tempo. |
| 503 | `unavailable` | Entrega não configurada, ou Turnstile indisponível ou mal configurado. |
| 500 | `error` | Erro inesperado (sem detalhes na resposta). |
| 405 | (sem corpo JSON) | Método diferente de POST (resposta automática do Next.js). |

Toda resposta da API sai com `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`
e uma CSP própria (`default-src 'none'`). Nenhuma mensagem de erro interna, pilha
ou resposta do serviço externo chega ao navegador.

## Proteções e por quê

**Origem (Sec-Fetch-Site e Origin).** A API não usa cookies, então não há CSRF
clássico, mas uma página de terceiros poderia usar o formulário (e a cota de
e-mail) em nome dos visitantes. Se `Sec-Fetch-Site` existir, precisa ser
`same-origin`; se `Origin` existir, precisa estar na lista (`SITE_URL` mais
`ALLOWED_ORIGINS`). Em produção o `Origin` é obrigatório.

**Somente `application/json`.** Formulários HTML de outros sites só conseguem
enviar tipos "simples" (`text/plain`, `multipart/form-data`,
`application/x-www-form-urlencoded`) sem preflight de CORS. Exigir JSON fecha
esse caminho.

**Corpo com limite rígido.** O `Content-Length` não é confiável: o corpo é lido
em fluxo, com teto de 8 KiB e prazo total de 10 segundos. Clientes lentos ou
corpos enormes são cortados antes de ocupar memória.

**Limite de requisições.** Por cliente: 3 por minuto e 8 por hora. O IP só é
lido de cabeçalho quando `TRUST_PROXY=true` (sem proxy confiável, qualquer um
forjaria `X-Forwarded-For`). O IP nunca é guardado: a chave é
`SHA-256(sal + IP)` truncado, e IPv6 é agrupado por prefixo `/64`. Um teto
global de 120 envios por hora protege a cota do serviço de e-mail; ele só conta
pedidos que já passaram por todas as outras verificações, para que robôs
barrados antes não esgotem o formulário de todos.

**Honeypot.** Um campo invisível que pessoas não preenchem. Se vier preenchido,
a resposta é uma recusa genérica (nunca um sucesso falso).

**Validação no servidor.** O mesmo esquema zod do navegador roda de novo no
servidor, que é o que vale. Textos são normalizados (NFC, sem caracteres de
controle nem de direção de texto), o telefone vira apenas dígitos brasileiros
válidos, links na mensagem são recusados e chaves desconhecidas derrubam o
pedido sem ecoar seus nomes.

**Entrega antes do Turnstile.** Se a entrega não estiver configurada, a
resposta é 503 antes de gastar o token do Turnstile (que é de uso único).

**Turnstile (opcional).** Anti-robô da Cloudflare, sem cookies de rastreamento.
O token é validado no `siteverify` sem enviar o IP do visitante. Erros de
configuração (`invalid-input-secret`) viram 503 e um aviso único no log, não
"verificação falhou" para o visitante.

**Entrega real, nunca simulada.** O sucesso só é informado depois de um 2xx do
serviço externo. Redirecionamentos não são seguidos (o corpo assinado não pode
ir para outro destino), o prazo é de 8 segundos e o corpo da resposta externa
nunca é lido nem repassado.

**E-mail seguro.** Todo valor do visitante é escapado no HTML, o assunto não
aceita quebras de linha (injeção de cabeçalho) e o destinatário vem somente do
ambiente: o visitante nunca escolhe para quem vai. O e-mail do visitante, se
informado, vai como `reply_to`.

**Webhook assinado.** HMAC-SHA256 sobre `timestamp + "." + corpo`, com
timestamp no cabeçalho para impedir repetição (detalhes abaixo).

**Log sem dados pessoais.** Uma linha JSON por evento, com lista fechada de
campos (`requestId`, `outcome`, `status`, `driver`, `upstreamStatus`,
`durationMs`, `reason`, `issue`, `errorName`). Nome, telefone, e-mail,
mensagem, IP, user agent e corpo nunca entram no log.

**Falha fechada.** Variáveis ausentes ou com formato inválido contam como "não
configurado": o servidor responde 503 e o formulário mostra os canais
alternativos (WhatsApp e telefone). O valor de exemplo `re_xxxxxxxx` é
recusado de propósito.

**Cabeçalhos da página.** `src/proxy.ts` aplica uma CSP com nonce por
requisição e `'strict-dynamic'`, sem iframes de terceiros (exceto o do
Turnstile, quando ativo), `frame-ancestors 'none'`, redirecionamento HTTPS
opcional e HSTS opcional. `next.config.ts` adiciona `nosniff`,
`Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` e COOP.

## Variáveis de ambiente

O arquivo `.env.example` lista todas, com exemplos falsos. Copie para
`.env.local` em desenvolvimento ou configure no painel da hospedagem.

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `SITE_URL` | Sim em produção | Endereço canônico. Define a origem aceita pela API, os metadados e o destino do redirecionamento HTTPS. |
| `NEXT_PUBLIC_SITE_URL` | Não | Alternativa a `SITE_URL` para os metadados. |
| `NEXT_PUBLIC_BOOKING_URL` | Não | Link de um sistema de reservas externo, exibido junto ao formulário (embutido no build). |
| `ALLOWED_ORIGINS` | Não | Origens extras aceitas, separadas por vírgula. |
| `BOOKING_DELIVERY` | Sim | `resend` ou `webhook`. Vazio = formulário indisponível (503). |
| `RESEND_API_KEY` | Com `resend` | Chave da API da Resend (`re_...`). |
| `BOOKING_EMAIL_FROM` | Com `resend` | Remetente de domínio verificado, `email@dominio` ou `Nome <email@dominio>`. |
| `BOOKING_EMAIL_TO` | Com `resend` | Caixa da recepção que recebe os pedidos. |
| `BOOKING_WEBHOOK_URL` | Com `webhook` | URL do receptor. HTTPS obrigatório em produção. |
| `BOOKING_WEBHOOK_SECRET` | Com `webhook` | Segredo HMAC, no mínimo 32 caracteres, sem espaços. |
| `TURNSTILE_SITE_KEY` | Não | Chave pública do Turnstile. Ativo somente com as duas chaves. |
| `TURNSTILE_SECRET_KEY` | Não | Chave secreta do Turnstile. |
| `TRUST_PROXY` | Recomendada em produção | `true` somente atrás de proxy que sobrescreve o cabeçalho do IP. |
| `CLIENT_IP_HEADER` | Não | Cabeçalho do IP (padrão `x-forwarded-for`; `cf-connecting-ip`, `x-real-ip`...). |
| `RATE_LIMIT_SALT` | Não | Sal do hash de IP. Vazio = aleatório por processo. |
| `FORCE_HTTPS` | Não | `true` redireciona HTTP para HTTPS (308). |
| `HSTS_ENABLED` | Não | `true` envia `Strict-Transport-Security` em requisições HTTPS. |
| `CSP_REPORT_URI` | Não | Endpoint de relatórios de violação da CSP. |

Somente para testes (lidas pelo Playwright e pelo receptor local, não pelo
site): `E2E_PORT`, `E2E_WEBHOOK_PORT`, `PLAYWRIGHT_CHROMIUM_PATH`,
`MOCK_WEBHOOK_PORT`, `MOCK_WEBHOOK_FAIL`, `MOCK_WEBHOOK_DUMP`.

As variáveis são lidas a cada requisição. Problemas de configuração aparecem
no log como `{"event":"booking.config","issue":"..."}`, uma vez por processo.

## Conectar a Resend (e-mail)

1. Crie uma conta na Resend e verifique o domínio da clínica (registros DNS
   SPF e DKIM indicados no painel).
2. Gere uma chave de API com permissão apenas de envio.
3. Configure:

   ```
   BOOKING_DELIVERY=resend
   RESEND_API_KEY=re_...
   BOOKING_EMAIL_FROM="Clínica <agendamento@seudominio.com.br>"
   BOOKING_EMAIL_TO=recepcao@seudominio.com.br
   ```

4. Envie uma solicitação de teste e confira a caixa de entrada. Se o log
   mostrar `outcome` `delivery_failed`, o `upstreamStatus` indica a causa:
   401 ou 403 costumam ser chave inválida ou domínio ainda não verificado;
   422, um campo recusado pela Resend (por exemplo, o remetente).

O e-mail chega à recepção com nome, telefone, e-mail (também como "responder
para"), preferência de contato, período, assunto, mensagem, data de
recebimento no horário de Brasília e a versão do aviso de privacidade aceito. A caixa de destino passa a guardar dados pessoais: aplique
a ela a mesma política de retenção do restante do atendimento.

## Conectar um webhook (sistema de agenda, n8n, Make)

Configure:

```
BOOKING_DELIVERY=webhook
BOOKING_WEBHOOK_URL=https://receptor.seudominio.com.br/agendamento
BOOKING_WEBHOOK_SECRET=<saída de: openssl rand -hex 32>
```

O site envia `POST` com `Content-Type: application/json` e estes cabeçalhos:

- `X-Orale-Timestamp`: segundos Unix do envio.
- `X-Orale-Signature`: `sha256=` + hex(HMAC-SHA256(segredo, timestamp + "." + corpo bruto)).

Exemplo de corpo:

```json
{
  "id": "0b7a4c1e-0000-4000-8000-000000000000",
  "receivedAt": "2026-10-14T18:30:00.000Z",
  "source": "site",
  "privacyNoticeVersion": "2026-10",
  "data": {
    "name": "Ana Souza",
    "phone": "+5511912345678",
    "email": null,
    "contactPreference": "whatsapp",
    "period": "tarde",
    "topic": "clareamento",
    "message": null,
    "consent": true
  }
}
```

O payload não contém IP, user agent nem detalhes internos.

O receptor deve:

1. Calcular o HMAC sobre o **corpo bruto** (os bytes recebidos, antes de
   qualquer parse de JSON) e comparar em tempo constante.
2. Recusar timestamps com mais de 5 minutos de diferença do relógio atual.
3. Usar o campo `id` para ignorar repetições (guardar os `id` dos últimos
   minutos basta).
4. Responder 2xx em menos de 8 segundos. Qualquer outro status, redirecionamento
   ou demora faz o site mostrar ao visitante que o envio falhou, com os canais
   alternativos. O site não tenta de novo.

Verificação em Node, como referência:

```js
import { createHmac, timingSafeEqual } from "node:crypto";

function verify(secret, timestamp, signature, rawBody) {
  if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const match = /^sha256=([0-9a-f]{64})$/.exec(signature ?? "");
  if (!match) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest();
  return timingSafeEqual(Buffer.from(match[1], "hex"), expected);
}
```

`scripts/mock-webhook.mjs` implementa exatamente essa verificação e serve de
modelo.

**n8n.** Use o nó Webhook com a opção de corpo bruto (Raw Body) ativada, calcule
o HMAC com o nó Crypto (SHA256, segredo, texto `timestamp.corpo`) e compare com
o cabeçalho antes de seguir o fluxo. Responda 2xx somente depois que o pedido
estiver registrado.

**Make e outras plataformas sem acesso ao corpo bruto.** Se a plataforma só
entrega o JSON já interpretado, a assinatura não pode ser conferida com
segurança. Nesse caso, coloque na frente uma função pequena (por exemplo, uma
função serverless) que verifica a assinatura e repassa o pedido, ou use a
entrega por e-mail.

**Sistema de agenda próprio.** O mesmo contrato vale. O sistema decide o que
fazer com o pedido (criar um lead, uma tarefa para a recepção); o site não
espera nenhuma resposta além do status 2xx.

## Testar localmente

```
npm test                       # testes unitários e de integração (vitest)
npm run mock:webhook           # receptor local em 127.0.0.1:4010
npm run test:e2e               # Playwright contra o build (requer npm run build)
```

Para usar o receptor local no desenvolvimento (`npm run dev`), defina o mesmo
segredo nos dois lados:

```
# terminal 1
BOOKING_WEBHOOK_SECRET=<segredo com 32+ caracteres> npm run mock:webhook

# .env.local
BOOKING_DELIVERY=webhook
BOOKING_WEBHOOK_URL=http://127.0.0.1:4010/hook
BOOKING_WEBHOOK_SECRET=<o mesmo segredo>
```

URLs `http://` só são aceitas fora de produção. Opções do receptor:
`MOCK_WEBHOOK_FAIL=1` responde 500 (testa a mensagem de falha) e
`MOCK_WEBHOOK_DUMP=.e2e/last-webhook.json` grava o último payload verificado
(use somente dados fictícios). O log do receptor tem apenas
`{ verified, fieldCount, receivedAt }`.

Para o Turnstile local, use as chaves públicas de teste da Cloudflare: site
`1x00000000000000000000AA` e secreta `1x0000000000000000000000000000000AA`
(sempre aprovam). Nunca use essas chaves em produção.

## Turnstile e CSP

Com as duas chaves definidas, `src/proxy.ts` inclui
`https://challenges.cloudflare.com` em `script-src`, `frame-src` e
`connect-src`. O widget cria o elemento `<script>` de `api.js?render=explicit`
a partir do bundle do site, que já é autorizado por nonce; com
`'strict-dynamic'`, scripts inseridos assim também são autorizados (navegadores
com CSP nível 3 ignoram a lista de domínios em `script-src` quando
`'strict-dynamic'` está presente). O iframe do desafio depende de `frame-src`.
Ao ativar o Turnstile, confira o console do navegador em busca de violações
de CSP antes de publicar.

## Várias instâncias e serverless

O limitador guarda os contadores **na memória do processo**. Isso funciona com
um único servidor Node (por exemplo, um VPS ou contêiner único). Com várias
instâncias, autoescala ou serverless (Vercel, Lambda), cada instância tem o
próprio contador, então o limite por cliente e o teto global se multiplicam
pelo número de instâncias, e uma instância nova começa zerada.

Nesses ambientes:

- Implemente a interface `RateLimitStore` (`src/lib/booking/server/rate-limit.ts`)
  sobre um armazenamento compartilhado (Redis, Upstash, Valkey) e registre-a
  com `setRateLimitStore` na inicialização. O método `consume` precisa ser
  atômico por chave (script Lua ou transação), verificando todas as regras e
  registrando o evento somente se nenhuma for excedida.
- Defina `RATE_LIMIT_SALT` com o mesmo valor em todas as instâncias; com o sal
  aleatório por processo, o mesmo cliente teria chaves diferentes em cada uma.
- Se a plataforma tiver proteção própria (WAF, regras de limite da Cloudflare),
  use-a como primeira camada; o limite da aplicação continua valendo.

O restante não precisa de armazenamento compartilhado: o token do Turnstile é
de uso único no próprio Cloudflare, a proteção contra repetição do webhook é
responsabilidade do receptor (campo `id`) e o nonce da CSP é gerado por
requisição.

## O que o site não faz

- **Não armazena dados pessoais.** Não há banco de dados, arquivo ou fila: o
  pedido existe apenas na memória durante a requisição e é entregue ao serviço
  configurado. Os dados passam a existir somente no destino (caixa de e-mail
  ou sistema do webhook), que é onde devem ser aplicadas retenção e exclusão.
- **Não guarda IP.** O IP só é usado, como hash com sal, para o limite de
  requisições, na memória e por no máximo uma hora. Ele não vai para o log, o
  e-mail, o webhook nem para a Cloudflare.
- **Não confirma consultas.** O envio é um pedido de contato; a confirmação de
  data e horário é feita pela equipe da clínica. A tela de sucesso diz isso.
- **Não envia e-mail ao visitante** nem mensagem automática por WhatsApp.
- **Não tenta reenviar.** Se a entrega falhar, o visitante vê a falha e os
  canais alternativos. Nada fica pendente no servidor.
- **Não coleta informações de saúde.** O formulário orienta a não incluir
  detalhes clínicos, e o assunto é uma lista fechada.
- **Não verifica a identidade** do telefone ou do e-mail informados.
