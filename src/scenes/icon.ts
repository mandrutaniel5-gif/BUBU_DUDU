// Scena folosita doar pentru generarea iconitei aplicatiei.
import { Actor } from '../char/actor';
import { Fx } from '../char/fx';
import type { Scene, Game } from '../engine/game';
export class IconScene implements Scene {
  fx = new Fx(); a = new Actor('bubu', this.fx); b = new Actor('dudu', this.fx);
  constructor(private game: Game) {}
  enter() { this.a.play('love'); this.b.play('love'); for (let i = 0; i < 60; i++) { this.a.update(1 / 60); this.b.update(1 / 60); } }
  exit() {} update() {}
  draw(ctx: CanvasRenderingContext2D) {
    const { w, h } = this.game; const s = Math.min(w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffc2d6'); g.addColorStop(1, '#ffe7c7');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const sc = s / 150;
    this.a.pose.eyes = 'happy'; this.b.pose.eyes = 'happy'; this.a.pose.mouth = 'w'; this.b.pose.mouth = 'w';
    this.a.pose.headOnly = this.b.pose.headOnly = true; this.a.pose.rot = 0.15; this.b.pose.rot = -0.15;
    this.a.pose.blush = this.b.pose.blush = 1.3;
    this.a.scale = this.b.scale = sc;
    this.a.x = w / 2 - 28 * sc; this.b.x = w / 2 + 28 * sc; this.a.y = this.b.y = h / 2 + 18 * sc; this.b.flip = -1;
    this.a.draw(ctx); this.b.draw(ctx);
    ctx.fillStyle = '#ff4d6d'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 2.5 * sc / 2;
    const x = w / 2, y = h / 2 - 38 * sc, k = 13 * sc;
    ctx.beginPath(); ctx.moveTo(x, y + k * 0.35); ctx.bezierCurveTo(x - k, y - k * 0.35, x - k * 0.45, y - k * 1.05, x, y - k * 0.45); ctx.bezierCurveTo(x + k * 0.45, y - k * 1.05, x + k, y - k * 0.35, x, y + k * 0.35); ctx.fill(); ctx.stroke();
  }
}
