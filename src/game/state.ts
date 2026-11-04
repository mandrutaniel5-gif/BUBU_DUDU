// Starea jocului (salvata local + in cloud).
import type { CharId } from '../char/draw';
import type { Mood } from '../char/actor';
import type { WorldOp } from '../net/types';

export const NEEDS = ['hunger', 'energy', 'warmth', 'hygiene', 'fun', 'love', 'health'] as const;
export type NeedKey = typeof NEEDS[number];
export const NEED_INFO: Record<NeedKey, { icon: string; label: string; color: string }> = {
  hunger: { icon: '🍔', label: 'Foame', color: '#ff9f1c' },
  energy: { icon: '😴', label: 'Energie', color: '#7a8cff' },
  warmth: { icon: '🔥', label: 'Căldură', color: '#ff6b3d' },
  hygiene: { icon: '🛁', label: 'Igienă', color: '#4cc9f0' },
  fun: { icon: '🎈', label: 'Distracție', color: '#c77dff' },
  love: { icon: '💕', label: 'Iubire', color: '#ff4d6d' },
  health: { icon: '❤️‍🩹', label: 'Sănătate', color: '#2ec4b6' },
};

export type Sickness = 'cold' | 'fever' | 'tummy';
export const REQUESTS: Record<string, { icon: string; label: string; mini?: string }> = {
  soup: { icon: '🍲', label: 'supă caldă', mini: 'soup' },
  medicine: { icon: '💊', label: 'medicamentul', mini: 'medicine' },
  compress: { icon: '🧊', label: 'o compresă rece', mini: 'compress' },
  kiss: { icon: '💋', label: 'un pupic de vindecare' },
  water: { icon: '💧', label: 'un pahar cu apă' },
};

export const SICK_INFO: Record<Sickness, { label: string; icon: string }> = {
  cold: { label: 'Răceală', icon: '🤧' }, fever: { label: 'Febră', icon: '🌡️' }, tummy: { label: 'Burtică', icon: '☁️' },
};

export interface CharState {
  needs: Record<NeedKey, number>;   // 0..100 (100 = perfect)
  sick: Sickness | null;
  fart: number;                     // 0..100 bara de pârț
  request?: string | null;
  outfit?: { head: string; face: string; neck: string };
  owned?: string[];          // ce cere bolnavul: soup / medicine / compress / kiss / water
  gx: number; gy: number;
}

export interface WorldState {
  v: 1;
  ts: number;            // ultima modificare (ms)
  created: number;       // cand s-a mutat cuplul in casa
  minutes: number;       // ora din zi in minute de joc (0..1440)
  day: number;
  hearts: number;        // moneda jocului
  chars: Record<CharId, CharState>;
  furn: Record<string, unknown>;
  jar: { from: CharId; text: string; ts: number }[];  // Borcanul cu iubire
  log: { text: string; ts: number }[];                 // "cat ai lipsit"
  stats: Record<string, number>;
  res?: Record<string, number>;                         // lemn, piatra, flori
  placed?: { uid: string; type: string; gx: number; gy: number }[]; // constructii
  nodes?: Record<string, number>;                       // resurse epuizate pana la (ms)
  money?: number;                                       // lei
  plots?: Record<string, { crop: string | null; prog: number; wetUntil: number; fert: number }>; // gradina
  gameMin?: number;                                     // ceasul jocului (minute de la inceput)
  grass?: Record<string, number>;                       // iarba inalta: 'x,y' -> inaltime 1..3
  town?: Record<string, unknown>;                       // sat/oras: cereri sateni, banca, mobila apartament
}

const fullNeeds = (): Record<NeedKey, number> => ({ hunger: 70, energy: 85, warmth: 60, hygiene: 80, fun: 70, love: 75, health: 100 });

export function newWorld(): WorldState {
  return {
    v: 1, ts: Date.now(), created: Date.now(), minutes: 9 * 60, day: 1, hearts: 20,
    chars: {
      bubu: { needs: fullNeeds(), sick: null, fart: 30, gx: 6.5, gy: 8.4 },
      dudu: { needs: fullNeeds(), sick: null, fart: 50, gx: 7.3, gy: 9.0 },
    },
    furn: { lampOn: false, tvOn: false, clogged: false, bathFoam: 0.2, cooking: false, crops: [0, 0, 0, 0, 0, 0] },
    jar: [], log: [], stats: {}, res: { wood: 3, stone: 2, flower: 4, seeds: 3, veg: 1, meals: 2, flour: 0, lemon: 0 }, placed: [], nodes: {}, money: 20, grass: {},
  };
}

export function moodFrom(c: CharState): Mood {
  if (c.sick) return 'sick';
  const n = c.needs;
  const low = (Object.entries(n) as [NeedKey, number][]).sort((a, b) => a[1] - b[1])[0];
  if (low[1] < 25) {
    switch (low[0]) {
      case 'hunger': return 'hungry';
      case 'energy': return 'sleepy';
      case 'love': return 'sulky';
      case 'fun': return 'sad';
      case 'hygiene': return 'sulky';
      case 'health': return 'sick';
      case 'warmth': return 'cold';
    }
  }
  if (n.love > 85 && n.fun > 50) return 'love';
  if (low[1] < 45) return 'calm';
  return 'happy';
}

