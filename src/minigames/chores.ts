// Minijocurile treburilor din casa.
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import { heartPath, starPath } from '../char/draw';
import type { WorldScene } from '../scenes/world';

const O = '#3a2a22';
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const font = (ctx: CanvasRenderingContext2D, s: number) => { ctx.font = `800 ${s}px "Baloo 2", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; };
const timerBar = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, k: number, col = '#ff7aa2') => {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, y, w, 14, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, Math.max(0, (w - 4) * k), 10, 5); ctx.fill();
};

// ---------------------------------------------------------------- 🛁 Baie cu spuma: sparge bulele
interface Bubble { x: number; y: number; r: number; vy: number; ph: number; duck?: boolean; gold?: boolean }
export class BathGame extends Panel {
  bubbles: Bubble[] = []; popped = 0; goal = 22; dur = 22; spawn = 0;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🫧 Baie cu spumă', 'Sparge bulele! Rățușca aurie = bonus'); this.hero.play('act_bath'); }
  tick(dt: number) {
    this.spawn -= dt;
    if (this.spawn <= 0) { this.spawn = rnd(0.18, 0.4); const duck = Math.random() < 0.06; this.bubbles.push({ x: rnd(0.1, 0.9), y: 1.05, r: duck ? 26 : rnd(14, 30), vy: rnd(0.12, 0.25), ph: rnd(0, 6), duck, gold: duck }); }
    for (const b of this.bubbles) { b.y -= b.vy * dt; b.x += Math.sin(this.t * 2 + b.ph) * 0.0015; }
    this.bubbles = this.bubbles.filter(b => b.y > -0.1);
    if (!this.hero.busy) this.hero.play('act_bath');
    if (this.popped >= this.goal) this.finish(1 + (this.dur - this.t) / this.dur, 'Curat lună! ✨🛁');
    else if (this.t > this.dur) this.finish(this.popped / this.goal > 0.5 ? 0.6 : 0, this.popped / this.goal > 0.5 ? 'Destul de curat 🧼' : 'Încă miroase a pârț 😅');
  }
  pointer(type: string, x: number, y: number) {
    if (type !== 'down') return; const B = this.box;
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i]; const bx = B.x + b.x * B.w, by = B.y + b.y * B.h;
      if (Math.hypot(x - bx, y - by) < b.r + 10) {
        this.bubbles.splice(i, 1); this.popped += b.gold ? 4 : 1; Sfx.play('pop');
        this.fx.burst('sparkle', bx, by, 6, 6.28, 80, { color: '#bde7ff', max: 0.5 });
        if (b.gold) { this.fx.text(bx, by - 30, 'MAC MAC! +4', '#ffb703', 1.1); this.hero.play('laugh'); }
        return;
      }
    }
  }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e')) { const b = this.bubbles[0]; if (b) this.pointer('down', this.box.x + b.x * this.box.w, this.box.y + b.y * this.box.h); } }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#d5eef9'; ctx.fillRect(x, y, w, h);
    // cada
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x + 30, y + h * 0.55, w - 60, h * 0.4, 40); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9fd8f5'; ctx.beginPath(); ctx.roundRect(x + 44, y + h * 0.58, w - 88, 30, 14); ctx.fill();
    this.hero.scale = 1.6; this.hero.x = x + w / 2; this.hero.y = y + h * 0.56; this.hero.draw(ctx);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#cbe7f5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 60 + i * (w - 120) / 8, y + h * 0.6 + Math.sin(this.t * 2 + i) * 3, 22, 0, 7); ctx.fill(); ctx.stroke(); }
    for (const b of this.bubbles) {
      const bx = x + b.x * w, by = y + b.y * h;
      if (b.duck) {
        ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(bx, by, 24, 17, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(bx + 12, by - 16, 12, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.moveTo(bx + 22, by - 18); ctx.lineTo(bx + 32, by - 14); ctx.lineTo(bx + 22, by - 11); ctx.fill();
        ctx.fillStyle = O; ctx.beginPath(); ctx.arc(bx + 15, by - 19, 2, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.strokeStyle = 'rgba(120,180,220,0.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bx, by, b.r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(bx - b.r * 0.35, by - b.r * 0.35, b.r * 0.22, 0, 7); ctx.fill();
        ctx.strokeStyle = `hsla(${(this.t * 60 + b.ph * 50) % 360},80%,70%,0.6)`; ctx.beginPath(); ctx.arc(bx, by, b.r - 3, 3.6, 5.2); ctx.stroke();
      }
    }
    font(ctx, 16); ctx.fillStyle = O; ctx.fillText(`🫧 ${Math.min(this.popped, this.goal)}/${this.goal}`, x + 70, y + 46);
    timerBar(ctx, x + 130, y + 39, w - 160, 1 - this.t / this.dur);
  }
}

// ---------------------------------------------------------------- 🪥 Spalat pe dinti: alunga microbii
interface Germ { tooth: number; t: number; hp: number }
export class TeethGame extends Panel {
  germs: Germ[] = []; spawn = 0.5; killed = 0; dur = 18; brushX = -1; brushY = -1; down = false;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🪥 Dinți strălucitori', 'Freacă microbii cu degetul înainte să se înmulțească!'); }
  teeth() { const B = this.box; const out: { x: number; y: number }[] = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) out.push({ x: B.x + B.w * (0.2 + i * 0.12), y: B.y + B.h * (r ? 0.62 : 0.42) }); return out; }
  tick(dt: number) {
    this.spawn -= dt;
    if (this.spawn <= 0) { this.spawn = Math.max(0.35, 1.1 - this.t * 0.04); const free = [...Array(12).keys()].filter(i => !this.germs.some(g => g.tooth === i)); if (free.length) this.germs.push({ tooth: free[Math.floor(Math.random() * free.length)], t: 0, hp: 1 }); }
    for (const g of this.germs) g.t += dt;
    if (this.down) {
      const T = this.teeth();
      for (const g of this.germs) { const p = T[g.tooth]; if (Math.hypot(this.brushX - p.x, this.brushY - p.y) < 40) { g.hp -= dt * 2.5; if (Math.random() < 0.3) this.fx.emit('puff', p.x + rnd(-20, 20), p.y + rnd(-20, 20), { vy: -20, max: 0.6, size: 0.6 }); } }
      const dead = this.germs.filter(g => g.hp <= 0);
      for (const g of dead) { const p = T[g.tooth]; this.killed++; Sfx.play('pop'); this.fx.text(p.x, p.y - 30, ['Pa!', 'Iiiik!', 'Nuuu!'][this.killed % 3], '#7cb342', 0.8); this.fx.burst('sparkle', p.x, p.y, 6, 6.28, 90, { max: 0.5 }); }
      this.germs = this.germs.filter(g => g.hp > 0);
    }
    if (this.germs.length >= 9) this.finish(0, 'Carii peste tot! 🦷😱');
    if (this.t > this.dur) this.finish(1 + Math.min(1, this.killed / 25), 'Zâmbet de milioane! 😁✨');
  }
  pointer(type: string, x: number, y: number) { this.down = type === 'down' ? true : type === 'up' ? false : this.down; this.brushX = x; this.brushY = y; }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e') && this.germs[0]) { const p = this.teeth()[this.germs[0].tooth]; this.down = true; this.brushX = p.x; this.brushY = p.y; setTimeout(() => (this.down = false), 300); } }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#ffd9e2'; ctx.fillRect(x, y, w, h);
    // gura mare
    ctx.fillStyle = '#7a2b34'; ctx.strokeStyle = O; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.52, w * 0.42, h * 0.24, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff7f96'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.62, w * 0.25, h * 0.08, 0, 0, 7); ctx.fill();
    const T = this.teeth();
    T.forEach((p, i) => {
      const dirty = this.germs.find(g => g.tooth === i);
      ctx.fillStyle = dirty ? '#f1f3c4' : '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(p.x - 26, p.y - 26, 52, 52, 12); ctx.fill(); ctx.stroke();
      if (!dirty) { starPath(ctx, p.x + 12, p.y - 12, 5, 2, 4, this.t); ctx.fillStyle = '#bde7ff'; ctx.fill(); }
    });
    for (const g of this.germs) {
      const p = T[g.tooth]; const s = Math.min(1, g.t * 3) * (0.5 + g.hp * 0.5);
      ctx.save(); ctx.translate(p.x, p.y + Math.sin(this.t * 8 + g.tooth) * 3); ctx.scale(s, s);
      ctx.fillStyle = '#8bc34a'; ctx.strokeStyle = '#33691e'; ctx.lineWidth = 2.5;
      ctx.beginPath(); for (let a = 0; a < 7; a += 0.5) { const r = 18 + Math.sin(a * 5 + this.t * 6) * 3; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-6, -4, 5, 0, 7); ctx.arc(6, -4, 5, 0, 7); ctx.fill();
      ctx.fillStyle = O; ctx.beginPath(); ctx.arc(-5, -3, 2.4, 0, 7); ctx.arc(7, -3, 2.4, 0, 7); ctx.fill();
      ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, 7); ctx.lineTo(-2, 4); ctx.lineTo(2, 7); ctx.lineTo(6, 4); ctx.stroke();
      ctx.restore();
    }
    if (this.down && this.brushX > 0) {
      ctx.save(); ctx.translate(this.brushX, this.brushY); ctx.rotate(-0.5 + Math.sin(this.t * 30) * 0.15);
      ctx.fillStyle = '#ff9ab8'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-8, 0, 16, 90, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-14, -24, 28, 26, 6); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    font(ctx, 16); ctx.fillStyle = O; ctx.fillText(`🦠 ${this.killed}`, x + 50, y + 46);
    timerBar(ctx, x + 100, y + 39, w - 130, 1 - this.t / this.dur);
  }
}

// ---------------------------------------------------------------- 🍽️ Spalat vase: freaca farfuria
export class DishesGame extends Panel {
  plate = 0; dirt = 1; total = 5; lx = 0; ly = 0; down = false; foam: { x: number; y: number; r: number }[] = []; dur = 25;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🍽️ Spălat vase', 'Freacă farfuria înainte-înapoi până strălucește'); }
  tick(dt: number) {
    if (this.dirt <= 0) { this.plate++; Sfx.play('good'); this.fx.text(this.box.x + this.box.w / 2, this.box.y + this.box.h * 0.3, ['Scârț-scârț!', 'Lună!', 'Ca nouă!', 'Strălucește!', 'Gata!'][this.plate % 5], '#2ec4b6', 1.1); this.dirt = 1; this.foam = []; }
    if (this.plate >= this.total) this.finish(1 + (this.dur - this.t) / this.dur, 'Vase curate! 🍽️✨');
    else if (this.t > this.dur) this.finish(this.plate >= 3 ? 0.6 : 0, this.plate >= 3 ? 'Restul… mâine 😅' : 'Chiuveta a câștigat 😩');
  }
  pointer(type: string, x: number, y: number) {
    if (type === 'down') { this.down = true; this.lx = x; this.ly = y; return; }
    if (type === 'up') { this.down = false; return; }
    if (!this.down) return;
    const d = Math.hypot(x - this.lx, y - this.ly); this.lx = x; this.ly = y;
    const B = this.box; const cx = B.x + B.w / 2, cy = B.y + B.h * 0.55;
    if (Math.hypot(x - cx, y - cy) < 130) { this.dirt = Math.max(0, this.dirt - d / 2200); if (Math.random() < 0.35) this.foam.push({ x: x - cx, y: y - cy, r: rnd(8, 20) }); if (Math.random() < 0.06) Sfx.play('step'); }
  }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e')) { this.dirt = Math.max(0, this.dirt - 0.08); this.foam.push({ x: rnd(-80, 80), y: rnd(-60, 60), r: rnd(8, 20) }); } }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#fff4e4'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#c0c6cc'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x + 30, y + h * 0.25, w - 60, h * 0.62, 30); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9fd8f5'; ctx.beginPath(); ctx.roundRect(x + 44, y + h * 0.29, w - 88, h * 0.54, 24); ctx.fill();
    const cx = x + w / 2, cy = y + h * 0.55;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 120, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffb6c9'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, 100, 0, 7); ctx.stroke();
    // murdaria
    ctx.save(); ctx.globalAlpha = this.dirt;
    for (let i = 0; i < 9; i++) { const a = i * 0.7 + this.plate, r = 30 + (i * 13) % 60; ctx.fillStyle = ['#a0522d', '#c49a6c', '#e9c46a'][i % 3]; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 14 + i % 3 * 6, 10, a, 0, 7); ctx.fill(); }
    ctx.restore();
    for (const f of this.foam) { ctx.fillStyle = '#ffffffdd'; ctx.strokeStyle = '#cbe7f5'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx + f.x, cy + f.y, f.r, 0, 7); ctx.fill(); ctx.stroke(); }
    if (this.dirt < 0.15) { starPath(ctx, cx + 60, cy - 60, 14, 5, 4, this.t * 3); ctx.fillStyle = '#fff6b0'; ctx.fill(); }
    // teancul ramas
    for (let i = 0; i < this.total - this.plate - 1; i++) { ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + 70, y + h * 0.2 - i * 8, 40, 10, 0, 0, 7); ctx.fill(); ctx.stroke(); }
    font(ctx, 16); ctx.fillStyle = O; ctx.fillText(`🍽️ ${this.plate}/${this.total}`, x + w - 60, y + h * 0.17);
    timerBar(ctx, x + 130, y + 40, w - 160, 1 - this.t / this.dur);
  }
}

// ---------------------------------------------------------------- 🧦 Rufe: perechi de sosete (memorie)
const SOCKS = ['#ff7aa2', '#7ab8ff', '#ffd23f', '#7cc576', '#c77dff', '#ff8c42'];
export class SocksGame extends Panel {
  cards: { c: number; open: boolean; done: boolean }[] = []; first = -1; wait = 0; pairs = 0; moves = 0; lostJoke = 0;
  constructor(s: WorldScene, d: (n: number) => void) {
    super(s, d, '🧦 Perechi de șosete', 'Găsește perechile! (o șosetă dispare mereu…)');
    const arr = [...SOCKS.keys(), ...SOCKS.keys()].sort(() => Math.random() - 0.5);
    this.cards = arr.map(c => ({ c, open: false, done: false }));
  }
  rect(i: number) { const B = this.box; const cols = 4, cw = (B.w - 60) / cols, ch = (B.h - 170) / 3; return { x: B.x + 30 + (i % cols) * cw, y: B.y + 80 + Math.floor(i / cols) * ch, w: cw - 10, h: ch - 10 }; }
  tick(dt: number) {
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) this.cards.forEach(c => { if (!c.done) c.open = false; }); }
    if (this.pairs >= 6 && !this.lostJoke) { this.lostJoke = 0.01; }
    if (this.lostJoke) { this.lostJoke += dt; if (this.lostJoke > 2.5) this.finish(1 + Math.max(0, (20 - this.moves) / 20), 'Rufe împerecheate! 🧺💕'); }
  }
  pointer(type: string, x: number, y: number) {
    if (type !== 'down' || this.wait > 0 || this.lostJoke) return;
    const i = this.cards.findIndex((_, k) => { const r = this.rect(k); return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h; });
    if (i < 0) return; const c = this.cards[i]; if (c.open || c.done) return;
    c.open = true; Sfx.play('pop');
    if (this.first < 0) { this.first = i; return; }
    this.moves++;
    const f = this.cards[this.first];
    if (f.c === c.c) { f.done = c.done = true; this.pairs++; Sfx.play('coin'); const r = this.rect(i); this.fx.hearts(r.x + r.w / 2, r.y, 3); }
    else this.wait = 0.8;
    this.first = -1;
  }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e')) { const i = this.cards.findIndex(c => !c.open && !c.done); if (i >= 0) { const r = this.rect(i); this.pointer('down', r.x + 5, r.y + 5); } } }
  sock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = col; ctx.strokeStyle = O; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-10, -26); ctx.lineTo(10, -26); ctx.lineTo(10, 8); ctx.quadraticCurveTo(10, 22, -6, 22); ctx.lineTo(-20, 22); ctx.quadraticCurveTo(-30, 22, -30, 12); ctx.quadraticCurveTo(-30, 4, -10, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(-10, -26, 20, 7); ctx.strokeRect(-10, -26, 20, 7);
    heartPath(ctx, 0, -6, 5); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
  }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#e6f7f1'; ctx.fillRect(x, y, w, h);
    this.cards.forEach((c, i) => {
      const r = this.rect(i);
      ctx.fillStyle = c.done ? '#d8f5d0' : c.open ? '#fff' : '#ff9ab8'; ctx.strokeStyle = O; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.fill(); ctx.stroke();
      if (c.open || c.done) this.sock(ctx, r.x + r.w / 2 + 6, r.y + r.h / 2, Math.min(r.w, r.h) / 60, SOCKS[c.c]);
      else { font(ctx, 26); ctx.fillStyle = '#fff'; ctx.fillText('?', r.x + r.w / 2, r.y + r.h / 2); }
    });
    font(ctx, 15); ctx.fillStyle = O; ctx.fillText(`Perechi: ${this.pairs}/6 · Mutări: ${this.moves}`, x + w / 2, y + 54);
    if (this.lostJoke) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x, y + h * 0.35, w, 120);
      font(ctx, 18); ctx.fillStyle = O; ctx.fillText(`…dar o șosetă e pe capul lui/ei ${this.scene.partner.actor.spec.name}! 🧦😂`, x + w / 2, y + h * 0.35 + 60);
    }
  }
}

// ---------------------------------------------------------------- 🌱 Gradina: planteaza, uda, alunga ciorile
interface Spot { stage: number; water: number }
export class GardenGame extends Panel {
  spots: Spot[] = Array.from({ length: 6 }, () => ({ stage: 0, water: 0 }));
  crow: { x: number; y: number; target: number; t: number } | null = null; crowT = 4; dur = 30; harvested = 0;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🌱 Grădina noastră', 'Atinge: plantează → udă (de 3 ori) → culege! Alungă ciorile'); this.hero.play('act_garden'); }
  pos(i: number) { const B = this.box; return { x: B.x + B.w * (0.22 + (i % 3) * 0.28), y: B.y + B.h * (0.45 + Math.floor(i / 3) * 0.24) }; }
  tick(dt: number) {
    this.crowT -= dt;
    if (!this.crow && this.crowT <= 0) { const t = this.spots.findIndex(s => s.stage >= 1); if (t >= 0) { this.crow = { x: this.box.x - 40, y: this.box.y + 80, target: t, t: 0 }; this.fx.text(this.box.x + 60, this.box.y + 70, 'CRA-CRA!', '#333', 0.9); } this.crowT = rnd(4, 7); }
    if (this.crow) {
      const c = this.crow; c.t += dt; const p = this.pos(c.target);
      c.x += (p.x - c.x) * Math.min(1, dt * 1.2); c.y += (p.y - 30 - c.y) * Math.min(1, dt * 1.2);
      if (c.t > 2.6) { this.spots[c.target].stage = Math.max(0, this.spots[c.target].stage - 1); this.spots[c.target].water = 0; this.fx.text(p.x, p.y - 50, 'Mi-a furat sămânța! 😠', '#e63946', 0.8); this.crow = null; Sfx.play('bad'); }
    }
    if (!this.hero.busy) this.hero.play('act_garden');
    if (this.harvested >= 6 || this.t > this.dur) this.finish(this.harvested >= 2 ? 1 + this.harvested / 6 : 0, this.harvested >= 6 ? 'Recoltă bogată! 🍓🌻' : this.harvested >= 2 ? `Ai cules ${this.harvested} 🍓` : 'Ciorile au câștigat 🐦');
  }
  pointer(type: string, x: number, y: number) {
    if (type !== 'down') return;
    if (this.crow && Math.hypot(x - this.crow.x, y - this.crow.y) < 50) { this.fx.burst('puff', this.crow.x, this.crow.y, 8, 6.28, 80); this.fx.text(this.crow.x, this.crow.y - 30, 'ZBAAT!', '#ff9f1c', 1); this.crow = null; Sfx.play('slap'); return; }
    for (let i = 0; i < 6; i++) {
      const p = this.pos(i); if (Math.hypot(x - p.x, y - p.y) > 55) continue;
      const s = this.spots[i];
      if (s.stage === 0) { s.stage = 1; s.water = 0; Sfx.play('pop'); this.fx.text(p.x, p.y - 40, 'Sămânță!', '#8b5e34', 0.7); }
      else if (s.stage < 4) { s.water++; this.fx.burst('drop', p.x, p.y - 60, 8, 0.8, 80, { rot: Math.PI / 2, grav: 300, max: 0.6 }); Sfx.play('splash'); if (s.water >= 3) { s.stage++; s.water = 0; if (s.stage === 4) this.fx.burst('sparkle', p.x, p.y - 30, 8, 6.28, 90); } }
      else { s.stage = 0; this.harvested++; Sfx.play('coin'); this.fx.text(p.x, p.y - 50, '+🍓', '#e63946', 1.1); this.fx.hearts(p.x, p.y - 40, 3); }
      return;
    }
  }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e')) { if (this.crow) { this.pointer('down', this.crow.x, this.crow.y); return; } const i = this.spots.findIndex(s => s.stage < 4) >= 0 ? this.spots.reduce((b, s, j) => s.stage > this.spots[b].stage ? j : b, 0) : 0; const p = this.pos(i); this.pointer('down', p.x, p.y); } }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#bfe8ff'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#a6dc93'; ctx.fillRect(x, y + h * 0.3, w, h * 0.7);
    ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(x + w - 60, y + 80, 26, 0, 7); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const p = this.pos(i), s = this.spots[i];
      ctx.fillStyle = '#a87a50'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x, p.y, 52, 22, 0, 0, 7); ctx.fill(); ctx.stroke();
      if (s.stage >= 1) { ctx.fillStyle = '#5d3d1e'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 2, 8, 4, 0, 0, 7); ctx.fill(); }
      if (s.stage >= 2) { ctx.strokeStyle = '#3d8b3d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 14 - s.stage * 10); ctx.stroke(); ctx.fillStyle = '#7cc576'; ctx.beginPath(); ctx.ellipse(p.x - 10, p.y - 16 - s.stage * 4, 10, 5, -0.5, 0, 7); ctx.ellipse(p.x + 10, p.y - 20 - s.stage * 4, 10, 5, 0.5, 0, 7); ctx.fill(); }
      if (s.stage >= 4) { ctx.fillStyle = '#e63946'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(p.x - 12, p.y - 60); ctx.quadraticCurveTo(p.x, p.y - 30, p.x + 12, p.y - 60); ctx.quadraticCurveTo(p.x, p.y - 72, p.x - 12, p.y - 60); ctx.fill(); ctx.stroke(); }
      if (s.stage >= 1 && s.stage < 4) for (let k = 0; k < 3; k++) { ctx.fillStyle = k < s.water ? '#4cc9f0' : '#ffffff99'; ctx.beginPath(); ctx.arc(p.x - 12 + k * 12, p.y + 32, 4.5, 0, 7); ctx.fill(); }
    }
    if (this.crow) {
      const c = this.crow; const fl = Math.sin(this.t * 20) * 10;
      ctx.fillStyle = '#333'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(c.x, c.y, 20, 14, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(c.x - 4, c.y - 4); ctx.lineTo(c.x - 28, c.y - 14 - fl); ctx.lineTo(c.x - 10, c.y + 4); ctx.fill();
      ctx.beginPath(); ctx.arc(c.x + 16, c.y - 8, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(c.x + 24, c.y - 10); ctx.lineTo(c.x + 34, c.y - 6); ctx.lineTo(c.x + 24, c.y - 4); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(c.x + 18, c.y - 10, 3, 0, 7); ctx.fill();
    }
    this.hero.scale = 1.1; this.hero.x = x + 60; this.hero.y = y + h - 40; this.hero.draw(ctx);
    font(ctx, 16); ctx.fillStyle = O; ctx.fillText(`🍓 ${this.harvested}/6`, x + 60, y + 46);
    timerBar(ctx, x + 110, y + 39, w - 140, 1 - this.t / this.dur, '#7cc576');
  }
}

// ---------------------------------------------------------------- 🧊 Frigiderul: prinde gustarile
interface Food { x: number; y: number; vy: number; kind: number; rot: number }
const FOODS = [
  { e: '🍰', good: 1, txt: 'Mmm!' }, { e: '🧋', good: 1, txt: 'Boba!' }, { e: '🍓', good: 1, txt: 'Dulce!' }, { e: '🍪', good: 1, txt: 'Crunch!' },
  { e: '🫘', good: 2, txt: 'Fasole! 💨' }, { e: '🥦', good: -1, txt: 'Bleah!' }, { e: '🌶️', good: -2, txt: 'FOC! 🔥' },
];
export class FridgeGame extends Panel {
  foods: Food[] = []; px = 0.5; spawn = 0; score = 0; beans = 0; dur = 20; keys = new Set<string>(); hot = 0;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🧊 Raid la frigider', 'Mișcă farfuria (deget / ← →). Fasolea umple bara de pârț 💨'); }
  tick(dt: number) {
    this.spawn -= dt;
    if (this.spawn <= 0) { this.spawn = rnd(0.35, 0.7); const k = Math.random(); this.foods.push({ x: rnd(0.1, 0.9), y: 0.12, vy: rnd(0.28, 0.45), kind: k < 0.55 ? Math.floor(Math.random() * 4) : k < 0.72 ? 4 : k < 0.9 ? 5 : 6, rot: rnd(-1, 1) }); }
    if (this.keys.has('arrowleft') || this.keys.has('a')) this.px = Math.max(0.08, this.px - dt * 1.1);
    if (this.keys.has('arrowright') || this.keys.has('d')) this.px = Math.min(0.92, this.px + dt * 1.1);
    this.hot = Math.max(0, this.hot - dt);
    const B = this.box;
    for (const f of this.foods) {
      f.y += f.vy * dt; f.rot += dt * 2;
      if (f.y > 0.8 && f.y < 0.86 && Math.abs(f.x - this.px) < 0.11) {
        const F = FOODS[f.kind]; f.y = 2;
        this.fx.text(B.x + f.x * B.w, B.y + B.h * 0.72, F.txt, F.good > 0 ? '#2ec4b6' : '#e63946', 0.9);
        if (F.good > 0) { this.score += 1; Sfx.play('coin'); } else { this.score = Math.max(0, this.score - 1); Sfx.play('bad'); this.shake = 6; }
        if (f.kind === 4) this.beans++;
        if (f.kind === 6) { this.hot = 1.5; this.fx.burst('puff', B.x + this.px * B.w, B.y + B.h * 0.7, 10, 1.5, 120, { color: '#ff6b3d' }); }
      }
    }
    this.foods = this.foods.filter(f => f.y < 1.1);
    if (this.t > this.dur) this.finish(this.score >= 5 ? 1 + this.score / 20 : 0.3, this.score >= 10 ? 'Burtică fericită! 😋' : 'Gustărică 🍪');
  }
  get bonusFart() { return this.beans * 12; }
  pointer(type: string, x: number) { if (type !== 'up') this.px = Math.max(0.08, Math.min(0.92, (x - this.box.x) / this.box.w)); }
  key(k: string, d: boolean) { d ? this.keys.add(k) : this.keys.delete(k); }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#eaf6ff'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#c4e0f5'; ctx.lineWidth = 6; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x, y + h * 0.18 * i + 40); ctx.lineTo(x + w, y + h * 0.18 * i + 40); ctx.stroke(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of this.foods) { ctx.save(); ctx.translate(x + f.x * w, y + f.y * h); ctx.rotate(f.rot); ctx.font = '34px sans-serif'; ctx.fillText(FOODS[f.kind].e, 0, 0); ctx.restore(); }
    // eroul cu farfuria
    this.hero.scale = 1.2; this.hero.x = x + this.px * w; this.hero.y = y + h - 36;
    if (this.hot > 0) { this.hero.pose.mouth = 'scream'; this.hero.pose.eyes = 'cry'; this.hero.pose.blush = 2; }
    this.hero.draw(ctx);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + this.px * w, y + h * 0.83, 50, 12, 0, 0, 7); ctx.fill(); ctx.stroke();
    font(ctx, 16); ctx.fillStyle = O; ctx.fillText(`😋 ${this.score}   💨 ${this.beans}`, x + 80, y + 46);
    timerBar(ctx, x + 150, y + 39, w - 180, 1 - this.t / this.dur, '#7ab8ff');
  }
}
