// Scenele mari ale povestii, animate pe tot ecranul: podul reparat, cererea in casatorie, nunta in sat,
// magazinul deschis, targul orasului, camionul cu marfa. In fiecare secunda se intampla ceva; o atingere
// trece la momentul urmator. Pornesc deodata pe ambele telefoane (evenimentul 'mini' cu { scene }).
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import { Actor } from '../char/actor';
import { NPC_SPECS, heartPath } from '../char/draw';
import { VILLAGERS } from '../game/town';
import type { WorldScene } from '../scenes/world';
import { fillTextIcons } from '../ui/icons';

const O = '#3a2a22';
type Beat = { dur: number; cap: string; enter?: () => void; draw: (c: CanvasRenderingContext2D, W: number, H: number, k: number, t: number) => void };
const ease = (k: number) => k * k * (3 - 2 * k);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function e(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, st = true, lw = 2) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } }

export class CutsceneGame extends Panel {
  id: string; beats: Beat[] = []; bi = 0; bt = 0; remote: boolean;
  bubu: Actor; dudu: Actor; guests: Actor[] = []; W = 0; H = 0;
  confetti: { x: number; y: number; vx: number; vy: number; c: string; r: number }[] = [];
  claps = 0;
  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '', '');
    this.id = scene.sceneId; this.remote = !!scene.sceneRemote; scene.sceneRemote = false;
    this.bubu = new Actor('bubu', this.fx); this.dudu = new Actor('dudu', this.fx);
    const wed = this.id === 'wedding';
    this.bubu.outfit = wed ? { head: 'voal', face: 'none', neck: 'none', body: 'mireasa' } as any : (scene.w.chars.bubu as any).outfit;
    this.dudu.outfit = wed ? { head: 'none', face: 'none', neck: 'bowtie', body: 'mire' } as any : (scene.w.chars.dudu as any).outfit;
    const invited = VILLAGERS.filter(v => (scene.w.stats['invite-' + v.id] ?? 0) > 0 || !wed);
    for (const v of (invited.length ? invited : VILLAGERS).slice(0, 6)) { const a = new Actor('bubu', this.fx, NPC_SPECS[v.spec]); if (v.spec === 'granny') a.outfit = { head: 'batic', face: 'none', neck: 'none', body: 'ie' } as any; else a.outfit = { head: wed ? 'flower' : 'none', face: 'none', neck: wed ? 'bowtie' : 'none', body: wed ? (v.id === 'ina' || v.id === 'rita' || v.id === 'miti' ? 'rochie' : 'costum') : 'vesta' } as any; this.guests.push(a); }
    this.beats = this.build();
    this.beats[0]?.enter?.();
  }
  abort() { this.end(); }
  skipEnd() { super.skipEnd(); }
  end() { if (this.ended) return; if (!this.remote) this.scene.sceneDone(this.id); this.finish(1.2, this.endText()); }
  endText() { return ({ bridge: 'Podul Mare e reparat! 🌉', propose: 'Logodiți! 💍💖', wedding: 'Casă de piatră! 💒', shopbuilt: 'Magazinul e deschis! 🏪', fair: 'Vedetele târgului! 🎪', truck: 'Marfa a ajuns! 🚚' } as Record<string, string>)[this.id] ?? '💕'; }
  tick(dt: number) {
    this.bt += dt; this.bubu.update(dt); this.dudu.update(dt); for (const g of this.guests) g.update(dt);
    for (const p of this.confetti) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.vx *= 0.99; }
    this.confetti = this.confetti.filter(p => p.y < this.H + 20);
    const b = this.beats[this.bi]; if (!b) { this.end(); return; }
    if (this.bt >= b.dur) this.next();
  }
  next() { this.bi++; this.bt = 0; const b = this.beats[this.bi]; if (!b) { this.end(); return; } b.enter?.(); }
  pointer(type: string) { if (type === 'down') { if (this.id === 'wedding' && this.beats[this.bi]?.cap.startsWith('Hora')) { this.claps++; Sfx.play('pop', { vol: 0.5 }); this.fx.hearts(this.W * (0.3 + Math.random() * 0.4), this.H * 0.4, 3); return; } if (this.bt > 0.8) this.next(); } }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'enter')) this.next(); }
  boom(n = 60) { for (let i = 0; i < n; i++) this.confetti.push({ x: this.W / 2 + (Math.random() - 0.5) * this.W * 0.6, y: this.H * 0.2, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 220, c: ['#ff7aa2', '#ffd23f', '#4cc9f0', '#7cc576', '#fff'][i % 5], r: 2 + Math.random() * 3 }); }
  scene2() { /* desenam tot ecranul in draw() */ }
  draw(c: CanvasRenderingContext2D, W: number, H: number) {
    this.W = W; this.H = H; this.box = { x: 0, y: 0, w: W, h: H };
    const b = this.beats[Math.min(this.bi, this.beats.length - 1)];
    c.save();
    if (b) b.draw(c, W, H, clamp(this.bt / b.dur), this.t);
    for (const p of this.confetti) { c.fillStyle = p.c; c.fillRect(p.x, p.y, p.r * 2, p.r); }
    this.fx.draw(c);
    if (b?.cap) { c.font = '800 18px "Baloo 2", sans-serif'; const tw = Math.min(W - 30, c.measureText(b.cap).width + 40); c.fillStyle = 'rgba(255,250,245,0.94)'; c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.roundRect(W / 2 - tw / 2, H - 58, tw, 40, 20); c.fill(); c.stroke(); c.fillStyle = O; c.textAlign = 'center'; c.textBaseline = 'middle'; fillTextIcons(c, b.cap, W / 2, H - 38, 18); }
    c.font = '700 11px "Baloo 2", sans-serif'; c.fillStyle = 'rgba(255,255,255,0.8)'; c.textAlign = 'right'; c.textBaseline = 'top'; c.fillText(this.id === 'wedding' && b?.cap.startsWith('Hora') ? 'Atinge ca să bați din palme 👏' : 'Atinge ca să mergi mai departe ›', W - 12, 10);
    if (this.ended) { const k = Math.min(1, this.ended.t * 3); c.fillStyle = `rgba(255,255,255,${0.75 * k})`; c.fillRect(0, H / 2 - 50, W, 100); c.font = '900 30px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ff4d6d'; c.fillText(this.ended.text, W / 2, H / 2); }
    c.restore(); c.textBaseline = 'alphabetic';
  }
  // ------------------------------------------------------------------ decoruri
  sky(c: CanvasRenderingContext2D, W: number, H: number, top: string, bot: string, hz: number) { const g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, hz); }
  hills(c: CanvasRenderingContext2D, W: number, hz: number, col: string, amp: number, seed: number) { c.fillStyle = col; c.beginPath(); c.moveTo(0, hz); for (let x = 0; x <= W; x += 16) c.lineTo(x, hz - amp * (0.5 + 0.5 * Math.sin(x * 0.008 + seed) * Math.cos(x * 0.013 + seed))); c.lineTo(W, hz); c.closePath(); c.fill(); }
  church(c: CanvasRenderingContext2D, x: number, y: number, s: number, night = false) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#fff8ef'; c.strokeStyle = O; c.lineWidth = 3; c.fillRect(-90, -120, 180, 120); c.strokeRect(-90, -120, 180, 120);
    c.fillStyle = '#8a4a3a'; c.beginPath(); c.moveTo(-104, -118); c.lineTo(0, -180); c.lineTo(104, -118); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.fillRect(-26, -250, 52, 130); c.strokeRect(-26, -250, 52, 130);
    c.fillStyle = '#8a4a3a'; c.beginPath(); c.moveTo(-32, -248); c.lineTo(0, -310); c.lineTo(32, -248); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -310); c.lineTo(0, -336); c.moveTo(-9, -326); c.lineTo(9, -326); c.stroke();
    const sw = Math.sin(this.t * 3) * 0.3; c.save(); c.translate(0, -200); c.rotate(sw); c.fillStyle = '#ffd23f'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, 18); c.quadraticCurveTo(-10, 0, 0, 0); c.quadraticCurveTo(10, 0, 10, 18); c.closePath(); c.fill(); c.stroke(); c.restore();
    for (const u of [-55, 55]) { c.fillStyle = night ? '#ffe680' : u < 0 ? '#ff9ab8' : '#7ab8ff'; c.beginPath(); c.roundRect(u - 12, -96, 24, 44, [12, 12, 0, 0]); c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke(); }
    c.fillStyle = '#8a5d32'; c.beginPath(); c.moveTo(-22, 0); c.lineTo(-22, -46); c.quadraticCurveTo(0, -72, 22, -46); c.lineTo(22, 0); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
  ground(c: CanvasRenderingContext2D, W: number, H: number, hz: number, col: string) { c.fillStyle = col; c.fillRect(0, hz, W, H - hz); }
  put(a: Actor, x: number, y: number, s: number, flip: 1 | -1 = 1) { a.x = x; a.y = y; a.scale = s; a.flip = flip; }
  pair(c: CanvasRenderingContext2D, bx: number, dx: number, y: number, s: number) { this.put(this.bubu, bx, y, s, bx < dx ? 1 : -1); this.put(this.dudu, dx, y, s, dx < bx ? 1 : -1); this.bubu.draw(c); this.dudu.draw(c); }

  // ------------------------------------------------------------------ scenele
  build(): Beat[] {
    const s = this.scene, sz = () => Math.min(1.6, this.H / 300);
    switch (this.id) {
      case 'bridge': {
        const river = (c: CanvasRenderingContext2D, W: number, H: number, fixed: number) => {
          const hz = H * 0.42; this.sky(c, W, H, '#8fd3ff', '#fff1d6', hz); this.hills(c, W, hz, '#9fd68c', 40, 1); this.ground(c, W, H, hz, '#a6dc93');
          c.fillStyle = '#7ec8f0'; c.fillRect(W * 0.3, hz, W * 0.4, H - hz);
          for (let i = 0; i < 8; i++) { c.strokeStyle = '#ffffff99'; c.lineWidth = 2; const y = hz + 20 + i * (H - hz) / 8, x = W * 0.32 + ((this.t * 40 + i * 50) % (W * 0.36)); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 3, x + 16, y); c.stroke(); }
          const by = H * 0.62; c.fillStyle = '#8a5d32'; c.fillRect(W * 0.28, by, W * 0.44, 16); c.strokeStyle = O; c.lineWidth = 3;
          for (let i = 0; i < 14; i++) { const u = i / 14, x = W * 0.28 + u * W * 0.44, gap = u > 0.38 && u < 0.62 && i / 14 > 0.38 + (fixed * 0.24); if (gap) continue; c.fillStyle = i % 2 ? '#d9a273' : '#c98e5f'; c.fillRect(x, by - 10, W * 0.44 / 14 - 2, 12); c.strokeRect(x, by - 10, W * 0.44 / 14 - 2, 12); }
          for (const x of [W * 0.28, W * 0.72]) { c.fillStyle = '#a0703f'; c.fillRect(x - 6, by - 50, 12, 70); c.strokeRect(x - 6, by - 50, 12, 70); }
          c.strokeStyle = '#a0703f'; c.lineWidth = 6; c.beginPath(); c.moveTo(W * 0.28, by - 40); c.lineTo(W * (0.28 + 0.44 * (fixed >= 1 ? 1 : 0.38)), by - 40); c.stroke(); if (fixed >= 1) { c.beginPath(); c.moveTo(W * 0.28, by - 26); c.lineTo(W * 0.72, by - 26); c.stroke(); }
          return by;
        };
        const [g1, g2] = [this.guests.find(g => g.spec.ears === 'pig') ?? this.guests[0], this.guests.find(g => g.spec.ears === 'dog') ?? this.guests[1]];
        return [
          { dur: 3.2, cap: 'Meșterii din sat se apucă de Podul Mare 🔨', enter: () => { g1?.play('act_carry'); g2?.play('act_carry'); Sfx.play('hammer'); }, draw: (c, W, H, k) => { const by = river(c, W, H, k * 0.5); if (g1) { this.put(g1, W * (0.2 + k * 0.2), by - 12, sz() * 0.8); g1.draw(c); } if (g2) { this.put(g2, W * (0.8 - k * 0.2), by - 12, sz() * 0.8, -1); g2.draw(c); } if (Math.random() < 0.1) Sfx.play('hammer', { vol: 0.4 }); } },
          { dur: 3.2, cap: s.myId === 'bubu' ? 'Bubu aduce mâncare caldă, Dudu bate ultima scândură 🍲🪵' : 'Dudu bate ultima scândură, Bubu aduce mâncare caldă 🪵🍲', enter: () => { this.dudu.play('act_carry'); this.bubu.play('love'); Sfx.play('hammer'); }, draw: (c, W, H, k) => { const by = river(c, W, H, 0.5 + k * 0.5); this.pair(c, W * 0.22, W * (0.4 + k * 0.08), by - 12, sz()); for (let i = 0; i < 3; i++) { const q = ((this.t * 0.8 + i / 3) % 1); c.globalAlpha = 1 - q; e(c, W * 0.22 + 10, by - 70 - q * 30, 5 + q * 6, 4 + q * 5, '#fff', false); c.globalAlpha = 1; } } },
          { dur: 3.4, cap: '🌉 Podul Mare e reparat! Satul vă așteaptă', enter: () => { this.boom(); Sfx.play('victory'); Sfx.play('applause', { delay: 0.3 }); this.bubu.play('dance_hop'); this.dudu.play('dance_hop'); g1?.play('wave'); g2?.play('wave'); }, draw: (c, W, H) => { const by = river(c, W, H, 1); this.pair(c, W * 0.45, W * 0.55, by - 12, sz()); if (g1) { this.put(g1, W * 0.2, by - 6, sz() * 0.8); g1.draw(c); } if (g2) { this.put(g2, W * 0.8, by - 6, sz() * 0.8, -1); g2.draw(c); } } },
        ];
      }
      case 'propose': {
        const lake = (c: CanvasRenderingContext2D, W: number, H: number, dusk: number) => {
          const hz = H * 0.5; this.sky(c, W, H, dusk > 0.5 ? '#3d3a7a' : '#ff9a7a', '#ffd6a5', hz);
          e(c, W * 0.7, hz - 30 + dusk * 30, 40, 40, '#ffd23f', false); this.hills(c, W, hz, '#6a9a72', 30, 3);
          c.fillStyle = '#5aa0c8'; c.fillRect(0, hz, W, H * 0.12); c.fillStyle = '#ffd23f55'; c.fillRect(W * 0.62, hz + 6, W * 0.16, 4);
          this.ground(c, W, H, hz + H * 0.12, '#8fc77a');
          // foisorul
          const gx = W * 0.5, gy = H * 0.86; c.strokeStyle = O; c.lineWidth = 3; c.fillStyle = '#f4e2c4';
          for (const x of [-110, 110]) { c.fillRect(gx + x - 6, gy - 150, 12, 150); c.strokeRect(gx + x - 6, gy - 150, 12, 150); }
          c.fillStyle = '#c0573e'; c.beginPath(); c.moveTo(gx - 140, gy - 148); c.lineTo(gx, gy - 220); c.lineTo(gx + 140, gy - 148); c.closePath(); c.fill(); c.stroke();
          for (let i = 0; i < 12; i++) { const x = gx - 120 + i * 22, y = gy - 150 + Math.sin(i) * 3; c.fillStyle = `rgba(255,230,120,${0.6 + 0.4 * Math.sin(this.t * 3 + i)})`; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
          for (let i = 0; i < 14; i++) { const x = (i * 97 + this.t * 10) % W, y = H * 0.55 + Math.sin(this.t + i) * 30 + (i % 4) * 20; c.fillStyle = 'rgba(255,240,150,0.8)'; c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill(); }
          return gy;
        };
        return [
          { dur: 3, cap: 'Apus la lac. Dudu e cam emoționat… 😳', enter: () => { this.bubu.play('love'); this.dudu.play('shy'); Sfx.play('birds', { vol: 0.5 }); }, draw: (c, W, H, k) => { const gy = lake(c, W, H, k * 0.4); this.pair(c, W * (0.3 + k * 0.08), W * (0.4 + k * 0.12), gy, sz()); } },
          { dur: 3.8, cap: '💍 „Bubu, vrei să fii soția mea?”', enter: () => { this.dudu.play('shy'); Sfx.play('chimes'); }, draw: (c, W, H, k, t) => { const gy = lake(c, W, H, 0.5); this.put(this.bubu, W * 0.38, gy, sz(), 1); this.bubu.draw(c); c.save(); c.translate(W * 0.58, gy); c.scale(1, 1 - 0.18 * ease(clamp(k * 3))); c.translate(-W * 0.58, -gy); this.put(this.dudu, W * 0.58, gy, sz(), -1); this.dudu.draw(c); c.restore(); const rx = W * 0.5, ry = gy - 52 * sz(); const op = ease(clamp(k * 2 - 0.3)); c.fillStyle = '#c0273e'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(rx - 12, ry - 8, 24, 14, 3); c.fill(); c.stroke(); c.save(); c.translate(rx, ry - 8); c.rotate(-op * 1.6); c.fillStyle = '#e04a5e'; c.beginPath(); c.roundRect(-12, -8, 24, 8, 3); c.fill(); c.stroke(); c.restore(); if (op > 0.5) { e(c, rx, ry - 12, 6, 6, 'rgba(0,0,0,0)', true, 3); c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.beginPath(); c.arc(rx, ry - 12, 6, 0, 7); c.stroke(); for (let i = 0; i < 5; i++) { const a = t * 3 + i * 1.26; c.fillStyle = '#fff'; c.beginPath(); c.arc(rx + Math.cos(a) * 16, ry - 18 + Math.sin(a) * 10, 1.6, 0, 7); c.fill(); } } } },
          { dur: 2.8, cap: '😭💖 „DA! DA! DA!”', enter: () => { this.bubu.play('cry'); setTimeout(() => this.bubu.play('dance_hop'), 900); Sfx.play('gasp'); Sfx.play('applause', { delay: 0.8, vol: 0.5 }); }, draw: (c, W, H) => { const gy = lake(c, W, H, 0.7); this.pair(c, W * 0.44, W * 0.54, gy, sz()); c.font = `900 ${Math.round(46 + Math.sin(this.t * 8) * 4)}px "Baloo 2", sans-serif`; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = '#fff'; c.strokeText('DA! 💖', W * 0.44, gy - 140 * sz()); c.fillStyle = '#ff4d6d'; c.fillText('DA! 💖', W * 0.44, gy - 140 * sz()); } },
          { dur: 3.4, cap: 'Logodiți! Un pupic sub artificii 💋🎆', enter: () => { this.bubu.play('kiss'); this.dudu.play('kiss'); this.boom(80); Sfx.play('victory'); Sfx.play('kiss', { delay: 0.3 }); }, draw: (c, W, H, k) => { const gy = lake(c, W, H, 1); this.pair(c, W * 0.47, W * 0.53, gy, sz()); for (let i = 0; i < 6; i++) { const p = ((k + i * 0.17) % 1), cx = W * (0.15 + i * 0.14), cy = H * 0.2; c.globalAlpha = 1 - p; for (let j = 0; j < 10; j++) { const a = j / 10 * 6.28; c.fillStyle = ['#ff7aa2', '#ffd23f', '#4cc9f0'][i % 3]; c.beginPath(); c.arc(cx + Math.cos(a) * p * 50, cy + Math.sin(a) * p * 50, 2.5, 0, 7); c.fill(); } c.globalAlpha = 1; } heartPath(c, W / 2, gy - 150 * sz(), 18 + Math.sin(this.t * 6) * 3); c.fillStyle = '#ff4d6d'; c.fill(); } },
        ];
      }
      case 'wedding': {
        const outside = (c: CanvasRenderingContext2D, W: number, H: number, night = false) => { const hz = H * 0.62; this.sky(c, W, H, night ? '#1d2550' : '#9fdcff', night ? '#4a3f75' : '#fff1d6', hz); this.hills(c, W, hz, night ? '#2e4a3a' : '#9fd68c', 30, 2); this.ground(c, W, H, hz, night ? '#3d5a3f' : '#a6dc93'); c.fillStyle = night ? '#6a6050' : '#e8d9b8'; c.beginPath(); c.moveTo(W * 0.44, hz); c.lineTo(W * 0.56, hz); c.lineTo(W * 0.7, H); c.lineTo(W * 0.3, H); c.closePath(); c.fill(); this.church(c, W / 2, hz + 4, Math.min(1, H / 520), night); return hz; };
        const guestsRow = (c: CanvasRenderingContext2D, W: number, y: number, s2: number, cheer: boolean) => this.guests.forEach((g, i) => { const left = i % 2 === 0, k = Math.floor(i / 2); this.put(g, left ? W * (0.2 - k * 0.06) : W * (0.8 + k * 0.06), y + k * 6, s2, left ? 1 : -1); if (cheer && !g.busy) g.play(i % 2 ? 'wave' : 'love'); g.draw(c); });
        const petals = (c: CanvasRenderingContext2D, W: number, H: number) => { for (let i = 0; i < 40; i++) { const x = (i * 53 + this.t * 30 + Math.sin(this.t + i) * 30) % W, y = (i * 37 + this.t * 50) % H; c.fillStyle = i % 2 ? '#ffb3c7' : '#fff'; c.beginPath(); c.ellipse(x, y, 4, 2.5, this.t + i, 0, 7); c.fill(); } };
        const date = `${new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        return [
          { dur: 3.4, cap: '🔔 Clopotele bat: e nunta lui Bubu și a lui Dudu!', enter: () => { Sfx.play('bells'); Sfx.play('chimes', { delay: 1 }); }, draw: (c, W, H) => { const hz = outside(c, W, H); guestsRow(c, W, hz + 40, sz() * 0.7, false); } },
          { dur: 4.2, cap: '👰 Mireasa vine cu buchetul… 🤵 mirele o așteaptă', enter: () => { this.bubu.play('shy'); this.dudu.play('love'); Sfx.play('applause', { vol: 0.5 }); }, draw: (c, W, H, k) => { const hz = outside(c, W, H); guestsRow(c, W, hz + 40, sz() * 0.7, k > 0.5); this.put(this.dudu, W * 0.54, hz + 30, sz() * 0.9, -1); this.dudu.draw(c); this.put(this.bubu, W * 0.46, H * 0.98 - k * (H * 0.98 - hz - 32), sz() * (1.2 - k * 0.3), 1); this.bubu.draw(c); const bq = { x: this.bubu.x + 18 * this.bubu.scale, y: this.bubu.y - 40 * this.bubu.scale }; for (let i = 0; i < 5; i++) e(c, bq.x + Math.cos(i * 1.3) * 7, bq.y + Math.sin(i * 1.3) * 5, 5, 5, ['#fff', '#ffb3c7', '#fff', '#ff9ab8', '#fff'][i], true, 1); } },
          { dur: 3.6, cap: '💍 „Da!” · „Da!” · Inelele pe deget', enter: () => { Sfx.play('chimes'); this.bubu.play('love'); this.dudu.play('love'); }, draw: (c, W, H, k) => { const hz = outside(c, W, H); guestsRow(c, W, hz + 40, sz() * 0.7, false); this.pair(c, W * 0.47, W * 0.53, hz + 32, sz() * 0.9); for (const [x, txt, kk] of [[W * 0.4, 'Da! 💕', 0.15], [W * 0.6, 'Da! 💕', 0.55]] as const) if (k > kk) { c.font = '900 26px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = '#fff'; c.strokeText(txt, x, hz - 50); c.fillStyle = '#ff4d6d'; c.fillText(txt, x, hz - 50); } } },
          { dur: 3.6, cap: '💋 Pupicul mirilor! Casă de piatră!', enter: () => { this.bubu.play('kiss'); this.dudu.play('kiss'); this.boom(90); Sfx.play('victory'); Sfx.play('applause', { delay: 0.3 }); }, draw: (c, W, H) => { const hz = outside(c, W, H); guestsRow(c, W, hz + 40, sz() * 0.7, true); this.pair(c, W * 0.485, W * 0.515, hz + 32, sz() * 0.9); petals(c, W, H); heartPath(c, W / 2, hz - 70, 20 + Math.sin(this.t * 6) * 4); c.fillStyle = '#ff4d6d'; c.fill(); } },
          { dur: 6, cap: 'Hora! Toată lumea în cerc 💃🕺', enter: () => { Sfx.play('chimes'); for (const g of this.guests) g.play('dance_hop'); this.bubu.play('dance_wave'); this.dudu.play('dance_wave'); }, draw: (c, W, H) => { const hz = H * 0.5; this.sky(c, W, H, '#ffb36b', '#ffe1b0', hz); this.ground(c, W, H, hz, '#a6dc93'); for (let i = 0; i < 8; i++) { c.strokeStyle = ['#ff7aa2', '#ffd23f', '#7ab8ff'][i % 3]; c.lineWidth = 3; c.beginPath(); c.moveTo(i * W / 7, 20); c.quadraticCurveTo(i * W / 7 + W / 14, 50, (i + 1) * W / 7, 20); c.stroke(); } const cx = W / 2, cy = H * 0.72, R = Math.min(W * 0.3, 220); const all = [this.bubu, this.dudu, ...this.guests]; const order = all.map((a, i) => ({ a, ang: this.t * 0.9 + i / all.length * 6.283 })).sort((p, q) => Math.sin(p.ang) - Math.sin(q.ang)); for (const { a, ang } of order) { const z = Math.sin(ang); this.put(a, cx + Math.cos(ang) * R, cy + z * 40, sz() * (0.62 + z * 0.12), Math.cos(ang + 1.57) > 0 ? 1 : -1); if (!a.busy) a.play('dance_hop'); a.draw(c); } c.font = '800 16px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.fillStyle = O; c.fillText(`👏 ${this.claps}`, W / 2, 40); } },
          { dur: 3.4, cap: '🎂 Tortul! Mirii taie prima felie', enter: () => { Sfx.play('knife'); this.bubu.play('love'); this.dudu.play('laugh'); }, draw: (c, W, H, k) => { const hz = H * 0.5; this.sky(c, W, H, '#ffb36b', '#ffe1b0', hz); this.ground(c, W, H, hz, '#e8d9b8'); const tx = W / 2, ty = H * 0.78; c.fillStyle = '#fff'; c.strokeStyle = O; c.lineWidth = 3; for (let i = 0; i < 3; i++) { const w = 120 - i * 32, hh = 34; c.beginPath(); c.roundRect(tx - w / 2, ty - (i + 1) * hh, w, hh, 6); c.fill(); c.stroke(); c.fillStyle = '#ffd6e4'; c.fillRect(tx - w / 2 + 3, ty - (i + 1) * hh + 3, w - 6, 6); c.fillStyle = '#fff'; } heartPath(c, tx, ty - 110, 9); c.fillStyle = '#ff4d6d'; c.fill(); this.pair(c, tx - 110, tx + 110, ty + 10, sz() * 0.8); if (k > 0.5) { c.strokeStyle = '#9aa5ad'; c.lineWidth = 4; c.beginPath(); c.moveTo(tx - 5, ty - 40); c.lineTo(tx + 20, ty + 4); c.stroke(); } } },
          { dur: 3.4, cap: '💐 Mireasa aruncă buchetul… cine îl prinde?', enter: () => { Sfx.play('whoosh'); this.bubu.play('wave'); }, draw: (c, W, H, k) => { const hz = outside(c, W, H); guestsRow(c, W, hz + 40, sz() * 0.7, k > 0.8); this.put(this.bubu, W * 0.5, hz + 50, sz() * 0.9, -1); this.bubu.draw(c); const sx = W * 0.5, ex = W * 0.2, x = sx + (ex - sx) * k, y = hz - Math.sin(k * Math.PI) * 150 + 10; for (let i = 0; i < 5; i++) e(c, x + Math.cos(i * 1.3 + k * 9) * 7, y + Math.sin(i * 1.3 + k * 9) * 5, 5, 5, ['#fff', '#ffb3c7', '#fff', '#ff9ab8', '#fff'][i], true, 1); if (k > 0.85) { c.font = '900 20px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ff4d6d'; c.fillText('L-a prins Ina! 🎉', ex, hz - 40); } } },
          { dur: 4.4, cap: `🎆 Bubu & Dudu · ${date}`, enter: () => { this.boom(120); Sfx.play('victory'); this.bubu.play('kiss'); this.dudu.play('kiss'); }, draw: (c, W, H, k) => { const hz = outside(c, W, H, true); this.pair(c, W * 0.485, W * 0.515, hz + 40, sz() * 0.9); for (let i = 0; i < 8; i++) { const p = ((k * 1.5 + i * 0.13) % 1), cx = W * (0.1 + i * 0.11), cy = H * (0.15 + (i % 3) * 0.06); c.globalAlpha = 1 - p; for (let j = 0; j < 12; j++) { const a = j / 12 * 6.28; c.fillStyle = ['#ff7aa2', '#ffd23f', '#4cc9f0', '#7cc576'][i % 4]; c.beginPath(); c.arc(cx + Math.cos(a) * p * 60, cy + Math.sin(a) * p * 60, 2.5, 0, 7); c.fill(); } c.globalAlpha = 1; } } },
          { dur: 7, cap: '📖 Povestea voastră', draw: (c, W, H, k) => { c.fillStyle = '#2b2440'; c.fillRect(0, 0, W, H); const lines = ['Bubu & Dudu', '', ...s.w.log.slice(-24).map(l => l.text), '', 'Casă de piatră! 💕', 'Povestea continuă: proaspăt căsătoriți']; c.textAlign = 'center'; lines.forEach((l, i) => { const y = H + 30 + i * 30 - k * (lines.length * 30 + H * 0.6); if (y < -20 || y > H + 20) return; c.font = i === 0 ? '900 34px "Baloo 2", sans-serif' : '700 15px "Baloo 2", sans-serif'; c.fillStyle = i === 0 ? '#ff9ab8' : '#fff8ef'; fillTextIcons(c, l, W / 2, y, i === 0 ? 34 : 15); }); } },
        ];
      }
      case 'shopbuilt': return [
        { dur: 3.2, cap: '🔨 Meșterii construiesc magazinul vostru…', enter: () => Sfx.play('hammer'), draw: (c, W, H, k) => { const hz = H * 0.62; this.sky(c, W, H, '#9fdcff', '#fff1d6', hz); this.ground(c, W, H, hz, '#d6d2cb'); const h = 160 * ease(k); c.fillStyle = '#fff0f5'; c.strokeStyle = O; c.lineWidth = 3; c.fillRect(W * 0.3, hz - h, W * 0.4, h); c.strokeRect(W * 0.3, hz - h, W * 0.4, h); for (let i = 0; i < 6; i++) if (Math.random() < 0.05) Sfx.play('hammer', { vol: 0.3 }); this.pair(c, W * 0.18, W * 0.82, H * 0.9, sz() * 0.9); } },
        { dur: 3.6, cap: '🏪 „Bubu & Dudu” e deschis! Tăiați panglica ✂️', enter: () => { this.boom(); Sfx.play('victory'); Sfx.play('applause', { delay: 0.2 }); this.bubu.play('dance_hop'); this.dudu.play('dance_hop'); }, draw: (c, W, H, k) => { const hz = H * 0.62; this.sky(c, W, H, '#9fdcff', '#fff1d6', hz); this.ground(c, W, H, hz, '#d6d2cb'); c.fillStyle = '#fff0f5'; c.strokeStyle = O; c.lineWidth = 3; c.fillRect(W * 0.3, hz - 160, W * 0.4, 160); c.strokeRect(W * 0.3, hz - 160, W * 0.4, 160); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff' : '#ff9ab8'; c.fillRect(W * 0.3 + i * W * 0.05, hz - 110, W * 0.05, 20); } c.fillStyle = '#ff4d8d'; c.font = '900 26px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.fillText('Bubu & Dudu', W / 2, hz - 125); c.fillStyle = '#bfe8ff'; c.fillRect(W * 0.34, hz - 80, W * 0.12, 60); c.fillRect(W * 0.54, hz - 80, W * 0.12, 60); c.strokeStyle = '#e63946'; c.lineWidth = 5; c.beginPath(); c.moveTo(W * 0.3, hz - 30); c.lineTo(W * (0.5 - (k > 0.4 ? 0.06 : 0)), hz - 30 + (k > 0.4 ? 20 : 0)); c.moveTo(W * (0.5 + (k > 0.4 ? 0.06 : 0)), hz - 30 + (k > 0.4 ? 20 : 0)); c.lineTo(W * 0.7, hz - 30); c.stroke(); this.pair(c, W * 0.44, W * 0.56, H * 0.92, sz() * 0.9); } },
      ];
      case 'fair': return [
        { dur: 3.4, cap: '🎪 Târgul orașului: standul „Bubu & Dudu”', enter: () => { Sfx.play('chimes'); for (const g of this.guests) g.play('wave'); }, draw: (c, W, H, k) => { const hz = H * 0.45; this.sky(c, W, H, '#9fdcff', '#fff1d6', hz); this.ground(c, W, H, hz, '#a6dc93'); for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#fff' : '#ff7aa2'; c.beginPath(); c.moveTo(W * 0.25 + i * W * 0.0714, hz - 30); c.lineTo(W * 0.25 + (i + 1) * W * 0.0714, hz - 30); c.lineTo(W * 0.25 + (i + 0.5) * W * 0.0714, hz); c.closePath(); c.fill(); } c.fillStyle = '#c98e5f'; c.fillRect(W * 0.25, hz + 40, W * 0.5, 50); c.strokeStyle = O; c.lineWidth = 3; c.strokeRect(W * 0.25, hz + 40, W * 0.5, 50); for (let i = 0; i < 8; i++) e(c, W * 0.29 + i * W * 0.06, hz + 34, 10, 8, ['#ffd23f', '#fff', '#ffe1b0', '#ff9ab8'][i % 4]); this.pair(c, W * 0.42, W * 0.58, hz + 40, sz() * 0.8); this.guests.forEach((g, i) => { this.put(g, W * (0.1 + i * 0.16) + Math.sin(this.t + i) * 6, H * 0.95, sz() * 0.85, i % 2 ? -1 : 1); g.draw(c); }); void k; } },
        { dur: 3.4, cap: '💰 Toată lumea cumpără! Vedetele târgului', enter: () => { this.boom(); Sfx.play('register'); Sfx.play('applause', { delay: 0.3 }); this.bubu.play('dance_hop'); this.dudu.play('flex'); }, draw: (c, W, H, k) => { const hz = H * 0.45; this.sky(c, W, H, '#9fdcff', '#fff1d6', hz); this.ground(c, W, H, hz, '#a6dc93'); c.fillStyle = '#c98e5f'; c.fillRect(W * 0.25, hz + 40, W * 0.5, 50); this.pair(c, W * 0.42, W * 0.58, hz + 40, sz() * 0.8); for (let i = 0; i < 10; i++) { const p = (k * 2 + i * 0.1) % 1; e(c, W * 0.5 + (i - 5) * 20, hz - p * 80, 7, 7, '#ffd23f'); } this.guests.forEach((g, i) => { this.put(g, W * (0.1 + i * 0.16), H * 0.95, sz() * 0.85, i % 2 ? -1 : 1); g.draw(c); }); } },
      ];
      case 'truck': return [
        { dur: 3.6, cap: `🚚 Dudu duce marfa la ${s.pendingClient || 'oraș'}`, enter: () => Sfx.play('car_start', { rate: 0.8 }), draw: (c, W, H, k) => { const hz = H * 0.55; this.sky(c, W, H, '#9fdcff', '#fff1d6', hz); this.hills(c, W, hz, '#9fd68c', 30, 4); for (let i = 0; i < 6; i++) { const bh = 60 + (i * 37) % 80; c.fillStyle = ['#c9d2e6', '#ffe1ea', '#e7f6e2'][i % 3]; c.fillRect(W * 0.62 + i * W * 0.06, hz - bh, W * 0.05, bh); } this.ground(c, W, H, hz, '#9fd68c'); c.fillStyle = '#8d8f9a'; c.fillRect(0, H * 0.72, W, 50); const x = -120 + k * (W + 240), y = H * 0.74; c.fillStyle = '#ff9ab8'; c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.roundRect(x - 80, y - 60, 110, 60, 6); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.font = '800 12px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.fillText('Bubu & Dudu', x - 25, y - 26); c.fillStyle = '#7ab8ff'; c.beginPath(); c.roundRect(x + 30, y - 46, 44, 46, 8); c.fill(); c.stroke(); for (const wx of [x - 56, x + 50]) { e(c, wx, y + 4, 12, 12, '#2b2b33'); e(c, wx, y + 4, 5, 5, '#ccc', false); } } },
      ];
    }
    return [];
  }
}
