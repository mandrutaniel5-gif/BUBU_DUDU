// Studio: vitrina cu personajele, emote-uri, dansuri si interactiuni de cuplu.
import { Actor, type Mood } from '../char/actor';
import { ANIM_LIST } from '../char/anims';
import { Fx } from '../char/fx';
import { Sfx } from '../engine/sfx';
import type { Scene, Game } from '../engine/game';
import { ITEMS, NO_OUTFIT } from '../char/outfit';

interface PairAct { id: string; label: string; icon: string; a: 'bubu' | 'dudu'; aAnim: string; bAnim: string; bDelay: number; gap: number; }
const PAIRS: PairAct[] = [
  { id: 'hug', label: 'Îmbrățișare', icon: '🤗', a: 'bubu', aAnim: 'hugpose', bAnim: 'hugpose', bDelay: 0, gap: 42 },
  { id: 'kiss', label: 'Pupic', icon: '💋', a: 'dudu', aAnim: 'kisspose', bAnim: 'kisspose', bDelay: 0, gap: 50 },
  { id: 'slapD', label: 'Palmă la fund (Dudu)', icon: '🍑', a: 'dudu', aAnim: 'slap', bAnim: 'slapped', bDelay: 0.48, gap: 60 },
  { id: 'slapB', label: 'Palmă la fund (Bubu)', icon: '🍑', a: 'bubu', aAnim: 'slap', bAnim: 'slapped', bDelay: 0.48, gap: 60 },
  { id: 'bonk', label: 'Tigaia în cap', icon: '🍳', a: 'bubu', aAnim: 'pan', bAnim: 'dizzy', bDelay: 1.2, gap: 70 },
  { id: 'fartatk', label: 'Atac cu pârț', icon: '☁️', a: 'dudu', aAnim: 'fartback', bAnim: 'faint', bDelay: 1.0, gap: 64 },
];

export class StudioScene implements Scene {
  fx = new Fx();
  bubu: Actor; dudu: Actor;
  ui!: HTMLElement;
  shake = 0;
  hint = '';
  pairing: { a: Actor; b: Actor; act: PairAct; t: number; fired: boolean } | null = null;

  constructor(private game: Game) {
    this.bubu = new Actor('bubu', this.fx);
    this.dudu = new Actor('dudu', this.fx);
    this.dudu.flip = -1;
  }

