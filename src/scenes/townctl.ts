// Logica pentru sat si oras: ture de munca, cursuri, banca, cererile satenilor, magazine cu interior,
// dispensar/spital, mobila apartamentului. Apelata din WorldScene.
import type { WorldScene } from './world';
import { Sfx } from '../engine/sfx';
import { g } from '../game/gender';
import { JOBS, LEVEL_NAMES, LEVEL_NEED, COURSES, VILLAGERS, DECOR, APT_PRICE, APT_DOWN, LOAN_RATE, LOAN_DAYS, APT_BILLS,
  jobBlock, jobPay, jobLevel, jobXp, jobKey, hasDiploma, makeQuests, reputation, repLevel, villageBonus, isMarketDay, bankOf, type Quest, type Bank } from '../game/town';
import { SHOP_SELL, SHOP_BUY, SHOP_CITY, INV_INFO, PRICE } from '../game/economy';
import { RES_INFO } from '../world/build';
import type { ShopEntry, ShopConfig } from '../minigames/towngames';

const st = (s: WorldScene, k: string) => s.w.stats[k] ?? 0;
const setStat = (s: WorldScene, k: string, v: number) => { const d = v - st(s, k); if (d) s.op({ k: 'stat', key: k, delta: d }); };
const resName = (id: string) => (INV_INFO[id]?.label ?? (RES_INFO as any)[id]?.label ?? id);
const resIcon = (id: string) => (INV_INFO[id]?.icon ?? (RES_INFO as any)[id]?.icon ?? '📦');
export const SELL_PRICE: Record<string, number> = Object.fromEntries([...SHOP_SELL.map(i => [i.id, i.price]), ['meals', 10]]);

// ------------------------------------------------------------------ joburi
export function startJob(s: WorldScene, id: string) {
  const job = JOBS[id]; if (!job) return;
  const why = jobBlock(s.w, job, s.myId, s.w.chars[s.myId].needs.energy, s.myId === 'bubu');
  if (why) { s.hud.toast(why); Sfx.play('bad'); return; }
  s.jobCtx = { id };
  s.startCustom(job.mini);
}
/** apelat de minijocul turei: plateste, creste experienta, promoveaza; intoarce textul de final */
export function finishJob(s: WorldScene, perf: number, detail: string): string {
  const ctx = s.jobCtx; s.jobCtx = null;
  if (!ctx) return detail; // jucat de proba (ex. din test), fara plata
  const job = JOBS[ctx.id], who = s.myId, fem = who === 'bubu';
  const pay = jobPay(s.w, job, who, perf);
  s.op({ k: 'money', delta: pay });
  setStat(s, jobKey(job.id, who, 'day'), s.w.day);
  s.op({ k: 'stat', key: jobKey(job.id, who, 'shifts'), delta: 1 });
  s.op({ k: 'stat', key: job.place === 'city' ? 'cityEarned' : 'villageEarned', delta: pay });
  s.op({ k: 'stat', key: job.id === 'cafe' ? 'cafeShifts' : job.id === 'office' ? 'officeShifts' : `${job.id}Shifts`, delta: 1 });
  s.op({ k: 'need', who, need: 'energy', delta: -job.energy }); s.op({ k: 'need', who, need: 'hunger', delta: -8 });
  let promo = '';
  const lvl = jobLevel(s.w, job.id, who);
  if (perf >= 0.7 && lvl < 3) {
    s.op({ k: 'stat', key: jobKey(job.id, who, 'xp'), delta: 1 });
    if (jobXp(s.w, job.id, who) >= LEVEL_NEED[lvl]) {
      s.op({ k: 'stat', key: jobKey(job.id, who, 'lvl'), delta: 1 }); setStat(s, jobKey(job.id, who, 'xp'), 0);
      promo = ` · ⭐ ${fem ? 'Promovată' : 'Promovat'}: ${LEVEL_NAMES[lvl + 1][fem ? 1 : 0]}!`;
      setTimeout(() => { Sfx.play('levelup'); Sfx.play('applause', { vol: 0.5, delay: 0.4 }); }, 900);
      s.log(`${s.me.actor.spec.name} a fost ${fem ? 'promovată' : 'promovat'} la ${job.name[fem ? 1 : 0].toLowerCase()}: ${LEVEL_NAMES[lvl + 1][fem ? 1 : 0]} ⭐`);
    }
  }
  s.log(`${s.me.actor.spec.name} a lucrat o tură ca ${job.name[fem ? 1 : 0].toLowerCase()}: +${pay} lei ${job.icon}`);
  return `${detail} · +${pay} lei${promo}`;
}

