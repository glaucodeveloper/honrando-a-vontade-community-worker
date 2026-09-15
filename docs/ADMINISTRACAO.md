# Administração

Todas as rotas abaixo exigem:

```http
Authorization: Bearer SEU_ADMIN_TOKEN
```

## Ver cadastros pendentes

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN"   "https://SEU-WORKER.workers.dev/api/admin/members?status=pending"
```

## Aprovar

```bash
curl -X POST   -H "Authorization: Bearer $ADMIN_TOKEN"   "https://SEU-WORKER.workers.dev/api/admin/members/ID/approve"
```

O Worker bloqueia aprovação se não houver consentimento ou foto.

## Rejeitar

```bash
curl -X POST   -H "Authorization: Bearer $ADMIN_TOKEN"   "https://SEU-WORKER.workers.dev/api/admin/members/ID/reject"
```

## Cadastrar agenda

Use datas ISO 8601 com fuso explícito.

```bash
curl -X POST   -H "Authorization: Bearer $ADMIN_TOKEN"   -H "Content-Type: application/json"   -d '{
    "title":"Oficina de escrita",
    "description":"Descrição definida pela organização",
    "starts_at":"2026-10-10T19:00:00-03:00",
    "location":"Local definido pela organização",
    "url":"https://..."
  }'   "https://SEU-WORKER.workers.dev/api/admin/events"
```

## Remover item da agenda

```bash
curl -X DELETE   -H "Authorization: Bearer $ADMIN_TOKEN"   "https://SEU-WORKER.workers.dev/api/admin/events/ID"
```

## Cadastrar leitura no catálogo

```bash
curl -X POST   -H "Authorization: Bearer $ADMIN_TOKEN"   -H "Content-Type: application/json"   -d '{
    "title":"Título",
    "author":"Autora",
    "tags":"poesia, memória, linguagem",
    "notes":"Por que esta leitura faz parte do percurso."
  }'   "https://SEU-WORKER.workers.dev/api/admin/readings"
```

## Remover leitura

```bash
curl -X DELETE   -H "Authorization: Bearer $ADMIN_TOKEN"   "https://SEU-WORKER.workers.dev/api/admin/readings/ID"
```
