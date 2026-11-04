const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const [name, vw] of [['phoneL', { width: 844, height: 390 }], ['laptop', { width: 1366, height: 768 }]]) {
    const ctx = await b.newContext({ viewport: vw, deviceScaleFactor: 1, hasTouch: name === 'phoneL' }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + String(e)));
    await p.goto('http://localhost:5173/?skipload&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 20000 });
    await p.evaluate(() => { const s = game.scene; s.hud.els['.modal']?.classList.add('hidden'); s.w.stats.chapter = 3; Object.assign(s.w.res, { egg: 6, milk: 3, cheese: 2, cabbage: 2, meat: 2, rice: 2, cornmeal: 2, flour: 3, tomato: 2, carrot: 3, potato: 3, water: 3, fish: 1, lemon: 3, mushroom: 2, strawberry: 2 }); });
    // modalul de retete
    await p.evaluate(() => { const s = game.scene; const f = s.constructor && (globalThis.FURN ?? null); s.hud.openKitchen(rc => { window.__picked = rc; }); });
    await p.waitForTimeout(400); await p.screenshot({ path: `cook_${name}_menu.png` });
    // minijocul: ciorba (boil), omleta (fry), pizza (oven)
    for (const rc of ['sarmale', 'omleta', 'pizza']) {
      await p.evaluate((rc) => { const s = game.scene; s.hud.els['.modal']?.classList.add('hidden'); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); s.cookRecipe = rc; const f = { id: 'stove', type: 'stove', gx: 5, gy: 4, w: 1, d: 1 }; s.startMinigame('cook', { id: 'cook', anim: 'act_cook', dur: 7, needs: { hunger: 10 }, text: 'x', minigame: 'pancakes' }, f); }, rc);
      await p.waitForTimeout(400);
      await p.screenshot({ path: `cook_${name}_${rc}_1.png` });
      // tap all ingredients
      for (let i = 0; i < 30; i++) { const pos = await p.evaluate(() => { const o = game.scene.minigame?.obj; if (!o || o.phase !== 'prep') return null; const it = o.items.find(i => !i.fly && !i.inPot); if (!it) return 'wait'; const k = game.scene.miniScale(); return [it.x * k, it.y * k]; }); if (!pos) break; if (pos === 'wait') { await p.waitForTimeout(150); continue; } await p.evaluate(([x, y]) => { const o = game.scene.minigame.obj; o.pointer('down', x / game.scene.miniScale(), y / game.scene.miniScale()); o.pointer('up', x, y); }, pos); await p.waitForTimeout(90); }
      await p.waitForTimeout(800);
      await p.screenshot({ path: `cook_${name}_${rc}_2.png` });
      // cook phase
      const m = await p.evaluate(() => game.scene.minigame.obj.rc.method);
      if (m === 'boil' || m === 'cold') { for (let i = 0; i < 200; i++) { await p.evaluate((i) => { const o = game.scene.minigame.obj; if (o.phase !== 'cook') return; const P = o.pot; const a = i * 0.35; o.pointer(i === 0 ? 'down' : 'move', P.x + Math.cos(a) * P.r, P.y + Math.sin(a) * P.r); }, i); if (i % 20 === 0) await p.waitForTimeout(30); } }
      else { for (let k = 0; k < 2; k++) { await p.waitForFunction(() => { const o = game.scene.minigame?.obj; return !o || o.phase !== 'cook' || (o.brown > 0.82 && o.flipT <= 0); }, null, { timeout: 15000 }); await p.screenshot({ path: `cook_${name}_${rc}_3.png` }); await p.evaluate(() => { const o = game.scene.minigame?.obj; if (o && o.phase === 'cook') o.pointer('down', 0, 0); }); await p.waitForTimeout(700); } }
      await p.waitForTimeout(600); await p.screenshot({ path: `cook_${name}_${rc}_4.png` });
      const res = await p.evaluate(() => ({ q: game.scene.minigame?.obj.quality, phase: game.scene.minigame?.obj.phase }));
      await p.waitForTimeout(3000);
      const inv = await p.evaluate((rc) => ({ dish: game.scene.w.res['dish_' + rc], egg: game.scene.w.res.egg, mini: !!game.scene.minigame }), rc);
      console.log(name, rc, JSON.stringify(res), JSON.stringify(inv));
    }
    // masa
    await p.evaluate(() => game.scene.hud.openTable(k => { window.__ate = k; })); await p.waitForTimeout(300); await p.screenshot({ path: `cook_${name}_table.png` });
    await ctx.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
