// Viata in sat si la oras: joburi cu cariera, cursuri (diplome), banca, sateni cu cereri, reputatie.
// Totul e tinut in w.stats (numere) si w.town (obiecte), sincronizat prin op-uri.
import type { WorldState } from './state';
import type { CharId } from '../char/draw';

// ------------------------------------------------------------------ joburi
export interface JobDef {
  id: string; name: [string, string]; place: 'village' | 'city'; building: string; mini: string;
  base: number; open: [number, number]; energy: number; requires?: string; icon: string; desc: string;
}
/** name: [masculin, feminin] */
export const JOBS: Record<string, JobDef> = {
  post: { id: 'post', name: ['Poștaș', 'Poștăriță'], place: 'village', building: 'v-post', mini: 'post', base: 26, open: [8, 17], energy: 12, icon: '💌', desc: 'Duci scrisorile prin sat cu bicicleta' },
  bakery: { id: 'bakery', name: ['Brutar', 'Brutăriță'], place: 'village', building: 'v-bakery', mini: 'bakery', base: 24, open: [6, 13], energy: 12, icon: '🍞', desc: 'Frămânți, modelezi și coci pâinea satului' },
  cafe: { id: 'cafe', name: ['Barista', 'Barista'], place: 'city', building: 'c-cafe', mini: 'cafe', base: 38, open: [7, 21], energy: 14, icon: '☕', desc: 'Faci cafelele comandate, cât mai repede' },
  office: { id: 'office', name: ['Funcționar', 'Funcționară'], place: 'city', building: 'c-office', mini: 'office', base: 70, open: [8, 18], energy: 18, requires: 'birou', icon: '💼', desc: 'Sortezi dosarele firmei (ai nevoie de diploma de birou)' },
  nurse: { id: 'nurse', name: ['Asistent medical', 'Asistentă medicală'], place: 'city', building: 'c-hospital', mini: 'nurse', base: 82, open: [7, 20], energy: 20, requires: 'prim-ajutor', icon: '🩹', desc: 'Îngrijești pacienții spitalului (ai nevoie de diploma de prim ajutor)' },
};
export const LEVEL_NAMES = [['Începător', 'Începătoare'], ['Priceput', 'Pricepută'], ['Expert', 'Expertă'], ['Șef de tură', 'Șefă de tură']];
export const LEVEL_MULT = [1, 1.25, 1.55, 1.9];
/** cate ture bune (peste 70%) iti trebuie ca sa urci la nivelul urmator */
export const LEVEL_NEED = [3, 4, 6];

const st = (w: WorldState, k: string) => w.stats[k] ?? 0;
export const jobKey = (job: string, who: CharId, what: string) => `job-${job}-${who}-${what}`;
export const jobLevel = (w: WorldState, job: string, who: CharId) => Math.min(3, st(w, jobKey(job, who, 'lvl')));
export const jobXp = (w: WorldState, job: string, who: CharId) => st(w, jobKey(job, who, 'xp'));
export const hasDiploma = (w: WorldState, course: string, who: CharId) => st(w, `dipl-${course}-${who}`) > 0;

/** de ce nu poti lucra acum (sau null daca poti) */
export function jobBlock(w: WorldState, job: JobDef, who: CharId, energy: number, female: boolean): string | null {
  const h = w.minutes / 60;
  if (h < job.open[0] || h >= job.open[1]) return `${job.icon} Programul e între ${job.open[0]}:00 și ${job.open[1]}:00`;
  if (job.requires && !hasDiploma(w, job.requires, who)) return `🎓 Ai nevoie de ${COURSES[job.requires].name} (Universitatea din oraș)`;
  if (st(w, jobKey(job.id, who, 'day')) === w.day) return `${job.icon} Ai lucrat deja azi aici. Revino mâine! (o tură pe zi)`;
  if (energy < job.energy + 6) return `😴 Ești prea ${female ? 'obosită' : 'obosit'} pentru o tură (îți trebuie ${job.energy + 6}% energie)`;
  return null;
}
/** plata pentru o tura: baza x nivel x cat de bine ai lucrat (0..1.2) */
export const jobPay = (w: WorldState, job: JobDef, who: CharId, perf: number) => Math.round(job.base * LEVEL_MULT[jobLevel(w, job.id, who)] * Math.max(0.3, Math.min(1.2, perf)));

