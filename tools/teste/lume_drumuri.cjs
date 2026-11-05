const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 860, height: 400 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await p.waitForTimeout(800); await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 4; s.w.stats.bike = 1; s.w.stats.scooter = 1; s.w.money = 500; s.syncPlaced(); s.me.gx = 4; s.me.gy = 24.6; });
  const st = (tag) => p.evaluate((tag) => { const s = game.scene; return tag + ' ' + JSON.stringify({ area: s.area, pos: [+s.me.gx.toFixed(1), +s.me.gy.toFixed(1)], ride: s.ride ? s.ride.kind + '→' + s.ride.dest + ' ' + s.ride.s.toFixed(0) + '/' + s.ride.len.toFixed(0) : null, veh: s.w.veh, partner: [+s.partner.gx.toFixed(1), +s.partner.gy.toFixed(1), !!s.partner.passenger], space: s.space }); }, tag);
  const F = (id) => p.evaluate((id) => !!game.scene.furnList.find(f => f.id === id), id);
  // 1) scuterul acasa -> sat, cu AI-ul chemat in spate
  await p.evaluate(() => { const s = game.scene; s.partner.gx = 6; s.partner.gy = 24.5; s.partner.activity = null; const f = s.furnList.find(f => f.id === 'h-scooter'); s.boardVehicle('scooter', f); s.rideCall(); });
  await p.waitForTimeout(2500); console.log(await st('dupa chemare'));
  await p.evaluate(() => game.scene.rideStart());
  await p.waitForTimeout(3000); console.log(await st('pe drum 3s')); await p.screenshot({ path: 'r_ride1.png' });
  await p.waitForTimeout(5000); console.log(await st('pe drum 8s')); await p.screenshot({ path: 'r_ride2.png' });
  await p.waitForFunction(() => !game.scene.ride, null, { timeout: 30000 }); console.log(await st('ajuns'), 'v-scooter parcat:', await F('v-scooter'), 'h-scooter:', await F('h-scooter'));
  await p.waitForTimeout(600); await p.screenshot({ path: 'r_arrive.png' });
  // 2) autobuzul sat -> oras (singur)
  await p.evaluate(() => { const s = game.scene; s.partner.follow = false; s.me.gx = 131.5; s.me.gy = 24.4; s.villageAction('v-bus', s.furnList.find(f => f.id === 'v-bus')); });
  await p.waitForTimeout(400); await p.evaluate(() => { const b = [...document.querySelectorAll('.modal:not(.hidden) [data-ch]')]; if (b[0]) b[0].click(); });
  await p.waitForTimeout(2500); console.log(await st('autobuz')); await p.screenshot({ path: 'r_bus.png' });
  await p.waitForFunction(() => !game.scene.ride, null, { timeout: 30000 }); console.log(await st('in oras'));
  // 3) apartamentul (usa) si inapoi
  await p.evaluate(() => { const s = game.scene; s.w.stats.apartment = 1; s.cityAction('c-tower', s.furnList.find(f => f.id === 'c-towerdoor')); });
  await p.waitForTimeout(3600); console.log(await st('apartament'));
  await p.evaluate(() => { const s = game.scene; s.cityAction('a-exit', s.furnList.find(f => f.id === 'a-door')); });
  await p.waitForTimeout(3600); console.log(await st('iesit din bloc'));
  // 4) taxiul oras -> acasa
  await p.evaluate(() => { const s = game.scene; s.cityAction('c-taxi', s.furnList.find(f => f.id === 'c-taxi')); });
  await p.waitForTimeout(400); await p.evaluate(() => { const b = [...document.querySelectorAll('.modal:not(.hidden) [data-ch]')]; if (b[0]) b[0].click(); });
  await p.waitForTimeout(4000); console.log(await st('taxi')); await p.screenshot({ path: 'r_taxi.png' });
  await p.waitForFunction(() => !game.scene.ride, null, { timeout: 40000 }); console.log(await st('acasa cu taxiul'));
  // 5) tractorul la padure si inapoi
  await p.evaluate(() => { const s = game.scene; s.me.gx = 20.5; s.me.gy = -2.3; s.interact(s.me, s.furnList.find(f => f.id === 'h-tractor')); });
  await p.waitForTimeout(1500); await p.screenshot({ path: 'r_tractor.png' });
  await p.waitForFunction(() => !game.scene.ride, null, { timeout: 20000 }); console.log(await st('padure'), 'f-tractor:', await F('f-tractor'));
  await p.evaluate(() => { const s = game.scene; s.interact(s.me, s.furnList.find(f => f.id === 'f-tractor')); });
  await p.waitForFunction(() => !game.scene.ride, null, { timeout: 20000 }); console.log(await st('acasa cu tractorul'), 'h-tractor:', await F('h-tractor'));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
