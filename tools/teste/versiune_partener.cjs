// 1.9.3: „tot imi apare ca Bubu are o versiune mai veche (are aceeasi, doar ca e de pe Android)”.
// Telefonul se conecta inainte sa fie gata lumea: mesajul cu versiunea partenerului venea atunci si se pierdea.
// Acum se pastreaza pana e jocul gata. Doi jucatori pe serverul nostru: niciunul nu vede avertismentul, amandoi stiu versiunea celuilalt.
// Porneste inainte: PORT=8799 node server/server.mjs (dintr-o copie a folderului server)
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctxA = await b.newContext({ viewport: { width: 844, height: 600 } }), A = await ctxA.newPage(); A.on('pageerror', e => errs.push(e.message));
  await A.goto('http://localhost:5173/?skipload&dev'); await sleep(1500);
  await A.selectOption('select[name=mode]', 'server'); await A.evaluate(() => { document.querySelector('[name=serverUrl]').value = 'ws://localhost:8799'; });
  await A.click('.house-open'); await sleep(300); await A.fill('[name=hpass]', 'iubire123'); await A.click('.h-create'); await A.waitForSelector('.house-code', { timeout: 15000 });
  const net = await A.evaluate(() => JSON.parse(localStorage.getItem('bd-settings')).net);
  const toasts = p => p.evaluate(() => { const t = []; const o = new MutationObserver(() => document.querySelectorAll('.toast').forEach(x => t.push(x.textContent))); o.observe(document.body, { subtree: true, childList: true, characterData: true }); window.__t = t; });
  const url = who => `http://localhost:5173/?skipload&dev&who=${who}&mode=server&room=${net.room}&server=ws://localhost:8799#world`;
  // Bubu intra primul
  const A2 = await (await b.newContext({ viewport: { width: 844, height: 600 } })).newPage(); A2.on('pageerror', e => errs.push(e.message));
  await A2.goto(url('bubu')); await A2.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); await toasts(A2);
  await sleep(3000);
  // Dudu intra dupa (telefonul lui se conecteaza, apoi incarca lumea)
  const B = await (await b.newContext({ viewport: { width: 844, height: 600 } })).newPage(); B.on('pageerror', e => errs.push(e.message));
  await B.goto(url('dudu')); await B.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); await toasts(B);
  await sleep(30000);
  const ra = await A2.evaluate(() => ({ online: game.scene.partnerOnline, ver: game.scene.partnerVer, t: window.__t.filter(x => /versiune/.test(x)) }));
  const rb = await B.evaluate(() => ({ online: game.scene.partnerOnline, ver: game.scene.partnerVer, t: window.__t.filter(x => /versiune/.test(x)) }));
  console.log(JSON.stringify({ ra, rb }));
  ok('Bubu stie versiunea lui Dudu, fara avertisment', ra.online && !!ra.ver && !ra.t.length);
  ok('Dudu stie versiunea lui Bubu, fara avertisment', rb.online && !!rb.ver && !rb.t.length);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
