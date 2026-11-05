// Taraba lui Bubu — vedere la persoana I (2.5D) din spatele tejghelei.
// Drumul e in perspectiva, clientii (NPC) vin de departe si se apropie de tejghea.
// Pe tejghea: tava cu produse (joc de unit) si laditele cu resurse reale din camara.
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import { iconCanvas } from '../ui/icons';
import type { WorldScene, Npc } from '../scenes/world';
import { g } from '../game/gender';
import { drawItem, ITEM_NAMES, MAX_LVL } from '../world/items';
import { drawCharacter, heartPath, type CharSpec } from '../char/draw';
import { basePose } from '../char/pose';
import { nightAmount } from '../game/state';
import { catCount, catPick, type CropCat } from '../world/garden';

const have = (res: Record<string, number>, src: string) => src.startsWith('cat:') ? catCount(res, src.slice(4) as CropCat) : (res[src] ?? 0);

/** produsele prestabilite ale tarabei si sursa lor reala din inventar */
export const CHAIN_INFO: { id: string; src: string; srcLabel: string; where: string }[] = [
  { id: 'flower', src: 'cat:flower', srcLabel: 'Flori', where: 'culege sau crește în grădină 🌸' },
  { id: 'veg', src: 'cat:veg', srcLabel: 'Legume', where: 'crește-le în grădină 🥕' },
  { id: 'sweet', src: 'flour', srcLabel: 'Făină', where: 'magazinul online 🛒' },
  { id: 'drink', src: 'lemon', srcLabel: 'Lămâi', where: 'magazinul online 🛒' },
];
/** ce poate cere un client: lanturile pentru care ai (sau ai avut) resursa */
export function orderableChains(res: Record<string, number>, stats: Record<string, number>) {
  const list = CHAIN_INFO.filter(c => have(res, c.src) > 0 || (stats['had-' + c.src] ?? 0) > 0).map(c => c.id);
  return list.length ? list : ['flower'];
}
/**
 * cat plateste un client pe un produs: depinde din ce e facut (lamaile si faina se cumpara, florile si legumele
 * le cresti) si de nivel: fiecare unire valoreaza mai mult decat cele doua bucati folosite (x2,3), ca sa merite.
 * Ex. lamaie 8, limonada 18, bubble tea 42, cocktail 97 lei (o lamaie costa 5 lei la magazin).
 */
const CHAIN_BASE: Record<string, number> = { flower: 3, veg: 4, sweet: 8, drink: 8 };
export const itemValue = (code: string) => { const [ch, ls] = code.split(':'); const l = +ls; return Math.round((CHAIN_BASE[ch] ?? 3) * 2.3 ** l); };

export interface MergeBoard { v: 3; cells: (string | null)[] }
const COLS = 7, ROWS = 4;
const lvl = (c: string) => +c.split(':')[1];
const chain = (c: string) => c.split(':')[0];
export const newBoard = (): MergeBoard => ({ v: 3, cells: Array(COLS * ROWS).fill(null) });
/** tejgheaua se tine ca text („flower:2||veg:0|…”): Firebase pierde golurile din liste */
export const encBoard = (cells: (string | null)[]) => cells.map(c => c ?? '').join('|');
export const decBoard = (enc: string): MergeBoard => { const c = enc.split('|').map(x => x || null); while (c.length < COLS * ROWS) c.push(null); return { v: 3, cells: c.slice(0, COLS * ROWS) }; };
/** produsele luate de pe tejghea stau in inventar ca „prod_lant_nivel” */
export const prodKey = (code: string) => `prod_${chain(code)}_${lvl(code)}`;
export const prodCode = (key: string) => { const m = /^prod_([a-z]+)_(\d+)$/.exec(key); return m ? `${m[1]}:${m[2]}` : null; };

const O = '#3a2a22';
const SLOT_X = [0.74, 0.5, 0.26]; // pozitiile la tejghea (fractiune din latime)

export class MergeGame extends Panel {
  b: MergeBoard;
  drag: { from: number; x: number; y: number } | null = null;
  pan: { x0: number; cam0: number } | null = null;
  pop: Record<number, number> = {};
  served = 0; earned = 0;
  W = 0; H = 0; cam = 0; camT = 0; paw = 0;
  hits: { id: string; x: number; y: number; r: number }[] = [];
  clouds = [0.1, 0.45, 0.8].map((x, i) => ({ x, y: 0.06 + i * 0.04, s: 0.6 + i * 0.25 }));

