import { fillTextIcons } from '../ui/icons';
// Constructie "gen Minecraft": resurse, catalog de obiecte, desenul lor.
import { iso, isoBox, boxOf, tilePath, type Pt } from './iso';
import { heartPath } from '../char/draw';
import { drawItem } from './items';
import { drawWell } from './garden';
import type { Furn } from './map';

export type Res = 'wood' | 'stone' | 'flower' | 'soil';
export const RES_INFO: Record<Res, { icon: string; label: string }> = {
  wood: { icon: '🪵', label: 'Lemn' }, stone: { icon: '🪨', label: 'Piatră' }, flower: { icon: '🌸', label: 'Flori' }, soil: { icon: '🟫', label: 'Pământ' },
};

export interface BuildItem {
  type: string; label: string; icon: string; w: number; d: number; solid: boolean;
  cost: Partial<Record<Res, number>>; action?: { id: string; label: string; icon: string }; floor?: boolean; coop?: boolean;
}

export const CATALOG: BuildItem[] = [
  { type: 'soilplot', label: 'Răzor nou de grădină', icon: '🟫', w: 1, d: 1, solid: false, floor: true, cost: { soil: 1 } },
  { type: 'stonepath', label: 'Alee de piatră', icon: '🪨', w: 1, d: 1, solid: false, floor: true, cost: { stone: 1 } },
  { type: 'fence', label: 'Gărduleț', icon: '🪵', w: 1, d: 1, solid: true, cost: { wood: 1 } },
  { type: 'pot', label: 'Ghiveci cu flori', icon: '🌷', w: 1, d: 1, solid: true, cost: { stone: 1, flower: 2 } },
  { type: 'lamppost', label: 'Felinar', icon: '🏮', w: 1, d: 1, solid: true, cost: { wood: 1, stone: 2 } },
  { type: 'sapling', label: 'Puiet de copac', icon: '🌳', w: 1, d: 1, solid: true, cost: { flower: 1 }, action: { id: 'chop', label: 'Taie lemne', icon: '🪓' } },
  { type: 'flowerbed', label: 'Strat de flori', icon: '🌼', w: 1, d: 1, solid: false, floor: true, cost: { flower: 3 }, action: { id: 'pick', label: 'Culege flori', icon: '🌸' } },
  { type: 'swing', label: 'Leagăn pentru doi', icon: '🎠', w: 2, d: 1, solid: true, cost: { wood: 6, stone: 2 }, action: { id: 'swing', label: 'Leagănul', icon: '🎠' }, coop: true },
  { type: 'snowman', label: 'Om de zăpadă', icon: '⛄', w: 1, d: 1, solid: true, cost: { stone: 2, flower: 1 } },
  { type: 'gazebo', label: 'Foișor romantic', icon: '⛩️', w: 2, d: 2, solid: true, cost: { wood: 14, stone: 8, flower: 4 }, action: { id: 'gazebo', label: 'Foișorul', icon: '💞' }, coop: true },
  { type: 'heartstone', label: 'Inimă din pietre', icon: '💗', w: 1, d: 1, solid: false, floor: true, cost: { stone: 3, flower: 2 } },
];

