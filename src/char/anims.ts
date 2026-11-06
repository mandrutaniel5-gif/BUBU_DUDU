import { Pose, ease, easeOutBack, seg, bump, wave, lerp, clamp } from './pose';
import type { CharId } from './draw';
import type { FxKind, Particle } from './fx';

/** API de efecte in coordonatele locale ale personajului (origine = picioare). */
export interface LocalFx {
  emit(kind: FxKind, lx: number, ly: number, o?: Partial<Particle>): void;
  burst(kind: FxKind, lx: number, ly: number, n: number, spread: number, speed: number, o?: Partial<Particle>): void;
  hearts(lx: number, ly: number, n?: number): void;
  fart(lx: number, ly: number, big?: number): void;
  text(lx: number, ly: number, s: string, color?: string, size?: number): void;
  shake(amount: number): void;
  sound(id: string): void;
}

export interface Anim {
  id: string;
  label: string;       // textul din meniu (RO)
  icon: string;        // emoji pentru buton
  who: CharId | 'both';
  kind: 'emote' | 'dance' | 'special' | 'reaction' | 'base';
  dur: number;
  loop?: boolean;
  pose(P: Pose, t: number, p: number): void;
  events?: [number, (fx: LocalFx) => void][]; // [progres 0..1, efect]
  tick?: (fx: LocalFx, t: number, p: number, dt: number) => void;
}

const A: Anim[] = [];
const def = (a: Anim) => { A.push(a); return a; };

/** emitere periodica in tick: adevarat o data la fiecare `every` secunde */
const every = (t: number, dt: number, period: number, offset = 0) =>
  Math.floor((t - offset) / period) !== Math.floor((t - dt - offset) / period) && t >= offset;

// ---------------------------------------------------------------- baza
export const IDLE = def({
  id: 'idle', label: 'Stă', icon: '🙂', who: 'both', kind: 'base', dur: 4, loop: true,
  pose(P, t) {
    const b = wave(t, 0.45, 1);
    P.sy = 1 + b * 0.022; P.sx = 1 - b * 0.012;
    P.headDy = b * 0.8;
    P.armL = 0.55 + wave(t, 0.45, 0.05); P.armR = 0.55 + wave(t, 0.45, 0.05, 1);
  },
});

export const WALK = def({
  id: 'walk', label: 'Merge', icon: '🚶', who: 'both', kind: 'base', dur: 0.6, loop: true,
  pose(P, t) {
    const s = Math.sin(t * Math.PI * 2 / 0.6);
    P.legL = Math.max(0, s) * 6; P.legR = Math.max(0, -s) * 6;
    P.dy = -Math.abs(s) * 3.5;
    P.armL = 0.3 + s * 0.45; P.armR = 0.3 - s * 0.45;
    P.rot = s * 0.05; P.headRot = -s * 0.04;
    P.mouth = 'w';
  },
});

export const RUN = def({
  id: 'run', label: 'Fuge', icon: '🏃', who: 'both', kind: 'base', dur: 0.36, loop: true,
  pose(P, t) {
    const s = Math.sin(t * Math.PI * 2 / 0.36);
    P.legL = Math.max(0, s) * 9; P.legR = Math.max(0, -s) * 9;
    P.legLx = s * 3; P.legRx = -s * 3;
    P.dy = -Math.abs(s) * 6; P.sy = 1 - Math.abs(s) * 0.03; P.sx = 1 + Math.abs(s) * 0.02;
    P.armL = 0.9 + s * 0.8; P.armR = 0.9 - s * 0.8;
    P.rot = 0.12; P.headRot = -0.06 + s * 0.03;
    P.mouth = 'open'; P.eyes = 'happy'; P.blush = 1.1; P.earWiggle = s;
  },
  tick(f, t, _p, dt) { if (every(t, dt, 0.18)) f.emit('puff', -14 + Math.random() * 8, -2, { vx: -30, vy: -12, max: 0.5, size: 0.45 }); },
});

// ---------------------------------------------------------------- emote-uri comune
def({
  id: 'wave', label: 'Salut', icon: '👋', who: 'both', kind: 'emote', dur: 1.8,
  pose(P, t, p) {
    const up = ease(seg(p, 0, 0.15)) * (1 - ease(seg(p, 0.85, 1)));
    P.armR = lerp(0.55, 1.95 + wave(t, 2.6, 0.3), up);
    P.eyes = 'happy'; P.mouth = 'open'; P.blush = 0.8;
    P.headRot = up * 0.1; P.dy = -bump(p, 0, 0.18) * 8; P.earWiggle = wave(t, 3, up);
  },
  events: [[0.05, f => f.text(26, -110, 'Hei!', '#ff7a59')]],
});

def({
  id: 'love', label: 'Te iubesc', icon: '🥰', who: 'both', kind: 'emote', dur: 2.6,
  pose(P, t, p) {
    const up = ease(seg(p, 0, 0.18)) * (1 - ease(seg(p, 0.86, 1)));
    P.armL = P.armR = lerp(0.55, 1.55 + Math.sin(t * 6) * 0.15, up);
    P.eyes = 'heart'; P.mouth = 'w'; P.blush = 1.3;
    P.rot = wave(t, 0.9, 0.06) * up; P.headRot = wave(t, 0.9, 0.08, 1) * up;
    P.dy = -Math.abs(wave(t, 1.8, 3)) * up;
  },
  events: [[0.25, f => f.hearts(0, -118, 4)], [0.5, f => f.hearts(0, -118, 4)], [0.75, f => f.hearts(0, -118, 5)]],
});

def({
  id: 'laugh', label: 'Râde', icon: '🤣', who: 'both', kind: 'emote', dur: 2.2,
  pose(P, t, p) {
    const k = 1 - ease(seg(p, 0.85, 1));
    P.dy = -Math.abs(Math.sin(t * 13)) * 5 * k;
    P.sy = 1 - Math.abs(Math.sin(t * 13)) * 0.04 * k;
    P.eyes = 'happy'; P.mouth = 'grin'; P.blush = 1;
    P.armL = P.armR = lerp(0.25, -0.55, k);
    P.rot = wave(t, 1.4, 0.09) * k; P.headRot = -0.12 * k; P.tears = 0.15 * k;
  },
  events: [[0.08, f => f.text(-30, -108, 'HA', '#ff9f1c')], [0.35, f => f.text(30, -112, 'HAHA', '#ff9f1c')], [0.62, f => f.text(-24, -116, 'HIHI', '#ff9f1c')]],
});

