// Sarbatorile de vara si zilele voastre (1.11.0): petrecerea surpriza din piata, vizita bunicilor, concursul de
// pescuit, picnicul de la lac, lozul negustorului.
import { Show, type Phase, O, clamp, ease, lerp, ell, rrect, icon, say, seeded, heartPath } from './holishow';
import { GiftBoxes } from './holiwinter';
import { Sfx } from '../engine/sfx';
import { Actor } from '../char/actor';
import { SPECS, type CharId } from '../char/draw';
import { ITEMS } from '../char/outfit';
import { catCount } from '../world/garden';
import * as Hol from '../scenes/holidays';

const FLOWERS = ['flower', 'tulip', 'rose', 'sunflower'];
const DANCES = ['dance_disco', 'dance_hop', 'dance_wave', 'dance_robot', 'shakebutt'];

// ====================================================================== 1. Ziua lui Bubu / Dudu: petrecerea surpriza
const PGIFTS = [{ k: 'buchet', icon: '💐', label: 'Buchet (3 flori)' }, { k: 'mancare', icon: '🍲', label: 'Ceva gătit de mine' }, { k: 'felicitare', icon: '💌', label: 'Felicitare desenată' }, { k: 'butic', icon: '🎁', label: 'De la butic (120 lei)' }, { k: 'pupic', icon: '💋', label: 'Un pupic uriaș' }];
export class BdayShow extends Show {
  who: CharId; B: Actor; P: Actor; candles: { on: boolean; relit: boolean; t: number }[] = []; smoke: { x: number; y: number; t: number }[] = [];
  boxes: GiftBoxes; pg = -1; pgItem = ''; btns: { x: number; y: number; w: number; h: number }[] = []; aiT = 2.5; beatT = 0; beats = 0; good = 0; combo = 0; blows = 0;
  rex!: Actor; gogu!: Actor;
  constructor(scene: any, done: (s: number) => void) {
    super(scene, done);
    this.who = (this.arg?.who ?? 'bubu') as CharId; this.B = this.who === 'bubu' ? this.bubu : this.dudu; this.P = this.B === this.bubu ? this.dudu : this.bubu;
    this.guests = this.villagers('party'); this.rex = this.guest('rex'); this.gogu = this.guest('gogu');
    this.boxes = new GiftBoxes(this, Hol.giftList(scene, 'bday', this.who));
    this.candles = Array.from({ length: 5 }, () => ({ on: true, relit: false, t: 0 }));
  }
  get iAmB() { return this.scene.myId === this.who; }
  get bName() { return SPECS[this.who].name; }
  get pName() { return SPECS[this.who === 'bubu' ? 'dudu' : 'bubu'].name; }
  /** piata cu ghirlande; lit = luminile aprinse */
  party(c: CanvasRenderingContext2D, W: number, H: number, lit: number) {
    this.village(c, W, H, H * 0.45, 0.9, false);
    if (lit < 0.5) { c.fillStyle = 'rgba(10,10,40,0.55)'; c.fillRect(0, 0, W, H); return; }
    this.garland(c, 0, H * 0.12, W * 0.5, H * 0.2, 24, 14); this.garland(c, W * 0.5, H * 0.2, W, H * 0.12, 24, 14);
    this.lights(c, 0, H * 0.28, W, H * 0.28, 26, 22, 1);
    rrect(c, W * 0.28, H * 0.04, W * 0.44, 30, 12, '#fff0f5'); say(c, `🎂 La mulți ani, ${this.bName}! 🎉`, W / 2, H * 0.04 + 15, 16, '#ff4d8d');
    for (let i = 0; i < 6; i++) { const x = W * (0.06 + i * 0.18), y = H * 0.4 + Math.sin(this.t * 2 + i) * 6; c.strokeStyle = '#999'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 14); c.lineTo(x + 2, y + 50); c.stroke(); ell(c, x, y, 13, 16, ['#ff7aa2', '#ffd23f', '#4cc9f0', '#7cc576', '#c77dff', '#ff9a5a'][i], true, 1.5); }
  }
  crowd(c: CanvasRenderingContext2D, W: number, H: number, jump = 0) { const s = this.sz() * 0.55; this.guests.forEach((g, i) => { const x = W * (i < 3 ? 0.06 + i * 0.1 : 0.7 + (i - 3) * 0.1), y = H * 0.84 - Math.abs(Math.sin(this.t * 6 + i)) * jump; this.put(g, x, y, s, i < 3 ? 1 : -1); g.draw(c); }); }
  couple(c: CanvasRenderingContext2D, W: number, H: number, s = this.sz() * 0.68) { this.put(this.B, W * 0.44, H * 0.86, s, 1); this.put(this.P, W * 0.56, H * 0.86, s, -1); this.B.draw(c); this.P.draw(c); }
  cake(c: CanvasRenderingContext2D, x: number, y: number, s: number, cream = false) {
    c.save(); c.translate(x, y); c.scale(s, s);
    ell(c, 0, 4, 70, 14, '#fff'); rrect(c, -58, -46, 116, 46, 10, '#ffb3c6'); rrect(c, -42, -82, 84, 38, 10, '#fff0f5');
    c.fillStyle = '#fff'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(-50 + i * 16.5, -46, 7, 0, Math.PI); c.fill(); }
    for (let i = 0; i < 6; i++) ell(c, -36 + i * 14.5, -80, 4, 4, '#e63946', true, 1);
    if (cream) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(10, -84, 26, 12, 0, 0, 7); c.fill(); }
    this.candles.forEach((cd, i) => { const cx = -32 + i * 16; rrect(c, cx - 3, -110, 6, 28, 2, ['#4cc9f0', '#ffd23f', '#7cc576', '#ff7aa2', '#c77dff'][i], true, 1); for (let k = 0; k < 3; k++) { c.fillStyle = '#fff'; c.fillRect(cx - 3, -106 + k * 9, 6, 2); }
      if (cd.on) { const f = 1 + Math.sin(this.t * 18 + i) * 0.15; c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(cx, -118, 4 * f, 8 * f, 0, 0, 7); c.fill(); c.fillStyle = '#ff9a5a'; c.beginPath(); c.ellipse(cx, -116, 2, 4, 0, 0, 7); c.fill(); c.globalAlpha = 0.25; c.fillStyle = '#ffe680'; c.beginPath(); c.arc(cx, -118, 16, 0, 7); c.fill(); c.globalAlpha = 1; } });
    c.restore();
  }
  blow(mine: boolean) {
    const lit = this.candles.map((c2, i) => [c2, i] as const).filter(([c2]) => c2.on); if (!lit.length) return;
    this.blows++; Sfx.play('whoosh', { vol: 0.6 });
    const [cd, i] = lit[Math.floor(Math.random() * lit.length)]; cd.on = false; cd.t = this.t; this.smoke.push({ x: i, y: 0, t: this.t });
    // doua lumanari „fermecate” se reaprind o data (gluma lui Rex)
    if (!cd.relit && (i === 1 || i === 3)) { cd.relit = true; setTimeout(() => { if (!this.ended) { cd.on = true; Sfx.play('pop'); this.fx.text(this.W * 0.5, this.H * 0.3, 'Lumânări fermecate! 😂 Rex râde de tine', '#ff4d6d', 0.9); this.rex.play('laugh'); } }, 900); }
    if (mine) this.send({ blow: 1 });
  }
  build(): Phase[] {
    const W0 = () => this.W, H0 = () => this.H; void W0; void H0;
    const P: Phase[] = [
      { id: 'dark', cap: 'Piața e pustie și întunecată… unde e toată lumea? 🤔', dur: 3.2, enter: () => { this.B.play('shy'); },
        draw: (c, W, H) => { this.party(c, W, H, 0); this.put(this.B, W * 0.5, H * 0.86, this.sz() * 0.68, 1); this.B.draw(c); for (let i = 0; i < 4; i++) { const x = W * (0.12 + i * 0.25); ell(c, x, H * 0.82, 40, 26, '#2f5a3a'); if (Math.sin(this.t * 3 + i) > 0.2) { ell(c, x - 8 + i * 4, H * 0.62, 5, 9, '#fbf6f2', true, 1.5); ell(c, x + 4 + i * 4, H * 0.62, 5, 9, '#fbf6f2', true, 1.5); } } this.bub(c, `${this.bName}: „Alo? E cineva?…”`, W * 0.5, H * 0.52, 14); } },
      { id: 'boo', cap: '🎉 SURPRIZĂĂĂ!!!', dur: 3.4, enter: () => { this.flash = 1; Sfx.play('horn'); Sfx.play('applause'); this.boom(120); for (const g of this.guests) g.play('dance_hop'); this.B.play('faint'); this.P.play('dance_hop'); },
        draw: (c, W, H, k) => { this.party(c, W, H, 1); this.crowd(c, W, H, 14); this.couple(c, W, H); if (k > 0.45) this.bub(c, `${this.bName} a leșinat de emoție 😂`, W * 0.44, H * 0.5, 13); } },
      { id: 'song', cap: '🎵 „La mulți ani cu sănătate…”', dur: 3.4, enter: () => { Sfx.play('bdaysong'); this.B.play('love'); for (const g of this.guests) g.play('dance_wave'); },
        draw: (c, W, H) => { this.party(c, W, H, 1); this.crowd(c, W, H, 4); this.couple(c, W, H); for (let k = 0; k < 5; k++) icon(c, k % 2 ? '🎶' : '🎵', W * (0.2 + k * 0.15) + Math.sin(this.t * 2 + k) * 10, H * 0.5 - ((this.t * 30 + k * 20) % 60), 18); } },
      { id: 'song2', cap: `🎵 „…să trăiască ${this.who === 'bubu' ? 'Bubu' : 'Dudu'} mulți ani!” (Rex: „AUUUU!”)`, dur: 3.4, enter: () => { Sfx.play('howl'); this.rex.play('dance_robot'); },
        draw: (c, W, H) => { this.party(c, W, H, 1); this.crowd(c, W, H, 4); this.couple(c, W, H); this.bub(c, 'AUUUU 🎶', this.rex.x, this.rex.y - 80, 13); } },
      { id: 'pgift', cap: '', hint: this.iAmB ? '' : `Alege cadoul tău pentru ${this.bName}`, max: 30,
        enter: () => { this.aiT = 2.8; if (this.iAmB) Sfx.play('drumroll'); },
        tap: (type, x, y) => { if (type !== 'down' || this.iAmB || this.pg >= 0) return; const i = this.btns.findIndex(r => this.hit(r, x, y)); if (i < 0 || !this.canGift(i)) { if (i >= 0) { Sfx.play('bad'); this.fx.text(x, y + 80, i === 0 ? 'Îți trebuie 3 flori 🌸' : i === 1 ? 'N-ai nimic gătit 🍲' : 'Nu ajung banii 💰', '#7a5a4a', 0.8); } return; } this.chooseGift(i); },
        play: dt => { if (this.pg < 0 && (this.iAmB ? this.aiPlays : false)) { this.aiT -= dt; if (this.aiT <= 0) { this.pg = [2, 4, 2, 4][this.scene.w.day % 4]; } } return this.pg >= 0; },
        draw: (c, W, H) => { this.party(c, W, H, 1); this.crowd(c, W, H); this.couple(c, W, H);
          if (this.iAmB) { this.phases[this.pi].cap = `${this.pName} îți pregătește ceva… 👀`; this.bub(c, 'Nu te uita! 🙈', W * 0.56, H * 0.5, 14); }
          else { this.phases[this.pi].cap = `Ce-i dai lui ${this.bName}?`; this.btns = this.buttons(c, PGIFTS.map((g, i) => ({ icon: g.icon, label: g.label, dis: !this.canGift(i) })), 44, 120); } } },
      { id: 'pgift2', cap: '', dur: 4.2, enter: () => { Sfx.play('pop'); Sfx.play('good'); this.P.play(this.pg === 4 ? 'kiss' : 'love'); setTimeout(() => this.B.play(this.pg === 4 ? 'kiss' : 'love'), 600); if (this.pg === 4) setTimeout(() => { this.fx.hearts(this.W / 2, this.H * 0.6, 20); Sfx.play('kiss'); }, 900); },
        draw: (c, W, H, k) => { this.party(c, W, H, 1); this.crowd(c, W, H, 3); this.couple(c, W, H); const g = PGIFTS[Math.max(0, this.pg)];
          this.phases[this.pi].cap = this.pg === 2 ? `💌 O felicitare desenată de ${this.pName}! (artă modernă 😅)` : this.pg === 4 ? '💋 Un pupic URIAȘ! Tot satul face „Awww!”' : this.pg === 3 ? `🎁 ${this.pgItem ? ITEMS.find(i => i.id === this.pgItem)?.label : 'O surpriză'} de la butic!` : this.pg === 0 ? '💐 Un buchet de flori culese cu dragoste!' : '🍲 Ceva gătit cu mâinile lui… mmm!';
          if (this.pg === 2) { const cw = Math.min(260, W * 0.4), ch = cw * 0.66, s = ease(clamp(k * 3)); c.save(); c.translate(W / 2, H * 0.36); c.scale(s, s); c.rotate(-0.05); rrect(c, -cw / 2, -ch / 2, cw, ch, 6, '#fffaf0'); heartPath(c, -cw * 0.3, -ch * 0.15, 14); c.fillStyle = '#ff4d6d'; c.fill(); c.strokeStyle = O; c.lineWidth = 2; for (const sx of [-0.05, 0.22]) { c.beginPath(); c.arc(cw * sx, -ch * 0.05, 12, 0, 7); c.stroke(); c.beginPath(); c.moveTo(cw * sx, ch * 0.05); c.lineTo(cw * sx, ch * 0.28); c.moveTo(cw * sx - 12, ch * 0.14); c.lineTo(cw * sx + 12, ch * 0.14); c.moveTo(cw * sx, ch * 0.28); c.lineTo(cw * sx - 9, ch * 0.4); c.moveTo(cw * sx, ch * 0.28); c.lineTo(cw * sx + 9, ch * 0.4); c.stroke(); } c.font = '800 13px "Baloo 2", sans-serif'; c.fillStyle = '#7a3a5a'; c.textAlign = 'center'; c.fillText('LA MULȚI ANI! Te iubesc ❤️', 0, -ch * 0.36); c.restore(); }
          else if (this.pg !== 4) icon(c, g.icon, W / 2, H * 0.36 - Math.sin(k * Math.PI) * 20, 60); } },
      { id: 'candles', cap: '🎂 Suflă în lumânări!', hint: 'Atinge repede ca să sufli!', max: 25,
        enter: () => { this.aiT = 0.6; },
        tap: (type) => { if (type === 'down') this.blow(true); },
        play: dt => { if (this.aiPlays && (!this.iAmB)) { /* il ajuti pe sarbatorit */ } if (!this.iAmB && this.partnerAI) { this.aiT -= dt; if (this.aiT <= 0) { this.aiT = 0.7; this.blow(false); } } return this.candles.every(c2 => !c2.on) && this.pt > 1; },
        draw: (c, W, H) => { this.party(c, W, H, 1); this.crowd(c, W, H); this.cake(c, W / 2, H * 0.74, this.sz() * 0.9); this.put(this.B, W * 0.26, H * 0.86, this.sz() * 0.62, 1); this.B.draw(c);
          for (const sm of this.smoke) { const a = this.t - sm.t; if (a > 2) continue; c.globalAlpha = 0.5 * (1 - a / 2); c.fillStyle = '#bbb'; c.beginPath(); c.arc(W / 2 + (-32 + sm.x * 16) * this.sz() * 0.9 + Math.sin(a * 5) * 5, H * 0.74 - (120 + a * 40) * this.sz() * 0.9, 5 + a * 4, 0, 7); c.fill(); c.globalAlpha = 1; } } },
      { id: 'wish', cap: '✨ Pune o dorință… (nu spune nimănui!)', dur: 2.8, enter: () => { Sfx.play('chimes'); Sfx.play('applause', { delay: 0.4 }); this.B.play('shy'); },
        draw: (c, W, H) => { this.party(c, W, H, 1); this.crowd(c, W, H, 6); this.cake(c, W / 2, H * 0.74, this.sz() * 0.9); this.put(this.B, W * 0.26, H * 0.86, this.sz() * 0.62, 1); this.B.draw(c); for (let i = 0; i < 6; i++) icon(c, '✨', W * 0.26 + Math.cos(this.t * 2 + i) * 50, H * 0.5 + Math.sin(this.t * 2 + i) * 20, 16); } },
      { id: 'rex', cap: 'Nea Gogu taie tortul… și Rex n-a mai rezistat 🐶🎂', dur: 3.6, enter: () => { this.gogu.play('act_cook'); setTimeout(() => { this.rex.play('faint'); Sfx.play('squelch'); Sfx.play('giggle', { delay: 0.3 }); for (const g of this.guests) if (g !== this.rex) g.play('laugh'); this.B.play('laugh'); this.P.play('laugh'); }, 1200); },
        draw: (c, W, H, k) => { this.party(c, W, H, 1); this.cake(c, W / 2, H * 0.74, this.sz() * 0.9, k > 0.35); const rx = lerp(W * 0.8, W * 0.53, clamp(k * 3)); this.put(this.rex, rx, H * 0.78, this.sz() * 0.6, -1); this.rex.draw(c); if (k > 0.35) { c.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(rx - 10 + i * 5, H * 0.78 - 60 + (i % 2) * 8, 6, 0, 7); c.fill(); } this.bub(c, 'Rex: „Nu-i ce pare! 😳🍰”', rx, H * 0.42, 13); } this.put(this.gogu, W * 0.35, H * 0.86, this.sz() * 0.6, 1); this.gogu.draw(c); } },
      { id: 'gifts', cap: '🎁 Cadourile de la săteni!', hint: 'Atinge un cadou de 3 ori ca să-l deschizi', max: 70,
        enter: () => { this.aiT = 1.5; if (!this.boxes.gifts.length) this.next(); },
        tap: (type, x, y) => { if (type !== 'down') return; const i = this.boxes.rects.findIndex(r => this.hit(r, x, y)); if (i >= 0) this.boxes.tap(i, true); },
        play: dt => { if (this.aiPlays && !this.iAmB) { this.aiT -= dt; if (this.aiT <= 0) { this.aiT = 0.9; const i = this.boxes.open.findIndex(o => o < 3); if (i >= 0) this.boxes.tap(i, false); } } return this.boxes.done && this.pt > 1; },
        draw: (c, W, H) => { this.party(c, W, H, 1); this.boxes.draw(c, W, H * 0.84, this.guests); } },
      { id: 'dance', cap: '', hint: 'Dansați! Atinge pe ritm', max: 16,
        enter: () => { this.beatT = 0; this.beats = 0; },
        tap: (type) => { if (type !== 'down') return; const ph = (this.beatT % 0.55) / 0.55, d = Math.min(ph, 1 - ph) * 0.55; if (d < 0.11) { this.good++; this.combo++; this.me.play(DANCES[this.combo % DANCES.length]); this.fx.text(this.W / 2, this.H * 0.4, this.combo > 4 ? 'Regele ringului! 👑' : 'Pe ritm! ✨', '#ffd23f', 0.9); if (this.combo % 5 === 0) this.boom(25); this.send({ dance: this.combo }); } else { this.combo = 0; this.fx.text(this.W / 2, this.H * 0.4, 'Ups! 😅', '#fff', 0.7); } },
        play: dt => { const prev = Math.floor(this.beatT / 0.55); this.beatT += dt; if (Math.floor(this.beatT / 0.55) !== prev) { Sfx.play('kick'); this.beats++; if (this.aiPlays && this.beats % 2 === 0) this.pa.play(DANCES[this.beats % 5]); if (this.beats % 3 === 0) { const g = this.guests[this.beats % this.guests.length]; g.play(DANCES[(this.beats / 3) % 5 | 0]); } } return this.beats >= 26; },
        draw: (c, W, H) => { this.party(c, W, H, 1); for (let i = 0; i < 6; i++) { const a = this.t * 1.5 + i; c.fillStyle = ['rgba(255,77,141,0.12)', 'rgba(76,201,240,0.12)', 'rgba(255,210,63,0.12)'][i % 3]; c.beginPath(); c.moveTo(W / 2, H * 0.14); c.lineTo(W / 2 + Math.cos(a) * W, H); c.lineTo(W / 2 + Math.cos(a + 0.2) * W, H); c.closePath(); c.fill(); }
          this.crowd(c, W, H, 10); this.couple(c, W, H); const ph = (this.beatT % 0.55) / 0.55, r = 28 + (1 - ph) * 16; ell(c, W / 2, H * 0.3, r, r, 'rgba(255,77,141,0.85)', true, 3); say(c, '🪩', W / 2, H * 0.3, 22); say(c, `✨ ${this.good}`, 70, 30, 16, '#fff'); } },
      { id: 'end', cap: `🎂 La mulți ani, ${this.bName}! Cea mai frumoasă zi! 💕`, dur: 3.6, enter: () => { Sfx.play('fanfare'); this.boom(80); for (let i = 0; i < 3; i++) setTimeout(() => this.shape(this.W * (0.25 + i * 0.25), this.H * 0.25, ['heart', this.who === 'bubu' ? 'panda' : 'bear', 'star'][i], [['#ff4d6d', '#fff'], ['#fff', '#2b2b33'], ['#ffd23f', '#fff']][i]), i * 350); this.B.play('love'); this.P.play('kiss'); },
        draw: (c, W, H) => { this.party(c, W, H, 1); this.crowd(c, W, H, 8); this.couple(c, W, H); } },
    ];
    return P;
  }
  canGift(i: number) { const s = this.scene; if (i === 0) return catCount(s.w.res ?? {}, 'flower') >= 3; if (i === 1) return Hol.hotMeals(s).length > 0; if (i === 3) return (s.w.money ?? 0) >= 120; return true; }
  chooseGift(i: number) {
    const s = this.scene; this.pg = i;
    if (i === 0) { let left = 3; for (const k of FLOWERS) { const h = Math.min(left, s.w.res?.[k] ?? 0); if (h) { s.op({ k: 'res', res: k, delta: -h }); left -= h; } } }
    if (i === 1) { const m = Hol.hotMeals(s)[0]; if (m) s.op({ k: 'res', res: m.key, delta: -1 }); }
    if (i === 3) { s.op({ k: 'money', delta: -120 }); const own = new Set(((s.w.chars[this.who] as any).owned ?? []) as string[]); const pool = ITEMS.filter(x => x.shop === 'oras' && !own.has(x.id) && !['mireasa', 'voal', 'mire'].includes(x.id)); this.pgItem = (pool[s.w.day % Math.max(1, pool.length)] ?? ITEMS[0]).id; }
    this.send({ pg: i, item: this.pgItem }); Sfx.play('good');
  }
  onNet(d: any) {
    if (d.pg != null && this.pg < 0) { this.pg = d.pg; this.pgItem = d.item ?? ''; }
    if (d.blow) this.blow(false);
    if (d.box != null) this.boxes.tap(d.box, false);
    if (d.dance) this.pa.play(DANCES[d.dance % 5]);
  }
  endText() { return `La mulți ani, ${this.bName}! 🎂`; }
  reward() {
    const s = this.scene, y = Hol.yearOf(s.w.day);
    if (this.quit && this.pi < 6) return;
    const shared = Hol.once(s, `bday-${this.who}-${y}`);
    if (shared) { for (const gf of this.boxes.gifts) Hol.befriend(s, gf.vid, 1); s.op({ k: 'hearts', delta: 20 }); s.log(`Petrecere surpriză pentru ${this.bName} în piața satului! 🎂🎉`); }
    for (const gf of this.boxes.gifts) Hol.applyGift(s, gf, shared);
    // cadoul partenerului: haina de la butic o primeste sarbatoritul (pe telefonul lui)
    if (this.pgItem) Hol.applyGift(s, { vid: '', from: '', box: '', icon: '', label: '', msg: '', to: this.who, item: this.pgItem }, false);
    Hol.memory(s, 'bday-' + this.who);
    Hol.feel(s, this.who, { love: 40, fun: 40 }); Hol.feel(s, this.who === 'bubu' ? 'dudu' : 'bubu', { love: 22, fun: 25 });
  }
}

