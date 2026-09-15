# Arquitetura

```text
Visitante
   │
   ▼
GitHub Pages (site estático)
   │ HTTPS / fetch
   ▼
Cloudflare Worker ─────────────── Workers AI
   │
   ├── D1: membros, entrevista, agenda, catálogo de leitura
   │
   └── R2: fotos enviadas no chat

Colaboradoras.html
   │
   └── GET /api/collaborators
            └── somente status=approved + consentimento + foto
```

## Responsabilidades

### GitHub Pages
Interface, navegação, chatbox, página de colaboradoras e agenda.

### Worker
Porta de entrada e decisão:
- controla o estágio da entrevista;
- valida Turnstile quando configurado;
- grava dados;
- recebe a foto;
- monta orientação de leitura;
- consulta a agenda;
- controla publicação pública.

### D1
Dados estruturados.

### R2
Arquivos de foto. O bucket não precisa ser público: o Worker serve `/media/...`.

### Workers AI
Usado para:
- conversa institucional;
- resumo de estilo;
- orientação de leitura.

A entrevista de cadastro em si é uma máquina de estados determinística, então o registro não depende de o modelo “entender” campos críticos.
