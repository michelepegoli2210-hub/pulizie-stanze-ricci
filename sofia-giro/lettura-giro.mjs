// ============================================================================
//  SOFIA LEGGE LE CHAT ANCHE AD APP CHIUSA (1.18.0) — il pezzo del giro sempre acceso che legge la posta del ponte
//  Michele, 31/10: "far leggere a Sofia le chat anche ad app chiusa, con un avviso «ho letto, controlla», e insegnarle
//  le assenze delle signore, i guasti, i detersivi". Prima la posta del ponte la leggeva solo il telefono «lettore» con
//  l'app aperta. Adesso, ogni 10 minuti, se sono arrivati messaggi nuovi e da 5 minuti nessuno scrive più:
//   1. si prende la posta non letta (il ponte la mette in «posta», i vocali e le foto in «posta_media»);
//   2. i vocali li trascrive Gemini (6 per volta, come l'app; la trascrizione resta nel messaggio, non si rifà);
//   3. si fa la STESSA richiesta dell'app (lettura.js): nomi degli ospiti in codice, telefoni ed email mai a Gemini;
//   4. il risultato, coi nomi veri, va in importazioni/lettura-sofia (da_controllare): lo apre qualunque telefono;
//   5. la posta si segna letta e al titolare arriva l'avviso sul telefono «Ho letto 6 messaggi: 2 cambi… Tocca per controllare».
//  Non salva MAI niente nel prospetto: quello lo fa Michele col suo «Salva». Se una lettura aspetta il controllo, la posta
//  nuova aspetta (come nell'app); dopo un giorno senza controllo si rilegge tutto insieme. Se il telefono sta leggendo
//  (in_lettura da meno di 15 minuti) il giro non tocca niente.
//  1.18.1: l'avviso «ho letto» arriva anche per le letture fatte dal telefono o dal PC con l'app aperta (prima l'avviso lo
//  mandava solo il giro per le sue): se una lettura aspetta il controllo da almeno 2 minuti, nessuno l'ha aperta e non è
//  ancora stata avvisata, parte l'avviso (una volta sola, segno «avvisata»). Gli avvisi delle letture partono solo dalle 7
//  alle 22:30: una lettura fatta di notte si avvisa al primo giro dopo le 7.
//  1.23.0 (app 1.53.0): NIENTE PIÙ LETTURE DA CONTROLLARE (Michele: «se la segreteria fa bene il suo dovere non serve più»): si
//  legge sempre col modo nuovo (avvisi.prospettoChat non conta più) e una lettura «da_controllare» del tipo di prima non ferma
//  più la posta: se è di meno di 3 ore la rileggo insieme alla posta nuova (quella di prima diventa «sostituita»), altrimenti
//  la metto da parte («scartata», in Segreteria c'è «🔄 Rileggila»). Niente più avviso «Tocca per controllare e salvare».
//  1.26.0 (app 1.58.1): SI RISPARMIA (Michele, 7/11: «ogni 4 ore… le cose tipo solo ok, trascrizione: il modello gratuito, fammi
//  risparmiare parecchio… i guasti e le indicazioni urgenti me le devi mettere subito nell'applicazione; per tutto il resto va
//  bene ogni 4 ore»). Argon (il modello caro) legge le chat solo alle 8, alle 12, alle 16 e alle 20. A ogni giro, se ci sono
//  messaggi nuovi, prima li guarda il modello economico (IL VAGLIO, solo i messaggi nuovi e una paginetta di istruzioni):
//  «urgente» (un guasto, un danno, una cosa da fare oggi o subito) → Argon legge SUBITO, come prima; «niente» (ok, grazie,
//  saluti) → Argon non li legge mai; «normale» → aspettano il turno. Il giudizio resta sul messaggio (posta/<id>.vaglio): ogni
//  messaggio si guarda una volta sola. Se il vaglio non riesce si legge subito (meglio spendere che perdere un guasto).
//  I vocali li trascrive il modello economico (Argon legge il testo); anche la sintesi delle 8:30 e delle 20:30.
// ============================================================================
import * as L from "../logica.js";
import * as LET from "../lettura.js";
import * as IA from "../ia.js";
import { aliasPerCamera, completaRiga } from "../dettatura.js";
import { TIPI_OSPITE } from "../regole.js";

