// "A journey through time": a warm black room, a timeline arc, a big clock whose hand you swing
// with the cursor (or scroll on touch). Whichever chapter the hand points at lights up.
(function () {
  const section = document.getElementById('journey');
  if (!section) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = section.querySelector('.jr-stage');
  const svg = section.querySelector('.jr-svg');
  const hand = svg.querySelector('#jr-hand');
  const hand2 = svg.querySelector('#jr-hand2');
  const beam = svg.querySelector('#jr-beam');
  const rail = svg.querySelector('#jr-rail');
  const cards = [...section.querySelectorAll('.jr-card')];
  const dots = [...svg.querySelectorAll('.jr-node')];
  const N = cards.length;

  // geometry in the 1600x900 viewBox: a dome arc and the clock pivot above it
  const CX = 800, CY = -900, R = 1400, PIVOT = { x: 800, y: 150 };
  const xs = [250, 525, 800, 1075, 1350];
  const arcY = (x) => CY + Math.sqrt(R * R - (x - CX) * (x - CX));
  const nodes = xs.map((x) => ({ x, y: arcY(x) }));
  const pointAt = (u) => {
    const i = Math.max(0, Math.min(N - 2, Math.floor(u))), t = Math.max(0, Math.min(1, u - i));
    const x = xs[i] + (xs[i + 1] - xs[i]) * t;
    return { x, y: arcY(x) };
  };

  let u = 0, target = 0, active = -1, pointerOwned = false, visible = false, intro = RM ? 1 : 0, introStarted = RM;

  function setActive(i) {
    if (i === active) return;
    active = i;
    cards.forEach((c, k) => c.classList.toggle('on', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
  }

  function draw() {
    const p = pointAt(u);
    const ang = Math.atan2(p.y - PIVOT.y, p.x - PIVOT.x);
    const len = Math.hypot(p.x - PIVOT.x, p.y - PIVOT.y) - 26;
    const hx = PIVOT.x + Math.cos(ang) * len, hy = PIVOT.y + Math.sin(ang) * len;
    hand.setAttribute('x2', hx.toFixed(1)); hand.setAttribute('y2', hy.toFixed(1));
    const a2 = ang - 1.29, l2 = 230; // companion hand, 74 degrees apart
    hand2.setAttribute('x2', (PIVOT.x + Math.cos(a2) * l2).toFixed(1)); hand2.setAttribute('y2', (PIVOT.y + Math.sin(a2) * l2).toFixed(1));
    // light cone from the pivot onto the active point
    const spread = 70, nx = -Math.sin(ang), ny = Math.cos(ang);
    beam.setAttribute('points', `${PIVOT.x},${PIVOT.y} ${(p.x + nx * spread).toFixed(1)},${(p.y + ny * spread).toFixed(1)} ${(p.x - nx * spread).toFixed(1)},${(p.y - ny * spread).toFixed(1)}`);
    setActive(Math.round(u));
  }

  function progress() {
    const r = section.getBoundingClientRect();
    const span = section.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  }

  let last = performance.now();
  function loop(now) {
    if (!visible) { requestAnimationFrame(loop); last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (introStarted && intro < 1) {
      intro = Math.min(1, intro + dt / 2.2);
      section.style.setProperty('--intro', intro.toFixed(3));
    }
    if (!pointerOwned) target = progress() * (N - 1);
    u += (target - u) * (RM ? 1 : Math.min(1, dt * 5));
    draw();
    requestAnimationFrame(loop);
  }

  // cursor -> position along the timeline (by x across the node span)
  section.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = svg.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * 1600;
    let t;
    if (vx <= xs[0]) t = 0; else if (vx >= xs[N - 1]) t = N - 1;
    else { const i = xs.findIndex((x, k) => vx >= x && vx <= xs[k + 1]); t = i + (vx - xs[i]) / (xs[i + 1] - xs[i]); }
    target = t; pointerOwned = true;
  });
  section.addEventListener('pointerleave', () => { pointerOwned = false; });
  cards.forEach((c, i) => {
    c.addEventListener('click', () => { target = i; pointerOwned = true; });
    c.addEventListener('focus', () => { target = i; pointerOwned = true; });
  });

  // place nodes and cards from the same geometry the SVG uses
  dots.forEach((d, i) => { d.setAttribute('cx', nodes[i].x); d.setAttribute('cy', nodes[i].y); });
  svg.querySelectorAll('.jr-year').forEach((t, i) => { t.setAttribute('x', nodes[i].x); t.setAttribute('y', nodes[i].y - 34); });
  cards.forEach((c, i) => {
    c.style.left = (nodes[i].x / 1600 * 100) + '%';
    c.style.top = ((nodes[i].y + 40) / 900 * 100) + '%';
  });
  const railPts = [];
  for (let x = 150; x <= 1450; x += 20) railPts.push(`${x},${arcY(x).toFixed(1)}`);
  rail.setAttribute('d', 'M' + railPts.join(' L'));

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) introStarted = true;
  }, { threshold: 0.2 }).observe(section);
  if (RM) section.style.setProperty('--intro', '1');
  draw();
  requestAnimationFrame(loop);
})();
