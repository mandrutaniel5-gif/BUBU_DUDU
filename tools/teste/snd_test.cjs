const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/firebase|trycloudflare|ERR_|WebSocket|Failed to load resource/i.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('http://localhost:5173/?who=dudu&mode=solo#world');
  await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await p.mouse.click(640, 360);
  await p.waitForFunction(() => __sfx.decoded() > 100, null, { timeout: 20000 }).catch(() => {});
  const show = async (lbl) => console.log(lbl.padEnd(22), JSON.stringify(await p.evaluate(() => ({ dec: __sfx.decoded(), pcm: __sfx.pcm(), loops: __sfx.loops(), played: __sfx.played.slice(-8) }))));
  await p.evaluate(() => { const s = game.scene; s.hud.els['.modal']?.classList.add('hidden'); s.w.stats.chapter = 3; s.w.minutes = 10 * 60; s.w.gameMin = 10 * 60; });
  await p.waitForTimeout(1500); await show('home inside day');
  // walk
  await p.keyboard.down('d'); await p.waitForTimeout(1200); await p.keyboard.up('d'); await show('after walking');
  await p.evaluate(() => { const s = game.scene; s.me.gx = 10; s.me.gy = 16; }); await p.waitForTimeout(1500); await show('yard');
  await p.evaluate(() => { const s = game.scene; s.me.gx = 2; s.me.gy = 8; }); await p.waitForTimeout(1500); await show('yard near stream');
  await p.evaluate(() => { const s = game.scene; s.w.gameMin += 12 * 60; }); await p.waitForTimeout(2000); await show('yard night');
  await p.evaluate(() => { const s = game.scene; s.w.gameMin -= 12 * 60; s.debugGo('forest'); }); await p.waitForTimeout(1500); await show('travel tractor');
  await p.waitForTimeout(3500); await show('forest');
  await p.evaluate(() => { const s = game.scene; s.me.gx = 15; s.me.gy = 12; }); await p.waitForTimeout(1500); await show('forest lake');
  await p.evaluate(() => { const s = game.scene; s.debugGo('home'); }); await p.waitForTimeout(5000);
  await p.evaluate(() => { const s = game.scene; s.w.stats.bike = 1; s.debugGo('village'); }); await p.waitForTimeout(5000); await show('village');
  await p.evaluate(() => { const s = game.scene; s.me.gx = 8.5; s.me.gy = 15.6; }); await p.waitForTimeout(1500); await show('village fountain');
  await p.evaluate(() => { const s = game.scene; s.debugGo('city'); }); await p.waitForTimeout(5000); await show('city');
  await p.evaluate(() => { const s = game.scene; s.debugGo('village'); }); await p.waitForTimeout(5000);
  await p.evaluate(() => { const s = game.scene; s.debugGo('home'); }); await p.waitForTimeout(5000);
  // activities
  await p.evaluate(() => { const s = game.scene; const f = s.constructor; const F = (globalThis.__FURN || []); }); 
  await p.evaluate(() => { const s = game.scene; s.me.gx = 6; s.me.gy = 6; s.startMinigame('pancakes', { id: 'cook', anim: 'act_cook', dur: 7, needs: {}, text: '' }, { id: 'stove', type: 'stove', gx: 5, gy: 4, w: 1, d: 1 }); });
  await p.waitForTimeout(1500); await show('pancakes minigame');
  await p.mouse.move(640, 400); await p.mouse.down(); await p.waitForTimeout(900); await p.mouse.up(); await p.waitForTimeout(300); await show('pancake pour');
  await p.evaluate(() => { const s = game.scene; s.minigame.obj.abort(); }); await p.waitForTimeout(3200);
  await p.evaluate(() => { const s = game.scene; s.partner.activity = null; s.startActivity(s.partner, { id: 'bath', anim: 'act_bath', dur: 8, needs: {}, text: 'x', place: 'tub' }, { id: 'tub', type: 'tub', gx: 9, gy: 3, w: 2, d: 1 }); s.me.gx = 9; s.me.gy = 5; });
  await p.waitForTimeout(3000); await show('partner bath');
  await p.evaluate(() => { const s = game.scene; s.stopActivity(s.partner, true); }); await p.waitForTimeout(500); await show('bath done');
  await p.evaluate(() => { const s = game.scene; s.startActivity(s.partner, { id: 'sleep', anim: 'act_sleepbed', dur: 99999, needs: {}, text: 'x', place: 'bed' }, { id: 'bed', type: 'bed', gx: 3, gy: 3, w: 2, d: 2 }); s.me.gx = 5; s.me.gy = 6; s.snoreT = 0; });
  await p.waitForTimeout(3000); await show('partner sleeping');
  await p.evaluate(() => { game.scene.partner.actor.play('laugh'); game.scene.me.actor.play('laugh'); game.scene.me.actor.play('fart'); }); await p.waitForTimeout(800); await show('laughs+fart');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
