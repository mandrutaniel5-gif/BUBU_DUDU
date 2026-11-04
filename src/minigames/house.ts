// Minijocurile treburilor din casa (Capitolul 0): frigiderul, cada, televizorul.
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';
import { drawItem } from '../world/items';

const O = '#3a2a22';
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const T = (ctx: CanvasRenderingContext2D, t: string, x: number, y: number, s = 15, c = O) => { ctx.font = `800 ${s}px "Baloo 2", sans-serif`; ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); };

/** desenul unei mancari stricate (verde, cu puf si muste) */
function spoiled(ctx: CanvasRenderingContext2D, x: number, y: number, kind: number, t: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = O; ctx.lineWidth = 2.5;
  if (kind === 0) { ctx.fillStyle = '#9bb36a'; ctx.beginPath(); ctx.roundRect(-16, -12, 32, 24, 6); ctx.fill(); ctx.stroke(); } // cutie
  else if (kind === 1) { ctx.fillStyle = '#b8c97a'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0.3, 0, 7); ctx.fill(); ctx.stroke(); } // branza
  else { ctx.fillStyle = '#e8e2c0'; ctx.beginPath(); ctx.roundRect(-9, -18, 18, 36, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7a9a4a'; ctx.fillRect(-9, -6, 18, 8); } // lapte
  for (let i = 0; i < 6; i++) { ctx.fillStyle = '#6f8f3e'; ctx.beginPath(); ctx.arc(-12 + (i * 7) % 24, -8 + (i * 5) % 16, 3 + (i % 2), 0, 7); ctx.fill(); }
  ctx.strokeStyle = '#8bc34a'; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 7, -16); ctx.bezierCurveTo(i * 7 - 4, -24, i * 7 + 4, -28, i * 7, -36 - Math.sin(t * 3 + i) * 3); ctx.stroke(); }
  for (let i = 0; i < 2; i++) { const a = t * 6 + i * 3; ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(Math.cos(a) * 20, -20 + Math.sin(a * 1.4) * 8, 1.8, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---------------------------------------------------------------- 🧊 Curata frigiderul
export class FridgeCleanGame extends Panel {
  items: { x: number; y: number; bad: boolean; kind: number; code?: string; gone: number }[] = [];
  stains: { x: number; y: number; d: number }[] = [];
  phase: 'sort' | 'wipe' = 'sort'; mistakes = 0; down = false; lx = 0; ly = 0;
  constructor(s: WorldScene, d: (n: number) => void) {
    super(s, d, '🧊 Curăță frigiderul', 'Atinge mâncarea STRICATĂ ca s-o arunci. Nu arunca ce e bun!');
    const good = ['veg:0', 'sweet:2', 'drink:0', 'veg:1', 'sweet:3'];
    const spots: [number, number][] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) spots.push([0.25 + c * 0.17, 0.3 + r * 0.2]);
    spots.sort(() => Math.random() - 0.5);
    spots.slice(0, 11).forEach(([x, y], i) => this.items.push(i < 6 ? { x, y, bad: true, kind: i % 3, gone: 0 } : { x, y, bad: false, kind: 0, code: good[i - 6], gone: 0 }));
    // petele: cate una pe fiecare raft, bine vizibile
    for (let i = 0; i < 5; i++) this.stains.push({ x: [0.3, 0.68, 0.45, 0.32, 0.66][i] + rnd(-0.04, 0.04), y: [0.3, 0.32, 0.5, 0.7, 0.68][i] + rnd(-0.02, 0.02), d: 1 });
  }
  tick(dt: number) {
    for (const it of this.items) if (it.gone > 0) it.gone += dt * 2;
    if (this.phase === 'sort' && this.items.filter(i => i.bad && !i.gone).length === 0) { this.phase = 'wipe'; this.help = 'Acum șterge petele cu buretele (trage cu degetul)'; this.fx.text(this.box.x + this.box.w / 2, this.box.y + 70, 'Gata gunoiul! Acum petele 🧽', '#2ec4b6', 1); }
    if (this.phase === 'wipe' && this.stains.every(s => s.d <= 0)) this.finish(1.5 - this.mistakes * 0.2, 'Frigider strălucitor! ✨🧊');
  }
  pointer(type: string, x: number, y: number) {
    const B = this.box;
    if (this.phase === 'sort') {
      if (type !== 'down') return;
      for (const it of this.items) {
        if (it.gone) continue;
        if (Math.hypot(x - (B.x + it.x * B.w), y - (B.y + it.y * B.h)) < 30) {
          if (it.bad) { it.gone = 0.01; Sfx.play('squelch'); this.fx.text(x, y - 30, ['Bleah!', 'Puah!', 'La gunoi!', 'Iiiu!'][Math.floor(Math.random() * 4)], '#7cb342', 0.9); }
          else { this.mistakes++; Sfx.play('bad'); this.shake = 4; this.fx.text(x, y - 30, 'E bun! Nu-l arunca 😱', '#e63946', 0.9); }
          return;
        }
      }
      return;
    }
    if (type === 'down') { this.down = true; this.lx = x; this.ly = y; }
    if (type === 'move' && !this.down) { this.lx = x; this.ly = y; }
    if (type === 'up') this.down = false;
    if (type === 'move' && this.down) {
      const d = Math.hypot(x - this.lx, y - this.ly); this.lx = x; this.ly = y;
      for (const s of this.stains) if (Math.hypot(x - (B.x + s.x * B.w), y - (B.y + s.y * B.h)) < 55 && s.d > 0) {
        s.d -= Math.min(d, 40) / 260;
        if (Math.random() < 0.35) this.fx.emit('sparkle', x, y, { vy: -25, max: 0.5, size: 0.6 });
        if (s.d <= 0) { Sfx.play('good'); this.fx.text(B.x + s.x * B.w, B.y + s.y * B.h - 20, 'Curat! ✨', '#2ec4b6', 0.8); }
      }
    }
  }
  key(k: string, d: boolean) {
    if (!d || (k !== ' ' && k !== 'e')) return;
    const B = this.box;
    if (this.phase === 'sort') { const it = this.items.find(i => i.bad && !i.gone); if (it) this.pointer('down', B.x + it.x * B.w, B.y + it.y * B.h); }
    else { const s = this.stains.find(s => s.d > 0); if (s) s.d -= 0.25; }
  }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#f2f8ff'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x + w * 0.15, y + h * 0.14, w * 0.7, h * 0.72, 18); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.roundRect(x + w * 0.18, y + h * 0.17, w * 0.64, h * 0.66, 12); ctx.fill();
    for (let r = 1; r < 3; r++) { ctx.strokeStyle = '#b5d6ee'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + w * 0.18, y + h * (0.2 + r * 0.2)); ctx.lineTo(x + w * 0.82, y + h * (0.2 + r * 0.2)); ctx.stroke(); }
    // lumina frigiderului
    const gl = ctx.createRadialGradient(x + w / 2, y + h * 0.2, 5, x + w / 2, y + h * 0.2, w * 0.4); gl.addColorStop(0, 'rgba(255,255,220,0.7)'); gl.addColorStop(1, 'rgba(255,255,220,0)'); ctx.fillStyle = gl; ctx.fillRect(x, y, w, h);
    for (const s of this.stains) if (s.d > 0) { ctx.globalAlpha = s.d; ctx.fillStyle = '#b08a4a'; ctx.beginPath(); ctx.ellipse(x + s.x * w, y + s.y * h, 26, 14, 0.4, 0, 7); ctx.fill(); ctx.fillStyle = '#c9a060'; ctx.beginPath(); ctx.ellipse(x + s.x * w + 8, y + s.y * h - 3, 10, 6, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    for (const it of this.items) {
      const k = Math.min(1, it.gone);
      const px = x + it.x * w + (it.gone ? k * (w * 0.92 - it.x * w) : 0), py = y + it.y * h + (it.gone ? -Math.sin(k * Math.PI) * 120 + k * (h * 0.85 - it.y * h) : 0);
      if (k >= 1) continue;
      ctx.save(); if (it.gone) { ctx.translate(px, py); ctx.rotate(k * 8); ctx.translate(-px, -py); }
      if (this.phase === 'wipe') ctx.globalAlpha = 0.28; // mancarea buna e mutata deoparte cat stergi
      if (it.bad) spoiled(ctx, px, py, it.kind, this.t); else drawItem(ctx, it.code!, px, py, 44, this.t);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // in faza de sters: petele deasupra, cu contur, si buretele sub deget
    if (this.phase === 'wipe') {
      for (const st of this.stains) if (st.d > 0) {
        const sx = x + st.x * w, sy = y + st.y * h;
        ctx.globalAlpha = 0.35 + st.d * 0.65; ctx.fillStyle = '#a8782f'; ctx.strokeStyle = '#7a5520'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(sx, sy, 34, 18, 0.3, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c9a060'; ctx.beginPath(); ctx.ellipse(sx + 10, sy - 4, 12, 7, 0, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#2ec4b6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sx, sy, 40, -Math.PI / 2, -Math.PI / 2 + (1 - st.d) * Math.PI * 2); ctx.stroke();
      }
      const bx = this.lx || x + w / 2, by = this.ly || y + h / 2, wob = this.down ? Math.sin(this.t * 30) * 0.15 : 0;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(-0.3 + wob);
      ctx.fillStyle = '#ffe14f'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-26, -16, 52, 26, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6bb35a'; ctx.beginPath(); ctx.roundRect(-26, 4, 52, 10, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8c030'; for (const [px, py] of [[-12, -6], [4, -9], [14, -2]]) { ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    // cosul de gunoi
    ctx.fillStyle = '#8e9aaf'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w * 0.88, y + h * 0.78); ctx.lineTo(x + w * 0.98, y + h * 0.78); ctx.lineTo(x + w * 0.96, y + h * 0.95); ctx.lineTo(x + w * 0.9, y + h * 0.95); ctx.closePath(); ctx.fill(); ctx.stroke();
    T(ctx, this.phase === 'sort' ? `Stricate rămase: ${this.items.filter(i => i.bad && !i.gone).length}` : `Pete: ${this.stains.filter(s => s.d > 0).length}`, x + w / 2, y + 48, 15);
  }
}

// ---------------------------------------------------------------- 🛁 Spala cada
export class TubScrubGame extends Panel {
  grime: { x: number; y: number; r: number; d: number }[] = []; down = false; lx = 0; ly = 0; foam: { x: number; y: number; r: number; t: number }[] = []; dur = 30;
  constructor(s: WorldScene, d: (n: number) => void) {
    super(s, d, '🛁 Spală cada', 'Freacă petele de murdărie cu peria (trage cu degetul)');
    for (let i = 0; i < 9; i++) this.grime.push({ x: rnd(0.22, 0.78), y: rnd(0.45, 0.72), r: rnd(18, 32), d: 1 });
  }
  tick(dt: number) {
    this.foam.forEach(f => (f.t += dt)); this.foam = this.foam.filter(f => f.t < 3);
    if (this.grime.every(g => g.d <= 0)) this.finish(1 + (this.dur - this.t) / this.dur, 'Cada sclipește! 🛁✨');
    else if (this.t > this.dur) this.finish(this.grime.filter(g => g.d <= 0).length >= 6 ? 0.6 : 0, 'Mai e de frecat… 😅');
  }
  pointer(type: string, x: number, y: number) {
    const B = this.box;
    if (type === 'down') { this.down = true; this.lx = x; this.ly = y; }
    if (type === 'up') this.down = false;
    if (type === 'move' && this.down) {
      const d = Math.hypot(x - this.lx, y - this.ly); this.lx = x; this.ly = y;
      for (const g of this.grime) if (g.d > 0 && Math.hypot(x - (B.x + g.x * B.w), y - (B.y + g.y * B.h)) < g.r + 20) { g.d -= d / 600; if (g.d <= 0) { Sfx.play('bubble'); this.fx.burst('sparkle', x, y, 6, 6.28, 80, { color: '#bde7ff', max: 0.5 }); } }
      if (Math.random() < 0.4) this.foam.push({ x, y, r: rnd(6, 16), t: 0 });
      if (Math.random() < 0.05) Sfx.play(Math.random() < 0.5 ? 'squelch' : 'spray', { vol: 0.4 });
    }
  }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e')) { const g = this.grime.find(g => g.d > 0); if (g) g.d -= 0.2; } }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#d5eef9'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#b5dcef'; ctx.lineWidth = 2; for (let i = 0; i < w; i += 36) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + h * 0.4); ctx.stroke(); }
    // cada mare vazuta de sus-fata
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = O; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(x + w * 0.12, y + h * 0.34, w * 0.76, h * 0.5, 60); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#eef6fb'; ctx.beginPath(); ctx.roundRect(x + w * 0.18, y + h * 0.4, w * 0.64, h * 0.38, 46); ctx.fill(); ctx.strokeStyle = '#c9dbe6'; ctx.lineWidth = 3; ctx.stroke();
    // inelul de murdarie
    const left = this.grime.filter(g => g.d > 0).length / this.grime.length;
    ctx.strokeStyle = `rgba(150,110,60,${0.6 * left})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.roundRect(x + w * 0.2, y + h * 0.43, w * 0.6, h * 0.32, 40); ctx.stroke();
    for (const g of this.grime) if (g.d > 0) { ctx.globalAlpha = g.d * 0.85; ctx.fillStyle = '#a0784a'; ctx.beginPath(); ctx.arc(x + g.x * w, y + g.y * h, g.r, 0, 7); ctx.fill(); ctx.fillStyle = '#7a9a4a'; ctx.beginPath(); ctx.arc(x + g.x * w + 6, y + g.y * h - 4, g.r * 0.4, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    for (const f of this.foam) { ctx.globalAlpha = 1 - f.t / 3; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#cbe7f5'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }
    // robinetul
    ctx.strokeStyle = '#9aa5ad'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + w * 0.5, y + h * 0.28); ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.36, x + w * 0.56, y + h * 0.36); ctx.stroke();
    if (this.down) { ctx.save(); ctx.translate(this.lx, this.ly); ctx.rotate(-0.4); ctx.fillStyle = '#ff9ab8'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-20, -10, 40, 20, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-18, 10, 36, 6); ctx.restore(); }
    T(ctx, `Pete: ${this.grime.filter(g => g.d > 0).length}  ·  ⏱ ${Math.max(0, Math.ceil(this.dur - this.t))} s`, x + w / 2, y + 48, 15);
  }
}

// ---------------------------------------------------------------- 📺 Repara televizorul
export class TvFixGame extends Panel {
  colors = ['#e63946', '#4cc9f0', '#ffd23f'];
  plugs: number[] = [0, 1, 2]; sockets: number[] = [];
  linked: boolean[] = [false, false, false];
  drag: { i: number; x: number; y: number } | null = null;
  phase: 'wires' | 'smack' = 'wires'; signal = 0; smacks = 0;
  constructor(s: WorldScene, d: (n: number) => void) {
    super(s, d, '📺 Repară televizorul', 'Leagă firele la culoarea potrivită (trage din stânga în dreapta)');
    this.sockets = [0, 1, 2].sort(() => Math.random() - 0.5);
  }
  pos(side: 'L' | 'R', i: number) { const B = this.box; return { x: B.x + B.w * (side === 'L' ? 0.14 : 0.86), y: B.y + B.h * (0.62 + i * 0.1) }; }
  tick(dt: number) {
    if (this.phase === 'wires' && this.linked.every(Boolean)) { this.phase = 'smack'; this.help = 'Încă se strică imaginea… dă-i o palmă pe lateral când clipește VERDE! 😤'; }
    if (this.phase === 'smack') { this.signal = Math.max(0, this.signal - dt * 0.15); if (this.signal >= 1) this.finish(1.5, 'Merge televizorul! 📺🎉'); }
  }
  get glow() { return Math.sin(this.t * 3.2) > 0.55; }
  pointer(type: string, x: number, y: number) {
    if (this.phase === 'smack') {
      if (type !== 'down') return;
      this.smacks++; this.shake = 8; Sfx.play('metal_hit', { vol: 0.7 });
      if (this.glow) { this.signal += 0.36; this.fx.text(x, y - 30, 'PAF! 📶', '#2ec4b6', 1.1); }
      else { this.signal = Math.max(0, this.signal - 0.1); this.fx.text(x, y - 30, 'Prea devreme!', '#e63946', 0.9); }
      return;
    }
    if (type === 'down') { for (const i of [0, 1, 2]) { const p = this.pos('L', i); if (!this.linked[i] && Math.hypot(x - p.x, y - p.y) < 30) { this.drag = { i, x, y }; Sfx.play('click'); } } }
    if (type === 'move' && this.drag) { this.drag.x = x; this.drag.y = y; }
    if (type === 'up' && this.drag) {
      const i = this.drag.i; this.drag = null;
      for (const k of [0, 1, 2]) { const p = this.pos('R', k); if (Math.hypot(x - p.x, y - p.y) < 36) { if (this.sockets[k] === i) { this.linked[i] = true; Sfx.play('good'); this.fx.burst('sparkle', p.x, p.y, 8, 6.28, 90, { color: this.colors[i] }); } else { Sfx.play('bad'); this.shake = 4; this.fx.text(p.x, p.y - 30, 'Bzzzt! ⚡', '#ffb703', 1); this.fx.burst('star', p.x, p.y, 5, 6.28, 120, { max: 0.5 }); } } }
    }
  }
  key(k: string, d: boolean) {
    if (!d || (k !== ' ' && k !== 'e')) return;
    if (this.phase === 'smack') { const B = this.box; this.pointer('down', B.x + B.w / 2, B.y + B.h / 2); return; }
    const i = this.linked.findIndex(v => !v); if (i >= 0) { this.linked[i] = true; Sfx.play('good'); }
  }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#fff0c9'; ctx.fillRect(x, y, w, h);
    // televizorul
    const tx = x + w * 0.25, ty = y + h * 0.13, tw = w * 0.5, th = h * 0.36;
    ctx.fillStyle = '#5a4a42'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 14); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.roundRect(tx + 12, ty + 12, tw - 24, th - 24, 8); ctx.clip();
    const ok = this.phase === 'smack' ? this.signal : 0;
    // purici (zgomot)
    for (let i = 0; i < 260 * (1 - ok); i++) { const v = Math.floor(Math.random() * 255); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(tx + 12 + Math.random() * (tw - 24), ty + 12 + Math.random() * (th - 24), 4, 3); }
    if (ok > 0) { ctx.globalAlpha = ok; ctx.fillStyle = '#9ad7ff'; ctx.fillRect(tx, ty, tw, th); ctx.fillStyle = '#a6dc93'; ctx.fillRect(tx, ty + th * 0.6, tw, th); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(tx + tw * 0.75, ty + th * 0.3, 14, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
    if (this.phase === 'smack') { ctx.fillStyle = this.glow ? '#7cc576' : '#e63946'; ctx.beginPath(); ctx.arc(tx + tw - 18, ty + th + 14, 8, 0, 7); ctx.fill(); ctx.stroke(); }
    // cutia cu fire
    ctx.fillStyle = '#d9a273'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + w * 0.08, y + h * 0.55, w * 0.84, h * 0.34, 14); ctx.fill(); ctx.stroke();
    for (const i of [0, 1, 2]) {
      const L = this.pos('L', i), Rr = this.pos('R', this.sockets.indexOf(i));
      if (this.linked[i]) { ctx.strokeStyle = this.colors[i]; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.bezierCurveTo(L.x + 120, L.y, Rr.x - 120, Rr.y, Rr.x, Rr.y); ctx.stroke(); }
      ctx.fillStyle = this.colors[i]; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(L.x, L.y, 14, 0, 7); ctx.fill(); ctx.stroke();
    }
    for (const k of [0, 1, 2]) { const p = this.pos('R', k); ctx.fillStyle = this.colors[this.sockets[k]]; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(p.x - 14, p.y - 12, 28, 24, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#222'; ctx.fillRect(p.x - 5, p.y - 4, 3, 8); ctx.fillRect(p.x + 2, p.y - 4, 3, 8); }
    if (this.drag) { const L = this.pos('L', this.drag.i); ctx.strokeStyle = this.colors[this.drag.i]; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.bezierCurveTo(L.x + 80, L.y, this.drag.x - 80, this.drag.y, this.drag.x, this.drag.y); ctx.stroke(); }
    if (this.phase === 'smack') { ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + 40, y + 48, w - 80, 14, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2ec4b6'; ctx.beginPath(); ctx.roundRect(x + 42, y + 50, (w - 84) * Math.min(1, this.signal), 10, 5); ctx.fill(); }
  }
}
