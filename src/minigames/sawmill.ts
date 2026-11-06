// Cheresteaua lui Nea Vasile (pe drumul dintre casă și lac): afacerea lui Dudu de la începutul jocului.
//
// - ⚖️ Cântarul: duci lemnele pe cântar, unul câte unul; Nea Vasile plătește prețul zilei
//   (2-4 lei, Dudu negociază +1 leu), cel mult 15 lemne pe zi. 5 lemne rămân mereu pentru sobă.
// - 📜 Comenzile zilei: două comenzi pe zi (lemne de foc sau scânduri), plătite mai bine; aceleași pe ambele telefoane.
// - 🪚 Gaterul: 2 lemne → 1 scândură. Ții linia de cretă a bușteanului pe pânza gaterului;
//   o tăietură perfectă dă o scândură în plus.
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import { Actor } from '../char/actor';
import { NPC_SPECS } from '../char/draw';
import type { WorldScene } from '../scenes/world';
import { PRICE } from '../game/economy';
import { g } from '../game/gender';
import { nightAmount } from '../game/state';
import { fillTextIcons } from '../ui/icons';

const O = '#3a2a22';
/** pretul unui lemn in fiecare zi a saptamanii (Dudu negociaza +1) */
const DAY_PRICE = [3, 2, 3, 4, 3, 2, 4];
export const sawPrice = (day: number, who: string) => DAY_PRICE[((day % 7) + 7) % 7] + (who === 'dudu' ? 1 : 0);
/** cat platesc pe o scandura la cantar (fara comanda) */
export const PLANK_PRICE = 8;
/** lemnele care raman mereu pentru soba */
export const KEEP_WOOD = 5;
/** „1 scândură”, „2 scânduri”, „20 de scânduri” */
export const nPlanks = (n: number) => n === 1 ? 'o scândură' : `${n}${n >= 20 ? ' de' : ''} scânduri`;
export const nWood = (n: number) => n === 1 ? 'un lemn' : `${n}${n >= 20 ? ' de' : ''} lemne`;

export interface SawOrder { idx: number; text: string; res: 'wood' | 'plank'; qty: number; pay: number }
const ORDERS: { text: string; res: 'wood' | 'plank'; min: number; max: number }[] = [
  { text: 'Lemne de foc pentru Brutăria satului', res: 'wood', min: 8, max: 12 },
  { text: 'Scânduri pentru gardul Bunicului Ion', res: 'plank', min: 2, max: 4 },
  { text: 'Lemne pentru soba hanului „La Răscruce”', res: 'wood', min: 10, max: 14 },
  { text: 'Scânduri pentru magazia familiei Popescu', res: 'plank', min: 3, max: 5 },
  { text: 'Scânduri pentru băncuțele de la lac', res: 'plank', min: 2, max: 3 },
  { text: 'Lemne pentru cuptorul Bunicii Leana', res: 'wood', min: 6, max: 9 },
];
function mulberry(a: number) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/** comenzile zilei (la fel pe ambele telefoane) */
export function sawOrders(day: number, who: string): SawOrder[] {
  const r = mulberry(day * 104729 + 7);
  const a = Math.floor(r() * ORDERS.length); let b = Math.floor(r() * ORDERS.length); if (b === a) b = (a + 1) % ORDERS.length;
  // o comanda de lemne si una de scanduri, cand se poate
  const pick = [a, b].map(i => ORDERS[i]);
  return pick.map((o, idx) => {
    const qty = o.min + Math.floor(r() * (o.max - o.min + 1));
    const base = o.res === 'wood' ? qty * 4.5 : qty * 14;
    return { idx, text: o.text, res: o.res, qty, pay: Math.round(base * (who === 'dudu' ? 1.15 : 1)) };
  });
}
export const orderKey = (day: number, idx: number) => `sawOrder-${day}-${idx}`;

interface FlyLog { t: number; i: number }
type Mode = 'yard' | 'saw';

