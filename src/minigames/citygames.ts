// Minijocurile din oras: barista la cafenea (job), birou (job), cinema (intalnire), restaurant (cina romantica).
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';
import { drawCharacter, heartPath, NPC_SPECS } from '../char/draw';
import { basePose, type Pose } from '../char/pose';
import { iconCanvas } from '../ui/icons';
import { g } from '../game/gender';

const O = '#4a2a22';
const inside = (x: number, y: number, b: { x: number; y: number; w: number; h: number }) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
function btn(ctx: CanvasRenderingContext2D, b: { x: number; y: number; w: number; h: number }, fill: string, label = '', sz = 15) {
  ctx.fillStyle = fill; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 14); ctx.fill(); ctx.stroke();
  if (label) { ctx.font = `800 ${sz}px "Baloo 2", sans-serif`; ctx.fillStyle = O; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1); ctx.textBaseline = 'alphabetic'; }
}
const pose = (o: Partial<Pose>) => Object.assign(basePose(), o);

// ====================================================================== CAFENEAUA (barista)
type Ing = 'espresso' | 'milk' | 'foam' | 'choco' | 'caramel' | 'ice';
const ING: Record<Ing, { col: string; label: string }> = {
  espresso: { col: '#6b3a22', label: 'Espresso' }, milk: { col: '#fff8ef', label: 'Lapte' }, foam: { col: '#f6e7d3', label: 'Spumă' },
  choco: { col: '#4a2a1a', label: 'Ciocolată' }, caramel: { col: '#e8a040', label: 'Caramel' }, ice: { col: '#cfeeff', label: 'Gheață' },
};
const DRINKS: { name: string; rec: Ing[] }[] = [
  { name: 'Espresso', rec: ['espresso'] },
  { name: 'Cappuccino', rec: ['espresso', 'milk', 'foam'] },
  { name: 'Latte', rec: ['espresso', 'milk', 'milk'] },
  { name: 'Mocha', rec: ['espresso', 'choco', 'milk'] },
  { name: 'Caramel latte', rec: ['espresso', 'milk', 'caramel'] },
  { name: 'Frappe', rec: ['ice', 'espresso', 'milk', 'foam'] },
  { name: 'Ciocolată caldă', rec: ['choco', 'milk', 'foam'] },
];
const CUST = ['bunny', 'cat', 'fox', 'dog', 'pig', 'granny'];

function drawCup(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, layers: Ing[], max = 4) {
  // cana transparenta cu straturi
  const W = 46 * s, H = 64 * s;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x - W / 2, y - H); ctx.lineTo(x + W / 2, y - H); ctx.lineTo(x + W * 0.38, y); ctx.lineTo(x - W * 0.38, y); ctx.closePath();
  ctx.fillStyle = 'rgba(230,245,255,.55)'; ctx.fill();
  ctx.save(); ctx.clip();
  const lh = H / max;
  layers.forEach((l, i) => { ctx.fillStyle = ING[l].col; ctx.fillRect(x - W, y - (i + 1) * lh, W * 2, lh + 1); if (l === 'ice') { ctx.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { ctx.fillRect(x - W * 0.3 + k * W * 0.22, y - (i + 1) * lh + 4 * s, 8 * s, 8 * s); } } if (l === 'foam') { ctx.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x - W * 0.4 + k * W * 0.2, y - (i + 1) * lh, 5 * s, 0, 7); ctx.fill(); } } });
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(x - W / 2, y - H); ctx.lineTo(x + W / 2, y - H); ctx.lineTo(x + W * 0.38, y); ctx.lineTo(x - W * 0.38, y); ctx.closePath();
  ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + W * 0.5, y - H * 0.55, 9 * s, 13 * s, 0, -1.4, 1.4); ctx.stroke();
  ctx.restore();
}

