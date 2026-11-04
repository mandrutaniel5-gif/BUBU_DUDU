import type { WorldScene } from '../scenes/world';
import { Actor } from '../char/actor';
import { Fx } from '../char/fx';

/** ac care merge cu viteza constanta de la -1 la 1 si inapoi (nu accelereaza prin mijloc) */
export function sweep(t: number, perSec: number) { const x = (t * perSec) % 2; return x < 1 ? x * 2 - 1 : 1 - (x - 1) * 2; }
/** toleranta in plus fata de zona desenata (degetul/tasta au mereu putina intarziere) */
export const HIT_SLACK = 0.07;
/** cat sta pe ecran rezultatul minijocului (o atingere il sare) */
export const END_HOLD = 1.25;

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
  abort() { if (!this.ended) { this.ended = { score: 0, text: 'Altă dată 🙂', t: END_HOLD - 0.5 }; } }
  /** sari peste ecranul de final (o atingere) */
  skipEnd() { if (this.ended && this.ended.t > 0.25) this.ended.t = END_HOLD; }
  finish(score: number, text: string) { if (!this.ended) this.ended = { score, text, t: 0 }; }
  update(dt: number) {
    this.t += dt; this.fx.update(dt); this.hero.update(dt);
    if (this.hero.shakeReq) { this.shake = Math.max(this.shake, this.hero.shakeReq); this.hero.shakeReq = 0; }
    this.shake *= Math.pow(0.02, dt);
    if (this.ended) { this.ended.t += dt; if (this.ended.t >= END_HOLD) this.done(this.ended.score); }
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
    // butonul X (renunta)
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + w - 20, y + 18, 15, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w - 26, y + 12); ctx.lineTo(x + w - 14, y + 24); ctx.moveTo(x + w - 14, y + 12); ctx.lineTo(x + w - 26, y + 24); ctx.stroke();
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
