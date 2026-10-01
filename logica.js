// ============================================================================
//  LOGICA  ·  date, settimana di paga, prezzi e piano delle pulizie
//  Funzioni "pure": prendono dati, restituiscono risultati. Niente rete.
// ============================================================================
import { TIPI_PULIZIA, REGOLE_BASE, LISTINO_BASE, VOTI_BASE } from "./regole.js";

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
  return out;
}
export function tagliaCamera(listino, cameraId) { return listino?.taglia?.[cameraId] === "P" ? "P" : "G"; }
export function prezzoPulizia(listino, camera, tipo) {
  const l = listinoCompleto(listino);
  const voce = TIPI_PULIZIA[tipo]?.prezzo || tipo;
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

// ---- Piano delle pulizie ---------------------------------------------------
// Decide che pulizia va fatta in una camera in un certo giorno, secondo le regole.
// Restituisce null se quel giorno non c'è niente da fare.
export function pulizia_prevista(camera, iso, soggiorni, regole = REGOLE_BASE, note = []) {
  const r = { ...REGOLE_BASE, ...(regole || {}) };
  const occ = ospiteIl(soggiorni, camera.id, iso);
  const parte = parteIl(soggiorni, camera.id, iso);
  const wd = giornoSettimana(iso);
  const lista = (camera.tipo === "casa" ? r.casa : r.camera) || [];
  const regola = lista.find(x => x.giorno === wd);
  let tipo = null;
  if (occ && regola) tipo = regola.tipo;
  if (parte && r.totaleAllaPartenza) tipo = camera.tipo === "casa" ? "totale_casa" : "totale";
  if (!tipo) return null;
  const chi = occ || parte;
  const notePubbliche = note.filter(n => n.camera === camera.id && n.data === iso && !n.privata).map(n => n.testo);
  return {
    tipo,
    titolo: TIPI_PULIZIA[tipo]?.titolo || tipo,
    passi: TIPI_PULIZIA[tipo]?.passi || [],
    ospite: chi?.nome || "",
    soggiorno: chi?.id || null,
    partenza: !!parte,
    arrivo: !!arrivaIl(soggiorni, camera.id, iso),
    istruzioni: [chi?.nota || "", ...notePubbliche].filter(Boolean).join(" · "),
    persone: chi?.persone || null,
    supplemento: Number(chi?.supplemento || 0),
  };
}

// Costruisce l'elenco completo delle pulizie "attese" in un intervallo di giorni.
export function pianoPulizie(camere, soggiorni, regole, listino, da, a, note = []) {
  const out = [];
  for (let iso = da; iso <= a; iso = aggiungiGiorni(iso, 1)) {
    for (const c of camere) {
      const p = pulizia_prevista(c, iso, soggiorni, regole, note);
      if (!p) continue;
      out.push({
        id: `${iso}_${c.id}`,
        data: iso, camera: c.id, zona: c.zona,
        tipo: p.tipo, titolo: p.titolo, passi: p.passi,
        ospite: p.ospite, soggiorno: p.soggiorno, partenza: p.partenza, arrivo: p.arrivo,
        istruzioni: p.istruzioni, persone: p.persone,
        importo: prezzoPulizia(listino, c, p.tipo) + Number(p.supplemento || 0),
        origine: "auto",
      });
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
    const campi = ["tipo","titolo","ospite","soggiorno","partenza","arrivo","istruzioni","importo","zona","persone"];
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
  const base = Number(p.importo || 0);
  const f = fasciaVoto(regole, p.voto);
  return f ? Math.round(base * f.perc) / 100 : base;
}

// ---- Conti ------------------------------------------------------------------
export function pulizieFatte(pulizie, regole) {
  return Object.values(pulizie).filter(p => p.stato === "fatta").map(p => ({ ...p, settimana: p.settimana || chiaveSettimana(p.ora || p.data + "T12:00:00"), finale: importoFinale(p, regole) }));
}
export function totaleSettimana(pulizie, zona, chiave, regole) {
  const l = pulizieFatte(pulizie, regole).filter(p => p.zona === zona && p.settimana === chiave);
  return { lista: l.sort((a, b) => (a.ora || "") < (b.ora || "") ? -1 : 1), totale: l.reduce((s, p) => s + p.finale, 0) };
}
export function storicoMensile(pulizie, zona, regole) {
  const mesi = {};
  for (const p of pulizieFatte(pulizie, regole)) {
    if (p.zona !== zona) continue;
    const m = (p.ora ? partiRoma(p.ora) : null);
    const k = m ? `${m.y}-${String(m.m).padStart(2, "0")}` : meseDi(p.data);
    mesi[k] = mesi[k] || { totale: 0, n: 0, settimane: {} };
    mesi[k].totale += p.finale; mesi[k].n++;
    mesi[k].settimane[p.settimana] = (mesi[k].settimane[p.settimana] || 0) + p.finale;
  }
  return mesi;
}
