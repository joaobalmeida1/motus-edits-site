# Motus Edits — site

Site de uma página da Motus Edits. HTML, CSS e JS puros, sem build e sem dependências.

```
index.html   conteúdo e estrutura
styles.css   visual (cores, tipografia, layout, mobile)
main.js      barra de timeline, abas, marcadores, slider antes/depois
videos/      os vídeos do portfólio (ver videos/README.md)
```

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Preencher o conteúdo

Todo texto que depende dos vídeos está marcado como `[PREENCHER: ...]` no `index.html`.
Procure por `PREENCHER` e troque cada um. Ao trocar, tire também a classe `ph`
do elemento (é ela que desenha a borda tracejada).

- **Timestamps dos marcadores**: use `m:ss` (ex.: `0:48`). Com esse formato, o marcador
  passa a pular o vídeo, acende durante a reprodução e aparece na posição certa da timeline.
- **Marcadores de som/música** (03 e 06 em cada longform): a forma de onda é desenhada.
  Mova a linha laranja mudando o `left:37%` de `.wave-in` para o ponto onde o som entra.
  Para pôr a forma de onda em outro marcador, copie o bloco `<div class="wave">`.

## Formulário

O formulário ainda não envia para lugar nenhum. Crie um endpoint (ex.: Formspree) e
coloque a URL no `action` do `<form data-form>` no `index.html`.

## Publicar

- **GitHub Pages**: Settings → Pages → Deploy from branch → `main` / root.
  No plano gratuito do GitHub, o repositório precisa ser público.
- **Vercel / Netlify**: importe o repositório; não há comando de build.

Vídeos grandes deixam o repositório pesado (limite de 100 MB por arquivo no GitHub).
Exporte em H.264, 1080p, com bitrate moderado, ou hospede os vídeos fora e troque os
`data-src` no `index.html` pelas URLs.
