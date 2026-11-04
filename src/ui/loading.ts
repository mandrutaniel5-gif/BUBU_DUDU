// Ecranul de incarcare: logo-ul ACM / Code, apoi pregatim tot ce trebuie jocului.
import logoUrl from '../assets/acm-logo.png';
import { preloadIcons } from './icons';
import { drawCharacter, SPECS, NPC_SPECS } from '../char/draw';
import { basePose } from '../char/pose';
import { Sfx } from '../engine/sfx';

export async function showLoading(): Promise<void> {
  const el = document.createElement('div');
  el.className = 'loading';
  el.innerHTML = `<div class="ld-in"><img class="ld-logo" src="${logoUrl}" alt="ACM / Code"><div class="ld-bar"><i></i></div><div class="ld-txt">Se încarcă…</div></div>`;
  (document.getElementById('stage') ?? document.body).appendChild(el);
  const bar = el.querySelector('.ld-bar i') as HTMLElement, txt = el.querySelector('.ld-txt') as HTMLElement;
  let shown = 0;
  const set = (k: number, t?: string) => { shown = Math.max(shown, k); bar.style.width = Math.round(shown * 100) + '%'; if (t) txt.textContent = t; };
  const tick = () => new Promise(r => requestAnimationFrame(() => r(null)));
  const t0 = performance.now();
  await new Promise<void>(r => { const img = el.querySelector('img')!; if (img.complete) r(); else { img.onload = () => r(); img.onerror = () => r(); } });

  set(0.08, 'Încărcăm fonturile…');
  try { await Promise.race([Promise.all([document.fonts.load('800 20px "Baloo 2"'), document.fonts.load('700 14px "Baloo 2"'), document.fonts.load('500 14px "Baloo 2"')]), new Promise(r => setTimeout(r, 2500))]); } catch { /* offline: font de rezerva */ }

  set(0.3, 'Desenăm iconițele…'); await tick();
  preloadIcons(k => set(0.3 + k * 0.3));

  set(0.62, 'Îi trezim pe Bubu și Dudu…'); await tick();
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d')!;
  const specs = [SPECS.bubu, SPECS.dudu, ...Object.values(NPC_SPECS)];
  for (let i = 0; i < specs.length; i++) { c.clearRect(0, 0, 256, 256); drawCharacter(c, specs[i], basePose(), 128, 220, 1, 1, 0); set(0.62 + (i + 1) / specs.length * 0.28); if (i % 2) await tick(); }

  set(0.9, 'Pregătim sunetele…'); await tick();
  // sunetele se decodeaza in paralel; asteptam cel mult 4 s (pe telefoane lente continua in fundal)
  try { await Promise.race([Sfx.load(k => set(0.9 + k * 0.05)), new Promise(r => setTimeout(r, 4000))]); } catch { /* fara sunet */ }

  set(0.95, 'Deschidem căsuța…');
  const min = 1800; const left = min - (performance.now() - t0); if (left > 0) { const steps = 10; for (let i = 0; i < steps; i++) { await new Promise(r => setTimeout(r, left / steps)); set(0.95 + (i + 1) / steps * 0.05); } }
  set(1, 'Gata! 💕');
  await new Promise(r => setTimeout(r, 250));
  el.classList.add('out');
  setTimeout(() => el.remove(), 600);
}
