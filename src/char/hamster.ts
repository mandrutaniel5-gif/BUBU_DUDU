// Hamsterii (1.14.0): personajele jucatorilor. Ea („bubu”): alba, cu pata piersicie pe crestet si fundita roz.
// El („dudu”): auriu, cu bot si burtica albe, papion albastru si creionul de mester dupa ureche.
// Primesc aceeasi Pose ca vechii ursuleti, deci toate animatiile merg la fel. Unitatile de aici sunt „de desen”
// (capul are ~120 de unitati latime); HS le aduce la marimea veche a personajelor (talpile in 0, crestetul pe la -100).
// Blana (forma, umbre, fire, model) se deseneaza o singura data in imagini pastrate (sprite), la rezolutia de care e nevoie;
// fata, urechile, labutele, hainele si obiectele se deseneaza la fiecare cadru.
import type { Pose, EyeType, MouthType } from './pose';
import type { Outfit } from './outfit';
import { drawProp, heartPath, starPath, drawVein, drawSweat, drawDizzy } from './draw';
import { drawBodyWear, drawHeadWear, drawFaceWear, drawNeckWear, drawPinWear, sleeveOf, wearHides } from './hamwear';

export const HS = 0.64;
const O = '#4a2a22';
const TAU = Math.PI * 2;
export type HamId = 'bubu' | 'dudu';

export interface HamLook {
  body: string; shade: string; deep: string; belly: string; white?: string; patch?: string; patchShade?: string;
  ear: string; earIn: string; paw: string; pawDark: string; blush: string; nose: string; lashes: boolean; tuft: boolean;
}
export const LOOK: Record<HamId, HamLook> = {
  bubu: { body: '#fffaf4', shade: '#e8d3c6', deep: '#d9bcab', belly: '#ffffff', patch: '#f7c9a5', patchShade: '#eab08a', ear: '#fff3ea', earIn: '#ffc0cf', paw: '#ffd0da', pawDark: '#ff9fb6', blush: '#ff9fb8', nose: '#ff8aa5', lashes: true, tuft: false },
  dudu: { body: '#f3a95d', shade: '#d98b3f', deep: '#c27631', belly: '#fffaf1', white: '#fffaf1', ear: '#ec9b4d', earIn: '#ffc0a6', paw: '#ffd3cf', pawDark: '#f59a92', blush: '#ff8f84', nose: '#e8757d', lashes: false, tuft: true },
};

