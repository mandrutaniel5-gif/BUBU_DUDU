// Indexul obiectelor pe zone de 8x8 dale: lumea are mii de obiecte, dar pe ecran se vad cateva sute.
// Desenul si "ce e langa mine" intreaba doar zonele din jur.
import { FURNITURE, type Furn } from './map';
import { iso } from './iso';

const CS = 8;
const key = (cx: number, cy: number) => (cx + 1000) * 4000 + (cy + 1000);
let cells = new Map<number, Furn[]>();
let builtFor: Furn[] | null = null, builtLen = -1, dirty = true;

/** cineva a schimbat lista de obiecte (adaugat / scos): indexul se reface la prima intrebare */
export function furnChanged() { dirty = true; }
function rebuild() {
  cells = new Map();
  for (const f of FURNITURE) {
    const ax = Math.floor(f.gx / CS), bx = Math.floor((f.gx + Math.max(0.01, f.w) - 0.001) / CS);
    const ay = Math.floor(f.gy / CS), by = Math.floor((f.gy + Math.max(0.01, f.d) - 0.001) / CS);
    for (let cy = ay; cy <= by; cy++) for (let cx = ax; cx <= bx; cx++) { const k = key(cx, cy); let L = cells.get(k); if (!L) cells.set(k, L = []); L.push(f); }
  }
  builtFor = FURNITURE; builtLen = FURNITURE.length; dirty = false;
}
function ensure() { if (dirty || builtFor !== FURNITURE || builtLen !== FURNITURE.length) rebuild(); }
/** obiectele care ating dreptunghiul de dale [x0,x1]x[y0,y1] (fara dubluri) */
export function furnIn(x0: number, y0: number, x1: number, y1: number): Furn[] {
  ensure();
  const out: Furn[] = []; const seen = new Set<Furn>();
  for (let cy = Math.floor(y0 / CS); cy <= Math.floor(y1 / CS); cy++) for (let cx = Math.floor(x0 / CS); cx <= Math.floor(x1 / CS); cx++) {
    const L = cells.get(key(cx, cy)); if (!L) continue;
    for (const f of L) if (!seen.has(f) && f.gx <= x1 && f.gx + f.w >= x0 && f.gy <= y1 && f.gy + f.d >= y0) { seen.add(f); out.push(f); }
  }
  return out;
}
/** cat de inalt e un obiect pe ecran (pixeli), ca sa stim cand iese din cadru */
export function heightOf(f: Furn) {
  const t = f.type as string;
  if (t === 'cbuilding' || t === 'tower') return 330;
  if (t === 'church') return 200;
  if (t === 'building' || t === 'ferris') return 260;
  if (t === 'windmill' || t === 'farmhouse' || t === 'barn') return 200;
  if (t === 'tree' || t === 'pine' || t === 'bigtree') return 170;
  return 130;
}
/** se vede obiectul in dreptunghiul de ecran (pixeli de lume)? */
export function onScreen(f: Furn, vx0: number, vy0: number, vx1: number, vy1: number) {
  const l = iso(f.gx, f.gy + f.d).x - 40, r = iso(f.gx + f.w, f.gy).x + 40;
  const bottom = iso(f.gx + f.w, f.gy + f.d).y + 30, top = iso(f.gx, f.gy).y - heightOf(f);
  return r >= vx0 && l <= vx1 && bottom >= vy0 && top <= vy1;
}
