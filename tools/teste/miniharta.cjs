const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch();
  for (const [name, vw, vh, touch] of [['telefon', 844, 390, true], ['telefon_mic', 667, 375, true], ['laptop', 1280, 720, false], ['tableta', 1024, 768, true]]) {
    const p = await (await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, hasTouch: touch, isMobile: touch })).newPage();
    await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=map' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
    await p.evaluate(() => { localStorage.removeItem('bd-mapbig'); const s = game.scene; s.hud.mapBig = false; for (let i = 0; i < 4; i++) s.devSkipChapter(); s.me.gx = 121; s.me.gy = 25; s.partner.gx = 30; s.partner.gy = 25; });
    await sleep(2500); await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))); await sleep(500);
    const over = async () => p.evaluate(() => {
      const mm = document.querySelector('.minimap').getBoundingClientRect(); const hits = [];
      for (const el of document.querySelectorAll('.hud > *')) { if (el.classList.contains('minimap') || el.classList.contains('mapsize') || el.classList.contains('mapopen') || el.classList.contains('toasts') || el.classList.contains('modal') || el.classList.contains('pop') || getComputedStyle(el).display === 'none' || el.classList.contains('hidden')) continue; const r = el.getBoundingClientRect(); if (!r.width) continue; if (r.left < mm.right && mm.left < r.right && r.top < mm.bottom && mm.top < r.bottom) hits.push(el.className); }
      return { hits, mm: [Math.round(mm.width), Math.round(mm.height)] };
    });
    const a = await over(); ok(`${name}: miniharta mica nu acopera nimic`, !a.hits.length, JSON.stringify(a));
    await p.screenshot({ path: `map_${name}_mica.png` });
    await p.click('.mapsize'); await sleep(600);
    const c = await over(); ok(`${name}: miniharta marita nu acopera nimic`, !c.hits.length, JSON.stringify(c));
    await p.screenshot({ path: `map_${name}_mare.png` });
    await p.close();
  }
  await b.close();
})();
