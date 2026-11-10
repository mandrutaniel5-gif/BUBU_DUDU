// Sarbatorile (1.11.0): fiecare eveniment are un loc, o ora si ceva de facut impreuna. In lume apar lucrurile
// zilei (bradul din piata, cadourile, colindatorii, petrecerea, caruta negustorului, arcada de la biserica, masa de
// sarbatoare din curte, concursul de la lac, targul de Craciun din oras); satenii se aduna la petreceri; atingi
// si incepe sarbatoarea pe tot ecranul (minigames/holi*.ts), pe ambele telefoane.
import type { WorldScene } from './world';
import type { Furn } from '../world/map';
import type { CharId } from '../char/draw';
import { Sfx } from '../engine/sfx';
import { iso } from '../world/iso';
import { ORIGIN } from '../world/layout';
import { VILLAGERS } from '../game/town';
import { ITEMS, CHARMS, NO_OUTFIT, type Outfit } from '../char/outfit';
import { hotMealKeys, RECIPE } from '../game/food';
import { eventsOf, seasonOf, dayOfSeason, tierOf, checkFriend } from './story';
import { g } from '../game/gender';

type S = WorldScene;
const st = (s: S, k: string) => s.w.stats[k] ?? 0;
const res = (s: S, k: string) => s.w.res?.[k] ?? 0;
export const yearOf = (day: number) => Math.floor((day - 1) / 28);
const hr = (s: S) => s.w.minutes / 60;
const ev = (s: S, id: string) => eventsOf(s.w.day).some(e => e.id === id);
const winter = (s: S) => seasonOf(s.w.day).id === 'winter';
/** craciunul de anul asta a trecut deja (sau e azi)? */
const afterXmas = (s: S) => winter(s) && dayOfSeason(s.w.day) >= 3;
const Y = (s: S) => yearOf(s.w.day);

// ====================================================================== unde stau lucrurile
export const SPOT = {
  tree: { gx: 117, gy: 19 },            // bradul din piata satului
  party: { gx: 113, gy: 18.6 },         // masa cu tortul si bannerul (ziua voastra, revelionul)
  caravan: { gx: 113.2, gy: 18.8 },     // caruta negustorului ambulant (targul lunar; locul petrecerilor, alta zi)
  arch: { gx: 130.3, gy: -6.7 },        // arcada cu flori in fata usii bisericii (nunta Inei)
  carol: { gx: 3.6, gy: 12.4 },         // colindatorii, la usa voastra
  table: { gx: 3.2, gy: 16.2 },         // masa de sarbatoare din curte
  contest: { gx: 83, gy: 31 },          // concursul de pescuit (zi de lac)
  picnic: { gx: 87, gy: 30.6 },         // patura de picnic
  market: { gx: 222, gy: -12 },         // targul de Craciun din oras (piateta de la nord)
};
const DROPS: [number, number][] = [[4, 3], [9, 5], [14, 2], [6, 12], [16, 18], [11, 21]].map(([x, y]) => [ORIGIN.forest.x + x, ORIGIN.forest.y + y]);
/** satenii se aduna aici (la petreceri) */
export function gather(s: S): { x: number; y: number; r: number; dance: boolean } | null {
  const h = hr(s);
  if ((ev(s, 'bdaybubu') || ev(s, 'bdaydudu')) && h >= 17.5) return { x: SPOT.party.gx + 1.5, y: SPOT.party.gy + 2.4, r: 2.6, dance: h >= 18 };
  if (ev(s, 'revelion') && h >= 20.5) return { x: 120.5, y: 20.5, r: 3.2, dance: true };
  if (ev(s, 'villwed') && h >= 11 && h < 18) return h < 14 ? { x: SPOT.arch.gx + 2.6, y: SPOT.arch.gy + 0.7, r: 2.2, dance: false } : { x: 120.5, y: 20.5, r: 2.8, dance: true };
  if (ev(s, 'craciun') && h >= 8 && h < 20) return { x: SPOT.tree.gx + 1, y: SPOT.tree.gy + 3, r: 3, dance: false };
  return null;
}
/** cheia lucrurilor de sarbatoare din lume: cand se schimba, refacem lumea */
export function holKey(s: S) {
  const h = hr(s), on = (a: number, b: number) => (h >= a && h < b ? 1 : 0);
  return [s.w.day, on(6, 24), on(10, 20), on(17, 23), on(17.5, 24), on(21, 24), on(11, 18), on(8, 19), st(s, 'xtree-' + Y(s)), st(s, 'xgifts-' + Y(s)), st(s, 'carol-' + Y(s)), st(s, 'treasure'), st(s, 'contest-' + Y(s)), res(s, 'ghiocel') >= 3 ? 1 : 0, DROPS.map((_, i) => st(s, `drop-${i}-${s.w.day}`)).join('')].join('|');
}

