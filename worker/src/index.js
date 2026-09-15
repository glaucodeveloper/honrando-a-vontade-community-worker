const PROJECT_CONTEXT = `
Você atende o projeto cultural "Honrando a Vontade".

INFORMAÇÕES INSTITUCIONAIS CONFIRMADAS:
- É um espaço dedicado à valorização da escrita produzida por mulheres.
- Reúne autoras, leitoras e apreciadoras da literatura que desejam compartilhar obras,
  desenvolver sua produção literária e construir uma rede de incentivo baseada no respeito,
  na colaboração e no amor pelas palavras.
- Incentiva criação individual e coletiva por meio de encontros literários, clubes de leitura,
  oficinas, saraus, lançamentos de livros, antologias e projetos culturais.
- Não possui vinculação político-partidária, religiosa ou ideológica segundo a apresentação fornecida.
- Princípios: liberdade de expressão, diálogo respeitoso e compromisso com a literatura
  como forma de criação, reflexão e encontro.
- Missão: promover escrita, leitura e produção literária de mulheres, fortalecer intercâmbio
  cultural e incentivar novas autoras.
- Visão: consolidar-se como comunidade literária reconhecida por incentivar criatividade,
  formação de escritoras e difusão da literatura produzida por mulheres.
- Valores: respeito às diferentes formas de escrita; liberdade criativa; ética e colaboração;
  incentivo à leitura; valorização da cultura e da literatura; acolhimento e diálogo.
- Lema: "Cada mulher carrega uma história; cada história merece ser escrita."

REGRAS:
- Responda em português do Brasil, de forma clara, acolhedora e institucional.
- Não invente calendário, preço, endereço, telefone, e-mail, redes sociais, critérios de seleção,
  vagas ou eventos. Agenda é consultada do banco; se estiver vazia, diga que não há agenda publicada.
- Quando orientar leitura e existir catálogo cadastrado, priorize exclusivamente títulos do catálogo.
- Diferencie orientação de leitura de avaliação da pessoa: descreva preferências de escrita sem diagnosticar.
`;

const STAGES = {
  display_name: 'Como você quer aparecer para a comunidade? Pode ser seu nome, primeiro nome ou nome literário.',
  writing_genres: 'O que você escreve ou gostaria de escrever? Pode citar gêneros ou formas: poesia, crônica, conto, romance, memória, ensaio ou uma mistura.',
  writing_style: 'Como você percebe sua linguagem hoje? Por exemplo: direta, lírica, confessional, narrativa, experimental, memorialista — ou descreva com suas próprias palavras.',
  goals: 'O que você quer desenvolver agora na sua escrita ou participação literária?',
  reading_preferences: 'Que tipos de leitura mais movimentam você? Conte gêneros, temas, autoras, ritmos ou experiências de leitura que procura.',
  bio: 'Escreva uma apresentação curta para seu perfil público. Você poderá manter algo simples e objetivo.',
  photo: 'Agora envie uma foto pelo botão “＋” do chat. Aceito JPEG, PNG ou WebP de até 5 MiB.',
  consent: 'Para concluir: você autoriza a publicação do seu nome de exibição, foto, apresentação e resumo de estilo na página pública de Colaboradoras após aprovação da organização? Responda exatamente “AUTORIZO” para publicar, ou “NÃO AUTORIZO” para manter o cadastro privado.',
  pending: 'Seu cadastro já foi enviado e está aguardando aprovação da organização.',
  private: 'Seu cadastro foi concluído sem autorização de publicação pública.'
};

