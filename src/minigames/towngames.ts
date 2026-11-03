// Minijocurile noi din sat si oras: postasul, brutaria, spitalul, cursurile de la universitate
// si interiorul magazinelor (rafturi cu produse, vanzator la tejghea).
import { Panel, sweep, HIT_SLACK } from './base';
import { Sfx } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';
import { drawCharacter, heartPath, NPC_SPECS, type CharSpec } from '../char/draw';
import { basePose, type Pose } from '../char/pose';
import { iconCanvas } from '../ui/icons';
import { drawTandemSide } from '../world/vehicles';
import { COURSES, type CourseDef } from '../game/town';

const O = '#4a2a22';
type Box = { x: number; y: number; w: number; h: number };
const inside = (x: number, y: number, b: Box) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
const pose = (o: Partial<Pose>) => Object.assign(basePose(), o);
function btn(ctx: CanvasRenderingContext2D, b: Box, fill: string, label = '', sz = 15, on = true) {
  ctx.globalAlpha = on ? 1 : 0.45;
  ctx.fillStyle = fill; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 14); ctx.fill(); ctx.stroke();
  if (label) { ctx.font = `800 ${sz}px "Baloo 2", sans-serif`; ctx.fillStyle = O; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1, b.w - 10); ctx.textBaseline = 'alphabetic'; }
  ctx.globalAlpha = 1;
}
function icon(ctx: CanvasRenderingContext2D, e: string, x: number, y: number, s: number) { const cv = iconCanvas(e, 64); if (cv) ctx.drawImage(cv, x - s / 2, y - s / 2, s, s); }
function T(ctx: CanvasRenderingContext2D, txt: string, x: number, y: number, sz = 15, col = O, align: CanvasTextAlign = 'center', maxW?: number) {
  ctx.font = `800 ${sz}px "Baloo 2", sans-serif`; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y, maxW); ctx.textBaseline = 'alphabetic';
}

