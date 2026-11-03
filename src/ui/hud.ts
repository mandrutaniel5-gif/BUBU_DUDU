// Interfata de joc (DOM peste canvas).
import type { WorldScene } from '../scenes/world';
import { PAIRS } from '../scenes/world';
import { ANIM_LIST } from '../char/anims';
import { NEEDS, NEED_INFO, SICK_INFO, REQUESTS, clockText, nightAmount } from '../game/state';
import { Sfx } from '../engine/sfx';
import { moodText, g } from '../game/gender';
import { ITEMS, NO_OUTFIT } from '../char/outfit';
import { CATALOG, RES_INFO, type BuildItem, type Res } from '../world/build';
import { GOALS, CHAPTERS, chapterOf, currentGoal, INV_INFO, SHOP_BUY, SHOP_ONLINE, SHOP_SELL } from '../game/economy';
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
        </div>
      </div>
      <div class="pop emotes hidden"><h4>Emote-uri & dansuri</h4><div class="grid">${emotes.map(a => `<button data-emote="${a.id}"><span>${a.icon}</span>${a.label}</button>`).join('')}</div></div>
      <div class="pop pairs hidden"><h4>Împreună 💞</h4><div class="grid">${PAIRS.filter(p => !p.only || p.only === s.myId).map(p => `<button data-pair="${p.id}"><span>${p.icon}</span>${p.label}</button>`).join('')}</div></div>
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
      if (a === 'bok') s.confirmBuild();
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
    this.els['.pmood'].textContent = (s.sameArea() ? '' : s.partnerArea() === 'home' ? '🏡 acasă · ' : '🌲 la pădure · ') + moodText(s.partner.id, s.partner.actor.mood) + (pc.sick ? ` · ${SICK_INFO[pc.sick].icon} ${g(s.partner.id, 'bolnav', 'bolnavă')}` : '');
    (this.els['.fart .fill'] as HTMLElement).style.height = c.fart + '%';
    this.els['[data-a="pairs"]'].classList.toggle('glow', s.nearPartner());
    // butonul de actiune
    let label = '…', icon = '✋';
    if (s.me.activity) { label = 'Oprește'; icon = '⏹'; }
    else {
      const f = s.nearestFurn(s.me); const act = f && s.actionFor(f);
      if (act) { label = act.label; icon = act.icon; }
      else if (s.nearCritter()) { const c = s.nearCritter()!; label = 'Mângâie ' + CRITTER_NAMES[c.kind].toLowerCase(); icon = '🤗'; }
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
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = text;
    this.els['.toasts'].appendChild(t);
    setTimeout(() => t.classList.add('out'), 3600); setTimeout(() => t.remove(), 4200);
  }

  toggleEmotes() { this.els['.pairs'].classList.add('hidden'); this.els['.emotes'].classList.toggle('hidden'); }
  togglePairs(force?: boolean) { this.els['.emotes'].classList.add('hidden'); if (force) this.els['.pairs'].classList.remove('hidden'); else this.els['.pairs'].classList.toggle('hidden'); }
  closeMenus() { this.els['.emotes'].classList.add('hidden'); this.els['.pairs'].classList.add('hidden'); }

  modal(html: string) { const m = this.els['.modal']; m.innerHTML = `<div class="box">${html}<button class="close" data-close>Închide</button></div>`; m.classList.remove('hidden'); return m; }
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
      ${mine.length ? Object.entries(slots).map(([slot, name]) => { const list = mine.filter(i => i.slot === slot); return list.length ? `<h4>${name}</h4><div class="shop">${list.map(i => { const on = (c.outfit as any)[slot] === i.id; return `<button data-item="${i.id}" class="${on ? 'on' : ''}"><span>${i.icon}</span><b>${i.label}</b><small>${on ? '✔ porți' : 'Îmbracă'}</small></button>`; }).join('')}</div>` : ''; }).join('') : '<p>Dulapul e gol… 🙂</p>'}`);
    m.querySelectorAll('[data-item]').forEach(b => b.addEventListener('click', () => {
      const it = ITEMS.find(i => i.id === (b as HTMLElement).dataset.item)!;
      const cur = (c.outfit as any)[it.slot];
      (c.outfit as any)[it.slot] = cur === it.id ? 'none' : it.id;
      s.sendCharSync(); s.me.actor.play('shy'); Sfx.play('pop');
      this.openWardrobe();
    }));
  }

  /** magazinul de haine (Croitoria din sat / buticul de la oras) */
  openClothes(tier: 'sat' | 'oras') {
    const s = this.s; const c = s.w.chars[s.myId];
    c.owned ??= []; c.outfit ??= { ...NO_OUTFIT };
    const list = ITEMS.filter(i => i.shop === tier);
    const m = this.modal(`<h3>${tier === 'sat' ? '🧵 Croitoria din sat' : '🛍️ Buticul de la oraș'}</h3><p class="sub">Ai 💰 ${s.w.money ?? 0} lei · cumperi pentru ${s.me.actor.spec.name}</p>
      <div class="shop">${list.map(i => { const own = c.owned!.includes(i.id); return `<button data-cl="${i.id}" class="${own ? 'on' : (s.w.money ?? 0) < i.price ? 'poor' : ''}"><span>${i.icon}</span><b>${i.label}</b><small>${own ? '✔ al tău' : '💰 ' + i.price + ' lei'}</small></button>`; }).join('')}</div>`);
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
    const online = tab === 'online';
    const tabs: [string, string][] = online ? [] : [['shop', '🛒 Magazin'], ['sell', '💱 Piața'], ['hall', '🏛️ Primăria'], ['town', '🏙️ Orașul']];
    if (online) tab = 'shop';
    let body = '';
    const LIST = online ? SHOP_ONLINE : SHOP_BUY;
    if (tab === 'shop') body = `<div class="shop">${LIST.map(it => `<button data-buy="${it.id}" class="${(w.money ?? 0) < it.price ? 'poor' : ''}"><span>${it.icon}</span><b>${it.label}</b><small>💰 ${it.price} lei</small></button>`).join('')}</div>`;
    if (tab === 'sell') body = `<p class="sub">Vinde ce ai strâns (câte 1 la fiecare apăsare)</p><div class="shop">${SHOP_SELL.map(it => `<button data-sell="${it.id}" class="${(r[it.id] ?? 0) < 1 ? 'poor' : ''}"><span>${it.icon}</span><b>${it.label} (${r[it.id] ?? 0})</b><small>+${it.price} lei</small></button>`).join('')}</div>`;
    if (tab === 'hall') body = `<p class="sub">Investiții mari pentru familia voastră</p><div class="shop">${GOALS.filter(g => g.cost).map(g => { const done = !!w.stats['goal-' + g.id]; const c = g.cost!; return `<button data-goal="${g.id}" class="${done ? 'on' : ''}"><span>${g.icon}</span><b>${g.text}</b><small>${done ? '✔ gata' : [c.money ? '💰' + c.money : '', c.wood ? '🪵' + c.wood : '', c.stone ? '🪨' + c.stone : ''].join(' ')}</small></button>`; }).join('')}</div>`;
    if (tab === 'town') body = `<p class="sub">🚌 Autobuzul spre oraș pleacă după ce vă mutați în Casa cea mare. Acolo: supermarket, magazin de haine, cinema, slujbe… (Capitolul 3)</p>`;
    const bike = online ? `<h4>🚲 Vehicule</h4><div class="shop"><button data-bike class="${(w.stats.bike ?? 0) > 0 ? 'on' : (w.money ?? 0) < 150 ? 'poor' : ''}"><span>🚲</span><b>Bicicletă pentru doi</b><small>${(w.stats.bike ?? 0) > 0 ? '✔ o aveți' : '💰 150 lei'}</small></button></div>` : '';
    const m = this.modal(`<h3>${online ? '💻 Magazin online · livrare la ușă' : '🏘️ Satul'}</h3><p class="sub">Ai 💰 ${w.money ?? 0} lei</p><div class="tabs">${tabs.map(([id, l]) => `<button data-tab="${id}" class="${id === tab ? 'on' : ''}">${l}</button>`).join('')}</div>${body}${bike}`);
    m.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => this.openVillage((b as HTMLElement).dataset.tab)));
    m.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const it = LIST.find(i => i.id === (b as HTMLElement).dataset.buy)!;
      if ((w.money ?? 0) < it.price) { this.toast('Nu ai destui bani 💰 — vinde la piață sau la tarabă'); Sfx.play('bad'); return; }
      s.op({ k: 'money', delta: -it.price }); for (const [k, n] of Object.entries(it.give)) s.op({ k: 'res', res: k, delta: n });
      Sfx.play('coin'); if (online) this.toast('📦 Curierul a lăsat coletul la ușă!'); this.openVillage(online ? 'online' : 'shop');
    }));
    m.querySelector('[data-bike]')?.addEventListener('click', () => {
      if ((w.stats.bike ?? 0) > 0) return;
      if ((w.money ?? 0) < 150) { this.toast('Nu ajung banii 💰 — taraba și lemnele!'); Sfx.play('bad'); return; }
      s.op({ k: 'money', delta: -150 }); s.op({ k: 'stat', key: 'bike', delta: 1 }); Sfx.play('good');
      this.toast('🚲 Ați cumpărat bicicleta! Satul vă așteaptă (indicatorul de lângă drum)'); s.log('Ați cumpărat o bicicletă pentru doi 🚲'); this.openVillage('online');
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

  setMinigame(on: boolean) { this.root.classList.toggle('in-mini', on); }
}

const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
