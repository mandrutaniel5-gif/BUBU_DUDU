// Hamsterii din profil (1.14.2), pentru vehicule: acelasi desen ca din fata (blana moale, contur cu smocuri, fire pe
// margine, umbre), dar vazuti din lateral, cu fata spre dreapta. Asezati: (0,0) = locul unde sta pe sa.
// Unitati de desen ca in hamster.ts (capul ~116 latime); scara HS le aduce la marimea personajelor din lume.
// Labutele si talpile se pun unde le cere vehiculul (ghidon, volan, pedale) si se misca cu el.
import { LOOK, HS, rgba, ell, angd, gauss, bumpc, polar, toPath, setSeed, rnd, soft, furEdge, sprite, bucket, blit, eyeShape, lashes, type HamId, type Pt as P2 } from './hamster';
import type { EyeType } from './pose';
import type { Outfit } from './outfit';
import { sleeveOf } from './hamwear';
import { sideBodyWear, sideLegWear, sideHeadWear, sideFaceWear, sideNeckWear, sideHides, sidePin, bowtieSide } from './hamsidewear';

const O = '#4a2a22';
const TAU = Math.PI * 2;
type C = CanvasRenderingContext2D;
export type Pt = { x: number; y: number };

// ---------- formele (unitati de desen) ----------
/** centrul capului fata de sa: deasupra corpului, putin in fata */
export const SIDE_HEAD: Pt = { x: 12, y: -100 };
/** capul din profil: rotund, cu botul in fata-jos, obrajorul plin si smocuri de blana pe ceafa si pe obraz */
function headRF(id: HamId) {
  return (a: number) => {
    let r = 1 / Math.sqrt((Math.cos(a) / 58) ** 2 + (Math.sin(a) / 51) ** 2);
    r += 5 * gauss(angd(a, 0.12), 0.32);           // botul (scurt si rotund, ca la hamsteri)
    r += 10 * gauss(angd(a, 0.8), 0.34);           // obrajorul plin (punga)
    r += 5 * gauss(angd(a, Math.PI - 0.55), 0.42); // ceafa pufoasa
    r -= 4 * gauss(angd(a, Math.PI / 2 + 0.15), 0.3); // barbia, sub obraz
    r -= 2 * gauss(angd(a, -Math.PI / 2), 0.5);
    for (const t of [0.75, 1.15]) r += 3 * bumpc(angd(a, t), 0.2);                 // smocuri pe obraz
    for (const t of [Math.PI - 0.2, Math.PI - 0.6, Math.PI - 1.0]) r += 3.2 * bumpc(angd(a, t), 0.2); // smocuri pe ceafa
    if (LOOK[id].tuft) r += 6 * bumpc(angd(a, -Math.PI / 2 - 0.15), 0.13);
    return r;
  };
}
/** corpul asezat: ca o para culcata, burtica in fata, coapsa rotunda in spate-jos, turtit pe sa */
function bodyRF(a: number) {
  let r = 1 / Math.sqrt((Math.cos(a) / 44) ** 2 + (Math.sin(a) / 40) ** 2);
  r += 5 * gauss(angd(a, 0.35), 0.45);            // burtica
  r += 7 * gauss(angd(a, Math.PI - 0.55), 0.4);   // coapsa / fundul
  for (const t of [Math.PI - 0.15, Math.PI - 0.95, -0.2]) r += 2.6 * bumpc(angd(a, t), 0.2);
  return r;
}
const GEO: Partial<Record<HamId, { head: P2[]; headP: Path2D; body: P2[]; bodyP: Path2D }>> = {};
function geo(id: HamId) {
  let g = GEO[id];
  if (!g) {
    const head = polar(0, 0, headRF(id), 360);
    const body = polar(0, -38, bodyRF, 300).map(([x, y]) => (y > -6 ? [x * (1 - (y + 6) * 0.01), -6 + (y + 6) * 0.25] : [x, y]) as P2);
    g = GEO[id] = { head, headP: toPath(head), body, bodyP: toPath(body) };
  }
  return g;
}