// ====================================================================== POSTASUL (scrisori pe bicicleta)
const SYMS = ['🌸', '🐟', '🍄', '⭐', '🍓', '🔔'];
const HCOL = ['#fff1d6', '#ffe1ea', '#e8f1ff', '#fff6b8', '#e7f6e2', '#f3e6ff'];
const RCOL = ['#c0573e', '#e5809a', '#5b7fbf', '#c9a24a', '#5aa35a', '#9a7ad6'];
export class PostGame extends Panel {
  houses: { x: number; sym: number; got: number }[] = []; scroll = 0; speed = 150; left = 45; letter = 0; good = 0; bad = 0; missed = 0;
  fly: { x: number; y: number; tx: number; ty: number; k: number; ok: boolean } | null = null; dogX = -200; delivered = 0;
  constructor(s: WorldScene, d: (n: number) => void) {
    super(s, d, '💌 Poștașul satului', 'Atinge (SPAȚIU) când cutia cu același semn e în dreptul bicicletei');
    let x = 420; for (let i = 0; i < 60; i++) { this.houses.push({ x, sym: Math.floor(Math.random() * SYMS.length), got: 0 }); x += 170 + Math.random() * 70; }
    this.pickLetter();
  }
  pickLetter() { const ahead = this.houses.filter(h => h.x - this.scroll > 260 && h.x - this.scroll < 900 && !h.got); this.letter = ahead.length ? ahead[Math.floor(Math.random() * Math.min(3, ahead.length))].sym : Math.floor(Math.random() * SYMS.length); }
  get bikeX() { return this.box.x + this.box.w * 0.3; }
  tick(dt: number) {
    this.left -= dt; this.speed = 150 + (45 - this.left) * 2.2;
    this.scroll += this.speed * dt; this.dogX += (this.speed - 60) * dt;
    if (this.dogX > this.box.w + 200) this.dogX = -400 - Math.random() * 600;
    // casa cu scrisoarea a trecut fara sa o livrezi
    for (const h of this.houses) { const hx = this.box.x + h.x - this.scroll; if (!h.got && h.sym === this.letter && hx < this.bikeX - 70 && hx > this.bikeX - 80 - this.speed * dt) { this.missed++; this.pickLetter(); } }
    if (this.fly) { this.fly.k += dt * 3; if (this.fly.k >= 1) { const ok = this.fly.ok; this.fly = null; if (ok) { this.good++; Sfx.play('coin'); } else { this.bad++; Sfx.play('bad'); } this.pickLetter(); } }
    if (this.left <= 0) this.end();
  }
  throw() {
    if (this.fly || this.ended) return;
    const B = this.box;
    let best: { x: number; sym: number; got: number } | null = null, bd = 1e9;
    for (const h of this.houses) { const d = Math.abs(B.x + h.x - this.scroll + 40 - this.bikeX); if (d < bd) { bd = d; best = h; } }
    const ok = !!best && bd < 46 + 46 * HIT_SLACK * 10 && best.sym === this.letter && !best.got;
    const mx = best ? B.x + best.x - this.scroll + 40 : this.bikeX + 60;
    if (best && ok) best.got = 1;
    this.fly = { x: this.bikeX, y: B.y + B.h * 0.62, tx: mx, ty: B.y + B.h * 0.6, k: 0, ok };
    this.hero.play(ok ? 'dance_hop' : 'shy');
    this.fx.text(mx, B.y + B.h * 0.45, ok ? 'Livrat! 💌' : 'Greșit! 📭', ok ? '#2a9a4a' : '#e63946', 0.8);
  }
  pointer(t: string) { if (t === 'down') this.throw(); }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e' || k === 'enter')) this.throw(); }
  end() {
    const total = this.good + this.bad + this.missed;
    const perf = total ? (this.good / total) * Math.min(1.2, this.good / 10 + 0.2) : 0.3;
    this.finish(1 + this.good * 0.1, this.scene.finishJob(perf, `${this.good} scrisori livrate`));
  }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const sky = ctx.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#9fd3f5'); sky.addColorStop(1, '#fff1d6'); ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
    const ground = y + h * 0.72;
    // dealuri
    ctx.fillStyle = '#b9e3a5'; ctx.beginPath(); ctx.moveTo(x, ground); for (let i = 0; i <= 12; i++) ctx.lineTo(x + i * w / 12, ground - 40 - Math.sin(i * 1.7 + this.scroll * 0.002) * 16); ctx.lineTo(x + w, ground); ctx.fill();
    // casele cu cutii postale
    for (const hs of this.houses) {
      const hx = x + hs.x - this.scroll; if (hx < x - 160 || hx > x + w + 40) continue;
      const by = ground - 6; const col = HCOL[hs.sym], roof = RCOL[hs.sym];
      ctx.fillStyle = col; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(hx - 60, by - 84, 110, 84, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(hx - 70, by - 84); ctx.lineTo(hx - 5, by - 128); ctx.lineTo(hx + 60, by - 84); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8a5d32'; ctx.beginPath(); ctx.roundRect(hx - 20, by - 46, 26, 46, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#bfe8ff'; ctx.beginPath(); ctx.roundRect(hx - 50, by - 70, 22, 20, 3); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(hx + 18, by - 70, 22, 20, 3); ctx.fill(); ctx.stroke();
      // cutia postala cu semnul casei
      const mx = hx + 40;
      ctx.fillStyle = '#8a5d32'; ctx.fillRect(mx - 3, by - 34, 6, 34); ctx.strokeRect(mx - 3, by - 34, 6, 34);
      ctx.fillStyle = hs.got ? '#9be38f' : roof; ctx.beginPath(); ctx.roundRect(mx - 16, by - 56, 32, 24, 8); ctx.fill(); ctx.stroke();
      icon(ctx, SYMS[hs.sym], mx, by - 74, 26);
      if (hs.got) { heartPath(ctx, mx, by - 98, 7); ctx.fillStyle = '#ff4d6d'; ctx.fill(); }
    }
    // drumul
    ctx.fillStyle = '#d9c3a0'; ctx.fillRect(x, ground, w, h * 0.28);
    for (let i = 0; i < 12; i++) { const lx = x + ((i * 90 - this.scroll) % (w + 90) + w + 90) % (w + 90) - 45; ctx.fillStyle = '#fff6'; ctx.fillRect(lx, ground + h * 0.13, 40, 5); }
    // zona de aruncare
    ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(this.bikeX, y + 60); ctx.lineTo(this.bikeX, ground); ctx.stroke(); ctx.setLineDash([]);
    // catelul care alearga dupa bicicleta (doar de rasul lumii)
    if (this.dogX > -100 && this.dogX < w) { const dx = x + this.dogX, dy = ground + 26; const P = pose({ eyes: 'happy', mouth: 'open', legL: Math.abs(Math.sin(this.t * 14)) * 6, legR: Math.abs(Math.cos(this.t * 14)) * 6 }); drawCharacter(ctx, NPC_SPECS.dog, P, dx, dy, 0.55, 1, this.t); }
    // bicicleta cu tine
    ctx.save(); ctx.translate(0, 0); drawTandemSide(ctx, this.bikeX, ground + 30, 0.95, this.t, { rot: this.scroll / 18, bump: Math.sin(this.t * 18) * 0.6, driver: this.scene.me.actor.spec }); ctx.restore();
    // scrisoarea care zboara
    if (this.fly) { const f = this.fly, k = f.k; const fx = f.x + (f.tx - f.x) * k, fy = f.y + (f.ty - f.y) * k - Math.sin(k * Math.PI) * 60; ctx.save(); ctx.translate(fx, fy); ctx.rotate(k * 8); icon(ctx, '💌', 0, 0, 34); ctx.restore(); }
    // scrisoarea curenta
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + 16, y + 40, 150, 58, 12); ctx.fill(); ctx.stroke();
    icon(ctx, '💌', x + 44, y + 69, 36); T(ctx, 'pentru', x + 96, y + 58, 12); icon(ctx, SYMS[this.letter], x + 138, y + 69, 34);
    T(ctx, `⏰ ${Math.ceil(Math.max(0, this.left))}s · ✅ ${this.good} · ❌ ${this.bad + this.missed}`, x + w - 20, y + 60, 14, O, 'right');
  }
}

