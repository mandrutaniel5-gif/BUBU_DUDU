// 1.12.0: modul dezvoltator (codul se da ca argument: node dezvoltator.cjs <cod>; in repo nu sta). Codul gresit nu merge,
// cel bun deschide 🧪 Lumea de test; acolo: totul nelimitat, capitol inainte / inapoi, zi si ora, sarbatoare pornita direct,
// viteza timpului, afisajul. Lumea de test nu scrie nimic in Firebase. Plus: angajatii lucreaza si cand esti in apartament.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : '')); };
const CODE = process.argv[2] ?? '';
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  const errs = [], fbReq = []; p.on('pageerror', e => errs.push(e.message));
  p.on('request', r => { if (/firebaseio|firebasedatabase/.test(r.url())) fbReq.push(r.url()); });
  p.on('websocket', ws => { if (/firebase/.test(ws.url())) fbReq.push(ws.url()); });
  await p.goto('http://localhost:5173/?skipload#menu'); await sleep(1500);
  await p.click('.more'); ok('fara cod: nu se vede modul dezvoltator', !(await p.$('.devbox')));
  ok('locul pentru cod e ascuns', await p.$eval('.devcode', e => e.classList.contains('hidden')));
  for (let i = 0; i < 5; i++) await p.click('.vtap');
  ok('5 atingeri pe versiune: apare locul pentru cod', !(await p.$eval('.devcode', e => e.classList.contains('hidden'))));
  await p.fill('[name=devcode]', 'gresit'); await p.click('.devok'); await sleep(400);
  ok('codul gresit nu deblocheaza', !(await p.evaluate(() => localStorage.getItem('bd-dev-unlock'))));
  await p.fill('[name=devcode]', CODE); await p.click('.devok'); await p.waitForLoadState(); await sleep(2000);
  await p.click('.more'); ok('codul bun: modul dezvoltator pornit', !!(await p.$('.devbox')));
  await p.click('.devworld'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); await sleep(1500);
  const E = (f, a) => p.evaluate(f, a);
  // dupa schimbarea zilei vine cartonasul de dimineata in locul panoului: il redeschidem
  const D = async sel => { if (!(await p.$('.devpanel:not(.hidden) ' + sel))) { await E(() => game.scene.hud.closeModal()); await p.click('[data-a="dev"]'); await sleep(200); } await p.click('.devpanel ' + sel); };
  await E(() => game.scene.hud.closeModal());
  ok('lumea de test e locala (nu Firebase)', await E(() => game.scene.net.kind === 'solo' && game.scene.devWorld));
  await p.click('[data-a="dev"]'); await sleep(300); await p.screenshot({ path: 'dev_panou.png' });
  await p.click('[data-d="inf"]'); await sleep(3500);
  ok('totul nelimitat', await E(() => game.scene.w.money > 50000 && game.scene.w.res.wood > 500));
  await p.click('[data-ch="6"]'); await sleep(800); ok('capitolul 6', await E(() => game.scene.chapter === 6));
  await E(() => game.scene.hud.closeModal()); await p.click('[data-a="dev"]'); await p.click('[data-ch="2"]'); await sleep(500);
  ok('inapoi la capitolul 2', await E(() => game.scene.chapter === 2 && !game.scene.w.stats['goal-bike']));
  await E(() => game.scene.hud.closeModal()); await p.click('[data-a="dev"]'); await p.fill('[name=devday]', '24'); await p.click('[data-d="goday"]'); await sleep(400);
  ok('ziua 24 (iarna)', await E(() => game.scene.w.day === 24));
  await D('[data-h="18"]'); await sleep(300); ok('ora 18', await E(() => Math.round(game.scene.w.minutes / 60) === 18));
  await D('[data-spd="20"]'); const m0 = await E(() => game.scene.w.gameMin); await sleep(2000); const m1 = await E(() => game.scene.w.gameMin);
  ok('viteza ×20 (1 minut de joc pe secunda ×20)', m1 - m0 > 30, `${Math.round(m1 - m0)} minute de joc in 2 s`);
  await D('[data-spd="1"]'); await D('[data-hplay="paste"]'); await sleep(800);
  ok('sarbatoarea pornita direct', await E(() => game.scene.minigame?.id === 'holiday' && game.scene.holidayId === 'paste'));
  await E(() => game.scene.minigame.obj.abort()); await sleep(2000);
  await D('[data-d="overlay"]'); await E(() => game.scene.hud.closeModal()); await sleep(500); await p.screenshot({ path: 'dev_afisaj.png' });
  // angajatii lucreaza si cand esti in apartament
  await D('[data-h="10"]'); await D('[data-d="staff"]'); await sleep(300);
  await E(() => { const s = game.scene; s.hud.closeModal(); s.setInfinite(false); s.w.res.wood = 10; s.w.res.stone = 0; });
  await E(() => game.scene.debugGo('apartment')); await sleep(4000);
  const w0 = await E(() => [game.scene.space, game.scene.w.res.wood, game.scene.w.res.stone]);
  await E(() => { const s = game.scene; for (let i = 0; i < 1200; i++) s.updateWalkers(0.1); });
  const w1 = await E(() => [game.scene.space, game.scene.w.res.wood, game.scene.w.res.stone]);
  ok('in apartament: angajatii aduc lemne si pietre', w1[0] === 'apartment' && (w1[1] > w0[1] || w1[2] > w0[2]), JSON.stringify([w0, w1]));
  ok('nicio legatura cu Firebase in lumea de test', !fbReq.length, fbReq.slice(0, 2).join(' '));
  ok('fara erori', !errs.length, errs.slice(0, 3).join(' / '));
  await b.close(); process.exit(fails ? 1 : 0);
})();
