// Povestea mare (v1.7), dupa viziunea stabilita cu proprietarul (docs/PREDARE.md 7.4):
// podul, satul care renaste prin proiecte, ferma (parcele, utilaje, animale), angajatii cu raportul de seara,
// magazinul „Bubu & Dudu” din oras, contractele cu camionul, targul, nunta la biserica din sat,
// anotimpurile, sarbatorile, evenimentele, prieteniile pe 5 trepte si albumele.
// Tot ce se schimba trece prin s.op (se trimite si partenerului si se salveaza).
import type { WorldScene } from './world';
import type { Furn } from '../world/map';
import { Sfx } from '../engine/sfx';
import { iso } from '../world/iso';
import { g } from '../game/gender';
import { VILLAGERS } from '../game/town';
import { RECIPES } from '../game/food';
import { ITEMS } from '../char/outfit';
import { BRIDGE_CHAPTER, VILLAGE_CHAPTER, FARM_CHAPTER, CITY_CHAPTER, SHOP_CHAPTER, WEDDING_CHAPTER } from '../game/economy';
import { CITY_BUILDINGS } from '../world/city';
import { catCount, catPick } from '../world/garden';

type S = WorldScene;
const st = (s: S, k: string) => s.w.stats[k] ?? 0;
const res = (s: S, k: string) => s.w.res?.[k] ?? 0;
const T = <X>(s: S, k: string, def: X): X => ((s.w.town ?? {}) as Record<string, unknown>)[k] as X ?? def;
const setT = (s: S, k: string, v: unknown) => s.op({ k: 'town', key: k, value: JSON.parse(JSON.stringify(v)) });
const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function mulberry(a: number) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const fx = (s: S, gx: number, gy: number, text: string, col = '#2ec4b6') => { const p = iso(gx, gy, 90); s.fx.text(p.x, p.y, text, col, 1); };
/** iei din inventar cheile date (in ordine), cat ai, pana la n; intoarce cate ai luat */
function take(s: S, keys: string[], n: number) { let left = n; for (const k of keys) { const h = Math.min(left, res(s, k)); if (h > 0) { s.op({ k: 'res', res: k, delta: -h }); left -= h; } if (!left) break; } return n - left; }
const VEG = ['carrot', 'potato', 'tomato', 'cabbage', 'strawberry', 'veg'];
const FLOWERS = ['flower', 'tulip', 'rose', 'sunflower'];

// ====================================================================== ANOTIMPURILE, SARBATORILE, EVENIMENTELE
/** 4 anotimpuri a cate 7 zile: un an de joc = 28 de zile */
export const SEASONS = [
  { id: 'spring', name: 'Primăvara', icon: '🌸' }, { id: 'summer', name: 'Vara', icon: '☀️' },
  { id: 'autumn', name: 'Toamna', icon: '🍂' }, { id: 'winter', name: 'Iarna', icon: '❄️' },
] as const;
export const seasonOf = (day: number) => SEASONS[Math.floor(((day - 1) % 28 + 28) % 28 / 7)];
export const dayOfSeason = (day: number) => (((day - 1) % 7) + 7) % 7 + 1;
/** cat de repede cresc plantele in anotimpul asta */
export const seasonGrowth = (day: number) => ({ spring: 1.15, summer: 1, autumn: 0.8, winter: 0.35 })[seasonOf(day).id];
export interface DayEvent { id: string; icon: string; name: string; text: string }
/** ce se intampla azi (la fel pe ambele telefoane: depinde doar de zi) */
export function eventsOf(day: number): DayEvent[] {
  const se = seasonOf(day).id, d = dayOfSeason(day), out: DayEvent[] = [];
  if (se === 'spring' && d === 1) out.push({ id: 'martisor', icon: '🌸', name: 'Mărțișorul', text: 'Dăruiți-vă câte un mărțișor: iubirea crește la amândoi' });
  if (se === 'spring' && d === 5) out.push({ id: 'paste', icon: '🥚', name: 'Paștele', text: 'Ouă vopsite pe masă și cozonac: primiți 6 ouă roșii' });
  if (se === 'spring' && d === 6) out.push({ id: 'villwed', icon: '💒', name: 'Nunta Inei', text: 'Ina se mărită! Mergeți la biserica din sat: prietenia crește' });
  if (se === 'summer' && d === 2) out.push({ id: 'bdaybubu', icon: '🎂', name: 'Ziua lui Bubu', text: 'Bubu e sărbătorită! Dudu, fă-i o surpriză (un pupic, o floare)' });
  if (se === 'summer' && d === 4) out.push({ id: 'grandparents', icon: '👵', name: 'Vizita bunicilor', text: 'Bunicii vin în vizită la voi acasă, cu daruri' });
  if (se === 'summer' && d === 6) out.push({ id: 'swim', icon: '🏊', name: 'Zi de lac', text: 'E cald: o baie în lac vă face fericiți (debarcaderul de la lac)' });
  if (se === 'autumn' && d === 3) out.push({ id: 'storm', icon: '⛈️', name: 'Furtuna', text: 'Furtuna a stricat acoperișul: Dudu îl repară cu lemne și scânduri' });
  if (se === 'autumn' && d === 5) out.push({ id: 'bdaydudu', icon: '🎂', name: 'Ziua lui Dudu', text: 'Dudu e sărbătorit! Bubu, fă-i o surpriză' });
  if (se === 'winter' && d === 3) out.push({ id: 'craciun', icon: '🎄', name: 'Crăciunul', text: 'Bradul, colindele și cadourile: primiți daruri de la săteni' });
  if (se === 'winter' && d === 5) out.push({ id: 'dragobete', icon: '💞', name: 'Dragobetele', text: 'Ziua îndrăgostiților la români: un pupic face cât zece' });
  if (se === 'winter' && d === 7) out.push({ id: 'revelion', icon: '🎆', name: 'Revelionul', text: 'La miezul nopții: artificii deasupra satului' });
  if (day % 28 === 14) out.push({ id: 'fairday', icon: '🎪', name: 'Târgul lunar', text: 'Târg în sat: piața plătește mult mai bine azi' });
  return out;
}
export const hasEvent = (s: S, id: string) => eventsOf(s.w.day).some(e => e.id === id);

// ====================================================================== PODUL (Capitolul 3)
const BRIDGE_NEED: { key: string; res: string[]; n: number; label: string; icon: string }[] = [
  { key: 'wood', res: ['wood'], n: 20, label: 'lemne', icon: '🪵' },
  { key: 'plank', res: ['plank'], n: 6, label: 'scânduri', icon: '📏' },
  { key: 'stone', res: ['stone'], n: 12, label: 'pietre', icon: '🪨' },
  { key: 'meal', res: ['meals'], n: 3, label: 'porții de mâncare caldă', icon: '🍲' },
  { key: 'money', res: [], n: 150, label: 'lei pentru meșteri', icon: '💰' },
];
export function openBridge(s: S) {
  if (s.bridgeFixed()) { s.hud.toast('🌉 Podul Mare e reparat: drumul spre sat e deschis'); return; }
  if (s.chapter < BRIDGE_CHAPTER) { s.hud.toast('🌉 Podul Mare e rupt. Îl reparați în Capitolul 3 (după pădure)'); return; }
  const rows = BRIDGE_NEED.map(b => { const have = st(s, 'bridge-' + b.key), left = Math.max(0, b.n - have), mine = b.key === 'money' ? (s.w.money ?? 0) : b.res.reduce((a, k) => a + res(s, k), 0) - (b.key === 'wood' ? 5 : 0);
    return `<li class="${left ? '' : 'done'}"><b>${b.icon} ${have}/${b.n} ${b.label}</b><small>${left ? `ai ${Math.max(0, mine)}${b.key === 'wood' ? ' (5 rămân pentru sobă)' : ''}` : '✔ gata'}</small>${left ? `<button data-give="${b.key}" ${mine > 0 ? '' : 'disabled'}>Dă ${Math.min(left, Math.max(0, mine))}</button>` : ''}</li>`; }).join('');
  const m = s.hud.modal(`<h3>🌉 Podul Mare</h3><p class="sub">Meșterii din sat (Nea Gogu și Rex) repară podul. Aduceți ce le trebuie: când e tot, se apucă de treabă.</p><ul class="goals give">${rows}</ul>`);
  m.querySelectorAll('[data-give]').forEach(b => b.addEventListener('click', () => { giveBridge(s, (b as HTMLElement).dataset.give!); openBridge(s); }));
}
function giveBridge(s: S, key: string) {
  const b = BRIDGE_NEED.find(x => x.key === key)!; const left = b.n - st(s, 'bridge-' + key); if (left <= 0) return;
  let n = 0;
  if (key === 'money') { n = Math.min(left, s.w.money ?? 0); if (n) s.op({ k: 'money', delta: -n }); }
  else if (key === 'wood') { n = Math.min(left, Math.max(0, res(s, 'wood') - 5)); if (n) s.op({ k: 'res', res: 'wood', delta: -n }); }
  else n = take(s, b.res, left);
  if (!n) { Sfx.play('bad'); return; }
  s.op({ k: 'stat', key: 'bridge-' + key, delta: n });
  Sfx.play(key === 'money' ? 'coin' : 'wood_drop'); s.me.actor.play(key === 'money' ? 'wave' : 'act_carry');
  s.log(`${s.me.actor.spec.name} a dus ${n} ${b.label} la Podul Mare ${b.icon}`);
  if (BRIDGE_NEED.every(x => st(s, 'bridge-' + x.key) >= x.n)) setTimeout(() => { s.hud.closeModal(); s.playScene('bridge', true); }, 300);
}
/** finalul podului (dupa animatie): podul e reparat */
export function bridgeDone(s: S) { if (st(s, 'bridgeFixed') > 0) return; s.op({ k: 'stat', key: 'bridgeFixed', delta: 1 }); s.log('Meșterii au reparat Podul Mare! Drumul spre sat e deschis 🌉🎉'); }