// ------------------------------------------------------------------ universitatea
export function startCourse(s: WorldScene, id: string) {
  const c = COURSES[id]; if (!c) return;
  if (hasDiploma(s.w, id, s.myId)) { s.hud.toast(`🎓 Ai deja ${c.name.toLowerCase()}`); return; }
  const paid = st(s, `paid-${id}-${s.myId}`) > 0;
  if (!paid) {
    if ((s.w.money ?? 0) < c.price) { s.hud.toast(`🎓 ${c.name} costă ${c.price} lei`); Sfx.play('bad'); return; }
    s.op({ k: 'money', delta: -c.price }); s.op({ k: 'stat', key: `paid-${id}-${s.myId}`, delta: 1 }); Sfx.play('coin');
  }
  s.courseId = id; s.startCustom('course');
}
export function finishCourse(s: WorldScene, id: string, pass: boolean, good: number): string {
  const c = COURSES[id];
  if (pass) {
    s.op({ k: 'stat', key: `dipl-${id}-${s.myId}`, delta: 1 }); s.op({ k: 'stat', key: 'diplomas', delta: 1 });
    s.log(`${s.me.actor.spec.name} a absolvit ${c.name.toLowerCase()} 🎓`);
    return `🎓 Diplomă! ${good}/4 corecte`;
  }
  return `${good}/4 · mai încearcă (gratuit) 📚`;
}

