// 1.9.9: moara de lângă câmpuri: cerealele se vând angro (oricât, banii pe loc) și se macină în făină / mălai.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=moara' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const E = (f, a) => p.evaluate(f, a);
  await E(() => { const s = game.scene; while (s.chapter < 5) s.devSkipChapter(); }); await sleep(2500); await E(() => game.scene.hud.closeModal());
  await E(() => { const s = game.scene; for (const k of ['grain', 'corn', 'sunseed', 'flour', 'cornmeal']) s.w.res[k] = 0; s.op({ k: 'res', res: 'grain', delta: 40 }); s.op({ k: 'res', res: 'corn', delta: 30 }); s.op({ k: 'res', res: 'sunseed', delta: 10 }); });
  // harta → Unde e? → Moara → Du-mă
  await E(() => game.scene.hud.openMap()); await sleep(300); await E(() => document.querySelector('[data-place="mill"]').click()); await sleep(300);
  for (let i = 0; i < 120 && await E(() => (game.scene.me.path?.length ?? 0) > 0); i++) await sleep(500);
  const f = await E(() => game.scene.nearestFurn(game.scene.me)?.id);
  ok('Du-mă ajunge la moară', f === 'w-mill', f);
  await E(() => game.scene.doAction()); await sleep(500);
  const txt = await E(() => document.querySelector('.modal:not(.hidden)')?.textContent ?? '');
  ok('se deschide Moara satului', /Moara satului/.test(txt) && /Vinde tot grâu/.test(txt), txt.slice(0, 120));
  await p.screenshot({ path: 'moara.png' });
  const m0 = await E(() => game.scene.w.money);
  await E(() => document.querySelector('[data-sell="corn"]').click()); await sleep(300);
  await E(() => document.querySelector('[data-sell="sunseed"]').click()); await sleep(300);
  const r = await E(() => ({ m: game.scene.w.money, corn: game.scene.w.res.corn, sun: game.scene.w.res.sunseed }));
  ok('vinde angro tot porumbul și semințele, banii pe loc', r.corn === 0 && r.sun === 0 && r.m - m0 === 30 * 6 + 10 * 8, JSON.stringify(r) + ' m0 ' + m0);
  await E(() => document.querySelector('[data-grind="grain"]').click()); await sleep(300);
  const g = await E(() => ({ grain: game.scene.w.res.grain, flour: game.scene.w.res.flour }));
  ok('macină grâul în făină (1 la 1)', g.grain === 0 && g.flour === 40, JSON.stringify(g));
  await E(() => game.scene.op({ k: 'res', res: 'corn', delta: 5 })); await E(() => { game.scene.hud.closeModal(); game.scene.doAction(); }); await sleep(300);
  await E(() => document.querySelector('[data-grind="corn"]').click()); await sleep(300);
  ok('macină porumbul în mălai', await E(() => game.scene.w.res.cornmeal === 5 && game.scene.w.res.corn === 0));
  await p.screenshot({ path: 'moara2.png' });
  ok('fara erori', !errs.length, errs.join(' | '));
  await b.close();
})();
