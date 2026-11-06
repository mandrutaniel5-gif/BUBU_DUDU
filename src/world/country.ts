// Campia dintre zone: drumurile, raul cu podul cel mare, lacul, campurile vecinilor, padurea din jur,
// paraul dintre sat si oras. Totul e generat la fel pe ambele telefoane (aceeasi "samanta").
import { drawRoadSign, type SignDir } from './signs';
import { AREAS, EXTRA_COLLIDERS, MAP_W, MAP_H, type Floor, type Furn, type Rect } from './map';
import { iso, isoBox, boxOf, shade, tilePath, type Pt } from './iso';
import { heartPath } from '../char/draw';
import { fillTextIcons } from '../ui/icons';
import { drawPOI } from './poi';
import { WORLD, ORIGIN, CORE_W, CORE_H, ROADS, RIVER, LAKE, BROOK, BRIDGE, BROOK_BRIDGE, type RoadRect } from './layout';
import { HOUSES } from './houses';
import { drawParcel } from './season';
import { VILLAGE_BOUNDS, villageFloorW } from './village';
import { CITY_BOUNDS, cityFloorW } from './city';

const O = '#3a2a22';
const act = (id: string, label: string, icon: string) => ({ id, label, icon });
function mulberry(a: number) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const inR = (x: number, y: number, r: { x0: number; y0: number; x1: number; y1: number }) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1;

// ------------------------------------------------------------------ podeaua
/** strazile din cartierele satului si ale orasului (pe langa drumurile mari) */
export const STREETS: RoadRect[] = [
];
/** piete, curti si parcuri */
const PLAZAS: { x0: number; y0: number; x1: number; y1: number; kind: Floor }[] = [
];
/** campurile vecinilor (pamant arat; culturile sunt obiecte) */
export const FIELDS: { x0: number; y0: number; x1: number; y1: number; crop: string }[] = [
  { x0: 3, y0: 29, x1: 15, y1: 35, crop: 'wheat' },
  { x0: 17, y0: 29, x1: 27, y1: 35, crop: 'corn' },
  { x0: 30, y0: 29, x1: 42, y1: 34, crop: 'sunflower' },
  { x0: -11, y0: 29, x1: -2, y1: 34, crop: 'cabbage' },
  { x0: 89, y0: 41, x1: 96, y1: 47, crop: 'lavender' },
  { x0: 72, y0: 42, x1: 86, y1: 48, crop: 'wheat' },
  { x0: 160, y0: 30, x1: 172, y1: 36, crop: 'sunflower' },
];
/** orasul (cartierele), unde podeaua e trotuar */
const CITY_BLOCK = { x0: 186, y0: -12, x1: 252, y1: 64 };
function riverAt(y: number) { const m = y < 0 ? Math.round(1.6 * Math.sin(y / 6)) : y > 40 ? Math.round(1.6 * Math.sin((y - 40) / 7)) : 0; return [RIVER.x0 + m, RIVER.x1 + m]; }
export const lakeD = (x: number, y: number) => ((x + 0.5 - LAKE.cx) / LAKE.rx) ** 2 + ((y + 0.5 - LAKE.cy) / LAKE.ry) ** 2;
export function isWaterXY(x: number, y: number) { const [r0, r1] = riverAt(y); return (x >= r0 && x < r1) || (x >= BROOK.x0 && x < BROOK.x1) || lakeD(x, y) < 1; }
function countryFloor(x: number, y: number): Floor {
  if (inR(x, y, VILLAGE_BOUNDS)) return villageFloorW(x, y); // satul isi are ulitele lui
  if (inR(x, y, CITY_BOUNDS)) return cityFloorW(x, y);       // orasul, strazile lui
  if (inR(x, y, BRIDGE) || inR(x, y, BROOK_BRIDGE)) return 'bridge';
  for (const r of ROADS) if (inR(x, y, r)) return r.kind;
  for (const r of STREETS) if (inR(x, y, r)) return r.kind;
  if (isWaterXY(x, y)) return 'water';
  const ld = lakeD(x, y); if (ld < 1.2) return 'sand';
  for (const f of FIELDS) if (inR(x, y, f)) return 'field';
  for (const p of PLAZAS) if (inR(x, y, p)) return p.kind;
  if (y < -8 || (x >= 152 && y < -12)) return 'forest';
  if (inR(x, y, CITY_BLOCK)) return 'sidewalk';
  const n = Math.sin(x * 0.19) + Math.sin(y * 0.23 + 1.3) + Math.sin((x + y) * 0.09);
  return n > 1.25 ? 'meadow' : 'grass';
}

// ------------------------------------------------------------------ decorul
const F: Furn[] = [];
const taken = new Set<string>();
const CORES: Rect[] = [
  { x0: -1, y0: -1, x1: MAP_W + 1, y1: MAP_H },
  { x0: ORIGIN.forest.x, y0: ORIGIN.forest.y, x1: ORIGIN.forest.x + CORE_W, y1: ORIGIN.forest.y + CORE_H },
  VILLAGE_BOUNDS,
  { x0: 23, y0: -6, x1: 44, y1: 14 }, // ferma voastra (Capitolul 5): cotetul, grajdul, oile, stupii
  CITY_BOUNDS,
];
const nearRoad = (x: number, y: number, m: number) => [...ROADS, ...STREETS].some(r => x >= r.x0 - m && x < r.x1 + m && y >= r.y0 - m && y < r.y1 + m);
/** e loc liber pentru un obiect de w x d la (x,y)? */
function free(x: number, y: number, w = 1, d = 1, roadGap = 1) {
  for (let i = x; i < x + w; i++) for (let j = y; j < y + d; j++) {
    if (i < WORLD.x0 + 1 || j < WORLD.y0 + 1 || i >= WORLD.x1 - 1 || j >= WORLD.y1 - 1) return false;
    if (taken.has(i + ',' + j)) return false;
    if (CORES.some(r => inR(i, j, r))) return false;
    const fl = countryFloor(i, j);
    if (fl !== 'grass' && fl !== 'meadow' && fl !== 'forest' && fl !== 'sidewalk' && fl !== 'cobble') return false;
    if (nearRoad(i, j, roadGap)) return false;
    if (isWaterXY(i - 1, j) || isWaterXY(i + 1, j) || isWaterXY(i, j - 1) || isWaterXY(i, j + 1)) return false;
  }
  return true;
}
function put(f: Furn) { F.push(f); for (let i = Math.floor(f.gx); i < Math.ceil(f.gx + f.w); i++) for (let j = Math.floor(f.gy); j < Math.ceil(f.gy + f.d); j++) taken.add(i + ',' + j); return f; }
let uid = 0;
const id = (p: string) => `w-${p}${uid++}`;
function tree(x: number, y: number, kind: 'pine' | 'oak' | 'apple' | 'birch' = 'oak', solid = true) { if (!free(x, y, 1, 1, 0)) return; put({ id: id('t'), type: (kind === 'pine' ? 'pine' : 'oak') as any, kind, gx: x, gy: y, w: 1, d: 1, solid }); }
const R = mulberry(20240611);

