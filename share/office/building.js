// The bee office as a building, in real 3D (three.js, share/office/vendor; building.html is its frame). A glass
// office of three storeys or more: the lobby (cafe, lounge, ping-pong, the plaza outside), the work floors (a desk
// island per project, a meeting room, the boss's office), the team floors (a glass room per team) and the rooftop
// (a pool, a pub, a fire pit). Each Claude is a bee with a look of its own: it types at its desk while it works,
// raises a question when it waits, carries a jar of honey when it is done and goes down to the lobby or up to the
// roof to rest; the floors are joined by a glass elevator. Data: /state every 1.5 s.
// Units are metres; y is up. The skin is glass from slab to slab, so every floor can be seen into.
// 건물로 본 벌 사무실, 진짜 3D (three.js, share/office/vendor. building.html 이 틀). 3층 이상의 유리 사무실:
// 로비 (카페, 라운지, 탁구, 바깥 광장), 작업층 (프로젝트마다 책상 섬, 회의실, 사장실), 팀층 (팀마다 유리방),
// 루프탑 (수영장, 펍, 불멍). Claude 하나가 생김새가 저마다 다른 벌 하나다: 일하면 자기 책상에서 타이핑하고,
// 기다리면 손을 들고, 끝나면 꿀단지를 들고, 쉬면 로비나 루프탑으로 간다. 층 사이는 유리 엘리베이터.
// 자료: 1.5초마다 /state. 단위는 미터, y 가 위. 겉은 슬래브에서 슬래브까지 통유리라 모든 층이 들여다보인다.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $ = s => document.querySelector(s);
let L = (navigator.language || 'ko').startsWith('ko') ? 'ko' : 'en';
const tr = (ko, en) => L === 'ko' ? ko : en;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// ── the renderer, the camera, the controls / 렌더러, 카메라, 조작 ──────────────────────────────────────────
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const labels = new CSS2DRenderer({ element: $('#labels') });
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .35;
const camera = new THREE.PerspectiveCamera(32, 1, .5, 20000);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, dampingFactor: .08, minDistance: 9, maxDistance: 2600, maxPolarAngle: Math.PI * .47, screenSpacePanning: false, zoomToCursor: true });
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

const hemi = new THREE.HemisphereLight(0xeaf3ff, 0xb59a74, .9);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
sun.position.set(-38, 62, 30);
sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 10, far: 180 });
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(hemi, sun, sun.target);

// ── materials and shapes, shared / 재질과 모양, 함께 쓴다 ──────────────────────────────────────────────
const MATS = new Map(), GEOS = new Map();
const mat = (color, o = {}) => {
  const k = `${color}|${JSON.stringify(o)}`;
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, roughness: .72, metalness: 0, ...o }));
  return MATS.get(k);
};
const geo = (k, make) => { if (!GEOS.has(k)) GEOS.set(k, make()); return GEOS.get(k); };
const boxG = (w, h, d, r = 0) => geo(`b${w},${h},${d},${r}`, () => r ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d));
const cylG = (rt, rb, h, n = 20) => geo(`c${rt},${rb},${h},${n}`, () => new THREE.CylinderGeometry(rt, rb, h, n));
const sphG = (r, n = 20) => geo(`s${r},${n}`, () => new THREE.SphereGeometry(r, n, Math.max(8, n * .7 | 0)));
function put(parent, g, m, x, y, z, o = {}) {
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(x, y, z);
  if (o.ry) mesh.rotation.y = o.ry;
  if (o.rx) mesh.rotation.x = o.rx;
  if (o.rz) mesh.rotation.z = o.rz;
  if (o.s) mesh.scale.set(...o.s);
  mesh.castShadow = o.cast !== false; mesh.receiveShadow = o.receive !== false;
  parent.add(mesh);
  return mesh;
}
// a box from its floor corner: x, z its centre, y its bottom / 바닥 기준 상자: x, z 는 가운데, y 는 밑면
const block = (p, w, h, d, m, x, y, z, o = {}) => put(p, boxG(w, h, d, o.r || 0), m, x, y + h / 2, z, o);
const canvasTex = (w, h, draw) => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.cv = cv; t.redraw = (...a) => { draw(cv.getContext('2d'), w, h, ...a); t.needsUpdate = true; }; t.redraw();
  return t;
};
const hueOf = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 360; };
const projectColor = p => new THREE.Color().setHSL(hueOf(p) / 360, .55, .52);

const C = {
  concrete: mat(0xd9dcdf, { roughness: .9 }), slab: mat(0xc9ccd0, { roughness: .85 }), dark: mat(0x2b2f36, { roughness: .5 }),
  steel: mat(0x8b939e, { roughness: .35, metalness: .6 }), white: mat(0xf4f5f6, { roughness: .6 }), wood: mat(0xc49a6c, { roughness: .6 }),
  woodDark: mat(0x8d6544, { roughness: .6 }), stone: mat(0xe8e3da, { roughness: .8 }), oak: mat(0xd8be97, { roughness: .7 }),
  carpet: mat(0xcfd4dc, { roughness: 1 }), teamFloor: mat(0xd6dfe0, { roughness: .95 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xbfdbea, roughness: .05, metalness: .15, transparent: true, opacity: .13, depthWrite: false, side: THREE.DoubleSide }),
  glassIn: new THREE.MeshStandardMaterial({ color: 0xd9eef7, roughness: .05, metalness: .1, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide }),
  frame: mat(0x3a3f47, { roughness: .4, metalness: .5 }), mullion: mat(0xc9d0d6, { roughness: .3, metalness: .6 }), leaf: mat(0x4f9a5a, { roughness: .8, flatShading: true }), leaf2: mat(0x3f8a4c, { roughness: .8, flatShading: true }),
  trunk: mat(0x7a5638, { roughness: .9 }), pot: mat(0xb8714b, { roughness: .8 }), grass: mat(0x9fc483, { roughness: 1 }), paving: mat(0xe3ded4, { roughness: .9 }),
  road: mat(0x5f646b, { roughness: .9 }), sofa: mat(0x5b78ad, { roughness: .9 }), sofa2: mat(0xd77a4a, { roughness: .9 }), green: mat(0x2f8f5b, { roughness: .6 }),
  screenOff: mat(0x15181d, { roughness: .3, metalness: .2 }), honey: mat(0xf2b632, { roughness: .3, emissive: 0x6b4300, emissiveIntensity: .25 }),
  light: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e0, emissiveIntensity: .5 }),
};

// ── the textures that move: code on screens, the honey wall, the team boards / 움직이는 텍스처 ───────────
const CODE = canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#0f1722'; c.fillRect(0, 0, w, h);
  const cols = ['#7cc4ff', '#c792ea', '#9ece6a', '#ffcb6b', '#89ddff', '#f78c6c', '#d0d6e0'];
  for (let i = 0; i < 26; i++) {
    let x = 10 + ((i * 7) % 5) * 12;
    for (let k = 0; k < 1 + (i * 13) % 4; k++) { const len = 14 + ((i * 31 + k * 17) % 60); c.fillStyle = cols[(i + k * 3) % cols.length]; c.fillRect(x, 6 + i * 9.6, len, 4.5); x += len + 6; }
  }
});
CODE.wrapS = CODE.wrapT = THREE.RepeatWrapping;
const screenMat = () => { const t = CODE.clone(); t.repeat.set(1, .45); t.offset.y = Math.random(); return new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); };

const STRIPES = canvasTex(64, 256, (c, w, h) => {
  c.fillStyle = '#ffc928'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#26211b'; for (const [a, b] of [[.34, .44], [.53, .63], [.72, .8]]) c.fillRect(0, a * h, w, (b - a) * h);
  c.fillStyle = '#26211b'; c.fillRect(0, .9 * h, w, .1 * h);
});
const BEE = { body: new THREE.MeshStandardMaterial({ map: STRIPES, roughness: .55 }), head: mat(0xffd34d, { roughness: .5 }), eye: mat(0x16130f, { roughness: .2 }),
  shine: new THREE.MeshBasicMaterial({ color: 0xffffff }), limb: mat(0x2a241d, { roughness: .6 }),
  wing: new THREE.MeshStandardMaterial({ color: 0xe9f6ff, roughness: .1, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }),
  cheek: mat(0xff9e8a, { roughness: .8 }), beer: mat(0xe0a020, { roughness: .15, transparent: true, opacity: .85 }), cup: mat(0xffffff, { roughness: .4 }), paddle: mat(0xd63b3b, { roughness: .5 }), paper: mat(0xfafafa, { roughness: .9 }) };

// Everything that never moves in a group becomes one mesh per material: a floor is a few dozen draws, not thousands.
// Kept apart: what changes (screens, the floor the mouse picks, things marked keep) and groups marked own (each
// side of the skin, cut away on its own).
// 그룹 안에서 움직이지 않는 것은 재질마다 메시 하나로 합친다: 층 하나가 수천이 아니라 수십 번 그려진다. 따로 두는 것:
// 바뀌는 것 (화면, 마우스로 고르는 바닥, keep 표시), own 표시 그룹 (겉면의 각 면, 따로 잘라 낸다).
function bake(group) {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert(), by = new Map(), drop = [];
  group.traverse(o => {
    if (o === group || !o.isMesh || o.isInstancedMesh || o.userData.keep || o.userData.floor !== undefined) return;
    for (let q = o.parent; q && q !== group; q = q.parent) if (q.userData.own) return;
    const m = o.material; if (!by.has(m)) by.set(m, { list: [], cast: false, order: 0 });
    const e = by.get(m), g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(inv.clone().multiply(o.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    e.list.push(g); e.cast ||= o.castShadow; e.order = Math.max(e.order, o.renderOrder); drop.push(o);
  });
  for (const o of drop) o.parent.remove(o);
  for (const [m, e] of by) {
    const merged = new THREE.Mesh(mergeGeometries(e.list, false), m);
    merged.castShadow = e.cast; merged.receiveShadow = true; merged.renderOrder = e.order; group.add(merged);
    e.list.forEach(g => g.dispose());
  }
}

// ── the building's shape from the data: how many work and team floors / 자료로 정하는 건물 모양: 작업층과 팀층 수 ──
const FH = 5.4, X0 = -16, X1 = 16, Z0 = -10, Z1 = 10, EXPLODE = 5.5;
const CORE = { x0: -2.6, x1: 2.6, z0: -10, z1: -5.6 }, LIFT = { x: 0, z: -4.9, carZ: -7.8 };
// desk islands from the middle out, so a few projects sit together / 책상 섬은 가운데부터: 프로젝트가 적어도 모여 앉는다
const PODS = []; for (const z of [-2.2, 2.6, 7.2]) for (const x of [-12, -7.2, -2.4, 2.4, 7.2, 12]) PODS.push({ x, z });
PODS.sort((a, b) => Math.abs(a.x) + Math.abs(a.z - 2.6) * 1.3 - (Math.abs(b.x) + Math.abs(b.z - 2.6) * 1.3) || a.x - b.x);
// team rooms, the big ones first so a big team gets one / 팀 룸. 큰 방부터라 큰 팀이 차지한다
const ROOMS = [{ x0: -15.6, x1: -0.6, z0: 2.4, z1: 9.6, door: -1 }, { x0: 0.6, x1: 15.6, z0: 2.4, z1: 9.6, door: -1 },
  { x0: -15.6, x1: -5.4, z0: -9.6, z1: -3.6, door: 1 }, { x0: 5.4, x1: 15.6, z0: -9.6, z1: -3.6, door: 1 }];

const W = { floors: [], sig: '', desks: new Map(), rooms: new Map(), spots: [], grids: [], honeyWall: null, jars: null, lift: null };

function plan(sessions) {
  const teams = new Map(), byProject = new Map();
  for (const s of sessions) {
    if (s.team) { const k = `${s.project}|${s.team}`; if (!teams.has(k)) teams.set(k, { key: k, name: s.team, project: s.project, members: [] }); teams.get(k).members.push(s); }
    else { if (!byProject.has(s.project)) byProject.set(s.project, []); byProject.get(s.project).push(s); }
  }
  for (const t of teams.values()) t.members.sort((a, b) => (b.lead ? 1 : 0) - (a.lead ? 1 : 0) || (a.order ?? 99) - (b.order ?? 99));
  const projects = [...byProject.keys()].sort().map(p => ({ name: p, n: byProject.get(p).length, list: byProject.get(p).sort((a, b) => a.idx - b.idx || String(a.pane).localeCompare(b.pane)) }));
  // desks by halves of an island (one side, two desks): a small project takes a half, a bigger one starts on a
  // whole island so it sits together / 섬의 반쪽 (한쪽, 책상 둘) 단위: 작은 프로젝트는 반쪽, 큰 프로젝트는 섬 처음부터
  let h = 0;
  for (const pr of projects) { const need = Math.ceil(pr.n / 2); if (need > 1 && h % 2) h++; pr.half = h; h += need; }
  const work = Math.max(1, Math.ceil(h / (PODS.length * 2))), team = Math.max(1, Math.ceil(teams.size / ROOMS.length));
  return { cells: W.cells || [], projects, teams: [...teams.values()].sort((a, b) => b.members.length - a.members.length || a.key.localeCompare(b.key)), work, team };
}

// ── the navigation grid of a floor: half-metre cells, blocked by furniture and walls / 층의 길찾기 격자 ──────
class Grid {
  constructor(x0, z0, x1, z1) { this.x0 = x0; this.z0 = z0; this.c = .5; this.w = Math.ceil((x1 - x0) / this.c); this.h = Math.ceil((z1 - z0) / this.c); this.b = new Uint8Array(this.w * this.h); }
  block(xa, za, xb, zb, pad = .3) {
    const [i0, j0] = this.cell(Math.min(xa, xb) - pad, Math.min(za, zb) - pad), [i1, j1] = this.cell(Math.max(xa, xb) + pad, Math.max(za, zb) + pad);
    for (let j = Math.max(0, j0); j <= Math.min(this.h - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(this.w - 1, i1); i++) this.b[j * this.w + i] = 1;
  }
  open(xa, za, xb, zb) {
    const [i0, j0] = this.cell(Math.min(xa, xb), Math.min(za, zb)), [i1, j1] = this.cell(Math.max(xa, xb), Math.max(za, zb));
    for (let j = Math.max(0, j0); j <= Math.min(this.h - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(this.w - 1, i1); i++) this.b[j * this.w + i] = 0;
  }
  cell(x, z) { return [Math.floor((x - this.x0) / this.c), Math.floor((z - this.z0) / this.c)]; }
  at(i, j) { return i < 0 || j < 0 || i >= this.w || j >= this.h ? 1 : this.b[j * this.w + i]; }
  centre(i, j) { return { x: this.x0 + (i + .5) * this.c, z: this.z0 + (j + .5) * this.c }; }
  near(x, z) {   // the nearest open cell / 가장 가까운 열린 칸
    const [i, j] = this.cell(x, z);
    for (let r = 0; r < 30; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if ((Math.abs(di) === r || Math.abs(dj) === r) && !this.at(i + di, j + dj)) return [i + di, j + dj];
    return [i, j];
  }
  clear(a, b) { const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / .2); for (let k = 1; k < n; k++) { const [i, j] = this.cell(a.x + (b.x - a.x) * k / n, a.z + (b.z - a.z) * k / n); if (this.at(i, j)) return false; } return true; }
  path(a, b) {
    const s = this.near(a.x, a.z), g = this.near(b.x, b.z), W2 = this.w, idx = (i, j) => j * W2 + i, goal = idx(...g);
    const cost = new Float32Array(this.w * this.h).fill(Infinity), from = new Int32Array(this.w * this.h).fill(-1), heap = [];
    const push = (k, f) => { heap.push([f, k]); let n = heap.length - 1; while (n) { const p = (n - 1) >> 1; if (heap[p][0] <= heap[n][0]) break; [heap[p], heap[n]] = [heap[n], heap[p]]; n = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let n = 0; for (;;) { const l = 2 * n + 1, r = l + 1; let m = n; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === n) break; [heap[m], heap[n]] = [heap[n], heap[m]]; n = m; } } return top; };
    const hx = k => Math.hypot(k % W2 - g[0], (k / W2 | 0) - g[1]);
    cost[idx(...s)] = 0; push(idx(...s), hx(idx(...s)));
    let found = false, guard = 0;
    while (heap.length && guard++ < 40000) {
      const [, k] = pop(); if (k === goal) { found = true; break; }
      const i = k % W2, j = k / W2 | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (this.at(ni, nj)) continue;
        if (di && dj && (this.at(i + di, j) || this.at(i, j + dj))) continue;
        const nk = idx(ni, nj), c = cost[k] + (di && dj ? 1.414 : 1);
        if (c < cost[nk]) { cost[nk] = c; from[nk] = k; push(nk, c + hx(nk)); }
      }
    }
    const pts = [];
    if (found) for (let k = goal; k !== -1; k = from[k]) pts.unshift(this.centre(k % W2, k / W2 | 0));
    pts.push({ x: b.x, z: b.z });
    const out = [{ x: a.x, z: a.z }];   // smoothed: keep a point only where the straight line would hit something / 다듬기
    for (let k = 1; k < pts.length; k++) if (k === pts.length - 1 || !this.clear(out[out.length - 1], pts[k + 1])) out.push(pts[k]);
    return out.slice(1);
  }
}

// ── building it / 짓기 ───────────────────────────────────────────────────────────────────────────────────
const world = new THREE.Group(); scene.add(world);
const labelOf = (cls, html, c) => { const el = document.createElement('div'); el.className = cls; el.innerHTML = html; if (c) el.style.setProperty('--c', c); return new CSS2DObject(el); };

function ground() {
  // what lies far out (the lawn, the road, trees, lamps) fades when the world becomes a planet (space())
  // 멀리 있는 것 (잔디, 길, 나무, 가로등) 은 세상이 행성이 되면 사라진다 (space())
  const g = new THREE.Group(), far = new THREE.Group(); g.add(far); W.far = far;
  W.lawn = put(g, geo('ground', () => new THREE.CircleGeometry(220, 64)), new THREE.MeshStandardMaterial({ color: 0x9fc483, roughness: 1, transparent: true }), 0, -.02, 0, { rx: -Math.PI / 2, cast: false });
  block(far, 80, .04, 7, C.road, 0, -.02, 31, { cast: false });
  block(g, 24, .06, 14, C.paving, 0, -.02, 17, { cast: false });
  block(g, 4.4, .06, 4, C.paving, 0, -.02, 26, { cast: false });
  // a lawn either side and a fountain on the plaza / 광장 양옆 잔디와 분수
  for (const sx of [-1, 1]) block(g, 5.4, .1, 5, C.grass, sx * 7.8, -.02, 17.5, { cast: false });
  put(g, cylG(1.5, 1.7, .45, 32), C.stone, 0, .22, 17.5); put(g, cylG(1.25, 1.25, .05, 32), mat(0x7fc4e8, { roughness: .1, metalness: .2 }), 0, .44, 17.5, { cast: false });
  put(g, cylG(.12, .16, .9, 12), C.stone, 0, .7, 17.5);
  // trees around, never on the building, the plaza or the road / 둘레의 나무. 건물, 광장, 길은 피한다
  const trunks = [], tops = [];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let n = 0; n < 140; n++) {
    const a = rnd() * Math.PI * 2, r = 26 + rnd() * 70, x = Math.cos(a) * r, z = Math.sin(a) * r, s = .9 + rnd() * .7;
    if (Math.abs(z - 31) < 5.5 || (Math.abs(x) < 14 && z > 8 && z < 36) || (x > 9 && x < 47 && z > -13 && z < 19)) continue;
    trunks.push([x, z, .6 + rnd() * .3]); tops.push([x, z, s, rnd(), rnd() > .5]);
  }
  for (const x of [-11, 11]) for (const z of [12.5, 17.5, 22.5]) { trunks.push([x, z, .6]); tops.push([x, z, 1.05, .5, true]); }
  const tg = cylG(.16, .22, 1, 6), cg = geo('crown', () => new THREE.IcosahedronGeometry(1, 0)), m4 = new THREE.Matrix4();
  const ti = new THREE.InstancedMesh(tg, C.trunk, trunks.length), split = [tops.filter(t => t[4]), tops.filter(t => !t[4])];
  trunks.forEach(([x, z, s], i) => ti.setMatrixAt(i, m4.compose(new THREE.Vector3(x, 1.1 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, 2.2 * s, s))));
  ti.castShadow = true; far.add(ti);
  split.forEach((list, k) => {
    const ci = new THREE.InstancedMesh(cg, k ? C.leaf2 : C.leaf, list.length);
    list.forEach(([x, z, s, r], i) => ci.setMatrixAt(i, m4.compose(new THREE.Vector3(x, 1.7 + s * 1.1, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r * 6, 0)), new THREE.Vector3(s * 1.2, s * 1.45, s * 1.2))));
    ci.castShadow = ci.receiveShadow = true; far.add(ci);
  });
  for (const [x, z, ry] of [[-4.6, 13.6, 0], [4.6, 13.6, 0], [-4.6, 21.4, Math.PI], [4.6, 21.4, Math.PI]]) bench(g, x, z, ry);
  // street lamps along the road / 길가 가로등
  for (let x = -36; x <= 36; x += 12) { put(far, cylG(.06, .08, 4, 8), C.frame, x, 2, 27); put(far, sphG(.22, 12), C.light, x, 4.1, 27, { cast: false }); }
  scene.add(g);
}

