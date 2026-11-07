// Bucataria: ingrediente, retete romanesti si mancarurile gatite (fiecare cu efectele ei).
// Mancarurile gatite stau in inventar ca `dish_<id>`; `meals` = mancare gata cumparata (generica).
import type { NeedKey } from './state';

/** ingrediente noi (pe langa legumele din gradina, peste, ciuperci, mure, faina, lamai, apa) */
export const INGREDIENTS: Record<string, { icon: string; label: string }> = {
  egg: { icon: '🥚', label: 'Ouă' }, milk: { icon: '🥛', label: 'Lapte' }, cheese: { icon: '🧀', label: 'Brânză' },
  meat: { icon: '🥩', label: 'Carne' }, cornmeal: { icon: '🌽', label: 'Mălai' }, rice: { icon: '🍚', label: 'Orez' },
};

/** grupuri de ingrediente: "orice leguma", "orice fruct", "orice floare" */
export const GROUPS: Record<string, { icon: string; label: string; keys: string[] }> = {
  anyveg: { icon: '🥕', label: 'legume', keys: ['veg', 'carrot', 'potato', 'tomato', 'cabbage', 'mushroom'] },
  fruit: { icon: '🍓', label: 'fructe', keys: ['strawberry', 'berry'] },
  anyflower: { icon: '🌸', label: 'flori', keys: ['flower', 'tulip', 'rose', 'sunflower'] },
};

export type Method = 'pancakes' | 'fry' | 'boil' | 'oven' | 'cold';
export interface Recipe {
  id: string; name: string; icon: string;
  need: Record<string, number>; // chei de inventar sau grupuri (anyveg, fruit, anyflower)
  portions: number; method: Method;
  needs: Partial<Record<NeedKey, number>>; fart?: number;
  text: string; // ce spui cand mananci
}

export const RECIPES: Recipe[] = [
  { id: 'ciorba', name: 'Ciorbă de legume', icon: '🍲', need: { anyveg: 2, water: 1 }, portions: 4, method: 'boil', needs: { hunger: 34, warmth: 10, health: 5 }, fart: 12, text: 'Ciorbă caldă, ca la bunica! 🍲' },
  { id: 'clatite', name: 'Clătite', icon: '🥞', need: { flour: 1, egg: 1, milk: 1 }, portions: 4, method: 'pancakes', needs: { hunger: 28, fun: 10, love: 4 }, text: 'Clătite pufoase! 🥞' },
  { id: 'omleta', name: 'Omletă', icon: '🍳', need: { egg: 2 }, portions: 2, method: 'fry', needs: { hunger: 30, energy: 8 }, text: 'O omletă de dimineață! 🍳' },
  { id: 'mamaliga', name: 'Mămăligă cu brânză', icon: '🫓', need: { cornmeal: 1, cheese: 1, water: 1 }, portions: 3, method: 'boil', needs: { hunger: 46, energy: 6, warmth: 4 }, text: 'Mămăliguță cu brânză! 🫓' },
  { id: 'sarmale', name: 'Sarmale', icon: '🥘', need: { cabbage: 1, meat: 1, rice: 1 }, portions: 5, method: 'boil', needs: { hunger: 50, love: 8, warmth: 6 }, fart: 35, text: 'Sarmale ca de sărbătoare! 🥘' },
  { id: 'papanasi', name: 'Papanași', icon: '🍩', need: { cheese: 1, flour: 1, egg: 1, fruit: 1 }, portions: 3, method: 'fry', needs: { hunger: 26, fun: 14, love: 8 }, text: 'Papanași cu dulceață! 🍩' },
  { id: 'pizza', name: 'Pizza de casă', icon: '🍕', need: { flour: 1, tomato: 1, cheese: 1 }, portions: 4, method: 'oven', needs: { hunger: 38, fun: 12 }, text: 'Pizza făcută de noi! 🍕' },
  { id: 'placinta', name: 'Plăcintă cu fructe', icon: '🥧', need: { flour: 1, egg: 1, fruit: 2 }, portions: 4, method: 'oven', needs: { hunger: 26, fun: 10, love: 6 }, text: 'Plăcintă caldă! 🥧' },
  { id: 'peste', name: 'Pește la grătar', icon: '🍢', need: { fish: 1, lemon: 1 }, portions: 2, method: 'fry', needs: { hunger: 38, health: 8 }, text: 'Pește cu lămâie, delicios! 🍢' },
  { id: 'supa', name: 'Supă cremă de ciuperci', icon: '🥣', need: { mushroom: 2, milk: 1 }, portions: 3, method: 'boil', needs: { hunger: 32, warmth: 10 }, text: 'Supă cremă de ciuperci 🥣' },
  { id: 'piure', name: 'Piure de cartofi', icon: '🍠', need: { potato: 2, milk: 1 }, portions: 3, method: 'boil', needs: { hunger: 36, energy: 4 }, text: 'Piure cremos! 🍠' },
  { id: 'salata', name: 'Salată de vară', icon: '🥗', need: { tomato: 1, anyveg: 1 }, portions: 2, method: 'cold', needs: { hunger: 18, health: 8, energy: 5 }, text: 'Salată proaspătă 🥗' },
  { id: 'limonada', name: 'Limonadă', icon: '🍹', need: { lemon: 2, water: 1 }, portions: 3, method: 'cold', needs: { hunger: 6, fun: 10, energy: 8 }, text: 'Limonadă rece! 🍹' },
  { id: 'ceai', name: 'Ceai de flori', icon: '🍵', need: { water: 1, anyflower: 1 }, portions: 2, method: 'boil', needs: { hunger: 2, warmth: 14, health: 6 }, text: 'Un ceai cald 🍵' },
];
export const RECIPE: Record<string, Recipe> = Object.fromEntries(RECIPES.map(r => [r.id, r]));
export const dishKey = (id: string) => 'dish_' + id;