// --- marginea padurii (nord): un sir des de brazi, cu o singura trecere (poarta padurii)
for (let x = WORLD.x0; x < 150; x++) {
  if (x >= 18 && x <= 21) continue;
  const [r0, r1] = riverAt(-9); if (x >= r0 - 1 && x < r1 + 1) continue;
  for (const y of [-8, -9, -10]) if (y === -8 || R() < 0.75) tree(x, y, 'pine');
}
for (let x = 152; x < WORLD.x1; x++) for (const y of [-12, -13, -14]) if (y === -12 || R() < 0.7) tree(x, y, R() < 0.7 ? 'pine' : 'oak');
// --- padurile de pe margini (decor, nu se taie): nord, vest, sud
for (let y = WORLD.y0 + 1; y < -10; y++) for (let x = WORLD.x0 + 1; x < WORLD.x1 - 1; x++) if (R() < 0.2) tree(x, y, R() < 0.75 ? 'pine' : 'oak');
for (let y = -8; y < WORLD.y1 - 1; y++) for (let x = WORLD.x0 + 1; x < -11; x++) if (R() < (x < -18 ? 0.5 : 0.22)) tree(x, y, R() < 0.5 ? 'pine' : 'oak');
for (let x = WORLD.x0 + 1; x < WORLD.x1 - 1; x++) for (let y = 64; y < WORLD.y1 - 1; y++) if (R() < (y > 67 ? 0.55 : 0.25)) tree(x, y, R() < 0.4 ? 'pine' : 'oak');
// --- zidurile nevazute: marginea padurii, gardul padurii jucabile
const wall = (x0: number, y0: number, x1: number, y1: number) => EXTRA_COLLIDERS.push({ x0, y0, x1, y1 });
wall(WORLD.x0, -8.6, 18, -8.4); wall(22, -8.6, 150, -8.4);           // marginea padurii (trecerea: x 18..22)
wall(152, -12.6, WORLD.x1, -12.4);                                     // marginea padurii de langa oras
wall(ORIGIN.forest.x - 0.1, ORIGIN.forest.y, ORIGIN.forest.x + 0.1, -8.4); // padurea jucabila: laturi si capat
wall(ORIGIN.forest.x + CORE_W - 0.1, ORIGIN.forest.y, ORIGIN.forest.x + CORE_W + 0.1, -8.4);
wall(ORIGIN.forest.x, ORIGIN.forest.y - 0.1, ORIGIN.forest.x + CORE_W, ORIGIN.forest.y + 0.1);
wall(WORLD.x0, 64.4, WORLD.x1, 64.6);                                  // marginea de sud
wall(-12.6, -8.4, -12.4, 64.4);                                        // dealul impadurit din vest

