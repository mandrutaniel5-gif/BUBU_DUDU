// Padurea (Capitolul 2): brazi, ciuperci, mure, lac cu pescuit, animale.
import { AREAS, type Floor, type Furn } from './map';
import { iso, isoBox, boxOf } from './iso';
import { heartPath } from '../char/draw';
import { drawTractorIso, drawParked } from './vehicles';
import { ORIGIN } from './layout';
import { leaf, fruit, isWinter } from './seasonlook';

/** padurea sta in lume la nord de casa: coordonatele de mai jos sunt cele vechi (locale), plus OX/OY */
const OX = ORIGIN.forest.x, OY = ORIGIN.forest.y;

const O = '#3a2a22';
const act = (id: string, label: string, icon: string) => ({ id, label, icon });

function forestFloor(wx: number, wy: number): Floor {
  const x = wx - OX, y = wy - OY;
  if (x >= 13 && x <= 17 && y >= 6 && y <= 10 && !(x === 13 && y === 6) && !(x === 17 && y === 10)) return 'water';
  if (x === 4 && y >= 14) return 'path';
  if (y >= 23) return 'path';
  return 'forest';
}

const F: Furn[] = [];
const rnd = (i: number) => { const s = Math.sin(i * 91.7 + 13.1) * 43758.5; return s - Math.floor(s); };
// brazi si foioase (taiere)
const treeSpots: [number, number][] = [[1, 2], [3, 1], [6, 2], [8, 1], [10, 3], [2, 6], [5, 5], [8, 6], [1, 10], [4, 9], [7, 10], [10, 12], [2, 14], [7, 14], [12, 16], [15, 14], [18, 3], [20, 6], [19, 12], [9, 18], [14, 19], [18, 18], [20, 21], [1, 19], [11, 8]];
treeSpots.forEach(([x, y], i) => F.push({ id: 'f-tree' + i, type: (i % 3 ? 'pine' : 'tree') as any, gx: x, gy: y, w: 1, d: 1, solid: true, action: act('chop', 'Taie lemne', '🪓') }));
// ciuperci si mure
([[3, 4], [9, 9], [5, 12], [16, 16], [11, 20], [19, 9], [2, 17]] as [number, number][]).forEach(([x, y], i) => F.push({ id: 'f-mush' + i, type: 'mushroom' as any, gx: x, gy: y, w: 1, d: 1, solid: false, action: act('mushroom', 'Culege ciuperci', '🍄') }));
([[6, 8], [12, 4], [17, 12], [8, 16], [3, 21]] as [number, number][]).forEach(([x, y], i) => F.push({ id: 'f-berry' + i, type: 'berrybush' as any, gx: x, gy: y, w: 1, d: 1, solid: true, action: act('berries', 'Culege mure', '🫐') }));
// bolovani: piatra pentru pod, felinare, drum si magazin (in curte sunt doar 5); se refac in 2,5 minute
([[12, 1], [15, 3], [3, 7], [13, 12], [9, 14], [20, 15], [6, 19], [16, 21]] as [number, number][]).forEach(([x, y], i) => F.push({ id: 'f-rock' + i, type: 'rock' as any, gx: x, gy: y, w: 1, d: 1, solid: true, action: act('mine', 'Sparge piatra', '⛏️') }));
// lacul: podetul de pescuit
F.push({ id: 'f-pier', type: 'pier' as any, gx: 15, gy: 11, w: 1, d: 1, solid: false, action: act('fish', 'Pescuiește', '🎣') });
F.push({ id: 'f-logs', type: 'logpile' as any, gx: 7, gy: 24, w: 1, d: 1, solid: true });
void rnd;
for (const f of F) { f.gx += OX; f.gy += OY; }

AREAS.forest = { floor: forestFloor, furniture: F, walls: [], spawn: { x: OX + 4.5, y: OY + 22.5 } };

