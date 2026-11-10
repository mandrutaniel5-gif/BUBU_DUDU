// Sarbatorile de iarna (1.11.0): bradul satului, colindatorii, cadourile, Mos Craciun, patinoarul, caluteii, Revelionul.
import { Show, type Phase, O, clamp, ease, lerp, ell, rrect, icon, say, seeded, starPath, heartPath } from './holishow';
import { Sfx } from '../engine/sfx';
import type { Actor } from '../char/actor';
import * as Hol from '../scenes/holidays';
import { drawSanta } from '../world/holidraw';

// ====================================================================== bradul (desenat mare)
type Orn = { u: number; v: number; k: string; c: string; by: 'me' | 'pa'; t: number; fall?: { x: number; y: number; vy: number; vx: number; t: number } };
const ORN_TOOLS = [
  { k: 'globe', c: '#e63946', icon: '🔴', label: 'Glob roșu' }, { k: 'globe', c: '#ffd23f', icon: '🟡', label: 'Glob auriu' }, { k: 'globe', c: '#4cc9f0', icon: '🔵', label: 'Glob albastru' },
  { k: 'cane', c: '#fff', icon: '🍬', label: 'Baston' }, { k: 'bell', c: '#ffd23f', icon: '🔔', label: 'Clopoțel' }, { k: 'ginger', c: '#c98e5f', icon: '🍪', label: 'Turtă' },
  { k: 'tinsel', c: '#ffd23f', icon: '✨', label: 'Beteală' }, { k: 'lights', c: '#fff', icon: '💡', label: 'Beculețe' },
];
export function treeGeom(W: number, H: number, cx = W * 0.4) { const base = H * 0.8, h = Math.min(H * 0.66, W * 0.62), top = base - h; return { cx, base, top, h, half: (v: number) => h * 0.42 * v }; }
export function drawOrn(c: CanvasRenderingContext2D, k: string, x: number, y: number, r: number, col: string, t: number) {
  if (k === 'globe') { c.strokeStyle = '#8a7a5a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - r - 5); c.lineTo(x, y - r); c.stroke(); ell(c, x, y, r, r, col, true, 1.5); rrect(c, x - 3, y - r - 3, 6, 4, 1, '#c9a227', true, 1); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, 7); c.fill(); }
  else if (k === 'cane') { c.lineCap = 'round'; c.lineWidth = r * 0.55; c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(x, y + r * 1.4); c.lineTo(x, y - r * 0.4); c.arc(x - r * 0.6, y - r * 0.4, r * 0.6, 0, Math.PI, true); c.stroke(); c.strokeStyle = '#e63946'; c.lineWidth = r * 0.25; c.setLineDash([3, 4]); c.stroke(); c.setLineDash([]); c.lineCap = 'butt'; }
  else if (k === 'bell') { c.save(); c.translate(x, y); c.rotate(Math.sin(t * 4) * 0.2); c.beginPath(); c.moveTo(-r, r * 0.6); c.quadraticCurveTo(-r, -r, 0, -r); c.quadraticCurveTo(r, -r, r, r * 0.6); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = O; c.lineWidth = 1.5; c.stroke(); ell(c, 0, r * 0.75, r * 0.3, r * 0.3, '#c9a227', true, 1); c.restore(); }
  else if (k === 'ginger') { c.save(); c.translate(x, y); ell(c, 0, -r * 0.55, r * 0.45, r * 0.45, col, true, 1.2); c.beginPath(); c.roundRect(-r * 0.55, -r * 0.15, r * 1.1, r * 1.1, r * 0.3); c.fillStyle = col; c.fill(); c.stroke(); c.fillStyle = '#fff'; for (const yy of [0.15, 0.45]) { c.beginPath(); c.arc(0, r * yy, 1.4, 0, 7); c.fill(); } c.restore(); }
  else if (k === 'star') { c.save(); c.translate(x, y); c.rotate(Math.sin(t * 2) * 0.08); starPath(c, 0, 0, r, r * 0.45, 5, -Math.PI / 2); c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = '#c9a227'; c.lineWidth = 2; c.stroke(); c.restore(); }
}
export function drawBigTree(c: CanvasRenderingContext2D, W: number, H: number, orns: Orn[], tinsel: number[], strings: number[], lit: number, t: number, star: number, cx?: number) {
  const G = treeGeom(W, H, cx);
  // trunchi, ghiveci
  rrect(c, G.cx - 12, G.base - 10, 24, 30, 3, '#8a5d32'); rrect(c, G.cx - 34, G.base + 10, 68, 26, 6, '#c0573e');
  // 4 etaje de cetina
  for (let i = 3; i >= 0; i--) {
    const v0 = 0.08 + i * 0.22, v1 = Math.min(1, v0 + 0.36), y0 = G.top + v0 * G.h, y1 = G.top + v1 * G.h, w = G.half(v1) * 1.08;
    c.beginPath(); c.moveTo(G.cx, y0 - (i === 0 ? G.h * 0.08 : 0)); for (let k = 0; k <= 8; k++) { const u = k / 8; c.lineTo(G.cx + w * (u * 2 - 1), y1 + (k % 2 ? 6 : 0)); } c.closePath();
    c.fillStyle = ['#2f7d4f', '#358a57', '#3c965f', '#43a267'][i]; c.fill(); c.strokeStyle = O; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 5; k++) { const u = (k + 0.5) / 5; c.beginPath(); c.ellipse(G.cx + w * (u * 2 - 1) * 0.92, y1 + 1, 7, 2.6, 0, 0, 7); c.fill(); }
  }
  // beteala (ghirlande aurii pe un etaj)
  for (const v of tinsel) { const y = G.top + v * G.h, w = G.half(v); c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.beginPath(); c.moveTo(G.cx - w * 0.9, y - 6); c.quadraticCurveTo(G.cx, y + 16, G.cx + w * 0.9, y - 6); c.stroke(); c.strokeStyle = '#fff4b0'; c.lineWidth = 1.5; c.setLineDash([2, 5]); c.stroke(); c.setLineDash([]); }
  // beculetele (clipesc cand sunt aprinse)
  const cols = ['#ff4d6d', '#ffd23f', '#4cc9f0', '#7cc576', '#c77dff'];
  for (const v of strings) { const y = G.top + v * G.h, w = G.half(v) * 0.92; c.strokeStyle = '#1f4a2f'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(G.cx - w, y - 4); c.quadraticCurveTo(G.cx, y + 12, G.cx + w, y - 4); c.stroke();
    for (let i = 1; i < 9; i++) { const u = i / 9, x = lerp(G.cx - w, G.cx + w, u), yy = y - 4 + 16 * 4 * u * (1 - u) * 0.5; const on = lit * (0.5 + 0.5 * Math.sin(t * 5 + i * 1.3 + v * 9)); c.fillStyle = cols[i % 5]; c.globalAlpha = 0.35 + 0.65 * on; c.beginPath(); c.ellipse(x, yy + 3, 2.6, 3.8, 0, 0, 7); c.fill(); if (on > 0.55) { c.globalAlpha = 0.3 * on; c.beginPath(); c.arc(x, yy + 3, 9, 0, 7); c.fill(); } c.globalAlpha = 1; } }
  for (const o of orns) { if (o.fall) continue; const y = G.top + o.v * G.h, x = G.cx + o.u * G.half(o.v); const pop = clamp((t - o.t) * 4); drawOrn(c, o.k, x, y, (8 + 2 * pop) * (1 + (1 - pop) * 0.6), o.c, t); if (lit > 0.5 && o.k === 'globe') { c.globalAlpha = 0.35 * (0.5 + 0.5 * Math.sin(t * 3 + o.u * 5)); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 2, y - 2, 3, 0, 7); c.fill(); c.globalAlpha = 1; } }
  if (star > 0) { const y = G.top - G.h * 0.08 - 4; if (lit > 0.5) { const g = c.createRadialGradient(G.cx, y, 4, G.cx, y, 60); g.addColorStop(0, 'rgba(255,230,120,0.7)'); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(G.cx, y, 60, 0, 7); c.fill(); } drawOrn(c, 'star', G.cx, y, 18 * star, '#ffd23f', t); }
  return G;
}

