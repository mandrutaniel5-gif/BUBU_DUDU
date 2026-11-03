// Minijocuri de ingrijire pentru partenerul bolnav: supa, medicamentul cu avionul, compresa rece.
import { Panel } from './base';
import { Actor } from '../char/actor';
import { Sfx } from '../engine/sfx';
import { heartPath } from '../char/draw';
import type { WorldScene } from '../scenes/world';
import { g } from '../game/gender';

abstract class CarePanel extends Panel {
  patient: Actor;
  constructor(scene: WorldScene, done: (s: number) => void, title: string, help: string) {
    super(scene, done, title, help);
    this.patient = new Actor(scene.partner.id, this.fx);
    this.patient.mood = 'sick';
  }
  update(dt: number) { super.update(dt); this.patient.update(dt); if (this.patient.shakeReq) { this.shake = Math.max(this.shake, this.patient.shakeReq); this.patient.shakeReq = 0; } }
  bed(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
    // patul bolnavului cu plapuma
    ctx.fillStyle = '#c98e5f'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 20, w, 60, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 6, y - 40, w - 12, 50, 18); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 4; i++) { heartPath(ctx, x - w / 2 + 30 + i * (w - 60) / 3, y - 14, 6); ctx.fillStyle = '#fff0f5'; ctx.fill(); }
  }
}

