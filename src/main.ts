import './style.css';
import { Game } from './engine/game';
import { StudioScene } from './scenes/studio';
import { SheetScene } from './scenes/sheet';
import { MenuScene } from './scenes/menu';
import { WorldScene } from './scenes/world';
import { Settings } from './game/settings';
import { makeAdapter } from './net/adapters';
import { Sfx } from './engine/sfx';

const game = new Game(document.getElementById('game') as HTMLCanvasElement);
game.scenes.menu = () => new MenuScene(game);
game.scenes.studio = () => new StudioScene(game);
game.scenes.sheet = () => new SheetScene(game);
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
Sfx.setMuted(Settings.get().muted);
const start = location.hash.slice(1);
game.go(start in game.scenes ? start : 'menu');
game.start();
