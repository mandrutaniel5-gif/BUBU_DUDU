const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=story' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const E = (f, a) => p.evaluate(f, a);
  const hide = () => E(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  const shot = async n => { await hide(); await sleep(300); await p.screenshot({ path: `st_${n}.png` }); };
  const playScene = async (name, shots = []) => { for (let i = 0; i < 60; i++) { const r = await E(() => ({ id: game.scene.minigame?.id, bi: game.scene.minigame?.obj.bi, n: game.scene.minigame?.obj.beats?.length })); if (r.id !== 'cutscene') return; if (shots.includes(r.bi)) { await sleep(1200); await p.screenshot({ path: `scene_${name}_${r.bi}.png` }); shots = shots.filter(x => x !== r.bi); } await sleep(400); await E(() => game.scene.minigame?.obj.next()); } };
  await E(() => { const s = game.scene; for (let i = 0; i < 3; i++) s.devSkipChapter(); s.setInfinite(true); s.w.minutes = 10 * 60; });
  await sleep(1500);
  ok('capitolul 3 = Podul', await E(() => game.scene.chapter) === 3);
  // --- vehiculele: bicicleta acasa -> cheresteaua (podul inca rupt)
  await E(() => { const s = game.scene; s.op({ k: 'stat', key: 'bike', delta: 1 }); s.syncPlaced(); const f = s.furnList.find(f => f.id === 'h-bike'); s.me.gx = f.gx + 0.5; s.me.gy = f.gy + 1.2; s.boardVehicle('bike', f); });
  await sleep(500); await shot('ride_dest');
  const why = await E(() => game.scene.reachWhy('village')); ok('satul nu se poate cu podul rupt', /Pod/.test(why || ''), why);
  await E(() => game.scene.rideTo('sawmill')); await sleep(1200);
  await E(() => game.scene.ridePause()); await sleep(1500); const paused = await E(() => game.scene.ride?.v); ok('⏸ opreste pe drum', paused !== undefined && paused < 0.5, String(paused));
  await E(() => game.scene.ridePause());
  for (let i = 0; i < 30 && await E(() => !!game.scene.ride); i++) await sleep(300);
  const at = await E(() => ({ veh: game.scene.w.veh.bike, f: game.scene.furnList.some(f => f.id === 'sawmill-bike') }));
  ok('bicicleta parcata la cherestea', at.veh === 'sawmill' && at.f, JSON.stringify(at));
  // --- Podul
  await E(() => game.scene.goTo('w-bridge-gap')); await sleep(400);
  await E(() => { const s = game.scene; s.hud.closeModal?.(); s.op({ k: 'res', res: 'plank', delta: 10 }); s.op({ k: 'res', res: 'meals', delta: 5 }); s.op({ k: 'res', res: 'stone', delta: 20 }); });
  await E(() => game.scene.me.gx = 66); 
  await E(() => { window.__Story = null; }); 
  await E(async () => { const s = game.scene; const S = await import('/src/scenes/story.ts'); window.__S = S; S.openBridge(s); });
  await sleep(300); await p.screenshot({ path: 'st_bridge_ui.png' });
  for (const k of ['wood', 'plank', 'stone', 'meal', 'money']) { await E(k => document.querySelector(`[data-give="${k}"]`)?.click(), k); await sleep(250); }
  await sleep(800); await playScene('bridge', [0, 2]);
  await sleep(1500);
  ok('podul reparat dupa scena', await E(() => game.scene.bridgeFixed()));
  await E(() => { const s = game.scene; for (const g of ['bike']) s.completeGoal?.(g); }); await sleep(2500);
  const ch = await E(() => game.scene.chapter); ok('capitolul 4 = Satul renaste', ch === 4, String(ch));
  // --- Satul renaste
  const closed = await E(() => { const s = game.scene; return !!__S.villageClosed(s, 'v-bakery'); }); ok('brutaria e inchisa la inceput', closed);
  await E(() => { const s = game.scene; s.me.gx = 121; s.me.gy = 25; }); await sleep(1500); await shot('sat_pe_moarte');
  await E(() => { const s = game.scene; for (const pj of __S.PROJECTS) { for (let i = 0; i < 3; i++) document.querySelector('.modal')?.classList.add('hidden'); __S.openProjects(s); document.querySelector(`[data-pj="${pj.id}"]`)?.click(); } });
  await sleep(800);
  const pd = await E(() => game.scene.w.stats.projectsDone); ok('proiectele satului', pd === 6, String(pd));
  await sleep(1500); await shot('sat_renascut');
  // --- Ferma
  await E(() => { const s = game.scene; while (s.chapter < 5) s.devSkipChapter(); }); await sleep(1500);
  await E(() => { const s = game.scene; s.hud.closeModal(); for (const m of ['plow', 'seeder', 'tanker', 'combine']) s.op({ k: 'stat', key: 'mach-' + m, delta: 1 }); __S.openParcel(s, 'parcel-1'); }); await sleep(300);
  await E(() => [...document.querySelectorAll('.modal:not(.hidden) [data-ch]')][0]?.click()); await sleep(400);
  const own = await E(() => __S.parcelsOf(game.scene)['parcel-1']); ok('parcela cumparata', own?.owned, JSON.stringify(own));
  const field = async (label) => { await E(() => { const s = game.scene; s.me.gx = 9; s.me.gy = 28; __S.openParcel(s, 'parcel-1'); }); await sleep(300); await E(() => [...document.querySelectorAll('.modal:not(.hidden) [data-ch]')][0]?.click()); await sleep(2500); await p.screenshot({ path: `st_field_${label}.png` }); for (let i = 0; i < 60 && await E(() => !!game.scene.ride); i++) await sleep(300); return E(() => __S.parcelsOf(game.scene)['parcel-1'].stage); };
  ok('aratul cu plugul', await field('plow') === 'plowed');
  ok('semanatul', await field('sow') === 'sown');
  await field('water');
  await E(() => { const s = game.scene; const P = __S.parcelsOf(s); P['parcel-1'].prog = 0.99; s.op({ k: 'town', key: 'parcels', value: P }); s.w.gameMin += 60; }); await sleep(2500);
  await E(() => { game.scene.w.gameMin += 120; }); await sleep(2200);
  const ripe = await E(() => __S.parcelsOf(game.scene)['parcel-1'].stage); ok('campul s-a copt', ripe === 'ripe', ripe);
  await sleep(1000); await E(() => { game.scene.cam.zoom = 1; }); await shot('camp_copt');
  const g0 = await E(() => game.scene.w.res.grain ?? 0); await field('harvest'); const g1 = await E(() => game.scene.w.res.grain ?? 0);
  ok('recolta cu combina', g1 > g0, `${g0} -> ${g1}`);
  // animale
  await E(() => { const s = game.scene; for (const k of ['hens', 'cows', 'sheep', 'hives']) s.op({ k: 'stat', key: k, delta: 2 }); s.syncPlaced(); s.me.gx = 30; s.me.gy = 12; }); await sleep(1500); await shot('ferma');
  await E(() => { const s = game.scene; s.w.stats['got-hens'] = 0; __S.collect(s, 'hens'); __S.collect(s, 'cows'); __S.makeCheese(s); }); 
  const an = await E(() => ({ egg: game.scene.w.stats.eggsCollected, cheese: game.scene.w.stats.cheeseMade })); ok('oua + branza', an.egg > 0 && an.cheese > 0, JSON.stringify(an));
  // angajati
  await E(() => { const s = game.scene; __S.openStaff(s); document.querySelector('[data-role]:not(.poor)')?.click(); document.querySelector('[data-hire]')?.click(); }); await sleep(300); await p.screenshot({ path: 'st_staff.png' });
  const hired = await E(() => __S.staffOf(game.scene).length); ok('angajat', hired >= 1, String(hired));
  await E(() => { const s = game.scene; s.w.day++; s.w.stats.lastDay = 0; }); await sleep(2500); await p.screenshot({ path: 'st_raport.png' });
  // --- oras, magazin, contracte, targ
  await E(() => { const s = game.scene; while (s.chapter < 7) s.devSkipChapter(); s.hud.closeModal(); }); await sleep(1200);
  await E(() => { const s = game.scene; s.op({ k: 'res', res: 'egg', delta: 40 }); s.op({ k: 'res', res: 'cheese', delta: 10 }); __S.sellFarmCity(s); }); 
  await E(() => { const s = game.scene; __S.openLot(s); [...document.querySelectorAll('.modal:not(.hidden) [data-ch]')][0]?.click(); }); await sleep(300);
  await E(() => { const s = game.scene; s.op({ k: 'res', res: 'plank', delta: 40 }); s.op({ k: 'res', res: 'stone', delta: 40 }); __S.openLot(s); [...document.querySelectorAll('.modal:not(.hidden) [data-ch]')][0]?.click(); }); await sleep(600);
  await playScene('shop', [1]); await sleep(1200);
  ok('magazinul construit', await E(() => game.scene.w.stats.shopBuilt > 0));
  await E(() => { const s = game.scene; s.me.gx = 234; s.me.gy = 38.5; s.op({ k: 'res', res: 'egg', delta: 30 }); s.op({ k: 'res', res: 'honey', delta: 10 }); }); await sleep(1500); await shot('magazin');
  await E(() => { const s = game.scene; __S.openShop(s); document.querySelector('[data-stock="egg"]')?.click(); }); await sleep(200); await E(() => { __S.openShop(game.scene); document.querySelector('[data-stock="honey"]')?.click(); }); await sleep(200); await p.screenshot({ path: 'st_shop_ui.png' });
  await E(() => { const s = game.scene; s.op({ k: 'stat', key: 'truck', delta: 1 }); const c = __S.contractsOf(s)[0]; for (const [k, n] of Object.entries(c.need)) s.op({ k: 'res', res: k, delta: n }); __S.openContracts(s); document.querySelector('[data-ctr="0"]')?.click(); }); await sleep(800); await playScene('truck', [0]); await sleep(800);
  ok('contract livrat', await E(() => game.scene.w.stats.contracts >= 1));
  // --- nunta
  await E(() => { const s = game.scene; while (s.chapter < 8) s.devSkipChapter(); s.hud.closeModal(); }); await sleep(1200);
  await E(() => { const s = game.scene; __S.buyRing(s); s.me.gx = 52; s.me.gy = 33; s.partner.gx = 52.5; s.partner.gy = 33.3; s.partner.path = []; });
  ok('se poate face cererea', await E(() => __S.canPropose(game.scene)));
  await E(() => game.scene.playScene('propose', true)); await playScene('propose', [1, 2, 3]); await sleep(1200);
  ok('logoditi', await E(() => game.scene.w.stats.engaged > 0));
  await E(() => { const s = game.scene; s.w.chars.bubu.owned = [...(s.w.chars.bubu.owned ?? []), 'mireasa', 'voal']; s.w.chars.dudu.owned = [...(s.w.chars.dudu.owned ?? []), 'mire']; __S.buyCake(s); __S.hireMusic(s); for (const v of ['leana', 'ina', 'gogu', 'rita']) { s.op({ k: 'stat', key: 'friend-' + v, delta: 5 }); __S.inviteVillager(s, v); } });
  const miss = await E(() => __S.weddingMissing(game.scene)); ok('totul gata de nunta', !miss.length, JSON.stringify(miss));
  await E(() => game.scene.playScene('wedding', true)); await playScene('wedding', [1, 3, 4, 7, 8]); await sleep(1500);
  ok('casatoriti', await E(() => game.scene.w.stats.married > 0));
  // anotimpuri
  await E(() => { const s = game.scene; s.w.day = 22; s.me.gx = 10; s.me.gy = 20; }); await sleep(1500); await shot('iarna');
  console.log('erori:', errs.length ? errs.slice(0, 8).join('\n') : 'niciuna'); await b.close();
})();
