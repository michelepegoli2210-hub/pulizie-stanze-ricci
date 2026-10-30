// ============================================================================
//  SERVICE WORKER  ·  fa funzionare l'app anche senza rete e la tiene in Home
//  Quando si pubblica una versione nuova bisogna cambiare il numero qui sotto:
//  così i telefoni si accorgono dell'aggiornamento.
// ============================================================================
const VERSIONE = "1.17.0";
const CACHE = "ricci-pulizie-" + VERSIONE;
const FILE_BASE = [
  "./", "./index.html", "./style.css", "./app.js", "./db.js", "./logica.js", "./regole.js",
  "./excel.js", "./dettatura.js", "./governante.js", "./chat.js", "./parole.js", "./ia.js", "./voce.js", "./gesti.js", "./catalogo.js", "./firebase-config.js", "./firebase-bundle.js", "./manifest.json", "./sfondo-laguna.svg", "./sfondo-manutenzione.svg", "./sfondo-bolle.svg",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./cons-parla.mp4", "./cons-riposo.mp4", "./cons-film.json", "./cons-poster.webp", "./cons-poster-3d2.webp", "./cons-fondo-3d.webp", "./avorio-parete.webp", "./cornice-noce.webp", "./fonts/atkinson-hyperlegible-next-latin-400-normal.woff2", "./fonts/atkinson-hyperlegible-next-latin-600-normal.woff2", "./fonts/atkinson-hyperlegible-next-latin-800-normal.woff2",
  "./bocca.js", "./viso.js", "./cons-base.webp", "./cons-indica.webp", "./cons-cuore.webp", "./cons-pollice.webp", "./cons-osx.webp", "./cons-odx.webp", "./cons-osu.webp", "./cons-scena.webp", "./cons-saluto.webp", "./cons-riposo.webp", "./cons-b1.webp", "./cons-b2.webp", "./cons-b3.webp", "./cons-occhi.webp", "./cons-felice.webp", "./cons-testa.webp", "./cons-testa-occhi.webp",
  "./marmo-blu.webp", "./marmo-avorio.webp", "./marmo-biglia.webp", "./fonts/dancing-script-latin-700-normal.woff2", "./fonts/cormorant-garamond-latin-600-normal.woff2", "./fonts/cormorant-garamond-latin-700-normal.woff2", "./fonts/cormorant-garamond-latin-600-italic.woff2", "./fonts/plus-jakarta-sans-latin-600-normal.woff2", "./fonts/plus-jakarta-sans-latin-700-normal.woff2",
  "./fonts/montserrat-latin-500-normal.woff2", "./fonts/montserrat-latin-600-normal.woff2", "./fonts/montserrat-latin-700-normal.woff2", "./fonts/montserrat-latin-800-normal.woff2",
  "./legno-oro-parete.webp", "./cornice-legno.webp", "./radica.webp", "./legno-oro.webp", "./fascia-mogano.webp", "./fonts/playfair-display-latin-600-normal.woff2", "./fonts/playfair-display-latin-400-italic.woff2",
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

// 0.99: la notifica di Sofia ("ha letto le chat"): toccandola si apre l'app sull'anteprima da controllare
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./index.html", self.registration.scope).href;
  e.waitUntil((async () => {
    const finestre = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of finestre) { if ("focus" in c) { try { await c.focus(); } catch (err) {} if (!(e.notification.data && e.notification.data.push)) { try { c.postMessage({ tipo: "apriLettura" }); } catch (err) {} } return; } }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});

// 1.17.0 GLI AVVISI DI SOFIA SUL TELEFONO (Web Push): li manda il giro sempre acceso (sofia-giro), qui si mostrano
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { testo: e.data ? e.data.text() : "" }; }
  const titolo = String(d.titolo || "Sofia").slice(0, 80), testo = String(d.testo || "Apri l'app: Sofia ti ha scritto.").slice(0, 1800);
  e.waitUntil(self.registration.showNotification(titolo, { body: testo, icon: "icon-192.png", badge: "icon-192.png", tag: "sofia-" + Date.now(), data: { url: "./index.html", push: true } }));
});

