// Ecranul de start (1.12.0): Online (casele voastre, cine e in fiecare) sau Offline (singur, pe telefonul asta).
import { DEV, DEV_ROOM, unlockDev, lockDev } from '../game/dev';
import { Actor } from '../char/actor';
import { Fx } from '../char/fx';
import { Sfx } from '../engine/sfx';
import { isEco } from '../engine/game';
import { ErrorLog } from '../engine/errors';
import { Bugs } from '../engine/bugs';
import pkg from '../../package.json';
import { Settings, OFFLINE_ROOM, deviceId, type SavedHouse } from '../game/settings';
import { GAME_NAME, cleanName } from '../game/names';
import type { Scene, Game } from '../engine/game';
import type { NetConfig } from '../net/types';
import type { CharId } from '../char/draw';
import { createHouse, joinHouse, normCode, watchSeats, type Seats } from '../net/house';
import { seatTaken } from '../net/adapters';
import { $t, LANGS, lang, setLang, type Lang } from '../i18n';

// 1.13.0: personajele nu mai au nume fixe. Pana se stie numele (din salvare), scrie cine e: ea (hamsterita alba) / el (hamsterul auriu)
const ROLE: Record<CharId, string> = { bubu: $t('Ea (hamsterița)'), dudu: $t('El (hamsterul)') } as Record<CharId, string>;
/** numele din salvarea casei de pe telefonul asta (al tau si al partenerului, daca a intrat vreodata) */
function houseNames(room: string): Partial<Record<CharId, string>> {
  try { const raw = localStorage.getItem('bd-save-' + room); if (!raw) return {}; const w = JSON.parse(JSON.parse(raw).json); return { bubu: cleanName(w?.chars?.bubu?.name), dudu: cleanName(w?.chars?.dudu?.name) }; } catch { return {}; }
}
const label = (w: CharId, room?: string) => (room && houseNames(room)[w]) || ROLE[w];
const ICON: Record<CharId, string> = { bubu: '🐹', dudu: '🐹' } as Record<CharId, string>;
const other = (w: CharId): CharId => (w === 'bubu' ? 'dudu' : 'bubu');
const esc = (t: string) => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
/** ce scrie pe cartonasul casei (din salvarea de pe telefon): capitolul si ziua */
function saveInfo(room: string): string {
  try { const raw = localStorage.getItem('bd-save-' + room); if (!raw) return $t('Încă n-ați jucat pe telefonul ăsta'); const w = JSON.parse(JSON.parse(raw).json); return `Capitolul ${w?.stats?.chapter ?? 0} · Ziua ${w?.day ?? 1}`; }
  catch { return ''; }
}

export class MenuScene implements Scene {
  /** meniul nu are nevoie de mai mult de 30 de cadre pe secunda */
  wantFps() { return 30; }
  fx = new Fx();
  bubu = new Actor('bubu', this.fx);
  dudu = new Actor('dudu', this.fx);
  ui!: HTMLElement;
  t = 0; nextEmote = 1.5;
  /** cine e acum in fiecare casa (camera -> locuri) */
  seats = new Map<string, { s: Seats; now: () => number }>();
  private unwatch: (() => void) | null = null;
  tab: 'online' | 'offline' = 'online';

  constructor(private game: Game) {}

