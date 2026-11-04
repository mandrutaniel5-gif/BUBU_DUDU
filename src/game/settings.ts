import type { CharId } from '../char/draw';
import type { NetConfig } from '../net/types';

export interface SettingsData {
  who: CharId;
  net: NetConfig;
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
    mode: 'firebase', room: 'casuta-noastra', serverUrl: 'auto',
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
      // vechea adresa de exemplu -> conectare automata (adresa S10 luata de pe GitHub)
      if (!cur!.net.serverUrl || cur!.net.serverUrl === 'ws://192.168.1.50:8787') cur!.net.serverUrl = 'auto';
      // fara config propriu -> Firebase-ul nostru
      if (!cur!.net.firebase?.databaseURL) cur!.net.firebase = { ...BUILTIN_FIREBASE };
    }
    return cur!;
  },
  set(p: Partial<SettingsData>) { cur = { ...this.get(), ...p }; try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch { /* */ } },
};
