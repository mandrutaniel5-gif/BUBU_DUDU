// Bubu e fata, Dudu e baiat: textele se acorda dupa gen.
import type { CharId } from '../char/draw';
import { $t } from '../i18n';
export const isGirl = (id: CharId) => id === 'bubu';
/** g(id, 'masculin', 'feminin') */
export const g = (id: CharId, m: string, f: string) => (isGirl(id) ? f : m);

const MOOD: Record<string, [string, string]> = {
  happy: ['Fericit 😊', $t('Fericită 😊')], calm: [$t('Liniștit 🙂'), $t('Liniștită 🙂')], sad: ['Trist 😢', $t('Tristă 😢')],
  angry: ['Furios 😠', $t('Furioasă 😠')], sleepy: ['Somnoros 😪', $t('Somnoroasă 😪')], sick: ['Bolnav 🤒', $t('Bolnavă 🤒')],
  hungry: [$t('Flămând 🤤'), $t('Flămândă 🤤')], love: [$t('Îndrăgostit 🥰'), $t('Îndrăgostită 🥰')], sulky: ['Bosumflat 😒', $t('Bosumflată 😒')], cold: [$t('Înghețat 🥶'), $t('Înghețată 🥶')],
};
export const moodText = (id: CharId, mood: string) => { const m = MOOD[mood]; return m ? (isGirl(id) ? m[1] : m[0]) : ''; };