def({
  id: 'cry', label: 'Plânge', icon: '😭', who: 'both', kind: 'emote', dur: 2.8,
  pose(P, t, p) {
    const k = ease(seg(p, 0, 0.12)) * (1 - ease(seg(p, 0.88, 1)));
    P.eyes = 'cry'; P.mouth = Math.sin(t * 9) > -0.3 ? 'scream' : 'wavy'; P.brows = 'sad';
    P.tears = k; P.dx = wave(t, 9, 1.2) * k;
    P.armL = P.armR = lerp(0.25, 2.55, k);
    P.headDy = 2 * k + wave(t, 4, 1.2) * k; P.sy = 1 - 0.03 * k; P.blush = 0.9;
  },
  events: [[0.1, f => f.text(0, -116, 'BUAAA!', '#4ea8de', 1.1)], [0.55, f => f.text(0, -116, 'BUAAA!', '#4ea8de', 1.1)]],
});

def({
  id: 'angry', label: 'Supărat', icon: '😤', who: 'both', kind: 'emote', dur: 2.6,
  pose(P, t, p) {
    const k = ease(seg(p, 0, 0.1)) * (1 - ease(seg(p, 0.9, 1)));
    P.armL = P.armR = lerp(0.25, -1.05, k);
    P.eyes = 'angry'; P.brows = 'angry'; P.mouth = 'frown'; P.vein = k;
    P.headRot = -0.18 * k; P.pupilDx = -3 * k; P.blush = 0.9 + k * 0.4;
    const st = Math.max(0, Math.sin(t * 9));
    P.legR = st * 7 * k; P.dy = -st * 1.5 * k; P.sx = 1 + 0.03 * k;
  },
  events: [[0.15, f => f.text(0, -116, 'Hmpf!', '#e63946')]],
  tick(f, t, _p, dt) { if (every(t, dt, 0.35)) { f.emit('steam', -30, -95, { vx: -25, vy: -30, max: 0.9 }); f.emit('steam', 30, -95, { vx: 25, vy: -30, max: 0.9 }); } },
});

def({
  id: 'shy', label: 'Rușinat', icon: '☺️', who: 'both', kind: 'emote', dur: 2.6,
  pose(P, t, p) {
    const k = ease(seg(p, 0, 0.15)) * (1 - ease(seg(p, 0.88, 1)));
    P.blush = 0.6 + k * 1.1; P.eyes = 'happy'; P.mouth = 'w';
    P.armL = P.armR = lerp(0.25, -0.45, k);
    P.rot = wave(t, 0.7, 0.07) * k; P.headRot = 0.16 * k; P.headDy = 3 * k;
    P.legRx = wave(t, 1.4, 2.5) * k; P.legR = Math.max(0, wave(t, 1.4, 3)) * k;
  },
  events: [[0.2, f => f.burst('sparkle', 0, -90, 5, 2.4, 50, { color: '#ffb3c6' })]],
});

def({
  id: 'sleep', label: 'Somnoros', icon: '😴', who: 'both', kind: 'emote', dur: 3.6,
  pose(P, t, p) {
    const k = ease(seg(p, 0, 0.12)) * (1 - ease(seg(p, 0.9, 1)));
    P.eyes = k > 0.3 ? 'closed' : 'half'; P.mouth = 'o';
    P.headRot = 0.22 * k; P.headDy = 4 * k + wave(t, 0.5, 1.5) * k;
    P.sy = 1 + wave(t, 0.5, 0.04) * k; P.snot = k * (0.6 + 0.4 * Math.sin(t * 3));
    P.armL = P.armR = 0.1; P.rot = 0.04 * k; P.blush = 0.4;
  },
  tick(f, t, _p, dt) { if (every(t, dt, 0.7, 0.3)) f.emit('zzz', 26, -100, { vx: 12, vy: -22, max: 1.6, size: 0.8 + Math.random() * 0.5 }); },
});

def({
  id: 'hungry', label: 'Mi-e foame', icon: '🤤', who: 'both', kind: 'emote', dur: 2.8,
  pose(P, t, p) {
    const k = ease(seg(p, 0, 0.1)) * (1 - ease(seg(p, 0.9, 1)));
    P.armR = lerp(0.25, -0.85 + wave(t, 2, 0.28), k); P.armL = lerp(0.25, -0.5, k);
    P.mouth = 'drool'; P.eyes = 'dot'; P.pupilDy = -2 * k; P.brows = 'up';
    P.sweat = 0.7 * k; P.sx = 1 + bump(p, 0.3, 0.45) * 0.06;
  },
  events: [[0.32, f => { f.text(-34, -40, 'Ghiorț!', '#8d6e63'); f.burst('rumble', 0, -28, 4, 6, 20, { max: 0.6 }); }],
           [0.7, f => f.text(30, -110, 'Pa-pa?', '#ff7a59')]],
});

def({
  id: 'sick', label: 'Bolnav', icon: '🤒', who: 'both', kind: 'emote', dur: 3.2,
  pose(P, t, p) {
    const k = ease(seg(p, 0, 0.12)) * (1 - ease(seg(p, 0.9, 1)));
    P.sickTint = k; P.eyes = 'half'; P.mouth = 'wavy'; P.brows = 'sad'; P.sweat = k;
    P.dx = wave(t, 14, 0.8) * k; P.armR = lerp(0.25, 2.45, k); P.propR = k > 0.2 ? 'thermometer' : 'none'; P.propRotR = 0.5;
    P.armL = lerp(0.25, 1.0, k); P.propL = k > 0.2 ? 'tissue' : 'none'; P.headDy = 3 * k; P.blush = 1.2 * k;
  },
  events: [[0.4, f => f.text(0, -116, 'Mă doare tot...', '#7cb342', 0.8)]],
});

def({
  id: 'sneeze', label: 'Hapciu', icon: '🤧', who: 'both', kind: 'emote', dur: 2.2,
  pose(P, t, p) {
    const build = ease(seg(p, 0, 0.5));
    const snap = seg(p, 0.5, 0.56);
    const after = 1 - ease(seg(p, 0.6, 1));
    if (p < 0.5) {
      P.headRot = -0.28 * build; P.headDy = -4 * build; P.sy = 1 + 0.06 * build;
      P.eyes = build > 0.5 ? 'strain' : 'half'; P.mouth = build > 0.3 ? 'o' : 'flat';
      P.dx = wave(t, 10, build * 0.8);
    } else {
      const k = Math.max(after, 0);
      P.headRot = 0.3 * k; P.rot = 0.16 * k * (snap < 1 ? snap : 1); P.dy = 0;
      P.eyes = 'cry'; P.mouth = p < 0.7 ? 'scream' : 'wavy'; P.snot = 0.7 * k; P.sy = 1 - 0.07 * k;
      P.dx = -6 * k;
    }
    P.blush = 0.9; P.armL = P.armR = 0.4;
  },
  events: [[0.5, f => { f.burst('drop', 0, -52, 18, 1.2, 160, { rot: Math.PI / 2, grav: 200, max: 0.8, color: '#bde7ff' }); f.text(0, -118, 'HAPCIU!', '#4ea8de', 1.2); f.shake(5); f.sound('sneeze'); }]],
});