// ------------------------------------------------------------------ desen
function e(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, st = true, lw = 2) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fillStyle = fill; ctx.fill(); if (st) { ctx.strokeStyle = O; ctx.lineWidth = lw; ctx.stroke(); } }

export function drawTractor(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, flip = 1, logs = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * flip, s); ctx.lineJoin = 'round';
  const bob = Math.sin(t * 12) * 0.8;
  // remorca cu busteni
  ctx.fillStyle = '#c98e5f'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-70, -26, 38, 16, 3); ctx.fill(); ctx.stroke();
  for (let i = 0; i < Math.min(6, logs); i++) { const lx = -66 + (i % 3) * 11, ly = -30 - Math.floor(i / 3) * 8; e(ctx, lx + 5, ly, 6, 4.5, '#a0703f', true, 1.5); e(ctx, lx + 5, ly, 3, 2.2, '#e7c08f', false); }
  e(ctx, -51, -6, 7, 7, '#333'); e(ctx, -51, -6, 3, 3, '#999', false);
  ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-32, -14); ctx.lineTo(-24, -14); ctx.stroke();
  // corpul tractorului
  ctx.fillStyle = '#e63946'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-26, -34 + bob, 50, 22, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c1121f'; ctx.beginPath(); ctx.roundRect(-24, -56 + bob, 22, 24, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#bde7ff'; ctx.beginPath(); ctx.roundRect(-21, -52 + bob, 16, 12, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#555'; ctx.beginPath(); ctx.roundRect(14, -50 + bob, 5, 16, 2); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 2; i++) { const k = (t * 1.5 + i / 2) % 1; ctx.globalAlpha = 0.6 * (1 - k); e(ctx, 16 + k * 10, -54 - k * 22, 4 + k * 6, 4 + k * 6, '#ddd', false); ctx.globalAlpha = 1; }
  heartPath(ctx, 6, -24 + bob, 4); ctx.fillStyle = '#fff'; ctx.fill();
  // roti (spate mare, fata mica)
  for (const [wx, r] of [[-14, 14], [16, 9]] as const) { e(ctx, wx, -4, r, r, '#2b2b33'); e(ctx, wx, -4, r * 0.45, r * 0.45, '#ffd23f'); ctx.save(); ctx.translate(wx, -4); ctx.rotate(t * 6); ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.45, 0); ctx.stroke(); } ctx.restore(); }
  ctx.restore();
}

