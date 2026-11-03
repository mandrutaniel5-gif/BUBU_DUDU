import type { Pose, EyeType, MouthType, PropType } from './pose';

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
}

export const SPECS: Record<CharId, CharSpec> = {
  // Bubu = panda (fata): alba ca un mochi, urechi negre, obrajori roz, gene mici
  bubu: {
    id: 'bubu', name: 'Bubu', body: '#ffffff', shade: '#e9e1dc', ear: '#2a2222',
    earInner: null, cheek: '#ffa3b8', outline: '#2b1d17', tail: '#2a2222', accessory: 'none',
  },
  // Dudu = ursul brun (baiatul): maro cald, botic mai deschis, smoc de par
  dudu: {
    id: 'dudu', name: 'Dudu', body: '#bb875a', shade: '#9c6b43', ear: '#bb875a',
    earInner: '#8f5f3b', cheek: '#ff9a9a', outline: '#2b1d17', tail: '#9c6b43', accessory: 'none',
  },
};

const LW = 2.4; // grosimea conturului

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
  x: number, y: number, scale: number, flip: 1 | -1, time: number,
) {
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

  // --- piciorușe scurte (in mare parte ascunse sub burtica) ---
  for (const side of [-1, 1] as const) {
    const lift2 = side < 0 ? p.legL : p.legR;
    const ox = side < 0 ? p.legLx : p.legRx;
    ctx.beginPath();
    ctx.roundRect(side * 10 - 7.5 + ox, -11 - lift2, 15, 12, 6);
    fillStroke(ctx, bodyFill, O);
    if (!p.back) { // pernite
      ctx.fillStyle = spec.id === 'dudu' ? '#ecc39a' : '#ffd3dd';
      ell(ctx, side * 10 + ox, -4 - lift2, 3.8, 2.4); ctx.fill();
      for (const k of [-3, 0, 3]) { ell(ctx, side * 10 + ox + k, -8 - lift2, 1.2, 1.1); ctx.fill(); }
    }
  }

  // --- corp: mic si rotofei ca o para ---
  ctx.save();
  ctx.translate(p.hip, 0);
  ctx.beginPath();
  ctx.moveTo(-16, -36);
  ctx.bezierCurveTo(-27, -30, -28, -4, -15, -3);
  ctx.lineTo(15, -3);
  ctx.bezierCurveTo(28, -4, 27, -30, 16, -36);
  ctx.closePath();
  fillStroke(ctx, bodyFill, O);
  ctx.save(); ctx.clip();
  ctx.fillStyle = spec.shade; ctx.globalAlpha = 0.4;
  ell(ctx, 5, -4, 24, 8); ctx.fill();
  ctx.restore();
  if (p.back) { // codita
    ell(ctx, 0, -12, 6, 5.5); fillStroke(ctx, spec.tail, O, 2);
  } else if (spec.id === 'dudu') { // burtica mai deschisa
    ctx.fillStyle = '#dcae80'; ctx.globalAlpha = 0.6;
    ell(ctx, 0, -16, 11, 9); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.restore();

  // --- manute scurte ---
  const arm = (side: -1 | 1, ang: number, prop: PropType, propRot: number) => {
    ctx.save();
    ctx.translate(side * 19 + p.hip * 0.5, -27);
    ctx.rotate(side < 0 ? ang : -ang);
    capsule(ctx, 11, 9);
    fillStroke(ctx, bodyFill, O);
    if (prop !== 'none') {
      ctx.translate(0, 11);
      ctx.rotate(propRot * (side < 0 ? 1 : -1));
      drawProp(ctx, prop, O, time);
    }
    ctx.restore();
  };
  arm(-1, p.armL, p.propL, p.propRotL);
  arm(1, p.armR, p.propR, p.propRotR);

  drawHead(ctx, spec, p, time, -52);
  ctx.restore();
}

const HW = 35, HH = 28; // marimea capului (mare, ca la stickere)

function drawHead(ctx: CanvasRenderingContext2D, spec: CharSpec, p: Pose, time: number, baseY: number) {
  const O = spec.outline;
  const bodyFill = p.sickTint > 0 ? mix(spec.body, '#bfe3a6', p.sickTint * 0.45) : spec.body;
  ctx.save();
  ctx.translate(p.headDx, baseY + p.headDy);
  ctx.rotate(p.headRot);
  const ew = p.earWiggle;
  // urechi mici, rotunde, pe "colturile" capului
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 24, -20);
    ctx.rotate(side * (0.25 + ew * 0.3));
    ell(ctx, 0, 0, 9.5, 9); fillStroke(ctx, spec.ear, O);
    if (spec.earInner) { ctx.fillStyle = spec.earInner; ell(ctx, 0, 1.5, 5, 4.4); ctx.fill(); }
    else { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ell(ctx, -2, -2.5, 3.5, 2.5); ctx.fill(); }
    ctx.restore();
  }
  mochiPath(ctx, HW, HH);
  fillStroke(ctx, bodyFill, O);
  // umbra fina jos + luciu sus
  ctx.save(); mochiPath(ctx, HW, HH); ctx.clip();
  ctx.fillStyle = spec.shade; ctx.globalAlpha = spec.id === 'bubu' ? 0.45 : 0.35;
  ell(ctx, 4, HH + 6, HW * 1.05, 11); ctx.fill();
  ctx.globalAlpha = spec.id === 'bubu' ? 0 : 0.22; ctx.fillStyle = '#f3cfa6';
  ell(ctx, -14, -11, 7, 4); ctx.fill();
  ctx.restore();
  // smocul de par al lui Dudu
  if (spec.id === 'dudu') {
    ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.fillStyle = bodyFill;
    ctx.beginPath(); ctx.moveTo(-2, -20.5); ctx.quadraticCurveTo(-3, -29, 3, -29); ctx.quadraticCurveTo(-0.5, -26, 1.5, -21); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1.5, -21); ctx.quadraticCurveTo(6, -26, 9, -23.5); ctx.stroke();
  }
  if (spec.accessory === 'bow') drawBow(ctx, 17, -23, O);

  if (!p.back) drawFace(ctx, spec, p, time);
  else { // ceafa
    ctx.strokeStyle = O; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-5, 22); ctx.quadraticCurveTo(0, 18, 5, 22); ctx.stroke();
  }
  if (p.vein > 0) drawVein(ctx, 23, -14, p.vein, time);
  if (p.sweat > 0) drawSweat(ctx, -31, -8, p.sweat, time);
  if (p.dizzy > 0) drawDizzy(ctx, p.dizzy, time);
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, spec: CharSpec, p: Pose, t: number) {
  const O = '#1f1512';
  const ex = 13, ey = 3 + p.pupilDy;
  // obrajori roz, cu un mic luciu
  if (p.blush > 0) {
    const a = Math.min(1, p.blush);
    ctx.fillStyle = spec.cheek; ctx.globalAlpha = a * 0.85;
    ell(ctx, -22, 11, 6.8, 4); ctx.fill();
    ell(ctx, 22, 11, 6.8, 4); ctx.fill();
    ctx.globalAlpha = a * 0.8; ctx.fillStyle = '#fff';
    ell(ctx, -24, 9.6, 1.4, 1); ctx.fill(); ell(ctx, 20, 9.6, 1.4, 1); ctx.fill();
    if (p.blush > 1) { // linii de rusine
      ctx.strokeStyle = '#e0607e'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.9;
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(s * 19 + i * 3 - 3, 8.5); ctx.lineTo(s * 19 + i * 3 - 5, 12.5); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  // botic deschis + nasuc (Dudu)
  if (spec.id === 'dudu') {
    ctx.fillStyle = '#d6a77a'; ctx.globalAlpha = 0.75; ell(ctx, 0, 10.5, 9, 6.2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = O; ell(ctx, 0, 7.4, 2.8, 1.9); ctx.fill();
    ctx.fillStyle = '#ffffff88'; ell(ctx, -0.8, 6.9, 0.9, 0.5); ctx.fill();
  }
  drawEye(ctx, -ex + p.pupilDx, ey, -1, p.eyes, O, t);
  drawEye(ctx, ex + p.pupilDx, ey, 1, p.eyesR ?? p.eyes, O, t);
  // genele mici ale lui Bubu
  if (spec.id === 'bubu') {
    ctx.strokeStyle = O; ctx.lineWidth = 1.4;
    for (const s of [-1, 1]) {
      const et = s < 0 ? p.eyes : (p.eyesR ?? p.eyes);
      if (et === 'dot' || et === 'happy' || et === 'closed' || et === 'wink' || et === 'sad' || et === 'half') {
        const x0 = s * ex + p.pupilDx + s * 3, y0 = ey - (et === 'dot' || et === 'sad' ? 3 : 1);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + s * 3, y0 - 2.5);
        ctx.moveTo(x0 + s * 0.8, y0 + 2); ctx.lineTo(x0 + s * 4, y0 + 0.5); ctx.stroke();
      }
    }
  }

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
  drawMouth(ctx, p.mouth, spec.id === 'dudu' ? 12 : 9.5, O, t);

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
      ell(ctx, x, y, 3.3, 3.9); ctx.fill();
      ctx.fillStyle = '#fff'; ell(ctx, x - 1, y - 1.4, 1.1, 1.1); ctx.fill();
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
    case 'open':
      ctx.beginPath(); ctx.moveTo(-5, y - 1); ctx.quadraticCurveTo(0, y + 9, 5, y - 1); ctx.closePath();
      ctx.fillStyle = '#7a2b34'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff7f96'; ell(ctx, 0, y + 3.2, 2.6, 1.4); ctx.fill(); break;
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
    case 'none': break;
  }
}

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}