// ====================================================================== SATUL RENASTE (Capitolul 4): proiectele de la Primarie
export interface Project { id: string; name: string; icon: string; text: string; cost: { money: number } & Record<string, number>; opens: string[] }
export const PROJECTS: Project[] = [
  { id: 'bakery', name: 'Brutăria', icon: '🍞', text: 'Brutarul se întoarce: pâine caldă și slujbă de dimineață', cost: { money: 120, wood: 10, flour: 6 }, opens: ['v-bakery'] },
  { id: 'market', name: 'Piața', icon: '💱', text: 'Tarabele din piață se deschid: vindeți recoltele', cost: { money: 100, veg: 12 }, opens: ['v-market'] },
  { id: 'school', name: 'Școala', icon: '🏫', text: 'Copiii se întorc în sat: lecții și o învățătoare nouă', cost: { money: 200, plank: 10 }, opens: ['v-school'] },
  { id: 'park', name: 'Parcul', icon: '🎡', text: 'Roata mare și călușeii pornesc din nou', cost: { money: 250, flower: 10, wood: 10 }, opens: ['v-ferris', 'v-carousel'] },
  { id: 'lights', name: 'Iluminatul', icon: '💡', text: 'Felinare aprinse pe ulițe: satul e frumos și noaptea', cost: { money: 150, plank: 8, stone: 10 }, opens: [] },
  { id: 'road', name: 'Drumul pietruit', icon: '🛤️', text: 'Ulițele pietruite aduc negustori și o familie nouă', cost: { money: 180, stone: 25 }, opens: [] },
];
const RES_KEYS: Record<string, string[]> = { veg: VEG, flower: FLOWERS };
const RES_LABEL: Record<string, string> = { wood: '🪵 lemne', flour: '🥡 făină', veg: '🥕 legume', plank: '📏 scânduri', flower: '🌸 flori', stone: '🪨 pietre', money: '💰 lei' };
export const projectDone = (s: S, id: string) => st(s, 'proj-' + id) > 0;
/** cladirea din sat e inca inchisa (proiectul ei nu e facut)? */
export function villageClosed(s: S, id: string) { const p = PROJECTS.find(x => x.opens.includes(id)); return p && !projectDone(s, p.id) ? p : null; }
export function openProjects(s: S) {
  const list = PROJECTS.map(p => {
    const done = projectDone(s, p.id);
    const need = Object.entries(p.cost).map(([k, n]) => { const have = st(s, `pj-${p.id}-${k}`); return `<span class="${have >= n ? 'ok' : ''}">${RES_LABEL[k] ?? k} ${Math.min(have, n)}/${n}</span>`; }).join(' · ');
    return `<li class="${done ? 'done' : ''}"><b>${done ? '✅' : p.icon} ${p.name}</b><small>${p.text}</small><small class="need">${done ? 'Gata: satul a prins viață aici' : need}</small>${done ? '' : `<button data-pj="${p.id}">Contribuie</button>`}</li>`;
  }).join('');
  const m = s.hud.modal(`<h3>📋 Proiectele satului</h3><p class="sub">Satul e pe moarte: îl readuceți la viață. Contribuiți amândoi cu ce aveți; după fiecare proiect se mută săteni noi. (${st(s, 'projectsDone')}/${PROJECTS.length} gata)</p><ul class="goals give">${list}</ul>`);
  m.querySelectorAll('[data-pj]').forEach(b => b.addEventListener('click', () => { contribute(s, (b as HTMLElement).dataset.pj!); openProjects(s); }));
}
function contribute(s: S, id: string) {
  if (s.chapter < VILLAGE_CHAPTER) { s.hud.toast('📋 Proiectele încep în Capitolul 4 · Satul renaște'); return; }
  const p = PROJECTS.find(x => x.id === id)!; let gave = 0;
  for (const [k, n] of Object.entries(p.cost)) {
    const key = `pj-${p.id}-${k}`, left = n - st(s, key); if (left <= 0) continue;
    let d = 0;
    if (k === 'money') { d = Math.min(left, s.w.money ?? 0); if (d) s.op({ k: 'money', delta: -d }); }
    else if (k === 'wood') { d = Math.min(left, Math.max(0, res(s, 'wood') - 5)); if (d) s.op({ k: 'res', res: 'wood', delta: -d }); }
    else d = take(s, RES_KEYS[k] ?? [k], left);
    if (d) { s.op({ k: 'stat', key, delta: d }); gave += d; }
  }
  if (!gave) { s.hud.toast('N-ai nimic din ce trebuie acum 🙂 (lemnele: 5 rămân pentru sobă)'); Sfx.play('bad'); return; }
  Sfx.play('coin');
  if (Object.entries(p.cost).every(([k, n]) => st(s, `pj-${p.id}-${k}`) >= n)) finishProject(s, p);
  else s.hud.toast(`${p.icon} Ai contribuit la ${p.name}. Mai lipsesc câteva lucruri`);
}
const NEW_FAMILIES = ['familia Ionescu', 'doamna învățătoare Maria', 'brutarul Vasilică', 'familia Moldovan', 'tânărul Andrei, întors de la oraș', 'familia Pop cu trei copii'];
function finishProject(s: S, p: Project) {
  s.op({ k: 'stat', key: 'proj-' + p.id, delta: 1 }); s.op({ k: 'stat', key: 'projectsDone', delta: 1 }); s.op({ k: 'hearts', delta: 5 });
  const fam = NEW_FAMILIES[(st(s, 'projectsDone') - 1) % NEW_FAMILIES.length];
  s.log(`Satul renaște: ${p.icon} ${p.name}! S-a mutat în sat ${fam} 🏡`);
  s.hud.closeModal(); s.hud.toast(`🎉 ${p.icon} ${p.name}! ${p.text}. S-a mutat în sat ${fam}`);
  Sfx.play('victory'); Sfx.play('applause', { delay: 0.4, vol: 0.6 }); s.me.actor.play('dance_hop'); s.partner.actor.play('dance_hop');
  s.syncPlaced();
}
/** casele parasite din sat (se repara cate doua dupa fiecare proiect) */
export function abandonedHouses(s: S): Set<string> {
  const ids = ['vh-103--1', 'vh-107--1', 'vh-111--1', 'vh-115--1', 'vh-143--1', 'vh-144-35', 'vh-132-42', 'vh-132-46', 'vh-103-42'];
  const fixed = s.chapter < VILLAGE_CHAPTER && !s.bridgeFixed() ? 0 : st(s, 'projectsDone') * 2 + (s.chapter > VILLAGE_CHAPTER ? 99 : 0);
  return new Set(ids.slice(Math.min(ids.length, fixed)));
}

