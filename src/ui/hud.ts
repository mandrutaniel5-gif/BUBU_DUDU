// Interfata de joc (DOM peste canvas).
import { DESTS, DEST_BY_ID } from '../world/layout';
import * as Story from '../scenes/story';
import { MACHINES } from '../scenes/story';
import { FARM_CHAPTER, SHOP_CHAPTER } from '../game/economy';
import { TOWER_DOOR } from '../world/city';
import type { WorldScene } from '../scenes/world';
import { PAIRS } from '../scenes/world';
import { ANIM_LIST } from '../char/anims';
import { NEEDS, NEED_INFO, SICK_INFO, REQUESTS, clockText, nightAmount } from '../game/state';
import { Sfx } from '../engine/sfx';
import { ErrorLog } from '../engine/errors';
import { DEV } from '../game/dev';
import { moodText, g } from '../game/gender';
import { ITEMS, NO_OUTFIT } from '../char/outfit';
import { CATALOG, RES_INFO, type BuildItem, type Res } from '../world/build';
import { GOALS, CHAPTERS, chapterOf, currentGoal, INV_INFO, SHOP_BUY, SHOP_ONLINE, SHOP_SELL, SHOP_CITY, PRICE } from '../game/economy';
import { prodCode } from '../minigames/merge';
import { ITEM_NAMES, itemIconURL } from '../world/items';
import { RECIPES, RECIPE, canCook, missingFor, ingIcon, ingLabel, effectText, dishesOwned, dishCount, type Recipe } from '../game/food';
import { drawCharacter, SPECS } from '../char/draw';
import { basePose } from '../char/pose';
import { CROPS, seedKey, catCount, drawCropPlant, WET_MIN } from '../world/garden';
import { CRITTER_NAMES } from '../world/forest';
import type { NetStatus } from '../net/types';
import { drawMini, drawFull, topMapImage, mapGeom, type MapMarks, type MapPoi, type MapView } from './minimap';
import { FURNITURE } from '../world/map';
import { ORIGIN, REGION_BY_ID } from '../world/layout';


export class Hud {
  root: HTMLElement;
  private els: Record<string, HTMLElement> = {};
  private lastAction = '';

  constructor(private s: WorldScene) {
    ErrorLog.setToaster(t => this.toast(t));
    const me = s.me.actor.spec, pa = s.partner.actor.spec;
    const root = document.createElement('div');
    root.className = 'hud';
    const emotes = ANIM_LIST.filter(a => a.kind === 'emote' || a.kind === 'dance' || (a.kind === 'special' && a.who === s.myId));
    root.innerHTML = `
      <div class="card me">
        <div class="name">${me.id === 'bubu' ? '🐼' : '🐻'} ${me.name} <span class="mood"></span></div>
        <div class="needs">${NEEDS.map(n => `<div class="need" data-n="${n}" title="${NEED_INFO[n].label}"><span>${NEED_INFO[n].icon}</span><i><b style="background:${NEED_INFO[n].color}"></b></i></div>`).join('')}</div>
        <div class="sick hidden"></div>
      </div>
      <div class="clock"><span class="time">09:00</span><span class="day">Ziua 1</span><span class="hearts">💗 0</span><span class="money">💰 0</span><span class="res" data-inv></span></div>
      <button class="goal" data-a="goals"><b>📜 Obiectiv</b><span class="gtxt"></span></button>
      <div class="card partner">
        <div class="name">${pa.id === 'bubu' ? '🐼' : '🐻'} ${pa.name} <span class="pst">🤖 AI</span></div>
        <div class="pmood"></div>
        <div class="netline"><i class="dot"></i><span class="net">solo</span> <button class="mini-btn" data-a="menu">⚙</button>${DEV ? '<button class="mini-btn" data-a="skipch" title="Capitolul următor (test)">⏭</button><button class="mini-btn" data-a="infinite" title="Resurse infinite (test)">♾️</button>' : ''}<button class="mini-btn" data-a="albums" title="Albumele (pești, flori, rețete, haine)">📒</button></div>
      </div>
      <div class="actions">
        <button class="act big" data-a="action"><span class="ic">✋</span><span class="lb">Acțiune</span></button>
        <div class="row">
          <button class="act" data-a="emotes" title="Emote-uri (Q)"><span class="ic">😊</span></button>
          <button class="act" data-a="pairs" title="Împreună (R)"><span class="ic">💞</span></button>
          <button class="act fart" data-a="fart" title="Super-salt (F)"><span class="ic">💨</span><i class="fill"></i></button>
          <button class="act" data-a="build" title="Construiește (B)"><span class="ic">🔨</span></button>
          <button class="act scooter" data-a="scooter" title="Scuterul"><span class="ic">🛵</span></button>
        </div>
      </div>
      <div class="pop emotes hidden"><button class="popx" data-a="closepop" aria-label="Închide">✕</button><h4>Emote-uri & dansuri</h4><div class="grid">${emotes.map(a => `<button data-emote="${a.id}"><span>${a.icon}</span>${a.label}</button>`).join('')}</div></div>
      <div class="pop pairs hidden"><button class="popx" data-a="closepop" aria-label="Închide">✕</button><h4>Împreună 💞</h4><div class="grid">${PAIRS.filter(p => !p.only || p.only === s.myId).map(p => `<button data-pair="${p.id}"><span>${p.icon}</span>${p.label}</button>`).join('')}<button data-pair="follow" class="pfollow"><span>🚶</span><i>Vino cu mine</i></button></div></div>
      <canvas class="minimap" data-a="map" title="Harta (atinge: toată lumea)"></canvas><button class="mapsize" data-a="mapsize" title="Mărește / micșorează harta">⤢</button><button class="mapopen" data-a="map" title="Harta mare a lumii: toate clădirile">🗺️ Harta</button>
      <div class="regionbanner hidden"><span class="ri"></span><b class="rn"></b></div>
      <div class="ridebar hidden"><span class="rt"></span><div class="rbtns"><span class="rdest"></span><button data-a="rgo" class="go">▶ Pornește</button><button data-a="rpause">⏸ Oprește</button><button data-a="rback">↩ Întoarce</button><button data-a="rstop"></button><button data-a="rcall">📣 Cheamă</button><button data-a="roff">⬇ Coboară</button></div></div>
      <div class="buildbar hidden"><span class="bt"></span><button data-a="bok">✔ Pune</button><button data-a="bend">✖ Gata</button></div>
      <div class="toasts"></div>
      <div class="modal hidden"></div>
    `;
    document.getElementById('ui')!.appendChild(root);
    this.root = root;
    for (const sel of ['.me .mood', '.me .sick', '.clock .time', '.clock .day', '.clock .hearts', '.pst', '.pmood', '.net', '.dot', '[data-a="action"]', '.emotes', '.pairs', '.toasts', '.modal', '.fart .fill', '[data-a="pairs"]']) this.els[sel] = root.querySelector(sel)!;
    root.addEventListener('click', e => {
      if ((e.target as HTMLElement).closest('[data-inv]')) { this.openInventory(); return; }
      if ((e.target as HTMLElement).closest('.clock .day')) { Sfx.unlock(); Sfx.play('click'); this.openDay(); return; }
      const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null; if (!b) return;
      Sfx.unlock(); Sfx.play('click');
      const a = b.dataset.a;
      if (a === 'action') s.doAction();
      if (a === 'closepop') { this.closeMenus(); return; }
      if (a === 'emotes') this.toggleEmotes();
      if (a === 'pairs') this.togglePairs();
      if (a === 'fart') s.fartJump();
      if (a === 'bell') s.ringBell();
      if (a === 'build') s.build ? s.endBuild() : this.openBuild();
      if (a === 'rgo') s.rideStart();
      if (a === 'rpause') s.ridePause();
      if (a === 'rback') s.rideBack();
      if (a === 'rstop' && b.dataset.dest) s.rideStopAt(b.dataset.dest);
      if (b.dataset.go) s.rideTo(b.dataset.go);
      if (a === 'rcall') s.rideCall();
      if (a === 'roff') s.rideOff();
      if (a === 'bok') s.confirmBuild();
      if (a === 'scooter') s.toggleScooter();
      if (a === 'goals') this.openGoals();
      if (a === 'map') this.openMap();
      if (a === 'mapsize') { this.mapBig = !this.mapBig; try { localStorage.setItem('bd-mapbig', this.mapBig ? '1' : ''); } catch { /* */ } this.layoutMinimap(true); }
      if (a === 'inv') this.openInventory();
      if (a === 'bend') s.endBuild();
      if (a === 'menu') { s.save(); (window as any).game.go('menu'); }
      if (a === 'albums') Story.openAlbums(s);
      // butoanele de test, la vedere (cerute de proprietar): confirmarea se face in fereastra jocului
      if (a === 'skipch') s.choice('⏭️ Capitolul următor', 'Treceți la capitolul următor? Obiectivele de acum se bifează singure (pentru testare).', [['⏭️', 'Da, capitolul următor', () => s.devSkipChapter()], ['✖', 'Nu acum', () => {}]]);
      if (a === 'infinite') { s.setInfinite(!s.infinite); this.toast(s.infinite ? '♾️ Resurse infinite pornite (doar pe acest dispozitiv)' : 'Resurse infinite oprite'); }
      if (b.dataset.emote) s.emote(b.dataset.emote);
      if (b.dataset.pair) s.pairAction(b.dataset.pair);
      if (b.dataset.close !== undefined) this.closeModal();
    });
    root.addEventListener('pointerdown', e => e.stopPropagation());
  }

  destroy() { this.root.remove(); }