// ---------- utilitare ----------
const ell = (c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
export const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const angd = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const gauss = (d: number, w: number) => Math.exp(-(d * d) / (2 * w * w));
const bumpc = (d: number, w: number) => (Math.abs(d) < w ? (Math.cos(Math.PI * d / w) + 1) / 2 : 0);
type Pt = [number, number];
function polar(cx: number, cy: number, rf: (a: number) => number, N: number): Pt[] { const o: Pt[] = []; for (let i = 0; i < N; i++) { const a = i / N * TAU, r = rf(a); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; }
function toPath(pts: Pt[]) { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; }
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function soft(c: CanvasRenderingContext2D, px: number, fn: () => void) { c.save(); try { c.filter = `blur(${Math.max(0.5, px)}px)`; } catch { /* fara blur pe browserele vechi */ } fn(); c.restore(); }

// ---------- forma capului si a corpului (unitati de desen) ----------
/** centrul capului fata de talpi; gatul (pivotul) e mai jos */
export const HEAD_Y = -102;
function headRF(id: HamId) {
  const tufts = LOOK[id].tuft ? [-Math.PI / 2 + 0.07, -Math.PI / 2 - 0.1] : [];
  return (a: number) => {
    let r = 1 / Math.sqrt((Math.cos(a) / 60) ** 2 + (Math.sin(a) / 54) ** 2);
    r += 6 * (gauss(angd(a, 0.5), 0.45) + gauss(angd(a, Math.PI - 0.5), 0.45));
    r -= 3 * gauss(angd(a, Math.PI / 2), 0.35) + 2 * gauss(angd(a, -Math.PI / 2), 0.5);
    for (const t of [0.28, 0.62]) { r += 3.2 * bumpc(angd(a, t), 0.2); r += 3.2 * bumpc(angd(a, Math.PI - t), 0.2); }
    for (const t of [Math.PI / 2 - 0.22, Math.PI / 2 + 0.22]) r += 2.6 * bumpc(angd(a, t), 0.18);
    for (const t of tufts) r += 5.5 * bumpc(angd(a, t), 0.14);
    return r;
  };
}
function bodyRF(a: number) { let r = 1 / Math.sqrt((Math.cos(a) / 50) ** 2 + (Math.sin(a) / 42) ** 2); for (const t of [0.15, 0.5]) { r += 2.8 * bumpc(angd(a, t), 0.2); r += 2.8 * bumpc(angd(a, Math.PI - t), 0.2); } return r; }
const GEO: Partial<Record<HamId, { head: Pt[]; headP: Path2D; body: Pt[]; bodyP: Path2D }>> = {};
export function geo(id: HamId) {
  let g = GEO[id];
  if (!g) {
    const head = polar(0, 0, headRF(id), 360);
    const body = polar(0, -42, bodyRF, 300).map(([x, y]) => (y > -4 ? [x * (1 - (y + 4) * 0.004), -4 + (y + 4) * 0.22] : [x, y]) as Pt);
    g = GEO[id] = { head, headP: toPath(head), body, bodyP: toPath(body) };
  }
  return g;
}

/** fire de blana pe marginea interioara (forma e deja decupata) */
function furEdge(c: CanvasRenderingContext2D, pts: Pt[], col: string, alpha: number, len: number, step: number, cx: number, cy: number) {
  c.save(); c.strokeStyle = rgba(col, alpha); c.lineCap = 'round';
  for (let i = 0; i < pts.length; i += step) {
    const [x, y] = pts[i]; let nx = x - cx, ny = y - cy; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const a = (rnd() - 0.5) * 0.6, L = len * (0.6 + rnd() * 0.6);
    const dx = -(nx * Math.cos(a) - ny * Math.sin(a)), dy = -(nx * Math.sin(a) + ny * Math.cos(a));
    c.lineWidth = 0.9 + rnd() * 0.5; c.beginPath(); c.moveTo(x - nx, y - ny); c.quadraticCurveTo(x + dx * L * 0.5 + dy * 1.5, y + dy * L * 0.5 - dx * 1.5, x + dx * L, y + dy * L); c.stroke();
  }
  c.restore();
}

// ---------- imaginile pastrate (blana) ----------
interface Sprite { cv: HTMLCanvasElement; x: number; y: number; w: number; h: number }
const SPR = new Map<string, Sprite>();
function sprite(key: string, k: number, x: number, y: number, w: number, h: number, draw: (c: CanvasRenderingContext2D, k: number) => void): Sprite {
  const id = key + '@' + k; let s = SPR.get(id);
  if (!s) {
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k);
    const c = cv.getContext('2d')!; c.scale(k, k); c.translate(-x, -y); c.lineJoin = 'round'; c.lineCap = 'round';
    draw(c, k); s = { cv, x, y, w, h }; SPR.set(id, s);
  }
  return s;
}
/** rezolutia imaginii: dupa cat de mare apare personajul pe ecran (trepte, ca sa nu refacem mereu) */
function bucket(ctx: CanvasRenderingContext2D) {
  let e = 1; try { const m = ctx.getTransform(); e = Math.hypot(m.a, m.b); } catch { /* */ }
  return Math.min(6, Math.max(0.5, 2 ** (Math.ceil(Math.log2(Math.max(0.01, e)) * 2) / 2)));
}
function blit(ctx: CanvasRenderingContext2D, s: Sprite) { ctx.drawImage(s.cv, s.x, s.y, s.w, s.h); }

function headSprite(id: HamId, back: boolean, k: number) {
  return sprite(`h-${id}-${back ? 'b' : 'f'}`, k, -78, -72, 156, 142, (c, kk) => {
    const L = LOOK[id], g = geo(id); seed = id === 'bubu' ? 11 : 23;
    c.fillStyle = L.body; c.fill(g.headP);
    c.save(); c.clip(g.headP);
    if (L.patch) {
      soft(c, 2.2 * kk, () => { c.fillStyle = L.patch!; ell(c, 0, back ? -18 : -46, back ? 44 : 36, back ? 38 : 21); c.fill(); });
      soft(c, 3 * kk, () => { c.fillStyle = rgba(L.patchShade!, 0.5); ell(c, 0, back ? -26 : -52, back ? 34 : 28, back ? 24 : 12); c.fill(); });
    }
    if (L.white && !back) {
      soft(c, 1.4 * kk, () => { c.fillStyle = L.white!; ell(c, 0, 26, 44, 25); c.fill(); for (const side of [-1, 1]) { ell(c, side * 45, 21, 25, 22); c.fill(); } ell(c, 0, 8, 10, 16); c.fill(); });
      c.strokeStyle = rgba(L.white, 0.95); c.lineCap = 'round';
      for (let i = 0; i < 50; i++) { const t = i / 49, a = Math.PI * (1.05 - t * 1.1) + Math.PI; const ex = Math.cos(a) * 58, ey = 14 + Math.sin(a) * -18 - Math.abs(Math.cos(a)) * 6; c.lineWidth = 1.1 + rnd() * 0.6; c.beginPath(); c.moveTo(ex * 0.98, ey + 3); c.lineTo(ex * 0.98 + (rnd() - 0.5) * 2, ey - 1 - rnd() * 3); c.stroke(); }
    }
    if (L.white && back) soft(c, 3 * kk, () => { c.fillStyle = rgba(L.white!, 0.5); ell(c, 0, 52, 50, 14); c.fill(); });
    const gr = c.createRadialGradient(-20, -26, 8, 0, 4, 82); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.62, 'rgba(255,255,255,0)'); gr.addColorStop(1, rgba(L.shade, 0.75));
    c.fillStyle = gr; c.fillRect(-100, -80, 200, 160);
    soft(c, 4 * kk, () => { c.fillStyle = rgba(L.shade, 0.45); ell(c, 6, 52, 64, 12); c.fill(); });
    soft(c, 3 * kk, () => { c.fillStyle = 'rgba(255,255,255,0.55)'; ell(c, back ? 18 : -24, -32, 20, 9, back ? 0.35 : -0.35); c.fill(); });
    furEdge(c, g.head, L.deep, 0.22, 5.5, 10, 0, 0);
    if (back) { c.strokeStyle = rgba(L.deep, 0.35); c.lineWidth = 1.4; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 9, 34); c.quadraticCurveTo(i * 10, 42, i * 8 + 2, 48); c.stroke(); } }
    c.restore();
    c.lineWidth = 3.2; c.strokeStyle = O; c.stroke(g.headP);
  });
}
function bodySprite(id: HamId, back: boolean, k: number) {
  return sprite(`b-${id}-${back ? 'b' : 'f'}`, k, -62, -94, 124, 98, (c, kk) => {
    const L = LOOK[id], g = geo(id); seed = id === 'bubu' ? 5 : 9;
    c.fillStyle = L.body; c.fill(g.bodyP);
    c.save(); c.clip(g.bodyP);
    if (!back) {
      soft(c, 1.8 * kk, () => { c.fillStyle = L.belly; ell(c, 0, -28, 32, 26); c.fill(); });
      if (L.white) { c.strokeStyle = rgba(L.white, 0.95); c.lineCap = 'round'; for (let i = 0; i < 24; i++) { const a = Math.PI * 1.15 + (i / 23) * Math.PI * 0.7; const ex = Math.cos(a) * 32, ey = -28 + Math.sin(a) * 26; c.lineWidth = 1.2 + rnd() * 0.6; c.beginPath(); c.moveTo(ex * 0.95, ey * 0.97 - 2); c.lineTo(ex * 1.05 + (rnd() - 0.5) * 3, ey - 5 - rnd() * 3); c.stroke(); } }
    } else if (L.patch) soft(c, 3 * kk, () => { c.fillStyle = rgba(L.patch!, 0.55); ell(c, 0, -58, 30, 18); c.fill(); });
    const gr = c.createRadialGradient(-16, -62, 6, 0, -40, 66); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)'); gr.addColorStop(1, rgba(L.shade, 0.75)); c.fillStyle = gr; c.fillRect(-80, -110, 160, 120);
    soft(c, 5 * kk, () => { c.fillStyle = rgba(L.shade, 0.65); ell(c, 0, -62, 50, 13); c.fill(); });
    furEdge(c, g.body, L.deep, 0.22, 5, 10, 0, -40);
    c.restore();
    c.lineWidth = 3.2; c.strokeStyle = O; c.stroke(g.bodyP);
  });
}