// ====================================================================== 1. Impodobim bradul satului (impreuna)
export class XmasTreeShow extends Show {
  orns: Orn[] = []; tinsel: number[] = []; strings: number[] = [];
  tool = 0; lit = 0; star = 0; aiT = 1.5; need = 22; rnd = seeded(7);
  starBy: 'me' | 'pa' | '' = ''; climb = 0; switchOn = false; count = 0; myCount = 0;
  tray: { x: number; y: number; w: number; h: number }[] = [];
  starBtn = { x: 0, y: 0, w: 0, h: 0 }; swBtn = { x: 0, y: 0, w: 0, h: 0 };
  miti!: Actor; gogu!: Actor;
  constructor(scene: any, done: (s: number) => void) { super(scene, done); this.guests = this.villagers('winter'); this.miti = this.guest('miti'); this.gogu = this.guest('gogu'); this.rnd = seeded(scene.w.day * 31 + 5); }
  get placed() { return this.orns.filter(o => !o.fall).length + this.tinsel.length * 2 + this.strings.length * 2; }
  scenery(c: CanvasRenderingContext2D, W: number, H: number, night = 0.6) {
    this.village(c, W, H, H * 0.42, night, true); this.snow(c, W, H, 50);
  }
  crowd(c: CanvasRenderingContext2D, W: number, H: number, cheer = false) {
    const s = this.sz() * 0.62;
    this.guests.forEach((g, i) => { if (g === this.miti && this.mitiChase > 0) return; this.put(g, W * (0.7 + (i % 3) * 0.095 + Math.floor(i / 3) * 0.04), H * (0.8 + Math.floor(i / 3) * 0.07) - (cheer ? Math.abs(Math.sin(this.t * 6 + i)) * 8 : 0), s, -1); g.draw(c); });
  }
  mitiChase = 0; mitiX = 0;
  place(u: number, v: number, k: string, col: string, by: 'me' | 'pa') {
    if (k === 'tinsel') { if (this.tinsel.length >= 4 || this.tinsel.some(x => Math.abs(x - v) < 0.12)) return false; this.tinsel.push(v); Sfx.play('cloth'); return true; }
    if (k === 'lights') { if (this.strings.length >= 4 || this.strings.some(x => Math.abs(x - v) < 0.12)) return false; this.strings.push(v); Sfx.play('click'); return true; }
    const o: Orn = { u, v, k, c: col, by, t: this.t };
    // ups! globul alunecat (si Miti se joaca cu el)
    if (k === 'globe' && by === 'me' && this.myCount > 2 && this.rnd() < 0.14 && !this.orns.some(x => x.fall)) {
      const G = treeGeom(this.W, this.H); o.fall = { x: G.cx + u * G.half(v), y: G.top + v * G.h, vy: -60, vx: 30, t: 0 };
      this.fx.text(o.fall.x, o.fall.y - 20, 'Ups! 🙈', '#ff4d6d', 1.1); Sfx.play('boing');
    } else Sfx.play('clink', { vol: 0.7, rate: 0.9 + Math.random() * 0.4 });
    this.orns.push(o); if (by === 'me') this.myCount++;
    return true;
  }
  build(): Phase[] {
    const G = () => treeGeom(this.W, this.H);
    return [
      { id: 'intro', cap: 'Bradul satului așteaptă podoabele! Sătenii au adus cutiile cu globuri 📦', dur: 3.6, enter: () => { Sfx.play('jingle'); this.gogu.play('act_carry'); },
        draw: (c, W, H, k) => { this.scenery(c, W, H, 0.3); drawBigTree(c, W, H, [], [], [], 0, this.t, 0); this.crowd(c, W, H); for (let i = 0; i < 3; i++) { const x = W * (0.55 + i * 0.07), y = H * 0.86; rrect(c, x, y, 34, 22, 4, ['#e63946', '#4cc9f0', '#7cc576'][i]); c.fillStyle = '#ffd23f'; c.fillRect(x + 14, y, 6, 22); } if (k > 0.5) this.bub(c, 'Nea Gogu: „Am adus și scara. E cam șubredă…” 🪜', W * 0.72, H * 0.5, 13); } },
      { id: 'decorate', cap: '', hint: `Alege o podoabă de jos și atinge bradul (${this.need} podoabe, apoi steaua)`, max: 120,
        enter: () => { this.aiT = 1.2; },
        tap: (type, x, y) => {
          if (type !== 'down') return;
          const ti = this.tray.findIndex(r => this.hit(r, x, y)); if (ti >= 0) { this.tool = ti; Sfx.play('pop'); return; }
          const g = G(), v = (y - g.top) / g.h, u = (x - g.cx) / Math.max(1, g.half(v));
          if (v < 0.14 || v > 0.97 || Math.abs(u) > 0.92) { this.fx.text(x, y, 'Pe brad! 🎄', '#7a5a4a', 0.8); return; }
          const tl = ORN_TOOLS[this.tool]; if (this.place(u, v, tl.k, tl.c, 'me')) { this.send({ orn: { u, v, k: tl.k, c: tl.c } }); this.me.play('act_collect'); }
        },
        play: dt => {
          if (this.aiPlays) { this.aiT -= dt; if (this.aiT <= 0) { this.aiT = 1.8 + Math.random() * 1.0; const tl = ORN_TOOLS[Math.floor(Math.random() * 6)], v = 0.2 + Math.random() * 0.75, u = (Math.random() * 2 - 1) * 0.85; this.place(u, v, Math.random() < 0.12 ? 'tinsel' : tl.k, tl.c, 'pa'); this.pa.play('act_collect'); } }
          for (const o of this.orns) if (o.fall) { const f = o.fall; f.t += dt; f.vy += 600 * dt; f.x += f.vx * dt; f.y += f.vy * dt; const floor = this.H * 0.86; if (f.y > floor) { f.y = floor; f.vy *= -0.5; if (Math.abs(f.vy) < 40) { f.vy = 0; f.vx = 140; if (!this.mitiChase) { this.mitiChase = 1; this.mitiX = this.W * 0.9; this.miti.play('dance_hop'); Sfx.play('cat', { vol: 0.8 }); this.fx.text(this.W * 0.8, this.H * 0.62, 'Miți: „Miau! E al meu!” 🐱', '#c77dff', 1); } } } }
          if (this.mitiChase) { this.mitiChase += dt; const f = this.orns.find(o => o.fall)?.fall; if (f) this.mitiX = lerp(this.mitiX, f.x + 20, dt * 3); if (this.mitiChase > 3.5) { this.orns = this.orns.filter(o => !o.fall); this.mitiChase = 0; } }
          return this.placed >= this.need;
        },
        draw: (c, W, H) => {
          this.scenery(c, W, H, 0.3); drawBigTree(c, W, H, this.orns, this.tinsel, this.strings, 0.25, this.t, 0);
          for (const o of this.orns) if (o.fall) drawOrn(c, o.k, o.fall.x, o.fall.y, 8, o.c, this.t);
          this.crowd(c, W, H);
          if (this.mitiChase) { this.put(this.miti, this.mitiX, H * 0.85, this.sz() * 0.62, -1); this.miti.draw(c); }
          const s = this.sz() * 0.66; this.put(this.me, W * 0.08, H * 0.86, s, 1); this.put(this.pa, W * 0.18, H * 0.88, s, 1); this.me.draw(c); this.pa.draw(c);
          // tava cu podoabe
          this.tray = this.buttons(c, ORN_TOOLS.map((t2, i) => ({ icon: t2.icon, label: t2.label, on: i === this.tool })), 8 + 34, 86).map(r => ({ ...r, h: 74 }));
          say(c, `🎄 ${Math.min(this.need, this.placed)} / ${this.need}`, W * 0.4, H * 0.12 + 78, 20, '#2f7d4f');
        } },
      { id: 'star', cap: 'Steaua! Cine o pune în vârf? ⭐', hint: 'Atinge steaua (repede!)', max: 14,
        enter: () => { this.aiT = 3.2; Sfx.play('drumroll'); },
        tap: (type, x, y) => { if (type === 'down' && !this.starBy && this.hit(this.starBtn, x, y)) { this.starBy = 'me'; this.send({ star: 1 }); Sfx.play('good'); } },
        play: dt => { if (!this.starBy && this.aiPlays) { this.aiT -= dt; if (this.aiT <= 0) this.starBy = 'pa'; } return !!this.starBy; },
        draw: (c, W, H) => { this.scenery(c, W, H, 0.4); drawBigTree(c, W, H, this.orns, this.tinsel, this.strings, 0.25, this.t, 0); this.crowd(c, W, H); const s = this.sz() * 0.66; this.put(this.me, W * 0.08, H * 0.86, s, 1); this.put(this.pa, W * 0.18, H * 0.88, s, 1); this.me.draw(c); this.pa.draw(c);
          const b = 70 + Math.sin(this.t * 6) * 6; this.starBtn = { x: W * 0.82 - b / 2, y: H * 0.3 - b / 2, w: b, h: b }; c.save(); c.translate(W * 0.82, H * 0.3); c.rotate(Math.sin(this.t * 3) * 0.2); starPath(c, 0, 0, b / 2, b / 4.5, 5, -Math.PI / 2); c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = O; c.lineWidth = 3; c.stroke(); c.restore(); } },
      { id: 'climb', cap: '', dur: 5.2,
        enter: () => { this.climb = 0; Sfx.play('step'); },
        draw: (c, W, H, k) => {
          const g = G(); this.scenery(c, W, H, 0.4); drawBigTree(c, W, H, this.orns, this.tinsel, this.strings, 0.25, this.t, k > 0.62 ? 1 : 0); this.crowd(c, W, H);
          const who = this.starBy === 'me' ? this.me : this.pa, other = who === this.me ? this.pa : this.me;
          const lx = g.cx + 30, wob = k > 0.3 && k < 0.62 ? Math.sin(this.t * 14) * 0.08 : 0;
          c.save(); c.translate(lx, g.base); c.rotate(-0.12 + wob); c.strokeStyle = '#a0703f'; c.lineWidth = 5; for (const sx of [-12, 12]) { c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx * 0.6, -g.h * 0.95); c.stroke(); } c.lineWidth = 3; for (let i = 1; i < 10; i++) { const yy = -g.h * 0.095 * i; c.beginPath(); c.moveTo(-11 + i * 0.4, yy); c.lineTo(11 - i * 0.4, yy); c.stroke(); } c.restore();
          const up = k < 0.55 ? ease(k / 0.55) : k < 0.7 ? 1 : 1 - ease((k - 0.7) / 0.3);
          const y = lerp(H * 0.86, g.top + g.h * 0.12, up), x = lerp(W * 0.2, lx + (k > 0.7 ? 70 * (k - 0.7) / 0.3 : 0), Math.min(1, k * 4));
          this.put(who, x, y, this.sz() * 0.62, -1); who.draw(c); this.put(other, W * 0.1, H * 0.86, this.sz() * 0.66, 1); other.draw(c);
          if (k > 0.3 && k < 0.6) this.bub(c, 'Ăăă… se clatină! 😱', x, y - 70, 14);
          if (k > 0.6 && k < 0.66 && !this.star) { this.star = 1; this.flash = 0.8; Sfx.play('ding'); Sfx.play('applause', { vol: 0.6 }); who.play('dance_hop'); }
          if (k > 0.94 && this.climb === 0) { this.climb = 1; Sfx.play('jump_land'); who.play('faint'); this.fx.text(x, H * 0.82, 'Pleosc! În zăpadă ❄️😂', '#4cc9f0', 1); other.play('laugh'); }
          this.phases[this.pi].cap = k < 0.6 ? `${who === this.me ? this.myName : this.paName} urcă pe scara șubredă…` : k < 0.9 ? '⭐ Steaua e sus!' : 'Hop! …drept în nămete 😂';
        } },
      { id: 'switch', cap: 'Și acum… aprindem luminile!', hint: 'Apasă butonul!', max: 12,
        enter: () => { this.aiT = 4; this.switchOn = false; },
        tap: (type, x, y) => { if (type === 'down' && this.hit(this.swBtn, x, y)) { this.switchOn = true; this.send({ lights: 1 }); } },
        play: dt => { if (this.aiPlays) { this.aiT -= dt; if (this.aiT <= 0) this.switchOn = true; } return this.switchOn; },
        draw: (c, W, H) => { this.scenery(c, W, H, 0.85); drawBigTree(c, W, H, this.orns, this.tinsel, this.strings, 0, this.t, 1); this.crowd(c, W, H); const s = this.sz() * 0.66; this.put(this.me, W * 0.08, H * 0.86, s, 1); this.put(this.pa, W * 0.18, H * 0.88, s, 1); this.me.draw(c); this.pa.draw(c);
          const b = 64; this.swBtn = { x: W * 0.82 - b / 2, y: H * 0.42 - b / 2, w: b, h: b }; ell(c, W * 0.82, H * 0.42, b / 2 + Math.sin(this.t * 8) * 3, b / 2 + Math.sin(this.t * 8) * 3, '#ff4d6d', true, 3); say(c, 'PORNIT', W * 0.82, H * 0.42, 15, '#fff'); } },
      { id: 'lit', cap: '✨ Ooooh! Cel mai frumos brad din toată valea!', dur: 5,
        enter: () => { this.lit = 1; Sfx.play('jingle'); Sfx.play('applause'); this.boom(60); for (const g of this.guests) g.play('dance_hop'); this.me.play('love'); this.pa.play('love'); setTimeout(() => this.fx.hearts(this.W * 0.4, this.H * 0.5, 14), 400); },
        draw: (c, W, H) => { this.scenery(c, W, H, 0.95); drawBigTree(c, W, H, this.orns, this.tinsel, this.strings, 1, this.t, 1); this.crowd(c, W, H, true); const s = this.sz() * 0.66; this.put(this.me, W * 0.08, H * 0.86, s, 1); this.put(this.pa, W * 0.18, H * 0.88, s, 1); this.me.draw(c); this.pa.draw(c); } },
    ];
  }
  onNet(d: any) {
    if (d.orn) { this.place(d.orn.u, d.orn.v, d.orn.k, d.orn.c, 'pa'); this.pa.play('act_collect'); }
    if (d.star && !this.starBy) this.starBy = 'pa';
    if (d.lights) this.switchOn = true;
  }
  endText() { return 'Bradul strălucește! 🎄✨'; }
  reward() {
    const s = this.scene;
    if (this.quit && this.placed < this.need) return;
    if (Hol.once(s, Hol.yearKey(s, 'xtree'))) { Hol.befriendAll(s, 1); s.op({ k: 'hearts', delta: 15 }); s.log('Ați împodobit bradul satului! Tot satul s-a strâns să-l vadă 🎄✨'); }
    Hol.memory(s, 'xmastree'); Hol.feel(s, s.myId, { fun: 20, love: 10 }); if (this.partnerAI) Hol.feel(s, s.partner.id, { fun: 20, love: 10 });
    s.syncPlaced();
  }
}

