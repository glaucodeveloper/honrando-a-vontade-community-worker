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
  choices.forEach(c => c.addEventListener('click', () => {
    choices.forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
    const desire = `Quero me integrar à comunidade com interesse em ${c.dataset.choice}. Como posso começar?`;
    window.HonrandoChat?.open();
    window.HonrandoChat?.send(desire, 'community-intent');
  }));

  document.querySelectorAll('[data-open-community]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      window.HonrandoChat?.startCommunity('');
    });
  });
})();