// ---------- bucatile desenate la fiecare cadru ----------
function drawEar(c: CanvasRenderingContext2D, L: HamLook, side: number, part: 'back' | 'front', wig: number, fromBehind: boolean) {
  c.save(); c.translate(side * 36, -44); c.rotate(side * (0.42 + wig * 0.35));
  if (part === 'back') { ell(c, 0, 0, 16.5, 15.5); c.fillStyle = L.ear; c.fill(); c.lineWidth = 3.2; c.strokeStyle = O; c.stroke(); c.restore(); return; }
  c.save(); c.beginPath(); c.rect(-30, -30, 60, 36); c.clip();
  ell(c, 0, 0, 16.5, 15.5); c.fillStyle = L.ear; c.fill();
  if (!fromBehind) { const g = c.createRadialGradient(-side, 2, 1, 0, 2, 11); g.addColorStop(0, rgba(L.earIn, 1)); g.addColorStop(0.7, rgba(L.earIn, 0.9)); g.addColorStop(1, rgba(L.earIn, 0)); c.fillStyle = g; ell(c, 0, 2.5, 11, 10.5); c.fill(); }
  else { c.fillStyle = rgba(L.shade, 0.35); ell(c, 2, 4, 11, 9); c.fill(); }
  ell(c, 0, 0, 16.5, 15.5); c.lineWidth = 3.2; c.strokeStyle = O; c.stroke();
  c.restore();
  c.fillStyle = L.body; c.globalAlpha = 0.9; ell(c, 0, 9, 13, 4.6); c.fill(); c.globalAlpha = 1;
  c.restore();
}
function drawBowId(c: CanvasRenderingContext2D, x: number, rot: number) {
  c.save(); c.translate(x, -46); c.rotate(rot);
  const loop = (side: number) => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(side * 6, -15, side * 26, -16, side * 25, -1); c.bezierCurveTo(side * 26, 13, side * 6, 13, 0, 0); c.closePath(); };
  for (const side of [-1, 1]) { c.beginPath(); c.moveTo(side * 2, 2); c.quadraticCurveTo(side * 8, 8, side * 7, 13); c.lineTo(side * 10.5, 11); c.lineTo(side * 13, 14); c.quadraticCurveTo(side * 13, 7, side * 5, 1); c.closePath(); c.fillStyle = '#ff6f97'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = O; c.stroke(); }
  for (const side of [-1, 1]) {
    loop(side); const g = c.createLinearGradient(0, -14, 0, 12); g.addColorStop(0, '#ff9dbb'); g.addColorStop(1, '#ff6890'); c.fillStyle = g; c.fill();
    c.save(); loop(side); c.clip(); c.fillStyle = 'rgba(255,255,255,0.85)'; for (const [px, py] of [[9, -6], [17, 2], [14, -10], [21, -5], [8, 4]]) { ell(c, side * px, py, 1.8, 1.8); c.fill(); } c.restore();
    loop(side); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)'; ell(c, side * 15, -7, 4, 2, side * 0.3); c.fill();
  }
  c.beginPath(); c.roundRect(-5, -6, 10, 12, 4); c.fillStyle = '#ff5c88'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = O; c.stroke();
  c.restore();
}
function drawPencil(c: CanvasRenderingContext2D, side: number) {
  c.save(); c.translate(side * 46, -42); c.rotate(side * 0.62); c.scale(-side * 0.62, 0.62);
  c.beginPath(); c.rect(-44, -5.5, 84, 11); c.fillStyle = '#ffd34d'; c.fill();
  c.fillStyle = '#f2b92e'; c.fillRect(-44, 1.8, 84, 3.7); c.fillStyle = '#fff1a8'; c.fillRect(-44, -4.5, 84, 2);
  c.lineWidth = 2.6; c.strokeStyle = O; c.strokeRect(-44, -5.5, 84, 11);
  c.beginPath(); c.moveTo(-44, -5.5); c.lineTo(-60, 0); c.lineTo(-44, 5.5); c.closePath(); c.fillStyle = '#f6d3a4'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-54.5, -1.9); c.lineTo(-60, 0); c.lineTo(-54.5, 1.9); c.closePath(); c.fillStyle = '#4a4040'; c.fill();
  c.restore();
}
export function drawBowtieId(c: CanvasRenderingContext2D, col1 = '#7db4ff', col2 = '#3f73da') {
  c.save(); c.translate(0, -55);
  for (const side of [-1, 1]) {
    c.beginPath(); c.moveTo(side * 3, 0); c.quadraticCurveTo(side * 10, -12, side * 19, -10); c.quadraticCurveTo(side * 23, 0, side * 19, 10); c.quadraticCurveTo(side * 10, 12, side * 3, 0); c.closePath();
    const g = c.createLinearGradient(0, -10, 0, 10); g.addColorStop(0, col1); g.addColorStop(1, col2); c.fillStyle = g; c.fill(); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.6)'; ell(c, side * 14, -5, 3.4, 1.7, side * 0.25); c.fill();
  }
  c.beginPath(); c.roundRect(-5, -6, 10, 12, 4); c.fillStyle = col2; c.fill(); c.lineWidth = 2.4; c.strokeStyle = O; c.stroke();
  c.restore();
}