// ====================================================================== 2. Colindatorii (seara de Craciun, la usa voastra)
const CAROL_LINES = ['🎵 „O, ce veste minunată…”', '🎵 „…că la Vifleem Maria…”', '🎵 „Steaua sus răsare, ca o taină mare…”', '🎵 „…La anul și la mulți ani!”'];
const TREATS = [{ k: 'colac', icon: '🥨', label: 'Colac' }, { k: 'mar', icon: '🍎', label: 'Măr' }, { k: 'nuci', icon: '🌰', label: 'Nuci' }, { k: 'ban', icon: '🪙', label: 'Bănuț (5 lei)' }];
export class CarolShow extends Show {
  got: Record<string, string> = {}; tool = 0; tray: { x: number; y: number; w: number; h: number }[] = []; spots: { x: number; y: number }[] = []; aiT = 2; spent = 0;
  constructor(scene: any, done: (s: number) => void) { super(scene, done); this.guests = this.villagers('winter').filter(g => (g as any).vid !== 'leana'); }
  door(c: CanvasRenderingContext2D, W: number, H: number, open: number) {
    this.sky(c, W, H * 0.5, '#151d45', '#3a3470'); this.stars(c, W, H * 0.45, 50); this.ground(c, W, H, H * 0.5, '#eef3f8');
    // casa voastra cu usa
    rrect(c, -10, H * 0.08, W * 0.36, H * 0.86, 0, '#fff1d6'); c.fillStyle = '#ffe680'; c.globalAlpha = 0.25 + 0.4 * open; c.fillRect(W * 0.07, H * 0.32, W * 0.16, H * 0.56); c.globalAlpha = 1;
    rrect(c, W * 0.07, H * 0.32, W * 0.16 * (1 - open * 0.85), H * 0.56, 4, '#a0703f'); ell(c, W * 0.07 + W * 0.16 * (1 - open * 0.85) - 10, H * 0.62, 4, 4, '#ffd23f');
    ell(c, W * 0.15, H * 0.26, 26, 26, '#2f7d4f'); ell(c, W * 0.15, H * 0.26, 12, 12, '#151d45', false); // coronita de pe usa
    this.snow(c, W, H, 40);
  }
  star(c: CanvasRenderingContext2D, x: number, y: number) {
    c.strokeStyle = '#8a5d32'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 90); c.stroke();
    c.save(); c.translate(x, y - 110); c.rotate(this.t * 1.2); starPath(c, 0, 0, 26, 12, 8); c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke();
    for (let i = 0; i < 8; i++) { c.fillStyle = ['#ff4d6d', '#4cc9f0', '#7cc576'][i % 3]; c.beginPath(); c.arc(Math.cos(i * 0.785) * 26, Math.sin(i * 0.785) * 26, 3.5, 0, 7); c.fill(); }
    c.restore(); ell(c, x, y - 110, 9, 9, '#fff6d6'); icon(c, '👼', x, y - 110, 14);
  }
  troupe(c: CanvasRenderingContext2D, W: number, H: number, sway = 0) {
    const s = this.sz() * 0.62; this.spots = [];
    this.guests.forEach((g, i) => { const x = W * (0.42 + i * 0.12), y = H * 0.85 + (i % 2) * 6 - Math.abs(Math.sin(this.t * 3 + i)) * sway; this.spots.push({ x, y }); this.put(g, x, y, s, -1); g.draw(c);
      const vid = (g as any).vid; if (this.got[vid]) icon(c, this.got[vid], x + 16, y - 30, 22); else ell(c, x + 16, y - 26, 10, 8, '#c98e5f', true, 1.5); });
    const rex = this.guests.findIndex(g => (g as any).vid === 'rex'); if (rex >= 0) this.star(c, this.spots[rex].x - 22, this.spots[rex].y - 20);
  }
  build(): Phase[] {
    const rexG = this.guest('rex'), goguG = this.guest('gogu');
    const sing = (i: number): Phase => ({ id: 'sing' + i, cap: CAROL_LINES[i], dur: 3.1, enter: () => { Sfx.play('carol'); if (i === 1) setTimeout(() => { Sfx.play('howl'); rexG.play('dance_wave'); }, 900); if (i === 2) goguG.play('shy'); },
      draw: (c, W, H) => { this.door(c, W, H, 1); this.troupe(c, W, H, 5); for (let k = 0; k < 4; k++) icon(c, ['🎵', '🎶'][k % 2], W * (0.45 + k * 0.12) + Math.sin(this.t * 2 + k) * 10, H * 0.42 - ((this.t * 30 + k * 20) % 60), 18); const s = this.sz() * 0.66; this.put(this.me, W * 0.13, H * 0.86, s, 1); this.put(this.pa, W * 0.25, H * 0.88, s, 1); this.me.draw(c); this.pa.draw(c);
        if (i === 1) this.bub(c, 'Rex: „AUUUUU 🎶” (fals, dar din suflet)', this.spots[this.guests.indexOf(rexG)]?.x ?? W / 2, H * 0.55, 13);
        if (i === 2) this.bub(c, 'Nea Gogu: „…na-na-na… am uitat versurile 😅”', this.spots[this.guests.indexOf(goguG)]?.x ?? W / 2, H * 0.55, 13); } });
    return [
      { id: 'bell', cap: '🔔 Ding-dong! Cine sună la ușă la ora asta?', dur: 2.6, enter: () => { Sfx.play('doorbell'); setTimeout(() => Sfx.play('doorbell'), 700); },
        draw: (c, W, H, k) => { this.door(c, W, H, ease(clamp((k - 0.5) * 2))); if (k > 0.5) this.troupe(c, W, H); const s = this.sz() * 0.66; this.put(this.me, W * 0.13, H * 0.86, s, 1); this.put(this.pa, W * 0.25, H * 0.88, s, 1); this.me.draw(c); this.pa.draw(c); } },
      { id: 'hello', cap: '„Bună seara, gazde mari! Primiți cu Steaua?” ⭐', dur: 3, enter: () => { for (const g of this.guests) g.play('wave'); this.me.play('love'); this.pa.play('dance_hop'); },
        draw: (c, W, H) => { this.door(c, W, H, 1); this.troupe(c, W, H); const s = this.sz() * 0.66; this.put(this.me, W * 0.13, H * 0.86, s, 1); this.put(this.pa, W * 0.25, H * 0.88, s, 1); this.me.draw(c); this.pa.draw(c); this.bub(c, 'Primim! Intrați la căldură! 🥰', W * 0.18, H * 0.58, 14); } },
      sing(0), sing(1), sing(2),
      { id: 'give', cap: 'Dați-le colaci, mere și nuci! Fiecare colindător primește ceva 🎁', hint: 'Alege de jos, apoi atinge un colindător', max: 40,
        tap: (type, x, y) => { if (type !== 'down') return; const ti = this.tray.findIndex(r => this.hit(r, x, y)); if (ti >= 0) { this.tool = ti; Sfx.play('pop'); return; }
          const gi = this.spots.findIndex(p => Math.abs(p.x - x) < 40 && y > p.y - 110 && y < p.y + 20); if (gi < 0) return; this.give(gi, this.tool, true); },
        play: dt => { if (this.aiPlays) { this.aiT -= dt; if (this.aiT <= 0) { this.aiT = 2.2; const left = this.guests.map((g, i) => [g, i] as const).filter(([g]) => !this.got[(g as any).vid]); if (left.length) this.give(left[0][1], Math.floor(Math.random() * 3), false); } } return this.guests.every(g => this.got[(g as any).vid]); },
        draw: (c, W, H) => { this.door(c, W, H, 1); this.troupe(c, W, H); const s = this.sz() * 0.66; this.put(this.me, W * 0.13, H * 0.86, s, 1); this.put(this.pa, W * 0.25, H * 0.88, s, 1); this.me.draw(c); this.pa.draw(c);
          this.tray = this.buttons(c, TREATS.map((t2, i) => ({ icon: t2.icon, label: t2.label, on: i === this.tool })), 44, 96); } },
      sing(3),
      { id: 'bye', cap: 'Colindătorii v-au lăsat un coș cu cozonac și nuci. „La anul și la mulți ani!” 🎄', dur: 3.6, enter: () => { Sfx.play('jingle'); for (const g of this.guests) g.play('wave'); this.boom(30); },
        draw: (c, W, H, k) => { this.door(c, W, H, 1 - k * 0.6); const s = this.sz() * 0.62; this.guests.forEach((g, i) => { this.put(g, W * (0.42 + i * 0.12) + k * W * 0.5, H * 0.85, s, 1); g.draw(c); }); rrect(c, W * 0.3, H * 0.86, 50, 28, 8, '#c98e5f'); icon(c, '🍞', W * 0.3 + 16, H * 0.86, 22); icon(c, '🌰', W * 0.3 + 36, H * 0.86, 18); const s2 = this.sz() * 0.66; this.put(this.me, W * 0.13, H * 0.86, s2, 1); this.put(this.pa, W * 0.25, H * 0.88, s2, 1); this.me.draw(c); this.pa.draw(c); } },
    ];
  }
  give(gi: number, ti: number, mine: boolean) {
    const g = this.guests[gi], vid = (g as any).vid; if (!g || this.got[vid]) return;
    const t = TREATS[ti];
    if (t.k === 'ban' && mine) { if ((this.scene.w.money ?? 0) < 5) { this.fx.text(this.W / 2, this.H / 2, 'N-ai mărunt 😅', '#7a5a4a', 1); return; } this.spent += 5; }
    this.got[vid] = t.icon; g.play(vid === 'rex' && t.k !== 'ban' ? 'puppy' : 'love'); Sfx.play('coin', { vol: 0.5 });
    const p = this.spots[gi]; if (p) { this.fx.hearts(p.x, p.y - 60, 4); if (vid === 'rex') this.fx.text(p.x, p.y - 100, t.k === 'ban' ? 'Ham! Bogat! 💰' : 'Ham… speram la un cârnat 🌭', '#7a5a4a', 0.85); else this.fx.text(p.x, p.y - 100, 'Mulțumim! 😊', '#ff4d6d', 0.85); }
    if (mine) this.send({ give: { gi, ti } });
  }
  onNet(d: any) { if (d.give) this.give(d.give.gi, d.give.ti, false); }
  endText() { return 'Colindătorii au fost fericiți! ⭐'; }
  reward() {
    const s = this.scene;
    if (this.spent) s.op({ k: 'money', delta: -this.spent });
    if (this.quit && Object.keys(this.got).length < 2) return;
    if (Hol.once(s, Hol.yearKey(s, 'carol'))) { for (const vid of Object.keys(this.got)) Hol.befriend(s, vid, 1); s.op({ k: 'res', res: 'meals', delta: 3 }); s.op({ k: 'hearts', delta: 10 }); s.log('Colindătorii au trecut pe la voi cu Steaua ⭐🎶'); }
    Hol.memory(s, 'colinde'); Hol.feel(s, s.myId, { fun: 15, love: 8 }); if (this.partnerAI) Hol.feel(s, s.partner.id, { fun: 15, love: 8 }); s.syncPlaced();
  }
}

