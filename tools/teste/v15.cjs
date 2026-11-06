// 1.5.0: butoanele de test (capitol, resurse infinite), stiva de lemne din Capitolul 1, iesirea de sub pat,
// fasia din spatele casei blocata, banca (amandoi pe sezut), indicatoarele
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 600 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await sleep(800);
  await p.evaluate(() => { localStorage.removeItem('bd-infinite'); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); });
  const ok = (name, cond, extra = '') => console.log((cond ? 'OK  ' : 'FAIL') + ' ' + name + (extra ? '  ' + extra : ''));
  // capitolul: din fereastra de obiective
  const ch0 = await p.evaluate(() => game.scene.chapter);
  await p.evaluate(() => game.scene.hud.openGoals());
  ok('butoanele de test in obiective', await p.locator('[data-dev="skip"]').count() === 1 && await p.locator('[data-dev="inf"]').count() === 1);
  await p.screenshot({ path: 'v15_obiective.png' });
  await p.click('[data-dev="skip"]'); await sleep(1500);
  const ch1 = await p.evaluate(() => game.scene.chapter);
  ok('capitolul urmator', ch1 === ch0 + 1, `${ch0} -> ${ch1}`);
  await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  // resurse infinite
  await p.evaluate(() => game.scene.hud.openGoals()); await p.click('[data-dev="inf"]'); await sleep(400);
  const inf = await p.evaluate(() => ({ on: game.scene.infinite, money: game.scene.w.money, wood: game.scene.w.res.wood, flour: game.scene.w.res.flour, seed: game.scene.w.res.seed_carrot }));
  ok('resurse infinite pornite', inf.on && inf.money >= 99999 && inf.wood >= 999, JSON.stringify(inf));
  await p.evaluate(() => { const s = game.scene; s.op({ k: 'money', delta: -99000 }); s.op({ k: 'res', res: 'wood', delta: -900 }); });
  await sleep(3600);
  const inf2 = await p.evaluate(() => ({ money: game.scene.w.money, wood: game.scene.w.res.wood }));
  ok('se umplu din nou', inf2.money >= 99999 && inf2.wood >= 999, JSON.stringify(inf2));
  await p.evaluate(() => { game.scene.setInfinite(false); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); });
  // din 1.6.0: lemnele se vand la Cheresteaua lui Nea Vasile (testul e in cherestea.cjs); stiva din curte doar le arata
  const sell = await p.evaluate(async () => {
    const s = game.scene; const has = s.furnList.some(f => f.id === 'h-wood') && s.furnList.some(f => f.id === 'w-sawmill');
    const m0 = s.w.money; s.me.gx = 17.5; s.me.gy = 16.6; s.me.path = []; s.goTo('h-wood');
    await new Promise(r => setTimeout(r, 2500));
    return { ch: s.chapter, has, lei: s.w.money - m0 };
  });
  ok('Capitolul 1: stiva din curte + cheresteaua pe drum', sell.ch === 1 && sell.has && sell.lei === 0, JSON.stringify(sell));
  // iesirea de sub pat / dintr-un obstacol
  const un = await p.evaluate(async () => { const s = game.scene; s.me.activity = null; s.me.gx = 4; s.me.gy = 3.5; s.me.z = 0; s.me.path = []; await new Promise(r => setTimeout(r, 1500)); return [s.me.gx, s.me.gy, s.nav.hits(s.me.gx, s.me.gy, 0.12)]; });
  ok('scos de sub pat', un[2] === false, un.map(v => typeof v === 'number' ? v.toFixed(2) : v).join(','));
  // in spatele casei nu se mai poate ajunge
  const back = await p.evaluate(() => { const s = game.scene; return [s.nav.path(16.5, 1.5, 6.5, 1.0), s.nav.path(16.5, 1.5, 1.0, 6.5)]; });
  ok('fasia din spatele casei e blocata', back[0] === null && back[1] === null);
  // banca: amandoi pe sezut
  const bench = await p.evaluate(async () => { const s = game.scene; const toasts = []; const T = s.hud.toast.bind(s.hud); s.hud.toast = (m) => { toasts.push(m); T(m); }; window.__t = toasts; s.me.gx = 3; s.me.gy = 16; s.partner.gx = 4; s.partner.gy = 16; s.me.path = []; s.partner.path = []; s.goTo('bench', 'me'); s.goTo('bench', 'partner');
    for (let i = 0; i < 40 && !(s.me.activity && s.partner.activity); i++) await new Promise(r => setTimeout(r, 200));
    return [s.me, s.partner].map(q => ({ act: q.activity?.a.id, x: +q.gx.toFixed(2), y: +q.gy.toFixed(2), z: q.z, flip: q.actor.flip, pend: q.pendingInteract?.id, path: q.path.length, ctl: q.control, mg: !!s.minigame, t: window.__t })); });
  ok('banca: amandoi stau pe sezut', bench.every(q => q.act === 'bench' && q.z > 10 && q.y > 14 && q.y < 15) && bench[0].x !== bench[1].x, JSON.stringify(bench));
  await p.evaluate(() => { const s = game.scene; document.querySelector('.hud').style.display = 'none'; s.cam.zoom = 2.2; const c = { x: (3 - 14.5) * 32, y: (17.5) * 16 - 30 }; s.cam.x = c.x; s.cam.y = c.y; });
  await sleep(500); await p.screenshot({ path: 'v15_banca.png' });
  await sleep(6500);
  const after = await p.evaluate(() => { const s = game.scene; return [s.me, s.partner].map(q => ({ act: q.activity?.a.id ?? null, z: q.z, hit: s.nav.hits(q.gx, q.gy, 0.12) })); });
  ok('dupa banca: in picioare, liberi', after.every(q => !q.act && q.z === 0 && !q.hit), JSON.stringify(after));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
