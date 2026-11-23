/**
 * qahwa-world.js — the 3D majlis corner for Saudi Coffee's "How it's made".
 *
 * A Sadu rug by a mud wall, a fire pit with live coals, and everything the coffee needs: the mihmas (roasting pan)
 * with beans that turn from green to golden, the brass najr and its pestle, the dallah, the finjan, dates, and five
 * small bowls (cardamom, cloves, saffron, sugar, milk). Each brewing step happens on these things: hold to roast and
 * the beans stir and color, tap the najr and the pestle strikes, the dallah boils and steams, tap the bowls to pick
 * the spices, hold to pour and the dallah tilts over the finjan.
 *
 * Everything is drawn here (no models to download). Units are meters; the fire pit is at the origin.
 *
 *   const w = createWorld(el, { onTap })     onTap('najr') or onTap('spice:cardamom')
 *   w.setStep(key, act)                      roast | najr | boil | coffee | brew | spices | settle | pour | done
 *   w.roast(r) w.stir(on) w.strike(n) w.spoon(n) w.timed(k) w.spices(picked, wrongKey) w.pour(l) w.pouring(on)
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ─────────────────────────────────────────────────────────────
// textures, drawn on canvases
// ─────────────────────────────────────────────────────────────
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// a Sadu rug: bands of red, black and cream with the triangles and diamonds of the Bedouin weave
function saduTexture() {
  const c = canvas(512, 1024), g = c.getContext('2d'), R = rng(7);
  const red = '#9E2B25', deep = '#5E1A17', black = '#1E1714', cream = '#EADBC0', ochre = '#C98A3A', white = '#F4EBDD';
  g.fillStyle = red; g.fillRect(0, 0, 512, 1024);
  let y = 0;
  const band = (h, f) => { f(y, h); y += h; };
  const stripes = (y0, h, cols) => { const s = h / cols.length; cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, y0 + i * s, 512, s + 0.5); }); };
  const tri = (y0, h, a, b, n) => { g.fillStyle = a; g.fillRect(0, y0, 512, h); g.fillStyle = b; const w = 512 / n; for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(i * w, y0 + h); g.lineTo(i * w + w / 2, y0); g.lineTo(i * w + w, y0 + h); g.fill(); } };
  const diam = (y0, h, a, b, c2, n) => { g.fillStyle = a; g.fillRect(0, y0, 512, h); const w = 512 / n; for (let i = 0; i < n; i++) { const cx = i * w + w / 2, cy = y0 + h / 2; g.fillStyle = b; g.beginPath(); g.moveTo(cx, y0 + 4); g.lineTo(cx + w / 2 - 4, cy); g.lineTo(cx, y0 + h - 4); g.lineTo(cx - w / 2 + 4, cy); g.fill(); g.fillStyle = c2; g.beginPath(); g.moveTo(cx, cy - h * 0.18); g.lineTo(cx + w * 0.16, cy); g.lineTo(cx, cy + h * 0.18); g.lineTo(cx - w * 0.16, cy); g.fill(); } };
  for (let rep = 0; rep < 2; rep++) {
    band(40, (y0, h) => stripes(y0, h, [black, cream, black, red]));
    band(70, (y0, h) => tri(y0, h, black, cream, 8));
    band(26, (y0, h) => stripes(y0, h, [ochre, red, ochre]));
    band(120, (y0, h) => diam(y0, h, deep, white, red, 5));
    band(26, (y0, h) => stripes(y0, h, [ochre, red, ochre]));
    band(70, (y0, h) => { tri(y0, h, cream, black, 8); });
    band(60, (y0, h) => stripes(y0, h, [red, black, red, white, red]));
    band(100, (y0, h) => diam(y0, h, black, red, cream, 4));
  }
  // wool: a little grain
  const img = g.getImageData(0, 0, 512, 1024), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// mud plaster, warm and uneven
function mudTexture() {
  const c = canvas(512), g = c.getContext('2d'), R = rng(3);
  g.fillStyle = '#9A6E4A'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) { const x = R() * 512, y = R() * 512, r = 4 + R() * 26; g.fillStyle = `rgba(${R() < 0.5 ? '70,44,26' : '196,150,108'},${0.04 + R() * 0.06})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  for (let i = 0; i < 90; i++) { g.strokeStyle = 'rgba(60,36,20,0.18)'; g.lineWidth = 1; g.beginPath(); let x = R() * 512, y = R() * 512; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (R() - 0.5) * 30; y += R() * 14; g.lineTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// a soft round glow (for coals, steam and smoke)
function blobTexture() {
  const c = canvas(64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ─────────────────────────────────────────────────────────────
// shapes
// ─────────────────────────────────────────────────────────────
const V2 = (x, y) => new THREE.Vector2(x, y);
function lathe(pts, mat, seg = 48) { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map((p) => V2(p[0], p[1])), seg), mat); m.castShadow = true; m.receiveShadow = true; return m; }
function tube(points, r, mat, seg = 40) { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), seg, r, 12, false), mat); m.castShadow = true; return m; }

// the dallah: the Najdi profile (wide base, narrow waist, round body, tall neck, a crown lid), the beak spout, the handle
function makeDallah(brass, dark) {
  const g = new THREE.Group();
  const body = lathe([[0, 0], [0.062, 0], [0.066, 0.006], [0.058, 0.016], [0.044, 0.03], [0.04, 0.042], [0.05, 0.06], [0.06, 0.085], [0.058, 0.11], [0.046, 0.128], [0.03, 0.14], [0.026, 0.15], [0.027, 0.17], [0.031, 0.185], [0.033, 0.19], [0.0, 0.19]], brass);
  g.add(body);
  const lid = lathe([[0, 0.19], [0.034, 0.19], [0.036, 0.196], [0.028, 0.205], [0.016, 0.222], [0.02, 0.232], [0.012, 0.242], [0.006, 0.258], [0.0, 0.262]], brass);
  g.add(lid);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 12), brass); fin.position.y = 0.262; g.add(fin);
  // rings of darker metal, as on the real thing
  [0.03, 0.128, 0.19].forEach((y) => { const r = new THREE.Mesh(new THREE.TorusGeometry(y === 0.03 ? 0.044 : y === 0.128 ? 0.046 : 0.034, 0.0022, 8, 48), dark); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); });
  // the spout: from the lower body up and out, curving like a beak
  const spout = tube([[-0.045, 0.07, 0], [-0.07, 0.1, 0], [-0.088, 0.14, 0], [-0.1, 0.175, 0], [-0.118, 0.198, 0]], 0.0075, brass);
  g.add(spout);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.026, 16, 1, true), brass); tip.position.set(-0.126, 0.206, 0); tip.rotation.z = Math.PI / 2 + 0.75; g.add(tip);
  // the handle
  const handle = tube([[0.03, 0.172, 0], [0.068, 0.182, 0], [0.084, 0.15, 0], [0.078, 0.1, 0], [0.058, 0.062, 0]], 0.0055, brass);
  g.add(handle);
  g.userData.spoutTip = new THREE.Vector3(-0.134, 0.214, 0);
  return g;
}

// the finjan: small, handleless, white with a gold rim; the coffee inside rises as it is poured
function makeFinjan(porcelain, gold, coffee) {
  const g = new THREE.Group();
  const cup = lathe([[0, 0], [0.018, 0], [0.02, 0.003], [0.024, 0.018], [0.03, 0.042], [0.0315, 0.046], [0.0295, 0.046], [0.0278, 0.042], [0.022, 0.019], [0.0, 0.006]], porcelain);
  g.add(cup);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0305, 0.0012, 8, 48), gold); rim.rotation.x = Math.PI / 2; rim.position.y = 0.046; g.add(rim);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0248, 0.0243, 0.003, 40, 1, true), gold); band.position.y = 0.02; g.add(band);
  const fill = new THREE.Mesh(new THREE.CircleGeometry(1, 40), coffee); fill.rotation.x = -Math.PI / 2; fill.visible = false; g.add(fill);
  // the quarter line, a thin gold ring inside the cup
  const line = new THREE.Mesh(new THREE.TorusGeometry(0.0238, 0.0007, 6, 48), new THREE.MeshBasicMaterial({ color: 0xFFD27A })); line.rotation.x = Math.PI / 2; line.position.y = 0.0215; g.add(line);
  g.userData.fill = fill; g.userData.line = line;
  // the inside wall at height h (for the coffee's surface)
  g.userData.radiusAt = (h) => h < 0.019 ? 0.0 + (h - 0.006) / 0.013 * 0.022 : 0.022 + (h - 0.019) / 0.023 * 0.0058;
  return g;
}

// ─────────────────────────────────────────────────────────────
// the world
// ─────────────────────────────────────────────────────────────
const BEAN_STOPS = [[0, [141, 158, 90]], [0.28, [184, 170, 98]], [0.5, [201, 161, 90]], [0.64, [168, 122, 69]], [0.82, [110, 69, 38]], [1, [58, 36, 22]]];
function beanRGB(r) {
  for (let i = 1; i < BEAN_STOPS.length; i++) if (r <= BEAN_STOPS[i][0]) { const a = BEAN_STOPS[i - 1], b = BEAN_STOPS[i], k = (r - a[0]) / (b[0] - a[0]); return a[1].map((v, j) => (v + (b[1][j] - v) * k) / 255); }
  return [58 / 255, 36 / 255, 22 / 255];
}

// where the camera looks for each step: [camera position, target]
const VIEWS = {
  roast: [[0.0, 0.42, 0.52], [0.0, 0.12, 0.0]],
  najr: [[0.42, 0.36, 0.52], [0.3, 0.15, 0.03]],
  boil: [[0.02, 0.36, 0.5], [0.0, 0.16, 0.0]],
  coffee: [[0.12, 0.38, 0.5], [0.04, 0.16, 0.02]],
  brew: [[-0.04, 0.33, 0.48], [0.0, 0.15, 0.0]],
  spices: [[-0.26, 0.42, 0.46], [-0.26, 0.04, 0.1]],
  settle: [[0.12, 0.33, 0.52], [0.16, 0.12, 0.06]],
  pour: [[-0.02, 0.3, 0.42], [0.06, 0.12, 0.16]],
  done: [[0.0, 0.4, 0.62], [0.04, 0.1, 0.08]]
};
const SPICE_KEYS = ['cardamom', 'cloves', 'saffron', 'sugar', 'milk'];
let aspect = 0.6;
const ZOOM = () => aspect < 0.8 ? 1.75 : aspect < 1.3 ? 1.45 : 1.25;     // a tall phone screen needs the camera further back

export function createWorld(el, opts = {}) {
  const onTap = opts.onTap || (() => {});
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;display:block';

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x140b07, 1.4, 3.2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 10);

  // light: the fire is the main light, a warm lamp from above, a little cool fill from the night outside
  const hemi = new THREE.HemisphereLight(0xffe2bf, 0x2a160c, 0.5); scene.add(hemi);
  const lamp = new THREE.DirectionalLight(0xffd7a8, 1.6); lamp.position.set(0.6, 1.4, 0.8); lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024); Object.assign(lamp.shadow.camera, { left: -0.7, right: 0.7, top: 0.7, bottom: -0.7, near: 0.2, far: 4 }); lamp.shadow.bias = -0.0008; scene.add(lamp);
  const fireLight = new THREE.PointLight(0xff8a3a, 1.6, 1.4, 1.6); fireLight.position.set(0, 0.11, 0); scene.add(fireLight);

  // materials
  const M = {
    brass: new THREE.MeshStandardMaterial({ color: 0xD4A44C, metalness: 0.95, roughness: 0.28 }),
    brassDark: new THREE.MeshStandardMaterial({ color: 0x8C6326, metalness: 0.9, roughness: 0.4 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x2C2622, metalness: 0.75, roughness: 0.55 }),
    clay: new THREE.MeshStandardMaterial({ color: 0x6B4128, roughness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x5A3820, roughness: 0.7 }),
    porcelain: new THREE.MeshPhysicalMaterial({ color: 0xF8F4EC, roughness: 0.18, clearcoat: 0.6 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xE0B35A, metalness: 1, roughness: 0.25 }),
    coffee: new THREE.MeshStandardMaterial({ color: 0xB8862F, roughness: 0.15, metalness: 0.05 }),
    bean: new THREE.MeshStandardMaterial({ color: 0x8D9E5A, roughness: 0.55 }),
    date: new THREE.MeshStandardMaterial({ color: 0x4A2210, roughness: 0.35 }),
    bowl: new THREE.MeshStandardMaterial({ color: 0xC8B79A, roughness: 0.6 })
  };

  // the room: rug, floor, a mud wall with a niche
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshStandardMaterial({ color: 0x3A2416, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.002; floor.receiveShadow = true; scene.add(floor);
  const rugTex = saduTexture();
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.0), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.95 }));
  rug.rotation.x = -Math.PI / 2; rug.rotation.z = Math.PI / 2; rug.receiveShadow = true; scene.add(rug);
  const mud = mudTexture(); mud.repeat.set(3, 1.2);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.6), new THREE.MeshStandardMaterial({ map: mud, roughness: 1 }));
  wall.position.set(0, 0.8, -0.55); wall.receiveShadow = true; scene.add(wall);
  const niche = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.32), new THREE.MeshStandardMaterial({ color: 0x3E2615, roughness: 1 }));
  niche.position.set(-0.5, 0.55, -0.548); scene.add(niche);
  // a cushion along the wall
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.2), new THREE.MeshStandardMaterial({ color: 0x7A1E1A, roughness: 0.9 }));
  cushion.position.set(0, 0.06, -0.44); cushion.castShadow = cushion.receiveShadow = true; scene.add(cushion);

  // the fire pit (wjar): a clay box with a brass rim and coals
  const pit = new THREE.Group(); scene.add(pit);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.2), M.clay); box.position.y = 0.035; box.castShadow = box.receiveShadow = true; pit.add(box);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.22), M.brassDark); rim.position.y = 0.072; pit.add(rim);
  const hole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.014, 0.16), new THREE.MeshStandardMaterial({ color: 0x120a06, roughness: 1 })); hole.position.y = 0.073; pit.add(hole);
  const coalMat = new THREE.MeshStandardMaterial({ color: 0x2a1208, emissive: 0xff5a1a, emissiveIntensity: 1.4, roughness: 0.9 });
  const coals = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.014, 0), coalMat, 22);
  { const R = rng(11), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    for (let i = 0; i < 22; i++) { q.setFromEuler(new THREE.Euler(R() * 3, R() * 3, R() * 3)); s.setScalar(0.7 + R() * 0.7); m.compose(new THREE.Vector3((R() - 0.5) * 0.13, 0.082 + R() * 0.008, (R() - 0.5) * 0.13), q, s); coals.setMatrixAt(i, m); } }
  pit.add(coals);
  // a grate over the coals
  for (let i = -2; i <= 2; i++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.2, 8), M.iron); bar.rotation.z = Math.PI / 2; bar.position.set(0, 0.09, i * 0.035); pit.add(bar); }

  // the mihmas: a shallow iron pan with a long handle, and its stirrer; beans inside
  const mihmas = new THREE.Group(); scene.add(mihmas);
  const pan = lathe([[0, 0], [0.06, 0], [0.072, 0.012], [0.075, 0.02], [0.072, 0.02], [0.068, 0.013], [0.057, 0.004], [0, 0.004]], M.iron); mihmas.add(pan);
  const panHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.34, 10), M.iron); panHandle.rotation.z = Math.PI / 2; panHandle.position.set(0.24, 0.022, 0); mihmas.add(panHandle);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.08, 12), M.wood); grip.rotation.z = Math.PI / 2; grip.position.set(0.38, 0.022, 0); mihmas.add(grip);
  const BEANS = 70;
  const beans = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0065, 10, 8).scale(1, 0.62, 0.78), M.bean, BEANS); beans.castShadow = true; mihmas.add(beans);
  const beanSeed = [];
  { const R = rng(5); for (let i = 0; i < BEANS; i++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.052; beanSeed.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: 0.008 + R() * 0.006, rx: R() * 3, ry: R() * 3, ph: R() * 6 }); } }
  const stirrer = new THREE.Group(); mihmas.add(stirrer);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.16, 8), M.iron); rod.position.set(0.035, 0.07, 0.02); rod.rotation.z = -0.55; rod.rotation.x = 0.3; stirrer.add(rod);
  const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.003, 0.018), M.iron); paddle.position.set(0.0, 0.012, 0); stirrer.add(paddle);
  const smoke = [];

  // the najr: a brass mortar and its long pestle
  const najr = new THREE.Group(); najr.position.set(0.3, 0, 0.02); scene.add(najr);
  const mortar = lathe([[0, 0], [0.05, 0], [0.052, 0.008], [0.04, 0.02], [0.036, 0.05], [0.04, 0.09], [0.046, 0.1], [0.04, 0.1], [0.032, 0.09], [0.0, 0.04]], M.brass); najr.add(mortar);
  [0.02, 0.09].forEach((y) => { const r = new THREE.Mesh(new THREE.TorusGeometry(y < 0.05 ? 0.041 : 0.044, 0.0022, 8, 40), M.brassDark); r.rotation.x = Math.PI / 2; r.position.y = y; najr.add(r); });
  const pestle = new THREE.Group(); najr.add(pestle);
  const pestleRod = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.3, 16), M.brass); pestleRod.position.y = 0.15; pestleRod.castShadow = true; pestle.add(pestleRod);
  const pestleKnob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), M.brass); pestleKnob.position.y = 0.3; pestle.add(pestleKnob);
  pestle.position.y = 0.07; pestle.rotation.z = -0.12;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.003, 8, 48), new THREE.MeshBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0, depthWrite: false })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.1; najr.add(ring);
  const najrHit = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.42, 12), new THREE.MeshBasicMaterial({ visible: false })); najrHit.position.y = 0.18; najrHit.userData.tap = 'najr'; najr.add(najrHit);

  // the dallah
  const dallah = makeDallah(M.brass, M.brassDark); scene.add(dallah);
  // the finjan on a small tray, with dates
  const tray = lathe([[0, 0], [0.11, 0], [0.12, 0.008], [0.116, 0.01], [0.105, 0.004], [0, 0.004]], M.brassDark); tray.position.set(0.12, 0, 0.17); scene.add(tray);
  const finjan = makeFinjan(M.porcelain, M.gold, M.coffee); finjan.position.set(0.09, 0.004, 0.18); scene.add(finjan);
  const finjan2 = makeFinjan(M.porcelain, M.gold, M.coffee); finjan2.position.set(0.16, 0.004, 0.13); finjan2.userData.line.visible = false; scene.add(finjan2);
  const plate = lathe([[0, 0], [0.05, 0], [0.058, 0.01], [0.054, 0.011], [0.046, 0.004], [0, 0.003]], M.porcelain); plate.position.set(0.2, 0.004, 0.22); scene.add(plate);
  { const R = rng(9); for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 10).scale(1, 0.75, 1.9), M.date); const a = i / 6 * Math.PI * 2; d.position.set(0.2 + Math.cos(a) * 0.022, 0.014, 0.22 + Math.sin(a) * 0.022); d.rotation.y = a + R(); d.castShadow = true; scene.add(d); } }
  // the pour: a stream from the spout down into the finjan
  const streamMat = new THREE.MeshStandardMaterial({ color: 0xC08F3A, roughness: 0.2, transparent: true, opacity: 0.92 });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0028, 1, 10, 1, true), streamMat); stream.visible = false; scene.add(stream);

  // the spice bowls in a row
  const spiceRow = new THREE.Group(); spiceRow.position.set(-0.26, 0, 0.12); scene.add(spiceRow);
  const bowls = {};
  SPICE_KEYS.forEach((k, i) => {
    const b = new THREE.Group(); b.position.set((i - 2) * 0.085, 0, (i % 2) * 0.025); spiceRow.add(b);
    const bowl = lathe([[0, 0], [0.026, 0], [0.034, 0.012], [0.038, 0.024], [0.035, 0.024], [0.031, 0.013], [0.024, 0.005], [0, 0.005]], k === 'milk' ? M.porcelain : M.bowl); b.add(bowl);
    const R = rng(20 + i), fill = new THREE.Group(); fill.position.y = 0.012; b.add(fill);
    if (k === 'cardamom') { const pod = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0055, 10, 8).scale(1, 0.8, 1.5), new THREE.MeshStandardMaterial({ color: 0x8DA65A, roughness: 0.6 }), 18); const m = new THREE.Matrix4(); for (let j = 0; j < 18; j++) { const a = R() * 7, r = Math.sqrt(R()) * 0.024; m.compose(new THREE.Vector3(Math.cos(a) * r, R() * 0.008, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(R(), R() * 6, R())), new THREE.Vector3(1, 1, 1)); pod.setMatrixAt(j, m); } fill.add(pod); }
    if (k === 'cloves') { const cl = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0016, 0.001, 0.014, 6), new THREE.MeshStandardMaterial({ color: 0x3A1E12, roughness: 0.7 }), 30); const m = new THREE.Matrix4(); for (let j = 0; j < 30; j++) { const a = R() * 7, r = Math.sqrt(R()) * 0.024; m.compose(new THREE.Vector3(Math.cos(a) * r, R() * 0.006, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + R(), R() * 6, 0)), new THREE.Vector3(1, 1, 1)); cl.setMatrixAt(j, m); } fill.add(cl); }
    if (k === 'saffron') { const sf = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.02, 4), new THREE.MeshStandardMaterial({ color: 0xC4241A, emissive: 0x400800, roughness: 0.5 }), 40); const m = new THREE.Matrix4(); for (let j = 0; j < 40; j++) { const a = R() * 7, r = Math.sqrt(R()) * 0.022; m.compose(new THREE.Vector3(Math.cos(a) * r, R() * 0.004, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, R() * 6, R())), new THREE.Vector3(1, 1, 1)); sf.setMatrixAt(j, m); } fill.add(sf); }
    if (k === 'sugar') { const su = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.008, 0.008), new THREE.MeshStandardMaterial({ color: 0xFAF7F0, roughness: 0.4 }), 12); const m = new THREE.Matrix4(); for (let j = 0; j < 12; j++) { const a = R() * 7, r = Math.sqrt(R()) * 0.02; m.compose(new THREE.Vector3(Math.cos(a) * r, R() * 0.008, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(R(), R(), R())), new THREE.Vector3(1, 1, 1)); su.setMatrixAt(j, m); } fill.add(su); }
    if (k === 'milk') { const mk = new THREE.Mesh(new THREE.CircleGeometry(0.031, 32), new THREE.MeshStandardMaterial({ color: 0xFBF8F2, roughness: 0.25 })); mk.rotation.x = -Math.PI / 2; mk.position.y = 0.004; fill.add(mk); }
    const glow = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.0025, 8, 48), new THREE.MeshBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0 })); glow.rotation.x = Math.PI / 2; glow.position.y = 0.002; b.add(glow);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.06, 12), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.02; hit.userData.tap = 'spice:' + k; b.add(hit);
    bowls[k] = { g: b, glow, on: false, shake: 0, lift: 0 };
  });

  // steam and smoke: soft sprites that rise, spread and fade
  const blob = blobTexture();
  const puffs = [];
  function puff(pos, kind) {
    const mat = new THREE.SpriteMaterial({ map: blob, color: kind === 'smoke' ? 0x9a8f86 : 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    const s = new THREE.Sprite(mat); s.position.copy(pos); s.scale.setScalar(0.02); scene.add(s);
    puffs.push({ s, life: 0, max: kind === 'smoke' ? 2.2 : 1.6, vx: (Math.random() - 0.5) * 0.02, vz: (Math.random() - 0.5) * 0.02, kind });
  }

  // ── state ──
  const st = { key: 'roast', r: 0, stirring: false, strikeT: 9, ringT: 9, spoonT: 9, spoons: 0, heat: 1, steam: 0, picked: {}, l: 0, pouring: false, tilt: 0 };
  const cam = { pos: new THREE.Vector3(...VIEWS.roast[0]), target: new THREE.Vector3(...VIEWS.roast[1]), toPos: new THREE.Vector3(...VIEWS.roast[0]), toTarget: new THREE.Vector3(...VIEWS.roast[1]), yaw: 0, yawTo: 0 };
  // where the dallah stands: on the fire, beside it, or in the hand over the finjan
  const DALLAH_AT = { fire: [0, 0.096, 0, 0], side: [0.17, 0, 0.02, 0.4], hand: [0.13, 0.11, 0.18, 0], shelf: [-0.08, 0, -0.18, 0.8] };
  const dPos = new THREE.Vector3(...DALLAH_AT.shelf.slice(0, 3)), dTo = dPos.clone(); let dRot = DALLAH_AT.shelf[3], dRotTo = dRot;
  const mPos = new THREE.Vector3(0, 0.096, 0), mTo = mPos.clone();

  function aim(key) { const v = VIEWS[key] || VIEWS.done; cam.toTarget.set(...v[1]); cam.toPos.set(...v[0]).sub(cam.toTarget).multiplyScalar(ZOOM()).add(cam.toTarget); }
  function setStep(key, act = {}) {
    st.key = key; st.l = act.l || 0; st.pouring = false; st.r = act.r != null ? act.r : st.r;
      aim(key); cam.yawTo = 0;
    const at = (k) => { const a = DALLAH_AT[k]; dTo.set(a[0], a[1], a[2]); dRotTo = a[3]; };
    // the mihmas sits on the fire only while roasting; after that it rests at the back
    if (key === 'roast') mTo.set(0, 0.096, 0); else mTo.set(-0.36, 0, -0.26);
    if (key === 'roast' || key === 'najr' || key === 'spices') at('shelf');
    if (key === 'boil' || key === 'coffee' || key === 'brew') at('fire');
    if (key === 'settle') at('side');
    if (key === 'pour') at('hand');
    if (key === 'done') at('side');
    st.heat = key === 'brew' ? 0.45 : (key === 'settle' || key === 'pour' || key === 'done' || key === 'spices') ? 0.7 : 1;
    st.steam = key === 'brew' ? 0.6 : key === 'coffee' ? 0.5 : 0;
    if (key === 'spices') { st.picked = Object.assign({}, act.picked || {}); }
    if (key === 'done') st.l = 0.28;
    if (key === 'coffee') st.spoons = act.taps || 0;
  }
  setStep('roast');

  // ── taps on things ──
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, yaw: cam.yaw, t: performance.now() }; });
  renderer.domElement.addEventListener('pointermove', (e) => { if (down && e.buttons) { cam.yawTo = THREE.MathUtils.clamp(down.yaw - (e.clientX - down.x) * 0.005, -0.7, 0.7); } });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if (moved > 8) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(scene.children, true);
    const h = hits.find((x) => x.object.userData.tap);
    if (h) onTap(h.object.userData.tap);
  });
  // let go: the view drifts back to the step's angle
  addEventListener('pointerup', () => { setTimeout(() => { if (!down) cam.yawTo = 0; }, 1600); });

  // ── size ──
  function resize() {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; aspect = w / h;
    camera.fov = w / h < 0.9 ? 44 : 36; camera.updateProjectionMatrix();
    aim(st.key);
  }
  const ro = new ResizeObserver(resize); ro.observe(el); resize();

  // ── each frame ──
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  let last = performance.now(), t = 0, running = true, steamAcc = 0, smokeAcc = 0;
  function frame(now) {
    if (!running) return;
    if (!renderer.domElement.isConnected) { dispose(); return; }
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    const ease = (a, b, k) => a + (b - a) * (1 - Math.exp(-k * dt));
    // camera
    cam.pos.lerp(cam.toPos, 1 - Math.exp(-3 * dt)); cam.target.lerp(cam.toTarget, 1 - Math.exp(-3 * dt)); cam.yaw = ease(cam.yaw, cam.yawTo, 6);
    v3.copy(cam.pos).sub(cam.target); v3.applyAxisAngle(new THREE.Vector3(0, 1, 0), cam.yaw);
    camera.position.copy(cam.target).add(v3); camera.lookAt(cam.target);
    // fire: coals breathe, the light flickers
    const fl = still ? 1 : 0.85 + Math.sin(t * 13) * 0.06 + Math.sin(t * 7.3) * 0.08 + Math.random() * 0.04;
    fireLight.intensity = 1.6 * st.heat * fl + 0.2; coalMat.emissiveIntensity = 0.6 + 1.0 * st.heat * fl;
    // mihmas and beans
    mPos.lerp(mTo, 1 - Math.exp(-4 * dt)); mihmas.position.copy(mPos);
    const [br, bg, bb] = beanRGB(st.r); M.bean.color.setRGB(br, bg, bb, THREE.SRGBColorSpace);
    for (let i = 0; i < BEANS; i++) {
      const b = beanSeed[i], s = st.stirring && !still ? Math.sin(t * 9 + b.ph) * 0.006 : 0, s2 = st.stirring && !still ? Math.cos(t * 7 + b.ph) * 0.006 : 0;
      e3.set(b.rx + (st.stirring ? t * 3 : 0), b.ry, 0); q.setFromEuler(e3);
      m4.compose(v3.set(b.x + s, b.y + (st.stirring ? Math.abs(s) * 0.6 : 0), b.z + s2), q, one); beans.setMatrixAt(i, m4);
    }
    beans.instanceMatrix.needsUpdate = true;
    stirrer.position.set(st.stirring && !still ? Math.sin(t * 6) * 0.03 : 0.02, 0, st.stirring && !still ? Math.cos(t * 6) * 0.03 : 0.01);
    if (st.key === 'roast' && st.r > 0.22) { smokeAcc += dt * (0.6 + st.r * 4) * (st.stirring ? 2 : 0.6); while (smokeAcc > 1) { smokeAcc -= 1; puff(v3.set(mPos.x + (Math.random() - 0.5) * 0.06, mPos.y + 0.03, mPos.z + (Math.random() - 0.5) * 0.06).clone(), 'smoke'); } }
    // najr: the pestle drops and springs back; the ring spreads
    st.strikeT += dt; st.ringT += dt;
    const k = st.strikeT < 0.08 ? st.strikeT / 0.08 : Math.max(0, 1 - (st.strikeT - 0.08) / 0.22);
    pestle.position.y = 0.07 + 0.06 * (1 - k) - 0.02 * k; pestle.rotation.z = -0.12 + 0.06 * (1 - k);
    ring.material.opacity = Math.max(0, 0.9 - st.ringT * 1.8); ring.scale.setScalar(1 + st.ringT * 2.5);
    // the dallah moves where the step needs it, tilts to pour
    dPos.lerp(dTo, 1 - Math.exp(-4 * dt)); dRot = ease(dRot, dRotTo, 4);
    st.tilt = ease(st.tilt, st.pouring ? 1 : 0, 6);
    dallah.position.copy(dPos); dallah.rotation.set(0, dRot + (st.key === 'pour' ? -Math.PI * 0.82 : 0), 0);
    if (st.key === 'pour') { dallah.rotateZ(-st.tilt * 0.95); }
    // spoon of coffee: a little puff when a spoon goes in
    st.spoonT += dt;
    // steam from the dallah
    const steamy = st.steam + (st.key === 'boil' && st.boilK > 0.6 ? (st.boilK - 0.6) * 2 : 0) + (st.spoonT < 0.6 ? 0.8 : 0);
    if (steamy > 0 && !still) { steamAcc += dt * steamy * 5; while (steamAcc > 1) { steamAcc -= 1; puff(v3.set(dPos.x + 0.004, dPos.y + 0.27, dPos.z).clone(), 'steam'); } }
    // finjan: the coffee rises
    const h = 0.006 + Math.min(st.l, 1) * 0.04, fill = finjan.userData.fill;
    fill.visible = st.l > 0.01; fill.position.y = h; fill.scale.setScalar(Math.max(0.001, finjan.userData.radiusAt(h) * 0.98));
    // the stream from the spout tip to the coffee surface
    if (st.key === 'pour' && st.tilt > 0.55) {
      dallah.updateMatrixWorld(); const tip = dallah.userData.spoutTip.clone().applyMatrix4(dallah.matrixWorld);
      const end = new THREE.Vector3(finjan.position.x, finjan.position.y + h, finjan.position.z);
      const len = Math.max(0.001, tip.y - end.y); stream.visible = true;
      stream.position.set((tip.x + end.x) / 2, (tip.y + end.y) / 2, (tip.z + end.z) / 2); stream.scale.set(1, len, 1);
      stream.lookAt(end); stream.rotateX(Math.PI / 2);
      stream.material.opacity = 0.6 + Math.sin(t * 30) * 0.08;
    } else stream.visible = false;
    // spice bowls: picked ones glow and rise a little, a wrong one shakes
    for (const k2 of SPICE_KEYS) {
      const b = bowls[k2]; b.lift = ease(b.lift, st.picked[k2] ? 1 : 0, 8); b.shake = Math.max(0, b.shake - dt * 2.2);
      b.g.position.y = b.lift * 0.012; b.g.rotation.z = Math.sin(t * 50) * 0.08 * b.shake;
      b.glow.material.opacity = st.key === 'spices' ? (st.picked[k2] ? 0.95 : 0.25 + Math.sin(t * 3) * 0.12) : 0;
    }
    // puffs
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i]; p.life += dt; const a = p.life / p.max;
      if (a >= 1) { scene.remove(p.s); p.s.material.dispose(); puffs.splice(i, 1); continue; }
      p.s.position.x += p.vx * dt; p.s.position.z += p.vz * dt; p.s.position.y += dt * (p.kind === 'smoke' ? 0.07 : 0.1);
      p.s.scale.setScalar(0.02 + a * (p.kind === 'smoke' ? 0.12 : 0.08));
      p.s.material.opacity = (p.kind === 'smoke' ? 0.35 : 0.3) * Math.sin(Math.PI * a);
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  function dispose() {
    running = false; ro.disconnect();
    renderer.dispose(); pmrem.dispose();
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }

  return {
    setStep,
    roast(r) { st.r = r; },
    stir(on) { st.stirring = !!on; },
    strike() { st.strikeT = 0; st.ringT = 0; },
    spoon(n) { st.spoons = n; st.spoonT = 0; },
    timed(k) { st.boilK = k; if (st.key === 'brew') st.steam = 0.4 + k * 0.6; },
    spices(picked, wrong) { st.picked = Object.assign({}, picked || {}); if (wrong && bowls[wrong]) bowls[wrong].shake = 1; },
    pour(l) { st.l = l; },
    pouring(on) { st.pouring = !!on; },
    // where a tappable thing is on the screen (for tests and hints): client x, y
    screenOf(name) {
      let found = null; scene.traverse((o) => { if (o.userData.tap === name) found = o; });
      if (!found) return null;
      const p = new THREE.Vector3(); found.getWorldPosition(p); p.project(camera);
      const r = renderer.domElement.getBoundingClientRect();
      return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
    },
    dispose
  };
}
