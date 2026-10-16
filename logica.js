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
  const v = Math.round(Number(n || 0) * 100) / 100;
  return v.toLocaleString("it-IT", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }) + " €"; // 6 €, 6,50 €, 4,80 €
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

// ---- Prezzi: ore standard × tariffa (dalla 0.35, specifiche §14) --------------------------------------------------
// Il listino salvato (impostazioni/listino) si fonde con quello di base. I listini vecchi (prezzi in euro, versione 1)
// portano solo le taglie: i prezzi nuovi sono minuti × tariffa e li decide Michele in Paghe → Orario di base.
export function listinoCompleto(l) {
  const base = JSON.parse(JSON.stringify(LISTINO_BASE));
  if (!l) return base;
  const vecchio = Number(l.versione || 1) < 2;
  const out = vecchio ? { ...base } : { ...base, ...l };
  out.versione = 2;
  out.tariffe = { ...base.tariffe, ...((!vecchio && l.tariffe) || {}) };
  out.minuti = { ...base.minuti, ...((!vecchio && l.minuti) || {}) };
  out.minuti.ripasso = { ...base.minuti.ripasso, ...((!vecchio && l.minuti && l.minuti.ripasso) || {}) };
  out.minuti.totale = { ...base.minuti.totale, ...((!vecchio && l.minuti && l.minuti.totale) || {}) };
  out.taglia = { ...base.taglia, ...(l.taglia || {}) };
  out.perCasa = { ...base.perCasa }; if (!vecchio) for (const [id, v] of Object.entries(l.perCasa || {})) out.perCasa[id] = { ...(base.perCasa[id] || {}), ...(v || {}) };
  out.stelle = { ...base.stelle, ...((!vecchio && l.stelle) || {}) };
  out.controlli = { ...base.controlli, ...((!vecchio && l.controlli) || {}) };
  out.fissi = (!vecchio && Array.isArray(l.fissi)) ? l.fissi : base.fissi;
  out.pagaCol = (!vecchio && l.pagaCol) ? l.pagaCol : base.pagaCol;
  return out;
}
export function tagliaCamera(listino, cameraId) { return listino?.taglia?.[cameraId] === "P" ? "P" : "G"; }
// La tariffa oraria di un posto: appartamenti 10 €, tutto il resto (albergo e via Nazario Sauro) 8 €
export function tariffaDi(listino, camera) { const l = listinoCompleto(listino); return Number(camera && camera.tipo === "casa" ? l.tariffe.appartamenti : l.tariffe.albergo) || 0; }
// I minuti standard di una pulizia in un posto
export function minutiPulizia(listino, camera, tipo) {
  const l = listinoCompleto(listino);
  const voce = TIPI_PULIZIA[tipo]?.prezzo || tipo;
  const speciale = l.perCasa && camera && l.perCasa[camera.id] && l.perCasa[camera.id][voce];
  if (speciale != null) return Number(speciale) || 0;
  const v = l.minuti[voce];
  if (v == null) return 0;
  if (typeof v === "object") return Number(v[tagliaCamera(l, camera && camera.id)] ?? v.G ?? 0);
  return Number(v) || 0;
}
// Arrotonda ai 50 centesimi
export function mezziEuro(x) { return Math.round((Number(x) || 0) * 2) / 2; }
export function euroDaMinuti(minuti, tariffa) { return mezziEuro((Number(minuti) || 0) * (Number(tariffa) || 0) / 60); }
export function prezzoPulizia(listino, camera, tipo) { return euroDaMinuti(minutiPulizia(listino, camera, tipo), tariffaDi(listino, camera)); }
// La pulizia a fondo completa (3 ore standard) al prezzo del posto
export function prezzoFondo(listino, camera) { const l = listinoCompleto(listino); return euroDaMinuti(l.minuti.fondo, tariffaDi(listino, camera)); }
// "3 ore e un quarto", "1 ora e mezza", "45 minuti"
export function testoOre(minuti) {
  const m = Math.round(Number(minuti) || 0); if (m <= 0) return "";
  const h = Math.floor(m / 60), r = m % 60;
  if (!h) return `${r} minuti`;
  const ore = h === 1 ? "1 ora" : `${h} ore`;
  if (r === 0) return ore; if (r === 15) return `${ore} e un quarto`; if (r === 30) return `${ore} e mezza`; if (r === 45) return `${ore} e tre quarti`;
  return `${ore} e ${r} minuti`;
}
// I lavori fissi di una zona in un giorno della settimana (terrazzo, scale e ingresso del sabato…)
export function lavoriFissi(listino, iso) {
  const l = listinoCompleto(listino), wd = giornoSettimana(iso);
  return (l.fissi || []).filter(f => Number(f.giorno) === wd).map(f => ({ ...f, importo: euroDaMinuti(f.minuti, l.tariffe[f.tariffa || "albergo"]) }));
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
        minuti: minutiPulizia(listino, c, p.tipo),
        importo: prezzoPulizia(listino, c, p.tipo) + Number(p.supplemento || 0),
        origine: "auto",
      };
      const conParte = (b, parte) => parte ? { ...b, parte, titolo: `${b.titolo} · ${PARTE_TESTO[parte] || parte}` } : b;
      out.push({ id: `${iso}_${c.id}`, ...conParte(base, p.parte) });
      // le altre parti dello stesso giorno (l'altra signora, l'altro piano): un'altra riga di paga, senza il supplemento dell'ospite
      for (const x of p.altreParti || []) out.push({ id: `${iso}_${c.id}_${x.parte}`, ...conParte({ ...base, zona: x.zona || base.zona, insieme: x.insieme || "", importo: prezzoPulizia(listino, c, p.tipo) }, x.parte) });
    }
    // i lavori fissi della settimana (terrazzo, scale e ingresso del sabato): una riga di paga a ore standard, senza camera
    const inverno = regimeDi(iso, { ...REGOLE_BASE, ...(regole || {}) }) !== "estate";
    if (inverno) for (const f of lavoriFissi(listino, iso)) {
      out.push({ id: `${iso}_fisso_${f.id}`, data: iso, camera: f.luogo || null, zona: f.zona, insieme: "", modo: "", tipo: "fisso", titolo: f.titolo, passi: Array.isArray(f.passi) ? f.passi : [], fisso: f.id,
        ospite: "", soggiorno: null, partenza: false, arrivo: false, parteIl: null, prossimoArrivo: null, prossimoNome: "", prossimoPersone: null, istruzioni: "", persone: null,
        minuti: Number(f.minuti) || 0, importo: f.importo, origine: "auto" });
    }
    // il giro delle stelle nelle altre camere (la signora delle stelle, nei giorni in cui lavora): le stelle le mette la governante
    const l = listinoCompleto(listino), zs = l.zonaStelle;
    if (inverno && zs && Number(l.obiettivoStelle) > 0 && out.some(p => p.data === iso && p.zona === zs)) {
      out.push({ id: `${iso}_stelle_${zs}`, data: iso, camera: "stelle", zona: zs, insieme: "", modo: "", tipo: "stelle", titolo: "Stelle in altre camere", passi: [],
        ospite: "", soggiorno: null, partenza: false, arrivo: false, parteIl: null, prossimoArrivo: null, prossimoNome: "", prossimoPersone: null, istruzioni: "", persone: null,
        minuti: 0, importo: 0, origine: "auto" });
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
    const campi = ["tipo","titolo","ospite","soggiorno","partenza","arrivo","parteIl","prossimoArrivo","prossimoNome","prossimoPersone","istruzioni","importo","minuti","zona","persone","insieme","modo","parte","fisso"];
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
export function votiCompleti(regole) { const v = { ...VOTI_BASE, ...((regole && regole.voti) || {}) }; v.esiti = { ...VOTI_BASE.esiti, ...((regole && regole.voti && regole.voti.esiti) || {}) }; return v; }
export function fasciaVoto(regole, voto) {
  const v = votiCompleti(regole);
  if (voto == null || voto === "") return null;
  const n = Number(voto);
  if (n >= v.ottimo.daVoto) return { ...v.ottimo, chiave: "ottimo" };
  if (n >= v.normale.daVoto) return { ...v.normale, chiave: "normale" };
  if (n >= v.scarso.daVoto) return { ...v.scarso, chiave: "scarso" };
  return { ...v.pessimo, chiave: "pessimo" };
}
// Dalla 0.35 (specifiche §14): l'esito del controllo lo fa l'app contando i "no" della lista (i gravi valgono 2):
// 0 = Bene (tutto pagato) · 1–2 = Così così (quella camera −20%) · 3 o più = Male (−50% e richiamo).
export function esitoDaPunteggio(punteggio, regole) {
  const v = votiCompleti(regole), n = Number(punteggio) || 0;
  return n >= (v.sogliaMale ?? 3) ? "male" : n >= (v.sogliaCosicosi ?? 1) ? "cosicosi" : "bene";
}
export function percEsito(esito, regole) { const v = votiCompleti(regole); return esito && v.esiti[esito] ? Number(v.esiti[esito].perc) : 100; }
export function nomeEsito(esito, regole) { const v = votiCompleti(regole); return esito && v.esiti[esito] ? v.esiti[esito].nome : ""; }
// L'importo che la signora prende davvero per una pulizia: la quota a ore standard, tagliata dall'esito del controllo
// (se il controllo c'è e i "no" non sono stati rifatti in tempo), più le stelle fatte, meno le stelle trovate non fatte
// (non pagate e tolte una seconda volta, se non rifatte entro sabato alle 14).
export function importoFinale(p, regole, controllo = null) {
  const quota = Number(p.importo || 0), stelle = Number(p.extraRifiniture || 0);
  const c = controllo || p.controllo || null;
  if (c && (c.esito || c.esitoProprietario)) {
    const e = esitoChePaga(c, regole);
    const taglio = Math.round(quota * (100 - percEsito(e.esito, regole))) / 100;
    return Math.round((quota - taglio + stelle - e.penaleStelle) * 100) / 100;
  }
  // controlli vecchi (voto 1–10)
  const f = fasciaVoto(regole, p.voto);
  return f ? Math.round((quota + stelle) * f.perc) / 100 : quota + stelle;
}
// L'esito che conta per la paga: prima quello di Michele, poi quello della collega; i "no" rifatti in tempo non contano più.
export function esitoChePaga(c, regole) {
  if (!c) return { esito: null, punteggio: 0, penaleStelle: 0, recuperato: false, stelleNonFatte: [] };
  const mio = c.esitoProprietario != null;
  const punti = mio ? (c.puntiProprietario || {}) : (c.punti || {});
  const lista = c.lista || [];                       // i punti usati (id, grave, richiesta), salvati col controllo
  const rif = c.rifatti || {};
  let punteggio = 0;
  for (const x of lista) { if ((x.richiesta ? !punti[x.id] : punti[x.id] === false) && !rif[x.id]) punteggio += x.grave ? 2 : 1; }
  // senza la lista salvata (controlli fatti da un'altra versione) vale il punteggio scritto
  if (!lista.length) punteggio = Number(mio ? c.punteggioProprietario : c.punteggio) || 0;
  const stelle = mio && c.stelleProprietario ? c.stelleProprietario : (c.stelle || {});
  const nonFatte = Object.entries(stelle).filter(([k, v]) => v && v.ok === false && !rif["stella:" + k]);
  const penaleStelle = nonFatte.reduce((s, [, v]) => s + 2 * (Number(v.euro) || 0), 0);
  const esitoScritto = mio ? c.esitoProprietario : c.esito;
  return { esito: esitoDaPunteggio(punteggio, regole), esitoScritto, punteggio, penaleStelle, recuperato: !!Object.keys(rif).length, stelleNonFatte: nonFatte.map(([k, v]) => ({ k, ...v })) };
}
// Fino a quando si può rifare: la chiusura della settimana di paga di quella pulizia (sabato alle 14, ora di Roma)
export function chiusuraDellaSettimana(chiave, chiusura = REGOLE_BASE.chiusuraPaga) {
  const ore = Number(chiusura.ora ?? 14), giorno = +chiave.slice(8, 10);
  let t = Date.UTC(+chiave.slice(0, 4), +chiave.slice(5, 7) - 1, giorno, ore, 0);
  for (let i = 0; i < 3; i++) { const p = partiRoma(new Date(t)); const diff = ((p.d - giorno) * 24 + p.h - ore) * 60; if (!diff) break; t -= diff * 60000; }
  return new Date(t);
}
export function recuperoAperto(p, regole, adesso = new Date()) {
  const ch = (regole && regole.chiusuraPaga) || REGOLE_BASE.chiusuraPaga;
  const chiave = p.settimana || chiaveSettimana(p.ora || p.data + "T12:00:00", ch);
  return adesso < chiusuraDellaSettimana(chiave, ch);
}

// ---- Controlli tra colleghe -------------------------------------------------
// I punti del controllo (Michele, specifiche §14): si risponde SÌ o NO, foto obbligatoria sul no; i gravi valgono doppio.
// Il decimo punto, "le richieste del giorno di Michele", sono le righe di richiesteDaVerificare (una per richiesta).
export const PUNTI_CONTROLLO = [
  { id: "letto",     grave: true,  icona: "letto",       breve: "Letto",       testo: "Biancheria tesa, senza capelli né macchie; nel cambio, lenzuola pulite davvero" },
  { id: "wc",        grave: true,  icona: "wc",          breve: "WC",          testo: "WC pulito dentro, sotto il bordo e fuori, senza odore" },
  { id: "lavandino", grave: false, icona: "lavandino",   breve: "Lavandino",   testo: "Lavandino, rubinetti e specchio senza aloni e schizzi" },
  { id: "doccia",    grave: true,  icona: "doccia",      breve: "Doccia",      testo: "Niente capelli nella piletta, niente calcare su vetro e piastrelle" },
  { id: "dotazioni", grave: false, icona: "asciugamani", breve: "Asciugamani", testo: "Asciugamani puliti e nel numero giusto, carta igienica e sapone al posto loro" },
  { id: "cestini",   grave: true,  icona: "cestino",     breve: "Cestini",     testo: "Cestini vuoti col sacchetto nuovo, camera e bagno" },
  { id: "polvere",   grave: false, icona: "polvere",     breve: "Polvere",     testo: "Superfici senza polvere: comodini, scrivania, TV, mensole (si passa il dito)" },
  { id: "pavimento", grave: false, icona: "pavimento",   breve: "Pavimento",   testo: "Pavimento lavato, niente briciole o capelli negli angoli e sotto il letto" },
  { id: "finestra",  grave: false, icona: "finestra",    breve: "Finestra",    testo: "Davanzale e vetro senza impronte evidenti, balcone spazzato dove c'è" },
];
// Per scale, ingresso, corridoi e terrazzo (i lavori fissi) la lista è più corta
export const PUNTI_CONTROLLO_COMUNI = [
  { id: "pavimento", grave: false, icona: "pavimento", breve: "Pavimenti", testo: "Pavimenti lavati, senza aloni né briciole negli angoli" },
  { id: "scale",     grave: false, icona: "scale",     breve: "Scale",     testo: "Scale e ringhiera pulite, senza polvere" },
  { id: "ingresso",  grave: false, icona: "porta",     breve: "Ingresso",  testo: "Ingresso, portone e zerbino puliti" },
  { id: "cestini",   grave: true,  icona: "cestino",   breve: "Cestini",   testo: "Cestini e portacenere vuoti" },
];
export function puntiStandardPer(p) { return p && (p.tipo === "fisso" || (p.camera && /^(scale|ingresso|corridoio_|terrazzo|lavanderia)/.test(p.camera))) ? PUNTI_CONTROLLO_COMUNI : PUNTI_CONTROLLO; }
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
export function puntiControlloPer(p, sempre = []) { return [...puntiStandardPer(p), ...richiesteDaVerificare(p, sempre)]; }
// Il punteggio del controllo: ogni "no" 1 punto, i gravi 2, ogni richiesta del giorno non fatta 1 (punti[id] === false = no; true = sì; assente = non risposto)
export function punteggioControllo(punti, lista) { let n = 0; for (const x of lista) { const v = punti ? punti[x.id] : undefined; if (x.richiesta ? !v : v === false) n += x.grave ? 2 : 1; } return n; }
export function puntiSenzaRisposta(punti, lista) { return lista.filter(x => !x.richiesta && (!punti || punti[x.id] == null)); }
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
    pp.finale = importoFinale(pp, regole, c);
    pp.esito = c && (c.esito || c.esitoProprietario) ? esitoChePaga(c, regole) : null;
    return pp;
  });
}
// I controlli fatti da una signora (come controllatrice) in una settimana di paga: 2,50 € l'uno, persi se Michele la smentisce
export function controlliFattiSettimana(controlli, zona, chiave, listino) {
  const l = listinoCompleto(listino), euro = Number(l.controllo) || 0;
  const miei = Object.values(controlli || {}).filter(c => c.zonaControllatrice === zona && (c.esito || c.voto != null) && (c.settimana || chiaveSettimana(c.ora || c.data + "T12:00:00")) === chiave);
  const smentiti = miei.filter(c => c.smentito).length;
  return { n: miei.length, smentiti, importo: Math.max(0, miei.length - smentiti) * euro, lista: miei };
}
export function totaleSettimana(pulizie, zona, chiave, regole, controlli, listino = null) {
  const l = pulizieFatte(pulizie, regole, controlli).filter(p => p.zona === zona && p.settimana === chiave);
  const bonus = bonusControllatrice(controlli, zona, chiave, regole);
  const ctrl = controlliFattiSettimana(controlli, zona, chiave, listino);
  let ore = 0, stelle = 0, tagli = 0, minuti = 0;
  for (const p of l) {
    const quota = Number(p.importo || 0), st = Number(p.extraRifiniture || 0);
    ore += quota; stelle += st; minuti += Number(p.minuti) || 0;
    tagli += Math.round((quota + st - p.finale) * 100) / 100;
  }
  const pulizieTot = l.reduce((s, p) => s + p.finale, 0);
  const totale = Math.round((pulizieTot + bonus.importo + ctrl.importo) * 100) / 100;
  return { lista: l.sort((a, b) => (a.ora || "") < (b.ora || "") ? -1 : 1), pulizie: pulizieTot, ore: Math.round(ore * 100) / 100, stelle: Math.round(stelle * 100) / 100, tagli: Math.round(tagli * 100) / 100, minuti, controlliFatti: ctrl, bonus, totale };
}
export function storicoMensile(pulizie, zona, regole, controlli, listino = null) {
  const mesi = {};
  for (const p of pulizieFatte(pulizie, regole, controlli)) {
    if (p.zona !== zona) continue;
    const m = (p.ora ? partiRoma(p.ora) : null);
    const k = m ? `${m.y}-${String(m.m).padStart(2, "0")}` : meseDi(p.data);
    mesi[k] = mesi[k] || { totale: 0, n: 0, settimane: {} };
    mesi[k].totale += p.finale; mesi[k].n++;
    mesi[k].settimane[p.settimana] = (mesi[k].settimane[p.settimana] || 0) + p.finale;
  }
  // bonus (vecchio) e controlli fatti, per settimana
  for (const k of Object.keys(mesi)) for (const sk of Object.keys(mesi[k].settimane)) { const b = bonusControllatrice(controlli, zona, sk, regole), c = controlliFattiSettimana(controlli, zona, sk, listino); const piu = b.importo + c.importo; if (piu) { mesi[k].settimane[sk] += piu; mesi[k].totale += piu; } }
  return mesi;
}

