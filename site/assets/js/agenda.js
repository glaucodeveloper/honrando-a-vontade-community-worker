(() => {
  const cfg=window.HONRANDO_CONFIG||{};
  const base=String(cfg.apiBase||'').replace(/\/+$/,'');
  const root=document.getElementById('agendaList');
  const status=document.getElementById('agendaStatus');
  if(!root)return;
  function fmt(iso){
    if(!iso)return {date:'A definir',time:''};
    const d=new Date(iso);
    if(Number.isNaN(d.getTime()))return {date:iso,time:''};
    return {
      date:new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(d),
      time:new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(d)
    };
  }
  function empty(title,text){
    root.innerHTML=`<div class="empty-state"><strong>${title}</strong><div>${text}</div></div>`;
  }
  async function load(){
    if(!base||base.includes('SEU-WORKER')){empty('Worker ainda não configurado','Defina apiBase em assets/js/config.js.');status.textContent='Aguardando Worker.';return;}
    try{
      const res=await fetch(`${base}/api/agenda`);
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||`HTTP ${res.status}`);
      const items=data.events||[];status.textContent=`${items.length} atividade(s) publicada(s)`;
      if(!items.length){empty('Agenda ainda não publicada','Quando a organização publicar encontros, oficinas, saraus ou lançamentos, eles aparecerão aqui.');return;}
      root.innerHTML='';
      items.forEach(item=>{
        const d=fmt(item.starts_at);
        const article=document.createElement('article');article.className='event-card reveal visible';
        const date=document.createElement('div');date.className='event-date';date.innerHTML=`<strong>${d.date}</strong><small>${d.time}</small>`;
        const content=document.createElement('div');
        const h=document.createElement('h3');h.textContent=item.title;
        const p=document.createElement('p');p.textContent=[item.description,item.location].filter(Boolean).join(' • ');
        content.append(h,p);
        const action=document.createElement('div');action.className='event-action';
        if(item.url){const a=document.createElement('a');a.className='btn btn-secondary';a.href=item.url;a.target='_blank';a.rel='noopener';a.textContent='Ver detalhes';action.append(a)}
        article.append(date,content,action);root.append(article);
      });
    }catch(err){console.error(err);status.textContent='Falha ao carregar.';empty('Agenda indisponível','Verifique a conexão com o Worker.');}
  }
  load();
})();