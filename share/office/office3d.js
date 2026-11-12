// The bee office in 3D (three.js, share/office/vendor). index.html keeps everything else: the data, where the
// bees go, the view controls, the name tags and bubbles. Its projection P() is matched exactly here (an
// orthographic view of the same angle, turn, zoom and pan), so what the page still draws on its own canvas
// (labels, tags, bubbles, badges) lands on this scene. Positions follow the 2D scene (buildScene, drawFloor,
// drawYard): x and y in tiles, heights in the page's px, turned into tiles by H().
// 3D 벌 사무실 (three.js, share/office/vendor). 나머지는 index.html 이 그대로 한다: 자료, 벌이 갈 곳, 보기 조작,
// 이름표와 말풍선. 그 투영 P() 를 여기서 정확히 맞추므로 (같은 각도, 회전, 확대, 이동의 정사영), 페이지가 자기
// 캔버스에 계속 그리는 것 (이름, 이름표, 말풍선, 배지) 이 이 장면 위에 맞게 놓인다. 위치는 2D 장면 (buildScene,
// drawFloor, drawYard) 을 따른다: x, y 는 타일, 높이는 페이지의 px 이고 H() 로 타일이 된다.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// one tile of height is this many of the page's px (at the classic angle) / 높이 한 타일은 페이지의 px 로 이만큼 (기본 각도에서)
const HPX = 32 * Math.SQRT2 * Math.sqrt(.75);
const H = px => px / HPX;

const gl = document.getElementById('gl');
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, powerPreference: 'low-power' }); } catch (e) { renderer = null; }
const OK = !!renderer;
const scene = new THREE.Scene();
const hemi = new THREE.HemisphereLight(0xfff6e6, 0xc9a882, .8);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.2);
if (OK) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .35;
}
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
const sc = sun.shadow.camera; sc.left = -20; sc.right = 20; sc.top = 20; sc.bottom = -20; sc.near = 1; sc.far = 120;
scene.add(hemi, sun, sun.target);
// a tile (x, y) at height h is the point (x, h, y) / 타일 (x, y), 높이 h 는 점 (x, h, y)
const root = new THREE.Group(); scene.add(root);
const camera = new THREE.Camera(); camera.matrixAutoUpdate = false;
// the sky behind everything, the page's colours / 맨 뒤의 하늘, 페이지와 같은 색
const skyCv = document.createElement('canvas'); skyCv.width = 2; skyCv.height = 128;
const skyTex = new THREE.CanvasTexture(skyCv); skyTex.colorSpace = THREE.SRGBColorSpace; scene.background = skyTex;
let skyKey = '';
function paintSky() {
  const L = LIGHT, top = mixc('#0b1736', '#5fa8e6', L), bot = mixc('#24365e', mixc('#f3c89a', '#cfe8f7', clamp01((L - .35) / .4)), Math.min(1, L * 1.4));
  if (skyKey === top + bot) return; skyKey = top + bot;
  const c = skyCv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, top); g.addColorStop(1, bot);
  c.fillStyle = g; c.fillRect(0, 0, 2, 128); skyTex.needsUpdate = true;
}