// ====================================================================== ce apare in lume
export function place(s: S, push: (f: Furn) => void) {
  if (s.space !== 'world') return;
  const h = hr(s), y = Y(s);
  const a = (id: string, label: string, icon: string) => ({ id, label, icon });
  // --- iarna: bradul din piata (de la inceputul iernii), cadourile de sub el (de Craciun)
  if (winter(s) && s.chapter >= 3) {
    const dec = st(s, 'xtree-' + y) > 0;
    push({ id: 'st-h-tree', type: 'xmastree' as any, kind: dec ? 'lit' : 'bare', gx: SPOT.tree.gx, gy: SPOT.tree.gy, w: 2, d: 2, solid: true, action: dec ? a('st-h-tree', 'Bradul satului ✨', '🎄') : a('st-h-tree', 'Împodobiți bradul satului', '🎄') });
    if (afterXmas(s) && !st(s, 'xgifts-' + y)) push({ id: 'st-h-gifts', type: 'giftpile' as any, gx: SPOT.tree.gx - 0.2, gy: SPOT.tree.gy + 2.1, w: 2.4, d: 0.8, solid: false, action: a('st-h-gifts', 'Cadourile de la săteni', '🎁') });
    // targul de Craciun din oras (toata iarna)
    const M = SPOT.market;
    push({ id: 'st-h-xsign', type: 'xmasarch' as any, gx: M.gx, gy: M.gy + 4, w: 1, d: 2, solid: false });
    push({ id: 'st-h-xs-turta', type: 'xstall' as any, kind: 'turta', gx: M.gx + 2, gy: M.gy + 0.5, w: 2, d: 1, solid: true, action: a('st-h-xs-turta', 'Turtă dulce (8 lei)', '🍪') });
    push({ id: 'st-h-xs-ceai', type: 'xstall' as any, kind: 'ceai', gx: M.gx + 5, gy: M.gy + 0.5, w: 2, d: 1, solid: true, action: a('st-h-xs-ceai', 'Ceai cald cu scorțișoară (6 lei)', '🍵') });
    push({ id: 'st-h-xs-vata', type: 'xstall' as any, kind: 'vata', gx: M.gx + 8, gy: M.gy + 0.5, w: 2, d: 1, solid: true, action: a('st-h-xs-vata', 'Vată de zahăr (5 lei)', '🍭') });
    push({ id: 'st-h-rink', type: 'rink' as any, gx: M.gx + 11, gy: M.gy + 0.5, w: 4, d: 3, solid: true, action: a('st-h-rink', 'Patinoarul (10 lei de persoană)', '⛸️') });
    push({ id: 'st-h-xcar', type: 'carousel' as any, kind: 'xmas', gx: M.gx + 16, gy: M.gy + 0.6, w: 2, d: 2, solid: true, action: a('st-h-xcar', 'Căluțeii (8 lei de persoană)', '🎠') });
    push({ id: 'st-h-santa', type: 'santa' as any, gx: M.gx + 19, gy: M.gy + 0.5, w: 2, d: 2, solid: true, action: a('st-h-santa', 'Poză cu Moș Crăciun', '🎅') });
    push({ id: 'st-h-xtree', type: 'xmastree' as any, kind: 'lit', gx: M.gx + 7.5, gy: M.gy + 3.4, w: 1, d: 1, solid: true });
  }
  // --- seara de Craciun: colindatorii la usa voastra
  if (ev(s, 'craciun') && h >= 17 && h < 23 && !st(s, 'carol-' + y)) push({ id: 'st-h-carol', type: 'carolers' as any, gx: SPOT.carol.gx, gy: SPOT.carol.gy, w: 1, d: 1, solid: false, action: a('st-h-carol', 'Au venit colindătorii!', '⭐') });
  // --- ziua lui Bubu / Dudu, revelionul: masa cu tortul si ghirlandele din piata
  const bday = ev(s, 'bdaybubu') ? 'bubu' : ev(s, 'bdaydudu') ? 'dudu' : '';
  if (bday && h >= 6) push({ id: 'st-h-party', type: 'partyset' as any, kind: (h >= 17.5 ? 'open-' : 'hidden-') + bday, gx: SPOT.party.gx, gy: SPOT.party.gy, w: 3, d: 1, solid: true, action: a('st-h-party', h >= 17.5 ? `🎂 Petrecerea lui ${bday === 'bubu' ? 'Bubu' : 'Dudu'}` : 'Pregătiri secrete… 🤫', '🎉') });
  if (ev(s, 'revelion') && h >= 18) push({ id: 'st-h-party', type: 'partyset' as any, kind: 'revelion', gx: SPOT.party.gx, gy: SPOT.party.gy, w: 3, d: 1, solid: true, action: a('st-h-party', h >= 21 ? 'Petrecerea de Revelion!' : 'Revelionul: de la 21:00', '🎆') });
  // --- targul lunar: caruta negustorului ambulant
  if (ev(s, 'fairday') && h >= 6 && h < 20 && s.chapter >= 3) push({ id: 'st-h-caravan', type: 'caravan' as any, gx: SPOT.caravan.gx, gy: SPOT.caravan.gy, w: 2, d: 2, solid: true, action: a('st-h-caravan', 'Negustorul ambulant', '🧳') });
  // --- nunta Inei: arcada cu flori la biserica
  if (ev(s, 'villwed') && h >= 6 && s.chapter >= 3) push({ id: 'st-h-arch', type: 'wedarch' as any, gx: SPOT.arch.gx, gy: SPOT.arch.gy, w: 0.4, d: 1.4, solid: false, action: a('st-h-arch', h >= 11 && h < 18 ? 'Nunta Inei (11:00 – 18:00)' : 'Nunta Inei: de la 11:00', '💒') });
  // --- masa de sarbatoare din curte (Paste, Martisor, Dragobete, bunicii)
  const tb = tableEvent(s);
  if (tb) push({ id: 'st-h-table', type: 'festable' as any, kind: tb.kind, gx: SPOT.table.gx, gy: SPOT.table.gy, w: 1, d: 1, solid: true, action: a('st-h-table', tb.label, tb.icon) });
  // --- zi de lac: concursul de pescuit si patura de picnic
  if (ev(s, 'swim') && h >= 8 && h < 19) {
    if (!st(s, 'contest-' + y)) push({ id: 'st-h-contest', type: 'contest' as any, gx: SPOT.contest.gx, gy: SPOT.contest.gy, w: 2, d: 1, solid: true, action: a('st-h-contest', 'Concursul de pescuit 🏆', '🎣') });
    push({ id: 'st-h-picnic', type: 'picnic' as any, gx: SPOT.picnic.gx, gy: SPOT.picnic.gy, w: 2, d: 1.4, solid: false, action: a('st-h-picnic', 'Picnic pe malul lacului', '🧺') });
  }
  // --- Dragobete: ghioceii din padure
  if (ev(s, 'dragobete') && s.chapter >= 2) DROPS.forEach(([x, yy], i) => { if (!st(s, `drop-${i}-${s.w.day}`)) push({ id: 'st-h-drop' + i, type: 'snowdrop' as any, gx: x, gy: yy, w: 1, d: 1, solid: false, action: a('st-h-drop', 'Culege ghiocei', '🤍') }); });
  // --- comoara de pe harta negustorului
  if (st(s, 'treasure')) { const t = treasureSpot(s); push({ id: 'st-h-dig', type: 'xmark' as any, gx: t.x, gy: t.y, w: 1, d: 1, solid: false, action: a('st-h-dig', 'Sapă după comoară!', '⛏️') }); }
}
function tableEvent(s: S): { kind: string; label: string; icon: string } | null {
  const h = hr(s), y = Y(s);
  if (ev(s, 'paste') && h >= 6 && !st(s, 'paste-' + y)) return { kind: 'paste', label: 'Ciocnim ouă roșii!', icon: '🥚' };
  if (ev(s, 'martisor') && h >= 6 && !st(s, `mart-${s.myId}-${y}`)) return { kind: 'martisor', label: `Fă-i un mărțișor lui ${s.partner.actor.spec.name}`, icon: '🎀' };
  if (ev(s, 'dragobete') && h >= 6 && !st(s, 'drago-' + y)) return { kind: 'drago', label: res(s, 'ghiocel') >= 3 ? `Dă-i ghioceii lui ${s.partner.actor.spec.name}` : 'Dragobete: culegeți ghiocei din pădure', icon: '🤍' };
  if (ev(s, 'grandparents') && h >= 10 && h < 20 && !st(s, 'grand-' + y)) return { kind: 'grand', label: 'Bunicii au venit în vizită!', icon: '👵' };
  return null;
}
const treasureSpot = (s: S) => { const r = st(s, 'treasure'); const spots = [[16, 17], [20, 4], [1, 18], [11, 20], [ORIGIN.forest.x + 18, ORIGIN.forest.y + 16]]; const [x, y] = spots[r % spots.length]; return { x, y }; };