// ====================================================================== FERMA (Capitolul 5)
export interface Parcel { owned?: boolean; stage: 'wild' | 'plowed' | 'sown' | 'ripe'; crop?: string; prog: number; wet: number }
export const PARCELS = [
  { id: 'parcel-1', name: 'Parcela de lângă drum', price: 300, x0: 3, y0: 29, x1: 15, y1: 35 },
  { id: 'parcel-2', name: 'Parcela cu porumb', price: 400, x0: 17, y0: 29, x1: 27, y1: 35 },
  { id: 'parcel-3', name: 'Parcela de lângă moară', price: 500, x0: 30, y0: 29, x1: 42, y1: 34 },
  { id: 'parcel-4', name: 'Parcela din vest', price: 450, x0: -11, y0: 29, x1: -2, y1: 34 },
];
export const FIELD_CROPS: Record<string, { name: string; icon: string; res: string; yieldPer: number; price: number }> = {
  wheat: { name: 'Grâu', icon: '🌾', res: 'grain', yieldPer: 2.5, price: 3 },
  corn: { name: 'Porumb', icon: '🌽', res: 'corn', yieldPer: 2, price: 4 },
  sunflower: { name: 'Floarea-soarelui', icon: '🌻', res: 'sunseed', yieldPer: 1.6, price: 5 },
};
export const MACHINES: Record<string, { name: string; icon: string; price: number; op: string }> = {
  plow: { name: 'Plugul', icon: '🚜', price: 350, op: 'Ară' },
  seeder: { name: 'Semănătoarea', icon: '🌱', price: 450, op: 'Seamănă' },
  tanker: { name: 'Cisterna cu apă', icon: '💧', price: 300, op: 'Udă' },
  combine: { name: 'Combina', icon: '🌾', price: 900, op: 'Recoltează' },
};
export const parcelsOf = (s: S): Record<string, Parcel> => T(s, 'parcels', {} as Record<string, Parcel>);
export const hasMachine = (s: S, m: string) => st(s, 'mach-' + m) > 0;
export function openParcel(s: S, id: string) {
  const P = PARCELS.find(p => p.id === id)!; const all = parcelsOf(s), p = all[id];
  if (s.chapter < FARM_CHAPTER) { s.hud.toast('🌾 Câmpul vecinilor. Parcelele se vând în Capitolul 5 · Ferma'); return; }
  if (!p?.owned) {
    s.choice(`🟫 ${P.name}`, `O parcelă de câmp de ${(P.x1 - P.x0) * (P.y1 - P.y0)} de dale, a voastră pentru totdeauna. Preț: ${P.price} lei.`, [
      ['🟫', `Cumpără (${P.price} lei)`, () => { if ((s.w.money ?? 0) < P.price) { s.hud.toast('Nu aveți destui bani'); Sfx.play('bad'); return; }
        s.op({ k: 'money', delta: -P.price }); all[id] = { owned: true, stage: 'wild', prog: 0, wet: 0 }; setT(s, 'parcels', all); s.op({ k: 'stat', key: 'parcels', delta: 1 });
        s.log(`Ați cumpărat ${P.name.toLowerCase()} 🟫`); Sfx.play('good'); s.hud.toast('🟫 Parcela e a voastră! Ară-o cu plugul (laptopul → Utilaje)'); }],
      ['✖', 'Nu acum', () => {}]]);
    return;
  }
  const next = p.stage === 'wild' ? 'plow' : p.stage === 'plowed' ? 'seeder' : p.stage === 'sown' ? 'tanker' : 'combine';
  const info = p.stage === 'wild' ? 'Pământul e tare, cu buruieni: trebuie arat.' : p.stage === 'plowed' ? 'Arat frumos: alege ce semeni.' : p.stage === 'sown' ? `Crește ${FIELD_CROPS[p.crop!].name.toLowerCase()}: ${Math.round(p.prog * 100)}%${p.wet > s.w.gameMin! ? ' · udat 💧' : ' · udă-l ca să crească mai repede'}` : `${FIELD_CROPS[p.crop!].icon} E copt! Recoltează cu combina.`;
  const opts: [string, string, () => void][] = [];
  const need = (m: string) => hasMachine(s, m) ? '' : ` (n-aveți ${MACHINES[m].name.toLowerCase()})`;
  if (p.stage === 'plowed') for (const [c, d] of Object.entries(FIELD_CROPS)) opts.push([d.icon, `Seamănă ${d.name.toLowerCase()}${need('seeder')}`, () => fieldWork(s, id, 'seeder', c)]);
  else if (p.stage === 'sown') opts.push(['💧', `Udă cu cisterna${need('tanker')}`, () => fieldWork(s, id, 'tanker')]);
  else opts.push([MACHINES[next].icon, `${MACHINES[next].op} cu ${MACHINES[next].name.toLowerCase()}${need(next)}`, () => fieldWork(s, id, next)]);
  opts.push(['✖', 'Gata', () => {}]);
  s.choice(`🟫 ${P.name}`, info, opts);
}
/** lucrul pe camp: tractorul cu utilajul merge singur pe randuri (semi-automat) */
function fieldWork(s: S, id: string, mach: string, crop?: string) {
  if (!hasMachine(s, mach)) { s.hud.toast(`${MACHINES[mach].icon} Vă trebuie ${MACHINES[mach].name.toLowerCase()}: laptopul din casă → Utilaje`); Sfx.play('bad'); return; }
  if (s.ride) return;
  const P = PARCELS.find(p => p.id === id)!;
  s.startFieldRide(P, mach, () => fieldDone(s, id, mach, crop));
}
function fieldDone(s: S, id: string, mach: string, crop?: string) {
  const all = parcelsOf(s), p = all[id]; if (!p) return;
  const P = PARCELS.find(x => x.id === id)!, area = (P.x1 - P.x0) * (P.y1 - P.y0);
  if (mach === 'plow') { p.stage = 'plowed'; s.op({ k: 'stat', key: 'fieldPlowed', delta: 1 }); s.hud.toast('🚜 Parcela e arată! Acum semănătoarea'); }
  else if (mach === 'seeder') { p.stage = 'sown'; p.crop = crop ?? 'wheat'; p.prog = 0; s.op({ k: 'stat', key: 'fieldSown', delta: 1 }); s.hud.toast(`🌱 Ai semănat ${FIELD_CROPS[p.crop].name.toLowerCase()}. Udă-l cu cisterna ca să crească repede`); }
  else if (mach === 'tanker') { p.wet = (s.w.gameMin ?? 0) + 24 * 60; s.op({ k: 'stat', key: 'fieldWatered', delta: 1 }); s.hud.toast('💧 Câmpul e udat pentru o zi întreagă'); }
  else if (mach === 'combine') {
    const c = FIELD_CROPS[p.crop ?? 'wheat'], n = Math.round(area * c.yieldPer / 4);
    s.op({ k: 'res', res: c.res, delta: n }); s.op({ k: 'stat', key: 'fieldHarvested', delta: 1 }); s.op({ k: 'stat', key: 'harvest-' + (p.crop ?? 'wheat'), delta: n });
    p.stage = 'wild'; p.crop = undefined; p.prog = 0; p.wet = 0;
    s.hud.toast(`${c.icon} Recoltă: +${n} ${c.name.toLowerCase()}! Le vindeți la piață, la oraș sau la contracte`);
    s.log(`${s.me.actor.spec.name} a recoltat ${n} ${c.name.toLowerCase()} cu combina 🌾`); Sfx.play('victory');
  }
  all[id] = p; setT(s, 'parcels', all); s.syncPlaced();
}
/** cresterea culturilor de pe parcele (la fiecare minut de joc, pe telefonul gazda) */
function growFields(s: S, minutes: number) {
  const all = parcelsOf(s); let ch = false;
  for (const p of Object.values(all)) if (p.owned && p.stage === 'sown') {
    const wet = p.wet > (s.w.gameMin ?? 0);
    // copt in ~2 zile de joc fara apa, ~1 zi cu apa; iarna mult mai incet
    const before = p.prog; p.prog = Math.min(1, p.prog + minutes / (wet ? 1440 : 2880) * seasonGrowth(s.w.day));
    if (p.prog >= 1 && before < 1) { p.stage = 'ripe'; ch = true; s.hud.toast('🌾 Un câmp e copt! Recoltează-l cu combina'); }
    if (Math.floor(p.prog * 4) !== Math.floor(before * 4)) ch = true;
  }
  if (ch) { setT(s, 'parcels', all); s.syncPlaced(); }
}

// --- animalele (Bubu): gaini, vaca, oi, stupi
export const ANIMALS: Record<string, { name: string; icon: string; price: number; max: number; stat: string; product: string; prodLabel: string; every: number; per: number }> = {
  hens: { name: 'Găini (coteț)', icon: '🐔', price: 120, max: 6, stat: 'hens', product: 'egg', prodLabel: 'ouă', every: 1, per: 1 },
  cows: { name: 'Văcuță', icon: '🐄', price: 600, max: 2, stat: 'cows', product: 'milk', prodLabel: 'lapte', every: 1, per: 2 },
  sheep: { name: 'Oi', icon: '🐑', price: 250, max: 4, stat: 'sheep', product: 'wool', prodLabel: 'lână', every: 3, per: 2 },
  hives: { name: 'Stup de albine', icon: '🐝', price: 200, max: 4, stat: 'hives', product: 'honey', prodLabel: 'miere', every: 2, per: 2 },
};
export function openFarmGate(s: S) {
  if (s.chapter < FARM_CHAPTER) { s.hud.toast('🐔 Ferma voastră începe în Capitolul 5'); return; }
  const rows = Object.entries(ANIMALS).map(([k, a]) => { const n = st(s, a.stat); return `<button data-buy="${k}" class="${n >= a.max ? 'on' : (s.w.money ?? 0) < a.price ? 'poor' : ''}"><span>${a.icon}</span><b>${a.name}</b><small>${n ? `aveți ${n}/${a.max}` : 'niciunul'} · 💰 ${a.price} lei · ${a.per} ${a.prodLabel} la ${a.every === 1 ? 'zi' : a.every + ' zile'}${k === 'hens' ? ' de fiecare' : ''}</small></button>`; }).join('');
  const m = s.hud.modal(`<h3>🐔 Ferma voastră</h3><p class="sub">Animalele dau produse în fiecare zi: le strângeți voi (sau îngrijitorul angajat). Produsele merg în rețete, pe tarabă, la magazinul din oraș și la contracte.</p><div class="shop">${rows}</div>`);
  m.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
    const k = (b as HTMLElement).dataset.buy!, a = ANIMALS[k];
    if (st(s, a.stat) >= a.max) { s.hud.toast('Aveți destule 🙂'); return; }
    if ((s.w.money ?? 0) < a.price) { s.hud.toast('Nu aveți destui bani'); Sfx.play('bad'); return; }
    s.op({ k: 'money', delta: -a.price }); s.op({ k: 'stat', key: a.stat, delta: 1 }); Sfx.play(k === 'hens' ? 'chicken' : k === 'cows' ? 'pig' : k === 'sheep' ? 'sheep' : 'good');
    s.log(`Ați luat ${a.name.toLowerCase()} la fermă ${a.icon}`); s.syncPlaced(); openFarmGate(s);
  }));
}
/** cat e gata de strans la un animal azi */
export function ready(s: S, k: string) { const a = ANIMALS[k], n = st(s, a.stat); if (!n) return 0; const last = st(s, 'got-' + k); return s.w.day - last >= a.every ? n * a.per : 0; }
export function collect(s: S, k: string, pawn = s.me) {
  const a = ANIMALS[k], n = ready(s, k);
  if (!n) { if (pawn === s.me) s.hud.toast(`${a.icon} Ai strâns deja. Revino ${a.every === 1 ? 'mâine' : `peste ${a.every} zile`}`); return; }
  s.op({ k: 'res', res: a.product, delta: n }); s.op({ k: 'stat', key: 'got-' + k, delta: s.w.day - st(s, 'got-' + k) });
  const statKey = { egg: 'eggsCollected', milk: 'milkCollected', wool: 'woolCollected', honey: 'honeyCollected' }[a.product]!;
  s.op({ k: 'stat', key: statKey, delta: n }); s.op({ k: 'need', who: pawn.id, need: 'fun', delta: 4 });
  pawn.actor.play(k === 'cows' ? 'act_milk' : 'act_collect'); Sfx.play(k === 'hens' ? 'chicken' : k === 'cows' ? 'pour' : k === 'sheep' ? 'sheep' : 'bubble', { vol: 0.8 });
  if (pawn === s.me) { fx(s, pawn.gx, pawn.gy, `+${n} ${a.prodLabel} ${a.icon}`); s.hud.toast(`${a.icon} +${n} ${a.prodLabel}`); }
}
export function makeCheese(s: S) {
  if (res(s, 'milk') < 3) { s.hud.toast('🧀 Pentru brânză îți trebuie 3 lapte (mulge vaca)'); Sfx.play('bad'); return; }
  s.op({ k: 'res', res: 'milk', delta: -3 }); s.op({ k: 'res', res: 'cheese', delta: 1 }); s.op({ k: 'stat', key: 'cheeseMade', delta: 1 });
  s.me.actor.play('act_cook'); Sfx.play('spoon'); s.hud.toast('🧀 Ai făcut o roată de brânză de vaci!');
}