def({
  id: 'fart', label: 'Pârț', icon: '💨', who: 'both', kind: 'emote', dur: 2.4,
  pose(P, t, p) {
    const build = ease(seg(p, 0, 0.45));
    if (p < 0.47) {
      P.sy = 1 - 0.1 * build; P.sx = 1 + 0.07 * build; P.eyes = 'strain'; P.mouth = 'flat';
      P.sweat = build; P.blush = 0.8 + build * 0.6; P.dx = wave(t, 16, 1.2 * build);
      P.armL = P.armR = lerp(0.25, -0.4, build); P.legL = P.legR = 0;
    } else {
      const r = 1 - ease(seg(p, 0.85, 1));
      P.dy = -bump(p, 0.47, 0.62) * 14; P.sy = 1 + bump(p, 0.47, 0.6) * 0.08;
      P.eyes = 'happy'; P.mouth = 'smirk'; P.blush = 1.2 * r + 0.5;
      P.armL = P.armR = 0.5; P.rot = wave(t, 1.5, 0.05) * r;
    }
  },
  events: [[0.47, f => { f.fart(-16, -14, 1.2); f.fart(16, -14, 1.2); f.text(0, -118, 'PÂRȚ!', '#7cb342', 1.2); f.shake(3); f.sound('fart'); }],
           [0.72, f => f.text(26, -112, 'Ups... hihi', '#8d6e63', 0.7)]],
});

def({
  // super-basina: te ghemuiesti si te umfli, BUM (nor verde mare, unda pe jos), zbori sus facand o tumba, aterizezi, apoi „Ahhh”
  id: 'fartjump', label: 'Super-salt', icon: '🚀', who: 'both', kind: 'emote', dur: 3.0,
  pose(P, t, p) {
    if (p < 0.26) {
      const b = ease(seg(p, 0, 0.26));
      P.sy = 1 - 0.2 * b; P.sx = 1 + 0.22 * b; P.eyes = b > 0.6 ? 'strain' : 'dot'; P.mouth = 'flat'; P.blush = 1 + b * 0.8;
      P.dx = wave(t, 26, 2.4 * b); P.armL = P.armR = lerp(0.25, -0.45, b); P.legL = P.legR = 0; P.sweat = b;
    } else if (p < 0.72) {
      const q = seg(p, 0.26, 0.72);
      P.dy = -4 * 230 * q * (1 - q);
      P.rot = ease(seg(q, 0.1, 0.8)) * Math.PI * 2;
      P.sy = 1 + 0.16 * (1 - q); P.sx = 1 - 0.08 * (1 - q);
      P.armL = P.armR = 2.7; P.eyes = 'star'; P.mouth = 'grin'; P.legL = P.legR = 4; P.blush = 1.2; P.shadowScale = 1 - Math.sin(q * Math.PI) * 0.6;
    } else if (p < 0.84) {
      const q = seg(p, 0.72, 0.84), sq = Math.sin(q * Math.PI);
      P.sy = 1 - 0.3 * sq; P.sx = 1 + 0.22 * sq; P.eyes = 'happy'; P.mouth = 'open'; P.armL = P.armR = lerp(2.2, 0.6, q);
    } else {
      const q = seg(p, 0.84, 1);
      P.eyes = 'happy'; P.mouth = 'smirk'; P.blush = 1.1; P.armL = P.armR = lerp(1.2, 0.3, ease(q)); P.sy = 1 + Math.sin(q * Math.PI) * 0.04;
    }
  },
  events: [
    [0.06, f => { f.text(0, -112, 'Hmmm…', '#7a5a4a', 0.8); }],
    [0.17, f => { f.fart(0, -6, 0.6); f.sound('fart'); f.shake(2); }],
    [0.26, f => {
      f.fart(-14, -4, 3.2); f.fart(14, -4, 3.2);
      f.burst('fart', 0, -6, 16, 6.28, 150, { rot: 0, max: 2.4, size: 1.6 });
      f.emit('shock', 0, -4, { vy: 0, max: 0.6, color: '#9be05a', size: 2.2 }); f.emit('shock', 0, -4, { vy: 0, max: 0.9, color: '#c8f29a', size: 3 });
      f.text(0, -130, 'SUPER PÂRȚ!', '#5a9a2a', 1.7); f.shake(13); f.sound('bigfart');
    }],
    [0.72, f => { f.burst('puff', 0, 0, 12, 3.2, 90, { rot: 0, max: 0.7 }); f.shake(6); f.sound('jump_land'); }],
    [0.88, f => { f.text(0, -110, 'Ahhh… 😌', '#8d6e63', 0.9); }],
  ],
  tick(f, t, p, dt) {
    if (p > 0.26 && p < 0.7 && every(t, dt, 0.035)) { const q = seg(p, 0.26, 0.72); f.emit('fart', (Math.random() - 0.5) * 14, -4 * 230 * q * (1 - q) + 6, { vy: 30, vx: (Math.random() - 0.5) * 40, max: 1.3, size: 0.9 + Math.random() * 0.5 }); }
  },
});

def({
  id: 'kiss', label: 'Pupic', icon: '😘', who: 'both', kind: 'emote', dur: 2.0,
  pose(P, t, p) {
    const toMouth = ease(seg(p, 0.05, 0.3));
    const out = ease(seg(p, 0.45, 0.6));
    const back = ease(seg(p, 0.85, 1));
    P.armR = lerp(lerp(0.25, 2.95, toMouth), 1.6, out) * (1 - back) + 0.25 * back;
    P.mouth = p < 0.55 ? 'kiss' : 'w'; P.eyes = p < 0.55 ? 'closed' : 'wink'; P.eyesR = p < 0.55 ? 'closed' : 'happy';
    P.blush = 1.3; P.headRot = 0.12 * toMouth * (1 - back); P.rot = 0.06 * out * (1 - back);
  },
  events: [[0.55, f => { f.emit('heart', 26, -62, { vx: 90, vy: -50, max: 1.6, size: 1.6 }); f.sound('kiss'); }], [0.58, f => f.text(10, -118, 'Muac!', '#ff4d6d')]],
});

def({
  id: 'shakebutt', label: 'Fundulețul', icon: '🍑', who: 'both', kind: 'emote', dur: 2.8,
  pose(P, t, p) {
    const front = p > 0.82;
    P.back = !front;
    const k = 1 - ease(seg(p, 0.75, 0.82));
    P.hip = wave(t, 3.5, 7) * k; P.rot = wave(t, 3.5, 0.06) * k;
    P.legL = Math.max(0, wave(t, 3.5, 4)) * k; P.legR = Math.max(0, -wave(t, 3.5, 4)) * k;
    P.armL = P.armR = 0.7 + wave(t, 3.5, 0.2);
    if (front) { P.mouth = 'tongue'; P.eyes = 'wink'; P.eyesR = 'happy'; P.blush = 1.2; }
  },
  events: [[0.1, f => f.text(0, -116, 'Tra-la-la', '#c77dff', 0.9)], [0.84, f => f.text(0, -116, 'Hihi!', '#c77dff')]],
});

