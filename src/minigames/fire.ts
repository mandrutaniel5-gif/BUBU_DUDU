// Aprinderea focului si tunsul ierbii.
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';

const O = '#3a2a22';

/** 🔥 Aprinde focul: sufla (atinge des) ca flacara sa stea peste linie 3 secunde */
export class FireGame extends Panel {
  flame = 0; held = 0; puffs = 0;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🔥 Aprinde focul', 'Atinge des ca să sufli în jar! Ține flacăra peste linie'); this.hero.play('kiss'); }
  tick(dt: number) {
    this.flame = Math.max(0, this.flame - dt * 0.32);
    if (this.flame > 0.6) this.held += dt; else this.held = Math.max(0, this.held - dt * 0.5);
    if (this.held >= 3) this.finish(1.4, 'Focul arde! Ne e cald 🔥🥰');
    if (this.t > 20) this.finish(0, 'S-a stins… mai încearcă 🥶');
    if (Math.random() < this.flame * dt * 10) this.fx.emit('sparkle', this.box.x + this.box.w / 2 + (Math.random() - 0.5) * 60, this.box.y + this.box.h * 0.6, { vy: -90, max: 0.8, color: '#ffb703' });
  }
  blow() { if (this.ended) return; this.flame = Math.min(1, this.flame + 0.1); this.puffs++; Sfx.play('whoosh', { vol: 0.8, rate: 0.7 }); this.fx.emit('puff', this.box.x + this.box.w * 0.3, this.box.y + this.box.h * 0.62, { vx: 120, vy: -10, max: 0.5, size: 0.6 }); if (this.puffs % 4 === 0) this.hero.play('kiss'); }
  pointer(t: string) { if (t === 'down') this.blow(); }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'e')) this.blow(); }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#3b2b3f'; ctx.fillRect(x, y, w, h);
    // soba
    const cx = x + w * 0.58, cy = y + h * 0.62;
    ctx.fillStyle = '#c0573e'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(cx - 120, cy - 120, 240, 220, 18); ctx.fill(); ctx.stroke();
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { ctx.strokeStyle = '#9e4330'; ctx.lineWidth = 2; ctx.strokeRect(cx - 120 + c * 60 + (r % 2) * 30, cy - 120 + r * 36, 60, 36); }
    ctx.fillStyle = '#1e1416'; ctx.beginPath(); ctx.roundRect(cx - 70, cy - 40, 140, 100, 50); ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.stroke();
    // lemnele
    for (const [dx, a] of [[-30, 0.2], [20, -0.25], [-5, 0]]) { ctx.save(); ctx.translate(cx + dx, cy + 40); ctx.rotate(a); ctx.fillStyle = '#8a5d32'; ctx.beginPath(); ctx.roundRect(-40, -8, 80, 16, 8); ctx.fill(); ctx.stroke(); ctx.restore(); }
    // flacara
    const f = this.flame;
    for (let i = 0; i < 5; i++) {
      const fx = cx + (i - 2) * 18, fh = (20 + f * 90) * (0.7 + 0.3 * Math.sin(this.t * 12 + i * 2));
      const gr = ctx.createLinearGradient(0, cy + 30, 0, cy + 30 - fh); gr.addColorStop(0, '#ffb703'); gr.addColorStop(0.6, '#ff6b3d'); gr.addColorStop(1, 'rgba(255,80,40,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(fx - 14, cy + 34); ctx.quadraticCurveTo(fx - 16, cy + 30 - fh * 0.5, fx, cy + 30 - fh); ctx.quadraticCurveTo(fx + 16, cy + 30 - fh * 0.5, fx + 14, cy + 34); ctx.fill();
    }
    if (f > 0.2) { const gl = ctx.createRadialGradient(cx, cy, 10, cx, cy, 220); gl.addColorStop(0, `rgba(255,180,80,${0.35 * f})`); gl.addColorStop(1, 'rgba(255,180,80,0)'); ctx.fillStyle = gl; ctx.fillRect(x, y, w, h); }
    // bara
    const bx = x + 40, bw = w - 80, by = y + 56;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, by, bw, 20, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff6b3d'; ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, (bw - 4) * f, 16, 8); ctx.fill();
    ctx.fillStyle = O; ctx.fillRect(bx + bw * 0.6 - 1.5, by - 4, 3, 28);
    ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(`Flacăra stă aprinsă: ${Math.min(3, this.held).toFixed(1)} / 3 s`, x + w / 2, by + 44);
    this.hero.scale = 1.3; this.hero.x = x + w * 0.2; this.hero.y = y + h - 40; this.hero.draw(ctx);
  }
}