// ====================================================================== ANGAJATII
export interface Staff { id: string; name: string; role: string; wage: number; skill: number; unpaid: number; days: number; f?: boolean }
export const ROLES: Record<string, { name: [string, string]; icon: string; text: string; base: number; need?: (s: S) => string | null }> = {
  garden: { name: ['Grădinar', 'Grădinăreasă'], icon: '🧑‍🌾', text: 'udă și culege grădina, udă câmpurile', base: 18 },
  animals: { name: ['Îngrijitor de animale', 'Îngrijitoare de animale'], icon: '🐄', text: 'strânge ouăle, laptele, mierea și lâna', base: 20, need: s => Object.values(ANIMALS).some(a => st(s, a.stat)) ? null : 'Nu aveți încă animale' },
  stall: { name: ['Vânzător la tarabă', 'Vânzătoare la tarabă'], icon: '🧺', text: 'vinde la taraba de acasă (ia și un procent)', base: 16, need: s => s.w.furn.standBroken ? 'Taraba e încă stricată' : null },
  florist: { name: ['Florar', 'Florăreasă'], icon: '💐', text: 'ține deschisă florăria lui Bubu', base: 22, need: s => st(s, 'florarie') ? null : 'Nu aveți încă florăria' },
  wood: { name: ['Tăietor de lemne', 'Tăietoare de lemne'], icon: '🪓', text: 'taie lemne și le stivuiește acasă', base: 18 },
  tractor: { name: ['Tractorist', 'Tractoristă'], icon: '🚜', text: 'lucrează parcelele cu utilajele voastre', base: 26, need: s => Object.values(parcelsOf(s)).some(p => p.owned) ? null : 'Nu aveți încă parcele' },
  shop: { name: ['Vânzător la magazin', 'Vânzătoare la magazin'], icon: '🏪', text: 'vinde la magazinul „Bubu & Dudu” din oraș', base: 30, need: s => st(s, 'shopBuilt') ? null : 'Nu aveți încă magazinul din oraș' },
};
const NAMES_M = ['Ion', 'Vasile', 'Mihai', 'Andrei', 'Costel', 'Radu', 'Gelu', 'Petrică', 'Florin', 'Sorin'];
const NAMES_F = ['Maria', 'Ioana', 'Elena', 'Ana', 'Floarea', 'Georgiana', 'Lenuța', 'Anca', 'Viorica', 'Irina'];
export const staffOf = (s: S): Staff[] => T(s, 'staff', [] as Staff[]);
/** candidatii zilei (aceiasi pe ambele telefoane) */
function candidates(s: S): Staff[] {
  const r = mulberry(s.w.day * 31337 + 7), roles = Object.keys(ROLES), out: Staff[] = [];
  for (let i = 0; i < 4; i++) {
    const f = r() < 0.5, name = (f ? NAMES_F : NAMES_M)[Math.floor(r() * 10)], role = roles[Math.floor(r() * roles.length)], skill = 1 + Math.floor(r() * 3);
    out.push({ id: `e${s.w.day}-${i}`, name, role, skill, wage: ROLES[role].base + skill * 6, unpaid: 0, days: 0, f });
  }
  return out;
}
export function openStaff(s: S) {
  if (s.chapter < FARM_CHAPTER) { s.hud.toast('🧑‍🌾 Oamenii de muncă se angajează din Capitolul 5 · Ferma'); return; }
  const staff = staffOf(s), hiredIds = new Set(staff.map(x => x.id));
  const now = staff.map(e => `<li><b>${ROLES[e.role].icon} ${esc(e.name)} · ${ROLES[e.role].name[e.f ? 1 : 0]}</b><small>pricepere ${'★'.repeat(Math.round(e.skill))}${'☆'.repeat(5 - Math.round(e.skill))} · salariu ${e.wage} lei/zi${e.unpaid ? ` · ⚠️ neplătit ${e.unpaid} zi` : ''}</small><button data-fire="${e.id}">Concediază</button></li>`).join('') || '<li><small>Nu aveți încă angajați.</small></li>';
  const cand = candidates(s).filter(c => !hiredIds.has(c.id)).map(c => { const why = ROLES[c.role].need?.(s); return `<li><b>${ROLES[c.role].icon} ${esc(c.name)} · ${ROLES[c.role].name[c.f ? 1 : 0]}</b><small>${ROLES[c.role].text} · pricepere ${'★'.repeat(c.skill)}${'☆'.repeat(5 - c.skill)} · ${c.wage} lei/zi</small>${why ? `<small class="need">${why}</small>` : `<button data-hire="${c.id}">Angajează</button>`}</li>`; }).join('');
  const m = s.hud.modal(`<h3>🧑‍🌾 Oameni de muncă</h3><p class="sub">Angajații lucrează în fiecare zi, și când sunteți la oraș. Salariul se plătește dimineața; dacă nu aveți bani două zile, pleacă. Pricepere crește cu fiecare zi. Seara primiți raportul.</p><h4>Angajații voștri</h4><ul class="goals give">${now}</ul><h4>Vor să lucreze azi</h4><ul class="goals give">${cand}</ul>`);
  m.querySelectorAll('[data-hire]').forEach(b => b.addEventListener('click', () => { const c = candidates(s).find(x => x.id === (b as HTMLElement).dataset.hire)!; const list = staffOf(s); if (list.length >= 6) { s.hud.toast('Aveți destui oameni (6)'); return; } list.push(c); setT(s, 'staff', list); s.op({ k: 'stat', key: 'hired', delta: 1 }); s.log(`L-ați angajat pe ${c.name} (${ROLES[c.role].name[c.f ? 1 : 0].toLowerCase()}) ${ROLES[c.role].icon}`.replace('L-ați angajat pe', c.f ? 'Ați angajat-o pe' : 'L-ați angajat pe')); Sfx.play('good'); s.syncWalkers(); openStaff(s); }));
  m.querySelectorAll('[data-fire]').forEach(b => b.addEventListener('click', () => { setT(s, 'staff', staffOf(s).filter(x => x.id !== (b as HTMLElement).dataset.fire)); s.syncWalkers(); openStaff(s); }));
}
/** munca de peste zi a angajatilor + salariile: dimineata (pe gazda); intoarce randurile raportului */
function staffDay(s: S): string[] {
  const list = staffOf(s); if (!list.length) return [];
  const lines: string[] = []; let wages = 0, earned = 0;
  const keep: Staff[] = [];
  for (const e of list) {
    const R = ROLES[e.role], nm = e.name, k = e.skill;
    if ((s.w.money ?? 0) >= e.wage) { s.op({ k: 'money', delta: -e.wage }); wages += e.wage; e.unpaid = 0; }
    else { e.unpaid++; if (e.unpaid >= 2) { lines.push(`😢 ${nm} a plecat: n-a primit salariul două zile`); continue; } lines.push(`⚠️ ${nm} n-a primit salariul azi`); }
    e.days++; e.skill = Math.min(5, e.skill + 0.15);
    let what = '';
    if (e.role === 'garden') { const plots = s.w.plots ?? {}; let w = 0; for (const p of Object.values(plots)) if (p.crop) { p.wetUntil = (s.w.gameMin ?? 0) + 180; w++; } s.op({ k: 'plots', all: plots }); const fp = parcelsOf(s); for (const p of Object.values(fp)) if (p.stage === 'sown') p.wet = (s.w.gameMin ?? 0) + 1440; setT(s, 'parcels', fp); what = `a udat ${w} răzoare și câmpurile`; }
    else if (e.role === 'animals') { const got: string[] = []; for (const a of Object.keys(ANIMALS)) { const n = ready(s, a); if (n) { collect(s, a, s.partner); got.push(`${n} ${ANIMALS[a].prodLabel}`); } } what = got.length ? `a strâns ${got.join(', ')}` : 'a hrănit animalele'; }
    else if (e.role === 'stall') { const lei = Math.round(12 + k * 9); s.op({ k: 'money', delta: lei }); earned += lei; what = `a vândut ${Math.round(3 + k * 2)} produse la tarabă, +${lei} lei`; }
    else if (e.role === 'florist') { const lei = Math.round(18 + k * 12); s.op({ k: 'money', delta: lei }); earned += lei; what = `a vândut buchete la florărie, +${lei} lei`; }
    else if (e.role === 'wood') { const n = Math.round(4 + k * 2); s.op({ k: 'res', res: 'wood', delta: n }); what = `a tăiat ${n} lemne`; }
    else if (e.role === 'tractor') { const fp = parcelsOf(s); let n = 0; for (const [id, p] of Object.entries(fp)) { if (!p.owned) continue; if (p.stage === 'wild' && hasMachine(s, 'plow')) { p.stage = 'plowed'; n++; } else if (p.stage === 'plowed' && hasMachine(s, 'seeder')) { p.stage = 'sown'; p.crop = ['wheat', 'corn', 'sunflower'][n % 3]; p.prog = 0; n++; } else if (p.stage === 'ripe' && hasMachine(s, 'combine')) { const c = FIELD_CROPS[p.crop ?? 'wheat'], P = PARCELS.find(x => x.id === id)!, q = Math.round((P.x1 - P.x0) * (P.y1 - P.y0) * c.yieldPer / 4 * 0.9); s.op({ k: 'res', res: c.res, delta: q }); p.stage = 'wild'; p.crop = undefined; n++; } }
      setT(s, 'parcels', fp); what = n ? `a lucrat ${n} parcele cu utilajele` : 'a pregătit utilajele'; }
    else if (e.role === 'shop') { const sold = shopSell(s, 6 + k * 3); what = sold ? `a vândut ${sold.n} produse la magazin, +${sold.lei} lei` : 'a așteptat clienți (rafturile sunt goale)'; earned += sold?.lei ?? 0; }
    lines.push(`${R.icon} ${nm} ${what}`);
    keep.push(e);
  }
  setT(s, 'staff', keep);
  lines.push(`💰 Salarii −${wages} lei${earned ? ` · câștigat de angajați +${earned} lei` : ''}`);
  return lines;
}

