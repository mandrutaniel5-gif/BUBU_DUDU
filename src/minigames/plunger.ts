// Minijoc: "Desfundă toaleta după Dudu" — apasă in ritm cand indicatorul e in zona verde.
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';

export class PlungerGame extends Panel {
  progress = 0;      // 0..1
  water = 0.25;      // nivelul apei 0..1 (1 = inundatie)
  misses = 0;
  marker = 0;        // pozitia indicatorului -1..1
  speed = 1.6;
  zone = 0.28;       // jumatatea latimii zonei verzi
  push = 0;          // animatia pompei
  combo = 0;
  flush = 0;

  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '🪠 Desfundă toaleta!', 'Apasă (atinge / SPAȚIU) când acul e în zona verde');
    this.hero.play('act_plunge');
  }
  tick(dt: number) {
    this.marker = Math.sin(this.t * this.speed * Math.PI);
    this.push = Math.max(0, this.push - dt * 4);
    if (this.flush > 0) { this.flush += dt; if (this.flush > 1.2) this.finish(1 + Math.max(0, 3 - this.misses) * 0.5, 'FLUUUSH! ✨'); }
    // apa urca incet daca nu faci nimic
    this.water = Math.min(1, this.water + dt * 0.012);
    if (!this.hero.busy) this.hero.play('act_plunge');
  }
  hit() {
    if (this.ended || this.flush) return;
    const good = Math.abs(this.marker) < this.zone;
    const cx = this.box.x + this.box.w / 2, cy = this.box.y + this.box.h * 0.55;
    this.push = 1;
    if (good) {
      this.combo++;
      this.progress = Math.min(1, this.progress + 0.13 + Math.min(0.06, this.combo * 0.015));
      this.water = Math.max(0.1, this.water - 0.05);
      Sfx.play('plunge');
      this.fx.text(cx + (Math.random() - 0.5) * 120, cy - 120, ['BLURP!', 'GLGLG!', 'PLOP!', 'FLOSC!'][Math.floor(Math.random() * 4)], '#7a5532', 1.3);
      this.fx.burst('drop', cx, cy - 30, 8, 2.2, 160, { grav: 400, max: 0.8, color: '#a9d6f5' });
      this.shake = 5;
      this.speed = Math.min(3.2, this.speed + 0.12);
      this.zone = Math.max(0.14, this.zone - 0.012);
      if (this.progress >= 1) { this.flush = 0.01; Sfx.play('splash'); }
    } else {
      this.combo = 0; this.misses++;
      this.water = Math.min(1, this.water + 0.22);
      Sfx.play('bad');
      this.fx.text(cx, cy - 140, 'SPLASH! 💦', '#4ea8de', 1.3);
      this.fx.burst('drop', cx, cy - 40, 24, 3, 260, { grav: 500, max: 1, color: '#8b6b3e' });
      this.shake = 10;
      this.hero.play('cry');
      if (this.water >= 1) { this.finish(0, 'INUNDAȚIE! 🌊😭'); Sfx.play('splash'); }
    }
  }
  pointer(type: string) { if (type === 'down') this.hit(); }
  key(k: string, down: boolean) { if (down && (k === ' ' || k === 'e' || k === 'enter')) this.hit(); }

  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    // fundal faianta
    ctx.fillStyle = '#d5eef9'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#b5dcef'; ctx.lineWidth = 2;
    for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + h * 0.7); ctx.stroke(); }
    for (let j = 0; j < h * 0.7; j += 40) { ctx.beginPath(); ctx.moveTo(x, y + j); ctx.lineTo(x + w, y + j); ctx.stroke(); }
    ctx.fillStyle = '#c4e6f5'; ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
    const cx = x + w / 2, base = y + h * 0.78;
    const O = '#3a2a22';
    // rezervorul
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(cx - 70, base - 250, 140, 90, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.roundRect(cx - 18, base - 245, 36, 10, 5); ctx.fill(); ctx.stroke();
    // vasul
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(cx - 60, base - 60); ctx.quadraticCurveTo(cx - 70, base, cx - 40, base); ctx.lineTo(cx + 40, base); ctx.quadraticCurveTo(cx + 70, base, cx + 60, base - 60); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, base - 140, 110, 52, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 105, base - 130); ctx.quadraticCurveTo(cx - 90, base - 60, cx - 60, base - 60); ctx.lineTo(cx + 60, base - 60); ctx.quadraticCurveTo(cx + 90, base - 60, cx + 105, base - 130); ctx.fill(); ctx.stroke();
    // apa (maro daca e infundata)
    const lvl = this.water;
    const wc = this.flush ? '#9fd8f5' : `rgb(${Math.round(150 - 20 * lvl)},${Math.round(110 + 0 * lvl)},${Math.round(70 + 10 * (1 - lvl))})`;
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, base - 140, 88, 38, 0, 0, 7); ctx.clip();
    ctx.fillStyle = wc; ctx.fillRect(cx - 100, base - 178 + (1 - lvl) * 30, 200, 100);
    if (this.flush) { // vartej
      ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(cx, base - 140, 80 - i * 18 - this.flush * 20, 32 - i * 7 - this.flush * 8, this.t * 8 + i, 0, 4); ctx.stroke(); }
    } else {
      for (let i = 0; i < 4; i++) { const bx = cx - 50 + i * 33, by = base - 150 + Math.sin(this.t * 3 + i) * 5; ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.arc(bx, by, 3 + i % 2 * 2, 0, 7); ctx.fill(); }
    }
    ctx.restore();
    // pompa
    const pd = this.push * 26;
    ctx.fillStyle = '#c99a5b'; ctx.beginPath(); ctx.roundRect(cx - 7, base - 330 + pd, 14, 180, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e33b3b'; ctx.beginPath(); ctx.moveTo(cx - 44 - this.push * 10, base - 140 + pd * 0.6); ctx.quadraticCurveTo(cx, base - 210 + pd, cx + 44 + this.push * 10, base - 140 + pd * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    // muste + miros
    if (!this.flush) for (let i = 0; i < 3; i++) { const a = this.t * 4 + i * 2; ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 140, base - 230 + Math.sin(a * 1.3) * 30, 3, 0, 7); ctx.fill(); }
    // eroul langa toaleta
    this.hero.scale = Math.min(1.7, h / 330); this.hero.x = x + w * 0.16; this.hero.y = base + 4; this.hero.flip = 1;
    this.hero.draw(ctx);
    // indicatorul de ritm
    const bx = x + 40, bw = w - 80, by = y + 56;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, by, bw, 26, 13); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9be38f'; ctx.beginPath(); ctx.roundRect(bx + bw / 2 - bw / 2 * this.zone, by + 3, bw * this.zone, 20, 10); ctx.fill();
    const mx = bx + bw / 2 + this.marker * bw / 2 * 0.95;
    ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.moveTo(mx, by - 6); ctx.lineTo(mx - 9, by - 18); ctx.lineTo(mx + 9, by - 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(mx - 2, by, 4, 26);
    // progres + nivel apa
    ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = O;
    ctx.fillText(`Desfundat: ${Math.round(this.progress * 100)}%`, bx, by + 50);
    ctx.textAlign = 'right'; ctx.fillStyle = this.water > 0.7 ? '#e63946' : O;
    ctx.fillText(`Apa: ${'💧'.repeat(Math.ceil(this.water * 5))}`, bx + bw, by + 50);
    ctx.textAlign = 'center';
    if (this.combo >= 3) { ctx.fillStyle = '#ff9f1c'; ctx.fillText(`Combo x${this.combo}! 🔥`, cx, by + 50); }
  }
}