/** noduri de resurse (copaci, pietre, flori salbatice) */
export const RESOURCE_NODES: Furn[] = [
  { id: 'rock1', type: 'rock', gx: 14, gy: 6, w: 1, d: 1, solid: true, action: { id: 'mine', label: 'Sparge piatra', icon: '⛏️' } },
  { id: 'rock2', type: 'rock', gx: 0, gy: 3, w: 1, d: 1, solid: true, action: { id: 'mine', label: 'Sparge piatra', icon: '⛏️' } },
  { id: 'rock3', type: 'rock', gx: 12, gy: 15, w: 1, d: 1, solid: true, action: { id: 'mine', label: 'Sparge piatra', icon: '⛏️' } },
  { id: 'wild1', type: 'wildflower', gx: 4, gy: 15, w: 1, d: 1, solid: false, action: { id: 'pick', label: 'Culege flori', icon: '🌸' } },
  { id: 'wild2', type: 'wildflower', gx: 15, gy: 11, w: 1, d: 1, solid: false, action: { id: 'pick', label: 'Culege flori', icon: '🌸' } },
  { id: 'wild3', type: 'wildflower', gx: 0, gy: 12, w: 1, d: 1, solid: false, action: { id: 'pick', label: 'Culege flori', icon: '🌸' } },
  { id: 'wild4', type: 'wildflower', gx: 9, gy: 19, w: 1, d: 1, solid: false, action: { id: 'pick', label: 'Culege flori', icon: '🌸' } },
  { id: 'wild5', type: 'wildflower', gx: 19, gy: 5, w: 1, d: 1, solid: false, action: { id: 'pick', label: 'Culege flori', icon: '🌸' } },
  { id: 'wild6', type: 'wildflower', gx: 12, gy: 22, w: 1, d: 1, solid: false, action: { id: 'pick', label: 'Culege flori', icon: '🌸' } },
  { id: 'wild7', type: 'wildflower', gx: 17, gy: 26, w: 1, d: 1, solid: false, action: { id: 'pick', label: 'Culege flori', icon: '🌸' } },
  { id: 'wild8', type: 'wildflower', gx: 16, gy: 4, w: 1, d: 1, solid: false, action: { id: 'pick', label: 'Culege flori', icon: '🌸' } },
  { id: 'rock4', type: 'rock', gx: 20, gy: 14, w: 1, d: 1, solid: true, action: { id: 'mine', label: 'Sparge piatra', icon: '⛏️' } },
  { id: 'rock5', type: 'rock', gx: 2, gy: 20, w: 1, d: 1, solid: true, action: { id: 'mine', label: 'Sparge piatra', icon: '⛏️' } },
  { id: 'tree5', type: 'tree', gx: 18, gy: 2, w: 1, d: 1, solid: true, action: { id: 'chop', label: 'Taie lemne', icon: '🪓' } },
  { id: 'tree6', type: 'tree', gx: 20, gy: 9, w: 1, d: 1, solid: true, action: { id: 'chop', label: 'Taie lemne', icon: '🪓' } },
  { id: 'tree7', type: 'tree', gx: 13, gy: 20, w: 1, d: 1, solid: true, action: { id: 'chop', label: 'Taie lemne', icon: '🪓' } },
  { id: 'tree8', type: 'tree', gx: 7, gy: 20, w: 1, d: 1, solid: true, action: { id: 'chop', label: 'Taie lemne', icon: '🪓' } },
];

const O = '#3a2a22';
function ell(ctx: CanvasRenderingContext2D, p: Pt, rx: number, ry: number, fill: string, stroke = true) {
  ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke(); }
}

