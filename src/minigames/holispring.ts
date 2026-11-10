// Sarbatorile de primavara (si Dragobetele) (1.11.0): ouale de Paste, martisorul, Dragobetele, nunta Inei.
import { Show, type Phase, O, clamp, ease, lerp, ell, rrect, icon, say, seeded, heartPath } from './holishow';
import { sweep } from './base';
import { Sfx } from '../engine/sfx';
import { Actor } from '../char/actor';
import { NPC_SPECS, type CharId } from '../char/draw';
import { CHARMS } from '../char/outfit';
import * as Hol from '../scenes/holidays';

/** curtea voastra (fundal comun) */
function yardBg(sh: Show, c: CanvasRenderingContext2D, W: number, H: number, sky = '#8fd3ff') {
  sh.sky(c, W, H * 0.45, sky, '#fff1d6'); ell(c, W * 0.88, H * 0.1, 22, 22, '#ffd23f', false);
  rrect(c, -10, H * 0.08, W * 0.3, H * 0.4, 0, '#fff1d6'); c.fillStyle = '#c0573e'; c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(-20, H * 0.1); c.lineTo(W * 0.13, -10); c.lineTo(W * 0.31, H * 0.1); c.closePath(); c.fill(); c.stroke();
  sh.ground(c, W, H, H * 0.45, '#a6dc93');
  for (let i = 0; i < 9; i++) { const x = (i * 113) % W, y = H * 0.5 + (i * 37) % (H * 0.15); for (let k = 0; k < 5; k++) { c.fillStyle = ['#ff9ab8', '#fff', '#ffd23f'][i % 3]; c.beginPath(); c.arc(x + Math.cos(k * 1.256) * 4, y + Math.sin(k * 1.256) * 4, 3, 0, 7); c.fill(); } }
}

