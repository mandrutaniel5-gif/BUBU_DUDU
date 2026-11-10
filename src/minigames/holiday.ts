// Sarbatorile (1.11.0): id -> scena. Porneste pe ambele telefoane (vezi WorldScene.playHoliday).
import type { MinigameCtor } from './base';
import type { WorldScene } from '../scenes/world';
import type { Show } from './holishow';
import { XmasTreeShow, CarolShow, GiftsShow, SantaShow, SkateShow, CarouselShow, NewYearShow } from './holiwinter';
import { BdayShow, GrandShow, FishContestShow, PicnicShow, LozShow } from './holisummer';
import { PasteShow, MartisorShow, DragobeteShow, InaWedShow } from './holispring';

type ShowCtor = new (scene: WorldScene, done: (s: number) => void) => Show;
export const SHOWS: Record<string, ShowCtor> = {
  xmastree: XmasTreeShow, colinde: CarolShow, gifts: GiftsShow, santa: SantaShow, skate: SkateShow, carusel: CarouselShow, revelion: NewYearShow,
  bday: BdayShow, grand: GrandShow, fishcontest: FishContestShow, picnic: PicnicShow, loz: LozShow,
  paste: PasteShow, martisor: MartisorShow, dragobete: DragobeteShow, inawed: InaWedShow,
};
/** construieste scena sarbatorii curente (scene.holidayId) */
export const HolidayGame = function (scene: WorldScene, done: (s: number) => void) {
  const C = SHOWS[scene.holidayId] ?? XmasTreeShow; const o = new C(scene, done); o.start(); return o;
} as unknown as MinigameCtor;
