// ============================================================================
//  SERVICE WORKER  ·  fa funzionare l'app anche senza rete e la tiene in Home
//  Quando si pubblica una versione nuova bisogna cambiare il numero qui sotto:
//  così i telefoni si accorgono dell'aggiornamento.
// ============================================================================
const VERSIONE = "1.101.0";
const CACHE = "ricci-pulizie-" + VERSIONE;
// 1.43.0: I FILMATI STANNO IN UNA CACHE A PARTE CHE RESTA DA UNA VERSIONE ALL'ALTRA (prima ogni aggiornamento li
// riscaricava tutti: 16 MB a telefono a ogni versione). Si scaricano la prima volta che servono (la strada dei filmati)
// e restano; quando un filmato cambia gli si cambia nome. FILMATI = quelli che l'app usa: gli altri si tolgono.
const CACHE_FILM = "ricci-filmati-1";
const FILMATI = ["./jv-lei-saluto-3d.webm", "./jv-lei-saluto-alfa.mp4", "./cons-parla-spilla-giro5.mp4", "./cons-riposo-spilla-giro6.mp4", "./cons-parla-spilla-giro5-3d.webm", "./cons-riposo-spilla-giro6-3d.webm", "./cons-parla-intero.mp4", "./cons-riposo-calmo.mp4", "./capo-parla.mp4", "./capo-riposo.mp4", "./capo-parla-3d.webm", "./capo-riposo-3d.webm", "./segr7-riposo-3d.webm", "./segr7-ascolta-3d.webm", "./segr7-parla-3d.webm", "./sofia-influencer.mp4", "./sofia-influencer-ferma.mp4", "./cons-parla-intero-3d.webm", "./cons-riposo-calmo-3d.webm", "./cons-parla-spilla-giro5-alfa.mp4", "./cons-riposo-spilla-giro6-alfa.mp4", "./cons-parla-intero-alfa.mp4", "./cons-riposo-calmo-alfa.mp4", "./capo-parla-alfa.mp4", "./capo-riposo-alfa.mp4", "./segr7-riposo-alfa.mp4", "./segr7-ascolta-alfa.mp4", "./segr7-parla-alfa.mp4"];   // 1.84.0: i gemelli per l'iPhone (si scaricano solo dove servono) · 1.90.0: i filmati con la spilla senza scatti (-fluido) · 1.91.0: il saluto, e senza i passaggi «da robot» (-giro) · 1.91.1: via lo sguardo di lato avanti e indietro e i fotogrammi fermi (-giro2) · 1.91.2: la spilla d'oro anche nel video del bacio (ferma: -giro3) · 1.92.0: Sofia segretaria col rosa (segr6) · 1.93.0: da ferma solo video che partono e finiscono nella posa della foto (ferma: -giro4) · 1.94.0: Sofia segretaria coi tre video veri (segr7); la Sofia di casa compressa senza il fotogramma chiave ogni due secondi (-giro5) · 1.95.0: da ferma il ritaglio senza i buchi sbagliati (-giro6) · 1.101.0: il saluto di Jarvis con lei (jv-lei-)
const FILE_BASE = [
  "./", "./index.html", "./style.css", "./app.js", "./db.js", "./logica.js", "./regole.js",
  "./excel.js", "./dettatura.js", "./governante.js", "./chat.js", "./parole.js", "./ia.js", "./lettura.js", "./voce.js", "./gesti.js", "./catalogo.js", "./firebase-config.js", "./firebase-bundle.js", "./manifest.json", "./sfondo-laguna.svg", "./sfondo-manutenzione.svg", "./sfondo-bolle.svg",
  "./icona-casa-192.png", "./icona-casa-512.png", "./notifica-arrivi.png", "./notifica-casa.png", "./notifica-dafare.png", "./notifica-email.png", "./notifica-foglio.png", "./notifica-lettura.png", "./notifica-messaggio.png", "./notifica-prenotazione.png", "./notifica-pulizie.png", "./notifica-sera.png", "./notifica-sintesi.png", "./notifica-social.png", "./notifica-sveglia.png", "./notifica-urgente.png",   // 1.98.0: le icone delle notifiche
  "./jv-ico-oggi.webp", "./jv-ico-impegni.webp", "./jv-ico-obiettivi.webp", "./jv-ico-idee.webp", "./jv-ico-traguardi.webp", "./jv-ico-piano.webp", "./jv-ico-sveglia.webp", "./jv-ico-mic.webp", "./jv-lei-3d.webp", "./jv-lei-viso.webp",   // 1.99.0: Jarvis con Sofia personal trainer · 1.101.0: con lei (giacca blu e tablet)
  "./icona-casa-maskable-512.png", "./apple-touch-icon.png", "./badge-casa-96.png", "./cons-poster-intero.webp", "./cons-poster-intero-3d.webp", "./cons-poster-foto.webp", "./cons-poster-foto-3d.webp", "./cons-poster.webp", "./capo-poster.webp", "./capo-viso.webp", "./capo-poster-3d.webp", "./sfondo-pulizie-wa2.webp", "./fonts/roboto-latin-400-normal.woff2", "./fonts/roboto-latin-500-normal.woff2", "./fonts/roboto-latin-700-normal.woff2", "./stanza-governante.webp", "./mappa-corridoio-m.webp", "./mappa-scale-m.webp", "./mappa-ingresso-m.webp", "./mappa-terrazzo-m.webp", "./mappa-lavanderia-m.webp", "./mappa-balcone-m.webp", "./disegno-salvatore-1-m.webp", "./disegno-salvatore-2-m.webp", "./disegno-salvatore-cucina-m.webp", "./disegno-salvatore-tavolo-m.webp", "./disegno-salvatore-armadio-m.webp", "./disegno-salvatore-ingresso-m.webp", "./disegno-salvatore-letto-m.webp", "./disegno-salvatore-balcone-m.webp", "./disegno-salvatore-bagno-1-m.webp", "./disegno-salvatore-bagno-2-m.webp", "./mappa-camera-m.webp", "./mappa-bagno-m.webp", "./mappa-cucina-m.webp", "./stanza-altro.webp", "./stanza-paghe.webp", "./lavoro-bagno-m.webp", "./lavoro-biancheria-m.webp", "./lavoro-camera-m.webp", "./lavoro-cucina-m.webp", "./lavoro-finale-m.webp", "./lavoro-letto-m.webp", "./lavoro-partenza-m.webp", "./lavoro-pavimenti-m.webp", "./stanza-manutenzione.webp", "./stanza-prospetto.webp", "./stanza-segreteria.webp", "./stanza-signore.webp", "./stanza-sofia.webp", "./segr6-poster-3d.webp", "./mat-sveglia.webp", "./mat-spunte.webp", "./mat-busta.webp", "./mat-arrivi.webp", "./mat-partenze.webp", "./mat-microfono.webp", "./mat-matita.webp", "./mat-voce.webp", "./mat-telefono.webp", "./mat-documento.webp", "./mat-fumetto.webp", "./mat-lettera.webp", "./mat-spunta.webp", "./mat-graffetta.webp", "./mat-cassetta.webp", "./mat-chiave.webp", "./mat-attenzione.webp", "./fonts/playwrite-it-moderna-latin-400-normal.woff2", "./fonts/playwrite-hr-latin-400-normal.woff2", "./fonts/petit-formal-script-latin-400-normal.woff2", "./segr2-viso.webp", "./segr-tasto4.webp", "./sofia-influencer.webp", "./sofia-influencer-viso.webp", "./stanza-influencer.webp", "./cons-poster-3d2.webp", "./cons-fondo-3d.webp", "./avorio-parete.webp", "./cornice-noce.webp", "./fonts/atkinson-hyperlegible-next-latin-400-normal.woff2", "./fonts/atkinson-hyperlegible-next-latin-600-normal.woff2", "./fonts/atkinson-hyperlegible-next-latin-800-normal.woff2",
  "./bocca.js", "./viso.js", "./documenti.js", "./alloggiati-codici.json", "./cons-scena.webp", "./sofia-viso.webp",   // 1.70.0: via le immagini della Consuela a pose: una Sofia sola
  "./marmo-blu.webp", "./marmo-avorio.webp", "./marmo-biglia.webp", "./fonts/dancing-script-latin-700-normal.woff2", "./fonts/cormorant-garamond-latin-600-normal.woff2", "./fonts/cormorant-garamond-latin-700-normal.woff2", "./fonts/cormorant-garamond-latin-600-italic.woff2", "./fonts/plus-jakarta-sans-latin-600-normal.woff2", "./fonts/plus-jakarta-sans-latin-700-normal.woff2", "./fonts/plus-jakarta-sans-latin-800-normal.woff2",   // 1.79.12: il grassetto vero delle scritte delle icone
  "./fonts/fredoka-latin-600-normal.woff2", "./fonts/fredoka-latin-700-normal.woff2",
  "./fonts/montserrat-latin-500-normal.woff2", "./fonts/montserrat-latin-600-normal.woff2", "./fonts/montserrat-latin-700-normal.woff2", "./fonts/montserrat-latin-800-normal.woff2",
  "./legno-oro-parete.webp", "./cornice-legno.webp", "./radica.webp", "./legno-oro.webp", "./fascia-mogano.webp", "./fonts/playfair-display-latin-600-normal.woff2", "./fonts/playfair-display-latin-400-italic.woff2",
  "./patrick-hand.woff2", "./mat-letto2.webp", "./mat-letto1.webp", "./mat-persona.webp", "./mat-persone.webp", "./mat-valigia.webp", "./mat-megafono.webp", "./mat-casa.webp", "./mat-scale.webp", "./mat-pianta.webp", "./mat-secchio.webp", "./mat-stella.webp", "./mat-scintilla.webp", "./mat-p-letto.webp", "./mat-p-bagno.webp", "./mat-p-camera.webp", "./mat-p-pavimenti.webp", "./mat-p-cucina.webp", "./mat-p-lavanderia.webp", "./mat-p-partenza.webp", "./mat-p-finestra.webp", "./lavoro-letto-singolo-m.webp",   // 1.55.8: le camere a matita
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE_BASE.map((u) => new Request(u, { cache: "reload" })))).catch((err) => console.warn("precache", err)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const chiavi = await caches.keys();
    let film = null; try { film = await caches.open(CACHE_FILM); } catch (err) {}
    for (const k of chiavi) {
      if (!k.startsWith("ricci-pulizie-") || k === CACHE) continue;
      // 1.43.0: i filmati già scaricati con la versione vecchia passano nella cache dei filmati: niente riscaricamenti
      if (film) { try { const vecchia = await caches.open(k); for (const req of await vecchia.keys()) { if (!VIDEO.test(new URL(req.url).pathname)) continue; if (await film.match(req.url)) continue; const r = await vecchia.match(req); if (r && r.status === 200) await film.put(req.url, r); } } catch (err) {} }
      await caches.delete(k);
    }
    // via dalla cache dei filmati quelli che l'app non usa più
    if (film) { try { const validi = new Set(FILMATI.map((u) => new URL(u, self.registration.scope).href)); for (const req of await film.keys()) { if (!validi.has(req.url)) await film.delete(req); } } catch (err) {} }
    await self.clients.claim();
  })());
});

