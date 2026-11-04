// Orasul (Capitolul 4): bulevarde cu masini, blocuri inalte, buticul elegant, cinema, restaurant,
// cafeneaua (job), supermarket, parcul cu inghetata si blocul cu apartamentul vostru.
// + interiorul apartamentului (zona 'apartment').
import { AREAS, type Floor, type Furn, type Wall } from './map';
import { iso, isoBox, shade, boxOf, type Pt } from './iso';
import { heartPath } from '../char/draw';
import { drawPOI, drawSign } from './poi';
import { isOpen } from '../game/town';

const O = '#4a2a22';
const act = (id: string, label: string, icon: string) => ({ id, label, icon });

function cityFloor(x: number, y: number): Floor {
  if (y === 12 || y === 13) return 'asphalt';
  if ((x === 10 || x === 11) && y >= 0) return 'asphalt';
  if (x >= 13 && y >= 20) return x === 17 || y === 23 ? 'path' : 'grass';  // parcul
  if (x <= 8 && y >= 25) return 'grass';
  return 'sidewalk';
}

export interface CityBuilding { id: string; gx: number; gy: number; w: number; d: number; h: number; front: 'x' | 'y'; wall: string; trim: string; sign: string; signCol: string; awning?: string; action: { id: string; label: string; icon: string }; marquee?: boolean; floors: number }
export const CITY_BUILDINGS: CityBuilding[] = [
  { id: 'c-boutique', gx: 1, gy: 7, w: 4, d: 4, h: 118, floors: 4, front: 'y', wall: '#ffe1ea', trim: '#e5809a', sign: 'Buticul Elegant', signCol: '#ff4d8d', awning: '#ff9ab8', action: act('c-boutique', 'Buticul (haine elegante)', '🛍️') },
  { id: 'c-super', gx: 5, gy: 7, w: 4, d: 4, h: 92, floors: 3, front: 'y', wall: '#e7f6e2', trim: '#5aa35a', sign: 'Supermarket', signCol: '#3f8f5a', awning: '#7cc576', action: act('c-super', 'Supermarketul', '🛒') },
  { id: 'c-cinema', gx: 14, gy: 6, w: 6, d: 5, h: 104, floors: 3, front: 'y', wall: '#e9e2ff', trim: '#7a5ad6', sign: 'CINEMA', signCol: '#e63946', marquee: true, action: act('c-cinema', 'Cinema (20 lei / doi)', '🎬') },
  { id: 'c-resto', gx: 1, gy: 15, w: 4, d: 4, h: 84, floors: 3, front: 'x', wall: '#fff1d6', trim: '#c0573e', sign: 'Restaurant La Doi', signCol: '#c0573e', awning: '#e07a5f', action: act('c-resto', 'Restaurant (cină romantică)', '🍽️') },
  { id: 'c-cafe', gx: 5, gy: 15, w: 3, d: 4, h: 70, floors: 2, front: 'x', wall: '#f5e1c8', trim: '#8a5d32', sign: 'Cafeneaua', signCol: '#8a5d32', awning: '#c98e5f', action: act('c-cafe', 'Cafeneaua (lucrează ca barista)', '🧋') },
  { id: 'c-tower', gx: 1, gy: 20, w: 4, d: 4, h: 176, floors: 7, front: 'y', wall: '#e8f1ff', trim: '#5b7fbf', sign: 'Blocul Lalelelor', signCol: '#5b7fbf', action: act('c-tower', 'Blocul cu apartamente', '🏙️') },
  { id: 'c-office', gx: 14, gy: 0, w: 5, d: 5, h: 196, floors: 8, front: 'y', wall: '#d8e6f5', trim: '#3f5f8f', sign: 'Turnul de birouri', signCol: '#3f5f8f', action: act('c-office', 'Birourile (lucrează la birou)', '💻') },
  { id: 'c-bank', gx: 1, gy: 1, w: 4, d: 4, h: 132, floors: 5, front: 'y', wall: '#f5ead6', trim: '#c9a24a', sign: 'Banca', signCol: '#a07a2a', action: act('c-bank', 'Banca (economii, credit, apartament)', '🏦') },
  { id: 'c-uni', gx: 5, gy: 1, w: 4, d: 4, h: 122, floors: 4, front: 'y', wall: '#e8e0ff', trim: '#6a5acd', sign: 'Universitatea', signCol: '#5a4abd', action: act('c-uni', 'Universitatea (cursuri, diplome)', '🎓') },
  { id: 'c-hospital', gx: 6, gy: 20, w: 3, d: 4, h: 112, floors: 4, front: 'x', wall: '#ffffff', trim: '#e63946', sign: 'Spitalul', signCol: '#e63946', action: act('c-hospital', 'Spitalul (doctor, farmacie, lucru)', '🏥') },
  { id: 'c-mall', gx: 14, gy: 15, w: 4, d: 3, h: 86, floors: 3, front: 'y', wall: '#fff0f5', trim: '#ff7aa2', sign: 'Mall', signCol: '#ff4d8d', awning: '#ffb3c7', action: act('c-mall', 'Mall-ul (mobilă pentru apartament)', '🛍️') },
];