// ====================================================================== MAGAZINUL DIN ORAS, CONTRACTELE, TARGUL (Capitolul 7)
export const SHOP_ITEMS: Record<string, { label: string; icon: string; price: number }> = {
  egg: { label: 'Ouă', icon: '🥚', price: 3 }, milk: { label: 'Lapte', icon: '🥛', price: 5 }, cheese: { label: 'Brânză', icon: '🧀', price: 18 },
  honey: { label: 'Miere', icon: '🍯', price: 16 }, wool: { label: 'Lână', icon: '🧶', price: 12 }, grain: { label: 'Grâu', icon: '🌾', price: 3 },
  corn: { label: 'Porumb', icon: '🌽', price: 4 }, sunseed: { label: 'Semințe de floarea-soarelui', icon: '🌻', price: 5 },
  tulip: { label: 'Lalele', icon: '🌷', price: 6 }, rose: { label: 'Trandafiri', icon: '🌹', price: 9 }, plank: { label: 'Scânduri', icon: '📏', price: 10 },
};
export function openLot(s: S) {
  if (s.chapter < SHOP_CHAPTER) { s.hud.toast('🏗️ Teren de vânzare. Magazinul vostru vine în Capitolul 7'); return; }
  if (!st(s, 'shopLot')) {
    s.choice('🏗️ Terenul din oraș', 'Aici poate fi magazinul vostru „Bubu & Dudu”, cu produsele de la fermă. Terenul costă 1500 de lei.', [
      ['🏗️', 'Cumpără terenul (1500 lei)', () => { if ((s.w.money ?? 0) < 1500) { s.hud.toast('Nu aveți destui bani'); Sfx.play('bad'); return; } s.op({ k: 'money', delta: -1500 }); s.op({ k: 'stat', key: 'shopLot', delta: 1 }); s.log('Ați cumpărat terenul din oraș 🏗️'); Sfx.play('good'); s.hud.toast('🏗️ Terenul e al vostru! Construiți magazinul: 30 scânduri, 20 pietre, 800 lei'); }],
      ['✖', 'Nu acum', () => {}]]);
    return;
  }
  if (!st(s, 'shopBuilt')) {
    const ok = res(s, 'plank') >= 30 && res(s, 'stone') >= 20 && (s.w.money ?? 0) >= 800;
    s.choice('🏪 Construiți magazinul', `Meșterii din sat construiesc magazinul „Bubu & Dudu”. Trebuie: 📏 30 scânduri (ai ${res(s, 'plank')}), 🪨 20 pietre (ai ${res(s, 'stone')}), 💰 800 lei.`, [
      ['🏪', ok ? 'Construiți!' : 'Încă vă lipsesc lucruri', () => { if (!ok) { Sfx.play('bad'); return; } s.op({ k: 'res', res: 'plank', delta: -30 }); s.op({ k: 'res', res: 'stone', delta: -20 }); s.op({ k: 'money', delta: -800 }); s.playScene('shopbuilt', true); }],
      ['✖', 'Mai târziu', () => {}]]);
    return;
  }
  openShop(s);
}
export function shopBuiltDone(s: S) { if (st(s, 'shopBuilt')) return; s.op({ k: 'stat', key: 'shopBuilt', delta: 1 }); s.log('S-a deschis magazinul „Bubu & Dudu” în oraș! 🏪💕'); s.syncPlaced(); }
const shopStock = (s: S): Record<string, number> => T(s, 'shopStock', {} as Record<string, number>);
/** vanzarile de peste zi ale magazinului (de pe rafturi) */
function shopSell(s: S, max: number): { n: number; lei: number } | null {
  const stock = shopStock(s); let n = 0, lei = 0; const mult = 1.5 + st(s, 'vitrina') * 0.15;
  for (const k of Object.keys(stock)) { while (stock[k] > 0 && n < max) { stock[k]--; n++; lei += Math.round((SHOP_ITEMS[k]?.price ?? 4) * mult); } }
  if (!n) return null;
  setT(s, 'shopStock', stock); s.op({ k: 'money', delta: lei }); s.op({ k: 'stat', key: 'shopSold', delta: n });
  return { n, lei };
}
export function openShop(s: S) {
  const stock = shopStock(s), total = Object.values(stock).reduce((a, b) => a + b, 0);
  const shelves = Object.entries(SHOP_ITEMS).map(([k, it]) => `<button data-stock="${k}" class="${res(s, k) ? '' : 'poor'}"><span>${it.icon}</span><b>${it.label}</b><small>pe raft ${stock[k] ?? 0} · ai ${res(s, k)} · ${Math.round(it.price * (1.5 + st(s, 'vitrina') * 0.15))} lei</small></button>`).join('');
  const vit = st(s, 'vitrina');
  const m = s.hud.modal(`<h3>🏪 Magazinul „Bubu & Dudu”</h3><p class="sub">Pe rafturi: ${total} produse. Se vând singure în fiecare zi (${6 + vit * 2} pe zi, mai multe cu vânzător angajat). Atinge un produs ca să pui 5 pe raft.</p>
    <div class="row2"><button data-vit>🪟 Vitrina (nivel ${vit}/3)${vit < 3 ? ` · ${10 + vit * 10} flori, ${150 + vit * 100} lei` : ''}</button><button data-contracts>📜 Contracte</button><button data-sell>🧾 Vinde acum</button></div>
    <div class="shop">${shelves}</div>`);
  m.querySelectorAll('[data-stock]').forEach(b => b.addEventListener('click', () => { const k = (b as HTMLElement).dataset.stock!, n = Math.min(5, res(s, k)); if (!n) { Sfx.play('bad'); return; } s.op({ k: 'res', res: k, delta: -n }); const st2 = shopStock(s); st2[k] = (st2[k] ?? 0) + n; setT(s, 'shopStock', st2); s.op({ k: 'stat', key: 'shopStocked', delta: n }); Sfx.play('cloth'); openShop(s); }));
  m.querySelector('[data-vit]')?.addEventListener('click', () => { const v = st(s, 'vitrina'); if (v >= 3) return; const fl = 10 + v * 10, lei = 150 + v * 100; if (catCount(s.w.res ?? {}, 'flower') < fl || (s.w.money ?? 0) < lei) { s.hud.toast(`🪟 Pentru vitrină: ${fl} flori și ${lei} lei`); Sfx.play('bad'); return; } take(s, FLOWERS, fl); s.op({ k: 'money', delta: -lei }); s.op({ k: 'stat', key: 'vitrina', delta: 1 }); s.me.actor.play('love'); Sfx.play('good'); s.hud.toast('🪟 Vitrina arată minunat: clienții plătesc mai mult'); openShop(s); });
  m.querySelector('[data-contracts]')?.addEventListener('click', () => openContracts(s));
  m.querySelector('[data-sell]')?.addEventListener('click', () => { const r = shopSell(s, 4 + vit * 2); s.hud.toast(r ? `🧾 Au intrat clienți: ${r.n} produse, +${r.lei} lei` : 'Rafturile sunt goale'); Sfx.play(r ? 'register' : 'bad'); openShop(s); });
}
interface Contract { idx: number; client: string; icon: string; need: Record<string, number>; pay: number }
const CLIENTS = [{ client: 'Restaurant La Doi', icon: '🍽️' }, { client: 'Cafeneaua', icon: '☕' }, { client: 'Supermarketul', icon: '🛒' }, { client: 'Hotelul Central', icon: '🏨' }];
export function contractsOf(s: S): Contract[] {
  const week = Math.floor((s.w.day - 1) / 7), r = mulberry(week * 7907 + 3), keys = ['egg', 'milk', 'cheese', 'honey', 'grain', 'corn', 'wool'];
  return [0, 1].map(idx => { const c = CLIENTS[Math.floor(r() * CLIENTS.length)], need: Record<string, number> = {}; for (let i = 0; i < 2; i++) { const k = keys[Math.floor(r() * keys.length)]; need[k] = (need[k] ?? 0) + (k === 'cheese' || k === 'honey' ? 3 : 8) + Math.floor(r() * 6); }
    const pay = Math.round(Object.entries(need).reduce((a, [k, n]) => a + (SHOP_ITEMS[k]?.price ?? 4) * n, 0) * 2.2 + 40); return { idx, ...c, need, pay }; });
}
export function openContracts(s: S) {
  const week = Math.floor((s.w.day - 1) / 7);
  const rows = contractsOf(s).map(c => { const done = st(s, `ctr-${week}-${c.idx}`) > 0, has = Object.entries(c.need).every(([k, n]) => res(s, k) >= n);
    return `<li class="${done ? 'done' : ''}"><b>${c.icon} ${c.client} · ${c.pay} lei</b><small>${Object.entries(c.need).map(([k, n]) => `${SHOP_ITEMS[k].icon} ${n} ${SHOP_ITEMS[k].label.toLowerCase()} (ai ${res(s, k)})`).join(' · ')}</small>${done ? '<small>✔ livrat săptămâna asta</small>' : `<button data-ctr="${c.idx}" ${has ? '' : 'disabled'}>🚚 Livrează</button>`}</li>`; }).join('');
  const m = s.hud.modal(`<h3>📜 Contractele săptămânii</h3><p class="sub">Restaurantele și magazinele din oraș cumpără marfa voastră, livrată cu camionul${st(s, 'truck') ? '' : ' (laptopul → Vehicule → Camionul)'}. Contracte noi în fiecare săptămână.</p><ul class="goals give">${rows}</ul>`);
  m.querySelectorAll('[data-ctr]').forEach(b => b.addEventListener('click', () => {
    if (!st(s, 'truck')) { s.hud.toast('🚚 Vă trebuie camionul (laptopul → Vehicule)'); Sfx.play('bad'); return; }
    const c = contractsOf(s)[+(b as HTMLElement).dataset.ctr!];
    for (const [k, n] of Object.entries(c.need)) s.op({ k: 'res', res: k, delta: -n });
    s.op({ k: 'stat', key: `ctr-${week}-${c.idx}`, delta: 1 }); s.hud.closeModal();
    s.pendingPay = c.pay; s.pendingClient = c.client; s.playScene('truck', false);
  }));
}
export function truckDone(s: S) { const lei = s.pendingPay ?? 0; if (!lei) return; s.op({ k: 'money', delta: lei }); s.op({ k: 'stat', key: 'contracts', delta: 1 }); s.log(`Dudu a livrat marfa la ${s.pendingClient ?? 'oraș'} cu camionul: +${lei} lei 🚚`); s.hud.toast(`🚚 Livrat! +${lei} lei`); s.pendingPay = 0; }
export function openFair(s: S) {
  if (s.chapter < SHOP_CHAPTER) { s.hud.toast('🎪 Târgul orașului: mai târziu în poveste'); return; }
  if (st(s, 'fairDone')) { s.hud.toast('🎪 Ați fost vedetele târgului! Mai e unul la anul 🙂'); return; }
  if (st(s, 'shopSold') < 30 || st(s, 'contracts') < 2) { s.hud.toast(`🎪 Târgul vă primește când magazinul a vândut 30 de produse (${st(s, 'shopSold')}) și ați livrat 2 contracte (${st(s, 'contracts')})`); return; }
  s.playScene('fair', true);
}
export function fairDone(s: S) { if (st(s, 'fairDone')) return; s.op({ k: 'stat', key: 'fairDone', delta: 1 }); s.op({ k: 'money', delta: 300 }); s.log('Standul „Bubu & Dudu” a fost vedeta târgului orașului! +300 lei 🎪'); }
/** supermarketul cumpara produsele de la ferma */
export function sellFarmCity(s: S) {
  let n = 0, lei = 0;
  for (const k of ['egg', 'milk', 'cheese', 'honey', 'wool', 'grain', 'corn', 'sunseed']) { const q = res(s, k); if (!q) continue; s.op({ k: 'res', res: k, delta: -q }); n += q; lei += Math.round(q * SHOP_ITEMS[k].price * 1.2); }
  if (!n) { s.hud.toast('N-aveți produse de la fermă (ouă, lapte, brânză, miere, lână, grâne)'); Sfx.play('bad'); return; }
  s.op({ k: 'money', delta: lei }); s.op({ k: 'stat', key: 'citySold', delta: n }); Sfx.play('register'); s.hud.toast(`🛒 Supermarketul a cumpărat ${n} produse: +${lei} lei`);
}