// ------------------------------------------------------------------ magazine cu interior
export function openShop(s: WorldScene, cfg: ShopConfig) { s.shopCfg = cfg; s.startCustom('shop'); }
function buyEntry(s: WorldScene, it: { id?: string; label: string; icon: string; price: number; give: Record<string, number> }, disc = 0): ShopEntry {
  const price = Math.max(1, Math.round(it.price * (1 - disc)));
  // semintele: desenul plantei + un saculet de seminte mic
  const seed = it.id?.startsWith('seed_') ? it.id.slice(5) : '';
  return { icon: seed ? (INV_INFO[seed]?.icon ?? it.icon) : it.icon, badge: seed ? '🌰' : undefined, name: it.label, price, note: disc ? `-${Math.round(disc * 100)}% vecinilor` : undefined, buy: () => {
    if ((s.w.money ?? 0) < price) return 'Nu ajung banii 💰';
    s.op({ k: 'money', delta: -price }); for (const [k, n] of Object.entries(it.give)) s.op({ k: 'res', res: k, delta: n });
    return null;
  } };
}
export function villageGrocery(s: WorldScene) {
  const d = villageBonus(s.w);
  openShop(s, { title: '🛒 Magazinul satului', wall: '#fff1d6', floor: '#d9b48a', keeper: 'granny', hello: d ? `Vă fac reducere, vecinilor dragi! 💕` : 'Bună ziua! Ce vă dau azi?', items: SHOP_BUY.map(i => buyEntry(s, i, d)) });
}
export function citySuper(s: WorldScene) {
  openShop(s, { title: '🛒 Supermarketul', wall: '#e7f6e2', floor: '#cfd8dc', keeper: 'cat', hello: 'Bun venit! Avem de toate 🛒', items: SHOP_CITY.map(i => buyEntry(s, i)) });
}
export function villageMarket(s: WorldScene) {
  const bonus = villageBonus(s.w) + (isMarketDay(s.w) ? 0.4 : 0);
  const r = s.w.res ?? {};
  // piata se "satura": dupa cateva bucati din acelasi lucru intr-o zi, vanzatorul plateste mai putin, apoi deloc
  const soldKey = (id: string) => `sold-${s.w.day}-${id}`;
  const unit = (i: (typeof SHOP_SELL)[number]) => { const n = s.w.stats[soldKey(i.id)] ?? 0; if (n >= PRICE.marketFull * 2) return 0; return Math.max(1, Math.round(i.price * (1 + bonus) * (n >= PRICE.marketFull ? 0.5 : 1))); };
  const items: ShopEntry[] = SHOP_SELL.filter(i => (r[i.id] ?? 0) > 0).map(i => {
    const price = unit(i);
    return { icon: i.icon, name: `${i.label} (ai ${r[i.id] ?? 0})${price === 0 ? ' · gata pe azi' : (s.w.stats[soldKey(i.id)] ?? 0) >= PRICE.marketFull ? ' · preț redus' : ''}`, price, buy: () => {
      if ((s.w.res?.[i.id] ?? 0) < 1) return 'Nu mai ai 🙂';
      const p = unit(i); if (p === 0) return 'Azi nu mai cumpăr de-astea, am destule! Mâine 🙂';
      s.op({ k: 'res', res: i.id, delta: -1 }); s.op({ k: 'money', delta: p }); s.op({ k: 'stat', key: 'marketSold', delta: 1 }); s.op({ k: 'stat', key: soldKey(i.id), delta: 1 }); return null;
    } };
  });
  openShop(s, { title: isMarketDay(s.w) ? '🎪 Târgul de duminică!' : '💱 Piața satului', wall: '#ffe9c9', floor: '#c9a678', keeper: 'pig', sell: true,
    hello: isMarketDay(s.w) ? 'E zi de târg: plătesc cu 40% mai mult! 🎉' : items.length ? 'Ce-mi vindeți azi?' : 'N-aveți nimic de vândut… adunați din grădină și pădure!', items,
    footer: `Duminica e târg: prețuri mai mari · după ${PRICE.marketFull} bucăți din același lucru pe zi, prețul scade` });
}
export function villageBakeryShop(s: WorldScene) {
  const d = villageBonus(s.w);
  const items: { label: string; icon: string; price: number; give: Record<string, number> }[] = [
    { label: 'Pâine caldă (x2 porții)', icon: '🍞', price: 16, give: { meals: 2 } },
    { label: 'Covrigi (x1 porție)', icon: '🥨', price: 7, give: { meals: 1 } },
    { label: 'Cozonac (x3 porții)', icon: '🍰', price: 26, give: { meals: 3 } },
    { label: 'Sac de făină (x3)', icon: '🥡', price: 14, give: { flour: 3 } },
  ];
  openShop(s, { title: '🥖 Brutăria', wall: '#fff3e0', floor: '#d9a05a', keeper: 'dog', hello: 'Pâine caldă, abia scoasă! 🍞', items: items.map(i => buyEntry(s, i, d)) });
}
export function pharmacy(s: WorldScene, city: boolean) {
  const items: ShopEntry[] = [
    { icon: '🍵', name: 'Ceai de tei (căldură +, sănătate +)', price: city ? 14 : 10, buy: () => { if ((s.w.money ?? 0) < (city ? 14 : 10)) return 'Nu ajung banii 💰'; s.op({ k: 'money', delta: -(city ? 14 : 10) }); s.op({ k: 'need', who: s.myId, need: 'warmth', delta: 20 }); s.op({ k: 'need', who: s.myId, need: 'health', delta: 10 }); return null; } },
    { icon: '💊', name: 'Vitamine (sănătate ++)', price: city ? 30 : 24, buy: () => { const p = city ? 30 : 24; if ((s.w.money ?? 0) < p) return 'Nu ajung banii 💰'; s.op({ k: 'money', delta: -p }); s.op({ k: 'need', who: s.myId, need: 'health', delta: 30 }); return null; } },
    { icon: '🩹', name: 'Trusă de prim ajutor (vindecă o boală)', price: city ? 50 : 40, buy: () => cure(s, city ? 50 : 40) },
  ];
  openShop(s, { title: city ? '🏥 Farmacia spitalului' : '💊 Farmacia satului', wall: '#e8f7f0', floor: '#cfe8dc', keeper: city ? 'fox' : 'bunny', hello: 'Sănătate multă! Cu ce vă ajut?', items });
}
/** vindeca boala (ta sau a partenerului, daca e langa tine) */
export function cure(s: WorldScene, price: number): string | null {
  const who = s.w.chars[s.myId].sick ? s.myId : s.sameArea() && s.w.chars[s.partner.id].sick ? s.partner.id : null;
  if (!who) return 'Sunteți sănătoși tun! 💪';
  if ((s.w.money ?? 0) < price) return 'Nu ajung banii 💰';
  s.op({ k: 'money', delta: -price }); s.op({ k: 'sick', who, value: null }); s.op({ k: 'need', who, need: 'health', delta: 45 });
  s.log(`${who === 'bubu' ? 'Bubu' : 'Dudu'} s-a vindecat la doctor 🩺`);
  return null;
}
export function cityMall(s: WorldScene) {
  const owned = (s.w.town?.decor as string[] | undefined) ?? [];
  const items: ShopEntry[] = DECOR.map(d => ({ icon: d.icon, name: d.label, price: d.price, note: owned.includes(d.id) ? 'îl aveți ✔' : d.desc, disabled: owned.includes(d.id), buy: () => {
    if (!st(s, 'apartment')) return 'Întâi cumpărați un apartament 🏙️';
    const cur = (s.w.town?.decor as string[] | undefined) ?? [];
    if (cur.includes(d.id)) return 'Îl aveți deja 🙂';
    if ((s.w.money ?? 0) < d.price) return 'Nu ajung banii 💰';
    s.op({ k: 'money', delta: -d.price }); s.op({ k: 'town', key: 'decor', value: [...cur, d.id] }); s.op({ k: 'stat', key: 'decorBought', delta: 1 });
    s.log(`Ați cumpărat ${d.label.toLowerCase()} pentru apartament ${d.icon}`);
    return null;
  } }));
  openShop(s, { title: '🏬 Mall-ul orașului', wall: '#f3ecff', floor: '#dcd3ea', keeper: 'fox', hello: 'Mobilă și decor pentru apartamentul vostru! ✨', items, footer: 'Ce cumpărați apare în apartament' });
}

