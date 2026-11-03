// Gradina (stil Hay Day): culturi, stadii de crestere, udat, ingrasamant.
import { iso, tilePath } from './iso';
import { heartPath } from '../char/draw';

export type CropCat = 'veg' | 'flower';
export interface Crop { id: string; name: string; cat: CropCat; grow: number; yield: number; seed: number; sell: number; where: 'online' | 'sat' }

/** grow = minute de joc pana e gata (cu apa). O ora de joc = 1 minut real. */
export const CROPS: Record<string, Crop> = {
  carrot: { id: 'carrot', name: 'Morcovi', cat: 'veg', grow: 150, yield: 3, seed: 2, sell: 2, where: 'online' },
  potato: { id: 'potato', name: 'Cartofi', cat: 'veg', grow: 240, yield: 4, seed: 3, sell: 2, where: 'online' },
  tulip: { id: 'tulip', name: 'Lalele', cat: 'flower', grow: 180, yield: 3, seed: 3, sell: 3, where: 'online' },
  tomato: { id: 'tomato', name: 'Roșii', cat: 'veg', grow: 300, yield: 4, seed: 5, sell: 3, where: 'sat' },
  cabbage: { id: 'cabbage', name: 'Varză', cat: 'veg', grow: 420, yield: 2, seed: 6, sell: 6, where: 'sat' },
  strawberry: { id: 'strawberry', name: 'Căpșuni', cat: 'veg', grow: 360, yield: 5, seed: 8, sell: 3, where: 'sat' },
  rose: { id: 'rose', name: 'Trandafiri', cat: 'flower', grow: 480, yield: 3, seed: 9, sell: 6, where: 'sat' },
  sunflower: { id: 'sunflower', name: 'Floarea-soarelui', cat: 'flower', grow: 540, yield: 2, seed: 8, sell: 8, where: 'sat' },
};
export const seedKey = (crop: string) => 'seed_' + crop;

/** cheile din inventar care intra intr-o categorie (pentru taraba si bucatarie) */
export const CAT_KEYS: Record<CropCat, string[]> = {
  veg: ['veg', 'carrot', 'potato', 'tomato', 'cabbage', 'strawberry'],
  flower: ['flower', 'tulip', 'rose', 'sunflower'],
};
export const catCount = (res: Record<string, number>, cat: CropCat) => CAT_KEYS[cat].reduce((s, k) => s + (res[k] ?? 0), 0);
/** cheia din care sa iei 1 (cea mai numeroasa) */
export const catPick = (res: Record<string, number>, cat: CropCat) => CAT_KEYS[cat].filter(k => (res[k] ?? 0) > 0).sort((a, b) => (res[b] ?? 0) - (res[a] ?? 0))[0] ?? null;

export interface Plot { crop: string | null; prog: number; wetUntil: number; fert: number }
/** cat timp tine apa (minute de joc) */
export const WET_MIN = 180;
export const plotStage = (p: Plot) => !p.crop ? -1 : p.prog >= 1 ? 3 : p.prog >= 0.55 ? 2 : p.prog >= 0.15 ? 1 : 0;

const O = '#3a2a22';
function e(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, st = true, lw = 1.5) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fillStyle = fill; ctx.fill(); if (st) { ctx.strokeStyle = O; ctx.lineWidth = lw; ctx.stroke(); } }
function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, l: number, col = '#6cbf6c') { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(l * 0.5, -l * 0.4, l, 0); ctx.quadraticCurveTo(l * 0.5, l * 0.4, 0, 0); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1.1; ctx.stroke(); ctx.restore(); }
function bloom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, center = '#ffd23f') { for (let i = 0; i < 6; i++) { const a = i * 1.047; e(ctx, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.55, r * 0.55, r * 0.45, col, true, 1); } e(ctx, x, y, r * 0.4, r * 0.35, center, true, 1); }

