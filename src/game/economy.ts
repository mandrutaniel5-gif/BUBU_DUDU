// Economia: bani, inventar, preturi, obiective pe capitole.
import type { WorldState } from './state';

export const INV_INFO: Record<string, { icon: string; label: string }> = {
  seeds: { icon: '🌰', label: 'Semințe' },
  veg: { icon: '🥕', label: 'Legume' },
  meals: { icon: '🍲', label: 'Porții de mâncare' },
  hay: { icon: '🌾', label: 'Fân' },
};

/** magazinul din sat */
export const SHOP_BUY = [
  { id: 'seeds', label: 'Pachet de semințe (x3)', icon: '🌰', price: 6, give: { seeds: 3 } },
  { id: 'meals', label: 'Mâncare gata (x2 porții)', icon: '🍱', price: 14, give: { meals: 2 } },
  { id: 'veg', label: 'Legume de la piață (x3)', icon: '🥕', price: 9, give: { veg: 3 } },
  { id: 'wood', label: 'Lemne de foc (x4)', icon: '🪵', price: 10, give: { wood: 4 } },
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

/** Capitolul 1: Căsuța de la țară */
export const GOALS: Goal[] = [
  { id: 'fire', icon: '🔥', text: 'Aprinde focul în sobă', hint: 'Mergi la sobă (în sufragerie) — ai nevoie de lemne 🪵', done: w => st(w, 'fireLit') > 0, reward: { hearts: 5 } },
  { id: 'wood5', icon: '🪓', text: 'Taie 8 lemne de foc', hint: 'Copacii din curte — Dudu e cel mai bun tăietor', done: w => st(w, 'woodTotal') >= 8, reward: { money: 10 } },
  { id: 'veg3', icon: '🥕', text: 'Culege 3 legume din grădină', hint: 'Ai nevoie de semințe 🌰 (de la magazinul din sat)', done: w => st(w, 'vegTotal') >= 3, reward: { money: 10, hearts: 5 } },
  { id: 'serve3', icon: '🧺', text: 'Servește 3 clienți la taraba lui Bubu', hint: 'Taraba din fața casei: unește produse și dă-le clienților', done: w => st(w, 'served') >= 3, reward: { money: 20 } },
  { id: 'mow', icon: '✂️', text: 'Tunde iarba din curte', hint: 'Magazia din curte → mașina de tuns', done: w => st(w, 'mowed') >= 1, reward: { money: 10 } },
  { id: 'cook', icon: '🥞', text: 'Gătește o masă caldă', hint: 'Aragazul din bucătărie (folosește legume)', done: w => st(w, 'cooked') >= 1, reward: { hearts: 8 } },
  { id: 'money150', icon: '💰', text: 'Strânge 150 de lei', hint: 'Taraba, vânzarea de lemne și legume în sat', done: w => (w.money ?? 0) >= 150, reward: { hearts: 10 } },
  { id: 'forest', icon: '🌲', text: 'Cumpără pădurea vecinului', hint: 'Mergi la poartă → Sat → Primăria', done: w => st(w, 'forest') > 0, reward: { hearts: 15 }, cost: { money: 120 } },
  { id: 'bighouse', icon: '🏡', text: 'Strângeți pentru Casa cea mare', hint: 'Capitolul 2: casă mare, săteni angajați, apoi orașul!', done: w => st(w, 'bighouse') > 0, reward: { hearts: 30 }, cost: { money: 400, wood: 30, stone: 20 } },
];

export const currentGoal = (w: WorldState) => GOALS.find(g => !w.stats['goal-' + g.id]);
