// Audit al lumii: suprapuneri, decor pe drum / in apa, lucruri ascunse in spatele copacilor, locuri unde nu se ajunge
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 900, height: 500 } })).newPage();
  for (let i = 0; i < 30; i++) { try { await p.goto('http://localhost:5173/?skipload&who=dudu&mode=solo&room=wa' + Date.now() + '#world'); break; } catch { await sleep(1000); } }
  await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
  await p.evaluate(() => { const s = game.scene; for (let i = 0; i < 8; i++) s.devSkipChapter(); for (const k of ['florarie', 'workshop', 'bike', 'scooter', 'shopBuilt', 'shopLot', 'truck']) s.op({ k: 'stat', key: k, delta: 1 }); for (const k of ['hens', 'cows', 'sheep', 'hives']) s.op({ k: 'stat', key: k, delta: 4 }); s.op({ k: 'furn', key: 'roofBroken', value: true }); s.syncPlaced(); });
  await sleep(1500);
  const r = await p.evaluate(async () => {
    const s = game.scene, M = await import('/src/world/map.ts'), out = { overlap: [], onRoad: [], inWater: [], hidden: [], unreachable: [], n: 0 };
    const F = s.furnList; out.n = F.length;
    const TALL = new Set(['oak', 'pine', 'tree', 'building', 'cbuilding', 'farmhouse', 'church', 'barn', 'windmill', 'sawmill', 'cowshed', 'coop', 'ferris', 'lamppost']);
    const DECOR_OK_ON_ROAD = new Set(['roadsign', 'busstop', 'taxistand', 'trafficlight', 'bridgerail', 'bridgegap', 'roadblock', 'forestgate', 'parkedbike', 'parkedscooter', 'tractor', 'signpost', 'lamppost', 'stalls', 'fountain', 'noticeboard', 'bench', 'flowers', 'pot', 'icecart', 'fairstand', 'towerdoor', 'cfountain']);
    const world = F.filter(f => f.gx > -30 && f.gx < 260 && f.gy > -50 && f.gy < 75 && !(f.gx >= 0 && f.gx < 22 && f.gy >= 0 && f.gy < 27 && !['logpile', 'parkedbike', 'parkedscooter'].includes(f.type)));
    // 1) solide suprapuse (index pe dale)
    const grid = new Map();
    for (const f of world) { if (!f.solid) continue; for (let x = Math.floor(f.gx); x < Math.ceil(f.gx + f.w - 0.01); x++) for (let y = Math.floor(f.gy); y < Math.ceil(f.gy + f.d - 0.01); y++) { const k = x + ',' + y; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(f); } }
    const seen = new Set();
    for (const list of grid.values()) if (list.length > 1) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { const a = list[i], c = list[j]; const ix = Math.min(a.gx + a.w, c.gx + c.w) - Math.max(a.gx, c.gx), iy = Math.min(a.gy + a.d, c.gy + c.d) - Math.max(a.gy, c.gy); if (ix > 0.08 && iy > 0.08) { const key = [a.id, c.id].sort().join(' × '); if (!seen.has(key)) { seen.add(key); out.overlap.push(`${key} @${Math.round(a.gx)},${Math.round(a.gy)}`); } } }
    // 2) decor pe drum / in apa
    for (const f of world) { const t = f.type; const fl = M.floorAt(Math.floor(f.gx + f.w / 2), Math.floor(f.gy + f.d / 2));
      if ((fl === 'road' || fl === 'asphalt') && !DECOR_OK_ON_ROAD.has(t) && !/^(c-|cd-|v-)/.test(f.id)) out.onRoad.push(`${f.id} (${t}) @${Math.round(f.gx)},${Math.round(f.gy)}`);
      if (fl === 'water' && !['lilypad', 'ducks', 'bridgerail', 'bridgegap', 'pier', 'reeds'].includes(t)) out.inWater.push(`${f.id} (${t}) @${Math.round(f.gx)},${Math.round(f.gy)}`); }
    // 3) lucruri cu actiune ascunse de ceva inalt pus chiar in fata lor (pe ecran: x+y mai mare, aproape)
    for (const f of world) { if (!f.action?.id) continue; const cx = f.gx + f.w / 2, cy = f.gy + f.d / 2;
      for (const o of world) { if (o === f || !TALL.has(o.type) || o.type === 'lamppost') continue; const ox = o.gx + o.w / 2, oy = o.gy + o.d / 2; const sx = (ox - oy) - (cx - cy), depth = (ox + oy) - (cx + cy);
        const tallTarget = ['building', 'cbuilding', 'farmhouse', 'church', 'sawmill', 'cowshed', 'ferris'].includes(f.type);
        if (depth > 0.6 && depth < (tallTarget ? 3 : 2.6) && Math.abs(sx) < (tallTarget ? 0.8 : 1.2) + o.w * 0.3 && !tallTarget) { out.hidden.push(`${f.id} (${f.action.label}) ascuns de ${o.id} (${o.type})`); break; } } }
    // 4) se ajunge pe jos?
    const from = { x: 6.5, y: 24.6 };
    for (const f of world) { if (!f.action?.id || f.id.startsWith('w-sign')) continue; if (Math.hypot(f.gx - from.x, f.gy - from.y) > 400) continue; const spot = s.nav.standSpot(f.gx, f.gy, f.w, f.d, from.x, from.y); const path = spot && s.nav.path(from.x, from.y, spot.x, spot.y, 400000); if (!spot || !path) out.unreachable.push(`${f.id} (${f.action.label}) @${Math.round(f.gx)},${Math.round(f.gy)}`); }
    return out;
  });
  console.log(`${r.n} obiecte`);
  for (const k of ['overlap', 'onRoad', 'inWater', 'hidden', 'unreachable']) console.log(`\n## ${k}: ${r[k].length}\n` + r[k].slice(0, 40).join('\n'));
  await b.close();
})();
