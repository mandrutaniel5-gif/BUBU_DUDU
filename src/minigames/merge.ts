// Taraba lui Bubu: joc de unit (merge). Doua obiecte la fel -> unul mai bun.
// Clientii din sat cer produse; le dai si primesti lei.
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';
import { g } from '../game/gender';

export const CHAINS: Record<string, { icons: string[]; names: string[]; gen: string; genLabel: string }> = {
  veg: { icons: ['🌱', '🥕', '🥬', '🧺', '🍲', '🥘'], names: ['Răsad', 'Morcov', 'Legume', 'Coș cu legume', 'Ciorbă', 'Ciorba bunicii'], gen: '🪴', genLabel: 'Grădinița' },
  sweet: { icons: ['🌾', '🥣', '🍪', '🧁', '🍰', '🎂'], names: ['Făină', 'Aluat', 'Biscuit', 'Brioșă', 'Prăjitură', 'Tort'], gen: '🛍️', genLabel: 'Sacul de făină' },
  flower: { icons: ['🌰', '🌿', '🌷', '💐', '👑'], names: ['Sămânță', 'Lăstar', 'Lalea', 'Buchet', 'Coroniță'], gen: '🌻', genLabel: 'Răzorul' },
  drink: { icons: ['🍋', '🧃', '🧋', '🍹'], names: ['Lămâie', 'Suc', 'Bubble tea', 'Cocktail'], gen: '🫙', genLabel: 'Borcanul' },
};
const CH = Object.keys(CHAINS);
const CUSTOMERS = ['🐰 Ina', '🐷 Gogu', '🐱 Miti', '👵 Bunica Leana', '🦊 Rita', '🐶 Rex', '🐸 Oaca', '🦔 Țepi'];

export interface Order { who: string; wants: string[]; pay: number }
export interface MergeBoard { cells: (string | null)[]; orders: Order[] }

const COLS = 6, ROWS = 6;
const lvl = (c: string) => +c.split(':')[1];
const chain = (c: string) => c.split(':')[0];
const icon = (c: string) => CHAINS[chain(c)].icons[lvl(c)];
const maxLvl = (ch: string) => CHAINS[ch].icons.length - 1;
const value = (c: string) => Math.round(3 * 2.1 ** lvl(c));

export function newBoard(): MergeBoard {
  const cells: (string | null)[] = Array(COLS * ROWS).fill(null);
  ['veg:0', 'veg:0', 'sweet:0', 'flower:0', 'veg:1', 'sweet:0'].forEach((c, i) => (cells[7 + i * 3] = c));
  return { cells, orders: [] };
}

