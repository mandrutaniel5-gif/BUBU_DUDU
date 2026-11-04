// Minijocurile din sat: lectia de la scoala si roata mare.
import { Panel } from './base';
import { Sfx } from '../engine/sfx';
import type { WorldScene } from '../scenes/world';
import { drawCharacter, heartPath } from '../char/draw';
import { basePose } from '../char/pose';

const O = '#4a2a22';
const QUESTIONS: { q: string; a: string[]; ok: number }[] = [
  { q: 'Ce îi trebuie unei plante ca să crească?', a: ['Apă și soare 🌞💧', 'Ciocolată 🍫', 'Muzică rock 🎸'], ok: 0 },
  { q: 'Din ce se face pâinea?', a: ['Din lapte', 'Din făină 🌾', 'Din pietre'], ok: 1 },
  { q: 'Ce pui pe foc ca să nu îngheți?', a: ['Zăpadă ❄️', 'Lemne 🪵', 'Apă'], ok: 1 },
  { q: 'Ce culoare are o roșie coaptă?', a: ['Albastră', 'Roșie 🍅', 'Violet'], ok: 1 },
  { q: 'Cine trezește satul dimineața?', a: ['Cocoșul 🐓', 'Peștele', 'Luna'], ok: 0 },
  { q: 'Ce faci când partenerul e bolnav?', a: ['Îl lași singur', 'Îi faci supă și îl îngrijești 🍲', 'Te uiți la TV'], ok: 1 },
  { q: 'Cu ce uzi grădina?', a: ['Cu apă din fântână 🪣', 'Cu suc', 'Cu nisip'], ok: 0 },
  { q: 'Ce aduce îngrășământul?', a: ['Plantele cresc mai repede ✨', 'Plantele zboară', 'Nimic'], ok: 0 },
  { q: 'Ce animal face miere?', a: ['Vaca', 'Albina 🐝', 'Ariciul'], ok: 1 },
  { q: 'Câte ore are o zi?', a: ['12', '24 ⏰', '100'], ok: 1 },
  { q: 'Ce e o ie?', a: ['O bluză tradițională românească 👚', 'Un fel de supă', 'O pasăre'], ok: 0 },
  { q: 'Ce faci după ce culegi legumele?', a: ['Le arunci', 'Le gătești sau le vinzi 🥕', 'Le îngropi iar'], ok: 1 },
];

export class QuizGame extends Panel {
  qs = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 4);
  i = 0; good = 0; answered = -1; wait = 0;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🏫 Lecția doamnei învățătoare', 'Alege răspunsul corect'); }
  tick(dt: number) {
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { this.answered = -1; this.i++; if (this.i >= this.qs.length) this.end(); } }
  }
  end() {
    const s = this.scene;
    s.op({ k: 'stat', key: 'school', delta: 1 }); s.op({ k: 'money', delta: this.good * 5 }); s.op({ k: 'need', who: s.myId, need: 'fun', delta: 10 });
    this.finish(this.good ? 1 + this.good * 0.2 : 0.3, this.good >= 3 ? `Nota 10! ⭐ +${this.good * 5} lei` : `${this.good}/4 corecte · +${this.good * 5} lei`);
  }
  btn(k: number) { const B = this.box; return { x: B.x + 40, y: B.y + B.h * 0.42 + k * 74, w: B.w - 80, h: 60 }; }
  pointer(type: string, x: number, y: number) {
    if (type !== 'down' || this.answered >= 0 || this.i >= this.qs.length) return;
    for (let k = 0; k < 3; k++) { const b = this.btn(k); if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) this.answer(k); }
  }
  key(k: string, d: boolean) { if (d && k >= '1' && k <= '3' && this.answered < 0) this.answer(+k - 1); }
  answer(k: number) {
    this.answered = k; this.wait = 1.3;
    if (k === this.qs[this.i].ok) { this.good++; Sfx.play('good'); this.hero.play('dance_hop'); this.fx.hearts(this.box.x + this.box.w / 2, this.box.y + 120, 4); }
    else { Sfx.play('bad'); this.hero.play('shy'); }
  }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#fff6d6'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#2f5d50'; ctx.strokeStyle = '#8a5d32'; ctx.lineWidth = 8; ctx.beginPath(); ctx.roundRect(x + 30, y + 50, w - 60, h * 0.3, 8); ctx.fill(); ctx.stroke();
    const q = this.qs[Math.min(this.i, this.qs.length - 1)];
    ctx.font = '800 19px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(q.q, x + w / 2, y + 50 + h * 0.15);
    ctx.font = '700 13px "Baloo 2", sans-serif'; ctx.fillStyle = '#cfe8dc'; ctx.fillText(`Întrebarea ${Math.min(this.i + 1, this.qs.length)}/${this.qs.length} · ✅ ${this.good}`, x + w / 2, y + 66);
    q.a.forEach((txt, k) => {
      const b = this.btn(k); const st = this.answered < 0 ? 'none' : k === q.ok ? 'ok' : k === this.answered ? 'bad' : 'none';
      ctx.fillStyle = st === 'ok' ? '#c8f2c0' : st === 'bad' ? '#ffd0d0' : '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.stroke();
      ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.fillText(`${k + 1}. ${txt}`, b.x + b.w / 2, b.y + b.h / 2);
    });
    ctx.textBaseline = 'alphabetic';
    this.hero.scale = 0.9; this.hero.x = x + 54; this.hero.y = y + h - 30; this.hero.draw(ctx);
  }
}

