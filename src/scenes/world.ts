// Scena principala: casa izometrica, cei doi ursuleti, nevoi, activitati, multiplayer.
import { Actor } from '../char/actor';
import { ANIMS, ANIM_LIST } from '../char/anims';
import { Fx } from '../char/fx';
import type { CharId } from '../char/draw';
import { Sfx } from '../engine/sfx';
import type { Scene, Game } from '../engine/game';
import { iso, unIso, screenDirToGrid, isoBox, boxOf, TW, TH } from '../world/iso';
import { FURNITURE, WALLS, type Furn, type Wall } from '../world/map';
import { drawFurn, drawWall, renderFloor, type FurnState } from '../world/furniture';
import { Nav } from '../world/nav';
import { ACTIVITIES, type Activity } from '../game/activities';
import { newWorld, moodFrom, tickNeeds, applyOp, clockText, nightAmount, NEEDS, NEED_INFO, SICK_INFO, REQUESTS, type WorldState, type NeedKey } from '../game/state';
import type { NetAdapter, NetEvent, PlayerState, WorldOp } from '../net/types';
import { Hud } from '../ui/hud';
import { Settings } from '../game/settings';
import { MINIGAMES } from '../minigames/registry';

const ACTOR_SCALE = 0.62;
const SPEED = 2.6; // dale / secunda

interface Pawn {
  id: CharId;
  actor: Actor;
  gx: number; gy: number;
  path: { x: number; y: number }[];
  activity: { a: Activity; t: number; furn: Furn } | null;
  pendingInteract: Furn | null;
  control: 'me' | 'remote' | 'ai';
  remoteTarget?: { gx: number; gy: number };
  z: number; // inaltimea (cand sta pe obiecte)
  aiT: number;
  facingBack: boolean;
  fleeT?: number;
}

export const PAIRS = [
  { id: 'hug', label: 'Îmbrățișare', icon: '🤗', aAnim: 'hugpose', bAnim: 'hugpose', delay: 0, needs: { love: 15, fun: 4 }, needsB: { love: 15, fun: 4 } },
  { id: 'kiss', label: 'Pupic', icon: '💋', aAnim: 'kisspose', bAnim: 'kisspose', delay: 0, needs: { love: 20 }, needsB: { love: 20 } },
  { id: 'slap', label: 'Palmă la fund', icon: '🍑', aAnim: 'slap', bAnim: 'slapped', delay: 0.48, needs: { fun: 12, love: 4 }, needsB: { love: 6, fun: 6 } },
  { id: 'bonk', label: 'Tigaia în cap', icon: '🍳', aAnim: 'pan', bAnim: 'dizzy', delay: 1.2, needs: { fun: 15 }, needsB: { fun: 4, health: -2 }, only: 'bubu' as CharId },
  { id: 'fartatk', label: 'Atac cu pârț', icon: '☁️', aAnim: 'fartback', bAnim: 'faint', delay: 1.0, needs: { fun: 18 }, needsB: { fun: -4, hygiene: -6 }, fart: 30 },
  { id: 'tickle', label: 'Gâdilat', icon: '🤭', aAnim: 'laugh', bAnim: 'laugh', delay: 0.2, needs: { fun: 12, love: 6 }, needsB: { fun: 14, love: 6 } },
  { id: 'steal', label: 'Fură gustarea', icon: '🍰', aAnim: 'shakebutt', bAnim: 'angry', delay: 0.3, needs: { fun: 14, hunger: 6 }, needsB: { fun: -3 } },
  { id: 'care', label: 'Îngrijește', icon: '🩹', aAnim: 'love', bAnim: 'shy', delay: 0.3, needs: { love: 8 }, needsB: { health: 26, love: 12 }, sickOnly: true },
];

export class WorldScene implements Scene {
  fx = new Fx();
  nav = new Nav();
  floor = renderFloor();
  w: WorldState = newWorld();
  me: Pawn; partner: Pawn;
  cam = { x: 0, y: 0, zoom: 1.4 };
  keys = new Set<string>();
  joy = { active: false, id: -1, sx: 0, sy: 0, x: 0, y: 0 };
  hud!: Hud;
  shake = 0;
  time = 0;
  saveT = 0; syncT = 0; stateT = 0;
  partnerOnline = false;
  sickT = 4;
  snoring = false; snoreT = 3;
  miniInbox: unknown[] = [];
  minigame: { id: string; obj: any } | null = null;
  private listeners: [EventTarget, string, any][] = [];

  constructor(private game: Game, public net: NetAdapter, public myId: CharId) {
    const other: CharId = myId === 'bubu' ? 'dudu' : 'bubu';
    this.me = this.makePawn(myId, 'me');
    this.partner = this.makePawn(other, 'ai');
  }

  private makePawn(id: CharId, control: Pawn['control']): Pawn {
    const actor = new Actor(id, this.fx);
    actor.scale = ACTOR_SCALE;
    return { id, actor, gx: 6, gy: 10, path: [], activity: null, pendingInteract: null, control, z: 0, aiT: 2, facingBack: false };
  }
  pawnOf(id: CharId) { return this.me.id === id ? this.me : this.partner; }

  async enter() {
    this.hud = new Hud(this);
    this.net.onStatus = (s, msg) => this.hud.setNet(s, msg);
    await this.net.connect(Settings.get().net.room, this.myId);
    // incarca salvarea
    const saved = await this.net.loadWorld();
    if (saved) { try { const w = JSON.parse(saved.json) as WorldState; if (w.v === 1) this.w = { ...newWorld(), ...w }; } catch { /* corupt */ } }
    for (const p of [this.me, this.partner]) { const c = this.w.chars[p.id]; p.gx = c.gx; p.gy = c.gy; if (this.nav.hits(p.gx, p.gy)) { p.gx = 6.5 + (p.id === 'dudu' ? 0.8 : 0); p.gy = 8.4; } }
    this.cam.x = iso(this.me.gx, this.me.gy).x; this.cam.y = iso(this.me.gx, this.me.gy).y;
    // retea
    this.net.onState = s => this.onRemoteState(s);
    this.net.onEvent = e => this.onRemoteEvent(e);
    this.net.onPresence = (_who, on) => this.setPartnerOnline(on);
    this.net.onStatus = (s, msg) => this.hud.setNet(s, msg);
    this.hud.setNet(this.net.status);
    // "cat ai lipsit"
    const last = Number(localStorage.getItem('bd-last-seen-' + this.myId) || 0);
    const news = this.w.log.filter(l => l.ts > last);
    if (news.length) setTimeout(() => this.hud.showLog(news.map(n => n.text)), 600);
    this.bindInput();
  }

