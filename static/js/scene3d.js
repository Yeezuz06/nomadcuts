// ============================================================
//  NomadCuts — Objetos 3D interactivos (Three.js)
//  · Tijeras: avanzan y cortan siguiendo el scroll
//  · Poste de barbería: gira con el scroll
//  Todo se construye con geometría (sin modelos externos) y solo se
//  renderiza mientras está en pantalla.
// ============================================================

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NC3D = (window.NC3D = window.NC3D || {});
NC3D.scissors = NC3D.scissors || 0;   // progreso de scroll 0..1 (lo escribe script.js)
NC3D.pole = NC3D.pole || 0;

const GOLD  = 0xc9a96a;
const STEEL = 0xdcd8d0;

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

// ── Escenario común ───────────────────────────────────────────
function createStage(container, { fov = 32, z = 9 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 0, z);

  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(3, 4, 6);
  const rim = new THREE.DirectionalLight(GOLD, 2.0);
  rim.position.set(-5, -2, -4);
  const fill = new THREE.HemisphereLight(0xfff6ea, 0x1c1a17, 0.9);
  scene.add(key, rim, fill);

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  return { renderer, scene, camera };
}

// ── Bucle que solo corre si el objeto está en pantalla ───────
function runWhenVisible(container, tick) {
  let visible = false, raf = 0, last = performance.now();
  const loop = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    tick(dt, now / 1000);
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); },
    { rootMargin: '120px' }).observe(container);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

// ── Tijeras ───────────────────────────────────────────────────
function buildScissors() {
  const steel = new THREE.MeshPhysicalMaterial({
    color: STEEL, metalness: 0.9, roughness: 0.24, envMapIntensity: 2.4,
    clearcoat: 0.6, clearcoatRoughness: 0.12,
  });
  const gold  = new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.26, clearcoat: 0.7, clearcoatRoughness: 0.2 });

  function half() {
    const g = new THREE.Group();

    // Hoja: filo recto abajo, lomo curvo arriba, punta afilada
    const shape = new THREE.Shape();
    shape.moveTo(-0.2, -0.05);
    shape.lineTo(3.05, -0.05);
    shape.quadraticCurveTo(3.45, -0.04, 3.6, 0.0);
    shape.quadraticCurveTo(2.7, 0.2, 1.1, 0.3);
    shape.quadraticCurveTo(0.25, 0.35, -0.2, 0.22);
    shape.closePath();
    const bladeGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 28,
    });
    bladeGeo.translate(0, 0, -0.025);
    g.add(new THREE.Mesh(bladeGeo, steel));

    // Brazo curvo hasta el aro, del lado OPUESTO a la hoja (como unas tijeras reales:
    // hoja de arriba ↔ aro de abajo, así al abrir se separan hojas y aros a la vez)
    const arm = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 0.0, 0),
      new THREE.Vector3(-0.7, -0.12, 0),
      new THREE.Vector3(-1.25, -0.4, 0),
      new THREE.Vector3(-1.55, -0.62, 0),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(arm, 48, 0.075, 16, false), gold));

    // Aro para el dedo
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.075, 20, 72), gold);
    ring.position.set(-1.95, -0.8, 0);
    g.add(ring);
    return g;
  }

  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.x = -0.6;            // centra el conjunto (aros a la izquierda, puntas a la derecha)

  const a = new THREE.Group();
  a.add(half());
  a.position.z = -0.05;

  const b = new THREE.Group();
  const bHalf = half();
  bHalf.scale.y = -1;                 // espejo: la otra mitad de la tijera
  b.add(bHalf);
  b.position.z = 0.05;

  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.24, 32), gold);
  screw.rotation.x = Math.PI / 2;

  inner.add(a, b, screw);
  root.add(inner);
  root.scale.setScalar(0.92);
  return { root, a, b };
}

