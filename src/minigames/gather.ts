// Minijocuri de strans resurse: taiat lemne, spart piatra.
import { Panel, sweep, HIT_SLACK } from './base';
import { Sfx } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';

const O = '#3a2a22';

/** 🪓 Taie copacul: loveste cand acul e in zona verde */
export class ChopGame extends Panel {
  hits = 0; need = 5; marker = 0; zone = 0.34; swing = 0; tilt = 0; fall = 0; miss = 0;
  constructor(s: WorldScene, d: (n: number) => void) {
    super(s, d, '🪓 Taie lemne', s.myId === 'dudu' ? 'Lovește în zona verde! (Dudu e mai puternic 💪)' : 'Lovește în zona verde!');
    if (s.myId === 'dudu') { this.need = 4; this.zone = 0.42; }
  }
  tick(dt: number) {
    this.marker = sweep(this.t, 0.8 + this.hits * 0.08);
    this.swing = Math.max(0, this.swing - dt * 5);
    if (this.fall > 0) { this.fall += dt * 1.4; if (this.fall > 1.4) this.finish(1 + Math.max(0, 3 - this.miss) * 0.3, 'TIMBEEER! 🪵🪵🪵'); }
    if (!this.hero.busy) this.hero.play('idle');
  }
  hit() {
    if (this.fall || this.ended) return;
    this.swing = 1; const b = this.box;
    if (Math.abs(this.marker * 0.95) < this.zone + HIT_SLACK) {
      this.hits++; this.tilt = this.hits / this.need * 0.15; Sfx.play('chop'); this.shake = 6;
      this.fx.burst('drop', b.x + b.w * 0.55, b.y + b.h * 0.7, 8, 2, 160, { grav: 400, max: 0.7, color: '#c98e5f' });
      this.fx.text(b.x + b.w * 0.6, b.y + b.h * 0.45, ['TOC!', 'POC!', 'ZDANG!', 'TRANC!'][this.hits % 4], '#8b5e34', 1.1);
      this.hero.play(this.scene.myId === 'dudu' ? 'flex' : 'wave');
      if (this.hits >= this.need) { this.fall = 0.01; Sfx.play('tree_fall', { delay: 0.15 }); Sfx.play('wood_drop', { delay: 0.9 }); Sfx.play('leaves', { delay: 0.8, vol: 0.6 }); }
    } else { this.miss++; Sfx.play('whoosh'); Sfx.play('bad', { vol: 0.6 }); this.fx.text(b.x + b.w * 0.6, b.y + b.h * 0.45, 'Ups! Ratat 😅', '#e63946', 0.9); this.hero.play('dizzy'); }
  }
  pointer(t: string) { if (t === 'down') this.hit(); }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e')) this.hit(); }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#bfe8ff'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#a6dc93'; ctx.fillRect(x, y + h * 0.78, w, h * 0.22);
    // copacul
    const tx = x + w * 0.6, ty = y + h * 0.8;
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(this.fall ? Math.min(Math.PI / 2, this.fall * this.fall * 1.4) : -this.tilt * Math.sin(this.t * 30) * (this.swing));
    ctx.fillStyle = '#a0703f'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-22, -h * 0.5, 44, h * 0.5, 8); ctx.fill(); ctx.stroke();
    // crestatura
    ctx.fillStyle = '#e7c08f'; ctx.beginPath(); ctx.moveTo(-22, -40); ctx.lineTo(-22 + this.hits * 7, -30); ctx.lineTo(-22, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const [dx, dy, r, c] of [[-50, -h * 0.5, 50, '#6cbf6c'], [50, -h * 0.52, 50, '#6cbf6c'], [0, -h * 0.65, 60, '#7fd07f'], [-20, -h * 0.75, 40, '#8fdc8f']] as const) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, 7); ctx.fillStyle = c; ctx.fill(); ctx.stroke(); }
    ctx.restore();
    // eroul cu toporul
    this.hero.scale = 1.5; this.hero.x = x + w * 0.28; this.hero.y = ty; this.hero.flip = 1;
    this.hero.draw(ctx);
    ctx.save(); ctx.translate(x + w * 0.28 + 34, ty - 34); ctx.rotate(-0.9 + this.swing * 1.5);
    ctx.fillStyle = '#c99a5b'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-4, -60, 8, 70, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c0c6cc'; ctx.beginPath(); ctx.moveTo(4, -60); ctx.lineTo(30, -68); ctx.quadraticCurveTo(36, -52, 30, -36); ctx.lineTo(4, -44); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // indicatorul
    const bx = x + 40, bw = w - 80, by = y + 56;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, by, bw, 24, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9be38f'; ctx.beginPath(); ctx.roundRect(bx + bw / 2 - bw / 2 * this.zone, by + 3, bw * this.zone, 18, 9); ctx.fill();
    const mx = bx + bw / 2 + this.marker * bw / 2 * 0.95; ctx.fillStyle = '#ff4d6d'; ctx.fillRect(mx - 2, by - 4, 4, 32);
    ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = O; ctx.fillText(`Lovituri: ${this.hits}/${this.need}`, x + w / 2, by + 48);
  }
}