// ---------- fata ----------
function eyeShape(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ell(c, x, y, rx, ry); const g = c.createLinearGradient(0, y - ry, 0, y + ry); g.addColorStop(0, '#24130e'); g.addColorStop(0.65, '#3a1f17'); g.addColorStop(1, '#6b3727'); c.fillStyle = g; c.fill();
  c.save(); ell(c, x, y, rx, ry); c.clip(); c.fillStyle = 'rgba(190,105,70,0.55)'; ell(c, x + 0.5, y + ry * 0.62, rx * 0.68, ry * 0.36); c.fill(); c.restore();
  c.fillStyle = '#fff'; ell(c, x - rx * 0.33, y - ry * 0.36, rx * 0.42, ry * 0.4); c.fill(); ell(c, x + rx * 0.38, y + ry * 0.36, rx * 0.17, rx * 0.17); c.fill();
}
function lashes(c: CanvasRenderingContext2D, x: number, y: number, side: number, rx: number, ry: number) { c.strokeStyle = O; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x + side * rx * 0.75, y - ry * 0.6); c.lineTo(x + side * (rx + 4), y - ry * 0.95); c.moveTo(x + side * rx * 0.95, y - ry * 0.2); c.lineTo(x + side * (rx + 5), y - ry * 0.35); c.stroke(); }
function drawEye(c: CanvasRenderingContext2D, L: HamLook, x: number, y: number, side: number, type: EyeType, t: number) {
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = O; c.fillStyle = O;
  const lid = (y0: number, y1: number, fn: () => void) => { // pleoapa: o linie inclinata; ochiul se vede doar sub ea
    c.save(); c.beginPath(); c.moveTo(x - 14, y0); c.lineTo(x + 14, y1); c.lineTo(x + 14, y + 16); c.lineTo(x - 14, y + 16); c.closePath(); c.clip(); fn(); c.restore();
    c.lineWidth = 3; c.beginPath(); c.moveTo(x - 11, y0 + (y1 - y0) * (3 / 28)); c.lineTo(x + 11, y0 + (y1 - y0) * (25 / 28)); c.stroke();
  };
  switch (type) {
    case 'dot': eyeShape(c, x, y, 9, 11); if (L.lashes) lashes(c, x, y, side, 9, 11); break;
    case 'side': eyeShape(c, x + 2.5, y, 8, 10); if (L.lashes) lashes(c, x + 2.5, y, side, 8, 10); break;
    case 'angry': lid(side < 0 ? y - 12 : y - 4, side < 0 ? y - 4 : y - 12, () => eyeShape(c, x, y + 1, 8.5, 10.5)); break;
    case 'sad': lid(side < 0 ? y - 5 : y - 12, side < 0 ? y - 12 : y - 5, () => eyeShape(c, x, y + 1, 9, 11)); c.fillStyle = 'rgba(160,215,255,0.8)'; ell(c, x, y + 10, 8, 3); c.fill(); break;
    case 'half': lid(y - 2, y - 2, () => eyeShape(c, x, y + 1, 9, 10.5)); break;
    case 'wide':
      ell(c, x, y, 10.5, 12.5); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2.4; c.stroke();
      eyeShape(c, x, y + 1, 5.6, 6.6); break;
    case 'happy': c.lineWidth = 3.4; c.beginPath(); c.arc(x, y + 4, 7.5, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); if (L.lashes) { c.lineWidth = 2; c.beginPath(); c.moveTo(x + side * 7, y + 1.5); c.lineTo(x + side * 10.5, y - 1); c.stroke(); } break;
    case 'wink': c.lineWidth = 3.4; c.beginPath(); c.arc(x, y + 4, 7.5, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); break;
    case 'closed':
      c.lineWidth = 3.2; c.beginPath(); c.arc(x, y - 2, 7, Math.PI * 0.12, Math.PI * 0.88); c.stroke();
      if (L.lashes) { c.lineWidth = 1.8; for (const d of [-0.6, 0, 0.6]) { const a = Math.PI / 2 + d; c.beginPath(); c.moveTo(x + Math.cos(a) * 7, y - 2 + Math.sin(a) * 7); c.lineTo(x + Math.cos(a) * 10.5, y - 2 + Math.sin(a) * 10.5); c.stroke(); } }
      break;
    case 'cry': case 'strain': c.lineWidth = 3.2; c.beginPath(); c.moveTo(x - side * 6, y - 6); c.lineTo(x + side * 5, y); c.lineTo(x - side * 6, y + 6); c.stroke(); break;
    case 'x': c.lineWidth = 3; c.beginPath(); c.moveTo(x - 6, y - 6); c.lineTo(x + 6, y + 6); c.moveTo(x + 6, y - 6); c.lineTo(x - 6, y + 6); c.stroke(); break;
    case 'heart': {
      const s = 10.5 + Math.sin(t * 10) * 1.2; const g = c.createLinearGradient(0, y - 10, 0, y + 8); g.addColorStop(0, '#ff6b8f'); g.addColorStop(1, '#e8325d');
      heartPath(c, x, y + 3, s); c.fillStyle = g; c.fill(); c.lineWidth = 2.2; c.strokeStyle = '#8f1e3a'; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.85)'; ell(c, x - 4, y - 2, 2.6, 1.7, -0.5); c.fill(); break;
    }
    case 'star': starPath(c, x, y, 10, 4.4, 5, t * 2); c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#b8860b'; c.stroke(); c.fillStyle = '#fff'; ell(c, x - 2.5, y - 3, 1.8, 1.4); c.fill(); break;
    case 'spiral': {
      c.lineWidth = 2.2; c.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.25) { const r = a * 0.62, aa = a + t * 8 * side; const px = x + Math.cos(aa) * r, py = y + Math.sin(aa) * r; a === 0 ? c.moveTo(px, py) : c.lineTo(px, py); }
      c.stroke(); break;
    }
  }
}
function drawMouth(c: CanvasRenderingContext2D, type: MouthType, t: number, id: HamId) {
  const my = 22; c.strokeStyle = O; c.lineWidth = 2.3; c.lineCap = 'round'; c.lineJoin = 'round';
  const philtrum = () => { c.beginPath(); c.moveTo(0, 18.2); c.lineTo(0, my - 1); c.stroke(); };
  const teeth = (y: number) => { c.beginPath(); c.roundRect(-3.4, y, 6.8, 5.2, 1.6); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.5; c.stroke(); c.beginPath(); c.moveTo(0, y + 0.2); c.lineTo(0, y + 5); c.stroke(); c.lineWidth = 2.3; };
  const omega = () => { c.beginPath(); c.arc(-3.8, my - 1, 3.8, Math.PI * 0.05, Math.PI * 0.95); c.moveTo(7.6, my - 1); c.arc(3.8, my - 1, 3.8, Math.PI * 0.05, Math.PI * 0.95); c.stroke(); };
  const open = (w: number, h: number, tongue = true, top = true) => {
    const pathM = () => { c.beginPath(); c.moveTo(-w, my - 1); c.quadraticCurveTo(-w / 2, my + 1.5, 0, my - 1); c.quadraticCurveTo(w / 2, my + 1.5, w, my - 1); c.quadraticCurveTo(w * 0.86, my + h, 0, my + h + 0.5); c.quadraticCurveTo(-w * 0.86, my + h, -w, my - 1); c.closePath(); };
    pathM(); c.fillStyle = '#9b3a45'; c.fill();
    c.save(); pathM(); c.clip(); if (tongue) { c.fillStyle = '#ff8c9e'; ell(c, 0, my + h, w * 0.75, h * 0.45); c.fill(); } if (top) { c.fillStyle = '#fff'; c.fillRect(-3.2, my - 2, 6.4, 4); c.strokeStyle = rgba(O, 0.5); c.lineWidth = 1; c.beginPath(); c.moveTo(0, my - 1); c.lineTo(0, my + 2); c.stroke(); } c.restore();
    pathM(); c.strokeStyle = O; c.lineWidth = 2.2; c.stroke();
  };
  switch (type) {
    case 'w': philtrum(); omega(); teeth(my + 2.4); break;
    case 'cat': philtrum(); omega(); break;
    case 'smile': philtrum(); c.beginPath(); c.arc(0, my - 3, 5, Math.PI * 0.2, Math.PI * 0.8); c.stroke(); break;
    case 'open': philtrum(); open(7, 11); break;
    case 'grin': philtrum(); open(11, 9, true, true); break;
    case 'scream': { philtrum(); const h = 13 + Math.sin(t * 30) * 1.2; open(8, h); break; }
    case 'o': philtrum(); ell(c, 0, my + 3, 3.6, 4.4); c.fillStyle = '#9b3a45'; c.fill(); c.lineWidth = 2.2; c.stroke(); break;
    case 'frown': philtrum(); c.beginPath(); c.arc(0, my + 6, 5, Math.PI * 1.2, Math.PI * 1.8); c.stroke(); break;
    case 'wavy': philtrum(); c.beginPath(); c.moveTo(-7, my + 3); for (let i = 1; i <= 6; i++) c.lineTo(-7 + i * 2.33, my + 3 + (i % 2 ? -2 : 1.4)); c.stroke(); break;
    case 'flat': philtrum(); c.beginPath(); c.moveTo(-5, my + 1); c.lineTo(5, my + 1); c.stroke(); break;
    case 'smirk': philtrum(); c.beginPath(); c.moveTo(-5, my); c.quadraticCurveTo(2, my + 3, 7, my - 2); c.stroke(); break;
    case 'tongue': philtrum(); omega(); c.beginPath(); c.roundRect(-3.6, my + 1.5, 7.2, 8, 3.6); c.fillStyle = '#ff7f96'; c.fill(); c.lineWidth = 1.8; c.stroke(); c.beginPath(); c.moveTo(0, my + 3); c.lineTo(0, my + 7); c.lineWidth = 1.2; c.stroke(); break;
    case 'kiss': philtrum(); c.beginPath(); c.arc(1, my, 2.6, -Math.PI * 0.6, Math.PI * 0.5); c.arc(1, my + 5, 2.6, -Math.PI * 0.5, Math.PI * 0.6); c.stroke(); break;
    case 'drool': philtrum(); omega(); teeth(my + 2.4); c.fillStyle = 'rgba(150,210,255,0.9)'; ell(c, 6, my + 7 + Math.sin(t * 3) * 1.5, 2.2, 4 + Math.sin(t * 3) * 2); c.fill(); break;
    case 'none': break;
  }
  void id;
}
function drawFace(c: CanvasRenderingContext2D, id: HamId, p: Pose, t: number) {
  const L = LOOK[id];
  const ex = 25, ey = 4 + p.pupilDy / HS, pdx = p.pupilDx / HS;
  const bl = p.blush;
  if (bl > 0) for (const side of [-1, 1]) {
    const bx = side * 42, by = 19, a = Math.min(1, bl);
    const g = c.createRadialGradient(bx, by, 1, bx, by, 17); g.addColorStop(0, rgba(L.blush, 0.85 * a)); g.addColorStop(0.6, rgba(L.blush, 0.45 * a)); g.addColorStop(1, rgba(L.blush, 0));
    c.fillStyle = g; ell(c, bx, by, 17, 14); c.fill();
    c.fillStyle = `rgba(255,255,255,${0.75 * a})`; ell(c, bx - 4, by - 4, 2.4, 1.6); c.fill();
    if (bl > 1) { c.strokeStyle = rgba('#e0607e', 0.8); c.lineWidth = 1.6; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(bx - 6 + i * 5, by - 2); c.lineTo(bx - 9 + i * 5, by + 4); c.stroke(); } }
  }
  if (p.brows !== 'none') {
    c.strokeStyle = O; c.lineWidth = 2.6; c.lineCap = 'round';
    for (const side of [-1, 1]) {
      c.beginPath();
      if (p.brows === 'angry') { c.moveTo(side * 34, -15); c.lineTo(side * 16, -9); }
      else if (p.brows === 'sad') { c.moveTo(side * 33, -9); c.quadraticCurveTo(side * 25, -12, side * 17, -16); }
      else { c.moveTo(side * 32, -15); c.quadraticCurveTo(side * 25, -21, side * 17, -17); }
      c.stroke();
    }
  }
  drawEye(c, L, -ex + pdx, ey, -1, p.eyes, t);
  drawEye(c, L, ex + pdx, ey, 1, p.eyesR ?? p.eyes, t);
  c.strokeStyle = rgba(O, 0.2); c.lineWidth = 1;
  for (const side of [-1, 1]) for (const [dy, e2] of [[-1, -5], [2, 1], [5, 7]]) { c.beginPath(); c.moveTo(side * 14, 20 + dy); c.quadraticCurveTo(side * 24, 18 + dy, side * 32, 18 + e2); c.stroke(); }
  c.beginPath(); c.moveTo(-5, 13); c.quadraticCurveTo(0, 11, 5, 13); c.quadraticCurveTo(3.5, 17.5, 0, 18.2); c.quadraticCurveTo(-3.5, 17.5, -5, 13); c.closePath();
  c.fillStyle = L.nose; c.fill(); c.lineWidth = 1.6; c.strokeStyle = O; c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.8)'; ell(c, -1.8, 13.4, 1.6, 0.9); c.fill();
  drawMouth(c, p.mouth, t, id);
  if (p.tears > 0) {
    c.fillStyle = 'rgba(120,195,255,0.85)';
    for (const side of [-1, 1]) {
      const x = side * ex, len = 8 + p.tears * 30;
      c.beginPath(); c.roundRect(x - 3, ey + 9, 6, len, 3); c.fill();
      for (let i = 0; i < 2; i++) { const ph = (t * 1.6 + i * 0.5 + (side > 0 ? 0.25 : 0)) % 1; ell(c, x + side * ph * 8, ey + 9 + len + ph * 24, 2.8, 3.6); c.fill(); }
    }
  }
  if (p.snot > 0) {
    const r = 3 + p.snot * 9 * (0.75 + 0.25 * Math.sin(t * 2.5));
    c.fillStyle = 'rgba(170,220,255,0.55)'; c.strokeStyle = 'rgba(90,150,210,0.9)'; c.lineWidth = 1.4;
    ell(c, 5 + r * 0.6, 16, r, r * 0.9); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.9)'; ell(c, 4 + r * 0.4, 14, r * 0.25, r * 0.2); c.fill();
  }
}