// ---------------------------------------------------------------- 🍲 Supa de pui
interface Veg { kind: number; x: number; y: number; cuts: number; done: boolean; fly: number; vx: number; vy: number }
export class SoupGame extends CarePanel {
  veg: Veg[] = [];
  phase: 'chop' | 'stir' = 'chop';
  stir = 0; lastAng: number | null = null; dragging = false;
  knife = 0;
  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, g(scene.partner.id, '🍲 Supă pentru bolnăvior', '🍲 Supă pentru bolnăvioară'), 'Atinge legumele ca să le tai, apoi amestecă în cerc');
    for (let i = 0; i < 5; i++) this.veg.push({ kind: i % 3, x: 0.22 + i * 0.14, y: 0.42, cuts: 0, done: false, fly: 0, vx: 0, vy: 0 });
    this.hero.play('act_cook'); this.patient.play('sick');
  }
  tick(dt: number) {
    this.knife = Math.max(0, this.knife - dt * 5);
    for (const v of this.veg) if (v.fly > 0) { v.fly += dt; v.x += v.vx * dt; v.y += v.vy * dt; v.vy += 1.8 * dt; }
    if (this.phase === 'chop' && this.veg.every(v => v.done && v.fly > 0.8)) { this.phase = 'stir'; this.hero.play('act_cook'); }
    if (this.phase === 'stir' && this.stir >= 1) { this.finish(1.5, 'Supă gata! 🍲💕'); this.patient.play('love'); }
    if (!this.hero.busy) this.hero.play('act_cook');
    if (!this.patient.busy) this.patient.play(Math.random() < 0.5 ? 'sneeze' : 'sick');
  }
  pointer(type: string, x: number, y: number) {
    const b = this.box;
    if (this.phase === 'chop' && type === 'down') {
      for (const v of this.veg) {
        if (v.done) continue;
        const vx = b.x + v.x * b.w, vy = b.y + v.y * b.h;
        if (Math.hypot(x - vx, y - vy) < 38) {
          v.cuts++; this.knife = 1; Sfx.play('slap'); this.shake = 3;
          this.fx.burst('drop', vx, vy, 5, 3, 120, { grav: 300, max: 0.5, color: ['#ff8c42', '#e9d8a6', '#c8e7a7'][v.kind] });
          if (v.cuts >= 3) { v.done = true; v.fly = 0.01; v.vx = (0.62 - v.x) * 1.4; v.vy = -0.9; this.fx.text(vx, vy - 40, 'ZDANG!', '#ff9f1c', 0.9); }
          return;
        }
      }
    }
    if (this.phase === 'stir') {
      const cx = b.x + b.w * 0.62, cy = b.y + b.h * 0.58;
      if (type === 'down') this.dragging = true;
      if (type === 'up') { this.dragging = false; this.lastAng = null; }
      if (type === 'move' && this.dragging) {
        const a = Math.atan2(y - cy, x - cx);
        if (this.lastAng !== null) { let d = a - this.lastAng; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; this.stir = Math.min(1, this.stir + Math.abs(d) / (Math.PI * 2 * 5)); if (Math.random() < 0.08) this.fx.emit('steam', cx + (Math.random() - 0.5) * 60, cy - 40, { vy: -40, max: 1 }); }
        this.lastAng = a;
      }
    }
  }
  key(k: string, down: boolean) {
    if (!down) return;
    if (this.phase === 'chop') { const v = this.veg.find(v => !v.done); if (v) this.pointer('down', this.box.x + v.x * this.box.w, this.box.y + v.y * this.box.h); }
    else if (k === ' ' || k === 'e') { this.stir = Math.min(1, this.stir + 0.06); this.fx.emit('steam', this.box.x + this.box.w * 0.62, this.box.y + this.box.h * 0.5, { vy: -40, max: 1 }); }
  }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const O = '#3a2a22';
    ctx.fillStyle = '#fff4e4'; ctx.fillRect(x, y, w, h);
    // pacientul in fundal, in pat
    this.bed(ctx, x + w * 0.82, y + h * 0.3, 150);
    this.patient.scale = 0.9; this.patient.x = x + w * 0.82; this.patient.y = y + h * 0.3 - 30; this.patient.pose.headOnly = true; this.patient.draw(ctx);
    // tocatorul
    ctx.fillStyle = '#e7b98a'; ctx.strokeStyle = O; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(x + w * 0.1, y + h * 0.34, w * 0.62, h * 0.16, 16); ctx.fill(); ctx.stroke();
    // oala
    const cx = x + w * 0.62, cy = y + h * 0.62;
    ctx.fillStyle = '#c0c6cc'; ctx.beginPath(); ctx.roundRect(cx - 90, cy - 40, 180, 110, 24); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.ellipse(cx, cy - 40, 86, 22, 0, 0, 7); ctx.fill(); ctx.stroke();
    const inPot = this.veg.filter(v => v.done && v.fly > 0.8).length;
    for (let i = 0; i < inPot * 3; i++) { const a = i * 2.4 + this.stir * 20; ctx.fillStyle = ['#ff8c42', '#e9d8a6', '#9be38f'][i % 3]; ctx.fillRect(cx + Math.cos(a) * 50 * ((i % 4) / 4 + 0.2) - 5, cy - 42 + Math.sin(a) * 12 * ((i % 4) / 4 + 0.2), 10, 7); }
    if (this.phase === 'stir') {
      const a = this.t * 0 + (this.lastAng ?? this.t * 3);
      ctx.strokeStyle = '#8b5e34'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 40, cy - 42 + Math.sin(a) * 10); ctx.lineTo(cx + Math.cos(a) * 60, cy - 140); ctx.stroke();
      ctx.strokeStyle = '#ff7aa2'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.ellipse(cx, cy - 40, 120, 60, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = O; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`Amestecă în cerc! ${Math.round(this.stir * 100)}%`, cx, cy + 100);
    }
    // legumele
    for (const v of this.veg) {
      if (v.fly > 0.8) continue;
      const vx = x + v.x * w, vy = y + v.y * h;
      ctx.save(); ctx.translate(vx, vy); ctx.rotate(v.fly * 8);
      const col = ['#ff8c42', '#e9d8a6', '#c8e7a7'][v.kind];
      ctx.fillStyle = col; ctx.strokeStyle = O; ctx.lineWidth = 3;
      if (v.kind === 0) { ctx.beginPath(); ctx.moveTo(-10, -26); ctx.lineTo(10, -26); ctx.lineTo(0, 28); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#4caf50'; ctx.fillRect(-6, -36, 12, 10); }
      else { ctx.beginPath(); ctx.ellipse(0, 0, 24, 20, 0, 0, 7); ctx.fill(); ctx.stroke(); }
      for (let c = 0; c < v.cuts; c++) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-16, -12 + c * 12); ctx.lineTo(16, -12 + c * 12); ctx.stroke(); }
      ctx.restore();
    }
    // cutitul
    if (this.phase === 'chop') {
      const v = this.veg.find(v => !v.done); if (v) {
        const kx = x + v.x * w + 26, ky = y + v.y * h - 50 + this.knife * 30;
        ctx.fillStyle = '#dfe6ea'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + 50, ky - 6); ctx.lineTo(kx + 50, ky + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#6b4a2f'; ctx.beginPath(); ctx.roundRect(kx + 48, ky - 4, 30, 14, 5); ctx.fill(); ctx.stroke();
      }
    }
    this.hero.scale = Math.min(1.4, h / 400); this.hero.x = x + w * 0.16; this.hero.y = y + h - 44; this.hero.draw(ctx);
  }
}

