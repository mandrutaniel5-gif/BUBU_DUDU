const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev'); await sleep(1500);
  await p.screenshot({ path: 'house_menu.png' });
  // solo: casa noua fara retea (calculul cheii)
  await p.selectOption('select[name=mode]', 'solo');
  await p.click('.house-open'); await sleep(300);
  await p.fill('[name=hpass]', 'ab'); await p.click('.h-create'); await sleep(300);
  console.log('parola scurta:', await p.textContent('.house-msg'));
  await p.fill('[name=hpass]', 'iubire123'); await p.click('.h-create'); await sleep(500);
  await p.screenshot({ path: 'house_created.png' });
  const s1 = await p.evaluate(() => JSON.parse(localStorage.getItem('bd-settings')).net);
  console.log('creata:', s1.code, s1.room);
  // intra cu codul scris altfel + parola: aceeasi camera
  await p.fill('[name=hcode]', s1.code.toLowerCase().replace('-', ' ')); await p.fill('[name=hjpass]', 'iubire123'); await p.click('.h-join'); await sleep(400);
  const s2 = await p.evaluate(() => JSON.parse(localStorage.getItem('bd-settings')).net);
  console.log(s2.room === s1.room ? 'OK   acelasi cod+parola = aceeasi casa' : 'FAIL');
  await p.fill('[name=hjpass]', 'altaparola'); await p.click('.h-join'); await sleep(400);
  const s3 = await p.evaluate(() => JSON.parse(localStorage.getItem('bd-settings')).net);
  console.log(s3.room !== s1.room ? 'OK   alta parola = alta camera' : 'FAIL');
  // online fara casa sigura -> fereastra
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('bd-settings')); s.net.room = 'casuta-noastra'; s.net.code = undefined; localStorage.setItem('bd-settings', JSON.stringify(s)); });
  await p.reload(); await sleep(1500);
  await p.selectOption('select[name=mode]', 'firebase'); await p.click('.play'); await sleep(400);
  console.log((await p.locator('.cred.house').count()) ? 'OK   online cere casa cu parola' : 'FAIL');
  await p.screenshot({ path: 'house_required.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
