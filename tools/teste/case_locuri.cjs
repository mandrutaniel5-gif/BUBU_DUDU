// 1.12.0 (Firebase adevarat): casa noua din meniu, casa ramane in lista, 1/2 cand e cineva in ea, locul lui Bubu nu se
// poate lua de pe alt telefon (si nici fortat, din joc), al treilea telefon gaseste casa plina. La final camera de test se goleste.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  let nPhone = 0;
  const phone = async () => { const c = await b.newContext({ viewport: { width: 844, height: 390 } }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('http://localhost:5173/?skipload&name=Tester' + (++nPhone) + '#menu'); await sleep(1500); return p; };
  const A = await phone(), B = await phone(), C = await phone();
  // A: casa noua, ca Bubu
  await A.click('.h-new'); await A.check('[name=hwho][value=bubu]'); await A.fill('[name=hpass]', 'test1234'); await A.click('.h-create');
  await A.waitForSelector('.house-code', { timeout: 20000 }); const code = (await A.textContent('.house-code')).trim(); console.log('cod:', code);
  await A.click('.h-play'); await A.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); await sleep(3000);
  const room = await A.evaluate(() => JSON.parse(localStorage.getItem('bd-settings')).net.room);
  ok('A: casa e in lista', await A.evaluate(() => JSON.parse(localStorage.getItem('bd-settings')).houses.length === 1));
  // B: intra la partener -> Bubu e ocupat -> intra ca Dudu
  await B.click('.h-joinopen'); await B.fill('[name=hcode]', code); await B.fill('[name=hjpass]', 'test1234'); await B.click('.h-join');
  await B.waitForSelector('[data-join2]', { timeout: 20000 }); await sleep(800);
  const opts = await B.$$eval('[data-join2]', x => x.map(b => b.dataset.as));
  ok('B: poate intra doar ca el / ursulet (locul ei e in joc)', opts.length === 1 && opts[0] === 'dudu', opts.join(','));
  await B.screenshot({ path: 'loc_alege.png' });
  await B.click('[data-join2]'); await B.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); await sleep(4000);
  ok('A si B se vad', await A.evaluate(() => game.scene.partnerOnline) && await B.evaluate(() => game.scene.partnerOnline));
  // C: aceeasi casa -> plina
  await C.click('.h-joinopen'); await C.fill('[name=hcode]', code); await C.fill('[name=hjpass]', 'test1234'); await C.click('.h-join');
  await sleep(4500); const full = await C.evaluate(() => document.querySelector('.cred')?.innerText ?? '');
  ok('C: casa e plina', /plină/.test(full), full.replace(/\n/g, ' ').slice(0, 80));
  await C.click('.cred .xcred'); await sleep(500); await C.screenshot({ path: 'loc_lista_2din2.png' });
  ok('C: lista arata 2/2', /2\/2/.test(await C.textContent('.houses')));
  // C forteaza intrarea ca Bubu (ex. doua telefoane apasa deodata): jocul nu intra, se intoarce in meniu cu mesaj
  await C.evaluate(r => { const s = JSON.parse(localStorage.getItem('bd-settings')); s.who = 'bubu'; s.net = { ...s.net, mode: 'firebase', room: r }; localStorage.setItem('bd-settings', JSON.stringify(s)); }, room);
  await C.goto('about:blank'); await C.goto('http://localhost:5173/?skipload#world'); await sleep(8000);
  const msg = await C.evaluate(() => [location.hash, document.querySelector('.cred')?.innerText ?? ''].join(' | '));
  ok('C: nu poate fi al doilea Bubu', /menu/.test(msg) && /deja în casă/.test(msg), msg.replace(/\n/g, ' ').slice(0, 120));
  // A iese din joc -> locul lui Bubu se elibereaza
  await A.evaluate(() => game.go('menu')); await sleep(3000);
  await C.click('.cred .xcred').catch(() => {}); await sleep(1500);
  const seatsC = await C.$$eval('.hc-seats button', x => x.map(b => b.innerText.replace(/\n/g, ' ')));
  ok('dupa ce A iese: Bubu e liber', seatsC.some(t => /panda|Tester1/.test(t) && !/în joc/.test(t)), seatsC.join(' / '));
  // curatenie: golim camera de test
  const D = await phone(); await D.evaluate(async r => { const [{ getApps, initializeApp }, fb] = await Promise.all([import('/node_modules/.vite/deps/firebase_app.js'), import('/node_modules/.vite/deps/firebase_database.js')]); const app = getApps()[0] ?? initializeApp({ databaseURL: 'https://bubu-dudu-76256-default-rtdb.europe-west1.firebasedatabase.app' }); await fb.remove(fb.ref(fb.getDatabase(app), 'rooms/' + r)); }, room).catch(e => console.log('curatenie:', e.message.slice(0, 80)));
  ok('fara erori', !errs.length, errs.slice(0, 3).join(' / '));
  await b.close(); process.exit(fails ? 1 : 0);
})();