  enter() {
    const s = Settings.get();
    // jocul e facut pentru doi: un jucator nou vede intai Online (cu explicatia); cine a jucat ultima oara Offline revine acolo
    const hasOffline = (() => { try { return !!localStorage.getItem('bd-save-' + OFFLINE_ROOM); } catch { return false; } })();
    this.tab = s.net.mode === 'solo' && s.net.room === OFFLINE_ROOM && hasOffline && !(s.houses ?? []).length ? 'offline' : 'online';
    this.ui = document.createElement('div');
    this.ui.className = 'menu';
    this.ui.innerHTML = `
      <div class="menu-card">
        <h1>${GAME_NAME.includes(' & ') ? GAME_NAME.split(' & ').map(esc).join(' <span>&</span> ') : esc(GAME_NAME)}</h1>
        <p class="tag">${$t('Căsuța noastră 🏡💕')}</p>
        <label class="myname">${$t('Numele tău')} <input name="myname" maxlength="14" autocomplete="nickname" placeholder="${$t('ex. Ana')}" value="${esc(cleanName(s.myName))}" /></label>
        <div class="tabs2">
          <button data-tab="online">${$t('🌍 Online')}<small>${$t('cu partenerul')}</small></button>
          <button data-tab="offline">${$t('📴 Offline')}<small>${$t('singur, fără internet')}</small></button>
        </div>
        <div class="pane p-online">
          <div class="houses"></div>
          <div class="row2 hbtns"><button class="h-new">${$t('✨ Casă nouă')}</button><button class="h-joinopen">${$t('🔑 Intră la partener')}</button></div>
        </div>
        <div class="pane p-offline">
          <p class="sub2">${$t('Joci pe telefonul ăsta. Partenerul e jucat de calculator.')}</p>
          <div class="who2">
            <button data-who="bubu">🐹<b>${$t('Ea')}</b><small>${$t('hamsterița albă')}</small></button>
            <button data-who="dudu">🐹<b>${$t('El')}</b><small>${$t('hamsterul auriu')}</small></button>
          </div>
          <label class="myname">${$t('Numele partenerului')} <input name="pname" maxlength="14" placeholder="${$t('ex. Mihai')}" value="${esc(cleanName(s.partnerName))}" /></label>
          <button class="play">${$t('▶ Joacă')}</button>
          <div class="row2"><button class="reset">${$t('🔄 Joc nou (Offline)')}</button></div>
        </div>
        <div class="row2"><button class="export" title="${$t('Salvează progresul într-un fișier')}">${$t('💾 Salvează')}</button><button class="import" title="${$t('Încarcă progresul dintr-un fișier')}">${$t('📂 Încarcă')}</button><button class="more">${$t('⚙ Setări')}</button></div>
        <p class="ver">${$t('v{0} · făcut cu 💕 pentru noi doi', pkg.version)}</p>
      </div>`;
    document.getElementById('ui')!.appendChild(this.ui);
    this.showTab(this.tab);
    this.ui.addEventListener('click', e => this.onClick(e));
    // numele: se salveaza cum scrii (doar litere, cifre, spatiu, cratima)
    this.ui.querySelector('[name=myname]')!.addEventListener('input', e => { Settings.set({ myName: cleanName((e.target as HTMLInputElement).value) }); this.renderHouses(); });
    this.ui.querySelector('[name=pname]')!.addEventListener('input', e => Settings.set({ partnerName: cleanName((e.target as HTMLInputElement).value) }));
    Sfx.setMuted(s.muted);
    // mesaj lasat de joc (ex. „Bubu e deja in casa pe alt telefon”)
    try { const m = sessionStorage.getItem('bd-menu-msg'); if (m) { sessionStorage.removeItem('bd-menu-msg'); setTimeout(() => this.notice($t('🚪 Locul e ocupat'), m), 200); } } catch { /* */ }
  }
  exit() { this.unwatch?.(); this.unwatch = null; this.ui.remove(); }

  // ------------------------------------------------------------------ taburile
  showTab(t: 'online' | 'offline') {
    this.tab = t;
    this.ui.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', (b as HTMLElement).dataset.tab === t));
    this.ui.querySelector('.p-online')!.classList.toggle('hidden', t !== 'online');
    this.ui.querySelector('.p-offline')!.classList.toggle('hidden', t !== 'offline');
    const who = Settings.get().who;
    this.ui.querySelectorAll('[data-who]').forEach(x => x.classList.toggle('on', (x as HTMLElement).dataset.who === who));
    if (t === 'online') { this.renderHouses(); this.watch(); }
  }
  /** urmarim cine e in fiecare casa din lista (Firebase) */
  watch() {
    this.unwatch?.();
    const rooms = (Settings.get().houses ?? []).map(h => h.room);
    this.unwatch = rooms.length ? watchSeats(rooms, (room, s, now) => { this.seats.set(room, { s, now }); this.renderHouses(); }) : null;
  }
  /** starea unui loc: 'busy' = e cineva acum (alt telefon), 'free', '?' = nu stim (serverul nostru / fara internet) */
  seatState(h: SavedHouse, w: CharId): 'busy' | 'free' | '?' {
    const x = this.seats.get(h.room); if (!x) return '?';
    return seatTaken(x.s[w as 'bubu' | 'dudu'], deviceId(), x.now()) ? 'busy' : 'free';
  }
  renderHouses() {
    const box = this.ui.querySelector('.houses') as HTMLElement | null; if (!box) return;
    const list = Settings.get().houses ?? [];
    if (!list.length) {
      box.innerHTML = `<div class="hempty"><b>${$t('Nu aveți încă o casă.')}</b><br>${$t('Unul dintre voi apasă')} <b>${$t('✨ Casă nouă')}</b> ${$t('și îi spune celuilalt codul și parola. Celălalt apasă')} <b>${$t('🔑 Intră la partener')}</b>.</div>`;
      return;
    }
    box.innerHTML = list.map(h => {
      const n = (['bubu', 'dudu'] as CharId[]).filter(w => this.seatState(h, w) === 'busy').length;
      const known = this.seats.has(h.room);
      // 1.12.1: personajele doar se aleg (cine esti); in casa intri cu butonul mare „▶ Intră”
      const pick = this.pickOf(h);
      const seat = (w: CharId) => {
        const st = this.seatState(h, w);
        const sub = st === 'busy' ? $t('🟢 e în joc') : pick === w ? $t('✔ tu') : $t('liber');
        return `<button data-seat="${w}" data-room="${h.room}" class="${st === 'busy' ? 'busy' : ''} ${pick === w ? 'mine' : ''}">${ICON[w]} ${esc(label(w, h.room))}<small>${sub}</small></button>`;
      };
      return `<div class="hcard"><div class="hc-top"><b>🏠 ${esc(h.code)}</b><small>${esc(saveInfo(h.room))}</small>
        <span class="hc-n" title="${$t('Câți sunteți acum în casă')}">${known ? `${n}/2` : '·/2'}</span><button class="hc-x" data-forget="${h.room}" title="${$t('Scoate casa din listă')}">✕</button></div>
        <div class="hc-seats">${seat('bubu')}${seat('dudu')}</div>
        <button class="hc-enter" data-enter="${h.room}" ${pick ? '' : 'disabled'}>${pick ? $t('▶ Intră ca {0}', esc(pick === h.who && cleanName(Settings.get().myName) ? cleanName(Settings.get().myName) : label(pick, h.room))) : $t('Casa e plină')}</button></div>`;
    }).join('');
  }

