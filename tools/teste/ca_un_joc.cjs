// 1.9.5: jocul se poarta ca un joc pe iPhone: fara selectie / lupa / meniul de text la apasare lunga (CSS + evenimente),
// dar joystick-ul (deget tras pe ecran) si butoanele merg in continuare. Ecranul complet pe Android si iOS e in ci/android_patch.py si ci/ios_patch.py.
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13 landscape'] }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.text().startsWith('acoperit')) console.log(m.text()); });
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=tch' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await p.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); const e = document.elementFromPoint(innerWidth*0.2, innerHeight*0.75); console.log('acoperit de', e.outerHTML.slice(0,200)); e.closest('#ui > *')?.style.setProperty('display','none'); }); await new Promise(r => setTimeout(r, 800));
  await new Promise(r => setTimeout(r, 1500)); await p.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); const e = document.elementFromPoint(innerWidth*0.2, innerHeight*0.75); console.log('acoperit de', e.outerHTML.slice(0,160)); e.closest('#ui > *')?.style.setProperty('display','none'); }); const vp = p.viewportSize(); const g0 = await p.evaluate(() => [game.scene.me.gx, game.scene.me.gy]);
  // atingere pe ecran (dreapta): Dudu merge acolo
  const cdp = await ctx.newCDPSession(p); const T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const x0 = vp.width * 0.2, y0 = vp.height * 0.75; await T('touchStart', x0, y0);
  for (let i = 1; i <= 10; i++) { await T('touchMove', x0 + i * 7, y0); await new Promise(r => setTimeout(r, 30)); }
  console.log('joy', JSON.stringify(await p.evaluate(() => ({ joy: game.scene.joy, el: document.elementFromPoint(innerWidth*0.2, innerHeight*0.75)?.id || document.elementFromPoint(innerWidth*0.2, innerHeight*0.75)?.className, mg: game.scene.minigame?.id, act: game.scene.me.activity?.a?.id })))); await new Promise(r => setTimeout(r, 1200)); await T('touchEnd'); await new Promise(r => setTimeout(r, 300));
  const g1 = await p.evaluate(() => [game.scene.me.gx, game.scene.me.gy]);
  console.log((Math.hypot(g1[0] - g0[0], g1[1] - g0[1]) > 0.3 ? 'OK  ' : 'FAIL') + ' joystick-ul (deget tras pe joc) misca personajul', JSON.stringify([g0, g1]));
  const css = await p.evaluate(() => { const s = getComputedStyle(document.getElementById('game')); return [s.webkitUserSelect, s.webkitTouchCallout ?? '', getComputedStyle(document.body).userSelect]; });
  console.log('css', JSON.stringify(css));
  // butonul HTML din HUD tot merge (meniul de emote)
  const btn = await p.evaluate(() => { const b = [...document.querySelectorAll('#ui button')].find(x => x.offsetParent); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, t: b.className }; });
  if (btn) { await p.touchscreen.tap(btn.x, btn.y); await new Promise(r => setTimeout(r, 600)); console.log('buton HUD apasat:', btn.t); }
  console.log(errs.join('\n') || 'no errors'); await b.close(); })();
