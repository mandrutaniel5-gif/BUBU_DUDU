// 1.10.0: lumea arata ca anotimpul: primavara verde crud cu flori, vara ca inainte, toamna frunze aramii pe copaci si pe jos,
// iarna zapada pe jos, pe copaci (si pe brazi), peste flori si peste gradina. Poze: curtea si padurea in fiecare anotimp.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=an' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1200);
  await p.evaluate(() => { const s = game.scene; s.devSkipChapter(); s.devSkipChapter(); s.w.minutes = 12 * 60; s.w.gameMin = (s.w.day - 1) * 1440 + 720; });
  await sleep(2600); await p.evaluate(() => game.scene.hud.closeModal());
  // ziua jocului → anotimpul (fara fortare)
  const days = await p.evaluate(async () => { const S = await import('/src/scenes/story.ts'); const out = {}; for (let d = 1; d < 200; d++) { const id = S.seasonOf(d).id; out[id] ??= d; } return out; });
  ok('fiecare anotimp are zilele lui', ['spring', 'summer', 'autumn', 'winter'].every(k => days[k]), JSON.stringify(days));
  const sums = {};
  for (const se of ['spring', 'summer', 'autumn', 'winter']) {
    await p.evaluate(([d, se]) => { const s = game.scene; s.w.day = d; s.w.gameMin = (d - 1) * 1440 + 720; s.w.minutes = 720; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); s.me.gx = 9; s.me.gy = 17; s.me.path = []; globalThis.__camAt = { x: 10, y: 15 }; }, [days[se], se]);
    await sleep(1800); await p.evaluate(() => { game.scene.hud.closeModal(); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); }); await sleep(500);
    const cur = await p.evaluate(() => globalThis.__season);
    ok(`ziua ${days[se]}: lumea e in ${se}`, cur === se, cur);
    await p.screenshot({ path: `anotimp_${se}_curte.png` });
    // culoarea medie a ecranului (iarna = mult mai deschisa, toamna = mai calda)
    sums[se] = await p.evaluate(() => { const c = document.querySelector('canvas'); const g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, c.height).data; let r = 0, gg = 0, bb = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 97) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; } return [r / n, gg / n, bb / n].map(Math.round); });
    await p.evaluate(() => { const s = game.scene; s.me.gx = 19; s.me.gy = -20; globalThis.__camAt = { x: 19, y: -22 }; }); await sleep(1500);
    await p.screenshot({ path: `anotimp_${se}_padure.png` });
  }
  ok('iarna e alba (zapada)', sums.winter[0] > sums.summer[0] + 25 && sums.winter[2] > sums.summer[2] + 25, JSON.stringify(sums));
  ok('toamna e mai calda (rosu > vara)', sums.autumn[0] > sums.summer[0] + 8, JSON.stringify([sums.summer, sums.autumn]));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
