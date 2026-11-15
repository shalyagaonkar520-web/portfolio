// Daylight flower valley — original three.js scene behind the Skills section (light theme).
// Scroll flies the camera through a valley of glowing flowers; the mouse pushes
// flowers away and makes them glow; hovering the arrow disperses them.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const section = document.getElementById('skills');
const canvas = document.getElementById('valley-canvas');
const stages = [...document.querySelectorAll('[data-stage]')];
const progressBar = document.getElementById('valley-progress');
const go = document.getElementById('valley-go');
const loader = document.getElementById('valley-loader');
const soundBtn = document.getElementById('valley-sound');

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = innerWidth < 820;

// ---------- terrain ----------
const height = (x, z) =>
  Math.pow(Math.abs(x) / 11, 2) * 3.2 +
  Math.sin(z * 0.11) * 0.9 +
  Math.sin(x * 0.35 + z * 0.17) * 0.45 +
  Math.sin(x * 0.9 - z * 0.05) * 0.15;
const pathX = (z) => Math.sin(z * 0.035) * 3.5;
const Z_START = 6, Z_END = -175;

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setClearColor(0xe7e4dc, 1);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xe7e4dc, 0.028);
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 120);

// ---------- flowers & leaves ----------
const COUNT = small ? 14000 : 32000;
const pos = new Float32Array(COUNT * 3);
const col = new Float32Array(COUNT * 3);
const size = new Float32Array(COUNT);
const kind = new Float32Array(COUNT);
const seed = new Float32Array(COUNT);
const palette = [
  [0.86, 0.2, 0.45], [0.6, 0.28, 0.82], [0.2, 0.3, 0.92], [0.95, 0.55, 0.12],
  [0.08, 0.55, 0.62], [0.12, 0.12, 0.14], [0.86, 0.22, 0.2],
].map(c => new THREE.Color(...c));
const leafCol = [new THREE.Color(0.32, 0.52, 0.36), new THREE.Color(0.42, 0.6, 0.42), new THREE.Color(0.5, 0.56, 0.5)];
for (let i = 0; i < COUNT; i++) {
  const z = Z_END - 10 + Math.random() * (Z_START - Z_END + 22);
  const spread = 4 + Math.pow(Math.random(), 1.6) * 26;
  const x = pathX(z) + (Math.random() < 0.5 ? -1 : 1) * Math.random() * spread;
  const isLeaf = Math.random() < 0.38;
  const y = height(x - pathX(z), z) + (isLeaf ? Math.random() * 0.25 : 0.15 + Math.random() * 0.5);
  pos.set([x, y, z], i * 3);
  const c = isLeaf ? leafCol[(Math.random() * leafCol.length) | 0] : palette[(Math.random() * palette.length) | 0];
  col.set([c.r, c.g, c.b], i * 3);
  size[i] = isLeaf ? 0.6 + Math.random() * 0.8 : 0.7 + Math.random() * 1.3;
  kind[i] = isLeaf ? 1 : 0;
  seed[i] = Math.random();
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

const uniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(9, 9) },
  uAspect: { value: 1 },
  uPR: { value: renderer.getPixelRatio() },
  uDisperse: { value: 0 },
  uSpeed: { value: 0 },
};
const flowerMat = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.NormalBlending,
  vertexShader: /* glsl */`
    attribute float aSize; attribute float aKind; attribute float aSeed; attribute vec3 color;
    uniform float uTime, uAspect, uPR, uDisperse;
    uniform vec2 uMouse;
    varying vec3 vColor; varying float vGlow, vKind, vFade, vSeed;
    void main(){
      vec3 p = position;
      p.x += sin(uTime*0.7 + aSeed*40.0) * 0.06;
      p.y += sin(uTime*0.9 + aSeed*25.0) * 0.03;
      // disperse into floating particles
      float d = uDisperse * (0.6 + aSeed);
      p += vec3(sin(aSeed*91.0)*2.2, 1.5 + fract(aSeed*13.0)*4.0 + sin(uTime*0.6+aSeed*9.0)*0.4, cos(aSeed*47.0)*2.2) * d;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vec4 clip = projectionMatrix * mv;
      // screen-space push away from the mouse
      vec2 ndc = clip.xy / clip.w;
      vec2 dv = ndc - uMouse; dv.x *= uAspect;
      float dist = length(dv);
      float push = smoothstep(0.42, 0.0, dist);
      vec2 dir = dist > 0.0001 ? dv / dist : vec2(0.0);
      dir.x /= uAspect;
      ndc += dir * push * push * 0.11;
      clip.xy = ndc * clip.w;
      gl_Position = clip;
      float depth = -mv.z;
      // flowers bloom as they approach, leaves grow in further back
      float grow = aKind < 0.5 ? mix(0.18, 1.0, smoothstep(30.0, 5.0, depth))
                               : mix(0.35, 1.0, smoothstep(3.0, 16.0, depth));
      gl_PointSize = aSize * grow * uPR * (95.0 / max(depth, 0.5)) * (1.0 + push * 0.6 + uDisperse * 0.3);
      vColor = color; vGlow = push; vKind = aKind; vSeed = aSeed;
      vFade = smoothstep(75.0, 18.0, depth) * smoothstep(0.3, 1.6, depth);
    }`,
  fragmentShader: /* glsl */`
    uniform float uTime, uDisperse;
    varying vec3 vColor; varying float vGlow, vKind, vFade, vSeed;
    void main(){
      vec2 c = gl_PointCoord - 0.5;
      float r = length(c);
      if (r > 0.5) discard;
      float a;
      vec3 col;
      if (vKind < 0.5) {
        float ang = atan(c.y, c.x);
        float petals = 0.5 + 0.5 * cos(ang * 5.0 + vSeed * 6.28);
        float shape = smoothstep(0.5, 0.1, r / (0.65 + 0.35 * petals));
        float core = smoothstep(0.14, 0.0, r);
        float halo = smoothstep(0.5, 0.0, r) * 0.35;
        a = max(shape * 0.9, halo * 0.5);
        col = mix(vColor, vColor * 0.55, core);
      } else {
        float shape = smoothstep(0.5, 0.15, r);
        a = shape * 0.5;
        col = vColor;
      }
      float twinkle = 0.85 + 0.15 * sin(uTime * 2.0 + vSeed * 50.0);
      col = mix(col, col * 0.8, 1.0 - twinkle) * (1.0 + vGlow * 0.35);
      gl_FragColor = vec4(col, a * vFade);
    }`,
});
scene.add(new THREE.Points(geo, flowerMat));

