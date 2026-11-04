// Produsele tarabei, desenate (nu emoji). Fiecare nivel arata mai bogat.
import { heartPath, starPath } from '../char/draw';

const O = '#3a2a22';
type C = CanvasRenderingContext2D;
const E = (c: C, x: number, y: number, rx: number, ry: number, fill: string, st = true, lw = 2) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } };
const R = (c: C, x: number, y: number, w: number, h: number, r: number, fill: string, st = true, lw = 2) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } };

function flower(c: C, x: number, y: number, r: number, col: string, stem = 0) {
  if (stem) { c.strokeStyle = '#3d8b3d'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 2, y + stem / 2, x + 1, y + stem); c.stroke(); }
  for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; E(c, x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75, r * 0.55, r * 0.55, col, true, 1.3); }
  E(c, x, y, r * 0.42, r * 0.42, '#ffd23f', true, 1.3);
}
function leaf(c: C, x: number, y: number, a: number, l: number) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(l * 0.5, -l * 0.35, l, 0); c.quadraticCurveTo(l * 0.5, l * 0.35, 0, 0); c.fillStyle = '#7cc576'; c.fill(); c.strokeStyle = O; c.lineWidth = 1.3; c.stroke(); c.restore(); }
function carrot(c: C, x: number, y: number, s: number, a = 0) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  for (const k of [-1, 0, 1]) leaf(c, 0, -10, -1.57 + k * 0.4, 9);
  c.beginPath(); c.moveTo(-6, -10); c.quadraticCurveTo(-5, 4, 0, 16); c.quadraticCurveTo(5, 4, 6, -10); c.closePath(); c.fillStyle = '#ff8c42'; c.fill(); c.strokeStyle = O; c.lineWidth = 1.6; c.stroke();
  c.strokeStyle = '#d96a22'; c.lineWidth = 1; for (const yy of [-4, 2, 8]) { c.beginPath(); c.moveTo(-4, yy); c.lineTo(-1, yy + 1); c.stroke(); }
  c.restore();
}
function tomato(c: C, x: number, y: number, r: number) { E(c, x, y, r, r * 0.9, '#e63946'); E(c, x - r * 0.35, y - r * 0.3, r * 0.22, r * 0.15, '#ffffff88', false); c.fillStyle = '#3d8b3d'; starPath(c, x, y - r * 0.8, r * 0.45, r * 0.18, 5); c.fill(); }
function cabbage(c: C, x: number, y: number, r: number) { E(c, x, y, r, r * 0.92, '#a6dc93'); E(c, x, y + 1, r * 0.65, r * 0.6, '#c8efb5', true, 1.2); c.strokeStyle = '#5c9e52'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y + r * 0.2, r * 0.4, 3.6, 5.8); c.stroke(); }
function basket(c: C, x: number, y: number, w: number, h: number) {
  R(c, x - w / 2, y - h / 2, w, h, 6, '#d9a273');
  c.strokeStyle = '#a8743f'; c.lineWidth = 1.3; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x - w / 2 + 2, y - h / 2 + i * h / 4); c.lineTo(x + w / 2 - 2, y - h / 2 + i * h / 4); c.stroke(); }
  for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(x - w / 2 + i * w / 5, y - h / 2 + 1); c.lineTo(x - w / 2 + i * w / 5, y + h / 2 - 1); c.stroke(); }
}
function cup(c: C, x: number, y: number, w: number, h: number, fill: string) {
  c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2); c.lineTo(x + w * 0.38, y + h / 2); c.lineTo(x - w * 0.38, y + h / 2); c.closePath();
  c.fillStyle = '#ffffffcc'; c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke();
  c.save(); c.clip(); c.fillStyle = fill; c.fillRect(x - w / 2, y - h / 2 + h * 0.2, w, h); c.restore();
  c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2); c.lineTo(x + w * 0.38, y + h / 2); c.lineTo(x - w * 0.38, y + h / 2); c.closePath(); c.strokeStyle = O; c.stroke();
}

export const ITEM_NAMES: Record<string, string[]> = {
  flower: ['Floricică', 'Două flori', 'Buchețel', 'Buchet mare', 'Coș cu flori', 'Coroniță'],
  veg: ['Morcov', 'Legătură de morcovi', 'Coș cu legume', 'Ladă de legume', 'Oala cu ciorbă'],
  sweet: ['Făină', 'Aluat', 'Biscuiți', 'Brioșă', 'Tort'],
  drink: ['Lămâie', 'Limonadă', 'Bubble tea', 'Cocktail de fructe'],
};
export const MAX_LVL: Record<string, number> = { flower: 5, veg: 4, sweet: 4, drink: 3 };