// ====================================================================== cutiile cu cadouri (se deschid cu 3 atingeri)
export class GiftBoxes {
  open: number[] = []; // 0 inchisa, 1..2 scuturata, 3 deschisa
  t0: number[] = []; rects: { x: number; y: number; w: number; h: number }[] = [];
  constructor(public show: Show, public gifts: Hol.Gift[]) { this.open = gifts.map(() => 0); this.t0 = gifts.map(() => 0); }
  get done() { return this.open.every(o => o >= 3); }
  tap(i: number, mine: boolean) {
    if (this.open[i] >= 3) return; this.open[i]++; this.t0[i] = this.show.t;
    if (this.open[i] < 3) Sfx.play('cloth', { vol: 0.7 }); else { Sfx.play('pop'); Sfx.play('good'); const r = this.rects[i]; if (r) this.show.burst(r.x + r.w / 2, r.y, 26, ['#ffd23f', '#ff7aa2', '#fff', '#4cc9f0'], 150, 120, 1); }
    if (mine) this.show.send({ box: i });
  }
  draw(c: CanvasRenderingContext2D, W: number, y: number, guests: Actor[]) {
    const n = this.gifts.length, bw = Math.min(86, (W - 40) / n - 10), gap = 10, x0 = W / 2 - (n * bw + (n - 1) * gap) / 2; this.rects = [];
    this.gifts.forEach((gf, i) => {
      const x = x0 + i * (bw + gap), st = this.open[i], dt = this.show.t - this.t0[i], h = bw * 0.8;
      const shake = st > 0 && st < 3 && dt < 0.4 ? Math.sin(dt * 60) * 6 * (1 - dt / 0.4) : 0;
      this.rects.push({ x, y: y - h, w: bw, h: h + 30 });
      c.save(); c.translate(x + bw / 2 + shake, y);
      if (st < 3) {
        rrect(c, -bw / 2, -h, bw, h, 6, gf.box); c.fillStyle = '#fff'; c.fillRect(-5, -h, 10, h); c.fillRect(-bw / 2, -h * 0.55, bw, 8);
        rrect(c, -bw / 2 - 4, -h - 12, bw + 8, 14, 4, gf.box); for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 10, -h - 16, 10, 6, s * 0.4, 0, 7); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = O; c.lineWidth = 1.5; c.stroke(); }
        if (st > 0) say(c, '❓'.repeat(st), 0, -h - 34, 12);
      } else {
        const k = clamp(dt / 0.6);
        rrect(c, -bw / 2, -h * 0.6, bw, h * 0.6, 6, gf.box); c.fillStyle = '#fff'; c.fillRect(-5, -h * 0.6, 10, h * 0.6);
        c.save(); c.translate(-bw * 0.6 * k, -h * 0.6 - 40 * Math.sin(k * Math.PI) - 4); c.rotate(-k * 0.8); rrect(c, -bw / 2 - 4, -14, bw + 8, 14, 4, gf.box); c.restore();
        const ry = -h * 0.6 - 26 - 30 * ease(k); icon(c, gf.icon, 0, ry, 34 + 6 * Math.sin(this.show.t * 4)); c.font = '800 11px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.fillStyle = O; const lb = gf.label.length > 16 ? gf.label.slice(0, 15) + '…' : gf.label; c.fillText(lb, 0, ry - 24);
      }
      c.font = '800 11px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; rrect(c, -bw / 2 + 4, 6, bw - 8, 18, 9, '#fff', true, 1.5); c.fillStyle = O; c.fillText(gf.from.replace('Bunica ', 'Bunica ').slice(0, 14), 0, 15);
      c.restore();
    });
    // ultimul deschis: mesajul celui care l-a dat
    const last = this.t0.map((t, i) => [t, i] as const).filter(([, i]) => this.open[i] >= 3).sort((a, b) => b[0] - a[0])[0];
    if (last && this.show.t - last[0] < 4) { const gf = this.gifts[last[1]], g = guests.find(a => (a as any).vid === gf.vid); this.show.bub(c, `${gf.from}: ${gf.msg}`, W / 2, y - 150, 13); if (g && this.show.t - last[0] < 0.1) g.play('wave'); }
  }
}