export function drawForestType(ctx: CanvasRenderingContext2D, f: Furn, t: number, depleted: boolean): boolean {
  const { gx, gy } = f;
  const c = iso(gx + 0.5, gy + 0.5);
  switch (f.type as string) {
    case 'pine': {
      if (depleted) { isoBox(ctx, gx + 0.38, gy + 0.38, 0.24, 0.24, 8, { top: '#e7c08f', left: '#a0703f', right: '#8a5d32' }); return true; }
      isoBox(ctx, gx + 0.42, gy + 0.42, 0.16, 0.16, 18, boxOf('#8a5d32'));
      const sw = Math.sin(t * 0.9 + gx) * 1.5;
      const snow = isWinter();
      for (let i = 0; i < 3; i++) { const y0 = c.y - 16 - i * 22, w = 30 - i * 8; ctx.beginPath(); ctx.moveTo(c.x - w + sw * i, y0); ctx.lineTo(c.x + sw * (i + 1), y0 - 34); ctx.lineTo(c.x + w + sw * i, y0); ctx.closePath(); ctx.fillStyle = snow ? ['#2f7a4c', '#3a8a58', '#46996a'][i] : ['#3f8f5a', '#4aa267', '#57b574'][i]; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke();
        // iarna: zapada pe fiecare etaj al bradului
        if (snow) { const tx = c.x + sw * (i + 1), ty = y0 - 34; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + w * 0.55, ty + 34 * 0.55); ctx.quadraticCurveTo(tx + w * 0.2, ty + 34 * 0.42, tx, ty + 34 * 0.5); ctx.quadraticCurveTo(tx - w * 0.2, ty + 34 * 0.42, tx - w * 0.55, ty + 34 * 0.55); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#b9c9dc'; ctx.lineWidth = 1.2; ctx.stroke(); } }
      return true;
    }
    case 'mushroom': {
      if (depleted) { e(ctx, c.x, c.y, 6, 3, '#7a6a4a', false); return true; }
      for (const [dx, dy, s, col] of [[-8, 2, 1, '#e63946'], [7, -2, 0.8, '#e63946'], [0, 6, 0.65, '#c98e5f']] as const) {
        ctx.fillStyle = '#fff4e0'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(c.x + dx - 3 * s, c.y + dy - 10 * s, 6 * s, 10 * s, 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(c.x + dx, c.y + dy - 10 * s, 9 * s, 6 * s, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
        if (col === '#e63946') { ctx.fillStyle = '#fff'; for (const k of [-4, 0, 4]) { ctx.beginPath(); ctx.arc(c.x + dx + k * s, c.y + dy - 12.5 * s + Math.abs(k) * 0.4, 1.5 * s, 0, 7); ctx.fill(); } }
      }
      return true;
    }
    case 'berrybush': {
      ([[-10, -8, 12], [10, -8, 12], [0, -18, 13]] as const).forEach(([dx, dy, r], i) => e(ctx, c.x + dx, c.y + dy, r, r * 0.85, leaf('#4f9d4a', i + gx)));
      if (!depleted && fruit()) for (let i = 0; i < 9; i++) e(ctx, c.x - 14 + (i * 7) % 28, c.y - 22 + (i * 5) % 18, 2.6, 2.6, '#4b3b8f', true, 1);
      return true;
    }
    case 'pier': {
      for (let i = 0; i < 3; i++) isoBox(ctx, gx + 0.1, gy - 0.4 - i * 0.3, 0.8, 0.28, 4, boxOf('#c98e5f'), 2);
      for (const [u, v] of [[0.12, -0.4], [0.82, -0.4], [0.12, -1.2], [0.82, -1.2]]) isoBox(ctx, gx + u, gy + v, 0.08, 0.08, 10, boxOf('#8a5d32'));
      // undita sprijinita
      const a = iso(gx + 0.7, gy - 0.6, 8); ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + 30, a.y - 30); ctx.stroke();
      ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x + 30, a.y - 30); ctx.lineTo(a.x + 40, a.y + 10); ctx.stroke();
      e(ctx, a.x + 40, a.y + 10 + Math.sin(t * 3) * 1.5, 3, 3, '#e63946', true, 1);
      return true;
    }
    case 'parkedbike': { const p = iso(gx + 0.5, gy + 0.6); drawParked(ctx, 'bike', p.x, p.y, t); return true; }
    case 'parkedscooter': { const p = iso(gx + 0.5, gy + 0.6); drawParked(ctx, 'scooter', p.x, p.y, t); return true; }
    case 'tractor': drawTractorIso(ctx, gx, gy, t, (globalThis as any).__trailerLogs ?? 0); return true;
    case 'logpile': { for (let i = 0; i < 6; i++) { const p = iso(gx + 0.3 + (i % 3) * 0.2, gy + 0.5, 4 + Math.floor(i / 3) * 9); e(ctx, p.x, p.y, 7, 5, '#a0703f'); e(ctx, p.x, p.y, 3.5, 2.5, '#e7c08f', false); } return true; }
  }
  return false;
}

// ------------------------------------------------------------------ animalele padurii
export type CritterKind = 'deer' | 'squirrel' | 'hedgehog' | 'bird';
export interface Critter { id: number; kind: CritterKind; x: number; y: number; tx: number; ty: number; t: number; flip: 1 | -1; friend: number; flee: number }
export const CRITTER_NAMES: Record<CritterKind, string> = { deer: 'Căprioara', squirrel: 'Veverița', hedgehog: 'Ariciul', bird: 'Vrăbiuța' };

export function drawCritter(ctx: CanvasRenderingContext2D, c: Critter, x: number, y: number, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(c.flip, 1); ctx.lineJoin = 'round';
  const moving = Math.hypot(c.tx - c.x, c.ty - c.y) > 0.05;
  const hop = moving ? Math.abs(Math.sin(t * 12)) * 3 : 0;
  ctx.fillStyle = 'rgba(60,35,30,0.18)'; ctx.beginPath(); ctx.ellipse(0, 1, 12, 4, 0, 0, 7); ctx.fill();
  ctx.translate(0, -hop);
  switch (c.kind) {
    case 'deer':
      for (const lx of [-8, -3, 5, 10]) { ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, -14); ctx.lineTo(lx + (moving ? Math.sin(t * 12 + lx) * 2 : 0), 0); ctx.stroke(); }
      e(ctx, 0, -18, 15, 8, '#c08552'); for (const [sx, sy] of [[-6, -20], [0, -22], [5, -19]]) e(ctx, sx, sy, 1.6, 1.4, '#fff', false);
      e(ctx, 14, -28, 7, 6, '#c08552'); e(ctx, 19, -26, 3, 2, '#3a2418', false); e(ctx, 13, -30, 1.6, 1.6, '#1f1512', false);
      ctx.strokeStyle = '#8a5d32'; ctx.lineWidth = 2; for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(12 + k * 2, -33); ctx.lineTo(10 + k * 5, -42); ctx.lineTo(7 + k * 8, -44); ctx.moveTo(10 + k * 5, -42); ctx.lineTo(13 + k * 5, -47); ctx.stroke(); }
      e(ctx, -15, -20, 3, 2.5, '#fff');
      break;
    case 'squirrel':
      ctx.save(); ctx.translate(-8, -10); ctx.rotate(-0.5 + Math.sin(t * 4) * 0.1); e(ctx, 0, -8, 6, 12, '#e0803c'); ctx.restore();
      e(ctx, 2, -8, 7, 7, '#f08a4b'); e(ctx, 7, -15, 5, 5, '#f08a4b'); e(ctx, 9, -16, 1.3, 1.3, '#1f1512', false);
      ctx.beginPath(); ctx.moveTo(5, -19); ctx.lineTo(6, -24); ctx.lineTo(8, -19); ctx.fillStyle = '#f08a4b'; ctx.fill(); ctx.stroke();
      e(ctx, 6, -6, 2.5, 2.5, '#a0703f', true, 1); // ghinda
      break;
    case 'hedgehog':
      ctx.fillStyle = '#7a5a4a'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); for (let a = 0; a <= 14; a++) { const ang = Math.PI + a / 14 * Math.PI; const r = a % 2 ? 11 : 15; ctx.lineTo(Math.cos(ang) * r, -6 + Math.sin(ang) * r * 0.8); } ctx.closePath(); ctx.fill(); ctx.stroke();
      e(ctx, 10, -5, 6, 5, '#e6c79c'); e(ctx, 15, -5, 1.6, 1.6, '#1f1512', false); e(ctx, 11, -7, 1.2, 1.2, '#1f1512', false);
      break;
    case 'bird':
      e(ctx, 0, -8, 7, 6, '#a0784a'); e(ctx, 5, -13, 4.5, 4.5, '#a0784a'); e(ctx, 6, -14, 1.2, 1.2, '#1f1512', false);
      ctx.fillStyle = '#ffb703'; ctx.beginPath(); ctx.moveTo(9, -13); ctx.lineTo(13, -12); ctx.lineTo(9, -11); ctx.fill();
      ctx.save(); ctx.translate(-1, -9); ctx.rotate(moving ? Math.sin(t * 25) * 0.6 : 0.2); e(ctx, -3, 0, 5, 3, '#8a5d32'); ctx.restore();
      break;
  }
  if (c.friend >= 1) { heartPath(ctx, 0, -40 - Math.sin(t * 3) * 2, 5); ctx.fillStyle = '#ff4d6d'; ctx.fill(); }
  ctx.restore();
}