/** deseneaza produsul "lant:nivel" centrat in (x,y), marime s (latimea celulei) */
export function drawItem(c: C, code: string, x: number, y: number, s: number, t = 0) {
  const [ch, ls] = code.split(':'); const l = +ls;
  c.save(); c.translate(x, y); c.scale(s / 56, s / 56); c.lineJoin = 'round'; c.lineCap = 'round';
  switch (ch) {
    case 'flower':
      if (l === 0) { leaf(c, 0, 8, -2.4, 10); flower(c, 0, -4, 9, '#ff9ab8', 18); }
      else if (l === 1) { flower(c, -7, -6, 8, '#ff9ab8', 20); flower(c, 8, -2, 8, '#c77dff', 16); }
      else if (l === 2) {
        for (const [dx, dy, col] of [[-9, -10, '#ff9ab8'], [8, -12, '#ffd23f'], [0, -2, '#c77dff']] as const) flower(c, dx, dy, 7.5, col);
        c.beginPath(); c.moveTo(-10, 4); c.lineTo(10, 4); c.lineTo(3, 22); c.lineTo(-3, 22); c.closePath(); c.fillStyle = '#7cc576'; c.fill(); c.strokeStyle = O; c.lineWidth = 1.6; c.stroke();
        c.fillStyle = '#ff4d6d'; c.fillRect(-5, 10, 10, 4);
      } else if (l === 3) {
        c.beginPath(); c.moveTo(-18, -6); c.lineTo(18, -6); c.lineTo(4, 24); c.lineTo(-4, 24); c.closePath(); c.fillStyle = '#fff6e0'; c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke();
        for (const [dx, dy, col] of [[-12, -12, '#ff9ab8'], [12, -12, '#ffd23f'], [0, -18, '#c77dff'], [-5, -5, '#ff7aa2'], [7, -4, '#fff']] as const) flower(c, dx, dy, 7, col);
        c.save(); c.translate(0, 10); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(sd * 9, -5); c.lineTo(sd * 9, 5); c.closePath(); c.fillStyle = '#ff4d6d'; c.fill(); c.stroke(); } c.restore();
      } else if (l === 4) {
        c.strokeStyle = '#a8743f'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 20, Math.PI, 0); c.stroke();
        for (const [dx, dy, col] of [[-14, -2, '#ff9ab8'], [-4, -8, '#ffd23f'], [7, -6, '#c77dff'], [15, -1, '#ff7aa2'], [2, 0, '#fff']] as const) flower(c, dx, dy, 7, col);
        basket(c, 0, 12, 40, 20);
      } else {
        c.strokeStyle = '#3d8b3d'; c.lineWidth = 5; c.beginPath(); c.ellipse(0, 4, 22, 13, 0, 0, 7); c.stroke();
        for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; flower(c, Math.cos(a) * 22, 4 + Math.sin(a) * 13, 5.5, ['#ff9ab8', '#ffd23f', '#c77dff', '#fff'][i % 4]); }
        c.save(); c.translate(0, 18); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(sd * 8, 8); c.lineTo(sd * 3, 9); c.closePath(); c.fillStyle = '#ff4d6d'; c.fill(); c.strokeStyle = O; c.lineWidth = 1.3; c.stroke(); } c.restore();
      }
      break;
    case 'veg':
      if (l === 0) carrot(c, 0, 0, 1.15, 0.4);
      else if (l === 1) { carrot(c, -7, 0, 1, -0.3); carrot(c, 7, 0, 1, 0.3); carrot(c, 0, 2, 1.05, 0); c.fillStyle = '#ff4d6d'; c.fillRect(-7, -6, 14, 4); }
      else if (l === 2) { carrot(c, -10, -6, 0.8, -0.4); tomato(c, 7, -6, 8); cabbage(c, -1, -3, 9); basket(c, 0, 10, 38, 18); }
      else if (l === 3) {
        R(c, -22, -2, 44, 22, 3, '#c98e5f');
        for (let i = 0; i < 3; i++) { c.strokeStyle = '#a0703f'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-22, 5 + i * 6); c.lineTo(22, 5 + i * 6); c.stroke(); }
        tomato(c, -12, -6, 7); cabbage(c, 2, -8, 9); carrot(c, 14, -8, 0.8, 0.9); tomato(c, -2, -3, 6);
      } else {
        for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; c.globalAlpha = 1 - k; E(c, -8 + i * 8, -20 - k * 14, 4 + k * 4, 4 + k * 4, '#ffffff', false); } c.globalAlpha = 1;
        R(c, -20, -10, 40, 28, 10, '#c0c6cc'); E(c, 0, -10, 20, 6, '#ffb36b'); E(c, -6, -11, 3, 1.5, '#ff8c42', false); E(c, 6, -9, 3, 1.5, '#7cc576', false);
        R(c, -26, -6, 7, 5, 2, '#9aa5ad'); R(c, 19, -6, 7, 5, 2, '#9aa5ad');
      }
      break;
    case 'sweet':
      if (l === 0) { R(c, -14, -14, 28, 32, 8, '#f5ead6'); c.fillStyle = '#c9a678'; c.fillRect(-14, -10, 28, 4); c.font = '800 9px "Baloo 2", sans-serif'; c.fillStyle = O; c.textAlign = 'center'; c.fillText('FĂINĂ', 0, 8); }
      else if (l === 1) { E(c, 0, 4, 18, 13, '#fbe1b4'); E(c, -5, 0, 5, 3, '#fff4dd', false); R(c, -20, 14, 40, 6, 3, '#d9a273'); }
      else if (l === 2) { for (const [dx, dy] of [[-9, 4], [9, 4], [0, -6]]) { E(c, dx, dy, 11, 9, '#e8b46a'); for (let k = 0; k < 3; k++) E(c, dx - 4 + k * 4, dy - 1 + (k % 2) * 3, 1.6, 1.6, '#6b3e1f', false); } }
      else if (l === 3) {
        c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.lineTo(10, 18); c.lineTo(-10, 18); c.closePath(); c.fillStyle = '#7ab8ff'; c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke();
        for (const [dx, dy, r] of [[-8, -3, 8], [8, -3, 8], [0, -10, 9]]) E(c, dx, dy, r, r * 0.8, '#ffd6e4');
        E(c, 0, -19, 4, 4, '#e63946'); c.fillStyle = '#fff'; for (const [dx, dy] of [[-6, -6], [5, -8], [1, -2]]) c.fillRect(dx, dy, 3, 1.5);
      } else {
        R(c, -22, -2, 44, 20, 5, '#fff3e0'); R(c, -22, -2, 44, 6, 3, '#ff9ab8'); R(c, -15, -16, 30, 16, 5, '#fff3e0'); R(c, -15, -16, 30, 5, 3, '#ff9ab8');
        for (const dx of [-7, 0, 7]) { R(c, dx - 1.5, -26, 3, 10, 1, '#7ab8ff', true, 1); E(c, dx, -28, 2, 3, '#ffd23f', false); }
        heartPath(c, 0, 8, 5); c.fillStyle = '#e63946'; c.fill();
      }
      break;
    case 'drink':
      if (l === 0) { E(c, 0, 2, 16, 12, '#ffe066'); E(c, 14, 0, 4, 3, '#ffe066', true, 1.5); leaf(c, -10, -9, -2.6, 10); E(c, -5, -2, 4, 2, '#ffffffaa', false); }
      else if (l === 1) { cup(c, 0, 2, 26, 30, '#fff3a0'); E(c, 10, -12, 7, 7, '#ffe066'); c.strokeStyle = '#ff4d6d'; c.lineWidth = 3; c.beginPath(); c.moveTo(-3, -12); c.lineTo(-8, -24); c.stroke(); }
      else if (l === 2) { cup(c, 0, 2, 26, 32, '#e7c9a0'); c.fillStyle = '#3a2418'; for (let i = 0; i < 7; i++) E(c, -8 + (i % 4) * 5, 12 + Math.floor(i / 4) * 4, 2, 2, '#3a2418', false); c.strokeStyle = '#ff6f91'; c.lineWidth = 4; c.beginPath(); c.moveTo(3, -14); c.lineTo(7, -26); c.stroke(); }
      else { cup(c, 0, 4, 28, 30, '#ff8fab'); E(c, -9, -10, 6, 6, '#ffe066'); c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(6, -10); c.lineTo(10, -26); c.stroke(); c.beginPath(); c.moveTo(-2, -26); c.quadraticCurveTo(10, -36, 22, -26); c.closePath(); c.fillStyle = '#4cc9f0'; c.fill(); c.stroke(); E(c, 12, -10, 3.5, 3.5, '#e63946'); }
      break;
  }
  c.restore();
}

/** iconita generatorului (sursa reala din inventar) */
export function drawSource(c: C, ch: string, x: number, y: number, s: number) {
  drawItem(c, `${ch}:0`, x, y, s);
}

/** iconita unui produs de taraba (pentru inventar, in pagina) */
const prodUrls: Record<string, string> = {};
export function itemIconURL(code: string) {
  if (prodUrls[code]) return prodUrls[code];
  const cv = document.createElement('canvas'); cv.width = cv.height = 96; const c = cv.getContext('2d')!;
  drawItem(c, code, 48, 50, 84, 0);
  return (prodUrls[code] = cv.toDataURL());
}
