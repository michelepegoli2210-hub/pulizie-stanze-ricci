// ============================================================================
//  1.30.0 · IL CHANNEL MANAGER GRATIS (8/11 notte, Michele: «per adesso il channel manager lo voglio gratis»; «un
//  calendario… che mi dica se l'affitto è diretto, Booking, Airbnb oppure Expedia»).
//  LEGGERE: ogni ora il giro scarica i calendari (iCal) collegati nell'app (importazioni/canali.calendari: uno per camera
//  e per sito) e mette nel prospetto le date prese, come soggiorni «Booking.com» / «Airbnb» / «Expedia» col loro canale
//  (i calendari non danno il nome del cliente). Se il cliente cambia le date si aggiornano; se cancella, il soggiorno
//  sparisce (solo quelli arrivati dal calendario, e solo da oggi in poi). Se le date coincidono (±1 giorno) con un
//  soggiorno già messo a mano nella stessa camera, è lo stesso cliente: a quello si mette solo il canale. Se invece si
//  accavallano con un altro cliente → «camera presa due volte»: la scheda nell'app lo dice in rosso e a Michele arriva
//  un avviso (una volta sola per ogni caso).
//  DARE: i nostri calendari (le date prese di ogni camera, da qualunque canale) vanno alla cassetta su Google, che li
//  serve a Booking, Airbnb ed Expedia con un link per camera (copia-sicurezza.gs, «calendari»): così chiudono da soli le
//  date prese da noi. Si mandano solo quando cambiano.
//  Nel registro pubblico di GitHub: solo quanti calendari, quante prenotazioni; mai indirizzi né nomi.
// ============================================================================
import { createHash } from "node:crypto";