  // ------------------------------------------------------------------ apasari
  onClick(e: Event) {
    const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null; if (!b) return;
    Sfx.unlock(); Sfx.play('click');
    const d = b.dataset;
    if (d.tab) { this.showTab(d.tab as 'online' | 'offline'); return; }
    if (d.who) { Settings.set({ who: d.who as CharId }); this.showTab('offline'); (d.who === 'bubu' ? this.bubu : this.dudu).play('wave'); return; }
    if (d.seat) { this.pickSeat(d.room!, d.seat as CharId); return; }
    if (d.enter) { const h = (Settings.get().houses ?? []).find(x => x.room === d.enter); const w = h && this.pickOf(h); if (h && w) this.enterHouse(h, w); return; }
    if (d.forget) { this.askForget(d.forget); return; }
    if (d.join2) { this.enterHouse(JSON.parse(d.join2), d.as as CharId); return; }
    const c = b.classList;
    if (c.contains('h-new')) { this.showCreate(); return; }
    if (c.contains('h-joinopen')) { this.showJoin(); return; }
    if (c.contains('h-create')) { this.doCreate(b); return; }
    if (c.contains('h-join')) { this.doJoin(b); return; }
    if (c.contains('h-copy')) { const code = Settings.get().net.code ?? ''; navigator.clipboard?.writeText(code).then(() => { b.textContent = '✔ Copiat'; }).catch(() => {}); return; }
    if (c.contains('h-play')) { this.playHouse(); return; }
    if (c.contains('play')) { this.playOffline(); return; }
    if (c.contains('xcred')) { this.ui.querySelector('.cred')?.remove(); return; }
    if (c.contains('more')) { this.showSettings(); return; }
    if (c.contains('credits')) { this.showCredits(); return; }
    if (c.contains('errs')) { this.showErrors(); return; }
    if (c.contains('errcopy')) { const t = `${GAME_NAME} v${pkg.version} · ${navigator.userAgent}\n` + ErrorLog.text(); navigator.clipboard?.writeText(t).then(() => { b.textContent = '✔ Copiat'; }).catch(() => { b.textContent = $t('Ține apăsat pe text → Copiază'); }); return; }
    if (c.contains('errclear')) { ErrorLog.clear(); this.showErrors(); return; }
    if (c.contains('eco')) { const on = !isEco(); Settings.set({ eco: on }); b.textContent = on ? $t('🔋 Eco: pornit') : $t('⚡ Eco: oprit'); dispatchEvent(new Event('resize')); return; }
    if (c.contains('mute')) { const m = !Settings.get().muted; Settings.set({ muted: m }); Sfx.setMuted(m); b.textContent = m ? $t('🔇 Sunet: oprit') : $t('🔊 Sunet: pornit'); return; }
    if (c.contains('studio')) { this.game.go('studio'); return; }
    if (c.contains('export')) { this.exportSave(b); return; }
    if (c.contains('import')) { this.importSave(); return; }
    if (c.contains('reset')) { this.resetOffline(b); return; }
    if (c.contains('devlocal')) { Settings.set({ net: { ...Settings.get().net, mode: 'local', room: 'test-local', code: undefined } }); this.game.go('world'); return; }
    if (c.contains('devworld')) { Settings.set({ net: { ...Settings.get().net, mode: 'solo', room: DEV_ROOM, code: undefined } }); this.game.go('world'); return; }
    if (c.contains('devreset')) { if (confirm($t('Ștergi lumea de test și o iei de la capăt?'))) { try { localStorage.removeItem('bd-save-' + DEV_ROOM); } catch { /* */ } b.textContent = $t('✔ Ștearsă'); } return; }
    if (c.contains('tester')) { const v = !(localStorage.getItem('bd-tester') === '1'); Bugs.setOn(v); b.textContent = v ? $t('🐞 Mod tester: pornit') : $t('🐞 Pornește modul tester'); Sfx.play(v ? 'good' : 'click'); return; }
    if (c.contains('bugs')) { this.showBugs(); return; }
    if (c.contains('bugexp')) { Bugs.exportFile(); return; }
    if (c.contains('bugup')) { b.textContent = $t('Se trimite…'); Bugs.upload().then(() => { const n = Bugs.all().filter(r => !r.up).length; b.textContent = n ? $t('☁️ {0} n-au ajuns (fără internet sau fără reguli)', n) : $t('✔ Toate au ajuns'); }); return; }
    if (c.contains('bugclr')) { if (confirm($t('Ștergi toate rapoartele de pe telefon?'))) { Bugs.clear(); this.showBugs(); } return; }
    if (c.contains('devoff')) { lockDev(); location.reload(); return; }
    if (c.contains('devok')) { const inp = this.ui.querySelector('[name=devcode]') as HTMLInputElement; if (unlockDev(inp.value)) { Sfx.play('good'); location.reload(); } else { Sfx.play('bad'); inp.value = ''; inp.placeholder = $t('Cod greșit'); } return; }
  }