self.addEventListener("message", (e) => { if (e.data?.tipo === "attiva") self.skipWaiting(); });

// 0.99: la notifica di Sofia ("ha letto le chat"): toccandola si apre l'app sull'anteprima da controllare
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  // 1.58.0: «✅ Sistemato» (guasto urgentissimo): si apre l'app, che chiede «È sistemato?» e lo segna
  const dd = e.notification.data || {};
  // 1.89.0: la sveglia di Jarvis: toccata, apre Jarvis (ad app aperta glielo dico; ad app chiusa la apro con ?jarvis=apri)
  if (dd.jarvis) {
    e.waitUntil((async () => {
      const fin = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of fin) { if ("focus" in c) { try { await c.focus(); } catch (err) {} try { c.postMessage({ tipo: "apriJarvis" }); } catch (err) {} return; } }
      if (self.clients.openWindow) await self.clients.openWindow(new URL("./index.html?jarvis=apri", self.registration.scope).href);
    })());
    return;
  }
  // 1.62.0: «✅ Fatto» sull'allarme «🔔 Da fare» (le cose che deve fare Michele in persona): l'app la segna fatta
  if (e.action === "fattoTu" && dd.rif) {
    e.waitUntil((async () => {
      const fin = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of fin) { if ("focus" in c) { try { await c.focus(); } catch (err) {} try { c.postMessage({ tipo: "tuFatto", id: dd.rif }); } catch (err) {} return; } }
      if (self.clients.openWindow) await self.clients.openWindow(new URL("./index.html?tuFatto=" + encodeURIComponent(dd.rif), self.registration.scope).href);
    })());
    return;
  }
  if (e.action === "fatto" && dd.rif) {
    e.waitUntil((async () => {
      const fin = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of fin) { if ("focus" in c) { try { await c.focus(); } catch (err) {} try { c.postMessage({ tipo: "manFatto", id: dd.rif }); } catch (err) {} return; } }
      if (self.clients.openWindow) await self.clients.openWindow(new URL("./index.html?manFatto=" + encodeURIComponent(dd.rif), self.registration.scope).href);
    })());
    return;
  }
  const url = new URL((e.notification.data && e.notification.data.url) || "./index.html", self.registration.scope).href;
  e.waitUntil((async () => {
    const finestre = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // 1.55.13: le notifiche nuove (con id e dove) aprono la loro parte dell'app col foglio della notifica sopra
    const d = e.notification.data || {}, nuova = !!d.id && !d.segreteria && !d.lettura;
    const avviso = nuova ? { id: d.id, titolo: e.notification.title || "", testo: e.notification.body || "", dove: d.dove || "", rif: d.rif || "", quando: new Date(e.notification.timestamp || Date.now()).toISOString() } : null;
    for (const c of finestre) { if ("focus" in c) { try { await c.focus(); } catch (err) {} if (avviso) { try { c.postMessage({ tipo: "apriAvviso", avviso }); } catch (err) {} return; } if (e.notification.data && e.notification.data.segreteria) { try { c.postMessage({ tipo: "apriSegreteria", lettura: e.notification.data.segreteria === "lettura" }); } catch (err) {} return; } if (!(e.notification.data && e.notification.data.push) || (e.notification.data && e.notification.data.lettura)) { try { c.postMessage({ tipo: "apriLettura" }); } catch (err) {} } return; } }
    if (self.clients.openWindow) await self.clients.openWindow(avviso ? new URL("./index.html?avviso=" + encodeURIComponent(avviso.id), self.registration.scope).href : url);
  })());
});

