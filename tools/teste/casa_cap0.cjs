// Capitolul 0: mobila casei se schimba cand o repari (toaleta, cada, frigiderul, vasele, lampa) si mizeria se misca
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=cap0' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const hide = () => p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await sleep(1500); await hide();
  // camera pe baie si bucatarie; partenerul AI sta pe loc
  await p.evaluate(() => { const s = game.scene; s.partner.control = 'remote'; s.partner.gx = 4; s.partner.gy = 4; s.me.gx = 10.5; s.me.gy = 8.5; s.me.path = []; });
  await sleep(1200);
  const chap = await p.evaluate(() => game.scene.chapter); ok('capitolul 0', chap === 0, String(chap));
  // mizeria se misca: doua cadre diferite in jurul toaletei / frigiderului
  const a = await p.screenshot(); await sleep(450); const b2 = await p.screenshot();
  ok('aburii mizeriei se misca (nu e o poza)', !a.equals(b2));
  await p.screenshot({ path: 'cap0_murdar.png' });
  await p.evaluate(() => { const s = game.scene; for (const k of ['clogged', 'tubDirty', 'fridgeDirty', 'dishesDirty']) s.op({ k: 'furn', key: k, value: false }); s.op({ k: 'furn', key: 'lampOn', value: true }); s.w.minutes = 22 * 60; });
  await sleep(1200); await p.screenshot({ path: 'cap0_curat.png' });
  const c = await p.screenshot(); ok('casa se redeseneaza dupa curatenie', !c.equals(b2));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