// ---------------------------------------------------------------- dansuri
def({
  id: 'dance_hop', label: 'Țopăiala', icon: '🕺', who: 'both', kind: 'dance', dur: 2, loop: true,
  pose(P, t) {
    const ph = t * 2;
    const s = Math.sin(ph * Math.PI);
    P.dx = s * 10; P.dy = -Math.abs(Math.sin(ph * Math.PI * 2)) * 9;
    P.armL = 0.3 + Math.max(0, s) * 2.4; P.armR = 0.3 + Math.max(0, -s) * 2.4;
    P.legL = Math.max(0, s) * 5; P.legR = Math.max(0, -s) * 5;
    P.rot = -s * 0.1; P.headRot = s * 0.12;
    P.eyes = 'happy'; P.mouth = 'open'; P.blush = 0.9;
  },
  tick(f, t, _p, dt) { if (every(t, dt, 0.5)) f.emit('note', (Math.random() - 0.5) * 60, -100, { vx: (Math.random() - 0.5) * 30, vy: -40, max: 1.3, color: ['#7a5cff', '#ff5c8a', '#2ec4b6'][Math.floor(Math.random() * 3)] }); },
});

const ROBOT: [number, number, number, number, number][] = [
  // armL, armR, rot, headRot, dx
  [1.57, 0.2, 0, 0.1, 0], [1.57, 1.57, 0, -0.1, 0], [3.0, 1.57, 0.05, 0.1, 4], [3.0, 3.0, 0, -0.1, 4],
  [0.2, 3.0, -0.05, 0.15, 0], [0.2, 0.2, 0, 0, -4], [-0.9, 1.57, 0, 0.1, -4], [1.57, -0.9, 0, -0.1, 0],
];
def({
  id: 'dance_robot', label: 'Robotul', icon: '🤖', who: 'both', kind: 'dance', dur: 2, loop: true,
  pose(P, t) {
    const i = Math.floor(t * 4) % ROBOT.length; const r = ROBOT[i];
    const q = clamp((t * 4 % 1) * 6); // pozitionare rapida apoi blocat
    const pr = ROBOT[(i + ROBOT.length - 1) % ROBOT.length];
    P.armL = lerp(pr[0], r[0], q); P.armR = lerp(pr[1], r[1], q);
    P.rot = r[2]; P.headRot = r[3]; P.dx = r[4];
    P.legL = i % 2 ? 4 : 0; P.legR = i % 2 ? 0 : 4;
    P.eyes = 'dot'; P.mouth = 'flat'; P.pupilDx = i % 2 ? 2 : -2; P.blush = 0.4;
  },
  tick(f, t, _p, dt) { if (every(t, dt, 0.5)) f.text((Math.random() - 0.5) * 50, -110, 'bip', '#4361ee', 0.6); },
});

def({
  id: 'dance_disco', label: 'Disco', icon: '🪩', who: 'both', kind: 'dance', dur: 4, loop: true,
  pose(P, t) {
    const beat = Math.floor(t * 2) % 2;
    const q = ease(clamp((t * 2 % 1) * 3));
    P.armR = beat ? lerp(0.8, 2.9, q) : lerp(2.9, 0.8, q);
    P.armL = 0.35; P.hip = wave(t, 2, 4);
    P.rot = beat ? 0.08 : -0.06;
    // invartire la fiecare 4 secunde
    const sp = seg(t % 4, 3.2, 4);
    if (sp > 0) { P.sx = Math.cos(sp * Math.PI * 2); P.back = Math.cos(sp * Math.PI * 2 + Math.PI / 2) > 0.6 && sp > 0.2 && sp < 0.8; }
    P.eyes = 'star'; P.mouth = 'smirk'; P.blush = 0.8;
    P.legR = beat ? 3 : 0; P.dy = -Math.abs(Math.sin(t * Math.PI * 2)) * 3;
  },
  tick(f, t, _p, dt) { if (every(t, dt, 0.25)) f.emit('sparkle', (Math.random() - 0.5) * 90, -60 - Math.random() * 60, { vy: 0, max: 0.8, color: ['#ffd23f', '#7af', '#f7a'][Math.floor(Math.random() * 3)] }); },
});

def({
  id: 'dance_wave', label: 'Valul', icon: '🌊', who: 'both', kind: 'dance', dur: 2, loop: true,
  pose(P, t) {
    P.headDx = wave(t, 1, 6); P.hip = wave(t, 1, 6, Math.PI);
    P.armL = 1.6 + wave(t, 1, 0.6); P.armR = 1.6 + wave(t, 1, 0.6, Math.PI);
    P.headRot = wave(t, 1, 0.1); P.dy = -Math.abs(wave(t, 2, 2));
    P.eyes = 'happy'; P.mouth = 'w'; P.blush = 0.9;
  },
  tick(f, t, _p, dt) { if (every(t, dt, 0.6)) f.emit('note', (Math.random() - 0.5) * 60, -100, { vx: (Math.random() - 0.5) * 30, vy: -40, max: 1.3 }); },
});

// ---------------------------------------------------------------- speciale Bubu (panda)
def({
  id: 'pan', label: 'Tigaia!', icon: '🍳', who: 'bubu', kind: 'special', dur: 2.6,
  pose(P, t, p) {
    const raise = easeOutBack(seg(p, 0.05, 0.32));
    const swing = ease(seg(p, 0.4, 0.47));
    const put = ease(seg(p, 0.85, 1));
    P.propR = p < 0.97 ? 'pan' : 'none'; P.propRotR = lerp(0.2, 0.0, swing);
    P.armR = lerp(lerp(0.25, 3.05, raise), 0.95, swing) * (1 - put) + 0.25 * put;
    P.brows = p < 0.6 ? 'angry' : 'none'; P.eyes = p < 0.6 ? 'angry' : 'half'; P.vein = p < 0.6 ? 1 : 0;
    P.mouth = p < 0.4 ? 'frown' : p < 0.6 ? 'scream' : 'smirk';
    P.rot = 0.12 * swing * (1 - put) - 0.06 * raise * (1 - swing);
    P.sy = 1 + 0.05 * raise * (1 - swing); P.blush = 1;
    P.dx = wave(t, 8, p < 0.38 ? 1 : 0);
  },
  events: [[0.46, f => { f.text(46, -40, 'BONK!', '#ff9f1c', 1.4); f.burst('star', 40, -30, 7, 6.28, 90, { max: 0.7 }); f.emit('shock', 40, -30, { vy: 0, max: 0.4 }); f.shake(9); f.sound('bonk'); }]],
});