// ====================================================================== cand atingi
export function action(s: S, id: string, f?: Furn) {
  const h = hr(s), y = Y(s);
  if (id === 'st-h-tree') {
    if (st(s, 'xtree-' + y)) { s.hud.toast('🎄 Bradul satului strălucește! Ați pus voi globurile ✨'); s.me.actor.play('love'); Sfx.play('chimes', { vol: 0.5 }); return; }
    s.playHoliday('xmastree'); return;
  }
  if (id === 'st-h-gifts') { s.playHoliday('gifts', true, { occ: 'xmas' }); return; }
  if (id === 'st-h-carol') { s.playHoliday('colinde'); return; }
  if (id === 'st-h-party') {
    if (ev(s, 'revelion')) { if (h < 21) { s.hud.toast('🎆 Petrecerea de Revelion începe la 21:00. La miezul nopții: artificii! (în seara asta nu vă e somn 😉)'); return; } if (st(s, 'nye-' + y)) { s.hud.toast('🎆 La mulți ani! Ați sărbătorit deja 🥂'); return; } s.playHoliday('revelion'); return; }
    const who: CharId = ev(s, 'bdaybubu') ? 'bubu' : 'dudu';
    if (st(s, `bday-${who}-${y}`)) { s.hud.toast('🎂 Ce petrecere a fost! La mulți ani! 🥳'); return; }
    if (h < 17.5) { s.hud.toast(s.myId === who ? '🤫 „Nimic, nimic… treci mai târziu, pe la 6!” (ceva se pune la cale)' : `🤫 Pregătirile pentru ${who === 'bubu' ? 'Bubu' : 'Dudu'} merg strună. Petrecerea începe la 18:00, aici în piață!`); Sfx.play('pop'); return; }
    s.playHoliday('bday', true, { who }); return;
  }
  if (id === 'st-h-caravan') { openMerchant(s); return; }
  if (id === 'st-h-arch') {
    if (st(s, 'inawed-' + y)) { s.hud.toast('💒 Ce nuntă frumoasă! Casă de piatră, Ina și Rex! 💕'); return; }
    if (h < 11 || h >= 18) { s.hud.toast('💒 Nunta Inei începe la 11:00 (până la 18:00). Tot satul e invitat!'); return; }
    s.playHoliday('inawed'); return;
  }
  if (id === 'st-h-table') {
    const tb = tableEvent(s); if (!tb) return;
    if (tb.kind === 'drago' && res(s, 'ghiocel') < 3) { s.hud.toast('🤍 Ghioceii au răsărit în pădure: culegeți măcar 3 (îi vezi pe jos, albi)'); return; }
    s.playHoliday(tb.kind === 'drago' ? 'dragobete' : tb.kind, tb.kind !== 'martisor'); return;
  }
  if (id === 'st-h-contest') { s.playHoliday('fishcontest'); return; }
  if (id === 'st-h-picnic') { s.playHoliday('picnic'); return; }
  if (id === 'st-h-rink') { if (!pay(s, 10 * (s.partnerOnline || s.partner.control === 'ai' ? 2 : 1), 'Patinoarul')) return; s.playHoliday('skate'); return; }
  if (id === 'st-h-xcar') { if (!pay(s, 8 * 2, 'Căluțeii')) return; s.playHoliday('carusel'); return; }
  if (id === 'st-h-santa') { if (st(s, 'santa-' + y)) { s.hud.toast('🎅 „Ho-ho-ho! Ne-am pozat deja! Vă aștept la anul!”'); return; } s.playHoliday('santa'); return; }
  if (id.startsWith('st-h-xs-')) { treat(s, id.slice(8)); return; }
  if (id === 'st-h-drop') { pickDrop(s, f?.id ?? ''); return; }
  if (id === 'st-h-dig') { dig(s); return; }
}
function pay(s: S, lei: number, what: string) { if ((s.w.money ?? 0) < lei) { s.hud.toast(`💰 ${what}: ${lei} lei`); Sfx.play('bad'); return false; } s.op({ k: 'money', delta: -lei }); Sfx.play('coin'); return true; }
/** dulciurile de la targul de Craciun */
function treat(s: S, k: string) {
  const T: Record<string, { lei: number; icon: string; text: string; needs: Record<string, number>; anim: string }> = {
    turta: { lei: 8, icon: '🍪', text: 'Turtă dulce cu glazură! Miroase a scorțișoară și a copilărie', needs: { hunger: 14, fun: 10 }, anim: 'act_eat' },
    ceai: { lei: 6, icon: '🍵', text: 'Ceai cald cu scorțișoară și portocală… îți dezgheață lăbuțele', needs: { warmth: 30, energy: 6 }, anim: 'act_coffee' },
    vata: { lei: 5, icon: '🍭', text: 'Vată de zahăr roz! …și acum ai vată pe nas 😂', needs: { fun: 18, hunger: 6 }, anim: 'act_eat' },
  };
  const t = T[k]; if (!t || !pay(s, t.lei, 'Taraba')) return;
  for (const [n, v] of Object.entries(t.needs)) s.op({ k: 'need', who: s.myId, need: n, delta: v });
  s.me.actor.play(t.anim); setTimeout(() => { if (s.me.actor.anim.id === t.anim) s.me.actor.stop(); if (k === 'vata') s.me.actor.play('laugh'); }, 2600);
  const p = iso(s.me.gx, s.me.gy, 95); s.fx.text(p.x, p.y, t.icon + ' Mmm!', '#ff4d8d', 1);
  s.hud.toast(`${t.icon} ${t.text}`); s.op({ k: 'stat', key: 'xtreats', delta: 1 });
}
function pickDrop(s: S, fid: string) {
  const i = Number(fid.replace('st-h-drop', '')); if (!fid || !(i >= 0)) return;
  s.op({ k: 'stat', key: `drop-${i}-${s.w.day}`, delta: 1 }); s.op({ k: 'res', res: 'ghiocel', delta: 1 }); s.syncPlaced();
  s.me.actor.play('act_collect'); setTimeout(() => s.me.actor.stop(), 1600); Sfx.play('leaves', { vol: 0.6 });
  const n = res(s, 'ghiocel'); s.hud.toast(n >= 3 ? `🤍 ${n} ghiocei: un buchet! Duceți-l acasă, la masa din curte, și dați-l de Dragobete 💕` : `🤍 Ghiocel cules (${n}/3 pentru buchet)`);
}
function dig(s: S) {
  s.me.actor.play('act_garden'); Sfx.play('dig'); Sfx.play('dig', { delay: 0.6 });
  setTimeout(() => {
    s.me.actor.stop(); const r = (st(s, 'treasure') * 7 + s.w.day) % 5;
    const prize = [{ lei: 250, t: '💰 Un cufăr plin cu monede vechi! +250 lei' }, { lei: 120, t: '🏺 Un ulcior cu bani de pe vremea bunicilor! +120 lei' }, { lei: 20, t: '👢 …o gheată veche. Și 20 de lei în ea 😂' }, { lei: 180, t: '💎 O cutiuță cu un inel vechi: îl vindeți cu 180 de lei!' }, { lei: 60, t: '🦴 Un os imens! Rex o să fie fericit. (și 60 de lei lângă el)' }][r];
    s.op({ k: 'money', delta: prize.lei }); s.op({ k: 'stat', key: 'treasure', delta: -st(s, 'treasure') }); s.op({ k: 'stat', key: 'treasures', delta: 1 }); s.syncPlaced();
    s.hud.toast(prize.t); Sfx.play(prize.lei > 100 ? 'victory' : 'boing'); s.me.actor.play(prize.lei > 100 ? 'dance_hop' : 'laugh');
  }, 1500);
}