// ====================================================================== 1. Pastele: vopsim ouale si le ciocnim
const PAINTS = [{ c: '#e63946', icon: '🔴', label: 'Roșu' }, { c: '#4cc9f0', icon: '🔵', label: 'Albastru' }, { c: '#ffd23f', icon: '🟡', label: 'Galben' }, { c: '#7cc576', icon: '🟢', label: 'Verde' }, { c: '#c77dff', icon: '🟣', label: 'Mov' }];
type Egg = { c: string; pat: number; crack: number; raw?: boolean };
export class PasteShow extends Show {
  mine: Egg[] = [0, 1, 2].map(() => ({ c: '#fffaf0', pat: 0, crack: 0 })); theirs: Egg[] = [0, 1, 2].map(() => ({ c: '#fffaf0', pat: 0, crack: 0 }));
  tool = 0; btns: { x: number; y: number; w: number; h: number }[] = []; eggR: { x: number; y: number; w: number; h: number }[] = []; aiT = 1.5; splat = 0;
  my = 0; their = 0; round = 0; myPow = -1; paPow = -1; res: ('me' | 'pa')[] = []; resT = 0; rawRound = -1; wins = { me: 0, pa: 0 }; needleT = 0;
  constructor(scene: any, done: (s: number) => void) { super(scene, done); const r = seeded(scene.w.day * 13 + 7); this.rawRound = r() < 0.5 ? Math.floor(r() * 2) : -1; }
  egg(c: CanvasRenderingContext2D, x: number, y: number, r: number, e: Egg, rot = 0) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.ellipse(0, 0, r * 0.78, r, 0, 0, 7); c.fillStyle = e.c; c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke();
    c.save(); c.clip(); if (e.pat === 1) { c.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(((i * 37) % 20) - 10, ((i * 23) % 30) - 15, 2.4, 0, 7); c.fill(); } } if (e.pat === 2) { c.strokeStyle = '#fff'; c.lineWidth = 3; for (const yy of [-r * 0.4, 0, r * 0.4]) { c.beginPath(); c.moveTo(-r, yy); for (let k = -r; k < r; k += 6) c.lineTo(k, yy + ((k / 6) % 2 ? 4 : -4)); c.stroke(); } } c.restore();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.4, r * 0.15, r * 0.25, -0.4, 0, 7); c.fill();
    if (e.crack) { c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); const yy = e.crack === 1 ? -r * 0.75 : r * 0.75; c.moveTo(-r * 0.4, yy); c.lineTo(-r * 0.15, yy + 6 * Math.sign(-yy)); c.lineTo(0, yy); c.lineTo(r * 0.2, yy + 7 * Math.sign(-yy)); c.lineTo(r * 0.4, yy); c.stroke(); }
    c.restore();
  }
  table(c: CanvasRenderingContext2D, W: number, H: number) { yardBg(this, c, W, H); rrect(c, W * 0.15, H * 0.6, W * 0.7, 18, 6, '#fff'); for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#e63946' : '#fff'; c.fillRect(W * 0.15 + i * W * 0.07, H * 0.6 + 12, W * 0.07, 6); } icon(c, '🍞', W * 0.5, H * 0.56, 40); }
  couple(c: CanvasRenderingContext2D, W: number, H: number) { const s = this.sz() * 0.62; this.put(this.me, W * 0.12, H * 0.86, s, 1); this.put(this.pa, W * 0.88, H * 0.86, s, -1); this.me.draw(c); this.pa.draw(c); if (this.splat && this.t - this.splat < 4) { c.fillStyle = 'rgba(124,197,118,0.85)'; c.beginPath(); c.ellipse(this.pa.x, this.pa.y - 72 * s, 16, 10, 0, 0, 7); c.fill(); } }
  build(): Phase[] {
    const done3 = (a: Egg[]) => a.every(e => e.c !== '#fffaf0');
    const knock = (r: number): Phase => ({ id: 'knock' + r, cap: r === 0 ? '🥚 „Hristos a înviat!” — „Adevărat a înviat!” Vârf cu vârf!' : '🥚 Acum dos cu dos!', hint: 'Atinge când acul e cât mai sus (forța)!', max: 14,
      enter: () => { this.round = r; this.myPow = -1; this.paPow = -1; this.resT = 0; this.needleT = this.t; },
      tap: (type) => { if (type === 'down' && this.myPow < 0) { this.myPow = 1 - Math.abs(sweep(this.t - this.needleT, 0.9)); this.send({ pow: this.myPow, r }); Sfx.play('click'); } },
      play: () => {
        if (this.paPow < 0 && this.aiPlays && this.pt > 1.6) this.paPow = 0.45 + Math.random() * 0.45;
        if (this.myPow >= 0 && this.paPow >= 0 && !this.resT) { this.resT = this.t; const w = this.myPow >= this.paPow ? 'me' : 'pa'; this.res[r] = w; this.wins[w]++; const loser = w === 'me' ? this.theirs : this.mine; loser[0].crack = r + 1; Sfx.play('crack'); if (this.rawRound === r) { loser[0].raw = true; Sfx.play('squelch'); (w === 'me' ? this.pa : this.me).play('slapped'); } else (w === 'me' ? this.pa : this.me).play('cry'); (w === 'me' ? this.me : this.pa).play('flex'); }
        return !!this.resT && this.t - this.resT > 2.6;
      },
      draw: (c, W, H) => { this.table(c, W, H); this.couple(c, W, H);
        const hit = this.resT ? clamp((this.t - this.resT) * 4) : 0, gap = 70 * (1 - hit);
        this.egg(c, W / 2 - 34 - gap, H * 0.45, 30, this.mine[0], r === 0 ? Math.PI / 2 : -Math.PI / 2); this.egg(c, W / 2 + 34 + gap, H * 0.45, 30, this.theirs[0], r === 0 ? -Math.PI / 2 : Math.PI / 2);
        if (!this.resT) { const k = 1 - Math.abs(sweep(this.t - this.needleT, 0.9)), x = W * 0.1, y = H * 0.18; rrect(c, x, y, 26, 120, 10, '#fff'); rrect(c, x, y + 120 * (1 - (this.myPow >= 0 ? this.myPow : k)), 26, 120 * (this.myPow >= 0 ? this.myPow : k), 10, this.myPow >= 0 ? '#7cc576' : '#ff7aa2', false); say(c, '💪', x + 13, y - 14, 18); }
        if (this.resT) { const w = this.res[r]; const raw = this.rawRound === r; say(c, raw ? 'PLEOSC! Ăsta era CRUD! 🍳😂' : w === 'me' ? 'Oul tău a rezistat! 💪' : `Oul lui ${this.paName} e mai tare! 😮`, W / 2, H * 0.22, 20, raw ? '#e8a33a' : '#7a3a5a');
          if (raw) { const v = w === 'me' ? this.pa : this.me; c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(v.x, v.y - 70 * this.sz() * 0.62, 18, 13, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(v.x + 10, v.y - 60 * this.sz() * 0.62, 22, 9, 0.3, 0, 7); c.fill(); } } } });
    return [
      { id: 'hi', cap: '🐣 Paște fericit! Vecinii v-au adus cozonac și ouă', dur: 3, enter: () => { Sfx.play('bells'); this.me.play('dance_hop'); this.pa.play('love'); }, draw: (c, W, H) => { this.table(c, W, H); this.couple(c, W, H); this.mine.forEach((e, i) => this.egg(c, W * (0.32 + i * 0.07), H * 0.52, 20, e)); this.theirs.forEach((e, i) => this.egg(c, W * (0.54 + i * 0.07), H * 0.52, 20, e)); } },
      { id: 'paint', cap: '🎨 Vopsiți ouăle! Fiecare are trei', hint: 'Alege culoarea, atinge oul (a doua oară: model)', max: 50,
        tap: (type, x, y) => { if (type !== 'down') return; const i = this.btns.findIndex(r => this.hit(r, x, y)); if (i >= 0) { this.tool = i; Sfx.play('pop'); return; }
          const e = this.eggR.findIndex(r => this.hit(r, x, y)); if (e < 0) return; const eg = this.mine[e];
          if (eg.c === '#fffaf0' || eg.c !== PAINTS[this.tool].c) { eg.c = PAINTS[this.tool].c; Sfx.play('splash', { vol: 0.5, rate: 1.4 }); this.burst(x, y, 14, [eg.c], 120, 200, 0.8); if (e === 2 && !this.splat && this.tool === 3) { this.splat = this.t; this.pa.play('sneeze'); this.fx.text(this.W * 0.82, this.H * 0.45, `${this.paName} are acum mustață verde 😂`, '#2f7d4f', 0.9); } }
          else { eg.pat = (eg.pat + 1) % 3; Sfx.play('click'); }
          this.send({ paint: { i: e, c: eg.c, pat: eg.pat } }); },
        play: dt => { if (this.aiPlays) { this.aiT -= dt; if (this.aiT <= 0) { this.aiT = 1.4; const i = this.theirs.findIndex(e => e.c === '#fffaf0'); if (i >= 0) { this.theirs[i].c = PAINTS[(i + 2) % 5].c; this.theirs[i].pat = (i % 2) + 1; this.pa.play('act_collect'); } } } return done3(this.mine) && done3(this.theirs) && this.pt > 3; },
        draw: (c, W, H) => { this.table(c, W, H); this.couple(c, W, H); this.eggR = []; this.mine.forEach((e, i) => { const x = W * (0.24 + i * 0.1), y = H * 0.48; this.egg(c, x, y, 26, e); this.eggR.push({ x: x - 26, y: y - 32, w: 52, h: 64 }); }); this.theirs.forEach((e, i) => this.egg(c, W * (0.58 + i * 0.08), H * 0.5, 20, e));
          this.btns = this.buttons(c, PAINTS.map((p2, i) => ({ icon: p2.icon, label: p2.label, on: i === this.tool })), 44, 100); } },
      knock(0), knock(1),
      { id: 'win', cap: '', dur: 3.6, enter: () => { Sfx.play('applause'); this.boom(40); const w = this.wins.me >= this.wins.pa ? this.me : this.pa; w.play('dance_hop'); (w === this.me ? this.pa : this.me).play('laugh'); },
        draw: (c, W, H) => { this.table(c, W, H); this.couple(c, W, H); this.phases[this.pi].cap = this.wins.me > this.wins.pa ? `🏆 ${this.myName} are cel mai tare ou! Noroc tot anul 🍀` : this.wins.pa > this.wins.me ? `🏆 ${this.paName} are cel mai tare ou! Noroc tot anul 🍀` : '🤝 Egalitate! Ouă la fel de tari, ca voi doi 💕'; } },
      { id: 'eat', cap: '😋 Și acum… cozonac cu ouă! Mmm', dur: 3, enter: () => { this.me.play('act_eat'); this.pa.play('act_eat'); Sfx.play('crunch'); }, draw: (c, W, H) => { this.table(c, W, H); this.couple(c, W, H); } },
    ];
  }
  onNet(d: any) { if (d.paint) { const e = this.theirs[d.paint.i]; if (e) { e.c = d.paint.c; e.pat = d.paint.pat; } } if (d.pow != null && d.r === this.round && this.paPow < 0) this.paPow = d.pow; }
  endText() { return 'Hristos a înviat! 🐣'; }
  reward() { const s = this.scene; if (this.quit && this.pi < 2) return; if (Hol.once(s, Hol.yearKey(s, 'paste'))) { s.op({ k: 'hearts', delta: 10 }); s.op({ k: 'stat', key: 'easterEggs', delta: 3 }); s.log('Ați vopsit și ați ciocnit ouă de Paște 🥚🐣'); s.syncPlaced(); } Hol.memory(s, 'paste'); Hol.feelBoth(s, { fun: 25, love: 15, hunger: 15 }); }
}

// ====================================================================== 2. Martisorul (il faci tu pentru partener)
export class MartisorShow extends Show {
  charm = -1; twists = 0; tangled = false; bow = false; btns: { x: number; y: number; w: number; h: number }[] = [];
  build(): Phase[] {
    const rope = (c: CanvasRenderingContext2D, W: number, H: number) => { const x0 = W * 0.3, x1 = W * 0.7, y = H * 0.42, n = Math.max(2, this.twists); for (const [col, off] of [['#fff', 0], ['#e63946', Math.PI]] as const) { c.strokeStyle = O; c.lineWidth = 7; c.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60, x = lerp(x0, x1, u), yy = y + Math.sin(u * n * Math.PI + off) * (this.tangled ? 14 + Math.sin(this.t * 9) * 6 : 8); i ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); c.strokeStyle = col; c.lineWidth = 4.5; c.stroke(); } };
    const bg = (c: CanvasRenderingContext2D, W: number, H: number) => { yardBg(this, c, W, H); rrect(c, W * 0.2, H * 0.3, W * 0.6, H * 0.34, 14, '#fffaf5'); };
    return [
      { id: 'pick', cap: `🎀 Un mărțișor pentru ${this.paName}! Alege talismanul`, hint: 'Alege', max: 30,
        tap: (type, x, y) => { if (type !== 'down') return; const i = this.btns.findIndex(r => this.hit(r, x, y)); if (i >= 0) { this.charm = i; Sfx.play('chimes', { vol: 0.5 }); } },
        play: () => this.charm >= 0,
        draw: (c, W, H) => { bg(c, W, H); this.btns = this.buttons(c, CHARMS.map(ch => ({ icon: ch.icon, label: ch.label })), H * 0.34, 120); say(c, 'Fiecare talisman are un rost 🍀❤️', W / 2, H * 0.62, 14, '#7a5a4a'); } },
      { id: 'twist', cap: '', hint: 'Atinge ca să răsucești șnurul alb-roșu', max: 30,
        tap: (type) => { if (type !== 'down') return; this.twists++; Sfx.play('cloth', { vol: 0.5, rate: 1.4 }); if (this.twists === 8 && !this.tangled) { this.tangled = true; Sfx.play('boing'); } if (this.tangled && this.twists >= 12) this.tangled = false; },
        play: () => this.twists >= 18,
        draw: (c, W, H) => { bg(c, W, H); rope(c, W, H); this.phases[this.pi].cap = this.tangled ? '🙈 S-a încurcat șnurul! Mai răsucește, repede!' : `🧵 Împletește șnurul alb-roșu (${Math.min(18, this.twists)}/18)`; } },
      { id: 'bow', cap: '🎀 Fă fundița și prinde talismanul', hint: 'Atinge', max: 15,
        tap: (type) => { if (type === 'down' && !this.bow) { this.bow = true; Sfx.play('good'); this.burst(this.W / 2, this.H * 0.45, 20, ['#e63946', '#fff', '#ffd23f'], 140, 100, 1); } },
        play: () => this.bow && this.pt > 1.4,
        draw: (c, W, H) => { bg(c, W, H); rope(c, W, H); if (this.bow) { for (const s of [-1, 1]) { c.beginPath(); c.ellipse(W / 2 + s * 18, H * 0.42, 18, 10, s * 0.4, 0, 7); c.fillStyle = s < 0 ? '#e63946' : '#fff'; c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke(); } icon(c, CHARMS[this.charm].icon, W / 2, H * 0.55, 44); } } },
      { id: 'give', cap: '', dur: 4.4, enter: () => { this.me.play('love'); setTimeout(() => { this.pa.outfit = { ...(this.pa.outfit ?? { head: 'none', face: 'none', neck: 'none' }), pin: CHARMS[this.charm].id }; this.pa.play('shy'); Sfx.play('kiss'); this.fx.hearts(this.W / 2, this.H * 0.6, 16); }, 1200); },
        draw: (c, W, H) => { yardBg(this, c, W, H); const s = this.sz() * 0.7; this.put(this.me, W * 0.42, H * 0.86, s, 1); this.put(this.pa, W * 0.58, H * 0.86, s, -1); this.me.draw(c); this.pa.draw(c); icon(c, CHARMS[this.charm].icon, W / 2, H * 0.5 - Math.sin(this.t * 3) * 5, 36); this.phases[this.pi].cap = `🎀 Un mărțișor cu ${CHARMS[this.charm].label.toLowerCase()}: ${CHARMS[this.charm].text}! ${this.paName} îl poartă toată primăvara`; } },
    ];
  }
  endText() { return 'Primăvară frumoasă! 🌸'; }
  reward() {
    const s = this.scene, y = Hol.yearOf(s.w.day), pid = s.partner.id; if (this.charm < 0 || (this.quit && !this.bow)) return;
    s.op({ k: 'stat', key: `mart-${s.myId}-${y}`, delta: 1 });
    s.op({ k: 'stat', key: 'mpin-' + pid, delta: this.charm + 1 - (s.w.stats['mpin-' + pid] ?? 0) }); s.op({ k: 'stat', key: 'mday-' + pid, delta: s.w.day - (s.w.stats['mday-' + pid] ?? 0) });
    s.op({ k: 'need', who: pid, need: 'love', delta: 30 }); s.op({ k: 'need', who: s.myId, need: 'love', delta: 15 }); s.op({ k: 'hearts', delta: 8 });
    s.log(`${s.me.actor.spec.name} i-a făcut lui ${s.partner.actor.spec.name} un mărțișor ${CHARMS[this.charm].icon}`); Hol.memory(s, 'martisor'); s.syncPlaced();
  }
}

