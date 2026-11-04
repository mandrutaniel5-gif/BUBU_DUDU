// Peisajul sonor: ambianta fiecarei zone (zi/noapte), surse de loc (foc, fantana, lac, televizor),
// pasi pe fiecare suprafata, motoarele vehiculelor, sunetele activitatilor si ale minijocurilor.
import { Sfx, type LoopOpts } from './sfx';
import { iso } from '../world/iso';
import { floorAt, HOUSE, FURNITURE, type Floor } from '../world/map';
import { nightAmount } from '../game/state';
import type { WorldScene, Pawn } from '../scenes/world';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
type S = string | string[];
const one = (s: S) => (Array.isArray(s) ? pick(s) : s);

/** sunetele activitatilor: la inceput, in bucla, din cand in cand, la final */
interface ActSound { start?: S; loop?: [string, number, LoopOpts?]; every?: [S, number, number?]; end?: S }
export const ACT_SOUNDS: Record<string, ActSound> = {
  sleep: { start: 'yawn' },
  bath: { start: 'faucet_on', loop: ['bath_loop', 0.5], every: ['splash', 2.4, 0.5], end: 'faucet_off' },
  toilet: { start: 'zip', every: [['fart', 'fart_wet', 'squelch'], 1.6, 0.55], end: 'flush' },
  teeth: { start: 'faucet_on', loop: ['water_loop', 0.22], end: 'faucet_off' },
  dishes: { start: 'faucet_on', loop: ['water_loop', 0.4], every: ['dishes', 1.5, 0.6], end: 'faucet_off' },
  laundry: { start: 'door_close', loop: ['machine_loop', 0.5] },
  cook: { start: 'pan', loop: ['sizzle_loop', 0.5], every: [['spoon', 'knife'], 2.2, 0.5] },
  snack: { start: 'fridge', every: ['crunch', 0.9, 0.7], end: 'gulp' },
  eat: { start: 'clink', every: [['crunch', 'crunch', 'spoon'], 0.85, 0.7], end: ['gulp', 'burp'] },
  tv: { start: 'switch', end: 'switch' },
  cuddle: { start: 'switch', end: 'switch' },
  read: { start: 'page', every: ['page', 2.6, 0.5] },
  water_plant: { start: 'pour' }, waterplot: { start: 'pour' },
  garden: { every: ['dig', 1.4, 0.6] }, plant: { start: 'dig' }, harvest: { start: 'leaves', end: 'pop' }, fertilize: { start: 'leaves' },
  mushroom: { start: 'leaves', end: 'pop' }, berries: { start: 'leaves', end: 'pop' }, pick: { start: 'leaves' },
  chop: { every: ['chop', 0.9, 0.8], end: 'wood_drop' }, mine: { every: ['mine', 0.9, 0.8] },
  addwood: { start: 'wood_drop' }, lightfire: { start: 'whoosh' },
  mow: { loop: ['engine_high', 0.32, { rate: 1.35 }] },
  drawwater: { start: 'bucket' },
  repairstand: { every: [['hammer', 'saw'], 0.8, 0.7] },
  sellwood: { start: 'wood_drop', end: 'register' },
  read_mail: { start: 'paper' }, stand: { start: 'shopbell' }, openstand: { start: 'shopbell' },
  swing: { every: ['whoosh', 1.75, 0.25] },
  cleanfridge: { start: 'fridge', every: ['spray', 1.4, 0.5] },
  scrubtub: { every: ['squelch', 1.1, 0.5] },
  fixtv: { every: [['metal_hit', 'hammer'], 1.2, 0.5] },
  unclog: { every: ['squelch', 0.9, 0.6], end: 'flush' },
  fish: { start: 'whoosh' },
  carousel: { start: 'chimes', every: [['chimes', 'whoosh'], 2.2, 0.3] },
};