// ---------- blana (pastrata in imagini, ca la desenul din fata) ----------
function headSprite(id: HamId, k: number) {
  return sprite(`hs-${id}`, k, -80, -76, 160, 150, (c, kk) => {
    const L = LOOK[id], g = geo(id); setSeed(id === 'bubu' ? 31 : 37);
    c.fillStyle = L.body; c.fill(g.headP);
    c.save(); c.clip(g.headP);
    if (L.patch) { // pata piersicie de pe crestet, spre ceafa
      soft(c, 2.2 * kk, () => { c.fillStyle = L.patch!; ell(c, -10, -42, 40, 22, -0.25); c.fill(); });
      soft(c, 3 * kk, () => { c.fillStyle = rgba(L.patchShade!, 0.5); ell(c, -14, -48, 30, 12, -0.25); c.fill(); });
    }
    if (L.white) { // botul si obrajorul albe
      soft(c, 1.4 * kk, () => { c.fillStyle = L.white!; ell(c, 30, 32, 40, 24, -0.15); c.fill(); ell(c, 50, 10, 16, 16); c.fill(); ell(c, 44, 22, 22, 18); c.fill(); });
      c.strokeStyle = rgba(L.white, 0.95); c.lineCap = 'round';
      for (let i = 0; i < 26; i++) { const a = Math.PI * 0.95 + (i / 25) * Math.PI * 0.75, ex = 30 + Math.cos(a) * 39, ey = 32 + Math.sin(a) * 23; c.lineWidth = 1.1 + rnd() * 0.6; c.beginPath(); c.moveTo(ex + 2, ey + 2); c.lineTo(ex - Math.cos(a) * 5 + (rnd() - 0.5) * 2, ey - Math.sin(a) * 5); c.stroke(); }
    }
    const gr = c.createRadialGradient(-8, -24, 8, 4, 4, 84); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)'); gr.addColorStop(1, rgba(L.shade, 0.75));
    c.fillStyle = gr; c.fillRect(-100, -90, 200, 180);
    soft(c, 4 * kk, () => { c.fillStyle = rgba(L.shade, 0.45); ell(c, -4, 50, 60, 12); c.fill(); });               // umbra sub barbie
    soft(c, 4 * kk, () => { c.fillStyle = rgba(L.shade, 0.35); ell(c, -50, 6, 12, 40); c.fill(); });               // ceafa
    soft(c, 3 * kk, () => { c.fillStyle = 'rgba(255,255,255,0.55)'; ell(c, -6, -34, 22, 9, -0.2); c.fill(); });   // luciul de pe crestet
    furEdge(c, g.head, L.deep, 0.22, 5.5, 10, 0, 0);
    c.restore();
    c.lineWidth = 3.2; c.strokeStyle = O; c.stroke(g.headP);
  });
}
function bodySprite(id: HamId, k: number) {
  return sprite(`bs-${id}`, k, -64, -96, 128, 100, (c, kk) => {
    const L = LOOK[id], g = geo(id); setSeed(id === 'bubu' ? 41 : 43);
    c.fillStyle = L.body; c.fill(g.bodyP);
    c.save(); c.clip(g.bodyP);
    soft(c, 1.8 * kk, () => { c.fillStyle = L.belly; ell(c, 26, -34, 22, 30, -0.15); c.fill(); });               // burtica (in fata)
    if (L.white) { c.strokeStyle = rgba(L.white, 0.95); c.lineCap = 'round'; for (let i = 0; i < 14; i++) { const a = Math.PI * 0.6 + (i / 13) * Math.PI * 0.9, ex = 26 + Math.cos(a) * 21, ey = -34 + Math.sin(a) * 29; c.lineWidth = 1.2 + rnd() * 0.5; c.beginPath(); c.moveTo(ex + 1.5, ey); c.lineTo(ex - Math.cos(a) * 5, ey - Math.sin(a) * 5); c.stroke(); } }
    if (L.patch) soft(c, 3 * kk, () => { c.fillStyle = rgba(L.patch!, 0.5); ell(c, -22, -60, 22, 14); c.fill(); });
    const gr = c.createRadialGradient(-6, -60, 6, 0, -36, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.58, 'rgba(255,255,255,0)'); gr.addColorStop(1, rgba(L.shade, 0.75)); c.fillStyle = gr; c.fillRect(-80, -110, 160, 120);
    soft(c, 5 * kk, () => { c.fillStyle = rgba(L.shade, 0.6); ell(c, 4, -78, 46, 12); c.fill(); });               // umbra capului pe corp
    // coapsa: o linie moale de blana care desparte piciorul de burtica
    c.strokeStyle = rgba(L.deep, 0.45); c.lineWidth = 2.2; c.beginPath(); c.arc(-6, -20, 24, -Math.PI * 0.05, Math.PI * 0.62); c.stroke();
    furEdge(c, g.body, L.deep, 0.22, 5, 10, 0, -38);
    c.restore();
    c.lineWidth = 3.2; c.strokeStyle = O; c.stroke(g.bodyP);
  });
}

