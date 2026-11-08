import { iso } from './iso';
// Cum arata lumea in fiecare anotimp (1.10.0): primavara verde crud si flori multe, vara ca acum, toamna frunze
// aramii pe copaci si cazute pe jos, iarna zapada pe jos, pe copaci, pe tufe, peste flori si peste gradina.
// Anotimpul curent il seteaza desenul lumii (render.ts) din ziua jocului; imaginile gata desenate se refac cand se schimba.
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
let cur: Season = 'summer';
export const season = () => cur;
export function setSeason(s: string) { cur = (['spring', 'summer', 'autumn', 'winter'].includes(s) ? s : 'summer') as Season; (globalThis as any).__season = cur; }
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const AUTUMN = ['#e07a2f', '#e8a33a', '#c9502a', '#dcae3a', '#b8452a', '#d98a2b'];
const SNOW = ['#ffffff', '#f2f7fc', '#e6eef7'];
const SPRING: Record<string, string> = { '#4f9f55': '#5fb85f', '#5fb35f': '#72c96a', '#6fc46c': '#86d87a', '#6cbf6c': '#7fd178', '#7fd07f': '#94dd88', '#8fdc8f': '#a6e69a', '#79c879': '#8ad884', '#4f9d4a': '#5cb056' };
/** culoarea frunzisului (pornind de la verdele de vara); i = a cata pata, ca toamna sa fie amestecat */
export function leaf(col: string, i = 0): string {
  if (cur === 'autumn') return AUTUMN[(hash(col) + i * 3) % AUTUMN.length];
  if (cur === 'winter') return SNOW[i % SNOW.length];
  if (cur === 'spring') return SPRING[col] ?? col;
  return col;
}
/** fructele / florile din copaci: iarna nu mai sunt */
export const fruit = () => cur !== 'winter';
export const isWinter = () => cur === 'winter';
export const isAutumn = () => cur === 'autumn';
/** podeaua: iarba, poienita, padurea (doua nuante, ca acum) */
export function grassPair(f: string, base: [string, string]): [string, string] {
  if (cur === 'winter') return f === 'forest' ? ['#eef3f8', '#e7eef6'] : ['#f5f9fd', '#eef4fa'];
  if (cur === 'autumn') return f === 'forest' ? ['#a9b46a', '#a2ad63'] : f === 'meadow' ? ['#cfcf8a', '#c8c883'] : ['#c4cd84', '#bdc67d'];
  if (cur === 'spring') return f === 'forest' ? ['#86d080', '#7ec978'] : f === 'meadow' ? ['#bdeca0', '#b5e698'] : ['#acea94', '#a3e48c'];
  return base;
}
/** drumurile de pamant, cararile, campul: iarna cu zapada pe margini (mai deschise) */
export function earthTint(col: string): string {
  if (cur !== 'winter') return col;
  const n = parseInt(col.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, k = 0.55;
  const m = (v: number, w: number) => Math.round(v + (w - v) * k);
  return '#' + ((1 << 24) + (m(r, 245) << 16) + (m(g, 248) << 8) + m(b, 252)).toString(16).slice(1);
}

/** iarna, peste flori: o movilita de zapada din care ies cateva tulpini uscate */
export function snowMound(ctx: CanvasRenderingContext2D, gx: number, gy: number) {
  const c = iso(gx + 0.5, gy + 0.5);
  ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.3; for (const dx of [-6, 1, 7]) { ctx.beginPath(); ctx.moveTo(c.x + dx, c.y - 4); ctx.lineTo(c.x + dx + 1, c.y - 12); ctx.stroke(); }
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#b9c9dc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(c.x, c.y - 3, 15, 7, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
}