// ====================================================================== 3. Cadourile de sub brad (Craciun)
export class GiftsShow extends Show {
  boxes: GiftBoxes; aiT = 2.5;
  constructor(scene: any, done: (s: number) => void) { super(scene, done); this.guests = this.villagers('winter'); this.boxes = new GiftBoxes(this, Hol.giftList(scene, 'xmas')); }
  build(): Phase[] {
    const dec = (this.scene.w.stats['xtree-' + Hol.yearOf(this.scene.w.day)] ?? 0) > 0;
    const bg = (c: CanvasRenderingContext2D, W: number, H: number) => { this.village(c, W, H, H * 0.42, 0.2, true); drawBigTree(c, W, H, dec ? [{ u: -0.4, v: 0.5, k: 'globe', c: '#e63946', by: 'me', t: -9 }, { u: 0.3, v: 0.35, k: 'globe', c: '#ffd23f', by: 'me', t: -9 }, { u: 0.5, v: 0.75, k: 'bell', c: '#ffd23f', by: 'me', t: -9 }, { u: -0.2, v: 0.8, k: 'cane', c: '#fff', by: 'me', t: -9 }] : [], dec ? [0.45, 0.8] : [], dec ? [0.3, 0.62] : [], dec ? 1 : 0, this.t, dec ? 1 : 0, W * 0.5); this.snow(c, W, H, 40); };
    return [
      { id: 'see', cap: '🎁 Dimineața de Crăciun: sub brad sunt cadouri cu numele voastre!', dur: 3, enter: () => { Sfx.play('jingle'); this.me.play('dance_hop'); this.pa.play('love'); },
        draw: (c, W, H) => { bg(c, W, H); this.boxes.draw(c, W, H * 0.86, this.guests); } },
      { id: 'open', cap: '', hint: 'Atinge un cadou de 3 ori ca să-l deschizi', max: 90,
        tap: (type, x, y) => { if (type !== 'down') return; const i = this.boxes.rects.findIndex(r => this.hit(r, x, y)); if (i >= 0) this.boxes.tap(i, true); },
        play: dt => { if (this.aiPlays) { this.aiT -= dt; if (this.aiT <= 0) { this.aiT = 0.9; const i = this.boxes.open.findIndex(o => o < 3 && o > 0) >= 0 ? this.boxes.open.findIndex(o => o < 3 && o > 0) : this.boxes.open.lastIndexOf(0); if (i >= 0) this.boxes.tap(i, false); } } return this.boxes.done && this.pt > 1; },
        draw: (c, W, H) => { bg(c, W, H); this.boxes.draw(c, W, H * 0.86, this.guests); const s = this.sz() * 0.6; this.put(this.me, W * 0.08, H * 0.87, s, 1); this.put(this.pa, W * 0.93, H * 0.87, s, -1); this.me.draw(c); this.pa.draw(c); } },
      { id: 'thanks', cap: 'Mulțumim, dragi săteni! Crăciun fericit! 🎄💕', dur: 3.4, enter: () => { Sfx.play('applause'); this.boom(50); for (const g of this.guests) g.play('dance_hop'); this.me.play('love'); this.pa.play('love'); },
        draw: (c, W, H) => { bg(c, W, H); const s = this.sz() * 0.6; this.guests.forEach((g, i) => { this.put(g, W * (0.15 + i * 0.12), H * 0.86, s, i < 3 ? 1 : -1); g.draw(c); }); this.put(this.me, W * 0.42, H * 0.88, s * 1.1, 1); this.put(this.pa, W * 0.58, H * 0.88, s * 1.1, -1); this.me.draw(c); this.pa.draw(c); } },
    ];
  }
  onNet(d: any) { if (d.box != null) this.boxes.tap(d.box, false); }
  endText() { return 'Crăciun fericit! 🎁'; }
  reward() {
    const s = this.scene, opened = this.boxes.gifts.filter((_, i) => this.boxes.open[i] >= 3);
    if (!opened.length) return;
    const shared = Hol.once(s, Hol.yearKey(s, 'xgifts'));
    for (const gf of this.quit ? opened : this.boxes.gifts) Hol.applyGift(s, gf, shared);
    if (shared) s.log('Ați deschis cadourile de Crăciun de la săteni 🎁🎄');
    Hol.memory(s, 'gifts'); Hol.feel(s, s.myId, { fun: 20, love: 10 }); if (this.partnerAI) Hol.feel(s, s.partner.id, { fun: 20, love: 10 }); s.syncPlaced();
  }
}

// ====================================================================== 4. Poza cu Mos Craciun (targul de Craciun)
export class SantaShow extends Show {
  answer = -1; pose = -1; flashT = 0; aiT = 3; btns: { x: number; y: number; w: number; h: number }[] = []; photo: HTMLCanvasElement | null = null;
  booth(c: CanvasRenderingContext2D, W: number, H: number, laugh = 0, wave = 0) {
    this.sky(c, W, H * 0.55, '#1d2550', '#56487f'); this.stars(c, W, H * 0.5, 30); this.ground(c, W, H, H * 0.55, '#eef3f8');
    this.lights(c, 0, H * 0.08, W, H * 0.08, 18, 20, 1);
    // sania
    c.fillStyle = '#c1121f'; c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.38, H * 0.82); c.lineTo(W * 0.62, H * 0.82); c.quadraticCurveTo(W * 0.68, H * 0.82, W * 0.68, H * 0.7); c.lineTo(W * 0.66, H * 0.6); c.lineTo(W * 0.36, H * 0.66); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.beginPath(); c.moveTo(W * 0.34, H * 0.88); c.lineTo(W * 0.66, H * 0.88); c.quadraticCurveTo(W * 0.72, H * 0.88, W * 0.72, H * 0.82); c.stroke();
    for (let i = 0; i < 5; i++) { rrect(c, W * (0.08 + i * 0.05), H * 0.86 - (i % 2) * 18, 30, 24, 4, ['#4cc9f0', '#ffd23f', '#7cc576', '#ff7aa2', '#c77dff'][i]); }
    drawSanta(c, W * 0.5, H * 0.78, this.sz() * 0.82, this.t, wave, laugh);
    this.snow(c, W, H, 30);
  }
  couple(c: CanvasRenderingContext2D, W: number, H: number) { const s = this.sz() * 0.66; this.put(this.bubu, W * 0.3, H * 0.86, s, 1); this.put(this.dudu, W * 0.72, H * 0.86, s, -1); this.bubu.draw(c); this.dudu.draw(c); }
  build(): Phase[] {
    const me = this.scene.myId, tattle = me === 'bubu' ? 'Dudu a mâncat toate prăjiturile! 🍰' : 'Bubu fură pătura în fiecare noapte! 🛏️';
    const ANS = [{ icon: '😇', label: 'Foarte cuminți!' }, { icon: '😅', label: 'Cam… da?' }, { icon: '🙊', label: 'Pârăsc ceva!' }];
    const POSES = [{ icon: '💕', label: 'Inimioară' }, { icon: '🤪', label: 'Strâmbături' }, { icon: '😘', label: 'Pupic' }];
    return [
      { id: 'hoho', cap: '🎅 „Ho-ho-ho! Cine a venit la Moșul?”', dur: 3, enter: () => { Sfx.play('jingle'); this.bubu.play('dance_hop'); this.dudu.play('wave'); }, draw: (c, W, H) => { this.booth(c, W, H, 1, 1); this.couple(c, W, H); } },
      { id: 'q', cap: '🎅 „Ați fost cuminți anul ăsta?”', hint: 'Răspunde Moșului', max: 20,
        tap: (type, x, y) => { if (type !== 'down' || this.answer >= 0) return; const i = this.btns.findIndex(r => this.hit(r, x, y)); if (i >= 0) { this.answer = i; this.send({ ans: i }); this.react(); } },
        play: dt => { if (this.answer < 0 && this.aiPlays) { this.aiT -= dt; if (this.aiT <= 0) { this.answer = 0; this.react(); } } return this.answer >= 0 && this.pt > 0.2; },
        draw: (c, W, H) => { this.booth(c, W, H); this.couple(c, W, H); this.btns = this.buttons(c, ANS, H * 0.06 + 34, 130); } },
      { id: 'a', cap: '', dur: 3.6, draw: (c, W, H) => { this.booth(c, W, H, 1); this.couple(c, W, H); const t = ['🎅 „Ho-ho-ho! Așa vă știam! Aveți un loc pe lista cuminților” 📜', '🎅 „Cam da… Moșul notează: CAM. Ho-ho!” 📝', `🎅 „${tattle.replace(/!.*/, '')}?! Ho-ho-ho! Las' că primește tot cadou…”`][Math.max(0, this.answer)]; this.phases[this.pi].cap = t; if (this.answer === 2) this.bub(c, tattle, me === 'bubu' ? W * 0.3 : W * 0.72, H * 0.55, 13); } },
      { id: 'pose', cap: '📸 Poza! Cum ieșiți în poză?', hint: 'Alege poza', max: 20,
        tap: (type, x, y) => { if (type !== 'down' || this.pose >= 0) return; const i = this.btns.findIndex(r => this.hit(r, x, y)); if (i >= 0) { this.pose = i; this.send({ pose: i }); } },
        play: dt => { if (this.pose < 0 && this.aiPlays) { this.aiT -= dt; if (this.aiT <= -3) this.pose = 0; } return this.pose >= 0; },
        draw: (c, W, H) => { this.booth(c, W, H); this.couple(c, W, H); this.btns = this.buttons(c, POSES, H * 0.06 + 34, 130); } },
      { id: 'cheese', cap: 'Zâmbiți! 3… 2… 1…', dur: 3.2, enter: () => { const a = ['love', 'dance_wave', 'kiss'][this.pose] ?? 'love'; this.bubu.play(a); this.dudu.play(this.pose === 1 ? 'dance_robot' : a); },
        draw: (c, W, H, k) => { this.booth(c, W, H, 1); this.couple(c, W, H); const n = 3 - Math.floor(k * 3); if (k < 0.95) say(c, String(Math.max(1, n)), W / 2, H * 0.3, 70, '#ff4d6d'); if (k > 0.93 && !this.photo) { this.flash = 1; Sfx.play('click'); Sfx.play('ding'); this.snap(c, W, H); } } },
      { id: 'photo', cap: '📒 Poza cu Moș Crăciun a intrat în albumul de amintiri!', dur: 4, enter: () => { Sfx.play('good'); this.boom(30); },
        draw: (c, W, H, k) => { this.booth(c, W, H); this.couple(c, W, H); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, W, H); if (this.photo) { const pw = Math.min(W * 0.5, 320), ph = pw * 0.85; c.save(); c.translate(W / 2, H * 0.45); c.rotate(-0.06 + Math.sin(this.t) * 0.02); c.scale(0.6 + 0.4 * ease(clamp(k * 3)), 0.6 + 0.4 * ease(clamp(k * 3))); rrect(c, -pw / 2, -ph / 2, pw, ph + 30, 4, '#fff'); c.drawImage(this.photo, -pw / 2 + 10, -ph / 2 + 10, pw - 20, ph - 20); c.font = '800 14px "Baloo 2", sans-serif'; c.fillStyle = O; c.textAlign = 'center'; c.fillText('Crăciun ' + (2026 + Hol.yearOf(this.scene.w.day)) + ' 🎅💕', 0, ph / 2 + 12); c.restore(); } } },
    ];
  }
  react() { if (this.answer === 2) { (this.scene.myId === 'bubu' ? this.dudu : this.bubu).play('shy'); Sfx.play('gasp'); } else Sfx.play('chimes', { vol: 0.5 }); }
  snap(_c: CanvasRenderingContext2D, W: number, H: number) { try { const cv = document.createElement('canvas'); cv.width = 320; cv.height = 272; const c2 = cv.getContext('2d')!; c2.scale(320 / W, 272 / (H * 0.85)); this.booth(c2, W, H, 1); this.couple(c2, W, H); this.photo = cv; } catch { /* */ } }
  onNet(d: any) { if (d.ans != null && this.answer < 0) { this.answer = d.ans; this.react(); } if (d.pose != null && this.pose < 0) this.pose = d.pose; }
  endText() { return 'Ho-ho-ho! 🎅'; }
  reward() { const s = this.scene; if (this.quit && this.pi < 4) return; if (Hol.once(s, Hol.yearKey(s, 'santa'))) { s.op({ k: 'hearts', delta: 10 }); s.log('Ați făcut o poză cu Moș Crăciun la târgul din oraș 🎅📸'); } Hol.memory(s, 'santa'); Hol.feel(s, s.myId, { fun: 20, love: 10 }); if (this.partnerAI) Hol.feel(s, s.partner.id, { fun: 20, love: 10 }); }
}