const F: Furn[] = [];
for (const b of CITY_BUILDINGS) F.push({ id: b.id, type: 'cbuilding' as any, gx: b.gx, gy: b.gy, w: b.w, d: b.d, solid: true, action: b.id === 'c-tower' ? undefined : b.action });
// blocul: intri doar pe usa scarii (pe fata dinspre parc), nu de oriunde din jurul lui
F.push({ id: 'c-towerdoor', type: 'towerdoor' as any, gx: 2.5, gy: 24, w: 1, d: 1, solid: false, action: act('c-tower', 'Intră în bloc (Scara A)', '🔑') });
F.push({ id: 'c-bus', type: 'busstop' as any, gx: 20, gy: 14, w: 1, d: 1, solid: true, action: act('c-bus', 'Autobuzul spre sat', '🚌') });
F.push({ id: 'c-taxi', type: 'taxistand' as any, gx: 12, gy: 15, w: 1, d: 1, solid: true, action: act('c-taxi', 'Taxi direct acasă (40 lei)', '🚕') });
F.push({ id: 'c-ice', type: 'icecart' as any, gx: 15, gy: 21, w: 1, d: 1, solid: true, action: act('c-ice', 'Înghețată (6 lei)', '🍦') });
F.push({ id: 'c-fountain', type: 'cfountain' as any, gx: 18, gy: 17, w: 2, d: 2, solid: true, action: act('v-fountain', 'Aruncă o monedă', '🪙') });
F.push({ id: 'c-lights', type: 'trafficlight' as any, gx: 9, gy: 11, w: 1, d: 1, solid: true });
F.push({ id: 'c-lights2', type: 'trafficlight' as any, gx: 12, gy: 14, w: 1, d: 1, solid: true });
for (const [x, y] of [[9, 5], [12, 8], [3, 14], [8, 14], [16, 14], [12, 18], [9, 22], [20, 11]]) F.push({ id: `c-lamp${x}-${y}`, type: 'lamppost' as any, gx: x, gy: y, w: 1, d: 1, solid: true });
for (const [x, y] of [[13, 24], [20, 21], [21, 25], [14, 26], [19, 26], [7, 26], [1, 26]]) F.push({ id: `c-tree${x}-${y}`, type: 'tree' as any, gx: x, gy: y, w: 1, d: 1, solid: true });
for (const [x, y] of [[18, 21], [14, 24]]) F.push({ id: `c-bench${x}-${y}`, type: 'bench' as any, gx: x, gy: y, w: 2, d: 1, solid: true, action: act('bench', 'Băncuța din parc', '🌅') });
for (const [x, y] of [[20, 23], [16, 25], [13, 21], [6, 25]]) F.push({ id: `c-fl${x}-${y}`, type: 'flowers' as any, gx: x, gy: y, w: 1, d: 1, solid: false });
for (const [x, y] of [[13, 15], [20, 6]]) F.push({ id: `c-pot${x}-${y}`, type: 'pot' as any, gx: x, gy: y, w: 1, d: 1, solid: true });

AREAS.city = { floor: cityFloor, furniture: F, walls: [], spawn: { x: 19.5, y: 15.5 } };

/** puncte pe trotuare pentru orasenii care se plimba */
export const CITY_PATHS: Pt[] = [{ x: 3, y: 11.5 }, { x: 8, y: 14.5 }, { x: 15, y: 11.5 }, { x: 19, y: 14.5 }, { x: 9.5, y: 4 }, { x: 12.5, y: 9 }, { x: 9.5, y: 20 }, { x: 12.5, y: 24 }, { x: 16, y: 22.5 }, { x: 19, y: 23.5 }];