function bench(p, x, z, ry) {
  const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; p.add(b);
  block(b, 2.2, .08, .5, C.wood, 0, .42, 0); block(b, 2.2, .45, .08, C.wood, 0, .55, -.25);
  for (const sx of [-.95, .95]) block(b, .08, .42, .45, C.frame, sx, 0, 0);
}
function plant(p, x, z, s = 1, y = 0) {
  put(p, cylG(.22 * s, .17 * s, .45 * s, 12), C.pot, x, y + .225 * s, z);
  put(p, geo('bush', () => new THREE.IcosahedronGeometry(.45, 1)), C.leaf, x, y + .75 * s, z, { s: [s, s * 1.15, s] });
}
function shelf(p, x, z, w, ry = 0, y = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
  block(g, w, 1.9, .38, C.woodDark, 0, 0, 0);
  const cols = [0x3f6fb5, 0xd65c4a, 0xe0b042, 0x4d9a6a, 0x7d5bb0, 0xe58a3a];
  for (let r = 0; r < 4; r++) for (let k = 0; k < Math.floor(w / .14) - 1; k++) {
    if ((r * 7 + k * 3) % 9 === 0) continue;
    block(g, .1, .3 + ((r + k) % 3) * .03, .26, mat(cols[(r * 5 + k) % cols.length], { roughness: .8 }), -w / 2 + .14 + k * .14, .12 + r * .46, .03, { cast: false });
  }
}
function chair(p, x, z, look, y = 0, col = C.dark) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = Math.atan2(look[0], look[1]); p.add(g);
  put(g, cylG(.04, .04, .4, 8), C.steel, 0, .2, 0); put(g, cylG(.28, .28, .04, 5), C.steel, 0, .03, 0, { cast: false });
  block(g, .5, .08, .48, col, 0, .42, 0, { r: .03 }); block(g, .48, .55, .07, col, 0, .5, -.24, { r: .03 });
}
// a desk facing `look` from its seat, with a monitor; the screen is returned to light up / 모니터 달린 책상
function desk(p, x, z, look, y = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = Math.atan2(look[0], look[1]); p.add(g);
  block(g, 1.5, .05, .72, C.white, 0, .72, 0, { r: .015 });
  for (const sx of [-.7, .7]) block(g, .05, .72, .62, C.steel, sx, 0, 0);
  block(g, .08, .32, .08, C.dark, 0, .77, .2); block(g, .72, .44, .04, C.dark, 0, 1.02, .22, { r: .015 });
  const screen = put(g, geo('screen', () => new THREE.PlaneGeometry(.66, .38)), C.screenOff, 0, 1.24, .195, { ry: Math.PI, cast: false }); screen.userData.keep = true;
  block(g, .44, .02, .15, mat(0xe3e5e8), 0, .77, -.08, { cast: false });
  if ((x * 7 + z * 3) % 3 > 1.2) put(g, cylG(.045, .04, .1, 10), mat(0xffffff), .5, .82, -.05);
  return screen;
}
function glassWalls(p, x0, z0, x1, z1, h, doors, y = 0) {   // doors: [side, centre] / 문: [면, 가운데]
  const seg = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az); if (len < .05) return;
    const m = put(p, boxG(len, h, .04), C.glassIn, (ax + bx) / 2, y + h / 2, (az + bz) / 2, { ry: -Math.atan2(bz - az, bx - ax), cast: false });
    m.renderOrder = 2;
    block(p, len, .06, .07, C.frame, (ax + bx) / 2, y + h - .06, (az + bz) / 2, { ry: -Math.atan2(bz - az, bx - ax), cast: false });
  };
  const sides = { n: [x0, z0, x1, z0], s: [x0, z1, x1, z1], w: [x0, z0, x0, z1], e: [x1, z0, x1, z1] };
  for (const [k, [ax, az, bx, bz]] of Object.entries(sides)) {
    const d = doors.find(d => d[0] === k);
    if (!d) { seg(ax, az, bx, bz); continue; }
    if (ax === bx) { seg(ax, az, bx, d[1] - .8); seg(ax, d[1] + .8, bx, bz); } else { seg(ax, az, d[1] - .8, bz); seg(d[1] + .8, az, bx, bz); }
  }
  for (const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) block(p, .07, h, .07, C.frame, cx, y, cz, { cast: false });
}

// the lift shaft, glass all round with its rails, the car seen riding; the roof's has a glass lid
// 엘리베이터 통로: 사방 유리와 레일, 오르내리는 칸이 보인다. 루프탑 것은 유리 뚜껑이 있다
function shaft(fl, y, h, lid) {
  const x0 = -1.3, x1 = 1.3, z0 = -9.9, z1 = -5.65, cz = (z0 + z1) / 2;
  for (const [w, d, x, z] of [[.04, z1 - z0, x0, cz], [.04, z1 - z0, x1, cz], [x1 - x0, .04, 0, z0], [x1 - x0, .04, 0, z1]]) put(fl, boxG(w, h - .32, d), C.glassIn, x, y + (h - .32) / 2 + .02, z, { cast: false }).renderOrder = 2;
  for (const x of [x0, x1]) for (const z of [z0, z1]) block(fl, .035, h, .035, C.mullion, x, y, z, { cast: false });
  for (const sx of [-.9, .9]) block(fl, .05, h, .05, C.steel, sx, y, z0 + .15, { cast: false });
  if (lid) { put(fl, boxG(x1 - x0, .05, z1 - z0), C.glassIn, 0, y + h, cz, { cast: false }).renderOrder = 2; for (const z of [z0, z1]) block(fl, x1 - x0, .04, .04, C.mullion, 0, y + h, z, { cast: false }); }
}

// the outer skin of a floor: glass from slab to slab between mullions, so the whole building can be seen into
// 층의 겉: 슬래브에서 슬래브까지 멀리언 사이 통유리. 건물 전체가 들여다보인다
function skin(fl, y, entrance) {
  const sides = [];
  const mk = (n, ax, az, bx, bz) => {
    const g = new THREE.Group(); g.userData = { n, own: true }; fl.add(g); sides.push(g);
    const len = Math.hypot(bx - ax, bz - az), ry = -Math.atan2(bz - az, bx - ax), cx = (ax + bx) / 2, cz = (az + bz) / 2;
    const gap = entrance && n[2] === 1 ? 2.6 : 0;
    if (gap) {
      for (const sx of [-1, 1]) { const l = (len - gap * 2) / 2; const m = put(g, boxG(l, FH - .32, .05), C.glass, sx * (gap + l / 2), y + (FH - .32) / 2 + .02, cz, { cast: false }); m.renderOrder = 3; }
      block(g, gap * 2, .05, .05, C.mullion, 0, y + 3.05, cz, { cast: false });   // a glass canopy over the doors / 문 위 유리 차양
      put(g, boxG(gap * 2 + 1.2, .04, 2.2), C.glassIn, 0, y + 3.3, cz + 1, { cast: false }).renderOrder = 3;
      for (const sx of [-1, 1]) block(g, gap * 2 + 1.2, .05, .05, C.mullion, 0, y + 3.28, cz + 1 + sx * 1.08, { cast: false });
    } else { const m = put(g, boxG(len, FH - .32, .05), C.glass, cx, y + (FH - .32) / 2 + .02, cz, { ry, cast: false }); m.renderOrder = 3; }
    // hairline mullions, as glass walls have now / 요즘 통유리처럼 머리카락만 한 멀리언
    for (let k = 0; k <= Math.round(len / 3.2); k++) {
      const t = k / Math.round(len / 3.2), mx = ax + (bx - ax) * t, mz = az + (bz - az) * t;
      if (gap && Math.abs(mx) < gap - .05) continue;
      block(g, .025, FH - .3, .035, C.mullion, mx, y, mz, { ry, cast: false });
    }
    for (const fy of [y, y + FH - .34]) block(g, len, .04, .05, C.mullion, cx, fy, cz, { ry, cast: false });   // sill and head / 아래위 틀
  };
  mk([0, 0, -1], X0, Z0, X1, Z0); mk([0, 0, 1], X0, Z1, X1, Z1); mk([-1, 0, 0], X0, Z0, X0, Z1); mk([1, 0, 0], X1, Z0, X1, Z1);
  return sides;
}

