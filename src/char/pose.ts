// Poza unui personaj: toate valorile pe care animatiile le pot modifica.

export type EyeType =
  | 'dot' | 'happy' | 'closed' | 'wide' | 'x' | 'heart' | 'cry' | 'spiral'
  | 'wink' | 'star' | 'half' | 'angry' | 'sad' | 'strain' | 'side';
export type MouthType =
  | 'smile' | 'w' | 'open' | 'o' | 'frown' | 'wavy' | 'flat' | 'grin'
  | 'tongue' | 'kiss' | 'scream' | 'drool' | 'cat' | 'smirk' | 'none';
export type BrowType = 'none' | 'angry' | 'sad' | 'up';
export type PropType =
  | 'none' | 'pan' | 'boba' | 'heart' | 'flower' | 'plunger' | 'thermometer'
  | 'spoon' | 'mic' | 'tissue' | 'pillow';

export interface Pose {
  dx: number; dy: number;        // deplasarea corpului (px)
  sx: number; sy: number;        // squash & stretch
  rot: number;                   // inclinarea intregului corp (rad), pivot la picioare
  headDx: number; headDy: number; headRot: number;
  armL: number; armR: number;    // rad, 0 = in jos, pozitiv = in afara/in sus
  legL: number; legR: number;    // ridicarea picioarelor (px)
  legLx: number; legRx: number;
  hip: number;                   // unduirea fundului (px)
  eyes: EyeType; eyesR?: EyeType; // ochiul drept poate fi diferit
  mouth: MouthType;
  brows: BrowType;
  blush: number;                 // 0..1
  pupilDx: number; pupilDy: number;
  back: boolean;                 // vazut din spate
  propL: PropType; propR: PropType;
  propRotL: number; propRotR: number;
  // atasamente
  vein: number; sweat: number; tears: number; snot: number; sickTint: number;
  dizzy: number; shadowScale: number;
  earWiggle: number;
}

export const basePose = (): Pose => ({
  dx: 0, dy: 0, sx: 1, sy: 1, rot: 0,
  headDx: 0, headDy: 0, headRot: 0,
  armL: 0.25, armR: 0.25, legL: 0, legR: 0, legLx: 0, legRx: 0, hip: 0,
  eyes: 'dot', mouth: 'smile', brows: 'none', blush: 0.55,
  pupilDx: 0, pupilDy: 0, back: false,
  propL: 'none', propR: 'none', propRotL: 0, propRotR: 0,
  vein: 0, sweat: 0, tears: 0, snot: 0, sickTint: 0, dizzy: 0, shadowScale: 1,
  earWiggle: 0,
});

// --- utilitare pentru animatii ---
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => t * t * (3 - 2 * t);
export const easeOutBack = (t: number) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * (t - 1) ** 3 + c * (t - 1) ** 2; };
export const easeOutElastic = (t: number) => t === 0 ? 0 : t === 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
/** 0..1 in intervalul [a,b] al lui p */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
/** puls 0->1->0 in intervalul [a,b] */
export const bump = (p: number, a: number, b: number) => Math.sin(seg(p, a, b) * Math.PI);
export const wave = (t: number, f: number, amp = 1, ph = 0) => Math.sin(t * f * Math.PI * 2 + ph) * amp;