def({
  id: 'tantrum', label: 'Criza', icon: '😫', who: 'bubu', kind: 'special', dur: 3.0,
  pose(P, t, p) {
    const k = ease(seg(p, 0, 0.08)) * (1 - ease(seg(p, 0.9, 1)));
    const s = Math.sin(t * 16);
    P.legL = Math.max(0, s) * 9 * k; P.legR = Math.max(0, -s) * 9 * k;
    P.armL = lerp(0.25, 2.2 + s * 0.7, k); P.armR = lerp(0.25, 2.2 - s * 0.7, k);
    P.dy = -Math.abs(s) * 4 * k; P.eyes = 'cry'; P.mouth = 'scream'; P.tears = k;
    P.headRot = wave(t, 3, 0.15) * k; P.brows = 'sad'; P.blush = 1.4;
  },
  events: [[0.1, f => f.text(0, -118, 'NUUU!', '#e63946', 1.3)], [0.5, f => f.text(0, -118, 'VREAU BOBA!', '#e63946', 1)]],
  tick(f, t, _p, dt) { if (every(t, dt, 0.18)) f.emit('puff', (Math.random() - 0.5) * 30, -2, { vx: (Math.random() - 0.5) * 60, vy: -10, max: 0.5, size: 0.6 }); },
});

def({
  id: 'boba', label: 'Bubble tea', icon: '🧋', who: 'bubu', kind: 'special', dur: 3.0,
  pose(P, t, p) {
    const k = ease(seg(p, 0, 0.15)) * (1 - ease(seg(p, 0.85, 1)));
    P.propR = p < 0.95 ? 'boba' : 'none'; P.propRotR = 0.4;
    P.armR = lerp(0.25, 2.5, k);
    const sip = Math.sin(t * 10) > 0;
    P.mouth = p > 0.65 ? 'w' : sip ? 'kiss' : 'o'; P.eyes = 'happy'; P.blush = 1 + k * 0.4;
    P.sx = 1 + (sip ? 0.015 : 0) * k; P.headRot = 0.08 * k;
    P.dy = p > 0.65 ? -Math.abs(Math.sin(t * 8)) * 4 : 0;
  },
  events: [[0.2, f => f.text(30, -112, 'Slurp~', '#a47148')], [0.7, f => f.hearts(0, -110, 6)]],
});

// ---------------------------------------------------------------- speciale Dudu (ursul brun)
def({
  id: 'flex', label: 'Mușchii', icon: '💪', who: 'dudu', kind: 'special', dur: 2.6,
  pose(P, t, p) {
    const k = easeOutBack(seg(p, 0, 0.15)) * (1 - ease(seg(p, 0.88, 1)));
    const pump = Math.max(0, Math.sin(t * 7));
    P.armL = P.armR = lerp(0.25, 2.0 + pump * 0.25, k);
    P.sx = 1 + 0.08 * k + pump * 0.03 * k; P.sy = 1 + 0.03 * k;
    P.eyes = 'wink'; P.eyesR = 'happy'; P.mouth = 'grin'; P.blush = 0.6; P.brows = 'up';
    P.headRot = -0.1 * k;
  },
  events: [[0.2, f => f.text(0, -118, 'MUȘCHI!', '#e76f51', 1.2)]],
  tick(f, t, _p, dt) { if (every(t, dt, 0.2)) f.emit('sparkle', (Math.random() - 0.5) * 80, -50 - Math.random() * 30, { vy: -10, max: 0.6 }); },
});

// strange ouale / mierea / lana: se apleaca, culege cu o mana, pune in cos cu cealalta
def({
  id: 'act_collect', label: 'Culege', icon: '🥚', who: 'both', kind: 'base', dur: 1.2, loop: true,
  pose(P, t) {
    const k = (t % 1.2) / 1.2, bend = Math.sin(k * Math.PI);
    P.rot = 0.18 * bend; P.dy = 3 * bend; P.headDy = 3 * bend; P.headRot = 0.1 * bend;
    P.armR = 0.4 + 1.1 * bend; P.armL = 0.9; P.legL = 0; P.legR = 0;
    P.eyes = bend > 0.6 ? 'happy' : 'dot'; P.mouth = bend > 0.6 ? 'open' : 'smile'; P.pupilDy = 2;
  },
  events: [[0.5, f => f.emit('sparkle', 18, -20, { vy: -40, max: 0.5 })]],
});
// mulge vaca: ghemuit, mainile trag pe rand, laptele sare in galeata
def({
  id: 'act_milk', label: 'Mulge', icon: '🥛', who: 'both', kind: 'base', dur: 0.5, loop: true,
  pose(P, t) {
    const s = Math.sin(t * Math.PI * 2 / 0.5);
    P.sy = 0.86; P.dy = 6; P.armL = 1.0 + s * 0.35; P.armR = 1.0 - s * 0.35; P.rot = 0.08;
    P.eyes = 'happy'; P.mouth = 'w'; P.headRot = s * 0.04;
  },
  tick(f, t, _p, dt) { if (every(t, dt, 0.25)) f.emit('drop', 24, -6, { vx: (Math.random() - 0.5) * 30, vy: 20, grav: 300, max: 0.4, color: '#ffffff' }); },
});

// cara un lemn pe deasupra capului (la cherestea): pasi mici, bratele sus, efort pe fata
def({
  id: 'act_carry', label: 'Cară lemne', icon: '🪵', who: 'both', kind: 'base', dur: 0.7, loop: true,
  pose(P, t) {
    const s = Math.sin(t * Math.PI * 2 / 0.7);
    P.armL = P.armR = 2.75 + s * 0.06;
    P.legL = Math.max(0, s) * 4; P.legR = Math.max(0, -s) * 4;
    P.dy = -Math.abs(s) * 2; P.sy = 0.97 + Math.abs(s) * 0.03; P.sx = 1.03;
    P.eyes = 'strain'; P.mouth = 'flat'; P.brows = 'up'; P.sweat = 0.6; P.headDy = 2;
  },
});

def({
  id: 'burp', label: 'Râgâiala', icon: '🫧', who: 'dudu', kind: 'special', dur: 2.6,
  pose(P, t, p) {
    const fill = ease(seg(p, 0, 0.45));
    if (p < 0.48) {
      P.sx = 1 + 0.14 * fill; P.sy = 1 - 0.04 * fill; P.mouth = 'flat'; P.eyes = fill > 0.6 ? 'wide' : 'dot';
      P.headDy = -2 * fill; P.armL = P.armR = lerp(0.25, 0.9, fill); P.blush = 0.6 + fill;
    } else {
      const r = 1 - ease(seg(p, 0.5, 0.8));
      P.mouth = p < 0.75 ? 'scream' : 'smirk'; P.eyes = p < 0.75 ? 'cry' : 'half';
      P.headRot = -0.25 * r; P.headDy = -6 * r; P.dx = -5 * r; P.rot = -0.08 * r; P.armL = P.armR = 0.4;
    }
  },
  events: [[0.48, f => { f.text(10, -118, 'RÂÂÂGH!', '#6a4c93', 1.4); f.emit('shock', 0, -52, { vy: 0, max: 0.6, color: '#c77dff' }); f.emit('shock', 0, -52, { vy: 0, max: 0.9, color: '#c77dff' }); f.shake(7); f.sound('burp'); }],
           [0.82, f => f.text(30, -110, 'Pardon ;)', '#6a4c93', 0.7)]],
});