// 1.98.0 (Michele, 18/11, visto l'avviso di prova sull'orologio: «più sono, diciamo, inerenti coi colori, con le immagini,
// eccetera, eccetera, e meglio è»): ogni notifica ha il disegno della sua cosa (quelli di Gemini, a matita) nel tondo colorato
// dei cartoncini della Segreteria (notifica-*.png). La cosa la dice il disegnino in testa al titolo, come sempre.
const ICONE = [[/^⏰/, "sveglia"], [/^🔔 Da fare/, "dafare"], [/^📧/, "email"], [/^(🛎|❌ Prenotazione)/, "prenotazione"], [/^💬/, "messaggio"], [/^(🚨|⚠|📵)/, "urgente"],
  [/^☀/, "pulizie"], [/^🧳/, "arrivi"], [/^🌙/, "sera"], [/^📊/, "foglio"], [/^📋/, "sintesi"], [/^(📣|📷)/, "social"], [/^✋|ho letto/i, "lettura"]];
function iconaDi(titolo, d) {
  const t = String(titolo || "");
  for (const [re, k] of ICONE) if (re.test(t)) return `notifica-${k}.png`;
  return d && (d.lettura || d.segreteria === "lettura") ? "notifica-lettura.png" : "notifica-casa.png";
}

// 1.17.0 GLI AVVISI DI SOFIA SUL TELEFONO (Web Push): li manda il giro sempre acceso (sofia-giro), qui si mostrano
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { testo: e.data ? e.data.text() : "" }; }
  if (d && d.sveglia) { e.waitUntil(mostraSveglia(d)); return; }   // 1.89.0: la sveglia di Jarvis ha la sua strada
  const titolo = String(d.titolo || "Sofia").slice(0, 80), testo = String(d.testo || "Apri l'app: Sofia ti ha scritto.").slice(0, 1800);
  // 1.18.0: l'avviso «ho letto le chat» apre l'app sulla lettura da controllare
  const url = typeof d.url === "string" && /^\.\/index\.html(\?[a-z=&0-9]*)?$/i.test(d.url) ? d.url : "./index.html";
  const tag = typeof d.tag === "string" && /^[a-z0-9-]{1,40}$/i.test(d.tag) ? d.tag : "sofia-" + Date.now();
  // 1.55.13: dove aprire l'app e (per i messaggi delle signore) quale messaggio; la notifica resta da parte sul telefono
  // (cache ricci-avvisi, le ultime 40): toccandola l'app la ritrova anche se si apre da chiusa
  const dove = ["casa", "signore", "segreteria", "prospetto", "manutenzione", "altro", "sofia", "messaggi"].includes(d.dove) ? d.dove : "";
  const rif = typeof d.rif === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(d.rif) ? d.rif : "";
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  e.waitUntil(Promise.all([
    // 1.58.0: il guasto urgentissimo ha i tasti «✅ Sistemato» e «Apri», vibra più forte e resta finché non lo tocchi
    self.registration.showNotification(titolo, { body: testo, icon: iconaDi(titolo, d), badge: "badge-casa-96.png", tag, renotify: true,
      ...(d.azioni === "fatto" && rif ? { actions: [{ action: "fatto", title: "✅ Sistemato" }, { action: "apri", title: "Apri" }] } : {}),
      ...(d.azioni === "fattoTu" && rif ? { actions: [{ action: "fattoTu", title: "✅ Fatto" }, { action: "apri", title: "Apri" }] } : {}),   // 1.62.0
      ...(d.vibra ? { vibrate: [300, 120, 300, 120, 300], requireInteraction: true } : {}),
      data: { url, push: true, lettura: !!d.lettura, segreteria: d.segreteria === "lettura" ? "lettura" : !!d.segreteria, id, dove, rif } }),
    salvaAvviso({ id, titolo, testo, dove, rif, quando: new Date().toISOString() }),
  ]));   // 1.49.0: anche «la sintesi di oggi»; 1.51.0: e la lettura (Segreteria a tendina chiusa)
});