// ---- filmati: cache-first, a pezzi, scaricati per intero una volta sola ----------------------
const VIDEO = /\.(mp4|webm)$/i;
const scaricamenti = new Map();   // url -> Promise, per non scaricare due volte lo stesso filmato in parallelo
async function rispostaVideo(req) {
  const chiave = new URL(req.url); chiave.search = "";
  const cache = await caches.open(CACHE);
  let intera = await cache.match(chiave.href);
  if (!intera) {
    // non c'e' (precache fallito o interrotto): lo scarico TUTTO una volta sola e lo tengo
    try {
      if (!scaricamenti.has(chiave.href)) {
        scaricamenti.set(chiave.href, fetch(new Request(chiave.href, { cache: "reload" })).then(async (r) => {
          if (r && r.status === 200) await cache.put(chiave.href, r.clone());
          return r;
        }).finally(() => scaricamenti.delete(chiave.href)));
      }
      const r = await scaricamenti.get(chiave.href);
      intera = (r && r.status === 200) ? (await cache.match(chiave.href)) || r : null;
      if (!intera) return r || Response.error();
    } catch (err) { return Response.error(); }
  }
  return rispostaIntervallo(req, intera);
}
// Il lettore video chiede "Range: bytes=a-b": si risponde 206 con quel pezzo del file in cache
async function rispostaIntervallo(req, intera) {
  const range = req.headers.get("range");
  if (!range) return intera;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return intera;
  const buf = await intera.arrayBuffer();
  const tot = buf.byteLength;
  let a = m[1] ? Number(m[1]) : 0, b = m[2] ? Number(m[2]) : tot - 1;
  if (!m[1] && m[2]) { a = Math.max(0, tot - Number(m[2])); b = tot - 1; }
  b = Math.min(b, tot - 1);
  if (a >= tot || a > b) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${tot}` } });
  const h = new Headers();
  h.set("Content-Type", intera.headers.get("Content-Type") || "video/mp4");
  h.set("Content-Range", `bytes ${a}-${b}/${tot}`);
  h.set("Content-Length", String(b - a + 1));
  h.set("Accept-Ranges", "bytes");
  return new Response(buf.slice(a, b + 1), { status: 206, statusText: "Partial Content", headers: h });
}

// ---- 0.97: IL PROSPETTO DA WHATSAPP (Condividi -> Pulizie Ricci) --------------------------------
// Il telefono manda qui (POST) quello che si condivide con l'app: un messaggio, una chat esportata (.txt),
// una foto del foglio o il file Excel. Si mette da parte in una cache a se' ("ricci-condivisi") e si apre
// l'app con ?condiviso=1: l'app lo prende, lo legge e lo cancella.
const CONDIVISI = "ricci-condivisi";
async function riceviCondiviso(req) {
  const torna = new URL("./index.html?condiviso=1", self.registration.scope).href;
  try {
    const fd = await req.formData();
    const c = await caches.open(CONDIVISI);
    for (const k of await c.keys()) await c.delete(k);
    const testo = ["titolo", "testo", "link"].map((k) => fd.get(k)).filter((x) => typeof x === "string" && x.trim()).join("\n");
    // 0.99: dalla chat esportata possono arrivare tanti file (il .txt o lo zip, i vocali, le foto). Tengo sempre
    // chat ed Excel, poi i vocali e poi le foto, i più recenti per primi, fino a 300 file e 250 MB; i video no.
    const tipoDi = (f) => {
      const n = String(f.name || "").toLowerCase(), t = String(f.type || "");
      if (/^video\//.test(t) || /\.(mp4|3gp|mov|webm)$/.test(n)) return 9;
      if (/\.(txt|zip|xlsx|xls|xlsm|ods)$/.test(n) || /^text\/|zip|sheet|excel/.test(t)) return 0;
      if (/^audio\//.test(t) || /\.(opus|ogg|m4a|mp3|aac|wav|amr)$/.test(n)) return 1;
      return 2;
    };
    const tutti = fd.getAll("file").filter((f) => f && typeof f === "object" && f.size).map((f, i) => ({ f, i, t: tipoDi(f) })).filter((x) => x.t < 9);
    tutti.sort((a, b) => a.t - b.t || String(b.f.name || "").localeCompare(String(a.f.name || "")) || a.i - b.i);
    const file = []; let peso = 0;
    for (const x of tutti) { if (file.length >= 300) break; if (x.t > 0 && peso + x.f.size > 250e6) continue; file.push(x.f); peso += x.f.size; }
    const info = { quando: Date.now(), testo, file: [] };
    let i = 0;
    for (const f of file) {
      const k = new URL("./condiviso/" + (i++), self.registration.scope).href;
      await c.put(k, new Response(f, { headers: { "Content-Type": f.type || "application/octet-stream" } }));
      info.file.push({ k, nome: f.name || "", tipo: f.type || "", peso: f.size });
    }
    await c.put(new URL("./condiviso/info", self.registration.scope).href, new Response(JSON.stringify(info), { headers: { "Content-Type": "application/json" } }));
  } catch (err) { console.warn("condiviso", err); }
  return Response.redirect(torna, 303);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method === "POST") {
    const u = new URL(req.url);
    if (u.origin === location.origin && u.searchParams.has("condividi")) e.respondWith(riceviCondiviso(req));
    return;
  }
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Firebase e Google: mai in cache, passano diretti
  if (/googleapis\.com|firebaseio\.com|firebase\.com|gstatic\.com\/firebasejs/.test(url.host + url.pathname) && !/fonts\.gstatic/.test(url.host)) return;

  if (url.origin === location.origin) {
    // 0.82: i FILMATI di Sofia hanno una strada a parte (vedi rispostaVideo): si servono dalla cache
    // a pezzi (richieste "Range" del lettore video) e NON si riscaricano dalla rete a ogni giro.
    if (VIDEO.test(url.pathname)) { e.respondWith(rispostaVideo(req)); return; }
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