function build(p) {
  // clear the old building / 예전 건물 치우기
  world.traverse(o => { if (o.isCSS2DObject && o.element) o.element.remove(); });
  world.clear();
  W.floors = []; W.desks = new Map(); W.rooms = new Map(); W.spots = []; W.grids = []; W.flames = [];
  const kinds = ['lobby', ...Array(p.work).fill('work'), ...Array(p.team).fill('team')];
  kinds.forEach((kind, i) => {
    const y = i * FH, fl = new THREE.Group(); fl.userData = { i, kind }; world.add(fl);
    const ceil = new THREE.Group(); ceil.userData.own = true; fl.add(ceil);
    const grid = new Grid(X0 + .3, Z0 + .3, X1 - .3, kind === 'lobby' ? 25 : Z1 - .3); W.grids[i] = grid;
    // the slab, its floor, columns, the core with the glass lift / 슬래브, 바닥, 기둥, 유리 엘리베이터가 있는 코어
    const slab = block(fl, X1 - X0 + .5, .3, Z1 - Z0 + .5, C.slab, 0, y - .3, 0); slab.userData.floor = i;
    const finish = { lobby: C.stone, work: C.oak, team: C.teamFloor }[kind];
    const fm = put(fl, geo('floor', () => new THREE.PlaneGeometry(X1 - X0, Z1 - Z0)), finish, 0, y + .005, 0, { rx: -Math.PI / 2, cast: false }); fm.userData.floor = i;
    for (const x of [X0 + .4, -5.4, 5.4, X1 - .4]) for (const z of [Z0 + .4, Z1 - .4]) block(fl, .45, FH, .45, C.concrete, x, y, z);
    shaft(fl, y, FH);
    const num = canvasTex(128, 64, c => { c.fillStyle = '#2b2f36'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#fff'; c.font = '700 40px -apple-system, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`${i + 1}F`, 64, 34); });
    put(fl, geo('num', () => new THREE.PlaneGeometry(.8, .4)), new THREE.MeshBasicMaterial({ map: num }), 0, y + FH - .75, -5.6, { cast: false });
    grid.block(CORE.x0, CORE.z0, CORE.x1, CORE.z1, .2);
    for (const x of [X0 + .4, -5.4, 5.4, X1 - .4]) for (const z of [Z0 + .4, Z1 - .4]) grid.block(x, z, x, z, .4);
    // ceiling lights / 천장 조명
    for (let x = -12; x <= 12; x += 6) for (const z of [-7, -2.4, 2.4, 7]) block(ceil, 2.2, .04, .4, C.light, x, y + FH - .36, z, { cast: false });
    const sides = skin(fl, y, kind === 'lobby');
    const F = { i, y, kind, group: fl, ceil, sides, grid, label: { lobby: tr('로비', 'Lobby'), work: tr('작업', 'Work'), team: tr('팀', 'Teams') }[kind] };
    W.floors.push(F);
    ({ lobby: buildLobby, work: buildWork, team: buildTeam })[kind](F, p, kinds.slice(0, i).filter(k => k === kind).length);
    bake(fl); sides.forEach(bake); bake(ceil);
  });
  buildRoof(kinds.length);
  buildResidence(p.cells);
  // the lift car, riding the shaft / 엘리베이터 칸
  const car = new THREE.Group(); world.add(car); W.lift = car;
  block(car, 2.2, .1, 2.4, C.steel, 0, 0, 0); block(car, 2.2, .1, 2.4, C.steel, 0, 2.5, 0);
  for (const sx of [-1.07, 1.07]) block(car, .06, 2.5, 2.4, C.glassIn, sx, .05, 0, { cast: false });
  car.position.set(0, 0, LIFT.carZ); car.userData.y = 0;
}

// ── the rooftop: a pool, sun loungers, a pub under a pergola, a fire pit; open to the sky ─────────────────
// 루프탑: 수영장, 선베드, 퍼걸러 아래 펍, 불멍 자리. 하늘로 열려 있다
const DECK = canvasTex(512, 512, (c, w, h) => {
  for (let k = 0; k < 16; k++) { c.fillStyle = ['#b98a5e', '#a97b52', '#c29466', '#b08158'][k % 4]; c.fillRect(0, k * 32, w, 32); }
  c.fillStyle = 'rgba(60, 38, 20, .55)'; for (let k = 0; k < 16; k++) { c.fillRect(0, k * 32, w, 2); c.fillRect(((k * 197) % 400) + 40, k * 32, 2, 32); }
});
DECK.wrapS = DECK.wrapT = THREE.RepeatWrapping; DECK.repeat.set(5, 3);
const TILE = canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#7fd0e6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#a9e3f1'; c.lineWidth = 3;
  for (let k = 0; k <= 8; k++) { c.beginPath(); c.moveTo(k * 32, 0); c.lineTo(k * 32, h); c.moveTo(0, k * 32); c.lineTo(w, k * 32); c.stroke(); }
});
TILE.wrapS = TILE.wrapT = THREE.RepeatWrapping; TILE.repeat.set(4, 3);
const RIPPLE = canvasTex(256, 256, (c, w, h) => {
  c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(255, 255, 255, .55)'; c.lineWidth = 2.5;
  let seed = 3; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 40; k++) { const x = r() * w, y = r() * h, l = 14 + r() * 26; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 6, x + l, y); c.stroke(); }
});
RIPPLE.wrapS = RIPPLE.wrapT = THREE.RepeatWrapping; RIPPLE.repeat.set(3, 2);
const ROOF = {
  deck: new THREE.MeshStandardMaterial({ map: DECK, roughness: .8 }), tile: new THREE.MeshStandardMaterial({ map: TILE, roughness: .4 }),
  water: new THREE.MeshStandardMaterial({ color: 0x3fb7dc, map: RIPPLE, roughness: .05, metalness: .1, transparent: true, opacity: .72, depthWrite: false, emissive: 0x0d5a78, emissiveIntensity: .15 }),
  bulb: new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffc96b, emissiveIntensity: .8 }),
  flame: new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: .9 }),
  teak: mat(0x9a6a43, { roughness: .7 }), cushion: mat(0xf3ede2, { roughness: .95 }),
};
function buildRoof(i) {
  const y = i * FH, fl = new THREE.Group(); fl.userData = { i, kind: 'roof' }; world.add(fl);
  const ceil = new THREE.Group(); ceil.userData.own = true; fl.add(ceil);
  const grid = new Grid(X0 + .3, Z0 + .3, X1 - .3, Z1 - .3); W.grids[i] = grid;
  const S = (kind, x, z, look, pose, extra) => W.spots.push({ floor: i, kind, x, z, look, pose, ...extra });
  const slab = block(fl, X1 - X0 + .5, .3, Z1 - Z0 + .5, C.slab, 0, y - .3, 0); slab.userData.floor = i;
  const fm = put(fl, geo('floor', () => new THREE.PlaneGeometry(X1 - X0, Z1 - Z0)), ROOF.deck, 0, y + .005, 0, { rx: -Math.PI / 2, cast: false }); fm.userData.floor = i;
  // the lift's head-house, with the name on top / 엘리베이터 탑, 위에 이름
  shaft(fl, y, FH, true);
  const sign = canvasTex(1024, 192, c => { c.clearRect(0, 0, 1024, 192); c.fillStyle = '#ffffff'; c.font = '800 140px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('hivemux', 512, 100); });
  put(fl, geo('sign', () => new THREE.PlaneGeometry(4.4, .8)), new THREE.MeshBasicMaterial({ map: sign, transparent: true, side: THREE.DoubleSide }), 0, y + FH + .55, -7.8, { cast: false });
  for (const sx of [-1.1, 1.1]) block(fl, .04, .25, .04, C.mullion, sx, y + FH, -7.8, { cast: false });
  grid.block(CORE.x0, CORE.z0, CORE.x1, CORE.z1, .2);
  // a glass rail round the edge, each side its own group to cut away / 가장자리 유리 난간. 면마다 따로 잘라 낸다
  const sides = [];
  for (const [n, ax, az, bx, bz] of [[[0, 0, -1], X0, Z0, X1, Z0], [[0, 0, 1], X0, Z1, X1, Z1], [[-1, 0, 0], X0, Z0, X0, Z1], [[1, 0, 0], X1, Z0, X1, Z1]]) {
    const g = new THREE.Group(); g.userData = { n, own: true }; fl.add(g); sides.push(g);
    const len = Math.hypot(bx - ax, bz - az), ry = -Math.atan2(bz - az, bx - ax), cx = (ax + bx) / 2, cz = (az + bz) / 2;
    block(g, len + .3, .3, .3, C.concrete, cx, y, cz, { ry });
    const gl = put(g, boxG(len, .9, .04), C.glass, cx, y + .75, cz, { ry, cast: false }); gl.renderOrder = 3;
    block(g, len + .3, .07, .12, C.steel, cx, y + 1.2, cz, { ry, cast: false });
  }
  // the pool, raised a step, with a ladder and the loungers along the front / 한 단 높인 수영장, 사다리, 앞쪽 선베드
  const pool = { x0: 3.6, x1: 14.6, z0: -1.4, z1: 5.4 }, px = (pool.x0 + pool.x1) / 2, pz = (pool.z0 + pool.z1) / 2, pw = pool.x1 - pool.x0, pd = pool.z1 - pool.z0;
  put(fl, geo('ptile', () => new THREE.PlaneGeometry(pw, pd)), ROOF.tile, px, y + .02, pz, { rx: -Math.PI / 2, cast: false });
  for (const [w, d, x, z] of [[pw + .7, .35, px, pool.z0 - .175], [pw + .7, .35, px, pool.z1 + .175], [.35, pd, pool.x0 - .175, pz], [.35, pd, pool.x1 + .175, pz]]) block(fl, w, .6, d, C.stone, x, y, z);
  const water = put(fl, geo('water', () => new THREE.PlaneGeometry(pw, pd)), ROOF.water, px, y + .48, pz, { rx: -Math.PI / 2, cast: false }); water.userData.keep = true; water.renderOrder = 2;
  for (const sx of [-.25, .25]) { put(fl, cylG(.035, .035, 1.1, 8), C.steel, pool.x0 + 1.4 + sx, y + .75, pool.z1 + .05); }
  grid.block(pool.x0 - .35, pool.z0 - .35, pool.x1 + .35, pool.z1 + .35, .1);
  for (const [x, z] of [[6, .8], [9.4, 3.6], [12.6, .6], [7.4, 3.9], [11.2, 2], [5.4, 3.4]]) S('pool', x, z, [1, 0], 'swim', { lap: true });
  const towels = [0xe85d75, 0x4a7bd0, 0xf2c94c, 0x2fa37a, 0xf08a3c];
  [4.4, 6.8, 9.2, 11.6, 14].forEach((x, k) => {
    const L = new THREE.Group(); L.position.set(x, y, 7.9); fl.add(L);
    block(L, .7, .28, 1.9, ROOF.teak, 0, 0, 0, { r: .04 }); block(L, .66, .08, 1.2, ROOF.cushion, 0, .28, -.32, { r: .03 });
    block(L, .66, .08, .75, mat(towels[k], { roughness: .95 }), 0, .3, .5, { rx: -.75, r: .03 });
    grid.block(x - .35, 6.95, x + .35, 8.85, .1);
    S('sun', x, 6.95, [0, -1], 'lie', { seatY: .32 });
  });
  for (const [x, c] of [[5.6, 0xe85d75], [10.4, 0x38b2c9], [15.2, 0xf2c94c]]) {
    put(fl, cylG(.035, .035, 2.4, 8), C.steel, x, y + 1.2, 8.6); put(fl, cylG(.15, .15, .05, 12), C.steel, x, y + .025, 8.6);
    put(fl, geo('umb', () => new THREE.ConeGeometry(1.35, .45, 16)), mat(c, { roughness: .85, flatShading: true }), x, y + 2.45, 8.6);
  }
  // a hot tub at the back right / 뒤 오른쪽 자쿠지
  put(fl, cylG(1.5, 1.6, .7, 32), C.stone, 10.5, y + .35, -6.8); const tub = put(fl, cylG(1.3, 1.3, .02, 32), ROOF.water, 10.5, y + .62, -6.8, { cast: false }); tub.userData.keep = true; tub.renderOrder = 2;
  grid.block(10.5, -6.8, 10.5, -6.8, 1.6);
  for (const a of [.3, 2.4, 4.4]) S('tub', 10.5 + Math.cos(a) * .7, -6.8 + Math.sin(a) * .7, [-Math.cos(a), -Math.sin(a)], 'swim', { sink: .1 });
  for (const [x, z] of [[14.6, -8.6], [14.6, -3.6], [6.2, -9]]) plant(fl, x, z, 1.3, y);
  // the pub under a pergola: a bar, stools, a back bar of bottles, high tables, string lights, a neon sign
  // 퍼걸러 아래 펍: 바, 스툴, 술병 선반, 높은 테이블, 줄전구, 네온 간판
  const pub = { x0: -15.4, x1: -4.4, z0: -9.4, z1: -2.6 };
  for (const x of [pub.x0, pub.x1]) for (const z of [pub.z0, pub.z1]) block(fl, .2, 3, .2, ROOF.teak, x, y, z);
  for (const z of [pub.z0, pub.z1]) block(fl, pub.x1 - pub.x0 + .4, .2, .2, ROOF.teak, (pub.x0 + pub.x1) / 2, y + 2.9, z);
  for (let x = pub.x0; x <= pub.x1 + .01; x += 1.1) block(fl, .1, .14, pub.z1 - pub.z0 + .4, ROOF.teak, x, y + 3.1, (pub.z0 + pub.z1) / 2, { cast: false });
  for (const x of [-13.2, -9.9, -6.6]) for (let k = 0; k <= 10; k++) {
    const u = k / 10, z = pub.z0 + (pub.z1 - pub.z0) * u;
    put(fl, sphG(.07, 8), ROOF.bulb, x, y + 2.85 - Math.sin(u * Math.PI) * .45, z, { cast: false });
  }
  put(fl, geo('rugpub', () => new THREE.PlaneGeometry(11, 6.8)), mat(0x6b4a33, { roughness: .9 }), (pub.x0 + pub.x1) / 2, y + .012, (pub.z0 + pub.z1) / 2, { rx: -Math.PI / 2, cast: false });
  const bx = -9.9, bz = -7.1;
  block(fl, 8.6, 1.1, .75, C.woodDark, bx, y, bz, { r: .04 }); block(fl, 8.9, .07, .95, C.dark, bx, y + 1.1, bz);
  for (let k = 0; k < 4; k++) { put(fl, cylG(.03, .03, .32, 8), C.steel, bx - 1.2 + k * .8, y + 1.32, bz - .15); put(fl, cylG(.05, .05, .08, 8), mat([0xf2c94c, 0x2b2f36, 0xd94141, 0x2fa37a][k]), bx - 1.2 + k * .8, y + 1.5, bz - .15, { cast: false }); }
  block(fl, 8.6, 2.2, .35, C.woodDark, bx, y, -9.25);
  const bottles = [0x2f7a4a, 0x7a3b1f, 0xd9b46a, 0x2b4f8a, 0xb33a2a, 0xe8e4dc];
  for (let r = 0; r < 3; r++) { block(fl, 8.4, .04, .3, C.oak, bx, y + .95 + r * .45, -9.05, { cast: false }); for (let k = 0; k < 22; k++) if ((k * 7 + r * 3) % 5) put(fl, cylG(.045, .05, .3, 8), mat(bottles[(k + r * 2) % bottles.length], { roughness: .2, transparent: true, opacity: .85 }), bx - 3.9 + k * .37, y + 1.12 + r * .45, -9.05, { cast: false }); }
  const neon = canvasTex(512, 128, c => {
    c.clearRect(0, 0, 512, 128); c.font = '800 78px -apple-system, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ffb020'; c.shadowBlur = 24; c.fillStyle = '#ffd36b'; c.fillText('HONEY PUB', 256, 66); c.shadowBlur = 8; c.fillText('HONEY PUB', 256, 66);
  });
  put(fl, geo('neon', () => new THREE.PlaneGeometry(3.6, .9)), new THREE.MeshBasicMaterial({ map: neon, transparent: true, toneMapped: false }), bx, y + 2.35, -9.06, { cast: false });
  grid.block(bx - 4.3, bz - .4, bx + 4.3, -9.6, .15);
  for (let k = 0; k < 6; k++) {
    const sx = bx - 3.5 + k * 1.4;
    put(fl, cylG(.2, .2, .06, 16), mat(0x2b2f36), sx, y + .78, -6.1); put(fl, cylG(.03, .03, .78, 8), C.steel, sx, y + .39, -6.1); put(fl, cylG(.18, .18, .02, 12), C.steel, sx, y + .01, -6.1);
    S('pub', sx, -6.1, [0, -1], 'beer', { seatY: .8 });
  }
  for (const tx of [-13.4, -9.9, -6.4]) {
    put(fl, cylG(.38, .38, .05, 20), C.oak, tx, y + 1.08, -3.9); put(fl, cylG(.05, .05, 1.08, 8), C.frame, tx, y + .54, -3.9); put(fl, cylG(.25, .25, .03, 14), C.frame, tx, y + .015, -3.9);
    grid.block(tx, -3.9, tx, -3.9, .45);
    for (const sx of [-1, 1]) S('pub', tx + sx * .75, -3.9, [-sx, 0], 'beer');
  }
  // a fire pit with sofas round it, planters along the side / 불멍 자리와 둘레 소파, 옆 화단
  const fx = -9.6, fz = 5.4;
  put(fl, cylG(.85, .95, .45, 24), C.stone, fx, y + .225, fz); put(fl, cylG(.65, .65, .02, 20), C.dark, fx, y + .46, fz, { cast: false });
  W.flames = W.flames || []; W.flames[i] = [];
  for (let k = 0; k < 5; k++) { const f = put(fl, geo('flame', () => new THREE.ConeGeometry(.16, .55, 8)), ROOF.flame, fx + Math.cos(k * 1.3) * .25, y + .72, fz + Math.sin(k * 1.3) * .25, { cast: false }); f.userData.keep = true; W.flames[i].push(f); }
  grid.block(fx, fz, fx, fz, 1);
  for (const [a, w] of [[0, 2.6], [Math.PI / 2, 2.2], [Math.PI, 2.6], [-Math.PI / 2, 2.2]]) {
    const ox = fx + Math.sin(a) * 2.3, oz = fz + Math.cos(a) * 2.3, so = new THREE.Group(); so.position.set(ox, y, oz); so.rotation.y = a + Math.PI; fl.add(so);
    block(so, w, .4, .8, ROOF.teak, 0, 0, 0, { r: .05 }); block(so, w - .1, .12, .72, ROOF.cushion, 0, .4, 0, { r: .04 }); block(so, w, .5, .18, ROOF.teak, 0, .4, -.36, { r: .05 });
    grid.block(ox, oz, ox, oz, w / 2);
    for (const t of w > 2.4 ? [-.65, .65] : [0]) S('fire', ox + Math.cos(a) * t, oz - Math.sin(a) * t, [Math.sin(a + Math.PI), Math.cos(a + Math.PI)], 'sit', { seatY: .5 });
  }
  for (let z = -1; z <= 9; z += 2.5) { block(fl, .9, .5, 2.2, ROOF.teak, -15.2, y, z); put(fl, geo('hedge2', () => new THREE.BoxGeometry(.8, .55, 2.1)), C.leaf2, -15.2, y + .75, z); grid.block(-15.6, z - 1.1, -14.7, z + 1.1); }
  for (const [x, z] of [[-3.6, 8.8], [2.4, 8.8], [-3.6, -1.8]]) plant(fl, x, z, 1.4, y);
  // a patch of lawn with bean bags in the middle / 가운데 잔디와 빈백
  put(fl, geo('lawn', () => new THREE.CircleGeometry(2.3, 40)), C.grass, -.6, y + .02, 5, { rx: -Math.PI / 2, cast: false });
  for (const [a, c] of [[.4, 0xe85d75], [2.5, 0x4a7bd0], [4.5, 0xf2c94c]]) {
    const x = -.6 + Math.cos(a) * 1.3, z = 5 + Math.sin(a) * 1.3;
    put(fl, sphG(.55, 18), mat(c, { roughness: .95 }), x, y + .3, z, { s: [1, .6, 1] }); grid.block(x, z, x, z, .2);
    S('roof', x, z, [-Math.cos(a), -Math.sin(a)], 'sit', { seatY: .4 });
  }
  for (const [x, z] of [[-1.6, 1.2], [1.4, 1.8], [1.8, -2.4]]) S('roof', x, z, [x > 0 ? 1 : -1, .5], 'chat');
  const tags = [[tr('수영장', 'Pool'), px, pool.z0 - .2], [tr('꿀 펍', 'Honey pub'), bx, pub.z1], [tr('불멍', 'Fire pit'), fx, fz + 2.8]];
  for (const [t, x, z] of tags) { const o = labelOf('room', escape(t)); o.position.set(x, y + 3.4, z); fl.add(o); o.userData.floorLabel = i; }
  const F = { i, y, kind: 'roof', group: fl, ceil, sides, grid, label: tr('루프탑', 'Rooftop') };
  W.floors.push(F);
  // the bartender, always on / 언제나 있는 바텐더
  if (!W.bartender) {
    W.bartender = { key: 'bartender', col: new THREE.Color(0x2b2f36), phase: 0, legs: [], pos: { x: bx, z: -8.25 }, y, floor: i, facing: 0, arrived: true,
      persona: { ...persona('bartender'), sex: 'm', face: 'mustache', hat: null, hair: 'side', glasses: null, wear: 'barman', size: 1.05, wide: 1.05 } };
    makeBee(W.bartender); W.bartender.tag.visible = W.bartender.ask.visible = false; W.bartender.pick.forEach(m => { m.userData.bee = null; });
  }
  Object.assign(W.bartender, { y, floor: i, goal: { pose: 'bar', look: [0, 1] } });
  bake(fl); sides.forEach(bake);
}

function buildLobby(F, p) {
  const g = F.group, y = F.y, grid = F.grid, S = (kind, x, z, look, pose, extra) => W.spots.push({ floor: F.i, kind, x, z, look, pose, ...extra });
  // the outside: the front wall is shut but for the doors; the plaza is walkable / 바깥: 앞벽은 문 말고 막힘. 광장은 걸을 수 있다
  grid.block(X0, Z1, -2.6, Z1, .25); grid.block(2.6, Z1, X1, Z1, .25);
  grid.block(-11.6, 10.2, -11.6, 25, .2); grid.block(11.6, 10.2, 11.6, 25, .2);
  grid.block(0, 17.5, 0, 17.5, 1.8);
  // a stone floor with a darker inlay at the door, the logo on the back wall / 돌바닥과 문 앞 짙은 무늬, 뒷벽 로고
  put(g, geo('inlay', () => new THREE.PlaneGeometry(6, 4)), mat(0xcfc6b8, { roughness: .6 }), 0, y + .008, 7.6, { rx: -Math.PI / 2, cast: false });
  // reception / 안내 데스크
  block(g, 3.6, 1.05, .8, C.white, 0, y, 4.6, { r: .05 }); block(g, 3.8, .06, .95, C.woodDark, 0, y + 1.05, 4.6);
  block(g, .5, .3, .05, C.dark, -.8, y + 1.11, 4.5); grid.block(-1.8, 4.2, 1.8, 5, .2);
  // the cafe: a counter on the left wall, high tables / 카페: 왼쪽 벽 카운터, 높은 테이블
  block(g, .9, 1.05, 6, C.woodDark, -15.2, y, 5.6); block(g, 1, .06, 6.1, C.stone, -15.2, y + 1.05, 5.6);
  block(g, .45, .55, .45, C.dark, -15.2, y + 1.1, 4.2); block(g, .45, .42, .4, C.steel, -15.2, y + 1.1, 6.8); block(g, .3, .25, .3, mat(0xd65c4a), -15.2, y + 1.1, 7.8);
  const menu = canvasTex(256, 160, c => { c.fillStyle = '#2b2f36'; c.fillRect(0, 0, 256, 160); c.fillStyle = '#f2b632'; c.font = '700 26px -apple-system, sans-serif'; c.fillText('HONEY CAFE', 22, 40); c.fillStyle = '#e1e6f0'; c.font = '500 18px -apple-system, sans-serif'; ['Honey latte', 'Cold brew', 'Pollen tea'].forEach((t, k) => c.fillText(t, 22, 78 + k * 26)); });
  put(g, geo('menu', () => new THREE.PlaneGeometry(2, 1.25)), new THREE.MeshBasicMaterial({ map: menu }), -15.65, y + 2.4, 5.6, { ry: Math.PI / 2, cast: false });
  grid.block(-15.7, 2.6, -14.7, 8.6);
  for (const [tx, tz] of [[-12, 7.6], [-10.6, 4], [-12.8, 1.2]]) {
    put(g, cylG(.42, .42, .05, 24), C.white, tx, y + 1.05, tz); put(g, cylG(.05, .05, 1.05, 8), C.steel, tx, y + .52, tz); put(g, cylG(.28, .28, .03, 16), C.steel, tx, y + .02, tz);
    grid.block(tx, tz, tx, tz, .5);
    for (const a of [0, 2.1, 4.2]) { const sx = tx + Math.sin(a) * .8, sz = tz + Math.cos(a) * .8; S('cafe', sx, sz, [tx - sx, tz - sz], 'coffee'); }
  }
  S('cafe', -14.3, 4.8, [-1, 0], 'coffee'); S('cafe', -14.3, 6.6, [-1, 0], 'coffee');
  // the lounge: two sofas over a rug, bean bags, a plant wall / 라운지: 러그 위 소파 둘, 빈백
  put(g, geo('rug', () => new THREE.CircleGeometry(3, 40)), mat(0xe6d6c0, { roughness: 1 }), 10.4, y + .01, 4.6, { rx: -Math.PI / 2, cast: false });
  for (const [sz, look] of [[7.1, -1], [2.1, 1]]) {
    const so = new THREE.Group(); so.position.set(10.4, y, sz); so.rotation.y = look > 0 ? 0 : Math.PI; g.add(so);
    block(so, 3, .45, .85, C.sofa, 0, 0, 0, { r: .1 }); block(so, 3, .55, .25, C.sofa, 0, .4, -.33, { r: .1 });
    for (const sx of [-1.4, 1.4]) block(so, .25, .65, .85, C.sofa, sx, 0, 0, { r: .1 });
    grid.block(8.9, sz - .45, 11.9, sz + .45, .15);
    for (const sx of [-.85, 0, .85]) S('lounge', 10.4 + sx * look, sz + .05 * look, [0, look], 'sit', { seatY: .45 });
  }
  block(g, 1.5, .4, .75, C.wood, 10.4, y, 4.6, { r: .05 }); grid.block(9.7, 4.2, 11.1, 5, .15);
  for (const [bx, bz] of [[14.4, 5.8], [14.4, 3.2]]) { put(g, sphG(.55, 18), C.sofa2, bx, y + .35, bz, { s: [1, .65, 1] }); S('lounge', bx, bz, [-1, 0], 'sit', { seatY: .38 }); grid.block(bx, bz, bx, bz, .25); }
  for (let k = 0; k < 6; k++) put(g, geo('bush', () => new THREE.IcosahedronGeometry(.45, 1)), k % 2 ? C.leaf : C.leaf2, 15.4, y + .5 + (k % 3) * .9, -1 + Math.floor(k / 3) * .9, { s: [.6, 1, 1] });
  plant(g, 15.2, 9.2, 1.2, y); plant(g, 6.6, 9.2, 1, y); plant(g, -6.6, 9.2, 1.1, y); plant(g, -15.2, -1.4, 1.2, y);
  // armchairs round a low table in the middle of the lobby / 로비 가운데 낮은 탁자와 안락의자
  put(g, geo('lrug', () => new THREE.PlaneGeometry(4.6, 3.4)), mat(0x9fb3c8, { roughness: 1 }), -4.2, y + .01, 1, { rx: -Math.PI / 2, cast: false });
  put(g, cylG(.6, .6, .38, 28), C.wood, -4.2, y + .19, 1); grid.block(-4.2, 1, -4.2, 1, .65);
  for (const [ax, az] of [[-5.9, 1], [-2.5, 1], [-4.2, -.5], [-4.2, 2.5]]) {
    const look = [-4.2 - ax, 1 - az], ch = new THREE.Group(); ch.position.set(ax, y, az); ch.rotation.y = Math.atan2(look[0], look[1]); g.add(ch);
    block(ch, .85, .42, .8, C.sofa2, 0, 0, 0, { r: .08 }); block(ch, .85, .45, .2, C.sofa2, 0, .38, -.32, { r: .08 });
    for (const sx of [-.38, .38]) block(ch, .14, .58, .8, C.sofa2, sx, 0, 0, { r: .06 });
    grid.block(ax, az, ax, az, .45); S('lounge', ax, az, look, 'sit', { seatY: .42 });
  }
  // ping-pong at the back left / 뒤 왼쪽 탁구
  const pp = new THREE.Group(); pp.position.set(-10.6, y, -6.6); g.add(pp);
  block(pp, 2.74, .05, 1.52, C.green, 0, .74, 0); block(pp, .02, .16, 1.6, mat(0xffffff, { transparent: true, opacity: .7 }), 0, .79, 0, { cast: false });
  for (const sx of [-1.1, 1.1]) for (const sz of [-.6, .6]) block(pp, .06, .74, .06, C.dark, sx, 0, sz);
  grid.block(-12, -7.4, -9.2, -5.8, .15);
  S('pong', -12.8, -6.6, [1, 0], 'pong', { pong: 0 }); S('pong', -8.4, -6.6, [-1, 0], 'pong', { pong: 1 });
  const ball = put(g, sphG(.04, 10), mat(0xff9f2e, { emissive: 0x552200 }), -10.6, y + .9, -6.6); ball.visible = false; ball.userData.keep = true; W.ball = { mesh: ball, y, x: -10.6, z: -6.6 };
  shelf(g, -15.4, -7.6, 2.4, Math.PI / 2, y); grid.block(-15.8, -8.8, -15, -6.4);
  // the honey wall: the comb fills with today's honey; jars on a shelf under it / 꿀 벽: 오늘의 꿀만큼 찬다. 아래 선반에 꿀단지
  W.honeyWall = canvasTex(512, 300, (c, w, h, n = 0) => {
    c.fillStyle = '#3b2a12'; c.fillRect(0, 0, w, h);
    const R = 20, dx = R * Math.sqrt(3), dy = R * 1.5, fill = n % 48;
    let k = 0;
    for (let r = 0; r < 6; r++) for (let q = 0; q < 8; q++) {
      const x = 52 + q * dx + (r % 2) * dx / 2, yy = 46 + r * dy;
      c.beginPath(); for (let a = 0; a < 6; a++) { const t = Math.PI / 6 + a * Math.PI / 3; c.lineTo(x + Math.cos(t) * (R - 2), yy + Math.sin(t) * (R - 2)); } c.closePath();
      c.fillStyle = k++ < fill ? '#f6b42c' : '#5a4220'; c.fill(); c.strokeStyle = '#8a6420'; c.lineWidth = 2; c.stroke();
    }
    c.fillStyle = '#ffe6a6'; c.font = '700 26px -apple-system, sans-serif'; c.fillText(L === 'ko' ? `오늘 꿀 ${n}칸` : `Honey today: ${n}`, 22, h - 22);
  });
  block(g, 4.8, 3.2, .25, C.woodDark, -5.4, y, -5.75); grid.block(-7.8, -5.9, -3, -5.6, .25);
  put(g, geo('hw', () => new THREE.PlaneGeometry(4.4, 2.6)), new THREE.MeshStandardMaterial({ map: W.honeyWall, roughness: .5, emissive: 0x332000, emissiveIntensity: .25 }), -5.4, y + 1.8, -5.61, { cast: false });
  const jars = new THREE.Group(); jars.userData.own = true; g.add(jars); W.jars = { group: jars, y };
  // places to stand by the windows, in the lobby and on the plaza / 창가, 로비, 광장의 설 곳
  for (const z of [-4, -1, 7.6]) S('window', 15.2, z, [1, 0], 'chat');
  for (const [x, z, ry] of [[-4.6, 13.6, 0], [4.6, 13.6, 0], [-4.6, 21.4, Math.PI], [4.6, 21.4, Math.PI]]) for (const sx of [-.6, .6]) S('bench', x + (ry ? -sx : sx), z + (ry ? -.12 : .12), [0, ry ? -1 : 1], 'sit', { seatY: .45 });
  for (const [x, z] of [[-7.4, 16.8], [-8.4, 18.4], [7.4, 16.8], [8.4, 18.4], [-2.6, 15.4], [2.6, 15.4], [-2.4, 20], [2.4, 20], [-3.8, 11.4], [3.8, 11.4]]) S('plaza', x, z, [-x * .2, 17.5 - z], 'chat');
  for (const [x, z] of [[4.6, -.6], [5.4, .8], [-6.4, -3.2], [6.4, -3.2]]) S('lobby', x, z, [-(x > 0 ? 1 : -1), .4], 'chat');
  for (const [x, z, ry] of [[-4.6, 13.6, 0], [4.6, 13.6, 0], [-4.6, 21.4, Math.PI], [4.6, 21.4, Math.PI]]) grid.block(x - 1.1, z - .3, x + 1.1, z + .3, .05);
}

function buildWork(F, p, nth) {
  const g = F.group, y = F.y, grid = F.grid;
  // projects take halves of islands in name order (plan()); an island's divider shows each side's project colour
  // 프로젝트는 이름 순서로 섬의 반쪽을 차지한다 (plan()). 섬 칸막이는 양쪽 프로젝트 색
  const first = nth * PODS.length * 2, last = first + PODS.length * 2, used = new Set();
  for (const pr of p.projects) {
    const col = projectColor(pr.name);
    pr.list.forEach((s, n) => {
      const hh = pr.half + (n >> 1); if (hh < first || hh >= last) return;
      const P = PODS[(hh - first) >> 1], sx = hh % 2 ? 1 : -1, sz = n % 2 ? 1 : -1;
      if (!used.has(P)) { used.add(P); put(g, geo('carpet', () => new THREE.PlaneGeometry(3.9, 3.9)), mat(0xb9c0cb, { roughness: 1 }), P.x, y + .01, P.z, { rx: -Math.PI / 2, cast: false }); }
      if (n % 2 === 0) {
        block(g, .025, .42, 3, mat(col.getHex(), { roughness: .8 }), P.x + sx * .014, y + .76, P.z, { cast: false });
        if (n === 0) { const o = labelOf('sign', escape(pr.name), `#${col.getHexString()}`); o.position.set(P.x + sx * .9, y + 2.2, P.z); g.add(o); o.userData.floorLabel = F.i; }
      }
      const look = [-sx, 0], dz = P.z + sz * .8, seat = { x: P.x + sx * 1.35, z: dz };
      const screen = desk(g, P.x + sx * .45, dz, look, y);
      chair(g, seat.x, seat.z, look, y);
      grid.block(P.x - .85, dz - .4, P.x + .85, dz + .4, .15);
      W.desks.set(s.key, { floor: F.i, seat: { ...seat, look, seatY: .48 }, stand: { x: seat.x + sx * .55, z: seat.z + sz * .35, look }, screen, scr: null, project: pr.name, col });
    });
  }
  // the meeting room (planning) and the boss's office / 회의실 (계획) 과 사장실
  const mr = { x0: -15.6, x1: -6.4, z0: -9.6, z1: -4.8 }, mx = (mr.x0 + mr.x1) / 2, mz = (mr.z0 + mr.z1) / 2;
  glassWalls(g, mr.x0, mr.z0, mr.x1, mr.z1, 2.9, [['s', -7.6]], y);
  put(g, geo('mrug', () => new THREE.PlaneGeometry(9, 4.6)), mat(0xd3d9e6, { roughness: 1 }), mx, y + .011, mz, { rx: -Math.PI / 2, cast: false });
  block(g, 4.4, .06, 1.5, C.wood, mx, y + .74, mz, { r: .02 }); for (const sx of [-1.9, 1.9]) block(g, .1, .74, 1.1, C.steel, mx + sx, y, mz);
  const meet = [];
  for (let k = 0; k < 3; k++) for (const sz of [-1, 1]) { const sx = mx - 1.4 + k * 1.4, sz2 = mz + sz * 1.1; chair(g, sx, sz2, [0, -sz], y, mat(0x4a5d7c)); meet.push({ x: sx, z: sz2, look: [0, -sz], seatY: .48 }); }
  block(g, .08, 1.3, 2.4, C.white, mr.x0 + .35, y + .8, mz); W.meetBoard = { x: mr.x0 + 1, z: mz, look: [-1, 0] };
  F.meet = meet;
  grid.block(mr.x0, mr.z0, mr.x1, mr.z0, .2); grid.block(mr.x0, mr.z0, mr.x0, mr.z1, .2); grid.block(mr.x1, mr.z0, mr.x1, mr.z1, .2);
  grid.block(mr.x0, mr.z1, -8.4, mr.z1, .2); grid.block(-6.8, mr.z1, mr.x1, mr.z1, .2); grid.block(mx - 2.2, mz - .75, mx + 2.2, mz + .75, .1);
  const br = { x0: 6.4, x1: 15.6, z0: -9.6, z1: -4.8 };
  glassWalls(g, br.x0, br.z0, br.x1, br.z1, 2.9, [['s', 7.6]], y);
  put(g, geo('mrug', () => new THREE.PlaneGeometry(9, 4.6)), mat(0xe2d3bd, { roughness: 1 }), 11, y + .011, -7.2, { rx: -Math.PI / 2, cast: false });
  block(g, 2.4, .76, 1, C.woodDark, 11.6, y, -7.8); chair(g, 11.6, -8.8, [0, 1], y, mat(0x6b4a2f));
  block(g, 1.6, .42, .8, C.sofa2, 9, y, -5.8, { r: .08 });
  shelf(g, 15.2, -7.2, 3, -Math.PI / 2, y); plant(g, 7, -9, 1.1, y);
  const ws = labelOf('room', tr('회의실', 'Meeting room')); ws.position.set(mx, y + 3.1, mr.z1); g.add(ws); ws.userData.floorLabel = F.i;
  const bs = labelOf('room', tr('사장실', "Boss's office")); bs.position.set(11, y + 3.1, br.z1); g.add(bs); bs.userData.floorLabel = F.i;
  grid.block(br.x0, br.z0, br.x1, br.z1, .2);
  // a printer and water by the core, plants / 코어 옆 프린터와 정수기, 화분
  block(g, .9, 1, .65, mat(0xe9eaec), -4.2, y, -5.2); put(g, cylG(.2, .2, 1.3, 14), mat(0x8fc7ea, { transparent: true, opacity: .8 }), 4, y + .65, -5.2);
  grid.block(-4.7, -5.6, -3.7, -4.8); grid.block(4, -5.2, 4, -5.2, .3);
  W.printer = W.printer || []; W.printer[F.i] = { x: -4.2, z: -4.4 };
  for (const [x, z] of [[-15.2, -.4], [15.2, -.4], [-15.2, 9.2], [15.2, 9.2]]) plant(g, x, z, 1.1, y);
}

function buildTeam(F, p, nth) {
  const g = F.group, y = F.y, grid = F.grid;
  p.teams.slice(nth * ROOMS.length, (nth + 1) * ROOMS.length).forEach((t, k) => {
    const R = ROOMS[k], cz = (R.z0 + R.z1) / 2, doorX = (R.x0 + R.x1) / 2;
    glassWalls(g, R.x0, R.z0, R.x1, R.z1, 2.9, [[R.door > 0 ? 's' : 'n', doorX]], y);
    grid.block(R.x0, R.z0, R.x1, R.z1, .15);
    grid.open(R.x0 + .5, R.z0 + .5, R.x1 - .5, R.z1 - .5);
    const doorZ = R.door > 0 ? R.z1 : R.z0; grid.open(doorX - .6, doorZ - .7, doorX + .6, doorZ + .7);
    put(g, geo(`tr${R.x1 - R.x0}`, () => new THREE.PlaneGeometry(R.x1 - R.x0 - .2, R.z1 - R.z0 - .2)), mat(0xc8dadb, { roughness: 1 }), (R.x0 + R.x1) / 2, y + .012, cz, { rx: -Math.PI / 2, cast: false });
    // a long table, a seat per role, the lead at the head; a whiteboard at the far end / 긴 탁자, 역할마다 자리, 머리에 리드, 끝에 화이트보드
    const members = [...t.members].sort((a, b) => (b.lead ? 1 : 0) - (a.lead ? 1 : 0) || (a.order ?? 99) - (b.order ?? 99));
    const side = Math.max(2, Math.ceil((members.length - 1) / 2)), len = Math.min(R.x1 - R.x0 - 4.6, side * 1.35 + .8), tx0 = (R.x0 + R.x1) / 2 - len / 2 - .4, tx1 = tx0 + len;
    block(g, len, .06, 1.7, C.white, (tx0 + tx1) / 2, y + .74, cz, { r: .02 });
    for (const sx of [tx0 + .2, tx1 - .2]) block(g, .12, .74, 1.3, C.steel, sx, y, cz);
    grid.block(tx0, cz - .85, tx1, cz + .85, .15);
    const seats = [{ x: tx1 + .85, z: cz, look: [-1, 0], head: true }];
    for (let n = 0; n < side; n++) for (const sz of [-1, 1]) seats.push({ x: tx0 + .7 + n * 1.35, z: cz + sz * 1.25, look: [0, -sz] });
    const laptops = [];
    seats.forEach(st => {
      chair(g, st.x, st.z, st.look, y, st.head ? mat(0xb8862f) : C.dark);
      const off = st.head ? .8 : .55, lx = st.x + st.look[0] * off, lz = st.z + st.look[1] * off, l = new THREE.Group(); l.position.set(lx, y + .77, lz); l.rotation.y = Math.atan2(st.look[0], st.look[1]); g.add(l);
      block(l, .4, .02, .28, C.steel, 0, 0, 0); const scr = put(l, geo('lap', () => new THREE.PlaneGeometry(.38, .24)), C.screenOff, 0, .14, .16, { rx: -.25, ry: Math.PI, cast: false }); scr.userData.keep = true;
      laptops.push(scr);
    });
    const bx = tx0 - 1.3, board = canvasTex(640, 400, drawBoard);
    for (const dz of [-1, 1]) block(g, .06, 2.1, .06, C.frame, bx, y, cz + dz * 1.15);
    put(g, geo('wb', () => new THREE.PlaneGeometry(2.4, 1.5)), new THREE.MeshStandardMaterial({ map: board, roughness: .4 }), bx + .04, y + 1.45, cz, { ry: Math.PI / 2, cast: false });
    block(g, .05, 1.58, 2.48, C.frame, bx, y + .66, cz, { cast: false });
    shelf(g, R.x0 + 1.4, R.door > 0 ? R.z0 + .3 : R.z1 - .3, 1.6, R.door > 0 ? 0 : Math.PI, y); plant(g, R.x1 - .5, R.door > 0 ? R.z0 + .5 : R.z1 - .5, 1, y);
    const o = labelOf('room', `${escape(t.name)}<small>${escape(t.project)}</small>`); o.position.set(doorX, y + 3.2, R.door > 0 ? R.z1 : R.z0); g.add(o); o.userData.floorLabel = F.i;
    const room = { floor: F.i, team: t, seats, laptops, board, boardSig: '', present: seats.slice(1).map((st, n) => ({ x: seats[0].x - .1 - (n >> 1) * .7, z: cz + (n % 2 ? 1.45 : -1.45), look: [1, (n % 2 ? -1 : 1) * .6] })), stand: { x: bx + .8, z: cz, look: [-1, 0] } };
    W.rooms.set(t.key, room);
    members.forEach((s, n) => { W.desks.set(s.key, { floor: F.i, room, n, seat: { ...seats[n] || seats[seats.length - 1], seatY: .48 }, laptop: laptops[n], scr: null }); });
  });
  for (const [x, z] of [[-1.4, -3.4], [1.4, -3.4]]) { block(g, 1.3, .42, .7, C.sofa, x, y, z, { r: .08 }); grid.block(x - .65, z - .35, x + .65, z + .35, .1); }
  plant(g, -15.2, -.6, 1.2, y); plant(g, 15.2, -.6, 1.2, y); plant(g, -3.6, -4.6, 1, y); plant(g, 3.6, -4.6, 1, y);
}
// a team's whiteboard: the team, its flow, each role's state, the last hand-off / 팀 화이트보드
function drawBoard(c, w, h, room) {
  c.fillStyle = '#fbfbf9'; c.fillRect(0, 0, w, h);
  if (!room) return;
  const t = room.team, list = [...t.members].sort((a, b) => (b.lead ? 1 : 0) - (a.lead ? 1 : 0) || (a.order ?? 99) - (b.order ?? 99));
  c.fillStyle = '#0b6f71'; c.font = '800 40px -apple-system, "Apple SD Gothic Neo", sans-serif'; c.fillText(t.name, 28, 58);
  const flow = list.filter(s => !s.lead).map(s => roleName(s));
  c.fillStyle = '#5a6375'; c.font = '600 22px -apple-system, "Apple SD Gothic Neo", sans-serif'; c.fillText(flow.join('  →  ').slice(0, 52), 28, 96);
  c.fillStyle = '#e1e6ee'; c.fillRect(28, 114, w - 56, 2);
  list.slice(0, 7).forEach((s, i) => {
    const yy = 150 + i * 34, col = { run: '#2f7fd6', wait: '#e08a00', done: '#1d9a64' }[s.state] || '#9aa3b2';
    c.fillStyle = col; c.beginPath(); c.arc(40, yy - 8, 8, 0, 7); c.fill();
    c.fillStyle = '#1b1f27'; c.font = '700 24px -apple-system, "Apple SD Gothic Neo", sans-serif'; c.fillText((s.lead ? '★ ' : '') + roleName(s), 58, yy);
    c.fillStyle = col; c.font = '700 20px -apple-system, "Apple SD Gothic Neo", sans-serif'; c.fillText(stateWord(s.state), 300, yy);
    if (s.line) { const f = Math.min(1, s.ctx / s.line); c.fillStyle = '#e8ecf2'; c.fillRect(440, yy - 14, 150, 10); c.fillStyle = f > .9 ? '#e8a13a' : '#4caf7d'; c.fillRect(440, yy - 14, 150 * f, 10); }
  });
}
const roleName = s => String(s.label || s.role || s.name || '').replace('★ ', '');
const stateWord = st => ({ run: tr('일함', 'working'), wait: tr('기다림', 'waiting'), done: tr('끝남', 'done'), home: tr('퇴근', 'home') }[st] || tr('쉼', 'resting'));
const escape = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// ── home: the Hive Residence across the plaza, a honeycomb of flats, one per bee ─────────────────────────
// Clocked out, a bee claps, walks out of the lobby and along the path, flies up to its own cell and goes in: the
// lamp comes on, and late at night it sleeps. A cell follows the bee's house number in the roster (hivemux-bees),
// so it keeps its flat; one that left the company leaves it empty with a sign until a newcomer moves in.
// 집: 광장 건너 벌집 아파트. 벌마다 한 칸. 퇴근하면 박수치고, 로비를 나와 길을 따라 걷고, 자기 칸으로 날아 올라가
// 들어간다: 불이 켜지고, 밤늦게는 잔다. 칸은 명부 (hivemux-bees) 의 집 번호를 따라 정해져 같은 집을 지킨다.
// 퇴사한 벌의 칸은 신입이 들어올 때까지 팻말을 단 빈집이다.
const RES = { x0: 27, zf: 6, cols: 6, r: 1.5, base: 4.2, depth: 3.2 };
const HOMEWARD = [{ x: 10.8, z: 15 }, { x: 32.6, z: 15 }, { x: 32.6, z: 7.7 }];   // lobby to the residence door / 로비에서 아파트 문까지
function cellAt(n) {
  const col = n % RES.cols, row = Math.floor(n / RES.cols), h = Math.sqrt(3) * RES.r;
  const yc = RES.base + h / 2 + row * h + (col % 2) * h / 2;
  return { x: RES.x0 + col * 1.5 * RES.r, yc, y: yc - h / 2 };
}
const WALLS = [0xf6e3b4, 0xe9d8f0, 0xd7ead9, 0xf3d3c4, 0xd6e4f2, 0xf1e9cf];
function buildResidence(cells) {
  const g = new THREE.Group(); world.add(g); W.res = { group: g, cells: [] }; VACANT.map.redraw();
  const n = Math.max(cells.length, 12), rows = Math.ceil(n / RES.cols), h = Math.sqrt(3) * RES.r;
  const xA = RES.x0 - RES.r - .6, xB = RES.x0 + (RES.cols - 1) * 1.5 * RES.r + RES.r + .6, xc = (xA + xB) / 2;
  const top = RES.base + rows * h + h / 2 + .3, back = RES.zf - RES.depth, front = RES.zf + 1, door = HOMEWARD[2].x;
  // the ground: the path from the plaza, the forecourt, a playground and a garden / 바닥: 광장에서 오는 길, 앞마당, 놀이터, 정원
  block(g, door - HOMEWARD[0].x + 2.4, .05, 2.4, C.paving, (HOMEWARD[0].x + door) / 2, -.02, 15, { cast: false });
  block(g, xB - xA + 4, .05, 16.5 - front, C.paving, xc, -.025, (front + 16.5) / 2, { cast: false });
  put(g, geo('sand', () => new THREE.CircleGeometry(2.3, 32)), mat(0xe8d4a2, { roughness: 1 }), xA + 2.6, .04, 11, { rx: -Math.PI / 2, cast: false });
  const slide = new THREE.Group(); slide.position.set(xA + 2.4, 0, 11); slide.rotation.y = .5; g.add(slide);
  block(slide, 1, 1.6, 1, mat(0xe85d75), -.9, 0, 0, { r: .06 }); put(slide, boxG(2.4, .08, .7), mat(0x38b2c9), .35, .85, 0, { rz: -.62 });
  for (const sx of [-1, 1]) block(g, .1, 2.2, .1, C.steel, xA + 6.6 + sx * 1.2, 0, 10.6); block(g, 2.6, .1, .1, C.steel, xA + 6.6, 2.2, 10.6);
  for (const sx of [-.55, .55]) { block(g, .02, 1.6, .02, C.steel, xA + 6.6 + sx, .6, 10.6, { cast: false }); block(g, .5, .05, .25, mat(0xf2c94c), xA + 6.6 + sx, .55, 10.6); }
  for (const x of [xB - 5.6, xB - 2.4]) { block(g, 2.6, .35, 1.6, C.woodDark, x, 0, 11); put(g, geo('bed2', () => new THREE.BoxGeometry(2.4, .3, 1.4)), C.leaf, x, .45, 11); }
  for (const x of [door - 3.2, door + 3.2]) bench(g, x, 13.2, Math.PI);
  // the ground floor: a glass lobby with mailboxes and the name over the door / 1층: 우편함이 있는 유리 로비, 문 위에 이름
  block(g, xB - xA, .25, front - back + .2, C.white, xc, RES.base - .25, (front + back) / 2);
  for (const [x0, x1] of [[xA, door - 1.1], [door + 1.1, xB]]) put(g, boxG(x1 - x0, RES.base - .3, .05), C.glass, (x0 + x1) / 2, (RES.base - .3) / 2, front, { cast: false }).renderOrder = 3;
  for (const x of [xA, xB]) put(g, boxG(.05, RES.base - .3, front - back), C.glass, x, (RES.base - .3) / 2, (front + back) / 2, { cast: false }).renderOrder = 3;
  block(g, .3, 1.6, 2.4, mat(0xb8862f, { roughness: .5, metalness: .4 }), xA + .3, 0, (front + back) / 2);
  block(g, 2.4, .45, .9, C.sofa, xc + 3.5, 0, back + .7, { r: .08 });
  const name = canvasTex(1024, 160, c => { c.clearRect(0, 0, 1024, 160); c.fillStyle = '#3b2a12'; c.font = '800 96px -apple-system, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('HIVE RESIDENCE', 512, 84); });
  put(g, geo('resname', () => new THREE.PlaneGeometry(7, 1.1)), new THREE.MeshBasicMaterial({ map: name, transparent: true }), door, RES.base - .85, front + .04, { cast: false });
  // nothing behind the cells but the view: glass at both ends, a glass lift at the side, a roof garden on top
  // and a pond out back / 칸 뒤에는 전망뿐: 앞뒤 유리, 옆의 유리 엘리베이터, 꼭대기 정원, 뒤뜰 연못
  put(g, boxG(xB - xA, RES.base - .3, .05), C.glass, xc, (RES.base - .3) / 2, back, { cast: false }).renderOrder = 3;
  block(g, xB - xA + .2, .3, front - back + .2, C.white, xc, top, (front + back) / 2);
  for (const [x0, x1] of [[xA, xB]]) for (const z of [back, front]) block(g, x1 - x0, .7, .06, C.glass, (x0 + x1) / 2, top + .3, z, { cast: false });
  for (let k = 0; k < 6; k++) put(g, geo('bush', () => new THREE.IcosahedronGeometry(.45, 1)), k % 2 ? C.leaf : C.leaf2, xA + 1.6 + k * 2.4, top + .65, (back + front) / 2 - .6 + (k % 2) * 1.2, { s: [1.2, 1, 1.2] });
  for (const x of [xc - 1.5, xc + 1.5]) { block(g, .7, .28, 1.8, ROOF.teak, x, top + .3, front - 1.3, { r: .04 }); block(g, .66, .08, 1.1, ROOF.cushion, x, top + .58, front - 1.6, { r: .03 }); }
  const lx = xB + 1.6, lz0 = back + .3, lz1 = RES.zf - .3;
  for (const [w, d, x, z] of [[.04, lz1 - lz0, lx - 1.2, (lz0 + lz1) / 2], [.04, lz1 - lz0, lx + 1.2, (lz0 + lz1) / 2], [2.4, .04, lx, lz0], [2.4, .04, lx, lz1]]) put(g, boxG(w, top + .3, d), C.glassIn, x, (top + .3) / 2, z, { cast: false }).renderOrder = 2;
  for (const x of [lx - 1.2, lx + 1.2]) for (const z of [lz0, lz1]) block(g, .035, top + .3, .035, C.mullion, x, 0, z, { cast: false });
  for (const sx of [-.7, .7]) block(g, .05, top + .3, .05, C.steel, lx + sx, 0, lz0 + .15, { cast: false });
  block(g, 2.2, .1, 2, C.steel, lx, RES.base + h * 1.5, (lz0 + lz1) / 2, { cast: false }); block(g, 2.2, .1, 2, C.steel, lx, RES.base + h * 1.5 + 2.4, (lz0 + lz1) / 2, { cast: false });
  for (const sx of [-1.05, 1.05]) block(g, .05, 2.4, 2, C.glassIn, lx + sx, RES.base + h * 1.5 + .1, (lz0 + lz1) / 2, { cast: false });
  put(g, boxG(2.6, .05, lz1 - lz0 + .2), C.glassIn, lx, top + .3, (lz0 + lz1) / 2, { cast: false }).renderOrder = 2;
  const pz = back - 9;
  put(g, geo('pond', () => new THREE.CircleGeometry(5.5, 40)), mat(0x5aa9d6, { roughness: .08, metalness: .2 }), xc, .03, pz, { rx: -Math.PI / 2, cast: false, s: [1.5, 1, 1] });
  put(g, geo('pondrim', () => new THREE.RingGeometry(5.5, 6.1, 40)), C.stone, xc, .035, pz, { rx: -Math.PI / 2, cast: false, s: [1.5, 1, 1] });
  for (let k = 0; k < 9; k++) { const a = k * .7 + .3; put(g, cylG(.03, .03, 1.1, 5), C.leaf2, xc + Math.cos(a) * 8.6, .55, pz + Math.sin(a) * 5.7, { cast: false }); }
  for (const [x, z, s2] of [[xc - 6, pz + 3.5, 1], [xc + 7, pz - 2, .8], [xc + 2, pz + 5.2, .6]]) put(g, geo('rock', () => new THREE.DodecahedronGeometry(.6, 0)), C.stone, x, .3 * s2, z, { s: [s2, s2 * .7, s2] });
  bench(g, xc - 3, back - 2.6, Math.PI); bench(g, xc + 3, back - 2.6, Math.PI);
  // the cells: hexagonal tubes in a honeycomb, glass at both ends for the view, a rug of its own, a bed and a lamp
  // 칸: 벌집처럼 엇갈린 육각 통. 전망을 위해 앞뒤 유리, 저마다 다른 러그, 침대와 등
  const tube = geo('hextube', () => new THREE.CylinderGeometry(RES.r, RES.r, RES.depth, 6, 1, true).rotateX(Math.PI / 2).rotateZ(Math.PI / 6));
  const rim = geo('hexrim', () => new THREE.RingGeometry(RES.r - .02, RES.r + .14, 6));
  const pane = geo('hexpane', () => new THREE.CircleGeometry(RES.r, 6));
  const shell = mat(0xf7f3ea, { roughness: .6, side: THREE.DoubleSide }), honeyRim = mat(0xf2b632, { roughness: .35, metalness: .3, side: THREE.DoubleSide });
  for (let k = 0; k < rows * RES.cols; k++) {
    const c = cellAt(k), who = cells[k];
    put(g, tube, shell, c.x, c.yc, RES.zf - RES.depth / 2);
    put(g, rim, honeyRim, c.x, c.yc, RES.zf + .01, { cast: false });
    put(g, pane, C.glass, c.x, c.yc, back, { cast: false }).renderOrder = 3; put(g, rim, honeyRim, c.x, c.yc, back - .01, { cast: false });
    block(g, 1.4, .02, 2.4, mat(WALLS[k % WALLS.length], { roughness: 1 }), c.x, c.y + .01, RES.zf - 1.6, { cast: false });
    block(g, .8, .32, 1.5, ROOF.cushion, c.x, c.y, RES.zf - 2.2);
    block(g, .82, .08, 1.5, mat(WALLS[(k + 2) % WALLS.length], { roughness: .95 }), c.x, c.y + .32, RES.zf - 2.2, { cast: false });
    if (k % 3 === 1) plant(g, c.x - .5, RES.zf - 2.9, .6, c.y + .02);
    const glass = put(g, pane, C.glass, c.x, c.yc, RES.zf, { cast: false }); glass.renderOrder = 3;
    const glow = put(g, pane, RES_GLOW, c.x, c.yc, RES.zf - .04, { cast: false }); glow.userData.keep = true; glow.visible = false; glow.renderOrder = 2;
    const lamp = put(g, sphG(.12, 12), C.light, c.x, c.yc + .95, RES.zf - 2, { cast: false }); lamp.userData.keep = true;
    if (who && who.left) { const sign = put(g, geo('vacant', () => new THREE.PlaneGeometry(1.3, .5)), VACANT, c.x, c.yc - .1, RES.zf - .08, { cast: false }); sign.userData.keep = true; }
    W.res.cells.push({ ...c, glow, lamp, who });
  }
// the lit windows and the vacancy signs stay apart; the rest is baked / 불 켜진 창과 빈집 팻말은 따로, 나머지는 굽는다
  bake(g);
}
const RES_GLOW = new THREE.MeshBasicMaterial({ color: 0xffd68a, transparent: true, opacity: .35, depthWrite: false, side: THREE.DoubleSide });
const VACANT = new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(256, 96, c => {
  c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 256, 96); c.strokeStyle = '#b33a2a'; c.lineWidth = 6; c.strokeRect(4, 4, 248, 88);
  c.fillStyle = '#b33a2a'; c.font = '800 46px -apple-system, "Apple SD Gothic Neo", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(L === 'ko' ? '빈집' : 'VACANT', 128, 50);
}) });
const lateNight = () => { const h = new Date().getHours(); return h >= 23 || h < 6; };
function homeGoal(b) {
  const c = W.res && W.res.cells[b.house ?? -1], D = HOMEWARD[HOMEWARD.length - 1];
  if (!c) return { floor: -1, x: D.x, y: 0, z: D.z + 1, look: [0, 1], pose: 'chat', key: 'door' };
  const z = lateNight();
  return { floor: -1, home: true, x: c.x, y: c.y, z: RES.zf - 1.45, look: [0, 1], pose: z ? 'lie' : 'sit', seatY: z ? .3 : .34, key: 'home' + (z ? 'z' : '') };
}
// the lamps: on in a flat with its bee at home and awake / 등: 벌이 집에 있고 깨어 있는 칸만 켜진다
function homeLights() {
  if (!W.res) return;
  const lit = new Set();
  for (const b of bees.values()) if (b.goal && b.goal.home && b.arrived && b.goal.pose !== 'lie') lit.add(b.house);
  W.res.cells.forEach((c, k) => { const on = lit.has(k); c.glow.visible = on; c.lamp.material = on ? C.light : C.screenOff; });
}

// ── bees / 벌 ─────────────────────────────────────────────────────────────────────────────────────────────
// Every bee has a look of its own, drawn from its project and name, so it stays the same bee across restarts:
// a tone, a build, hair, a hat, glasses, a beard, what it wears (in its project's colour).
// 벌마다 자기 생김새가 있다. 프로젝트와 이름에서 정해져 다시 켜도 같은 벌이다: 색, 체격, 머리, 모자, 안경, 수염, 옷 (프로젝트 색).
const rng = seed => {
  let a = 2166136261; for (const ch of String(seed)) a = Math.imul(a ^ ch.charCodeAt(0), 16777619);
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
};
const HAIR = [0x2a1f1a, 0x4a2e1c, 0x7a4a28, 0xd9b46a, 0xb5452f, 0xe8e4dc, 0x3c3c44, 0x6d4aa0];
const DYE = [0xe85d75, 0x4a7bd0, 0x2fa37a, 0x8b5cf6, 0xf08a3c, 0x2b2f36, 0xf4f1ea, 0xd94141, 0x38b2c9, 0xf2c94c];
const TONES = [[0xffd34d, 0xffffff], [0xffc53a, 0xfff0d0], [0xffe27a, 0xfffbe8], [0xf4b13a, 0xffe2b8], [0xffd866, 0xf2f2ff]];
function persona(seed) {
  const r = rng(seed), one = list => list[Math.floor(r() * list.length)], u = r();
  const sex = u < .46 ? 'f' : u < .92 ? 'm' : 'n';
  return {
    sex, tone: one(TONES), size: .9 + r() * .2, wide: .92 + r() * .18, eye: .066 + r() * .02,
    hair: one(sex === 'f' ? ['ponytail', 'bun', 'pigtails', 'bob', 'bob'] : sex === 'm' ? [null, null, 'tuft', 'mohawk', 'side'] : [null, 'tuft', 'bun', 'side']), hairCol: one(HAIR),
    hat: r() < .5 ? one(sex === 'f' ? ['bow', 'beret', 'sunhat', 'flower', 'beanie', 'cap'] : sex === 'm' ? ['cap', 'cap', 'beanie', 'top', 'fedora', 'headband', 'hardhat'] : ['beanie', 'cap', 'beret', 'headband', 'flower']) : null,
    hatCol: one(DYE), backwards: r() < .3,
    face: sex === 'm' && r() < .55 ? one(['beard', 'mustache', 'goatee', 'full']) : null,
    glasses: r() < .4 ? one(['round', 'square', 'sun', 'half']) : null, glassCol: one([0x1d1d1f, 0x6b3e1f, 0xb8862f, 0xc0392b, 0x2f5fa0]),
    lips: sex === 'f' && r() < .6,
    wear: one(sex === 'f' ? ['scarf', 'skirt', 'skirt', 'necklace', 'vest', 'hoodie', 'backpack', 'overalls'] : ['scarf', 'tie', 'tie', 'bowtie', 'vest', 'hoodie', 'backpack', 'overalls']),
  };
}
const dome = r => geo(`dome${r}`, () => new THREE.SphereGeometry(r, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2));
// puts on what the persona says; returns the top of the head with its hat, from the head's centre
// 생김새대로 입히고 씌운다. 모자까지 친 머리 꼭대기 (머리 가운데부터) 를 돌려준다
function dress(b, P, body, head) {
  const nc = { cast: false }, M = c => mat(c, { roughness: .75 }), hat = M(P.hat === 'hardhat' ? 0xf2a900 : P.hatCol), hair = M(P.hairCol), own = mat(b.col.getHex(), { roughness: .8 });
  let top = .27;
  // the face: a smile (lips for some), lashes, glasses, a beard / 얼굴: 웃는 입 (어떤 벌은 입술), 속눈썹, 안경, 수염
  put(head, geo(P.lips ? 'lips' : 'smile', () => new THREE.TorusGeometry(.05, P.lips ? .017 : .011, 6, 14, Math.PI)), P.lips ? mat(0xd9435e, { roughness: .4 }) : BEE.limb, 0, -.09, .245, { rz: Math.PI, rx: .3, ...nc });
  if (P.sex === 'f') for (const sx of [-1, 1]) for (const k of [0, 1]) put(head, boxG(.05, .012, .012), BEE.limb, sx * (.14 + k * .03), .085 + P.eye * .5 - k * .025, .2, { rz: sx * (.5 + k * .4), ...nc });
  if (P.glasses) {
    const fz = .225 + P.eye + .012, fr = mat(P.glassCol, { roughness: .35, metalness: .3 }), sq = P.glasses === 'square' || P.glasses === 'half';
    const ring = sq ? geo('gsq', () => new THREE.TorusGeometry(.1, .012, 6, 4).rotateZ(Math.PI / 4)) : geo('gro', () => new THREE.TorusGeometry(.088, .012, 8, 20));
    const gy = P.glasses === 'half' ? .005 : .03;
    for (const sx of [-1, 1]) {
      put(head, ring, fr, sx * .1, gy, fz, { s: P.glasses === 'half' ? [1, .6, 1] : null, ...nc });
      if (P.glasses === 'sun') put(head, geo('lens', () => new THREE.CircleGeometry(.086, 20)), mat(0x141820, { roughness: .1, metalness: .5 }), sx * .1, gy, fz - .003, nc);
      block(head, .014, .014, .26, fr, sx * .225, gy - .007, fz - .13, { ry: -sx * .27, ...nc });
    }
    block(head, .06, .014, .014, fr, 0, gy, fz, nc);
  }
  if (P.face === 'beard' || P.face === 'full') {
    put(head, geo('beard', () => new THREE.SphereGeometry(.285, 22, 10, 0, Math.PI, Math.PI * .6, Math.PI * .4)), hair, 0, 0, .005, nc);
    put(head, sphG(.11, 14), hair, 0, -.23, .13, { s: [1.1, .9, .8], ...nc });
  }
  if (P.face === 'mustache' || P.face === 'full') for (const sx of [-1, 1]) put(head, geo('stache', () => new THREE.CapsuleGeometry(.024, .07, 4, 8)), hair, sx * .048, -.05, .262, { rz: sx * 1.2, ...nc });
  if (P.face === 'goatee') put(head, geo('goatee', () => new THREE.ConeGeometry(.05, .13, 10)), hair, 0, -.29, .13, { rx: Math.PI - .4, ...nc });
  // hair / 머리카락
  const cap = geo('hcap', () => new THREE.SphereGeometry(.288, 24, 12, Math.PI * .85, Math.PI * 1.3, 0, Math.PI * .5));
  const bang = () => put(head, geo('bang', () => new THREE.SphereGeometry(.286, 20, 6, Math.PI * .2, Math.PI * .6, 0, Math.PI * .26)), hair, 0, 0, 0, nc);
  const spikes = list => list.forEach(([x, z, rz, rx]) => put(head, geo('spike', () => new THREE.ConeGeometry(.045, .14, 8)), hair, x, .29, z, { rz, rx, ...nc }));
  if (P.hair === 'bob') { put(head, geo('bob', () => new THREE.SphereGeometry(.295, 24, 14, Math.PI * .85, Math.PI * 1.3, 0, Math.PI * .64)), hair, 0, 0, 0, nc); bang(); }
  if (['ponytail', 'bun', 'pigtails', 'side'].includes(P.hair)) { put(head, cap, hair, 0, 0, 0, nc); bang(); }
  if (P.hair === 'ponytail') { put(head, sphG(.07, 12), hair, 0, .1, -.29, nc); put(head, geo('tail', () => new THREE.CapsuleGeometry(.065, .2, 4, 10)), hair, 0, -.05, -.35, { rx: .35, ...nc }); }
  if (P.hair === 'bun') put(head, sphG(.11, 14), hair, 0, .25, -.1, nc);
  if (P.hair === 'pigtails') for (const sx of [-1, 1]) { put(head, sphG(.085, 12), hair, sx * .26, .02, -.08, nc); put(head, geo('tail', () => new THREE.CapsuleGeometry(.065, .2, 4, 10)), hair, sx * .3, -.12, -.1, { rz: sx * .3, s: [.8, .7, .8], ...nc }); }
  if (P.hair === 'tuft' && !P.hat) spikes([[0, .02, 0, 0], [-.06, -.02, .5, 0], [.06, -.02, -.5, 0]]);
  if (P.hair === 'mohawk' && !P.hat) spikes([[0, .12, 0, .5], [0, .04, 0, .2], [0, -.05, 0, -.1], [0, -.14, 0, -.5]]);
  // a hat / 모자
  const H = new THREE.Group(); head.add(H); if (P.backwards && P.hat === 'cap') H.rotation.y = Math.PI;
  const disc = (r, h, y, m = hat) => put(H, cylG(r, r, h, 28), m, 0, y, 0, nc);
  switch (P.hat) {
    case 'cap': put(H, dome(.3), hat, 0, .02, 0, { s: [1, .9, 1] }); put(H, geo('brim', () => new THREE.CylinderGeometry(.2, .2, .02, 20, 1, false, -Math.PI / 2, Math.PI)), hat, 0, .07, .2, { rx: .12, ...nc }); put(H, sphG(.03, 8), hat, 0, .3, 0, nc); top = .31; break;
    case 'beanie': put(H, dome(.3), hat, 0, 0, 0); put(H, geo('band', () => new THREE.TorusGeometry(.29, .04, 8, 28)), hat, 0, .04, 0, { rx: Math.PI / 2, ...nc }); put(H, sphG(.075, 12), M(0xffffff), 0, .33, 0, nc); top = .4; break;
    case 'top': disc(.32, .02, .2); put(H, cylG(.19, .19, .36, 22), hat, 0, .38, 0); put(H, cylG(.195, .195, .06, 22), M(0xb33a2a), 0, .25, 0, nc); top = .58; break;
    case 'fedora': disc(.4, .02, .17); put(H, cylG(.2, .23, .18, 22), hat, 0, .27, 0); put(H, cylG(.235, .235, .045, 22), BEE.limb, 0, .2, 0, nc); top = .38; break;
    case 'beret': put(H, cylG(.28, .25, .07, 24), hat, .04, .24, 0, { rz: -.25 }); put(H, sphG(.025, 8), hat, .1, .3, 0, nc); top = .33; break;
    case 'sunhat': disc(.5, .02, .15, hat); put(H, dome(.26), hat, 0, .12, 0); put(H, cylG(.262, .262, .05, 24), M(0xffffff), 0, .15, 0, nc); top = .38; break;
    case 'headband': put(H, geo('hband', () => new THREE.TorusGeometry(.272, .032, 8, 28)), hat, 0, .1, 0, { rx: Math.PI / 2 - .15, ...nc }); break;
    case 'hardhat': put(H, dome(.31), hat, 0, .02, 0, { s: [1, .88, 1] }); disc(.36, .025, .04); put(H, boxG(.05, .05, .5), hat, 0, .28, 0, nc); top = .32; break;
    case 'bow': case 'flower': {
      const g = new THREE.Group(); g.position.set(.16, .19, .08); g.rotation.set(-.3, .5, -.5); H.add(g);
      if (P.hat === 'bow') { for (const sx of [-1, 1]) put(g, geo('bowc', () => new THREE.ConeGeometry(.07, .15, 12)), hat, sx * .075, 0, 0, { rz: sx * Math.PI / 2, ...nc }); put(g, sphG(.035, 10), hat, 0, 0, 0, nc); }
      else { for (let k = 0; k < 5; k++) put(g, sphG(.05, 10), hat, Math.cos(k * 1.257) * .06, Math.sin(k * 1.257) * .06, 0, { s: [1, 1, .5], ...nc }); put(g, sphG(.035, 10), M(0xffd34d), 0, 0, .02, nc); }
      break;
    }
  }
  // what it wears, in its project's colour / 옷, 프로젝트 색
  const shell = (t0, t1, open) => geo(`sh${t0},${t1},${open}`, () => new THREE.SphereGeometry(1, 28, 14, open ? Math.PI * .5 + .45 : 0, open ? Math.PI * 2 - .9 : Math.PI * 2, t0, t1 - t0));
  const fit = [.355, .435, .325];
  switch (P.wear) {
    case 'scarf': put(body, geo('scarf', () => new THREE.TorusGeometry(.2, .05, 10, 24)), own, 0, .93, 0, { rx: Math.PI / 2 }); put(body, boxG(.09, .22, .03, .01), own, .1, .76, .25, { rz: .2, rx: -.3, ...nc }); break;
    case 'tie': put(body, geo('collar', () => new THREE.TorusGeometry(.17, .03, 8, 20)), M(0xffffff), 0, .95, 0, { rx: Math.PI / 2, ...nc }); put(body, boxG(.075, .26, .02), own, 0, .76, .3, { rx: -.3, ...nc }); put(body, boxG(.08, .06, .035), own, 0, .9, .26, nc); break;
    case 'bowtie': case 'barman':
      for (const sx of [-1, 1]) put(body, geo('bowc', () => new THREE.ConeGeometry(.07, .15, 12)), P.wear === 'barman' ? BEE.limb : own, sx * .075, .93, .24, { rz: sx * Math.PI / 2, ...nc });
      put(body, sphG(.035, 10), P.wear === 'barman' ? BEE.limb : own, 0, .93, .25, nc);
      if (P.wear === 'barman') { block(body, .4, .44, .015, M(0xf4f1ea), 0, .28, .3, nc); for (const sx of [-1, 1]) block(body, .03, .3, .015, M(0xf4f1ea), sx * .14, .7, .27, { rx: -.3, ...nc }); }
      break;
    case 'vest': put(body, shell(0, 1.85, true), own, 0, .62, 0, { s: fit }); break;
    case 'hoodie': put(body, shell(0, 1.62), own, 0, .62, 0, { s: fit }); put(body, geo('hood', () => new THREE.TorusGeometry(.17, .07, 8, 20)), own, 0, .98, -.12, { rx: Math.PI / 2 - .5, ...nc }); break;
    case 'overalls': {
      const denim = M(0x3b5b8c);
      put(body, shell(1.55, Math.PI), denim, 0, .62, 0, { s: fit }); block(body, .26, .17, .02, denim, 0, .62, .305, nc);
      for (const sx of [-1, 1]) block(body, .045, .3, .02, denim, sx * .11, .74, .28, { rx: -.35, ...nc });
      put(body, sphG(.025, 8), own, .08, .74, .315, nc); break;
    }
    case 'skirt': put(body, geo('skirt', () => new THREE.CylinderGeometry(.29, .43, .26, 26, 1, true)), mat(b.col.getHex(), { roughness: .8, side: THREE.DoubleSide }), 0, .33, 0); break;
    case 'necklace': put(body, geo('neck', () => new THREE.TorusGeometry(.2, .013, 6, 26)), mat(0xe8c56a, { roughness: .3, metalness: .7 }), 0, .95, .02, { rx: Math.PI / 2 - .25, ...nc }); put(body, sphG(.035, 10), own, 0, .9, .23, nc); break;
    case 'backpack': block(body, .36, .38, .18, own, 0, .42, -.36, { r: .06 }); block(body, .3, .1, .2, own, 0, .7, -.36, { r: .04, ...nc }); break;
  }
  return top;
}

const bees = new Map();
const TINT = new Map();
function makeBee(b) {
  const P = b.persona || persona(b.s ? b.s.bee || `${b.s.project}/${b.s.name}` : b.key);
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  body.scale.set(P.size * P.wide, P.size, P.size * P.wide);
  const pick = [];
  const tk = P.tone.join();
  if (!TINT.has(tk)) TINT.set(tk, { body: new THREE.MeshStandardMaterial({ map: STRIPES, color: P.tone[1], roughness: .55 }), head: mat(P.tone[0], { roughness: .5 }) });
  const T = TINT.get(tk);
  const torso = put(body, sphG(1, 28), T.body, 0, .62, 0, { s: [.34, .42, .31] }); torso.rotation.x = Math.PI; pick.push(torso);
  const head = new THREE.Group(); head.position.set(0, 1.13, .02); body.add(head);
  pick.push(put(head, sphG(.27, 24), T.head, 0, 0, 0));
  for (const sx of [-1, 1]) {
    put(head, sphG(P.eye, 14), BEE.eye, sx * .1, .03, .225, { cast: false }); put(head, sphG(.025, 8), BEE.shine, sx * .1 + .02, .06, .22 + P.eye, { cast: false });
    put(head, sphG(.045, 10), BEE.cheek, sx * .17, -.07, .2, { cast: false, s: [1, .6, .5] });
    const ant = new THREE.Group(); ant.position.set(sx * .09, .22, 0); ant.rotation.z = -sx * .35; head.add(ant);
    put(ant, cylG(.012, .012, .26, 6), BEE.limb, 0, .13, 0, { cast: false }); put(ant, sphG(.04, 10), BEE.limb, 0, .27, 0, { cast: false });
  }
  const top = dress(b, P, body, head);
  const wings = [];
  for (const sx of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(sx * .12, .86, -.22); body.add(w);
    put(w, geo('wing', () => new THREE.CircleGeometry(.3, 20)), BEE.wing, sx * .26, .12, 0, { s: [1, .62, 1], cast: false, ry: sx * .3 }).renderOrder = 4;
    wings.push(w);
  }
  const arms = [];
  for (const sx of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(sx * .29, .8, .02); body.add(a);
    put(a, geo('arm', () => new THREE.CapsuleGeometry(.055, .2, 4, 8)), BEE.limb, 0, -.15, 0);
    arms.push(a);
  }
  const legs = [];
  for (const sx of [-1, 1]) { const l = new THREE.Group(); l.position.set(sx * .12, .26, 0); body.add(l); put(l, geo('leg', () => new THREE.CapsuleGeometry(.065, .14, 4, 8)), BEE.limb, 0, -.14, 0); legs.push(l); }
  // things a bee holds in its right hand / 오른손에 드는 것들
  const hand = new THREE.Group(); hand.position.set(0, -.32, .08); arms[1].add(hand);
  const jar = new THREE.Group(); hand.add(jar); put(jar, cylG(.1, .1, .17, 16), C.honey, 0, 0, 0); put(jar, cylG(.105, .105, .04, 16), mat(0xb33a2a), 0, .1, 0);
  const cup = put(hand, cylG(.06, .05, .12, 12), BEE.cup, 0, 0, 0);
  const mug = new THREE.Group(); hand.add(mug); put(mug, cylG(.065, .06, .16, 14), BEE.beer, 0, 0, 0, { cast: false }); put(mug, cylG(.068, .068, .04, 14), BEE.cup, 0, .09, 0, { cast: false });
  const paddle = new THREE.Group(); hand.add(paddle); put(paddle, cylG(.13, .13, .02, 16), BEE.paddle, 0, .12, 0, { rx: Math.PI / 2 }); put(paddle, cylG(.02, .02, .12, 6), C.woodDark, 0, 0, 0);
  const papers = block(hand, .22, .08, .28, BEE.paper, 0, -.02, .05);
  pick.forEach(m => { m.userData.bee = b; });
  // the name tag and the question bubble, above the hat / 이름표와 질문 말풍선, 모자 위에
  // each in a wrapper: the label renderer owns the wrapper's transform, the inside keeps its own offset and bob
  // 감싸개 안에: 라벨 렌더러가 감싸개의 transform 을 쓰고, 안쪽은 자기 위치와 출렁임을 지킨다
  const wrap = el => { const w = document.createElement('div'); w.append(el); return new CSS2DObject(w); };
  const above = (1.13 + top) * P.size + .22;
  const tagEl = document.createElement('div'); tagEl.className = 'tag'; const tag = wrap(tagEl); tag.position.set(0, above, 0); g.add(tag);
  const askEl = document.createElement('div'); askEl.className = 'ask'; askEl.innerHTML = '<b>?</b><span></span>'; askEl.addEventListener('click', () => visit(b));
  const ask = wrap(askEl); ask.position.set(0, above, 0); g.add(ask);
  scene.add(g);
  Object.assign(b, { g, body, head, wings, arms, feet: legs, jar, cup, mug, paddle, papers, tag, tagEl, ask, askEl, pick, persona: P });
}

// where a bee belongs now: a floor, a point, how it looks and what it does there / 지금 벌이 있을 곳
const TEAM_SEAT_S = 45;
function decide(b) {
  if (b.s.state === 'home') return homeGoal(b);
  const s = b.s, d = W.desks.get(b.key), age = b.age;
  if (d && d.room) {
    const R = d.room, seat = d.seat;
    if (s.state === 'run') return { floor: d.floor, ...seat, pose: 'type', key: 'seat' };
    if (s.state === 'wait') return { floor: d.floor, x: seat.x + seat.look[0] * -.55, z: seat.z + seat.look[1] * -.55, look: seat.look, pose: 'wait', key: 'standby' };
    if (s.state === 'done') {
      if (seat.head) return { floor: d.floor, ...seat, pose: 'jar', key: 'seat' };
      const pr = R.present[Math.max(0, d.n - 1) % R.present.length];
      return { floor: d.floor, ...pr, pose: 'jar', key: 'present' };
    }
    if (age < TEAM_SEAT_S) return { floor: d.floor, ...seat, pose: 'sit', key: 'seat' };
    return lounge(b);
  }
  if (d) {
    if (s.state === 'run' && s.plan) {
      const F = W.floors[d.floor], k = b.meetIdx ?? 0;
      return k === 0 && W.meetBoard ? { floor: d.floor, ...W.meetBoard, pose: 'board', key: 'board' } : { floor: d.floor, ...(F.meet[k % F.meet.length]), pose: 'sit', key: 'meet' + k };
    }
    if (s.state === 'run') return { floor: d.floor, ...d.seat, pose: 'type', key: 'seat' };
    if (s.state === 'wait') return { floor: d.floor, ...d.stand, pose: 'wait', key: 'stand' };
    if (s.state === 'done') return { floor: d.floor, ...d.stand, pose: 'jar', key: 'stand' };
  }
  return lounge(b);
}
// a resting spot of its own, kept a few minutes, then another / 자기 쉬는 자리. 몇 분 지키다 다른 곳으로
function lounge(b) {
  const now = performance.now();
  if (!b.spot || now > b.spotUntil || !W.spots.includes(b.spot)) {
    if (b.spot) b.spot.by = null;
    const free = W.spots.filter(s => !s.by), pref = hueOf(b.key) % Math.max(1, free.length);
    b.spot = free.length ? free[(pref + Math.floor(now / 60000)) % free.length] : null;
    if (b.spot) b.spot.by = b;
    b.spotUntil = now + (120 + Math.random() * 180) * 1000;
  }
  if (!b.spot) { const a = hueOf(b.key) % 360 * Math.PI / 180; return { floor: 0, x: Math.cos(a) * 8, z: 20 + Math.sin(a) * 4, look: [0, -1], pose: 'chat', key: 'mill' }; }
  return { floor: 0, ...b.spot, key: 'spot' + W.spots.indexOf(b.spot) };
}

// a route: walk to the lift, ride, walk on; home and back by the path, flying up to the flat
// 경로: 엘리베이터까지 걷고, 타고, 다시 걷는다. 집은 길을 따라 걷고 자기 칸까지 날아 오른다
function route(b, goal) {
  b.legs = [];
  const inside = (from, to) => {
    if (from !== to.floor) { b.legs.push({ walk: from, to: LIFT }); b.legs.push({ ride: to.floor }); }
    b.legs.push({ walk: to.floor, to });
  };
  if (b.floor === -1 && goal.floor === -1) {
    if (Math.abs(b.y - goal.y) > .1) {
      if (b.pos.z < RES.zf + .5) b.legs.push({ line: { x: b.pos.x, y: b.y, z: RES.zf + .9 } });
      b.legs.push({ line: { x: goal.x, y: goal.y, z: RES.zf + .9 }, fly: true });
    }
    b.legs.push({ line: { x: goal.x, y: goal.y, z: goal.z } });
  }
  else if (b.floor === -1) {   // to work: out of the flat, down, along the path, into the lobby / 출근: 칸을 나와, 내려와, 길 따라, 로비로
    const D = HOMEWARD[HOMEWARD.length - 1];
    if (b.y > .1) b.legs.push({ line: { x: b.pos.x, y: b.y, z: RES.zf + .9 } }, { line: { x: D.x, y: 0, z: D.z }, fly: true });
    [...HOMEWARD].reverse().slice(1).forEach((p, k, a) => b.legs.push({ line: { x: p.x, y: 0, z: p.z }, floor: k === a.length - 1 ? 0 : -1 }));
    inside(0, goal);
  } else if (goal.floor === -1) {   // home: clap, down to the lobby, out along the path, fly up and in / 퇴근: 박수, 로비로, 길 따라, 날아 올라 들어간다
    if (goal.home && !b.fresh) b.legs.push({ wait: 2, pose: 'clap' });
    inside(b.floor, { floor: 0, ...HOMEWARD[0] });
    HOMEWARD.slice(1).forEach(p => b.legs.push({ line: { x: p.x, y: 0, z: p.z }, floor: -1 }));
    if (goal.y > .1) b.legs.push({ line: { x: goal.x, y: goal.y, z: RES.zf + .9 }, fly: true });
    b.legs.push({ line: { x: goal.x, y: goal.y, z: goal.z } });
  } else inside(b.floor, goal);
  b.path = null;
}
function step(b, dt) {
  const leg = b.legs[0];
  if (!leg) { b.moving = false; return; }
  const speed = (b.sprint ? 3.8 : 1.7) * dt;
  b.flying = false;
  if (leg.wait !== undefined) { leg.wait -= dt; b.moving = false; if (leg.wait <= 0) b.legs.shift(); return; }
  if (leg.line) {   // straight, in the open: the path, or flying to a flat / 바깥에서 곧장: 길, 또는 칸으로 날기
    if (leg.floor !== undefined) b.floor = leg.floor;
    const p = leg.line, dx = p.x - b.pos.x, dy = p.y - b.y, dz = p.z - b.pos.z, d = Math.hypot(dx, dy, dz), v = (leg.fly ? 3.4 : b.sprint ? 3.8 : 1.7) * dt;
    if (d <= v) { b.pos.x = p.x; b.y = p.y; b.pos.z = p.z; b.legs.shift(); } else { b.pos.x += dx / d * v; b.y += dy / d * v; b.pos.z += dz / d * v; }
    if (Math.hypot(dx, dz) > .05) b.facing = Math.atan2(dx, dz);
    b.moving = true; b.flying = !!leg.fly;
    return;
  }
  if (leg.ride !== undefined) {
    if (!b.riding) { b.riding = { from: b.floor * FH }; b.pos.x = LIFT.x; b.pos.z = LIFT.carZ; }
    const ty = leg.ride * FH, dy = ty - b.y, v = Math.min(Math.abs(dy), 3.2 * dt) * Math.sign(dy);
    b.y += v; W.lift.position.y = b.y; b.moving = false; b.facing = 0;
    if (Math.abs(ty - b.y) < .01) { b.y = ty; b.floor = leg.ride; b.riding = null; b.legs.shift(); b.pos.z = LIFT.z; }
    return;
  }
  if (!b.path) b.path = W.grids[leg.walk].path(b.pos, leg.to);
  const p = b.path[0];
  if (!p) { b.legs.shift(); b.path = null; return; }
  const dx = p.x - b.pos.x, dz = p.z - b.pos.z, d = Math.hypot(dx, dz);
  if (d <= speed) { b.pos.x = p.x; b.pos.z = p.z; b.path.shift(); } else { b.pos.x += dx / d * speed; b.pos.z += dz / d * speed; }
  if (d > .01) b.facing = Math.atan2(dx, dz);
  b.moving = true;
}

// the pose, every frame / 매 프레임 자세
function animate(b, t, dt) {
  const st = b.legs.length ? b.legs[0].pose || 'walk' : b.goal ? b.goal.pose : 'walk', ph = t + b.phase;
  const here = b.arrived && !b.legs.length, sit = here && ['type', 'sit', 'beer'].includes(st) && b.goal.seatY !== undefined;
  // in the water only the top half shows; a lap swimmer goes round its spot / 물속에서는 윗몸만. 랩 수영은 자리를 돈다
  const swim = here && st === 'swim', lap = swim && b.goal.lap && !reduced ? ph * .35 : null;
  const seatY = sit ? b.goal.seatY - .2 : here && st === 'lie' ? b.goal.seatY : swim ? -.3 + (b.goal.sink || 0) + Math.sin(ph * 2) * .03 : 0;
  b.g.position.set(b.pos.x + (lap !== null ? Math.cos(lap) * .9 : 0), b.y + (b.floor === -1 ? 0 : lift(b.y)) + seatY, b.pos.z + (lap !== null ? Math.sin(lap) * .6 : 0));
  let face = b.facing;
  if (!b.legs.length && b.goal && b.goal.look) face = Math.atan2(b.goal.look[0], b.goal.look[1]);
  if (lap !== null) face = Math.atan2(-Math.sin(lap) * .9, Math.cos(lap) * .6);
  if (st === 'pong' && b.arrived) face = Math.atan2(b.goal.look[0], b.goal.look[1]);
  b.g.rotation.y += (((face - b.g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 10);
  const [la, ra] = b.arms, [ll, rl] = b.feet, flap = reduced ? 0 : Math.sin(ph * (b.sprint && b.moving ? 60 : st === 'wait' ? 30 : 8)) * (b.sprint && b.moving ? .9 : st === 'wait' ? .5 : .15);
  b.wings[0].rotation.y = -.25 - flap; b.wings[1].rotation.y = .25 + flap;
  b.body.position.y = 0; b.body.rotation.x = 0; b.body.rotation.z = 0; la.rotation.set(0, 0, .15); ra.rotation.set(0, 0, -.15); ll.rotation.x = 0; rl.rotation.x = 0;
  b.jar.visible = st === 'jar' && b.arrived; b.cup.visible = st === 'coffee' && b.arrived; b.mug.visible = st === 'beer' && b.arrived; b.paddle.visible = st === 'pong' && b.arrived; b.papers.visible = false;
  b.head.rotation.x = 0;
  if (reduced) return;
  if (b.flying) {   // wings a blur, legs hanging / 날갯짓, 다리는 늘어뜨리고
    const f = Math.sin(ph * 60) * .9; b.wings[0].rotation.y = -.25 - f; b.wings[1].rotation.y = .25 + f;
    ll.rotation.x = rl.rotation.x = .4; la.rotation.z = .6; ra.rotation.z = -.6; b.body.rotation.x = .15; b.body.position.y = Math.sin(ph * 6) * .05;
    return;
  }
  if (st === 'clap') { la.rotation.set(-1.3, 0, .55 + Math.sin(ph * 14) * .25); ra.rotation.set(-1.3, 0, -.55 - Math.sin(ph * 14) * .25); b.body.position.y = Math.abs(Math.sin(ph * 7)) * .08; return; }
  if (b.moving || st === 'walk') {
    const w = Math.sin(ph * (b.sprint ? 18 : 9));
    ll.rotation.x = w * .6; rl.rotation.x = -w * .6; la.rotation.x = -w * .5; ra.rotation.x = w * .5;
    b.body.position.y = Math.abs(Math.cos(ph * (b.sprint ? 18 : 9))) * (b.sprint ? .08 : .04);
    if (b.sprint) { b.body.rotation.x = .25; b.body.position.y += .25 + Math.sin(ph * 5) * .05; }
    return;
  }
  if (sit) { ll.rotation.x = -1.4; rl.rotation.x = -1.4; }
  if (st === 'type') { la.rotation.x = -1.1 + Math.sin(ph * 22) * .12; ra.rotation.x = -1.1 + Math.cos(ph * 19) * .12; b.head.rotation.x = .12; }
  else if (st === 'sit') { b.body.position.y = Math.sin(ph * 1.5) * .01; la.rotation.x = -.3; ra.rotation.x = -.3; b.head.rotation.x = 0; }
  else if (st === 'wait') { ra.rotation.z = -2.6 + Math.sin(ph * 6) * .25; b.body.position.y = Math.abs(Math.sin(ph * 3)) * .1; b.head.rotation.x = -.1; }
  else if (st === 'jar') { ra.rotation.x = -1.2; ra.rotation.z = -.2; b.body.position.y = Math.max(0, Math.sin(ph * 2.2)) * .18; }
  else if (st === 'coffee') { ra.rotation.x = -1.3 - Math.max(0, Math.sin(ph * .8)) * .5; b.head.rotation.x = 0; }
  else if (st === 'pong') { ra.rotation.x = -1 + Math.sin(ph * 3.2 + b.goal.pong * Math.PI) * .7; ra.rotation.z = -.4; b.body.position.y = Math.abs(Math.sin(ph * 3.2)) * .05; }
  else if (st === 'board') { ra.rotation.x = -1.9 + Math.sin(ph * 4) * .2; ra.rotation.z = -.2 + Math.cos(ph * 3) * .2; }
  else if (st === 'beer') { ra.rotation.x = -1.2 - Math.max(0, Math.sin(ph * .7)) * .6; la.rotation.z = .25 + Math.max(0, Math.sin(ph * 1.9)) * .35; b.body.rotation.z = Math.sin(ph * 1.1) * .04; }
  else if (st === 'lie') { b.body.rotation.x = -1.25; la.rotation.z = 2.6; ra.rotation.z = -2.6; b.head.rotation.x = .35; ll.rotation.x = rl.rotation.x = .15; }
  else if (st === 'swim') { la.rotation.x = Math.sin(ph * 2.6) * 1.4 - .6; ra.rotation.x = -Math.sin(ph * 2.6) * 1.4 - .6; b.head.rotation.x = -.15; }
  else if (st === 'bar') { ra.rotation.x = -1.25; ra.rotation.z = -.2 + Math.sin(ph * 3) * .35; la.rotation.x = -.9; b.body.rotation.z = Math.sin(ph * 1.5) * .03; }
  else if (st === 'chat') { b.body.rotation.z = Math.sin(ph * 1.2) * .05; la.rotation.z = .3 + Math.max(0, Math.sin(ph * 2.3)) * .5; }
}

// helpers for subagents: small bees going back and forth with papers / 서브에이전트: 서류를 나르는 작은 벌
const helpers = [];
function syncHelpers() {
  const want = [];
  for (const b of bees.values()) { const d = W.desks.get(b.key); if (b.s.state === 'run' && b.s.agents > 0 && d && b.arrived) for (let k = 0; k < Math.min(3, b.s.agents); k++) want.push([b, d, k]); }
  while (helpers.length > want.length) { const h = helpers.pop(); scene.remove(h.b.g); h.b.tag.element.remove(); h.b.ask.element.remove(); }
  while (helpers.length < want.length) {
    const hb = { key: 'h' + helpers.length, col: new THREE.Color(0xf0c040), phase: Math.random() * 9, legs: [], pos: { x: 0, z: 0 }, y: 0 };
    makeBee(hb); hb.g.scale.setScalar(.55); hb.tag.visible = false; hb.ask.visible = false; hb.pick.forEach(m => { m.userData.bee = null; });
    helpers.push({ b: hb });
  }
  helpers.forEach((h, i) => { [h.owner, h.desk, h.k] = want[i]; });
}
function animateHelpers(t) {
  for (const h of helpers) {
    const o = h.owner, d = h.desk; if (!o) continue;
    const seat = d.seat, F = W.floors[d.floor], home = { x: seat.x + seat.look[0] * .2 + (h.k - 1) * .45, z: seat.z + seat.look[1] * .2 - .5 }, far = W.printer && W.printer[d.floor] && !d.room ? W.printer[d.floor] : { x: seat.x - 2, z: seat.z - 1.6 };
    const u = ((t * .12 + h.k * .33 + o.phase) % 1), go = u < .5 ? u * 2 : 2 - u * 2, e = go * go * (3 - 2 * go);
    const x = home.x + (far.x - home.x) * e, z = home.z + (far.z - home.z) * e;
    h.b.g.position.set(x, F.y + lift(F.y) + 1 + Math.sin(t * 3 + h.k) * .15 + Math.sin(e * Math.PI) * .9, z);
    h.b.g.rotation.y = Math.atan2(far.x - home.x, far.z - home.z) + (u < .5 ? 0 : Math.PI);
    h.b.papers.visible = u > .5; h.b.jar.visible = h.b.cup.visible = h.b.paddle.visible = false;
    const f = Math.sin(t * 50) * .9; h.b.wings[0].rotation.y = -.25 - f; h.b.wings[1].rotation.y = .25 + f;
    h.b.arms[1].rotation.x = u > .5 ? -1.2 : 0; h.b.feet.forEach(l => { l.rotation.x = -.6; });
    h.b.g.visible = floorShown(d.floor);
  }
}

// ── data / 자료 ──────────────────────────────────────────────────────────────────────────────────────────
let honey = 0, first = true, sessionsNow = [], shiftOff = false;
async function poll() {
  let d;
  try { d = await (await fetch('/state', { cache: 'no-store' })).json(); } catch (e) { return; }
  if (d.lang) L = d.lang;
  document.documentElement.lang = L;
  const list = [], home = [], cells = [], wasOff = shiftOff;
  honey = 0; shiftOff = false;
  (d.offices || []).forEach((o, oi) => {
    honey += o.honey || 0;
    const now = o.now || Date.now() / 1000, at = o.ssh || o.host || '', roster = o.bees || {}, sh = o.shift || {};
    // a bee is known by its id (project and name), so it keeps its look and its flat / 벌은 id (프로젝트와 이름) 로 안다. 생김새와 집이 그대로다
    for (const s of o.sessions || []) list.push({ ...s, key: `${at}|${s.bee || s.pane}`, ssh: o.ssh, host: o.host, age: Math.max(0, now - (s.at || now)) });
    for (const id of sh.home || []) { const r = roster[id] || {}; home.push({ key: `${at}|${id}`, bee: id, name: r.name || id.split('/').pop(), project: r.project || id.split('/')[0], state: 'home', ssh: o.ssh, host: o.host, age: 0 }); }
    for (const [id, r] of Object.entries(roster)) if (r.house !== null && r.house !== undefined) cells.push({ key: `${at}|${id}`, ...r, oi });
    shiftOff ||= sh.state === 'off';
  });
  cells.sort((a, b) => a.house - b.house || a.oi - b.oi);
  W.cells = cells; const flat = new Map(cells.map((c, k) => [c.key, k]));
  sessionsNow = list;
  const p = plan(list);
  const sig = JSON.stringify([p.work, p.team, p.projects.map(x => [x.name, x.list.map(s => s.key)]), p.teams.map(t => [t.key, t.members.map(s => s.key)]), cells.map(c => c.left ? 1 : 0)]);
  if (sig !== W.sig) {
    W.sig = sig; build(p);
    for (const b of bees.values()) { b.spot = null; b.goalKey = ''; }
    for (const s of W.spots) s.by = null;
    drawFloorBar(); if (focus !== null && focus >= W.floors.length) focus = null; applyFocus(true);
  }
  const alive = new Set();
  for (const s of [...list, ...home]) {
    alive.add(s.key);
    let b = bees.get(s.key);
    if (!b) {
      b = { key: s.key, s, col: projectColor(s.project), phase: Math.random() * 9, legs: [], pos: { x: 0, z: 27 }, y: 0, floor: 0, facing: Math.PI, arrived: false };
      makeBee(b); bees.set(s.key, b); b.fresh = first;
    }
    b.s = s; b.age = s.age; b.house = flat.get(s.key);
  }
  for (const [k, b] of bees) if (!alive.has(k)) { scene.remove(b.g); b.tagEl.remove(); b.askEl.remove(); if (b.spot) b.spot.by = null; bees.delete(k); }
  // planners share the meeting room: the first at the whiteboard / 계획하는 벌은 회의실을 함께 쓴다. 첫째는 화이트보드
  [...bees.values()].filter(b => b.s.state === 'run' && b.s.plan && !b.s.team).forEach((b, i) => { b.meetIdx = i; });
  for (const b of bees.values()) {
    const g = decide(b), gk = `${g.floor}|${g.key}|${g.pose}`;
    if (gk !== b.goalKey) {
      b.goalKey = gk; b.goal = g; b.arrived = false;
      b.sprint = g.pose === 'type' && b.floor !== g.floor || (g.pose === 'type' && Math.hypot(b.pos.x - g.x, b.pos.z - g.z) > 6);
      if (b.fresh) { b.floor = g.floor; b.y = g.y ?? g.floor * FH; b.pos.x = g.x; b.pos.z = g.z; b.legs = []; b.arrived = true; b.fresh = false; }
      else route(b, g);
      if (!String(g.key).startsWith('spot') && b.spot) { b.spot.by = null; b.spot = null; }
    }
  }
  first = false;
  if (shiftOff !== wasOff) applyFocus();
  syncHelpers(); counts(); boards(); homeLights();
}
function boards() {
  for (const R of W.rooms.values()) {
    const members = sessionsNow.filter(s => s.team && `${s.project}|${s.team}` === R.team.key);
    R.team.members = members.length ? members : R.team.members;
    const sig = JSON.stringify(R.team.members.map(s => [s.state, s.ctx, s.line]));
    if (sig !== R.boardSig) { R.boardSig = sig; R.board.redraw(R); }
  }
  if (W.honeyWall && W.honeyWall.n !== honey) { W.honeyWall.n = honey; W.honeyWall.redraw(honey); jars(); }
}
function jars() {   // a jar on the lobby shelf for every full comb / 벌집이 찰 때마다 로비 선반에 꿀단지
  const g = W.jars.group; g.clear();
  const n = Math.min(12, Math.floor(honey / 48));
  block(g, 2.6, .06, .4, C.woodDark, -5.6, W.jars.y + .2, -6.8, { cast: false });
  for (let k = 0; k < n; k++) { put(g, cylG(.12, .12, .2, 14), C.honey, -6.6 + (k % 6) * .4, W.jars.y + .36 + Math.floor(k / 6) * .26, -6.8); }
}

// ── what is shown: a floor or all of them, walls on the camera's side cut / 보이는 것: 한 층 또는 전체, 카메라 쪽 벽은 잘라 냄 ──
let focus = null;   // null: the whole building / null: 건물 전체
const floorShown = i => focus === null || i >= 0 && i <= focus;   // -1: outdoors and home / -1: 바깥과 집
// "spread floors" lifts the floors of the whole building apart so each can be seen into from above; off, the
// building stands closed and is seen into through its glass. A floor of its own always stands closed.
// "층 펼치기" 는 건물 전체의 층을 벌려 각 층 안을 위에서 보게 한다. 끄면 건물이 붙어 서고 유리 너머로 본다.
// 한 층만 볼 때는 언제나 붙어 있다
let ex = 0, spread = false, view = 'office';
try { spread = localStorage.getItem('building-spread') === '1'; } catch (e) { /* private window / 사생활 보호 창 */ }
function setSpread(on) {
  spread = on; if (on) focus = null;
  try { localStorage.setItem('building-spread', on ? '1' : '0'); } catch (e) { /* private window / 사생활 보호 창 */ }
  applyFocus();
}
const lift = y => ex * EXPLODE * (y / FH);
function applyFocus(instant) {
  for (const F of W.floors) { F.group.visible = floorShown(F.i); F.ceil.visible = false; }
  const n = W.floors.length, top = n * FH + (spread ? (n - 1) * EXPLODE : 0);
  // far enough for the footprint (or the whole height) to fit the window / 바닥 (전체는 높이까지) 이 창에 들어올 만큼
  const fit = (w, h) => Math.max(h / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), w / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / camera.aspect) * 1.12;
  // the residence on its own, or with the office while clocked out / 아파트만, 또는 퇴근 중이면 사무실과 함께
  if (focus !== null) view = 'office';
  if (W.res) W.res.group.visible = focus === null;
  const both = focus === null && view === 'office' && shiftOff;
  const target = view === 'home' ? new THREE.Vector3(RES.x0 + 5.6, 9, 4) : both ? new THREE.Vector3(16, top * .4, 4) : focus === null ? new THREE.Vector3(0, top * .45, 1.5) : new THREE.Vector3(0, focus * FH + .6, 1.5);
  const dist = view === 'home' ? fit(26, 26) : both ? fit(66, top + 14) : focus === null ? fit(X1 - X0 + 8, top + 14) : fit(X1 - X0 + 8, (Z1 - Z0) * .82 + 6);
  const off = camera.position.clone().sub(controls.target); if (off.lengthSq() < 1) off.set(.62, .55, .78);
  const sph = new THREE.Spherical().setFromVector3(off); sph.radius = dist; sph.phi = focus === null ? 1.1 : .78;   // the whole building from low, through the glass; a floor from above / 전체는 낮게, 유리 너머로. 한 층은 위에서
  const pos = target.clone().add(new THREE.Vector3().setFromSpherical(sph));
  if (instant) { controls.target.copy(target); camera.position.copy(pos); } else fly = { t: 0, from: [camera.position.clone(), controls.target.clone()], to: [pos, target] };
  document.querySelectorAll('#floors button[data-f]').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.f === String(focus))));
  const sp = $('#spread'); if (sp) sp.setAttribute('aria-pressed', String(spread));
  const hv = $('#homeview'); if (hv) hv.setAttribute('aria-pressed', String(view === 'home'));
}
let fly = null;
function drawFloorBar() {
  const nav = $('#floors'); nav.innerHTML = '';
  const add = (f, num, name) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.f = String(f); b.innerHTML = `<span class="fl"><b>${num}</b><span>${name}</span></span><span class="ct"></span>`; b.onclick = () => { focus = f; applyFocus(); }; nav.append(b); };
  add(null, '⌂', tr('전체 보기', 'Whole building'));
  // the whole building stands closed; this lifts the floors apart to see into each at once
  // 건물 전체는 붙어 선다. 이걸 켜면 층을 벌려 각 층 안을 한꺼번에 본다
  const sp = document.createElement('button'); sp.type = 'button'; sp.id = 'spread'; sp.className = 'spread';
  sp.innerHTML = `<span class="fl"><b>⇕</b><span>${tr('층 펼치기', 'Spread floors')}</span></span>`; sp.title = tr('층 펼치기 (E)', 'Spread floors (E)');
  sp.onclick = () => setSpread(!spread); nav.append(sp);
  const hv = document.createElement('button'); hv.type = 'button'; hv.id = 'homeview'; hv.className = 'spread';
  hv.innerHTML = `<span class="fl"><b>⌂</b><span>${tr('벌집 아파트', 'Hive Residence')}</span></span><span class="ct"></span>`; hv.title = tr('벌집 아파트 (H)', 'Hive Residence (H)');
  hv.onclick = () => { focus = null; view = view === 'home' ? 'office' : 'home'; applyFocus(); }; nav.append(hv);
  for (const F of [...W.floors].reverse()) add(F.i, F.kind === 'roof' ? 'R' : `${F.i + 1}F`, F.label);
}
function counts() {
  const by = { run: 0, wait: 0, done: 0, idle: 0 };
  for (const b of bees.values()) if (b.s.state !== 'home') by[b.s.state in by ? b.s.state : 'idle']++;
  const hv = $('#homeview .ct'); if (hv) { const n = [...bees.values()].filter(b => b.s.state === 'home').length; hv.textContent = n ? tr(`집에 ${n}`, `${n} home`) : ''; }
  for (const k in by) $('#n-' + k).textContent = by[k];
  $('#n-honey').textContent = honey;
  document.querySelectorAll('#floors button[data-f]').forEach(btn => {
    if (btn.dataset.f === 'null') return;
    const f = +btn.dataset.f, here = [...bees.values()].filter(b => (b.goal ? b.goal.floor : b.floor) === f);
    const r = here.filter(b => b.s.state === 'run').length, w = here.filter(b => b.s.state === 'wait').length;
    btn.querySelector('.ct').innerHTML = `<span><i style="--c: var(--run)"></i>${r}</span><span><i style="--c: var(--wait)"></i>${w}</span><span><i style="--c: var(--sleep)"></i>${here.length - r - w}</span>`;
    btn.classList.toggle('alert', w > 0);
  });
}