// ====================================================================== 5. Patinoarul (ritm: atingi la timp, altfel... pleosc!)
const MOVES = [{ icon: '🌀', label: 'Piruetă!' }, { icon: '💞', label: 'De mânuțe!' }, { icon: '🦵', label: 'Pe un picior!' }, { icon: '🔄', label: 'Întoarcere!' }, { icon: '🚀', label: 'Viteză!' }];
export class SkateShow extends Show {
  prompts: { at: number; m: number; res?: 'hit' | 'miss' }[] = []; hits = 0; falls: { who: 'me' | 'pa'; t: number }[] = []; ang = 0; spin = 0; combo = 0; paHits = 0;
  start2 = 0;
  rink(c: CanvasRenderingContext2D, W: number, H: number) {
    this.sky(c, W, H * 0.4, '#1d2550', '#4b3f7a'); this.stars(c, W, H * 0.35, 30); this.lights(c, 0, H * 0.06, W, H * 0.1, 14, 18, 1);
    this.ground(c, W, H, H * 0.4, '#eef3f8');
    ell(c, W / 2, H * 0.7, W * 0.44, H * 0.22, '#cfe9fb', true, 4); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(W / 2, H * 0.7, W * (0.12 + i * 0.05), H * (0.06 + i * 0.025), 0, 0.3 + i, 1.3 + i); c.stroke(); }
    c.strokeStyle = '#c0573e'; c.lineWidth = 6; c.beginPath(); c.ellipse(W / 2, H * 0.7, W * 0.46, H * 0.235, 0, Math.PI, 0); c.stroke();
    this.snow(c, W, H, 30);
  }
  skaters(c: CanvasRenderingContext2D, W: number, H: number) {
    const s = this.sz() * 0.55;
    const pos = (off: number) => { const a = this.ang + off; return { x: W / 2 + Math.cos(a) * W * 0.3, y: H * 0.7 + Math.sin(a) * H * 0.12 }; };
    const pm = pos(0), pp = pos(0.5);
    for (const [a, p, who] of [[this.me, pm, 'me'], [this.pa, pp, 'pa']] as const) {
      const f = this.falls.find(x => x.who === who && this.t - x.t < 1.6);
      c.save();
      if (f) { const k = (this.t - f.t) / 1.6; c.translate(p.x, p.y); c.rotate(k < 0.6 ? -1.4 : -1.4 * (1 - (k - 0.6) / 0.4)); c.translate(-p.x, -p.y); }
      else if (this.spin > 0) { c.translate(p.x, p.y); c.scale(Math.cos(this.spin * 12), 1); c.translate(-p.x, -p.y); }
      this.put(a, p.x, p.y, s, Math.sin(this.ang) > 0 ? -1 : 1); a.draw(c); c.restore();
      if (f && this.t - f.t < 1.2) for (let i = 0; i < 3; i++) icon(c, '⭐', p.x + Math.cos(this.t * 6 + i * 2) * 22, p.y - 70 + Math.sin(this.t * 6 + i * 2) * 6, 14);
    }
    if (this.combo >= 3) { c.strokeStyle = '#ff7aa2'; c.lineWidth = 3; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(pm.x, pm.y - 30); c.lineTo(pp.x, pp.y - 30); c.stroke(); c.setLineDash([]); }
  }
  build(): Phase[] {
    const N = 12, gap = 1.7;
    return [
      { id: 'in', cap: '⛸️ Pe gheață! Țineți-vă bine… sau nu 😄', dur: 2.6, enter: () => { Sfx.play('jingle'); }, draw: (c, W, H) => { this.ang += 0.01; this.rink(c, W, H); this.skaters(c, W, H); } },
      { id: 'skate', cap: '', hint: 'Atinge când cercul ajunge pe figură!', max: N * gap + 4,
        enter: () => { this.start2 = this.t; this.prompts = Array.from({ length: N }, (_, i) => ({ at: this.t + 1.6 + i * gap, m: i % MOVES.length })); },
        tap: (type) => { if (type !== 'down') return; const p = this.prompts.find(q => !q.res && Math.abs(q.at - this.t) < 0.6); if (!p) return; const d = Math.abs(p.at - this.t); if (d < 0.28) this.good(p); else this.bad(p); },
        play: dt => {
          this.ang += dt * (0.9 + this.combo * 0.08); this.spin = Math.max(0, this.spin - dt);
          for (const p of this.prompts) if (!p.res && this.t - p.at > 0.32) this.bad(p);
          if (this.aiPlays) for (const p of this.prompts) if (!(p as any).ai && this.t > p.at) { (p as any).ai = 1; if (Math.random() < 0.72) this.paHits++; else { this.falls.push({ who: 'pa', t: this.t }); Sfx.play('jump_land'); this.me.play('laugh'); } }
          return this.prompts.every(p => p.res) && this.t > this.prompts[this.prompts.length - 1].at + 1;
        },
        draw: (c, W, H) => {
          this.rink(c, W, H); this.skaters(c, W, H);
          const p = this.prompts.find(q => !q.res && q.at - this.t < 1.6); const cx = W / 2, cy = H * 0.26;
          ell(c, cx, cy, 34, 34, '#fffaf5', true, 3);
          if (p) { const k = clamp((p.at - this.t) / 1.6); icon(c, MOVES[p.m].icon, cx, cy, 34); c.strokeStyle = k < 0.18 ? '#7cc576' : '#ff4d8d'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, 34 + k * 70, 0, 7); c.stroke(); say(c, MOVES[p.m].label, cx, cy + 52, 15, '#7a3a5a'); }
          say(c, `✨ ${this.hits}/${N}${this.combo >= 2 ? `  ·  combo ×${this.combo}` : ''}`, 120, 30, 16, '#2b6a9a');
        } },
      { id: 'end', cap: '', dur: 3.2, enter: () => { const good = this.hits >= 8; this.boom(good ? 60 : 20); Sfx.play(good ? 'applause' : 'giggle'); this.me.play(good ? 'dance_hop' : 'laugh'); this.pa.play(good ? 'love' : 'laugh'); },
        draw: (c, W, H) => { this.ang += 0.006; this.rink(c, W, H); this.skaters(c, W, H); this.phases[this.pi].cap = this.hits >= 10 ? '🏅 Ca la Olimpiadă! Lumea aplaudă!' : this.hits >= 6 ? '⛸️ Frumos! Doar câteva căzături… artistice' : '😂 Mai mult pe fund decât pe patine, dar ce distracție!'; } },
    ];
  }
  good(p: { res?: string; m: number }) { p.res = 'hit'; this.hits++; this.combo++; Sfx.play('ice'); Sfx.play('pop'); if (p.m === 0) this.spin = 0.5; if (p.m === 1) { this.fx.hearts(this.W / 2, this.H * 0.6, 6); } this.fx.text(this.W / 2, this.H * 0.45, this.combo >= 3 ? 'Perfect! ✨' : 'Bravo!', '#7cc576', 0.9); this.send({ sk: 1 }); }
  bad(p: { res?: string }) { p.res = 'miss'; this.combo = 0; this.falls.push({ who: 'me', t: this.t }); Sfx.play('jump_land'); this.fx.text(this.W / 2, this.H * 0.45, 'Pleosc! 💫', '#ff4d6d', 1); this.pa.play('laugh'); this.send({ sk: 0 }); }
  onNet(d: any) { if (d.sk === 0) { this.falls.push({ who: 'pa', t: this.t }); this.me.play('laugh'); } if (d.sk === 1) this.paHits++; }
  endText() { return this.hits >= 8 ? 'Patinatori de aur! ⛸️' : 'Ce distracție! ⛸️😂'; }
  reward() { const s = this.scene, k = this.hits / 12; Hol.memory(s, 'skate'); Hol.feel(s, s.myId, { fun: 15 + Math.round(15 * k), love: 6 + Math.round(8 * k), energy: -6 }); if (this.partnerAI) Hol.feel(s, s.partner.id, { fun: 22, love: 10, energy: -6 }); s.op({ k: 'hearts', delta: Math.round(4 + 6 * k) }); }
}

