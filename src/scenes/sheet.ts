// Plansa de contact: fiecare animatie intr-un cadru reprezentativ (pentru capturi / verificare).
import { Actor } from '../char/actor';
import { ANIM_LIST } from '../char/anims';
import { Fx } from '../char/fx';
import type { Scene, Game } from '../engine/game';

const KEY: Record<string, number> = {
  wave: 0.5, love: 0.6, laugh: 0.4, cry: 0.5, angry: 0.5, shy: 0.5, sleep: 0.6, hungry: 0.4, sick: 0.5,
  sneeze: 0.6, fart: 0.62, fartjump: 0.5, kiss: 0.62, shakebutt: 0.4, dance_hop: 0.25, dance_robot: 0.4,
  dance_disco: 0.3, dance_wave: 0.3, pan: 0.5, tantrum: 0.5, boba: 0.4, flex: 0.5, burp: 0.55, puppy: 0.5,
  dizzy: 0.4, faint: 0.6, slapped: 0.15, hugpose: 0.5, kisspose: 0.5, slap: 0.35, fartback: 0.5,
};

export class SheetScene implements Scene {
  cells: { a: Actor; fx: Fx; label: string }[] = [];
  constructor(private game: Game) {}
  enter() {
    const only = new URLSearchParams(location.search).get('who');
    for (const an of ANIM_LIST) {
      if (an.kind === 'base') continue;
      const ids = an.who === 'both' ? ['bubu', 'dudu'] as const : [an.who];
      for (const id of ids) {
        if (only && id !== only) continue;
        const fx = new Fx(); const a = new Actor(id, fx);
        a.play(an.id);
        const target = an.dur * (KEY[an.id] ?? 0.5);
        for (let t = 0; t < target; t += 1 / 60) { a.update(1 / 60); fx.update(1 / 60); }
        this.cells.push({ a, fx, label: `${an.icon} ${an.label}` });
      }
    }
  }
  exit() {}
  update() {}
  draw(ctx: CanvasRenderingContext2D) {
    const { w, h } = this.game;
    ctx.fillStyle = '#fff6f0'; ctx.fillRect(0, 0, w, h);
    const cols = Math.max(1, Math.floor(w / 170));
    const cw = w / cols, chh = 190;
    this.cells.forEach((c, i) => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * chh;
      ctx.fillStyle = i % 2 ? '#ffeef3' : '#fff'; ctx.fillRect(x + 3, y + 3, cw - 6, chh - 6);
      ctx.save();
      // mutam actorul si particulele in celula
      const ox = x + cw / 2, oy = y + chh - 38;
      ctx.translate(ox, oy);
      c.a.x = 0; c.a.y = 0; c.a.scale = 1.05;
      // particulele au fost emise langa (0,0)
      ctx.beginPath(); ctx.rect(-cw / 2 + 3, -chh + 41, cw - 6, chh - 6); ctx.clip();
      c.a.draw(ctx); c.fx.draw(ctx);
      ctx.restore();
      ctx.fillStyle = '#3a2a22'; ctx.font = '700 13px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${c.a.spec.name} · ${c.label}`, ox, y + chh - 12);
    });
  }
}