def({
  id: 'puppy', label: 'Ochi de cățel', icon: '🥺', who: 'dudu', kind: 'special', dur: 2.6,
  pose(P, t, p) {
    const k = ease(seg(p, 0, 0.15)) * (1 - ease(seg(p, 0.88, 1)));
    P.eyes = 'wide'; P.brows = 'sad'; P.mouth = 'wavy'; P.blush = 1.3;
    P.armL = P.armR = lerp(0.25, -0.5, k); P.sy = 1 - 0.05 * k; P.headDy = 3 * k;
    P.headRot = wave(t, 0.7, 0.08) * k; P.pupilDy = 1 * k; P.tears = 0.12 * k;
  },
  events: [[0.25, f => f.text(0, -118, 'Te rooog...', '#8d6e63', 0.8)]],
});

// ---------------------------------------------------------------- reactii (pentru interactiuni)
def({
  id: 'dizzy', label: 'Amețit', icon: '😵‍💫', who: 'both', kind: 'reaction', dur: 2.2,
  pose(P, t, p) {
    const hit = 1 - ease(seg(p, 0, 0.2));
    const k = 1 - ease(seg(p, 0.85, 1));
    P.sy = 1 - 0.22 * hit; P.sx = 1 + 0.15 * hit;
    P.eyes = 'spiral'; P.mouth = 'tongue'; P.dizzy = k; P.rot = wave(t, 1.2, 0.12) * k;
    P.armL = P.armR = 0.6 + wave(t, 1.2, 0.3) * k;
  },
});

def({
  id: 'faint', label: 'Leșin', icon: '😵', who: 'both', kind: 'reaction', dur: 2.6,
  pose(P, t, p) {
    const fall = ease(seg(p, 0.08, 0.35));
    const up = ease(seg(p, 0.82, 1));
    const k = fall * (1 - up);
    P.rot = -1.45 * k; P.dx = -8 * k; P.dy = -4 * k;
    P.eyes = p < 0.08 ? 'wide' : 'x'; P.mouth = p < 0.08 ? 'o' : 'tongue'; P.sickTint = k;
    P.armL = lerp(0.25, 2.6, k); P.armR = lerp(0.25, 1.8, k); P.legL = 6 * k;
    P.shadowScale = 1 + 0.5 * k;
  },
  events: [[0.05, f => f.text(-20, -150, 'BLEAH!', '#7cb342', 1.1)]],
});

def({
  id: 'slapped', label: 'Au!', icon: '😳', who: 'both', kind: 'reaction', dur: 1.6,
  pose(P, t, p) {
    const j = bump(p, 0, 0.35);
    P.dy = -j * 26; P.sy = 1 + j * 0.1; P.eyes = 'wide'; P.mouth = p < 0.4 ? 'o' : 'w';
    P.blush = 1.8; P.armL = P.armR = lerp(0.25, -0.8, seg(p, 0, 0.2)) ; P.legR = j * 6;
    P.rot = -0.08 * j;
  },
  events: [[0.02, f => f.text(0, -122, 'Aaai! >///<', '#ff4d6d', 0.9)]],
});

def({
  id: 'hugpose', label: 'Îmbrățișare', icon: '🤗', who: 'both', kind: 'reaction', dur: 2.6,
  pose(P, t, p) {
    const k = easeOutBack(seg(p, 0.1, 0.3)) * (1 - ease(seg(p, 0.85, 1)));
    P.armL = P.armR = lerp(0.25, 1.55, k); P.eyes = 'happy'; P.mouth = 'w'; P.blush = 1.4;
    P.rot = wave(t, 0.8, 0.05) * k; P.sy = 1 - 0.04 * k + wave(t, 1.6, 0.02) * k;
  },
});

def({
  id: 'kisspose', label: 'Pupic', icon: '💋', who: 'both', kind: 'reaction', dur: 2.4,
  pose(P, t, p) {
    const k = ease(seg(p, 0.1, 0.35)) * (1 - ease(seg(p, 0.8, 1)));
    P.rot = 0.2 * k; P.mouth = k > 0.5 ? 'kiss' : 'w'; P.eyes = k > 0.3 ? 'closed' : 'happy';
    P.blush = 1.2 + k * 0.6; P.armL = lerp(0.25, -0.4, k); P.armR = lerp(0.25, 1.2, k); P.legR = 5 * k;
  },
});

def({
  id: 'slap', label: 'Palmă', icon: '🖐️', who: 'both', kind: 'reaction', dur: 1.6,
  pose(P, t, p) {
    const wind = ease(seg(p, 0, 0.25)); const hit = ease(seg(p, 0.25, 0.32)); const back = ease(seg(p, 0.7, 1));
    P.armR = (lerp(lerp(0.25, 2.6, wind), 0.5, hit)) * (1 - back) + 0.25 * back;
    P.eyes = p < 0.3 ? 'wink' : 'happy'; P.eyesR = 'happy'; P.mouth = p < 0.3 ? 'smirk' : 'grin'; P.blush = 1.2;
    P.rot = 0.1 * hit * (1 - back);
  },
  events: [[0.3, f => { f.text(40, -50, 'PLEOSC!', '#ff4d6d', 1.2); f.burst('heart', 40, -30, 4, 3, 60); f.shake(4); f.sound('slap'); }]],
});

def({
  id: 'fartback', label: 'Atac pârț', icon: '☁️', who: 'both', kind: 'reaction', dur: 2.4,
  pose(P, t, p) {
    P.back = p < 0.75;
    const b = ease(seg(p, 0, 0.35));
    P.hip = p < 0.35 ? wave(t, 3, 4) : 0; P.sy = 1 - 0.08 * b * (p < 0.4 ? 1 : 0);
    P.dy = -bump(p, 0.4, 0.55) * 10;
    if (!P.back) { P.mouth = 'tongue'; P.eyes = 'wink'; P.eyesR = 'happy'; P.blush = 1.2; }
  },
  events: [[0.4, f => { f.fart(30, -16, 1.8); f.fart(40, -26, 1.4); f.text(0, -118, 'PRRRT!', '#7cb342', 1.2); f.shake(5); f.sound('bigfart'); }]],
});


