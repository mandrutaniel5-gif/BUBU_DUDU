import { ErrorLog } from './engine/errors';
import pkg from '../package.json';
ErrorLog.ver = pkg.version;
import './style.css';
import { Game } from './engine/game';
import { StudioScene } from './scenes/studio';
import { SheetScene } from './scenes/sheet';
import { MenuScene } from './scenes/menu';
import { IconScene } from './scenes/icon';
import { WorldScene } from './scenes/world';
import { Settings } from './game/settings';
import { makeAdapter } from './net/adapters';
import { Sfx } from './engine/sfx';
import { iconizeDom } from './ui/icons';
import { showLoading } from './ui/loading';
iconizeDom();

// ---- jocul se joaca pe orizontala (ca un joc normal) ----
const lockLandscape = () => { try { (screen.orientation as any)?.lock?.('landscape').catch(() => {}); } catch { /* */ } };
lockLandscape();
// pe telefon: la prima atingere intram pe tot ecranul si blocam orizontala (browserul permite doar dupa o atingere)
addEventListener('pointerdown', () => {
  const touch = matchMedia('(pointer: coarse)').matches;
  if (touch && !document.fullscreenElement && document.documentElement.requestFullscreen && !(window as any).Capacitor) document.documentElement.requestFullscreen({ navigationUI: 'hide' } as any).then(lockLandscape).catch(() => {});
  else lockLandscape();
}, { once: true });

const game = new Game(document.getElementById('game') as HTMLCanvasElement);
game.scenes.menu = () => new MenuScene(game);
game.scenes.studio = () => new StudioScene(game);
game.scenes.sheet = () => new SheetScene(game);
game.scenes.icon = () => new IconScene(game);
game.scenes.world = () => {
  const s = Settings.get();
  return new WorldScene(game, makeAdapter(s.net), s.who);
};
(window as any).game = game;
// parametri URL (utili la test): ?who=dudu&mode=local&room=test
const q = new URLSearchParams(location.search);
if (q.get('who') || q.get('mode') || q.get('room')) {
  const cur = Settings.get();
  Settings.set({ who: (q.get('who') as any) ?? cur.who, net: { ...cur.net, mode: (q.get('mode') as any) ?? cur.net.mode, room: q.get('room') ?? cur.net.room, serverUrl: q.get('server') ?? cur.net.serverUrl } });
}
// jocul deschis direct de pe serverul nostru (S10 / tunel): se conecteaza automat la acelasi server
if (location.protocol.startsWith('http') && (location.port === '8787' || location.hostname.endsWith('.trycloudflare.com'))) {
  const cur = Settings.get(); const url = location.origin.replace(/^http/, 'ws');
  const key = 'bd-auto-server-' + location.host;
  let first = false; try { first = !localStorage.getItem(key); localStorage.setItem(key, '1'); } catch { /* */ }
  Settings.set({ net: { ...cur.net, serverUrl: url, mode: first ? 'server' : cur.net.mode } });
}
Sfx.setMuted(Settings.get().muted);
const start = location.hash.slice(1);
// intai ecranul de incarcare cu logo-ul ACM / Code, apoi jocul (?skipload sare peste, pentru teste)
(q.has('skipload') ? Promise.resolve() : showLoading()).then(() => {
  game.go(start in game.scenes ? start : 'menu');
  game.start();
});
addEventListener('hashchange', () => { const n = location.hash.slice(1); if (n in game.scenes && n !== game.sceneName) game.go(n); });

// copia offline a jocului (service worker) e doar pentru varianta din browser. In aplicatia instalata
// (Android / iOS / PC) poate pastra versiunea VECHE dupa o actualizare: o stergem si reincarcam o data.
const native = !!(window as any).Capacitor || !location.protocol.startsWith('http') || navigator.userAgent.includes('Electron') || location.hostname === 'localhost' && !location.port;
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  if (native) {
    navigator.serviceWorker.getRegistrations().then(async regs => {
      const had = regs.length > 0 || !!navigator.serviceWorker.controller;
      await Promise.all(regs.map(r => r.unregister()));
      try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } catch { /* */ }
      if (had && !sessionStorage.getItem('bd-sw-cleaned')) { sessionStorage.setItem('bd-sw-cleaned', '1'); location.reload(); }
    }).catch(() => {});
  } else navigator.serviceWorker.register('./sw.js').catch(() => {});
}