/** ⛏️ Sparge piatra: atinge crapaturile care apar */
export class MineGame extends Panel {
  cracks: { x: number; y: number; t: number }[] = []; broken = 0; need = 8; spawn = 0; dur = 15; hp = 1;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '⛏️ Sparge piatra', 'Atinge crăpăturile strălucitoare înainte să dispară!'); }
  tick(dt: number) {
    this.spawn -= dt;
    if (this.spawn <= 0 && this.cracks.length < 3) { this.spawn = 0.6; this.cracks.push({ x: 0.3 + Math.random() * 0.4, y: 0.45 + Math.random() * 0.25, t: 0 }); }
    for (const c of this.cracks) c.t += dt;
    this.cracks = this.cracks.filter(c => c.t < 1.6);
    if (this.broken >= this.need) this.finish(1 + (this.dur - this.t) / this.dur, 'CRAC! Piatră nouă 🪨🪨');
    else if (this.t > this.dur) this.finish(this.broken >= 4 ? 0.6 : 0, this.broken >= 4 ? 'O piatră mică 🪨' : 'Prea tare… 😓');
  }
  pointer(type: string, x: number, y: number) {
    if (type !== 'down') return; const b = this.box;
    const i = this.cracks.findIndex(c => Math.hypot(x - (b.x + c.x * b.w), y - (b.y + c.y * b.h)) < 40);
    if (i < 0) { Sfx.play('step_stone', { vol: 0.6 }); return; }
    const c = this.cracks.splice(i, 1)[0]; this.broken++; this.shake = 5; Sfx.play('mine');
    this.fx.burst('drop', b.x + c.x * b.w, b.y + c.y * b.h, 10, 6.28, 150, { grav: 300, max: 0.6, color: '#a9a49b' });
    this.fx.text(b.x + c.x * b.w, b.y + c.y * b.h - 30, 'CLINC!', '#6c757d', 0.9);
  }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e') && this.cracks[0]) { const b = this.box; this.pointer('down', b.x + this.cracks[0].x * b.w, b.y + this.cracks[0].y * b.h); } }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#e9e1d4'; ctx.fillRect(x, y, w, h);
    const cx = x + w / 2, cy = y + h * 0.58, k = 1 - this.broken / this.need * 0.4;
    ctx.fillStyle = '#a9a49b'; ctx.strokeStyle = O; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx - 170 * k, cy + 80); ctx.lineTo(cx - 140 * k, cy - 60 * k); ctx.lineTo(cx - 20, cy - 130 * k); ctx.lineTo(cx + 120 * k, cy - 80 * k); ctx.lineTo(cx + 170 * k, cy + 80); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c9c4ba'; ctx.beginPath(); ctx.moveTo(cx - 120 * k, cy - 40 * k); ctx.lineTo(cx - 20, cy - 110 * k); ctx.lineTo(cx, cy - 30); ctx.closePath(); ctx.fill();
    for (let i = 0; i < this.broken; i++) { ctx.strokeStyle = '#5a554d'; ctx.lineWidth = 2; ctx.beginPath(); const a = i * 2.1; ctx.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 20); ctx.lineTo(cx + Math.cos(a) * 90, cy + Math.sin(a) * 50); ctx.stroke(); }
    for (const c of this.cracks) {
      const px = x + c.x * w, py = y + c.y * h, a = Math.sin(c.t / 1.6 * Math.PI);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(px - 18, py - 12); ctx.lineTo(px - 4, py); ctx.lineTo(px - 10, py + 10); ctx.lineTo(px + 14, py + 16); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 26 + Math.sin(this.t * 10) * 3, 0, 7); ctx.strokeStyle = '#fff6b0'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    }
    this.hero.scale = 1.2; this.hero.x = x + 60; this.hero.y = y + h - 40; this.hero.draw(ctx);
    ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = O; ctx.fillText(`⛏️ ${this.broken}/${this.need}`, x + w / 2, y + 56);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + 40, y + 70, w - 80, 12, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff7aa2'; ctx.beginPath(); ctx.roundRect(x + 42, y + 72, (w - 84) * Math.max(0, 1 - this.t / this.dur), 8, 4); ctx.fill();
  }
}
