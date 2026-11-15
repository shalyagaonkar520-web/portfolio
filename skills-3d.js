// Skills: a 3D blueprint network. Wireframe core, four skill clusters, data packets
// flowing along the links. Mouse rotates it; scroll flies the camera cluster to cluster
// while a terminal types out each module.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const section = document.getElementById('skills');
const canvas = document.getElementById('sk-canvas');
if (section && canvas) init();

function init() {
  const GROUPS = [
    { slug: 'ai-product', title: 'AI & Product', skills: ['AI Product Development', 'AI Interview Systems', 'Tools for AI Coding Agents', 'Google AI Studio', 'Product Thinking', 'Rapid Prototyping'] },
    { slug: 'frontend', title: 'Frontend', skills: ['React', 'TypeScript', 'JavaScript', 'Vite', 'Tailwind CSS', 'HTML & CSS', 'Leaflet Maps', 'Three.js'] },
    { slug: 'backend', title: 'Backend & Real-time', skills: ['Node.js', 'Express', 'Socket.IO', 'Python', 'Firebase', 'REST & OpenAPI', 'Live GPS Dispatch'] },
    { slug: 'ship', title: 'Deploy & Ship', skills: ['Vercel', 'Railway', 'Docker', 'Git & GitHub', 'Monorepos', 'Automated Testing', 'Android Builds'] },
  ];
  const TOTAL = GROUPS.reduce((n, g) => n + g.skills.length, 0);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = () => innerWidth < 900;

  const labelsEl = document.getElementById('sk-labels');
  const termBody = document.getElementById('sk-term-body');
  const term = document.getElementById('sk-term');
  const intro = document.getElementById('sk-intro');
  const counter = document.getElementById('sk-counter');
  const bar = document.getElementById('sk-bar');
  const stepBtns = [...section.querySelectorAll('[data-sk-step]')];

  // ---------- three ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 900 ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // red theme: warm paper lines on near-black, the active module in ember red
  const INK = new THREE.Color(0xf4efe6);
  const BLUE = new THREE.Color(0xff3b30);
  const FAINT = new THREE.Color(0x4a2826);
  const RED = new THREE.Color(0xff8a3a);

  const root = new THREE.Group();
  scene.add(root);

  const lineMat = (color, opacity) => new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const coreOuter = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.95, 1)), lineMat(BLUE, 0.9));
  const coreInner = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.46)), lineMat(INK, 0.85));
  const coreBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.62, 0.62, 0.62)), lineMat(RED, 0.55));
  root.add(coreOuter, coreInner, coreBox);

  // orbit rings around the core
  const rings = [];
  for (const [r, rx, ry] of [[1.45, 1.1, 0.2], [1.75, 0.3, 0.9], [2.05, -0.6, -0.4]]) {
    const pts = [];
    for (let i = 0; i <= 160; i++) { const a = (i / 160) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat(INK, 0.14));
    ring.rotation.set(rx, ry, 0);
    root.add(ring); rings.push(ring);
  }

  // outer shell + floor grid live in the scene, not the root, so they drift separately
  const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(5.2, 2)), lineMat(INK, 0.05));
  scene.add(shell);
  const grid = new THREE.GridHelper(40, 40, 0xff3b30, 0x5a1c18);
  grid.material.transparent = true; grid.material.opacity = 0.18;
  grid.position.y = -4.2;
  scene.add(grid);

  // ---------- nodes ----------
  const hubDirs = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map((v) => new THREE.Vector3(...v).normalize());
  const HUB_R = 2.75, LEAF_R = 1.08;
  const nodes = []; // {pos, g, hub, name}
  const hubs = [];
  GROUPS.forEach((g, gi) => {
    const hp = hubDirs[gi].clone().multiplyScalar(HUB_R);
    const hub = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.2)), lineMat(INK, 0.9));
    hub.position.copy(hp); root.add(hub); hubs.push(hub);
    nodes.push({ pos: hp, g: gi, hub: true, name: g.title });
    const n = g.skills.length;
    g.skills.forEach((name, i) => {
      // fibonacci sphere, biased outward from the core
      const y = 1 - ((i + 0.5) / n) * 2, rad = Math.sqrt(1 - y * y), th = i * 2.399963;
      const d = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad).add(hubDirs[gi].clone().multiplyScalar(0.9)).normalize();
      nodes.push({ pos: hp.clone().add(d.multiplyScalar(LEAF_R)), g: gi, hub: false, name });
    });
  });

  // ---------- edges ----------
  const edges = []; // [a, b, group]
  const ZERO = new THREE.Vector3();
  nodes.forEach((n, i) => {
    if (n.hub) edges.push([ZERO, n.pos, n.g]);
    else {
      const hubNode = nodes.find((m) => m.hub && m.g === n.g);
      edges.push([hubNode.pos, n.pos, n.g]);
      const next = nodes[i + 1];
      if (next && !next.hub && next.g === n.g) edges.push([n.pos, next.pos, n.g]);
    }
  });
  for (let i = 0; i < 4; i++) edges.push([nodes.find((m) => m.hub && m.g === i).pos, nodes.find((m) => m.hub && m.g === (i + 1) % 4).pos, -1]);

  const ePos = new Float32Array(edges.length * 6);
  const eCol = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], i) => { ePos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6); });
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  eGeo.setAttribute('color', new THREE.BufferAttribute(eCol, 3));
  const eMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6 });
  root.add(new THREE.LineSegments(eGeo, eMat));

  // node dots
  const dotTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 20, 0, Math.PI * 2); g.fill();
    g.lineWidth = 5; g.strokeStyle = '#fff'; g.beginPath(); g.arc(32, 32, 29, 0, Math.PI * 2); g.globalAlpha = 0.5; g.stroke();
    return new THREE.CanvasTexture(c);
  })();
  const leafNodes = nodes.filter((n) => !n.hub);
  const nPos = new Float32Array(leafNodes.length * 3), nCol = new Float32Array(leafNodes.length * 3);
  leafNodes.forEach((n, i) => nPos.set([n.pos.x, n.pos.y, n.pos.z], i * 3));
  const nGeo = new THREE.BufferGeometry();
  nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
  nGeo.setAttribute('color', new THREE.BufferAttribute(nCol, 3));
  root.add(new THREE.Points(nGeo, new THREE.PointsMaterial({ size: 0.16, map: dotTex, vertexColors: true, transparent: true, alphaTest: 0.05, depthWrite: false })));

  // data packets travelling along the links
  const PK = RM ? 0 : 80;
  const packets = Array.from({ length: PK }, () => ({ e: (Math.random() * edges.length) | 0, t: Math.random(), s: 0.25 + Math.random() * 0.7, dir: Math.random() < 0.5 ? 1 : -1 }));
  const pPos = new Float32Array(Math.max(PK, 1) * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.09, map: dotTex, color: BLUE, transparent: true, alphaTest: 0.05, depthWrite: false });
  root.add(new THREE.Points(pGeo, pMat));

  // ---------- labels ----------
  const labels = nodes.map((n) => {
    const el = document.createElement('span');
    el.className = 'sk-lab' + (n.hub ? ' hub' : '');
    el.textContent = n.hub ? n.name : n.name;
    el.dataset.g = n.g;
    labelsEl.appendChild(el);
    return el;
  });

  // ---------- terminal ----------
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const fmt = (txt) => txt.split('\n').map((l) => {
    if (l.startsWith('$ ')) return `<span class="p">shalya@dev</span><span class="c">:~/skills</span><span class="p">$</span> ${esc(l.slice(2))}`;
    if (l.startsWith('[ok]')) return `<span class="ok">[ok]</span>${esc(l.slice(4))}`;
    if (l.startsWith('#')) return `<span class="c">${esc(l)}</span>`;
    return esc(l);
  }).join('\n');
  let typeTok = 0;
  function typeOut(text) {
    const tok = ++typeTok;
    if (RM) { termBody.innerHTML = fmt(text); return; }
    let i = 0;
    const step = () => {
      if (tok !== typeTok) return;
      i = Math.min(text.length, i + 4);
      termBody.innerHTML = fmt(text.slice(0, i)) + '<span class="caret"></span>';
      if (i < text.length) requestAnimationFrame(step);
    };
    step();
  }
  const scripts = {
    intro: `$ whoami\nshalya gaonkar — ai product developer\n$ ls\nai-product/  frontend/  backend/  ship/\n# scroll to mount each module ↓`,
    all: `$ skills --status\n[ok] ${TOTAL} skills · 4 modules · 0 errors\n# every node came from shipping real products\n# keep scrolling ↓`,
  };
  GROUPS.forEach((g, i) => {
    scripts[i] = `$ mount ./${g.slug}\n[ok] ${g.title} online · ${g.skills.length} nodes\n` +
      g.skills.map((s, k) => `  ${k === g.skills.length - 1 ? '└─' : '├─'} ${s}`).join('\n');
  });

  // ---------- state ----------
  let stage = -2, shake = 0, built = 0, visible = false, raf = 0, last = performance.now(), time = 0;
  const mouse = new THREE.Vector2(), mouseT = new THREE.Vector2();
  let mousePx = { x: -999, y: -999 };
  const targetQ = new THREE.Quaternion(), mouseQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
  const curCol = { e: new Float32Array(eCol.length), n: new Float32Array(nCol.length) };
  const v = new THREE.Vector3();

  function progress() {
    const r = section.getBoundingClientRect();
    const span = section.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  }
  const stageFor = (p) => (p < 0.12 ? -1 : p >= 0.92 ? 4 : Math.min(3, Math.floor((p - 0.12) / 0.2)));

  function setStage(s) {
    if (s === stage) return;
    stage = s;
    typeOut(s === -1 ? scripts.intro : s === 4 ? scripts.all : scripts[s]);
    intro.classList.toggle('gone', s !== -1);
    stepBtns.forEach((b) => b.classList.toggle('on', +b.dataset.skStep === s));
    labels.forEach((l) => l.classList.toggle('act', s >= 0 && s <= 3 && +l.dataset.g === s));
    section.dataset.stage = s;
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    const p = progress();
    setStage(stageFor(p));
    bar.style.transform = `scaleX(${p.toFixed(3)})`;
    counter.textContent = stage >= 0 && stage <= 3
      ? `MODULE 0${stage + 1} / 04 · ${GROUPS[stage].skills.length} NODES`
      : `${TOTAL} NODES · 4 MODULES`;

    built = Math.min(1, built + dt / (RM ? 0.001 : 1.8));
    const b = 1 - Math.pow(1 - built, 3);
    root.scale.setScalar(0.45 + 0.55 * b);
    eMat.opacity = 0.6 * b;

    // where the network should face
    const small = isSmall();
    const focused = stage >= 0 && stage <= 3;
    if (focused) {
      targetQ.setFromUnitVectors(hubDirs[stage], new THREE.Vector3(small ? 0 : 0.15, small ? 0.35 : 0.1, 1).normalize());
    } else {
      tmpE.set(0.32, (RM ? 0.6 : time * 0.18) + (stage === 4 ? 0.8 : 0), 0.12);
      targetQ.setFromEuler(tmpE);
    }
    mouse.lerp(mouseT, Math.min(1, dt * 5));
    tmpE.set(-mouse.y * 0.35, mouse.x * 0.55, 0);
    mouseQ.setFromEuler(tmpE);
    targetQ.premultiply(mouseQ);
    root.quaternion.slerp(targetQ, 1 - Math.exp(-dt * 3.2));

    const camZ = focused ? (small ? 11 : 9) : (small ? 13 : 10.5);
    camera.position.z += (camZ - camera.position.z) * (1 - Math.exp(-dt * 2.5));
    const rx = small ? 0 : (focused ? 0.55 : 1.6), ry = small ? 1.1 : 0;
    root.position.x += (rx - root.position.x) * (1 - Math.exp(-dt * 2.5));
    root.position.y += (ry - root.position.y) * (1 - Math.exp(-dt * 2.5));

    camera.position.x = 0; camera.position.y = 0;
    camera.lookAt(0, 0, 0);

    if (!RM) {
      coreOuter.rotation.y += dt * 0.45; coreOuter.rotation.x += dt * 0.12;
      coreInner.rotation.x -= dt * 0.8; coreInner.rotation.z += dt * 0.3;
      coreBox.rotation.y -= dt * 0.6; coreBox.rotation.z += dt * 0.25;
      rings.forEach((r, i) => { r.rotation.z += dt * (0.15 + i * 0.08) * (i % 2 ? -1 : 1); });
      hubs.forEach((h, i) => { h.rotation.y += dt * (0.8 + i * 0.2); });
      shell.rotation.y += dt * 0.025; shell.rotation.x += dt * 0.01;
      grid.position.z = (time * 0.6) % 1;
    }
    const pulse = 1 + Math.sin(time * 3) * 0.06;
    coreOuter.scale.setScalar(pulse);

    // colours: active module blue, others faded
    const lerpTo = (arr, cur, i, c, k) => {
      cur[i] += (c.r - cur[i]) * k; cur[i + 1] += (c.g - cur[i + 1]) * k; cur[i + 2] += (c.b - cur[i + 2]) * k;
      arr[i] = cur[i]; arr[i + 1] = cur[i + 1]; arr[i + 2] = cur[i + 2];
    };
    const k = 1 - Math.exp(-dt * 6);
    edges.forEach(([, , g], i) => {
      const c = !focused ? (g === -1 ? FAINT : INK) : g === stage ? BLUE : FAINT;
      lerpTo(eCol, curCol.e, i * 6, c, k); lerpTo(eCol, curCol.e, i * 6 + 3, c, k);
    });
    eGeo.attributes.color.needsUpdate = true;
    leafNodes.forEach((n, i) => lerpTo(nCol, curCol.n, i * 3, !focused ? INK : n.g === stage ? BLUE : FAINT, k));
    nGeo.attributes.color.needsUpdate = true;
    hubs.forEach((h, i) => h.material.color.lerp(focused && i === stage ? BLUE : INK, k));

    // packets
    for (let i = 0; i < PK; i++) {
      const pk = packets[i];
      pk.t += dt * pk.s * (focused ? 1.4 : 1);
      if (pk.t > 1) {
        pk.t = 0; pk.dir = Math.random() < 0.5 ? 1 : -1;
        if (focused && Math.random() < 0.75) {
          const pool = edges.map((e, j) => (e[2] === stage ? j : -1)).filter((j) => j >= 0);
          pk.e = pool[(Math.random() * pool.length) | 0];
        } else pk.e = (Math.random() * edges.length) | 0;
      }
      const [a, bb] = edges[pk.e];
      const t = pk.dir > 0 ? pk.t : 1 - pk.t;
      pPos[i * 3] = a.x + (bb.x - a.x) * t; pPos[i * 3 + 1] = a.y + (bb.y - a.y) * t; pPos[i * 3 + 2] = a.z + (bb.z - a.z) * t;
    }
    pGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);

    // labels follow their nodes
    root.updateMatrixWorld();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    nodes.forEach((n, i) => {
      v.copy(n.pos).applyMatrix4(root.matrixWorld);
      const dist = v.distanceTo(camera.position);
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      const el = labels[i];
      const depth = Math.min(1, Math.max(0, (14 - dist) / 8));
      let o = (0.25 + depth * 0.75) * b;
      if (focused && n.g !== stage) o *= small ? 0 : 0.35;
      if (small && !focused && !n.hub) o *= 0.0;
      const near = Math.hypot(x - mousePx.x, y - mousePx.y) < 70;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-140%) scale(${near ? 1.18 : 1})`;
      el.style.opacity = o.toFixed(3);
      el.classList.toggle('near', near);
    });
  }

  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { resize(); start(); } }, { rootMargin: '120px 0px' }).observe(section);
  addEventListener('resize', resize);
  addEventListener('scroll', () => { if (visible) start(); }, { passive: true });
  section.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseT.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    mousePx = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  section.addEventListener('pointerleave', () => { mouseT.set(0, 0); mousePx = { x: -999, y: -999 }; });

  // step buttons jump to a module
  stepBtns.forEach((btn) => btn.addEventListener('click', () => {
    const s = +btn.dataset.skStep;
    const top = section.getBoundingClientRect().top + scrollY;
    const span = section.offsetHeight - innerHeight;
    scrollTo({ top: top + span * (0.12 + s * 0.2 + 0.08), behavior: RM ? 'auto' : 'smooth' });
  }));

  resize();
  setStage(stageFor(progress()));
}
