// 1.9.2: „casa e creata si cand cineva vrea sa se conecteze zice ca nu exista”.
// (1) din modul Solo casa NU se mai face doar pe telefon: se face online (aici Firebase nu e accesibil -> eroare de retea, nu „Casa e gata”).
// (2) casa facuta pe serverul nostru; partenerul are selectat Firebase: o gaseste si acolo, intra in aceeasi camera, in modul serverului.
// (3) dupa ce ai facut casa, jocul ramane pe online (nu intri in solo). (4) parola gresita -> „Parola nu e bună”.
// Porneste inainte serverul: PORT=8799 node server/server.mjs (dintr-o copie, ca sa nu scrie in repo)
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
const SRV = 'ws://localhost:8799';
(async () => {
  const b = await chromium.launch(); const errs = [];
  const page = async () => { const p = await (await b.newContext({ viewport: { width: 844, height: 600 } })).newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('http://localhost:5173/?skipload&dev'); await sleep(1500); return p; };
  const net = p => p.evaluate(() => JSON.parse(localStorage.getItem('bd-settings')).net);
  const A = await page();
  // (1) solo -> se incearca online
  await A.selectOption('select[name=mode]', 'solo'); await A.click('.house-open'); await sleep(300);
  await A.fill('[name=hpass]', 'iubire123'); await A.click('.h-create');
  await A.waitForFunction(() => !document.querySelector('.h-create')?.disabled || document.querySelector('.house-code'), null, { timeout: 30000 }).catch(() => {});
  const m1 = await A.evaluate(() => document.querySelector('.house-msg')?.textContent ?? document.querySelector('.cred h3')?.textContent);
  ok('din Solo casa nu se mai face doar pe telefon (se incearca online)', !/Casa e gata/.test(m1) && /internet|conecta/i.test(m1), m1);
  // (2) casa pe serverul nostru
  await A.selectOption('select[name=mode]', 'server'); await A.evaluate(u => { document.querySelector('[name=serverUrl]').value = u; }, SRV);
  await A.fill('[name=hpass]', 'iubire123'); await A.click('.h-create');
  await A.waitForSelector('.house-code', { timeout: 15000 });
  const na = await net(A); ok('casa e facuta pe server', /^[A-Z]+-[A-Z0-9]{4}$/.test(na.code) && na.mode === 'server', JSON.stringify({ code: na.code, mode: na.mode }));
  ok('dupa ce ai facut casa, jocul ramane online (nu solo)', await A.evaluate(() => document.querySelector('select[name=mode]').value) === 'server');
  // (3) partenerul: are Firebase selectat (implicit), scrie codul cu litere mici
  const B = await page();
  await B.selectOption('select[name=mode]', 'firebase'); await B.evaluate(u => { document.querySelector('[name=serverUrl]').value = u; }, SRV);
  await B.click('.house-open'); await sleep(300);
  await B.fill('[name=hcode]', na.code.toLowerCase()); await B.fill('[name=hjpass]', 'gresita1'); await B.click('.h-join');
  await B.waitForFunction(() => /❌/.test(document.querySelector('.house-msg')?.textContent ?? ''), null, { timeout: 40000 }).catch(() => {});
  const m2 = await B.textContent('.house-msg'); ok('parola gresita -> „Parola nu e bună”', /Parola nu e bună/.test(m2), m2);
  await B.fill('[name=hjpass]', 'iubire123'); await B.click('.h-join');
  await B.waitForFunction(() => game.scene?.constructor?.name !== 'MenuScene' && location.hash.includes('world') || !!game.scene?.w, null, { timeout: 40000 }).catch(() => {});
  await sleep(1500);
  const nb = await net(B); ok('partenerul gaseste casa si intra in aceeasi camera', nb.room === na.room && nb.mode === 'server', JSON.stringify({ mode: nb.mode, same: nb.room === na.room }));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
