const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:5173/?skipload&who=bubu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  const r = await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 2; s.w.res.lemon = 10; s.w.stats['had-lemon'] = 1; s.w.stats.served = 40; s.storeMode = null; for (let i = 0; i < 12; i++) s.spawnNpc(); return s.npcs.map(n => n.wants.join('+') + '=' + n.pay); });
  console.log('clienti:', r.join('  '));
  // tamplaria: 5 comenzi la rand (fara limita)
  const w = await p.evaluate(() => { const s = game.scene; s.w.res.wood = 100; s.w.res.flower = 10; s.w.money = 0; s.w.stats.workshop = 1; let ok = 0; for (let i = 0; i < 5; i++) { s.hud.openWorkshop(); const btn = document.querySelector('.modal [data-rc="table"]'); btn?.click(); } return { bani: s.w.money, lemne: s.w.res.wood }; });
  console.log('tamplarie 5 mese:', JSON.stringify(w));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
