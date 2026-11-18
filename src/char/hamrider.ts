// Hamsterii pe vehicule (1.14.2): corpul din profil (spre dreapta), asezat pe sa, cu picioarele pe pedale / pe podea
// si labutele pe ghidon / pe volan; capul e cel adevarat din joc (din fata, cu fundita, palaria, ochelarii), intors
// spre tine ca in desenele cu personaje mari. Pasagerul il tine pe sofer in brate.
// Unitati: aceleasi ca la personajul in picioare la scara 1 (capul ~60 latime); (0,0) = punctul de pe sa.
import { drawCharacter, type CharSpec } from './draw';
import { basePose } from './pose';
import { LOOK, rgba, type HamId } from './hamster';
import { sleeveOf } from './hamwear';
import type { Outfit } from './outfit';

const O = '#4a2a22';
const TAU = Math.PI * 2;
type C = CanvasRenderingContext2D;
export type Pt = { x: number; y: number };
const ell = (c: C, x: number, y: number, rx: number, ry: number, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
const st = (c: C, fill: string | CanvasGradient, lw = 1.6) => { c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = O; c.stroke(); };

// hainele vazute din profil: culoarea, cat de lunga e fusta, model
interface Wear { col: string; dark: string; skirt?: number; dots?: string; stars?: boolean; bib?: boolean; shirt?: string; trim?: string }
const WEAR: Record<string, Wear> = {
  rochita: { col: '#f7a8b8', dark: '#ef8fa6', skirt: 9, dots: '#ffffff' },
  rochie: { col: '#de1f45', dark: '#97102b', skirt: 16 },
  mireasa: { col: '#fffdf8', dark: '#eadfd6', skirt: 18, trim: '#ffd6e4' },
  ie: { col: '#fffaf0', dark: '#f6ead6', trim: '#d62828' },
  vesta: { col: '#c43a44', dark: '#97222c', shirt: '#fffaf0' },
  salopeta: { col: '#5b8be0', dark: '#3d6cc0', bib: true },
  tricou: { col: '#a9d4f5', dark: '#7fb3de', dots: '#ffffff' },
  pulover: { col: '#8cc77f', dark: '#6aa95e', trim: '#fff6e0' },
  costum: { col: '#2f3b5c', dark: '#23232b', shirt: '#ffffff' },
  mire: { col: '#23232b', dark: '#15151b', shirt: '#ffffff' },
  pijama: { col: '#cfe7ff', dark: '#a9d0f5', stars: true },
  hanorac: { col: '#c9b6f2', dark: '#a993e0' },
  sort: { col: '#ff9ab8', dark: '#f07a9c', bib: true },
  geaca: { col: '#fffaf3', dark: '#e6dccf', trim: '#b9a3ea' },
};

/** doua segmente (coapsa-gamba, brat-antebrat) de la a pana la tinta; bend = in ce parte se indoaie genunchiul / cotul */
function ik(a: Pt, tgt: Pt, l1: number, l2: number, bend: 1 | -1): [Pt, Pt] {
  let dx = tgt.x - a.x, dy = tgt.y - a.y; let d = Math.hypot(dx, dy);
  const max = (l1 + l2) * 0.995; if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  d = Math.max(d, Math.abs(l1 - l2) + 0.1);
  const base = Math.atan2(dy, dx), k = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const m = { x: a.x + Math.cos(base - bend * k) * l1, y: a.y + Math.sin(base - bend * k) * l1 };
  return [m, { x: a.x + dx, y: a.y + dy }];
}
function limb(c: C, a: Pt, b: Pt, w: number, col: string) {
  c.lineCap = 'round';
  c.strokeStyle = O; c.lineWidth = w + 3.2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
}

export interface RideOpt {
  /** unde ajung talpile (piciorul din spate, cel din fata), in coordonatele vehiculului */
  feet: [Pt, Pt];
  /** unde ajung labutele: pe ghidon / volan; pentru pasager = mijlocul soferului (il tine in brate) */
  hands: [Pt, Pt];
  hug?: boolean;
  /** cat se apleaca in fata (rad) */
  lean?: number;
}

/**
 * Deseneaza calaretul. (x,y) = punctul de pe sa, s = scara (1 = cat personajul in picioare la scara 1).
 * Intoarce bratul din fata separat cand il tine in brate pe sofer: se deseneaza DUPA sofer, ca sa se vada peste el.
 */
export function drawHamRider(c: C, spec: CharSpec, x: number, y: number, s: number, t: number, o: Outfit | undefined, opt: RideOpt): (() => void) | null {
  const id = spec.id as HamId, L = LOOK[id];
  const body = o?.body && o.body !== 'none' ? o.body : '';
  const w = WEAR[body], sl = body ? sleeveOf(body) : null;
  const lean = opt.lean ?? 0.12;
  const loc = (p: Pt): Pt => ({ x: (p.x - x) / s, y: (p.y - y) / s }); // din vehicul in coordonatele calaretului
  const feet = opt.feet.map(loc) as [Pt, Pt], hands = opt.hands.map(loc) as [Pt, Pt];
  const breath = Math.sin(t * 3) * 0.4;
  const hip: Pt = { x: 3, y: -5 };
  // umerii: se apleaca odata cu trunchiul
  const sh = (side: number): Pt => ({ x: 7 + Math.sin(lean) * 22 + side * 2.5, y: -27 + side * 1.2 + breath });

  const legs = (back: boolean) => {
    const side = back ? 0 : 1, f = feet[side];
    const h = { x: hip.x + (back ? -2 : 2), y: hip.y };
    const [knee, foot] = ik(h, f, 14, 12, -1);
    const col = back ? L.shade : L.body;
    const pant = w && (w.bib || body === 'pijama' || body === 'costum' || body === 'mire') ? (back ? w.dark : w.col) : '';
    limb(c, h, knee, 13, pant || col);
    limb(c, knee, foot, 10, pant && (w!.bib || body === 'pijama') ? (back ? w!.dark : w!.col) : col);
    // talpa (pe pedala), cu pernuta roz
    c.save(); c.translate(foot.x + 2.5, foot.y); ell(c, 0, 0, 7, 4.2); st(c, back ? L.shade : L.body);
    c.fillStyle = back ? L.pawDark : L.paw; ell(c, 0.5, 1.6, 3.8, 1.8); c.fill(); c.restore();
  };
  const arm = (back: boolean) => {
    const side = back ? -1 : 1, s0 = sh(side), tgt = hands[back ? 0 : 1];
    const [elb, hand] = ik(s0, tgt, 11, 11, opt.hug ? 1 : -1);
    const fur = back ? L.shade : L.body;
    const sleeve = sl ? (back ? rgba(sl.col, 1) : sl.col) : '';
    limb(c, s0, elb, 8.5, sleeve || fur);
    limb(c, elb, hand, 7.5, sl && sl.len > 0.6 ? sleeve : fur);
    ell(c, hand.x, hand.y, 4.6, 4.2); st(c, back ? L.shade : L.body, 1.5);
    c.fillStyle = back ? L.pawDark : L.paw; ell(c, hand.x + 1, hand.y + 1.2, 2.2, 1.6); c.fill();
  };
  const bodyPath = () => {
    c.save(); c.translate(1, -19); c.rotate(lean);
    c.beginPath(); c.moveTo(-17, 14); c.bezierCurveTo(-27, 4, -24, -19, -6, -22); c.bezierCurveTo(10, -25, 24, -12, 22, 4); c.bezierCurveTo(21, 15, 10, 19, 0, 19); c.bezierCurveTo(-8, 19, -13, 18, -17, 14); c.closePath();
    c.restore();
  };

  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
  // 1) ce e in spate: bratul si piciorul din partea cealalta (mai inchise)
  arm(true); legs(true);
  // 2) codita
  ell(c, -21, -7, 4.5, 4); st(c, L.shade, 1.4);
  // 3) corpul din profil
  bodyPath(); c.fillStyle = L.body; c.fill();
  c.save(); bodyPath(); c.clip();
  c.fillStyle = L.belly; ell(c, 15, -14, 10, 15, lean); c.fill();
  const g = c.createRadialGradient(-2, -34, 4, 0, -18, 30); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, rgba(L.shade, 0.8));
  c.fillStyle = g; c.fillRect(-40, -50, 80, 70);
  // hainele, peste corp
  if (w) {
    const top = w.bib ? -14 : -40;
    c.fillStyle = w.col; c.fillRect(-40, top, 80, 60);
    if (w.bib) { c.fillRect(6, -30, 16, 18); c.strokeStyle = w.dark; c.lineWidth = 3; c.beginPath(); c.moveTo(-10, -14); c.quadraticCurveTo(-4, -32, 10, -34); c.stroke(); }
    if (w.shirt) { c.fillStyle = w.shirt; c.beginPath(); c.moveTo(10, -38); c.lineTo(24, -38); c.lineTo(22, -8); c.closePath(); c.fill(); if (body !== 'vesta') { c.fillStyle = '#c8102e'; c.beginPath(); c.moveTo(18, -32); c.lineTo(22, -30); c.lineTo(20, -18); c.closePath(); c.fill(); } }
    if (w.dots) { c.fillStyle = w.dots; for (let yy = -38; yy < 0; yy += 7) for (let xx = -26; xx < 26; xx += 7) { ell(c, xx + ((yy / 7) & 1 ? 3.5 : 0), yy, 1.4, 1.4); c.fill(); } }
    if (w.stars) { c.fillStyle = '#fff7c2'; for (const [sx, sy] of [[-10, -30], [8, -22], [-4, -12], [14, -34]]) { ell(c, sx, sy, 1.8, 1.8); c.fill(); } }
    if (w.trim) { c.strokeStyle = w.trim; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-26, -6); c.quadraticCurveTo(0, -2, 26, -8); c.stroke(); }
    c.fillStyle = 'rgba(50,25,20,0.12)'; c.fillRect(-40, -8, 80, 20); // umbra de jos
  }
  c.restore();
  bodyPath(); c.lineWidth = 1.6; c.strokeStyle = O; c.stroke();
  // fusta peste sa (rochitele)
  if (w?.skirt) {
    c.beginPath(); c.moveTo(-18, -10); c.quadraticCurveTo(-24, 0, -22 - w.skirt * 0.3, 2 + w.skirt * 0.4); c.quadraticCurveTo(2, 8 + w.skirt * 0.5, 22 + w.skirt * 0.5, 1 + w.skirt * 0.3); c.quadraticCurveTo(22, -6, 18, -12); c.closePath();
    st(c, w.col); if (w.dots) { c.save(); c.clip(); c.fillStyle = w.dots; for (let xx = -24; xx < 30; xx += 7) { ell(c, xx, 1 + (xx & 4 ? 2 : 0), 1.4, 1.4); c.fill(); } c.restore(); }
    if (w.trim) { c.strokeStyle = w.trim; c.lineWidth = 2; c.beginPath(); c.moveTo(-21 - w.skirt * 0.3, 1 + w.skirt * 0.4); c.quadraticCurveTo(2, 6 + w.skirt * 0.5, 21 + w.skirt * 0.5, w.skirt * 0.3); c.stroke(); }
  }
  // 4) piciorul din fata (peste corp si fusta)
  legs(false);
  // 5) capul adevarat (din fata, intors spre tine), usor aplecat in directia de mers
  const P = basePose(); P.headOnly = true; P.eyes = opt.hug ? 'happy' : 'dot'; P.mouth = opt.hug ? 'smile' : 'open'; P.blush = 1;
  P.pupilDx = 2.5; P.rot = 0.08 + Math.sin(t * 2.2) * 0.04;
  const head = { x: 6 + Math.sin(lean) * 26, y: -54 + breath };
  drawCharacter(c, spec, P, head.x, head.y, 1, 1, t, o);
  // 6) bratul din fata: pe ghidon (dupa cap) sau, la pasager, mai tarziu, peste sofer
  c.restore();
  const front = () => { c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; arm(false); c.restore(); };
  if (opt.hug) return front;
  front(); return null;
}
