// 1.9.9: angajatii muncesc PAS CU PAS si fiecare actiune intra pe loc in inventar / bani:
// gradinarul planteaza din semintele voastre (cere seminte cand nu are), uda si culege; taietorul: fiecare copac = lemne;
// culegatorul: flori; ingrijitorul: ouale; vanzatorul vine, deschide taraba si serveste clientii din marfa voastra (banii toti, pe loc);
// caruțașul vinde lemne la cherestea. Raportul de dimineata spune ce a facut fiecare.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=real' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const E = (f, a) => p.evaluate(f, a);
  await E(() => { const s = game.scene; while (s.chapter < 5) s.devSkipChapter(); }); await sleep(2500); await E(() => game.scene.hud.closeModal());
  await E(() => {
    const s = game.scene; s.w.gameMin = Math.floor(s.w.gameMin / 1440) * 1440 + 9 * 60; s.w.minutes = 9 * 60;
    const r = s.w.res; for (const k of Object.keys(r)) if (k.startsWith('seed_') || k.startsWith('prod_') || ['flower', 'tulip', 'rose', 'sunflower', 'veg', 'carrot', 'potato', 'tomato', 'cabbage', 'strawberry', 'flour', 'lemon'].includes(k)) r[k] = 0;
    r.wood = 30; s.op({ k: 'money', delta: 500 });
    s.op({ k: 'furn', key: 'standBroken', value: false }); s.op({ k: 'furn', key: 'standOpen', value: false });
    s.op({ k: 'stat', key: 'hens', delta: 2 }); s.op({ k: 'stat', key: 'got-hens', delta: -(s.w.stats['got-hens'] ?? 0) });
    s.op({ k: 'plots', all: { '10,16': { crop: null, prog: 0, wetUntil: 0, fert: 0 }, '11,16': { crop: 'carrot', prog: 1, wetUntil: 0, fert: 0 }, '12,16': { crop: 'potato', prog: 0.3, wetUntil: 0, fert: 0 } } });
    s.syncPlaced();
    const mk = (id, role) => ({ id, name: 'T' + id, role, wage: 20, skill: 3, unpaid: 0, days: 0 });
    s.op({ k: 'town', key: 'staff', value: [mk('g', 'garden'), mk('w', 'wood'), mk('p', 'picker'), mk('a', 'animals'), mk('t', 'stall'), mk('c', 'carter')] });
    s.syncWalkers(); s.me.gx = 12; s.me.gy = 19;
  });
  const R = () => E(() => ({ ...game.scene.w.res, money: game.scene.w.money }));
  const r0 = await R();
  const run = (sec) => E(sec => { const s = game.scene; for (let i = 0; i < sec * 10; i++) { s.updateWalkers(0.1); s.updateNpcs(0.1); } }, sec);
  await run(60);
  let r1 = await R(); const pl = await E(() => game.scene.w.plots);
  const gg = await E(() => game.scene.w.town.staff.find(e => e.id === 'g').got ?? {});
  ok('grădinarul a cules morcovii copți (intră în inventar; vânzătorul poate vinde din ei)', gg.harvested >= 3 && (r1.carrot ?? 0) + (r1.prod_veg_0 ?? 0) >= 1 && pl['11,16'].prog < 1, `cules ${gg.harvested} · morcovi acum ${r1.carrot} · ${JSON.stringify(pl['11,16'])}`);
  ok('grădinarul a udat cartofii', pl['12,16'].wetUntil > await E(() => game.scene.w.gameMin), JSON.stringify(pl['12,16']));
  const log1 = await E(() => game.scene.w.log.map(l => l.text ?? l).filter(t => /semințe/.test(t)).join(' | '));
  ok('fără semințe: vă cere semințe', /n-am semințe/.test(log1), log1.slice(0, 200));
  ok('tăietorul: lemnele intră pe loc', r1.wood > r0.wood - 12, `lemne ${r0.wood} → ${r1.wood}`);
  ok('culegătorul: flori pe loc', (r1.flower ?? 0) >= 4, `flori ${r1.flower}`);
  ok('îngrijitorul a strâns ouăle', (r1.egg ?? 0) >= (r0.egg ?? 0) + 2, `ouă ${r0.egg} → ${r1.egg}`);
  ok('căruțașul a vândut lemne la cherestea', (await E(() => game.scene.w.stats['woodSold-' + game.scene.w.day] ?? 0)) > 0);
  ok('vânzătorul a deschis taraba', await E(() => !!game.scene.w.furn.standOpen));
  // semințe: acum plantează
  await E(() => game.scene.op({ k: 'res', res: 'seed_carrot', delta: 3 }));
  await run(40);
  const pl2 = await E(() => game.scene.w.plots), r2 = await R();
  ok('cu semințe: grădinarul plantează', !!pl2['10,16'].crop && (r2.seed_carrot ?? 0) < 3, JSON.stringify(pl2['10,16']) + ' semințe ' + r2.seed_carrot);
  // taraba: clienți reali din marfa voastră
  await E(() => { const s = game.scene; s.op({ k: 'town', key: 'staff', value: s.w.town.staff.filter(e => e.id === 't' || e.id === 'w' || e.id === 'c') }); s.syncWalkers();
    for (const k of ['carrot', 'potato', 'veg', 'tulip', 'rose', 'sunflower', 'flour', 'lemon']) s.w.res[k] = 0; for (const k of Object.keys(s.w.res)) if (k.startsWith('prod_')) s.w.res[k] = 0;
    s.op({ k: 'res', res: 'flower', delta: 40 - (s.w.res.flower ?? 0) }); s.npcs.length = 0; s.npcSpawnT = 0; });
  const before = await R();
  await run(90);
  const after = await R(); const served = await E(() => game.scene.w.town.staff.find(e => e.id === 't').got);
  const s0 = before; void s0;
  ok('vânzătorul servește clienți din marfa voastră', (served?.served ?? 0) >= 1 && after.flower < before.flower, JSON.stringify(served) + ` flori ${before.flower} → ${after.flower}`);
  ok('banii de la tarabă intră toți', (served?.lei ?? 0) > 0);
  // raportul de dimineață
  const rep = await E(async () => { const S = await import('/src/scenes/story.ts'); const s = game.scene; s.w.day++; s.daily ? 0 : 0; S.daily(s); return [...document.querySelectorAll('.modal:not(.hidden) li')].map(l => l.textContent).join(' | '); });
  ok('raportul spune ce a făcut fiecare', /ieri: .*lemne/.test(rep) && /clienți serviți/.test(rep), rep.slice(0, 400));
  // tractoristul și spărgătorul (pe jos, la vedere), tâmplarul / florarul / magazinul (pas cu pas, din resursele voastre)
  await E(() => { const s = game.scene; s.hud.closeModal(); s.w.gameMin = Math.floor(s.w.gameMin / 1440) * 1440 + 9 * 60; s.w.minutes = 540;
    s.op({ k: 'town', key: 'parcels', value: { 'parcel-1': { owned: true, stage: 'wild', prog: 0, wet: 0 } } }); s.op({ k: 'stat', key: 'mach-plow', delta: 1 });
    const mk = (id, role) => ({ id, name: 'T' + id, role, wage: 20, skill: 3, unpaid: 0, days: 0 });
    s.op({ k: 'town', key: 'staff', value: [mk('x', 'tractor'), mk('s', 'stone'), mk('j', 'joiner'), mk('f', 'florist')] }); s.syncPlaced(); s.syncWalkers(); });
  const st0 = await R();
  await run(60);
  const fp = await E(() => game.scene.w.town.parcels['parcel-1'].stage), st1 = await R();
  ok('tractoristul a arat parcela (are plugul)', fp === 'plowed', fp);
  ok('spărgătorul: pietrele intră pe loc', st1.stone > st0.stone, `${st0.stone} → ${st1.stone}`);
  const w = await E(async () => { const S = await import('/src/scenes/story.ts'); const s = game.scene; s.op({ k: 'res', res: 'flower', delta: 10 }); const m0 = s.w.money, w0 = s.w.res.wood, f0 = s.w.res.flower; const a = S.staffWork(s, 'j', 'joiner'), b = S.staffWork(s, 'f', 'florist'); return { a, b, lei: s.w.money - m0, wood: w0 - s.w.res.wood, fl: f0 - s.w.res.flower }; });
  ok('tâmplarul: 4 lemne → scăunel vândut', w.wood === 4 && /🪑/.test(w.a), JSON.stringify(w));
  ok('florarul: 3 flori → buchet vândut', w.fl === 3 && /💐/.test(w.b) && w.lei > 0, JSON.stringify(w));
  ok('fara erori', !errs.length, errs.join(' | '));
  await b.close();
})();