// 1.89.0 LA SVEGLIA DI JARVIS (Michele: «mi deve arrivare una sorta di notifica, una sveglia… 5-10 minuti prima»). Il giro
// manda solo «sveglia <codice>» e l'ora: CHE COSA c'è da fare lo sa solo questo telefono (cache «ricci-jarvis», la scrive
// l'app quando lui segna una cosa). La notifica si compone qui, con i minuti che mancano davvero. Non va tra gli avvisi di
// Sofia. Toccata, apre Jarvis. Se il telefono non ha più quella cosa (tolta un attimo prima), dice solo che c'è un impegno.
const CACHE_JARVIS = "ricci-jarvis";
async function mostraSveglia(d) {
  const codice = typeof d.sveglia === "string" && /^[A-Za-z0-9_-]{1,60}$/.test(d.sveglia) ? d.sveglia : "";
  let cosa = null;
  try {
    const c = await caches.open(CACHE_JARVIS), r = await c.match(new URL("./jarvis/sveglie", self.registration.scope).href), m = r ? await r.json() : null;
    cosa = m && codice && m[codice] && typeof m[codice].t === "string" && m[codice].t ? m[codice] : null;
  } catch (err) { cosa = null; }
  const T = Date.parse((cosa && cosa.q) || (typeof d.quando === "string" ? d.quando : "")), min = Number.isFinite(T) ? Math.round((T - Date.now()) / 60000) : null;
  // 1.98.0 (Michele: «ricordami alle 18 di fare gli auguri a mio cognato, e alle 18 mi arriva la notifica di Jarvis»): la
  // sveglia ALL'ORA GIUSTA dice la cosa e l'ora: «⏰ Fare gli auguri a mio cognato» · «Sono le 18: me l'hai chiesto tu.»
  if ((cosa && cosa.x) || d.esatta === true) {
    const ora = cosa && cosa.o ? String(cosa.o).slice(0, 5) : Number.isFinite(T) ? oraCorta(T) : "";
    const sono = !ora ? "È l'ora" : ora === "0" ? "È mezzanotte" : /^1(:|$)/.test(ora) ? `È l'${ora === "1" ? "una" : ora}` : `Sono le ${ora}`;
    const titolo = cosa ? `⏰ ${cosa.t}`.slice(0, 120) : "⏰ Il tuo promemoria";
    const testo = min !== null && min >= 2 ? `Alle ${ora}: te lo dico un po' prima. Tocca per aprire Jarvis.` : min !== null && min <= -3 ? `Era per le ${ora}: me l'hai chiesto tu. Tocca per aprire Jarvis.` : `${sono}: me l'hai chiesto tu. Tocca per aprire Jarvis.`;
    await self.registration.showNotification(titolo, { body: testo, icon: "notifica-sveglia.png", badge: "badge-casa-96.png", tag: "sveglia-" + (codice || "x"), renotify: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500], requireInteraction: true, data: { url: "./index.html", push: true, jarvis: true } });
    return;
  }
  const tra = min === null ? "Tra poco" : min >= 2 ? `Tra ${min} minuti` : "Adesso";
  const titolo = cosa ? `⏰ ${tra}: ${cosa.t}`.slice(0, 120) : `⏰ ${tra} hai un impegno`;
  const testo = cosa ? `${cosa.o ? "alle " + String(cosa.o).slice(0, 5) + " · " : ""}tocca per aprire la tua lista` : "Tocca per aprire la tua lista.";
  await self.registration.showNotification(titolo, { body: testo, icon: "notifica-sveglia.png", badge: "badge-casa-96.png", tag: "sveglia-" + (codice || "x"), renotify: true,
    vibrate: [300, 120, 300, 120, 300], requireInteraction: true, data: { url: "./index.html", push: true, jarvis: true } });
}
// «18:00» → «18», «18:30» → «18:30» (l'ora di Lesina), come la scrive Jarvis
function oraCorta(T) {
  try { const p = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(T)); const h = Number((p.find(x => x.type === "hour") || {}).value) % 24, m = (p.find(x => x.type === "minute") || {}).value || "00"; return m === "00" ? String(h) : `${h}:${m}`; }
  catch (err) { return ""; }
}

