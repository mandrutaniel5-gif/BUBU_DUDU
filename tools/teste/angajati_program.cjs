// 1.12.0: angajatii pleaca acasa la 18 (ii vezi plecand pe drum) si vin dimineata la 8; tractoristul merge cu tractorul
// pe randurile parcelei; tamplarul / florarul lucreaza cu miscari de lucru (nu doar salută). Ruleaza cu `npm run dev` pornit.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=ang' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const E = (f, a) => p.evaluate(f, a);
  const at = h => E(h => { const s = game.scene; s.w.gameMin = Math.floor(s.w.gameMin / 1440) * 1440 + h * 60; s.w.minutes = h * 60; }, h);
  // ruleaza jocul mai repede: n secunde de joc, cu pasi de 0,1 s
  const run = n => E(n => { const s = game.scene; for (let i = 0; i < n * 10; i++) { for (const v of s.walkers) if (v.emp) s.updateStaff(v, 0.1); } }, n);
  await E(() => { const s = game.scene; for (let i = 0; i < 6; i++) s.devSkipChapter(); s.hud.closeModal();
    s.op({ k: 'town', key: 'parcels', value: { 'parcel-1': { owned: true, stage: 'wild', prog: 0, wet: 0 } } }); s.op({ k: 'stat', key: 'mach-plow', delta: 1 }); s.op({ k: 'stat', key: 'workshop', delta: 1 }); s.op({ k: 'res', res: 'wood', delta: 60 });
    const mk = (id, role, skill) => ({ id, name: 'T' + id, role, wage: 20, skill, unpaid: 0, days: 0 });
    s.op({ k: 'town', key: 'staff', value: [mk('x', 'tractor', 1), mk('j', 'joiner', 1), mk('w', 'wood', 1), mk('g', 'garden', 1)] }); s.syncPlaced(); });
  await at(9); await E(() => game.scene.syncWalkers());
  // tractoristul: pe tractor, se misca pe parcela
  await run(3);
  const tr = await E(() => { const v = game.scene.walkers.find(v => v.eid === 'x'); return { tractor: v.tractor, x: v.x, y: v.y, steps: v.job.steps.filter(s => s.drive).length }; });
  ok('tractoristul are randuri de mers cu tractorul', tr.steps >= 4, JSON.stringify(tr));
  await run(25);
  const tr2 = await E(() => { const v = game.scene.walkers.find(v => v.eid === 'x'); return { tractor: v.tractor, x: +v.x.toFixed(1), y: +v.y.toFixed(1) }; });
  ok('tractoristul e pe tractor pe camp', tr2.tractor, JSON.stringify(tr2));
  await E(() => { const v = game.scene.walkers.find(v => v.eid === 'x'); const s = game.scene; s.me.gx = v.x - 3; s.me.gy = v.y + 2; s.cam.x = 0; });
  await sleep(1500); await p.screenshot({ path: 'ang_tractor.png' });
  // tamplarul: animatii de lucru (nu doar „wave”)
  const jo = await E(() => { const v = game.scene.walkers.find(v => v.eid === 'j'); return v.job.steps.map(s => s.anim); });
  ok('tamplarul taie / slefuieste / cara', jo.includes('act_chop') && jo.includes('act_scrub'), jo.join(','));
  // la 18: pleaca acasa
  await at(18.05); await E(() => { for (const v of game.scene.walkers) if (v.emp) { v.job.steps = v.job.steps.slice(0, v.job.i + 1); } });
  await run(240);
  const off = await E(() => game.scene.walkers.filter(v => v.emp).map(v => v.eid + ':' + (v.off ? 'acasa' : `${v.x.toFixed(0)},${v.y.toFixed(0)}`)));
  ok('seara: toti au plecat acasa', off.every(x => x.endsWith('acasa')), off.join(' '));
  // noaptea nu apar
  await at(23); await run(30);
  ok('noaptea: nu sunt la munca', await E(() => game.scene.walkers.filter(v => v.emp).every(v => v.off)));
  // dimineata: vin
  await at(8.1); await run(1);
  const morn = await E(() => game.scene.walkers.filter(v => v.emp).map(v => (v.off ? 'acasa' : 'vine')));
  ok('dimineata: pornesc spre munca', morn.every(x => x === 'vine'), morn.join(' '));
  ok('fara erori', !errs.length, errs.slice(0, 3).join(' / '));
  await b.close(); process.exit(fails ? 1 : 0);
})();
