import './style.css';
import { Game } from './engine/game';
import { StudioScene } from './scenes/studio';
import { SheetScene } from './scenes/sheet';

const game = new Game(document.getElementById('game') as HTMLCanvasElement);
game.scenes.studio = () => new StudioScene(game);
game.scenes.sheet = () => new SheetScene(game);
game.scenes.world = () => new StudioScene(game); // inlocuit in pasul urmator
(window as any).game = game;
game.go(location.hash.slice(1) in game.scenes ? location.hash.slice(1) : 'studio');
game.start();
