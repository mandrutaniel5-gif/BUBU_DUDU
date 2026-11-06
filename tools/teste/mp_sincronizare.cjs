const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 900, height: 500 } });
  const room = 'sy' + Date.now();
  const open = async who => { const p = await ctx.newPage(); await p.goto(`http://localhost:5173/?skipload&dev&who=${who}&mode=local&room=${room}#world`); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); return p; };
  const A = await open('dudu'); await sleep(1500);
  // A desfunda toaleta (lumea lui e noua)
  await A.evaluate(() => { const s = game.scene; s.op({ k: 'furn', key: 'clogged', value: false }); s.op({ k: 'stat', key: 'unclogged', delta: 1 }); s.save(true); });
  const B = await open('bubu'); await sleep(800);
  // B pare un telefon cu o lume veche: toaleta inca infundata
  await B.evaluate(() => { const s = game.scene; s.w.furn.clogged = true; s.w.stats.unclogged = 0; s.w.mod = Date.now() - 600000; s.net.sendEvent({ t: 'sync', who: s.myId, mod: s.w.mod }); });
  await sleep(2500);
  const r = await B.evaluate(() => ({ clog: game.scene.w.furn.clogged, unc: game.scene.w.stats.unclogged }));
  ok('telefonul cu lumea veche primeste lumea noua', r.clog === false && r.unc === 1, JSON.stringify(r));
  // invers: A nu ia lumea veche de la B
  const a2 = await A.evaluate(() => ({ clog: game.scene.w.furn.clogged }));
  ok('lumea noua nu e suprascrisa', a2.clog === false);
  // salvarea fara schimbari nu mai muta ora
  const t = await B.evaluate(async () => { const s = game.scene; const m = s.w.mod; await new Promise(r => setTimeout(r, 1200)); s.save(true); return [m, s.w.ts]; });
  ok('salvarea fara schimbari pastreaza ora ultimei schimbari', t[0] === t[1], JSON.stringify(t));
  await b.close();
})();
