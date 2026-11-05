const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 860, height: 400 } });
  const errs = [];
  const room = 'mig' + Date.now();
  // 1) salvare veche: amandoi in sat, coordonate vechi (locale), vehicule bicicleta + scuter
  const p0 = await ctx.newPage(); await p0.goto('http://localhost:5173/?skipload&who=dudu&mode=solo#menu'); await p0.waitForTimeout(1500);
  await p0.evaluate((room) => {
    const w = { v: 1, ts: Date.now() + 100000, created: Date.now(), minutes: 600, day: 5, hearts: 50, chars: { bubu: { needs: { hunger: 70, energy: 90, warmth: 60, hygiene: 80, fun: 70, love: 75, health: 100 }, sick: null, fart: 30, gx: 10.5, gy: 13.2, area: 'village' }, dudu: { needs: { hunger: 70, energy: 90, warmth: 60, hygiene: 80, fun: 70, love: 75, health: 100 }, sick: null, fart: 30, gx: 9.5, gy: 12.6, area: 'village' } }, furn: { lampOn: false, fire: 40 }, jar: [], log: [], stats: { chapter: 3, bike: 1, scooter: 1, served: 10 }, res: { wood: 10 }, placed: [], nodes: {}, money: 300, grass: {}, plots: {} };
    localStorage.setItem('bd-save-' + (JSON.parse(localStorage.getItem('bd-settings') || '{}').net?.room ?? 'casa'), JSON.stringify({ json: JSON.stringify(w), ts: w.ts }));
    for (const k of Object.keys(localStorage)) if (k.startsWith('bd-save')) localStorage.setItem(k, JSON.stringify({ json: JSON.stringify(w), ts: w.ts }));
  }, room);
  await p0.close();
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'warning' && m.text().includes('eroare')) errs.push(m.text().slice(0, 200)); });
  await p.goto('http://localhost:5173/?skipload&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await p.waitForTimeout(1200);
  console.log('dupa migrare:', await p.evaluate(() => { const s = game.scene; return JSON.stringify({ me: [s.me.gx, s.me.gy, s.area], pa: [s.partner.gx, s.partner.gy], veh: s.w.veh, worldV: s.w.worldV, chapter: s.chapter }); }));
  await p.screenshot({ path: 'mig.png' });
  // 2) capitolele: obstacolele
  const can = (x0, y0, x1, y1) => p.evaluate(([x0, y0, x1, y1]) => !!game.scene.nav.path(x0, y0, x1, y1, 40000), [x0, y0, x1, y1]);
  for (const ch of [1, 2, 3, 4]) {
    await p.evaluate(ch => { const s = game.scene; s.w.stats.chapter = ch; s.syncPlaced(); }, ch);
    console.log(`cap ${ch}: padure`, await can(5.5, 13, 19.5, -14), ' sat', await can(30, 25, 113, 25), ' oras', await can(120, 25, 195, 25));
  }
  // 3) AI-ul "Vino cu mine": te urmeaza pe drum
  await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 4; s.syncPlaced(); s.me.gx = 6; s.me.gy = 24.6; s.partner.gx = 7; s.partner.gy = 24.6; s.partner.activity = null; s.toggleFollow(); });
  await p.evaluate(() => { const s = game.scene; s.walkTo(28, 25); });
  await p.waitForTimeout(12000);
  console.log('AI urmeaza:', await p.evaluate(() => { const s = game.scene; return [s.me.gx.toFixed(1), s.me.gy.toFixed(1), s.partner.gx.toFixed(1), s.partner.gy.toFixed(1), s.partner.follow]; }));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