  exit() {
    this.save();
    this.net.disconnect();
    for (const [t, ev, fn] of this.listeners) t.removeEventListener(ev, fn);
    this.hud.destroy();
  }

  // ------------------------------------------------------------------ retea
  setPartnerOnline(on: boolean) {
    this.partnerOnline = on;
    this.partner.control = on ? 'remote' : 'ai';
    this.hud.setPartner(on);
    this.hud.toast(on ? `${this.partner.actor.spec.name} a intrat în joc! 💞` : `${this.partner.actor.spec.name} a ieșit. Îl joacă AI-ul 🤖`);
    if (on) this.sendCharSync();
  }
  onRemoteState(s: PlayerState) {
    if (s.who !== this.partner.id) return;
    if (!this.partnerOnline) this.setPartnerOnline(true);
    this.partner.remoteTarget = { gx: s.gx, gy: s.gy };
    this.partner.actor.flip = s.flip; this.partner.facingBack = s.back;
    this.partner.actor.moving = s.moving;
  }
  onRemoteEvent(e: NetEvent) {
    switch (e.t) {
      case 'emote': this.pawnOf(e.who).actor.play(e.anim); break;
      case 'pair': this.runPair(e.who, e.pair, false); break;
      case 'op': this.applyLocal(e.op); break;
      case 'chat': this.hud.toast(`${e.who === 'bubu' ? '🐼' : '🐻'} ${e.text}`); break;
      case 'mini': this.onMiniEvent(e.who, e.data); break;
      case 'act': {
        const p = this.pawnOf(e.who); if (p.control !== 'remote') break;
        if (e.act && ACTIVITIES[e.act]) { const f = FURNITURE.find(x => x.id === e.furn); if (f) this.startActivity(p, ACTIVITIES[e.act], f, true); }
        else if (!e.act && p.activity) { p.activity = null; p.actor.stop(); p.z = 0; p.facingBack = false; }
        break;
      }
    }
  }
  /** aplica local si trimite partenerului */
  op(o: WorldOp) { this.applyLocal(o); this.net.sendEvent({ t: 'op', op: o }); }
  applyLocal(o: WorldOp) {
    if (o.k === 'char') { if (o.who !== this.myId) Object.assign(this.w.chars[o.who], o.state as object); return; }
    applyOp(this.w, o);
    if (o.k === 'jar' && o.from !== this.myId) this.hud.toast('💌 Ai primit un bilețel în Borcanul cu iubire!');
  }
  sendCharSync() {
    const c = this.w.chars[this.myId]; c.gx = this.me.gx; c.gy = this.me.gy;
    this.net.sendEvent({ t: 'op', op: { k: 'char', who: this.myId, state: c } });
  }
  log(text: string) { this.op({ k: 'log', text, ts: Date.now() }); }
  save() {
    for (const p of [this.me, this.partner]) { this.w.chars[p.id].gx = p.gx; this.w.chars[p.id].gy = p.gy; }
    this.w.ts = Date.now();
    this.net.saveWorld(JSON.stringify(this.w), this.w.ts);
    try { localStorage.setItem('bd-last-seen-' + this.myId, String(Date.now())); } catch { /* */ }
  }

