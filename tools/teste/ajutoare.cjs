// Echilibrarea din 1.8.0: pietre in padure, ajutoarele lui Dudu (de la cherestea), florarie cu clienti desi dar ieftina
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=ajut' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const E = (f, a) => p.evaluate(f, a);
  const hide = () => E(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await E(async () => { const s = game.scene; s.devSkipChapter(); s.devSkipChapter(); s.w.minutes = 10 * 60; window.__S = await import('/src/scenes/story.ts'); });
  await sleep(1500); await hide();

  // 1. pietrele din padure
  const rocks = await E(() => game.scene.furnList.filter(f => f.id.startsWith('f-rock') && f.action?.id === 'mine').map(f => [f.id, f.gx, f.gy]));
  ok('8 bolovani in padure', rocks.length === 8, JSON.stringify(rocks));
  const mined = await E(async () => { const s = game.scene, f = s.furnList.find(x => x.id === 'f-rock4'); const st0 = s.w.res.stone ?? 0; s.me.gx = f.gx + 0.5; s.me.gy = f.gy + 1.2; s.interact(s.me, f); for (let i = 0; i < 30 && !s.minigame; i++) await new Promise(r => setTimeout(r, 200)); if (s.minigame) s.minigame.obj.finish(1, 'Piatră! 🪨'); for (let i = 0; i < 80 && (s.w.res.stone ?? 0) === st0; i++) await new Promise(r => setTimeout(r, 200)); return { got: (s.w.res.stone ?? 0) - st0, dep: s.depleted('f-rock4') }; });
  ok('Dudu sparge piatra in padure (+3) si bolovanul se reface', mined.got === 3 && mined.dep, JSON.stringify(mined));
  await sleep(600); await p.screenshot({ path: 'aj_padure.png' });

  // 2. cheresteaua: pret nou + butonul de ajutoare
  const price = await E(() => { const s = game.scene; s.me.gx = 24; s.me.gy = 24.5; s.goTo('w-sawmill'); return null; });
  await p.waitForFunction(() => game.scene.minigame?.id === 'sawmill', null, { timeout: 20000 }); await sleep(900); await hide();
  const pr = await E(() => game.scene.minigame.obj.price()); ok('Dudu ia 5-7 lei pe lemn', pr >= 5 && pr <= 7, String(pr));
  await p.screenshot({ path: 'aj_cherestea.png' });
  await E(() => game.scene.minigame.obj.press('staff')); await sleep(500);
  const modal = await E(() => { const m = [...document.querySelectorAll('.modal')].find(x => !x.classList.contains('hidden') && x.offsetParent); return m ? m.innerText : ''; });
  ok('fereastra cu oameni de munca se deschide peste cherestea', modal.includes('Oameni de muncă'), modal.slice(0, 80));
  await p.screenshot({ path: 'aj_angajeaza.png' });
  await hide(); await E(() => game.scene.minigame?.obj.abort()); await sleep(2500);

  // 3. ziua angajatilor: taietor -> spargator -> culegator -> carausul vinde lemnele
  const day = await E(async () => {
    const s = game.scene, S = window.__S;
    s.op({ k: 'money', delta: 500 }); s.op({ k: 'res', res: 'wood', delta: 6 - (s.w.res.wood ?? 0) });
    const mk = (id, role) => ({ id, name: 'Test' + id, role, wage: 20, skill: 2, unpaid: 0, days: 0 });
    s.op({ k: 'town', key: 'staff', value: [mk('c', 'carter'), mk('w', 'wood'), mk('s', 'stone'), mk('p', 'picker')] });
    const r0 = { ...s.w.res }, m0 = s.w.money;
    s.w.stats.storyDay = -1; S.daily(s); await new Promise(r => setTimeout(r, 1500));
    const log = [...document.querySelectorAll('.modal')].map(m => m.innerText).join('\n');
    return { wood: (s.w.res.wood ?? 0) - r0.wood, stone: (s.w.res.stone ?? 0) - (r0.stone ?? 0), flower: (s.w.res.flower ?? 0) - (r0.flower ?? 0), money: s.w.money - m0, log: log.slice(0, 600) };
  });
  ok('spargatorul aduce piatra', day.stone >= 5, JSON.stringify(day));
  ok('culegatorul aduce flori', day.flower >= 8);
  ok('carausul vinde lemnele taiate (raman 5 pentru soba)', day.log.includes('cherestea') && day.money > -80);
  await p.screenshot({ path: 'aj_raport.png' });

  // 4. florarie: clientii platesc mult mai putin
  const fl = await E(() => { const s = game.scene; const before = s.florNpcs.length; for (let i = 0; i < 20; i++) s.spawnNpc(true); const l = s.florNpcs.slice(before); s.florNpcs.splice(before); return l.map(n => n.wants.join('+') + '=' + n.pay); });
  console.log('florarie: ' + fl.join('  '));
  ok('buchetele sunt ieftine (sub 40 lei)', fl.every(x => +x.split('=')[1] < 40));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