// ---------- membrele: forme pline, cu blana, nu linii ----------
/** o bucata de picior / brat: capsula care se subtiaza de la a la b, cu contur */
function seg(c: C, a: Pt, b: Pt, ra: number, rb: number, col: string, lw = 2.8) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x), n = ang + Math.PI / 2;
  c.beginPath();
  c.moveTo(a.x + Math.cos(n) * ra, a.y + Math.sin(n) * ra);
  c.lineTo(b.x + Math.cos(n) * rb, b.y + Math.sin(n) * rb);
  c.arc(b.x, b.y, rb, n, n - Math.PI, true);
  c.lineTo(a.x - Math.cos(n) * ra, a.y - Math.sin(n) * ra);
  c.arc(a.x, a.y, ra, n + Math.PI, n, true);
  c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = lw; c.strokeStyle = O; c.stroke();
}
function ik(a: Pt, tgt: Pt, l1: number, l2: number, bend: 1 | -1): [Pt, Pt] {
  let dx = tgt.x - a.x, dy = tgt.y - a.y; let d = Math.hypot(dx, dy);
  const max = (l1 + l2) * 0.999; if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  d = Math.max(d, Math.abs(l1 - l2) + 0.5);
  const base = Math.atan2(dy, dx), k = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  return [{ x: a.x + Math.cos(base - bend * k) * l1, y: a.y + Math.sin(base - bend * k) * l1 }, { x: a.x + dx, y: a.y + dy }];
}
/** talpa din profil: lunguiata, roz, cu pernutele de jos si degetele in fata */
function foot(c: C, id: HamId, p: Pt, rot: number, far: boolean) {
  const L = LOOK[id];
  c.save(); c.translate(p.x, p.y); c.rotate(rot);
  c.beginPath(); c.moveTo(-9, 2); c.bezierCurveTo(-11, -8, 4, -9, 12, -4); c.bezierCurveTo(19, -1, 19, 6, 12, 7); c.lineTo(-4, 7); c.bezierCurveTo(-9, 7, -10, 5, -9, 2); c.closePath();
  c.fillStyle = far ? L.pawDark : L.paw; c.fill(); c.lineWidth = 2.8; c.strokeStyle = O; c.stroke();
  if (!far) { c.fillStyle = L.pawDark; ell(c, 1, 5, 6, 2); c.fill(); for (const tx of [9, 14]) { ell(c, tx, 4.4, 2, 1.6); c.fill(); } }
  c.restore();
}
/** labuta din fata, din profil: rotunda, roz, cu degetele stranse pe maner */
function paw(c: C, id: HamId, p: Pt, rot: number, far: boolean) {
  const L = LOOK[id];
  c.save(); c.translate(p.x, p.y); c.rotate(rot);
  ell(c, 0, 0, 8, 7.2); c.fillStyle = far ? L.pawDark : L.paw; c.fill(); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
  if (!far) { c.lineWidth = 1.4; c.strokeStyle = rgba(O, 0.55); for (const fy of [-2.4, 2.4]) { c.beginPath(); c.moveTo(4.5, fy); c.lineTo(7.6, fy); c.stroke(); } }
  c.restore();
}

/** culoarea manecii din partea cealalta (mai inchisa) */
function shadeOf(hex: string) { const n = parseInt(hex.slice(1), 16), f = 0.82; return `rgb(${Math.round((n >> 16) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`; }