const CACHE_AVVISI = "ricci-avvisi";
async function salvaAvviso(a) {
  try {
    const c = await caches.open(CACHE_AVVISI);
    await c.put(new Request(new URL("./avvisi/" + a.id, self.registration.scope).href), new Response(JSON.stringify(a), { headers: { "Content-Type": "application/json" } }));
    const ks = await c.keys(); for (const k of ks.slice(0, Math.max(0, ks.length - 40))) await c.delete(k);
  } catch (err) {}
}

// ---- filmati: cache-first, a pezzi, scaricati per intero una volta sola ----------------------
const VIDEO = /\.(mp4|webm)$/i;
const scaricamenti = new Map();   // url -> Promise, per non scaricare due volte lo stesso filmato in parallelo
// 1.43.0: il filmato letto una volta in memoria per le richieste a pezzi (prima si rileggeva tutto il file a ogni pezzo)
const letti = new Map();          // url -> { buf, tipo, t }, al massimo 3 filmati
async function filmLetto(url, intera) {
  let b = letti.get(url);
  if (!b) {
    b = { buf: await intera.arrayBuffer(), tipo: intera.headers.get("Content-Type") || "video/mp4", t: Date.now() };
    letti.set(url, b);
    if (letti.size > 3) { let vecchio = null; for (const [k, v] of letti) if (!vecchio || v.t < letti.get(vecchio).t) vecchio = k; letti.delete(vecchio); }
  }
  b.t = Date.now();
  return b;
}
async function rispostaVideo(req) {
  const chiave = new URL(req.url); chiave.search = "";
  const cache = await caches.open(CACHE_FILM);   // 1.43.0: la cache dei filmati, che resta
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
  return rispostaIntervallo(req, intera, chiave.href);
}
// Il lettore video chiede "Range: bytes=a-b": si risponde 206 con quel pezzo del file in cache
async function rispostaIntervallo(req, intera, url) {
  const range = req.headers.get("range");
  if (!range) return intera;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return intera;
  const letto = await filmLetto(url, intera);
  const buf = letto.buf;
  const tot = buf.byteLength;
  let a = m[1] ? Number(m[1]) : 0, b = m[2] ? Number(m[2]) : tot - 1;
  if (!m[1] && m[2]) { a = Math.max(0, tot - Number(m[2])); b = tot - 1; }
  b = Math.min(b, tot - 1);
  if (a >= tot || a > b) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${tot}` } });
  const h = new Headers();
  h.set("Content-Type", letto.tipo);
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

  if (url.origin === location.origin && /\/ocr\//.test(url.pathname)) return;   // 1.56.0
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