// ====================================================================== NUNTA (Capitolul 8)
export function buyRing(s: S) {
  if (s.chapter < WEDDING_CHAPTER) { s.hud.toast('💍 Bijuteriile… mai târziu în poveste 😉'); return; }
  if (st(s, 'ring')) { s.hud.toast('💍 Inelul e deja în buzunarul lui Dudu'); return; }
  if ((s.w.money ?? 0) < 800) { s.hud.toast('💍 Inelul de logodnă costă 800 de lei'); Sfx.play('bad'); return; }
  s.op({ k: 'money', delta: -800 }); s.op({ k: 'stat', key: 'ring', delta: 1 }); Sfx.play('chimes');
  s.hud.toast(s.myId === 'dudu' ? '💍 Ai cumpărat inelul! Acum alege locul: foișorul de la lac sau o bancă, cu Bubu lângă tine' : '💍 Ați cumpărat inelul… pentru Dudu 😉');
}
/** poti face cererea aici? (Dudu are inelul, Bubu e langa) */
export function canPropose(s: S) { return s.chapter >= WEDDING_CHAPTER && st(s, 'ring') > 0 && !st(s, 'engaged') && s.partnerClose(4); }
export function proposed(s: S) { if (st(s, 'engaged')) return; s.op({ k: 'stat', key: 'engaged', delta: 1 }); s.log('Dudu a cerut-o de soție pe Bubu. Ea a spus DA! 💍💖'); }
export function weddingMissing(s: S) {
  const miss: string[] = []; const own = (id: 'bubu' | 'dudu', it: string) => (((s.w.chars[id] as any).owned ?? []) as string[]).includes(it);
  if (!st(s, 'engaged')) miss.push('cererea în căsătorie'); if (!own('bubu', 'mireasa')) miss.push('rochia de mireasă'); if (!own('dudu', 'mire')) miss.push('costumul de mire');
  if (!st(s, 'weddingCake')) miss.push('tortul'); if (!st(s, 'weddingMusic')) miss.push('lăutarii'); if (st(s, 'invited') < 4) miss.push(`invitații (${st(s, 'invited')}/4)`);
  return miss;
}
export function openChurch(s: S) {
  if (s.chapter < WEDDING_CHAPTER || st(s, 'married')) { s.hud.toast(st(s, 'married') ? '💒 Aici v-ați cununat. Casă de piatră! 💕' : new Date().getDay() === 0 ? '⛪ E duminică: clopotele bat de sărbătoare 🔔' : '⛪ Biserica satului. Clopotele bat la 8, 12 și 18 🔔'); if (hasEvent(s, 'villwed')) villageWedding(s); return; }
  const miss = weddingMissing(s);
  if (miss.length) { s.hud.toast(`💒 Pentru nuntă mai lipsesc: ${miss.join(', ')}`); return; }
  s.choice('💒 Nunta noastră', 'Totul e gata: rochia, costumul, tortul, lăutarii, invitații. Începem?', [['💒', 'Da! Începe nunta', () => s.playScene('wedding', true)], ['✖', 'Încă puțin', () => {}]]);
}
export function weddingDone(s: S) { if (st(s, 'married')) return; s.op({ k: 'stat', key: 'married', delta: 1 }); s.log('Bubu și Dudu s-au căsătorit la biserica din sat! Casă de piatră! 💒💍💕'); }
export function hireMusic(s: S) { if (st(s, 'weddingMusic')) { s.hud.toast('🎻 Lăutarii sunt deja tocmiți'); return; } if ((s.w.money ?? 0) < 250) { s.hud.toast('🎻 Lăutarii cer 250 de lei'); Sfx.play('bad'); return; } s.op({ k: 'money', delta: -250 }); s.op({ k: 'stat', key: 'weddingMusic', delta: 1 }); Sfx.play('chimes'); s.hud.toast('🎻 Lăutarii vin la nuntă!'); }
export function buyCake(s: S) { if (st(s, 'weddingCake')) { s.hud.toast('🎂 Tortul e comandat'); return; } if ((s.w.money ?? 0) < 300) { s.hud.toast('🎂 Tortul de nuntă costă 300 de lei'); Sfx.play('bad'); return; } s.op({ k: 'money', delta: -300 }); s.op({ k: 'stat', key: 'weddingCake', delta: 1 }); Sfx.play('good'); s.hud.toast('🎂 Brutarul face cel mai frumos tort din sat!'); }
function villageWedding(s: S) { if (st(s, 'villwed-' + s.w.day)) return; s.op({ k: 'stat', key: 'villwed-' + s.w.day, delta: 1 }); for (const v of VILLAGERS) s.op({ k: 'stat', key: 'friend-' + v.id, delta: 1 }); s.hud.toast('💒 Ați fost la nunta Inei! Tot satul v-a îndrăgit (+1 prietenie cu toți)'); s.me.actor.play('dance_hop'); Sfx.play('bells'); }