// ====================================================================== negustorul ambulant (targul lunar)
export const MERCHANT_ITEMS = ['mustata', 'monoclu', 'cowboy', 'ochelari'];
function openMerchant(s: S) {
  const c = s.w.chars[s.myId]; c.owned ??= []; c.outfit ??= { ...NO_OUTFIT };
  const lines = ['„Marfă din Babilon, aproape nouă!”', '„Vă las mai ieftin, că sunteți drăguți!”', '„Am de toate: și ce trebuie, și ce nu trebuie!”', '„Elixirul ăsta l-a băut și bunicul. Acum are 104 ani!”'];
  const say = lines[s.w.day % lines.length];
  const clothes = MERCHANT_ITEMS.map(id => ITEMS.find(i => i.id === id)!).filter(Boolean);
  const html = `<h3>🧳 Negustorul ambulant</h3><p class="sub">${say} Vine doar la târgul lunar, cu lucruri care nu se găsesc nicăieri.</p>
    <div class="shop">${clothes.map(i => `<button data-mi="${i.id}" class="${c.owned!.includes(i.id) ? 'on' : (s.w.money ?? 0) < i.price ? 'poor' : ''}"><span>${i.icon}</span><b>${i.label}</b><small>${c.owned!.includes(i.id) ? 'e al tău ✓ (garderoba)' : i.price + ' lei'}</small></button>`).join('')}
    <button data-mx="elixir"><span>🧪</span><b>Elixirul dragostei</b><small>25 lei · „efect garantat… cu sughiț”</small></button>
    <button data-mx="loz"><span>🎟️</span><b>Lozul norocos</b><small>10 lei · răzuiești 3 căsuțe</small></button>
    <button data-mx="glob"><span>🔮</span><b>Globul de cristal</b><small>5 lei · îți spune viitorul</small></button>
    <button data-mx="harta" class="${st(s, 'treasure') ? 'on' : ''}"><span>🗺️</span><b>Harta comorii</b><small>${st(s, 'treasure') ? 'o aveți: căutați X-ul!' : '50 lei · un X undeva aproape de casă'}</small></button></div>`;
  const m = s.hud.modal(html);
  m.querySelectorAll('[data-mi]').forEach(b => b.addEventListener('click', () => {
    const it = ITEMS.find(i => i.id === (b as HTMLElement).dataset.mi)!; if (c.owned!.includes(it.id)) { (c.outfit as any)[it.slot] = it.id; s.sendCharSync(); s.me.actor.play('shy'); openMerchant(s); return; }
    if (!pay(s, it.price, it.label)) return; c.owned!.push(it.id); (c.outfit as any)[it.slot] = it.id; s.sendCharSync(); s.me.actor.play(it.id === 'mustata' ? 'laugh' : 'shy');
    s.hud.toast(it.id === 'mustata' ? '🥸 Mustața îți dă un aer de boier! (sau de spion)' : it.id === 'monoclu' ? '🧐 Monoclul: acum pari foarte, foarte important' : it.id === 'cowboy' ? '🤠 Yee-haw! Cel mai tare cowboy din sat' : '🤓 Ochelarii rotunzi: arăți ca un profesor de pian'); openMerchant(s);
  }));
  m.querySelectorAll('[data-mx]').forEach(b => b.addEventListener('click', () => {
    const k = (b as HTMLElement).dataset.mx!;
    if (k === 'elixir') { if (!pay(s, 25, 'Elixirul')) return; s.hud.closeModal(); for (const p of [s.me, s.partner]) if (p.control !== 'remote') s.op({ k: 'need', who: p.id, need: 'love', delta: 30 }); s.me.actor.play('love'); const q = iso(s.me.gx, s.me.gy, 90); s.fx.hearts(q.x, q.y, 12); s.hud.toast('🧪 Gâl-gâl… iubirea crește! …hic! 😳 Hic! (sughițul trece în câteva minute)'); for (let i = 1; i <= 5; i++) setTimeout(() => { Sfx.play('burp', { vol: 0.35, rate: 1.9 }); const q2 = iso(s.me.gx, s.me.gy, 100); s.fx.text(q2.x, q2.y, 'hic!', '#c77dff', 0.8); }, i * 2600); return; }
    if (k === 'loz') { if (!pay(s, 10, 'Lozul')) return; s.hud.closeModal(); s.playHoliday('loz', false); return; }
    if (k === 'glob') { if (!pay(s, 5, 'Globul')) return; const F = ['Văd… o clătită arsă în viitorul tău apropiat 🥞🔥', 'Cineva drag îți va fura pătura la noapte 🛏️', 'Văd bani! Mulți bani! …a, nu, sunt nasturi', 'Un pupic neașteptat te pândește după colț 💋', 'Peștele cel mare te așteaptă la lac. Mâine. Sau poimâine 🐟', 'Vei râde atât de tare încât vei sforăi de râs 😂', 'Văd un ursuleț care mănâncă ultima prăjitură 🍰🐻', 'Vei avea noroc… dacă uzi grădina 🌱']; s.hud.toast('🔮 „' + F[(s.w.day * 7 + st(s, 'glob')) % F.length] + '”'); s.op({ k: 'stat', key: 'glob', delta: 1 }); Sfx.play('chimes', { vol: 0.6 }); return; }
    if (k === 'harta') { if (st(s, 'treasure')) { s.hud.toast('🗺️ Aveți deja harta: căutați X-ul roșu!'); return; } if (!pay(s, 50, 'Harta')) return; s.op({ k: 'stat', key: 'treasure', delta: 1 + (s.w.day % 5) }); s.syncPlaced(); const t = treasureSpot(s); s.hud.closeModal(); s.hud.toast(`🗺️ Pe hartă e un X ${t.y < 0 ? 'în pădure' : 'în curtea voastră'}! Căutați-l și săpați 🏴‍☠️`); return; }
  }));
}