// ── hovering, clicking, keys / 마우스 올리기, 누르기, 키 ──────────────────────────────────────────────────
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let hover = null, downAt = null;
function pickAt(e) {
  const r = canvas.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const meshes = []; for (const b of bees.values()) if (b.g.visible) meshes.push(...b.pick);
  const hit = ray.intersectObjects(meshes, false)[0];
  if (hit) return { bee: hit.object.userData.bee };
  const floors = []; for (const F of W.floors) if (F.group.visible) F.group.children.forEach(o => { if (o.userData.floor !== undefined) floors.push(o); });
  const f = ray.intersectObjects(floors, false)[0];
  return f ? { floor: f.object.userData.floor } : null;
}
canvas.addEventListener('pointermove', e => {
  const h = pickAt(e), b = h && h.bee;
  hover = b || null; canvas.style.cursor = b ? 'pointer' : '';
  const tip = $('#tip');
  if (!b) { tip.hidden = true; return; }
  const s = b.s, where = s.team ? `${s.team} · ${roleName(s)}` : s.project;
  const mins = Math.floor(s.age / 60), age = mins < 1 ? tr('방금', 'just now') : mins < 60 ? tr(`${mins}분`, `${mins} min`) : tr(`${Math.floor(mins / 60)}시간`, `${Math.floor(mins / 60)} h`);
  tip.innerHTML = `<b>${escape(s.label || s.name)}</b><span>${escape(where)}</span><span>${stateWord(s.state)} · ${age}${s.agents ? tr(` · 부사수 ${s.agents}`, ` · ${s.agents} helpers`) : ''}</span><span>${tr('누르면 그 창으로 갑니다', 'Click to open its window')}</span>`;
  tip.hidden = false;
  tip.style.left = Math.min(innerWidth - tip.offsetWidth - 10, e.clientX + 14) + 'px'; tip.style.top = Math.min(innerHeight - tip.offsetHeight - 10, e.clientY + 14) + 'px';
});
canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('click', e => {
  if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const h = pickAt(e);
  if (h && h.bee) return visit(h.bee);
  if (h && h.floor !== undefined && focus === null) { focus = h.floor; applyFocus(); }
});
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (e.key === 'Escape' || e.key === '0') { focus = null; view = 'office'; applyFocus(); }
  else if (e.key === 'h' || e.key === 'H') { focus = null; view = view === 'home' ? 'office' : 'home'; applyFocus(); }
  else if (e.key === 'e' || e.key === 'E') setSpread(!spread);
  else if (/^[1-9]$/.test(e.key) && +e.key <= W.floors.length) { focus = +e.key - 1; applyFocus(); }
  else if (e.key === 'PageUp' || e.key === 'ArrowUp' && e.altKey) { focus = Math.min(W.floors.length - 1, (focus ?? -1) + 1); applyFocus(); }
  else if (e.key === 'PageDown' || e.key === 'ArrowDown' && e.altKey) { focus = focus === null ? W.floors.length - 1 : Math.max(0, focus - 1); applyFocus(); }
});
async function visit(b) {
  if (b.s.state === 'home') return toast(tr('퇴근해서 집에 있어요', 'Clocked out, at home'));
  try {
    const r = await (await fetch('/goto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pane: b.s.pane, ssh: b.s.ssh }) })).json();
    if (!r.ok) toast(tr('세션을 띄울 터미널 화면이 없어요', 'No terminal screen to show it on'));
  } catch (e) { toast(tr('hivemux 와 연결이 끊겼어요', 'Lost hivemux')); }
}
function toast(text) { const t = $('#toast'); t.textContent = text; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 2600); }

// ── day and night / 낮과 밤 ──────────────────────────────────────────────────────────────────────────────
let night = null;
const SKY = canvasTex(4, 256, (c, w, h, dark) => {
  const g = c.createLinearGradient(0, 0, 0, h);
  if (dark) { g.addColorStop(0, '#0b1020'); g.addColorStop(.6, '#1c2440'); g.addColorStop(1, '#3a3550'); }
  else { g.addColorStop(0, '#7fb2e5'); g.addColorStop(.55, '#bcd7ee'); g.addColorStop(1, '#eef3f6'); }
  c.fillStyle = g; c.fillRect(0, 0, w, h);
});
scene.background = SKY;
function daylight() {
  const h = new Date().getHours(), dark = h >= 19 || h < 6;
  if (dark === night) return; night = dark;
  SKY.redraw(dark);
  sun.intensity = dark ? .35 : 2.6; sun.color.set(dark ? 0x9fb3ff : 0xfff1dc); hemi.intensity = dark ? .45 : .9;
  C.light.emissiveIntensity = dark ? 2.2 : .5;
  ROOF.bulb.emissiveIntensity = dark ? 3 : .8; ROOF.water.emissiveIntensity = dark ? .9 : .15;
  C.glass.color.set(dark ? 0x6d7f99 : 0xbfdbea);
  W.fog = new THREE.Fog(dark ? 0x1c2440 : 0xdfe9f2, 140, 420); scene.fog = W.fog;
}

// ── far out: zoom out and the world is a little planet, with puffy clouds, a moon and the stars ──────────
// The office sits on top of the planet; the far lawn, road and trees fade as it rounds, the sky turns to
// space and the view turns round the planet's middle instead of the building.
// 멀리: 계속 줌을 줄이면 세상이 작은 행성이 된다. 몽글몽글한 구름, 달, 별. 사무실은 행성 꼭대기에 있다. 둥글어지면서
// 먼 잔디, 길, 나무는 사라지고, 하늘은 우주가 되고, 화면은 건물 대신 행성 가운데를 돈다.
const PLANET = 300, GLOBE_C = new THREE.Vector3(0, -PLANET - .08, 0);
const EARTH = canvasTex(1024, 512, (c, w, h) => {
  c.fillStyle = '#3d8fd1'; c.fillRect(0, 0, w, h);
  let seed = 11; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const blob = (u, v, size, col) => { c.fillStyle = col; for (let k = 0; k < 14; k++) { c.beginPath(); c.arc(u * w + (r() - .5) * size * 1.6, v * h + (r() - .5) * size, size * (.35 + r() * .5), 0, 7); c.fill(); } };
  const lands = [[.25, .5, 120]]; for (let k = 0; k < 9; k++) lands.push([r(), .2 + r() * .6, 40 + r() * 70]);
  for (const [u, v, s2] of lands) blob(u, v, s2 * 1.12, '#e9d9a6');
  for (const [u, v, s2] of lands) blob(u, v, s2, '#8cc06c');
  for (const [u, v, s2] of lands) blob(u + .01, v, s2 * .5, '#6fa957');
});
const globe = new THREE.Group(); globe.position.copy(GLOBE_C); scene.add(globe);
put(globe, new THREE.SphereGeometry(PLANET, 96, 64), new THREE.MeshStandardMaterial({ map: EARTH, roughness: .9 }), 0, 0, 0, { rx: -Math.PI / 2, cast: false });
const haze = put(globe, new THREE.SphereGeometry(PLANET * 1.06, 64, 40), new THREE.MeshBasicMaterial({ color: 0x5aa8ff, transparent: true, opacity: 0, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }), 0, 0, 0, { cast: false, receive: false });
// puffy clouds round the planet, never over the office / 행성을 도는 몽글몽글한 구름. 사무실 위는 비운다
const clouds = new THREE.Group(); globe.add(clouds);
{
  let seed = 5; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const puff = mat(0xffffff, { roughness: 1, flatShading: true }), up = new THREE.Vector3(0, 1, 0);
  for (let k = 0; k < 22; k++) {
    const th = (.3 + r() * 2.4), ph = r() * Math.PI * 2, rad = PLANET + 50 + r() * 25;
    const dir = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    const cl = new THREE.Group(); cl.position.copy(dir).multiplyScalar(rad); cl.quaternion.setFromUnitVectors(up, dir); clouds.add(cl);
    const n = 4 + Math.floor(r() * 3), s2 = 5 + r() * 6;
    for (let q = 0; q < n; q++) put(cl, sphG(1, 10), puff, (q - n / 2) * s2 * .7, (q % 2) * s2 * .3, (r() - .5) * s2 * .6, { s: [s2 * (.7 + r() * .5), s2 * (.6 + r() * .3), s2 * (.7 + r() * .4)], cast: false });
  }
}
const moon = put(scene, new THREE.SphereGeometry(PLANET * .27, 48, 32), mat(0xe9e4d6, { roughness: 1 }), 0, 0, 0, { cast: false });
const stars = (() => {
  let seed = 9; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pos = [], col = [];
  for (let k = 0; k < 2200; k++) {
    const th = Math.acos(2 * r() - 1), ph = r() * Math.PI * 2, rad = 7000 + r() * 4000, warm = r();
    pos.push(Math.sin(th) * Math.cos(ph) * rad, Math.cos(th) * rad, Math.sin(th) * Math.sin(ph) * rad);
    col.push(1, .9 + warm * .1, .8 + (1 - warm) * .2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false }));
  scene.add(p); return p;
})();
const SPACE = new THREE.Color(0x05070f), SKYMID = new THREE.Color(), bg = new THREE.Color();
const anchor = new THREE.Vector3();   // where the view turns round on the ground / 땅에서 화면이 도는 곳
let away = 0;
function space(t, dt) {
  const d = camera.position.distanceTo(controls.target), k = THREE.MathUtils.smoothstep(d, 200, 750), turn = THREE.MathUtils.smoothstep(d, 260, 1100);
  if (away === 0 || fly) anchor.copy(controls.target);
  if (!fly && (turn > 0 || away > 0)) {   // the view's middle slides to the planet's / 화면 가운데가 행성 가운데로
    const want = anchor.clone().lerp(GLOBE_C, turn), delta = want.sub(controls.target);
    controls.target.add(delta); camera.position.add(delta);
  }
  away = turn;
  W.lawn.material.opacity = 1 - THREE.MathUtils.smoothstep(d, 180, 420); W.lawn.visible = W.lawn.material.opacity > .01;
  if (W.far) W.far.visible = k < .5;
  scene.fog = k > 0 ? null : W.fog;
  SKYMID.set(night ? 0x1c2440 : 0xbcd7ee);
  if (k > 0) { scene.background = bg.lerpColors(SKYMID, SPACE, k); } else scene.background = SKY;
  stars.material.opacity = k; stars.visible = k > 0;
  haze.material.opacity = k * .45;
  if (!reduced) { clouds.rotation.y += dt * .006; globe.rotation.y = 0; }
  const ma = t * .02; moon.position.set(GLOBE_C.x + Math.cos(ma) * PLANET * 3.2, GLOBE_C.y + PLANET * .9, GLOBE_C.z + Math.sin(ma) * PLANET * 3.2); moon.visible = k > .2;
  const near = Math.max(.5, d / 400); if (Math.abs(near - camera.near) > .05) { camera.near = near; camera.updateProjectionMatrix(); }
}