// ritmul de scadere pe ora de joc (o zi = 24 h de joc): foamea cere 2-3 mese pe zi,
// energia tine toata ziua daca dormi noaptea, curatenia cere o baie pe zi
const DECAY: Record<NeedKey, number> = { hunger: 7.5, energy: 2.5, warmth: 4, hygiene: 3.8, fun: 3.8, love: 3, health: 0 };

/** trece timpul; intoarce evenimente (ex. s-a imbolnavit) */
export function tickNeeds(c: CharState, hours: number, asleep: boolean, warmGain = 0, cold = 1): string[] {
  const ev: string[] = [];
  c.needs.warmth ??= 60;
  for (const k of NEEDS) {
    let r = DECAY[k];
    if (asleep && k === 'energy') r = -14;     // somnul reface energia
    if (asleep && k === 'hunger') r *= 0.45;
    // cand ti-e foame tare: obosesti mai repede si nu mai ai chef de nimic
    if (!asleep && c.needs.hunger < 25 && (k === 'energy' || k === 'fun')) r *= 1.5;
    if (c.sick) r *= k === 'energy' ? 2 : 1.3;
    if (k === 'warmth') r = r * cold - warmGain;
    c.needs[k] = clamp100(c.needs[k] - r * hours);
  }
  // sanatatea
  const bad = (c.needs.hygiene < 20 ? 1 : 0) + (c.needs.energy < 15 ? 1 : 0) + (c.needs.hunger < 15 ? 1 : 0) + (c.needs.warmth < 15 ? 2 : 0);
  if (c.sick) c.needs.health = clamp100(c.needs.health - 2.5 * hours);
  else if (bad) c.needs.health = clamp100(c.needs.health - bad * 3 * hours);
  else c.needs.health = clamp100(c.needs.health + 1.5 * hours);
  if (!c.sick && c.needs.health < 45 && Math.random() < 0.25 * hours) {
    c.sick = c.needs.warmth < 25 ? 'cold' : c.needs.hunger < 20 ? 'tummy' : c.needs.energy < 20 ? 'fever' : 'cold';
    ev.push('sick');
  }
  c.fart = Math.min(100, c.fart + 6 * hours);
  return ev;
}

export const clamp100 = (v: number) => Math.max(0, Math.min(100, v));

export function applyOp(w: WorldState, op: WorldOp) {
  switch (op.k) {
    case 'furn': w.furn[op.key] = op.value; break;
    case 'need': { const c = w.chars[op.who]; const k = op.need as NeedKey; if (k in c.needs) c.needs[k] = clamp100(c.needs[k] + op.delta); else if (op.need === 'fart') c.fart = Math.max(0, Math.min(100, c.fart + op.delta)); break; }
    case 'hearts': w.hearts = Math.max(0, w.hearts + op.delta); break;
    case 'sick': w.chars[op.who].sick = op.value as Sickness | null; if (!op.value) w.chars[op.who].request = null; break;
    case 'jar': w.jar.push({ from: op.from, text: op.text, ts: op.ts }); break;
    case 'char': case 'npcs': case 'npcServe': return;
    case 'plot': { w.plots ??= {}; if (op.plot === null) delete w.plots[op.key]; else w.plots[op.key] = op.plot as any; return; }
    case 'plots': w.plots = op.all as any; return;
    case 'clock': if (Math.abs((w.gameMin ?? 0) - op.gameMin) > 2) w.gameMin = op.gameMin; return;
    case 'res': { w.res ??= {}; w.res[op.res] = Math.max(0, (w.res[op.res] ?? 0) + op.delta); break; }
    case 'place': { w.placed ??= []; if (!w.placed.some(p => p.uid === op.uid)) w.placed.push({ uid: op.uid, type: op.type, gx: op.gx, gy: op.gy }); break; }
    case 'unplace': { w.placed = (w.placed ?? []).filter(p => p.uid !== op.uid); break; }
    case 'node': { w.nodes ??= {}; w.nodes[op.id] = op.until; break; }
    case 'money': w.money = Math.max(0, (w.money ?? 0) + op.delta); break;
    case 'stat': w.stats[op.key] = (w.stats[op.key] ?? 0) + op.delta; break;
    case 'grass': { w.grass ??= {}; if (op.value <= 0) delete w.grass[op.key]; else w.grass[op.key] = op.value; break; }
    case 'grassAll': w.grass = {}; break;
    case 'town': w.town ??= {}; w.town[op.key] = op.value; break;
    case 'log': w.log.push({ text: op.text, ts: op.ts }); if (w.log.length > 60) w.log.splice(0, w.log.length - 60); break;
  }
  w.ts = Date.now();
}

export function clockText(min: number) {
  const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
/** 0 = zi, 1 = noapte complet */
export function nightAmount(min: number) {
  const h = min / 60;
  if (h >= 7 && h <= 18) return 0;
  if (h > 18 && h < 21) return (h - 18) / 3;
  if (h >= 21 || h < 5) return 1;
  return 1 - (h - 5) / 2;
}
