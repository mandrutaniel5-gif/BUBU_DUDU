const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1000, height: 560 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:5173/?skipload&who=bubu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 1; s.w.res.dish_sarmale = 3; s.w.res.dish_ciorba = 2; }); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await p.evaluate(() => { const s = game.scene; const t = { id: 'table', type: 'table', gx: 10, gy: 9, w: 2, d: 1 }; s.me.gx = 10.5; s.me.gy = 10.5; s.startActivity(s.me, { id: 'eat', anim: 'act_eat', dur: 30, needs: { hunger: 30 }, text: 'x', dish: 'dish_sarmale' }, t); s.startActivity(s.partner, { id: 'eat', anim: 'act_eat', dur: 30, needs: { hunger: 30 }, text: 'x', dish: 'dish_ciorba' }, t); });
  await p.waitForTimeout(2500); await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))); await p.waitForTimeout(300);
  const c = await p.evaluate(() => { const s = game.scene; const q = s.constructor; return [s.cam.x, s.cam.y]; });
  await p.screenshot({ path: 'an_table2.png', clip: { x: 300, y: 120, width: 420, height: 300 } });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