// --- campurile vecinilor: culturile, gardurile, sperietoarea
FIELDS.forEach((fl, i) => {
  // primele patru campuri sunt parcelele care se cumpara in Capitolul 5 (Ferma)
  put({ id: i < 4 ? `parcel-${i + 1}` : id('crop'), type: 'cropfield' as any, kind: fl.crop, ...(i < 4 ? { action: act('st-parcel', 'Parcela de câmp', '🟫') } : {}), gx: fl.x0, gy: fl.y0, w: fl.x1 - fl.x0, d: fl.y1 - fl.y0, solid: true });
  put({ id: id('fence'), type: 'fenceline' as any, gx: fl.x0 - 0.5, gy: fl.y0 - 0.55, w: fl.x1 - fl.x0 + 1, d: 0.1, solid: true });
});
put({ id: id('scare'), type: 'scarecrow' as any, gx: 28, gy: 32, w: 1, d: 1, solid: true }); // intre parcele, nu pe ele
put({ id: id('scare'), type: 'scarecrow' as any, gx: 86, gy: 44, w: 1, d: 1, solid: true });
// --- ferma vecinilor (vest): casa, hambarul, fanul, oile la pascut
const NEIGHBOR_HOUSES: Furn[] = [];
export const COUNTRY_HOUSES = HOUSES;
HOUSES.push(
  { id: 'w-house-pop', gx: -9, gy: 12, w: 4, d: 3, h: 50, front: 'x', wall: '#fff1d6', roof: '#c0573e', name: 'Familia Popescu' },
  { id: 'w-house-ion', gx: 32, gy: 15, w: 3, d: 3, h: 46, front: 'y', wall: '#e8f1ff', roof: '#5b7fbf', name: 'Bunicul Ion' },
  { id: 'w-house-mar', gx: 87, gy: 49, w: 3, d: 3, h: 46, front: 'y', wall: '#ffe1ea', roof: '#e5809a', name: 'Livada Mariei' }, // langa livada, nu peste gardurile campurilor
  { id: 'w-house-gr', gx: 165, gy: 18, w: 4, d: 3, h: 50, front: 'y', wall: '#fff6b8', roof: '#8a5d32', name: 'Han „La Răscruce”' },
);
for (const h of COUNTRY_HOUSES) if (!h.id.startsWith('vh-')) NEIGHBOR_HOUSES.push(put({ id: h.id, type: 'farmhouse' as any, gx: h.gx, gy: h.gy, w: h.w, d: h.d, solid: true }));
put({ id: id('barn'), type: 'barn' as any, gx: -10, gy: 4, w: 4, d: 3, solid: true });
// cheresteaua lui Nea Vasile: pe drumul de la casa spre lac, cu fata (si curtea cu cantarul) spre drum
put({ id: 'w-sawmill', type: 'sawmill' as any, gx: 26, gy: 17, w: 6, d: 4, solid: true, action: act('sawmill', 'Cheresteaua lui Nea Vasile', '🪚') });
for (let x = 25; x <= 32; x++) for (let y = 21; y <= 23; y++) taken.add(x + ',' + y); // curtea din fata, libera
put({ id: id('logs'), type: 'logstack' as any, gx: 32, gy: 19, w: 1, d: 2, solid: true });
for (const [x, y] of [[-5, 5], [-4, 7], [-11, 9]]) put({ id: id('hay'), type: 'haystack' as any, gx: x, gy: y, w: 1, d: 1, solid: true });
put({ id: id('fence'), type: 'fenceline' as any, gx: -11.5, gy: 38.5, w: 9, d: 0.1, solid: true });
put({ id: id('fence'), type: 'fenceline' as any, gx: -11.5, gy: 46.5, w: 9, d: 0.1, solid: true });
put({ id: id('fence'), type: 'fenceline' as any, gx: -11.6, gy: 38.7, w: 0.1, d: 7.6, solid: true });
put({ id: id('fence'), type: 'fenceline' as any, gx: -2.6, gy: 38.7, w: 0.1, d: 7.6, solid: true });
for (let i = 0; i < 5; i++) F.push({ id: id('sheep'), type: 'sheep' as any, gx: -10 + i * 1.6, gy: 40 + (i % 2) * 2.4, w: 1, d: 1, solid: false });
for (let i = 0; i < 3; i++) F.push({ id: id('cow'), type: 'cow' as any, gx: 162 + i * 3, gy: 40 + (i % 2) * 2, w: 1, d: 1, solid: false });
put({ id: id('mill'), type: 'windmill' as any, gx: 34, gy: 42, w: 2, d: 2, solid: true });
put({ id: id('mill'), type: 'windmill' as any, gx: 92, gy: 5, w: 2, d: 2, solid: true });
// --- livada Mariei
for (let x = 74; x < 86; x += 3) for (let y = 49; y < 58; y += 3) tree(x, y, 'apple');
// --- lacul: debarcaderul de pescuit, bancute, foisorul, ratele, papura, nuferii
put({ id: 'w-lakepier', type: 'pier' as any, gx: 80, gy: 29, w: 1, d: 1, solid: false, action: act('fish', 'Pescuiește la lac', '🎣') });
taken.add('80,30');
for (const [x, y] of [[58, 33], [86, 33]]) put({ id: id('bench'), type: 'bench' as any, gx: x, gy: y, w: 2, d: 1, solid: true, action: act('bench', 'Băncuța de la lac', '🌅') });
put({ id: id('gazebo'), type: 'gazebo' as any, gx: 51, gy: 30, w: 2, d: 2, solid: true, action: act('bench', 'Foișorul de la lac', '🌅') });
F.push({ id: id('ducks'), type: 'ducks' as any, gx: 73, gy: 15, w: 1, d: 1, solid: false });
F.push({ id: id('ducks'), type: 'ducks' as any, gx: 60, gy: 22, w: 1, d: 1, solid: false });
for (let i = 0; i < 90; i++) {
  const a = R() * Math.PI * 2, k = 1.02 + R() * 0.12; const x = Math.floor(LAKE.cx + Math.cos(a) * LAKE.rx * k), y = Math.floor(LAKE.cy + Math.sin(a) * LAKE.ry * k);
  if (countryFloor(x, y) !== 'sand' || taken.has(x + ',' + y) || nearRoad(x, y, 1)) continue;
  if (R() < 0.35) { F.push({ id: id('reed'), type: 'reeds' as any, gx: x, gy: y, w: 1, d: 1, solid: false }); taken.add(x + ',' + y); }
}
for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, k = 0.55 + R() * 0.38; F.push({ id: id('lily'), type: 'lilypad' as any, gx: LAKE.cx + Math.cos(a) * LAKE.rx * k - 0.5, gy: LAKE.cy + Math.sin(a) * LAKE.ry * k - 0.5, w: 1, d: 1, solid: false }); }
// --- podul cel mare: balustradele (spate / fata) si golul cand e rupt
F.push({ id: 'w-bridge-n', type: 'bridgerail' as any, gx: BRIDGE.x0, gy: BRIDGE.y0, w: BRIDGE.x1 - BRIDGE.x0, d: 0.06, solid: false });
F.push({ id: 'w-bridge-s', type: 'bridgerail' as any, gx: BRIDGE.x0, gy: BRIDGE.y1 - 0.06, w: BRIDGE.x1 - BRIDGE.x0, d: 0.06, solid: false });
F.push({ id: 'w-bridge-gap', type: 'bridgegap' as any, gx: BRIDGE.x0 + 2, gy: BRIDGE.y0, w: 2, d: 2, solid: false, action: act('bridgeinfo', 'Podul e rupt', '🌉') });
F.push({ id: 'w-bbridge-n', type: 'bridgerail' as any, gx: BROOK_BRIDGE.x0, gy: BROOK_BRIDGE.y0, w: BROOK_BRIDGE.x1 - BROOK_BRIDGE.x0, d: 0.06, solid: false });
F.push({ id: 'w-bbridge-s', type: 'bridgerail' as any, gx: BROOK_BRIDGE.x0, gy: BROOK_BRIDGE.y1 - 0.06, w: BROOK_BRIDGE.x1 - BROOK_BRIDGE.x0, d: 0.06, solid: false });
// bariera de pe soseaua spre oras (pana in Capitolul 4)
F.push({ id: 'w-roadblock', type: 'roadblock' as any, gx: BROOK_BRIDGE.x1 - 2, gy: 24, w: 1, d: 2, solid: false, action: act('roadblock', 'Drumul spre oraș', '🚧') });
// poarta padurii
F.push({ id: 'w-forestgate', type: 'forestgate' as any, gx: 18, gy: -8.6, w: 4, d: 0.2, solid: false, action: act('forestgate', 'Poarta pădurii', '🌲') });
// --- indicatoarele
const sign = (x: number, y: number, text: string, dir: SignDir, welcome = false) => {
  put({ id: id('sign'), type: 'roadsign' as any, gx: x, gy: y, w: 1, d: 1, solid: true, text, kind: welcome ? 'welcome' : dir });
  // loc liber in jurul panoului (e lat): fara copaci care sa-l acopere
  const ns = dir === 'N' || dir === 'S';
  for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) taken.add(ns ? `${x + j},${y + i}` : `${x + i},${y + j}`);
};
sign(41, 22, '🏘️ Satul · 🏞️ Lacul', 'E');
sign(23, 22, '🏡 Acasă', 'W');
sign(98, 34, '🏘️ Satul', 'N');
sign(61, 34, '🌉 Podul Mare', 'E');
sign(99, 21, '🏘️ Bun venit în sat!', '', true);
sign(147, 22, '🏙️ Orașul', 'E');
sign(154, 27, '🏘️ Satul · 🏡 Acasă', 'W');
sign(186, 22, '🏙️ Bun venit în oraș!', '', true);
sign(17, -6, '🌲 Pădurea', 'N');
sign(22, -3, '🏡 Acasă', 'S');
sign(-11, 22, '🛖 Cătunul vecin', 'W');
// --- copaci pe marginea drumurilor si prin campie
for (let x = 24; x < 186; x += 4 + Math.floor(R() * 3)) { tree(x, 22, R() < 0.3 ? 'birch' : 'oak'); tree(x + 1, 27, 'oak'); }
for (let y = 27; y < 64; y += 4) { tree(42, y, 'oak'); tree(48, y + 1, 'birch'); }
for (let i = 0; i < 520; i++) {
  const x = Math.floor(WORLD.x0 + 2 + R() * (WORLD.x1 - WORLD.x0 - 4)), y = Math.floor(-7 + R() * 70);
  const r = R();
  if (inR(x, y, CITY_BLOCK)) continue;
  if (r < 0.32) tree(x, y, R() < 0.25 ? 'birch' : R() < 0.15 ? 'apple' : 'oak');
  else if (r < 0.48) { if (free(x, y)) put({ id: id('bush'), type: 'bush', gx: x, gy: y, w: 1, d: 1, solid: true }); }
  else if (r < 0.56) { if (free(x, y)) put({ id: id('rock'), type: 'rock', gx: x, gy: y, w: 1, d: 1, solid: true }); }
  else if (free(x, y, 1, 1, 0)) { F.push({ id: id('fl'), type: 'flowers', gx: x, gy: y, w: 1, d: 1, solid: false }); taken.add(x + ',' + y); }
}
void NEIGHBOR_HOUSES; void shade;

AREAS.country = { floor: countryFloor, furniture: F, walls: [], spawn: { x: 30, y: 25 } };

