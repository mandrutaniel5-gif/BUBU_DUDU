import type { MinigameCtor } from './base';
import { PlungerGame } from './plunger';
import { PancakeGame } from './pancakes';

/** id minijoc -> clasa. Activitatile cu `minigame` deschid minijocul pentru jucator. */
export const MINIGAMES: Record<string, MinigameCtor> = {
  plunger: PlungerGame,
  pancakes: PancakeGame,
};