// ── shapes, cached / 도형, 캐시 ──────────────────────────────────────────────────────────────────
const mats = new Map(), geos = new Map();
// a page colour as hex; a see-through one (rgba) as it looks over base / 페이지 색을 hex 로. 비치는 색 (rgba) 은 base 위에 보이는 대로
function colOf(c, base = '#ffffff') {
  if (/^#[0-9a-f]{6}$/i.test(c || '')) return c;
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?/.exec(c || '');
  if (!m) return '#888888';
  const rgb = '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('');
  return mixc(colOf(base), rgb, m[4] === undefined ? 1 : +m[4]);
}
// what the office lights reach: the office and the bees, built while INSIDE is on; they glow a little in the dark
// 사무실 조명이 닿는 것: INSIDE 가 켜진 동안 지은 사무실과 벌. 어두울 때 조금 빛난다
const LIT = new Set();
let INSIDE = false;
const lit = m => { if (m.map) { m.emissiveMap = m.map; m.needsUpdate = true; } LIT.add(m); return m; };
// bees keep their colours bright whatever the light: a glow of their own, a little gloss / 벌은 빛과 상관없이 색이 선명하다: 스스로 조금 빛나고, 살짝 윤이 난다
let BEEING = false;
const BEE_GLOW = .38;
function mat(color, o = {}) {
  const op = o.op ?? 1, k = `${color}|${op}|${o.em || ''}|${o.rough ?? .78}|${o.side ? 1 : 0}|${o.flat ? 1 : 0}|${INSIDE && !o.em ? 1 : 0}|${BEEING ? 1 : 0}`;
  if (!mats.has(k)) {
    const m = new THREE.MeshStandardMaterial({ color: colOf(color), roughness: BEEING ? .45 : o.rough ?? .78, metalness: 0, transparent: op < 1, opacity: op,
      emissive: o.em ? colOf(o.em) : 0x000000, depthWrite: op >= 1, side: o.side ? THREE.DoubleSide : THREE.FrontSide, flatShading: !!o.flat });
    if (BEEING && !o.em) { m.userData.bee = true; m.emissive.copy(m.color).multiplyScalar(BEE_GLOW); }
    mats.set(k, INSIDE && !o.em ? lit(m) : m);
  }
  return mats.get(k);
}
// the office lights (Settings or the bulb button): on, the office stays bright after dark / 사무실 조명 (설정이나 전구 버튼): 켜면 어두워져도 사무실은 밝다
let litK = -1;
const WARM = new THREE.Color(0xfff1d6);
function officeLights() {
  const k = settings.lights === 'off' ? 0 : clamp01((.95 - LIGHT) / .6);
  if (Math.abs(k - litK) < .01) return;
  litK = k;
  for (const m of LIT) m.emissive.copy(m.map ? WARM : m.color).multiplyScalar(m.userData.bee ? Math.max(BEE_GLOW, k * .6) : k * (m.map ? .55 : .6));
}
const geo = (k, make) => { if (!geos.has(k)) geos.set(k, make()); return geos.get(k); };
function mesh(g, gm, color, x, y, z, o = {}) {
  const m = new THREE.Mesh(gm, o.material || mat(color, o));
  m.position.set(x, y, z); m.castShadow = o.shadow !== false && !(o.op < 1); m.receiveShadow = true;
  if (o.rot) m.rotation.set(...o.rot);
  if (o.scale) m.scale.set(...o.scale);
  g.add(m); return m;
}
const f3 = v => v.toFixed(3);
// boxes and cylinders stand on y; balls are centred on it / 상자와 원기둥은 y 위에 서고, 공은 y 가 가운데
function rbox(g, w, h, d, x, y, z, color, o = {}) {
  const r = Math.max(.001, Math.min(o.r ?? .025, Math.min(w, h, d) / 2 - .001));
  const gm = Math.min(w, h, d) < .01 ? geo(`B${f3(w)},${f3(h)},${f3(d)}`, () => new THREE.BoxGeometry(w, h, d))
    : geo(`b${f3(w)},${f3(h)},${f3(d)},${f3(r)}`, () => new RoundedBoxGeometry(w, h, d, 2, r));
  return mesh(g, gm, color, x, y + h / 2, z, o);
}
// the page's box(): corner (x, y), size w × d tiles, h px tall from z px / 페이지의 box(): 모서리 (x, y), w × d 타일, z px 에서 h px 높이
const B = (g, x, y, w, d, h, col, z = 0, o = {}) => rbox(g, w, H(h), d, x + w / 2, H(z), y + d / 2, col, o);
function cyl(g, rt, rb, h, x, y, z, color, o = {}) {
  const s = o.seg ?? (Math.max(rt, rb) < .1 ? 8 : Math.max(rt, rb) < .4 ? 14 : 28);
  return mesh(g, geo(`c${rt},${rb},${f3(h)},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s)), color, x, y + h / 2, z, o);
}
// the page's cyl(): centre (x, y), radius r tiles, h px tall from z px / 페이지의 cyl()
const C = (g, x, y, r, h, col, z = 0, o = {}) => cyl(g, r, r, H(h), x, H(z), y, col, o);
function ball(g, r, x, y, z, color, o = {}) {
  const n = r < .06 ? [8, 6] : r < .15 ? [12, 8] : [16, 11];
  return mesh(g, geo(`s${f3(r)}`, () => new THREE.SphereGeometry(r, ...n)), color, x, y, z, o);
}
// leaves: a low-poly ball, cheap and a little faceted / 잎: 각진 공, 가볍고 조금 깎인 느낌
const leaf = (g, r, x, y, z, color, o = {}) => mesh(g, geo(`i${f3(r)}`, () => new THREE.IcosahedronGeometry(r, 1)), color, x, y, z, { ...o, flat: true });
// flat on the floor: a disc, a rectangle / 바닥에 납작하게: 원, 사각형
const disc = (g, x, y, r, col, lift) => mesh(g, geo(`d${f3(r)}`, () => new THREE.CircleGeometry(r, 40)), col, x, lift, y, { rot: [-Math.PI / 2, 0, 0], shadow: false });
const rect = (g, x, y, w, d, col, lift) => mesh(g, geo(`r${f3(w)},${f3(d)}`, () => new THREE.PlaneGeometry(w, d)), col, x + w / 2, lift, y + d / 2, { rot: [-Math.PI / 2, 0, 0], shadow: false });
function canvasTex(w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// what never moves: one mesh per material / 움직이지 않는 것: 재질마다 메시 하나
function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert(), buckets = new Map(), all = [];
  group.traverse(o => { if (o.isMesh && !o.userData.keep) all.push(o); });
  for (const m of all) {
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    const k = m.material.uuid + (m.castShadow ? 's' : '');
    if (!buckets.has(k)) buckets.set(k, { material: m.material, cast: m.castShadow, geos: [] });
    buckets.get(k).geos.push(g);
    m.parent.remove(m);
  }
  for (const b of buckets.values()) {
    const merged = new THREE.Mesh(mergeGeometries(b.geos), b.material);
    b.geos.forEach(g => g.dispose());
    merged.castShadow = b.cast; merged.receiveShadow = true; merged.userData.merged = true; group.add(merged);
  }
}
const drop = g => { if (!g) return; g.traverse(o => { if (o.isMesh && o.userData.merged) o.geometry.dispose(); if (o.userData.tex) o.userData.tex.dispose(); }); g.parent && g.parent.remove(g); };
// the modern campus look (Settings → Office look): light stone and white oak, glass all round, long shared
// tables, trees inside and an orchard outside. The page's colours otherwise (classic)
// 모던 캠퍼스 꾸밈 (설정 → 사무실 꾸밈): 밝은 석재와 화이트 오크, 사방 통유리, 긴 공용 테이블, 실내 나무와 바깥 과수원.
// 아니면 페이지 색 그대로 (기본)
const MODERN = { 'm-lounge': '#ebe9e4', 'm-office': '#e4d2b0', 'm-meet': '#efede8', 'm-mine': '#ece8e0', 'm-tile': '#e2ded7', 'm-desk': '#ece2cf',
  'm-desk-edge': '#d6cab2', 'm-chair': '#e8e9ec', 'm-counter': '#dcd8d0', 'm-sofa': '#cdc6b8', 'm-wallface': '#f5f4f1', 'm-wall': '#aab1ba', 'm-mon': '#c6cad1',
  'm-lid': '#d3d6db', 'm-pot': '#f2f1ed', 'm-rug': 'rgba(0, 0, 0, 0)', 'm-zone': 'rgba(242, 182, 50, .09)', 'm-zone-remote': 'rgba(167, 139, 250, .1)',
  'm-team': 'rgba(10, 163, 166, .1)', 'o-roof': '#efeee9', 'o-roof2': '#d8d7d2', 'm-board': '#fbfbfa', 'm-grass': '#cfdcc0' };
const modern = () => settings.decor !== 'classic';
function TT(k) { return (modern() && MODERN[k]) || T[k]; }
const tok = (k, base) => colOf(TT(k), base);
const shadeC = (col, k) => mixc(colOf(col), '#000000', k);
const liteC = (col, k) => mixc(colOf(col), '#ffffff', k);

// ── furniture (the page's add* helpers) / 가구 (페이지의 add* 와 같게) ─────────────────────────────
function chair(g, x, y, bx, by, col = tok('m-chair'), tall = 0) {
  const dark = shadeC(col, .3);
  for (let i = 0; i < 5; i++) { const a = i * 2 * Math.PI / 5 + .35; rbox(g, .2, .03, .035, x + Math.cos(a) * .11, H(.5), y + Math.sin(a) * .11, dark, { rot: [0, -a, 0], shadow: false }); ball(g, .025, x + Math.cos(a) * .22, .025, y + Math.sin(a) * .22, dark, { shadow: false }); }
  C(g, x, y, .04, 7, shadeC(col, .15), 1.5);
  B(g, x - .23, y - .23, .46, .46, 1.2, shadeC(col, .2), 7);
  B(g, x - .21, y - .21, .42, .42, 2.5, col, 8, { r: .04 });
  const w = .42, t = .07, h = 12 + tall;
  if (bx) { const x0 = bx > 0 ? x + .21 : x - .21 - t; B(g, x0, y - w / 2, t, w, h, col, 10, { r: .03 }); B(g, x0 + (bx > 0 ? 0 : t / 2), y - .03, t / 2, .06, 3, dark, 8); }
  else { const y0 = by > 0 ? y + .21 : y - .21 - t; B(g, x - w / 2, y0, w, t, h, col, 10, { r: .03 }); B(g, x - .03, y0 + (by > 0 ? 0 : t / 2), .06, t / 2, 3, dark, 8); }
}
// a tree in a white planter, inside (modern) / 흰 화분의 실내 나무 (모던)
function indoorTree(g, x, y, s = 1) {
  cyl(g, .34 * s, .28 * s, H(11 * s), x, 0, y, tok('m-pot'));
  cyl(g, .03 * s, .05 * s, H(22 * s), x, H(11 * s), y, tok('o-trunk'));
  for (const [dx, dz, dy, r] of [[0, 0, 36, .42], [-.22, .1, 30, .3], [.22, -.08, 31, .3], [0, .05, 45, .3]]) leaf(g, r * s, x + dx * s, H(dy * s), y + dz * s, dx ? tok('o-leaf2') : tok('o-leaf'));
}
const green = (g, x, y, s) => modern() && s >= 1 ? indoorTree(g, x, y, s * .85) : plant(g, x, y, s);
function plant(g, x, y, s = 1) {
  cyl(g, .2 * s, .16 * s, H(9 * s), x, 0, y, tok('m-pot'));
  const green = tok('m-plant'), top = H(9 * s);
  for (const [dx, dz, dy, r] of [[-.1, .05, .12, .15], [.1, -.05, .15, .14], [0, 0, .28, .15], [.02, .1, .08, .15]]) leaf(g, r * s, x + dx * s, top + dy * s, y + dz * s, green);
}
function roundTable(g, x, y, r, h, col = tok('m-desk')) { C(g, x, y, r * .5, 1.2, shadeC(col, .3)); C(g, x, y, .07, h - 2, shadeC(col, .25), 1); C(g, x, y, r, 2, col, h - 2); }
function stool(g, x, y, col = tok('m-chair')) { C(g, x, y, .12, 1, shadeC(col, .3)); C(g, x, y, .035, 8, shadeC(col, .2), 1); C(g, x, y, .19, 2.2, col, 8.5); }
function bookshelf(g, x, y, w, d, h, seed) {
  B(g, x, y, w, d, h, tok('m-counter'));
  const t = canvasTex(256, Math.round(256 * H(h) / w)), cv = t.image, c = cv.getContext('2d'), W = cv.width, Hh = cv.height;
  c.fillStyle = shadeC(TT('m-counter'), .15); c.fillRect(0, 0, W, Hh);
  const cols = ['#c0504d', '#4f81bd', '#9bbb59', '#8064a2', '#f2b632', '#4bacc6', '#e46c0a'];
  let k = seed;
  for (let row = 0; row < 3; row++) {
    const y0 = row * Hh / 3; c.fillStyle = shadeC(TT('m-counter'), .35); c.fillRect(0, y0 + Hh / 3 - 3, W, 3);
    for (let u = 6; u < W - 8;) { const bw = 6 + hash(row, k) * 7, bh = Hh / 3 - 8 - hash(k, row) * 6; if (hash(k, row, 2) > .12) { c.fillStyle = cols[k % cols.length]; c.fillRect(u, y0 + Hh / 3 - 3 - bh, bw, bh); } u += bw + 1.5; k++; }
  }
  for (const fy of [y + d + .003, y - .003]) {   // both long faces show books / 긴 면 둘 다 책
    const m = new THREE.Mesh(geo(`bs${f3(w)},${f3(H(h))}`, () => new THREE.PlaneGeometry(w - .04, H(h) - .04)), lit(new THREE.MeshStandardMaterial({ map: t, roughness: .85, side: THREE.DoubleSide })));
    m.position.set(x + w / 2, H(h) / 2, fy); m.userData.keep = true; m.userData.tex = t; m.receiveShadow = true; g.add(m);
  }
}
function cooler(g, x, y) { B(g, x - .18, y - .18, .36, .36, 18, '#e9edf2', 0, { r: .04 }); C(g, x, y, .14, 10, '#7fb6e6', 18, { op: .85 }); C(g, x, y, .15, 1.5, '#5a93c6', 27.5); }

// ── walls: painted canvases, the near ones left open like the page / 벽: 칠한 캔버스. 가까운 벽은 페이지처럼 열어 둔다 ──
const PT = 48;   // the wall itself: canvas px per tile along it (plain paint) / 벽 자체: 벽 방향 타일당 캔버스 px (단색 칠)
const DK = 360;   // what hangs on it (words, the clock, the comb): px per tile, sharp up close / 걸린 것 (글자, 시계, 벌집): 타일당 px, 가까이서도 또렷하게
function quad(g, a, d, n, u0, u1, v0, v1, tex, lift = 0, see = lift > 0) {   // a piece of wall from u0 to u1 tiles, v0 to v1 px / 벽 조각
  const p = (u, v) => [a[0] + d[0] * u + n[0] * lift, H(v), a[1] + d[1] * u + n[1] * lift];
  const gm = new THREE.BufferGeometry();
  gm.setAttribute('position', new THREE.Float32BufferAttribute([...p(u0, v0), ...p(u1, v0), ...p(u1, v1), ...p(u0, v1)], 3));
  gm.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  gm.setIndex([0, 1, 2, 0, 2, 3]); gm.computeVertexNormals();
  const m = new THREE.Mesh(gm, lit(new THREE.MeshStandardMaterial({ map: tex, roughness: .9, side: THREE.DoubleSide, transparent: see })));
  m.receiveShadow = true; m.userData.tex = tex; m.userData.merged = true; g.add(m);
  return m;
}
// a surface to paint on in the page's units: u tiles along the wall, v px up / 페이지 단위로 칠할 면: u 는 벽 따라 타일, v 는 위로 px
const surface = (tex, k, u0, v1) => ({ c: tex.image.getContext('2d'), k, u0, v1 });
const sx = (S, u) => (u - S.u0) * S.k, sy = (S, v) => (S.v1 - v) * S.k / HPX;
const wallRect = (S, u, v0, w, v1, col) => { S.c.fillStyle = col; S.c.fillRect(sx(S, u), sy(S, v1), w * S.k, (v1 - v0) * S.k / HPX); };
function wallWord(S, u, v, text, px, weight, col, family = FONT_NAME, mirror = false) {
  const c = S.c; c.save(); c.translate(sx(S, u), sy(S, v)); if (mirror) c.scale(-1, 1);
  c.font = `${weight} ${px * S.k / HPX * 1.15}px ${family}`; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 0); c.restore();
}
// the walls' plain paint: the face and its windows / 벽의 바탕: 면과 창
function paintWall(S, len, windows, solid) {
  if (modern()) {   // glass floor to ceiling, thin mullions; solid panels where things hang / 바닥부터 천장까지 유리, 얇은 창틀. 걸린 것 자리엔 막힌 벽
    S.c.clearRect(0, 0, S.c.canvas.width, S.c.canvas.height);
    S.c.fillStyle = LIGHT < .55 && settings.lights !== 'off' ? 'rgba(255, 236, 200, .32)' : 'rgba(200, 222, 236, .26)'; S.c.fillRect(0, 0, S.c.canvas.width, S.c.canvas.height);
    for (const [a, b] of solid) wallRect(S, a, 0, b - a, WALL, tok('m-wallface'));
    for (let u = 0; u <= len; u += 1.6) wallRect(S, u - .025, 0, .05, WALL, tok('m-wall'));
    wallRect(S, 0, 0, len, 2, tok('m-wall')); wallRect(S, 0, WALL - 3, len, WALL, tok('m-wall'));
    return;
  }
  S.c.fillStyle = tok('m-wallface'); S.c.fillRect(0, 0, S.c.canvas.width, S.c.canvas.height);
  for (const u of windows) wallRect(S, u, 24, 1.8, 60, colOf(T.win));
}
// what hangs on the walls, each on its own sharp canvas: [wall, u0, u1, v0, v1, paint, mirrored]
// 벽에 걸린 것, 각자 또렷한 캔버스에: [벽, u0, u1, v0, v1, 칠하기, 뒤집힘]
// where they hang: [wall, u] by plan / 걸리는 곳: 배치마다 [벽, u]
const hangAt = () => LAY.plan === 'park'
  ? { clock: ['core', 7.5], frame: ['core', 5.05, true], board: ['meetPanel', .3], comb: 'bossPanel', menu: ['barPanel', 2.7], plaques: 'core', lift: 3.4 }
  : { clock: ['back', 3.6], frame: ['back', 13.3, false], board: ['back', 16.9], comb: 'back', menu: ['left', 10.4 + LAY.LOFF], plaques: 'left', lift: 8.5 + LAY.LOFF };
function hangings() {
  const out = [], best = RANKS && RANKS.month && RANKS.month[0], at = hangAt();
  if (best) out.push([at.frame[0], at.frame[1], at.frame[1] + 2.05, 18, 60, S => {   // bee of the month / 이달의 꿀벌
    const u = at.frame[1], w = 2.05, flip = at.frame[2], r = ROSTER[best.id], name = r ? (r.name === 'claude' ? r.project : r.name) : best.id.split('/').pop();
    wallRect(S, u, 18, w, 60, '#b8873e'); wallRect(S, u + .08, 20, w - .16, 58, '#fffaf0');
    wallWord(S, u + w / 2, 53.5, '🏆', 6, 400, '#000', FONT_NAME, flip);
    wallWord(S, u + w / 2, 47.5, tr('이달의 꿀벌', 'Bee of the Month'), 3.8, 'italic 400', tok('m-label'), FONT_FANCY, flip);
    const fit = wrapFit(name, w * PLAQUE_PX - 10, 6.5, 4, FONT_NAME, 600), lh = fit.size + 3.8, top = fit.lines.length > 1 ? 40 : 37.5;
    fit.lines.forEach((l, i) => wallWord(S, u + w / 2, top - i * lh, l, fit.size, 600, '#3a2612', FONT_NAME, flip));
    wallWord(S, u + w / 2, top - (fit.lines.length - 1) * lh - 9.5, tr(`꿀 ${best.honey}칸`, `${best.honey} honey`), 4.6, 600, colOf(T.wait), FONT_NAME, flip);
  }]);
  const R = 11;   // the clock, px / 벽시계, px
  const cu = at.clock[1];
  out.push([at.clock[0], cu - (R + 2) / HPX, cu + (R + 2) / HPX, 47 - R - 2, 47 + R + 2, S => {
    const c = S.c, now = new Date(), cx = sx(S, cu), cy = sy(S, 47), r = R * S.k / HPX, e = r / 11;
    c.fillStyle = '#3a404c'; c.beginPath(); c.arc(cx, cy, r + 2 * e, 0, 7); c.fill(); c.fillStyle = '#fbfaf6'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
    c.fillStyle = '#7a8394'; for (let k = 0; k < 12; k++) { const a = k / 12 * 2 * Math.PI; c.beginPath(); c.arc(cx + Math.sin(a) * r * .8, cy - Math.cos(a) * r * .8, (k % 3 ? .7 : 1.1) * e, 0, 7); c.fill(); }
    c.strokeStyle = '#1b1f27'; c.lineCap = 'round';
    for (const [f, len, w] of [[(now.getHours() % 12 + now.getMinutes() / 60) / 12, .5, 2.2], [now.getMinutes() / 60, .78, 1.4]]) { const a = f * 2 * Math.PI; c.lineWidth = w * e; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(a) * r * len, cy - Math.cos(a) * r * len); c.stroke(); }
    c.fillStyle = colOf(T.alert); c.beginPath(); c.arc(cx, cy, 1.2 * e, 0, 7); c.fill();
  }]);
  const bu = at.board[1];
  out.push([at.board[0], bu, bu + 3.2, 15, 55, (S, t) => {   // the whiteboard, filling while a bee draws / 화이트보드. 벌이 그리는 동안 찬다
    wallRect(S, bu, 15, 3.2, 55, tok('m-wall')); wallRect(S, bu + .1, 16, 3, 54, tok('m-board'));
    const drawer = [...bees.values()].find(b => b.atBoard && b.key2 === 'meet' && b.arrived);
    if (!drawer) return;
    const n = reduced ? 6 : Math.floor((t * .6 + drawer.phase) % 7);
    for (let i = 0; i < n; i++) wallRect(S, bu + .35 + (i % 2) * 1.4, 48 - Math.floor(i / 2) * 9, [1, .7, 1.2, .9, .5, 1.1][i], 49.6 - Math.floor(i / 2) * 9, colOf(T.run));
    const notes = crew.get('crew|notes');
    if (notes && notes.key2 === 'meet' && notes.arrived) [[2.5, 46, T.wait], [2.7, 34, T.done], [2, 24, T.alert]].forEach(([u, v, col]) => wallRect(S, bu + u, v, .3, v + 6, colOf(col)));
  }]);
  const c0 = cellAt(0), cN = cellAt(COMB.cols * COMB.rows - 1), cr = COMB.R / COMB.TILE * 1.1;
  out.push([at.comb, c0.u - cr, cN.u + COMB.du / 2 + cr, c0.v - COMB.R - 1, cN.v + COMB.R + 1, S => {   // the honeycomb: today's tasks; full, it goes into a jar / 벌집: 오늘의 작업. 다 차면 단지로
    const c = S.c, honey = honeyShown(), cap = COMB.cols * COMB.rows, filled = honey - jarsOf(honey) * cap;
    for (let i = 0; i < cap; i++) {
      const { u, v } = cellAt(i); c.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; c.lineTo(sx(S, u + Math.cos(a) * COMB.R / COMB.TILE * 1.02), sy(S, v + Math.sin(a) * COMB.R)); }
      c.closePath(); c.fillStyle = colOf(i < filled ? T.honey : TT('m-wax')); c.fill(); c.strokeStyle = tok('m-wax-edge'); c.lineWidth = S.k / 120; c.stroke();
    }
  }]);
  // the name plaques; seen from inside this wall runs right to left, so its words are mirrored to read
  // 명패. 안에서 보면 이 벽은 오른쪽에서 왼쪽이라 글자를 뒤집어야 읽힌다
  const pl = plaques();
  if (LAY.plan === 'park') {   // side by side on the elevator core, left of its doors / 엘리베이터 코어에 나란히, 문 왼쪽에
    const room = 3.1, total = pl.reduce((a, q) => a + q.W + .15, 0), k = Math.min(1, room / Math.max(.01, total));
    let u = .2; for (const q of pl) { q.W *= k; q.size *= k; q.y = u + q.W / 2; u += q.W + .15 * k; }
  }
  for (const q of pl) out.push([at.plaques, q.y - q.W / 2, q.y + q.W / 2, 26, 56, S => {
    const y0 = q.y - q.W / 2;
    wallRect(S, y0, 26, q.W, 56, tok('m-desk-edge')); wallRect(S, y0 + .06, 27.2, q.W - .12, 54.8, liteC(TT('m-desk'), .22));
    wallRect(S, y0 + .06, 27.2, q.W - .12, 36.2, q.oi === 0 ? colOf(T.honey) : '#a78bfa');
    wallWord(S, q.y, 45.5, q.name, q.size * .9, 700, '#3a2612', TT('f-body'), true);
    wallWord(S, q.y, 31.8, q.sub, 8.5, 600, q.oi === 0 ? '#3a2612' : '#ffffff', TT('f-body'), true);
  }]);
  const mu = at.menu[1];
  out.push([at.menu[0], mu, mu + 2.6, 34, 56, S => {   // the cafe menu / 카페 메뉴판
    wallRect(S, mu, 34, 2.6, 56, tok('m-mon'));
    for (let i = 0; i < 3; i++) wallRect(S, mu + .3, 50 - i * 6, 1.2 + (i % 2) * .6, 52 - i * 6, colOf(T.honey));
  }]);
  return out;
}

// ── the office, rebuilt when the layout changes / 사무실. 배치가 바뀌면 다시 짓는다 ─────────────────
let office = null, sig = '';
const dyn = { walls: [], desks: [], bulbs: [], homes: [], paintAt: {} };
function buildOffice() {
  INSIDE = true;
  try { buildOfficeIn(); } finally { INSIDE = false; }
  litK = -1;
}
function buildOfficeIn() {
  drop(office);
  office = new THREE.Group(); root.add(office);
  const stat = new THREE.Group(); office.add(stat);
  const { GY } = LAY;
  if (LAY.plan !== 'park') rbox(stat, GX, .08, GY, GX / 2, -.08, GY / 2, tok('m-lounge'), { r: .01, shadow: false });
  if (modern()) {   // terrazzo: stone with chips / 테라초: 돌 조각이 박힌 석재
    const tz = canvasTex(256, 256), c = tz.image.getContext('2d'); c.fillStyle = tok('m-lounge'); c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) { c.fillStyle = ['#d8d4cc', '#c9c3b8', '#f7f6f3', '#bdb6aa', '#e2c9a6'][i % 5]; c.beginPath(); c.arc(hash(i, 1) * 256, hash(i, 2) * 256, 1 + hash(i, 3) * 3, 0, 7); c.fill(); }
    tz.wrapS = tz.wrapT = THREE.RepeatWrapping; tz.repeat.set(GX / 2, GY / 2);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(GX, GY), lit(new THREE.MeshStandardMaterial({ map: tz, roughness: .55 })));
    fl.rotation.x = -Math.PI / 2; fl.position.set(GX / 2, .001, GY / 2); fl.receiveShadow = true; fl.userData.tex = tz; fl.userData.merged = true;
    if (LAY.plan !== 'park') office.add(fl); else { tz.repeat.set(16, 16); dyn.terrazzo = fl.material; }
  }
  if (LAY.plan === 'park') { buildPark(stat); mergeStatic(stat); return; }
  buildWalls(); buildClassic(stat);
  buildDesks(stat);
  // the boss room: the chair, the desk with the question window, the shelf for the jars / 사장실: 의자, 질문 창구 책상, 꿀단지 선반
  const bx = 24, frame = tok('m-wall');
  chair(stat, bx + .85, 1.5, 0, -1, shadeC(TT('m-chair'), .1), 9);
  B(stat, bx, 2.3, 1.7, .7, 17, tok('m-counter'));
  B(stat, SHELF.x, SHELF.y, SHELF.w, SHELF.d, SHELF.h, tok('m-counter'));
  const sign = canvasTex(256, 64), sx = sign.image.getContext('2d');
  sx.fillStyle = colOf(T.wait); sx.beginPath(); sx.roundRect(2, 2, 252, 60, 30); sx.fill();
  sx.fillStyle = '#1b1300'; sx.font = `700 30px ${TT('f-body')}`; sx.textAlign = 'center'; sx.textBaseline = 'middle'; sx.fillText(tr('질문 창구', 'Questions'), 128, 34);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.25, .31), new THREE.MeshStandardMaterial({ map: sign, transparent: true, side: THREE.DoubleSide }));
  sg.position.set(bx + .85, H(50), 2.65); sg.userData.tex = sign; office.add(sg);
  for (const k of [-1, 1]) C(stat, bx + .85 + k * .4, 2.65, .008, 12, frame, 53);
  dyn.jars = new THREE.Group(); office.add(dyn.jars); dyn.jarN = -1;
  // the meeting room's table and chairs / 회의실 탁자와 의자
  MEET_CHAIRS.forEach(p => { const dx = p.x - MEET_C.x, dy = p.y - MEET_C.y; Math.abs(dx) > Math.abs(dy) ? chair(stat, p.x, p.y, Math.sign(dx), 0) : chair(stat, p.x, p.y, 0, Math.sign(dy)); });
  roundTable(stat, MEET_C.x, MEET_C.y, 1.05, 15);
  mergeStatic(stat);
}
// the walls (drawBackWalls): which ones stand is decided each frame / 벽: 어느 벽이 설지는 매 프레임
function buildWalls() {
  const { GY, LOFF } = LAY;
  dyn.walls = []; dyn.paintAt = {};
  const walls = {}, pl = plaques(), hung = hangings(), lift = hangAt().lift;
  const wall = (name, a, b, n, windows) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / len, (b[1] - a[1]) / len], g = new THREE.Group(); office.add(g);
    const tex = canvasTex(Math.round(len * PT), Math.round(WALL * PT / HPX));
    const solid = hung.filter(h => h[0] === name).map(h => [h[1] - .3, h[2] + .3]);
    if (name === 'left') solid.push([lift - .4, lift + 1.7]);   // the elevator / 엘리베이터
    quad(g, a, d, n, 0, len, 0, WALL, tex, 0, modern());
    const top = rbox(g, len, .05, .1, (a[0] + b[0]) / 2, H(WALL), (a[1] + b[1]) / 2, tok('m-wall'), { r: .01, shadow: false }); top.rotation.y = -Math.atan2(d[1], d[0]);
    const w = { g, n, a, d, parts: [{ S: surface(tex, PT, 0, WALL), tex, paint: S => paintWall(S, len, windows, solid) }] };
    walls[name] = w; dyn.walls.push(w);
  };
  const run = (from, to) => { const u = []; for (let x = from; x < to; x += 3) u.push(x); return u; };
  wall('back', [0, 0], [GX, 0], [0, 1], run(1.2, RANKS && RANKS.month && RANKS.month[0] ? 12 : 14));
  wall('left', [0, 0], [0, GY], [1, 0], run(1.2, 7.5 + LOFF).filter(y => !pl.some(q => Math.abs(y + .9 - q.y) < q.W / 2 + 1.1)));
  wall('right', [GX, 0], [GX, GY], [-1, 0], run(1.2, GY - 2));
  wall('front', [0, GY], [GX, GY], [0, -1], run(1.2, GX - 2));
  // the elevator, plain enough for the wall's own paint / 엘리베이터는 벽 바탕에 칠해도 충분하다
  const lw = walls.left.parts[0], plain = lw.paint;
  lw.paint = S => { plain(S); wallRect(S, lift - .1, 0, 1.4, 52, tok('m-wall')); wallRect(S, lift, 0, .58, 48, tok('m-board')); wallRect(S, lift + .62, 0, .58, 48, tok('m-board')); };
  for (const [name, u0, u1, v0, v1, paint] of hung) {
    const w = walls[name], tex = canvasTex(Math.max(8, Math.round((u1 - u0) * DK)), Math.max(8, Math.round(H(v1 - v0) * DK)));
    quad(w.g, w.a, w.d, w.n, u0, u1, v0, v1, tex, .006);
    w.parts.push({ S: surface(tex, DK, u0, v1), tex, paint });
  }
}
const glassPane = (x0, y0, x1, y1) => { const w = Math.hypot(x1 - x0, y1 - y0); const m = mesh(office, geo(`gp${f3(w)}`, () => new THREE.BoxGeometry(w, H(44), .02)), null, (x0 + x1) / 2, H(22), (y0 + y1) / 2, { material: mat(tok('m-window'), { op: .22, rough: .05, side: 1 }), shadow: false }); m.rotation.y = -Math.atan2(y1 - y0, x1 - x0); };
// the pods: the desks or long tables, chairs, laptops; where a pod could go, a shelf and plants
// 섬: 책상이나 긴 테이블, 의자, 노트북. 섬이 올 자리엔 책장과 화분
function buildDesks(stat) {
  dyn.desks = [];
  const shared = modern();
  for (const p of LAY.pods) {
    const col = tok(podTeam(p) ? 'm-team' : p.oi === 0 ? 'm-zone' : 'm-zone-remote', TT('m-office'));
    rect(stat, p.x - .1, p.y - .25, 6, 3.5, col, .004); rect(stat, p.x + .05, p.y - .1, 5.7, 3.2, colOf(T[podTeam(p) ? 'm-team' : p.oi === 0 ? 'm-zone' : 'm-zone-remote'], col), .0045);
  }
  if (shared) for (const p of LAY.pods) {   // one long table a pod, on four slim legs / 섬마다 긴 테이블 하나, 가는 다리 넷
    B(stat, p.x + .25, p.y + .6, 5.4, 1.8, 2.5, tok('m-desk'), 13.5, { r: .05 });
    for (const [lx, ly] of [[.45, .8], [5.38, .8], [.45, 2.12], [5.38, 2.12]]) B(stat, p.x + lx, p.y + ly, .07, .07, 13.5, tok('m-wall'));
    B(stat, p.x + .5, p.y + 1.45, 4.9, .1, 1.2, tok('m-wall'), 12.3);
  }
  for (const d of LAY.desks) {
    const x = d.x - DESK_W / 2, y = d.y - DESK_D / 2, leg = shadeC(TT('m-desk'), .18);
    if (!shared) {
      B(stat, x + .06, y + .08, .07, DESK_D - .16, 13.5, leg); B(stat, x + DESK_W - .13, y + .08, .07, DESK_D - .16, 13.5, leg);
      const px = d.far ? x + DESK_W - .62 : x + .13;
      B(stat, px, y + .12, .48, DESK_D - .24, 13.5, tok('m-desk-edge'));
      for (const v of [4.5, 9]) B(stat, px + .04, d.far ? y + .1 : y + DESK_D - .14, .4, .04, .5, shadeC(TT('m-desk-edge'), .35), v);
      B(stat, x, y, DESK_W, DESK_D, 2.5, tok('m-desk'), 13.5, { r: .02 });
    }
    // the chair moves back from an empty desk; the laptop and mug come with a bee / 빈 책상의 의자는 물러나고, 노트북과 머그는 벌과 함께
    const ch = new THREE.Group(); chair(ch, 0, 0, 0, d.far ? -1 : 1); mergeStatic(ch); office.add(ch);
    const lap = new THREE.Group(), lx = d.x - .42, ys = d.far ? d.y + .2 : d.y - .42, toBee = d.far ? -1 : 1;
    B(lap, lx, d.far ? ys - .48 : ys, .84, .48, 1.5, tok('m-mon'), 16, { r: .01 });
    const lid = mat(TT('m-lid')), screen = mesh(lap, geo('lapscr', () => new THREE.BoxGeometry(.84, H(19), .02)), null, d.x, H(16) + H(19) / 2, ys, { material: [lid, lid, lid, lid, lid, lid], shadow: false });
    B(lap, d.x - .06, ys - (toBee > 0 ? .02 : -.01), .12, .01, 5, colOf(T.honey), 23, { shadow: false });
    C(lap, d.x + .7, d.y - .02, .065, 4.5, d.far ? '#e8eef6' : '#f4d9a8', 16);
    office.add(lap);
    dyn.desks.push({ d, ch, lap, screen, face: toBee > 0 ? 4 : 5, state: null });
  }
  if (!shared) for (const p of LAY.pods) B(office, p.x + .3, p.y + 1.48, 5.3, .05, 11, '#9fb7c9', 16, { op: .55, r: .01 });
  const slots = LAY.rows * POD_ROW;
  for (let i = LAY.pods.length; i < slots; i++) {
    const { x, y } = podAt(i);
    green(stat, x + 1.2, y + 1, 1.2); plant(stat, x + 4.6, y + 2.1, .9);
    bookshelf(stat, x + 1.6, y + 1.6, 2.6, .5, 30, i * 17);
    cooler(stat, x + 5.1, y + .9);
  }
}
// the classic plan: the work area, the rooms behind glass, the cafe, lounge, ping-pong and garden in front
// 기본 배치: 작업 공간, 유리 너머의 방, 앞쪽의 카페, 라운지, 탁구, 정원
function buildClassic(stat) {
  const { GY, LOFF, WORK_D } = LAY, frame = tok('m-wall');
  rect(stat, 0, 0, 15.6, WORK_D, tok('m-office'), .002);
  for (let y = .5; y < WORK_D; y += .5) rect(stat, 0, y - .01, 15.6, .02, mixc(tok('m-office'), shadeC(TT('m-office'), .5), .25), .0025);
  rect(stat, 16, 0, 6, ROOM_Y, tok('m-meet'), .002); rect(stat, 22, 0, 4, ROOM_Y, tok('m-mine'), .002);
  for (let y = 0; y < 6; y++) for (let x = (y % 2); x < 7; x += 2) { const d = Math.min(1, GY - 9.4 - LOFF - y); if (d > 0) rect(stat, x, 9.4 + LOFF + y, 1, d, tok('m-tile'), .003); }
  rect(stat, 20.4, 7, 5.6, GY - 7, tok('m-grass'), .003);
  disc(stat, MEET_C.x, MEET_C.y, 2.24, tok('m-rug', TT('m-meet')), .006); disc(stat, 10.2, 13.2 + LOFF, 1.93, tok('m-rug', TT('m-lounge')), .006); disc(stat, 24.8, 4.4, 1.22, tok('m-rug', TT('m-mine')), .006);
  // glass rooms (buildScene) / 유리 방
  glassPane(16, 0, 16, ROOM_Y); glassPane(22, 0, 22, ROOM_Y);
  for (let x = 16; x < 26; x++) {
    const door = Object.values(ROOMS).find(r => r.door === x);
    glassPane(x, ROOM_Y, door ? x + .1 : x + 1, ROOM_Y);
    if (!door) continue;
    B(stat, x + .04, ROOM_Y - .86, .06, .86, 40, tok('m-desk-edge'));
    B(stat, x + .96, ROOM_Y - .04, .08, .08, 44, frame);
    B(stat, x + .1, ROOM_Y - .02, .9, .04, 4, frame, 40);
  }
  for (const [x, y] of [[16, ROOM_Y], [22, 0], [22, ROOM_Y], [26, ROOM_Y]]) B(stat, x - .025, y - .025, .05, .05, 44, frame);
  for (const [x0, y0, x1, y1] of [[16, 0, 16, ROOM_Y], [22, 0, 22, ROOM_Y], [16, ROOM_Y, 26, ROOM_Y]]) B(stat, Math.min(x0, x1) - .02, Math.min(y0, y1) - .02, Math.abs(x1 - x0) + .04, Math.abs(y1 - y0) + .04, 1.5, frame, 43);
  plant(stat, 21.4, 5.4, .9); plant(stat, 25.5, 5.5, 1.1);
  // cafe / 카페
  B(stat, .3, 9.8 + LOFF, .9, 4, 17, tok('m-counter'));
  B(stat, .25, 9.75 + LOFF, 1.05, 4.1, 2, liteC(TT('m-counter'), .25), 17);
  B(stat, .55, 10.05 + LOFF, .5, .5, 14, tok('m-mon'), 18, { r: .03 });
  for (const s of SPOTS.filter(s => s.kind === 'coffee')) stool(stat, s.x, s.y);
  for (const y of [11, 13.5]) roundTable(stat, 4, y + LOFF, .45, 15);
  // sofa corner / 소파 코너
  sofaAt(stat, 7.9, 11 + LOFF, 1);
  lampAt(stat, 7.25, 11.15 + LOFF);
  green(stat, 13.6, 11.3 + LOFF, 1.2); green(stat, 6.6, 15 + LOFF, 1);
  pong(stat, 16.3, 9.7);
  // garden and bench / 정원과 벤치
  for (const [x, y, s] of [[21.6, 8.2, 1.3], [25.3, 7.8, 1.5], [25.3, 11.3, 1.2], [21, 10.6, 1], [25.5, 15, 1.3], [20.9, 14.9, 1.1]]) green(stat, x, y, s);
  bench(stat, 22.4, 12.1);
}
// a sofa for four with a low table, facing +y (f = 1) or -y (f = -1) from its back at y0
// 넷이 앉는 소파와 낮은 탁자. 등받이 y0 에서 +y (f = 1) 또는 -y (f = -1) 를 본다
function sofaAt(stat, x0, y0, f) {
  const sofa = tok('m-sofa'), cush = liteC(sofa, .14), yy = (y, d) => f > 0 ? y0 + y : y0 + .3 - y - d;
  B(stat, x0, yy(0, .3), 4.8, .3, 22, shadeC(sofa, .08), 0, { r: .06 });
  B(stat, x0, yy(.3, .9), 4.8, .9, 6, shadeC(sofa, .1), 0, { r: .04 });
  for (let i = 0; i < 3; i++) { B(stat, x0 + .05 + i * 1.6, yy(.32, .85), 1.55, .85, 4, cush, 6, { r: .06 }); B(stat, x0 + .08 + i * 1.6, yy(.3, .26), 1.5, .26, 11, cush, 10, { r: .08 }); }
  B(stat, x0 - .3, yy(0, 1.2), .3, 1.2, 15, sofa, 0, { r: .07 }); B(stat, x0 + 4.8, yy(0, 1.2), .3, 1.2, 15, sofa, 0, { r: .07 });
  const tx = x0 + 1.5, ty = yy(1.9, .7);
  for (const [lx, ly] of [[.1, .1], [1.55, .1], [.1, .55], [1.55, .55]]) B(stat, tx + lx, ty + ly, .08, .08, 7, shadeC(TT('m-desk'), .3));
  B(stat, tx, ty, 1.7, .7, 1.8, tok('m-desk'), 7, { r: .02 });
}
function lampAt(stat, x, y) { C(stat, x, y, .14, 1.2, '#3a404c'); C(stat, x, y, .025, 34, '#3a404c', 1.2); dyn.lamp = C(office, x, y, .18, 7, '#efe6d6', 34); }
function pong(stat, x, y) {
  B(stat, x, y, 2.6, 1.4, 2, tok('m-pong'), 11, { r: .01 });
  for (const [lx, ly] of [[.2, .2], [2.3, .2], [.2, 1.15], [2.3, 1.15]]) B(stat, x + lx, y + ly, .06, .06, 11, '#3a404c');
  B(stat, x + 1.28, y - .05, .04, 1.5, 5, tok('m-board'), 13, { r: .005 });
}
function bench(stat, x, y) {
  for (const lx of [.1, 1.6]) B(stat, x + lx, y + .02, .1, .41, 6, '#5b6372');
  B(stat, x, y, 1.8, .45, 2.5, tok('m-desk'), 6, { r: .02 }); B(stat, x, y, 1.8, .08, 9, tok('m-desk'), 6, { r: .02 });
}
// ── the park plan (index.html PLANS.park): a ring of curved glass round a courtyard ───────────────────────
// ── 파크 배치 (index.html PLANS.park): 안뜰을 두른 곡면 유리 링 ──────────────────────────────────────────
// on its own floor plate: a ring of terrazzo, the courtyard lawn, a gravel path, the pond, fruit trees; pods of four
// round pill-shaped white oak tables with thin displays and wooden chairs; the rooms are glass boxes with oak walls
// inside; the elevator core in stone with the plaques; the cafe bar and its long table; a lounge; olive trees
// 자기 바닥판 위에: 테라초 링, 안뜰 잔디, 자갈길, 연못, 과일나무. 알약 모양 화이트 오크 테이블에 얇은 디스플레이와
// 원목 의자를 둔 4인 포드. 방은 안쪽에 오크 벽을 둔 유리 상자. 명패를 단 석재 엘리베이터 코어. 카페 바와 긴 테이블. 라운지. 올리브 나무
const PC = () => PARK_C;
// a group at (x, y) whose +x runs along t and +z along the floor direction d / (x, y) 의 그룹, +x 는 t 방향, +z 는 바닥 방향 d
function onFloor(g, x, y, dx, dy) { const k = new THREE.Group(); k.position.set(x, 0, y); k.rotation.y = Math.atan2(dx, dy); g.add(k); return k; }
// a light wooden chair facing +z: four legs, a seat, a curved back / +z 를 보는 가벼운 원목 의자: 다리 넷, 좌판, 굽은 등받이
function woodChair(g, col = '#d9c4a0') {
  for (const [x, z] of [[-.17, -.17], [.17, -.17], [-.17, .17], [.17, .17]]) cyl(g, .022, .018, H(8.5), x, 0, z, shadeC(col, .1), { seg: 6 });
  rbox(g, .44, H(1.6), .42, 0, H(8.5), 0, col, { r: .04 });
  mesh(g, geo('chairback', () => new THREE.CylinderGeometry(.24, .24, H(5), 18, 1, true, Math.PI * .7, Math.PI * .6)), null, 0, H(10.1) + H(9), 0, { material: mat(col, { side: 1 }) });
  for (const x of [-.17, .17]) cyl(g, .018, .018, H(9), x * .9, H(10.1), -.17, shadeC(col, .1), { seg: 6 });
}
// a pill-shaped table top / 알약 모양 상판
function pill(len, wid, th) {
  const r = wid / 2, sh = new THREE.Shape();
  sh.absarc(len / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false); sh.absarc(-len / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  const e = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelThickness: .01, bevelSize: .015, bevelSegments: 2, curveSegments: 16 });
  e.rotateX(Math.PI / 2); e.translate(0, th, 0); return e;
}
function olive(g, x, y, s = 1) {   // an olive tree in a round concrete planter / 둥근 콘크리트 화분의 올리브 나무
  cyl(g, .42 * s, .38 * s, H(12 * s), x, 0, y, '#d6d3cc', { seg: 20 });
  cyl(g, .38 * s, .38 * s, .01, x, H(12 * s), y, '#6b5a45', { seg: 20, shadow: false });
  cyl(g, .035 * s, .06 * s, H(26 * s), x, H(12 * s), y, '#7a6a55', { seg: 6 });
  for (const [dx, dz, dy, r] of [[0, 0, 40, .5], [-.3, .15, 33, .36], [.3, -.1, 35, .36], [.1, .2, 47, .32], [-.15, -.2, 44, .3]]) leaf(g, r * s, x + dx * s, H(dy * s), y + dz * s, dx > 0 ? '#8fa27a' : '#9cad86');
}
function fruitTree(g, x, y, s = 1) {   // a little apricot tree in the courtyard / 안뜰의 작은 살구나무
  cyl(g, .06 * s, .1 * s, H(18 * s), x, 0, y, tok('o-trunk'));
  for (const [dx, dz, dy, r] of [[0, 0, 26, .55], [-.3, .2, 22, .4], [.32, -.12, 23, .4], [0, .1, 34, .38]]) leaf(g, r * s, x + dx * s, H(dy * s), y + dz * s, dx ? tok('o-leaf2') : tok('o-leaf'));
  for (let i = 0; i < 7; i++) { const a = i * 2.3; ball(g, .05, x + Math.cos(a) * .42 * s, H((22 + (i % 3) * 5) * s), y + Math.sin(a) * .42 * s, '#f0a040', { shadow: false }); }
}
function glassBox(stat, x0, y0, x1, y1, gap) {   // a glass room; gap: [side, from, to] of its door / 유리방. gap: 문의 [변, 부터, 까지]
  const sides = { top: [[x0, y0], [x1, y0]], bottom: [[x0, y1], [x1, y1]], left: [[x0, y0], [x0, y1]], right: [[x1, y0], [x1, y1]] }, frame = '#b9bec5';
  for (const [k, [a, b]] of Object.entries(sides)) {
    const along = a[0] === b[0] ? 1 : 0, lo = a[along], hi = b[along];
    const parts = gap && gap[0] === k ? [[lo, gap[1]], [gap[2], hi]] : [[lo, hi]];
    for (const [u0, u1] of parts) along ? glassPane(a[0], u0, a[0], u1) : glassPane(u0, a[1], u1, a[1]);
    along ? B(stat, a[0] - .02, lo, .04, hi - lo, 1.5, frame, 43) : B(stat, lo, a[1] - .02, hi - lo, .04, 1.5, frame, 43);
  }
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) B(stat, x - .03, y - .03, .06, .06, 44, frame);
  if (gap) {   // the door, open into the room / 방 안쪽으로 열린 문
    const [k, a] = gap;
    if (k === 'bottom') B(stat, a + .04, y1 - .86, .05, .86, 40, '#e8ddc8'); else if (k === 'left') B(stat, x0, a + .04, .86, .05, 40, '#e8ddc8');
  }
}
// an oak wall panel from a along d (n faces out), what hangs on it painted sharp / 오크 벽 패널, a 에서 d 방향 (n 쪽이 앞). 걸린 것은 또렷하게
function panel(name, a, d, len, h, n) {
  const g = new THREE.Group(); office.add(g);
  const tex = canvasTex(Math.round(len * PT), Math.round(h * PT / HPX));
  rbox(g, len, H(h), .06, a[0] + d[0] * len / 2 - n[0] * .035, 0, a[1] + d[1] * len / 2 - n[1] * .035, '#cdb48c', { r: .01 }).rotation.y = -Math.atan2(d[1], d[0]);
  quad(g, a, d, n, 0, len, 0, h, tex, .002);
  const w = { g, n: null, a, d, parts: [{ S: surface(tex, PT, 0, h), tex, paint: S => { S.c.fillStyle = '#d6bf98'; S.c.fillRect(0, 0, S.c.canvas.width, S.c.canvas.height);
    S.c.fillStyle = 'rgba(120, 90, 50, .12)'; for (let u = .3; u < len; u += .3) S.c.fillRect(sx(S, u), 0, 2, S.c.canvas.height); } }] };
  dyn.walls.push(w); return [name, w];
}
function buildPark(stat) {
  const CC = PC(), RO = PARK_R, RI = PARK_IN, frame = '#b9bec5';
  dyn.walls = []; dyn.paintAt = {}; dyn.desks = [];
  // the floor plate: terrazzo ring, a stone edge, the courtyard / 바닥판: 테라초 링, 돌 테두리, 안뜰
  const plate = mesh(stat, geo(`pl${RO}`, () => new THREE.CylinderGeometry(RO + .25, RO + .25, .08, 96)), tok('m-lounge'), CC.x, -.08, CC.y, { shadow: false });
  const tz = dyn.terrazzo || mat(tok('m-lounge'));
  const ringFloor = new THREE.Mesh(new THREE.RingGeometry(RI, RO, 96, 1), tz); ringFloor.rotation.x = -Math.PI / 2; ringFloor.position.set(CC.x, .002, CC.y); ringFloor.receiveShadow = true; ringFloor.userData.keep = true; ringFloor.userData.merged = true; office.add(ringFloor);
  mesh(stat, geo(`cy${RI}`, () => new THREE.CircleGeometry(RI, 72)), '#a9c98e', CC.x, .003, CC.y, { rot: [-Math.PI / 2, 0, 0], shadow: false });
  mesh(stat, geo(`gr${RI}`, () => new THREE.RingGeometry(4.9, 5.7, 72)), '#ddd5c4', CC.x, .005, CC.y, { rot: [-Math.PI / 2, 0, 0], shadow: false });
  mesh(stat, geo(`cb${RI}`, () => new THREE.CylinderGeometry(RI + .12, RI + .12, H(3), 72, 1, true)), '#d9d4cb', CC.x, 0, CC.y, { material: mat('#d9d4cb', { side: 1 }) });
  // the pond, with a stone rim / 돌 테두리의 연못
  cyl(stat, 1.42, 1.42, H(2.5), 17.8, 0, 17.6, '#d6d0c4', { seg: 40 });
  cyl(stat, 1.28, 1.28, H(2.6), 17.8, 0, 17.6, '#7fb8d8', { seg: 40, shadow: false, rough: .1 });
  for (const [x, y, k] of [[13.4, 13.4, 1], [19.6, 12.2, 1], [13.8, 19.4, .9], [11.6, 16.6, .95], [20.9, 15.4, .85], [16.1, 11.6, .9], [18.7, 20.4, .85]]) fruitTree(stat, x, y, k);
  for (const d of [150, 210, 260, 320]) {   // benches behind the courtyard seats / 안뜰 자리 뒤의 벤치
    const a = d * Math.PI / 180, b = onFloor(stat, CC.x + Math.cos(a) * 5.25, CC.y + Math.sin(a) * 5.25, -Math.cos(a), -Math.sin(a));
    rbox(b, 1.4, H(2.4), .42, 0, H(6.5), 0, '#cdb48c', { r: .03 }); for (const x of [-.55, .55]) rbox(b, .08, H(6.5), .36, x, 0, 0, '#9aa1ab', { r: .01 });
  }
  // the outer glass: curved, in segments; the near ones are left open like the page's walls / 바깥 유리: 곡면, 조각으로. 가까운 쪽은 페이지의 벽처럼 열어 둔다
  const gtex = canvasTex(Math.round(PT * 1.6), Math.round(WALL * PT / HPX)), N = 64;
  dyn.walls.push({ g: new THREE.Group(), n: null, parts: [{ S: surface(gtex, PT, 0, WALL), tex: gtex, paint: S => {
    const c = S.c; c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    c.fillStyle = LIGHT < .55 && settings.lights !== 'off' ? 'rgba(255, 236, 200, .3)' : 'rgba(200, 222, 236, .24)'; c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    wallRect(S, 0, 0, .05, WALL, frame); wallRect(S, 1.55, 0, .05, WALL, frame); wallRect(S, 0, 0, 1.6, 2.5, frame); wallRect(S, 0, WALL - 3, 1.6, WALL, frame); wallRect(S, 0, 34, 1.6, 35.2, frame); } }] });
  dyn.ring = [];
  for (let i = 0; i < N; i++) {
    const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2, am = (a0 + a1) / 2, g = new THREE.Group(); office.add(g);
    const p0 = [CC.x + Math.cos(a0) * RO, CC.y + Math.sin(a0) * RO], p1 = [CC.x + Math.cos(a1) * RO, CC.y + Math.sin(a1) * RO], len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const d = [(p1[0] - p0[0]) / len, (p1[1] - p0[1]) / len], n = [-Math.cos(am), -Math.sin(am)];
    const q = quad(g, p0, d, n, 0, len, 0, WALL, gtex, 0, true); q.userData.tex = null;
    rbox(g, len + .02, .05, .1, (p0[0] + p1[0]) / 2, H(WALL), (p0[1] + p1[1]) / 2, frame, { r: .01, shadow: false }).rotation.y = -Math.atan2(d[1], d[0]);
    dyn.ring.push({ g, n });
  }
  // the elevator core, stone, its doors and the plaques on its east face / 엘리베이터 코어, 석재, 동쪽 면에 문과 명패
  B(stat, 1.5, 12, 1.5, 8, WALL, '#e4e0d8', 0, { r: .03 });
  const walls = Object.fromEntries([
    (() => { const w = { g: new THREE.Group(), n: null, a: [3.0, 12], d: [0, 1], parts: [] }; office.add(w.g); dyn.walls.push(w);
      const tex = canvasTex(Math.round(8 * PT), Math.round(WALL * PT / HPX)); quad(w.g, w.a, w.d, [1, 0], 0, 8, 0, WALL, tex, .003);
      w.parts.push({ S: surface(tex, PT, 0, WALL), tex, paint: S => { S.c.fillStyle = '#e8e4dc'; S.c.fillRect(0, 0, S.c.canvas.width, S.c.canvas.height);
        wallRect(S, 3.3, 0, 1.4, 52, '#b9bec5'); wallRect(S, 3.4, 0, .58, 48, '#d3d7dc'); wallRect(S, 4.02, 0, .58, 48, '#d3d7dc'); } });
      return ['core', w]; })(),
    panel('bossPanel', [21.2, 4.82], [1, 0], 4.8, 62, [0, 1]),
    panel('meetPanel', [24.94, 10.32], [1, 0], 4.8, 62, [0, 1]),
    panel('barPanel', [12, 23.25], [1, 0], 8, 60, [0, 1]),
  ]);
  for (const [name, u0, u1, v0, v1, paint] of hangings()) {
    const w = walls[name]; if (!w) continue;
    const tex = canvasTex(Math.max(8, Math.round((u1 - u0) * DK)), Math.max(8, Math.round(H(v1 - v0) * DK)));
    quad(w.g, w.a, w.d, name === 'core' ? [1, 0] : [0, 1], u0, u1, v0, v1, tex, .008);
    w.parts.push({ S: surface(tex, DK, u0, v1), tex, paint });
  }
  // the rooms / 방
  rect(stat, 21.1, 4.76, 5, 4.4, '#efe9df', .004); rect(stat, 24.84, 10.25, 5, 5, '#eeebe5', .004);
  glassBox(stat, 21.1, 4.76, 26.1, 9.16, ['bottom', 22.4, 23.4]);
  glassBox(stat, 24.84, 10.25, 29.84, 15.25, ['left', 13.6, 14.6]);
  // the boss: an oak desk with the question window, a chair, the shelf of jars / 사장: 질문 창구의 오크 책상, 의자, 꿀단지 선반
  rbox(stat, 1.7, H(1.5), .75, 24.85, H(15), 6.75, '#e2d3b5', { r: .03 }); B(stat, 24.05, 6.45, 1.6, .06, 14, '#cdb48c'); for (const x of [24.1, 25.6]) B(stat, x, 6.4, .06, .7, 15, '#b9bec5');
  const bc = onFloor(stat, 24.85, 5.6, 0, 1); woodChair(bc, '#c9a77a');
  B(stat, SHELF.x, SHELF.y, SHELF.w, SHELF.d, SHELF.h, '#cdb48c');
  const sign = canvasTex(256, 64), sg2 = sign.image.getContext('2d');
  sg2.fillStyle = colOf(T.wait); sg2.beginPath(); sg2.roundRect(2, 2, 252, 60, 30); sg2.fill();
  sg2.fillStyle = '#1b1300'; sg2.font = `700 30px ${TT('f-body')}`; sg2.textAlign = 'center'; sg2.textBaseline = 'middle'; sg2.fillText(tr('질문 창구', 'Questions'), 128, 34);
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.25, .31), new THREE.MeshStandardMaterial({ map: sign, transparent: true, side: THREE.DoubleSide }));
  sm.position.set(24.85, H(46), 7.15); sm.userData.tex = sign; office.add(sm);
  dyn.jars = new THREE.Group(); office.add(dyn.jars); dyn.jarN = -1;
  olive(stat, 25.6, 8.55, .7);
  // the meeting room: an oval oak table and chairs round it / 회의실: 타원 오크 탁자와 둘레 의자
  mesh(stat, geo('oval', () => { const e = pill(2.6, 1.7, .06); return e; }), '#e2d3b5', MEET_C.x, H(14.5), MEET_C.y);
  cyl(stat, .07, .07, H(14.5), MEET_C.x, 0, MEET_C.y, '#b9bec5', { seg: 10 }); cyl(stat, .45, .45, .02, MEET_C.x, 0, MEET_C.y, '#b9bec5', { seg: 24 });
  for (const p of MEET_CHAIRS) woodChair(onFloor(stat, p.x, p.y, MEET_C.x - p.x, MEET_C.y - p.y));
  olive(stat, 29.1, 14.6, .65);
  // the pods / 포드
  for (const p of LAY.pods) {
    // the table runs along the ring (t): a group turned so its +x is t / 테이블은 링을 따라 (t): +x 가 t 가 되게 돌린 그룹
    const t = [-Math.sin(p.a), Math.cos(p.a)], g = onFloor(stat, p.cx, p.cy, 0, 1); g.rotation.y = -Math.atan2(t[1], t[0]);
    const col = tok(podTeam(p) ? 'm-team' : p.oi === 0 ? 'm-zone' : 'm-zone-remote', '#e7e3dc');
    mesh(g, geo('podrug', () => pill(7, 3.6, .004)), col, 0, .004, 0, { shadow: false });
    mesh(g, geo('podtop', () => pill(5.8, 1.5, .06)), '#e8dcc4', 0, H(14.6), 0);
    for (const x of [-2, 2]) { cyl(g, .05, .05, H(14.6), x, 0, 0, '#b9bec5', { seg: 10 }); cyl(g, .32, .32, .02, x, 0, 0, '#b9bec5', { seg: 20 }); }
  }
  for (const d of LAY.desks) {
    // a thin display facing the seat, a keyboard and a mug that come with a bee, the chair / 자리를 보는 얇은 디스플레이, 벌과 함께 오는 키보드와 머그, 의자
    const tb = [d.look[0], d.look[1]], g = onFloor(office, d.x, d.y, -tb[0], -tb[1]);
    const dark = mat('#2a2e37'), alu = mat('#c9cdd3'), z0 = -.25, top = H(14.6) + .06;
    const screen = mesh(g, geo('imac', () => new THREE.BoxGeometry(.66, .4, .025)), null, 0, top + H(6) + .27, z0, { material: [alu, alu, alu, alu, dark, alu] });
    rbox(g, .66, .07, .028, 0, top + H(6), z0, '#c9cdd3', { r: .008 });
    cyl(g, .018, .018, H(6), 0, top, z0 - .04, '#c9cdd3', { seg: 6 }); rbox(g, .2, .01, .16, 0, top, z0 - .02, '#c9cdd3', { r: .004 });
    const lap = new THREE.Group(); g.add(lap);
    rbox(lap, .42, .012, .14, 0, top, .12, '#e9eaec', { r: .004 }); cyl(lap, .055, .055, H(4.5), .38, top, .05, '#f4f1ea', { seg: 10 });
    const ch = onFloor(office, d.seat.x, d.seat.y, d.look[0], d.look[1]); woodChair(ch); mergeStatic(ch);
    dyn.desks.push({ d, ch, lap, screen, face: 4, state: null });
  }
  for (let i = LAY.pods.length; i < 3; i++) {   // where a pod could be: a long bench and an olive / 포드 자리: 긴 벤치와 올리브
    const { cx, cy, a } = podAt(i), g = onFloor(stat, cx, cy, 0, 1); g.rotation.y = -Math.atan2(Math.cos(a), -Math.sin(a));
    rbox(g, 3.4, H(2.5), .5, 0, H(6.5), 0, '#cdb48c', { r: .03 }); for (const x of [-1.4, 1.4]) rbox(g, .1, H(6.5), .4, x, 0, 0, '#9aa1ab', { r: .01 });
    olive(g, 2.4, 0, .9);
  }
  // the cafe: a stone bar, stools, a long oak table with benches, an espresso machine / 카페: 석재 바, 스툴, 벤치 놓인 긴 오크 탁자, 에스프레소 머신
  B(stat, 12, 23.6, 8, .8, 16, '#e6e2da', 0, { r: .04 }); B(stat, 11.95, 23.55, 8.1, .9, 1.6, '#f4f2ee', 16, { r: .04 });
  B(stat, 18.4, 23.75, .7, .45, 10, '#b9bec5', 17.6, { r: .04 }); B(stat, 13, 23.75, .35, .35, 7, '#cdb48c', 17.6, { r: .05 });
  for (const s2 of SPOTS.filter(s2 => s2.kind === 'coffee')) { cyl(stat, .17, .17, H(2), s2.x, H(10), s2.y, '#cdb48c', { seg: 16 }); cyl(stat, .025, .025, H(10), s2.x, 0, s2.y, '#b9bec5', { seg: 6 }); cyl(stat, .14, .14, .02, s2.x, 0, s2.y, '#b9bec5', { seg: 14 }); }
  B(stat, 12, 26.75, 8.6, .9, 2, '#e8dcc4', 13.5, { r: .04 }); for (const x of [12.6, 19.9]) B(stat, x, 26.85, .08, .7, 13.5, '#b9bec5');
  for (const y of [26.05, 28.0]) { B(stat, 12.4, y, 7.8, .35, 2, '#cdb48c', 7.5, { r: .03 }); for (const x of [12.6, 19.8]) B(stat, x, y + .05, .07, .25, 7.5, '#b9bec5'); }
  // the lounge: two sofas facing over a round table, a lamp / 라운지: 둥근 탁자를 사이에 둔 마주 보는 소파 둘, 조명
  const sofa = '#cfc6b6';
  for (const [y0, f] of [[22.05, 1], [26.35, -1]]) {
    const g = onFloor(stat, 7.5, y0 + f * .55, 0, f);
    rbox(g, 3.1, H(7), .95, 0, 0, 0, shadeC(sofa, .08), { r: .12 }); rbox(g, 3.0, H(4), .85, 0, H(7), .05, liteC(sofa, .12), { r: .1 });
    rbox(g, 3.1, H(13), .28, 0, H(5), -.42, sofa, { r: .12 }); for (const x of [-1.55, 1.55]) rbox(g, .26, H(11), .95, x, 0, 0, sofa, { r: .1 });
  }
  cyl(stat, .55, .55, H(2), 7.5, H(7), 24.2, '#e8dcc4', { seg: 28 }); cyl(stat, .1, .1, H(7), 7.5, 0, 24.2, '#b9bec5', { seg: 10 });
  C(stat, 9.6, 22.4, .14, 1.2, '#3a404c'); C(stat, 9.6, 22.4, .02, 34, '#3a404c', 1.2); dyn.lamp = C(office, 9.6, 22.4, .2, 6, '#efe6d6', 34);
  // ping-pong / 탁구대
  pong(stat, 21.6, 25.1);
  // olive trees by the glass, all round / 유리 곁을 따라 올리브 나무
  for (const dg of [-150, -125, -100, -75, 10, 35, 70, 110, 140, 155]) { const a = dg * Math.PI / 180; olive(stat, CC.x + Math.cos(a) * 14.5, CC.y + Math.sin(a) * 14.5, .9); }
  // the lobby: a stone bench / 로비: 돌 벤치
  B(stat, 4.2, 12.6, 2.4, .5, 7, '#e6e2da', 0, { r: .06 });
}

// ── the roof, fading in as the view pulls out (drawRoof) / 지붕. 멀어지면 서서히 덮인다 (drawRoof) ─────────────
let roofG = null;
function buildRoof() {
  drop(roofG);
  roofG = new THREE.Group(); root.add(roofG);
  const { GY } = LAY, own = new Map(), top = WALL + 8, stat = new THREE.Group(); roofG.add(stat);
  const m = col => { if (!own.has(col)) own.set(col, new THREE.MeshStandardMaterial({ color: colOf(col), roughness: .85 })); return own.get(col); };
  const box = (x, y, w, d, h, col, z = 0) => B(stat, x, y, w, d, h, null, z, { material: m(col), r: .02 });
  const face = tok('m-wallface'), win = m(T.win);
  if (LAY.plan === 'park') {   // a ring: curved walls, a ring of roof with solar panels round the open courtyard / 링: 곡면 벽, 열린 안뜰을 두른 링 지붕과 태양광 패널
    const C = PARK_C, RO = PARK_R, RI = PARK_IN;
    for (const [r, col] of [[RO, liteC(TT('m-window'), .35)], [RI, liteC(TT('m-window'), .5)]]) mesh(stat, new THREE.CylinderGeometry(r, r, H(WALL), 96, 1, true), null, C.x, H(WALL) / 2, C.y, { material: m(col), shadow: false }).material.side = THREE.DoubleSide;
    mesh(stat, new THREE.CylinderGeometry(RO + .5, RO + .5, H(8), 96, 1, true), null, C.x, H(WALL + 4), C.y, { material: m(tok('o-roof2')) });
    mesh(stat, new THREE.RingGeometry(RI - .2, RO + .5, 96, 1), null, C.x, H(top) + .003, C.y, { material: m(tok('o-roof')), rot: [-Math.PI / 2, 0, 0], shadow: false });
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; for (const r of [RI + 2.2, RI + 5.2]) { const p2 = mesh(stat, geo('panel', () => new THREE.PlaneGeometry(1.6, 2)), null, C.x + Math.cos(a) * r, H(top) + .006, C.y + Math.sin(a) * r, { material: m('#2b3b58'), shadow: false }); p2.rotation.set(-Math.PI / 2, 0, -a + Math.PI / 2); } }
  } else {
  box(0, 0, GX, .12, WALL, face); box(0, GY - .12, GX, .12, WALL, face); box(0, 0, .12, GY, WALL, face); box(GX - .12, 0, .12, GY, WALL, face);
  for (let u = 1; u < GX - 1.5; u += 2.6) for (const y of [-.02, GY - .01]) B(stat, u, y, 1.6, .03, 34, null, 22, { material: win, r: .005 });
  for (let u = 1; u < GY - 1.5; u += 2.6) for (const x of [-.02, GX - .01]) B(stat, x, u, .03, 1.6, 34, null, 22, { material: win, r: .005 });
  box(-.4, -.4, GX + .8, GY + .8, 8, tok('o-roof2'), WALL);
  mesh(stat, new THREE.PlaneGeometry(GX - .8, GY - .8), null, GX / 2, H(top) + .003, GY / 2, { material: m(tok('o-roof')), rot: [-Math.PI / 2, 0, 0], shadow: false });
  for (let x = 2; x < GX - 3; x += 4) for (const y of [2.5, GY - 4.5]) mesh(stat, geo('sky2', () => new THREE.PlaneGeometry(2, 1.6)), null, x + 1, H(top) + .006, y + .8, { material: m(modern() ? '#2b3b58' : liteC(TT('m-window'), .3)), rot: [-Math.PI / 2, 0, 0], shadow: false });
  box(GX - 4.5, GY / 2 - 1, 2, 2, 12, tok('m-chair'), top);
  box(3, GY / 2 - .7, 1.2, 1.2, 14, tok('o-hive'), top); box(2.9, GY / 2 - .8, 1.4, 1.4, 3, tok('m-counter'), top + 14);
  }
  mergeStatic(stat);
  // the name painted on the roof, turned to read across the screen / 지붕에 칠한 이름, 화면 가로로 읽히게 돌린다
  const tex = canvasTex(1920, 320), name = new THREE.Mesh(new THREE.PlaneGeometry(30, 5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  name.matrixAutoUpdate = false; name.renderOrder = 10; name.userData.tex = tex; roofG.add(name);
  roofG.userData = { mats: [...own.values()], win, name, tex, text: '' };
}
function roofUp(k) {
  roofG.visible = k > 0;
  if (!roofG.visible) return;
  const u = roofG.userData, solid = k >= 1;
  for (const m of u.mats) { if (m.transparent === solid) { m.transparent = !solid; m.depthWrite = solid; m.needsUpdate = true; } m.opacity = k; }
  u.win.color.set(colOf(T.win)); u.name.material.opacity = k;
  const n = [...bees.values()].filter(b => b.state === 'run').length, w = [...bees.values()].filter(b => b.state === 'wait').length;
  const host = offices[0] ? offices[0].host : 'hivemux', sub = `${tr(`${n}마리 일하는 중`, `${n} working`)}${w ? ' · ' + tr(`${w}마리 기다림`, `${w} waiting`) : ''}`;
  if (u.text !== host + sub + modern()) {
    u.text = host + sub + modern(); const c = u.tex.image.getContext('2d');
    c.clearRect(0, 0, 1920, 320); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 128px ${TT('f-body')}`; c.fillStyle = modern() ? 'rgba(70, 78, 92, .8)' : 'rgba(255, 255, 255, .85)'; c.fillText(host, 960, 110, 1880);
    c.font = `700 80px ${TT('f-body')}`; c.fillStyle = modern() ? 'rgba(70, 78, 92, .65)' : 'rgba(255, 255, 255, .7)'; c.fillText(sub, 960, 240, 1880);
    u.tex.needsUpdate = true;
  }
  // across the screen and up it, as floor directions / 화면 가로와 위쪽을 바닥 방향으로
  const r = Math.SQRT1_2, ux = (COS - SIN) * r, uy = (-SIN - COS) * r, vx = (-COS - SIN) * r, vy = (SIN - COS) * r;
  const ks = LAY.plan === 'park' ? .42 : 1;   // smaller on the ring / 링 위에선 작게
  u.name.matrix.makeBasis(new THREE.Vector3(ux * ks, 0, uy * ks), new THREE.Vector3(vx * ks, 0, vy * ks), new THREE.Vector3(0, 1, 0)).setPosition(GX / 2, H(WALL + 8) + .01, LAY.plan === 'park' ? 4.2 : LAY.GY / 2);
}

// ── outside (drawYard, yardItems) / 바깥 ─────────────────────────────────────────────────────
let outside = null, outSig = '';
function tree(g, x, y, s = 1) {
  cyl(g, .1 * s, .16 * s, H(20 * s), x, 0, y, tok('o-trunk'));
  const top = H(20 * s);
  for (const [dx, dh, r, k] of [[0, 0, 15, 0], [-8, 9, 12, 1], [8, 10, 11, 1], [0, 20, 11, 0]]) leaf(g, H(r * s) * 1.1, x + dx / 45 * s, top + H(dh * s), y - dx / 90 * s, k ? tok('o-leaf2') : tok('o-leaf'));
}
function lamp(g, x, y) { C(g, x, y, .06, 46, tok('m-wall')); dyn.bulbs.push(C(outside, x, y, .1, 6, '#e8e2d0', 46, { shadow: false })); }
function roofOn(g, x, y, w, d, h, r, ridge, wall, roof, style) {
  B(g, x, y, w, d, h, wall, 0, { r: .03 });
  const o = .15, Hh = H(h), R = H(r);
  if (style === 'flat' || !r) { B(g, x - .05, y - .05, w + .1, d + .1, 4, shadeC(roof, .1), h, { r: .02 }); return; }
  if (style === 'hip') {
    const gm = geo('hip', () => { const c = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); c.rotateY(Math.PI / 4); c.translate(0, .5, 0); return c; });
    mesh(g, gm, roof, x + w / 2, Hh, y + d / 2, { scale: [w + 2 * o, R, d + 2 * o] }); return;
  }
  // a gable (a barn's is broken) across the ridge, pushed along it; the ends in the wall colour
  // 용마루를 가로지르는 박공 (헛간은 꺾인 단면) 을 용마루 따라 민다. 끝은 벽 색
  const across = (ridge === 'x' ? d : w), along = (ridge === 'x' ? w : d);
  const prof = style === 'barn' ? [[0, 0], [.2, .6], [.5, 1], [.8, .6], [1, 0]] : [[0, 0], [.5, 1], [1, 0]];
  const prism = (half, depth, k, col) => {
    const sh = new THREE.Shape(); prof.forEach(([t, v], i) => i ? sh.lineTo(-half + 2 * half * t, R * v * k) : sh.moveTo(-half + 2 * half * t, R * v * k));
    const gm = geo(`gab${style}${f3(half)},${f3(depth)},${f3(R * k)}`, () => { const e = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 1 }); e.translate(0, 0, -depth / 2); return e; });
    const m = mesh(g, gm, col, x + w / 2, Hh, y + d / 2); if (ridge === 'x') m.rotation.y = Math.PI / 2;
  };
  prism(across / 2 + o, along + 2 * o, 1, roof);
  prism(across / 2, along - .02, .97, wall);
}
function buildOutside() {
  drop(outside);
  outside = new THREE.Group(); root.add(outside);
  const stat = new THREE.Group(); outside.add(stat);
  const { GY, LOFF } = LAY, E = YARD, wild = wildItems(), py = pathY(), lift = -.075;
  dyn.bulbs = []; dyn.homes = []; dyn.night = null; dyn.winKey = null;
  const gnd = mesh(outside, geo('ground', () => new THREE.PlaneGeometry(400, 400)), tok('o-grass'), GX / 2, lift - .006, GY / 2, { rot: [-Math.PI / 2, 0, 0], shadow: false, rough: .95 });
  for (const [x, y, light] of wild.patches) disc(stat, x, y, 1.17, light ? mixc(tok('o-wild'), tok('o-grass'), .5) : tok('o-wild2'), lift - .005);
  // the river: a bank and the water, a piece at a time / 강: 둑과 물, 마디마다
  const river = [[-30, GY + 9], [-8, GY + 6.5], [2, GY + 7.5], [12, GY + 5.2], [22, GY + 6.5], [GX + 5, GY + 3], [GX + 9, 4], [GX + 30, -10]];
  for (const [w, col, dl] of [[1.37, tok('o-path'), .001], [.97, tok('o-river'), .002]]) {
    for (let i = 0; i < river.length - 1; i++) {
      const [x0, y0] = river[i], [x1, y1] = river[i + 1], len = Math.hypot(x1 - x0, y1 - y0);
      const m = mesh(stat, new THREE.PlaneGeometry(len, w), col, (x0 + x1) / 2, lift - .004 + dl, (y0 + y1) / 2, { shadow: false });
      m.rotation.set(-Math.PI / 2, 0, -Math.atan2(y1 - y0, x1 - x0));
      if (i) disc(stat, x0, y0, w / 2, col, lift - .004 + dl);
    }
  }
  if (LAY.plan === 'park') mesh(stat, geo('plaza', () => new THREE.CircleGeometry(PARK_R + 1.4, 96)), tok('o-path'), PARK_C.x, lift - .002, PARK_C.y, { rot: [-Math.PI / 2, 0, 0], shadow: false });
  else rect(stat, -1, -1, GX + 2, GY + 2, tok('o-path'), lift - .002);
  rect(stat, -E, py - .6, E, 1.2, tok('o-path'), lift - .001);
  rect(stat, 12.3, GY, 1.2, E, tok('o-path'), lift - .001);
  const vill = houses().length;
  if (vill) {
    const vx = villageEnd(); rect(stat, vx, py - .6, -E - vx, 1.2, tok('o-path'), lift - .001);
    for (let k = 0; k < VILL.blocks; k++) rect(stat, LANE(k) - .45, py - 8.8, .9, 17.6, tok('o-path'), lift);
    const pk = PARK(); disc(stat, pk.x + pk.w / 2, pk.y + pk.d / 2, 2.7, mixc(tok('o-grass'), '#ffffff', .18), lift - .0005);
    rect(stat, -9.8, py - 3.5, 2.6, 2.5, tok('o-path'), lift - .0005);
  }
  // yard things / 마당의 것들
  const yardTrees = [[-4, -3, 1.2], [-5.2, 5, 1], [-3.5, 14, 1.3], [5, -4.5, 1.1], [13, -5.2, 1.3], [21, -4, 1], [GX + 4, 2, 1.2], [GX + 5, 9, 1], [GX + 3.5, GY + 4, 1.3],
    [18, GY + 4.5, 1.1], [6, GY + 5, 1.2], [-4.5, GY + 3.5, 1]];
  if (modern()) {   // an orchard: trees in rows round the building / 과수원: 건물을 두른 줄나무
    yardTrees.length = 0;
    for (let x = -3; x <= GX + 3; x += 2.6) yardTrees.push([x, -3.2, .85]);
    for (let y = -.6; y <= GY + 3; y += 2.6) { if (Math.abs(y - py) > 1.6) yardTrees.push([-3.4, y, .85]); if (y < 11 || y > 15.5) yardTrees.push([GX + 3.4, y, .85]); }
    for (let x = -.4; x <= GX; x += 2.6) if (Math.abs(x - 12.9) > 1.6) yardTrees.push([x, GY + 3, .85]);
  }
  for (const [x, y, s] of yardTrees) tree(stat, x, y, s);
  for (const [x, y] of [[-2.2, py - 1.4], [-2.2, py + 1.8], [11.4, GY + 1.6], [14.4, GY + 4.6]]) lamp(stat, x, y);
  for (const y of [12.6, 14.2]) { const x = GX + 2.6; B(stat, x - .35, y - .35, .7, .7, 14, tok('o-hive'), 0, { r: .03 }); B(stat, x - .42, y - .42, .84, .84, 3, tok('m-counter'), 14, { r: .02 }); }
  const cols = [colOf(T.alert), colOf(T.honey), '#e889c4', '#ffffff', '#9b7de0'];
  for (const [x, y] of [[-3, 2], [GX + 3, 5.5], [9, -2.6], [3, GY + 3], [GX + 4.5, GY + 1.5]]) for (let i = 0; i < 14; i++) { const a = i * 2.4, r = .25 + (i % 5) * .13; ball(stat, .06, x + Math.cos(a) * r, .04, y + Math.sin(a) * r, cols[i % cols.length], { shadow: false }); }
  B(stat, -4.4, py + 3.2, 1.6, .45, 8, tok('m-desk'), 0, { r: .03 });
  for (const [x, y, kind, s] of wild.out) {
    if (kind === 'tree') { if (!modern() || x < -5.5 || x > GX + 5.5 || y < -5.5 || y > GY + 5.5) tree(stat, x, y, s); }
    else if (kind === 'bush') leaf(stat, .3 * s, x, .1, y, tok('o-leaf2'), { scale: [1.3, .8, 1] });
    else for (let i = 0; i < 6; i++) { const a = i * 2.4; ball(stat, .05, x + Math.cos(a) * .15, .05, y + Math.sin(a) * .1, cols[(((i + Math.floor(x)) % 4) + 4) % 4], { shadow: false }); }
  }
  // the village: houses, the pub, the park / 마을: 집, 펍, 공원
  for (const e of houses()) {
    const h = e.h, style = styleOf(h), [Hp, Rp] = STYLES[style], gone = !!e.r.left;
    const wall = gone ? '#d8d3cb' : HOUSE_COLS[h.seed % HOUSE_COLS.length], roof = gone ? '#9a948c' : ROOF_COLS[(h.seed * 3 + 1) % ROOF_COLS.length];
    roofOn(stat, h.x, h.y, h.w, h.d, Hp, Rp, h.ridge, wall, roof, style);
    if (style === 'chimney') B(stat, h.x + h.w * .72, h.y + h.d * .28, .35, .35, Rp + 10, '#9a4f3a', Hp);
    if (style === 'cottage') {   // a little roof over the door / 문 위 작은 차양
      const [fx, fy] = h.face, cx = fx ? (fx > 0 ? h.x + h.w : h.x) : h.x + h.w / 2, cy = fy ? (fy > 0 ? h.y + h.d : h.y) : h.y + h.d / 2, ax = fx ? .5 : 1.1, ay = fy ? .5 : 1.1;
      B(stat, cx - (fx < 0 ? ax : fx > 0 ? 0 : ax / 2), cy - (fy < 0 ? ay : fy > 0 ? 0 : ay / 2), ax, ay, 2, shadeC(roof, .05), 18);
    }
    // the door and windows on the side facing the lane (u along it, as the page paints) / 골목 쪽 면의 문과 창 (u 는 페이지가 칠하는 방향)
    const [fx, fy] = h.face, len = h.ridge === 'y' ? h.d : h.w;
    const at = (u, v0, w, v1, col, g = stat) => fy
      ? B(g, h.x + u, fy > 0 ? h.y + h.d - .01 : h.y - .02, w, .03, v1 - v0, col, v0, { r: .005, shadow: false })
      : B(g, fx > 0 ? h.x + h.w - .01 : h.x - .02, h.y + u, .03, w, v1 - v0, col, v0, { r: .005, shadow: false });
    at(len / 2 - .28, 0, Math.min(.56, len * .2), Math.min(17, Hp - 1), '#6b4a2e');
    const win = (u, v0, w, v1) => { const m = at(u, v0, w, v1, colOf(T.win), outside); m.userData.home = e.key; dyn.homes.push(m); };
    if (style === 'flat') win(.3, 6, len / 2 - .7, 24); else { win(.35, 9, .6, 18); win(len - .95, 9, .6, 18); }
    if (style === 'twostory') { win(.35, 30, .6, 39); win(len / 2 - .3, 30, .6, 39); win(len - .95, 30, .6, 39); }
  }
  if (vill) {
    const q = PUB();
    B(stat, q.x, q.y, q.w, q.d, 30, '#7a5236', 0, { r: .03 }); B(stat, q.x - .1, q.y - .1, q.w + .2, q.d + .2, 5, '#4f3424', 30, { r: .03 });
    B(stat, q.x + q.w / 2 - .3, q.y + q.d - .01, .6, .03, 17, '#3b2516');
    for (const u of [.25, q.w - .85]) { const m = B(outside, q.x + u, q.y + q.d - .01, .6, .03, 10, colOf(T.win), 7, { shadow: false }); m.userData.home = 'pub'; dyn.homes.push(m); }
    const sign = canvasTex(256, 64), s = sign.image.getContext('2d');
    s.fillStyle = '#c99a3e'; s.fillRect(0, 0, 256, 64); s.fillStyle = '#2b1c12'; s.fillRect(5, 5, 246, 54);
    s.fillStyle = '#ffd56a'; s.font = `700 30px ${FONT_FANCY}`; s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillText(`🍯 ${PUB_NAME()}`, 128, 34);
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(q.w - .6, H(10)), new THREE.MeshStandardMaterial({ map: sign, side: THREE.DoubleSide }));
    sm.position.set(q.x + q.w / 2, H(24), q.y + q.d + .03); sm.userData.tex = sign; outside.add(sm);
    for (const ty of [py - 3, py - 1.85]) { C(stat, -8.7, ty, .28, 2, '#8a6a4a', 9); C(stat, -8.7, ty, .05, 9, '#5b6372'); }
    B(stat, -14.65, py + 1.45, 1.4, .4, 7, tok('m-desk'), 0, { r: .02 });
    const fx = -9.9, fy = py + 4.9;
    C(stat, fx, fy, .55, 6, '#c9c2b6'); C(stat, fx, fy, .45, .5, '#7fc3ec', 6, { shadow: false }); C(stat, fx, fy, .08, 14, '#c9c2b6');
    lamp(stat, -7.6, py - 1); lamp(stat, -15.4, py + 1);
  }
  for (let k = 0; k < VILL.blocks; k++) { const L = LANE(k); for (const [dx, dy, sz] of [[-4.5, -4.6, 1], [-4.5, 4.4, .9], [4, -9.4, 1.1], [-6.6, -8.8, .8], [-2.2, 9.6, 1], [-7.4, 9.2, 1.1]]) tree(stat, L + dx + (hash(k, dy, 3) - .5) * .8, py + dy, sz); }
  mergeStatic(stat);
}

