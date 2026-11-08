// Vanzatorul de la taraba (1.10.0): deschide taraba si cand esti departe (alt loc / apartament); cand lipseste faina
// sau lamaile le cumpara el cu banii vostri si serveste; cand lipsesc flori / legume iti spune (mesaj pe ecran)
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=tv' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1000);
  const E = (f, a) => p.evaluate(f, a);
  await E(() => { const s = game.scene; s.devSkipChapter(); s.devSkipChapter(); s.devSkipChapter(); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    window.__at = h => { s.w.gameMin = (s.w.day - 1) * 1440 + h * 60; s.w.minutes = h * 60; };
    window.__at(8); s.op({ k: 'furn', key: 'standBroken', value: false }); s.op({ k: 'furn', key: 'standOpen', value: false }); s.op({ k: 'money', delta: 300 });
    s.op({ k: 'town', key: 'staff', value: [{ id: 't', name: 'Ana', role: 'stall', wage: 20, skill: 2, unpaid: 0, days: 0 }] }); s.syncWalkers();
    const v = s.walkers.find(x => x.eid === 't'); v.x = 20; v.y = 19; if (v.job) { v.job.i = 99; v.job.route = null; v.job.at = false; }
    s.me.gx = 60; s.me.gy = 37; s.me.path = []; });
  const o = await E(() => { const s = game.scene; for (let i = 0; i < 20; i++) s.updateNpcs(0.1); return !!s.w.furn.standOpen; });
  ok('departe de casa: vanzatoarea deschide taraba singura', o);
  // client care vrea biscuiti (faina) si n-aveti faina: o cumpara ea
  const r = await E(() => { const s = game.scene; s.w.res.flour = 0; for (const k of Object.keys(s.w.res)) if (k.startsWith('prod_sweet')) s.w.res[k] = 0;
    s.npcs.length = 0; s.spawnNpc(false); const n = s.npcs[0]; n.wants = ['sweet:2']; n.pay = 43; n.state = 'wait'; s.stallServeT = 0; const m0 = s.w.money, f0 = s.w.stats.served ?? 0;
    for (let i = 0; i < 5; i++) s.updateNpcs(0.1);
    return { served: (s.w.stats.served ?? 0) - f0, money: s.w.money - m0, pay: n.pay, flour: s.w.res.flour, log: s.w.log.slice(-2).map(l => l.text) }; });
  ok('lipsesc 4 faina: le cumpara (20 lei) si serveste, tot cu castig', r.served === 1 && r.money === r.pay - 20 && r.money > 0 && r.flour === 0, JSON.stringify(r));
  const r2 = await E(() => { const s = game.scene; s.w.res.flour = 0; s.npcs.length = 0; s.spawnNpc(false); const n = s.npcs[0]; n.wants = ['sweet:3']; n.pay = 20; n.state = 'wait'; s.stallServeT = 0; const m0 = s.w.money; for (let i = 0; i < 5; i++) s.updateNpcs(0.1); return { money: s.w.money - m0, state: n.state }; });
  ok('nu cumpara in pierdere (8 faina pentru 20 lei)', r2.money === 0 && r2.state === 'leave', JSON.stringify(r2));
  // client care vrea flori si n-aveti: pleaca si iti spune pe ecran
  const t = await E(() => { const s = game.scene; for (const k of ['flower', 'tulip', 'rose', 'sunflower']) s.w.res[k] = 0; for (const k of Object.keys(s.w.res)) if (k.startsWith('prod_flower')) s.w.res[k] = 0;
    s.npcs.length = 0; s.spawnNpc(false); const n = s.npcs[0]; n.wants = ['flower:1']; n.state = 'wait'; s.stallServeT = 0; s.stallAskT = -999;
    for (let i = 0; i < 5; i++) s.updateNpcs(0.1); return [n.state, [...document.querySelectorAll('.toasts > *')].map(x => x.textContent).join(' | ')]; });
  ok('lipsesc florile: clientul pleaca si vanzatoarea iti cere marfa', t[0] === 'leave' && /Aduceți-mi marfă/.test(t[1]), JSON.stringify(t));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
