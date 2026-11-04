import { fillTextIcons } from '../ui/icons';
// Satul (Capitolul 3): strazi pavate, piateta cu fantana, magazine, primarie, scoala, parc, florarie, tamplarie.
import { AREAS, type Floor, type Furn } from './map';
import { iso, isoBox, boxOf, shade, tilePath, type Pt } from './iso';
import { heartPath } from '../char/draw';
import { drawPOI, drawSign } from './poi';
import { isOpen } from '../game/town';

const O = '#4a2a22';
const act = (id: string, label: string, icon: string) => ({ id, label, icon });

function villageFloor(x: number, y: number): Floor {
  if ((y === 12 || y === 13) || (x === 10 || x === 11)) return 'path';
  if (x >= 7 && x <= 14 && y >= 10 && y <= 15) return 'path';
  if (x >= 13 && y >= 16 && x <= 20 && y <= 25) return (x + y) % 7 === 0 ? 'sand' : 'grass';
  return 'grass';
}

/** cladirile: front = fata cu usa ('y' = spre stanga-jos, 'x' = spre dreapta-jos) */
export interface BuildingDef { id: string; gx: number; gy: number; w: number; d: number; h: number; front: 'x' | 'y'; wall: string; roof: string; sign: string; awning?: string; action: { id: string; label: string; icon: string }; tower?: boolean }
export const BUILDINGS: BuildingDef[] = [
  { id: 'v-grocery', gx: 1, gy: 7, w: 4, d: 4, h: 58, front: 'y', wall: '#fff1d6', roof: '#7cb870', sign: 'Magazin Alimentar', awning: '#7cc576', action: act('v-grocery', 'Magazinul alimentar', '🛒') },
  { id: 'v-clothes', gx: 5, gy: 7, w: 4, d: 4, h: 58, front: 'y', wall: '#ffe1ea', roof: '#e5809a', sign: 'Croitoria', awning: '#ff9ab8', action: act('v-clothes', 'Croitoria (haine)', '🧵') },
  { id: 'v-hall', gx: 15, gy: 6, w: 5, d: 5, h: 74, front: 'y', wall: '#e8f1ff', roof: '#5b7fbf', sign: 'Primăria', action: act('v-hall', 'Primăria', '🏛️'), tower: true },
  { id: 'v-school', gx: 5, gy: 15, w: 4, d: 3, h: 60, front: 'x', wall: '#fff6b8', roof: '#c0573e', sign: 'Școala', action: act('v-school', 'Școala satului', '🏫') },
  { id: 'v-florarie', gx: 5, gy: 19, w: 4, d: 3, h: 54, front: 'x', wall: '#fff0f5', roof: '#ff9ab8', sign: 'Florăria lui Bubu', awning: '#ff7aa2', action: act('v-florarie', 'Florăria lui Bubu', '💐') },
  { id: 'v-workshop', gx: 5, gy: 23, w: 4, d: 3, h: 54, front: 'x', wall: '#e7c08f', roof: '#8a5d32', sign: 'Tâmplăria lui Dudu', awning: '#c98e5f', action: act('v-workshop', 'Tâmplăria lui Dudu', '🪚') },
  { id: 'v-bakery', gx: 1, gy: 1, w: 3, d: 3, h: 54, front: 'y', wall: '#fff3e0', roof: '#d9a05a', sign: 'Brutăria', awning: '#e8b06a', action: act('v-bakery', 'Brutăria (pâine / lucru)', '🍞') },
  { id: 'v-post', gx: 5, gy: 1, w: 3, d: 3, h: 56, front: 'y', wall: '#e8f1ff', roof: '#5b7fbf', sign: 'Poșta', awning: '#7ab8ff', action: act('v-post', 'Poșta (lucrează ca poștaș)', '💌') },
  { id: 'v-clinic', gx: 16, gy: 1, w: 4, d: 3, h: 58, front: 'y', wall: '#ffffff', roof: '#e63946', sign: 'Dispensar · Farmacie', awning: '#ff9a9a', action: act('v-clinic', 'Dispensarul (doctor, farmacie)', '🩺') },
];