export class CafeGame extends Panel {
  order = DRINKS[0]; cup: Ing[] = []; served = 0; good = 0; tips = 0; left = 60; react = 0; reactOk = false; cust = 0; custT = 0;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '☕ Tura de barista', 'Fă băutura din comandă, în ordine, apoi Servește'); this.next(); }
  next() { this.order = DRINKS[Math.min(DRINKS.length - 1, Math.floor(Math.random() * (3 + Math.min(4, this.served))))]; this.cup = []; this.cust = Math.floor(Math.random() * CUST.length); this.custT = 0; }
  tick(dt: number) {
    this.left -= dt; this.react = Math.max(0, this.react - dt); this.custT += dt;
    if (this.left <= 0) this.end();
  }
  end() {
    const s = this.scene; const pay = this.good * 9 + this.tips;
    s.op({ k: 'money', delta: pay }); s.op({ k: 'stat', key: 'cafeShifts', delta: 1 }); s.op({ k: 'stat', key: 'cityEarned', delta: pay });
    s.op({ k: 'need', who: s.myId, need: 'energy', delta: -12 }); s.op({ k: 'need', who: s.myId, need: 'fun', delta: 6 });
    s.log(`${s.me.actor.spec.name} a lucrat o tură la cafenea: ${this.good} cafele perfecte, +${pay} lei ☕`);
    this.finish(this.good ? 1 + this.good * 0.15 : 0.3, `${this.good} clienți fericiți · +${pay} lei`);
  }
  ingBtn(i: number) { const B = this.box; const bw = (B.w - 60) / 3; return { x: B.x + 20 + (i % 3) * (bw + 10), y: B.y + B.h - 190 + Math.floor(i / 3) * 62, w: bw, h: 54 }; }
  serveBtn() { const B = this.box; return { x: B.x + B.w - 150, y: B.y + B.h * 0.42, w: 130, h: 46 }; }
  trashBtn() { const B = this.box; return { x: B.x + B.w - 150, y: B.y + B.h * 0.42 + 54, w: 130, h: 36 }; }
  pointer(t: string, x: number, y: number) {
    if (t !== 'down' || this.ended) return;
    (Object.keys(ING) as Ing[]).forEach((k, i) => { if (inside(x, y, this.ingBtn(i)) && this.cup.length < 4) { this.cup.push(k); Sfx.play('pop'); } });
    if (inside(x, y, this.trashBtn())) { this.cup = []; Sfx.play('click'); }
    if (inside(x, y, this.serveBtn()) && this.cup.length) this.serve();
  }
  key(k: string, d: boolean) { if (!d) return; const i = +k - 1; if (i >= 0 && i < 6 && this.cup.length < 4) { this.cup.push((Object.keys(ING) as Ing[])[i]); Sfx.play('pop'); } if (k === 'enter' || k === ' ') this.serve(); if (k === 'backspace') this.cup = []; }
  serve() {
    const ok = this.cup.length === this.order.rec.length && this.cup.every((c, i) => c === this.order.rec[i]);
    this.served++; this.reactOk = ok; this.react = 1.2;
    const B = this.box;
    if (ok) { this.good++; const tip = this.custT < 6 ? 3 : this.custT < 10 ? 1 : 0; this.tips += tip; Sfx.play('coin'); this.fx.hearts(B.x + B.w * 0.3, B.y + 150, 4); this.fx.text(B.x + B.w * 0.3, B.y + 120, tip ? `+9 lei +${tip} bacșiș 💰` : '+9 lei 💰', '#2a9a4a', 0.9); this.hero.play('dance_hop'); }
    else { Sfx.play('bad'); this.fx.text(B.x + B.w * 0.3, B.y + 120, 'Nu asta am cerut… 😕', '#e63946', 0.9); this.hero.play('shy'); }
    this.next();
  }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    // perete cu tabla de meniu
    ctx.fillStyle = '#f5e1c8'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#c98e5f'; ctx.fillRect(x, y + h * 0.5, w, h * 0.5);
    ctx.fillStyle = '#2f3a36'; ctx.strokeStyle = '#8a5d32'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(x + 20, y + 40, w * 0.5, 120, 8); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left'; ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText(`Comanda: ${this.order.name}`, x + 34, y + 62);
    this.order.rec.forEach((r, i) => { ctx.fillStyle = ING[r].col; ctx.beginPath(); ctx.arc(x + 44, y + 82 + i * 18, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(`${i + 1}. ${ING[r].label}`, x + 56, y + 87 + i * 18); });
    ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'right'; ctx.fillText(`⏰ ${Math.ceil(Math.max(0, this.left))}s  ·  ✅ ${this.good}`, x + 20 + w * 0.5 - 10, y + 62);
    // clientul la tejghea
    const cs = NPC_SPECS[CUST[this.cust]];
    if (cs) { const bob = Math.sin(this.t * 3) * 2; const P = pose({ eyes: this.react > 0 ? (this.reactOk ? 'happy' : 'sad') : 'dot', mouth: this.react > 0 ? (this.reactOk ? 'open' : 'frown') : this.custT > 10 ? 'flat' : 'smile', armR: this.react > 0 && this.reactOk ? 2 : 0.55 }); drawCharacter(ctx, cs, P, x + w * 0.72, y + h * 0.5 - 6 + bob, 1.1, -1, this.t); }
    // bula cu bautura dorita
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x + w * 0.58, y + 36, 70, 74, 14); ctx.fill(); ctx.stroke();
    drawCup(ctx, x + w * 0.58 + 35, y + 100, 0.85, this.order.rec);
    // tejgheaua
    ctx.fillStyle = '#8a5d32'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - 4, y + h * 0.5, w + 8, 26, 4); ctx.fill(); ctx.stroke();
    // cana ta
    drawCup(ctx, x + w * 0.36, y + h * 0.5 + 100, 1.3, this.cup);
    // espressorul
    ctx.fillStyle = '#c9ccd6'; ctx.beginPath(); ctx.roundRect(x + 24, y + h * 0.5 + 34, 90, 80, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.roundRect(x + 50, y + h * 0.5 + 60, 38, 14, 4); ctx.fill(); ctx.stroke();
    if (this.cup.length) for (let i = 0; i < 3; i++) { const k = (this.t * 1.4 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + w * 0.36 + Math.sin(k * 6 + i) * 8, y + h * 0.5 + 10 - k * 40, 6 + k * 6, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    // butoane ingrediente
    (Object.keys(ING) as Ing[]).forEach((k, i) => { const b = this.ingBtn(i); btn(ctx, b, '#fff8ef'); ctx.fillStyle = ING[k].col; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x + 24, b.y + b.h / 2, 13, 0, 7); ctx.fill(); ctx.stroke(); ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(`${i + 1} ${ING[k].label}`, b.x + 44, b.y + b.h / 2 + 1); ctx.textBaseline = 'alphabetic'; });
    btn(ctx, this.serveBtn(), '#9be38f', 'Servește ☕', 16); btn(ctx, this.trashBtn(), '#ffd0d0', 'Golește', 13);
    // barista (tu)
    this.hero.scale = 0.85; this.hero.x = x + w * 0.47; this.hero.y = y + h * 0.5 + 4; this.hero.flip = 1; this.hero.draw(ctx);
  }
}

