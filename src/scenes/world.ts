import { saveCloud, loadCloud } from '../save/cloud';
import * as Town from './townctl';
import * as TownUI from '../ui/townui';
import { VILLAGERS, DECOR, HOURS, isOpen } from '../game/town';
import type { ShopConfig } from '../minigames/towngames';
import { makeCars, updateCars, drawCar, carPos, CITY_PATHS, type Car , drawAptBuilding } from '../world/city';
import { FloorChunks } from '../world/floor';
import { furnIn, onScreen, furnChanged } from '../world/cull';
import { chapterBlocks, houseSmoke } from '../world/country';
import { SpriteCache, cacheable, layered } from '../world/sprites';
import { worldMapImage, topMapImage } from '../ui/minimap';
import { ORIGIN, REGION_BY_ID, regionAt, MAIN_ROAD, FOREST_TRACK, STOPS, polyLen, pointAt, projectOn, subLine, type Pt } from '../world/layout';
import { fillTextIcons } from '../ui/icons';
// Scena principala: casa izometrica, cei doi ursuleti, nevoi, activitati, multiplayer.
import { Actor } from '../char/actor';
import { ANIMS, ANIM_LIST } from '../char/anims';
import { Fx } from '../char/fx';
import { NPC_SPECS, drawCharacter, type CharId, type CharSpec } from '../char/draw';
import { Sfx } from '../engine/sfx';
import { Soundscape } from '../engine/soundscape';
import { ErrorLog } from '../engine/errors';
import pkg from '../../package.json';
const APP_VER = pkg.version;
import { RECIPE, RECIPES, canCook, consumeList, bestRecipe, bestDish, dishCount, dishKey, dishesOwned, READY_MEAL } from '../game/food';
import { g } from '../game/gender';
import type { Scene, Game } from '../engine/game';
import { iso, unIso, screenDirToGrid, isoBox, boxOf, TW, TH } from '../world/iso';
import { iconCanvas } from '../ui/icons';
import { FURNITURE, WALLS, MAP_W, MAP_H, YARD_H, YARD_GATE, BACK_GATE, type Furn, type Wall, resetAreas, currentArea } from '../world/map';
import { drawFurn, drawWall, drawYardFence, drawYardGate, type FurnState } from '../world/furniture';
import { Nav } from '../world/nav';
import { CATALOG, drawGhost, drawTallGrass, type BuildItem } from '../world/build';
import { GOALS, CHAPTERS, chapterOf, PRICE } from '../game/economy';
import { orderableChains, itemValue } from '../minigames/merge';
import { drawItem, MAX_LVL } from '../world/items';
import { CROPS, WET_MIN, plotStage, catCount, catPick, seedKey, drawPlotSoil, drawCropPlant, type Plot } from '../world/garden';
import { ROAD_Y } from '../world/map';
import { HOUSE, floorAt, AREAS, setArea } from '../world/map';
import { irisWipe, drawScooterSide, drawTandemSide, drawStairsScene, drawBusSide, drawTaxiSide, drawTractorSide } from '../world/vehicles';
import { VILLAGE_PATHS } from '../world/village';
import { drawCritter, CRITTER_NAMES, type Critter, type CritterKind } from '../world/forest';
import { ACTIVITIES, type Activity } from '../game/activities';
import { newWorld, moodFrom, tickNeeds, applyOp, clockText, nightAmount, NEEDS, NEED_INFO, SICK_INFO, REQUESTS, type WorldState, type NeedKey } from '../game/state';
import type { NetAdapter, NetEvent, PlayerState, WorldOp } from '../net/types';
import { Hud } from '../ui/hud';
import { Settings } from '../game/settings';
import { MINIGAMES } from '../minigames/registry';

const ACTOR_SCALE = 0.62;
const SPEED = 2.6; // dale / secunda

export interface Pawn {
  id: CharId;
  actor: Actor;
  gx: number; gy: number;
  path: { x: number; y: number }[];
  activity: { a: Activity; t: number; furn: Furn } | null;
  pendingInteract: Furn | null;
  control: 'me' | 'remote' | 'ai';
  remoteTarget?: { gx: number; gy: number; vx?: number; vy?: number; at?: number; age?: number };
  z: number; // inaltimea (cand sta pe obiecte)
  aiT: number;
  facingBack: boolean;
  fleeT?: number;
  lastFurn?: string;
  pendingCrop?: string;
  riding?: boolean;     // conduce un vehicul
  rideKind?: RideKind;
  passenger?: boolean;  // sta in spate pe scuterul celuilalt
  board?: boolean;      // sta pe vehiculul parcat, gata de plecare (asteapta partenerul sau porneste)
  callBoard?: boolean;  // (AI) a fost chemat sa urce in spate
  follow?: boolean;     // (AI) te insoteste peste tot ("Vino cu mine")
  miniObj?: any; miniScore?: number;
}

export type RideKind = 'scooter' | 'bike' | 'tractor' | 'bus' | 'taxi';
/** viteza pe drum (dale / secunda) */
const RIDE_SPEED: Record<RideKind, number> = { bike: 7, scooter: 10, tractor: 4.5, bus: 11, taxi: 15 };
export interface Ride { kind: RideKind; path: Pt[]; len: number; s: number; v: number; dest: string; duo: boolean; t: number }

export interface Npc { id: string; kind: string; x: number; y: number; sx?: number; tx: number; state: 'come' | 'wait' | 'leave'; wants: string[]; pay: number; t: number; happy?: boolean; spec?: CharSpec; actor?: Actor }

export const PAIRS = [
  { id: 'hug', label: 'Îmbrățișare', icon: '🤗', aAnim: 'hugpose', bAnim: 'hugpose', delay: 0, needs: { love: 15, fun: 4 }, needsB: { love: 15, fun: 4 } },
  { id: 'kiss', label: 'Pupic', icon: '💋', aAnim: 'kisspose', bAnim: 'kisspose', delay: 0, needs: { love: 20 }, needsB: { love: 20 } },
  { id: 'slap', label: 'Palmă la fund', icon: '🍑', aAnim: 'slap', bAnim: 'slapped', delay: 0.48, needs: { fun: 12, love: 4 }, needsB: { love: 6, fun: 6 } },
  { id: 'bonk', label: 'Tigaia în cap', icon: '🍳', aAnim: 'pan', bAnim: 'dizzy', delay: 1.2, needs: { fun: 15 }, needsB: { fun: 4, health: -2 }, only: 'bubu' as CharId },
  { id: 'fartatk', label: 'Atac cu pârț', icon: '☁️', aAnim: 'fartback', bAnim: 'faint', delay: 1.0, needs: { fun: 18 }, needsB: { fun: -4, hygiene: -6 }, fart: 30 },
  { id: 'tickle', label: 'Gâdilat', icon: '🤭', aAnim: 'laugh', bAnim: 'laugh', delay: 0.2, needs: { fun: 12, love: 6 }, needsB: { fun: 14, love: 6 } },
  { id: 'steal', label: 'Fură gustarea', icon: '🍰', aAnim: 'shakebutt', bAnim: 'angry', delay: 0.3, needs: { fun: 14, hunger: 6 }, needsB: { fun: -3 } },
  { id: 'pinch', label: 'Astupă-i nasul (sforăie!)', icon: '😴', aAnim: 'wave', bAnim: 'act_sleepbed', delay: 0, needs: {}, needsB: {} },
  { id: 'care', label: 'Îngrijește', icon: '🩹', aAnim: 'love', bAnim: 'shy', delay: 0.3, needs: { love: 8 }, needsB: { health: 26, love: 12 }, sickOnly: true },
];

export class WorldScene implements Scene {
  fx = new Fx();
  nav = new Nav();
  floorChunks = new FloorChunks(2);
  /** imaginile obiectelor care nu se misca (desenate o data) */
  sprites = new SpriteCache();
  w: WorldState = newWorld();
  me: Pawn; partner: Pawn;
  cam = { x: 0, y: 0, zoom: 1.4 };
  /** micsorarea de pe drum (vezi mai mult din lume cand mergi cu vehiculul) */
  zoomK = 1;
  get effZoom() { return this.cam.zoom * this.zoomK; }
  keys = new Set<string>();
  joy = { active: false, id: -1, sx: 0, sy: 0, x: 0, y: 0 };
  hud!: Hud;
  shake = 0;
  time = 0;
  saveT = 0; syncT = 0; stateT = 0;
  partnerOnline = false;
  sickT = 4;
  econT = 1;
  warned: Record<string, Record<string, boolean>> = {};
  cars: Car[] = [];
  joyRun = false;
  morningT = 0;
  /** regiunea in care esti (din pozitie): home, forest, village, city, lake, country... sau 'apartment' */
  area = 'home';
  /** harta incarcata: lumea mare sau un interior */
  space: 'world' | 'apartment' = 'world';
  /** drumul cu vehiculul (bicicleta, scuter, tractor, autobuz, taxi), in lume */
  ride: Ride | null = null;
  travel: { t: 0 | number; to: string; from?: string; switched?: boolean; vehicle?: 'tractor' | 'bike' | 'scooter' | 'bus' | 'door' | 'taxi'; withPartner?: boolean } | null = null;
  walkers: { a: Actor; x: number; y: number; tx: number; ty: number; t: number; greetT: number; vid?: string; name?: string; region: 'village' | 'city' }[] = [];
  critters: Critter[] = [];
  timeMult = 1;
  npcs: Npc[] = []; npcSpawnT = 6;
  build: { item: BuildItem | null; gx: number; gy: number; remove: boolean } | null = null;
  snoring = false; snoreT = 3;
  snd = new Soundscape(this);
  /** lucruri aruncate (moneda in fantana): zboara in arc, apoi cercuri pe apa */
  flings: { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; z1: number }[] = [];
  private netTick = 0; private lastNpcKey = '';
  /** reteta aleasa la aragaz (o citeste minijocul bucatariei) */
  cookRecipe: string | null = null;
  miniInbox: unknown[] = [];
  minigame: { id: string; obj: any } | null = null;
  private listeners: [EventTarget, string, any][] = [];

  constructor(private game: Game, public net: NetAdapter, public myId: CharId) {
    { const m = Math.min(game.w, game.h); this.cam.zoom = m < 500 ? 0.95 : m < 800 ? 1.15 : 1.4; } // zoom potrivit ecranului (telefon / tableta / laptop)
    const other: CharId = myId === 'bubu' ? 'dudu' : 'bubu';
    this.me = this.makePawn(myId, 'me');
    this.partner = this.makePawn(other, 'ai');
  }

  private makePawn(id: CharId, control: Pawn['control']): Pawn {
    const actor = new Actor(id, this.fx);
    actor.scale = ACTOR_SCALE;
    const pawn: Pawn = { id, actor, gx: 6, gy: 10, path: [], activity: null, pendingInteract: null, control, z: 0, aiT: 2, facingBack: false };
    actor.audible = () => this.snd?.audible(pawn) ?? 1; // sunetele personajului: doar cand e langa tine
    return pawn;
  }
  pawnOf(id: CharId) { return this.me.id === id ? this.me : this.partner; }
  /** (teste) mergi direct intr-o regiune a lumii (in joc nu exista teleportare: se merge pe drum) */
  debugGo(region: string, company?: 'solo' | 'duo') {
    const at: Record<string, { x: number; y: number }> = { home: { x: 6.5, y: 13.5 }, forest: { x: ORIGIN.forest.x + 4.5, y: ORIGIN.forest.y + 22.5 }, village: { x: ORIGIN.village.x + 2.5, y: ORIGIN.village.y + 13.2 }, city: { x: ORIGIN.city.x + 19.5, y: ORIGIN.city.y + 15.5 } };
    if (region === 'apartment') { this.goArea('apartment', company); return; }
    const p = at[region]; if (!p) return;
    if (this.space !== 'world') this.switchArea('world');
    this.stopActivity(this.me); this.me.path = []; this.me.gx = p.x; this.me.gy = p.y;
    if (company === 'duo' && this.partner.control !== 'remote') { this.aiArea = 'world'; this.stopActivity(this.partner); this.partner.path = []; this.partner.gx = p.x + 0.8; this.partner.gy = p.y + 0.3; }
    const c = iso(p.x, p.y, 30); this.cam.x = c.x; this.cam.y = c.y;
  }
  /** (teste) obiectele de pe harta incarcata */
  get furnList() { return FURNITURE; }

