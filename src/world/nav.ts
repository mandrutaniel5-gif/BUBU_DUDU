// Navigare pe grid (A*) tinand cont de mobila si pereti.
import { colliders, MAP_W, MAP_H, type Rect } from './map';

export class Nav {
  rects: Rect[] = colliders();
  blocked: boolean[] = [];
  constructor(extra: Rect[] = []) {
    this.rects.push(...extra);
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      const cx = x + 0.5, cy = y + 0.5;
      this.blocked[y * MAP_W + x] = this.rects.some(r => cx > r.x0 && cx < r.x1 && cy > r.y0 && cy < r.y1);
    }
  }
  isBlocked(x: number, y: number) { return x < 0 || y < 0 || x >= MAP_W || y >= MAP_H || this.blocked[y * MAP_W + x]; }
  /** exista perete intre doua dale vecine? */
  edgeBlocked(x0: number, y0: number, x1: number, y1: number) {
    const mx = (x0 + x1) / 2 + 0.5, my = (y0 + y1) / 2 + 0.5;
    return this.rects.some(r => r.x1 - r.x0 < 0.3 || r.y1 - r.y0 < 0.3 ? (mx >= r.x0 - 0.01 && mx <= r.x1 + 0.01 && my >= r.y0 - 0.01 && my <= r.y1 + 0.01) : false);
  }
  /** coliziune cerc (raza r) cu dreptunghiurile */
  hits(gx: number, gy: number, r = 0.22) {
    for (const R of this.rects) {
      const cx = Math.max(R.x0, Math.min(gx, R.x1)), cy = Math.max(R.y0, Math.min(gy, R.y1));
      if ((gx - cx) ** 2 + (gy - cy) ** 2 < r * r) return true;
    }
    return false;
  }
  path(sx: number, sy: number, tx: number, ty: number): { x: number; y: number }[] | null {
    const start = [Math.floor(sx), Math.floor(sy)], goal = [Math.floor(tx), Math.floor(ty)];
    if (this.isBlocked(goal[0], goal[1])) return null;
    const key = (x: number, y: number) => y * MAP_W + x;
    const open: [number, number, number][] = [[start[0], start[1], 0]];
    const g = new Map<number, number>([[key(start[0], start[1]), 0]]);
    const from = new Map<number, number>();
    const h = (x: number, y: number) => Math.hypot(x - goal[0], y - goal[1]);
    let guard = 0;
    while (open.length && guard++ < 4000) {
      open.sort((a, b) => a[2] - b[2]);
      const [x, y] = open.shift()!;
      if (x === goal[0] && y === goal[1]) {
        const out: { x: number; y: number }[] = [];
        let k = key(x, y);
        while (k !== key(start[0], start[1])) { out.unshift({ x: (k % MAP_W) + 0.5, y: Math.floor(k / MAP_W) + 0.5 }); k = from.get(k)!; }
        if (out.length) out[out.length - 1] = { x: tx, y: ty };
        return out;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (this.isBlocked(nx, ny)) continue;
        if (dx && dy) { // diagonala: ambele laturi libere
          if (this.isBlocked(x + dx, y) || this.isBlocked(x, y + dy) || this.edgeBlocked(x, y, x + dx, y) || this.edgeBlocked(x, y, x, y + dy) || this.edgeBlocked(x + dx, y, nx, ny) || this.edgeBlocked(x, y + dy, nx, ny)) continue;
        } else if (this.edgeBlocked(x, y, nx, ny)) continue;
        const ng = g.get(key(x, y))! + (dx && dy ? 1.414 : 1);
        if (ng < (g.get(key(nx, ny)) ?? Infinity)) {
          g.set(key(nx, ny), ng); from.set(key(nx, ny), key(x, y));
          open.push([nx, ny, ng + h(nx, ny)]);
        }
      }
    }
    return null;
  }
  /** cea mai apropiata dala libera langa un obiect */
  standSpot(fx: number, fy: number, fw: number, fd: number, nearX: number, nearY: number) {
    let best: { x: number; y: number } | null = null; let bd = Infinity;
    for (let x = fx - 1; x <= fx + fw; x++) for (let y = fy - 1; y <= fy + fd; y++) {
      const inside = x >= fx && x < fx + fw && y >= fy && y < fy + fd;
      if (inside || this.isBlocked(x, y)) continue;
      const diag = (x < fx || x >= fx + fw) && (y < fy || y >= fy + fd);
      if (diag) continue;
      // fara perete intre dala si obiect
      const ax = Math.max(fx, Math.min(x, fx + fw - 1)), ay = Math.max(fy, Math.min(y, fy + fd - 1));
      if (this.edgeBlocked(x, y, ax, ay)) continue;
      const d = Math.hypot(x + 0.5 - nearX, y + 0.5 - nearY);
      if (d < bd) { bd = d; best = { x: x + 0.5, y: y + 0.5 }; }
    }
    return best;
  }
}