  /** scrie in pagina doar daca s-a schimbat (altfel telefonul redeseneaza meniul degeaba -> baterie) */
  private txt(el: Element | null, t: string) { const e = el as HTMLElement | null; if (e && e.dataset.t !== t) { e.dataset.t = t; e.textContent = t; } }
  private lastUpd = 0;
  /** semnele de pe harta: tu, partenerul, vehiculele parcate */
  mapMarks(): MapMarks {
    const s = this.s, tower = TOWER_DOOR;
    const me = s.space === 'apartment' ? tower : { x: s.me.gx, y: s.me.gy };
    const ps = s.partnerSpace(), pa = ps === 'apartment' ? tower : { x: s.partner.gx, y: s.partner.gy };
    const vehicles: MapMarks['vehicles'] = [];
    for (const k of ['bike', 'scooter', 'tractor'] as const) {
      if (k === 'tractor' ? s.chapter < 2 : !((s.w.stats[k] ?? 0) > 0)) continue;
      if ((s.me.riding && s.me.rideKind === k) || (s.partner.riding && s.partner.rideKind === k)) continue;
      const sp = s.parkSpot(k, s.vehAt(k)); vehicles.push({ x: sp.gx + 0.5, y: sp.gy + 0.5, icon: k === 'bike' ? '🚲' : k === 'scooter' ? '🛵' : '🚜' });
    }
    return { me: { ...me, name: s.me.actor.spec.name }, partner: { ...pa, name: s.partner.actor.spec.name }, vehicles, t: s.time };
  }
  private miniT = 0;
  /** miniharta marita (se tine minte pe fiecare telefon) */
  /** harta mare: ultima marire (la redeschidere se centreaza pe tine) */
  mapView: MapView | null = null;
  mapBig = (() => { try { return !!localStorage.getItem('bd-mapbig'); } catch { return false; } })();
  private mapLayoutAt = 0; private mapKey = '';
  /**
   * locul minihartii: sub cartonasul partenerului, aliniata la dreapta lui, si niciodata peste butoanele de jos.
   * Mica: cat cartonasul (cel mult 150 px). Marita: mai lata si mai inalta, cat incape pana la butoane.
   */
  layoutMinimap(force = false) {
    const cv = this.root.querySelector('.minimap') as HTMLCanvasElement | null, btn = this.root.querySelector('.mapsize') as HTMLElement | null; if (!cv || !btn) return;
    if (!force && performance.now() - this.mapLayoutAt < 700) return; this.mapLayoutAt = performance.now();
    const R = this.root.getBoundingClientRect();
    let card = (this.els['.pst'] as HTMLElement | undefined) ?? null; while (card && card.parentElement && card.parentElement !== this.root) card = card.parentElement;
    const cr = card?.getBoundingClientRect(), act = (this.root.querySelector('[data-a="action"]') as HTMLElement | null)?.getBoundingClientRect();
    const gw = R.width, gh = R.height;
    const right = cr ? Math.max(6, R.right - cr.right) : 10, top = cr ? cr.bottom - R.top + 8 : 96;
    const bottomLimit = (act && act.height ? act.top - R.top : gh - 90) - 10;
    const cardW = cr ? cr.width : 140;
    let w = this.mapBig ? Math.min(gw * 0.42, 340) : Math.min(cardW, 150), h = this.mapBig ? Math.min(240, bottomLimit - top) : Math.min(92, bottomLimit - top);
    w = Math.max(90, w); h = Math.max(56, h);
    const key = `${right}|${top}|${w}|${h}`; if (key === this.mapKey) return; this.mapKey = key;
    Object.assign(cv.style, { right: right + 'px', top: top + 'px', width: w + 'px', height: h + 'px' });
    Object.assign(btn.style, { right: (right + 4) + 'px', top: (top + h - 26) + 'px' });
    const mo = this.root.querySelector('.mapopen') as HTMLElement | null; if (mo) Object.assign(mo.style, { right: (right + w - 74) + 'px', top: (top + h - 26) + 'px' });
    btn.textContent = this.mapBig ? '⤡' : '⤢';
  }
  drawMinimap() {
    const cv = this.root.querySelector('.minimap') as HTMLCanvasElement | null; if (!cv) return;
    const show = this.s.chapter > 0;
    const btn = this.root.querySelector('.mapsize') as HTMLElement | null;
    if ((cv.style.display !== 'none') !== show) { cv.style.display = show ? '' : 'none'; if (btn) btn.style.display = show ? '' : 'none'; const mo = this.root.querySelector('.mapopen') as HTMLElement | null; if (mo) mo.style.display = show ? '' : 'none'; }
    if (!show) return;
    this.layoutMinimap();
    const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const c = cv.getContext('2d')!; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMini(c, W, H, this.mapMarks(), this.mapBig ? (this.s.ride ? 0.5 : 0.65) : (this.s.ride ? 0.55 : 0.8), this.mapBig);
  }
  /** „Unde e?”: locurile pe care jucatorii noi nu le gasesc, cu ce faci acolo si un buton care te duce */
  placesHtml() {
    const s = this.s;
    return `<h4>📍 Unde e?</h4><ul class="goals places">${PLACES.map(p => { const lock = p.ch && s.chapter < p.ch; return `<li class="${lock ? 'lock' : ''}"><b>${p.icon} ${p.name}</b><small>${p.where} · ${p.what}${lock ? ` · 🔒 din Capitolul ${p.ch}` : ''}</small><button data-place="${p.id}" ${lock ? 'class="off"' : ''}>🚶 Du-mă</button></li>`; }).join('')}</ul>`;
  }
  /** „Ziua X” de sus: sarbatorile si evenimentele de azi, ce urmeaza, ce e de facut — oricand, nu doar dimineata */
  lastMorning: string[] = []; morningDay = -1;
  openDay() {
    const s = this.s, day = s.w.day, se = Story.seasonOf(day), ev = Story.eventsOf(day);
    const next: string[] = [];
    for (let d = day + 1; d <= day + 10 && next.length < 4; d++) for (const e of Story.eventsOf(d)) next.push(`<li><b>${e.icon} ${esc(e.name)}</b><small>${d - day === 1 ? 'mâine' : `în ${d - day} zile (ziua ${d})`} · ${esc(e.text)}</small></li>`);
    const todo = Story.todoLines(s);
    const rep = this.morningDay === day ? this.lastMorning.slice(1).filter(l => !ev.some(e => l.startsWith(e.icon + ' ' + e.name)) && !todo.includes(l)) : [];
    this.modal(`<h3>📅 Ziua ${day}</h3><p class="sub">${se.icon} ${esc(se.name)}, ziua ${Story.dayOfSeason(day)} · ${clockText(s.w.minutes)}</p>
      <h4>Azi</h4><ul class="goals">${ev.length ? ev.map(e => `<li><b>${e.icon} ${esc(e.name)}</b><small>${esc(e.text)}</small></li>`).join('') : '<li><small>Nicio sărbătoare sau eveniment azi: o zi obișnuită 🙂</small></li>'}</ul>
      ${todo.length ? `<h4>De făcut azi</h4><ul class="log">${todo.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${rep.length ? `<h4>Raportul de dimineață</h4><ul class="log">${rep.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <h4>Urmează</h4><ul class="goals">${next.join('') || '<li><small>Nimic special în următoarele 10 zile</small></li>'}</ul>
      <button data-daymap>🗺️ Unde sunt locurile (harta)</button>`).querySelector('[data-daymap]')?.addEventListener('click', () => this.openMap());
  }
  /** toate cladirile si locurile pentru harta mare (major = se vad si cand harta e mica) */
  mapPois(): MapPoi[] {
    const s = this.s, list = s.space === 'world' ? s.furnList : FURNITURE;
    const out: MapPoi[] = [{ id: 'home', x: 8, y: 7, icon: '🏡', name: 'Acasă', label: 'Casa voastră', major: false }];
    const seen = new Set<string>();
    for (const f of list) {
      const a = f.action, t = f.type as string; if (!a?.id || !a.icon) continue;
      if (!MAP_TYPES.has(t) && !(a.id.startsWith('st-') && !['st-parcel', 'st-roof', 'st-fieldsign'].includes(a.id)) && !MAP_IDS.has(f.id)) continue;
      const key = a.id + (a.id.startsWith('st-') && a.id !== 'st-flot' ? '' : f.id); if (seen.has(key)) continue; seen.add(key);
      const visit = /^Bate la u(ș|s)a: (.+)$/.exec(a.label);
      const name = MAP_NAMES[f.id] ?? (visit ? 'Casa: ' + visit[2] : a.label.replace(/\s*\(.*\)\s*/g, '').replace(/^(Intră în bloc|Aruncă o monedă)$/, m => m === 'Aruncă o monedă' ? 'Fântâna' : 'Blocul (apartamentul)'));
      out.push({ id: f.id, x: f.gx + f.w / 2, y: f.gy + f.d / 2, icon: visit ? '🏠' : a.icon, name, label: visit ? `Casa lui ${visit[2]}: bate la ușă și vorbiți` : a.label, major: !visit && !MAP_LABELED.has(f.id) && !['busstop', 'taxistand', 'cfountain', 'fountain', 'icecart', 'noticeboard', 'carousel', 'gazebo', 'pier'].includes(t) });
    }
    return out;
  }
  /** harta mare (toata lumea) */
  openMap() {
    const s = this.s;
    const r = s.space === 'apartment' ? null : REGION_BY_ID[s.area];
    const m = this.modal(`<h3>🗺️ Harta lumii</h3><p class="sub">${r ? `Ești ${WHERE[s.area]?.replace(' · ', '') ?? r.name}` : 'Ești în apartament (Blocul Lalelelor)'} · trage cu degetul, mărește cu ＋ și atinge o clădire</p><div class="bigmapwrap"><canvas class="bigmap"></canvas><div class="mapzoom"><button data-z="in" aria-label="Mărește">＋</button><button data-z="out" aria-label="Micșorează">－</button><button data-z="me" aria-label="Unde sunt">📍</button></div></div><div class="mapinfo"><small>👆 Atinge o iconiță ca să vezi ce clădire e</small></div>${s.space === 'world' ? this.placesHtml() : ''}<div class="mapgo">${s.space === 'world' ? DESTS.map(d => `<button data-mapgo="${d.id}" class="${s.reachWhy(d.id) ? 'off' : ''}">${d.icon} ${d.name}</button>`).join('') : ''}</div>`);
    m.querySelector('.box')?.classList.add('mapbox');
    m.querySelectorAll('[data-mapgo]').forEach(b => b.addEventListener('click', () => { this.closeModal(); s.mapGo((b as HTMLElement).dataset.mapgo!); }));
    m.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => { const p = PLACES.find(x => x.id === (b as HTMLElement).dataset.place)!; const lock = p.ch && s.chapter < p.ch; if (lock) { this.toast(`🔒 ${p.name}: din Capitolul ${p.ch}`); Sfx.play('bad'); return; } this.closeModal(); s.walkToPlace(p.x, p.y, `${p.icon} ${p.name}`); }));
    const cv = m.querySelector('.bigmap') as HTMLCanvasElement, info = m.querySelector('.mapinfo') as HTMLElement;
    const pois = this.mapPois(), me0 = this.mapMarks().me;
    const view: MapView = this.mapView ?? { z: 1, cx: me0.x, cy: me0.y }; view.cx = me0.x; view.cy = me0.y; this.mapView = view;
    let sel = '';
    const zoomAt = (f: number, sx?: number, sy?: number) => {
      const W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
      const G = mapGeom(W, H, view), a = G.inv(sx ?? W / 2, sy ?? H / 2);
      view.z = Math.max(1, Math.min(8, view.z * f));
      const G2 = mapGeom(W, H, view), b = G2.inv(sx ?? W / 2, sy ?? H / 2); view.cx += a.x - b.x; view.cy += a.y - b.y;
    };
    const pick = (sx: number, sy: number) => {
      const G = mapGeom(cv.clientWidth, cv.clientHeight, view), zoomed = G.px >= 6;
      let best: MapPoi | null = null, bd = 22;
      for (const p of pois) { if (!zoomed && !p.major) continue; const q = G.P(p.x, p.y), d = Math.hypot(q.x - sx, q.y - sy); if (d < bd) { bd = d; best = p; } }
      sel = best?.id ?? '';
      if (!best) { info.innerHTML = '<small>👆 Atinge o iconiță ca să vezi ce clădire e (mărește cu ＋ pentru toate casele)</small>'; return; }
      const why = s.space === 'world' ? s.reachWhyAt(best.x, best.y) : 'Ieși întâi din apartament';
      info.innerHTML = `<b>${esc(best.icon)} ${esc(best.label)}</b>${why ? `<small>${esc(why)}</small>` : ''}<button data-walk ${why ? 'class="off"' : ''}>🚶 Du-mă</button>`;
      Sfx.play('click', { vol: 0.4 });
      info.querySelector('[data-walk]')?.addEventListener('click', () => {
        if (why) { this.toast(why); Sfx.play('bad'); return; }
        this.closeModal();
        if (best!.id === 'home') s.walkToPlace(4.5, 13.6, '🏡 Acasă'); else s.walkToFurn(best!.id, `${best!.icon} ${best!.name}`);
      });
    };
    m.querySelectorAll('[data-z]').forEach(b => b.addEventListener('click', () => { const z = (b as HTMLElement).dataset.z; if (z === 'me') { const q = this.mapMarks().me; view.z = Math.max(view.z, 3); view.cx = q.x; view.cy = q.y; } else zoomAt(z === 'in' ? 1.6 : 1 / 1.6); Sfx.play('click', { vol: 0.4 }); }));
    // degetul: tragi harta, doua degete = mărești; o atingere scurta = alegi cladirea
    const pts = new Map<number, { x: number; y: number }>(); let moved = 0, pinch0 = 0;
    const rel = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, rel(e)); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); } });
    cv.addEventListener('pointermove', e => {
      const o = pts.get(e.pointerId); if (!o) return; const q = rel(e);
      if (pts.size === 1) { const G = mapGeom(cv.clientWidth, cv.clientHeight, view); view.cx -= (q.x - o.x) / G.px; view.cy -= (q.y - o.y) / G.px; moved += Math.abs(q.x - o.x) + Math.abs(q.y - o.y); }
      pts.set(e.pointerId, q);
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) zoomAt(d / pinch0, (a.x + b.x) / 2, (a.y + b.y) / 2); pinch0 = d; moved += 99; }
    });
    const up = (e: PointerEvent) => { const q = rel(e); if (pts.has(e.pointerId) && pts.size === 1 && moved < 8) pick(q.x, q.y); pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => { pts.delete(e.pointerId); pinch0 = 0; });
    cv.addEventListener('wheel', e => { e.preventDefault(); const q = { x: e.offsetX, y: e.offsetY }; zoomAt(e.deltaY < 0 ? 1.25 : 0.8, q.x, q.y); }, { passive: false });
    cv.addEventListener('dblclick', e => zoomAt(2, e.offsetX, e.offsetY));
    const tick = () => {
      if (m.classList.contains('hidden') || !cv.isConnected) return;
      const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (W && H) { if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); } const c = cv.getContext('2d')!; c.setTransform(dpr, 0, 0, dpr, 0, 0); drawFull(c, W, H, this.mapMarks(), view, pois, sel); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  update() {
    if ((this.miniT += 1) % 2 === 0) this.drawMinimap();
    // meniul se actualizeaza de ~8 ori pe secunda (nu la fiecare cadru)
    const now = performance.now(); if (now - this.lastUpd < 125) return; this.lastUpd = now;
    this.updateRide();
    const s = this.s, w = s.w, c = w.chars[s.myId];
    for (const n of NEEDS) {
      const el = this.root.querySelector(`.me [data-n="${n}"] b`) as HTMLElement;
      const v = Math.round(c.needs[n]) + '%'; if (el.dataset.v !== v) { el.dataset.v = v; el.style.width = v; }
      el.parentElement!.parentElement!.classList.toggle('low', c.needs[n] < 25);
    }
    this.txt(this.els['.me .mood'], moodText(s.myId, s.me.actor.mood));
    const sk = this.els['.me .sick'];
    sk.classList.toggle('hidden', !c.sick);
    if (c.sick) { const t = `${SICK_INFO[c.sick].icon} ${SICK_INFO[c.sick].label}${c.request ? ' · vrei ' + (REQUESTS[c.request]?.icon ?? '') : ''}`; if (sk.dataset.t !== t) { sk.dataset.t = t; sk.innerHTML = `${t} <button class="mini-btn" data-a="bell">🔔 Cheamă</button>`; } }
    this.txt(this.els['.clock .time'], (nightAmount(w.minutes) > 0.5 ? '🌙 ' : '☀️ ') + clockText(w.minutes));
    { const se = Story.seasonOf(w.day), ev = Story.eventsOf(w.day)[0]; this.txt(this.els['.clock .day'], `${se.icon} Ziua ${w.day}${ev ? ' · ' + ev.icon : ''} 📅`); }
    this.txt(this.els['.clock .hearts'], `💗 ${w.hearts}`);
    this.txt(this.root.querySelector('.clock .money'), `💰 ${w.money ?? 0} lei`);
    const rs = (this.root.querySelector('.clock .res') as HTMLElement); const R = w.res ?? {}; const seeds = Object.keys(CROPS).reduce((a, c) => a + (R[seedKey(c)] ?? 0), 0); const rt = `🪵${R.wood ?? 0} 🪨${R.stone ?? 0} 🥕${catCount(R, 'veg')} 🌸${catCount(R, 'flower')} 🍲${dishCount(R)} 💧${R.water ?? 0} 🌰${seeds} · 🔥${Math.round((w.furn.fire as number) ?? 0)}% 🎒`; this.txt(rs, rt);
    const pc = w.chars[s.partner.id];
    const far = !s.sameArea() || Math.hypot(s.partner.gx - s.me.gx, s.partner.gy - s.me.gy) > 14;
    const where = !far ? '' : s.partner.riding && s.sameArea() ? '🛣️ pe drum · ' : (WHERE[s.partnerArea()] ?? '');
    this.txt(this.els['.pmood'], where + moodText(s.partner.id, s.partner.actor.mood) + (pc.sick ? ` · ${SICK_INFO[pc.sick].icon} ${g(s.partner.id, 'bolnav', 'bolnavă')}` : ''));
    { const f = this.els['.fart .fill'] as HTMLElement, v = Math.round(c.fart) + '%'; if (f.dataset.v !== v) { f.dataset.v = v; f.style.height = v; } }
    this.els['[data-a="pairs"]'].classList.toggle('glow', s.nearPartner());
    { const fb = this.root.querySelector('.pfollow') as HTMLElement | null; if (fb) { const show = s.partner.control !== 'remote'; if ((fb.style.display !== 'none') !== show) fb.style.display = show ? '' : 'none'; this.txt(fb.querySelector('i') as HTMLElement, s.partner.follow ? 'Rămâi aici' : 'Vino cu mine'); } }
    { const sc = this.root.querySelector('.act.scooter') as HTMLElement; if (sc.style.display !== 'none') sc.style.display = 'none'; } // vehiculele se folosesc de la poarta
    (this.root.querySelector('.act.scooter') as HTMLElement).classList.toggle('glow', !!s.me.riding);
    // butonul de actiune
    let label = '…', icon = '✋';
    if (s.me.activity) { label = 'Oprește'; icon = '⏹'; }
    else {
      const f = s.nearestFurn(s.me); const act = f && s.actionFor(f);
      if (act) { label = act.label; icon = act.icon; }
      else if (s.nearCritter()) { const c = s.nearCritter()!; label = 'Mângâie ' + CRITTER_NAMES[c.kind].toLowerCase(); icon = '🤗'; }
      else if (s.nearVillager()) { label = 'Vorbește cu ' + s.nearVillager()!.name; icon = '💬'; }
      else if (s.nearPartner()) { label = 'Împreună'; icon = '💞'; }
    }
    const key = icon + label;
    if (key !== this.lastAction) {
      this.lastAction = key;
      const b = this.els['[data-a="action"]'];
      b.querySelector('.ic')!.textContent = icon; b.querySelector('.lb')!.textContent = label;
      b.classList.toggle('dim', label === '…');
    }
  }

  setNet(st: NetStatus, msg?: string) {
    const names: Record<string, string> = { solo: 'Solo', local: 'Test 2 tab-uri', server: 'Server', firebase: 'Firebase' };
    const t = this.s.net.kind;
    this.els['.net'].textContent = `${names[t] ?? t}: ${st === 'online' ? 'conectat' : st === 'connecting' ? 'se conectează…' : st === 'error' ? 'eroare' : 'offline'}`;
    this.els['.dot'].className = 'dot ' + st;
    if (msg && st === 'error') this.toast('⚠️ ' + msg);
  }
  setPartner(on: boolean) { this.els['.pst'].textContent = on ? '🟢 online' : '🤖 AI'; }

  toast(text: string) {
    const box = this.els['.toasts'];
    // acelasi mesaj de doua ori -> nu il dublam; maxim 3 mesaje odata (cele vechi pleaca)
    for (const o of box.children) if ((o as HTMLElement).dataset.t === text && !o.classList.contains('out')) return;
    while (box.children.length >= 3) box.firstElementChild!.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; t.dataset.t = text;
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3600); setTimeout(() => t.remove(), 4200);
  }

  toggleEmotes() { this.els['.pairs'].classList.add('hidden'); this.els['.emotes'].classList.toggle('hidden'); }
  togglePairs(force?: boolean) { this.els['.emotes'].classList.add('hidden'); if (force) this.els['.pairs'].classList.remove('hidden'); else this.els['.pairs'].classList.toggle('hidden'); }
  closeMenus() { this.els['.emotes'].classList.add('hidden'); this.els['.pairs'].classList.add('hidden'); }

  modal(html: string) { this.closeMenus(); const m = this.els['.modal']; m.innerHTML = `<div class="box"><button class="xclose" data-close aria-label="Închide">✕</button>${html}<button class="close" data-close>Închide</button></div>`; m.classList.remove('hidden'); return m; }
  closeModal() { this.els['.modal'].classList.add('hidden'); }

  /** ferestrele care vin singure (raportul, capitolul nou) asteapta sa termini minijocul: nu apar peste el */
  whenFree(fn: () => void) { const m = this.s.minigame; if (m && m.id !== 'cutscene') { setTimeout(() => this.whenFree(fn), 800); return; } fn(); }
  showLog(items: string[], title = '💭 Cât ai lipsit…') {
    if (title.includes('Bună dimineața')) { this.lastMorning = items; this.morningDay = this.s.w.day; }
    if (this.s.minigame && this.s.minigame.id !== 'cutscene') { this.whenFree(() => this.showLog(items, title)); return; }
    this.modal(`<h3>${title}</h3><ul class="log">${items.slice(-12).map(i => `<li>${esc(i)}</li>`).join('')}</ul>`);
  }

  openJar() {
    const s = this.s;
    const items = [...s.w.jar].reverse().slice(0, 30);
    const m = this.modal(`<h3>🫙 Borcanul cu iubire</h3>
      <p class="sub">Scrie-i ceva frumos lui ${s.partner.actor.spec.name}. Rămâne aici pentru totdeauna 💕</p>
      <textarea maxlength="280" placeholder="Te iubesc pentru că…"></textarea>
      <button class="send">Trimite 💌</button>
      <div class="jar">${items.map(j => `<div class="note ${j.from}"><b>${j.from === 'bubu' ? '🐼 Bubu' : '🐻 Dudu'}</b><span>${esc(j.text)}</span><small>${new Date(j.ts).toLocaleString('ro-RO')}</small></div>`).join('') || '<p class="sub">Încă e gol… fii primul/prima! 🥺</p>'}</div>`);
    m.querySelector('.send')!.addEventListener('click', () => {
      const ta = m.querySelector('textarea') as HTMLTextAreaElement; const text = ta.value.trim(); if (!text) return;
      s.op({ k: 'jar', from: s.myId, text, ts: Date.now() });
      s.op({ k: 'need', who: s.myId, need: 'love', delta: 10 });
      s.op({ k: 'hearts', delta: 5 });
      s.log(`${s.me.actor.spec.name} ți-a lăsat un bilețel în Borcanul cu iubire 💌`);
      s.me.actor.play('love'); Sfx.play('good');
      this.openJar();
    });
  }

  openWardrobe() {
    const s = this.s; const c = s.w.chars[s.myId];
    c.owned ??= []; c.outfit ??= { ...NO_OUTFIT };
    const slots: Record<string, string> = { body: 'Haine', head: 'Pe cap', face: 'Pe față', neck: 'La gât' };
    const mine = ITEMS.filter(i => c.owned!.includes(i.id));
    const m = this.modal(`<h3>👗 Garderoba lui ${s.me.actor.spec.name}</h3><p class="sub">Haine noi găsești la <b>Croitoria din sat</b> 🧵 (cele elegante, la oraș)</p>
      ${mine.length ? Object.entries(slots).map(([slot, name]) => { const list = mine.filter(i => i.slot === slot); return list.length ? `<h4>${name}</h4><div class="shop">${list.map(i => { const on = (c.outfit as any)[slot] === i.id; return `<button data-item="${i.id}" class="${on ? 'on' : ''}"><span>${this.preview(i.id)}</span><b>${i.label}</b><small>${on ? '✔ porți' : 'Îmbracă'}</small></button>`; }).join('')}</div>` : ''; }).join('') : '<p>Dulapul e gol… 🙂</p>'}`);
    m.querySelectorAll('[data-item]').forEach(b => b.addEventListener('click', () => {
      const it = ITEMS.find(i => i.id === (b as HTMLElement).dataset.item)!;
      const cur = (c.outfit as any)[it.slot];
      (c.outfit as any)[it.slot] = cur === it.id ? 'none' : it.id;
      s.sendCharSync(); s.me.actor.play('shy'); Sfx.play('pop');
      this.openWardrobe();
    }));
  }

  /** Primaria satului: afacerile voastre */
  openHall() {
    const s = this.s, w = s.w, r = w.res ?? {};
    const deals = [
      { id: 'florarie', icon: '💐', label: 'Florăria lui Bubu', desc: 'Clienții vin foarte des după buchete (ieftine, dar multe)', cost: { money: PRICE.florarie } },
      { id: 'workshop', icon: '🪚', label: 'Tâmplăria lui Dudu', desc: 'Faceți mobilier din lemn și îl vindeți', cost: { money: PRICE.workshop, wood: PRICE.workshopWood } },
    ];
    const m = this.modal(`<h3>🏛️ Primăria satului</h3><p class="sub">Ai 💰 ${w.money ?? 0} lei · 🪵 ${r.wood ?? 0} lemne. Primarul vă dă autorizații pentru afaceri.</p>
      <div class="shop">${deals.map(d => { const own = (w.stats[d.id] ?? 0) > 0; return `<button data-deal="${d.id}" class="${own ? 'on' : ''}"><span>${d.icon}</span><b>${d.label}</b><small>${own ? '✔ a voastră' : `💰 ${d.cost.money}${d.cost.wood ? ' · 🪵 ' + d.cost.wood : ''}`}</small><small>${d.desc}</small></button>`; }).join('')}
      <button class="poor"><span>🏡</span><b>Casa cea mare</b><small>în curând (Capitolul 4)</small></button></div>`);
    m.querySelectorAll('[data-deal]').forEach(b => b.addEventListener('click', () => {
      const d = deals.find(x => x.id === (b as HTMLElement).dataset.deal)!; if ((w.stats[d.id] ?? 0) > 0) return;
      if ((w.money ?? 0) < d.cost.money || (r.wood ?? 0) < (d.cost.wood ?? 0)) { this.toast('Încă nu ajung banii sau lemnele 💪'); Sfx.play('bad'); return; }
      s.op({ k: 'money', delta: -d.cost.money }); if (d.cost.wood) s.op({ k: 'res', res: 'wood', delta: -d.cost.wood });
      s.op({ k: 'stat', key: d.id, delta: 1 }); Sfx.play('good'); s.me.actor.play('dance_hop');
      this.toast(`🎉 ${d.label} e a voastră!`); s.log(`Ați cumpărat ${d.label} ${d.icon}`); this.openHall();
    }));
  }

  /** Tamplaria lui Dudu: mobilier din lemn */
  openWorkshop() {
    const s = this.s, w = s.w, r = w.res ?? {};
    const recipes: { id: string; icon: string; label: string; need: Record<string, number>; pay: number }[] = [
      { id: 'birdhouse', icon: '🐦', label: 'Căsuță pentru păsări', need: { wood: 3, flower: 1 }, pay: 20 },
      { id: 'chair', icon: '🪑', label: 'Scăunel', need: { wood: 4 }, pay: 24 },
      { id: 'table', icon: '🪵', label: 'Măsuță', need: { wood: 8 }, pay: 50 },
      { id: 'swing', icon: '🎠', label: 'Leagăn de grădină', need: { wood: 10, stone: 2 }, pay: 75 },
      { id: 'cradle', icon: '🍼', label: 'Leagăn de bebeluș', need: { wood: 14, flower: 3 }, pay: 115 },
    ];
    const bonus = (s.myId === 'dudu' ? 1.3 : 1) * ((s.w.stats['dipl-tamplar-' + s.myId] ?? 0) > 0 ? 1.3 : 1); // cursul de tamplar: +30%
    const need = (n: Record<string, number>) => Object.entries(n).map(([k, v]) => `${k === 'wood' ? '🪵' : k === 'stone' ? '🪨' : '🌸'}${v}`).join(' ');
    const m = this.modal(`<h3>🪚 Tâmplăria lui Dudu</h3><p class="sub">Ai 🪵 ${r.wood ?? 0} · 🪨 ${r.stone ?? 0} · 🌸 ${r.flower ?? 0}. ${s.myId === 'dudu' ? 'Ești meșterul: +30% la preț 💪' : 'Dudu e meșterul, dar te descurci și tu 🙂'}</p>
      <div class="shop">${recipes.map(rc => { const ok = Object.entries(rc.need).every(([k, v]) => (r[k] ?? 0) >= v); return `<button data-rc="${rc.id}" class="${ok ? '' : 'poor'}"><span>${rc.icon}</span><b>${rc.label}</b><small>${need(rc.need)} → 💰 ${Math.round(rc.pay * bonus)} lei</small></button>`; }).join('')}</div>`);
    m.querySelectorAll('[data-rc]').forEach(b => b.addEventListener('click', () => {
      const rc = recipes.find(x => x.id === (b as HTMLElement).dataset.rc)!;
      if (!Object.entries(rc.need).every(([k, v]) => (r[k] ?? 0) >= v)) { this.toast('Nu ai destule materiale 🪵'); Sfx.play('bad'); return; }
      for (const [k, v] of Object.entries(rc.need)) s.op({ k: 'res', res: k, delta: -v });
      const pay = Math.round(rc.pay * bonus); s.op({ k: 'money', delta: pay }); s.op({ k: 'stat', key: 'crafted', delta: 1 });
      Sfx.play('saw', { vol: 0.6 }); Sfx.play('hammer', { delay: 0.6 }); Sfx.play('hammer', { delay: 0.85 }); setTimeout(() => Sfx.play('coin'), 1100); s.me.actor.play('flex');
      this.toast(`${rc.icon} ${rc.label} gata și vândut: +${pay} lei!`); this.openWorkshop();
    }));
  }

  /** magazinul de haine (Croitoria din sat / buticul de la oras) */
  openClothes(tier: 'sat' | 'oras') {
    const s = this.s; const c = s.w.chars[s.myId];
    c.owned ??= []; c.outfit ??= { ...NO_OUTFIT };
    const list = ITEMS.filter(i => i.shop === tier);
    const m = this.modal(`<h3>${tier === 'sat' ? '🧵 Croitoria din sat' : '🛍️ Buticul de la oraș'}</h3><p class="sub">Ai 💰 ${s.w.money ?? 0} lei · cumperi pentru ${s.me.actor.spec.name}</p>
      <div class="shop">${list.map(i => { const own = c.owned!.includes(i.id); return `<button data-cl="${i.id}" class="${own ? 'on' : (s.w.money ?? 0) < i.price ? 'poor' : ''}"><span>${this.preview(i.id)}</span><b>${i.label}</b><small>${own ? '✔ al tău' : '💰 ' + i.price + ' lei'}</small></button>`; }).join('')}</div>`);
    m.querySelectorAll('[data-cl]').forEach(b => b.addEventListener('click', () => {
      const it = ITEMS.find(i => i.id === (b as HTMLElement).dataset.cl)!;
      if (!c.owned!.includes(it.id)) {
        if ((s.w.money ?? 0) < it.price) { this.toast('Nu ajung banii 💰'); Sfx.play('bad'); return; }
        s.op({ k: 'money', delta: -it.price }); c.owned!.push(it.id); s.op({ k: 'stat', key: 'clothesBought', delta: 1 }); Sfx.play('cloth'); Sfx.play('register', { delay: 0.3 });
      }
      (c.outfit as any)[it.slot] = it.id; s.sendCharSync(); s.me.actor.play('shy');
      this.openClothes(tier);
    }));
  }


  openBuild() {
    const s = this.s; const r = s.w.res ?? {};
    const cost = (it: BuildItem) => Object.entries(it.cost).map(([k, n]) => `${RES_INFO[k as Res].icon}${n}`).join(' ');
    const m = this.modal(`<h3>🔨 Construim împreună</h3>
      <p class="sub">Ai ${(Object.keys(RES_INFO) as Res[]).map(k => `${RES_INFO[k].icon} ${r[k] ?? 0}`).join(' · ')}. Strânge din curte: copaci 🪓, pietre ⛏️, flori 🌸. Curtea o aranjezi cum vrei: muți sau scoți copacii și pietrele.</p>
      <div class="shop">${CATALOG.map(it => `<button data-b="${it.type}" class="${s.canAfford(it) ? '' : 'poor'}"><span>${it.icon}</span><b>${it.label}${it.coop ? ' 💞' : ''}</b><small>${cost(it)}</small></button>`).join('')}
      <button data-b="__remove"><span>🧹</span><b>Aranjează curtea</b><small>mută sau scoate copaci, pietre, ce ai construit</small></button></div>`);
    m.querySelectorAll('[data-b]').forEach(b => b.addEventListener('click', () => {
      const t = (b as HTMLElement).dataset.b!;
      this.closeModal();
      if (t === '__remove') s.startBuild(null, true);
      else s.startBuild(CATALOG.find(c => c.type === t)!);
    }));
  }
  setBuild(b: { item: BuildItem | null; remove: boolean; moving?: { action?: { label: string } } | null } | null) {
    const bar = this.root.querySelector('.buildbar') as HTMLElement;
    bar.classList.toggle('hidden', !b);
    this.root.classList.toggle('building', !!b);
    if (b) (bar.querySelector('.bt') as HTMLElement).textContent = b.moving ? `✋ Atinge locul nou pentru ${b.moving.action?.label?.toLowerCase() ?? 'obiect'}` : b.remove ? '🧹 Atinge un copac, o piatră sau ce ai construit: îl muți sau îl scoți' : `${b.item!.icon} ${b.item!.label}: atinge locul, apoi ✔`;
    (bar.querySelector('[data-a="bok"]') as HTMLElement).classList.toggle('hidden', !!b?.remove);
  }

  refreshGoal() {
    const w = this.s.w; const ch = chapterOf(w); const g = currentGoal(w);
    const n = ch.goals.filter(x => w.stats['goal-' + x.id]).length;
    (this.root.querySelector('.goal b') as HTMLElement).textContent = `📜 ${ch.title.split('·')[0].trim()} · ${n}/${ch.goals.length}`;
    const el = this.root.querySelector('.goal .gtxt') as HTMLElement;
    el.textContent = g ? `${g.icon} ${g.text}` : '🎉 Gata!';
  }
  openGoals() {
    const w = this.s.w; const cur = currentGoal(w); const ch = chapterOf(w);
    const m = this.modal(`<h3>📜 ${ch.title}</h3>
      <p class="sub">${ch.intro} Aveți grijă să nu înghețați 🥶 și să aveți ce mânca 🍲.</p>
      ${DEV ? `<div class="devrow"><button data-dev="skip">⏭️ Capitolul următor</button><button data-dev="inf" class="${this.s.infinite ? 'on' : ''}">♾️ Resurse infinite: ${this.s.infinite ? 'pornit' : 'oprit'}</button></div>
      <p class="sub devnote">🧪 Pentru testare. Resursele infinite umplu mereu banii, materialele, ingredientele, semințele și soba (doar pe acest dispozitiv).</p>` : ''}
      <ul class="goals">${ch.goals.map(g => { const done = !!w.stats['goal-' + g.id]; return `<li class="${done ? 'done' : g === cur ? 'cur' : ''}"><b>${done ? '✅' : g.icon} ${g.text}${g.who ? ` <em class="who ${g.who}">${g.who === 'dudu' ? 'Dudu' : 'Bubu'}</em>` : ''}</b>${!done ? `<small>${g.hint}</small>` : ''}<i>${g.reward.money ? '+' + g.reward.money + ' lei ' : ''}${g.reward.hearts ? '+' + g.reward.hearts + '💗' : ''}</i></li>`; }).join('')}</ul>
      <h4>🗺️ Povestea voastră</h4><p class="sub">${CHAPTERS.map(c => (c.id < ch.id ? '✅ ' : c.id === ch.id ? '👉 ' : '🔒 ') + c.title).join('<br>')}</p>
`);
    m.querySelector('[data-dev="skip"]')?.addEventListener('click', () => { this.closeModal(); this.s.devSkipChapter(); });
    m.querySelector('[data-dev="inf"]')?.addEventListener('click', () => { this.s.setInfinite(!this.s.infinite); this.toast(this.s.infinite ? '♾️ Resurse infinite pornite' : 'Resurse infinite oprite'); this.openGoals(); });
  }
  /** alege samanta pentru un razor (cu desenul plantei) */
  openSeeds(seeds: string[], pick: (crop: string) => void) {
    const r = this.s.w.res ?? {};
    const m = this.modal(`<h3>🌱 Ce plantăm?</h3><p class="sub">Udă planta 💧 ca să crească (o udătură ține ~${Math.round(WET_MIN / 60)} ore). Îngrășământul ✨ o grăbește.</p>
      <div class="shop">${seeds.map(c => `<button data-seed="${c}"><canvas width="96" height="96"></canvas><b>${CROPS[c].name}</b><small>🌰 ${r[seedKey(c)]} · ~${Math.round(CROPS[c].grow / 60)} h · recoltă ${CROPS[c].yield}</small></button>`).join('')}</div>`);
    m.querySelectorAll('[data-seed]').forEach(b => {
      const crop = (b as HTMLElement).dataset.seed!;
      const cv = b.querySelector('canvas') as HTMLCanvasElement; const ctx = cv.getContext('2d')!;
      ctx.scale(2, 2); ctx.translate(24, 26); drawCropPlant(ctx, 0, 0, { crop, prog: 1, wetUntil: 1e9, fert: 0 }, 0, 0);
      b.addEventListener('click', () => { this.closeModal(); pick(crop); });
    });
  }
  /** inventarul comun, pe sectiuni (ce aveti amandoi: Bubu isi poate pregati marfa dinainte) */
  openInventory() {
    const r = this.s.w.res ?? {};
    const info = (k: string): { icon: string; label: string; img?: string } | null => {
      const code = prodCode(k);
      if (code) { const [ch, l] = code.split(':'); return { icon: '', label: ITEM_NAMES[ch]?.[+l] ?? k, img: itemIconURL(code) }; }
      return (RES_INFO as Record<string, { icon: string; label: string }>)[k] ?? INV_INFO[k] ?? null;
    };
    const SECT: [string, (k: string) => boolean][] = [
      ['🍲 Mâncare gătită', k => k.startsWith('dish_') || k === 'meals'],
      ['🧺 Produse pentru tarabă', k => k.startsWith('prod_')],
      ['🥚 Ingrediente', k => ['flour', 'egg', 'milk', 'cheese', 'meat', 'cornmeal', 'rice', 'lemon', 'water'].includes(k)],
      ['🥕 Recolte și pădure', k => ['veg', 'carrot', 'potato', 'tomato', 'cabbage', 'strawberry', 'mushroom', 'berry', 'fish'].includes(k)],
      ['🌸 Flori', k => ['flower', 'tulip', 'rose', 'sunflower'].includes(k)],
      ['🪵 Materiale și semințe', k => ['wood', 'stone', 'hay', 'fert', 'soil'].includes(k) || k.startsWith('seed_')],
    ];
    const used = new Set<string>();
    const keys = Object.keys(r).filter(k => (r[k] ?? 0) > 0 && info(k));
    const html = SECT.map(([title, test]) => {
      const ks = keys.filter(k => !used.has(k) && test(k)); ks.forEach(k => used.add(k));
      if (!ks.length) return '';
      return `<h4>${title}</h4><div class="invgrid">${ks.map(k => { const it = info(k)!; return `<div class="invit">${it.img ? `<img class="di big" src="${it.img}" alt="">` : `<span>${it.icon}</span>`}<b>${it.label}</b><i>×${r[k]}</i></div>`; }).join('')}</div>`;
    }).join('');
    const rest = keys.filter(k => !used.has(k));
    const more = rest.length ? `<h4>📦 Altele</h4><div class="invgrid">${rest.map(k => { const it = info(k)!; return `<div class="invit"><span>${it.icon}</span><b>${it.label}</b><i>×${r[k]}</i></div>`; }).join('')}</div>` : '';
    this.modal(`<h3>🎒 Inventarul vostru</h3><p class="sub">💰 ${this.s.w.money ?? 0} lei · e comun: ce pune unul, poate lua și celălalt. Produsele pentru tarabă le pui pe tejghea din 🎒 de la tarabă.</p>${html || '<p>Gol… 🙂</p>'}${more}`);
  }

  showChapter(doneText?: string) {
    if (this.s.minigame && this.s.minigame.id !== 'cutscene') { this.whenFree(() => this.showChapter(doneText)); return; }
    const ch = chapterOf(this.s.w);
    this.modal(`${doneText ? `<h3>${doneText}</h3>` : ''}<h3>📖 ${ch.title}</h3><p>${ch.intro}</p><ul class="goals">${ch.goals.map(g => `<li><b>${g.icon} ${g.text}</b><small>${g.hint}</small></li>`).join('')}</ul>`);
    this.refreshGoal();
  }
  /** aragazul: alegi reteta (cu ingredientele pe care le ai) */
  openKitchen(cb: (recipe: string) => void) {
    const r = this.s.w.res ?? {};
    const ing = (rc: Recipe) => Object.entries(rc.need).map(([k, n]) => { const miss = missingFor(r, rc).some(m => m.k === k); return `<i class="${miss ? 'miss' : ''}">${ingIcon(k)}${n}</i>`; }).join(' ');
    const sorted = [...RECIPES].sort((a, b) => +canCook(r, b) - +canCook(r, a));
    const m = this.modal(`<h3>🍳 Ce gătim azi?</h3><p class="sub">Ingredientele vin din grădină, pădure, lac și din magazinele din sat și oraș</p><div class="shop recipes">${sorted.map(rc => `<button data-rc="${rc.id}" class="${canCook(r, rc) ? '' : 'poor'}"><span>${rc.icon}</span><b>${rc.name}</b><small class="ing">${ing(rc)}</small><small>${rc.portions} porții · ${effectText(rc)}</small></button>`).join('')}</div>`);
    m.querySelectorAll('[data-rc]').forEach(b => b.addEventListener('click', () => {
      const rc = RECIPE[(b as HTMLElement).dataset.rc!];
      const miss = missingFor(r, rc);
      if (miss.length) { this.toast(`Îți lipsește: ${miss.map(x => `${ingIcon(x.k)} ${x.n - x.has} ${ingLabel(x.k)}`).join(', ')}`); Sfx.play('bad'); return; }
      m.classList.add('hidden'); Sfx.play('drawer', { vol: 0.5 }); cb(rc.id);
    }));
  }
  /** masa: alegi ce mananci */
  openTable(cb: (key: string) => void) {
    const list = dishesOwned(this.s.w.res ?? {});
    const m = this.modal(`<h3>🍽️ Ce mâncăm?</h3><p class="sub">Fiecare mâncare are efectele ei</p><div class="shop">${list.map(d => `<button data-dish="${d.key}"><span>${d.rc.icon}</span><b>${d.rc.name} (${d.n})</b><small>${effectText(d.rc)}</small></button>`).join('')}</div>`);
    m.querySelectorAll('[data-dish]').forEach(b => b.addEventListener('click', () => { m.classList.add('hidden'); cb((b as HTMLElement).dataset.dish!); }));
  }
  openVillage(tab = 'shop') {
    const s = this.s, w = s.w, r = w.res ?? {};
    const online = tab === 'online', city = tab === 'city';
    const tabs: [string, string][] = online || city ? [] : [['shop', '🛒 Magazin'], ['sell', '💱 Piața'], ['hall', '🏛️ Primăria'], ['town', '🏙️ Orașul']];
    if (online || city) tab = 'shop';
    let body = '';
    const LIST = online ? SHOP_ONLINE : city ? SHOP_CITY : SHOP_BUY;
    if (tab === 'shop') body = `<div class="shop">${LIST.map(it => `<button data-buy="${it.id}" class="${(w.money ?? 0) < it.price ? 'poor' : ''}"><span>${it.icon}</span><b>${it.label}</b><small>💰 ${it.price} lei</small></button>`).join('')}</div>`;
    if (tab === 'sell') body = `<p class="sub">Vinde ce ai strâns (câte 1 la fiecare apăsare)</p><div class="shop">${SHOP_SELL.map(it => `<button data-sell="${it.id}" class="${(r[it.id] ?? 0) < 1 ? 'poor' : ''}"><span>${it.icon}</span><b>${it.label} (${r[it.id] ?? 0})</b><small>+${it.price} lei</small></button>`).join('')}</div>`;
    if (tab === 'hall') body = `<p class="sub">Investiții mari pentru familia voastră</p><div class="shop">${GOALS.filter(g => g.cost).map(g => { const done = !!w.stats['goal-' + g.id]; const c = g.cost!; return `<button data-goal="${g.id}" class="${done ? 'on' : ''}"><span>${g.icon}</span><b>${g.text}</b><small>${done ? '✔ gata' : [c.money ? '💰' + c.money : '', c.wood ? '🪵' + c.wood : '', c.stone ? '🪨' + c.stone : ''].join(' ')}</small></button>`; }).join('')}</div>`;
    if (tab === 'town') body = `<p class="sub">🚌 Autobuzul spre oraș pleacă din stația din dreapta pieței (${PRICE.bus} lei de persoană). La oraș: supermarket, buticul elegant, cinema, restaurant, cafeneaua și birourile (slujbe), parcul cu înghețată și apartamente de vânzare.</p>`;
    const bike = online ? `<h4>🚲 Vehicule</h4><div class="shop"><button data-bike class="${(w.stats.bike ?? 0) > 0 ? 'on' : (w.money ?? 0) < PRICE.bike ? 'poor' : ''}"><span>🚲</span><b>Bicicletă în tandem</b><small>${(w.stats.bike ?? 0) > 0 ? '✔ o aveți' : `💰 ${PRICE.bike} lei`}</small></button><button data-scooter class="${(w.stats.scooter ?? 0) > 0 ? 'on' : (w.money ?? 0) < PRICE.scooter ? 'poor' : ''}"><span>🛵</span><b>Scuter albastru pentru doi</b><small>${(w.stats.scooter ?? 0) > 0 ? '✔ îl aveți' : `💰 ${PRICE.scooter} lei`}</small></button></div>` + (s.chapter >= FARM_CHAPTER ? `<h4>🚜 Utilaje pentru câmp</h4><div class="shop">${Object.entries(MACHINES).map(([k, m]) => `<button data-mach="${k}" class="${(w.stats['mach-' + k] ?? 0) > 0 ? 'on' : (w.money ?? 0) < m.price ? 'poor' : ''}"><span>${m.icon}</span><b>${m.name}</b><small>${(w.stats['mach-' + k] ?? 0) > 0 ? '✔ îl aveți' : `💰 ${m.price} lei`} · ${m.op.toLowerCase()} singur pe rânduri</small></button>`).join('')}</div>` : '') + (s.chapter >= SHOP_CHAPTER ? `<h4>🚚 Camionul</h4><div class="shop"><button data-truck class="${(w.stats.truck ?? 0) > 0 ? 'on' : (w.money ?? 0) < 1600 ? 'poor' : ''}"><span>🚚</span><b>Camion de livrări</b><small>${(w.stats.truck ?? 0) > 0 ? '✔ îl aveți' : '💰 1600 lei'} · duce marfa la contracte</small></button></div>` : '') : '';
    const m = this.modal(`<h3>${online ? '💻 Magazin online · livrare la ușă' : city ? '🛒 Supermarketul din oraș' : '🏘️ Satul'}</h3><p class="sub">Ai 💰 ${w.money ?? 0} lei</p><div class="tabs">${tabs.map(([id, l]) => `<button data-tab="${id}" class="${id === tab ? 'on' : ''}">${l}</button>`).join('')}</div>${body}${bike}`);
    m.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => this.openVillage((b as HTMLElement).dataset.tab)));
    m.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const it = LIST.find(i => i.id === (b as HTMLElement).dataset.buy)!;
      if ((w.money ?? 0) < it.price) { this.toast('Nu ai destui bani 💰 — vinde la piață sau la tarabă'); Sfx.play('bad'); return; }
      s.op({ k: 'money', delta: -it.price }); for (const [k, n] of Object.entries(it.give)) s.op({ k: 'res', res: k, delta: n });
      if (online) { Sfx.play('typing', { vol: 0.6 }); Sfx.play('doorbell', { delay: 0.9, vol: 0.5 }); } else Sfx.play('register'); if (online) this.toast('📦 Curierul a lăsat coletul la ușă!'); this.openVillage(online ? 'online' : city ? 'city' : 'shop');
    }));
    m.querySelector('[data-bike]')?.addEventListener('click', () => {
      if ((w.stats.bike ?? 0) > 0) return;
      if ((w.money ?? 0) < PRICE.bike) { this.toast(`Bicicleta costă ${PRICE.bike} lei 💰 — munciți în sat, la tarabă și în grădină`); Sfx.play('bad'); return; }
      s.op({ k: 'money', delta: -PRICE.bike }); s.op({ k: 'stat', key: 'bike', delta: 1 }); Sfx.play('bike_bell'); Sfx.play('good', { delay: 0.5 }); s.syncPlaced();
      this.toast('🚲 Ați cumpărat bicicleta! E parcată lângă poartă. Atinge-o ca să mergeți amândoi în sat'); s.log('Ați cumpărat o bicicletă pentru doi 🚲'); this.openVillage('online');
    });
    m.querySelectorAll('[data-mach]').forEach(b => b.addEventListener('click', () => { const k = (b as HTMLElement).dataset.mach!, mm = MACHINES[k]; if ((w.stats['mach-' + k] ?? 0) > 0) return; if ((w.money ?? 0) < mm.price) { this.toast(`${mm.name} costă ${mm.price} lei 💰`); Sfx.play('bad'); return; } s.op({ k: 'money', delta: -mm.price }); s.op({ k: 'stat', key: 'mach-' + k, delta: 1 }); Sfx.play('car_start', { rate: 0.8 }); s.log(`Ați cumpărat ${mm.name.toLowerCase()} ${mm.icon}`); this.openVillage('online'); }));
    m.querySelector('[data-truck]')?.addEventListener('click', () => { if ((w.stats.truck ?? 0) > 0) return; if ((w.money ?? 0) < 1600) { this.toast('Camionul costă 1600 lei 💰'); Sfx.play('bad'); return; } s.op({ k: 'money', delta: -1600 }); s.op({ k: 'stat', key: 'truck', delta: 1 }); Sfx.play('car_start', { rate: 0.7 }); s.log('Ați cumpărat camionul de livrări 🚚'); this.openVillage('online'); });
    m.querySelector('[data-scooter]')?.addEventListener('click', () => {
      if ((w.stats.scooter ?? 0) > 0) return;
      if ((w.money ?? 0) < PRICE.scooter) { this.toast(`Scuterul costă ${PRICE.scooter} lei 💰`); Sfx.play('bad'); return; }
      s.op({ k: 'money', delta: -PRICE.scooter }); s.op({ k: 'stat', key: 'scooter', delta: 1 }); Sfx.play('car_start', { rate: 1.3 }); Sfx.play('good', { delay: 0.8 }); s.syncPlaced();
      this.toast('🛵 Aveți scuter! E parcat la poartă: atinge-l ca să mergeți în sat'); s.log('Ați cumpărat un scuter albastru 🛵💕'); this.openVillage('online');
    });
    m.querySelectorAll('[data-sell]').forEach(b => b.addEventListener('click', () => {
      const it = SHOP_SELL.find(i => i.id === (b as HTMLElement).dataset.sell)!;
      if ((r[it.id] ?? 0) < 1) return;
      s.op({ k: 'res', res: it.id, delta: -1 }); s.op({ k: 'money', delta: it.price }); Sfx.play('coin'); this.openVillage('sell');
    }));
    m.querySelectorAll('[data-goal]').forEach(b => b.addEventListener('click', () => {
      const g = GOALS.find(x => x.id === (b as HTMLElement).dataset.goal)!; if (w.stats['goal-' + g.id]) return;
      const c = g.cost!;
      if ((w.money ?? 0) < (c.money ?? 0) || (r.wood ?? 0) < (c.wood ?? 0) || (r.stone ?? 0) < (c.stone ?? 0)) { this.toast('Încă nu aveți destul… continuați! 💪'); Sfx.play('bad'); return; }
      if (c.money) s.op({ k: 'money', delta: -c.money }); if (c.wood) s.op({ k: 'res', res: 'wood', delta: -c.wood }); if (c.stone) s.op({ k: 'res', res: 'stone', delta: -c.stone });
      s.op({ k: 'stat', key: g.id, delta: 1 }); s.completeGoal(g.id); this.openVillage('hall');
    }));
  }

  /** previzualizare desenata: personajul tau purtand haina */
  private prevCache: Record<string, string> = {};
  preview(itemId: string) {
    const s = this.s; const key = s.myId + itemId;
    if (!this.prevCache[key]) {
      const it = ITEMS.find(i => i.id === itemId)!;
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d')!;
      const head = it.slot !== 'body';
      const P = basePose(); P.eyes = 'happy'; P.mouth = 'open'; P.blush = 1;
      const of: any = { ...NO_OUTFIT, [it.slot]: it.id };
      if (head) drawCharacter(c, SPECS[s.myId], P, 64, 196, 1.3, 1, 0, of);
      else drawCharacter(c, SPECS[s.myId], P, 64, 116, 1.15, 1, 0, of);
      this.prevCache[key] = cv.toDataURL();
    }
    return `<img class="prev" src="${this.prevCache[key]}" alt="">`;
  }
  openApartment() {
    const s = this.s, w = s.w; const price = 800;
    const m = this.modal(`<h3>🏙️ Blocul Lalelelor</h3><p class="sub">Un apartament luminos la etajul 3: dormitor cu pat mare, baie cu cadă, bucătărie, living cu televizor mare și vedere spre parc. Încălzire centrală — nu mai trebuie lemne! 🔥</p>
      <p class="sub">Aveți 💰 ${w.money ?? 0} lei · prețul: <b>💰 ${price} lei</b></p>
      <div class="shop"><button data-buyapt class="${(w.money ?? 0) < price ? 'poor' : ''}"><span>🔑</span><b>Cumpărăm apartamentul!</b><small>💰 ${price} lei</small></button></div>
      <p class="sub">Bani faceți la cafenea ☕, la birou 💼, la florărie 💐, la tâmplărie 🪚 și la tarabă 🧺.</p>`);
    m.querySelector('[data-buyapt]')?.addEventListener('click', () => {
      if ((w.money ?? 0) < price) { this.toast(`Mai strângeți ${price - (w.money ?? 0)} lei 💪`); Sfx.play('bad'); return; }
      s.op({ k: 'money', delta: -price }); s.op({ k: 'stat', key: 'apartment', delta: 1 }); Sfx.play('applause'); Sfx.play('levelup', { vol: 0.7 });
      s.log('Ați cumpărat un apartament la oraș! 🔑🏙️💕'); this.els['.modal'].classList.add('hidden'); this.toast('🔑 E al vostru! Intrați să-l vedeți');
      s.goArea('apartment');
    });
  }

  /** bara de plecare cu bicicleta / scuterul */
  private rideMode: 'driver' | 'passenger' | 'riding' | null = null;
  /** numele regiunii in care tocmai ai intrat (apare cateva secunde sus) */
  private bannerT: ReturnType<typeof setTimeout> | null = null;
  regionBanner(icon: string, name: string) {
    const el = this.root.querySelector('.regionbanner') as HTMLElement; if (!el) return;
    (el.querySelector('.ri') as HTMLElement).textContent = icon; (el.querySelector('.rn') as HTMLElement).textContent = name;
    el.classList.remove('hidden', 'out'); void el.offsetWidth; el.classList.add('in');
    if (this.bannerT) clearTimeout(this.bannerT);
    this.bannerT = setTimeout(() => { el.classList.add('out'); el.classList.remove('in'); setTimeout(() => el.classList.add('hidden'), 600); }, 2600);
  }
  setRide(mode: 'driver' | 'passenger' | 'riding' | null) {
    this.rideMode = mode;
    const bar = this.root.querySelector('.ridebar') as HTMLElement;
    bar.classList.toggle('hidden', !mode); this.root.classList.toggle('riding', !!mode);
    this.lastRide = ''; this.updateRide();
  }
  private lastRide = '';
  updateRide() {
    const s = this.s; if (!this.rideMode) return;
    if (this.rideMode === 'driver' && !s.me.board) { this.setRide(null); return; }
    if (this.rideMode === 'passenger' && !s.me.passenger) { this.setRide(null); return; }
    if (this.rideMode === 'riding' && !s.ride) { this.setRide(null); return; }
    const bar = this.root.querySelector('.ridebar') as HTMLElement;
    const pa = s.partner, nm = pa.actor.spec.name, rk = s.ride?.kind ?? (s.me.passenger ? pa.rideKind : s.me.rideKind) ?? 'bike', veh = rk === 'bike' ? 'bike' : 'scooter';
    const vname = veh === 'bike' ? 'bicicletă' : 'scuter', vic = VEH_ICON[rk] ?? '🛵';
    const dest = s.vehAt(veh) === 'village' ? 'acasă' : 'în sat';
    let txt: string, go: string, call = '', show = true;
    let dests = '', pause = '', back = '', stopAt = '', stopName = '';
    if (this.rideMode === 'riding') {
      const r = s.ride!; const left = Math.max(1, Math.ceil((r.len - r.s) / Math.max(4, r.v || 4)));
      const dn = DEST_BY_ID[r.dest]?.name;
      txt = r.dest === 'field' ? `🚜 Utilajul lucrează pe rânduri…` : `${vic} ${dn ? 'Spre ' + dn.replace('Acasă', 'casă') : DEST_TXT[r.dest] ?? 'Pe drum'}${r.paused ? ' · ⏸ oprit' : ''}${r.duo ? ` cu ${nm} 💕` : ''}${r.paused ? '' : ` · mai ai ~${left} s`}`; go = '';
      if (r.kind === 'bike' || r.kind === 'scooter' || (r.kind === 'tractor' && r.dest !== 'field')) { pause = r.paused ? '▶ Pornește' : '⏸ Oprește'; back = r.from ? '↩ Întoarce' : ''; }
      const ns = s.rideNextStop(); if (ns) { stopAt = ns; stopName = `⤵ Oprește la ${DEST_BY_ID[ns].icon} ${DEST_BY_ID[ns].name}`; }
    }
    else if (this.rideMode === 'passenger') { txt = pa.riding && !pa.board ? `${vic} Mergeți împreună 💕` : `${vic} Stai în spate. Așteaptă să pornească ${nm}`; go = ''; }
    else if (pa.passenger) { txt = `${vic} ${nm} a urcat în spate 💕`; go = `▶ Pornim ${dest}!`; }
    else if (pa.callBoard) { txt = `${vic} ${nm} vine să urce…`; go = `▶ Pornește singur${s.myId === 'bubu' ? 'ă' : ''}`; show = false; }
    else { txt = `${vic} Ești pe ${vname}. Unde mergi${pa.passenger ? '' : `, singur${s.myId === 'bubu' ? 'ă' : ''} sau cu ${nm}`}?`; go = ''; call = pa.passenger ? '' : `📣 ${pa.id === 'bubu' ? 'Cheam-o pe' : 'Cheamă-l pe'} ${nm}`; }
    if (this.rideMode === 'driver') { const here = s.vehAt(veh); dests = DESTS.filter(d => d.id !== here).map(d => { const why = s.reachWhy(d.id); return `<button data-go="${d.id}" class="go${why ? ' off' : ''}" title="${why ?? ''}">${d.icon} ${d.name}</button>`; }).join(''); if (pa.passenger) txt = `${vic} ${nm} a urcat în spate 💕 Unde mergeți?`; }
    if (!s.sameArea()) call = '';
    const key = txt + go + call + show + dests + pause + back + stopAt;
    if (key === this.lastRide) return; this.lastRide = key;
    (bar.querySelector('.rt') as HTMLElement).textContent = txt;
    const bg = bar.querySelector('[data-a="rgo"]') as HTMLElement, bc = bar.querySelector('[data-a="rcall"]') as HTMLElement, bo = bar.querySelector('[data-a="roff"]') as HTMLElement;
    bg.textContent = go; bg.style.display = go ? '' : 'none';
    // in mers nu se coboara (vehiculul merge singur pana la capat)
    bo.style.display = this.rideMode === 'riding' || (this.rideMode === 'passenger' && pa.riding && !pa.board) ? 'none' : '';
    bc.textContent = call; bc.style.display = call && show ? '' : 'none';
    (bar.querySelector('.rdest') as HTMLElement).innerHTML = dests;
    const bp = bar.querySelector('[data-a="rpause"]') as HTMLElement, bb = bar.querySelector('[data-a="rback"]') as HTMLElement, bs = bar.querySelector('[data-a="rstop"]') as HTMLElement;
    bp.textContent = pause; bp.style.display = pause ? '' : 'none'; bb.textContent = back; bb.style.display = back ? '' : 'none';
    bs.textContent = stopName; bs.dataset.dest = stopAt; bs.style.display = stopAt ? '' : 'none';
  }

  setMinigame(on: boolean, scene = false) { this.root.classList.toggle('in-mini', on); this.root.classList.toggle('in-scene', on && scene); if (on && !scene) this.els['.modal'].classList.add('hidden'); }
}