function allowedOrigin(origin, env){
  const raw = String(env.ALLOWED_ORIGINS || '*').trim();
  if(raw === '*') return '*';
  const list = raw.split(',').map(x=>x.trim()).filter(Boolean);
  return origin && list.includes(origin) ? origin : list[0] || 'null';
}
function cors(request, env){
  const origin=request.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': allowedOrigin(origin,env),
    'Access-Control-Allow-Headers':'Content-Type, Authorization',
    'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS',
    'Access-Control-Max-Age':'86400',
    'Vary':'Origin'
  };
}
function json(data,status=200,headers={}){
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8',...headers}});
}
function clamp(v,max=1600){ return String(v ?? '').trim().slice(0,max); }
async function sessionHash(sessionId){
  const bytes=new TextEncoder().encode(sessionId);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function parseJSON(request){
  try{return await request.json()}catch{return null}
}
async function verifyTurnstile(request,env,token){
  if(!env.TURNSTILE_SECRET) return true;
  if(!token) return false;
  const form=new FormData();
  form.append('secret',env.TURNSTILE_SECRET);
  form.append('response',token);
  const ip=request.headers.get('CF-Connecting-IP');
  if(ip) form.append('remoteip',ip);
  const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form});
  const data=await res.json().catch(()=>({}));
  return data.success===true;
}
async function getSession(env,sessionId){
  if(!sessionId) return null;
  const hash=await sessionHash(sessionId);
  const session=await env.DB.prepare('SELECT * FROM community_sessions WHERE session_hash=?').bind(hash).first();
  if(!session) return null;
  const member=await env.DB.prepare('SELECT * FROM members WHERE id=?').bind(session.member_id).first();
  return {hash,session,member};
}
async function setStage(env,hash,stage){
  await env.DB.prepare("UPDATE community_sessions SET stage=?,updated_at=CURRENT_TIMESTAMP WHERE session_hash=?").bind(stage,hash).run();
}
async function callAI(env,messages,max_tokens=550,temperature=.45){
  if(env.UPSTREAM_URL){
    const res=await fetch(env.UPSTREAM_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json',...(env.UPSTREAM_TOKEN?{'Authorization':`Bearer ${env.UPSTREAM_TOKEN}`}:{})},
      body:JSON.stringify({model:env.UPSTREAM_MODEL||'default',messages,max_tokens,temperature})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error('Falha no provedor de IA');
    return data?.choices?.[0]?.message?.content || data?.answer || data?.response || '';
  }
  if(!env.AI) return '';
  const model=env.AI_MODEL||'@cf/meta/llama-3.1-8b-instruct-fast';
  const out=await env.AI.run(model,{messages,max_tokens,temperature});
  return out?.response || out?.result?.response || '';
}
async function summarizeStyle(env,member){
  const fallback=[member.writing_style,member.writing_genres,member.goals].filter(Boolean).join(' • ').slice(0,420);
  try{
    const answer=await callAI(env,[
      {role:'system',content:'Resuma um perfil literário em 2 frases curtas, sem diagnosticar personalidade, sem elogios genéricos e sem inventar informações.'},
      {role:'user',content:`Gêneros: ${member.writing_genres||''}\nLinguagem: ${member.writing_style||''}\nObjetivo: ${member.goals||''}\nLeituras: ${member.reading_preferences||''}`}
    ],180,.3);
    return clamp(answer||fallback,600);
  }catch{return fallback}
}
async function listAgenda(env,limit=8){
  const now=new Date().toISOString();
  const {results=[]}=await env.DB.prepare(
    "SELECT id,title,description,starts_at,ends_at,location,url FROM events WHERE visible=1 AND status='scheduled' AND starts_at>=? ORDER BY starts_at ASC LIMIT ?"
  ).bind(now,limit).all();
  return results;
}
function agendaText(events){
  if(!events.length) return 'A agenda ainda não tem atividades futuras publicadas. Quando a organização cadastrar encontros, oficinas, saraus ou lançamentos, eles aparecerão na página Agenda e eu poderei informá-los aqui.';
  const lines=events.map(e=>{
    const d=new Date(e.starts_at);
    const when=Number.isNaN(d.getTime())?e.starts_at:new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Bahia'}).format(d);
    return `• ${e.title} — ${when}${e.location?` — ${e.location}`:''}`;
  });
  return `Próximas atividades publicadas:\n${lines.join('\n')}`;
}
async function readingGuidance(env,member,message){
  const {results=[]}=await env.DB.prepare("SELECT title,author,tags,notes,url FROM reading_catalog WHERE active=1 ORDER BY created_at DESC LIMIT 16").all();
  const profile=member?`Perfil da participante:
Gêneros de escrita: ${member.writing_genres||'não informado'}
Estilo descrito: ${member.writing_style||'não informado'}
Objetivos: ${member.goals||'não informado'}
Preferências de leitura: ${member.reading_preferences||'não informado'}`:'A participante ainda não concluiu a entrevista de estilo.';
  if(results.length){
    const catalog=results.map(x=>`- ${x.title}${x.author?` — ${x.author}`:''}; tags: ${x.tags||''}; nota: ${x.notes||''}`).join('\n');
    const ai=await callAI(env,[
      {role:'system',content:`${PROJECT_CONTEXT}\nOriente a leitura em 3 passos curtos. Recomende títulos SOMENTE do catálogo fornecido. Explique por que cada escolha conversa com o perfil.`},
      {role:'user',content:`${profile}\nPedido: ${message}\nCATÁLOGO:\n${catalog}`}
    ],450,.45);
    if(ai) return ai;
  }
  const ai=await callAI(env,[
    {role:'system',content:`${PROJECT_CONTEXT}\nNão existe catálogo oficial de títulos cadastrado. Dê orientação de leitura por caminhos (gêneros, técnicas, ritmos, perguntas de leitura), sem inventar uma lista oficial do projeto. Pode citar categorias e estratégias, não precisa indicar títulos.`},
    {role:'user',content:`${profile}\nPedido: ${message}`}
  ],420,.45);
  return ai || 'Ainda não há catálogo de leituras publicado. Posso orientar por gênero, técnica e objetivo: escolha um eixo de interesse, leia com uma pergunta de observação e registre trechos ou recursos de linguagem que deseja experimentar na própria escrita.';
}
function adminOK(request,env){
  if(!env.ADMIN_TOKEN) return false;
  return request.headers.get('Authorization')===`Bearer ${env.ADMIN_TOKEN}`;
}
async function communityStart(request,env,headers){
  const body=await parseJSON(request);
  if(!body) return json({error:'JSON inválido'},400,headers);
  const sessionId=clamp(body.session_id,200);
  if(!sessionId) return json({error:'session_id obrigatório'},400,headers);

  const existing=await getSession(env,sessionId);
  if(existing){
    const stage=existing.session.stage;
    return json({stage,answer:STAGES[stage]||STAGES.display_name,status:existing.member?.status},200,headers);
  }

  const ok=await verifyTurnstile(request,env,clamp(body.turnstile_token,2400));
  if(!ok) return json({error:'Verificação Turnstile necessária ou inválida.'},403,headers);

  const id=crypto.randomUUID();
  const hash=await sessionHash(sessionId);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO members(id,status) VALUES(?, 'incomplete')").bind(id),
    env.DB.prepare("INSERT INTO community_sessions(session_hash,member_id,stage,turnstile_verified_at) VALUES(?,?, 'display_name', CURRENT_TIMESTAMP)").bind(hash,id)
  ]);
  return json({stage:'display_name',answer:`Bem-vinda à entrada da comunidade. Vou conhecer um pouco da sua escrita e da sua relação com a leitura. ${STAGES.display_name}`},201,headers);
}
async function communityMessage(request,env,headers){
  const body=await parseJSON(request);
  if(!body) return json({error:'JSON inválido'},400,headers);
  const found=await getSession(env,clamp(body.session_id,200));
  if(!found) return json({error:'Cadastro não iniciado. Use “Entrar na comunidade” primeiro.'},404,headers);
  const message=clamp(body.message,1600);
  if(!message) return json({error:'Mensagem vazia'},400,headers);
  const {hash,session,member}=found;
  const stage=session.stage;

  if(stage==='pending') return json({stage,completed:true,answer:STAGES.pending},200,headers);
  if(stage==='private') return json({stage,completed:true,answer:STAGES.private},200,headers);

  const fieldMap={
    display_name:['display_name','writing_genres'],
    writing_genres:['writing_genres','writing_style'],
    writing_style:['writing_style','goals'],
    goals:['goals','reading_preferences'],
    reading_preferences:['reading_preferences','bio'],
    bio:['bio',member.photo_key?'consent':'photo']
  };
  if(fieldMap[stage]){
    const [field,next]=fieldMap[stage];
    await env.DB.prepare(`UPDATE members SET ${field}=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(message,member.id).run();
    await setStage(env,hash,next);
    return json({stage:next,answer:STAGES[next]},200,headers);
  }
  if(stage==='photo'){
    if(member.photo_key){
      await setStage(env,hash,'consent');
      return json({stage:'consent',answer:STAGES.consent},200,headers);
    }
    return json({stage:'photo',answer:'Para continuar, envie a foto pelo botão “＋” do chat. O texto desta etapa não substitui o arquivo.'},200,headers);
  }
  if(stage==='consent'){
    const normalized=message.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
    if(normalized==='AUTORIZO' || normalized==='SIM, AUTORIZO' || normalized==='SIM AUTORIZO'){
      const fresh=await env.DB.prepare('SELECT * FROM members WHERE id=?').bind(member.id).first();
      const summary=await summarizeStyle(env,fresh);
      await env.DB.batch([
        env.DB.prepare("UPDATE members SET public_consent=1,status='pending',style_summary=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(summary,member.id),
        env.DB.prepare("UPDATE community_sessions SET stage='pending',updated_at=CURRENT_TIMESTAMP WHERE session_hash=?").bind(hash)
      ]);
      return json({stage:'pending',completed:true,answer:'Cadastro concluído e enviado para aprovação. Seu perfil ainda não está público. Quando aprovado pela organização, ele poderá aparecer na página Colaboradoras.'},200,headers);
    }
    if(normalized==='NAO AUTORIZO' || normalized==='NÃO AUTORIZO' || normalized==='NAO'){
      await env.DB.batch([
        env.DB.prepare("UPDATE members SET public_consent=0,status='private',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(member.id),
        env.DB.prepare("UPDATE community_sessions SET stage='private',updated_at=CURRENT_TIMESTAMP WHERE session_hash=?").bind(hash)
      ]);
      return json({stage:'private',completed:true,answer:'Cadastro concluído sem publicação pública. Seu perfil não será exibido na página Colaboradoras.'},200,headers);
    }
    return json({stage:'consent',answer:'Para registrar sua decisão com clareza, responda exatamente “AUTORIZO” ou “NÃO AUTORIZO”.'},200,headers);
  }
  return json({error:'Etapa de cadastro inválida'},409,headers);
}
async function communityPhoto(request,env,headers){
  const form=await request.formData();
  const sessionId=clamp(form.get('session_id'),200);
  const file=form.get('file');
  const found=await getSession(env,sessionId);
  if(!found) return json({error:'Cadastro não iniciado.'},404,headers);
  if(!(file instanceof File)) return json({error:'Arquivo de imagem obrigatório.'},400,headers);
  const allowed=['image/jpeg','image/png','image/webp'];
  if(!allowed.includes(file.type)) return json({error:'Use JPEG, PNG ou WebP.'},415,headers);
  const max=5*1024*1024;
  if(file.size>max) return json({error:'A foto deve ter no máximo 5 MiB.'},413,headers);

  const ext=file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp';
  const key=`collaborators/${found.member.id}.${ext}`;
  await env.PHOTOS.put(key,file.stream(),{
    httpMetadata:{contentType:file.type,cacheControl:'public, max-age=3600'},
    customMetadata:{member_id:found.member.id}
  });
  await env.DB.prepare("UPDATE members SET photo_key=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(key,found.member.id).run();

  let next=found.session.stage;
  if(['display_name','writing_genres','writing_style','goals','reading_preferences','bio'].includes(next)){
    return json({stage:next,answer:`Foto recebida e armazenada. Vou continuar a entrevista: ${STAGES[next]}`},200,headers);
  }
  next='consent';
  await setStage(env,found.hash,next);
  return json({stage:next,answer:`Foto recebida. ${STAGES.consent}`},200,headers);
}
async function publicCollaborators(request,env,headers){
  const url=new URL(request.url);
  const {results=[]}=await env.DB.prepare(
    "SELECT id,display_name,city,writing_genres,bio,style_summary,photo_key FROM members WHERE status='approved' AND public_consent=1 AND photo_key IS NOT NULL ORDER BY approved_at DESC,created_at DESC LIMIT 100"
  ).all();
  const collaborators=results.map(x=>({
    id:x.id,display_name:x.display_name,city:x.city,writing_genres:x.writing_genres,bio:x.bio,style_summary:x.style_summary,
    photo_url:`${url.origin}/media/${encodeURIComponent(x.photo_key)}`
  }));
  return json({collaborators},200,headers);
}
async function media(request,env,headers){
  const url=new URL(request.url);
  const encoded=url.pathname.slice('/media/'.length);
  let key;try{key=decodeURIComponent(encoded)}catch{return new Response('Bad key',{status:400,headers})}
  if(!key.startsWith('collaborators/')) return new Response('Not found',{status:404,headers});
  const obj=await env.PHOTOS.get(key);
  if(!obj) return new Response('Not found',{status:404,headers});
  const h=new Headers(headers);
  obj.writeHttpMetadata(h);h.set('etag',obj.httpEtag);h.set('Cache-Control','public, max-age=3600');
  return new Response(obj.body,{headers:h});
}
async function chat(request,env,headers){
  const body=await parseJSON(request);
  if(!body) return json({error:'JSON inválido'},400,headers);
  const message=clamp(body.message,1600);
  if(!message) return json({error:'Mensagem vazia'},400,headers);
  const intent=clamp(body.intent,50).toLowerCase();
  const found=await getSession(env,clamp(body.session_id,200));
  const lower=message.toLowerCase();

  if(intent==='agenda' || /\b(agenda|calend[aá]rio|pr[oó]xim[oa] (evento|atividade)|quando.*(oficina|sarau|encontro))\b/i.test(lower)){
    const events=await listAgenda(env);
    return json({answer:agendaText(events)},200,headers);
  }
  if(intent==='reading' || /\b(leitura|ler|livro|recomenda|orienta.*leitura)\b/i.test(lower)){
    return json({answer:await readingGuidance(env,found?.member,message)},200,headers);
  }

  const cleanHistory=Array.isArray(body.history)?body.history.slice(-8).filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role,content:clamp(x.content,1600)})):[];
  const profile=found?.member?`\nPERFIL DISPONÍVEL (não exponha dados além do necessário):
gêneros=${found.member.writing_genres||''}
estilo=${found.member.writing_style||''}
objetivos=${found.member.goals||''}
leituras=${found.member.reading_preferences||''}`:'';
  const page=body?.page?.title?`\nPágina atual: ${clamp(body.page.title,140)}`:'';
  try{
    const answer=await callAI(env,[
      {role:'system',content:PROJECT_CONTEXT+profile+page},
      ...cleanHistory,
      {role:'user',content:message}
    ],520,.5);
    return json({answer:answer||'Posso ajudar com o projeto, a agenda, orientação de leitura ou sua entrada na comunidade.'},200,headers);
  }catch(err){
    return json({error:'Erro ao processar a conversa',detail:String(err?.message||err)},500,headers);
  }
}
async function adminRoute(request,env,headers,url){
  if(!adminOK(request,env)) return json({error:'Não autorizado'},401,headers);

  if(url.pathname==='/api/admin/members' && request.method==='GET'){
    const status=url.searchParams.get('status')||'pending';
    const {results=[]}=await env.DB.prepare("SELECT id,created_at,status,display_name,city,writing_genres,writing_style,goals,reading_preferences,bio,style_summary,photo_key,public_consent FROM members WHERE status=? ORDER BY created_at DESC LIMIT 200").bind(status).all();
    return json({members:results},200,headers);
  }
  const m=url.pathname.match(/^\/api\/admin\/members\/([^/]+)\/(approve|reject)$/);
  if(m && request.method==='POST'){
    const [_,id,action]=m;
    if(action==='approve'){
      const member=await env.DB.prepare("SELECT * FROM members WHERE id=?").bind(id).first();
      if(!member) return json({error:'Cadastro não encontrado'},404,headers);
      if(!member.public_consent || !member.photo_key) return json({error:'Cadastro sem consentimento ou foto.'},409,headers);
      await env.DB.prepare("UPDATE members SET status='approved',approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
      return json({ok:true,status:'approved'},200,headers);
    }
    await env.DB.prepare("UPDATE members SET status='rejected',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
    return json({ok:true,status:'rejected'},200,headers);
  }
  if(url.pathname==='/api/admin/events' && request.method==='POST'){
    const b=await parseJSON(request);if(!b?.title||!b?.starts_at)return json({error:'title e starts_at são obrigatórios'},400,headers);
    const id=crypto.randomUUID();
    await env.DB.prepare("INSERT INTO events(id,title,description,starts_at,ends_at,location,url,status,visible) VALUES(?,?,?,?,?,?,?,?,?)")
      .bind(id,clamp(b.title,180),clamp(b.description,1200),clamp(b.starts_at,80),clamp(b.ends_at,80),clamp(b.location,240),clamp(b.url,500),b.status==='cancelled'?'cancelled':'scheduled',b.visible===false?0:1).run();
    return json({ok:true,id},201,headers);
  }
  const ev=url.pathname.match(/^\/api\/admin\/events\/([^/]+)$/);
  if(ev && request.method==='DELETE'){
    await env.DB.prepare("DELETE FROM events WHERE id=?").bind(ev[1]).run();
    return json({ok:true},200,headers);
  }
  if(url.pathname==='/api/admin/readings' && request.method==='POST'){
    const b=await parseJSON(request);if(!b?.title)return json({error:'title obrigatório'},400,headers);
    const id=crypto.randomUUID();
    await env.DB.prepare("INSERT INTO reading_catalog(id,title,author,tags,notes,url,active) VALUES(?,?,?,?,?,?,?)")
      .bind(id,clamp(b.title,220),clamp(b.author,180),clamp(b.tags,500),clamp(b.notes,1400),clamp(b.url,500),b.active===false?0:1).run();
    return json({ok:true,id},201,headers);
  }
  const rd=url.pathname.match(/^\/api\/admin\/readings\/([^/]+)$/);
  if(rd && request.method==='DELETE'){
    await env.DB.prepare("DELETE FROM reading_catalog WHERE id=?").bind(rd[1]).run();
    return json({ok:true},200,headers);
  }
  return json({error:'Rota administrativa não encontrada'},404,headers);
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const headers=cors(request,env);
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers});

    if(url.pathname==='/health' && request.method==='GET') return json({ok:true,service:'honrando-community-gateway'},200,headers);
    if(url.pathname.startsWith('/media/') && request.method==='GET') return media(request,env,headers);

    if(url.pathname==='/api/collaborators' && request.method==='GET') return publicCollaborators(request,env,headers);
    if(url.pathname==='/api/agenda' && request.method==='GET') return json({events:await listAgenda(env,50)},200,headers);

    if(url.pathname==='/api/community/start' && request.method==='POST') return communityStart(request,env,headers);
    if(url.pathname==='/api/community/message' && request.method==='POST') return communityMessage(request,env,headers);
    if(url.pathname==='/api/community/photo' && request.method==='POST') return communityPhoto(request,env,headers);
    if(url.pathname==='/api/chat' && request.method==='POST') return chat(request,env,headers);

    if(url.pathname.startsWith('/api/admin/')) return adminRoute(request,env,headers,url);
    return json({error:'Not found'},404,headers);
  }
};