// ------------------------------------------------------------------ masinile
export interface Car { lane: 0 | 1 | 2 | 3; k: number; speed: number; col: string; kind: 'car' | 'taxi' | 'bus' }
const CAR_COLS = ['#ff7aa2', '#7ab8ff', '#ffd23f', '#7cc576', '#ffffff', '#c9a0ff'];
export function makeCars(): Car[] {
  const cars: Car[] = [];
  for (let i = 0; i < 7; i++) cars.push({ lane: (i % 4) as Car['lane'], k: Math.random(), speed: 0.05 + Math.random() * 0.03, col: CAR_COLS[i % CAR_COLS.length], kind: i === 2 ? 'taxi' : i === 5 ? 'bus' : 'car' });
  return cars;
}
/** pozitia masinii pe banda (grid) + directie */
export function carPos(c: Car): { x: number; y: number; dir: 'x' | 'y'; sgn: 1 | -1 } {
  switch (c.lane) {
    case 0: return { x: -1 + c.k * 24, y: 12.5, dir: 'x', sgn: 1 };
    case 1: return { x: 23 - c.k * 24, y: 13.5, dir: 'x', sgn: -1 };
    case 2: return { x: 10.5, y: 28 - c.k * 30, dir: 'y', sgn: -1 };
    default: return { x: 11.5, y: -2 + c.k * 30, dir: 'y', sgn: 1 };
  }
}
/** masinile opresc la semafor cand e rosu pe directia lor */
export function updateCars(cars: Car[], dt: number, t: number, who: { x: number; y: number }[]) {
  const greenX = (t % 16) < 8;
  for (const c of cars) {
    const p = carPos(c);
    const ahead = (d: number) => { const q = { x: p.x + (p.dir === 'x' ? d * p.sgn : 0), y: p.y + (p.dir === 'y' ? d * p.sgn : 0) }; return q; };
    let stop = false;
    // semaforul: linia de oprire inainte de intersectie
    const pos = p.dir === 'x' ? p.x : p.y, stopAt = p.sgn > 0 ? 9.3 : (p.dir === 'x' ? 12.7 : 14.7);
    const red = p.dir === 'x' ? !greenX : greenX;
    if (red && (p.sgn > 0 ? pos < stopAt && pos > stopAt - 1.2 : pos > stopAt && pos < stopAt + 1.2)) stop = true;
    // pietonii (personajele) pe carosabil
    const a = ahead(1.1);
    for (const w of who) if (Math.hypot(w.x - a.x, w.y - a.y) < 1.1) stop = true;
    // masina din fata
    for (const o of cars) if (o !== c && o.lane === c.lane) { const d = (o.k - c.k + 1) % 1; if (d > 0 && d < 0.11) stop = true; }
    if (!stop) c.k = (c.k + c.speed * dt) % 1;
  }
}
export function drawCar(c: CanvasRenderingContext2D, car: Car, t: number) {
  const p = carPos(car);
  const L = car.kind === 'bus' ? 2.6 : 1.5, W = 0.78;
  const x0 = p.dir === 'x' ? p.x - L / 2 : p.x - W / 2, y0 = p.dir === 'y' ? p.y - L / 2 : p.y - W / 2;
  const w = p.dir === 'x' ? L : W, d = p.dir === 'y' ? L : W;
  const col = car.kind === 'taxi' ? '#ffd23f' : car.kind === 'bus' ? '#ff8c42' : car.col;
  // umbra
  const sh = iso(p.x, p.y); c.fillStyle = 'rgba(0,0,0,0.16)'; c.beginPath(); c.ellipse(sh.x, sh.y + 2, (p.dir === 'x' ? 40 : 30) * (car.kind === 'bus' ? 1.6 : 1), 12, 0, 0, 7); c.fill();
  const H = car.kind === 'bus' ? 46 : 20;
  isoBox(c, x0, y0, w, d, H, { top: shade(col, 1.05), left: col, right: shade(col, 0.85) }, 6);
  // cabina
  if (car.kind === 'bus') {
    for (let i = 0; i < 4; i++) { const u = 0.12 + i * 0.2; const a = p.dir === 'x' ? iso(x0 + u * w, y0 + d, 36) : iso(x0 + w, y0 + u * d, 36), b = p.dir === 'x' ? iso(x0 + (u + 0.15) * w, y0 + d, 36) : iso(x0 + w, y0 + (u + 0.15) * d, 36); c.fillStyle = '#bfe8ff'; c.strokeStyle = O; c.lineWidth = 1.2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(b.x, b.y + 10); c.lineTo(a.x, a.y + 10); c.closePath(); c.fill(); c.stroke(); }
  } else {
    const cx0 = p.dir === 'x' ? x0 + w * 0.22 : x0 + 0.04, cy0 = p.dir === 'y' ? y0 + d * 0.22 : y0 + 0.04;
    const cw = p.dir === 'x' ? w * 0.5 : w - 0.08, cd = p.dir === 'y' ? d * 0.5 : d - 0.08;
    isoBox(c, cx0, cy0, cw, cd, 16, { top: shade(col, 1.08), left: '#bfe8ff', right: '#a8d8f0' }, 26);
    if (car.kind === 'taxi') { const tp = iso(cx0 + cw / 2, cy0 + cd / 2, 43); c.fillStyle = '#fff'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.roundRect(tp.x - 9, tp.y - 5, 18, 8, 3); c.fill(); c.stroke(); c.font = '800 6px "Baloo 2", sans-serif'; c.fillStyle = O; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', tp.x, tp.y - 1); c.textBaseline = 'alphabetic'; }
  }
  // roti
  const wheels: Pt[] = p.dir === 'x' ? [{ x: x0 + 0.22 * w, y: y0 + d }, { x: x0 + 0.78 * w, y: y0 + d }] : [{ x: x0 + w, y: y0 + 0.22 * d }, { x: x0 + w, y: y0 + 0.78 * d }];
  for (const q of wheels) { const s = iso(q.x, q.y, 5); c.fillStyle = '#3a3a44'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.ellipse(s.x, s.y, 7, 7, 0, 0, 7); c.fill(); c.stroke(); }
  // farurile (noaptea se vad)
  const front = p.dir === 'x' ? iso(p.sgn > 0 ? x0 + w : x0, y0 + d * 0.5, 12) : iso(x0 + w * 0.5, p.sgn > 0 ? y0 + d : y0, 12);
  c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(front.x, front.y, 2.5, 0, 7); c.fill();
  void t;
}

// ------------------------------------------------------------------ desen cladiri
function quad(c: CanvasRenderingContext2D, pts: Pt[], fill: string, lw = 2) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = O; c.lineWidth = lw; c.stroke(); }
function e(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, st = true, lw = 2) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } }

function drawCityBuilding(c: CanvasRenderingContext2D, b: CityBuilding, t: number, night: number, owned: Record<string, boolean>) {
  const { gx, gy, w, d, h } = b;
  isoBox(c, gx, gy, w, d, h, { top: shade(b.wall, 0.92), left: b.wall, right: shade(b.wall, 0.86) });
  const lit = night > 0.4;
  // ferestrele pe ambele fete vizibile
  const faceY = (u: number, z: number) => iso(gx + u * w, gy + d, z);   // fata stanga-jos
  const faceX = (u: number, z: number) => iso(gx + w, gy + u * d, z);   // fata dreapta-jos
  const fh = (h - 40) / Math.max(1, b.floors - 1);
  for (const [face, n] of [[faceY, Math.round(w * 1.5)], [faceX, Math.round(d * 1.5)]] as const) {
    for (let f = 1; f < b.floors; f++) {
      const z = 40 + (f - 1) * fh + fh * 0.2;
      for (let i = 0; i < n; i++) {
        const u0 = (i + 0.22) / n, u1 = (i + 0.78) / n;
        const on = lit && ((i * 7 + f * 3 + gx) % 5 !== 0);
        quad(c, [face(u0, z), face(u1, z), face(u1, z + fh * 0.55), face(u0, z + fh * 0.55)], on ? '#ffe680' : (f + i) % 3 === 0 ? '#d4eefc' : '#bfe8ff', 1.2);
        if (!on) { const a = face(u0 + 0.02, z + fh * 0.45), bb = face(u0 + (u1 - u0) * 0.5, z + fh * 0.2); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(bb.x, bb.y); c.stroke(); }
      }
      // brau intre etaje
      const a = face(0, z - fh * 0.2), bb = face(1, z - fh * 0.2); c.strokeStyle = shade(b.trim, 1.1); c.lineWidth = 2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(bb.x, bb.y); c.stroke();
    }
  }
  // parterul: vitrina + usa pe fata principala
  const P = b.front === 'y' ? faceY : faceX;
  quad(c, [P(0, 0), P(1, 0), P(1, 36), P(0, 36)], shade(b.trim, 1.25), 1.5);
  if (b.id === 'c-tower') {
    // intrarea in bloc: usa scarii cu geam, copertina, interfon, placuta "Scara A", ferestre de apartament la parter
    for (const [u0, u1] of [[0.06, 0.22], [0.78, 0.94]]) quad(c, [P(u0, 10), P(u1, 10), P(u1, 30), P(u0, 30)], lit ? '#ffe680' : '#bfe8ff', 1.2);
    quad(c, [P(0.38, 0), P(0.62, 0), P(0.62, 34), P(0.38, 34)], '#f4efe8', 1.5);
    quad(c, [P(0.41, 0), P(0.59, 0), P(0.59, 31), P(0.41, 31)], '#5b7fbf', 1.5);
    quad(c, [P(0.44, 12), P(0.56, 12), P(0.56, 28), P(0.44, 28)], lit ? '#fff4c0' : '#d4eefc', 1.2);
    const kn = P(0.555, 14); e(c, kn.x, kn.y, 1.8, 1.8, '#ffd23f', true, 1);
    const ic = P(0.68, 16); c.fillStyle = '#c9ccd6'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.roundRect(ic.x - 3, ic.y - 7, 6, 10, 1.5); c.fill(); c.stroke();
    for (let i = 0; i < 3; i++) { c.fillStyle = '#3a3a44'; c.beginPath(); c.arc(ic.x, ic.y - 4 + i * 3, 0.9, 0, 7); c.fill(); }
    quad(c, [P(0.34, 36), P(0.66, 36), { x: P(0.66, 36).x - 12, y: P(0.66, 36).y + 8 }, { x: P(0.34, 36).x - 12, y: P(0.34, 36).y + 8 }], b.trim, 1.5);
    const pl = P(0.5, 44); c.fillStyle = '#fff'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.roundRect(pl.x - 15, pl.y - 6, 30, 12, 3); c.fill(); c.stroke();
    c.fillStyle = b.trim; c.font = '800 8px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Scara A', pl.x, pl.y + 0.5); c.textBaseline = 'alphabetic';
    // treptele din fata usii
    for (let i = 0; i < 2; i++) isoBox(c, gx + w * 0.38, gy + d + i * 0.18, w * 0.24, 0.36 - i * 0.18, 6 - i * 3, { top: '#e6e6ee', left: '#c9ccd6', right: '#b0b4c0' });
  } else {
  quad(c, [P(0.08, 4), P(0.38, 4), P(0.38, 30), P(0.08, 30)], lit ? '#ffe9a8' : '#d4eefc', 1.5);
  quad(c, [P(0.62, 4), P(0.92, 4), P(0.92, 30), P(0.62, 30)], lit ? '#ffe9a8' : '#d4eefc', 1.5);
  quad(c, [P(0.43, 0), P(0.57, 0), P(0.57, 30), P(0.43, 30)], shade(b.trim, 0.8), 1.5);
  }
  // ce se vede in vitrine
  if (b.id === 'c-boutique') for (const u of [0.2, 0.78]) { const p = P(u, 6); c.fillStyle = u < 0.5 ? '#ff7aa2' : '#3a3a44'; c.beginPath(); c.moveTo(p.x, p.y - 20); c.lineTo(p.x - 6, p.y); c.lineTo(p.x + 6, p.y); c.closePath(); c.fill(); e(c, p.x, p.y - 22, 3, 3, '#f5ead6', false); }
  if (b.id === 'c-super') for (const u of [0.15, 0.25, 0.7, 0.82]) { const p = P(u, 8); e(c, p.x, p.y - 4, 3.5, 3.5, ['#e63946', '#ffd23f', '#7cc576', '#ff8c42'][Math.round(u * 10) % 4], true, 1); }
  if (b.id === 'c-cafe' || b.id === 'c-resto') for (const u of [0.22, 0.77]) { const p = P(u, 8); e(c, p.x, p.y - 2, 6, 2.5, '#fff', true, 1); c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y + 6); c.stroke(); }
  if (b.awning) {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n; const a = P(u0, 40), bb = P(u1, 40);
      const out = b.front === 'y' ? { x: -14, y: 7 } : { x: 14, y: 7 };
      quad(c, [a, bb, { x: bb.x + out.x, y: bb.y + out.y + 5 }, { x: a.x + out.x, y: a.y + out.y + 5 }], i % 2 ? '#fff' : b.awning, 1.2);
    }
  }
  // acoperisul plat: parapet + aparat de aer conditionat + rezervor
  const r0 = iso(gx, gy, h), r1 = iso(gx + w, gy, h), r2 = iso(gx + w, gy + d, h), r3 = iso(gx, gy + d, h);
  c.strokeStyle = shade(b.wall, 0.7); c.lineWidth = 4; c.beginPath(); c.moveTo(r0.x, r0.y); c.lineTo(r1.x, r1.y); c.lineTo(r2.x, r2.y); c.lineTo(r3.x, r3.y); c.closePath(); c.stroke();
  isoBox(c, gx + w * 0.2, gy + d * 0.2, 0.8, 0.6, 10, { top: '#e6e6ee', left: '#c9ccd6', right: '#b0b4c0' }, h);
  if (b.floors > 4) { const tp = iso(gx + w * 0.7, gy + d * 0.35, h); c.fillStyle = '#c99a5a'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(tp.x - 9, tp.y - 30, 18, 22, 4); c.fill(); c.stroke(); c.beginPath(); c.moveTo(tp.x - 7, tp.y - 8); c.lineTo(tp.x - 7, tp.y); c.moveTo(tp.x + 7, tp.y - 8); c.lineTo(tp.x + 7, tp.y); c.stroke(); }
  // semnul plutitor deasupra institutiei
  if (b.sign) { const hr = (globalThis as any).__hour ?? 12; const top = iso(gx + w / 2, gy + d / 2, h + 34); drawPOI(c, top.x, top.y, isOpen(b.id, hr) ? b.action.icon : '🌙', t, isOpen(b.id, hr) ? b.signCol : '#9aa0ae'); }
  // firma
  if (b.sign && !b.marquee) { const sp = P(0.5, 46); drawSign(c, sp.x, sp.y, b.sign, b.action.icon, '#fff8ef', b.signCol, 12); }
  else if (b.sign) {
    const sp = P(0.5, b.marquee ? 58 : 46);
    c.font = `900 ${b.marquee ? 16 : 11}px "Baloo 2", sans-serif`; const tw = c.measureText(b.sign).width + 18;
    c.fillStyle = b.marquee ? '#2b1d40' : '#fff8ef'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(sp.x - tw / 2, sp.y - 11, tw, 22, 6); c.fill(); c.stroke();
    if (b.marquee) for (let i = 0; i < 12; i++) { const on = Math.floor(t * 6 + i) % 2 === 0; c.fillStyle = on ? '#ffe680' : '#8a7a40'; c.beginPath(); c.arc(sp.x - tw / 2 + 4 + i * (tw - 8) / 11, sp.y - 13, 2.2, 0, 7); c.fill(); c.beginPath(); c.arc(sp.x - tw / 2 + 4 + i * (tw - 8) / 11, sp.y + 13, 2.2, 0, 7); c.fill(); }
    c.fillStyle = b.marquee ? '#ffe680' : b.signCol; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.sign, sp.x, sp.y + 1); c.textBaseline = 'alphabetic';
  }
  // afisul filmului la cinema
  if (b.marquee) { const p = P(0.18, 64); c.fillStyle = '#ffb3c7'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(p.x - 10, p.y - 18, 20, 28, 3); c.fill(); c.stroke(); heartPath(c, p.x, p.y - 6, 5); c.fillStyle = '#e63946'; c.fill(); }
  // apartamentul vostru: inimioara la fereastra
  if (b.id === 'c-tower' && owned.apartment) { const p = faceY(0.3, 40 + fh * 3 + fh * 0.45); heartPath(c, p.x, p.y, 6 + Math.sin(t * 3)); c.fillStyle = '#ff4d6d'; c.fill(); c.strokeStyle = O; c.lineWidth = 1.5; c.stroke(); }
  if (b.id === 'c-tower' && !owned.apartment) { const p = P(0.5, 52); c.font = '800 9px "Baloo 2", sans-serif'; c.fillStyle = '#fff'; c.beginPath(); c.roundRect(p.x - 40, p.y - 8, 80, 16, 5); c.fill(); c.strokeStyle = '#e63946'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#e63946'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🔒 DE VÂNZARE', p.x, p.y + 0.5); c.textBaseline = 'alphabetic'; }
}

