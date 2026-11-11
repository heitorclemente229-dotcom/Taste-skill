# Créditos das fotografias

Todas as fotos desta pasta são **provisórias**. Elas vêm de banco de imagens e
**não mostram a Odonto Ibe**, sua equipe nem seus pacientes. Servem para compor
o layout até a chegada das fotos reais da clínica.

- **Fonte:** Pexels, baixadas em 11/11/2026 diretamente de `images.pexels.com`.
- **Licença:** Licença Pexels (uso gratuito, inclusive comercial, sem exigência
  de atribuição). Texto da licença: https://www.pexels.com/license/
- Todas pertencem à mesma série fotográfica de um consultório odontológico, o
  que dá unidade visual ao conjunto. O nome de quem fotografou aparece na
  página de cada foto no Pexels (link abaixo).

| Arquivo | Uso no site | Página no Pexels |
| --- | --- | --- |
| `hero.jpg` | Primeira dobra | https://www.pexels.com/photo/3845627/ |
| `clinica-atendimento.jpg` | A clínica (foto grande) | https://www.pexels.com/photo/3845625/ |
| `clinica-ambiente.jpg` | Galeria: ambiente | https://www.pexels.com/photo/3845723/ |
| `clinica-estrutura.jpg` | A clínica (foto menor) e galeria | https://www.pexels.com/photo/3845729/ |
| `galeria-consulta.jpg` | Galeria: atendimento | https://www.pexels.com/photo/3845685/ |
| `galeria-sorriso.jpg` | Galeria: depois da consulta | https://www.pexels.com/photo/3845744/ |
| `galeria-conversa.jpg` | Galeria: conversa | https://www.pexels.com/photo/3845810/ |
| `galeria-consultorio.jpg` | Galeria: consultório | https://www.pexels.com/photo/3845683/ |
| `tratamento-prevencao.jpg` | Prevenção e limpeza | https://www.pexels.com/photo/3845679/ |
| `tratamento-restauracoes.jpg` | Restaurações | https://www.pexels.com/photo/3845713/ |
| `tratamento-clareamento.jpg` | Clareamento dental | https://www.pexels.com/photo/3845623/ |
| `tratamento-ortodontia.jpg` | Ortodontia | https://www.pexels.com/photo/3845677/ |
| `tratamento-canal.jpg` | Tratamento de canal | https://www.pexels.com/photo/3845758/ |
| `tratamento-proteses.jpg` | Próteses e implantes | https://www.pexels.com/photo/3845757/ |

## Edições aplicadas

- Recorte para a proporção de cada uso (4:5, 3:2, 3:4 ou 4:3).
- Leve redução de saturação (5%) e exportação em JPEG (mozjpeg, qualidade 82),
  sem metadados. O Next.js gera as versões AVIF e WebP em cada tamanho.

## Antes de publicar

1. Substitua cada arquivo por fotografia própria da clínica (fachada, recepção,
   consultórios, equipe e atendimentos), mantendo o nome do arquivo.
2. Peça autorização de uso de imagem, por escrito, a todas as pessoas
   retratadas (equipe e pacientes).
3. Em `src/content/photos.ts`, ajuste o texto alternativo de cada foto e mude
   `provisional` para `false`. A legenda "Foto provisória" some sozinha.

A licença do Pexels não permite sugerir que as pessoas retratadas recomendam
um serviço. Por isso, e por honestidade com quem visita o site, estas fotos
não devem ir ao ar na versão definitiva.

Observação: a marca de um fabricante de equipamentos aparece ao fundo em
`hero.jpg`. Com a foto real da clínica isso deixa de existir.
