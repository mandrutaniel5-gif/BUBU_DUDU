// Podeaua: fiecare dala desenata o singura data, in "bucati" de 8x8 dale tinute minte (lumea e mare,
// nu incape intr-o singura imagine). Se deseneaza doar bucatile care se vad (si cateva de langa, din timp).
import { CITY_CROSS } from './city';
import { iso, unIso, tilePath } from './iso';
import { floorAt, spaceBounds, AREA, type Floor } from './map';
import { ORIGIN, CORE_W, CORE_H } from './layout';

const rnd = (x: number, y: number) => { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };
const COL: Partial<Record<Floor, [string, string]>> = {
  grass: ['#a6dc93', '#9fd68c'], meadow: ['#b3e29a', '#acdc92'], forest: ['#7cc47a', '#74bd72'], path: ['#e9d8b8', '#e9d8b8'],
  road: ['#cdb48f', '#c9af89'], wood: ['#e8bf8e', '#e3b886'], pinkwood: ['#f6cfc4', '#f2c6ba'], tileblue: ['#d5eef9', '#c4e6f5'],
  checker: ['#fff4e4', '#ffd8c9'], dirt: ['#a87a50', '#a87a50'], water: ['#7ec8f0', '#7ec8f0'], sand: ['#f4e2b5', '#efdcad'],
  asphalt: ['#8d8f9a', '#8d8f9a'], sidewalk: ['#e6e2dc', '#dedad3'], bridge: ['#c98e5f', '#c48a5a'], field: ['#b98a5c', '#b3845a'], cobble: ['#ddd0b8', '#d6c8ae'],
  parquet: ['#c98f5c', '#c48a57'], marble: ['#f7f4ef', '#f3efe9'], marblecheck: ['#f7f4ef', '#4a4550'], carpet: ['#e9d9f2', '#e9d9f2'],
};
const quad4 = (ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill(); };
const isA = (x: number, y: number) => floorAt(x, y) === 'asphalt';