// ====================================================================== 6. Caluteii (prinzi inelul de aur)
export class CarouselShow extends Show {
  rot = 0; rings = 0; gold = 0; tries = 0; lastLap = -1; grabbed = false; paRings = 0;
  carousel(c: CanvasRenderingContext2D, W: number, H: number, light = 1) {
    this.sky(c, W, H * 0.5, '#1d2550', '#56487f'); this.stars(c, W, H * 0.45, 30); this.ground(c, W, H, H * 0.5, '#eef3f8');
    const cx = W / 2, cy = H * 0.68, R = W * 0.3;
    // acoperisul
    c.fillStyle = '#ff7aa2'; c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - R - 20, cy - H * 0.36); c.lineTo(cx, cy - H * 0.55); c.lineTo(cx + R + 20, cy - H * 0.36); c.closePath(); c.fill(); c.stroke();
    for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#fff' : '#ff4d8d'; c.beginPath(); c.moveTo(cx - R - 20 + i * (2 * R + 40) / 10, cy - H * 0.36); c.lineTo(cx - R - 20 + (i + 1) * (2 * R + 40) / 10, cy - H * 0.36); c.lineTo(cx - R - 20 + (i + 0.5) * (2 * R + 40) / 10, cy - H * 0.3); c.closePath(); c.fill(); c.stroke(); }
    for (let i = 0; i < 12; i++) { c.fillStyle = ['#ffd23f', '#fff', '#4cc9f0'][i % 3]; c.globalAlpha = light * (0.5 + 0.5 * Math.sin(this.t * 6 + i)); c.beginPath(); c.arc(cx - R - 10 + i * (2 * R + 20) / 11, cy - H * 0.36, 4, 0, 7); c.fill(); c.globalAlpha = 1; }
    rrect(c, cx - 14, cy - H * 0.36, 28, H * 0.36, 4, '#ffd23f'); ell(c, cx, cy + 6, R + 24, H * 0.07, '#c98e5f', true, 3);
  }
  horses(c: CanvasRenderingContext2D, W: number, H: number) {
    const cx = W / 2, cy = H * 0.68, R = W * 0.3, items: { z: number; draw: () => void }[] = [];
    for (let i = 0; i < 6; i++) {
      const a = this.rot + i * Math.PI / 3, x = cx + Math.cos(a) * R, z = Math.sin(a), y = cy + z * H * 0.05 - 30 - Math.sin(this.t * 3 + i) * 12, sc = 0.75 + 0.25 * (z + 1) / 2;
      items.push({ z, draw: () => {
        c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, cy - H * 0.36); c.lineTo(x, y + 20); c.stroke();
        c.save(); c.translate(x, y); c.scale(sc * (Math.cos(a) > 0 ? -1 : 1), sc); ell(c, 0, 0, 28, 14, ['#fff', '#ffd6e0', '#d6ecff'][i % 3]); ell(c, 24, -16, 10, 12, ['#fff', '#ffd6e0', '#d6ecff'][i % 3]); c.strokeStyle = O; c.lineWidth = 3; for (const lx of [-16, 16]) { c.beginPath(); c.moveTo(lx, 10); c.lineTo(lx + 4, 26); c.stroke(); } c.fillStyle = '#ff7aa2'; c.fillRect(-10, -16, 18, 6); c.restore();
        const rider = i === 0 ? this.bubu : i === 3 ? this.dudu : null; if (rider) { this.put(rider, x, y - 10, this.sz() * 0.58 * sc, Math.cos(a) > 0 ? -1 : 1); rider.draw(c); }
      } });
    }
    items.sort((p, q) => p.z - q.z).forEach(it => it.draw());
  }
  myAngle() { return this.rot + (this.scene.myId === 'bubu' ? 0 : Math.PI); }
  /** inelele stau la dreapta: calul tau trece prin dreptul lor o data pe tura */
  nearRings() { const a = ((this.myAngle() % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return Math.abs(a - Math.PI * 0.1) < 0.35; }
  build(): Phase[] {
    return [
      { id: 'up', cap: '🎠 Urcați pe căluței! Muzica pornește…', dur: 2.6, enter: () => Sfx.play('fanfare'), draw: (c, W, H) => { this.rot += 0.005; this.carousel(c, W, H); this.horses(c, W, H); } },
      { id: 'ride', cap: '', hint: 'Când treci pe lângă inele (dreapta), atinge să prinzi unul!', max: 26,
        tap: (type) => { if (type !== 'down') return; this.tries++; if (this.nearRings() && !this.grabbed) { this.grabbed = true; this.rings++; const g = (this.rings + this.scene.w.day) % 4 === 0; if (g) { this.gold++; Sfx.play('ding'); this.boom(30); this.fx.text(this.W * 0.8, this.H * 0.3, 'INELUL DE AUR! 🏆', '#ffb703', 1.2); } else { Sfx.play('coin'); this.fx.text(this.W * 0.8, this.H * 0.3, 'Inel de argint 💍', '#7a8a99', 0.9); } this.send({ ring: g ? 2 : 1 }); } else { Sfx.play('whoosh'); this.fx.text(this.W * 0.5, this.H * 0.4, 'Pe lângă! 😅', '#7a5a4a', 0.8); } },
        play: dt => { this.rot += dt * 1.6; const lap = Math.floor(this.myAngle() / (Math.PI * 2)); if (lap !== this.lastLap) { this.lastLap = lap; this.grabbed = false; } if (this.aiPlays && this.pt % 4 < dt) this.paRings++; return this.pt > 22; },
        draw: (c, W, H) => { this.carousel(c, W, H); this.horses(c, W, H); const rx = W * 0.86, ry = H * 0.4; c.strokeStyle = '#8a5d32'; c.lineWidth = 5; c.beginPath(); c.moveTo(rx + 30, H * 0.9); c.lineTo(rx + 30, ry - 30); c.lineTo(rx, ry - 30); c.stroke(); ell(c, rx, ry, 12, 12, this.nearRings() && !this.grabbed ? '#ffd23f' : '#d0d6de', true, 3); ell(c, rx, ry, 6, 6, '#56487f', false); if (this.nearRings() && !this.grabbed) say(c, 'ACUM!', rx, ry - 48, 16, '#ff4d8d'); say(c, `💍 ${this.rings}   🏆 ${this.gold}`, 110, 30, 16, '#7a3a5a'); } },
      { id: 'dizzy', cap: '', dur: 3.2, enter: () => { this.dudu.play('dizzy'); this.bubu.play('laugh'); Sfx.play('boing'); }, draw: (c, W, H) => { this.carousel(c, W, H, 0.4); const s = this.sz() * 0.66; this.put(this.bubu, W * 0.4, H * 0.86, s, 1); this.put(this.dudu, W * 0.6, H * 0.86, s, -1); this.bubu.draw(c); this.dudu.draw(c); this.phases[this.pi].cap = this.gold ? `🏆 Ați prins inelul de aur! Tura următoare e gratis (+16 lei înapoi)` : '🎠 Ce tură! …Dudu vede căluței și acum 😵‍💫'; } },
    ];
  }
  onNet(d: any) { if (d.ring) this.paRings++; }
  endText() { return '🎠 Wiii!'; }
  reward() { const s = this.scene; Hol.memory(s, 'carusel'); if (this.gold) s.op({ k: 'money', delta: 16 }); Hol.feel(s, s.myId, { fun: 20, love: 8 }); if (this.partnerAI) Hol.feel(s, s.partner.id, { fun: 20, love: 8 }); s.op({ k: 'hearts', delta: 4 }); }
}

// ====================================================================== 7. Revelionul: dans, numaratoarea, artificiile voastre, dorintele
const FW_KINDS = [{ k: 'heart', icon: '💗', label: 'Inimă' }, { k: 'star', icon: '⭐', label: 'Stea' }, { k: 'flower', icon: '🌸', label: 'Floare' }, { k: 'panda', icon: '🐼', label: 'Panda' }, { k: 'bear', icon: '🐻', label: 'Ursuleț' }, { k: 'circle', icon: '✨', label: 'Sclipici' }];
const FW_COLS = [['#ff4d6d', '#ff9ab8', '#fff'], ['#ffd23f', '#fff4b0', '#fff'], ['#c77dff', '#ff9ab8', '#ffd23f'], ['#fff', '#2b2b33', '#fff'], ['#c8917a', '#ffd9c2', '#fff'], ['#4cc9f0', '#7cc576', '#ffd23f']];
const WISHES = [{ icon: '💕', label: 'Mereu împreună' }, { icon: '✈️', label: 'O vacanță' }, { icon: '🏡', label: 'Casă mai mare' }, { icon: '💰', label: 'Bani mulți' }, { icon: '🐶', label: 'Un cățel' }];
export class NewYearShow extends Show {
  beatT = 0; beats = 0; good = 0; combo = 0; num = 10; shout = 0; kind = 0; rockets: { x: number; y: number; tx: number; ty: number; k: number; t: number }[] = []; fired = 0; aiT = 1;
  btns: { x: number; y: number; w: number; h: number }[] = []; wish = -1; paWish = -1; lant: { x: number; y: number; w: number; mine: boolean }[] = []; corkHit = false;
  constructor(scene: any, done: (s: number) => void) { super(scene, done); this.guests = this.villagers('party'); }
  square(c: CanvasRenderingContext2D, W: number, H: number, disco = 0) {
    this.village(c, W, H, H * 0.45, 1, true);
    this.lights(c, 0, H * 0.18, W * 0.5, H * 0.24, 20, 14, 1); this.lights(c, W * 0.5, H * 0.24, W, H * 0.18, 20, 14, 1);
    rrect(c, W * 0.3, H * 0.06, W * 0.4, 30, 10, '#ffd23f'); say(c, '🎆 La mulți ani! 🎆', W / 2, H * 0.06 + 15, 16, '#7a3a5a');
    if (disco) { for (let i = 0; i < 6; i++) { const a = this.t * 1.5 + i; c.fillStyle = ['rgba(255,77,141,0.12)', 'rgba(76,201,240,0.12)', 'rgba(255,210,63,0.12)'][i % 3]; c.beginPath(); c.moveTo(W / 2, H * 0.12); c.lineTo(W / 2 + Math.cos(a) * W, H); c.lineTo(W / 2 + Math.cos(a + 0.2) * W, H); c.closePath(); c.fill(); } ell(c, W / 2, H * 0.14, 14, 14, '#d0d6de', true, 2); }
  }
  crowd(c: CanvasRenderingContext2D, W: number, H: number, bounce = 0) { const s = this.sz() * 0.55; this.guests.forEach((g, i) => { this.put(g, W * (0.08 + i * 0.12 + (i > 2 ? 0.26 : 0)), H * 0.85 - Math.abs(Math.sin(this.t * 5 + i)) * bounce, s, i > 2 ? -1 : 1); g.draw(c); }); }
  couple(c: CanvasRenderingContext2D, W: number, H: number) { const s = this.sz() * 0.66; this.put(this.bubu, W * 0.44, H * 0.87, s, 1); this.put(this.dudu, W * 0.56, H * 0.87, s, -1); this.bubu.draw(c); this.dudu.draw(c); }
  launch(x: number, y: number, k: number, mine: boolean) {
    this.rockets.push({ x: x + (Math.random() - 0.5) * 20, y: this.H, tx: x, ty: y, k, t: 0 }); Sfx.play('rocket');
    if (mine) { this.fired++; this.send({ fw: { x: x / this.W, y: y / this.H, k } }); }
  }
  build(): Phase[] {
    const DANCES = ['dance_disco', 'dance_robot', 'dance_hop', 'dance_wave', 'shakebutt'];
    return [
      { id: 'party', cap: '🎉 Petrecerea de Revelion! Tot satul e în piață', dur: 3, enter: () => { Sfx.play('fanfare'); Sfx.play('horn'); for (const g of this.guests) g.play('dance_hop'); }, draw: (c, W, H) => { this.square(c, W, H, 1); this.crowd(c, W, H, 6); this.couple(c, W, H); } },
      { id: 'dance', cap: '', hint: 'Atinge pe ritm, când cercul pulsează!', max: 16,
        enter: () => { this.beatT = 0; this.beats = 0; },
        tap: (type) => { if (type !== 'down') return; const ph = (this.beatT % 0.6) / 0.6, d = Math.min(ph, 1 - ph) * 0.6; if (d < 0.11) { this.good++; this.combo++; this.me.play(DANCES[this.combo % DANCES.length]); this.fx.text(this.W / 2, this.H * 0.36, this.combo > 4 ? 'Pe foc! 🔥' : 'Pe ritm! ✨', '#ffd23f', 0.9); if (this.combo % 5 === 0) this.boom(20); this.send({ dance: this.combo }); } else { this.combo = 0; this.fx.text(this.W / 2, this.H * 0.36, 'Ups, pe lângă 😅', '#fff', 0.7); } },
        play: dt => { const prev = Math.floor(this.beatT / 0.6); this.beatT += dt; const cur = Math.floor(this.beatT / 0.6); if (cur !== prev) { Sfx.play('kick'); this.beats++; if (this.beats % 4 === 0) { const g = this.guest('rex'); g.play('dance_robot'); } if (this.aiPlays && this.beats % 2 === 0) this.pa.play(DANCES[this.beats % DANCES.length]); } return this.beats >= 24; },
        draw: (c, W, H) => { this.square(c, W, H, 1); this.crowd(c, W, H, 8); this.couple(c, W, H); const ph = (this.beatT % 0.6) / 0.6, r = 30 + (1 - ph) * 18; ell(c, W / 2, H * 0.28, r, r, 'rgba(255,77,141,0.85)', true, 3); say(c, '🥁', W / 2, H * 0.28, 22); say(c, `✨ ${this.good}  ·  combo ${this.combo}`, 110, 30, 15, '#fff'); if (this.beats > 8 && this.beats < 14) this.bub(c, 'Rex face robotul 🤖 (singurul pas pe care îl știe)', W * 0.75, H * 0.55, 12); } },
      { id: 'count', cap: '⏰ Numărătoarea! Strigați cu toții!', hint: 'Atinge la fiecare număr!', max: 11.5,
        enter: () => { this.num = 10; this.shout = 0; Sfx.play('drumroll'); },
        tap: (type) => { if (type === 'down') { this.shout++; this.fx.text(this.W * (0.3 + Math.random() * 0.4), this.H * 0.55, String(Math.max(1, this.num)) + '!', '#ffd23f', 1.1); Sfx.play('pop', { vol: 0.6 }); } },
        play: () => { const n = 10 - Math.floor(this.pt / 0.95); if (n !== this.num && n >= 0) { this.num = n; Sfx.play(n === 0 ? 'boom' : 'click'); } return this.pt > 10.2; },
        draw: (c, W, H) => { this.square(c, W, H); this.crowd(c, W, H, 3); this.couple(c, W, H); const k = (this.pt % 0.95) / 0.95; say(c, String(Math.max(1, this.num)), W / 2, H * 0.35, 90 + 40 * (1 - k), this.num <= 3 ? '#ff4d6d' : '#ffd23f'); } },
      { id: 'zero', cap: '🎆 LA MULȚI ANI! 🥂', dur: 4.4, enter: () => { this.flash = 1; Sfx.play('boom'); Sfx.play('applause'); Sfx.play('cork'); this.boom(120); for (const g of this.guests) g.play('dance_hop'); this.bubu.play('kiss'); this.dudu.play('kiss'); for (let i = 0; i < 4; i++) setTimeout(() => this.shape(this.W * (0.2 + i * 0.2), this.H * (0.2 + (i % 2) * 0.1), FW_KINDS[i].k, FW_COLS[i]), i * 400); },
        draw: (c, W, H, k) => { this.square(c, W, H, 1); this.crowd(c, W, H, 10); this.couple(c, W, H); if (k < 0.2) this.fx.hearts(W / 2, H * 0.75, 2);
          const gx0 = this.guest('gogu').x || W * 0.32, ck = clamp(k * 2.2), cx = lerp(W * 0.5, gx0, ck), cy = H * 0.7 - Math.sin(ck * Math.PI) * H * 0.4; if (ck < 1) ell(c, cx, cy, 6, 9, '#c98e5f'); else if (!this.corkHit) { this.corkHit = true; this.guest('gogu').play('dizzy'); Sfx.play('bonk'); this.fx.text(gx0, H * 0.58, 'Nea Gogu: dop în frunte! 🍾😵', '#ff4d6d', 1); } } },
      { id: 'fw', cap: '', hint: 'Alege forma, apoi atinge cerul: lansezi artificii!', max: 26,
        tap: (type, x, y) => { if (type !== 'down') return; const i = this.btns.findIndex(r => this.hit(r, x, y)); if (i >= 0) { this.kind = i; Sfx.play('pop'); return; } if (y > 124 && y < this.H * 0.66) this.launch(x, y, this.kind, true); },
        play: dt => { for (const r of this.rockets) { r.t += dt; if (r.t >= 0.8 && r.t - dt < 0.8) { this.shape(r.tx, r.ty, FW_KINDS[r.k].k, FW_COLS[r.k], 60 + Math.random() * 20); Sfx.play('boom'); if (Math.random() < 0.3) this.fx.text(r.tx, r.ty + 60, ['Ooooh!', 'Uaaau!', 'Ce frumos! 😍'][Math.floor(Math.random() * 3)], '#fff', 0.8); } } this.rockets = this.rockets.filter(r => r.t < 0.85);
          if (this.aiPlays) { this.aiT -= dt; if (this.aiT <= 0) { this.aiT = 1.3 + Math.random(); this.launch(this.W * (0.15 + Math.random() * 0.7), this.H * (0.36 + Math.random() * 0.22), Math.floor(Math.random() * FW_KINDS.length), false); } }
          return this.pt > 24; },
        draw: (c, W, H) => { this.square(c, W, H); c.fillStyle = 'rgba(10,10,40,0.35)'; c.fillRect(0, 0, W, H * 0.6); this.crowd(c, W, H, 2); this.couple(c, W, H);
          for (const r of this.rockets) { const k = ease(clamp(r.t / 0.8)), x = lerp(r.x, r.tx, k), y = lerp(r.y, r.ty, k); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,210,63,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(lerp(r.x, r.tx, Math.max(0, k - 0.15)), lerp(r.y, r.ty, Math.max(0, k - 0.15))); c.stroke(); }
          this.btns = this.buttons(c, FW_KINDS.map((f, i) => ({ icon: f.icon, label: f.label, on: i === this.kind })), 44, 80); say(c, `🎆 ${this.fired}`, 110, 30, 16, '#fff'); } },
      { id: 'wish', cap: '🏮 O dorință pentru anul care vine…', hint: 'Alege dorința ta', max: 20,
        tap: (type, x, y) => { if (type !== 'down' || this.wish >= 0) return; const i = this.btns.findIndex(r => this.hit(r, x, y)); if (i >= 0) { this.wish = i; this.lant.push({ x: this.W * 0.42, y: this.H * 0.8, w: i, mine: true }); this.send({ wish: i }); Sfx.play('chimes'); } },
        play: dt => { for (const l of this.lant) l.y -= dt * 40; if (this.aiPlays && this.paWish < 0 && this.pt > 2.5) { this.paWish = 0; this.lant.push({ x: this.W * 0.58, y: this.H * 0.8, w: 0, mine: false }); } return this.wish >= 0 && this.pt > 6; },
        draw: (c, W, H) => { this.square(c, W, H); c.fillStyle = 'rgba(10,10,40,0.35)'; c.fillRect(0, 0, W, H); this.couple(c, W, H); for (const l of this.lant) { const x = l.x + Math.sin(this.t * 2 + l.y * 0.05) * 8; rrect(c, x - 16, l.y - 22, 32, 36, 10, '#ff9a5a'); c.globalAlpha = 0.5; ell(c, x, l.y - 4, 26, 26, '#ffd23f', false); c.globalAlpha = 1; icon(c, WISHES[l.w].icon, x, l.y - 4, 18); say(c, WISHES[l.w].label, x, l.y + 26, 12, '#fff'); }
          if (this.wish < 0) this.btns = this.buttons(c, WISHES.map(w => ({ icon: w.icon, label: w.label })), H * 0.08 + 34, 110); } },
    ];
  }
  onNet(d: any) {
    if (d.fw) this.launch(d.fw.x * this.W, d.fw.y * this.H, d.fw.k, false);
    if (d.dance) this.pa.play(['dance_disco', 'dance_robot', 'dance_hop', 'dance_wave', 'shakebutt'][d.dance % 5]);
    if (d.wish != null && this.paWish < 0) { this.paWish = d.wish; this.lant.push({ x: this.W * 0.58, y: this.H * 0.8, w: d.wish, mine: false }); }
  }
  endText() { return 'La mulți ani! 🎆🥂'; }
  reward() {
    const s = this.scene; if (this.quit && this.pi < 3) return;
    if (Hol.once(s, Hol.yearKey(s, 'nye'))) { Hol.befriendAll(s, 1); s.op({ k: 'hearts', delta: 20 }); s.log('Revelion în piața satului: dans, numărătoare și artificii 🎆🥂'); }
    Hol.memory(s, 'revelion'); Hol.feel(s, s.myId, { fun: 40, love: 20 }); if (this.partnerAI) Hol.feel(s, s.partner.id, { fun: 40, love: 20 });
    // miezul noptii a trecut: ceasul sare la 00:10 (daca e inca seara)
    const gm = s.w.gameMin ?? 0, dayStart = Math.floor(gm / 1440) * 1440; if (gm - dayStart < 1440 - 1 && gm - dayStart > 18 * 60) s.op({ k: 'clock', gameMin: dayStart + 1440 + 10 });
  }
}
void heartPath;
