// Accesorii (garderoba): desenate peste personaj.
import { heartPath, starPath } from './draw';

export interface Outfit { head: string; face: string; neck: string }
export const NO_OUTFIT: Outfit = { head: 'none', face: 'none', neck: 'none' };

export interface Item { id: string; slot: keyof Outfit; label: string; icon: string; price: number }
export const ITEMS: Item[] = [
  { id: 'bow', slot: 'head', label: 'Fundiță roz', icon: '🎀', price: 10 },
  { id: 'flower', slot: 'head', label: 'Coroniță de flori', icon: '🌸', price: 15 },
  { id: 'party', slot: 'head', label: 'Coif de petrecere', icon: '🥳', price: 12 },
  { id: 'chef', slot: 'head', label: 'Bonetă de bucătar', icon: '👨‍🍳', price: 20 },
  { id: 'beanie', slot: 'head', label: 'Căciuliță cu moț', icon: '🧶', price: 18 },
  { id: 'cap', slot: 'head', label: 'Șapcă', icon: '🧢', price: 15 },
  { id: 'crown', slot: 'head', label: 'Coroană regală', icon: '👑', price: 50 },
  { id: 'hearts', slot: 'face', label: 'Ochelari-inimioară', icon: '😍', price: 20 },
  { id: 'shades', slot: 'face', label: 'Ochelari de soare', icon: '😎', price: 15 },
  { id: 'bowtie', slot: 'neck', label: 'Papion', icon: '🎩', price: 10 },
  { id: 'scarf', slot: 'neck', label: 'Eșarfă de iarnă', icon: '🧣', price: 15 },
  { id: 'bandana', slot: 'neck', label: 'Bandană', icon: '🏴‍☠️', price: 12 },
];

const O = '#2b1d17';
const st = (ctx: CanvasRenderingContext2D, fill: string, lw = 2) => { ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = lw; ctx.stroke(); };

/** in coordonatele capului (centru 0,0; crestet ~ -21) */
export function drawHeadItem(ctx: CanvasRenderingContext2D, id: string, t: number) {
  switch (id) {
    case 'bow':
      ctx.save(); ctx.translate(18, -22); ctx.rotate(0.35);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 11, -7); ctx.quadraticCurveTo(s * 14, 0, s * 11, 7); ctx.closePath(); st(ctx, '#ff7aa2', 1.8); }
      ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, 7); st(ctx, '#ff4d8a', 1.8); ctx.restore(); break;
    case 'flower':
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + 0.35 + i * (Math.PI - 0.7) / 6; const x = Math.cos(a) * 28, y = Math.sin(a) * 20 - 2;
        const col = ['#ff9ab8', '#ffd23f', '#c77dff', '#ffffff'][i % 4];
        for (let k = 0; k < 5; k++) { const b = k * 1.256; ctx.beginPath(); ctx.arc(x + Math.cos(b) * 3.2, y + Math.sin(b) * 3.2, 2.8, 0, 7); ctx.fillStyle = col; ctx.fill(); }
        ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fillStyle = '#ffb703'; ctx.fill();
      }
      break;
    case 'party':
      ctx.save(); ctx.translate(-8, -20); ctx.rotate(-0.3);
      ctx.beginPath(); ctx.moveTo(-11, 2); ctx.lineTo(0, -30); ctx.lineTo(11, 2); ctx.closePath(); st(ctx, '#7ab8ff');
      ctx.save(); ctx.clip(); for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#ffd23f', '#ff7aa2'][i % 2]; ctx.fillRect(-14, -26 + i * 8, 28, 3.5); } ctx.restore();
      ctx.beginPath(); ctx.moveTo(-11, 2); ctx.lineTo(0, -30); ctx.lineTo(11, 2); ctx.closePath(); ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -31, 4, 0, 7); st(ctx, '#ff4d6d'); ctx.restore(); break;
    case 'chef':
      ctx.beginPath(); ctx.roundRect(-14, -30, 28, 12, 3); st(ctx, '#fff');
      for (const [x, y, r] of [[-11, -36, 8], [0, -40, 9], [11, -36, 8]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); st(ctx, '#fff'); }
      ctx.fillStyle = '#fff'; ctx.fillRect(-13, -33, 26, 6); break;
    case 'beanie':
      ctx.beginPath(); ctx.moveTo(-27, -10); ctx.bezierCurveTo(-27, -36, 27, -36, 27, -10); ctx.closePath(); st(ctx, '#ff8c69');
      ctx.beginPath(); ctx.roundRect(-29, -14, 58, 8, 4); st(ctx, '#ffd6c9');
      ctx.strokeStyle = '#e0674a'; ctx.lineWidth = 1.5; for (let i = -18; i <= 18; i += 9) { ctx.beginPath(); ctx.moveTo(i, -16); ctx.lineTo(i * 0.8, -28); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, -34, 6 + Math.sin(t * 4) * 0.5, 0, 7); st(ctx, '#fff'); break;
    case 'cap':
      ctx.beginPath(); ctx.moveTo(-24, -12); ctx.bezierCurveTo(-24, -34, 24, -34, 24, -12); ctx.closePath(); st(ctx, '#e63946');
      ctx.beginPath(); ctx.ellipse(16, -12, 18, 5, -0.15, 0, 7); st(ctx, '#c1121f');
      ctx.beginPath(); ctx.arc(0, -29, 2.5, 0, 7); st(ctx, '#fff', 1.2);
      heartPath(ctx, -6, -18, 4); ctx.fillStyle = '#fff'; ctx.fill(); break;
    case 'crown':
      ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(-16, -34); ctx.lineTo(-7, -26); ctx.lineTo(0, -38); ctx.lineTo(7, -26); ctx.lineTo(16, -34); ctx.lineTo(14, -18); ctx.closePath(); st(ctx, '#ffd23f');
      for (const [x, c] of [[-8, '#e63946'], [0, '#4cc9f0'], [8, '#7cc576']] as const) { ctx.beginPath(); ctx.arc(x, -22, 2.2, 0, 7); ctx.fillStyle = c; ctx.fill(); }
      starPath(ctx, 10, -36, 3, 1.2, 4, t * 3); ctx.fillStyle = '#fff'; ctx.fill(); break;
  }
}