// ====================================================================== 2. Vizita bunicilor
export class GrandShow extends Show {
  gma: Actor; gpa: Actor; meals: ReturnType<typeof Hol.hotMeals> = []; pick = -2; rating = 0; btns: { x: number; y: number; w: number; h: number }[] = []; stir = 0; aiT = 3; told = 0;
  constructor(scene: any, done: (s: number) => void) {
    super(scene, done);
    this.gma = new Actor('bubu', this.fx); this.gma.outfit = { head: 'batic', face: 'ochelari', neck: 'none', body: 'ie' };
    this.gpa = new Actor('dudu', this.fx); this.gpa.outfit = { head: 'palarie', face: 'mustata', neck: 'none', body: 'vesta' };
    this.meals = Hol.hotMeals(scene).slice(0, 4); this.told = (scene.w.stats.grandStory ?? 0) + 1;
  }
  yard(c: CanvasRenderingContext2D, W: number, H: number) {
    this.sky(c, W, H * 0.45, '#8fd3ff', '#fff1d6'); ell(c, W * 0.85, H * 0.12, 26, 26, '#ffd23f', false);
    rrect(c, -10, H * 0.06, W * 0.34, H * 0.42, 0, '#fff1d6'); c.fillStyle = '#c0573e'; c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(-20, H * 0.08); c.lineTo(W * 0.15, -20); c.lineTo(W * 0.35, H * 0.08); c.closePath(); c.fill(); c.stroke();
    for (const x of [0.06, 0.2]) { c.fillStyle = '#bde7ff'; c.fillRect(W * x, H * 0.16, 30, 26); c.strokeRect(W * x, H * 0.16, 30, 26); }
    this.ground(c, W, H, H * 0.45, '#a6dc93'); c.strokeStyle = '#8a5d32'; c.lineWidth = 3; for (let x = W * 0.36; x < W; x += 22) { c.beginPath(); c.moveTo(x, H * 0.47); c.lineTo(x, H * 0.4); c.stroke(); } c.beginPath(); c.moveTo(W * 0.36, H * 0.42); c.lineTo(W, H * 0.42); c.stroke();
    // masa din curte
    rrect(c, W * 0.3, H * 0.66, W * 0.4, 16, 6, '#c98e5f'); for (const x of [0.33, 0.67]) { c.fillStyle = '#a0703f'; c.fillRect(W * x - 4, H * 0.66 + 16, 8, H * 0.14); }
    c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#ff7aa2' : '#fff'; c.fillRect(W * 0.3 + i * W * 0.4 / 6, H * 0.66, W * 0.4 / 6, 6); }
  }
  family(c: CanvasRenderingContext2D, W: number, H: number) { const s = this.sz() * 0.62; this.put(this.gma, W * 0.2, H * 0.84, s, 1); this.put(this.gpa, W * 0.8, H * 0.84, s, -1); this.put(this.bubu, W * 0.38, H * 0.9, s, 1); this.put(this.dudu, W * 0.62, H * 0.9, s, -1); this.gma.draw(c); this.gpa.draw(c); this.bubu.draw(c); this.dudu.draw(c); }
  build(): Phase[] {
    const st = (n: number) => '⭐'.repeat(n) + '☆'.repeat(5 - n);
    return [
      { id: 'hi', cap: '👵👴 Au venit bunicii! Cu trei sacoșe și un borcan de zacuscă', dur: 3.4, enter: () => { Sfx.play('doorbell'); this.gma.play('wave'); this.gpa.play('wave'); this.bubu.play('dance_hop'); this.dudu.play('love'); },
        draw: (c, W, H) => { this.yard(c, W, H); this.family(c, W, H); for (let i = 0; i < 3; i++) icon(c, '🛍️', W * (0.12 + i * 0.05), H * 0.86, 26); icon(c, '🫙', W * 0.86, H * 0.86, 24); } },
      { id: 'cheeks', cap: '', dur: 3.6, enter: () => { this.gma.play('love'); this.dudu.play('shy'); Sfx.play('kiss'); },
        draw: (c, W, H) => { this.yard(c, W, H); this.family(c, W, H); this.phases[this.pi].cap = 'Bunica îl ciupește pe Dudu de obraji 🥰'; this.bub(c, 'Buni: „Vai, ce te-ai îngrășat, puiule! Mănânci bine? 🥰”', W * 0.4, H * 0.5, 13); } },
      { id: 'cook', cap: '🍽️ Ce le puneți bunicilor pe masă?', hint: 'Alege mâncarea (sau gătiți cu bunica)', max: 30,
        tap: (type, x, y) => { if (type !== 'down' || this.pick > -2) return; const i = this.btns.findIndex(r => this.hit(r, x, y)); if (i < 0) return; this.choose(i === this.meals.length ? -1 : i, true); },
        play: dt => { if (this.pick === -2 && this.aiPlays && this.remote === false && this.partnerAI) { /* alegi tu */ } if (this.pick === -2 && !this.partnerAI && !this.heard) { this.aiT -= dt; } return this.pick > -2; },
        draw: (c, W, H) => { this.yard(c, W, H); this.family(c, W, H); this.btns = this.buttons(c, [...this.meals.map(m => ({ icon: m.icon, label: `${m.name} (${m.n})` })), { icon: '🥘', label: 'Gătim cu bunica' }], 44, 130); } },
      { id: 'stir', cap: '🥘 Bunica face sarmale: amestecă în oală!', hint: 'Atinge repede ca să amesteci!', max: 12,
        enter: () => { if (this.pick !== -1) this.next(); else { this.stir = 0; this.gma.play('act_cook'); } },
        tap: (type) => { if (type === 'down') { this.stir++; Sfx.play('spoon', { vol: 0.6 }); if (this.stir === 10) this.fx.text(this.W / 2, this.H * 0.4, 'Bunica: „Mai cu spor, nu adormi!” 😄', '#7a5a4a', 0.9); } },
        play: dt => { if (this.partnerAI && this.pt % 0.5 < dt) this.stir++; return this.stir >= 24; },
        draw: (c, W, H) => { this.yard(c, W, H); this.family(c, W, H); const cx = W / 2, cy = H * 0.6; ell(c, cx, cy, 60, 18, '#555'); rrect(c, cx - 56, cy, 112, 40, 10, '#666'); for (let i = 0; i < 6; i++) ell(c, cx - 30 + i * 12 + Math.sin(this.t * 5 + i) * 3, cy - 2 - ((this.t * 30 + i * 9) % 20), 4, 4, '#ffffffaa', false); c.save(); c.translate(cx, cy - 8); c.rotate(Math.sin(this.stir * 1.2) * 0.6); c.strokeStyle = '#a0703f'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(20, -60); c.stroke(); c.restore(); say(c, `🥄 ${Math.min(24, this.stir)}/24`, 80, 30, 16, '#7a5a4a'); } },
      { id: 'taste', cap: '', dur: 4.2, enter: () => { this.rating = this.pick === -1 ? 5 : this.meals[this.pick]?.stars ?? 3; this.gma.play('act_eat'); this.gpa.play('act_eat'); setTimeout(() => { Sfx.play(this.rating >= 4 ? 'good' : 'giggle'); this.gma.play(this.rating >= 4 ? 'love' : 'laugh'); }, 1500); setTimeout(() => { Sfx.play('burp'); this.gpa.play('burp'); }, 2800); },
        draw: (c, W, H, k) => { this.yard(c, W, H); this.family(c, W, H); for (let i = 0; i < 4; i++) icon(c, this.pick === -1 ? '🥬' : (this.meals[this.pick]?.icon ?? '🍲'), W * (0.36 + i * 0.09), H * 0.62, 26);
          this.phases[this.pi].cap = k < 0.35 ? 'Bunicii gustă… 🤔' : k < 0.66 ? `Buni: ${st(this.rating)} ${this.rating >= 5 ? '„Ca la mine acasă! Bravo, copii!”' : this.rating >= 4 ? '„Foarte bun! Puțină sare și era perfect”' : '„Hmm… bun, bun. Mai exersați 😅”'}` : 'Bunicu\': „Pardon! 😳 …mai pune-mi o porție!”'; } },
      { id: 'story', cap: '', dur: 4.4, enter: () => { this.gpa.play('wave'); },
        draw: (c, W, H) => { this.yard(c, W, H); this.family(c, W, H); this.bub(c, 'Bunicu\': „V-am zis de somnul de 20 de kile pe care l-am prins în ’78?”', W * 0.62, H * 0.42, 13); this.phases[this.pi].cap = this.told > 1 ? `${this.myName}: „Da, bunicu'… de ${this.told + 1} ori până acum 😅”` : `${this.myName}: „Nu… (și urmează o oră de poveste) 😅”`; } },
      { id: 'gifts', cap: '', dur: 4, enter: () => { Sfx.play('coin'); Sfx.play('good', { delay: 0.3 }); this.boom(30); this.bubu.play('love'); this.dudu.play('dance_hop'); },
        draw: (c, W, H) => { this.yard(c, W, H); this.family(c, W, H); const lei = 60 + this.rating * 20; this.phases[this.pi].cap = `🎁 Bunicii vă lasă ${lei} de lei „de-o ciocolată”, zacuscă și ouă de la țară`; icon(c, '💰', W * 0.4, H * 0.5, 34); icon(c, '🫙', W * 0.5, H * 0.5, 34); icon(c, '🥚', W * 0.6, H * 0.5, 34); } },
      { id: 'bye', cap: '👋 „Să ne mai chemați, copii! Și să mâncați bine!”', dur: 3.6, enter: () => { this.gma.play('wave'); this.gpa.play('wave'); this.bubu.play('wave'); this.dudu.play('wave'); Sfx.play('chimes'); },
        draw: (c, W, H, k) => { this.yard(c, W, H); const s = this.sz() * 0.62; this.put(this.gma, W * 0.2 + k * W * 0.7, H * 0.84, s, 1); this.put(this.gpa, W * 0.3 + k * W * 0.7, H * 0.84, s, 1); this.put(this.bubu, W * 0.38, H * 0.9, s, 1); this.put(this.dudu, W * 0.5, H * 0.9, s, 1); this.gma.draw(c); this.gpa.draw(c); this.bubu.draw(c); this.dudu.draw(c); } },
    ];
  }
  choose(i: number, mine: boolean) { this.pick = i; if (mine) { if (i >= 0 && this.meals[i]) this.scene.op({ k: 'res', res: this.meals[i].key, delta: -1 }); this.send({ pick: i }); } Sfx.play('pop'); }
  onNet(d: any) { if (d.pick != null && this.pick === -2) this.choose(d.pick, false); }
  endText() { return 'Bunicii au plecat fericiți! 👵👴💕'; }
  reward() {
    const s = this.scene; if (this.quit && this.pi < 4) return;
    if (Hol.once(s, Hol.yearKey(s, 'grand'))) { s.op({ k: 'money', delta: 60 + this.rating * 20 }); s.op({ k: 'res', res: 'meals', delta: 3 }); s.op({ k: 'res', res: 'egg', delta: 6 }); s.op({ k: 'stat', key: 'grandStory', delta: 1 }); s.op({ k: 'hearts', delta: 15 }); s.log('Bunicii au fost în vizită! 👵👴'); }
    Hol.memory(s, 'grand'); Hol.feelBoth(s, { love: 25, fun: 20, hunger: 25 });
  }
}