// ------------------------------------------------------------------ cursuri (universitatea din oras)
export interface CourseDef { id: string; name: string; price: number; icon: string; desc: string; questions: { q: string; a: string[]; ok: number }[] }
export const COURSES: Record<string, CourseDef> = {
  birou: {
    id: 'birou', name: 'Cursul de birou', price: 120, icon: '💻', desc: 'Calculator, documente, e-mail. Deschide jobul de la birou.',
    questions: [
      { q: 'Unde salvezi un document ca să nu-l pierzi?', a: ['Pe hârtie de ziar', 'Într-un dosar pe calculator 💾', 'În frigider'], ok: 1 },
      { q: 'Ce faci cu o factură plătită?', a: ['O arunci', 'O pui la dosarul „Facturi” 📁', 'O mănânci'], ok: 1 },
      { q: 'Cum scrii un e-mail politicos?', a: ['„Bună ziua, …, Mulțumesc!” ✉️', 'Doar cu majuscule', 'Cu 20 de emoji'], ok: 0 },
      { q: 'Ce înseamnă un „termen limită”?', a: ['Ziua până la care trebuie gata ⏰', 'Un fel de prăjitură', 'Pauza de masă'], ok: 0 },
      { q: 'Colegul îți cere ajutor. Ce faci?', a: ['Îl ignori', 'Îl ajuți, apoi îți termini treaba 🤝', 'Pleci acasă'], ok: 1 },
      { q: 'Ce e un tabel?', a: ['Rânduri și coloane cu date 📊', 'O masă de bucătărie', 'Un cântec'], ok: 0 },
      { q: 'Ce faci înainte să închizi calculatorul?', a: ['Salvezi tot 💾', 'Tragi de cablu', 'Nimic'], ok: 0 },
    ],
  },
  'prim-ajutor': {
    id: 'prim-ajutor', name: 'Cursul de prim ajutor', price: 150, icon: '🩹', desc: 'Îngrijirea bolnavilor. Deschide jobul de la spital.',
    questions: [
      { q: 'Cineva are febră mare. Ce îi dai?', a: ['Înghețată', 'Medicament pentru febră și apă 💊', 'Cafea'], ok: 1 },
      { q: 'Ce pui pe o zgârietură curată?', a: ['Un plasture 🩹', 'Sare', 'Lipici'], ok: 0 },
      { q: 'Ce faci întâi la o rană care sângerează?', a: ['Apeși cu un pansament curat', 'Fugi', 'O speli cu suc'], ok: 0 },
      { q: 'Cum îl ajuți pe cel care tușește?', a: ['Ceai cald și sirop 🍵', 'Îl pui să alerge', 'Îl duci în ploaie'], ok: 0 },
      { q: 'Cât ține termometrul sub braț?', a: ['O secundă', 'Câteva minute 🌡️', 'O zi'], ok: 1 },
      { q: 'Pacientul e trist și speriat. Ce faci?', a: ['Îl liniștești cu blândețe 💕', 'Țipi la el', 'Râzi de el'], ok: 0 },
      { q: 'Ce te speli pe mâini înainte să îngrijești pe cineva?', a: ['Nu e nevoie', 'Întotdeauna, cu săpun 🧼', 'Doar duminica'], ok: 1 },
    ],
  },
  florist: {
    id: 'florist', name: 'Cursul de florist', price: 140, icon: '💐', desc: 'Buchete mai frumoase: la Florăria lui Bubu clienții plătesc mai mult.',
    questions: [
      { q: 'Ce flori se dăruiesc din dragoste?', a: ['Trandafiri roșii 🌹', 'Urzici', 'Cactuși'], ok: 0 },
      { q: 'Cum ții florile proaspete mai mult?', a: ['Apă curată și tăieturi oblice ✂️', 'Fără apă', 'La soare puternic'], ok: 0 },
      { q: 'Ce se pune într-un buchet de primăvară?', a: ['Lalele 🌷', 'Frunze uscate', 'Pietre'], ok: 0 },
      { q: 'Ce flori iubesc soarele?', a: ['Floarea-soarelui 🌻', 'Ciupercile', 'Mușchiul'], ok: 0 },
      { q: 'Cât de des schimbi apa din vază?', a: ['O dată pe an', 'La 1–2 zile 💧', 'Niciodată'], ok: 1 },
    ],
  },
  tamplar: {
    id: 'tamplar', name: 'Cursul de tâmplar', price: 140, icon: '🪚', desc: 'Mobilă mai fină: la Tâmplăria lui Dudu câștigi cu 30% mai mult.',
    questions: [
      { q: 'Cu ce tai o scândură drept?', a: ['Cu fierăstrăul 🪚', 'Cu lingura', 'Cu foarfeca de unghii'], ok: 0 },
      { q: 'Ce faci înainte să tai?', a: ['Măsori de două ori 📏', 'Închizi ochii', 'Nimic'], ok: 0 },
      { q: 'Cum faci lemnul neted?', a: ['Cu șmirghel', 'Cu apă', 'Cu lipici'], ok: 0 },
      { q: 'Ce porți ca să-ți protejezi ochii?', a: ['Ochelari de protecție 🥽', 'Ochelari de soare', 'Nimic'], ok: 0 },
      { q: 'Din ce lemn faci o masă rezistentă?', a: ['Stejar 🌳', 'Carton', 'Hârtie'], ok: 0 },
    ],
  },
};

