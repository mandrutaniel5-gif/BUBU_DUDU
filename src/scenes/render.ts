// Desenul lumii (scos din world.ts): podeaua, obiectele sortate in adancime, personajele, noaptea, minijocurile.
import * as Story from './story';
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
import { Actor } from '../char/actor';
import { ANIMS, ANIM_LIST } from '../char/anims';
import { Fx } from '../char/fx';
import { NPC_SPECS, drawCharacter, type CharId, type CharSpec } from '../char/draw';
import { Sfx } from '../engine/sfx';
import { Soundscape } from '../engine/soundscape';
import { ErrorLog } from '../engine/errors';
import pkg from '../../package.json';
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
import type { WorldScene, Pawn, Npc } from './world';
import { isWorldStatic } from '../world/map';
import { screenBox } from '../world/cull';
import { ACTOR_SCALE } from './world';

export function drawNpc(scene: WorldScene, ctx: CanvasRenderingContext2D, n: Npc) {
  if (!n.actor) return;
  n.actor.draw(ctx);
  if (n.state === 'wait') {
    const s = iso(n.x, n.y); const k = n.wants.length;
    const bw = 18 + k * 28, by = s.y - 84 + Math.sin(scene.time * 3 + n.x) * 2;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(s.x - bw / 2, by - 18, bw, 34, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.x - 4, by + 16); ctx.lineTo(s.x, by + 23); ctx.lineTo(s.x + 4, by + 16); ctx.fill();
    n.wants.forEach((c, i) => drawItem(ctx, c, s.x + (i - (k - 1) / 2) * 28, by - 1, 28, scene.time));
    const pk = Math.max(0, 1 - n.t / 120);
    ctx.fillStyle = pk > 0.4 ? '#7cc576' : '#e63946'; ctx.fillRect(s.x - bw / 2 + 4, by + 12, (bw - 8) * pk, 3);
  }
}

export function drawTravel(scene: WorldScene, ctx: CanvasRenderingContext2D, w: number, h: number) {
  const t = scene.travel!.t;
  if (scene.travel!.vehicle === 'door') {
    // scara blocului: inchidem peste lume, urci / cobori pe scari, apoi se deschide zona noua
    if (t < 0.35) { irisWipe(ctx, w, h, 1 - t / 0.35); return; }
    if (t > 2.75) { irisWipe(ctx, w, h, (t - 2.75) / 0.35); return; }
    const tr = scene.travel!, down = tr.from === 'apartment';
    const k = Math.max(0, Math.min(1, (t - 0.45) / 2.2));
    drawStairsScene(ctx, w, h, k, scene.time, nightAmount(scene.w.minutes), down, scene.me.actor.spec, scene.w.chars[scene.myId].outfit, tr.withPartner ? scene.partner.actor.spec : undefined, scene.w.chars[scene.partner.id].outfit);
    if (t < 0.6) irisWipe(ctx, w, h, (t - 0.35) / 0.25);
    if (t > 2.5) irisWipe(ctx, w, h, 1 - (t - 2.5) / 0.25);
    return;
  }
}

