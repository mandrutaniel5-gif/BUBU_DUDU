// 1.9.1: angajatii muncesc la vedere. Taietorul merge in padure, taie copaci (cu toporul) si cara lemnele acasa;
// spargatorul sparge bolovani; vanzatorul deschide taraba si serveste el clientii (banii intra); caruțașul duce lemne la cherestea.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=munca' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const E = (f, a) => p.evaluate(f, a);
  const hide = () => E(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await E(async () => { const s = game.scene; s.devSkipChapter(); s.devSkipChapter(); s.devSkipChapter(); });
  await sleep(1200); await hide();
  await E(() => {
    const s = game.scene; s.w.gameMin = Math.floor(s.w.gameMin / 1440) * 1440 + 9 * 60; s.w.minutes = 9 * 60;
    s.op({ k: 'furn', key: 'standBroken', value: false }); s.op({ k: 'furn', key: 'standOpen', value: false }); s.op({ k: 'money', delta: 500 });
    const mk = (id, role) => ({ id, name: 'T' + id, role, wage: 20, skill: 3, unpaid: 0, days: 0 });
    s.op({ k: 'town', key: 'staff', value: [mk('w', 'wood'), mk('t', 'stall'), mk('s', 'stone'), mk('c', 'carter')] });
    s.syncWalkers(); s.me.gx = 12; s.me.gy = 17;
  });
  const chap = await E(() => game.scene.chapter); console.log('capitol', chap);
  // simulam 120 s de munca (pas cu pas, ca in joc)
  const sim = await E(() => {
    const s = game.scene, W = id => s.walkers.find(v => v.eid === id), log = { wood: [], stone: [], carter: [] };
    for (let i = 0; i < 1500; i++) {
      s.updateWalkers(0.1);
      if (i % 10 === 0) for (const [k, id] of [['wood', 'w'], ['stone', 's'], ['carter', 'c']]) { const v = W(id); log[k].push([+v.x.toFixed(1), +v.y.toFixed(1), v.a.anim.id]); }
    }
    return log;
  });
  const inForest = l => l.some(([x, y]) => y < -10);
  const chopF = sim.wood.filter(([x, y, a]) => a === 'act_chop' && y < -10).length, haul = sim.wood.filter(([, , a]) => a === 'act_haul_logs').length;
  ok('taietorul merge in padure si taie copaci', inForest(sim.wood) && chopF > 10, `chop in padure ${chopF}`);
  ok('taietorul cara lemnele acasa', haul > 5 && sim.wood.some(([x, y]) => Math.hypot(x - 15.6, y - 14.6) < 0.5), `haul ${haul}`);
  ok('spargatorul sparge bolovani in padure', inForest(sim.stone) && sim.stone.filter(([, y, a]) => a === 'act_mine' && y < -10).length > 10);
  ok('carausul cara lemne la cherestea', sim.carter.filter(([, , a]) => a === 'act_haul_logs').length > 5 && sim.carter.some(([x, y]) => Math.hypot(x - 25.4, y - 19) < 3), JSON.stringify(sim.carter.slice(-3)));
  // nu calca prin obiecte: niciun punct al lor nu e intr-o dala blocata
  const bad = await E(log => { const s = game.scene; return [...log.wood, ...log.stone, ...log.carter].filter(([x, y]) => s.nav.isBlocked(Math.floor(x), Math.floor(y))).length; }, sim);
  ok('nu trec prin copaci, pereti sau garduri', bad === 0, String(bad));

  // taraba: vanzatorul o deschide si serveste clientii
  const stall = await E(() => {
    const s = game.scene, v = s.walkers.find(x => x.eid === 't'); const m0 = s.w.money, sv0 = s.w.stats.served ?? 0;
    for (let i = 0; i < 4; i++) s.spawnNpc(false);
    const out = { open: 0, x: +v.x.toFixed(2), y: +v.y.toFixed(2) };
    for (let i = 0; i < 1200; i++) { s.updateNpcs(0.1); s.updateWalkers(0.1); }
    out.open = !!s.w.furn.standOpen; out.money = s.w.money - m0; out.served = (s.w.stats.served ?? 0) - sv0; out.done = s.w.town?.staff?.find(e => e.id === 't')?.done;
    return out;
  });
  ok('vanzatorul deschide taraba si serveste clientii', stall.open && stall.served >= 4 && stall.money > 0, JSON.stringify(stall));
  ok('vanzatorul sta in spatele tarabei (cu fata la clienti)', Math.abs(stall.x - 8.0) < 0.1 && Math.abs(stall.y - 22.45) < 0.1);

  // poze: taraba cu client servit, taietorul in padure
  await E(() => { const s = game.scene; s.stallServeT = 0; for (let i = 0; i < 2; i++) s.spawnNpc(false); s.me.gx = 11; s.me.gy = 21.5; globalThis.__camAt = { x: 8.5, y: 23 }; });
  await sleep(17000); await hide(); await p.screenshot({ path: 'mu_taraba.png' });
  await E(() => { const s = game.scene, v = s.walkers.find(x => x.eid === 'w'); v.job.steps = s.staffPlan(v); v.job.i = 0; v.job.at = false; v.job.route = null; const st = v.job.steps[0]; v.x = st.x; v.y = st.y; s.me.gx = st.x + 2; s.me.gy = st.y + 1.5; globalThis.__camAt = { x: st.x, y: st.y }; });
  await sleep(2500); await hide(); await p.screenshot({ path: 'mu_padure.png' });
  await E(() => { const s = game.scene, v = s.walkers.find(x => x.eid === 'w'); const st = v.job.steps[v.job.steps.length - 1]; v.job.i = v.job.steps.length - 1; v.job.at = false; v.job.route = s.nav.path(st.x + 3, st.y - 3, st.x, st.y); v.x = st.x + 3; v.y = st.y - 3; s.me.gx = st.x + 1; s.me.gy = st.y + 1; globalThis.__camAt = { x: st.x + 2, y: st.y - 1 }; });
  await sleep(1200); await hide(); await p.screenshot({ path: 'mu_cara.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