  // ------------------------------------------------------------------ input
  private on(t: EventTarget, ev: string, fn: any, opt?: any) { t.addEventListener(ev, fn, opt); this.listeners.push([t, ev, fn]); }
  bindInput() {
    this.on(window, 'keydown', (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      this.keys.add(e.key.toLowerCase());
      if (this.minigame) { if (e.key === 'Escape') { this.minigame.obj.abort?.(); return; } this.minigame.obj.key?.(e.key.toLowerCase(), true); return; }
      const k = e.key.toLowerCase();
      if (k === 'e' || k === ' ') { e.preventDefault(); this.doAction(); }
      if (k === 'f') this.fartJump();
      if (k === 'q') this.hud.toggleEmotes();
      if (k === 'r') this.hud.togglePairs();
      const n = parseInt(k); if (n >= 1 && n <= 9) { const list = ANIM_LIST.filter(a => a.kind === 'emote' || a.kind === 'dance'); if (list[n - 1]) this.emote(list[n - 1].id); }
    });
    this.on(window, 'keyup', (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()); this.minigame?.obj.key?.(e.key.toLowerCase(), false); });
    const cv = this.game.canvas;
    this.on(cv, 'pointerdown', (e: PointerEvent) => {
      Sfx.unlock();
      if (this.minigame) {
        const b = this.minigame.obj.box;
        if (b && e.clientX > b.x + b.w - 44 && e.clientX < b.x + b.w + 6 && e.clientY > b.y - 6 && e.clientY < b.y + 40) { this.minigame.obj.abort?.(); return; }
        this.minigame.obj.pointer?.('down', e.clientX, e.clientY); return;
      }
      if (e.clientX < this.game.w * 0.45 && e.clientY > this.game.h * 0.45 && e.pointerType !== 'mouse') {
        this.joy = { active: true, id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY };
        return;
      }
      this.tapAt(e.clientX, e.clientY);
    });
    this.on(cv, 'pointermove', (e: PointerEvent) => {
      if (this.minigame) { this.minigame.obj.pointer?.('move', e.clientX, e.clientY); return; }
      if (this.joy.active && e.pointerId === this.joy.id) { this.joy.x = e.clientX; this.joy.y = e.clientY; }
    });
    const up = (e: PointerEvent) => {
      if (this.minigame) { this.minigame.obj.pointer?.('up', e.clientX, e.clientY); return; }
      if (e.pointerId === this.joy.id) this.joy.active = false;
    };
    this.on(cv, 'pointerup', up); this.on(cv, 'pointercancel', up);
    this.on(cv, 'wheel', (e: WheelEvent) => { this.cam.zoom = Math.max(0.7, Math.min(2.6, this.cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1))); }, { passive: true });
  }

  screenToGrid(sx: number, sy: number) {
    const wx = (sx - this.game.w / 2) / this.cam.zoom + this.cam.x;
    const wy = (sy - this.game.h / 2) / this.cam.zoom + this.cam.y;
    return unIso(wx, wy);
  }

  tapAt(sx: number, sy: number) {
    const g = this.screenToGrid(sx, sy);
    // a atins partenerul?
    const pd = Math.hypot(g.x - this.partner.gx, g.y - this.partner.gy);
    if (pd < 0.9) { this.walkTo(this.partner.gx + 0.7, this.partner.gy + 0.2); this.hud.togglePairs(true); return; }
    // a atins un obiect? (verificam si "inaltimea" obiectului, apasand putin mai jos)
    for (const lift of [0, 0.5, 1.0]) {
      const gg = { x: g.x + lift, y: g.y + lift };
      const f = FURNITURE.find(f => f.action && gg.x >= f.gx && gg.x <= f.gx + f.w && gg.y >= f.gy && gg.y <= f.gy + f.d);
      if (f) { this.goInteract(this.me, f); return; }
    }
    this.walkTo(g.x, g.y);
  }

  walkTo(gx: number, gy: number, pawn = this.me) {
    this.stopActivity(pawn);
    const p = this.nav.path(pawn.gx, pawn.gy, gx, gy);
    if (p) { pawn.path = p; pawn.pendingInteract = null; }
    else if (pawn === this.me) this.fx.text(iso(gx, gy).x, iso(gx, gy).y - 20, '✖', '#999', 0.6);
  }

  goInteract(pawn: Pawn, f: Furn) {
    this.stopActivity(pawn);
    const spot = this.nav.standSpot(f.gx, f.gy, f.w, f.d, pawn.gx, pawn.gy);
    if (!spot) return;
    const p = this.nav.path(pawn.gx, pawn.gy, spot.x, spot.y);
    if (!p) return;
    pawn.path = p; pawn.pendingInteract = f;
    if (!p.length) this.interact(pawn, f);
  }

  // ------------------------------------------------------------------ actiuni
  nearestFurn(pawn: Pawn): Furn | null {
    let best: Furn | null = null, bd = 1.0;
    for (const f of FURNITURE) {
      if (!f.action) continue;
      const cx = Math.max(f.gx, Math.min(pawn.gx, f.gx + f.w)), cy = Math.max(f.gy, Math.min(pawn.gy, f.gy + f.d));
      const d = Math.hypot(pawn.gx - cx, pawn.gy - cy);
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  }
  nearPartner() { return Math.hypot(this.me.gx - this.partner.gx, this.me.gy - this.partner.gy) < 1.7; }

  doAction() {
    if (this.me.activity) { this.stopActivity(this.me); return; }
    const f = this.nearestFurn(this.me);
    if (f) this.interact(this.me, f);
    else if (this.nearPartner()) this.hud.togglePairs(true);
  }

  /** ce actiune se face cu un obiect (depinde de stare) */
  actionFor(f: Furn): { id: string; label: string; icon: string } | null {
    if (!f.action) return null;
    if (f.id === 'toilet' && this.w.furn.clogged) return { id: 'unclog', label: 'Desfundă toaleta!', icon: '🪠' };
    if (f.id === 'bed' && this.partner.activity?.a.id === 'sleep' && !this.me.activity) return { id: 'pinch', label: 'Astupă-i nasul 🤏', icon: '😴' };
    if (f.id === 'ns1') return { id: 'lamp', label: this.w.furn.lampOn ? 'Stinge lampa' : 'Aprinde lampa', icon: '💡' };
    if (f.id === 'mail') return { id: 'mail', label: 'Borcanul cu iubire', icon: '💌' };
    return f.action;
  }

  interact(pawn: Pawn, f: Furn) {
    const act = this.actionFor(f); if (!act) return;
    pawn.path = []; pawn.pendingInteract = null;
    if (act.id === 'lamp') { this.op({ k: 'furn', key: 'lampOn', value: !this.w.furn.lampOn }); Sfx.play('click'); return; }
    if (act.id === 'mail') { if (pawn === this.me) this.hud.openJar(); return; }
    if (act.id === 'dress') { if (pawn === this.me) this.hud.openWardrobe(); return; }
    if (act.id === 'toilet' && this.w.furn.clogged) return;
    const a = ACTIVITIES[act.id]; if (!a) return;
    if (act.id === 'pinch' && pawn === this.me) { this.startMinigame('snore', a, f); return; }
    // minijoc pentru jucator (daca exista)
    if (pawn === this.me && a.minigame && MINIGAMES[a.minigame]) { this.startMinigame(a.minigame, a, f); return; }
    this.startActivity(pawn, a, f);
  }

  /** ajutor (debug / AI): mergi la obiectul cu id-ul dat si interactioneaza */
  goTo(id: string, who: 'me' | 'partner' = 'me') { const f = FURNITURE.find(x => x.id === id); if (f) this.goInteract(who === 'me' ? this.me : this.partner, f); }

  startActivity(pawn: Pawn, a: Activity, f: Furn, fromNet = false) {
    if (a.place === 'sofa') f = FURNITURE.find(x => x.id === 'sofa')!;
    pawn.activity = { a, t: 0, furn: f };
    // pozitionare pe obiect
    const slot = pawn.id === 'bubu' ? 0 : 1;
    pawn.z = 0;
    if (a.place === 'bed') { pawn.gx = f.gx + 0.55 + slot * 0.95; pawn.gy = f.gy + 0.62; pawn.z = 34; }
    else if (a.place === 'tub') { pawn.gx = f.gx + 0.6 + slot * 0.8; pawn.gy = f.gy + 0.5; pawn.z = 24; }
    else if (a.place === 'toilet') { pawn.gx = f.gx + 0.5; pawn.gy = f.gy + 0.6; pawn.z = 12; }
    else if (a.place === 'sofa') { pawn.gx = f.gx + 0.45; pawn.gy = f.gy + 0.6 + slot * 0.8; pawn.z = 10; }
    else { // in picioare, cu fata spre obiect
      const cx = f.gx + f.w / 2, cy = f.gy + f.d / 2;
      const s = iso(cx - pawn.gx, cy - pawn.gy);
      pawn.actor.flip = s.x >= 0 ? 1 : -1; pawn.facingBack = s.y < 0;
    }
    if (a.place === 'sofa') { pawn.actor.flip = -1; pawn.facingBack = true; }
    if (a.place === 'bed' || a.place === 'tub' || a.place === 'toilet') { pawn.facingBack = false; pawn.actor.flip = 1; }
    pawn.actor.play(a.anim);
    if (fromNet) return;
    if (a.furnFlag) this.op({ k: 'furn', key: a.furnFlag[0], value: a.furnFlag[1] });
    this.net.sendEvent({ t: 'act', who: pawn.id, act: a.id, furn: f.id });
  }

  stopActivity(pawn: Pawn, completed = false) {
    const act = pawn.activity; if (!act) return;
    pawn.activity = null; pawn.actor.stop();
    if (pawn.control !== 'remote') this.net.sendEvent({ t: 'act', who: pawn.id, act: null });
    if (act.a.furnFlag) this.op({ k: 'furn', key: act.a.furnFlag[0], value: act.a.furnFlag[2] });
    // coboara de pe obiect
    if (pawn.z > 0 || this.nav.hits(pawn.gx, pawn.gy)) {
      const s = this.nav.standSpot(act.furn.gx, act.furn.gy, act.furn.w, act.furn.d, pawn.gx + 0.5, pawn.gy + 1);
      if (s) { pawn.gx = s.x; pawn.gy = s.y; }
      pawn.z = 0;
    }
    pawn.facingBack = false;
    if (completed) this.completeActivity(pawn, act.a);
  }

  completeActivity(pawn: Pawn, a: Activity) {
    const ctrl = pawn.control !== 'remote';
    if (ctrl) for (const [k, v] of Object.entries(a.needs)) this.op({ k: 'need', who: pawn.id, need: k, delta: v! });
    const pos = iso(pawn.gx, pawn.gy, 70);
    this.fx.text(pos.x, pos.y, a.text, '#ff4d6d', 0.6);
    if (pawn === this.me) { this.op({ k: 'hearts', delta: 2 }); Sfx.play('good'); }
    // urmari amuzante
    if (a.id === 'toilet' && ctrl) {
      const chance = pawn.id === 'dudu' ? 0.55 : 0.2;
      if (Math.random() < chance) {
        this.op({ k: 'furn', key: 'clogged', value: true });
        const who = pawn.actor.spec.name;
        this.hud.toast(`🚽💩 ${who} a înfundat toaleta! Cine o desfundă?`);
        this.log(`${who} a înfundat toaleta 🚽 (te așteaptă o pompă 🪠)`);
        pawn.actor.play('shy');
      }
    }
    if (a.id === 'unclog') {
      this.op({ k: 'furn', key: 'clogged', value: false });
      this.log(`${pawn.actor.spec.name} a desfundat toaleta 🪠✨ Erou!`);
    }
    if (a.id === 'garden' && ctrl) {
      const crops = [...(this.w.furn.crops as number[])];
      const i = crops.findIndex(c => c < 3); if (i >= 0) crops[i]++;
      this.op({ k: 'furn', key: 'crops', value: crops });
    }
    if (a.id === 'snack' || a.id === 'eat') { if (ctrl) this.op({ k: 'need', who: pawn.id, need: 'fart', delta: 15 }); }
  }

  emote(id: string) {
    if (this.me.activity) this.stopActivity(this.me);
    this.me.path = [];
    this.me.actor.play(id);
    this.net.sendEvent({ t: 'emote', who: this.myId, anim: id });
    const a = ANIMS[id];
    if (a?.kind === 'dance') this.op({ k: 'need', who: this.myId, need: 'fun', delta: 6 });
    if (id === 'fart') { this.op({ k: 'need', who: this.myId, need: 'fart', delta: -20 }); }
    this.hud.closeMenus();
  }

  fartJump() {
    const c = this.w.chars[this.myId];
    if (c.fart < 25) { this.hud.toast('💨 Nu ai destule gaze... mănâncă ceva! 🫘'); this.me.actor.play('puppy'); return; }
    this.op({ k: 'need', who: this.myId, need: 'fart', delta: -25 });
    this.op({ k: 'need', who: this.myId, need: 'fun', delta: 8 });
    if (this.me.activity) this.stopActivity(this.me);
    this.me.path = [];
    this.me.actor.play('fartjump');
    this.net.sendEvent({ t: 'emote', who: this.myId, anim: 'fartjump' });
    // salt in directia privirii, trecand peste obstacole joase
    const dir = screenDirToGrid(this.me.actor.flip * 1, this.me.facingBack ? -0.5 : 0.5);
    const start = { x: this.me.gx, y: this.me.gy };
    let tgt = { x: start.x + dir.x * 2.6, y: start.y + dir.y * 2.6 };
    if (this.nav.hits(tgt.x, tgt.y)) tgt = start;
    this.jump = { from: start, to: tgt, t: 0 };
  }
  jump: { from: { x: number; y: number }; to: { x: number; y: number }; t: number } | null = null;

  pairAction(id: string) {
    const pr = PAIRS.find(p => p.id === id)!;
    if (pr.only && pr.only !== this.myId) return;
    if (!this.nearPartner()) { this.hud.toast('Apropie-te de partener 💞'); return; }
    if (pr.fart && this.w.chars[this.myId].fart < pr.fart) { this.hud.toast('💨 Nu ai destule gaze!'); return; }
    if (pr.sickOnly && !this.w.chars[this.partner.id].sick) { this.hud.toast(`${this.partner.actor.spec.name} nu e bolnav(ă) 🙂`); return; }
    if (id === 'care') {
      const req = this.w.chars[this.partner.id].request ?? 'kiss';
      const mini = REQUESTS[req]?.mini;
      this.hud.closeMenus();
      if (mini && MINIGAMES[mini]) { this.startCare(mini); return; }
    }
    this.net.sendEvent({ t: 'pair', who: this.myId, pair: id });
    this.runPair(this.myId, id, true);
    this.hud.closeMenus();
  }

  startBedtime() {
    const M = MINIGAMES.bedtime;
    for (const p of [this.me, this.partner]) if (p.activity) p.activity.t = -9999;
    this.minigame = { id: 'bedtime', obj: new M(this, (score: number) => {
      this.minigame = null; this.hud.setMinigame(false);
      for (const p of [this.me, this.partner]) if (p.activity) p.activity.t = 0;
      this.op({ k: 'hearts', delta: Math.round(score * 5) });
      for (const p of [this.me, this.partner]) if (p.control !== 'remote') { this.op({ k: 'need', who: p.id, need: 'love', delta: 25 }); this.op({ k: 'need', who: p.id, need: 'fun', delta: 10 }); }
      this.log('Ați adormit îmbrățișați 🌙💕');
    }) };
    this.hud.setMinigame(true);
  }

  /** minijoc de ingrijire; la succes -> actiunea 'care' pentru partener */
  startCare(mini: string) {
    const M = MINIGAMES[mini];
    this.stopActivity(this.me); this.me.path = [];
    this.minigame = { id: mini, obj: new M(this, (score: number) => {
      this.minigame = null; this.hud.setMinigame(false);
      if (score > 0) {
        this.net.sendEvent({ t: 'pair', who: this.myId, pair: 'care' });
        this.runPair(this.myId, 'care', true);
        this.op({ k: 'hearts', delta: Math.round(score * 6) });
        this.log(`${this.me.actor.spec.name} a avut grijă de ${this.partner.actor.spec.name} 🩹💕`);
      }
    }) };
    this.hud.setMinigame(true);
  }

  runPair(initiator: CharId, id: string, local: boolean) {
    const pr = PAIRS.find(p => p.id === id); if (!pr) return;
    const A = this.pawnOf(initiator), B = A === this.me ? this.partner : this.me;
    this.stopActivity(A); this.stopActivity(B); A.path = []; B.path = [];
    // aliniere: A langa B, fata in fata
    const side = iso(A.gx - B.gx, A.gy - B.gy).x >= 0 ? 1 : -1;
    const gap = id === 'hug' ? 0.55 : id === 'kiss' ? 0.65 : 0.85;
    const off = screenDirToGrid(side, 0);
    const tx = B.gx + off.x * gap, ty = B.gy + off.y * gap;
    if (!this.nav.hits(tx, ty) && (A.control !== 'remote')) { A.gx = tx; A.gy = ty; }
    A.actor.flip = side > 0 ? -1 : 1; B.actor.flip = side > 0 ? 1 : -1;
    A.facingBack = false; B.facingBack = false;
    A.actor.play(pr.aAnim);
    setTimeout(() => {
      B.actor.play(pr.bAnim);
      if (id === 'hug' || id === 'kiss') { const p = iso((A.gx + B.gx) / 2, (A.gy + B.gy) / 2, 80); this.fx.hearts(p.x, p.y, 8); }
    }, pr.delay * 1000);
    // efectele asupra nevoilor: fiecare client aplica pentru personajele pe care le controleaza
    const ctrlA = A.control !== 'remote', ctrlB = B.control !== 'remote';
    if (ctrlA) for (const [k, v] of Object.entries(pr.needs)) this.op({ k: 'need', who: A.id, need: k, delta: v });
    if (ctrlB) for (const [k, v] of Object.entries(pr.needsB)) this.op({ k: 'need', who: B.id, need: k, delta: v });
    if (ctrlA && pr.fart) this.op({ k: 'need', who: A.id, need: 'fart', delta: -pr.fart });
    if (id === 'care' && ctrlB) {
      this.w.chars[B.id].request = null;
      if (this.w.chars[B.id].sick && this.w.chars[B.id].needs.health > 68) {
        this.op({ k: 'sick', who: B.id, value: null });
        setTimeout(() => { B.actor.play('dance_hop'); this.hud.toast(`🎉 ${B.actor.spec.name} s-a vindecat! Mulțumită lui/ei ${A.actor.spec.name} 💕`); }, 2600);
        this.log(`${B.actor.spec.name} s-a vindecat datorită lui/ei ${A.actor.spec.name} 🎉`);
      }
      this.sendCharSync();
    }
    if (id === 'steal') {
      const p = iso(A.gx, A.gy, 90); this.fx.text(p.x, p.y, 'Hihihi! 🍰', '#c77dff', 0.9);
      if (A.control === 'ai') { A.fleeT = 12; }
      if (B === this.me) this.hud.toast(`${A.actor.spec.name} ți-a furat prăjitura! Prinde-l/o! 🏃`);
    }
    if (local) this.op({ k: 'hearts', delta: 1 });
    void local;
  }

  // ------------------------------------------------------------------ minijocuri
  startMinigame(id: string, a: Activity, f: Furn) {
    const M = MINIGAMES[id];
    this.startActivity(this.me, a, f);
    this.me.activity!.t = -9999; // nu se termina singura
    this.minigame = {
      id, obj: new M(this, (score: number) => {
        this.minigame = null; this.hud.setMinigame(false);
        const done = score > 0;
        if (done) {
          const extra = (this.minigame as any)?.obj?.bonusFart;
          this.stopActivity(this.me, true); this.op({ k: 'hearts', delta: Math.round(score * 6) });
          if (id === 'fridge' && extra) this.op({ k: 'need', who: this.myId, need: 'fart', delta: extra });
        }
        else this.stopActivity(this.me, false);
      }),
    };
    this.hud.setMinigame(true);
  }
  onMiniEvent(_who: CharId, data: unknown) {
    if (this.minigame?.obj.net) this.minigame.obj.net(data);
    else { this.miniInbox.push(data); if (this.miniInbox.length > 20) this.miniInbox.shift(); }
  }

  /** bolnavul suna din clopotel */
  ringBell() {
    const c = this.w.chars[this.myId]; if (!c.sick) return;
    const r = REQUESTS[c.request ?? 'kiss'];
    const text = `🔔 ${this.me.actor.spec.name} te cheamă: vrea ${r.icon} ${r.label}!`;
    this.net.sendEvent({ t: 'chat', who: this.myId, text });
    this.me.actor.play('puppy'); this.net.sendEvent({ t: 'emote', who: this.myId, anim: 'puppy' });
    this.hud.toast('🔔 Ai sunat din clopoțel...');
    Sfx.play('coin');
  }

  // ------------------------------------------------------------------ update
  update(dt: number) {
    this.time += dt;
    if (this.minigame) { this.minigame.obj.update(dt); }
    // timp de joc: 1 secunda reala = 1 minut de joc (o zi = 24 min)
    const dayLen = Settings.get().dayMinutes * 60;
    const absMin = (Date.now() / 1000 / dayLen) * 1440;
    this.w.minutes = absMin % 1440; this.w.day = 1 + Math.max(0, Math.floor((Date.now() - (this.w.created ?? Date.now())) / 1000 / dayLen));
    const hours = dt / 60 * (1440 / dayLen) * 60 / 60;

    // nevoi (doar pentru personajele controlate local)
    for (const p of [this.me, this.partner]) {
      if (p.control === 'remote') continue;
      const ev = tickNeeds(this.w.chars[p.id], hours, p.activity?.a.id === 'sleep');
      if (ev.includes('sick')) {
        const s = this.w.chars[p.id].sick!;
        this.hud.toast(`${SICK_INFO[s].icon} ${p.actor.spec.name} s-a îmbolnăvit (${SICK_INFO[s].label})! Are nevoie de îngrijire 🩹`);
        this.log(`${p.actor.spec.name} s-a îmbolnăvit: ${SICK_INFO[s].label} ${SICK_INFO[s].icon}`);
        this.sendCharSync();
      }
    }
    for (const p of [this.me, this.partner]) { p.actor.mood = moodFrom(this.w.chars[p.id]); p.actor.outfit = this.w.chars[p.id].outfit; }
    this.sickT -= dt;
    if (this.sickT <= 0) {
      this.sickT = 7 + Math.random() * 6;
      for (const p of [this.me, this.partner]) {
        const c = this.w.chars[p.id];
        if (p.control === 'remote' || !c.sick) continue;
        if (!c.request) { const keys = Object.keys(REQUESTS); c.request = keys[Math.floor(Math.random() * keys.length)]; this.sendCharSync(); }
        if (!p.activity && !p.actor.busy) {
          const sym = c.sick === 'cold' ? 'sneeze' : c.sick === 'tummy' ? 'fart' : 'sick';
          p.actor.play(sym); this.net.sendEvent({ t: 'emote', who: p.id, anim: sym });
        }
      }
    }

    // rutina de seara: amandoi in pat, o data pe zi de joc
    if (!this.minigame && this.me.activity?.a.id === 'sleep' && this.partner.activity?.a.id === 'sleep') {
      const key = 'bed-' + this.w.day;
      if (!this.w.stats[key]) { this.w.stats[key] = 1; this.startBedtime(); }
    }
    // sforaitul (cand partenerul doarme si tu esti treaz/treaza)
    this.snoreT -= dt;
    if (this.snoreT <= 0) {
      this.snoreT = 2.2;
      const sl = [this.me, this.partner].find(p => p.activity?.a.id === 'sleep' && (p.id === 'dudu' || Math.random() < 0.4));
      this.snoring = !!sl && !(this.me.activity?.a.id === 'sleep' && this.partner.activity?.a.id === 'sleep');
      if (sl && this.snoring) {
        const pp = iso(sl.gx, sl.gy, sl.z + 40);
        this.fx.text(pp.x + 20, pp.y - 20, Math.random() < 0.5 ? 'HRRRR…' : 'PSHHH…', '#6a4c93', 0.7);
        if (sl !== this.me) this.shake = Math.max(this.shake, 3);
      }
    }
    this.updateMe(dt);
    this.updatePartner(dt);
    for (const p of [this.me, this.partner]) this.updateActivity(p, dt);

    for (const p of [this.me, this.partner]) {
      const s = iso(p.gx, p.gy, p.z);
      p.actor.x = s.x; p.actor.y = s.y;
      p.actor.update(dt);
      // vazut din spate cand merge "in sus"
      if (p.actor.anim.id === 'walk' || p.actor.anim.id === 'idle') p.actor.pose.back = p.facingBack;
      if (p.actor.shakeReq) { this.shake = Math.max(this.shake, p.actor.shakeReq); p.actor.shakeReq = 0; }
    }
    this.fx.update(dt);
    this.shake *= Math.pow(0.02, dt);

    // camera urmareste jucatorul
    const target = iso(this.me.gx, this.me.gy, 30);
    this.cam.x += (target.x - this.cam.x) * Math.min(1, dt * 4);
    this.cam.y += (target.y - this.cam.y) * Math.min(1, dt * 4);

    // retea + salvare
    this.stateT -= dt; this.syncT -= dt; this.saveT -= dt;
    if (this.stateT <= 0) { this.stateT = 0.1; this.net.sendState({ who: this.myId, gx: this.me.gx, gy: this.me.gy, flip: this.me.actor.flip, back: this.me.facingBack, moving: this.me.actor.moving, mood: this.me.actor.mood, ts: Date.now() }); }
    if (this.syncT <= 0) { this.syncT = 2; this.sendCharSync(); }
    if (this.saveT <= 0) { this.saveT = 10; this.save(); }
    this.hud.update();
  }

  private moveBy(p: Pawn, vx: number, vy: number, dt: number) {
    const nx = p.gx + vx * dt, ny = p.gy + vy * dt;
    if (!this.nav.hits(nx, p.gy)) p.gx = nx;
    if (!this.nav.hits(p.gx, ny)) p.gy = ny;
    const s = iso(vx, vy);
    if (Math.abs(s.x) > 0.01) p.actor.flip = s.x > 0 ? 1 : -1;
    p.facingBack = s.y < -0.01;
  }

  private followPath(p: Pawn, dt: number) {
    if (!p.path.length) return false;
    const t = p.path[0];
    const dx = t.x - p.gx, dy = t.y - p.gy, d = Math.hypot(dx, dy);
    const sp = SPEED * (this.w.chars[p.id].sick ? 0.6 : 1) * (p.id === 'dudu' ? 1.08 : 1);
    if (d < 0.08) { p.path.shift(); if (!p.path.length && p.pendingInteract) { const f = p.pendingInteract; p.pendingInteract = null; this.interact(p, f); } return true; }
    this.moveBy(p, dx / d * sp, dy / d * sp, Math.min(dt, d / sp));
    return true;
  }

  updateMe(dt: number) {
    const p = this.me;
    if (this.jump) {
      this.jump.t += dt / 1.3;
      const q = Math.min(1, Math.max(0, (this.jump.t - 0.23) / 0.4));
      p.gx = this.jump.from.x + (this.jump.to.x - this.jump.from.x) * q;
      p.gy = this.jump.from.y + (this.jump.to.y - this.jump.from.y) * q;
      if (this.jump.t >= 1) this.jump = null;
      p.actor.moving = false;
      return;
    }
    let ix = 0, iy = 0;
    const k = this.keys;
    if (!this.minigame) {
      if (k.has('a') || k.has('arrowleft')) ix -= 1;
      if (k.has('d') || k.has('arrowright')) ix += 1;
      if (k.has('w') || k.has('arrowup')) iy -= 1;
      if (k.has('s') || k.has('arrowdown')) iy += 1;
      if (this.joy.active) {
        const jx = this.joy.x - this.joy.sx, jy = this.joy.y - this.joy.sy;
        const l = Math.hypot(jx, jy);
        if (l > 8) { ix = jx / Math.max(l, 50); iy = jy / Math.max(l, 50); }
      }
    }
    if (ix || iy) {
      if (p.activity) this.stopActivity(p);
      if (p.actor.busy && p.actor.anim.kind !== 'base') p.actor.stop();
      p.path = []; p.pendingInteract = null;
      const mag = Math.min(1, Math.hypot(ix, iy));
      const g = screenDirToGrid(ix, iy * 2); // compensare izometrica: "sus" pe ecran
      const sp = SPEED * mag * (this.w.chars[p.id].sick ? 0.6 : 1);
      this.moveBy(p, g.x * sp, g.y * sp, dt);
      p.actor.moving = true;
      if (Math.random() < dt * 3) Sfx.play('step');
    } else {
      p.actor.moving = this.followPath(p, dt);
    }
  }

  updatePartner(dt: number) {
    const p = this.partner;
    if (p.control === 'remote') {
      if (p.remoteTarget && !p.activity) {
        const dx = p.remoteTarget.gx - p.gx, dy = p.remoteTarget.gy - p.gy, d = Math.hypot(dx, dy);
        if (d > 3) { p.gx = p.remoteTarget.gx; p.gy = p.remoteTarget.gy; }
        else { p.gx += dx * Math.min(1, dt * 10); p.gy += dy * Math.min(1, dt * 10); }
      }
      return;
    }
    // ---- AI simplu: ce nevoie e cea mai mica -> mergi la obiectul potrivit
    if (p.fleeT && p.fleeT > 0 && !p.activity) { this.aiFlee(p, dt); return; }
    if (p.activity || p.actor.busy && p.actor.anim.kind !== 'base') { p.actor.moving = false; return; }
    if (this.followPath(p, dt)) { p.actor.moving = true; return; }
    p.actor.moving = false;
    p.aiT -= dt;
    if (p.aiT > 0) return;
    p.aiT = 3 + Math.random() * 5;
    const c = this.w.chars[p.id];
    // AI-ul vine si el in pat cand te culci
    if (this.me.activity?.a.id === 'sleep' && !p.activity) { this.goTo('bed', 'partner'); p.aiT = 4; return; }
    // AI-ul are grija de tine cand esti bolnav(a)
    if (this.w.chars[this.me.id].sick && !c.sick) {
      if (this.nearPartnerAI()) { this.runPair(p.id, 'care', true); this.hud.toast(`${p.actor.spec.name} are grijă de tine 🩹💕`); p.aiT = 12; }
      else { const path = this.nav.path(p.gx, p.gy, this.me.gx + 0.6, this.me.gy + 0.3) ?? this.nav.path(p.gx, p.gy, this.me.gx - 0.6, this.me.gy); if (path) p.path = path; p.aiT = 1.5; }
      return;
    }
    const low = (Object.entries(c.needs) as [NeedKey, number][]).filter(([k]) => k !== 'health').sort((a, b) => a[1] - b[1])[0];
    const pick = (ids: string[]) => FURNITURE.find(f => f.action && ids.includes(f.action.id));
    let target: Furn | undefined;
    if (low[1] < 55) {
      if (low[0] === 'hunger') target = pick(['snack', 'eat']);
      else if (low[0] === 'energy') target = pick(['sleep']);
      else if (low[0] === 'hygiene') target = pick(['bath', 'teeth']);
      else if (low[0] === 'fun') target = pick(Math.random() < 0.5 ? ['tv'] : ['read', 'garden']);
      else if (low[0] === 'love') { // vine dupa tine pentru o imbratisare
        const sp = this.nav.standSpot(Math.floor(this.me.gx), Math.floor(this.me.gy), 1, 1, p.gx, p.gy);
        if (sp) { const path = this.nav.path(p.gx, p.gy, sp.x, sp.y); if (path) { p.path = path; p.aiT = 6; } }
        if (this.nearPartnerAI()) { this.runPair(p.id, Math.random() < 0.5 ? 'hug' : 'kiss', true); }
        return;
      }
    }
    if (!target && Math.random() < 0.15 && this.w.chars[p.id].needs.hygiene > 30) target = pick(['toilet']);
    if (!target && p.id === 'dudu' && Math.random() < 0.08 && this.nearPartnerAI()) { this.runPair(p.id, 'steal', true); return; }
    if (target) { this.goInteract(p, target); return; }
    // altfel: plimbare sau un emote
    const r = Math.random();
    if (r < 0.35) {
      const list = ANIM_LIST.filter(a => (a.kind === 'emote' || a.kind === 'dance' || (a.kind === 'special' && a.who === p.id)) && !['fartjump'].includes(a.id));
      p.actor.play(list[Math.floor(Math.random() * list.length)].id);
    } else {
      for (let i = 0; i < 10; i++) {
        const tx = 2.5 + Math.random() * 11, ty = 2.5 + Math.random() * 12;
        if (!this.nav.hits(tx, ty)) { const path = this.nav.path(p.gx, p.gy, tx, ty); if (path) { p.path = path; break; } }
      }
    }
  }
  aiFlee(p: Pawn, dt: number) {
    // a furat gustarea: fuge de tine pana il/o prinzi
    {
      p.fleeT = (p.fleeT ?? 0) - dt;
      if (p.fleeT < 10.3 && Math.hypot(this.me.gx - p.gx, this.me.gy - p.gy) < 0.75) {
        p.fleeT = 0; p.path = []; p.actor.play('puppy'); this.hud.toast(`Prins(ă)! ${p.actor.spec.name} îți dă prăjitura înapoi 🥺🍰`);
        this.op({ k: 'need', who: this.me.id, need: 'fun', delta: 15 }); this.op({ k: 'need', who: this.me.id, need: 'hunger', delta: 10 }); this.op({ k: 'hearts', delta: 3 });
        return;
      }
      if (!p.path.length) {
        let best: { x: number; y: number } | null = null, bd = -1;
        for (let i = 0; i < 14; i++) { const tx = 2.5 + Math.random() * 11, ty = 2.5 + Math.random() * 12; if (this.nav.hits(tx, ty)) continue; const d = Math.hypot(tx - this.me.gx, ty - this.me.gy); if (d > bd) { bd = d; best = { x: tx, y: ty }; } }
        if (best) { const path = this.nav.path(p.gx, p.gy, best.x, best.y); if (path) p.path = path; }
      }
      p.actor.moving = this.followPath(p, dt * 0.85);
      if (Math.random() < dt * 0.6) { const pp = iso(p.gx, p.gy, 80); this.fx.text(pp.x, pp.y, 'Hihi! 🍰', '#c77dff', 0.6); }
      return;
    }
  }
  nearPartnerAI() { return Math.hypot(this.me.gx - this.partner.gx, this.me.gy - this.partner.gy) < 1.3; }

  updateActivity(p: Pawn, dt: number) {
    if (!p.activity) return;
    p.activity.t += dt;
    if (p.control === 'remote') return;
    if (p.activity.t >= p.activity.a.dur) this.stopActivity(p, true);
  }

  // ------------------------------------------------------------------ desen
  draw(ctx: CanvasRenderingContext2D) {
    const { w, h } = this.game;
    const night = nightAmount(this.w.minutes);
    ctx.fillStyle = night > 0.5 ? '#1f2540' : '#bfe8c9';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (this.shake > 0.3) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    ctx.scale(this.cam.zoom, this.cam.zoom);
    ctx.translate(-this.cam.x, -this.cam.y);

    // podea pre-randata
    const F = this.floor;
    ctx.drawImage(F.canvas, F.ox, F.oy, F.canvas.width / 2, F.canvas.height / 2);

    const st: FurnState = { ...(this.w.furn as FurnState), night };
    // decoruri pe sol
    for (const f of FURNITURE) if (!f.solid && (f.type === 'rug' || f.type === 'plot' || f.type === 'doormat' || f.type === 'flowers')) drawFurn(ctx, f, this.time, st);
    // indicator obiect apropiat
    const near = this.nearestFurn(this.me);
    if (near && !this.me.activity) {
      ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.time * 5);
      ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      const a = iso(near.gx, near.gy), b = iso(near.gx + near.w, near.gy), c = iso(near.gx + near.w, near.gy + near.d), d = iso(near.gx, near.gy + near.d);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.stroke();
      ctx.restore();
    }
    // tinta pentru mers
    if (this.me.path.length) {
      const t = this.me.path[this.me.path.length - 1]; const p = iso(t.x, t.y);
      ctx.strokeStyle = '#ff7aa2'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(p.x, p.y, 12 + Math.sin(this.time * 8) * 2, 6, 0, 0, 7); ctx.stroke();
    }

    // pereti din spate
    for (const wl of WALLS) if (wl.kind === 'back') drawWall(ctx, wl, this.time, night);

    // sortare in adancime
    type D = { x0: number; y0: number; x1: number; y1: number; draw: () => void; z?: number };
    const items: D[] = [];
    for (const f of FURNITURE) if (f.solid || !(f.type === 'rug' || f.type === 'plot' || f.type === 'doormat' || f.type === 'flowers')) {
      items.push({ x0: f.gx, y0: f.gy, x1: f.gx + f.w, y1: f.gy + f.d, draw: () => drawFurn(ctx, f, this.time, st) });
    }
    for (const wl of WALLS) if (wl.kind !== 'back') {
      const r = wl.dir === 'x' ? { x0: wl.x, y0: wl.y - 0.05, x1: wl.x + 1, y1: wl.y } : { x0: wl.x - 0.05, y0: wl.y, x1: wl.x, y1: wl.y + 1 };
      items.push({ ...r, draw: () => drawWall(ctx, wl as Wall, this.time, night) });
    }
    for (const p of [this.me, this.partner]) {
      const inside = p.activity?.a.place;
      if (inside === 'bed' || inside === 'tub' || inside === 'toilet' || inside === 'sofa') {
        // desenat imediat dupa obiectul pe care sta
        const f = p.activity!.furn;
        const eps = inside === 'sofa' ? 0.01 : 0.001;
        items.push({ x0: f.gx + f.w - eps, y0: f.gy + f.d - eps, x1: f.gx + f.w, y1: f.gy + f.d, draw: () => this.drawPawn(ctx, p) });
      } else items.push({ x0: p.gx - 0.2, y0: p.gy - 0.2, x1: p.gx + 0.2, y1: p.gy + 0.2, draw: () => this.drawPawn(ctx, p) });
    }
    items.sort((a, b) => {
      if (a.x1 <= b.x0 + 1e-6 && !(b.x1 <= a.x0 + 1e-6)) { if (a.y0 < b.y1) return -1; }
      if (b.x1 <= a.x0 + 1e-6 && !(a.x1 <= b.x0 + 1e-6)) { if (b.y0 < a.y1) return 1; }
      if (a.y1 <= b.y0 + 1e-6) return -1;
      if (b.y1 <= a.y0 + 1e-6) return 1;
      return (a.x0 + a.x1 + a.y0 + a.y1) - (b.x0 + b.x1 + b.y0 + b.y1);
    });
    for (const it of items) it.draw();

    this.fx.draw(ctx);

    // noaptea
    ctx.restore();
    if (night > 0) {
      ctx.fillStyle = `rgba(25,25,70,${0.42 * night})`; ctx.fillRect(0, 0, w, h);
      if (this.w.furn.lampOn) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.translate(w / 2, h / 2); ctx.scale(this.cam.zoom, this.cam.zoom); ctx.translate(-this.cam.x, -this.cam.y);
        const p = iso(5.5, 2.5, 40);
        const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 160); g.addColorStop(0, `rgba(255,200,120,${0.35 * night})`); g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 160, 0, 7); ctx.fill();
        ctx.restore();
      }
    }
    // joystick
    if (this.joy.active) {
      ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.joy.sx, this.joy.sy, 50, 0, 7); ctx.stroke();
      const jx = this.joy.x - this.joy.sx, jy = this.joy.y - this.joy.sy, l = Math.hypot(jx, jy), k = l > 50 ? 50 / l : 1;
      ctx.fillStyle = '#ff7aa2cc'; ctx.beginPath(); ctx.arc(this.joy.sx + jx * k, this.joy.sy + jy * k, 22, 0, 7); ctx.fill();
    }
    if (this.minigame) this.minigame.obj.draw(ctx, w, h);
  }

  drawPawn(ctx: CanvasRenderingContext2D, p: Pawn) {
    p.actor.draw(ctx);
    if (p.activity?.a.place === 'sofa') { // spatarul canapelei acopera spatele personajului
      const f = p.activity.furn;
      isoBox(ctx, f.gx + 0.72, f.gy + 0.22, 0.22, f.d - 0.44, 30, boxOf('#83b9f0'));
    }
    // eticheta cu numele + starea
    const s = iso(p.gx, p.gy, p.z);
    const c = this.w.chars[p.id];
    ctx.font = '800 11px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
    const label = `${p.actor.spec.name}${c.sick ? ' ' + SICK_INFO[c.sick].icon : ''}${p.control === 'ai' ? ' 🤖' : ''}`;
    if (p.activity?.a.place !== 'bed' && p.activity?.a.place !== 'tub') {
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.strokeText(label, s.x, s.y + 14);
      ctx.fillStyle = p === this.me ? '#ff4d6d' : '#3a2a22'; ctx.fillText(label, s.x, s.y + 14);
    }
    // balonasul cu cererea bolnavului
    if (c.sick && c.request && REQUESTS[c.request]) {
      const by = s.y - (p.activity?.a.place === 'bed' ? 50 : 98) * ACTOR_SCALE - 26 + Math.sin(this.time * 3) * 3;
      const bx = s.x + 22;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(bx - 16, by - 16, 32, 28, 10); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - 8, by + 12); ctx.lineTo(bx - 14, by + 20); ctx.lineTo(bx - 2, by + 12); ctx.fill();
      ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(REQUESTS[c.request].icon, bx, by - 2); ctx.textBaseline = 'alphabetic';
    }
    // bara de progres a activitatii
    if (p.activity && p.activity.t >= 0) {
      const k = Math.min(1, p.activity.t / p.activity.a.dur);
      const y = s.y - 78 * ACTOR_SCALE - (p.activity.a.place === 'bed' || p.activity.a.place === 'tub' ? -10 : 18);
      ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.roundRect(s.x - 22, y, 44, 7, 4); ctx.fill();
      ctx.fillStyle = '#ff7aa2'; ctx.beginPath(); ctx.roundRect(s.x - 22, y, 44 * k, 7, 4); ctx.fill();
      ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(s.x - 22, y, 44, 7, 4); ctx.stroke();
    }
  }
}

export { NEEDS, NEED_INFO, TW, TH };
