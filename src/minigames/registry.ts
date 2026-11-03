import type { MinigameCtor } from './base';
import { PlungerGame } from './plunger';
import { PancakeGame } from './pancakes';
import { BedtimeGame } from './bedtime';
import { SnoreGame } from './night';
import { ChopGame, MineGame } from './gather';
import { FireGame, MowGame } from './fire';
import { MergeGame } from './merge';
import { FishingGame } from './fishing';
import { FridgeCleanGame, TubScrubGame, TvFixGame } from './house';
import { BathGame, TeethGame, DishesGame, SocksGame, GardenGame, FridgeGame } from './chores';
import { SoupGame, MedicineGame, CompressGame } from './care';

/** id minijoc -> clasa. Activitatile cu `minigame` deschid minijocul pentru jucator. */
export const MINIGAMES: Record<string, MinigameCtor> = {
  plunger: PlungerGame,
  pancakes: PancakeGame,
  soup: SoupGame,
  bedtime: BedtimeGame,
  snore: SnoreGame,
  chop: ChopGame, mine: MineGame, fire: FireGame, mow: MowGame, merge: MergeGame, fishing: FishingGame, fridgeclean: FridgeCleanGame, tubscrub: TubScrubGame, tvfix: TvFixGame,
  bath: BathGame, teeth: TeethGame, dishes: DishesGame, socks: SocksGame, garden: GardenGame, fridge: FridgeGame,
  medicine: MedicineGame,
  compress: CompressGame,
};