/** capul complet, in coordonatele capului (centru 0,0). Folosit si pentru „doar capul” (pat, cada) */
function drawHead(ctx: CanvasRenderingContext2D, id: HamId, p: Pose, t: number, o: Outfit | undefined, k: number) {
  const L = LOOK[id], back = p.back, head = o?.head && o.head !== 'none' ? o.head : '';
  const hide = wearHides(head);
  if (head) drawHeadWear(ctx, head, 'behind', back, t);
  if (!hide.ears) for (const side of [-1, 1]) drawEar(ctx, L, side, 'back', p.earWiggle, back);
  blit(ctx, headSprite(id, back, k));
  if (p.sickTint > 0) { ctx.save(); ctx.clip(geo(id).headP); ctx.fillStyle = `rgba(150,210,120,${0.42 * p.sickTint})`; ctx.fillRect(-80, -70, 160, 140); ctx.restore(); }
  if (!head && id === 'dudu') drawPencil(ctx, back ? -1 : 1);
  if (!hide.ears) for (const side of [-1, 1]) drawEar(ctx, L, side, 'front', p.earWiggle, back);
  if (!back) {
    drawFace(ctx, id, p, t);
    const face = o?.face && o.face !== 'none' ? o.face : '';
    if (face) drawFaceWear(ctx, face, t);
  } else {
    ctx.strokeStyle = rgba(O, 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, 44); ctx.quadraticCurveTo(0, 40, 8, 44); ctx.stroke();
  }
  if (!head && id === 'bubu') drawBowId(ctx, back ? 31 : -31, back ? 0.28 : -0.28);
  if (head) drawHeadWear(ctx, head, 'front', back, t);
  if (p.vein > 0) { ctx.save(); ctx.translate(back ? -34 : 34, -26); ctx.scale(1 / HS, 1 / HS); drawVein(ctx, 0, 0, p.vein, t); ctx.restore(); }
  if (p.sweat > 0) { ctx.save(); ctx.translate(-48, -12); ctx.scale(1 / HS, 1 / HS); drawSweat(ctx, 0, 0, p.sweat, t); ctx.restore(); }
  if (p.dizzy > 0) { ctx.save(); ctx.scale(1 / HS, 1 / HS); ctx.translate(0, -8); drawDizzy(ctx, p.dizzy, t); ctx.restore(); }
}

