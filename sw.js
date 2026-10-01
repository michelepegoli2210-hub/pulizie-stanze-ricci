// ============================================================================
//  SERVICE WORKER  ·  fa funzionare l'app anche senza rete e la tiene in Home
//  Quando si pubblica una versione nuova bisogna cambiare il numero qui sotto:
//  così i telefoni si accorgono dell'aggiornamento.
// ============================================================================
const VERSIONE = "0.2.1";
const CACHE = "ricci-pulizie-" + VERSIONE;
const FILE_BASE = [
  "./", "./index.html", "./style.css", "./app.js", "./db.js", "./logica.js", "./regole.js",
  "./excel.js", "./firebase-config.js", "./firebase-bundle.js", "./manifest.json",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE_BASE.map((u) => new Request(u, { cache: "reload" })))).catch((err) => console.warn("precache", err)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const chiavi = await caches.keys();
    await Promise.all(chiavi.filter((k) => k.startsWith("ricci-pulizie-") && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (e) => { if (e.data?.tipo === "attiva") self.skipWaiting(); });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Firebase e Google: mai in cache, passano diretti
  if (/googleapis\.com|firebaseio\.com|firebase\.com|gstatic\.com\/firebasejs/.test(url.host + url.pathname) && !/fonts\.gstatic/.test(url.host)) return;

  if (url.origin === location.origin) {
    // File dell'app: prima la cache (veloce e offline), poi la rete; la rete aggiorna la cache
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const inCache = await cache.match(req, { ignoreSearch: true });
      const dallaRete = fetch(req).then((r) => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
      if (inCache) { dallaRete.catch(() => {}); return inCache; }
      const r = await dallaRete;
      if (r) return r;
      if (req.mode === "navigate") return (await cache.match("./index.html")) || Response.error();
      return Response.error();
    })());
    return;
  }
  // Caratteri e altre cose esterne: cache con aggiornamento in sottofondo
  e.respondWith((async () => {
    const cache = await caches.open(CACHE + "-esterni");
    const inCache = await cache.match(req);
    const dallaRete = fetch(req).then((r) => { if (r && (r.ok || r.type === "opaque")) cache.put(req, r.clone()); return r; }).catch(() => null);
    return inCache || (await dallaRete) || Response.error();
  })());
});
