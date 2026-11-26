// Numele alese de jucatori (1.13.0). In cod personajele raman „bubu” (ea, hamsterita alba) si „dudu” (el, hamsterul auriu): id-urile,
// salvarile si genul gramatical (g() din gender.ts) nu se schimba. Pe ecran, oriunde scrie „Bubu” / „Dudu” (texte, jurnal,
// ferestre, canvas, salvari vechi), apare numele ales: filtrul sta in stratul de text din ui/icons.ts (canvas + pagina).
import { SPECS } from '../char/draw';
import { setTextFilter } from '../ui/icons';

/** pana isi alege fiecare numele */
export const DEFAULT_NAME = { bubu: 'Luna', dudu: 'Leo' } as const; // 1.16 (pana atunci Pufi si Ghem)
/** numele jocului (aplicatia, meniul, fisierele). Se schimba doar aici */
export const GAME_NAME = 'Twogether';
/** doar litere, cifre, spatiu, cratima, punct; cel mult 14 caractere (numele ajung si in HTML) */
export function cleanName(s: string | undefined | null): string {
  return String(s ?? '').normalize('NFC').replace(/[^\p{L}\p{N} .-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
}
let on = false;
const RX = /\b(Bubu|Dudu)\b/g;
const filter = (t: string) => (t.indexOf('Bubu') < 0 && t.indexOf('Dudu') < 0 ? t : t.replace(RX, m => (m === 'Bubu' ? SPECS.bubu.name : SPECS.dudu.name)));
/** numele de acum (din lume); null = inapoi la meniu (filtrul se opreste) */
export function setNames(n: { bubu?: string; dudu?: string } | null) {
  if (!n) { on = false; SPECS.bubu.name = 'Bubu'; SPECS.dudu.name = 'Dudu'; setTextFilter(null); return; }
  SPECS.bubu.name = cleanName(n.bubu) || DEFAULT_NAME.bubu;
  SPECS.dudu.name = cleanName(n.dudu) || DEFAULT_NAME.dudu;
  if (!on) { on = true; setTextFilter(filter); }
}
export const nameOf = (id: 'bubu' | 'dudu') => SPECS[id].name;