// ------------------------------------------------------------------ satenii (cereri + reputatie)
export interface Villager { id: string; spec: string; name: string; likes: string[]; hello: string[] }
export const VILLAGERS: Villager[] = [
  { id: 'leana', spec: 'granny', name: 'Bunica Leana', likes: ['carrot', 'potato', 'cabbage', 'meals'], hello: ['Ce copii frumoși! 🥰', 'Vă fac o plăcintă duminică!', 'Pe vremea mea…'] },
  { id: 'ina', spec: 'bunny', name: 'Ina', likes: ['tulip', 'rose', 'flower', 'strawberry'], hello: ['Bună! 🌸', 'Ce flori frumoase aveți!', 'Mergem la roata mare?'] },
  { id: 'gogu', spec: 'pig', name: 'Nea Gogu', likes: ['wood', 'stone', 'potato'], hello: ['Salutare, vecine!', 'Îmi repar gardul… 🔨', 'Cum merge grădina?'] },
  { id: 'miti', spec: 'cat', name: 'Miți', likes: ['fish', 'mushroom', 'berry'], hello: ['Miau! 🐟', 'Aveți pește?', 'Prr…'] },
  { id: 'rita', spec: 'fox', name: 'Rita', likes: ['sunflower', 'tomato', 'strawberry'], hello: ['Hei! 🦊', 'Am auzit că aveți tarabă!', 'Ce haine faine!'] },
  { id: 'rex', spec: 'dog', name: 'Rex', likes: ['wood', 'meals', 'fish'], hello: ['Ham! 🐶', 'Am o scrisoare pentru voi… glumesc!', 'Ce zi frumoasă!'] },
];
export interface Quest { id: string; who: string; res: string; qty: number; pay: number; day: number; done?: boolean }

/** reputatia in sat = suma prieteniilor */
export const reputation = (w: WorldState) => VILLAGERS.reduce((a, v) => a + st(w, 'friend-' + v.id), 0);
export const REP_LEVELS = [{ at: 0, name: 'Nou-veniți', bonus: 0 }, { at: 4, name: 'Cunoscuți', bonus: 0.05 }, { at: 10, name: 'Vecini dragi', bonus: 0.1 }, { at: 18, name: 'Sufletul satului', bonus: 0.15 }];
export const repLevel = (w: WorldState) => { const r = reputation(w); let L = REP_LEVELS[0]; for (const l of REP_LEVELS) if (r >= l.at) L = l; return L; };
/** reducere la magazinele din sat / bonus la piata */
export const villageBonus = (w: WorldState) => repLevel(w).bonus;
/** zi de targ: o data pe saptamana (duminica) piata plateste mai mult */
export const isMarketDay = (w: WorldState) => w.day % 7 === 0;

