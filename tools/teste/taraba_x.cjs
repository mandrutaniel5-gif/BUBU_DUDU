// 1.9.3: pe telefonul care nu e gazda, lista goala de clienti venea prin Firebase fara camp -> „undefined is not an object (evaluating 'e.map')”.
// Acum nu mai crapa, iar X-ul tarabei (zona mai mare) inchide taraba si pe tableta.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true }); const p = await ctx.newPage(); p.on('pageerror', e => console.log('E', e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=tb' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await p.evaluate(() => { const s = game.scene; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); s.op({ k: 'furn', key: 'standBroken', value: false }); const f = s.furnList.find(x => x.id === 'stand'); s.me.gx = 8; s.me.gy = 24.6; s.op({ k: 'furn', key: 'standOpen', value: true }); s.interact(s.me, f); });
  await p.waitForFunction(() => game.scene.minigame?.id === 'merge', null, { timeout: 15000 });
  // ca pe telefonul care nu e gazda: lista de clienti vine goala din Firebase (fara camp)
  const r = await p.evaluate(() => { const s = game.scene; Object.defineProperty(s, 'isHost', { get: () => false, configurable: true }); try { s.onRemoteEvent({ t: 'op', op: { k: 'npcs' } }); return 'ok'; } catch (e) { return 'THROW ' + e.message; } });
  console.log((r === 'ok' ? 'OK  ' : 'FAIL') + ' lista de clienti fara camp nu mai crapa jocul  ' + r);
  await new Promise(r => setTimeout(r, 1000));
  await p.touchscreen.tap(1160, 20); await new Promise(r => setTimeout(r, 4000));
  const left = await p.evaluate(() => game.scene.minigame?.id ?? null); console.log((left === null ? 'OK  ' : 'FAIL') + ' X-ul inchide taraba (tableta 1180x820)');
  await b.close(); })();