// ====================================================================== BRUTARIA
const BREADS = [{ id: 'paine', name: 'Pâine', col: '#d9a05a' }, { id: 'covrig', name: 'Covrig', col: '#c98a4a' }, { id: 'cozonac', name: 'Cozonac', col: '#e8b06a' }];
function drawBread(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number, s: number, baked: number) {
  const col = baked < 0.3 ? '#f5e6c8' : baked > 1.15 ? '#5a3a22' : BREADS.find(b => b.id === kind)!.col;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = O; ctx.lineWidth = 3;
  if (kind === 'paine') { ctx.beginPath(); ctx.ellipse(0, 0, 44, 26, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#fff8'; ctx.lineWidth = 3; for (const dx of [-18, 0, 18]) { ctx.beginPath(); ctx.moveTo(dx - 7, -10); ctx.lineTo(dx + 7, 6); ctx.stroke(); } }
  else if (kind === 'covrig') { ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.arc(0, 0, 12, 0, 7, true); ctx.fill('evenodd'); ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.stroke(); ctx.fillStyle = '#fff'; for (let i = 0; i < 10; i++) { const a = i * 0.63; ctx.fillRect(Math.cos(a) * 21 - 1.5, Math.sin(a) * 21 - 1.5, 3, 3); } }
  else { ctx.beginPath(); ctx.roundRect(-40, -26, 80, 46, 14); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#fff6'; ctx.lineWidth = 4; for (const dx of [-22, -6, 10, 26]) { ctx.beginPath(); ctx.moveTo(dx - 8, -22); ctx.quadraticCurveTo(dx, -2, dx - 8, 16); ctx.stroke(); } }
  ctx.restore();
}
export class BakeryGame extends Panel {
  orders = [0, 1, 2, 0, 1].map(i => BREADS[(i + Math.floor(Math.random() * 3)) % 3].id).slice(0, 4);
  i = 0; step: 'knead' | 'shape' | 'bake' | 'show' = 'knead'; knead = 0; lx = 0; ly = 0; down = false; shape = ''; bakeT = 0; baked = 0; scores: number[] = []; showT = 0; left = 70;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🍞 Brutăria satului', 'Frământă (freacă / SPAȚIU) → alege forma → scoate din cuptor când e aurie'); }
  get order() { return this.orders[Math.min(this.i, this.orders.length - 1)]; }
  shapeBtn(k: number): Box { const B = this.box, bw = (B.w - 80) / 3; return { x: B.x + 20 + k * (bw + 20), y: B.y + B.h - 110, w: bw, h: 64 }; }
  ovenBtn(): Box { const B = this.box; return { x: B.x + B.w / 2 - 110, y: B.y + B.h - 100, w: 220, h: 56 }; }
  tick(dt: number) {
    this.left -= dt;
    if (this.step === 'bake') { this.bakeT += dt; this.baked = sweep(this.bakeT, 0.55) * 0.5 + 0.75; } // 0.25..1.25
    if (this.step === 'show') { this.showT -= dt; if (this.showT <= 0) { this.i++; if (this.i >= this.orders.length) return this.end(); this.step = 'knead'; this.knead = 0; this.shape = ''; } }
    if (this.left <= 0) this.end();
  }
  addKnead(v: number) { if (this.step !== 'knead') return; this.knead = Math.min(1, this.knead + v); if (Math.random() < 0.25) this.fx.emit('puff', this.box.x + this.box.w / 2 + (Math.random() - 0.5) * 80, this.box.y + this.box.h * 0.45, { vy: -30, max: 0.6, size: 0.6 }); if (this.knead >= 1) { this.step = 'shape'; Sfx.play('pop'); } }
  pointer(t: string, x: number, y: number) {
    if (this.ended) return;
    if (t === 'down') { this.down = true; this.lx = x; this.ly = y; }
    if (t === 'up') this.down = false;
    if (t === 'move' && this.down && this.step === 'knead') { this.addKnead(Math.min(40, Math.hypot(x - this.lx, y - this.ly)) / 900); this.lx = x; this.ly = y; }
    if (t !== 'down') return;
    if (this.step === 'shape') for (let k = 0; k < 3; k++) if (inside(x, y, this.shapeBtn(k))) this.pickShape(BREADS[k].id);
    if (this.step === 'bake' && inside(x, y, this.ovenBtn())) this.takeOut();
  }
  key(k: string, d: boolean) {
    if (!d) return;
    if (this.step === 'knead' && (k === ' ' || k === 'e')) this.addKnead(0.07);
    else if (this.step === 'shape' && k >= '1' && k <= '3') this.pickShape(BREADS[+k - 1].id);
    else if (this.step === 'bake' && (k === ' ' || k === 'e' || k === 'enter')) this.takeOut();
  }
  pickShape(id: string) { this.shape = id; this.step = 'bake'; this.bakeT = 0; Sfx.play(id === this.order ? 'good' : 'bad'); }
  takeOut() {
    const acc = 1 - Math.min(1, Math.abs(this.baked - 1) / 0.25); // 1 = perfect auriu
    const sc = (this.shape === this.order ? 0.4 : 0) + acc * 0.6; this.scores.push(sc);
    this.step = 'show'; this.showT = 1.3; Sfx.play(sc > 0.7 ? 'coin' : 'pop');
    this.fx.text(this.box.x + this.box.w / 2, this.box.y + this.box.h * 0.3, sc > 0.85 ? 'Perfectă! ⭐' : sc > 0.6 ? 'Bună! 🍞' : this.baked > 1.15 ? 'Arsă… 🔥' : this.shape !== this.order ? 'Altă formă…' : 'Necoaptă…', sc > 0.6 ? '#2a9a4a' : '#e63946', 1);
    if (sc > 0.7) this.hero.play('dance_hop');
  }
  end() {
    const avg = this.scores.length ? this.scores.reduce((a, b) => a + b, 0) / this.orders.length : 0;
    this.finish(1 + avg, this.scene.finishJob(avg * 1.15, `${this.scores.filter(s => s > 0.6).length}/${this.orders.length} pâini bune`));
  }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#fff3e0'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#f2d3b0'; for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) ctx.fillRect(x + i * w / 8, y + j * 40, w / 8, 40);
    // cuptorul
    const ox = x + w * 0.72, oy = y + h * 0.18;
    ctx.fillStyle = '#c0573e'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(ox - 70, oy, 140, h * 0.34, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.step === 'bake' ? '#ff8c3a' : '#3a2a22'; ctx.beginPath(); ctx.arc(ox, oy + h * 0.2, 44, Math.PI, 0); ctx.lineTo(ox + 44, oy + h * 0.28); ctx.lineTo(ox - 44, oy + h * 0.28); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (this.step === 'bake') for (let i = 0; i < 4; i++) { const k = (this.t * 1.5 + i / 4) % 1; ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(ox - 24 + i * 16, oy + h * 0.26 - k * 30, 5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    // masa
    const ty = y + h * 0.56;
    ctx.fillStyle = '#c98e5f'; ctx.beginPath(); ctx.roundRect(x + 16, ty, w - 32, 22, 6); ctx.fill(); ctx.stroke();
    // comanda
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x + 16, y + 40, w * 0.4, 70, 12); ctx.fill(); ctx.stroke();
    T(ctx, `Comanda ${Math.min(this.i + 1, this.orders.length)}/${this.orders.length}:`, x + 28, y + 56, 13, O, 'left');
    T(ctx, BREADS.find(b => b.id === this.order)!.name, x + 28, y + 80, 18, '#c0573e', 'left');
    drawBread(ctx, this.order, x + 16 + w * 0.4 - 48, y + 76, 0.55, 1);
    T(ctx, `⏰ ${Math.ceil(Math.max(0, this.left))}s`, x + 28, y + 100, 12, O, 'left');
    // aluatul / painea
    const dx = x + w * 0.38, dy = ty - 22;
    if (this.step === 'knead') {
      const sq = 1 + Math.sin(this.t * 20) * (this.down ? 0.08 : 0.02);
      ctx.fillStyle = '#f5e6c8'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(dx, dy, 52 * sq, 26 / sq, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x + w / 2 - 120, y + h - 70, 240, 16, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.roundRect(x + w / 2 - 118, y + h - 68, 236 * this.knead, 12, 6); ctx.fill();
      T(ctx, 'Frământă aluatul! (freacă cu degetul)', x + w / 2, y + h - 88, 14);
    } else if (this.step === 'shape') {
      ctx.fillStyle = '#f5e6c8'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(dx, dy, 46, 28, 0, 0, 7); ctx.fill(); ctx.stroke();
      T(ctx, 'Ce formă îi dai?', x + w / 2, this.shapeBtn(0).y - 18, 15);
      BREADS.forEach((b, k) => { const r = this.shapeBtn(k); btn(ctx, r, '#fff8ef'); drawBread(ctx, b.id, r.x + 36, r.y + r.h / 2, 0.42, 1); T(ctx, `${k + 1}. ${b.name}`, r.x + r.w * 0.62, r.y + r.h / 2, 14, O, 'center', r.w * 0.6); });
    } else {
      drawBread(ctx, this.shape || this.order, this.step === 'bake' ? ox : dx, this.step === 'bake' ? oy + h * 0.23 : dy, this.step === 'bake' ? 0.6 : 0.9, this.baked);
      if (this.step === 'bake') {
        const bx = x + w / 2 - 150, by = this.ovenBtn().y - 34, bw = 300;
        ctx.fillStyle = '#f5e6c8'; ctx.beginPath(); ctx.roundRect(bx, by, bw, 16, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(bx + bw * 0.65, by + 2, bw * 0.2, 12);
        const nx = bx + bw * ((this.baked - 0.25) / 1); ctx.fillStyle = O; ctx.beginPath(); ctx.moveTo(nx, by - 4); ctx.lineTo(nx - 6, by - 12); ctx.lineTo(nx + 6, by - 12); ctx.closePath(); ctx.fill();
        btn(ctx, this.ovenBtn(), '#ffd23f', 'Scoate din cuptor! 🧤', 16);
      }
    }
    this.hero.scale = Math.min(0.8, h / 700); this.hero.x = x + 70; this.hero.y = ty + 4; this.hero.draw(ctx);
  }
}

// ====================================================================== SPITALUL (asistent/a)
const CASES = [
  { sym: '🌡️', name: 'Febră', cure: '💊' }, { sym: '🩹', name: 'Zgârietură', cure: '🩹' }, { sym: '🤧', name: 'Tuse', cure: '🍵' },
  { sym: '😢', name: 'E speriat', cure: '💕' }, { sym: '🤕', name: 'Cucui', cure: '🧊' },
];
const CURES = ['💊', '🩹', '🍵', '💕', '🧊'];
export class NurseGame extends Panel {
  pat = 0; kind = 0; pat0 = 0; patience = 1; good = 0; bad = 0; left = 50; react = 0; reactOk = false; walkIn = 0;
  specs = ['bunny', 'cat', 'fox', 'dog', 'pig', 'granny'];
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🏥 Tura la spital', 'Alege tratamentul potrivit pentru fiecare pacient (1-5)'); this.next(); }
  next() { this.kind = Math.floor(Math.random() * CASES.length); this.pat = Math.floor(Math.random() * this.specs.length); this.patience = 1; this.walkIn = 0; }
  cureBtn(k: number): Box { const B = this.box, bw = (B.w - 40 - 4 * 10) / 5; return { x: B.x + 20 + k * (bw + 10), y: B.y + B.h - 104, w: bw, h: 70 }; }
  tick(dt: number) {
    this.left -= dt; this.react = Math.max(0, this.react - dt); this.walkIn = Math.min(1, this.walkIn + dt * 2.5);
    if (this.react <= 0) { this.patience -= dt / 7; if (this.patience <= 0) { this.bad++; Sfx.play('bad'); this.fx.text(this.box.x + this.box.w * 0.6, this.box.y + 120, 'A plecat supărat… 😞', '#e63946', 0.9); this.next(); } }
    if (this.left <= 0) this.end();
  }
  give(k: number) {
    if (this.react > 0 || this.ended) return;
    const ok = CURES[k] === CASES[this.kind].cure; this.reactOk = ok; this.react = 1.1;
    const B = this.box;
    if (ok) { this.good++; Sfx.play('good'); this.fx.hearts(B.x + B.w * 0.62, B.y + B.h * 0.3, 5); this.hero.play('dance_hop'); setTimeout(() => this.next(), 1000); }
    else { this.bad++; Sfx.play('bad'); this.fx.text(B.x + B.w * 0.62, B.y + 110, 'Nu asta îl doare… 😕', '#e63946', 0.9); this.hero.play('shy'); }
  }
  pointer(t: string, x: number, y: number) { if (t === 'down') for (let k = 0; k < 5; k++) if (inside(x, y, this.cureBtn(k))) this.give(k); }
  key(k: string, d: boolean) { if (d && k >= '1' && k <= '5') this.give(+k - 1); }
  end() { const total = this.good + this.bad; const perf = total ? (this.good / total) * Math.min(1.2, this.good / 8 + 0.2) : 0.3; this.finish(1 + this.good * 0.12, this.scene.finishJob(perf, `${this.good} pacienți vindecați`)); }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#eef8ff'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#d6eefc'; ctx.fillRect(x, y + h * 0.5, w, h * 0.5);
    // crucea spitalului pe perete
    ctx.fillStyle = '#e63946'; ctx.fillRect(x + w * 0.12 - 8, y + 60, 16, 46); ctx.fillRect(x + w * 0.12 - 23, y + 75, 46, 16);
    // patul pacientului
    const bx = x + w * 0.62, by = y + h * 0.5;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx - 110, by - 10, 220, 34, 8); ctx.fill(); ctx.stroke();
    const sp: CharSpec = NPC_SPECS[this.specs[this.pat]];
    const happy = this.react > 0 && this.reactOk;
    const P = pose({ eyes: happy ? 'happy' : this.react > 0 ? 'sad' : this.kind === 3 ? 'cry' : 'half', mouth: happy ? 'open' : 'wavy', brows: happy ? 'none' : 'sad', sweat: this.kind === 0 && !happy ? 0.8 : 0, tears: this.kind === 3 && !happy ? 0.8 : 0 });
    drawCharacter(ctx, sp, P, bx - 30 + (1 - this.walkIn) * 160, by - 6, Math.min(1.1, h / 520), -1, this.t);
    // balonul cu simptomul
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(bx + 30, y + 44, 120, 70, 16); ctx.fill(); ctx.stroke();
    icon(ctx, CASES[this.kind].sym, bx + 62, y + 79, 40); T(ctx, CASES[this.kind].name, bx + 118, y + 79, 13, O, 'center', 60);
    // rabdarea pacientului
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(bx - 90, by + 34, 180, 10, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.patience > 0.35 ? '#9be38f' : '#ff8c8c'; ctx.beginPath(); ctx.roundRect(bx - 89, by + 35, 178 * Math.max(0, this.patience), 8, 4); ctx.fill();
    T(ctx, `⏰ ${Math.ceil(Math.max(0, this.left))}s · ✅ ${this.good} · ❌ ${this.bad}`, x + w / 2, this.cureBtn(0).y - 18, 14);
    CURES.forEach((c, k) => { const r = this.cureBtn(k); btn(ctx, r, '#fff8ef'); icon(ctx, c, r.x + r.w / 2, r.y + r.h / 2 - 6, 36); T(ctx, String(k + 1), r.x + r.w / 2, r.y + r.h - 10, 12); });
    this.hero.scale = Math.min(0.8, h / 700); this.hero.x = x + 70; this.hero.y = by + 30; this.hero.draw(ctx);
  }
}

// ====================================================================== CURSURILE (examen)
export class CourseGame extends Panel {
  c: CourseDef; qs: CourseDef['questions']; i = 0; good = 0; answered = -1; wait = 0;
  constructor(s: WorldScene, d: (n: number) => void) {
    const c = COURSES[s.courseId ?? 'birou'];
    super(s, d, `🎓 ${c.name}`, 'Răspunde corect la cel puțin 3 din 4 întrebări');
    this.c = c; this.qs = [...c.questions].sort(() => Math.random() - 0.5).slice(0, 4);
  }
  tick(dt: number) { if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { this.answered = -1; this.i++; if (this.i >= this.qs.length) this.end(); } } }
  btn(k: number): Box { const B = this.box; const top = B.y + B.h * 0.4, bh = Math.min(60, (B.h * 0.5 - 30) / 3); return { x: B.x + 40, y: top + k * (bh + 10), w: B.w - 80, h: bh }; }
  pointer(t: string, x: number, y: number) { if (t !== 'down' || this.answered >= 0 || this.i >= this.qs.length) return; for (let k = 0; k < 3; k++) if (inside(x, y, this.btn(k))) this.answer(k); }
  key(k: string, d: boolean) { if (d && k >= '1' && k <= '3' && this.answered < 0) this.answer(+k - 1); }
  answer(k: number) { this.answered = k; this.wait = 1.2; if (k === this.qs[this.i].ok) { this.good++; Sfx.play('good'); this.hero.play('dance_hop'); } else { Sfx.play('bad'); this.hero.play('shy'); } }
  end() { const pass = this.good >= 3; this.finish(pass ? 2 : 0.4, this.scene.finishCourse(this.c.id, pass, this.good)); }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#f3ecff'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#2f3a5d'; ctx.strokeStyle = '#8a5d32'; ctx.lineWidth = 8; ctx.beginPath(); ctx.roundRect(x + 30, y + 46, w - 60, h * 0.3, 8); ctx.fill(); ctx.stroke();
    const q = this.qs[Math.min(this.i, this.qs.length - 1)];
    T(ctx, `Întrebarea ${Math.min(this.i + 1, this.qs.length)}/${this.qs.length} · ✅ ${this.good}`, x + w / 2, y + 64, 13, '#cfe0ff');
    T(ctx, q.q, x + w / 2, y + 46 + h * 0.17, 18, '#fff', 'center', w - 90);
    q.a.forEach((txt, k) => {
      const b = this.btn(k); const st = this.answered < 0 ? 'none' : k === q.ok ? 'ok' : k === this.answered ? 'bad' : 'none';
      btn(ctx, b, st === 'ok' ? '#c8f2c0' : st === 'bad' ? '#ffd0d0' : '#fff');
      T(ctx, `${k + 1}. ${txt}`, b.x + b.w / 2, b.y + b.h / 2, 15, O, 'center', b.w - 20);
    });
    this.hero.scale = Math.min(0.8, h / 700); this.hero.x = x + 52; this.hero.y = y + h - 26; this.hero.draw(ctx);
  }
}

// ====================================================================== INTERIORUL MAGAZINELOR
export interface ShopEntry { icon: string; name: string; price: number; note?: string; disabled?: boolean; badge?: string; buy: () => string | null }
export interface ShopConfig { title: string; wall: string; floor: string; keeper: string; hello: string; items: ShopEntry[]; sell?: boolean; footer?: string }
export class ShopScene extends Panel {
  cfg: ShopConfig; page = 0; sel = -1; msg = ''; msgT = 0; bought = 0;
  constructor(s: WorldScene, d: (n: number) => void) {
    const cfg = s.shopCfg!;
    super(s, d, cfg.title, cfg.footer ?? (cfg.sell ? 'Alege ce vinzi' : 'Alege un produs de pe raft, apoi Cumpără'));
    this.cfg = cfg;
  }
  get perPage() { return 8; }
  get pages() { return Math.max(1, Math.ceil(this.cfg.items.length / this.perPage)); }
  slot(i: number): Box { const B = this.box; const cols = 4, sw = (B.w - 60) / cols, sh = Math.min(96, (B.h * 0.53 - 72) / 2); const r = Math.floor(i / cols), c = i % cols; return { x: B.x + 30 + c * sw + 4, y: B.y + 70 + r * (sh + 8), w: sw - 8, h: sh }; }
  buyBtn(): Box { const B = this.box; return { x: B.x + B.w - 210, y: B.y + B.h - 84, w: 190, h: 50 }; }
  pgBtn(d: -1 | 1): Box { const B = this.box; return { x: d < 0 ? B.x + 20 : B.x + 72, y: B.y + B.h - 84, w: 44, h: 44 }; }
  tick(dt: number) { this.msgT = Math.max(0, this.msgT - dt); }
  pointer(t: string, x: number, y: number) {
    if (t !== 'down' || this.ended) return;
    const base = this.page * this.perPage;
    for (let i = 0; i < this.perPage; i++) { const it = this.cfg.items[base + i]; if (it && inside(x, y, this.slot(i))) { this.sel = base + i; Sfx.play('click'); return; } }
    if (this.pages > 1 && inside(x, y, this.pgBtn(-1))) { this.page = (this.page + this.pages - 1) % this.pages; this.sel = -1; }
    if (this.pages > 1 && inside(x, y, this.pgBtn(1))) { this.page = (this.page + 1) % this.pages; this.sel = -1; }
    if (inside(x, y, this.buyBtn())) this.doBuy();
  }
  key(k: string, d: boolean) {
    if (!d) return;
    if (k >= '1' && k <= '8') { const i = this.page * this.perPage + (+k - 1); if (this.cfg.items[i]) this.sel = i; }
    if (k === 'enter' || k === ' ') this.doBuy();
    if (k === 'arrowright') this.page = (this.page + 1) % this.pages; if (k === 'arrowleft') this.page = (this.page + this.pages - 1) % this.pages;
  }
  doBuy() {
    const it = this.cfg.items[this.sel]; if (!it) return;
    const err = it.buy();
    if (err) { this.msg = err; this.msgT = 2.2; Sfx.play('bad'); this.keeperMood = 'sad'; return; }
    this.bought++; Sfx.play('coin'); this.keeperMood = 'love';
    const s = this.slot(this.sel - this.page * this.perPage);
    this.fx.text(s.x + s.w / 2, s.y, this.cfg.sell ? `+${it.price} lei` : `-${it.price} lei`, this.cfg.sell ? '#2a9a4a' : '#c0573e', 0.9);
    this.fx.hearts(s.x + s.w / 2, s.y + 10, 2);
  }
  keeperMood: 'ok' | 'love' | 'sad' = 'ok';
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    // peretele din spate + podeaua
    ctx.fillStyle = this.cfg.wall; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = this.cfg.floor; ctx.fillRect(x, y + h * 0.8, w, h * 0.2);
    ctx.fillStyle = '#ffffff55'; for (let i = 0; i < 10; i++) ctx.fillRect(x + i * w / 10, y, 3, h * 0.8);
    // rafturile
    const base = this.page * this.perPage;
    for (let r = 0; r < 2; r++) { const s0 = this.slot(r * 4); ctx.fillStyle = '#b07a4a'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + 22, s0.y + s0.h - 4, w - 44, 10, 3); ctx.fill(); ctx.stroke(); }
    for (let i = 0; i < this.perPage; i++) {
      const it = this.cfg.items[base + i]; if (!it) continue;
      const s = this.slot(i), on = this.sel === base + i;
      if (on) { ctx.fillStyle = '#fff6'; ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(s.x, s.y, s.w, s.h, 12); ctx.fill(); ctx.stroke(); }
      ctx.globalAlpha = it.disabled ? 0.4 : 1;
      const bob = on ? Math.sin(this.t * 6) * 2 : 0;
      const isz = Math.min(54, s.h * 0.56); icon(ctx, it.icon, s.x + s.w / 2, s.y + s.h * 0.4 + bob, isz);
      if (it.badge) { ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x + s.w / 2 + isz * 0.38, s.y + s.h * 0.4 + isz * 0.3, isz * 0.24, 0, 7); ctx.fill(); ctx.stroke(); icon(ctx, it.badge, s.x + s.w / 2 + isz * 0.38, s.y + s.h * 0.4 + isz * 0.3, isz * 0.36); }
      // eticheta cu pretul
      ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(s.x + s.w / 2 - 34, s.y + s.h - 26, 68, 20, 6); ctx.fill(); ctx.stroke();
      T(ctx, `${this.cfg.sell ? '+' : ''}${it.price} lei`, s.x + s.w / 2, s.y + s.h - 16, 12, this.cfg.sell ? '#2a9a4a' : '#c0573e', 'center', 64);
      ctx.globalAlpha = 1;
      T(ctx, String(i + 1), s.x + 12, s.y + 12, 11, '#0006');
    }
    // tejgheaua cu vanzatorul
    const cy = y + h * 0.8;
    const keeper = NPC_SPECS[this.cfg.keeper] ?? NPC_SPECS.bunny;
    const P = pose({ eyes: this.keeperMood === 'love' ? 'happy' : this.keeperMood === 'sad' ? 'sad' : 'dot', mouth: this.keeperMood === 'sad' ? 'frown' : 'open', armR: this.keeperMood === 'love' ? 1.8 : 0.55, blush: 1 });
    drawCharacter(ctx, keeper, P, x + w * 0.5, cy + 6, Math.min(0.9, h / 760), 1, this.t);
    ctx.fillStyle = '#8a5d32'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + w * 0.3, cy - 14, w * 0.4, 30, 6); ctx.fill(); ctx.stroke();
    // balonul vanzatorului
    const say = this.msgT > 0 ? this.msg : this.sel >= 0 ? `${this.cfg.items[this.sel].name}${this.cfg.items[this.sel].note ? ' · ' + this.cfg.items[this.sel].note : ''}` : this.cfg.hello;
    ctx.font = '800 13px "Baloo 2", sans-serif'; const tw = Math.min(w * 0.6, ctx.measureText(say).width + 28);
    const sbx = x + w * 0.5 - tw / 2, sby = Math.max(this.slot(7).y + this.slot(7).h + 6, cy - Math.min(0.9, h / 760) * 150 - 34);
    ctx.fillStyle = this.msgT > 0 ? '#ffe1e1' : '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(sbx, sby, tw, 28, 10); ctx.fill(); ctx.stroke();
    T(ctx, say, x + w * 0.5, sby + 14, 13, O, 'center', tw - 16);
    // portofelul
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x + w - 150, y + 36, 130, 28, 10); ctx.fill(); ctx.stroke();
    T(ctx, `💰 ${this.scene.w.money ?? 0} lei`, x + w - 85, y + 50, 14);
    // butoane
    const it = this.cfg.items[this.sel];
    btn(ctx, this.buyBtn(), this.cfg.sell ? '#9be38f' : '#ffd23f', it ? (this.cfg.sell ? `Vinde · +${it.price} lei` : `Cumpără · ${it.price} lei`) : (this.cfg.sell ? 'Alege ce vinzi' : 'Alege un produs'), 14, !!it && !it.disabled);
    if (this.pages > 1) { btn(ctx, this.pgBtn(-1), '#fff', '◀', 16); btn(ctx, this.pgBtn(1), '#fff', '▶', 16); T(ctx, `${this.page + 1}/${this.pages}`, x + 140, this.buyBtn().y + 22, 13); }
    this.hero.scale = Math.min(0.75, h / 720); this.hero.x = x + w * 0.2; this.hero.y = cy + 4; this.hero.flip = 1; this.hero.draw(ctx);
  }
  // inchiderea nu e un esec: iesi din magazin
  abort() { if (!this.ended) this.finish(this.bought ? 1 : 0.01, this.bought ? 'Mulțumim! Mai treceți! 🛍️' : 'La revedere! 👋'); this.ended!.t = 1.6; }
}
