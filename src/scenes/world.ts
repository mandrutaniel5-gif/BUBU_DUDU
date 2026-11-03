// Scena principala: casa izometrica, cei doi ursuleti, nevoi, activitati, multiplayer.
import { Actor } from '../char/actor';
import { ANIMS, ANIM_LIST } from '../char/anims';
import { Fx } from '../char/fx';
import { NPC_SPECS, drawCharacter, type CharId, type CharSpec } from '../char/draw';
import { Sfx } from '../engine/sfx';
import { g } from '../game/gender';
import type { Scene, Game } from '../engine/game';
import { iso, unIso, screenDirToGrid, isoBox, boxOf, TW, TH } from '../world/iso';
import { FURNITURE, WALLS, MAP_W, MAP_H, YARD_H, YARD_GATE, type Furn, type Wall } from '../world/map';
import { drawFurn, drawWall, renderFloor, drawYardFence, drawYardGate, type FurnState } from '../world/furniture';
import { Nav } from '../world/nav';
import { CATALOG, drawGhost, drawTallGrass, type BuildItem } from '../world/build';
import { GOALS, CHAPTERS, chapterOf } from '../game/economy';
import { orderableChains, itemValue } from '../minigames/merge';
import { drawItem, MAX_LVL } from '../world/items';
import { CROPS, WET_MIN, plotStage, catCount, catPick, seedKey, drawPlotSoil, drawCropPlant, type Plot } from '../world/garden';
import { ROAD_Y } from '../world/map';
import { HOUSE, floorAt, AREAS, setArea } from '../world/map';
import { drawTravelScene, irisWipe } from '../world/vehicles';
import { drawCritter, CRITTER_NAMES, type Critter, type CritterKind } from '../world/forest';
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
  lastFurn?: string;
  pendingCrop?: string;
  miniObj?: any; miniScore?: number;
}

