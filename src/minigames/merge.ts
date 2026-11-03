// Taraba lui Bubu: joc de unit (merge) cu resurse REALE din inventar.
// Doua produse la fel -> unul mai valoros. Clientii (NPC) care stau la coada cer produse.
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';
import { g } from '../game/gender';
import { drawItem, ITEM_NAMES, MAX_LVL } from '../world/items';
import { drawCharacter } from '../char/draw';
import { basePose } from '../char/pose';

/** lanturile, in ordinea deblocarii */
export const CHAIN_INFO: { id: string; src: string; srcLabel: string; unlock: number; title: string }[] = [
  { id: 'flower', src: 'flower', srcLabel: 'Flori', unlock: 0, title: 'Florărie' },
  { id: 'veg', src: 'veg', srcLabel: 'Legume', unlock: 4, title: 'Legume' },
  { id: 'sweet', src: 'flour', srcLabel: 'Făină', unlock: 10, title: 'Dulciuri' },
  { id: 'drink', src: 'lemon', srcLabel: 'Lămâi', unlock: 18, title: 'Băuturi' },
];
export const unlockedChains = (served: number) => CHAIN_INFO.filter(c => served >= c.unlock).map(c => c.id);
export const itemValue = (code: string) => { const l = +code.split(':')[1]; return Math.round(3 * 2.2 ** l); };

export interface MergeBoard { v: 2; cells: (string | null)[] }
const COLS = 6, ROWS = 5;
const lvl = (c: string) => +c.split(':')[1];
const chain = (c: string) => c.split(':')[0];
export const newBoard = (): MergeBoard => ({ v: 2, cells: Array(COLS * ROWS).fill(null) });

