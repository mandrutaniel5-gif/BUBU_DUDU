// Baza pentru sarbatori (1.11.0): o „emisiune” pe tot ecranul, din momente (faze). Unele se privesc (animatie,
// o atingere trece mai departe), altele se joaca (atingi, tragi, nimeresti ritmul). Porneste pe ambele telefoane;
// in momentele jucate impreuna fiecare isi trimite miscarile, iar partenerul fara telefon (AI) joaca singur.
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import { Actor } from '../char/actor';
import { NPC_SPECS, SPECS, heartPath, starPath, type CharId } from '../char/draw';
import { VILLAGERS } from '../game/town';
import type { WorldScene } from '../scenes/world';
import { fillTextIcons, iconCanvas } from '../ui/icons';

export const O = '#3a2a22';
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (k: number) => k * k * (3 - 2 * k);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export function ell(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, st = true, lw = 2) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, 7); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } }
export function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, st = true, lw = 2.5) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); if (st) { c.strokeStyle = O; c.lineWidth = lw; c.stroke(); } }
/** o iconita (emoji desenat) centrata la x,y */
export function icon(c: CanvasRenderingContext2D, e: string, x: number, y: number, size: number, rot = 0) {
  const cv = iconCanvas(e, 96); if (!cv) { c.font = `${size}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, x, y); return; }
  c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.drawImage(cv, -size / 2, -size / 2, size, size); c.restore();
}
/** text cu contur alb (titluri, replici) */
export function say(c: CanvasRenderingContext2D, t: string, x: number, y: number, size = 18, col = O, align: CanvasTextAlign = 'center') {
  c.font = `800 ${size}px "Baloo 2", sans-serif`; c.textAlign = align; c.textBaseline = 'middle'; c.lineWidth = 5; c.strokeStyle = '#fff'; c.lineJoin = 'round';
  c.strokeText(t, x, y); c.fillStyle = col; c.fillText(t, x, y);
}
/** balon de vorba deasupra cuiva */
export function bubble(c: CanvasRenderingContext2D, t: string, x: number, y: number, size = 14, W = 0) {
  c.font = `800 ${size}px "Baloo 2", sans-serif`; let w = c.measureText(t).width + 26; const h = size + 16;
  if (W) { if (w > W - 16) { size = Math.max(10, Math.floor(size * (W - 16) / w)); c.font = `800 ${size}px "Baloo 2", sans-serif`; w = c.measureText(t).width + 26; } const tip = x; x = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, x)); if (tip !== x) { /* varful ramane deasupra vorbitorului */ } }
  c.fillStyle = '#fff'; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.roundRect(x - w / 2, y - h, w, h, h / 2); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - 7, y - 1); c.lineTo(x, y + 9); c.lineTo(x + 6, y - 1); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(x - 6, y - 4, 11, 4);
  c.fillStyle = O; c.textAlign = 'center'; c.textBaseline = 'middle'; fillTextIcons(c, t, x, y - h / 2, size);
}
export { heartPath, starPath };

/** un moment din sarbatoare. Fara `play`: se priveste `dur` secunde (o atingere trece mai departe). */
export interface Phase {
  id: string;
  cap: string;
  dur?: number;
  enter?: () => void;
  draw: (c: CanvasRenderingContext2D, W: number, H: number, k: number, t: number) => void;
  /** momentul se joaca: se termina cand intoarce true (sau dupa `max` secunde) */
  play?: (dt: number) => boolean;
  max?: number;
  tap?: (type: 'down' | 'move' | 'up', x: number, y: number) => void;
  /** textul de sus-dreapta (ce ai de facut) */
  hint?: string;
}
export interface Confetto { x: number; y: number; vx: number; vy: number; c: string; r: number; rot: number }
export interface Spark { x: number; y: number; vx: number; vy: number; c: string; life: number; max: number; r: number; grav: number }

export abstract class Show extends Panel {
  id: string; arg: any; remote: boolean;
  phases: Phase[] = []; pi = 0; pt = 0;
  W = 800; H = 450;
  bubu: Actor; dudu: Actor; me: Actor; pa: Actor; guests: Actor[] = [];
  confetti: Confetto[] = []; sparks: Spark[] = [];
  partnerAI: boolean; heard = false;
  flash = 0;
  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '', '');
    this.id = scene.holidayId; this.arg = scene.holidayArg; this.remote = scene.holidayRemote; scene.holidayRemote = false;
    this.bubu = new Actor('bubu', this.fx); this.dudu = new Actor('dudu', this.fx);
    this.bubu.outfit = scene.w.chars.bubu.outfit; this.dudu.outfit = scene.w.chars.dudu.outfit;
    this.me = scene.myId === 'bubu' ? this.bubu : this.dudu; this.pa = this.me === this.bubu ? this.dudu : this.bubu;
    this.partnerAI = scene.partner.control !== 'remote';
  }
  /** satenii (in ordinea lor), imbracati de sarbatoare */
  villagers(dress: 'none' | 'party' | 'winter' | 'wedding' = 'none'): Actor[] {
    return VILLAGERS.map((v, i) => {
      const a = new Actor('bubu', this.fx, NPC_SPECS[v.spec]);
      const girl = ['leana', 'ina', 'rita', 'miti'].includes(v.id);
      a.outfit = v.spec === 'granny' ? { head: 'batic', face: 'none', neck: dress === 'winter' ? 'scarf' : 'none', body: 'ie' } as any
        : dress === 'party' ? { head: i % 2 ? 'party' : 'none', face: 'none', neck: i % 3 === 0 ? 'bowtie' : 'none', body: girl ? 'rochita' : 'vesta' } as any
          : dress === 'winter' ? { head: 'beanie', face: 'none', neck: 'scarf', body: 'pulover' } as any
            : dress === 'wedding' ? { head: girl ? 'flower' : 'none', face: 'none', neck: girl ? 'none' : 'bowtie', body: girl ? 'rochie' : 'costum' } as any
              : { head: 'none', face: 'none', neck: 'none', body: girl ? 'rochita' : 'vesta' } as any;
      (a as any).vid = v.id; (a as any).vname = v.name;
      return a;
    });
  }
  guest(vid: string) { return this.guests.find(g => (g as any).vid === vid) ?? this.guests[0]; }
  name(id: CharId) { return SPECS[id].name; }
  get myName() { return this.name(this.scene.myId); }
  get paName() { return this.name(this.scene.partner.id); }
  /** partenerul joaca singur (AI) daca nu e la telefon sau n-a dat semn in sarbatoarea asta */
  get aiPlays() { return this.partnerAI || (!this.heard && this.t > 4); }

  // ------------------------------------------------------------------ retea
  send(d: object) { if (!this.partnerAI) this.scene.net.sendEvent({ t: 'mini', who: this.scene.myId, data: { k: 'hol', show: this.id, ...d } }); }
  net(d: any) { if (!d || d.k !== 'hol' || (d.show && d.show !== this.id)) return; this.heard = true; this.onNet(d); }
  onNet(_d: any) { /* in fiecare sarbatoare */ }

  // ------------------------------------------------------------------ desfasurare
  start() { this.phases = this.build(); this.phases[0]?.enter?.(); for (const d of this.scene.miniInbox.splice(0)) this.net(d); }
  abstract build(): Phase[];
  /** la final: ce primiti (o singura data, pe telefonul care a pornit; nevoile fiecare la el) */
  abstract reward(): void;
  endText() { return '💕'; }
  get phase() { return this.phases[Math.min(this.pi, this.phases.length - 1)]; }
  next() { this.pi++; this.pt = 0; const p = this.phases[this.pi]; if (!p) { this.end(); return; } p.enter?.(); }
  goto(id: string) { const i = this.phases.findIndex(p => p.id === id); if (i < 0) return; this.pi = i - 1; this.next(); }
  /** a iesit cu X inainte de final */
  quit = false;
  end() { if (this.ended) return; try { this.reward(); } catch (e) { console.error(e); } this.finish(1, this.quit ? 'Altă dată 🙂' : this.endText()); }
  abort() { if (!this.ended && this.pi < this.phases.length - 1) this.quit = true; this.end(); }
  tick(dt: number) {
    this.pt += dt;
    this.bubu.update(dt); this.dudu.update(dt); for (const g of this.guests) g.update(dt);
    for (const p of this.confetti) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 70 * dt; p.vx *= 0.99; p.rot += dt * 5; }
    this.confetti = this.confetti.filter(p => p.y < this.H + 20);
    for (const s of this.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += s.grav * dt; s.vx *= 0.985; s.vy *= 0.985; s.life -= dt; }
    this.sparks = this.sparks.filter(s => s.life > 0);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    const p = this.phases[this.pi]; if (!p) { this.end(); return; }
    if (p.play) { if (p.play(dt) || (p.max && this.pt > p.max)) this.next(); }
    else if (this.pt >= (p.dur ?? 3)) this.next();
  }
  pointer(type: 'down' | 'move' | 'up', x: number, y: number) {
    const p = this.phases[this.pi]; if (!p) return;
    if (p.tap) { p.tap(type, x, y); return; }
    if (type === 'down' && !p.play && this.pt > 0.7) this.next();
  }
  key(k: string, d: boolean) { if (d && (k === ' ' || k === 'enter')) { const p = this.phases[this.pi]; if (p && !p.play) this.next(); } }
  scene2() { /* desenam tot ecranul in draw() */ }
  draw(c: CanvasRenderingContext2D, W: number, H: number) {
    this.W = W; this.H = H; this.box = { x: 0, y: 0, w: W, h: H };
    const p = this.phase;
    c.save();
    if (this.shake > 0.3) c.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    if (p) p.draw(c, W, H, clamp(this.pt / (p.dur ?? p.max ?? 3)), this.t);
    for (const q of this.confetti) { c.save(); c.translate(q.x, q.y); c.rotate(q.rot); c.fillStyle = q.c; c.fillRect(-q.r, -q.r / 2, q.r * 2, q.r); c.restore(); }
    for (const s of this.sparks) { const a = clamp(s.life / s.max); c.globalAlpha = a * 0.25; c.fillStyle = s.c; c.beginPath(); c.arc(s.x, s.y, s.r * 2.6, 0, 7); c.fill(); c.globalAlpha = a; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); }
    c.globalAlpha = 1;
    this.fx.draw(c);
    if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.flash})`; c.fillRect(0, 0, W, H); }
    c.restore();
    // subtitlul (ce se intampla) si indiciul (ce ai de facut)
    if (p?.cap) { c.font = '800 17px "Baloo 2", sans-serif'; const tw = Math.min(W - 24, c.measureText(p.cap).width + 44); c.fillStyle = 'rgba(255,250,245,0.95)'; c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.roundRect(W / 2 - tw / 2, H - 54, tw, 38, 19); c.fill(); c.stroke(); c.fillStyle = O; c.textAlign = 'center'; c.textBaseline = 'middle'; fillTextIcons(c, p.cap, W / 2, H - 35, 17); }
    const hint = p?.hint ?? (p && !p.play ? 'Atinge ca să mergi mai departe ›' : '');
    if (hint) { c.font = '800 13px "Baloo 2", sans-serif'; const tw = c.measureText(hint).width + 24; c.fillStyle = p?.play ? '#ff4d8d' : 'rgba(58,42,34,0.55)'; c.beginPath(); c.roundRect(W - tw - 58, 13, tw, 26, 13); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fillTextIcons(c, hint, W - tw / 2 - 58, 26, 13); }
    // butonul X, sus in dreapta (iesi; primesti ce ati facut pana acum)
    c.fillStyle = '#fff'; c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.arc(W - 26, 26, 15, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(W - 32, 20); c.lineTo(W - 20, 32); c.moveTo(W - 20, 20); c.lineTo(W - 32, 32); c.stroke();
    if (this.ended) { const k = Math.min(1, this.ended.t * 3); c.fillStyle = `rgba(255,255,255,${0.78 * k})`; c.fillRect(0, H / 2 - 50, W, 100); say(c, this.ended.text, W / 2, H / 2, Math.round(30 * (0.6 + 0.4 * k)), '#ff4d6d'); }
    c.textBaseline = 'alphabetic';
  }

  // ------------------------------------------------------------------ efecte
  boom(n = 70, x = this.W / 2, y = this.H * 0.25) { for (let i = 0; i < n; i++) this.confetti.push({ x: x + (Math.random() - 0.5) * this.W * 0.5, y, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 240, c: ['#ff7aa2', '#ffd23f', '#4cc9f0', '#7cc576', '#fff', '#c77dff'][i % 6], r: 2.5 + Math.random() * 3, rot: Math.random() * 6 }); }
  burst(x: number, y: number, n: number, cols: string[], speed = 160, grav = 60, life = 1.4, r = 2.6) {
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.random() * 0.2, v = speed * (0.6 + Math.random() * 0.5); this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: cols[i % cols.length], life: life * (0.7 + Math.random() * 0.5), max: life, r, grav }); }
  }
  /** artificii in forma de ceva (inima, stea, floare, panda, ursulet) */
  shape(x: number, y: number, kind: string, cols: string[], size = 70) {
    const pts: [number, number][] = [];
    const N = 46;
    if (kind === 'heart') for (let i = 0; i < N; i++) { const t = (i / N) * Math.PI * 2; pts.push([16 * Math.sin(t) ** 3 / 16, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]); }
    else if (kind === 'star') for (let i = 0; i < N; i++) { const t = (i / N) * Math.PI * 2, r = (i % (N / 5)) / (N / 5); const R = 0.45 + 0.55 * Math.abs(1 - 2 * r); pts.push([Math.cos(t - Math.PI / 2) * R, Math.sin(t - Math.PI / 2) * R]); }
    else if (kind === 'flower') for (let i = 0; i < N; i++) { const t = (i / N) * Math.PI * 2, R = 0.55 + 0.45 * Math.abs(Math.cos(t * 2.5)); pts.push([Math.cos(t) * R, Math.sin(t) * R]); }
    else if (kind === 'panda' || kind === 'bear') {
      for (let i = 0; i < 30; i++) { const t = (i / 30) * Math.PI * 2; pts.push([Math.cos(t) * 0.8, Math.sin(t) * 0.7 + 0.1]); }
      for (const sx of [-1, 1]) for (let i = 0; i < 8; i++) { const t = (i / 8) * Math.PI * 2; pts.push([sx * 0.62 + Math.cos(t) * 0.22, -0.55 + Math.sin(t) * 0.22]); }
      if (kind === 'panda') for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; pts.push([sx * 0.3 + Math.cos(t) * 0.14, -0.02 + Math.sin(t) * 0.17]); }
      else for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; pts.push([Math.cos(t) * 0.22, 0.28 + Math.sin(t) * 0.14]); }
    } else for (let i = 0; i < N; i++) { const t = (i / N) * Math.PI * 2; pts.push([Math.cos(t), Math.sin(t)]); }
    pts.forEach(([px, py], i) => this.sparks.push({ x, y, vx: px * size * 1.6, vy: py * size * 1.6, c: cols[i % cols.length], life: 1.9, max: 1.9, r: 3.4, grav: 14 }));
    for (let i = 0; i < 14; i++) { const a = Math.random() * 7, v = 30 + Math.random() * 40; this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: '#fff', life: 0.6, max: 0.6, r: 1.6, grav: 0 }); }
  }

  // ------------------------------------------------------------------ decoruri comune
  sky(c: CanvasRenderingContext2D, W: number, hz: number, top: string, bot: string) { const g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, hz); }
  ground(c: CanvasRenderingContext2D, W: number, H: number, hz: number, col: string) { c.fillStyle = col; c.fillRect(0, hz, W, H - hz); }
  stars(c: CanvasRenderingContext2D, W: number, hz: number, n = 40) { for (let i = 0; i < n; i++) { const x = (i * 97.3) % W, y = (i * 53.7) % (hz * 0.85), tw = 0.5 + 0.5 * Math.sin(this.t * 2 + i); c.fillStyle = `rgba(255,255,230,${0.35 + 0.55 * tw})`; c.beginPath(); c.arc(x, y, 1 + (i % 3) * 0.5, 0, 7); c.fill(); } }
  snow(c: CanvasRenderingContext2D, W: number, H: number, n = 60) { c.fillStyle = '#fff'; for (let i = 0; i < n; i++) { const x = ((i * 71.3 + Math.sin(this.t * 0.8 + i) * 18 + this.t * 8) % W + W) % W, y = ((i * 37.1 + this.t * (24 + (i % 5) * 6)) % H); c.globalAlpha = 0.85; c.beginPath(); c.arc(x, y, 1.5 + (i % 3), 0, 7); c.fill(); } c.globalAlpha = 1; }
  /** piata satului: case, fantana, felinare (fundal comun pentru petreceri) */
  village(c: CanvasRenderingContext2D, W: number, H: number, hz: number, night: number, winter = false) {
    this.sky(c, W, hz, night > 0.5 ? '#1d2550' : '#8fd3ff', night > 0.5 ? '#4b3f7a' : '#fff1d6');
    if (night > 0.5) this.stars(c, W, hz);
    const houses = [[0.04, '#fff1d6', '#c0573e'], [0.2, '#ffe1ea', '#e5809a'], [0.62, '#e8f1ff', '#5b7fbf'], [0.8, '#fff3e0', '#d9a05a']] as const;
    for (const [u, wall, roof] of houses) {
      const x = W * u, w = W * 0.15, hh = H * 0.2, y = hz - hh;
      rrect(c, x, y, w, hh, 4, night > 0.5 ? shadeHex(wall, -60) : wall);
      c.fillStyle = winter ? '#f5f9ff' : roof; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 8, y + 2); c.lineTo(x + w / 2, y - hh * 0.55); c.lineTo(x + w + 8, y + 2); c.closePath(); c.fill(); c.stroke();
      for (const k of [0.25, 0.65]) { c.fillStyle = night > 0.5 ? '#ffe680' : '#bde7ff'; c.fillRect(x + w * k - 7, y + hh * 0.3, 14, 14); c.strokeRect(x + w * k - 7, y + hh * 0.3, 14, 14); }
    }
    // primaria cu turnul
    const hx = W * 0.4, hw = W * 0.2, hh = H * 0.28; rrect(c, hx, hz - hh, hw, hh, 4, night > 0.5 ? '#9fb0d0' : '#e8f1ff');
    rrect(c, hx + hw / 2 - 16, hz - hh - 50, 32, 52, 3, night > 0.5 ? '#9fb0d0' : '#e8f1ff'); ell(c, hx + hw / 2, hz - hh - 30, 10, 10, '#fff');
    c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(hx + hw / 2, hz - hh - 30); c.lineTo(hx + hw / 2 + 6 * Math.cos(this.t), hz - hh - 30 + 6 * Math.sin(this.t)); c.stroke();
    this.ground(c, W, H, hz, winter ? '#eef3f8' : '#d8c9b0');
    if (winter) { c.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse((i * 131) % W, hz + 14 + (i * 47) % (H - hz - 20), 26 + (i % 3) * 10, 5, 0, 0, 7); c.fill(); } }
    else { c.strokeStyle = '#c6b597'; c.lineWidth = 1; for (let y = hz + 10; y < H; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } }
    if (night > 0.5) { const g = c.createRadialGradient(W / 2, H * 0.75, 20, W / 2, H * 0.75, W * 0.6); g.addColorStop(0, 'rgba(255,230,150,0.25)'); g.addColorStop(1, 'rgba(0,0,30,0.25)'); c.fillStyle = g; c.fillRect(0, hz, W, H - hz); }
  }
  /** ghirlanda cu stegulete intre doua puncte */
  garland(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, sag = 30, n = 12, cols = ['#ff7aa2', '#ffd23f', '#4cc9f0', '#7cc576']) {
    c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1); c.stroke();
    for (let i = 1; i < n; i++) { const u = i / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u) + sag * 4 * u * (1 - u) * 1; const sw = Math.sin(this.t * 3 + i) * 0.15; c.save(); c.translate(x, y); c.rotate(sw); c.fillStyle = cols[i % cols.length]; c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 0); c.lineTo(0, 13); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  }
  /** becuri colorate intre doua puncte (clipesc) */
  lights(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, sag = 20, n = 14, on = 1) {
    c.strokeStyle = '#2b4a2b'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1); c.stroke();
    const cols = ['#ff4d6d', '#ffd23f', '#4cc9f0', '#7cc576', '#c77dff'];
    for (let i = 1; i < n; i++) { const u = i / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u) + sag * 4 * u * (1 - u); const lit = on * (0.55 + 0.45 * Math.sin(this.t * 4 + i * 1.7)); c.fillStyle = cols[i % 5]; c.globalAlpha = 0.25 + 0.75 * lit; c.beginPath(); c.ellipse(x, y + 4, 3.5, 5, 0, 0, 7); c.fill(); if (lit > 0.6) { c.globalAlpha = 0.25 * lit; c.beginPath(); c.arc(x, y + 4, 10, 0, 7); c.fill(); } c.globalAlpha = 1; }
  }
  /** balon de vorba care nu iese din ecran */
  bub(c: CanvasRenderingContext2D, t: string, x: number, y: number, size = 14) { bubble(c, t, x, y, size, this.W); }
  put(a: Actor, x: number, y: number, s: number, flip: 1 | -1 = 1) { a.x = x; a.y = y; a.scale = s; a.flip = flip; }
  sz() { return Math.min(1.5, this.H / 320); }
  /** butoane rotunde (alegeri) desenate pe ecran; intoarce dreptunghiurile ca sa le poti atinge */
  buttons(c: CanvasRenderingContext2D, items: { icon: string; label: string; dis?: boolean; on?: boolean }[], y: number, bw = 120): { x: number; y: number; w: number; h: number }[] {
    const W = this.W, n = items.length, gap = 10, w = Math.min(bw, (W - 30 - gap * (n - 1)) / n), h = 74, x0 = W / 2 - (n * w + (n - 1) * gap) / 2;
    return items.map((it, i) => { const x = x0 + i * (w + gap); rrect(c, x, y, w, h, 16, it.on ? '#ffe1ea' : it.dis ? '#eee6e0' : '#fffaf5', true, it.on ? 4 : 2.5); c.globalAlpha = it.dis ? 0.45 : 1; icon(c, it.icon, x + w / 2, y + 26, 30); c.font = '800 12px "Baloo 2", sans-serif'; c.fillStyle = O; c.textAlign = 'center'; c.textBaseline = 'middle'; fillTextIcons(c, it.label, x + w / 2, y + 58, 12); c.globalAlpha = 1; return { x, y, w, h }; });
  }
  hit(r: { x: number; y: number; w: number; h: number } | undefined, x: number, y: number) { return !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
  sfx(id: string, o?: { vol?: number; rate?: number; delay?: number }) { Sfx.play(id, o); }
}

/** culoare mai deschisa / mai inchisa */
export function shadeHex(col: string, d: number) { const n = parseInt(col.slice(1), 16); const f = (v: number) => Math.max(0, Math.min(255, v + d)); return '#' + ((1 << 24) + (f(n >> 16) << 16) + (f((n >> 8) & 255) << 8) + f(n & 255)).toString(16).slice(1); }
/** numere la intamplare, la fel pe ambele telefoane */
export function seeded(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