// ====================================================================== dimineata: ce e azi si unde
export function morning(s: S, id: string): string | null {
  const me = s.myId, pa = s.partner.actor.spec.name;
  switch (id) {
    case 'martisor': return `🌸 1 Martie! La masa din curte fă-i un mărțișor lui ${pa}: alegi talismanul și împletești șnurul alb-roșu`;
    case 'paste': return '🥚 Paștele! Vecinii v-au adus ouă și cozonac: la masa din curte vopsiți ouăle și le ciocniți. Cine are oul cel mai tare?';
    case 'villwed': return '💒 Nunta Inei! De la 11:00 la biserica din sat (arcada cu flori), apoi hora în piață. Tot satul e invitat';
    case 'bdaybubu': return me === 'bubu' ? '🎂 La mulți ani, Bubu! Sătenii parcă ascund ceva… treci prin piața satului diseară, pe la 18:00 😉' : '🎂 Azi e ziua lui Bubu! Satul pregătește o petrecere surpriză în piață, la 18:00. Adu-o acolo și pregătește-i un cadou! 🤫';
    case 'bdaydudu': return me === 'dudu' ? '🎂 La mulți ani, Dudu! Sătenii parcă ascund ceva… treci prin piața satului diseară, pe la 18:00 😉' : '🎂 Azi e ziua lui Dudu! Satul pregătește o petrecere surpriză în piață, la 18:00. Adu-l acolo și pregătește-i un cadou! 🤫';
    case 'grandparents': return '👵👴 Vin bunicii! Între 10:00 și 20:00 vă așteaptă la masa din curte. Gătiți ceva bun, că bunica e pretențioasă 😄';
    case 'swim': return '🏊 Zi de lac! Concursul de pescuit (premii: 200 / 100 / 50 lei) și picnic pe mal, la lac, între 8:00 și 19:00';
    case 'storm': return null;
    case 'craciun': return `🎄 Crăciunul! Sub bradul din piața satului vă așteaptă cadourile de la săteni. Diseară, între 17:00 și 23:00, vin colindătorii la ușa voastră${st(s, 'xtree-' + Y(s)) ? '' : '. (Bradul încă nu e împodobit: atingeți-l!)'}`;
    case 'dragobete': return `💞 Dragobetele! Au răsărit ghiocei în pădure: culege 3, apoi dă-i lui ${pa} la masa din curte. „Dragobetele sărută fetele!”`;
    case 'revelion': return '🎆 Revelionul! Petrecerea e în piața satului, de la 21:00: dans, numărătoarea, artificii lansate de voi. În seara asta nu vă e somn 😉';
    case 'fairday': return '💱 Târgul lunar: piața plătește mai bine azi, iar negustorul ambulant a venit cu căruța lui în piață (lucruri rare, lozuri, harta comorii!)';
  }
  return null;
}
/** prima zi de iarna: bradul si targul de Craciun */
export function morningExtra(s: S): string[] {
  const out: string[] = [];
  if (winter(s) && dayOfSeason(s.w.day) === 1 && s.chapter >= 3) out.push('🎄 A venit iarna! În piața satului e un brad mare, neîmpodobit: împodobiți-l împreună. La oraș s-a deschis Târgul de Crăciun (în nordul orașului): patinoar, căluței, Moș Crăciun');
  return out;
}

