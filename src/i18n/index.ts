// Traducerea jocului (1.15.0). Textul de baza ramane romana, scrisa direct in cod: $t('Bună dimineața!').
// Fiecare limba are un fisier locales/<cod>.json cu perechi „text romanesc” → „traducere”; ce lipseste ramane in romana.
// Textele cu bucati care se schimba au locuri numerotate: $t('Ai strâns {0} ouă', n) → „You collected 5 eggs”.
// Limba se alege o singura data, cand porneste jocul (dupa telefon, sau cea aleasa in Setari): toate modulele care isi fac
// listele de texte la incarcare (haine, meserii, retete) le primesc deja traduse. Schimbarea limbii reporneste jocul.
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import it from './locales/it.json';

export type Lang = 'ro' | 'en' | 'es' | 'pt' | 'de' | 'fr' | 'it';
/** limbile jocului, cu numele lor scris in limba respectiva (pentru Setari) */
export const LANGS: { id: Lang; name: string; flag: string }[] = [
  { id: 'ro', name: 'Română', flag: '🇷🇴' }, { id: 'en', name: 'English', flag: '🇬🇧' }, { id: 'es', name: 'Español', flag: '🇪🇸' },
  { id: 'pt', name: 'Português (Brasil)', flag: '🇧🇷' }, { id: 'de', name: 'Deutsch', flag: '🇩🇪' }, { id: 'fr', name: 'Français', flag: '🇫🇷' },
  { id: 'it', name: 'Italiano', flag: '🇮🇹' },
];
const DICTS: Record<Exclude<Lang, 'ro'>, Record<string, string>> = { en, es, pt, de, fr, it };
const KEY = 'bd-lang';

/** limba telefonului, daca o avem; altfel engleza */
export function deviceLang(): Lang {
  try {
    for (const l of navigator.languages?.length ? navigator.languages : [navigator.language]) {
      const c = String(l || '').toLowerCase().slice(0, 2) as Lang;
      if (LANGS.some(x => x.id === c)) return c;
    }
  } catch { /* */ }
  return 'en';
}
function pick(): Lang {
  try {
    const q = new URLSearchParams(location.search).get('lang') as Lang | null; // pentru teste: ?lang=en
    if (q && LANGS.some(x => x.id === q)) return q;
    const s = localStorage.getItem(KEY) as Lang | null;
    if (s && LANGS.some(x => x.id === s)) return s;
  } catch { /* */ }
  return deviceLang();
}
export const lang: Lang = pick();
const dict: Record<string, string> | null = lang === 'ro' ? null : DICTS[lang];
try { document.documentElement.lang = lang; } catch { /* */ }

/** textele care nu au inca traducere (le vezi in consola cu i18nMissing() in modul dezvoltator) */
const missing = new Set<string>();

const fill = (s: string, args: unknown[]) => (args.length ? s.replace(/\{(\d+)\}/g, (m, i) => (+i < args.length ? String(args[+i]) : m)) : s);
/** traducerea unui text romanesc; {0}, {1}… se inlocuiesc cu args */
export function $t(ro: string, ...args: unknown[]): string {
  if (!dict) return fill(ro, args);
  const tr = dict[ro];
  if (tr === undefined || tr === '') { if (missing.size < 5000) missing.add(ro); return fill(ro, args); }
  return fill(tr, args);
}
/** alege limba (din Setari): se tine minte si jocul porneste din nou in limba aleasa */
export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l); } catch { /* */ }
  location.reload();
}
/** pentru teste si pentru modul dezvoltator */
(globalThis as any).i18nMissing = () => [...missing];