// ====================================================================== PRIETENIILE PE 5 TREPTE
export const TIERS = [1, 4, 9, 15, 22];
export const TIER_NAMES: [string, string][] = [['Cunoscut', 'Cunoscută'], ['Prieten', 'Prietenă'], ['Bun prieten', 'Bună prietenă'], ['Prieten apropiat', 'Prietenă apropiată'], ['Prieten de suflet', 'Prietenă de suflet']];
const FEMALE = new Set(['leana', 'ina', 'rita', 'miti']);
export const tierOf = (s: S, vid: string) => TIERS.filter(t => st(s, 'friend-' + vid) >= t).length;
export const tierName = (vid: string, t: number) => t ? TIER_NAMES[t - 1][FEMALE.has(vid) ? 1 : 0] : FEMALE.has(vid) ? 'Necunoscută' : 'Necunoscut';
export const SECRETS: Record<string, string[]> = {
  leana: ['„Am crescut aici, pe vremea când satul era plin de copii.”', '„Rețeta mea de plăcintă? Mult dor și puțină scorțișoară.”', '„Bunicul vostru drag a construit primul pod. L-ați reparat ca el!”', '„Mi-e dor de nepoți… voi îmi țineți de urât.”', '„Vă las ceaunul meu fermecat: mămăliga iese mereu perfectă.”'],
  ina: ['„Visez să am o florărie ca a lui Bubu!”', '„Am un iubit la oraș… nu spuneți nimănui!”', '„Ne căsătorim primăvara, la biserica din sat!”', '„Vreau ca voi să fiți nașii noștri… într-o zi.”', '„Sunteți familia pe care mi-am dorit-o.”'],
  gogu: ['„Am fost tâmplar 40 de ani.”', '„Gardul meu e strâmb de 10 ani. Rușine!”', '„Am o rindea veche, de la tata. E cea mai bună.”', '„Dudu, ai mâini de aur. Ca mine la tinerețe.”', '„Rindeaua e a ta, Dudu. Fă lucruri frumoase cu ea.”'],
  miti: ['„Miau. Peștele e iubirea vieții mele.”', '„Știu un loc secret la lac unde mușcă știuca.”', '„Noaptea mă uit la stele de pe acoperișul Primăriei.”', '„Voi sunteți singurii care nu-mi furați peștele.”', '„Prr… v-am adus cel mai frumos pește al meu.”'],
  rita: ['„Croitoria e locul meu preferat.”', '„Am cusut eu perdelele de la Primărie!”', '„Vreau să plec la oraș… dar satul renaște, rămân!”', '„Bubu, îți cos eu voalul de mireasă dacă vrei.”', '„V-am cusut o pernuță cu B & D. Pentru casa voastră.”'],
  rex: ['„Ham! Știu fiecare uliță din sat.”', '„Am găsit odată o scrisoare pierdută de 20 de ani.”', '„Păzesc podul noaptea. Nimeni nu trece neobservat!”', '„Voi doi sunteți cei mai buni vecini.”', '„Ham! Vă păzesc casa cât timp sunteți la oraș.”'],
};
/** recompensa la fiecare treapta noua de prietenie */
export function checkFriend(s: S, vid: string) {
  const t = tierOf(s, vid), got = st(s, `ftier-${vid}`);
  if (t > got) { s.op({ k: 'stat', key: `ftier-${vid}`, delta: t - got }); const v = VILLAGERS.find(x => x.id === vid)!; s.op({ k: 'money', delta: 15 * t }); s.op({ k: 'hearts', delta: 3 * t });
    s.hud.toast(`💛 ${v.name}: acum ${tierName(vid, t).toLowerCase()} (${t}/5)! +${15 * t} lei. ${SECRETS[vid]?.[t - 1] ?? ''}`); Sfx.play('levelup'); }
}
export function inviteVillager(s: S, vid: string) {
  if (s.chapter < WEDDING_CHAPTER || !st(s, 'engaged')) { s.hud.toast('💌 Invitațiile se dau după cererea în căsătorie'); return; }
  if (st(s, 'invite-' + vid)) { s.hud.toast('💌 E deja invitat la nuntă'); return; }
  if (tierOf(s, vid) < 2) { s.hud.toast('💌 Invitați sătenii cu care sunteți măcar prieteni (treapta 2)'); return; }
  s.op({ k: 'stat', key: 'invite-' + vid, delta: 1 }); s.op({ k: 'stat', key: 'invited', delta: 1 }); Sfx.play('kiss'); s.hud.toast(`💌 ${VILLAGERS.find(v => v.id === vid)!.name}: „Vin cu mare drag!”`);
}

// ====================================================================== ALBUMELE
export const FISH_TYPES = [{ id: 'caras', name: 'Caras' }, { id: 'crap', name: 'Crap' }, { id: 'stiuca', name: 'Știucă' }, { id: 'pastrav', name: 'Păstrăv' }, { id: 'somn', name: 'Somn' }, { id: 'biban', name: 'Biban' }];
interface AlbumDef { id: string; name: string; icon: string; items: { id: string; name: string; got: boolean }[] }
export function albums(s: S): AlbumDef[] {
  const owned = new Set([...(((s.w.chars.bubu as any).owned ?? []) as string[]), ...(((s.w.chars.dudu as any).owned ?? []) as string[])]);
  return [
    { id: 'fish', name: 'Pești', icon: '🐟', items: FISH_TYPES.map(f => ({ id: f.id, name: f.name, got: st(s, 'fish-' + f.id) > 0 })) },
    { id: 'flowers', name: 'Flori', icon: '🌸', items: [{ id: 'flower', name: 'Flori de câmp', got: st(s, 'flowerTotal') > 0 }, ...['tulip', 'rose', 'sunflower'].map(c => ({ id: c, name: { tulip: 'Lalele', rose: 'Trandafiri', sunflower: 'Floarea-soarelui' }[c]!, got: st(s, 'harv-' + c) > 0 }))] },
    { id: 'recipes', name: 'Rețete', icon: '🍲', items: RECIPES.map(r => ({ id: r.id, name: r.name, got: st(s, 'cooked_' + r.id) > 0 })) },
    { id: 'clothes', name: 'Haine', icon: '👗', items: ITEMS.map(i => ({ id: i.id, name: i.label, got: owned.has(i.id) })) },
  ];
}
export function openAlbums(s: S) {
  const html = albums(s).map(a => { const n = a.items.filter(i => i.got).length, done = n === a.items.length, claimed = st(s, 'album-' + a.id) > 0;
    return `<h4>${a.icon} ${a.name} · ${n}/${a.items.length}${done ? (claimed ? ' ✅' : ` <button data-alb="${a.id}">🎁 Ia premiul</button>`) : ''}</h4><div class="album">${a.items.map(i => `<span class="${i.got ? 'got' : ''}">${i.got ? '✔' : '?'} ${i.got ? esc(i.name) : '???'}</span>`).join('')}</div>`; }).join('');
  const m = s.hud.modal(`<h3>📒 Albumele voastre</h3><p class="sub">Strângeți tot: fiecare album complet aduce 150 de lei și 20 💗.</p>${html}`);
  m.querySelectorAll('[data-alb]').forEach(b => b.addEventListener('click', () => { const id = (b as HTMLElement).dataset.alb!; if (st(s, 'album-' + id)) return; s.op({ k: 'stat', key: 'album-' + id, delta: 1 }); s.op({ k: 'money', delta: 150 }); s.op({ k: 'hearts', delta: 20 }); Sfx.play('victory'); openAlbums(s); }));
}

// ====================================================================== ZIUA NOUA (dimineata, pe gazda) + PRIMARIA
export function daily(s: S) {
  if (!s.isHost) return;
  const day = s.w.day; if (st(s, 'storyDay') === day) return;
  const first = !st(s, 'storyDay'); s.op({ k: 'stat', key: 'storyDay', delta: day - st(s, 'storyDay') });
  if (first) return;
  const lines = staffDay(s);
  // vanzarile magazinului fara vanzator
  if (st(s, 'shopBuilt') && !staffOf(s).some(e => e.role === 'shop')) { const r = shopSell(s, 6 + st(s, 'vitrina') * 2); if (r) lines.push(`🏪 Magazinul „Bubu & Dudu” a vândut ${r.n} produse: +${r.lei} lei`); }
  // evenimentele zilei
  const ev = eventsOf(day);
  for (const e of ev) {
    if (e.id === 'martisor' || e.id === 'dragobete') for (const id of ['bubu', 'dudu'] as const) s.op({ k: 'need', who: id, need: 'love', delta: 25 });
    if (e.id === 'paste') { s.op({ k: 'res', res: 'egg', delta: 6 }); }
    if (e.id === 'craciun') { s.op({ k: 'money', delta: 100 }); s.op({ k: 'res', res: 'meals', delta: 4 }); }
    if (e.id === 'grandparents') { s.op({ k: 'money', delta: 80 }); s.op({ k: 'res', res: 'meals', delta: 3 }); }
    if (e.id === 'storm') s.op({ k: 'furn', key: 'roofBroken', value: true });
  }
  const se = seasonOf(day);
  const card = [`${se.icon} ${se.name}, ziua ${dayOfSeason(day)}`, ...ev.map(e => `${e.icon} ${e.name}: ${e.text}`), ...lines, ...todo(s)];
  s.hud.showLog(card, '☀️ Bună dimineața!');
}
/** ce e de facut azi pentru fiecare (ca sa nu ramaneti fara treaba) */
function todo(s: S): string[] {
  const b: string[] = [], d: string[] = [];
  if (st(s, 'hens') && ready(s, 'hens')) b.push('strânge ouăle');
  if (st(s, 'cows') && ready(s, 'cows')) b.push('mulge vaca');
  if (st(s, 'florarie')) b.push('deschide florăria'); else if (!s.w.furn.standBroken) b.push('vinde la tarabă');
  if (s.chapter >= 1) d.push('livrează comanda de la cherestea');
  const fp = Object.values(parcelsOf(s)); if (fp.some(p => p.stage === 'ripe')) d.push('recoltează câmpul copt'); else if (fp.some(p => p.owned && p.stage !== 'sown')) d.push('lucrează parcelele');
  if (s.w.furn.roofBroken) d.push('repară acoperișul după furtună');
  if (s.chapter >= VILLAGE_CHAPTER && PROJECTS.some(p => !projectDone(s, p.id))) b.push('contribuie la un proiect al satului');
  return [b.length ? `🐼 Bubu azi: ${b.slice(0, 3).join(', ')}` : '', d.length ? `🐻 Dudu azi: ${d.slice(0, 3).join(', ')}` : ''].filter(Boolean);
}
/** Primaria: afacerile (vechi), proiectele satului, oamenii de munca, nunta */
export function openHallMenu(s: S) {
  const opts: [string, string, () => void][] = [['🏛️', 'Afacerile satului (florăria, tâmplăria)', () => s.hud.openHall()]];
  if (s.chapter >= VILLAGE_CHAPTER) opts.push(['📋', `Proiectele satului (${st(s, 'projectsDone')}/${PROJECTS.length})`, () => openProjects(s)]);
  if (s.chapter >= FARM_CHAPTER) opts.push(['🧑‍🌾', `Oameni de muncă (${staffOf(s).length})`, () => openStaff(s)]);
  if (s.chapter >= WEDDING_CHAPTER) opts.push(['🎻', 'Nunta: lăutarii (250 lei)', () => hireMusic(s)]);
  s.choice('🏛️ Primăria', 'Ce faceți azi la Primărie?', opts);
}
/** acoperisul stricat de furtuna (actiune la casa) */
export function fixRoof(s: S) {
  if (res(s, 'wood') < 5 || res(s, 'plank') < 2) { s.hud.toast('🔨 Pentru acoperiș: 5 lemne și 2 scânduri'); Sfx.play('bad'); return; }
  s.op({ k: 'res', res: 'wood', delta: -5 }); s.op({ k: 'res', res: 'plank', delta: -2 }); s.op({ k: 'furn', key: 'roofBroken', value: false }); s.op({ k: 'hearts', delta: 5 });
  s.me.actor.play('act_scrub'); Sfx.play('hammer'); s.hud.toast(`🔨 ${g(s.myId, 'Ai reparat', 'Ai reparat')} acoperișul! Casa e din nou caldă`);
}