/** razorul de pamant (pe sol) */
export function drawPlotSoil(ctx: CanvasRenderingContext2D, gx: number, gy: number, p: Plot, nowMin: number, t: number) {
  const wet = p.crop && p.wetUntil > nowMin;
  tilePath(ctx, gx + 0.06, gy + 0.06, 0.88, 0.88, 0.5);
  ctx.fillStyle = wet ? '#7a5232' : '#b08a5e'; ctx.fill(); ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = 2; ctx.stroke();
  // brazde
  for (const v of [0.3, 0.5, 0.7]) { const a = iso(gx + 0.15, gy + v), b = iso(gx + 0.85, gy + v); ctx.strokeStyle = wet ? '#5e3e24' : '#9a7650'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  if (wet) { const c = iso(gx + 0.5, gy + 0.5); ctx.fillStyle = 'rgba(120,190,255,0.35)'; ctx.beginPath(); ctx.ellipse(c.x - 6, c.y + 2, 6, 2.5, 0, 0, 7); ctx.ellipse(c.x + 9, c.y - 3, 4, 2, 0, 0, 7); ctx.fill(); }
  if (p.fert > 0 && p.crop) { const c = iso(gx + 0.25, gy + 0.75); for (let i = 0; i < 4; i++) e(ctx, c.x + i * 4, c.y - (i % 2) * 2, 1.6, 1.2, '#f4e2b5', false); }
  void t;
}

/** planta, pe stadii; desenata dupa sortare (are inaltime) */
export function drawCropPlant(ctx: CanvasRenderingContext2D, gx: number, gy: number, p: Plot, nowMin: number, t: number) {
  if (!p.crop) return;
  const st = plotStage(p); const dry = p.wetUntil <= nowMin && st < 3;
  const spots = [[0.32, 0.35], [0.68, 0.38], [0.5, 0.62]];
  for (const [u, v] of spots) {
    const c = iso(gx + u, gy + v); const sw = Math.sin(t * 1.6 + gx + u * 5) * (dry ? 0.5 : 1.5);
    const droop = dry ? 0.5 : 0;
    ctx.save(); ctx.translate(c.x, c.y);
    if (st === 0) { e(ctx, 0, 0, 3, 1.6, '#5d3d1e', false); ctx.restore(); continue; }
    if (st === 1) { ctx.strokeStyle = '#3d8b3d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sw * 0.5, -7); ctx.stroke(); leaf(ctx, sw * 0.5, -7, -2.6 + droop, 6); leaf(ctx, sw * 0.5, -7, -0.5 - droop, 6); ctx.restore(); continue; }
    const big = st === 3;
    switch (p.crop) {
      case 'carrot':
        for (const k of [-1, 0, 1]) leaf(ctx, sw, -2, -1.57 + k * 0.5 + droop * k, big ? 13 : 9, '#5fb35a');
        if (big) { ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(4, -1); ctx.lineTo(0, 5); ctx.closePath(); ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1.3; ctx.stroke(); }
        break;
      case 'potato':
        for (const k of [-1, 0, 1]) leaf(ctx, sw, -4, -1.57 + k * 0.8 + droop, big ? 11 : 8);
        if (big) { bloom(ctx, sw, -13, 3, '#fff'); e(ctx, -6, 2, 4, 3, '#c49a6c'); }
        break;
      case 'tomato':
        ctx.strokeStyle = '#a0703f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, big ? -22 : -14); ctx.stroke();
        for (const k of [-1, 1]) { leaf(ctx, 0, -6, k > 0 ? -0.3 + droop : -2.8 - droop, 9); leaf(ctx, 0, -14, k > 0 ? -0.6 : -2.5, 8); }
        if (big) for (const [dx, dy] of [[-5, -10], [5, -16], [4, -6]]) e(ctx, dx + sw, dy, 3.8, 3.6, '#e63946');
        break;
      case 'cabbage':
        e(ctx, 0, -4, big ? 10 : 6, big ? 7 : 4.5, '#a6dc93'); e(ctx, 0, -5, big ? 6 : 3.5, big ? 4.5 : 2.6, '#c8efb5', true, 1);
        for (const k of [-1, 1]) leaf(ctx, k * 6, -3, k > 0 ? -0.2 + droop : -2.9 - droop, big ? 9 : 6, '#7cc576');
        break;
      case 'strawberry':
        for (const k of [-1, 0, 1]) leaf(ctx, sw, -2, -1.57 + k * 0.9 + droop * k, big ? 10 : 7);
        if (big) for (const [dx, dy] of [[-7, -1], [6, -2], [0, -8]]) { ctx.beginPath(); ctx.moveTo(dx - 3, dy - 2); ctx.quadraticCurveTo(dx, dy + 5, dx + 3, dy - 2); ctx.closePath(); ctx.fillStyle = '#e63946'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1; ctx.stroke(); }
        else bloom(ctx, sw, -9, 2.5, '#fff');
        break;
      case 'tulip': case 'rose': case 'sunflower': {
        const h = p.crop === 'sunflower' ? (big ? 30 : 18) : big ? 18 : 12;
        ctx.strokeStyle = '#3d8b3d'; ctx.lineWidth = p.crop === 'sunflower' ? 3 : 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sw, -h / 2, sw * 1.5, -h + droop * 6); ctx.stroke();
        leaf(ctx, sw * 0.4, -h * 0.35, -2.5 - droop, 8); leaf(ctx, sw * 0.6, -h * 0.5, -0.6 + droop, 8);
        if (big) {
          if (p.crop === 'tulip') { ctx.beginPath(); ctx.moveTo(sw * 1.5 - 5, -h); ctx.lineTo(sw * 1.5 - 5, -h - 8); ctx.lineTo(sw * 1.5 - 2, -h - 5); ctx.lineTo(sw * 1.5, -h - 9); ctx.lineTo(sw * 1.5 + 2, -h - 5); ctx.lineTo(sw * 1.5 + 5, -h - 8); ctx.lineTo(sw * 1.5 + 5, -h); ctx.quadraticCurveTo(sw * 1.5, -h + 5, sw * 1.5 - 5, -h); ctx.fillStyle = ['#ff7aa2', '#ffd23f', '#c77dff'][Math.floor(u * 7) % 3]; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1.2; ctx.stroke(); }
          else if (p.crop === 'rose') { e(ctx, sw * 1.5, -h - 3, 6, 5, '#e63946'); ctx.strokeStyle = '#a3243f'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(sw * 1.5, -h - 3, 3, 0, 4.5); ctx.stroke(); }
          else { for (let i = 0; i < 10; i++) { const a = i * 0.628; e(ctx, sw * 1.5 + Math.cos(a) * 7, -h + Math.sin(a) * 7, 3.5, 2.2, '#ffd23f', true, 0.8); } e(ctx, sw * 1.5, -h, 5, 5, '#8a5d32'); }
        } else e(ctx, sw * 1.5, -h, 3, 3.5, '#7cc576');
        break;
      }
    }
    ctx.restore();
  }
  // insigne: gata de cules / sete
  const top = iso(gx + 0.5, gy + 0.5, 46);
  if (st === 3) { const y = top.y + Math.sin(t * 4 + gx) * 2; ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(top.x, y, 9, 0, 7); ctx.fill(); ctx.stroke(); ctx.font = '800 11px "Baloo 2", sans-serif'; ctx.fillStyle = '#2a7a3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', top.x, y + 1); ctx.textBaseline = 'alphabetic'; }
  else if (dry) { const y = top.y + Math.sin(t * 3 + gx) * 2; ctx.fillStyle = '#4cc9f0'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(top.x, y - 9); ctx.quadraticCurveTo(top.x + 7, y + 1, top.x, y + 4); ctx.quadraticCurveTo(top.x - 7, y + 1, top.x, y - 9); ctx.fill(); ctx.stroke(); }
  else { // bara de crestere
    ctx.fillStyle = '#ffffffcc'; ctx.fillRect(top.x - 12, top.y, 24, 4); ctx.fillStyle = '#7cc576'; ctx.fillRect(top.x - 12, top.y, 24 * Math.min(1, p.prog), 4);
  }
  void heartPath;
}