/** mancare gata cumparata (fara reteta) */
export const READY_MEAL: Recipe = { id: 'meals', name: 'Mâncare gata', icon: '🍱', need: {}, portions: 1, method: 'cold', needs: { hunger: 36, love: 3, energy: 4 }, fart: 15, text: 'Ce bună a fost! 🍱' };

type Res = Record<string, number>;
const have = (r: Res, k: string) => (GROUPS[k] ? GROUPS[k].keys.reduce((s, x) => s + (r[x] ?? 0), 0) : r[k] ?? 0);
/** ce lipseste pentru reteta (lista goala = se poate gati) */
export function missingFor(r: Res, rc: Recipe) { return Object.entries(rc.need).filter(([k, n]) => have(r, k) < n).map(([k, n]) => ({ k, n, has: have(r, k) })); }
export const canCook = (r: Res, rc: Recipe) => missingFor(r, rc).length === 0;
export function ingIcon(k: string) { return GROUPS[k]?.icon ?? INGREDIENTS[k]?.icon ?? ({ water: '💧', flour: '🥡', lemon: '🍋', fish: '🐟', mushroom: '🍄', berry: '🫐', strawberry: '🍓', carrot: '🥕', potato: '🥔', tomato: '🍅', cabbage: '🥬', veg: '🥕' } as Record<string, string>)[k] ?? '•'; }
export function ingLabel(k: string) { return GROUPS[k]?.label ?? INGREDIENTS[k]?.label.toLowerCase() ?? ({ water: 'apă', flour: 'făină', lemon: 'lămâi', fish: 'pește', mushroom: 'ciuperci', berry: 'mure', strawberry: 'căpșuni', carrot: 'morcovi', potato: 'cartofi', tomato: 'roșii', cabbage: 'varză' } as Record<string, string>)[k] ?? k; }
/** lista de consum concret (grupurile se iau din ce ai mai mult) */
export function consumeList(r: Res, rc: Recipe): [string, number][] {
  const out: [string, number][] = []; const left = { ...r };
  for (const [k, n] of Object.entries(rc.need)) {
    if (!GROUPS[k]) { out.push([k, n]); left[k] = (left[k] ?? 0) - n; continue; }
    let need = n;
    while (need > 0) {
      const key = GROUPS[k].keys.filter(x => (left[x] ?? 0) > 0).sort((a, b) => (left[b] ?? 0) - (left[a] ?? 0))[0];
      if (!key) break;
      out.push([key, 1]); left[key]--; need--;
    }
  }
  return out;
}
/** mancarurile gata din inventar */
export function dishesOwned(r: Res): { rc: Recipe; n: number; key: string }[] {
  const out = RECIPES.filter(rc => (r[dishKey(rc.id)] ?? 0) > 0).map(rc => ({ rc, n: r[dishKey(rc.id)], key: dishKey(rc.id) }));
  if ((r.meals ?? 0) > 0) out.push({ rc: READY_MEAL, n: r.meals, key: 'meals' });
  return out;
}
/** cheile care conteaza ca „mancare calda” (podul, cererile satenilor): mancarea gata + mancarurile gatite, fara cele reci (salata, limonada) */
export function hotMealKeys(r: Res): string[] { return ['meals', ...RECIPES.filter(rc => rc.method !== 'cold' && (r[dishKey(rc.id)] ?? 0) > 0).sort((a, b) => (r[dishKey(b.id)] ?? 0) - (r[dishKey(a.id)] ?? 0)).map(rc => dishKey(rc.id))]; }
export const hotMealCount = (r: Res) => hotMealKeys(r).reduce((a, k) => a + (r[k] ?? 0), 0);
export const dishCount = (r: Res) => dishesOwned(r).reduce((s, d) => s + d.n, 0);
/** ce ar gati / manca partenerul AI: cea mai satioasa optiune */
export function bestRecipe(r: Res) { return RECIPES.filter(rc => canCook(r, rc) && (rc.needs.hunger ?? 0) >= 18).sort((a, b) => (b.needs.hunger ?? 0) * b.portions - (a.needs.hunger ?? 0) * a.portions)[0] ?? null; }
export function bestDish(r: Res) { return dishesOwned(r).sort((a, b) => (b.rc.needs.hunger ?? 0) - (a.rc.needs.hunger ?? 0))[0] ?? null; }
/** textul cu efecte (pentru butoane) */
const NEED_ICON: Record<string, string> = { hunger: '🍽️', energy: '⚡', warmth: '🔥', health: '🩹', fun: '🎈', love: '💕', hygiene: '🫧' };
export function effectText(rc: Recipe) { return Object.entries(rc.needs).filter(([, v]) => (v ?? 0) > 0).map(([k, v]) => `${NEED_ICON[k] ?? ''}+${v}`).join(' '); }
