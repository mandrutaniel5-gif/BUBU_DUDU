// Verificarile automate pentru testeri (1.12.1): cat timp e pornit modul tester, la fiecare 3 secunde jocul se uita singur
// dupa ce s-a desenat sau s-a asezat gresit si face un raport (cu poza) — o singura data pentru fiecare problema.
import type { WorldScene } from '../scenes/world';
import { FURNITURE, type Furn } from '../world/map';
import { Bugs } from './bugs';

const strikes = new Map<string, number>();
/** problema trebuie sa se vada de n ori la rand (nu raportam o clipa de tranzitie) */
const again = (k: string, bad: boolean, n = 2) => { const v = bad ? (strikes.get(k) ?? 0) + 1 : 0; strikes.set(k, v); return v === n; };
let lastFurnKey = '';
const fin = (v: number) => Number.isFinite(v);

export function autoCheck(s: WorldScene, fps: number) {
  if (!Bugs.on()) return;
  const where = `${s.area} (${s.me.gx.toFixed(1)}, ${s.me.gy.toFixed(1)})`;
  const busy = !!s.minigame || !!s.travel || !!s.ride;
  // 1) pozitii stricate (NaN / infinit): personajul dispare sau ramane intr-un loc imposibil
  for (const p of [s.me, s.partner]) if (!fin(p.gx) || !fin(p.gy)) Bugs.add({ kind: 'auto', cat: 'Generat greșit', title: `Poziție stricată pentru ${p.actor.spec.name}: ${p.gx}, ${p.gy}` });
  for (const v of s.walkers) if (!fin(v.x) || !fin(v.y)) Bugs.add({ kind: 'auto', cat: 'Generat greșit', title: `Poziție stricată pentru ${v.name ?? 'un trecător'} (${v.role ?? v.vid ?? ''})` });
  // 2) personajul tau / partenerul AI / angajatii: in picioare in interiorul unui obiect (perete, mobila, copac)
  if (!busy) {
    for (const p of [s.me, s.partner]) {
      if (p.control === 'remote' || p.activity || p.riding || p.passenger || (p === s.partner && !s.sameArea())) continue;
      if (again('stuck-' + p.id, s.nav.hits(p.gx, p.gy, 0.12), 2)) Bugs.add({ kind: 'auto', cat: 'Prin obiecte', title: `${p.actor.spec.name} stă în interiorul unui obiect · ${s.area}`, key: `stuck-${p.id}-${Math.round(p.gx)},${Math.round(p.gy)}` });
    }
    if (s.space === 'world') for (const v of s.walkers) {
      if (v.off || v.tractor || Math.hypot(v.x - s.me.gx, v.y - s.me.gy) > 18) continue;
      if (again('w-' + (v.eid ?? v.vid ?? v.name), s.nav.hits(v.x, v.y, 0.1), 3)) Bugs.add({ kind: 'auto', cat: 'Prin obiecte', title: `${v.name ?? 'Un sătean'}${v.role ? ' (' + v.role + ')' : ''} stă în interiorul unui obiect`, key: `wstuck-${v.eid ?? v.vid}-${Math.round(v.x)},${Math.round(v.y)}` });
    }
  }
  // 3) obiecte solide puse unul peste altul (in jurul tau), verificate cand se schimba harta
  const fk = `${s.space}|${s.placedVersion}|${Math.round(s.me.gx / 12)},${Math.round(s.me.gy / 12)}`;
  if (fk !== lastFurnKey) {
    lastFurnKey = fk;
    const near = FURNITURE.filter(f => f.solid && Math.hypot(f.gx - s.me.gx, f.gy - s.me.gy) < 22);
    const over = (a: Furn, b: Furn) => Math.min(a.gx + a.w, b.gx + b.w) - Math.max(a.gx, b.gx) > 0.15 && Math.min(a.gy + a.d, b.gy + b.d) - Math.max(a.gy, b.gy) > 0.15;
    for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++) {
      const a = near[i], b = near[j]; if (a.id === b.id || !over(a, b)) continue;
      Bugs.add({ kind: 'auto', cat: 'Se suprapun', title: `Obiecte puse unul peste altul: ${a.type} (${a.id}) și ${b.type} (${b.id}) la ${a.gx},${a.gy}`, key: `over-${[a.id, b.id].sort().join('+')}` });
    }
  }
  // 4) interfata: ferestre iesite din ecran, texte taiate, bucati din bara de sus suprapuse
  const W = innerWidth, H = innerHeight, vis = (e: Element) => { const r = (e as HTMLElement).getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(e).visibility !== 'hidden' ? r : null; };
  const box = document.querySelector('#ui .modal:not(.hidden) .box');
  if (box) { const r = vis(box); if (r && (r.left < -2 || r.top < -2 || r.right > W + 2 || r.bottom > H + 2)) { const t = box.querySelector('h3')?.textContent ?? ''; if (again('modal-' + t, true, 2)) Bugs.add({ kind: 'auto', cat: 'Interfață', title: `Fereastra „${t.trim()}” iese din ecran`, key: 'modal-out-' + t }); } }
  for (const b of Array.from(document.querySelectorAll('#ui button, #ui .gtxt, #ui .name'))) {
    const el = b as HTMLElement; const r = vis(el); if (!r) continue;
    if (el.scrollWidth > el.clientWidth + 4 && getComputedStyle(el).overflow !== 'visible' && el.textContent?.trim()) {
      const t = el.textContent.trim().slice(0, 50); if (again('cut-' + t, true, 2)) Bugs.add({ kind: 'auto', cat: 'Text tăiat', title: `Text tăiat: „${t}”`, key: 'cut-' + t });
    }
  }
  if (!box && !busy) {
    const parts = ['.card.me', '.clock', '.goal', '.card.partner', '.minimap', '.actions'].map(q => [q, document.querySelector('#ui ' + q)] as const).filter(([, e]) => e && vis(e)) as [string, Element][];
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i][1].getBoundingClientRect(), b = parts[j][1].getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 6 && oy > 6 && again(`hud-${parts[i][0]}-${parts[j][0]}`, true, 2)) Bugs.add({ kind: 'auto', cat: 'Se suprapun', title: `Interfața: ${parts[i][0]} acoperă ${parts[j][0]} (${Math.round(ox)}×${Math.round(oy)} px, ecran ${W}×${H})`, key: `hud-${parts[i][0]}-${parts[j][0]}-${W}x${H}` });
    }
  }
  // 5) jocul merge sacadat (mai putin de 15 cadre pe secunda, de 3 ori la rand)
  if (again('fps-' + s.area, fps < 15, 3)) Bugs.add({ kind: 'auto', cat: 'Viteză', title: `Jocul merge greu: ${fps.toFixed(0)} cadre/s în ${where}`, key: 'fps-' + s.area });
}
