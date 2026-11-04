// Economia: bani, inventar, preturi, obiective pe capitole.
import type { WorldState } from './state';
import { CROPS, seedKey } from '../world/garden';
import { INGREDIENTS, RECIPES, dishKey } from './food';

export const INV_INFO: Record<string, { icon: string; label: string }> = {
  water: { icon: '💧', label: 'Apă (găleți)' },
  fish: { icon: '🐟', label: 'Pește' }, mushroom: { icon: '🍄', label: 'Ciuperci' }, berry: { icon: '🫐', label: 'Mure' },
  fert: { icon: '✨', label: 'Îngrășământ' },
  veg: { icon: '🥕', label: 'Legume' },
  meals: { icon: '🍲', label: 'Porții de mâncare' },
  hay: { icon: '🌾', label: 'Fân' },
  flour: { icon: '🥡', label: 'Făină' },
  lemon: { icon: '🍋', label: 'Lămâi' },
  carrot: { icon: '🥕', label: 'Morcovi' }, potato: { icon: '🥔', label: 'Cartofi' }, tomato: { icon: '🍅', label: 'Roșii' },
  cabbage: { icon: '🥬', label: 'Varză' }, strawberry: { icon: '🍓', label: 'Căpșuni' },
  tulip: { icon: '🌷', label: 'Lalele' }, rose: { icon: '🌹', label: 'Trandafiri' }, sunflower: { icon: '🌻', label: 'Floarea-soarelui' },
  ...Object.fromEntries(Object.values(CROPS).map(c => [seedKey(c.id), { icon: '🌰', label: 'Semințe: ' + c.name }])),
  ...INGREDIENTS,
  ...Object.fromEntries(RECIPES.map(r => [dishKey(r.id), { icon: r.icon, label: r.name }])),
};

