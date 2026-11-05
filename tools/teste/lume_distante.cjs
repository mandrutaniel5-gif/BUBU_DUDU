const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 860, height: 400 } })).newPage();
  await p.goto('http://localhost:5173/?skipload&who=bubu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 4; s.syncPlaced(); });
  const r = await p.evaluate(() => { const s = game.scene; const len = q => q.reduce((a, c, i) => i ? a + Math.hypot(c.x - q[i - 1].x, c.y - q[i - 1].y) : 0, 0);
    const t0 = performance.now(); const a = s.nav.path(5.5, 13.5, 122, 25, 60000); const t1 = performance.now(); const c = s.nav.path(122, 25, 205, 25.5, 60000);
    return { casa_sat_dale: a && len(a).toFixed(0), secunde_mers: a && (len(a) / 2.6).toFixed(0), secunde_alergat: a && (len(a) / 2.6 / 1.75).toFixed(0), ms_cautare: (t1 - t0).toFixed(0), sat_oras_dale: c && len(c).toFixed(0) }; });
  console.log(JSON.stringify(r)); await b.close();
})();
