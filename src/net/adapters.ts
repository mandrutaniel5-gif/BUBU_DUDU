import type { CharId } from '../char/draw';
import type { NetAdapter, NetConfig, NetEvent, NetStatus, PlayerState } from './types';
import { deviceId } from '../game/settings';
import { $t } from '../i18n';

/** locul (Bubu / Dudu) e ocupat de ALT telefon, conectat acum (semn de viata in ultimele 2 minute) */
/** cate evenimente neconfirmate tinem in zbor spre Firebase */
const EV_MAX = 40;
export function seatTaken(p: any, dev: string, now: number) { return !!p?.online && !!p.dev && p.dev !== dev && now - (Number(p.ts) || 0) < 120000; }

abstract class Base implements NetAdapter {
  abstract kind: string;
  status: NetStatus = 'offline';
  onState?: (s: PlayerState) => void;
  onStatus?: (s: NetStatus, msg?: string) => void;
  // ne conectam inainte ca lumea sa fie incarcata: ce vine de la partener pana atunci (versiunea lui, „e aici”, cererea de sincronizare)
  // nu se pierde (Firebase sterge evenimentul dupa ce l-a dat), ci asteapta pana jocul e gata sa-l primeasca
  private evH?: (e: NetEvent) => void; private evQ: NetEvent[] = [];
  private prH?: (who: CharId, online: boolean) => void; private prLast = new Map<CharId, boolean>();
  get onEvent(): (e: NetEvent) => void { return this.evH ?? (e => { if (this.evQ.length < 500) this.evQ.push(e); }); }
  set onEvent(h: ((e: NetEvent) => void) | undefined) { this.evH = h; if (h) { const q = this.evQ; this.evQ = []; q.forEach(e => h(e)); } }
  get onPresence(): (who: CharId, online: boolean) => void { return this.prH ?? ((w, on) => { this.prLast.set(w, on); }); }
  set onPresence(h: ((who: CharId, online: boolean) => void) | undefined) { this.prH = h; if (h) { const l = [...this.prLast]; this.prLast.clear(); l.forEach(([w, on]) => h(w, on)); } }
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
      // 1.12.0: locul e al unui singur telefon. Daca altcineva e deja Bubu (sau Dudu) in casa asta, nu intri peste el
      const dev = deviceId(), off = await this.serverOffset();
      // (citire + scriere, nu tranzactie: tranzactia pe nodul in care scriem apoi pozitia de 10 ori pe secunda strica Firebase-ul)
      const cur = await this.once(meRef);
      if (seatTaken(cur, dev, Date.now() + off)) { this.taken = true; this.setStatus('error', $t('{0} e deja în casă pe alt telefon', me === 'bubu' ? 'Bubu' : 'Dudu')); return; }
      await fb.update(meRef, { online: true, ts: fb.serverTimestamp(), dev });
      this.dev = dev;
      fb.onDisconnect(meRef).update({ online: false });
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
      this.off = off; this.unsub.push(fb.onValue(fb.ref(this.db, '.info/serverTimeOffset'), (s2: any) => { this.off = Number(s2.val()) || 0; }));
      this.unsub.push(fb.onValue(fb.ref(this.db, '.info/connected'), (snap: any) => { this.connected = snap.val() === true; if (snap.val() === true) { this.setStatus('online'); fb.update(meRef, { online: true, ts: fb.serverTimestamp(), dev }); fb.onDisconnect(meRef).update({ online: false }); if (this.pendingUp && !this.upTimer) this.upTimer = setTimeout(() => this.flushUp(), 1500); } else this.setStatus('connecting'); }));
      this.setStatus('online');
    } catch (e) { this.setStatus('error', 'Firebase: ' + (e as Error).message); }
  }
  /** locul lui Bubu / Dudu e luat de alt telefon: jocul nu intra (vezi WorldScene.enter) */
  taken = false; private dev = ''; private off = 0;
  /** 1.14.2: legatura reala cu Firebase. Fara ea nu trimitem pozitia: Firebase punea la coada fiecare scriere (10 pe secunda cat
   *  telefonul era fara net / jocul minimizat) si la reconectare le trimitea pe toate odata -> „Maximum call stack size exceeded” */
  private connected = false;
  now() { return Date.now() + this.off; }
  private async serverOffset() { try { return Number(await this.once(this.fb.ref(this.db, '.info/serverTimeOffset'))) || 0; } catch { return 0; } }
  /** valoarea de acum a unui nod (onValue o data; get() crapa in Firebase cand meniul a ascultat inainte camera: „childPathObj.split”) */
  private once(ref: any): Promise<any> { return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), 8000); this.fb.onValue(ref, (snap: any) => { clearTimeout(t); res(snap.val()); }, (e: Error) => { clearTimeout(t); rej(e); }, { onlyOnce: true }); }); }
  disconnect() {
    this.unsub.forEach(u => u()); this.unsub = [];
    // iesi din casa: locul se elibereaza imediat (nu dupa ce Firebase observa ca s-a rupt conexiunea)
    if (this.db && !this.taken && this.dev) this.fb.update(this.fb.ref(this.db, `rooms/${this.room}/players/${this.me}`), { online: false }).catch(() => {});
    this.setStatus('offline');
  }
  private lastState = 0;
  /** 1.14.3: cel mult O scriere de pozitie in zbor. „.info/connected” ramane true inca ~1 minut dupa ce telefonul a pierdut
   *  netul / a stins ecranul; in timpul asta Firebase strangea in coada sute de scrieri pe acelasi nod si, la reconectare,
   *  le aplica recursiv -> „Maximum call stack size exceeded” (raport 22.11, v1.14.2). Acum asteptam confirmarea celei
   *  dinainte: offline nu se mai aduna nimic, iar la reconectare pleaca doar pozitia de acum. */
  private stateInFlight = 0;
  sendState(s: PlayerState) {
    const now = Date.now();
    if (!this.db || this.taken || !this.connected || document.hidden || now - this.lastState < 100) return; // max 10/s, doar cu legatura
    if (this.stateInFlight && now - this.stateInFlight < 20000) return; // asteptam confirmarea (dupa 20 s o socotim pierduta)
    this.lastState = now; this.stateInFlight = now;
    const done = () => { this.stateInFlight = 0; };
    try { this.fb.update(this.fb.ref(this.db, `rooms/${this.room}/players/${this.me}`), { online: true, state: clean(s), ts: this.fb.serverTimestamp() }).then(done, done); } catch (err) { done(); console.warn('stare netrimisa', err); }
  }
  // 1.15.3: pe iPhone, dupa minute in fundal, Firebase trimitea dintr-odata tot ce se adunase in coada si dadea
  // „Maximum call stack size exceeded” (send → sendData_ → sendRequest). Evenimentele sunt de moment: fara legatura
  // nu le mai punem in coada, si tinem cel mult EV_MAX neconfirmate.
  private evInFlight = 0;
  sendEvent(e: NetEvent) {
    if (!this.db || this.taken || !this.connected || this.evInFlight >= EV_MAX) return;
    this.evInFlight++; const done = () => { this.evInFlight = Math.max(0, this.evInFlight - 1); };
    try { this.fb.push(this.fb.ref(this.db, `rooms/${this.room}/events`), { from: this.me, e: clean(e), ts: Date.now() }).then(done, done); } catch (err) { done(); console.warn('eveniment netrimis', err); }
  }
  // lumea intreaga se urca in Firebase cel mult o data la 45 s (si imediat la inchidere / minimizare) -> mai putina baterie si date mobile
  private lastUp = 0; private upTimer: ReturnType<typeof setTimeout> | null = null; private pendingUp: { json: string; ts: number } | null = null;
  async saveWorld(json: string, ts: number, force = false) {
    await super.saveWorld(json, ts);
    if (!this.db) return;
    this.pendingUp = { json, ts };
    const wait = 45000 - (Date.now() - this.lastUp);
    if (force || wait <= 0) { if (this.upTimer) { clearTimeout(this.upTimer); this.upTimer = null; } await this.flushUp(); }
    else if (!this.upTimer) this.upTimer = setTimeout(() => this.flushUp(), wait);
  }
  /** urca ultima salvare; fara legatura asteapta reconectarea (o singura scriere, nu o coada de salvari) */
  private upBusy = false;
  private async flushUp() {
    this.upTimer = null; const p = this.pendingUp;
    if (!p || !this.db || this.taken) return;
    if (!this.connected || this.upBusy) return; // la reconectare (.info/connected) se reincearca
    this.pendingUp = null; this.lastUp = Date.now(); this.upBusy = true;
    try { await this.fb.set(this.fb.ref(this.db, `rooms/${this.room}/save`), p); } catch { if (!this.pendingUp) this.pendingUp = p; } finally { this.upBusy = false; }
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
    case 'firebase': return new FirebaseAdapter(cfg.firebase);
    default: return new SoloAdapter();
  }
}