// ---------------------------------------------------------------- activitati (bucla, folosite in casa)
def({
  id: 'act_eat', label: 'Mănâncă', icon: '🍪', who: 'both', kind: 'base', dur: 0.8, loop: true,
  pose(P, t) {
    const c = Math.max(0, Math.sin(t * Math.PI * 2 / 0.8));
    P.armR = 2.3 + c * 0.3; P.propR = 'heart'; P.propRotR = 0.3;
    P.mouth = c > 0.5 ? 'open' : 'w'; P.eyes = 'happy'; P.blush = 1; P.sx = 1 + c * 0.02;
  },
  tick(f, t, _p, dt) { if (every(t, dt, 0.8, 0.2)) f.burst('drop', 6, -52, 3, 1.5, 40, { rot: Math.PI / 2, grav: 160, max: 0.5, color: '#c98e5f' }); },
});
def({
  id: 'act_brush', label: 'Spălat pe dinți', icon: '🪥', who: 'both', kind: 'base', dur: 0.3, loop: true,
  pose(P, t) { P.armR = 2.0 + wave(t, 3.3, 0.25); P.propR = 'spoon'; P.propRotR = 1.4; P.mouth = 'grin'; P.eyes = 'half'; P.headRot = wave(t, 3.3, 0.04); },
  tick(f, t, _p, dt) { if (every(t, dt, 0.25)) f.emit('puff', 10, -50, { vx: 20, vy: -15, max: 0.6, size: 0.4 }); },
});
def({
  id: 'act_plunge', label: 'Desfundă', icon: '🪠', who: 'both', kind: 'base', dur: 0.7, loop: true,
  pose(P, t) {
    const c = Math.sin(t * Math.PI * 2 / 0.7);
    P.armL = P.armR = 1.0 + c * 0.25; P.propR = 'plunger'; P.propRotR = -0.4;
    P.sy = 1 - Math.max(0, c) * 0.08; P.dy = Math.max(0, c) * 2; P.eyes = 'strain'; P.mouth = 'flat'; P.sweat = 1; P.blush = 1;
  },
});
def({
  id: 'act_cook', label: 'Gătește', icon: '🍳', who: 'both', kind: 'base', dur: 1, loop: true,
  pose(P, t) { P.armR = 1.3 + wave(t, 1, 0.3); P.propR = 'spoon'; P.propRotR = 0.6; P.mouth = 'w'; P.eyes = 'happy'; P.hip = wave(t, 1, 2); P.back = true; },
});
def({
  id: 'act_scrub', label: 'Freacă', icon: '🧽', who: 'both', kind: 'base', dur: 0.4, loop: true,
  pose(P, t) { P.armL = P.armR = 1.2 + wave(t, 2.5, 0.25); P.back = true; P.hip = wave(t, 2.5, 2); },
  tick(f, t, _p, dt) { if (every(t, dt, 0.3)) f.emit('puff', (Math.random() - 0.5) * 30, -60, { vy: -30, max: 0.8, size: 0.5 }); },
});
def({
  id: 'act_water', label: 'Udă', icon: '💧', who: 'both', kind: 'base', dur: 1.2, loop: true,
  pose(P, t) { P.armR = 1.5; P.propR = 'flower'; P.propRotR = 1.2; P.eyes = 'happy'; P.mouth = 'w'; P.rot = 0.05; },
  tick(f, t, _p, dt) { if (every(t, dt, 0.12)) f.emit('drop', 40, -40, { vx: 20, vy: 30, grav: 200, max: 0.5 }); },
});
def({
  id: 'act_read', label: 'Citește', icon: '📖', who: 'both', kind: 'base', dur: 3, loop: true,
  pose(P, t, p) { P.armL = P.armR = -0.2; P.propR = 'pillow'; P.propRotR = 2.9; P.eyes = 'half'; P.pupilDy = 2; P.mouth = p > 0.7 ? 'o' : 'smile'; P.headDy = 2; },
});
def({
  id: 'act_sit', label: 'Stă jos', icon: '🪑', who: 'both', kind: 'base', dur: 4, loop: true,
  pose(P, t) { P.legL = P.legR = 5; P.sy = 0.94; P.dy = 2; P.armL = P.armR = 0.5; P.eyes = 'happy'; P.mouth = 'w'; P.headRot = wave(t, 0.25, 0.06); },
});
def({
  id: 'act_tv', label: 'TV', icon: '📺', who: 'both', kind: 'base', dur: 6, loop: true,
  pose(P, t, p) { P.back = true; P.legL = P.legR = 5; P.sy = 0.94; P.dy = 2; P.armL = P.armR = 0.5; P.headRot = wave(t, 0.2, 0.05); if (p > 0.6 && p < 0.75) P.dy = -Math.abs(Math.sin(t * 12)) * 3; },
  events: [[0.62, f => f.text(0, -110, 'HAHA', '#ff9f1c', 0.8)]],
});
def({
  id: 'act_sleepbed', label: 'Doarme', icon: '😴', who: 'both', kind: 'base', dur: 4, loop: true,
  pose(P, t) { P.headOnly = true; P.eyes = 'closed'; P.mouth = 'o'; P.rot = -0.25; P.snot = 0.5 + 0.5 * Math.sin(t * 1.6); P.blush = 0.5; },
  tick(f, t, _p, dt) { if (every(t, dt, 1.1, 0.3)) f.emit('zzz', 20, -30, { vx: 10, vy: -20, max: 1.8, size: 0.8 }); },
});
def({
  id: 'act_bath', label: 'Baie', icon: '🛁', who: 'both', kind: 'base', dur: 3, loop: true,
  pose(P, t) { P.headOnly = true; P.eyes = 'happy'; P.mouth = 'w'; P.blush = 1.2; P.rot = wave(t, 0.4, 0.1); },
  tick(f, t, _p, dt) { if (every(t, dt, 0.4)) f.emit('puff', (Math.random() - 0.5) * 50, -10, { vy: -25, max: 1.2, size: 0.4 + Math.random() * 0.3 }); },
});
def({
  id: 'act_toilet', label: 'Toaleta', icon: '🚽', who: 'both', kind: 'base', dur: 3, loop: true,
  pose(P, t, p) {
    P.legL = P.legR = 5; P.sy = 0.93; P.dy = 3; P.armL = P.armR = -0.3;
    if (p < 0.5) { P.eyes = 'strain'; P.mouth = 'flat'; P.blush = 1.3; P.sweat = 1; P.dx = wave(t, 12, 0.8); }
    else { P.eyes = 'happy'; P.mouth = 'smirk'; P.blush = 0.9; }
  },
  events: [[0.5, f => { f.fart(0, -8, 0.8); f.text(0, -100, 'Ahhh~', '#8d6e63', 0.8); f.sound('fart'); }]],
});
def({
  id: 'act_garden', label: 'Grădinărit', icon: '🌱', who: 'both', kind: 'base', dur: 0.9, loop: true,
  pose(P, t) { const c = Math.max(0, Math.sin(t * 7)); P.sy = 0.9 + c * 0.05; P.rot = 0.12; P.armL = P.armR = 0.8 + c * 0.5; P.eyes = 'happy'; P.mouth = 'w'; },
  tick(f, t, _p, dt) { if (every(t, dt, 0.45)) f.burst('drop', 20, -6, 3, 1.4, 50, { grav: 180, max: 0.5, color: '#8b5e34' }); },
});