/** obstacolele care depind de capitol: poarta padurii (Cap. 2), podul (Cap. 3), bariera spre oras (Cap. 4) */
export function chapterBlocks(chapter: number, bridgeFixed: boolean): Rect[] {
  const R: Rect[] = [];
  if (chapter < 2) R.push({ x0: 18, y0: -8.7, x1: 22, y1: -8.3 });
  if (!bridgeFixed) R.push({ x0: BRIDGE.x0 + 2.2, y0: BRIDGE.y0, x1: BRIDGE.x0 + 3.8, y1: BRIDGE.y1 });
  if (chapter < 6) R.push({ x0: BROOK_BRIDGE.x1 - 1.7, y0: 24, x1: BROOK_BRIDGE.x1 - 1.3, y1: 26 }); // pe podet: pe langa el e apa
  return R;
}

// ------------------------------------------------------------------ desen
function e(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, st = true, lw = 2) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } }
function quad(c: CanvasRenderingContext2D, pts: Pt[], fill: string, lw = 2) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = O; c.lineWidth = lw; c.stroke(); }
const flag = (k: string) => !!(globalThis as any)[k];

function fenceSeg(c: CanvasRenderingContext2D, P: (u: number, z: number) => Pt) {
  for (const u of [0.2, 0.5, 0.8]) { const a = P(u, 0), b = P(u, 22); c.strokeStyle = O; c.lineWidth = 6; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.strokeStyle = '#e7c08f'; c.lineWidth = 3; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
  for (const z of [8, 16]) { const a = P(0, z), b = P(1, z); c.strokeStyle = O; c.lineWidth = 5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.strokeStyle = '#c4935f'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
}
function cropPlant(c: CanvasRenderingContext2D, kind: string, p: Pt, t: number, s: number) {
  const sw = Math.sin(t * 1.6 + p.x * 0.05) * 2;
  switch (kind) {
    case 'wheat': {
      // un snop des de spice aurii, fara contur (ca un lan, nu ca niste bete)
      c.fillStyle = '#e2b84a'; c.beginPath(); c.ellipse(p.x, p.y - 2, 15, 6, 0, 0, 7); c.fill();
      for (let k = -3; k <= 3; k++) { const x = p.x + k * 4, h = 20 + ((k * 7 + 21) % 5) * 2, b = sw * (0.6 + Math.abs(k) * 0.08); c.strokeStyle = '#c99a32'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, p.y); c.quadraticCurveTo(x + b * 0.4, p.y - h * 0.6, x + b, p.y - h); c.stroke(); c.fillStyle = k % 2 ? '#f5d77a' : '#efca5c'; c.beginPath(); c.ellipse(x + b, p.y - h - 3, 2.2, 5, b * 0.03, 0, 7); c.fill(); }
      break;
    }
    case 'corn': { c.strokeStyle = O; c.lineWidth = 4; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + sw, p.y - 40); c.stroke(); c.strokeStyle = '#6cbf4c'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + sw, p.y - 40); c.stroke(); for (const [dy, dir] of [[-14, -1], [-24, 1], [-32, -1]]) { c.fillStyle = '#7cc56b'; c.strokeStyle = O; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p.x + sw * 0.5, p.y + dy); c.quadraticCurveTo(p.x + dir * 14, p.y + dy - 8, p.x + dir * 18, p.y + dy + 2); c.quadraticCurveTo(p.x + dir * 8, p.y + dy, p.x + sw * 0.5, p.y + dy); c.fill(); c.stroke(); } e(c, p.x + 4 + sw * 0.6, p.y - 22, 3, 6, '#ffd23f', true, 1.2); break; }
    case 'sunflower': { c.strokeStyle = '#3d8b3d'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + sw * 0.4, p.y - 34); c.stroke(); const q = { x: p.x + sw * 0.4, y: p.y - 38 }; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; e(c, q.x + Math.cos(a) * 7, q.y + Math.sin(a) * 6, 4, 3, '#ffd23f', false); } e(c, q.x, q.y, 5.5, 5, '#8a5d32', true, 1.5); break; }
    case 'cabbage': e(c, p.x, p.y - 6, 10 * s, 7 * s, '#8fd07a', true, 1.5); e(c, p.x, p.y - 8, 6 * s, 4.5 * s, '#b5e39f', false); break;
    case 'lavender': for (let k = -2; k <= 2; k++) { const x = p.x + k * 4; c.strokeStyle = '#6a8a5a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, p.y); c.lineTo(x + sw * 0.4, p.y - 16 + Math.abs(k) * 2); c.stroke(); e(c, x + sw * 0.4, p.y - 18 + Math.abs(k) * 2, 2.4, 5, '#a98ad6', false); } break;
  }
}
/** copacii campiei (stejar, mesteacan, mar) */
function drawTree(c: CanvasRenderingContext2D, f: Furn, t: number) {
  const { gx, gy } = f; const kind = f.kind ?? 'oak';
  const sw = Math.sin(t * 0.8 + gx * 2 + gy) * 2;
  const big = 0.85 + hash(gx, gy) * 0.35;
  if (kind === 'birch') {
    isoBox(c, gx + 0.44, gy + 0.44, 0.12, 0.12, 52 * big, { top: '#f4f1ea', left: '#ebe6dc', right: '#d6d0c4' });
    const p = iso(gx + 0.5, gy + 0.5, 0); c.strokeStyle = '#3a3a3a'; c.lineWidth = 1.5; for (const z of [12, 24, 36]) { c.beginPath(); c.moveTo(p.x - 3, p.y - z * big); c.lineTo(p.x + 1, p.y - z * big - 1); c.stroke(); }
    const q = iso(gx + 0.5, gy + 0.5, 52 * big); for (const [dx, dy, r] of [[-10, -4, 14], [10, -8, 13], [0, -20, 15], [-4, -32, 11]] as const) e(c, q.x + dx + sw, q.y + dy, r * big, r * 0.85 * big, '#a8d86a');
    return;
  }
  isoBox(c, gx + 0.4, gy + 0.4, 0.2, 0.2, 34 * big, boxOf('#a0703f'));
  const q = iso(gx + 0.5, gy + 0.5, 34 * big);
  const cols = kind === 'apple' ? ['#5fae5f', '#6cbf6c', '#7cc97c'] : ['#4f9f55', '#5fb35f', '#6fc46c'];
  for (const [dx, dy, r, k] of [[-17, -6, 20, 0], [17, -8, 20, 0], [0, -24, 24, 1], [-9, -40, 16, 2], [11, -38, 16, 2]] as const) e(c, q.x + (dx + sw) * big, q.y + dy * big, r * big, r * 0.9 * big, cols[k]);
  if (kind === 'apple') for (const [dx, dy] of [[-12, -16], [14, -26], [2, -42], [-4, -8]]) e(c, q.x + dx * big + sw, q.y + dy * big, 3.5, 3.5, '#e63946', true, 1.2);
}
function drawCountryHouse(c: CanvasRenderingContext2D, h: typeof COUNTRY_HOUSES[number], t: number, night: number) { // eslint-disable-line
  const { gx, gy, w, d } = h, H = h.h;
  // satul pe moarte: casele parasite sunt cenusii, cu geamurile batute in scanduri (se repara dupa proiectele satului)
  const aband = !!(globalThis as any).__abandoned?.has(h.id);
  if (aband) h = { ...h, wall: '#c9c4bd', roof: '#7d756d' };
  isoBox(c, gx, gy, w, d, H, { top: shade(h.wall, 0.95), left: h.wall, right: shade(h.wall, 0.88) });
  const P = (u: number, z: number) => h.front === 'y' ? iso(gx + u * w, gy + d, z) : iso(gx + w, gy + u * d, z);
  quad(c, [P(0, 0), P(1, 0), P(1, 6), P(0, 6)], shade(h.wall, 0.75), 1.5);
  const lit = night > 0.4;
  for (const u of [0.2, 0.8]) { quad(c, [P(u - 0.1, 22), P(u + 0.1, 22), P(u + 0.1, 40), P(u - 0.1, 40)], lit ? '#ffe680' : '#bfe8ff'); quad(c, [P(u - 0.13, 20), P(u - 0.1, 20), P(u - 0.1, 42), P(u - 0.13, 42)], '#7cc576', 1); quad(c, [P(u + 0.1, 20), P(u + 0.13, 20), P(u + 0.13, 42), P(u + 0.1, 42)], '#7cc576', 1); }
  quad(c, [P(0.43, 4), P(0.57, 4), P(0.57, 34), P(0.43, 34)], '#8a5d32');
  if (aband) for (const u of [0.2, 0.8, 0.5]) for (const z of [26, 34]) { const a1 = P(u - 0.13, z), b1 = P(u + 0.13, z + 4); c.strokeStyle = O; c.lineWidth = 5; c.beginPath(); c.moveTo(a1.x, a1.y); c.lineTo(b1.x, b1.y); c.stroke(); c.strokeStyle = '#a0703f'; c.lineWidth = 3; c.stroke(); }
  // acoperisul in doua ape
  const RH = 30;
  if (h.front === 'y') {
    const r0 = iso(gx, gy + d / 2, H + RH), r1 = iso(gx + w, gy + d / 2, H + RH);
    quad(c, [iso(gx, gy, H), iso(gx + w, gy, H), r1, r0], shade(h.roof, 0.85));
    quad(c, [iso(gx + w, gy, H), iso(gx + w, gy + d, H), r1], shade(h.wall, 0.82));
    quad(c, [iso(gx - 0.1, gy + d + 0.12, H - 3), iso(gx + w + 0.1, gy + d + 0.12, H - 3), r1, r0], h.roof);
  } else {
    const r0 = iso(gx + w / 2, gy, H + RH), r1 = iso(gx + w / 2, gy + d, H + RH);
    quad(c, [iso(gx, gy, H), iso(gx, gy + d, H), r1, r0], shade(h.roof, 0.85));
    quad(c, [iso(gx, gy + d, H), iso(gx + w, gy + d, H), r1], shade(h.wall, 0.92));
    quad(c, [iso(gx + w + 0.12, gy - 0.1, H - 3), iso(gx + w + 0.12, gy + d + 0.1, H - 3), r1, r0], h.roof);
  }
  // cosul (fumul se deseneaza separat, viu: houseSmoke)
  const ch = iso(gx + w * 0.3, gy + d * 0.3, H + 18); c.fillStyle = '#c0573e'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(ch.x - 5, ch.y - 16, 10, 18, 2); c.fill(); c.stroke();
  void t;
  if (h.name) { const p = P(0.5, H + 4); c.font = '800 10px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = '#fff'; c.fillStyle = '#7a3a5a'; fillTextIcons(c, h.name, p.x, p.y - 2, 10, true); }
}

/** fumul din cosul unei case de la tara (animat, peste imaginea casei) */
export function houseSmoke(c: CanvasRenderingContext2D, f: Furn, t: number) {
  const h = COUNTRY_HOUSES.find(x => x.id === f.id); if (!h || (globalThis as any).__abandoned?.has(h.id)) return;
  const ch = iso(h.gx + h.w * 0.3, h.gy + h.d * 0.3, h.h + 18);
  for (let i = 0; i < 3; i++) { const k = (((t * 0.35 + i / 3 + h.gx * 0.13) % 1) + 1) % 1; c.globalAlpha = 0.5 * (1 - k); e(c, ch.x + k * 14, ch.y - 20 - k * 30, 4 + k * 7, 3.5 + k * 6, '#eeeeee', false); }
  c.globalAlpha = 1;
}
export function drawCountryType(c: CanvasRenderingContext2D, f: Furn, t: number, night: number): boolean {
  const { gx, gy, w, d } = f;
  switch (f.type as string) {
    case 'oak': drawTree(c, f, t); return true;
    case 'farmhouse': { const h = COUNTRY_HOUSES.find(x => x.id === f.id); if (h) drawCountryHouse(c, h, t, night); return true; }
    case 'cropfield': {
      const pc = (globalThis as any).__parcels?.[f.id];
      if (pc?.owned) { drawParcel(c, f, pc, t, (kind, x, y, sc) => cropPlant(c, kind, { x, y }, t, sc)); return true; }
      const kind = f.kind ?? 'wheat', s = kind === 'cabbage' ? 1 : 1;
      for (let k = 0; k < w + d; k++) for (let i = 0; i < w; i++) { const j = k - i; if (j < 0 || j >= d) continue; cropPlant(c, kind, iso(gx + i + 0.5, gy + j + 0.5), t, s); }
      return true;
    }
    case 'fenceline': {
      if (d < 0.5) { for (let i = 0; i < Math.round(w); i++) fenceSeg(c, (u, z) => iso(gx + i + u, gy + d / 2, z)); }
      else for (let j = 0; j < Math.round(d); j++) fenceSeg(c, (u, z) => iso(gx + w / 2, gy + j + u, z));
      return true;
    }
    case 'haystack': { const p = iso(gx + 0.5, gy + 0.5); e(c, p.x, p.y, 22, 10, '#d9b34f'); c.fillStyle = '#f2cf6b'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x - 22, p.y); c.quadraticCurveTo(p.x - 20, p.y - 40, p.x, p.y - 42); c.quadraticCurveTo(p.x + 20, p.y - 40, p.x + 22, p.y); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = '#c9a23a'; c.lineWidth = 1.5; for (const k of [-10, 0, 10]) { c.beginPath(); c.moveTo(p.x + k, p.y - 4); c.quadraticCurveTo(p.x + k * 0.6, p.y - 22, p.x + k * 0.2, p.y - 36); c.stroke(); } return true; }
    case 'scarecrow': {
      const p = iso(gx + 0.5, gy + 0.5), sw = Math.sin(t * 1.5 + gx) * 0.06;
      c.save(); c.translate(p.x, p.y); c.rotate(sw);
      c.strokeStyle = O; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -54); c.moveTo(-20, -40); c.lineTo(20, -40); c.stroke();
      c.strokeStyle = '#a0703f'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -54); c.moveTo(-20, -40); c.lineTo(20, -40); c.stroke();
      c.fillStyle = '#e07a5f'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, -44); c.lineTo(14, -44); c.lineTo(10, -22); c.lineTo(-10, -22); c.closePath(); c.fill(); c.stroke();
      e(c, 0, -54, 9, 9, '#f2cf6b'); e(c, -3, -55, 1.5, 1.5, O, false); e(c, 3, -55, 1.5, 1.5, O, false);
      c.fillStyle = '#8a5d32'; c.beginPath(); c.ellipse(0, -61, 14, 4, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.roundRect(-7, -72, 14, 11, 3); c.fill(); c.stroke();
      c.restore(); return true;
    }
    case 'church': {
      const wall = '#fff8ef', roof = '#8a4a3a', H = 64;
      isoBox(c, gx, gy + 1, w, d - 1, H, { top: shade(wall, 0.95), left: wall, right: shade(wall, 0.88) });
      const r0 = iso(gx, gy + 1 + (d - 1) / 2, H + 38), r1 = iso(gx + w, gy + 1 + (d - 1) / 2, H + 38);
      quad(c, [iso(gx, gy + 1, H), iso(gx + w, gy + 1, H), r1, r0], shade(roof, 0.85));
      quad(c, [iso(gx + w, gy + 1, H), iso(gx + w, gy + d, H), r1], shade(wall, 0.85));
      quad(c, [iso(gx - 0.1, gy + d + 0.12, H - 3), iso(gx + w + 0.1, gy + d + 0.12, H - 3), r1, r0], roof);
      // ferestrele inalte cu vitralii
      for (const u of [0.18, 0.82]) { const P = (z: number, du = 0) => iso(gx + w * u + du, gy + d, z); quad(c, [P(18, -0.12), P(18, 0.12), P(46, 0.12), P(46, -0.12)], night > 0.4 ? '#ffe680' : ['#ff9ab8', '#7ab8ff'][u > 0.5 ? 1 : 0]); }
      // clopotnita in fata
      const tx = gx + w / 2 - 0.7, ty = gy + d - 1.4;
      isoBox(c, tx, ty, 1.4, 1.4, 104, { top: '#fff', left: '#f4ede2', right: '#e2d8c8' });
      const bell = iso(tx + 0.7, ty + 1.4, 82); c.fillStyle = '#3a2a22'; c.beginPath(); c.roundRect(bell.x - 7, bell.y - 12, 14, 18, 6); c.fill();
      const sw = Math.sin(t * 2) * 0.15; c.save(); c.translate(bell.x, bell.y - 10); c.rotate(sw); c.fillStyle = '#ffd23f'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-5, 12); c.quadraticCurveTo(-5, 0, 0, 0); c.quadraticCurveTo(5, 0, 5, 12); c.closePath(); c.fill(); c.stroke(); c.restore();
      const tip = iso(tx + 0.7, ty + 0.7, 150);
      quad(c, [iso(tx, ty + 1.4, 104), iso(tx + 1.4, ty + 1.4, 104), tip], '#8a4a3a'); quad(c, [iso(tx + 1.4, ty, 104), iso(tx + 1.4, ty + 1.4, 104), tip], '#6a3a2a');
      c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.beginPath(); c.moveTo(tip.x, tip.y); c.lineTo(tip.x, tip.y - 16); c.moveTo(tip.x - 6, tip.y - 10); c.lineTo(tip.x + 6, tip.y - 10); c.stroke();
      // usa arcuita
      const dp = iso(tx + 0.7, ty + 1.4, 0); c.fillStyle = '#8a5d32'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(dp.x - 8, dp.y); c.lineTo(dp.x - 8, dp.y - 18); c.quadraticCurveTo(dp.x, dp.y - 30, dp.x + 8, dp.y - 18); c.lineTo(dp.x + 8, dp.y); c.closePath(); c.fill(); c.stroke();
      return true;
    }
    case 'sawmill': {
      // sopron deschis spre drum: acoperis intr-o singura apa doar peste jumatatea din spate (stivele de busteni),
      // gaterul si scandurile stau in fata, la vedere
      const H = 54, wall = '#c98e5f', roof = '#a0473e', back = d * 0.45;
      tilePath(c, gx, gy, w, d); c.fillStyle = '#d9bf8f'; c.fill();                                                      // rumegus pe jos
      for (let i = 0; i < 18; i++) { const p = iso(gx + 0.3 + hash(i, gx) * (w - 0.6), gy + 0.3 + hash(gy, i) * (d - 0.6)); e(c, p.x, p.y, 3, 1.3, '#c9a874', false); }
      isoBox(c, gx, gy, w, 0.3, H + 20, { top: shade(wall, 0.95), left: shade(wall, 0.9), right: shade(wall, 0.8) });       // peretele din spate
      isoBox(c, gx, gy, 0.3, back, H + 10, { top: shade(wall, 0.95), left: shade(wall, 0.85), right: shade(wall, 0.75) });  // peretele din stanga
      // bustenii stivuiti sub acoperis
      for (let r = 0; r < 3; r++) for (let k = 0; k < 7 - r; k++) { const p = iso(gx + 0.7 + k * 0.62 + r * 0.31, gy + 0.9, 7 + r * 12); e(c, p.x, p.y, 9, 7, '#a0703f', true, 1.5); e(c, p.x, p.y, 4.5, 3.5, '#e7c08f', false); }
      // stalpii si acoperisul (mai sus in spate)
      for (const u of [0.05, w / 2 - 0.1, w - 0.3]) isoBox(c, gx + u, gy + back - 0.2, 0.22, 0.22, H, boxOf('#8a5d32'));
      const a0 = iso(gx - 0.15, gy - 0.15, H + 22), a1 = iso(gx + w + 0.15, gy - 0.15, H + 22), b1 = iso(gx + w + 0.15, gy + back + 0.15, H - 2), b0 = iso(gx - 0.15, gy + back + 0.15, H - 2);
      quad(c, [iso(gx + w + 0.15, gy - 0.15, H + 22), b1, iso(gx + w + 0.15, gy + back + 0.15, H - 6), iso(gx + w + 0.15, gy - 0.15, H + 16)], shade(roof, 0.7));
      quad(c, [a0, a1, b1, b0], roof);
      for (let i = 1; i < 10; i++) { const a = iso(gx - 0.15 + i * (w + 0.3) / 10, gy - 0.15, H + 22), b = iso(gx - 0.15 + i * (w + 0.3) / 10, gy + back + 0.15, H - 2); c.strokeStyle = shade(roof, 0.75); c.lineWidth = 1.2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      // firma pe streasina
      const sp = iso(gx + w / 2, gy + back + 0.15, H + 8); c.fillStyle = '#fff8ef'; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.roundRect(sp.x - 80, sp.y - 13, 160, 22, 7); c.fill(); c.stroke();
      c.font = '800 11px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#8a3a30'; fillTextIcons(c, '🪚 Cheresteaua · Nea Vasile', sp.x, sp.y - 2, 11, false); c.textBaseline = 'alphabetic';
      // gaterul in fata: masa cu role, cadrul cu panza, un bustean pe jumatate taiat
      isoBox(c, gx + 0.6, gy + back + 0.5, 3.4, 0.7, 12, boxOf('#9aa5ad'));
      isoBox(c, gx + 0.7, gy + back + 0.65, 3.0, 0.4, 9, { top: '#c98e5f', left: '#a0703f', right: '#8a5d32' }, 12);
      isoBox(c, gx + 2.0, gy + back + 0.35, 0.14, 0.14, 46, boxOf('#6b7780')); isoBox(c, gx + 2.0, gy + back + 1.2, 0.14, 0.14, 46, boxOf('#6b7780'));
      isoBox(c, gx + 2.0, gy + back + 0.35, 0.14, 1.0, 6, boxOf('#6b7780'), 46);
      { const p0 = iso(gx + 2.07, gy + back + 0.85, 46), p1 = iso(gx + 2.07, gy + back + 0.85, 12); c.strokeStyle = '#e8ecef'; c.lineWidth = 3; c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke(); }
      // stiva de scanduri gata taiate (dreapta fata)
      for (let k = 0; k < 5; k++) isoBox(c, gx + w - 1.5, gy + back + 0.4, 1.2, 1.5, 4, { top: k % 2 ? '#f0cf9e' : '#e7c08f', left: '#d9a273', right: '#c48b5c' }, k * 4);
      // cantarul din curte, langa drum
      isoBox(c, gx + 1.0, gy + d - 0.9, 1.2, 0.8, 4, boxOf('#9aa5ad'));
      const dp = iso(gx + 2.25, gy + d - 0.5, 0); c.fillStyle = '#6b7780'; c.strokeStyle = O; c.lineWidth = 2; c.fillRect(dp.x - 2, dp.y - 30, 4, 30); c.strokeRect(dp.x - 2, dp.y - 30, 4, 30); e(c, dp.x, dp.y - 36, 8, 8, '#fff');
      { const q = iso(gx + 2.25, gy + d - 0.5, 36); c.strokeStyle = '#e63946'; c.lineWidth = 2; c.beginPath(); c.moveTo(dp.x, dp.y - 36); c.lineTo(dp.x + 5, dp.y - 40); c.stroke(); void q; }
      return true;
    }
    case 'logstack': { for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) { const p = iso(gx + 0.5, gy + 0.3 + k * 0.4 + r * 0.2, 5 + r * 10); e(c, p.x, p.y, 8, 6, '#a0703f', true, 1.5); e(c, p.x, p.y, 4, 3, '#e7c08f', false); } return true; }
    case 'barn': {
      isoBox(c, gx, gy, w, d, 54, { top: '#c0473e', left: '#d9574a', right: '#b8443a' });
      const P = (u: number, z: number) => iso(gx + w, gy + u * d, z);
      quad(c, [P(0.3, 0), P(0.7, 0), P(0.7, 40), P(0.3, 40)], '#8a3a30', 2);
      c.strokeStyle = '#fff'; c.lineWidth = 2.5; for (const [a, b] of [[P(0.3, 0), P(0.7, 40)], [P(0.7, 0), P(0.3, 40)]]) { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      const r0 = iso(gx + w / 2, gy, 54 + 34), r1 = iso(gx + w / 2, gy + d, 54 + 34);
      quad(c, [iso(gx, gy, 54), iso(gx, gy + d, 54), r1, r0], '#7a3a30');
      quad(c, [iso(gx, gy + d, 54), iso(gx + w, gy + d, 54), r1], '#c9574a');
      quad(c, [iso(gx + w + 0.1, gy - 0.1, 52), iso(gx + w + 0.1, gy + d + 0.1, 52), r1, r0], '#8a4a3a');
      return true;
    }
    case 'windmill': {
      const b = iso(gx + 1, gy + 1), top = { x: b.x, y: b.y - 96 };
      c.fillStyle = '#f4ead8'; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.moveTo(b.x - 26, b.y); c.lineTo(b.x - 16, b.y - 90); c.lineTo(b.x + 16, b.y - 90); c.lineTo(b.x + 26, b.y); c.quadraticCurveTo(b.x, b.y + 10, b.x - 26, b.y); c.fill(); c.stroke();
      c.fillStyle = '#8a5d32'; c.beginPath(); c.roundRect(b.x - 6, b.y - 22, 12, 20, 5); c.fill(); c.stroke();
      e(c, b.x, b.y - 58, 5, 6, '#bfe8ff', true, 1.5);
      c.fillStyle = '#c0573e'; c.beginPath(); c.moveTo(b.x - 22, b.y - 88); c.quadraticCurveTo(b.x, b.y - 124, b.x + 22, b.y - 88); c.closePath(); c.fill(); c.stroke();
      const a0 = t * 0.9;
      for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 2; c.save(); c.translate(top.x, top.y); c.rotate(a); c.fillStyle = '#fff8ef'; c.strokeStyle = O; c.lineWidth = 1.8; c.beginPath(); c.rect(4, -5, 48, 10); c.fill(); c.stroke(); c.strokeStyle = '#c4935f'; c.beginPath(); for (let k = 12; k < 52; k += 8) { c.moveTo(k, -5); c.lineTo(k, 5); } c.stroke(); c.restore(); }
      e(c, top.x, top.y, 5, 5, '#8a5d32');
      return true;
    }
    case 'sheep': case 'cow': {
      const k = hash(gx, gy) * 10, wx = gx + Math.sin(t * 0.13 + k) * 0.5, wy = gy + Math.cos(t * 0.11 + k) * 0.4;
      const p = iso(wx + 0.5, wy + 0.5), flip = Math.cos(t * 0.13 + k) > 0 ? 1 : -1, bob = Math.abs(Math.sin(t * 2 + k)) * 1.5, graze = Math.sin(t * 0.7 + k) > 0.3;
      c.save(); c.translate(p.x, p.y); c.scale(flip, 1);
      e(c, 0, 2, 16, 5, 'rgba(0,0,0,0.12)', false);
      if ((f.type as string) === 'sheep') {
        for (const [dx] of [[-8], [8]]) { c.fillStyle = O; c.fillRect(dx - 2, -8, 4, 9); }
        for (const [dx, dy, r] of [[-8, -14, 8], [0, -17, 9], [8, -14, 8], [0, -10, 9]] as const) e(c, dx, dy - bob, r, r * 0.85, '#fff', true, 1.5);
        e(c, 14, graze ? -6 : -16 - bob, 5.5, 5, '#3a3a44', true, 1.5); e(c, 16, graze ? -7 : -17 - bob, 1.2, 1.2, '#fff', false);
      } else {
        for (const dx of [-10, -4, 6, 11]) { c.fillStyle = '#f5f0e8'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.roundRect(dx - 2, -12, 4, 13, 1); c.fill(); c.stroke(); }
        c.fillStyle = '#fff'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(-16, -26 - bob, 32, 16, 8); c.fill(); c.stroke();
        e(c, -6, -20 - bob, 5, 4, '#3a3a44', false); e(c, 6, -22 - bob, 4, 3, '#3a3a44', false);
        e(c, 18, graze ? -12 : -26 - bob, 7, 6, '#fff', true, 1.5); e(c, 22, graze ? -10 : -24 - bob, 4, 3, '#ffb3c7', true, 1);
      }
      c.restore(); return true;
    }
    case 'ducks': {
      for (let i = 0; i < 4; i++) {
        const a = t * 0.25 - i * 0.32, x = gx + Math.cos(a) * 2.2, y = gy + Math.sin(a) * 1.4, p = iso(x, y), s = i ? 0.65 : 1;
        const dir = -Math.sin(a) * 2.2 - Math.cos(a) * 1.4 > 0 ? 1 : -1;
        c.save(); c.translate(p.x, p.y + Math.sin(t * 3 + i) * 0.8); c.scale(dir * s, s);
        c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 2, 13, 3.5, 0, 0, 7); c.stroke();
        e(c, 0, -3, 9, 6, i ? '#ffe08a' : '#fff', true, 1.5); e(c, 7, -10, 4.5, 4.5, i ? '#ffe08a' : '#3f8f5a', true, 1.5);
        c.fillStyle = '#ff9f1c'; c.beginPath(); c.moveTo(11, -10); c.lineTo(15, -9); c.lineTo(11, -8); c.closePath(); c.fill();
        c.restore();
      }
      return true;
    }
    case 'reeds': {
      const p = iso(gx + 0.5, gy + 0.5);
      for (let i = 0; i < 5; i++) { const x = p.x - 10 + i * 5, h = 20 + (i * 7) % 12, sw = Math.sin(t * 1.4 + gx + i) * 2; c.strokeStyle = '#4a8a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, p.y); c.quadraticCurveTo(x, p.y - h * 0.6, x + sw, p.y - h); c.stroke(); if (i % 2) { c.fillStyle = '#8a5d32'; c.beginPath(); c.ellipse(x + sw, p.y - h - 3, 2.2, 5, 0, 0, 7); c.fill(); } }
      return true;
    }
    case 'lilypad': { const p = iso(gx + 0.5, gy + 0.5); c.fillStyle = '#6cbf6c'; c.beginPath(); c.ellipse(p.x, p.y, 9, 4.5, 0, 0.3, Math.PI * 2 - 0.3); c.lineTo(p.x, p.y); c.fill(); if (hash(gx, gy) > 0.6) e(c, p.x + 2, p.y - 2, 3, 3, '#ff9ab8', false); return true; }
    case 'bridgerail': {
      const front = f.id.endsWith('-s');
      const yy = gy + d / 2, n = Math.round(w);
      for (let i = 0; i <= n; i++) { if (!flag('__bridgeFixed') && f.id.startsWith('w-bridge') && (i === 3)) continue; isoBox(c, gx + i - 0.06, yy - 0.06, 0.12, 0.12, 26, boxOf('#a0703f')); }
      for (const z of [12, 24]) {
        const segs: [number, number][] = !flag('__bridgeFixed') && f.id.startsWith('w-bridge') ? [[0, 2.15], [3.85, w]] : [[0, w]];
        for (const [u0, u1] of segs) { const a = iso(gx + u0, yy, z), b = iso(gx + u1, yy, z); c.strokeStyle = O; c.lineWidth = 6; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.strokeStyle = front ? '#d9a273' : '#c98e5f'; c.lineWidth = 3; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      }
      return true;
    }
    case 'bridgegap': {
      if (flag('__bridgeFixed')) return true;
      // scandurile lipsa: se vede apa printre ele, cu capete rupte
      tilePath(c, gx + 0.15, gy, 1.7, d); c.fillStyle = '#7ec8f0'; c.fill();
      c.strokeStyle = '#ffffff99'; c.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const p = iso(gx + 0.6 + k * 0.4, gy + 0.4 + k * 0.5); c.beginPath(); c.moveTo(p.x - 8, p.y); c.quadraticCurveTo(p.x - 4, p.y - 2, p.x, p.y); c.quadraticCurveTo(p.x + 4, p.y + 2, p.x + 8, p.y); c.stroke(); }
      for (const u of [0.15, 1.85]) for (let j = 0; j < 4; j++) { const p = iso(gx + u, gy + 0.25 + j * 0.5, 1), dir = u < 1 ? 1 : -1; c.fillStyle = '#c98e5f'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x, p.y - 2); c.lineTo(p.x + dir * (6 + (j % 2) * 5), p.y); c.lineTo(p.x, p.y + 2); c.closePath(); c.fill(); c.stroke(); }
      const s = iso(gx + 1, gy + 1, 40); drawPOI(c, s.x, s.y - 20, '🌉', t, '#e63946', true);
      return true;
    }
    case 'roadblock': {
      if (flag('__cityOpen')) return true;
      const a = iso(gx + 0.5, gy + 0.1, 0), b = iso(gx + 0.5, gy + d - 0.1, 0);
      for (const p of [a, b]) { c.fillStyle = '#e8e8ee'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(p.x - 3, p.y - 30, 6, 30, 2); c.fill(); c.stroke(); }
      const L = 8; for (let i = 0; i < L; i++) { const p = { x: a.x + (b.x - a.x) * i / L, y: a.y + (b.y - a.y) * i / L - 26 }, q = { x: a.x + (b.x - a.x) * (i + 1) / L, y: a.y + (b.y - a.y) * (i + 1) / L - 26 }; c.strokeStyle = O; c.lineWidth = 9; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke(); c.strokeStyle = i % 2 ? '#fff' : '#e63946'; c.lineWidth = 6; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke(); }
      const m = iso(gx + 0.5, gy + d / 2, 44); drawPOI(c, m.x, m.y, '🚧', t, '#ff9f1c', true);
      return true;
    }
    case 'forestgate': {
      const open = flag('__forestOpen');
      const L = iso(gx, gy + 0.1), Rr = iso(gx + w, gy + 0.1);
      for (const p of [L, Rr]) { c.strokeStyle = O; c.lineWidth = 9; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 54); c.stroke(); c.strokeStyle = '#8a5d32'; c.lineWidth = 6; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 54); c.stroke(); }
      // arcada din crengi cu frunze
      c.strokeStyle = O; c.lineWidth = 8; c.beginPath(); c.moveTo(L.x, L.y - 52); c.quadraticCurveTo((L.x + Rr.x) / 2, (L.y + Rr.y) / 2 - 96, Rr.x, Rr.y - 52); c.stroke();
      c.strokeStyle = '#8a5d32'; c.lineWidth = 5; c.stroke();
      for (let i = 0; i <= 8; i++) { const k = i / 8, x = L.x + (Rr.x - L.x) * k, y = L.y + (Rr.y - L.y) * k - 52 - Math.sin(k * Math.PI) * 44; e(c, x, y, 7, 5, i % 2 ? '#6fc46c' : '#5fb35f', true, 1.5); }
      if (!open) {
        for (let k = 0; k < 2; k++) { const z = 14 + k * 18; const a = iso(gx + 0.1, gy + 0.1, z), b = iso(gx + w - 0.1, gy + 0.1, z); c.strokeStyle = O; c.lineWidth = 7; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.strokeStyle = '#c4935f'; c.lineWidth = 4; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
        const m = iso(gx + w / 2, gy + 0.1, 40); drawPOI(c, m.x, m.y - 40, '🌲', t, '#7cc576', true);
      }
      return true;
    }
    case 'roadsign': {
      drawRoadSign(c, gx, gy, f.text ?? '', f.kind === 'welcome' ? '' : (f.kind ?? '') as SignDir, f.kind === 'welcome');
      return true;
    }
  }
  void heartPath;
  return false;
}