/** ochelari: peste ochi (ochii la +-13, 3) */
export function drawFaceItem(ctx: CanvasRenderingContext2D, id: string) {
  if (id === 'hearts') {
    for (const s of [-1, 1]) { heartPath(ctx, s * 13, 5, 9); st(ctx, '#ff4d6d'); heartPath(ctx, s * 13, 5, 6); ctx.fillStyle = '#ff8fab'; ctx.fill(); }
    ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, 1); ctx.quadraticCurveTo(0, -2, 5, 1); ctx.stroke();
  } else if (id === 'shades') {
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(s * 13 - 8, -2, 16, 10, 4); st(ctx, '#222'); ctx.fillStyle = '#ffffff55'; ctx.fillRect(s * 13 - 5, 0, 5, 2.5); }
    ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, 1); ctx.lineTo(5, 1); ctx.stroke();
  }
}

/** la gat: in coordonatele corpului (sub cap ~ y -27) */
export function drawNeckItem(ctx: CanvasRenderingContext2D, id: string, t: number) {
  if (id === 'bowtie') {
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -27); ctx.lineTo(s * 9, -32); ctx.lineTo(s * 9, -22); ctx.closePath(); st(ctx, '#e63946', 1.8); }
    ctx.beginPath(); ctx.arc(0, -27, 2.6, 0, 7); st(ctx, '#c1121f', 1.5);
  } else if (id === 'scarf') {
    ctx.beginPath(); ctx.roundRect(-20, -32, 40, 9, 4.5); st(ctx, '#4cc9f0');
    ctx.save(); ctx.translate(10, -25); ctx.rotate(0.2 + Math.sin(t * 3) * 0.08);
    ctx.beginPath(); ctx.roundRect(-4, 0, 9, 16, 3); st(ctx, '#4cc9f0'); ctx.restore();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; for (let i = -14; i <= 14; i += 7) { ctx.beginPath(); ctx.moveTo(i, -31); ctx.lineTo(i, -24); ctx.stroke(); }
  } else if (id === 'bandana') {
    ctx.beginPath(); ctx.moveTo(-18, -31); ctx.lineTo(18, -31); ctx.lineTo(0, -14); ctx.closePath(); st(ctx, '#e63946');
    ctx.fillStyle = '#fff'; for (const [x, y] of [[-8, -27], [6, -26], [0, -20]]) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); }
  }
}
