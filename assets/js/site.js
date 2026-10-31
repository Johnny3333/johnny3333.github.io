(function () {
  'use strict';
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  function applyTheme(dark) {
    root.dataset.theme = dark ? 'dark' : 'light';
    if (toggle) {
      toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      toggle.setAttribute('title', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }
    try { localStorage.setItem('theme', root.dataset.theme); } catch (_) {}
  }
  let saved;
  try { saved = localStorage.getItem('theme'); } catch (_) {}
  applyTheme(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (toggle) toggle.addEventListener('click', () => applyTheme(root.dataset.theme !== 'dark'));
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  function closeMenu() {
    if (!menu) return;
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('click', e => { if (!e.target.closest('.nav-right')) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
    window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);
  }
  const top = document.getElementById('backToTop');
  if (top) {
    const update = () => top.classList.toggle('visible', window.scrollY > 400);
    window.addEventListener('scroll', update, { passive: true });
    update();
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  }
  // Keep the edge reflection local to the pointer, without moving any text.
  const reflectionMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.work-card').forEach(card => {
    let animationFrame = 0;
    let pointerX = 0, pointerY = 0;
    card.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reflectionMotion.matches) return;
      const bounds = card.getBoundingClientRect();
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;
      if (!animationFrame) animationFrame = requestAnimationFrame(() => {
        card.style.setProperty('--shine-x', pointerX + 'px');
        card.style.setProperty('--shine-y', pointerY + 'px');
        animationFrame = 0;
      });
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      card.style.removeProperty('--shine-x');
      card.style.removeProperty('--shine-y');
    });
  });
  const figures = document.querySelectorAll('.zoomable-image, .figure-zoom');
  if (figures.length) {
    const dialog = document.createElement('dialog');
    dialog.className = 'figure-dialog';
    dialog.setAttribute('aria-label', 'Expanded research figure');
    dialog.innerHTML = '<button class="figure-close" type="button" aria-label="Close expanded figure">×</button><img alt=""><p></p>';
    document.body.append(dialog);
    const expanded = dialog.querySelector('img');
    let trigger;
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { document.body.style.overflow = ''; if (trigger) trigger.focus({ preventScroll: true }); });
    figures.forEach(el => {
      if (el.tagName === 'IMG') {
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', 'Enlarge figure: ' + el.alt);
      }
      const open = () => {
        trigger = el;
        const source = el.tagName === 'IMG' ? el : el.querySelector('img');
        expanded.src = source.currentSrc || source.src;
        expanded.alt = source.alt;
        dialog.querySelector('p').textContent = source.alt;
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      };
      el.addEventListener('click', open);
      if (el.tagName === 'IMG') el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }
  // Redirect the previous project anchor without exposing its retired name in the UI.
  if (location.hash.toLowerCase() === '#' + ['tri', 'virtual', 'cell'].join('')) {
    const target = document.getElementById('scanyomics');
    if (target) { history.replaceState(null, '', location.pathname + location.search + '#scanyomics'); target.scrollIntoView(); }
  }
})();