  // ------------------------------------------------------------------ Offline
  playOffline() {
    if (this.needName()) return;
    const n = Settings.get().net;
    Settings.set({ net: { ...n, mode: 'solo', room: OFFLINE_ROOM, code: undefined } });
    this.game.go('world');
  }
  resetOffline(b: HTMLButtonElement) {
    if (!confirm($t('Începi un joc nou Offline?\n\nSe șterge progresul Offline de pe telefonul ăsta și o iei de la Capitolul 0. Casele voastre online nu se schimbă.'))) return;
    try { localStorage.removeItem('bd-save-' + OFFLINE_ROOM); } catch { /* */ }
    Sfx.play('good'); b.textContent = $t('✔ Șters!'); setTimeout(() => (b.textContent = $t('🔄 Joc nou (Offline)')), 1500);
  }

  // ------------------------------------------------------------------ Online: intri intr-o casa din lista
  pickSeat(room: string, w: CharId) {
    const h = (Settings.get().houses ?? []).find(x => x.room === room); if (!h) return;
    if (this.seatState(h, w) === 'busy') {
      const o = other(w);
      this.notice($t('{0} {1} e deja în casă', ICON[w], esc(label(w, h.room))), $t('Cineva joacă acum cu personajul ăsta în casa {0}. Doi oameni nu pot fi același personaj.', h.code),
        this.seatState(h, o) !== 'busy' ? `<button data-join2='${esc(JSON.stringify(h))}' data-as="${o}">${$t('{0} Intră ca {1}', ICON[o], esc(label(o, h.room)))}</button>` : '');
      Sfx.play('bad'); return;
    }
    this.picked.set(room, w); this.renderHouses();
  }
  /** cine esti in casa asta: ce ai ales acum, altfel ultimul personaj; daca e ocupat, celalalt (null = casa plina) */
  picked = new Map<string, CharId>();
  pickOf(h: SavedHouse): CharId | null {
    const want = this.picked.get(h.room) ?? h.who;
    if (this.seatState(h, want) !== 'busy') return want;
    const o = other(want); return this.seatState(h, o) !== 'busy' ? o : null;
  }
  /** fara nume nu intri: cerem numele (o singura data, ramane salvat) */
  needName(): boolean {
    if (cleanName(Settings.get().myName)) return false;
    const inp = this.ui.querySelector('[name=myname]') as HTMLInputElement; this.ui.querySelector('.cred')?.remove();
    inp.classList.add('need'); inp.focus(); inp.placeholder = $t('Scrie-ți numele aici'); Sfx.play('bad');
    return true;
  }
  enterHouse(h: SavedHouse, w: CharId) {
    if (this.needName()) return;
    Settings.rememberHouse({ code: h.code, room: h.room, who: w, mode: 'firebase' });
    const n = Settings.get().net;
    Settings.set({ who: w, net: { ...n, mode: 'firebase', room: h.room, code: h.code }, resetAt: 0 });
    this.game.go('world');
  }
  /** dupa „Casa e gata”: intri in casa abia facuta */
  playHouse() { const h = (Settings.get().houses ?? [])[0]; if (h) this.enterHouse(h, h.who); }
  askForget(room: string) {
    const h = (Settings.get().houses ?? []).find(x => x.room === room); if (!h) return;
    if (!confirm($t('Scoți casa {0} din listă?\n\nProgresul rămâne în cloud: intrați din nou oricând cu codul și parola.', h.code))) return;
    Settings.forgetHouse(room); this.seats.delete(room); this.watch(); this.renderHouses();
  }