/** cererile zilei (3), generate din ce stiu sa produca ei (gradina, padurea) */
export function makeQuests(w: WorldState, prices: Record<string, number>): Quest[] {
  const rnd = mulberry(w.day * 7919 + 13);
  const pool = [...VILLAGERS].sort(() => rnd() - 0.5).slice(0, 3);
  return pool.map((v, i) => {
    const res = v.likes[Math.floor(rnd() * v.likes.length)];
    const qty = res === 'meals' ? 1 + Math.floor(rnd() * 2) : res === 'wood' || res === 'stone' ? 4 + Math.floor(rnd() * 5) : 2 + Math.floor(rnd() * 3);
    const pay = Math.round((prices[res] ?? 4) * qty * 1.7 + 8);
    return { id: `q${w.day}-${i}`, who: v.id, res, qty, pay, day: w.day };
  });
}
function mulberry(a: number) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ------------------------------------------------------------------ banca + apartament
export const APT_PRICE = 2400, APT_DOWN = 400, LOAN_RATE = 110, LOAN_DAYS = 20, APT_BILLS = 18;
export interface Bank { savings: number; loanLeft: number; late: number }
export const bankOf = (w: WorldState): Bank => ({ savings: 0, loanLeft: 0, late: 0, ...((w as any).town?.bank ?? {}) });

// ------------------------------------------------------------------ mall: mobila pentru apartament
export interface DecorDef { id: string; label: string; icon: string; price: number; type: string; gx: number; gy: number; w: number; d: number; action?: { id: string; label: string; icon: string }; desc: string }
export const DECOR: DecorDef[] = [
  { id: 'aquarium', label: 'Acvariu cu peștișori', icon: '🐟', price: 180, type: 'aquarium', gx: 6, gy: 13, w: 1, d: 1, action: { id: 'a-aquarium', label: 'Privește peștișorii', icon: '🐟' }, desc: 'Relaxare: +distracție' },
  { id: 'piano', label: 'Pian', icon: '🎹', price: 650, type: 'piano', gx: 11, gy: 4, w: 1, d: 1, action: { id: 'a-piano', label: 'Cântă la pian', icon: '🎹' }, desc: 'Cântați împreună: +iubire, +distracție' },
  { id: 'console', label: 'Consolă de jocuri', icon: '🎮', price: 280, type: 'console', gx: 4, gy: 12, w: 1, d: 1, action: { id: 'a-console', label: 'Joacă pe consolă', icon: '🎮' }, desc: 'Jocuri video în doi: +distracție mare' },
  { id: 'coffee', label: 'Espressor', icon: '☕', price: 150, type: 'coffeemachine', gx: 16, gy: 12, w: 1, d: 1, action: { id: 'a-coffee', label: 'Fă o cafea', icon: '☕' }, desc: 'O cafea pe zi: +energie' },
  { id: 'painting', label: 'Tablou cu inimioare', icon: '🖼️', price: 90, type: 'painting', gx: 7, gy: 8, w: 1, d: 1, desc: 'Decor: casa e mai frumoasă' },
  { id: 'bigplant', label: 'Plantă mare', icon: '🪴', price: 60, type: 'bigplant', gx: 11, gy: 13, w: 1, d: 1, action: { id: 'water_plant', label: 'Udă planta', icon: '🪴' }, desc: 'Decor viu' },
  { id: 'lamp', label: 'Lampă de podea', icon: '💡', price: 80, type: 'floorlamp', gx: 9, gy: 13, w: 1, d: 1, desc: 'Lumină caldă seara' },
];
