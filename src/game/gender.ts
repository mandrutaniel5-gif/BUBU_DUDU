// Bubu e fata, Dudu e baiat: textele se acorda dupa gen.
import type { CharId } from '../char/draw';
export const isGirl = (id: CharId) => id === 'bubu';
/** g(id, 'masculin', 'feminin') */
export const g = (id: CharId, m: string, f: string) => (isGirl(id) ? f : m);

const MOOD: Record<string, [string, string]> = {
  happy: ['Fericit 😊', 'Fericită 😊'], calm: ['Liniștit 🙂', 'Liniștită 🙂'], sad: ['Trist 😢', 'Tristă 😢'],
  angry: ['Furios 😠', 'Furioasă 😠'], sleepy: ['Somnoros 😪', 'Somnoroasă 😪'], sick: ['Bolnav 🤒', 'Bolnavă 🤒'],
  hungry: ['Flămând 🤤', 'Flămândă 🤤'], love: ['Îndrăgostit 🥰', 'Îndrăgostită 🥰'], sulky: ['Bosumflat 😒', 'Bosumflată 😒'], cold: ['Înghețat 🥶', 'Înghețată 🥶'],
};
export const moodText = (id: CharId, mood: string) => { const m = MOOD[mood]; return m ? (isGirl(id) ? m[1] : m[0]) : ''; };
