const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:5173';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
  await p.goto(URL + '/?skipload&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 4; s.w.stats.scooter = 1; s.syncPlaced && s.syncPlaced(); });
  const get = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  const measure = async (label, setup, ms = 8000) => {
    await p.evaluate(setup); await p.waitForTimeout(1500);
    await p.evaluate(() => { const s = game.scene; window.__f = 0; if (!s.__w) { s.__w = 1; const u = s.update.bind(s); s.update = dt => { window.__f++; u(dt); }; } });
    const a = await get(); await p.waitForTimeout(ms); const z = await get(); const f = await p.evaluate(() => window.__f);
    console.log(label.padEnd(22), JSON.stringify({ cadre_pe_s: +(f / (ms / 1000)).toFixed(1), ocupat_procent: Math.round((z.TaskDuration - a.TaskDuration) / (ms / 1000) * 100), heapMB: Math.round(z.JSHeapUsedSize / 1e6) }));
  };
  await measure('curtea (stai)', () => { const s = game.scene; s.me.gx = 8; s.me.gy = 17; });
  await measure('satul (stai)', () => { const s = game.scene; s.me.gx = 122; s.me.gy = 25; });
  await measure('orasul (stai)', () => { const s = game.scene; s.me.gx = 205; s.me.gy = 25.5; });
  await measure('scuter pe drum', () => { const s = game.scene; s.me.gx = 4; s.me.gy = 24.6; const f = s.furnList.find(f => f.id === 'h-scooter'); s.boardVehicle('scooter', f); s.rideStart(); }, 10000);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