// ---------- dust ----------
const DUST = small ? 400 : 900;
const dpos = new Float32Array(DUST * 3);
for (let i = 0; i < DUST; i++) dpos.set([(Math.random() - 0.5) * 30, Math.random() * 8, (Math.random() - 0.5) * 40], i * 3);
const dgeo = new THREE.BufferGeometry();
dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
const dot = document.createElement('canvas'); dot.width = dot.height = 32;
{ const g = dot.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }
const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({
  size: 0.07, map: new THREE.CanvasTexture(dot), color: 0x3b382f, transparent: true, opacity: 0.25,
  depthWrite: false, blending: THREE.NormalBlending,
}));
scene.add(dust);

// ---------- state ----------
let target = 0, prog = 0, drift = 0, lastProg = 0;
let mouse = new THREE.Vector2(9, 9), mouseTarget = new THREE.Vector2(9, 9);
let disperseTarget = 0, flow = 1, firstFrame = true;
let visible = false, raf = 0, last = performance.now();

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  uniforms.uAspect.value = w / h;
}

function scrollProgress() {
  const r = section.getBoundingClientRect();
  const total = section.offsetHeight - innerHeight;
  return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
}

function updateStages(p) {
  stages.forEach(el => {
    const from = +el.dataset.from, to = +el.dataset.to;
    const fade = 0.04;
    let o = 0;
    if (p >= from && p <= to) o = Math.min(1, from <= 0 ? 1 : (p - from) / fade, to >= 1 ? 1 : (to - p) / fade);
    el.style.opacity = o.toFixed(3);
    el.style.transform = `translateY(${((1 - o) * 18).toFixed(1)}px)`;
    el.style.filter = o < 1 ? `blur(${((1 - o) * 4).toFixed(1)}px)` : 'none';
    el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
  });
  if (progressBar) progressBar.style.transform = `scaleX(${p.toFixed(3)})`;
}