/** bucle in timpul minijocurilor (ambianta zonei se aude mai incet) */
const MINI_LOOPS: Record<string, [string, number, LoopOpts?][]> = {
  pancakes: [['sizzle_loop', 0.42]], soup: [['boil_loop', 0.45]], bath: [['bath_loop', 0.45]],
  dishes: [['water_loop', 0.32]], teeth: [['water_loop', 0.16]], socks: [['machine_loop', 0.28]],
  mow: [['engine_high', 0.3, { rate: 1.35 }]], fire: [['fire_loop', 0.55]],
  fishing: [['amb_lake', 0.55], ['amb_forest', 0.3]],
  cafe: [['amb_restaurant', 0.45]], resto: [['amb_restaurant', 0.5]], cinema: [['amb_restaurant', 0.14, { lp: 700 }]],
  office: [['amb_room', 0.45]], bakery: [['fire_loop', 0.2], ['amb_restaurant', 0.18]], nurse: [['amb_room', 0.4]],
  post: [['amb_room', 0.35]], course: [['amb_room', 0.35]], shop: [['amb_room', 0.3]],
  merge: [['amb_yard', 0.35]], ferris: [['amb_wind', 0.4], ['amb_yard', 0.25]],
  tubscrub: [['water_loop', 0.18]], plunger: [['water_loop', 0.1]],
  bedtime: [['amb_crickets', 0.25]], snore: [['amb_night', 0.3]],
};

/** sunetul pasului dupa suprafata */
function stepKind(f: Floor): string {
  switch (f) {
    case 'wood': case 'pinkwood': return 'wood';
    case 'tileblue': case 'checker': case 'asphalt': case 'sidewalk': case 'road': return 'stone';
    case 'path': case 'dirt': case 'sand': return 'dirt';
    default: return 'grass';
  }
}

interface PawnSnd { stepT: number; act: unknown; everyT: number; inside?: boolean }

export class Soundscape {
  private t = 0;
  private oneT = 6;
  private pawn: Record<string, PawnSnd> = {};
  private travelRef: unknown = null;
  private travelDoor = 0; private stairT = 0;
  private lastHour = -1;
  private tv = FURNITURE.find(f => f.id === 'tv' || f.type === 'tv');

  constructor(private s: WorldScene) {}

  /** 0..1: cat de tare se aude un personaj (zona + distanta fata de tine) */
  audible(p: Pawn) {
    const s = this.s;
    if (p === s.me) return 1;
    if (!s.sameArea() || s.travel) return 0;
    const d = Math.hypot(p.gx - s.me.gx, p.gy - s.me.gy);
    return clamp01(1.15 - d / 13);
  }
  pan(p: { gx: number; gy: number }) {
    const a = iso(p.gx, p.gy), b = iso(this.s.me.gx, this.s.me.gy);
    return Math.max(-0.75, Math.min(0.75, (a.x - b.x) / 420));
  }
  /** un sunet scos de un personaj (se aude doar daca e langa tine) */
  at(p: Pawn, id: S, vol = 1, rate = 1) {
    const k = this.audible(p); if (k <= 0.02) return;
    Sfx.play(one(id), { vol: vol * k, rate, pan: p === this.s.me ? 0 : this.pan(p) });
  }
  /** un sunet de loc (fantana, animale): dupa distanta */
  spot(x: number, y: number, id: S, vol = 1, range = 14) {
    const d = Math.hypot(x - this.s.me.gx, y - this.s.me.gy), k = clamp01(1.1 - d / range);
    if (k > 0.03) Sfx.play(one(id), { vol: vol * k, pan: this.pan({ gx: x, gy: y }) });
  }

  actStart(p: Pawn, id: string) { const a = ACT_SOUNDS[id]; if (a?.start) this.at(p, a.start, 0.8); }
  actEnd(p: Pawn, id: string) { const a = ACT_SOUNDS[id]; if (a?.end) this.at(p, a.end, 0.8); }
  /** sforait: Dudu tare si gros, Bubu fin */
  snore(p: Pawn) { this.at(p, 'snore', p.id === 'dudu' ? 0.75 : 0.45, p.id === 'dudu' ? 0.9 : 1.22); }