  // ------------------------------------------------------------------ ferestre
  private dialog(html: string, cls = '') {
    this.ui.querySelector('.cred')?.remove();
    const d = document.createElement('div'); d.className = 'cred ' + cls;
    d.innerHTML = `<div class="cred-in">${html}</div>`;
    this.ui.appendChild(d); return d;
  }
  notice(title: string, text: string, extra = '') { this.dialog(`<h3>${title}</h3><p class="sub">${text}</p><div class="row2">${extra}<button class="xcred">${$t('Închide')}</button></div>`); }
  private whoPick(name: string, sel: CharId, busy: Partial<Record<CharId, boolean>> = {}) {
    return `<div class="who2 small">${(['bubu', 'dudu'] as CharId[]).map(w => `<label class="${busy[w] ? 'busy' : ''}"><input type="radio" name="${name}" value="${w}" ${sel === w && !busy[w] ? 'checked' : ''} ${busy[w] ? 'disabled' : ''}/> ${ICON[w]} ${ROLE[w]}${busy[w] ? ` <small>${$t('🟢 e în joc')}</small>` : ''}</label>`).join('')}</div>`;
  }
  showCreate() {
    const hasOffline = (() => { try { return !!localStorage.getItem('bd-save-' + OFFLINE_ROOM); } catch { return false; } })();
    this.dialog(`<h3>${$t('✨ Casă nouă')}</h3>
      <p class="sub">${$t('Casa e lumea voastră comună. Jocul îi dă un cod; voi alegeți parola. Partenerul intră cu același cod și aceeași parolă.')}</p>
      <div class="house-box"><label>${$t('Cine ești tu în casa asta?')}</label>${this.whoPick('hwho', Settings.get().who)}
        <label>${$t('Alege o parolă (cel puțin 4 caractere)')}<input name="hpass" type="password" autocomplete="new-password" maxlength="40" /></label>
        ${hasOffline ? `<label class="chk"><input type="checkbox" name="hmove" /> ${$t('Mută aici progresul din jocul Offline')}</label>` : ''}
        <button type="button" class="h-create">${$t('✨ Creează casa')}</button></div>
      <p class="house-msg"></p><div class="row2"><button class="xcred">${$t('Închide')}</button></div>`, 'house');
  }
  showJoin() {
    this.dialog(`<h3>${$t('🔑 Intră în casa partenerului')}</h3>
      <p class="sub">${$t('Scrie codul și parola pe care ți le-a dat partenerul. Casa rămâne apoi în listă: data viitoare doar o atingi.')}</p>
      <div class="house-box"><label>${$t('Codul casei')}<input name="hcode" placeholder="${$t('LALEA-7K3P')}" maxlength="14" autocapitalize="characters" /></label>
        <label>${$t('Parola')}<input name="hjpass" type="password" autocomplete="current-password" maxlength="40" /></label>
        <button type="button" class="h-join">${$t('🔑 Caută casa')}</button></div>
      <p class="house-msg"></p><div class="row2"><button class="xcred">${$t('Închide')}</button></div>`, 'house');
  }
  /** casa e gata: codul mare, de spus partenerului, si un singur buton: intrati in joc */
  showReady(code: string, sub: string) {
    this.dialog(`<h3>${$t('✅ Casa e gata!')}</h3><div class="house-code">${esc(code)}</div><p class="sub">${sub}</p>
      <div class="row2"><button type="button" class="h-copy">${$t('📋 Copiază codul')}</button><button type="button" class="h-play">${$t('▶ Intrăm în joc')}</button></div>`, 'house');
  }
  private houseMsg(t: string, ok = false) { const m = this.ui.querySelector('.house-msg') as HTMLElement | null; if (m) { m.textContent = t; m.classList.toggle('ok', ok); } }
  private async doCreate(b: HTMLButtonElement) {
    const pass = (this.ui.querySelector('[name=hpass]') as HTMLInputElement).value;
    const who = ((this.ui.querySelector('[name=hwho]:checked') as HTMLInputElement | null)?.value ?? Settings.get().who) as CharId;
    const move = (this.ui.querySelector('[name=hmove]') as HTMLInputElement | null)?.checked ?? false;
    b.disabled = true; this.houseMsg($t('Se face casa…'));
    const net: NetConfig = { ...Settings.get().net, mode: 'firebase' };
    let seed: { json: string; ts: number } | null = null;
    if (move) { try { const raw = localStorage.getItem('bd-save-' + OFFLINE_ROOM); if (raw) seed = JSON.parse(raw); } catch { /* */ } }
    const r = await createHouse(net, pass, seed);
    b.disabled = false;
    if (!r.ok) { this.houseMsg('❌ ' + r.msg); Sfx.play('bad'); return; }
    if (seed) try { localStorage.setItem(`bd-save-${r.room}`, JSON.stringify({ json: seed.json, ts: Date.now() })); } catch { /* */ }
    Settings.rememberHouse({ code: r.code, room: r.room, who, mode: 'firebase' });
    Settings.set({ who, net: { ...Settings.get().net, code: r.code } });
    Sfx.play('good');
    const o = other(who);
    this.showReady(r.code, $t('Spune-i {0} codul și parola: {1} „🔑 Intră la partener”. Casa rămâne în lista voastră.', o === 'dudu' ? 'partenerului' : 'partenerei', o === 'dudu' ? $t('el apasă') : $t('ea apasă')));
  }
  private async doJoin(b: HTMLButtonElement) {
    const code = normCode((this.ui.querySelector('[name=hcode]') as HTMLInputElement).value), pass = (this.ui.querySelector('[name=hjpass]') as HTMLInputElement).value;
    b.disabled = true; this.houseMsg($t('Caut casa…'));
    const r = await joinHouse({ ...Settings.get().net, mode: 'firebase' }, code, pass);
    b.disabled = false;
    if (!r.ok) { this.houseMsg('❌ ' + r.msg); Sfx.play('bad'); return; }
    // casa e gasita: alegi cine esti (locul ocupat nu se poate alege)
    const h: SavedHouse = { code: r.code, room: r.room, who: Settings.get().who, mode: 'firebase', at: Date.now() };
    Settings.rememberHouse(h); Sfx.play('good');
    this.seats.delete(h.room);
    const ask = () => {
      const busy = { bubu: this.seatState(h, 'bubu') === 'busy', dudu: this.seatState(h, 'dudu') === 'busy' } as Record<CharId, boolean>;
      const free = (['bubu', 'dudu'] as CharId[]).filter(w => !busy[w]);
      const pref = free.includes(Settings.get().who) ? Settings.get().who : free[0];
      if (!free.length) { this.notice($t('🏠 Casa e plină'), $t('În casa {0} sunt deja amândoi. Casa a rămas în listă: intrați când se eliberează un loc.', h.code)); this.showTab('online'); return; }
      this.dialog(`<h3>${$t('🏠 Casa {0}', esc(h.code))}</h3><p class="sub">${$t('Cine ești tu? {0}', busy.bubu || busy.dudu ? $t('Locul ocupat e al partenerului, care e acum în joc.') : '')}</p>
        <div class="row2">${free.map(w => `<button data-join2='${esc(JSON.stringify(h))}' data-as="${w}" class="${w === pref ? 'on' : ''}">${ICON[w]} Intru ca ${esc(label(w, h.room))}</button>`).join('')}</div>
        <div class="row2"><button class="xcred">${$t('Mai târziu')}</button></div>`, 'house');
    };
    this.showTab('online');
    this.houseMsg($t('Mă uit cine e în casă…')); setTimeout(ask, 1200);
  }
  showSettings() {
    const s = Settings.get();
    this.dialog(`<h3>${$t('⚙ Setări')}</h3>
      <div class="row2 langrow"><label>🌐 ${$t('Limba')} <select class="lang">${LANGS.map(l => `<option value="${l.id}"${l.id === lang ? ' selected' : ''}>${l.flag} ${l.name}</option>`).join('')}</select></label></div>
      <div class="row2"><button class="mute">${s.muted ? $t('🔇 Sunet: oprit') : $t('🔊 Sunet: pornit')}</button><button class="eco" title="${$t('Economisire baterie: mai puține cadre pe secundă când stați')}">${isEco() ? $t('🔋 Eco: pornit') : $t('⚡ Eco: oprit')}</button></div>
      <div class="row2"><button class="errs" title="${$t('Erorile jocului (le poți copia și trimite)')}">${$t('📋 Erori ({0})', ErrorLog.all().length)}</button><button class="credits">${$t('📜 Credite')}</button></div>
      ${DEV ? `<div class="devbox"><h4>${$t('🧪 Modul dezvoltator')}</h4><p class="sub">${$t('Uneltele (totul nelimitat, capitole, zile, sărbători) merg doar în lumea de test: nu se scrie nimic în casele voastre online.')}</p>
        <div class="row2"><button class="devworld">${$t('🧪 Lumea de test')}</button><button class="devlocal">${$t('👥 Test în 2 tab-uri')}</button></div>
        <div class="row2"><button class="studio">${$t('🎬 Studio')}</button><button class="devreset">${$t('🗑️ Șterge lumea de test')}</button><button class="devoff">${$t('🔒 Oprește')}</button></div></div>` : ''}
      ${Bugs.on() || Bugs.count() ? `<div class="row2"><button class="bugs">${$t('🐞 Rapoarte de la testeri ({0})', Bugs.count())}</button></div>` : ''}
      <p class="vtap">${esc(GAME_NAME)} v${pkg.version}</p>
      <div class="devcode hidden"><input name="devcode" type="password" placeholder="${$t('Cod dezvoltator')}" autocomplete="off" /><button class="devok">${$t('OK')}</button>
        <button class="tester">${Bugs.on() ? $t('🐞 Mod tester: pornit') : $t('🐞 Pornește modul tester')}</button></div>
      <div class="row2"><button class="xcred">${$t('Închide')}</button></div>`);
    // ascuns: atingi de 5 ori versiunea si apare locul pentru cod
    // limba: se tine minte si jocul porneste din nou in ea (din meniu; casa si salvarile raman)
    (this.ui.querySelector('select.lang') as HTMLSelectElement | null)?.addEventListener('change', e => setLang((e.target as HTMLSelectElement).value as Lang));
    let taps = 0; const v = this.ui.querySelector('.vtap') as HTMLElement;
    v.addEventListener('click', () => { if (++taps >= 5 && !DEV) this.ui.querySelector('.devcode')!.classList.remove('hidden'); });
  }
  /** salvarea jocului de acum (ultima casa / Offline) intr-un fisier .json */
  exportSave(b: HTMLButtonElement) {
    const room = this.tab === 'offline' ? OFFLINE_ROOM : ((Settings.get().houses ?? [])[0]?.room ?? OFFLINE_ROOM);
    const raw = localStorage.getItem(`bd-save-${room}`);
    if (!raw) { this.notice($t('💾 Nimic de salvat'), $t('Încă nu există o salvare pe telefonul ăsta. Intră în joc o dată.')); return; }
    const blob = new Blob([JSON.stringify({ app: 'bubu-dudu', room, save: JSON.parse(raw) })], { type: 'application/json' });
    const name = `BubuDudu-salvare-${room === OFFLINE_ROOM ? 'offline' : ((Settings.get().houses ?? [])[0]?.code ?? 'casa')}-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([blob], name, { type: 'application/json' });
    const nav = navigator as any;
    if (nav.canShare?.({ files: [file] })) nav.share({ files: [file], title: 'Salvare ' + GAME_NAME }).catch(() => {});
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    b.textContent = '✔ Salvat'; setTimeout(() => (b.textContent = $t('💾 Salvează')), 1600);
  }
  /** fisierul intra in jocul Offline; de acolo il mutati intr-o casa noua („Muta aici progresul din Offline”) */
  importSave() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const f = inp.files?.[0]; if (!f) return;
      try {
        const d = JSON.parse(await f.text()); const save = d.save ?? d; if (!save?.json) throw new Error('format');
        localStorage.setItem('bd-save-' + OFFLINE_ROOM, JSON.stringify({ json: save.json, ts: Date.now() }));
        this.showTab('offline');
        this.notice($t('📂 Salvarea a fost încărcată'), `${$t('A intrat în jocul')} <b>${$t('Offline')}</b>${$t('. Ca s-o jucați în doi: Online → ✨ Casă nouă → bifează „Mută aici progresul din Offline”.')}`);
      } catch { this.notice($t('📂 Fișier greșit'), $t('Fișierul nu e o salvare {0}.', esc(GAME_NAME))); }
    };
    inp.click();
  }
  /** rapoartele adunate (modul tester): poza, ce e gresit, unde; le trimiti ca fisier sau pe internet */
  showBugs() {
    const list = Bugs.all().slice().reverse();
    const e2 = (t: string) => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
    const kind = { eroare: $t('💥 Eroare'), auto: $t('🔎 Găsit automat'), tester: $t('🐞 Tester') } as Record<string, string>;
    this.dialog(`<h3>${$t('🐞 Rapoarte ({0})', list.length)}</h3><p class="sub">${$t('Modul tester strânge singur erorile și problemele vizuale; testerul adaugă cu 🐞 ce vede. Trimite-mi fișierul (se deschide cu tools/erori.html).')}</p>
      <div class="buglist">${list.map(r => `<div class="bi">${/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(r.shot ?? '') ? `<img src="${r.shot}" alt="">` : ''}<div><b>${kind[r.kind] ?? r.kind} · ${e2(r.cat)}</b>${e2(r.title)}<br><small>${new Date(r.ts).toLocaleString('ro-RO')} · ${e2(String(r.ctx.zona ?? ''))} · cap. ${e2(String(r.ctx.capitol ?? ''))}${r.up ? ' · ☁️' : ''}</small></div></div>`).join('') || `<p class="sub">${$t('Niciun raport încă.')}</p>`}</div>
      <div class="row2"><button class="bugexp">${$t('📤 Trimite fișierul')}</button><button class="bugup">${$t('☁️ Trimite pe internet')}</button><button class="bugclr">${$t('🗑️ Șterge')}</button></div>
      <div class="row2"><button class="xcred">${$t('Închide')}</button></div>`);
  }
  showErrors() {
    const list = ErrorLog.all();
    const e2 = (t: string) => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as Record<string, string>)[c]);
    this.dialog(`<h3>${$t('📋 Erori')}</h3><p class="sub">${$t('Versiunea jocului:')} <b>v${pkg.version}</b>. ${list.length ? $t('Copiază lista și trimite-mi-o, ca să le repar.') : $t('Nicio eroare. 🎉')}</p>
      ${list.length ? `<pre class="errlist">${e2(ErrorLog.text())}</pre>` : ''}
      <div class="row2">${list.length ? `<button class="errcopy">${$t('📋 Copiază')}</button><button class="errclear">${$t('🗑️ Șterge')}</button>` : ''}<button class="xcred">${$t('Închide')}</button></div>`);
  }
  showCredits() {
    this.dialog(`<h3>${$t('📜 Credite')}</h3>
      <p><b>${esc(GAME_NAME)}</b> ${$t('· joc făcut cu 💕 · logo ACM / Code')}</p>
      <h4>${$t('🔊 Sunete (înregistrări reale)')}</h4>
      <ul>
        <li><b>${$t('Oculus Audio Pack')}</b> ${$t('© Meta Platforms, Inc. — licență')} <b>${$t('CC BY 4.0')}</b> ${$t('(tăiate, normalizate, convertite)')}</li>
        <li><b>${$t('TerminalFart')}</b> ${$t('© 2026 Electric Wolfe Marshmallow Hypertext — Apache License 2.0')}</li>
        <li>${$t('Kenney (RPG Audio, Impact Sounds) — CC0')}</li>
        <li>${$t('Free-SFX (EternityForest), SFX Kit (Wyzowl), CC0 Public Domain Sounds (lavenderdotpet) — CC0')}</li>
        <li>${$t('Înregistrări Freesound CC0: felix.blume, lizelle, siteflight, yetcop, smand, guiller1220, legnalegna55, richwise, RutgerMuller, Sheyvan și alții')}</li>
      </ul>
      <p class="sub">${$t('Lista completă, sunet cu sunet: docs/SUNETE.md')}</p>
      <button class="xcred">${$t('Închide')}</button>`);
  }

  update(dt: number) {
    this.t += dt;
    const { w, h } = this.game;
    const sc = Math.max(1, Math.min(2.2, h / 380));
    const narrow = w < 760 && h > w; // telefon pe lat: personajele stanga, meniul dreapta
    const cx = narrow ? w / 2 : w * 0.28;
    this.bubu.scale = this.dudu.scale = sc;
    this.bubu.x = cx - 55 * sc; this.dudu.x = cx + 55 * sc; this.dudu.flip = -1;
    this.bubu.y = this.dudu.y = narrow ? h * 0.26 : h * 0.68;
    if (narrow) { const s2 = 1.25; this.bubu.scale = this.dudu.scale = s2; this.bubu.x = cx - 50 * s2; this.dudu.x = cx + 50 * s2; this.bubu.y = this.dudu.y = 150; }
    else if (h < 520) { const s2 = Math.min(h / 300, w * 0.36 / 220); const cx = w * 0.2; this.bubu.scale = this.dudu.scale = s2; this.bubu.y = this.dudu.y = h * 0.78; this.bubu.x = cx - 50 * s2; this.dudu.x = cx + 50 * s2; }
    this.nextEmote -= dt;
    if (this.nextEmote < 0) {
      this.nextEmote = 3 + Math.random() * 2;
      const pick = ['love', 'wave', 'laugh', 'dance_hop', 'shy', 'kiss', 'fart', 'flex', 'boba'];
      const a = Math.random() < 0.5 ? this.bubu : this.dudu;
      let id = pick[Math.floor(Math.random() * pick.length)];
      if (id === 'flex' && a.id === 'bubu') id = 'boba'; if (id === 'boba' && a.id === 'dudu') id = 'flex';
      a.play(id);
    }
    this.bubu.update(dt); this.dudu.update(dt); this.fx.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { w, h } = this.game;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#ffd6e4'); g.addColorStop(1, '#ffeacc');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // inimioare care plutesc
    for (let i = 0; i < 18; i++) {
      const x = ((i * 97) % 100) / 100 * w, y = (h + 40) - ((this.t * (14 + i % 5 * 6) + i * 90) % (h + 80));
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 0.35; ctx.fillStyle = i % 3 ? '#ff9ab8' : '#fff';
      ctx.beginPath(); const s = 8 + i % 4 * 4; ctx.moveTo(0, s * 0.35); ctx.bezierCurveTo(-s, -s * 0.35, -s * 0.45, -s * 1.05, 0, -s * 0.45); ctx.bezierCurveTo(s * 0.45, -s * 1.05, s, -s * 0.35, 0, s * 0.35); ctx.fill(); ctx.restore();
    }
    this.bubu.draw(ctx); this.dudu.draw(ctx); this.fx.draw(ctx);
  }
}
