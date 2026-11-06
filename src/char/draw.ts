import type { Pose, EyeType, MouthType, PropType } from './pose';
import { drawHeadItem, drawFaceItem, drawNeckItem, drawBodyItem, type Outfit } from './outfit';

export type CharId = 'bubu' | 'dudu';

export interface CharSpec {
  id: CharId;
  name: string;
  body: string;       // culoarea blanii
  shade: string;      // umbra blanii
  ear: string;
  earInner: string | null;
  cheek: string;
  outline: string;
  tail: string;
  accessory: 'none' | 'bow';
  ears?: 'round' | 'bunny' | 'cat' | 'pig' | 'dog' | 'fox';
  muzzle?: string;      // culoarea botului (NPC)
  nose?: string;
}

/** clientii din sat (NPC), desenati in acelasi stil */
export const NPC_SPECS: Record<string, CharSpec> = {
  bunny: { id: 'npc' as CharId, name: 'Iepurașul Ina', body: '#fbf6f2', shade: '#e6dcd4', ear: '#fbf6f2', earInner: '#ffc2d1', cheek: '#ffa3b8', outline: '#2b1d17', tail: '#ffffff', accessory: 'bow', ears: 'bunny' },
  granny: { id: 'npc' as CharId, name: 'Bunica Leana', body: '#cfc8c3', shade: '#aea49e', ear: '#cfc8c3', earInner: '#f1c6cf', cheek: '#ff9fb0', outline: '#2b1d17', tail: '#eee', accessory: 'none', ears: 'bunny' },
  pig: { id: 'npc' as CharId, name: 'Purcelușul Gogu', body: '#ffc4d0', shade: '#f0a3b4', ear: '#ffb0c2', earInner: null, cheek: '#ff7f9e', outline: '#2b1d17', tail: '#ff9fb5', accessory: 'none', ears: 'pig', muzzle: '#ff9fb5' },
  cat: { id: 'npc' as CharId, name: 'Pisica Miti', body: '#f7b267', shade: '#e09145', ear: '#f7b267', earInner: '#ffd6c9', cheek: '#ff8f8f', outline: '#2b1d17', tail: '#e09145', accessory: 'none', ears: 'cat', muzzle: '#fff1e0', nose: '#e5677d' },
  fox: { id: 'npc' as CharId, name: 'Vulpița Rita', body: '#f08a4b', shade: '#d06a2f', ear: '#f08a4b', earInner: '#3a2418', cheek: '#ff9a9a', outline: '#2b1d17', tail: '#fff', accessory: 'none', ears: 'fox', muzzle: '#fff4ea' },
  dog: { id: 'npc' as CharId, name: 'Cățelul Rex', body: '#e6c79c', shade: '#c9a678', ear: '#8a5d32', earInner: null, cheek: '#ff9a9a', outline: '#2b1d17', tail: '#8a5d32', accessory: 'none', ears: 'dog', muzzle: '#fff4ea' },
};

export const SPECS: Record<CharId, CharSpec> = {
  // Bubu = panda (fata): alba si dolofana, urechi maro-inchis, obrajori roz
  bubu: {
    id: 'bubu', name: 'Bubu', body: '#ffffff', shade: '#efe6e3', ear: '#4a2a22',
    earInner: null, cheek: '#f9bdbd', outline: '#4a2a22', tail: '#4a2a22', accessory: 'none',
  },
  // Dudu = ursuletul (baiatul): maro deschis-rozaliu, urechi cu interior inchis, obrajori galbui
  dudu: {
    id: 'dudu', name: 'Dudu', body: '#dba68a', shade: '#c8917a', ear: '#dba68a',
    earInner: '#4a2a22', cheek: '#f9c47f', outline: '#4a2a22', tail: '#c8917a', accessory: 'none',
  },
};

const LW = 2.7; // grosimea conturului

