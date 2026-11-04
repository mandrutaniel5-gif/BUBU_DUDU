// 🍳 Bucataria: gatesti o reteta pas cu pas: tai ingredientele, le pui in oala / tigaie / tava,
// apoi amesteci (ciorbe, mamaliga), intorci la timp (omleta, papanasi, peste) sau scoti din cuptor (pizza, placinta).
import { Panel, HIT_SLACK } from './base';
import { Sfx } from '../engine/sfx';
import { iconCanvas } from '../ui/icons';
import { RECIPE, RECIPES, consumeList, ingIcon, type Recipe } from '../game/food';
import type { WorldScene } from '../scenes/world';

const O = '#3a2a22';
const CHOP = new Set(['carrot', 'potato', 'tomato', 'cabbage', 'mushroom', 'veg', 'meat', 'fish', 'lemon', 'strawberry', 'berry', 'cheese', 'tulip', 'rose', 'sunflower', 'flower']);
const LIQUID = new Set(['water', 'milk']);
interface Item { k: string; icon: string; cuts: number; need: number; x: number; y: number; fly: number; inPot: boolean }

export class CookGame extends Panel {
  rc: Recipe;
  /** pentru lume: ce s-a gatit si cat de bine */
  recipe: string; quality = 0;
  items: Item[] = [];
  phase: 'prep' | 'cook' | 'serve' = 'prep';
  stir = 0; lastAng: number | null = null; dragging = false; idle = 0; stuck = 0;
  brown = 0; side = 0; sideQ: number[] = []; flipT = 0; ovenOpen = 0;
  knife = 0; spoon = 0; misses = 0;
  constructor(scene: WorldScene, done: (s: number) => void) {
    const rc = RECIPE[scene.cookRecipe ?? ''] ?? RECIPES[0];
    super(scene, done, `${rc.icon} ${rc.name}`, rc.method === 'boil' || rc.method === 'cold' ? 'Atinge ingredientele (taie-le), apoi amestecă în cerc' : rc.method === 'oven' ? 'Atinge ingredientele, apoi scoate tava când e aurie' : 'Atinge ingredientele, apoi întoarce când e aurie');
    this.rc = rc; this.recipe = rc.id;
    const list = consumeList(scene.w.res ?? {}, rc);
    const flat: string[] = []; for (const [k, n] of list) for (let i = 0; i < n; i++) flat.push(k);
    flat.forEach(k => this.items.push({ k, icon: ingIcon(k), cuts: 0, need: CHOP.has(k) ? 3 : 1, x: 0, y: 0, fly: 0, inPot: false }));
    this.hero.play('act_cook');
  }
  /** sunetele de fundal ale minijocului (citite de peisajul sonor) */
  get loops(): [string, number][] {
    const m = this.rc.method;
    if (this.phase === 'prep') return [['amb_room', 0.3]];
    if (m === 'boil') return [['boil_loop', 0.45]];
    if (m === 'fry' || m === 'pancakes') return [['sizzle_loop', 0.45]];
    if (m === 'oven') return [['fire_loop', 0.3]];
    return [['amb_room', 0.3]];
  }
  get pot() { const b = this.box; return { x: b.x + b.w * 0.74, y: b.y + b.h * 0.6, r: Math.min(b.w * 0.15, b.h * 0.16) }; }
  layout() {
    const b = this.box, n = this.items.length;
    const x0 = b.x + b.w * 0.1, x1 = b.x + b.w * 0.56;
    this.items.forEach((it, i) => { if (it.fly > 0 || it.inPot) return; it.x = n === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * (i / (n - 1)); it.y = b.y + b.h * 0.76; });
  }
  tick(dt: number) {
    this.knife = Math.max(0, this.knife - dt * 5); this.spoon = Math.max(0, this.spoon - dt * 3);
    this.ovenOpen = Math.max(0, this.ovenOpen - dt);
    if (!this.hero.busy) this.hero.play('act_cook');
    const P = this.pot;
    for (const it of this.items) if (it.fly > 0 && !it.inPot) {
      it.fly += dt * 1.8; const k = Math.min(1, it.fly);
      it.x += (P.x - it.x) * Math.min(1, dt * 6); it.y = it.y + (P.y - 10 - it.y) * Math.min(1, dt * 6) - Math.sin(k * Math.PI) * 4;
      if (it.fly >= 1) { it.inPot = true; this.plop(it.k); }
    }
    if (this.phase === 'prep' && this.items.every(i => i.inPot)) { this.phase = 'cook'; this.lastAng = null; if (this.rc.method === 'oven') { Sfx.play('door_close', { vol: 0.5 }); } }
    if (this.phase !== 'cook') return;
    const m = this.rc.method;
    if (m === 'boil' || m === 'cold') {
      this.idle += dt;
      if (m === 'boil' && this.idle > 2.6) { this.idle = 0; this.stuck++; this.fx.text(P.x, P.y - 70, 'Se prinde de fund! Amestecă! 😱', '#e63946', 0.8); Sfx.play('bad', { vol: 0.5 }); this.shake = 4; }
      if (this.stir >= 1) this.serve(Math.max(0.2, 1 - this.stuck * 0.18));
    } else {
      // tigaie / cuptor: se rumeneste; atinge cand e auriu
      this.brown += dt * (m === 'oven' ? 0.22 : 0.34);
      if (this.flipT > 0) this.flipT = Math.max(0, this.flipT - dt * 2.2);
      if (this.brown > 1.35) { this.fx.text(P.x, P.y - 70, 'S-a ars! 🔥', '#6d4c41', 1.1); this.fx.burst('puff', P.x, P.y - 20, 12, 3, 60, { color: '#555' }); Sfx.play('cough', { vol: 0.6 }); this.take(0.1); }
    }
  }
  plop(k: string) {
    const m = this.rc.method;
    if (LIQUID.has(k)) Sfx.play('pour', { vol: 0.55, rate: 1.15 });
    else if (k === 'egg') { Sfx.play('squelch', { vol: 0.6, rate: 1.4 }); }
    else if (k === 'flour' || k === 'cornmeal' || k === 'rice') Sfx.play('leaves', { vol: 0.35, rate: 1.6 });
    else if (m === 'boil') Sfx.play('splash', { vol: 0.35, rate: 1.3 });
    else if (m === 'fry' || m === 'pancakes') Sfx.play('pan', { vol: 0.35 });
    else Sfx.play('dishes', { vol: 0.35 });
    const P = this.pot; this.fx.burst(m === 'boil' ? 'drop' : 'sparkle', P.x, P.y - 14, 6, 2.4, 90, { grav: 260, max: 0.5, color: '#bde7ff' });
  }
  /** rezultatul unei atingeri in tigaie / cuptor */
  take(q: number) {
    const m = this.rc.method;
    this.sideQ.push(q);
    const P = this.pot;
    this.fx.text(P.x, P.y - 80, q > 0.8 ? 'Aurie, perfect! ✨' : q > 0.5 ? 'Bună!' : q > 0.2 ? 'Cam crudă / prea rumenă…' : 'Ups…', q > 0.8 ? '#2ec4b6' : q > 0.4 ? '#ff9f1c' : '#e63946', 0.9);
    if (m === 'oven' || this.side >= 1) { this.serve(this.sideQ.reduce((a, b) => a + b, 0) / this.sideQ.length); return; }
    this.side++; this.brown = 0; this.flipT = 1; Sfx.play('whoosh'); Sfx.play('pan', { vol: 0.25, delay: 0.3 }); this.hero.play('wave');
  }
  serve(q: number) {
    if (this.phase === 'serve') return;
    this.phase = 'serve'; this.quality = q;
    Sfx.play('clink'); if (q > 0.6) { Sfx.play('good', { vol: 0.6, delay: 0.2 }); this.hero.play('laugh'); } else this.hero.play('shy');
    const P = this.pot; this.fx.hearts(P.x, P.y - 40, q > 0.8 ? 8 : 4);
    const extra = q > 0.8 ? 1 : 0;
    this.finish(1 + q, q > 0.8 ? `${this.rc.name}: PERFECT! +${this.rc.portions + extra} porții 💕` : q > 0.45 ? `${this.rc.name} gata! +${this.rc.portions} porții` : `Se poate mânca… 😅 +${this.rc.portions} porții`);
  }
  tapItem(x: number, y: number) {
    const s = Math.min(64, this.box.w * 0.11);
    for (const it of this.items) {
      if (it.fly > 0 || it.inPot) continue;
      if (Math.abs(x - it.x) < s * 0.7 && Math.abs(y - it.y) < s * 0.75) {
        it.cuts++;
        if (it.need > 1) { this.knife = 1; Sfx.play(it.k === 'meat' || it.k === 'fish' ? 'squelch' : 'knife', { vol: 0.8 }); this.fx.burst('drop', it.x, it.y, 5, 3, 110, { grav: 300, max: 0.5, color: '#c8e7a7' }); this.fx.text(it.x, it.y - 40, ['Tac!', 'Toc!', 'Gata!'][Math.min(2, it.cuts - 1)], '#8b5e34', 0.7); }
        if (it.cuts >= it.need) it.fly = 0.01;
        return true;
      }
    }
    return false;
  }
  pointer(type: string, x: number, y: number) {
    if (this.ended) return;
    const P = this.pot, m = this.rc.method;
    if (type === 'down') this.dragging = true;
    if (type === 'up') { this.dragging = false; this.lastAng = null; }
    if (this.phase === 'prep') { if (type === 'down') this.tapItem(x, y); return; }
    if (this.phase !== 'cook') return;
    if (m === 'boil' || m === 'cold') {
      if (!(this.dragging && (type === 'move' || type === 'down'))) return;
      const dx = x - P.x, dy = y - P.y; if (Math.hypot(dx, dy) > P.r * 2.2) { this.lastAng = null; return; }
      const a = Math.atan2(dy, dx);
      if (this.lastAng != null) { let d = a - this.lastAng; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; const step = Math.min(0.5, Math.abs(d)); this.stir = Math.min(1, this.stir + step / (Math.PI * 2 * (m === 'cold' ? 3 : 5))); if (step > 0.05) { this.idle = 0; if (this.spoon <= 0) { this.spoon = 0.45; Sfx.play(m === 'cold' ? 'clink' : 'spoon', { vol: 0.45 }); } } }
      this.lastAng = a;
      return;
    }
    if (type === 'down' && this.flipT <= 0) {
      const err = Math.abs(this.brown - 0.86);
      this.take(Math.max(0, 1 - Math.max(0, err - HIT_SLACK) / 0.42));
      if (m === 'oven') { this.ovenOpen = 1; Sfx.play('door_open', { vol: 0.5 }); }
    }
  }
  key(k: string, d: boolean) {
    if (!d || this.ended) return;
    if (k !== ' ' && k !== 'e') return;
    if (this.phase === 'prep') { const it = this.items.find(i => !i.fly && !i.inPot); if (it) this.tapItem(it.x, it.y); return; }
    if (this.rc.method === 'boil' || this.rc.method === 'cold') { this.stir = Math.min(1, this.stir + 0.06); this.idle = 0; Sfx.play('spoon', { vol: 0.4 }); return; }
    this.pointer('down', 0, 0);
  }

  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    this.layout();
    // peretele cu faianta + blatul
    ctx.fillStyle = '#fdf3e4'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(160,120,90,.18)'; ctx.lineWidth = 2;
    for (let gx = x; gx < x + w; gx += 36) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h * 0.62); ctx.stroke(); }
    for (let gy = y; gy < y + h * 0.62; gy += 36) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    // eroul in spatele blatului
    this.hero.scale = Math.min(1.25, h / 420); this.hero.x = x + w * 0.22; this.hero.y = y + h * 0.66; this.hero.flip = 1; this.hero.draw(ctx);
    const cy = y + h * 0.64;
    ctx.fillStyle = '#c98e5f'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x - 4, cy, w + 8, h * 0.4, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8c39a'; ctx.fillRect(x, cy + 3, w, 10);
    // tocatorul
    ctx.fillStyle = '#e0b07a'; ctx.beginPath(); ctx.roundRect(x + w * 0.05, cy + h * 0.04, w * 0.56, h * 0.17, 12); ctx.fill(); ctx.stroke();
    // aragazul / cuptorul + vasul
    const P = this.pot, m = this.rc.method;
    if (m === 'oven') this.drawOven(ctx, P.x, P.y, P.r);
    else {
      if (m !== 'cold') { ctx.fillStyle = '#4a4a54'; ctx.beginPath(); ctx.ellipse(P.x, P.y + P.r * 0.55, P.r * 1.25, P.r * 0.35, 0, 0, 7); ctx.fill(); ctx.stroke();
        const fl = this.phase === 'cook' ? 1 : 0.4; for (let i = -2; i <= 2; i++) { ctx.fillStyle = i % 2 ? '#ffb347' : '#4ea8de'; ctx.beginPath(); ctx.ellipse(P.x + i * P.r * 0.35, P.y + P.r * 0.55, 6 * fl + Math.sin(this.t * 20 + i) * 2, 3, 0, 0, 7); ctx.fill(); } }
      if (m === 'boil') this.drawPot(ctx, P.x, P.y, P.r);
      else if (m === 'cold') this.drawBowl(ctx, P.x, P.y, P.r);
      else this.drawPan(ctx, P.x, P.y, P.r);
    }
    // ingredientele
    const sz = Math.min(64, w * 0.11);
    for (const it of this.items) {
      if (it.inPot) continue;
      const ic = iconCanvas(it.icon, 128); if (!ic) continue;
      const sc = it.fly > 0 ? 1 - Math.min(0.5, it.fly * 0.5) : 1;
      ctx.save(); ctx.translate(it.x, it.y);
      if (it.need > 1 && it.cuts > 0) { for (let c = 0; c < it.cuts; c++) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-sz * 0.35 + c * sz * 0.3, -sz * 0.4, 3, sz * 0.8); } }
      ctx.drawImage(ic, -sz / 2 * sc, -sz / 2 * sc, sz * sc, sz * sc);
      if (it.need > 1 && !it.fly) { ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = O; ctx.fillText(`${it.cuts}/${it.need}`, 0, sz * 0.62); }
      ctx.restore();
    }
    // cutitul cand tai
    if (this.knife > 0) { const it = this.items.find(i => !i.inPot && i.cuts > 0 && !i.fly) ?? this.items[0]; ctx.save(); ctx.translate(it.x + 18, it.y - 30 + this.knife * 18); ctx.rotate(-0.5); ctx.fillStyle = '#d8dde2'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-4, -34, 10, 34, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8b5e34'; ctx.beginPath(); ctx.roundRect(-5, 0, 12, 18, 4); ctx.fill(); ctx.stroke(); ctx.restore(); }
    // indicatorul de sus
    const bx = x + 40, bw = w - 80, by = y + 52;
    ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = O;
    if (this.phase === 'prep') { const left = this.items.filter(i => !i.inPot && !i.fly).length; ctx.fillText(left ? `Pregătește ingredientele: ${this.items.length - left}/${this.items.length}` : 'Le punem la gătit…', x + w / 2, by + 14); }
    else if (this.phase === 'cook') {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, by, bw, 24, 12); ctx.fill(); ctx.stroke();
      if (m === 'boil' || m === 'cold') {
        ctx.fillStyle = '#9be38f'; ctx.beginPath(); ctx.roundRect(bx + 3, by + 3, (bw - 6) * this.stir, 18, 9); ctx.fill();
        ctx.fillStyle = O; ctx.fillText(m === 'cold' ? 'Amestecă în cerc! 🥄' : this.stuck ? 'Amestecă mereu, să nu se prindă! 🥄' : 'Amestecă în cerc cu lingura 🥄', x + w / 2, by + 46);
      } else {
        // zona aurie
        const z0 = 0.86 - 0.18, z1 = 0.86 + 0.18;
        ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.roundRect(bx + bw * z0 / 1.35, by + 3, bw * (z1 - z0) / 1.35, 18, 9); ctx.fill();
        ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.roundRect(bx + bw * 1.15 / 1.35, by + 3, bw * 0.2 / 1.35 - 3, 18, 9); ctx.fill();
        const mx = bx + bw * Math.min(1.35, this.brown) / 1.35; ctx.fillStyle = '#ff4d6d'; ctx.fillRect(mx - 2, by - 4, 4, 32);
        ctx.fillStyle = O; ctx.fillText(m === 'oven' ? 'Scoate tava când e aurie! (atinge)' : this.side ? 'Și pe partea cealaltă… atinge la auriu!' : 'Întoarce când e aurie! (atinge)', x + w / 2, by + 46);
      }
    } else { const ic = iconCanvas(this.rc.icon, 160); if (ic) { const s2 = Math.min(110, h * 0.22); ctx.drawImage(ic, x + w / 2 - s2 / 2, y + h * 0.16, s2, s2); } }
  }
  drawPot(ctx: CanvasRenderingContext2D, px: number, py: number, r: number) {
    ctx.fillStyle = '#b9c3cc'; ctx.strokeStyle = O; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(px - r, py - r * 0.6, r * 2, r * 1.2, [4, 4, r * 0.4, r * 0.4]); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(px - r * 1.25, py - r * 0.5, r * 0.3, 10, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(px + r * 0.95, py - r * 0.5, r * 0.3, 10, 4); ctx.fill(); ctx.stroke();
    const full = this.items.filter(i => i.inPot).length / Math.max(1, this.items.length);
    ctx.fillStyle = this.rc.id === 'mamaliga' ? '#ffcf3f' : this.rc.id === 'supa' || this.rc.id === 'piure' ? '#f2e3c6' : this.rc.id === 'ceai' ? '#c9e8a0' : '#f4a261';
    ctx.beginPath(); ctx.ellipse(px, py - r * 0.6, r * 0.92, r * 0.22, 0, 0, 7); ctx.fill(); ctx.stroke();
    if (this.phase === 'cook') for (let i = 0; i < 4; i++) { const t = (this.t * 1.3 + i * 0.25) % 1; ctx.strokeStyle = `rgba(200,190,180,${1 - t})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - r * 0.5 + i * r * 0.33, py - r * 0.8 - t * 40); ctx.quadraticCurveTo(px - r * 0.4 + i * r * 0.33, py - r * 0.9 - t * 50, px - r * 0.5 + i * r * 0.33, py - r - t * 60); ctx.stroke(); }
    for (let i = 0; i < 3 * full; i++) { ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(px - r * 0.4 + ((i * 37 + this.t * 30) % (r * 0.8)), py - r * 0.6, 4, 0, 7); ctx.fill(); }
    this.drawSpoon(ctx, px, py, r);
  }
  drawBowl(ctx: CanvasRenderingContext2D, px: number, py: number, r: number) {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(px - r * 1.1, py - r * 0.4); ctx.lineTo(px + r * 1.1, py - r * 0.4); ctx.quadraticCurveTo(px + r, py + r * 0.8, px, py + r * 0.8); ctx.quadraticCurveTo(px - r, py + r * 0.8, px - r * 1.1, py - r * 0.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.rc.id === 'limonada' ? '#ffe97a' : '#9ed67a'; ctx.beginPath(); ctx.ellipse(px, py - r * 0.4, r * 1.02, r * 0.24, 0, 0, 7); ctx.fill(); ctx.stroke();
    this.drawSpoon(ctx, px, py - r * 0.2, r);
  }
  drawSpoon(ctx: CanvasRenderingContext2D, px: number, py: number, r: number) {
    if (this.phase !== 'cook') return;
    const a = this.lastAng ?? this.t * 2;
    const sx = px + Math.cos(a) * r * 0.5, sy = py - r * 0.6 + Math.sin(a) * r * 0.14;
    ctx.strokeStyle = '#8b5e34'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 26, sy - r * 1.1); ctx.stroke();
    ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke();
  }
  drawPan(ctx: CanvasRenderingContext2D, px: number, py: number, r: number) {
    ctx.fillStyle = '#4a4a54'; ctx.strokeStyle = O; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(px, py, r * 1.1, r * 0.45, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(px + r * 1.05, py - 6, r * 0.9, 12, 6); ctx.fill(); ctx.stroke();
    if (this.items.some(i => i.inPot)) {
      const lift = this.flipT > 0 ? Math.sin(this.flipT * Math.PI) * 60 : 0;
      const col = this.brown < 0.6 ? '#f6e3b5' : this.brown < 1.05 ? '#e8a85a' : this.brown < 1.25 ? '#b4743a' : '#5b3a26';
      ctx.save(); ctx.translate(px, py - 6 - lift); ctx.scale(1, this.flipT > 0 ? Math.cos(this.flipT * Math.PI * 2) * 0.5 + 0.5 : 1);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.75, r * 0.28, 0, 0, 7); ctx.fill(); ctx.stroke();
      if (this.rc.id === 'omleta') { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(-r * 0.2, 0, r * 0.14, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.22, -2, r * 0.12, 0, 7); ctx.fill(); }
      if (this.rc.id === 'peste') { ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 3; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.25 - 6, -8); ctx.lineTo(i * r * 0.25 + 6, 8); ctx.stroke(); } }
      ctx.restore();
      if (this.phase === 'cook' && Math.random() < 0.3) this.fx.emit('puff', px + (Math.random() - 0.5) * r, py - 16, { vy: -30, max: 0.6, color: '#ddd' });
    }
  }
  drawOven(ctx: CanvasRenderingContext2D, px: number, py: number, r: number) {
    const w = r * 2.6, h = r * 2.1, x = px - w / 2, y = py - h * 0.55;
    ctx.fillStyle = '#e9eef2'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#4a4a54'; ctx.beginPath(); ctx.arc(x + w * (0.25 + i * 0.25), y + 14, 6, 0, 7); ctx.fill(); }
    const glow = this.phase === 'cook' ? 0.6 + Math.sin(this.t * 6) * 0.1 : 0.2;
    ctx.fillStyle = `rgba(255,150,60,${glow})`; ctx.beginPath(); ctx.roundRect(x + 14, y + 30, w - 28, h - 46, 8); ctx.fill(); ctx.stroke();
    if (this.items.some(i => i.inPot)) {
      const col = this.brown < 0.6 ? '#f6e3b5' : this.brown < 1.05 ? '#e8a85a' : this.brown < 1.25 ? '#b4743a' : '#5b3a26';
      ctx.fillStyle = '#9aa4ad'; ctx.fillRect(x + 24, y + h - 34 - this.ovenOpen * 10, w - 48, 6);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(px, y + h - 40 - this.ovenOpen * 10, w * 0.32, 10, 0, 0, 7); ctx.fill(); ctx.stroke();
      if (this.rc.id === 'pizza') for (let i = -2; i <= 2; i++) { ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(px + i * w * 0.1, y + h - 43, 4, 0, 7); ctx.fill(); }
    }
  }
}
