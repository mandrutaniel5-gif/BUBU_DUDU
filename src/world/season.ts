// Anotimpurile peste lume (pe ecran, ieftin pentru baterie): zapada care cade iarna si ninsoarea de pe jos,
// frunzele care zboara toamna, petalele primavara, lumina calda vara; artificiile de Revelion.
// Plus desenele noi de la ferma: cotetul cu gaini, grajdul, stupii, acoperisul stricat, standul de la targ, parcelele.
import { iso, isoBox, boxOf, shade, tilePath } from './iso';
import type { Furn } from './map';
import { fillTextIcons } from '../ui/icons';

const O = '#3a2a22';
const rnd = (i: number) => { const v = Math.sin(i * 91.7 + 7.3) * 43758.5; return v - Math.floor(v); };
function e(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, st = true, lw = 1.5) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } }

/** fulgerul furtunii la momentul t: cat de tare lumineaza (0-1) si al catelea fulger e (pentru tunet, in soundscape) */
export function lightning(t: number, lv: number): { a: number; n: number; since: number } {
  const P = 7, n = Math.floor(t / P), since = t - n * P - rnd(n + 0.37) * 3;
  if (lv <= 0 || rnd(n * 1.7 + 0.11) > 0.25 + lv * 0.55) return { a: 0, n: -1, since: 0 };
  const a = since > 0 && since < 0.09 ? 1 : since > 0.2 && since < 0.3 ? 0.65 : since > 0.3 && since < 0.7 ? 0.25 * (0.7 - since) / 0.4 : 0;
  return { a: a * Math.min(1, lv + 0.2), n, since };
}
/** furtuna: cer intunecat, ploaie in rafale piezise, fulgere (cu traznetul desenat) */
function drawStorm(c: CanvasRenderingContext2D, W: number, H: number, t: number, lv: number) {
  c.fillStyle = `rgba(28,36,64,${0.34 * lv})`; c.fillRect(0, 0, W, H);
  const gust = 0.75 + 0.25 * Math.sin(t * 0.7) + 0.15 * Math.sin(t * 2.3), dx = 7 * gust, dy = 20;
  c.strokeStyle = `rgba(205,222,255,${0.38 + 0.25 * lv})`; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath();
  const n = Math.round(70 + 150 * lv);
  for (let i = 0; i < n; i++) {
    const sp = 520 + rnd(i + 40) * 260, y = (rnd(i + 900) * (H + 60) + t * sp) % (H + 60) - 30, x = ((rnd(i) * (W + 120) + t * sp * dx / dy) % (W + 120)) - 60;
    const len = 0.55 + rnd(i + 7) * 0.5; c.moveTo(x, y); c.lineTo(x + dx * len, y + dy * len);
  }
  c.stroke();
  // stropi pe jos
  c.strokeStyle = `rgba(225,236,255,${0.45 * lv})`; c.lineWidth = 1;
  for (let i = 0; i < 26 * lv; i++) { const ph = (t * 2.2 + rnd(i + 77)) % 1, x = rnd(i * 3 + Math.floor(t * 2.2 + rnd(i + 77))) * W, y = H * 0.25 + rnd(i * 5 + Math.floor(t * 2.2 + rnd(i + 77))) * H * 0.75, r = 2 + ph * 7; c.globalAlpha = 1 - ph; c.beginPath(); c.ellipse(x, y, r, r * 0.4, 0, 0, 7); c.stroke(); }
  c.globalAlpha = 1;
  const L = lightning(t, lv);
  if (L.a > 0) {
    c.fillStyle = `rgba(235,240,255,${0.55 * L.a})`; c.fillRect(0, 0, W, H);
    if (L.since < 0.3) { // traznetul: o linie franta din cer
      let x = W * (0.15 + rnd(L.n + 0.9) * 0.7), y = -5; c.strokeStyle = `rgba(255,255,240,${L.a})`; c.lineWidth = 3; c.shadowColor = '#bcd4ff'; c.shadowBlur = 14; c.beginPath(); c.moveTo(x, y);
      for (let k = 0; k < 7; k++) { x += (rnd(L.n * 13 + k) - 0.5) * 60; y += H * 0.07 + rnd(L.n + k * 7) * H * 0.04; c.lineTo(x, y); }
      c.stroke(); c.shadowBlur = 0;
    }
  }
}

