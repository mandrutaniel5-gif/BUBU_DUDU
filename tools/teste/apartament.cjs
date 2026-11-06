// Apartamentul: pianul, acvariul, espressorul si consola sunt activitati adevarate (mergi la obiect, animatie, efect);
// televizorul nu se strica odata cu cel de acasa; peretele cu usa dintre baie si bucatarie
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=apt' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(1500);
  const E = (f, a) => p.evaluate(f, a);
  await E(async () => {
    const s = game.scene, w = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 4; i++) s.devSkipChapter();
    s.op({ k: 'stat', key: 'apartment', delta: 1 });
    s.op({ k: 'town', key: 'decor', value: ['aquarium', 'piano', 'coffee', 'console', 'painting', 'bigplant', 'lamp'] });
    s.op({ k: 'furn', key: 'tvBroken', value: true }); // televizorul de acasa e stricat
    s.travel = null; s.ride = null; s.switchArea('apartment'); s.hud.setMinigame(false); s.w.minutes = 10 * 60; await w(1500);
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    window.__toasts = []; const o = s.hud.toast.bind(s.hud); s.hud.toast = (...a) => { window.__toasts.push(a[0]); return o(...a); };
    s.partner.control = 'ai'; s.aiArea = 'apartment'; s.partner.gx = 7; s.partner.gy = 10.5; s.partner.path = [];
  });
  // fiecare obiect: il atingi de departe, personajul merge acolo si face activitatea
  for (const [id, act, name] of [['d-piano', 'piano', 'pian'], ['d-aquarium', 'aquarium', 'acvariu'], ['d-coffee', 'coffee', 'cafea'], ['d-console', 'console', 'consola'], ['tv', 'tv', 'tv']]) {
    await E(() => { const s = game.scene; s.stopActivity(s.me); s.stopActivity(s.partner); s.me.gx = 6.5; s.me.gy = 10.5; s.me.path = []; for (const k of ['fun', 'energy', 'love']) { s.w.chars.bubu.needs[k] = 40; s.w.chars.dudu.needs[k] = 40; } });
    const n0 = await E(() => JSON.stringify(game.scene.w.chars.bubu.needs));
    await E(id => game.scene.goTo(id), id);
    await p.waitForFunction(a => game.scene.me.activity?.a.id === a, act, { timeout: 15000 }).catch(() => {});
    const got = await E(() => game.scene.me.activity?.a.id ?? null);
    ok(`${name}: Bubu merge la obiect si incepe activitatea`, got === act, String(got));
    await sleep(act === 'coffee' ? 4600 : 2600); await p.screenshot({ path: `apt_${name}.png` });
    const fl = await E(() => ({ ...game.scene.w.furn }));
    if (act === 'tv') ok('televizorul din apartament merge (nu e stricat ca cel de acasa)', fl.aptTvOn === true && fl.tvOn !== true, JSON.stringify({ aptTvOn: fl.aptTvOn, tvOn: fl.tvOn }));
    await p.waitForFunction(() => !game.scene.me.activity, null, { timeout: 15000 }).catch(() => {});
    const n1 = await E(() => JSON.stringify(game.scene.w.chars.bubu.needs));
    const d = Object.fromEntries(Object.keys(JSON.parse(n1)).map(k => [k, Math.round(JSON.parse(n1)[k] - JSON.parse(n0)[k])]));
    ok(`${name}: la final nevoile cresc`, (d.fun ?? 0) + (d.energy ?? 0) + (d.love ?? 0) > 6, JSON.stringify(d));
  }
  // a doua cafea in aceeasi zi nu se mai face
  await E(() => { const s = game.scene; s.me.gx = 14.5; s.me.gy = 12.5; s.goTo('d-coffee'); });
  await sleep(2500);
  const second = await E(() => ({ act: game.scene.me.activity?.a.id ?? null, t: window.__toasts.slice(-1)[0] }));
  ok('a doua cafea azi: refuzata cu mesaj', second.act !== 'coffee' && /deja/.test(second.t ?? ''), JSON.stringify(second));
  // peretele dintre baie si bucatarie: din baie in bucatarie treci doar pe usa (x = 14)
  const wall = await E(() => { const n = game.scene.nav; return { x13: n.edgeBlocked(13, 7, 13, 8), x15: n.edgeBlocked(15, 7, 15, 8), door: n.edgeBlocked(14, 7, 14, 8) }; });
  ok('perete intre baie si bucatarie, cu usa', wall.x13 && wall.x15 && !wall.door, JSON.stringify(wall));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
