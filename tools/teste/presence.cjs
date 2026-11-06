const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 600 } });
  const errs = [];
  const open = async who => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e)); await p.addInitScript(() => { window.__toasts = []; const o = MutationObserver; new o(() => {}); }); await p.goto(`http://localhost:5173/?skipload&dev&who=${who}&mode=local&room=testprez#world`); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 }); await p.evaluate(() => { const t = document.querySelector('.toasts'); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.textContent && window.__toasts.push(n.textContent)))).observe(t, { childList: true, subtree: true }); }); return p; };
  const dudu = await open('dudu'); const bubu = await open('bubu');
  await dudu.waitForTimeout(8000);
  // Firebase trimitea prezenta la fiecare pozitie: simulam 50 de apeluri la rand
  await dudu.evaluate(() => { for (let i = 0; i < 50; i++) game.scene.setPartnerOnline(true); });
  // o scurta pierdere de semnal (2 s): nu trebuie sa apara nici "a iesit", nici "a intrat"
  await dudu.evaluate(() => { game.scene.setPartnerOnline(false); setTimeout(() => game.scene.setPartnerOnline(true), 2000); });
  await dudu.waitForTimeout(8000);
  const t = await dudu.evaluate(() => window.__toasts.filter(x => /intrat|ieșit/.test(x)));
  console.log('mesaje la Dudu:', JSON.stringify(t), 'partener online:', await dudu.evaluate(() => game.scene.partnerOnline));
  // Bubu inchide de tot -> dupa ~6 s apare o singura data "a iesit"
  await bubu.close(); await dudu.waitForTimeout(12000);
  console.log('dupa ce Bubu a iesit:', JSON.stringify(await dudu.evaluate(() => window.__toasts.filter(x => /intrat|ieșit/.test(x)))), 'control:', await dudu.evaluate(() => game.scene.partner.control));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
