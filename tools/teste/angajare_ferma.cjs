// 1.10.2: angajare pe meserie (alegi meseria, vin 3 oameni), fara limita de angajati; animale fara limita la ferma.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=af' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1200);
  const E = (f, a) => p.evaluate(f, a);
  await E(() => { const s = game.scene; for (let i = 0; i < 5; i++) s.devSkipChapter(); s.op({ k: 'money', delta: 20000 }); s.op({ k: 'furn', key: 'standBroken', value: false }); s.syncPlaced(); });
  await sleep(2500); await E(() => game.scene.hud.closeModal());
  await E(async () => { const S = await import('/src/scenes/story.ts'); globalThis.__S = S; __S.openStaff(game.scene); });
  await sleep(300);
  const roles = await E(() => [...document.querySelectorAll('.modal:not(.hidden) [data-role]')].map(x => x.dataset.role));
  ok('alegi meseria: toate meseriile in lista', roles.length >= 11, roles.join(','));
  await p.screenshot({ path: 'angajare_meserii.png' });
  // angajeaza 3 taietori si 3 vanzatori la taraba + 2 pietrari = 8 (peste vechea limita de 6)
  for (const r of ['wood', 'stall', 'stone']) {
    await E(r => document.querySelector(`.modal:not(.hidden) [data-role="${r}"]`).click(), r); await sleep(200);
    const n = await E(() => document.querySelectorAll('.modal:not(.hidden) [data-hire]').length);
    ok(r + ': vin 3 oameni', n === 3, String(n));
    if (r === 'wood') await p.screenshot({ path: 'angajare_taietori.png' });
    for (let i = 0; i < (r === 'stone' ? 2 : 3); i++) { await E(() => document.querySelector('.modal:not(.hidden) [data-hire]')?.click()); await sleep(150); }
    await E(() => document.querySelector('.modal:not(.hidden) [data-back]')?.click()); await sleep(150);
  }
  const staff = await E(() => (game.scene.w.town.staff ?? []).length);
  ok('8 angajati (fara limita de 6)', staff === 8, String(staff));
  // ferma: 10 gaini, 5 vaci, 9 oi, 6 stupi
  await E(async () => { const s = game.scene; for (const [k, n] of [['hens', 10], ['cows', 5], ['sheep', 9], ['hives', 6]]) for (let i = 0; i < n; i++) s.op({ k: 'stat', key: k, delta: 1 }); s.syncPlaced(); __S.openFarmGate(s); });
  await sleep(300);
  const buy = await E(() => { const b = document.querySelector('.modal:not(.hidden) [data-buy="cows"]'); const before = game.scene.w.stats.cows; b.click(); return [before, game.scene.w.stats.cows, b.className]; });
  ok('poti cumpara a 6-a vaca', buy[1] === buy[0] + 1, JSON.stringify(buy));
  const r = await E(() => { const s = game.scene; s.w.stats['got-cows'] = 0; s.w.stats['got-sheep'] = s.w.day - 3; const S = __S; return { cows: S.ready(s, 'cows'), sheep: S.ready(s, 'sheep'), drawnSheep: s.furnList.filter(f => f.id.startsWith('st-sheep')).length, drawnCows: s.furnList.filter(f => /^st-cow\d*$/.test(f.id)).length, hives: s.furnList.filter(f => f.id.startsWith('st-hive')).length }; });
  ok('6 vaci dau 12 lapte, 9 oi dau 18 lana', r.cows === 12 && r.sheep === 18, JSON.stringify(r));
  await E(() => { const s = game.scene; s.hud.closeModal(); s.me.gx = 33; s.me.gy = 6; s.me.path = []; globalThis.__camAt = { x: 34, y: 5 }; }); await sleep(1500);
  await p.screenshot({ path: 'ferma_multe.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
