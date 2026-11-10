// Lucrurile sarbatorilor desenate in lume (1.11.0): bradul din piata (gol / impodobit, cu lumini), cadourile de sub
// el, colindatorii cu Steaua, masa de petrecere cu ghirlande si tort, caruta negustorului, arcada de nunta, masa de
// sarbatoare din curte, concursul de pescuit, picnicul, ghioceii, X-ul comorii, targul de Craciun (taraba, patinoar, Mos Craciun).
import type { Furn } from './map';
import { iso, isoBox, boxOf } from './iso';
import { starPath, heartPath, NPC_SPECS } from '../char/draw';
import { Actor } from '../char/actor';
import { Fx } from '../char/fx';
import { fillTextIcons, iconCanvas } from '../ui/icons';

const O = '#3a2a22';
function e(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, st = true, lw = 2) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } }
function ic(c: CanvasRenderingContext2D, em: string, x: number, y: number, s: number) { const cv = iconCanvas(em, 64); if (cv) c.drawImage(cv, x - s / 2, y - s / 2, s, s); }
function label(c: CanvasRenderingContext2D, t: string, x: number, y: number, col = '#ff4d8d') { c.font = '800 10px "Baloo 2", sans-serif'; const w = c.measureText(t).width + 16; c.fillStyle = '#fffaf5'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.roundRect(x - w / 2, y - 9, w, 18, 9); c.fill(); c.stroke(); c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; fillTextIcons(c, t, x, y, 10); c.textBaseline = 'alphabetic'; }
/** personajele mici din lume (colindatori, sateni la masa): actori reali, animati */
const fx = new Fx();
const cast = new Map<string, Actor>();
let lastT = 0;
function npc(key: string, spec: string, outfit: any, anim?: string) {
  let a = cast.get(key); if (!a) { a = new Actor('bubu', fx, NPC_SPECS[spec]); a.outfit = outfit; a.scale = 0.42; if (anim) a.play(anim); cast.set(key, a); }
  return a;
}
function tickCast(t: number) { const dt = Math.min(0.1, Math.max(0, t - lastT)); if (dt > 0) { lastT = t; for (const a of cast.values()) { a.update(dt); if (!a.busy && (a as any).loopAnim) a.play((a as any).loopAnim); } } }

/** bradul (in lume): gol, cu zapada; impodobit: globuri, beteala, beculete care clipesc, steaua care straluceste */
function tree(c: CanvasRenderingContext2D, x: number, y: number, s: number, lit: boolean, t: number) {
  c.save(); c.translate(x, y); c.scale(s, s);
  e(c, 0, 0, 34, 12, 'rgba(0,0,0,0.12)', false);
  c.fillStyle = '#8a5d32'; c.fillRect(-6, -14, 12, 14); c.strokeStyle = O; c.lineWidth = 2; c.strokeRect(-6, -14, 12, 14);
  const tiers = [[-14, 40, 50], [-46, 32, 44], [-74, 24, 38], [-98, 15, 30]];
  tiers.forEach(([by, w, h], i) => { c.beginPath(); c.moveTo(0, by - h); c.lineTo(w, by); c.lineTo(-w, by); c.closePath(); c.fillStyle = ['#2f7d4f', '#358a57', '#3c965f', '#43a267'][i]; c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(0, by - 2, w * 0.8, 3, 0, 0, 7); c.fill(); });
  if (lit) {
    const cols = ['#ff4d6d', '#ffd23f', '#4cc9f0', '#7cc576', '#c77dff'];
    c.strokeStyle = '#ffd23f'; c.lineWidth = 2.5; for (const [by, w] of [[-30, 30], [-60, 22], [-86, 14]]) { c.beginPath(); c.moveTo(-w, by - 6); c.quadraticCurveTo(0, by + 6, w, by - 6); c.stroke(); }
    for (let i = 0; i < 16; i++) { const by = -20 - (i % 4) * 22, w = 36 - (i % 4) * 8, xx = ((i * 37) % 13 - 6) / 6 * w * 0.8; const on = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.7); c.fillStyle = cols[i % 5]; c.globalAlpha = 0.45 + 0.55 * on; c.beginPath(); c.arc(xx, by, 3.2, 0, 7); c.fill(); if (on > 0.7) { c.globalAlpha = 0.25; c.beginPath(); c.arc(xx, by, 8, 0, 7); c.fill(); } c.globalAlpha = 1; }
    const g = c.createRadialGradient(0, -132, 2, 0, -132, 34); g.addColorStop(0, 'rgba(255,230,120,0.75)'); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, -132, 34, 0, 7); c.fill();
    c.save(); c.translate(0, -132); c.rotate(Math.sin(t * 2) * 0.1); starPath(c, 0, 0, 11, 5, 5, -Math.PI / 2); c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = O; c.lineWidth = 1.5; c.stroke(); c.restore();
  } else { c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(((i * 23) % 40) - 20, -20 - (i % 3) * 30, 6, 2.5, 0, 0, 7); c.fill(); } }
  c.restore();
}
function giftBox(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.roundRect(x - w / 2, y - h, w, h, 2); c.fill(); c.stroke();
  c.fillStyle = '#fff'; c.fillRect(x - 2, y - h, 4, h); c.fillRect(x - w / 2, y - h * 0.55, w, 3);
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * 4, y - h - 3, 4, 2.5, s * 0.4, 0, 7); c.fillStyle = '#fff'; c.fill(); c.stroke(); }
}