export const QUIETE_MS = 5 * 60 * 1000, LOCK_MS = 15 * 60 * 1000, SCADE_MS = 24 * 3600 * 1000, MARGINE_MS = 60 * 60 * 1000;
const MAX_VOCALI = 60, MAX_FOTO = 4;
// 1.26.0: i vocali, il vaglio e la sintesi: prima il modello economico (flash-lite), poi quello di mezzo; mai Argon
export const ORDINE_ECONOMICO = ["svelta", "sveglia"];
// 1.18.1: l'avviso di una lettura fatta da un telefono parte dopo 2 minuti (se nel frattempo l'ha aperta, niente avviso);
// gli avvisi delle letture solo dalle 7 alle 22:30 (minuti dell'ora di Roma; senza ora, sempre)
export const ATTESA_AVVISO_MS = 2 * 60 * 1000, ORE_AVVISO = [7 * 60, 22 * 60 + 30];
// 1.23.0: una lettura del tipo di prima di meno di 3 ore si rilegge; quella più vecchia si mette da parte con questa frase (la stessa dell'app)
export const FRESCA_MS = 3 * 3600 * 1000, NON_VECCHIA = "Era una lettura del tipo di prima (da spuntare e salvare): l'ho messa da parte. Se vuoi, tocca «🔄 Rileggila»: la rileggo e metto a posto l'app da sola.";
export const oraDiAvvisi = (minuti) => minuti === undefined || minuti === null || (minuti >= ORE_AVVISO[0] && minuti < ORE_AVVISO[1]);
// 1.26.0: I TURNI DI ARGON (le chat si leggono alle 8, 12, 16 e 20) e IL VAGLIO (il modello economico guarda i messaggi nuovi)
export const ORE_LETTURA = [8, 12, 16, 20];
// l'ultimo turno già cominciato, per esempio "2026-11-07@12"; prima delle 8 vale quello delle 20 di ieri
export function turnoLettura(oggi, minuti) {
  const h = Math.floor((Number(minuti) || 0) / 60), passati = ORE_LETTURA.filter(x => x <= h);
  return passati.length ? `${oggi}@${String(passati[passati.length - 1]).padStart(2, "0")}` : `${L.aggiungiGiorni(oggi, -1)}@${String(ORE_LETTURA[ORE_LETTURA.length - 1]).padStart(2, "0")}`;
}
export function prossimaLettura(minuti) {
  const h = Math.floor((Number(minuti) || 0) / 60), p = ORE_LETTURA.find(x => x > h);
  return p !== undefined ? `delle ${p}` : `delle ${ORE_LETTURA[0]} di domattina`;
}
export function istruzioniVaglio(base) {
  const camere = ((base && base.camere) || []).map(c => String(c.nome || "").replace(" · ", " ")).filter(Boolean).join(", ");
  const signore = ((base && base.signore) || []).map(s => s && s.nome).filter(Boolean).join(", ");
  return [
    `VAGLIO. Sei la segretaria delle Stanze di Ricci, un piccolo albergo${camere ? ` (le camere: ${camere})` : ""}${signore ? `; le signore delle pulizie: ${signore}` : ""}.`,
    "Ti mando SOLO i messaggi WhatsApp appena arrivati. Non devi rispondere e non devi fare niente: devi solo dire se c'è qualcosa di URGENTE.",
    'Rispondi SOLO con un JSON così: {"tipo":"urgente","perche":"poche parole"}; al posto di "urgente" puoi mettere "normale" o "niente".',
    "- urgente: un guasto o un danno (perde acqua, si è rotto, non funziona, non c'è acqua calda, manca la luce, la porta o la serratura non va, si è allagato, un pericolo); oppure una cosa da fare OGGI o SUBITO (una camera da preparare per chi arriva oggi, un cambio per oggi, «subito», «urgente», «adesso», «entro le…»); oppure una cosa che chiedono a MICHELE di fare lui in persona (le chiavi da mettere o da portare, chiamare qualcuno, andare in albergo, portare o comprare una cosa); oppure una persona o un ospite che sta male o ha un problema adesso.",
    "- niente: solo saluti, «ok», «va bene», «grazie», emoji, auguri, cose che non riguardano l'albergo.",
    "- normale: tutto il resto (cose per i prossimi giorni, informazioni, domande che possono aspettare qualche ora).",
    "Se hai un dubbio tra urgente e normale, scegli urgente. Se anche una sola cosa è urgente, la risposta è urgente.",
  ].join("\n");
}
// ritorna { tipo: urgente | normale | niente, perche, modello }; una risposta che non si capisce vale «urgente» (si legge subito)
export async function vaglia(gemini, msgs, immagini, base) {
  const righe = msgs.map(m => `${m.ora ? m.ora + " " : ""}${m.chi || "?"}${m.chat ? ` (${m.chat})` : ""}: ${String(m.testo || "").slice(0, 600)}`);
  const foto = immagini && immagini.length ? immagini : null;
  const { r } = await chiediGemini(gemini, { sistema: istruzioniVaglio(base), storia: [], testo: `I messaggi appena arrivati${foto ? ` (ti mando anche ${foto.length === 1 ? "una foto" : foto.length + " foto"}: guardale)` : ""}:\n${righe.join("\n").slice(-8000)}`, immagine: foto, secondi: 45, maxToken: 400 }, ORDINE_ECONOMICO);
  const j = LET.jsonDaRisposta(r.grezzo) || {};
  const t = String(j.tipo || "").toLowerCase().trim();
  return { tipo: ["urgente", "normale", "niente"].includes(t) ? t : "urgente", perche: String(j.perche || "").slice(0, 120), modello: r.modello || "" };
}