export const OGNI_MS = 55 * 60 * 1000;
export const CANALI_SITI = ["booking", "airbnb", "expedia"];
const NOME = { booking: "Booking.com", airbnb: "Airbnb", expedia: "Expedia" };
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const corto = (s) => createHash("sha1").update(String(s)).digest("hex").slice(0, 12);
const giorni = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
const piu = (iso, n) => new Date(Date.parse(iso + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);

// ---- il formato iCal: righe piegate, VEVENT con DTSTART/DTEND (giorno intero o con l'ora), UID, SUMMARY ------------------
function giornoDa(v) {
  const m = String(v || "").match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
  if (!m) return "";
  if (!m[4] || !m[7]) return `${m[1]}-${m[2]}-${m[3]}`;   // giorno intero, o ora già locale: vale il giorno scritto
  // con l'ora in UTC (Z): il giorno di Roma (contano arrivo e partenza, non l'ora)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])));
}
export function leggiIcs(testo) {
  const righe = String(testo || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const ev = []; let cur = null;
  for (const r of righe) {
    if (/^BEGIN:VEVENT/i.test(r)) { cur = {}; continue; }
    if (/^END:VEVENT/i.test(r)) { if (cur) ev.push(cur); cur = null; continue; }
    if (!cur) continue;
    const i = r.indexOf(":"); if (i < 0) continue;
    const chiave = r.slice(0, i).split(";")[0].toUpperCase(), valore = r.slice(i + 1).trim();
    if (chiave === "DTSTART") cur.inizio = giornoDa(valore);
    else if (chiave === "DTEND") cur.fine = giornoDa(valore);
    else if (chiave === "UID") cur.uid = valore.slice(0, 200);
    else if (chiave === "SUMMARY") cur.titolo = valore.replace(/\\,/g, ",").replace(/\\n/gi, " ").slice(0, 120);
    else if (chiave === "STATUS") cur.stato = valore.toUpperCase();
  }
  for (const e of ev) if (e.inizio && (!e.fine || e.fine <= e.inizio)) e.fine = piu(e.inizio, 1);   // senza fine: una notte
  return ev.filter(e => ISO.test(e.inizio || "") && ISO.test(e.fine || ""));
}
// le date che contano: da ieri a un anno e mezzo; via le cancellate e, su Airbnb, i giorni chiusi a mano (non sono clienti)
export function eventiUtili(ev, oggi, canale) {
  const da = piu(oggi, -1), a = piu(oggi, 550);
  return ev.filter(e => e.fine > da && e.inizio < a && e.stato !== "CANCELLED" && !(canale === "airbnb" && /not available|non disponibile|blocked|bloccat/i.test(e.titolo || ""))).slice(0, 400);
}

export function calendariDovuti(conf, adesso) {
  if (!conf || !conf.calendari || !Object.keys(conf.calendari).length) return false;
  const ultimo = Date.parse(conf.ultimoGiro || "") || 0, chiesto = Date.parse(conf.subito || "") || 0;
  return chiesto > ultimo || adesso.getTime() - ultimo >= OGNI_MS;
}

export async function leggiCalendari({ db, adesso, oggi, scarica, avvisa = null }) {
  const conf = await db.doc("importazioni", "canali");
  if (!calendariDovuti(conf, adesso)) return null;
  const iso = adesso.toISOString();
  const sog = (await db.soggiorniDa(oggi)) || {};
  const abbinati = { ...((conf && conf.abbinati) || {}) };
  const statoPrima = (conf && conf.stato) || {}, stato = {}, ops = [];
  let letti = 0, prenotazioni = 0, nuovi = 0, cambiati = 0, tolti = 0, errori = 0;
  const finali = { ...sog };   // com'è il prospetto dopo questo giro (per i doppioni)
  for (const [id, c] of Object.entries(conf.calendari || {})) {
    if (!c || !CANALI_SITI.includes(c.canale) || !c.camera || !/^https:\/\/[^\s]+$/.test(String(c.url || ""))) continue;
    let testo = "";
    try { testo = await scarica(c.url); } catch (e) { testo = ""; }
    if (!/BEGIN:VCALENDAR/i.test(testo)) { errori++; stato[id] = { ...(statoPrima[id] || {}), errore: testo ? "il link non dà un calendario" : "il sito non risponde", tentativo: iso }; continue; }
    letti++;
    const ev = eventiUtili(leggiIcs(testo), oggi, c.canale);
    prenotazioni += ev.length;
    const visti = new Set();
    for (const e of ev) {
      const sid = `cal_${id}_${corto(e.uid || `${e.inizio}|${e.fine}`)}`;
      visti.add(sid);
      const gia = sog[sid];
      if (gia) {
        if (gia.inizio !== e.inizio || gia.fine !== e.fine) { ops.push({ tipo: "aggiorna", coll: "soggiorni", id: sid, dati: { inizio: e.inizio, fine: e.fine, modificato: iso } }); finali[sid] = { ...gia, inizio: e.inizio, fine: e.fine }; cambiati++; }
        continue;
      }
      if (abbinati[sid] && sog[abbinati[sid]]) continue;   // già riconosciuto come uno messo a mano
      const stesso = Object.values(sog).find(s => s && s.camera === c.camera && s.origine !== "calendario" && Math.abs(giorni(s.inizio, e.inizio)) <= 1 && Math.abs(giorni(s.fine, e.fine)) <= 1);
      if (stesso) {
        abbinati[sid] = stesso.id;
        if (stesso.canale !== c.canale) { ops.push({ tipo: "aggiorna", coll: "soggiorni", id: stesso.id, dati: { canale: c.canale } }); finali[stesso.id] = { ...stesso, canale: c.canale }; }
        continue;
      }
      const dati = { camera: c.camera, nome: NOME[c.canale], inizio: e.inizio, fine: e.fine, tipo: "altro", persone: 2, nota: "", canale: c.canale, origine: "calendario", calId: id, uid: String(e.uid || "").slice(0, 200), creato: iso, dubbio: false, motivi: [] };
      ops.push({ coll: "soggiorni", id: sid, dati }); finali[sid] = { id: sid, ...dati }; nuovi++;
    }
    // cancellati sul sito: via dal prospetto (solo quelli arrivati da questo calendario, da oggi in poi)
    for (const s of Object.values(sog)) if (s && s.origine === "calendario" && s.calId === id && !visti.has(s.id) && s.fine > oggi) { ops.push({ tipo: "cancella", coll: "soggiorni", id: s.id }); delete finali[s.id]; tolti++; }
    stato[id] = { letto: iso, n: ev.length, errore: "" };
  }
  if (ops.length) await db.scrivi(ops);
  // le camere prese due volte: un soggiorno dal calendario che si accavalla con un altro cliente nella stessa camera
  const lista = Object.values(finali).filter(s => s && s.camera && s.inizio && s.fine && s.fine > oggi);
  const conflitti = [];
  for (const s of lista) {
    if (s.origine !== "calendario") continue;
    const con = lista.filter(x => x.id !== s.id && x.camera === s.camera && x.inizio < s.fine && s.inizio < x.fine && !(x.origine === "calendario" && x.calId === s.calId));
    if (con.length) conflitti.push({ k: `${s.camera}|${s.inizio}|${s.fine}|${s.canale}`, camera: s.camera, inizio: s.inizio, fine: s.fine, canale: s.canale, con: con.map(x => x.nome || "un cliente").join(", ").slice(0, 80) });
  }
  const giaAvvisati = new Set(Array.isArray(conf.avvisati) ? conf.avvisati : []), nuoviConflitti = conflitti.filter(x => !giaAvvisati.has(x.k));
  if (avvisa) for (const x of nuoviConflitti) { try { await avvisa(x); } catch (e) {} }
  await db.merge("importazioni", "canali", { stato: { ...statoPrima, ...stato }, ultimoGiro: iso, conflitti, abbinati, avvisati: [...new Set([...giaAvvisati, ...nuoviConflitti.map(x => x.k)])].slice(-200) });
  const pezzi = [`${letti} ${letti === 1 ? "calendario letto" : "calendari letti"}`];
  if (nuovi) pezzi.push(`${nuovi} ${nuovi === 1 ? "prenotazione nuova" : "prenotazioni nuove"}`);
  if (cambiati) pezzi.push(`${cambiati} con le date cambiate`);
  if (tolti) pezzi.push(`${tolti} ${tolti === 1 ? "cancellata" : "cancellate"}`);
  if (errori) pezzi.push(`${errori} non ${errori === 1 ? "risponde" : "rispondono"}`);
  if (conflitti.length) pezzi.push(`${conflitti.length} ${conflitti.length === 1 ? "camera presa due volte" : "camere prese due volte"}`);
  return { esito: `calendari: ${pezzi.join(", ")}`, letti, prenotazioni, nuovi, cambiati, tolti, errori, conflitti: conflitti.length, nuoviConflitti: nuoviConflitti.length };
}

// ---- i nostri calendari alla cassetta (solo quando cambiano) ---------------------------------------------------------------
export function calendariNostri(soggiorni, oggi) {
  const camere = {};
  for (const s of Object.values(soggiorni || {})) {
    if (!s || !s.camera || !ISO.test(s.inizio || "") || !ISO.test(s.fine || "") || s.fine <= oggi || s.fine <= s.inizio) continue;
    (camere[s.camera] = camere[s.camera] || []).push([s.inizio, s.fine, CANALI_SITI.includes(s.canale) ? s.canale : "diretto"]);
  }
  for (const k of Object.keys(camere)) camere[k] = camere[k].sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0).slice(0, 150);
  return camere;
}
export async function mandaCalendari({ db, oggi, manda, cassetta, conf, soggiorni }) {
  if (!cassetta || !cassetta.pronta || !cassetta.url || !cassetta.segreto || !conf || !conf.chiave) return null;
  const camere = calendariNostri(soggiorni, oggi);
  const impronta = corto(JSON.stringify(camere) + conf.chiave);
  if (impronta === conf.calImpronta) return null;
  const r = await manda(cassetta.url, { azione: "calendari", segreto: cassetta.segreto, chiave: conf.chiave, camere });
  if (!r || !r.ok) return { esito: `i nostri calendari: non mandati (${String((r && r.errore) || "la cassetta non risponde").replace(/https?:\/\/\S+/g, "(indirizzo)").slice(0, 80)})` };
  await db.merge("importazioni", "canali", { calImpronta: impronta, calMandati: new Date().toISOString() });
  return { esito: `i nostri calendari: aggiornati (${Object.keys(camere).length} camere)` };
}

// il calendario vero, scaricato da internet (testo; al massimo 2 MB)
export async function scaricaCalendario(url, ms = 20000) {
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { redirect: "follow", signal: ac.signal, headers: { "User-Agent": "LeStanzeDiRicci-Calendari/1.0", "Accept": "text/calendar, text/plain, */*" } });
    if (!r.ok) return "";
    const t = await r.text();
    return t.length > 2 * 1024 * 1024 ? t.slice(0, 2 * 1024 * 1024) : t;
  } catch (e) { return ""; }
  finally { clearTimeout(tm); }
}
