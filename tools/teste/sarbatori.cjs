// 1.11.0: sarbatorile. Pentru fiecare: lucrurile apar in lume in ziua si la ora lor; sarbatoarea se joaca de la cap
// la coada (jucator automat care atinge peste tot; partenerul e AI) fara erori; dupa ea primiti amintirea si recompensa.
// Plus: Revelionul (nu va e somn, ceasul sare dupa miezul noptii) si o sarbatoare in doi (pe doua telefoane).
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
// [sarbatoarea, zi, ora, obiectul din lume care o porneste, arg]
const CASES = [
  ['xmastree', 24, 10, 'st-h-tree'], ['gifts', 24, 10, 'st-h-gifts'], ['colinde', 24, 18, 'st-h-carol'], ['santa', 23, 12, 'st-h-santa'], ['skate', 23, 12, 'st-h-rink'], ['carusel', 23, 12, 'st-h-xcar'],
  ['revelion', 28, 21.5, 'st-h-party'], ['bday', 9, 18.5, 'st-h-party', { who: 'bubu' }], ['bday', 19, 18.5, 'st-h-party', { who: 'dudu' }], ['paste', 5, 10, 'st-h-table'], ['martisor', 1, 10, 'st-h-table'],
  ['dragobete', 26, 10, 'st-h-table'], ['inawed', 6, 12, 'st-h-arch'], ['grand', 11, 12, 'st-h-table'], ['fishcontest', 13, 12, 'st-h-contest'], ['picnic', 13, 12, 'st-h-picnic'], ['loz', 14, 10, 'st-h-caravan'],
];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=bubu&mode=solo&room=sb' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await sleep(800);
  const E = (f, a) => p.evaluate(f, a);
  await E(() => { const s = game.scene; for (let i = 0; i < 6; i++) s.devSkipChapter(); s.op({ k: 'money', delta: 3000 }); for (const v of ['leana', 'ina', 'gogu', 'miti', 'rita', 'rex']) s.w.stats['friend-' + v] = 9; s.w.res.flower = 6; s.w.res.ghiocel = 3; s.w.res.dish_ciorba = 2; s.syncPlaced(); });
  await sleep(2000); await E(() => game.scene.hud.closeModal());
  for (const [id, day, h, obj, arg] of CASES) {
    const seen = await E(([day, h, obj]) => { const s = game.scene; s.w.gameMin = (day - 1) * 1440 + h * 60; s.w.minutes = h * 60; s.w.day = day; s.syncPlaced(); return s.furnList.some(f => f.id === obj); }, [day, h, obj]);
    // jucatorul automat: in momentele de privit trece mai departe, in cele jucate atinge peste tot (si trage cu degetul)
    const r = await E(async ([id, arg]) => {
      const s = game.scene; s.hud.closeModal(); s.playHoliday(id, true, arg ?? null);
      const o = s.minigame?.obj; if (!o) return { started: false };
      const phases = []; let n = 0;
      while (s.minigame && n < 9000) {
        n++; const ph = o.phase; if (ph && phases[phases.length - 1] !== ph.id) phases.push(ph.id);
        if (o.ended) { o.update(0.2); continue; }
        if (ph && !ph.play) { if (o.pt > 0.3) o.next(); }
        else if (n % 2 === 0) { const x = (n * 97) % o.W, y = 40 + (n * 53) % (o.H - 60); o.pointer('down', x, y); o.pointer('move', x + 30, y + 10); o.pointer('up', x + 30, y + 10); if (o.btns?.length) { const bt = o.btns[n % o.btns.length]; o.pointer('down', bt.x + 5, bt.y + 5); } if (o.boxes?.rects?.length) { const bx = o.boxes.rects[n % o.boxes.rects.length]; o.pointer('down', bx.x + bx.w / 2, bx.y + bx.h / 2); } }
        o.update(0.08);
        if (n % 300 === 0) await new Promise(r => setTimeout(r, 0));
      }
      return { started: true, done: !s.minigame, phases: phases.join('>'), n };
    }, [id, arg]);
    const mem = await E(([id, arg]) => { const s = game.scene; const k = id === 'bday' ? 'mem-bday-' + arg.who : id === 'loz' ? 'loz' : 'mem-' + id; return s.w.stats[k] ?? 0; }, [id, arg]);
    ok(`${id}${arg?.who ? ' ' + arg.who : ''}: apare în lume (${obj}), se joacă până la capăt, amintirea în album`, seen && r.started && r.done && mem > 0, `${r.phases} · ${r.n} pași`);
  }
  // obiectele dispar dupa ce ati sarbatorit (bradul ramane, impodobit)
  const after = await E(() => { const s = game.scene; s.w.gameMin = 23 * 1440 + 600; s.w.minutes = 600; s.w.day = 24; s.syncPlaced(); return { tree: s.furnList.find(f => f.id === 'st-h-tree')?.kind, gifts: s.furnList.some(f => f.id === 'st-h-gifts') }; });
  ok('după sărbători: bradul rămâne împodobit, cadourile au fost luate', after.tree === 'lit' && !after.gifts, JSON.stringify(after));
  ok('albumul „Amintiri de sărbători” se umple', await E(async () => { const S = await import('/src/scenes/story.ts'); const a = S.albums(game.scene).find(x => x.id === 'memories'); return a && a.items.filter(i => i.got).length >= 15; }));
  // Revelionul: energia nu scade seara; la 21:00 te inviorezi; dupa petrecere ceasul trece de miezul noptii
  const nye = await E(async () => {
    const s = game.scene; s.w.gameMin = 27 * 1440 + 20 * 60; s.w.minutes = 1200; s.w.day = 28; s.w.chars.bubu.needs.energy = 30; s.w.stats['nyePerk-bubu-0'] = 0; s.w.stats['nye-0'] = 0;
    const e0 = s.w.chars.bubu.needs.energy; for (let i = 0; i < 40; i++) s.update(0.25); const e1 = s.w.chars.bubu.needs.energy;
    s.w.gameMin = 27 * 1440 + 21 * 60 + 5; s.w.minutes = 21 * 60 + 5; s.econT = 0; s.update(0.05); const e2 = s.w.chars.bubu.needs.energy;
    s.playHoliday('revelion'); const o = s.minigame.obj; o.goto('wish'); o.wish = 0; o.pt = 10; o.update(0.1); o.next(); for (let i = 0; i < 40 && s.minigame; i++) o.update(0.2);
    return { e0, e1, e2, after: s.w.gameMin - 27 * 1440 };
  });
  ok('Revelion: seara energia nu scade', nye.e1 >= nye.e0 - 0.01, `${nye.e0} → ${nye.e1.toFixed(1)}`);
  ok('Revelion: la 21:00 cine e obosit se înviorează (60%)', nye.e2 >= 59, String(nye.e2.toFixed(1)));
  ok('Revelion: după petrecere e trecut de miezul nopții', nye.after > 1440, `${Math.floor(nye.after / 60)}:${String(Math.round(nye.after % 60)).padStart(2, '0')} (din ziua 28)`);
  // negustorul: mustata falsa se cumpara si se vede pe fata
  const must = await E(async () => { const s = game.scene; s.w.gameMin = 13 * 1440 + 600; s.w.minutes = 600; s.w.day = 14; s.syncPlaced(); const f = s.furnList.find(f => f.id === 'st-h-caravan'); const H = await import('/src/scenes/holidays.ts'); H.action(s, 'st-h-caravan', f); return !!document.querySelector('.modal:not(.hidden) [data-mi="mustata"]'); });
  await sleep(150); await E(() => document.querySelector('.modal:not(.hidden) [data-mi="mustata"]')?.click()); await sleep(300);
  ok('negustorul ambulant: mustața falsă e a ta și o porți', await E(() => game.scene.w.chars.bubu.outfit?.face === 'mustata' && !!game.scene.w.chars.bubu.owned?.includes('mustata')), String(must));
  console.log(errs.join('\n') || 'no errors');
  // ---------------------------------------------------------------- in doi
  const ctx2 = await b.newContext({ viewport: { width: 844, height: 390 } }); const room = 'sb2' + Date.now(); const errs2 = [];
  const open = async who => { const q = await ctx2.newPage(); q.on('pageerror', e => errs2.push(who + ': ' + e)); await q.goto(`http://localhost:5173/?skipload&dev&who=${who}&mode=local&room=${room}#world`); await q.waitForFunction(() => game.scene?.ready, null, { timeout: 30000 }); return q; };
  const D = await open('dudu'), B = await open('bubu'); await D.waitForTimeout(3000);
  for (const q of [D, B]) await q.evaluate(() => { const s = game.scene; s.w.stats.chapter = 5; s.w.gameMin = 23 * 1440 + 600; s.w.minutes = 600; s.w.day = 24; s.syncPlaced(); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); });
  await B.evaluate(() => game.scene.playHoliday('xmastree')); await D.waitForTimeout(1500);
  const dj = await D.evaluate(() => ({ mini: game.scene.minigame?.id, show: game.scene.holidayId, remote: game.scene.minigame?.obj.remote }));
  ok('în doi: Bubu pornește bradul, Dudu intră automat în aceeași sărbătoare', dj.mini === 'holiday' && dj.show === 'xmastree' && dj.remote === true, JSON.stringify(dj));
  await B.evaluate(() => { const o = game.scene.minigame.obj; o.next(); }); await D.evaluate(() => { const o = game.scene.minigame.obj; o.next(); }); await B.waitForTimeout(300);
  await B.evaluate(() => { const o = game.scene.minigame.obj; const G = { cx: o.W * 0.4 }; for (let i = 0; i < 3; i++) { o.tool = i; o.pointer('down', G.cx + (i - 1) * 30, o.H * 0.55); } });
  await D.waitForTimeout(1500);
  const seenOrn = await D.evaluate(() => game.scene.minigame?.obj.orns.filter(x => x.by === 'pa').length ?? 0);
  ok('în doi: globurile puse de Bubu apar pe bradul lui Dudu', seenOrn >= 2, String(seenOrn));
  console.log(errs2.join('\n') || 'no errors (în doi)'); await b.close();
})();
