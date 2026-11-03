// Interfata de joc (DOM peste canvas).
import type { WorldScene } from '../scenes/world';
import { PAIRS } from '../scenes/world';
import { ANIM_LIST } from '../char/anims';
import { NEEDS, NEED_INFO, SICK_INFO, REQUESTS, clockText, nightAmount } from '../game/state';
import { Sfx } from '../engine/sfx';
import type { NetStatus } from '../net/types';

const MOOD_TXT: Record<string, string> = {
  happy: 'Fericit(ă) 😊', calm: 'Liniștit(ă) 🙂', sad: 'Trist(ă) 😢', angry: 'Furios(ă) 😠', sleepy: 'Somnoros(oasă) 😪',
  sick: 'Bolnav(ă) 🤒', hungry: 'Flămând(ă) 🤤', love: 'Îndrăgostit(ă) 🥰', sulky: 'Bosumflat(ă) 😒',
};

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
      <div class="clock"><span class="time">09:00</span><span class="day">Ziua 1</span><span class="hearts">💗 0</span></div>
      <div class="card partner">
        <div class="name">${pa.id === 'bubu' ? '🐼' : '🐻'} ${pa.name} <span class="pst">🤖 AI</span></div>
        <div class="pmood"></div>
        <div class="netline"><i class="dot"></i><span class="net">solo</span> <button class="mini-btn" data-a="menu">⚙</button></div>
      </div>
      <div class="actions">
        <button class="act big" data-a="action"><span class="ic">✋</span><span class="lb">Acțiune</span></button>
        <div class="row">
          <button class="act" data-a="emotes" title="Emote-uri (Q)"><span class="ic">😊</span></button>
          <button class="act" data-a="pairs" title="Împreună (R)"><span class="ic">💞</span></button>
          <button class="act fart" data-a="fart" title="Super-salt (F)"><span class="ic">💨</span><i class="fill"></i></button>
        </div>
      </div>
      <div class="pop emotes hidden"><h4>Emote-uri & dansuri</h4><div class="grid">${emotes.map(a => `<button data-emote="${a.id}"><span>${a.icon}</span>${a.label}</button>`).join('')}</div></div>
      <div class="pop pairs hidden"><h4>Împreună 💞</h4><div class="grid">${PAIRS.filter(p => !p.only || p.only === s.myId).map(p => `<button data-pair="${p.id}"><span>${p.icon}</span>${p.label}</button>`).join('')}</div></div>
      <div class="toasts"></div>
      <div class="modal hidden"></div>
    `;
    document.getElementById('ui')!.appendChild(root);
    this.root = root;
    for (const sel of ['.me .mood', '.me .sick', '.clock .time', '.clock .day', '.clock .hearts', '.pst', '.pmood', '.net', '.dot', '[data-a="action"]', '.emotes', '.pairs', '.toasts', '.modal', '.fart .fill', '[data-a="pairs"]']) this.els[sel] = root.querySelector(sel)!;
    root.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null; if (!b) return;
      Sfx.unlock(); Sfx.play('click');
      const a = b.dataset.a;
      if (a === 'action') s.doAction();
      if (a === 'emotes') this.toggleEmotes();
      if (a === 'pairs') this.togglePairs();
      if (a === 'fart') s.fartJump();
      if (a === 'bell') s.ringBell();
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
    this.els['.me .mood'].textContent = MOOD_TXT[s.me.actor.mood] ?? '';
    const sk = this.els['.me .sick'];
    sk.classList.toggle('hidden', !c.sick);
    if (c.sick) { const t = `${SICK_INFO[c.sick].icon} ${SICK_INFO[c.sick].label}${c.request ? ' · vrei ' + (REQUESTS[c.request]?.icon ?? '') : ''}`; if (sk.dataset.t !== t) { sk.dataset.t = t; sk.innerHTML = `${t} <button class="mini-btn" data-a="bell">🔔 Cheamă</button>`; } }
    this.els['.clock .time'].textContent = (nightAmount(w.minutes) > 0.5 ? '🌙 ' : '☀️ ') + clockText(w.minutes);
    this.els['.clock .day'].textContent = `Ziua ${w.day}`;
    this.els['.clock .hearts'].textContent = `💗 ${w.hearts}`;
    const pc = w.chars[s.partner.id];
    this.els['.pmood'].textContent = (MOOD_TXT[s.partner.actor.mood] ?? '') + (pc.sick ? ` · ${SICK_INFO[pc.sick].icon} bolnav(ă)` : '');
    (this.els['.fart .fill'] as HTMLElement).style.height = c.fart + '%';
    this.els['[data-a="pairs"]'].classList.toggle('glow', s.nearPartner());
    // butonul de actiune
    let label = '…', icon = '✋';
    if (s.me.activity) { label = 'Oprește'; icon = '⏹'; }
    else {
      const f = s.nearestFurn(s.me); const act = f && s.actionFor(f);
      if (act) { label = act.label; icon = act.icon; }
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

  setMinigame(on: boolean) { this.root.classList.toggle('in-mini', on); }
}

const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
