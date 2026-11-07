// Angajatii lucreaza PESTE ZI (1.9.0): intre 8 si 18, ora de ora, aduc lemne / pietre / flori / bani, gradinarul uda
// razoarele; la locul lor de munca au animatie de lucru si „+1 🪵” deasupra capului
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=azi' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1500);
  const E = (f, a) => p.evaluate(f, a);
  await E(() => { const s = game.scene; s.devSkipChapter(); s.devSkipChapter(); s.op({ k: 'money', delta: 500 });
    const mk = (id, role) => ({ id, name: 'Ion' + id, role, wage: 20, skill: 2, unpaid: 0, days: 0 });
    s.op({ k: 'town', key: 'staff', value: [mk('w', 'wood'), mk('p', 'picker'), mk('g', 'garden')] }); s.syncWalkers();
    s.w.plots = s.w.plots ?? {}; const k = Object.keys(s.w.plots)[0]; s.w.plots[k] = { crop: 'carrot', prog: 0.2, wetUntil: 0, fert: 0 };
    window.__at = h => { const s = game.scene; s.w.gameMin = (s.w.day - 1) * 1440 + h * 60 + 1; }; window.__at(7); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); });
  const r0 = await E(() => ({ ...game.scene.w.res }));
  // trec orele de lucru, cate una
  const seen = [];
  for (let h = 8; h <= 12; h++) {
    await E(h => window.__at(h), h); await sleep(1400);
    seen.push(await E(() => { const s = game.scene; return { wood: s.w.res.wood, flower: s.w.res.flower }; }));
  }
  const r1 = await E(() => ({ ...game.scene.w.res }));
  ok('taietorul aduce lemne peste zi', r1.wood > r0.wood, JSON.stringify(seen));
  ok('culegatoarea aduce flori peste zi', r1.flower > r0.flower);
  const wet = await E(() => { const s = game.scene; return Object.values(s.w.plots).filter(p => p.crop).every(p => p.wetUntil > s.w.gameMin); });
  ok('gradinarul uda razoarele peste zi', wet);
  // seara nu mai lucreaza
  await E(() => window.__at(20)); await sleep(1400);
  const w20 = await E(() => game.scene.w.res.wood); await E(() => window.__at(21)); await sleep(1400);
  ok('noaptea nu lucreaza', (await E(() => game.scene.w.res.wood)) === w20);
  // la locul de munca: animatie de lucru
  await E(() => { const s = game.scene; window.__at(10); const v = s.walkers.find(x => x.eid === 'w'); s.me.gx = v.x - 2.5; s.me.gy = v.y + 2.5; s.me.path = []; });
  await p.waitForFunction(() => game.scene.walkers.find(x => x.eid === 'w').working, null, { timeout: 20000 }).catch(() => {});
  const anim = await E(() => { const s = game.scene, v = s.walkers.find(x => x.eid === 'w'); const t = s.furnList.filter(f => f.type === 'tree').map(f => Math.hypot(f.gx + 0.5 - v.x, f.gy + 0.5 - v.y)); return { working: v.working, work: v.work, nearTree: +Math.min(...t).toFixed(2) }; });
  ok('taietorul lucreaza langa un copac (animatie)', anim.working && anim.work === 'act_chop' && anim.nearTree < 1.4, JSON.stringify(anim));
  await E(() => { document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); game.scene.staffFx('w', '+1 🪵'); }); await sleep(250); await p.screenshot({ path: 'angajat_lucreaza.png' }); await sleep(1500); await p.screenshot({ path: 'angajat_lucreaza2.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
