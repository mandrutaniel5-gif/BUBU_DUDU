const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const issues = [];
  for (const [vn, W, H] of [['telmic', 667, 375], ['tel', 844, 390]]) {
    const p = await (await b.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true })).newPage();
    // meniul de start: credite, erori, casa
    await p.goto('http://localhost:5173/?skipload&dev'); await sleep(1500);
    for (const sel of ['.credits', '.errs', '.house-open']) { await p.click(sel); await sleep(300);
      const r = await p.evaluate(() => { const c = document.querySelector('.cred .cred-in'); if (!c) return 'nu s-a deschis'; const b = c.getBoundingClientRect(); const o = []; if (b.top < 0 || b.bottom > innerHeight + 1 || b.left < 0 || b.right > innerWidth + 1) o.push('iese din ecran'); if (c.scrollHeight > c.clientHeight + 2 && !/(auto|scroll)/.test(getComputedStyle(c).overflowY)) o.push('tăiat'); return o.join(', '); });
      if (r) issues.push(`[${vn}] meniu ${sel}: ${r}`); await p.screenshot({ path: `m_${vn}_${sel.slice(1)}.png` }); await p.evaluate(() => document.querySelector('.cred')?.remove()); }
    // in joc: popurile, bara de construit, minijocurile
    await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=u2' + vn + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
    await p.evaluate(() => { const s = game.scene; for (let i = 0; i < 8; i++) s.devSkipChapter(); s.setInfinite(true); s.op({ k: 'stat', key: 'florarie', delta: 1 }); s.w.minutes = 11 * 60; }); await sleep(2000);
    await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
    for (const [name, code, sel] of [['emote', 's.hud.toggleEmotes()', '.pop.emotes'], ['impreuna', 's.hud.togglePairs()', '.pop.pairs']]) {
      await p.evaluate(code => { const s = game.scene; s.hud.closeMenus(); eval(code); }, code); await sleep(300);
      const r = await p.evaluate(sel => { const e = document.querySelector(sel); const b = e.getBoundingClientRect(); const o = []; if (b.top < -1 || b.bottom > innerHeight + 1 || b.left < -1 || b.right > innerWidth + 1) o.push(`iese din ecran ${[b.left, b.top, b.right, b.bottom].map(Math.round)}`); if (e.scrollHeight > e.clientHeight + 2 && !/(auto|scroll)/.test(getComputedStyle(e).overflowY) && !/(auto|scroll)/.test(getComputedStyle(e.querySelector('.grid') ?? e).overflowY)) o.push('tăiat'); for (const sel2 of ['.actions', '.card.me', '.minimap', '.goal']) { const x = document.querySelector('.hud ' + sel2); if (!x || getComputedStyle(x).display === 'none') continue; const a = x.getBoundingClientRect(); const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (ix > 3 && iy > 3) { const t = document.elementFromPoint(Math.max(a.left, b.left) + ix / 2, Math.max(a.top, b.top) + iy / 2); if (t && !e.contains(t)) o.push(`acoperit de ${sel2}`); } } return o.join(', '); }, sel);
      if (r) issues.push(`[${vn}] ${name}: ${r}`); await p.screenshot({ path: `g_${vn}_${name}.png` });
    }
    await p.evaluate(() => game.scene.hud.closeMenus());
    for (const [name, code] of [['cherestea', "s.startCustom('sawmill')"], ['florarie', "s.storeMode = 'florarie'; s.startCustom('merge')"], ['taraba', "s.storeMode = ''; s.startCustom('merge')"], ['nunta', "s.playScene('wedding', false)"], ['pescuit', "s.startCustom('fishing')"], ['bucatarie', "s.cookRecipe = 'sarmale'; s.startCustom('cook')"]]) {
      await p.evaluate(code => { const s = game.scene; s.minigame?.obj.abort?.(); s.minigame = null; s.hud.setMinigame(false); eval(code); }, code); await sleep(1600);
      await p.screenshot({ path: `g_${vn}_${name}.png` });
    }
    await p.close();
  }
  console.log(issues.join('\n') || 'nicio problemă'); await b.close();
})();