// ====================================================================== 3. Concursul de pescuit (zi de lac)
type Catch = { name: string; icon: string; kg: number; fish: boolean };
const CATCHES: (Catch & { w: number; min: number; max: number })[] = [
  { name: 'Caras', icon: '🐟', kg: 0, fish: true, w: 30, min: 0.3, max: 1.2 }, { name: 'Biban', icon: '🐟', kg: 0, fish: true, w: 20, min: 0.4, max: 1.5 },
  { name: 'Crap', icon: '🐠', kg: 0, fish: true, w: 20, min: 1, max: 4.5 }, { name: 'Știucă', icon: '🐡', kg: 0, fish: true, w: 10, min: 2, max: 6 },
  { name: 'SOMN uriaș', icon: '🐋', kg: 0, fish: true, w: 4, min: 6, max: 14 },
  { name: 'o gheată veche', icon: '👢', kg: 0, fish: false, w: 7, min: 0, max: 0 }, { name: 'o șosetă (a lui Rex?)', icon: '🧦', kg: 0, fish: false, w: 5, min: 0, max: 0 }, { name: 'o rățușcă de cauciuc', icon: '🦆', kg: 0, fish: false, w: 4, min: 0, max: 0 },
];
function rollCatch(r: () => number): Catch { let x = r() * CATCHES.reduce((a, c) => a + c.w, 0); for (const c of CATCHES) { x -= c.w; if (x <= 0) return { name: c.name, icon: c.icon, fish: c.fish, kg: c.fish ? Math.round((c.min + r() * (c.max - c.min)) * 10) / 10 : 0 }; } return { name: 'Caras', icon: '🐟', fish: true, kg: 0.5 }; }
export class FishContestShow extends Show {
  state: 'wait' | 'bite' | 'reel' | 'show' = 'wait'; stT = 0; biteAt = 2; reel = 0; last: Catch | null = null; score: Record<string, number> = { me: 0, pa: 0, miti: 0, rex: 0 }; myFish = 0; rnd = seeded(Date.now() & 0xffff);
  aiT: Record<string, number> = { pa: 4, miti: 3, rex: 6 }; jump = -1; feed: { t: number; txt: string }[] = [];
  miti!: Actor; rexA!: Actor;
  constructor(scene: any, done: (s: number) => void) { super(scene, done); this.guests = this.villagers('none'); this.miti = this.guest('miti'); this.rexA = this.guest('rex'); }
  lake(c: CanvasRenderingContext2D, W: number, H: number) {
    this.sky(c, W, H * 0.3, '#8fd3ff', '#e6f7ff'); ell(c, W * 0.9, H * 0.08, 22, 22, '#ffd23f', false);
    c.fillStyle = '#7cc576'; c.fillRect(0, H * 0.26, W, H * 0.06); c.fillStyle = '#5aa0c8'; c.fillRect(0, H * 0.32, W, H * 0.44);
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2; for (let i = 0; i < 10; i++) { const y = H * 0.36 + i * H * 0.04, x = (i * 97 + this.t * 20) % W; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30, y); c.stroke(); }
    // ponton
    c.fillStyle = '#c98e5f'; c.fillRect(0, H * 0.74, W, H * 0.08); c.strokeStyle = O; c.lineWidth = 2; c.strokeRect(-2, H * 0.74, W + 4, H * 0.08); for (let x = 0; x < W; x += 40) { c.beginPath(); c.moveTo(x, H * 0.74); c.lineTo(x, H * 0.82); c.stroke(); }
    c.fillStyle = '#a6dc93'; c.fillRect(0, H * 0.82, W, H * 0.18);
  }
  lanes(c: CanvasRenderingContext2D, W: number, H: number) {
    const who: [string, Actor, number][] = [['me', this.me, 0.14], ['pa', this.pa, 0.38], ['miti', this.miti, 0.62], ['rex', this.rexA, 0.86]];
    for (const [k, a, u] of who) {
      const x = W * u; if (k === 'miti' && this.jump > 0 && this.t - this.jump < 3) { const j = (this.t - this.jump) / 3; this.put(a, x + 20, H * 0.74 - Math.sin(j * Math.PI) * H * 0.3 + (j > 0.5 ? H * 0.2 * (j - 0.5) : 0), this.sz() * 0.5, -1); a.draw(c); continue; }
      this.put(a, x, H * 0.76, this.sz() * 0.5, 1); a.draw(c);
      const fx = x + 50, fy = H * 0.5 + (k === 'me' && this.state === 'bite' ? 8 + Math.sin(this.t * 30) * 4 : Math.sin(this.t * 2 + u * 10) * 2);
      c.strokeStyle = '#555'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 18, H * 0.62); c.quadraticCurveTo(x + 40, H * 0.4, fx, fy); c.stroke(); c.strokeStyle = '#8a5d32'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 8, H * 0.72); c.lineTo(x + 18, H * 0.62); c.stroke();
      ell(c, fx, fy, 5, 5, '#e63946', true, 1); c.fillStyle = '#fff'; c.fillRect(fx - 5, fy - 1, 10, 2);
      say(c, `${this.score[k].toFixed(1)} kg`, x, H * 0.9, 13, '#2b6a9a');
      if (k === 'me' && this.state === 'bite') { say(c, '!', fx, fy - 28, 34, '#e63946'); ell(c, fx, fy, 16 + Math.sin(this.t * 20) * 3, 6, 'rgba(255,255,255,0.5)', false); }
    }
  }
  build(): Phase[] {
    return [
      { id: 'go', cap: '🎣 Concursul de pescuit! 45 de secunde. Cine prinde cele mai multe kile?', dur: 3.2, enter: () => { Sfx.play('fanfare'); }, draw: (c, W, H) => { this.lake(c, W, H); this.lanes(c, W, H); } },
      { id: 'fish', cap: '', hint: 'Când pluta se scufundă (!), atinge! Apoi atinge repede ca să tragi', max: 45,
        enter: () => { this.state = 'wait'; this.biteAt = this.t + 1.5 + this.rnd() * 2.5; },
        tap: (type) => { if (type !== 'down') return;
          if (this.state === 'bite') { this.state = 'reel'; this.reel = 0; this.stT = this.t; Sfx.play('reel'); }
          else if (this.state === 'reel') { this.reel++; Sfx.play('click', { vol: 0.4 }); }
          else if (this.state === 'wait') { this.fx.text(this.W * 0.14 + 50, this.H * 0.44, 'Prea devreme! 🐟💨', '#7a5a4a', 0.7); this.biteAt = this.t + 1.5 + this.rnd() * 2; } },
        play: dt => {
          if (this.state === 'wait' && this.t >= this.biteAt) { this.state = 'bite'; this.stT = this.t; Sfx.play('splash', { vol: 0.4, rate: 1.6 }); }
          if (this.state === 'bite' && this.t - this.stT > 0.9) { this.state = 'wait'; this.biteAt = this.t + 1.2 + this.rnd() * 2.5; this.fx.text(this.W * 0.2, this.H * 0.44, 'A scăpat! 🐟💨', '#7a5a4a', 0.8); }
          if (this.state === 'reel') { if (this.reel >= 7) { const ct = rollCatch(this.rnd); this.got('me', ct); this.send({ ct }); this.state = 'show'; this.stT = this.t; } else if (this.t - this.stT > 3) { this.state = 'wait'; this.biteAt = this.t + 1.5; this.fx.text(this.W * 0.2, this.H * 0.44, 'S-a rupt firul! 😩', '#ff4d6d', 0.8); } }
          if (this.state === 'show' && this.t - this.stT > 1.4) { this.state = 'wait'; this.biteAt = this.t + 1.2 + this.rnd() * 2.5; }
          for (const k of ['pa', 'miti', 'rex']) { if (k === 'pa' && !this.aiPlays) continue; this.aiT[k] -= dt; if (this.aiT[k] <= 0) { this.aiT[k] = k === 'miti' ? 3 + this.rnd() * 3 : k === 'rex' ? 6 + this.rnd() * 5 : 4 + this.rnd() * 4; const ct = rollCatch(this.rnd); if (k === 'miti' && ct.kg > 3) ct.kg = 1.1; this.got(k, ct); } }
          if (this.jump < 0 && this.pt > 20) { this.jump = this.t; Sfx.play('splash'); Sfx.play('cat', { delay: 0.3 }); this.feed.push({ t: this.t, txt: '🙀 Miți a sărit în apă după un pește!' }); }
          return false;
        },
        draw: (c, W, H) => { this.lake(c, W, H); this.lanes(c, W, H);
          if (this.state === 'reel') { const k = clamp(this.reel / 7); rrect(c, W * 0.14 - 50, H * 0.3, 100, 14, 7, '#fff'); rrect(c, W * 0.14 - 50, H * 0.3, 100 * k, 14, 7, '#7cc576', false); say(c, 'Trage! 💪', W * 0.14, H * 0.24, 15, '#e63946'); }
          if (this.state === 'show' && this.last) { icon(c, this.last.icon, W * 0.2, H * 0.36, 44); say(c, this.last.fish ? `${this.last.name} · ${this.last.kg} kg!` : `…${this.last.name} 😂`, W * 0.2, H * 0.26, 15, '#7a3a5a'); }
          const f = this.feed.filter(x => this.t - x.t < 3).slice(-1)[0]; if (f) this.bub(c, f.txt, W / 2, H * 0.2, 13);
          say(c, `⏱ ${Math.max(0, Math.ceil(45 - this.pt))}`, W / 2, 30, 18, '#2b6a9a'); } },
      { id: 'podium', cap: '', dur: 5, enter: () => { Sfx.play('fanfare'); Sfx.play('applause', { delay: 0.4 }); this.boom(50); },
        draw: (c, W, H) => { this.sky(c, W, H, '#8fd3ff', '#fff1d6'); this.ground(c, W, H, H * 0.7, '#a6dc93');
          const order = Object.entries(this.score).sort((a, b) => b[1] - a[1]); const act: Record<string, Actor> = { me: this.me, pa: this.pa, miti: this.miti, rex: this.rexA };
          const pos = [[0.5, 0.42], [0.3, 0.52], [0.7, 0.58]]; order.slice(0, 3).forEach(([k], i) => { const [u, v] = pos[i]; rrect(c, W * u - 50, H * v, 100, H * (0.86 - v), 6, ['#ffd23f', '#d0d6de', '#e8a36a'][i]); say(c, ['1', '2', '3'][i], W * u, H * v + 22, 24, '#7a5a4a'); this.put(act[k], W * u, H * v, this.sz() * 0.55, 1); act[k].draw(c); icon(c, ['🥇', '🥈', '🥉'][i], W * u + 30, H * v - 50, 26); say(c, `${this.score[k].toFixed(1)} kg`, W * u, H * v - 90, 14, O); });
          const place = order.findIndex(([k]) => k === 'me' || k === 'pa'); this.phases[this.pi].cap = place === 0 ? '🏆 Ați câștigat concursul! +200 lei și trofeul de aur!' : place === 1 ? '🥈 Locul doi! +100 lei' : place === 2 ? '🥉 Locul trei! +50 lei' : '😅 Miți și Rex v-au întrecut… la anul!';
          if (order[0][0] === 'miti') this.bub(c, 'Miți: „Prr… peștele e viața mea” 🐱', W * 0.5, H * 0.18, 13); } },
    ];
  }
  got(k: string, ct: Catch) {
    this.score[k] = (this.score[k] ?? 0) + ct.kg;
    if (k === 'me') { this.last = ct; if (ct.fish) { this.myFish++; Sfx.play('good'); this.me.play('love'); } else { Sfx.play('boing'); this.me.play('laugh'); } }
    else if (k === 'pa') { this.pa.play(ct.fish ? 'dance_hop' : 'laugh'); this.feed.push({ t: this.t, txt: `${this.paName}: ${ct.fish ? `${ct.name}, ${ct.kg} kg! ${ct.icon}` : `${ct.name} 😂`}` }); }
    else if (k === 'rex' && !ct.fish) this.feed.push({ t: this.t, txt: `Rex a prins ${ct.name} ${ct.icon} 😂` });
  }
  onNet(d: any) { if (d.ct) this.got('pa', d.ct); }
  endText() { return '🎣 Ce concurs!'; }
  reward() {
    const s = this.scene; if (this.myFish) s.op({ k: 'res', res: 'fish', delta: this.myFish });
    if (this.quit && this.pi < 2) return;
    const order = Object.entries(this.score).sort((a, b) => b[1] - a[1]), place = order.findIndex(([k]) => k === 'me' || k === 'pa');
    if (Hol.once(s, Hol.yearKey(s, 'contest'))) { const lei = [200, 100, 50, 0][place] ?? 0; if (lei) s.op({ k: 'money', delta: lei }); if (place === 0) s.op({ k: 'stat', key: 'trophies', delta: 1 }); s.op({ k: 'hearts', delta: 8 }); s.log(place === 0 ? 'Ați câștigat concursul de pescuit de la lac! 🏆🎣' : `Concursul de pescuit: locul ${place + 1} 🎣`); s.syncPlaced(); }
    Hol.memory(s, 'fishcontest'); Hol.feel(s, s.myId, { fun: 25, energy: -8 }); if (this.partnerAI) Hol.feel(s, s.partner.id, { fun: 25 });
  }
}