// ====================================================================== BIROUL (sortat dosare)
const FOLDERS = [{ col: '#ff7aa2', label: 'Facturi' }, { col: '#7ab8ff', label: 'Contracte' }, { col: '#ffd23f', label: 'Rapoarte' }];
export class OfficeGame extends Panel {
  docs: { c: number; x: number; y: number; vy: number }[] = []; spawn = 0; good = 0; bad = 0; left = 45; coffee = 0;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '💼 O zi la birou', 'Pune fiecare dosar în sertarul de aceeași culoare (1-2-3)'); }
  tick(dt: number) {
    this.left -= dt; this.spawn -= dt; this.coffee += dt;
    const sp = 1.6 - Math.min(0.9, (45 - this.left) / 50);
    if (this.spawn <= 0) { this.spawn = sp; this.docs.push({ c: Math.floor(Math.random() * 3), x: 0.5, y: 0, vy: 0.12 + (45 - this.left) / 300 }); }
    for (const d of this.docs) d.y += d.vy * dt;
    const lost = this.docs.filter(d => d.y > 1); if (lost.length) { this.bad += lost.length; Sfx.play('bad'); }
    this.docs = this.docs.filter(d => d.y <= 1);
    if (this.left <= 0) this.end();
  }
  end() {
    const s = this.scene; const pay = Math.max(0, this.good * 6 - this.bad * 2);
    s.op({ k: 'money', delta: pay }); s.op({ k: 'stat', key: 'officeShifts', delta: 1 }); s.op({ k: 'stat', key: 'cityEarned', delta: pay });
    s.op({ k: 'need', who: s.myId, need: 'energy', delta: -14 }); s.op({ k: 'need', who: s.myId, need: 'fun', delta: -4 });
    s.log(`${s.me.actor.spec.name} a muncit la birou: ${this.good} dosare puse la locul lor, +${pay} lei 💼`);
    this.finish(this.good ? 1 + this.good * 0.08 : 0.3, `${this.good} dosare · +${pay} lei`);
  }
  drawer(i: number) { const B = this.box; const bw = (B.w - 80) / 3; return { x: B.x + 20 + i * (bw + 20), y: B.y + B.h - 130, w: bw, h: 80 }; }
  put(i: number) {
    const d = this.docs[0]; if (!d) return;
    this.docs.shift();
    const dr = this.drawer(i);
    if (d.c === i) { this.good++; Sfx.play('good'); this.fx.text(dr.x + dr.w / 2, dr.y - 10, '+6 lei', '#2a9a4a', 0.8); this.hero.play('dance_hop'); }
    else { this.bad++; Sfx.play('bad'); this.fx.text(dr.x + dr.w / 2, dr.y - 10, 'Greșit! 📄', '#e63946', 0.8); this.hero.play('shy'); }
  }
  pointer(t: string, x: number, y: number) { if (t !== 'down' || this.ended) return; for (let i = 0; i < 3; i++) if (inside(x, y, this.drawer(i))) this.put(i); }
  key(k: string, d: boolean) { if (d && k >= '1' && k <= '3') this.put(+k - 1); }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#e8f1ff'; ctx.fillRect(x, y, w, h);
    // fereastra cu orasul
    ctx.fillStyle = '#bfe8ff'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x + 30, y + 40, w - 60, 130, 8); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 9; i++) { const bx = x + 40 + i * (w - 80) / 9, bh = 40 + ((i * 37) % 60); ctx.fillStyle = ['#9aa8c8', '#b8c4e0', '#c9d4ea'][i % 3]; ctx.fillRect(bx, y + 170 - bh, (w - 80) / 9 - 4, bh); }
    ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x + 30, y + 40, w - 60, 130, 8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + w / 2, y + 40); ctx.lineTo(x + w / 2, y + 170); ctx.stroke();
    ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.textAlign = 'center'; ctx.fillText(`⏰ ${Math.ceil(Math.max(0, this.left))}s · ✅ ${this.good} · ❌ ${this.bad}`, x + w / 2, y + 192);
    // banda cu dosare
    const top = y + 205, bot = y + h - 150;
    ctx.fillStyle = '#d6d0c8'; ctx.fillRect(x + w / 2 - 50, top, 100, bot - top);
    for (const d of this.docs) { const dy = top + d.y * (bot - top); ctx.save(); ctx.translate(x + w / 2, dy); ctx.rotate(Math.sin(d.y * 20) * 0.06); ctx.fillStyle = FOLDERS[d.c].col; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-34, -22, 68, 44, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-24, -12, 48, 6); ctx.fillRect(-24, -2, 36, 6); ctx.restore(); }
    if (this.docs[0]) { const dy = top + this.docs[0].y * (bot - top); ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.roundRect(x + w / 2 - 40, dy - 28, 80, 56, 8); ctx.stroke(); ctx.setLineDash([]); }
    // sertarele
    for (let i = 0; i < 3; i++) { const b = this.drawer(i); btn(ctx, b, FOLDERS[i].col); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(b.x + b.w / 2 - 20, b.y + 14, 40, 8, 4); ctx.fill(); ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.textAlign = 'center'; ctx.fillText(`${i + 1}. ${FOLDERS[i].label}`, b.x + b.w / 2, b.y + 52); }
    this.hero.scale = 0.8; this.hero.x = x + 70; this.hero.y = y + h - 150; this.hero.draw(ctx);
    // cana de cafea pe birou
    const cv = iconCanvas('🧋', 64); if (cv) ctx.drawImage(cv, x + w - 90, y + h - 200, 48, 48);
  }
}

