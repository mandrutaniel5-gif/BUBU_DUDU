// 1.12.0, 2 jucatori (mode=local): sarbatorile se fac doar daca vine si celalalt (invitatie), X-ul inchide la amandoi,
// martisorul facut singur ajunge la partener (mesaj + il poarta), rutina de seara nu mai tine 4 s dupa X-ul celuilalt,
// biletelul deschis dispare la X. Ruleaza cu `npm run dev` pornit.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
  const room = 'mp' + Date.now(), errs = [];
  const open = async who => { const q = await ctx.newPage(); q.on('pageerror', e => errs.push(who + ': ' + e.message)); await q.goto(`http://localhost:5173/?skipload&dev&who=${who}&mode=local&room=${room}#world`); await q.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 }); return q; };
  const A = await open('bubu'); const B = await open('dudu');
  await sleep(4000);
  const E = (p, f, a) => p.evaluate(f, a);
  ok('se vad unul pe altul', await E(A, () => game.scene.partnerOnline) && await E(B, () => game.scene.partnerOnline));
  // lumea: capitolul 3, ziua de Paste (primavara 5), ora 10
  await E(A, () => { const s = game.scene; for (let i = 0; i < 3; i++) s.devSkipChapter(); s.w.gameMin = 4 * 1440 + 600; s.op({ k: 'clock', gameMin: s.w.gameMin }); s.syncPlaced(); s.hud.closeModal(); });
  await sleep(1500); await E(B, () => { game.scene.hud.closeModal(); game.scene.syncPlaced(); });
  // 1) Paste: Bubu atinge masa -> Dudu primeste invitatia, NU intra singur
  await E(A, () => game.scene.playHoliday('paste'));
  await sleep(1500);
  ok('Paste: Bubu asteapta raspunsul (nu a intrat inca)', await E(A, () => !game.scene.minigame && !!game.scene.pendingHol));
  ok('Paste: Dudu NU a fost tras in sarbatoare', await E(B, () => !game.scene.minigame));
  const inv = await E(B, () => [...document.querySelectorAll('.modal:not(.hidden)')].map(m => m.innerText).join(' | '));
  ok('Paste: Dudu vede invitatia', /te cheamă/.test(inv), inv.replace(/\n/g, ' ').slice(0, 80));
  await B.click('.modal:not(.hidden) [data-ch="0"]'); await sleep(1500);
  ok('Paste: au intrat amandoi', await E(A, () => game.scene.minigame?.id === 'holiday') && await E(B, () => game.scene.minigame?.id === 'holiday'));
  await A.screenshot({ path: 'mp_paste_A.png' });
  // 2) Bubu da X -> la Dudu se termina in cel mult ~1,5 s
  await E(A, () => game.scene.minigame.obj.abort());
  const t0 = Date.now(); await B.waitForFunction(() => !game.scene.minigame, null, { timeout: 8000 }).catch(() => {});
  const dt = Date.now() - t0; ok('X la Bubu inchide si la Dudu', await E(B, () => !game.scene.minigame), dt + ' ms'); ok('...repede (sub 2 s)', dt < 2000);
  await sleep(1500);
  // 3) refuz: Dudu spune „Nu acum” -> Bubu nu intra (Pastele e in doi)
  await E(A, () => game.scene.playHoliday('paste')); await sleep(1200);
  await B.click('.modal:not(.hidden) [data-ch="1"]'); await sleep(1200);
  ok('refuz: Bubu nu intra singur la Paste', await E(A, () => !game.scene.minigame));
  const why = await E(A, () => [...document.querySelectorAll('.modal:not(.hidden)')].map(m => m.innerText).join(' | '));
  ok('refuz: Bubu afla de ce', /nu poate/.test(why), why.replace(/\n/g, ' ').slice(0, 90));
  await E(A, () => game.scene.hud.closeModal());
  // 4) martisorul: Dudu departe; Bubu il face singur, Dudu primeste mesaj si il poarta
  await E(B, () => { const s = game.scene; s.me.gx = 40; s.me.gy = 20; });
  await E(A, () => { const s = game.scene; s.w.gameMin = 0 * 1440 + 600; s.op({ k: 'clock', gameMin: s.w.gameMin }); s.syncPlaced(); });
  await sleep(2500); await E(B, () => game.scene.hud.closeModal()); await E(A, () => game.scene.hud.closeModal());
  await E(A, () => game.scene.playHoliday('martisor', false));
  ok('martisor: Dudu nu e tras in scena', await E(B, () => !game.scene.minigame));
  ok('martisor: scena fara partenerul de langa (trimis)', await E(A, () => game.scene.minigame.obj.phases.some(p => p.id === 'send')));
  await E(A, () => { const o = game.scene.minigame.obj; o.charm = 1; o.twists = 18; o.bow = true; o.goto('send'); });
  await sleep(1800); await A.screenshot({ path: 'mp_martisor_trimis.png' });
  await A.waitForFunction(() => !game.scene.minigame, null, { timeout: 15000 }).catch(() => {});
  await sleep(1500);
  const toastB = await E(B, () => document.querySelector('.toasts')?.innerText ?? '');
  ok('martisor: Dudu afla (mesaj)', /mărțișor/.test(toastB), toastB.replace(/\n/g, ' ').slice(0, 90));
  ok('martisor: Dudu il poarta', await E(B, () => game.scene.me.actor.outfit?.pin), await E(B, () => JSON.stringify([game.scene.me.actor.outfit?.pin, game.scene.w.stats['mpin-dudu'], game.scene.w.stats['mday-dudu'], game.scene.w.day])));
  await B.screenshot({ path: 'mp_martisor_primit.png' });
  // 5) rutina de seara: Dudu da X (cu biletelul deschis) -> la Bubu se termina repede, biletelul dispare la Dudu
  await E(A, () => game.scene.startBedtime()); await E(B, () => { game.scene.startBedtime(); game.scene.minigame.obj.showInput(); });
  await sleep(500);
  await E(B, () => game.scene.minigame.obj.abort());
  const t1 = Date.now(); await A.waitForFunction(() => !game.scene.minigame, null, { timeout: 8000 }).catch(() => {});
  const d1 = Date.now() - t1; ok('noapte buna: X-ul lui Dudu inchide la Bubu repede', d1 < 2000, d1 + ' ms');
  await sleep(1500);
  ok('noapte buna: biletelul nu ramane pe ecran dupa X', await E(B, () => !document.querySelector('.bed-input')));
  ok('fara erori in pagina', !errs.length, errs.slice(0, 3).join(' / '));
  await b.close(); process.exit(fails ? 1 : 0);
})();