function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
}
function fillStroke(ctx: CanvasRenderingContext2D, fill: string, stroke: string, lw = LW) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke();
}
function capsule(ctx: CanvasRenderingContext2D, w: number, len: number) {
  ctx.beginPath();
  ctx.roundRect(-w / 2, -w / 2, w, len + w, w / 2);
}
/** capul in forma de "mochi": lat, crestet putin turtit, obrajori plini jos */
function mochiPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(-w, 2);
  ctx.bezierCurveTo(-w * 1.0, -h * 1.02, w * 1.0, -h * 1.02, w, 2);
  ctx.bezierCurveTo(w * 1.04, h * 1.08, -w * 1.04, h * 1.08, -w, 2);
  ctx.closePath();
}

export function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 1.0, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.0, y - s * 0.35, x, y + s * 0.35);
  ctx.closePath();
}

/**
 * Deseneaza un personaj cu originea la mijlocul picioarelor.
 * flip = -1 priveste spre stanga.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D, spec: CharSpec, p: Pose,
  x: number, y: number, scale: number, flip: 1 | -1, time: number, outfit?: Outfit,
) {
  curOutfit = outfit;
  const O = spec.outline;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * flip, scale);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  if (p.headOnly) { // doar capul, de ex. pe perna sau in spuma din cada
    ctx.translate(p.dx, p.dy); ctx.rotate(p.rot);
    drawHead(ctx, spec, p, time, 0);
    ctx.restore();
    return;
  }
  // umbra pe sol (nu se misca cu corpul pe verticala)
  const lift = Math.max(0, -p.dy);
  const sh = p.shadowScale * Math.max(0.35, 1 - lift / 160);
  ctx.fillStyle = 'rgba(60,35,30,0.18)';
  ell(ctx, p.dx * 0.6, 1, 25 * sh, 6.5 * sh); ctx.fill();

  ctx.translate(p.dx, p.dy);
  ctx.rotate(p.rot);
  ctx.scale(p.sx, p.sy);

  const bodyFill = p.sickTint > 0 ? mix(spec.body, '#bfe3a6', p.sickTint * 0.45) : spec.body;

  // Corpul, manutele si piciorusele sunt O SINGURA forma moale (ca la stickere):
  // intai conturam toate bucatile cu linie dubla, apoi le umplem fara contur,
  // asa ca nu se mai vad "incheieturi" intre ele.
  const legPath = (side: -1 | 1) => {
    const lift2 = side < 0 ? p.legL : p.legR, ox = side < 0 ? p.legLx : p.legRx;
    ctx.beginPath(); ctx.ellipse(side * 13 + ox, -5 - lift2, 8.5, 7, side * 0.12, 0, 7);
  };
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(p.hip - 22, -42);
    ctx.bezierCurveTo(p.hip - 32, -32, p.hip - 33, -12, p.hip - 22, -6);
    ctx.quadraticCurveTo(p.hip, -8, p.hip + 22, -6);
    ctx.bezierCurveTo(p.hip + 33, -12, p.hip + 32, -32, p.hip + 22, -42);
    ctx.closePath();
  };
  const ARM_OFS = -0.25; // in repaus manutele stau in jos, langa burtica
  const armTf = (side: -1 | 1, ang: number) => { ctx.translate(side * 24 + p.hip * 0.5, -33); ctx.rotate(side < 0 ? ang + ARM_OFS : -(ang + ARM_OFS)); };
  const armPath = () => { ctx.beginPath(); ctx.ellipse(0, 7, 6.5, 8.5, 0, 0, 7); };
  const silhouette = (mode: 'stroke' | 'fill') => {
    const doIt = () => { if (mode === 'stroke') ctx.stroke(); else ctx.fill(); };
    for (const side of [-1, 1] as const) { legPath(side); doIt(); }
    bodyPath(); doIt();
    for (const [side, ang] of [[-1, p.armL], [1, p.armR]] as const) { ctx.save(); armTf(side, ang); armPath(); doIt(); ctx.restore(); }
  };
  ctx.lineJoin = 'round'; ctx.strokeStyle = O; ctx.lineWidth = LW * 2;
  silhouette('stroke');
  ctx.fillStyle = bodyFill;
  silhouette('fill');
  if (outfit?.body && outfit.body !== 'none' && !p.headOnly) drawBodyItem(ctx, outfit.body, bodyPath, fn => {
    for (const [side, ang] of [[-1, p.armL], [1, p.armR]] as const) { if (ang + ARM_OFS >= 1.75) continue; ctx.save(); armTf(side, ang); armPath(); ctx.clip(); fn(); ctx.restore(); }
  }, p.hip, time);
  // linia scurta dintre manuta si burtica (doar pe marginea interioara, nu tot conturul)
  ctx.strokeStyle = O; ctx.lineWidth = LW;
  for (const [side, ang] of [[-1, p.armL], [1, p.armR]] as const) {
    if (ang + ARM_OFS >= 1.75) continue;
    ctx.save(); armTf(side, ang); ctx.beginPath();
    if (side < 0) ctx.ellipse(0, 7, 6.5, 8.5, 0, -0.1 * Math.PI, 0.42 * Math.PI); else ctx.ellipse(0, 7, 6.5, 8.5, 0, 0.58 * Math.PI, 1.1 * Math.PI);
    ctx.stroke(); ctx.restore();
  }
  // umbra moale pe burtica + talpile
  ctx.save(); bodyPath(); ctx.clip();
  ctx.fillStyle = spec.shade; ctx.globalAlpha = 0.35; ell(ctx, p.hip + 4, -9, 28, 7); ctx.fill();
  ctx.restore();
  if (!p.back) for (const side of [-1, 1] as const) {
    const lift2 = side < 0 ? p.legL : p.legR, ox = side < 0 ? p.legLx : p.legRx;
    ctx.fillStyle = spec.id === 'dudu' ? '#c8917a' : spec.id === 'bubu' ? '#4a2a22' : '#ffd3dd';
    ell(ctx, side * 13 + ox, -1 - lift2, 5, 2.6); ctx.fill();
  }
  if (p.back) { ell(ctx, p.hip, -10, 6, 5.5); fillStroke(ctx, spec.tail, O, 2); }

  if (outfit && outfit.neck !== 'none' && !p.back) drawNeckItem(ctx, outfit.neck, time);
  // recuzita din labute
  for (const [side, ang, prop, pr] of [[-1, p.armL, p.propL, p.propRotL], [1, p.armR, p.propR, p.propRotR]] as const) {
    if (prop === 'none' || ang + ARM_OFS >= 1.75) continue;
    ctx.save(); armTf(side, ang); ctx.translate(0, 13); ctx.rotate(pr * (side < 0 ? 1 : -1) - (side < 0 ? ARM_OFS : -ARM_OFS)); drawProp(ctx, prop, O, time); ctx.restore();
  }

  drawHead(ctx, spec, p, time, -62);
  // manutele ridicate se vad in fata capului (ca la stickere cand saluta)
  for (const [side, ang, prop, pr] of [[-1, p.armL, p.propL, p.propRotL], [1, p.armR, p.propR, p.propRotR]] as const) {
    if (ang + ARM_OFS < 1.75) continue;
    ctx.save(); armTf(side, ang); armPath(); fillStroke(ctx, bodyFill, O);
    if (prop !== 'none') { ctx.translate(0, 13); ctx.rotate(pr * (side < 0 ? 1 : -1) - (side < 0 ? ARM_OFS : -ARM_OFS)); drawProp(ctx, prop, O, time); }
    ctx.restore();
  }
  ctx.restore();
}

let curOutfit: Outfit | undefined;
const HW = 38, HH = 33; // marimea capului (mare, ca la stickere)

function drawHead(ctx: CanvasRenderingContext2D, spec: CharSpec, p: Pose, time: number, baseY: number) {
  const O = spec.outline;
  const bodyFill = p.sickTint > 0 ? mix(spec.body, '#bfe3a6', p.sickTint * 0.45) : spec.body;
  ctx.save();
  ctx.translate(p.headDx, baseY + p.headDy);
  ctx.rotate(p.headRot);
  const ew = p.earWiggle;
  // urechi mici, rotunde, pe "colturile" capului
  const es = spec.ears ?? 'round';
  for (const side of [-1, 1]) {
    ctx.save();
    if (es === 'bunny') {
      ctx.translate(side * 11, -24); ctx.rotate(side * (0.18 + ew * 0.3 + Math.sin(time * 2 + side) * 0.04));
      ell(ctx, 0, -14, 7, 17); fillStroke(ctx, spec.ear, O);
      ctx.fillStyle = spec.earInner ?? '#ffc2d1'; ell(ctx, 0, -13, 3.5, 12); ctx.fill();
    } else if (es === 'cat' || es === 'fox') {
      ctx.translate(side * 21, -18); ctx.rotate(side * (0.35 + ew * 0.3));
      ctx.beginPath(); ctx.moveTo(-9, 4); ctx.lineTo(0, es === 'fox' ? -19 : -15); ctx.lineTo(9, 4); ctx.closePath(); fillStroke(ctx, spec.ear, O);
      ctx.fillStyle = spec.earInner ?? '#ffc2d1'; ctx.beginPath(); ctx.moveTo(-4.5, 2); ctx.lineTo(0, es === 'fox' ? -12 : -9); ctx.lineTo(4.5, 2); ctx.closePath(); ctx.fill();
    } else if (es === 'pig') {
      ctx.translate(side * 22, -19); ctx.rotate(side * (0.6 + ew * 0.3));
      ctx.beginPath(); ctx.moveTo(-8, 4); ctx.quadraticCurveTo(0, -16, 8, 4); ctx.closePath(); fillStroke(ctx, spec.ear, O);
    } else if (es === 'dog') {
      ctx.translate(side * 29, -8); ctx.rotate(side * (-0.25 + Math.sin(time * 3) * 0.05));
      ell(ctx, 0, 6, 8, 15); fillStroke(ctx, spec.ear, O);
    } else {
      ctx.translate(side * 28, -24);
      ctx.rotate(side * (0.35 + ew * 0.3));
      ell(ctx, 0, 0, 11, 10.5); fillStroke(ctx, spec.ear, O);
      if (spec.earInner) { ctx.fillStyle = spec.earInner; ell(ctx, -side * 1.2, 1.5, 6.4, 6); ctx.fill(); }
    }
    ctx.restore();
  }
  mochiPath(ctx, HW, HH);
  fillStroke(ctx, bodyFill, O);
  // umbra fina jos + luciu sus
  ctx.save(); mochiPath(ctx, HW, HH); ctx.clip();
  ctx.fillStyle = spec.shade; ctx.globalAlpha = 0.3;
  ell(ctx, 4, HH + 8, HW * 1.05, 11); ctx.fill();
  ctx.restore();
  if (spec.accessory === 'bow') drawBow(ctx, 17, -23, O);

  if (!p.back) { drawFace(ctx, spec, p, time); if (curOutfit && curOutfit.face !== 'none') drawFaceItem(ctx, curOutfit.face); }
  if (curOutfit && curOutfit.head !== 'none') drawHeadItem(ctx, curOutfit.head, time);
  if (p.back) { // ceafa
    ctx.strokeStyle = O; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-5, 22); ctx.quadraticCurveTo(0, 18, 5, 22); ctx.stroke();
  }
  if (p.vein > 0) drawVein(ctx, 23, -14, p.vein, time);
  if (p.sweat > 0) drawSweat(ctx, -31, -8, p.sweat, time);
  if (p.dizzy > 0) drawDizzy(ctx, p.dizzy, time);
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, spec: CharSpec, p: Pose, t: number) {
  const O = '#4a2a22';
  const ex = 16, ey = 6 + p.pupilDy;
  // obrajori roz, cu un mic luciu
  if (p.blush > 0) {
    const a = Math.min(1, p.blush);
    ctx.fillStyle = spec.cheek; ctx.globalAlpha = a * 0.95;
    ell(ctx, -27, 15, 8.5, 7.6); ctx.fill();
    ell(ctx, 27, 15, 8.5, 7.6); ctx.fill();
    if (p.blush > 1) { // linii de rusine
      ctx.strokeStyle = '#e0607e'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.9;
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(s * 25 + i * 3 - 3, 12.5); ctx.lineTo(s * 25 + i * 3 - 5, 16.5); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  // botul NPC-urilor
  if (spec.muzzle) {
    if (spec.ears === 'pig') {
      ctx.fillStyle = spec.muzzle; ell(ctx, 0, 10, 8.5, 6); ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = '#c2577a'; ell(ctx, -3, 10, 1.6, 2.4); ctx.fill(); ell(ctx, 3, 10, 1.6, 2.4); ctx.fill();
    } else {
      ctx.fillStyle = spec.muzzle; ell(ctx, 0, 10.5, 9, 6.2); ctx.fill();
      ctx.fillStyle = spec.nose ?? O; ell(ctx, 0, 7.4, 2.8, 1.9); ctx.fill();
      if (spec.ears === 'cat') { ctx.strokeStyle = O; ctx.lineWidth = 1; for (const s2 of [-1, 1]) for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s2 * 9, 10 + k); ctx.lineTo(s2 * 20, 9 + k * 3); ctx.stroke(); } }
    }
  }
  drawEye(ctx, -ex + p.pupilDx, ey, -1, p.eyes, O, t);
  drawEye(ctx, ex + p.pupilDx, ey, 1, p.eyesR ?? p.eyes, O, t);
  // sprancene
  if (p.brows !== 'none') {
    ctx.strokeStyle = O; ctx.lineWidth = 2.1;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      if (p.brows === 'angry') { ctx.moveTo(s * 18, -6); ctx.lineTo(s * 8, -2); }
      else if (p.brows === 'sad') { ctx.moveTo(s * 18, -2); ctx.lineTo(s * 9, -6); }
      else { ctx.moveTo(s * 17, -7); ctx.quadraticCurveTo(s * 13, -10, s * 9, -7); }
      ctx.stroke();
    }
  }
  drawMouth(ctx, p.mouth, spec.muzzle && spec.ears !== 'pig' ? 12 : spec.ears === 'pig' ? 15.5 : 11, O, t);

  if (p.tears > 0) drawTears(ctx, ex, ey, p.tears, t);
  if (p.snot > 0) {
    const r = 2 + p.snot * 6 * (0.75 + 0.25 * Math.sin(t * 2.5));
    ctx.fillStyle = 'rgba(170,220,255,0.55)'; ctx.strokeStyle = 'rgba(90,150,210,0.9)'; ctx.lineWidth = 1;
    ell(ctx, 4 + r * 0.6, 8, r, r * 0.9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ell(ctx, 3 + r * 0.4, 6.5, r * 0.25, r * 0.2); ctx.fill();
  }
}

function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, side: number, type: EyeType, O: string, t: number) {
  ctx.strokeStyle = O; ctx.fillStyle = O; ctx.lineWidth = 2.3;
  switch (type) {
    case 'dot':
    case 'angry':
    case 'sad':
      ell(ctx, x, y, 4.6, 5.1); ctx.fill();
      break;
    case 'side':
      ell(ctx, x + 2, y, 3.3, 3.9); ctx.fill();
      break;
    case 'happy': // ^ ^
      ctx.beginPath(); ctx.arc(x, y + 2.5, 4.2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      break;
    case 'closed': // -_-  (somn)
      ctx.beginPath(); ctx.arc(x, y - 1, 4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      break;
    case 'half':
      ctx.beginPath(); ctx.moveTo(x - 4.5, y - 1); ctx.lineTo(x + 4.5, y - 1); ctx.stroke();
      ell(ctx, x, y + 1.2, 2.6, 1.8); ctx.fill();
      break;
    case 'wide':
      ctx.fillStyle = '#fff'; ell(ctx, x, y, 5.5, 6.2); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = O; ell(ctx, x, y + 0.5, 2.4, 2.8); ctx.fill();
      break;
    case 'x':
      ctx.beginPath(); ctx.moveTo(x - 3.5, y - 3.5); ctx.lineTo(x + 3.5, y + 3.5);
      ctx.moveTo(x + 3.5, y - 3.5); ctx.lineTo(x - 3.5, y + 3.5); ctx.stroke();
      break;
    case 'heart': {
      const s = 5.5 + Math.sin(t * 10) * 0.8;
      heartPath(ctx, x, y + 1, s); ctx.fillStyle = '#ff4d6d'; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#a3243f'; ctx.stroke();
      break;
    }
    case 'cry': // > <
    case 'strain':
      ctx.beginPath();
      ctx.moveTo(x - side * 4, y - 3.5); ctx.lineTo(x + side * 3, y); ctx.lineTo(x - side * 4, y + 3.5);
      ctx.stroke();
      break;
    case 'spiral': {
      ctx.lineWidth = 1.5; ctx.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.3) {
        const r = a * 0.35; const aa = a + t * 8 * side;
        const px = x + Math.cos(aa) * r, py = y + Math.sin(aa) * r;
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      break;
    }
    case 'wink':
      ell(ctx, x, y, 3.3, 3.9); ctx.fill();
      break;
    case 'star': {
      ctx.fillStyle = '#ffd23f'; starPath(ctx, x, y, 5.5, 2.4, 5, t * 2); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = '#b8860b'; ctx.stroke();
      break;
    }
  }
}

function drawMouth(ctx: CanvasRenderingContext2D, type: MouthType, y: number, O: string, t: number) {
  ctx.strokeStyle = O; ctx.fillStyle = O; ctx.lineWidth = 2;
  switch (type) {
    case 'smile':
      ctx.beginPath(); ctx.arc(0, y - 2, 3.5, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); break;
    case 'w': case 'cat':
      ctx.beginPath();
      ctx.arc(-2.6, y, 2.6, Math.PI * 0.05, Math.PI * 0.95);
      ctx.moveTo(5.2, y); ctx.arc(2.6, y, 2.6, Math.PI * 0.05, Math.PI * 0.95);
      ctx.stroke(); break;
    case 'open': { // guriță mică, deschisă, cu limbuța roz (ca la stickere)
      ctx.beginPath(); ctx.moveTo(-4.5, y - 1.5);
      ctx.quadraticCurveTo(-2.2, y + 0.8, 0, y - 1.2); ctx.quadraticCurveTo(2.2, y + 0.8, 4.5, y - 1.5);
      ctx.quadraticCurveTo(4.2, y + 7.5, 0, y + 8); ctx.quadraticCurveTo(-4.2, y + 7.5, -4.5, y - 1.5); ctx.closePath();
      ctx.fillStyle = '#ff8a9a'; ctx.fill(); ctx.lineWidth = 1.9; ctx.stroke();
      ctx.fillStyle = '#ffb3be'; ell(ctx, 0, y + 5, 2.2, 1.6); ctx.fill();
      break;
    }
    case 'grin':
      ctx.beginPath(); ctx.moveTo(-8, y - 2); ctx.quadraticCurveTo(0, y + 11, 8, y - 2); ctx.closePath();
      ctx.fillStyle = '#7a2b34'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff7f96'; ell(ctx, 0, y + 4.5, 3.6, 2); ctx.fill(); break;
    case 'scream': {
      const h = 7 + Math.sin(t * 30) * 1;
      ell(ctx, 0, y + 2, 5, h); ctx.fillStyle = '#7a2b34'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff7f96'; ell(ctx, 0, y + h - 1, 3, 2); ctx.fill(); break;
    }
    case 'o':
      ell(ctx, 0, y + 1, 2.6, 3); ctx.fillStyle = '#7a2b34'; ctx.fill(); ctx.stroke(); break;
    case 'frown':
      ctx.beginPath(); ctx.arc(0, y + 3, 3.5, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); break;
    case 'wavy':
      ctx.beginPath(); ctx.moveTo(-6, y);
      for (let i = 1; i <= 6; i++) ctx.lineTo(-6 + i * 2, y + (i % 2 ? -1.8 : 1.8));
      ctx.stroke(); break;
    case 'flat':
      ctx.beginPath(); ctx.moveTo(-3.5, y); ctx.lineTo(3.5, y); ctx.stroke(); break;
    case 'smirk':
      ctx.beginPath(); ctx.moveTo(-3.5, y); ctx.quadraticCurveTo(2, y + 2, 5, y - 2); ctx.stroke(); break;
    case 'tongue':
      ctx.beginPath(); ctx.arc(0, y - 2, 4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(-2.6, y + 1, 5.2, 6, 2.6);
      ctx.fillStyle = '#ff7f96'; ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke(); break;
    case 'kiss': // 3
      ctx.beginPath(); ctx.arc(1, y - 1.5, 2, -Math.PI * 0.6, Math.PI * 0.5);
      ctx.arc(1, y + 2.5, 2, -Math.PI * 0.5, Math.PI * 0.6); ctx.stroke(); break;
    case 'drool':
      ctx.beginPath(); ctx.arc(0, y - 2, 3.5, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
      ctx.fillStyle = 'rgba(150,210,255,0.9)';
      ell(ctx, 3, y + 3 + Math.sin(t * 3) * 1.5, 1.6, 3 + Math.sin(t * 3) * 1.5); ctx.fill(); break;
    case 'none': break;
  }
}

function drawTears(ctx: CanvasRenderingContext2D, ex: number, ey: number, amt: number, t: number) {
  ctx.fillStyle = 'rgba(110,190,255,0.85)';
  for (const s of [-1, 1]) {
    const x = s * ex;
    // siroaie
    const len = 6 + amt * 22;
    ctx.beginPath(); ctx.roundRect(x - 2.2, ey + 3, 4.4, len, 2.2); ctx.fill();
    // picaturi care cad
    for (let i = 0; i < 2; i++) {
      const ph = (t * 1.6 + i * 0.5 + (s > 0 ? 0.25 : 0)) % 1;
      ell(ctx, x + s * ph * 6, ey + 3 + len + ph * 18, 2, 2.6); ctx.fill();
    }
  }
}

function drawVein(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, t: number) {
  const s = (0.8 + 0.25 * Math.abs(Math.sin(t * 8))) * a;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#e8283d'; ctx.lineWidth = 2.6;
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(2, -6); ctx.quadraticCurveTo(2, -2, 6, -2); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawSweat(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, t: number) {
  const dy = (t * 12) % 8;
  ctx.save(); ctx.translate(x, y + dy * a); ctx.scale(a, a);
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.quadraticCurveTo(5, 1, 0, 3); ctx.quadraticCurveTo(-5, 1, 0, -7);
  ctx.fillStyle = '#8fd3ff'; ctx.fill(); ctx.strokeStyle = '#3a8cc0'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}

function drawDizzy(ctx: CanvasRenderingContext2D, a: number, t: number) {
  for (let i = 0; i < 3; i++) {
    const ang = t * 4 + i * (Math.PI * 2 / 3);
    const x = Math.cos(ang) * 26, y = -30 + Math.sin(ang) * 7;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#ffd23f'; starPath(ctx, x, y, 6, 2.6, 5, ang); ctx.fill();
    ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
}

function drawBow(ctx: CanvasRenderingContext2D, x: number, y: number, O: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.3);
  ctx.fillStyle = '#ff7aa2'; ctx.strokeStyle = O; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -6); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, -6); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ell(ctx, 0, 0, 3, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, R: number, r: number, n: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r : R; const a = rot + i * Math.PI / n - Math.PI / 2;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

/** Recuzita tinuta in mana; originea = palma, axa +y = in continuarea bratului. */
export function drawProp(ctx: CanvasRenderingContext2D, prop: PropType, O: string, t: number) {
  ctx.lineWidth = 2; ctx.strokeStyle = O;
  switch (prop) {
    case 'pan': // tigaia lui Bubu
      ctx.fillStyle = '#6b4a2f'; ctx.beginPath(); ctx.roundRect(-3, -2, 6, 20, 3); ctx.fill(); ctx.stroke();
      ell(ctx, 0, 34, 17, 15); ctx.fillStyle = '#3d3d45'; ctx.fill(); ctx.stroke();
      ell(ctx, 0, 34, 12, 10.5); ctx.fillStyle = '#56565f'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ell(ctx, -5, 29, 4, 2.5); ctx.fill();
      break;
    case 'boba':
      ctx.save(); ctx.rotate(Math.PI);
      ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(9, -4); ctx.lineTo(7, 22); ctx.lineTo(-7, 22); ctx.closePath();
      ctx.fillStyle = '#f3d9b5'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a2418';
      for (let i = 0; i < 6; i++) { ell(ctx, -4 + (i % 3) * 4, 15 + Math.floor(i / 3) * 4, 1.8, 1.8); ctx.fill(); }
      ctx.fillStyle = '#ffffffaa'; ctx.fillRect(-10, -6, 20, 3);
      ctx.strokeStyle = '#ff6f91'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2, -4); ctx.lineTo(5, -16); ctx.stroke();
      ctx.restore();
      break;
    case 'heart':
      heartPath(ctx, 0, 6, 11 + Math.sin(t * 8)); ctx.fillStyle = '#ff4d6d'; ctx.fill(); ctx.stroke();
      break;
    case 'flower':
      ctx.strokeStyle = '#3d8b3d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
      ctx.strokeStyle = O; ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5; ell(ctx, Math.cos(a) * 6, -28 + Math.sin(a) * 6, 5, 5);
        ctx.fillStyle = '#ff8fb1'; ctx.fill(); ctx.stroke();
      }
      ell(ctx, 0, -28, 3.5, 3.5); ctx.fillStyle = '#ffd23f'; ctx.fill();
      break;
    case 'plunger':
      ctx.fillStyle = '#c99a5b'; ctx.beginPath(); ctx.roundRect(-2.5, -18, 5, 40, 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, 34); ctx.quadraticCurveTo(0, 14, 12, 34); ctx.closePath();
      ctx.fillStyle = '#e33b3b'; ctx.fill(); ctx.stroke();
      break;
    case 'thermometer':
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-2.5, -4, 5, 24, 2.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8283d'; ctx.fillRect(-1, 4, 2, 14); ell(ctx, 0, 20, 3.5, 3.5); ctx.fill();
      break;
    case 'spoon':
      ctx.fillStyle = '#d7dbe0'; ctx.beginPath(); ctx.roundRect(-1.8, 0, 3.6, 18, 2); ctx.fill(); ctx.stroke();
      ell(ctx, 0, 22, 5, 6); ctx.fill(); ctx.stroke();
      break;
    case 'mic':
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.roundRect(-3, -2, 6, 16, 2); ctx.fill(); ctx.stroke();
      ell(ctx, 0, -6, 6, 6); ctx.fillStyle = '#999'; ctx.fill(); ctx.stroke();
      break;
    case 'tissue':
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(0, -6, 8, 0);
      ctx.lineTo(6, 14); ctx.quadraticCurveTo(0, 10, -6, 14); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
      break;
    case 'pillow':
      ctx.fillStyle = '#ffe1ea'; ctx.beginPath(); ctx.roundRect(-16, 0, 32, 22, 9); ctx.fill(); ctx.stroke();
      heartPath(ctx, 0, 12, 5); ctx.fillStyle = '#ff7aa2'; ctx.fill();
      break;
    case 'cup':
      // ceasca de cafea alba cu inimioara, toarta si cafea la gura
      ctx.save(); ctx.rotate(Math.PI);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(-8, -2, 16, 16, 4); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(10, 6, 4.5, -1.3, 1.3); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#7a4a26'; ell(ctx, 0, -1.5, 7, 2.2); ctx.fill();
      heartPath(ctx, 0, 8, 3.2); ctx.fillStyle = '#ff7aa2'; ctx.fill();
      ctx.restore();
      break;
    case 'pad':
      // maneta de consola: corp gri, butoane colorate
      ctx.fillStyle = '#5a6a8a'; ctx.beginPath(); ctx.roundRect(-14, -6, 28, 12, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff5d8f'; ctx.beginPath(); ctx.arc(6, -1, 2, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(9.5, 2, 2, 0, 7); ctx.fill();
      ctx.fillStyle = '#2b2b33'; ctx.fillRect(-9, -1, 6, 2); ctx.fillRect(-7, -3, 2, 6);
      break;
    case 'none': break;
  }
}

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}
