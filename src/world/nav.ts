// Navigare pe grid (A*) tinand cont de mobila, pereti, apa si marginile hartii.
// Lumea e mare (~33.000 de dale), asa ca: dalele blocate stau intr-un tablou de octeti, iar
// obstacolele sunt puse "pe dale" (fiecare dala stie ce obstacole o ating), ca sa nu le verificam pe toate.
import { colliders, floorAt, spaceBounds, type Rect } from './map';

class Heap {
  private k: number[] = []; private v: number[] = [];
  get size() { return this.k.length; }
  push(key: number, val: number) {
    const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val);
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; }
    k[i] = key; v[i] = val;
  }
  pop(): number {
    const k = this.k, v = this.v, top = v[0], lk = k.pop()!, lv = v.pop()!;
    if (k.length) {
      let i = 0; const n = k.length;
      for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lk) break; k[i] = k[c]; v[i] = v[c]; i = c; }
      k[i] = lk; v[i] = lv;
    }
    return top;
  }
}

export class Nav {
  rects: Rect[];
  x0: number; y0: number; W: number; H: number;
  /** 1 = dala blocata (centrul ei e intr-un obstacol, apa sau gol) */
  blocked: Uint8Array;
  /** 1 = dala blocata de podea (apa / gol): se comporta ca un patrat plin la coliziuni */
  floorBlock: Uint8Array;
  /** obstacolele care ating fiecare dala */
  private cell: (number[] | undefined)[];
  constructor(extra: Rect[] = []) {
    this.rects = colliders(); this.rects.push(...extra);
    const B = spaceBounds();
    this.x0 = B.x0; this.y0 = B.y0; this.W = B.x1 - B.x0; this.H = B.y1 - B.y0;
    const N = this.W * this.H;
    this.blocked = new Uint8Array(N); this.floorBlock = new Uint8Array(N); this.cell = new Array(N);
    for (let iy = 0; iy < this.H; iy++) for (let ix = 0; ix < this.W; ix++) {
      const f = floorAt(ix + this.x0, iy + this.y0);
      if (f === 'water' || f === 'void') { this.floorBlock[iy * this.W + ix] = 1; this.blocked[iy * this.W + ix] = 1; }
    }
    this.rects.forEach((r, i) => {
      const ax = Math.max(0, Math.floor(r.x0 - this.x0 - 0.3)), bx = Math.min(this.W - 1, Math.floor(r.x1 - this.x0 + 0.3));
      const ay = Math.max(0, Math.floor(r.y0 - this.y0 - 0.3)), by = Math.min(this.H - 1, Math.floor(r.y1 - this.y0 + 0.3));
      for (let iy = ay; iy <= by; iy++) for (let ix = ax; ix <= bx; ix++) {
        const k = iy * this.W + ix; (this.cell[k] ??= []).push(i);
        const cx = ix + this.x0 + 0.5, cy = iy + this.y0 + 0.5;
        if (cx > r.x0 && cx < r.x1 && cy > r.y0 && cy < r.y1) this.blocked[k] = 1;
      }
    });
  }
  private idx(x: number, y: number) { const ix = Math.floor(x) - this.x0, iy = Math.floor(y) - this.y0; return ix < 0 || iy < 0 || ix >= this.W || iy >= this.H ? -1 : iy * this.W + ix; }
  isBlocked(x: number, y: number) { const k = this.idx(x, y); return k < 0 || this.blocked[k] === 1; }
  /** exista perete intre doua dale vecine? */
  edgeBlocked(x0: number, y0: number, x1: number, y1: number) {
    const mx = (x0 + x1) / 2 + 0.5, my = (y0 + y1) / 2 + 0.5;
    for (const k of [this.idx(x0, y0), this.idx(x1, y1)]) {
      if (k < 0) continue;
      const L = this.cell[k]; if (!L) continue;
      for (const i of L) { const r = this.rects[i]; if ((r.x1 - r.x0 < 0.3 || r.y1 - r.y0 < 0.3) && mx >= r.x0 - 0.01 && mx <= r.x1 + 0.01 && my >= r.y0 - 0.01 && my <= r.y1 + 0.01) return true; }
    }
    return false;
  }
  /** coliziune cerc (raza r) cu obstacolele si cu dalele de apa */
  hits(gx: number, gy: number, r = 0.22) {
    const ax = Math.floor(gx - r), bx = Math.floor(gx + r), ay = Math.floor(gy - r), by = Math.floor(gy + r);
    for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) {
      const k = this.idx(x, y);
      if (k < 0) return true;
      if (this.floorBlock[k]) { const cx = Math.max(x, Math.min(gx, x + 1)), cy = Math.max(y, Math.min(gy, y + 1)); if ((gx - cx) ** 2 + (gy - cy) ** 2 < r * r) return true; }
      const L = this.cell[k]; if (!L) continue;
      for (const i of L) {
        const R = this.rects[i];
        const cx = Math.max(R.x0, Math.min(gx, R.x1)), cy = Math.max(R.y0, Math.min(gy, R.y1));
        if ((gx - cx) ** 2 + (gy - cy) ** 2 < r * r) return true;
      }
    }
    return false;
  }
  /** drumul (lista de puncte) pana la tinta; null daca nu se poate ajunge (sau e prea departe) */
  path(sx: number, sy: number, tx: number, ty: number, maxExpand = 14000): { x: number; y: number }[] | null {
    const s0 = Math.floor(sx), s1 = Math.floor(sy), g0 = Math.floor(tx), g1 = Math.floor(ty);
    if (this.isBlocked(g0, g1)) return null;
    const start = this.idx(s0, s1), goal = this.idx(g0, g1);
    if (start < 0 || goal < 0) return null;
    const W = this.W;
    const gScore = new Map<number, number>([[start, 0]]), from = new Map<number, number>(), closed = new Set<number>();
    const h = (k: number) => Math.hypot((k % W) - (goal % W), Math.floor(k / W) - Math.floor(goal / W));
    const open = new Heap(); open.push(h(start), start);
    let n = 0;
    while (open.size && n++ < maxExpand) {
      const k = open.pop();
      if (closed.has(k)) continue; closed.add(k);
      if (k === goal) {
        const out: { x: number; y: number }[] = [];
        let c = k;
        while (c !== start) { out.unshift({ x: (c % W) + this.x0 + 0.5, y: Math.floor(c / W) + this.y0 + 0.5 }); c = from.get(c)!; }
        if (out.length) out[out.length - 1] = { x: tx, y: ty };
        return out;
      }
      const x = (k % W) + this.x0, y = Math.floor(k / W) + this.y0, gk = gScore.get(k)!;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (this.isBlocked(nx, ny)) continue;
        if (dx && dy) { // diagonala: ambele laturi libere
          if (this.isBlocked(x + dx, y) || this.isBlocked(x, y + dy) || this.edgeBlocked(x, y, x + dx, y) || this.edgeBlocked(x, y, x, y + dy) || this.edgeBlocked(x + dx, y, nx, ny) || this.edgeBlocked(x, y + dy, nx, ny)) continue;
        } else if (this.edgeBlocked(x, y, nx, ny)) continue;
        const nk = this.idx(nx, ny); if (closed.has(nk)) continue;
        const ng = gk + (dx && dy ? 1.414 : 1);
        if (ng < (gScore.get(nk) ?? Infinity)) { gScore.set(nk, ng); from.set(nk, k); open.push(ng + h(nk), nk); }
      }
    }
    return null;
  }
  /** cea mai apropiata dala libera (fara sa treaca prin pereti): pentru cine a ramas prins intr-un obstacol */
  freeSpot(gx: number, gy: number, maxR = 8): { x: number; y: number } | null {
    const sx = Math.floor(gx), sy = Math.floor(gy), seen = new Set<number>([this.idx(sx, sy)]);
    let q: [number, number][] = [[sx, sy]];
    for (let r = 0; r <= maxR && q.length; r++) {
      const nq: [number, number][] = []; let best: { x: number; y: number } | null = null, bd = Infinity;
      for (const [x, y] of q) {
        if (!this.isBlocked(x, y) && !this.hits(x + 0.5, y + 0.5)) { const d = Math.hypot(x + 0.5 - gx, y + 0.5 - gy); if (d < bd) { bd = d; best = { x: x + 0.5, y: y + 0.5 }; } }
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = this.idx(nx, ny);
          if (k < 0 || seen.has(k) || this.edgeBlocked(x, y, nx, ny)) continue;
          seen.add(k); nq.push([nx, ny]);
        }
      }
      if (best) return best;
      q = nq;
    }
    return null;
  }
  /** cea mai apropiata dala libera langa un obiect */
  standSpot(fx: number, fy: number, fw: number, fd: number, nearX: number, nearY: number) {
    let best: { x: number; y: number } | null = null; let bd = Infinity;
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.ceil(fx + fw), y1 = Math.ceil(fy + fd);
    for (let x = x0 - 1; x <= x1; x++) for (let y = y0 - 1; y <= y1; y++) {
      const inside = x >= x0 && x < x1 && y >= y0 && y < y1;
      if (inside || this.isBlocked(x, y)) continue;
      const diag = (x < x0 || x >= x1) && (y < y0 || y >= y1);
      if (diag) continue;
      // fara perete intre dala si obiect
      const ax = Math.max(x0, Math.min(x, x1 - 1)), ay = Math.max(y0, Math.min(y, y1 - 1));
      if (this.edgeBlocked(x, y, ax, ay)) continue;
      const d = Math.hypot(x + 0.5 - nearX, y + 0.5 - nearY);
      if (d < bd) { bd = d; best = { x: x + 0.5, y: y + 0.5 }; }
    }
    return best;
  }
}
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