// ------------------------------------------------------------------ cererile satenilor (avizierul + discutii)
export function questsToday(s: WorldScene): Quest[] {
  const q = s.w.town?.quests as Quest[] | undefined;
  if (q && q.length && q[0].day === s.w.day) return q;
  const fresh = makeQuests(s.w, SELL_PRICE);
  if (s.isHost) s.op({ k: 'town', key: 'quests', value: fresh });
  return fresh;
}
export function deliverQuest(s: WorldScene, q: Quest): string | null {
  const have = s.w.res?.[q.res] ?? 0;
  if (q.done) return 'E deja gata 🙂';
  if (have < q.qty) return `Îți mai trebuie ${q.qty - have} × ${resName(q.res).toLowerCase()}`;
  s.op({ k: 'res', res: q.res, delta: -q.qty }); s.op({ k: 'money', delta: q.pay });
  s.op({ k: 'stat', key: 'friend-' + q.who, delta: 1 }); s.op({ k: 'stat', key: 'questsDone', delta: 1 }); s.op({ k: 'hearts', delta: 2 });
  const list = questsToday(s).map(x => x.id === q.id ? { ...x, done: true } : x);
  s.op({ k: 'town', key: 'quests', value: list });
  const v = VILLAGERS.find(v => v.id === q.who)!;
  s.log(`${v.name} vă mulțumește pentru ${q.qty} × ${resName(q.res).toLowerCase()}: +${q.pay} lei 💕`);
  Sfx.play('coin'); return null;
}
export const questText = (q: Quest) => `${q.qty} × ${resIcon(q.res)} ${resName(q.res)}`;