const F: Furn[] = [];
for (const b of BUILDINGS) F.push({ id: b.id, type: 'building' as any, gx: b.gx, gy: b.gy, w: b.w, d: b.d, solid: true, action: b.action });
F.push({ id: 'v-market', type: 'stalls' as any, gx: 12, gy: 9, w: 3, d: 2, solid: true, action: act('v-market', 'Piața (vinde)', '💱') });
F.push({ id: 'v-fountain', type: 'fountain' as any, gx: 8, gy: 14, w: 1, d: 1, solid: true, action: act('v-fountain', 'Aruncă o monedă', '🪙') });
F.push({ id: 'v-ferris', type: 'ferris' as any, gx: 16, gy: 17, w: 3, d: 2, solid: true, action: act('v-ferris', 'Roata mare (15 lei)', '🎡') });
F.push({ id: 'v-carousel', type: 'carousel' as any, gx: 14, gy: 22, w: 2, d: 2, solid: true, action: act('v-carousel', 'Călușeii (8 lei)', '🎠') });
F.push({ id: 'v-bus', type: 'busstop' as any, gx: 20, gy: 11, w: 1, d: 1, solid: true, action: act('v-bus', 'Autobuzul spre oraș', '🚌') });
F.push({ id: 'v-board', type: 'noticeboard' as any, gx: 14, gy: 11, w: 1, d: 1, solid: true, action: act('v-board', 'Avizierul satului (cereri)', '📜') });
F.push({ id: 'v-home', type: 'signpost' as any, gx: 1, gy: 14, w: 1, d: 1, solid: true, action: act('v-home', 'Înapoi acasă', '🏡') });
for (const [x, y] of [[9, 11], [12, 16], [3, 11], [19, 14], [12, 6]]) F.push({ id: `v-lamp${x}-${y}`, type: 'lamppost' as any, gx: x, gy: y, w: 1, d: 1, solid: true });
for (const [x, y] of [[0, 4], [9, 3], [13, 2], [21, 4], [2, 25], [11, 25], [19, 21], [21, 17], [17, 25], [0, 20]]) F.push({ id: `v-tree${x}-${y}`, type: 'tree' as any, gx: x, gy: y, w: 1, d: 1, solid: true });
for (const [x, y] of [[13, 19], [18, 23]]) F.push({ id: `v-bench${x}-${y}`, type: 'bench' as any, gx: x, gy: y, w: 2, d: 1, solid: true, action: act('bench', 'Băncuța', '🌅') });
for (const [x, y] of [[4, 12], [14, 15], [9, 9], [20, 15]]) F.push({ id: `v-fl${x}-${y}`, type: 'flowers' as any, gx: x, gy: y, w: 1, d: 1, solid: false });

AREAS.village = { floor: villageFloor, furniture: F, walls: [], spawn: { x: 2.5, y: 13.2 } };

/** puncte pe strazi pentru satenii care se plimba */
export const VILLAGE_PATHS: Pt[] = [{ x: 1.5, y: 12.5 }, { x: 10.5, y: 12.5 }, { x: 20.5, y: 12.6 }, { x: 10.5, y: 3 }, { x: 10.5, y: 25 }, { x: 13, y: 14.5 }, { x: 7.5, y: 12.6 }, { x: 16, y: 12.5 }];

// ------------------------------------------------------------------ desen
function e(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, st = true, lw = 2) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } }
function quad(c: CanvasRenderingContext2D, pts: Pt[], fill: string, lw = 2) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = O; c.lineWidth = lw; c.stroke(); }

