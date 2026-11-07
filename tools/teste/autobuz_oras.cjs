// Orasul se deschide abia in Capitolul 6 (dupa ce s-a reparat drumul): inainte nu merge nici autobuzul, nici scuterul;
// dupa, merg amandoua.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=bus' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const E = (f, a) => p.evaluate(f, a);
  const tryBus = () => E(async () => { const s = game.scene; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); s.w.gameMin = Math.floor(s.w.gameMin / 1440) * 1440 + 10 * 60; s.w.minutes = 600; s.op({ k: 'money', delta: 500 }); s.ride = null; s.travel = null;
    const f = s.furnList.find(x => x.id === 'v-bus'); s.me.gx = f.gx + 0.5; s.me.gy = f.gy + 1.3; s.area = 'village'; const lab = s.actionFor(f).label; s.villageAction('v-bus', f);
    await new Promise(r => setTimeout(r, 400)); const ask = [...document.querySelectorAll('.modal')].find(m => !m.classList.contains('hidden') && m.innerText.includes('oraș'));
    if (ask) { const btn = [...ask.querySelectorAll('button')].find(x => /singur|Singur|Merg/.test(x.innerText)) ?? ask.querySelector('button'); btn?.click(); }
    await new Promise(r => setTimeout(r, 400)); return { lab, ride: s.ride?.kind ?? null, dest: s.ride?.dest ?? null, scooter: s.reachWhy('city') }; });
  for (let i = 0; i < 3; i++) await E(() => game.scene.devSkipChapter());
  await sleep(800);
  const a = await tryBus(); console.log('cap', await E(() => game.scene.chapter), JSON.stringify(a));
  ok('capitolul 3: autobuzul nu merge la oras', !a.ride && /închis|nu circulă/.test(a.lab));
  ok('capitolul 3: nici scuterul nu poate merge la oras', !!a.scooter);
  for (let i = 0; i < 3; i++) await E(() => game.scene.devSkipChapter());
  await sleep(800);
  const c = await tryBus(); console.log('cap', await E(() => game.scene.chapter), JSON.stringify(c));
  ok('capitolul 6: autobuzul pleaca spre oras', c.ride === 'bus' && c.dest === 'city');
  ok('capitolul 6: scuterul poate merge la oras', c.scooter === null);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
