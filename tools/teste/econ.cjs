const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:5173/?skipload&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  const r = await p.evaluate(() => {
    const s = game.scene; s.w.stats.chapter = 3; s.w.res.wood = 200; s.w.money = 0;
    const sell = { id: 'sellwood', anim: 'flex', dur: 1.5, needs: {}, text: 'x' };
    s.completeActivity(s.me, sell); const m1 = s.w.money, w1 = s.w.res.wood;
    s.completeActivity(s.me, sell); const m2 = s.w.money;
    return { dupa_prima_vanzare: m1, lemne_ramase: w1, dupa_a_doua: m2 };
  });
  console.log('cherestea:', JSON.stringify(r));
  // piata: vinde 25 lemne
  const r2 = await p.evaluate(async () => {
    const s = game.scene; s.w.money = 0; s.w.res.wood = 30; s.goArea && 0;
    const T = await import('/src/scenes/townctl.ts');
    let got = []; const orig = s.startCustom.bind(s); s.startCustom = () => {}; T.villageMarket(s); s.startCustom = orig;
    const cfg = s.shopCfg; const item = cfg.items.find(i => i.icon === '🪵'); const before = s.w.money;
    const prices = []; for (let i = 0; i < 22; i++) { const m0 = s.w.money; const e = item.buy(); prices.push(e ? 'X' : s.w.money - m0); }
    return prices.join(',');
  });
  console.log('piata lemne (lei pe bucata):', r2);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
