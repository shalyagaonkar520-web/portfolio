// "My AI Arsenal": a dark, red-lit room. Shalya stands in the middle on a wet floor while
// rounded cubes for the AI tools he builds with float around him. The cubes materialise
// together when the section arrives, drift and turn, lean toward the cursor, and lift on hover.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const section = document.getElementById('universe');
const canvas = document.getElementById('uni-canvas');
if (section && canvas) init();

function init() {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tip = document.getElementById('uni-tip');

  // name, accent colour, glyph, what it does for me
  const TOOLS = [
    ['Claude', '#d97757', '✳', 'Coding partner, reasoning and long-form building'],
    ['ChatGPT', '#10a37f', '◎', 'Ideas, drafts and quick answers'],
    ['Gemini', '#4f8cff', '✦', 'Multimodal research and Google AI Studio builds'],
    ['Cursor', '#f2f2f2', '▲', 'AI-first code editor for daily shipping'],
    ['Copilot', '#9b6bff', '⌘', 'Inline completions while I type'],
    ['Perplexity', '#20b8cd', '✺', 'Research with sources'],
    ['n8n', '#ea4b71', '⧉', 'Automation workflows and agents'],
    ['Hugging Face', '#ffcc33', '☻', 'Open models and datasets'],
    ['Midjourney', '#e8e8e8', '⛵', 'Visual concepts and moodboards'],
    ['v0 by Vercel', '#ffffff', '▸', 'UI prototypes from a prompt'],
    ['Lovable', '#ff5c8a', '♥', 'Full apps from a prompt'],
    ['Ollama', '#cfcfcf', '◉', 'Running models locally'],
  ];
  // [x, y, z, size] hand placed around the figure, nearer cubes larger
  const SLOTS = [
    [2.9, 3.35, 0.4, 1.35], [-3.0, 2.2, 0.2, 1.25], [4.3, 1.55, -0.6, 1.0], [-1.5, 4.0, -1.2, 0.95],
    [5.2, 4.9, -2.8, 0.8], [1.3, 4.45, -1.8, 0.8], [3.7, 0.25, 0.9, 0.85], [-4.1, 0.65, 0.6, 0.9],
    [5.6, 3.3, -2.2, 0.9], [-2.0, 0.75, 1.6, 0.7], [1.75, 0.95, 1.9, 0.72], [-6.0, 1.9, -2.6, 0.85],
  ];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 900 ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050203);
  scene.fog = new THREE.Fog(0x050203, 10, 26);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);

  // ---------- lights ----------
  scene.add(new THREE.AmbientLight(0x2a1416, 0.9));
  const key = new THREE.DirectionalLight(0xffe2d6, 1.1); key.position.set(-4, 7, 6); scene.add(key);
  const redBack = new THREE.PointLight(0xff2a2a, 60, 18, 2); redBack.position.set(0, 2.6, -3.5); scene.add(redBack);
  const redLow = new THREE.PointLight(0xff3b2f, 18, 10, 2); redLow.position.set(-3, 0.4, 2); scene.add(redLow);
  const blueKick = new THREE.PointLight(0x3a5bff, 10, 9, 2); blueKick.position.set(4.5, 0.3, 1.5); scene.add(blueKick);

  // ---------- floor: wet, dark, with ring lines and a red pool behind the figure ----------
  const floorMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMat: { value: 0 } },
    transparent: false,
    vertexShader: `varying vec2 vP; void main(){ vP = (modelMatrix*vec4(position,1.)).xz; gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vP; uniform float uTime, uMat;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
      void main(){
        float r = length(vP - vec2(0.0, -0.4));
        vec3 base = vec3(0.018, 0.010, 0.012);
        float pool = exp(-r*r*0.09) * 0.55;
        vec3 col = base + vec3(0.55, 0.06, 0.05) * pool * uMat;
        // concentric mechanism rings
        float rings = 0.0;
        for (int i = 1; i <= 4; i++) { float rr = float(i) * 1.55; rings += smoothstep(0.035, 0.0, abs(r - rr)) * (0.55 - float(i) * 0.1); }
        float a = atan(vP.y, vP.x);
        float gaps = step(0.3, fract(a * 1.9 + uTime * 0.03));
        col += vec3(0.9, 0.18, 0.12) * rings * gaps * uMat * 0.45;
        // wet streaks
        float streak = smoothstep(0.65, 1.0, hash(floor(vP * vec2(30.0, 3.0)))) * 0.05;
        col += vec3(0.6, 0.15, 0.15) * streak * pool;
        col *= smoothstep(16.0, 4.0, r);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
  floor.rotation.x = -Math.PI / 2; scene.add(floor);

  // back halo ring
  const halo = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.018, 8, 200), new THREE.MeshBasicMaterial({ color: 0xff3326, transparent: true, opacity: 0.0, fog: false }));
  halo.position.set(0, 2.4, -4); scene.add(halo);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.01, 8, 220, Math.PI * 1.2), new THREE.MeshBasicMaterial({ color: 0xff3326, transparent: true, opacity: 0.0 }));
  halo2.position.set(0.4, 2.2, -5); halo2.rotation.z = 0.5; scene.add(halo2);

  // ---------- the figure: matted photo, graded down, with a red rim generated from its alpha ----------
  const figTex = new THREE.TextureLoader().load('assets/cine/me_cut.png');
  figTex.colorSpace = THREE.SRGBColorSpace;
  const FIG_H = 3.7, FIG_W = FIG_H * (450 / 1450);
  const figMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: figTex }, uMat: { value: 0 }, uFlip: { value: 0 }, uTexel: { value: new THREE.Vector2(1 / 450, 1 / 1450) } },
    transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform float uMat, uFlip; uniform vec2 uTexel; varying vec2 vUv;
      void main(){
        vec2 uv = vec2(vUv.x, uFlip > 0.5 ? 1.0 - vUv.y : vUv.y);
        vec4 c = texture2D(uTex, uv);
        // rim: how much alpha drops off to each side
        float l = texture2D(uTex, uv + vec2(-6.0, 0.0) * uTexel).a, r = texture2D(uTex, uv + vec2(6.0, 0.0) * uTexel).a;
        float u = texture2D(uTex, uv + vec2(0.0, 6.0) * uTexel).a;
        float rimL = clamp(c.a - l, 0.0, 1.0), rimR = clamp(c.a - r, 0.0, 1.0), rimU = clamp(c.a - u, 0.0, 1.0);
        vec3 col = (c.rgb - 0.5) * 1.08 + 0.5; col *= vec3(0.9, 0.86, 0.86);  // near-natural, like a lit subject
        col += vec3(1.0, 0.18, 0.12) * (rimL * 0.8 + rimU * 0.45) + vec3(1.0, 0.45, 0.3) * rimR * 0.35;
        float a = c.a * uMat;
        if (uFlip > 0.5) { a *= 0.22 * smoothstep(0.55, 1.0, vUv.y); col *= 0.6; }
        gl_FragColor = vec4(col, a);
      }`,
  });
  const fig = new THREE.Mesh(new THREE.PlaneGeometry(FIG_W, FIG_H), figMat);
  fig.position.set(0, FIG_H / 2, 0); scene.add(fig);
  const reflMat = figMat.clone(); reflMat.uniforms = THREE.UniformsUtils.clone(figMat.uniforms);
  reflMat.uniforms.uTex.value = figTex; reflMat.uniforms.uFlip.value = 1;
  const refl = new THREE.Mesh(new THREE.PlaneGeometry(FIG_W, FIG_H), reflMat);
  refl.position.set(0, -FIG_H / 2 + 0.01, 0); refl.renderOrder = 2; reflMat.depthTest = false; scene.add(refl);
  fig.renderOrder = 3;

  // ---------- tool cubes ----------
  function faceTexture(name, accent, glyph) {
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
    g.fillStyle = '#0d0b0c'; g.fillRect(0, 0, 512, 512);
    const gr = g.createRadialGradient(256, 210, 10, 256, 210, 300); gr.addColorStop(0, 'rgba(255,255,255,0.07)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = accent; g.shadowColor = accent; g.shadowBlur = 30;
    g.font = `700 ${glyph.length > 1 ? 150 : 190}px "Plus Jakarta Sans", system-ui, sans-serif`;
    g.fillText(glyph, 256, 210);
    g.shadowBlur = 0; g.fillStyle = '#f4f0ea';
    const fs = name.length > 10 ? 52 : name.length > 7 ? 62 : 72;
    g.font = `700 ${fs}px "Plus Jakarta Sans", system-ui, sans-serif`;
    g.fillText(name, 256, 400);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x141113, roughness: 0.38, metalness: 0.35 });
  const cubes = [];
  const pickables = [];
  TOOLS.forEach(([name, accent, glyph, what], i) => {
    const [x, y, z, s] = SLOTS[i];
    const grp = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(s, s, s, 4, s * 0.12), bodyMat);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.86, s * 0.86), new THREE.MeshBasicMaterial({ map: faceTexture(name, accent, glyph), transparent: true, toneMapped: false }));
    face.position.z = s / 2 + 0.002;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s * 1.002, s * 1.002, s * 1.002)), new THREE.LineBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.35 }));
    grp.add(body, face, edges);
    grp.position.set(x, y, z);
    const base = { x, y, z, rx: (Math.random() - 0.5) * 0.5, ry: -x * 0.07 + (Math.random() - 0.5) * 0.35, rz: (Math.random() - 0.5) * 0.25 };
    grp.rotation.set(base.rx, base.ry, base.rz);
    grp.scale.setScalar(0.001);
    scene.add(grp);
    body.userData.i = i; face.userData.i = i;
    pickables.push(body, face);
    cubes.push({ grp, edges, base, seed: Math.random() * 10, hover: 0, name, what, accent });
  });

  // debris: small dark cubes with red edges
  const debris = [];
  for (let i = 0; i < (innerWidth < 900 ? 14 : 26); i++) {
    const s = 0.12 + Math.random() * 0.3;
    const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), bodyMat);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.5 }));
    m.add(e);
    // keep the debris out of a column around the figure so nothing ever floats in front of his face
    let x, z;
    do { const ang = Math.random() * Math.PI * 2, rad = 2.5 + Math.random() * 5; x = Math.cos(ang) * rad; z = -1.5 + Math.sin(ang) * 2.5; }
    while (Math.abs(x) < 2.4);
    m.position.set(x, 0.4 + Math.random() * 5, z);
    m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    m.scale.setScalar(0.001);
    scene.add(m); debris.push({ m, spin: (Math.random() - 0.5) * 0.6, y0: m.position.y, seed: Math.random() * 10 });
  }

  // embers
  const EM = 500, ePos = new Float32Array(EM * 3), eSeed = new Float32Array(EM);
  for (let i = 0; i < EM; i++) { ePos.set([(Math.random() - 0.5) * 16, Math.random() * 6, (Math.random() - 0.5) * 8 - 1], i * 3); eSeed[i] = Math.random(); }
  const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3)); eGeo.setAttribute('aSeed', new THREE.BufferAttribute(eSeed, 1));
  const eMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uMat: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aSeed; uniform float uTime, uPR; varying float vA;
      void main(){ vec3 p = position; p.y = mod(p.y + uTime * (0.08 + aSeed * 0.18), 6.0); p.x += sin(uTime * 0.5 + aSeed * 30.0) * 0.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.5 + aSeed * 3.0) * uPR * (6.0 / -mv.z); vA = (0.3 + 0.7 * aSeed) * smoothstep(0.0, 1.0, p.y) * smoothstep(6.0, 4.0, p.y); }`,
    fragmentShader: `uniform float uMat; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(1.0, 0.32, 0.18, smoothstep(0.5, 0.0, d) * vA * uMat); }`,
  });
  scene.add(new THREE.Points(eGeo, eMat));

  // ---------- state ----------
  let visible = false, raf = 0, last = performance.now(), time = 0, mat = RM ? 1 : 0, started = RM;
  const mouse = new THREE.Vector2(), mouseT = new THREE.Vector2();
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(9, 9);
  let hovered = -1;

  function progress() {
    const r = section.getBoundingClientRect();
    const span = section.offsetHeight - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 58 : 38;
    camera.updateProjectionMatrix();
  }

  function frame() {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    if (started && mat < 1) mat = Math.min(1, mat + dt / 1.6);
    const m = 1 - Math.pow(1 - mat, 3);
    const p = progress();

    // camera: dolly in with scroll, lean with the mouse
    mouse.lerp(mouseT, Math.min(1, dt * 4));
    const portrait = camera.aspect < 0.9;
    const camZ = (portrait ? 15.5 : 11.2) - p * 2.2;
    camera.position.set(mouse.x * 0.9, 2.3 + p * 0.3 - mouse.y * 0.35, camZ);
    camera.lookAt(0, 2.0, 0);

    floorMat.uniforms.uTime.value = time; floorMat.uniforms.uMat.value = m;
    figMat.uniforms.uMat.value = m; reflMat.uniforms.uMat.value = m;
    eMat.uniforms.uTime.value = time; eMat.uniforms.uMat.value = m;
    halo.material.opacity = 0.55 * m; halo2.material.opacity = 0.3 * m;
    halo.rotation.z += dt * 0.05; halo2.rotation.z -= dt * 0.03;
    redBack.intensity = (50 + Math.sin(time * 1.3) * 8) * m;

    // hover pick
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    const h = hit ? hit.object.userData.i : -1;
    if (h !== hovered) {
      hovered = h;
      canvas.style.cursor = h >= 0 ? 'pointer' : '';
      if (h >= 0) { tip.innerHTML = `<b style="color:${cubes[h].accent}">${cubes[h].name}</b><span>${cubes[h].what}</span>`; tip.classList.add('on'); }
      else tip.classList.remove('on');
    }

    cubes.forEach((c, i) => {
      // materialise together: one event, each cube travels its own little arc into place
      const k = Math.min(1, Math.max(0, m * 1.15 - (i % 4) * 0.04));
      const e = 1 - Math.pow(1 - k, 4);
      c.hover += ((i === hovered ? 1 : 0) - c.hover) * Math.min(1, dt * 8);
      const bob = RM ? 0 : Math.sin(time * 0.8 + c.seed) * 0.12;
      c.grp.position.set(c.base.x * (0.6 + 0.4 * e), c.base.y + bob + (1 - e) * -1.2 + c.hover * 0.15, c.base.z + c.hover * 0.6);
      c.grp.rotation.set(
        c.base.rx + (RM ? 0 : Math.sin(time * 0.35 + c.seed) * 0.12) + mouse.y * 0.15 + (1 - e) * 1.5,
        c.base.ry + (RM ? 0 : Math.cos(time * 0.3 + c.seed) * 0.15) + mouse.x * 0.3 - c.hover * c.base.ry * 0.8,
        c.base.rz * (1 - c.hover));
      c.grp.scale.setScalar(Math.max(0.001, e * (1 + c.hover * 0.12)));
      c.edges.material.opacity = 0.3 + c.hover * 0.6;
    });
    debris.forEach((d) => {
      d.m.rotation.x += dt * d.spin; d.m.rotation.y += dt * d.spin * 0.7;
      d.m.position.y = d.y0 + Math.sin(time * 0.6 + d.seed) * 0.15;
      d.m.scale.setScalar(Math.max(0.001, m));
    });

    renderer.render(scene, camera);
  }

  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { resize(); started = true; start(); }
  }, { threshold: 0.15 }).observe(section);
  addEventListener('resize', resize);
  section.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1, y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    mouseT.set(x, y); ndc.set(x, y);
    tip.style.transform = `translate(${e.clientX - r.left + 18}px, ${e.clientY - r.top + 18}px)`;
  });
  section.addEventListener('pointerleave', () => { mouseT.set(0, 0); ndc.set(9, 9); });
  resize();
}