export class SawmillGame extends Panel {
  mode: Mode = 'yard';
  vasile: Actor;
  sellN = 0;
  /** lemnele care zboara spre cantar (vanzarea in curs) */
  carrying: { n: number; done: number; t: number; price: number } | null = null;
  fly: FlyLog[] = [];
  onScale = 0; needle = 0; coins = 0;
  hits: { id: string; x: number; y: number; w: number; h: number }[] = [];
  W = 0; H = 0;
  // gaterul
  saw: { logs: number; i: number; x: number; off: number; acc: number[]; cur: number; samples: number; phase: number; amp: number; drag: number | null; made: number; keys: Set<string> } | null = null;

  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '🪚 Cheresteaua lui Nea Vasile', '');
    this.vasile = new Actor('bubu', this.fx, { ...NPC_SPECS.dog, name: 'Nea Vasile' });
    this.vasile.outfit = { head: 'cap', face: 'none', neck: 'none', body: 'salopeta' } as any;
    this.vasile.flip = -1; this.vasile.play('wave');
    this.sellN = Math.min(this.leftToday(), this.spare());
  }
  get day() { return this.scene.w.day; }
  get me() { return this.scene.myId; }
  res(k: string) { return this.scene.w.res?.[k] ?? 0; }
  /** lemnele de care te poti atinge (5 raman pentru soba) */
  spare() { return Math.max(0, this.res('wood') - KEEP_WOOD); }
  leftToday() { return Math.max(0, PRICE.sawmillDay - (this.scene.w.stats['woodSold-' + this.day] ?? 0)); }
  price() { return sawPrice(this.day, this.me); }
  orders() { return sawOrders(this.day, this.me); }
  orderDone(i: number) { return (this.scene.w.stats[orderKey(this.day, i)] ?? 0) > 0; }

  /** sunetele de fundal (le porneste soundscape): gaterul din sopron, mai tare cand tai tu */
  get loops(): [string, number, { rate?: number }?][] { return this.saw ? [['machine_loop', 0.55, { rate: 1.2 }], ['amb_forest', 0.25]] : [['machine_loop', 0.14, { rate: 0.8 }], ['amb_forest', 0.35]]; }
  abort() { if (this.mode === 'saw' && this.saw) { this.endSaw(); return; } this.finish(this.coins > 0 ? 1 : 0.2, this.coins > 0 ? `Ai câștigat ${this.coins} lei la cherestea! 💰` : 'Pe mâine, Nea Vasile! 👋'); }

  // ------------------------------------------------------------------ cantarul
  startSell() {
    if (this.carrying) return;
    const n = Math.min(this.sellN, this.leftToday(), this.spare());
    if (n <= 0) { this.say(this.leftToday() ? `Păstrează ${KEEP_WOOD} lemne pentru sobă 🔥` : 'Am cumpărat destule azi. Vino mâine! 🙂'); Sfx.play('bad'); return; }
    this.carrying = { n, done: 0, t: 0, price: this.price() };
    this.hero.play('act_carry');
  }
  finishSell() {
    const c = this.carrying!; this.carrying = null;
    const lei = c.n * c.price, s = this.scene, dayKey = 'woodSold-' + this.day;
    s.op({ k: 'res', res: 'wood', delta: -c.n }); s.op({ k: 'money', delta: lei });
    s.op({ k: 'stat', key: 'woodSold', delta: c.n }); s.op({ k: 'stat', key: dayKey, delta: c.n });
    s.op({ k: 'need', who: this.me, need: 'energy', delta: -Math.min(6, c.n * 0.4) });
    s.log(`${s.me.actor.spec.name} a vândut ${nWood(c.n)} la cherestea: +${lei} lei 💰`);
    this.coins += lei; this.onScale = 0;
    this.hero.play(this.me === 'dudu' ? 'flex' : 'love'); this.vasile.play('love');
    Sfx.play('register'); Sfx.play('coin', { delay: 0.25 });
    this.fx.text(this.W * 0.4, this.H * 0.3, `+${lei} lei`, '#2ec4b6', 1.3);
    this.fx.burst('sparkle', this.W * 0.4, this.H * 0.36, 14, 6.28, 160, { max: 0.7, color: '#ffd23f' });
    this.say(this.me === 'dudu' ? `Bun lemn, Dudu! ${c.price} lei bucata, cum ne-am înțeles 🤝` : `Mulțumesc, Bubu! ${c.price} lei bucata 🙂`);
    this.sellN = Math.min(this.leftToday(), this.spare());
  }
  sellPlanks() {
    const n = this.res('plank'); if (!n) { this.say('N-ai scânduri. Taie câteva la gater! 🪚'); Sfx.play('bad'); return; }
    const lei = n * PLANK_PRICE, s = this.scene;
    s.op({ k: 'res', res: 'plank', delta: -n }); s.op({ k: 'money', delta: lei }); s.op({ k: 'stat', key: 'planksSold', delta: n });
    this.coins += lei; Sfx.play('register'); this.vasile.play('love');
    this.fx.text(this.W * 0.4, this.H * 0.3, `+${lei} lei`, '#2ec4b6', 1.2);
    this.say(`${nPlanks(n)}, ${PLANK_PRICE} lei bucata. Frumos tăiate! 👌`);
  }
  deliver(i: number) {
    const o = this.orders()[i]; if (!o || this.orderDone(i)) return;
    if (this.res(o.res) < o.qty || (o.res === 'wood' && this.res('wood') - o.qty < 0)) { this.say(o.res === 'wood' ? `Îți trebuie ${o.qty} lemne 🪵` : `Îți trebuie ${o.qty} scânduri: taie-le la gater 🪚`); Sfx.play('bad'); return; }
    const s = this.scene;
    s.op({ k: 'res', res: o.res, delta: -o.qty }); s.op({ k: 'money', delta: o.pay });
    s.op({ k: 'stat', key: orderKey(this.day, i), delta: 1 }); s.op({ k: 'stat', key: 'sawOrders', delta: 1 }); s.op({ k: 'hearts', delta: 1 });
    s.log(`${s.me.actor.spec.name} a livrat comanda „${o.text}”: +${o.pay} lei 📜`);
    this.coins += o.pay; Sfx.play('register'); Sfx.play('good', { delay: 0.3 }); this.vasile.play('love'); this.hero.play('dance_hop');
    this.fx.text(this.W * 0.5, this.H * 0.3, `Comandă livrată! +${o.pay} lei`, '#2ec4b6', 1.2);
    this.fx.hearts(this.W * 0.5, this.H * 0.35, 6);
  }
  say(t: string) { this.bubble = { t, life: 3.2 }; }
  bubble: { t: string; life: number } | null = { t: '', life: 0 };

  // ------------------------------------------------------------------ gaterul
  startSaw() {
    const logs = Math.min(3, Math.floor(this.spare() / 2));
    if (logs < 1) { this.say(`Îți trebuie 2 lemne pe scândură (și ${KEEP_WOOD} rămân pentru sobă)`); Sfx.play('bad'); return; }
    const c = this.scene.w.chars[this.me]; if (c.needs.energy < 8) { this.say(`${g(this.me, 'Ești prea obosit', 'Ești prea obosită')} pentru gater 😴`); Sfx.play('bad'); return; }
    this.mode = 'saw';
    this.saw = { logs, i: 0, x: 0, off: 0, acc: [], cur: 0, samples: 0, phase: Math.random() * 6, amp: 0.55 + Math.random() * 0.25, drag: null, made: 0, keys: new Set() };
    this.scene.op({ k: 'res', res: 'wood', delta: -logs * 2 });
    Sfx.play('saw', { vol: 0.7 });
  }
  /** linia de creta pe busteanul curent, la pozitia u (0..1 de-a lungul lui), in unitati de -1..1 */
  chalk(u: number) { const s = this.saw!; return Math.sin(u * 5.2 + s.phase + s.i * 2) * s.amp * 0.6 + Math.sin(u * 11 + s.phase * 2) * 0.12; }
  endLog() {
    const s = this.saw!; const a = s.samples ? s.cur / s.samples : 0;
    s.acc.push(a);
    const planks = a >= 0.85 ? 2 : a >= 0.45 ? 1 : 0;
    s.made += planks;
    if (planks) this.scene.op({ k: 'res', res: 'plank', delta: planks });
    this.fx.text(this.W / 2, this.H * 0.25, a >= 0.85 ? 'Tăietură perfectă! +2 scânduri ✨' : a >= 0.45 ? '+1 scândură 👍' : 'Strâmb… s-a făcut surcele 😅', a >= 0.45 ? '#2ec4b6' : '#e63946', 1.1);
    Sfx.play(a >= 0.45 ? 'wood_drop' : 'bad');
    s.i++; s.x = 0; s.cur = 0; s.samples = 0; s.off *= 0.3;
    if (s.i >= s.logs) setTimeout(() => this.endSaw(), 700);
  }
  endSaw() {
    const s = this.saw; if (!s) return;
    this.scene.op({ k: 'stat', key: 'planksMade', delta: s.made });
    this.scene.op({ k: 'need', who: this.me, need: 'energy', delta: -5 });
    if (s.made) this.scene.log(`${this.scene.me.actor.spec.name} a tăiat ${nPlanks(s.made)} la gater 🪚`);
    this.say(s.made ? `${nPlanks(s.made)}! Le poți livra la comenzi 📜` : 'Mai încearcă, ține linia pe pânză 🙂');
    this.saw = null; this.mode = 'yard';
  }

  tick(dt: number) {
    this.vasile.update(dt);
    if (this.bubble) this.bubble.life -= dt;
    this.needle += ((this.onScale ? Math.min(1, this.onScale / 15) : 0) - this.needle) * Math.min(1, dt * 6);
    const c = this.carrying;
    if (c) {
      c.t += dt;
      // un lemn la 0,32 s: zboara de pe gramada pe cantar, cu bufnitura
      if (c.done + this.fly.length < c.n && c.t > (c.done + this.fly.length) * 0.32) this.fly.push({ t: 0, i: c.done + this.fly.length });
      for (const f of this.fly) f.t += dt * 2.6;
      while (this.fly.length && this.fly[0].t >= 1) { this.fly.shift(); c.done++; this.onScale++; Sfx.play('wood_drop', { vol: 0.6, rate: 0.9 + Math.random() * 0.2 }); this.fx.burst('puff', this.W * 0.36, this.H * 0.6, 4, 3, 50, { max: 0.4, size: 0.4 }); }
      if (c.done >= c.n && !this.fly.length && c.t > c.n * 0.32 + 0.5) this.finishSell();
    }
    const s = this.saw;
    if (s && s.i < s.logs) {
      // busteanul inainteaza; tu il tii cu linia pe panza (sus / jos)
      const k = s.keys; const v = (k.has('w') || k.has('arrowup') ? -1 : 0) + (k.has('s') || k.has('arrowdown') ? 1 : 0);
      s.off = Math.max(-1, Math.min(1, s.off + v * dt * 1.6));
      s.x += dt / 4.2;
      if (s.x > 0.08 && s.x < 0.96) { const err = Math.abs(this.chalk(s.x) + s.off); s.cur += Math.max(0, 1 - err / 0.32); s.samples++; if (Math.random() < dt * 30) this.fx.emit('drop', this.W / 2 + (Math.random() - 0.5) * 20, this.H * 0.5, { vx: (Math.random() - 0.5) * 160, vy: -80 - Math.random() * 80, grav: 400, max: 0.6, color: '#e7c08f' }); }
      if (s.x >= 1) this.endLog();
    }
  }

  pointer(type: string, x: number, y: number) {
    if (this.mode === 'saw' && this.saw) {
      const s = this.saw;
      if (type === 'down') s.drag = y; else if (type === 'move' && s.drag != null) { s.off = Math.max(-1, Math.min(1, s.off + (y - s.drag) / (this.H * 0.18))); s.drag = y; } else if (type === 'up') s.drag = null;
      return;
    }
    if (type !== 'down') return;
    for (const h of this.hits) if (x > h.x && x < h.x + h.w && y > h.y && y < h.y + h.h) { Sfx.play('click'); this.press(h.id); return; }
  }
  press(id: string) {
    if (id === 'minus') this.sellN = Math.max(1, this.sellN - 1);
    else if (id === 'plus') this.sellN = Math.min(Math.max(1, Math.min(this.leftToday(), this.spare())), this.sellN + 1);
    else if (id === 'sell') this.startSell();
    else if (id === 'saw') this.startSaw();
    else if (id === 'planks') this.sellPlanks();
    else if (id.startsWith('ord')) this.deliver(+id.slice(3));
  }
  key(k: string, d: boolean) {
    if (this.saw) { d ? this.saw.keys.add(k) : this.saw.keys.delete(k); return; }
    if (!d) return;
    if (k === 'e' || k === ' ') this.startSell();
  }
  scene2() { /* desenam tot ecranul in draw() */ }

  // ------------------------------------------------------------------ desen
  draw(ctx: CanvasRenderingContext2D, W: number, H: number) {
    this.W = W; this.H = H; this.box = { x: 0, y: 0, w: W, h: H };
    ctx.save();
    if (this.shake > 0.3) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    if (this.mode === 'saw' && this.saw) this.drawSaw(ctx, W, H); else this.drawYard(ctx, W, H);
    this.fx.draw(ctx);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W - 20, 18, 15, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 26, 12); ctx.lineTo(W - 14, 24); ctx.moveTo(W - 14, 12); ctx.lineTo(W - 26, 24); ctx.stroke();
    if (this.ended) {
      const k = Math.min(1, this.ended.t * 3);
      ctx.fillStyle = `rgba(255,255,255,${0.75 * k})`; ctx.fillRect(0, H / 2 - 50, W, 100);
      ctx.font = '900 28px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ff4d6d'; ctx.fillText(this.ended.text, W / 2, H / 2);
    }
    ctx.restore(); ctx.textBaseline = 'alphabetic';
  }

  drawYard(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const night = nightAmount(this.scene.w.minutes), gy = H * 0.62;
    const sky = ctx.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, night > 0.5 ? '#1d2550' : '#9fdcff'); sky.addColorStop(1, night > 0.5 ? '#4a3f75' : '#fff1d6');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, gy);
    // padurea din spate
    for (let i = 0; i < 16; i++) { const x = i * W / 14 - 20, h = 60 + (i * 37 % 40); ctx.fillStyle = night > 0.5 ? '#2e4a3a' : i % 2 ? '#5fa865' : '#4f9655'; ctx.beginPath(); ctx.moveTo(x - 26, gy - H * 0.16); ctx.lineTo(x, gy - H * 0.16 - h); ctx.lineTo(x + 26, gy - H * 0.16); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = night > 0.5 ? '#3d5a3f' : '#9fd68c'; ctx.fillRect(0, gy - H * 0.17, W, H * 0.06);
    // curtea cu rumegus
    ctx.fillStyle = night > 0.5 ? '#6b5a48' : '#d9bf8f'; ctx.fillRect(0, gy - H * 0.11, W, H - gy + H * 0.11);
    for (let i = 0; i < 60; i++) { const x = (i * 97.3) % W, y = gy - H * 0.1 + ((i * 53.1) % (H * 0.12)); ctx.fillStyle = '#c9a874'; ctx.beginPath(); ctx.ellipse(x, y, 3 + (i % 3), 1.5, 0, 0, 7); ctx.fill(); }
    // sopronul cu gaterul (dreapta)
    const sx = W * 0.56, sw = W * 0.4, sy = gy - H * 0.47, sh = H * 0.36;
    ctx.fillStyle = '#8a5d32'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(sx + 10, sy + 14, sw - 20, sh - 14);
    ctx.fillStyle = '#a0473e'; ctx.beginPath(); ctx.moveTo(sx - 18, sy + 4); ctx.lineTo(sx + sw / 2, sy - H * 0.12); ctx.lineTo(sx + sw + 18, sy + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let x = sx; x < sx + sw; x += 18) { ctx.strokeStyle = '#7a3a30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, sy + 2); ctx.lineTo(sx + sw / 2 + (x - sx - sw / 2) * 0.2, sy - H * 0.1); ctx.stroke(); }
    ctx.fillStyle = '#fff8ef'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(sx + sw / 2 - 86, sy - H * 0.06, 172, 26, 8); ctx.fill(); ctx.stroke();
    ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#8a3a30'; ctx.fillText('CHERESTEAUA · Nea Vasile', sx + sw / 2, sy - H * 0.06 + 13);
    // gaterul din sopron: pana care urca si coboara
    const gx = sx + sw * 0.35, gyy = sy + sh * 0.25, bob = Math.sin(this.t * 14) * 5;
    ctx.fillStyle = '#9aa5ad'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.rect(gx - 30, gyy, 60, sh * 0.62); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8dde2'; ctx.fillRect(gx - 3, gyy + 6 + bob, 6, sh * 0.5); ctx.strokeRect(gx - 3, gyy + 6 + bob, 6, sh * 0.5);
    ctx.fillStyle = '#c98e5f'; ctx.beginPath(); ctx.roundRect(gx - sw * 0.3, gyy + sh * 0.45, sw * 0.6, 14, 7); ctx.fill(); ctx.stroke();
    // stivele de scanduri si busteni
    for (let r = 0; r < 4; r++) for (let k = 0; k < 5 - r; k++) { const x = sx + sw * 0.72 + k * 13 + r * 6.5, y = gy - H * 0.08 - r * 12; ctx.fillStyle = '#a0703f'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 7, 6, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e7c08f'; ctx.beginPath(); ctx.ellipse(x, y, 3.5, 3, 0, 0, 7); ctx.fill(); }
    for (let r = 0; r < 5; r++) { ctx.fillStyle = r % 2 ? '#e7c08f' : '#d9a273'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(sx - W * 0.12, gy - H * 0.06 - r * 8, W * 0.1, 8); ctx.fill(); ctx.stroke(); }
    // tabla cu creta: pretul zilei
    const bx = W * 0.03, by = H * 0.05, bw = Math.min(250, W * 0.3), bh = H * 0.2;
    ctx.fillStyle = '#3d4a45'; ctx.strokeStyle = '#a0703f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '800 15px "Baloo 2", sans-serif';
    fillTextIcons(ctx, `Azi: ${this.price()} lei / lemn${this.me === 'dudu' ? ' (+1 Dudu)' : ''}`, bx + 12, by + bh * 0.3, 15);
    ctx.font = '700 13px "Baloo 2", sans-serif'; ctx.fillStyle = '#ffe680';
    fillTextIcons(ctx, `Mai cumpăr azi: ${this.leftToday()} lemne`, bx + 12, by + bh * 0.56, 13);
    ctx.fillStyle = '#ffd6e4'; fillTextIcons(ctx, `Scânduri: ${PLANK_PRICE} lei · comenzi: mai mult`, bx + 12, by + bh * 0.8, 13);
    // gramada ta de lemne (stanga), cantarul, Nea Vasile, tu
    const pileX = W * 0.1, pileY = gy + H * 0.02, wood = this.res('wood') - (this.carrying ? this.carrying.done + this.fly.length : 0);
    for (let i = 0; i < Math.min(15, wood); i++) { const r = Math.floor(i / 5), k = i % 5; const x = pileX + k * 14 + r * 7 - 30, y = pileY - r * 11; ctx.fillStyle = i < KEEP_WOOD ? '#8a5d32' : '#a0703f'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 8, 7, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e7c08f'; ctx.beginPath(); ctx.ellipse(x, y, 4, 3.4, 0, 0, 7); ctx.fill(); }
    ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = O; { const t = `🪵 ${nWood(this.res('wood'))} · 📏 ${nPlanks(this.res('plank'))}`; const tw = ctx.measureText(t).width + 28; fillTextIcons(ctx, t, Math.max(tw / 2 + 6, pileX + 4), pileY + 22, 12); }
    // cantarul: platforma, stalpul cu cadranul, acul
    const scX = W * 0.36, scY = gy + H * 0.02;
    ctx.fillStyle = '#9aa5ad'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(scX - 50, scY - 8, 100, 16, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b7780'; ctx.fillRect(scX + 44, scY - 70, 8, 64); ctx.strokeRect(scX + 44, scY - 70, 8, 64);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(scX + 48, scY - 82, 20, 0, 7); ctx.fill(); ctx.stroke();
    for (let i = 0; i <= 6; i++) { const a = Math.PI * (0.8 + i / 6 * 1.4); ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(scX + 48 + Math.cos(a) * 14, scY - 82 + Math.sin(a) * 14); ctx.lineTo(scX + 48 + Math.cos(a) * 18, scY - 82 + Math.sin(a) * 18); ctx.stroke(); }
    { const a = Math.PI * (0.8 + this.needle * 1.4) + Math.sin(this.t * 20) * 0.02 * this.needle; ctx.strokeStyle = '#e63946'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(scX + 48, scY - 82); ctx.lineTo(scX + 48 + Math.cos(a) * 15, scY - 82 + Math.sin(a) * 15); ctx.stroke(); }
    for (let i = 0; i < this.onScale; i++) { const r = Math.floor(i / 6), k = i % 6; const x = scX - 36 + k * 13 + r * 6, y = scY - 14 - r * 11; ctx.fillStyle = '#a0703f'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 7, 6, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e7c08f'; ctx.beginPath(); ctx.ellipse(x, y, 3.5, 3, 0, 0, 7); ctx.fill(); }
    // lemnele in zbor (din bratele tale pe cantar)
    const hx = W * 0.2, hy = gy + H * 0.04, sc = Math.min(1.5, H / 330);
    for (const f of this.fly) { const u = Math.min(1, f.t), x = hx + (scX - 20 - hx) * u, y = hy - 110 * sc + (scY - 20 - (hy - 110 * sc)) * u - Math.sin(u * Math.PI) * 40; ctx.save(); ctx.translate(x, y); ctx.rotate(u * 4); ctx.fillStyle = '#a0703f'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-16, -6, 32, 12, 6); ctx.fill(); ctx.stroke(); ctx.restore(); }
    this.vasile.scale = sc; this.vasile.x = W * 0.36 + 60 + 40 * sc; this.vasile.y = gy + H * 0.05; this.vasile.draw(ctx);
    this.hero.scale = sc; this.hero.x = hx; this.hero.y = hy; this.hero.flip = 1; this.hero.draw(ctx);
    if (this.carrying && this.carrying.done + this.fly.length < this.carrying.n) { ctx.save(); ctx.translate(hx, hy - 118 * sc); ctx.fillStyle = '#a0703f'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-26, -8, 52, 16, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e7c08f'; ctx.beginPath(); ctx.ellipse(26, 0, 5, 8, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
    // ce spune Nea Vasile
    if (this.bubble && this.bubble.life > 0 && this.bubble.t) {
      const t = this.bubble.t; ctx.font = '700 13px "Baloo 2", sans-serif'; const tw = Math.min(W * 0.5, ctx.measureText(t).width + 24);
      const x = Math.min(W - tw / 2 - 10, this.vasile.x), y = this.vasile.y - 128 * sc;
      ctx.globalAlpha = Math.min(1, this.bubble.life * 2); ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x - tw / 2, y - 16, tw, 30, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = O; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; fillTextIcons(ctx, t, x, y, 13); ctx.globalAlpha = 1;
    }
    this.drawCards(ctx, W, H);
  }

  /** cele trei cartonase de jos: cantarul, comenzile, gaterul */
  drawCards(ctx: CanvasRenderingContext2D, W: number, H: number) {
    this.hits = [];
    const top = H * 0.7, ch = H - top - 8, gap = 8, cw = (W - gap * 4) / 3;
    const card = (i: number, title: string, col: string) => { const x = gap + i * (cw + gap); ctx.fillStyle = '#fff8f0'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, top, cw, ch, 14); ctx.fill(); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, top, cw, 24, [14, 14, 0, 0]); ctx.fill(); ctx.stroke(); ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; fillTextIcons(ctx, title, x + cw / 2, top + 12, 13); return x; };
    const btn = (id: string, x: number, y: number, w: number, h: number, label: string, on = true, col = '#ffd6e4') => { ctx.fillStyle = on ? col : '#e8e2de'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = on ? O : '#9a8f88'; ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; fillTextIcons(ctx, label, x + w / 2, y + h / 2 + 1, 12); this.hits.push({ id, x, y, w, h }); };
    const line = (t: string, x: number, y: number, col = O, size = 12) => { ctx.font = `700 ${size}px "Baloo 2", sans-serif`; ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; fillTextIcons(ctx, t, x, y, size); };
    const bh = Math.min(30, ch * 0.28);
    // 1. cantarul
    { const x = card(0, '⚖️ Cântarul', '#c98e5f'); const can = Math.min(this.leftToday(), this.spare());
      line(can ? `Poți vinde ${can} (${KEEP_WOOD} rămân pentru sobă)` : this.leftToday() ? `Ai doar ${this.res('wood')} lemne (${KEEP_WOOD} pentru sobă)` : 'Gata pe azi: vino mâine', x + 10, top + 38, can ? O : '#c0392b', 11);
      const n = Math.max(0, Math.min(this.sellN, can));
      btn('minus', x + 10, top + 52, bh, bh, '−', can > 0); line(`${n}`, x + 18 + bh, top + 52 + bh / 2, O, 16); btn('plus', x + 46 + bh, top + 52, bh, bh, '+', can > 0);
      btn('sell', x + 10, top + ch - bh - 8, cw - 20, bh, this.carrying ? 'Se cântărește…' : `Pune pe cântar · +${n * this.price()} lei`, can > 0 && !this.carrying, '#ffe08a'); }
    // 2. comenzile zilei
    { const x = card(1, '📜 Comenzile zilei', '#7a5ad6'); const rowH = (ch - 30) / 2;
      this.orders().forEach((o, i) => { const y = top + 28 + i * rowH, done = this.orderDone(i), have = this.res(o.res) >= o.qty;
        line(`${o.res === 'wood' ? '🪵' : '📏'} ${o.res === 'wood' ? nWood(o.qty) : nPlanks(o.qty)} · ${o.pay} lei`, x + 10, y + 10, O, 12);
        ctx.font = '600 10px "Baloo 2", sans-serif'; ctx.fillStyle = '#7a5a4a'; ctx.textAlign = 'left'; ctx.fillText(o.text.length > 44 ? o.text.slice(0, 43) + '…' : o.text, x + 10, y + 25);
        btn('ord' + i, x + cw - 92, y + 2, 82, Math.min(26, rowH * 0.45), done ? '✔ Livrată' : 'Livrează', !done && have, '#d6f5d0'); }); }
    // 3. gaterul
    { const x = card(2, '🪚 Gaterul', '#5b7fbf'); const logs = Math.min(3, Math.floor(this.spare() / 2));
      line('2 lemne → 1 scândură', x + 10, top + 38, O, 12); line('tăietură perfectă = scândură în plus', x + 10, top + 54, '#7a5a4a', 10);
      btn('saw', x + 10, top + ch - bh * 2 - 14, cw - 20, bh, logs ? `Taie ${logs} ${logs === 1 ? 'bușteanul' : 'bușteni'} la gater` : 'Îți trebuie lemne', logs > 0, '#cfe3ff');
      btn('planks', x + 10, top + ch - bh - 8, cw - 20, bh, `Vinde scândurile (${this.res('plank')} × ${PLANK_PRICE} lei)`, this.res('plank') > 0, '#ffe1ea'); }
  }

  drawSaw(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const s = this.saw!; const cy = H * 0.5, bladeX = W / 2;
    // sopronul vazut de aproape
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 40) { ctx.fillStyle = x / 40 % 2 ? '#6a4628' : '#634024'; ctx.fillRect(x, 0, 40, H * 0.3); }
    // masa gaterului cu role
    ctx.fillStyle = '#9aa5ad'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.rect(0, cy + H * 0.16, W, H * 0.06); ctx.fill(); ctx.stroke();
    for (let x = (this.t * 160) % 50; x < W; x += 50) { ctx.fillStyle = '#6b7780'; ctx.beginPath(); ctx.arc(x, cy + H * 0.16, 8, 0, 7); ctx.fill(); ctx.stroke(); }
    // busteanul: vine din dreapta, trece prin panza
    const L = W * 0.9, lx = W - s.x * (L + W * 0.1) + W * 0.05, lh = H * 0.24, off = s.off * H * 0.12;
    ctx.save(); ctx.translate(0, off);
    ctx.fillStyle = '#c98e5f'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(lx - L / 2, cy - lh / 2, L, lh, lh / 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#a0703f'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(lx - L / 2 + 30, cy - lh * 0.3 + k * lh * 0.2); ctx.lineTo(lx + L / 2 - 30, cy - lh * 0.28 + k * lh * 0.2); ctx.stroke(); }
    ctx.fillStyle = '#e7c08f'; ctx.beginPath(); ctx.ellipse(lx + L / 2 - 6, cy, lh * 0.18, lh / 2 - 3, 0, 0, 7); ctx.fill(); ctx.stroke();
    // linia de creta (cea pe care trebuie sa tai)
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([10, 7]); ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const u = i / 60, x = lx - L / 2 + u * L, worldU = s.x + (bladeX - x) / (L + W * 0.1); const y = cy + this.chalk(Math.max(0, Math.min(1, worldU))) * H * 0.12; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);
    // taietura facuta deja (stanga panzei)
    ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Math.max(lx - L / 2, 0), cy - off); ctx.lineTo(bladeX, cy - off); ctx.stroke();
    ctx.restore();
    // panza gaterului (fixa, urca si coboara)
    const bob = Math.sin(this.t * 30) * 6;
    ctx.fillStyle = '#9aa5ad'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.rect(bladeX - 40, 0, 80, H * 0.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8ecef'; ctx.beginPath(); ctx.rect(bladeX - 4, H * 0.18 + bob, 8, H * 0.5); ctx.fill(); ctx.stroke();
    for (let y = H * 0.2 + bob; y < H * 0.68 + bob; y += 9) { ctx.beginPath(); ctx.moveTo(bladeX + 4, y); ctx.lineTo(bladeX + 9, y + 4); ctx.lineTo(bladeX + 4, y + 8); ctx.closePath(); ctx.fillStyle = '#c9ccd6'; ctx.fill(); ctx.stroke(); }
    // tinta: unde taie panza
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bladeX - 26, cy); ctx.lineTo(bladeX - 10, cy); ctx.moveTo(bladeX + 10, cy); ctx.lineTo(bladeX + 26, cy); ctx.stroke();
    // cat de bine tai acum
    const err = Math.abs(this.chalk(Math.max(0, Math.min(1, s.x))) + s.off), q = Math.max(0, 1 - err / 0.32);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(W / 2 - 160, 14, 320, 58, 14); ctx.fill(); ctx.stroke();
    ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = O;
    fillTextIcons(ctx, `Bușteanul ${Math.min(s.i + 1, s.logs)} din ${s.logs} · scânduri: ${s.made}`, W / 2, 32, 15);
    ctx.fillStyle = '#eee'; ctx.fillRect(W / 2 - 140, 50, 280, 10); ctx.fillStyle = q > 0.7 ? '#7cc576' : q > 0.4 ? '#ffd23f' : '#e63946'; ctx.fillRect(W / 2 - 140, 50, 280 * q, 10); ctx.strokeRect(W / 2 - 140, 50, 280, 10);
    ctx.font = '700 13px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('Trage bușteanul în sus / în jos (sau W / S) ca linia albă să treacă prin pânză', W / 2, H - 22);
    // Dudu (sau Bubu) impinge busteanul
    const sc = Math.min(1.3, H / 380); this.hero.scale = sc; this.hero.x = W * 0.86; this.hero.y = H * 0.92; this.hero.flip = -1; this.hero.draw(ctx);
  }
}
