// 1.10.1: parcelele au aranjamentul lor (ca padurea voastra): fara decor salbatic, toti copacii se taie, treci peste tot.
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
  const r = await E(() => { const s = game.scene; return { owned: s.w.stats['flot-west'], path: (() => { for (let y = -20; y < -12; y++) for (let x = 2; x > -6; x--) if (!s.nav.hits(x + 0.5, y + 0.5)) return !!s.nav.path(12, -20, x + 0.5, y + 0.5); return false; })(), trees: s.furnList.filter(f => f.id.startsWith('st-fl-west-tree') && f.action?.id === 'chop').length, rocks: s.furnList.filter(f => f.id.startsWith('st-fl-west-rock')).length, signs: s.furnList.filter(f => f.id.startsWith('st-flot')).length }; });
  ok('cumperi „Pădurea de la apus”', clicked && r.owned === 1 && r.signs === 2, JSON.stringify(r));
  ok('gardul s-a mutat: intri in parcela noua', r.path);
  ok('pe parcela: copaci de taiat si bolovani', r.trees >= 18 && r.rocks >= 5, r.trees + ' copaci, ' + r.rocks + ' bolovani');
  ok('pe harta mare: parcelele de vanzare', await E(() => game.scene.hud.mapPois().filter(q => q.id.startsWith('st-flot')).length === 2));
  // taietorul angajat poate merge si in parcela noua
  const w = await E(() => { const s = game.scene; s.op({ k: 'town', key: 'staff', value: [{ id: 'w', name: 'Ion', role: 'wood', wage: 20, skill: 2, unpaid: 0, days: 0 }] }); s.syncWalkers(); s.w.minutes = 9 * 60; s.w.gameMin = (s.w.day - 1) * 1440 + 540;
    const v = s.walkers.find(x => x.eid === 'w'); let inLot = 0; for (let k = 0; k < 12; k++) { if ((s.staffPlan(v) ?? []).some(st => st.x < 8 && st.y < -9)) inLot++; } return inLot; });
  ok('taietorul poate lucra si pe parcela noua', w > 0, String(w));
  // cumpara si celelalte doua; in toate: niciun copac de decor, toate dalele libere se pot atinge
  await E(() => { const s = game.scene; s.op({ k: 'stat', key: 'flot-east', delta: 1 }); s.op({ k: 'stat', key: 'flot-north', delta: 1 }); s.syncPlaced(); });
  await sleep(600);
  const all = await E(async () => {
    const s = game.scene; const S = await import('/src/scenes/story.ts'); const M = await import('/src/world/map.ts'); const out = {};
    for (const l of S.FOREST_LOTS) {
      const inL = f => f.gx >= l.x0 && f.gx < l.x1 && f.gy >= l.y0 && f.gy < l.y1;
      const items = s.furnList.filter(inL), decor = items.filter(f => f.solid && !f.action && !/^st-fence/.test(f.id)).map(f => f.id + ':' + f.type);
      const trees = items.filter(f => f.action?.id === 'chop').length;
      // BFS pe dale libere de la intrarea din padurea voastra
      const free = (x, y) => x >= Math.ceil(l.x0) && x < Math.floor(l.x1) && y >= Math.ceil(l.y0) && y < Math.floor(l.y1) && !s.nav.hits(x + 0.5, y + 0.5);
      let tot = 0; for (let y = Math.ceil(l.y0); y < Math.floor(l.y1); y++) for (let x = Math.ceil(l.x0); x < Math.floor(l.x1); x++) if (free(x, y)) tot++;
      const st = l.id === 'west' ? [7, -22] : l.id === 'east' ? [30, -22] : [19, -38]; let seen = new Set([st.join()]), q = [st];
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const k = (x+dx)+','+(y+dy); if (!seen.has(k) && free(x+dx, y+dy)) { seen.add(k); q.push([x+dx, y+dy]); } } }
      const far = s.nav.path(20, -20, st[0] + 0.5, st[1] + 0.5);
      out[l.id] = { trees, decor: decor.length, decorEx: decor.slice(0, 3), reach: seen.size + '/' + tot, fromHome: !!far, oldDecor: M.FURNITURE.filter(f => f.solid && !f.action && !/^st-fence/.test(f.id) && inL(f)).length };
    }
    return out;
  });
  for (const [k, v] of Object.entries(all)) {
    ok(k + ': niciun copac de decor (toti se taie)', v.decor === 0 && v.oldDecor === 0, JSON.stringify(v));
    ok(k + ': ajungi pe toate dalele libere', v.reach.split('/')[0] === v.reach.split('/')[1] && v.fromHome, v.reach);
  }
  await E(() => { const s = game.scene; s.me.gx = 4.5; s.me.gy = -20; globalThis.__camAt = { x: 5, y: -21 }; }); await sleep(1500);
  await p.screenshot({ path: 'padure_parcela.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
