// Ecranul de start: cine esti, cum va conectati.
import { Actor } from '../char/actor';
import { Fx } from '../char/fx';
import { Sfx } from '../engine/sfx';
import { Settings } from '../game/settings';
import type { Scene, Game } from '../engine/game';
import type { NetConfig } from '../net/types';

export class MenuScene implements Scene {
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
          <option value="solo">🏠 Singur(ă) — partenerul e controlat de AI</option>
          <option value="server">📱 Serverul nostru (Samsung S10 / PC)</option>
          <option value="firebase">🔥 Firebase (online, fără server)</option>
          <option value="local">🧪 Test: 2 tab-uri pe același dispozitiv</option>
        </select>
        <label>Codul casei (același pentru amândoi)<input name="room" value="${s.net.room}" maxlength="40" /></label>
        <label class="m-server">Adresa serverului<input name="serverUrl" value="${s.net.serverUrl}" placeholder="ws://192.168.1.50:8787" /></label>
        <label class="m-firebase">Config Firebase (JSON din consola Firebase)<textarea name="fb" rows="4" placeholder='{"apiKey":"...","databaseURL":"https://...firebaseio.com", ...}'>${s.net.firebase.apiKey ? JSON.stringify(s.net.firebase) : ''}</textarea></label>
        <button class="play">▶ Intră în casă</button>
        <div class="row2"><button class="studio">🎬 Studio animații</button><button class="mute">${s.muted ? '🔇' : '🔊'}</button></div>
        <p class="ver">v0.2 · făcut cu 💕 pentru noi doi</p>
      </div>`;
    document.getElementById('ui')!.appendChild(this.ui);
    const mode = this.ui.querySelector('select') as HTMLSelectElement;
    mode.value = s.net.mode;
    const sync = () => {
      this.ui.querySelector('.m-server')!.classList.toggle('hidden', mode.value !== 'server');
      this.ui.querySelector('.m-firebase')!.classList.toggle('hidden', mode.value !== 'firebase');
    };
    mode.onchange = sync; sync();
    this.ui.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null; if (!b) return;
      Sfx.unlock(); Sfx.play('click');
      if (b.dataset.who) {
        Settings.set({ who: b.dataset.who as 'bubu' | 'dudu' });
        this.ui.querySelectorAll('[data-who]').forEach(x => x.classList.toggle('on', x === b));
        (b.dataset.who === 'bubu' ? this.bubu : this.dudu).play('wave');
      }
      if (b.classList.contains('mute')) { const m = !Settings.get().muted; Settings.set({ muted: m }); Sfx.setMuted(m); b.textContent = m ? '🔇' : '🔊'; }
      if (b.classList.contains('studio')) this.game.go('studio');
      if (b.classList.contains('play')) {
        const net: NetConfig = { ...Settings.get().net, mode: mode.value as NetConfig['mode'] };
        net.room = ((this.ui.querySelector('[name=room]') as HTMLInputElement).value.trim() || 'casuta-noastra').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        net.serverUrl = (this.ui.querySelector('[name=serverUrl]') as HTMLInputElement).value.trim();
        const fbt = (this.ui.querySelector('[name=fb]') as HTMLTextAreaElement).value.trim();
        if (fbt) { try { net.firebase = { ...net.firebase, ...JSON.parse(fbt.replace(/(\w+)\s*:/g, '"$1":').replace(/""/g, '"').replace(/'/g, '"')) }; } catch { try { net.firebase = { ...net.firebase, ...JSON.parse(fbt) }; } catch { alert('Config Firebase invalid (trebuie JSON)'); return; } } }
        if (net.mode === 'firebase' && !net.firebase.databaseURL) { alert('Lipsește databaseURL din config-ul Firebase'); return; }
        Settings.set({ net });
        this.game.go('world');
      }
    });
    Sfx.setMuted(s.muted);
  }
  exit() { this.ui.remove(); }

  update(dt: number) {
    this.t += dt;
    const { w, h } = this.game;
    const sc = Math.max(1, Math.min(2.2, h / 380));
    const narrow = w < 760;
    const cx = narrow ? w / 2 : w * 0.28;
    this.bubu.scale = this.dudu.scale = sc;
    this.bubu.x = cx - 55 * sc; this.dudu.x = cx + 55 * sc; this.dudu.flip = -1;
    this.bubu.y = this.dudu.y = narrow ? h * 0.26 : h * 0.68;
    if (narrow) { const s2 = 1.25; this.bubu.scale = this.dudu.scale = s2; this.bubu.x = cx - 50 * s2; this.dudu.x = cx + 50 * s2; this.bubu.y = this.dudu.y = 150; }
    else if (h < 520) { const s2 = h / 300; this.bubu.scale = this.dudu.scale = s2; this.bubu.y = this.dudu.y = h * 0.78; this.bubu.x = cx - 50 * s2; this.dudu.x = cx + 50 * s2; }
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
