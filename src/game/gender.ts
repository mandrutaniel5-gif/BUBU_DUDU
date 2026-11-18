// Bubu e fata, Dudu e baiat: textele se acorda dupa gen.
import type { CharId } from '../char/draw';
import { $t } from '../i18n';
export const isGirl = (id: CharId) => id === 'bubu';
/** g(id, 'masculin', 'feminin') */
export const g = (id: CharId, m: string, f: string) => (isGirl(id) ? f : m);

const MOOD: Record<string, [string, string]> = {
  happy: [$t('Fericit 😊'), $t('Fericită 😊')], calm: [$t('Liniștit 🙂'), $t('Liniștită 🙂')], sad: [$t('Trist 😢'), $t('Tristă 😢')],
  angry: [$t('Furios 😠'), $t('Furioasă 😠')], sleepy: [$t('Somnoros 😪'), $t('Somnoroasă 😪')], sick: [$t('Bolnav 🤒'), $t('Bolnavă 🤒')],
  hungry: [$t('Flămând 🤤'), $t('Flămândă 🤤')], love: [$t('Îndrăgostit 🥰'), $t('Îndrăgostită 🥰')], sulky: [$t('Bosumflat 😒'), $t('Bosumflată 😒')], cold: [$t('Înghețat 🥶'), $t('Înghețată 🥶')],
};
export const moodText = (id: CharId, mood: string) => { const m = MOOD[mood]; return m ? (isGirl(id) ? m[1] : m[0]) : ''; };
