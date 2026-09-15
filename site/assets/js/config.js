window.HONRANDO_CONFIG = {
  // GitHub Pages não consegue fazer proxy para /api.
  // Após publicar o Worker, coloque aqui a origem completa dele, sem barra final.
  // Ex.: "https://honrando-a-vontade-community.seu-subdominio.workers.dev"
  apiBase: "https://SEU-WORKER.workers.dev",

  // Opcional. Preencha com a site key do Cloudflare Turnstile.
  // Se TURNSTILE_SECRET estiver configurado no Worker, o cadastro exigirá esta verificação.
  turnstileSiteKey: "",

  // Limite visual; o Worker também valida o tamanho real.
  maxPhotoMiB: 5
};