// ── the loop / 루프 ─────────────────────────────────────────────────────────────────────────────────────
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); labels.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const clock = new THREE.Clock();
let codeAt = 0;
function frame() {
  const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
  if (fly) {
    fly.t = Math.min(1, fly.t + dt / .8); const e = 1 - Math.pow(1 - fly.t, 3);
    camera.position.lerpVectors(fly.from[0], fly.to[0], e); controls.target.lerpVectors(fly.from[1], fly.to[1], e);
    if (fly.t >= 1) fly = null;
  }
  ex += ((focus === null && spread ? 1 : 0) - ex) * Math.min(1, dt * 5);
  for (const F of W.floors) F.group.position.y = lift(F.y);
  space(t, dt);
  controls.update();
  if (t - codeAt > .12 && !reduced) { codeAt = t; for (const d of W.desks.values()) if (d.scr) d.scr.map.offset.y -= .012; }
  const dist = camera.position.distanceTo(controls.target);
  for (const b of bees.values()) {
    if (b.legs.length) step(b, dt);
    if (!b.legs.length && b.goal && !b.arrived) b.arrived = true;
    animate(b, t, dt);
    const shown = b.riding ? focus === null || b.y <= focus * FH + .1 : floorShown(b.floor);
    b.g.visible = shown;
    const st = b.s.state;
    b.tag.visible = shown && (b === hover || (focus !== null && b.floor === focus && (st !== 'idle' || dist < 30)) || (focus === null && st !== 'idle' && st !== 'home' && dist < 55));
    if (b.tag.visible) { const key = `${st}|${b.s.lead}|${b.s.label}`; if (b.tagKey !== key) { b.tagKey = key; b.tagEl.className = 'tag' + (b.s.lead ? ' lead' : ''); b.tagEl.style.setProperty('--c', css({ run: '--run', wait: '--wait', done: '--done' }[st] || '--sleep')); b.tagEl.innerHTML = `<i></i>${escape(b.s.team ? roleName(b.s) : b.s.label || b.s.name)}`; } }
    b.ask.visible = shown && st === 'wait' && (focus === null || b.floor === focus) && dist < 320;
    if (b.ask.visible) b.askEl.querySelector('span').textContent = b.s.team ? roleName(b.s) : (b.s.label || b.s.name);
    // the screen in front lights up while it works there / 앞의 화면은 거기서 일하는 동안 켜진다
    const d = W.desks.get(b.key), scr = d && (d.screen || d.laptop), on = st === 'run' && b.arrived && b.goal && b.goal.pose === 'type';
    if (scr && !!d.scr !== on) { d.mat = d.mat || screenMat(); d.scr = on ? d.mat : null; scr.material = on ? d.mat : C.screenOff; }
  }
  // the lift rests where the last rider left it / 엘리베이터는 마지막으로 내린 층에 선다
  if (W.lift) W.lift.visible = ex < .02 && (focus === null || W.lift.position.y <= focus * FH + .1);
  animateHelpers(t);
  pong(t);
  if (!reduced) { RIPPLE.offset.x = t * .02; RIPPLE.offset.y = Math.sin(t * .3) * .05; }
  for (const list of W.flames) if (list) list.forEach((f, k) => { f.scale.set(1, .8 + Math.sin(t * 9 + k * 2) * .2 + Math.sin(t * 13 + k) * .1, 1); });
  if (W.bartender) { const bt = W.bartender; animate(bt, t, dt); bt.g.visible = floorShown(bt.floor); }
  for (const F of W.floors) F.group.traverse(o => { if (o.isCSS2DObject && o.userData.floorLabel !== undefined) o.visible = focus === o.userData.floorLabel; });
  renderer.render(scene, camera); labels.render(scene, camera);
  requestAnimationFrame(frame);
}
function pong(t) {   // the ball flies while both ends are taken / 양쪽에 다 서 있으면 공이 오간다
  if (!W.ball) return;
  const ends = W.spots.filter(s => s.kind === 'pong'), both = ends.every(s => s.by && s.by.arrived && !s.by.legs.length);
  W.ball.mesh.visible = both && floorShown(0);
  if (!both) return;
  const u = (t * .6) % 1, k = u < .5 ? u * 2 : 2 - u * 2;
  W.ball.mesh.position.set(W.ball.x - 1.8 + 3.6 * k, W.ball.y + .85 + Math.sin(k * Math.PI) * .45, W.ball.z + Math.sin(t) * .3);
}

