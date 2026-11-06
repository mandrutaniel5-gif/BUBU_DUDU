// Curtea aranjata de voi (1.8.6): in „Aranjeaza curtea” muti sau scoti copaci, pietre, tufe, flori, banca, fantana...;
// stiva de lemne din mijlocul curtii nu mai exista; fantana nu mai sta lipita de razoare
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=crt' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1200);
  const E = (f, a) => p.evaluate(f, a);
  const hide = () => E(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await E(() => { const s = game.scene; s.devSkipChapter(); s.devSkipChapter(); }); await sleep(2000); await hide();
  ok('stiva de lemne scoasa din curte', await E(() => !game.scene.furnList.some(f => f.id === 'h-wood')));
  const well = await E(() => { const f = game.scene.furnList.find(x => x.id === 'well'); const plots = Object.keys(game.scene.w.plots ?? {}).map(k => k.split(',').map(Number)); return { at: [f.gx, f.gy], near: plots.some(([x, y]) => Math.abs(x - f.gx) <= 1 && Math.abs(y - f.gy) <= 1) }; });
  ok('fantana nu sta lipita de razoare', !well.near, JSON.stringify(well));
  const pick = async (choice) => { await sleep(300); return E(c => { const bt = [...document.querySelectorAll('.modal:not(.hidden) [data-ch]')].find(x => x.textContent.includes(c)); if (bt) bt.click(); return bt ? bt.textContent.trim() : null; }, choice); };
  // scoate o piatra: primesti piatra, dispare
  await E(() => { const s = game.scene; s.me.gx = 6; s.me.gy = 16; s.startBuild(null, true); });
  const st0 = await E(() => game.scene.w.res.stone ?? 0);
  await E(() => { const f = game.scene.furnList.find(x => x.id === 'rock3'); game.scene.buildTap(f.gx + 0.5, f.gy + 0.5); });
  const c1 = await pick('Scoate'); await sleep(600);
  const r1 = await E(() => ({ gone: !game.scene.furnList.some(x => x.id === 'rock3'), yard: game.scene.w.yard, stone: game.scene.w.res.stone }));
  ok('piatra scoasa (+3 piatra)', r1.gone && r1.yard.rock3 === 0 && r1.stone - st0 === 3, c1 + ' ' + JSON.stringify(r1));
  // muta un copac
  await E(() => { const f = game.scene.furnList.find(x => x.id === 'tree3'); game.scene.buildTap(f.gx + 0.5, f.gy + 0.5); });
  const c2 = await pick('Mută'); await sleep(300);
  await E(() => game.scene.buildTap(4.5, 18.5)); await sleep(600);
  const r2 = await E(() => { const f = game.scene.furnList.find(x => x.id === 'tree3'); return { at: f ? [f.gx, f.gy] : null, yard: game.scene.w.yard.tree3, blocked: game.scene.nav.isBlocked(4.5, 18.5) }; });
  ok('copacul mutat pe locul nou (si nu poti trece prin el)', r2.at && r2.at[0] === 4 && r2.at[1] === 18 && r2.blocked, c2 + ' ' + JSON.stringify(r2));
  // nu poti muta in casa
  await E(() => { const f = game.scene.furnList.find(x => x.id === 'tree3'); game.scene.buildTap(f.gx + 0.5, f.gy + 0.5); });
  await pick('Mută'); await sleep(300);
  const t0 = await E(() => { const t = []; const T = game.scene.hud.toast.bind(game.scene.hud); game.scene.hud.toast = x => { t.push(x); T(x); }; window.__t = t; game.scene.buildTap(6.5, 9.5); return null; });
  const r3 = await E(() => ({ at: (f => [f.gx, f.gy])(game.scene.furnList.find(x => x.id === 'tree3')), t: window.__t }));
  ok('in casa nu se poate muta', r3.at[0] === 4 && r3.at[1] === 18 && r3.t.some(x => x.includes('Nu încape')), JSON.stringify(r3));
  await E(() => { game.scene.build.moving = null; game.scene.endBuild(); });
  // ramane la fel dupa ce iesi si intri in apartament (lumea se reface din w.yard)
  await E(() => { const s = game.scene; s.op({ k: 'stat', key: 'apartment', delta: 1 }); s.travel = null; s.switchArea('apartment'); s.travel = null; s.switchArea('world'); s.hud.setMinigame(false); });
  const r4 = await E(() => ({ t3: (f => f && [f.gx, f.gy])(game.scene.furnList.find(x => x.id === 'tree3')), r3: game.scene.furnList.some(x => x.id === 'rock3') }));
  ok('curtea ramane aranjata dupa ce iesi si intri', r4.t3 && r4.t3[0] === 4 && r4.t3[1] === 18 && !r4.r3, JSON.stringify(r4));
  await E(() => { const s = game.scene; s.me.gx = 6; s.me.gy = 15; s.me.path = []; }); await sleep(1500); await p.screenshot({ path: 'curte_aranjata.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
