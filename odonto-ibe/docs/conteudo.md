# Como editar o conteúdo

Todo o conteúdo fica em arquivos de texto simples, separados do layout. Depois de editar, rode
`npm run build` para conferir e publique de novo.

Regra geral: **não invente informação**. O que ainda não foi confirmado fica marcado como
provisório, e o site mostra a etiqueta "Provisório" no lugar.

## Tratamentos (`src/content/treatments.ts`)

Cada tratamento é um bloco:

```ts
{
  slug: "ortodontia",              // endereço da página: /tratamentos/ortodontia
  name: "Ortodontia",
  summary: "Texto curto da lista.",
  photo: photos.ortodontia,
  confirmed: false,                // true depois que a clínica validar
  about: ["Parágrafo 1.", "Parágrafo 2."],
  whenToSeek: ["Situação 1", "Situação 2", "Situação 3"],
}
```

- **Adicionar:** copie um bloco e troque os valores. O `slug` usa letras minúsculas e hífens.
- **Remover:** apague o bloco.
- **Confirmar:** `confirmed: true` tira o aviso de validação, libera a página para o Google e a
  inclui no sitemap.

Os textos são informativos. Não prometa resultado nem prazo: a indicação depende da avaliação.

## Equipe (`src/content/team.ts`)

A lista começa vazia e a seção mostra molduras provisórias. Para publicar um perfil:

1. Coloque a foto em `src/assets/photos/` (retrato 3:4, pelo menos 900 x 1200 px).
2. Importe a foto e adicione o perfil:

```ts
import retratoAna from "@/assets/photos/equipe-ana.jpg";

export const team: readonly TeamMember[] = [
  {
    name: "Nome completo",
    role: "Cirurgiã-dentista",
    specialty: "Ortodontia",          // opcional
    registration: "CRO-SP 00000",     // opcional, recomendado
    photo: { src: retratoAna, alt: "Retrato de Nome completo", provisional: false },
  },
];
```

Só publique com autorização de uso de imagem da pessoa.

## Fotos (`src/content/photos.ts`)

Para trocar uma foto provisória pela real:

1. Substitua o arquivo em `src/assets/photos/` mantendo o mesmo nome (JPEG, lado maior entre
   1600 e 2400 px). O site gera sozinho as versões leves em AVIF e WebP.
2. Ajuste o texto alternativo (`alt`) para descrever a foto nova.
3. Mude `provisional` para `false`: a legenda "Foto provisória" some.

A galeria é a lista `gallery` no mesmo arquivo: adicione, remova ou reordene itens.

## Avaliações (`src/content/reviews.ts`)

Só entram avaliações reais. `published: false` esconde um trecho sem apagá-lo. A nota e o total
ficam em `googleRating`, em `src/config/site.ts`: atualize quando o perfil no Google mudar.

## Perguntas frequentes (`src/content/faq.ts`)

`draft: true` marca a resposta como "a confirmar". Tire a marca quando a clínica confirmar.

## Textos da página inicial (`src/content/home.ts`)

Em `titleLines`, cada item é uma linha do título no desktop. Mantenha as linhas curtas (até
cerca de 30 caracteres) para caberem sem quebrar. Não use travessões.

## Dados da clínica (`src/config/site.ts`)

| O quê | Onde |
| --- | --- |
| WhatsApp e mensagem inicial | `contact.whatsappNumber`, `contact.whatsappMessage` |
| Telefone exibido | `contact.phoneDisplay`, `contact.phoneHref` |
| Instagram e e-mail | `contact.instagramUrl`, `contact.email` (aparecem no rodapé quando preenchidos) |
| Endereço | `address` |
| Horários | `openingHours` (lista de `{ days, hours }`; `null` mostra "em confirmação") |
| Link do perfil no Google | `maps.placeUrl` |
| Etiquetas "Provisório" | `showDraftNotes` (`false` tira todas) |

## Logotipo (`src/components/brand/logo.tsx`)

A assinatura atual é tipográfica e provisória. Para usar o logotipo oficial, troque o conteúdo
do componente pelo SVG da marca e mantenha o nome da clínica como texto acessível.
