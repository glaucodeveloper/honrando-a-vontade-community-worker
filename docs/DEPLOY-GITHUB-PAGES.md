# Deploy no GitHub Pages

O repositório já contém:

```text
.github/workflows/pages.yml
```

O workflow publica somente a pasta:

```text
site/
```

## Passos

1. Crie um repositório no GitHub.
2. Coloque todo o conteúdo desta entrega no repositório.
3. Configure `site/assets/js/config.js` com a URL do Worker.
4. Faça commit e push para `main`.
5. Em **Settings → Pages**, use **GitHub Actions** como fonte de publicação.
6. Execute o workflow ou faça novo push.

O workflow usa:
- `actions/checkout@v6`
- `actions/configure-pages@v5`
- `actions/upload-pages-artifact@v4`
- `actions/deploy-pages@v4`

## Importante

GitHub Pages é estático. Por isso:
- registros ficam no D1;
- fotos públicas ficam em `site/media/` no repositório;
- agenda fica no D1;
- chat e entrevista rodam no Worker.

Não coloque `ADMIN_TOKEN` nem `TURNSTILE_SECRET` no repositório ou no JavaScript do navegador.
