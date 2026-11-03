import type { MinigameCtor } from './base';
import { PlungerGame } from './plunger';
import { PancakeGame } from './pancakes';
import { BedtimeGame } from './bedtime';
import { SoupGame, MedicineGame, CompressGame } from './care';

/** id minijoc -> clasa. Activitatile cu `minigame` deschid minijocul pentru jucator. */
export const MINIGAMES: Record<string, MinigameCtor> = {
  plunger: PlungerGame,
  pancakes: PancakeGame,
  soup: SoupGame,
  bedtime: BedtimeGame,
  medicine: MedicineGame,
  compress: CompressGame,
};