// ====================================================================== OBIECTELE DIN LUME (ferma, parcelele, magazinul, standul de la targ)
export const FARM = { gate: { gx: 24, gy: 13 }, coop: { gx: 26, gy: 5 }, hens: { gx: 26, gy: 8 }, shed: { gx: 31, gy: 4 }, cow: { gx: 32, gy: 8 }, pen: { x0: 37, y0: 4, x1: 43, y1: 10 }, hives: { gx: 27, gy: 0 } };
export function place(s: S, push: (f: Furn) => void) {
  if (s.chapter >= FARM_CHAPTER) {
    push({ id: 'st-farmgate', type: 'signpost' as any, gx: FARM.gate.gx, gy: FARM.gate.gy, w: 1, d: 1, solid: true, action: { id: 'st-farm', label: 'Ferma voastră (animale)', icon: '🐔' } });
    push({ id: 'st-fields', type: 'signpost' as any, gx: 16, gy: 27, w: 1, d: 1, solid: true, action: { id: 'st-fieldsign', label: 'Câmpurile de vânzare', icon: '🟫' } });
    if (st(s, 'hens')) { push({ id: 'st-coop', type: 'coop' as any, gx: FARM.coop.gx, gy: FARM.coop.gy, w: 3, d: 2, solid: true, action: { id: 'st-hens', label: 'Strânge ouăle', icon: '🥚' } }); push({ id: 'st-henyard', type: 'hens' as any, gx: FARM.hens.gx, gy: FARM.hens.gy, w: 3, d: 2, solid: false }); }
    if (st(s, 'cows')) { push({ id: 'st-shed', type: 'cowshed' as any, gx: FARM.shed.gx, gy: FARM.shed.gy, w: 4, d: 3, solid: true, action: { id: 'st-cheese', label: 'Fă brânză (3 lapte)', icon: '🧀' } }); push({ id: 'st-cow', type: 'cow' as any, gx: FARM.cow.gx, gy: FARM.cow.gy, w: 1, d: 1, solid: true, action: { id: 'st-cows', label: 'Mulge vaca', icon: '🥛' } }); }
    if (st(s, 'sheep')) { const P = FARM.pen; push({ id: 'st-pen-n', type: 'fenceline' as any, gx: P.x0 - 0.5, gy: P.y0 - 0.55, w: P.x1 - P.x0 + 1, d: 0.1, solid: true }); push({ id: 'st-pen-s', type: 'fenceline' as any, gx: P.x0 - 0.5, gy: P.y1 - 0.45, w: P.x1 - P.x0 + 1, d: 0.1, solid: true });
      for (let i = 0; i < st(s, 'sheep'); i++) push({ id: 'st-sheep' + i, type: 'sheep' as any, gx: P.x0 + 1 + i * 1.3, gy: P.y0 + 1.5 + (i % 2) * 2, w: 1, d: 1, solid: false, ...(i === 0 ? { action: { id: 'st-sheep', label: 'Tunde oile', icon: '🧶' } } : {}) }); }
    for (let i = 0; i < st(s, 'hives'); i++) push({ id: 'st-hive' + i, type: 'beehive' as any, gx: FARM.hives.gx + i * 1.6, gy: FARM.hives.gy, w: 1, d: 1, solid: true, action: { id: 'st-hives', label: 'Strânge mierea', icon: '🍯' } });
  }
  // furtuna: acoperisul de reparat
  if (s.w.furn.roofBroken) push({ id: 'st-roof', type: 'roofdamage' as any, gx: 8, gy: 12.4, w: 1, d: 1, solid: false, action: { id: 'st-roof', label: 'Repară acoperișul (5 lemne, 2 scânduri)', icon: '🔨' } });
  // magazinul din oras
  if (st(s, 'shopBuilt')) {
    if (!CITY_BUILDINGS.some(b => b.id === 'c-ourshop')) CITY_BUILDINGS.push({ id: 'c-ourshop', gx: 230, gy: 30, w: 8, d: 7, h: 96, floors: 3, front: 'y', wall: '#fff0f5', trim: '#ff7aa2', sign: 'Bubu & Dudu', signCol: '#ff4d8d', awning: '#ff9ab8', action: { id: 'st-shop', label: 'Magazinul „Bubu & Dudu”', icon: '🏪' } });
    push({ id: 'c-ourshop', type: 'cbuilding' as any, gx: 230, gy: 30, w: 8, d: 7, solid: true, action: { id: 'st-shop', label: 'Magazinul „Bubu & Dudu”', icon: '🏪' } });
  }
  if (s.chapter >= SHOP_CHAPTER && !st(s, 'fairDone')) push({ id: 'st-fair', type: 'fairstand' as any, gx: 222, gy: 32, w: 2, d: 1, solid: true, action: { id: 'st-fair', label: 'Târgul orașului', icon: '🎪' } });
}
/** cheia pentru imaginile gata desenate (cand se schimba, se redeseneaza) */
export function storyKey(s: S) { const p = parcelsOf(s); return `${s.chapter}|${st(s, 'projectsDone')}|${Object.entries(p).map(([k, v]) => k + v.stage + Math.floor(v.prog * 4) + (v.crop ?? '')).join(',')}|${st(s, 'shopBuilt')}|${st(s, 'bridgeFixed')}`; }

/** actiunile noi (id-uri cu prefixul st-) */
export function action(s: S, id: string, f: Furn) {
  switch (id) {
    case 'st-bridge': openBridge(s); break;
    case 'st-farm': openFarmGate(s); break;
    case 'st-fieldsign': s.hud.toast(s.chapter >= FARM_CHAPTER ? '🟫 Atingeți o parcelă ca s-o cumpărați (300-500 lei). Utilajele: laptopul → Utilaje' : '🌾 Câmpurile vecinilor'); break;
    case 'st-parcel': openParcel(s, f.id); break;
    case 'st-hens': collect(s, 'hens'); break;
    case 'st-cows': collect(s, 'cows'); break;
    case 'st-sheep': collect(s, 'sheep'); break;
    case 'st-hives': collect(s, 'hives'); break;
    case 'st-cheese': makeCheese(s); break;
    case 'st-roof': fixRoof(s); break;
    case 'st-lot': openLot(s); break;
    case 'st-shop': openShop(s); break;
    case 'st-fair': openFair(s); break;
  }
}

// ====================================================================== bucla (o data pe secunda de joc)
let acc = 0, lastMin = -1;
export function tick(s: S, dt: number) {
  acc += dt; if (acc < 1) return; acc = 0;
  const gm = s.w.gameMin ?? 0;
  if (lastMin >= 0 && s.isHost && gm > lastMin) growFields(s, Math.min(120, gm - lastMin));
  lastMin = gm;
  // a crescut prietenia cu un satean?
  for (const v of VILLAGERS) if (tierOf(s, v.id) > st(s, `ftier-${v.id}`)) { checkFriend(s, v.id); break; }
  (globalThis as any).__abandoned = abandonedHouses(s);
  (globalThis as any).__vclosed = new Set(PROJECTS.filter(p => !projectDone(s, p.id) && s.chapter <= VILLAGE_CHAPTER + 9).flatMap(p => p.opens));
  (globalThis as any).__parcels = parcelsOf(s);
  (globalThis as any).__season = seasonOf(s.w.day).id;
  (globalThis as any).__lights = projectDone(s, 'lights') || s.chapter < VILLAGE_CHAPTER;
}
export { catPick, CITY_CHAPTER };
