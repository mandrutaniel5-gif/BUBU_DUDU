// Podul cere „mancare calda”: ciorba (si alte mancaruri gatite) trebuie sa conteze, nu doar mancarea gata cumparata.
// La fel cererile satenilor care vor mancare. Ruleaza cu serverul vite pe :5173.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=pod' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const E = (f, a) => p.evaluate(f, a);
  await E(() => { const s = game.scene; for (let i = 0; i < 3; i++) s.devSkipChapter(); s.hud.closeModal(); const m = s.w.res.meals ?? 0; if (m) s.op({ k: 'res', res: 'meals', delta: -m }); s.op({ k: 'res', res: 'dish_ciorba', delta: 37 }); });
  await sleep(2500); await E(() => game.scene.hud.closeModal()); await sleep(300);
  await E(async () => { const S = await import('/src/scenes/story.ts'); S.openBridge(game.scene); }); await sleep(400);
  const row = await E(() => [...document.querySelectorAll('.goals.give li')].map(l => l.textContent.replace(/\s+/g, ' ')).find(t => /caldă/.test(t)));
  ok('podul arata ciorba ca mancare calda', /ai 37/.test(row || ''), row);
  await p.screenshot({ path: 'pod_ciorba.png' });
  await E(() => [...document.querySelectorAll('[data-give="meal"]')].pop().click()); await sleep(500);
  const r = await E(() => ({ given: game.scene.w.stats['bridge-meal'], ciorba: game.scene.w.res.dish_ciorba }));
  ok('a dat 3 boluri de ciorba la pod', r.given === 3 && r.ciorba === 34, JSON.stringify(r));
  // cererea unui satean pentru mancare
  const q = await E(async () => { const T = await import('/src/scenes/townctl.ts'); const s = game.scene; const q = { id: 'qx', who: 'rex', res: 'meals', qty: 2, pay: 30, day: s.w.day }; s.op({ k: 'town', key: 'quests', value: [q] }); const have = T.questHave(s, q); const err = T.deliverQuest(s, q); return { have, err, ciorba: s.w.res.dish_ciorba }; });
  ok('cererea de mancare primeste ciorba', q.have === 34 && q.err === null && q.ciorba === 32, JSON.stringify(q));
  ok('fara erori', !errs.length, errs.join(' | '));
  await b.close();
})();