export function drawCityType(c: CanvasRenderingContext2D, f: Furn, t: number, night: number, owned: Record<string, boolean>): boolean {
  const { gx, gy } = f;
  switch (f.type as string) {
    case 'cbuilding': { const b = CITY_BUILDINGS.find(x => x.id === f.id); if (!b) return false; drawCityBuilding(c, b, t, night, owned); return true; }
    case 'towerdoor': { const p = iso(gx + 0.5, gy + 0.55, 0); c.fillStyle = '#c98e5f'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.ellipse(p.x, p.y, 13, 6, 0, 0, 7); c.fill(); c.stroke(); return true; }
    case 'icecart': {
      isoBox(c, gx + 0.1, gy + 0.25, 0.8, 0.5, 26, { top: '#fff', left: '#ffd6e4', right: '#ffb6c9' }, 6);
      for (const [u, v] of [[0.2, 0.3], [0.8, 0.7]]) { const p = iso(gx + u, gy + v, 4); e(c, p.x, p.y, 5, 5, '#3a3a44', true, 1.5); }
      const top = iso(gx + 0.5, gy + 0.5, 34);
      c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(top.x, top.y); c.lineTo(top.x, top.y - 30); c.stroke();
      for (let i = 0; i < 6; i++) { const a0 = Math.PI + i * Math.PI / 6, a1 = a0 + Math.PI / 6; c.beginPath(); c.moveTo(top.x, top.y - 42); c.lineTo(top.x + Math.cos(a0) * 32, top.y - 28 + Math.sin(a0 + Math.PI) * 0); c.lineTo(top.x + Math.cos(a1) * 32, top.y - 28); c.closePath(); c.fillStyle = i % 2 ? '#fff' : '#7ab8ff'; c.fill(); c.stroke(); }
      // cornetul uriaș
      const cp = iso(gx + 0.5, gy + 0.5, 30); c.fillStyle = '#e8b06a'; c.beginPath(); c.moveTo(cp.x - 6, cp.y - 4); c.lineTo(cp.x + 6, cp.y - 4); c.lineTo(cp.x, cp.y + 10); c.closePath(); c.fill(); c.stroke();
      e(c, cp.x - 3, cp.y - 8, 5, 5, '#ffb3c7', true, 1.5); e(c, cp.x + 3, cp.y - 9, 5, 5, '#fff3b0', true, 1.5);
      return true;
    }
    case 'taxistand': {
      isoBox(c, gx + 0.42, gy + 0.42, 0.16, 0.16, 46, boxOf('#5a5a66'));
      const p = iso(gx + 0.5, gy + 0.5, 50); c.fillStyle = '#ffd23f'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(p.x - 18, p.y - 10, 36, 16, 4); c.fill(); c.stroke();
      c.font = '800 9px "Baloo 2", sans-serif'; c.fillStyle = O; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', p.x, p.y - 1.5); c.textBaseline = 'alphabetic';
      drawPOI(c, p.x, p.y - 34, '🚕', t, '#ffd23f');
      return true;
    }
    case 'cfountain': {
      const p = iso(gx + 1, gy + 1);
      e(c, p.x, p.y - 4, 56, 26, '#cfd4dc'); e(c, p.x, p.y - 7, 48, 21, '#7ec8f0', false);
      c.fillStyle = '#b8bec8'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(p.x - 6, p.y - 46, 12, 40, 4); c.fill(); c.stroke();
      e(c, p.x, p.y - 46, 20, 8, '#cfd4dc');
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + t * 0.4; const k = (t * 1.1 + i / 12) % 1; c.fillStyle = `rgba(180,225,255,${1 - k})`; c.beginPath(); c.arc(p.x + Math.cos(a) * k * 34, p.y - 50 - Math.sin(k * Math.PI) * 26 + k * 40, 2.8, 0, 7); c.fill(); }
      // porumbei
      for (let i = 0; i < 3; i++) { const q = iso(gx - 0.2 + i * 0.5, gy + 2.2 + (i % 2) * 0.3); const hop = Math.abs(Math.sin(t * 3 + i * 2)) * 3; e(c, q.x, q.y - 5 - hop, 6, 4.5, '#b8bcc8', true, 1.2); e(c, q.x + 5, q.y - 9 - hop, 3, 3, '#9aa0ae', true, 1.2); }
      return true;
    }
    // ---- mobila din mall (in apartament)
    case 'aquarium': {
      isoBox(c, gx + 0.1, gy + 0.2, 0.8, 0.6, 20, boxOf('#8a5d32'));
      isoBox(c, gx + 0.12, gy + 0.22, 0.76, 0.56, 30, { top: '#bfe8ffcc', left: '#7ec8f0cc', right: '#5aa8d8cc' }, 20);
      const p = iso(gx + 0.5, gy + 0.8, 34);
      for (let i = 0; i < 3; i++) { const fx = p.x - 14 + ((t * 12 + i * 11) % 30), fy = p.y - 6 + i * 6 + Math.sin(t * 3 + i) * 2; c.fillStyle = ['#ff8c3a', '#ffd23f', '#ff5d8f'][i]; c.beginPath(); c.ellipse(fx, fy, 4, 2.5, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(fx - 4, fy); c.lineTo(fx - 7, fy - 2.5); c.lineTo(fx - 7, fy + 2.5); c.fill(); }
      for (let i = 0; i < 3; i++) { const k = (t * 0.7 + i / 3) % 1; c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(p.x + 10, p.y + 6 - k * 22, 1.5 + k, 0, 7); c.fill(); }
      return true;
    }
    case 'piano': {
      isoBox(c, gx + 0.1, gy + 0.15, 0.8, 0.7, 40, { top: '#3a3a44', left: '#2b2b33', right: '#22222a' });
      const a = iso(gx + 0.12, gy + 0.85, 30), b2 = iso(gx + 0.88, gy + 0.85, 30);
      c.fillStyle = '#fff'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b2.x, b2.y); c.lineTo(b2.x, b2.y + 7); c.lineTo(a.x, a.y + 7); c.closePath(); c.fill(); c.stroke();
      for (let i = 1; i < 8; i++) { const q = iso(gx + 0.12 + i * 0.095, gy + 0.85, 30); c.fillStyle = '#2b2b33'; c.fillRect(q.x - 1, q.y, 2.5, 4); }
      return true;
    }
    case 'console': {
      isoBox(c, gx + 0.15, gy + 0.3, 0.7, 0.4, 8, boxOf('#5a6a8a'));
      const p = iso(gx + 0.5, gy + 0.5, 12); c.fillStyle = '#ff5d8f'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.roundRect(p.x - 9, p.y - 5, 18, 8, 4); c.fill(); c.stroke();
      c.fillStyle = '#7ab8ff'; c.beginPath(); c.roundRect(p.x + 12, p.y - 2, 14, 7, 3); c.fill(); c.stroke();
      return true;
    }
    case 'coffeemachine': {
      isoBox(c, gx + 0.25, gy + 0.25, 0.5, 0.5, 24, { top: '#c9ccd6', left: '#9aa0ae', right: '#8a90a0' }, 24);
      const p = iso(gx + 0.5, gy + 0.75, 30); c.fillStyle = '#fff'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.roundRect(p.x - 4, p.y, 8, 7, 2); c.fill(); c.stroke();
      for (let i = 0; i < 2; i++) { const k = (t * 0.8 + i / 2) % 1; c.globalAlpha = 1 - k; c.strokeStyle = '#c9b8b0'; c.beginPath(); c.moveTo(p.x, p.y - 2 - k * 14); c.quadraticCurveTo(p.x + 4, p.y - 6 - k * 14, p.x, p.y - 10 - k * 14); c.stroke(); c.globalAlpha = 1; }
      return true;
    }
    case 'painting': {
      for (const u of [0.25, 0.75]) isoBox(c, gx + u - 0.03, gy + 0.5, 0.06, 0.06, 40, boxOf('#8a5d32'));
      const p = iso(gx + 0.5, gy + 0.5, 46); c.fillStyle = '#ffe1ea'; c.strokeStyle = '#c99a5a'; c.lineWidth = 4; c.beginPath(); c.roundRect(p.x - 20, p.y - 26, 40, 30, 3); c.fill(); c.stroke();
      heartPath(c, p.x, p.y - 12, 8); c.fillStyle = '#ff4d6d'; c.fill();
      return true;
    }
    case 'bigplant': {
      isoBox(c, gx + 0.3, gy + 0.3, 0.4, 0.4, 16, boxOf('#e07a5f'));
      const p = iso(gx + 0.5, gy + 0.5, 22);
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.38, l = 26 + (i % 2) * 8; c.fillStyle = i % 2 ? '#6bb35a' : '#7cc56b'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.ellipse(p.x + Math.cos(a) * l * 0.55, p.y + Math.sin(a) * l * 0.8 - 4, 6, l * 0.5, a + Math.PI / 2, 0, 7); c.fill(); c.stroke(); }
      return true;
    }
    case 'floorlamp': {
      isoBox(c, gx + 0.46, gy + 0.46, 0.08, 0.08, 56, boxOf('#5a5a66'));
      const p = iso(gx + 0.5, gy + 0.5, 62); c.fillStyle = '#ffe9a8'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x - 14, p.y); c.lineTo(p.x + 14, p.y); c.lineTo(p.x + 8, p.y - 18); c.lineTo(p.x - 8, p.y - 18); c.closePath(); c.fill(); c.stroke();
      if (night > 0.3) { const gr = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 70); gr.addColorStop(0, 'rgba(255,220,140,.4)'); gr.addColorStop(1, 'rgba(255,220,140,0)'); c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, 70, 0, 7); c.fill(); }
      return true;
    }
    case 'trafficlight': {
      const p = iso(gx + 0.5, gy + 0.5);
      c.fillStyle = '#5a5a66'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(p.x - 2.5, p.y - 70, 5, 70, 2); c.fill(); c.stroke();
      c.fillStyle = '#3a3a44'; c.beginPath(); c.roundRect(p.x - 8, p.y - 100, 16, 34, 5); c.fill(); c.stroke();
      const greenX = (t % 16) < 8, mine = f.id === 'c-lights' ? greenX : !greenX;
      e(c, p.x, p.y - 92, 4.5, 4.5, mine ? '#5a3030' : '#ff4d4d', false); e(c, p.x, p.y - 74, 4.5, 4.5, mine ? '#4dff7a' : '#2a5a3a', false);
      return true;
    }
  }
  return false;
}

