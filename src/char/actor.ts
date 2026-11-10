import { basePose, type Pose, type EyeType, type MouthType } from './pose';
import { drawCharacter, SPECS, type CharId, type CharSpec } from './draw';
import { ANIMS, IDLE, WALK, RUN, type Anim, type LocalFx } from './anims';
import type { Fx } from './fx';
import { Sfx } from '../engine/sfx';
import type { Outfit } from './outfit';

/** Starea emotionala de baza (influenteaza fata cand nu ruleaza un emote). */
export type Mood = 'happy' | 'calm' | 'sad' | 'angry' | 'sleepy' | 'sick' | 'hungry' | 'love' | 'sulky' | 'cold';

/** sunetele scoase de personaj la unele emotii (fata / baiat) */
const VOICE: Record<string, string | [string, string]> = {
  laugh: 'giggle', sick: 'cough', sleep: 'yawn', cry: 'sniff', dizzy: 'boing', faint: 'jump_land',
  shy: 'gasp', tantrum: 'jump_land', flex: 'cloth', puppy: 'sniff', boba: 'drink', hungry: 'gulp',
};

const MOOD_FACE: Record<Mood, Partial<Pose>> = {
  happy: { eyes: 'dot', mouth: 'open', blush: 1 },
  calm: { eyes: 'dot', mouth: 'w', blush: 0.9 },
  sad: { eyes: 'sad', mouth: 'frown', brows: 'sad', blush: 0.4, headDy: 2 },
  angry: { eyes: 'angry', mouth: 'frown', brows: 'angry', vein: 0.7, blush: 0.9 },
  sleepy: { eyes: 'half', mouth: 'o', blush: 0.4, headDy: 2, snot: 0.4 },
  sick: { eyes: 'half', mouth: 'wavy', brows: 'sad', sickTint: 0.8, sweat: 0.6, blush: 1 },
  hungry: { eyes: 'dot', mouth: 'drool', brows: 'up', blush: 0.5 },
  love: { eyes: 'happy', mouth: 'w', blush: 1.2 },
  sulky: { eyes: 'side', mouth: 'flat', brows: 'angry', blush: 1.0 },
  cold: { eyes: 'strain', mouth: 'wavy', brows: 'sad', blush: 0.3, snot: 0.5 },
};

export class Actor {
  spec: CharSpec;
  x = 0; y = 0; scale = 1; flip: 1 | -1 = 1;
  mood: Mood = 'happy';
  anim: Anim = IDLE; animT = 0; private lastP = 0;
  baseT = Math.random() * 10;
  moving = false;
  running = false;
  pose: Pose = basePose();
  private blinkT = 2 + Math.random() * 2;
  private onDone?: () => void;
  shakeReq = 0;
  outfit?: Outfit;

  constructor(id: CharId, public fx: Fx, spec?: CharSpec) { this.spec = spec ?? SPECS[id]; }

  get id() { return this.spec.id; }
  get busy() { return this.anim !== IDLE && this.anim !== WALK && this.anim !== RUN; }

  /** cat de tare se aud sunetele lui (0 = e in alta zona); il seteaza lumea */
  audible?: () => number;
  /** efectele vizuale (nori, texte, inimi) se arata? (partenerul pe alta harta: nu) */
  fxOn?: () => boolean;
  play(id: string, onDone?: () => void) {
    const a = ANIMS[id]; if (!a) return;
    this.anim = a; this.animT = 0; this.lastP = -1; this.onDone = onDone;
    // vocea: Bubu (fata) si Dudu (baiat) au rasete diferite; ceilalti au tonul lor
    const v = VOICE[id];
    if (v) {
      const k = this.audible?.() ?? 1;
      const girl = this.spec.id === 'bubu' || (this.spec.id !== 'dudu' && (this.spec.accessory === 'bow' || /Leana|Ina|Rita|Bunica|Doamna/.test(this.spec.name)));
      const snd = typeof v === 'string' ? v : girl ? v[0] : v[1];
      // tonul vocii: Bubu subtire, Dudu mai gros; la ras doua chicoteli ("hi-hi")
      const rate = this.spec.id === 'bubu' ? 1.18 : this.spec.id === 'dudu' ? 0.82 : girl ? 1.25 : 0.95;
      if (k > 0.02) { Sfx.play(snd, { vol: 0.6 * k, rate }); if (id === 'laugh') Sfx.play('giggle', { vol: 0.5 * k, rate: rate * 1.05, delay: 0.32 }); }
    }
  }
  stop() { this.anim = IDLE; this.animT = 0; this.onDone = undefined; }