export class MergeGame extends Panel {
  b: MergeBoard;
  drag: { from: number; x: number; y: number } | null = null;
  pop: Record<number, number> = {};
  served = 0; earned = 0;

  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '🧺 Taraba lui Bubu', 'Trage un obiect peste unul la fel ca să le unești ✨');
    const c = scene.w.chars[scene.myId] as any;
    c.merge ??= newBoard();
    this.b = c.merge;
    while (this.b.orders.length < 3) this.b.orders.push(this.newOrder());
  }
  newOrder(): Order {
    const served = this.scene.w.stats.served ?? 0;
    const top = Math.min(4, 1 + Math.floor(served / 4));
    const n = Math.random() < 0.3 + Math.min(0.3, served / 40) ? 2 : 1;
    const wants: string[] = [];
    for (let i = 0; i < n; i++) { const ch = CH[Math.floor(Math.random() * (served < 3 ? 2 : CH.length))]; const l = 1 + Math.floor(Math.random() * Math.min(top, maxLvl(ch))); wants.push(`${ch}:${l}`); }
    return { who: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)], wants, pay: wants.reduce((s, c) => s + value(c), 0) };
  }
  abort() { this.finish(this.served > 0 ? 1 : 0.2, this.served ? `Ai câștigat ${this.earned} lei azi! 💰` : 'Taraba se închide 👋'); }
  tick() { for (const k in this.pop) { this.pop[k] -= 0.05; if (this.pop[k] <= 0) delete this.pop[k]; } }

  // ---- geometrie
  layout() {
    const B = this.box;
    const top = B.y + 150, bottomBar = 76;
    const cs = Math.floor(Math.min((B.w - 36) / COLS, (B.h - 150 - bottomBar - 30) / ROWS));
    const gx = B.x + (B.w - cs * COLS) / 2;
    return { cs, gx, gy: top, genY: top + cs * ROWS + 10 };
  }
  cellAt(x: number, y: number) {
    const L = this.layout(); const c = Math.floor((x - L.gx) / L.cs), r = Math.floor((y - L.gy) / L.cs);
    return c >= 0 && c < COLS && r >= 0 && r < ROWS ? r * COLS + c : -1;
  }

  spawn(ch: string) {
    const c = this.scene.w.chars[this.scene.myId];
    if (c.needs.energy < 8) { this.fx.text(this.box.x + this.box.w / 2, this.box.y + this.box.h / 2, `${g(this.scene.myId, 'Ești prea obosit', 'Ești prea obosită')} 😴 Du-te la somn`, '#7a8cff', 0.9); Sfx.play('bad'); return; }
    const empty = this.b.cells.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    if (!empty.length) { this.fx.text(this.box.x + this.box.w / 2, this.box.y + this.box.h / 2, 'Tabla e plină! Unește ceva 🙂', '#e63946', 0.9); Sfx.play('bad'); return; }
    const i = empty[Math.floor(Math.random() * empty.length)];
    this.b.cells[i] = `${ch}:0`; this.pop[i] = 1; Sfx.play('pop');
    this.scene.op({ k: 'need', who: this.scene.myId, need: 'energy', delta: -0.7 });
  }

  deliver(oi: number) {
    const o = this.b.orders[oi];
    const idx: number[] = [];
    for (const want of o.wants) { const i = this.b.cells.findIndex((v, k) => v === want && !idx.includes(k)); if (i < 0) { Sfx.play('bad'); this.fx.text(this.box.x + this.box.w / 2, this.box.y + 130, 'Încă nu ai ce cere clientul', '#e63946', 0.8); return; } idx.push(i); }
    for (const i of idx) this.b.cells[i] = null;
    let pay = o.pay;
    const grassy = Object.keys(this.scene.w.grass ?? {}).length > 15;
    if (grassy) pay = Math.round(pay * 0.8);
    if (this.scene.myId === 'bubu') pay = Math.round(pay * 1.2); // e taraba ei :)
    this.scene.op({ k: 'money', delta: pay }); this.scene.op({ k: 'stat', key: 'served', delta: 1 }); this.scene.op({ k: 'hearts', delta: 1 });
    this.served++; this.earned += pay;
    Sfx.play('coin');
    const L = this.layout();
    this.fx.text(this.box.x + 40 + oi * ((this.box.w - 60) / 3) + 40, this.box.y + 100, `+${pay} lei${grassy ? ' (curte netunsă -20%)' : ''}`, '#2ec4b6', 1);
    this.fx.hearts(this.box.x + this.box.w / 2, L.gy, 4);
    this.b.orders[oi] = this.newOrder();
    this.scene.sendCharSync();
  }

  pointer(type: string, x: number, y: number) {
    const B = this.box, L = this.layout();
    if (type === 'down') {
      // comenzi
      const ow = (B.w - 40) / 3;
      for (let i = 0; i < 3; i++) { const ox = B.x + 20 + i * ow; if (x > ox && x < ox + ow - 8 && y > B.y + 44 && y < B.y + 140) { this.deliver(i); return; } }
      // generatoare
      if (y > L.genY && y < L.genY + 64) { const w4 = (B.w - 40) / 4; const k = Math.floor((x - B.x - 20) / w4); if (k >= 0 && k < 4) this.spawn(CH[k]); return; }
      const i = this.cellAt(x, y);
      if (i >= 0 && this.b.cells[i]) this.drag = { from: i, x, y };
      return;
    }
    if (type === 'move' && this.drag) { this.drag.x = x; this.drag.y = y; return; }
    if (type === 'up' && this.drag) {
      const from = this.drag.from; this.drag = null;
      const to = this.cellAt(x, y); if (to < 0 || to === from) return;
      const a = this.b.cells[from]!, t = this.b.cells[to];
      if (t === a && lvl(a) < maxLvl(chain(a))) {
        const nc = `${chain(a)}:${lvl(a) + 1}`;
        this.b.cells[to] = nc; this.b.cells[from] = null; this.pop[to] = 1.4;
        Sfx.play('good'); this.shake = 3;
        const cx = L.gx + (to % COLS + 0.5) * L.cs, cy = L.gy + (Math.floor(to / COLS) + 0.5) * L.cs;
        this.fx.burst('sparkle', cx, cy, 10, 6.28, 120, { max: 0.6 });
        if (lvl(nc) >= 3) this.fx.text(cx, cy - 30, CHAINS[chain(nc)].names[lvl(nc)] + '!', '#ff9f1c', 0.9);
        this.scene.op({ k: 'need', who: this.scene.myId, need: 'fun', delta: 0.8 });
      } else { this.b.cells[to] = a; this.b.cells[from] = t; Sfx.play('click'); }
    }
  }
  key(k: string, d: boolean) { if (d && k >= '1' && k <= '4') this.spawn(CH[+k - 1]); }

  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const O = '#3a2a22';
    ctx.fillStyle = '#fff1dc'; ctx.fillRect(x, y, w, h);
    // copertina cu dungi
    for (let i = 0; i < w / 30; i++) { ctx.fillStyle = i % 2 ? '#ff9ab8' : '#fff'; ctx.fillRect(x + i * 30, y, 30, 26); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // comenzile clientilor
    const ow = (w - 40) / 3;
    this.b.orders.forEach((o, i) => {
      const ox = x + 20 + i * ow, oy = y + 44;
      const can = o.wants.every(want => this.b.cells.includes(want));
      ctx.fillStyle = can ? '#e3f8e0' : '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(ox, oy, ow - 8, 94, 14); ctx.fill(); ctx.stroke();
      ctx.font = '700 13px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.fillText(o.who, ox + (ow - 8) / 2, oy + 14);
      ctx.font = '30px sans-serif';
      o.wants.forEach((c, k) => ctx.fillText(icon(c), ox + (ow - 8) / 2 + (k - (o.wants.length - 1) / 2) * 38, oy + 46));
      ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.fillStyle = can ? '#2a7a3a' : '#a07050';
      ctx.fillText(can ? `✔ Dă-i! ${o.pay} lei` : `💰 ${o.pay} lei`, ox + (ow - 8) / 2, oy + 80);
    });
    // tabla
    const L = this.layout();
    for (let i = 0; i < COLS * ROWS; i++) {
      const cx = L.gx + (i % COLS) * L.cs, cy = L.gy + Math.floor(i / COLS) * L.cs;
      ctx.fillStyle = (i + Math.floor(i / COLS)) % 2 ? '#f6dcbc' : '#fbe7cc'; ctx.fillRect(cx, cy, L.cs, L.cs);
      const it = this.b.cells[i];
      if (it && !(this.drag && this.drag.from === i)) {
        const s = 1 + (this.pop[i] ?? 0) * 0.25 * Math.sin((this.pop[i] ?? 0) * 6);
        const wanted = this.b.orders.some(o => o.wants.includes(it));
        if (wanted) { ctx.fillStyle = '#c8f2c0'; ctx.beginPath(); ctx.roundRect(cx + 3, cy + 3, L.cs - 6, L.cs - 6, 10); ctx.fill(); }
        ctx.font = `${Math.round(L.cs * 0.62 * s)}px sans-serif`; ctx.fillText(icon(it), cx + L.cs / 2, cy + L.cs / 2 + 2);
        // nivelul
        ctx.font = '800 10px "Baloo 2", sans-serif'; ctx.fillStyle = '#7a5a4a'; ctx.fillText(lvl(it) >= maxLvl(chain(it)) ? '★' : String(lvl(it) + 1), cx + L.cs - 9, cy + 9);
      }
    }
    ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.strokeRect(L.gx, L.gy, L.cs * COLS, L.cs * ROWS);
    // generatoarele
    const w4 = (w - 40) / 4;
    CH.forEach((ch, k) => {
      const bx = x + 20 + k * w4;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, L.genY, w4 - 8, 60, 14); ctx.fill(); ctx.stroke();
      ctx.font = '26px sans-serif'; ctx.fillStyle = O; ctx.fillText(CHAINS[ch].gen, bx + (w4 - 8) / 2, L.genY + 22);
      ctx.font = '700 11px "Baloo 2", sans-serif'; ctx.fillText(CHAINS[ch].genLabel + ' → ' + CHAINS[ch].icons[0], bx + (w4 - 8) / 2, L.genY + 48);
    });
    // obiectul tras
    if (this.drag) { const it = this.b.cells[this.drag.from]; if (it) { ctx.font = `${Math.round(L.cs * 0.8)}px sans-serif`; ctx.fillText(icon(it), this.drag.x, this.drag.y); } }
    ctx.textBaseline = 'alphabetic';
  }
}
