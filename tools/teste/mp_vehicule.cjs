const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 900, height: 480 } });
  const errs = []; const room = 'mpv' + Date.now();
  const open = async who => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e)); await p.goto(`http://localhost:5173/?skipload&who=${who}&mode=local&room=${room}#world`); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 }); return p; };
  const D = await open('dudu'); const B = await open('bubu'); await D.waitForTimeout(2500);
  for (const p of [D, B]) await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 4; s.w.stats.scooter = 1; s.syncPlaced(); });
  const veh = p => p.evaluate(() => game.scene.furnList.filter(f => /scooter|tractor/.test(f.id)).map(f => f.id + '@' + f.gx + ',' + f.gy).join(' '));
  console.log('inainte  D:', await veh(D), '| B:', await veh(B));
  await D.evaluate(() => { const s = game.scene; s.me.gx = 2.5; s.me.gy = 23.6; s.boardVehicle('scooter', s.furnList.find(f => f.id === 'h-scooter')); s.rideStart(); });
  await D.waitForFunction(() => !game.scene.ride, null, { timeout: 30000 }); await B.waitForTimeout(1500);
  console.log('dupa     D:', await veh(D), '| B:', await veh(B));
  await D.evaluate(() => { const s = game.scene; s.me.gx = 20.5; s.me.gy = -2.3; s.interact(s.me, s.furnList.find(f => f.id === 'h-tractor')); });
  await D.waitForTimeout(1500); console.log('tractor pe drum: B vede parcat:', await veh(B), ' partener pe tractor:', await B.evaluate(() => [game.scene.partner.riding, game.scene.partner.rideKind]));
  await D.waitForFunction(() => !game.scene.ride, null, { timeout: 30000 }); await B.waitForTimeout(1500);
  console.log('tractor ajuns: B:', await veh(B));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
