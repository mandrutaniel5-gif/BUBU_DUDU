import type { CharId } from '../char/draw';

/** Starea transmisa des (pozitie). */
export interface PlayerState { who: CharId; gx: number; gy: number; flip: 1 | -1; back: boolean; moving: boolean; mood: string; ts: number; }

/** Evenimente discrete. */
export type NetEvent =
  | { t: 'emote'; who: CharId; anim: string }
  | { t: 'pair'; who: CharId; pair: string }
  | { t: 'op'; op: WorldOp }
  | { t: 'chat'; who: CharId; text: string }
  | { t: 'mini'; who: CharId; data: unknown }
  | { t: 'act'; who: CharId; act: string | null; furn?: string };

export type WorldOp =
  | { k: 'furn'; key: string; value: unknown }
  | { k: 'need'; who: CharId; need: string; delta: number }
  | { k: 'hearts'; delta: number }
  | { k: 'sick'; who: CharId; value: string | null }
  | { k: 'jar'; from: CharId; text: string; ts: number }
  | { k: 'log'; text: string; ts: number }
  | { k: 'char'; who: CharId; state: unknown }
  | { k: 'res'; res: string; delta: number }
  | { k: 'place'; uid: string; type: string; gx: number; gy: number }
  | { k: 'unplace'; uid: string }
  | { k: 'node'; id: string; until: number }
  | { k: 'money'; delta: number }
  | { k: 'stat'; key: string; delta: number }
  | { k: 'grass'; key: string; value: number }
  | { k: 'grassAll' }
  | { k: 'npcs'; list: unknown[] }
  | { k: 'npcServe'; id: string };

export type NetStatus = 'offline' | 'connecting' | 'online' | 'error';

export interface NetAdapter {
  readonly kind: string;
  status: NetStatus;
  connect(room: string, me: CharId): Promise<void>;
  disconnect(): void;
  sendState(s: PlayerState): void;
  sendEvent(e: NetEvent): void;
  /** salvare in cloud (snapshot complet al lumii) */
  saveWorld(json: string, ts: number): Promise<void>;
  loadWorld(): Promise<{ json: string; ts: number } | null>;
  onState?: (s: PlayerState) => void;
  onEvent?: (e: NetEvent) => void;
  onPresence?: (who: CharId, online: boolean) => void;
  onStatus?: (s: NetStatus, msg?: string) => void;
}

export interface NetConfig {
  mode: 'solo' | 'local' | 'server' | 'firebase';
  room: string;          // codul cuplului, ex. "bubududu-iubire"
  serverUrl: string;     // ex. ws://192.168.1.50:8787 sau wss://s10.tailnet.ts.net
  firebase: { apiKey: string; authDomain: string; databaseURL: string; projectId: string; appId: string };
}