// ====================================================================== 3. Dragobetele: ghioceii si fuga dupa pupic
export class DragobeteShow extends Show {
  run = { x: 0.85, vx: 0 }; chase = { x: 0.12 }; caught = false; caughtT = 0; tapX = -1;
  build(): Phase[] {
    const meadow = (c: CanvasRenderingContext2D, W: number, H: number) => { this.sky(c, W, H * 0.5, '#bde7ff', '#fff6f0'); this.ground(c, W, H, H * 0.5, '#eef3f8'); for (let i = 0; i < 14; i++) { const x = (i * 71) % W, y = H * 0.55 + (i * 29) % (H * 0.35); c.strokeStyle = '#4caf50'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2, y - 10); c.stroke(); ell(c, x + 3, y - 10, 2.5, 4, '#fff', true, 1); } c.fillStyle = '#7cc576'; for (let i = 0; i < 6; i++) c.fillRect((i * 160) % W, H * 0.5 + (i % 2) * 8, 60, 4); };
    // Dudu alearga dupa Bubu (traditia: „Dragobetele saruta fetele”)
    const chaser = this.dudu, runner = this.bubu;
    return [
      { id: 'give', cap: `🤍 Ghiocei! Primii din an, culeși din pădure pentru ${this.paName}`, dur: 3.6, enter: () => { this.me.play('love'); setTimeout(() => { this.pa.play('shy'); Sfx.play('chimes'); }, 900); },
        draw: (c, W, H) => { meadow(c, W, H); const s = this.sz() * 0.7; this.put(this.me, W * 0.42, H * 0.86, s, 1); this.put(this.pa, W * 0.58, H * 0.86, s, -1); this.me.draw(c); this.pa.draw(c); for (let i = 0; i < 3; i++) { c.strokeStyle = '#4caf50'; c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2, H * 0.62); c.lineTo(W / 2 - 8 + i * 8, H * 0.5); c.stroke(); ell(c, W / 2 - 8 + i * 8, H * 0.48, 4, 6, '#fff', true, 1.2); } } },
      { id: 'chase', cap: '💞 „Dragobetele sărută fetele!” Dudu fuge după Bubu', hint: this.scene.myId === 'dudu' ? 'Atinge unde să alergi: prinde-o!' : 'Atinge stânga / dreapta ca să fugi (nu prea tare 😉)', max: 14,
        tap: (type, x) => { if (type === 'down') this.tapX = x / this.W; },
        play: dt => {
          const iChase = this.scene.myId === 'dudu';
          // fugarul (Bubu)
          if (!iChase && this.tapX >= 0) { this.run.vx = this.tapX < this.run.x ? -0.5 : 0.5; this.tapX = -1; }
          if (iChase || this.pt > 8) { if (Math.random() < dt * 1.5) this.run.vx = (Math.random() < 0.5 ? -1 : 1) * 0.35; }
          if (this.pt > 9) this.run.vx *= 0.9; // obosește… (se lasă prinsă)
          this.run.x = clamp(this.run.x + this.run.vx * dt, 0.08, 0.92); if (this.run.x <= 0.08 || this.run.x >= 0.92) this.run.vx *= -1;
          // urmaritorul (Dudu)
          const target = iChase && this.tapX >= 0 ? this.tapX : this.run.x; const sp = iChase ? 0.55 : 0.16 + this.pt * 0.025;
          this.chase.x += clamp(target - this.chase.x, -sp * dt, sp * dt);
          runner.running = chaser.running = true; runner.moving = chaser.moving = true; runner.flip = this.run.vx >= 0 ? 1 : -1; chaser.flip = target >= this.chase.x ? 1 : -1;
          if (!this.caught && Math.abs(this.chase.x - this.run.x) < 0.05 && (iChase || this.pt > 4)) { this.caught = true; this.caughtT = this.t; this.send({ caught: 1 }); }
          return this.caught;
        },
        draw: (c, W, H) => { meadow(c, W, H); const s = this.sz() * 0.62; this.put(runner, W * this.run.x, H * 0.84, s, runner.flip); this.put(chaser, W * this.chase.x, H * 0.86, s, chaser.flip); runner.draw(c); chaser.draw(c); if (this.pt > 9 && this.pt < 12) this.bub(c, 'Bubu: „Gata, gata, m-ai prins!” 😉', W * this.run.x, H * 0.5, 13); } },
      { id: 'kiss', cap: '💋 Pupic de Dragobete! Așa vă iubiți tot anul 💞', dur: 4, enter: () => { runner.moving = chaser.moving = runner.running = chaser.running = false; runner.play('kiss'); chaser.play('kiss'); Sfx.play('kiss'); this.boom(40); for (let i = 0; i < 3; i++) setTimeout(() => this.shape(this.W * (0.3 + i * 0.2), this.H * 0.3, 'heart', ['#ff4d6d', '#ff9ab8', '#fff']), i * 300); },
        draw: (c, W, H) => { meadow(c, W, H); const s = this.sz() * 0.72; this.put(this.bubu, W * 0.46, H * 0.86, s, 1); this.put(this.dudu, W * 0.54, H * 0.86, s, -1); this.bubu.draw(c); this.dudu.draw(c); } },
    ];
  }
  onNet(d: any) { if (d.caught && !this.caught) { this.caught = true; this.caughtT = this.t; } }
  endText() { return 'Dragobete fericit! 💞'; }
  reward() { const s = this.scene; if (this.quit && !this.caught) return; if (Hol.once(s, Hol.yearKey(s, 'drago'))) { s.op({ k: 'res', res: 'ghiocel', delta: -Math.min(3, s.w.res?.ghiocel ?? 0) }); s.op({ k: 'hearts', delta: 12 }); s.log('Dragobete: ghiocei și un pupic 💞'); s.syncPlaced(); } Hol.memory(s, 'dragobete'); Hol.feelBoth(s, { love: 35, fun: 15 }); }
}

