# Honrando a Vontade — comunidade + Worker

Esta entrega transforma o Cloudflare Worker na **porta de entrada da comunidade**.

## O que muda

O Worker agora concentra:

1. entrevista de entrada e estilo de escrita;
2. registro do perfil em Cloudflare D1;
3. envio de foto pelo próprio chat, armazenada em R2;
4. consentimento explícito antes de publicação;
5. fila `pending` para aprovação humana;
6. endpoint público para a página `Colaboradoras`;
7. agenda pública consultada pela página e pelo chat;
8. orientação de leitura usando o perfil da participante;
9. catálogo opcional de leituras administrado pela organização;
10. Cloudflare Turnstile opcional para proteger a criação de cadastros.

O site fica estático no **GitHub Pages**. O GitHub Pages não guarda cadastros nem fotos:
ele apenas apresenta a interface e consulta o Worker.

## Estrutura

- `site/` — site que será publicado no GitHub Pages
- `worker/` — API, entrevista, D1, R2, agenda e orientação de leitura
- `.github/workflows/pages.yml` — deploy do diretório `site/`
- `assets/branding/` — logo
- `docs/` — implantação, dados, administração e fluxo

## Comece por

1. `docs/DEPLOY-CLOUDFLARE.md`
2. `docs/DEPLOY-GITHUB-PAGES.md`
3. `docs/FLUXO-COMUNIDADE.md`
4. `docs/ADMINISTRACAO.md`