export function drawSeason(c: CanvasRenderingContext2D, W: number, H: number, t: number, season: string, minutes: number, newYear: boolean, storm = 0) {
  c.save();
  if (season === 'winter') {
    // un val alb-albastrui (zapada pe jos) + fulgi care cad lin
    c.fillStyle = 'rgba(235,245,255,0.18)'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { const x = (rnd(i) * W + Math.sin(t * 0.6 + i) * 20 + t * 8) % W, y = (rnd(i + 500) * H + t * (24 + rnd(i + 9) * 30)) % H, r = 1.2 + rnd(i + 3) * 2.4; c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  } else if (season === 'autumn') {
    c.fillStyle = 'rgba(255,170,80,0.08)'; c.fillRect(0, 0, W, H);
    const tw = t * (1 + storm * 2.5); // in furtuna frunzele zboara de 3 ori mai repede
    for (let i = 0; i < 26 + storm * 20; i++) { const x = (rnd(i) * W + tw * (20 + rnd(i + 4) * 30)) % W, y = (rnd(i + 200) * H + tw * (16 + rnd(i + 2) * 18)) % H, a = tw * 2 + i; c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = ['#e07a2f', '#c9502a', '#e8b23a'][i % 3]; c.beginPath(); c.ellipse(0, 0, 5, 2.6, 0, 0, 7); c.fill(); c.restore(); }
  } else if (season === 'spring') {
    for (let i = 0; i < 20; i++) { const x = (rnd(i) * W + t * 14 + Math.sin(t + i) * 12) % W, y = (rnd(i + 300) * H + t * 12) % H; c.fillStyle = i % 2 ? 'rgba(255,182,201,0.85)' : 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(x, y, 3, 2, t + i, 0, 7); c.fill(); }
  } else {
    const g = c.createRadialGradient(W * 0.85, -40, 10, W * 0.85, -40, H); g.addColorStop(0, 'rgba(255,240,180,0.18)'); g.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // artificiile de Revelion (seara)
  if (newYear && (minutes > 20 * 60 || minutes < 2 * 60)) {
    for (let k = 0; k < 4; k++) { const ph = (t * 0.5 + k * 0.27) % 1, cx = W * (0.2 + 0.2 * k), cy = H * (0.18 + 0.08 * (k % 2)), r = ph * 70; const col = ['#ff4d6d', '#ffd23f', '#4cc9f0', '#7cc576'][k];
      if (ph < 0.15) { c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, H - ph / 0.15 * (H - cy), 2.5, 0, 7); c.fill(); continue; }
      c.globalAlpha = 1 - ph; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; c.fillStyle = col; c.beginPath(); c.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r + ph * 20, 2.2, 0, 7); c.fill(); } c.globalAlpha = 1; }
  }
  if (storm > 0) drawStorm(c, W, H, t, storm);
  c.restore();
}

