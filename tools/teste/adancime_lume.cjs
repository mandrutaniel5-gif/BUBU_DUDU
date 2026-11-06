// Ordinea de desen pe TOATA harta (curtea, satul, orasul, padurea, lacul, campia): Dudu e pus pe rand in jurul
// fiecarui obiect solid si verificam ca obiectul e desenat in fata lui doar cand chiar e in fata (si invers).
// In plus: obiecte puse unul peste altul (talpile lor se suprapun pe harta).
const { chromium } = require('playwright');
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=adl' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const res = await p.evaluate(async () => {
    const s = game.scene, w = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 7; i++) s.devSkipChapter();
    await w(1500); document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    s.partner.control = 'remote'; s.partner.gx = -50; s.partner.gy = -50;
    globalThis.__orderLog = 1;
    const cv = document.querySelector('canvas'), c2 = cv.getContext('2d');
    const { iso } = await import('/src/world/iso.ts');
    const solids = s.furnList.filter(f => f.solid && f.w * f.d > 0.05);
    // 1. talpi suprapuse
    const over = [];
    for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
      const a = solids[i], b = solids[j];
      const ix = Math.min(a.gx + a.w, b.gx + b.w) - Math.max(a.gx, b.gx), iy = Math.min(a.gy + a.d, b.gy + b.d) - Math.max(a.gy, b.gy);
      if (ix > 0.05 && iy > 0.05) over.push(`${a.id}(${a.type}) x ${b.id}(${b.type})`);
    }
    // 2. Dudu in jurul fiecarui obiect
    const wrong = new Map(); let n = 0;
    const want = (me, e) => {
      const cx = (me.x0 + me.x1) / 2, cy = (me.y0 + me.y1) / 2;
      if (e.x1 - e.x0 <= 0.06 && cy > e.y0 && cy < e.y1) return cx >= e.x1 - 1e-3 ? 1 : -1;
      if (e.y1 - e.y0 <= 0.06 && cx > e.x0 && cx < e.x1) return cy >= e.y1 - 1e-3 ? 1 : -1;
      const F = me.y0 >= e.y1 - 1e-6 || me.x0 >= e.x1 - 1e-6, B = me.y1 <= e.y0 + 1e-6 || me.x1 <= e.x0 + 1e-6;
      return F && !B ? 1 : B && !F ? -1 : 0;
    };
    for (const f of solids) {
      const pts = [];
      for (const d of [0.35, 0.9]) for (let k = 0; k < 4; k++) {
        const u = (k + 0.5) / 4;
        pts.push([f.gx + f.w * u, f.gy - d], [f.gx + f.w * u, f.gy + f.d + d], [f.gx - d, f.gy + f.d * u], [f.gx + f.w + d, f.gy + f.d * u]);
      }
      for (const [x, y] of pts) {
        if (s.nav.isBlocked(x, y)) continue;
        s.me.gx = x; s.me.gy = y; s.me.path = []; s.me.activity = null; s.me.z = 0;
        const q = iso(x, y, 30); s.cam.x = q.x; s.cam.y = q.y;
        s.draw(c2); n++;
        const me = globalThis.__me, L = globalThis.__front || [];
        if (!me) continue;
        for (const e of L) {
          const wv = want(me, e); if (!wv) continue;
          const got = e.front ? -1 : 1;
          if (got !== wv) { const k = e.id + (wv > 0 ? ' (Dudu trebuia in fata)' : ' (Dudu trebuia in spate)'); if (!wrong.has(k)) wrong.set(k, `${x.toFixed(1)},${y.toFixed(1)}`); }
        }
      }
    }
    return { n, solids: solids.length, over, wrong: [...wrong.entries()].map(([k, v]) => k + ' @' + v) };
  });
  console.log(`${res.solids} obiecte solide, ${res.n} pozitii verificate`);
  ok('niciun obiect pus peste altul', !res.over.length, res.over.length + ': ' + res.over.slice(0, 40).join(' | '));
  ok('Dudu e mereu de partea buna a obiectelor', !res.wrong.length, res.wrong.length + ': ' + res.wrong.slice(0, 60).join(' | '));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