function drawBuilding(c: CanvasRenderingContext2D, b: BuildingDef, t: number, night: number, extra: { open?: boolean }) {
  const { gx, gy, w, d, h } = b;
  isoBox(c, gx, gy, w, d, h, { top: shade(b.wall, 0.95), left: b.wall, right: shade(b.wall, 0.88) });
  // un punct pe fata cu usa (u = 0..1 de-a lungul fetei, z = inaltimea)
  const P = (u: number, z: number) => b.front === 'y' ? iso(gx + u * w, gy + d, z) : iso(gx + w, gy + u * d, z);
  // temelie
  quad(c, [P(0, 0), P(1, 0), P(1, 6), P(0, 6)], shade(b.wall, 0.75), 1.5);
  // ferestre (se aprind noaptea)
  const lit = night > 0.4;
  for (const u of [0.18, 0.82]) {
    quad(c, [P(u - 0.09, 26), P(u + 0.09, 26), P(u + 0.09, 48), P(u - 0.09, 48)], lit ? '#ffe680' : '#bfe8ff');
    const m1 = P(u, 26), m2 = P(u, 48); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(m1.x, m1.y); c.lineTo(m2.x, m2.y); c.stroke();
    quad(c, [P(u - 0.11, 24), P(u + 0.11, 24), P(u + 0.11, 27), P(u - 0.11, 27)], '#fff', 1);
    if (lit) { const g = P(u, 37); const gr = c.createRadialGradient(g.x, g.y, 2, g.x, g.y, 40); gr.addColorStop(0, 'rgba(255,220,120,0.35)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = gr; c.beginPath(); c.arc(g.x, g.y, 40, 0, 7); c.fill(); }
  }
  // usa
  quad(c, [P(0.42, 4), P(0.58, 4), P(0.58, 38), P(0.42, 38)], '#8a5d32');
  const kn = P(0.555, 20); e(c, kn.x, kn.y, 2, 2, '#ffd23f', false);
  // copertina cu dungi (la magazine)
  if (b.awning) {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const u0 = 0.3 + i * 0.4 / n, u1 = 0.3 + (i + 1) * 0.4 / n;
      const a = P(u0, 46), bb = P(u1, 46);
      const out = b.front === 'y' ? { x: -16, y: 8 } : { x: 16, y: 8 };
      quad(c, [a, bb, { x: bb.x + out.x, y: bb.y + out.y + 6 }, { x: a.x + out.x, y: a.y + out.y + 6 }], i % 2 ? '#fff' : b.awning, 1.2);
    }
  }
  // acoperisul in doua ape
  const H = 34;
  if (b.front === 'y') {
    const r0 = iso(gx, gy + d / 2, h + H), r1 = iso(gx + w, gy + d / 2, h + H);
    quad(c, [iso(gx, gy, h), iso(gx + w, gy, h), r1, r0], shade(b.roof, 0.85));
    quad(c, [iso(gx + w, gy, h), iso(gx + w, gy + d, h), r1], shade(b.wall, 0.82)); // fronton
    quad(c, [iso(gx - 0.1, gy + d + 0.12, h - 3), iso(gx + w + 0.1, gy + d + 0.12, h - 3), r1, r0], b.roof);
    for (let i = 1; i < 6; i++) { const a = iso(gx + i * w / 6, gy + d + 0.12, h - 3), bb = iso(gx + i * w / 6, gy + d / 2, h + H); c.strokeStyle = shade(b.roof, 0.8); c.lineWidth = 1.2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(bb.x, bb.y); c.stroke(); }
  } else {
    const r0 = iso(gx + w / 2, gy, h + H), r1 = iso(gx + w / 2, gy + d, h + H);
    quad(c, [iso(gx, gy, h), iso(gx, gy + d, h), r1, r0], shade(b.roof, 0.85));
    quad(c, [iso(gx, gy + d, h), iso(gx + w, gy + d, h), r1], shade(b.wall, 0.92)); // fronton
    quad(c, [iso(gx + w + 0.12, gy - 0.1, h - 3), iso(gx + w + 0.12, gy + d + 0.1, h - 3), r1, r0], b.roof);
    for (let i = 1; i < 5; i++) { const a = iso(gx + w + 0.12, gy + i * d / 5, h - 3), bb = iso(gx + w / 2, gy + i * d / 5, h + H); c.strokeStyle = shade(b.roof, 0.8); c.lineWidth = 1.2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(bb.x, bb.y); c.stroke(); }
  }
  // turnul cu ceas (primaria)
  if (b.tower) {
    isoBox(c, gx + w / 2 - 0.6, gy + d / 2 - 0.6, 1.2, 1.2, 40, { top: '#fff', left: '#dfe8f7', right: '#c8d4ea' }, h + 20);
    const cp = iso(gx + w / 2, gy + d / 2 + 0.6, h + 42); e(c, cp.x, cp.y, 10, 10, '#fff');
    const ang = t * 0.2; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(cp.x, cp.y); c.lineTo(cp.x + Math.cos(ang) * 7, cp.y + Math.sin(ang) * 7); c.moveTo(cp.x, cp.y); c.lineTo(cp.x + Math.cos(ang * 12) * 5, cp.y + Math.sin(ang * 12) * 5); c.stroke();
    const tip = iso(gx + w / 2, gy + d / 2, h + 90); quad(c, [iso(gx + w / 2 - 0.7, gy + d / 2 + 0.7, h + 60), iso(gx + w / 2 + 0.7, gy + d / 2 + 0.7, h + 60), tip], b.roof);
    quad(c, [iso(gx + w / 2 + 0.7, gy + d / 2 - 0.7, h + 60), iso(gx + w / 2 + 0.7, gy + d / 2 + 0.7, h + 60), tip], shade(b.roof, 0.8));
    const fl = iso(gx + w / 2, gy + d / 2, h + 90); c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fl.x, fl.y); c.lineTo(fl.x, fl.y - 18); c.stroke();
    for (const [col, k] of [['#002b7f', 0], ['#fcd116', 1], ['#ce1126', 2]] as const) { c.fillStyle = col; c.fillRect(fl.x + k * 5, fl.y - 18 + Math.sin(t * 4 + k) * 1, 5, 8); }
  }
  // firma mare cu iconita + semnul plutitor de deasupra (se vad de departe)
  const sp = P(0.5, h - 10);
  drawSign(c, sp.x, sp.y, b.sign, b.action.icon, '#fff8ef', O, 11);
  const top = iso(gx + w / 2, gy + d / 2, h + (b.tower ? 120 : 58));
  const hr = (globalThis as any).__hour ?? 12, open = isOpen(b.id, hr);
  drawPOI(c, top.x, top.y, open ? b.action.icon : '🌙', t, open ? b.awning ?? b.roof : '#9aa0ae', extra.open === false);
  if (extra.open === false) { const lp = P(0.5, 20); c.font = '800 9px "Baloo 2", sans-serif'; c.fillStyle = '#fff'; c.strokeStyle = '#e63946'; c.lineWidth = 3; c.textAlign = 'center'; c.fillStyle = '#e63946'; fillTextIcons(c, '🔒 de vânzare', lp.x, lp.y, 9, true); }
}