/** desenele noi (ferma, furtuna, targul); intoarce true daca a desenat */
export function drawStoryType(c: CanvasRenderingContext2D, f: Furn, t: number): boolean {
  const { gx, gy, w, d } = f;
  switch (f.type as string) {
    case 'coop': {
      isoBox(c, gx, gy, w, d, 30, { top: '#e8c08f', left: '#d9574a', right: '#b8443a' });
      const r0 = iso(gx, gy + d / 2, 52), r1 = iso(gx + w, gy + d / 2, 52);
      const q = (p: { x: number; y: number }[], col: string) => { c.beginPath(); p.forEach((v, i) => i ? c.lineTo(v.x, v.y) : c.moveTo(v.x, v.y)); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = O; c.lineWidth = 1.8; c.stroke(); };
      q([iso(gx, gy, 30), iso(gx + w, gy, 30), r1, r0], '#8a5d32'); q([iso(gx + w, gy, 30), iso(gx + w, gy + d, 30), r1], '#c4935f'); q([iso(gx - 0.1, gy + d + 0.1, 28), iso(gx + w + 0.1, gy + d + 0.1, 28), r1, r0], '#a0703f');
      const dp = iso(gx + w / 2, gy + d, 0); c.fillStyle = '#5a3a20'; c.beginPath(); c.roundRect(dp.x - 6, dp.y - 16, 12, 16, [6, 6, 0, 0]); c.fill(); c.stroke();
      c.strokeStyle = '#8a5d32'; c.lineWidth = 3; c.beginPath(); c.moveTo(dp.x + 4, dp.y); c.lineTo(dp.x + 18, dp.y + 9); c.stroke();
      return true;
    }
    case 'hens': {
      for (let i = 0; i < 5; i++) { const k = rnd(i + gx) * 6, x = gx + 0.4 + (i % 3) * 0.9 + Math.sin(t * 0.4 + k) * 0.3, y = gy + 0.4 + Math.floor(i / 3) * 0.9 + Math.cos(t * 0.33 + k) * 0.2, p = iso(x, y), peck = Math.sin(t * 5 + k) > 0.6, fl = Math.cos(t * 0.4 + k) > 0 ? 1 : -1;
        c.save(); c.translate(p.x, p.y); c.scale(fl, 1); e(c, 0, 1, 8, 3, 'rgba(0,0,0,0.12)', false); e(c, 0, -7, 8, 6.5, i % 2 ? '#fff' : '#c9733a'); e(c, 6, peck ? -4 : -12, 4, 4, i % 2 ? '#fff' : '#c9733a'); c.fillStyle = '#e63946'; c.beginPath(); c.arc(6, peck ? -8 : -16, 2, 0, 7); c.fill(); c.fillStyle = '#ffb703'; c.beginPath(); c.moveTo(9, peck ? -4 : -12); c.lineTo(13, peck ? -3 : -11); c.lineTo(9, peck ? -2 : -10); c.fill(); c.restore(); }
      return true;
    }
    case 'cowshed': {
      isoBox(c, gx, gy, w, d, 46, { top: '#f5ead6', left: '#fff8ef', right: '#e9dcc6' });
      const r0 = iso(gx + w / 2, gy, 76), r1 = iso(gx + w / 2, gy + d, 76);
      const q = (p: { x: number; y: number }[], col: string) => { c.beginPath(); p.forEach((v, i) => i ? c.lineTo(v.x, v.y) : c.moveTo(v.x, v.y)); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = O; c.lineWidth = 1.8; c.stroke(); };
      q([iso(gx, gy, 46), iso(gx, gy + d, 46), r1, r0], '#7a3a30'); q([iso(gx, gy + d, 46), iso(gx + w, gy + d, 46), r1], '#fff1d6'); q([iso(gx + w + 0.1, gy - 0.1, 44), iso(gx + w + 0.1, gy + d + 0.1, 44), r1, r0], '#a0473e');
      const P = (u: number, z: number) => iso(gx + u * w, gy + d, z); q([P(0.35, 0), P(0.65, 0), P(0.65, 32), P(0.35, 32)], '#8a5d32');
      const a = P(0.35, 0), b = P(0.65, 32), a2 = P(0.65, 0), b2 = P(0.35, 32); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.moveTo(a2.x, a2.y); c.lineTo(b2.x, b2.y); c.stroke();
      const sp = P(0.5, 40); c.font = '800 9px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.fillStyle = O; fillTextIcons(c, '🧀 Lăptăria', sp.x, sp.y, 9);
      return true;
    }
    case 'beehive': {
      const p = iso(gx + 0.5, gy + 0.5);
      isoBox(c, gx + 0.2, gy + 0.2, 0.6, 0.6, 8, boxOf('#8a5d32'));
      for (let k = 0; k < 3; k++) isoBox(c, gx + 0.22, gy + 0.22, 0.56, 0.56, 9, { top: '#ffe08a', left: '#ffd23f', right: '#e8b23a' }, 8 + k * 9);
      isoBox(c, gx + 0.15, gy + 0.15, 0.7, 0.7, 4, boxOf('#c0573e'), 35);
      for (let i = 0; i < 4; i++) { const a = t * 3 + i * 1.6; const x = p.x + Math.cos(a) * (10 + i * 3), y = p.y - 30 + Math.sin(a * 1.3) * 8; e(c, x, y, 2.4, 1.8, '#ffd23f', true, 0.8); }
      return true;
    }
    case 'roofdamage': {
      const p = iso(gx + 0.5, gy + 0.5, 120 + Math.sin(t * 3) * 3);
      c.fillStyle = '#ffffff'; c.strokeStyle = '#e63946'; c.lineWidth = 3; c.beginPath(); c.roundRect(p.x - 70, p.y - 14, 140, 26, 12); c.fill(); c.stroke();
      c.font = '800 11px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e63946'; fillTextIcons(c, '⛈️ Acoperișul e stricat!', p.x, p.y, 11); c.textBaseline = 'alphabetic';
      return true;
    }
    case 'lotsign': { // tablita „De vanzare” la gardul padurii
      const p = iso(gx + 0.5, gy + 0.5), b = iso(gx + 0.5, gy + 0.5, 46);
      c.strokeStyle = O; c.lineWidth = 6; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(b.x, b.y); c.stroke(); c.strokeStyle = '#a0703f'; c.lineWidth = 3.5; c.stroke();
      c.fillStyle = '#fff8ef'; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.roundRect(b.x - 44, b.y - 30, 88, 30, 6); c.fill(); c.stroke();
      c.font = '800 10px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2f7a45'; fillTextIcons(c, '🌲 De vânzare', b.x, b.y - 20, 10);
      c.fillStyle = '#c0573e'; c.font = '800 9px "Baloo 2", sans-serif'; c.fillText(String((f as any).price ?? '') + ' lei', b.x, b.y - 8); c.textBaseline = 'alphabetic';
      return true;
    }
    case 'fairstand': {
      for (let i = 0; i < 2; i++) { isoBox(c, gx + i + 0.05, gy + 0.1, 0.9, 0.8, 22, { top: '#f6e7d3', left: '#d9a273', right: '#c48b5c' }); }
      const a = iso(gx, gy, 52), b = iso(gx + w, gy, 52), cc = iso(gx + w, gy + d + 0.4, 40), dd = iso(gx, gy + d + 0.4, 40);
      for (let i = 0; i < 6; i++) { const u0 = i / 6, u1 = (i + 1) / 6; c.beginPath(); c.moveTo(a.x + (b.x - a.x) * u0, a.y + (b.y - a.y) * u0); c.lineTo(a.x + (b.x - a.x) * u1, a.y + (b.y - a.y) * u1); c.lineTo(dd.x + (cc.x - dd.x) * u1, dd.y + (cc.y - dd.y) * u1); c.lineTo(dd.x + (cc.x - dd.x) * u0, dd.y + (cc.y - dd.y) * u0); c.closePath(); c.fillStyle = i % 2 ? '#fff' : '#ff7aa2'; c.fill(); c.strokeStyle = O; c.lineWidth = 1.2; c.stroke(); }
      const p = iso(gx + w / 2, gy + 0.5, 70 + Math.sin(t * 2) * 3); c.fillStyle = '#fff8ef'; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.roundRect(p.x - 56, p.y - 12, 112, 22, 8); c.fill(); c.stroke();
      c.font = '800 10px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ff4d8d'; fillTextIcons(c, '🎪 Târgul orașului', p.x, p.y - 1, 10); c.textBaseline = 'alphabetic';
      return true;
    }
  }
  return false;
}