// ------------------------------------------------------------------ banca
export function setBank(s: WorldScene, b: Bank) { s.op({ k: 'town', key: 'bank', value: b }); }
export function buyApartment(s: WorldScene, mode: 'cash' | 'loan'): string | null {
  if (st(s, 'apartment')) return 'Aveți deja apartamentul 🔑';
  const m = s.w.money ?? 0; const b = bankOf(s.w);
  if (mode === 'cash') { if (m < APT_PRICE) return `Vă mai trebuie ${APT_PRICE - m} lei`; s.op({ k: 'money', delta: -APT_PRICE }); }
  else {
    if (b.loanLeft > 0) return 'Aveți deja un credit';
    if (m < APT_DOWN) return `Avansul e ${APT_DOWN} lei (vă mai trebuie ${APT_DOWN - m})`;
    s.op({ k: 'money', delta: -APT_DOWN }); setBank(s, { ...b, loanLeft: LOAN_RATE * LOAN_DAYS });
  }
  s.op({ k: 'stat', key: 'apartment', delta: 1 });
  s.log(mode === 'cash' ? 'Ați cumpărat un apartament la oraș! 🔑🏙️' : `Ați cumpărat apartamentul cu credit: rata e ${LOAN_RATE} lei/zi 🏦🔑`);
  Sfx.play('good'); return null;
}

/** dimineata (o data pe zi, de gazda): dobanda, rata, facturile, cererile noi */
export function dailyTick(s: WorldScene) {
  if (!s.isHost) return;
  const day = s.w.day; if (st(s, 'lastDay') === day) return;
  const first = !st(s, 'lastDay');
  setStat(s, 'lastDay', day);
  // stergem contoarele zilnice vechi (vanzari la piata, cherestea, tamplarie) ca salvarea sa nu creasca
  for (const k of Object.keys(s.w.stats)) { const m = /^(sold|woodSold|crafted)-(\d+)/.exec(k); if (m && +m[2] < day - 1) delete s.w.stats[k]; }
  if (first) return;
  const msgs: string[] = [];
  const b = bankOf(s.w); let money = s.w.money ?? 0;
  if (b.savings > 0) { const it = Math.max(1, Math.round(Math.min(b.savings, 3000) * 0.02)); b.savings += it; msgs.push(`🏦 Dobândă: +${it} lei la economii`); }
  if (b.loanLeft > 0) {
    const rate = Math.min(LOAN_RATE, b.loanLeft);
    if (money >= rate) { s.op({ k: 'money', delta: -rate }); money -= rate; b.loanLeft -= rate; msgs.push(b.loanLeft > 0 ? `🏦 Rata apartamentului: -${rate} lei (mai aveți ${Math.ceil(b.loanLeft / LOAN_RATE)} rate)` : '🎉 Ați terminat de plătit apartamentul!'); if (b.loanLeft <= 0) { b.late = 0; s.op({ k: 'stat', key: 'loanPaid', delta: 1 }); } }
    else if (b.savings >= rate) { b.savings -= rate; b.loanLeft -= rate; msgs.push(`🏦 Rata (${rate} lei) s-a luat din economii`); }
    else { b.late += 1; b.loanLeft += 10; msgs.push(`⚠️ Rată neplătită! Penalizare 10 lei. Munciți la oraș sau vindeți la piață`); }
  }
  setBank(s, b);
  if (st(s, 'apartment')) { const bill = Math.min(money, APT_BILLS); if (bill) s.op({ k: 'money', delta: -bill }); msgs.push(`💡 Facturi apartament: -${bill} lei`); }
  questsToday(s);
  if (isMarketDay(s.w)) msgs.push('🎪 Azi e zi de târg în sat: piața plătește +40%!');
  msgs.forEach((m, i) => setTimeout(() => s.hud.toast(m), 1200 + i * 900));
}

export { reputation, repLevel, villageBonus, isMarketDay, bankOf, JOBS, COURSES, VILLAGERS, LEVEL_NAMES, LEVEL_NEED, jobLevel, jobXp, hasDiploma, APT_PRICE, APT_DOWN, LOAN_RATE, LOAN_DAYS, APT_BILLS, g };
