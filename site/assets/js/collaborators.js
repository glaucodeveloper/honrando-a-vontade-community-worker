(() => {
  const cfg=window.HONRANDO_CONFIG||{};
  const base=String(cfg.apiBase||'').replace(/\/+$/,'');
  const root=document.getElementById('collaboratorGrid');
  const status=document.getElementById('collaboratorStatus');
  if(!root)return;

  const tag=(text)=>{
    const el=document.createElement('span');el.className='tag';el.textContent=text;return el;
  };
  function empty(title,text){
    root.innerHTML='';
    const box=document.createElement('div');box.className='empty-state';box.style.gridColumn='1/-1';
    const strong=document.createElement('strong');strong.textContent=title;
    const p=document.createElement('div');p.textContent=text;box.append(strong,p);root.appendChild(box);
  }
  async function load(){
    if(!base||base.includes('SEU-WORKER')){
      empty('Worker ainda não configurado','Defina apiBase em assets/js/config.js para carregar os perfis aprovados.');
      status.textContent='Aguardando configuração do Worker.';return;
    }
    try{
      const res=await fetch(`${base}/api/collaborators`);
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||`HTTP ${res.status}`);
      const items=data.collaborators||[];
      status.textContent=`${items.length} perfil(is) público(s)`;
      if(!items.length){
        empty('A comunidade pública começa aqui','Perfis aprovados e autorizados aparecerão nesta página.');
        return;
      }
      root.innerHTML='';
      items.forEach(item=>{
        const article=document.createElement('article');article.className='card collaborator-card reveal visible';
        const img=document.createElement('img');img.className='collaborator-photo';img.loading='lazy';img.alt=`Foto de ${item.display_name}`;img.src=item.photo_url;
        const body=document.createElement('div');body.className='collaborator-body';
        const meta=document.createElement('div');meta.className='collaborator-meta';meta.textContent=item.city||'Comunidade Honrando a Vontade';
        const h=document.createElement('h3');h.textContent=item.display_name;
        const p=document.createElement('p');p.textContent=item.style_summary||item.bio||'Integrante da comunidade.';
        const tags=document.createElement('div');tags.className='tags';
        String(item.writing_genres||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,5).forEach(t=>tags.appendChild(tag(t)));
        body.append(meta,h,p,tags);article.append(img,body);root.appendChild(article);
      });
    }catch(err){
      console.error(err);
      status.textContent='Falha ao carregar.';
      empty('Não foi possível carregar as colaboradoras','Verifique a URL do Worker e a configuração de CORS.');
    }
  }
  load();
})();