/** deseneaza tipurile noi; intoarce false daca nu stie tipul */
export function drawBuildType(ctx: CanvasRenderingContext2D, f: Furn, t: number, night: number, depleted: boolean): boolean {
  const { gx, gy, w, d } = f;
  switch (f.type) {
    case 'gateway': case 'soilplot': return true;
    case 'well': drawWell(ctx, gx, gy, t); return true;
    case 'laptop': {
      for (const [u, v] of [[0.15, 0.2], [0.75, 0.2], [0.15, 0.75], [0.75, 0.75]]) isoBox(ctx, gx + u, gy + v, 0.08, 0.08, 22, boxOf('#c98e5f'));
      isoBox(ctx, gx + 0.08, gy + 0.12, 0.84, 0.76, 4, boxOf('#e7b98a'), 22);
      isoBox(ctx, gx + 0.3, gy + 0.3, 0.4, 0.35, 2, boxOf('#c0c6cc'), 26);
      const a = iso(gx + 0.3, gy + 0.32, 28), b = iso(gx + 0.7, gy + 0.32, 28), c2 = iso(gx + 0.7, gy + 0.32, 46), d2 = iso(gx + 0.3, gy + 0.32, 46);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(d2.x, d2.y); ctx.closePath(); ctx.fillStyle = '#3b4250'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke();
      const m = iso(gx + 0.5, gy + 0.32, 37); heartPath(ctx, m.x, m.y + 2, 4 + Math.sin(t * 3)); ctx.fillStyle = '#ff7aa2'; ctx.fill();
      return true;
    }
    case 'signpost': {
      isoBox(ctx, gx + 0.45, gy + 0.45, 0.1, 0.1, 50, boxOf('#a0703f'));
      const p = iso(gx + 0.5, gy + 0.5, 46);
      // sageata arata spre unde duce drumul (din curte, satul e la stanga, pe drum)
      const dir = f.id === 'gateway' ? -1 : 1;
      ctx.fillStyle = '#e7c08f'; ctx.strokeStyle = O; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x - 30 * dir, p.y - 9); ctx.lineTo(p.x + 20 * dir, p.y - 9); ctx.lineTo(p.x + 31 * dir, p.y); ctx.lineTo(p.x + 20 * dir, p.y + 9); ctx.lineTo(p.x - 30 * dir, p.y + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.font = '800 9px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(f.id === 'v-home' ? 'Spre casă 🏡' : f.id === 'a-exit' ? 'Ieșire' : 'Spre sat 🏘️', p.x + 2 * dir, p.y + 0.5); ctx.textBaseline = 'alphabetic';
      return true;
    }
    case 'fireplace': {
      const fuel = (globalThis as any).__fireFuel ?? 0;
      isoBox(ctx, gx + 0.1, gy + 0.1, 0.8, 0.8, 40, { top: '#e8e2d8', left: '#c0573e', right: '#a84a35' });
      for (let r = 0; r < 4; r++) { const a = iso(gx + 0.1, gy + 0.9, 6 + r * 9), b = iso(gx + 0.9, gy + 0.9, 6 + r * 9); ctx.strokeStyle = '#8e3d2b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      // usita focului (pe fata stanga)
      const c = iso(gx + 0.5, gy + 0.9, 16);
      ctx.fillStyle = fuel > 0 ? '#ff8c42' : '#2a1a1a'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(c.x, c.y, 10, 8, 0, 0, 7); ctx.fill(); ctx.stroke();
      if (fuel > 0) for (let i = 0; i < 3; i++) { const fh = 5 + Math.sin(t * 14 + i * 2) * 2 + fuel / 30; ctx.fillStyle = i === 1 ? '#ffd23f' : '#ff6b3d'; ctx.beginPath(); ctx.moveTo(c.x - 6 + i * 6 - 3, c.y + 5); ctx.quadraticCurveTo(c.x - 6 + i * 6, c.y + 5 - fh * 2, c.x - 6 + i * 6 + 3, c.y + 5); ctx.fill(); }
      // hornul
      isoBox(ctx, gx + 0.35, gy + 0.35, 0.3, 0.3, 46, boxOf('#8e8e99'), 40);
      if (fuel > 0) for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; const p = iso(gx + 0.5, gy + 0.5, 90 + k * 40); ctx.globalAlpha = 0.5 * (1 - k); ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(p.x + k * 10, p.y, 5 + k * 8, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      if (fuel > 0) { const g2 = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, 120); g2.addColorStop(0, `rgba(255,150,60,${0.18 + night * 0.25})`); g2.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(c.x, c.y, 120, 0, 7); ctx.fill(); }
      // bara de combustibil
      const p = iso(gx + 0.5, gy + 0.5, 96);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(p.x - 18, p.y - 4, 36, 7, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = fuel > 25 ? '#ff6b3d' : '#e63946'; ctx.beginPath(); ctx.roundRect(p.x - 17, p.y - 3, 34 * Math.min(1, fuel / 100), 5, 2); ctx.fill();
      return true;
    }
    case 'shed': {
      isoBox(ctx, gx + 0.05, gy + 0.05, 0.9, 0.9, 40, { top: '#c98e5f', left: '#e7c08f', right: '#d9a273' });
      const a = iso(gx + 0.05, gy + 0.05, 40), b = iso(gx + 0.95, gy + 0.05, 40), c2 = iso(gx + 0.95, gy + 0.95, 40), d2 = iso(gx + 0.05, gy + 0.95, 40), top = iso(gx + 0.5, gy + 0.5, 70);
      for (const [p, q, col] of [[d2, c2, '#b5543c'], [b, c2, '#9e4330']] as const) { ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke(); }
      void a;
      const dr = iso(gx + 0.5, gy + 0.95, 14); ctx.fillStyle = '#8a5d32'; ctx.strokeStyle = O; ctx.beginPath(); ctx.roundRect(dr.x - 7, dr.y - 14, 14, 24, 3); ctx.fill(); ctx.stroke();
      // stiva de lemne langa magazie
      for (let i = 0; i < 3; i++) { const p = iso(gx + 1.05, gy + 0.3 + i * 0.2, 4); ell(ctx, p, 5, 4, '#c98e5f'); ell(ctx, p, 2.5, 2, '#e7c08f', false); }
      return true;
    }
    case 'stand': {
      const S = (globalThis as any).__stand ?? {};
      if (S.broken) {
        // scanduri cazute, stalpi strambi
        isoBox(ctx, gx + 0.1, gy + 0.2, 0.06, 0.06, 40, boxOf('#a0703f'));
        isoBox(ctx, gx + w - 0.2, gy + 0.2, 0.06, 0.06, 22, boxOf('#a0703f'));
        isoBox(ctx, gx + 0.05, gy + 0.3, w - 0.1, 0.6, 12, { top: '#c9a57c', left: '#a87a50', right: '#946a44' });
        for (const [u, v, a] of [[0.4, 0.95, 0.3], [1.3, 1.05, -0.4], [0.9, 0.6, 0.1]]) { const p = iso(gx + u, gy + v, 13); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.fillStyle = '#c98e5f'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.fillRect(-16, -3, 32, 6); ctx.strokeRect(-16, -3, 32, 6); ctx.restore(); }
        const sg = iso(gx + w / 2, gy + 0.9, 18); ctx.fillStyle = '#fff8ef'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.save(); ctx.translate(sg.x, sg.y); ctx.rotate(0.25); ctx.beginPath(); ctx.roundRect(-26, -7, 52, 14, 3); ctx.fill(); ctx.stroke();
        ctx.font = '800 8px "Baloo 2", sans-serif'; ctx.fillStyle = '#e63946'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; fillTextIcons(ctx, 'STRICATĂ 🔨', 0, 0, 8); ctx.restore(); ctx.textBaseline = 'alphabetic';
        return true;
      }
      if (!S.open) {
        for (const u of [0.1, w - 0.15]) isoBox(ctx, gx + u, gy + 0.2, 0.06, 0.06, 64, boxOf('#c98e5f'));
        isoBox(ctx, gx + 0.05, gy + 0.3, w - 0.1, 0.6, 26, { top: '#f6e7d3', left: '#d9a273', right: '#c48b5c' });
        const a1 = iso(gx, gy + 0.12, 62), b1 = iso(gx + w, gy + 0.12, 62); // copertina stransa
        ctx.strokeStyle = O; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(b1.x, b1.y); ctx.stroke(); ctx.strokeStyle = '#ff9ab8'; ctx.lineWidth = 4; ctx.stroke();
        const sg = iso(gx + w / 2, gy + 0.9, 12); ctx.fillStyle = '#fff8ef'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(sg.x - 24, sg.y - 7, 48, 14, 4); ctx.fill(); ctx.stroke();
        ctx.font = '800 8px "Baloo 2", sans-serif'; ctx.fillStyle = '#7a5a4a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ÎNCHIS', sg.x, sg.y); ctx.textBaseline = 'alphabetic';
        return true;
      }
      for (const u of [0.1, w - 0.15]) isoBox(ctx, gx + u, gy + 0.2, 0.06, 0.06, 64, boxOf('#c98e5f'));
      isoBox(ctx, gx + 0.05, gy + 0.3, w - 0.1, 0.6, 26, { top: '#f6e7d3', left: '#d9a273', right: '#c48b5c' });
      // copertina cu dungi
      const n = 6;
      for (let i = 0; i < n; i++) {
        const p0 = iso(gx + i / n * w, gy + 0.1, 66), p1 = iso(gx + (i + 1) / n * w, gy + 0.1, 66), p2 = iso(gx + (i + 1) / n * w, gy + 0.9, 54), p3 = iso(gx + i / n * w, gy + 0.9, 54);
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath(); ctx.fillStyle = i % 2 ? '#fff' : '#ff9ab8'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ['flower:2', 'veg:1', 'flower:0', 'veg:2'].forEach((e, i) => { const p = iso(gx + 0.3 + i * 0.45, gy + 0.6, 30); drawItem(ctx, e, p.x, p.y - 4, 20, t); });
      const sg = iso(gx + w / 2, gy + 0.9, 12); ctx.fillStyle = '#fff8ef'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(sg.x - 30, sg.y - 7, 60, 14, 4); ctx.fill(); ctx.stroke();
      ctx.font = '800 8px "Baloo 2", sans-serif'; ctx.fillStyle = '#ff4d6d'; ctx.fillText('Taraba lui Bubu', sg.x, sg.y); ctx.textBaseline = 'alphabetic';
      return true;
    }
    case 'rock': {
      if (depleted) { ell(ctx, iso(gx + 0.5, gy + 0.5), 10, 5, '#b8b2a7'); return true; }
      const c = iso(gx + 0.5, gy + 0.5);
      ctx.fillStyle = '#a9a49b'; ctx.strokeStyle = O; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c.x - 20, c.y + 2); ctx.lineTo(c.x - 14, c.y - 16); ctx.lineTo(c.x + 2, c.y - 24); ctx.lineTo(c.x + 18, c.y - 12); ctx.lineTo(c.x + 20, c.y + 4); ctx.quadraticCurveTo(c.x, c.y + 10, c.x - 20, c.y + 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9c4ba'; ctx.beginPath(); ctx.moveTo(c.x - 12, c.y - 12); ctx.lineTo(c.x + 2, c.y - 20); ctx.lineTo(c.x + 4, c.y - 10); ctx.closePath(); ctx.fill();
      ell(ctx, { x: c.x + 8, y: c.y - 4 }, 2, 2, '#7cc576', false);
      return true;
    }
    case 'wildflower': case 'flowerbed': {
      if (f.type === 'flowerbed') { tilePath(ctx, gx + 0.1, gy + 0.1, 0.8, 0.8, 0.4); ctx.fillStyle = '#a87a50'; ctx.fill(); }
      const n = depleted ? 0 : f.type === 'flowerbed' ? 9 : 6;
      for (let i = 0; i < n; i++) {
        const p = iso(gx + 0.2 + (i * 0.37) % 0.65, gy + 0.2 + (i * 0.53) % 0.65);
        const sw = Math.sin(t * 2 + i) * 1.5;
        ctx.strokeStyle = '#3d8b3d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + sw, p.y - 10); ctx.stroke();
        for (let k = 0; k < 5; k++) { const a = k * 1.256 + i; ctx.beginPath(); ctx.arc(p.x + sw + Math.cos(a) * 3, p.y - 12 + Math.sin(a) * 3, 2.4, 0, 7); ctx.fillStyle = ['#ff7aa2', '#ffd23f', '#c77dff', '#fff', '#ff8c42'][i % 5]; ctx.fill(); }
        ell(ctx, { x: p.x + sw, y: p.y - 12 }, 1.6, 1.6, '#ffb703', false);
      }
      if (depleted) for (let i = 0; i < 4; i++) { const p = iso(gx + 0.3 + i * 0.12, gy + 0.5); ctx.strokeStyle = '#3d8b3d'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 4); ctx.stroke(); }
      return true;
    }
    case 'stonepath': {
      for (const [u, v, r] of [[0.3, 0.3, 9], [0.7, 0.35, 8], [0.35, 0.72, 8], [0.72, 0.7, 9]]) { const p = iso(gx + u, gy + v); ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r / 2, 0, 0, 7); ctx.fillStyle = '#cfc8bb'; ctx.fill(); ctx.strokeStyle = '#9a9184'; ctx.lineWidth = 1.5; ctx.stroke(); }
      return true;
    }
    case 'heartstone': {
      const c = iso(gx + 0.5, gy + 0.5);
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const hx = 16 * Math.sin(a) ** 3, hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); ell(ctx, { x: c.x + hx * 1.2, y: c.y + hy * 0.55 }, 3.5, 2.2, '#cfc8bb'); }
      ell(ctx, { x: c.x, y: c.y - 2 }, 3, 3, '#ff7aa2', false);
      return true;
    }
    case 'fence': {
      isoBox(ctx, gx + 0.1, gy + 0.45, 0.8, 0.1, 18, boxOf('#e7c08f'), 6);
      for (const u of [0.15, 0.5, 0.85]) { isoBox(ctx, gx + u - 0.05, gy + 0.45, 0.1, 0.1, 30, boxOf('#d9a273')); const p = iso(gx + u, gy + 0.5, 32); ell(ctx, p, 3, 2, '#d9a273'); }
      return true;
    }
    case 'pot': {
      isoBox(ctx, gx + 0.3, gy + 0.3, 0.4, 0.4, 18, boxOf('#e07a5f'));
      const c = iso(gx + 0.5, gy + 0.5, 18);
      for (let i = 0; i < 5; i++) { const a = i * 1.256 + t * 0.2; ell(ctx, { x: c.x + Math.cos(a) * 7, y: c.y - 10 + Math.sin(a) * 4 }, 5, 5, ['#ff7aa2', '#ffd23f', '#c77dff', '#ff8fab', '#fff'][i]); }
      ell(ctx, { x: c.x, y: c.y - 10 }, 3, 3, '#ffb703', false);
      return true;
    }
    case 'lamppost': {
      isoBox(ctx, gx + 0.45, gy + 0.45, 0.1, 0.1, 62, boxOf('#5a5a66'));
      const p = iso(gx + 0.5, gy + 0.5, 62);
      ctx.fillStyle = night > 0.3 ? '#fff3a8' : '#fff9e0'; ctx.strokeStyle = O; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(p.x - 8, p.y - 18, 16, 18, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5a5a66'; ctx.beginPath(); ctx.moveTo(p.x - 11, p.y - 18); ctx.lineTo(p.x, p.y - 26); ctx.lineTo(p.x + 11, p.y - 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (night > 0.3) { const g = ctx.createRadialGradient(p.x, p.y - 9, 2, p.x, p.y - 9, 90); g.addColorStop(0, `rgba(255,230,140,${0.5 * night})`); g.addColorStop(1, 'rgba(255,230,140,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y - 9, 90, 0, 7); ctx.fill(); }
      return true;
    }
    case 'sapling': case 'tree': {
      if (depleted) { isoBox(ctx, gx + 0.38, gy + 0.38, 0.24, 0.24, 8, { top: '#e7c08f', left: '#a0703f', right: '#8a5d32' }); const p = iso(gx + 0.5, gy + 0.5, 8); ctx.strokeStyle = '#a0703f'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, 4, 2, 0, 0, 7); ctx.stroke(); return true; }
      if (f.type === 'tree') return false;
      isoBox(ctx, gx + 0.45, gy + 0.45, 0.1, 0.1, 22, boxOf('#a0703f'));
      const c = iso(gx + 0.5, gy + 0.5, 22); const sw = Math.sin(t + gx) * 1.5;
      for (const [dx, dy, r] of [[-9, -2, 11], [9, -4, 11], [0, -14, 13]]) ell(ctx, { x: c.x + dx + sw, y: c.y + dy }, r, r * 0.9, '#8fdc8f');
      return true;
    }
    case 'swing': {
      for (const u of [0.1, w - 0.15]) isoBox(ctx, gx + u, gy + 0.45, 0.08, 0.08, 70, boxOf('#c98e5f'));
      isoBox(ctx, gx + 0.05, gy + 0.43, w - 0.1, 0.12, 6, boxOf('#d9a273'), 70);
      const sw = Math.sin(t * 2) * 0.12;
      const a = iso(gx + 0.6, gy + 0.5 + sw, 70), b = iso(gx + 1.4, gy + 0.5 + sw, 70), a2 = iso(gx + 0.6, gy + 0.5 + sw * 2.5, 18), b2 = iso(gx + 1.4, gy + 0.5 + sw * 2.5, 18);
      ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a2.x, a2.y); ctx.moveTo(b.x, b.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
      ctx.fillStyle = '#ff9ab8'; ctx.strokeStyle = O; ctx.beginPath(); ctx.moveTo(a2.x - 4, a2.y); ctx.lineTo(b2.x + 4, b2.y); ctx.lineTo(b2.x + 4, b2.y + 6); ctx.lineTo(a2.x - 4, a2.y + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      heartPath(ctx, (a.x + b.x) / 2, (a.y + b.y) / 2 - 8, 6); ctx.fillStyle = '#ff4d6d'; ctx.fill();
      return true;
    }
    case 'snowman': {
      const c = iso(gx + 0.5, gy + 0.5);
      ell(ctx, { x: c.x, y: c.y - 10 }, 16, 14, '#fff'); ell(ctx, { x: c.x, y: c.y - 32 }, 11, 10, '#fff');
      ctx.fillStyle = O; for (const dx of [-4, 4]) { ctx.beginPath(); ctx.arc(c.x + dx, c.y - 34, 1.8, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.moveTo(c.x, c.y - 31); ctx.lineTo(c.x + 9, c.y - 29); ctx.lineTo(c.x, c.y - 28); ctx.fill();
      ctx.fillStyle = '#e63946'; ctx.fillRect(c.x - 10, c.y - 24, 20, 4);
      ctx.fillStyle = '#2a2222'; ctx.beginPath(); ctx.arc(c.x - 7, c.y - 44, 4, 0, 7); ctx.arc(c.x + 7, c.y - 44, 4, 0, 7); ctx.fill(); // urechi de panda :)
      return true;
    }
    case 'gazebo': {
      for (const [u, v] of [[0.15, 0.15], [w - 0.25, 0.15], [0.15, d - 0.25], [w - 0.25, d - 0.25]]) isoBox(ctx, gx + u, gy + v, 0.1, 0.1, 64, boxOf('#fff4e4'));
      tilePath(ctx, gx + 0.1, gy + 0.1, w - 0.2, d - 0.2, 2); ctx.fillStyle = '#e7c08f'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke();
      const top = iso(gx + w / 2, gy + d / 2, 100), c0 = iso(gx, gy, 64), c1 = iso(gx + w, gy, 64), c2 = iso(gx + w, gy + d, 64), c3 = iso(gx, gy + d, 64);
      for (const [p, q, col] of [[c3, c2, '#ff9ab8'], [c1, c2, '#f28aa8'], [c0, c3, '#ffb6c9'], [c0, c1, '#ffc6d4']] as const) { ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); }
      heartPath(ctx, top.x, top.y - 6, 7); ctx.fillStyle = '#ff4d6d'; ctx.fill(); ctx.stroke();
      // ghirlanda de luminite
      for (let i = 0; i <= 8; i++) { const p = { x: c3.x + (c2.x - c3.x) * i / 8, y: c3.y + (c2.y - c3.y) * i / 8 + Math.sin(i / 8 * Math.PI) * 8 }; ctx.fillStyle = (Math.floor(t * 3) + i) % 2 ? '#ffd23f' : '#fff6b0'; ctx.beginPath(); ctx.arc(p.x, p.y + 2, 2.5, 0, 7); ctx.fill(); }
      return true;
    }
  }
  return false;
}

