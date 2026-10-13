// ============================================================================
//  LOGICA  ·  date, settimana di paga, prezzi e piano delle pulizie
//  Funzioni "pure": prendono dati, restituiscono risultati. Niente rete.
// ============================================================================
import { TIPI_PULIZIA, REGOLE_BASE, LISTINO_BASE, VOTI_BASE, MODO_DA_TIPO, MODO_CAMERA_BASE } from "./regole.js";
import { CALENDARIO_VERO } from "./catalogo.js";

export const MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
export const GIORNI = ["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"];
export const GG = ["dom","lun","mar","mer","gio","ven","sab"];
const FUSO = "Europe/Rome";

// ---- Date (tutte come testo "AAAA-MM-GG", nel fuso di Lesina) --------------
export function oggiISO(d = new Date()) {
  return d.toLocaleDateString("sv-SE", { timeZone: FUSO });
}
export function daISO(iso) { // -> Date a mezzogiorno UTC (così non slitta di giorno)
  const [y, m, g] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, g, 12));
}
export function aISO(d) { return d.toISOString().slice(0, 10); }
export function aggiungiGiorni(iso, n) { const d = daISO(iso); d.setUTCDate(d.getUTCDate() + n); return aISO(d); }
export function giornoSettimana(iso) { return daISO(iso).getUTCDay(); } // 0 = domenica
export function giornoDelMese(iso) { return Number(iso.slice(8, 10)); }
export function meseDi(iso) { return iso.slice(0, 7); } // "AAAA-MM"
export function primoDelMese(iso) { return iso.slice(0, 8) + "01"; }
export function ultimoDelMese(iso) { const d = daISO(primoDelMese(iso)); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return aISO(d); }
export function lunediDi(iso) { const w = giornoSettimana(iso); return aggiungiGiorni(iso, w === 0 ? -6 : 1 - w); }
export function giorniTra(a, b) { return Math.round((daISO(b) - daISO(a)) / 864e5); }
export function dataBreve(iso) { return `${GG[giornoSettimana(iso)]} ${giornoDelMese(iso)}`; }
export function dataLunga(iso) { const d = daISO(iso); return `${GIORNI[d.getUTCDay()]} ${d.getUTCDate()} ${MESI[d.getUTCMonth()]}`; }
export function dataMedia(iso) { const d = daISO(iso); return `${GG[d.getUTCDay()]} ${d.getUTCDate()} ${MESI[d.getUTCMonth()].slice(0, 3)}`; }
// "venerdì 16 ott": il giorno della settimana per esteso, perché è quello che conta (arrivi e partenze)
export function dataGiornoLungo(iso) { const d = daISO(iso); return `${GIORNI[d.getUTCDay()]} ${d.getUTCDate()} ${MESI[d.getUTCMonth()].slice(0, 3)}`; }
export function meseLungo(iso) { const d = daISO(iso); return `${MESI[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }
export function oraBreve(isoOra) {
  try { return new Date(isoOra).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: FUSO }); } catch (e) { return ""; }
}
export function eur(n) {
  return (Math.round(Number(n || 0) * 100) / 100).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";
}

// Parti di un istante nel fuso di Lesina
export function partiRoma(istante) {
  const d = istante instanceof Date ? istante : new Date(istante);
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false, weekday: "short" }).formatToParts(d);
  const g = k => f.find(x => x.type === k)?.value;
  return { y: +g("year"), m: +g("month"), d: +g("day"), h: +g("hour") % 24, wd: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(g("weekday")) };
}

// ---- Settimana di paga: chiude il SABATO alle 13:00 ------------------------
// La chiave della settimana è la data del sabato in cui si chiude ("AAAA-MM-GG").
// Una pulizia segnata FATTA sabato dopo le 13 finisce nella settimana dopo.
export function chiaveSettimana(istante, chiusura = REGOLE_BASE.chiusuraPaga) {
  const p = partiRoma(istante);
  let add = (chiusura.giorno - p.wd + 7) % 7;
  if (p.wd === chiusura.giorno && p.h >= chiusura.ora) add = 7;
  return aISO(new Date(Date.UTC(p.y, p.m - 1, p.d + add, 12)));
}
export function settimanaCorrente() { return chiaveSettimana(new Date()); }
export function etichettaSettimana(chiave) {
  const fine = chiave, inizio = aggiungiGiorni(chiave, -6);
  const a = daISO(inizio), b = daISO(fine);
  return `${a.getUTCDate()} ${MESI[a.getUTCMonth()].slice(0, 3)} – ${b.getUTCDate()} ${MESI[b.getUTCMonth()].slice(0, 3)}`;
}
export function settimanaPrecedente(chiave) { return aggiungiGiorni(chiave, -7); }

// ---- Prezzi -----------------------------------------------------------------
export function listinoCompleto(l) {
  const base = JSON.parse(JSON.stringify(LISTINO_BASE));
  if (!l) return base;
  const out = { ...base, ...l };
  out.totale = { ...base.totale, ...(l.totale || {}) };
  out.ripasso = { ...base.ripasso, ...(l.ripasso || {}) };
  out.taglia = { ...base.taglia, ...(l.taglia || {}) };
  out.perCasa = { ...base.perCasa }; for (const [id, v] of Object.entries(l.perCasa || {})) out.perCasa[id] = { ...(base.perCasa[id] || {}), ...(v || {}) };
  return out;
}
export function tagliaCamera(listino, cameraId) { return listino?.taglia?.[cameraId] === "P" ? "P" : "G"; }
export function prezzoPulizia(listino, camera, tipo) {
  const l = listinoCompleto(listino);
  const voce = TIPI_PULIZIA[tipo]?.prezzo || tipo;
  const speciale = l.perCasa && l.perCasa[camera.id] && l.perCasa[camera.id][voce];
  if (speciale != null) return Number(speciale) || 0;
  const v = l[voce];
  if (v == null) return 0;
  if (typeof v === "object") return Number(v[tagliaCamera(l, camera.id)] ?? v.G ?? 0);
  return Number(v) || 0;
}

// ---- Occupazione -----------------------------------------------------------
// Un soggiorno occupa le notti da "inizio" (compreso) a "fine" (escluso: è il giorno di partenza).
export function soggiornoCopre(s, iso) { return s.inizio <= iso && iso < s.fine; }
export function ospiteIl(soggiorni, cameraId, iso) {
  return soggiorni.find(s => s.camera === cameraId && soggiornoCopre(s, iso)) || null;
}
export function parteIl(soggiorni, cameraId, iso) {
  return soggiorni.find(s => s.camera === cameraId && s.fine === iso) || null;
}
export function arrivaIl(soggiorni, cameraId, iso) {
  return soggiorni.find(s => s.camera === cameraId && s.inizio === iso) || null;
}

// ---- Il calendario vero (foglio "Calendario vero" di Michele, dentro catalogo.js) --------------------------------------
// Per ogni posto: i passaggi della settimana. Se una riga del foglio ha ancora una domanda aperta ([CONTROLLA], [COMPLETA],
// "oppure"), quel posto resta con REGOLE_BASE finché Michele non risponde: l'app non inventa. [DECIDI: profilo] non blocca i giorni.
export const CALENDARIO_CAMERE = (() => {
  const out = {};
  for (const v of CALENDARIO_VERO) {
    if (!v.tipo || !v.posti || !v.posti.length) continue;
    const dubbio = /CONTROLLA|COMPLETA/i.test(v.controlla || "") || !!v.oppure;
    for (const id of v.posti) {
      const c = out[id] = out[id] || { passi: [], aperto: false, domande: [] };
      c.passi.push({ giorno: v.giorno, tipo: v.tipo, budget: v.budget, libera: !!v.libera, base: !!v.base, oppure: !!v.oppure, controlla: v.controlla || "", zona: v.zona || null, insieme: v.insieme || "", parte: v.parte || "", dubbio });
      if (dubbio) { c.aperto = true; if (v.controlla && !c.domande.includes(v.controlla)) c.domande.push(v.controlla); }
    }
  }
  return out;
})();
// ---- I tre modi (Michele, 0.29): il modo segue l'ospite che c'è in camera ----------------------------------------------
export const NOMI_MODI = ["tecnici", "operai", "booking"];
export function normNome(n) { return String(n || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
// Il nome del cliente dentro il nome del soggiorno: "D'Agostino · 3 persone" → "D'Agostino" (si taglia a "·", " - ", "(" o ",")
export function nomeCliente(n) { return String(n || "").split(/\s*[·(,]|\s+-\s+/)[0].trim(); }
// Il cliente ricordato per quel nome (impostazioni/clienti): nome esatto, poi il nome del cliente, poi la chiave più lunga che inizia il nome
export function clienteDi(nome, clienti = {}) {
  if (!clienti || !nome) return null;
  const n = normNome(nome); if (!n) return null;
  if (clienti[n]) return clienti[n];
  const nc = normNome(nomeCliente(nome)); if (nc && clienti[nc]) return clienti[nc];
  let best = null; for (const k of Object.keys(clienti)) if (k && n.startsWith(k + " ") && (!best || k.length > best.length)) best = k;
  return best ? clienti[best] : null;
}
// Il modo di un soggiorno: scelto sul soggiorno → ricordato per quel nome (impostazioni/clienti) → dal tipo di ospite
export function modoSoggiorno(s, clienti = {}) {
  if (!s) return null;
  if (NOMI_MODI.includes(s.modo)) return s.modo;
  const c = clienteDi(s.nome, clienti); if (c && NOMI_MODI.includes(c.modo)) return c.modo;
  return MODO_DA_TIPO[s.tipo] || "booking";
}
// Il modo di una camera in un giorno: chi dorme quella notte, o chi parte quel giorno; senza nessuno, quello di base della camera (d'estate Booking).
// Negli appartamenti degli operai (via Zara 1° e 2°) chi è Tecnici altrove è Operai lì (Michele: "i D'Agostino all'albergo sono tecnici,
// solo in via Zara 1° e 2° sono operai"), a meno che il modo sia scritto a mano su quel soggiorno.
export function modoCamera(camera, iso, soggiorni = [], clienti = {}, regole = REGOLE_BASE) {
  const occ = ospiteIl(soggiorni, camera.id, iso) || parteIl(soggiorni, camera.id, iso);
  if (occ) { const m = modoSoggiorno(occ, clienti); return m === "tecnici" && MODO_CAMERA_BASE[camera.id] === "operai" && !NOMI_MODI.includes(occ.modo) ? "operai" : m; }
  if (regimeDi(iso, regole) === "estate") return "booking";
  return MODO_CAMERA_BASE[camera.id] || "tecnici";
}

// ---- Le stagioni (Michele, 0.28): INVERNO da ottobre a maggio = i giorni fissi del calendario vero; ESTATE da giugno ad agosto =
// niente giorni fissi, le pulizie seguono arrivi e partenze del prospetto. Il passaggio lo fa l'app dalle date; in Regole si può
// anticipare o posticipare (impostazioni/regole.regime = { modo: "auto" | "estate" | "inverno", fino?: "AAAA-MM-GG", da?: "MM-GG", a?: "MM-GG" }).
export const ESTATE_BASE = { da: "06-01", a: "08-31" };
export function regimeDi(iso, regole) {
  const r = (regole && regole.regime) || {};
  if ((r.modo === "estate" || r.modo === "inverno") && (!r.fino || r.fino >= iso)) return r.modo;
  const da = r.da || ESTATE_BASE.da, a = r.a || ESTATE_BASE.a, mg = String(iso).slice(5);
  return (da <= a ? (mg >= da && mg <= a) : (mg >= da || mg <= a)) ? "estate" : "inverno";
}
export function regimeTesto(regime) { return regime === "estate" ? "estate: le pulizie seguono arrivi e partenze" : "inverno: i giorni fissi del calendario vero"; }
// La signora che fa un posto d'inverno: quella scritta nel calendario vero (la signora del 1° piano fa anche gli appartamenti); altrimenti la zona del posto
export function zonaDi(camera, regole = REGOLE_BASE) {
  const cal = CALENDARIO_CAMERE[camera.id];
  if (cal && !cal.aperto) { const conta = {}; for (const x of cal.passi) if (x.zona) conta[x.zona] = (conta[x.zona] || 0) + 1; const top = Object.entries(conta).sort((a, b) => b[1] - a[1])[0]; if (top) return top[0]; }
  return camera.zona;
}
// I passaggi della settimana di un posto: dal calendario vero se non ha domande aperte, altrimenti da REGOLE_BASE. D'estate nessuno.
export function passaggiCamera(camera, regole = REGOLE_BASE, iso = null) {
  const r = { ...REGOLE_BASE, ...(regole || {}) };
  if (iso && regimeDi(iso, r) === "estate") return [];
  const cal = CALENDARIO_CAMERE[camera.id];
  if (cal && !cal.aperto && !r.ignoraCalendario) return cal.passi.map(x => ({ giorno: x.giorno, tipo: x.tipo === "totale" ? (camera.tipo === "casa" ? "totale_casa" : "totale") : (camera.tipo === "casa" ? "casa" : "ripasso"), zona: x.zona || camera.zona, insieme: x.insieme || "", parte: x.parte || "", daCalendario: true }));
  return ((camera.tipo === "casa" ? r.casa : r.camera) || []).map(x => ({ ...x, zona: camera.zona, daCalendario: false }));
}

// ---- Piano delle pulizie ---------------------------------------------------
// Decide che pulizia va fatta in una camera in un certo giorno, secondo il calendario vero (o le regole di base).
// Restituisce null se quel giorno non c'è niente da fare.
export function pulizia_prevista(camera, iso, soggiorni, regole = REGOLE_BASE, note = [], clienti = {}) {
  const r = { ...REGOLE_BASE, ...(regole || {}) };
  const occ = ospiteIl(soggiorni, camera.id, iso);
  const parte = parteIl(soggiorni, camera.id, iso);
  const wd = giornoSettimana(iso);
  const lista = passaggiCamera(camera, r, iso);
  // un appartamento su due piani può avere due passaggi lo stesso giorno (una signora per piano): il principale è quello di sotto
  const delGiorno = lista.filter(x => x.giorno === wd);
  const regola = delGiorno.find(x => !x.parte || x.parte === "sotto") || delGiorno[0] || null;
  const altreParti = regola ? delGiorno.filter(x => x !== regola && x.parte && x.parte !== regola.parte) : [];
  let tipo = null, titoloSpeciale = "";
  if (occ && regola) tipo = regola.tipo;
  if (parte && r.totaleAllaPartenza) tipo = camera.tipo === "casa" ? "totale_casa" : "totale";
  const chi = occ || parte;
  const modo = modoCamera(camera, iso, soggiorni, clienti, r); // chi dorme o chi parte, con la regola di via Zara 1° e 2°
  // modo BOOKING: cambio d'aria e letto rifatto se la camera è rimasta ferma 2+ giorni prima dell'arrivo
  const arrivoOggi = arrivaIl(soggiorni, camera.id, iso);
  if (!tipo && arrivoOggi && modoSoggiorno(arrivoOggi, clienti) === "booking" && !parte) {
    const ferma = !ospiteIl(soggiorni, camera.id, aggiungiGiorni(iso, -1)) && !ospiteIl(soggiorni, camera.id, aggiungiGiorni(iso, -2)) && !parteIl(soggiorni, camera.id, aggiungiGiorni(iso, -1));
    if (ferma) { tipo = "ripasso"; titoloSpeciale = "Arrivo: aria e letto"; }
  }
  // modo BOOKING d'estate: un soggiorno più lungo di 4 notti ha un ripasso al 4° giorno (e poi ogni 3 notti: asciugamani)
  if (!tipo && occ && modoSoggiorno(occ, clienti) === "booking" && regimeDi(iso, r) === "estate" && !regola) {
    const notti = giorniTra(occ.inizio, occ.fine), giornoN = giorniTra(occ.inizio, iso);
    if (notti > 4 && giornoN >= 4 && giornoN < notti && (giornoN - 4) % 3 === 0) { tipo = "ripasso"; titoloSpeciale = "Ripasso e asciugamani"; }
  }
  if (!tipo) return null;
  const notePubbliche = note.filter(n => n.camera === camera.id && n.data === iso && !n.privata).map(n => n.testo);
  // il prossimo che arriva in questa camera (da oggi in poi, escluso chi c'è già)
  const prossimo = soggiorni.filter(s => s.camera === camera.id && s.inizio >= iso && (!occ || s.id !== occ.id)).sort((a, b) => a.inizio < b.inizio ? -1 : 1)[0] || null;
  return {
    tipo,
    titolo: titoloSpeciale || TIPI_PULIZIA[tipo]?.titolo || tipo,
    modo,
    passi: TIPI_PULIZIA[tipo]?.passi || [],
    ospite: chi?.nome || "",
    soggiorno: chi?.id || null,
    partenza: !!parte,
    arrivo: !!arrivaIl(soggiorni, camera.id, iso),
    parteIl: occ ? occ.fine : (parte ? iso : null),
    prossimoArrivo: prossimo ? prossimo.inizio : null,
    prossimoNome: prossimo ? (prossimo.nome || "") : "",
    prossimoPersone: prossimo ? (prossimo.persone || null) : null,
    istruzioni: [chi?.nota || "", ...notePubbliche].filter(Boolean).join(" · "),
    persone: chi?.persone || null,
    supplemento: Number(chi?.supplemento || 0),
    zona: (regola && regola.zona) || zonaDi(camera, r),
    insieme: (regola && regola.insieme) || "",
    parte: (regola && regola.parte) || "",
    altreParti: regola && tipo === regola.tipo ? altreParti : [],
    regime: regimeDi(iso, r),
  };
}
export const PARTE_TESTO = { sotto: "piano di sotto", sopra: "piano di sopra" };

// Costruisce l'elenco completo delle pulizie "attese" in un intervallo di giorni.
export function pianoPulizie(camere, soggiorni, regole, listino, da, a, note = [], clienti = {}) {
  const out = [];
  for (let iso = da; iso <= a; iso = aggiungiGiorni(iso, 1)) {
    for (const c of camere) {
      const p = pulizia_prevista(c, iso, soggiorni, regole, note, clienti);
      if (!p) continue;
      const base = {
        data: iso, camera: c.id, zona: p.zona || c.zona, insieme: p.insieme || "", modo: p.modo || "",
        tipo: p.tipo, titolo: p.titolo, passi: p.passi,
        ospite: p.ospite, soggiorno: p.soggiorno, partenza: p.partenza, arrivo: p.arrivo,
        parteIl: p.parteIl, prossimoArrivo: p.prossimoArrivo, prossimoNome: p.prossimoNome, prossimoPersone: p.prossimoPersone,
        istruzioni: p.istruzioni, persone: p.persone,
        importo: prezzoPulizia(listino, c, p.tipo) + Number(p.supplemento || 0),
        origine: "auto",
      };
      const conParte = (b, parte) => parte ? { ...b, parte, titolo: `${b.titolo} · ${PARTE_TESTO[parte] || parte}` } : b;
      out.push({ id: `${iso}_${c.id}`, ...conParte(base, p.parte) });
      // le altre parti dello stesso giorno (l'altra signora, l'altro piano): un'altra riga di paga, senza il supplemento dell'ospite
      for (const x of p.altreParti || []) out.push({ id: `${iso}_${c.id}_${x.parte}`, ...conParte({ ...base, zona: x.zona || base.zona, insieme: x.insieme || "", importo: prezzoPulizia(listino, c, p.tipo) }, x.parte) });
    }
  }
  return out;
}

// Confronta il piano atteso con le pulizie già salvate e dice cosa creare,
// aggiornare o cancellare. NON tocca mai una pulizia già FATTA / NON FATTA /
// PROBLEMA, né quelle aggiunte a mano.
export function differenzePiano(attese, esistenti) {
  const crea = [], aggiorna = [], cancella = [];
  const attMap = new Map(attese.map(a => [a.id, a]));
  for (const a of attese) {
    const e = esistenti[a.id];
    if (!e) { crea.push({ ...a, stato: "da_fare" }); continue; }
    if (e.origine !== "auto" || e.stato !== "da_fare") continue;
    const campi = ["tipo","titolo","ospite","soggiorno","partenza","arrivo","parteIl","prossimoArrivo","prossimoNome","prossimoPersone","istruzioni","importo","zona","persone","insieme","modo","parte"];
    const patch = {};
    for (const k of campi) {
      const va = a[k] ?? null, ve = e[k] ?? null;
      if (JSON.stringify(va) !== JSON.stringify(ve)) patch[k] = va;
    }
    if (JSON.stringify(a.passi) !== JSON.stringify(e.passi)) patch.passi = a.passi;
    if (Object.keys(patch).length) aggiorna.push({ id: a.id, patch });
  }
  for (const [id, e] of Object.entries(esistenti)) {
    if (e.origine === "auto" && e.stato === "da_fare" && !attMap.has(id)) cancella.push(id);
  }
  return { crea, aggiorna, cancella };
}

// ---- Voto delle pulizie e importo finale -----------------------------------
export function votiCompleti(regole) { return { ...VOTI_BASE, ...((regole && regole.voti) || {}) }; }
export function fasciaVoto(regole, voto) {
  const v = votiCompleti(regole);
  if (voto == null || voto === "") return null;
  const n = Number(voto);
  if (n >= v.ottimo.daVoto) return { ...v.ottimo, chiave: "ottimo" };
  if (n >= v.normale.daVoto) return { ...v.normale, chiave: "normale" };
  if (n >= v.scarso.daVoto) return { ...v.scarso, chiave: "scarso" };
  return { ...v.pessimo, chiave: "pessimo" };
}
// L'importo che la signora prende davvero: prezzo base, cambiato dal voto (se c'è)
export function importoFinale(p, regole) {
  // prezzo della camera + le rifiniture fatte quel giorno (prezzo piccolo per ognuna); il voto pesa su tutto
  const base = Number(p.importo || 0) + Number(p.extraRifiniture || 0);
  const f = fasciaVoto(regole, p.voto);
  return f ? Math.round(base * f.perc) / 100 : base;
}

// ---- Controlli tra colleghe -------------------------------------------------
export const PUNTI_CONTROLLO = [
  { id: "letto",     testo: "Letto rifatto bene (lenzuola tese, cuscini a posto)" },
  { id: "bagno",     testo: "Bagno pulito (sanitari, doccia, specchio)" },
  { id: "pavimento", testo: "Pavimento pulito, anche sotto il letto" },
  { id: "polvere",   testo: "Niente polvere (mobili, TV, comodini)" },
  { id: "cestini",   testo: "Cestini vuoti con sacchetto nuovo" },
  { id: "dotazioni", testo: "Asciugamani e dotazioni giuste per le persone" },
  { id: "ordine",    testo: "Tutto in ordine, niente dimenticato" },
  { id: "aria",      testo: "Buon odore, camera arieggiata" },
];
// Le richieste del giorno (dettagli scritti dai proprietari e istruzioni dell'ospite) diventano punti da
// verificare: "frigorifero, doccia muffa" → due caselle. Al massimo 6, per non allungare troppo la lista.
// Spezza un testo libero ("frigorifero, doccia muffa e balcone") nelle singole cose da fare.
export function spezzaRichieste(testo, max = 8) {
  if (!testo || !String(testo).trim()) return [];
  const pezzi = String(testo).split(/\s*(?:·|,|;|\n|\.\s|\s-\s|\se\s|\s\+\s)\s*/i).map(t => t.trim().replace(/^[-•]\s*/, "")).filter(t => t.length >= 3);
  const visti = new Set(); const out = [];
  for (const t of pezzi) { const k = t.toLowerCase(); if (visti.has(k)) continue; visti.add(k); out.push(t.replace(/^./, c => c.toUpperCase())); if (out.length >= max) break; }
  return out;
}
// Le richieste del giorno (dettagli + istruzioni dell'ospite) e le cose "da fare sempre" in quella camera (sempre = testo o elenco)
export function richiesteDaVerificare(p, sempre = []) {
  const fisse = Array.isArray(sempre) ? sempre : spezzaRichieste(sempre);
  const giorno = spezzaRichieste([p?.dettagli || "", p?.istruzioni || ""].filter(Boolean).join(" · "), 6);
  const out = []; const visti = new Set();
  for (const t of fisse) { const k = t.toLowerCase(); if (visti.has(k)) continue; visti.add(k); out.push({ id: "s" + out.length, testo: t, richiesta: true, fissa: true }); }
  for (const t of giorno) { const k = t.toLowerCase(); if (visti.has(k)) continue; visti.add(k); out.push({ id: "r" + out.length, testo: t, richiesta: true }); }
  return out;
}
export function puntiControlloPer(p, sempre = []) { return [...PUNTI_CONTROLLO, ...richiesteDaVerificare(p, sempre)]; }
// Il voto nasce dai punti: tutti e 8 a posto = 10; ogni punto mancante toglie 1 (minimo 2).
// Ogni richiesta del giorno NON fatta toglie altri punti (penalitaRichiesta, di base 3): così si paga meno.
export function votoDaiPunti(punti, lista = PUNTI_CONTROLLO, regole = null) {
  const ok = lista.filter(x => !x.richiesta && punti && punti[x.id]).length;
  const mancanti = lista.filter(x => x.richiesta && !(punti && punti[x.id])).length;
  const pen = Number(votiCompleti(regole).penalitaRichiesta ?? 3);
  return Math.max(1, Math.min(10, 2 + ok - mancanti * pen));
}
export function richiesteNonFatte(punti, lista) { return lista.filter(x => x.richiesta && !(punti && punti[x.id])).map(x => x.testo); }
// Chi fa i controlli questa settimana: la zona scelta dai proprietari, altrimenti a turno
export function zonaControllatrice(impostazioniControlli, chiave, zone) {
  const scelta = impostazioniControlli?.settimane?.[chiave];
  if (scelta) return scelta;
  const rot = (impostazioniControlli?.rotazione && impostazioniControlli.rotazione.length) ? impostazioniControlli.rotazione : zone;
  if (!rot.length) return null;
  const n = Math.floor(daISO(chiave).getTime() / 864e5 / 7);
  return rot[((n % rot.length) + rot.length) % rot.length];
}
// Il voto che conta per la paga: prima quello del proprietario, altrimenti quello della collega
export function votoCheConta(controllo) {
  if (!controllo) return null;
  if (controllo.votoProprietario != null) return Number(controllo.votoProprietario);
  if (controllo.voto != null) return Number(controllo.voto);
  return null;
}
export function controlloNonCorrisponde(controllo, regole) {
  if (!controllo || controllo.voto == null || controllo.votoProprietario == null) return false;
  return Math.abs(Number(controllo.voto) - Number(controllo.votoProprietario)) > (votiCompleti(regole).scartoMassimo ?? 2);
}
// Bonus della controllatrice in una settimana di paga: almeno un controllo fatto e nessuno "che non corrisponde"
export function bonusControllatrice(controlli, zona, chiave, regole) {
  const miei = Object.values(controlli || {}).filter(c => c.zonaControllatrice === zona && c.voto != null && (c.settimana || chiaveSettimana(c.ora || c.data + "T12:00:00")) === chiave);
  if (!miei.length) return { importo: 0, n: 0, perso: false };
  const perso = miei.some(c => controlloNonCorrisponde(c, regole));
  return { importo: perso ? 0 : Number(votiCompleti(regole).bonusControllatrice || 0), n: miei.length, perso };
}
// Richiami: alla signora controllata per voti bassi; alla controllatrice dopo N controlli che non corrispondono
export function richiami(controlli, regole) {
  const v = votiCompleti(regole), out = { controllate: {}, controllatrici: {} };
  for (const c of Object.values(controlli || {})) {
    const voto = votoCheConta(c);
    const f = voto != null ? fasciaVoto(regole, voto) : null;
    if (f?.richiamo) (out.controllate[c.zonaControllata] = out.controllate[c.zonaControllata] || []).push(c);
    if (controlloNonCorrisponde(c, regole)) (out.controllatrici[c.zonaControllatrice] = out.controllatrici[c.zonaControllatrice] || []).push(c);
  }
  out.soglia = v.richiamoDopo ?? 3;
  return out;
}

// ---- Conti ------------------------------------------------------------------
export function pulizieFatte(pulizie, regole, controlli) {
  return Object.values(pulizie).filter(p => p.stato === "fatta").map(p => {
    const c = controlli ? controlli[p.id] : null;
    const voto = votoCheConta(c);
    const pp = { ...p, voto: voto != null ? voto : (p.voto ?? null), settimana: p.settimana || chiaveSettimana(p.ora || p.data + "T12:00:00") };
    pp.finale = importoFinale(pp, regole);
    return pp;
  });
}
export function totaleSettimana(pulizie, zona, chiave, regole, controlli) {
  const l = pulizieFatte(pulizie, regole, controlli).filter(p => p.zona === zona && p.settimana === chiave);
  const bonus = bonusControllatrice(controlli, zona, chiave, regole);
  const pulizieTot = l.reduce((s, p) => s + p.finale, 0);
  return { lista: l.sort((a, b) => (a.ora || "") < (b.ora || "") ? -1 : 1), pulizie: pulizieTot, bonus, totale: pulizieTot + bonus.importo };
}
export function storicoMensile(pulizie, zona, regole, controlli) {
  const mesi = {};
  for (const p of pulizieFatte(pulizie, regole, controlli)) {
    if (p.zona !== zona) continue;
    const m = (p.ora ? partiRoma(p.ora) : null);
    const k = m ? `${m.y}-${String(m.m).padStart(2, "0")}` : meseDi(p.data);
    mesi[k] = mesi[k] || { totale: 0, n: 0, settimane: {} };
    mesi[k].totale += p.finale; mesi[k].n++;
    mesi[k].settimane[p.settimana] = (mesi[k].settimane[p.settimana] || 0) + p.finale;
  }
  // bonus controllatrice per settimana
  for (const k of Object.keys(mesi)) for (const sk of Object.keys(mesi[k].settimane)) { const b = bonusControllatrice(controlli, zona, sk, regole); if (b.importo) { mesi[k].settimane[sk] += b.importo; mesi[k].totale += b.importo; } }
  return mesi;
}
