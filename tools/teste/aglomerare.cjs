// Obiecte puse prea aproape: desenam fiecare obiect singur si masuram cat din obiectul din spate e acoperit
// de cel din fata (pixel cu pixel). Peste prag = „intra unul in altul” (copac peste fantana, piatra prin coroana etc.).
const { chromium } = require('playwright');
const ok = (n, c, x = '') => console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (x ? '  ' + x : ''));
const PRAG = +(process.argv[2] ?? 0.22);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:5173/?skipload&dev&who=dudu&mode=solo&room=agl' + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  const res = await p.evaluate(async (PRAG) => {
    const s = game.scene; for (let i = 0; i < 7; i++) s.devSkipChapter();
    await new Promise(r => setTimeout(r, 1500));
    const { drawFurn } = await import('/src/world/furniture.ts');
    const { screenBox } = await import('/src/world/cull.ts');
    const FLAT = new Set(['flowers', 'wildflower', 'lilypad', 'bridgegap', 'stonepath', 'heartstone', 'flowerbed', 'rug', 'doormat', 'soilplot', 'plot', 'road', 'cropfield', 'pier']);
    const list = s.furnList.filter(f => !FLAT.has(f.type) && (f.solid || ['bush', 'rock', 'tree', 'pine', 'oak'].includes(f.type)) && f.w * f.d <= 9);
    const st = { ...s.w.furn, night: 0, depleted: {} };
    const masks = new Map();
    const mask = f => {
      if (masks.has(f.id)) return masks.get(f.id);
      const bx = screenBox(f), W = Math.ceil(bx.x1 - bx.x0), H = Math.ceil(bx.y1 - bx.y0);
      const cv = new OffscreenCanvas(Math.max(1, W), Math.max(1, H)), c = cv.getContext('2d');
      c.translate(-bx.x0, -bx.y0); try { drawFurn(c, f, 0, st); } catch { }
      const d = c.getImageData(0, 0, cv.width, cv.height).data, a = new Uint8Array(cv.width * cv.height); let n = 0;
      for (let i = 0; i < a.length; i++) if (d[i * 4 + 3] > 100) { a[i] = 1; n++; }
      const m = { x0: Math.floor(bx.x0), y0: Math.floor(bx.y0), w: cv.width, h: cv.height, a, n }; masks.set(f.id, m); return m;
    };
    const out = [];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const A = list[i], B = list[j];
      if (Math.abs(A.gx - B.gx) > 3.5 || Math.abs(A.gy - B.gy) > 3.5) continue;
      // cine e in spate: suma centrului mai mica
      const ca = A.gx + A.w / 2 + A.gy + A.d / 2, cb = B.gx + B.w / 2 + B.gy + B.d / 2;
      const back = ca <= cb ? A : B, front = back === A ? B : A;
      const mb = mask(back), mf = mask(front); if (!mb.n) continue;
      const x0 = Math.max(mb.x0, mf.x0), x1 = Math.min(mb.x0 + mb.w, mf.x0 + mf.w), y0 = Math.max(mb.y0, mf.y0), y1 = Math.min(mb.y0 + mb.h, mf.y0 + mf.h);
      if (x1 <= x0 || y1 <= y0) continue;
      let cov = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (mb.a[(y - mb.y0) * mb.w + (x - mb.x0)] && mf.a[(y - mf.y0) * mf.w + (x - mf.x0)]) cov++;
      const T = new Set(['tree', 'oak', 'pine']), forest = T.has(back.type) && T.has(front.type);
      const k = cov / mb.n; if (k >= PRAG) out.push({ k: +k.toFixed(2), forest, back: `${back.id}(${back.type}@${back.gx},${back.gy})`, front: `${front.id}(${front.type}@${front.gx},${front.gy})` });
    }
    out.sort((a, b) => b.k - a.k);
    return { n: list.length, out };
  }, PRAG);
  console.log(`${res.n} obiecte; ${res.out.length} perechi peste ${PRAG * 100}% acoperire`);
  const bad = res.out.filter(o => !o.forest), trees = res.out.filter(o => o.forest);
  for (const o of bad) console.log(`  ${Math.round(o.k * 100)}%  ${o.back}  acoperit de  ${o.front}`);
  // copaci care se ating in padure sunt firesti; doar cei ascunsi aproape de tot (peste 75%) nu au ce cauta
  ok(`niciun obiect (piatra, banca, felinar, fantana...) acoperit peste ${PRAG * 100}% de altul`, bad.every(o => o.k < 0.32), bad.filter(o => o.k >= 0.32).map(o => o.back).join(' | '));
  ok('in padure niciun copac ascuns aproape de tot dupa altul', trees.every(o => o.k < 0.75), trees.filter(o => o.k >= 0.75).length + ' copaci');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