export class MergeGame extends Panel {
  b: MergeBoard;
  drag: { from: number; x: number; y: number } | null = null;
  pop: Record<number, number> = {};
  served = 0; earned = 0;

  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '🧺 Taraba lui Bubu', 'Pune produse din cămară, unește-le și servește clienții');
    const c = scene.w.chars[scene.myId] as any;
    if (!c.merge || c.merge.v !== 2) c.merge = newBoard();
    this.b = c.merge;
  }
  abort() { this.scene.sendCharSync(); this.finish(this.served > 0 ? 1 : 0.2, this.served ? `Ai câștigat ${this.earned} lei! 💰` : 'Taraba se închide 👋'); }
  tick() { for (const k in this.pop) { this.pop[k] -= 0.05; if (this.pop[k] <= 0) delete this.pop[k]; } }

  layout() {
    const B = this.box;
    const top = B.y + 168, bottomBar = 84;
    const cs = Math.floor(Math.min((B.w - 36) / COLS, (B.h - 168 - bottomBar - 30) / ROWS));
    return { cs, gx: B.x + (B.w - cs * COLS) / 2, gy: top, genY: top + cs * ROWS + 10 };
  }
  cellAt(x: number, y: number) {
    const L = this.layout(); const c = Math.floor((x - L.gx) / L.cs), r = Math.floor((y - L.gy) / L.cs);
    return c >= 0 && c < COLS && r >= 0 && r < ROWS ? r * COLS + c : -1;
  }
  get servedTotal() { return this.scene.w.stats.served ?? 0; }

  /** pune pe tabla un produs din inventar */
  spawn(k: number) {
    const ci = CHAIN_INFO[k]; if (!ci) return;
    const B = this.box;
    const msg = (t: string) => { this.fx.text(B.x + B.w / 2, B.y + B.h * 0.5, t, '#e63946', 0.85); Sfx.play('bad'); };
    if (this.servedTotal < ci.unlock) return msg(`🔒 Se deblochează după ${ci.unlock} clienți serviți`);
    const r = this.scene.w.res ?? {};
    if ((r[ci.src] ?? 0) < 1) return msg(ci.src === 'flower' ? 'N-ai flori! Culege din curte 🌸' : ci.src === 'veg' ? 'N-ai legume! Grădina sau satul 🥕' : `N-ai ${ci.srcLabel.toLowerCase()}! Cumpără din sat 🏘️`);
    const c = this.scene.w.chars[this.scene.myId];
    if (c.needs.energy < 6) return msg(`${g(this.scene.myId, 'Ești prea obosit', 'Ești prea obosită')} 😴`);
    const empty = this.b.cells.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    if (!empty.length) return msg('Tabla e plină! Unește ceva 🙂');
    const i = empty[0];
    this.b.cells[i] = `${ci.id}:0`; this.pop[i] = 1; Sfx.play('pop');
    this.scene.op({ k: 'res', res: ci.src, delta: -1 });
    this.scene.op({ k: 'need', who: this.scene.myId, need: 'energy', delta: -0.5 });
  }

  deliver(npcId: string) {
    const npc = this.scene.npcs.find(n => n.id === npcId); if (!npc || npc.state !== 'wait') return;
    const idx: number[] = [];
    for (const want of npc.wants) { const i = this.b.cells.findIndex((v, k) => v === want && !idx.includes(k)); if (i < 0) { Sfx.play('bad'); this.fx.text(this.box.x + this.box.w / 2, this.box.y + 150, 'Încă nu ai ce cere clientul', '#e63946', 0.8); return; } idx.push(i); }
    for (const i of idx) this.b.cells[i] = null;
    let pay = npc.pay;
    const grassy = Object.keys(this.scene.w.grass ?? {}).length > 15;
    if (grassy) pay = Math.round(pay * 0.8);
    if (this.scene.myId === 'bubu') pay = Math.round(pay * 1.2); // e taraba ei :)
    this.scene.serveNpc(npcId, pay);
    this.served++; this.earned += pay;
    Sfx.play('coin');
    this.fx.text(this.box.x + this.box.w / 2, this.box.y + 120, `+${pay} lei${grassy ? ' (curte netunsă -20%)' : ''}`, '#2ec4b6', 1);
    this.fx.hearts(this.box.x + this.box.w / 2, this.box.y + 110, 4);
    this.scene.sendCharSync();
  }
  queue() { return this.scene.npcs.filter(n => n.state === 'wait').slice(0, 3); }

  pointer(type: string, x: number, y: number) {
    const B = this.box, L = this.layout();
    if (type === 'down') {
      const q = this.queue(); const ow = (B.w - 40) / 3;
      for (let i = 0; i < q.length; i++) { const ox = B.x + 20 + i * ow; if (x > ox && x < ox + ow - 8 && y > B.y + 40 && y < B.y + 158) { this.deliver(q[i].id); return; } }
      if (y > L.genY && y < L.genY + 70) { const w4 = (B.w - 40) / 4; const k = Math.floor((x - B.x - 20) / w4); if (k >= 0 && k < 4) this.spawn(k); return; }
      const i = this.cellAt(x, y);
      if (i >= 0 && this.b.cells[i]) this.drag = { from: i, x, y };
      return;
    }
    if (type === 'move' && this.drag) { this.drag.x = x; this.drag.y = y; return; }
    if (type === 'up' && this.drag) {
      const from = this.drag.from; this.drag = null;
      const to = this.cellAt(x, y); if (to < 0 || to === from) return;
      const a = this.b.cells[from]!, t = this.b.cells[to];
      if (t === a && lvl(a) < MAX_LVL[chain(a)]) {
        const nc = `${chain(a)}:${lvl(a) + 1}`;
        this.b.cells[to] = nc; this.b.cells[from] = null; this.pop[to] = 1.4;
        Sfx.play('good'); this.shake = 3;
        const cx = L.gx + (to % COLS + 0.5) * L.cs, cy = L.gy + (Math.floor(to / COLS) + 0.5) * L.cs;
        this.fx.burst('sparkle', cx, cy, 10, 6.28, 120, { max: 0.6 });
        this.fx.text(cx, cy - 30, ITEM_NAMES[chain(nc)][lvl(nc)] + '!', '#ff9f1c', 0.8);
        this.scene.op({ k: 'need', who: this.scene.myId, need: 'fun', delta: 0.8 });
      } else { this.b.cells[to] = a; this.b.cells[from] = t; Sfx.play('click'); }
    }
  }
  key(k: string, d: boolean) { if (d && k >= '1' && k <= '4') this.spawn(+k - 1); }

  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const O = '#3a2a22';
    ctx.fillStyle = '#fff1dc'; ctx.fillRect(x, y, w, h);
    for (let i = 0; i < w / 30; i++) { ctx.fillStyle = i % 2 ? '#ff9ab8' : '#fff'; ctx.fillRect(x + i * 30, y, 30, 26); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // clientii de la coada
    const q = this.queue(); const ow = (w - 40) / 3;
    if (!q.length) { ctx.font = '700 14px "Baloo 2", sans-serif'; ctx.fillStyle = '#a07050'; ctx.fillText('Niciun client acum… pregătește produse 🙂 (clienții vin ziua)', x + w / 2, y + 96); }
    q.forEach((n, i) => {
      const ox = x + 20 + i * ow, oy = y + 40;
      const can = n.wants.every(want => this.b.cells.includes(want));
      ctx.fillStyle = can ? '#e3f8e0' : '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(ox, oy, ow - 8, 118, 14); ctx.fill(); ctx.stroke();
      // portretul clientului (desenat)
      const P = basePose(); P.headOnly = true; P.eyes = n.t > 80 ? 'angry' : 'dot'; P.mouth = n.t > 80 ? 'frown' : 'w'; P.blush = 0.8;
      if (n.spec) drawCharacter(ctx, n.spec, P, ox + 26, oy + 36, 0.55, 1, this.t);
      ctx.font = '700 11px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.textAlign = 'left'; ctx.fillText(n.spec?.name ?? '', ox + 48, oy + 18); ctx.textAlign = 'center';
      n.wants.forEach((cd, k) => drawItem(ctx, cd, ox + (ow - 8) / 2 + (k - (n.wants.length - 1) / 2) * 44 + 14, oy + 58, 40, this.t));
      // rabdarea
      const pk = Math.max(0, 1 - n.t / 120);
      ctx.fillStyle = '#eee'; ctx.fillRect(ox + 10, oy + 86, ow - 28, 5); ctx.fillStyle = pk > 0.4 ? '#7cc576' : '#e63946'; ctx.fillRect(ox + 10, oy + 86, (ow - 28) * pk, 5);
      ctx.font = '800 12.5px "Baloo 2", sans-serif'; ctx.fillStyle = can ? '#2a7a3a' : '#a07050';
      ctx.fillText(can ? `✔ Dă-i! ${n.pay} lei` : `💰 ${n.pay} lei`, ox + (ow - 8) / 2, oy + 104);
    });
    // tabla
    const L = this.layout();
    for (let i = 0; i < COLS * ROWS; i++) {
      const cx = L.gx + (i % COLS) * L.cs, cy = L.gy + Math.floor(i / COLS) * L.cs;
      ctx.fillStyle = (i + Math.floor(i / COLS)) % 2 ? '#f6dcbc' : '#fbe7cc'; ctx.fillRect(cx, cy, L.cs, L.cs);
      const it = this.b.cells[i];
      if (it && !(this.drag && this.drag.from === i)) {
        const s = 1 + (this.pop[i] ?? 0) * 0.25 * Math.sin((this.pop[i] ?? 0) * 6);
        if (q.some(n => n.wants.includes(it))) { ctx.fillStyle = '#c8f2c0'; ctx.beginPath(); ctx.roundRect(cx + 3, cy + 3, L.cs - 6, L.cs - 6, 10); ctx.fill(); }
        drawItem(ctx, it, cx + L.cs / 2, cy + L.cs / 2 + 2, L.cs * 0.85 * s, this.t);
        ctx.font = '800 10px "Baloo 2", sans-serif'; ctx.fillStyle = '#7a5a4a'; ctx.fillText(lvl(it) >= MAX_LVL[chain(it)] ? '★' : String(lvl(it) + 1), cx + L.cs - 9, cy + 9);
      }
    }
    ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.strokeRect(L.gx, L.gy, L.cs * COLS, L.cs * ROWS);
    // camara: sursele reale
    const w4 = (w - 40) / 4; const r = this.scene.w.res ?? {};
    CHAIN_INFO.forEach((ci, k) => {
      const bx = x + 20 + k * w4; const locked = this.servedTotal < ci.unlock;
      ctx.fillStyle = locked ? '#e8e2da' : '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, L.genY, w4 - 8, 66, 14); ctx.fill(); ctx.stroke();
      ctx.save(); if (locked) ctx.globalAlpha = 0.35; drawItem(ctx, `${ci.id}:0`, bx + (w4 - 8) / 2, L.genY + 24, 34, this.t); ctx.restore();
      ctx.font = '700 11px "Baloo 2", sans-serif'; ctx.fillStyle = O;
      ctx.fillText(locked ? `🔒 la ${ci.unlock} clienți` : `${ci.srcLabel}: ${r[ci.src] ?? 0}`, bx + (w4 - 8) / 2, L.genY + 54);
    });
    if (this.drag) { const it = this.b.cells[this.drag.from]; if (it) drawItem(ctx, it, this.drag.x, this.drag.y, L.cs, this.t); }
    ctx.textBaseline = 'alphabetic';
  }
}
