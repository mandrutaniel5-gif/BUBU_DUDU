// Activitatile din casa: ce animatie, cat dureaza, ce nevoi reface.
import type { NeedKey } from './state';

export interface Activity {
  id: string;
  anim: string;
  dur: number;                                  // secunde reale
  needs: Partial<Record<NeedKey, number>>;      // la final
  place?: 'bed' | 'tub' | 'toilet' | 'sofa' | 'stand';
  furnFlag?: [string, unknown, unknown];        // [cheie, la start, la final]
  text: string;                                 // mesaj la final
  minigame?: string;                            // id minijoc (daca exista)
}

export const ACTIVITIES: Record<string, Activity> = {
  sleep: { id: 'sleep', anim: 'act_sleepbed', dur: 12, needs: { energy: 45, health: 6 }, place: 'bed', text: 'Somn dulce! 💤' },
  snack: { id: 'snack', anim: 'act_eat', dur: 3.5, needs: { hunger: 22, fun: 3 }, text: 'Gustărică! 🍪' , minigame: 'fridge' },
  eat: { id: 'eat', anim: 'act_eat', dur: 5, needs: { hunger: 35, love: 3 }, text: 'Ce bun a fost tortul! 🍰' },
  cook: { id: 'cook', anim: 'act_cook', dur: 7, needs: { hunger: 10, fun: 8 }, furnFlag: ['cooking', true, false], text: 'Mâncare caldă gata! 🍲', minigame: 'pancakes' },
  toilet: { id: 'toilet', anim: 'act_toilet', dur: 4, needs: { hygiene: 4, fun: 4 }, place: 'toilet', text: 'Ușurare totală 😌' },
  unclog: { id: 'unclog', anim: 'act_plunge', dur: 6, needs: { hygiene: -6, fun: 6 }, text: 'Toaleta e desfundată! 🪠✨', minigame: 'plunger' },
  bath: { id: 'bath', anim: 'act_bath', dur: 8, needs: { hygiene: 55, fun: 10 }, place: 'tub', furnFlag: ['bathFoam', 1, 0.3], text: 'Curat și pufos! 🫧' , minigame: 'bath' },
  teeth: { id: 'teeth', anim: 'act_brush', dur: 4, needs: { hygiene: 15 }, text: 'Dinți strălucitori! ✨' , minigame: 'teeth' },
  laundry: { id: 'laundry', anim: 'act_scrub', dur: 5, needs: { hygiene: 10, fun: -3 }, text: 'Rufe curate 🧺' , minigame: 'socks' },
  dishes: { id: 'dishes', anim: 'act_scrub', dur: 5, needs: { hygiene: 6, fun: -2 }, text: 'Vase spălate 🍽️' , minigame: 'dishes' },
  tv: { id: 'tv', anim: 'act_tv', dur: 8, needs: { fun: 30, energy: -3 }, place: 'sofa', furnFlag: ['tvOn', true, false], text: 'Ce film bun! 📺' },
  cuddle: { id: 'cuddle', anim: 'act_tv', dur: 8, needs: { fun: 18, love: 12 }, place: 'sofa', furnFlag: ['tvOn', true, false], text: 'Leneveală pe canapea 🛋️' },
  read: { id: 'read', anim: 'act_read', dur: 6, needs: { fun: 15, energy: -2 }, text: 'O carte frumoasă 📚' },
  water_plant: { id: 'water_plant', anim: 'act_water', dur: 3, needs: { fun: 6 }, text: 'Floarea e fericită 🪴' },
  garden: { id: 'garden', anim: 'act_garden', dur: 6, needs: { fun: 12, hygiene: -8 }, text: 'Grădina crește! 🌱' , minigame: 'garden' },
  bench: { id: 'bench', anim: 'act_sit', dur: 6, needs: { fun: 8, love: 6, energy: 4 }, text: 'Ce apus frumos 🌅' },
  pinch: { id: 'pinch', anim: 'act_plunge', dur: 1, needs: { fun: 10, energy: 4 }, text: 'Liniște 🤫', minigame: 'snore' },
  chop: { id: 'chop', anim: 'act_scrub', dur: 4, needs: { fun: 6, energy: -6 }, text: 'Lemne! 🪵', minigame: 'chop' },
  mine: { id: 'mine', anim: 'act_scrub', dur: 4, needs: { fun: 6, energy: -6 }, text: 'Piatră! 🪨', minigame: 'mine' },
  pick: { id: 'pick', anim: 'act_garden', dur: 2.5, needs: { fun: 4, love: 2 }, text: 'Flori pentru iubire 🌸' },
  swing: { id: 'swing', anim: 'act_sit', dur: 7, needs: { fun: 22, love: 10 }, text: 'Hușca-hușca! 🎠' },
  gazebo: { id: 'gazebo', anim: 'love', dur: 2.6, needs: { love: 20, fun: 6 }, text: 'Momentul nostru în foișor 💞' },
  read_mail: { id: 'read_mail', anim: 'love', dur: 2.6, needs: { love: 8 }, text: 'Un bilețel de dragoste 💌' },
};