// ------------------------------------------------------------------ apartamentul (interior)
function aptFloor(x: number, y: number): Floor {
  if (x < 3 || y < 3 || x > 16 || y > 13) return 'void' as Floor;
  if (x >= 12 && y <= 7) return 'tileblue';     // baia
  if (x >= 12) return 'checker';                // bucataria
  if (y <= 7) return 'pinkwood';                // dormitorul
  return 'wood';                                 // livingul
}
const AW = '#f3e6ff', AW2 = '#e8f4ff';
function aptWalls(): Wall[] {
  const W: Wall[] = [];
  for (let x = 3; x <= 16; x++) W.push({ x, y: 3, dir: 'x', h: 92, kind: 'back', window: x === 5 || x === 9 || x === 14, color: x >= 12 ? AW2 : AW });
  for (let y = 3; y <= 13; y++) W.push({ x: 3, y, dir: 'y', h: 92, kind: 'back', window: y === 5, door: y === 12, color: y <= 7 ? AW : '#fff4dc' });
  for (let y = 3; y <= 7; y++) if (y !== 6) W.push({ x: 12, y, dir: 'y', h: 26, kind: 'inner', color: '#eadcf5' });
  for (let x = 3; x <= 11; x++) if (x !== 9) W.push({ x, y: 8, dir: 'x', h: 26, kind: 'inner', color: '#eadcf5' });
  for (let x = 3; x <= 16; x++) W.push({ x, y: 14, dir: 'x', h: 10, kind: 'low', color: '#e0d0ea' });
  for (let y = 3; y <= 13; y++) W.push({ x: 17, y, dir: 'y', h: 10, kind: 'low', color: '#e0d0ea' });
  return W;
}
const AF: Furn[] = [
  { id: 'bed', type: 'bed', gx: 4, gy: 3, w: 2, d: 3, solid: true, action: act('sleep', 'Patul cel mare', '🛏️') },
  { id: 'a-ns', type: 'nightstand', gx: 6, gy: 3, w: 1, d: 1, solid: true, action: act('lamp', 'Lampa', '💡') },
  { id: 'ward', type: 'wardrobe', gx: 3, gy: 6, w: 1, d: 1, solid: true, action: act('dress', 'Garderoba', '👗') },
  { id: 'a-rugB', type: 'rug', gx: 7, gy: 4, w: 3, d: 2, solid: false, color: '#e3c8ff' },
  { id: 'a-plantB', type: 'plant', gx: 10, gy: 3, w: 1, d: 1, solid: true, action: act('water_plant', 'Udă floarea', '🪴') },
  { id: 'toilet', type: 'toilet', gx: 13, gy: 3, w: 1, d: 1, solid: true, action: act('toilet', 'Toaleta', '🚽') },
  { id: 'tub', type: 'bathtub', gx: 14, gy: 3, w: 2, d: 1, solid: true, action: act('bath', 'Baie cu spumă', '🛁') },
  { id: 'sink', type: 'sink', gx: 16, gy: 5, w: 1, d: 1, solid: true, action: act('teeth', 'Spălat pe dinți', '🪥') },
  { id: 'washer', type: 'washer', gx: 16, gy: 3, w: 1, d: 1, solid: true, action: act('laundry', 'Rufe', '🧺') },
  { id: 'fridge', type: 'fridge', gx: 16, gy: 9, w: 1, d: 1, solid: true, action: act('snack', 'Frigiderul', '🧊') },
  { id: 'stove', type: 'stove', gx: 16, gy: 10, w: 1, d: 1, solid: true, action: act('cook', 'Gătește', '🍳') },
  { id: 'counter', type: 'counter', gx: 16, gy: 11, w: 1, d: 1, solid: true, action: act('dishes', 'Spălat vase', '🍽️') },
  { id: 'table', type: 'table', gx: 13, gy: 11, w: 2, d: 1, solid: true, action: act('eat', 'Masa', '🍰') },
  { id: 'a-rugL', type: 'rug', gx: 5, gy: 9, w: 4, d: 3, solid: false, color: '#ffd6e4' },
  { id: 'sofa', type: 'sofa', gx: 8, gy: 10, w: 1, d: 2, solid: true, action: act('cuddle', 'Canapeaua', '🛋️') },
  { id: 'tv', type: 'tv', gx: 3, gy: 10, w: 1, d: 2, solid: true, action: act('tv', 'Televizor mare', '📺') },
  { id: 'shelf', type: 'bookshelf', gx: 3, gy: 8, w: 1, d: 1, solid: true, action: act('read', 'Citește', '📚') },
  { id: 'laptop', type: 'laptop', gx: 10, gy: 9, w: 1, d: 1, solid: true, action: act('online', 'Laptopul (magazin online)', '💻') },
  { id: 'a-plantL', type: 'plant', gx: 5, gy: 13, w: 1, d: 1, solid: true, action: act('water_plant', 'Udă floarea', '🪴') },
  // usa de la intrare e pe peretele din stanga (y = 12): stai pe pres si iesi pe usa, pe scara blocului
  { id: 'a-door', type: 'doormat', gx: 3, gy: 12, w: 1, d: 1, solid: false, action: act('a-exit', 'Ieși pe ușă (scara blocului)', '🔑') },
];
AREAS.apartment = { floor: aptFloor, furniture: AF, walls: aptWalls(), spawn: { x: 3.7, y: 12.5 } };