// ── bees / 벌 ────────────────────────────────────────────────────────────────────────────────
const BEE_S = .55;   // about as tall as the page's bee / 페이지의 벌만 한 키
function makeBee(mini) {
  INSIDE = true; BEEING = true;
  try { return makeBeeIn(mini); } finally { INSIDE = false; BEEING = false; }
}
function makeBeeIn(mini) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const gold = colOf(T.honey), dark = colOf(TT('bee-dark'));
  const limb = (x, y, len, r) => { const p = new THREE.Group(); p.position.set(x, y, 0); body.add(p); cyl(p, r, r, len, 0, -len, 0, dark, { seg: 6 }); return p; };
  const legL = limb(-.08, .3, .26, .04), legR = limb(.08, .3, .26, .04);
  ball(body, .25, 0, .48, 0, gold, { scale: [1, 1.15, .95] });
  for (const y of [.4, .54]) mesh(body, geo('stripe', () => new THREE.TorusGeometry(.245, .035, 6, 20)), dark, 0, y, 0, { rot: [Math.PI / 2, 0, 0], scale: [1, .95, 1] });
  const armL = limb(-.25, .6, .2, .035), armR = limb(.25, .6, .2, .035);
  const head = new THREE.Group(); head.position.set(0, .92, 0); body.add(head);
  ball(head, .24, 0, 0, 0, gold);
  for (const s of [-1, 1]) { ball(head, .06, s * .09, .04, .19, '#ffffff', { shadow: false }); ball(head, .035, s * .09, .04, .245, dark, { shadow: false }); ball(head, .045, s * .15, -.06, .17, '#f08a7a', { shadow: false, scale: [1, .6, .5] }); }
  for (const s of [-1, 1]) { const a = cyl(head, .014, .014, .24, s * .08, .18, 0, dark, { shadow: false, seg: 5 }); a.rotation.z = -s * .35; ball(head, .045, s * .16, .42, 0, dark, { shadow: false }); }
  const wingM = mat(tok('m-wing'), { op: .6, side: 1 });
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * .1, .72, -.17); body.add(w); mesh(w, geo('wing', () => new THREE.CircleGeometry(.2, 14)), null, s * .14, .1, 0, { material: wingM, shadow: false, scale: [1, 1.5, 1], rot: [0, s * .5, 0] }); return w; });
  const jar = new THREE.Group(); jar.position.set(0, 1.3, .1); body.add(jar); cyl(jar, .13, .13, .22, 0, 0, 0, gold); cyl(jar, .14, .14, .05, 0, .22, 0, '#d2ad52'); jar.visible = false;
  const box = new THREE.Group(); box.position.set(0, 1.25, .1); body.add(box); rbox(box, .45, .3, .35, 0, 0, 0, '#c99a62', { r: .02 }); ball(box, .1, -.08, .38, 0, tok('m-plant')); box.visible = false;
  const pc = new THREE.Group(); pc.position.set(0, .5, .3); body.add(pc); rbox(pc, .34, .02, .24, 0, 0, 0, '#2a2e37', { r: .005 }); rbox(pc, .34, .22, .02, 0, 0, -.11, '#2a2e37', { r: .005, rot: [-.3, 0, 0] }); pc.visible = false;
  const ring = mesh(g, geo('ring', () => new THREE.RingGeometry(.5, .62, 32)), null, 0, .01, 0, { material: mat(T.honey, { em: T.honey, side: 1 }), rot: [-Math.PI / 2, 0, 0], shadow: false }); ring.visible = false;
  // what moves keeps its own meshes; the rest of the body is one mesh per colour / 움직이는 것만 따로, 나머지 몸은 색마다 메시 하나
  for (const p of [legL, legR, armL, armR, ...wings, jar, box, pc]) p.traverse(o => { o.userData.keep = true; });
  mergeStatic(body);
  g.scale.setScalar(BEE_S * (mini ? .78 : 1));
  return { g, body, legL, legR, armL, armR, wings, jar, box, pc, ring, heading: Math.PI / 4 };
}
const models = new Map();
const SIT_H = { type: .19, meet: .19, sofa: .17 };
function syncBees(t, dt) {
  const live = new Set(), now = performance.now();
  const each = (map, tag) => { for (const [k, b] of map) {
    if (b.popped || b.inside || b.screen || (b.mini && b.born && now < b.born)) continue;
    const key = tag + k; live.add(key);
    let m = models.get(key);
    if (!m) { m = makeBee(b.mini); models.set(key, m); root.add(m.g); m.px = b.x; m.py = b.y; }
    poseBee(b, m, t, dt);
  } };
  each(bees, 'b'); each(crew, 'c'); each(helpers, 'h');
  for (const [k, m] of models) if (!live.has(k)) { drop(m.g); models.delete(k); }
}
function poseBee(b, m, t, dt) {
  const pose = b.mini ? b.pose : b.moving ? 'walk' : poseOf(b), ph = t * (b.sprint ? 18 : 10) + (b.phase || 0);
  m.g.position.set(b.x, 0, b.y);
  // facing: where it walks, else where it looks / 방향: 걸어가는 쪽, 아니면 보는 쪽
  const vx = b.x - m.px, vy = b.y - m.py; m.px = b.x; m.py = b.y;
  let want = m.heading;
  if (Math.hypot(vx, vy) > 1e-4) want = Math.atan2(vx, vy);
  else if (b.look) want = Math.atan2(b.look[0], b.look[1]);
  m.heading += ((want - m.heading + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 10);
  m.g.rotation.y = m.heading;
  let legs = 0, legR = null, arms = 0, armR = null, armZ = 0, bob = 0, flap = 9, flapA = .15, tilt = 0;
  if (pose === 'walk') { legs = Math.sin(ph) * .7; legR = -legs; arms = -legs * .8; armR = legs * .8; bob = Math.abs(Math.cos(ph)) * (b.sprint ? .1 : .05); tilt = b.sprint ? .2 : 0; if (b.sprint) { flap = 40; flapA = .4; } }
  else if (pose === 'type' || pose === 'meet' || pose === 'sofa') { legs = -1.45; flap = 3; if (pose === 'type') { arms = -1.05 + Math.sin(t * 22 + (b.phase || 0)) * .08; armR = -1.05 - Math.sin(t * 22 + (b.phase || 0)) * .08; } else arms = -.35; }
  else if (pose === 'wait') { const urg = b.office ? Math.min(1, ageOf(b) / 120) : 0; bob = Math.abs(Math.sin(t * (7 + urg * 9) + (b.phase || 0))) * (.12 + urg * .14); arms = -2.8 + Math.sin(t * 12) * .3; armR = -2.8 - Math.sin(t * 12) * .3; flap = 34; flapA = .4; }
  else if (pose === 'done') { arms = -2.9; bob = Math.abs(Math.sin(t * 3)) * .06; }
  else if (pose === 'board') { arms = -.3; armR = -2.2 + Math.sin(t * 3) * .3; }
  else if (pose === 'clap') { arms = -1.4; armZ = .45 + Math.abs(Math.sin(t * 14)) * .5; bob = Math.abs(Math.sin(t * 7)) * .06; }
  else if (pose === 'cheers') { arms = -.4; armR = -2.6; }
  else if (pose === 'coffee') armR = -1.3;
  else if (pose === 'chat') { arms = -.4 + Math.sin(t * 4) * .2; armR = -.6 - Math.sin(t * 5) * .3; }
  else if (pose === 'pong') { armR = -1 + Math.sin(t * 5.5) * .6; bob = Math.abs(Math.sin(t * 5.5)) * .08; }
  else if (pose === 'kick') legs = Math.max(0, Math.sin(t * 4)) * -1;
  else if (pose === 'help') arms = -.9;
  if (reduced) { bob = 0; tilt = 0; flapA = 0; }
  m.body.position.y = (SIT_H[pose] || 0) + bob;
  m.body.rotation.x = tilt;
  m.legL.rotation.x = legs; m.legR.rotation.x = legR ?? legs;
  m.armL.rotation.x = arms; m.armR.rotation.x = armR ?? arms; m.armL.rotation.z = -armZ; m.armR.rotation.z = armZ;
  m.wings.forEach((w, i) => { w.rotation.y = (i ? -1 : 1) * (.25 + Math.sin(t * flap + (b.phase || 0)) * flapA); });
  const carry = pose === 'done' || ((b.state === 'done' || b.deliver || b.state === 'bye') && pose === 'walk');
  m.box.visible = b.state === 'bye';
  m.jar.visible = !b.mini && carry && b.state !== 'bye';
  m.pc.visible = pose === 'help';
  m.ring.visible = !b.mini && b.key === hoverKey;
  // a team role rounds out as its context nears its diet line / 팀 역할은 컨텍스트가 다이어트 기준에 가까울수록 통통해진다
  const fat = b.line && !b.mini ? Math.max(0, Math.min(1, (b.ctx / b.line - .5) / .5)) : 0;
  m.body.scale.set(1 + fat * .25, 1, 1 + fat * .2);
}

// ── the projection: the page's P() and its canvas transform as one matrix / 투영: 페이지의 P() 와 캔버스 변환을 한 행렬로 ──
function matchCamera(w, h) {
  const a = COS, s = SIN, k = TH / TW, ce = Math.sqrt(Math.max(0, 1 - k * k)), sx = 2 * scale / w, sy = 2 * scale / h;
  const ox = w / 2 - VIEW.cx * scale, oy = h / 2 - VIEW.cy * scale;
  // rx - ry and rx + ry (turn()) as a x + c y + d / rx - ry 와 rx + ry (turn()) 를 a x + c y + d 로
  const r1 = [a - s, 0, -(a + s), -CX * (a - s) + CY * (a + s) + (CX - CY)];
  const r2 = [a + s, 0, a - s, -CX * (a + s) - CY * (a - s) + (CX + CY)];
  const row0 = r1.map(v => v * TW * sx); row0[3] += 2 * ox / w - 1;
  const row1 = r2.map(v => -v * TH * sy); row1[1] = ZF * HPX * sy; row1[3] += 1 - 2 * oy / h;
  // depth along the view; nearer is smaller / 보는 방향의 깊이. 가까울수록 작다
  const R = 200, mid = ce * (CX + CY) / Math.SQRT2;
  const row2 = r2.map(v => -v * ce / Math.SQRT2 / R); row2[1] = -k / R; row2[3] += mid / R;
  camera.projectionMatrix.set(...row0, ...row1, ...row2, 0, 0, 0, 1);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
// for a check: the page's point (P plus the canvas transform) and this camera's / 확인용: 페이지의 점과 이 카메라의 점
function check(x, y, z = 0) {
  const p = P(x, y, z), page = [p.x * scale + VIEW.w / 2 - VIEW.cx * scale, p.y * scale + VIEW.h / 2 - VIEW.cy * scale];
  matchCamera(VIEW.w, VIEW.h); root.updateMatrixWorld();
  const v = new THREE.Vector3(x, H(z), y).applyMatrix4(root.matrixWorld).applyMatrix4(camera.projectionMatrix);
  return { page, gl: [(v.x + 1) / 2 * VIEW.w, (1 - v.y) / 2 * VIEW.h], depth: v.z };
}

// ── light, and what changes while it runs / 빛, 그리고 도는 동안 바뀌는 것 ──────────────────────────
function lightUp() {
  const L = LIGHT, cx = GX / 2, cy = LAY.GY / 2;
  sun.intensity = .05 + L * 2.1; hemi.intensity = .14 + L * .7; scene.environmentIntensity = .06 + L * .3;
  sun.color.set(L > .6 ? 0xfff0d8 : 0xffc89a); hemi.color.set(L > .4 ? 0xfff6e6 : 0x9fb0e0);
  // from high on the far left, so shadows fall toward the open side / 먼 왼쪽 높이에서, 그림자는 열린 쪽으로
  sun.position.set(cx - 12, 26, cy - 16); sun.target.position.set(cx, 0, cy);
}
const SCREEN = {};
function screens(t) {
  const tick = Math.floor(t * 4);
  for (const k of ['run', 'wait', 'done']) {
    let s = SCREEN[k];
    if (!s) { const tex = canvasTex(64, 40); s = SCREEN[k] = { tex, mat: new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: .6, roughness: .4 }), at: -1 }; }
    if (s.at === tick || (k === 'done' && s.at >= 0)) continue;
    s.at = tick;
    const c = s.tex.image.getContext('2d'), col = colOf(T[k]);
    c.fillStyle = tok('m-screen'); c.fillRect(0, 0, 64, 40); c.globalAlpha = .3; c.fillStyle = col; c.fillRect(2, 2, 60, 36); c.globalAlpha = 1; c.fillStyle = col;
    if (k === 'run') for (let i = 0; i < 5; i++) c.fillRect(6, 6 + i * 6, 8 + ((tick + i * 3) % 7) * 6, 3);
    else if (k === 'wait') { if (tick % 2) c.fillRect(30, 8, 4, 24); }
    else c.fillRect(14, 18, 36, 5);
    s.tex.needsUpdate = true;
  }
}
function updateLive(t) {
  // walls: the far ones stand, repainted when what hangs on them changes / 벽: 먼 쪽만 서고, 걸린 것이 바뀌면 다시 칠한다
  const drawer = [...bees.values()].find(b => b.atBoard && b.key2 === 'meet' && b.arrived), best = RANKS && RANKS.month && RANKS.month[0];
  const key = [new Date().getMinutes(), T.win, honeyShown(), drawer ? Math.floor((t * .6 + drawer.phase) % 7) : -1, best ? best.id + best.honey : '', lang, offices.map(o => o.host + (o.missing ? '!' : '')).join()].join('|');
  if (LAY.plan === 'park') for (const r of dyn.ring || []) r.g.visible = toward(...r.n);
  dyn.walls.forEach((w, i) => { w.g.visible = !w.n || toward(...w.n); if (w.g.visible && dyn.paintAt[i] !== key) { dyn.paintAt[i] = key; for (const p of w.parts) { p.S.c.clearRect(0, 0, p.tex.image.width, p.tex.image.height); p.paint(p.S, t); p.tex.needsUpdate = true; } } });
  // desks: chairs, laptops and their screens / 책상: 의자, 노트북과 화면
  const owners = new Map([...bees.values()].filter(b => b.desk).map(b => [b.desk.id, b]));
  screens(t);
  for (const k of dyn.desks) {
    const o = owners.get(k.d.id);
    k.ch.position.set(k.d.seat.x + (o ? 0 : k.d.look[0] * .25), 0, k.d.seat.y + (o ? 0 : k.d.look[1] * .25));
    k.lap.visible = !!o;
    const st = o && o.state, s = !o ? '' : st === 'run' && o.key2 !== 'meet' ? 'run' : st === 'wait' ? 'wait' : st === 'done' ? 'done' : 'idle';
    if (s !== k.state) { k.state = s; const m = k.screen.material.slice(); m[k.face] = SCREEN[s] ? SCREEN[s].mat : mat(TT('m-screen')); k.screen.material = m; }
  }
  // honey jars on the shelf / 선반의 꿀단지
  const show = Math.min(jarsOf(honeyShown()), 6);
  if (dyn.jarN !== show) {
    dyn.jarN = show; dyn.jars.clear();
    for (let i = 0; i < show; i++) { const jx = SHELF.x + .22 + i * .35, jy = SHELF.y + SHELF.d / 2; C(dyn.jars, jx, jy, .12, 9, T.honey, SHELF.h, { rough: .35 }); C(dyn.jars, jx, jy, .13, 2.5, TT('m-wax-edge'), SHELF.h + 9); }
  }
  // lamps and lit windows after dark / 어두워지면 조명과 창
  const night = LIGHT < .6;
  if (dyn.night !== night) { dyn.night = night; dyn.lamp.material = night ? mat('#ffe2a8', { em: '#c89a52' }) : mat('#efe6d6'); dyn.bulbs.forEach(b => { b.material = night ? mat('#fff3c4', { em: '#ffd27a' }) : mat('#e8e2d0'); }); }
  const home = new Set([...bees.values()].filter(b => b.inside && !b.atPub).map(b => `${b.ssh || ''}|${b.bee}`));
  const pub = [...bees.values()].some(b => b.atPub && b.inside), winKey = [...home].join() + pub + night + T.win;
  if (dyn.winKey !== winKey) { dyn.winKey = winKey; for (const m of dyn.homes) { const lit = m.userData.home === 'pub' ? pub || night : home.has(m.userData.home); m.material = lit ? mat('#ffe2a8', { em: night ? '#c08a3a' : '#5a4020' }) : mat(T.win); } }
}

