// ============================================================================
//  1.75.0 · LA POSTA DELL'ALBERGO PER SOFIA SEGRETARIA (Michele, 10/11: «essendo dell'albergo questa email Sofia deve avere
//  l'accesso h24 … anzi Sofia segretaria deve fare questo»).
//  La «casella» (casella-albergo.gs) sta nell'account Google dell'albergo e SOLO LEGGE (permesso Gmail «sola lettura»).
//  A ogni giro (ogni 10 minuti) le mail nuove della scheda «Principale» entrano nella posta di Sofia come messaggi della
//  chat «Email albergo»: Sofia segretaria le legge come le chat (nomi degli ospiti in codice, telefoni ed email mai all'IA)
//  e scrive in Segreteria cosa è arrivato e cosa c'è da fare. Non manda e non cancella niente: le risposte le manda Michele.
//  Indirizzo e segreto li salva l'app quando Michele la collega (importazioni/posta-albergo, solo i proprietari li leggono);
//  qui si scrive com'è andata (ultimoTs, ultimoGiro, quante, errore). Nel registro di GitHub, che tutti possono leggere,
//  niente indirizzi né testi: solo «posta albergo: N mail» o l'errore generico.
//  1.36.0 (app 1.84.2) · Michele, 15/11: «mi raccomando le email devono avere una notifica più specifica». Ogni mail nuova
//  va anche in «avvisare» (importazioni/posta-albergo): il giro manda a Michele una notifica per mail, con chi scrive,
//  l'oggetto e l'inizio del testo (notificheEmail); di notte aspettano le 6:30; più vecchie di 2 giorni non si avvisano più.
//  1.38.0 (app 1.95.0) · Michele, 17/11: «quando mi arriva una prenotazione a me il telefono deve proprio vibrare, suonare».
//  Un'email di prenotazione (L.emailPrenotazione, logica.js: la Ciclovia Adriatica, Booking, Expedia, Airbnb, o chiunque scriva
//  «richiesta di prenotazione» nell'oggetto) ha la sua notifica, sempre una per email: «🛎️ Richiesta di prenotazione · Ciclovia
//  Adriatica», che vibra e resta sul telefono finché non la tocca (vibra: true, come «Da fare tu»), con «⏳ Rispondi entro…»
//  quando il sito dà un tempo per rispondere (la Ciclovia: 12 ore dalle 7 alle 21). Di notte aspetta le 6:30 come le altre.
//  1.41.0 (app 1.108.0, casella 3) · Michele, 20/11: «appena apro la notifica… Sofia segretaria… che mi propone di leggerlo» e
//  «essenziale è che io possa leggere anche tutti gli allegati dall'applicazione». Ogni mail porta l'elenco dei suoi allegati
//  (files: parte, nome, tipo, KB; li legge allegati-giro.mjs) e la notifica di una mail porta a quella mail (rif «email_<id>»).
// ============================================================================
import * as L from "../logica.js";
export const URL_CASELLA = /^https:\/\/script\.google\.com\/(?:a\/[^/]+\/)?macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;
const SEGRETO = /^[A-Za-z0-9_-]{24,80}$/;
export const CHAT_EMAIL = "Email albergo";
const ID = /^[A-Za-z0-9_-]{4,64}$/;
const MAX_TESTO = 1800, PRIMA_VOLTA_MS = 24 * 3600 * 1000, MAX_AVVISARE = 20, AVVISARE_MS = 48 * 3600 * 1000;

export const casellaPronta = (c) => !!(c && c.pronta && URL_CASELLA.test(String(c.url || "")) && SEGRETO.test(String(c.segreto || "")));

export async function chiediCasella(url, corpo, ms, fetchFn) { return chiedi(url, corpo, ms, fetchFn); }   // 1.41.0: anche per gli allegati
async function chiedi(url, corpo, ms, fetchFn) {
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetchFn(url, { method: "POST", body: JSON.stringify(corpo), headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", signal: ac.signal });
    const testo = await r.text();
    try { const j = JSON.parse(testo); return j && typeof j === "object" ? j : { ok: false, errore: "risposta strana dalla casella" }; }
    catch (e) { return { ok: false, errore: `risposta strana dalla casella (${r.status})` }; }
  } catch (e) { return { ok: false, errore: e && e.name === "AbortError" ? "la casella non ha risposto in tempo" : "la casella non risponde" }; }
  finally { clearTimeout(tm); }
}

// data e ora di Roma di un istante (come il ponte: data «AAAA-MM-GG», ora «HH:MM»)
export function dataOraRoma(ts) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(ts)).map(x => [x.type, x.value]));
  return { data: `${p.year}-${p.month}-${p.day}`, ora: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}