const ARM_OFS = -0.25;
function drawArm(ctx: CanvasRenderingContext2D, id: HamId, p: Pose, side: -1 | 1, ang: number, hipD: number, o: Outfit | undefined, t: number) {
  const L = LOOK[id];
  ctx.save(); ctx.translate(side * 36 + hipD * 0.5, -52); ctx.rotate(side < 0 ? ang + ARM_OFS : -(ang + ARM_OFS));
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 15); ctx.lineWidth = 16; ctx.strokeStyle = O; ctx.stroke();
  ctx.lineWidth = 10.4; ctx.strokeStyle = L.body; ctx.stroke();
  const sl = o?.body && o.body !== 'none' ? sleeveOf(o.body) : null;
  if (sl) {
    ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, sl.len); ctx.lineWidth = 17.5; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = sl.col; ctx.stroke();
    if (sl.cuff) { ctx.beginPath(); ctx.moveTo(-6, sl.len - 1); ctx.lineTo(6, sl.len - 1); ctx.lineWidth = 3.4; ctx.strokeStyle = sl.cuff; ctx.stroke(); }
    ctx.lineCap = 'round';
  }
  ell(ctx, 0, 18, 7.6, 7); ctx.fillStyle = L.paw; ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = O; ctx.stroke();
  ctx.lineWidth = 1.4; ctx.strokeStyle = rgba(O, 0.55); for (const fx of [-2.6, 2.6]) { ctx.beginPath(); ctx.moveTo(fx, 25); ctx.lineTo(fx, 21.5); ctx.stroke(); }
  const pr = side < 0 ? p.propL : p.propR, prr = side < 0 ? p.propRotL : p.propRotR;
  if (pr !== 'none') { ctx.translate(0, 13 / HS); ctx.scale(1 / HS, 1 / HS); ctx.rotate(prr * (side < 0 ? 1 : -1) - (side < 0 ? ARM_OFS : -ARM_OFS)); drawProp(ctx, pr, O, t); }
  ctx.restore();
}
function drawFeet(ctx: CanvasRenderingContext2D, id: HamId, p: Pose, back: boolean) {
  const L = LOOK[id];
  for (const side of [-1, 1] as const) {
    const lift = (side < 0 ? p.legL : p.legR) / HS, ox = (side < 0 ? p.legLx : p.legRx) / HS;
    ctx.save(); ctx.translate(side * 23 + ox, -4 - lift);
    ell(ctx, 0, 0, 14.5, 8.2); ctx.fillStyle = back ? L.body : L.paw; ctx.fill(); ctx.lineWidth = 2.8; ctx.strokeStyle = O; ctx.stroke();
    ctx.fillStyle = L.pawDark;
    if (!back) { ell(ctx, 0, 1.5, 5, 3.4); ctx.fill(); for (const tx of [-7, 0, 7]) { ell(ctx, tx, -3.6, 2.1, 1.8); ctx.fill(); } }
    else { ctx.fillStyle = L.paw; ell(ctx, 0, 3, 10, 4); ctx.fill(); }
    ctx.restore();
  }
}

