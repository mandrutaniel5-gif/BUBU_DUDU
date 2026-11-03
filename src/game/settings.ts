import type { CharId } from '../char/draw';
import type { NetConfig } from '../net/types';

export interface SettingsData {
  who: CharId;
  net: NetConfig;
  dayMinutes: number;   // cate minute reale dureaza o zi in joc
  muted: boolean;
  resetAt?: number;   // cand s-a pornit un joc nou
}

const KEY = 'bd-settings';
const DEF: SettingsData = {
  who: 'bubu',
  net: {
    mode: 'solo', room: 'casuta-noastra', serverUrl: 'auto',
    firebase: { apiKey: '', authDomain: '', databaseURL: '', projectId: '', appId: '' },
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
    }
    return cur!;
  },
  set(p: Partial<SettingsData>) { cur = { ...this.get(), ...p }; try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch { /* */ } },
};