  stop() { Sfx.keepOnly([]); }

  update(dt: number) {
    const s = this.s; this.t += dt;
    if (!Sfx.has('amb_room')) return; // sunetele inca se incarca
    const keep: string[] = [];
    const L = (key: string, id: string, vol: number, o?: LoopOpts) => { if (vol > 0.005) { keep.push(key); Sfx.loop(key, id, vol, o); } };
    const night = nightAmount(s.w.minutes), day = 1 - night, hr = s.w.minutes / 60;
    const me = s.me, mini = s.minigame?.id;

    // ---------- pasii (si roata / motorul cand conduci)
    for (const p of [me, s.partner]) {
      const st = (this.pawn[p.id] ??= { stepT: 0.1, act: null, everyT: 1 });
      const k = this.audible(p);
      const walking = k > 0 && p.actor.moving && !p.riding && !p.passenger && !p.board && !s.travel && !p.activity;
      if (walking) {
        st.stepT -= dt;
        if (st.stepT <= 0) {
          const run = p.actor.running;
          st.stepT = run ? rnd(0.26, 0.3) : rnd(0.4, 0.46);
          const f = floorAt(Math.floor(p.gx), Math.floor(p.gy));
          if (f === 'water') this.at(p, 'splash', 0.25);
          else this.at(p, (run ? 'run_' : 'step_') + stepKind(f), (p === me ? 0.42 : 0.3) * (run ? 1.1 : 1));
        }
      } else st.stepT = Math.min(st.stepT, 0.12);
      // vehicule pe harta (bicicleta: pedalat, scuter: motor)
      if (p.riding && k > 0 && !s.travel) {
        const v = (p.actor.moving ? 1 : 0.45) * k;
        if (p.rideKind === 'bike') L('ride-' + p.id, 'pedal_loop', p.actor.moving ? 0.35 * k : 0, { bus: 'sfx', pan: this.pan(p) });
        else L('ride-' + p.id, 'engine_high', 0.28 * v, { bus: 'sfx', rate: p.actor.moving ? 1.05 : 0.7, pan: this.pan(p) });
      }
      // activitati: bucle + sunete din cand in cand
      const act = p.activity;
      if (act !== st.act) { st.act = act; st.everyT = 0.5; }
      if (act && k > 0) {
        const def = ACT_SOUNDS[act.a.id];
        const myMini = p === me && !!mini;
        if (def?.loop && !myMini) L('act-' + p.id, def.loop[0], def.loop[1] * k, { bus: 'sfx', pan: this.pan(p), ...(def.loop[2] ?? {}) });
        if (def?.every && !myMini) {
          st.everyT -= dt;
          if (st.everyT <= 0) { st.everyT = def.every[1] * rnd(0.8, 1.25); this.at(p, def.every[0], def.every[2] ?? 0.6); }
        }
      }
    }

    // usa casei: intri / iesi
    if (s.area === 'home' && !s.travel) {
      const st = this.pawn[me.id];
      const inside = me.gx >= HOUSE.x0 && me.gx <= HOUSE.x1 + 1 && me.gy >= HOUSE.y0 && me.gy <= HOUSE.y1 + 1;
      if (st.inside != null && st.inside !== inside) Sfx.play(inside ? 'door_close' : 'door_open', { vol: 0.35 });
      st.inside = inside;
    } else if (this.pawn[me.id]) this.pawn[me.id].inside = undefined;

    // ---------- calatorii (vehicule)
    const tr = s.travel;
    if (tr !== this.travelRef) {
      this.travelRef = tr; this.travelDoor = 0; this.stairT = 0.6;
      if (tr) {
        const v = tr.vehicle;
        if (v === 'bus') Sfx.play('bus_doors', { vol: 0.6 });
        else if (v === 'bike') Sfx.play('bike_bell', { vol: 0.5 });
        else if (v === 'door') Sfx.play('door_open', { vol: 0.6 });
        else if (v === 'taxi') Sfx.play('car_door', { vol: 0.6 });
        else if (v === 'tractor' || v === 'scooter') Sfx.play('car_start', { vol: 0.5, rate: v === 'scooter' ? 1.3 : 0.8 });
      }
    }
    if (tr) {
      const v = tr.vehicle, end = clamp01((4 - tr.t) / 0.8), beg = clamp01(tr.t / 0.6), k = Math.min(end, beg);
      if (v === 'door') {
        // scara blocului: usa (deschis / inchis), pasii pe trepte, usa de la capat
        if (this.travelDoor === 0 && tr.t > 0.4) { this.travelDoor = 1; Sfx.play('door_close', { vol: 0.55 }); }
        if (tr.t > 0.55 && tr.t < 2.6) { this.stairT -= dt; if (this.stairT <= 0) { this.stairT = 0.27; Sfx.play('step_stone', { vol: 0.4, rate: 0.95 + Math.random() * 0.1 }); if (tr.withPartner) Sfx.play('step_stone', { vol: 0.22, delay: 0.12 }); } }
        if (this.travelDoor === 1 && tr.t > 2.6) { this.travelDoor = 2; Sfx.play('door_open', { vol: 0.55 }); }
        if (this.travelDoor === 2 && tr.t > 3.0) { this.travelDoor = 3; Sfx.play('door_close', { vol: 0.4 }); }
      }
      else if (v === 'tractor') L('travel', 'engine_slow', 0.55 * k, { bus: 'sfx' });
      else if (v === 'bus') L('travel', 'engine_slow', 0.5 * k, { bus: 'sfx', rate: 0.78 });
      else if (v === 'bike') L('travel', 'pedal_loop', 0.45 * k, { bus: 'sfx' });
      else L('travel', 'engine_high', 0.42 * k, { bus: 'sfx', rate: v === 'taxi' ? 0.85 : 1 });
    }

    // ---------- ambianta zonei (+ surse de loc)
    Sfx.ambLevel(mini ? 0.3 : tr ? 0.35 : 0.6);
    const area = s.area;
    const dist = (x: number, y: number) => Math.hypot(x - me.gx, y - me.gy);
    const near = (x: number, y: number, r: number, full = 1.5) => clamp01(1 - (dist(x, y) - full) / r);
    if (area === 'home') {
      const inside = me.gx >= HOUSE.x0 && me.gx <= HOUSE.x1 + 1 && me.gy >= HOUSE.y0 && me.gy <= HOUSE.y1 + 1;
      const fuel = (s.w.furn.fire as number) ?? 0;
      if (inside) {
        L('amb1', 'amb_room', 0.5);
        L('amb2', 'amb_yard', 0.16 * day, { lp: 1200 });
        L('amb3', 'amb_crickets', 0.14 * night, { lp: 1800 });
      } else {
        L('amb1', 'amb_yard', 0.65 * day + 0.05);
        L('amb2', 'amb_night', 0.5 * night);
        L('amb3', 'amb_crickets', 0.45 * night);
        L('spot-stream', 'stream_loop', 0.4 * near(1, 7.5, 7, 1));
        L('spot-pond', 'stream_loop', 0.25 * near(18, 18, 6, 1), { rate: 0.85 });
      }
      if (fuel > 0) L('spot-fire', 'fire_loop', (inside ? 0.6 : 0.25) * near(7.5, 7.5, 8, 1.2), { lp: inside ? 20000 : 1500 });
      if (s.w.furn.tvOn && this.tv) L('spot-tv', 'amb_restaurant', 0.22 * near(this.tv.gx + 0.5, this.tv.gy + 0.5, 8, 1.5) * (inside ? 1 : 0.3), { lp: 2600 });
    } else if (area === 'forest') {
      L('amb1', 'amb_forest', 0.7 * day + 0.06);
      L('amb2', 'amb_night', 0.6 * night);
      L('amb3', 'amb_crickets', 0.3 * night);
      L('amb4', 'amb_wind', 0.14);
      L('spot-lake', 'amb_lake', 0.55 * near(15, 8, 8, 2.5));
    } else if (area === 'village') {
      L('amb1', 'amb_yard', 0.55 * day + 0.05);
      L('amb2', 'amb_night', 0.5 * night);
      L('amb3', 'amb_crickets', 0.35 * night);
      L('amb4', 'amb_wind', 0.08);
      L('spot-fountain', 'fountain_loop', 0.5 * near(8.5, 14.5, 7, 1));
    } else if (area === 'city') {
      L('amb1', 'amb_city', 0.62 - 0.22 * night);
      L('amb2', 'amb_crickets', 0.12 * night);
      L('spot-fountain', 'fountain_loop', 0.5 * near(19, 18, 7, 1.5));
    } else if (area === 'apartment') {
      L('amb1', 'amb_room', 0.5);
      L('amb2', 'amb_city', 0.2 - 0.06 * night, { lp: 900 });
    }
    if (mini) { const own = (s.minigame!.obj as { loops?: [string, number, LoopOpts?][] }).loops; for (const [i, [id, v, o]] of (own ?? MINI_LOOPS[mini] ?? []).entries()) L('mini' + i, id, v, { bus: 'sfx', ...(o ?? {}) }); }
    Sfx.keepOnly(keep);

    // ---------- sunete rare: animale, clopote, masini, pasari
    if (!tr) {
      this.oneT -= dt;
      if (this.oneT <= 0) {
        this.oneT = rnd(5, 12);
        const rx = me.gx + rnd(-9, 9), ry = me.gy + rnd(-7, 7);
        if (area === 'village') {
          if (night > 0.6) { if (Math.random() < 0.6) this.spot(rx, ry, Math.random() < 0.7 ? 'owl' : 'dog', 0.35, 20); }
          else this.spot(rx, ry, pick(['chicken', 'chicken', 'duck', 'dog', 'sheep', 'horse', 'pig', 'cat', 'birds']), 0.45, 20);
        } else if (area === 'forest') {
          if (night > 0.6) this.spot(rx, ry, 'owl', 0.4, 20);
          else this.spot(rx, ry, pick(['birds', 'birds', 'leaves', 'wood_drop']), 0.4, 20);
        } else if (area === 'home' && !mini) {
          const inside = me.gx >= HOUSE.x0 && me.gx <= HOUSE.x1 + 1 && me.gy >= HOUSE.y0 && me.gy <= HOUSE.y1 + 1;
          if (inside) { if (Math.random() < 0.35) Sfx.play('clock_tick', { vol: 0.2 }); }
          else if (night > 0.6) { if (Math.random() < 0.5) this.spot(rx, ry, 'owl', 0.3, 20); }
          else this.spot(rx, ry, pick(['birds', 'birds', 'chicken', 'leaves']), 0.35, 20);
        } else if (area === 'city') {
          this.spot(rx, ry, pick(['car_start', 'car_door', 'bike_bell', 'bus_doors', night > 0.5 ? 'dog' : 'birds']), 0.4, 20);
          if (Math.random() < 0.12) Sfx.play('train', { vol: 0.25 });
        } else if (area === 'apartment') {
          if (Math.random() < 0.3) Sfx.play('clock_tick', { vol: 0.2 });
        }
      }
      // clopotele bisericii din sat: la 8, 12 si 18
      const h = Math.floor(hr);
      if (h !== this.lastHour) {
        if (this.lastHour >= 0 && (h === 8 || h === 12 || h === 18) && (area === 'village' || area === 'home')) Sfx.play('bells', { vol: area === 'village' ? 0.5 : 0.18 });
        if (this.lastHour >= 0 && h === 7 && area === 'home') Sfx.play('chicken', { vol: 0.35, rate: 0.9 }); // cocosul dimineata
        this.lastHour = h;
      }
    }
  }
}