  private local(): LocalFx {
    const tx = (lx: number) => this.x + lx * this.scale * this.flip;
    const ty = (ly: number) => this.y + ly * this.scale;
    const s = this.scale;
    if (this.fxOn && !this.fxOn()) { const no = () => { /* nu se vede de aici */ }; return { emit: no, burst: no, hearts: no, fart: no, text: no, shake: no, sound: id => { const v = this.audible?.() ?? 1; if (v > 0.02) Sfx.play(id, { vol: v }); } }; }
    return {
      emit: (k, lx, ly, o = {}) => this.fx.emit(k, tx(lx), ty(ly), { ...o, vx: (o.vx ?? 0) * this.flip * s, vy: (o.vy ?? -20) * s, size: (o.size ?? 1) * s, grav: (o.grav ?? 0) * s }),
      burst: (k, lx, ly, n, sp, spd, o = {}) => {
        let rot = o.rot ?? -Math.PI / 2;
        if (this.flip < 0) rot = Math.PI - rot;
        this.fx.burst(k, tx(lx), ty(ly), n, sp, spd * s, { ...o, rot, size: (o.size ?? 1) * s, grav: (o.grav ?? 0) * s });
      },
      hearts: (lx, ly, n) => this.fx.hearts(tx(lx), ty(ly), n),
      fart: (lx, ly, big = 1) => this.fx.fart(tx(lx), ty(ly), big * s, lx * this.flip >= 0 ? 1 : -1),
      text: (lx, ly, str, c, size = 1) => this.fx.text(tx(lx), ty(ly), str, c, size * s),
      shake: a => { this.shakeReq = Math.max(this.shakeReq, a); },
      sound: id => { const v = this.audible?.() ?? 1; if (v > 0.02) Sfx.play(id, { vol: v }); },
    };
  }

  update(dt: number) {
    this.baseT += dt;
    // animatia de baza
    if (!this.busy) { const want = this.moving ? (this.running ? RUN : WALK) : IDLE; if (this.anim !== want) { this.anim = want; } }
    this.animT += dt;
    const a = this.anim;
    let p = Math.min(1, this.animT / a.dur);
    if (a.loop) p = (this.animT % a.dur) / a.dur;
    const lf = this.local();
    if (a.events) {
      for (const [at, fn] of a.events) {
        const crossed = a.loop ? (this.lastP > p ? (at > this.lastP || at <= p) : (at > this.lastP && at <= p)) : (at > this.lastP && at <= p);
        if (crossed) fn(lf);
      }
    }
    a.tick?.(lf, this.animT, p, dt);
    this.lastP = p;

    // compune poza
    const P = basePose();
    Object.assign(P, MOOD_FACE[this.mood]);
    IDLE.pose(P, this.baseT, 0);
    if (a !== IDLE) a.pose(P, a.loop ? this.animT : this.animT, p);

    // clipit (doar cand ochii sunt deschisi normal)
    this.blinkT -= dt;
    if (this.blinkT < 0) { if (this.blinkT < -0.12) this.blinkT = 2.5 + Math.random() * 3; else if (P.eyes === 'dot' || P.eyes === 'sad' || P.eyes === 'angry') P.eyes = 'closed'; }
    if (this.mood === 'cold' && !this.busy) { P.dx += (Math.random() - 0.5) * 2.2; P.armL = P.armR = -0.6; P.sickTint = 0; }
    this.pose = P;

    if (!a.loop && this.animT >= a.dur && this.busy) {
      const cb = this.onDone; this.stop(); cb?.();
    }
  }

  setFace(eyes: EyeType, mouth: MouthType) { this.pose.eyes = eyes; this.pose.mouth = mouth; }

  draw(ctx: CanvasRenderingContext2D) {
    drawCharacter(ctx, this.spec, this.pose, this.x, this.y, this.scale, this.flip, this.baseT, this.outfit);
  }
}