/** apartamentul e un etaj din Blocul Lalelelor: sub podea se vede blocul (etajele de jos), nu cer gol */
export function drawAptBuilding(c: CanvasRenderingContext2D, night: number) {
  const x0 = 3, y0 = 3, w = 14, d = 11, H = 720;
  const wall = '#e8f1ff', trim = '#5b7fbf', lit = night > 0.4;
  // placa etajului (grosimea podelei) + fatadele care coboara
  isoBox(c, x0, y0, w, d, H, { top: '#d9d0c4', left: wall, right: shade(wall, 0.86) }, -H - 12);
  isoBox(c, x0, y0, w, d, 12, { top: '#d9d0c4', left: shade(trim, 1.5), right: shade(trim, 1.35) }, -12);
  const faceY = (u: number, z: number) => iso(x0 + u * w, y0 + d, z);
  const faceX = (u: number, z: number) => iso(x0 + w, y0 + u * d, z);
  const fh = 78;
  for (const [face, n] of [[faceY, 12], [faceX, 9]] as const) {
    for (let f = 0; f < 8; f++) {
      const z = -12 - (f + 1) * fh + 18;
      for (let i = 0; i < n; i++) {
        const u0 = (i + 0.22) / n, u1 = (i + 0.78) / n;
        const on = lit && ((i * 5 + f * 3) % 4 !== 0);
        quad(c, [face(u0, z), face(u1, z), face(u1, z + 40), face(u0, z + 40)], on ? '#ffe680' : (f + i) % 3 === 0 ? '#d4eefc' : '#bfe8ff', 1.2);
      }
      // balustrada balcoanelor si braul dintre etaje
      const a = face(0, z + fh - 18), b = face(1, z + fh - 18); c.strokeStyle = shade(trim, 1.1); c.lineWidth = 2.5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
  }
  // firma blocului pe colt
  const p = faceY(0.08, -40); drawSign(c, p.x + 30, p.y, 'Blocul Lalelelor · et. 4', '🏙️', '#fff8ef', trim, 10);
}
