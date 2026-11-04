const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  p.on('console', m => { if (m.type() === 'error' && !/firebase|ERR_|Failed to load|WebSocket|net::/i.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
  // 1. pornire normala ca pe telefon: ecran de incarcare -> meniu -> intra in casa (solo)
  await p.goto('http://localhost:4173/#menu'); await p.waitForTimeout(4500);
  await p.evaluate(() => { const sel = document.querySelector('select'); if (sel) { sel.value = 'solo'; sel.dispatchEvent(new Event('change', { bubbles: true })); } });
  await p.evaluate(() => document.querySelector('.play')?.click()); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  // juca un "joc avansat": capitol 3, sat, bani, mancare, haine, misiuni
  await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 3; s.w.stats.bike = 1; s.w.money = 400; s.w.res.dish_sarmale = 2; s.w.res.meals = 1; s.syncPlaced(); });
  await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await p.evaluate(() => game.scene.goArea('village')); await p.waitForTimeout(5000);
  await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await p.evaluate(() => { const s = game.scene; s.me.gx = 9.5; s.me.gy = 7.5; }); await p.waitForTimeout(2000);
  await p.screenshot({ path: 'repro_1.png' });
  await p.evaluate(() => game.scene.save(true));
  // 2. inchizi si redeschizi aplicatia (cum ai facut dupa instalare)
  await p.reload(); await p.waitForTimeout(4500);
  await p.screenshot({ path: 'repro_2_after_load.png' });
  const where = await p.evaluate(() => [location.hash, game.sceneName]);
  if (where[1] === 'menu') { await p.evaluate(() => document.querySelector('.play')?.click()); }
  await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(3000);
  await p.screenshot({ path: 'repro_3_world.png' });
  console.log('dupa repornire:', JSON.stringify(await p.evaluate(() => ({ area: game.scene.area, ready: game.scene.ready, modal: document.querySelector('.modal:not(.hidden) h3')?.textContent ?? null, mini: game.scene.minigame?.id ?? null }))));
  // 3. cateva minute de joc: mers, actiuni, AI
  for (let i = 0; i < 20; i++) { await p.keyboard.down(['w', 'a', 's', 'd'][i % 4]); await p.waitForTimeout(400); await p.keyboard.up(['w', 'a', 's', 'd'][i % 4]); await p.keyboard.press('e'); await p.waitForTimeout(300); await p.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); const o = game.scene.minigame?.obj; if (o) o.abort?.(); }); }
  console.log('erori:', errs.length); console.log([...new Set(errs)].slice(0, 15).join('\n'));
  await b.close();
})();
