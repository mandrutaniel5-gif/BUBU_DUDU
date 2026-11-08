// 1.10.0: padurea voastra e ingradita (gardulet vazut); alaturi 3 parcele de cumparat (apus, rasarit, sus). Cumparata:
// gardul se muta, intri in ea, are copaci de taiat / bolovani / ciuperci / mure, iar taietorul angajat lucreaza si acolo.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=pp' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1200);
  const E = (f, a) => p.evaluate(f, a);
  await E(() => { const s = game.scene; s.devSkipChapter(); s.devSkipChapter(); s.op({ k: 'money', delta: 2000 }); s.syncPlaced(); });
  await sleep(2600); await E(() => game.scene.hud.closeModal()); await sleep(300);
  const f0 = await E(() => { const s = game.scene; return { fence: s.furnList.filter(f => f.id.startsWith('st-fence')).length, signs: s.furnList.filter(f => f.id.startsWith('st-flot')).map(f => f.id) }; });
  ok('partea voastra are gard de jur imprejur', f0.fence >= 70, String(f0.fence));
  ok('3 parcele de vanzare (indicatoare)', f0.signs.length === 3, f0.signs.join(','));
  ok('gardul nu te lasa in parcela necumparata', await E(() => !game.scene.nav.path(12, -20, 4, -20)));
  // poza: gardul si indicatorul de la apus
  await E(() => { const s = game.scene; s.me.gx = 10.5; s.me.gy = -21; s.me.path = []; globalThis.__camAt = { x: 9, y: -22 }; }); await sleep(1500);
  await p.screenshot({ path: 'padure_gard.png' });
  // cumpara parcela de la apus (de langa indicatorul ei)
  await E(() => { const s = game.scene; s.me.gx = 9.5; s.me.gy = -22; });
  await E(async () => { const S = await import('/src/scenes/story.ts'); S.openForestLot(game.scene); });
  await sleep(400);
  let clicked = false;
  for (const x of await p.$$('.modal:not(.hidden) button')) { const t = await x.textContent(); if (/Cumpără/.test(t)) { await x.click(); clicked = true; break; } }
  await sleep(500);
  const r = await E(() => { const s = game.scene; return { owned: s.w.stats['flot-west'], path: !!s.nav.path(12, -20, 2, -20), trees: s.furnList.filter(f => f.id.startsWith('st-fl-west-tree') && f.action?.id === 'chop').length, rocks: s.furnList.filter(f => f.id.startsWith('st-fl-west-rock')).length, signs: s.furnList.filter(f => f.id.startsWith('st-flot')).length }; });
  ok('cumperi „Pădurea de la apus”', clicked && r.owned === 1 && r.signs === 2, JSON.stringify(r));
  ok('gardul s-a mutat: intri in parcela noua', r.path);
  ok('pe parcela: copaci de taiat si bolovani', r.trees >= 10 && r.rocks >= 4);
  ok('pe harta mare: parcelele de vanzare', await E(() => game.scene.hud.mapPois().filter(q => q.id.startsWith('st-flot')).length === 2));
  // taietorul angajat poate merge si in parcela noua
  const w = await E(() => { const s = game.scene; s.op({ k: 'town', key: 'staff', value: [{ id: 'w', name: 'Ion', role: 'wood', wage: 20, skill: 2, unpaid: 0, days: 0 }] }); s.syncWalkers(); s.w.minutes = 9 * 60; s.w.gameMin = (s.w.day - 1) * 1440 + 540;
    const v = s.walkers.find(x => x.eid === 'w'); let inLot = 0; for (let k = 0; k < 12; k++) { if ((s.staffPlan(v) ?? []).some(st => st.x < 8 && st.y < -9)) inLot++; } return inLot; });
  ok('taietorul poate lucra si pe parcela noua', w > 0, String(w));
  await E(() => { const s = game.scene; s.me.gx = 4.5; s.me.gy = -20; globalThis.__camAt = { x: 5, y: -21 }; }); await sleep(1500);
  await p.screenshot({ path: 'padure_parcela.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