/** fantana cu ghizdul de piatra, acoperis si galeata */
export function drawWell(ctx: CanvasRenderingContext2D, gx: number, gy: number, t: number) {
  const c = iso(gx + 0.5, gy + 0.5);
  // ghizdul
  ctx.fillStyle = '#b8b2a7'; ctx.strokeStyle = O; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(c.x, c.y - 16, 22, 11, 0, 0, Math.PI); ctx.lineTo(c.x - 22, c.y - 16); ctx.closePath();
  ctx.beginPath(); ctx.moveTo(c.x - 22, c.y - 16); ctx.lineTo(c.x - 22, c.y); ctx.ellipse(c.x, c.y, 22, 11, 0, Math.PI, 0, true); ctx.lineTo(c.x + 22, c.y - 16); ctx.ellipse(c.x, c.y - 16, 22, 11, 0, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 5; i++) { ctx.strokeStyle = '#8e877b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.x - 18 + i * 9, c.y - 12); ctx.lineTo(c.x - 18 + i * 9, c.y + 4); ctx.stroke(); }
  e(ctx, c.x, c.y - 16, 22, 11, '#9a9184'); e(ctx, c.x, c.y - 16, 16, 7.5, '#3d6fa0', false);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(c.x - 4 + Math.sin(t) * 2, c.y - 17, 5, 1.6, 0, 0, 7); ctx.fill();
  // stalpi + acoperis
  for (const dx of [-20, 20]) { ctx.fillStyle = '#a0703f'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(c.x + dx - 2.5, c.y - 58, 5, 44, 2); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#c0573e'; ctx.beginPath(); ctx.moveTo(c.x - 30, c.y - 54); ctx.lineTo(c.x, c.y - 74); ctx.lineTo(c.x + 30, c.y - 54); ctx.closePath(); ctx.fill(); ctx.stroke();
  // vinciul si galeata
  ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c.x - 20, c.y - 48); ctx.lineTo(c.x + 20, c.y - 48); ctx.stroke();
  const by = c.y - 30 + Math.sin(t * 1.5) * 1.5;
  ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(c.x, c.y - 48); ctx.lineTo(c.x, by - 6); ctx.stroke();
  ctx.fillStyle = '#9aa5ad'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c.x - 6, by - 6); ctx.lineTo(c.x + 6, by - 6); ctx.lineTo(c.x + 4, by + 3); ctx.lineTo(c.x - 4, by + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
}
