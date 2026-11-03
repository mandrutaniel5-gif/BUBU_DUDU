import { basePose, type Pose, type EyeType, type MouthType } from './pose';
import { drawCharacter, SPECS, type CharId, type CharSpec } from './draw';
import { ANIMS, IDLE, WALK, type Anim, type LocalFx } from './anims';
import type { Fx } from './fx';
import { Sfx } from '../engine/sfx';

/** Starea emotionala de baza (influenteaza fata cand nu ruleaza un emote). */
export type Mood = 'happy' | 'calm' | 'sad' | 'angry' | 'sleepy' | 'sick' | 'hungry' | 'love' | 'sulky';

const MOOD_FACE: Record<Mood, Partial<Pose>> = {
  happy: { eyes: 'dot', mouth: 'w', blush: 0.7 },
  calm: { eyes: 'dot', mouth: 'smile', blush: 0.5 },
  sad: { eyes: 'sad', mouth: 'frown', brows: 'sad', blush: 0.4, headDy: 2 },
  angry: { eyes: 'angry', mouth: 'frown', brows: 'angry', vein: 0.7, blush: 0.9 },
  sleepy: { eyes: 'half', mouth: 'o', blush: 0.4, headDy: 2, snot: 0.4 },
  sick: { eyes: 'half', mouth: 'wavy', brows: 'sad', sickTint: 0.8, sweat: 0.6, blush: 1 },
  hungry: { eyes: 'dot', mouth: 'drool', brows: 'up', blush: 0.5 },
  love: { eyes: 'happy', mouth: 'w', blush: 1.2 },
  sulky: { eyes: 'side', mouth: 'flat', brows: 'angry', blush: 1.0 },
};

export class Actor {
  spec: CharSpec;
  x = 0; y = 0; scale = 1; flip: 1 | -1 = 1;
  mood: Mood = 'happy';
  anim: Anim = IDLE; animT = 0; private lastP = 0;
  baseT = Math.random() * 10;
  moving = false;
  pose: Pose = basePose();
  private blinkT = 2 + Math.random() * 2;
  private onDone?: () => void;
  shakeReq = 0;

  constructor(id: CharId, public fx: Fx) { this.spec = SPECS[id]; }

  get id() { return this.spec.id; }
  get busy() { return this.anim !== IDLE && this.anim !== WALK; }

  play(id: string, onDone?: () => void) {
    const a = ANIMS[id]; if (!a) return;
    this.anim = a; this.animT = 0; this.lastP = -1; this.onDone = onDone;
  }
  stop() { this.anim = IDLE; this.animT = 0; this.onDone = undefined; }

  private local(): LocalFx {
    const tx = (lx: number) => this.x + lx * this.scale * this.flip;
    const ty = (ly: number) => this.y + ly * this.scale;
    const s = this.scale;
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
      sound: id => Sfx.play(id),
    };
  }

  update(dt: number) {
    this.baseT += dt;
    // animatia de baza
    if (!this.busy) this.anim = this.moving ? WALK : IDLE;
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
    this.pose = P;

    if (!a.loop && this.animT >= a.dur && this.busy) {
      const cb = this.onDone; this.stop(); cb?.();
    }
  }

  setFace(eyes: EyeType, mouth: MouthType) { this.pose.eyes = eyes; this.pose.mouth = mouth; }

  draw(ctx: CanvasRenderingContext2D) {
    drawCharacter(ctx, this.spec, this.pose, this.x, this.y, this.scale, this.flip, this.baseT);
  }
}
