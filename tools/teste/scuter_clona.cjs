// 1.10.0: parchezi scuterul la cherestea (sau lac / oras), urci iar si pleci: scuterul parcat nu mai ramane desenat acolo
// („clona” care disparea abia cand ajungeai). Inainte se ascundea doar cel parcat acasa (h-) sau in sat (v-).
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=scl' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1200);
  await p.evaluate(() => { const s = game.scene; for (let i = 0; i < 4; i++) s.devSkipChapter(); s.op({ k: 'stat', key: 'scooter', delta: 1 }); s.op({ k: 'stat', key: 'bridgeFixed', delta: 1 }); s.syncPlaced(); });
  await sleep(2600); await p.evaluate(() => game.scene.hud.closeModal()); await sleep(300);
  await p.evaluate(() => { const s = game.scene; const f = s.furnList.find(f => f.id === 'h-scooter'); s.me.gx = f.gx + 0.5; s.me.gy = f.gy + 1.4; s.me.board = true; s.me.rideKind = 'scooter'; s.rideTo('sawmill'); });
  await p.waitForFunction(() => !game.scene.ride, null, { timeout: 30000 }); await sleep(500);
  ok('scuterul e parcat la cherestea', await p.evaluate(() => game.scene.vehAt('scooter') === 'sawmill'));
  await p.evaluate(() => { const s = game.scene; s.me.board = true; s.me.rideKind = 'scooter'; s.rideTo('home'); });
  await sleep(1200);
  const r = await p.evaluate(async () => { const R = await import('/src/scenes/render.ts'); const s = game.scene; return ['sawmill-scooter', 'lake-scooter', 'city-scooter', 'h-scooter', 'v-scooter'].map(id => R.parkedHidden(false, s.me.riding && s.me.rideKind === 'scooter', false, id)); });
  ok('pe drum: scuterul parcat nu se mai vede nicaieri (fara clona)', r.every(Boolean), JSON.stringify(r));
  await p.evaluate(() => { globalThis.__camAt = { x: 27, y: 22 }; }); await sleep(600); await p.screenshot({ path: 'scuter_fara_clona.png' });
  await p.waitForFunction(() => !game.scene.ride, null, { timeout: 30000 });
  const r2 = await p.evaluate(async () => { const R = await import('/src/scenes/render.ts'); const s = game.scene; return [s.vehAt('scooter'), R.parkedHidden(false, s.me.riding && s.me.rideKind === 'scooter', false, 'h-scooter')]; });
  ok('ajuns acasa: scuterul parcat se vede iar', r2[0] === 'home' && !r2[1], JSON.stringify(r2));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