function frame(now) {
  raf = visible ? requestAnimationFrame(frame) : 0;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  uniforms.uTime.value += dt;

  target = scrollProgress();
  updateStages(target);
  if (!reduceMotion && uniforms.uDisperse.value < 0.5) drift = Math.min(0.06, drift + dt * 0.0025);
  flow += ((disperseTarget ? 0 : 1) - flow) * Math.min(1, dt * 2);
  prog += (target * 0.9 + drift - prog) * Math.min(1, dt * 3.2) * flow;
  const speed = Math.abs(prog - lastProg) / Math.max(dt, 1e-3); lastProg = prog;
  uniforms.uSpeed.value += (speed - uniforms.uSpeed.value) * 0.1;
  section.style.setProperty('--vig', (0.55 + Math.min(uniforms.uSpeed.value * 2, 0.35)).toFixed(3));

  const z = Z_START + (Z_END - Z_START) * prog;
  const x = pathX(z);
  camera.position.set(x, height(0, z) + 1.55, z);
  const lz = z - 8;
  mouse.lerp(mouseTarget, Math.min(1, dt * 6));
  const look = new THREE.Vector3(pathX(lz) + (mouse.x < 5 ? mouse.x * 1.2 : 0), height(0, lz) + 1.1 + (mouse.x < 5 ? mouse.y * 0.6 : 0), lz);
  camera.lookAt(look);
  uniforms.uMouse.value.copy(mouse);
  uniforms.uDisperse.value += (disperseTarget - uniforms.uDisperse.value) * Math.min(1, dt * 2.2);

  dust.position.set(camera.position.x, height(0, z) - 1, z - 8);
  dust.rotation.y += dt * 0.02;

  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    loader?.classList.add('gone');
    setTimeout(() => section.classList.add('on'), 450);
  }
}

// ---------- ambient sound (synthesised, starts muted) ----------
const audio = { ctx: null, master: null, filter: null, on: false };
function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  const ctx = new AC();
  const master = ctx.createGain(); master.gain.value = 0;
  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 9000; filter.Q.value = 0.4;
  filter.connect(master); master.connect(ctx.destination);
  // soft drone: detuned chord with a slow swell
  [110, 164.8, 220, 277.2, 329.6].forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 12;
    const g = ctx.createGain(); g.gain.value = 0.035 / (1 + i * 0.4);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + Math.random() * 0.08;
    const lg = ctx.createGain(); lg.gain.value = g.gain.value * 0.8;
    lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(filter); o.start(); lfo.start();
  });
  // night wind: filtered noise
  const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = buf.getChannelData(0);
  let b = 0; for (let i = 0; i < d.length; i++) { b = 0.985 * b + 0.015 * (Math.random() * 2 - 1); d[i] = b * 4; }
  const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.6;
  const ng = ctx.createGain(); ng.gain.value = 0.05;
  n.connect(bp); bp.connect(ng); ng.connect(filter); n.start();
  // occasional chimes
  const chime = () => {
    if (audio.on) {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = 'sine'; o.frequency.value = [880, 987.8, 1174.7, 1318.5, 1568][(Math.random() * 5) | 0];
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
      o.connect(g); g.connect(filter); o.start(t); o.stop(t + 2.6);
    }
    setTimeout(chime, 1800 + Math.random() * 4200);
  };
  chime();
  Object.assign(audio, { ctx, master, filter });
  return true;
}
function setSound(on) {
  if (on && !audio.ctx && !initAudio()) return;
  audio.on = on;
  if (!audio.ctx) return;
  if (on) audio.ctx.resume();
  const t = audio.ctx.currentTime;
  audio.master.gain.cancelScheduledValues(t);
  audio.master.gain.setTargetAtTime(on && visible ? 0.9 : 0, t, 0.6);
  soundBtn?.setAttribute('aria-pressed', String(on));
}
function muffle(on) {
  if (!audio.ctx) return;
  audio.filter.frequency.setTargetAtTime(on ? 450 : 9000, audio.ctx.currentTime, 0.35);
}
soundBtn?.addEventListener('click', () => setSound(!audio.on));

function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

new IntersectionObserver(([e]) => {
  visible = e.isIntersecting;
  if (visible) { resize(); start(); }
  if (audio.on) setSound(true); // fade out when the valley leaves the screen, back in on return
}, { rootMargin: '100px 0px' }).observe(section);

addEventListener('resize', resize);
addEventListener('scroll', () => { if (visible) start(); }, { passive: true });
section.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouseTarget.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  if (mouse.x > 5) mouse.copy(mouseTarget);
});
section.addEventListener('pointerleave', () => mouseTarget.set(9, 9));
if (go) {
  const hover = (on) => () => { disperseTarget = on ? 1 : 0; muffle(on); };
  go.addEventListener('pointerenter', hover(true));
  go.addEventListener('pointerleave', hover(false));
  go.addEventListener('focus', hover(true));
  go.addEventListener('blur', hover(false));
}
resize();
updateStages(scrollProgress());
