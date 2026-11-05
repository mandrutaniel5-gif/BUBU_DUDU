const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:5173/?skipload&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  const hide = () => p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 4; s.w.stats.apartment = 1; s.w.gameMin = Math.floor(s.w.gameMin / 1440) * 1440 + 11 * 60; s.debugGo('city'); });
  await p.waitForTimeout(4600); await hide();
  await p.evaluate(() => { const s = game.scene; s.me.gx = 190 + 3; s.me.gy = 12 + 25.2; s.partner.gx = 190 + 4; s.partner.gy = 12 + 25.4; }); await p.waitForTimeout(2000);
  await p.screenshot({ path: 'apt2_city_door.png' });
  console.log('near:', await p.evaluate(() => game.scene.nearestFurn(game.scene.me)?.id));
  // intra pe usa
  await p.evaluate(() => { const s = game.scene; const f = s.nearestFurn(s.me); s.interact(s.me, f); });
  for (const [n, ms] of [['a', 900], ['b', 900], ['c', 700]]) { await p.waitForTimeout(ms); await p.screenshot({ path: `apt2_up_${n}.png` }); }
  await p.waitForTimeout(1500); await hide(); await p.screenshot({ path: 'apt2_inside.png' });
  console.log('area', await p.evaluate(() => [game.scene.area, game.scene.me.gx.toFixed(1), game.scene.me.gy.toFixed(1), game.scene.nearestFurn(game.scene.me)?.id]));
  await p.evaluate(() => { const s = game.scene; s.w.gameMin = Math.floor(s.w.gameMin / 1440) * 1440 + 22 * 60; }); await p.waitForTimeout(600); await p.screenshot({ path: 'apt2_inside_night.png' });
  await p.evaluate(() => { const s = game.scene; s.w.gameMin = Math.floor(s.w.gameMin / 1440) * 1440 + 12 * 60; const f = s.nearestFurn(s.me); s.interact(s.me, f); });
  for (const [n, ms] of [['a', 1000], ['b', 900]]) { await p.waitForTimeout(ms); await p.screenshot({ path: `apt2_down_${n}.png` }); }
  await p.waitForTimeout(1800); await hide(); await p.screenshot({ path: 'apt2_back_city.png' });
  console.log('back', await p.evaluate(() => [game.scene.area, game.scene.me.gx.toFixed(1), game.scene.me.gy.toFixed(1)]));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
