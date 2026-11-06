const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')));
  await p.mouse.click(600, 100); await p.waitForTimeout(3000);
  const measure = async (label, fn) => {
    const get = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
    const r = await p.evaluate(() => { const s = game.scene, net = s.net; window.__c = { frames: 0, mut: 0, state: 0, ev: 0 }; const c = window.__c;
      if (!s.__wrapped) { s.__wrapped = 1; const u = s.update.bind(s); s.update = dt => { window.__c.frames++; u(dt); }; const ss = net.sendState.bind(net), se = net.sendEvent.bind(net); net.sendState = x => { window.__c.state++; ss(x); }; net.sendEvent = x => { window.__c.ev++; se(x); }; new MutationObserver(ms => { window.__c.mut += ms.length; }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true }); } return 0; });
    const a = await get(); if (fn) await fn(); else await p.waitForTimeout(10000); const z = await get();
    const c = await p.evaluate(() => window.__c);
    console.log(label.padEnd(24), JSON.stringify({ cadre_pe_s: +(c.frames / 10).toFixed(1), ocupat_procent: Math.round((z.TaskDuration - a.TaskDuration) * 10), modificari_meniu_pe_s: Math.round(c.mut / 10), pozitie_trimisa_pe_s: c.state / 10, evenimente_pe_s: c.ev / 10, canvas: await p.evaluate(() => game.canvas.width + 'x' + game.canvas.height) }));
  };
  await measure('stai pe loc');
  await measure('mergi', async () => { await p.keyboard.down('d'); await p.waitForTimeout(5000); await p.keyboard.up('d'); await p.keyboard.down('a'); await p.waitForTimeout(5000); await p.keyboard.up('a'); });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