// ── each frame (index.html calls it) / 매 프레임 (index.html 이 부른다) ─────────────────────────────
let size = '';
function render(t, dt, roof = 0) {
  if (!OK || !LAY) return false;
  if (gl.hidden) gl.hidden = false;
  const w = VIEW.w, h = VIEW.h;
  if (size !== `${w}x${h}`) { size = `${w}x${h}`; renderer.setSize(w, h, false); }
  const s1 = [settings.decor, LAY.sig, LAY.GY, LAY.pods.map(podTeam).join(), TT('m-office'), TT('m-wallface'), TT('m-lounge'), lang].join('|');
  if (s1 !== sig) { sig = s1; buildOffice(); buildRoof(); }
  const s2 = `${s1}|${houses().map(e => e.key + (e.r.left ? 'x' : '') + e.h.x.toFixed(1)).join()}|${VILL.blocks}|${TT('o-grass')}`;
  if (s2 !== outSig) { outSig = s2; buildOutside(); }
  paintSky(); lightUp(); officeLights(); updateLive(t); syncBees(t, dt); roofUp(roof);
  matchCamera(w, h);
  renderer.render(scene, camera);
  return true;
}
const hide = () => { if (!gl.hidden) gl.hidden = true; };
window.OFFICE3D = { ok: OK, render, hide, check, info: () => renderer && renderer.info };
