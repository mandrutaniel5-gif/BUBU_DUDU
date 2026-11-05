// Ferestrele pentru sat si oras: job (cariera), universitate, banca, avizierul satului, discutia cu un satean.
import * as Story from '../scenes/story';
import type { WorldScene } from '../scenes/world';
import { Sfx } from '../engine/sfx';
import { drawCharacter, NPC_SPECS } from '../char/draw';
import { basePose } from '../char/pose';
import { JOBS, COURSES, VILLAGERS, LEVEL_NAMES, LEVEL_NEED, LEVEL_MULT, jobLevel, jobXp, jobKey, hasDiploma, reputation, repLevel, REP_LEVELS, bankOf, isMarketDay, APT_PRICE, APT_DOWN, LOAN_RATE, LOAN_DAYS, APT_BILLS } from '../game/town';
import { startJob, startCourse, questsToday, deliverQuest, questText, setBank, buyApartment } from '../scenes/townctl';

const portraits: Record<string, string> = {};
function portrait(spec: string) {
  if (portraits[spec]) return portraits[spec];
  const cv = document.createElement('canvas'); cv.width = cv.height = 140; const c = cv.getContext('2d')!;
  const P = basePose(); P.eyes = 'happy'; P.mouth = 'open'; P.blush = 1.1;
  drawCharacter(c, NPC_SPECS[spec], P, 70, 146, 1.25, 1, 0);
  return (portraits[spec] = cv.toDataURL());
}
const hearts = (n: number, max = 5) => '💗'.repeat(Math.min(max, n)) + '🤍'.repeat(Math.max(0, max - n));

export function openJob(s: WorldScene, id: string) {
  const job = JOBS[id], who = s.myId, fem = who === 'bubu', w = s.w;
  const lvl = jobLevel(w, id, who), xp = jobXp(w, id, who);
  const need = job.requires && !hasDiploma(w, job.requires, who);
  const done = (w.stats[jobKey(id, who, 'day')] ?? 0) === w.day;
  const pay0 = Math.round(job.base * LEVEL_MULT[lvl] * 0.6), pay1 = Math.round(job.base * LEVEL_MULT[lvl] * 1.2);
  const m = s.hud.modal(`<h3>${job.icon} ${job.name[fem ? 1 : 0]}</h3><p class="sub">${job.desc}</p>
    <ul class="goals inv">
      <li><b>⏰ Program</b><i>${job.open[0]}:00 – ${job.open[1]}:00</i></li>
      <li><b>⭐ Nivelul tău</b><i>${LEVEL_NAMES[lvl][fem ? 1 : 0]}</i></li>
      <li><b>📈 Promovare</b><i>${lvl >= 3 ? 'nivel maxim' : `${xp}/${LEVEL_NEED[lvl]} ture bune`}</i></li>
      <li><b>💰 Plata pe tură</b><i>${pay0}–${pay1} lei</i></li>
      <li><b>😴 Energie</b><i>-${job.energy}%</i></li>
      ${job.requires ? `<li><b>🎓 ${COURSES[job.requires].name}</b><i>${need ? 'lipsește' : '✔ ai diploma'}</i></li>` : ''}
    </ul>
    <p class="sub">O tură pe zi. Cu cât lucrezi mai bine, cu atât câștigi mai mult. După câteva ture bune ești ${fem ? 'promovată' : 'promovat'}.</p>
    <div class="shop"><button data-go class="${need || done ? 'poor' : ''}"><span>${job.icon}</span><b>${done ? 'Ai lucrat azi ✔' : need ? 'Întâi diploma 🎓' : 'Începe tura'}</b></button></div>`);
  m.querySelector('[data-go]')!.addEventListener('click', () => { m.classList.add('hidden'); startJob(s, id); });
}

export function openUni(s: WorldScene) {
  const who = s.myId;
  const m = s.hud.modal(`<h3>🎓 Universitatea</h3><p class="sub">Cursurile îți deschid joburi mai bune și fac afacerile din sat mai profitabile. Plătești o dată; dacă pici examenul, îl reiei gratuit.</p>
    <div class="shop">${Object.values(COURSES).map(c => { const has = hasDiploma(s.w, c.id, who), paid = (s.w.stats[`paid-${c.id}-${who}`] ?? 0) > 0; return `<button data-c="${c.id}" class="${has ? 'on' : !paid && (s.w.money ?? 0) < c.price ? 'poor' : ''}"><span>${c.icon}</span><b>${c.name}</b><small>${has ? '✔ diplomă' : paid ? 'reia examenul' : '💰 ' + c.price + ' lei'}</small><small>${c.desc}</small></button>`; }).join('')}</div>`);
  m.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { m.classList.add('hidden'); startCourse(s, (b as HTMLElement).dataset.c!); }));
}