/** unde e partenerul (eticheta din coltul lui) */
const WHERE: Record<string, string> = { home: '🏡 acasă · ', forest: '🌲 la pădure · ', woods: '🌲 în pădure · ', village: '🏘️ în sat · ', city: '🏙️ la oraș · ', lake: '🏞️ la lac · ', country: '🌾 pe câmp · ', apartment: '🔑 în apartament · ' };
const VEH_ICON: Record<string, string> = { bike: '🚲', scooter: '🛵', tractor: '🚜', bus: '🚌', taxi: '🚕' };
const DEST_TXT: Record<string, string> = { village: 'Spre sat', home: 'Spre casă', city: 'Spre oraș', forest: 'Spre pădure' };
/** locurile greu de gasit pentru cine e nou (harta → „Unde e?”); x, y = unde ajungi pe jos */
/** ce apare pe harta mare: toate cladirile si locurile la care faci ceva */
const MAP_TYPES = new Set(['building', 'cbuilding', 'farmhouse', 'church', 'barn', 'windmill', 'sawmill', 'stalls', 'busstop', 'ferris', 'carousel', 'towerdoor', 'taxistand', 'stand', 'bridgegap', 'gazebo', 'noticeboard', 'cfountain', 'fountain', 'icecart', 'roadblock', 'forestgate']);
/** au deja eticheta mare pe harta intreaga (iconita lor apare doar cand mărești) */
const MAP_LABELED = new Set(['w-sawmill', 'w-mill', 'w-bridge-gap', 'w-forestgate', 'st-farmgate']);
const MAP_IDS = new Set(['f-pier', 'w-lakepier', 'well', 'c-lot']);
const MAP_NAMES: Record<string, string> = { 'f-pier': 'Pescuit (pădure)', 'w-lakepier': 'Pescuit la lac', 'w-sawmill': 'Cheresteaua', 'w-mill': 'Moara', 'w-bridge-gap': 'Podul Mare', 'w-roadblock': 'Drumul spre oraș', 'w-forestgate': 'Poarta pădurii', stand: 'Taraba', well: 'Fântâna', 'v-bus': 'Autobuz', 'c-bus': 'Autobuz', 'c-taxi': 'Taxi', 'c-towerdoor': 'Blocul (apartamentul)', 'v-board': 'Avizierul', 'c-lot': 'Teren de vânzare' };
const PLACES: { id: string; icon: string; name: string; where: string; what: string; x: number; y: number; ch?: number }[] = [
  { id: 'sawmill', icon: '🪚', name: 'Cheresteaua lui Nea Vasile', where: 'pe drum, la dreapta casei', what: 'aici tai scânduri și vinzi lemne', x: 29, y: 22.6 },
  { id: 'farm', icon: '🐔', name: 'Ferma voastră', where: 'ieși din curte spre dreapta, indicatorul de lângă gard', what: 'găini, vacă, stupi', x: 24.5, y: 14.3, ch: FARM_CHAPTER },
  { id: 'forest', icon: '🌲', name: 'Pădurea', where: 'în spatele casei, spre nord (poarta pădurii)', what: 'lemne, pietre, ciuperci, fructe de pădure', x: 20, y: -7.6, ch: 2 },
  { id: 'mill', icon: '🌾', name: 'Moara satului', where: 'la sud de câmpuri, sub parcele', what: 'vinzi cerealele angro, macini făină și mălai', x: 35, y: 44.6, ch: FARM_CHAPTER },
  { id: 'bridge', icon: '🌉', name: 'Podul Mare', where: 'pe drum spre est, după cherestea, peste râu', what: 'îl reparați ca să ajungeți în sat', x: 61.6, y: 37, ch: Story.BRIDGE_CH },
];
const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