// il nome di Sofia, come lo mostra l'app (tutto maiuscolo → normale)
export function nomeGovDa(gov) {
  const n = (gov && String(gov.nome || "").trim()) || "";
  if (n && n === n.toUpperCase() && n !== n.toLowerCase()) return n.split(/(\s+)/).map(w => w.charAt(0) + w.slice(1).toLowerCase()).join("");
  return n || "Consuela";
}
export function testoRiassunto(r) {
  const p = (n, uno, tanti) => n ? `${n} ${n === 1 ? uno : tanti}` : "";
  return [p(r.cambi, "cambio nel prospetto", "cambi nel prospetto"), p(r.indicazioni, "indicazione per le signore", "indicazioni per le signore"), p(r.assenze, "assenza", "assenze"), p(r.guasti, "guasto", "guasti"), p(r.spesa, "cosa da comprare", "cose da comprare"), p(r.note, "cosa da sapere", "cose da sapere"), p(r.ore, "orario scritto da una signora", "orari scritti dalle signore"), p(r.telefoni, "numero di telefono", "numeri di telefono")].filter(Boolean).join(" · ");
}
// 1.22.0: l'avviso di una lettura del modo nuovo: cosa c'è da mettere a posto (lo fa l'app) e cosa chiede; apre la Segreteria
export function avvisoApplica(x, nomeGov) {
  // 1.25.0 (Michele, 7/11: «le notifiche devono essere ultra comprensibili»): nel titolo quante cose e quante domande; dentro le
  // parole di Sofia (la «risposta» della lettura: 2-4 frasi semplici, chi ha scritto e di cosa), poi i guasti uno per riga
  const n = Number(x && x.n) || 0, r = (x && x.riassunto) || {}, jj = (x && x.j) || {};
  const nomeCamera = typeof (x && x.nomeCamera) === "function" ? x.nomeCamera : (id) => id;
  const domande = (Number(r.proposte) || 0) + (Number(r.dubbi) || 0) + (Number(r.ore) || 0);
  const chats = [...new Set((Array.isArray(x && x.fonte && x.fonte.chats) ? x.fonte.chats : []).map(c => String(c).replace(/^chat con /, "")).filter(Boolean))].slice(0, 3).join(", ");
  const righe = [];
  const risp = String(jj.risposta || "").replace(/\s+/g, " ").trim();
  righe.push(risp ? (risp.length > 320 ? risp.slice(0, 317).replace(/\s+\S*$/, "") + "…" : risp) : `Ho letto ${n === 1 ? "un messaggio" : n ? n + " messaggi" : "i messaggi"}${chats ? ` (${chats})` : ""}.`);
  const guasti = (Array.isArray(jj.azioni) ? jj.azioni : []).filter(a => a && a.tipo === "manutenzione" && a.modo !== "chiudi" && a.cosa && a.urgente).slice(0, 3);   // 1.28.0: solo gli urgenti
  if (!domande && !guasti.length) return null;   // 1.28.0: niente per Michele: niente avviso (lo vede in Segreteria)
  for (const a of guasti) righe.push(`🚨 ${String(a.cosa).replace(/\s+/g, " ").slice(0, 80)}${a.camera ? ` (${nomeCamera(a.camera)})` : ""}`);
  righe.push(domande ? `👉 ${domande === 1 ? "C'è una cosa" : `Ci sono ${domande} cose`} da decidere: tocca per rispondere.` : "👉 Tocca per vedere.");
  const titolo = guasti.length && !domande ? `🚨 Guasto urgente: ${String(guasti[0].cosa).replace(/\s+/g, " ").slice(0, 50)}${guasti[0].camera ? ` (${nomeCamera(guasti[0].camera)})` : ""}`
    : `✋ ${nomeGov || "Sofia"} ti propone: ${domande === 1 ? "una cosa" : domande + " cose"} da decidere${guasti.length ? ` · 🚨 ${guasti.length === 1 ? "un guasto urgente" : guasti.length + " guasti urgenti"}` : ""}`;
  return { titolo, testo: righe.join("\n"), extra: { url: "./index.html?segreteria=lettura", segreteria: "lettura", tag: "sofia-lettura" } };
}
// 1.18.1: il testo dell'avviso «ho letto» (lo stesso per le letture del giro e per quelle del telefono)
export function avvisoLettura(x, nomeGov) {
  const n = Number(x && x.n) || 0, cosa = testoRiassunto((x && x.riassunto) || {});
  const chats = [...new Set((Array.isArray(x && x.fonte && x.fonte.chats) ? x.fonte.chats : []).map(c => String(c).replace(/^chat con /, "")).filter(Boolean))].slice(0, 3).join(", ");
  return { titolo: `${nomeGov || "Sofia"} · ho letto WhatsApp`, testo: `Ho letto ${n === 1 ? "un messaggio" : n ? n + " messaggi" : "i messaggi"}${chats ? ` (${chats})` : ""}${cosa ? `: ${cosa}` : ""}. Tocca per controllare e salvare.` };
}
const dIso = (x) => /^\d{4}-\d{2}-\d{2}$/.test(String(x || "").trim()) ? String(x).trim() : "";
function cameraDa(x, ctx) {
  const t = String(x || "").trim(); if (!t) return null;
  const n = t.toLowerCase();
  const c = ctx.camere.find(c => c.id === t || c.id.toLowerCase() === n || String(c.nome).toLowerCase() === n);
  if (c) return c.id;
  for (const [id, lista] of Object.entries(ctx.alias || {})) if (lista.some(a => a === n)) return ctx.camere.some(c => c.id === id) ? id : null;
  return null;
}
// quante cose cambiano davvero (stesso confronto dell'app: completaRiga) — serve solo per il testo dell'avviso
export function riassuntoGiro(j, ctx) {
  if (ctx.prospettoChat === false) j = { ...j, soggiorni: [], togli: [] };   // 1.49.0: il prospetto arriva dal foglio Excel
  const sog = ctx.soggiorni || [], oggi = ctx.oggi;
  let cambi = 0;
  for (const x of (Array.isArray(j.soggiorni) ? j.soggiorni : []).slice(0, 80)) {
    const camera = cameraDa(x && x.camera, ctx), inizio = dIso(x && x.arrivo), fine = dIso(x && x.partenza);
    if (!camera || !inizio || !fine || fine <= inizio) continue;
    const tipo = TIPI_OSPITE[x.tipo] ? x.tipo : null;
    const r = { camera, testo: "", azione: "nuovo", nome: String(x.nome || "?").slice(0, 48), persone: Math.max(1, Math.min(12, Math.round(Number(x.persone) || 0))) || null, tipo, inizio, fine, nota: String(x.nota || "").slice(0, 160), notaPrivata: "", telefono: "", dubbio: false, motivi: [], assunti: [], scelto: true, base: L.lunediDi(inizio), inizioDetto: true, fineDetta: true, tipoDetto: !!tipo, durata: null, comeScorsa: false, libera: false, haParoleParte: false, haParoleProlunga: false, daSofia: true };
    try { completaRiga(r, { oggi, soggiorni: sog, nomeCamera: (id) => (ctx.camere.find(c => c.id === id) || { nome: id }).nome }); } catch (e) {}
    if (r.azione !== "niente") cambi++;
  }
  for (const x of (Array.isArray(j.togli) ? j.togli : []).slice(0, 30)) {
    const camera = cameraDa(x && x.camera, ctx), nome = LET.nucleoNome(String((x && x.nome) || "")).toLowerCase();
    if (camera && nome && sog.some(s => s.camera === camera && LET.nucleoNome(s.nome).toLowerCase() === nome && s.fine >= L.aggiungiGiorni(oggi, -3))) cambi++;
  }
  const n = (k) => (Array.isArray(j[k]) ? j[k] : []).filter(Boolean).length;
  return { perTe: n("perTe"), cambi, indicazioni: n("indicazioni"), assenze: n("assenze"), guasti: n("guasti"), spesa: n("spesa"), note: n("note"), ore: n("ore"), telefoni: n("telefoni"), azioni: n("azioni"), proposte: n("proposte"), dubbi: n("dubbi") };   // 1.38.0: ore e telefoni; 1.22.0: azioni, proposte, dubbi
}
// Gemini: prima Argon, poi il modello sveglio, poi lo svelto (come l'app)
export async function chiediGemini(gemini, dom, ordine = ["argon", "sveglia", "svelta"]) {   // 1.49.0: la sintesi della sera passa solo dai modelli gratuiti
  if (typeof gemini.chiedi === "function") return gemini.chiedi(dom, ordine);   // le prove
  let errore = null;
  for (const qualita of ordine) {
    try {
      gemini.modelli = gemini.modelli || {};
      const conf = { fornitore: "gemini", chiave: gemini.chiave, qualita, modello: gemini.modelli[qualita] || "" };
      if (!conf.modello) { const t = await IA.trovaModello(conf); conf.modello = t.modello; gemini.modelli[qualita] = t.modello; }
      const r = await IA.chiedi({ ...dom, conf });
      return { r, ripiego: qualita !== ordine[0] };
    } catch (e) { errore = e; console.warn("gemini/" + qualita + ":", e && e.message); }
  }
  throw errore || new Error("nessun modello risponde");
}
// il contesto della lettura, dal database (le stesse cose che l'app prende dalla sua memoria)
export async function ctxDalDatabase(db, { oggi, camere, signore }) {
  const [sog, cl, gov, tac] = await Promise.all([db.soggiorniDa(L.aggiungiGiorni(oggi, -14)), db.tutti("clienti"), db.doc("impostazioni", "governante"), db.doc("importazioni", "taccuino-sofia")]);
  const soggiorni = Object.values(sog || {}).filter(s => s && s.camera && s.inizio && s.fine).sort((a, b) => (a.inizio < b.inizio ? -1 : 1));
  const clienti = {}; for (const [k, v] of Object.entries(cl || {})) { const { id, ...resto } = v || {}; clienti[k] = resto; }
  const ctx = { oggi, camere, soggiorni, clienti, signore, nomeGov: nomeGovDa(gov), nomeMio: "Michele", alias: aliasPerCamera(), tipiOspite: TIPI_OSPITE };
  ctx.taccuino = LET.taccuinoPerIA((tac && Array.isArray(tac.voci)) ? tac.voci : [], ctx);
  return ctx;
}

