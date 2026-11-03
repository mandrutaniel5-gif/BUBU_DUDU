import type { CharId } from '../char/draw';
import type { NetAdapter, NetConfig, NetEvent, NetStatus, PlayerState } from './types';

abstract class Base implements NetAdapter {
  abstract kind: string;
  status: NetStatus = 'offline';
  onState?: (s: PlayerState) => void;
  onEvent?: (e: NetEvent) => void;
  onPresence?: (who: CharId, online: boolean) => void;
  onStatus?: (s: NetStatus, msg?: string) => void;
  protected room = ''; protected me: CharId = 'bubu';
  protected setStatus(s: NetStatus, msg?: string) { this.status = s; this.onStatus?.(s, msg); }
  abstract connect(room: string, me: CharId): Promise<void>;
  abstract disconnect(): void;
  abstract sendState(s: PlayerState): void;
  abstract sendEvent(e: NetEvent): void;
  // salvare locala implicita
  async saveWorld(json: string, ts: number) { try { localStorage.setItem(`bd-save-${this.room}`, JSON.stringify({ json, ts })); } catch { /* plin */ } }
  async loadWorld() { try { const s = localStorage.getItem(`bd-save-${this.room}`); return s ? JSON.parse(s) : null; } catch { return null; } }
}

/** Solo: fara retea, partenerul e controlat de AI. */
export class SoloAdapter extends Base {
  kind = 'solo';
  async connect(room: string, me: CharId) { this.room = room; this.me = me; this.setStatus('offline'); }
  disconnect() {}
  sendState() {}
  sendEvent() {}
}

/** Test: doua tab-uri in acelasi browser (BroadcastChannel). */
export class LocalTabsAdapter extends Base {
  kind = 'local';
  private ch: BroadcastChannel | null = null;
  private seen = 0; private timer = 0;
  async connect(room: string, me: CharId) {
    this.room = room; this.me = me;
    this.ch = new BroadcastChannel('bd-' + room);
    this.ch.onmessage = (m) => this.handle(m.data);
    this.ch.postMessage({ t: 'hello', who: me });
    this.timer = window.setInterval(() => {
      this.ch?.postMessage({ t: 'ping', who: me });
      if (this.seen && Date.now() - this.seen > 3000) { this.seen = 0; this.onPresence?.(me === 'bubu' ? 'dudu' : 'bubu', false); }
    }, 1000);
    this.setStatus('online');
  }
  private handle(d: any) {
    if (d.who === this.me) return;
    if (!this.seen) this.onPresence?.(d.who, true);
    this.seen = Date.now();
    if (d.t === 'hello') this.ch?.postMessage({ t: 'ping', who: this.me });
    if (d.t === 'state') this.onState?.(d.s);
    if (d.t === 'ev') this.onEvent?.(d.e);
  }
  disconnect() { clearInterval(this.timer); this.ch?.close(); this.ch = null; this.setStatus('offline'); }
  sendState(s: PlayerState) { this.ch?.postMessage({ t: 'state', who: this.me, s }); }
  sendEvent(e: NetEvent) { this.ch?.postMessage({ t: 'ev', who: this.me, e }); }
}

