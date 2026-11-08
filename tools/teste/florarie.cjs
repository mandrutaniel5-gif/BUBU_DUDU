const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=fl' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await p.evaluate(() => { const s = game.scene; for (let i = 0; i < 4; i++) s.devSkipChapter(); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    s.w.minutes = 10 * 60; s.op({ k: 'stat', key: 'florarie', delta: 1 }); for (const [k, n] of [['flower', 6], ['tulip', 5], ['rose', 3], ['seed_tulip', 4], ['carrot', 9], ['lemon', 5], ['flour', 5]]) s.op({ k: 'res', res: k, delta: n });
    // rasadurile vechi (scoase in 1.10.0): pe tejghea un „pot:2” si in inventar un „prod_pot_1” → 4 + 2 seminte de lalele inapoi
    s.op({ k: 'board', which: 'florist', enc: 'pot:2' }); s.op({ k: 'res', res: 'prod_pot_1', delta: 1 }); window.__seed0 = s.w.res.seed_tulip;
    s.storeMode = 'florarie'; s.startCustom('merge'); });
  await sleep(1500);
  const rf = await p.evaluate(() => ({ seeds: game.scene.w.res.seed_tulip - window.__seed0, pot: game.scene.w.res.prod_pot_1 ?? 0, cells: game.scene.minigame.obj.b.cells.filter(c => c?.startsWith('pot')).length }));
  console.log(rf.seeds === 6 && !rf.pot && !rf.cells ? 'OK  ' : 'FAIL', 'rasadurile vechi se intorc in seminte', JSON.stringify(rf));
  const crates = await p.evaluate(() => game.scene.minigame.obj.chains.map(c => c.id));
  console.log(JSON.stringify(crates) === '["flower","garden"]' ? 'OK  ' : 'FAIL', 'lazile florariei', crates);
  // apasam lazile (1,2,3) de cate 2 ori -> unim
  for (const k of ['1', '1', '2', '2', '3', '3']) { await p.keyboard.press(k); await sleep(120); }
  const cells = await p.evaluate(() => game.scene.minigame.obj.b.cells.filter(Boolean));
  console.log(cells.every(c => /^(flower|garden):/.test(c)) ? 'OK  ' : 'FAIL', 'doar flori pe tejghea', cells);
  const carrots = await p.evaluate(() => game.scene.w.res.carrot);
  console.log(carrots === 9 ? 'OK  ' : 'FAIL', 'morcovii neatinsi', carrots);
  await sleep(9000);
  await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))); await p.screenshot({ path: 'florist1.png' });
  const w = await p.evaluate(() => game.scene.florNpcs.map(n => n.wants.join(',')));
  console.log(w.every(x => x.split(',').every(c => /^(flower|garden):/.test(c))) ? 'OK  ' : 'FAIL', 'clientii cer doar flori', w);
  await sleep(8000); await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))); await p.screenshot({ path: 'florist2.png' });
  // taraba de acasa ramane cu 4 lazi
  await p.evaluate(() => { const s = game.scene; s.minigame.obj.abort?.(); }); await sleep(2500);
  await p.evaluate(() => { const s = game.scene; s.storeMode = ''; s.startCustom('merge'); }); await sleep(1200);
  console.log('taraba:', await p.evaluate(() => game.scene.minigame.obj.chains.map(c => c.id).join(',')));
  await p.screenshot({ path: 'stall.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