export function drawWorld(scene: WorldScene, ctx: CanvasRenderingContext2D) {
  if (!scene.ready) { const { w, h } = scene.game; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#c09a62'; ctx.font = '700 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Se încarcă salvarea…', w / 2, h / 2); return; }
  const { w, h } = scene.game;
  const night = nightAmount(scene.w.minutes);
  const apt = scene.space === 'apartment';
  if (apt) {
    // apartamentul = vedere de la etaj: cerul orasului cu blocuri in departare
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, night > 0.5 ? '#1d2550' : '#9fd3f5'); bg.addColorStop(1, night > 0.5 ? '#4a3f75' : '#e8f4ff'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const bw = 40 + ((i * 17) % 40), bx = i * (w / 22) - 30, bh = h * (0.2 + ((i * 37) % 50) / 100); ctx.fillStyle = night > 0.5 ? '#2f3a60' : ['#c9d8ee', '#b8c8e6', '#d6e2f2'][i % 3]; ctx.fillRect(bx, h - bh, bw, bh); ctx.fillStyle = night > 0.5 ? '#ffe68088' : '#ffffff88'; for (let yy = h - bh + 10; yy < h - 10; yy += 16) for (let xx = bx + 6; xx < bx + bw - 8; xx += 12) if (((xx * 3 + yy) | 0) % 5) ctx.fillRect(xx, yy, 5, 7); }
  } else {
    if (scene.chapter === 0) { const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, night > 0.5 ? '#2b3a67' : '#ffd6e4'); bg.addColorStop(1, night > 0.5 ? '#4a3f75' : '#ffeacc'); ctx.fillStyle = bg; }
    else ctx.fillStyle = night > 0.5 ? '#1f2540' : '#8fc98a';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.save();
  ctx.translate(w / 2, h / 2);
  if (scene.shake > 0.3) ctx.translate((Math.random() - 0.5) * scene.shake, (Math.random() - 0.5) * scene.shake);
  const Z = scene.effZoom;
  ctx.scale(Z, Z);
  ctx.translate(-scene.cam.x, -scene.cam.y);
  // ce se vede (pixeli de lume) si dalele din jur
  const vx0 = scene.cam.x - w / 2 / Z, vx1 = scene.cam.x + w / 2 / Z, vy0 = scene.cam.y - h / 2 / Z, vy1 = scene.cam.y + h / 2 / Z;
  const cs = [unIso(vx0, vy0), unIso(vx1, vy0), unIso(vx0, vy1), unIso(vx1, vy1)];
  const gx0 = Math.min(...cs.map(c => c.x)) - 2, gx1 = Math.max(...cs.map(c => c.x)) + 10, gy0 = Math.min(...cs.map(c => c.y)) - 2, gy1 = Math.max(...cs.map(c => c.y)) + 10;
  const seen = (x: number, y: number, m = 140) => { const q = iso(x, y); return q.x > vx0 - m && q.x < vx1 + m && q.y > vy0 - m && q.y < vy1 + m * 2.2; };
  const visible = furnIn(gx0, gy0, gx1, gy1).filter(f => onScreen(f, vx0, vy0, vx1, vy1));

  // podeaua (pe bucati) si, in lume, tot ce nu se misca "copt" in ea: copaci, case, campuri, garduri, pereti
  const home = scene.space === 'world';
  const ch0 = scene.chapter === 0 && home;
  const baking = home && !ch0;
  const dep: Record<string, boolean> = {}; for (const id in scene.w.nodes ?? {}) if (scene.depleted(id)) dep[id] = true;
  const st: FurnState = { ...(scene.w.furn as FurnState), night, depleted: dep };
  // apartamentul are televizorul lui (nou, nu se strica odata cu cel de acasa); consola il foloseste ca ecran
  if (scene.space === 'apartment') { st.tvBroken = false; st.tvOn = !!st.aptTvOn || !!st.aptGame; }
  const lit2 = (night > 0.4 ? 1 : 0) + (night > 0.5 ? 1 : 0), bakeNight = lit2 === 0 ? 0 : lit2 === 1 ? 0.45 : 0.9;
  const stBake: FurnState = { ...st, night: bakeNight };
  const bf = scene.bridgeFixed(), own = (globalThis as any).__villageOwned ?? {};
  // rezolutia s-a schimbat (calitatea adaptiva, zoom): bucatile si imaginile se refac la noua marime
  { const cs = scene.chunkScale(); if (cs !== scene.floorChunks.scale) { scene.floorChunks.reset(cs); scene.sprites.clear(); } }
  const SS = scene.floorChunks.scale;
  const bakeKey = baking ? `${lit2}|${own.florarie ? 1 : 0}${own.workshop ? 1 : 0}${own.apartment ? 1 : 0}|${bf ? 1 : 0}|${scene.chapter >= 2 ? 1 : 0}|${Story.storyKey(scene)}` : 'nu';
  if (bakeKey !== scene.bakeKey) { scene.bakeKey = bakeKey; scene.floorChunks.reset(); scene.sprites.clear(); }
  scene.floorChunks.bake = baking ? (c, ox, oy, bw, bh) => bakeChunk(scene, c, ox, oy, bw, bh, stBake, bakeNight) : null;
  // un copac taiat / o piatra sparta (sau crescute la loc): refacem doar bucatile de podea in care sunt
  if (baking) {
    const last = scene.bakedDep;
    for (const id of new Set([...Object.keys(dep), ...Object.keys(last)])) if (!!dep[id] !== !!last[id]) {
      const f = FURNITURE.find(x => x.id === id);
      if (f && bakeable(f)) { scene.floorChunks.invalidate(screenBox(f)); scene.sprites.forget('f:' + f.id); }
    }
    scene.bakedDep = dep;
  }
  // casa: lampa, curatenia, taraba, ce ati construit / plantat. Se verifica MEREU (si in Capitolul 0, unde nu se „coace”
  // nimic): altfel mobila ramanea desenata cum era la inceput (toaleta infundata, lampa stinsa) chiar dupa ce o reparai
  {
    const sb = (globalThis as any).__stand ?? {};
    const hk = [st.lampOn, st.clogged, st.tubDirty, Math.round(((st.bathFoam as number) ?? 0) * 4), st.fridgeDirty, st.dishesDirty, st.tvBroken, sb.broken, sb.open, scene.placedVersion, lit2, ch0 ? 0 : 1].join('|');
    if (hk !== scene.homeKey) { if (scene.homeKey) { if (baking) scene.floorChunks.invalidate(HOME_BOX); scene.sprites.clear(); } scene.homeKey = hk; }
  }
  const PF = (globalThis as any).__prof as Record<string, number> | undefined; let pt = performance.now();
  const lap = (k: string) => { if (!PF) return; if ((globalThis as any).__flush) ctx.getImageData(0, 0, 1, 1); const n = performance.now(); PF[k] = (PF[k] ?? 0) + n - pt; pt = n; };
  if (ch0) {
    // Capitolul 0: doar casa, ca o casuta de papusi pe un soclu cu iarba (curtea nu se vede)
    const c = iso(8, 7.2); ctx.fillStyle = 'rgba(120,80,100,0.14)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 70, 470, 150, 0, 0, 7); ctx.fill();
    isoBox(ctx, 1.75, 1.75, 12.5, 10.75, 16, { top: '#a6dc93', left: '#b98a5e', right: '#a07450' }, -16);
    ctx.save(); const A = iso(2, 2), B = iso(14, 2), C = iso(14, 12), D = iso(2, 12);
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.lineTo(D.x, D.y); ctx.closePath(); ctx.clip();
    scene.floorChunks.draw(ctx, vx0, vy0, vx1, vy1); ctx.restore();
  } else { if (apt) drawAptBuilding(ctx, night); scene.floorChunks.draw(ctx, vx0, vy0, vx1, vy1); }
  lap('podea');
  const inHouse = (x0: number, y0: number, x1: number, y1: number) => !ch0 || (x0 >= 2 && y0 >= 2 && x1 <= 14.2 && y1 <= 12.3);

  // obiectele vii (cele care se schimba): desenate la fiecare cadru; cele care nu se misca: din imaginea lor
  const paint = (f: Furn) => {
    if (!cacheable(f) || liveNow(scene, f, st)) { drawFurn(ctx, f, scene.time, st); return; }
    const key = f.id + (dep[f.id] ? '|d' : '') + (lit2 ? '|n' + lit2 : '');
    scene.sprites.draw(ctx, f, key, SS, c => drawFurn(c, f, 0, { ...st, night: bakeNight }));
  };
  const isBaked = (f: Furn) => baking && bakeable(f);
  // decoruri pe sol (cele vii; celelalte sunt deja in podea)
  for (const f of visible) if (scene.isDecor(f) && !isBaked(f) && inHouse(f.gx, f.gy, f.gx + f.w, f.gy + f.d)) { try { paint(f); } catch (e) { ErrorLog.add(e, 'desen decor'); } }
  if (!ch0 && home) for (const [k, p] of Object.entries(scene.w.plots ?? {})) { const [x, y] = k.split(',').map(Number); if (seen(x, y)) drawPlotSoil(ctx, x, y, p as Plot, scene.w.gameMin ?? 0, scene.time); }
  if (!ch0 && home) for (const k in scene.w.grass ?? {}) { const [x, y] = k.split(',').map(Number); if (seen(x, y)) drawTallGrass(ctx, x, y, scene.w.grass![k], scene.time); }
  if (scene.build?.item) drawGhost(ctx, scene.build.item, scene.build.gx, scene.build.gy, scene.canPlace(scene.build.item, scene.build.gx, scene.build.gy) && scene.canAfford(scene.build.item), scene.time);
  // indicator obiect apropiat
  const near = scene.ride ? null : scene.nearestFurn(scene.me);
  if (near && !scene.me.activity) {
    ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(scene.time * 5);
    ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
    const a = iso(near.gx, near.gy), b = iso(near.gx + near.w, near.gy), c = iso(near.gx + near.w, near.gy + near.d), d = iso(near.gx, near.gy + near.d);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
  // tinta pentru mers
  if (scene.me.path.length) {
    const t = scene.me.path[scene.me.path.length - 1]; const p = iso(t.x, t.y);
    ctx.strokeStyle = '#ff7aa2'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(p.x, p.y, 12 + Math.sin(scene.time * 8) * 2, 6, 0, 0, 7); ctx.stroke();
  }
  if (!baking) {
    // fara "copt" (Capitolul 0, apartamentul): gardul si peretii din spate inaintea obiectelor
    if (!ch0 && home) { for (let x = 0; x < MAP_W; x++) if (x !== BACK_GATE) drawYardFence(ctx, x, 0, 'x'); for (let y = 0; y < YARD_H; y++) drawYardFence(ctx, 0, y, 'y'); }
    if (ch0) for (const [dx, dy] of [[5.5, 12.05], [14.05, 9.5]]) { const p = iso(dx, dy, 22); drawLock(scene, ctx, p.x, p.y); }
    for (const wl of WALLS) if (wl.kind === 'back') drawWall(ctx, wl, scene.time, night);
  }

  lap('decor+inel');
  // sortare in adancime: obiectele vii, personajele, masinile, satenii...
  const items: DItem[] = [];
  const onBike = (scene.me.riding && scene.me.rideKind === 'bike') || (scene.sameArea() && scene.partner.riding && scene.partner.rideKind === 'bike');
  const onScoot = (scene.me.riding && scene.me.rideKind === 'scooter') || (scene.sameArea() && scene.partner.riding && scene.partner.rideKind === 'scooter');
  const onTractor = (scene.me.riding && scene.me.rideKind === 'tractor') || (scene.sameArea() && scene.partner.riding && scene.partner.rideKind === 'tractor');
  const overlays: (() => void)[] = [];
  for (const f of visible) if (!scene.isDecor(f)) {
    if ((onBike && (f.id === 'h-bike' || f.id === 'v-bike')) || (onScoot && (f.id === 'h-scooter' || f.id === 'v-scooter')) || (onTractor && (f.id === 'h-tractor' || f.id === 'f-tractor'))) continue;
    if (isBaked(f) && !liveNow(scene, f, st)) {
      // copt in podea; peste el, viu: semnul plutitor / ceasul / luminitele cladirii, fumul din cos
      if (layered(f)) overlays.push(() => { const g = globalThis as any; g.__layer = 'live'; try { drawFurn(ctx, f, scene.time, st); } finally { g.__layer = ''; } });
      if ((f.type as string) === 'farmhouse') overlays.push(() => houseSmoke(ctx, f, scene.time));
      continue;
    }
    items.push({ x0: f.gx, y0: f.gy, x1: f.gx + f.w, y1: f.gy + f.d, box: screenBox(f), draw: () => paint(f), k: f.type, id: f.id });
  }
  if (!baking) {
    for (const wl of WALLS) if (wl.kind !== 'back') {
      const r = wl.dir === 'x' ? { x0: wl.x, y0: wl.y - 0.05, x1: wl.x + 1, y1: wl.y } : { x0: wl.x - 0.05, y0: wl.y, x1: wl.x, y1: wl.y + 1 };
      items.push({ ...r, draw: () => drawWall(ctx, wl as Wall, scene.time, night), k: 'perete', id: `w:${wl.x},${wl.y},${wl.dir}` });
    }
    if (home && !ch0 && seen(10, 22, 400)) for (let x = 0; x < MAP_W; x++) {
      if (x === YARD_GATE) items.push({ x0: x, y0: YARD_H - 0.02, x1: x + 1, y1: YARD_H, draw: () => drawYardGate(ctx, YARD_GATE, YARD_H) });
      else items.push({ x0: x, y0: YARD_H - 0.02, x1: x + 1, y1: YARD_H, draw: () => drawYardFence(ctx, x, YARD_H, 'x'), k: 'gard' });
    }
  }
  if (home) for (const [k, p] of Object.entries(scene.w.plots ?? {})) { if (!p.crop) continue; const [x, y] = k.split(',').map(Number); if (!seen(x, y)) continue; items.push({ x0: x + 0.3, y0: y + 0.3, x1: x + 0.7, y1: y + 0.7, draw: () => drawCropPlant(ctx, x, y, p as Plot, scene.w.gameMin ?? 0, scene.time) }); }
  if (home) for (const car of scene.cars) { const cp = carPos(car); if (!seen(cp.x, cp.y)) continue; items.push({ x0: cp.x - 0.5, y0: cp.y - 0.3, x1: cp.x + 0.5, y1: cp.y + 0.3, mx: 80, h: 80, draw: () => drawCar(ctx, car, scene.time) }); }
  if (home) for (const v of scene.walkers) { if (!seen(v.x, v.y)) continue; items.push({ x0: v.x - 0.2, y0: v.y - 0.2, x1: v.x + 0.2, y1: v.y + 0.2, draw: () => {
    v.a.draw(ctx);
    // numele sateanului (cand esti aproape) + inimioare de prietenie
    if (v.name && Math.hypot(v.x - scene.me.gx, v.y - scene.me.gy) < 5) {
      const q = iso(v.x, v.y); const fr = Math.min(5, Math.floor((scene.w.stats['friend-' + v.vid] ?? 0) / 2));
      ctx.font = '800 10.5px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#7a3a5a';
      const lb = v.name + (fr ? ' ' + '💗'.repeat(fr) : ''); ctx.strokeText(lb, q.x, q.y + 14); ctx.fillText(lb, q.x, q.y + 14);
      const hasQ = (scene.w.town?.quests as any[] | undefined)?.some(x => x.who === v.vid && !x.done && x.day === scene.w.day);
      if (hasQ) { const by = q.y - 92 * ACTOR_SCALE * 0.92 - 18 + Math.sin(scene.time * 4) * 2; ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#4a2a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, by, 9, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#4a2a22'; ctx.font = '900 13px "Baloo 2", sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText('!', q.x, by + 1); ctx.textBaseline = 'alphabetic'; }
    }
  } }); }
  if (home) for (const c of scene.critters) { if (!seen(c.x, c.y)) continue; items.push({ x0: c.x - 0.2, y0: c.y - 0.2, x1: c.x + 0.2, y1: c.y + 0.2, h: 70, draw: () => { const q = iso(c.x, c.y); drawCritter(ctx, c, q.x, q.y, scene.time); } }); }
  if (home) for (const n of scene.npcs) { if (!seen(n.x, n.y)) continue; items.push({ x0: n.x - 0.2, y0: n.y - 0.2, x1: n.x + 0.2, y1: n.y + 0.2, draw: () => drawNpc(scene, ctx, n) }); }
  for (const p of [scene.me, scene.partner]) {
    if (p === scene.partner && !scene.sameArea()) continue;
    if (!seen(p.gx, p.gy, 260)) continue;
    // la masa: farfuria cu mancarea aleasa, pe masa, in fata personajului (se goleste pe masura ce mananca)
    if (p.activity?.a.id === 'eat' && p.activity.furn?.type === 'table') { const f = p.activity.furn, act = p.activity; items.push({ x0: f.gx, y0: f.gy, x1: f.gx + f.w, y1: f.gy + f.d + 0.002, draw: () => drawPlate(scene, ctx, p.gx, f.gy + 0.36, act) }); }
    const inside = p.activity?.a.place;
    const pb = { mx: p.riding ? 110 : 50, h: p.riding ? 120 : 150 };
    if ((inside === 'bed' || inside === 'tub' || inside === 'toilet' || inside === 'sofa' || inside === 'ride' || inside === 'bench') && p.activity!.furn) {
      // desenat imediat dupa obiectul pe care sta
      const f = p.activity!.furn;
      const eps = inside === 'sofa' ? 0.01 : 0.001;
      items.push({ x0: f.gx + f.w - eps, y0: f.gy + f.d - eps, x1: f.gx + f.w, y1: f.gy + f.d, box: personBox(p.gx, p.gy, pb.mx, pb.h), draw: () => drawPawn(scene, ctx, p), id: 'p:' + p.id });
    } else items.push({ x0: p.gx - 0.2, y0: p.gy - 0.2, x1: p.gx + 0.2, y1: p.gy + 0.2, ...pb, draw: () => drawPawn(scene, ctx, p), id: 'p:' + p.id });
  }
  if (baking) {
    // ce e "copt" si sta IN FATA celor vii se redeseneaza peste ei, doar in jurul lor (cele din spate sunt deja in podea)
    const dyn = items.slice();
    const statics = staticEntriesIn(scene, gx0, gy0, gx1, gy1, vx0, vy0, vx1, vy1).filter(e => !e.flat);
    const assigned = new Map<StaticEntry, Box[]>();
    for (const d of dyn) {
      const R0 = d.box ?? itemBox(d), R = { x0: R0.x0 - 4, y0: R0.y0 - 4, x1: R0.x1 + 4, y1: R0.y1 + 4 };
      for (const e of statics) if (overlap(R, e.box) && isoCmp(d, e) < 0) { let L = assigned.get(e); if (!L) assigned.set(e, L = []); L.push(R); }
    }
    // pentru teste: ce obiecte coapte se suprapun pe ecran cu personajul tau si care sunt desenate in fata lui
    { const g = globalThis as any; if (g.__orderLog) { const me = dyn.find(d => d.id === 'p:' + scene.myId); g.__front = me ? statics.filter(e => overlap(me.box ?? itemBox(me), e.box)).map(e => ({ id: e.key, x0: e.x0, y0: e.y0, x1: e.x1, y1: e.y1, front: isoCmp(me, e) < 0 })) : null; g.__me = me ? { x0: me.x0, y0: me.y0, x1: me.x1, y1: me.y1 } : null; } }
    if (PF) { (globalThis as any).__big = { dyn: dyn.length, occ: assigned.size, rects: [...assigned.values()].reduce((a, l) => a + l.length, 0) }; }
    for (const [e, rs] of assigned) {
      const hit = mergeLocal(rs, e.box);
      items.push({ x0: e.x0, y0: e.y0, x1: e.x1, y1: e.y1, box: e.box, draw: () => scene.sprites.drawBox(ctx, e.key + '|' + lit2 + (dep[e.key.slice(2)] ? '|d' : ''), e.box, SS, c => e.paint(c, stBake, bakeNight), hit), k: 'copt' });
    }
    lap('liste');
    drawSorted(ctx, items, inHouse);
  } else drawSorted(ctx, items, inHouse);
  lap('vii');
  for (const o of overlays) { ctx.save(); try { o(); } catch (e) { ErrorLog.add(e, 'desen semn'); } ctx.restore(); }
  lap('semne');
  for (const fg of scene.fogs) {
    const k = fg.t / 4, q = iso(fg.x, fg.y, 20 + k * 30);
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + fg.t * 0.3, r = 30 + k * 110 + (i % 3) * 14; ctx.fillStyle = `rgba(160,210,90,${0.32 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(q.x + Math.cos(a) * r * 0.55, q.y + Math.sin(a) * r * 0.22 - i * 3, r * 0.5, r * 0.28, 0, 0, 7); ctx.fill(); }
  }
  // moneda aruncata: arc deasupra, apoi stropi si cercuri pe apa
  for (const fl of scene.flings) {
    const k = Math.min(1, fl.t / fl.dur), gx = fl.x0 + (fl.x1 - fl.x0) * k, gy = fl.y0 + (fl.y1 - fl.y0) * k;
    if (k < 1) { const q = iso(gx, gy, 50 + (fl.z1 - 50) * k + Math.sin(k * Math.PI) * 70); ctx.save(); ctx.translate(q.x, q.y); ctx.scale(Math.cos(fl.t * 18), 1); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#a07a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
    else {
      const r = fl.t - fl.dur, q = iso(fl.x1, fl.y1, fl.z1);
      if (r < 0.05) { scene.fx.burst('drop', q.x, q.y, 8, 2.4, 90, { grav: 300, max: 0.5, color: '#bde7ff' }); scene.fx.hearts(q.x, q.y - 20, 2); }
      for (let i = 0; i < 3; i++) { const rr = r - i * 0.25; if (rr <= 0) continue; ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.8 - rr * 0.7)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(q.x, q.y, 6 + rr * 26, 3 + rr * 13, 0, 0, 7); ctx.stroke(); }
    }
  }

  // gardul curtii: laturea din fata-dreapta (in lume e "copt" si sortat cu restul)
  if (!ch0 && home && !baking) for (let y = 0; y < YARD_H; y++) drawYardFence(ctx, MAP_W, y, 'y');

  scene.fx.draw(ctx);
  scene.sprites.endFrame();
  lap('rest');

  // noaptea
  ctx.restore();
  if (night > 0) {
    ctx.fillStyle = `rgba(25,25,70,${0.42 * night})`; ctx.fillRect(0, 0, w, h);
    if (scene.w.furn.lampOn) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.translate(w / 2, h / 2); ctx.scale(scene.effZoom, scene.effZoom); ctx.translate(-scene.cam.x, -scene.cam.y);
      const p = scene.space === 'apartment' ? iso(6.5, 3.5, 40) : iso(5.5, 2.5, 40);
      const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 160); g.addColorStop(0, `rgba(255,200,120,${0.35 * night})`); g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 160, 0, 7); ctx.fill();
      ctx.restore();
    }
  }
  // frig: chenar inghetat cand iti e frig
  const wm = scene.w.chars[scene.myId].needs.warmth ?? 60;
  if (wm < 30) { const k = (30 - wm) / 30; const gr = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7); gr.addColorStop(0, 'rgba(180,220,255,0)'); gr.addColorStop(1, `rgba(200,235,255,${0.55 * k})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); }
  // joystick
  // indiciu pentru joystick (doar pe ecrane tactile)
  if (!scene.joy.active && !scene.minigame && !scene.travel && matchMedia('(pointer: coarse)').matches) {
    const jx = Math.min(130, w * 0.16), jy = h - Math.min(120, h * 0.24);
    ctx.globalAlpha = 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(jx, jy, 46, 0, 7); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(jx, jy, 20, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  }
  if (scene.joy.active) {
    ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(scene.joy.sx, scene.joy.sy, 50, 0, 7); ctx.stroke();
    const jx = scene.joy.x - scene.joy.sx, jy = scene.joy.y - scene.joy.sy, l = Math.hypot(jx, jy), k = l > 50 ? 50 / l : 1;
    ctx.fillStyle = '#ff7aa2cc'; ctx.beginPath(); ctx.arc(scene.joy.sx + jx * k, scene.joy.sy + jy * k, 22, 0, 7); ctx.fill();
  }
  // somnul: ecran intunecat, ceasul si cat mai e pana dimineata
  if (scene.me.activity?.a.id === 'sleep' && scene.me.activity.t >= 0 && !scene.minigame) drawSleepOverlay(scene, ctx, w, h);
  if (scene.morningT > 0) {
    const k = Math.min(1, scene.morningT / 0.6);
    ctx.save(); ctx.globalAlpha = Math.min(1, k); const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,214,165,0.85)'); g.addColorStop(1, 'rgba(255,241,214,0.0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.font = '900 38px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#e07a2f';
    ctx.strokeText('Bună dimineața!', w / 2, h * 0.3); ctx.fillText('Bună dimineața!', w / 2, h * 0.3);
    ctx.font = '800 20px "Baloo 2", sans-serif'; ctx.fillStyle = '#7a5a4a'; ctx.strokeText(`Ziua ${scene.w.day} · ${clockText(scene.w.minutes)}`, w / 2, h * 0.3 + 36); ctx.fillText(`Ziua ${scene.w.day} · ${clockText(scene.w.minutes)}`, w / 2, h * 0.3 + 36);
    ctx.restore();
  }
  if (scene.minigame) {
    // minijocurile sunt gandite pentru minim ~460 px inaltime: pe ecrane scunde (telefon pe lat) le scalam proportional
    const k = scene.miniScale();
    ctx.save(); ctx.scale(k, k); scene.minigame.obj.draw(ctx, w / k, h / k); ctx.restore();
  }
  if (scene.travel) drawTravel(scene, ctx, w, h);
}

export function drawSleepOverlay(scene: WorldScene, ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,18,50,0.45)'; ctx.fillRect(0, 0, w, h);
  const nap = (scene.w.chars[scene.myId] as any).napStart != null;
  const fast = scene.timeMult > 1;
  const left = nap ? Math.max(0, 180 - ((scene.w.gameMin ?? 0) - (scene.w.chars[scene.myId] as any).napStart)) : ((7 * 60 - scene.w.minutes) + 1440) % 1440;
  const cx = w / 2, cy = h * 0.2;
  ctx.fillStyle = '#fff8ef'; ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(cx - 170, cy - 46, 340, 112, 22); ctx.fill(); ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = '#3a2a22';
  ctx.font = '900 30px "Baloo 2", sans-serif'; ctx.fillText(`${clockText(scene.w.minutes)}${fast ? '  ⏩' : ''}`, cx, cy - 8);
  ctx.font = '800 15px "Baloo 2", sans-serif';
  ctx.fillText(nap ? `Pui de somn · energie ${Math.round(scene.w.chars[scene.myId].needs.energy)}%` : `Dormiți… vă treziți la 07:00 (mai sunt ${Math.floor(left / 60)}h ${Math.round(left % 60)}m)`, cx, cy + 20);
  ctx.font = '700 13px "Baloo 2", sans-serif'; ctx.fillStyle = '#7a5a4a';
  const pa = scene.partner.actor.spec.name;
  ctx.fillText(fast ? 'Noaptea trece repede pentru că dormiți amândoi 💤' : scene.partner.activity?.a.id === 'sleep' ? '' : `Timpul trece normal până se culcă și ${pa}`, cx, cy + 44);
  ctx.restore();
}
/** poarta din spatele curtii (spre padure), mereu deschisa */
export function drawBackGate(scene: WorldScene, ctx: CanvasRenderingContext2D) { drawYardGate(ctx, BACK_GATE, 0); }
export function drawLock(scene: WorldScene, ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(x, y + Math.sin(scene.time * 2) * 2);
  ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -8, 6, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.roundRect(-9, -8, 18, 14, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(0, -2, 2, 0, 7); ctx.fill();
  ctx.restore();
}
/** farfuria de la masa: mancarea aleasa (iconita ei), aburi la cele calde, se termina pe masura ce mananci */
export function drawPlate(scene: WorldScene, ctx: CanvasRenderingContext2D, gx: number, gy: number, act: { a: Activity; t: number }) {
  const c = iso(gx, gy, 27.5), left = Math.max(0, 1 - act.t / Math.max(1, act.a.dur));
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#4a2a22'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(c.x, c.y, 15, 7, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#e8d8cc'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 10, 4.5, 0, 0, 7); ctx.stroke();
  const key: string = (act.a as any).dish ?? 'meals';
  const icon = RECIPE[key.replace(/^dish_/, '')]?.icon ?? READY_MEAL.icon;
  if (left > 0.05) { const ic = iconCanvas(icon, 64); if (ic) { const sz = 22 * (0.45 + 0.55 * left); ctx.drawImage(ic, c.x - sz / 2, c.y - sz * 0.8, sz, sz); } }
  if (['🍲', '🥣', '🍵', '🫓', '🥘', '🍠'].includes(icon) && left > 0.2) for (let i = 0; i < 2; i++) { const k = (scene.time * 0.8 + i * 0.5) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x - 4 + i * 8, c.y - 12 - k * 14); ctx.quadraticCurveTo(c.x + i * 8, c.y - 18 - k * 14, c.x - 4 + i * 8, c.y - 24 - k * 14); ctx.stroke(); }
  // furculita
  ctx.strokeStyle = '#9aa4ad'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x + 17, c.y - 2); ctx.lineTo(c.x + 22, c.y + 4); ctx.stroke();
}
export function drawPawn(scene: WorldScene, ctx: CanvasRenderingContext2D, p: Pawn) {
  if (p.passenger && scene.sameArea()) return; // il deseneaza soferul
  if (p.riding) {
    const s = iso(p.gx, p.gy, 0); const other = p === scene.me ? scene.partner : scene.me;
    ctx.save(); ctx.translate(s.x, s.y + 2); ctx.scale(p.actor.flip, 1);
    const bump = p.actor.moving ? Math.abs(Math.sin(scene.time * 14)) * -1.2 : 0;
    const opt = { rot: p.actor.moving ? scene.time * 18 : 0, bump, driver: p.actor.spec, passenger: other.passenger && scene.sameArea() ? other.actor.spec : undefined };
    // praful din spatele rotilor cand merge repede pe drum
    if (p.actor.moving && p.rideKind !== 'bike') for (let i = 0; i < 4; i++) { const q = (scene.time * 1.6 + i / 4) % 1; ctx.globalAlpha = 0.35 * (1 - q); ctx.fillStyle = '#e6d3b0'; ctx.beginPath(); ctx.arc(-30 - q * 60, 2 - q * 10, 4 + q * 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    if (p.rideKind === 'bike') drawTandemSide(ctx, 0, 0, 0.5, scene.time, opt);
    else if (p.rideKind === 'tractor') drawTractorSide(ctx, 0, 0, 0.42, scene.time, { ...opt, logs: p.fieldOp ? 0 : Math.min(9, Math.floor((scene.w.res?.wood ?? 0) / 2)), trailer: !p.fieldOp });
    else if (p.rideKind === 'bus') drawBusSide(ctx, 0, 0, 0.38, scene.time, opt);
    else if (p.rideKind === 'taxi') drawTaxiSide(ctx, 0, 0, 0.46, scene.time, opt);
    else drawScooterSide(ctx, 0, 0, 0.58, scene.time, opt);
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
  const c = scene.w.chars[p.id];
  ctx.font = '800 11px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
  const label = `${p.actor.spec.name}${c.sick ? ' ' + SICK_INFO[c.sick].icon : ''}${p.control === 'ai' ? ' 🤖' : ''}`;
  if (p.activity?.a.place !== 'bed' && p.activity?.a.place !== 'tub') {
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.fillStyle = p === scene.me ? '#ff4d6d' : '#3a2a22'; fillTextIcons(ctx, label, s.x, s.y + 14, 11, true);
  }
  // balonasul cu cererea bolnavului
  if (c.sick && c.request && REQUESTS[c.request]) {
    const by = s.y - (p.activity?.a.place === 'bed' ? 50 : 98) * ACTOR_SCALE - 26 + Math.sin(scene.time * 3) * 3;
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

// ------------------------------------------------------------------ lumea "coapta"
interface DItem { x0: number; y0: number; x1: number; y1: number; draw: () => void; box?: Box; mx?: number; h?: number; k?: string; id?: string }
interface Box { x0: number; y0: number; x1: number; y1: number }
/** un lucru care nu se misca, "copt" in podea */
interface StaticEntry { key: string; x0: number; y0: number; x1: number; y1: number; box: Box; flat?: boolean; paint: (c: CanvasRenderingContext2D, st: FurnState, night: number) => void }
/** mobila si lucrurile casei care se pot "coace" (se refac cand li se schimba starea: lampa, curatenia...) */
const HOME_BAKE = new Set(['bed', 'nightstand', 'wardrobe', 'rug', 'plant', 'toilet', 'bathtub', 'sink', 'washer', 'fridge', 'stove', 'counter', 'table', 'sofa', 'tv', 'bookshelf', 'tree', 'bush', 'bench', 'mailbox', 'flowers', 'doormat', 'lamp', 'well', 'laptop', 'signpost', 'gateway', 'shed', 'mower', 'stand', 'rock', 'wildflower', 'stonepath', 'heartstone', 'fence', 'pot', 'lamppost', 'sapling', 'snowman', 'gazebo', 'swing', 'flowerbed', 'logpile']);
/** se poate "coace"? lucrurile lumii si ale casei care arata la fel (cele care se schimba se refac separat) */
export function bakeable(f: Furn) {
  if (isWorldStatic(f.id)) return cacheable(f);
  if (/^(h|v|f)-/.test(f.id)) return false; // vehiculele si gramada de lemne se misca dintr-un loc in altul
  return HOME_BAKE.has(f.type as string);
}
/** acum se misca / se schimba de la un cadru la altul (televizorul pornit, aragazul care gateste...): desenat viu peste */
function liveNow(scene: WorldScene, f: Furn, st: FurnState) {
  const t = f.type as string;
  if (t === 'tv' && (st.tvOn || st.tvBroken || st.aptGame)) return true; // si „puricii” televizorului stricat se misca
  if (t === 'stove' && st.cooking) return true;
  // mizeria se misca (aburii care miros): vie, nu „poza”
  if ((t === 'toilet' && st.clogged) || (t === 'bathtub' && st.tubDirty) || (t === 'fridge' && st.fridgeDirty) || (t === 'counter' && st.dishesDirty)) return true;
  for (const p of [scene.me, scene.partner]) if (p.activity?.furn === f) return true;
  return false;
}
/** zona casei si a curtii pe ecran (pixeli de lume): o refacem cand se schimba ceva acasa */
const HOME_BOX = { x0: iso(0, 27).x - 120, x1: iso(22, 0).x + 120, y0: iso(0, 0).y - 220, y1: iso(22, 27).y + 60 };
const overlap = (a: Box, b: Box) => a.x1 >= b.x0 && a.x0 <= b.x1 && a.y1 >= b.y0 && a.y0 <= b.y1;
function personBox(gx: number, gy: number, mx: number, h: number): Box { const q = iso(gx, gy); return { x0: q.x - mx, x1: q.x + mx, y0: q.y - h, y1: q.y + 36 }; }
function itemBox(it: DItem): Box { const mx = it.mx ?? 50, h = it.h ?? 150; return { x0: iso(it.x0, it.y1).x - mx, x1: iso(it.x1, it.y0).x + mx, y0: iso(it.x0, it.y0).y - h, y1: iso(it.x1, it.y1).y + 36 }; }
/** dreptunghiurile in care se redeseneaza (un dreptunghi cuprins in altul dispare; altfel raman separate: unite, ar acoperi tot ecranul) */
const area = (r: Box) => (r.x1 - r.x0) * (r.y1 - r.y0);
function mergeRects(rs: Box[]): Box[] {
  const out = rs.map(r => ({ x0: r.x0 - 4, y0: r.y0 - 4, x1: r.x1 + 4, y1: r.y1 + 4 })).sort((a, b) => area(b) - area(a));
  const keep: Box[] = [];
  for (const r of out) if (!keep.some(k => k.x0 <= r.x0 && k.y0 <= r.y0 && k.x1 >= r.x1 && k.y1 >= r.y1)) keep.push(r);
  return keep;
}
/** bucatile unui singur obiect: cele care se suprapun devin una (nu poate creste peste obiect) */
function mergeLocal(rs: Box[], within: Box): Box[] {
  const out = rs.map(r => ({ x0: Math.max(r.x0, within.x0), y0: Math.max(r.y0, within.y0), x1: Math.min(r.x1, within.x1), y1: Math.min(r.y1, within.y1) })).filter(r => r.x1 > r.x0 && r.y1 > r.y0);
  let changed = true;
  while (changed && out.length > 1) {
    changed = false;
    for (let i = 0; i < out.length && !changed; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j]; if (!overlap(a, b)) continue;
      const u = { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) };
      if (area(u) > (area(a) + area(b)) * 1.1) continue;
      Object.assign(a, u); out.splice(j, 1); changed = true; break;
    }
  }
  return out;
}
/**
 * Cine e in spate (a inaintea lui b: -1). Peretii subtiri se compara cu PARTEA din care e celalalt (centrul lui),
 * altfel, langa un perete, Bubu / patul / masina de spalat sareau cand in fata, cand in spate.
 */
const thinX = (a: Box) => a.x1 - a.x0 <= 0.06, thinY = (a: Box) => a.y1 - a.y0 <= 0.06;
function isoCmp(a: Box, b: Box): number {
  const E = 1e-6;
  const ovY = a.y0 < b.y1 - E && b.y0 < a.y1 - E, ovX = a.x0 < b.x1 - E && b.x0 < a.x1 - E;
  // perete pe y (linia x = w.x1): celalalt e in fata daca centrul lui e la dreapta liniei; la fel pe x
  const midIn = (v0: number, v1: number, w0: number, w1: number) => { const c = (v0 + v1) / 2; return c > w0 && c < w1; };
  if (thinX(a) && !thinX(b) && ovY && midIn(b.y0, b.y1, a.y0, a.y1)) return (b.x0 + b.x1) / 2 >= a.x1 - 1e-3 ? -1 : 1;
  if (thinX(b) && !thinX(a) && ovY && midIn(a.y0, a.y1, b.y0, b.y1)) return (a.x0 + a.x1) / 2 >= b.x1 - 1e-3 ? 1 : -1;
  if (thinY(a) && !thinY(b) && ovX && midIn(b.x0, b.x1, a.x0, a.x1)) return (b.y0 + b.y1) / 2 >= a.y1 - 1e-3 ? -1 : 1;
  if (thinY(b) && !thinY(a) && ovX && midIn(a.x0, a.x1, b.x0, b.x1)) return (a.y0 + a.y1) / 2 >= b.y1 - 1e-3 ? 1 : -1;
  const ax = a.x1 <= b.x0 + E, bx = b.x1 <= a.x0 + E, ay = a.y1 <= b.y0 + E, by = b.y1 <= a.y0 + E;
  // despartite pe diagonala (unul mai la stanga, celalalt mai la dreapta): nu se acopera, nu impunem nimic
  if ((ax && by) || (bx && ay)) return 0;
  if (ax || ay) return -1;
  if (bx || by) return 1;
  return (a.x0 + a.x1 + a.y0 + a.y1) - (b.x0 + b.x1 + b.y0 + b.y1);
}
/**
 * Ordinea de desen: doar obiectele care se ating pe ecran se compara intre ele, apoi o ordine topologica.
 * (Un simplu sort cu o comparatie care nu e tranzitiva dadea alta ordine la fiecare pas: obiectele „palpaiau”.)
 */
function depthSort<T extends Box>(items: T[], boxOf: (t: T) => Box): T[] {
  const base = items.slice().sort((a, b) => (a.x0 + a.x1 + a.y0 + a.y1) - (b.x0 + b.x1 + b.y0 + b.y1));
  const n = base.length; if (n < 2) return base;
  const B = base.map(boxOf), indeg = new Int32Array(n), adj: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (!overlap(B[i], B[j])) continue;
    const c = isoCmp(base[i], base[j]);
    if (c < 0) { adj[i].push(j); indeg[j]++; } else if (c > 0) { adj[j].push(i); indeg[i]++; }
  }
  const out: T[] = [], done = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    let pick = -1;
    for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0) { pick = i; break; }
    if (pick < 0) for (let i = 0; i < n; i++) if (!done[i]) { pick = i; break; } // un cerc (rar): il rupem in ordinea de baza
    done[pick] = 1; out.push(base[pick]);
    for (const j of adj[pick]) indeg[j]--;
  }
  return out;
}
function drawSorted(ctx: CanvasRenderingContext2D, items: DItem[], inHouse: (x0: number, y0: number, x1: number, y1: number) => boolean) {
  const sorted = depthSort(items, it => it.box ?? itemBox(it));
  { const g = globalThis as any; if (g.__orderLog) g.__order = sorted.filter(it => it.id && inHouse(it.x0, it.y0, it.x1, it.y1)).map(it => ({ id: it.id, x0: it.x0, y0: it.y0, x1: it.x1, y1: it.y1, b: it.box ?? itemBox(it) })); }
  const PF = (globalThis as any).__prof as Record<string, number> | undefined, fl = PF && (globalThis as any).__flushItems;
  for (const it of sorted) if (inHouse(it.x0, it.y0, it.x1, it.y1)) {
    const t0 = fl ? performance.now() : 0;
    ctx.save(); try { it.draw(); } catch (e) { ErrorLog.add(e, 'desen obiect'); } ctx.restore();
    if (fl) { ctx.getImageData(0, 0, 1, 1); const k = 'o:' + (it.k ?? '?'); PF![k] = (PF![k] ?? 0) + performance.now() - t0; }
  }
}
/** peretii casei si gardul curtii (nu se misca): intra si ei in podeaua "coapta" */
let wallEntries: StaticEntry[] | null = null;
function houseEntries(): StaticEntry[] {
  if (wallEntries) return wallEntries;
  const L: StaticEntry[] = [];
  const wbox = (x0: number, y0: number, x1: number, y1: number, h: number): Box => ({ x0: iso(x0, y1).x - 6, x1: iso(x1, y0).x + 6, y0: iso(x0, y0).y - h - 8, y1: iso(x1, y1).y + 8 });
  for (const wl of AREAS.world.walls) {
    const r = wl.dir === 'x' ? { x0: wl.x, y0: wl.y - 0.05, x1: wl.x + 1, y1: wl.y } : { x0: wl.x - 0.05, y0: wl.y, x1: wl.x, y1: wl.y + 1 };
    L.push({ key: `wall:${wl.x},${wl.y},${wl.dir},${wl.kind}`, ...r, box: wbox(r.x0, r.y0, r.x1, r.y1, wl.h + 10), paint: (c, _st, night) => drawWall(c, wl, 0, night) });
  }
  const fence = (x: number, y: number, dir: 'x' | 'y', gate?: 'front' | 'back') => {
    const r = dir === 'x' ? { x0: x, y0: y - 0.02, x1: x + 1, y1: y } : { x0: x, y0: y, x1: x + 0.02, y1: y + 1 };
    L.push({ key: `fence:${x},${y},${dir}`, ...r, box: wbox(r.x0, r.y0, r.x1, r.y1, gate ? 90 : 40), paint: c => gate ? drawYardGate(c, x, y) : drawYardFence(c, x, y, dir) });
  };
  for (let x = 0; x < MAP_W; x++) fence(x, 0, 'x', x === BACK_GATE ? 'back' : undefined);
  for (let y = 0; y < YARD_H; y++) { fence(0, y, 'y'); fence(MAP_W, y, 'y'); }
  for (let x = 0; x < MAP_W; x++) fence(x, YARD_H, 'x', x === YARD_GATE ? 'front' : undefined);
  wallEntries = L; return L;
}
function furnEntry(f: Furn): StaticEntry {
  return { key: 'f:' + f.id, x0: f.gx, y0: f.gy, x1: f.gx + f.w, y1: f.gy + f.d, box: screenBox(f), flat: !f.solid && FLAT.has(f.type as string),
    paint: (c, st) => { const g = globalThis as any; const lay = layered(f); if (lay) g.__layer = 'body'; try { drawFurn(c, f, 0, st); } finally { if (lay) g.__layer = ''; } } };
}
const FLAT = new Set(['flowers', 'wildflower', 'lilypad', 'bridgegap', 'stonepath', 'heartstone', 'flowerbed', 'rug', 'doormat', 'soilplot', 'plot']);
/** lucrurile "coapte" din zona de dale data, care ating dreptunghiul de ecran */
function staticEntriesIn(scene: WorldScene, gx0: number, gy0: number, gx1: number, gy1: number, vx0: number, vy0: number, vx1: number, vy1: number): StaticEntry[] {
  const V = { x0: vx0, y0: vy0, x1: vx1, y1: vy1 };
  const out: StaticEntry[] = [];
  for (const f of furnIn(gx0, gy0, gx1, gy1)) if (bakeable(f)) { const e = furnEntry(f); if (overlap(e.box, V)) out.push(e); }
  if (scene.space === 'world') for (const e of houseEntries()) if (overlap(e.box, V)) out.push(e);
  return out;
}
/** deseneaza in bucata de podea [ox, ox+w] x [oy, oy+h] tot ce nu se misca si o atinge */
function bakeChunk(scene: WorldScene, c: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number, st: FurnState, night: number) {
  // obiectele inalte isi au locul mai jos pe ecran decat varful lor: cautam si sub bucata
  const cs = [unIso(ox, oy), unIso(ox + w, oy), unIso(ox, oy + h + 360), unIso(ox + w, oy + h + 360)];
  const gx0 = Math.min(...cs.map(q => q.x)) - 2, gx1 = Math.max(...cs.map(q => q.x)) + 2, gy0 = Math.min(...cs.map(q => q.y)) - 2, gy1 = Math.max(...cs.map(q => q.y)) + 2;
  const list = staticEntriesIn(scene, gx0, gy0, gx1, gy1, ox, oy, ox + w, oy + h);
  for (const e of list) if (e.flat) { c.save(); try { e.paint(c, st, night); } catch (err) { ErrorLog.add(err, 'copt decor'); } c.restore(); }
  const solid = depthSort(list.filter(e => !e.flat), e => e.box);
  for (const e of solid) { c.save(); try { e.paint(c, st, night); } catch (err) { ErrorLog.add(err, 'copt obiect'); } c.restore(); }
}
