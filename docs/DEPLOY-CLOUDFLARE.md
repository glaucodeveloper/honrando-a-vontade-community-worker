# Deploy do Cloudflare Worker

## 1. Dependências

Na pasta `worker`:

```bash
npm init -y
npm install -D wrangler
npx wrangler login
```

## 2. Criar D1

```bash
npx wrangler d1 create honrando-community
```

Copie o `database_id` retornado para `worker/wrangler.jsonc`.

Aplique a migração:

```bash
npx wrangler d1 execute honrando-community --remote --file=./migrations/0001_schema.sql
```

## 3. Criar R2

```bash
npx wrangler r2 bucket create honrando-community-photos
```

O binding esperado no Worker é `PHOTOS`.

## 4. Segredo administrativo

```bash
npx wrangler secret put ADMIN_TOKEN
```

Use um valor longo e aleatório. Ele protege aprovação de membros e edição de agenda/catálogo.

## 5. Turnstile (recomendado)

Crie um widget Turnstile para o domínio do GitHub Pages.

Depois:

```bash
npx wrangler secret put TURNSTILE_SECRET
```

No site, configure a site key pública em:

```text
site/assets/js/config.js
```

Se `TURNSTILE_SECRET` não existir, o Worker permite iniciar o cadastro sem desafio — útil apenas para desenvolvimento.

A validação é feita no Worker pela API Siteverify.

## 6. CORS

Em `wrangler.jsonc`, troque:

```text
https://SEU-USUARIO.github.io
```

pela origem real do GitHub Pages ou do domínio próprio.

Várias origens podem ser separadas por vírgula.

## 7. Deploy

```bash
npx wrangler deploy
```

Teste:

```bash
curl https://SEU-WORKER.workers.dev/health
```

## 8. Conectar o site

Edite:

```text
site/assets/js/config.js
```

e defina:

```js
apiBase: "https://SEU-WORKER.workers.dev"
```
