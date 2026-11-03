// Rutina de seara (co-op): compliment, pozitia de imbratisare, furatul paturii, cuptorul olandez, pupicul de noapte buna.
import { Panel } from './base';
import { Actor } from '../char/actor';
import { Sfx } from '../engine/sfx';
import { heartPath } from '../char/draw';
import type { WorldScene } from '../scenes/world';

type Step = 'intro' | 'msg' | 'msgShow' | 'pos' | 'posShow' | 'tug' | 'dutch' | 'kiss' | 'night';

const POSES = [
  { id: 'spoon', icon: '🥄', label: 'Lingurițe' },
  { id: 'chest', icon: '💗', label: 'Cap pe piept' },
  { id: 'leg', icon: '🦵', label: 'Picior peste' },
  { id: 'back', icon: '🙃', label: 'Spate în spate' },
];

const AI_MSG: Record<string, string[]> = {
  bubu: ['Ești cel mai pufos urs din lume 🐻💕', 'Mulțumesc că m-ai făcut să râd azi', 'Te iubesc mai mult decât bubble tea 🧋', 'Cu tine e acasă 🏡', 'Chiar și când sforăi, te iubesc 😴💗'],
  dudu: ['Ești cea mai frumoasă panda 🐼💕', 'Îmi place cum râzi', 'Te iubesc mai mult decât mâncarea… aproape 🍔😳', 'Mulțumesc că ai grijă de mine', 'Ești soarele meu chiar și noaptea 🌙'],
};

export class BedtimeGame extends Panel {
  step: Step = 'intro';
  stepT = 0;
  partnerAI: boolean;
  me: Actor; pa: Actor;
  myMsg = ''; theirMsg: string | null = null;
  myPos = -1; theirPos = -1;
  myTaps = 0; theirTaps = 0; tugT = 0; tugWinner: 'me' | 'them' | null = null;
  dutchBy: 'me' | 'them' | null = null; fan = 0; dutchOffered = false;
  kissHold = false; theirKiss = false; kiss = 0;
  input: HTMLElement | null = null;
  score = 0;

  constructor(scene: WorldScene, done: (s: number) => void) {
    super(scene, done, '🌙 Rutina de seară', '');
    this.partnerAI = scene.partner.control !== 'remote';
    this.me = new Actor(scene.myId, this.fx); this.pa = new Actor(scene.partner.id, this.fx);
    for (const d of scene.miniInbox.splice(0)) this.net(d);
  }

  send(d: object) { this.scene.net.sendEvent({ t: 'mini', who: this.scene.myId, data: { k: 'bed', ...d } }); }

  /** mesaje de la partener */
  net(d: any) {
    if (d?.k !== 'bed') return;
    if (d.msg !== undefined) this.theirMsg = d.msg;
    if (d.pos !== undefined) this.theirPos = d.pos;
    if (d.taps !== undefined) this.theirTaps = d.taps;
    if (d.dutch) { this.dutchBy = 'them'; this.go('dutch'); }
    if (d.kiss !== undefined) this.theirKiss = d.kiss;
  }

  go(s: Step) { this.step = s; this.stepT = 0; this.removeInput(); if (s === 'msg') this.showInput(); }