document.querySelectorAll('[data-t]').forEach(el => { const [ko, en] = el.dataset.t.split('|'); el.textContent = tr(ko, en); });
$('#hint').textContent = tr('드래그: 돌리기 · 오른쪽 드래그: 옮기기 · 휠: 확대 · 1~9: 층 · E: 층 펼치기 · H: 아파트 · Esc: 전체', 'Drag: turn · right-drag: move · wheel: zoom · 1–9: floor · E: spread · H: residence · Esc: whole');
camera.position.set(52, 46, 64); controls.target.set(0, 5, 3);
{ const f = /[#&]f=(\d+)/.exec(location.hash); if (f) focus = +f[1]; }   // #f=1 opens on a floor / #f=1 은 그 층으로 연다
ground(); daylight(); setInterval(daylight, 60000);
await poll(); setInterval(poll, 1500);
document.querySelectorAll('[data-t]').forEach(el => { const [ko, en] = el.dataset.t.split('|'); el.textContent = tr(ko, en); });
$('#hint').textContent = tr('드래그: 돌리기 · 오른쪽 드래그: 옮기기 · 휠: 확대 · 1~9: 층 · E: 층 펼치기 · H: 아파트 · Esc: 전체', 'Drag: turn · right-drag: move · wheel: zoom · 1–9: floor · E: spread · H: residence · Esc: whole');
frame();
