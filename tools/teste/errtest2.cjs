const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:4173/?skipload&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  // activitate stricata (fara obiect) -> inainte oprea tot desenul
  await p.evaluate(() => { const s = game.scene; s.partner.activity = { a: { id: 'eat', dur: 99, needs: {}, anim: 'act_eat', text: '' }, furn: null, t: 0 }; });
  const fr = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const l = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(l); else r(n); }; requestAnimationFrame(l); }));
  await p.waitForTimeout(500); await p.screenshot({ path: 'err_world.png' });
  const toasts = await p.evaluate(() => [...document.querySelectorAll('.toasts > *')].map(t => t.textContent));
  await p.evaluate(() => { game.scene.partner.activity = null; });
  // versiune diferita la partener
  await p.evaluate(() => game.scene.onRemoteEvent({ t: 'ver', who: 'bubu', ver: '1.2.6' }));
  const t2 = await p.evaluate(() => [...document.querySelectorAll('.toasts > *')].map(t => t.textContent).filter(x => /versiune/.test(x)));
  await p.evaluate(() => { location.hash = '#menu'; }); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('.errs')?.click()); await p.waitForTimeout(300); await p.screenshot({ path: 'err_menu.png' });
  console.log('cadre/s:', fr, '| toast eroare:', toasts.filter(t => /eroare/.test(t)), '| versiune:', t2);
  console.log('lista:', (await p.evaluate(() => document.querySelector('.errlist')?.textContent ?? '')).slice(0, 200));
  console.log('page errors:', errs.length); await b.close();
})();
