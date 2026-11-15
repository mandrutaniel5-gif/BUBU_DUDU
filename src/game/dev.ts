// Modul dezvoltator (1.12.0): se deblocheaza cu codul secret (Meniu → ⚙ Setări → atingi de 5 ori versiunea de jos).
// In repo nu sta codul, doar amprenta lui (SHA-256): repo-ul e public. Testele automate il pornesc cu ?dev in adresa.
// Uneltele (totul nelimitat, capitolele, zilele, sarbatorile...) merg doar in „Lumea de test” / modul cu 2 tab-uri:
// nimic nu se scrie in casele online, deci partenerul nu vede nimic din teste.
import { sha256 } from '../net/house';

const KEY = 'bd-dev-unlock';
const HASH = 'be57660b4943d1a9872ccf3d3268e9bbf4f9405c78e9ec592881d4e0e605f455';
/** camera lumii de test (doar pe telefonul asta) */
export const DEV_ROOM = 'dev-test';

export const DEV = (() => {
  try { return new URLSearchParams(location.search).has('dev') || localStorage.getItem(KEY) === HASH; } catch { return false; }
})();
/** codul e bun? atunci modul dezvoltator ramane pornit pe telefonul asta */
export function unlockDev(code: string): boolean {
  if (sha256('bubududu|dev|' + code) !== HASH) return false;
  try { localStorage.setItem(KEY, HASH); } catch { /* fara stocare */ }
  return true;
}
export function lockDev() { try { localStorage.removeItem(KEY); localStorage.removeItem('bd-infinite'); } catch { /* */ } }