// 1.26.0: i messaggi della posta come li legge Sofia (col nome della chat davanti se sono più di una)
export function messaggiDa(lista, oggi) {
  const chats = new Map();
  for (const p of lista) { const nome = p.chat || "Albergo"; if (!chats.has(nome)) chats.set(nome, p.gruppo !== false); }
  const piu = chats.size > 1;
  const msgs = lista.map(p => { const nome = p.chat || "Albergo"; return { id: p.id, data: p.data || oggi, ora: p.ora || "", chi: p.chi || "", testo: p.testo || "", tipo: p.tipo, media: !!p.media, didascalia: p.didascalia || "", trascrizione: p.trascrizione || "", chat: piu ? (chats.get(nome) ? nome : "chat con " + nome) : "", chatNome: chats.get(nome) ? nome : "chat con " + nome, mio: !!p.mio }; })
    .sort((x, y) => ((x.data || "") + (x.ora || "")).localeCompare((y.data || "") + (y.ora || "")));
  return { msgs, chats };
}
// i vocali: quelli già trascritti si usano, gli altri li trascrive il modello economico (6 per volta; la trascrizione resta nel messaggio)
export async function trascriviVocali(db, gemini, msgs, base) {
  const daTrascrivere = msgs.filter(m => m.tipo === "audio" && m.media && !m.trascrizione).slice(-MAX_VOCALI);
  for (const m of msgs) if (m.tipo === "audio" && m.trascrizione) m.testo = `🎤 (vocale) ${m.trascrizione}`;
  const nomiCamere = base.camere.map(c => String(c.nome).replace(" · ", " ")).join(", ");
  for (let i = 0; i < daTrascrivere.length; i += 6) {
    const lotto = daTrascrivere.slice(i, i + 6), parti = [];
    for (const m of lotto) { const x = await db.doc("posta_media", m.id); if (x && x.dati && x.dati.length < 8e6) parti.push({ m, mime: x.mime || "audio/ogg", dati: x.dati }); }
    if (!parti.length) continue;
    try {
      const { r } = await chiediGemini(gemini, { sistema: LET.istruzioniTrascrizione(nomiCamere, parti.length, { signore: (base.signore || []).map(s => s.nome) }), storia: [], testo: LET.testoTrascrizione(parti.length), immagine: parti.map(p => ({ mime: p.mime, dati: p.dati })), secondi: 120, maxToken: 8000 }, ORDINE_ECONOMICO);
      const j = LET.jsonDaRisposta(r.grezzo), lista = j && Array.isArray(j.vocali) ? j.vocali : [];
      for (const [k, p] of parti.entries()) {
        const t = String(lista[k] || "").trim();
        p.m.testo = t ? `🎤 (vocale) ${t}` : "🎤 (un vocale che non ho capito)";
        if (t) { p.m.trascrizione = t; try { await db.merge("posta", p.m.id, { trascrizione: t.slice(0, 7000) }); } catch (e) {} }
      }
    } catch (e) { console.warn("trascrizione:", e && e.message); for (const p of parti) p.m.testo = "🎤 (un vocale che non sono riuscita ad ascoltare)"; if (/credito|402|prepay/i.test(String(e && e.message))) throw e; }
  }
}
// le foto: le ultime 4 le guarda insieme ai messaggi; i messaggi senza testo prendono una riga che dice cosa sono
export async function fotoEtesti(db, msgs) {
  const did = (m) => (m.didascalia ? " " + m.didascalia : "");
  const immagini = [];
  for (const m of msgs.filter(m => m.tipo === "foto" && m.media).slice(-MAX_FOTO)) { const x = await db.doc("posta_media", m.id); if (x && x.dati) { immagini.push({ mime: x.mime || "image/jpeg", dati: x.dati }); m.testo = `📷 (foto n. ${immagini.length}: la vedi tra le immagini)${did(m)}`; } }
  for (const m of msgs) if (!m.testo) m.testo = m.tipo === "audio" ? "🎤 (un vocale che non ho ascoltato)" : m.tipo === "foto" ? "📷 (una foto)" + did(m) : "";
  return immagini;
}

