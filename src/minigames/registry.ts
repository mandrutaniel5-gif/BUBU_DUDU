import type { MinigameCtor } from './base';
import { PlungerGame } from './plunger';
import { PancakeGame } from './pancakes';
import { BedtimeGame } from './bedtime';
import { SnoreGame } from './night';
import { BathGame, TeethGame, DishesGame, SocksGame, GardenGame, FridgeGame } from './chores';
import { SoupGame, MedicineGame, CompressGame } from './care';

/** id minijoc -> clasa. Activitatile cu `minigame` deschid minijocul pentru jucator. */
export const MINIGAMES: Record<string, MinigameCtor> = {
  plunger: PlungerGame,
  pancakes: PancakeGame,
  soup: SoupGame,
  bedtime: BedtimeGame,
  snore: SnoreGame,
  bath: BathGame, teeth: TeethGame, dishes: DishesGame, socks: SocksGame, garden: GardenGame, fridge: FridgeGame,
  medicine: MedicineGame,
  compress: CompressGame,
};
