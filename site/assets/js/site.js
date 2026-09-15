(() => {
  const topbar = document.querySelector('.topbar');
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('.navlinks');

  addEventListener('scroll', () => topbar?.classList.toggle('scrolled', scrollY > 8), {passive:true});
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? '×' : '☰';
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    if(menu){ menu.textContent='☰'; menu.setAttribute('aria-expanded','false'); }
  }));

  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
  }), {threshold:.12, rootMargin:'0px 0px -4% 0px'});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  const choices = document.querySelectorAll('.choice[data-choice]');
  const interest = document.getElementById('interest');
  choices.forEach(c => c.addEventListener('click', () => {
    choices.forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
    if(interest) interest.value = c.dataset.choice;
  }));

  const connectionForm = document.getElementById('connectionForm');
  connectionForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(connectionForm);
    const name = (fd.get('name') || '').trim();
    const interestText = fd.get('interest') || 'conhecer o projeto';
    const msg = (fd.get('message') || '').trim();
    const prefill = [
      name ? `Pode me chamar de ${name}.` : '',
      `Quero entrar na comunidade com interesse em ${interestText}.`,
      msg
    ].filter(Boolean).join(' ');

    document.getElementById('connectionNotice').style.display='block';
    await window.HonrandoChat?.startCommunity(prefill);
  });

  document.querySelectorAll('[data-open-community]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      window.HonrandoChat?.startCommunity('');
    });
  });
})();