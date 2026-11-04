const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:5173/?skipload&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  const hide = () => p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 3; s.w.stats.bike = 1; s.w.stats.scooter = 1; s.syncPlaced(); s.me.gx = 3.5; s.me.gy = 21.5; s.partner.gx = 9; s.partner.gy = 18; });
  await hide(); await p.waitForTimeout(1500); await p.screenshot({ path: 'park_home.png' });
  // spre sat cu scuterul si inapoi
  await p.evaluate(() => { const s = game.scene; s.goArea('village'); }); await p.waitForTimeout(4600); await hide();
  await p.evaluate(() => { const s = game.scene; s.goArea('home'); }); await p.waitForTimeout(4700); await hide(); await p.waitForTimeout(600);
  console.log('dupa sat:', await p.evaluate(() => [game.scene.area, game.scene.me.gx.toFixed(1), game.scene.me.gy.toFixed(1), game.scene.nearestFurn(game.scene.me)?.id]));
  await p.screenshot({ path: 'park_arrive.png' });
  // din oras cu taxiul
  await p.evaluate(() => { const s = game.scene; s.goArea('village'); }); await p.waitForTimeout(4600);
  await p.evaluate(() => { const s = game.scene; s.goArea('city'); }); await p.waitForTimeout(4600);
  await p.evaluate(() => { const s = game.scene; s.forceVehicle = 'taxi'; s.goArea('home'); }); await p.waitForTimeout(4700); await hide();
  console.log('dupa taxi:', await p.evaluate(() => [game.scene.area, game.scene.me.gx.toFixed(1), game.scene.me.gy.toFixed(1)]));
  // din padure cu tractorul -> la tractor
  await p.evaluate(() => { const s = game.scene; s.goArea('forest'); }); await p.waitForTimeout(4600);
  await p.evaluate(() => { const s = game.scene; s.goArea('home'); }); await p.waitForTimeout(4700);
  console.log('dupa padure:', await p.evaluate(() => [game.scene.area, game.scene.me.gx.toFixed(1), game.scene.me.gy.toFixed(1)]));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
