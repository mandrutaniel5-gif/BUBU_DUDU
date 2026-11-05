// Pescuit la lacul din padure: arunci, astepti sa traga, agati la timp, apoi mulinezi fara sa rupi firul.
import { Panel } from './base';
import { Sfx, type SndHandle } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';
import { heartPath } from '../char/draw';

const O = '#3a2a22';
const FISH = [
  { id: 'caras', name: 'Caras', col: '#f2b04a', size: 1, pull: 0.8, w: 5 },
  { id: 'pastrav', name: 'Păstrăv', col: '#9ad1b0', size: 1.2, pull: 1.1, w: 3 },
  { id: 'stiuca', name: 'Știucă', col: '#7a9a6a', size: 1.6, pull: 1.6, w: 1.5 },
  { id: 'crap', name: 'Crap', col: '#c9a24a', size: 1.4, pull: 1.3, w: 2.5 },
  { id: 'biban', name: 'Biban', col: '#9ab86a', size: 1, pull: 0.9, w: 3 },
  { id: 'somn', name: 'Somn', col: '#5a5a6a', size: 1.9, pull: 1.9, w: 0.8 },
  { id: 'gheata', name: 'O gheată veche 👢', col: '#6b4a2f', size: 1, pull: 0.5, w: 1 },
];