// ====================================================================== Revelionul: nu va e somn
/** seara de Revelion (18:00 – miezul noptii): energia nu scade; la 21:00, cine e obosit se inviorează */
export const partyNight = (s: S) => ev(s, 'revelion') && hr(s) >= 18;
export function revelionPerk(s: S) {
  if (!ev(s, 'revelion') || hr(s) < 21 || st(s, 'nyePerk-' + s.myId + '-' + Y(s))) return;
  s.op({ k: 'stat', key: 'nyePerk-' + s.myId + '-' + Y(s), delta: 1 });
  const e = s.w.chars[s.myId].needs.energy;
  if (e < 60) { s.op({ k: 'need', who: s.myId, need: 'energy', delta: 60 - e }); s.hud.toast('🎆 E seara de Revelion: emoția te ține treaz! Energia nu scade până la miezul nopții'); }
}

// ====================================================================== recompense comune (folosite de sarbatori)
/** o singura data (pe anul jocului): primul telefon care termina da recompensele comune */
export function once(s: S, key: string) { if (st(s, key)) return false; s.op({ k: 'stat', key, delta: 1 }); return true; }
export const yearKey = (s: S, id: string) => `${id}-${Y(s)}`;
export function memory(s: S, id: string) { if (!st(s, 'mem-' + id)) s.op({ k: 'stat', key: 'mem-' + id, delta: 1 }); }
/** nevoile unui personaj (doar daca il controlezi tu: al tau sau AI-ul) */
export function feel(s: S, who: CharId, n: Record<string, number>) { const p = who === s.myId ? s.me : s.partner; if (p.control === 'remote') return; for (const [k, v] of Object.entries(n)) s.op({ k: 'need', who, need: k, delta: v }); }
export function feelBoth(s: S, n: Record<string, number>) { feel(s, 'bubu', n); feel(s, 'dudu', n); }
export function befriend(s: S, vid: string, n = 1) { s.op({ k: 'stat', key: 'friend-' + vid, delta: n }); checkFriend(s, vid); }
export function befriendAll(s: S, n = 1) { for (const v of VILLAGERS) befriend(s, v.id, n); }

