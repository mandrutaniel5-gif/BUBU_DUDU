// Ecranul de start: cine esti, cum va conectati.
import { DEV } from '../game/dev';
import { Actor } from '../char/actor';
import { Fx } from '../char/fx';
import { Sfx } from '../engine/sfx';
import { isEco } from '../engine/game';
import { ErrorLog } from '../engine/errors';
import pkg from '../../package.json';
import { Settings } from '../game/settings';
import type { Scene, Game } from '../engine/game';
import type { NetConfig } from '../net/types';
import { createHouse, joinHouse, isSecureRoom, normCode } from '../net/house';
import { WsAdapter } from '../net/adapters';
import { loadCloud } from '../save/cloud';

export class MenuScene implements Scene {
  /** meniul nu are nevoie de mai mult de 30 de cadre pe secunda */
  wantFps() { return 30; }
  fx = new Fx();
  bubu = new Actor('bubu', this.fx);
  dudu = new Actor('dudu', this.fx);
  ui!: HTMLElement;
  t = 0; nextEmote = 1.5;

  constructor(private game: Game) {}

  enter() {
    const s = Settings.get();
    this.ui = document.createElement('div');
    this.ui.className = 'menu';
    this.ui.innerHTML = `
      <div class="menu-card">
        <h1>Bubu <span>&</span> Dudu</h1>
        <p class="tag">Căsuța noastră 🏡💕</p>
        <h4>Cine ești?</h4>
        <div class="who2">
          <button data-who="bubu" class="${s.who === 'bubu' ? 'on' : ''}">🐼<b>Bubu</b><small>panda</small></button>
          <button data-who="dudu" class="${s.who === 'dudu' ? 'on' : ''}">🐻<b>Dudu</b><small>ursulețul</small></button>
        </div>
        <h4>Cum jucăm?</h4>
        <select name="mode">
          <option value="solo">🏠 Joc solo — partenerul e controlat de AI</option>
          <option value="firebase">🌍 Online (Firebase): de oriunde, fără server</option>
          <option value="server">📱 Serverul nostru (Samsung S10 / PC)</option>
          ${DEV ? '<option value="local">🧪 Test: 2 tab-uri pe același dispozitiv</option>' : ''}
        </select>
        <div class="house-row"></div>
        <label class="m-server">Adresa serverului: lasă <b>auto</b> ca să se conecteze singur la S10<span class="srvrow"><input name="serverUrl" value="${s.net.serverUrl}" placeholder="auto (se conectează singur la S10)" /><button type="button" class="paste" title="Lipește linkul copiat">📋 Lipește</button></span></label>
        <label class="m-firebase hidden">Config Firebase (JSON din consola Firebase)<textarea name="fb" rows="4" placeholder='{"apiKey":"...","databaseURL":"https://...firebaseio.com", ...}'>${s.net.firebase.apiKey ? JSON.stringify(s.net.firebase) : ''}</textarea></label>
        <button class="play">▶ Intră în casă</button>
        <div class="row2"><button class="export" title="Salvează progresul într-un fișier">💾 Salvează în fișier</button><button class="import" title="Încarcă progresul dintr-un fișier">📂 Încarcă</button></div>
        <div class="row2"><button class="studio">🎬 Studio</button><button class="reset">🔄 Joc nou</button><button class="mute">${s.muted ? '🔇' : '🔊'}</button><button class="credits" title="Credite">📜</button></div>
        <div class="row2"><button class="eco" title="Economisire baterie: mai puține cadre pe secundă când stați, rezoluție puțin mai mică pe telefon">${isEco() ? '🔋 Eco: pornit' : '⚡ Eco: oprit'}</button><button class="errs" title="Erorile jocului (le poți copia și trimite)">📋 Erori (${ErrorLog.all().length})</button></div>
        <p class="ver">v${pkg.version} · făcut cu 💕 pentru noi doi</p>
      </div>`;
    document.getElementById('ui')!.appendChild(this.ui);
    const mode = this.ui.querySelector('select') as HTMLSelectElement;
    mode.value = s.net.mode;
    const sync = () => {
      this.ui.querySelector('.m-server')!.classList.toggle('hidden', mode.value !== 'server');
      this.ui.querySelector('.m-firebase')!.classList.add('hidden'); // config-ul Firebase e deja in joc
    };
    mode.onchange = () => { sync(); this.houseRow(); }; sync(); this.houseRow();
    this.ui.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null; if (!b) return;
      Sfx.unlock(); Sfx.play('click');
      if (b.dataset.who) {
        Settings.set({ who: b.dataset.who as 'bubu' | 'dudu' });
        this.ui.querySelectorAll('[data-who]').forEach(x => x.classList.toggle('on', x === b));
        (b.dataset.who === 'bubu' ? this.bubu : this.dudu).play('wave');
      }
      if (b.classList.contains('credits')) { this.showCredits(); return; }
      if (b.classList.contains('house-open')) { this.showHouse(); return; }
      if (b.classList.contains('h-create')) { this.doCreate(b); return; }
      if (b.classList.contains('h-join')) { this.doJoin(b); return; }
      if (b.classList.contains('h-copy')) { const c = Settings.get().net.code ?? ''; navigator.clipboard?.writeText(c).then(() => { b.textContent = '✔ Copiat'; }).catch(() => {}); return; }
      if (b.classList.contains('errs')) { this.showErrors(); return; }
      if (b.classList.contains('errcopy')) { const t = `Bubu & Dudu v${pkg.version} · ${navigator.userAgent}\n` + ErrorLog.text(); navigator.clipboard?.writeText(t).then(() => { b.textContent = '✔ Copiat'; }).catch(() => { b.textContent = 'Ține apăsat pe text → Copiază'; }); return; }
      if (b.classList.contains('errclear')) { ErrorLog.clear(); this.ui.querySelector('.cred')?.remove(); const eb = this.ui.querySelector('.errs'); if (eb) eb.textContent = '📋 Erori (0)'; return; }
      if (b.classList.contains('eco')) { const on = !isEco(); Settings.set({ eco: on }); b.textContent = on ? '🔋 Eco: pornit' : '⚡ Eco: oprit'; dispatchEvent(new Event('resize')); return; }
      if (b.classList.contains('xcred')) { this.ui.querySelector('.cred')?.remove(); return; }
      if (b.classList.contains('mute')) { const m = !Settings.get().muted; Settings.set({ muted: m }); Sfx.setMuted(m); b.textContent = m ? '🔇' : '🔊'; }
      if (b.classList.contains('paste')) {
        const inp = this.ui.querySelector('[name=serverUrl]') as HTMLInputElement;
        const sel = this.ui.querySelector('select') as HTMLSelectElement | null;
        navigator.clipboard?.readText?.().then(t => {
          const m = /(https?|wss?):\/\/[^\s"'<>]+/i.exec(t || '');
          if (m) { inp.value = m[0]; b.textContent = '✔ Lipit'; if (sel) { sel.value = 'server'; sel.dispatchEvent(new Event('change', { bubbles: true })); } }
          else { b.textContent = '❌ Nimic copiat'; inp.focus(); }
          setTimeout(() => (b.textContent = '📋 Lipește'), 1600);
        }).catch(() => { inp.focus(); inp.select(); b.textContent = 'Ține apăsat → Lipește'; setTimeout(() => (b.textContent = '📋 Lipește'), 2000); });
      }
      if (b.classList.contains('export')) {
        // salvarea casei curente intr-un fisier .json (o pastrezi sau o trimiti pe alt telefon)
        const room = Settings.get().net.room;
        const raw = localStorage.getItem(`bd-save-${room}`);
        if (!raw) { alert('Încă nu există o salvare pentru casa „' + room + '”. Intră în joc o dată.'); return; }
        const blob = new Blob([JSON.stringify({ app: 'bubu-dudu', room, save: JSON.parse(raw) })], { type: 'application/json' });
        const name = `BubuDudu-salvare-${room}-${new Date().toISOString().slice(0, 10)}.json`;
        const file = new File([blob], name, { type: 'application/json' });
        const nav = navigator as any;
        if (nav.canShare?.({ files: [file] })) nav.share({ files: [file], title: 'Salvare Bubu & Dudu' }).catch(() => {});
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
        b.textContent = '✔ Salvat'; setTimeout(() => (b.textContent = '💾 Salvează în fișier'), 1600);
      }
      if (b.classList.contains('import')) {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
        inp.onchange = async () => {
          const f = inp.files?.[0]; if (!f) return;
          try {
            const d = JSON.parse(await f.text()); const save = d.save ?? d; if (!save?.json) throw new Error('format');
            // salvarea intra in casa de acum (cu parola); daca n-aveti inca una, in casa din fisier
            const cur = Settings.get().net, room = isSecureRoom(cur.room) ? cur.room : (d.room ?? cur.room);
            localStorage.setItem(`bd-save-${room}`, JSON.stringify({ json: save.json, ts: Date.now() }));
            Settings.set({ net: { ...cur, room, code: room === cur.room ? cur.code : undefined }, resetAt: 0 });
            this.houseRow();
            alert('✔ Salvarea a fost încărcată' + (cur.code && room === cur.room ? ` în casa ${cur.code}` : '') + '. Apasă „Intră în casă”.');
          } catch { alert('Fișierul nu e o salvare Bubu & Dudu.'); }
        };
        inp.click();
      }
      if (b.classList.contains('studio')) this.game.go('studio');
      if (b.classList.contains('reset')) {
        if (!confirm('Începeți un joc nou?\n\nSe șterge tot progresul (casa, banii, grădina, Borcanul cu iubire) și o luați de la Capitolul 0.')) return;
        try { for (const k of Object.keys(localStorage)) if (k.startsWith('bd-save-') || k.startsWith('bd-last-seen')) localStorage.removeItem(k); } catch { /* */ }
        Settings.set({ resetAt: Date.now() });
        Sfx.play('good'); b.textContent = '✔ Șters!';
        setTimeout(() => (b.textContent = '🔄 Joc nou'), 1500);
      }
      if (b.classList.contains('play') || b.classList.contains('h-play')) this.play();
    });
    Sfx.setMuted(s.muted);
  }
  /** intra in joc (din butonul mare sau direct dupa ce ati gasit / facut casa) */
  play() {
        const mode = this.ui.querySelector('select') as HTMLSelectElement;
        const net: NetConfig = { ...Settings.get().net, mode: mode.value as NetConfig['mode'] };
        // online doar intr-o casa cu cod si parola (camera nu se mai poate ghici)
        if ((net.mode === 'firebase' || net.mode === 'server') && !isSecureRoom(net.room)) { this.showHouse('Ca să jucați online, faceți-vă întâi casa voastră, cu cod și parolă. Unul o creează, celălalt intră cu același cod și aceeași parolă.'); return; }
        net.serverUrl = (this.ui.querySelector('[name=serverUrl]') as HTMLInputElement).value.trim();
        const fbt = (this.ui.querySelector('[name=fb]') as HTMLTextAreaElement).value.trim();
        if (fbt) { try { net.firebase = { ...net.firebase, ...JSON.parse(fbt.replace(/(\w+)\s*:/g, '"$1":').replace(/""/g, '"').replace(/'/g, '"')) }; } catch { try { net.firebase = { ...net.firebase, ...JSON.parse(fbt) }; } catch { alert('Config Firebase invalid (trebuie JSON)'); return; } } }
        if (net.mode === 'firebase' && !net.firebase.databaseURL) { alert('Lipsește databaseURL din config-ul Firebase'); return; }
        Settings.set({ net });
        this.game.go('world');
  }
  /** randul cu casa voastra (codul) din meniu */
  houseRow() {
    const row = this.ui.querySelector('.house-row') as HTMLElement | null; if (!row) return;
    const n = Settings.get().net, sec = isSecureRoom(n.room) && !!n.code;
    row.innerHTML = sec
      ? `<div class="house-card"><span>🏠 Casa voastră: <b>${n.code}</b> 🔒</span><button type="button" class="house-open">🔑 Casa</button></div>`
      : `<div class="house-card warn"><span>🔓 Nu aveți încă o casă cu parolă</span><button type="button" class="house-open">🏠 Faceți-vă casa</button></div>`;
  }
  /** fereastra „Casa voastra”: casa noua (cod unic + parola) sau intri in casa partenerului */
  showHouse(note = '') {
    this.ui.querySelector('.cred')?.remove();
    const n = Settings.get().net, sec = isSecureRoom(n.room) && !!n.code;
    const oldSave = !sec && !!localStorage.getItem(`bd-save-${n.room}`);
    const d = document.createElement('div'); d.className = 'cred house';
    d.innerHTML = `<div class="cred-in"><h3>🏠 Casa voastră</h3>
      ${note ? `<p class="sub">${note}</p>` : '<p class="sub">Fiecare cuplu are casa lui, cu un cod unic și o parolă. Doar cine știe amândouă poate intra.</p>'}
      ${sec ? `<div class="house-now"><span>Codul casei: <b>${n.code}</b></span><button type="button" class="h-copy">📋 Copiază codul</button><small>Spune-i ${Settings.get().who === 'bubu' ? 'lui Dudu' : 'lui Bubu'} codul și parola. Parola nu se salvează nicăieri: dacă o uitați, faceți o casă nouă din fișierul cu salvarea.</small></div>` : ''}
      <div class="house-cols">
        <div class="house-box"><h4>✨ Casă nouă</h4>
          <label>Alege o parolă (cel puțin 4 caractere)<input name="hpass" type="password" autocomplete="new-password" maxlength="40" /></label>
          ${oldSave || sec ? `<label class="chk"><input type="checkbox" name="hmove" checked /> Mută aici progresul de acum</label>` : ''}
          <button type="button" class="h-create">✨ Creează casa</button></div>
        <div class="house-box"><h4>💞 Intră în casa partenerului</h4>
          <label>Codul casei<input name="hcode" placeholder="LALEA-7K3P" maxlength="14" autocapitalize="characters" /></label>
          <label>Parola<input name="hjpass" type="password" autocomplete="current-password" maxlength="40" /></label>
          <button type="button" class="h-join">💞 Intră la partener</button></div>
      </div>
      <p class="house-msg"></p>
      <div class="row2"><button class="xcred">Închide</button></div></div>`;
    this.ui.appendChild(d);
  }
  /** casa e gata: codul mare, de spus partenerului, si un singur buton: intrati in joc */
  showReady(title: string, sub: string) {
    this.ui.querySelector('.cred')?.remove();
    const d = document.createElement('div'); d.className = 'cred house';
    d.innerHTML = `<div class="cred-in"><h3>${title}</h3><div class="house-code">${Settings.get().net.code ?? ''}</div><p class="sub">${sub}</p>
      <div class="row2"><button type="button" class="h-copy">📋 Copiază codul</button><button type="button" class="h-play">▶ Intrăm în joc</button></div></div>`;
    this.ui.appendChild(d);
  }
  private houseMsg(t: string, ok = false) { const m = this.ui.querySelector('.house-msg') as HTMLElement | null; if (m) { m.textContent = t; m.classList.toggle('ok', ok); } }
  private async houseNet() {
    const mode = (this.ui.querySelector('select') as HTMLSelectElement).value as NetConfig['mode'];
    const net: NetConfig = { ...Settings.get().net, mode };
    let url = (this.ui.querySelector('[name=serverUrl]') as HTMLInputElement).value.trim() || net.serverUrl;
    if (mode === 'server') url = !url || /^auto/i.test(url) ? (await WsAdapter.resolveAuto()) ?? '' : WsAdapter.norm(url);
    return { net, url };
  }
  private async doCreate(b: HTMLButtonElement) {
    const pass = (this.ui.querySelector('[name=hpass]') as HTMLInputElement).value;
    const move = (this.ui.querySelector('[name=hmove]') as HTMLInputElement | null)?.checked ?? false;
    b.disabled = true; this.houseMsg('Se face casa…');
    const { net, url } = await this.houseNet();
    // progresul de pana acum (de pe telefon sau din cloud, cel mai nou) merge in casa noua
    let seed: { json: string; ts: number } | null = null;
    if (move) {
      try { const raw = localStorage.getItem(`bd-save-${net.room}`); if (raw) seed = JSON.parse(raw); } catch { /* */ }
      if (net.mode === 'firebase') { const c = await loadCloud(net.room); if (c && (!seed || c.ts > seed.ts)) seed = c; }
    }
    const r = await createHouse(net, url, pass, seed);
    b.disabled = false;
    if (!r.ok) { this.houseMsg('❌ ' + r.msg); Sfx.play('bad'); return; }
    if (seed) try { localStorage.setItem(`bd-save-${r.room}`, JSON.stringify({ json: seed.json, ts: Date.now() })); } catch { /* */ }
    Settings.set({ net: { ...Settings.get().net, room: r.room, code: r.code }, resetAt: seed ? 0 : Settings.get().resetAt });
    Sfx.play('good'); this.houseRow();
    const dudu = Settings.get().who === 'bubu';
    this.showReady(`✅ Casa e gata!`, `Spune-i ${dudu ? 'lui Dudu' : 'lui Bubu'} codul și parola, ca să intre și ${dudu ? 'el' : 'ea'}.`);
  }
  private async doJoin(b: HTMLButtonElement) {
    const code = normCode((this.ui.querySelector('[name=hcode]') as HTMLInputElement).value), pass = (this.ui.querySelector('[name=hjpass]') as HTMLInputElement).value;
    b.disabled = true; this.houseMsg('Caut casa…');
    const { net, url } = await this.houseNet();
    const r = await joinHouse(net, url, code, pass);
    b.disabled = false;
    if (!r.ok) { this.houseMsg('❌ ' + r.msg); Sfx.play('bad'); return; }
    Settings.set({ net: { ...Settings.get().net, room: r.room, code: r.code }, resetAt: 0 });
    Sfx.play('good'); this.houseRow();
    this.ui.querySelector('.cred')?.remove();
    this.play(); // casa e gasita: intri direct in joc (nu mai apesi inca o data)
  }
  showErrors() {
    this.ui.querySelector('.cred')?.remove();
    const d = document.createElement('div'); d.className = 'cred';
    const esc = (t: string) => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as Record<string, string>)[c]);
    const list = ErrorLog.all();
    d.innerHTML = `<div class="cred-in"><h3>📋 Erori</h3><p class="sub">Versiunea jocului: <b>v${pkg.version}</b>. ${list.length ? 'Copiază lista și trimite-mi-o, ca să le repar.' : 'Nicio eroare. 🎉'}</p>
      ${list.length ? `<pre class="errlist">${esc(ErrorLog.text())}</pre>` : ''}
      <div class="row2">${list.length ? '<button class="errcopy">📋 Copiază</button><button class="errclear">🗑️ Șterge</button>' : ''}<button class="xcred">Închide</button></div></div>`;
    this.ui.appendChild(d);
  }
  showCredits() {
    this.ui.querySelector('.cred')?.remove();
    const d = document.createElement('div'); d.className = 'cred';
    d.innerHTML = `<div class="cred-in"><h3>📜 Credite</h3>
      <p><b>Bubu & Dudu</b> · joc făcut cu 💕 · logo ACM / Code</p>
      <h4>🔊 Sunete (înregistrări reale)</h4>
      <ul>
        <li><b>Oculus Audio Pack</b> © Meta Platforms, Inc. — licență <b>CC BY 4.0</b> (tăiate, normalizate, convertite)</li>
        <li><b>TerminalFart</b> © 2026 Electric Wolfe Marshmallow Hypertext — Apache License 2.0</li>
        <li>Kenney (RPG Audio, Impact Sounds) — CC0</li>
        <li>Free-SFX (EternityForest), SFX Kit (Wyzowl), CC0 Public Domain Sounds (lavenderdotpet) — CC0</li>
        <li>Înregistrări Freesound CC0: felix.blume, lizelle, siteflight, yetcop, smand, guiller1220, legnalegna55, richwise, RutgerMuller, Sheyvan și alții</li>
      </ul>
      <p class="sub">Lista completă, sunet cu sunet: docs/SUNETE.md</p>
      <button class="xcred">Închide</button></div>`;
    this.ui.appendChild(d);
  }

  exit() { this.ui.remove(); }

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