  tick(dt: number) {
    this.stepT += dt;
    this.me.update(dt); this.pa.update(dt);
    const ai = this.partnerAI;
    switch (this.step) {
      case 'intro': if (this.stepT > 2) this.go('msg'); break;
      case 'msg':
        if (ai && this.theirMsg === null && this.stepT > 3) { const l = AI_MSG[this.scene.partner.id]; this.theirMsg = l[Math.floor(Math.random() * l.length)]; }
        if (this.myMsg && (this.theirMsg !== null || this.stepT > 40)) this.go('msgShow');
        break;
      case 'msgShow': if (this.stepT > 5) this.go('pos'); break;
      case 'pos':
        if (ai && this.theirPos < 0 && this.stepT > 2.5) this.theirPos = Math.floor(Math.random() * 3);
        if (this.myPos >= 0 && (this.theirPos >= 0 || this.stepT > 25)) {
          if (this.theirPos < 0) this.theirPos = this.myPos;
          this.go('posShow');
          if (this.myPos === this.theirPos) { this.score += 1; Sfx.play('good'); this.fx.hearts(this.box.x + this.box.w / 2, this.box.y + this.box.h / 2, 10); }
        }
        break;
      case 'posShow': if (this.stepT > 3.5) { this.go('tug'); this.myTaps = 0; this.theirTaps = 0; this.tugWinner = null; } break;
      case 'tug': {
        if (this.stepT < 1.5) break; // numaratoare
        if (ai) this.theirTaps += dt * (5.2 + Math.sin(this.t * 2) * 2);
        this.tugT += dt;
        if (this.tugT > 0.15) { this.tugT = 0; this.send({ taps: this.myTaps }); }
        const diff = this.myTaps - this.theirTaps;
        if (!this.tugWinner && (Math.abs(diff) >= 22 || this.stepT > 11.5)) {
          this.tugWinner = diff >= 0 ? 'me' : 'them';
          this.fx.text(this.box.x + this.box.w / 2, this.box.y + this.box.h * 0.3, this.tugWinner === 'me' ? 'Pătura e a ta! 😈' : 'Ți-a furat pătura! 🥶', '#ff4d6d', 1.2);
          if (this.tugWinner === 'me') this.score += 0.5;
          Sfx.play(this.tugWinner === 'me' ? 'good' : 'bad');
        }
        if (this.tugWinner && (this.tugDoneT += dt) > 2.2) this.afterTug();
        break;
      }
      case 'dutch':
        if (this.dutchBy === 'them') { if (this.stepT > 6 || this.fan >= 1) { this.fx.text(this.box.x + this.box.w / 2, this.box.y + this.box.h * 0.3, this.fan >= 1 ? 'Ai supraviețuit! 😮‍💨' : 'Ai leșinat… 😵', '#7cb342', 1.2); this.score += this.fan >= 1 ? 0.5 : 0; this.go('kiss'); } }
        else if (this.stepT > 4.5) this.go('kiss');
        break;
      case 'kiss':
        if (ai) this.theirKiss = this.stepT > 1.2;
        if (this.kissHold && this.theirKiss) this.kiss = Math.min(1, this.kiss + dt * 0.45);
        else this.kiss = Math.max(0, this.kiss - dt * 0.2);
        if (this.kiss >= 1) { this.go('night'); this.score += 1; Sfx.play('kiss'); this.fx.hearts(this.box.x + this.box.w / 2, this.box.y + this.box.h * 0.45, 16); }
        if (this.stepT > 30) this.go('night');
        break;
      case 'night': if (this.stepT > 3.2) this.finish(1 + this.score, 'Noapte bună 💕'); break;
    }
  }
  tugDoneT = 0;
  afterTug() {
    this.tugDoneT = 0;
    const myFart = this.scene.w.chars[this.scene.myId].fart, theirFart = this.scene.w.chars[this.scene.partner.id].fart;
    if (myFart >= 50 && !this.dutchOffered) { this.dutchOffered = true; this.go('dutch'); this.dutchBy = null; return; }
    if (this.partnerAI && theirFart >= 50 && Math.random() < 0.6) { this.dutchBy = 'them'; this.go('dutch'); this.fx.fart(this.box.x + this.box.w / 2, this.box.y + this.box.h * 0.6, 2.5); Sfx.play('bigfart'); return; }
    this.go('kiss');
  }

  // ---- input
  showInput() {
    const d = document.createElement('div');
    d.className = 'bed-input';
    d.innerHTML = `<textarea maxlength="200" placeholder="Spune-i ceva frumos înainte de culcare…"></textarea><div><button class="skip">Sari peste</button><button class="ok">Trimite 💌</button></div>`;
    document.getElementById('ui')!.appendChild(d);
    this.input = d;
    d.addEventListener('pointerdown', e => e.stopPropagation());
    d.addEventListener('keydown', e => e.stopPropagation());
    const ta = d.querySelector('textarea')!;
    setTimeout(() => ta.focus(), 50);
    const send = (text: string) => {
      this.myMsg = text || '💤';
      this.send({ msg: this.myMsg });
      if (text) {
        this.scene.op({ k: 'jar', from: this.scene.myId, text, ts: Date.now() });
        this.scene.op({ k: 'need', who: this.scene.myId, need: 'love', delta: 8 });
        this.score += 0.5;
      }
      this.removeInput();
    };
    d.querySelector('.ok')!.addEventListener('click', () => send(ta.value.trim()));
    d.querySelector('.skip')!.addEventListener('click', () => send(''));
  }
  removeInput() { this.input?.remove(); this.input = null; }

