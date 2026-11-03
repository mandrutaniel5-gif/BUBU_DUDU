// Minijoc: astupa-i nasul celui care sforaie (fara sa-l trezesti).
import { Panel } from './base';
import { Actor } from '../char/actor';
import { Sfx } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';
import { g } from '../game/gender';

export class SnoreGame extends Panel {
  sleeper: Actor; breath = 0; pinches = 0; wake = 0; hand = 0;
  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '😴 Astupă-i nasul!', `Atinge când bula de la nas e MICĂ (inspiră). ${g(scene.partner.id, 'Nu-l trezi', 'N-o trezi')}!`);
    this.sleeper = new Actor(scene.partner.id, this.fx);
    this.sleeper.play('act_sleepbed');
  }
  update(dt: number) { super.update(dt); this.sleeper.update(dt); }
  tick(dt: number) {
    const speed = 1.1 + this.pinches * 0.25;
    this.breath = (Math.sin(this.t * speed * Math.PI) + 1) / 2; // 0 = inspira (bula mica), 1 = sforait
    this.hand = Math.max(0, this.hand - dt * 3);
    this.wake = Math.max(0, this.wake - dt * 0.15);
    if (this.breath > 0.96 && Math.random() < dt * 8) { this.shake = 6; Sfx.play('burp'); this.fx.text(this.box.x + this.box.w * 0.6, this.box.y + this.box.h * 0.3, 'HRRRR-PSHHH', '#6a4c93', 1.1); }
    if (!this.sleeper.busy) this.sleeper.play('act_sleepbed');
  }
  pinch() {
    if (this.ended) return;
    this.hand = 1;
    const b = this.box;
    if (this.breath < 0.3) {
      this.pinches++; Sfx.play('pop'); this.fx.text(b.x + b.w / 2, b.y + b.h * 0.35, ['Mmmf…', '…', 'Liniște! 🤫'][Math.min(2, this.pinches - 1)], '#2ec4b6', 1);
      if (this.pinches >= 3) this.finish(1.5, 'Liniște în sfârșit 🤫💤');
    } else {
      this.wake += 0.45; Sfx.play('bad'); this.shake = 4;
      this.fx.text(b.x + b.w / 2, b.y + b.h * 0.35, 'Hmm?! 😠', '#e63946', 1);
      if (this.wake >= 1) { this.sleeper.play('angry'); this.finish(0, g(this.scene.partner.id, 'L-ai trezit! 😤', 'Ai trezit-o! 😤')); }
    }
  }
  pointer(type: string) { if (type === 'down') this.pinch(); }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e')) this.pinch(); }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const O = '#3a2a22';
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2b3a67'); g.addColorStop(1, '#4a3f75'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x + 40, y + h * 0.3, w - 80, 70, 20); ctx.fill(); ctx.stroke();
    const cx = x + w / 2, cy = y + h * 0.42;
    this.sleeper.scale = 2.6; this.sleeper.x = cx; this.sleeper.y = cy; this.sleeper.pose.headOnly = true; this.sleeper.pose.rot = 0; this.sleeper.pose.snot = 0.2 + this.breath * 1.4;
    if (this.wake > 0.5) this.sleeper.pose.eyes = 'half';
    this.sleeper.draw(ctx);
    ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.roundRect(x + 30, y + h * 0.52, w - 60, h * 0.4, 30); ctx.fill(); ctx.stroke();
    // mana care vine sa ciupeasca
    const hx = cx + 160 - this.hand * 140, hy = cy + 18;
    ctx.fillStyle = this.scene.me.actor.spec.body; ctx.beginPath(); ctx.roundRect(hx, hy - 14, 110, 30, 15); ctx.fill(); ctx.stroke();
    // bara de trezire
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x + 40, y + 50, w - 80, 16, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.roundRect(x + 42, y + 52, (w - 84) * Math.min(1, this.wake), 12, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`Se trezește…  ·  Ciupituri: ${this.pinches}/3`, x + w / 2, y + 86);
  }
}