/** preturile din joc (sat, oras, vehicule, distractii) si limitele zilnice de vanzare */
export const PRICE = {
  bike: 350, scooter: 800, bus: 8, taxi: 70, cinema: 35, resto: 70, ice: 10, carousel: 8, ferris: 15,
  consultVillage: 35, consultCity: 50, florarie: 450, workshop: 450, workshopWood: 20,
  sawmill: 2, sawmillDay: 15,      // cheresteaua: 2 lei lemnul, cel mult 15 lemne pe zi
  marketFull: 10,                  // la piata: dupa 10 bucati din acelasi lucru intr-o zi, pretul scade la jumatate; dupa 20, nu mai cumpara
  workshopDay: 3,                  // tamplaria: cel mult 3 comenzi pe zi
};
type ShopItem = { id: string; label: string; icon: string; price: number; give: Record<string, number> };
const seedItem = (c: (typeof CROPS)[string]): ShopItem => ({ id: seedKey(c.id), label: `Semințe de ${c.name.toLowerCase()} (x3)`, icon: '🌰', price: c.seed * 5, give: { [seedKey(c.id)]: 3 } });
/** magazinul online (din casa, cu laptopul): de baza */
export const SHOP_ONLINE: ShopItem[] = [
  ...Object.values(CROPS).filter(c => c.where === 'online').map(seedItem),
  { id: 'meals', label: 'Mâncare gata (x2 porții)', icon: '🍱', price: 30, give: { meals: 2 } },
  { id: 'wood', label: 'Lemne de foc (x4)', icon: '🪵', price: 16, give: { wood: 4 } },
  { id: 'flour', label: 'Sac de făină (x3)', icon: '🥡', price: 14, give: { flour: 3 } },
  { id: 'lemon', label: 'Lămâi (x3)', icon: '🍋', price: 15, give: { lemon: 3 } },
  { id: 'egg', label: 'Ouă de țară (x6)', icon: '🥚', price: 15, give: { egg: 6 } },
  { id: 'milk', label: 'Lapte (x2)', icon: '🥛', price: 10, give: { milk: 2 } },
  { id: 'cheese', label: 'Brânză de vaci (x2)', icon: '🧀', price: 18, give: { cheese: 2 } },
  { id: 'cornmeal', label: 'Mălai (x3)', icon: '🌽', price: 10, give: { cornmeal: 3 } },
  { id: 'rice', label: 'Orez (x3)', icon: '🍚', price: 12, give: { rice: 3 } },
  { id: 'meat', label: 'Carne tocată (x2)', icon: '🥩', price: 28, give: { meat: 2 } },
];
/** magazinul din sat: tot ce e online + seminte variate, ingrasamant, pamant */
export const SHOP_BUY: ShopItem[] = [
  ...Object.values(CROPS).map(seedItem),
  { id: 'fert', label: 'Îngrășământ (x3)', icon: '✨', price: 18, give: { fert: 3 } },
  { id: 'soil', label: 'Sac de pământ (1 răzor nou)', icon: '🟫', price: 30, give: { soil: 1 } },
  ...SHOP_ONLINE.filter(i => !i.id.startsWith('seed_')),
];
/** supermarketul din oras: mancare gata, dulciuri, plus tot ce e in sat */
export const SHOP_CITY: ShopItem[] = [
  { id: 'pizza', label: 'Pizza familială (x3 porții)', icon: '🍕', price: 45, give: { meals: 3 } },
  { id: 'bigcart', label: 'Coș mare de cumpărături (x6 porții)', icon: '🛒', price: 80, give: { meals: 6 } },
  { id: 'cake', label: 'Tort de ciocolată (x2 porții)', icon: '🍰', price: 30, give: { meals: 2 } },
  { id: 'coal', label: 'Brichete pentru sobă (x8 lemne)', icon: '📦', price: 30, give: { wood: 8 } },
  ...SHOP_BUY,
];
export const SHOP_SELL = [
  ...Object.values(CROPS).map(c => ({ id: c.id, label: c.name, icon: (INV_INFO[c.id]?.icon ?? '🌱'), price: c.sell })),
  { id: 'fish', label: 'Pește', icon: '🐟', price: 5 },
  { id: 'mushroom', label: 'Ciuperci', icon: '🍄', price: 3 },
  { id: 'berry', label: 'Mure', icon: '🫐', price: 2 },
  { id: 'wood', label: 'Lemne', icon: '🪵', price: 1 },
  { id: 'hay', label: 'Fân', icon: '🌾', price: 1 },
  { id: 'stone', label: 'Piatră', icon: '🪨', price: 1 },
  { id: 'flower', label: 'Flori sălbatice', icon: '🌸', price: 2 },
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
      { id: 'well', icon: '🪣', text: 'Scoate apă din fântână', hint: 'Fântâna de lângă grădină', done: w => st(w, 'waterDrawn') >= 1, reward: { hearts: 3 } },
      { id: 'plant3', icon: '🌱', text: 'Plantează 3 răzoare', hint: 'Atinge un răzor gol din grădină și alege semințele', done: w => st(w, 'planted') >= 3, reward: { money: 5 } },
      { id: 'harvest3', icon: '🧺', text: 'Culege 3 recolte', hint: 'Udă plantele 💧 și așteaptă să crească', done: w => st(w, 'harvested') >= 3, reward: { money: 15, hearts: 5 } },
      { id: 'stand', icon: '🔨', text: 'Repară taraba și deschide-o', hint: 'Taraba de lângă drum e stricată — ai nevoie de 6 lemne 🪵', done: w => st(w, 'standRepaired') > 0 && st(w, 'standOpened') > 0, reward: { hearts: 5 } },
      { id: 'serve3', icon: '🧺', text: 'Servește 3 clienți la tarabă', hint: 'Taraba de lângă drum (ieși pe portiță)', done: w => st(w, 'served') >= 3, reward: { money: 20 } },
      { id: 'money100', icon: '💰', text: 'Strânge 100 de lei', hint: 'Taraba, vânzarea în sat', done: w => (w.money ?? 0) >= 100, reward: { hearts: 10 } },
    ],
  },
  {
    id: 2, title: 'Capitolul 2 · Pădurea', done: '🚲 Cu bicicleta puteți merge în sat!',
    intro: 'Dudu merge cu tractorașul la pădure, taie lemne și le vinde. Cu banii cumpărați online o bicicletă.',
    goals: [
      { id: 'tractor', icon: '🚜', text: 'Prima tură la pădure cu tractorașul', hint: 'Tractorașul stă lângă magazie, în curte', done: w => st(w, 'forestTrips') > 0, reward: { money: 10 } },
      { id: 'logs15', icon: '🪓', text: 'Taie 15 lemne în pădure', hint: 'Brazii și copacii din pădure', done: w => st(w, 'forestWood') >= 15, reward: { money: 15 } },
      { id: 'mush', icon: '🍄', text: 'Culege 6 ciuperci', hint: 'Caută-le pe sub copaci', done: w => st(w, 'mushroomTotal') >= 6, reward: { hearts: 5 } },
      { id: 'fish3', icon: '🎣', text: 'Prinde 3 pești la lac', hint: 'Podețul de la lacul din pădure', done: w => (st(w, 'fishCaught')) >= 3, reward: { money: 15 } },
      { id: 'friend', icon: '🦌', text: 'Împrietenește-te cu un animal din pădure', hint: 'Apropie-te încet și mângâie-l de 3 ori', done: w => st(w, 'petFriends') >= 1, reward: { hearts: 10 } },
      { id: 'sellwood', icon: '💰', text: 'Vinde 15 lemne la cherestea', hint: 'Grămada de lemne de lângă tractoraș, acasă', done: w => st(w, 'woodSold') >= 15, reward: { money: 10 } },
      { id: 'bike', icon: '🚲', text: 'Cumpărați o bicicletă', hint: `Laptopul din casă → Vehicule (${PRICE.bike} lei)`, done: w => st(w, 'bike') > 0, reward: { hearts: 15 } },
    ],
  },
  {
    id: 3, title: 'Capitolul 3 · Satul', done: '🏙️ Satul vă iubește! Luați autobuzul din sat spre oraș 🚌',
    intro: 'Cu bicicleta sau scuterul ajungeți în sat: magazine, croitorie, parc, școală. Bubu își deschide o florărie, Dudu o tâmplărie!',
    goals: [
      { id: 'village1', icon: '🏘️', text: 'Prima vizită în sat', hint: 'Indicatorul „Spre sat” de lângă drum', done: w => st(w, 'villageTrips') > 0, reward: { money: 10 } },
      { id: 'clothes', icon: '🧵', text: 'Cumpără haine de la Croitorie', hint: 'Ie, vestă, salopetă, rochiță cu buline…', done: w => st(w, 'clothesBought') > 0, reward: { hearts: 5 } },
      { id: 'school', icon: '🏫', text: 'Mergi la o lecție la școală', hint: 'Școala satului', done: w => st(w, 'school') > 0, reward: { money: 10 } },
      { id: 'ferris', icon: '🎡', text: 'O tură romantică cu roata mare', hint: `Parcul din sat (${PRICE.ferris} lei)`, done: w => st(w, 'ferris') > 0, reward: { hearts: 10 } },
      { id: 'scooter', icon: '🛵', text: 'Cumpărați un scuter', hint: `Laptopul → Vehicule (${PRICE.scooter} lei)`, done: w => st(w, 'scooter') > 0, reward: { hearts: 10 } },
      { id: 'florarie', icon: '💐', text: 'Deschide florăria lui Bubu', hint: `Primăria → ${PRICE.florarie} lei`, done: w => st(w, 'florarie') > 0, reward: { hearts: 10 } },
      { id: 'workshop', icon: '🪚', text: 'Deschide tâmplăria lui Dudu', hint: `Primăria → ${PRICE.workshop} lei + ${PRICE.workshopWood} lemne`, done: w => st(w, 'workshop') > 0, reward: { hearts: 10 } },
      { id: 'craft3', icon: '🪑', text: 'Meșterește 3 lucruri în tâmplărie', hint: 'Scăunel, măsuță, căsuță pentru păsări…', done: w => st(w, 'crafted') >= 3, reward: { money: 30 } },
      { id: 'quest3', icon: '📜', text: 'Ajută 3 săteni', hint: 'Avizierul de lângă primărie sau vorbește cu sătenii pe stradă', done: w => st(w, 'questsDone') >= 3, reward: { money: 25, hearts: 5 } },
      { id: 'villagejob', icon: '💌', text: 'O tură la poștă sau la brutărie', hint: 'Poșta și Brutăria, sus în sat (dimineața)', done: w => st(w, 'postShifts') + st(w, 'bakeryShifts') >= 1, reward: { money: 15 } },
    ],
  },
  {
    id: 4, title: 'Capitolul 4 · Orașul', done: '🏡 V-ați mutat la oraș! Povestea continuă…',
    intro: 'Autobuzul din sat vă duce la oraș: blocuri înalte, mașini, cinema, restaurant. Munciți la cafenea sau la birou, ieșiți la întâlniri și cumpărați-vă un apartament!',
    goals: [
      { id: 'city1', icon: '🚌', text: 'Prima călătorie cu autobuzul la oraș', hint: `Stația de autobuz din sat (${PRICE.bus} lei de persoană)`, done: w => st(w, 'cityTrips') > 0, reward: { money: 10 } },
      { id: 'cafe3', icon: '☕', text: 'Lucrează 3 ture la cafenea', hint: 'Cafeneaua (7:00-21:00) — fă cafelele din comandă', done: w => st(w, 'cafeShifts') >= 3, reward: { money: 30 } },
      { id: 'diploma', icon: '🎓', text: 'Obține o diplomă la universitate', hint: 'Universitatea: cursul de birou, de prim ajutor, florist sau tâmplar', done: w => st(w, 'diplomas') >= 1, reward: { hearts: 10 } },
      { id: 'office1', icon: '💼', text: 'O zi de muncă la birou sau la spital', hint: 'Ai nevoie de diploma potrivită', done: w => st(w, 'officeShifts') + st(w, 'nurseShifts') >= 1, reward: { money: 20 } },
      { id: 'elegant', icon: '🎩', text: 'Cumpără haine elegante', hint: 'Buticul Elegant: rochie de seară, costum, joben', done: w => ['rochie', 'costum', 'joben', 'crown'].some(i => Object.values(w.chars).some(c => (c as any).owned?.includes(i))), reward: { hearts: 10 } },
      { id: 'cinema', icon: '🎬', text: 'Mergeți la film împreună', hint: `Cinema (${PRICE.cinema} lei) — mână în mână la scena cu inimioara`, done: w => st(w, 'cinema') > 0, reward: { hearts: 10 } },
      { id: 'resto', icon: '🕯️', text: 'Cină romantică la restaurant', hint: `Restaurant La Doi (${PRICE.resto} lei) — ghicește ce-și dorește partenerul`, done: w => st(w, 'restoDates') > 0, reward: { hearts: 15 } },
      { id: 'icecream', icon: '🍦', text: 'Înghețată în parc', hint: `Căruciorul cu înghețată din parc (${PRICE.ice} lei)`, done: w => st(w, 'icecream') > 0, reward: { hearts: 5 } },
      { id: 'apartment', icon: '🏙️', text: 'Cumpărați un apartament', hint: 'Banca: 5000 lei pe loc sau 1000 lei avans + credit', done: w => st(w, 'apartment') > 0, reward: { hearts: 25 } },
      { id: 'decor', icon: '🛍️', text: 'Mobilați apartamentul', hint: 'Mall-ul: acvariu, pian, consolă, espressor…', done: w => st(w, 'decorBought') >= 2, reward: { hearts: 10 } },
      { id: 'aptnight', icon: '🛏️', text: 'Prima noapte în apartamentul vostru', hint: 'Culcați-vă în patul cel mare din apartament', done: w => st(w, 'aptNights') > 0, reward: { money: 50, hearts: 20 } },
    ],
  },
];

export const GOALS: Goal[] = CHAPTERS.flatMap(c => c.goals);
export const chapterOf = (w: WorldState) => CHAPTERS[Math.min(CHAPTERS.length - 1, (w.stats.chapter ?? 0))];
export const currentGoal = (w: WorldState) => chapterOf(w).goals.find(g => !w.stats['goal-' + g.id]);
