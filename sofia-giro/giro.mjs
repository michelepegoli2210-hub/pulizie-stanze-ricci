// ============================================================================
//  SOFIA SEMPRE ACCESA (1.16.0) — il giro automatico che lavora anche ad app chiusa.
//  Michele, 30/10: "mettile tutte… falla diventare quasi al 100% una persona autonoma". Piano di Argon (chat del 30/10):
//  "il filtro zero-costi": qui non si chiama mai Gemini; si guarda il database e si scrive su Telegram solo quando serve.
//  Lo fa partire GitHub ogni mezz'ora (.github/workflows/sofia-giro.yml) con la chiave FIREBASE_SA che mette Michele.
//  Cosa fa (ora di Roma), ognuna una volta al giorno (segni in importazioni/giro-sofia):
//   - dalle 7 (o dall'ora scelta in Avvisi) alle 11: il piano del giorno alle signore (stesso segno "ultimoPiano" dell'app:
//     se l'ha già mandato l'app, non lo rimanda) e tre righe al titolare
//   - 12:30-13:59: se una camera dove oggi arriva un ospite non è pronta, un messaggio gentile alle signore (priorità)
//   - 13:30-16:59: se è ancora indietro, un avviso al titolare
//   - 15:00-18:29: le pulizie di oggi ancora da segnare: un promemoria gentile (mai rimproveri)
//     (1.18.1: finestre più larghe: GitHub a volte fa partire il giro con ore di ritardo, il 31/10 è rimasto fermo dalle 12:29 alle 17:14)
//   - dalle 20: il bollettino della sera al titolare (oggi, quello che Sofia ha fatto da sola, i guasti, domani, cosa aspetta il «Sì»)
//   - 7-21: se il ponte WhatsApp c'era e tace da più di 40 minuti, lo dice al titolare (una volta al giorno)
//  1.17.0: al titolare scrive anche (o solo) con gli AVVISI SUL TELEFONO (Web Push, importazioni/push-sofia): basta il tasto
//  «Accendi gli avvisi su questo telefono» nell'app, niente Telegram. Le iscrizioni scadute (404/410) si tolgono da sole.
//  1.17.1: gli avvisi partono tutti "urgenti" (Urgency: high): col telefono a riposo Android li consegna subito invece di
//  tenerli da parte (sono pochi al giorno). E dal tasto «Run workflow» di GitHub, con la casella «prova», parte SOLO un
//  avviso di prova a ogni telefono acceso (niente giro): serve a controllare tutta la strada fino al telefono.
//  1.18.0: SOFIA LEGGE LE CHAT ANCHE AD APP CHIUSA (lettura-giro.mjs): ogni 10 minuti, se il ponte ha portato messaggi nuovi
//  e da 5 minuti nessuno scrive, li legge con Gemini (stessa richiesta dell'app, lettura.js), mette il risultato da
//  controllare in importazioni/lettura-sofia e manda l'avviso «Ho letto… Tocca per controllare». Serve il segreto GEMINI_CHIAVE.
//  1.18.1: l'avviso «ho letto» anche per le letture fatte dal telefono/PC con l'app aperta (e per quelle fatte di notte, dopo
//  le 7); il controllo del ponte non si ferma più su "nessun ponte"; LA SPINTA DAL PC: il ponte (1.1.0) fa partire il giro
//  ogni 10 minuti e 5 minuti dopo i messaggi nuovi (input "da" = "ponte" e "scade" = quando scade la sua chiave di GitHub):
//  il giro lo scrive in giro-sofia.spinta, così l'app sa se la spinta c'è e quando scade la chiave.
//  1.20.0: le pulizie che Michele ha detto «non serve» (non_fatta + nonServe) non contano nel piano, nei solleciti e nel bollettino.
//  1.21.0 (app 1.49.0): LA SINTESI DELLA SERA DELLA SEGRETARIA (lettura-giro.mjs, sintesiSera): dalle 20:30, una volta al giorno,
//  i messaggi di oggi della posta e le letture di oggi → 4-7 frasi col modello gratuito, in importazioni/sintesi_<giorno>, e
//  l'avviso «Sofia · la sintesi di oggi» che apre la Segreteria. Si spegne con avvisi.giroSintesi = false. E il prospetto non
//  passa più dalle chat (avvisi.prospettoChat !== true): le letture non propongono soggiorni.
//  1.22.0 (app 1.51.0): LA SEGRETARIA FA LEI: nel modo nuovo la lettura risponde con le azioni e resta «da_applicare» (la mette a
//  posto la prima app del titolare che si apre); l'avviso apre la Segreteria. La sintesi agli orari scelti (avvisi.sintesiOre, di
//  serie 8:30 e 20:30): ognuna racconta i messaggi dall'orario di prima.
//  1.23.0 (app 1.53.0): niente più letture «da controllare»: si legge sempre col modo nuovo (avvisi.prospettoChat non conta più);
//  una lettura del tipo di prima rimasta in sospeso si rilegge (se è di meno di 3 ore) o si mette da parte: la posta non aspetta più.
//  1.24.0 (app 1.55.13): I MESSAGGI DELLE SIGNORE PER MICHELE (messaggi_signore, dalla chat della governante): a ogni giro,
//  dalle 6:30 alle 22:30, una notifica per messaggio «💬 Selena ti scrive» (con «(prova)» se è Michele che prova la loro
//  parte), che apre l'app sul messaggio; poi il segno «avvisato». Quelli già letti o di più di 2 giorni non si mandano.
//  E LE NOTIFICHE PIÙ CHIARE (Michele: «più chiare, e che toccandole si apra quella parte dell'app con la scritta»): il
//  disegnino e la cosa nel titolo, e «dove» aprire l'app (signore, casa, altro, messaggi; la Segreteria come prima).
//  1.25.0 (app 1.58.0): I GUASTI URGENTI E URGENTISSIMI (Michele, 7/11: «per i guasti la possibilità di metterli urgenti e
//  urgentissimi: gli urgenti mi devono arrivare insieme alle notifiche di Sofia di ogni giorno, gli urgentissimi ogni 2 ore»).
//  Gli URGENTI: una riga «🔧 Da riparare subito: …» in fondo al piano del mattino, alle sintesi, alle letture di WhatsApp; nel
//  bollettino della sera stanno nei guasti. Gli URGENTISSIMI: una notifica loro («🚨 Urgentissimo: …») al primo giro e poi ogni
//  2 ore, dalle 7 alle 22, finché il guasto non è «fatto» (segno manutenzione/<id>.avvisatoUrg); col tasto «✅ Sistemato».
//  E LE NOTIFICHE CHIARISSIME (Michele: «le notifiche a me devono essere ultra comprensibili»): nel titolo la cosa e il numero
//  («☀️ Oggi 6 pulizie · 1 arrivo»), dentro una riga per cosa, col suo disegnino, la prima riga è la più importante (è quella che
//  il telefono fa vedere da chiusa); le letture di WhatsApp dicono con le parole di Sofia cosa è successo, non «3 cose».
//  E le ragazze nuove (app 1.57.0, zone «s…» in impostazioni/camere.zone) contano anche qui.
//  1.26.0 (app 1.58.1): SI RISPARMIA. Argon legge le chat solo alle 8, 12, 16 e 20 (il turno fatto resta in letturaTurno);
//  prima il modello economico guarda i messaggi nuovi: le cose urgenti si leggono subito, i saluti mai (vedi lettura-giro.mjs).
//  1.27.0 (ponte 1.2.0): IL FOGLIO DI PAPÀ LO LEGGE ARGON (Michele, 7/11: «il prospetto lo devi interpretare con Argon massima
//  intelligenza e anche contestualizzarlo rispetto ai messaggi… e lo deve aggiornare in automatico da solo… tutta una cascata
//  che deve partire dal prospetto»). Il file Excel che arriva dal gruppo (posta tipo «excel») lo legge Argon al massimo, col
//  prospetto dell'app e i messaggi delle ultime settimane: i soggiorni si mettono a posto da soli (solo i cambi), ognuno con
//  «Annulla» in Segreteria; l'app del titolare rifà le pulizie e le stelle (vedi prospetto-giro.mjs). Prima delle chat, così
//  la lettura delle chat vede già il prospetto nuovo. L'avviso «📊 Foglio di papà» solo se cambia qualcosa (avvisi.giroFoglio).
//  1.28.0 (app 1.62.0, la Segreteria nuova): LE NOTIFICHE SOLO PER QUELLO CHE ASPETTA MICHELE (Michele, 7/11: «queste sono le
//  notifiche che mi devono arrivare, altrimenti mi arrivano due volte»): la lettura delle chat avvisa solo se c'è una cosa da
//  decidere (proposte, dubbi, ore) o un guasto urgente; quello che Sofia ha fatto da sola sta in Segreteria. E «🔔 DA FARE TU»
//  (perte-giro.mjs): le cose che deve fare lui in persona («metti le chiavi ad Aurora») suonano e vibrano, col tasto «✅ Fatto»,
//  subito e poi ogni ora finché non le segna fatte (avvisi.giroFareTu = false le spegne).
//  1.28.1: per il vaglio è urgente anche una cosa che chiedono a Michele di fare lui (le chiavi, chiamare, andare in albergo):
//  così la lettura (e l'allarme) arriva subito e non al turno di lettura dopo.
//  1.34.0 (app 1.76.0): A MICHELE NON SI RIPETE QUELLO CHE HA SCRITTO LUI (Michele, 10/11 sera: «non devo rileggere gli stessi
//  messaggi che ho costruito io… trova un escamotage, qualcosa che abbia utilità, questo ponte»). Dai suoi messaggi la lettura
//  delle chat tiene solo le azioni nell'app (lettura.js senzaEco); se a una richiesta di un altro lui ha già scritto in quella
//  chat, l'allarme «Da fare tu» non suona più; i promemoria li chiede lui («Sofia ricordamelo»): una scheda loro, che suona
//  all'ora detta (perte-giro.mjs, lettura-giro.mjs).
// ============================================================================
import { ZONE, CAMERE, CAMERE_TOLTE, SQUADRA_BASE } from "../regole.js";
import * as L from "../logica.js";
import { LUOGHI_COMUNI } from "../governante.js";
import { leggiChat, sintesiSera, oraDiAvvisi } from "./lettura-giro.mjs";
import { leggiFogliPapa } from "./prospetto-giro.mjs";   // 1.27.0
import { allarmiPerTe } from "./perte-giro.mjs";   // 1.28.0
import { copiaDovuta, faiCopia, mandaCassetta, pulito as pulitoCopia } from "./copia-giro.mjs";   // 1.29.0: la copia di sicurezza
import { calendariDovuti, leggiCalendari, mandaCalendari, scaricaCalendario, OGNI_MS as OGNI_CAL_MS } from "./calendari-giro.mjs";   // 1.30.0: il channel manager gratis
import { giroSocial, reteVera, caricaGithub, pulito as pulitoSocial } from "./social-giro.mjs";   // 1.31.0: Sofia social manager, il motore
import { portaPostaAlbergo } from "./posta-giro.mjs";   // 1.33.0 (app 1.75.0): la posta dell'albergo per Sofia segretaria
import { pathToFileURL } from "node:url";

