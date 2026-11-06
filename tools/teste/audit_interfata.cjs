// Audit vizual al interfetei: fiecare fereastra / meniu, pe mai multe ecrane: iese din ecran? e taiat? se suprapun lucruri? doua deschise deodata?
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const VIEWS = [['tel', 844, 390, true], ['telmic', 667, 375, true], ['tab', 1024, 768, true], ['laptop', 1280, 720, false], ['vertical', 390, 844, true]];
const PANELS = {
  goals: 's.hud.openGoals()', inventar: 's.hud.openInventory()', harta: 's.hud.openMap()', albume: 'S.openAlbums(s)', laptop: "s.hud.openVillage('online')",
  primaria: 'S.openHallMenu(s)', afaceri: 's.hud.openHall()', proiecte: 'S.openProjects(s)', angajati: 'S.openStaff(s)', ferma: 'S.openFarmGate(s)', parcela: "S.openParcel(s, 'parcel-2')",
  magazin: 'S.openShop(s)', contracte: 'S.openContracts(s)', satean: "T.openVillager(s, 'leana')", avizier: 'T.openBoard(s)', banca: 'T.openBank(s)', universitate: 'T.openUni(s)', job: "T.openJob(s, 'post')",
  garderoba: 's.hud.openWardrobe()', borcan: 's.hud.openJar()', bucatarie: 's.hud.openKitchen(() => {})', masa: 's.hud.openTable(() => {})', seminte: "s.hud.openSeeds(['carrot','tulip','rose','tomato','cabbage','potato','sunflower','strawberry'], () => {})", constructii: 's.hud.openBuild?.()',
  croitorie: 's.hud.openClothes?.("sat")', tamplarie: 's.hud.openWorkshop?.()', apartament: 's.hud.openApartment?.()', capitol: 's.hud.showChapter()', raport: "s.hud.showLog(['☀️ Vara, ziua 2','🎂 Ziua lui Bubu: Bubu e sărbătorită! Dudu, fă-i o surpriză (un pupic, o floare)','🧑‍🌾 Maria a udat 6 răzoare și câmpurile','🐄 Ion a strâns 4 ouă, 2 lapte','💰 Salarii −46 lei · câștigat de angajați +60 lei','🐼 Bubu azi: strânge ouăle, mulge vaca, deschide florăria','🐻 Dudu azi: livrează comanda de la cherestea, lucrează parcelele'])",
  alegere: "s.choice('🛒 Supermarketul', 'Cumpărați sau vindeți produsele de la fermă?', [['🛒','Cumpără',()=>{}],['🧺','Vinde produsele de la fermă',()=>{}],['💍','Bijuterii: inelul de logodnă (800 lei)',()=>{}],['✖','Gata',()=>{}]])",
};
(async () => {
  const b = await chromium.launch(); const issues = []; const errs = [];
  for (const [vn, W, H, touch] of VIEWS) {
    const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch })).newPage();
    p.on('pageerror', e => errs.push(`${vn}: ${e.message}`));
    await p.goto('http://localhost:5173/?skipload&who=bubu&mode=solo&room=ua' + vn + Date.now() + '#world'); await p.waitForFunction(() => game.scene?.ready, null, { timeout: 60000 });
    await p.evaluate(async () => { const s = game.scene; window.S = await import('/src/scenes/story.ts'); window.T = await import('/src/ui/townui.ts'); for (let i = 0; i < 8; i++) s.devSkipChapter(); s.setInfinite(true);
      for (const k of ['florarie', 'workshop', 'bike', 'scooter', 'hens', 'cows', 'sheep', 'hives', 'shopBuilt', 'shopLot', 'truck', 'engaged', 'ring']) s.op({ k: 'stat', key: k, delta: 1 }); s.w.minutes = 11 * 60; s.me.gx = 121; s.me.gy = 25; s.syncPlaced(); });
    await sleep(2500);
    const closeAll = () => p.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); game.scene.hud.closeMenus?.(); });
    await closeAll(); await sleep(300);
    // 1) interfata de baza: elementele se suprapun intre ele?
    const base = await p.evaluate(() => {
      const R = (e) => e.getBoundingClientRect(), vis = e => { const cs = getComputedStyle(e); const r = R(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && !e.classList.contains('hidden') && r.width > 2 && r.height > 2; };
      const els = [...document.querySelectorAll('.hud > *')].filter(vis).filter(e => !['toasts', 'modal'].some(c => e.classList.contains(c)));
      const out = []; const vw = innerWidth, vh = innerHeight; const rot = document.documentElement.classList.contains('rot');
      for (const e of els) { const r = R(e); if (!rot && (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1)) out.push(`iese din ecran: .${e.className.split(' ')[0]} ${JSON.stringify([r.left, r.top, r.right, r.bottom].map(Math.round))}`); }
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = R(els[i]), c = R(els[j]); const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); const pair = [els[i].className.split(' ')[0], els[j].className.split(' ')[0]].sort().join('|'); if (pair === 'mapsize|minimap') continue; if (ix > 3 && iy > 3) out.push(`se suprapun: .${els[i].className.split(' ')[0]} × .${els[j].className.split(' ')[0]} (${Math.round(ix)}×${Math.round(iy)})`); }
      return out;
    });
    base.forEach(x => issues.push(`[${vn}] interfață: ${x}`));
    await p.screenshot({ path: `ui_${vn}_baza.png` });
    // 2) fiecare fereastra
    for (const [name, code] of Object.entries(PANELS)) {
      await closeAll(); await sleep(120);
      const err = await p.evaluate((code) => { try { const s = game.scene; eval(code); return null; } catch (e) { return String(e); } }, code);
      if (err) { issues.push(`[${vn}] ${name}: nu se deschide: ${err}`); continue; }
      await sleep(350);
      const r = await p.evaluate(() => {
        const m = document.querySelector('.hud .modal'); if (!m || m.classList.contains('hidden')) return { none: true };
        const box = m.querySelector('.box'); const b = box.getBoundingClientRect(); const out = [];
        const rot = document.documentElement.classList.contains('rot'); const vw = rot ? innerHeight : innerWidth, vh = rot ? innerWidth : innerHeight;
        if (!rot && (b.left < -1 || b.top < -1 || b.right > innerWidth + 1 || b.bottom > innerHeight + 1)) out.push(`fereastra iese din ecran ${JSON.stringify([b.left, b.top, b.right, b.bottom].map(Math.round))}`);
        const cs = getComputedStyle(box); if (box.scrollHeight > box.clientHeight + 2 && !/(auto|scroll)/.test(cs.overflowY)) out.push('conținutul e tăiat jos (fără derulare)');
        if (box.scrollWidth > box.clientWidth + 2) out.push(`conținutul iese în lateral (${box.scrollWidth} > ${box.clientWidth})`);
        // butoane / texte taiate
        if (!rot) for (const e of box.querySelectorAll('button, b, small, h3, h4, li, p, canvas')) { const r = e.getBoundingClientRect(); if (!r.width) continue; if (r.right > b.right + 1 || r.left < b.left - 1) { out.push(`iese din fereastră: <${e.tagName.toLowerCase()}> „${(e.textContent || '').trim().slice(0, 30)}”`); break; } }
        for (const e of box.querySelectorAll('button')) { if (e.scrollWidth > e.clientWidth + 3 && getComputedStyle(e).overflow !== 'visible') { out.push(`text tăiat în buton „${e.textContent.trim().slice(0, 30)}”`); break; } }
        // butoane care se suprapun
        const btns = [...box.querySelectorAll('button')].filter(e => e.getBoundingClientRect().width > 0 && !e.closest('[data-close]') && !e.hasAttribute('data-close'));
        let ov = 0; for (let i = 0; i < btns.length && ov < 2; i++) for (let j = i + 1; j < btns.length; j++) { if (btns[i].contains(btns[j]) || btns[j].contains(btns[i])) continue; const a = btns[i].getBoundingClientRect(), c = btns[j].getBoundingClientRect(); const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (ix > 3 && iy > 3) { out.push(`butoane suprapuse: „${btns[i].textContent.trim().slice(0, 20)}” × „${btns[j].textContent.trim().slice(0, 20)}”`); ov++; break; } }
        // ce e deasupra ferestrei (alt element peste ea)
        for (const [fx, fy] of [[0.5, 0.15], [0.1, 0.5], [0.9, 0.5], [0.5, 0.9]]) { const x = b.left + b.width * fx, y = b.top + b.height * fy; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue; const top = document.elementFromPoint(x, y); if (top && !m.contains(top) && !top.closest('.toasts')) { out.push(`peste fereastră e altceva: .${(top.closest('.hud > *') ?? top).className}`); break; } }
        const pops = [...document.querySelectorAll('.pop')].filter(e => !e.classList.contains('hidden')); if (pops.length) out.push('rămâne deschis și meniul ' + pops.map(x => x.className).join(','));
        return { out, h: Math.round(b.height), sh: box.scrollHeight };
      });
      if (r.none) { issues.push(`[${vn}] ${name}: nu s-a deschis nicio fereastră`); continue; }
      r.out.forEach(x => issues.push(`[${vn}] ${name}: ${x}`));
      if (vn === 'tel' || vn === 'vertical') await p.screenshot({ path: `ui_${vn}_${name}.png` });
    }
    // 3) doua lucruri deodata
    await closeAll(); await sleep(150);
    const two = await p.evaluate(async () => {
      const s = game.scene, out = [], vis = e => e && !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none';
      s.hud.toggleEmotes(); await new Promise(r => setTimeout(r, 150)); s.hud.openGoals(); await new Promise(r => setTimeout(r, 150));
      if (vis(document.querySelector('.pop.emotes')) && vis(document.querySelector('.hud .modal'))) out.push('emote-urile rămân deschise sub/peste fereastra cu obiective');
      document.querySelector('.hud .modal').classList.add('hidden'); s.hud.closeMenus?.();
      s.hud.toggleEmotes(); s.hud.togglePairs(); await new Promise(r => setTimeout(r, 150));
      if (vis(document.querySelector('.pop.emotes')) && vis(document.querySelector('.pop.pairs'))) out.push('emote-urile și „Împreună” deschise deodată');
      s.hud.closeMenus?.();
      // un minijoc deschis + raportul de dimineata
      s.storeMode = ''; s.startCustom('sawmill'); await new Promise(r => setTimeout(r, 300)); s.hud.showLog(['test raport']); await new Promise(r => setTimeout(r, 200));
      if (vis(document.querySelector('.hud .modal'))) out.push('o fereastră se deschide peste un minijoc (cheresteaua)');
      s.minigame?.obj.abort?.(); await new Promise(r => setTimeout(r, 1600)); document.querySelector('.hud .modal').classList.add('hidden');
      // pe bicicleta: bara de drum + fereastra hartii
      const f = s.furnList.find(f => /-bike$/.test(f.id)); if (f) { s.me.gx = f.gx + 0.5; s.me.gy = f.gy + 1; s.boardVehicle('bike', f); await new Promise(r => setTimeout(r, 300));
        const rb = document.querySelector('.ridebar').getBoundingClientRect(); for (const sel of ['.actions', '.minimap', '.card.me', '.goal']) { const e = document.querySelector('.hud ' + sel); if (!vis(e)) continue; const a = e.getBoundingClientRect(); const ix = Math.min(a.right, rb.right) - Math.max(a.left, rb.left), iy = Math.min(a.bottom, rb.bottom) - Math.max(a.top, rb.top); if (ix > 3 && iy > 3) out.push(`bara de drum se suprapune cu ${sel} (${Math.round(ix)}×${Math.round(iy)})`); }
        if (rb.top < 0 || rb.bottom > innerHeight || rb.left < 0 || rb.right > innerWidth) out.push('bara de drum iese din ecran');
        s.hud.openMap(); await new Promise(r => setTimeout(r, 200)); const m = document.querySelector('.hud .modal .box').getBoundingClientRect(); const top = document.elementFromPoint(m.left + m.width / 2, m.bottom - 20); if (top && !top.closest('.modal')) out.push('bara de drum e peste fereastra hărții'); }
      return out;
    });
    two.forEach(x => issues.push(`[${vn}] deodată: ${x}`));
    await p.screenshot({ path: `ui_${vn}_bicicleta_harta.png` });
    await p.close();
  }
  console.log(issues.length ? issues.join('\n') : 'nicio problemă');
  console.log('erori JS:', errs.slice(0, 6).join('\n') || 'niciuna');
  await b.close();
})();
