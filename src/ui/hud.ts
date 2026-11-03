// Interfata de joc (DOM peste canvas).
import type { WorldScene } from '../scenes/world';
import { PAIRS } from '../scenes/world';
import { ANIM_LIST } from '../char/anims';
import { NEEDS, NEED_INFO, SICK_INFO, REQUESTS, clockText, nightAmount } from '../game/state';
import { Sfx } from '../engine/sfx';
import { moodText, g } from '../game/gender';
import { ITEMS, NO_OUTFIT } from '../char/outfit';
import { CATALOG, RES_INFO, type BuildItem, type Res } from '../world/build';
import { GOALS, CHAPTERS, chapterOf, currentGoal, INV_INFO, SHOP_BUY, SHOP_ONLINE, SHOP_SELL, SHOP_CITY } from '../game/economy';
import { drawCharacter, SPECS } from '../char/draw';
import { basePose } from '../char/pose';
import { CROPS, seedKey, catCount, drawCropPlant, WET_MIN } from '../world/garden';
import { CRITTER_NAMES } from '../world/forest';
import type { NetStatus } from '../net/types';


export class Hud {
  root: HTMLElement;
  private els: Record<string, HTMLElement> = {};
  private lastAction = '';

  constructor(private s: WorldScene) {
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
        <div class="netline"><i class="dot"></i><span class="net">solo</span> <button class="mini-btn" data-a="skipch" title="Provizoriu: capitolul următor">⏭</button> <button class="mini-btn" data-a="menu">⚙</button></div>
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
      <div class="pop emotes hidden"><h4>Emote-uri & dansuri</h4><div class="grid">${emotes.map(a => `<button data-emote="${a.id}"><span>${a.icon}</span>${a.label}</button>`).join('')}</div></div>
      <div class="pop pairs hidden"><h4>Împreună 💞</h4><div class="grid">${PAIRS.filter(p => !p.only || p.only === s.myId).map(p => `<button data-pair="${p.id}"><span>${p.icon}</span>${p.label}</button>`).join('')}</div></div>
      <div class="ridebar hidden"><span class="rt"></span><div class="rbtns"><button data-a="rgo" class="go">▶ Pornește</button><button data-a="rcall">📣 Cheamă</button><button data-a="roff">⬇ Coboară</button></div></div>
      <div class="buildbar hidden"><span class="bt"></span><button data-a="bok">✔ Pune</button><button data-a="bend">✖ Gata</button></div>
      <div class="toasts"></div>
      <div class="modal hidden"></div>
    `;
    document.getElementById('ui')!.appendChild(root);
    this.root = root;
    for (const sel of ['.me .mood', '.me .sick', '.clock .time', '.clock .day', '.clock .hearts', '.pst', '.pmood', '.net', '.dot', '[data-a="action"]', '.emotes', '.pairs', '.toasts', '.modal', '.fart .fill', '[data-a="pairs"]']) this.els[sel] = root.querySelector(sel)!;
    root.addEventListener('click', e => {
      if ((e.target as HTMLElement).closest('[data-inv]')) { this.openInventory(); return; }
      const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null; if (!b) return;
      Sfx.unlock(); Sfx.play('click');
      const a = b.dataset.a;
      if (a === 'action') s.doAction();
      if (a === 'emotes') this.toggleEmotes();
      if (a === 'pairs') this.togglePairs();
      if (a === 'fart') s.fartJump();
      if (a === 'bell') s.ringBell();
      if (a === 'build') s.build ? s.endBuild() : this.openBuild();
      if (a === 'rgo') s.rideStart();
      if (a === 'rcall') s.rideCall();
      if (a === 'roff') s.rideOff();
      if (a === 'bok') s.confirmBuild();
      if (a === 'scooter') s.toggleScooter();
      if (a === 'goals') this.openGoals();
      if (a === 'skipch' && confirm('(Provizoriu) Treci la capitolul următor?')) s.devSkipChapter();
      if (a === 'inv') this.openInventory();
      if (a === 'bend') s.endBuild();
      if (a === 'menu') { s.save(); (window as any).game.go('menu'); }
      if (b.dataset.emote) s.emote(b.dataset.emote);
      if (b.dataset.pair) s.pairAction(b.dataset.pair);
      if (b.dataset.close !== undefined) this.closeModal();
    });
    root.addEventListener('pointerdown', e => e.stopPropagation());
  }

  destroy() { this.root.remove(); }

  update() {
    this.updateRide();
    const s = this.s, w = s.w, c = w.chars[s.myId];
    for (const n of NEEDS) {
      const el = this.root.querySelector(`.me [data-n="${n}"] b`) as HTMLElement;
      el.style.width = c.needs[n] + '%';
      el.parentElement!.parentElement!.classList.toggle('low', c.needs[n] < 25);
    }
    this.els['.me .mood'].textContent = moodText(s.myId, s.me.actor.mood);
    const sk = this.els['.me .sick'];
    sk.classList.toggle('hidden', !c.sick);
    if (c.sick) { const t = `${SICK_INFO[c.sick].icon} ${SICK_INFO[c.sick].label}${c.request ? ' · vrei ' + (REQUESTS[c.request]?.icon ?? '') : ''}`; if (sk.dataset.t !== t) { sk.dataset.t = t; sk.innerHTML = `${t} <button class="mini-btn" data-a="bell">🔔 Cheamă</button>`; } }
    this.els['.clock .time'].textContent = (nightAmount(w.minutes) > 0.5 ? '🌙 ' : '☀️ ') + clockText(w.minutes);
    this.els['.clock .day'].textContent = `Ziua ${w.day}`;
    this.els['.clock .hearts'].textContent = `💗 ${w.hearts}`;
    (this.root.querySelector('.clock .money') as HTMLElement).textContent = `💰 ${w.money ?? 0} lei`;
    const rs = (this.root.querySelector('.clock .res') as HTMLElement); const R = w.res ?? {}; const seeds = Object.keys(CROPS).reduce((a, c) => a + (R[seedKey(c)] ?? 0), 0); const rt = `🪵${R.wood ?? 0} 🪨${R.stone ?? 0} 🥕${catCount(R, 'veg')} 🌸${catCount(R, 'flower')} 🍲${R.meals ?? 0} 💧${R.water ?? 0} 🌰${seeds} · 🔥${Math.round((w.furn.fire as number) ?? 0)}% 🎒`; if (rs.textContent !== rt) rs.textContent = rt;
    const pc = w.chars[s.partner.id];
    this.els['.pmood'].textContent = (s.sameArea() ? '' : ({ home: '🏡 acasă · ', forest: '🌲 la pădure · ', village: '🏘️ în sat · ', city: '🏙️ la oraș · ', apartment: '🔑 în apartament · ' } as Record<string, string>)[s.partnerArea()] ?? '') + moodText(s.partner.id, s.partner.actor.mood) + (pc.sick ? ` · ${SICK_INFO[pc.sick].icon} ${g(s.partner.id, 'bolnav', 'bolnavă')}` : '');
    (this.els['.fart .fill'] as HTMLElement).style.height = c.fart + '%';
    this.els['[data-a="pairs"]'].classList.toggle('glow', s.nearPartner());
    (this.root.querySelector('.act.scooter') as HTMLElement).style.display = 'none'; // vehiculele se folosesc de la poarta
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

  modal(html: string) { const m = this.els['.modal']; m.innerHTML = `<div class="box"><button class="xclose" data-close aria-label="Închide">✕</button>${html}<button class="close" data-close>Închide</button></div>`; m.classList.remove('hidden'); return m; }
  closeModal() { this.els['.modal'].classList.add('hidden'); }

  showLog(items: string[]) {
    this.modal(`<h3>💭 Cât ai lipsit…</h3><ul class="log">${items.slice(-12).map(i => `<li>${esc(i)}</li>`).join('')}</ul>`);
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
      { id: 'florarie', icon: '💐', label: 'Florăria lui Bubu', desc: 'Clienții vin des și plătesc cu 50% mai mult pe flori', cost: { money: 200 } },
      { id: 'workshop', icon: '🪚', label: 'Tâmplăria lui Dudu', desc: 'Faceți mobilier din lemn și îl vindeți', cost: { money: 200, wood: 15 } },
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
      { id: 'birdhouse', icon: '🐦', label: 'Căsuță pentru păsări', need: { wood: 3, flower: 1 }, pay: 18 },
      { id: 'chair', icon: '🪑', label: 'Scăunel', need: { wood: 4 }, pay: 22 },
      { id: 'table', icon: '🪵', label: 'Măsuță', need: { wood: 8 }, pay: 48 },
      { id: 'swing', icon: '🎠', label: 'Leagăn de grădină', need: { wood: 10, stone: 2 }, pay: 70 },
      { id: 'cradle', icon: '🍼', label: 'Leagăn de bebeluș', need: { wood: 14, flower: 3 }, pay: 110 },
    ];
    const bonus = (s.myId === 'dudu' ? 1.2 : 1) * ((s.w.stats['dipl-tamplar-' + s.myId] ?? 0) > 0 ? 1.3 : 1); // cursul de tamplar: +30%
    const need = (n: Record<string, number>) => Object.entries(n).map(([k, v]) => `${k === 'wood' ? '🪵' : k === 'stone' ? '🪨' : '🌸'}${v}`).join(' ');
    const m = this.modal(`<h3>🪚 Tâmplăria lui Dudu</h3><p class="sub">Ai 🪵 ${r.wood ?? 0} · 🪨 ${r.stone ?? 0} · 🌸 ${r.flower ?? 0}. ${s.myId === 'dudu' ? 'Ești meșterul: +20% la preț 💪' : 'Dudu e meșterul, dar te descurci și tu 🙂'}</p>
      <div class="shop">${recipes.map(rc => { const ok = Object.entries(rc.need).every(([k, v]) => (r[k] ?? 0) >= v); return `<button data-rc="${rc.id}" class="${ok ? '' : 'poor'}"><span>${rc.icon}</span><b>${rc.label}</b><small>${need(rc.need)} → 💰 ${Math.round(rc.pay * bonus)} lei</small></button>`; }).join('')}</div>`);
    m.querySelectorAll('[data-rc]').forEach(b => b.addEventListener('click', () => {
      const rc = recipes.find(x => x.id === (b as HTMLElement).dataset.rc)!;
      if (!Object.entries(rc.need).every(([k, v]) => (r[k] ?? 0) >= v)) { this.toast('Nu ai destule materiale 🪵'); Sfx.play('bad'); return; }
      for (const [k, v] of Object.entries(rc.need)) s.op({ k: 'res', res: k, delta: -v });
      const pay = Math.round(rc.pay * bonus); s.op({ k: 'money', delta: pay }); s.op({ k: 'stat', key: 'crafted', delta: 1 });
      Sfx.play('bonk'); setTimeout(() => Sfx.play('coin'), 300); s.me.actor.play('flex');
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
        s.op({ k: 'money', delta: -it.price }); c.owned!.push(it.id); s.op({ k: 'stat', key: 'clothesBought', delta: 1 }); Sfx.play('coin');
      }
      (c.outfit as any)[it.slot] = it.id; s.sendCharSync(); s.me.actor.play('shy');
      this.openClothes(tier);
    }));
  }


  openBuild() {
    const s = this.s; const r = s.w.res ?? {};
    const cost = (it: BuildItem) => Object.entries(it.cost).map(([k, n]) => `${RES_INFO[k as Res].icon}${n}`).join(' ');
    const m = this.modal(`<h3>🔨 Construim împreună</h3>
      <p class="sub">Ai ${(Object.keys(RES_INFO) as Res[]).map(k => `${RES_INFO[k].icon} ${r[k] ?? 0}`).join(' · ')}. Strânge din curte: copaci 🪓, pietre ⛏️, flori 🌸.</p>
      <div class="shop">${CATALOG.map(it => `<button data-b="${it.type}" class="${s.canAfford(it) ? '' : 'poor'}"><span>${it.icon}</span><b>${it.label}${it.coop ? ' 💞' : ''}</b><small>${cost(it)}</small></button>`).join('')}
      <button data-b="__remove"><span>🧹</span><b>Mută / Strânge</b><small>primești ½ înapoi</small></button></div>`);
    m.querySelectorAll('[data-b]').forEach(b => b.addEventListener('click', () => {
      const t = (b as HTMLElement).dataset.b!;
      this.closeModal();
      if (t === '__remove') s.startBuild(null, true);
      else s.startBuild(CATALOG.find(c => c.type === t)!);
    }));
  }
  setBuild(b: { item: BuildItem | null; remove: boolean } | null) {
    const bar = this.root.querySelector('.buildbar') as HTMLElement;
    bar.classList.toggle('hidden', !b);
    this.root.classList.toggle('building', !!b);
    if (b) (bar.querySelector('.bt') as HTMLElement).textContent = b.remove ? '🧹 Atinge un obiect ca să-l strângi' : `${b.item!.icon} ${b.item!.label}: atinge locul, apoi ✔`;
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
    this.modal(`<h3>📜 ${ch.title}</h3>
      <p class="sub">${ch.intro} Aveți grijă să nu înghețați 🥶 și să aveți ce mânca 🍲.</p>
      <ul class="goals">${ch.goals.map(g => { const done = !!w.stats['goal-' + g.id]; return `<li class="${done ? 'done' : g === cur ? 'cur' : ''}"><b>${done ? '✅' : g.icon} ${g.text}</b>${!done ? `<small>${g.hint}</small>` : ''}<i>${g.reward.money ? '+' + g.reward.money + ' lei ' : ''}${g.reward.hearts ? '+' + g.reward.hearts + '💗' : ''}</i></li>`; }).join('')}</ul>
      <h4>🗺️ Povestea voastră</h4><p class="sub">${CHAPTERS.map(c => (c.id < ch.id ? '✅ ' : c.id === ch.id ? '👉 ' : '🔒 ') + c.title).join('<br>')}<br>🔒 Satul: florăria lui Bubu, afacerea lui Dudu, magazine, parc, școală<br>🔒 Orașul: mutarea la oraș 🏙️</p>`);
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
  openInventory() {
    const r = this.s.w.res ?? {};
    const rows = [...Object.entries(RES_INFO), ...Object.entries(INV_INFO)].filter(([k]) => (r[k] ?? 0) > 0).map(([k, i]) => `<li><b>${i.icon} ${i.label}</b><i>${r[k]}</i></li>`).join('') || '<li>Gol… 🙂</li>';
    this.modal(`<h3>🎒 Cămara voastră</h3><p class="sub">💰 ${this.s.w.money ?? 0} lei</p><ul class="goals inv">${rows}</ul>`);
  }
  showChapter(doneText?: string) {
    const ch = chapterOf(this.s.w);
    this.modal(`${doneText ? `<h3>${doneText}</h3>` : ''}<h3>📖 ${ch.title}</h3><p>${ch.intro}</p><ul class="goals">${ch.goals.map(g => `<li><b>${g.icon} ${g.text}</b><small>${g.hint}</small></li>`).join('')}</ul>`);
    this.refreshGoal();
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
    if (tab === 'town') body = `<p class="sub">🚌 Autobuzul spre oraș pleacă din stația din dreapta pieței (5 lei de persoană). La oraș: supermarket, buticul elegant, cinema, restaurant, cafeneaua și birourile (slujbe), parcul cu înghețată și apartamente de vânzare.</p>`;
    const bike = online ? `<h4>🚲 Vehicule</h4><div class="shop"><button data-bike class="${(w.stats.bike ?? 0) > 0 ? 'on' : (w.money ?? 0) < 150 ? 'poor' : ''}"><span>🚲</span><b>Bicicletă în tandem</b><small>${(w.stats.bike ?? 0) > 0 ? '✔ o aveți' : '💰 150 lei'}</small></button><button data-scooter class="${(w.stats.scooter ?? 0) > 0 ? 'on' : (w.money ?? 0) < 300 ? 'poor' : ''}"><span>🛵</span><b>Scuter albastru pentru doi</b><small>${(w.stats.scooter ?? 0) > 0 ? '✔ îl aveți' : '💰 300 lei'}</small></button></div>` : '';
    const m = this.modal(`<h3>${online ? '💻 Magazin online · livrare la ușă' : city ? '🛒 Supermarketul din oraș' : '🏘️ Satul'}</h3><p class="sub">Ai 💰 ${w.money ?? 0} lei</p><div class="tabs">${tabs.map(([id, l]) => `<button data-tab="${id}" class="${id === tab ? 'on' : ''}">${l}</button>`).join('')}</div>${body}${bike}`);
    m.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => this.openVillage((b as HTMLElement).dataset.tab)));
    m.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const it = LIST.find(i => i.id === (b as HTMLElement).dataset.buy)!;
      if ((w.money ?? 0) < it.price) { this.toast('Nu ai destui bani 💰 — vinde la piață sau la tarabă'); Sfx.play('bad'); return; }
      s.op({ k: 'money', delta: -it.price }); for (const [k, n] of Object.entries(it.give)) s.op({ k: 'res', res: k, delta: n });
      Sfx.play('coin'); if (online) this.toast('📦 Curierul a lăsat coletul la ușă!'); this.openVillage(online ? 'online' : city ? 'city' : 'shop');
    }));
    m.querySelector('[data-bike]')?.addEventListener('click', () => {
      if ((w.stats.bike ?? 0) > 0) return;
      if ((w.money ?? 0) < 150) { this.toast('Nu ajung banii 💰 — taraba și lemnele!'); Sfx.play('bad'); return; }
      s.op({ k: 'money', delta: -150 }); s.op({ k: 'stat', key: 'bike', delta: 1 }); Sfx.play('good'); s.syncPlaced();
      this.toast('🚲 Ați cumpărat bicicleta! E parcată lângă poartă. Atinge-o ca să mergeți amândoi în sat'); s.log('Ați cumpărat o bicicletă pentru doi 🚲'); this.openVillage('online');
    });
    m.querySelector('[data-scooter]')?.addEventListener('click', () => {
      if ((w.stats.scooter ?? 0) > 0) return;
      if ((w.money ?? 0) < 300) { this.toast('Scuterul costă 300 lei 💰'); Sfx.play('bad'); return; }
      s.op({ k: 'money', delta: -300 }); s.op({ k: 'stat', key: 'scooter', delta: 1 }); Sfx.play('good'); s.syncPlaced();
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
      s.op({ k: 'money', delta: -price }); s.op({ k: 'stat', key: 'apartment', delta: 1 }); Sfx.play('good');
      s.log('Ați cumpărat un apartament la oraș! 🔑🏙️💕'); this.els['.modal'].classList.add('hidden'); this.toast('🔑 E al vostru! Intrați să-l vedeți');
      s.goArea('apartment');
    });
  }

  /** bara de plecare cu bicicleta / scuterul */
  private rideMode: 'driver' | 'passenger' | null = null;
  setRide(mode: 'driver' | 'passenger' | null) {
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
    const bar = this.root.querySelector('.ridebar') as HTMLElement;
    const pa = s.partner, nm = pa.actor.spec.name, veh = s.me.rideKind === 'bike' || pa.rideKind === 'bike' ? 'bike' : 'scooter';
    const vname = veh === 'bike' ? 'bicicletă' : 'scuter', vic = veh === 'bike' ? '🚲' : '🛵';
    const dest = s.area === 'home' ? 'în sat' : 'acasă';
    let txt: string, go: string, call = '', show = true;
    if (this.rideMode === 'passenger') { txt = `${vic} Stai în spate. Așteaptă să pornească ${nm}`; go = ''; }
    else if (pa.passenger) { txt = `${vic} ${nm} a urcat în spate 💕`; go = `▶ Pornim ${dest}!`; }
    else if (pa.callBoard) { txt = `${vic} ${nm} vine să urce…`; go = `▶ Pornește singur${s.myId === 'bubu' ? 'ă' : ''}`; show = false; }
    else { txt = `${vic} Ești pe ${vname}. Mergi singur${s.myId === 'bubu' ? 'ă' : ''} ${dest} sau ${pa.id === 'bubu' ? 'o aștepți pe' : 'îl aștepți pe'} ${nm}?`; go = `▶ Pornește singur${s.myId === 'bubu' ? 'ă' : ''}`; call = `📣 ${pa.id === 'bubu' ? 'Cheam-o pe' : 'Cheamă-l pe'} ${nm}`; }
    if (!s.sameArea()) call = '';
    const key = txt + go + call + show;
    if (key === this.lastRide) return; this.lastRide = key;
    (bar.querySelector('.rt') as HTMLElement).textContent = txt;
    const bg = bar.querySelector('[data-a="rgo"]') as HTMLElement, bc = bar.querySelector('[data-a="rcall"]') as HTMLElement;
    bg.textContent = go; bg.style.display = go ? '' : 'none';
    bc.textContent = call; bc.style.display = call && show ? '' : 'none';
  }

  setMinigame(on: boolean) { this.root.classList.toggle('in-mini', on); if (on) this.els['.modal'].classList.add('hidden'); }
}

const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