// ====================================================================== CINEMA
export class CinemaGame extends Panel {
  k = 0; pops: { x: number; y: number; vx: number; vy: number }[] = []; caught = 0; holdT = 0; held = false; holding = false; romance = false; popT = 0;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🎬 La film', 'Prinde floricelele 🍿 · Când apare inima, ține apăsat (mână în mână)'); }
  tick(dt: number) {
    this.k = Math.min(1, this.k + dt / 32);
    this.romance = this.k > 0.55 && this.k < 0.78;
    this.popT -= dt;
    const B = this.box;
    if (this.popT <= 0 && !this.romance) { this.popT = 0.7 + Math.random() * 0.6; this.pops.push({ x: B.x + B.w * 0.68, y: B.y + B.h - 140, vx: -(60 + Math.random() * 120), vy: -(260 + Math.random() * 120) }); }
    for (const p of this.pops) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; }
    this.pops = this.pops.filter(p => p.y < B.y + B.h);
    if (this.romance && this.holding && !this.held) { this.holdT += dt; if (this.holdT > 1.4) { this.held = true; Sfx.play('kiss'); this.fx.hearts(B.x + B.w / 2, B.y + B.h - 120, 12); } }
    if (this.k >= 1) {
      const s = this.scene; const love = 15 + (this.held ? 20 : 0), fun = 20 + this.caught * 2;
      s.op({ k: 'need', who: s.myId, need: 'love', delta: love }); s.op({ k: 'need', who: s.myId, need: 'fun', delta: fun }); s.op({ k: 'need', who: s.myId, need: 'hunger', delta: this.caught });
      if (s.sameArea()) { s.op({ k: 'need', who: s.partner.id, need: 'love', delta: love }); s.op({ k: 'need', who: s.partner.id, need: 'fun', delta: fun }); }
      s.op({ k: 'stat', key: 'cinema', delta: 1 });
      s.log(this.held ? 'Un film romantic, mână în mână 🎬💕' : 'O seară la cinema 🎬');
      this.finish(this.held ? 2 : 1, this.held ? 'Mână în mână 💕 · cel mai frumos film' : `Ce film! 🍿 ${this.caught} floricele`);
    }
  }
  pointer(t: string, x: number, y: number) {
    if (t === 'down') this.holding = true; if (t === 'up') this.holding = false;
    if (t !== 'down' || this.romance) return;
    const i = this.pops.findIndex(p => Math.hypot(p.x - x, p.y - y) < 36);
    if (i >= 0) { const p = this.pops[i]; this.pops.splice(i, 1); this.caught++; Sfx.play('pop'); this.fx.text(p.x, p.y, 'Hap! 🍿', '#ff8c42', 0.7); this.hero.play('dance_hop'); }
  }
  key(k: string, d: boolean) { if (k === ' ' || k === 'e') { this.holding = d; if (d && !this.romance && this.pops.length) { const p = this.pops[0]; this.pops.shift(); this.caught++; Sfx.play('pop'); this.fx.text(p.x, p.y, 'Hap! 🍿', '#ff8c42', 0.7); } } }
  /** filmul de pe ecran: povestea unui soare si a unei lune care se intalnesc */
  movie(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const k = this.k;
    const sky = ctx.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, k < 0.5 ? '#7cc8f5' : '#ff9a8b'); sky.addColorStop(1, k < 0.5 ? '#fff1d6' : '#5a4a8a'); ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#9fd68c'; ctx.beginPath(); ctx.moveTo(x, y + h); for (let i = 0; i <= 10; i++) ctx.lineTo(x + i * w / 10, y + h * 0.78 - Math.sin(i * 1.3) * 10); ctx.lineTo(x + w, y + h); ctx.fill();
    const meet = Math.min(1, k / 0.6);
    const sx = x + w * (0.15 + meet * 0.27), mx = x + w * (0.85 - meet * 0.27), cy = y + h * 0.42 + Math.sin(this.t * 2) * 4;
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx, cy, 22, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(mx, cy, 20, 0, 7); ctx.fill(); ctx.stroke();
    for (const [px, f] of [[sx, 1], [mx, -1]] as const) { ctx.fillStyle = O; ctx.beginPath(); ctx.arc(px - 6 + f * 2, cy - 3, 2.5, 0, 7); ctx.arc(px + 6 + f * 2, cy - 3, 2.5, 0, 7); ctx.fill(); ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.arc(px - 11, cy + 5, 4, 0, 7); ctx.arc(px + 11, cy + 5, 4, 0, 7); ctx.fill(); }
    if (this.romance || k > 0.78) { const hy = cy - 40 - (k - 0.55) * 60; heartPath(ctx, x + w / 2, hy, 16 + Math.sin(this.t * 6) * 2); ctx.fillStyle = '#ff4d6d'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke(); }
    if (k > 0.85) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x, y + h - 26, w, 26); ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('SFÂRȘIT 💕', x + w / 2, y + h - 8); }
  }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#1d1530'; ctx.fillRect(x, y, w, h);
    // ecranul
    const sw = w - 70, sh = h * 0.42;
    ctx.save(); ctx.beginPath(); ctx.rect(x + 35, y + 40, sw, sh); ctx.clip(); this.movie(ctx, x + 35, y + 40, sw, sh); ctx.restore();
    ctx.strokeStyle = '#8a7ad6'; ctx.lineWidth = 5; ctx.strokeRect(x + 35, y + 40, sw, sh);
    // lumina proiectorului
    const gr = ctx.createLinearGradient(0, y + 40 + sh, 0, y + h); gr.addColorStop(0, 'rgba(255,255,220,.08)'); gr.addColorStop(1, 'rgba(255,255,220,0)'); ctx.fillStyle = gr; ctx.fillRect(x, y + 40 + sh, w, h);
    // scaunele + cei doi din spate (fata spre ecran)
    const me = this.scene.me.actor.spec, pa = this.scene.partner.actor.spec;
    const lean = this.held ? 1 : this.romance && this.holding ? Math.min(1, this.holdT / 1.4) : 0;
    const by = y + h - 70;
    for (const [spec, dx] of [[me, -60], [pa, 60]] as const) {
      const P = pose({ back: true, rot: lean * 0.12 * (dx < 0 ? 1 : -1), armR: dx < 0 ? 0.55 + lean * 0.8 : 0.55, armL: dx > 0 ? 0.55 + lean * 0.8 : 0.55 });
      drawCharacter(ctx, spec, P, x + w / 2 + dx - lean * 8 * Math.sign(dx), by, 1.25, 1, this.t);
    }
    ctx.fillStyle = '#c0304a'; ctx.strokeStyle = O; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.roundRect(x + 16 + i * (w - 32) / 4, y + h - 64, (w - 32) / 4 - 8, 70, 12); ctx.fill(); ctx.stroke(); }
    if (this.held) { heartPath(ctx, x + w / 2, y + h - 110, 10); ctx.fillStyle = '#ff4d6d'; ctx.fill(); }
    // galeata de floricele
    const bx = x + w * 0.72, byy = y + h - 120;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx - 18, byy - 30); ctx.lineTo(bx + 18, byy - 30); ctx.lineTo(bx + 13, byy + 10); ctx.lineTo(bx - 13, byy + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e63946'; for (let i = 0; i < 3; i++) ctx.fillRect(bx - 14 + i * 11, byy - 28, 5, 36);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(bx - 14 + i * 6, byy - 32 - (i % 2) * 4, 5, 0, 7); ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1; ctx.stroke(); }
    for (const p of this.pops) { ctx.fillStyle = '#fff3b0'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; for (const [dx, dy] of [[0, 0], [5, -3], [-4, -4]]) { ctx.beginPath(); ctx.arc(p.x + dx, p.y + dy, 6, 0, 7); ctx.fill(); ctx.stroke(); } }
    ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(this.romance ? (this.held ? 'Mână în mână 💕' : 'Acum! Ține apăsat ❤️') : `🍿 ${this.caught}`, x + w / 2, y + 30 + sh + 34);
  }
}