// ---------- fata din profil ----------
function face(c: C, id: HamId, eyes: EyeType, mouth: 'smile' | 'open' | 'happy', t: number, blink: boolean) {
  const L = LOOK[id];
  // obrajorul rosu
  const bx = 34, by = 18; const g = c.createRadialGradient(bx, by, 1, bx, by, 17); g.addColorStop(0, rgba(L.blush, 0.85)); g.addColorStop(0.6, rgba(L.blush, 0.45)); g.addColorStop(1, rgba(L.blush, 0));
  c.fillStyle = g; ell(c, bx, by, 17, 14); c.fill(); c.fillStyle = 'rgba(255,255,255,0.75)'; ell(c, bx - 4, by - 4, 2.4, 1.6); c.fill();
  // ochiul (putin mai ingust decat din fata, ca e vazut din lateral)
  const ex = 32, ey = -6;
  c.strokeStyle = O; c.lineCap = 'round';
  if (eyes === 'happy' || blink) { c.lineWidth = 3.4; c.beginPath(); c.arc(ex, ey + 4, 7.5, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); if (L.lashes) { c.lineWidth = 2; c.beginPath(); c.moveTo(ex - 7, ey + 1.5); c.lineTo(ex - 10.5, ey - 1); c.stroke(); } }
  else { eyeShape(c, ex, ey, 8.4, 11.5); if (L.lashes) lashes(c, ex, ey, -1, 8.4, 11.5); }
  // mustatile
  c.strokeStyle = rgba(O, 0.22); c.lineWidth = 1;
  for (const [dy, e2] of [[-2, -7], [1, 0], [4, 7]]) { c.beginPath(); c.moveTo(48, 12 + dy); c.quadraticCurveTo(62, 10 + dy, 76, 10 + e2); c.stroke(); }
  // nasucul in varful botului
  c.beginPath(); c.moveTo(56, 2); c.quadraticCurveTo(63, 1.5, 64, 6); c.quadraticCurveTo(63, 11, 58, 10.5); c.quadraticCurveTo(54.5, 7, 56, 2); c.closePath();
  c.fillStyle = L.nose; c.fill(); c.lineWidth = 1.6; c.strokeStyle = O; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.8)'; ell(c, 59, 4, 1.8, 1); c.fill();
  // gurita: sub nas, spre inapoi
  c.strokeStyle = O; c.lineWidth = 2.3;
  c.beginPath(); c.moveTo(59, 11); c.quadraticCurveTo(59, 15, 56, 17); c.stroke();
  if (mouth === 'open') {
    c.beginPath(); c.moveTo(57.5, 16.5); c.quadraticCurveTo(58, 25, 51, 25.5); c.quadraticCurveTo(47.5, 23, 48.5, 18); c.quadraticCurveTo(53, 18.5, 57.5, 16.5); c.closePath();
    c.fillStyle = '#9b3a45'; c.fill(); c.save(); c.clip(); c.fillStyle = '#ff8c9e'; ell(c, 52.5, 25.5, 5.5, 3.2); c.fill(); c.fillStyle = '#fff'; c.fillRect(54, 15.5, 3.6, 3.8); c.restore();
    c.lineWidth = 2.2; c.stroke();
  } else { c.beginPath(); c.moveTo(56, 17); c.quadraticCurveTo(52.5, 21, 48.5, 18.5); c.stroke(); }
  void t;
}
/** urechea din profil: aceeasi ca din fata, cu interiorul roz spre noi */
function ear(c: C, id: HamId, x: number, y: number, rot: number, far: boolean, wig: number) {
  const L = LOOK[id];
  c.save(); c.translate(x, y); c.rotate(rot + wig * 0.3);
  ell(c, 0, 0, 16, 15); c.fillStyle = far ? L.shade : L.ear; c.fill();
  if (!far) { const g = c.createRadialGradient(1, 2, 1, 1, 2, 11); g.addColorStop(0, rgba(L.earIn, 1)); g.addColorStop(0.7, rgba(L.earIn, 0.9)); g.addColorStop(1, rgba(L.earIn, 0)); c.fillStyle = g; ell(c, 1, 2.5, 10.5, 10); c.fill(); }
  ell(c, 0, 0, 16, 15); c.lineWidth = 3.2; c.strokeStyle = O; c.stroke();
  c.restore();
}
/** fundita ei, pe crestet spre ceafa */
function bowSide(c: C) {
  c.save(); c.translate(-44, -24); c.rotate(-1.0);
  const loop = (side: number, sc: number) => { c.save(); c.scale(sc, 1); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(side * 6, -15, side * 26, -16, side * 25, -1); c.bezierCurveTo(side * 26, 13, side * 6, 13, 0, 0); c.closePath(); c.restore(); };
  for (const [side, sc] of [[-1, 0.7], [1, 1]] as const) {
    loop(side, sc); const g = c.createLinearGradient(0, -14, 0, 12); g.addColorStop(0, side < 0 ? '#ff86a9' : '#ff9dbb'); g.addColorStop(1, '#ff6890'); c.fillStyle = g; c.fill();
    c.save(); loop(side, sc); c.clip(); c.fillStyle = 'rgba(255,255,255,0.85)'; for (const [px, py] of [[9, -6], [17, 2], [14, -10], [21, -5], [8, 4]]) { ell(c, side * px * sc, py, 1.8, 1.8); c.fill(); } c.restore();
    loop(side, sc); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
  }
  c.beginPath(); c.roundRect(-5, -6, 10, 12, 4); c.fillStyle = '#ff5c88'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = O; c.stroke();
  c.restore();
}

