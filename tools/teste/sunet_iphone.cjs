const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await (await b.newContext({ viewport: { width: 900, height: 500 } })).newPage();
  await p.goto('http://localhost:5173/?skipload&who=bubu&mode=solo&room=snd' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await p.mouse.click(450, 250); await sleep(1500);
  const s0 = await p.evaluate(() => __sfx.ctx()?.state);
  // 1) contextul suspendat de sistem (ca dupa un apel): revine la atingere
  await p.evaluate(() => __sfx.ctx().suspend()); await sleep(300);
  await p.mouse.click(450, 250); await sleep(600);
  const s1 = await p.evaluate(() => __sfx.ctx()?.state);
  // 2) contextul inchis de sistem: se reface singur, buclele de ambianta repornesc
  const c0 = await p.evaluate(() => { const c = __sfx.ctx(); c.close(); return 1; });
  await sleep(3500);
  const r = await p.evaluate(() => ({ st: __sfx.ctx()?.state, loops: Object.keys(__sfx.loops()).length }));
  console.log(s0 === 'running' ? 'OK  ' : 'FAIL', 'pornit', s0);
  console.log(s1 === 'running' ? 'OK  ' : 'FAIL', 'revine dupa suspendare + atingere', s1);
  console.log(r.st === 'running' && r.loops > 0 ? 'OK  ' : 'FAIL', 'refacut dupa inchidere', JSON.stringify(r));
  await b.close();
})();
