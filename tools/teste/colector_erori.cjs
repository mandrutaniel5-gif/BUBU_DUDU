// 1.12.1: colectorul de erori (modul tester). Pornit din Setari (5 atingeri pe versiune → 🐞), fara cod.
// Verifica: eroarea de cod intra in rapoarte cu poza si context; personajul bagat intr-un perete e gasit singur;
// raportul de tester (poza, locul atins, tipul, textul); lista din meniu. Ruleaza cu `npm run dev` pornit.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&name=Tester#menu'); await sleep(1500);
  await p.click('.more'); for (let i = 0; i < 5; i++) await p.click('.vtap');
  await p.click('.devcode .tester'); ok('modul tester pornit (fara cod)', await p.evaluate(() => localStorage.getItem('bd-tester') === '1'));
  await p.click('.cred .xcred'); await p.click('[data-tab=offline]'); await p.click('button.play');
  await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); await sleep(2000);
  const E = (f, a) => p.evaluate(f, a); await E(() => game.scene.hud.closeModal());
  ok('butonul 🐞 la vedere', !!(await p.$('.bugbtn')));
  // 1) eroare de cod
  await E(() => { const s = game.scene; const o = s.updateNpcs; s.updateNpcs = () => { s.updateNpcs = o; throw new Error('eroare de test'); }; });
  await sleep(1500);
  const r1 = await E(() => JSON.parse(localStorage.getItem('bd-bugs') || '[]').find(r => r.kind === 'eroare'));
  ok('eroarea de cod e in rapoarte, cu poza si context', !!r1 && /eroare de test/.test(r1.title) && !!r1.shot && r1.ctx.zona, r1 ? `${r1.ctx.zona} · cap. ${r1.ctx.capitol}` : '-');
  // 2) personajul intr-un perete al casei
  await E(() => { const s = game.scene; s.me.gx = 2.1; s.me.gy = 6.5; s.me.path = []; });
  await sleep(11000);
  const r2 = await E(() => JSON.parse(localStorage.getItem('bd-bugs') || '[]').find(r => r.kind === 'auto'));
  ok('gasit automat: personaj in interiorul unui obiect / problema vizuala', !!r2, r2 ? r2.title : '-');
  // 3) raportul testerului
  await E(() => { const s = game.scene; s.me.gx = 6.5; s.me.gy = 9.5; });
  await p.click('.bugbtn'); await sleep(800);
  const box = await (await p.$('.bugshot img')).boundingBox(); await p.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await p.click('[data-bc="0"]'); await p.fill('.bugnote', 'Canapeaua intra in perete'); await p.screenshot({ path: 'bug_fereastra.png' });
  await p.click('.bugsend'); await sleep(800);
  const r3 = await E(() => JSON.parse(localStorage.getItem('bd-bugs') || '[]').find(r => r.kind === 'tester'));
  ok('raportul testerului: tip, text, poza cu locul marcat, ultimii pasi', !!r3 && r3.cat === 'Se suprapun' && /Canapeaua/.test(r3.title) && !!r3.shot && r3.crumbs.length > 0, r3 ? r3.crumbs.slice(-2).join(' / ') : '-');
  // 4) meniul: lista
  await E(() => game.go('menu')); await sleep(1200); await p.click('.more'); await p.click('.cred .bugs'); await sleep(400);
  const n = await p.$$eval('.buglist .bi', x => x.length); ok('lista din meniu', n >= 3, String(n)); await p.screenshot({ path: 'bug_lista.png' });
  ok('fara erori neprevazute', errs.every(e => /eroare de test/.test(e)), errs.join(' / '));
  await b.close(); process.exit(fails ? 1 : 0);
})();