/** Roata mare: o tura intreaga la apus; sus, un pupic (in doi) sau o dorinta (singur) */
export class FerrisGame extends Panel {
  k = 0; kissed = false; holding = false; kissT = 0; duo: boolean;
  birds = Array.from({ length: 5 }, (_, i) => ({ x: Math.random(), y: 0.12 + Math.random() * 0.25, s: 0.6 + Math.random() * 0.5, ph: i }));
  constructor(s: WorldScene, d: (n: number) => void) {
    super(s, d, '🎡 Roata mare', s.duo ? 'Sus de tot, ține apăsat pentru un pupic 💕' : 'Sus de tot, ține apăsat și pune-ți o dorință ✨');
    this.duo = s.duo;
  }
  get top() { return this.k > 0.4 && this.k < 0.6; }
  tick(dt: number) {
    // urca repede, sta putin sus (incetineste), apoi coboara
    this.k = Math.min(1, this.k + dt / (this.top ? 16 : 11));
    if (this.top && this.holding && !this.kissed) { this.kissT += dt; if (this.kissT > 1.2) { this.kissed = true; Sfx.play(this.duo ? 'kiss' : 'chimes'); this.fx.hearts(this.box.x + this.box.w / 2, this.box.y + this.box.h * 0.3, 14); } }
    for (const b of this.birds) { b.x += dt * 0.03 * b.s; if (b.x > 1.1) { b.x = -0.1; b.y = 0.1 + Math.random() * 0.25; } }
    if (this.k >= 1) {
      const s = this.scene; const love = this.duo ? (this.kissed ? 35 : 20) : 8;
      s.op({ k: 'need', who: s.myId, need: 'love', delta: love }); s.op({ k: 'need', who: s.myId, need: 'fun', delta: this.duo ? 15 : 20 });
      if (this.duo && s.partner.control !== 'remote') s.op({ k: 'need', who: s.partner.id, need: 'love', delta: love });
      s.op({ k: 'stat', key: 'ferris', delta: 1 });
      s.log(this.duo ? (this.kissed ? 'Un pupic în vârful roții mari 🎡💕' : 'O tură cu roata mare 🎡') : `${s.me.actor.spec.name} s-a dat în roata mare 🎡${this.kissed ? ' și și-a pus o dorință ✨' : ''}`);
      this.finish(this.kissed ? 2 : 1, this.kissed ? (this.duo ? 'Cel mai frumos pupic 💕' : 'Dorința s-a auzit ✨') : 'Ce priveliște! ☀️');
    }
  }
  pointer(t: string) { this.holding = t === 'down' ? true : t === 'up' ? false : this.holding; }
  key(k: string, d: boolean) { if (k === ' ' || k === 'e') this.holding = d; }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const k = this.k, t = this.t;
    // cerul: dupa-amiaza -> apus -> amurg (cu cat te dai mai mult)
    const dusk = Math.min(1, k * 1.3);
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, mix('#8fcdf5', '#4a4a8a', dusk)); sky.addColorStop(0.55, mix('#ffe1c9', '#ff9a8b', dusk)); sky.addColorStop(1, mix('#fff3dc', '#ffc49a', dusk));
    ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
    if (dusk > 0.5) for (let i = 0; i < 18; i++) { ctx.fillStyle = `rgba(255,255,230,${(dusk - 0.5) * 1.6 * (0.5 + 0.5 * Math.sin(t * 2 + i))})`; ctx.beginPath(); ctx.arc(x + ((i * 97) % w), y + 20 + ((i * 53) % (h * 0.35)), 1.6, 0, 7); ctx.fill(); }
    // soarele coboara
    const sunY = y + h * (0.3 + dusk * 0.42);
    const sg = ctx.createRadialGradient(x + w * 0.78, sunY, 10, x + w * 0.78, sunY, 90); sg.addColorStop(0, 'rgba(255,220,120,.9)'); sg.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x + w * 0.78, sunY, 90, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x + w * 0.78, sunY, 30, 0, 7); ctx.fill();
    // nori + pasari
    for (let i = 0; i < 4; i++) { const cx0 = x + (((i * 230 + t * 8) % (w + 200)) - 100), cy0 = y + h * (0.12 + i * 0.07); ctx.fillStyle = `rgba(255,255,255,${0.75 - dusk * 0.35})`; for (const [dx, dy, r] of [[0, 0, 16], [18, -6, 20], [38, 0, 14]]) { ctx.beginPath(); ctx.arc(cx0 + dx, cy0 + dy, r, 0, 7); ctx.fill(); } }
    ctx.strokeStyle = '#3a2a3a'; ctx.lineWidth = 2;
    for (const b of this.birds) { const bx = x + b.x * w, by = y + b.y * h, f = Math.sin(t * 8 + b.ph) * 4 * b.s; ctx.beginPath(); ctx.moveTo(bx - 7 * b.s, by - f); ctx.quadraticCurveTo(bx - 3 * b.s, by - 4 * b.s, bx, by); ctx.quadraticCurveTo(bx + 3 * b.s, by - 4 * b.s, bx + 7 * b.s, by - f); ctx.stroke(); }
    // satul de dedesubt: dealuri, case cu ferestre care se aprind, biserica
    const R = Math.min(w * 0.36, h * 0.38), cx = x + w / 2, cy = y + h * 0.5;
    ctx.fillStyle = mix('#b9e3a6', '#6f8f72', dusk); ctx.beginPath(); ctx.moveTo(x, y + h); for (let i = 0; i <= 12; i++) ctx.lineTo(x + i * w / 12, y + h * 0.8 - Math.sin(i * 0.9) * 14); ctx.lineTo(x + w, y + h); ctx.fill();
    for (let i = 0; i < 9; i++) {
      const hx = x + 14 + i * (w - 28) / 8, hb = y + h * 0.86 + (i % 2) * 8, hw = 26, hh = 20;
      ctx.fillStyle = ['#fff1d6', '#ffe1ea', '#e8f1ff', '#fff6b8'][i % 4]; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.fillRect(hx - hw / 2, hb - hh, hw, hh); ctx.strokeRect(hx - hw / 2, hb - hh, hw, hh);
      ctx.fillStyle = ['#c0573e', '#e5809a', '#5b7fbf', '#8a5d32'][i % 4]; ctx.beginPath(); ctx.moveTo(hx - hw / 2 - 3, hb - hh); ctx.lineTo(hx, hb - hh - 13); ctx.lineTo(hx + hw / 2 + 3, hb - hh); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = dusk > 0.45 && (i + Math.floor(t)) % 5 ? '#ffe680' : '#bfe8ff'; ctx.fillRect(hx - 5, hb - 13, 10, 8);
      if (i === 4) { ctx.fillStyle = '#fff'; ctx.fillRect(hx - 6, hb - hh - 34, 12, 22); ctx.strokeRect(hx - 6, hb - hh - 34, 12, 22); ctx.fillStyle = '#c0573e'; ctx.beginPath(); ctx.moveTo(hx - 8, hb - hh - 34); ctx.lineTo(hx, hb - hh - 48); ctx.lineTo(hx + 8, hb - hh - 34); ctx.fill(); ctx.stroke(); }
    }
    // picioarele rotii
    ctx.strokeStyle = '#d8d0e8'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s2 * R * 0.55, y + h * 0.94); ctx.stroke(); }
    ctx.strokeStyle = O; ctx.lineWidth = 2; for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s2 * R * 0.55, y + h * 0.94); ctx.stroke(); }
    // roata: se invarte (o tura completa pe toata plimbarea), spite cu beculete
    const rot = k * Math.PI * 2, N = 10;
    ctx.strokeStyle = '#ff9ab8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R + 3, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R - 3, 0, 7); ctx.stroke();
    for (let i = 0; i < N; i++) {
      const a = rot + i * Math.PI * 2 / N + Math.PI / 2;
      ctx.strokeStyle = '#ffd6e4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
      for (let j = 1; j <= 3; j++) { const on = (Math.floor(t * 4) + i + j) % 3 !== 0; ctx.fillStyle = on ? '#ffe680' : '#c9a0b0'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * j / 3.4, cy + Math.sin(a) * R * j / 3.4, 2.6, 0, 7); ctx.fill(); }
    }
    ctx.fillStyle = '#ff7aa2'; ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill(); ctx.stroke();
    // cabinele (stau mereu drept); a noastra e cea mare, roz
    const ours = Math.PI / 2 + rot; // porneste de jos
    for (let i = 0; i < N; i++) {
      const a = rot + i * Math.PI * 2 / N + Math.PI / 2; if (i === 0) continue;
      const gx0 = cx + Math.cos(a) * R, gy0 = cy + Math.sin(a) * R;
      ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy0 + 6); ctx.stroke();
      ctx.fillStyle = ['#bfe8ff', '#fff3b0', '#c9f2c7', '#e3c8ff'][i % 4]; ctx.beginPath(); ctx.roundRect(gx0 - 11, gy0 + 6, 22, 16, 5); ctx.fill(); ctx.stroke();
    }
    const sway = Math.sin(t * 1.6) * 0.06 + (this.holding && this.top ? 0 : Math.cos(ours) * 0.05);
    const gx = cx + Math.cos(ours) * R, gy = cy + Math.sin(ours) * R;
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(sway);
    ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 14); ctx.stroke();
    // cabina noastra, mai mare, cu cei care se dau in ea
    const sc = Math.min(0.8, R / 210), CW = 150 * sc / 0.8;
    ctx.fillStyle = '#ff7aa2'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-CW / 2, 14, CW, 14, 7); ctx.fill(); ctx.stroke();
    const me = this.scene.me.actor.spec, pa = this.scene.partner.actor.spec;
    const lean = this.holding && this.top ? Math.min(1, this.kissT / 1.2) : 0;
    const who: [typeof me, number, 1 | -1][] = this.duo ? [[me, -CW * 0.22, 1], [pa, CW * 0.22, -1]] : [[me, 0, 1]];
    for (const [spec, dx, flip] of who) {
      const P = basePose(); P.eyes = lean > 0.6 ? 'closed' : this.top ? 'happy' : 'dot'; P.mouth = lean > 0.4 && this.duo ? 'kiss' : 'open'; P.blush = 1.1 + lean; P.rot = (this.duo ? lean * 0.25 * flip : 0); P.armR = !this.duo && this.top ? 2.4 : 0.4;
      drawCharacter(ctx, spec, P, dx - (this.duo ? lean * 10 * flip : 0), 92 * sc / 0.8, sc, flip, t, (this.scene.w.chars[spec === me ? this.scene.myId : this.scene.partner.id] as any)?.outfit);
    }
    ctx.fillStyle = '#ffb6c9'; ctx.beginPath(); ctx.roundRect(-CW / 2, 52 * sc / 0.8, CW, 46 * sc / 0.8, 12); ctx.fill(); ctx.stroke();
    heartPath(ctx, 0, 76 * sc / 0.8, 9); ctx.fillStyle = '#ff4d6d'; ctx.fill();
    ctx.restore();
    // sus de tot: stea cazatoare cand iti pui dorinta
    if (!this.duo && this.top) { const st = (t * 0.6) % 1; ctx.strokeStyle = `rgba(255,255,220,${1 - st})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w * (0.15 + st * 0.3), y + h * (0.08 + st * 0.12)); ctx.lineTo(x + w * (0.1 + st * 0.3), y + h * (0.06 + st * 0.12)); ctx.stroke(); }
    if (this.kissed && this.top) for (let i = 0; i < 3; i++) { const fa = t * 2 + i * 2.1, fr = 30 + ((t * 40 + i * 30) % 60); ctx.strokeStyle = ['#ff4d6d', '#ffd23f', '#7ab8ff'][i]; ctx.lineWidth = 2.5; for (let r = 0; r < 8; r++) { const aa = r * Math.PI / 4 + fa; ctx.beginPath(); ctx.moveTo(x + w * (0.22 + i * 0.28) + Math.cos(aa) * fr * 0.6, y + h * 0.18 + Math.sin(aa) * fr * 0.6); ctx.lineTo(x + w * (0.22 + i * 0.28) + Math.cos(aa) * fr, y + h * 0.18 + Math.sin(aa) * fr); ctx.stroke(); } }
    ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.textAlign = 'center';
    const msg = this.top ? (this.kissed ? (this.duo ? '💕 Pupic în vârful roții!' : '✨ Dorința e pusă!') : (this.duo ? 'Sunteți sus! Ține apăsat 💕' : 'Ești sus! Ține apăsat ✨')) : k < 0.4 ? 'Urcăm…' : 'Coborâm…';
    ctx.strokeText(msg, cx, y + 58); ctx.fillText(msg, cx, y + 58);
  }
}
/** amesteca doua culori #rrggbb (k = 0..1) */
function mix(a: string, b: string, k: number) { const p = (c: string, i: number) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16); const r = [0, 1, 2].map(i => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k)); return `rgb(${r[0]},${r[1]},${r[2]})`; }