// ====================================================================== Mos Craciun (desenat)
export function drawSanta(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, wave = 0, laugh = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const bob = Math.sin(t * 3) * 2 + (laugh ? Math.abs(Math.sin(t * 14)) * 4 : 0);
  e(c, 0, 0, 46, 10, 'rgba(0,0,0,0.15)', false);
  rr(c, -40, -96 + bob, 80, 92, 34, '#e63946'); c.fillStyle = '#fff'; c.fillRect(-6, -90 + bob, 12, 84); rr(c, -42, -30 + bob, 84, 12, 6, '#2b2b33'); rr(c, -8, -32 + bob, 16, 16, 3, '#ffd23f');
  // brate (unul face cu mana)
  c.save(); c.translate(36, -80 + bob); c.rotate(-1.2 - wave * Math.abs(Math.sin(t * 6)) * 0.6); rr(c, -8, -4, 16, 40, 8, '#e63946'); e(c, 0, 40, 9, 9, '#fff'); c.restore();
  c.save(); c.translate(-36, -80 + bob); c.rotate(0.5); rr(c, -8, -4, 16, 40, 8, '#e63946'); e(c, 0, 40, 9, 9, '#fff'); c.restore();
  // cap
  e(c, 0, -122 + bob, 30, 28, '#ffd9c2'); e(c, -10, -126 + bob, 3, laugh ? 1 : 3.5, O, false); e(c, 10, -126 + bob, 3, laugh ? 1 : 3.5, O, false); e(c, 0, -116 + bob, 7, 6, '#ff9a8a');
  // barba
  c.beginPath(); c.moveTo(-30, -118 + bob); c.quadraticCurveTo(-34, -70 + bob, 0, -62 + bob); c.quadraticCurveTo(34, -70 + bob, 30, -118 + bob); c.quadraticCurveTo(0, -100 + bob, -30, -118 + bob); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke();
  if (laugh) { c.fillStyle = '#8a2a2a'; c.beginPath(); c.ellipse(0, -102 + bob, 9, 7, 0, 0, Math.PI); c.fill(); }
  for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 10, -108 + bob, 12, 5, sx * 0.3, 0, 7); c.fillStyle = '#fff'; c.fill(); c.stroke(); }
  // caciula
  c.beginPath(); c.moveTo(-30, -140 + bob); c.quadraticCurveTo(0, -190 + bob, 40, -150 + bob); c.lineTo(28, -140 + bob); c.closePath(); c.fillStyle = '#e63946'; c.fill(); c.stroke(); e(c, 42, -150 + bob, 9, 9, '#fff'); rr(c, -34, -148 + bob, 68, 14, 7, '#fff', true, 2);
  c.restore();
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, st = true, lw = 2.5) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } }

