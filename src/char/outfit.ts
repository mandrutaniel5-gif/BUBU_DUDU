// Accesorii (garderoba): desenate peste personaj.
import { heartPath, starPath } from './draw';

export interface Outfit { head: string; face: string; neck: string; body?: string }
export const NO_OUTFIT: Outfit = { head: 'none', face: 'none', neck: 'none', body: 'none' };

export interface Item { id: string; slot: keyof Outfit; label: string; icon: string; price: number; shop?: 'sat' | 'oras' }
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
  // haine taranesti (Croitoria din sat)
  { id: 'ie', slot: 'body', label: 'Ie românească', icon: '👚', price: 30, shop: 'sat' },
  { id: 'vesta', slot: 'body', label: 'Vestă țărănească', icon: '🦺', price: 35, shop: 'sat' },
  { id: 'salopeta', slot: 'body', label: 'Salopetă de fermier', icon: '👖', price: 40, shop: 'sat' },
  { id: 'rochita', slot: 'body', label: 'Rochiță roz cu buline', icon: '👗', price: 35, shop: 'sat' },
  { id: 'tricou', slot: 'body', label: 'Tricou albastru cu buline', icon: '👕', price: 30, shop: 'sat' },
  { id: 'pulover', slot: 'body', label: 'Pulover tricotat', icon: '🧶', price: 35, shop: 'sat' },
  { id: 'palarie', slot: 'head', label: 'Pălărie de paie', icon: '👒', price: 20, shop: 'sat' },
  { id: 'batic', slot: 'head', label: 'Băsmăluță cu flori', icon: '🧕', price: 18, shop: 'sat' },
  // haine elegante (la oras)
  { id: 'rochie', slot: 'body', label: 'Rochie de seară', icon: '💃', price: 120, shop: 'oras' },
  { id: 'costum', slot: 'body', label: 'Costum elegant', icon: '🤵', price: 140, shop: 'oras' },
  { id: 'joben', slot: 'head', label: 'Joben', icon: '🎩', price: 60, shop: 'oras' },
];
// accesoriile vechi se gasesc tot la Croitoria din sat (coroana: la oras)
for (const it of ITEMS) if (!it.shop) it.shop = it.id === 'crown' ? 'oras' : 'sat';

const O = '#4a2a22';
const st = (ctx: CanvasRenderingContext2D, fill: string, lw = 2) => { ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = lw; ctx.stroke(); };