// ---- I controlli incrociati (0.35): chi controlla cosa, oggi ---------------------------------------------------------
// Le camere da controllare le sceglie l'app a sorte la mattina stessa (stabile per tutto il giorno), tra le pulizie FATTE
// dall'altra signora negli ultimi 2 giorni, in albergo, non ancora controllate e della settimana di paga ancora aperta;
// preferisce le camere con le stelle dentro e le più recenti. Quante al giorno: LISTINO.controlli[zona][giorno].
export function hashTesto(t) { let h = 2166136261; for (const ch of String(t)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
export function giornoRoma(istante) { const p = partiRoma(istante); return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`; }
export function controlliDaFare({ zona, iso, listino, pulizie = {}, controlli = {}, camere = [], regole = null, adesso = new Date() }) {
  const l = listinoCompleto(listino); let quota = Number(((l.controlli || {})[zona] || {})[giornoSettimana(iso)] || 0);
  if (l.sospesi && l.sospesi[zona] && l.sospesi[zona] >= iso) quota = 0; // i controlli di questa signora sono fermi (smentite): li fa Michele
  const fattiOggi = Object.values(controlli).filter(c => c.zonaControllatrice === zona && (c.esito || c.voto != null) && c.ora && giornoRoma(c.ora) === iso);
  const giaFatti = new Set(Object.values(controlli).filter(c => c.esito || c.voto != null).map(c => c.pulizia));
  const casa = new Set(camere.filter(c => c.tipo === "casa").map(c => c.id));
  const da = aggiungiGiorni(iso, -2);
  const quando = p => { try { return p.ora ? giornoRoma(p.ora) : p.data; } catch (e) { return p.data; } }; // il giorno in cui è stata chiusa col Fatto
  const candidati = Object.values(pulizie).filter(p => p && p.stato === "fatta" && p.zona !== zona && p.zona && quando(p) >= da && quando(p) <= iso && !casa.has(p.camera) && p.origine !== "governante" && p.tipo !== "extra" && !giaFatti.has(p.id) && recuperoAperto(p, regole, adesso))
    .map(p => ({ p, stelle: (p.rifiniture || []).filter(r => r.euro).length, h: hashTesto(`${iso}|${zona}|${p.id}`) }))
    .sort((a, b) => (b.stelle > 0) - (a.stelle > 0) || (quando(a.p) < quando(b.p) ? 1 : quando(a.p) > quando(b.p) ? -1 : 0) || a.h - b.h);
  const n = Math.max(0, quota - fattiOggi.length);
  return { quota, fattiOggi, daFare: candidati.slice(0, n).map(x => x.p), altre: candidati.slice(n).map(x => x.p) };
}
// Le cose bocciate da rifare (per la signora controllata): punti "no" e stelle non fatte, non ancora rifatti, con la settimana aperta
export function daRifare(controlli, zona, regole, adesso = new Date()) {
  const out = [];
  for (const c of Object.values(controlli || {})) {
    if (c.zonaControllata !== zona || !(c.esito || c.esitoProprietario)) continue;
    if (!recuperoAperto({ settimana: c.settimana, ora: c.ora, data: c.data }, regole, adesso)) continue;
    const mio = c.esitoProprietario != null, punti = mio ? (c.puntiProprietario || {}) : (c.punti || {}), rif = c.rifatti || {};
    const voci = [];
    for (const x of c.lista || []) { const no = x.richiesta ? !punti[x.id] : punti[x.id] === false; if (no && !rif[x.id]) voci.push({ id: x.id, testo: x.testo || x.id, grave: !!x.grave, tipo: "punto" }); }
    const stelle = mio && c.stelleProprietario ? c.stelleProprietario : (c.stelle || {});
    for (const [k, v] of Object.entries(stelle)) if (v && v.ok === false && !rif["stella:" + k]) voci.push({ id: "stella:" + k, testo: v.testo || k, euro: v.euro, tipo: "stella" });
    if (voci.length) out.push({ controllo: c, voci, scade: chiusuraDellaSettimana(c.settimana || chiaveSettimana(c.ora || c.data + "T12:00:00", (regole && regole.chiusuraPaga) || REGOLE_BASE.chiusuraPaga), (regole && regole.chiusuraPaga) || REGOLE_BASE.chiusuraPaga) });
  }
  return out.sort((a, b) => (a.controllo.data < b.controllo.data ? 1 : -1));
}
