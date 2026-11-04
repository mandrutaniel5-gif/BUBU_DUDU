const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 900, height: 480 } });
  const errs = []; const room = 'p1' + Date.now();
  const open = async who => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e.message)); await p.goto(`http://localhost:5173/?skipload&who=${who}&mode=local&room=${room}#world`); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 }); return p; };
  const D = await open('dudu'); const B = await open('bubu');
  const hide = p => p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await D.waitForTimeout(3000);
  for (const p of [D, B]) await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 3; s.w.res.lemon = 6; s.w.res.flower = 6; s.w.stats['had-lemon'] = 1; s.w.stats.florarie = 1; });
  await hide(D); await hide(B);
  // 1. Dudu pune pe taraba
  await D.evaluate(() => { const s = game.scene; s.storeMode = ''; s.startCustom('merge'); });
  await D.waitForTimeout(500);
  await D.evaluate(() => { const o = game.scene.minigame.obj; o.spawn(3); o.spawn(3); o.spawn(0); });
  await D.waitForTimeout(800);
  const dCells = await D.evaluate(() => game.scene.minigame.obj.b.cells.filter(Boolean));
  // 2. Bubu deschide taraba: vede ce a pus Dudu
  await B.evaluate(() => { const s = game.scene; s.storeMode = ''; s.startCustom('merge'); }); await B.waitForTimeout(800);
  const bCells = await B.evaluate(() => game.scene.minigame.obj.b.cells.filter(Boolean));
  console.log('taraba Dudu:', dCells.join(','), '| Bubu vede:', bCells.join(','));
  // 3. Bubu ia o lamaie in inventar; Dudu vede tejgheaua actualizata si produsul in inventar
  await B.evaluate(() => { const o = game.scene.minigame.obj; const i = o.b.cells.findIndex(c => c === 'drink:0'); o.takeToBag(i); });
  await D.waitForTimeout(1000);
  console.log('dupa ce Bubu a luat: Dudu vede', await D.evaluate(() => game.scene.minigame.obj.b.cells.filter(Boolean).join(',')), '| inventar comun prod_drink_0 =', await D.evaluate(() => game.scene.w.res.prod_drink_0));
  await B.evaluate(() => { game.scene.minigame.obj.invOpen = true; }); await B.waitForTimeout(400); await B.screenshot({ path: 'p1_bag.png' });
  await B.evaluate(() => { const o = game.scene.minigame.obj; o.putFromBag('prod_drink_0'); o.invOpen = false; }); await D.waitForTimeout(1000);
  console.log('Bubu a pus inapoi: Dudu vede', await D.evaluate(() => game.scene.minigame.obj.b.cells.filter(Boolean).join(',')));
  await D.screenshot({ path: 'p1_stall.png' });
  for (const p of [D, B]) await p.evaluate(() => game.scene.minigame?.obj.abort());
  await D.waitForTimeout(3000);
  // 4. inventarul complet
  await D.evaluate(() => { const s = game.scene; Object.assign(s.w.res, { dish_sarmale: 2, egg: 4, milk: 1, carrot: 3, wood: 9, prod_flower_2: 1, prod_sweet_1: 2 }); s.hud.openInventory(); }); await D.waitForTimeout(400); await D.screenshot({ path: 'p1_inv.png' });
  await hide(D);
  // 5. florăria: clienti diferiti
  await B.evaluate(() => { const s = game.scene; s.storeMode = 'florarie'; s.startCustom('merge'); s.florSpawnT = 0; });
  await B.waitForTimeout(2500);
  console.log('clienti florarie:', await B.evaluate(() => game.scene.florNpcs.map(n => n.kind + '/' + n.wants.join('+')).join(' ')), '| clienti taraba (acasa):', await B.evaluate(() => game.scene.npcs.map(n => n.kind).join(' ')));
  await B.waitForTimeout(4000); await B.screenshot({ path: 'p1_florist.png' });
  await B.evaluate(() => game.scene.minigame?.obj.abort()); await B.waitForTimeout(3000);
  // 6. rutina de seara (A) si cina (A) — cu partenerul AI
  await B.close(); await D.waitForTimeout(8000); await hide(D);
  await D.evaluate(() => { const s = game.scene; s.startCustom('bedtime'); }); await D.waitForTimeout(2600); await D.screenshot({ path: 'p1_bed.png' });
  await D.evaluate(() => game.scene.minigame.obj.abort()); await D.waitForTimeout(1500);
  await D.evaluate(() => { const s = game.scene; s.duo = true; s.startCustom('resto'); }); await D.waitForTimeout(700); await D.screenshot({ path: 'p1_resto.png' });
  await D.evaluate(() => { const o = game.scene.minigame.obj; o.pick(0); }); await D.waitForTimeout(1700); await D.evaluate(() => { const o = game.scene.minigame.obj; o.pick(2); }); await D.waitForTimeout(1700); await D.evaluate(() => { const o = game.scene.minigame.obj; o.pick(2); }); await D.waitForTimeout(2200); await D.screenshot({ path: 'p1_resto_end.png' });
  // 7. sunetele: rasul
  await D.evaluate(() => { game.scene.me.actor.play('laugh'); }); await D.waitForTimeout(700);
  console.log('ultimele sunete:', await D.evaluate(() => (window.__sfx?.played ?? []).slice(-4).join(',')));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
