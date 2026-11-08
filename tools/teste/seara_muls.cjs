// 1.10.0: rutina de seara — cand partenerul da X, la tine se termina si ea (nu mai ramai blocat/a, cu timpul oprit);
// orele de somn sarite de ceasul gazdei (x30 noaptea) iti refac energia. + mulsul nu mai ramane „inghetat”.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=sm' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1000);
  const E = (f, a) => p.evaluate(f, a);
  // 1) partenerul (alt telefon) da X: mesajul „quit” ajunge la tine
  await E(() => { const s = game.scene; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); s.partnerOnline = true; s.partner.control = 'remote'; s.startBedtime(); });
  await sleep(300);
  await E(() => game.scene.onMiniEvent('bubu', { k: 'bed', quit: true }));
  await sleep(5500);
  ok('partenerul da X: rutina se termina si la tine', await E(() => !game.scene.minigame));
  // 2) tu dai X: partenerul afla
  const sent = await E(() => { const s = game.scene, out = []; const o = s.net.sendEvent.bind(s.net); s.net.sendEvent = e => { out.push(e); return o(e); }; s.startBedtime(); s.minigame.obj.abort(); s.net.sendEvent = o; return out.filter(e => e.t === 'mini').map(e => JSON.stringify(e.data)); });
  ok('dai X: ii spui si partenerului', sent.some(x => x.includes('quit')), sent.join(' '));
  await sleep(2500);
  // 3) un „quit” vechi din inbox nu strica rutina de a doua zi
  await E(() => { const s = game.scene; s.miniInbox.push({ k: 'bed', quit: true }); s.startBedtime(); });
  await sleep(1500);
  ok('un X vechi nu inchide rutina urmatoare', await E(() => game.scene.minigame?.id === 'bedtime' && game.scene.minigame.obj.step !== 'night'));
  await E(() => game.scene.minigame.obj.abort()); await sleep(2500);
  // 4) ceasul gazdei sare 8 ore cat dormi: energia creste
  const r = await E(() => { const s = game.scene; const c = s.w.chars[s.myId]; c.needs.energy = 20; s.me.activity = { a: { id: 'sleep' }, t: 1, f: null }; const e0 = c.needs.energy; s.applyLocal({ k: 'clock', gameMin: (s.w.gameMin ?? 0) + 8 * 60 }); s.me.activity = null; return [e0, Math.round(c.needs.energy)]; });
  ok('8 ore de somn sarite de ceas: te trezesti odihnit/a', r[1] >= 90, JSON.stringify(r));
  // 5) mulsul: dupa cateva secunde personajul revine la normal
  const m = await E(async () => { const s = game.scene; s.partnerOnline = false; s.partner.control = 'ai'; const S = await import('/src/scenes/story.ts'); s.w.stats.cows = 1; s.w.stats['got-cows'] = 0; S.collect(s, 'cows'); return s.me.actor.anim.id; });
  await sleep(3200);
  const m2 = await E(() => game.scene.me.actor.anim.id);
  ok('mulsul: animatia se opreste singura', m === 'act_milk' && m2 !== 'act_milk', m + ' → ' + m2);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
