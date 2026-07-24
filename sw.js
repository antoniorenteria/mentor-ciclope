/* El Mentor Cíclope — service worker
   Caché primero + revalidación en segundo plano (misma receta que el
   Ojo Maestro v1.4: abrir la app no debe esperar a la red del local). */
const CACHE = 'mentor-ciclope-v1';
const ARCHIVOS = ['./', './index.html', './app.js', './contenido.js', './assets.js',
  './manifest.json', './img/icono.png', './img/icono-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;   // nunca cachear el backend
  e.respondWith(
    caches.match(e.request).then(hit => {
      const red = fetch(e.request).then(r => {
        if (r && r.status === 200) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => hit);
      return hit || red;
    })
  );
});