  enter() {
    this.ui = document.createElement('div');
    this.ui.className = 'studio-ui';
    const sec = (title: string, inner: string) => `<div class="sec"><h3>${title}</h3><div class="btns">${inner}</div></div>`;
    const btn = (data: string, icon: string, label: string, cls = '') => `<button class="eb ${cls}" ${data}><span class="ic">${icon}</span><span class="lb">${label}</span></button>`;
    const common = ANIM_LIST.filter(a => a.who === 'both' && a.kind === 'emote');
    const dances = ANIM_LIST.filter(a => a.kind === 'dance');
    const bs = ANIM_LIST.filter(a => a.who === 'bubu');
    const ds = ANIM_LIST.filter(a => a.who === 'dudu');
    const moods: [Mood, string, string][] = [['happy', '😊', 'Fericit'], ['love', '🥰', 'Îndrăgostit'], ['sad', '😢', 'Trist'], ['angry', '😠', 'Furios'], ['sulky', '😒', 'Bosumflat'], ['sleepy', '😪', 'Obosit'], ['hungry', '🤤', 'Flămând'], ['sick', '🤒', 'Bolnav']];
    this.ui.innerHTML = `
      <div class="topbar">
        <div class="title">🐼 Bubu & Dudu 🐻 <small>Studio animații</small></div>
        <div class="who">
          <button class="tg on" data-who="both">Amândoi</button>
          <button class="tg" data-who="bubu">Bubu 🐼</button>
          <button class="tg" data-who="dudu">Dudu 🐻</button>
        </div>
        <button class="tg" data-act="play">🏠 Meniu</button>
      </div>
      <div class="panel">
        ${sec('Emote-uri', common.map(a => btn(`data-anim="${a.id}"`, a.icon, a.label)).join(''))}
        ${sec('Dansuri', dances.map(a => btn(`data-anim="${a.id}"`, a.icon, a.label, 'dance')).join('') + btn('data-anim="stop"', '⏹', 'Stop'))}
        ${sec('Speciale Bubu 🐼', bs.map(a => btn(`data-anim="${a.id}" data-force="bubu"`, a.icon, a.label, 'bubu')).join(''))}
        ${sec('Speciale Dudu 🐻', ds.map(a => btn(`data-anim="${a.id}" data-force="dudu"`, a.icon, a.label, 'dudu')).join(''))}
        ${sec('Împreună 💞', PAIRS.map(p => btn(`data-pair="${p.id}"`, p.icon, p.label, 'pair')).join(''))}
        ${sec('Garderobă 👗', ITEMS.map(i => btn(`data-item="${i.id}"`, i.icon, i.label, 'mood')).join(''))}
        ${sec('Stare (emoție de bază)', moods.map(([m, i, l]) => btn(`data-mood="${m}"`, i, l, 'mood')).join(''))}
      </div>`;
    document.getElementById('ui')!.appendChild(this.ui);
    let who: 'both' | 'bubu' | 'dudu' = 'both';
    this.ui.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b) return;
      Sfx.unlock(); Sfx.play('click');
      if (b.dataset.who) {
        who = b.dataset.who as typeof who;
        this.ui.querySelectorAll('[data-who]').forEach(x => x.classList.toggle('on', x === b));
        return;
      }
      if (b.dataset.act === 'play') { this.game.go('menu'); return; }
      const targets = (force?: string) => force ? [force === 'bubu' ? this.bubu : this.dudu] : who === 'both' ? [this.bubu, this.dudu] : [who === 'bubu' ? this.bubu : this.dudu];
      if (b.dataset.anim) {
        this.pairing = null; this.resetPos();
        for (const a of targets(b.dataset.force)) b.dataset.anim === 'stop' ? a.stop() : a.play(b.dataset.anim);
      }
      if (b.dataset.mood) for (const a of targets()) a.mood = b.dataset.mood as Mood;
      if (b.dataset.item) { const it = ITEMS.find(i => i.id === b.dataset.item)!; for (const a of targets()) { a.outfit ??= { ...NO_OUTFIT }; (a.outfit as any)[it.slot] = (a.outfit as any)[it.slot] === it.id ? 'none' : it.id; a.play('shy'); } }
      if (b.dataset.pair) this.startPair(PAIRS.find(p => p.id === b.dataset.pair)!);
    });
    this.resetPos();
  }

  exit() { this.ui.remove(); }

  // pozitii: in mijlocul zonei de scena
  private stage() {
    const { w, h } = this.game;
    const panelH = w < 760 ? h * 0.5 : 0;
    const panelW = w >= 760 ? Math.min(420, w * 0.4) : 0;
    const cw = w - panelW, ch = h - panelH;
    const scale = Math.max(1.2, Math.min(cw / 320, ch / 260));
    return { cx: cw / 2, cy: 70 + (ch - 70) * 0.72, scale };
  }
  private resetPos() {
    const s = this.stage();
    this.bubu.scale = this.dudu.scale = s.scale;
    this.bubu.x = s.cx - 62 * s.scale; this.dudu.x = s.cx + 62 * s.scale;
    this.bubu.y = this.dudu.y = s.cy;
    this.bubu.flip = 1; this.dudu.flip = -1;
  }

  private startPair(act: PairAct) {
    this.resetPos();
    const a = act.a === 'bubu' ? this.bubu : this.dudu;
    const b = act.a === 'bubu' ? this.dudu : this.bubu;
    a.stop(); b.stop();
    this.pairing = { a, b, act, t: 0, fired: false };
  }

  update(dt: number) {
    const s = this.stage();
    if (this.pairing) {
      const P = this.pairing; P.t += dt;
      const { a, b, act } = P;
      // se apropie
      const target = s.cx + (a.x < b.x ? -1 : 1) * act.gap * s.scale / 2;
      const bt = s.cx + (a.x < b.x ? 1 : -1) * act.gap * s.scale / 2;
      a.x += (target - a.x) * Math.min(1, dt * 6); b.x += (bt - b.x) * Math.min(1, dt * 6);
      a.moving = Math.abs(target - a.x) > 3 && P.t < 0.6;
      b.moving = Math.abs(bt - b.x) > 3 && P.t < 0.6;
      a.flip = a.x < b.x ? 1 : -1; b.flip = a.x < b.x ? -1 : 1;
      if (P.t > 0.45 && !P.fired) {
        P.fired = true; a.play(act.aAnim);
        setTimeout(() => {
          b.play(act.bAnim);
          if (act.id === 'hug' || act.id === 'kiss') this.fx.hearts((a.x + b.x) / 2, s.cy - 110 * s.scale, 8);
        }, act.bDelay * 1000);
      }
      if (P.t > 6) { this.pairing = null; this.resetPos(); }
    } else {
      this.bubu.scale = this.dudu.scale = s.scale;
    }
    for (const a of [this.bubu, this.dudu]) {
      a.update(dt);
      if (a.shakeReq) { this.shake = Math.max(this.shake, a.shakeReq); a.shakeReq = 0; }
    }
    this.fx.update(dt);
    this.shake *= Math.pow(0.02, dt);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { w, h } = this.game;
    const s = this.stage();
    // fundal pastel cu podea
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffe9f0'); g.addColorStop(1, '#fff6e6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.save();
    if (this.shake > 0.3) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    // buline decor
    ctx.fillStyle = '#ffd6e4';
    for (let i = 0; i < 14; i++) {
      const x = ((i * 137) % 100) / 100 * w, y = ((i * 71) % 100) / 100 * s.cy * 0.8;
      ctx.beginPath(); ctx.arc(x, y, 6 + (i % 3) * 4, 0, 7); ctx.fill();
    }
    // podea
    ctx.fillStyle = '#f3d9b8';
    ctx.beginPath(); ctx.ellipse(s.cx, s.cy + 4, 190 * s.scale, 34 * s.scale, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#e2c09a'; ctx.lineWidth = 3; ctx.stroke();
    const actors = [this.bubu, this.dudu].sort((p, q) => p.y - q.y);
    for (const a of actors) a.draw(ctx);
    this.fx.draw(ctx);
    // nume
    ctx.font = `800 ${Math.round(14 * s.scale / 1.5)}px "Baloo 2", sans-serif`; ctx.textAlign = 'center';
    for (const a of [this.bubu, this.dudu]) {
      ctx.fillStyle = a.id === 'bubu' ? '#3a2a22' : '#7a4a2a';
      ctx.fillText(a.spec.name, a.x, s.cy + 30 * s.scale);
    }
    ctx.restore();
  }
}
