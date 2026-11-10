// 1.11.2: martisorul nu mai strica salvarea (bucla in haine); masa din curte nu sta pe flori; cobori de pe scuter
// intr-un loc liber; taietorii nu mai merg la acelasi copac si nu taie copaci deja taiati; ce face partenerul pe alta
// harta (basina, emote) nu se mai vede la tine.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=r12' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const E = (f, a) => p.evaluate(f, a);
  await E(() => { const s = game.scene; for (let i = 0; i < 7; i++) s.devSkipChapter(); s.w.stats.scooter = 1; s.op({ k: 'money', delta: 3000 }); });
  await sleep(1800); await E(() => game.scene.hud.closeModal());
  // 1) masa de sarbatoare nu sta pe florile / razoarele voastre
  const t = await E(() => { const s = game.scene; for (let x = 1; x <= 6; x++) for (let y = 14; y <= 18; y++) s.op({ k: 'plot', key: x + ',' + y, plot: { crop: 'tulip', prog: 0.5, wetUntil: 0, fert: 0 } }); s.w.gameMin = 600; s.w.minutes = 600; s.w.day = 1; s.syncPlaced(); const f = s.furnList.find(q => q.id === 'st-h-table'); return f && { x: f.gx, y: f.gy, onPlot: !!s.w.plots[Math.floor(f.gx) + ',' + Math.floor(f.gy)], reach: (() => { const q = s.nav.standSpot(Math.floor(f.gx), Math.floor(f.gy), 1, 1, f.gx + 0.5, f.gy + 1.5); return !!q && !!s.nav.path(8, 20, q.x, q.y); })() }; });
  ok('masa din curte se mută pe un loc liber (nu pe flori) și ajungi la ea', t && !t.onPlot && t.reach, JSON.stringify(t));
  // 2) martisorul (si dupa el) jocul se salveaza si se trimite fara erori
  await E(() => { const s = game.scene; s.playHoliday('martisor', false); const o = s.minigame.obj; let n = 0; while (s.minigame && n++ < 3000) { const ph = o.phase; if (ph?.play) { if (ph.id === 'pick' && o.btns?.[1]) o.pointer('down', o.btns[1].x + 5, o.btns[1].y + 5); else o.pointer('down', 400, 300); } else if (o.pt > 0.3) o.next(); o.update(0.1); } });
  await sleep(2500);
  const m = await E(() => { const s = game.scene; let json = 'ok'; try { JSON.stringify(s.w); s.sendCharSync(); s.save?.(true); } catch (e) { json = String(e); } return { json, pin: s.partner.actor.outfit?.pin ?? null }; });
  ok('după mărțișor jocul se salvează și se trimite (fără bucle)', m.json === 'ok', JSON.stringify(m));
  ok('partenerul poartă mărțișorul în piept', !!m.pin, String(m.pin));
  // 3) martisorul: daca astepti fara sa alegi, nu mai da eroare
  const w = await E(() => { const s = game.scene; s.w.stats['mart-bubu-0'] = 0; s.playHoliday('martisor', false); const o = s.minigame.obj; let n = 0, err = ''; try { while (s.minigame && n++ < 3000) { const ph = o.phase; if (ph?.play && ph.id !== 'pick') o.pointer('down', 400, 300); else if (!ph?.play && o.pt > 0.3) o.next(); o.update(0.1); } } catch (e) { err = String(e); } return err || 'ok'; });
  ok('mărțișorul: aștepți fără să alegi talismanul, fără erori', w === 'ok', w);
  // 4) cobori de pe scuter intr-un loc liber (la oras, sat, acasa, cherestea, lac)
  const bad = await E(async () => { const L = await import('/src/world/layout.ts'); const s = game.scene, out = []; for (const d of L.DESTS) for (let dx = -2; dx <= 2; dx += 0.5) for (const dy of [-0.8, -0.3, 0, 0.4, 0.9]) { s.ride = { kind: 'scooter', dest: d.id, duo: false }; s.me.riding = true; s.me.rideKind = 'scooter'; s.me.gx = d.x + dx; s.me.gy = d.y + dy; s.endRide(); if (s.nav.hits(s.me.gx, s.me.gy, 0.12)) out.push(`${d.id} ${dx},${dy}`); } return out; });
  ok('cobori de pe scuter mereu într-un loc liber', bad.length === 0, bad.slice(0, 5).join(' | '));
  const off = await E(() => { const s = game.scene, out = []; for (const [x, y] of [[196.4, 24.2], [101.2, 24.1], [4.2, 24.1], [210, 24.5]]) { s.me.board = true; s.me.riding = true; s.me.gx = x; s.me.gy = y; s.rideOff(); if (s.nav.hits(s.me.gx, s.me.gy, 0.12)) out.push(x + ',' + y); s.me.passenger = true; s.me.gx = x; s.me.gy = y; s.rideOff(); if (s.nav.hits(s.me.gx, s.me.gy, 0.12)) out.push('pas ' + x + ',' + y); } return out; });
  ok('cobori din spate / de pe scuter oprit: tot într-un loc liber', off.length === 0, off.join(' | '));
  // 5) doi taietori nu merg la acelasi copac; un copac taiat intre timp e sarit
  const wd = await E(() => { const s = game.scene; s.op({ k: 'town', key: 'staff', value: [{ id: 'w1', name: 'Ion', role: 'wood', wage: 20, skill: 2, unpaid: 0, days: 0 }, { id: 'w2', name: 'Vasile', role: 'wood', wage: 20, skill: 2, unpaid: 0, days: 0 }] }); s.syncWalkers(); s.w.gameMin = 9 * 60; s.w.minutes = 540;
    const [a, c] = ['w1', 'w2'].map(id => s.walkers.find(v => v.eid === id)); a.job.steps = s.staffPlan(a); a.job.i = 0; c.job.steps = s.staffPlan(c); c.job.i = 0;
    const ta = a.job.steps.map(x => x.tid).filter(Boolean), tc = c.job.steps.map(x => x.tid).filter(Boolean);
    // copacul primului e taiat cat timp merge spre el: la sosire il sare
    const first = a.job.steps[0]; s.op({ k: 'node', id: first.tid, until: Date.now() + 999999 }); a.x = first.x; a.y = first.y; a.job.route = []; a.job.at = false; s.updateStaff(a, 0.05);
    return { ta, tc, shared: ta.filter(x => tc.includes(x)).length, skipped: a.job.at === false && (a.job.steps[a.job.i]?.tid !== first.tid) };
  });
  ok('doi tăietori aleg copaci diferiți', wd.shared === 0 && wd.ta.length > 0 && wd.tc.length > 0, `${wd.ta.length} / ${wd.tc.length} copaci, comuni ${wd.shared}`);
  ok('copacul tăiat între timp e sărit (nu mai taie degeaba)', wd.skipped);
  console.log(errs.join('\n') || 'no errors');
  // 6) in doi: Dudu se baseste in sat, Bubu e in apartament: la Bubu nu apare nimic
  const ctx2 = await b.newContext({ viewport: { width: 844, height: 390 } }); const room = 'r12b' + Date.now();
  const open = async who => { const q = await ctx2.newPage(); await q.goto(`http://localhost:5173/?skipload&dev&who=${who}&mode=local&room=${room}#world`); await q.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 }); return q; };
  const D = await open('dudu'), B = await open('bubu'); await D.waitForTimeout(3000);
  for (const q of [D, B]) await q.evaluate(() => { const s = game.scene; s.w.stats.chapter = 6; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); });
  await D.evaluate(() => { const s = game.scene; s.me.gx = 120; s.me.gy = 20; s.sendCharSync(); });
  await B.evaluate(() => { const s = game.scene; (s.w.chars.dudu).area = 'world'; s.goArea?.('apartment'); });
  await B.waitForTimeout(2500);
  const sp = await B.evaluate(() => game.scene.space + '/' + game.scene.partnerSpace());
  const before = await B.evaluate(() => game.scene.fx.list.length);
  await D.evaluate(() => { const s = game.scene; s.w.chars.dudu.fart = 80; s.emote('fart'); s.fartJump(); });
  await B.waitForTimeout(1500);
  const after = await B.evaluate(() => game.scene.fx.list.length);
  ok('partenerul pe altă hartă: bășina lui nu apare la tine', typeof before === 'number' && after <= before, `${sp} · efecte ${before} → ${after}`);
  await b.close();
})();