// ====================================================================== 4. Nunta Inei (si a lui Rex!)
export class InaWedShow extends Show {
  ina: Actor; rex: Actor; gogu: Actor; ring = { x: 0, y: 0, vx: 0, vy: 0, on: false, by: '' }; bq = { x: 0, y: 0, vx: 0, vy: 0, t: 0, by: '' }; myX = 0.35; paX = 0.65; tapX = -1;
  horaA = 0; horaSp = 0.6; beatT = 0; beats = 0; good = 0;
  constructor(scene: any, done: (s: number) => void) {
    super(scene, done);
    this.guests = this.villagers('wedding').filter(a => !['ina', 'rex', 'gogu'].includes((a as any).vid));
    this.ina = new Actor('bubu', this.fx, NPC_SPECS.bunny); this.ina.outfit = { head: 'voal', face: 'none', neck: 'none', body: 'mireasa' };
    this.rex = new Actor('bubu', this.fx, NPC_SPECS.dog); this.rex.outfit = { head: 'none', face: 'none', neck: 'bowtie', body: 'mire' };
    this.gogu = new Actor('bubu', this.fx, NPC_SPECS.pig); this.gogu.outfit = { head: 'joben', face: 'ochelari', neck: 'bowtie', body: 'costum' };
  }
  church(c: CanvasRenderingContext2D, W: number, H: number) {
    this.sky(c, W, H * 0.55, '#8fd3ff', '#fff1d6'); this.ground(c, W, H, H * 0.55, '#a6dc93');
    const x = W / 2, y = H * 0.55; rrect(c, x - 90, y - 120, 180, 120, 4, '#fff8ef'); c.fillStyle = '#8a4a3a'; c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 104, y - 118); c.lineTo(x, y - 170); c.lineTo(x + 104, y - 118); c.closePath(); c.fill(); c.stroke();
    rrect(c, x - 22, y - 50, 44, 50, 4, '#8a5d32'); c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y - 170); c.lineTo(x, y - 196); c.moveTo(x - 9, y - 186); c.lineTo(x + 9, y - 186); c.stroke();
    // arcada cu flori
    c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); c.arc(x, y + 30, 120, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); for (let i = 0; i < 14; i++) { const a = Math.PI * (1.08 + i * 0.06); ell(c, x + Math.cos(a) * 120, y + 30 + Math.sin(a) * 120, 6, 6, ['#ff9ab8', '#fff', '#ffd6e0'][i % 3], true, 1); }
  }
  cast(c: CanvasRenderingContext2D, W: number, H: number, couple = true) {
    const s = this.sz() * 0.6; this.put(this.ina, W * 0.44, H * 0.8, s, 1); this.put(this.rex, W * 0.56, H * 0.8, s, -1); this.put(this.gogu, W * 0.5, H * 0.66, s * 0.9, 1); this.gogu.draw(c); this.ina.draw(c); this.rex.draw(c);
    this.guests.forEach((g, i) => { this.put(g, W * (i < 2 ? 0.08 + i * 0.1 : 0.82 + (i - 2) * 0.1), H * 0.86, s, i < 2 ? 1 : -1); g.draw(c); });
    if (couple) { this.put(this.bubu, W * 0.28, H * 0.88, s, 1); this.put(this.dudu, W * 0.72, H * 0.88, s, -1); this.bubu.draw(c); this.dudu.draw(c); }
  }
  build(): Phase[] {
    const married = (this.scene.w.stats.married ?? 0) > 0;
    return [
      { id: 'in', cap: '💒 Nunta Inei! Și mirele e… Rex?! 🐶💕', dur: 3.6, enter: () => { Sfx.play('bells'); this.ina.play('shy'); this.rex.play('dance_hop'); for (const g of this.guests) g.play('love'); this.bubu.play('dance_hop'); }, draw: (c, W, H) => { this.church(c, W, H); this.cast(c, W, H); } },
      { id: 'vows', cap: 'Nea Gogu (oficiant de ocazie): „Rex, o iei pe Ina de soție?” — „HAM!” 🐶', dur: 3.6, enter: () => { this.gogu.play('wave'); setTimeout(() => { this.rex.play('dance_hop'); Sfx.play('dog'); }, 1600); }, draw: (c, W, H) => { this.church(c, W, H); this.cast(c, W, H); } },
      { id: 'ring', cap: '💍 Verighetele! …Rex a scăpat inelul! Prinde-l!', hint: 'Atinge inelul!', max: 10,
        enter: () => { this.ring = { x: this.W * 0.56, y: this.H * 0.6, vx: 260, vy: -320, on: true, by: '' }; Sfx.play('gasp'); this.rex.play('cry'); },
        tap: (type, x, y) => { if (type === 'down' && this.ring.on && Math.hypot(x - this.ring.x, y - this.ring.y) < 40) this.catchRing('me'); },
        play: dt => { const r = this.ring; if (r.on) { r.vy += 700 * dt; r.x += r.vx * dt; r.y += r.vy * dt; if (r.y > this.H * 0.82) { r.y = this.H * 0.82; r.vy *= -0.82; Sfx.play('ding'); } if (r.x < 20 || r.x > this.W - 20) r.vx *= -1; if (this.aiPlays && this.pt > 4.5) this.catchRing('pa'); if (this.pt > 8.5) this.catchRing('miti'); } return !r.on && this.pt > 1.5; },
        draw: (c, W, H) => { this.church(c, W, H); this.cast(c, W, H); const r = this.ring; if (r.on) { c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.beginPath(); c.arc(r.x, r.y, 9, 0, 7); c.stroke(); c.strokeStyle = O; c.lineWidth = 1; c.stroke(); this.sparks.push({ x: r.x, y: r.y, vx: 0, vy: 0, c: '#fff4b0', life: 0.3, max: 0.3, r: 2, grav: 0 }); } else say(c, r.by === 'me' ? `${this.myName} a prins inelul! Eroul nunții 💍` : r.by === 'pa' ? `${this.paName} a prins inelul! 💍` : 'Miți l-a prins cu coada! 🐱💍', W / 2, H * 0.28, 18, '#7a3a5a'); } },
      { id: 'kiss', cap: '„Puteți săruta mireasa!” …Rex o linge pe nas 😂💕', dur: 3.6, enter: () => { this.rex.play('kiss'); this.ina.play('laugh'); Sfx.play('kiss'); Sfx.play('applause', { delay: 0.5 }); this.boom(60); this.fx.hearts(this.W / 2, this.H * 0.6, 14); }, draw: (c, W, H) => { this.church(c, W, H); this.cast(c, W, H); } },
      { id: 'bouquet', cap: '💐 Ina aruncă buchetul! Fugi sub el!', hint: 'Atinge unde să fugi', max: 8,
        enter: () => { this.bq = { x: this.W * 0.44, y: this.H * 0.6, vx: (this.scene.w.day % 2 ? 1 : -1) * (80 + (this.scene.w.day % 5) * 25), vy: -420, t: 0, by: '' }; this.myX = 0.35; this.paX = 0.65; this.ina.play('wave'); Sfx.play('whoosh'); },
        tap: (type, x) => { if (type === 'down') this.tapX = x / this.W; },
        play: dt => { const b = this.bq; if (!b.by) { b.vy += 380 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt; if (this.tapX >= 0) this.myX += clamp(this.tapX - this.myX, -0.6 * dt, 0.6 * dt); if (this.aiPlays) this.paX += clamp(b.x / this.W - this.paX, -0.4 * dt, 0.4 * dt);
            if (b.y > this.H * 0.72) { const dm = Math.abs(b.x / this.W - this.myX), dp = Math.abs(b.x / this.W - this.paX); b.by = dm < 0.07 ? 'me' : dp < 0.07 ? 'pa' : 'rita'; this.send({ bq: b.by === 'me' ? 'pa' : b.by === 'pa' ? 'me' : 'rita' }); Sfx.play(b.by === 'rita' ? 'giggle' : 'good'); (b.by === 'me' ? this.me : b.by === 'pa' ? this.pa : this.guests[0]).play('dance_hop'); } }
          return !!this.bq.by && this.pt > 1.8; },
        draw: (c, W, H) => { this.church(c, W, H); const s = this.sz() * 0.6; this.put(this.ina, W * 0.44, H * 0.8, s, -1); this.ina.draw(c); this.put(this.me, W * this.myX, H * 0.88, s, 1); this.put(this.pa, W * this.paX, H * 0.88, s, -1); this.me.draw(c); this.pa.draw(c);
          const b = this.bq; if (!b.by) icon(c, '💐', b.x, b.y, 34); else say(c, b.by === 'rita' ? 'Rita a prins buchetul! 🦊💐' : married ? `${b.by === 'me' ? this.myName : this.paName} a prins buchetul! (deja căsătoriți 😄)` : 'Ați prins buchetul! Următoarea nuntă e a voastră! 😍', W / 2, H * 0.28, 18, '#7a3a5a'); } },
      { id: 'hora', cap: '💃 Hora mare în piața satului! Țineți ritmul', hint: 'Atinge pe ritm, hora se învârte tot mai repede!', max: 15,
        enter: () => { this.beatT = 0; this.beats = 0; this.horaSp = 0.6; Sfx.play('fanfare'); },
        tap: (type) => { if (type !== 'down') return; const ph = (this.beatT % 0.5) / 0.5, d = Math.min(ph, 1 - ph) * 0.5; if (d < 0.1) { this.good++; this.horaSp = Math.min(2.6, this.horaSp + 0.12); this.fx.text(this.W / 2, this.H * 0.3, 'Hop! Hop! 🎶', '#ff4d6d', 0.9); } else this.fx.text(this.W / 2, this.H * 0.3, 'Ups 😅', '#7a5a4a', 0.7); },
        play: dt => { const prev = Math.floor(this.beatT / 0.5); this.beatT += dt; if (Math.floor(this.beatT / 0.5) !== prev) { Sfx.play('kick'); this.beats++; } this.horaA += this.horaSp * dt; return this.beats >= 26; },
        draw: (c, W, H) => { this.village(c, W, H, H * 0.42, 0, false); this.garland(c, 0, H * 0.1, W, H * 0.1, 30, 20); const all = [this.ina, this.rex, this.bubu, this.dudu, this.gogu, ...this.guests]; const items = all.map((a, i) => { const ang = this.horaA + i * Math.PI * 2 / all.length; return { a, x: W / 2 + Math.cos(ang) * W * 0.3, y: H * 0.74 + Math.sin(ang) * H * 0.1, z: Math.sin(ang) }; }).sort((p, q) => p.z - q.z);
          for (const it of items) { this.put(it.a, it.x, it.y, this.sz() * (0.48 + 0.1 * (it.z + 1) / 2), Math.cos(this.horaA) > 0 ? 1 : -1); it.a.moving = true; it.a.draw(c); }
          const ph = (this.beatT % 0.5) / 0.5, r = 24 + (1 - ph) * 14; ell(c, W / 2, H * 0.2, r, r, 'rgba(255,77,141,0.85)', true, 3); say(c, '🎻', W / 2, H * 0.2, 20); } },
      { id: 'dizzy', cap: '😵‍💫 Hora a fost atât de repede că toată lumea vede dublu!', dur: 3.4, enter: () => { for (const a of [this.ina, this.rex, this.bubu, this.dudu, this.gogu, ...this.guests]) { a.moving = false; a.play('dizzy'); } Sfx.play('boing'); Sfx.play('applause', { delay: 0.6 }); },
        draw: (c, W, H) => { this.village(c, W, H, H * 0.42, 0, false); this.cast(c, W, H); } },
      { id: 'cake', cap: '🎂 Tortul mirilor! „Să fie casă de piatră!”', dur: 3.4, enter: () => { this.boom(80); Sfx.play('bells'); for (const a of [this.ina, this.rex]) a.play('love'); this.bubu.play('act_eat'); this.dudu.play('act_eat'); },
        draw: (c, W, H) => { this.village(c, W, H, H * 0.42, 0, false); this.cast(c, W, H); rrect(c, W / 2 - 30, H * 0.48, 60, 40, 8, '#fff0f5'); rrect(c, W / 2 - 20, H * 0.4, 40, 30, 8, '#fff'); heartPath(c, W / 2, H * 0.38, 7); c.fillStyle = '#ff4d6d'; c.fill(); } },
    ];
  }
  catchRing(by: string) { if (!this.ring.on) return; this.ring.on = false; this.ring.by = by; Sfx.play(by === 'miti' ? 'cat' : 'good'); if (by === 'me') { this.me.play('flex'); this.send({ ring: 1 }); } else if (by === 'pa') this.pa.play('flex'); this.rex.play('love'); }
  onNet(d: any) { if (d.ring) this.catchRing('pa'); if (d.bq && !this.bq.by) { this.bq.by = d.bq; } }
  endText() { return 'Casă de piatră! 💒'; }
  reward() { const s = this.scene; if (this.quit && this.pi < 3) return; if (Hol.once(s, Hol.yearKey(s, 'inawed'))) { Hol.befriendAll(s, 1); Hol.befriend(s, 'ina', 1); s.op({ k: 'res', res: 'meals', delta: 2 }); s.op({ k: 'hearts', delta: 15 }); s.log('Ați fost la nunta Inei și a lui Rex! Hora a fost de neuitat 💒💃'); s.syncPlaced(); } Hol.memory(s, 'inawed'); Hol.feelBoth(s, { fun: 30, love: 15 }); }
}
void ease; void icon; void Sfx;
export type { CharId };