/** Server propriu (Node.js pe Samsung S10 cu Termux, sau pe orice PC). */
export class WsAdapter extends Base {
  kind = 'server';
  private ws: WebSocket | null = null;
  private retry = 0; private closing = false;
  private pendingLoad: ((v: { json: string; ts: number } | null) => void) | null = null;
  constructor(private url: string) {
    super();
    // accepta si adrese scrise ca https://xxx.trycloudflare.com sau doar 192.168.1.50:8787
    let u = (url || '').trim();
    if (/^https:\/\//i.test(u)) u = 'wss://' + u.slice(8);
    else if (/^http:\/\//i.test(u)) u = 'ws://' + u.slice(7);
    else if (!/^wss?:\/\//i.test(u)) u = (/^(\d|localhost)/.test(u) ? 'ws://' : 'wss://') + u;
    this.url = u.replace(/\/+$/, '');
  }
  async connect(room: string, me: CharId) {
    this.room = room; this.me = me; this.closing = false;
    this.open();
    // asteptam deschiderea (max 3 s), ca incarcarea salvarii sa vina de pe server
    await new Promise<void>(res => { const t0 = Date.now(); const iv = setInterval(() => { if (this.ws?.readyState === 1 || Date.now() - t0 > 3000) { clearInterval(iv); res(); } }, 50); });
  }
  private open() {
    this.setStatus('connecting');
    let ws: WebSocket;
    try { ws = new WebSocket(this.url); } catch (e) { this.setStatus('error', String(e)); return; }
    this.ws = ws;
    ws.onopen = () => { this.retry = 0; ws.send(JSON.stringify({ t: 'join', room: this.room, who: this.me })); this.setStatus('online'); };
    ws.onmessage = (m) => {
      let d: any; try { d = JSON.parse(m.data); } catch { return; }
      if (d.t === 'state') this.onState?.(d.s);
      else if (d.t === 'ev') this.onEvent?.(d.e);
      else if (d.t === 'presence') this.onPresence?.(d.who, d.online);
      else if (d.t === 'save') { this.pendingLoad?.(d.data ?? null); this.pendingLoad = null; }
    };
    ws.onclose = () => {
      this.ws = null;
      if (this.closing) return;
      this.setStatus('error', 'Conexiune pierdută, reîncerc...');
      const delay = Math.min(15000, 1000 * 2 ** this.retry++);
      setTimeout(() => !this.closing && this.open(), delay);
    };
    ws.onerror = () => { /* onclose se ocupa */ };
  }
  private send(o: unknown) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(o)); }
  disconnect() { this.closing = true; this.ws?.close(); this.setStatus('offline'); }
  sendState(s: PlayerState) { this.send({ t: 'state', s }); }
  sendEvent(e: NetEvent) { this.send({ t: 'ev', e }); }
  async saveWorld(json: string, ts: number) { await super.saveWorld(json, ts); this.send({ t: 'save', data: { json, ts } }); }
  async loadWorld() {
    const local = await super.loadWorld();
    if (this.ws?.readyState !== 1) return local;
    const remote = await new Promise<{ json: string; ts: number } | null>(res => { this.pendingLoad = res; this.send({ t: 'load' }); setTimeout(() => res(null), 4000); });
    if (remote && (!local || remote.ts > local.ts)) return remote;
    return local;
  }
}

/** Firebase Realtime Database (fara server propriu). */
export class FirebaseAdapter extends Base {
  kind = 'firebase';
  private db: any; private fb: any; private unsub: (() => void)[] = [];
  private startTs = Date.now();
  constructor(private cfg: NetConfig['firebase']) { super(); }
  async connect(room: string, me: CharId) {
    this.room = room; this.me = me; this.setStatus('connecting');
    try {
      const [{ initializeApp, getApps }, fb] = await Promise.all([import('firebase/app'), import('firebase/database')]);
      const app = getApps()[0] ?? initializeApp(this.cfg);
      this.fb = fb; this.db = fb.getDatabase(app);
      const other: CharId = me === 'bubu' ? 'dudu' : 'bubu';
      const meRef = fb.ref(this.db, `rooms/${room}/players/${me}`);
      await fb.set(meRef, { online: true, ts: Date.now() });
      fb.onDisconnect(meRef).set({ online: false, ts: Date.now() });
      this.unsub.push(fb.onValue(fb.ref(this.db, `rooms/${room}/players/${other}`), (snap: any) => {
        const v = snap.val(); this.onPresence?.(other, !!v?.online);
        if (v?.state) this.onState?.(v.state);
      }));
      const evRef = fb.query(fb.ref(this.db, `rooms/${room}/events`), fb.orderByChild('ts'), fb.startAt(this.startTs));
      this.unsub.push(fb.onChildAdded(evRef, (snap: any) => { const v = snap.val(); if (v.from !== me) this.onEvent?.(v.e); }));
      this.setStatus('online');
    } catch (e) { this.setStatus('error', 'Firebase: ' + (e as Error).message); }
  }
  disconnect() { this.unsub.forEach(u => u()); this.unsub = []; this.setStatus('offline'); }
  private lastState = 0;
  sendState(s: PlayerState) {
    if (!this.db || Date.now() - this.lastState < 100) return; // max 10/s
    this.lastState = Date.now();
    this.fb.update(this.fb.ref(this.db, `rooms/${this.room}/players/${this.me}`), { online: true, state: s, ts: Date.now() });
  }
  sendEvent(e: NetEvent) { if (this.db) this.fb.push(this.fb.ref(this.db, `rooms/${this.room}/events`), { from: this.me, e, ts: Date.now() }); }
  async saveWorld(json: string, ts: number) { await super.saveWorld(json, ts); if (this.db) await this.fb.set(this.fb.ref(this.db, `rooms/${this.room}/save`), { json, ts }); }
  async loadWorld() {
    const local = await super.loadWorld();
    if (!this.db) return local;
    try { const snap = await this.fb.get(this.fb.ref(this.db, `rooms/${this.room}/save`)); const r = snap.val(); if (r && (!local || r.ts > local.ts)) return r; } catch { /* offline */ }
    return local;
  }
}

export function makeAdapter(cfg: NetConfig): NetAdapter {
  switch (cfg.mode) {
    case 'local': return new LocalTabsAdapter();
    case 'server': return new WsAdapter(cfg.serverUrl);
    case 'firebase': return new FirebaseAdapter(cfg.firebase);
    default: return new SoloAdapter();
  }
}
