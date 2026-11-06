// Ordinea de desen in casa (pat, lampa, pereti, masina de spalat, ghivece...): Dudu e plimbat prin toata casa,
// pas cu pas. Verificam: (1) obiectele care se acopera pe ecran au mereu aceeasi ordine (nu „palpaie”),
// (2) Dudu e de partea buna a fiecarui perete si a fiecarei mobile langa care sta.
const { chromium } = require('playwright');
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
const ov = (a, b) => a.x1 >= b.x0 && a.x0 <= b.x1 && a.y1 >= b.y0 && a.y0 <= b.y1;
// perechi pe diagonala (una mai la stanga, alta mai la dreapta) nu se acopera: ordinea lor nu se vede
const diag = (a, b) => { const E = 1e-6, ax = a.x1 <= b.x0 + E, bx = b.x1 <= a.x0 + E, ay = a.y1 <= b.y0 + E, by = b.y1 <= a.y0 + E; return (ax && by) || (bx && ay); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  for (const chap of [0, 1]) {
    await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=adc' + chap + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
    await p.evaluate(async (chap) => { const s = game.scene; if (chap) s.devSkipChapter(); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); s.partner.control = 'remote'; s.partner.gx = 3.5; s.partner.gy = 10.5; globalThis.__orderLog = 1; }, chap);
    await new Promise(r => setTimeout(r, 1500));
    const frames = await p.evaluate(async () => {
      const s = game.scene, out = []; const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      for (let y = 2.3; y <= 11.8; y += 0.3) for (let x = 2.3; x <= 13.8; x += 0.3) {
        if (s.nav.isBlocked(Math.floor(x), Math.floor(y))) continue;
        if (Math.abs(x - 8) < 0.08 || Math.abs(y - 7) < 0.08 || Math.abs(y - 6) < 0.08) continue; // in grosimea peretilor interiori
        s.me.gx = x; s.me.gy = y; s.me.path = []; s.me.activity = null; s.cam.x; await raf();
        out.push({ x, y, o: globalThis.__order });
      }
      return out;
    });
    const seen = new Map(); let flick = [], wrong = [];
    for (const f of frames) {
      const o = f.o || []; const idx = new Map(o.map((e, i) => [e.id, i]));
      const st = o.filter(e => !e.id.startsWith('p:'));
      for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) {
        if (!ov(st[i].b, st[j].b) || diag(st[i], st[j])) continue;
        const k = [st[i].id, st[j].id].sort().join(' / '), v = st[i].id < st[j].id ? 1 : -1;
        if (!seen.has(k)) seen.set(k, { v, at: [f.x, f.y] }); else if (seen.get(k).v !== v && flick.length < 12) flick.push(k + ' @' + f.x.toFixed(1) + ',' + f.y.toFixed(1));
      }
      const me = o.find(e => e.id === 'p:dudu'); if (!me) continue;
      const cx = (me.x0 + me.x1) / 2, cy = (me.y0 + me.y1) / 2;
      for (const e of st) {
        if (!ov(me.b, e.b)) continue;
        let want = 0;
        if (e.x1 - e.x0 <= 0.06 && cy > e.y0 && cy < e.y1) want = cx >= e.x1 - 1e-3 ? 1 : -1;          // perete pe y
        else if (e.y1 - e.y0 <= 0.06 && cx > e.x0 && cx < e.x1) want = cy >= e.y1 - 1e-3 ? 1 : -1;     // perete pe x
        else {
          const F = me.y0 >= e.y1 - 1e-6 || me.x0 >= e.x1 - 1e-6, B = me.y1 <= e.y0 + 1e-6 || me.x1 <= e.x0 + 1e-6;
          if (F && !B) want = 1; else if (B && !F) want = -1;                                      // pe diagonala: oricum nu se acopera
        }
        if (!want) continue;
        const got = idx.get('p:dudu') > idx.get(e.id) ? 1 : -1;
        if (got !== want && wrong.length < 15) wrong.push(`${e.id} (${want > 0 ? 'Dudu trebuia in fata' : 'Dudu trebuia in spate'}) @${f.x.toFixed(1)},${f.y.toFixed(1)}`);
      }
    }
    ok(`cap ${chap}: ${frames.length} pozitii, ordinea mobilei si a peretilor nu se schimba`, !flick.length, flick.join(' | '));
    ok(`cap ${chap}: Dudu e mereu de partea buna a peretilor si a mobilei`, !wrong.length, wrong.join(' | '));
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