/** amintirile (albumul nou): cate una de la fiecare sarbatoare */
export const MEMORIES: { id: string; name: string }[] = [
  { id: 'xmastree', name: 'Bradul satului' }, { id: 'colinde', name: 'Colindătorii' }, { id: 'gifts', name: 'Cadourile de Crăciun' }, { id: 'santa', name: 'Poza cu Moș Crăciun' },
  { id: 'skate', name: 'La patinoar' }, { id: 'carusel', name: 'Căluțeii' }, { id: 'revelion', name: 'Revelionul' }, { id: 'bday-bubu', name: 'Ziua lui Bubu' }, { id: 'bday-dudu', name: 'Ziua lui Dudu' },
  { id: 'paste', name: 'Ouăle de Paște' }, { id: 'martisor', name: 'Mărțișorul' }, { id: 'dragobete', name: 'Dragobetele' }, { id: 'inawed', name: 'Nunta Inei' }, { id: 'grand', name: 'Bunicii' },
  { id: 'fishcontest', name: 'Concursul de pescuit' }, { id: 'picnic', name: 'Picnicul' },
];

// ====================================================================== cadourile satenilor (Craciun, ziua voastra)
export interface Gift { vid: string; from: string; box: string; icon: string; label: string; msg: string; to: CharId | 'both'; res?: Record<string, number>; money?: number; item?: string }
/** ce primiti de la fiecare satean: mai frumos cu cat sunteti mai prieteni (treapta 0..5) */
export function giftList(s: S, occ: 'xmas' | 'bday', who: CharId = 'bubu'): Gift[] {
  const out: Gift[] = [];
  const owned = (id: CharId) => new Set(((s.w.chars[id] as any).owned ?? []) as string[]);
  const cloth = (to: CharId, ids: string[]) => ids.find(i => !owned(to).has(i));
  const boxes = ['#ff7aa2', '#4cc9f0', '#ffd23f', '#7cc576', '#c77dff', '#ff9a5a'];
  VILLAGERS.forEach((v, i) => {
    const t = tierOf(s, v.id);
    if (occ === 'bday' && t < 1) return; // la ziua voastra vin cei cu care va cunoasteti
    const to: CharId = occ === 'bday' ? who : i % 2 ? 'dudu' : 'bubu';
    let gft: Omit<Gift, 'vid' | 'from' | 'box' | 'to'>;
    switch (v.id) {
      case 'leana': { const it = t >= 3 ? cloth(to, ['scarf', 'beanie', 'pulover']) : undefined; gft = it ? { icon: '🧣', label: ITEMS.find(x => x.id === it)!.label, item: it, msg: '„L-am tricotat eu, toată toamna. Să nu răciți!”' } : { icon: '🥧', label: `${2 + t} porții de plăcintă`, res: { meals: 2 + t }, msg: '„Plăcintă cu mere, ca pe vremuri. Mâncați, că sunteți slăbuți!”' }; break; }
      case 'ina': gft = t >= 2 ? { icon: '🌹', label: `${4 + t * 2} semințe de trandafiri`, res: { seed_rose: 4 + t * 2 }, msg: '„Să aveți cea mai frumoasă grădină din sat!”' } : { icon: '🌷', label: '6 semințe de lalele', res: { seed_tulip: 6 }, msg: '„Florile fac orice casă mai veselă!”' }; break;
      case 'gogu': gft = { icon: '🪵', label: `${4 + t * 2} scânduri`, res: { plank: 4 + t * 2 }, msg: t >= 3 ? '„Rindeluite de mâna mea! Ca-n tinerețe…”' : '„Ceva util. Nu-i frumos, da-i util!”' }; break;
      case 'miti': gft = { icon: '🐟', label: `${1 + Math.ceil(t / 2)} pești`, res: { fish: 1 + Math.ceil(t / 2) }, msg: t >= 2 ? '„Prr… cel mai frumos pește al meu. Aproape că nu l-am mâncat!”' : '„Miau. E proaspăt! (de ieri)”' }; break;
      case 'rita': { const it = t >= 2 ? cloth(to, ['rochita', 'tricou', 'batic', 'palarie']) : undefined; gft = it ? { icon: '🧵', label: ITEMS.find(x => x.id === it)!.label, item: it, msg: '„Am cusut-o eu! Ți se potrivește perfect, am luat măsurile din ochi 😉”' } : { icon: '🌻', label: '4 semințe de floarea-soarelui', res: { seed_sunflower: 4 }, msg: '„Să vă zâmbească grădina!”' }; break; }
      case 'rex': gft = t >= 3 ? { icon: '💰', label: `${30 + t * 15} lei`, money: 30 + t * 15, msg: '„Ham! I-am găsit lângă pod. Sunt ai voștri!”' } : { icon: '🦴', label: 'Un os (și 15 lei)', money: 15, msg: `„Ham! Pentru ${to === 'dudu' ? 'Dudu, cel mai cuminte cățel… adică urs' : 'Bubu! E cel mai bun os al meu'} 😅”` }; break;
      default: gft = { icon: '🎁', label: '20 lei', money: 20, msg: '„Cu drag!”' };
    }
    out.push({ vid: v.id, from: v.name, box: boxes[i % boxes.length], to: gft.item ? to : 'both', ...gft });
  });
  if (occ === 'xmas') out.push({ vid: 'mos', from: 'Moș Crăciun', box: '#e63946', icon: '🎅', label: '150 lei și o căciuliță', money: 150, item: cloth('bubu', ['beanie']) ? 'beanie' : undefined, to: 'bubu', msg: '„Ho-ho-ho! Ați fost cuminți… aproape tot anul!”' });
  return out;
}
/** primesti un cadou: lucrurile comune pe telefonul care a pornit, hainele pe telefonul celui care le primeste */
export function applyGift(s: S, gf: Gift, shared: boolean) {
  if (shared) { for (const [k, v] of Object.entries(gf.res ?? {})) s.op({ k: 'res', res: k, delta: v }); if (gf.money) s.op({ k: 'money', delta: gf.money }); }
  if (gf.item) { const to = gf.to === 'both' ? s.myId : gf.to; const p = to === s.myId ? s.me : s.partner; if (p.control !== 'remote') { const c = s.w.chars[to]; c.owned ??= []; if (!c.owned.includes(gf.item)) c.owned.push(gf.item); if (to === s.myId) s.sendCharSync(); } }
}
/** ce mancare calda aveti (pentru bunici) */
export function hotMeals(s: S): { key: string; icon: string; name: string; n: number; stars: number }[] {
  return hotMealKeys(s.w.res ?? {}).filter(k => res(s, k) > 0).map(k => { const id = k.replace(/^dish_/, ''); const r = RECIPE[id]; return { key: k, icon: r?.icon ?? '🍲', name: r?.name ?? 'Mâncare caldă', n: res(s, k), stars: r ? 3 + (['sarmale', 'mamaliga', 'ciorba', 'placinta', 'cozonac'].includes(id) ? 2 : 1) : 2 }; });
}
export const genderWord = (id: CharId, m: string, f: string) => g(id, m, f);

