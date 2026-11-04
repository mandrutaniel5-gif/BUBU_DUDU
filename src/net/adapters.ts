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
  private auto = false;
  constructor(private url: string) {
    super();
    this.auto = !url || /^auto/i.test(url.trim());
    this.url = WsAdapter.norm(url);
  }
  /** accepta si adrese scrise ca https://xxx.trycloudflare.com sau doar 192.168.1.50:8787 */
  static norm(url: string) {
    let u = (url || '').trim();
    if (/^https:\/\//i.test(u)) u = 'wss://' + u.slice(8);
    else if (/^http:\/\//i.test(u)) u = 'ws://' + u.slice(7);
    else if (!/^wss?:\/\//i.test(u)) u = (/^(\d|localhost)/.test(u) ? 'ws://' : 'wss://') + u;
    return u.replace(/\/+$/, '');
  }
  /** "automat": adresa serverului de pe S10 e publicata de script in repository (server-url.txt) */
  static async resolveAuto(): Promise<string | null> {
    try {
      const r = await fetch('https://api.github.com/repos/mandrutaniel5-gif/BUBU_DUDU/contents/server-url.txt', { headers: { Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' });
      if (!r.ok) return null;
      const t = (await r.text()).trim();
      let u = ''; try { u = JSON.parse(t).url; } catch { u = t; }
      return u ? WsAdapter.norm(u) : null;
    } catch { return null; }
  }
  async connect(room: string, me: CharId) {
    this.room = room; this.me = me; this.closing = false;
    this.open();
    // asteptam deschiderea (max 3 s), ca incarcarea salvarii sa vina de pe server
    await new Promise<void>(res => { const t0 = Date.now(); const iv = setInterval(() => { if (this.ws?.readyState === 1 || Date.now() - t0 > 3000) { clearInterval(iv); res(); } }, 50); });
  }
  private async open() {
    this.setStatus('connecting');
    if (this.auto) {
      // la fiecare (re)conectare luam adresa curenta: tunelul isi schimba adresa la repornire
      const u = await WsAdapter.resolveAuto();
      if (u) this.url = u;
      else if (!/^wss?:\/\/./.test(this.url) || /auto/.test(this.url)) { this.setStatus('error', 'Nu găsesc serverul S10 (pornește-l pe telefon)'); const d = Math.min(15000, 2000 * 2 ** this.retry++); setTimeout(() => !this.closing && this.open(), d); return; }
    }
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
  private lastUp = 0;
  async saveWorld(json: string, ts: number, force = false) { await super.saveWorld(json, ts); if (force || Date.now() - this.lastUp > 30000) { this.lastUp = Date.now(); this.send({ t: 'save', data: { json, ts } }); } }
  async loadWorld() {
    const local = await super.loadWorld();
    if (this.ws?.readyState !== 1) return local;
    const remote = await new Promise<{ json: string; ts: number } | null>(res => { this.pendingLoad = res; this.send({ t: 'load' }); setTimeout(() => res(null), 4000); });
    if (remote && (!local || remote.ts > local.ts)) return remote;
    return local;
  }
}

/** Firebase nu accepta campuri `undefined` (arunca eroare si evenimentul se pierde): le scoatem */
const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

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
      // nodul partenerului se schimba de ~10 ori pe secunda (pozitia lui); anuntam prezenta doar cand chiar se schimba
      let wasOnline: boolean | null = null;
      this.unsub.push(fb.onValue(fb.ref(this.db, `rooms/${room}/players/${other}`), (snap: any) => {
        const v = snap.val(); const on = !!v?.online;
        if (on !== wasOnline) { wasOnline = on; this.onPresence?.(other, on); }
        if (v?.state) this.onState?.(v.state);
      }));
      // evenimentele partenerului: le citim si le stergem (baza de date ramane mica); 30 s toleranta la ceasuri diferite
      const evRef = fb.query(fb.ref(this.db, `rooms/${room}/events`), fb.orderByChild('ts'), fb.startAt(this.startTs - 30000));
      this.unsub.push(fb.onChildAdded(evRef, (snap: any) => { const v = snap.val(); if (!v || v.from === me) return; this.onEvent?.(v.e); fb.remove(snap.ref).catch(() => {}); }));
      // conexiunea reala cu Firebase (online / reconectare)
      this.unsub.push(fb.onValue(fb.ref(this.db, '.info/connected'), (snap: any) => { if (snap.val() === true) { this.setStatus('online'); fb.set(meRef, { online: true, ts: Date.now() }); fb.onDisconnect(meRef).set({ online: false, ts: Date.now() }); } else this.setStatus('connecting'); }));
      this.setStatus('online');
    } catch (e) { this.setStatus('error', 'Firebase: ' + (e as Error).message); }
  }
  disconnect() { this.unsub.forEach(u => u()); this.unsub = []; this.setStatus('offline'); }
  private lastState = 0;
  sendState(s: PlayerState) {
    if (!this.db || Date.now() - this.lastState < 100) return; // max 10/s
    this.lastState = Date.now();
    this.fb.update(this.fb.ref(this.db, `rooms/${this.room}/players/${this.me}`), { online: true, state: clean(s), ts: Date.now() }).catch(() => { /* offline: urmatoarea */ });
  }
  sendEvent(e: NetEvent) { if (!this.db) return; try { this.fb.push(this.fb.ref(this.db, `rooms/${this.room}/events`), { from: this.me, e: clean(e), ts: Date.now() }).catch(() => { /* offline */ }); } catch (err) { console.warn('eveniment netrimis', err); } }
  // lumea intreaga se urca in Firebase cel mult o data la 45 s (si imediat la inchidere / minimizare) -> mai putina baterie si date mobile
  private lastUp = 0; private upTimer: ReturnType<typeof setTimeout> | null = null; private pendingUp: { json: string; ts: number } | null = null;
  async saveWorld(json: string, ts: number, force = false) {
    await super.saveWorld(json, ts);
    if (!this.db) return;
    this.pendingUp = { json, ts };
    const flush = async () => { this.upTimer = null; const p = this.pendingUp; if (!p || !this.db) return; this.pendingUp = null; this.lastUp = Date.now(); try { await this.fb.set(this.fb.ref(this.db, `rooms/${this.room}/save`), p); } catch { /* offline: data viitoare */ } };
    const wait = 45000 - (Date.now() - this.lastUp);
    if (force || wait <= 0) { if (this.upTimer) { clearTimeout(this.upTimer); this.upTimer = null; } await flush(); }
    else if (!this.upTimer) this.upTimer = setTimeout(flush, wait);
  }
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