// ---------------------------------------------------------------- 💊 Avionul cu lingurita
export class MedicineGame extends CarePanel {
  spoonX = 0.5; headX = 0.5; headV = 0.35; mouthOpen = 0; fed = 0; flying = 0; miss = 0;
  keysDown = new Set<string>();
  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '💊 Vine avionul!', 'Mișcă lingurița (deget / ← →) și apasă când gura e deschisă');
    this.patient.play('sick');
  }
  tick(dt: number) {
    // capul se fereste
    this.headX += this.headV * dt * (1 + this.fed * 0.3);
    if (this.headX < 0.2 || this.headX > 0.8) this.headV *= -1;
    if (Math.random() < dt * 0.8) this.headV *= -1;
    this.mouthOpen = Math.max(0, Math.sin(this.t * 1.7) * 1.4 - 0.4);
    if (this.keysDown.has('arrowleft') || this.keysDown.has('a')) this.spoonX = Math.max(0.1, this.spoonX - dt * 0.9);
    if (this.keysDown.has('arrowright') || this.keysDown.has('d')) this.spoonX = Math.min(0.9, this.spoonX + dt * 0.9);
    if (this.flying > 0) {
      this.flying += dt * 2.2;
      if (this.flying >= 1) {
        this.flying = 0;
        const hit = Math.abs(this.spoonX - this.headX) < 0.09 && this.mouthOpen > 0.25;
        const b = this.box;
        if (hit) { this.fed++; Sfx.play('good'); this.fx.text(b.x + this.headX * b.w, b.y + b.h * 0.25, ['Hamm!', 'Mmm!', 'Bleah... dar bun!'][this.fed % 3], '#2ec4b6', 1.1); this.patient.play('shy'); }
        else { this.miss++; Sfx.play('bad'); this.fx.text(b.x + this.headX * b.w, b.y + b.h * 0.25, 'Nu vreau! 🙅', '#e63946', 1.1); this.patient.play('angry'); this.fx.burst('drop', b.x + this.spoonX * b.w, b.y + b.h * 0.3, 10, 3, 150, { grav: 300, color: '#ff6f91', max: 0.7 }); }
        if (this.fed >= 3) { this.finish(1.4, 'A luat medicamentul! 💊✨'); this.patient.play('love'); }
        if (this.miss >= 5) this.finish(0, 'S-a ascuns sub pătură 🙈');
      }
    }
    if (!this.patient.busy) this.patient.play('sick');
  }
  fire() { if (!this.flying && !this.ended) { this.flying = 0.01; Sfx.play('pop'); this.hero.play('kiss'); } }
  pointer(type: string, x: number) { const b = this.box; if (type !== 'up') this.spoonX = Math.max(0.1, Math.min(0.9, (x - b.x) / b.w)); if (type === 'down') this.fire(); }
  key(k: string, down: boolean) { down ? this.keysDown.add(k) : this.keysDown.delete(k); if (down && (k === ' ' || k === 'e' || k === 'arrowup' || k === 'w')) this.fire(); }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#f6cfc4'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffd9e2'; ctx.fillRect(x, y, w, h * 0.45);
    this.bed(ctx, x + w / 2, y + h * 0.5, w * 0.8);
    const hx = x + this.headX * w, hy = y + h * 0.36;
    this.patient.scale = 1.6; this.patient.x = hx; this.patient.y = hy; this.patient.pose.headOnly = true;
    if (this.mouthOpen > 0.25 && !this.patient.busy) { this.patient.pose.mouth = 'scream'; this.patient.pose.eyes = 'closed'; }
    else if (!this.patient.busy) { this.patient.pose.mouth = 'flat'; }
    this.patient.draw(ctx);
    // termometrul din coltul gurii
    // lingurita-avion
    const sx = x + this.spoonX * w;
    const sy = this.flying > 0 ? y + h * 0.82 - (h * 0.82 - h * 0.4) * this.flying + Math.sin(this.flying * 12) * 10 : y + h * 0.82;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.sin(this.t * 6) * 0.15);
    ctx.fillStyle = '#d7dbe0'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(-5, 0, 10, 60, 5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -6, 16, 20, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff6f91'; ctx.beginPath(); ctx.ellipse(0, -8, 10, 12, 0, 0, 7); ctx.fill();
    // aripioare de avion
    ctx.fillStyle = '#7ab8ff'; ctx.beginPath(); ctx.moveTo(-5, 26); ctx.lineTo(-40, 36); ctx.lineTo(-5, 40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 26); ctx.lineTo(40, 36); ctx.lineTo(5, 40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (this.flying > 0) { ctx.fillStyle = '#3a2a22'; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Bzzzzz… ✈️', sx + 60, sy); }
    ctx.fillStyle = '#3a2a22'; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Lingurițe: ${'💊'.repeat(this.fed)}${'⚪'.repeat(3 - this.fed)}`, x + 20, y + 52);
  }
}

// ---------------------------------------------------------------- 🧊 Compresa rece
export class CompressGame extends CarePanel {
  temp = 39.2; towel = 0; onHead = false; held = 0; good = 0;
  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '🧊 Compresă rece', 'Atinge ca să uzi prosopul și să i-l pui pe frunte');
    this.patient.play('sick');
  }
  tick(dt: number) {
    if (this.onHead) { this.towel = Math.max(0, this.towel - dt * 0.22); this.temp = Math.max(36.6, this.temp - dt * 0.35 * this.towel); }
    else this.temp = Math.min(41, this.temp + dt * 0.25);
    if (this.temp < 37.6) { this.held += dt; } else this.held = Math.max(0, this.held - dt * 0.5);
    if (this.held > 4) { this.finish(1.3, 'Febra a scăzut! 🌡️💚'); this.patient.play('love'); }
    if (this.temp >= 41) this.finish(0, 'Prea fierbinte! Mai încearcă 🥵');
    if (this.onHead && this.towel <= 0) { this.onHead = false; this.fx.text(this.box.x + this.box.w * 0.5, this.box.y + this.box.h * 0.25, 'S-a încălzit!', '#ff9f1c', 0.9); }
    if (!this.patient.busy) this.patient.play('sick');
  }
  tap() {
    if (this.ended) return;
    if (!this.onHead) { this.towel = 1; this.onHead = true; Sfx.play('splash'); this.fx.burst('drop', this.box.x + this.box.w * 0.2, this.box.y + this.box.h * 0.7, 12, 2, 120, { grav: 300, max: 0.6 }); this.patient.play('shy'); this.hero.play('love'); }
    else { this.fx.text(this.box.x + this.box.w * 0.5, this.box.y + this.box.h * 0.22, 'Mai stai puțin… 💕', '#ff4d6d', 0.8); }
  }
  pointer(type: string) { if (type === 'down') this.tap(); }
  key(k: string, down: boolean) { if (down && (k === ' ' || k === 'e')) this.tap(); }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const O = '#3a2a22';
    ctx.fillStyle = '#dfe9ff'; ctx.fillRect(x, y, w, h);
    this.bed(ctx, x + w * 0.55, y + h * 0.55, w * 0.6);
    this.patient.scale = 1.5; this.patient.x = x + w * 0.55; this.patient.y = y + h * 0.42; this.patient.pose.headOnly = true;
    this.patient.pose.sickTint = Math.max(0, (this.temp - 37) / 3); this.patient.pose.blush = 0.6 + (this.temp - 37) / 2;
    this.patient.draw(ctx);
    if (this.onHead) { // prosopul
      ctx.fillStyle = `rgb(${200 - this.towel * 60},${225 - this.towel * 20},255)`; ctx.strokeStyle = O; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(x + w * 0.55 - 34, y + h * 0.42 - 40, 68, 20, 8); ctx.fill(); ctx.stroke();
    }
    // ligheanul cu apa rece
    ctx.fillStyle = '#7ab8ff'; ctx.strokeStyle = O; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(x + w * 0.2, y + h * 0.75, 60, 22, 0, 0, 7); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#e8f6ff'; ctx.fillRect(x + w * 0.2 - 30 + i * 20, y + h * 0.75 - 8 + Math.sin(this.t * 3 + i) * 2, 14, 12); }
    // termometrul mare
    const tx = x + w - 60, ty = y + 70, th = h - 170;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(tx - 14, ty, 28, th, 14); ctx.fill(); ctx.stroke();
    const k = (this.temp - 36) / 5;
    ctx.fillStyle = this.temp > 39 ? '#e63946' : this.temp > 37.6 ? '#ff9f1c' : '#2ec4b6';
    ctx.fillRect(tx - 7, ty + th - th * k, 14, th * k); ctx.beginPath(); ctx.arc(tx, ty + th + 6, 20, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = O; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(this.temp.toFixed(1) + '°', tx, ty - 10);
    ctx.textAlign = 'left'; ctx.fillText(`Răcorit: ${Math.round(Math.min(1, this.held / 4) * 100)}%`, x + 20, y + 52);
    this.hero.scale = 1.1; this.hero.x = x + w * 0.2; this.hero.y = y + h * 0.62; this.hero.draw(ctx);
  }
}
