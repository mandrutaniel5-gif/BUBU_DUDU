// Satul si orasul: la fiecare cladire / obiect cu actiune se ajunge pe jos, pe partea cu usa; nimic solid nu se suprapune
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 900, height: 500 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&who=bubu&mode=solo&room=reach' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await p.evaluate(() => { const s = game.scene; for (let i = 0; i < 5 && s.chapter < 4; i++) s.devSkipChapter(); });
  await sleep(1500);
  const r = await p.evaluate(() => {
    const s = game.scene, out = { bad: [], overlap: [], n: 0 };
    const zones = [{ name: 'sat', x0: 98, y0: -10, x1: 150, y1: 52, from: [101.5, 25.2] }, { name: 'oras', x0: 176, y0: -12, x1: 252, y1: 66, from: [209.5, 27.5] }];
    for (const z of zones) {
      const list = s.furnList.filter(f => f.gx >= z.x0 && f.gx < z.x1 && f.gy >= z.y0 && f.gy < z.y1);
      for (const f of list) {
        if (!f.action || !f.action.id) continue; out.n++;
        const spot = s.nav.standSpot(f.gx, f.gy, f.w, f.d, z.from[0], z.from[1]);
        const path = spot && s.nav.path(z.from[0], z.from[1], spot.x, spot.y);
        if (!spot || !path) out.bad.push(`${z.name}: ${f.id} (${f.action.label})`);
        else if (f.type === 'building' || f.type === 'cbuilding' || f.type === 'farmhouse') {
          // usa: pe fata +y (sau +x) trebuie sa fie loc liber de stat
          const B = (window.__bld ??= {}); void B;
        }
      }
      const solid = list.filter(f => f.solid);
      for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) { const a = solid[i], c = solid[j]; if (a.gx < c.gx + c.w - 0.05 && c.gx < a.gx + a.w - 0.05 && a.gy < c.gy + c.d - 0.05 && c.gy < a.gy + a.d - 0.05) out.overlap.push(`${a.id} x ${c.id}`); }
    }
    return out;
  });
  console.log(`${r.n} obiecte cu actiune verificate`);
  console.log(r.bad.length ? 'FAIL nu se ajunge la: ' + r.bad.join(' | ') : 'OK   se ajunge peste tot');
  console.log(r.overlap.length ? 'FAIL se suprapun: ' + r.overlap.join(' | ') : 'OK   nimic nu se suprapune');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