// ====================================================================== 4. Picnic pe malul lacului
const CLOUDS = [{ icon: '🐻', me: 'Un ursuleț! Seamănă cu tine 🐻', pa: 'Mie îmi pare o pizza 🍕' }, { icon: '❤️', me: 'O inimă! ❤️', pa: 'Sau un fund… 🍑 hihi' }, { icon: '🐼', me: 'O panda! 🐼', pa: 'Ce drăguță… ca tine 😳' }, { icon: '🐟', me: 'Un pește!', pa: 'Miți l-ar mânca 🐱' }, { icon: '🍦', me: 'O înghețată! 🍦', pa: 'Acum mi-e foame…' }];
export class PicnicShow extends Show {
  ants: { x: number; y: number; vx: number; vy: number; dead: number }[] = []; stolen = 0; shooed = 0; antT = 0; rexT = -1; clouds: { x: number; y: number; k: number; shape: number; t: number }[] = []; aiT = 2;
  scene3(c: CanvasRenderingContext2D, W: number, H: number) {
    this.sky(c, W, H * 0.4, '#8fd3ff', '#e6f7ff'); ell(c, W * 0.9, H * 0.1, 24, 24, '#ffd23f', false);
    for (const cl of this.clouds) { const morph = cl.shape >= 0 ? clamp((this.t - cl.t) * 2) : 0; c.globalAlpha = 0.95; for (let i = 0; i < 4; i++) ell(c, cl.x + (i - 1.5) * 22 * (1 - morph * 0.5), cl.y + (i % 2) * 6, 26 * (1 - morph * 0.4), 18 * (1 - morph * 0.4), '#fff', false); c.globalAlpha = 1; if (morph > 0) { c.globalAlpha = morph; icon(c, CLOUDS[cl.shape].icon, cl.x, cl.y, 56); c.globalAlpha = 1; } cl.x += 0.15; if (cl.x > W + 80) cl.x = -80; }
    c.fillStyle = '#5aa0c8'; c.fillRect(0, H * 0.4, W, H * 0.14); this.ground(c, W, H, H * 0.54, '#a6dc93');
    // patura in carouri
    const bx = W * 0.25, by = H * 0.62, bw = W * 0.5, bh = H * 0.3; c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); c.fillStyle = '#fff'; c.fillRect(bx, by, bw, bh); c.fillStyle = '#ff7aa2'; for (let i = 0; i < 10; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) c.fillRect(bx + i * bw / 10, by + j * bh / 5, bw / 10, bh / 5); c.restore(); c.strokeStyle = O; c.lineWidth = 2; c.strokeRect(bx, by, bw, bh);
    icon(c, '🧺', W * 0.5, H * 0.7, 40); if (this.stolen < 3) icon(c, '🥪', W * 0.4, H * 0.76, 28); if (this.stolen < 2) icon(c, '🍉', W * 0.6, H * 0.77, 30); if (this.stolen < 1) icon(c, '🧃', W * 0.55, H * 0.68, 22); icon(c, '🌭', W * 0.45, H * 0.85, 22);
  }
  couple(c: CanvasRenderingContext2D, W: number, H: number, lie = false) { const s = this.sz() * 0.6; this.put(this.bubu, W * 0.3, H * 0.84, s, 1); this.put(this.dudu, W * 0.7, H * 0.84, s, -1); if (lie) { for (const [a, x] of [[this.bubu, W * 0.36], [this.dudu, W * 0.64]] as const) { c.save(); c.translate(x, H * 0.8); c.rotate(x < W / 2 ? -1.4 : 1.4); c.translate(-x, -H * 0.8); this.put(a, x, H * 0.8, s, x < W / 2 ? 1 : -1); a.draw(c); c.restore(); } return; } this.bubu.draw(c); this.dudu.draw(c); }
  build(): Phase[] {
    const rex = this.villagers('none').find(a => (a as any).vid === 'rex')!; this.guests = [rex];
    for (let i = 0; i < 5; i++) this.clouds.push({ x: i * 200 % 900, y: 40 + (i % 3) * 30, k: i, shape: -1, t: 0 });
    return [
      { id: 'set', cap: '🧺 Picnic pe malul lacului: sandvișuri, pepene și limonadă!', dur: 3, enter: () => { Sfx.play('birds'); this.bubu.play('dance_hop'); this.dudu.play('love'); }, draw: (c, W, H) => { this.scene3(c, W, H); this.couple(c, W, H); } },
      { id: 'ants', cap: '🐜 Furnicile vin după mâncare! Alungă-le!', hint: 'Atinge furnicile', max: 18,
        tap: (type, x, y) => { if (type !== 'down') return; const a = this.ants.find(q => !q.dead && Math.hypot(q.x - x, q.y - y) < 26); if (a) { a.dead = this.t; this.shooed++; Sfx.play('pop'); this.fx.text(a.x, a.y - 10, 'Pa! 👋', '#7a5a4a', 0.7); this.send({ ant: 1 }); } },
        play: dt => {
          this.antT -= dt; if (this.antT <= 0) { this.antT = 0.7; const side = Math.random() < 0.5; const x = side ? -10 : this.W + 10, y = this.H * (0.62 + Math.random() * 0.3); const tx = this.W * 0.5, ty = this.H * 0.74, d = Math.hypot(tx - x, ty - y); this.ants.push({ x, y, vx: (tx - x) / d * 45, vy: (ty - y) / d * 45, dead: 0 }); }
          for (const a of this.ants) { if (a.dead) { a.y -= dt * 120; a.x += dt * 60; continue; } a.x += a.vx * dt; a.y += a.vy * dt; if (Math.hypot(a.x - this.W * 0.5, a.y - this.H * 0.74) < 30) { a.dead = this.t; this.stolen++; Sfx.play('bad'); this.fx.text(this.W * 0.5, this.H * 0.6, 'Au furat o bucățică! 🐜', '#ff4d6d', 0.8); } }
          if (this.aiPlays) { this.aiT -= dt; if (this.aiT <= 0) { this.aiT = 0.9; const a = this.ants.find(q => !q.dead && q.x > this.W * 0.55); if (a) { a.dead = this.t; this.dudu.play('act_collect'); } } }
          if (this.rexT < 0 && this.pt > 9) { this.rexT = this.t; Sfx.play('dog'); }
          return false;
        },
        draw: (c, W, H) => { this.scene3(c, W, H); this.couple(c, W, H); for (const a of this.ants) { if (a.dead && this.t - a.dead > 1) continue; c.save(); c.translate(a.x, a.y); c.rotate(Math.atan2(a.vy, a.vx) + (a.dead ? this.t * 10 : 0)); c.fillStyle = '#2b2b33'; for (const dx of [-5, 0, 5]) { c.beginPath(); c.arc(dx, 0, 3, 0, 7); c.fill(); } c.strokeStyle = '#2b2b33'; c.lineWidth = 1; for (const dx of [-3, 2]) { c.beginPath(); c.moveTo(dx, -5); c.lineTo(dx, 5); c.stroke(); } c.restore(); }
          if (this.rexT > 0 && this.t - this.rexT < 4) { const k = (this.t - this.rexT) / 4, x = lerp(W + 40, -40, k); this.put(this.guests[0], x, H * 0.86, this.sz() * 0.55, -1); this.guests[0].draw(c); icon(c, '🌭', x - 20, H * 0.86 - 40, 22); this.bub(c, 'Rex a furat un cârnat! 🐶🌭', x, H * 0.5, 13); }
          say(c, `🐜 ${this.shooed}`, 70, 30, 16, '#2b6a9a'); } },
      { id: 'clouds', cap: '☁️ Întinși pe pătură… la ce seamănă norii?', hint: 'Atinge un nor', max: 14,
        tap: (type, x, y) => { if (type !== 'down') return; const cl = this.clouds.find(q => q.shape < 0 && Math.abs(q.x - x) < 60 && Math.abs(q.y - y) < 40); if (cl) { cl.shape = cl.k % CLOUDS.length; cl.t = this.t; Sfx.play('chimes', { vol: 0.5 }); const L = CLOUDS[cl.shape]; this.fx.text(x, y + 50, `${this.myName}: ${L.me}`, '#7a3a5a', 0.8); setTimeout(() => this.fx.text(x, y + 80, `${this.paName}: ${L.pa}`, '#2b6a9a', 0.8), 1000); } },
        play: () => this.clouds.filter(q => q.shape >= 0).length >= 3 && this.pt > 4,
        draw: (c, W, H) => { this.scene3(c, W, H); this.couple(c, W, H, true); } },
      { id: 'hug', cap: '💕 Cea mai frumoasă după-amiază de vară', dur: 3.4, enter: () => { this.bubu.play('love'); this.dudu.play('love'); Sfx.play('kiss'); this.fx.hearts(this.W / 2, this.H * 0.7, 14); }, draw: (c, W, H) => { this.scene3(c, W, H); this.couple(c, W, H, true); } },
    ];
  }
  onNet(d: any) { if (d.ant) { const a = this.ants.find(q => !q.dead && q.x > this.W * 0.5); if (a) a.dead = this.t; } }
  endText() { return '🧺 Ce picnic frumos!'; }
  reward() { const s = this.scene; Hol.memory(s, 'picnic'); Hol.feelBoth(s, { hunger: 30, fun: 25, love: 20, energy: 8 }); s.op({ k: 'hearts', delta: 6 }); }
}