// ---- la lettura --------------------------------------------------------------------------------------------------------
// ritorna { esito, ts (fin dove ha guardato la posta), riassunto?, n?, avvisa?: {titolo, testo}, avvisataLid?, credito? }
// minuti: l'ora di Roma in minuti (1.18.1: gli avvisi delle letture solo dalle 7 alle 22:30)
export async function leggiChat({ db, gemini, adesso = new Date(), a = {}, letturaTs = 0, oggi, prendiBase, minuti, turnoLetto = "" }) {
  if (a.giroLettura === false) return { esito: "spenta", ts: letturaTs };
  if (!gemini || (!gemini.chiave && typeof gemini.chiedi !== "function")) return { esito: "senza chiave", ts: letturaTs };
  const ora = adesso.getTime(), t0 = Date.now(), finito = () => new Date(ora + (Date.now() - t0)).toISOString();
  const lett = await db.doc("importazioni", "lettura-sofia");
  let vecchie = [];
  // 1.28.0: rileggendo una lettura che nessuna app ha messo a posto, «Da fare tu» tiene «fatto», «rimanda» e le volte che ha suonato
  let perTePrima = [], avvisiPrima = {};
  const perTeNuove = (nuove) => { const perTe = LET.perTeTieni(nuove, perTePrima), av = LET.perTeAvvisiTieni(perTe, perTePrima, avvisiPrima); return { perTe, ...(Object.keys(av).length ? { perTeAvvisi: av } : {}) }; };
  // 1.22.0: una lettura «da_applicare» (modo nuovo) la mette a posto la prima app del titolare che si apre: si aspetta 2 ore, poi
  // si rilegge insieme alla posta nuova (quella vecchia, mai applicata, diventa «sostituita»)
  if (lett && lett.stato === "da_applicare") {
    if (ora - Date.parse(lett.quando || 0) < 2 * 3600 * 1000) return { esito: "aspetta che l'app la metta a posto", ts: letturaTs };
    vecchie = Array.isArray(lett.postaIds) ? lett.postaIds : [];
    if (lett.lid) { try { const v = await db.doc("importazioni", "segreteria_" + lett.lid); if (v) { perTePrima = Array.isArray(v.perTe) ? v.perTe : []; avvisiPrima = v.perTeAvvisi || {}; } } catch (e) {} }   // 1.28.0
    if (lett.lid) { try { await db.merge("importazioni", "segreteria_" + lett.lid, { esito: "sostituita" }); } catch (e) {} }
  }
  // 1.23.0: una lettura «da_controllare» (del tipo di prima) non aspetta più il controllo: di meno di 3 ore si rilegge col modo nuovo
  // insieme alla posta nuova (si segna «sostituita» solo quando parte davvero la lettura), più vecchia si mette da parte subito
  let sostituisci = "";
  if (lett && lett.stato === "da_controllare") {
    if (ora - Date.parse(lett.quando || 0) < FRESCA_MS) { vecchie = Array.isArray(lett.postaIds) ? lett.postaIds : []; sostituisci = lett.lid || "-"; }
    else {
      try { await db.merge("importazioni", "lettura-sofia", { stato: "scartata", chiusa: { chi: "giro 1.23 (lettura del tipo di prima)", quando: adesso.toISOString() } }); } catch (e) { console.warn("lettura di prima:", e && e.message); }
      if (lett.lid) { try { await db.merge("importazioni", "segreteria_" + lett.lid, { esito: "scartata", non: [NON_VECCHIA] }); } catch (e) {} }
    }
  }
  if (lett && lett.stato === "in_lettura" && ora - Date.parse(lett.quando || 0) < LOCK_MS) return { esito: "la sta leggendo il telefono", ts: letturaTs };
  const da = letturaTs ? letturaTs - MARGINE_MS : ora - SCADE_MS;
  const nuove = Object.values((await db.postaDa(da)) || {}).filter(p => p && p.id && !p.letto && (p.tipo === "testo" || p.tipo === "audio" || p.tipo === "foto"));
  const turnoOra = minuti !== undefined && minuti !== null ? turnoLettura(oggi, minuti) : "";   // 1.26.0: il turno passa anche se non c'è niente
  if (!nuove.length && !vecchie.length) return { esito: "niente di nuovo", ts: letturaTs, turno: turnoOra };
  if (nuove.some(p => ora - (Number(p.ts) || 0) < QUIETE_MS)) return { esito: "aspetto che finiscano di scrivere", ts: letturaTs };
  const ultimoTs = Math.max(letturaTs || 0, ...nuove.map(p => Number(p.ts) || 0));
  const tutte = [...nuove];
  for (const id of vecchie) if (!tutte.some(p => p.id === id)) { const p = await db.doc("posta", id); if (p) tutte.push(p); }
  if (!tutte.length) return { esito: "niente di nuovo", ts: ultimoTs };
  // 1.26.0: IL VAGLIO (solo dal giro, che sa l'ora; le letture di prima da rifare si leggono subito, come prima)
  let turnoNuovo = "", baseVaglio = null;
  if (!vecchie.length && minuti !== undefined && minuti !== null) {
    const turno = turnoLettura(oggi, minuti), dovuto = turnoLetto !== turno;
    let urgente = tutte.some(p => p.vaglio === "urgente");
    const daVagliare = tutte.filter(p => !p.vaglio);
    if (daVagliare.length && !urgente) {
      let tipo = "urgente", perche = "";
      try {
        baseVaglio = await prendiBase();
        const { msgs: mv } = messaggiDa(daVagliare, oggi);
        await trascriviVocali(db, gemini, mv, baseVaglio);
        for (const m of mv) if (m.trascrizione) { const p = daVagliare.find(x => x.id === m.id); if (p) p.trascrizione = m.trascrizione; }
        const imm = await fotoEtesti(db, mv);
        const v = await vaglia(gemini, mv.filter(m => m.testo), imm, baseVaglio);
        tipo = v.tipo; perche = v.perche;
      } catch (e) { console.warn("vaglio:", e && e.message); tipo = "urgente"; perche = "il controllo non è riuscito: leggo subito"; }
      for (const p of daVagliare) { p.vaglio = tipo; try { await db.merge("posta", p.id, { vaglio: tipo, ...(perche ? { vaglioPerche: perche.slice(0, 120) } : {}) }); } catch (e) {} }
      if (tipo === "urgente") urgente = true;
    }
    if (!urgente && tutte.every(p => p.vaglio === "niente")) {   // solo saluti: Argon non serve
      for (const p of tutte) { try { await db.merge("posta", p.id, { letto: true }); } catch (e) {} }
      return { esito: `niente da leggere (solo saluti: ${tutte.length === 1 ? "un messaggio" : tutte.length + " messaggi"})`, ts: ultimoTs, turno: dovuto ? turno : "" };
    }
    if (!urgente && !dovuto) return { esito: `aspetto il turno ${prossimaLettura(minuti)} (${tutte.length === 1 ? "un messaggio" : tutte.length + " messaggi"}; le cose urgenti le leggo subito)`, ts: letturaTs };
    turnoNuovo = dovuto ? turno : "";
  }
  const ids = tutte.map(p => p.id), id = "giro_" + ora.toString(36);
  if (sostituisci && sostituisci !== "-") { try { await db.merge("importazioni", "segreteria_" + sostituisci, { esito: "sostituita" }); } catch (e) {} }   // 1.23.0
  await db.salva("importazioni", "lettura-sofia", { lid: id, stato: "in_lettura", da: "giro", quando: adesso.toISOString(), postaIds: ids });
  try {
    const base = baseVaglio || await prendiBase();      // camere e signore (si leggono solo quando c'è davvero da leggere; 1.26.0: se le ha già prese il vaglio, quelle)
    // le chat: col nome davanti se sono più di una (come l'app)
    const { msgs, chats } = messaggiDa(tutte, oggi);   // 1.26.0: i tre pezzi qui sotto ora sono funzioni (li usa anche il vaglio)
    await trascriviVocali(db, gemini, msgs, base);
    const immagini = await fotoEtesti(db, msgs);
    const scelti = msgs.filter(m => m.testo);
    if (!scelti.length) {
      for (const pid of ids) { try { await db.merge("posta", pid, { letto: true }); } catch (e) {} }
      await db.salva("importazioni", "lettura-sofia", { lid: id, stato: "vuota", da: "giro", quando: adesso.toISOString(), postaIds: ids, n: 0 });
      return { esito: "niente da leggere", ts: ultimoTs, turno: turnoNuovo };
    }
    // chi fa il prospetto: «Papà» (il nome che il ponte dà alla sua chat)
    const papa = scelti.some(m => m.chi === "Papà") ? "Papà" : "";
    const ctx = await ctxDalDatabase(db, { ...base, oggi });
    ctx.prospettoChat = false;   // 1.49.0: il prospetto arriva dal foglio Excel di papà; 1.23.0: sempre (l'interruttore «Prospetto anche dalle chat» non c'è più)
    if (!ctx.prospettoChat) {   // 1.22.0: il modo nuovo: Sofia vede il giro delle signore dei prossimi tre giorni e l'ora
      const giorni = [0, 1, 2].map(n => L.aggiungiGiorni(oggi, n));
      try { ctx.giro = Object.values((await db.pulizieDi(giorni)) || {}).filter(p => p && !p.nonServe && p.stato !== "non_fatta" && p.tipo !== "stelle").map(p => ({ data: p.data, zona: p.zona, camera: p.camera || "", tipo: p.tipo, titolo: p.titolo || "", insieme: p.insieme || "", stato: p.stato || "" })); ctx.giroGiorni = giorni; } catch (e) { console.warn("giro delle signore:", e && e.message); }
      if (minuti !== undefined && minuti !== null) ctx.ora = `${String(Math.floor(minuti / 60)).padStart(2, "0")}:${String(minuti % 60).padStart(2, "0")}`;
    }
    ctx.persone = [...new Set(scelti.flatMap(m => [m.chi, m.chat && String(m.chat).replace(/^chat con /, "")]).filter(Boolean))];
    const codici = LET.creaCodici(ctx);
    const { testo, tagliati, telefoni } = LET.testoPerLettura(scelti, papa, ctx, codici);
    const { r, ripiego } = await chiediGemini(gemini, { sistema: LET.istruzioniLettura(ctx, codici), storia: [], testo: `${immagini.length ? `Ti mando anche ${immagini.length === 1 ? "una foto" : immagini.length + " foto"} della chat (numerate nell'ordine, nei messaggi trovi "foto n. 1"...): se sono il prospetto scritto a mano o stampato, leggile come il resto.\n` : ""}ECCO I MESSAGGI (${scelti.length}${tagliati ? `, i ${tagliati} più vecchi li ho lasciati fuori` : ""}):\n${testo}`, immagine: immagini.length ? immagini : null, secondi: 150, maxToken: 16000 });
    const j0 = LET.rimettiTelefoni(LET.jsonDaRisposta(r.grezzo), telefoni);
    if (!j0 || typeof j0 !== "object") throw new Error("Gemini ha risposto in un modo che non capisco");
    const j = ctx.prospettoChat === false ? { ...codici.daCodiciProfondo(j0), soggiorni: [], togli: [] } : codici.daCodiciProfondo(j0);   // 1.22.0: dalle chat niente prospetto (arriva dal foglio Excel)
    const chat = ctx.prospettoChat === false;   // 1.22.0: il modo nuovo: la lettura la mette a posto l'app (da_applicare)
    const riassunto = riassuntoGiro(j, ctx), ha = chat ? !!(riassunto.perTe || riassunto.azioni || riassunto.proposte || riassunto.dubbi || riassunto.assenze || riassunto.guasti || riassunto.spesa || riassunto.note || riassunto.ore || riassunto.telefoni) : !!(riassunto.cambi || riassunto.indicazioni || riassunto.assenze || riassunto.guasti || riassunto.spesa || riassunto.note || riassunto.ore || riassunto.telefoni);
    const statoNuovo = ha ? (chat ? "da_applicare" : "da_controllare") : "vuota";
    // 1.39.0: la Segreteria: i messaggi (coi vocali trascritti) e quello che Sofia ha capito restano da parte, per «Giusto / Correggi»
    try { await db.salva("importazioni", "segreteria_" + id, { lid: id, quando: finito(), da: "giro", modello: r.modello || "", ripiego: !!ripiego, n: scelti.length, messaggi: scelti.slice(-60).map(m => ({ id: String(m.id || ""), chat: m.chatNome || "", chi: m.chi || "", mio: !!m.mio, data: m.data || "", ora: m.ora || "", tipo: m.tipo || "testo", testo: String(m.testo || "").slice(0, 900) })), capito: LET.perSegreteria(j), esito: statoNuovo, giudizi: {}, ...perTeNuove(LET.perTeDa(j, oggi)) }); } catch (e) { console.warn("segreteria:", e && e.message); }
    const testoPapa = scelti.filter(m => m.testo && (!papa || m.chi === papa)).map(m => m.testo).join("\n");
    const etichette = [...chats.entries()].map(([nome, gruppo]) => gruppo ? nome : "chat con " + nome);
    const fonte = { tipo: "whatsapp", come: "chat", messaggi: scelti.length, chi: papa ? [papa] : [], chats: etichette, data: (scelti[scelti.length - 1] || {}).data || "", tolte: 0, intestazioni: true, rif: "", posta: true, giro: true };
    const avvisoOra = ha && oraDiAvvisi(minuti);      // 1.18.1: di notte niente avviso: parte al primo giro dopo le 7
    await db.salva("importazioni", "lettura-sofia", { lid: id, stato: statoNuovo, da: "giro", quando: finito(), j, modello: r.modello || "", ripiego: !!ripiego, n: scelti.length, testo: testoPapa.slice(0, 20000), fonte, postaIds: ids, riassunto, ...(avvisoOra ? { avvisata: adesso.toISOString() } : {}) });
    for (const pid of ids) { try { await db.merge("posta", pid, { letto: true }); } catch (e) {} }
    return {
      esito: ha ? "letto" : "letto, niente da cambiare", ts: ultimoTs, n: scelti.length, riassunto, modello: r.modello || "", turno: turnoNuovo,
      avvisa: avvisoOra ? (chat ? avvisoApplica({ n: scelti.length, riassunto, fonte: { chats: [...chats.keys()] }, j, nomeCamera: (cid) => ((ctx.camere || []).find(c => c.id === cid) || { nome: cid }).nome }, ctx.nomeGov) : avvisoLettura({ n: scelti.length, riassunto, fonte: { chats: [...chats.keys()] } }, ctx.nomeGov)) : null,
    };
  } catch (e) {
    const msg = String((e && e.message) || e).slice(0, 200);
    try { await db.salva("importazioni", "lettura-sofia", { lid: id, stato: "errore", da: "giro", quando: finito(), errore: msg, postaIds: ids }); } catch (e2) {}
    return { esito: "non riuscita: " + msg, ts: letturaTs, credito: /credito|402|prepay|billing/i.test(msg) };
  }
}

// ---- 1.49.0: LA SINTESI DELLA SERA DELLA SEGRETARIA (Michele, 3/11: «una sintesi di quello che ha capito della giornata,
// anche da sola la sera»). Dalle 20:30, una volta al giorno: i messaggi di oggi della posta (coi vocali già trascritti dalle
// letture; quelli mai ascoltati restano «non ascoltati»: qui non si spende), le letture di oggi, e il modello GRATUITO
// (sveglio → svelto, mai Argon): 4-7 frasi che restano in importazioni/sintesi_<giorno> (l'app le mostra nella tendina della
// Segreteria e le legge a voce). Se il telefono l'ha già fatta dopo l'ultimo messaggio, non si rifà.
const oraRomaDi = (iso) => { try { return new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)); } catch (e) { return String(iso || "").slice(11, 16); } };
const ESITI_SINTESI = { salvata: "salvata nell'app", scartata: "messa da parte", vuota: "niente da cambiare", da_controllare: "ancora da controllare, non ho salvato niente", da_applicare: "la mette a posto l'app appena si apre", fatta: "messa a posto nell'app", sostituita: "riletta più tardi" };   // 1.22.0
// 1.22.0: una lettura del modo nuovo: le cose fatte nell'app (non annullate), quelle da confermare, le domande; se l'app non l'ha
// ancora messa a posto, le azioni in parole
function azioneInParole(x, ctx) {
  const nomeCam = (id) => { const k = (ctx.camere || []).find(c => c.id === id); return k ? k.nome : String(id || ""); };
  const sig = (z) => { const s = (ctx.signore || []).find(k => k.id === z); return s ? s.nome : (z || "una signora"); };
  const data = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(String(iso || "")) ? L.dataMedia(iso) : "";
  const dove = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(nomeCam).join(", ");
  switch (x && x.tipo) {
    case "manutenzione": return x.modo === "chiudi" ? `Lavoro sistemato: ${x.cosa || ""}` : `Guasto${x.camera ? " · " + nomeCam(x.camera) : ""}: ${x.cosa || ""}${x.urgente ? " (URGENTE)" : ""}`;
    case "pulizie": return `${x.modo === "da_fare" ? "Da rimettere" : "Non serve"} · ${data(x.giorno)}: ${dove(x.dove)}`;
    case "incarico": return `Lavoro in più per ${sig(x.chi)} · ${data(x.giorno)}: ${x.dove ? nomeCam(x.dove) + " — " : ""}${x.cosa || ""} (${Number(x.minuti) || 30} min)`;
    case "assegna": return `${data(x.giorno)} ${dove(x.dove)}: ${(Array.isArray(x.chi) ? x.chi : [x.chi]).map(sig).join(" e ")}`;
    case "dettagli": return `Nota per la signora · ${nomeCam(x.camera)} · ${data(x.giorno)}: ${x.testo || ""}`;
    case "messaggio": return `Avviso alle signore · ${data(x.giorno)}: ${x.testo || ""}`;
    case "camera": return `${nomeCam(x.camera)}: da adesso la pulisce ${sig(x.signora)}`;
    case "ricorda": return `Nel taccuino: ${x.testo || ""}`;
  }
  return "";
}
function vociLettura(x, ctx, codici) {
  if (Array.isArray(x.fatti)) {
    const via = (t) => String(t || "").replace(/^\S+\s/, "").replace(/\s+/g, " ").trim();
    return [...x.fatti.filter(f => !f.annullato && f.tipo !== "te").map(f => "Fatto: " + via(f.testo)), ...(Array.isArray(x.proposte) ? x.proposte : []).filter(p => !p.esito).map(p => "Da confermare: " + via(p.testo)), ...(Array.isArray(x.domande) ? x.domande : []).filter(d => !d.risposta).map(d => "Domanda: " + d.domanda)]
      .slice(0, 12).map(t => codici.aCodici(t.slice(0, 200)));
  }
  const c = x.capito || {};
  const az = [...(Array.isArray(c.azioni) ? c.azioni : []).map(a => azioneInParole(a, ctx)), ...(Array.isArray(c.proposte) ? c.proposte : []).map(a => { const t = azioneInParole(a, ctx); return t ? "Da confermare: " + t : ""; })].filter(Boolean).map(t => codici.aCodici(t.slice(0, 200)));
  return [...az, ...vociCapite(c, ctx, codici)].slice(0, 12);
}
export function vociCapite(cap, ctx, codici) {
  const c = cap || {}, out = [];
  const nomeCam = (id) => { const x = (ctx.camere || []).find(k => k.id === id); return x ? x.nome : String(id || ""); };
  const data = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(String(iso || "")) ? L.dataMedia(iso) : String(iso || "?");
  const sig = (z) => { const s = (ctx.signore || []).find(k => k.id === z); return s ? s.nome : (z || "una signora"); };
  const metti = (t) => { if (t) out.push(codici.aCodici(String(t).replace(/\s+/g, " ").slice(0, 200))); };
  (c.soggiorni || []).forEach(x => x && metti(`${nomeCam(x.camera)}: ${x.nome || "?"} ${data(x.arrivo)} → ${data(x.partenza)}`));
  (c.togli || []).forEach(x => x && metti(`${nomeCam(x.camera)}: via ${x.nome || "?"}`));
  (c.indicazioni || []).forEach(x => x && metti(`Per le signore${x.camera ? " · " + nomeCam(x.camera) : ""} · ${data(x.giorno)}: ${x.testo || ""}`));
  (c.assenze || []).forEach(x => x && metti(`${sig(x.signora)} non viene ${data(x.dal)}${x.al && x.al !== x.dal ? ` – ${data(x.al)}` : ""}`));
  (c.guasti || []).forEach(x => x && metti(`Guasto${x.camera ? " · " + nomeCam(x.camera) : ""}: ${x.cosa || ""}${x.urgente ? " (urgente)" : ""}`));
  (c.spesa || []).forEach(x => x && metti(`Da comprare: ${x.prodotto || ""}`));
  (c.note || []).forEach(x => x && metti(`Da sapere · ${data(x.giorno)}: ${x.testo || ""}`));
  (c.ore || []).forEach(x => x && metti(`Ore di ${sig(x.signora)} · ${data(x.giorno)}: ${Number(x.minuti) || 0} minuti${x.dove ? ` · ${x.dove}` : ""}`));
  (c.telefoni || []).forEach(x => x && metti(`Un numero di telefono messo in rubrica${x.nome ? ` (${x.nome})` : ""}`));   // mai il numero
  (c.dubbi || []).forEach(x => x && metti(`Domanda: ${typeof x === "string" ? x : (x.domanda || "")}`));
  return out.slice(0, 12);
}
export async function sintesiSera({ db, gemini, adesso = new Date(), a = {}, oggi, prendiBase, minuti, ora = "", inizio: daQuando = null, domanda = "" }) {
  if (a.giroSintesi === false) return { esito: "spenta" };
  if (!gemini || (!gemini.chiave && typeof gemini.chiedi !== "function")) return { esito: "senza chiave" };
  const gia = await db.doc("importazioni", "sintesi_" + oggi);
  const inizio = adesso.getTime() - (Number(minuti) || 0) * 60000 - 120000;   // la mezzanotte di Roma, con un po' di margine
  const posta = Object.values((await db.postaDa(daQuando != null ? daQuando : inizio)) || {}).filter(p => p && p.id && (daQuando != null ? (Number(p.ts) || 0) >= daQuando && (Number(p.ts) || 0) <= adesso.getTime() : String(p.data || "") === oggi) && ["testo", "audio", "foto"].includes(p.tipo || "testo"));   // 1.22.0: dall'orario di prima
  if (!posta.length) return { esito: "niente da raccontare" };
  const ultimo = Math.max(...posta.map(p => Number(p.ts) || 0));
  if (gia && gia.testo && Number(gia.fino || 0) >= ultimo) return { esito: "già fatta", testo: gia.testo };
  const base = await prendiBase();
  const nome = (p) => { const n = p.chat || "Albergo"; return p.gruppo === false ? "chat con " + n : n; };
  const msgs = posta.sort((x, y) => (Number(x.ts) || 0) - (Number(y.ts) || 0)).map(p => ({ id: p.id, data: String(p.data || ""), ora: p.ora || "", chi: p.chi || "", mio: !!p.mio, chat: nome(p), chatNome: nome(p), ts: Number(p.ts) || 0,
    testo: p.tipo === "audio" ? (p.trascrizione ? `🎤 (vocale) ${p.trascrizione}` : "🎤 (un vocale che non ho ancora ascoltato)") : p.tipo === "foto" ? `📷 (una foto)${p.didascalia ? " " + p.didascalia : ""}` : String(p.testo || "") })).filter(m => m.testo).slice(-160);
  const papa = msgs.some(m => m.chi === "Papà") ? "Papà" : "";
  const ctx = await ctxDalDatabase(db, { ...base, oggi });
  ctx.persone = [...new Set(msgs.map(m => m.chi).filter(Boolean))];
  const codici = LET.creaCodici(ctx);
  const { testo: chat } = LET.testoPerLettura(msgs, papa, ctx, codici);
  let letture = [];
  try {
    letture = Object.values((await db.importazioniDa(oggi)) || {}).filter(x => x && x.lid && x.capito && String(x.quando || "").slice(0, 10) === oggi).sort((x, y) => String(x.quando).localeCompare(String(y.quando))).slice(-8)
      .map(x => `${oraRomaDi(x.quando)} (${x.da === "giro" ? "letta da sola" : "letta dal telefono"}; ${ESITI_SINTESI[x.esito] || x.esito || "?"}): ${vociLettura(x, ctx, codici).join("; ") || "niente da segnare"}`);   // 1.22.0: anche le cose fatte
  } catch (e) { console.warn("sintesi/letture:", e && e.message); }
  const { r } = await chiediGemini(gemini, { sistema: LET.istruzioniSegretaria(ctx, { ora }), storia: [],
    testo: LET.testoPerSegretaria({ chat, n: msgs.length, oggi: L.dataGiornoLungo(oggi), ieri: L.dataGiornoLungo(L.aggiungiGiorni(oggi, -1)), letture, piano: "", domanda: domanda || "Com'è andata oggi? Fammi la sintesi della giornata." }), secondi: 60, maxToken: 1500 }, ORDINE_ECONOMICO);   // 1.26.0: prima il modello economico
  const j = LET.jsonDaRisposta(r.grezzo) || {};
  const testo = codici.daCodici(String(j.testo || j.risposta || "").trim()).replace(/\*\*?/g, "").slice(0, 1400);
  if (!testo) throw new Error("Gemini ha risposto in un modo che non capisco");
  await db.salva("importazioni", "sintesi_" + oggi, { giorno: oggi, quando: adesso.toISOString(), da: "giro", n: msgs.length, fino: ultimo, testo, modello: r.modello || "", ...(ora ? { ora } : {}) });
  return { esito: "fatta", testo, n: msgs.length };
}