export function openBank(s: WorldScene) {
  const b = bankOf(s.w), money = s.w.money ?? 0, apt = (s.w.stats.apartment ?? 0) > 0;
  const m = s.hud.modal(`<h3>🏦 Banca orașului</h3><p class="sub">Ai 💰 ${money} lei în buzunar · 🐷 ${b.savings} lei economii (+2% pe zi)</p>
    <h4>🐷 Economii</h4><div class="shop">
      <button data-dep="50" class="${money < 50 ? 'poor' : ''}"><span>⬇</span><b>Depune 50</b></button>
      <button data-dep="all" class="${money < 1 ? 'poor' : ''}"><span>⬇</span><b>Depune tot</b></button>
      <button data-wd="50" class="${b.savings < 50 ? 'poor' : ''}"><span>⬆</span><b>Retrage 50</b></button>
      <button data-wd="all" class="${b.savings < 1 ? 'poor' : ''}"><span>⬆</span><b>Retrage tot</b></button></div>
    <h4>🏙️ Apartamentul din Blocul Lalelelor</h4>
    ${apt ? `<p class="sub">✔ E al vostru.${b.loanLeft > 0 ? ` Credit rămas: <b>${b.loanLeft} lei</b> (rata ${LOAN_RATE} lei/zi${b.late ? `, ⚠️ ${b.late} rate întârziate` : ''}).` : ' Plătit integral 🎉'} Facturi: ${APT_BILLS} lei/zi.</p>` : `
      <p class="sub">Preț: <b>${APT_PRICE} lei</b> pe loc, sau cu credit: <b>${APT_DOWN} lei avans</b> + ${LOAN_DAYS} rate de ${LOAN_RATE} lei, luate în fiecare dimineață.</p>
      <div class="shop"><button data-apt="cash" class="${money < APT_PRICE ? 'poor' : ''}"><span>🔑</span><b>Cumpără pe loc</b><small>${APT_PRICE} lei</small></button>
      <button data-apt="loan" class="${money < APT_DOWN ? 'poor' : ''}"><span>🏦</span><b>Cu credit</b><small>avans ${APT_DOWN} lei</small></button></div>`}
    ${b.loanLeft > 0 ? `<div class="shop"><button data-pay class="${money < Math.min(b.loanLeft, LOAN_RATE * 5) ? 'poor' : ''}"><span>💰</span><b>Plătește 5 rate acum</b><small>${Math.min(b.loanLeft, LOAN_RATE * 5)} lei</small></button></div>` : ''}`);
  const re = () => openBank(s);
  m.querySelectorAll('[data-dep]').forEach(el => el.addEventListener('click', () => { const v = (el as HTMLElement).dataset.dep === 'all' ? s.w.money ?? 0 : Math.min(50, s.w.money ?? 0); if (v < 1) return; s.op({ k: 'money', delta: -v }); setBank(s, { ...bankOf(s.w), savings: bankOf(s.w).savings + v }); Sfx.play('coin'); re(); }));
  m.querySelectorAll('[data-wd]').forEach(el => el.addEventListener('click', () => { const B = bankOf(s.w); const v = (el as HTMLElement).dataset.wd === 'all' ? B.savings : Math.min(50, B.savings); if (v < 1) return; setBank(s, { ...B, savings: B.savings - v }); s.op({ k: 'money', delta: v }); Sfx.play('coin'); re(); }));
  m.querySelectorAll('[data-apt]').forEach(el => el.addEventListener('click', () => { const err = buyApartment(s, (el as HTMLElement).dataset.apt as 'cash' | 'loan'); if (err) { s.hud.toast(err); Sfx.play('bad'); return; } m.classList.add('hidden'); s.hud.toast('🔑 Apartamentul e al vostru! Intrați din Blocul Lalelelor'); }));
  m.querySelector('[data-pay]')?.addEventListener('click', () => { const B = bankOf(s.w); const v = Math.min(B.loanLeft, LOAN_RATE * 5); if ((s.w.money ?? 0) < v) { s.hud.toast('Nu ajung banii 💰'); return; } s.op({ k: 'money', delta: -v }); setBank(s, { ...B, loanLeft: B.loanLeft - v }); Sfx.play('coin'); re(); });
}

