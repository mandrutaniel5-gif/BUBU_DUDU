// Minijoc: "Clătite pentru iubire" — toarnă aluatul, întoarce-o la momentul potrivit, fă un teanc de 3.
import { Panel } from './base';
import { Sfx, type SndHandle } from '../engine/sfx';
import { heartPath } from '../char/draw';
import type { WorldScene } from '../scenes/world';

type Phase = 'pour' | 'cook1' | 'flip' | 'cook2' | 'serve' | 'ceiling';

export class PancakeGame extends Panel {
  phase: Phase = 'pour';
  size = 0; target = 0.7; pouring = false; pourT = 0; pourSnd: SndHandle | null = null;
  cook = 0;           // 0 = crud, 0.5..0.75 = auriu, >1 = ars
  flipT = 0; flipOk = true;
  stack: number[] = []; // calitatea fiecarei clatite
  quality = 0;
  ceilingT = 0;

  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '🥞 Clătite cu dragoste', 'Ține apăsat să torni · Atinge ca s-o întorci când e aurie');
    this.hero.play('act_cook');
  }

  tick(dt: number) {
    if (!this.hero.busy) this.hero.play('idle');
    switch (this.phase) {
      case 'pour':
        if (this.pouring) { this.size = Math.min(1.15, this.size + dt * 0.55); this.pourT -= dt; if (this.pourT <= 0) { this.pourT = 1.4; this.pourSnd?.stop(0.3); this.pourSnd = Sfx.play('pour', { vol: 0.55, rate: 1.1 }); } }
        break;
      case 'cook1': case 'cook2':
        this.cook += dt * (0.22 + this.stack.length * 0.05);
        if (this.cook > 1.15) { this.fx.text(this.cx, this.cy - 80, 'ARSĂ! 🔥', '#6d4c41', 1.2); Sfx.play('cough', { vol: 0.6 }); this.fx.burst('puff', this.cx, this.cy - 20, 12, 3, 60, { color: '#555' }); this.next(0); }
        break;
      case 'flip':
        this.flipT += dt;
        if (this.flipT > 0.9) { this.phase = 'cook2'; this.cook = 0; Sfx.play('squelch', { vol: 0.6, rate: 0.8 }); Sfx.play('pan', { vol: 0.2 }); }
        break;
      case 'ceiling':
        this.ceilingT += dt;
        if (this.ceilingT > 2.2) { this.fx.text(this.hero.x, this.hero.y - 130, 'PLEOSC! 🥞', '#ff9f1c', 1.3); this.hero.play('dizzy'); this.shake = 8; Sfx.play('squelch', { rate: 0.7 }); Sfx.play('bonk'); this.next(0.3); }
        break;
    }
  }

  get cx() { return this.box.x + this.box.w * 0.6; }
  get cy() { return this.box.y + this.box.h * 0.62; }

  next(q: number) {
    this.stack.push(q); this.quality += q;
    this.size = 0; this.cook = 0; this.phase = 'pour'; this.flipT = 0; this.ceilingT = 0;
    if (q > 0.6) { this.fx.hearts(this.cx, this.cy - 60, 5); Sfx.play('good'); this.hero.play('laugh'); }
    if (this.stack.length >= 3) {
      const s = this.quality / 3;
      this.finish(s > 0.15 ? 1 + s : 0, s > 0.75 ? 'CLĂTITE PERFECTE! 🥞💕' : s > 0.4 ? 'Bunicele! 🥞' : s > 0.15 ? 'Se pot mânca… 😅' : 'Comandăm pizza 🍕');
      this.phase = 'serve';
    }
  }

  press(down: boolean) {
    if (this.ended) return;
    if (this.phase === 'pour') {
      if (down) { this.pouring = true; this.pourT = 0; }
      else if (this.pouring) {
        this.pouring = false; this.pourSnd?.stop(0.15); this.pourSnd = null;
        if (this.size < 0.25) return;
        this.phase = 'cook1'; this.cook = 0;
        const err = Math.abs(this.size - this.target);
        this.fx.text(this.cx, this.cy - 90, err < 0.1 ? 'Perfect rotundă!' : this.size > this.target ? 'Prea mare!' : 'Cam mică…', err < 0.1 ? '#2ec4b6' : '#ff9f1c', 0.9);
      }
      return;
    }
    if (!down) return;
    if (this.phase === 'cook1') {
      const q = this.cookQ();
      this.flipOk = q > 0.3;
      this.pq = q;
      if (Math.random() < 0.15) { // se lipeste de tavan :)
        this.phase = 'ceiling'; this.ceilingT = 0; this.fx.text(this.cx, this.box.y + 70, 'S-a lipit de tavan!! 😱', '#e63946', 1); this.hero.play('cry'); Sfx.play('whoosh'); Sfx.play('squelch', { delay: 0.35, vol: 0.6 });
        return;
      }
      this.phase = 'flip'; this.flipT = 0; Sfx.play('whoosh'); Sfx.play('pan', { vol: 0.25 }); this.hero.play('wave');
    } else if (this.phase === 'cook2') {
      const q = (this.cookQ() + this.pq) / 2 * (1 - Math.min(0.5, Math.abs(this.size - this.target)));
      this.next(q);
    }
  }
  pq = 0;
  cookQ() { const c = this.cook; if (c < 0.3) return 0.1; if (c < 0.5) return 0.5; if (c <= 0.78) return 1; if (c < 1) return 0.5; return 0; }

  pointer(type: string) { if (type === 'down') this.press(true); if (type === 'up') this.press(false); }
  key(k: string, down: boolean) { if (k === ' ' || k === 'e' || k === 'enter') this.press(down); }

  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const O = '#3a2a22';
    ctx.fillStyle = '#ffe9d6'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffd8c9';
    for (let i = 0; i < w; i += 30) for (let j = 0; j < h * 0.55; j += 30) if (((i + j) / 30) % 2 === 0) ctx.fillRect(x + i, y + j, 30, 30);
    // tavanul
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, 40);
    // aragazul
    const cx = this.cx, cy = this.cy;
    ctx.fillStyle = '#f2f2f2'; ctx.strokeStyle = O; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(cx - 150, cy + 30, 300, h - (cy - y) - 60, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a4a52'; ctx.beginPath(); ctx.roundRect(cx - 150, cy + 20, 300, 24, 8); ctx.fill(); ctx.stroke();
    // flacari
    for (let i = -2; i <= 2; i++) { const fl = 8 + Math.sin(this.t * 20 + i) * 3; ctx.fillStyle = '#4cc9f0'; ctx.beginPath(); ctx.ellipse(cx + i * 18, cy + 18, 5, fl, 0, 0, 7); ctx.fill(); }
    // tigaia
    ctx.fillStyle = '#3d3d45'; ctx.beginPath(); ctx.ellipse(cx, cy, 120, 34, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b4a2f'; ctx.beginPath(); ctx.roundRect(cx + 110, cy - 8, 120, 16, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#56565f'; ctx.beginPath(); ctx.ellipse(cx, cy - 2, 100, 26, 0, 0, 7); ctx.fill();
    // clatita
    const col = (c: number) => c < 0.3 ? '#fff1c1' : c < 0.5 ? '#ffe08a' : c <= 0.78 ? '#f2b04a' : c < 1 ? '#c97a2e' : '#5d4037';
    const r = 90 * this.size;
    if (this.phase === 'flip') {
      const k = this.flipT / 0.9; const hy = -Math.sin(k * Math.PI) * 170;
      ctx.save(); ctx.translate(cx, cy - 4 + hy); ctx.scale(1, Math.cos(k * Math.PI * 2) * 0.28);
      ctx.fillStyle = col(this.cook); ctx.beginPath(); ctx.ellipse(0, 0, r, r, 0, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    } else if (this.phase === 'ceiling') {
      const k = Math.min(1, this.ceilingT * 4);
      const yy = this.ceilingT < 2 ? y + 40 + 8 : y + 48 + (this.ceilingT - 2) * 1800;
      ctx.fillStyle = col(this.cook); ctx.beginPath(); ctx.ellipse(cx - (cx - this.hero.x) * Math.max(0, this.ceilingT - 1.9) * 5, Math.min(yy, this.hero.y - 110) - (1 - k) * 0, r, 14, 0, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      if (this.ceilingT < 2) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#fff1c1'; ctx.beginPath(); ctx.ellipse(cx - 30 + i * 30, y + 62 + ((this.t * 40 + i * 13) % 30), 3, 5, 0, 0, 7); ctx.fill(); }
    } else if (this.size > 0 && this.phase !== 'serve') {
      ctx.fillStyle = col(this.cook); ctx.beginPath(); ctx.ellipse(cx, cy - 4, r, r * 0.27, 0, 0, 7); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      if (this.phase === 'cook1' || this.phase === 'cook2') for (let i = 0; i < 6; i++) { const a = i * 1.1 + this.t; const br = (Math.sin(this.t * 5 + i * 2) + 1) * 2; ctx.fillStyle = '#ffffff66'; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * r * 0.5, cy - 4 + Math.sin(a) * r * 0.12, br + 1, br * 0.4 + 0.5, 0, 0, 7); ctx.fill(); }
    }
    // tinta de turnare
    if (this.phase === 'pour') {
      ctx.setLineDash([8, 6]); ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx, cy - 4, 90 * this.target, 90 * this.target * 0.27, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      // castronul cu aluat
      const bx = cx - 20, by = cy - 150 + (this.pouring ? 20 : 0);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(this.pouring ? 0.7 : 0);
      ctx.fillStyle = '#ffb6c9'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-40, -10); ctx.quadraticCurveTo(0, 50, 40, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff1c1'; ctx.beginPath(); ctx.ellipse(0, -10, 38, 8, 0, 0, 7); ctx.fill(); ctx.restore();
      if (this.pouring) { ctx.strokeStyle = '#fff1c1'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(bx + 24, by + 10); ctx.quadraticCurveTo(cx + 5, cy - 60, cx, cy - 6); ctx.stroke(); }
    }
    // indicator de copt
    if (this.phase === 'cook1' || this.phase === 'cook2') {
      const bx = x + 30, bw = w - 60, by = y + 60;
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, '#fff1c1'); g.addColorStop(0.42, '#ffe08a'); g.addColorStop(0.55, '#f2b04a'); g.addColorStop(0.7, '#f2b04a'); g.addColorStop(0.85, '#c97a2e'); g.addColorStop(1, '#5d4037');
      ctx.fillStyle = g; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, by, bw, 22, 11); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#2ec4b6'; ctx.lineWidth = 3; ctx.strokeRect(bx + bw * 0.5 / 1.15, by - 3, bw * 0.28 / 1.15, 28);
      const mx = bx + Math.min(1, this.cook / 1.15) * bw;
      ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.moveTo(mx, by - 2); ctx.lineTo(mx - 8, by - 14); ctx.lineTo(mx + 8, by - 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = O;
      ctx.fillText(this.phase === 'cook1' ? 'Atinge să o întorci când e AURIE!' : 'Atinge să o pui pe farfurie!', x + w / 2, by + 44);
    }
    // farfuria cu teancul
    const px = x + w * 0.2, py = y + h * 0.5;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, py, 60, 16, 0, 0, 7); ctx.fill(); ctx.stroke();
    this.stack.forEach((q, i) => { ctx.fillStyle = q > 0.7 ? '#f2b04a' : q > 0.3 ? '#ffe08a' : '#5d4037'; ctx.beginPath(); ctx.ellipse(px, py - 6 - i * 10, 46, 11, 0, 0, 7); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); });
    if (this.stack.length) { heartPath(ctx, px, py - 14 - this.stack.length * 10, 8); ctx.fillStyle = '#ff4d6d'; ctx.fill(); }
    ctx.fillStyle = O; ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${this.stack.length}/3`, px, py + 34);
    // bucatarul
    this.hero.scale = Math.min(1.5, h / 380); this.hero.x = x + w * 0.2; this.hero.y = y + h - 40; this.hero.flip = 1;
    this.hero.draw(ctx);
  }
}