export interface Npc { id: string; kind: string; x: number; y: number; tx: number; state: 'come' | 'wait' | 'leave'; wants: string[]; pay: number; t: number; happy?: boolean; spec?: CharSpec; actor?: Actor }

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
  econT = 1;
  area = 'home';
  travel: { t: 0 | number; to: string; switched?: boolean } | null = null;
  critters: Critter[] = [];
  timeMult = 1;
  npcs: Npc[] = []; npcSpawnT = 6;
  build: { item: BuildItem | null; gx: number; gy: number; remove: boolean } | null = null;
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
    let saved = await this.net.loadWorld();
    // joc nou: ignoram salvarile mai vechi decat resetarea (si pe cele de pe server)
    const resetAt = Settings.get().resetAt ?? 0;
    if (saved && saved.ts < resetAt) saved = null;
    if (saved) { try { const w = JSON.parse(saved.json) as WorldState; if (w.v === 1) this.w = { ...newWorld(), ...w }; } catch { /* corupt */ } }
    for (const p of [this.me, this.partner]) { const c = this.w.chars[p.id]; p.gx = c.gx; p.gy = c.gy; if (this.nav.hits(p.gx, p.gy)) { p.gx = 6.5 + (p.id === 'dudu' ? 0.8 : 0); p.gy = 8.4; } }
    // Capitolul 0: casa veche, totul e de facut
    if (this.w.stats.chapter === undefined) {
      this.w.stats.chapter = 0;
      Object.assign(this.w.furn, { standBroken: true, standOpen: false, clogged: true, fridgeDirty: true, tubDirty: true, dishesDirty: true, tvBroken: true, fire: 0 });
      this.w.res = { wood: 4, stone: 0, flower: 0, seeds: 3, veg: 2, meals: 0, flour: 0, lemon: 0, hay: 0 };
      this.w.money = 10;
      for (const id of ['bubu', 'dudu'] as const) { const c = this.w.chars[id]; c.gx = 6.5 + (id === 'dudu' ? 0.8 : 0); c.gy = 9.5; }
      setTimeout(() => this.hud.showChapter(), 700);
    }
    // completeaza campurile noi in salvarile vechi
    const fresh = newWorld();
    this.w.money ??= fresh.money; this.w.grass ??= {}; this.w.res = { ...fresh.res, ...(this.w.res ?? {}) };
    if (this.w.furn.fire === undefined) this.w.furn.fire = 0;
    if (this.w.furn.standBroken === undefined) { this.w.furn.standBroken = !(this.w.stats.served > 0); this.w.furn.standOpen = false; }
    for (const id of ['bubu', 'dudu'] as const) this.w.chars[id].needs = { ...fresh.chars[id].needs, ...this.w.chars[id].needs };
    if (!this.w.plots) { this.w.plots = {}; for (let x = 9; x <= 11; x++) for (let y = 13; y <= 14; y++) this.w.plots[`${x},${y}`] = { crop: null, prog: 0, wetUntil: 0, fert: 0 }; }
    if ((this.w.res as any).seeds) { this.w.res![seedKey('carrot')] = (this.w.res![seedKey('carrot')] ?? 0) + (this.w.res as any).seeds; delete (this.w.res as any).seeds; }
    this.w.res![seedKey('carrot')] ??= 4; this.w.res![seedKey('tulip')] ??= 2; this.w.res!.water ??= 0;
    this.syncPlaced();
    setTimeout(() => this.hud.refreshGoal(), 50);
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
    this.hud.toast(on ? `${this.partner.actor.spec.name} a intrat în joc! 💞` : `${this.partner.actor.spec.name} a ieșit. ${g(this.partner.id, 'Îl', 'O')} joacă AI-ul 🤖`);
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
    if (o.k === 'npcs') { this.mergeNpcs(o.list as Npc[]); return; }
    if (o.k === 'npcServe') { const n = this.npcs.find(x => x.id === o.id); if (n) { n.state = 'leave'; n.happy = true; n.actor?.play('love'); } return; }
    if (o.k === 'char') { if (o.who !== this.myId) Object.assign(this.w.chars[o.who], o.state as object); return; }
    applyOp(this.w, o);
    if (o.k === 'place' || o.k === 'unplace') this.syncPlaced();
    if (o.k === 'jar' && o.from !== this.myId) this.hud.toast('💌 Ai primit un bilețel în Borcanul cu iubire!');
  }
  sendCharSync() {
    const c = this.w.chars[this.myId]; c.gx = this.me.gx; c.gy = this.me.gy;
    this.net.sendEvent({ t: 'op', op: { k: 'char', who: this.myId, state: c } });
  }
  /** reconstruieste obiectele construite + navigarea */
  syncPlaced() {
    if (this.area !== 'home') return;
    for (let i = FURNITURE.length - 1; i >= 0; i--) if (FURNITURE[i].id === 'h-tractor' || FURNITURE[i].id === 'h-wood') FURNITURE.splice(i, 1);
    if (this.chapter >= 2) {
      FURNITURE.push({ id: 'h-tractor', type: 'tractor' as any, gx: 18, gy: 15, w: 2, d: 1, solid: true, action: { id: 'forest', label: 'Spre pădure cu tractorașul', icon: '🚜' } });
      FURNITURE.push({ id: 'h-wood', type: 'logpile' as any, gx: 17, gy: 15, w: 1, d: 1, solid: true, action: { id: 'sellwood', label: 'Vinde lemne la cherestea', icon: '💰' } });
    }
    for (let i = FURNITURE.length - 1; i >= 0; i--) if (FURNITURE[i].id.startsWith('p-') || FURNITURE[i].id.startsWith('plot:')) FURNITURE.splice(i, 1);
    for (const key of Object.keys(this.w.plots ?? {})) { const [x, y] = key.split(',').map(Number); FURNITURE.push({ id: 'plot:' + key, type: 'soilplot', gx: x, gy: y, w: 1, d: 1, solid: false, action: { id: 'plot', label: 'Răzor', icon: '🌱' } }); }
    for (const p of this.w.placed ?? []) {
      const it = CATALOG.find(c => c.type === p.type); if (!it) continue;
      FURNITURE.push({ id: 'p-' + p.uid, type: it.type as any, gx: p.gx, gy: p.gy, w: it.w, d: it.d, solid: it.solid, action: it.action });
    }
    this.nav = new Nav(this.area === 'home' ? this.doorBlocks() : []);
  }
  depleted(id: string) { return (this.w.nodes?.[id] ?? 0) > Date.now(); }
  isDecor(f: Furn) { return !f.solid && ['soilplot', 'rug', 'plot', 'doormat', 'flowers', 'stonepath', 'heartstone', 'flowerbed', 'wildflower'].includes(f.type); }

  // ------------------------------------------------------------------ constructie
  startBuild(item: BuildItem | null, remove = false) {
    const g = { x: Math.round(this.me.gx + 1), y: Math.round(this.me.gy + 1) };
    this.build = { item, gx: g.x, gy: g.y, remove };
    this.hud.setBuild(this.build);
  }
  endBuild() { this.build = null; this.hud.setBuild(null); }
  canAfford(it: BuildItem) { return Object.entries(it.cost).every(([r, n]) => (this.w.res?.[r] ?? 0) >= (n ?? 0)); }
  canPlace(it: BuildItem, gx: number, gy: number) {
    for (let x = gx; x < gx + it.w; x++) for (let y = gy; y < gy + it.d; y++) {
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
      if (this.nav.isBlocked(x, y)) return false;
      if (FURNITURE.some(f => x >= f.gx && x < f.gx + f.w && y >= f.gy && y < f.gy + f.d)) return false;
      for (const p of [this.me, this.partner]) if (Math.floor(p.gx) === x && Math.floor(p.gy) === y) return false;
    }
    return true;
  }
  buildTap(gx: number, gy: number) {
    const b = this.build!; const tx = Math.floor(gx), ty = Math.floor(gy);
    if (b.remove) {
      const f = FURNITURE.find(f => f.id.startsWith('p-') && tx >= f.gx && tx < f.gx + f.w && ty >= f.gy && ty < f.gy + f.d);
      if (!f) { this.hud.toast('Atinge un obiect construit de voi'); return; }
      const it = CATALOG.find(c => c.type === f.type);
      if (it) for (const [r, n] of Object.entries(it.cost)) this.op({ k: 'res', res: r, delta: Math.floor((n ?? 0) / 2) });
      this.op({ k: 'unplace', uid: f.id.slice(2) }); Sfx.play('pop');
      return;
    }
    if (!b.item) return;
    if (tx !== b.gx || ty !== b.gy) { b.gx = tx; b.gy = ty; Sfx.play('click'); return; }
    this.confirmBuild();
  }
  confirmBuild() {
    const b = this.build; if (!b?.item) return;
    const it = b.item;
    if (!this.canAfford(it)) { this.hud.toast('Nu ai destule materiale 🪵🪨🌸 — taie copaci, sparge pietre, culege flori!'); Sfx.play('bad'); return; }
    if (!this.canPlace(it, b.gx, b.gy)) { this.hud.toast('Nu încape aici ✖'); Sfx.play('bad'); return; }
    for (const [r, n] of Object.entries(it.cost)) this.op({ k: 'res', res: r, delta: -(n ?? 0) });
    if (it.type === 'soilplot') { this.op({ k: 'plot', key: `${b.gx},${b.gy}`, plot: { crop: null, prog: 0, wetUntil: 0, fert: 0 } }); this.syncPlaced(); Sfx.play('good'); return; }
    const uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    this.op({ k: 'place', uid, type: it.type, gx: b.gx, gy: b.gy });
    const p = iso(b.gx + it.w / 2, b.gy + it.d / 2, 40);
    this.fx.burst('star', p.x, p.y, 10, 6.28, 120, { max: 0.8 }); this.fx.text(p.x, p.y - 20, `${it.icon} Construit!`, '#ff9f1c', 0.9);
    Sfx.play('good'); this.op({ k: 'hearts', delta: it.coop ? 5 : 1 });
    this.op({ k: 'need', who: this.myId, need: 'fun', delta: 5 });
    this.me.actor.play(this.myId === 'dudu' ? 'flex' : 'love'); this.net.sendEvent({ t: 'emote', who: this.myId, anim: this.myId === 'dudu' ? 'flex' : 'love' });
    if (it.coop) this.log(`${this.me.actor.spec.name} a construit ${it.label} ${it.icon} pentru voi!`);
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
      if (this.minigame && e.repeat) return; // tinutul apasat nu mai conteaza ca apasari multiple
      if (this.minigame) { if (e.key === 'Escape') { this.minigame.obj.abort?.(); return; } this.minigame.obj.key?.(e.key.toLowerCase(), true); return; }
      const k = e.key.toLowerCase();
      if (k === 'e' || k === ' ') { e.preventDefault(); this.doAction(); }
      if (k === 'f') this.fartJump();
      if (k === 'q') this.hud.toggleEmotes();
      if (k === 'r') this.hud.togglePairs();
      if (k === 'b') this.build ? this.endBuild() : this.hud.openBuild();
      if (k === 'enter' && this.build) this.confirmBuild();
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
      else if (this.build?.item && e.pointerType === 'mouse') { const g = this.screenToGrid(e.clientX, e.clientY); this.build.gx = Math.floor(g.x); this.build.gy = Math.floor(g.y); }
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
    if (this.build) { this.buildTap(g.x, g.y); return; }
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
  nearPartner() { return this.sameArea() && Math.hypot(this.me.gx - this.partner.gx, this.me.gy - this.partner.gy) < 1.7; }

  doAction() {
    if (this.me.activity) { this.stopActivity(this.me); return; }
    const cr = this.nearCritter(); if (cr) { this.petCritter(cr); return; }
    const f = this.nearestFurn(this.me);
    if (f) this.interact(this.me, f);
    else if (this.nearPartner()) this.hud.togglePairs(true);
  }

  /** ce actiune se face cu un obiect (depinde de stare) */
  actionFor(f: Furn): { id: string; label: string; icon: string } | null {
    if (!f.action) return null;
    if (f.id === 'toilet' && this.w.furn.clogged) return { id: 'unclog', label: 'Desfundă toaleta!', icon: '🪠' };
    if (f.id === 'bed' && this.partner.activity?.a.id === 'sleep' && !this.me.activity) return { id: 'pinch', label: 'Astupă-i nasul 🤏', icon: '😴' };
    if (f.id === 'stand') {
      if (this.w.furn.standBroken) return { id: 'repairstand', label: 'Repară taraba (6 🪵)', icon: '🔨' };
      if (!this.w.furn.standOpen) return { id: 'openstand', label: 'Deschide taraba', icon: '🧺' };
    }
    if (f.type === 'soilplot') {
      const p = this.w.plots?.[f.id.slice(5)]; if (!p) return null;
      const st = plotStage(p);
      if (st < 0) return { id: 'plant', label: 'Plantează', icon: '🌱' };
      if (st === 3) return { id: 'harvest', label: `Culege ${CROPS[p.crop!].name.toLowerCase()}`, icon: '🧺' };
      if (p.wetUntil <= (this.w.gameMin ?? 0)) return { id: 'waterplot', label: 'Udă planta', icon: '💧' };
      if (!p.fert && (this.w.res?.fert ?? 0) > 0) return { id: 'fertilize', label: 'Pune îngrășământ', icon: '✨' };
      return { id: 'growing', label: `Crește… ${Math.round(p.prog * 100)}%`, icon: '⏳' };
    }
    if (f.id === 'fridge' && this.w.furn.fridgeDirty) return { id: 'cleanfridge', label: 'Curăță frigiderul', icon: '🧽' };
    if (f.id === 'tub' && this.w.furn.tubDirty) return { id: 'scrubtub', label: 'Spală cada', icon: '🧽' };
    if (f.id === 'tv' && this.w.furn.tvBroken) return { id: 'fixtv', label: 'Repară televizorul', icon: '🔧' };
    if (f.id === 'fireplace') return ((this.w.furn.fire as number) ?? 0) > 0 ? { id: 'addwood', label: 'Pune lemne pe foc', icon: '🪵' } : { id: 'lightfire', label: 'Aprinde focul!', icon: '🔥' };
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
    if (act.id === 'village') { if (pawn === this.me) { if ((this.w.stats.bike ?? 0) > 0) this.hud.openVillage(); else { this.hud.toast('🚲 Satul e departe! Aveți nevoie de o bicicletă (Capitolul 2)'); Sfx.play('bad'); } } return; }
    if (act.id === 'growing') return;
    if (act.id === 'plant' && !pawn.pendingCrop) {
      const seeds = Object.keys(CROPS).filter(c => (this.w.res?.[seedKey(c)] ?? 0) > 0);
      if (!seeds.length) { if (pawn === this.me) { this.hud.toast('N-ai semințe 🌰 — cumpără de la laptop (online) sau din sat'); Sfx.play('bad'); } return; }
      if (pawn === this.me) { this.hud.openSeeds(seeds, crop => { pawn.pendingCrop = crop; this.interact(pawn, f); }); return; }
      pawn.pendingCrop = seeds[Math.floor(Math.random() * seeds.length)];
    }
    if (act.id === 'online') { if (pawn === this.me) this.hud.openVillage('online'); return; }
    const a = ACTIVITIES[act.id]; if (!a) return;
    if (act.id === 'sleep') { const why = this.canSleep(pawn.id); if (why) { if (pawn === this.me) { this.hud.toast(why); Sfx.play('bad'); } return; } (this.w.chars[pawn.id] as any).sleptNight = this.nightKey(); }
    const need = this.missing(act.id);
    if (need) { if (pawn === this.me) { this.hud.toast(need); Sfx.play('bad'); pawn.actor.play('puppy'); } return; }
    if (act.id === 'forest') { if (pawn === this.me) this.goArea('forest'); return; }
    if (act.id === 'gohome') { if (pawn === this.me) this.goArea('home'); return; }
    if (['chop', 'mine', 'pick', 'mushroom', 'berries'].includes(act.id) && this.depleted(f.id)) { if (pawn === this.me) this.hud.toast('Crește la loc curând… 🌱'); return; }
    if (act.id === 'pinch' && pawn === this.me) { this.startMinigame('snore', a, f); return; }
    // minijoc pentru jucator (daca exista)
    if (pawn === this.me && a.minigame && MINIGAMES[a.minigame]) { this.startMinigame(a.minigame, a, f); return; }
    this.startActivity(pawn, a, f);
  }

  /** ce lipseste ca sa poti face activitatea (null = poti) */
  /** noaptea curenta (ziua in care a inceput) */
  nightKey() { const h = this.w.minutes / 60; return h < 12 ? this.w.day - 1 : this.w.day; }
  /** null = te poti culca; altfel motivul */
  canSleep(id: CharId): string | null {
    const h = this.w.minutes / 60;
    if (h >= 6 && h < 20) return `🌞 E zi (${clockText(this.w.minutes)})! Te poți culca doar seara, după ora 20:00`;
    if ((this.w.chars[id] as any).sleptNight === this.nightKey()) return '😊 Ai dormit deja în noaptea asta';
    return null;
  }
  get isHost() { return this.myId === 'bubu' || !this.partnerOnline; }
  missing(id: string): string | null {
    const r = this.w.res ?? {};
    const fuel = (this.w.furn.fire as number) ?? 0;
    switch (id) {
      case 'addwood': return (r.wood ?? 0) < 1 ? 'N-ai lemne! 🪵 Taie un copac din curte (sau cumpără din sat)' : fuel > 90 ? 'Soba e plină 🔥' : null;
      case 'lightfire': return (r.wood ?? 0) < 1 ? 'Ai nevoie de un lemn ca să aprinzi focul 🪵' : null;
      case 'snack': return (r.meals ?? 0) + catCount(r, 'veg') < 1 ? 'Frigiderul e gol! 🧊 Gătește, culege din grădină sau cumpără din sat' : null;
      case 'eat': return (r.meals ?? 0) < 1 ? 'Nu e nimic gătit 🍽️ Gătește la aragaz (cu legume) sau cumpără mâncare' : null;
      case 'cook': return catCount(r, 'veg') + (r.fish ?? 0) < 1 ? 'Nu ai legume 🥕 Culege din grădină sau cumpără din sat' : null;
      case 'repairstand': return (r.wood ?? 0) < 6 ? 'Ai nevoie de 6 lemne 🪵 ca să repari taraba (taie copacii din curte)' : null;
      case 'openstand': { const h = this.w.minutes / 60; return h >= 20 || h < 7 ? '🌙 E noapte — taraba se deschide dimineața (7:00 - 20:00)' : null; }
      case 'sellwood': return (r.wood ?? 0) <= 5 ? 'Păstrează măcar 5 lemne pentru sobă 🔥 — mai taie la pădure!' : null;
      case 'drawwater': return (r.water ?? 0) >= 9 ? 'Ai deja 9 găleți de apă 🪣' : null;
      case 'waterplot': return (r.water ?? 0) < 1 ? 'N-ai apă! 🪣 Scoate apă din fântână' : null;
      case 'fertilize': return (r.fert ?? 0) < 1 ? 'N-ai îngrășământ ✨ (se cumpără din sat)' : null;
      case 'mow': return Object.keys(this.w.grass ?? {}).length < 3 ? 'Iarba e încă scurtă 🌱' : null;
    }
    return null;
  }

  economyOnComplete(pawn: Pawn, a: Activity) {
    const r = this.w.res ?? {};
    const mini = pawn.miniObj;
    const P = iso(pawn.gx, pawn.gy, 96);
    const say = (t: string) => this.fx.text(P.x, P.y, t, '#2ec4b6', 0.8);
    switch (a.id) {
      case 'addwood': this.op({ k: 'res', res: 'wood', delta: -1 }); this.op({ k: 'furn', key: 'fire', value: Math.min(100, ((this.w.furn.fire as number) ?? 0) + 25) }); say('-1 🪵  +🔥'); break;
      case 'lightfire': this.op({ k: 'res', res: 'wood', delta: -1 }); this.op({ k: 'furn', key: 'fire', value: 30 }); this.op({ k: 'stat', key: 'fireLit', delta: 1 }); say('Focul arde! 🔥'); this.log(`${pawn.actor.spec.name} a aprins focul în sobă 🔥`); break;
      case 'snack': if ((r.meals ?? 0) > 0) this.op({ k: 'res', res: 'meals', delta: -1 }); else { const k = catPick(r, 'veg'); if (k) this.op({ k: 'res', res: k, delta: -1 }); } break;
      case 'eat': this.op({ k: 'res', res: 'meals', delta: -1 }); break;
      case 'cook': { const k = (r.fish ?? 0) > 0 && Math.random() < 0.5 ? 'fish' : catPick(r, 'veg') ?? 'fish'; this.op({ k: 'res', res: k, delta: -1 }); } this.op({ k: 'res', res: 'meals', delta: 3 }); this.op({ k: 'stat', key: 'cooked', delta: 1 }); say('+3 🍲'); break;
      case 'repairstand': this.op({ k: 'res', res: 'wood', delta: -6 }); this.op({ k: 'furn', key: 'standBroken', value: false }); this.op({ k: 'stat', key: 'standRepaired', delta: 1 }); this.hud.toast('🔨 Taraba e ca nouă! Acum deschide-o ca să vină clienții'); this.log(`${pawn.actor.spec.name} a reparat taraba 🔨🧺`); break;
      case 'openstand': this.op({ k: 'furn', key: 'standOpen', value: true }); this.op({ k: 'stat', key: 'standOpened', delta: 1 }); this.hud.toast('🧺 Taraba e deschisă! Vin clienți pe drum'); this.npcSpawnT = Math.min(this.npcSpawnT, 4); break;
      case 'drawwater': this.op({ k: 'res', res: 'water', delta: Math.min(3, 9 - (r.water ?? 0)) }); this.op({ k: 'stat', key: 'waterDrawn', delta: 1 }); say('+3 💧'); break;
      case 'waterplot': case 'fertilize': case 'harvest': case 'plant': this.plotDone(pawn, a.id); break;
      case 'chop': this.op({ k: 'stat', key: 'woodTotal', delta: pawn.id === 'dudu' ? 4 : 3 }); break;
      case 'pick': this.op({ k: 'stat', key: 'flowerTotal', delta: 2 }); break;
      case 'cleanfridge': this.op({ k: 'furn', key: 'fridgeDirty', value: false }); break;
      case 'scrubtub': this.op({ k: 'furn', key: 'tubDirty', value: false }); break;
      case 'fixtv': this.op({ k: 'furn', key: 'tvBroken', value: false }); break;
      case 'dishes': this.op({ k: 'furn', key: 'dishesDirty', value: false }); break;
      case 'unclog': this.op({ k: 'stat', key: 'unclogged', delta: 1 }); break;
      case 'mow': { const hay = mini?.hay ?? 3; this.op({ k: 'grassAll' }); this.op({ k: 'res', res: 'hay', delta: hay }); this.op({ k: 'stat', key: 'mowed', delta: 1 }); say(`Curte tunsă! +${hay} 🌾`); this.log(`${pawn.actor.spec.name} a tuns iarba din curte ✂️`); break; }
    }
  }

  get chapter() { return this.w.stats.chapter ?? 0; }
  /** usile incuiate in Capitolul 0 */
  doorBlocks() {
    if (this.chapter > 0) return [];
    return [{ x0: 5, y0: 11.9, x1: 6, y1: 12.1 }, { x0: 13.9, y0: 9, x1: 14.1, y1: 10 }];
  }
  checkGoals() {
    const ch = chapterOf(this.w);
    for (const g of ch.goals) if (!g.cost && !this.w.stats['goal-' + g.id] && g.done(this.w)) this.completeGoal(g.id);
    if (ch.goals.every(g => this.w.stats['goal-' + g.id]) && this.chapter < CHAPTERS.length - 1) this.advanceChapter();
  }
  /** PROVIZORIU (pentru test): sari la capitolul urmator */
  devSkipChapter() {
    if (this.chapter >= CHAPTERS.length - 1) { this.hud.toast('Ești deja la ultimul capitol făcut'); return; }
    const ch = chapterOf(this.w);
    for (const g of ch.goals) this.w.stats['goal-' + g.id] = 1;
    if (this.chapter === 0) Object.assign(this.w.furn, { clogged: false, fridgeDirty: false, tubDirty: false, dishesDirty: false, tvBroken: false, fire: Math.max(40, (this.w.furn.fire as number) ?? 0) });
    this.op({ k: 'res', res: 'wood', delta: 15 }); this.op({ k: 'money', delta: 60 });
    this.advanceChapter();
  }
  advanceChapter() {
    const old = chapterOf(this.w);
    this.op({ k: 'stat', key: 'chapter', delta: 1 });
    this.syncPlaced();
    this.log(old.done);
    Sfx.play('good');
    for (const p of [this.me, this.partner]) p.actor.play('dance_hop');
    const c = iso(this.me.gx, this.me.gy, 90); for (let i = 0; i < 4; i++) setTimeout(() => this.fx.hearts(c.x + (Math.random() - 0.5) * 120, c.y, 8), i * 300);
    setTimeout(() => this.hud.showChapter(old.done), 900);
  }
  completeGoal(id: string) {
    const g = GOALS.find(x => x.id === id); if (!g || this.w.stats['goal-' + id]) return;
    this.op({ k: 'stat', key: 'goal-' + id, delta: 1 });
    if (g.reward.money) this.op({ k: 'money', delta: g.reward.money });
    if (g.reward.hearts) this.op({ k: 'hearts', delta: g.reward.hearts });
    this.hud.toast(`✅ Obiectiv: ${g.icon} ${g.text}${g.reward.money ? ' · +' + g.reward.money + ' lei' : ''}${g.reward.hearts ? ' · +' + g.reward.hearts + ' 💗' : ''}`);
    this.log(`Obiectiv îndeplinit: ${g.icon} ${g.text}`);
    Sfx.play('good'); this.me.actor.play('dance_hop');
    this.hud.refreshGoal();
  }

  // ------------------------------------------------------------------ clientii (NPC) de la taraba
  mergeNpcs(list: Npc[]) {
    if (this.isHost) return;
    const old = new Map(this.npcs.map(n => [n.id, n]));
    this.npcs = list.map(n => { const o = old.get(n.id); return o ? Object.assign(o, { ...n, x: o.x, y: o.y, actor: o.actor, spec: o.spec, tx: n.x }) : { ...n, tx: n.x }; });
  }
  npcPublic() { return this.npcs.map(({ actor, spec, ...n }) => n); }
  spawnNpc() {
    const served = this.w.stats.served ?? 0;
    const chains = orderableChains(this.w.res ?? {}, this.w.stats);
    const kinds = Object.keys(NPC_SPECS);
    const n = served > 8 && Math.random() < 0.3 ? 2 : 1;
    const wants: string[] = [];
    for (let i = 0; i < n; i++) {
      const ch = Math.random() < 0.5 ? chains[chains.length - 1] : chains[Math.floor(Math.random() * chains.length)];
      const maxL = Math.min(MAX_LVL[ch], Math.floor(served / 4) + 1);
      const l = Math.floor(Math.random() ** 1.6 * (maxL + 1));
      wants.push(`${ch}:${Math.min(maxL, l)}`);
    }
    this.npcs.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind: kinds[Math.floor(Math.random() * kinds.length)], x: -1, y: ROAD_Y, tx: 0, state: 'come', wants, pay: wants.reduce((s, c) => s + itemValue(c), 1), t: 0 });
  }
  updateNpcs(dt: number) {
    const host = this.isHost;
    const h = this.w.minutes / 60;
    if (host) {
      this.npcSpawnT -= dt;
      const waiting = this.npcs.filter(n => n.state !== 'leave').length;
      const open = !!this.w.furn.standOpen && !this.w.furn.standBroken;
      if (open && h >= 20) { this.op({ k: 'furn', key: 'standOpen', value: false }); this.hud.toast('🌙 Taraba s-a închis pentru noapte'); for (const n of this.npcs) if (n.state !== 'leave') { n.state = 'leave'; n.happy = false; } }
      if (open && this.npcSpawnT <= 0 && h >= 7 && h < 20 && waiting < 3) { this.npcSpawnT = 25 + Math.random() * 25; this.spawnNpc(); }
    }
    const slots = [9.6, 8.3, 7.0];
    let si = 0;
    for (const n of this.npcs) {
      if (!n.spec) { n.spec = NPC_SPECS[n.kind]; n.actor = new Actor('bubu', this.fx, n.spec); n.actor.scale = ACTOR_SCALE * 0.92; if (n.kind === 'granny') n.actor.outfit = { head: 'none', face: 'none', neck: 'scarf' }; }
      const a = n.actor!;
      if (host) {
        if (n.state === 'come') { const tx = slots[Math.min(2, si)]; n.x += Math.sign(tx - n.x) * Math.min(Math.abs(tx - n.x), 1.4 * dt); if (Math.abs(tx - n.x) < 0.02) { n.state = 'wait'; a.play('wave'); } }
        else if (n.state === 'wait') { n.t += dt; const tx = slots[Math.min(2, si)]; n.x += Math.sign(tx - n.x) * Math.min(Math.abs(tx - n.x), 1.4 * dt); if (n.t > 120) { n.state = 'leave'; n.happy = false; a.play('angry'); this.hud.toast(`😤 ${n.spec!.name} a plecat supărat(ă) — a așteptat prea mult`.replace('supărat(ă)', ['bunny', 'granny', 'cat', 'fox'].includes(n.kind) ? 'supărată' : 'supărat')); } }
        else n.x += 1.6 * dt;
      } else { n.x += (n.tx - n.x) * Math.min(1, dt * 4); }
      if (n.state !== 'leave') si++;
      const moving = n.state !== 'wait';
      a.moving = moving && !a.busy; a.flip = 1;
      const s = iso(n.x, n.y); a.x = s.x; a.y = s.y; a.update(dt);
      if (n.state === 'wait' && !a.busy) a.mood = n.t > 80 ? 'sulky' : 'happy';
    }
    if (host) this.npcs = this.npcs.filter(n => n.x < MAP_W + 1.5);
  }
  serveNpc(id: string, pay: number) {
    this.op({ k: 'npcServe', id });
    this.op({ k: 'money', delta: pay }); this.op({ k: 'stat', key: 'served', delta: 1 }); this.op({ k: 'hearts', delta: 1 });
    const served = this.w.stats.served ?? 0;
    if (served % 5 === 0) this.hud.toast(`🧺 ${served} clienți mulțumiți! Clienții vor cere produse tot mai mari ✨`);
  }
  drawNpc(ctx: CanvasRenderingContext2D, n: Npc) {
    if (!n.actor) return;
    n.actor.draw(ctx);
    if (n.state === 'wait') {
      const s = iso(n.x, n.y); const k = n.wants.length;
      const bw = 18 + k * 28, by = s.y - 84 + Math.sin(this.time * 3 + n.x) * 2;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(s.x - bw / 2, by - 18, bw, 34, 10); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x - 4, by + 16); ctx.lineTo(s.x, by + 23); ctx.lineTo(s.x + 4, by + 16); ctx.fill();
      n.wants.forEach((c, i) => drawItem(ctx, c, s.x + (i - (k - 1) / 2) * 28, by - 1, 28, this.time));
      const pk = Math.max(0, 1 - n.t / 120);
      ctx.fillStyle = pk > 0.4 ? '#7cc576' : '#e63946'; ctx.fillRect(s.x - bw / 2 + 4, by + 12, (bw - 8) * pk, 3);
    }
  }

  plotDone(pawn: Pawn, id: string) {
    const key = (pawn.lastFurn ?? '').replace('plot:', ''); const p = this.w.plots?.[key]; if (!p) return;
    const now = this.w.gameMin ?? 0; const P = iso(pawn.gx, pawn.gy, 96);
    const say = (t: string) => this.fx.text(P.x, P.y, t, '#2ec4b6', 0.8);
    if (id === 'plant' && pawn.pendingCrop && !p.crop) {
      const c = pawn.pendingCrop; pawn.pendingCrop = undefined;
      this.op({ k: 'res', res: seedKey(c), delta: -1 }); this.op({ k: 'plot', key, plot: { crop: c, prog: 0, wetUntil: 0, fert: 0 } });
      this.op({ k: 'stat', key: 'planted', delta: 1 }); say(`🌱 ${CROPS[c].name}`);
    } else if (id === 'waterplot') {
      this.op({ k: 'res', res: 'water', delta: -1 }); this.op({ k: 'plot', key, plot: { ...p, wetUntil: now + WET_MIN } }); say('💧 Udat');
    } else if (id === 'fertilize') {
      this.op({ k: 'res', res: 'fert', delta: -1 }); this.op({ k: 'plot', key, plot: { ...p, fert: 1 } }); say('✨ Îngrășat');
    } else if (id === 'harvest' && p.crop && p.prog >= 1) {
      const c = CROPS[p.crop]; const n = c.yield + (p.fert ? 1 : 0);
      this.op({ k: 'res', res: c.id, delta: n }); this.op({ k: 'plot', key, plot: { crop: null, prog: 0, wetUntil: 0, fert: 0 } });
      this.op({ k: 'stat', key: 'harvested', delta: 1 }); this.op({ k: 'stat', key: c.cat === 'veg' ? 'vegTotal' : 'flowerTotal', delta: n });
      say(`+${n} ${c.name}`); this.fx.hearts(P.x, P.y, 3);
    }
  }
  /** cresterea plantelor (in minute de joc; merge si cand noaptea trece repede) */
  growPlots() {
    const now = this.w.gameMin ?? 0;
    const last = this.lastGrow ?? now; this.lastGrow = now;
    const dMin = Math.max(0, Math.min(600, now - last)); if (!dMin) return;
    for (const [key, p] of Object.entries(this.w.plots ?? {})) {
      if (!p.crop || p.prog >= 1) continue;
      const wetMin = Math.max(0, Math.min(dMin, p.wetUntil - (now - dMin)));
      const before = plotStage(p);
      p.prog = Math.min(1, p.prog + (wetMin + (dMin - wetMin) * 0.1) * (p.fert ? 1.6 : 1) / CROPS[p.crop].grow);
      if (plotStage(p) !== before && this.isHost) this.op({ k: 'plot', key, plot: { ...p } });
    }
  }
  lastGrow?: number;

  // ------------------------------------------------------------------ zone (acasa / padure)
  partnerArea() { return this.partner.control === 'remote' ? ((this.w.chars[this.partner.id] as any).area ?? 'home') : 'home'; }
  sameArea() { return this.partnerArea() === this.area; }
  goArea(name: string) {
    if (this.travel || name === this.area) return;
    this.stopActivity(this.me); this.me.path = []; this.hud.closeMenus();
    this.travel = { t: 0, to: name };
    this.hud.setMinigame(true);
    Sfx.play('burp');
  }
  switchArea(name: string) {
    setArea(name); this.area = name;
    if (name === 'home') this.syncPlaced(); else this.nav = new Nav([]);
    this.floor = renderFloor();
    const sp = AREAS[name].spawn; this.me.gx = sp.x; this.me.gy = sp.y; this.me.z = 0;
    (this.w.chars[this.myId] as any).area = name; this.sendCharSync();
    if (name === 'forest') { this.spawnCritters(); this.op({ k: 'stat', key: 'forestTrips', delta: 1 }); this.log(`${this.me.actor.spec.name} a plecat cu tractorașul la pădure 🚜🌲`); }
    const c = iso(this.me.gx, this.me.gy, 30); this.cam.x = c.x; this.cam.y = c.y;
  }
  spawnCritters() {
    const kinds: CritterKind[] = ['deer', 'squirrel', 'hedgehog', 'bird', 'squirrel', 'deer', 'hedgehog'];
    this.critters = [];
    kinds.forEach((kind, i) => {
      for (let k = 0; k < 20; k++) { const x = 1 + Math.random() * 19, y = 1 + Math.random() * 20; if (!this.nav.hits(x, y, 0.3)) { this.critters.push({ id: i, kind, x, y, tx: x, ty: y, t: Math.random() * 3, flip: 1, friend: (this.w.stats['friend-' + kind + i] ?? 0) / 3, flee: 0 }); break; } }
    });
  }
  updateCritters(dt: number) {
    if (this.area !== 'forest') return;
    for (const c of this.critters) {
      c.t -= dt; c.flee = Math.max(0, c.flee - dt);
      const d = Math.hypot(this.me.gx - c.x, this.me.gy - c.y);
      if (d < 1.8 && this.me.actor.moving && c.friend < 1 && c.flee <= 0 && Math.random() < dt * 2) {
        const ax = c.x - this.me.gx, ay = c.y - this.me.gy, l = Math.hypot(ax, ay) || 1;
        const tx = c.x + ax / l * 2.5, ty = c.y + ay / l * 2.5;
        if (!this.nav.hits(tx, ty, 0.3)) { c.tx = tx; c.ty = ty; c.flee = 1.5; }
      } else if (c.t <= 0) {
        c.t = 2 + Math.random() * 4;
        if (c.friend >= 1 && d < 6) { c.tx = this.me.gx + (Math.random() - 0.5) * 1.5; c.ty = this.me.gy + 0.8; } // prietenii te urmeaza
        else { const tx = c.x + (Math.random() - 0.5) * 3, ty = c.y + (Math.random() - 0.5) * 3; if (!this.nav.hits(tx, ty, 0.3)) { c.tx = tx; c.ty = ty; } }
      }
      const dx = c.tx - c.x, dy = c.ty - c.y, dd = Math.hypot(dx, dy);
      if (dd > 0.05) { const sp = (c.flee > 0 ? 2.2 : 0.9) * dt; c.x += dx / dd * Math.min(sp, dd); c.y += dy / dd * Math.min(sp, dd); const s = iso(dx, dy); if (Math.abs(s.x) > 0.01) c.flip = s.x > 0 ? 1 : -1; }
    }
  }
  nearCritter() { if (this.area !== 'forest') return null; let best: Critter | null = null, bd = 1.4; for (const c of this.critters) { const d = Math.hypot(this.me.gx - c.x, this.me.gy - c.y); if (d < bd) { bd = d; best = c; } } return best; }
  petCritter(c: Critter) {
    const was = c.friend >= 1;
    c.friend = Math.min(1, c.friend + 0.34); c.t = 3; c.tx = c.x; c.ty = c.y;
    this.op({ k: 'stat', key: 'friend-' + c.kind + c.id, delta: 1 });
    this.me.actor.play('love'); this.net.sendEvent({ t: 'emote', who: this.myId, anim: 'love' });
    const p = iso(c.x, c.y, 30); this.fx.hearts(p.x, p.y, 5); Sfx.play('kiss');
    this.op({ k: 'need', who: this.myId, need: 'fun', delta: 6 }); this.op({ k: 'need', who: this.myId, need: 'love', delta: 3 });
    if (!was && c.friend >= 1) { this.op({ k: 'stat', key: 'petFriends', delta: 1 }); this.hud.toast(`💕 ${CRITTER_NAMES[c.kind]} e prietenul tău acum! Te urmează prin pădure`); this.log(`${this.me.actor.spec.name} s-a împrietenit cu ${CRITTER_NAMES[c.kind].toLowerCase()} din pădure 🌲💕`); }
    else this.fx.text(p.x, p.y - 30, `${CRITTER_NAMES[c.kind]} ${c.friend >= 1 ? '💕' : 'se apropie…'}`, '#ff4d6d', 0.8);
  }
  drawTravel(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const t = this.travel!.t;
    if (t < 0.6) { irisWipe(ctx, w, h, 1 - t / 0.6); return; }            // se inchide peste lume
    if (t > 3.4) { irisWipe(ctx, w, h, (t - 3.4) / 0.6); return; }        // se deschide peste zona noua
    const k = (t - 0.6) / 2.8;
    drawTravelScene(ctx, w, h, k, this.time, this.travel!.to === 'forest', nightAmount(this.w.minutes), this.me.actor.spec, undefined, Math.min(9, Math.floor((this.w.res?.wood ?? 0) / 2)));
    ctx.save(); ctx.font = '900 28px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#3a2a22';
    const txt = this.travel!.to === 'forest' ? 'Spre pădure! 🌲' : 'Înapoi acasă! 🏡'; ctx.strokeText(txt, w / 2, h * 0.12); ctx.fillText(txt, w / 2, h * 0.12); ctx.restore();
    if (t < 1.0) irisWipe(ctx, w, h, (t - 0.6) / 0.4);
    if (t > 3.0) irisWipe(ctx, w, h, 1 - (t - 3.0) / 0.4);
  }


  /** ajutor (debug / AI): mergi la obiectul cu id-ul dat si interactioneaza */
  goTo(id: string, who: 'me' | 'partner' = 'me') { const f = FURNITURE.find(x => x.id === id); if (f) this.goInteract(who === 'me' ? this.me : this.partner, f); }

  startActivity(pawn: Pawn, a: Activity, f: Furn, fromNet = false) {
    if (a.place === 'sofa') f = FURNITURE.find(x => x.id === 'sofa')!;
    pawn.activity = { a, t: 0, furn: f }; pawn.lastFurn = f.id;
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
    if (ctrl) this.economyOnComplete(pawn, a);
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
      this.log(`${pawn.actor.spec.name} a desfundat toaleta 🪠✨ ${g(pawn.id, "Erou", "Eroină")}!`);
    }
    if (a.id === 'garden' && ctrl) {
      const crops = [...(this.w.furn.crops as number[])];
      const i = crops.findIndex(c => c < 3); if (i >= 0) crops[i]++;
      this.op({ k: 'furn', key: 'crops', value: crops });
    }
    if (ctrl && (a.id === 'mushroom' || a.id === 'berries')) {
      const res = a.id === 'mushroom' ? 'mushroom' : 'berry', n = a.id === 'mushroom' ? 3 : 4;
      this.op({ k: 'res', res, delta: n }); this.op({ k: 'stat', key: res + 'Total', delta: n });
      const f = pawn.lastFurn; if (f) this.op({ k: 'node', id: f, until: Date.now() + 150 * 1000 });
      const p = iso(pawn.gx, pawn.gy, 80); this.fx.text(p.x, p.y - 14, `+${n} ${a.id === 'mushroom' ? '🍄' : '🫐'}`, '#2ec4b6', 1);
    }
    if (ctrl && a.id === 'chop' && this.area === 'forest') this.op({ k: 'stat', key: 'forestWood', delta: pawn.id === 'dudu' ? 4 : 3 });
    if (ctrl && a.id === 'sellwood') {
      const n = Math.max(0, (this.w.res?.wood ?? 0) - 5);
      if (n) { this.op({ k: 'res', res: 'wood', delta: -n }); this.op({ k: 'money', delta: n * 3 }); this.op({ k: 'stat', key: 'woodSold', delta: n }); this.hud.toast(`🪵 Ai vândut ${n} lemne la cherestea: +${n * 3} lei (5 au rămas pentru sobă)`); this.log(`${pawn.actor.spec.name} a vândut ${n} lemne: +${n * 3} lei 💰`); }
    }
    if (ctrl && (a.id === 'chop' || a.id === 'mine' || a.id === 'pick')) {
      const res = a.id === 'chop' ? 'wood' : a.id === 'mine' ? 'stone' : 'flower';
      const n = a.id === 'chop' ? (pawn.id === 'dudu' ? 4 : 3) : 2;
      this.op({ k: 'res', res, delta: n });
      const f = pawn.lastFurn; if (f) this.op({ k: 'node', id: f, until: Date.now() + (a.id === 'pick' ? 60 : 120) * 1000 });
      const p = iso(pawn.gx, pawn.gy, 80); this.fx.text(p.x, p.y - 14, `+${n} ${res === 'wood' ? '🪵' : res === 'stone' ? '🪨' : '🌸'}`, '#2ec4b6', 1);
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
    if (pr.sickOnly && !this.w.chars[this.partner.id].sick) { this.hud.toast(`${this.partner.actor.spec.name} nu e ${g(this.partner.id, 'bolnav', 'bolnavă')} 🙂`); return; }
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
        setTimeout(() => { B.actor.play('dance_hop'); this.hud.toast(`🎉 ${B.actor.spec.name} s-a vindecat! Mulțumită lui ${A.actor.spec.name} 💕`); }, 2600);
        this.log(`${B.actor.spec.name} s-a vindecat datorită lui ${A.actor.spec.name} 🎉`);
      }
      this.sendCharSync();
    }
    if (id === 'steal') {
      const p = iso(A.gx, A.gy, 90); this.fx.text(p.x, p.y, 'Hihihi! 🍰', '#c77dff', 0.9);
      if (A.control === 'ai') { A.fleeT = 12; }
      if (B === this.me) this.hud.toast(`${A.actor.spec.name} ți-a furat prăjitura! ${g(A.id, 'Prinde-l', 'Prinde-o')}! 🏃`);
    }
    if (local) this.op({ k: 'hearts', delta: 1 });
    void local;
  }

  // ------------------------------------------------------------------ minijocuri
  startMinigame(id: string, a: Activity, f: Furn) {
    const M = MINIGAMES[id];
    this.startActivity(this.me, a, f);
    this.me.activity!.t = -9999; // nu se termina singura
    const obj: any = new M(this, (score: number) => {
      this.minigame = null; this.hud.setMinigame(false);
      this.me.miniObj = obj; this.me.miniScore = score;
      if (score > 0) {
        this.stopActivity(this.me, true); this.op({ k: 'hearts', delta: Math.round(score * 3) });
        if (id === 'fridge' && obj.bonusFart) this.op({ k: 'need', who: this.myId, need: 'fart', delta: obj.bonusFart });
      }
      else this.stopActivity(this.me, false);
      this.me.miniObj = undefined;
    });
    this.minigame = { id, obj };
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
    // ceasul jocului (al nostru): o zi = dayMinutes minute reale; noaptea trece repede cand dormiti
    const dayLen = Settings.get().dayMinutes * 60;
    const speed = 1440 / dayLen; // minute de joc pe secunda reala
    this.w.gameMin ??= 8 * 60;
    const paused = this.minigame?.id === 'bedtime';
    const pawns = [this.me, this.partner];
    const allAsleep = pawns.every(p => p.activity?.a.id === 'sleep' && (p.activity.t ?? 0) >= 0);
    const mult = paused ? 0 : allAsleep ? 30 : 1;
    this.timeMult = mult;
    this.w.gameMin += dt * speed * mult;
    this.w.minutes = this.w.gameMin % 1440; this.w.day = Math.floor(this.w.gameMin / 1440) + 1;
    const hours = dt * speed * mult / 60;
    // dimineata: va treziti
    const hr = this.w.minutes / 60;
    if (hr >= 7 && hr < 9) for (const p of pawns) if (p.activity?.a.id === 'sleep' && p.control !== 'remote' && p.activity.t >= 0) {
      this.stopActivity(p, true); p.actor.play('wave');
      if (p === this.me) this.hud.toast('☀️ Bună dimineața! O zi nouă la căsuța voastră');
    }

    const night = nightAmount(this.w.minutes);
    const fuel = (this.w.furn.fire as number) ?? 0;
    (globalThis as any).__fireFuel = fuel;
    this.econT -= dt;
    if (this.econT <= 0) {
      this.econT = 1;
      const h1 = (1440 / dayLen) / 60; // ore de joc intr-o secunda
      if (this.isHost) {
        if (fuel > 0) { const nf = Math.max(0, fuel - 7 * h1); this.w.furn.fire = nf; if (nf === 0) { this.op({ k: 'furn', key: 'fire', value: 0 }); this.hud.toast('🥶 S-a stins focul! Puneți lemne în sobă'); this.log('Focul din sobă s-a stins 🥶'); } else if (Math.random() < 0.1) this.op({ k: 'furn', key: 'fire', value: nf }); }
        // iarba creste
        if (Math.random() < h1 * 1.6) {
          for (let i = 0; i < 8; i++) {
            const x = Math.floor(Math.random() * MAP_W), y = Math.floor(Math.random() * YARD_H), key = x + ',' + y;
            if (floorAt(x, y) !== 'grass' || this.nav.isBlocked(x, y) || FURNITURE.some(f => x >= f.gx && x < f.gx + f.w && y >= f.gy && y < f.gy + f.d)) continue;
            const cur = this.w.grass?.[key] ?? 0; if (cur >= 3) continue;
            this.op({ k: 'grass', key, value: cur + 1 }); break;
          }
        }
      }
      this.checkGoals();
      this.growPlots();
      if (this.isHost && this.partnerOnline) { this.net.sendEvent({ t: 'op', op: { k: 'npcs', list: this.npcPublic() } }); this.net.sendEvent({ t: 'op', op: { k: 'clock', gameMin: this.w.gameMin ?? 0 } }); }
    }
    const inside = (p: Pawn) => (p === this.me ? this.area : this.partnerArea()) === 'home' && p.gx >= HOUSE.x0 && p.gx <= HOUSE.x1 + 1 && p.gy >= HOUSE.y0 && p.gy <= HOUSE.y1 + 1;
    // nevoi (doar pentru personajele controlate local)
    for (const p of [this.me, this.partner]) {
      if (p.control === 'remote') continue;
      const asleep = p.activity?.a.id === 'sleep';
      const cold = (0.7 + night * 1.1) * (inside(p) ? 0.6 : 1.1);
      const gain = (fuel > 0 && inside(p) ? 11 : 0) + (asleep ? 3 : 0) + (p.activity?.a.id === 'bath' ? 6 : 0);
      const ev = tickNeeds(this.w.chars[p.id], hours, asleep, gain, cold);
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
      const key = 'bed-' + this.nightKey();
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
    if (this.travel) { this.travel.t += dt; if (!this.travel.switched && this.travel.t >= 2.0) { this.travel.switched = true; this.switchArea(this.travel.to); } if (this.travel.t >= 4.0) { this.travel = null; this.hud.setMinigame(false); } }
    this.updateCritters(dt);
    (globalThis as any).__stand = { broken: !!this.w.furn.standBroken, open: !!this.w.furn.standOpen };
    (globalThis as any).__trailerLogs = Math.min(6, Math.floor((this.w.res?.wood ?? 0) / 3));
    this.updateNpcs(dt);
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
    if (this.travel) { p.actor.moving = false; return; }
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
    if (!this.sameArea()) { p.actor.moving = false; p.path = []; return; }
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
    if (this.me.activity?.a.id === 'sleep' && !p.activity && this.canSleep(p.id) === null) { this.goTo('bed', 'partner'); p.aiT = 4; return; }
    // AI-ul are grija de tine cand esti bolnav(a)
    if (this.w.chars[this.me.id].sick && !c.sick) {
      if (this.nearPartnerAI()) { this.runPair(p.id, 'care', true); this.hud.toast(`${p.actor.spec.name} are grijă de tine 🩹💕`); p.aiT = 12; }
      else { const path = this.nav.path(p.gx, p.gy, this.me.gx + 0.6, this.me.gy + 0.3) ?? this.nav.path(p.gx, p.gy, this.me.gx - 0.6, this.me.gy); if (path) p.path = path; p.aiT = 1.5; }
      return;
    }
    const low = (Object.entries(c.needs) as [NeedKey, number][]).filter(([k]) => k !== 'health').sort((a, b) => a[1] - b[1])[0];
    const pick = (ids: string[]) => FURNITURE.find(f => f.action && ids.includes(f.action.id));
    let target: Furn | undefined;
    // supravietuire: focul, lemnele, mancarea, iarba
    const R = this.w.res ?? {}; const fuel = (this.w.furn.fire as number) ?? 0;
    const tree = () => FURNITURE.find(f => f.action?.id === 'chop' && !this.depleted(f.id));
    if (fuel < 30 && (R.wood ?? 0) >= 1) target = FURNITURE.find(f => f.id === 'fireplace');
    else if ((R.wood ?? 0) < 3 && Math.random() < 0.6) target = tree();
    else if (c.needs.hunger < 50 && (R.meals ?? 0) + (R.veg ?? 0) > 0) target = pick(['snack']);
    else if (Math.random() < 0.5) {
      const now = this.w.gameMin ?? 0;
      const plots = FURNITURE.filter(f => f.type === 'soilplot').filter(f => { const p = this.w.plots?.[f.id.slice(5)]; if (!p) return false; const st = plotStage(p); return st === 3 || (st >= 0 && p.wetUntil <= now && (R.water ?? 0) > 0) || (st < 0 && Object.keys(CROPS).some(cc => (R[seedKey(cc)] ?? 0) > 0)); });
      if (plots.length) target = plots[0];
      else if ((R.water ?? 0) < 2 && Object.values(this.w.plots ?? {}).some(p => p.crop)) target = FURNITURE.find(f => f.id === 'well');
    }
    else if (p.id === 'dudu' && Object.keys(this.w.grass ?? {}).length > 10 && Math.random() < 0.5) target = pick(['mow']);
    if (target) { this.goInteract(p, target); return; }
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
    if (!target && Math.random() < 0.25 && this.chapter > 0) { const opts = FURNITURE.filter(f => f.action && ['chop', 'mine', 'pick'].includes(f.action.id) && !this.depleted(f.id)); if (opts.length) target = opts[Math.floor(Math.random() * opts.length)]; }
    if (!target && p.id === 'dudu' && Math.random() < 0.08 && this.nearPartnerAI()) { this.runPair(p.id, 'steal', true); return; }
    if (target) { this.goInteract(p, target); return; }
    // altfel: plimbare sau un emote
    const r = Math.random();
    if (r < 0.35) {
      const list = ANIM_LIST.filter(a => (a.kind === 'emote' || a.kind === 'dance' || (a.kind === 'special' && a.who === p.id)) && !['fartjump'].includes(a.id));
      p.actor.play(list[Math.floor(Math.random() * list.length)].id);
    } else {
      for (let i = 0; i < 10; i++) {
        const tx = 1 + Math.random() * (MAP_W - 2), ty = 1 + Math.random() * (MAP_H - 2);
        if (!this.nav.hits(tx, ty)) { const path = this.nav.path(p.gx, p.gy, tx, ty); if (path) { p.path = path; break; } }
      }
    }
  }
  aiFlee(p: Pawn, dt: number) {
    // a furat gustarea: fuge de tine pana il/o prinzi
    {
      p.fleeT = (p.fleeT ?? 0) - dt;
      if (p.fleeT < 10.3 && Math.hypot(this.me.gx - p.gx, this.me.gy - p.gy) < 0.75) {
        p.fleeT = 0; p.path = []; p.actor.play('puppy'); this.hud.toast(`${g(p.id, 'Prins', 'Prinsă')}! ${p.actor.spec.name} îți dă prăjitura înapoi 🥺🍰`);
        this.op({ k: 'need', who: this.me.id, need: 'fun', delta: 15 }); this.op({ k: 'need', who: this.me.id, need: 'hunger', delta: 10 }); this.op({ k: 'hearts', delta: 3 });
        return;
      }
      if (!p.path.length) {
        let best: { x: number; y: number } | null = null, bd = -1;
        for (let i = 0; i < 14; i++) { const tx = 1 + Math.random() * (MAP_W - 2), ty = 1 + Math.random() * (MAP_H - 2); if (this.nav.hits(tx, ty)) continue; const d = Math.hypot(tx - this.me.gx, ty - this.me.gy); if (d > bd) { bd = d; best = { x: tx, y: ty }; } }
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
    if (this.chapter === 0) { const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, night > 0.5 ? '#2b3a67' : '#ffd6e4'); bg.addColorStop(1, night > 0.5 ? '#4a3f75' : '#ffeacc'); ctx.fillStyle = bg; }
    else ctx.fillStyle = night > 0.5 ? '#1f2540' : '#bfe8c9';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (this.shake > 0.3) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    ctx.scale(this.cam.zoom, this.cam.zoom);
    ctx.translate(-this.cam.x, -this.cam.y);

    // podea pre-randata
    const F = this.floor;
    const home = this.area === 'home';
    const ch0 = this.chapter === 0 && home;
    if (ch0) {
      // Capitolul 0: doar casa, ca o casuta de papusi pe un soclu cu iarba (curtea nu se vede)
      const c = iso(8, 7.2); ctx.fillStyle = 'rgba(120,80,100,0.14)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 70, 470, 150, 0, 0, 7); ctx.fill();
      isoBox(ctx, 1.75, 1.75, 12.5, 10.75, 16, { top: '#a6dc93', left: '#b98a5e', right: '#a07450' }, -16);
      ctx.save(); const A = iso(2, 2), B = iso(14, 2), C = iso(14, 12), D = iso(2, 12);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.lineTo(D.x, D.y); ctx.closePath(); ctx.clip();
      ctx.drawImage(F.canvas, F.ox, F.oy, F.canvas.width / 2, F.canvas.height / 2); ctx.restore();
    } else ctx.drawImage(F.canvas, F.ox, F.oy, F.canvas.width / 2, F.canvas.height / 2);
    const inHouse = (x0: number, y0: number, x1: number, y1: number) => !ch0 || (x0 >= 2 && y0 >= 2 && x1 <= 14.2 && y1 <= 12.3);

    const dep: Record<string, boolean> = {}; for (const id in this.w.nodes ?? {}) if (this.depleted(id)) dep[id] = true;
    const st: FurnState = { ...(this.w.furn as FurnState), night, depleted: dep };
    // decoruri pe sol
    for (const f of FURNITURE) if (this.isDecor(f) && inHouse(f.gx, f.gy, f.gx + f.w, f.gy + f.d)) drawFurn(ctx, f, this.time, st);
    if (!ch0 && home) for (const [k, p] of Object.entries(this.w.plots ?? {})) { const [x, y] = k.split(',').map(Number); drawPlotSoil(ctx, x, y, p as Plot, this.w.gameMin ?? 0, this.time); }
    if (!ch0 && home) for (const k in this.w.grass ?? {}) { const [x, y] = k.split(',').map(Number); drawTallGrass(ctx, x, y, this.w.grass![k], this.time); }
    if (this.build?.item) drawGhost(ctx, this.build.item, this.build.gx, this.build.gy, this.canPlace(this.build.item, this.build.gx, this.build.gy) && this.canAfford(this.build.item), this.time);
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

    // gardul curtii: laturile din spate
    if (!ch0 && home) { for (let x = 0; x < MAP_W; x++) drawYardFence(ctx, x, 0, 'x'); for (let y = 0; y < YARD_H; y++) drawYardFence(ctx, 0, y, 'y'); }
    // pereti din spate
    if (ch0) for (const [dx, dy] of [[5.5, 12.05], [14.05, 9.5]]) { const p = iso(dx, dy, 22); this.drawLock(ctx, p.x, p.y); }
    for (const wl of WALLS) if (wl.kind === 'back') drawWall(ctx, wl, this.time, night);

    // sortare in adancime
    type D = { x0: number; y0: number; x1: number; y1: number; draw: () => void; z?: number };
    const items: D[] = [];
    for (const f of FURNITURE) if (!this.isDecor(f)) {
      items.push({ x0: f.gx, y0: f.gy, x1: f.gx + f.w, y1: f.gy + f.d, draw: () => drawFurn(ctx, f, this.time, st) });
    }
    for (const wl of WALLS) if (wl.kind !== 'back') {
      const r = wl.dir === 'x' ? { x0: wl.x, y0: wl.y - 0.05, x1: wl.x + 1, y1: wl.y } : { x0: wl.x - 0.05, y0: wl.y, x1: wl.x, y1: wl.y + 1 };
      items.push({ ...r, draw: () => drawWall(ctx, wl as Wall, this.time, night) });
    }
    if (home) for (let x = 0; x < MAP_W; x++) {
      if (x === YARD_GATE) items.push({ x0: x, y0: YARD_H - 0.02, x1: x + 1, y1: YARD_H, draw: () => drawYardGate(ctx, YARD_GATE, YARD_H) });
      else items.push({ x0: x, y0: YARD_H - 0.02, x1: x + 1, y1: YARD_H, draw: () => drawYardFence(ctx, x, YARD_H, 'x') });
    }
    if (home) for (const [k, p] of Object.entries(this.w.plots ?? {})) { if (!p.crop) continue; const [x, y] = k.split(',').map(Number); items.push({ x0: x + 0.3, y0: y + 0.3, x1: x + 0.7, y1: y + 0.7, draw: () => drawCropPlant(ctx, x, y, p as Plot, this.w.gameMin ?? 0, this.time) }); }
    for (const c of this.critters) if (!home) items.push({ x0: c.x - 0.2, y0: c.y - 0.2, x1: c.x + 0.2, y1: c.y + 0.2, draw: () => { const q = iso(c.x, c.y); drawCritter(ctx, c, q.x, q.y, this.time); } });
    if (home) for (const n of this.npcs) items.push({ x0: n.x - 0.2, y0: n.y - 0.2, x1: n.x + 0.2, y1: n.y + 0.2, draw: () => this.drawNpc(ctx, n) });
    for (const p of [this.me, this.partner]) {
      if (p === this.partner && !this.sameArea()) continue;
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
    for (const it of items) if (inHouse(it.x0, it.y0, it.x1, it.y1)) it.draw();

    // gardul curtii: laturile din fata (cu portita la alee)
    if (!ch0 && home) for (let y = 0; y < YARD_H; y++) drawYardFence(ctx, MAP_W, y, 'y');

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
    // frig: chenar inghetat cand iti e frig
    const wm = this.w.chars[this.myId].needs.warmth ?? 60;
    if (wm < 30) { const k = (30 - wm) / 30; const gr = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7); gr.addColorStop(0, 'rgba(180,220,255,0)'); gr.addColorStop(1, `rgba(200,235,255,${0.55 * k})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); }
    // joystick
    if (this.joy.active) {
      ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.joy.sx, this.joy.sy, 50, 0, 7); ctx.stroke();
      const jx = this.joy.x - this.joy.sx, jy = this.joy.y - this.joy.sy, l = Math.hypot(jx, jy), k = l > 50 ? 50 / l : 1;
      ctx.fillStyle = '#ff7aa2cc'; ctx.beginPath(); ctx.arc(this.joy.sx + jx * k, this.joy.sy + jy * k, 22, 0, 7); ctx.fill();
    }
    if (this.minigame) this.minigame.obj.draw(ctx, w, h);
    if (this.travel) this.drawTravel(ctx, w, h);
  }

  drawLock(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save(); ctx.translate(x, y + Math.sin(this.time * 2) * 2);
    ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -8, 6, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.roundRect(-9, -8, 18, 14, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(0, -2, 2, 0, 7); ctx.fill();
    ctx.restore();
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