// ====================================================================== 5. Lozul norocos (negustorul ambulant)
const SYM = ['🍀', '💰', '🐻', '🐼', '🍋', '⭐'];
export class LozShow extends Show {
  cells: { s: number; cover: number }[] = []; win = -1; prize = 0; rects: { x: number; y: number; w: number; h: number }[] = []; down = false;
  constructor(scene: any, done: (s: number) => void) {
    super(scene, done);
    const r = seeded((scene.w.stats.loz ?? 0) * 977 + scene.w.day * 31 + 3); const roll = r();
    this.win = roll < 0.06 ? 5 : roll < 0.16 ? 1 : roll < 0.3 ? 0 : roll < 0.4 ? (r() < 0.5 ? 2 : 3) : -1;
    const syms: number[] = this.win >= 0 ? [this.win, this.win, this.win] : [4, 4];
    while (syms.length < 6) { const s2 = Math.floor(r() * SYM.length); if (syms.filter(x => x === s2).length < 2) syms.push(s2); }
    for (let i = syms.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [syms[i], syms[j]] = [syms[j], syms[i]]; }
    this.cells = syms.map(s2 => ({ s: s2, cover: 1 })); this.prize = this.win === 5 ? 300 : this.win === 1 ? 100 : this.win === 0 ? 50 : this.win >= 2 ? 30 : 0;
  }
  card(c: CanvasRenderingContext2D, W: number, H: number) {
    this.sky(c, W, H, '#7a3a8a', '#c77dff'); const cw = Math.min(W * 0.8, 520), ch = Math.min(H * 0.62, 260), x0 = W / 2 - cw / 2, y0 = H * 0.18;
    rrect(c, x0, y0, cw, ch, 18, '#ffd23f'); say(c, '🎟️ LOZUL NOROCOS · 3 la fel = câștigi!', W / 2, y0 + 22, 15, '#7a3a5a');
    this.rects = []; this.cells.forEach((cl, i) => { const w = (cw - 40) / 3 - 10, h = (ch - 60) / 2 - 10, x = x0 + 20 + (i % 3) * (w + 15), y = y0 + 46 + Math.floor(i / 3) * (h + 10); this.rects.push({ x, y, w, h }); rrect(c, x, y, w, h, 10, '#fff'); icon(c, SYM[cl.s], x + w / 2, y + h / 2, Math.min(w, h) * 0.6); if (cl.cover > 0) { c.globalAlpha = cl.cover; rrect(c, x, y, w, h, 10, '#b8bec8'); for (let k = 0; k < 5; k++) { c.fillStyle = '#d0d6de'; c.fillRect(x + 6 + k * w / 5, y + 6, 4, h - 12); } say(c, '?', x + w / 2, y + h / 2, 26, '#7a8a99'); c.globalAlpha = 1; } });
  }
  build(): Phase[] {
    return [
      { id: 'scratch', cap: '🪙 Răzuiește cele 6 căsuțe! (trage cu degetul)', hint: 'Răzuiește!', max: 60,
        tap: (type, x, y) => { if (type === 'down') this.down = true; if (type === 'up') { this.down = false; return; } if (!this.down && type === 'move') return; const i = this.rects.findIndex(r => this.hit(r, x, y)); if (i >= 0 && this.cells[i].cover > 0) { this.cells[i].cover = Math.max(0, this.cells[i].cover - (type === 'down' ? 0.25 : 0.08)); if (Math.random() < 0.3) Sfx.play('cloth', { vol: 0.4, rate: 1.6 }); if (this.cells[i].cover <= 0.3) this.cells[i].cover = 0; } },
        play: () => this.cells.every(c2 => c2.cover <= 0),
        draw: (c, W, H) => { this.card(c, W, H); } },
      { id: 'res', cap: '', dur: 3.6, enter: () => { if (this.prize) { Sfx.play('victory'); this.boom(this.prize >= 100 ? 100 : 40); this.me.play('dance_hop'); } else { Sfx.play('boing'); this.me.play('laugh'); } },
        draw: (c, W, H) => { this.card(c, W, H); this.phases[this.pi].cap = this.prize >= 300 ? '⭐⭐⭐ MARELE PREMIU! +300 lei!!!' : this.prize ? `${SYM[this.win].repeat(3)} Ai câștigat ${this.prize} lei! 🎉` : '🍋🍋 Lămâi… Ești o lămâie norocoasă, dar nu azi 😅'; } },
    ];
  }
  endText() { return this.prize ? `+${this.prize} lei! 🎟️` : 'Data viitoare! 🍀'; }
  reward() { const s = this.scene; s.op({ k: 'stat', key: 'loz', delta: 1 }); if (this.prize && !this.quit) s.op({ k: 'money', delta: this.prize }); else if (this.prize && this.quit) s.op({ k: 'money', delta: this.prize }); }
}
void ease;
