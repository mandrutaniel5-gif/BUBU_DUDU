// Harta mare (1.10.0): butonul „🗺️ Harta” la vedere langa miniharta; pe harta toate cladirile (iconite; numele cand mărești),
// mărire cu ＋ / două degete / rotiță, tragi cu degetul; atingi o clădire → numele ei + „🚶 Du-mă” (mergi pe jos pana in fata ei)
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=hm' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1500);
  await p.evaluate(() => { const s = game.scene; for (let i = 0; i < 6; i++) s.devSkipChapter(); s.op({ k: 'stat', key: 'bridgeFixed', delta: 1 }); });
  await sleep(2500); await p.evaluate(() => game.scene.hud.closeModal()); await sleep(600);
  const btn = await p.$('.mapopen'); const vis = btn && await btn.isVisible();
  ok('butonul „Harta” se vede langa miniharta', vis, vis ? await btn.textContent() : '');
  await p.screenshot({ path: 'harta_buton.png' });
  await btn.click(); await sleep(700);
  ok('se deschide harta mare', await p.evaluate(() => !!document.querySelector('.modal:not(.hidden) .bigmap')));
  const pois = await p.evaluate(() => game.scene.hud.mapPois().map(q => q.name));
  const need = ['Primăria', 'Brutăria', 'Școala satului', 'Florăria lui Bubu', 'Tâmplăria lui Dudu', 'Biserica satului', 'Banca', 'Universitatea', 'Spitalul', 'Mall-ul', 'Gara orașului', 'Cheresteaua', 'Moara', 'Blocul (apartamentul)', 'Casa: Rita'];
  const miss = need.filter(n => !pois.includes(n));
  ok(`toate cladirile pe harta (${pois.length})`, !miss.length && pois.length > 50, miss.join(', '));
  await p.screenshot({ path: 'harta_toata.png' });
  // mărește cu ＋ de 3 ori
  const z0 = await p.evaluate(() => game.scene.hud.mapView.z);
  for (let i = 0; i < 3; i++) { await p.click('[data-z="in"]'); await sleep(120); }
  ok('＋ mărește harta', await p.evaluate(() => game.scene.hud.mapView.z) > z0 * 3);
  // tragi cu degetul (mouse) spre est
  const bb = await (await p.$('.bigmap')).boundingBox();
  const c0 = await p.evaluate(() => game.scene.hud.mapView.cx);
  await p.mouse.move(bb.x + bb.width * 0.7, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height / 2, { steps: 6 }); await p.mouse.up(); await sleep(200);
  ok('tragi harta cu degetul', await p.evaluate(() => game.scene.hud.mapView.cx) > c0 + 3);
  // centreaza pe sat si atinge Primăria
  await p.evaluate(() => { const v = game.scene.hud.mapView; v.z = 4; v.cx = 121; v.cy = 18; }); await sleep(300);
  const at = await p.evaluate(async () => { const { mapGeom } = await import('/src/ui/minimap.ts'); const cv = document.querySelector('.bigmap'); const G = mapGeom(cv.clientWidth, cv.clientHeight, { ...game.scene.hud.mapView }); const h = game.scene.hud.mapPois().find(q => q.name === 'Primăria'); return G.P(h.x, h.y); });
  await p.mouse.click(bb.x + at.x, bb.y + at.y); await sleep(300);
  const info = await p.evaluate(() => document.querySelector('.mapinfo').textContent);
  ok('atingi o cladire: vezi ce e', /Primăria/.test(info) && /Du-mă/.test(info), info);
  await p.screenshot({ path: 'harta_sat.png' });
  await p.click('.mapinfo [data-walk]'); await sleep(400);
  const go = await p.evaluate(() => { const s = game.scene, q = s.me.path.at(-1); return { n: s.me.path.length, end: q && [+q.x.toFixed(1), +q.y.toFixed(1)], open: !!document.querySelector('.modal:not(.hidden) .bigmap') }; });
  ok('„Du-mă” te duce pe jos la Primărie', go.n > 10 && !go.open && Math.abs(go.end[0] - 122) < 4 && Math.abs(go.end[1] - 13) < 3, JSON.stringify(go));
  // inainte de pod: in sat nu ajungi pe jos
  await p.evaluate(() => { game.scene.w.stats.bridgeFixed = 0; });
  const why = await p.evaluate(() => [game.scene.bridgeFixed(), game.scene.reachWhyAt(121, 10)]);
  ok('fara pod: iti spune de ce nu ajungi', why[0] || /Podul/.test(why[1] ?? ''), JSON.stringify(why));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
