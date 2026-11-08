// Furtuna (1.10.0): in ziua furtunii se vede (cer intunecat, ploaie, fulgere) si se aude (ploaie, vant, tunete);
// acoperisul reparat dispare pe loc de pe harta (inainte ramanea „stricat” o vreme). + apartamentul din oras e cald.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=fu' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1500);
  const day = await p.evaluate(async () => { const S = await import('/src/scenes/story.ts'); for (let d = 1; d < 400; d++) if (S.eventsOf(d).some(e => e.id === 'storm')) return d; return -1; });
  ok('exista ziua furtunii', day > 0, 'ziua ' + day);
  await p.evaluate(d => { const s = game.scene; s.devSkipChapter(); s.devSkipChapter(); s.w.day = d; s.w.gameMin = (d - 1) * 1440 + 9 * 60; s.w.minutes = 9 * 60; s.op({ k: 'furn', key: 'roofBroken', value: true }); s.op({ k: 'res', res: 'wood', delta: 20 }); s.op({ k: 'res', res: 'plank', delta: 5 }); s.me.gx = 8; s.me.gy = 15; s.me.path = []; }, day);
  await sleep(2600); await p.evaluate(() => game.scene.hud.closeModal()); await sleep(500);
  const lv = await p.evaluate(async () => (await import('/src/scenes/story.ts')).stormLevel(game.scene));
  ok('furtuna in toi dimineata', lv === 1, String(lv));
  // asteptam un fulger
  let flash = false; for (let i = 0; i < 80 && !flash; i++) { flash = await p.evaluate(async () => (await import('/src/world/season.ts')).lightning(game.scene.time, 1).a > 0.5); if (!flash) await sleep(150); }
  await p.screenshot({ path: 'furtuna_fulger.png' });
  ok('fulgera', flash);
  await sleep(700); await p.screenshot({ path: 'furtuna.png' });
  const loops = await p.evaluate(() => window.__sfx?.loops?.() ?? {});
  if (Object.keys(loops).length) ok('se aude ploaia si vantul', !!loops['storm-rain'] && !!loops['storm-wind'], JSON.stringify(loops)); else console.log('(sunetele nu sunt pornite in browserul de test)');
  ok('acoperisul stricat se vede', await p.evaluate(() => game.scene.furnList.some(f => f.id === 'st-roof')));
  await p.evaluate(async () => (await import('/src/scenes/story.ts')).fixRoof(game.scene)); await sleep(100);
  ok('reparat: dispare pe loc', await p.evaluate(() => !game.scene.furnList.some(f => f.id === 'st-roof') && !game.scene.w.furn.roofBroken));
  await sleep(300); ok('reparat: desenul casei se reface (cheia fara R)', await p.evaluate(() => !String(game.scene.bakeKey).split('|').pop().startsWith('R') && !String(game.scene.bakeKey).includes('|R')), await p.evaluate(() => game.scene.bakeKey));
  await p.evaluate(() => { game.scene.w.minutes = 19 * 60; }); 
  ok('seara se domoleste', await p.evaluate(async () => (await import('/src/scenes/story.ts')).stormLevel(game.scene)) < 0.5);
  await p.evaluate(d => { game.scene.w.day = d + 1; }, day);
  ok('a doua zi nu mai e furtuna', await p.evaluate(async () => (await import('/src/scenes/story.ts')).stormLevel(game.scene)) === 0);
  // apartamentul: noaptea, fara foc acasa, caldura nu scade
  await p.evaluate(() => { const s = game.scene; s.w.furn.fire = 0; s.switchArea('apartment'); s.w.minutes = 23 * 60; s.w.chars[s.myId].needs.warmth = 50; });
  await sleep(4000);
  const wm = await p.evaluate(() => [game.scene.space, game.scene.w.chars[game.scene.myId].needs.warmth]);
  ok('in apartament nu ingheti (calorifere)', wm[0] === 'apartment' && wm[1] >= 50, JSON.stringify(wm));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
