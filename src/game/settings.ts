import type { CharId } from '../char/draw';
import type { NetConfig } from '../net/types';

/** o casa in care ati intrat (ramane in lista din meniu: nu mai scrii codul si parola de fiecare data) */
export interface SavedHouse { code: string; room: string; who: CharId; mode: 'firebase'; at: number }
/** camera jocului Offline (doar pe telefonul asta, fara cloud) */
export const OFFLINE_ROOM = 'offline';

export interface SettingsData {
  who: CharId;
  net: NetConfig;
  /** casele voastre (1.12.0) */
  houses?: SavedHouse[];
  dayMinutes: number;   // cate minute reale dureaza o zi in joc
  muted: boolean;
  /** economisire baterie: cel mult 30 cadre/s cand nu se misca nimic, rezolutie putin mai mica pe telefon */
  eco?: boolean;
  resetAt?: number;   // cand s-a pornit un joc nou
}

const KEY = 'bd-settings';
/** Firebase-ul nostru (proiectul bubu-dudu): jocul merge online fara server, fara configurare */
export const BUILTIN_FIREBASE = {
  apiKey: 'AIzaSyDJWuVMS-25cWrfXdekLuvJDIaKIbRyDaY',
  authDomain: 'bubu-dudu-76256.firebaseapp.com',
  databaseURL: 'https://bubu-dudu-76256-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'bubu-dudu-76256',
  appId: '1:130758674850:web:7b5971eb421cea3fe60afb',
};
const DEF: SettingsData = {
  who: 'bubu',
  net: {
    mode: 'solo', room: OFFLINE_ROOM,
    firebase: { ...BUILTIN_FIREBASE },
  },
  dayMinutes: 24,
  muted: false,
};

let cur: SettingsData | null = null;
export const Settings = {
  get(): SettingsData {
    if (!cur) {
      try { const s = localStorage.getItem(KEY); cur = s ? { ...DEF, ...JSON.parse(s), net: { ...DEF.net, ...JSON.parse(s).net } } : structuredClone(DEF); }
      catch { cur = structuredClone(DEF); }
      // 1.12.0: serverul nostru (S10) a fost scos: casele de acolo nu mai sunt in lista, jocul trece pe Offline
      if ((cur!.net.mode as string) === 'server') cur!.net = { ...cur!.net, mode: 'solo', room: OFFLINE_ROOM, code: undefined };
      if (cur!.houses?.some(h => (h.mode as string) !== 'firebase')) cur!.houses = cur!.houses.filter(h => h.mode === 'firebase');
      delete (cur!.net as { serverUrl?: string }).serverUrl;
      // fara config propriu -> Firebase-ul nostru
      if (!cur!.net.firebase?.databaseURL) cur!.net.firebase = { ...BUILTIN_FIREBASE };
      migrateHouses(cur!);
    }
    return cur!;
  },
  set(p: Partial<SettingsData>) { cur = { ...this.get(), ...p }; try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch { /* */ } },
  /** tii minte casa (sus in lista: cea mai recenta) */
  rememberHouse(h: Omit<SavedHouse, 'at'>) {
    const list = (this.get().houses ?? []).filter(x => x.room !== h.room);
    this.set({ houses: [{ ...h, at: Date.now() }, ...list].slice(0, 8) });
  },
  forgetHouse(room: string) { this.set({ houses: (this.get().houses ?? []).filter(x => x.room !== room) }); },
};
/** id-ul telefonului (ca sa stim ca locul lui Bubu / Dudu e ocupat de ALT telefon) */
export function deviceId() {
  try { let d = localStorage.getItem('bd-dev'); if (!d) { d = Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join(''); localStorage.setItem('bd-dev', d); } return d; }
  catch { return 'x'; }
}
/**
 * 1.12.0: casa de pana acum intra in lista de case; jocul Offline are salvarea lui.
 * Inainte, jocul solo fara casa folosea camera comuna „casuta-noastra” si copia din cloud era aceeasi pentru toti
 * jucatorii noi (cine instala jocul primea lumea altcuiva). Salvarea de pe telefon o mutam in Offline.
 */
function migrateHouses(s: SettingsData) {
  if (s.houses) return;
  s.houses = [];
  const secure = /^h[0-9a-f]{39}$/.test(s.net.room || '');
  if (secure && s.net.code && s.net.mode === 'firebase') s.houses.push({ code: s.net.code, room: s.net.room, who: s.who, mode: 'firebase', at: Date.now() });
  try {
    if (!localStorage.getItem('bd-save-' + OFFLINE_ROOM)) {
      const old = !secure && s.net.room ? localStorage.getItem('bd-save-' + s.net.room) : null;
      if (old) localStorage.setItem('bd-save-' + OFFLINE_ROOM, old);
    }
  } catch { /* fara stocare */ }
  if (!secure && s.net.room !== OFFLINE_ROOM) s.net = { ...s.net, room: OFFLINE_ROOM, mode: 'solo' };
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* */ }
}