/** o dala de podea */
export function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const f = floorAt(x, y);
  if (f === 'void') return;
  const r = rnd(x, y);
  const pair = COL[f] ?? ['#9ad48a', '#9ad48a'];
  let col = (f === 'road' ? x % 2 : f === 'grass' || f === 'forest' || f === 'meadow' ? r > 0.5 : (x + y) % 2) ? pair[0] : pair[1];
  if (f === 'road') col = (x % 2) ? '#cdb48f' : '#c9af89';
  tilePath(ctx, x, y); ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke(); // acopera rosturile dintre bucati
  if (f !== 'water') { ctx.strokeStyle = 'rgba(58,42,34,0.12)'; ctx.stroke(); }
  const c = iso(x + 0.5, y + 0.5);
  if ((f === 'grass' && r > 0.55) || (f === 'meadow' && r > 0.4)) {
    ctx.strokeStyle = f === 'meadow' ? '#8fcb76' : '#7fbf6e'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) { const px = c.x + (k - 1) * 5 + (r - 0.5) * 20, py = c.y + (r - 0.5) * 8; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 2, py - 6); ctx.moveTo(px, py); ctx.lineTo(px + 2, py - 5); ctx.stroke(); }
  }
  if (f === 'meadow' && r < 0.18) { ctx.fillStyle = ['#fff', '#ffd23f', '#ff9ab8'][Math.floor(r * 50) % 3]; ctx.beginPath(); ctx.arc(c.x + (r - 0.09) * 60, c.y - 2, 2.2, 0, 7); ctx.fill(); }
  if (f === 'forest' && r > 0.7) { ctx.fillStyle = '#5ea85c'; ctx.beginPath(); ctx.ellipse(c.x + (r - 0.85) * 40, c.y, 5, 2.5, 0, 0, 7); ctx.fill(); }
  if (f === 'wood' || f === 'pinkwood') {
    ctx.strokeStyle = 'rgba(120,70,40,0.18)'; ctx.lineWidth = 1;
    for (let k = 1; k < 3; k++) { const p = iso(x + k / 3, y), q = iso(x + k / 3, y + 1); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
  }
  if (f === 'parquet') {
    // parchet: lamele de 1/4 de dala, decalate pe jumatate de la un rand la altul, in nuante calde diferite
    const tones = ['#c98f5c', '#d39a66', '#bf8452', '#cc9460'];
    for (let k = 0; k < 4; k++) {
      const v0 = k * 0.25, v1 = v0 + 0.25, col = tones[(k + 2 + x + y * 3) % 4];
      ctx.fillStyle = col;
      quad4(ctx, k % 2 ? [iso(x, y + v0), iso(x + 0.5, y + v0), iso(x + 0.5, y + v1), iso(x, y + v1)] : [iso(x + 0.5, y + v0), iso(x + 1, y + v0), iso(x + 1, y + v1), iso(x + 0.5, y + v1)]);
    }
    ctx.strokeStyle = 'rgba(90,50,25,0.3)'; ctx.lineWidth = 0.8; ctx.beginPath();
    for (let k = 0; k <= 4; k++) { const v = k * 0.25, p = iso(x, y + v), q = iso(x + 1, y + v); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); }
    for (let k = 0; k < 4; k++) { const v0 = k * 0.25, v1 = v0 + 0.25; const m0 = iso(x + 0.5, y + v0), m1 = iso(x + 0.5, y + v1); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); const s0 = iso(x + (k % 2 ? 0.25 : 0.75), y + v0), s1 = iso(x + (k % 2 ? 0.25 : 0.75), y + v1); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); }
    ctx.stroke();
    // luciu de lac
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.ellipse(c.x - 4, c.y - 2, 12, 3, -0.3, 0, 7); ctx.fill();
  }
  if (f === 'marble' || f === 'marblecheck') {
    // marmura: vinisoare fine gri, iar in carouri piatra neagra cu vine aurii
    const dark = f === 'marblecheck' && (x + y) % 2 === 1;
    // o singura vina lunga si moale pe dala (pe unele dale deloc), ca sa para piatra, nu zgarieturi
    if (rnd(x * 3, y * 5) > 0.35) {
      const u0 = 0.1 + rnd(x, y) * 0.3, v0 = 0.1 + rnd(y, x) * 0.2, u1 = 0.6 + rnd(x + 1, y) * 0.3, v1 = 0.6 + rnd(x, y + 1) * 0.3;
      const a = iso(x + u0, y + v0), b = iso(x + u1, y + v1), m = iso(x + (u0 + u1) / 2 + 0.15, y + (v0 + v1) / 2 - 0.15);
      ctx.strokeStyle = dark ? 'rgba(212,175,55,0.38)' : 'rgba(170,170,185,0.28)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(m.x, m.y, b.x, b.y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(c.x - 6, c.y - 2, 10, 2.5, -0.35, 0, 7); ctx.fill();
    // rost auriu subtire
    tilePath(ctx, x, y); ctx.strokeStyle = 'rgba(201,162,74,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();
  }
  if (f === 'carpet') {
    // mocheta pufoasa cu model discret de romburi
    ctx.fillStyle = 'rgba(200,170,225,0.55)';
    quad4(ctx, [iso(x + 0.5, y + 0.2), iso(x + 0.8, y + 0.5), iso(x + 0.5, y + 0.8), iso(x + 0.2, y + 0.5)]);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(c.x, c.y, 1.6, 0, 7); ctx.fill();
  }
  if (f === 'bridge') {
    // scanduri de-a curmezisul (podul merge de-a lungul lui x)
    ctx.strokeStyle = 'rgba(90,50,25,0.45)'; ctx.lineWidth = 1.2;
    for (let k = 1; k < 4; k++) { const p = iso(x + k / 4, y), q = iso(x + k / 4, y + 1); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
  }
  if (f === 'field') {
    // brazde
    ctx.strokeStyle = 'rgba(90,55,30,0.35)'; ctx.lineWidth = 2;
    for (const v of [0.25, 0.75]) { const p = iso(x + 0.06, y + v), q = iso(x + 0.94, y + v); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
  }
  if (f === 'cobble') { ctx.fillStyle = 'rgba(150,130,100,0.35)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(c.x + (rnd(x + k, y) - 0.5) * 34, c.y + (rnd(x, y + k) - 0.5) * 14, 5, 2.6, 0, 0, 7); ctx.fill(); } }
  if (f === 'path') { ctx.fillStyle = '#d6c19a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(c.x + (rnd(x + k, y) - 0.5) * 30, c.y + (rnd(x, y + k) - 0.5) * 12, 6, 3, 0, 0, 7); ctx.fill(); } }
  if (f === 'road' && r > 0.6) { ctx.fillStyle = '#b89e78'; ctx.beginPath(); ctx.ellipse(c.x + (r - 0.8) * 30, c.y + (r - 0.8) * 8, 4, 2, 0, 0, 7); ctx.fill(); }
  if (f === 'sidewalk') { ctx.strokeStyle = 'rgba(120,110,100,0.18)'; ctx.lineWidth = 1; const p = iso(x + 0.5, y), q = iso(x + 0.5, y + 1), a2 = iso(x, y + 0.5), b2 = iso(x + 1, y + 0.5); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.moveTo(a2.x, a2.y); ctx.lineTo(b2.x, b2.y); ctx.stroke(); }
  if (f === 'asphalt') {
    ctx.fillStyle = '#ffffff';
    // linia din mijloc: pe marginea dintre cele doua benzi
    const horiz = isA(x, y + 1) && !isA(x, y - 1) && !isA(x, y + 2) && isA(x - 1, y) && isA(x + 1, y);
    const vert = isA(x + 1, y) && !isA(x - 1, y) && !isA(x + 2, y) && isA(x, y - 1) && isA(x, y + 1);
    if (horiz && !vert) for (const u of [0.15, 0.6]) quad4(ctx, [iso(x + u, y + 0.97), iso(x + u + 0.25, y + 0.97), iso(x + u + 0.25, y + 1.03), iso(x + u, y + 1.03)]);
    if (vert && !horiz) for (const u of [0.15, 0.6]) quad4(ctx, [iso(x + 0.97, y + u), iso(x + 0.97, y + u + 0.25), iso(x + 1.03, y + u + 0.25), iso(x + 1.03, y + u)]);
    // trecerile de pietoni din centrul orasului
    {
      // langa fiecare intersectie din oras
      let zebraX = false, zebraY = false;
      for (const r of CITY_CROSS) { if (y >= r.y0 && y < r.y1 && (x === r.x0 - 1 || x === r.x1)) zebraX = true; if (x >= r.x0 && x < r.x1 && (y === r.y0 - 1 || y === r.y1)) zebraY = true; }
      if (zebraX) for (let k = 0; k < 4; k++) { const v = k * 0.25 + 0.04; quad4(ctx, [iso(x + 0.1, y + v), iso(x + 0.9, y + v), iso(x + 0.9, y + v + 0.14), iso(x + 0.1, y + v + 0.14)]); }
      if (zebraY) for (let k = 0; k < 4; k++) { const u = k * 0.25 + 0.04; quad4(ctx, [iso(x + u, y + 0.1), iso(x + u, y + 0.9), iso(x + u + 0.14, y + 0.9), iso(x + u + 0.14, y + 0.1)]); }
    }
  }
  if (f === 'water') {
    ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 1.5;
    if (r > 0.35) { ctx.beginPath(); ctx.moveTo(c.x - 10, c.y); ctx.quadraticCurveTo(c.x - 5, c.y - 3, c.x, c.y); ctx.quadraticCurveTo(c.x + 5, c.y + 3, c.x + 10, c.y); ctx.stroke(); }
    // malul: o dunga mai deschisa unde apa atinge uscatul
    ctx.strokeStyle = '#bfe6fa'; ctx.lineWidth = 2.5;
    const edge = (a: { x: number; y: number }, b: { x: number; y: number }) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
    const land = (nx: number, ny: number) => { const g = floorAt(nx, ny); return g !== 'water' && g !== 'void'; };
    if (land(x, y - 1)) edge(iso(x, y), iso(x + 1, y));
    if (land(x - 1, y)) edge(iso(x, y), iso(x, y + 1));
    if (land(x, y + 1)) edge(iso(x, y + 1), iso(x + 1, y + 1));
    if (land(x + 1, y)) edge(iso(x + 1, y), iso(x + 1, y + 1));
  }
}

/** micile detalii pictate peste podeaua curtii (malul paraului, nuferi) */
function homeExtras(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#5aa9d6'; ctx.lineWidth = 3; tilePath(ctx, 0, 6, 2, 4); ctx.stroke();
  for (const [u, v] of [[17.6, 17.5], [18.6, 18.7]]) { const p = iso(u, v); ctx.fillStyle = '#6cbf6c'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 9, 4.5, 0, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(p.x, p.y); ctx.fill(); }
  for (const [u, v] of [[0.6, 7.2], [1.3, 8.6]]) { const p = iso(u, v); ctx.fillStyle = '#6cbf6c'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 9, 4.5, 0, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(p.x, p.y); ctx.fill(); ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.arc(p.x + 2, p.y - 2, 3, 0, 7); ctx.fill(); }
}

/** bucatile de podea sunt dreptunghiuri pe ecran (nu se suprapun: fiecare pixel se deseneaza o data) */
const CW = 512, CHH = 256, PAD = 4;
interface Chunk { cv: HTMLCanvasElement; used: number; ox: number; oy: number; w: number; h: number }
/** bucatile de podea tinute minte */
export class FloorChunks {
  private chunks = new Map<number, Chunk>();
  private pool: HTMLCanvasElement[] = [];
  private space = '';
  private frame = 0;
  /** cate bucati tinem minte (memoria telefonului) */
  max = 28;
  /** desenul "copt" peste podea: obiectele care nu se misca (copaci, case, campuri), o data pe bucata */
  bake: ((ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number) => void) | null = null;
  constructor(public scale = 2) {}
  /** cand se schimba harta (lume / apartament) sau calitatea */
  reset(scale?: number) { for (const c of this.chunks.values()) this.pool.push(c.cv); this.chunks.clear(); if (scale) this.scale = scale; this.space = AREA; }
  private render(i: number, j: number): Chunk {
    const ox = i * CW - PAD, oy = j * CHH - PAD, w = CW + PAD * 2, h = CHH + PAD * 2, S = this.scale;
    const cv = this.pool.pop() ?? document.createElement('canvas');
    const W = Math.round(w * S), H = Math.round(h * S);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const ctx = cv.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.setTransform(S, 0, 0, S, -ox * S, -oy * S);
    ctx.lineJoin = 'round';
    // dalele care ating dreptunghiul
    const cs = [unIso(ox, oy), unIso(ox + w, oy), unIso(ox, oy + h), unIso(ox + w, oy + h)];
    const B = spaceBounds();
    const x0 = Math.max(B.x0, Math.floor(Math.min(...cs.map(c => c.x))) - 1), x1 = Math.min(B.x1 - 1, Math.ceil(Math.max(...cs.map(c => c.x))) + 1);
    const y0 = Math.max(B.y0, Math.floor(Math.min(...cs.map(c => c.y))) - 1), y1 = Math.min(B.y1 - 1, Math.ceil(Math.max(...cs.map(c => c.y))) + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const p = iso(x, y); // coltul de sus al dalei
      if (p.x + 34 < ox || p.x - 34 > ox + w || p.y + 36 < oy || p.y - 10 > oy + h) continue;
      drawTile(ctx, x, y);
    }
    if (AREA === 'world' && x0 < 22 && y0 < 27 && x1 >= 0 && y1 >= 0) homeExtras(ctx);
    if (this.bake) { ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, w, h); ctx.clip(); try { this.bake(ctx, ox, oy, w, h); } finally { ctx.restore(); } }
    return { cv, used: this.frame, ox, oy, w, h };
  }
  /** uita bucatile care ating dreptunghiul (pixeli de lume): se redeseneaza cand se vad */
  invalidate(B: { x0: number; y0: number; x1: number; y1: number }) {
    for (const [k, c] of this.chunks) if (c.ox <= B.x1 && c.ox + c.w >= B.x0 && c.oy <= B.y1 && c.oy + c.h >= B.y0) { this.chunks.delete(k); this.pool.push(c.cv); }
  }
  /** deseneaza podeaua vazuta in dreptunghiul [vx0,vx1]x[vy0,vy1] (pixeli de lume) */
  draw(ctx: CanvasRenderingContext2D, vx0: number, vy0: number, vx1: number, vy1: number) {
    if (this.space !== AREA) this.reset();
    this.frame++;
    const i0 = Math.floor(vx0 / CW), i1 = Math.floor(vx1 / CW), j0 = Math.floor(vy0 / CHH), j1 = Math.floor(vy1 / CHH);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = (i + 1000) * 4000 + (j + 1000);
      let ch = this.chunks.get(k);
      if (!ch) { ch = this.render(i, j); this.chunks.set(k, ch); }
      ch.used = this.frame;
      ctx.drawImage(ch.cv, ch.ox, ch.oy, ch.cv.width / this.scale, ch.cv.height / this.scale);
    }
    // din timp: bucatile din jur (cel mult una pe cadru), ca sa nu apara goluri cand mergi repede
    let made = 0;
    for (let j = j0 - 1; j <= j1 + 1 && !made; j++) for (let i = i0 - 1; i <= i1 + 1 && !made; i++) {
      const k = (i + 1000) * 4000 + (j + 1000);
      if (this.chunks.has(k)) continue;
      const ch = this.render(i, j); ch.used = this.frame - 1; this.chunks.set(k, ch); made++;
    }
    // uitam bucatile vechi
    if (this.chunks.size > this.max) {
      const old = [...this.chunks.entries()].sort((a, b) => a[1].used - b[1].used).slice(0, this.chunks.size - this.max);
      for (const [k, c] of old) { this.chunks.delete(k); this.pool.push(c.cv); }
      if (this.pool.length > 6) this.pool.length = 6;
    }
  }
}
