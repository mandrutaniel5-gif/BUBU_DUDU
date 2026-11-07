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
  plank: { icon: '📏', label: 'Scânduri (de la gater)' },
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
  sawmillDay: 25, // cheresteaua lui Nea Vasile cumpara cel mult 25 lemne pe zi (pretul zilei e in minigames/sawmill.ts)
  marketFull: 10,                  // la piata: dupa 10 bucati din acelasi lucru intr-o zi, pretul scade la jumatate; dupa 20, nu mai cumpara
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
  /** cine se ocupa de obicei (doar o eticheta: o poate face oricare) */
  who?: 'bubu' | 'dudu';
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
      { id: 'fire', icon: '🔥', text: 'Aprinde focul în sobă', hint: 'Soba din sufragerie (ai lemne în coș 🪵)', done: w => st(w, 'fireLit') > 0, reward: { hearts: 3 }, who: 'dudu' },
      { id: 'toilet', icon: '🪠', text: 'Desfundă toaleta', hint: 'Baia — cineva a lăsat o surpriză 💩', done: w => !w.furn.clogged && st(w, 'unclogged') > 0, reward: { hearts: 3 }, who: 'dudu' },
      { id: 'fridgeclean', icon: '🧊', text: 'Curăță frigiderul', hint: 'Bucătăria — aruncă tot ce s-a stricat', done: w => !w.furn.fridgeDirty, reward: { hearts: 3 }, who: 'bubu' },
      { id: 'tub', icon: '🛁', text: 'Spală cada', hint: 'Baia — e plină de murdărie', done: w => !w.furn.tubDirty, reward: { hearts: 3 }, who: 'bubu' },
      { id: 'dishes', icon: '🍽️', text: 'Spală vasele', hint: 'Chiuveta din bucătărie', done: w => !w.furn.dishesDirty, reward: { hearts: 3 }, who: 'bubu' },
      { id: 'tv', icon: '📺', text: 'Repară televizorul', hint: 'Sufrageria — firele sunt încurcate', done: w => !w.furn.tvBroken, reward: { hearts: 3 }, who: 'dudu' },
      { id: 'cook', icon: '🥞', text: 'Gătește prima masă caldă', hint: 'Aragazul (ai câteva legume 🥕)', done: w => st(w, 'cooked') >= 1, reward: { hearts: 5 } },
    ],
  },
  {
    id: 1, title: 'Capitolul 1 · Curtea', done: '🚜 Dudu a primit un tractoraș! Pădurea vă așteaptă',
    intro: 'Curtea e sălbatică. Dudu e omul lemnelor: taie copaci, tunde iarba, repară taraba și face afaceri la Cheresteaua lui Nea Vasile, pe drum spre lac. Bubu are grija grădinii, a florilor și a tarabei.',
    goals: [
      { id: 'mow', icon: '✂️', text: 'Tunde iarba din curte', hint: 'Mașina de tuns iarba, în curte, lângă fântână', done: w => st(w, 'mowed') >= 1, reward: { money: 10 }, who: 'dudu' },
      { id: 'wood5', icon: '🪓', text: 'Taie 8 lemne de foc', hint: 'Copacii din curte — Dudu e cel mai bun tăietor (3 lemne o dată)', done: w => st(w, 'woodTotal') >= 8, reward: { money: 10 }, who: 'dudu' },
      { id: 'sell6', icon: '⚖️', text: 'Vinde 6 lemne la Cheresteaua lui Nea Vasile', hint: 'Pe drum, spre lac. Prețul se schimbă în fiecare zi, iar Dudu primește 1 leu în plus (5 lemne rămân pentru sobă)', done: w => st(w, 'woodSold') >= 6, reward: { money: 10 }, who: 'dudu' },
      { id: 'planks2', icon: '🪚', text: 'Taie 2 scânduri la gater', hint: 'Cheresteaua → Gaterul: ține linia albă pe pânză (2 lemne fac o scândură)', done: w => st(w, 'planksMade') >= 2, reward: { money: 10 }, who: 'dudu' },
      { id: 'flowers', icon: '🌸', text: 'Culege 6 flori', hint: 'Flori sălbatice în curte și lângă drum', done: w => st(w, 'flowerTotal') >= 6, reward: { money: 5 }, who: 'bubu' },
      { id: 'well', icon: '🪣', text: 'Scoate apă din fântână', hint: 'Fântâna de lângă grădină', done: w => st(w, 'waterDrawn') >= 1, reward: { hearts: 3 } },
      { id: 'plant3', icon: '🌱', text: 'Plantează 3 răzoare', hint: 'Atinge un răzor gol din grădină și alege semințele', done: w => st(w, 'planted') >= 3, reward: { money: 5 }, who: 'bubu' },
      { id: 'harvest3', icon: '🧺', text: 'Culege 3 recolte', hint: 'Udă plantele 💧 și așteaptă să crească', done: w => st(w, 'harvested') >= 3, reward: { money: 15, hearts: 5 } },
      { id: 'stand', icon: '🔨', text: 'Repară taraba și deschide-o', hint: 'Taraba de lângă drum e stricată — ai nevoie de 6 lemne 🪵', done: w => st(w, 'standRepaired') > 0 && st(w, 'standOpened') > 0, reward: { hearts: 5 }, who: 'dudu' },
      { id: 'serve3', icon: '🧺', text: 'Servește 3 clienți la tarabă', hint: 'Taraba de lângă drum (ieși pe portiță)', done: w => st(w, 'served') >= 3, reward: { money: 20 }, who: 'bubu' },
      { id: 'money100', icon: '💰', text: 'Strânge 100 de lei', hint: 'Taraba lui Bubu și cheresteaua lui Dudu', done: w => (w.money ?? 0) >= 100, reward: { hearts: 10 } },
    ],
  },
  {
    id: 2, title: 'Capitolul 2 · Pădurea', done: '🌉 Pădurea e a voastră! Dar Podul Mare spre sat e rupt… Hai să-l reparăm',
    intro: 'Dudu merge cu tractorașul la pădure, taie lemne și livrează comenzile cheresteliei. Bubu culege ciuperci, prinde pește și se împrietenește cu animalele. Lemnele și scândurile vor repara Podul Mare.',
    goals: [
      { id: 'tractor', icon: '🚜', text: 'Prima tură la pădure cu tractorașul', hint: 'Tractorașul stă la poarta din spatele curții (spre pădure)', done: w => st(w, 'forestTrips') > 0, reward: { money: 10 }, who: 'dudu' },
      { id: 'logs15', icon: '🪓', text: 'Taie 15 lemne în pădure', hint: 'Brazii și copacii din pădure', done: w => st(w, 'forestWood') >= 15, reward: { money: 15 }, who: 'dudu' },
      { id: 'mush', icon: '🍄', text: 'Culege 6 ciuperci', hint: 'Caută-le pe sub copaci', done: w => st(w, 'mushroomTotal') >= 6, reward: { hearts: 5 }, who: 'bubu' },
      { id: 'fish3', icon: '🎣', text: 'Prinde 3 pești la lac', hint: 'Podețul de la lacul din pădure', done: w => (st(w, 'fishCaught')) >= 3, reward: { money: 15 }, who: 'bubu' },
      { id: 'friend', icon: '🦌', text: 'Împrietenește-te cu un animal din pădure', hint: 'Apropie-te încet și mângâie-l de 3 ori', done: w => st(w, 'petFriends') >= 1, reward: { hearts: 10 }, who: 'bubu' },
      { id: 'saworders', icon: '📜', text: 'Livrează 2 comenzi la cherestea', hint: 'Cheresteaua lui Nea Vasile are în fiecare zi două comenzi: lemne de foc sau scânduri', done: w => st(w, 'sawOrders') >= 2, reward: { money: 20 }, who: 'dudu' },
    ],
  },
  {
    id: 3, title: 'Capitolul 3 · Podul', done: '🌉 Podul Mare e reparat! Satul de dincolo vă așteaptă',
    intro: 'Podul Mare, singurul drum spre sat, e rupt. Meșterii din sat îl repară, dar au nevoie de voi: lemne și scânduri de la Dudu, pietre și mâncare caldă de la Bubu, și bani pentru meșteri. Duceți totul la pod!',
    goals: [
      { id: 'brwood', icon: '🪵', text: 'Duceți 20 de lemne la Podul Mare', hint: 'Podul Mare, pe drum spre lac → „Ajutați la pod”', done: w => st(w, 'bridge-wood') >= 20, reward: { money: 10 }, who: 'dudu' },
      { id: 'brplank', icon: '📏', text: 'Duceți 6 scânduri de la gater', hint: 'Cheresteaua → Gaterul (2 lemne fac o scândură), apoi la pod', done: w => st(w, 'bridge-plank') >= 6, reward: { money: 10 }, who: 'dudu' },
      { id: 'brstone', icon: '🪨', text: 'Duceți 12 pietre la Podul Mare', hint: 'Pietrele din pădure și din curte', done: w => st(w, 'bridge-stone') >= 12, reward: { money: 10 }, who: 'bubu' },
      { id: 'brmeal', icon: '🍲', text: 'Gătește 3 porții pentru meșteri', hint: 'Gătește la aragaz, apoi duce mâncarea la pod', done: w => st(w, 'bridge-meal') >= 3, reward: { hearts: 10 }, who: 'bubu' },
      { id: 'brmoney', icon: '💰', text: 'Plătiți meșterii: 150 de lei', hint: 'Banii de la tarabă și de la cherestea', done: w => st(w, 'bridge-money') >= 150, reward: { hearts: 5 } },
      { id: 'bike', icon: '🚲', text: 'Cumpărați o bicicletă', hint: `Laptopul din casă → Vehicule (${PRICE.bike} lei)`, done: w => st(w, 'bike') > 0, reward: { hearts: 15 } },
      { id: 'brfix', icon: '🌉', text: 'Podul reparat!', hint: 'Când ați adus tot, meșterii repară podul (la pod)', done: w => st(w, 'bridgeFixed') > 0, reward: { money: 30, hearts: 20 } },
    ],
  },
  {
    id: 4, title: 'Capitolul 4 · Satul renaște', done: '🌾 Satul a prins viață! Câmpurile de lângă casă vă așteaptă: e timpul fermei voastre',
    intro: 'Satul e aproape părăsit: case goale, brutăria și școala închise, tinerii plecați la oraș. Îl readuceți la viață prin proiectele de la Primărie. După fiecare proiect se mută săteni noi. Bubu își deschide florăria, Dudu tâmplăria!',
    goals: [
      { id: 'village1', icon: '🏘️', text: 'Prima vizită în sat', hint: 'Pe drum spre dreapta, peste Podul Mare (pe jos sau cu bicicleta)', done: w => st(w, 'villageTrips') > 0, reward: { money: 10 } },
      { id: 'clothes', icon: '🧵', text: 'Cumpără haine de la Croitorie', hint: 'Ie, vestă, salopetă, rochiță cu buline…', done: w => st(w, 'clothesBought') > 0, reward: { hearts: 5 } },
      { id: 'school', icon: '🏫', text: 'Mergi la o lecție la școală', hint: 'Școala satului (după ce o redeschideți la Primărie)', done: w => st(w, 'school') > 0, reward: { money: 10 } },
      { id: 'ferris', icon: '🎡', text: 'O tură romantică cu roata mare', hint: `Parcul din sat (${PRICE.ferris} lei)`, done: w => st(w, 'ferris') > 0, reward: { hearts: 10 } },
      { id: 'proj3', icon: '📋', text: 'Terminați 3 proiecte ale satului', hint: 'Primăria → Proiectele satului (brutăria, școala, iluminatul, parcul, piața, drumul pietruit)', done: w => st(w, 'projectsDone') >= 3, reward: { money: 40, hearts: 15 } },
      { id: 'scooter', icon: '🛵', text: 'Cumpărați un scuter', hint: `Laptopul → Vehicule (${PRICE.scooter} lei)`, done: w => st(w, 'scooter') > 0, reward: { hearts: 10 } },
      { id: 'florarie', icon: '💐', text: 'Deschide florăria lui Bubu', hint: `Primăria → ${PRICE.florarie} lei`, done: w => st(w, 'florarie') > 0, reward: { hearts: 10 } },
      { id: 'workshop', icon: '🪚', text: 'Deschide tâmplăria lui Dudu', hint: `Primăria → ${PRICE.workshop} lei + ${PRICE.workshopWood} lemne`, done: w => st(w, 'workshop') > 0, reward: { hearts: 10 } },
      { id: 'craft3', icon: '🪑', text: 'Meșterește 3 lucruri în tâmplărie', hint: 'Scăunel, măsuță, căsuță pentru păsări…', done: w => st(w, 'crafted') >= 3, reward: { money: 30 } },
      { id: 'quest3', icon: '📜', text: 'Ajută 3 săteni', hint: 'Avizierul de lângă primărie sau vorbește cu sătenii pe stradă', done: w => st(w, 'questsDone') >= 3, reward: { money: 25, hearts: 5 } },
      { id: 'villagejob', icon: '💌', text: 'O tură la poștă sau la brutărie', hint: 'Poșta și Brutăria, sus în sat (dimineața)', done: w => st(w, 'postShifts') + st(w, 'bakeryShifts') >= 1, reward: { money: 15 } },
    ],
  },
  {
    id: 5, title: 'Capitolul 5 · Ferma', done: '🚌 Ferma merge! Drumul spre oraș s-a deschis: acolo se vând produsele voastre',
    intro: 'Câmpurile din jurul casei sunt de vânzare. Dudu cumpără utilajele: plugul, semănătoarea, cisterna și combina, care merg singure pe rânduri. Bubu are grija animalelor: găinile, vaca, oile și stupii. Și primii angajați vă ajută!',
    goals: [
      { id: 'parcel1', icon: '🟫', text: 'Cumpărați prima parcelă', hint: 'Indicatorul „Câmpurile de vânzare”, la sud de drum, lângă casă', done: w => st(w, 'parcels') >= 1, reward: { hearts: 10 } },
      { id: 'plow', icon: '🚜', text: 'Arați parcela cu plugul', hint: 'Laptopul → Utilaje (plugul), apoi atingeți parcela', done: w => st(w, 'fieldPlowed') >= 1, reward: { money: 10 }, who: 'dudu' },
      { id: 'sow', icon: '🌱', text: 'Semănați cu semănătoarea', hint: 'Grâu, porumb sau floarea-soarelui', done: w => st(w, 'fieldSown') >= 1, reward: { money: 10 }, who: 'dudu' },
      { id: 'harvestF', icon: '🌾', text: 'Prima recoltă cu combina', hint: 'Udați cu cisterna ca să crească mai repede, apoi recoltați', done: w => st(w, 'fieldHarvested') >= 1, reward: { money: 40, hearts: 10 }, who: 'dudu' },
      { id: 'hens', icon: '🐔', text: 'Luați găini în coteț', hint: 'Ieși din curte spre dreapta: indicatorul „🐔 Ferma voastră”, lângă gard → Animale', done: w => st(w, 'hens') >= 1, reward: { hearts: 5 }, who: 'bubu' },
      { id: 'eggs', icon: '🥚', text: 'Strânge 6 ouă', hint: 'Cotețul: o dată pe zi', done: w => st(w, 'eggsCollected') >= 6, reward: { money: 10 }, who: 'bubu' },
      { id: 'cow', icon: '🐄', text: 'Luați o văcuță', hint: 'Poarta fermei → Animale', done: w => st(w, 'cows') >= 1, reward: { hearts: 5 } },
      { id: 'cheese', icon: '🧀', text: 'Fă brânză din lapte', hint: 'Mulge vaca, apoi „Fă brânză” la grajd', done: w => st(w, 'cheeseMade') >= 1, reward: { money: 15 }, who: 'bubu' },
      { id: 'bees', icon: '🐝', text: 'Puneți un stup și strângeți miere', hint: 'Poarta fermei → Animale → Stup', done: w => st(w, 'honeyCollected') >= 1, reward: { hearts: 10 }, who: 'bubu' },
      { id: 'hire1', icon: '🧑‍🌾', text: 'Angajați primul om', hint: 'Primăria → Oameni de muncă (salariu pe zi)', done: w => st(w, 'hired') >= 1, reward: { hearts: 10 } },
    ],
  },
  {
    id: 6, title: 'Capitolul 6 · Drumul spre oraș', done: '🏪 Orașul vă știe! E timpul magazinului vostru „Bubu & Dudu”',
    intro: 'Drumul spre oraș s-a deschis: blocuri, mașini, cinema, restaurant. Afacerile de la țară rămân (angajații lucrează și când sunteți plecați). Ieșiți la întâlniri, învățați la universitate, cumpărați-vă un apartament!',
    goals: [
      { id: 'city1', icon: '🚌', text: 'Prima călătorie cu autobuzul la oraș', hint: `Stația de autobuz din sat (${PRICE.bus} lei de persoană)`, done: w => st(w, 'cityTrips') > 0, reward: { money: 10 } },
      { id: 'citysell', icon: '🧺', text: 'Vindeți 15 produse de la fermă la oraș', hint: 'Supermarketul cumpără ouă, lapte, brânză, miere, lână și grâne', done: w => st(w, 'citySold') >= 15, reward: { money: 30 } },
      { id: 'cafe3', icon: '☕', text: 'Lucrează 3 ture la cafenea', hint: 'Cafeneaua (7:00-21:00) — fă cafelele din comandă', done: w => st(w, 'cafeShifts') >= 3, reward: { money: 30 } },
      { id: 'diploma', icon: '🎓', text: 'Obține o diplomă la universitate', hint: 'Universitatea: cursul de birou, de prim ajutor, florist sau tâmplar', done: w => st(w, 'diplomas') >= 1, reward: { hearts: 10 } },
      { id: 'office1', icon: '💼', text: 'O zi de muncă la birou sau la spital', hint: 'Ai nevoie de diploma potrivită', done: w => st(w, 'officeShifts') + st(w, 'nurseShifts') >= 1, reward: { money: 20 } },
      { id: 'elegant', icon: '🎩', text: 'Cumpără haine elegante', hint: 'Buticul Elegant: rochie de seară, costum, joben', done: w => ['rochie', 'costum', 'joben', 'crown'].some(i => Object.values(w.chars).some(c => (c as any).owned?.includes(i))), reward: { hearts: 10 } },
      { id: 'cinema', icon: '🎬', text: 'Mergeți la film împreună', hint: `Cinema (${PRICE.cinema} lei) — mână în mână la scena cu inimioara`, done: w => st(w, 'cinema') > 0, reward: { hearts: 10 } },
      { id: 'resto', icon: '🕯️', text: 'Cină romantică la restaurant', hint: `Restaurant La Doi (${PRICE.resto} lei): alegeți ce mâncați; preferatul partenerului e marcat`, done: w => st(w, 'restoDates') > 0, reward: { hearts: 15 } },
      { id: 'icecream', icon: '🍦', text: 'Înghețată în parc', hint: `Căruciorul cu înghețată din parc (${PRICE.ice} lei)`, done: w => st(w, 'icecream') > 0, reward: { hearts: 5 } },
      { id: 'apartment', icon: '🏙️', text: 'Cumpărați un apartament', hint: 'Banca: 5000 lei pe loc sau 1000 lei avans + credit', done: w => st(w, 'apartment') > 0, reward: { hearts: 25 } },
      { id: 'decor', icon: '🛍️', text: 'Mobilați apartamentul', hint: 'Mall-ul: acvariu, pian, consolă, espressor…', done: w => st(w, 'decorBought') >= 2, reward: { hearts: 10 } },
      { id: 'aptnight', icon: '🛏️', text: 'Prima noapte în apartamentul vostru', hint: 'Culcați-vă în patul cel mare din apartament', done: w => st(w, 'aptNights') > 0, reward: { money: 50, hearts: 20 } },
    ],
  },
  {
    id: 7, title: 'Capitolul 7 · Afacerea din oraș', done: '💍 Afacerea voastră e cunoscută în tot orașul! Dudu are o surpriză…',
    intro: 'Terenul de vânzare din oraș devine magazinul vostru „Bubu & Dudu”, cu produsele de la fermă. Bubu aranjează vitrina, Dudu face contractele cu restaurantele și duce marfa cu camionul. La final, târgul orașului!',
    goals: [
      { id: 'lot', icon: '🏗️', text: 'Cumpărați terenul din oraș', hint: 'Indicatorul „Teren de vânzare”, la est de Parcul Central', done: w => st(w, 'shopLot') > 0, reward: { hearts: 10 } },
      { id: 'shopbuilt', icon: '🏪', text: 'Construiți magazinul „Bubu & Dudu”', hint: 'Pe teren: scânduri, pietre și bani', done: w => st(w, 'shopBuilt') > 0, reward: { hearts: 20 } },
      { id: 'vitrina', icon: '🪟', text: 'Aranjați vitrina', hint: 'În magazin → Vitrina', done: w => st(w, 'vitrina') >= 1, reward: { money: 20 }, who: 'bubu' },
      { id: 'stock20', icon: '📦', text: 'Puneți 20 de produse pe rafturi', hint: 'În magazin → Pune pe raft (ouă, lapte, brânză, miere, flori, grâne…)', done: w => st(w, 'shopStocked') >= 20, reward: { money: 20 } },
      { id: 'shopsold', icon: '🧾', text: 'Magazinul vinde 30 de produse', hint: 'Se vinde singur în fiecare zi (mai mult cu vânzător angajat)', done: w => st(w, 'shopSold') >= 30, reward: { money: 50 } },
      { id: 'truck', icon: '🚚', text: 'Cumpărați camionul', hint: 'Laptopul → Vehicule', done: w => st(w, 'truck') > 0, reward: { hearts: 10 }, who: 'dudu' },
      { id: 'contract2', icon: '📜', text: 'Livrați 2 contracte la restaurante', hint: 'În magazin → Contracte (cu camionul)', done: w => st(w, 'contracts') >= 2, reward: { money: 80 }, who: 'dudu' },
      { id: 'fair', icon: '🎪', text: 'Standul vostru la târgul orașului', hint: 'Când magazinul a vândut destul: Parcul Central → Târgul orașului', done: w => st(w, 'fairDone') > 0, reward: { money: 100, hearts: 25 } },
    ],
  },
  {
    id: 8, title: 'Capitolul 8 · Nunta', done: '💒 Bubu și Dudu s-au căsătorit! Casă de piatră! Povestea continuă: proaspăt căsătoriți',
    intro: 'Dudu cumpără inelul și o cere de soție pe Bubu. Apoi pregătiți nunta în sat, la biserică: rochia și costumul, tortul, lăutarii și invitațiile pentru sătenii prieteni. La final: cununia, hora și petrecerea!',
    goals: [
      { id: 'ring', icon: '💍', text: 'Dudu cumpără inelul de logodnă', hint: 'Mall-ul din oraș → Bijuterii', done: w => st(w, 'ring') > 0, reward: { hearts: 10 }, who: 'dudu' },
      { id: 'propose', icon: '💖', text: 'Cererea în căsătorie', hint: 'Dudu, cu inelul: la foișorul de la lac sau pe o bancă, cu Bubu lângă tine → „Cere-o de soție”', done: w => st(w, 'engaged') > 0, reward: { hearts: 50 }, who: 'dudu' },
      { id: 'dress', icon: '👰', text: 'Rochia de mireasă și voalul', hint: 'Buticul Elegant din oraș', done: w => (((w.chars.bubu as any).owned ?? []) as string[]).includes('mireasa'), reward: { hearts: 10 }, who: 'bubu' },
      { id: 'suit', icon: '🤵', text: 'Costumul de mire', hint: 'Buticul Elegant din oraș', done: w => (((w.chars.dudu as any).owned ?? []) as string[]).includes('mire'), reward: { hearts: 10 }, who: 'dudu' },
      { id: 'cake', icon: '🎂', text: 'Tortul de nuntă', hint: 'Brutăria din sat → Tort de nuntă', done: w => st(w, 'weddingCake') > 0, reward: { hearts: 5 }, who: 'bubu' },
      { id: 'music', icon: '🎻', text: 'Lăutarii pentru petrecere', hint: 'Primăria → Nunta → Lăutarii', done: w => st(w, 'weddingMusic') > 0, reward: { hearts: 5 }, who: 'dudu' },
      { id: 'invites', icon: '💌', text: 'Invitați 4 săteni prieteni', hint: 'Vorbiți cu sătenii (prieteni măcar pe treapta 2) → Invită la nuntă', done: w => st(w, 'invited') >= 4, reward: { hearts: 10 } },
      { id: 'wedding', icon: '💒', text: 'Nunta la biserica din sat', hint: 'Când e totul gata: biserica din sat → Nunta noastră', done: w => st(w, 'married') > 0, reward: { money: 500, hearts: 100 } },
    ],
  },
];

/** capitolele (numerotare din v1.7: 9 capitole) */
export const BRIDGE_CHAPTER = 3, VILLAGE_CHAPTER = 4, FARM_CHAPTER = 5, CITY_CHAPTER = 6, SHOP_CHAPTER = 7, WEDDING_CHAPTER = 8;
export const GOALS: Goal[] = CHAPTERS.flatMap(c => c.goals);
export const chapterOf = (w: WorldState) => CHAPTERS[Math.min(CHAPTERS.length - 1, (w.stats.chapter ?? 0))];
export const currentGoal = (w: WorldState) => chapterOf(w).goals.find(g => !w.stats['goal-' + g.id]);