  which: 'stall' | 'florist'; lastEnc = ''; invOpen = false;
  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, scene.storeMode === 'florarie' ? '💐 Florăria lui Bubu' : '🧺 Taraba lui Bubu', '');
    this.which = scene.storeMode === 'florarie' ? 'florist' : 'stall';
    const saved = scene.w.boards?.[this.which];
    if (saved) this.b = decBoard(saved);
    else {
      // prima data: mutam pe tejgheaua comuna ce aveai pe tava ta veche
      const c = scene.w.chars[scene.myId] as any;
      this.b = this.which === 'stall' && c.merge?.v === 3 ? { v: 3, cells: [...c.merge.cells] } : newBoard();
      this.commit();
    }
    this.lastEnc = encBoard(this.b.cells);
  }
  /** trimite tejgheaua (s-a schimbat ceva pe ea) */
  commit() { const enc = encBoard(this.b.cells); this.lastEnc = enc; this.scene.op({ k: 'board', which: this.which, enc }); }
  /** iei produsul de pe tejghea in inventar */
  takeToBag(i: number) {
    const it = this.b.cells[i]; if (!it) return;
    this.b.cells[i] = null; this.commit();
    this.scene.op({ k: 'res', res: prodKey(it), delta: 1 });
    Sfx.play('cloth', { vol: 0.6 }); this.fx.text(this.W - 70, this.layout().genY - 10, 'În inventar 🎒', '#2ec4b6', 0.8);
  }
  /** pui pe tejghea un produs din inventar */
  putFromBag(key: string) {
    const code = prodCode(key); if (!code || (this.scene.w.res?.[key] ?? 0) < 1) return;
    const i = this.b.cells.findIndex(c => !c); if (i < 0) { this.fx.text(this.W / 2, this.counterY + 30, 'Tejgheaua e plină! 🙂', '#e63946', 0.9); Sfx.play('bad'); return; }
    this.b.cells[i] = code; this.pop[i] = 1; this.commit();
    this.scene.op({ k: 'res', res: key, delta: -1 }); Sfx.play('pop');
  }
  bagProds() { const r = this.scene.w.res ?? {}; return Object.keys(r).filter(k => k.startsWith('prod_') && r[k] > 0 && (this.which === 'florist' ? k.startsWith('prod_flower') : true)).sort(); }
  abort() { this.scene.sendCharSync(); this.finish(this.served > 0 ? 1 : 0.2, this.served ? `Ai câștigat ${this.earned} lei! 💰` : 'Taraba se închide 👋'); }
  tick(dt: number) {
    const enc = this.scene.w.boards?.[this.which];
    if (enc && enc !== this.lastEnc && !this.drag) { this.b = decBoard(enc); this.lastEnc = enc; }
    for (const k in this.pop) { this.pop[k] -= dt * 3; if (this.pop[k] <= 0) delete this.pop[k]; }
    this.paw = Math.max(0, this.paw - dt * 3);
    // camera urmareste clientul care tocmai vine
    if (!this.pan) {
      const v = this.scene.shopNpcs().find(n => n.state === 'come') ?? this.queue()[0];
      this.camT = v ? (this.npcScreen(v).fx - 0.5) * 0.5 : 0;
      this.cam += (this.camT - this.cam) * Math.min(1, dt * 1.5);
    }
    for (const c of this.clouds) { c.x += dt * 0.006 * c.s; if (c.x > 1.3) c.x = -0.3; }
  }

  // ---- geometrie (tot ecranul)
  get horizon() { return this.H * 0.2; }
  get counterY() { return this.H * 0.5; }
  layout() {
    const W = this.W, H = this.H;
    const top = this.counterY + H * 0.07, crateH = Math.min(86, H * 0.12);
    const cs = Math.floor(Math.min((W - 40) / COLS, (H - top - crateH - 24) / ROWS));
    return { cs, gx: (W - cs * COLS) / 2, gy: top, genY: top + cs * ROWS + 8, crateH };
  }
  cellAt(x: number, y: number) {
    const L = this.layout(); const c = Math.floor((x - L.gx) / L.cs), r = Math.floor((y - L.gy) / L.cs);
    return c >= 0 && c < COLS && r >= 0 && r < ROWS ? r * COLS + c : -1;
  }
  queue() { return this.scene.shopNpcs().filter(n => n.state === 'wait').slice(0, 3); }
  slotOf(n: Npc) { const q = this.scene.shopNpcs().filter(m => m.state !== 'leave'); return Math.max(0, Math.min(2, q.indexOf(n))); }

  /** unde se vede un NPC in perspectiva: fx (0..1 pe latime, inainte de camera), adancime k (0 departe, 1 la tejghea) */
  npcScreen(n: Npc) {
    const slotWorld = [9.6, 8.3, 7.0][this.slotOf(n)];
    const sx = SLOT_X[this.slotOf(n)];
    if (n.state === 'leave') { const v = Math.max(0, Math.min(1, (n.x - slotWorld) / 6)); return { fx: sx + v * 0.9, k: 1 - Math.min(1, v * 2.2) }; }
    const x0 = n.sx ?? -1, u = Math.max(0, Math.min(1, (n.x - x0) / (slotWorld - x0)));
    const kk = Math.max(0, (u - 0.55) / 0.45);
    return { fx: -0.25 + u * (sx + 0.25), k: n.state === 'wait' ? 1 : kk * kk * (3 - 2 * kk) };
  }

  spawn(k: number) {
    const ci = CHAIN_INFO[k]; if (!ci) return;
    const msg = (t: string) => { this.fx.text(this.W / 2, this.counterY + 30, t, '#e63946', 0.9); Sfx.play('bad'); };
    const r = this.scene.w.res ?? {};
    if (have(r, ci.src) < 1) return msg(`N-ai ${ci.srcLabel.toLowerCase()} — ${ci.where}`);
    const c = this.scene.w.chars[this.scene.myId];
    if (c.needs.energy < 6) return msg(`${g(this.scene.myId, 'Ești prea obosit', 'Ești prea obosită')} 😴`);
    const empty = this.b.cells.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    if (!empty.length) return msg('Tava e plină! Unește ceva 🙂');
    const i = empty[0];
    this.b.cells[i] = `${ci.id}:0`; this.pop[i] = 1; Sfx.play('leaves', { vol: 0.4, rate: 1.4 }); this.paw = 1; this.commit();
    const key = ci.src.startsWith('cat:') ? catPick(r, ci.src.slice(4) as CropCat)! : ci.src;
    this.scene.op({ k: 'res', res: key, delta: -1 });
    this.scene.op({ k: 'stat', key: 'had-' + ci.src, delta: 1 });
    this.scene.op({ k: 'need', who: this.scene.myId, need: 'energy', delta: -0.1 });
  }

  deliver(npcId: string) {
    const npc = this.scene.shopNpcs().find(n => n.id === npcId); if (!npc || npc.state !== 'wait') return;
    const idx: number[] = [];
    for (const want of npc.wants) { const i = this.b.cells.findIndex((v, k) => v === want && !idx.includes(k)); if (i < 0) { Sfx.play('bad'); this.fx.text(this.W / 2, this.counterY - 20, 'Încă nu ai ce cere ' + (npc.spec?.name.split(' ')[1] ?? 'clientul'), '#e63946', 0.9); npc.actor?.play('puppy'); return; } idx.push(i); }
    for (const i of idx) this.b.cells[i] = null;
    this.commit();
    let pay = npc.pay;
    const grassy = Object.keys(this.scene.w.grass ?? {}).length > 15;
    if (grassy) pay = Math.round(pay * 0.8);
    if (this.scene.myId === 'bubu') pay = Math.round(pay * 1.2); // e taraba ei :)
    if (this.scene.storeMode === 'florarie') pay = Math.round(pay * ((this.scene.w.stats['dipl-florist-' + this.scene.myId] ?? 0) > 0 ? 1.8 : 1.5)); // cursul de florist: +30%
    this.scene.serveNpc(npcId, pay);
    this.served++; this.earned += pay; this.paw = 1;
    Sfx.play('register');
    const p = this.npcScreen(npc);
    this.fx.text((p.fx - this.cam) * this.W, this.counterY - this.H * 0.25, `+${pay} lei${grassy ? ' (curte netunsă -20%)' : ''}`, '#2ec4b6', 1.1);
    this.fx.hearts((p.fx - this.cam) * this.W, this.counterY - this.H * 0.2, 6);
    this.scene.sendCharSync();
  }

  pointer(type: string, x: number, y: number) {
    const L = this.layout();
    if (type === 'down') {
      for (const h of this.hits) if (Math.hypot(x - h.x, y - h.y) < h.r) { this.deliver(h.id); return; }
      if (this.invOpen) { this.invTap(x, y); return; }
      if (y > L.genY && y < L.genY + L.crateH) { const w5 = (this.W - 40) / 5; const k = Math.floor((x - 20) / w5); if (k >= 0 && k < 4) this.spawn(k); else if (k === 4) { this.invOpen = true; Sfx.play('cloth', { vol: 0.5 }); } return; }
      const i = this.cellAt(x, y);
      if (i >= 0 && this.b.cells[i]) { this.drag = { from: i, x, y }; return; }
      if (y < this.counterY) this.pan = { x0: x, cam0: this.cam };
      return;
    }
    if (type === 'move') { if (this.drag) { this.drag.x = x; this.drag.y = y; } if (this.pan) this.cam = Math.max(-0.35, Math.min(0.35, this.pan.cam0 - (x - this.pan.x0) / this.W)); return; }
    if (type === 'up') {
      this.pan = null;
      if (!this.drag) return;
      const from = this.drag.from; this.drag = null;
      // aruncat peste 🎒 = il iei in inventar
      { const w5 = (this.W - 40) / 5; if (y > L.genY && y < L.genY + L.crateH && x > 20 + 4 * w5) { this.takeToBag(from); return; } }
      // aruncat peste un client = i-l dai
      for (const h of this.hits) if (Math.hypot(x - h.x, y - h.y) < h.r * 1.3) { this.deliver(h.id); return; }
      const to = this.cellAt(x, y); if (to < 0 || to === from) return;
      const a = this.b.cells[from]!, t = this.b.cells[to];
      if (t === a && lvl(a) < MAX_LVL[chain(a)]) {
        const nc = `${chain(a)}:${lvl(a) + 1}`;
        this.b.cells[to] = nc; this.b.cells[from] = null; this.pop[to] = 1.4; this.commit();
        Sfx.play('good'); this.shake = 3; this.paw = 1;
        const cx = L.gx + (to % COLS + 0.5) * L.cs, cy = L.gy + (Math.floor(to / COLS) + 0.5) * L.cs;
        this.fx.burst('sparkle', cx, cy, 10, 6.28, 120, { max: 0.6 });
        this.fx.text(cx, cy - 30, ITEM_NAMES[chain(nc)][lvl(nc)] + '!', '#ff9f1c', 0.8);
        this.scene.op({ k: 'need', who: this.scene.myId, need: 'fun', delta: 0.8 });
      } else { this.b.cells[to] = a; this.b.cells[from] = t; Sfx.play('click'); this.commit(); }
    }
  }
  invBox() { const w = Math.min(this.W - 40, 520), h = Math.min(this.H * 0.6, 300); return { x: (this.W - w) / 2, y: this.H - h - 20, w, h }; }
  invCell(i: number) { const B = this.invBox(), cols = 6, cw = (B.w - 24) / cols; return { x: B.x + 12 + (i % cols) * cw, y: B.y + 44 + Math.floor(i / cols) * 74, w: cw - 6, h: 68 }; }
  invTap(x: number, y: number) {
    const B = this.invBox(); if (x < B.x || x > B.x + B.w || y < B.y || y > B.y + B.h || (x > B.x + B.w - 40 && y < B.y + 40)) { this.invOpen = false; return; }
    this.bagProds().forEach((k, i) => { const c = this.invCell(i); if (x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h) this.putFromBag(k); });
  }
  drawInv(ctx: CanvasRenderingContext2D) {
    const B = this.invBox(), r = this.scene.w.res ?? {}, list = this.bagProds();
    ctx.fillStyle = 'rgba(40,20,30,.35)'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.fillStyle = '#fff8f0'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(B.x, B.y, B.w, B.h, 18); ctx.fill(); ctx.stroke();
    ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.textAlign = 'center'; ctx.fillText(list.length ? '🎒 Atinge un produs ca să-l pui pe tejghea' : '🎒 N-ai produse în inventar · trage unul aici de pe tejghea', B.x + B.w / 2, B.y + 24);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(B.x + B.w - 20, B.y + 20, 13, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = O; ctx.fillText('✕', B.x + B.w - 20, B.y + 25);
    list.forEach((k, i) => { const c = this.invCell(i), code = prodCode(k)!; if (c.y + c.h > B.y + B.h) return; ctx.fillStyle = '#fbe7cc'; ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 10); ctx.fill(); ctx.stroke(); drawItem(ctx, code, c.x + c.w / 2, c.y + 28, 40, this.t); ctx.font = '800 11px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.fillText(`×${r[k]}`, c.x + c.w / 2, c.y + c.h - 8); });
  }
  key(k: string, d: boolean) {
    if (!d) return;
    if (k >= '1' && k <= '4') this.spawn(+k - 1);
    if (k === 'arrowleft' || k === 'a') this.cam = Math.max(-0.35, this.cam - 0.08);
    if (k === 'arrowright' || k === 'd') this.cam = Math.min(0.35, this.cam + 0.08);
    if (k === ' ' || k === 'e') { const q = this.queue()[0]; if (q) this.deliver(q.id); }
  }
  scene2() { /* desenam tot ecranul in draw() */ }

  // ------------------------------------------------------------------ desen
  draw(ctx: CanvasRenderingContext2D, W: number, H: number) {
    this.W = W; this.H = H; this.box = { x: 0, y: 0, w: W, h: H };
    const night = nightAmount(this.scene.w.minutes);
    ctx.save();
    if (this.shake > 0.3) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    this.drawWorld(ctx, W, H, night);
    this.drawCounter(ctx, W, H);
    this.fx.draw(ctx);
    // butonul X + titlul
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W - 20, 18, 15, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 26, 12); ctx.lineTo(W - 14, 24); ctx.moveTo(W - 14, 12); ctx.lineTo(W - 26, 24); ctx.stroke();
    if (this.ended) {
      const k = Math.min(1, this.ended.t * 3);
      ctx.fillStyle = `rgba(255,255,255,${0.75 * k})`; ctx.fillRect(0, H / 2 - 50, W, 100);
      ctx.font = '900 30px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff4d6d'; ctx.fillText(this.ended.text, W / 2, H / 2);
    }
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }

  drawWorld(ctx: CanvasRenderingContext2D, W: number, H: number, night: number) {
    const hz = this.horizon, cy = this.counterY;
    const par = (f: number) => -this.cam * W * f; // parallax
    // cerul
    const sky = ctx.createLinearGradient(0, 0, 0, hz + 40);
    sky.addColorStop(0, night > 0.5 ? '#1d2550' : '#8fd3ff'); sky.addColorStop(1, night > 0.5 ? '#4a3f75' : '#fff1d6');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, cy);
    // soarele
    ctx.fillStyle = night > 0.5 ? '#fff6b0' : '#ffd23f'; ctx.beginPath(); ctx.arc(W * 0.78 + par(0.05), hz * 0.45, 22, 0, 7); ctx.fill();
    // nori
    for (const c of this.clouds) { const x = c.x * W * 1.4 - W * 0.2 + par(0.1), y = c.y * H; ctx.fillStyle = '#ffffffdd'; for (const [dx, dy, r] of [[0, 0, 18], [18, -6, 22], [38, 0, 16]]) { ctx.beginPath(); ctx.arc(x + dx * c.s, y + dy * c.s, r * c.s, 0, 7); ctx.fill(); } }
    // dealuri (3 straturi)
    const hill = (f: number, base: number, amp: number, col: string, seed: number) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-10, cy);
      for (let x = -10; x <= W + 10; x += 12) { const wx = x - par(f); ctx.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(wx * 0.006 + seed) * Math.cos(wx * 0.011 + seed * 2))); }
      ctx.lineTo(W + 10, cy); ctx.closePath(); ctx.fill();
    };
    hill(0.15, hz + 4, 40, night > 0.5 ? '#3d4a6e' : '#b8e0a8', 1);
    hill(0.3, hz + 18, 26, night > 0.5 ? '#34405f' : '#9fd68c', 3);
    // casute departe
    for (const [fx, c] of [[0.15, '#ff9ab8'], [0.62, '#ffd6a5'], [1.05, '#bde0fe']] as const) {
      const x = fx * W + par(0.3), y = hz + 14;
      ctx.fillStyle = c; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.fillRect(x, y - 14, 22, 14); ctx.strokeRect(x, y - 14, 22, 14);
      ctx.fillStyle = '#c0573e'; ctx.beginPath(); ctx.moveTo(x - 3, y - 14); ctx.lineTo(x + 11, y - 24); ctx.lineTo(x + 25, y - 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (night > 0.5) { ctx.fillStyle = '#ffe680'; ctx.fillRect(x + 8, y - 9, 6, 5); }
    }
    // campul de dincolo de drum
    const fieldTop = hz + 24, roadFar = cy - (cy - hz) * 0.42, roadNear = cy + 6;
    ctx.fillStyle = night > 0.5 ? '#2e5a3a' : '#a6dc93'; ctx.fillRect(0, fieldTop, W, roadFar - fieldTop);
    // gard + copaci in departare
    for (let i = -2; i < 14; i++) {
      const x = i * W / 10 + par(0.55) % (W / 10);
      ctx.strokeStyle = '#c4935f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, roadFar - 2); ctx.lineTo(x, roadFar - 16); ctx.stroke();
      if (i % 3 === 0) { ctx.fillStyle = '#7fd07f'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 20, roadFar - 34, 16, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#a0703f'; ctx.fillRect(x + 18, roadFar - 20, 4, 18); }
    }
    ctx.strokeStyle = '#c4935f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, roadFar - 12); ctx.lineTo(W, roadFar - 12); ctx.moveTo(0, roadFar - 6); ctx.lineTo(W, roadFar - 6); ctx.stroke();
    // drumul in perspectiva (mai lat aproape)
    const rg = ctx.createLinearGradient(0, roadFar, 0, roadNear); rg.addColorStop(0, '#d9c29b'); rg.addColorStop(1, '#bfa47c');
    ctx.fillStyle = rg; ctx.fillRect(0, roadFar, W, roadNear - roadFar);
    // fagase si pietricele (se misca cu camera, mai repede aproape)
    for (let i = 0; i < 40; i++) {
      const depth = (i % 8) / 8; const yy = roadFar + depth * (roadNear - roadFar);
      const sp = 0.6 + depth * 0.9; const x = ((i * 137) % 1000) / 1000 * W * 1.6 - W * 0.3 + par(sp);
      ctx.fillStyle = '#a88f6a'; ctx.beginPath(); ctx.ellipse(((x % (W * 1.6)) + W * 1.6) % (W * 1.6) - W * 0.3, yy, 2 + depth * 4, 1 + depth * 2, 0, 0, 7); ctx.fill();
    }
    // clientii (de la departe spre aproape)
    const list = [...this.scene.shopNpcs()].map(n => ({ n, p: this.npcScreen(n) })).sort((a, b) => a.p.k - b.p.k);
    this.hits = [];
    for (const { n, p } of list) {
      if (!n.spec || !n.actor) continue;
      const sx = (p.fx - this.cam * (0.6 + p.k * 0.4)) * W;
      const y = roadFar + 10 + p.k * (cy + H * 0.08 - roadFar - 10);
      const sc = (0.75 + p.k * 1.9) * Math.min(1.4, H / 700);
      const pose = { ...n.actor.pose };
      const walkingSide = n.state !== 'wait' && p.k < 0.95;
      pose.back = false; if (walkingSide) pose.headRot = 0;
      drawCharacter(ctx, n.spec as CharSpec, pose, sx, y, sc, (n.state === 'leave' || walkingSide) ? 1 : 1, this.t, n.actor.outfit);
      if (n.state === 'wait') this.drawOrder(ctx, n, sx, Math.max(Math.min(54, 30 * sc) + 104, y - 96 * sc), sc);
    }
  }

  drawOrder(ctx: CanvasRenderingContext2D, n: Npc, x: number, y: number, sc: number) {
    const k = n.wants.length, s = Math.min(54, 30 * sc);
    const bw = Math.max(110, 20 + k * (s + 6)), bh = s + 46;
    const can = n.wants.every(w => this.b.cells.includes(w));
    ctx.fillStyle = can ? '#e3f8e0' : '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x - bw / 2, y - bh, bw, bh, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, y - 1); ctx.lineTo(x, y + 10); ctx.lineTo(x + 6, y - 1); ctx.fill(); ctx.stroke();
    n.wants.forEach((c, i) => drawItem(ctx, c, x + (i - (k - 1) / 2) * (s + 6), y - bh / 2 + 2, s, this.t));
    const pk = Math.max(0, 1 - n.t / 120);
    ctx.fillStyle = '#eee'; ctx.fillRect(x - bw / 2 + 8, y - 14, bw - 16, 5); ctx.fillStyle = pk > 0.4 ? '#7cc576' : '#e63946'; ctx.fillRect(x - bw / 2 + 8, y - 14, (bw - 16) * pk, 5);
    ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = can ? '#2a7a3a' : '#7a5a4a';
    ctx.fillText(`${n.spec?.name ?? ''} · ${n.pay} lei`, x, y - bh + 12);
    this.hits.push({ id: n.id, x, y: y - bh / 2, r: Math.max(bw, bh) / 1.6 });
  }

  drawCounter(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const cy = this.counterY;
    // copertina cu dungi + stalpi (ne incadreaza privirea)
    const stripe = 46;
    for (let i = 0; i < W / stripe + 1; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#ff9ab8';
      ctx.beginPath(); ctx.moveTo(i * stripe, 0); ctx.lineTo((i + 1) * stripe, 0); ctx.lineTo((i + 1) * stripe, 34); ctx.quadraticCurveTo((i + 0.5) * stripe, 50, i * stripe, 34); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < W / stripe + 1; i++) { ctx.moveTo(i * stripe, 34); ctx.quadraticCurveTo((i + 0.5) * stripe, 50, (i + 1) * stripe, 34); } ctx.stroke();
    for (const x of [10, W - 26]) { ctx.fillStyle = '#c98e5f'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, 30, 16, cy - 20, 4); ctx.fill(); ctx.stroke(); }
    // tejgheaua (blatul din fata, apoi suprafata)
    ctx.fillStyle = '#b07a4f'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-6, cy, W + 12, H * 0.05, 6); ctx.fill(); ctx.stroke();
    const top = cy + H * 0.05;
    const wood = ctx.createLinearGradient(0, top, 0, H); wood.addColorStop(0, '#e7b98a'); wood.addColorStop(1, '#d19a68');
    ctx.fillStyle = wood; ctx.fillRect(0, top, W, H - top);
    ctx.strokeStyle = '#c48b5c'; ctx.lineWidth = 1.5; for (let y = top + 18; y < H; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + 4); ctx.stroke(); }
    // borcanul cu bani si cartonasul
    const jx = W - 54, jy = cy - 2;
    ctx.fillStyle = '#e3f6ffcc'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(jx - 20, jy - 40, 40, 42, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; for (let i = 0; i < Math.min(8, 1 + Math.floor((this.scene.w.money ?? 0) / 25)); i++) { ctx.beginPath(); ctx.ellipse(jx - 8 + (i % 3) * 8, jy - 6 - Math.floor(i / 3) * 6, 6, 3, 0, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = O; ctx.fillText(`${this.scene.w.money ?? 0} lei`, jx, jy - 50);
    ctx.fillStyle = '#fff8ef'; ctx.beginPath(); ctx.roundRect(24, cy - 32, 120, 28, 6); ctx.fill(); ctx.stroke();
    ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.fillStyle = '#ff4d6d'; ctx.fillText(this.scene.storeMode === 'florarie' ? 'Florăria lui Bubu' : 'Taraba lui Bubu', 84, cy - 18);
    // tava cu produse
    const L = this.layout(); const q = this.queue();
    ctx.fillStyle = '#c48b5c'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(L.gx - 10, L.gy - 10, L.cs * COLS + 20, L.cs * ROWS + 20, 14); ctx.fill(); ctx.stroke();
    for (let i = 0; i < COLS * ROWS; i++) {
      const x = L.gx + (i % COLS) * L.cs, y = L.gy + Math.floor(i / COLS) * L.cs;
      ctx.fillStyle = (i + Math.floor(i / COLS)) % 2 ? '#f6dcbc' : '#fbe7cc'; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, L.cs - 4, L.cs - 4, 8); ctx.fill();
      const it = this.b.cells[i];
      if (it && !(this.drag && this.drag.from === i)) {
        const s = 1 + (this.pop[i] ?? 0) * 0.2 * Math.sin((this.pop[i] ?? 0) * 8);
        if (q.some(n => n.wants.includes(it))) { ctx.strokeStyle = '#2ec4b6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + 4, y + 4, L.cs - 8, L.cs - 8, 8); ctx.stroke(); }
        ctx.fillStyle = 'rgba(60,35,30,0.15)'; ctx.beginPath(); ctx.ellipse(x + L.cs / 2, y + L.cs * 0.82, L.cs * 0.3, L.cs * 0.08, 0, 0, 7); ctx.fill();
        drawItem(ctx, it, x + L.cs / 2, y + L.cs / 2, L.cs * 0.9 * s, this.t);
        ctx.font = '800 10px "Baloo 2", sans-serif'; ctx.fillStyle = '#7a5a4a'; ctx.fillText(lvl(it) >= MAX_LVL[chain(it)] ? '★' : String(lvl(it) + 1), x + L.cs - 10, y + 10);
      }
    }
    // ladițele cu resurse reale
    const w4 = (W - 40) / 5; const r = this.scene.w.res ?? {};
    CHAIN_INFO.forEach((ci, k) => {
      const bx = 20 + k * w4, by = L.genY, n = have(r, ci.src);
      ctx.fillStyle = '#c98e5f'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, by + L.crateH * 0.35, w4 - 10, L.crateH * 0.62, 8); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#a0703f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 4, by + L.crateH * 0.62); ctx.lineTo(bx + w4 - 14, by + L.crateH * 0.62); ctx.stroke();
      ctx.save(); if (!n) ctx.globalAlpha = 0.3;
      for (let i = 0; i < Math.min(3, Math.max(1, n)); i++) drawItem(ctx, `${ci.id}:0`, bx + (w4 - 10) / 2 + (i - 1) * 16, by + L.crateH * 0.32, L.crateH * 0.55, this.t);
      ctx.restore();
      ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(n ? `${ci.srcLabel} ×${n}` : `${ci.srcLabel}: 0`, bx + (w4 - 10) / 2, by + L.crateH * 0.8);
    });
    // 🎒 inventarul: trage aici un produs ca sa-l pastrezi, atinge ca sa pui unul inapoi
    { const bx = 20 + 4 * w4, by = L.genY, n = this.bagProds().reduce((a, k) => a + (r[k] ?? 0), 0), hot = this.drag && this.drag.y > L.genY - 20 && this.drag.x > bx;
      ctx.fillStyle = hot ? '#ffe1ea' : '#8fb8de'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, by + L.crateH * 0.22, w4 - 10, L.crateH * 0.75, 12); ctx.fill(); ctx.stroke();
      const ic = iconCanvas('🎒', 96); if (ic) ctx.drawImage(ic, bx + (w4 - 10) / 2 - L.crateH * 0.25, by + L.crateH * 0.24, L.crateH * 0.5, L.crateH * 0.5);
      ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(`Inventar${n ? ' ×' + n : ''}`, bx + (w4 - 10) / 2, by + L.crateH * 0.86); }
    // labutele mele sprijinite pe tejghea
    const spec = this.scene.me.actor.spec;
    for (const side of [-1, 1]) {
      const px = W / 2 + side * (W * 0.36), py = cy + H * 0.05 + 6 - this.paw * 10 * (side > 0 ? 1 : 0.6);
      ctx.fillStyle = spec.body; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, py, 26, 16, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = spec.id === 'dudu' ? '#ecc39a' : '#ffd3dd'; ctx.beginPath(); ctx.ellipse(px, py + 3, 9, 6, 0, 0, 7); ctx.fill();
      for (const k of [-10, 0, 10]) { ctx.beginPath(); ctx.ellipse(px + k, py - 7, 3, 2.4, 0, 0, 7); ctx.fill(); }
    }
    // produsul tras
    if (this.drag) { const it = this.b.cells[this.drag.from]; if (it) drawItem(ctx, it, this.drag.x, this.drag.y, L.cs * 1.1, this.t); }
    if (!q.length) { ctx.font = '700 14px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 4; const tt = this.scene.w.minutes / 60 >= 20 || this.scene.w.minutes / 60 < 7 ? 'E noapte, clienții vin dimineață 🌙' : 'Pregătește produse… vin clienți pe drum 🚶'; ctx.strokeText(tt, W / 2, cy - 14); ctx.fillText(tt, W / 2, cy - 14); }
    if (this.invOpen) this.drawInv(ctx);
    heartPath(ctx, 0, 0, 0); // (pastreaza importul)
    void basePose;
  }
}