// ====================================================================== RESTAURANTUL (cina romantica)
const COURSES: { name: string; opts: string[] }[] = [
  { name: 'Felul întâi', opts: ['🍲', '🥗', '🍄'] },
  { name: 'Felul principal', opts: ['🍕', '🐟', '🍔'] },
  { name: 'Desertul', opts: ['🍰', '🍓', '🍫'] },
];
const DISH_NAMES: Record<string, string> = { '🍲': 'Supă cremă', '🥗': 'Salată cu ierburi', '🍄': 'Ciuperci la grătar', '🍕': 'Pizza cu inimioare', '🐟': 'Pește la cuptor', '🍔': 'Burger gurmand', '🍰': 'Tort cu frișcă', '🍓': 'Căpșuni cu ciocolată', '🍫': 'Fondant de ciocolată' };
export class RestoGame extends Panel {
  i = 0; wants: number[] = COURSES.map(() => Math.floor(Math.random() * 3)); picked: number[] = []; wait = 0; toast = false; toastK = 0; toastHit = false; candle = 0;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🕯️ Cină romantică', `Ghicește ce-și dorește ${s.partner.actor.spec.name} (uită-te la gândul ${g(s.partner.id, 'lui', 'ei')})`); }
  get pa() { return this.scene.partner; }
  tick(dt: number) {
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { this.i++; if (this.i >= COURSES.length) this.toast = true; } }
    if (this.toast && !this.toastHit) { this.toastK += dt; if (this.toastK > 4) this.end(); }
  }
  opt(k: number) { const B = this.box; const bw = (B.w - 80) / 3; return { x: B.x + 20 + k * (bw + 20), y: B.y + B.h - 150, w: bw, h: 100 }; }
  toastBtn() { const B = this.box; return { x: B.x + B.w / 2 - 110, y: B.y + B.h - 130, w: 220, h: 64 }; }
  pick(k: number) {
    if (this.wait > 0 || this.i >= COURSES.length) return;
    this.picked.push(k); this.wait = 1.4;
    const ok = k === this.wants[this.i];
    const B = this.box;
    if (ok) { Sfx.play('kiss'); this.fx.hearts(B.x + B.w * 0.7, B.y + 170, 6); this.fx.text(B.x + B.w * 0.7, B.y + 140, 'Exact ce voiam! 💕', '#ff4d6d', 0.9); }
    else { Sfx.play('pop'); this.fx.text(B.x + B.w * 0.7, B.y + 140, 'Mmm… e bun și ăsta 🙂', '#7a5a4a', 0.85); }
  }
  pointer(t: string, x: number, y: number) {
    if (t !== 'down' || this.ended) return;
    if (this.toast) { if (inside(x, y, this.toastBtn())) this.clink(); return; }
    for (let k = 0; k < 3; k++) if (inside(x, y, this.opt(k))) this.pick(k);
  }
  key(k: string, d: boolean) { if (!d) return; if (this.toast && (k === ' ' || k === 'enter')) this.clink(); else if (k >= '1' && k <= '3') this.pick(+k - 1); }
  clink() {
    if (this.toastHit) return;
    const ph = (this.toastK * 0.9) % 1; const ok = ph > 0.42 && ph < 0.58;
    this.toastHit = true; Sfx.play(ok ? 'good' : 'pop');
    if (ok) this.fx.hearts(this.box.x + this.box.w / 2, this.box.y + this.box.h * 0.42, 14);
    this.end(ok);
  }
  end(clinked = false) {
    const s = this.scene; const right = this.picked.filter((p, i) => p === this.wants[i]).length;
    const elegant = ['rochie', 'costum'].includes((s.w.chars[s.myId].outfit as any)?.body ?? '');
    const love = 18 + right * 8 + (clinked ? 10 : 0) + (elegant ? 10 : 0);
    s.op({ k: 'need', who: s.myId, need: 'hunger', delta: 60 }); s.op({ k: 'need', who: s.myId, need: 'love', delta: love }); s.op({ k: 'need', who: s.myId, need: 'fun', delta: 12 });
    if (s.sameArea()) { s.op({ k: 'need', who: s.partner.id, need: 'hunger', delta: 60 }); s.op({ k: 'need', who: s.partner.id, need: 'love', delta: love }); }
    s.op({ k: 'stat', key: 'restoDates', delta: 1 });
    s.log(`Cină romantică la „La Doi” 🕯️ ${right}/3 feluri ghicite${elegant ? ', în haine elegante' : ''}`);
    this.finish(1 + right * 0.4, right === 3 ? `Vă cunoașteți perfect! 💕 3/3` : `${right}/3 ghicite · o seară dulce 🕯️`);
  }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const bg = ctx.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#4a2a3a'); bg.addColorStop(1, '#7a3a4a'); ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    // ghirlanda de luminite
    for (let i = 0; i < 14; i++) { const lx = x + 10 + i * (w - 20) / 13, ly = y + 50 + Math.sin(i / 13 * Math.PI) * 26; const on = (Math.floor(this.t * 2) + i) % 3 !== 0; ctx.fillStyle = on ? '#ffe680' : '#a08a40'; ctx.beginPath(); ctx.arc(lx, ly, 4, 0, 7); ctx.fill(); }
    const me = this.scene.me, pa = this.pa;
    const ty = y + h * 0.5;
    // personajele la masa
    for (const [p, dx, flip] of [[me, -110, 1], [pa, 110, -1]] as const) {
      const happy = this.picked.length && this.picked[this.picked.length - 1] === this.wants[this.picked.length - 1] && this.wait > 0;
      const P = pose({ eyes: p === pa && happy ? 'heart' : 'happy', mouth: 'open', blush: 1.2, armR: this.toast ? 1.6 : 0.6 });
      drawCharacter(ctx, p.actor.spec, P, x + w / 2 + dx, ty + 30, 1.3, flip as 1 | -1, this.t, (this.scene.w.chars[p.id] as any).outfit);
    }
    // masa cu fata de masa
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + w / 2, ty + 20, w * 0.36, 34, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffb3c7'; ctx.beginPath(); ctx.ellipse(x + w / 2, ty + 20, w * 0.2, 18, 0, 0, 7); ctx.fill();
    // lumanarea
    const cx = x + w / 2; ctx.fillStyle = '#fff3e0'; ctx.beginPath(); ctx.roundRect(cx - 5, ty - 18, 10, 34, 3); ctx.fill(); ctx.stroke();
    const fl = Math.sin(this.t * 13) * 1.5; ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.ellipse(cx + fl * 0.3, ty - 26, 5, 9 + fl, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.ellipse(cx, ty - 24, 2.5, 5, 0, 0, 7); ctx.fill();
    const gl = ctx.createRadialGradient(cx, ty - 24, 2, cx, ty - 24, 90); gl.addColorStop(0, 'rgba(255,210,120,.35)'); gl.addColorStop(1, 'rgba(255,210,120,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, ty - 24, 90, 0, 7); ctx.fill();
    // farfuriile cu ce s-a ales
    this.picked.forEach((k, i) => { const cv = iconCanvas(COURSES[i].opts[k], 64); const px = cx - 90 + i * 90; ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, ty + 24, 22, 9, 0, 0, 7); ctx.fill(); ctx.stroke(); if (cv) ctx.drawImage(cv, px - 16, ty + 4, 32, 32); });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (this.toast) {
      // toastul: paharele se apropie, apasa cand se ating
      const ph = (this.toastK * 0.9) % 1, dx = Math.abs(ph - 0.5) * 220;
      for (const s of [-1, 1]) { const gx = cx + s * (10 + dx), gy = y + h * 0.3; ctx.fillStyle = 'rgba(255,240,200,.7)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(gx - 12, gy - 24); ctx.lineTo(gx + 12, gy - 24); ctx.lineTo(gx + 4, gy + 4); ctx.lineTo(gx - 4, gy + 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(gx, gy + 4); ctx.lineTo(gx, gy + 22); ctx.moveTo(gx - 9, gy + 22); ctx.lineTo(gx + 9, gy + 22); ctx.stroke(); }
      btn(ctx, this.toastBtn(), '#ffd23f', 'Noroc! 🥂', 22);
    } else if (this.i < COURSES.length) {
      // gandul partenerului: un indiciu despre ce vrea
      const want = COURSES[this.i].opts[this.wants[this.i]];
      const bx = x + w / 2 + 150, by = y + 110;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(bx, by, 44, 34, 0, 0, 7); ctx.fill(); ctx.stroke();
      for (const [ox, oy, r] of [[-30, 36, 7], [-40, 50, 4]]) { ctx.beginPath(); ctx.arc(bx + ox, by + oy, r, 0, 7); ctx.fill(); ctx.stroke(); }
      const cv = iconCanvas(want, 64); const blur = this.wait > 0 ? 1 : 0.55 + Math.sin(this.t * 2) * 0.15;
      if (cv) { ctx.globalAlpha = blur; ctx.drawImage(cv, bx - 22, by - 22, 44, 44); ctx.globalAlpha = 1; }
      ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(`${COURSES[this.i].name} · ce comandați?`, x + w / 2, y + h - 172);
      COURSES[this.i].opts.forEach((o, k) => { const b = this.opt(k); btn(ctx, b, '#fff8ef'); const ic = iconCanvas(o, 64); if (ic) ctx.drawImage(ic, b.x + b.w / 2 - 24, b.y + 8, 48, 48); ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.fillText(`${k + 1}. ${DISH_NAMES[o]}`, b.x + b.w / 2, b.y + 78); });
    }
    ctx.textBaseline = 'alphabetic';
  }
}
