import type { MinigameCtor } from './base';
import { PlungerGame } from './plunger';
import { PancakeGame } from './pancakes';
import { SoupGame, MedicineGame, CompressGame } from './care';

/** id minijoc -> clasa. Activitatile cu `minigame` deschid minijocul pentru jucator. */
export const MINIGAMES: Record<string, MinigameCtor> = {
  plunger: PlungerGame,
  pancakes: PancakeGame,
  soup: SoupGame,
  medicine: MedicineGame,
  compress: CompressGame,
};
