const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:5173/?skipload&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  const hide = () => p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 4; s.w.stats.bike = 1; s.w.plots = { '10,15': { crop: null, prog: 0, wetUntil: 0, fert: 0 }, '11,15': { crop: null, prog: 0, wetUntil: 0, fert: 0 } }; s.syncPlaced(); s.goArea('city'); });
  await p.waitForTimeout(4700); await hide();
  const homeish = () => p.evaluate(() => { const F = game.scene.constructor && window.__F; const ids = (window.__FURN ?? null); return null; });
  const count = () => p.evaluate(async () => { const M = await import('/src/world/map.ts'); return { area: M.currentArea(), plots: M.FURNITURE.filter(f => f.id.startsWith('plot:') || f.id.startsWith('h-') || f.id.startsWith('p-')).map(f => f.id) }; });
  console.log('in oras:', JSON.stringify(await count()));
  // iesi in meniu si intra inapoi (asa aparea problema)
  await p.evaluate(() => game.go('menu')); await p.waitForTimeout(1500);
  await p.evaluate(() => game.go('world')); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 }); await p.waitForTimeout(1500); await hide();
  console.log('dupa meniu:', JSON.stringify(await count()), 'zona:', await p.evaluate(() => game.scene.area));
  await p.screenshot({ path: 'leak_city.png' });
  // mergi acasa: razoarele trebuie sa fie acolo
  await p.evaluate(() => { game.scene.forceVehicle = 'taxi'; game.scene.goArea('home'); }); await p.waitForTimeout(4800);
  console.log('acasa:', JSON.stringify(await count()));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