export const VERSIONE_GIRO = "1.34.1";
const MIN = (h, m = 0) => h * 60 + m;

export function oraRoma(d) {
  const p = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (k) => (p.find(x => x.type === k) || {}).value;
  const h = Number(g("hour")) % 24, m = Number(g("minute"));
  return { iso: `${g("year")}-${g("month")}-${g("day")}`, h, m, minuti: MIN(h, m), hhmm: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
}

// ---- lo stato della casa, letto dal database (solo quello che serve al giro di adesso) ----------------
function camereDi(camereDoc) {
  const lista = camereDoc && Array.isArray(camereDoc.lista) && camereDoc.lista.length ? camereDoc.lista : CAMERE;
  return lista.filter(c => c && !CAMERE_TOLTE[c.id]).map(c => { const b = CAMERE.find(x => x.id === c.id); return b ? { ...c, nome: b.nome } : c; });
}
function casa(st) {
  const camere = camereDi(st.camereDoc);
  const camera = (id) => !id ? { id: "", nome: "Lavoro generale", ordine: 99 } : camere.find(c => c.id === id) || LUOGHI_COMUNI.find(l => l.id === id) || (id === "stelle" ? { id, nome: "Rifiniture in altre camere", ordine: 99 } : { id, nome: id.charAt(0).toUpperCase() + id.slice(1), ordine: 99 });   // come camera() dell'app
  const squadra = {};
  const ZONE_T = { ...ZONE, ...((st.camereDoc && st.camereDoc.zone && typeof st.camereDoc.zone === "object") ? st.camereDoc.zone : {}) };   // 1.25.0: anche le ragazze nuove
  for (const z of Object.keys(ZONE_T)) squadra[z] = { ...(SQUADRA_BASE[z] || { nome: "", attiva: true, camere: [] }), ...((st.squadra || {})[z] || {}) };
  for (const [k, v] of Object.entries(st.squadra || {})) if (!squadra[k] && v && typeof v === "object") squadra[k] = { nome: "", attiva: true, camere: [], ...v };
  const SIG = (z) => { const s = squadra[z]; if (s && s.nome) return s.nome; const p = Object.values(st.ruoli || {}).find(r => r && r.ruolo === "addetta" && r.zona === z && r.nome && !/^signora/i.test(r.nome)); if (p) return p.nome; return `Signora ${(ZONE[z] || {}).breve || z}`; };
  const signore = () => Object.entries(ZONE_T).sort((a, b) => (a[1].ordine || 0) - (b[1].ordine || 0)).map(([id, v]) => ({ id, ...v })).filter(z => squadra[z.id] && squadra[z.id].attiva !== false);
  const tag = (z) => { const t = ((st.avvisi || {}).tag || {})[z]; return t ? (String(t).startsWith("@") ? t : "@" + t) : SIG(z); };
  const ordine = (id) => camera(id).ordine || 99;
  const visibile = (p) => p && p.tipo !== "stelle" && !p.nonServe;      // il giro delle rifiniture lo vedono nell'app (qui non si ricalcola); 1.20.0: senza quelle che non servono
  const delGiorno = (iso, z) => Object.values(st.pulizie || {}).filter(p => p && p.data === iso && (!z || p.zona === z) && visibile(p)).sort((a, b) => ordine(a.camera) - ordine(b.camera));
  const titolo = (p) => (p.tipo === "totale" || p.tipo === "totale_casa" ? "Cambio completo" : (p.titolo || "Pulizia")) + (p.parte && L.PARTE_TESTO[p.parte] ? ` · ${L.PARTE_TESTO[p.parte]}` : "");
  const sempre = (id) => { try { return L.spezzaRichieste((st.promemoria || {})[id] || ""); } catch (e) { return []; } };
  const riga = (p) => {
    const c = camera(p.camera);
    let r = `• ${c.nome} — ${p.origine === "governante" ? "⭐ " : ""}${titolo(p)}${p.origine === "governante" && p.minuti ? ` (${p.minuti} min)` : ""}`;
    if (p.origine === "governante" && p.come) r += `\n   ↳ ${p.come}`;
    if (p.ospite) r += ` (${p.ospite}${p.persone ? `, ${p.persone} ${p.persone === 1 ? "persona" : "persone"}` : ""})`;
    if (p.partenza) r += ` · PARTE ${L.GIORNI[L.giornoSettimana(p.data)].toUpperCase()}`;
    if (p.arrivo) r += ` · ARRIVA ${L.GIORNI[L.giornoSettimana(p.data)].toUpperCase()}`;
    if (!p.arrivo && p.prossimoArrivo) r += ` · prossimo arrivo ${L.dataGiornoLungo(p.prossimoArrivo)}`;
    const s = sempre(p.camera); if (s.length) r += `\n   ↳ sempre: ${s.join(", ")}`;
    if (p.dettagli) r += `\n   ↳ ${p.dettagli}`;
    if (p.istruzioni) r += `\n   ↳ ${p.istruzioni}`;
    return r;
  };
  const messaggio = (iso) => { const m = (st.messaggi || {})[iso]; return m && m.testo ? m : null; };
  const arriviDi = (iso) => Object.values(st.soggiorni || {}).filter(s => s && s.inizio === iso && s.camera).map(s => s.camera);
  const aperta = (p) => p && p.stato !== "fatta" && p.stato !== "non_fatta";
  return { camere, camera, SIG, signore, tag, delGiorno, riga, messaggio, arriviDi, aperta, titolo };
}
export function testoPianoGiorno(st, iso) {
  const k = casa(st), righe = [`🧹 Pulizie · ${L.dataLunga(iso)}`];
  const msg = k.messaggio(iso); if (msg) righe.push(`📣 ${msg.testo}`);
  for (const z of k.signore()) {
    const ls = k.delGiorno(iso, z.id).filter(p => p.stato !== "fatta");
    if (!ls.length) continue;
    righe.push("", `${k.tag(z.id)} · ${ls.length} ${ls.length === 1 ? "camera" : "camere"}`);
    ls.forEach(p => righe.push(k.riga(p)));
  }
  return righe.join("\n");
}
// le camere dove oggi arriva un ospite e la pulizia di oggi non è ancora fatta
function arriviNonPronti(st, oggi) {
  const k = casa(st), arrivi = new Set(k.arriviDi(oggi));
  return k.delGiorno(oggi).filter(p => arrivi.has(p.camera) && k.aperta(p) && p.stato !== "problema");
}
// ---- 1.25.0: i guasti urgenti e urgentissimi ----------------------------------------------------------------------------
export const LIVELLO_GUASTO = { urgente: 1, urgentissimo: 2 };
export const livelloGuasto = (m) => (m && LIVELLO_GUASTO[m.gravita]) || 0;
export function cosaGuasto(m, camera) {
  const cosa = String((m && m.titolo) || "Un guasto").replace(/[.\s]+$/, ""), c = m && m.camera ? camera(m.camera) : null;
  return `${cosa}${c && c.nome ? ` (${c.nome})` : ""}`;
}
// la riga in fondo alle notifiche di ogni giorno: «🔧 Da riparare subito: 🚨 Caldaia (Via Trento 47); La doccia perde (Salvatore)»
export function rigaUrgenti(guasti, camera) {
  const ls = Object.values(guasti || {}).filter(m => m && m.stato !== "fatto" && livelloGuasto(m) >= 1)
    .sort((a, b) => livelloGuasto(b) - livelloGuasto(a) || String(a.data || "").localeCompare(String(b.data || "")));
  if (!ls.length) return "";
  return `🔧 Da riparare subito: ${ls.slice(0, 2).map(m => `${livelloGuasto(m) === 2 ? "🚨 " : ""}${cosaGuasto(m, camera)}`).join("; ")}${ls.length > 2 ? ` (e altri ${ls.length - 2})` : ""}`;
}
const giornoParlato = (iso, oggi) => !iso ? "" : iso === oggi ? "oggi" : iso === L.aggiungiGiorni(oggi, -1) ? "ieri" : L.dataBreve(iso);
export const OGNI_URG_MS = 2 * 3600e3 - 5 * 60e3;   // ogni 2 ore (il giro passa ogni 10 minuti: 5 di margine)
function oreMinuti(min) { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h${m ? " " + String(m).padStart(2, "0") : ""}` : `${m} min`; }
export function testoBollettino(st, oggi, domani) {
  // 1.25.0: una riga per cosa, col suo disegnino; la prima (il conto delle pulizie) è quella che il telefono fa vedere da chiusa
  const k = casa(st), righe = [];
  const perSig = k.signore().map(z => ({ z, ls: k.delGiorno(oggi, z.id) })).filter(x => x.ls.length);
  const tot = perSig.reduce((s, x) => s + x.ls.length, 0), fatte = perSig.reduce((s, x) => s + x.ls.filter(p => p.stato === "fatta").length, 0);
  if (tot) {
    righe.push(`${fatte === tot ? "✅" : "🧹"} Pulizie di oggi: ${fatte} su ${tot} fatte`);
    for (const x of perSig) { const manca = x.ls.filter(p => k.aperta(p)); if (manca.length) righe.push(`⏳ ${k.SIG(x.z.id)}: manca ${[...new Set(manca.map(p => k.camera(p.camera).nome))].join(", ")}`); }
  } else righe.push("🧹 Oggi nessuna pulizia.");
  // i guasti
  const guasti = Object.values(st.manutenzione || {}).filter(m => m && m.stato !== "fatto");
  if (guasti.length) {
    const arrivi2 = new Set([...k.arriviDi(oggi), ...k.arriviDi(domani)]);
    const sub = guasti.filter(m => livelloGuasto(m) >= 1 || (m.camera && arrivi2.has(m.camera))).sort((a, b) => livelloGuasto(b) - livelloGuasto(a));
    righe.push(`🔧 Guasti da sistemare: ${guasti.length}${sub.length ? ` — subito: ${sub.slice(0, 3).map(m => `${livelloGuasto(m) === 2 ? "🚨 " : ""}${cosaGuasto(m, k.camera)}${m.camera && arrivi2.has(m.camera) ? ", arriva un ospite" : ""}`).join("; ")}` : ""}`);
  }
  // quello che ha fatto da sola
  const reg = ((st.registro || {}).voci || []).filter(v => v && v.giorno === oggi);
  if (reg.length) {
    const ann = reg.filter(v => v.annullata).length;
    righe.push(`🤖 Ho fatto da sola ${reg.length} ${reg.length === 1 ? "cosa" : "cose"}${ann ? ` (${ann} annullat${ann === 1 ? "a" : "e"} da te)` : ""}: ${reg.slice(-2).map(v => String(v.testo || "").replace(/\s+/g, " ").slice(0, 70)).join("; ")}`);
  }
  // domani
  const carico = k.signore().map(z => { const ls = k.delGiorno(domani, z.id); return { z, n: ls.length, min: ls.reduce((s, p) => s + (Number(p.minuti) || 0), 0) }; }).filter(x => x.n);
  if (carico.length) {
    righe.push(`📅 Domani: ${carico.map(x => `${k.SIG(x.z.id)} ${x.n} ${x.n === 1 ? "pulizia" : "pulizie"}${x.min ? ` (${oreMinuti(x.min)})` : ""}`).join(", ")}`);
    if (carico.length >= 2) { const s = [...carico].sort((a, b) => b.min - a.min); if (s[0].min - s[s.length - 1].min > 45) righe.push(`⚖️ ${k.SIG(s[0].z.id)} ha ${oreMinuti(s[0].min - s[s.length - 1].min)} di lavoro in più: se vuoi, di' a Sofia di spostarne una.`); }
  } else righe.push("📅 Domani: nessuna pulizia.");
  const arrDom = [...new Set(k.arriviDi(domani))]; if (arrDom.length) righe.push(`🧳 Domani arriva qualcuno in: ${arrDom.map(c => k.camera(c).nome).join(", ")}`);
  const mDom = k.messaggio(domani); if (mDom) righe.push(`📣 Domani alle ragazze: «${String(mDom.testo).replace(/\s+/g, " ").slice(0, 100)}»`);
  // cosa aspetta il suo «Sì»
  const conv = Array.isArray((st.chat || {}).conversazione) ? st.chat.conversazione : [];
  const aspetta = conv.slice(-30).filter(m => m && m.chi === "gov" && Array.isArray(m.tasti) && m.tasti.some(t => t && t.k === "si") && !m.scelto).length;
  if (aspetta) righe.push(`✋ Aspetta${aspetta === 1 ? "" : "no"} il tuo «Sì»: ${aspetta} ${aspetta === 1 ? "proposta" : "proposte"} di Sofia. Apri l'app per vederle.`);
  return righe.join("\n");
}
// 1.25.0: un testo lungo (la sintesi della segretaria) diventa una frase per riga: sul telefono si legge al volo
export function frasiInRighe(testo) {
  const t = String(testo || "").replace(/\s+/g, " ").trim(); if (!t) return "";
  const frasi = t.split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ«"0-9🔧🧹🧳📅📣✅⚠️💬])/u).map(f => f.trim()).filter(Boolean);
  return frasi.length > 1 ? frasi.slice(0, 8).map(f => `• ${f}`).join("\n") : t;
}
// ---- il giro ------------------------------------------------------------------------------------------
export async function giro({ db, telegram, push = null, adesso = new Date(), gemini = null, da = "", scade = "", copia = null, calendari = null, social = null, postaAlbergo = {} }) {
  const t = oraRoma(adesso), oggi = t.iso, domani = L.aggiungiGiorni(oggi, 1);
  const esiti = [];
  const [stato0, avvisi] = await Promise.all([db.doc("importazioni", "giro-sofia"), db.doc("impostazioni", "avvisi")]);
  const fatti = stato0 && stato0.giorno === oggi ? { ...(stato0.fatti || {}) } : {};
  const a = avvisi || {};
  const puoGruppo = !!(a.token && a.chat), tgMe = !!(a.token && a.chatMio);
  const manda = async (dove, testo, cosa) => { const okk = await telegram(a.token, dove, testo); esiti.push(`${cosa}${okk ? "" : " (Telegram non ha risposto)"}`); return okk; };
  // 1.17.0: gli avvisi sul telefono del titolare (si legge il documento solo se c'è qualcosa da dirgli)
  let ps = null;
  const iscrizioni = () => Object.entries((ps && ps.iscrizioni) || {}).filter(([, v]) => v && v.sub && v.sub.endpoint && (v.chi || "titolare") === "titolare");
  const mandaMe = async (testo, cosa, titolo = "Sofia", urgente = false, extra0 = {}) => {
    let okk = false;
    const { conUrgenti, ...extra } = extra0 || {};
    if (conUrgenti) { const r = await urgentiRiga(); if (r) testo = `${testo}\n${r}`; }   // 1.25.0
    if (tgMe) okk = (await telegram(a.token, a.chatMio, testo)) || okk;
    if (push && ps && ps.vapidPublic && ps.vapidPrivato) {
      const finite = [];
      for (const [id, v] of iscrizioni()) { const r = await push(ps, v.sub, { titolo, testo, urgente, ...extra }); if (r && r.ok) okk = true; else if (r && r.finita) finite.push(id); }
      if (finite.length) { const resto = Object.fromEntries(Object.entries(ps.iscrizioni || {}).filter(([id]) => !finite.includes(id))); await db.sostituisci("importazioni", "push-sofia", "iscrizioni", resto); ps.iscrizioni = resto; esiti.push(`tolte ${finite.length} iscrizioni scadute`); }
    }
    esiti.push(`${cosa}${okk ? "" : " (non è arrivato)"}`); return okk;
  };
  // 1.25.0: i guasti aperti e i nomi delle camere, letti una volta sola per giro (solo se servono)
  let guastiG = null, cameraG = null, urgCache = null;
  const guastiDi = async () => guastiG || (guastiG = (await db.guastiAperti()) || {});
  const cameraDi = async () => { if (cameraG) return cameraG; const cd = await db.doc("impostazioni", "camere"); const cs = camereDi(cd); cameraG = (id) => cs.find(c => c.id === id) || LUOGHI_COMUNI.find(l => l.id === id) || { id, nome: id }; return cameraG; };
  const urgentiRiga = async () => { if (urgCache !== null) return urgCache; try { urgCache = rigaUrgenti(await guastiDi(), await cameraDi()); } catch (e) { console.warn("guasti urgenti:", e && e.message); urgCache = ""; } return urgCache; };
  const oraPiano = MIN(Number(a.oraPiano) || 7);
  const dentro = (da, a2) => t.minuti >= da && t.minuti < a2;
  const serve = {
    piano: !fatti.piano && dentro(oraPiano, MIN(11)),
    arrivi: !fatti.arrivi && dentro(MIN(12, 30), MIN(14)),
    allarme: !fatti.allarme && dentro(MIN(13, 30), MIN(17)),
    chiusura: !fatti.chiusura && dentro(MIN(15), MIN(18, 30)),
    bollettino: !fatti.bollettino && t.minuti >= MIN(20),
    ponte: !fatti.ponte && dentro(MIN(7), MIN(21)),
  };
  // filtro zero-costi: se non c'è niente da fare a quest'ora, si legge solo il segno del giro
  if (Object.values(serve).some(Boolean)) {
    const st = { avvisi: a };
    const carica = async (...cose) => {
      const p = [];
      if (cose.includes("base")) p.push(db.doc("impostazioni", "squadra").then(x => st.squadra = x), db.doc("impostazioni", "camere").then(x => st.camereDoc = x), db.tutti("ruoli").then(x => st.ruoli = x), db.pulizieDi([oggi, domani]).then(x => st.pulizie = x), db.soggiorniDa(oggi).then(x => st.soggiorni = x));
      if (cose.includes("piano")) p.push(db.doc("impostazioni", "messaggi").then(x => st.messaggi = x), db.doc("impostazioni", "promemoria").then(x => st.promemoria = x));
      if (cose.includes("sera")) p.push(db.doc("impostazioni", "messaggi").then(x => st.messaggi = x), db.doc("importazioni", "registro-sofia").then(x => st.registro = x), db.guastiAperti().then(x => st.manutenzione = x), db.doc("impostazioni", "chat").then(x => st.chat = x));
      if (cose.includes("argon")) p.push(db.doc("impostazioni", "argon").then(x => st.argon = x));
      await Promise.all(p);
    };
    if (serve.piano || serve.allarme || serve.bollettino || serve.ponte) ps = await db.doc("importazioni", "push-sofia");
    const puoMe = tgMe || (!!push && !!ps && !!ps.vapidPublic && iscrizioni().length > 0);
    const servono = new Set(["base"]);
    if (serve.piano) servono.add("piano");
    if (serve.chiusura) servono.add("argon");
    if (serve.bollettino) servono.add("sera");
    if (serve.piano || serve.arrivi || serve.allarme || serve.chiusura || serve.bollettino) await carica(...servono);
    const k = st.pulizie ? casa(st) : null;

    if (serve.piano) {
      const alGruppo = puoGruppo && a.pianoMattina !== false;
      if (a.ultimoPiano === oggi) { fatti.piano = "app"; }
      else if (!k.delGiorno(oggi).length) { fatti.piano = "vuoto"; }
      else if (!alGruppo && !puoMe) { fatti.piano = "spento"; }
      else {
        if (alGruppo) {
          await db.merge("impostazioni", "avvisi", { ultimoPiano: oggi });   // prima il segno, come l'app: niente doppioni
          await manda(a.chat, testoPianoGiorno(st, oggi), "piano del giorno alle signore");
        }
        fatti.piano = t.hhmm;
        if (puoMe) {
          // 1.25.0: nel titolo quante pulizie e quanti arrivi; dentro una riga per ragazza con le sue camere
          const perSig = k.signore().map(z => ({ z, ls: k.delGiorno(oggi, z.id).filter(p => p.stato !== "fatta") })).filter(x => x.ls.length);
          const tot = perSig.reduce((s, x) => s + x.ls.length, 0), arr = [...new Set(k.arriviDi(oggi))].map(c => k.camera(c).nome);
          const righe = perSig.map(x => `🧹 ${k.SIG(x.z.id)}: ${[...new Set(x.ls.map(p => k.camera(p.camera).nome))].join(", ")}`);
          if (arr.length) righe.push(`🧳 Arriva qualcuno in: ${arr.join(", ")}`);
          if (alGruppo) righe.push("✅ Il piano è già andato alle ragazze.");
          await mandaMe(righe.join("\n"), "tre righe al titolare", `☀️ Oggi ${tot} ${tot === 1 ? "pulizia" : "pulizie"}${arr.length ? ` · ${arr.length} ${arr.length === 1 ? "arrivo" : "arrivi"}` : ""}`, false, { dove: "signore", tag: "sofia-piano", conUrgenti: true });
        }
      }
    }
    if (serve.arrivi) {
      const ls = arriviNonPronti(st, oggi);
      if (ls.length && puoGruppo && a.giroSolleciti !== false) {
        const chi = [...new Set(ls.map(p => p.zona).filter(Boolean))].map(z => k.tag(z));
        await manda(a.chat, `${chi.length ? chi.join(" ") + " " : ""}per prima cosa: ${ls.map(p => k.camera(p.camera).nome).join(", ")} — oggi ${ls.length === 1 ? "arriva un ospite" : "arrivano ospiti"}. Le camere che restano vuote stanotte possono aspettare. Grazie! 🙂`, "priorità agli arrivi di oggi");
      }
      fatti.arrivi = ls.length ? t.hhmm : "niente";
    }
    if (serve.allarme) {
      const ls = arriviNonPronti(st, oggi);
      if (ls.length && puoMe) await mandaMe([`🧳 Oggi ${ls.length === 1 ? "arriva un ospite, ma la camera non risulta ancora pulita" : "arrivano ospiti, ma le camere non risultano ancora pulite"}.`, ...ls.map(p => `🧹 ${k.camera(p.camera).nome}: la fa ${p.zona ? k.SIG(p.zona) : "—"}`), "👉 Tocca per vedere a che punto sono."].join("\n"), "avviso arrivi al titolare", ls.length === 1 ? `⚠️ ${k.camera(ls[0].camera).nome} non è ancora pronta` : `⚠️ ${ls.length} camere non ancora pronte`, true, { dove: "signore", tag: "sofia-allarme" });
      fatti.allarme = ls.length ? t.hhmm : "niente";
    }
    if (serve.chiusura) {
      const argon = !!(st.argon && st.argon.attivo);
      const perZona = {};
      for (const p of k.delGiorno(oggi)) if ((p.stato === "da_fare" || p.stato === "in_corso" || !p.stato) && p.zona) (perZona[p.zona] = perZona[p.zona] || []).push(k.camera(p.camera).nome);
      const righe = Object.entries(perZona).map(([z, cs]) => `${k.tag(z)} ti ${cs.length === 1 ? "risulta" : "risultano"} ancora da segnare: ${[...new Set(cs)].join(", ")}.`);
      if (righe.length && puoGruppo && a.giroSolleciti !== false) await manda(a.chat, `${righe.join("\n")}\nSe ${righe.length === 1 && Object.values(perZona)[0].length === 1 ? "l'hai finita" : "le hai finite"}, tocca ${argon ? "«HO FINITO»" : "«Fatto»"} nell'app, così ti si segna il lavoro 🙂`, "promemoria delle pulizie da segnare");
      fatti.chiusura = righe.length ? t.hhmm : "niente";
    }
    if (serve.bollettino) {
      if (puoMe && a.giroBollettino !== false) await mandaMe(testoBollettino(st, oggi, domani), "bollettino della sera", "🌙 Com'è andata oggi", false, { dove: "casa", tag: "sofia-sera" });
      fatti.bollettino = puoMe ? t.hhmm : "spento";
    }
    if (serve.ponte) {
      const ponti = Object.values(await db.tutti("ponti") || {}).filter(p => p && Number(p.vivo));
      if (ponti.length) {
        const vivo = Math.max(...ponti.map(p => Number(p.vivo)));
        if (adesso.getTime() - vivo > 40 * 60 * 1000) {
          if (puoMe) await mandaMe(`Il programma sul PC che porta WhatsApp all'app è fermo dalle ${oraRoma(new Date(vivo)).hhmm}.\n💻 Il PC è acceso? Finché è spento, Sofia non legge i messaggi.`, "avviso ponte spento", "📵 WhatsApp non arriva più all'app", false, { dove: "altro", tag: "sofia-ponte" });
          fatti.ponte = t.hhmm;
        }
      }      // 1.18.1: senza ponte (o col ponte acceso) non segno niente: si ricontrolla al prossimo giro
    }
  }
  // 1.33.0 (app 1.75.0): prima le mail nuove dell'albergo (casella-albergo.gs, sola lettura) nella posta di Sofia: poi le
  // legge con le chat, come chat «Email albergo». Se la casella non è collegata non fa niente.
  try {
    const pa = await portaPostaAlbergo({ db, adesso, ...(postaAlbergo && postaAlbergo.fetchFn ? { fetchFn: postaAlbergo.fetchFn } : {}) });
    if (pa && pa.esito) esiti.push(pa.esito);
  } catch (e) { esiti.push("posta albergo: errore"); console.warn("posta albergo:", e && e.message); }
  // 1.18.0: Sofia legge le chat anche ad app chiusa (a ogni giro, se il ponte ha portato posta nuova)
  let lettura = null;
  const prendiBase = async () => {
    const [camereDoc, squadra, ruoli] = await Promise.all([db.doc("impostazioni", "camere"), db.doc("impostazioni", "squadra"), db.tutti("ruoli")]);
    const k = casa({ camereDoc, squadra, ruoli, avvisi: a });
    return { camere: k.camere, signore: k.signore().map(z => ({ id: z.id, nome: k.SIG(z.id), zona: z.nome || "" })) };
  };
  // 1.27.0: il foglio Excel di papà dal gruppo: lo legge Argon (al massimo) e mette a posto il prospetto da solo, prima delle chat
  let creditoFoglio = false;
  try {
    const fp = await leggiFogliPapa({ db, gemini, oggi, adesso, prendiBase });
    if (fp) {
      if (fp.esito) esiti.push(fp.esito);
      creditoFoglio = !!fp.credito;
      if (fp.avviso && a.giroFoglio !== false && oraDiAvvisi(t.minuti)) {
        if (!ps) ps = await db.doc("importazioni", "push-sofia");
        await mandaMe(fp.avviso.testo, "avviso del foglio di papà", fp.avviso.titolo, false, fp.avviso.extra);
      }
    }
  } catch (e) { console.warn("foglio di papà:", e && e.message); esiti.push("foglio di papà: errore " + String((e && e.message) || e).slice(0, 80)); }
  try {
    lettura = await leggiChat({ db, gemini, adesso, a, letturaTs: Number(stato0 && stato0.letturaTs) || 0, oggi, prendiBase, minuti: t.minuti, turnoLetto: String((stato0 && stato0.letturaTurno) || "") });   // 1.26.0: il turno
    if (lettura.avvisa) {
      if (!ps) ps = await db.doc("importazioni", "push-sofia");
      await mandaMe(lettura.avvisa.testo, lettura.avvisataLid !== undefined ? "avviso della lettura da controllare" : "lettura delle chat", lettura.avvisa.titolo, true, { ...(lettura.avvisa.extra || { url: "./index.html?lettura=1", lettura: true, tag: "sofia-lettura" }), conUrgenti: true });
      // 1.18.1: la lettura fatta dal telefono/PC (o di notte): il segno «avvisata», solo se è ancora quella (stesso numero)
      if (lettura.avvisataLid !== undefined) { try { await db.segnaSe("importazioni", "lettura-sofia", "lid", lettura.avvisataLid, { avvisata: adesso.toISOString() }); } catch (e) { console.warn("avvisata:", e && e.message); } }
    }
    else if (lettura.esito && /^(letto|niente da leggere|non riuscita)/.test(lettura.esito)) esiti.push(`lettura delle chat: ${lettura.esito}`);
    if ((lettura.credito || creditoFoglio) && fatti.creditoAvvisato !== oggi && t.minuti >= MIN(7) && t.minuti < MIN(22, 30)) {
      if (!ps) ps = await db.doc("importazioni", "push-sofia");
      await mandaMe("Non riesco a leggere le chat: il credito di Gemini è finito. Ricaricalo su aistudio.google.com/billing (intanto i messaggi aspettano).", "avviso credito finito", "💳 Il credito di Gemini è finito", true, { dove: "altro", tag: "sofia-credito" });
      fatti.creditoAvvisato = oggi;
    }
  } catch (e) { console.warn("lettura delle chat:", e && e.message); esiti.push("lettura delle chat: errore " + String((e && e.message) || e).slice(0, 80)); }
  // 1.28.0: «🔔 Da fare tu»: le cose che deve fare Michele in persona suonano (vibrano) finché non le segna fatte
  // 1.34.1: le cose che ha già visto (ha risposto su WhatsApp) si segnano a ogni giro; si suona solo negli orari degli allarmi
  if (a.giroFareTu !== false) {
    try {
      const n = await allarmiPerTe({ db, adesso, t, suona: oraDiAvvisi(t.minuti), manda: async (testo, titolo, extra) => { if (!ps) ps = await db.doc("importazioni", "push-sofia"); return mandaMe(testo, "allarme «da fare»", titolo, true, extra); } });
      if (n) fatti.daFare = t.hhmm;
    } catch (e) { console.warn("da fare:", e && e.message); esiti.push("allarme da fare: errore " + String((e && e.message) || e).slice(0, 80)); }
  }
  // 1.22.0: la sintesi della segretaria agli orari scelti (di serie 8:30 e 20:30): ognuna racconta i messaggi dall'orario di prima
  const ORE_OK = ["08:30", "13:00", "20:30"], minDi = (o) => MIN(Number(o.slice(0, 2)), Number(o.slice(3)));
  const oreS = (Array.isArray(a.sintesiOre) ? a.sintesiOre.filter(o => ORE_OK.includes(o)) : []).sort();
  const orari = oreS.length ? oreS : ["08:30", "20:30"], chiaveS = (o) => "sintesi" + o.replace(":", "");
  // un orario si fa entro 4 ore (GitHub a volte fa partire il giro in ritardo); più tardi si salta (niente «sintesi di stamattina» alle 18)
  for (const o of orari) if (!fatti[chiaveS(o)] && t.minuti >= minDi(o) + 240) fatti[chiaveS(o)] = "saltata";
  const dovute = orari.filter(o => !fatti[chiaveS(o)] && t.minuti >= minDi(o));
  if (dovute.length && a.giroSintesi !== false) {
    const o = dovute[dovute.length - 1], i = orari.indexOf(o);
    for (const x of dovute.slice(0, -1)) fatti[chiaveS(x)] = "saltata";
    const daMin = i > 0 ? minDi(orari[i - 1]) : minDi(orari[orari.length - 1]) - 24 * 60;
    const inizio = adesso.getTime() - (t.minuti - daMin) * 60000;
    const mattina = minDi(o) < MIN(12);
    try {
      const s = await sintesiSera({ db, gemini, adesso, a, oggi, prendiBase, minuti: t.minuti, ora: t.hhmm, inizio, domanda: mattina ? "Cosa è successo da ieri sera? Fammi la sintesi: cosa c'è da fare oggi." : "Com'è andata oggi? Fammi la sintesi della giornata." });
      if (s.esito === "fatta" || s.esito === "già fatta") {
        if (s.esito === "fatta") {
          if (!ps) ps = await db.doc("importazioni", "push-sofia");
          const puoMe2 = tgMe || (!!push && !!ps && !!ps.vapidPublic && iscrizioni().length > 0);
          if (puoMe2) await mandaMe(frasiInRighe(s.testo).slice(0, 700), "la sintesi della segretaria", mattina ? "📋 La sintesi di stamattina" : "📋 La sintesi di oggi", false, { url: "./index.html?segreteria=1", segreteria: true, tag: "sofia-sintesi", conUrgenti: true });
        }
        fatti[chiaveS(o)] = t.hhmm; esiti.push(`sintesi delle ${o}: ${s.esito}${s.n ? ` (${s.n} messaggi)` : ""}`);
      }
      else if (s.esito === "niente da raccontare") fatti[chiaveS(o)] = "niente";
      else if (s.esito === "spenta" || s.esito === "senza chiave") fatti[chiaveS(o)] = s.esito;
      else esiti.push(`sintesi delle ${o}: ${s.esito}`);
    } catch (e) { console.warn("sintesi:", e && e.message); esiti.push(`sintesi delle ${o}: errore ` + String((e && e.message) || e).slice(0, 80)); }
  }
  // 1.24.0 (app 1.55.13): i messaggi delle signore per Michele: una notifica per messaggio, dalle 6:30 alle 22:30
  try {
    const nuovi = Object.values((db.messaggiDaAvvisare ? await db.messaggiDaAvvisare() : {}) || {}).filter(m => m && m.id && m.avvisato === false).sort((x, y) => String(x.ora || "").localeCompare(String(y.ora || "")));
    if (nuovi.length && t.minuti >= MIN(6, 30) && t.minuti < MIN(22, 30)) {
      if (!ps) ps = await db.doc("importazioni", "push-sofia");
      const puoMe3 = tgMe || (!!push && !!ps && !!ps.vapidPublic && iscrizioni().length > 0);
      for (const m of nuovi) {
        const quando = Date.parse(m.ora || "") || 0, vecchio = !quando || adesso.getTime() - quando > 2 * 24 * 3600e3;
        if (m.letto || vecchio) { await db.merge("messaggi_signore", m.id, { avvisato: m.letto ? "letto prima" : "troppo vecchio" }); continue; }
        if (!puoMe3) { esiti.push("messaggi delle signore: nessun telefono con le notifiche accese"); break; }
        const chi = String(m.nome || "Una signora"), ora = quando ? oraRoma(new Date(quando)).hhmm : "";
        const corpo = m.tipo === "foto" ? `📷 Ti ha mandato una foto${m.testo ? `: «${m.testo}»` : "."}` : m.tipo === "file" ? String(m.testo || "") : `«${m.testo || ""}»`;
        const okk = await mandaMe(`${corpo}\n🕐 ${ora ? `alle ${ora} · ` : ""}tocca per leggerlo e rispondere`, `messaggio di ${chi}`, `💬 ${chi} ti scrive${m.prova ? " (prova)" : ""}`, true, { dove: "messaggi", rif: String(m.id).slice(0, 80), tag: ("sofia-msg-" + String(m.id).replace(/[^a-z0-9-]/gi, "-")).slice(0, 40) });
        if (okk) await db.merge("messaggi_signore", m.id, { avvisato: adesso.toISOString() });
      }
    }
  } catch (e) { console.warn("messaggi delle signore:", e && e.message); esiti.push("messaggi delle signore: errore " + String((e && e.message) || e).slice(0, 80)); }
  // 1.25.0: i guasti URGENTISSIMI: una notifica loro al primo giro, poi ogni 2 ore, dalle 7 alle 22, finché non sono «fatto»
  try {
    if (t.minuti >= MIN(7) && t.minuti < MIN(22)) {
      const dovuti = Object.values(await guastiDi()).filter(m => m && m.id && m.stato !== "fatto" && m.gravita === "urgentissimo" && adesso.getTime() - (Date.parse(m.avvisatoUrg || "") || 0) >= OGNI_URG_MS)
        .sort((x, y) => String(x.urgDal || x.data || "").localeCompare(String(y.urgDal || y.data || "")));
      if (dovuti.length) {
        if (!ps) ps = await db.doc("importazioni", "push-sofia");
        const puoMe4 = tgMe || (!!push && !!ps && !!ps.vapidPublic && iscrizioni().length > 0);
        if (!puoMe4) esiti.push("guasti urgentissimi: nessun telefono con le notifiche accese");
        else {
          const camera = await cameraDi();
          for (const m of dovuti.slice(0, 5)) {
            const n = (Number(m.avvisiUrg) || 0) + 1, c = m.camera ? camera(m.camera) : null;
            const testo = [`📍 ${c && c.nome ? c.nome : "In generale"}${m.da ? ` · l'ha segnalato ${m.da}` : ""}${m.data ? ` ${giornoParlato(m.data, oggi)}` : ""}`,
              m.nota ? `📝 ${String(m.nota).replace(/\s+/g, " ").slice(0, 120)}` : "",
              n > 1 ? `🔁 Te lo ricordo per la ${n}ª volta: ogni 2 ore, finché non è sistemato.` : "🔁 Te lo ricordo ogni 2 ore, finché non è sistemato.",
              "👉 Quando è a posto tocca «✅ Sistemato»."].filter(Boolean).join("\n");
            const okk = await mandaMe(testo, `guasto urgentissimo: ${String(m.titolo || m.id).slice(0, 60)}`, `🚨 Urgentissimo: ${String(m.titolo || "un guasto").slice(0, 60)}`, true, { dove: "manutenzione", rif: String(m.id).slice(0, 80), tag: ("sofia-urg-" + String(m.id).replace(/[^a-z0-9-]/gi, "-")).slice(0, 40), azioni: "fatto", vibra: true });
            if (okk) await db.merge("manutenzione", m.id, { avvisatoUrg: adesso.toISOString(), avvisiUrg: n });
          }
        }
      }
    }
  } catch (e) { console.warn("guasti urgentissimi:", e && e.message); esiti.push("guasti urgentissimi: errore " + String((e && e.message) || e).slice(0, 80)); }
  // 1.30.0: il channel manager gratis (calendari-giro.mjs): ogni ora i calendari di Booking, Airbnb ed Expedia nel prospetto
  // (date prese, senza nomi; cambi e cancellazioni da soli; la camera presa due volte → un avviso a Michele) e i nostri
  // calendari alla cassetta su Google (solo quando cambiano). Nel registro solo quanti: mai indirizzi né nomi.
  if (calendari && calendari.scarica) {
    const via = (e) => String((e && e.message) || e || "").replace(/https?:\/\/\S+/g, "(indirizzo)").slice(0, 80);
    try {
      const cc = await db.doc("importazioni", "canali");
      if (calendariDovuti(cc, adesso)) {
        const r = await leggiCalendari({ db, adesso, oggi, scarica: calendari.scarica, avvisa: async (x) => {
          if (!ps) ps = await db.doc("importazioni", "push-sofia");
          const cam = (await cameraDi())(x.camera), sito = { booking: "Booking", airbnb: "Airbnb", expedia: "Expedia" }[x.canale] || x.canale;
          return mandaMe(`${cam.nome}: dal ${L.dataLunga(x.inizio)} al ${L.dataLunga(x.fine)} c'è una prenotazione da ${sito}, ma in quei giorni c'è già ${x.con}. Controlla subito su ${sito}.`, "camera presa due volte", `⚠ ${cam.nome} presa due volte`, true, { dove: "prospetto", tag: `sofia-doppia-${x.camera}` });
        } });
        if (r) esiti.push(r.esito);
      }
      if (cc && cc.chiave && copia && copia.manda && adesso.getTime() - (Date.parse(cc.calProva || "") || 0) >= OGNI_CAL_MS) {
        const cs = await db.doc("importazioni", "copia-sicurezza");
        if (cs && cs.pronta) { const cc2 = await db.doc("importazioni", "canali"); const m = await mandaCalendari({ db, oggi, manda: copia.manda, cassetta: cs, conf: cc2, soggiorni: await db.soggiorniDa(oggi) }); if (m) esiti.push(m.esito); }
        await db.merge("importazioni", "canali", { calProva: adesso.toISOString() });
      }
    } catch (e) { console.warn("calendari:", via(e)); esiti.push("calendari: errore " + via(e)); }
  }
  // 1.31.0: SOFIA SOCIAL MANAGER, il motore (social-giro.mjs): la chiave di Instagram (controllo e rinnovo), le bozze dei
  // post, il post del giorno (martedì e sabato, poi anche giovedì; dalle 18:30), le risposte ai commenti. Nel registro solo
  // quanti: mai la chiave, mai indirizzi, mai i testi dei commenti.
  if (social && social.rete) {
    try {
      const r = await giroSocial({ db, adesso, oggi, minuti: t.minuti, gemini, rete: social.rete, carica: social.carica || null, aspetta: social.aspetta, avvisa: async (x) => {
        if (!ps) ps = await db.doc("importazioni", "push-sofia");
        return mandaMe(x.testo, "social", x.titolo || "📣 Sofia social", !!x.urgente, { dove: "altro", tag: x.tag || "sofia-social" });
      } });
      if (r) esiti.push(r.esito);
    } catch (e) { console.warn("social:", pulitoSocial(e)); esiti.push("social: errore " + pulitoSocial(e)); }
  }
  // 1.29.0: la copia di sicurezza di ogni settimana, nel Google Drive di Michele (copia-giro.mjs). Nel registro pubblico
  // di GitHub solo com'è andata, mai dati né l'indirizzo della cassetta.
  if (copia && copia.fs && copia.manda) {
    try {
      const cs = await db.doc("importazioni", "copia-sicurezza");
      if (copiaDovuta(cs, adesso)) { const r = await faiCopia({ fs: copia.fs, db, adesso, manda: copia.manda, conf: cs, giorno: oggi }); esiti.push(r.esito); }
    } catch (e) { console.warn("copia di sicurezza:", pulitoCopia(e)); esiti.push("copia di sicurezza: errore " + pulitoCopia(e)); }
  }
  const vecchi = Array.isArray(stato0 && stato0.esiti) ? stato0.esiti : [];
  const notevole = lettura && !/^(niente di nuovo|aspetto|aspetta|la sta leggendo)/.test(lettura.esito || "");
  const letturaInfo = notevole ? { quando: adesso.toISOString(), esito: lettura.esito, n: lettura.n || 0 } : ((stato0 && stato0.lettura) || null);
  // 1.18.1: chi ha fatto partire il giro (il ponte sul PC, l'orario di GitHub, Michele a mano) e quando scade la chiave del ponte
  const chi = /^[a-z ]{1,20}$/.test(String(da || "")) ? String(da) : "";
  const spinta = chi === "ponte" ? { spinta: { ultima: adesso.toISOString(), scade: /^\d{4}-\d{2}-\d{2}$/.test(String(scade || "")) ? String(scade) : null } } : {};
  await db.merge("importazioni", "giro-sofia", { giorno: oggi, fatti, ultimo: adesso.toISOString(), versione: VERSIONE_GIRO, ...(chi ? { ultimoDa: chi } : {}), ...spinta, ...(chi === "orologio" ? { orologio: { ultima: adesso.toISOString() } } : {}), letturaTs: lettura && lettura.ts ? lettura.ts : (Number(stato0 && stato0.letturaTs) || 0), letturaTurno: (lettura && lettura.turno) || String((stato0 && stato0.letturaTurno) || ""), ...(letturaInfo ? { lettura: letturaInfo } : {}), esiti: [...vecchi, ...esiti.map(cosa => ({ quando: adesso.toISOString(), cosa }))].slice(-30) });
  return { ora: t.hhmm, giorno: oggi, fatti, esiti, lettura: lettura ? lettura.esito : null, da: chi || null };
}

