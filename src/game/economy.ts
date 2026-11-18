// Economia: bani, inventar, preturi, obiective pe capitole.
import type { WorldState } from './state';
import { CROPS, seedKey } from '../world/garden';
import { INGREDIENTS, RECIPES, dishKey } from './food';
import { $t } from '../i18n';

export const INV_INFO: Record<string, { icon: string; label: string }> = {
  water: { icon: '💧', label: $t('Apă (găleți)') },
  fish: { icon: '🐟', label: $t('Pește') }, mushroom: { icon: '🍄', label: $t('Ciuperci') }, berry: { icon: '🫐', label: $t('Mure') },
  fert: { icon: '✨', label: $t('Îngrășământ') },
  veg: { icon: '🥕', label: $t('Legume') },
  meals: { icon: '🍲', label: $t('Porții de mâncare') },
  hay: { icon: '🌾', label: $t('Fân') },
  plank: { icon: '📏', label: $t('Scânduri (de la gater)') },
  flour: { icon: '🥡', label: $t('Făină') },
  lemon: { icon: '🍋', label: $t('Lămâi') },
  carrot: { icon: '🥕', label: $t('Morcovi') }, potato: { icon: '🥔', label: $t('Cartofi') }, tomato: { icon: '🍅', label: $t('Roșii') },
  cabbage: { icon: '🥬', label: $t('Varză') }, strawberry: { icon: '🍓', label: $t('Căpșuni') },
  tulip: { icon: '🌷', label: $t('Lalele') }, rose: { icon: '🌹', label: $t('Trandafiri') }, sunflower: { icon: '🌻', label: $t('Floarea-soarelui') },
  ...Object.fromEntries(Object.values(CROPS).map(c => [seedKey(c.id), { icon: '🌰', label: $t('Semințe: ') + c.name }])),
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
const seedItem = (c: (typeof CROPS)[string]): ShopItem => ({ id: seedKey(c.id), label: $t('Semințe de {0} (x3)', c.name.toLowerCase()), icon: '🌰', price: c.seed * 5, give: { [seedKey(c.id)]: 3 } });
/** magazinul online (din casa, cu laptopul): de baza */
export const SHOP_ONLINE: ShopItem[] = [
  ...Object.values(CROPS).filter(c => c.where === 'online').map(seedItem),
  { id: 'meals', label: $t('Mâncare gata (x2 porții)'), icon: '🍱', price: 30, give: { meals: 2 } },
  { id: 'wood', label: $t('Lemne de foc (x4)'), icon: '🪵', price: 16, give: { wood: 4 } },
  { id: 'flour', label: $t('Sac de făină (x3)'), icon: '🥡', price: 14, give: { flour: 3 } },
  { id: 'lemon', label: $t('Lămâi (x3)'), icon: '🍋', price: 15, give: { lemon: 3 } },
  { id: 'egg', label: $t('Ouă de țară (x6)'), icon: '🥚', price: 15, give: { egg: 6 } },
  { id: 'milk', label: $t('Lapte (x2)'), icon: '🥛', price: 10, give: { milk: 2 } },
  { id: 'cheese', label: $t('Brânză de vaci (x2)'), icon: '🧀', price: 18, give: { cheese: 2 } },
  { id: 'cornmeal', label: $t('Mălai (x3)'), icon: '🌽', price: 10, give: { cornmeal: 3 } },
  { id: 'rice', label: $t('Orez (x3)'), icon: '🍚', price: 12, give: { rice: 3 } },
  { id: 'meat', label: $t('Carne tocată (x2)'), icon: '🥩', price: 28, give: { meat: 2 } },
];
/** magazinul din sat: tot ce e online + seminte variate, ingrasamant, pamant */
export const SHOP_BUY: ShopItem[] = [
  ...Object.values(CROPS).map(seedItem),
  { id: 'fert', label: $t('Îngrășământ (x3)'), icon: '✨', price: 18, give: { fert: 3 } },
  { id: 'soil', label: $t('Sac de pământ (1 răzor nou)'), icon: '🟫', price: 30, give: { soil: 1 } },
  ...SHOP_ONLINE.filter(i => !i.id.startsWith('seed_')),
];
/** supermarketul din oras: mancare gata, dulciuri, plus tot ce e in sat */
export const SHOP_CITY: ShopItem[] = [
  { id: 'pizza', label: $t('Pizza familială (x3 porții)'), icon: '🍕', price: 45, give: { meals: 3 } },
  { id: 'bigcart', label: $t('Coș mare de cumpărături (x6 porții)'), icon: '🛒', price: 80, give: { meals: 6 } },
  { id: 'cake', label: $t('Tort de ciocolată (x2 porții)'), icon: '🍰', price: 30, give: { meals: 2 } },
  { id: 'coal', label: $t('Brichete pentru sobă (x8 lemne)'), icon: '📦', price: 30, give: { wood: 8 } },
  ...SHOP_BUY,
];
export const SHOP_SELL = [
  ...Object.values(CROPS).map(c => ({ id: c.id, label: c.name, icon: (INV_INFO[c.id]?.icon ?? '🌱'), price: c.sell })),
  { id: 'fish', label: $t('Pește'), icon: '🐟', price: 5 },
  { id: 'mushroom', label: $t('Ciuperci'), icon: '🍄', price: 3 },
  { id: 'berry', label: $t('Mure'), icon: '🫐', price: 2 },
  { id: 'wood', label: $t('Lemne'), icon: '🪵', price: 1 },
  { id: 'hay', label: $t('Fân'), icon: '🌾', price: 1 },
  { id: 'stone', label: $t('Piatră'), icon: '🪨', price: 1 },
  { id: 'flower', label: $t('Flori sălbatice'), icon: '🌸', price: 2 },
];

export interface Goal {
  id: string; text: string; icon: string;
  done: (w: WorldState) => boolean;
  reward: { money?: number };
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
    id: 0, title: $t('Capitolul 0 · Căsuța noastră'), done: $t('🎉 Casa e curată și caldă! Curtea s-a deblocat 🌳'),
    intro: $t('V-ați mutat într-o căsuță veche de la țară. Ușile rămân închise până puneți casa în ordine!'),
    goals: [
      { id: 'fire', icon: '🔥', text: $t('Aprinde focul în sobă'), hint: $t('Soba din sufragerie (ai lemne în coș 🪵)'), done: w => st(w, 'fireLit') > 0, reward: {  }, who: 'dudu' },
      { id: 'toilet', icon: '🪠', text: $t('Desfundă toaleta'), hint: $t('Baia — cineva a lăsat o surpriză 💩'), done: w => !w.furn.clogged && st(w, 'unclogged') > 0, reward: {  }, who: 'dudu' },
      { id: 'fridgeclean', icon: '🧊', text: $t('Curăță frigiderul'), hint: $t('Bucătăria — aruncă tot ce s-a stricat'), done: w => !w.furn.fridgeDirty, reward: {  }, who: 'bubu' },
      { id: 'tub', icon: '🛁', text: $t('Spală cada'), hint: $t('Baia — e plină de murdărie'), done: w => !w.furn.tubDirty, reward: {  }, who: 'bubu' },
      { id: 'dishes', icon: '🍽️', text: $t('Spală vasele'), hint: $t('Chiuveta din bucătărie'), done: w => !w.furn.dishesDirty, reward: {  }, who: 'bubu' },
      { id: 'tv', icon: '📺', text: $t('Repară televizorul'), hint: $t('Sufrageria — firele sunt încurcate'), done: w => !w.furn.tvBroken, reward: {  }, who: 'dudu' },
      { id: 'cook', icon: '🥞', text: $t('Gătește prima masă caldă'), hint: $t('Aragazul (ai câteva legume 🥕)'), done: w => st(w, 'cooked') >= 1, reward: {  } },
    ],
  },
  {
    id: 1, title: $t('Capitolul 1 · Curtea'), done: $t('🚜 Dudu a primit un tractoraș! Pădurea vă așteaptă'),
    intro: $t('Curtea e sălbatică. Dudu e omul lemnelor: taie copaci, tunde iarba, repară taraba și face afaceri la Cheresteaua lui Nea Vasile, pe drum spre lac. Bubu are grija grădinii, a florilor și a tarabei.'),
    goals: [
      { id: 'mow', icon: '✂️', text: $t('Tunde iarba din curte'), hint: $t('Mașina de tuns iarba, în curte, lângă fântână'), done: w => st(w, 'mowed') >= 1, reward: { money: 10 }, who: 'dudu' },
      { id: 'wood5', icon: '🪓', text: $t('Taie 8 lemne de foc'), hint: $t('Copacii din curte — Dudu e cel mai bun tăietor (3 lemne o dată)'), done: w => st(w, 'woodTotal') >= 8, reward: { money: 10 }, who: 'dudu' },
      { id: 'sell6', icon: '⚖️', text: $t('Vinde 6 lemne la Cheresteaua lui Nea Vasile'), hint: $t('Pe drum, spre lac. Prețul se schimbă în fiecare zi, iar Dudu primește 1 leu în plus (5 lemne rămân pentru sobă)'), done: w => st(w, 'woodSold') >= 6, reward: { money: 10 }, who: 'dudu' },
      { id: 'planks2', icon: '🪚', text: $t('Taie 2 scânduri la gater'), hint: $t('Cheresteaua → Gaterul: ține linia albă pe pânză (2 lemne fac o scândură)'), done: w => st(w, 'planksMade') >= 2, reward: { money: 10 }, who: 'dudu' },
      { id: 'flowers', icon: '🌸', text: $t('Culege 6 flori'), hint: $t('Flori sălbatice în curte și lângă drum'), done: w => st(w, 'flowerTotal') >= 6, reward: { money: 5 }, who: 'bubu' },
      { id: 'well', icon: '🪣', text: $t('Scoate apă din fântână'), hint: $t('Fântâna de lângă grădină'), done: w => st(w, 'waterDrawn') >= 1, reward: {  } },
      { id: 'plant3', icon: '🌱', text: $t('Plantează 3 răzoare'), hint: $t('Atinge un răzor gol din grădină și alege semințele'), done: w => st(w, 'planted') >= 3, reward: { money: 5 }, who: 'bubu' },
      { id: 'harvest3', icon: '🧺', text: $t('Culege 3 recolte'), hint: $t('Udă plantele 💧 și așteaptă să crească'), done: w => st(w, 'harvested') >= 3, reward: { money: 15 } },
      { id: 'stand', icon: '🔨', text: $t('Repară taraba și deschide-o'), hint: $t('Taraba de lângă drum e stricată — ai nevoie de 6 lemne 🪵'), done: w => st(w, 'standRepaired') > 0 && st(w, 'standOpened') > 0, reward: {  }, who: 'dudu' },
      { id: 'serve3', icon: '🧺', text: $t('Servește 3 clienți la tarabă'), hint: $t('Taraba de lângă drum (ieși pe portiță)'), done: w => st(w, 'served') >= 3, reward: { money: 20 }, who: 'bubu' },
      { id: 'money100', icon: '💰', text: $t('Strânge 100 de lei'), hint: $t('Taraba lui Bubu și cheresteaua lui Dudu'), done: w => (w.money ?? 0) >= 100, reward: {  } },
    ],
  },
  {
    id: 2, title: $t('Capitolul 2 · Pădurea'), done: $t('🌉 Pădurea e a voastră! Dar Podul Mare spre sat e rupt… Hai să-l reparăm'),
    intro: $t('Dudu merge cu tractorașul la pădure, taie lemne și livrează comenzile cheresteliei. Bubu culege ciuperci, prinde pește și se împrietenește cu animalele. Lemnele și scândurile vor repara Podul Mare.'),
    goals: [
      { id: 'tractor', icon: '🚜', text: $t('Prima tură la pădure cu tractorașul'), hint: $t('Tractorașul stă la poarta din spatele curții (spre pădure)'), done: w => st(w, 'forestTrips') > 0, reward: { money: 10 }, who: 'dudu' },
      { id: 'logs15', icon: '🪓', text: $t('Taie 15 lemne în pădure'), hint: $t('Brazii și copacii din pădure'), done: w => st(w, 'forestWood') >= 15, reward: { money: 15 }, who: 'dudu' },
      { id: 'mush', icon: '🍄', text: $t('Culege 6 ciuperci'), hint: $t('Caută-le pe sub copaci'), done: w => st(w, 'mushroomTotal') >= 6, reward: {  }, who: 'bubu' },
      { id: 'fish3', icon: '🎣', text: $t('Prinde 3 pești la lac'), hint: $t('Podețul de la lacul din pădure'), done: w => (st(w, 'fishCaught')) >= 3, reward: { money: 15 }, who: 'bubu' },
      { id: 'friend', icon: '🦌', text: $t('Împrietenește-te cu un animal din pădure'), hint: $t('Apropie-te încet și mângâie-l de 3 ori'), done: w => st(w, 'petFriends') >= 1, reward: {  }, who: 'bubu' },
      { id: 'saworders', icon: '📜', text: $t('Livrează 2 comenzi la cherestea'), hint: $t('Cheresteaua lui Nea Vasile are în fiecare zi două comenzi: lemne de foc sau scânduri'), done: w => st(w, 'sawOrders') >= 2, reward: { money: 20 }, who: 'dudu' },
    ],
  },
  {
    id: 3, title: $t('Capitolul 3 · Podul'), done: $t('🌉 Podul Mare e reparat! Satul de dincolo vă așteaptă'),
    intro: $t('Podul Mare, singurul drum spre sat, e rupt. Meșterii din sat îl repară, dar au nevoie de voi: lemne și scânduri de la Dudu, pietre și mâncare caldă de la Bubu, și bani pentru meșteri. Duceți totul la pod!'),
    goals: [
      { id: 'brwood', icon: '🪵', text: $t('Duceți 20 de lemne la Podul Mare'), hint: $t('Podul Mare, pe drum spre lac → „Ajutați la pod”'), done: w => st(w, 'bridge-wood') >= 20, reward: { money: 10 }, who: 'dudu' },
      { id: 'brplank', icon: '📏', text: $t('Duceți 6 scânduri de la gater'), hint: $t('Cheresteaua → Gaterul (2 lemne fac o scândură), apoi la pod'), done: w => st(w, 'bridge-plank') >= 6, reward: { money: 10 }, who: 'dudu' },
      { id: 'brstone', icon: '🪨', text: $t('Duceți 12 pietre la Podul Mare'), hint: $t('Pietrele din pădure și din curte'), done: w => st(w, 'bridge-stone') >= 12, reward: { money: 10 }, who: 'bubu' },
      { id: 'brmeal', icon: '🍲', text: $t('Gătește 3 porții pentru meșteri'), hint: $t('Gătește la aragaz, apoi duce mâncarea la pod'), done: w => st(w, 'bridge-meal') >= 3, reward: {  }, who: 'bubu' },
      { id: 'brmoney', icon: '💰', text: $t('Plătiți meșterii: 150 de lei'), hint: $t('Banii de la tarabă și de la cherestea'), done: w => st(w, 'bridge-money') >= 150, reward: {  } },
      { id: 'bike', icon: '🚲', text: $t('Cumpărați o bicicletă'), hint: $t('Laptopul din casă → Vehicule ({0} lei)', PRICE.bike), done: w => st(w, 'bike') > 0, reward: {  } },
      { id: 'brfix', icon: '🌉', text: $t('Podul reparat!'), hint: $t('Când ați adus tot, meșterii repară podul (la pod)'), done: w => st(w, 'bridgeFixed') > 0, reward: { money: 30 } },
    ],
  },
  {
    id: 4, title: $t('Capitolul 4 · Satul renaște'), done: $t('🌾 Satul a prins viață! Câmpurile de lângă casă vă așteaptă: e timpul fermei voastre'),
    intro: $t('Satul e aproape părăsit: case goale, brutăria și școala închise, tinerii plecați la oraș. Îl readuceți la viață prin proiectele de la Primărie. După fiecare proiect se mută săteni noi. Bubu își deschide florăria, Dudu tâmplăria!'),
    goals: [
      { id: 'village1', icon: '🏘️', text: $t('Prima vizită în sat'), hint: $t('Pe drum spre dreapta, peste Podul Mare (pe jos sau cu bicicleta)'), done: w => st(w, 'villageTrips') > 0, reward: { money: 10 } },
      { id: 'clothes', icon: '🧵', text: $t('Cumpără haine de la Croitorie'), hint: $t('Ie, vestă, salopetă, rochiță cu buline…'), done: w => st(w, 'clothesBought') > 0, reward: {  } },
      { id: 'school', icon: '🏫', text: $t('Mergi la o lecție la școală'), hint: $t('Școala satului (după ce o redeschideți la Primărie)'), done: w => st(w, 'school') > 0, reward: { money: 10 } },
      { id: 'ferris', icon: '🎡', text: $t('O tură romantică cu roata mare'), hint: $t('Parcul din sat ({0} lei)', PRICE.ferris), done: w => st(w, 'ferris') > 0, reward: {  } },
      { id: 'proj3', icon: '📋', text: $t('Terminați 3 proiecte ale satului'), hint: $t('Primăria → Proiectele satului (brutăria, școala, iluminatul, parcul, piața, drumul pietruit)'), done: w => st(w, 'projectsDone') >= 3, reward: { money: 40 } },
      { id: 'scooter', icon: '🛵', text: $t('Cumpărați un scuter'), hint: $t('Laptopul → Vehicule ({0} lei)', PRICE.scooter), done: w => st(w, 'scooter') > 0, reward: {  } },
      { id: 'florarie', icon: '💐', text: $t('Deschide florăria lui Bubu'), hint: $t('Primăria → {0} lei', PRICE.florarie), done: w => st(w, 'florarie') > 0, reward: {  } },
      { id: 'workshop', icon: '🪚', text: $t('Deschide tâmplăria lui Dudu'), hint: $t('Primăria → {0} lei + {1} lemne', PRICE.workshop, PRICE.workshopWood), done: w => st(w, 'workshop') > 0, reward: {  } },
      { id: 'craft3', icon: '🪑', text: $t('Meșterește 3 lucruri în tâmplărie'), hint: $t('Scăunel, măsuță, căsuță pentru păsări…'), done: w => st(w, 'crafted') >= 3, reward: { money: 30 } },
      { id: 'quest3', icon: '📜', text: $t('Ajută 3 săteni'), hint: $t('Avizierul de lângă primărie sau vorbește cu sătenii pe stradă'), done: w => st(w, 'questsDone') >= 3, reward: { money: 25 } },
      { id: 'villagejob', icon: '💌', text: $t('O tură la poștă sau la brutărie'), hint: $t('Poșta și Brutăria, sus în sat (dimineața)'), done: w => st(w, 'postShifts') + st(w, 'bakeryShifts') >= 1, reward: { money: 15 } },
    ],
  },
  {
    id: 5, title: $t('Capitolul 5 · Ferma'), done: $t('🚌 Ferma merge! Drumul spre oraș s-a deschis: acolo se vând produsele voastre'),
    intro: $t('Câmpurile din jurul casei sunt de vânzare. Dudu cumpără utilajele: plugul, semănătoarea, cisterna și combina, care merg singure pe rânduri. Bubu are grija animalelor: găinile, vaca, oile și stupii. Și primii angajați vă ajută!'),
    goals: [
      { id: 'parcel1', icon: '🟫', text: $t('Cumpărați prima parcelă'), hint: $t('Indicatorul „Câmpurile de vânzare”, la sud de drum, lângă casă'), done: w => st(w, 'parcels') >= 1, reward: {  } },
      { id: 'plow', icon: '🚜', text: $t('Arați parcela cu plugul'), hint: $t('Laptopul → Utilaje (plugul), apoi atingeți parcela'), done: w => st(w, 'fieldPlowed') >= 1, reward: { money: 10 }, who: 'dudu' },
      { id: 'sow', icon: '🌱', text: $t('Semănați cu semănătoarea'), hint: $t('Grâu, porumb sau floarea-soarelui'), done: w => st(w, 'fieldSown') >= 1, reward: { money: 10 }, who: 'dudu' },
      { id: 'harvestF', icon: '🌾', text: $t('Prima recoltă cu combina'), hint: $t('Udați cu cisterna ca să crească mai repede, apoi recoltați'), done: w => st(w, 'fieldHarvested') >= 1, reward: { money: 40 }, who: 'dudu' },
      { id: 'hens', icon: '🐔', text: $t('Luați găini în coteț'), hint: $t('Ieși din curte spre dreapta: indicatorul „🐔 Ferma voastră”, lângă gard → Animale'), done: w => st(w, 'hens') >= 1, reward: {  }, who: 'bubu' },
      { id: 'eggs', icon: '🥚', text: $t('Strânge 6 ouă'), hint: $t('Cotețul: o dată pe zi'), done: w => st(w, 'eggsCollected') >= 6, reward: { money: 10 }, who: 'bubu' },
      { id: 'cow', icon: '🐄', text: $t('Luați o văcuță'), hint: $t('Poarta fermei → Animale'), done: w => st(w, 'cows') >= 1, reward: {  } },
      { id: 'cheese', icon: '🧀', text: $t('Fă brânză din lapte'), hint: $t('Mulge vaca, apoi „Fă brânză” la grajd'), done: w => st(w, 'cheeseMade') >= 1, reward: { money: 15 }, who: 'bubu' },
      { id: 'bees', icon: '🐝', text: $t('Puneți un stup și strângeți miere'), hint: $t('Poarta fermei → Animale → Stup'), done: w => st(w, 'honeyCollected') >= 1, reward: {  }, who: 'bubu' },
      { id: 'hire1', icon: '🧑‍🌾', text: $t('Angajați primul om'), hint: $t('Primăria → Oameni de muncă (salariu pe zi)'), done: w => st(w, 'hired') >= 1, reward: {  } },
    ],
  },
  {
    id: 6, title: $t('Capitolul 6 · Drumul spre oraș'), done: $t('🏪 Orașul vă știe! E timpul magazinului vostru „Bubu & Dudu”'),
    intro: $t('Drumul spre oraș s-a deschis: blocuri, mașini, cinema, restaurant. Afacerile de la țară rămân (angajații lucrează și când sunteți plecați). Ieșiți la întâlniri, învățați la universitate, cumpărați-vă un apartament!'),
    goals: [
      { id: 'city1', icon: '🚌', text: $t('Prima călătorie cu autobuzul la oraș'), hint: $t('Stația de autobuz din sat ({0} lei de persoană)', PRICE.bus), done: w => st(w, 'cityTrips') > 0, reward: { money: 10 } },
      { id: 'citysell', icon: '🧺', text: $t('Vindeți 15 produse de la fermă la oraș'), hint: $t('Supermarketul cumpără ouă, lapte, brânză, miere, lână și grâne'), done: w => st(w, 'citySold') >= 15, reward: { money: 30 } },
      { id: 'cafe3', icon: '☕', text: $t('O tură la cafenea (barista)'), hint: $t('Cafeneaua (7:00-21:00) — fă cafelele din comandă'), done: w => st(w, 'cafeShifts') >= 1, reward: { money: 30 } }, // id-ul ramane (salvarile vechi); din 1.10.0 o singura tura
      { id: 'diploma', icon: '🎓', text: $t('Obține o diplomă la universitate'), hint: $t('Universitatea: cursul de birou, de prim ajutor, florist sau tâmplar'), done: w => st(w, 'diplomas') >= 1, reward: {  } },
      { id: 'office1', icon: '💼', text: $t('O zi de muncă la birou sau la spital'), hint: $t('Ai nevoie de diploma potrivită'), done: w => st(w, 'officeShifts') + st(w, 'nurseShifts') >= 1, reward: { money: 20 } },
      { id: 'elegant', icon: '🎩', text: $t('Cumpără haine elegante'), hint: $t('Buticul Elegant: rochie de seară, costum, joben'), done: w => ['rochie', 'costum', 'joben', 'crown'].some(i => Object.values(w.chars).some(c => (c as any).owned?.includes(i))), reward: {  } },
      { id: 'cinema', icon: '🎬', text: $t('Mergeți la film împreună'), hint: $t('Cinema ({0} lei) — mână în mână la scena cu inimioara', PRICE.cinema), done: w => st(w, 'cinema') > 0, reward: {  } },
      { id: 'resto', icon: '🕯️', text: $t('Cină romantică la restaurant'), hint: $t('Restaurant La Doi ({0} lei): alegeți ce mâncați; preferatul partenerului e marcat', PRICE.resto), done: w => st(w, 'restoDates') > 0, reward: {  } },
      { id: 'icecream', icon: '🍦', text: $t('Înghețată în parc'), hint: $t('Căruciorul cu înghețată din parc ({0} lei)', PRICE.ice), done: w => st(w, 'icecream') > 0, reward: {  } },
      { id: 'apartment', icon: '🏙️', text: $t('Cumpărați un apartament'), hint: $t('Banca: 5000 lei pe loc sau 1000 lei avans + credit'), done: w => st(w, 'apartment') > 0, reward: {  } },
      { id: 'decor', icon: '🛍️', text: $t('Mobilați apartamentul'), hint: $t('Mall-ul: acvariu, pian, consolă, espressor…'), done: w => st(w, 'decorBought') >= 2, reward: {  } },
      { id: 'aptnight', icon: '🛏️', text: $t('Prima noapte în apartamentul vostru'), hint: $t('Culcați-vă în patul cel mare din apartament'), done: w => st(w, 'aptNights') > 0, reward: { money: 50 } },
    ],
  },
  {
    id: 7, title: $t('Capitolul 7 · Afacerea din oraș'), done: $t('💍 Afacerea voastră e cunoscută în tot orașul! Dudu are o surpriză…'),
    intro: $t('Terenul de vânzare din oraș devine magazinul vostru „Bubu & Dudu”, cu produsele de la fermă. Bubu aranjează vitrina, Dudu face contractele cu restaurantele și duce marfa cu camionul.'),
    goals: [
      { id: 'lot', icon: '🏗️', text: $t('Cumpărați terenul din oraș'), hint: $t('Indicatorul „Teren de vânzare”, la est de Parcul Central'), done: w => st(w, 'shopLot') > 0, reward: {  } },
      { id: 'shopbuilt', icon: '🏪', text: $t('Construiți magazinul „Bubu & Dudu”'), hint: $t('Pe teren: scânduri, pietre și bani'), done: w => st(w, 'shopBuilt') > 0, reward: {  } },
      { id: 'vitrina', icon: '🪟', text: $t('Aranjați vitrina'), hint: $t('În magazin → Vitrina'), done: w => st(w, 'vitrina') >= 1, reward: { money: 20 }, who: 'bubu' },
      { id: 'stock20', icon: '📦', text: $t('Puneți 20 de produse pe rafturi'), hint: $t('În magazin → Pune pe raft (ouă, lapte, brânză, miere, flori, grâne…)'), done: w => st(w, 'shopStocked') >= 20, reward: { money: 20 } },
      { id: 'shopsold', icon: '🧾', text: $t('Magazinul vinde 30 de produse'), hint: $t('Se vinde singur în fiecare zi (mai mult cu vânzător angajat)'), done: w => st(w, 'shopSold') >= 30, reward: { money: 50 } },
      { id: 'truck', icon: '🚚', text: $t('Cumpărați camionul'), hint: $t('Laptopul → Vehicule'), done: w => st(w, 'truck') > 0, reward: {  }, who: 'dudu' },
      { id: 'contract2', icon: '📜', text: $t('Livrați 2 contracte la restaurante'), hint: $t('În magazin → Contracte (cu camionul)'), done: w => st(w, 'contracts') >= 2, reward: { money: 80 }, who: 'dudu' },
    ],
  },
  {
    id: 8, title: $t('Capitolul 8 · Nunta'), done: $t('💒 Bubu și Dudu s-au căsătorit! Casă de piatră! Povestea continuă: proaspăt căsătoriți'),
    intro: $t('Dudu cumpără inelul și o cere de soție pe Bubu. Apoi pregătiți nunta în sat, la biserică: rochia și costumul, tortul, lăutarii și invitațiile pentru sătenii prieteni. La final: cununia, hora și petrecerea!'),
    goals: [
      { id: 'ring', icon: '💍', text: $t('Dudu cumpără inelul de logodnă'), hint: $t('Mall-ul din oraș → Bijuterii'), done: w => st(w, 'ring') > 0, reward: {  }, who: 'dudu' },
      { id: 'propose', icon: '💖', text: $t('Cererea în căsătorie'), hint: $t('Dudu, cu inelul: la foișorul de la lac sau pe o bancă, cu Bubu lângă tine → „Cere-o de soție”'), done: w => st(w, 'engaged') > 0, reward: {  }, who: 'dudu' },
      { id: 'dress', icon: '👰', text: $t('Rochia de mireasă și voalul'), hint: $t('Buticul Elegant din oraș'), done: w => (((w.chars.bubu as any).owned ?? []) as string[]).includes('mireasa'), reward: {  }, who: 'bubu' },
      { id: 'suit', icon: '🤵', text: $t('Costumul de mire'), hint: $t('Buticul Elegant din oraș'), done: w => (((w.chars.dudu as any).owned ?? []) as string[]).includes('mire'), reward: {  }, who: 'dudu' },
      { id: 'cake', icon: '🎂', text: $t('Tortul de nuntă'), hint: $t('Brutăria din sat → Tort de nuntă'), done: w => st(w, 'weddingCake') > 0, reward: {  }, who: 'bubu' },
      { id: 'music', icon: '🎻', text: $t('Lăutarii pentru petrecere'), hint: $t('Primăria → Nunta → Lăutarii'), done: w => st(w, 'weddingMusic') > 0, reward: {  }, who: 'dudu' },
      { id: 'invites', icon: '💌', text: $t('Invitați 4 săteni prieteni'), hint: $t('Vorbiți cu sătenii (prieteni măcar pe treapta 2) → Invită la nuntă'), done: w => st(w, 'invited') >= 4, reward: {  } },
      { id: 'wedding', icon: '💒', text: $t('Nunta la biserica din sat'), hint: $t('Când e totul gata: biserica din sat → Nunta noastră'), done: w => st(w, 'married') > 0, reward: { money: 500 } },
    ],
  },
];

/** capitolele (numerotare din v1.7: 9 capitole) */
export const BRIDGE_CHAPTER = 3, VILLAGE_CHAPTER = 4, FARM_CHAPTER = 5, CITY_CHAPTER = 6, SHOP_CHAPTER = 7, WEDDING_CHAPTER = 8;
export const GOALS: Goal[] = CHAPTERS.flatMap(c => c.goals);
export const chapterOf = (w: WorldState) => CHAPTERS[Math.min(CHAPTERS.length - 1, (w.stats.chapter ?? 0))];
export const currentGoal = (w: WorldState) => chapterOf(w).goals.find(g => !w.stats['goal-' + g.id]);
