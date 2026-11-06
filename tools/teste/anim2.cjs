const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  const hide = () => p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  const end = () => p.evaluate(() => { const o = game.scene.minigame?.obj; if (o) o.abort?.(); });
  await p.evaluate(() => { const s = game.scene; s.w.stats.chapter = 4; s.w.money = 900; s.w.res.dish_sarmale = 3; s.w.res.dish_ciorba = 2; });
  await hide();
  // masa: Bubu mananca sarmale, Dudu ciorba
  await p.evaluate(() => { const s = game.scene; const t = { id: 'table', type: 'table', gx: 10, gy: 9, w: 2, d: 1 }; s.startActivity(s.me, { id: 'eat', anim: 'act_eat', dur: 8, needs: { hunger: 30 }, text: 'x', dish: 'dish_sarmale' }, t); s.startActivity(s.partner, { id: 'eat', anim: 'act_eat', dur: 8, needs: { hunger: 30 }, text: 'x', dish: 'dish_ciorba' }, t); });
  await p.waitForTimeout(1500); await p.screenshot({ path: 'an_table.png' });
  // roata mare in doi (AI) si singur
  await p.evaluate(() => { const s = game.scene; s.stopActivity(s.me); s.stopActivity(s.partner); s.debugGo('village', 'duo'); }); await p.waitForTimeout(5000); await hide();
  for (const [duo, tag] of [[true, 'duo'], [false, 'solo']]) {
    await p.evaluate(d => { const s = game.scene; s.duo = d; s.startCustom('ferris'); }, duo);
    await p.waitForTimeout(2500); await p.screenshot({ path: `an_ferris_${tag}_1.png` });
    await p.evaluate(() => { game.scene.minigame.obj.k = 0.47; }); await p.mouse.move(500, 300); await p.mouse.down(); await p.waitForTimeout(1800); await p.screenshot({ path: `an_ferris_${tag}_top.png` }); await p.mouse.up();
    await end(); await p.waitForTimeout(1500);
  }
  // calusei + fantana
  await hide();
  await p.evaluate(() => { const s = game.scene; s.me.gx = 14.5; s.me.gy = 24.3; s.villageAction('v-carousel', { id: 'v-carousel', type: 'carousel', gx: 14, gy: 22, w: 2, d: 2 }); });
  await p.waitForTimeout(2200); await p.screenshot({ path: 'an_carousel.png' });
  await p.waitForTimeout(7000);
  await p.evaluate(() => { const s = game.scene; s.me.gx = 9.8; s.me.gy = 15.8; s.villageAction('v-fountain', { id: 'v-fountain', type: 'fountain', gx: 8, gy: 14, w: 1, d: 1 }); });
  await p.waitForTimeout(350); await p.screenshot({ path: 'an_coin_1.png' }); await p.waitForTimeout(500); await p.screenshot({ path: 'an_coin_2.png' });
  // restaurant singur in oras
  await p.evaluate(() => { game.scene.debugGo('city', 'solo'); }); await p.waitForTimeout(5000); await hide();
  await p.evaluate(() => { const s = game.scene; s.duo = false; s.startCustom('resto'); }); await p.waitForTimeout(800); await p.screenshot({ path: 'an_resto_solo.png' }); await end(); await p.waitForTimeout(1500);
  await p.evaluate(() => { const s = game.scene; s.duo = false; s.startCustom('cinema'); game.scene.minigame.obj.k = 0.4; }); await p.waitForTimeout(1200); await p.screenshot({ path: 'an_cinema_solo.png' }); await end(); await p.waitForTimeout(1500);
  // rutina de seara: planul a trei seri diferite
  const plans = await p.evaluate(() => { const s = game.scene; const out = []; const orig = s.nightKey.bind(s); for (let d = 1; d <= 4; d++) { s.nightKey = () => d; s.startCustom('bedtime'); out.push(s.minigame.obj.plan.join('→')); s.minigame.obj.removeInput?.(); s.minigame = null; s.hud.setMinigame(false); } s.nightKey = orig; return out; });
  console.log('rutine:', plans.join(' | '));
  await p.evaluate(() => { const s = game.scene; s.nightKey = () => 3; s.startCustom('bedtime'); const o = s.minigame.obj; o.plan = ['story', 'sheep', 'stars', 'dream']; o.planI = 0; o.next(); });
  await p.waitForTimeout(1500); await p.screenshot({ path: 'an_bed_story.png' });
  await p.evaluate(() => { const o = game.scene.minigame.obj; o.next(); }); await p.waitForTimeout(2500); await p.screenshot({ path: 'an_bed_sheep.png' });
  await p.evaluate(() => { const o = game.scene.minigame.obj; o.next(); }); await p.waitForTimeout(2500); await p.screenshot({ path: 'an_bed_stars.png' });
  await p.evaluate(() => { const o = game.scene.minigame.obj; o.next(); }); await p.waitForTimeout(800); await p.screenshot({ path: 'an_bed_dream.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