export function drawVillageType(c: CanvasRenderingContext2D, f: Furn, t: number, night: number, extra: Record<string, boolean>): boolean {
  const { gx, gy, w, d } = f;
  switch (f.type as string) {
    case 'building': {
      const b = BUILDINGS.find(x => x.id === f.id); if (!b) return false;
      drawBuilding(c, b, t, night, { open: f.id === 'v-florarie' ? extra.florarie : f.id === 'v-workshop' ? extra.workshop : undefined });
      return true;
    }
    case 'stalls': {
      for (let i = 0; i < 3; i++) {
        const x = gx + i;
        for (const u of [0.1, 0.85]) isoBox(c, x + u, gy + 0.2, 0.06, 0.06, 46, boxOf('#c98e5f'));
        isoBox(c, x + 0.05, gy + 0.6, 0.9, 0.8, 22, { top: '#f6e7d3', left: '#d9a273', right: '#c48b5c' });
        const col = ['#ffd23f', '#7cc576', '#ff9ab8'][i];
        const a = iso(x, gy + 0.1, 48), b2 = iso(x + 1, gy + 0.1, 48), cc = iso(x + 1, gy + 1.5, 38), dd = iso(x, gy + 1.5, 38);
        quad(c, [a, b2, cc, dd], col, 1.5);
        for (let k = 0; k < 4; k++) { const p = iso(x + 0.2 + k * 0.2, gy + 1, 24); e(c, p.x, p.y - 3, 4, 3.5, ['#e63946', '#ff8c42', '#7cc576', '#ffe066'][(k + i) % 4], true, 1); }
      }
      return true;
    }
    case 'fountain': {
      const p = iso(gx + 0.5, gy + 0.5);
      e(c, p.x, p.y - 6, 34, 16, '#cfc8bb'); e(c, p.x, p.y - 8, 28, 12, '#7ec8f0', false);
      c.fillStyle = '#b8b2a7'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(p.x - 4, p.y - 34, 8, 26, 3); c.fill(); c.stroke();
      e(c, p.x, p.y - 34, 12, 5, '#cfc8bb');
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + t * 0.5; const k = (t * 1.3 + i / 8) % 1; c.fillStyle = `rgba(180,225,255,${1 - k})`; c.beginPath(); c.arc(p.x + Math.cos(a) * k * 22, p.y - 36 - Math.sin(k * Math.PI) * 18 + k * 26, 2.5, 0, 7); c.fill(); }
      return true;
    }
    case 'ferris': {
      const base = iso(gx + 1.5, gy + 1), cx = base.x, cy = base.y - 120, R = 84;
      c.strokeStyle = '#8e8e99'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx - 46, base.y); c.lineTo(cx, cy); c.lineTo(cx + 46, base.y); c.stroke();
      c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 46, base.y); c.lineTo(cx, cy); c.lineTo(cx + 46, base.y); c.stroke();
      const rot = t * 0.25;
      c.strokeStyle = '#ff9ab8'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
      c.strokeStyle = '#ffd6e4'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R * 0.6, 0, 7); c.stroke();
      for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4; c.strokeStyle = '#ffb6c9'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke(); }
      for (let i = 0; i < 8; i++) {
        const a = rot + i * Math.PI / 4, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 8); c.stroke();
        c.fillStyle = ['#ff7aa2', '#7ab8ff', '#ffd23f', '#7cc576'][i % 4]; c.beginPath(); c.roundRect(x - 11, y + 8, 22, 16, 6); c.fill(); c.stroke();
        c.fillStyle = '#ffffffaa'; c.fillRect(x - 7, y + 11, 14, 6);
      }
      e(c, cx, cy, 8, 8, '#ffd23f');
      heartPath(c, cx, cy - 2, 5); c.fillStyle = '#ff4d6d'; c.fill();
      return true;
    }
    case 'carousel': {
      const p = iso(gx + 1, gy + 1), rot = t * 0.8;
      e(c, p.x, p.y - 4, 50, 24, '#f6e7d3'); e(c, p.x, p.y - 10, 48, 22, '#ffd6e4');
      for (let i = 0; i < 6; i++) {
        const a = rot + i * Math.PI / 3, x = p.x + Math.cos(a) * 34, y = p.y - 10 + Math.sin(a) * 16, bob = Math.sin(t * 3 + i) * 4;
        c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 60); c.lineTo(x, y); c.stroke();
        c.fillStyle = ['#fff', '#ffb6c9', '#bde0fe'][i % 3]; c.strokeStyle = O; c.lineWidth = 1.5;
        c.beginPath(); c.ellipse(x, y - 22 + bob, 10, 6, 0, 0, 7); c.fill(); c.stroke();
        c.beginPath(); c.ellipse(x + (Math.cos(a) > 0 ? 8 : -8), y - 30 + bob, 4, 6, 0, 0, 7); c.fill(); c.stroke();
      }
      c.fillStyle = '#c0573e'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(p.x - 3, p.y - 76, 6, 66, 2); c.fill(); c.stroke();
      for (let i = 0; i < 8; i++) { const a0 = i * Math.PI / 4, a1 = (i + 1) * Math.PI / 4; c.beginPath(); c.moveTo(p.x, p.y - 100); c.lineTo(p.x + Math.cos(a0) * 54, p.y - 66 + Math.sin(a0) * 22); c.lineTo(p.x + Math.cos(a1) * 54, p.y - 66 + Math.sin(a1) * 22); c.closePath(); c.fillStyle = i % 2 ? '#fff' : '#ff7aa2'; c.fill(); c.stroke(); }
      e(c, p.x, p.y - 102, 4, 4, '#ffd23f');
      return true;
    }
    case 'noticeboard': {
      for (const u of [0.25, 0.75]) isoBox(c, gx + u - 0.04, gy + 0.45, 0.08, 0.08, 46, boxOf('#8a5d32'));
      const p = iso(gx + 0.5, gy + 0.5, 40);
      c.fillStyle = '#c98e5f'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(p.x - 26, p.y - 22, 52, 34, 4); c.fill(); c.stroke();
      for (const [dx, dy, col] of [[-16, -12, '#fff'], [2, -14, '#ffe680'], [-10, 0, '#ffd6e4'], [8, -2, '#fff']] as const) { c.fillStyle = col; c.fillRect(p.x + dx, p.y + dy, 14, 11); c.fillStyle = '#e63946'; c.beginPath(); c.arc(p.x + dx + 7, p.y + dy + 1, 1.6, 0, 7); c.fill(); }
      drawPOI(c, p.x, p.y - 48, '📜', t, '#ffd23f');
      return true;
    }
    case 'busstop': {
      isoBox(c, gx + 0.2, gy + 0.2, 0.6, 0.12, 50, boxOf('#9aa5ad'));
      isoBox(c, gx + 0.15, gy + 0.15, 0.7, 0.6, 4, boxOf('#5b7fbf'), 50);
      const p = iso(gx + 0.5, gy + 0.5, 64); c.fillStyle = '#ffd23f'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y - 8, 9, 0, 7); c.fill(); c.stroke();
      c.font = '800 9px "Baloo 2", sans-serif'; c.fillStyle = O; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BUS', p.x, p.y - 7.5); c.textBaseline = 'alphabetic';
      return true;
    }
  }
  void tilePath; void w; void d;
  return false;
}
