(() => {
  const cfg = window.HONRANDO_CONFIG || {};
  const base = String(cfg.apiBase || '').replace(/\/+$/,'');
  const api = path => `${base}${path}`;
  const key = 'honrando_community_session';
  const sessionId = localStorage.getItem(key) || crypto.randomUUID();
  localStorage.setItem(key, sessionId);

  const historyKey = 'honrando_chat_history';
  const history = JSON.parse(sessionStorage.getItem(historyKey) || '[]').slice(-12);
  let communityMode = sessionStorage.getItem('honrando_community_mode') === '1';
  let communityStage = sessionStorage.getItem('honrando_community_stage') || '';
  let turnstileToken = '';

  const launch = document.createElement('button');
  launch.className='chat-launch'; launch.setAttribute('aria-label','Abrir conversa'); launch.innerHTML='✦';

  const hint = document.createElement('div');
  hint.className='chat-hint'; hint.textContent='Converse e entre para a comunidade';

  const panel = document.createElement('section');
  panel.className='chat-panel'; panel.setAttribute('aria-label','Chat do Honrando a Vontade');
  panel.innerHTML = `
    <div class="chat-head">
      <div class="chat-mark"><img src="assets/img/logo.png" alt=""></div>
      <div>
        <strong>Honrando a Vontade</strong>
        <small>Conexão, agenda e orientação de leitura</small>
        <div class="chat-mode">${communityMode ? 'ENTREVISTA DE ENTRADA' : 'CONVERSA ABERTA'}</div>
      </div>
      <button class="chat-close" aria-label="Fechar chat">×</button>
    </div>
    <div class="chat-actions">
      <button class="chat-quick" data-action="community">Entrar na comunidade</button>
      <button class="chat-quick" data-action="agenda">Agenda</button>
      <button class="chat-quick" data-action="reading">Orientar leitura</button>
      <button class="chat-quick" data-action="project">Conhecer o projeto</button>
    </div>
    <div class="chat-verification">
      <p>Verificação de entrada. Conclua para iniciar o cadastro.</p>
      <div class="turnstile-slot"></div>
    </div>
    <div class="chat-messages" aria-live="polite"></div>
    <div>
      <div class="chat-photo-note">Durante o cadastro, use o clipe para enviar sua foto. Ela só aparece publicamente após consentimento e aprovação.</div>
      <div class="chat-status"><span class="chat-loading"></span>Processando...</div>
      <form class="chat-form">
        <button type="button" class="chat-attach" aria-label="Enviar foto">＋</button>
        <textarea maxlength="1600" placeholder="Escreva sua mensagem..." aria-label="Mensagem"></textarea>
        <button class="chat-send" aria-label="Enviar">➤</button>
        <input class="chat-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
      </form>
    </div>`;

  document.body.append(hint, launch, panel);
  const messages = panel.querySelector('.chat-messages');
  const form = panel.querySelector('.chat-form');
  const input = form.querySelector('textarea');
  const status = panel.querySelector('.chat-status');
  const fileInput = panel.querySelector('.chat-file');
  const modeLabel = panel.querySelector('.chat-mode');
  const verifyBox = panel.querySelector('.chat-verification');
  const turnstileSlot = panel.querySelector('.turnstile-slot');

  function bubble(role, text){
    const el=document.createElement('div');
    el.className=`bubble ${role}`;
    el.textContent=text;
    messages.appendChild(el);
    messages.scrollTop=messages.scrollHeight;
  }
  function setBusy(on){ status.style.display = on ? 'block' : 'none'; }
  function persist(){ sessionStorage.setItem(historyKey, JSON.stringify(history.slice(-12))); }
  function setMode(on, stage=''){
    communityMode=on;
    communityStage=stage || communityStage;
    sessionStorage.setItem('honrando_community_mode', on ? '1' : '0');
    if(communityStage) sessionStorage.setItem('honrando_community_stage', communityStage);
    modeLabel.textContent = on ? 'ENTREVISTA DE ENTRADA' : 'CONVERSA ABERTA';
  }
  function open(){
    panel.classList.add('open'); hint.classList.add('hidden');
    setTimeout(()=>input.focus(),50);
  }
  function assertConfigured(){
    if(!base || base.includes('SEU-WORKER')){
      throw new Error('Configure apiBase em assets/js/config.js com a URL do Cloudflare Worker.');
    }
  }
  async function jsonFetch(path, options={}){
    assertConfigured();
    const res = await fetch(api(path), options);
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  async function loadTurnstile(){
    if(!cfg.turnstileSiteKey) return '';
    if(turnstileToken) return turnstileToken;
    verifyBox.classList.add('active');

    if(!window.turnstile){
      await new Promise((resolve,reject)=>{
        const existing=document.querySelector('script[data-honrando-turnstile]');
        if(existing){ existing.addEventListener('load',resolve,{once:true}); return; }
        const s=document.createElement('script');
        s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async=true;s.defer=true;s.dataset.honrandoTurnstile='1';
        s.onload=resolve;s.onerror=()=>reject(new Error('Não foi possível carregar o Turnstile.'));
        document.head.appendChild(s);
      });
    }
    return new Promise((resolve,reject)=>{
      turnstileSlot.innerHTML='';
      window.turnstile.render(turnstileSlot,{
        sitekey:cfg.turnstileSiteKey,
        theme:'light',
        callback: token => {turnstileToken=token;verifyBox.classList.remove('active');resolve(token)},
        'error-callback':()=>reject(new Error('Falha na verificação Turnstile.'))
      });
    });
  }

  if(!history.length){
    bubble('assistant','Olá. Posso explicar o projeto, informar a agenda, orientar leituras e conduzir sua entrevista de entrada na comunidade.');
  }
  history.forEach(m=>bubble(m.role,m.content));

  async function generalSend(text, intent=''){
    text=(text||'').trim(); if(!text) return;
    bubble('user',text); history.push({role:'user',content:text});persist();
    input.value='';setBusy(true);
    try{
      const data=await jsonFetch('/api/chat',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          message:text, intent, session_id:sessionId,
          history:history.slice(-10),
          page:{title:document.title,path:location.pathname}
        })
      });
      const answer=data.answer||'Recebi sua mensagem.';
      bubble('assistant',answer);history.push({role:'assistant',content:answer});persist();
    }catch(err){
      bubble('assistant',err.message || 'Não consegui conectar ao Worker agora.');
      console.error('[Honrando Chat]',err);
    }finally{setBusy(false)}
  }

  async function startCommunity(prefill=''){
    open();setBusy(true);
    try{
      const token=await loadTurnstile();
      const data=await jsonFetch('/api/community/start',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({session_id:sessionId,turnstile_token:token})
      });
      setMode(true,data.stage||'');
      bubble('assistant',data.answer);
      if(prefill){
        input.value=prefill;
        setTimeout(()=>input.focus(),50);
      }
    }catch(err){
      bubble('assistant',err.message || 'Não consegui iniciar o cadastro.');
      console.error('[Honrando Community]',err);
    }finally{setBusy(false)}
  }

  async function communitySend(text){
    text=(text||'').trim();if(!text)return;
    bubble('user',text);input.value='';setBusy(true);
    try{
      const data=await jsonFetch('/api/community/message',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({session_id:sessionId,message:text})
      });
      setMode(!data.completed,data.stage||'');
      bubble('assistant',data.answer);
      if(data.completed){
        sessionStorage.setItem('honrando_community_mode','0');
        communityMode=false;
        modeLabel.textContent='CONVERSA ABERTA';
      }
    }catch(err){
      bubble('assistant',err.message || 'Não consegui registrar essa resposta.');
    }finally{setBusy(false)}
  }

  async function uploadPhoto(file){
    if(!file)return;
    const max=(Number(cfg.maxPhotoMiB)||5)*1024*1024;
    if(file.size>max){bubble('assistant',`A foto precisa ter no máximo ${cfg.maxPhotoMiB||5} MiB.`);return;}
    open();bubble('user',`Foto enviada: ${file.name}`);setBusy(true);
    try{
      const fd=new FormData();fd.append('session_id',sessionId);fd.append('file',file);
      const data=await jsonFetch('/api/community/photo',{method:'POST',body:fd});
      setMode(true,data.stage||'consent');
      bubble('assistant',data.answer);
    }catch(err){
      bubble('assistant',err.message || 'Não consegui enviar a foto.');
    }finally{setBusy(false);fileInput.value=''}
  }

  form.addEventListener('submit',e=>{
    e.preventDefault();
    communityMode ? communitySend(input.value) : generalSend(input.value);
  });
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}
  });
  panel.querySelector('.chat-attach').addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',()=>uploadPhoto(fileInput.files?.[0]));

  panel.querySelectorAll('.chat-quick').forEach(btn=>btn.addEventListener('click',async()=>{
    const action=btn.dataset.action;
    if(action==='community') return startCommunity('');
    if(action==='agenda') return generalSend('Qual é a agenda atual do projeto?','agenda');
    if(action==='reading') return generalSend('Quero orientação de leitura de acordo com meu perfil.','reading');
    return generalSend('Quero conhecer melhor o Honrando a Vontade.','project');
  }));

  launch.addEventListener('click',()=>{panel.classList.toggle('open');hint.classList.add('hidden');if(panel.classList.contains('open'))setTimeout(()=>input.focus(),50)});
  panel.querySelector('.chat-close').addEventListener('click',()=>panel.classList.remove('open'));
  setTimeout(()=>hint.classList.add('hidden'),7000);

  window.HonrandoChat={open(prefill=''){open();if(prefill)input.value=prefill},send:generalSend,startCommunity,uploadPhoto};
})();