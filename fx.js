// Blueprint FX for every section after the newspaper:
// crosshair cursor with coordinates, grid spotlight, click ripple,
// text scramble on headings, 3D flip-up reveal, tilt + glare cards,
// magnetic buttons and a scroll ruler HUD.
(function () {
  // Venom "let's collaborate" buttons live in iframes and post a message when pressed
  const contact = () => typeof window.openContactModal === 'function' && window.openContactModal();
  const VENOM_ACTIONS = {
    hero: contact, footer: contact, touch: contact,
    skills: () => document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' }),
    email: () => { location.href = 'mailto:shalyagaonkar@gmail.com'; },
    call: () => { location.href = 'tel:+917483187572'; },
    linkedin: () => window.open('https://www.linkedin.com/in/shalya-gaonkar-740196254', '_blank', 'noopener'),
    github: () => window.open('https://github.com/shalyagaonkar520-web', '_blank', 'noopener'),
  };
  // Venom frames only exist while they are near the screen: each one is a WebGL context and
  // Chrome keeps at most 16 alive, so far-away buttons are unloaded and come back on approach
  const venomIO = new IntersectionObserver((entries) => entries.forEach((en) => {
    const f = en.target;
    clearTimeout(f._fxUnload);
    if (en.isIntersecting) { if (!f._fxLive) { f.src = f.dataset.src; f._fxLive = true; } }
    else if (f._fxLive) f._fxUnload = setTimeout(() => { f.src = 'about:blank'; f._fxLive = false; }, 1500);
  }), { rootMargin: '350px 0px' });
  function runVenom(id) {
    if (id.startsWith('nav:')) { document.getElementById(id.slice(4))?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (id.startsWith('svc:')) {
      const name = decodeURIComponent(id.slice(4));
      if (typeof window.bookSpecificService === 'function') window.bookSpecificService(name); else contact();
      return;
    }
    (VENOM_ACTIONS[id] || contact)();
  }
  // Phones and tablets have no cursor for the goo to chase, and a dozen ray-marched buttons are heavy
  // there, so touch devices get a plain black pill with the same label and action instead.
  const LITE = matchMedia('(pointer: coarse)').matches || innerWidth < 900;
  document.querySelectorAll('iframe.venom-frame[data-src]').forEach((f) => {
    if (!LITE) { venomIO.observe(f); return; }
    const q = new URL(f.dataset.src, location.href).searchParams;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'vlite'; b.textContent = q.get('label') || 'let’s collaborate';
    b.addEventListener('click', (e) => { e.stopPropagation(); runVenom(q.get('id') || ''); });
    f.replaceWith(b);
  });

  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'venom:activate') return;
    runVenom(String(e.data.id || ''));
  });

  const ZONE_IDS = ['skills', 'about', 'experience', 'projects', 'services', 'contact'];
  const zones = ZONE_IDS.map((id) => document.getElementById(id)).filter(Boolean);
  if (!zones.length) return;
  zones.forEach((z) => z.setAttribute('data-fx-zone', ''));

  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;
  if (FINE) root.classList.add('fx-fine');
  const inZone = (el) => !!(el && el.closest && el.closest('[data-fx-zone]'));
  const HOT = 'a,button,[onclick],.accordion-item,#more-builds-grid>*,[data-sk-step],input,textarea,select';

  /* ---------------- cursor + spotlight ---------------- */
  let mx = -999, my = -999, cx = -999, cy = -999;
  let cursor, dot, ring, ch, cv, coord;
  if (FINE) {
    cursor = document.createElement('div');
    cursor.className = 'fx-cursor';
    cursor.innerHTML = '<div class="fx-cross-h"></div><div class="fx-cross-v"></div><div class="fx-ring"></div><div class="fx-dot"></div><div class="fx-coord"></div>';
    document.body.appendChild(cursor);
    [ch, cv, ring, dot, coord] = cursor.children;
  }

  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    const z = inZone(e.target);
    root.classList.toggle('fx-in-zone', z && FINE);
    root.style.setProperty('--mx', (z ? mx : -999) + 'px');
    root.style.setProperty('--my', (z ? my : -999) + 'px');
    if (cursor) {
      const hot = z && e.target.closest(HOT);
      cursor.classList.toggle('hot', !!hot);
    }
    magnet(e);
  }, { passive: true });
  document.addEventListener('pointerleave', () => root.classList.remove('fx-in-zone'));
  // the Venom frames draw their own 3D hand cursor: hide ours while the pointer is inside one
  document.querySelectorAll('.venom-frame').forEach((f) => f.addEventListener('pointerenter', () => {
    root.classList.remove('fx-in-zone');
    root.style.setProperty('--mx', '-999px'); root.style.setProperty('--my', '-999px');
  }));
  addEventListener('pointerdown', () => cursor && cursor.classList.add('down'));
  addEventListener('pointerup', () => cursor && cursor.classList.remove('down'));

  function loop() {
    if (cursor) {
      const k = RM ? 1 : 0.22;
      cx += (mx - cx) * k; cy += (my - cy) * k;
      if (Math.abs(mx - cx) > 400) { cx = mx; cy = my; }
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      ring.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      ch.style.transform = `translate3d(0,${my}px,0)`;
      cv.style.transform = `translate3d(${mx}px,0,0)`;
      coord.style.transform = `translate3d(${mx + 22}px,${my + 18}px,0)`;
      coord.innerHTML = `X <b>${String(Math.round(mx)).padStart(4, '0')}</b> Y <b>${String(Math.round(my + scrollY)).padStart(5, '0')}</b>`;
    }
    hud();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------------- click: ripple ---------------- */
  addEventListener('click', (e) => {
    if (!inZone(e.target) || RM) return;
    for (const cls of ['', 'sq']) {
      const r = document.createElement('span');
      r.className = 'fx-ripple ' + cls;
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 800);
    }
  });

  /* ---------------- text scramble ---------------- */
  const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEF';
  function textNodes(el) {
    const out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (w.currentNode.nodeValue.trim()) out.push(w.currentNode);
    return out;
  }
  function scramble(el) {
    if (RM || el._fxBusy) return;
    el._fxBusy = true;
    const nodes = textNodes(el);
    nodes.forEach((n) => { if (n._fxOrig == null) n._fxOrig = n.nodeValue; });
    const start = performance.now(), dur = 700;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      nodes.forEach((n) => {
        const s = n._fxOrig; let o = '';
        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          if (ch === ' ' || ch === '\n' || i / s.length < t * 1.15 - 0.15) o += ch;
          else o += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        n.nodeValue = o;
      });
      if (t < 1) requestAnimationFrame(step);
      else { nodes.forEach((n) => (n.nodeValue = n._fxOrig)); el._fxBusy = false; }
    };
    requestAnimationFrame(step);
  }

  const heads = [];
  zones.forEach((z) => z.querySelectorAll('h2').forEach((h) => {
    if (h.id === 'sem-title-first' || h.id === 'sem-title-rest') return;
    heads.push(h);
  }));
  const tags = { skills: 'SYS://SKILLS', about: 'SYS://ABOUT', experience: 'LOG://JOURNEY', projects: 'DIR://PROJECTS', services: 'API://SERVICES', contact: 'NET://CONNECT' };
  heads.forEach((h) => {
    const z = h.closest('[data-fx-zone]');
    h.classList.add('fx-head');
    h.dataset.fxTag = '// ' + (tags[z.id] || 'SYS');
    let lastHover = 0;
    h.addEventListener('pointerenter', () => {
      const now = performance.now();
      if (now - lastHover < 900) return;
      lastHover = now;
      scramble(h);
    });
  });

  /* ---------------- scroll reveal ---------------- */
  const revealSel = [
    '#projects h2', '#projects .gh-stat', '#projects .gh-chart',
    '#services h2', '#services .text-center > p', '#services .accordion-item',
    '#contact h2', '#contact .vbtn',
  ].join(',');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      io.unobserve(el);
      el.classList.add('fx-on');
      if (el.tagName === 'H2') { scramble(el); }
      el.addEventListener('transitionend', function done(ev) {
        if (ev.propertyName !== 'transform') return;
        el.removeEventListener('transitionend', done);
        el.classList.remove('fx-rev', 'fx-on'); el.style.removeProperty('--fxd');
      });
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  function armReveal() {
    if (RM) return;
    const groups = new Map();
    document.querySelectorAll(revealSel).forEach((el) => {
      if (el._fxRev) return;
      el._fxRev = true;
      const parent = el.parentElement;
      const i = groups.get(parent) || 0; groups.set(parent, i + 1);
      el.style.setProperty('--fxd', Math.min(i, 8) * 80 + 'ms');
      el.classList.add('fx-rev');
      io.observe(el);
    });
  }
  armReveal();
  // experience + skills headings scramble when they come into view
  const io2 = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) scramble(en.target); }), { threshold: 0.5 });
  document.querySelectorAll('#experience h2, #experience h3').forEach((h) => io2.observe(h));

  // the projects grid is filled by script after load: arm its cards when they appear
  const grid = document.getElementById('more-builds-grid');
  if (grid) new MutationObserver(() => { armReveal(); armTilt(); }).observe(grid, { childList: true });

  /* ---------------- GitHub numbers: count up + bars grow ---------------- */
  document.querySelectorAll('.gh-bar').forEach((b, i) => b.style.setProperty('--i', i));
  const ioNum = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target; ioNum.unobserve(el);
    if (el.classList.contains('gh-bars')) { if (!RM) el.classList.add('fx-grow'); return; }
    const to = +el.dataset.count, suf = el.dataset.suffix || '';
    if (RM) { el.textContent = to + suf; return; }
    const t0 = performance.now(), dur = 1600;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(to * e) + (t === 1 ? suf : '');
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  }), { threshold: 0.4 });
  document.querySelectorAll('[data-count], .gh-bars').forEach((el) => ioNum.observe(el));

  /* ---------------- 3D tilt + glare ---------------- */
  const tiltSel = '#projects .gh-stat, #services .accordion-item, .sk-term';
  function armTilt() {
    if (!FINE || RM) return;
    document.querySelectorAll(tiltSel).forEach((el) => {
      if (el._fxTilt) return;
      el._fxTilt = true;
      el.classList.add('fx-tilt');
      const glare = document.createElement('span'); glare.className = 'fx-glare'; el.appendChild(glare);
      const max = el.classList.contains('accordion-item') ? 4 : 10;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.classList.add('fx-tilting');
        el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * max).toFixed(2)}deg) rotateY(${((px - 0.5) * max).toFixed(2)}deg) translateZ(0)`;
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('fx-tilting');
        el.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 620);
      });
    });
  }
  armTilt();

  /* ---------------- magnetic buttons ---------------- */
  const magnets = () => document.querySelectorAll('#contact a, #contact button, #services button, .sk-steps button, #about #sem-media-content a');
  let magList = [];
  function refreshMagnets() { magList = FINE && !RM ? [...magnets()] : []; }
  refreshMagnets();
  function magnet(e) {
    for (const el of magList) {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const dx = e.clientX - x, dy = e.clientY - y;
      const reach = Math.max(r.width, r.height) * 0.5 + 40;
      if (Math.abs(dx) < reach && Math.abs(dy) < reach) {
        el.style.translate = `${(dx * 0.28).toFixed(1)}px ${(dy * 0.35).toFixed(1)}px`;
        el._fxMag = true;
      } else if (el._fxMag) {
        el.style.translate = '';
        el._fxMag = false;
      }
    }
  }

  /* ---------------- scroll HUD ---------------- */
  const hudEl = document.createElement('div');
  hudEl.className = 'fx-hud';
  hudEl.innerHTML = '<div class="fx-hud-label"></div><div class="fx-ruler-wrap"><div class="fx-ruler"></div><div class="fx-marker"></div></div>';
  document.body.appendChild(hudEl);
  const hudLabel = hudEl.querySelector('.fx-hud-label'), marker = hudEl.querySelector('.fx-marker'), ruler = hudEl.querySelector('.fx-ruler');
  const names = { skills: 'Skills', about: 'About', experience: 'Journey', projects: 'Projects', services: 'Services', contact: 'Contact' };
  let lastHud = '';
  function hud() {
    const first = zones[0].getBoundingClientRect().top;
    const on = first < innerHeight * 0.5;
    root.classList.toggle('fx-hud-on', on);
    if (!on) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    marker.style.transform = `translateY(${(p * ruler.offsetHeight).toFixed(1)}px)`;
    let cur = zones[0].id;
    for (const z of zones) if (z.getBoundingClientRect().top < innerHeight * 0.5) cur = z.id;
    const txt = `<b>${String(Math.round(p * 100)).padStart(3, '0')}%</b> · ${names[cur]}`;
    if (txt !== lastHud) { hudLabel.innerHTML = txt; lastHud = txt; }
  }
})();
