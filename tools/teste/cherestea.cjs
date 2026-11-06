// Cheresteaua lui Nea Vasile: cantarul, comenzile, gaterul; partenerul AI duce lemne; stiva din curte doar informeaza
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=saw' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const hide = () => p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await p.evaluate(() => { const s = game.scene; s.devSkipChapter(); s.w.minutes = 10 * 60; s.op({ k: 'res', res: 'wood', delta: 30 - (s.w.res.wood ?? 0) }); });
  await sleep(1200); await hide();
  const has = await p.evaluate(() => { const f = game.scene.furnList.find(f => f.id === 'w-sawmill'); return f && [f.gx, f.gy]; });
  ok('cheresteaua e pe drum', !!has, JSON.stringify(has));
  // mergi pana la ea
  const arrived = await p.evaluate(async () => { const s = game.scene; s.me.gx = 24; s.me.gy = 24.5; s.goTo('w-sawmill'); for (let i = 0; i < 60 && !s.minigame; i++) await new Promise(r => setTimeout(r, 200)); return s.minigame?.id; });
  ok('intri in curtea cheresteliei', arrived === 'sawmill', arrived);
  await sleep(800); await hide(); await p.screenshot({ path: 'saw_yard.png' });
  const m0 = await p.evaluate(() => ({ money: game.scene.w.money, wood: game.scene.w.res.wood, price: game.scene.minigame.obj.price(), n: game.scene.minigame.obj.sellN }));
  await p.evaluate(() => game.scene.minigame.obj.press('sell')); await sleep(1100); await p.screenshot({ path: 'saw_selling.png' });
  await p.evaluate(async () => { for (let i = 0; i < 150 && game.scene.minigame?.obj.carrying; i++) await new Promise(r => setTimeout(r, 200)); }); await sleep(600);
  const m1 = await p.evaluate(() => ({ money: game.scene.w.money, wood: game.scene.w.res.wood }));
  ok('vanzarea la cantar (+ premiul obiectivului, daca s-a bifat)', [0, 10].includes(m1.money - m0.money - m0.n * m0.price) && m0.wood - m1.wood === m0.n, JSON.stringify({ m0, m1 }));
  ok('5 lemne raman pentru soba', m1.wood >= 5);
  await p.screenshot({ path: 'saw_sold.png' });
  // gaterul: tinem linia cu calculul (ca un jucator bun)
  await p.evaluate(() => { const s = game.scene; s.op({ k: 'res', res: 'wood', delta: 20 }); s.minigame.obj.press('saw'); });
  await sleep(1500); await p.screenshot({ path: 'saw_gater.png' });
  await p.evaluate(async () => { const g = game.scene.minigame.obj; while (g.saw) { if (g.saw) g.saw.off = -g.chalk(Math.max(0, Math.min(1, g.saw.x))); await new Promise(r => setTimeout(r, 30)); } });
  const pl = await p.evaluate(() => game.scene.w.res.plank ?? 0);
  ok('scanduri taiate bine (3 busteni -> 5-6)', pl >= 5, 'scanduri: ' + pl);
  // comenzile
  const ord = await p.evaluate(() => { const g = game.scene.minigame.obj; const o = g.orders(); const r = []; for (const x of o) { const before = game.scene.w.money; g.press('ord' + x.idx); r.push({ res: x.res, qty: x.qty, paid: game.scene.w.money - before, done: g.orderDone(x.idx) }); } return r; });
  ok('comenzile zilei', ord.every(o => o.done ? o.paid > 0 : o.paid === 0), JSON.stringify(ord));
  await sleep(600); await p.screenshot({ path: 'saw_orders.png' });
  await p.evaluate(() => game.scene.minigame.obj.abort()); await sleep(2500);
  // stiva din curte a fost scoasa (1.8.6)
  ok('nu mai e stiva de lemne in curte', await p.evaluate(() => !game.scene.furnList.some(f => f.id === 'h-wood')));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