/** martisorul primit se vede in piept toata primavara (7 zile) */
export function withPin(s: S, who: CharId, o: Outfit | undefined): Outfit | undefined {
  const c = st(s, 'mpin-' + who); if (!c || !o) return o;
  if (seasonOf(s.w.day).id !== 'spring' || s.w.day - st(s, 'mday-' + who) > 7) return o;
  const id = CHARMS[c - 1]?.id; if (!id) return o;
  const k = (o as any).__pinned; if (k && k.pin === id && k.src === o) return k.out;
  const out = { ...o, pin: id }; (o as any).__pinned = { pin: id, src: o, out }; return out;
}
export const showName = (id: string) => ({ xmastree: 'împodobitul bradului', colinde: 'colindul', gifts: 'deschisul cadourilor', santa: 'poza cu Moș Crăciun', skate: 'patinajul', carusel: 'tura cu căluțeii', revelion: 'petrecerea de Revelion', bday: 'petrecerea surpriză', paste: 'ciocnitul ouălor', martisor: 'mărțișorul', dragobete: 'Dragobetele', inawed: 'nunta Inei', grand: 'vizita bunicilor', fishcontest: 'concursul de pescuit', picnic: 'picnicul', loz: 'lozul' } as Record<string, string>)[id] ?? 'o sărbătoare';
