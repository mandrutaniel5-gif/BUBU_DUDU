// Panoul dezvoltatorului (1.12.0): butonul 🧪 de sus, doar in modul dezvoltator si doar in lumea de test / 2 tab-uri
// (casele online nu se ating: partenerul nu vede nimic). Totul nelimitat, capitole inainte si inapoi, zile si ore,
// viteza timpului, sarbatorile (sari in ziua lor sau pornesti scena direct), drumuri rapide, angajati, cumparaturi, afisaj.
import type { WorldScene } from '../scenes/world';
import { CHAPTERS, chapterOf } from '../game/economy';
import { eventsOf, seasonOf, dayOfSeason, ROLES } from '../scenes/story';
import { SHOWS } from '../minigames/holiday';
import { showName } from '../scenes/holidays';
import { clockText } from '../game/state';
import { ErrorLog } from '../engine/errors';
import { $t } from '../i18n';

type S = WorldScene;
/** ora sarbatorii (cand se poate face) si ziua ei in primul an */
const HOL_AT: Record<string, { day: number; h: number; arg?: any }> = {
  martisor: { day: 1, h: 10 }, paste: { day: 5, h: 10 }, inawed: { day: 6, h: 12 }, bday: { day: 9, h: 18.5, arg: { who: 'bubu' } }, grand: { day: 11, h: 12 },
  fishcontest: { day: 13, h: 12 }, picnic: { day: 13, h: 12 }, loz: { day: 14, h: 10 }, xmastree: { day: 22, h: 10 }, gifts: { day: 24, h: 10 }, colinde: { day: 24, h: 18 },
  santa: { day: 23, h: 12 }, skate: { day: 23, h: 12 }, carusel: { day: 23, h: 12 }, dragobete: { day: 26, h: 10 }, revelion: { day: 28, h: 21.5 },
};

/** sari la ziua si ora data (ceasul jocului; in 2 tab-uri si la celalalt) */
export function setTime(s: S, day: number, h: number) {
  const gm = (Math.max(1, Math.round(day)) - 1) * 1440 + Math.round(h * 60);
  s.w.gameMin = gm; s.w.minutes = gm % 1440; s.w.day = Math.floor(gm / 1440) + 1;
  s.op({ k: 'clock', gameMin: gm });
  s.syncPlaced(); s.hud.refreshGoal();
}
/** capitolul ales: inainte (obiectivele se bifeaza ca la ⏭) sau inapoi (obiectivele capitolelor de dupa se sterg) */
export function goChapter(s: S, n: number) {
  n = Math.max(0, Math.min(CHAPTERS.length - 1, n));
  let guard = 0;
  while (s.chapter < n && guard++ < 12) s.devSkipChapter();
  if (s.chapter > n) {
    for (const c of CHAPTERS) if (c.id >= n) for (const g of c.goals) if (s.w.stats['goal-' + g.id]) s.op({ k: 'stat', key: 'goal-' + g.id, delta: -s.w.stats['goal-' + g.id] });
    s.op({ k: 'stat', key: 'chapter', delta: n - s.chapter });
    s.syncPlaced();
  }
  s.hud.closeModal(); s.hud.refreshGoal(); s.hud.toast(`🧪 ${chapterOf(s.w).title}`);
}