export function openBoard(s: WorldScene) {
  const qs = questsToday(s), rep = reputation(s.w), L = repLevel(s.w); const next = REP_LEVELS.find(l => l.at > rep);
  const m = s.hud.modal(`<h3>📜 Avizierul satului · ziua ${s.w.day}</h3>
    <p class="sub">Reputația voastră: <b>${L.name}</b> (${rep}${next ? ` / ${next.at} pentru „${next.name}”` : ''}) · ${L.bonus ? `reducere ${Math.round(L.bonus * 100)}% la magazinele din sat și prețuri mai bune la piață` : 'ajutați sătenii ca să primiți reduceri'}${isMarketDay(s.w) ? ' · 🎪 azi e târg!' : ''}</p>
    <div class="shop">${qs.map(q => { const v = VILLAGERS.find(v => v.id === q.who)!; const have = s.w.res?.[q.res] ?? 0; return `<button data-q="${q.id}" class="${q.done ? 'on' : have < q.qty ? 'poor' : ''}"><span><img class="prev" src="${portrait(v.spec)}" alt=""></span><b>${v.name}</b><small>vrea ${questText(q)}</small><small>${q.done ? '✔ gata' : `ai ${have} · 💰 ${q.pay} lei`}</small></button>`; }).join('')}</div>
    <p class="sub">Cererile se schimbă în fiecare dimineață. Poți vorbi și direct cu sătenii pe stradă.</p>`);
  m.querySelectorAll('[data-q]').forEach(el => el.addEventListener('click', () => { const q = questsToday(s).find(x => x.id === (el as HTMLElement).dataset.q)!; const err = deliverQuest(s, q); if (err) { s.hud.toast(err); Sfx.play('bad'); return; } s.hud.toast(`💕 Mulțumesc! +${q.pay} lei`); openBoard(s); }));
}

export function openVillager(s: WorldScene, vid: string) {
  const v = VILLAGERS.find(x => x.id === vid); if (!v) return;
  const fr = s.w.stats['friend-' + vid] ?? 0, lvl = Story.tierOf(s, vid), nextAt = Story.TIERS[lvl];
  const secret = lvl ? Story.SECRETS[vid]?.[lvl - 1] : '';
  const canInvite = s.chapter >= 8 && (s.w.stats.engaged ?? 0) > 0 && !(s.w.stats['invite-' + vid] ?? 0);
  const q = questsToday(s).find(x => x.who === vid);
  const have = q ? s.w.res?.[q.res] ?? 0 : 0;
  const hello = v.hello[Math.floor(Math.random() * v.hello.length)];
  const giftOk = (s.w.res?.flower ?? 0) > 0 && (s.w.stats[`gift-${vid}-${s.w.day}`] ?? 0) < 1;
  const m = s.hud.modal(`<div class="villager"><img src="${portrait(v.spec)}" alt=""><div><h3>${v.name}</h3><p class="sub">${hearts(lvl)} ${Story.tierName(vid, lvl)} (${lvl}/5)${nextAt ? ` · mai ${nextAt - fr} până la treapta următoare` : ''}</p>${secret ? `<p class="sub">🤫 ${secret}</p>` : ''}<p class="say">„${hello}”</p></div></div>
    ${q ? `<p class="sub">${q.done ? '✔ Mi-ați adus azi ce aveam nevoie, mulțumesc!' : `Aș avea nevoie de <b>${questText(q)}</b>. Vă dau <b>${q.pay} lei</b>! (aveți ${have})`}</p>` : '<p class="sub">Azi n-am nevoie de nimic, dar mă bucur să vă văd! 😊</p>'}
    <div class="shop">${q && !q.done ? `<button data-deliver class="${have < q.qty ? 'poor' : ''}"><span>🤝</span><b>Dă-i</b><small>+${q.pay} lei · +prietenie</small></button>` : ''}
      <button data-gift class="${giftOk ? '' : 'poor'}"><span>🌸</span><b>Dăruiește o floare</b><small>o dată pe zi · +prietenie</small></button>${canInvite ? `<button data-invite class="${lvl >= 2 ? '' : 'poor'}"><span>💌</span><b>Invită la nuntă</b><small>${lvl >= 2 ? 'vine cu drag' : 'mai întâi prieteni (treapta 2)'}</small></button>` : ''}</div>`);
  m.querySelector('[data-invite]')?.addEventListener('click', () => { Story.inviteVillager(s, vid); openVillager(s, vid); });
  m.querySelector('[data-deliver]')?.addEventListener('click', () => { const err = deliverQuest(s, q!); if (err) { s.hud.toast(err); Sfx.play('bad'); return; } s.hud.toast(`💕 ${v.name}: „Mulțumesc din suflet!” +${q!.pay} lei`); openVillager(s, vid); });
  m.querySelector('[data-gift]')?.addEventListener('click', () => {
    if (!giftOk) { s.hud.toast((s.w.res?.flower ?? 0) < 1 ? 'N-ai flori 🌸 (culege din curte)' : 'I-ai dăruit deja azi 🙂'); return; }
    s.op({ k: 'res', res: 'flower', delta: -1 }); s.op({ k: 'stat', key: 'friend-' + vid, delta: 1 }); s.op({ k: 'stat', key: `gift-${vid}-${s.w.day}`, delta: 1 });
    Sfx.play('kiss'); s.me.actor.play('love'); s.hud.toast(`🌸 ${v.name} a roșit: „Ce drăguț!”`); openVillager(s, vid);
  });
}