type Phase = 'cast' | 'wait' | 'bite' | 'reel' | 'show';
export class FishingGame extends Panel {
  phase: Phase = 'cast'; waitT = 0; biteT = 0; fish = FISH[0];
  reelSnd: SndHandle | null = null; reelT = 0;
  tension = 0.3; prog = 0; holding = false; caught = 0; lost = 0; showT = 0; lastName = '';
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🎣 Pescuit la lac', 'Atinge ca să arunci. Când se scufundă pluta → atinge repede!'); }
  pickFish() { const tot = FISH.reduce((a, f) => a + f.w, 0); let r = Math.random() * tot; for (const f of FISH) { r -= f.w; if (r <= 0) return f; } return FISH[0]; }
  tick(dt: number) {
    if (this.phase !== 'reel' && this.reelSnd) { this.reelSnd.stop(); this.reelSnd = null; }
    if (this.phase === 'wait') { this.waitT -= dt; if (this.waitT <= 0) { this.phase = 'bite'; this.biteT = 0.9; Sfx.play('splash'); this.fish = this.pickFish(); } }
    else if (this.phase === 'bite') { this.biteT -= dt; if (this.biteT <= 0) { this.phase = 'cast'; this.lost++; this.fx.text(this.box.x + this.box.w * 0.6, this.box.y + this.box.h * 0.45, 'A scăpat… 🐟💨', '#4ea8de', 1); } }
    else if (this.phase === 'reel') {
      if (this.holding) { this.reelT -= dt; if (this.reelT <= 0) { this.reelT = 1.9; this.reelSnd?.stop(0.2); this.reelSnd = Sfx.play('reel', { vol: 0.5 }); } }
      const pull = this.fish.pull * (0.6 + 0.6 * Math.abs(Math.sin(this.t * 2.3)));
      this.tension += (this.holding ? 0.55 : -0.6) * dt + (this.holding ? pull * 0.25 * dt : 0);
      this.tension = Math.max(0, this.tension);
      if (this.holding && this.tension < 0.85) this.prog += dt * 0.35 / this.fish.size;
      else if (!this.holding) this.prog -= dt * 0.05;
      if (this.tension >= 1) { this.phase = 'cast'; this.lost++; Sfx.play('bad'); this.shake = 6; this.fx.text(this.box.x + this.box.w / 2, this.box.y + this.box.h * 0.4, 'S-a rupt firul! 😩', '#e63946', 1.1); this.hero.play('cry'); }
      if (this.prog >= 1) { this.phase = 'show'; this.showT = 1.8; this.caught++; Sfx.play('good'); this.lastName = this.fish.name; this.hero.play(this.fish.id === 'gheata' ? 'laugh' : 'love'); if (this.fish.id !== 'gheata') { this.scene.op({ k: 'res', res: 'fish', delta: 1 }); this.scene.op({ k: 'stat', key: 'fishCaught', delta: 1 }); this.scene.op({ k: 'stat', key: 'fish-' + this.fish.id, delta: 1 }); } }
    } else if (this.phase === 'show') { if (this.reelSnd) { this.reelSnd.stop(); this.reelSnd = null; } this.showT -= dt; if (this.showT <= 0) this.phase = 'cast'; }
    if (this.caught >= 3 || this.lost >= 4) this.finish(this.caught ? 1 + this.caught * 0.3 : 0, this.caught ? `Ai prins ${this.caught} pești! 🐟` : 'Azi nu trag peștii… 🎣');
  }
  press(down: boolean) {
    if (this.ended) return;
    if (!down) { this.holding = false; this.reelSnd?.stop(); this.reelSnd = null; return; }
    if (this.phase === 'cast') { this.phase = 'wait'; this.waitT = 1.5 + Math.random() * 3; Sfx.play('whoosh'); Sfx.play('splash', { vol: 0.4, rate: 1.4, delay: 0.45 }); this.prog = 0; this.tension = 0.3; }
    else if (this.phase === 'bite') { this.phase = 'reel'; Sfx.play('plunge'); this.fx.text(this.box.x + this.box.w * 0.6, this.box.y + this.box.h * 0.45, 'Agățat! Ține apăsat ca să mulinezi', '#2ec4b6', 0.9); this.holding = true; }
    else if (this.phase === 'wait') { this.phase = 'cast'; this.fx.text(this.box.x + this.box.w * 0.6, this.box.y + this.box.h * 0.45, 'Prea devreme! Ai speriat peștii', '#e63946', 0.9); }
    else if (this.phase === 'reel') this.holding = true;
    if (this.holding && this.phase === 'reel' && !this.reelSnd) this.reelSnd = Sfx.play('reel', { vol: 0.5 });
  }
  pointer(t: string) { if (t === 'down') this.press(true); if (t === 'up') this.press(false); }
  key(k: string, d: boolean) { if (k === ' ' || k === 'e') this.press(d); }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const sky = ctx.createLinearGradient(0, y, 0, y + h * 0.4); sky.addColorStop(0, '#bfe8ff'); sky.addColorStop(1, '#e8f6ff'); ctx.fillStyle = sky; ctx.fillRect(x, y, w, h * 0.4);
    for (let i = 0; i < 9; i++) { const tx = x + i * w / 8; ctx.fillStyle = i % 2 ? '#3f8f5a' : '#4aa267'; ctx.beginPath(); ctx.moveTo(tx - 30, y + h * 0.4); ctx.lineTo(tx, y + h * 0.4 - 70 - (i % 3) * 15); ctx.lineTo(tx + 30, y + h * 0.4); ctx.fill(); }
    const wg = ctx.createLinearGradient(0, y + h * 0.4, 0, y + h); wg.addColorStop(0, '#6fbde8'); wg.addColorStop(1, '#3d8fc4'); ctx.fillStyle = wg; ctx.fillRect(x, y + h * 0.4, w, h * 0.6);
    for (let i = 0; i < 8; i++) { ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2; const yy = y + h * 0.48 + i * 34, ox = (this.t * 20 + i * 50) % 80; ctx.beginPath(); ctx.moveTo(x + ox, yy); ctx.quadraticCurveTo(x + ox + 20, yy - 4, x + ox + 40, yy); ctx.stroke(); }
    // podetul + eroul
    ctx.fillStyle = '#c98e5f'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - 10, y + h * 0.72, w * 0.35, 22, 4); ctx.fill(); ctx.stroke();
    this.hero.scale = 1.3; this.hero.x = x + w * 0.18; this.hero.y = y + h * 0.72; this.hero.draw(ctx);
    // undita si pluta
    const rx = x + w * 0.24, ry = y + h * 0.56;
    const bx = x + w * 0.66, by0 = y + h * 0.62;
    const dip = this.phase === 'bite' ? 10 + Math.sin(this.t * 30) * 4 : this.phase === 'reel' ? 6 + Math.sin(this.t * 20) * 3 : Math.sin(this.t * 2) * 2;
    const tipX = rx + 70, tipY = ry - 90 - (this.phase === 'reel' ? this.tension * 20 : 0);
    ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx + 40, ry - 60, tipX, tipY); ctx.stroke();
    if (this.phase !== 'cast') {
      const bx2 = this.phase === 'reel' ? bx - this.prog * (bx - rx - 80) : bx, by = by0 + dip;
      ctx.strokeStyle = this.phase === 'reel' && this.tension > 0.8 ? '#e63946' : '#ffffffcc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(bx2, by); ctx.stroke();
      ctx.fillStyle = '#e63946'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx2, by - 4, 6, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx2, by - 4, 6, 0, Math.PI); ctx.fill(); ctx.stroke();
      if (this.phase === 'bite') { ctx.font = '900 34px "Baloo 2", sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.textAlign = 'center'; ctx.strokeText('!', bx2, by - 30); ctx.fillText('!', bx2, by - 30); }
      if (this.phase === 'reel') { // pestele sub apa
        ctx.save(); ctx.globalAlpha = 0.6; ctx.translate(bx2 + 10, by + 26); ctx.scale(this.fish.size, this.fish.size);
        ctx.fillStyle = this.fish.col; ctx.beginPath(); ctx.ellipse(0, 0, 18, 8, Math.sin(this.t * 8) * 0.2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(26, -7); ctx.lineTo(26, 7); ctx.fill(); ctx.restore();
      }
    }
    if (this.phase === 'show') { // pestele prins
      ctx.save(); ctx.translate(x + w / 2, y + h * 0.32); ctx.scale(2 * this.fish.size, 2 * this.fish.size); ctx.rotate(Math.sin(this.t * 10) * 0.2);
      if (this.fish.id === 'gheata') { ctx.fillStyle = this.fish.col; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(4, -14); ctx.lineTo(4, 2); ctx.lineTo(14, 4); ctx.lineTo(14, 10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else { ctx.fillStyle = this.fish.col; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(24, -7); ctx.lineTo(24, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = O; ctx.beginPath(); ctx.arc(-9, -2, 1.6, 0, 7); ctx.fill(); }
      ctx.restore();
      ctx.font = '800 18px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = O; ctx.fillText(this.lastName + '!', x + w / 2, y + h * 0.18);
    }
    if (this.phase === 'reel') {
      const bxx = x + 40, bw = w - 80;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bxx, y + 52, bw, 14, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.tension > 0.8 ? '#e63946' : this.tension > 0.6 ? '#ff9f1c' : '#7cc576'; ctx.beginPath(); ctx.roundRect(bxx + 2, y + 54, (bw - 4) * Math.min(1, this.tension), 10, 5); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(bxx, y + 76, bw, 10, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#4cc9f0'; ctx.beginPath(); ctx.roundRect(bxx + 2, y + 78, (bw - 4) * Math.max(0, this.prog), 6, 3); ctx.fill();
      ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = O; ctx.fillText('Tensiunea firului (nu lăsa în roșu! dă drumul)', bxx, y + 48);
    }
    ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = O; ctx.fillText(`🐟 ${this.caught}/3`, x + w - 50, y + 100);
    heartPath(ctx, 0, 0, 0);
  }
}
