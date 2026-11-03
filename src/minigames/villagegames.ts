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

/** Roata mare: plimbare romantica la apus, pupic in varf */
export class FerrisGame extends Panel {
  k = 0; kissed = false; holding = false; kissT = 0;
  constructor(s: WorldScene, d: (n: number) => void) { super(s, d, '🎡 Roata mare', 'Când ajungeți sus, ține apăsat pentru un pupic 💋'); }
  tick(dt: number) {
    this.k = Math.min(1, this.k + dt / 12);
    const top = this.k > 0.38 && this.k < 0.62;
    if (top && this.holding && !this.kissed) { this.kissT += dt; if (this.kissT > 1.2) { this.kissed = true; Sfx.play('kiss'); this.fx.hearts(this.box.x + this.box.w / 2, this.box.y + this.box.h * 0.35, 14); } }
    if (this.k >= 1) {
      const s = this.scene; const love = this.kissed ? 35 : 20;
      s.op({ k: 'need', who: s.myId, need: 'love', delta: love }); s.op({ k: 'need', who: s.myId, need: 'fun', delta: 15 });
      if (s.sameArea()) s.op({ k: 'need', who: s.partner.id, need: 'love', delta: love });
      s.op({ k: 'stat', key: 'ferris', delta: 1 });
      s.log(this.kissed ? 'Un pupic în vârful roții mari 🎡💋' : 'O tură cu roata mare 🎡');
      this.finish(this.kissed ? 2 : 1, this.kissed ? 'Cel mai frumos pupic 💋🌅' : 'Ce priveliște! 🌅');
    }
  }
  pointer(t: string) { this.holding = t === 'down' ? true : t === 'up' ? false : this.holding; }
  key(k: string, d: boolean) { if (k === ' ' || k === 'e') this.holding = d; }
  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const sky = ctx.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#ffb3a7'); sky.addColorStop(0.5, '#ffd6a5'); sky.addColorStop(1, '#fff1d6'); ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x + w * 0.75, y + h * 0.62, 40, 0, 7); ctx.fill();
    // satul de jos, se vede tot mai mic cand urcati
    const alt = Math.sin(this.k * Math.PI); // 0 jos, 1 sus
    const hy = y + h * (0.7 + alt * 0.18);
    ctx.fillStyle = '#9fd68c'; ctx.fillRect(x, hy, w, h);
    for (let i = 0; i < 8; i++) { const hx = x + 20 + i * (w - 40) / 7, s = 1 - alt * 0.5; ctx.fillStyle = ['#fff1d6', '#ffe1ea', '#e8f1ff', '#fff6b8'][i % 4]; ctx.fillRect(hx - 12 * s, hy - 16 * s, 24 * s, 16 * s); ctx.fillStyle = ['#c0573e', '#e5809a', '#5b7fbf', '#7cb870'][i % 4]; ctx.beginPath(); ctx.moveTo(hx - 15 * s, hy - 16 * s); ctx.lineTo(hx, hy - 28 * s); ctx.lineTo(hx + 15 * s, hy - 16 * s); ctx.fill(); }
    // cabina cu cei doi
    const cx = x + w / 2, cy = y + h * 0.42 + Math.sin(this.t * 1.2) * 3;
    ctx.strokeStyle = '#ff9ab8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, cy - 70); ctx.stroke();
    ctx.fillStyle = '#ff7aa2'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(cx - 120, cy - 70, 240, 24, 12); ctx.fill(); ctx.stroke();
    const me = this.scene.me.actor.spec, pa = this.scene.partner.actor.spec;
    const lean = this.holding && this.k > 0.38 && this.k < 0.62 ? Math.min(1, this.kissT / 1.2) : 0;
    for (const [spec, dx, flip] of [[me, -36, 1], [pa, 36, -1]] as const) {
      const P = basePose(); P.headOnly = false; P.eyes = lean > 0.6 ? 'closed' : 'happy'; P.mouth = lean > 0.4 ? 'kiss' : 'open'; P.blush = 1.2 + lean; P.rot = lean * 0.25 * (flip as number);
      drawCharacter(ctx, spec, P, cx + dx - lean * 14 * (flip as number), cy + 40, 1.3, flip as 1 | -1, this.t);
    }
    ctx.fillStyle = '#ffb6c9'; ctx.strokeStyle = O; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(cx - 120, cy + 10, 240, 70, 16); ctx.fill(); ctx.stroke();
    heartPath(ctx, cx, cy + 46, 12); ctx.fillStyle = '#ff4d6d'; ctx.fill();
    ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.fillStyle = O; ctx.textAlign = 'center';
    ctx.fillText(this.k > 0.38 && this.k < 0.62 ? (this.kissed ? '💋 Pupic în vârf!' : '⬆️ Sunteți sus! Ține apăsat 💋') : this.k < 0.38 ? 'Urcăm…' : 'Coborâm…', cx, y + 56);
  }
}