function initScissors(container) {
  const { renderer, scene, camera } = createStage(container, { fov: 30, z: 10 });
  const { root, a, b } = buildScissors();
  scene.add(root);

  const CUTS = 3;          // cortes completos mientras la sección cruza la pantalla
  const OPEN_MAX = 0.46;   // apertura máxima (rad) en cada mitad
  let p = 0;               // progreso suavizado 0..1

  runWhenVisible(container, (dt, t) => {
    // Suavizado tipo resorte: el movimiento sigue al scroll sin saltos
    p += (NC3D.scissors - p) * Math.min(1, dt * 5);

    // Ciclo de corte: abre rápido, cierra con decisión (como un corte real)
    const phase = (p * CUTS) % 1;
    const cut = phase < 0.55
      ? Math.sin((phase / 0.55) * Math.PI / 2)                 // abriendo
      : Math.cos(((phase - 0.55) / 0.45) * Math.PI / 2) ** 2;  // cerrando
    const open = 0.03 + OPEN_MAX * cut;
    a.rotation.z = open;
    b.rotation.z = -open;

    // Avanza en diagonal hacia donde apuntan las puntas, sin girar de canto
    root.rotation.z = 0.18 - 0.1 * p;
    root.rotation.y = -0.28 + 0.2 * Math.sin(p * Math.PI);
    root.rotation.x = 0.12;
    root.position.x = -0.6 + 1.2 * p;
    root.position.y = -0.25 + 0.5 * p + (REDUCED ? 0 : Math.sin(t * 0.8) * 0.05);

    // En pantallas angostas la cámara se aleja para que entren completas
    camera.position.z = container.clientWidth < 520 ? 13.5 : 11;

    renderer.render(scene, camera);
  });
  container.classList.add('is-ready');
}

// ── Poste de barbería ─────────────────────────────────────────
function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#EEE9E0';
  ctx.fillRect(0, 0, 256, 256);
  const bands = ['#C9A96A', '#EEE9E0', '#1C1A17', '#EEE9E0'];
  ctx.save();
  ctx.translate(128, 128);
  ctx.rotate(-Math.PI / 4);
  for (let i = -8; i < 8; i++) {
    ctx.fillStyle = bands[(i + 8) % bands.length];
    ctx.fillRect(-400, i * 45.25, 800, 45.25);   // 45.25 = 256·√2/8 → patrón continuo
  }
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2.4);
  tex.anisotropy = 4;
  return tex;
}

function buildPole() {
  const gold  = new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.25, clearcoat: 0.8 });
  const tex = stripeTexture();
  const stripes = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.05 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.16,
    clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6, depthWrite: false,
  });

  const root = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 3, 64, 1, true), stripes);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 3.04, 64, 1, true), glass);

  const capGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.22, 64);
  const capTop = new THREE.Mesh(capGeo, gold); capTop.position.y = 1.62;
  const capBot = new THREE.Mesh(capGeo, gold); capBot.position.y = -1.62;
  const ringGeo = new THREE.TorusGeometry(0.62, 0.035, 12, 64);
  const ringTop = new THREE.Mesh(ringGeo, gold); ringTop.rotation.x = Math.PI / 2; ringTop.position.y = 1.5;
  const ringBot = ringTop.clone(); ringBot.position.y = -1.5;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), gold);
  dome.position.y = 1.73;
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), gold);
  finial.position.y = 2.34;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.2, 24), gold);
  stem.position.y = 2.17;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.35, 48), gold);
  base.position.y = -1.9;

  root.add(core, shell, capTop, capBot, ringTop, ringBot, dome, stem, finial, base);
  root.scale.setScalar(0.95);
  return { root, tex };
}

function initPole(container) {
  const { renderer, scene, camera } = createStage(container, { fov: 30, z: 11 });
  const { root, tex } = buildPole();
  scene.add(root);

  let p = 0;
  runWhenVisible(container, (dt, t) => {
    p += (NC3D.pole - p) * Math.min(1, dt * 5);
    // Las franjas suben como en un poste real
    if (!REDUCED) tex.offset.y -= dt * 0.16;
    root.rotation.y = p * Math.PI * 1.5;
    root.rotation.z = 0.06;
    root.position.y = REDUCED ? 0 : Math.sin(t * 1.1) * 0.05;
    renderer.render(scene, camera);
  });
  container.classList.add('is-ready');
}

// ── Arranque perezoso: solo cuando el objeto se acerca a la pantalla ──
function lazyInit(id, init) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!webglOK()) { el.classList.add('is-fallback'); return; }
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    try { init(el); } catch (e) { el.classList.add('is-fallback'); console.warn('3D no disponible:', e); }
  }, { rootMargin: '400px' });
  io.observe(el);
}

lazyInit('scissors-3d', initScissors);
lazyInit('pole-3d', initPole);