/**
 * Deseneaza hamsterul cu originea la mijlocul talpilor (ca drawCharacter). flip = -1 priveste spre stanga.
 */
export function drawHamster(ctx: CanvasRenderingContext2D, id: HamId, p: Pose, x: number, y: number, scale: number, flip: 1 | -1, t: number, o?: Outfit) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale * flip, scale); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (p.headOnly) {
    ctx.translate(p.dx, p.dy); ctx.rotate(p.rot); ctx.scale(HS, HS);
    drawHead(ctx, id, p, t, o, bucket(ctx)); ctx.restore(); return;
  }
  const lift = Math.max(0, -p.dy), sh = p.shadowScale * Math.max(0.35, 1 - lift / 160);
  ctx.fillStyle = 'rgba(60,35,30,0.18)'; ell(ctx, p.dx * 0.6, 1, 27 * sh, 6.5 * sh); ctx.fill();
  ctx.translate(p.dx, p.dy); ctx.rotate(p.rot); ctx.scale(p.sx, p.sy); ctx.scale(HS, HS);
  const k = bucket(ctx), back = p.back, hipD = p.hip / HS;
  const body = o?.body && o.body !== 'none' ? o.body : '';
  const neck = o?.neck && o.neck !== 'none' ? o.neck : '';
  const longGown = body === 'mireasa' || body === 'rochie';
  const arms: [-1 | 1, number][] = [[-1, p.armL], [1, p.armR]];
  const up = (a: number) => a + ARM_OFS >= 1.75;
  if (back) for (const [side, ang] of arms) if (!up(ang)) drawArm(ctx, id, p, side, ang, hipD, o, t);
  if (longGown) drawFeet(ctx, id, p, back);
  if (body) drawBodyWear(ctx, body, 'behind', back, geo(id).bodyP, hipD, t);
  ctx.save(); ctx.translate(hipD, 0); blit(ctx, bodySprite(id, back, k));
  if (p.sickTint > 0) { ctx.clip(geo(id).bodyP); ctx.fillStyle = `rgba(150,210,120,${0.42 * p.sickTint})`; ctx.fillRect(-70, -100, 140, 110); }
  ctx.restore();
  if (back) { ell(ctx, hipD, -12, 8, 6.5); ctx.fillStyle = LOOK[id].body; ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = O; ctx.stroke(); }
  if (body) drawBodyWear(ctx, body, 'front', back, geo(id).bodyP, hipD, t);
  if (!longGown) drawFeet(ctx, id, p, back);
  if (o?.pin && !back) drawPinWear(ctx, o.pin, t);
  if (!back) for (const [side, ang] of arms) if (!up(ang)) drawArm(ctx, id, p, side, ang, hipD, o, t);
  ctx.save(); ctx.translate(p.headDx / HS, HEAD_Y + p.headDy / HS); ctx.rotate(p.headRot);
  drawHead(ctx, id, p, t, o, k);
  ctx.restore();
  if (neck) drawNeckWear(ctx, neck, back, t);
  else if (id === 'dudu' && !back && body !== 'costum' && body !== 'mire' && body !== 'hanorac' && body !== 'geaca') drawBowtieId(ctx);
  if (body) drawBodyWear(ctx, body, 'collar', back, geo(id).bodyP, hipD, t);
  for (const [side, ang] of arms) if (up(ang)) drawArm(ctx, id, p, side, ang, hipD, o, t);
  ctx.restore();
}