export function openDev(s: S) {
  if (!s.devWorld) { s.hud.toast($t('🧪 Uneltele merg doar în lumea de test (Meniu → ⚙ Setări → 🧪 Lumea de test)')); return; }
  const w = s.w, se = seasonOf(w.day), ev = eventsOf(w.day, w.stats);
  const b = (attr: string, label: string, on = false) => `<button ${attr} class="${on ? 'on' : ''}">${label}</button>`;
  const html = `<h3>${$t('🧪 Dezvoltator')}</h3>
    <p class="sub">${$t('Lumea de test (doar pe telefonul ăsta). Capitolul {0} · Ziua {1} ({2} {3}, ziua {4}) · {5}{6}', s.chapter, w.day, se.icon, se.name, dayOfSeason(w.day), clockText(w.minutes), ev.length ? ' · azi: ' + ev.map(e => e.icon + ' ' + e.name).join(', ') : '')}</p>
    <h4>${$t('Resurse')}</h4><div class="devrow">
      ${b('data-d="inf"', $t('♾️ Totul nelimitat: {0}', s.infinite ? $t('pornit') : $t('oprit')), s.infinite)}
      ${b('data-d="needs"', $t('😊 Nevoi pline, vindecați'))}
      ${b('data-d="buyall"', $t('🛒 Cumpără tot (vehicule, florărie, tâmplărie, apartament)'))}
      ${b('data-d="staff"', $t('🧑‍🌾 Câte un angajat din fiecare meserie'))}
    </div>
    <h4>${$t('Capitolul')}</h4><div class="devrow">${CHAPTERS.map(c => b(`data-ch="${c.id}"`, `${c.id} · ${c.title.split('·')[1]?.trim() ?? ''}`, c.id === s.chapter)).join('')}</div>
    <h4>${$t('Timpul')}</h4><div class="devrow">
      ${b('data-day="-1"', $t('◀ Ziua −1'))}${b('data-day="1"', $t('Ziua +1 ▶'))}${b('data-day="7"', $t('+7 zile (alt anotimp)'))}
      <label class="devday">${$t('Ziua')} <input name="devday" type="number" min="1" value="${w.day}" /><button data-d="goday">${$t('Du-mă')}</button></label>
    </div><div class="devrow">${[7, 10, 12, 15, 18, 20, 23].map(h => b(`data-h="${h}"`, `${h}:00`)).join('')}</div>
    <div class="devrow">${[1, 5, 20, 60].map(k => b(`data-spd="${k}"`, `⏩ ×${k}`, s.devSpeed === k)).join('')}</div>
    <h4>${$t('Sărbătorile')}</h4><div class="devrow">${Object.keys(SHOWS).map(id => `<span class="devhol">${showName(id)} ${b(`data-hday="${id}"`, $t('📅 ziua ei'))}${b(`data-hplay="${id}"`, $t('▶ acum'))}</span>`).join('')}</div>
    <h4>${$t('Drumuri rapide')}</h4><div class="devrow">${[[/*ro*/'home', $t('🏡 Acasă')], [/*ro*/'forest', $t('🌲 Pădurea')], ['village', '🏘️ Satul'], [/*ro*/'city', $t('🏙️ Orașul')], ['apartment', '🛋️ Apartamentul']].map(([k, l]) => b(`data-go="${k}"`, l)).join('')}</div>
    <h4>${$t('Afișaj și date')}</h4><div class="devrow">
      ${b('data-d="overlay"', $t('📊 FPS și poziția: {0}', s.devOverlay ? $t('pornit') : $t('oprit')), s.devOverlay)}
      ${b('data-d="copy"', $t('📋 Copiază lumea (JSON)'))}
      ${b('data-d="errs"', $t('🐞 Erori: {0}', ErrorLog.all().length))}
    </div>`;
  const m = s.hud.modal(html); m.classList.add('devpanel');
  const on = (sel: string, fn: (el: HTMLElement) => void) => m.querySelectorAll(sel).forEach(el => el.addEventListener('click', () => fn(el as HTMLElement)));
  const again = () => openDev(s);
  on('[data-d="inf"]', () => { s.setInfinite(!s.infinite); again(); });
  on('[data-d="needs"]', () => { for (const p of [s.me, s.partner]) { if (p.control === 'remote') continue; const c = s.w.chars[p.id]; for (const k of Object.keys(c.needs)) s.op({ k: 'need', who: p.id, need: k, delta: 100 }); if (c.sick) s.op({ k: 'sick', who: p.id, value: null }); } s.hud.toast($t('😊 Nevoi pline')); });
  on('[data-d="buyall"]', () => { for (const k of ['bike', 'scooter', 'florarie', 'workshop', 'apartment', 'truck']) if (!s.w.stats[k]) s.op({ k: 'stat', key: k, delta: 1 }); s.syncPlaced(); s.hud.toast($t('🛒 Cumpărate')); });
  on('[data-d="staff"]', () => { const list = Object.keys(ROLES).map((role, i) => ({ id: 'dev-' + role, name: 'Test ' + (i + 1), role, wage: 0, skill: 3, unpaid: 0, days: 0 })); s.op({ k: 'town', key: 'staff', value: list }); s.syncWalkers(); s.hud.toast($t('🧑‍🌾 Angajați (salariu 0)')); });
  on('[data-ch]', el => goChapter(s, Number(el.dataset.ch)));
  on('[data-day]', el => { setTime(s, s.w.day + Number(el.dataset.day), s.w.minutes / 60); again(); });
  on('[data-d="goday"]', () => { setTime(s, Number((m.querySelector('[name=devday]') as HTMLInputElement).value) || 1, s.w.minutes / 60); again(); });
  on('[data-h]', el => { setTime(s, s.w.day, Number(el.dataset.h)); again(); });
  on('[data-spd]', el => { s.devSpeed = Number(el.dataset.spd); again(); });
  on('[data-hday]', el => { const at = HOL_AT[el.dataset.hday!]; if (!at) return; if (el.dataset.hday === 'inawed') s.op({ k: 'stat', key: 'inaWedDay', delta: at.day - (s.w.stats.inaWedDay ?? 0) }); setTime(s, at.day, at.h); s.hud.closeModal(); s.hud.toast($t('📅 Ziua {0}, {1}: {2}', at.day, clockText(at.h * 60), showName(el.dataset.hday!))); });
  on('[data-hplay]', el => { const id = el.dataset.hplay!; s.hud.closeModal(); s.playHoliday(id, true, HOL_AT[id]?.arg ?? null); });
  on('[data-go]', el => { s.hud.closeModal(); s.debugGo(el.dataset.go!, 'duo'); });
  on('[data-d="overlay"]', () => { s.devOverlay = !s.devOverlay; again(); });
  on('[data-d="copy"]', el => { navigator.clipboard?.writeText(JSON.stringify(s.w)).then(() => { el.textContent = '✔ Copiat'; }).catch(() => {}); });
  on('[data-d="errs"]', el => { navigator.clipboard?.writeText(ErrorLog.text()).then(() => { el.textContent = $t('✔ Erorile copiate'); }).catch(() => {}); });
}

/** sus in stanga: FPS, pozitia, zona, capitolul, ziua (pentru teste) */
export function drawDevOverlay(s: S, ctx: CanvasRenderingContext2D, fps: number) {
  const t = [`${fps.toFixed(0)} fps · ×${s.devSpeed}`, `${s.me.gx.toFixed(1)}, ${s.me.gy.toFixed(1)} · ${s.area}`, `cap. ${s.chapter} · ziua ${s.w.day} · ${clockText(s.w.minutes)}`];
  ctx.save(); ctx.font = '700 12px monospace'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(8, s.game.h - 66, 230, 58);
  ctx.fillStyle = '#7CFC9A'; t.forEach((l, i) => ctx.fillText(l, 14, s.game.h - 50 + i * 16)); ctx.restore();
}
