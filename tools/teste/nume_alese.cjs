// 1.13.0: fiecare isi scrie numele. Fara nume nu intri; numele apare pe cartonase, in ferestre, mesaje, pe canvas
// (textele vechi cu „Bubu” / „Dudu” se schimba singure), iar in doi partenerul vede numele celuilalt.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  // 1) Offline: fara nume nu intra; cu nume, numele e peste tot
  const c1 = await b.newContext({ viewport: { width: 844, height: 390 } }); const p = await c1.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload#menu'); await sleep(1500);
  await p.click('[data-tab=offline]'); await p.click('button.play'); await sleep(800);
  ok('fara nume: nu intra, cere numele', await p.evaluate(() => location.hash === '#menu' && document.querySelector('[name=myname]').classList.contains('need')));
  await p.fill('[name=myname]', 'Ana<b>'); await p.fill('[name=pname]', 'Mihai'); await p.click('[data-who=bubu]'); await p.click('button.play');
  await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); await sleep(2500);
  const E = (f, a) => p.evaluate(f, a);
  ok('numele curatat (fara semne HTML)', await E(() => game.scene.w.chars.bubu.name === 'Anab'));
  const cards = await E(() => [document.querySelector('.card.me .nm').textContent, document.querySelector('.card.partner .nm').textContent]);
  ok('cartonasele: numele alese', cards[0] === 'Anab' && cards[1] === 'Mihai', cards.join(' / '));
  await E(() => { game.scene.hud.closeModal(); game.scene.hud.toast('Dudu i-a dat lui Bubu o floare'); }); await sleep(400);
  const toast = await E(() => document.querySelector('.toasts').innerText);
  ok('mesajele vechi cu Bubu / Dudu arata numele', /Mihai i-a dat lui Anab o floare/.test(toast), toast.replace(/\n/g, ' ').slice(-60));
  await E(() => game.scene.hud.openGoals()); await sleep(300);
  ok('ferestrele: fara „Bubu” / „Dudu”', await E(() => !/\b(Bubu|Dudu)\b/.test(document.querySelector('.modal').innerText)));
  await E(() => { game.scene.hud.closeModal(); game.scene.playHoliday('paste'); }); await sleep(1500); await p.screenshot({ path: 'nume_scena.png' });
  await E(() => game.scene.minigame?.obj.abort()); await sleep(1500);
  // 2) In doi: fiecare isi vede numele celuilalt
  const c2 = await b.newContext({ viewport: { width: 844, height: 390 } }); const room = 'nm' + Date.now();
  const open = async (who, name) => { const q = await c2.newPage(); q.on('pageerror', e => errs.push(who + ': ' + e.message));
    await q.goto(`http://localhost:5173/?skipload&dev&who=${who}&name=${name}&mode=local&room=${room}#world`); await q.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); return q; };
  const A = await open('bubu', 'Ioana'); const B = await open('dudu', 'Radu'); await sleep(7000);
  const nA = await A.evaluate(() => document.querySelector('.card.partner .nm').textContent), nB = await B.evaluate(() => document.querySelector('.card.partner .nm').textContent);
  ok('in doi: fiecare vede numele partenerului', nA === 'Radu' && nB === 'Ioana', `${nA} / ${nB}`);
  await A.screenshot({ path: 'nume_doi.png' });
  ok('fara erori', !errs.length, errs.slice(0, 3).join(' / '));
  await b.close(); process.exit(fails ? 1 : 0);
})();