/** ✂️ Tunde iarba: plimba masina de tuns peste iarba inalta */
export class MowGame extends Panel {
  cols = 9; rows = 6; tall: number[] = []; cut = 0; total = 0; mx = -1; my = -1; down = false; dur = 25; keys = new Set<string>(); px = 0.5; py = 0.5;
  constructor(s: WorldScene, d: (n: number) => void) {
    super(s, d, '✂️ Tunde iarba', 'Trage mașina (deget / WASD) peste toată iarba înaltă');
    const n = Math.max(14, Math.min(this.cols * this.rows, Object.keys(s.w.grass ?? {}).length * 2 + 10));
    const idx = [...Array(this.cols * this.rows).keys()].sort(() => Math.random() - 0.5).slice(0, n);
    this.tall = Array(this.cols * this.rows).fill(0); for (const i of idx) this.tall[i] = 1 + Math.floor(Math.random() * 3);
    this.total = idx.length;
  }
  grid() { const B = this.box; const cs = Math.min((B.w - 40) / this.cols, (B.h - 140) / this.rows); return { cs, gx: B.x + (B.w - cs * this.cols) / 2, gy: B.y + 90 }; }
  tick(dt: number) {
    const G = this.grid();
    if (this.keys.size) {
      const v = dt * 0.6;
      if (this.keys.has('a') || this.keys.has('arrowleft')) this.px -= v; if (this.keys.has('d') || this.keys.has('arrowright')) this.px += v;
      if (this.keys.has('w') || this.keys.has('arrowup')) this.py -= v; if (this.keys.has('s') || this.keys.has('arrowdown')) this.py += v;
      this.px = Math.max(0, Math.min(1, this.px)); this.py = Math.max(0, Math.min(1, this.py));
      this.mx = G.gx + this.px * G.cs * this.cols; this.my = G.gy + this.py * G.cs * this.rows; this.down = true;
    }
    if (this.down && this.mx > 0) {
      const c = Math.floor((this.mx - G.gx) / G.cs), r = Math.floor((this.my - G.gy) / G.cs);
      for (const [dc, dr] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const cc = c + dc, rr = r + dr; if (cc < 0 || rr < 0 || cc >= this.cols || rr >= this.rows) continue;
        const i = rr * this.cols + cc; const near = Math.hypot(this.mx - (G.gx + (cc + 0.5) * G.cs), this.my - (G.gy + (rr + 0.5) * G.cs)) < G.cs * 0.7;
        if (near && this.tall[i] > 0) { this.tall[i] = 0; this.cut++; Sfx.play('leaves', { vol: 0.35, rate: 1.5 }); this.fx.burst('drop', G.gx + (cc + 0.5) * G.cs, G.gy + (rr + 0.5) * G.cs, 6, 6.28, 90, { color: '#7cc576', grav: 200, max: 0.5 }); }
      }
    }
    if (this.cut >= this.total) this.finish(1 + (this.dur - this.t) / this.dur, 'Curte ca-n palmă! ✂️🌾');
    else if (this.t > this.dur) this.finish(this.cut > this.total * 0.6 ? 0.6 : 0, this.cut > this.total * 0.6 ? 'Aproape gata 🌾' : 'Iarba a câștigat 🌿');
  }
  get hay() { return Math.max(1, Math.round(this.cut / 4)); }
  pointer(type: string, x: number, y: number) { if (type === 'down') this.down = true; if (type === 'up') this.down = false; this.mx = x; this.my = y; }
  key(k: string, d: boolean) { d ? this.keys.add(k) : this.keys.delete(k); if (!d && !this.keys.size) this.down = false; }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#bfe8ff'; ctx.fillRect(x, y, w, h);
    const G = this.grid();
    for (let i = 0; i < this.cols * this.rows; i++) {
      const cx = G.gx + (i % this.cols) * G.cs, cy = G.gy + Math.floor(i / this.cols) * G.cs;
      ctx.fillStyle = (i + Math.floor(i / this.cols)) % 2 ? '#9fd68c' : '#a6dc93'; ctx.fillRect(cx, cy, G.cs, G.cs);
      const t = this.tall[i];
      if (t) for (let k = 0; k < 5; k++) {
        const bx = cx + 6 + k * (G.cs - 12) / 4, sw = Math.sin(this.t * 2 + i + k) * 3;
        ctx.strokeStyle = k % 2 ? '#4f9d4a' : '#3d8b3d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, cy + G.cs - 4); ctx.quadraticCurveTo(bx + sw, cy + G.cs - 10 - t * 8, bx + sw * 2, cy + G.cs - 12 - t * 12); ctx.stroke();
      }
    }
    ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.strokeRect(G.gx, G.gy, G.cs * this.cols, G.cs * this.rows);
    if (this.mx > 0) { // masina de tuns
      ctx.save(); ctx.translate(this.mx, this.my);
      ctx.fillStyle = '#e63946'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-22, -16, 44, 30, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#333'; for (const [a, b] of [[-18, 14], [18, 14]]) { ctx.beginPath(); ctx.arc(a, b, 6, 0, 7); ctx.fill(); }
      ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(10, -40); ctx.stroke();
      ctx.restore();
    }
    ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = O;
    ctx.fillText(`Tuns: ${this.cut}/${this.total}  ·  ⏱ ${Math.max(0, Math.ceil(this.dur - this.t))} s`, x + w / 2, y + 66);
  }
}
