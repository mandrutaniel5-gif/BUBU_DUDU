const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 560 } });
  const errs = [];
  const room = 'mp' + Date.now();
  const open = async who => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e)); p.on('console', m => { if (m.type() === 'error' && !/firebase|ERR_|Failed to load|WebSocket/i.test(m.text())) errs.push(who + ' console: ' + m.text()); }); await p.goto(`http://localhost:5173/?skipload&who=${who}&mode=local&room=${room}#world`); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 }); return p; };
  const D = await open('dudu'); const B = await open('bubu');
  const hide = p => p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await D.waitForTimeout(3000);
  const st = async () => ({ D: await D.evaluate(() => [game.scene.area, game.scene.partnerOnline, game.scene.partner.control]), B: await B.evaluate(() => [game.scene.area, game.scene.partnerOnline]) });
  console.log('conectati:', JSON.stringify(await st()));
  // 1. vehicule: doar bicicleta cumparata; Dudu urca si porneste
  for (const p of [D, B]) await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 4; s.w.stats.bike = 1; s.w.stats.scooter = 0; s.w.money = 500; s.syncPlaced(); });
  await hide(D); await hide(B);
  await D.evaluate(() => { const s = game.scene; s.me.gx = 4.5; s.me.gy = 24.4; s.me.riding = true; s.me.rideKind = 'bike'; s.me.actor.moving = true; });
  await D.waitForTimeout(1500);
  console.log('Bubu vede vehiculul lui Dudu:', await B.evaluate(() => [game.scene.partner.riding, game.scene.partner.rideKind]));
  await D.evaluate(() => { const s = game.scene; s.me.riding = false; s.me.actor.moving = false; });
  // amandoi in sat (fiecare cu drumul lui)
  for (const p of [D, B]) await p.evaluate(() => game.scene.goArea('village', 'solo'));
  await D.waitForTimeout(5000); await hide(D); await hide(B);
  await D.evaluate(() => { const s = game.scene; s.me.gx = 19; s.me.gy = 12.6; }); await B.evaluate(() => { const s = game.scene; s.me.gx = 19.6; s.me.gy = 13.2; });
  await D.waitForTimeout(1500);
  // 2. autobuz: Dudu alege SINGUR -> Bubu ramane in sat
  await D.evaluate(() => game.scene.villageAction('v-bus', { id: 'v-bus', gx: 20, gy: 12, w: 1, d: 1 }));
  await D.waitForTimeout(400); await D.screenshot({ path: 'mp2_choice.png' });
  await D.evaluate(() => [...document.querySelectorAll('.modal [data-ch]')][0].click());
  await D.waitForTimeout(5200);
  console.log('dupa autobuz singur:', JSON.stringify(await st()));
  // inapoi in sat, apoi invitatie
  await D.evaluate(() => { game.scene.goArea('village', 'solo'); }); await D.waitForTimeout(5000); await hide(D);
  await D.evaluate(() => { const s = game.scene; s.me.gx = 19; s.me.gy = 12.6; }); await D.waitForTimeout(1500);
  await D.evaluate(() => game.scene.villageAction('v-bus', { id: 'v-bus', gx: 20, gy: 12, w: 1, d: 1 }));
  await D.waitForTimeout(300); await D.evaluate(() => [...document.querySelectorAll('.modal [data-ch]')][1].click());
  await B.waitForTimeout(1200); await B.screenshot({ path: 'mp2_invite.png' });
  const inv = await B.evaluate(() => document.querySelector('.modal:not(.hidden) h3')?.textContent);
  console.log('Bubu primeste:', inv);
  await B.evaluate(() => [...document.querySelectorAll('.modal [data-ch]')][0].click());
  await D.waitForTimeout(5500); await hide(D); await hide(B);
  console.log('dupa invitatie acceptata:', JSON.stringify(await st()));
  // 3. cinema impreuna (invitatie) in oras
  await D.evaluate(() => { const s = game.scene; s.me.gx = 16; s.me.gy = 11.5; }); await B.evaluate(() => { const s = game.scene; s.me.gx = 16.6; s.me.gy = 11.8; }); await D.waitForTimeout(1500);
  await D.evaluate(() => { game.scene.w.minutes = 15 * 60; game.scene.w.gameMin = Math.floor(game.scene.w.gameMin / 1440) * 1440 + 15 * 60; game.scene.cityAction('c-cinema', null); });
  await D.waitForTimeout(300); await D.evaluate(() => [...document.querySelectorAll('.modal [data-ch]')][1].click());
  await B.waitForTimeout(1200); await B.evaluate(() => [...document.querySelectorAll('.modal [data-ch]')][0]?.click());
  await D.waitForTimeout(9000); await D.screenshot({ path: 'mp2_cinema_D.png' }); await B.screenshot({ path: 'mp2_cinema_B.png' });
  console.log('cinema duo:', await D.evaluate(() => [game.scene.minigame?.id, game.scene.minigame?.obj.duo]), await B.evaluate(() => [game.scene.minigame?.id, game.scene.minigame?.obj.duo]));
  for (const p of [D, B]) await p.evaluate(() => { const o = game.scene.minigame?.obj; if (o) { o.k = 1; } });
  await D.waitForTimeout(3500); await hide(D); await hide(B);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
