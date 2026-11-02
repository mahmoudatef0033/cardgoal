/* CardGoooooooal service worker: the internet first (so a new version always wins), the saved copy only when there is no internet */
const V = 'cg-sw-1';
const CORE = ['./beta.html', './manifest.json', './icon-192.png', './icon-512.png'];
const keyOf = u => { const x = new URL(u, self.location); return x.origin + x.pathname; };
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(p => fetch(p, {cache: 'reload'}).then(r => (r.ok ? c.put(keyOf(p), r) : null)).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin || r.headers.has('range')) return;   /* other sites (Firebase, fonts) and partial requests go straight to the network */
  if (/\/(admin|index)\.html$/.test(u.pathname)) return;                                           /* the owner's page and the old version are never kept */
  e.respondWith(
    fetch(r, {cache: 'no-cache'}).then(res => {
      if (res && res.status === 200 && res.type === 'basic') { const cp = res.clone(); caches.open(V).then(c => c.put(keyOf(r.url), cp)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(keyOf(r.url)).then(m => m || (r.mode === 'navigate' ? caches.match(keyOf('./beta.html')) : Response.error())))
  );
});
