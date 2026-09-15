# Fluxo da comunidade

## Entrada pelo chat

O botão **Entrar na comunidade** chama:

```text
POST /api/community/start
```

O Worker cria um `member` e associa a sessão local a um hash SHA-256.

## Entrevista

A entrevista avança por estágios:

1. nome de exibição;
2. gêneros / formas de escrita;
3. linguagem e estilo percebido;
4. objetivos;
5. preferências de leitura;
6. apresentação pública;
7. foto;
8. consentimento.

A ordem é controlada pelo Worker, não pelo modelo.

## Foto

A foto é enviada como `multipart/form-data` para:

```text
POST /api/community/photo
```

Aceitos:
- JPEG
- PNG
- WebP
- máximo 5 MiB

O arquivo fica no R2.

## Consentimento

Para publicar, a participante precisa responder no chat:

```text
AUTORIZO
```

Isso ainda **não publica** o perfil.

O status vira:

```text
pending
```

## Aprovação

Um administrador aprova o registro.

Só então o status vira:

```text
approved
```

A página `colaboradoras.html` consulta:

```text
GET /api/collaborators
```

O endpoint retorna apenas registros:
- `approved`;
- `public_consent=1`;
- com foto.

## Perfil de estilo

Ao concluir a entrada, o Worker cria um resumo curto usando:
- gêneros;
- estilo declarado;
- objetivos;
- preferências de leitura.

Esse resumo é descritivo, não diagnóstico.

## Agenda

A página e o chat consultam a mesma tabela `events`.

Sem evento cadastrado, o chat informa que a agenda ainda não foi publicada.

## Orientação de leitura

O chat usa o perfil já registrado.

Se existir `reading_catalog`, recomenda apenas itens desse catálogo.
Sem catálogo, orienta por gêneros, técnicas e objetivos, sem apresentar uma lista como se fosse oficial.