// ---- mobila din apartament
def({
  id: 'act_piano', label: 'Cântă la pian', icon: '🎹', who: 'both', kind: 'base', dur: 9, loop: true,
  pose(P, t, p) {
    // pe taburet, cu spatele la noi; mainile alearga pe clape, capul si fundul se leagana pe ritm
    P.back = true; P.legL = P.legR = 5; P.sy = 0.94; P.dy = 2;
    P.armL = 1.25 + Math.max(0, Math.sin(t * 9)) * 0.35; P.armR = 1.25 + Math.max(0, Math.sin(t * 9 + 1.9)) * 0.35;
    P.headRot = wave(t, 0.5, 0.09); P.hip = wave(t, 1, 1.6); P.rot = wave(t, 0.5, 0.03);
    if (p > 0.82) { P.armL = P.armR = 1.7; P.dy = -Math.abs(Math.sin(t * 10)) * 2; }
  },
  tick(f, t, _p, dt) { if (every(t, dt, 0.34)) f.emit('note', (Math.random() - 0.5) * 50, -95, { vx: (Math.random() - 0.5) * 40, vy: -45, max: 1.5, color: ['#7a5cff', '#ff5c8a', '#2ec4b6', '#ff9f1c'][Math.floor(Math.random() * 4)] }); },
  events: [[0.84, f => { f.hearts(0, -100, 3); f.text(0, -118, 'Ta-daa! 🎶', '#7a5cff', 0.85); }]],
});
def({
  id: 'act_fishwatch', label: 'Privește peștișorii', icon: '🐟', who: 'both', kind: 'base', dur: 7, loop: true,
  pose(P, t, p) {
    // cu fata la acvariu: presara mancare, apoi se apleaca si urmareste pestii cu ochii, bate usor in geam
    P.back = true;
    if (p < 0.28) { const k = seg(p, 0, 0.28); P.armR = 2.2 + Math.sin(t * 16) * 0.12; P.rot = 0.03; P.headRot = -0.06 + k * 0.04; }
    else if (p < 0.55) { P.rot = 0.09; P.sy = 0.97; P.headDy = 2; P.headRot = wave(t, 0.6, 0.12); P.armL = P.armR = 0.3; }
    else if (p < 0.68) { P.rot = 0.1; P.armR = 1.5 + Math.max(0, Math.sin(t * 18)) * 0.25; P.headRot = 0.05; }
    else { P.rot = 0.07; P.headRot = wave(t, 0.5, 0.14); P.dy = p > 0.86 ? -Math.abs(Math.sin(t * 9)) * 3 : 0; P.armL = P.armR = 0.5; }
  },
  tick(f, t, p, dt) { if (p > 0.3 && every(t, dt, 1.1, 0.4)) f.emit('heart', (Math.random() - 0.5) * 30, -100, { vy: -30, max: 1.4, size: 0.7 }); },
  events: [[0.56, f => f.text(0, -112, 'Cioc-cioc 🐟', '#2ec4b6', 0.8)], [0.86, f => f.text(0, -112, 'Ce dulci sunt! 💕', '#ff5c8a', 0.8)]],
});
def({
  id: 'act_coffee', label: 'Face o cafea', icon: '☕', who: 'both', kind: 'base', dur: 7, loop: true,
  pose(P, t, p) {
    // cu spatele: apasa butoanele, asteapta sa curga (bataie din picior); apoi se intoarce spre noi cu ceasca: miroase, sorbitura, „Ahh!”
    if (p < 0.18) { P.back = true; P.armR = 1.5 + (Math.sin(t * 14) > 0.6 ? 0.25 : 0); P.eyes = 'happy'; P.mouth = 'w'; }
    else if (p < 0.5) { P.back = true; P.armL = P.armR = 0.2; P.legR = Math.max(0, Math.sin(t * 12)) * 3; P.headRot = wave(t, 0.8, 0.08); P.eyes = 'happy'; P.mouth = 'smile'; }
    else {
      const k = ease(seg(p, 0.5, 0.6));
      P.propR = 'cup'; P.propRotR = 0.3; P.armR = lerp(0.6, 2.4, k);
      const sip = p > 0.66 && p < 0.84 && Math.sin(t * 7) > 0;
      P.mouth = p > 0.86 ? 'open' : sip ? 'kiss' : 'w'; P.eyes = p > 0.6 && p < 0.66 ? 'closed' : 'happy'; P.blush = 1.1;
      if (p > 0.86) { P.dy = -Math.abs(Math.sin(t * 9)) * 4; P.eyes = 'star'; }
    }
  },
  tick(f, t, p, dt) { if (p > 0.55 && p < 0.86 && every(t, dt, 0.3)) f.emit('steam', 22, -78, { vx: 4, vy: -26, max: 0.9, size: 0.5 }); },
  events: [[0.6, f => f.text(0, -112, 'Mmm… ce miros! ☕', '#8d5a3a', 0.8)], [0.87, f => { f.text(0, -112, 'Ahh! ⚡', '#ff9f1c', 0.9); f.burst('sparkle', 0, -70, 8, 1, 60); }]],
});
def({
  id: 'act_game', label: 'Joacă pe consolă', icon: '🎮', who: 'both', kind: 'base', dur: 9, loop: true,
  pose(P, t, p) {
    // pe canapea, cu spatele: maneta in maini, se apleaca dupa personaj, sare de bucurie
    P.back = true; P.legL = P.legR = 5; P.sy = 0.94; P.dy = 2;
    P.propR = 'pad'; P.propRotR = 2.8; P.armL = P.armR = 1.05 + Math.sin(t * 16) * 0.06;
    P.rot = Math.sin(t * 1.7) * 0.12; P.headRot = Math.sin(t * 1.7) * 0.1;
    if ((p > 0.42 && p < 0.5) || p > 0.86) { P.dy = -Math.abs(Math.sin(t * 12)) * 5; P.armL = P.armR = 2.3; }
  },
  events: [[0.43, f => f.text(0, -112, 'Nivelul 2! ⭐', '#7a5cff', 0.8)], [0.87, f => { f.text(0, -112, 'Am câștigat! 🏆', '#ff9f1c', 0.9); f.burst('star', 0, -90, 6, 1, 70); }]],
});

export const ANIMS: Record<string, Anim> = Object.fromEntries(A.map(a => [a.id, a]));
export const ANIM_LIST = A;