// ---- il mondo vero: Firestore (firebase-admin) e Telegram ----------------------------------------------
export function dbAdmin(fs) {
  const comeOggetto = (s) => { const o = {}; s.forEach(d => { o[d.id] = { id: d.id, ...d.data() }; }); return o; };
  return {
    doc: async (c, id) => { const s = await fs.collection(c).doc(id).get(); return s.exists ? { id: s.id, ...s.data() } : null; },
    tutti: async (c) => comeOggetto(await fs.collection(c).get()),
    pulizieDi: async (giorni) => comeOggetto(await fs.collection("pulizie").where("data", "in", giorni).get()),
    soggiorniDa: async (iso) => comeOggetto(await fs.collection("soggiorni").where("fine", ">=", iso).get()),
    guastiAperti: async () => comeOggetto(await fs.collection("manutenzione").where("stato", "!=", "fatto").get()),
    merge: (c, id, dati) => fs.collection(c).doc(id).set(dati, { merge: true }),
    salva: (c, id, dati) => fs.collection(c).doc(id).set(dati),
    postaDa: async (ts) => comeOggetto(await fs.collection("posta").where("ts", ">=", ts).get()),   // 1.18.0
    importazioniDa: async (iso) => comeOggetto(await fs.collection("importazioni").where("quando", ">=", iso).get()),   // 1.21.0: le letture di oggi (segreteria_*)
    messaggiDaAvvisare: async () => comeOggetto(await fs.collection("messaggi_signore").where("avvisato", "==", false).get()),   // 1.24.0
    // 1.18.1: aggiorna il documento solo se il campo ha ancora quel valore (la lettura non è cambiata nel frattempo)
    segnaSe: (c, id, campo, valore, dati) => fs.runTransaction(async (tr) => { const ref = fs.collection(c).doc(id); const s = await tr.get(ref); if (!s.exists || (s.data() || {})[campo] !== valore) return false; tr.update(ref, dati); return true; }),
    sostituisci: (c, id, campo, valore) => fs.collection(c).doc(id).update({ [campo]: valore }),
    // 1.27.0: il foglio di papà (i file Excel arrivati dal ponte), le note dal giorno X, e più scritture insieme (a pacchi di 400)
    postaExcel: async () => comeOggetto(await fs.collection("posta").where("tipo", "==", "excel").get()),
    fogliApp: async () => comeOggetto(await fs.collection("importazioni").where("tipo", "==", "foglio_app").get()),   // 1.32.0: «📄 Foglio» dall'app
    noteDa: async (iso) => comeOggetto(await fs.collection("note").where("data", ">=", iso).get()),
    scrivi: async (ops) => {
      for (let i = 0; i < ops.length; i += 400) {
        const b = fs.batch();
        for (const o of ops.slice(i, i + 400)) { const ref = fs.collection(o.coll).doc(o.id); if (o.tipo === "cancella") b.delete(ref); else if (o.tipo === "aggiorna") b.update(ref, o.dati); else if (o.merge) b.set(ref, o.dati, { merge: true }); else b.set(ref, o.dati); }
        await b.commit();
      }
    },
  };
}
// 1.17.0: un avviso sul telefono (Web Push). Le chiavi VAPID le ha create l'app nel telefono del titolare (importazioni/push-sofia).
export function pushVero(webpush) {
  return async (chiavi, sub, dati) => {
    try {
      // 1.17.1: sempre "high": con "normal" Android, a telefono fermo, può tenere l'avviso da parte anche per ore
      const r = await webpush.sendNotification(sub, JSON.stringify({ titolo: dati.titolo, testo: String(dati.testo || "").slice(0, 1800), ...(dati.url ? { url: dati.url } : {}), ...(dati.lettura ? { lettura: true } : {}), ...(dati.dove ? { dove: String(dati.dove) } : {}), ...(dati.rif ? { rif: String(dati.rif) } : {}), ...(dati.segreteria ? { segreteria: dati.segreteria === "lettura" ? "lettura" : true } : {}), ...(dati.tag ? { tag: dati.tag } : {}), ...(dati.azioni ? { azioni: String(dati.azioni).slice(0, 20) } : {}), ...(dati.vibra ? { vibra: true } : {}) }), { TTL: 6 * 3600, urgency: "high", vapidDetails: { subject: "https://michelepegoli2210-hub.github.io/pulizie-stanze-ricci/", publicKey: chiavi.vapidPublic, privateKey: chiavi.vapidPrivato } });
      return { ok: true, stato: (r && r.statusCode) || null };
    } catch (e) { const s = e && e.statusCode; console.warn("avviso sul telefono:", s || (e && e.message), e && e.body ? String(e.body).slice(0, 200) : ""); return { ok: false, finita: s === 404 || s === 410, stato: s || null }; }
  };
}
// 1.17.1: «solo un avviso di prova» a ogni telefono del titolare (dal tasto Run workflow, casella «prova»). Niente giro.
export async function provaAvviso({ db, push, adesso = new Date() }) {
  const t = oraRoma(adesso);
  const ps = await db.doc("importazioni", "push-sofia");
  const lista = Object.entries((ps && ps.iscrizioni) || {}).filter(([, v]) => v && v.sub && v.sub.endpoint && (v.chi || "titolare") === "titolare");
  if (!ps || !ps.vapidPublic || !ps.vapidPrivato || !lista.length) return { ora: t.hhmm, prova: "nessun telefono con gli avvisi accesi" };
  const esiti = [], finite = [];
  for (const [id, v] of lista) {
    const r = await push(ps, v.sub, { titolo: "🔔 Prova delle notifiche", testo: `Prova delle ${t.hhmm}: se leggi questo, le notifiche di Sofia arrivano su questo telefono.`, urgente: true, dove: "altro", tag: "sofia-prova" });
    esiti.push({ telefono: v.nome || id, ok: !!(r && r.ok), stato: (r && r.stato) || null });
    if (r && r.finita) finite.push(id);
  }
  if (finite.length) await db.sostituisci("importazioni", "push-sofia", "iscrizioni", Object.fromEntries(Object.entries(ps.iscrizioni || {}).filter(([id]) => !finite.includes(id))));
  const st = await db.doc("importazioni", "giro-sofia");
  const vecchi = Array.isArray(st && st.esiti) ? st.esiti : [];
  await db.merge("importazioni", "giro-sofia", { esiti: [...vecchi, { quando: adesso.toISOString(), cosa: `prova avviso: partiti ${esiti.filter(e => e.ok).length} su ${esiti.length}` }].slice(-30) });
  return { ora: t.hhmm, prova: esiti, tolte: finite.length };
}
export async function telegramVero(token, chat, testo) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: testo, disable_web_page_preview: true }) });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) console.warn("telegram:", j.description || r.status);
    return !!j.ok;
  } catch (e) { console.warn("telegram:", e.message); return false; }
}
async function main() {
  const sa = String(process.env.FIREBASE_SA || "").trim();
  if (!sa) { console.log("Sofia sempre accesa: manca la chiave FIREBASE_SA (GitHub → Settings → Secrets and variables → Actions). Il giro non parte."); return; }
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  initializeApp({ credential: cert(JSON.parse(sa)) });
  const webpush = (await import("web-push")).default;
  if (String(process.env.PROVA_AVVISO || "") === "true") {
    const r = await provaAvviso({ db: dbAdmin(getFirestore()), push: pushVero(webpush) });
    console.log("Sofia sempre accesa (solo avviso di prova):", JSON.stringify(r));
    return;
  }
  const chiave = String(process.env.GEMINI_CHIAVE || "").trim();
  // 1.18.1: chi lo fa partire: il ponte sul PC (input "da"), l'orario di GitHub, o Michele col tasto «Run workflow»
  const ev = String(process.env.GITHUB_EVENT_NAME || "");
  const da = String(process.env.GIRO_DA || "").trim().toLowerCase() || (ev === "schedule" ? "orario" : ev === "workflow_dispatch" ? "a mano" : "");
  const esito = await giro({ db: dbAdmin(getFirestore()), telegram: telegramVero, push: pushVero(webpush), adesso: new Date(), gemini: chiave ? { chiave } : null, da, scade: String(process.env.GIRO_SCADE || "").trim(), copia: { fs: getFirestore(), manda: mandaCassetta }, calendari: { scarica: scaricaCalendario }, social: { rete: reteVera, carica: caricaGithub(), aspetta: (ms) => new Promise(r => setTimeout(r, ms)) } });
  console.log("Sofia sempre accesa:", JSON.stringify(esito));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error("Sofia sempre accesa: errore", e && e.message); process.exitCode = 1; });
