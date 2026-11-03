// Matematica izometrica. Gridul: gx creste spre dreapta-jos, gy spre stanga-jos.
export const TW = 64;   // latimea unei dale
export const TH = 32;   // inaltimea unei dale

export interface Pt { x: number; y: number }

/** grid (gx, gy, z inaltime px) -> ecran (relativ la origine) */
export function iso(gx: number, gy: number, z = 0): Pt {
  return { x: (gx - gy) * TW / 2, y: (gx + gy) * TH / 2 - z };
}
/** ecran -> grid (z = 0) */
export function unIso(x: number, y: number): Pt {
  return { x: x / TW + y / TH, y: y / TH - x / TW };
}
/** vector de directie pe ecran -> vector in grid (normalizat) */
export function screenDirToGrid(sx: number, sy: number): Pt {
  const gx = sx / TW + sy / TH, gy = sy / TH - sx / TW;
  const l = Math.hypot(gx, gy) || 1;
  return { x: gx / l, y: gy / l };
}

export function poly(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.closePath();
}

/** romb pe sol */
export function tilePath(ctx: CanvasRenderingContext2D, gx: number, gy: number, w = 1, d = 1, z = 0) {
  poly(ctx, [iso(gx, gy, z), iso(gx + w, gy, z), iso(gx + w, gy + d, z), iso(gx, gy + d, z)]);
}

export interface BoxColors { top: string; left: string; right: string; line?: string }

/** cutie izometrica: (gx,gy) coltul din spate, w pe x, d pe y, h inaltime px, z baza */
export function isoBox(ctx: CanvasRenderingContext2D, gx: number, gy: number, w: number, d: number, h: number, c: BoxColors, z = 0, lw = 2) {
  const t0 = iso(gx, gy, z + h), t1 = iso(gx + w, gy, z + h), t2 = iso(gx + w, gy + d, z + h), t3 = iso(gx, gy + d, z + h);
  const b1 = iso(gx + w, gy, z), b2 = iso(gx + w, gy + d, z), b3 = iso(gx, gy + d, z);
  ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = c.line ?? '#3a2a22';
  // fata stanga (de-a lungul lui x, la gy+d)
  poly(ctx, [t3, t2, b2, b3]); ctx.fillStyle = c.left; ctx.fill(); ctx.stroke();
  // fata dreapta (de-a lungul lui y, la gx+w)
  poly(ctx, [t1, t2, b2, b1]); ctx.fillStyle = c.right; ctx.fill(); ctx.stroke();
  // sus
  poly(ctx, [t0, t1, t2, t3]); ctx.fillStyle = c.top; ctx.fill(); ctx.stroke();
}

export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)));
  return `#${((f(16) << 16) | (f(8) << 8) | f(0)).toString(16).padStart(6, '0')}`;
}
export const boxOf = (base: string): BoxColors => ({ top: base, left: shade(base, 0.86), right: shade(base, 0.74) });