// 1.41.0: l'elenco degli allegati (dalla casella 3): la «parte» per chiederlo, il nome, il tipo, quanto pesa
export function filesDi(l) {
  return (Array.isArray(l) ? l : []).filter(f => f && /^[0-9.]{1,20}$/.test(String(f.p || "")) && String(f.n || "").trim()).slice(0, 10)
    .map(f => ({ p: String(f.p), n: String(f.n).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 120), t: String(f.t || "").toLowerCase().slice(0, 80), kb: Math.max(0, Math.round(Number(f.kb) || 0)) }));
}
// quanti allegati ha una mail: la casella 3 dà l'elenco (senza le immagini piccole dentro il testo, come i loghi delle firme);
// la casella di prima solo il numero di tutti i file
export const quantiAllegati = (m) => (Array.isArray(m && m.files) ? filesDi(m.files).length : Number(m && m.allegati) || 0);
// una mail della casella → un messaggio della posta di Sofia
export function mailInPosta(m) {
  const ts = Number(m && m.ts) || 0;
  if (!m || !ID.test(String(m.id || "")) || !ts) return null;
  const { data, ora } = dataOraRoma(ts);
  const chi = String(m.chi || m.dominio || "?").replace(/[<>]/g, "").slice(0, 80);
  const oggetto = String(m.oggetto || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const all = quantiAllegati(m);   // 1.41.0: con la casella 3 gli allegati veri (non le immagini dentro il testo)
  const corpo = String(m.testo || "").trim();
  const testo = `✉️ ${oggetto || "(senza oggetto)"}${all ? ` · 📎 ${all} ${all === 1 ? "allegato" : "allegati"}` : ""}${corpo ? "\n" + corpo : ""}`.slice(0, MAX_TESTO + 260);
  const files = filesDi(m.files);   // 1.41.0
  return { id: "email_" + String(m.id), dati: { chat: CHAT_EMAIL, gruppo: true, chi, mio: false, ts, data, ora, tipo: "testo", testo, da: "email", dominio: String(m.dominio || "").slice(0, 80), ...(files.length ? { files, allegatiStato: "da-leggere" } : {}) } };
}

// 1.36.0: le mail da avvisare a Michele, in una riga sola e corte (la notifica non è il posto per tutta la mail)
const unaRiga = (s) => String(s || "").replace(/\s+/g, " ").trim();
function taglia(s, n) {
  s = unaRiga(s);
  if (s.length <= n) return s;
  const pz = s.slice(0, n), i = pz.lastIndexOf(" ");
  return (i > n * 0.6 ? pz.slice(0, i) : pz).replace(/[\s,.;:–-]+$/, "") + "…";
}
export function perAvviso(m) {
  return { id: String(m.id), ts: Number(m.ts) || 0, chi: String(m.chi || m.dominio || "").replace(/[<>]/g, "").trim().slice(0, 60),
    oggetto: taglia(m.oggetto, 140), inizio: taglia(m.testo, 220), allegati: quantiAllegati(m), dominio: String(m.dominio || "").toLowerCase().slice(0, 80) };   // 1.38.0: il dominio, per riconoscere il sito di prenotazione
}
// quelle che aspettavano più le nuove (senza doppioni), in ordine, al massimo 20, non più vecchie di 2 giorni
export function daAvvisare(c, mail, ora) {
  const prima = (Array.isArray(c && c.avvisare) ? c.avvisare : []).filter(x => x && ID.test(String(x.id || "")) && Number(x.ts) > 0);
  const visti = new Set(prima.map(x => String(x.id)));
  const nuove = (Array.isArray(mail) ? mail : []).filter(m => m && ID.test(String(m.id || "")) && Number(m.ts) > 0 && !visti.has(String(m.id))).map(perAvviso);
  return [...prima, ...nuove].filter(x => ora - Number(x.ts) <= AVVISARE_MS).sort((x, y) => Number(x.ts) - Number(y.ts)).slice(-MAX_AVVISARE);
}
// le notifiche: fino a 3 mail una per mail («📧 Email da …»), di più una sola con l'elenco
export function notificheEmail(lista, adesso = new Date()) {
  const l = (Array.isArray(lista) ? lista : []).filter(x => x && ID.test(String(x.id || ""))).sort((x, y) => (Number(x.ts) || 0) - (Number(y.ts) || 0));
  if (!l.length) return [];
  const oggi = dataOraRoma(adesso.getTime()).data, ieri = dataOraRoma(adesso.getTime() - 24 * 3600 * 1000).data;
  const quando = (x) => {
    const { data, ora } = dataOraRoma(Number(x.ts) || adesso.getTime());
    if ((data === oggi && ora < "06:30") || (data === ieri && ora >= "22:30")) return `🌙 È arrivata stanotte alle ${ora}`;
    if (data === oggi) return `🕐 È arrivata alle ${ora}`;
    if (data === ieri) return `🕐 È arrivata ieri alle ${ora}`;
    return `🕐 È arrivata il ${data.slice(8)}/${data.slice(5, 7)} alle ${ora}`;
  };
  const chi = (x) => unaRiga(x.chi) || "qualcuno";
  // 1.38.0: le prenotazioni, una notifica per ognuna, che vibra e resta; le altre email come prima
  const pren = l.map(x => ({ x, c: L.emailPrenotazione(x) })).filter(y => y.c);
  if (pren.length) {
    const entro = (y) => {
      if (!y.c.oreRisposta) return "";
      const sc = L.scadenzaRisposta(Number(y.x.ts) || adesso.getTime(), y.c.oreRisposta); if (!sc || sc <= adesso.getTime()) return "";
      const d = dataOraRoma(sc), domani = dataOraRoma(adesso.getTime() + 24 * 3600 * 1000).data;
      return `⏳ Rispondi entro ${d.data === oggi ? "oggi" : d.data === domani ? "domani" : `il ${d.data.slice(8)}/${d.data.slice(5, 7)}`} alle ${d.ora}`;
    };
    const mie = pren.map(y => ({
      titolo: `${y.c.annullata ? "❌ Prenotazione annullata" : y.c.richiesta ? "🛎️ Richiesta di prenotazione" : "🛎️ Prenotazione"} · ${unaRiga(y.c.nome)}`.slice(0, 80),
      testo: [`«${unaRiga(y.x.oggetto) || "senza oggetto"}»`, unaRiga(y.x.inizio), entro(y), quando(y.x)].filter(Boolean).join("\n"),
      tag: ("sofia-pren-" + String(y.x.id).replace(/[^a-z0-9-]/gi, "-")).slice(0, 40), vibra: true, prenotazione: true, rif: "email_" + String(y.x.id) }));   // 1.41.0: toccata, apre quell'email
    const visti = new Set(pren.map(y => String(y.x.id)));
    return [...mie, ...notificheEmail(l.filter(x => !visti.has(String(x.id))), adesso)];
  }
  if (l.length <= 3) return l.map(x => ({
    titolo: `📧 Email da ${chi(x)}`.slice(0, 80),
    testo: [`«${unaRiga(x.oggetto) || "senza oggetto"}»`, unaRiga(x.inizio), x.allegati ? `📎 ${x.allegati} ${x.allegati === 1 ? "allegato" : "allegati"}` : "", quando(x)].filter(Boolean).join("\n"),
    tag: ("sofia-email-" + String(x.id).replace(/[^a-z0-9-]/gi, "-")).slice(0, 40), rif: "email_" + String(x.id) }));   // 1.41.0: toccata, apre quell'email
  const notte = l.every(x => quando(x).startsWith("🌙"));
  return [{ titolo: `📧 ${l.length} email nuove all'albergo`,
    testo: [...l.slice(0, 6).map(x => `• ${chi(x)}: «${taglia(x.oggetto || "senza oggetto", 60)}»`), l.length > 6 ? `…e altre ${l.length - 6}` : "", notte ? "🌙 Sono arrivate stanotte" : ""].filter(Boolean).join("\n"),
    tag: "sofia-email" }];
}

// A ogni giro: le mail nuove della casella entrano nella posta di Sofia (prima della lettura delle chat)
export async function portaPostaAlbergo({ db, adesso = new Date(), fetchFn = fetch, ms = 60000 }) {
  let c = null;
  try { c = await db.doc("importazioni", "posta-albergo"); } catch (e) { return null; }
  if (!casellaPronta(c)) return null;
  const ora = adesso.getTime();
  const da = Number(c.ultimoTs) > 0 ? Number(c.ultimoTs) : ora - PRIMA_VOLTA_MS;
  const j = await chiedi(c.url, { azione: "nuove", segreto: c.segreto, da }, ms, fetchFn);
  if (!j || !j.ok) {
    const errore = String((j && j.errore) || "la casella non risponde").slice(0, 160);
    try { await db.merge("importazioni", "posta-albergo", { ultimoGiro: adesso.toISOString(), errore, erroreQuando: adesso.toISOString() }); } catch (e) {}
    return { esito: "posta albergo: la casella non ha risposto", n: 0, errore: true, avvisare: daAvvisare(c, [], ora) };   // 1.36.0: quelle che aspettavano
  }
  const mail = (Array.isArray(j.mail) ? j.mail : []).filter(m => m && Number(m.ts) > da);
  const ops = mail.map(mailInPosta).filter(Boolean).map(x => ({ coll: "posta", id: x.id, dati: x.dati, merge: true }));
  if (ops.length) await db.scrivi(ops);
  const ultimo = Math.max(da, ...mail.map(m => Number(m.ts) || 0));
  const avvisare = daAvvisare(c, ops.length ? mail : [], ora);   // 1.36.0
  await db.merge("importazioni", "posta-albergo", { ultimoTs: ultimo, ultimoGiro: adesso.toISOString(), errore: "", quante: (Number(c.quante) || 0) + ops.length, casella: String(j.casella || "").slice(0, 8), ...(ops.length ? { ultimaMail: adesso.toISOString(), avvisare } : {}) });   // 1.41.0: la versione della casella (l'app sa se va aggiornata)
  return { esito: ops.length ? `posta albergo: ${ops.length} ${ops.length === 1 ? "mail nuova" : "mail nuove"}` : null, n: ops.length, avvisare };
}
