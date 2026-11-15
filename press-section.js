// Press section: drives the 3D newspaper, highlights, pen line and hanging ID card from scroll.
(function () {
  const section = document.getElementById('roles');
  if (!section || !section.classList.contains('press')) return;

  const paper = document.getElementById('press-paper');
  const wrap = document.getElementById('idc-wrap');
  const card = document.getElementById('idc');
  const line = section.querySelector('.np-line');
  const steps = Array.from(section.querySelectorAll('[data-from][data-to]')).map((el) => ({
    el,
    from: parseFloat(el.dataset.from),
    to: parseFloat(el.dataset.to),
    prop: el.classList.contains('hl') ? '--h'
      : el.classList.contains('np-box') ? '--d'
      : el.classList.contains('idc-chip') ? '--c'
      : '--w',
  }));

  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  function apply(p, drop) {
    paper.style.setProperty('--p', p.toFixed(4));
    line.style.setProperty('--l', clamp((p - 0.08) / 0.8).toFixed(4));
    wrap.style.setProperty('--drop', ease(clamp(drop)).toFixed(4));
    for (const s of steps) s.el.style.setProperty(s.prop, ease(clamp((p - s.from) / (s.to - s.from))).toFixed(4));
  }

  function measure() {
    const vh = window.innerHeight;
    const r = section.getBoundingClientRect();
    let p, drop;
    if (window.innerWidth >= 1024) {
      // pinned: progress through the tall section; the card drops in as the section arrives
      p = clamp(-r.top / Math.max(1, r.height - vh));
      drop = (vh - r.top) / (vh * 0.9);
    } else {
      // stacked: progress follows the paper as it scrolls through the viewport
      const pr = paper.getBoundingClientRect();
      p = clamp((vh * 0.85 - pr.top) / (pr.height + vh * 0.1));
      const wr = wrap.getBoundingClientRect();
      drop = (vh - wr.top) / (vh * 0.6);
    }
    return { p, drop };
  }

  if (RM) { apply(1, 1); return; }

  let ticking = false;
  function update() {
    ticking = false;
    const m = measure();
    apply(m.p, m.drop);
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();

  // ID card tilts toward the pointer
  const scene = document.getElementById('press-scene');
  scene.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
    const y = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
    card.style.setProperty('--ry', (Math.max(-1, Math.min(1, x)) * 14).toFixed(2) + 'deg');
    card.style.setProperty('--rx', (Math.max(-1, Math.min(1, -y)) * 10).toFixed(2) + 'deg');
  });
  scene.addEventListener('pointerleave', () => {
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--rx', '0deg');
  });
})();