  pointer(type: string, x: number, y: number) {
    const b = this.box;
    if (this.step === 'pos' && type === 'down' && this.myPos < 0) {
      const cw = (b.w - 60) / 2, ch = 110;
      POSES.forEach((p, i) => {
        const cx = b.x + 30 + (i % 2) * cw, cy = b.y + 150 + Math.floor(i / 2) * (ch + 14);
        if (x > cx && x < cx + cw - 8 && y > cy && y < cy + ch) { this.myPos = i; this.send({ pos: i }); Sfx.play('pop'); }
      });
    }
    if (this.step === 'tug' && type === 'down' && !this.tugWinner && this.stepT > 1.5) { this.myTaps++; this.shake = 2; Sfx.play('step'); }
    if (this.step === 'dutch' && type === 'down') this.dutchTap(x, y);
    if (this.step === 'kiss') { if (type === 'down') { this.kissHold = true; this.send({ kiss: true }); } if (type === 'up') { this.kissHold = false; this.send({ kiss: false }); } }
  }
  dutchTap(x: number, y: number) {
    const b = this.box;
    if (this.dutchBy === null && this.stepT < 4.5) {
      // alegere: pârț sau cuminte
      const yes = x < b.x + b.w / 2;
      if (y > b.y + b.h * 0.62 && y < b.y + b.h * 0.62 + 60) {
        if (yes) {
          this.dutchBy = 'me'; this.stepT = 0; this.send({ dutch: true }); this.fx.fart(b.x + b.w / 2, b.y + b.h * 0.55, 2.5); Sfx.play('bigfart'); this.shake = 8;
          this.scene.op({ k: 'need', who: this.scene.myId, need: 'fart', delta: -50 }); this.scene.op({ k: 'need', who: this.scene.myId, need: 'fun', delta: 15 });
          this.fx.text(b.x + b.w / 2, b.y + b.h * 0.3, 'CUPTORUL OLANDEZ! 😈💨', '#7cb342', 1.2);
        } else { this.fx.text(b.x + b.w / 2, b.y + b.h * 0.3, 'Ce cuminte ești 😇', '#4ea8de', 1.1); this.go('kiss'); }
      }
      return;
    }
    if (this.dutchBy === 'them') { this.fan = Math.min(1, this.fan + 0.05); this.fx.emit('puff', x, y, { vx: (Math.random() - 0.5) * 100, vy: -60, max: 0.5 }); }
  }
  key(k: string, down: boolean) {
    const b = this.box;
    if (k === ' ' || k === 'e' || k === 'enter') {
      if (this.step === 'tug' && down) this.pointer('down', 0, 0);
      if (this.step === 'kiss') this.pointer(down ? 'down' : 'up', 0, 0);
      if (this.step === 'dutch' && down && this.dutchBy === 'them') this.dutchTap(b.x + b.w / 2, b.y + b.h / 2);
    }
    if (this.step === 'pos' && down && this.myPos < 0) { const n = parseInt(k); if (n >= 1 && n <= 4) { this.myPos = n - 1; this.send({ pos: n - 1 }); } }
  }

  // ---- desen
  heads(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, pose: string) {
    const A = this.scene.myId === 'bubu' ? this.me : this.pa, B = A === this.me ? this.pa : this.me;
    for (const a of [A, B]) { a.pose.headOnly = true; a.scale = s; a.pose.back = false; a.pose.rot = 0; a.pose.eyes = 'closed'; a.pose.mouth = 'w'; a.pose.blush = 1.2; a.flip = 1; }
    const sp = 30 * s;
    switch (pose) {
      case 'spoon': A.x = cx - sp * 0.55; A.y = cy; B.x = cx + sp * 0.55; B.y = cy + 4 * s; A.flip = 1; B.flip = 1; A.pose.rot = 0.3; B.pose.rot = 0.3; break;
      case 'chest': A.x = cx - sp * 0.7; A.y = cy - 8 * s; B.x = cx + sp * 0.25; B.y = cy + 14 * s; B.pose.rot = -0.6; A.pose.rot = 0.15; break;
      case 'leg': A.x = cx - sp * 1.1; A.y = cy; B.x = cx + sp * 1.1; B.y = cy; A.pose.mouth = 'o'; B.pose.mouth = 'o'; break;
      case 'back': A.x = cx - sp * 0.9; A.y = cy; B.x = cx + sp * 0.9; B.y = cy; A.flip = -1; A.pose.back = true; B.pose.back = true; break;
      default: A.x = cx - sp * 0.8; A.y = cy; B.x = cx + sp * 0.8; B.y = cy; A.pose.eyes = 'happy'; B.pose.eyes = 'happy';
    }
    A.draw(ctx); B.draw(ctx);
    if (pose === 'leg') { ctx.fillStyle = A.spec.body; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(cx - 10 * s, cy + 22 * s, 40 * s, 14 * s, 7 * s); ctx.fill(); ctx.stroke(); }
  }