/** in coordonatele capului (centru 0,0; crestet ~ -21) */
export function drawHeadItem(ctx: CanvasRenderingContext2D, id: string, t: number) {
  switch (id) {
    case 'palarie':
      ctx.beginPath(); ctx.ellipse(0, -20, 44, 10, 0, 0, 7); st(ctx, '#f2d58a');
      ctx.beginPath(); ctx.moveTo(-22, -21); ctx.bezierCurveTo(-22, -44, 22, -44, 22, -21); ctx.closePath(); st(ctx, '#f7df9a');
      ctx.beginPath(); ctx.roundRect(-22, -27, 44, 6, 3); st(ctx, '#e5383b', 1.5);
      ctx.strokeStyle = '#d9b866'; ctx.lineWidth = 1; for (let i = -16; i <= 16; i += 8) { ctx.beginPath(); ctx.moveTo(i, -29); ctx.lineTo(i * 0.8, -40); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(18, -24, 4, 0, 7); st(ctx, '#ff9ab8', 1.2);
      break;
    case 'batic':
      ctx.beginPath(); ctx.moveTo(-36, 4); ctx.bezierCurveTo(-38, -34, 38, -34, 36, 4); ctx.quadraticCurveTo(30, -12, 0, -14); ctx.quadraticCurveTo(-30, -12, -36, 4); ctx.closePath(); st(ctx, '#e5383b');
      for (const [x, y] of [[-20, -18], [0, -24], [20, -18], [-10, -12], [10, -12]]) { for (let k = 0; k < 5; k++) { const a = k * 1.256; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); } ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fillStyle = '#ffd23f'; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(40, 10); ctx.lineTo(34, 12); ctx.closePath(); st(ctx, '#e5383b', 1.5);
      break;
    case 'joben':
      ctx.beginPath(); ctx.ellipse(0, -22, 26, 6, 0, 0, 7); st(ctx, '#2b2b33');
      ctx.beginPath(); ctx.roundRect(-16, -56, 32, 34, 4); st(ctx, '#2b2b33');
      ctx.fillStyle = '#e5383b'; ctx.fillRect(-16, -30, 32, 6);
      break;
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

/**
 * Hainele de pe corp. Se deseneaza decupat in silueta corpului (body) si a manutelor (arms),
 * ca sa para "imbracate" peste blanita.
 */
export function drawBodyItem(ctx: CanvasRenderingContext2D, id: string, clipBody: () => void, clipArms: ((fn: () => void) => void), hip: number, t: number) {
  const dots = (col: string, r = 2.6, step = 9) => { ctx.fillStyle = col; for (let y = -46; y < 4; y += step) for (let x = -34; x < 36; x += step) { ctx.beginPath(); ctx.arc(hip + x + ((y / step) % 2 ? step / 2 : 0), y, r, 0, 7); ctx.fill(); } };
  const garment = (fill: () => void, sleeve?: () => void) => {
    ctx.save(); clipBody(); ctx.clip(); fill(); ctx.restore();
    if (sleeve) clipArms(sleeve);
  };
  switch (id) {
    case 'ie': garment(() => {
      ctx.fillStyle = '#fff7e6'; ctx.fillRect(hip - 40, -50, 80, 34);
      ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hip - 40, -16); ctx.lineTo(hip + 40, -16); ctx.stroke();
      // altita: romburi rosii si negre pe piept
      for (let x = -14; x <= 14; x += 7) { ctx.fillStyle = (x / 7) % 2 ? '#1f1512' : '#d62828'; ctx.beginPath(); ctx.moveTo(hip + x, -36); ctx.lineTo(hip + x + 3, -32); ctx.lineTo(hip + x, -28); ctx.lineTo(hip + x - 3, -32); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = '#d62828'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(hip, -27); ctx.lineTo(hip, -18); ctx.stroke();
    }, () => { ctx.fillStyle = '#fff7e6'; ctx.fillRect(-12, -10, 24, 30); ctx.fillStyle = '#d62828'; ctx.fillRect(-12, 9, 24, 3); ctx.fillStyle = '#1f1512'; ctx.fillRect(-12, 13, 24, 1.5); }); break;
    case 'vesta': garment(() => {
      ctx.fillStyle = '#b5313a'; ctx.fillRect(hip - 40, -50, 80, 44);
      ctx.fillStyle = '#fff7e6'; ctx.beginPath(); ctx.moveTo(hip - 6, -50); ctx.lineTo(hip + 6, -50); ctx.lineTo(hip + 3, -8); ctx.lineTo(hip - 3, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23f'; for (const y of [-32, -22, -12]) for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.arc(hip + s2 * 14, y, 2.2, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#1f1512'; for (let x = -26; x <= 26; x += 6) { if (Math.abs(x) < 8) continue; ctx.fillRect(hip + x - 1.5, -9, 3, 3); }
    }); break;
    case 'salopeta': garment(() => {
      ctx.fillStyle = '#4f7fd1'; ctx.fillRect(hip - 40, -24, 80, 30);
      ctx.beginPath(); ctx.roundRect(hip - 11, -38, 22, 16, 3); ctx.fill();
      ctx.strokeStyle = '#4f7fd1'; ctx.lineWidth = 5; for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hip + s2 * 9, -36); ctx.lineTo(hip + s2 * 17, -46); ctx.stroke(); }
      ctx.fillStyle = '#ffd23f'; for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.arc(hip + s2 * 8, -35, 2.4, 0, 7); ctx.fill(); }
      ctx.strokeStyle = '#3a64ad'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.roundRect(hip - 7, -34, 14, 9, 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hip - 40, -24); ctx.lineTo(hip - 11, -24); ctx.moveTo(hip + 11, -24); ctx.lineTo(hip + 40, -24); ctx.stroke();
    }); break;
    case 'rochita': garment(() => { ctx.fillStyle = '#f7a8b8'; ctx.fillRect(hip - 40, -50, 80, 56); dots('#fff', 2.8, 10); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hip - 40, -9); ctx.quadraticCurveTo(hip, -6, hip + 40, -9); ctx.stroke(); },
      () => { ctx.fillStyle = '#f7a8b8'; ctx.fillRect(-12, -10, 24, 16); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, 7); ctx.fill(); }); break;
    case 'tricou': garment(() => { ctx.fillStyle = '#9ccbf0'; ctx.fillRect(hip - 40, -50, 80, 38); dots('#fff', 2.8, 10); ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hip - 40, -12); ctx.lineTo(hip + 40, -12); ctx.stroke(); },
      () => { ctx.fillStyle = '#9ccbf0'; ctx.fillRect(-12, -10, 24, 14); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -1, 2.4, 0, 7); ctx.fill(); }); break;
    case 'pulover': garment(() => {
      ctx.fillStyle = '#7cb870'; ctx.fillRect(hip - 40, -50, 80, 40);
      ctx.strokeStyle = '#fff6e0'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = -36; x <= 36; x += 6) ctx.lineTo(hip + x, -28 + ((x / 6) % 2 ? 3 : -3)); ctx.stroke();
      ctx.fillStyle = '#5e9a54'; ctx.fillRect(hip - 40, -14, 80, 5);
    }, () => { ctx.fillStyle = '#7cb870'; ctx.fillRect(-12, -10, 24, 30); ctx.fillStyle = '#5e9a54'; ctx.fillRect(-12, 12, 24, 4); }); break;
    case 'rochie': garment(() => {
      ctx.fillStyle = '#c8102e'; ctx.fillRect(hip - 40, -40, 80, 46);
      ctx.fillStyle = '#ffffffaa'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(hip - 20 + i * 8, -20 + Math.sin(t * 3 + i) * 1, 1.2, 0, 7); ctx.fill(); }
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hip - 40, -40); ctx.quadraticCurveTo(hip, -36, hip + 40, -40); ctx.stroke();
    }); break;
    case 'costum': garment(() => {
      ctx.fillStyle = '#2f3b5c'; ctx.fillRect(hip - 40, -50, 80, 56);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(hip - 9, -50); ctx.lineTo(hip + 9, -50); ctx.lineTo(hip, -22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8102e'; ctx.beginPath(); ctx.moveTo(hip - 3, -40); ctx.lineTo(hip + 3, -40); ctx.lineTo(hip + 4, -26); ctx.lineTo(hip, -22); ctx.lineTo(hip - 4, -26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23f'; for (const y of [-20, -12]) { ctx.beginPath(); ctx.arc(hip, y, 1.8, 0, 7); ctx.fill(); }
    }, () => { ctx.fillStyle = '#2f3b5c'; ctx.fillRect(-12, -10, 24, 30); ctx.fillStyle = '#fff'; ctx.fillRect(-12, 13, 24, 3); }); break;
  }
}
