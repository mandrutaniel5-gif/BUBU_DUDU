import type { WorldScene } from '../scenes/world';
import { Actor } from '../char/actor';
import { Fx } from '../char/fx';

export interface Minigame {
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void;
  pointer?(type: 'down' | 'move' | 'up', x: number, y: number): void;
  key?(k: string, down: boolean): void;
}
export type MinigameCtor = new (scene: WorldScene, done: (score: number) => void) => Minigame;

/** Panou comun: cadru, titlu, instructiuni, buton de iesire, rezultat final. */
export abstract class Panel implements Minigame {
  fx = new Fx();
  t = 0;
  ended: { score: number; text: string; t: number } | null = null;
  box = { x: 0, y: 0, w: 0, h: 0 };
  hero: Actor;
  shake = 0;
  constructor(protected scene: WorldScene, private done: (score: number) => void, public title: string, public help: string) {
    this.hero = new Actor(scene.myId, this.fx);
  }
  finish(score: number, text: string) { if (!this.ended) this.ended = { score, text, t: 0 }; }
  update(dt: number) {
    this.t += dt; this.fx.update(dt); this.hero.update(dt);
    if (this.hero.shakeReq) { this.shake = Math.max(this.shake, this.hero.shakeReq); this.hero.shakeReq = 0; }
    this.shake *= Math.pow(0.02, dt);
    if (this.ended) { this.ended.t += dt; if (this.ended.t > 2.6) this.done(this.ended.score); }
    else this.tick(dt);
  }
  abstract tick(dt: number): void;
  abstract scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void;
  draw(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.fillStyle = 'rgba(40,20,30,0.55)'; ctx.fillRect(0, 0, W, H);
    const w = Math.min(W - 20, 560), h = Math.min(H - 40, 600), x = (W - w) / 2, y = (H - h) / 2;
    this.box = { x, y, w, h };
    ctx.save();
    if (this.shake > 0.3) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    ctx.fillStyle = '#fff8f0'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 26); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 24); ctx.clip();
    this.scene2(ctx, x, y, w, h);
    this.fx.draw(ctx);
    ctx.restore();
    // titlu
    ctx.fillStyle = '#ff7aa2'; ctx.beginPath(); ctx.roundRect(x + w / 2 - 150, y - 18, 300, 40, 20); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '800 20px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.title, x + w / 2, y + 2);
    ctx.fillStyle = '#7a5a4a'; ctx.font = '700 14px "Baloo 2", sans-serif';
    ctx.fillText(this.help, x + w / 2, y + h - 18);
    if (this.ended) {
      const k = Math.min(1, this.ended.t * 3);
      ctx.fillStyle = `rgba(255,255,255,${0.7 * k})`; ctx.fillRect(x, y + h / 2 - 50, w, 100);
      ctx.font = `900 ${Math.round(30 * (0.6 + 0.4 * k))}px "Baloo 2", sans-serif`;
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.strokeText(this.ended.text, x + w / 2, y + h / 2);
      ctx.fillStyle = this.ended.score > 0 ? '#ff4d6d' : '#7a8a99'; ctx.fillText(this.ended.text, x + w / 2, y + h / 2);
    }
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }
}