  scene2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const O = '#3a2a22';
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2b3a67'); g.addColorStop(1, '#5b4b8a');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    for (let i = 0; i < 30; i++) { const sx = x + ((i * 137) % 100) / 100 * w, sy = y + ((i * 53) % 100) / 100 * h * 0.5; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 2 + i); ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(sx, sy, 1.5 + (i % 3), 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // luna
    ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(x + w - 70, y + 80, 30, 0, 7); ctx.fill(); ctx.fillStyle = '#2b3a67'; ctx.beginPath(); ctx.arc(x + w - 58, y + 72, 26, 0, 7); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const T = (t: string, yy: number, size = 18, col = '#fff') => { ctx.font = `800 ${size}px "Baloo 2", sans-serif`; ctx.fillStyle = col; ctx.fillText(t, x + w / 2, yy); };
    // patul in partea de jos
    const bedY = y + h * 0.72;
    const drawBed = (pose: string) => {
      ctx.fillStyle = '#c98e5f'; ctx.strokeStyle = O; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(x + 30, bedY - 30, w - 60, 90, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x + 60, bedY - 62, w - 120, 40, 16); ctx.fill(); ctx.stroke();
      this.heads(ctx, x + w / 2, bedY - 40, 1.25, pose);
      ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.roundRect(x + 40, bedY - 6, w - 80, 70, 22); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 5; i++) { heartPath(ctx, x + 80 + i * (w - 160) / 4, bedY + 24, 7); ctx.fillStyle = '#fff0f5'; ctx.fill(); }
    };
    switch (this.step) {
      case 'intro':
        drawBed('none'); T('E timpul de culcare… 🌙', y + 120, 26); T('Rutina noastră de seară', y + 156, 16, '#ffd6e4'); break;
      case 'msg':
        drawBed('none'); T('💌 Spune-i ceva frumos', y + 60, 22);
        if (this.myMsg) T(this.partnerAI || this.theirMsg ? '…' : `Aștept mesajul lui/ei ${this.scene.partner.actor.spec.name}…`, y + 250, 15, '#ffd6e4');
        break;
      case 'msgShow': {
        drawBed('none');
        const bubble = (txt: string, bx: number, by: number, who: string) => {
          ctx.font = '700 15px "Baloo 2", sans-serif';
          const lines = wrap(ctx, txt, w * 0.7);
          const bh = 30 + lines.length * 20;
          ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx - w * 0.38, by, w * 0.76, bh, 16); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ff4d6d'; ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.fillText(who, bx, by + 14);
          ctx.fillStyle = O; ctx.font = '700 15px "Baloo 2", sans-serif'; lines.forEach((l, i) => ctx.fillText(l, bx, by + 34 + i * 20));
          return bh;
        };
        const h1 = bubble(this.theirMsg ?? '💤', x + w / 2, y + 50, `${this.scene.partner.actor.spec.name} îți spune:`);
        if (this.myMsg) bubble(this.myMsg, x + w / 2, y + 66 + h1, 'Tu ai spus:');
        break;
      }
      case 'pos': case 'posShow': {
        if (this.step === 'posShow') {
          drawBed(POSES[this.myPos === this.theirPos ? this.myPos : this.theirPos].id);
          T(this.myPos === this.theirPos ? `Perfect sincron! ${POSES[this.myPos].icon} 💞` : `Tu: ${POSES[this.myPos].label} · ${this.scene.partner.actor.spec.name}: ${POSES[this.theirPos].label}`, y + 70, 18);
          if (this.myPos !== this.theirPos) T('…așa că ați făcut cum a vrut el/ea 😅', y + 100, 14, '#ffd6e4');
          break;
        }
        T('🤗 Cum adormim în seara asta?', y + 60, 20); T('Dacă alegeți la fel → bonus!', y + 88, 14, '#ffd6e4');
        const cw = (w - 60) / 2, ch = 110;
        POSES.forEach((p, i) => {
          const cx = x + 30 + (i % 2) * cw, cy = y + 150 + Math.floor(i / 2) * (ch + 14);
          ctx.fillStyle = this.myPos === i ? '#ff7aa2' : '#fffaf5'; ctx.strokeStyle = O; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.roundRect(cx, cy, cw - 8, ch, 16); ctx.fill(); ctx.stroke();
          ctx.save(); ctx.beginPath(); ctx.roundRect(cx, cy, cw - 8, ch, 16); ctx.clip();
          this.heads(ctx, cx + (cw - 8) / 2, cy + 62, 0.75, p.id); ctx.restore();
          ctx.fillStyle = this.myPos === i ? '#fff' : O; ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.fillText(`${p.icon} ${p.label}`, cx + (cw - 8) / 2, cy + ch - 12);
        });
        if (this.myPos >= 0) T(this.theirPos >= 0 ? '…' : `Aștept alegerea lui/ei ${this.scene.partner.actor.spec.name}…`, y + h - 50, 14, '#ffd6e4');
        break;
      }
      case 'tug': {
        const diff = this.myTaps - this.theirTaps;
        const off = Math.max(-1, Math.min(1, diff / 22));
        // patura trasa
        drawBed('none');
        ctx.fillStyle = '#ff9ab8'; ctx.strokeStyle = O; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.roundRect(x + 40 - off * (w * 0.3), bedY - 6, w - 80, 70, 22); ctx.fill(); ctx.stroke();
        T('🛌 Cine fură pătura?!', y + 60, 22);
        if (this.stepT < 1.5) T(['3', '2', '1'][Math.min(2, Math.floor(this.stepT * 2))], y + 150, 48, '#ffd23f');
        else T(this.tugWinner ? '' : 'APASĂ CÂT DE REPEDE POȚI!', y + 110, 18, '#ffd23f');
        // bara
        const bx = x + 40, bw = w - 80, by = y + 180;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(bx, by, bw, 24, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.arc(bx + bw / 2 - off * bw / 2, by + 12, 14, 0, 7); ctx.fill(); ctx.stroke();
        ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('Tu', bx, by + 44); ctx.textAlign = 'right'; ctx.fillText(this.scene.partner.actor.spec.name, bx + bw, by + 44); ctx.textAlign = 'center';
        break;
      }
      case 'dutch': {
        drawBed('none');
        if (this.dutchBy === null) {
          T('Burtica ta e plină de gaze… 😏', y + 70, 20); T('Ce faci?', y + 100, 16, '#ffd6e4');
          const by = y + h * 0.62;
          for (const [i, label] of ['😈 Pârț sub pătură', '😇 Fii cuminte'].entries()) {
            const bx = x + 30 + i * (w / 2 - 15);
            ctx.fillStyle = i ? '#7ab8ff' : '#b8e08c'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, by, w / 2 - 45, 56, 18); ctx.fill(); ctx.stroke();
            ctx.fillStyle = O; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.fillText(label, bx + (w / 2 - 45) / 2, by + 28);
          }
        } else if (this.dutchBy === 'them') {
          ctx.fillStyle = `rgba(150,200,90,${0.5 * (1 - this.fan)})`; ctx.fillRect(x, y, w, h);
          T(`${this.scene.partner.actor.spec.name} a făcut CUPTORUL OLANDEZ! 💨`, y + 70, 18);
          T('Fă vânt! Atinge repede ecranul!', y + 100, 16, '#ffd23f');
          ctx.fillStyle = '#fff'; ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + 40, y + 130, w - 80, 22, 11); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#2ec4b6'; ctx.beginPath(); ctx.roundRect(x + 40, y + 130, (w - 80) * this.fan, 22, 11); ctx.fill();
          if (Math.random() < 0.3) this.fx.fart(x + w / 2 + (Math.random() - 0.5) * w * 0.6, bedY - 20, 1.2);
        } else { T('Hihihi 😈💨', y + 90, 26); if (Math.random() < 0.25) this.fx.fart(x + w / 2 + (Math.random() - 0.5) * w * 0.6, bedY - 20, 1.3); }
        break;
      }
      case 'kiss': {
        drawBed('spoon');
        T('💋 Pupicul de noapte bună', y + 60, 22);
        T(this.partnerAI ? 'Ține apăsat ca să-i dai pupic' : 'Țineți apăsat AMÂNDOI în același timp!', y + 92, 15, '#ffd6e4');
        const r = 20 + this.kiss * 60;
        heartPath(ctx, x + w / 2, y + 200, r); ctx.fillStyle = '#ff4d6d'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
        ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText(`${this.kissHold ? '💗 tu' : '🤍 tu'}   ${this.theirKiss ? '💗' : '🤍'} ${this.scene.partner.actor.spec.name}`, x + w / 2, y + 290);
        break;
      }
      case 'night': {
        drawBed('spoon');
        ctx.fillStyle = `rgba(10,10,30,${Math.min(0.75, this.stepT / 2)})`; ctx.fillRect(x, y, w, h);
        T('Noapte bună, iubire 💕', y + h * 0.35, 28, '#ffd6e4');
        break;
      }
    }
    ctx.textBaseline = 'alphabetic';
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' '); const out: string[] = []; let line = '';
  for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = wd; } else line = t; }
  if (line) out.push(line);
  return out.slice(0, 6);
}
