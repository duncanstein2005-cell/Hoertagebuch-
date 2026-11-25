/* Service Worker – Hörtagebuch. Bei Änderungen an index.html die Versionsnummer erhöhen. */
const CACHE = "hoertagebuch-v1";
const SHELL = ["./", "index.html", "manifest.json", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Datenbank, iTunes-Suche und alles Fremde (außer der Supabase-Bibliothek vom CDN) nie anfassen
  if (url.origin !== self.location.origin && url.hostname !== "cdn.jsdelivr.net") return;

  // Seiten: erst Netz (immer aktuell), sonst Cache (offline)
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put("index.html", c)); return res; })
        .catch(() => caches.match("index.html").then(r => r || caches.match("./")))
    );
    return;
  }
  // Statisches: aus dem Cache, im Hintergrund auffrischen
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === "opaque")) { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