/** desenul "fantoma" la plasare */
export function drawGhost(ctx: CanvasRenderingContext2D, it: BuildItem, gx: number, gy: number, ok: boolean, t: number) {
  ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 6) * 0.1;
  tilePath(ctx, gx, gy, it.w, it.d, 0.5); ctx.fillStyle = ok ? 'rgba(120,220,140,0.45)' : 'rgba(240,90,90,0.45)'; ctx.fill();
  ctx.strokeStyle = ok ? '#2ec4b6' : '#e63946'; ctx.lineWidth = 3; ctx.stroke();
  drawBuildType(ctx, { id: 'ghost', type: it.type as any, gx, gy, w: it.w, d: it.d, solid: false }, t, 0, false);
  ctx.restore();
}

/** iarba inalta care creste in curte (1..3) */
export function drawTallGrass(ctx: CanvasRenderingContext2D, gx: number, gy: number, lv: number, t: number) {
  for (let k = 0; k < 6; k++) {
    const p = iso(gx + 0.2 + (k * 0.37) % 0.7, gy + 0.2 + (k * 0.61) % 0.7);
    const sw = Math.sin(t * 1.8 + gx + k) * 2;
    ctx.strokeStyle = k % 2 ? '#4f9d4a' : '#3d8b3d'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + sw, p.y - 5 - lv * 4, p.x + sw * 2, p.y - 8 - lv * 6); ctx.stroke();
  }
}
