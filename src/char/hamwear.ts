// Hainele hamsterilor (1.14.0), desenate pe forma lor, din fata si din spate.
// Unitati de desen (vezi hamster.ts): talpile in 0, corpul are centrul in (0,-42) si raza ~50x42, barbia e pe la y -52.
// Capul: centrul in (0,0), raza ~60x54, crestetul pe la -54, urechile in (+-36,-44).
import { heartPath, starPath } from './draw';
import { drawPin } from './outfit';

const O = '#4a2a22';
const TAU = Math.PI * 2;
type C = CanvasRenderingContext2D;
const ell = (c: C, x: number, y: number, rx: number, ry: number, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
const st = (c: C, fill: string | CanvasGradient, lw = 2.6) => { c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = O; c.stroke(); };
const lin = (c: C, y0: number, y1: number, a: string, b: string) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
/** umbra moale a tesaturii: mai inchisa pe margini, lumina sus-stanga */
function shade(c: C, a = 0.18) {
  const g = c.createRadialGradient(-16, -64, 6, 0, -40, 70); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(50,25,20,${a})`);
  c.fillStyle = g; c.fillRect(-80, -110, 160, 120);
}
function hemLine(c: C, y: number, curve = 5, lw = 2.6) { c.beginPath(); c.moveTo(-64, y); c.quadraticCurveTo(0, y + curve, 64, y); c.lineWidth = lw; c.strokeStyle = O; c.stroke(); }
function dots(c: C, col: string, r: number, step: number, y0 = -100, y1 = 4) { c.fillStyle = col; for (let y = y0; y < y1; y += step) for (let x = -64; x < 64; x += step) { ell(c, x + ((Math.round(y / step)) % 2 ? step / 2 : 0), y, r, r); c.fill(); } }
function button(c: C, x: number, y: number, r = 2.8, col = '#ffd23f') { ell(c, x, y, r, r); st(c, col, 1.6); c.fillStyle = 'rgba(255,255,255,0.7)'; ell(c, x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.3); c.fill(); }
function bow(c: C, x: number, y: number, s: number, rot: number, c1: string, c2: string, spots = false) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const loop = (side: number) => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(side * 6, -15, side * 26, -16, side * 25, -1); c.bezierCurveTo(side * 26, 13, side * 6, 13, 0, 0); c.closePath(); };
  for (const side of [-1, 1]) { c.beginPath(); c.moveTo(side * 2, 2); c.quadraticCurveTo(side * 8, 10, side * 7, 17); c.lineTo(side * 11, 14); c.lineTo(side * 14, 18); c.quadraticCurveTo(side * 13, 8, side * 5, 1); c.closePath(); st(c, c2, 2.4 / s); }
  for (const side of [-1, 1]) {
    loop(side); c.fillStyle = lin(c, -14, 12, c1, c2); c.fill();
    if (spots) { c.save(); loop(side); c.clip(); c.fillStyle = 'rgba(255,255,255,0.85)'; for (const [px, py] of [[9, -6], [17, 2], [14, -10], [21, -5], [8, 4]]) { ell(c, side * px, py, 1.8, 1.8); c.fill(); } c.restore(); }
    loop(side); c.lineWidth = 2.6 / s; c.strokeStyle = O; c.stroke();
    c.beginPath(); c.moveTo(side * 6, -3); c.quadraticCurveTo(side * 12, -1, side * 15, 3); c.lineWidth = 1.4 / s; c.strokeStyle = 'rgba(74,42,34,0.45)'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.6)'; ell(c, side * 15, -7, 4, 2, side * 0.3); c.fill();
  }
  c.beginPath(); c.roundRect(-5, -6, 10, 12, 4); st(c, c2, 2.4 / s);
  c.restore();
}
function flower(c: C, x: number, y: number, r: number, col: string, mid = '#ffd23f') {
  for (let k = 0; k < 5; k++) { const a = k * TAU / 5 - Math.PI / 2; ell(c, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, r * 0.5); c.fillStyle = col; c.fill(); c.lineWidth = 1.3; c.strokeStyle = O; c.stroke(); }
  ell(c, x, y, r * 0.34, r * 0.34); c.fillStyle = mid; c.fill(); c.lineWidth = 1.2; c.stroke();
}

export interface Sleeve { col: string; len: number; cuff?: string }
const SLEEVES: Record<string, Sleeve> = {
  ie: { col: '#fffaf0', len: 16, cuff: '#d62828' }, rochita: { col: '#f7a8b8', len: 7, cuff: '#ffffff' }, tricou: { col: '#9ccbf0', len: 8, cuff: '#7fb3de' },
  pulover: { col: '#7cb870', len: 16, cuff: '#5e9a54' }, costum: { col: '#2f3b5c', len: 16, cuff: '#ffffff' }, mire: { col: '#23232b', len: 16, cuff: '#ffffff' },
  pijama: { col: '#bfe0ff', len: 16, cuff: '#ffffff' }, hanorac: { col: '#c9b6f2', len: 16, cuff: '#ad97e3' }, geaca: { col: '#e5484d', len: 16, cuff: '#ffffff' },
};
export const sleeveOf = (id: string): Sleeve | null => SLEEVES[id] ?? null;
/** palariile mari ascund urechile */
export const wearHides = (head: string) => ({ ears: head === 'beanie' || head === 'palarie' || head === 'batic' || head === 'cowboy' });

// =====================================================================================
// corp
// =====================================================================================
/**
 * layer: 'behind' (inainte de corp: cozi de frac, trena), 'front' (peste corp, inainte de cap), 'collar' (dupa cap: guler pufos).
 */
export function drawBodyWear(c: C, id: string, layer: 'behind' | 'front' | 'collar', back: boolean, body: Path2D, hip: number, t: number) {
  c.save(); c.translate(hip, 0); c.lineJoin = 'round'; c.lineCap = 'round';
  const inBody = (fn: () => void) => { c.save(); c.clip(body); fn(); c.restore(); };
  const outline = () => { c.lineWidth = 3.2; c.strokeStyle = O; c.stroke(body); };
  const top = (col: string | CanvasGradient, y1: number, curve = 5) => { // bluza / bustul pana la y1
    c.beginPath(); c.moveTo(-70, -110); c.lineTo(70, -110); c.lineTo(70, y1); c.quadraticCurveTo(0, y1 + curve, -70, y1); c.closePath(); c.fillStyle = col; c.fill();
  };
  const skirt = (y0: number, wTop: number, wBot: number, yBot: number, scallop: number) => {
    c.beginPath(); c.moveTo(-wTop, y0); c.bezierCurveTo(-wTop - 6, y0 + 10, -wBot + 4, yBot - 12, -wBot, yBot);
    const n = Math.max(3, Math.round(wBot / 8)); for (let i = 0; i < n; i++) { const x0 = -wBot + (2 * wBot) * i / n, x1 = -wBot + (2 * wBot) * (i + 1) / n; c.quadraticCurveTo((x0 + x1) / 2, yBot + scallop, x1, yBot); }
    c.bezierCurveTo(wBot - 4, yBot - 12, wTop + 6, y0 + 10, wTop, y0); c.closePath();
  };
  switch (id) {
    case 'ie': if (layer !== 'front') break; inBody(() => {
      top(lin(c, -90, -16, '#fffaf0', '#f6ead6'), -16, 5); shade(c, 0.2);
      // banda cusuta de la poale si altita din mijloc (romburi rosii si negre)
      for (let x = -56; x <= 56; x += 8) { c.fillStyle = (Math.round(x / 8) % 2) ? '#1f1512' : '#d62828'; c.beginPath(); c.moveTo(x, -23); c.lineTo(x + 3, -20); c.lineTo(x, -17); c.lineTo(x - 3, -20); c.closePath(); c.fill(); }
      c.strokeStyle = '#d62828'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-60, -26); c.quadraticCurveTo(0, -22, 60, -26); c.stroke();
      if (!back) {
        for (let y = -52; y <= -30; y += 7) { const k = Math.round((y + 52) / 7) % 2; c.fillStyle = k ? '#1f1512' : '#d62828'; c.beginPath(); c.moveTo(0, y - 3.4); c.lineTo(3.4, y); c.lineTo(0, y + 3.4); c.lineTo(-3.4, y); c.closePath(); c.fill(); for (const s of [-1, 1]) { c.fillStyle = '#d62828'; ell(c, s * 7, y, 1.3, 1.3); c.fill(); } }
      } else { for (let k = 0; k < 8; k++) { const a = k * TAU / 8; c.fillStyle = k % 2 ? '#1f1512' : '#d62828'; ell(c, Math.cos(a) * 8, -44 + Math.sin(a) * 8, 2.2, 2.2); c.fill(); } ell(c, 0, -44, 3, 3); c.fillStyle = '#d62828'; c.fill(); }
      hemLine(c, -16, 5);
    }); outline(); break;
    case 'vesta': if (layer !== 'front') break; inBody(() => {
      const red = lin(c, -90, 0, '#c43a44', '#97222c');
      if (!back) {
        for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 80, -110); c.lineTo(s * 9, -110); c.lineTo(s * 9, -56); c.quadraticCurveTo(s * 13, -30, s * 17, -12); c.lineTo(s * 80, -12); c.closePath(); c.fillStyle = red; c.fill();
          c.lineWidth = 2.4; c.strokeStyle = O; c.beginPath(); c.moveTo(s * 9, -60); c.quadraticCurveTo(s * 13, -30, s * 17, -12); c.stroke();
          c.strokeStyle = '#1f1512'; c.lineWidth = 3; c.beginPath(); c.moveTo(s * 13, -58); c.quadraticCurveTo(s * 17, -32, s * 21, -14); c.stroke();
          for (let y = -54; y <= -18; y += 6) { c.fillStyle = '#ffd23f'; ell(c, s * (13 + (y + 58) * 0.2), y, 1.2, 1.2); c.fill(); }
          flower(c, s * 32, -36, 5.5, '#fff1d6', '#1f1512'); for (const dy of [-8, 8]) { c.fillStyle = '#3f7d3a'; ell(c, s * 32 + dy * 0.6, -36 + dy, 2.6, 1.3, 0.7); c.fill(); }
        }
        button(c, -18, -40, 2.6); button(c, -20, -28, 2.6);
      } else {
        c.fillStyle = red; c.fillRect(-80, -110, 160, 98);
        c.strokeStyle = '#ffd23f'; c.lineWidth = 1.6; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; c.beginPath(); c.moveTo(Math.cos(a) * 8, -40 + Math.sin(a) * 8); c.lineTo(Math.cos(a) * 15, -40 + Math.sin(a) * 15); c.stroke(); }
        ell(c, 0, -40, 6.5, 6.5); st(c, '#ffd23f', 1.6);
      }
      shade(c, 0.2);
      c.fillStyle = '#1f1512'; for (let x = -60; x <= 60; x += 6) { if (!back && Math.abs(x) < 20) continue; c.fillRect(x - 1.4, -17, 2.8, 2.8); }
      hemLine(c, -12, 0);
    }); outline(); break;
    case 'salopeta': if (layer !== 'front') break; inBody(() => {
      const den = lin(c, -60, 0, '#5b8be0', '#3d6cc0');
      c.beginPath(); c.moveTo(-70, -32); c.quadraticCurveTo(0, -28, 70, -32); c.lineTo(70, 10); c.lineTo(-70, 10); c.closePath(); c.fillStyle = den; c.fill();
      if (!back) {
        c.beginPath(); c.roundRect(-19, -58, 38, 30, 4); c.fillStyle = den; c.fill(); c.lineWidth = 2.4; c.strokeStyle = O; c.stroke();
        c.setLineDash([3, 2.4]); c.strokeStyle = '#ffd23f'; c.lineWidth = 1.2; c.beginPath(); c.roundRect(-11, -52, 22, 14, 3); c.stroke(); c.setLineDash([]);
        heartPath(c, 0, -45, 4); c.fillStyle = '#ff7aa2'; c.fill();
        c.strokeStyle = den; c.lineWidth = 8; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 14, -56); c.lineTo(s * 30, -80); c.stroke(); }
        c.strokeStyle = O; c.lineWidth = 1.6; for (const s of [-1, 1]) for (const d of [-4, 4]) { c.beginPath(); c.moveTo(s * 14 + d, -56); c.lineTo(s * 30 + d, -80); c.stroke(); }
        for (const s of [-1, 1]) button(c, s * 14, -55, 3);
        c.strokeStyle = 'rgba(30,50,110,0.55)'; c.lineWidth = 1.4; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 26, -30); c.quadraticCurveTo(s * 30, -20, s * 42, -20); c.stroke(); }
      } else {
        c.strokeStyle = den; c.lineWidth = 8; c.beginPath(); c.moveTo(-32, -82); c.lineTo(18, -30); c.moveTo(32, -82); c.lineTo(-18, -30); c.stroke();
        c.strokeStyle = O; c.lineWidth = 1.6; for (const d of [-4, 4]) { c.beginPath(); c.moveTo(-32 + d, -82); c.lineTo(18 + d, -30); c.moveTo(32 + d, -82); c.lineTo(-18 + d, -30); c.stroke(); }
        c.beginPath(); c.roundRect(-12, -24, 24, 16, 3); c.lineWidth = 1.6; c.strokeStyle = 'rgba(30,50,110,0.7)'; c.stroke();
        c.setLineDash([3, 2.4]); c.strokeStyle = '#ffd23f'; c.lineWidth = 1.1; c.beginPath(); c.roundRect(-9, -21, 18, 10, 2); c.stroke(); c.setLineDash([]);
      }
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1; for (let x = -60; x < 60; x += 4) { c.beginPath(); c.moveTo(x, -30); c.lineTo(x + 6, 4); c.stroke(); }
      shade(c, 0.2); hemLine(c, -32, 4, 2.4);
    }); outline(); break;
    case 'rochita': {
      if (layer === 'front') {
        inBody(() => { top('#f7a8b8', -30, 0); dots(c, '#fff', 2.6, 10, -100, -28); shade(c, 0.15); });
        skirt(-34, 42, 58, -2, 5); c.fillStyle = lin(c, -34, 0, '#f9b7c5', '#ef8fa6'); c.fill();
        c.save(); skirt(-34, 42, 58, -2, 5); c.clip(); dots(c, '#fff', 2.8, 11, -32, 6); c.strokeStyle = 'rgba(160,60,90,0.25)'; c.lineWidth = 1.6; for (const x of [-30, -12, 8, 26]) { c.beginPath(); c.moveTo(x * 0.7, -30); c.quadraticCurveTo(x, -16, x * 1.15, -2); c.stroke(); } c.restore();
        skirt(-34, 42, 58, -2, 5); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
        c.fillStyle = '#fff'; for (let x = -54; x <= 54; x += 7.7) { ell(c, x, 0.5, 4, 2.6); c.fill(); }
        c.beginPath(); c.roundRect(-44, -37, 88, 6, 3); st(c, '#ffffff', 2);
        if (!back) bow(c, 0, -34, 0.42, 0, '#ff9dbb', '#ff6890'); else bow(c, 0, -34, 0.9, 0, '#ff9dbb', '#ff6890');
        outline();
      }
      if (layer === 'collar' && !back) for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, -55); c.quadraticCurveTo(s * 6, -46, s * 18, -50); c.quadraticCurveTo(s * 16, -57, s * 8, -58); c.closePath(); st(c, '#ffffff', 2); }
      break;
    }
    case 'tricou': if (layer !== 'front') break; inBody(() => {
      top(lin(c, -90, -10, '#a9d4f5', '#86bbe8'), -16, 5); dots(c, '#fff', 2.6, 10, -100, -18);
      c.beginPath(); c.moveTo(-70, -22); c.quadraticCurveTo(0, -17, 70, -22); c.lineTo(70, -16); c.quadraticCurveTo(0, -11, -70, -16); c.closePath(); c.fillStyle = '#7fb3de'; c.fill();
      if (!back) { heartPath(c, 18, -40, 6); c.fillStyle = '#ff7aa2'; c.fill(); c.lineWidth = 1.4; c.strokeStyle = O; c.stroke(); }
      shade(c, 0.15); hemLine(c, -16, 5);
    }); outline(); break;
    case 'pulover': if (layer !== 'front') break; inBody(() => {
      top(lin(c, -90, -10, '#8cc77f', '#6aa95e'), -12, 5);
      c.strokeStyle = '#fff6e0'; c.lineWidth = 2.2; c.beginPath(); for (let x = -64; x <= 64; x += 6) c.lineTo(x, -46 + ((Math.round(x / 6)) % 2 ? 3 : -3)); c.stroke();
      c.fillStyle = '#fff6e0'; for (let x = -60; x <= 60; x += 12) { ell(c, x, -38, 1.6, 1.6); c.fill(); }
      c.strokeStyle = 'rgba(40,80,35,0.45)'; c.lineWidth = 1.8;
      for (const cx of back ? [-24, 0, 24] : [-18, 18]) for (let y = -32; y < -14; y += 6) { c.beginPath(); c.moveTo(cx - 3, y); c.quadraticCurveTo(cx + 3, y + 3, cx - 3, y + 6); c.moveTo(cx + 3, y); c.quadraticCurveTo(cx - 3, y + 3, cx + 3, y + 6); c.stroke(); }
      c.fillStyle = '#5e9a54'; c.beginPath(); c.moveTo(-70, -19); c.quadraticCurveTo(0, -14, 70, -19); c.lineTo(70, -12); c.quadraticCurveTo(0, -7, -70, -12); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(30,60,25,0.5)'; c.lineWidth = 1; for (let x = -60; x <= 60; x += 4) { c.beginPath(); c.moveTo(x, -18); c.lineTo(x, -11); c.stroke(); }
      shade(c, 0.18); hemLine(c, -12, 5);
    }); outline(); break;
    case 'rochie': {
      if (layer === 'front') {
        const red = lin(c, -80, 4, '#de1f45', '#97102b');
        inBody(() => {
          if (!back) { top(red, -30, 0); c.fillStyle = 'rgba(255,255,255,0.22)'; ell(c, -18, -46, 6, 14, 0.3); c.fill(); }
          else { c.beginPath(); c.moveTo(-70, -110); c.lineTo(70, -110); c.lineTo(70, -30); c.lineTo(-70, -30); c.closePath(); c.moveTo(-26, -110); c.lineTo(0, -44); c.lineTo(26, -110); c.closePath(); c.fillStyle = red; c.fill('evenodd'); }
          shade(c, 0.25);
        });
        if (back) { c.lineWidth = 2.4; c.strokeStyle = O; c.beginPath(); c.moveTo(-20, -60); c.lineTo(0, -44); c.lineTo(20, -60); c.stroke(); }
        skirt(-33, 40, 64, 3, 2); c.fillStyle = red; c.fill();
        c.save(); skirt(-33, 40, 64, 3, 2); c.clip(); c.strokeStyle = 'rgba(80,0,20,0.35)'; c.lineWidth = 2; for (const x of [-36, -16, 6, 28]) { c.beginPath(); c.moveTo(x * 0.6, -30); c.quadraticCurveTo(x, -12, x * 1.25, 4); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,0.2)'; ell(c, -26, -14, 5, 16, 0.2); c.fill();
        for (let i = 0; i < 9; i++) { const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7); c.fillStyle = `rgba(255,240,200,${a})`; starPath(c, -40 + i * 10, -22 + (i % 3) * 8, 2.2, 0.8, 4, 0); c.fill(); }
        c.restore();
        skirt(-33, 40, 64, 3, 2); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
        c.beginPath(); c.roundRect(-44, -37, 88, 6, 3); st(c, lin(c, -37, -31, '#ffe27a', '#e3a91c'), 2);
        if (!back) { ell(c, 0, -34, 4, 4); st(c, '#7fd8ff', 1.6); } else bow(c, 0, -34, 0.8, 0, '#e8304f', '#a8122f');
        outline();
      }
      break;
    }
    case 'costum': case 'mire': {
      const tux = id === 'mire', col = tux ? '#23232b' : '#2f3b5c', col2 = tux ? '#3c3c48' : '#3e4c74';
      if (tux && ((layer === 'behind' && !back) || (layer === 'front' && back))) {
        for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 6, -30); c.quadraticCurveTo(s * 30, -26, s * 40, -10); c.lineTo(s * 30, 8); c.quadraticCurveTo(s * 18, -4, s * 6, -6); c.closePath(); st(c, col, 2.6); }
      }
      if (layer === 'collar' && tux && !back) {
        c.save(); c.translate(0, -54);
        for (const s2 of [-1, 1]) { c.beginPath(); c.moveTo(s2 * 3, 0); c.quadraticCurveTo(s2 * 9, -10, s2 * 16, -8); c.quadraticCurveTo(s2 * 19, 0, s2 * 16, 8); c.quadraticCurveTo(s2 * 9, 10, s2 * 3, 0); c.closePath(); st(c, lin(c, -8, 8, '#3a3a46', '#14141a'), 2.2); c.fillStyle = 'rgba(255,255,255,0.35)'; ell(c, s2 * 11, -4, 3, 1.4, s2 * 0.25); c.fill(); }
        c.beginPath(); c.roundRect(-4.5, -5, 9, 10, 3.5); st(c, '#14141a', 2); c.restore();
      }
      if (layer !== 'front') break;
      inBody(() => {
        top(lin(c, -90, 0, col2, col), 10, 0);
        if (!back) {
          c.beginPath(); c.moveTo(-13, -110); c.lineTo(13, -110); c.lineTo(13, -60); c.lineTo(0, -28); c.lineTo(-13, -60); c.closePath(); c.fillStyle = '#ffffff'; c.fill();
          for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 13, -62); c.lineTo(s * 24, -58); c.lineTo(s * 12, -40); c.lineTo(0, -28); c.closePath(); c.fillStyle = tux ? '#4a4a58' : col2; c.fill(); c.lineWidth = 2; c.strokeStyle = O; c.stroke(); }
          if (!tux) { c.beginPath(); c.moveTo(-3.6, -58); c.lineTo(3.6, -58); c.lineTo(4.6, -38); c.lineTo(0, -32); c.lineTo(-4.6, -38); c.closePath(); st(c, lin(c, -58, -32, '#e8384f', '#b81c33'), 1.6); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1; for (const y of [-52, -45, -38]) { c.beginPath(); c.moveTo(-3, y); c.lineTo(3, y - 3); c.stroke(); } }
          else for (const y of [-50, -42, -34]) { ell(c, 0, y, 1.5, 1.5); c.fillStyle = '#23232b'; c.fill(); }
          button(c, -4, -20, 2.4, tux ? '#d9d9e3' : '#ffd23f'); button(c, -4, -11, 2.4, tux ? '#d9d9e3' : '#ffd23f');
          c.beginPath(); c.moveTo(-1, -26); c.lineTo(-1, 10); c.lineWidth = 1.8; c.strokeStyle = 'rgba(0,0,0,0.45)'; c.stroke();
          if (!tux) { c.beginPath(); c.moveTo(20, -40); c.lineTo(32, -40); c.lineTo(31, -36); c.lineTo(21, -36); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.beginPath(); c.moveTo(22, -40); c.lineTo(25, -45); c.lineTo(28, -40); c.closePath(); c.fill(); }
          else { flower(c, 26, -42, 6, '#ffffff', '#fff3c4'); c.fillStyle = '#7cc576'; ell(c, 31, -37, 3, 1.5, 0.6); c.fill(); }
          c.beginPath(); c.moveTo(-6, 0); c.lineTo(-1, -6); c.lineTo(4, 0); c.lineWidth = 1.8; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.stroke();
        } else {
          c.beginPath(); c.moveTo(0, -60); c.lineTo(0, -6); c.lineWidth = 1.6; c.strokeStyle = 'rgba(0,0,0,0.45)'; c.stroke();
          c.beginPath(); c.moveTo(0, -18); c.lineTo(0, 4); c.lineWidth = 2.2; c.strokeStyle = O; c.stroke();
          for (const s of [-1, 1]) button(c, s * 24, -26, 2, tux ? '#d9d9e3' : '#ffd23f');
        }
        c.fillStyle = 'rgba(255,255,255,0.1)'; ell(c, -24, -44, 6, 16, 0.2); c.fill();
        shade(c, 0.22);
      }); outline();
      break;
    }
    case 'mireasa': {
      if (layer === 'behind' && back) { ell(c, 0, 2, 74, 12); st(c, '#fffdf8', 2.4); }
      if (layer !== 'front') break;
      inBody(() => {
        top('#fffdf8', -30, 0);
        c.strokeStyle = '#e8dccb'; c.lineWidth = 1.2; for (let y = -96; y < -30; y += 6) for (let x = -60; x < 60; x += 8) { c.beginPath(); c.arc(x + (Math.round(y / 6) % 2 ? 4 : 0), y, 3, 0, Math.PI); c.stroke(); }
        shade(c, 0.12);
        if (!back) for (let i = 0; i < 9; i++) { const a = 0.5 + 0.5 * Math.sin(t * 4 + i); c.fillStyle = `rgba(255,214,228,${a})`; ell(c, -24 + i * 6, -44 + (i % 2) * 5, 1.6, 1.6); c.fill(); }
      });
      for (let layerN = 0; layerN < 3; layerN++) {
        const w = 70 - layerN * 8, yb = 4 - layerN * 7;
        skirt(-33, 40, w, yb, 4); c.fillStyle = layerN ? 'rgba(255,255,255,0.75)' : '#fffaf2'; c.fill(); c.lineWidth = 2; c.strokeStyle = layerN ? 'rgba(74,42,34,0.45)' : O; c.stroke();
      }
      c.save(); skirt(-33, 40, 70, 4, 4); c.clip(); for (let i = 0; i < 12; i++) { const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.3); c.fillStyle = `rgba(255,220,235,${a})`; starPath(c, -50 + i * 9, -14 + (i % 3) * 6, 2.2, 0.8, 4, 0); c.fill(); } c.restore();
      c.beginPath(); c.roundRect(-44, -37, 88, 6, 3); st(c, '#f6d7e0', 2);
      if (back) bow(c, 0, -34, 1.05, 0, '#ffe3ec', '#f3bfd0'); else { flower(c, -14, -34, 5, '#ffffff', '#ffd6e4'); flower(c, -4, -36, 4, '#ffd6e4', '#fff'); }
      outline();
      break;
    }
    case 'pijama': if (layer !== 'front') break; inBody(() => {
      c.fillStyle = lin(c, -90, 0, '#cfe7ff', '#a9d0f5'); c.fillRect(-80, -110, 160, 120);
      for (let i = 0; i < 26; i++) { const x = -60 + (i * 37) % 120, y = -96 + ((i * 53) % 96); if (i % 3) { starPath(c, x, y, 3.4, 1.4, 5, 0.3); c.fillStyle = '#fff7c2'; c.fill(); } else { c.fillStyle = '#ffffff'; ell(c, x, y, 3.2, 3.2); c.fill(); c.fillStyle = '#b9dcfb'; ell(c, x + 1.6, y - 1, 2.6, 2.6); c.fill(); } }
      if (!back) { c.beginPath(); c.moveTo(-5, -110); c.lineTo(-5, -30); c.lineTo(5, -30); c.lineTo(5, -110); c.closePath(); c.fillStyle = '#e3f1ff'; c.fill(); c.lineWidth = 1.4; c.strokeStyle = 'rgba(74,42,34,0.5)'; c.stroke(); for (const y of [-50, -40]) button(c, 0, y, 2.4, '#ffffff'); }
      c.beginPath(); c.moveTo(-70, -30); c.quadraticCurveTo(0, -25, 70, -30); c.lineWidth = 2.6; c.strokeStyle = '#ffffff'; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(74,42,34,0.45)'; c.stroke();
      shade(c, 0.16);
    }); outline(); break;
    case 'hanorac': {
      if (layer === 'collar' && back) { c.beginPath(); c.moveTo(-34, -58); c.quadraticCurveTo(-38, -22, 0, -18); c.quadraticCurveTo(38, -22, 34, -58); c.quadraticCurveTo(0, -50, -34, -58); c.closePath(); st(c, lin(c, -58, -18, '#c9b6f2', '#a993e0'), 2.6); c.beginPath(); c.moveTo(-22, -52); c.quadraticCurveTo(0, -30, 22, -52); c.lineWidth = 2; c.strokeStyle = 'rgba(74,42,34,0.45)'; c.stroke(); }
      if (layer === 'behind' && !back) { c.beginPath(); c.moveTo(-50, -62); c.quadraticCurveTo(0, -74, 50, -62); c.quadraticCurveTo(46, -50, 0, -50); c.quadraticCurveTo(-46, -50, -50, -62); c.closePath(); st(c, '#b9a3ea', 2.6); }
      if (layer !== 'front') break;
      inBody(() => {
        top(lin(c, -90, -10, '#d4c4f7', '#b8a2ec'), -12, 5);
        if (!back) {
          c.beginPath(); c.moveTo(-22, -34); c.lineTo(22, -34); c.lineTo(28, -16); c.lineTo(-28, -16); c.closePath(); c.fillStyle = '#c3b0f0'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = O; c.stroke();
          c.beginPath(); c.moveTo(-22, -34); c.lineTo(-27, -17); c.moveTo(22, -34); c.lineTo(27, -17); c.lineWidth = 1.4; c.strokeStyle = 'rgba(74,42,34,0.4)'; c.stroke();
          heartPath(c, 0, -43, 5); c.fillStyle = '#ff9ab8'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = O; c.stroke();
          c.strokeStyle = '#ffffff'; c.lineWidth = 2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 6, -56); c.quadraticCurveTo(s * 8, -48, s * 7, -40); c.stroke(); ell(c, s * 7, -39, 1.8, 2.6); c.fillStyle = '#ffd23f'; c.fill(); }
        }
        c.fillStyle = '#ad97e3'; c.beginPath(); c.moveTo(-70, -18); c.quadraticCurveTo(0, -13, 70, -18); c.lineTo(70, -12); c.quadraticCurveTo(0, -7, -70, -12); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(60,40,110,0.35)'; c.lineWidth = 1; for (let x = -60; x <= 60; x += 4) { c.beginPath(); c.moveTo(x, -17); c.lineTo(x, -11); c.stroke(); }
        shade(c, 0.18); hemLine(c, -12, 5);
      }); outline();
      break;
    }
    case 'sort': {
      if (layer !== 'front') break;
      if (!back) {
        inBody(() => {
          c.strokeStyle = '#ff9ab8'; c.lineWidth = 4; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 14, -54); c.lineTo(s * 28, -80); c.stroke(); }
          c.beginPath(); c.roundRect(-18, -56, 36, 26, 5); st(c, '#fff6f9', 2.2);
          c.beginPath(); c.moveTo(-30, -32); c.lineTo(30, -32); c.lineTo(36, -4); c.quadraticCurveTo(0, 2, -36, -4); c.closePath(); st(c, '#fff6f9', 2.2);
          c.strokeStyle = '#ff9ab8'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(-36, -5); c.quadraticCurveTo(0, 1, 36, -5); c.stroke();
          c.fillStyle = '#ffd1df'; for (let x = -32; x <= 32; x += 8) { ell(c, x, -2.5, 2.4, 1.6); c.fill(); }
          heartPath(c, 0, -18, 8); st(c, '#ffb3c8', 1.6); c.beginPath(); c.moveTo(-6, -21); c.lineTo(6, -21); c.lineWidth = 1; c.strokeStyle = 'rgba(74,42,34,0.5)'; c.stroke();
          c.beginPath(); c.roundRect(-70, -34, 140, 4, 2); c.fillStyle = '#ff9ab8'; c.fill();
          c.fillStyle = '#ff7aa2'; for (let x = -12; x <= 12; x += 6) { ell(c, x, -44, 1.5, 1.5); c.fill(); }
        });
      } else {
        inBody(() => { c.beginPath(); c.roundRect(-70, -34, 140, 4, 2); c.fillStyle = '#ff9ab8'; c.fill(); c.strokeStyle = '#ff9ab8'; c.lineWidth = 4; c.beginPath(); c.moveTo(-28, -82); c.lineTo(10, -34); c.moveTo(28, -82); c.lineTo(-10, -34); c.stroke(); });
        bow(c, 0, -32, 0.7, 0, '#ffc0d3', '#ff8fb0');
      }
      outline();
      break;
    }
    case 'geaca': {
      if (layer === 'collar') {
        c.beginPath(); for (let i = 0; i <= 14; i++) { const x = -36 + i * (72 / 14), y = -56 + Math.sin(i * 1.3) * 1.5; i ? c.lineTo(x, y - 4 - (i % 2) * 2) : c.moveTo(x, y); }
        for (let i = 14; i >= 0; i--) { const x = -36 + i * (72 / 14); c.lineTo(x, -46 + (i % 2) * 2); } c.closePath(); st(c, '#fffaf3', 2.4);
        break;
      }
      if (layer !== 'front') break;
      inBody(() => {
        c.fillStyle = '#d93a40'; c.fillRect(-80, -110, 160, 104);
        for (let y = -94; y < -6; y += 14) { c.beginPath(); c.roundRect(-70, y, 140, 13, 6.5); c.fillStyle = lin(c, y, y + 13, '#ef6266', '#d63a40'); c.fill(); c.lineWidth = 1.6; c.strokeStyle = 'rgba(90,10,20,0.45)'; c.stroke(); }
        if (!back) { c.beginPath(); c.moveTo(0, -60); c.lineTo(0, -6); c.lineWidth = 3; c.strokeStyle = '#a32329'; c.stroke(); c.lineWidth = 1; c.strokeStyle = '#ffd23f'; c.setLineDash([1.5, 1.5]); c.stroke(); c.setLineDash([]); c.beginPath(); c.roundRect(-2.5, -48, 5, 9, 2); st(c, '#e9e9ef', 1.4); }
        shade(c, 0.2); hemLine(c, -6, 4);
      }); outline();
      break;
    }
  }
  c.restore();
}

// =====================================================================================
// cap (centrul capului in 0,0)
// =====================================================================================
export function drawHeadWear(c: C, id: string, layer: 'behind' | 'front', back: boolean, t: number) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  const F = layer === 'front';
  switch (id) {
    case 'bow': if (F) bow(c, back ? -26 : 26, -48, 0.95, back ? -0.3 : 0.3, '#ff9dbb', '#ff6890'); break;
    case 'agrafa': if (F) {
      c.save(); c.translate(back ? -28 : 28, -42); c.rotate(back ? -0.4 : 0.4);
      c.beginPath(); c.roundRect(-14, 2, 28, 5, 2.5); st(c, '#f2c94c', 2);
      c.beginPath(); c.moveTo(0, -12); c.bezierCurveTo(12, -12, 12, 4, 0, 12); c.bezierCurveTo(-12, 4, -12, -12, 0, -12); c.closePath(); st(c, lin(c, -12, 12, '#ff6b6b', '#e03b3b'), 2.2);
      c.fillStyle = '#fff3b0'; for (const [x, y] of [[-4, -4], [4, -4], [0, 1], [-3, 5], [3, 5]]) { ell(c, x, y, 0.9, 1.3); c.fill(); }
      for (const a of [-0.9, -0.3, 0.3, 0.9]) { c.save(); c.translate(0, -12); c.rotate(a); ell(c, 0, -4, 2.6, 5); st(c, '#5bbf5b', 1.4); c.restore(); }
      c.restore();
    } break;
    case 'flower': if (F) {
      for (let i = 0; i < 9; i++) { const a = Math.PI + 0.35 + i * (Math.PI - 0.7) / 8; const x = Math.cos(a) * 56, y = Math.sin(a) * 47 - 3; c.fillStyle = '#5bbf5b'; ell(c, x + 5, y + 2, 5, 2.4, a); c.fill(); }
      for (let i = 0; i < 9; i++) { const a = Math.PI + 0.35 + i * (Math.PI - 0.7) / 8; const x = Math.cos(a) * 54, y = Math.sin(a) * 46 - 4; flower(c, x, y, i % 2 ? 7 : 9, ['#ff9ab8', '#ffd23f', '#c9a7ff', '#ffffff', '#ffb38a'][i % 5], i % 5 === 1 ? '#ff8a3d' : '#ffd23f'); }
    } break;
    case 'party': if (F) {
      c.save(); c.translate(back ? 8 : -8, -46); c.rotate(back ? 0.28 : -0.28);
      const cone = () => { c.beginPath(); c.moveTo(-17, 4); c.lineTo(0, -46); c.lineTo(17, 4); c.quadraticCurveTo(0, 9, -17, 4); c.closePath(); };
      cone(); c.fillStyle = lin(c, -46, 6, '#8fc6ff', '#5a9cf0'); c.fill();
      c.save(); cone(); c.clip(); for (let i = 0; i < 5; i++) { c.fillStyle = ['#ffd23f', '#ff7aa2'][i % 2]; c.beginPath(); c.moveTo(-30, -38 + i * 10); c.lineTo(30, -46 + i * 10); c.lineTo(30, -42 + i * 10); c.lineTo(-30, -34 + i * 10); c.closePath(); c.fill(); } c.restore();
      cone(); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
      for (let k = 0; k < 7; k++) { const a = k * TAU / 7; ell(c, Math.cos(a) * 5, -48 + Math.sin(a) * 5, 3.4, 3.4); c.fillStyle = ['#ff4d6d', '#ffd23f'][k % 2]; c.fill(); }
      ell(c, 0, -48, 3, 3); c.fillStyle = '#fff'; c.fill();
      c.restore();
    } break;
    case 'chef': if (F) {
      for (const [x, y, r] of [[-20, -70, 15], [0, -78, 17], [20, -70, 15], [-10, -64, 13], [10, -64, 13]] as const) { ell(c, x, y, r, r); st(c, '#ffffff', 2.4); }
      ell(c, 0, -70, 26, 12); c.fillStyle = '#fff'; c.fill();
      c.strokeStyle = 'rgba(160,140,130,0.5)'; c.lineWidth = 1.4; for (const x of [-12, 0, 12]) { c.beginPath(); c.moveTo(x, -60); c.quadraticCurveTo(x + 2, -72, x, -84); c.stroke(); }
      c.beginPath(); c.roundRect(-28, -60, 56, 16, 4); st(c, lin(c, -60, -44, '#ffffff', '#ebe4de'), 2.4);
    } break;
    case 'beanie': if (F) {
      for (const s of [-1, 1]) { ell(c, s * 34, -46, 14, 13); st(c, '#ff8c69', 2.6); ell(c, s * 34, -45, 8, 7); c.fillStyle = '#ffb59d'; c.fill(); }
      c.beginPath(); c.moveTo(-60, -10); c.bezierCurveTo(-60, -70, 60, -70, 60, -10); c.closePath(); c.fillStyle = lin(c, -60, -10, '#ff9d7d', '#f2754f'); c.fill(); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
      c.save(); c.clip(); c.strokeStyle = 'rgba(160,50,30,0.35)'; c.lineWidth = 1.4; for (let x = -54; x <= 54; x += 8) for (let y = -58; y < -16; y += 7) { c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x, y + 4); c.lineTo(x + 3, y); c.stroke(); } c.restore();
      c.beginPath(); c.roundRect(-62, -22, 124, 13, 6.5); st(c, '#ffd6c9', 2.4); c.strokeStyle = 'rgba(160,80,60,0.4)'; c.lineWidth = 1.2; for (let x = -56; x <= 56; x += 5) { c.beginPath(); c.moveTo(x, -20); c.lineTo(x, -11); c.stroke(); }
      const pom = 9 + Math.sin(t * 4) * 0.4; for (let k = 0; k < 10; k++) { const a = k * TAU / 10; ell(c, Math.cos(a) * pom * 0.55, -62 + Math.sin(a) * pom * 0.55, pom * 0.55, pom * 0.55); c.fillStyle = '#fff'; c.fill(); }
      ell(c, 0, -62, pom, pom); c.lineWidth = 2; c.strokeStyle = O; c.stroke(); ell(c, 0, -62, pom * 0.8, pom * 0.8); c.fillStyle = '#fff'; c.fill();
    } break;
    case 'cap': if (F) {
      const red = lin(c, -80, -36, '#f0505c', '#c8202f');
      c.beginPath(); c.moveTo(-40, -34); c.bezierCurveTo(-42, -86, 42, -86, 40, -34); c.closePath(); c.fillStyle = red; c.fill(); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
      c.strokeStyle = 'rgba(100,0,10,0.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -72); c.quadraticCurveTo(-4, -50, -2, -36); c.moveTo(0, -72); c.quadraticCurveTo(18, -56, 22, -36); c.stroke();
      ell(c, 0, -72, 3.4, 2.4); st(c, '#c8202f', 1.6);
      if (!back) { c.beginPath(); c.moveTo(-36, -36); c.quadraticCurveTo(0, -26, 44, -34); c.quadraticCurveTo(48, -26, 40, -24); c.quadraticCurveTo(0, -18, -34, -30); c.closePath(); st(c, '#a8121f', 2.4); heartPath(c, -10, -52, 7); c.fillStyle = '#fff'; c.fill(); }
      else { c.beginPath(); c.moveTo(-14, -34); c.quadraticCurveTo(0, -48, 14, -34); c.closePath(); c.fillStyle = '#7a4a3a'; c.fill(); c.lineWidth = 2; c.strokeStyle = O; c.stroke(); c.beginPath(); c.roundRect(-16, -38, 32, 4, 2); st(c, '#a8121f', 1.4); }
      c.fillStyle = 'rgba(255,255,255,0.3)'; ell(c, -16, -64, 8, 4, -0.4); c.fill();
    } break;
    case 'crown': if (F) {
      c.beginPath(); c.moveTo(-26, -46); c.lineTo(-30, -82); c.lineTo(-14, -64); c.lineTo(0, -90); c.lineTo(14, -64); c.lineTo(30, -82); c.lineTo(26, -46); c.quadraticCurveTo(0, -40, -26, -46); c.closePath();
      st(c, lin(c, -90, -44, '#ffe680', '#e8a817'), 2.6);
      for (const [x, y] of [[-30, -82], [0, -90], [30, -82]]) { ell(c, x, y, 3.6, 3.6); st(c, '#fff3b0', 1.4); }
      for (const [x, col] of [[-14, '#e63946'], [0, '#4cc9f0'], [14, '#7cc576']] as const) { ell(c, x, -54, 4, 4.6); st(c, col, 1.4); c.fillStyle = 'rgba(255,255,255,0.7)'; ell(c, x - 1.2, -55.5, 1.2, 1.2); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(-20, -50); c.lineTo(-22, -72); c.lineTo(-17, -66); c.closePath(); c.fill();
      starPath(c, 22, -88, 5, 1.8, 4, t * 3); c.fillStyle = '#fff'; c.fill();
    } break;
    case 'palarie': if (F) {
      ell(c, 0, -40, 76, 18, back ? 0.05 : -0.05); st(c, lin(c, -58, -22, '#f8e3a3', '#e9c770'), 2.6);
      c.strokeStyle = 'rgba(180,140,60,0.5)'; c.lineWidth = 1.2; for (let r = 46; r < 76; r += 7) { c.beginPath(); c.ellipse(0, -40, r, r * 0.235, back ? 0.05 : -0.05, 0, TAU); c.stroke(); }
      c.beginPath(); c.moveTo(-34, -42); c.bezierCurveTo(-36, -84, 36, -84, 34, -42); c.quadraticCurveTo(0, -34, -34, -42); c.closePath(); st(c, lin(c, -80, -40, '#fbe9b4', '#ecd083'), 2.6);
      c.save(); c.clip(); c.strokeStyle = 'rgba(180,140,60,0.45)'; c.lineWidth = 1.2; for (let x = -30; x <= 30; x += 6) { c.beginPath(); c.moveTo(x, -42); c.lineTo(x * 0.7, -80); c.stroke(); } c.restore();
      c.beginPath(); c.moveTo(-34, -50); c.quadraticCurveTo(0, -42, 34, -50); c.lineTo(34, -42); c.quadraticCurveTo(0, -34, -34, -42); c.closePath(); st(c, '#e5383b', 2);
      flower(c, back ? -28 : 28, -48, 9, '#ff9ab8');
    } break;
    case 'batic': {
      const red = lin(c, -70, 30, '#ef4b4f', '#c62a2e');
      if (!F && !back) { c.beginPath(); c.moveTo(-60, 10); c.bezierCurveTo(-74, -78, 74, -78, 60, 10); c.quadraticCurveTo(56, 40, 0, 46); c.quadraticCurveTo(-56, 40, -60, 10); c.closePath(); st(c, red, 2.6); }
      if (!F) break;
      if (!back) {
        c.beginPath(); c.moveTo(-62, 14); c.bezierCurveTo(-74, -80, 74, -80, 62, 14); c.quadraticCurveTo(52, -14, 0, -22); c.quadraticCurveTo(-52, -14, -62, 14); c.closePath(); st(c, red, 2.6);
        c.save(); c.clip(); for (const [x, y] of [[-34, -40], [-6, -54], [24, -46], [-48, -12], [46, -16], [8, -34]]) flower(c, x, y, 6, '#ffffff', '#ffd23f'); c.restore();
        c.beginPath(); c.moveTo(-62, 14); c.quadraticCurveTo(-56, 36, -40, 44); c.lineWidth = 8; c.strokeStyle = '#d6363b'; c.stroke();
        c.save(); c.translate(-40, 46); c.rotate(-0.3); ell(c, 0, 0, 6, 5); st(c, '#d6363b', 2); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(s * 8, 12, s * 4, 20); c.lineTo(s * 10, 18); c.quadraticCurveTo(s * 10, 8, 2 * s, 0); c.closePath(); st(c, '#d6363b', 2); } c.restore();
      } else {
        c.beginPath(); c.moveTo(-62, 20); c.bezierCurveTo(-74, -80, 74, -80, 62, 20); c.quadraticCurveTo(30, 34, 0, 64); c.quadraticCurveTo(-30, 34, -62, 20); c.closePath(); st(c, red, 2.6);
        c.save(); c.clip(); for (const [x, y] of [[-30, -36], [0, -50], [30, -36], [-36, 0], [36, 0], [0, -10], [0, 30]]) flower(c, x, y, 6, '#ffffff', '#ffd23f'); c.restore();
      }
    } break;
    case 'joben': if (F) {
      ell(c, 0, -48, 42, 10); st(c, '#2b2b33', 2.6);
      c.beginPath(); c.moveTo(-27, -50); c.lineTo(-29, -104); c.quadraticCurveTo(0, -112, 29, -104); c.lineTo(27, -50); c.quadraticCurveTo(0, -44, -27, -50); c.closePath(); st(c, lin(c, -110, -50, '#3a3a46', '#22222a'), 2.6);
      c.beginPath(); c.moveTo(-27, -62); c.quadraticCurveTo(0, -56, 27, -62); c.lineTo(27, -52); c.quadraticCurveTo(0, -46, -27, -52); c.closePath(); st(c, '#c8102e', 2);
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(-20, -100, 6, 36);
      ell(c, 0, -106, 29, 6); st(c, '#33333d', 2.2);
    } break;
    case 'voal': {
      if (!F || back) {
        const sw = Math.sin(t * 2) * 4;
        c.globalAlpha = 0.62; c.beginPath(); c.moveTo(-34, -50); c.quadraticCurveTo(-74 + sw, 30, -64 + sw, 120); c.quadraticCurveTo(0, 132, 64 + sw, 120); c.quadraticCurveTo(74 + sw, 30, 34, -50); c.closePath(); c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = 'rgba(74,42,34,0.45)'; c.stroke();
        c.strokeStyle = 'rgba(220,210,220,0.8)'; c.lineWidth = 1; for (const x of [-30, -10, 10, 30]) { c.beginPath(); c.moveTo(x * 0.5, -44); c.quadraticCurveTo(x + sw, 40, x * 1.6 + sw, 118); c.stroke(); } c.globalAlpha = 1;
      }
      if (F) for (let i = -4; i <= 4; i++) { const x = i * 8, y = -52 - (16 - Math.abs(i) * 4) * 0.4 + Math.abs(i) * 1.4; if (i % 2) flower(c, x, y, 6.5, '#ffffff', '#ffe6ef'); else { ell(c, x, y, 4.6, 4.6); st(c, '#ffd6e4', 1.4); c.fillStyle = 'rgba(255,255,255,0.8)'; ell(c, x - 1.4, y - 1.4, 1.4, 1.4); c.fill(); } }
    } break;
    case 'cowboy': if (F) {
      c.beginPath(); c.moveTo(-80, -52); c.quadraticCurveTo(-62, -34, 0, -36); c.quadraticCurveTo(62, -34, 80, -52); c.quadraticCurveTo(76, -24, 0, -24); c.quadraticCurveTo(-76, -24, -80, -52); c.closePath(); st(c, lin(c, -52, -24, '#c58a52', '#99602f'), 2.6);
      c.beginPath(); c.moveTo(-36, -36); c.bezierCurveTo(-40, -92, -12, -80, 0, -74); c.bezierCurveTo(12, -80, 40, -92, 36, -36); c.quadraticCurveTo(0, -30, -36, -36); c.closePath(); st(c, lin(c, -90, -36, '#d39a63', '#b07a45'), 2.6);
      c.beginPath(); c.moveTo(0, -74); c.quadraticCurveTo(-2, -60, 0, -50); c.lineWidth = 1.6; c.strokeStyle = 'rgba(80,40,10,0.5)'; c.stroke();
      c.beginPath(); c.moveTo(-36, -46); c.quadraticCurveTo(0, -40, 36, -46); c.lineTo(36, -38); c.quadraticCurveTo(0, -32, -36, -38); c.closePath(); st(c, '#5a3018', 2);
      if (!back) { c.beginPath(); c.roundRect(-6, -45, 12, 8, 2); st(c, '#ffd23f', 1.6); }
      starPath(c, back ? -20 : 20, -42, 4, 1.7, 5, 0); c.fillStyle = '#ffd23f'; c.fill();
    } break;
    case 'casca': if (F) {
      c.beginPath(); c.moveTo(-44, -36); c.bezierCurveTo(-46, -92, 46, -92, 44, -36); c.closePath(); st(c, lin(c, -88, -36, '#ffd54a', '#f2a91c'), 2.6);
      c.beginPath(); c.moveTo(-8, -80); c.quadraticCurveTo(0, -84, 8, -80); c.lineTo(8, -38); c.lineTo(-8, -38); c.closePath(); c.fillStyle = '#ffe27a'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = 'rgba(74,42,34,0.6)'; c.stroke();
      c.beginPath(); c.moveTo(-50, -38); c.quadraticCurveTo(0, back ? -34 : -28, 50, -38); c.quadraticCurveTo(52, -30, 46, -30); c.quadraticCurveTo(0, back ? -26 : -20, -46, -30); c.quadraticCurveTo(-52, -30, -50, -38); c.closePath(); st(c, '#f2a91c', 2.4);
      if (!back) { c.save(); c.translate(-24, -56); c.rotate(-0.5); c.beginPath(); c.roundRect(-2, -2, 4, 16, 1.5); st(c, '#8a5a32', 1.2); c.beginPath(); c.roundRect(-7, -6, 14, 6, 2); st(c, '#9aa3ad', 1.2); c.restore(); }
      c.fillStyle = 'rgba(255,255,255,0.45)'; ell(c, -24, -70, 9, 4, -0.5); c.fill();
    } break;
    case 'bereta': if (F) {
      c.save(); c.rotate(back ? -0.18 : 0.18);
      ell(c, 4, -50, 50, 19); st(c, lin(c, -70, -32, '#e5566c', '#b8304a'), 2.6);
      c.strokeStyle = 'rgba(90,10,30,0.35)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(4, -48, 38, 12, 0, 0.2, Math.PI - 0.2); c.stroke();
      c.beginPath(); c.moveTo(4, -68); c.quadraticCurveTo(2, -76, 6, -78); c.lineWidth = 3.4; c.strokeStyle = O; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#b8304a'; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.3)'; ell(c, -14, -58, 12, 4, -0.1); c.fill();
      c.restore();
    } break;
  }
  c.restore();
}

// =====================================================================================
// fata (doar din fata; ochii in +-25, 4; nasucul in 0, 15)
// =====================================================================================
export function drawFaceWear(c: C, id: string, t: number) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  const temples = (col: string, y = 2) => { c.strokeStyle = col; c.lineWidth = 2.6; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 38, y); c.lineTo(s * 58, y - 6); c.stroke(); } };
  switch (id) {
    case 'hearts':
      temples('#d93a5b');
      for (const s of [-1, 1]) { heartPath(c, s * 25, 8, 17); c.fillStyle = 'rgba(255,120,160,0.6)'; c.fill(); c.lineWidth = 3.4; c.strokeStyle = '#d93a5b'; c.stroke(); c.lineWidth = 1.6; c.strokeStyle = O; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.7)'; ell(c, s * 25 - 6, 0, 3, 1.8, -0.5); c.fill(); }
      c.beginPath(); c.moveTo(-10, 2); c.quadraticCurveTo(0, -3, 10, 2); c.lineWidth = 2.6; c.strokeStyle = '#d93a5b'; c.stroke(); break;
    case 'stele':
      temples('#c77dff');
      for (const s of [-1, 1]) { starPath(c, s * 25, 4, 17, 8, 5, 0); c.fillStyle = 'rgba(255,220,90,0.75)'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#c77dff'; c.stroke(); c.lineWidth = 1.4; c.strokeStyle = O; c.stroke(); }
      for (let i = 0; i < 3; i++) { const a = 0.5 + 0.5 * Math.sin(t * 5 + i * 2); c.fillStyle = `rgba(255,255,255,${a})`; starPath(c, -46 + i * 46, -16 + (i % 2) * 6, 3, 1.1, 4, 0); c.fill(); }
      c.beginPath(); c.moveTo(-9, 2); c.quadraticCurveTo(0, -3, 9, 2); c.lineWidth = 2.6; c.strokeStyle = '#c77dff'; c.stroke(); break;
    case 'shades':
      temples('#222');
      for (const s of [-1, 1]) { c.beginPath(); c.roundRect(s * 25 - 14, -6, 28, 19, 8); c.fillStyle = lin(c, -6, 13, '#3a3a44', '#111116'); c.fill(); c.lineWidth = 2.4; c.strokeStyle = O; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(s * 25 - 10, -3); c.lineTo(s * 25 - 3, -3); c.lineTo(s * 25 - 9, 6); c.closePath(); c.fill(); }
      c.beginPath(); c.moveTo(-11, 0); c.quadraticCurveTo(0, -4, 11, 0); c.lineWidth = 3; c.strokeStyle = '#222'; c.stroke(); break;
    case 'ochelari':
      temples('#6b4423');
      for (const s of [-1, 1]) { ell(c, s * 25, 4, 15, 15); c.fillStyle = 'rgba(220,240,255,0.25)'; c.fill(); c.lineWidth = 3.2; c.strokeStyle = '#6b4423'; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.55)'; ell(c, s * 25 - 6, -3, 3, 1.8, -0.6); c.fill(); }
      c.beginPath(); c.moveTo(-10, 2); c.quadraticCurveTo(0, -3, 10, 2); c.lineWidth = 3; c.strokeStyle = '#6b4423'; c.stroke(); break;
    case 'monoclu':
      ell(c, 25, 4, 15, 15); c.fillStyle = 'rgba(200,230,255,0.3)'; c.fill(); c.lineWidth = 3.4; c.strokeStyle = '#c9a227'; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = O; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.6)'; ell(c, 19, -3, 3, 1.8, -0.6); c.fill();
      c.strokeStyle = '#c9a227'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(36, 12); c.quadraticCurveTo(46, 34, 34, 54); c.stroke(); break;
    case 'mustata':
      c.fillStyle = '#4a2a1a'; c.strokeStyle = O; c.lineWidth = 1.6;
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 19); c.bezierCurveTo(s * 8, 14, s * 20, 15, s * 25, 21); c.bezierCurveTo(s * 30, 26, s * 33, 18, s * 30, 15); c.bezierCurveTo(s * 33, 23, s * 24, 28, s * 14, 25); c.quadraticCurveTo(s * 6, 24, 0, 22); c.closePath(); c.fill(); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.25)'; for (const s of [-1, 1]) { ell(c, s * 12, 19, 4, 1.2, s * -0.2); c.fill(); } break;
  }
  c.restore();
}

// =====================================================================================
// la gat (coordonatele corpului; barbia ~ y -52)
// =====================================================================================
export function drawNeckWear(c: C, id: string, back: boolean, t: number) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  switch (id) {
    case 'bowtie': if (!back) {
      c.translate(0, -55);
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 3, 0); c.quadraticCurveTo(s * 10, -12, s * 19, -10); c.quadraticCurveTo(s * 23, 0, s * 19, 10); c.quadraticCurveTo(s * 10, 12, s * 3, 0); c.closePath(); st(c, lin(c, -10, 10, '#f0505c', '#b81c2c')); c.fillStyle = 'rgba(255,255,255,0.55)'; ell(c, s * 14, -5, 3.4, 1.7, s * 0.25); c.fill(); }
      c.beginPath(); c.roundRect(-5, -6, 10, 12, 4); st(c, '#b81c2c', 2.4);
    } break;
    case 'scarf': {
      const blue = lin(c, -64, -44, '#6fd0f5', '#3fb0e0');
      c.beginPath(); c.roundRect(-44, -62, 88, 15, 7.5); st(c, blue, 2.6);
      c.strokeStyle = '#ffffff'; c.lineWidth = 3; for (const x of [-26, 0, 26]) { c.beginPath(); c.moveTo(x, -61); c.lineTo(x, -48); c.stroke(); }
      c.save(); c.translate(back ? -18 : 20, -50); c.rotate((back ? -0.15 : 0.15) + Math.sin(t * 3) * 0.06);
      c.beginPath(); c.roundRect(-8, 0, 16, 30, 4); st(c, blue, 2.4); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(-7, 12); c.lineTo(7, 12); c.moveTo(-7, 20); c.lineTo(7, 20); c.stroke();
      c.strokeStyle = '#3fb0e0'; c.lineWidth = 1.8; for (let x = -6; x <= 6; x += 3) { c.beginPath(); c.moveTo(x, 30); c.lineTo(x, 36); c.stroke(); }
      c.restore();
    } break;
    case 'bandana':
      if (!back) { c.beginPath(); c.moveTo(-34, -60); c.quadraticCurveTo(0, -54, 34, -60); c.lineTo(0, -28); c.closePath(); st(c, lin(c, -60, -28, '#ee4b55', '#c4232f')); c.fillStyle = '#fff'; for (const [x, y] of [[-14, -52], [10, -50], [0, -40], [-4, -50], [16, -56]]) { ell(c, x, y, 1.8, 1.8); c.fill(); } }
      else { c.beginPath(); c.roundRect(-40, -60, 80, 9, 4.5); st(c, '#d6343f', 2.2); ell(c, 0, -55, 5, 4.5); st(c, '#d6343f', 2); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, -53); c.lineTo(s * 9, -38); c.lineTo(s * 3, -40); c.closePath(); st(c, '#d6343f', 2); } }
      break;
    case 'colier':
      if (!back) {
        for (let i = 0; i <= 12; i++) { const u = i / 12, x = -32 + u * 64, y = -58 + Math.sin(u * Math.PI) * 9; ell(c, x, y, 3.2, 3.2); c.fillStyle = '#fffaf2'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(74,42,34,0.6)'; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.9)'; ell(c, x - 1, y - 1, 1, 1); c.fill(); }
        heartPath(c, 0, -44, 6); st(c, lin(c, -50, -40, '#ffd1e0', '#ff8fb0'), 1.6);
      } else { ell(c, 0, -58, 3, 3); st(c, '#e8c45a', 1.4); }
      break;
  }
  c.restore();
}

/** martisorul prins in piept (desenul vechi, adus la marimea hamsterului) */
export function drawPinWear(c: C, id: string, t: number) {
  c.save(); c.translate(-24, -40); c.scale(1 / 0.64, 1 / 0.64); c.translate(12, 16); drawPin(c, id, t); c.restore();
}
