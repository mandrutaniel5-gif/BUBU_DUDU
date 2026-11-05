const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 900, height: 500 } });
  const room = 'bk' + Date.now();
  const open = async who => { const p = await ctx.newPage(); await p.goto(`http://localhost:5173/?skipload&who=${who}&mode=local&room=${room}#world`); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); return p; };
  const A = await open('dudu'); const B = await open('bubu'); await sleep(2500);
  await A.evaluate(() => { const s = game.scene; s.devSkipChapter(); s.devSkipChapter(); s.op({ k: 'money', delta: 1000 }); });
  await sleep(800);
  const before = await B.evaluate(() => game.scene.furnList.some(f => f.id === 'h-bike'));
  await A.evaluate(() => { const s = game.scene; s.op({ k: 'money', delta: -350 }); s.op({ k: 'stat', key: 'bike', delta: 1 }); s.syncPlaced(); });
  await sleep(1200);
  const after = await B.evaluate(() => game.scene.furnList.some(f => f.id === 'h-bike'));
  console.log(!before && after ? 'OK   partenerul vede bicicleta imediat' : 'FAIL', { before, after });
  await b.close();
})();
