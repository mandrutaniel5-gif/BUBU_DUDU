// Copia offline a jocului (doar pentru varianta din browser / GitHub Pages).
// In aplicatia instalata (Android: https://localhost) nu o folosim: se sterge singura.
const CACHE = 'bd-v3';
const NATIVE = self.location.hostname === 'localhost' && !self.location.port;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => NATIVE || k !== CACHE).map(k => caches.delete(k)));
  if (NATIVE) { await self.registration.unregister(); const cl = await self.clients.matchAll(); cl.forEach(c => c.navigate(c.url)); return; }
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  if (NATIVE) return; // nu interceptam nimic in aplicatie
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || (u.origin !== location.origin && !u.host.includes('fonts.g'))) return;
  // mereu intai de pe internet (versiunea noua); din copie doar cand esti offline
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(cc => cc.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
