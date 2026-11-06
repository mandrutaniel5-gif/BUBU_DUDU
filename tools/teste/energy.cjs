const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 });
  await p.evaluate(() => { const s = game.scene; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); s.w.stats.chapter = 3; const c = s.w.chars.dudu.needs; c.energy = 85; c.hunger = 90; c.warmth = 80; s.w.gameMin = Math.floor(s.w.gameMin / 1440) * 1440 + 8 * 60; s.debugGo('forest'); });
  await p.waitForTimeout(4500);
  const log = async () => console.log(await p.evaluate(() => { const s = game.scene; const n = s.w.chars.dudu.needs; return `${String(Math.floor(s.w.minutes / 60)).padStart(2, '0')}:${String(Math.floor(s.w.minutes % 60)).padStart(2, '0')} energie ${n.energy.toFixed(0)}  foame ${n.hunger.toFixed(0)}  bolnav ${s.w.chars.dudu.sick ?? '-'}`; }));
  await log();
  // taie un copac la fiecare 8 secunde reale (aprox. 7 copaci pe ora de joc)
  for (let i = 1; i <= 23; i++) { await p.waitForTimeout(8000); await p.evaluate(() => { const s = game.scene; s.completeActivity(s.me, { id: 'chop', anim: 'act_scrub', dur: 4, needs: { fun: 6, energy: -1.5 }, text: 'Lemne!' }); }); if (i % 7 === 0) await log(); }
  await log();
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
