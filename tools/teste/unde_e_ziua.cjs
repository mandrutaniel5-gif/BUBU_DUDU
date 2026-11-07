// 1.9.8: harta mare are „📍 Unde e?” (cheresteaua/scândurile, ferma, pădurea, Podul Mare) cu „🚶 Du-mă”;
// „Ziua X” de sus se apasă oricând: evenimentele de azi, ce urmează, ce e de făcut, raportul de dimineață.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=unde' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const E = (f, a) => p.evaluate(f, a);
  await E(() => { const s = game.scene; for (let i = 0; i < 3; i++) s.devSkipChapter(); }); await sleep(2500); await E(() => game.scene.hud.closeModal()); await sleep(300);
  // harta
  await E(() => game.scene.hud.openMap()); await sleep(600);
  const rows = await E(() => [...document.querySelectorAll('.goals.places li')].map(l => ({ t: l.textContent.replace(/\s+/g, ' '), lock: l.classList.contains('lock') })));
  ok('Unde e? are 4 locuri', rows.length === 4, rows.map(r => r.t.slice(0, 30)).join(' | '));
  ok('scândurile: la cherestea', /Cheresteaua.*scânduri/.test(rows[0]?.t));
  ok('ferma încuiată în cap. 3', rows[1]?.lock && /Capitolul 5/.test(rows[1].t));
  ok('pădurea și podul deschise în cap. 3', !rows[2]?.lock && !rows[3]?.lock);
  await p.screenshot({ path: 'unde_harta.png' });
  await E(() => document.querySelector('.modal:not(.hidden) .box').scrollTop = 9999); await sleep(200); await p.screenshot({ path: 'unde_lista.png' });
  // Du-mă la cherestea
  await E(() => document.querySelector('[data-place="sawmill"]').click()); await sleep(300);
  const pa = await E(() => ({ n: game.scene.me.path?.length ?? 0, last: game.scene.me.path?.at(-1) }));
  ok('Du-mă la cherestea pornește pe jos', pa.n > 0, JSON.stringify(pa));
  // podul
  await E(() => game.scene.hud.openMap()); await sleep(300); await E(() => document.querySelector('[data-place="bridge"]').click()); await sleep(300);
  ok('Du-mă la Podul Mare găsește drumul', await E(() => (game.scene.me.path?.length ?? 0) > 0));
  await E(() => game.scene.hud.openMap()); await sleep(300); await E(() => document.querySelector('[data-place="forest"]').click()); await sleep(300);
  ok('Du-mă la pădure găsește drumul', await E(() => (game.scene.me.path?.length ?? 0) > 0));
  // ferma în cap. 5
  await E(() => { const s = game.scene; while (s.chapter < 5) s.devSkipChapter(); }); await sleep(2500); await E(() => game.scene.hud.closeModal());
  await E(() => game.scene.hud.openMap()); await sleep(300); await E(() => document.querySelector('[data-place="farm"]').click()); await sleep(300);
  ok('Du-mă la fermă (cap. 5)', await E(() => (game.scene.me.path?.length ?? 0) > 0));
  // mergem pe jos pana acolo (dev: repede)
  for (let i = 0; i < 80 && await E(() => (game.scene.me.path?.length ?? 0) > 0); i++) await sleep(500);
  const at = await E(() => ({ x: game.scene.me.gx, y: game.scene.me.gy, f: game.scene.nearestFurn(game.scene.me)?.id }));
  ok('a ajuns la indicatorul fermei', Math.hypot(at.x - 24.5, at.y - 14.3) < 1.5 && at.f === 'st-farmgate', JSON.stringify(at));
  // ziua: o zi cu eveniment
  await E(() => { const s = game.scene; const S = window; }); 
  const evDay = await E(async () => { const S = await import('/src/scenes/story.ts'); for (let d = game.scene.w.day; d < game.scene.w.day + 40; d++) if (S.eventsOf(d).length) return d; return null; });
  await E(d => { game.scene.w.day = d; }, evDay); await sleep(400);
  const chip = await E(() => document.querySelector('.clock .day').textContent);
  ok('Ziua de sus are 📅', /📅/.test(chip), chip);
  await E(() => document.querySelector('.clock .day').click()); await sleep(400);
  const day = await E(() => document.querySelector('.modal:not(.hidden)')?.textContent.replace(/\s+/g, ' '));
  const evName = await E(async d => { const S = await import('/src/scenes/story.ts'); return S.eventsOf(d)[0].name; }, evDay);
  ok('panoul zilei arată evenimentul de azi', day && day.includes('Ziua ' + evDay) && day.includes(evName), (day || '').slice(0, 200));
  ok('panoul zilei arată ce urmează', /Urmează/.test(day || ''));
  await p.screenshot({ path: 'unde_ziua.png' });
  ok('fara erori', !errs.length, errs.join(' | '));
  await b.close();
})();