export interface SideRig {
  /** talpile: [cea din spate (departe), cea din fata], in unitati de desen fata de sa */
  feet: [Pt, Pt];
  /** labutele: [departe, aproape] */
  hands: [Pt, Pt];
  /** cotul in jos (pe ghidon) sau in sus (cand il tine in brate) */
  hug?: boolean;
  eyes?: EyeType; mouth?: 'smile' | 'open';
  /** aplecarea capului spre inainte (rad) */
  tilt?: number;
  /** cat se ridica la pedalat */
  bob?: number;
  /** hainele (1.14.2: se deseneaza din profil) */
  outfit?: Outfit;
}

/**
 * Hamsterul asezat, din profil, cu fata spre dreapta. (x,y) = locul de pe sa; scale ca la drawCharacter (1 = personaj in lume la scara 1).
 * Intoarce bratul din fata separat cand il tine pe sofer in brate (se deseneaza dupa sofer, peste el).
 */
export function drawHamsterSide(ctx: C, id: HamId, x: number, y: number, scale: number, t: number, rig: SideRig): (() => void) | null {
  const L = LOOK[id], o = rig.outfit;
  const body = o?.body && o.body !== 'none' ? o.body : '', head = o?.head && o.head !== 'none' ? o.head : '';
  const faceW = o?.face && o.face !== 'none' ? o.face : '', neck = o?.neck && o.neck !== 'none' ? o.neck : '';
  const pants = body ? sideLegWear(body) : null, sl = body ? sleeveOf(body) : null;
  const longGown = body === 'rochie' || body === 'mireasa';
  ctx.save(); ctx.translate(x, y - (rig.bob ?? 0) * scale); ctx.scale(scale * HS, scale * HS); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const k = bucket(ctx), tilt = rig.tilt ?? 0.06, breath = Math.sin(t * 3) * 0.8;
  // umerii si soldurile (unitati de desen fata de sa)
  const sh = (far: boolean): Pt => ({ x: far ? 28 : 22, y: far ? -60 : -56 });
  const hip = (far: boolean): Pt => ({ x: far ? -2 : -6, y: far ? -24 : -20 });
  const leg = (far: boolean) => {
    // asezat, piciorul din spate al hamsterului e o coapsa rotunda; din ea iese doar laba scurta pana la pedala
    const f = rig.feet[far ? 0 : 1], h = { x: far ? 8 : 2, y: far ? -22 : -18 };
    const col = pants ? (far ? pants.dark : pants.col) : far ? L.shade : L.body;
    const dx = f.x - h.x, dy = f.y - h.y, d = Math.hypot(dx, dy) || 1;
    const knee = { x: h.x + dx / d * 13, y: h.y + dy / d * 13 };
    const ank = { x: f.x - 4, y: f.y - 6 };
    seg(ctx, knee, ank, 12, 9.5, col);
    foot(ctx, id, { x: f.x - 2, y: f.y - 4 }, Math.max(-0.5, Math.min(0.5, (f.x - ank.x) * 0.02)), far);
    // coapsa: rotunda, cu blana, peste inceputul labei
    ctx.save(); ctx.beginPath(); ctx.ellipse(h.x, h.y, 23, 19, -0.2, 0, TAU);
    ctx.fillStyle = col; ctx.fill(); ctx.clip();
    if (pants) { // pantalonul: umbra pe dedesubt si cuta de la genunchi (fara luciu de minge)
      const g = ctx.createLinearGradient(0, h.y - 19, 0, h.y + 19); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(10,10,30,0.3)');
      ctx.fillStyle = g; ctx.fillRect(h.x - 30, h.y - 30, 60, 60);
      ctx.strokeStyle = 'rgba(10,10,30,0.3)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(h.x + 4, h.y - 6); ctx.quadraticCurveTo(h.x + 12, h.y + 2, h.x + 20, h.y + 4); ctx.stroke();
    } else {
      const g = ctx.createRadialGradient(h.x - 8, h.y - 10, 3, h.x, h.y, 26); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, rgba(L.deep, 0.35));
      ctx.fillStyle = g; ctx.fillRect(h.x - 30, h.y - 30, 60, 60);
    }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(h.x, h.y, 23, 19, -0.2, Math.PI * 1.05, Math.PI * 2.55); ctx.lineWidth = 2.8; ctx.strokeStyle = O; ctx.stroke();
  };
  const arm = (far: boolean) => {
    const s0 = sh(far), [elb, hd] = ik(s0, rig.hands[far ? 0 : 1], 21, 20, rig.hug ? 1 : -1);
    const fur = far ? L.shade : L.body;
    const sleeve = sl ? (far ? shadeOf(sl.col) : sl.col) : '';
    seg(ctx, s0, elb, sleeve ? 10.5 : 9.5, sleeve ? 9 : 8, sleeve || fur, 2.6);
    seg(ctx, elb, hd, 8, 6.5, sl && sl.len >= 12 ? sleeve : fur, 2.6);
    if (sl?.cuff && sl.len >= 12) { const q = { x: hd.x + (elb.x - hd.x) * 0.25, y: hd.y + (elb.y - hd.y) * 0.25 }; const n = Math.atan2(hd.y - elb.y, hd.x - elb.x) + Math.PI / 2; ctx.strokeStyle = sl.cuff; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(q.x + Math.cos(n) * 7, q.y + Math.sin(n) * 7); ctx.lineTo(q.x - Math.cos(n) * 7, q.y - Math.sin(n) * 7); ctx.stroke(); }
    paw(ctx, id, hd, Math.atan2(hd.y - elb.y, hd.x - elb.x), far);
  };
  // 1) in spate: bratul si piciorul din partea cealalta, urechea de departe
  arm(true); leg(true);
  // 2) codita
  ell(ctx, -48, -16, 8, 7); ctx.fillStyle = L.shade; ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = O; ctx.stroke();
  // 3) corpul
  blit(ctx, bodySprite(id, k));
  if (body) sideBodyWear(ctx, body, 'torso', geo(id).bodyP, t);
  if (o?.pin) sidePin(ctx, o.pin, t);
  // 4) piciorul din fata (peste corp), apoi fusta / sortul peste el; bratul de pe ghidon intra sub cap
  leg(false);
  if (body) sideBodyWear(ctx, body, 'over', geo(id).bodyP, t);
  if (!rig.hug) arm(false);
  void longGown;
  // 5) capul, putin aplecat in directia de mers
  if (body) sideBodyWear(ctx, body, 'hood', geo(id).bodyP, t);
  const hm = new DOMMatrix().translate(SIDE_HEAD.x, SIDE_HEAD.y + breath).rotate(tilt * 180 / Math.PI);
  ctx.save(); ctx.transform(hm.a, hm.b, hm.c, hm.d, hm.e, hm.f);
  const hide = sideHides(head);
  if (head) sideHeadWear(ctx, head, 'behind', t);
  if (!hide.ears) ear(ctx, id, 4, -50, 0.35, true, Math.sin(t * 5) * 0.1);
  blit(ctx, headSprite(id, k));
  if (!hide.ears) ear(ctx, id, -18, -46, -0.25, false, Math.sin(t * 5 + 1) * 0.1);
  const blink = (t % 3.7) < 0.12;
  face(ctx, id, rig.eyes ?? 'dot', rig.mouth ?? 'smile', t, blink);
  if (faceW) sideFaceWear(ctx, faceW, t);
  if (head) sideHeadWear(ctx, head, 'front', t); else if (id === 'bubu') bowSide(ctx);
  if (neck) sideNeckWear(ctx, neck, t);
  else if (id === 'dudu' && body !== 'hanorac' && body !== 'geaca') bowtieSide(ctx, body === 'mire' ? '#3a3a46' : undefined, body === 'mire' ? '#15151b' : undefined);
  ctx.restore();
  // gulerul pufos / gluga: in jurul gatului, peste baza capului
  if (body) sideBodyWear(ctx, body, 'collar', geo(id).bodyP, t);
  ctx.restore();
  if (!rig.hug) return null;
  // 6) bratul cu care il tine in brate: dupa sofer (peste el), dar tot pe sub capul ei
  return () => {
    ctx.save(); ctx.translate(x, y - (rig.bob ?? 0) * scale); ctx.scale(scale * HS, scale * HS); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const clip = new Path2D(); clip.rect(-400, -400, 800, 800); clip.addPath(geo(id).headP, hm);
    ctx.clip(clip, 'evenodd'); arm(false); ctx.restore();
  };
}