export function drawHolidayType(c: CanvasRenderingContext2D, f: Furn, t: number): boolean {
  const { gx, gy, w, d } = f, kind = (f as any).kind as string | undefined;
  switch (f.type as string) {
    case 'xmastree': { const p = iso(gx + w / 2, gy + d / 2); tree(c, p.x, p.y, w > 1 ? 1.45 : 0.8, kind === 'lit', t); return true; }
    case 'giftpile': { const cols = ['#ff7aa2', '#4cc9f0', '#ffd23f', '#7cc576', '#c77dff', '#e63946']; for (let i = 0; i < 6; i++) { const p = iso(gx + 0.3 + (i % 3) * 0.75, gy + 0.2 + Math.floor(i / 3) * 0.4); giftBox(c, p.x, p.y - Math.abs(Math.sin(t * 2 + i)) * 1.5, 16 + (i % 2) * 6, 13 + (i % 3) * 4, cols[i]); } label(c, '🎁 Cadouri!', iso(gx + 1.2, gy).x, iso(gx + 1.2, gy).y - 40); return true; }
    case 'carolers': {
      tickCast(t);
      const outfits = [{ head: 'beanie', face: 'none', neck: 'scarf', body: 'pulover' }, { head: 'batic', face: 'none', neck: 'scarf', body: 'ie' }, { head: 'beanie', face: 'none', neck: 'scarf', body: 'vesta' }];
      const specs = ['dog', 'bunny', 'pig', 'fox'];
      specs.forEach((sp, i) => { const a = npc('carol' + i, sp, outfits[i % 3]); (a as any).loopAnim = 'dance_wave'; const p = iso(gx + 0.2 + (i % 2) * 0.6 - i * 0.15, gy + 0.2 + i * 0.35); a.x = p.x; a.y = p.y; a.flip = -1; a.draw(c); });
      const p = iso(gx + 0.4, gy + 0.3); c.strokeStyle = '#8a5d32'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x - 14, p.y - 20); c.lineTo(p.x - 14, p.y - 80); c.stroke();
      c.save(); c.translate(p.x - 14, p.y - 92); c.rotate(t * 1.4); starPath(c, 0, 0, 14, 6, 8); c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = O; c.lineWidth = 1.5; c.stroke(); c.restore();
      for (let k = 0; k < 3; k++) ic(c, k % 2 ? '🎶' : '🎵', p.x + 10 + k * 12, p.y - 70 - ((t * 20 + k * 14) % 30), 12);
      label(c, '⭐ Colindătorii', p.x, p.y - 112); return true;
    }
    case 'partyset': {
      const rev = kind === 'revelion', hidden = kind?.startsWith('hidden'), who = kind?.split('-')[1] === 'bubu' ? 'Bubu' : 'Dudu';
      const a = iso(gx, gy + 0.5), b = iso(gx + w, gy + 0.5);
      for (const p of [a, b]) { c.strokeStyle = '#8a5d32'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 74); c.stroke(); }
      // bannerul (acoperit cu un cearsaf pana la 17:30: e surpriza!)
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 70;
      c.fillStyle = hidden ? '#f3efe9' : rev ? '#2b2b55' : '#ff7aa2'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(a.x, a.y - 72); c.lineTo(b.x, b.y - 72); c.lineTo(b.x, b.y - 54); c.lineTo(a.x, a.y - 54); c.closePath(); c.fill(); c.stroke();
      c.font = '800 10px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = hidden ? '#b9b0a6' : '#fff'; fillTextIcons(c, hidden ? '🤫 (surpriză…)' : rev ? '🎆 La mulți ani! 🎆' : `🎂 La mulți ani, ${who}!`, mx, my + 8, 10); c.textBaseline = 'alphabetic';
      if (!hidden) { const cols = ['#ff7aa2', '#ffd23f', '#4cc9f0', '#7cc576']; for (let i = 0; i < 4; i++) { const p = i < 2 ? a : b, sx = (i % 2 ? 8 : -8); const bob = Math.sin(t * 2 + i) * 3; c.strokeStyle = '#999'; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y - 74); c.lineTo(p.x + sx, p.y - 96 + bob); c.stroke(); e(c, p.x + sx, p.y - 104 + bob, 8, 10, cols[i], true, 1.5); } }
      isoBox(c, gx + 0.6, gy + 0.2, w - 1.2, d - 0.3, 22, { top: rev ? '#fff' : '#fff0f5', left: '#e8d4c0', right: '#d9c2ab' });
      const tp = iso(gx + w / 2, gy + 0.55, 22);
      if (!rev) { e(c, tp.x, tp.y - 6, 16, 6, '#fff'); c.fillStyle = '#ffb3c6'; c.fillRect(tp.x - 14, tp.y - 18, 28, 12); e(c, tp.x, tp.y - 18, 14, 5, '#fff0f5'); for (let i = 0; i < 4; i++) { const xx = tp.x - 8 + i * 5.5; c.fillStyle = '#4cc9f0'; c.fillRect(xx - 1, tp.y - 30, 2, 9); if (!hidden) { c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(xx, tp.y - 33 + Math.sin(t * 9 + i) * 0.8, 1.8, 3, 0, 0, 7); c.fill(); } } }
      else { for (let i = 0; i < 3; i++) { const xx = tp.x - 10 + i * 10; c.fillStyle = '#7cc576'; c.fillRect(xx - 2, tp.y - 24, 4, 16); c.fillStyle = '#ffd23f'; c.fillRect(xx - 2, tp.y - 28, 4, 4); } ic(c, '🥂', tp.x + 20, tp.y - 14, 14); }
      return true;
    }
    case 'caravan': {
      const p = iso(gx + 1, gy + 1); const sway = Math.sin(t * 1.5) * 1.5;
      isoBox(c, gx + 0.2, gy + 0.2, 1.6, 1.5, 30, { top: '#c98e5f', left: '#e8a33a', right: '#c9822a' }, 10);
      c.fillStyle = '#7a3a8a'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); const r0 = iso(gx + 0.1, gy + 0.9, 40), r1 = iso(gx + 1.9, gy + 0.9, 40); c.moveTo(r0.x, r0.y); c.quadraticCurveTo((r0.x + r1.x) / 2, (r0.y + r1.y) / 2 - 50, r1.x, r1.y); c.lineTo(r1.x, r1.y + 8); c.quadraticCurveTo((r0.x + r1.x) / 2, (r0.y + r1.y) / 2 - 40, r0.x, r0.y + 8); c.closePath(); c.fill(); c.stroke();
      for (const [u, v] of [[0.3, 1.8], [1.6, 1.8]]) { const q = iso(gx + u, gy + v, 8); e(c, q.x, q.y, 9, 9, '#8a5d32'); e(c, q.x, q.y, 3, 3, '#ffd23f', false); }
      const fl = iso(gx + 1, gy + 0.9, 60); c.strokeStyle = '#8a5d32'; c.lineWidth = 2; c.beginPath(); c.moveTo(fl.x, fl.y); c.lineTo(fl.x, fl.y - 30); c.stroke(); c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(fl.x, fl.y - 30); c.lineTo(fl.x + 18 + sway, fl.y - 25); c.lineTo(fl.x, fl.y - 20); c.closePath(); c.fill(); c.stroke();
      for (let i = 0; i < 4; i++) ic(c, ['🧪', '🎟️', '🗺️', '🔮'][i], p.x - 22 + i * 15, p.y - 34 + Math.sin(t * 2 + i) * 2, 13);
      label(c, '🧳 Negustorul ambulant', p.x, p.y - 96, '#7a3a8a'); return true;
    }
    case 'wedarch': {
      const alongY = d > w, a = alongY ? iso(gx + w / 2, gy) : iso(gx, gy + 0.2), b = alongY ? iso(gx + w / 2, gy + d) : iso(gx + w, gy + 0.2);
      for (const p of [a, b]) { c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 56); c.stroke(); c.strokeStyle = O; c.lineWidth = 1; c.stroke(); }
      c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.moveTo(a.x, a.y - 56); c.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - 92, b.x, b.y - 56); c.stroke();
      for (let i = 0; i <= 10; i++) { const u = i / 10, x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u - 56 - Math.sin(u * Math.PI) * 30; e(c, x, y, 4.5, 4.5, ['#ff9ab8', '#fff', '#ffd6e0'][i % 3], true, 1); }
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; heartPath(c, m.x, m.y - 94 + Math.sin(t * 3) * 2, 7); c.fillStyle = '#ff4d6d'; c.fill(); c.strokeStyle = O; c.lineWidth = 1.2; c.stroke();
      label(c, '💒 Nunta Inei', m.x, m.y - 116); return true;
    }
    case 'festable': {
      isoBox(c, gx + 0.15, gy + 0.15, 0.7, 0.7, 18, { top: '#fff1d6', left: '#c98e5f', right: '#a0703f' });
      const p = iso(gx + 0.5, gy + 0.5, 18);
      if (kind === 'paste') { e(c, p.x, p.y - 4, 14, 6, '#c98e5f'); for (let i = 0; i < 5; i++) e(c, p.x - 9 + i * 4.5, p.y - 9 - (i % 2) * 3, 3.5, 4.5, ['#e63946', '#e63946', '#4cc9f0', '#ffd23f', '#7cc576'][i], true, 1); ic(c, '🍞', p.x + 14, p.y - 8, 14); label(c, '🥚 Paște fericit!', p.x, p.y - 40); }
      else if (kind === 'martisor') { ic(c, '🎀', p.x, p.y - 10, 18); label(c, '🎀 1 Martie', p.x, p.y - 38); }
      else if (kind === 'drago') { e(c, p.x, p.y - 8, 6, 8, '#cfe9fb'); for (let i = 0; i < 3; i++) { c.strokeStyle = '#4caf50'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x, p.y - 12); c.lineTo(p.x - 4 + i * 4, p.y - 24); c.stroke(); e(c, p.x - 4 + i * 4, p.y - 26, 2.5, 3.5, '#fff', true, 1); } label(c, '💞 Dragobete', p.x, p.y - 44); }
      else if (kind === 'grand') {
        tickCast(t);
        const gm = npc('granma', 'granny', { head: 'batic', face: 'ochelari', neck: 'none', body: 'ie' }); (gm as any).loopAnim = 'wave';
        const gp = npc('granpa', 'pig', { head: 'palarie', face: 'mustata', neck: 'none', body: 'vesta' }); (gp as any).loopAnim = 'laugh';
        const q0 = iso(gx - 0.3, gy + 0.9), q1 = iso(gx + 1.1, gy + 0.6); gm.x = q0.x; gm.y = q0.y; gm.flip = 1; gp.x = q1.x; gp.y = q1.y; gp.flip = -1; gm.draw(c); gp.draw(c);
        ic(c, '🧺', p.x, p.y - 8, 16); label(c, '👵👴 Bunicii', p.x, p.y - 70);
      }
      return true;
    }
    case 'contest': {
      const a = iso(gx, gy + 0.5), b = iso(gx + w, gy + 0.5);
      for (const p of [a, b]) { c.strokeStyle = '#8a5d32'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 58); c.stroke(); }
      c.fillStyle = '#4cc9f0'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(a.x, a.y - 58); c.lineTo(b.x, b.y - 58); c.lineTo(b.x, b.y - 40); c.lineTo(a.x, a.y - 40); c.closePath(); c.fill(); c.stroke();
      c.font = '800 10px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; fillTextIcons(c, '🎣 Concurs 🏆', (a.x + b.x) / 2, (a.y + b.y) / 2 - 49, 10); c.textBaseline = 'alphabetic';
      const m = iso(gx + 1, gy + 0.6); ic(c, '🏆', m.x, m.y - 12 + Math.sin(t * 3) * 2, 18); return true;
    }
    case 'picnic': {
      const pts = [iso(gx, gy), iso(gx + w, gy), iso(gx + w, gy + d), iso(gx, gy + d)];
      c.save(); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.clip();
      c.fillStyle = '#ff7aa2'; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { const q = [iso(gx + i * w / 6, gy + j * d / 4), iso(gx + (i + 1) * w / 6, gy + j * d / 4), iso(gx + (i + 1) * w / 6, gy + (j + 1) * d / 4), iso(gx + i * w / 6, gy + (j + 1) * d / 4)]; c.beginPath(); q.forEach((p, k) => k ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.fill(); }
      c.restore(); c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.stroke();
      const m = iso(gx + w / 2, gy + d / 2); ic(c, '🧺', m.x - 14, m.y - 6, 18); ic(c, '🍉', m.x + 12, m.y - 2, 14); ic(c, '🥪', m.x, m.y + 6, 12); return true;
    }
    case 'snowdrop': { const p = iso(gx + 0.5, gy + 0.5); e(c, p.x, p.y, 16, 7, '#7cc576', false); e(c, p.x - 3, p.y + 1, 9, 4, '#5aa35a', false); c.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3); e(c, p.x, p.y - 10, 18, 18, '#fffbe0', false); c.globalAlpha = 1; for (let i = 0; i < 3; i++) { const x = p.x - 6 + i * 6, sw = Math.sin(t * 2 + i) * 1.5; c.strokeStyle = '#4caf50'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, p.y); c.quadraticCurveTo(x + 2, p.y - 10, x + 4 + sw, p.y - 14); c.stroke(); e(c, x + 4 + sw, p.y - 12, 2.6, 4, '#fff', true, 1); } c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(p.x, p.y - 14, 3 + Math.sin(t * 4) * 1.5, 0, 7); c.fill(); return true; }
    case 'xmark': { const p = iso(gx + 0.5, gy + 0.5); c.strokeStyle = '#e63946'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x - 10, p.y - 5); c.lineTo(p.x + 10, p.y + 5); c.moveTo(p.x + 10, p.y - 5); c.lineTo(p.x - 10, p.y + 5); c.stroke(); ic(c, '🏴‍☠️', p.x, p.y - 22 + Math.sin(t * 3) * 3, 16); return true; }
    case 'xstall': {
      isoBox(c, gx + 0.1, gy + 0.2, w - 0.2, d - 0.2, 26, { top: '#f6e7d3', left: '#a0703f', right: '#8a5d32' });
      const r0 = iso(gx, gy + 0.1, 56), r1 = iso(gx + w, gy + 0.1, 56), r2 = iso(gx + w, gy + d + 0.2, 42), r3 = iso(gx, gy + d + 0.2, 42);
      c.fillStyle = '#e63946'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(r0.x, r0.y); c.lineTo(r1.x, r1.y); c.lineTo(r2.x, r2.y); c.lineTo(r3.x, r3.y); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const u = (i + 0.5) / 6; const p = { x: r3.x + (r2.x - r3.x) * u, y: r3.y + (r2.y - r3.y) * u }; c.beginPath(); c.arc(p.x, p.y + 2, 3, 0, 7); c.fill(); }
      const m = iso(gx + w / 2, gy + d / 2, 26); ic(c, kind === 'turta' ? '🍪' : kind === 'ceai' ? '🍵' : '🍭', m.x, m.y - 6, 18);
      if (kind === 'ceai') for (let i = 0; i < 2; i++) { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(m.x - 3 + i * 6, m.y - 16); c.quadraticCurveTo(m.x + 3 + i * 6 + Math.sin(t * 3 + i) * 3, m.y - 24, m.x - 2 + i * 6, m.y - 32); c.stroke(); }
      for (let i = 0; i < 8; i++) { const u = i / 7, p = { x: r0.x + (r1.x - r0.x) * u, y: r0.y + (r1.y - r0.y) * u }; c.fillStyle = ['#ffd23f', '#4cc9f0', '#7cc576'][i % 3]; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5 + i); c.beginPath(); c.arc(p.x, p.y, 2.5, 0, 7); c.fill(); c.globalAlpha = 1; }
      return true;
    }
    case 'rink': {
      const pts = [iso(gx, gy), iso(gx + w, gy), iso(gx + w, gy + d), iso(gx, gy + d)];
      c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fillStyle = '#d6efff'; c.fill(); c.strokeStyle = '#7ab8ff'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const a = iso(gx + 0.5 + i * 0.8, gy + 0.6), b = iso(gx + 1 + i * 0.7, gy + d - 0.6); c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(a.x + 20, (a.y + b.y) / 2, b.x, b.y); c.stroke(); }
      // doi patinatori mici care se invart
      tickCast(t); const m = iso(gx + w / 2, gy + d / 2);
      for (let i = 0; i < 2; i++) { const a = npc('skater' + i, i ? 'bunny' : 'cat', { head: 'beanie', face: 'none', neck: 'scarf', body: i ? 'rochita' : 'pulover' }); const ang = t * 0.9 + i * Math.PI; a.x = m.x + Math.cos(ang) * 46; a.y = m.y + Math.sin(ang) * 18; a.flip = Math.sin(ang) > 0 ? 1 : -1; a.scale = 0.36; a.draw(c); }
      for (const p of [pts[0], pts[1], pts[3]]) { c.strokeStyle = '#c0573e'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 16); c.stroke(); }
      label(c, '⛸️ Patinoar', m.x, m.y - 50, '#2b6a9a'); return true;
    }
    case 'santa': { const p = iso(gx + w / 2, gy + d / 2); isoBox(c, gx, gy, w, d, 8, { top: '#fff', left: '#d6e0ec', right: '#c0cbd8' }); c.fillStyle = '#c1121f'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x - 34, p.y - 8); c.lineTo(p.x + 30, p.y - 8); c.quadraticCurveTo(p.x + 42, p.y - 8, p.x + 40, p.y - 28); c.lineTo(p.x - 36, p.y - 20); c.closePath(); c.fill(); c.stroke(); drawSanta(c, p.x, p.y - 10, 0.36, t, 1, Math.sin(t * 0.7) > 0.6 ? 1 : 0); label(c, '🎅 Moș Crăciun', p.x, p.y - 90, '#c1121f'); return true; }
    case 'xmasarch': { const a = iso(gx + 0.5, gy), b = iso(gx + 0.5, gy + d); for (const p of [a, b]) { c.strokeStyle = '#c1121f'; c.lineWidth = 5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 70); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.setLineDash([5, 5]); c.stroke(); c.setLineDash([]); }
      c.fillStyle = '#2f7d4f'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(a.x, a.y - 84); c.lineTo(b.x, b.y - 84); c.lineTo(b.x, b.y - 64); c.lineTo(a.x, a.y - 64); c.closePath(); c.fill(); c.stroke();
      c.font = '800 10px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; fillTextIcons(c, '🎄 Târgul de Crăciun', (a.x + b.x) / 2, (a.y + b.y) / 2 - 74, 10); c.textBaseline = 'alphabetic';
      for (let i = 0; i < 8; i++) { const u = i / 7, x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u - 86; c.fillStyle = ['#ffd23f', '#ff4d6d', '#4cc9f0'][i % 3]; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5 + i); c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); c.globalAlpha = 1; }
      return true; }
  }
  return false;
}
void boxOf;
