// Economia: bani, inventar, preturi, obiective pe capitole.
import type { WorldState } from './state';

export const INV_INFO: Record<string, { icon: string; label: string }> = {
  seeds: { icon: '🌰', label: 'Semințe' },
  veg: { icon: '🥕', label: 'Legume' },
  meals: { icon: '🍲', label: 'Porții de mâncare' },
  hay: { icon: '🌾', label: 'Fân' },
  flour: { icon: '🥡', label: 'Făină' },
  lemon: { icon: '🍋', label: 'Lămâi' },
};

/** magazinul din sat */
export const SHOP_BUY = [
  { id: 'seeds', label: 'Pachet de semințe (x3)', icon: '🌰', price: 6, give: { seeds: 3 } },
  { id: 'meals', label: 'Mâncare gata (x2 porții)', icon: '🍱', price: 14, give: { meals: 2 } },
  { id: 'veg', label: 'Legume de la piață (x3)', icon: '🥕', price: 9, give: { veg: 3 } },
  { id: 'wood', label: 'Lemne de foc (x4)', icon: '🪵', price: 10, give: { wood: 4 } },
  { id: 'flour', label: 'Sac de făină (x3)', icon: '🌾', price: 8, give: { flour: 3 } },
  { id: 'lemon', label: 'Lămâi (x3)', icon: '🍋', price: 9, give: { lemon: 3 } },
];
export const SHOP_SELL = [
  { id: 'wood', label: 'Lemne', icon: '🪵', price: 2 },
  { id: 'veg', label: 'Legume', icon: '🥕', price: 3 },
  { id: 'hay', label: 'Fân', icon: '🌾', price: 2 },
  { id: 'stone', label: 'Piatră', icon: '🪨', price: 2 },
  { id: 'flower', label: 'Flori', icon: '🌸', price: 2 },
];

export interface Goal {
  id: string; text: string; icon: string;
  done: (w: WorldState) => boolean;
  reward: { money?: number; hearts?: number };
  hint: string;
  cost?: { money?: number; wood?: number; stone?: number }; // obiective care se "cumpara"
}

const st = (w: WorldState, k: string) => w.stats[k] ?? 0;

export interface Chapter { id: number; title: string; intro: string; done: string; goals: Goal[] }

/** Povestea pe capitole. Treburile dintr-un capitol se pot face in orice ordine. */
export const CHAPTERS: Chapter[] = [
  {
    id: 0, title: 'Capitolul 0 · Căsuța noastră', done: '🎉 Casa e curată și caldă! Curtea s-a deblocat 🌳',
    intro: 'V-ați mutat într-o căsuță veche de la țară. Ușile rămân închise până puneți casa în ordine!',
    goals: [
      { id: 'fire', icon: '🔥', text: 'Aprinde focul în sobă', hint: 'Soba din sufragerie (ai lemne în coș 🪵)', done: w => st(w, 'fireLit') > 0, reward: { hearts: 3 } },
      { id: 'toilet', icon: '🪠', text: 'Desfundă toaleta', hint: 'Baia — cineva a lăsat o surpriză 💩', done: w => !w.furn.clogged && st(w, 'unclogged') > 0, reward: { hearts: 3 } },
      { id: 'fridgeclean', icon: '🧊', text: 'Curăță frigiderul', hint: 'Bucătăria — aruncă tot ce s-a stricat', done: w => !w.furn.fridgeDirty, reward: { hearts: 3 } },
      { id: 'tub', icon: '🛁', text: 'Spală cada', hint: 'Baia — e plină de murdărie', done: w => !w.furn.tubDirty, reward: { hearts: 3 } },
      { id: 'dishes', icon: '🍽️', text: 'Spală vasele', hint: 'Chiuveta din bucătărie', done: w => !w.furn.dishesDirty, reward: { hearts: 3 } },
      { id: 'tv', icon: '📺', text: 'Repară televizorul', hint: 'Sufrageria — firele sunt încurcate', done: w => !w.furn.tvBroken, reward: { hearts: 3 } },
      { id: 'cook', icon: '🥞', text: 'Gătește prima masă caldă', hint: 'Aragazul (ai câteva legume 🥕)', done: w => st(w, 'cooked') >= 1, reward: { hearts: 5 } },
    ],
  },
  {
    id: 1, title: 'Capitolul 1 · Curtea', done: '🚜 Dudu a primit un tractoraș! Pădurea vă așteaptă',
    intro: 'Curtea e sălbatică. Faceți ordine, strângeți resurse și câștigați primii bani la tarabă.',
    goals: [
      { id: 'mow', icon: '✂️', text: 'Tunde iarba din curte', hint: 'Magazia din curte → mașina de tuns', done: w => st(w, 'mowed') >= 1, reward: { money: 10 } },
      { id: 'wood5', icon: '🪓', text: 'Taie 8 lemne de foc', hint: 'Copacii din curte — Dudu e cel mai bun tăietor', done: w => st(w, 'woodTotal') >= 8, reward: { money: 10 } },
      { id: 'flowers', icon: '🌸', text: 'Culege 6 flori', hint: 'Flori sălbatice în curte și lângă drum', done: w => st(w, 'flowerTotal') >= 6, reward: { money: 5 } },
      { id: 'veg3', icon: '🥕', text: 'Culege 3 legume din grădină', hint: 'Grădina din curte (ai nevoie de semințe 🌰)', done: w => st(w, 'vegTotal') >= 3, reward: { money: 10, hearts: 5 } },
      { id: 'serve3', icon: '🧺', text: 'Servește 3 clienți la tarabă', hint: 'Taraba de lângă drum (ieși pe portiță)', done: w => st(w, 'served') >= 3, reward: { money: 20 } },
      { id: 'money100', icon: '💰', text: 'Strânge 100 de lei', hint: 'Taraba, vânzarea în sat', done: w => (w.money ?? 0) >= 100, reward: { hearts: 10 } },
    ],
  },
  {
    id: 2, title: 'Capitolul 2 · Pădurea (în lucru)', done: '🚲 Cu bicicleta puteți merge în sat!',
    intro: 'Dudu merge cu tractorașul la pădure, taie lemne și le vinde. Cu banii cumpărați online o bicicletă.',
    goals: [
      { id: 'tractor', icon: '🚜', text: 'Prima tură la pădure cu tractorașul', hint: 'În curând!', done: w => st(w, 'forestTrips') > 0, reward: { money: 20 } },
      { id: 'bike', icon: '🚲', text: 'Cumpărați o bicicletă online', hint: 'Laptopul din casă (în curând)', done: w => st(w, 'bike') > 0, reward: { hearts: 15 } },
    ],
  },
];

export const GOALS: Goal[] = CHAPTERS.flatMap(c => c.goals);
export const chapterOf = (w: WorldState) => CHAPTERS[Math.min(CHAPTERS.length - 1, (w.stats.chapter ?? 0))];
export const currentGoal = (w: WorldState) => chapterOf(w).goals.find(g => !w.stats['goal-' + g.id]);