/** parcela voastra, dupa stadiu: pamant tare cu buruieni, arat, semanat (rasare), copt */
export function drawParcel(c: CanvasRenderingContext2D, f: Furn, p: { stage: string; crop?: string; prog: number; wet: number }, t: number, plant: (kind: string, x: number, y: number, s: number) => void) {
  const { gx, gy, w, d } = f;
  tilePath(c, gx, gy, w, d); c.fillStyle = p.stage === 'wild' ? '#a6c98a' : p.wet > 0 && p.stage === 'sown' ? '#7a5232' : '#a87a50'; c.fill(); c.strokeStyle = shade('#a87a50', 0.7); c.lineWidth = 2; c.stroke();
  if (p.stage === 'wild') { for (let i = 0; i < w * d / 2; i++) { const q = iso(gx + 0.3 + rnd(i + gx) * (w - 0.6), gy + 0.3 + rnd(i + gy * 3) * (d - 0.6)); c.strokeStyle = '#5e9a54'; c.lineWidth = 1.6; for (const k of [-3, 0, 3]) { c.beginPath(); c.moveTo(q.x + k, q.y); c.lineTo(q.x + k * 1.6, q.y - 7); c.stroke(); } } return; }
  // brazdele
  for (let j = 0; j < d; j++) { const a = iso(gx + 0.1, gy + j + 0.5), b = iso(gx + w - 0.1, gy + j + 0.5); c.strokeStyle = shade('#a87a50', 0.72); c.lineWidth = 3; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
  if (p.stage === 'plowed' || !p.crop) return;
  const s = p.stage === 'ripe' ? 1 : 0.25 + p.prog * 0.65;
  for (let k = 0; k < w + d; k++) for (let i = 0; i < w; i++) { const j = k - i; if (j < 0 || j >= d) continue; const q = iso(gx + i + 0.5, gy + j + 0.5);
    if (p.stage === 'sown' && p.prog < 0.35) { c.strokeStyle = '#6cbf4c'; c.lineWidth = 2; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x - 3, q.y - 6 * s * 3); c.moveTo(q.x, q.y); c.lineTo(q.x + 3, q.y - 6 * s * 3); c.stroke(); }
    else { c.save(); c.translate(q.x, q.y); c.scale(s, s); plant(p.crop, 0, 0, 1); c.restore(); } }
  void t;
}