  async enter() {
    resetAreas(); // hartile pornesc curate (altfel obiectele casei se puteau lipi de oras dupa o iesire in meniu)
    worldMapImage(); topMapImage(); // hartile lumii se deseneaza acum, cat e incarcata lumea (nu apartamentul)
    this.hud = new Hud(this);
    this.net.onStatus = (s, msg) => this.hud.setNet(s, msg);
    await this.net.connect(Settings.get().net.room, this.myId);
    // incarca salvarea
    let saved = await this.net.loadWorld();
    // si copia din cloud (dupa o reinstalare sau de pe alt telefon): o luam pe cea mai noua
    if (this.net.kind !== 'firebase') { const cloud = await loadCloud(this.cloudKey()); if (cloud && (!saved || cloud.ts > saved.ts)) saved = cloud; }
    // joc nou: ignoram salvarile mai vechi decat resetarea (si pe cele de pe server)
    const resetAt = Settings.get().resetAt ?? 0;
    if (saved && saved.ts < resetAt) saved = null;
    if (saved) { try { const w = JSON.parse(saved.json) as WorldState; if (w.v === 1) this.w = { ...newWorld(), ...w }; } catch { /* corupt */ } }
    this.migrateWorld();
    // Capitolul 0: casa veche, totul e de facut
    if (this.w.stats.chapter === undefined) {
      this.w.stats.chapter = 0;
      Object.assign(this.w.furn, { standBroken: true, standOpen: false, clogged: true, fridgeDirty: true, tubDirty: true, dishesDirty: true, tvBroken: true, fire: 0 });
      this.w.res = { wood: 4, stone: 0, flower: 0, seeds: 3, veg: 2, meals: 0, flour: 2, lemon: 0, hay: 0, egg: 4, milk: 2, water: 2 };
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
    // retea
    this.net.onState = s => this.onRemoteState(s);
    this.net.onEvent = e => this.onRemoteEvent(e);
    this.net.onPresence = (_who, on) => this.setPartnerOnline(on);
    this.net.onStatus = (s, msg) => this.hud.setNet(s, msg);
    this.hud.setNet(this.net.status);
    // te intorci exact unde erai (in lume sau in apartament)
    this.restoreArea();
    this.spawnWalkers(); this.cars = makeCars(); this.spawnCritters();
    this.floorChunks.reset(this.chunkScale());
    // "cat ai lipsit"
    const last = Number(localStorage.getItem('bd-last-seen-' + this.myId) || 0);
    const news = this.w.log.filter(l => l.ts > last);
    if (news.length) setTimeout(() => this.hud.showLog(news.map(n => n.text)), 600);
    this.bindInput();
    this.ready = true;
  }

  exit() {
    this.snd.stop();
    this.save(true);
    resetAreas();
    this.net.disconnect();
    for (const [t, ev, fn] of this.listeners) t.removeEventListener(ev, fn);
    this.hud.destroy();
  }

  // ------------------------------------------------------------------ retea
  private offlineTimer: ReturnType<typeof setTimeout> | null = null;
  private partnerVer = ''; private verWarned = false;
  private joinedToastAt = 0;
  setPartnerOnline(on: boolean) {
    if (on) {
      // a revenit repede (o mica pierdere de semnal): nu mai anuntam nimic
      if (this.offlineTimer) { clearTimeout(this.offlineTimer); this.offlineTimer = null; }
      if (this.partnerOnline) return;
      this.partnerOnline = true; this.partner.control = 'remote'; this.hud.setPartner(true);
      if (Date.now() - this.joinedToastAt > 60000) { this.joinedToastAt = Date.now(); this.hud.toast(`${this.partner.actor.spec.name} a intrat în joc! 💞`); }
      this.sendCharSync();
      // ii spunem ce versiune avem; daca el nu ne spune a lui in 12 s, are o versiune mai veche (fara asta)
      this.net.sendEvent({ t: 'ver', who: this.myId, ver: APP_VER });
      setTimeout(() => { if (this.partnerOnline && !this.partnerVer && !this.verWarned) { this.verWarned = true; this.hud.toast(`⚠️ ${this.partner.actor.spec.name} are o versiune mai veche a jocului. Instalați amândoi ultima versiune (${APP_VER})`); } }, 12000);
      return;
    }
    if (!this.partnerOnline || this.offlineTimer) return;
    // iesirea o anuntam doar daca nu revine in cateva secunde
    this.offlineTimer = setTimeout(() => {
      this.offlineTimer = null; if (!this.partnerOnline) return;
      this.partnerOnline = false; this.partner.control = 'ai'; this.hud.setPartner(false);
      this.hud.toast(`${this.partner.actor.spec.name} a ieșit. ${g(this.partner.id, 'Îl', 'O')} joacă AI-ul 🤖`);
    }, 6000);
  }
  onRemoteState(s: PlayerState) {
    if (s.who !== this.partner.id) return;
    if (!this.partnerOnline) this.setPartnerOnline(true);
    // miscare lina chiar daca pachetele vin neregulat (tunel / date mobile): estimam viteza si o continuam putin
    const now = performance.now(), prev = this.partner.remoteTarget;
    let vx = 0, vy = 0;
    if (prev?.at && s.moving) { const dtS = Math.max(0.03, (now - prev.at) / 1000); vx = (s.gx - prev.gx) / dtS; vy = (s.gy - prev.gy) / dtS; const sp = Math.hypot(vx, vy); if (sp > 6) { vx *= 6 / sp; vy *= 6 / sp; } }
    this.partner.remoteTarget = { gx: s.gx, gy: s.gy, vx, vy, at: now, age: 0 };
    this.partner.actor.flip = s.flip; this.partner.facingBack = s.back;
    this.partner.actor.moving = s.moving;
    this.partner.riding = !!s.riding; this.partner.passenger = !!s.passenger; this.partner.board = !!s.board;
    // ce vehicul are partenerul (inainte nu se trimitea si il vedeai pe scuter cand el era pe bicicleta)
    if (s.rideKind) this.partner.rideKind = s.rideKind; else if (s.riding && !this.partner.rideKind) this.partner.rideKind = (this.w.stats.scooter ?? 0) > 0 && !(this.w.stats.bike ?? 0) ? 'scooter' : 'bike';
  }
  onRemoteEvent(e: NetEvent) {
    switch (e.t) {
      case 'emote': this.pawnOf(e.who).actor.play(e.anim); if (e.anim === 'fartjump' && this.sameArea()) this.superFart(this.pawnOf(e.who)); break;
      case 'pair': this.runPair(e.who, e.pair, false); break;
      case 'op': {
        const prevCh = this.chapter;
        this.applyLocal(e.op);
        const ok = e.op as any; if (ok.k === 'stat' && typeof ok.key === 'string' && ok.key.startsWith('goal-')) { const g = GOALS.find(x => 'goal-' + x.id === ok.key); if (g) this.hud.toast(`✅ Obiectiv: ${g.icon} ${g.text}`); this.hud.refreshGoal(); }
        if (this.chapter > prevCh) { this.syncPlaced(); Sfx.play('good'); this.me.actor.play('dance_hop'); setTimeout(() => this.hud.showChapter(CHAPTERS[prevCh].done), 900); }
        break;
      }
      case 'cotravel': {
        // partenerul porneste la drum cu tine: stai in spate / langa el in autobuz sau taxi si mergeti impreuna
        if (this.travel || this.ride || this.minigame || !this.sameArea()) break;
        if ((e.vehicle === 'bike' || e.vehicle === 'scooter') && !this.me.passenger) break; // n-ai urcat in spate: ramai aici
        this.stopActivity(this.me); this.me.path = []; this.me.passenger = true; this.passengerGrace = 3;
        this.hud.closeMenus(); this.hud.setRide('passenger');
        this.hud.toast(`${({ bike: '🚲', scooter: '🛵', bus: '🚌', taxi: '🚕', tractor: '🚜' } as Record<string, string>)[e.vehicle] ?? '🚗'} Mergeți împreună!`);
        break;
      }
      case 'invite': this.onInvite(e); break;
      case 'ver': {
        this.partnerVer = e.ver;
        if (e.ver !== APP_VER && !this.verWarned) { this.verWarned = true; this.hud.toast(`⚠️ ${this.partner.actor.spec.name} are versiunea ${e.ver}, tu ${APP_VER}. Instalați amândoi ultima versiune ca să meargă totul bine`); }
        break;
      }
      case 'inviteReply': {
        const pi = this.pendingInvite; if (!pi || pi.id !== e.id) break;
        clearTimeout(pi.timer); this.pendingInvite = null;
        if (e.ok) { this.hud.toast(`💞 ${this.partner.actor.spec.name} vine cu tine!`); pi.go(true); }
        else this.inviteDeclined(pi.go, `${this.partner.actor.spec.name} nu poate acum`);
        break;
      }
      case 'ridecall': {
        const nm = this.partner.actor.spec.name;
        this.hud.toast(`${e.vehicle === 'bike' ? '🚲' : '🛵'} ${nm} te așteaptă pe ${e.vehicle === 'bike' ? 'bicicletă' : 'scuter'}! Atinge-${e.vehicle === 'bike' ? 'o' : 'l'} ca să urci în spate`);
        Sfx.play('kiss'); break;
      }
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
  op(o: WorldOp) { this.applyLocal(o); this.net.sendEvent({ t: 'op', op: o }); if (o.k !== 'need' && o.k !== 'clock' && o.k !== 'npcs') this.dirty = true; }
  applyLocal(o: WorldOp) {
    if (o.k === 'npcs') { this.mergeNpcs(o.list as Npc[]); return; }
    if (o.k === 'npcServe') { const n = this.npcs.find(x => x.id === o.id); if (n) { n.state = 'leave'; n.happy = true; n.actor?.play('love'); } return; }
    if (o.k === 'char') { if (o.who !== this.myId) Object.assign(this.w.chars[o.who], o.state as object); return; }
    applyOp(this.w, o);
    if (o.k === 'place' || o.k === 'unplace' || o.k === 'veh') this.syncPlaced(); // vehiculul mutat de partener: il vezi si tu la noul loc
    if (o.k === 'jar' && o.from !== this.myId) this.hud.toast('💌 Ai primit un bilețel în Borcanul cu iubire!');
  }
  private lastStateKey = ''; private lastStateAt = 0; private lastCharSync = ''; private lastCharAt = 0;
  /** trimite starea personajului (nevoi, haine...); periodic doar daca s-a schimbat ceva */
  sendCharSync(always = true) {
    const c = this.w.chars[this.myId]; c.gx = this.me.gx; c.gy = this.me.gy;
    if (!always) {
      const n = c.needs, key = JSON.stringify({ ...c, gx: 0, gy: 0, needs: Object.fromEntries(Object.entries(n).map(([k, v]) => [k, Math.round(v as number / 3)])) });
      if (key === this.lastCharSync && Date.now() - this.lastCharAt < 30000) return;
      this.lastCharSync = key; this.lastCharAt = Date.now();
    }
    this.net.sendEvent({ t: 'op', op: { k: 'char', who: this.myId, state: c } });
  }
  /** unde e parcat vehiculul: 'home', 'village' (bicicleta, scuterul) sau 'forest' (tractorul) */
  vehAt(kind: string) { return this.w.veh?.[kind] ?? 'home'; }
  /** locul de parcare al fiecarui vehicul */
  parkSpot(kind: string, at: string): { gx: number; gy: number; w: number } {
    const V = ORIGIN.village, Fo = ORIGIN.forest;
    if (kind === 'tractor') return at === 'forest' ? { gx: Fo.x + 4, gy: Fo.y + 24, w: 2 } : { gx: 19, gy: -4, w: 2 };
    if (at === 'village') return kind === 'bike' ? { gx: V.x - 5, gy: 22, w: 1 } : { gx: V.x - 4, gy: 22, w: 1 }; // la intrarea in sat, langa drum
    return kind === 'bike' ? { gx: 4, gy: 23, w: 1 } : { gx: 2, gy: 23, w: 1 };
  }
  /** reconstruieste obiectele adaugate in lume (vehicule, razoare, constructii) + navigarea */
  syncPlaced() {
    if (this.space !== 'world' || currentArea() !== 'world') return;
    const dyn = (id: string) => id === 'h-tractor' || id === 'h-wood' || id === 'h-bike' || id === 'h-scooter' || id === 'v-bike' || id === 'v-scooter' || id === 'f-tractor' || id.startsWith('p-') || id.startsWith('plot:');
    for (let i = FURNITURE.length - 1; i >= 0; i--) if (dyn(FURNITURE[i].id)) FURNITURE.splice(i, 1);
    // vehiculele stau unde le-ati lasat: acasa (la indicator) sau in sat (la intrare); tractorul la poarta din spate sau in padure
    // (cat timp cineva merge cu el, vehiculul parcat doar nu se deseneaza; vezi draw)
    for (const k of ['bike', 'scooter'] as const) {
      if (!((this.w.stats[k] ?? 0) > 0)) continue;
      const at = this.vehAt(k), sp = this.parkSpot(k, at), v = at === 'village';
      FURNITURE.push({ id: (v ? 'v-' : 'h-') + k, type: (k === 'bike' ? 'parkedbike' : 'parkedscooter') as any, gx: sp.gx, gy: sp.gy, w: 1, d: 1, solid: false, action: { id: k === 'bike' ? 'tripbike' : 'tripscooter', label: v ? (k === 'bike' ? 'Acasă cu bicicleta' : 'Acasă cu scuterul') : (k === 'bike' ? 'În sat cu bicicleta' : 'În sat cu scuterul'), icon: k === 'bike' ? '🚲' : '🛵' } });
    }
    if (this.chapter >= 2) {
      { const at = this.vehAt('tractor'), sp = this.parkSpot('tractor', at); FURNITURE.push({ id: at === 'forest' ? 'f-tractor' : 'h-tractor', type: 'tractor' as any, gx: sp.gx, gy: sp.gy, w: 2, d: 1, solid: true, action: at === 'forest' ? { id: 'gohome', label: 'Înapoi acasă cu tractorașul', icon: '🚜' } : { id: 'forest', label: 'Spre pădure cu tractorașul', icon: '🚜' } }); }
      FURNITURE.push({ id: 'h-wood', type: 'logpile' as any, gx: 17, gy: 15, w: 1, d: 1, solid: true, action: { id: 'sellwood', label: 'Vinde lemne la cherestea', icon: '💰' } });
    }
    for (const key of Object.keys(this.w.plots ?? {})) { const [x, y] = key.split(',').map(Number); FURNITURE.push({ id: 'plot:' + key, type: 'soilplot', gx: x, gy: y, w: 1, d: 1, solid: false, action: { id: 'plot', label: 'Răzor', icon: '🌱' } }); }
    for (const p of this.w.placed ?? []) {
      const it = CATALOG.find(c => c.type === p.type); if (!it) continue;
      FURNITURE.push({ id: 'p-' + p.uid, type: it.type as any, gx: p.gx, gy: p.gy, w: it.w, d: it.d, solid: it.solid, action: it.action });
    }
    furnChanged();
    this.nav = new Nav([...this.doorBlocks(), ...this.worldBlocks()]);
    this.navKey = this.blockKey();
  }
  /** cheia obstacolelor care depind de capitol (cand se schimba, refacem navigarea) */
  navKey = '';
  blockKey() { return `${this.chapter}|${this.bridgeFixed()}`; }
  chunkScale() { return Math.max(1, Math.min(2, this.game.dpr * Math.max(1, this.cam.zoom))); }
  depleted(id: string) { return (this.w.nodes?.[id] ?? 0) > Date.now(); }
  isDecor(f: Furn) { return !f.solid && ['soilplot', 'rug', 'plot', 'doormat', 'flowers', 'stonepath', 'heartstone', 'flowerbed', 'wildflower', 'lilypad', 'bridgegap'].includes(f.type as string); }

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
      this.op({ k: 'unplace', uid: f.id.slice(2) }); Sfx.play('wood_drop');
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
    if (it.type === 'soilplot') { this.op({ k: 'plot', key: `${b.gx},${b.gy}`, plot: { crop: null, prog: 0, wetUntil: 0, fert: 0 } }); this.syncPlaced(); Sfx.play('dig'); Sfx.play('good', { delay: 0.4, vol: 0.6 }); return; }
    const uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    this.op({ k: 'place', uid, type: it.type, gx: b.gx, gy: b.gy });
    const p = iso(b.gx + it.w / 2, b.gy + it.d / 2, 40);
    this.fx.burst('star', p.x, p.y, 10, 6.28, 120, { max: 0.8 }); this.fx.text(p.x, p.y - 20, `${it.icon} Construit!`, '#ff9f1c', 0.9);
    Sfx.play('hammer'); Sfx.play('hammer', { delay: 0.25 }); Sfx.play('saw', { delay: 0.5, vol: 0.5 }); Sfx.play('good', { delay: 0.9, vol: 0.7 }); this.op({ k: 'hearts', delta: it.coop ? 5 : 1 });
    this.op({ k: 'need', who: this.myId, need: 'fun', delta: 5 });
    this.me.actor.play(this.myId === 'dudu' ? 'flex' : 'love'); this.net.sendEvent({ t: 'emote', who: this.myId, anim: this.myId === 'dudu' ? 'flex' : 'love' });
    if (it.coop) this.log(`${this.me.actor.spec.name} a construit ${it.label} ${it.icon} pentru voi!`);
  }

  log(text: string) { this.op({ k: 'log', text, ts: Date.now() }); }
  dirty = false; lastCloud = 0;
  /** unde tinem copia din cloud: jocul solo are casuta lui (nu se amesteca cu al partenerului) */
  cloudKey() { const room = Settings.get().net.room; return this.net.kind === 'solo' ? `${room}-solo-${this.myId}` : room; }
  /** salveaza pe telefon (mereu) si in cloud (cel mult o data la 30 s, sau imediat cand iesi din joc) */
  save(force = false) {
    if (!this.ready || !this.w || !this.me) return;
    for (const p of [this.me, this.partner]) { this.w.chars[p.id].gx = p.gx; this.w.chars[p.id].gy = p.gy; }
    (this.w.chars[this.myId] as any).area = this.area;
    if (this.partner.control !== 'remote') (this.w.chars[this.partner.id] as any).area = this.aiArea;
    this.w.ts = Date.now();
    const json = JSON.stringify(this.w);
    this.net.saveWorld(json, this.w.ts, force);
    this.dirty = false;
    try { localStorage.setItem('bd-last-seen-' + this.myId, String(Date.now())); } catch { /* */ }
    if (this.net.kind !== 'firebase' && (force || Date.now() - this.lastCloud > 30000)) { this.lastCloud = Date.now(); saveCloud(this.cloudKey(), json, this.w.ts); }
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
    // cand inchizi / minimizezi aplicatia: salvam imediat (si in cloud)
    this.on(document, 'visibilitychange', () => { if (document.visibilityState === 'hidden') this.save(true); });
    this.on(window, 'pagehide', () => this.save(true));
    this.on(window, 'beforeunload', () => this.save(true));
    const cv = this.game.canvas;
    this.on(cv, 'pointerdown', (ev: PointerEvent) => {
      const q = this.game.pt(ev); const e = { clientX: q.x, clientY: q.y, pointerId: ev.pointerId, pointerType: ev.pointerType };
      Sfx.unlock();
      if (this.minigame) {
        const mk = this.miniScale(); e.clientX /= mk; e.clientY /= mk;
        const b = this.minigame.obj.box;
        if (b && e.clientX > b.x + b.w - 44 && e.clientX < b.x + b.w + 6 && e.clientY > b.y - 6 && e.clientY < b.y + 40) { this.minigame.obj.abort?.(); return; }
        if (this.minigame.obj.ended) { this.minigame.obj.skipEnd?.(); return; }
        this.minigame.obj.pointer?.('down', e.clientX, e.clientY); return;
      }
      this.hud.closeMenus(); // atingi jocul: se inchid meniurile deschise (emote-uri / impreuna)
      if (e.clientX < this.game.w * 0.45 && e.clientY > this.game.h * 0.45 && e.pointerType !== 'mouse') {
        this.joy = { active: true, id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY };
        return;
      }
      this.tapAt(e.clientX, e.clientY);
    });
    this.on(cv, 'pointermove', (ev: PointerEvent) => {
      const q = this.game.pt(ev); const e = { clientX: q.x, clientY: q.y, pointerId: ev.pointerId, pointerType: ev.pointerType };
      if (this.minigame) { const mk = this.miniScale(); this.minigame.obj.pointer?.('move', e.clientX / mk, e.clientY / mk); return; }
      if (this.joy.active && e.pointerId === this.joy.id) { this.joy.x = e.clientX; this.joy.y = e.clientY; }
      else if (this.build?.item && e.pointerType === 'mouse') { const g = this.screenToGrid(e.clientX, e.clientY); this.build.gx = Math.floor(g.x); this.build.gy = Math.floor(g.y); }
    });
    const up = (ev: PointerEvent) => {
      const q = this.game.pt(ev); const e = { clientX: q.x, clientY: q.y, pointerId: ev.pointerId, pointerType: ev.pointerType };
      if (this.minigame) { const mk = this.miniScale(); this.minigame.obj.pointer?.('up', e.clientX / mk, e.clientY / mk); return; }
      if (e.pointerId === this.joy.id) this.joy.active = false;
    };
    this.on(cv, 'pointerup', up); this.on(cv, 'pointercancel', up);
    this.on(cv, 'wheel', (e: WheelEvent) => { this.cam.zoom = Math.max(0.7, Math.min(2.6, this.cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1))); }, { passive: true });
  }

  screenToGrid(sx: number, sy: number) {
    const wx = (sx - this.game.w / 2) / this.effZoom + this.cam.x;
    const wy = (sy - this.game.h / 2) / this.effZoom + this.cam.y;
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
      const f = furnIn(gg.x - 1, gg.y - 1, gg.x + 1, gg.y + 1).find(f => f.action && gg.x >= f.gx && gg.x <= f.gx + f.w && gg.y >= f.gy && gg.y <= f.gy + f.d);
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
    for (const f of furnIn(pawn.gx - 6, pawn.gy - 6, pawn.gx + 2, pawn.gy + 2)) {
      if (!f.action) continue;
      const cx = Math.max(f.gx, Math.min(pawn.gx, f.gx + f.w)), cy = Math.max(f.gy, Math.min(pawn.gy, f.gy + f.d));
      const d = Math.hypot(pawn.gx - cx, pawn.gy - cy);
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  }
  nearPartner() { return this.sameArea() && Math.hypot(this.me.gx - this.partner.gx, this.me.gy - this.partner.gy) < 1.7; }

  /** cel mai apropiat satean cu care poti vorbi */
  nearVillager() { if (this.area !== 'village') return null; let best: typeof this.walkers[0] | null = null, bd = 1.5; for (const v of this.walkers) { if (!v.vid) continue; const d = Math.hypot(v.x - this.me.gx, v.y - this.me.gy); if (d < bd) { bd = d; best = v; } } return best; }
  doAction() {
    if (this.me.activity) { this.stopActivity(this.me); return; }
    const vl = this.nearVillager(); if (vl && !this.nearestFurn(this.me)) { vl.t = 4; vl.tx = vl.x; vl.ty = vl.y; vl.a.play('wave'); TownUI.openVillager(this, vl.vid!); return; }
    // intai obiectul de langa tine (copacul, piatra...), ca in eticheta butonului; animalul doar daca nu e nimic altceva
    const f = this.nearestFurn(this.me);
    if (f) { this.interact(this.me, f); return; }
    const cr = this.nearCritter(); if (cr) { this.petCritter(cr); return; }
    if (this.nearPartner()) this.hud.togglePairs(true);
  }

  /** ce actiune se face cu un obiect (depinde de stare) */
  actionFor(f: Furn): { id: string; label: string; icon: string } | null {
    if (!f.action) return null;
    // vehiculul cu care partenerul e pe drum: nu e aici de fapt (se vede doar dupa ce il parcheaza)
    { const k = f.id === 'h-bike' || f.id === 'v-bike' ? 'bike' : f.id === 'h-scooter' || f.id === 'v-scooter' ? 'scooter' : f.id === 'h-tractor' || f.id === 'f-tractor' ? 'tractor' : '';
      if (k && ((this.partner.riding && this.partner.rideKind === k && !this.partner.board && this.sameArea()) || (this.ride && this.ride.kind === k))) return null; }
    if (f.id === 'toilet' && this.w.furn.clogged) return { id: 'unclog', label: 'Desfundă toaleta!', icon: '🪠' };
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
    if (pawn === this.me && this.ride) return; // pe drum nu faci altceva
    if (pawn.riding && !['village', 'v-home', 'forest', 'gohome', 'ridebike', 'ridescooter', 'tripbike', 'tripscooter'].includes(this.actionFor(f)?.id ?? '')) { pawn.riding = false; if (this.partner.passenger && pawn === this.me) { this.partner.passenger = false; this.partner.gx = pawn.gx + 0.6; this.partner.gy = pawn.gy + 0.3; } }
    const act = this.actionFor(f); if (!act) return;
    pawn.path = []; pawn.pendingInteract = null;
    if (act.id === 'lamp') { this.op({ k: 'furn', key: 'lampOn', value: !this.w.furn.lampOn }); Sfx.play('click'); return; }
    if (act.id === 'mail') { if (pawn === this.me) this.hud.openJar(); return; }
    if (act.id === 'dress') { if (pawn === this.me) this.hud.openWardrobe(); return; }
    if (act.id === 'toilet' && this.w.furn.clogged) return;
    if (act.id === 'tripbike' || act.id === 'tripscooter') { if (pawn === this.me) this.boardVehicle(act.id === 'tripbike' ? 'bike' : 'scooter', f); return; }
    if (act.id === 'village') { if (pawn === this.me) this.boardBest(); return; }
    if (act.id === 'bridgeinfo') { if (pawn === this.me) this.hud.toast(this.bridgeFixed() ? '🌉 Podul Mare' : '🌉 Podul Mare e rupt: lipsesc scânduri. Satul e dincolo de el…'); return; }
    if (act.id === 'roadblock') { if (pawn === this.me) this.hud.toast(this.chapter >= 4 ? '🏙️ Drumul spre oraș e deschis' : '🚧 Drumul spre oraș e închis (lucrări). Se deschide mai târziu în poveste'); return; }
    if (act.id === 'forestgate') { if (pawn === this.me) this.hud.toast(this.chapter >= 2 ? '🌲 Poarta pădurii e deschisă' : '🔒 Pădurea se deschide în Capitolul 2'); return; }
    if (act.id.startsWith('v-') && pawn === this.me) { this.villageAction(act.id, f); return; }
    if ((act.id.startsWith('c-') || act.id === 'a-exit') && pawn === this.me) { this.cityAction(act.id, f); return; }
    if (act.id === 'growing') return;
    if (act.id === 'plant' && !pawn.pendingCrop) {
      const seeds = Object.keys(CROPS).filter(c => (this.w.res?.[seedKey(c)] ?? 0) > 0);
      if (!seeds.length) { if (pawn === this.me) { this.hud.toast('N-ai semințe 🌰 — cumpără de la laptop (online) sau din sat'); Sfx.play('bad'); } return; }
      if (pawn === this.me) { this.hud.openSeeds(seeds, crop => { pawn.pendingCrop = crop; this.interact(pawn, f); }); return; }
      pawn.pendingCrop = seeds[Math.floor(Math.random() * seeds.length)];
    }
    if (act.id === 'online') { if (pawn === this.me) this.hud.openVillage('online'); return; }
    if (act.id === 'cook' && pawn === this.me && !this.missing('cook')) { this.hud.openKitchen(rc => { this.cookRecipe = rc; this.startMinigame(RECIPE[rc].method === 'pancakes' ? 'pancakes' : 'cook', ACTIVITIES.cook, f); }); return; }
    if (act.id === 'eat' && !this.missing('eat')) {
      const eat = (key: string) => { const d = dishesOwned(this.w.res ?? {}).find(x => x.key === key); const rc = d?.rc ?? READY_MEAL; this.startActivity(pawn, { ...ACTIVITIES.eat, needs: { ...rc.needs, love: (rc.needs.love ?? 0) + 3 }, text: rc.text, dish: key, fart: rc.fart ?? 10 } as any, f); };
      if (pawn === this.me) { const list = dishesOwned(this.w.res ?? {}); if (list.length === 1) eat(list[0].key); else this.hud.openTable(eat); }
      else eat(bestDish(this.w.res ?? {})?.key ?? 'meals');
      return;
    }
    const a = ACTIVITIES[act.id]; if (!a) return;
    if (act.id === 'sleep') { const why = this.canSleep(pawn.id); if (why) { if (pawn === this.me) { this.hud.toast(why); Sfx.play('bad'); } return; } (this.w.chars[pawn.id] as any).napStart = (this.w.minutes / 60 >= 6 && this.w.minutes / 60 < 20) ? (this.w.gameMin ?? 0) : null; }
    const need = this.missing(act.id);
    if (need) { if (pawn === this.me) { this.hud.toast(need); Sfx.play('bad'); pawn.actor.play('puppy'); } return; }
    if (act.id === 'forest' || act.id === 'gohome') { if (pawn === this.me) this.tractorRide(act.id === 'forest' ? 'forest' : 'home'); return; }
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
    if (h >= 20 || h < 6) return null;                       // noaptea: oricand
    const e = this.w.chars[id].needs.energy;
    if (e < 30) return null;                                  // ziua: pui de somn doar cand esti obosit
    return `Nu ți-e somn acum (energie ${Math.round(e)}%). Te culci seara după 20:00 sau când ești obosit(ă) (sub 30%)`;
  }
  get isHost() { return this.myId === 'bubu' || !this.partnerOnline; }
  missing(id: string): string | null {
    const r = this.w.res ?? {};
    const fuel = (this.w.furn.fire as number) ?? 0;
    switch (id) {
      case 'addwood': return (r.wood ?? 0) < 1 ? 'N-ai lemne! 🪵 Taie un copac din curte (sau cumpără din sat)' : fuel > 90 ? 'Soba e plină 🔥' : null;
      case 'lightfire': return (r.wood ?? 0) < 1 ? 'Ai nevoie de un lemn ca să aprinzi focul 🪵' : null;
      case 'snack': return dishCount(r) + catCount(r, 'veg') < 1 ? 'Frigiderul e gol! 🧊 Gătește, culege din grădină sau cumpără din sat' : null;
      case 'eat': return dishCount(r) < 1 ? 'Nu e nimic gătit 🍽️ Gătește la aragaz (ai rețete noi!) sau cumpără mâncare' : null;
      case 'cook': return RECIPES.some(rc => canCook(r, rc)) || catCount(r, 'veg') + (r.fish ?? 0) > 0 ? null : 'Nu ai ingrediente 🥕🥚 Culege din grădină, pescuiește sau cumpără din sat (ouă, lapte, brânză, carne…)';
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
      case 'snack': { if ((r.meals ?? 0) > 0) { this.op({ k: 'res', res: 'meals', delta: -1 }); break; } const k = catPick(r, 'veg'); if (k) { this.op({ k: 'res', res: k, delta: -1 }); break; } const d = dishesOwned(r).sort((x, y) => (x.rc.needs.hunger ?? 0) - (y.rc.needs.hunger ?? 0))[0]; if (d) this.op({ k: 'res', res: d.key, delta: -1 }); break; }
      case 'eat': { const key = (a as any).dish ?? bestDish(r)?.key ?? 'meals'; if ((r[key] ?? 0) > 0) this.op({ k: 'res', res: key, delta: -1 }); this.op({ k: 'stat', key: 'mealsEaten', delta: 1 }); break; }
      case 'cook': {
        const rid = pawn === this.me ? (mini?.recipe ?? this.cookRecipe) : null;
        const rc = (rid && RECIPE[rid] && canCook(r, RECIPE[rid]) ? RECIPE[rid] : null) ?? bestRecipe(r);
        if (!rc) { const k = (r.fish ?? 0) > 0 && Math.random() < 0.5 ? 'fish' : catPick(r, 'veg') ?? 'fish'; this.op({ k: 'res', res: k, delta: -1 }); this.op({ k: 'res', res: 'meals', delta: 3 }); this.op({ k: 'stat', key: 'cooked', delta: 1 }); say('+3 🍲'); break; }
        for (const [k, n] of consumeList(r, rc)) this.op({ k: 'res', res: k, delta: -n });
        const q = mini?.rc ? mini.quality : mini?.quality != null ? mini.quality / 3 : 0.6;
        const n = rc.portions + (q > 0.8 ? 1 : 0);
        this.op({ k: 'res', res: dishKey(rc.id), delta: n }); this.op({ k: 'stat', key: 'cooked', delta: 1 }); this.op({ k: 'stat', key: 'cooked_' + rc.id, delta: 1 });
        say(`+${n} ${rc.icon}`); this.log(`${pawn.actor.spec.name} a gătit ${rc.name.toLowerCase()} ${rc.icon} (${n} porții)`);
        this.cookRecipe = null; break;
      }
      case 'repairstand': this.op({ k: 'res', res: 'wood', delta: -6 }); this.op({ k: 'furn', key: 'standBroken', value: false }); this.op({ k: 'stat', key: 'standRepaired', delta: 1 }); this.hud.toast('🔨 Taraba e ca nouă! Acum deschide-o ca să vină clienții'); this.log(`${pawn.actor.spec.name} a reparat taraba 🔨🧺`); break;
      case 'openstand': this.op({ k: 'furn', key: 'standOpen', value: true }); this.op({ k: 'stat', key: 'standOpened', delta: 1 }); this.hud.toast('🧺 Taraba e deschisă! Vin clienți pe drum'); this.npcSpawnT = Math.min(this.npcSpawnT, 4); break;
      case 'drawwater': this.op({ k: 'res', res: 'water', delta: Math.min(3, 9 - (r.water ?? 0)) }); this.op({ k: 'stat', key: 'waterDrawn', delta: 1 }); say('+3 💧'); break;
      case 'waterplot': case 'fertilize': case 'harvest': case 'plant': this.plotDone(pawn, a.id); break;
      case 'chop': this.op({ k: 'stat', key: 'woodTotal', delta: pawn.id === 'dudu' ? 3 : 2 }); break;
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
    if (!this.isHost) return; // in multiplayer doar gazda (Bubu) decide obiectivele, ca sa nu se dubleze recompensele
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
    Sfx.play('victory'); Sfx.play('applause', { delay: 0.5, vol: 0.6 });
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
  /** clientii florariei (alta lume decat cei de la taraba de acasa) */
  florNpcs: Npc[] = [];
  /** clientii magazinului deschis acum: florarie sau taraba */
  shopNpcs() { return this.storeMode === 'florarie' ? this.florNpcs : this.npcs; }
  spawnNpc(florist = false) {
    const served = this.w.stats.served ?? 0;
    const chains = florist ? ['flower'] : orderableChains(this.w.res ?? {}, this.w.stats);
    // la taraba vin sateni in haine de zi cu zi; la florarie, cumparatori eleganti (alte personaje, alte haine)
    const kinds = florist ? ['cat', 'fox', 'bunny'] : ['granny', 'pig', 'dog', 'bunny'];
    const n = served > 8 && Math.random() < 0.3 ? 2 : 1;
    const wants: string[] = [];
    for (let i = 0; i < n; i++) {
      const ch = Math.random() < 0.5 ? chains[chains.length - 1] : chains[Math.floor(Math.random() * chains.length)];
      const maxL = Math.min(MAX_LVL[ch], Math.floor(served / 4) + 1);
      const l = Math.floor(Math.random() ** 1.6 * (maxL + 1));
      wants.push(`${ch}:${Math.min(maxL, florist ? Math.max(1, l) : l)}`); // la florarie se cer buchete, nu fire
    }
    (florist ? this.florNpcs : this.npcs).push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind: kinds[Math.floor(Math.random() * kinds.length)], x: florist ? -1 : -12, sx: florist ? -1 : -12, y: ROAD_Y, tx: 0, state: 'come', wants, pay: wants.reduce((s, c) => s + itemValue(c), 1), t: 0 });
  }
  updateNpcs(dt: number) {
    const host = this.isHost;
    const h = this.w.minutes / 60;
    if (host) {
      this.npcSpawnT -= dt;
      const waiting = this.npcs.filter(n => n.state !== 'leave').length;
      const open = !!this.w.furn.standOpen && !this.w.furn.standBroken;
      if (open && h >= 20) { this.op({ k: 'furn', key: 'standOpen', value: false }); this.hud.toast('🌙 Taraba s-a închis pentru noapte'); for (const n of this.npcs) if (n.state !== 'leave') { n.state = 'leave'; n.happy = false; } }
      if (open && this.npcSpawnT <= 0 && h >= 7 && h < 20 && waiting < 3) { this.npcSpawnT = 25 + Math.random() * 25; this.spawnNpc(false); }
    }
    // florăria (doar cât e deschisă, pe telefonul celui care vinde)
    const flor = this.storeMode === 'florarie' && this.minigame?.id === 'merge';
    if (flor) {
      this.florSpawnT -= dt;
      if (this.florSpawnT <= 0 && this.florNpcs.filter(n => n.state !== 'leave').length < 3) { this.florSpawnT = 14 + Math.random() * 14; this.spawnNpc(true); }
      this.stepNpcs(this.florNpcs, dt, true);
      this.florNpcs = this.florNpcs.filter(n => n.x < 24);
    } else if (this.florNpcs.length) this.florNpcs = [];
    this.stepNpcs(this.npcs, dt, host);
    if (host) this.npcs = this.npcs.filter(n => n.x < 34); // pleaca pe drum, spre est
  }
  florSpawnT = 3;
  /** misca clientii spre tejghea, ii asaza la rand, pleaca dupa ce sunt serviti */
  private stepNpcs(list: Npc[], dt: number, host: boolean) {
    const slots = [9.6, 8.3, 7.0];
    let si = 0;
    for (const n of list) {
      if (!n.spec) {
        n.spec = NPC_SPECS[n.kind]; n.actor = new Actor('bubu', this.fx, n.spec); n.actor.scale = ACTOR_SCALE * 0.92;
        const fl = list === this.florNpcs, hsh = n.id.charCodeAt(n.id.length - 1);
        n.actor.outfit = fl ? { head: ['joben', 'palarie', 'none'][hsh % 3], face: 'none', neck: hsh % 2 ? 'bowtie' : 'none', body: n.kind === 'fox' ? 'costum' : 'rochie' } as any
          : n.kind === 'granny' ? { head: 'batic', face: 'none', neck: 'scarf', body: 'ie' } as any : { head: ['palarie', 'cap', 'none'][hsh % 3], face: 'none', neck: 'none', body: ['salopeta', 'vesta', 'tricou'][hsh % 3] } as any;
      }
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
  }
  serveNpc(id: string, pay: number) {
    const fn = this.florNpcs.find(x => x.id === id);
    if (fn) { fn.state = 'leave'; fn.happy = true; fn.actor?.play('love'); } else this.op({ k: 'npcServe', id });
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

  // ------------------------------------------------------------------ lumea: regiuni, interioare, drumuri
  /** harta pe care e AI-ul ('world' sau 'apartment') */
  aiArea = 'world';
  /** unde e partenerul: regiunea (din pozitie) sau 'apartment' */
  partnerArea() {
    const sp = this.partnerSpace();
    return sp === 'apartment' ? 'apartment' : regionAt(this.partner.gx, this.partner.gy).id;
  }
  /** harta partenerului: 'world' sau 'apartment' */
  partnerSpace(): 'world' | 'apartment' {
    if (this.partner.control === 'remote') { const a = (this.w.chars[this.partner.id] as any).area; return a === 'apartment' ? 'apartment' : 'world'; }
    return this.aiArea === 'apartment' ? 'apartment' : 'world';
  }
  /** suntem pe aceeasi harta (amandoi in lume sau amandoi in apartament)? */
  sameArea() { return this.partnerSpace() === this.space; }
  /** usa blocului (scara): intri / iesi din apartament */
  goArea(name: string, company?: 'solo' | 'duo') {
    if (this.travel || this.ride) return;
    const to = name === 'apartment' ? 'apartment' : 'world';
    if (to === this.space) return;
    this.stopActivity(this.me); this.me.path = []; this.hud.closeMenus();
    this.me.riding = false; this.partner.passenger = false; this.hud.setRide(null);
    const withPartner = this.partner.control !== 'remote' ? (company ? company === 'duo' : this.sameArea() && Math.hypot(this.partner.gx - this.me.gx, this.partner.gy - this.me.gy) < (this.partner.follow ? 8 : 4)) : false;
    this.travel = { t: 0, to, from: this.space, vehicle: 'door', withPartner };
    this.hud.setMinigame(true);
  }
  switchArea(name: string) {
    const from = this.space;
    setArea(name); this.space = name === 'apartment' ? 'apartment' : 'world'; furnChanged();
    this.me.board = false; this.me.riding = false; this.me.passenger = false;
    if (this.partner.control !== 'remote') { this.partner.passenger = false; this.partner.riding = false; this.partner.callBoard = false; }
    if (this.space === 'world') this.syncPlaced(); else { this.syncDecor(); }
    this.floorChunks.reset(); this.sprites.clear();
    // din apartament iesi pe usa blocului, in oras
    const sp = this.space === 'apartment' ? AREAS.apartment.spawn : from === 'apartment' ? { x: ORIGIN.city.x + 4.1, y: ORIGIN.city.y + 25.1 } : AREAS.world.spawn;
    this.me.gx = sp.x; this.me.gy = sp.y; this.me.z = 0;
    this.area = this.space === 'apartment' ? 'apartment' : regionAt(sp.x, sp.y).id;
    (this.w.chars[this.myId] as any).area = this.area; this.sendCharSync();
    if (this.travel?.withPartner) { this.aiArea = this.space; this.stopActivity(this.partner); this.partner.path = []; this.partner.gx = sp.x + 0.8; this.partner.gy = sp.y + 0.3; this.partner.z = 0; }
    if (this.space === 'apartment') this.op({ k: 'stat', key: 'aptVisits', delta: 1 });
    const c = iso(this.me.gx, this.me.gy, 30); this.cam.x = c.x; this.cam.y = c.y;
  }
  /**
   * Salvarile de dinainte de lumea mare tineau pozitia in coordonatele zonei (padure / sat / oras);
   * acum toate sunt in coordonatele lumii. O singura data: mutam pozitiile la locul lor din lume.
   */
  migrateWorld() {
    const w = this.w as WorldState & { worldV?: number };
    if (w.worldV === 2) return;
    let away = false;
    for (const id of ['bubu', 'dudu'] as const) {
      const c = w.chars[id] as any; const a = c.area as string | undefined;
      if (a === 'forest' || a === 'village' || a === 'city') { const o = ORIGIN[a]; c.gx += o.x; c.gy += o.y; if (a !== 'forest') away = true; }
    }
    // vehiculele: unde le-ati lasat (inainte erau si acasa, si in sat)
    w.veh ??= {};
    for (const k of ['bike', 'scooter']) w.veh[k] ??= 'home';
    w.veh.tractor ??= 'home';
    if (away) { const k = (w.stats.scooter ?? 0) > 0 ? 'scooter' : 'bike'; w.veh[k] = 'village'; }
    w.worldV = 2;
  }
  /** dupa incarcare: aceeasi harta si acelasi loc ca la ultima salvare */
  restoreArea() {
    const mine = (this.w.chars[this.myId] as any).area as string | undefined;
    const ai = (this.w.chars[this.partner.id] as any).area as string | undefined;
    this.aiArea = ai === 'apartment' ? 'apartment' : 'world';
    const inApt = mine === 'apartment' && !!this.w.stats.apartment;
    if (inApt) { setArea('apartment'); this.space = 'apartment'; furnChanged(); this.syncDecor(); }
    const home = { x: 6.5, y: 9.4 };
    for (const p of [this.me, this.partner]) {
      const c = this.w.chars[p.id];
      const sameMap = p === this.me ? true : (this.aiArea === 'apartment') === inApt;
      p.gx = c.gx; p.gy = c.gy;
      if (sameMap && this.nav.hits(p.gx, p.gy)) {
        const sp = inApt ? AREAS.apartment.spawn : home;
        p.gx = sp.x + (p.id === 'dudu' ? 0.8 : 0); p.gy = sp.y;
      }
    }
    this.area = this.space === 'apartment' ? 'apartment' : regionAt(this.me.gx, this.me.gy).id;
    this.lastRegion = this.area;
    const c = iso(this.me.gx, this.me.gy, 30); this.cam.x = c.x; this.cam.y = c.y;
  }
  lastRegion = 'home';
  /** ai intrat intr-o regiune noua (pe jos sau cu vehiculul) */
  onRegion(id: string, prev: string) {
    if (id === 'village') this.op({ k: 'stat', key: 'villageTrips', delta: 1 });
    if (id === 'city') this.op({ k: 'stat', key: 'cityTrips', delta: 1 });
    if (id === 'forest' && prev !== 'forest') this.op({ k: 'stat', key: 'forestTrips', delta: 1 });
    const r = REGION_BY_ID[id];
    if (r && id !== 'country') this.hud.regionBanner(r.icon, r.name);
  }
  /** cum sunt blocate drumurile acum (poarta padurii, podul, bariera spre oras) */
  bridgeFixed() { return this.chapter >= 3 || (this.w.stats.bridgeFixed ?? 0) > 0; }
  worldBlocks() { return this.space === 'world' ? chapterBlocks(this.chapter, this.bridgeFixed()) : []; }
  spawnCritters() {
    const kinds: CritterKind[] = ['deer', 'squirrel', 'hedgehog', 'bird', 'squirrel', 'deer', 'hedgehog'];
    this.critters = [];
    kinds.forEach((kind, i) => {
      for (let k = 0; k < 20; k++) { const x = ORIGIN.forest.x + 1 + Math.random() * 19, y = ORIGIN.forest.y + 1 + Math.random() * 20; if (!this.nav.hits(x, y, 0.3)) { this.critters.push({ id: i, kind, x, y, tx: x, ty: y, t: Math.random() * 3, flip: 1, friend: (this.w.stats['friend-' + kind + i] ?? 0) / 3, flee: 0 }); break; } }
    });
  }
  updateCritters(dt: number) {
    if (this.space !== 'world' || this.area !== 'forest') return;
    for (const c of this.critters) {
      c.t -= dt; c.flee = Math.max(0, c.flee - dt);
      const d = Math.hypot(this.me.gx - c.x, this.me.gy - c.y);
      if (d < 1.8 && this.me.actor.moving && c.friend < 1 && c.flee <= 0 && Math.random() < dt * 2) {
        const ax = c.x - this.me.gx, ay = c.y - this.me.gy, l = Math.hypot(ax, ay) || 1;
        const tx = c.x + ax / l * 2.5, ty = c.y + ay / l * 2.5;
        if (!this.nav.hits(tx, ty, 0.3)) { c.tx = tx; c.ty = ty; c.flee = 1.5; }
      } else if (c.t <= 0) {
        c.t = 2 + Math.random() * 4;
        // prietenii te urmeaza de la cativa pasi (cel mult 2), nu se lipesc de tine si te lasa sa lucrezi
        const followers = this.critters.filter(o => o.friend >= 1).sort((a, b) => Math.hypot(this.me.gx - a.x, this.me.gy - a.y) - Math.hypot(this.me.gx - b.x, this.me.gy - b.y)).slice(0, 2);
        if (c.friend >= 1 && d < 7 && followers.includes(c) && !this.me.activity && d > 2.2) { const side = followers.indexOf(c) ? 1 : -1, a = Math.random() * Math.PI; const tx = this.me.gx + side * (1.8 + Math.random() * 0.6), ty = this.me.gy + 1.2 + Math.sin(a) * 0.6; if (!this.nav.hits(tx, ty, 0.3)) { c.tx = tx; c.ty = ty; } }
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
    if (this.travel!.vehicle === 'door') {
      // scara blocului: inchidem peste lume, urci / cobori pe scari, apoi se deschide zona noua
      if (t < 0.35) { irisWipe(ctx, w, h, 1 - t / 0.35); return; }
      if (t > 2.75) { irisWipe(ctx, w, h, (t - 2.75) / 0.35); return; }
      const tr = this.travel!, down = tr.from === 'apartment';
      const k = Math.max(0, Math.min(1, (t - 0.45) / 2.2));
      drawStairsScene(ctx, w, h, k, this.time, nightAmount(this.w.minutes), down, this.me.actor.spec, this.w.chars[this.myId].outfit, tr.withPartner ? this.partner.actor.spec : undefined, this.w.chars[this.partner.id].outfit);
      if (t < 0.6) irisWipe(ctx, w, h, (t - 0.35) / 0.25);
      if (t > 2.5) irisWipe(ctx, w, h, 1 - (t - 2.5) / 0.25);
      return;
    }
  }


  // ------------------------------------------------------------------ satul
  /** satenii si orasenii care se plimba (o data, la intrarea in joc: traiesc in lume tot timpul) */
  spawnWalkers() {
    const kinds = Object.keys(NPC_SPECS);
    this.walkers = [];
    for (const region of ['village', 'city'] as const) {
      const PATHS = region === 'city' ? CITY_PATHS : VILLAGE_PATHS;
      for (let i = 0; i < (region === 'city' ? 12 : 8); i++) {
        const p = PATHS[i % PATHS.length];
        const a = new Actor('bubu', this.fx, NPC_SPECS[kinds[i % kinds.length]]); a.scale = ACTOR_SCALE * 0.92;
        if (kinds[i % kinds.length] === 'granny') a.outfit = { head: 'batic', face: 'none', neck: 'none', body: 'ie' };
        else if (region === 'city') a.outfit = { head: ['none', 'joben', 'none', 'palarie'][i % 4], face: 'none', neck: 'none', body: ['costum', 'rochie', 'tricou', 'pulover', 'costum'][i % 5] };
        else if (i % 3 === 0) a.outfit = { head: i % 2 ? 'palarie' : 'none', face: 'none', neck: 'none', body: ['vesta', 'salopeta', 'tricou', 'rochita'][i % 4] };
        const wk = { a, x: p.x + (Math.random() - 0.5), y: p.y + (Math.random() - 0.5) * 0.6, tx: p.x, ty: p.y, t: Math.random() * 3, greetT: 0, region } as WorldScene['walkers'][number];
        // in sat: satenii cu nume (vorbesti cu ei, au cereri, va imprieteniti)
        if (region === 'village' && i < VILLAGERS.length) { const v = VILLAGERS[i]; wk.vid = v.id; wk.name = v.name; a.spec = NPC_SPECS[v.spec]; if (v.spec === 'granny') a.outfit = { head: 'batic', face: 'none', neck: 'none', body: 'ie' }; }
        this.walkers.push(wk);
      }
    }
  }
  updateWalkers(dt: number) {
    if (this.space !== 'world') return;
    const GREET = ['Bună ziua! 🌸', 'Ce zi frumoasă! ☀️', 'Să trăiți! 😊', 'Ați fost la piață? 🧺', 'Ce haine faine! 👗', 'Vă stă bine împreună! 💕'];
    for (const v of this.walkers) {
      // departe de tine nu se misca (nu se vede oricum): economisim bateria
      const md = Math.hypot(this.me.gx - v.x, this.me.gy - v.y);
      if (md > 45) continue;
      const PATHS = v.region === 'city' ? CITY_PATHS : VILLAGE_PATHS;
      v.t -= dt; v.greetT -= dt;
      if (v.t <= 0 && Math.hypot(v.tx - v.x, v.ty - v.y) < 0.1) { v.t = 2 + Math.random() * 5; const p = PATHS[Math.floor(Math.random() * PATHS.length)]; const tx = p.x + (Math.random() - 0.5) * 1.2, ty = p.y + (Math.random() - 0.5) * 0.8; if (!this.nav.hits(tx, ty)) { v.tx = tx; v.ty = ty; } }
      const dx = v.tx - v.x, dy = v.ty - v.y, d = Math.hypot(dx, dy);
      if (d > 0.05 && v.t <= 0) { const sp = 1.1 * dt; const nx = v.x + dx / d * Math.min(sp, d), ny = v.y + dy / d * Math.min(sp, d); if (!this.nav.hits(nx, ny, 0.18)) { v.x = nx; v.y = ny; } else { v.tx = v.x; v.ty = v.y; } const s = iso(dx, dy); if (Math.abs(s.x) > 0.01) v.a.flip = s.x > 0 ? 1 : -1; v.a.moving = true; }
      else v.a.moving = false;
      if (md < 1.4 && v.greetT <= 0 && !this.ride) { v.greetT = 12; v.a.play('wave'); const q = iso(v.x, v.y, 96); this.fx.text(q.x, q.y, GREET[Math.floor(Math.random() * GREET.length)], '#7a5a4a', 0.75); }
      const q = iso(v.x, v.y); v.a.x = q.x; v.a.y = q.y; v.a.update(dt);
    }
  }
  /** institutia e inchisa la ora asta? (afiseaza programul) */
  closed(id: string) {
    const h = this.w.minutes / 60; const H = HOURS[id];
    if (!H || isOpen(id, h)) return false;
    this.hud.toast(`🌙 E închis acum. Program: ${H[0]}:00 – ${H[1] === 24 ? '24' : H[1]}:00`); Sfx.play('bad'); return true;
  }
  villageAction(id: string, f: Furn) {
    const st = this.w.stats;
    if (this.closed(id)) return;
    switch (id) {
      case 'v-grocery': Town.villageGrocery(this); break;
      case 'v-post': TownUI.openJob(this, 'post'); break;
      case 'v-bakery': this.choice('🥖 Brutăria', 'Cumperi pâine sau lucrezi o tură?', [['🛒', 'Cumpără pâine', () => Town.villageBakeryShop(this)], ['👩‍🍳', 'Lucrează ca brutar' + (this.myId === 'bubu' ? 'iță' : ''), () => TownUI.openJob(this, 'bakery')]]); break;
      case 'v-clinic': this.choice('🩺 Dispensarul satului', 'Doctorița Rita vă îngrijește și vă dă medicamente.', [['🩺', `Consult (vindecă boala) · ${PRICE.consultVillage} lei`, () => { const e = Town.cure(this, PRICE.consultVillage); this.hud.toast(e ?? '🩺 Gata, sănătoși! Să nu mai răciți 💕'); Sfx.play(e ? 'bad' : 'good'); }], ['💊', 'Farmacia', () => Town.pharmacy(this, false)]]); break;
      case 'v-board': TownUI.openBoard(this); break;
      case 'v-clothes': this.hud.openClothes('sat'); break;
      case 'v-market': Town.villageMarket(this); break;
      case 'v-hall': this.hud.openHall(); break;
      case 'v-home': this.boardBest(); break;
      case 'v-bus': {
        this.askCompany('bus', 'Autobuzul spre oraș', '🚌', duo => {
          const cost = PRICE.bus * (duo ? 2 : 1);
          if ((this.w.money ?? 0) < cost) { this.hud.toast(`🚌 Biletul de autobuz costă ${PRICE.bus} lei de persoană (${cost} lei)`); Sfx.play('bad'); return; }
          this.op({ k: 'money', delta: -cost }); this.hud.toast(`🎫 ${duo ? 'Două bilete' : 'Un bilet'} (${cost} lei) — ${duo ? 'urcați' : 'urcă'} în autobuz!`); this.startRide('bus', 'city', duo);
        }); break;
      }
      case 'v-church': this.hud.toast(new Date().getDay() === 0 ? '⛪ E duminică: clopotele bat de sărbătoare 🔔' : '⛪ Biserica satului. Clopotele bat la 8, 12 și 18 🔔'); break;
      case 'v-fountain':
        if ((this.w.money ?? 0) < 1) { this.hud.toast('N-ai nicio monedă 🙂'); return; }
        this.op({ k: 'money', delta: -1 }); this.op({ k: 'need', who: this.myId, need: 'love', delta: 6 }); Sfx.play('coin'); Sfx.play('splash', { delay: 0.6, vol: 0.4, rate: 1.6 });
        this.flings.push({ x0: this.me.gx, y0: this.me.gy, x1: f.gx + f.w / 2 + (Math.random() - 0.5) * 0.3, y1: f.gy + f.d / 2 + (Math.random() - 0.5) * 0.3, t: 0, dur: 0.6, z1: (f.type as string) === 'cfountain' ? 26 : 22 }); this.me.actor.play('wave');
        { const p = iso(f.gx + 0.5, f.gy + 0.5, 50); this.fx.text(p.x, p.y, '🪙 Ți-ai pus o dorință… 💕', '#ff4d6d', 0.9); this.fx.hearts(p.x, p.y, 5); }
        this.me.actor.play('love'); break;
      case 'v-carousel':
        if ((this.w.money ?? 0) < PRICE.carousel) { this.hud.toast(`Călușeii costă ${PRICE.carousel} lei 🎠`); return; }
        this.op({ k: 'money', delta: -PRICE.carousel }); this.op({ k: 'stat', key: 'carousel', delta: 1 });
        // te urci pe un calut si faci cateva ture (cu muzica)
        this.startActivity(this.me, ACTIVITIES.carousel, f); Sfx.play('chimes'); Sfx.play('good', { delay: 0.4, vol: 0.5 }); break;
      case 'v-ferris':
        this.askCompany('ferris', 'Roata mare', '🎡', duo => {
          const cost = duo ? PRICE.ferris : Math.ceil(PRICE.ferris / 2);
          if ((this.w.money ?? 0) < cost) { this.hud.toast(`Roata mare costă ${cost} lei 🎡`); return; }
          this.op({ k: 'money', delta: -cost }); this.duo = duo; this.startCustom('ferris');
        }); break;
      case 'v-school': this.startCustom('quiz'); break;
      case 'v-florarie':
        if (!st.florarie) { this.hud.toast('💐 Florăria e de vânzare — o cumpărați de la Primărie'); return; }
        this.storeMode = 'florarie'; this.startCustom('merge'); break;
      case 'v-workshop':
        if (!st.workshop) { this.hud.toast('🪚 Tâmplăria e de vânzare — o cumpărați de la Primărie'); return; }
        this.hud.openWorkshop(); break;
    }
  }
  cityAction(id: string, f: Furn) {
    const st = this.w.stats, money = this.w.money ?? 0;
    if (this.closed(id)) return;
    const pay = (n: number, what: string) => { if (money < n) { this.hud.toast(`Nu ajung banii: ${what} costă ${n} lei 💰`); Sfx.play('bad'); return false; } this.op({ k: 'money', delta: -n }); Sfx.play('coin'); return true; };
    const h = this.w.minutes / 60;
    switch (id) {
      case 'c-bus': this.askCompany('cbus', 'Autobuzul spre sat', '🚌', duo => {
        const cost = PRICE.bus * (duo ? 2 : 1);
        if (!pay(cost, duo ? 'Două bilete de autobuz' : 'Biletul de autobuz')) return;
        this.startRide('bus', 'village', duo);
      }); break;
      case 'c-taxi': {
        this.askCompany('taxi', 'Taxi până acasă', '🚕', duo => {
          if (!pay(PRICE.taxi, 'Taxiul până acasă')) return;
          this.startRide('taxi', 'home', duo);
        }); break;
      }
      case 'c-boutique': this.hud.openClothes('oras'); break;
      case 'c-super': Town.citySuper(this); break;
      case 'c-cafe': TownUI.openJob(this, 'cafe'); break;
      case 'c-office': TownUI.openJob(this, 'office'); break;
      case 'c-bank': TownUI.openBank(this); break;
      case 'c-uni': TownUI.openUni(this); break;
      case 'c-mall': Town.cityMall(this); break;
      case 'c-gara': this.hud.toast('🚂 Gara orașului: trenurile spre alte orașe pornesc mai târziu în poveste'); break;
      case 'c-hospital': this.choice('🏥 Spitalul orașului', 'Doctori, farmacie și locuri de muncă.', [['🩺', `Consult (vindecă boala) · ${PRICE.consultCity} lei`, () => { const e = Town.cure(this, PRICE.consultCity); this.hud.toast(e ?? '🩺 Sănătoși tun! 💪'); Sfx.play(e ? 'bad' : 'good'); }], ['💊', 'Farmacia', () => Town.pharmacy(this, true)], ['🩹', 'Lucrează la spital', () => TownUI.openJob(this, 'nurse')]]); break;
      case 'a-aquarium': this.decorUse('aquarium'); break;
      case 'a-piano': this.decorUse('piano'); break;
      case 'a-console': this.decorUse('console'); break;
      case 'a-coffee': this.decorUse('coffee'); break;
      case 'c-cinema': this.askCompany('cinema', 'Film la cinema', '🎬', duo => { if (pay(duo ? PRICE.cinema : Math.ceil(PRICE.cinema / 2), duo ? 'Două bilete la film' : 'Biletul la film')) { this.duo = duo; this.startCustom('cinema'); } }); break;
      case 'c-resto': if (h < 11) { this.hud.toast('🍽️ Restaurantul se deschide la 11:00'); return; } this.askCompany('resto', 'Cină la restaurant', '🕯️', duo => { if (pay(duo ? PRICE.resto : Math.ceil(PRICE.resto / 2), duo ? 'Cina pentru doi' : 'Cina')) { this.duo = duo; this.startCustom('resto'); } }); break;
      case 'c-ice':
        if (!pay(PRICE.ice, 'Înghețata (două cornete)')) return;
        this.op({ k: 'need', who: this.myId, need: 'fun', delta: 15 }); this.op({ k: 'need', who: this.myId, need: 'hunger', delta: 8 }); this.op({ k: 'stat', key: 'icecream', delta: 1 });
        if (this.partner.control !== 'remote' && this.sameArea()) this.op({ k: 'need', who: this.partner.id, need: 'fun', delta: 15 });
        this.me.actor.play('dance_hop'); { const p = iso(f.gx + 0.5, f.gy + 0.5, 70); this.fx.text(p.x, p.y, 'Mmm, înghețată! 🍦', '#ff4d6d', 0.9); } break;
      case 'c-tower':
        if (!st.apartment) { TownUI.openBank(this); this.hud.toast('🏙️ Apartamentele se cumpără de la bancă (pe loc sau cu credit)'); return; }
        this.goArea('apartment'); break;
      case 'a-exit': this.goArea('world'); break;
    }
    void f;
  }
  // ---- sat / oras: joburi, cursuri, magazine
  jobCtx: { id: string } | null = null;
  courseId: string | null = null;
  shopCfg: ShopConfig | null = null;
  finishJob(perf: number, detail: string) { return Town.finishJob(this, perf, detail); }
  finishCourse(id: string, pass: boolean, good: number) { return Town.finishCourse(this, id, pass, good); }
  /** minijocul curent se joaca in doi (true) sau singur (false) — il citesc cinema, restaurant, roata mare */
  duo = false;
  private pendingInvite: { id: string; go: (duo: boolean) => void; timer: ReturnType<typeof setTimeout> } | null = null;
  /** partenerul e langa tine (aceeasi zona, cativa pasi) */
  partnerClose(r = 6) { return this.sameArea() && !this.travel && Math.hypot(this.partner.gx - this.me.gx, this.partner.gy - this.me.gy) < r; }
  /**
   * Singur sau impreuna? Daca partenerul e langa tine alegi; partenerul real primeste o invitatie
   * si decide el (nu mai e tras dupa tine). Daca nu e langa tine, mergi singur.
   */
  askCompany(what: string, label: string, icon: string, go: (duo: boolean) => void) {
    const p = this.partner, nm = p.actor.spec.name;
    if (!this.partnerClose()) { go(false); return; }
    this.choice(`${icon} ${label}`, `Mergi ${g(this.myId, 'singur', 'singură')} sau cu ${nm}?`, [
      ['🧍', g(this.myId, 'Singur', 'Singură'), () => go(false)],
      ['💞', `Cu ${nm}`, () => {
        if (p.control !== 'remote') { go(true); return; }
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        this.net.sendEvent({ t: 'invite', who: this.myId, id, what, label, icon });
        this.hud.toast(`💌 ${g(p.id, `L-ai invitat pe ${nm}`, `Ai invitat-o pe ${nm}`)}… așteaptă răspunsul`);
        if (this.pendingInvite) clearTimeout(this.pendingInvite.timer);
        const timer = setTimeout(() => { if (this.pendingInvite?.id === id) { this.pendingInvite = null; this.inviteDeclined(go, `${nm} nu a răspuns`); } }, 25000);
        this.pendingInvite = { id, go, timer };
      }],
    ]);
  }
  private inviteDeclined(go: (duo: boolean) => void, why: string) {
    Sfx.play('bad', { vol: 0.5 });
    this.choice('💌 ' + why, `Mergi ${g(this.myId, 'singur', 'singură')}?`, [['🧍', g(this.myId, 'Da, merg singur', 'Da, merg singură'), () => go(false)], ['↩️', 'Renunț', () => {}]]);
  }
  /** ai primit o invitatie de la partener */
  private onInvite(e: { who: CharId; id: string; what: string; label: string; icon: string }) {
    const nm = this.partner.actor.spec.name;
    const reply = (ok: boolean) => this.net.sendEvent({ t: 'inviteReply', who: this.myId, id: e.id, ok });
    if (this.minigame || this.travel || !this.sameArea()) { reply(false); return; }
    Sfx.play('doorbell', { vol: 0.5 });
    this.choice(`💌 ${nm} te invită`, `${e.icon} ${e.label} — mergeți împreună?`, [
      ['💞', 'Vin!', () => {
        reply(true);
        // la minijocuri (cinema, restaurant, roata) intri si tu; la drumuri (autobuz, taxi) te ia el cu el
        if (['cinema', 'resto', 'ferris'].includes(e.what)) { this.me.gx = this.partner.gx + 0.6; this.me.gy = this.partner.gy + 0.3; this.duo = true; this.startCustom(e.what); }
      }],
      ['🙅', 'Nu acum', () => reply(false)],
    ]);
  }
  /** fereastra mica cu cateva optiuni (ex. Brutaria: cumpar / lucrez) */
  choice(title: string, sub: string, opts: [string, string, () => void][]) {
    const m = this.hud.modal(`<h3>${title}</h3><p class="sub">${sub}</p><div class="shop">${opts.map(([ic, lb], i) => `<button data-ch="${i}"><span>${ic}</span><b>${lb}</b></button>`).join('')}</div>`);
    m.querySelectorAll('[data-ch]').forEach(b => b.addEventListener('click', () => { m.classList.add('hidden'); opts[+(b as HTMLElement).dataset.ch!][2](); }));
  }
  /** mobila cumparata de la mall, in apartament */
  decorUse(id: string) {
    const me = this.myId, near = this.sameArea() && Math.hypot(this.partner.gx - this.me.gx, this.partner.gy - this.me.gy) < 3;
    const op = (need: string, d: number, who = me) => this.op({ k: 'need', who, need, delta: d });
    if (id === 'aquarium') { op('fun', 10); op('love', 2); this.me.actor.play('love'); this.hud.toast('🐟 Peștișorii înoată liniștiți… ce relaxant'); }
    if (id === 'piano') { op('fun', 14); this.me.actor.play('dance_wave'); Sfx.play('good'); if (near) { op('love', 12); op('love', 12, this.partner.id); this.hud.toast('🎹 Un cântec pentru doi 💕'); } else this.hud.toast('🎹 Cânți o melodie frumoasă'); this.op({ k: 'stat', key: 'pianoPlays', delta: 1 }); }
    if (id === 'console') { if (this.w.chars[me].needs.energy < 10) { this.hud.toast('😴 Prea obosit' + (me === 'bubu' ? 'ă' : '') + ' pentru jocuri'); return; } op('fun', 22); op('energy', -5); if (near) { op('fun', 22, this.partner.id); op('love', 5); } this.me.actor.play('laugh'); this.hud.toast(near ? '🎮 Meci în doi! Cine câștigă? 😄' : '🎮 Ce joc bun!'); }
    if (id === 'coffee') { if ((this.w.stats[`coffee-${me}-${this.w.day}`] ?? 0) > 0) { this.hud.toast('☕ Ai băut deja cafeaua de azi'); return; } this.op({ k: 'stat', key: `coffee-${me}-${this.w.day}`, delta: 1 }); op('energy', 18); this.me.actor.play('boba'); this.hud.toast('☕ Cafeluța de dimineață: +energie!'); }
  }
  /** pune mobila cumparata in apartament */
  syncDecor() {
    if (this.space !== 'apartment' || currentArea() !== 'apartment') return;
    for (let i = FURNITURE.length - 1; i >= 0; i--) if (FURNITURE[i].id.startsWith('d-')) FURNITURE.splice(i, 1);
    const owned = (this.w.town?.decor as string[] | undefined) ?? [];
    for (const d of DECOR) if (owned.includes(d.id)) FURNITURE.push({ id: 'd-' + d.id, type: d.type as any, gx: d.gx, gy: d.gy, w: d.w, d: d.d, solid: true, action: d.action });
    this.nav = new Nav([]);
  }
  /** scara la care desenam minijocurile (1 pe ecrane normale, <1 pe ecrane scunde) */
  miniScale() { return Math.min(1, this.game.h / 470); }
  /** cate cadre pe secunda ne trebuie: 60 cand se misca ceva, 30 cand stati (modul eco economiseste bateria) */
  wantFps() {
    // 60 doar cand te misti tu, in minijocuri, pe drum si la construit; altfel 30 (partenerul care se plimba arata bine si la 30)
    const busy = !!this.minigame || !!this.travel || !!this.build || this.joy.active || this.me.actor.moving || this.me.path.length > 0 || this.shake > 0.5;
    return busy ? 60 : 30;
  }
  storeMode: '' | 'florarie' = '';
  /** porneste un minijoc fara activitate legata de un obiect */
  startCustom(mini: string) {
    const M = MINIGAMES[mini]; if (!M) return;
    this.stopActivity(this.me); this.me.path = [];
    const obj: any = new M(this, (score: number) => {
      this.minigame = null; this.hud.setMinigame(false); this.storeMode = '';
      if (score > 0) this.op({ k: 'hearts', delta: Math.round(score * 3) });
    });
    this.minigame = { id: mini, obj };
    this.hud.setMinigame(true);
  }

  /** urci pe vehiculul parcat: de aici alegi Porneste singur / Cheama partenerul / Coboara */
  boardVehicle(kind: 'bike' | 'scooter', f: Furn) {
    if (this.space !== 'world' || this.ride) return;
    if (!((this.w.stats[kind] ?? 0) > 0)) { this.hud.toast(kind === 'bike' ? '🚲 Nu aveți bicicletă încă (laptopul → Vehicule)' : '🛵 Nu aveți scuter încă (laptopul → Vehicule)'); Sfx.play('bad'); return; }
    const pa = this.partner;
    // partenerul (de pe celalalt telefon) e deja la volan: urci in spate
    if (pa.control === 'remote' && this.sameArea() && pa.board && pa.riding && pa.rideKind === kind) {
      this.stopActivity(this.me); this.me.path = []; this.me.passenger = true; this.passengerGrace = 3; Sfx.play('pop');
      this.hud.toast(`💕 Ai urcat în spate! Așteaptă să pornească ${pa.actor.spec.name}`); this.hud.setRide('passenger'); return;
    }
    if (this.me.board) return;
    if (!this.bridgeFixed()) { this.hud.toast('🌉 Podul Mare spre sat e rupt… încă nu se poate trece'); Sfx.play('bad'); return; }
    this.stopActivity(this.me); this.me.path = [];
    this.me.gx = f.gx + 0.5; this.me.gy = f.gy + 0.55; this.me.z = 0;
    this.me.riding = true; this.me.rideKind = kind; this.me.board = true;
    this.me.actor.flip = f.id.startsWith('v-') ? -1 : 1; // spre drum: acasa satul e la dreapta, din sat casa e la stanga
    Sfx.play(kind === 'scooter' ? 'car_start' : 'bike_bell', { vol: 0.6, rate: kind === 'scooter' ? 1.3 : 1 });
    this.hud.setRide('driver');
  }
  /** vehiculul (bicicleta / scuterul) parcat in apropiere, cel mai bun primul */
  nearVehicle(r = 14): Furn | null {
    const list = FURNITURE.filter(f => (f.type as string) === 'parkedscooter' || (f.type as string) === 'parkedbike');
    list.sort((a, b) => ((b.type as string) === 'parkedscooter' ? 1 : 0) - ((a.type as string) === 'parkedscooter' ? 1 : 0));
    return list.find(f => Math.hypot(f.gx + 0.5 - this.me.gx, f.gy + 0.5 - this.me.gy) < r) ?? null;
  }
  /** indicatorul "Spre sat" (acasa) / "Inapoi acasa" (in sat): urci pe vehiculul de aici sau afli pe unde e drumul */
  boardBest() {
    const f = this.nearVehicle();
    if (f) { this.boardVehicle((f.type as string) === 'parkedscooter' ? 'scooter' : 'bike', f); return; }
    const toVillage = this.area !== 'village';
    if (!this.bridgeFixed()) { this.hud.toast('🌉 Drumul spre sat trece peste Podul Mare, care e rupt… încă nu se poate trece'); Sfx.play('bad'); return; }
    const owned = (['scooter', 'bike'] as const).filter(k => (this.w.stats[k] ?? 0) > 0);
    const where = owned.length ? ` (${owned[0] === 'bike' ? 'bicicleta e' : 'scuterul e'} ${this.vehAt(owned[0]) === 'village' ? 'în sat' : 'acasă'})` : '';
    this.hud.toast(toVillage ? `🚶 Satul e la vreun minut de mers pe drum, spre dreapta, peste Podul Mare${where}` : `🚶 Casa e la vreun minut de mers pe drum, spre stânga, peste Podul Mare${where}`);
  }
  rideStart() {
    if (!this.me.board || !this.me.rideKind) return;
    const kind = this.me.rideKind;
    this.startRide(kind, this.vehAt(kind) === 'village' ? 'home' : 'village', !!this.partner.passenger);
  }
  rideCall() {
    const pa = this.partner, kind = this.me.rideKind ?? 'bike';
    if (!this.me.board) return;
    if (!this.partnerClose(10)) { this.hud.toast(`${pa.actor.spec.name} nu e aici 🙂 Poți porni singur${this.me.id === 'bubu' ? 'ă' : ''}`); return; }
    if (pa.control === 'remote') { this.net.sendEvent({ t: 'ridecall', who: this.myId, vehicle: kind }); this.hud.toast(`📣 L-ai chemat pe ${pa.actor.spec.name}. Când urcă, apasă Pornim!`.replace('L-ai chemat pe', pa.id === 'bubu' ? 'Ai chemat-o pe' : 'L-ai chemat pe')); }
    else { pa.callBoard = true; pa.path = []; this.hud.toast(`📣 ${pa.actor.spec.name} vine să urce în spate…`); }
    this.me.actor.play('wave'); this.net.sendEvent({ t: 'emote', who: this.myId, anim: 'wave' });
  }
  rideOff() {
    if (this.me.passenger) { this.me.passenger = false; this.me.gx += 0.6; this.me.gy += 0.4; this.hud.setRide(null); return; }
    if (!this.me.board) return;
    this.me.board = false; this.me.riding = false;
    if (this.partner.passenger && this.partner.control !== 'remote') { this.partner.passenger = false; this.partner.gx = this.me.gx + 0.6; this.partner.gy = this.me.gy + 0.4; }
    this.partner.callBoard = false;
    this.me.gy += 0.5;
    Sfx.play('pop'); this.hud.setRide(null);
  }
  passengerGrace = 0;
  /** butonul 🛵: mergi la vehiculul parcat aici (si urci), sau afli unde l-ai lasat */
  toggleScooter() {
    if (this.ride) return;
    if (this.me.passenger) { this.rideOff(); return; }
    if (this.me.board) { this.rideOff(); return; }
    const owned = (['scooter', 'bike'] as const).filter(k => (this.w.stats[k] ?? 0) > 0);
    if (!owned.length) { this.hud.toast(`N-aveți încă vehicul — laptopul din casă → Vehicule (bicicletă ${PRICE.bike}, scuter ${PRICE.scooter} lei)`); return; }
    const f = this.nearVehicle(40);
    if (f) { this.goInteract(this.me, f); return; }
    const k = owned[0];
    this.hud.toast(`${k === 'bike' ? '🚲 Bicicleta' : '🛵 Scuterul'} e parcat${k === 'bike' ? 'ă' : ''} ${this.vehAt(k) === 'village' ? 'în sat, la intrare' : 'acasă, la indicatorul de lângă drum'}`);
  }

  /** tractorasul: de la poarta din spate pana in padure (si inapoi), cu partenerul AI daca e langa tine */
  tractorRide(dest: 'forest' | 'home') {
    if (this.ride) return;
    const duo = this.partnerClose(4) && this.partner.control !== 'remote';
    this.startRide('tractor', dest, duo);
  }
  // ------------------------------------------------------------------ vehiculele pe drum
  /**
   * Pornesti la drum: vehiculul merge singur pe drum (nu e GTA), cu camera dupa el, prin lumea adevarata.
   * dest: 'village' / 'home' (bicicleta, scuterul, taxiul), 'forest' / 'home' (tractorul), 'city' / 'village' (autobuzul).
   */
  startRide(kind: RideKind, dest: string, duo: boolean) {
    if (this.ride || this.travel) return;
    const me = this.me, from = { x: me.gx, y: me.gy };
    const line = kind === 'tractor' ? FOREST_TRACK : MAIN_ROAD;
    const stop = kind === 'tractor' ? (dest === 'forest' ? STOPS.forestTractor : STOPS.homeTractor)
      : kind === 'bus' ? (dest === 'city' ? STOPS.cityBus : STOPS.villageBus)
      : dest === 'village' ? STOPS.village : STOPS.home;
    const s0 = projectOn(line, from), s1 = projectOn(line, stop);
    const park = kind === 'bike' || kind === 'scooter' || kind === 'tractor' ? this.parkSpot(kind, dest) : null;
    const end = park ? { x: park.gx + park.w / 2, y: park.gy + 0.55 } : stop;
    const path = [from, ...subLine(line, s0, s1), end];
    this.stopActivity(me); me.path = []; me.board = false; me.riding = true; me.rideKind = kind; me.passenger = false;
    this.ride = { kind, path, len: polyLen(path), s: 0, v: 0, dest, duo, t: 0 };
    this.hud.closeMenus(); this.hud.setRide('riding');
    const pa = this.partner;
    if (!duo && pa.control !== 'remote' && pa.follow && this.sameArea() && Math.hypot(pa.gx - me.gx, pa.gy - me.gy) < 6) { duo = true; this.ride.duo = true; }
    if (duo && pa.control !== 'remote') { pa.passenger = true; this.stopActivity(pa); pa.path = []; pa.callBoard = false; }
    else if (duo && pa.control === 'remote') this.net.sendEvent({ t: 'cotravel', who: this.myId, to: dest, vehicle: kind });
    if (kind === 'bike' || kind === 'scooter' || kind === 'tractor') this.syncPlaced(); // vehiculul pleaca din parcare
    Sfx.play(kind === 'bus' ? 'bus_doors' : kind === 'taxi' ? 'car_door' : kind === 'bike' ? 'bike_bell' : 'car_start', { vol: 0.6, rate: kind === 'scooter' ? 1.3 : kind === 'tractor' ? 0.8 : 1 });
    if (kind === 'scooter') this.op({ k: 'stat', key: 'scooterRides', delta: 1 });
    if (kind === 'tractor' && dest === 'forest') this.log(`${me.actor.spec.name} a plecat cu tractorașul la pădure 🚜🌲`);
  }
  updateRide(dt: number) {
    const r = this.ride; if (!r) return;
    const me = this.me, vmax = RIDE_SPEED[r.kind];
    r.t += dt;
    // porneste usor, franeaza la capat
    const left = r.len - r.s;
    r.v = Math.min(vmax, r.v + vmax * dt / 1.4, Math.max(1.2, Math.sqrt(2 * (vmax / 1.6) * Math.max(0, left))));
    r.s = Math.min(r.len, r.s + r.v * dt);
    const p = pointAt(r.path, r.s);
    me.gx = p.x; me.gy = p.y; me.z = 0;
    const sd = iso(p.dx, p.dy);
    if (Math.abs(sd.x) > 0.05) me.actor.flip = sd.x > 0 ? 1 : -1;
    me.facingBack = false; me.actor.moving = r.v > 0.3;
    if (r.s >= r.len - 1e-3) this.endRide();
  }
  endRide() {
    const r = this.ride; if (!r) return;
    this.ride = null;
    const me = this.me, pa = this.partner;
    me.riding = false; me.board = false; me.actor.moving = false;
    if (r.kind === 'bike' || r.kind === 'scooter' || r.kind === 'tractor') this.op({ k: 'veh', kind: r.kind, at: r.dest });
    this.syncPlaced();
    // cobori langa vehicul (sau la statie)
    const near = FURNITURE.find(f => ['h-bike', 'v-bike', 'h-scooter', 'v-scooter', 'h-tractor', 'f-tractor', 'v-bus', 'c-bus'].includes(f.id) && Math.hypot(f.gx + f.w / 2 - me.gx, f.gy + f.d / 2 - me.gy) < 3);
    const spot = near ? this.nav.standSpot(near.gx, near.gy, near.w, near.d, me.gx, me.gy + 1) : null;
    if (spot) { me.gx = spot.x; me.gy = spot.y; } else if (this.nav.hits(me.gx, me.gy)) { me.gy += 0.8; }
    if (pa.passenger && pa.control !== 'remote') { pa.passenger = false; const q = this.nav.standSpot(Math.floor(me.gx), Math.floor(me.gy), 1, 1, me.gx + 1, me.gy); pa.gx = q?.x ?? me.gx + 0.6; pa.gy = q?.y ?? me.gy + 0.3; pa.z = 0; }
    this.hud.setRide(null);
    Sfx.play(r.kind === 'bus' ? 'bus_doors' : r.kind === 'taxi' ? 'car_door' : 'pop', { vol: 0.5 });
    this.sendCharSync();
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
    else if (a.id === 'eat' && f.type === 'table') { pawn.gx = f.w >= 2 ? (slot ? f.gx + f.w - 0.3 : f.gx + 0.3) : f.gx + 0.5; pawn.gy = f.gy - 0.25; pawn.z = 0; pawn.actor.flip = slot ? -1 : 1; pawn.facingBack = false; }
    else { // in picioare, cu fata spre obiect
      const cx = f.gx + f.w / 2, cy = f.gy + f.d / 2;
      const s = iso(cx - pawn.gx, cy - pawn.gy);
      pawn.actor.flip = s.x >= 0 ? 1 : -1; pawn.facingBack = s.y < 0;
    }
    if (a.place === 'sofa') { pawn.actor.flip = -1; pawn.facingBack = true; }
    if (a.place === 'bed' || a.place === 'tub' || a.place === 'toilet') { pawn.facingBack = false; pawn.actor.flip = 1; }
    pawn.actor.play(a.anim);
    this.snd.actStart(pawn, a.id);
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
    if (act.furn && (pawn.z > 0 || this.nav.hits(pawn.gx, pawn.gy))) {
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
    this.snd.actEnd(pawn, a.id);
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
    if (ctrl && a.id === 'chop' && this.area === 'forest') this.op({ k: 'stat', key: 'forestWood', delta: pawn.id === 'dudu' ? 3 : 2 });
    if (ctrl && a.id === 'sellwood') {
      const dayKey = 'woodSold-' + this.w.day, left = Math.max(0, PRICE.sawmillDay - (this.w.stats[dayKey] ?? 0));
      const n = Math.min(left, Math.max(0, (this.w.res?.wood ?? 0) - 5)), lei = n * PRICE.sawmill;
      if (!n && !left) this.hud.toast(`🪵 Cheresteaua a cumpărat azi destule lemne (${PRICE.sawmillDay}). Mai vino mâine!`);
      if (n) { this.op({ k: 'res', res: 'wood', delta: -n }); this.op({ k: 'money', delta: lei }); this.op({ k: 'stat', key: 'woodSold', delta: n }); this.op({ k: 'stat', key: dayKey, delta: n }); this.hud.toast(`🪵 Ai vândut ${n} lemne la cherestea: +${lei} lei (${PRICE.sawmill} lei bucata, cel mult ${PRICE.sawmillDay} pe zi)`); this.log(`${pawn.actor.spec.name} a vândut ${n} lemne: +${n * 3} lei 💰`); }
    }
    if (ctrl && (a.id === 'chop' || a.id === 'mine' || a.id === 'pick')) {
      const res = a.id === 'chop' ? 'wood' : a.id === 'mine' ? 'stone' : 'flower';
      const n = a.id === 'chop' ? (pawn.id === 'dudu' ? 3 : 2) : 2;
      this.op({ k: 'res', res, delta: n });
      const f = pawn.lastFurn; if (f) this.op({ k: 'node', id: f, until: Date.now() + (a.id === 'pick' ? 60 : a.id === 'chop' ? 240 : 150) * 1000 });
      const p = iso(pawn.gx, pawn.gy, 80); this.fx.text(p.x, p.y - 14, `+${n} ${res === 'wood' ? '🪵' : res === 'stone' ? '🪨' : '🌸'}`, '#2ec4b6', 1);
    }
    if (a.id === 'snack' || a.id === 'eat') { if (ctrl) this.op({ k: 'need', who: pawn.id, need: 'fart', delta: (a as any).fart ?? 15 }); }
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

  /** ceata verde ramasa dupa super-basina + reactia celuilalt daca e aproape */
  fogs: { x: number; y: number; t: number }[] = [];
  superFart(who: Pawn) {
    setTimeout(() => this.fogs.push({ x: who.gx, y: who.gy, t: 0 }), 780);
    const other = who === this.me ? this.partner : this.me;
    if (!this.sameArea() || Math.hypot(other.gx - who.gx, other.gy - who.gy) > 3.5) return;
    setTimeout(() => {
      if (other.activity || other.riding) return;
      other.actor.play(Math.random() < 0.5 ? 'faint' : 'dizzy');
      const q = iso(other.gx, other.gy, 110); this.fx.text(q.x, q.y, Math.random() < 0.5 ? 'Pfuuu! 🤢' : 'Aer! Aer! 😵', '#5a9a2a', 1);
    }, 1100);
  }
  fartJump() {
    if (this.ride || this.me.passenger || this.me.board) { this.hud.toast('🛣️ Ești pe drum: întâi coboară 🙂'); return; }
    const c = this.w.chars[this.myId];
    if (c.fart < 25) { this.hud.toast('💨 Nu ai destule gaze... mănâncă ceva! 🫘'); this.me.actor.play('puppy'); return; }
    this.op({ k: 'need', who: this.myId, need: 'fart', delta: -25 });
    this.op({ k: 'need', who: this.myId, need: 'fun', delta: 8 });
    if (this.me.activity) this.stopActivity(this.me);
    this.me.path = [];
    this.me.actor.play('fartjump');
    this.net.sendEvent({ t: 'emote', who: this.myId, anim: 'fartjump' });
    this.superFart(this.me);
    // salt in directia privirii, trecand peste obstacole joase
    const dir = screenDirToGrid(this.me.actor.flip * 1, this.me.facingBack ? -0.5 : 0.5);
    const start = { x: this.me.gx, y: this.me.gy };
    let tgt = { x: start.x + dir.x * 2.6, y: start.y + dir.y * 2.6 };
    if (this.nav.hits(tgt.x, tgt.y)) tgt = start;
    this.jump = { from: start, to: tgt, t: 0 };
  }
  jump: { from: { x: number; y: number }; to: { x: number; y: number }; t: number } | null = null;

  pairAction(id: string) {
    if (id === 'follow') { this.toggleFollow(); return; }
    if (this.ride || this.me.passenger) { this.hud.toast('🛣️ Ești pe drum: întâi ajungeți 🙂'); this.hud.closeMenus(); return; }
    const pr = PAIRS.find(p => p.id === id)!;
    if (pr.only && pr.only !== this.myId) return;
    if (id === 'pinch') {
      if (this.partner.activity?.a.id !== 'sleep') { this.hud.toast(`${this.partner.actor.spec.name} nu doarme acum 🙂`); return; }
      if (Math.hypot(this.me.gx - this.partner.gx, this.me.gy - this.partner.gy) > 2.5) { this.hud.toast('Apropie-te de pat 😴'); return; }
      this.hud.closeMenus(); this.startCustom('snore'); return;
    }
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
    if (id === 'ride') {
      if (!A.riding) { if (A === this.me) this.hud.toast('Întâi urcă tu pe scuter (butonul 🛵)'); }
      else if (B.control !== 'remote') { B.passenger = true; this.stopActivity(B); B.path = []; this.hud.toast(`🛵 ${B.actor.spec.name} a urcat în spate!`); }
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
  /** lumea s-a incarcat (salvarea citita): pana atunci nu salvam nimic, ca sa nu stricam progresul */
  ready = false;
  update(dt: number) {
    if (!this.ready) return;
    this.time += dt;
    if (this.minigame) { this.minigame.obj.update(dt); }
    // timp de joc: 1 secunda reala = 1 minut de joc (o zi = 24 min)
    // ceasul jocului (al nostru): o zi = dayMinutes minute reale; noaptea trece repede cand dormiti
    const dayLen = Settings.get().dayMinutes * 60;
    const speed = 1440 / dayLen; // minute de joc pe secunda reala
    this.w.gameMin ??= 8 * 60;
    const paused = this.minigame?.id === 'bedtime';
    const pawns = [this.me, this.partner];
    // AI-ul care e departe (alta harta sau alta parte a lumii) nu tine noaptea in loc
    const aiAway = (p: Pawn) => p === this.partner && p.control !== 'remote' && (!this.sameArea() || Math.hypot(p.gx - this.me.gx, p.gy - this.me.gy) > 30);
    const allAsleep = pawns.every(p => aiAway(p) || (p.activity?.a.id === 'sleep' && (p.activity.t ?? 0) >= 0));
    const mult = paused ? 0 : allAsleep ? 30 : 1;
    this.timeMult = mult;
    this.w.gameMin += dt * speed * mult;
    this.w.minutes = this.w.gameMin % 1440; this.w.day = Math.floor(this.w.gameMin / 1440) + 1;
    const hours = dt * speed * mult / 60;
    // dimineata: va treziti
    const hr = this.w.minutes / 60;
    for (const p of pawns) if (p.activity?.a.id === 'sleep' && p.control !== 'remote' && p.activity.t >= 0) {
      const nap = (this.w.chars[p.id] as any).napStart;
      const napDone = nap != null && ((this.w.gameMin ?? 0) - nap > 180 || this.w.chars[p.id].needs.energy >= 85);
      const morning = nap == null && hr >= 7 && hr < 12;
      if (napDone || morning) {
        this.stopActivity(p, true); p.actor.play('wave');
        if (p === this.me) { if (morning) { this.morningT = 3; if (this.area === 'apartment') this.op({ k: 'stat', key: 'aptNights', delta: 1 }); } else this.hud.toast('😊 Te-ai odihnit! Energie: ' + Math.round(this.w.chars[p.id].needs.energy) + '%'); }
      }
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
            if (floorAt(x, y) !== 'grass' || this.nav.isBlocked(x, y) || furnIn(x, y, x + 0.99, y + 0.99).some(f => x >= f.gx && x < f.gx + f.w && y >= f.gy && y < f.gy + f.d)) continue;
            const cur = this.w.grass?.[key] ?? 0; if (cur >= 3) continue;
            this.op({ k: 'grass', key, value: cur + 1 }); break;
          }
        }
      }
      this.checkGoals();
      Town.dailyTick(this);
      this.growPlots();
      if (this.isHost && this.partnerOnline) {
        this.netTick = (this.netTick + 1) % 6;
        // clientii tarabei: la 2 s si doar daca s-au schimbat; ceasul: la 6 s
        if (this.netTick % 2 === 0) { const L = this.npcPublic(), k = JSON.stringify(L.map(n => [n.id, n.state, Math.round(n.x * 2), n.wants])); if (k !== this.lastNpcKey) { this.lastNpcKey = k; this.net.sendEvent({ t: 'op', op: { k: 'npcs', list: L } }); } }
        if (this.netTick === 0) this.net.sendEvent({ t: 'op', op: { k: 'clock', gameMin: this.w.gameMin ?? 0 } });
      }
    }
    const inside = (p: Pawn) => (p === this.me ? this.area : this.partnerArea()) === 'home' && p.gx >= HOUSE.x0 && p.gx <= HOUSE.x1 + 1 && p.gy >= HOUSE.y0 && p.gy <= HOUSE.y1 + 1;
    // nevoi (doar pentru personajele controlate local)
    for (const p of [this.me, this.partner]) {
      if (p.control === 'remote') continue;
      const asleep = p.activity?.a.id === 'sleep';
      const cold = (0.7 + night * 1.1) * (inside(p) ? 0.6 : 1.1);
      const gain = (fuel > 0 && inside(p) ? 11 : 0) + (asleep ? 3 : 0) + (p.activity?.a.id === 'bath' ? 6 : 0);
      const ev = tickNeeds(this.w.chars[p.id], hours, asleep, gain, cold);
      // atentionari cand ti-e foame / somn (o data, pana iti revii)
      { const nd = this.w.chars[p.id].needs, wk = (this.warned[p.id] ??= {}), nm = p.actor.spec.name;
        const warn = (key: string, low: boolean, high: boolean, msg: string, bubble: string) => {
          if (low && !wk[key]) { wk[key] = true; if (p === this.me) this.hud.toast(msg); else if (this.sameArea()) { const q = iso(p.gx, p.gy, 110); this.fx.text(q.x, q.y, bubble, '#c0573e', 0.8); } }
          else if (high) wk[key] = false;
        };
        warn('hunger', nd.hunger < 30, nd.hunger > 50, `🍽️ ${nm}, ți-e foame! Mănâncă ceva (frigider, aragaz sau masa)`, 'Mi-e foame… 🍽️');
        warn('hunger2', nd.hunger < 12, nd.hunger > 30, `⚠️ ${nm} e lihnit${p.id === 'bubu' ? 'ă' : ''} de foame: merge mai încet și se poate îmbolnăvi!`, 'Lihnit' + (p.id === 'bubu' ? 'ă' : '') + '! 😩');
        warn('energy', nd.energy < 20 && !asleep, nd.energy > 40, `😴 ${nm}, ești ${p.id === 'bubu' ? 'obosită' : 'obosit'}. Seara te culci (după 20:00) sau tragi un pui de somn`, 'Mi-e somn… 😴');
        warn('hygiene', nd.hygiene < 22, nd.hygiene > 45, `🛁 ${nm}, e timpul pentru o baie!`, 'Miros a… 🙈');
      }
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
      this.snoreT = 2.6;
      const sl = [this.me, this.partner].find(p => p.activity?.a.id === 'sleep' && (p.id === 'dudu' || Math.random() < 0.4));
      this.snoring = !!sl && !(this.me.activity?.a.id === 'sleep' && this.partner.activity?.a.id === 'sleep');
      if (sl) this.snd.snore(sl);
      if (sl && this.snoring) {
        const pp = iso(sl.gx, sl.gy, sl.z + 40);
        this.fx.text(pp.x + 20, pp.y - 20, Math.random() < 0.5 ? 'HRRRR…' : 'PSHHH…', '#6a4c93', 0.7);
        if (sl !== this.me) this.shake = Math.max(this.shake, 3);
      }
    }
    if (this.travel) { this.travel.t += dt; if (!this.travel.switched && this.travel.t >= 1.5) { this.travel.switched = true; this.switchArea(this.travel.to); } if (this.travel.t >= 3.1) { this.travel = null; this.hud.setMinigame(false); } }
    // in ce regiune esti (din pozitie): banner cu numele ei cand intri, statisticile capitolelor
    if (this.space === 'world') {
      const r = regionAt(this.me.gx, this.me.gy).id;
      if (r !== this.area) { const prev = this.area; this.area = r; this.onRegion(r, prev); }
      if (this.blockKey() !== this.navKey) this.syncPlaced(); // s-a deschis poarta padurii / podul / drumul spre oras
    }
    (globalThis as any).__bridgeFixed = this.bridgeFixed(); (globalThis as any).__forestOpen = this.chapter >= 2; (globalThis as any).__cityOpen = this.chapter >= 4;
    this.updateRide(dt);
    if (this.space === 'world') updateCars(this.cars, dt, this.time, [{ x: this.me.gx, y: this.me.gy }, ...(this.sameArea() ? [{ x: this.partner.gx, y: this.partner.gy }] : []), ...this.walkers.map(v => ({ x: v.x, y: v.y }))]);
    this.updateCritters(dt);
    this.updateWalkers(dt);
    (globalThis as any).__stand = { broken: !!this.w.furn.standBroken, open: !!this.w.furn.standOpen };
    (globalThis as any).__hour = this.w.minutes / 60;
    (globalThis as any).__villageOwned = { florarie: !!this.w.stats.florarie, workshop: !!this.w.stats.workshop, apartment: !!this.w.stats.apartment };
    (globalThis as any).__trailerLogs = Math.min(6, Math.floor((this.w.res?.wood ?? 0) / 3));
    this.morningT = Math.max(0, this.morningT - dt);
    this.updateNpcs(dt);
    this.updateMe(dt);
    this.updatePartner(dt);
    for (const p of [this.me, this.partner]) this.updateActivity(p, dt);
    this.snd.update(dt);

    for (const p of [this.me, this.partner]) {
      const s = iso(p.gx, p.gy, p.z);
      p.actor.x = s.x; p.actor.y = s.y;
      p.actor.update(dt);
      // vazut din spate cand merge "in sus"
      if (p.actor.anim.id === 'walk' || p.actor.anim.id === 'idle') p.actor.pose.back = p.facingBack;
      if (p.actor.shakeReq) { this.shake = Math.max(this.shake, p.actor.shakeReq); p.actor.shakeReq = 0; }
    }
    this.fx.update(dt);
    for (const fl of this.flings) fl.t += dt; this.flings = this.flings.filter(fl => fl.t < fl.dur + 1.4);
    for (const fg of this.fogs) fg.t += dt; this.fogs = this.fogs.filter(fg => fg.t < 4);
    this.shake *= Math.pow(0.02, dt);

    // camera urmareste jucatorul; pe drum se uita putin inainte si se departeaza, ca sa vezi lumea
    const r = this.ride, look = r ? pointAt(r.path, Math.min(r.len, r.s + 2.5 + r.v * 0.4)) : null;
    const target = look ? iso(look.x, look.y, 30) : iso(this.me.gx, this.me.gy, 30);
    const ck = Math.min(1, dt * (r ? 5 : 4));
    this.cam.x += (target.x - this.cam.x) * ck;
    this.cam.y += (target.y - this.cam.y) * ck;
    this.zoomK += ((r ? 0.8 : 1) - this.zoomK) * Math.min(1, dt * 1.5);

    // retea + salvare
    this.stateT -= dt; this.syncT -= dt; this.saveT -= dt;
    if (this.stateT <= 0) {
      const st = { who: this.myId, gx: this.me.gx, gy: this.me.gy, flip: this.me.actor.flip, back: this.me.facingBack, moving: this.me.actor.moving, mood: this.me.actor.mood, ts: Date.now(), riding: !!this.me.riding, ...(this.me.riding && this.me.rideKind ? { rideKind: this.me.rideKind } : {}), passenger: !!this.me.passenger, board: !!this.me.board }; // Firebase nu accepta valori undefined
      const key = `${st.gx.toFixed(2)},${st.gy.toFixed(2)},${st.flip},${st.back},${st.moving},${st.mood},${st.riding},${st.rideKind},${st.passenger},${st.board}`;
      // cand te misti: de ~10 ori pe secunda; cand stai: doar un semn de viata la 2 s (bateria si datele mobile)
      if (key !== this.lastStateKey || Date.now() - this.lastStateAt > 2000) { this.lastStateKey = key; this.lastStateAt = Date.now(); this.net.sendState(st); }
      this.stateT = this.partnerOnline ? 0.1 : 0.5;
    }
    if (this.syncT <= 0) { this.syncT = 5; this.sendCharSync(false); }
    if (this.dirty && this.saveT > 2) this.saveT = 2; // o schimbare importanta -> salvam in 2 s
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
    if (p.passenger) {
      const d = this.partner; this.passengerGrace -= dt;
      if ((!d.riding && this.passengerGrace <= 0) || !this.sameArea()) {
        // soferul a oprit: cobori langa el
        p.passenger = false; this.hud.setRide(null);
        // langa locul unde a coborat soferul (pozitia lui adevarata, nu cea inca in miscare pe ecran)
        const T = d.control === 'remote' && d.remoteTarget ? { x: d.remoteTarget.gx, y: d.remoteTarget.gy } : { x: d.gx, y: d.gy };
        const q = this.nav.standSpot(Math.floor(T.x), Math.floor(T.y), 1, 1, T.x + 1, T.y + 0.5);
        if (q && this.sameArea()) { p.gx = q.x; p.gy = q.y; }
      } else { p.gx = d.gx; p.gy = d.gy; p.actor.flip = d.actor.flip; p.actor.moving = false; return; }
    }
    if (this.travel || this.ride) { if (!this.ride) p.actor.moving = false; return; }
    if (p.board) { p.actor.moving = false; if (p.activity) this.stopActivity(p); return; } // stai pe vehicul: nu te misti
    if (this.jump) {
      this.jump.t += dt / 3.0; // la fel de lung ca animatia super-basinii
      const q = Math.min(1, Math.max(0, (this.jump.t - 0.26) / 0.46));
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
        this.joyRun = l > 62;
      }
    }
    if (ix || iy) {
      if (p.activity) this.stopActivity(p);
      if (p.actor.busy && p.actor.anim.kind !== 'base') p.actor.stop();
      p.path = []; p.pendingInteract = null;
      const mag = Math.min(1, Math.hypot(ix, iy));
      const g = screenDirToGrid(ix, iy * 2); // compensare izometrica: "sus" pe ecran
      const run = !p.riding && (k.has('shift') || this.joyRun) && this.w.chars[p.id].needs.energy > 8;
      p.actor.running = run;
      if (run) this.w.chars[p.id].needs.energy = Math.max(0, this.w.chars[p.id].needs.energy - dt * 0.06); // fuga oboseste putin
      const nd = this.w.chars[p.id].needs; const weak = (nd.hunger < 15 ? 0.82 : 1) * (nd.energy < 12 ? 0.8 : 1);
      const sp = SPEED * mag * weak * (run ? 1.75 : 1) * (this.w.chars[p.id].sick ? 0.6 : 1) * (p.riding ? (p.rideKind === 'bike' ? 1.6 : 2.2) : 1);
      this.moveBy(p, g.x * sp, g.y * sp, dt);
      p.actor.moving = true;
    } else {
      p.actor.moving = this.followPath(p, dt);
    }
  }

  updatePartner(dt: number) {
    const p = this.partner;
    if (p.passenger && p.control !== 'remote') { if (!this.me.riding) p.passenger = false; else { p.gx = this.me.gx; p.gy = this.me.gy; p.actor.flip = this.me.actor.flip; p.actor.moving = false; return; } }
    if (!this.sameArea()) { p.actor.moving = false; p.path = []; return; }
    if (p.control === 'remote') {
      if (p.remoteTarget && !p.activity) {
        const T = p.remoteTarget; T.age = (T.age ?? 0) + dt;
        if (T.age < 0.35 && (T.vx || T.vy)) { T.gx += (T.vx ?? 0) * dt; T.gy += (T.vy ?? 0) * dt; } // extrapolare scurta
        const dx = T.gx - p.gx, dy = T.gy - p.gy, d = Math.hypot(dx, dy);
        if (d > 4) { p.gx = T.gx; p.gy = T.gy; }
        else { const k = Math.min(1, dt * 8); p.gx += dx * k; p.gy += dy * k; }
      }
      return;
    }
    // chemat sa urce in spate pe bicicleta / scuter
    if (p.callBoard) {
      if (!this.me.board) p.callBoard = false;
      else {
        const d = Math.hypot(p.gx - this.me.gx, p.gy - this.me.gy);
        if (d < 1.0) { p.callBoard = false; p.path = []; p.passenger = true; p.actor.moving = false; Sfx.play('pop'); this.hud.toast(`💕 ${p.actor.spec.name} a urcat în spate!`); this.me.actor.play('love'); return; }
        if (p.activity) this.stopActivity(p);
        if (!p.path.length) { const q = this.nav.path(p.gx, p.gy, this.me.gx + 0.3, this.me.gy + 0.5) ?? this.nav.path(p.gx, p.gy, this.me.gx - 0.5, this.me.gy); if (q && q.length) p.path = q; else { p.gx = this.me.gx + 0.4; p.gy = this.me.gy + 0.4; } }
        if (this.followPath(p, dt)) { p.actor.moving = true; return; }
        return;
      }
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
    // AI-ul cauta lucruri doar in jurul lui (lumea e mare: nu traverseaza harta dupa un copac)
    const around = (pred: (f: Furn) => boolean) => furnIn(p.gx - 26, p.gy - 26, p.gx + 26, p.gy + 26).filter(f => f.action && pred(f)).sort((a, b) => Math.hypot(a.gx - p.gx, a.gy - p.gy) - Math.hypot(b.gx - p.gx, b.gy - p.gy))[0];
    const pick = (ids: string[]) => around(f => ids.includes(f.action!.id));
    let target: Furn | undefined;
    // supravietuire: focul, lemnele, mancarea, iarba
    const R = this.w.res ?? {}; const fuel = (this.w.furn.fire as number) ?? 0;
    const tree = () => around(f => f.action!.id === 'chop' && !this.depleted(f.id));
    const aiHome = regionAt(p.gx, p.gy).id === 'home' && this.space === 'world';
    if (p.follow) { this.aiFollow(p); return; }
    // ramas departe (in sat, la padure, la oras) cand tu esti acasa: se intoarce si el acasa, pe drum
    if (this.aiTrekHome(p)) return;
    if (fuel < 30 && (R.wood ?? 0) >= 1 && aiHome) target = FURNITURE.find(f => f.id === 'fireplace');
    else if ((R.wood ?? 0) < 3 && Math.random() < 0.6) target = tree();
    else if (c.needs.hunger < 50 && dishCount(R) > 0) target = pick(['eat']);
    else if (c.needs.hunger < 55 && RECIPES.some(rc => canCook(R, rc)) && aiHome) target = pick(['cook']);
    else if (c.needs.hunger < 50 && catCount(R, 'veg') > 0) target = pick(['snack']);
    else if (Math.random() < 0.5) {
      const now = this.w.gameMin ?? 0;
      const plots = (aiHome ? FURNITURE.filter(f => f.type === 'soilplot') : []).filter(f => { const p = this.w.plots?.[f.id.slice(5)]; if (!p) return false; const st = plotStage(p); return st === 3 || (st >= 0 && p.wetUntil <= now && (R.water ?? 0) > 0) || (st < 0 && Object.keys(CROPS).some(cc => (R[seedKey(cc)] ?? 0) > 0)); });
      if (plots.length) target = plots[0];
      else if ((R.water ?? 0) < 2 && aiHome && Object.values(this.w.plots ?? {}).some(p => p.crop)) target = FURNITURE.find(f => f.id === 'well');
    }
    else if (p.id === 'dudu' && aiHome && Object.keys(this.w.grass ?? {}).length > 10 && Math.random() < 0.5) target = pick(['mow']);
    if (target) { this.goInteract(p, target); return; }
    if (low[1] < 55) {
      if (low[0] === 'hunger') target = pick(['snack', 'eat']);
      else if (low[0] === 'energy') target = pick(['sleep']);
      else if (low[0] === 'hygiene') target = pick(['bath', 'teeth']);
      else if (low[0] === 'fun') target = pick(Math.random() < 0.5 ? ['tv'] : ['read', 'garden']);
      else if (low[0] === 'love' && Math.hypot(this.me.gx - p.gx, this.me.gy - p.gy) < 24) { // vine dupa tine pentru o imbratisare
        const sp = this.nav.standSpot(Math.floor(this.me.gx), Math.floor(this.me.gy), 1, 1, p.gx, p.gy);
        if (sp) { const path = this.nav.path(p.gx, p.gy, sp.x, sp.y); if (path) { p.path = path; p.aiT = 6; } }
        if (this.nearPartnerAI()) { this.runPair(p.id, Math.random() < 0.5 ? 'hug' : 'kiss', true); }
        return;
      }
    }
    if (!target && Math.random() < 0.15 && this.w.chars[p.id].needs.hygiene > 30) target = pick(['toilet']);
    if (!target && Math.random() < 0.25 && this.chapter > 0) { const opts = furnIn(p.gx - 14, p.gy - 14, p.gx + 14, p.gy + 14).filter(f => f.action && ['chop', 'mine', 'pick'].includes(f.action.id) && !this.depleted(f.id)); if (opts.length) target = opts[Math.floor(Math.random() * opts.length)]; }
    if (!target && p.id === 'dudu' && Math.random() < 0.08 && this.nearPartnerAI()) { this.runPair(p.id, 'steal', true); return; }
    if (target) { this.goInteract(p, target); return; }
    // altfel: plimbare sau un emote
    const r = Math.random();
    if (r < 0.35) {
      const list = ANIM_LIST.filter(a => (a.kind === 'emote' || a.kind === 'dance' || (a.kind === 'special' && a.who === p.id)) && !['fartjump'].includes(a.id));
      p.actor.play(list[Math.floor(Math.random() * list.length)].id);
    } else {
      // plimbare: acasa prin curte si pe langa ea, altundeva in jurul locului unde e
      for (let i = 0; i < 10; i++) {
        const tx = aiHome ? 1 + Math.random() * (MAP_W - 2) : p.gx + (Math.random() - 0.5) * 14, ty = aiHome ? 1 + Math.random() * (MAP_H - 2) : p.gy + (Math.random() - 0.5) * 14;
        if (!this.nav.hits(tx, ty)) { const path = this.nav.path(p.gx, p.gy, tx, ty, 3000); if (path) { p.path = path; break; } }
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
        for (let i = 0; i < 14; i++) { const tx = p.gx + (Math.random() - 0.5) * 18, ty = p.gy + (Math.random() - 0.5) * 18; if (this.nav.hits(tx, ty)) continue; const d = Math.hypot(tx - this.me.gx, ty - this.me.gy); if (d > bd) { bd = d; best = { x: tx, y: ty }; } }
        if (best) { const path = this.nav.path(p.gx, p.gy, best.x, best.y); if (path) p.path = path; }
      }
      p.actor.moving = this.followPath(p, dt * 0.85);
      if (Math.random() < dt * 0.6) { const pp = iso(p.gx, p.gy, 80); this.fx.text(pp.x, pp.y, 'Hihi! 🍰', '#c77dff', 0.6); }
      return;
    }
  }
  aiAwayT = 0;
  aiTrekHome(p: Pawn) {
    const mine = regionAt(this.me.gx, this.me.gy).id, his = regionAt(p.gx, p.gy).id;
    if (this.space !== 'world' || this.partnerSpace() !== 'world' || mine !== 'home' || his === 'home' || Math.hypot(this.me.gx - p.gx, this.me.gy - p.gy) < 40) { this.aiAwayT = 0; return false; }
    this.aiAwayT += 5; // AI-ul se gandeste cam la 5 s
    if (this.aiAwayT < 30) return false;
    this.aiAwayT = 0;
    // pana la drum, pe drum pana la poarta casei, apoi in curte
    const onTrack = his === 'forest';
    const line = onTrack ? FOREST_TRACK : MAIN_ROAD, s0 = projectOn(line, { x: p.gx, y: p.gy }), entry = pointAt(line, s0);
    const toRoad = this.nav.path(p.gx, p.gy, entry.x, entry.y + (onTrack ? 0 : 0.3), 8000);
    if (!toRoad) return false;
    const road = subLine(line, s0, projectOn(line, onTrack ? STOPS.homeTractor : STOPS.home));
    const last = road[road.length - 1];
    const inYard = this.nav.path(last.x, last.y, 6.5, 13.5, 4000) ?? [];
    p.path = [...toRoad, ...road.map(q => ({ x: q.x, y: q.y + (onTrack ? 0.6 : 0.25) })), ...inYard];
    p.aiT = 12;
    return true;
  }
  /** AI-ul te insoteste ("Vino cu mine"): merge dupa tine, la cativa pasi */
  aiFollow(p: Pawn) {
    p.aiT = 0.7;
    const d = Math.hypot(this.me.gx - p.gx, this.me.gy - p.gy);
    if (d > 40) { p.follow = false; return; }
    if (d < 2.2) return;
    const side = p.id === 'bubu' ? -1 : 1;
    for (const [ox, oy] of [[0.9 * side, 0.6], [-0.9 * side, 0.6], [0.8, -0.8], [0, 1.2]]) {
      const tx = this.me.gx + ox, ty = this.me.gy + oy;
      if (this.nav.hits(tx, ty)) continue;
      const path = this.nav.path(p.gx, p.gy, tx, ty, 6000); if (path) { p.path = path; return; }
    }
  }
  toggleFollow() {
    const p = this.partner;
    if (p.control === 'remote') return;
    p.follow = !p.follow; p.path = [];
    if (p.follow) { this.stopActivity(p); p.aiT = 0; this.hud.toast(`💞 ${p.actor.spec.name} vine cu tine`); p.actor.play('love'); }
    else this.hud.toast(`🙂 ${p.actor.spec.name} rămâne aici`);
    this.hud.closeMenus();
  }
  nearPartnerAI() { return Math.hypot(this.me.gx - this.partner.gx, this.me.gy - this.partner.gy) < 1.3; }

  updateActivity(p: Pawn, dt: number) {
    if (!p.activity) return;
    p.activity.t += dt;
    if (p.activity.a.place === 'ride' && p.activity.furn) {
      const f = p.activity.furn, a = p.activity.t * 1.5 + (p === this.me ? 0 : Math.PI), cx = f.gx + f.w / 2, cy = f.gy + f.d / 2;
      p.gx = cx + Math.cos(a) * 0.72; p.gy = cy + Math.sin(a) * 0.72; p.z = 16 + Math.sin(p.activity.t * 3.2) * 6;
      const tg = iso(-Math.sin(a), Math.cos(a)); p.actor.flip = tg.x >= 0 ? 1 : -1; p.facingBack = tg.y < 0;
      if (Math.floor(p.activity.t * 2) !== Math.floor((p.activity.t - dt) * 2) && Math.random() < 0.25) { const q = iso(p.gx, p.gy, p.z + 70); this.fx.emit('note', q.x, q.y, { vy: -30, max: 1 }); }
    }
    if (p.control === 'remote') return;
    if (p.activity.t >= p.activity.a.dur) this.stopActivity(p, true);
  }

  // ------------------------------------------------------------------ desen
  draw(ctx: CanvasRenderingContext2D) {
    if (!this.ready) { const { w, h } = this.game; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#c09a62'; ctx.font = '700 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Se încarcă salvarea…', w / 2, h / 2); return; }
    const { w, h } = this.game;
    const night = nightAmount(this.w.minutes);
    const apt = this.space === 'apartment';
    if (apt) {
      // apartamentul = vedere de la etaj: cerul orasului cu blocuri in departare
      const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, night > 0.5 ? '#1d2550' : '#9fd3f5'); bg.addColorStop(1, night > 0.5 ? '#4a3f75' : '#e8f4ff'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { const bw = 40 + ((i * 17) % 40), bx = i * (w / 22) - 30, bh = h * (0.2 + ((i * 37) % 50) / 100); ctx.fillStyle = night > 0.5 ? '#2f3a60' : ['#c9d8ee', '#b8c8e6', '#d6e2f2'][i % 3]; ctx.fillRect(bx, h - bh, bw, bh); ctx.fillStyle = night > 0.5 ? '#ffe68088' : '#ffffff88'; for (let yy = h - bh + 10; yy < h - 10; yy += 16) for (let xx = bx + 6; xx < bx + bw - 8; xx += 12) if (((xx * 3 + yy) | 0) % 5) ctx.fillRect(xx, yy, 5, 7); }
    } else {
      if (this.chapter === 0) { const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, night > 0.5 ? '#2b3a67' : '#ffd6e4'); bg.addColorStop(1, night > 0.5 ? '#4a3f75' : '#ffeacc'); ctx.fillStyle = bg; }
      else ctx.fillStyle = night > 0.5 ? '#1f2540' : '#8fc98a';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (this.shake > 0.3) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    const Z = this.effZoom;
    ctx.scale(Z, Z);
    ctx.translate(-this.cam.x, -this.cam.y);
    // ce se vede (pixeli de lume) si dalele din jur
    const vx0 = this.cam.x - w / 2 / Z, vx1 = this.cam.x + w / 2 / Z, vy0 = this.cam.y - h / 2 / Z, vy1 = this.cam.y + h / 2 / Z;
    const cs = [unIso(vx0, vy0), unIso(vx1, vy0), unIso(vx0, vy1), unIso(vx1, vy1)];
    const gx0 = Math.min(...cs.map(c => c.x)) - 2, gx1 = Math.max(...cs.map(c => c.x)) + 10, gy0 = Math.min(...cs.map(c => c.y)) - 2, gy1 = Math.max(...cs.map(c => c.y)) + 10;
    const seen = (x: number, y: number, m = 140) => { const q = iso(x, y); return q.x > vx0 - m && q.x < vx1 + m && q.y > vy0 - m && q.y < vy1 + m * 2.2; };
    const visible = furnIn(gx0, gy0, gx1, gy1).filter(f => onScreen(f, vx0, vy0, vx1, vy1));

    // podeaua (pe bucati)
    const home = this.space === 'world';
    const ch0 = this.chapter === 0 && home;
    if (ch0) {
      // Capitolul 0: doar casa, ca o casuta de papusi pe un soclu cu iarba (curtea nu se vede)
      const c = iso(8, 7.2); ctx.fillStyle = 'rgba(120,80,100,0.14)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 70, 470, 150, 0, 0, 7); ctx.fill();
      isoBox(ctx, 1.75, 1.75, 12.5, 10.75, 16, { top: '#a6dc93', left: '#b98a5e', right: '#a07450' }, -16);
      ctx.save(); const A = iso(2, 2), B = iso(14, 2), C = iso(14, 12), D = iso(2, 12);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.lineTo(D.x, D.y); ctx.closePath(); ctx.clip();
      this.floorChunks.draw(ctx, vx0, vy0, vx1, vy1); ctx.restore();
    } else { if (apt) drawAptBuilding(ctx, night); this.floorChunks.draw(ctx, vx0, vy0, vx1, vy1); }
    const inHouse = (x0: number, y0: number, x1: number, y1: number) => !ch0 || (x0 >= 2 && y0 >= 2 && x1 <= 14.2 && y1 <= 12.3);

    const dep: Record<string, boolean> = {}; for (const id in this.w.nodes ?? {}) if (this.depleted(id)) dep[id] = true;
    const st: FurnState = { ...(this.w.furn as FurnState), night, depleted: dep };
    // obiectele care nu se misca: din imaginea lor (desenata o data); restul, desenate viu
    const SS = Math.max(1, Math.min(2, this.game.dpr * this.cam.zoom)), lit = night > 0.4, bf = this.bridgeFixed();
    const paint = (f: Furn) => {
      if (!cacheable(f)) { drawFurn(ctx, f, this.time, st); return; }
      const t = f.type as string;
      const key = f.id + (dep[f.id] ? '|d' : '') + ((t === 'farmhouse' || t === 'church' || t === 'cbuilding') && lit ? '|n' : '') + (t === 'bridgerail' || t === 'bridgegap' ? (bf ? '|f' : '|b') : '');
      if (layered(f)) {
        // corpul cladirii din imagine (depinde de ora: deschis / inchis, de noapte, de ce ati cumparat), apoi ce se misca
        const own = (globalThis as any).__villageOwned ?? {};
        const k2 = key + (isOpen(f.id, this.w.minutes / 60) ? '' : '|c') + (own.florarie ? 'F' : '') + (own.workshop ? 'W' : '') + (own.apartment ? 'A' : '');
        const g = globalThis as any;
        g.__layer = 'body'; try { this.sprites.draw(ctx, f, k2, SS, c => drawFurn(c, f, 0, st)); } finally { g.__layer = 'live'; }
        try { drawFurn(ctx, f, this.time, st); } finally { g.__layer = ''; }
        return;
      }
      this.sprites.draw(ctx, f, key, SS, c => drawFurn(c, f, 0, st));
      if (t === 'farmhouse') houseSmoke(ctx, f, this.time);
    };
    // decoruri pe sol
    for (const f of visible) if (this.isDecor(f) && inHouse(f.gx, f.gy, f.gx + f.w, f.gy + f.d)) { try { paint(f); } catch (e) { ErrorLog.add(e, 'desen decor'); } }
    if (!ch0 && home) for (const [k, p] of Object.entries(this.w.plots ?? {})) { const [x, y] = k.split(',').map(Number); if (seen(x, y)) drawPlotSoil(ctx, x, y, p as Plot, this.w.gameMin ?? 0, this.time); }
    if (!ch0 && home) for (const k in this.w.grass ?? {}) { const [x, y] = k.split(',').map(Number); if (seen(x, y)) drawTallGrass(ctx, x, y, this.w.grass![k], this.time); }
    if (this.build?.item) drawGhost(ctx, this.build.item, this.build.gx, this.build.gy, this.canPlace(this.build.item, this.build.gx, this.build.gy) && this.canAfford(this.build.item), this.time);
    // indicator obiect apropiat
    const near = this.ride ? null : this.nearestFurn(this.me);
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

    // gardul curtii: laturile din spate (cu poarta spre padure)
    if (!ch0 && home) { for (let x = 0; x < MAP_W; x++) if (x !== BACK_GATE) drawYardFence(ctx, x, 0, 'x'); for (let y = 0; y < YARD_H; y++) drawYardFence(ctx, 0, y, 'y'); }
    // pereti din spate
    if (ch0) for (const [dx, dy] of [[5.5, 12.05], [14.05, 9.5]]) { const p = iso(dx, dy, 22); this.drawLock(ctx, p.x, p.y); }
    for (const wl of WALLS) if (wl.kind === 'back') drawWall(ctx, wl, this.time, night);

    // sortare in adancime
    type D = { x0: number; y0: number; x1: number; y1: number; draw: () => void; z?: number };
    const items: D[] = [];
    const onBike = (this.me.riding && this.me.rideKind === 'bike') || (this.sameArea() && this.partner.riding && this.partner.rideKind === 'bike');
    const onScoot = (this.me.riding && this.me.rideKind === 'scooter') || (this.sameArea() && this.partner.riding && this.partner.rideKind === 'scooter');
    const onTractor = (this.me.riding && this.me.rideKind === 'tractor') || (this.sameArea() && this.partner.riding && this.partner.rideKind === 'tractor');
    for (const f of visible) if (!this.isDecor(f)) {
      if ((onBike && (f.id === 'h-bike' || f.id === 'v-bike')) || (onScoot && (f.id === 'h-scooter' || f.id === 'v-scooter')) || (onTractor && (f.id === 'h-tractor' || f.id === 'f-tractor'))) continue;
      items.push({ x0: f.gx, y0: f.gy, x1: f.gx + f.w, y1: f.gy + f.d, draw: () => paint(f) });
    }
    for (const wl of WALLS) if (wl.kind !== 'back') {
      const r = wl.dir === 'x' ? { x0: wl.x, y0: wl.y - 0.05, x1: wl.x + 1, y1: wl.y } : { x0: wl.x - 0.05, y0: wl.y, x1: wl.x, y1: wl.y + 1 };
      items.push({ ...r, draw: () => drawWall(ctx, wl as Wall, this.time, night) });
    }
    if (home && seen(10, 22, 400)) for (let x = 0; x < MAP_W; x++) {
      if (x === YARD_GATE) items.push({ x0: x, y0: YARD_H - 0.02, x1: x + 1, y1: YARD_H, draw: () => drawYardGate(ctx, YARD_GATE, YARD_H) });
      else items.push({ x0: x, y0: YARD_H - 0.02, x1: x + 1, y1: YARD_H, draw: () => drawYardFence(ctx, x, YARD_H, 'x') });
    }
    if (home && !ch0) items.push({ x0: BACK_GATE, y0: -0.02, x1: BACK_GATE + 1, y1: 0, draw: () => this.drawBackGate(ctx) });
    if (home) for (const [k, p] of Object.entries(this.w.plots ?? {})) { if (!p.crop) continue; const [x, y] = k.split(',').map(Number); if (!seen(x, y)) continue; items.push({ x0: x + 0.3, y0: y + 0.3, x1: x + 0.7, y1: y + 0.7, draw: () => drawCropPlant(ctx, x, y, p as Plot, this.w.gameMin ?? 0, this.time) }); }
    if (home) for (const car of this.cars) { const cp = carPos(car); if (!seen(cp.x, cp.y)) continue; items.push({ x0: cp.x - 0.5, y0: cp.y - 0.3, x1: cp.x + 0.5, y1: cp.y + 0.3, draw: () => drawCar(ctx, car, this.time) }); }
    if (home) for (const v of this.walkers) { if (!seen(v.x, v.y)) continue; items.push({ x0: v.x - 0.2, y0: v.y - 0.2, x1: v.x + 0.2, y1: v.y + 0.2, draw: () => {
      v.a.draw(ctx);
      // numele sateanului (cand esti aproape) + inimioare de prietenie
      if (v.name && Math.hypot(v.x - this.me.gx, v.y - this.me.gy) < 5) {
        const q = iso(v.x, v.y); const fr = Math.min(5, Math.floor((this.w.stats['friend-' + v.vid] ?? 0) / 2));
        ctx.font = '800 10.5px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#7a3a5a';
        const lb = v.name + (fr ? ' ' + '💗'.repeat(fr) : ''); ctx.strokeText(lb, q.x, q.y + 14); ctx.fillText(lb, q.x, q.y + 14);
        const hasQ = (this.w.town?.quests as any[] | undefined)?.some(x => x.who === v.vid && !x.done && x.day === this.w.day);
        if (hasQ) { const by = q.y - 92 * ACTOR_SCALE * 0.92 - 18 + Math.sin(this.time * 4) * 2; ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#4a2a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, by, 9, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#4a2a22'; ctx.font = '900 13px "Baloo 2", sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText('!', q.x, by + 1); ctx.textBaseline = 'alphabetic'; }
      }
    } }); }
    if (home) for (const c of this.critters) { if (!seen(c.x, c.y)) continue; items.push({ x0: c.x - 0.2, y0: c.y - 0.2, x1: c.x + 0.2, y1: c.y + 0.2, draw: () => { const q = iso(c.x, c.y); drawCritter(ctx, c, q.x, q.y, this.time); } }); }
    if (home) for (const n of this.npcs) { if (!seen(n.x, n.y)) continue; items.push({ x0: n.x - 0.2, y0: n.y - 0.2, x1: n.x + 0.2, y1: n.y + 0.2, draw: () => this.drawNpc(ctx, n) }); }
    for (const p of [this.me, this.partner]) {
      if (p === this.partner && !this.sameArea()) continue;
      if (!seen(p.gx, p.gy, 260)) continue;
      // la masa: farfuria cu mancarea aleasa, pe masa, in fata personajului (se goleste pe masura ce mananca)
      if (p.activity?.a.id === 'eat' && p.activity.furn?.type === 'table') { const f = p.activity.furn, act = p.activity; items.push({ x0: f.gx, y0: f.gy, x1: f.gx + f.w, y1: f.gy + f.d + 0.002, draw: () => this.drawPlate(ctx, p.gx, f.gy + 0.36, act) }); }
      const inside = p.activity?.a.place;
      if ((inside === 'bed' || inside === 'tub' || inside === 'toilet' || inside === 'sofa' || inside === 'ride') && p.activity!.furn) {
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
    for (const it of items) if (inHouse(it.x0, it.y0, it.x1, it.y1)) { ctx.save(); try { it.draw(); } catch (e) { ErrorLog.add(e, 'desen obiect'); } ctx.restore(); }
    for (const fg of this.fogs) {
      const k = fg.t / 4, q = iso(fg.x, fg.y, 20 + k * 30);
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + fg.t * 0.3, r = 30 + k * 110 + (i % 3) * 14; ctx.fillStyle = `rgba(160,210,90,${0.32 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(q.x + Math.cos(a) * r * 0.55, q.y + Math.sin(a) * r * 0.22 - i * 3, r * 0.5, r * 0.28, 0, 0, 7); ctx.fill(); }
    }
    // moneda aruncata: arc deasupra, apoi stropi si cercuri pe apa
    for (const fl of this.flings) {
      const k = Math.min(1, fl.t / fl.dur), gx = fl.x0 + (fl.x1 - fl.x0) * k, gy = fl.y0 + (fl.y1 - fl.y0) * k;
      if (k < 1) { const q = iso(gx, gy, 50 + (fl.z1 - 50) * k + Math.sin(k * Math.PI) * 70); ctx.save(); ctx.translate(q.x, q.y); ctx.scale(Math.cos(fl.t * 18), 1); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#a07a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
      else {
        const r = fl.t - fl.dur, q = iso(fl.x1, fl.y1, fl.z1);
        if (r < 0.05) { this.fx.burst('drop', q.x, q.y, 8, 2.4, 90, { grav: 300, max: 0.5, color: '#bde7ff' }); this.fx.hearts(q.x, q.y - 20, 2); }
        for (let i = 0; i < 3; i++) { const rr = r - i * 0.25; if (rr <= 0) continue; ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.8 - rr * 0.7)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(q.x, q.y, 6 + rr * 26, 3 + rr * 13, 0, 0, 7); ctx.stroke(); }
      }
    }

    // gardul curtii: laturile din fata
    if (!ch0 && home) for (let y = 0; y < YARD_H; y++) drawYardFence(ctx, MAP_W, y, 'y');

    this.fx.draw(ctx);
    this.sprites.endFrame();

    // noaptea
    ctx.restore();
    if (night > 0) {
      ctx.fillStyle = `rgba(25,25,70,${0.42 * night})`; ctx.fillRect(0, 0, w, h);
      if (this.w.furn.lampOn) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.translate(w / 2, h / 2); ctx.scale(this.effZoom, this.effZoom); ctx.translate(-this.cam.x, -this.cam.y);
        const p = this.space === 'apartment' ? iso(6.5, 3.5, 40) : iso(5.5, 2.5, 40);
        const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 160); g.addColorStop(0, `rgba(255,200,120,${0.35 * night})`); g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 160, 0, 7); ctx.fill();
        ctx.restore();
      }
    }
    // frig: chenar inghetat cand iti e frig
    const wm = this.w.chars[this.myId].needs.warmth ?? 60;
    if (wm < 30) { const k = (30 - wm) / 30; const gr = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7); gr.addColorStop(0, 'rgba(180,220,255,0)'); gr.addColorStop(1, `rgba(200,235,255,${0.55 * k})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); }
    // joystick
    // indiciu pentru joystick (doar pe ecrane tactile)
    if (!this.joy.active && !this.minigame && !this.travel && matchMedia('(pointer: coarse)').matches) {
      const jx = Math.min(130, w * 0.16), jy = h - Math.min(120, h * 0.24);
      ctx.globalAlpha = 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(jx, jy, 46, 0, 7); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(jx, jy, 20, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (this.joy.active) {
      ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.joy.sx, this.joy.sy, 50, 0, 7); ctx.stroke();
      const jx = this.joy.x - this.joy.sx, jy = this.joy.y - this.joy.sy, l = Math.hypot(jx, jy), k = l > 50 ? 50 / l : 1;
      ctx.fillStyle = '#ff7aa2cc'; ctx.beginPath(); ctx.arc(this.joy.sx + jx * k, this.joy.sy + jy * k, 22, 0, 7); ctx.fill();
    }
    // somnul: ecran intunecat, ceasul si cat mai e pana dimineata
    if (this.me.activity?.a.id === 'sleep' && this.me.activity.t >= 0 && !this.minigame) this.drawSleepOverlay(ctx, w, h);
    if (this.morningT > 0) {
      const k = Math.min(1, this.morningT / 0.6);
      ctx.save(); ctx.globalAlpha = Math.min(1, k); const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,214,165,0.85)'); g.addColorStop(1, 'rgba(255,241,214,0.0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.font = '900 38px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#e07a2f';
      ctx.strokeText('Bună dimineața!', w / 2, h * 0.3); ctx.fillText('Bună dimineața!', w / 2, h * 0.3);
      ctx.font = '800 20px "Baloo 2", sans-serif'; ctx.fillStyle = '#7a5a4a'; ctx.strokeText(`Ziua ${this.w.day} · ${clockText(this.w.minutes)}`, w / 2, h * 0.3 + 36); ctx.fillText(`Ziua ${this.w.day} · ${clockText(this.w.minutes)}`, w / 2, h * 0.3 + 36);
      ctx.restore();
    }
    if (this.minigame) {
      // minijocurile sunt gandite pentru minim ~460 px inaltime: pe ecrane scunde (telefon pe lat) le scalam proportional
      const k = this.miniScale();
      ctx.save(); ctx.scale(k, k); this.minigame.obj.draw(ctx, w / k, h / k); ctx.restore();
    }
    if (this.travel) this.drawTravel(ctx, w, h);
  }

  drawSleepOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(20,18,50,0.45)'; ctx.fillRect(0, 0, w, h);
    const nap = (this.w.chars[this.myId] as any).napStart != null;
    const fast = this.timeMult > 1;
    const left = nap ? Math.max(0, 180 - ((this.w.gameMin ?? 0) - (this.w.chars[this.myId] as any).napStart)) : ((7 * 60 - this.w.minutes) + 1440) % 1440;
    const cx = w / 2, cy = h * 0.2;
    ctx.fillStyle = '#fff8ef'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(cx - 170, cy - 46, 340, 112, 22); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#3a2a22';
    ctx.font = '900 30px "Baloo 2", sans-serif'; ctx.fillText(`${clockText(this.w.minutes)}${fast ? '  ⏩' : ''}`, cx, cy - 8);
    ctx.font = '800 15px "Baloo 2", sans-serif';
    ctx.fillText(nap ? `Pui de somn · energie ${Math.round(this.w.chars[this.myId].needs.energy)}%` : `Dormiți… vă treziți la 07:00 (mai sunt ${Math.floor(left / 60)}h ${Math.round(left % 60)}m)`, cx, cy + 20);
    ctx.font = '700 13px "Baloo 2", sans-serif'; ctx.fillStyle = '#7a5a4a';
    const pa = this.partner.actor.spec.name;
    ctx.fillText(fast ? 'Noaptea trece repede pentru că dormiți amândoi 💤' : this.partner.activity?.a.id === 'sleep' ? '' : `Timpul trece normal până se culcă și ${pa}`, cx, cy + 44);
    ctx.restore();
  }
  /** poarta din spatele curtii (spre padure), mereu deschisa */
  drawBackGate(ctx: CanvasRenderingContext2D) { drawYardGate(ctx, BACK_GATE, 0); }
  drawLock(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save(); ctx.translate(x, y + Math.sin(this.time * 2) * 2);
    ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -8, 6, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.roundRect(-9, -8, 18, 14, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(0, -2, 2, 0, 7); ctx.fill();
    ctx.restore();
  }
  /** farfuria de la masa: mancarea aleasa (iconita ei), aburi la cele calde, se termina pe masura ce mananci */
  drawPlate(ctx: CanvasRenderingContext2D, gx: number, gy: number, act: { a: Activity; t: number }) {
    const c = iso(gx, gy, 27.5), left = Math.max(0, 1 - act.t / Math.max(1, act.a.dur));
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#4a2a22'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(c.x, c.y, 15, 7, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#e8d8cc'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 10, 4.5, 0, 0, 7); ctx.stroke();
    const key: string = (act.a as any).dish ?? 'meals';
    const icon = RECIPE[key.replace(/^dish_/, '')]?.icon ?? READY_MEAL.icon;
    if (left > 0.05) { const ic = iconCanvas(icon, 64); if (ic) { const sz = 22 * (0.45 + 0.55 * left); ctx.drawImage(ic, c.x - sz / 2, c.y - sz * 0.8, sz, sz); } }
    if (['🍲', '🥣', '🍵', '🫓', '🥘', '🍠'].includes(icon) && left > 0.2) for (let i = 0; i < 2; i++) { const k = (this.time * 0.8 + i * 0.5) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x - 4 + i * 8, c.y - 12 - k * 14); ctx.quadraticCurveTo(c.x + i * 8, c.y - 18 - k * 14, c.x - 4 + i * 8, c.y - 24 - k * 14); ctx.stroke(); }
    // furculita
    ctx.strokeStyle = '#9aa4ad'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x + 17, c.y - 2); ctx.lineTo(c.x + 22, c.y + 4); ctx.stroke();
  }
  drawPawn(ctx: CanvasRenderingContext2D, p: Pawn) {
    if (p.passenger && this.sameArea()) return; // il deseneaza soferul
    if (p.riding) {
      const s = iso(p.gx, p.gy, 0); const other = p === this.me ? this.partner : this.me;
      ctx.save(); ctx.translate(s.x, s.y + 2); ctx.scale(p.actor.flip, 1);
      const bump = p.actor.moving ? Math.abs(Math.sin(this.time * 14)) * -1.2 : 0;
      const opt = { rot: p.actor.moving ? this.time * 18 : 0, bump, driver: p.actor.spec, passenger: other.passenger && this.sameArea() ? other.actor.spec : undefined };
      // praful din spatele rotilor cand merge repede pe drum
      if (p.actor.moving && p.rideKind !== 'bike') for (let i = 0; i < 4; i++) { const q = (this.time * 1.6 + i / 4) % 1; ctx.globalAlpha = 0.35 * (1 - q); ctx.fillStyle = '#e6d3b0'; ctx.beginPath(); ctx.arc(-30 - q * 60, 2 - q * 10, 4 + q * 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      if (p.rideKind === 'bike') drawTandemSide(ctx, 0, 0, 0.5, this.time, opt);
      else if (p.rideKind === 'tractor') drawTractorSide(ctx, 0, 0, 0.42, this.time, { ...opt, logs: Math.min(9, Math.floor((this.w.res?.wood ?? 0) / 2)), trailer: true });
      else if (p.rideKind === 'bus') drawBusSide(ctx, 0, 0, 0.38, this.time, opt);
      else if (p.rideKind === 'taxi') drawTaxiSide(ctx, 0, 0, 0.46, this.time, opt);
      else drawScooterSide(ctx, 0, 0, 0.58, this.time, opt);
      ctx.restore();
    } else {
      const atTable = p.activity?.a.id === 'eat' && p.activity.furn?.type === 'table';
      if (atTable) { isoBox(ctx, p.gx - 0.26, p.gy - 0.34, 0.52, 0.1, 44, boxOf('#a0703f')); isoBox(ctx, p.gx - 0.26, p.gy - 0.26, 0.52, 0.46, 14, boxOf('#c98e5f')); }
      p.actor.draw(ctx);
    }
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
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.fillStyle = p === this.me ? '#ff4d6d' : '#3a2a22'; fillTextIcons(ctx, label, s.x, s.y + 14, 11, true);
    }
    // balonasul cu cererea bolnavului
    if (c.sick && c.request && REQUESTS[c.request]) {
      const by = s.y - (p.activity?.a.place === 'bed' ? 50 : 98) * ACTOR_SCALE - 26 + Math.sin(this.time * 3) * 3;
      const bx = s.x + 22;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(bx - 16, by - 16, 32, 28, 10); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - 8, by + 12); ctx.lineTo(bx - 14, by + 20); ctx.lineTo(bx - 2, by + 12); ctx.fill();
      ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; fillTextIcons(ctx, REQUESTS[c.request].icon, bx, by - 2, 16); ctx.textBaseline = 'alphabetic';
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
