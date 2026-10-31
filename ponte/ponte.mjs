// =====================================================================================================
//  IL PONTE DI SOFIA  ·  Le Stanze di Ricci · Pulizie
//  Legge (SOLTANTO LEGGE) il gruppo WhatsApp "Albergo" e passa i messaggi a Sofia, nell'app.
//
//  Come funziona, in parole semplici:
//   - si collega a WhatsApp come un "dispositivo collegato" (come WhatsApp Web): si inquadra il codice una volta;
//   - legge anche le chat private scelte nell'app (es. quella col papa'), riconosciute dal numero di telefono;
//   - quando nel gruppo arriva un messaggio (scritto, vocale o foto) lo mette nella "posta" di Sofia (il database
//     dell'app); l'app lo legge da sola, ascolta i vocali, capisce il prospetto e ti avvisa;
//   - NON scrive mai niente su WhatsApp, non segna i messaggi come letti, non ti fa risultare "online";
//   - se il PC e' spento, i messaggi aspettano: quando lo riaccendi arrivano tutti.
//  Attenzione: non e' un programma ufficiale di WhatsApp. Usato cosi' (solo lettura) il rischio e' basso, ma non zero.
//
//  Si avvia con "Avvia il ponte di Sofia.bat". Si guarda su http://localhost:3939
//  1.1.0: LA SPINTA DAL PC. L'orario di GitHub fa partire il giro di Sofia «quando può» (il 31/10 niente dalle 12:29 alle
//  17:14). Con una chiave di GitHub (solo «Actions» del progetto pulizie-stanze-ricci, la incolla Michele nella pagina del
//  ponte) il ponte fa partire lui il giro: ogni 10 minuti (dalle 6 alle 23) e 5 minuti e mezzo dopo l'ultimo messaggio nuovo
//  (il giro legge le chat quando da 5 minuti nessuno scrive). La chiave resta solo qui sul PC (config.json).
//  E IL PONTE SI AGGIORNA DA SOLO: ogni 6 ore guarda sul sito se c'è un ponte più nuovo; se c'è lo scarica, controlla che
//  sia un programma valido e riparte (il file .bat lo fa ripartire); se il nuovo non parte, il .bat rimette quello di prima.
// =====================================================================================================
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { exec } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const VERSIONE = "1.1.0";
const CARTELLA = path.dirname(fileURLToPath(import.meta.url));
const DATI = process.env.PONTE_DATI || CARTELLA;            // dove il ponte tiene le sue cose (accesso, WhatsApp, messaggi visti)
const FILE_CONF = path.join(DATI, "config.json");
const CARTELLA_SESSIONE = path.join(DATI, "sessione");
const FILE_VISTI = path.join(DATI, "visti.json");
const SITO = process.env.PONTE_SITO || "https://michelepegoli2210-hub.github.io/pulizie-stanze-ricci/";
const PORTA = Number(process.env.PONTE_PORTA || 3939);
const MAX_MEDIA = 700 * 1024;               // il database tiene documenti fino a 1 MB: i file oltre 700 KB non passano
const GIORNI_STORICO = 7;                   // al primo collegamento: i messaggi del gruppo degli ultimi 7 giorni
// 1.1.0: la spinta dal PC (GitHub) e l'aggiornamento da solo
const REPO = process.env.PONTE_REPO || "michelepegoli2210-hub/pulizie-stanze-ricci";
const API_GH = () => process.env.PONTE_GH_BASE || "https://api.github.com";
const RAW = () => process.env.PONTE_RAW_BASE || `https://raw.githubusercontent.com/${REPO}/main/ponte`;
const SPINTA_DOPO_MS = Number(process.env.PONTE_SPINTA_DOPO_MS) || 5.5 * 60 * 1000;   // il giro legge dopo 5 minuti di quiete
const SPINTA_OGNI_MS = 10 * 60 * 1000;
export const LINK_CHIAVE_GH = "https://github.com/settings/personal-access-tokens/new?name=Ponte%20di%20Sofia&description=Il%20ponte%20sul%20PC%20fa%20partire%20il%20giro%20di%20Sofia%20(solo%20Actions%20di%20pulizie-stanze-ricci)&target_name=michelepegoli2210-hub&expires_in=366&actions=write";
const MAX_STORICO = 400;

// ---------------------------------------------------------------------------------- stato e registro
export const stato = { fase: "avvio", errore: "", qr: "", numero: "", gruppiVisti: [], contati: 0, ultimo: null, registro: [], conf: {}, fb: null, spinta: { ultima: 0, perche: "", errore: "", n: 0 }, aggiornamento: { controllato: 0, nuova: "", errore: "" } };
export function annota(t) {
  const riga = `${new Date().toLocaleTimeString("it-IT")} ${t}`;
  stato.registro.push(riga); if (stato.registro.length > 60) stato.registro.shift();
  console.log(riga);
}
function leggiConf() { try { return JSON.parse(fs.readFileSync(FILE_CONF, "utf8")); } catch (e) { return {}; } }
function salvaConf(c) { fs.writeFileSync(FILE_CONF, JSON.stringify(c, null, 2)); }

// ---------------------------------------------------------------------------------- nomi e date
export const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
// le chat private si riconoscono dal NUMERO (le ultime 10 cifre: vale con e senza +39)
export const soloCifre = (s) => String(s || "").replace(/\D/g, "");
export function numeroCombacia(a, b) {
  const x = soloCifre(a), y = soloCifre(b);
  if (x.length < 8 || y.length < 8) return false;
  const n = Math.min(10, x.length, y.length);
  return x.slice(-n) === y.slice(-n);
}
export function privataPerNumeri(numeri, privati) {
  return (privati || []).find(p => p && p.numero && (numeri || []).some(n => numeroCombacia(n, p.numero))) || null;
}
export function chatGiusta(nome, gruppi) {
  const n = norm(nome); if (!n) return false;
  return (gruppi || []).some(g => { const x = norm(g); return x && (n === x || n.includes(x)); });
}
const numero = (jid) => String(jid || "").split("@")[0].split(":")[0];
const lungo = (v) => typeof v === "number" ? v : v && typeof v.toNumber === "function" ? v.toNumber() : Number(v && (v.low ?? v)) || 0;
function tsDi(m) { const t = m.messageTimestamp; const n = typeof t === "number" ? t : t && typeof t.toNumber === "function" ? t.toNumber() : Number(t && (t.low ?? t)) || 0; return n * 1000; }
export function dataOra(ts) {
  const d = new Date(ts);
  return { data: d.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" }), ora: d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }) };
}

// ---------------------------------------------------------------------------------- il messaggio -> la posta di Sofia
// Ritorna null per quello che non serve (reazioni, adesivi, messaggi di sistema, video, documenti).
export function daMessaggio(m, { chat, gruppo, normalizza, tipoDi }) {
  if (!m || !m.message || !m.key) return null;
  const c = normalizza ? normalizza(m.message) : m.message; if (!c) return null;
  const tipoWA = tipoDi ? tipoDi(c) : Object.keys(c)[0];
  const ts = tsDi(m); if (!ts) return null;
  const { data, ora } = dataOra(ts);
  const chi = m.key.fromMe ? "Michele" : (m.pushName || numero(m.key.participantAlt || m.key.participant || m.key.remoteJidAlt || m.key.remoteJid) || "?");
  const base = { id: String(m.key.id || ""), chat, gruppo: !!gruppo, chi: String(chi).slice(0, 60), mio: !!m.key.fromMe, ts, data, ora };
  if (!base.id) return null;
  if (tipoWA === "conversation") return { ...base, tipo: "testo", testo: String(c.conversation || "").slice(0, 7000) };
  if (tipoWA === "extendedTextMessage") return { ...base, tipo: "testo", testo: String((c.extendedTextMessage && c.extendedTextMessage.text) || "").slice(0, 7000) };
  if (tipoWA === "imageMessage") { const x = c.imageMessage || {}; return { ...base, tipo: "foto", testo: "", didascalia: String(x.caption || "").slice(0, 2000), mime: x.mimetype || "image/jpeg", peso: lungo(x.fileLength) }; }
  if (tipoWA === "audioMessage") { const x = c.audioMessage || {}; return { ...base, tipo: "audio", testo: "", durata: Number(x.seconds || 0), mime: String(x.mimetype || "audio/ogg").split(";")[0], peso: lungo(x.fileLength) }; }
  if (tipoWA === "videoMessage" && c.videoMessage && c.videoMessage.caption) return { ...base, tipo: "testo", testo: "🎬 (un video) " + String(c.videoMessage.caption).slice(0, 2000) };
  return null;
}

// ---------------------------------------------------------------------------------- il database dell'app (Firestore, via internet)
function aFs(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(aFs) } };
  if (typeof v === "object") return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aFs(x)])) } };
  return { stringValue: String(v) };
}
function daFs(f) {
  if (!f || typeof f !== "object") return null;
  if ("stringValue" in f) return f.stringValue;
  if ("integerValue" in f) return Number(f.integerValue);
  if ("doubleValue" in f) return f.doubleValue;
  if ("booleanValue" in f) return f.booleanValue;
  if ("nullValue" in f) return null;
  if ("timestampValue" in f) return f.timestampValue;
  if ("arrayValue" in f) return (f.arrayValue.values || []).map(daFs);
  if ("mapValue" in f) return Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, daFs(x)]));
  return null;
}
const baseFs = () => process.env.PONTE_FS_BASE || `https://firestore.googleapis.com/v1/projects/${stato.fb.progetto}/databases/(default)/documents`;
const chiaveFs = () => `key=${encodeURIComponent(stato.fb.chiave)}`;
// ---- l'accesso: il ponte entra nel database con un SUO utente (ruolo "ponte", creato dall'app). La password si scrive
// una volta sola nella pagina del ponte e va solo a Google; qui resta soltanto il "gettone" per rientrare.
const BASE_AUTH = () => process.env.PONTE_AUTH_BASE || "https://identitytoolkit.googleapis.com/v1";
const BASE_TOKEN = () => process.env.PONTE_TOKEN_BASE || "https://securetoken.googleapis.com/v1";
let gettone = { id: "", scade: 0 };
export async function accedi(email, password) {
  const r = await fetch(`${BASE_AUTH()}/accounts:signInWithPassword?${chiaveFs()}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(/INVALID|PASSWORD|NOT_FOUND|CREDENTIAL/.test(JSON.stringify(j)) ? "Codice sbagliato (o il ponte è stato tolto nell'app)." : "Accesso non riuscito: " + r.status);
  gettone = { id: j.idToken, scade: Date.now() + (Number(j.expiresIn) || 3600) * 1000 };
  return j.refreshToken;
}
async function gettoneValido() {
  if (gettone.id && Date.now() < gettone.scade - 120000) return gettone.id;
  if (!stato.conf.rientro) throw new Error("manca l'accesso: scrivi il codice del ponte");
  const r = await fetch(`${BASE_TOKEN()}/token?${chiaveFs()}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(stato.conf.rientro) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Il ponte non riesce più a entrare: scrivi di nuovo il codice (" + r.status + ")");
  gettone = { id: j.id_token, scade: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
  if (j.refresh_token && j.refresh_token !== stato.conf.rientro) { stato.conf.rientro = j.refresh_token; salvaConf(confDaSalvare()); }
  return gettone.id;
}
const intestazioni = async (extra = {}) => ({ ...extra, Authorization: "Bearer " + await gettoneValido() });
function confDaSalvare() { const c = stato.conf; return { utente: c.utente, email: c.email, rientro: c.rientro, gruppi: c.gruppi, privati: c.privati || [], ...(c.github && c.github.gettone ? { github: c.github } : {}) }; }
// le chat private scelte nell'app: [{ nome: "Papa'", numero: "393331234567" }]
function prendiPrivati(d) {
  const nuovi = Array.isArray(d && d.privati) ? d.privati.filter(p => p && p.numero).map(p => ({ nome: String(p.nome || "Chat").slice(0, 40), numero: soloCifre(p.numero) })).slice(0, 6) : [];
  if (JSON.stringify(nuovi) !== JSON.stringify(stato.conf.privati || [])) { stato.conf.privati = nuovi; privatiVisti.clear(); }
}
export async function fsLeggi(percorso) {
  const r = await fetch(`${baseFs()}/${percorso}?${chiaveFs()}`, { headers: await intestazioni() });
  if (r.status === 404 || r.status === 403) return null;
  if (!r.ok) throw new Error(`database: ${r.status}`);
  const j = await r.json(); return Object.fromEntries(Object.entries(j.fields || {}).map(([k, x]) => [k, daFs(x)]));
}
export async function fsCrea(coll, id, dati) {
  const r = await fetch(`${baseFs()}/${coll}?documentId=${encodeURIComponent(id)}&${chiaveFs()}`, { method: "POST", headers: await intestazioni({ "Content-Type": "application/json" }), body: JSON.stringify({ fields: Object.fromEntries(Object.entries(dati).map(([k, v]) => [k, aFs(v)])) }) });
  if (r.status === 409) return "c'era";
  if (!r.ok) throw new Error(`database: ${r.status} ${(await r.text()).slice(0, 160)}`);
  return "ok";
}
export async function fsAggiorna(percorso, dati) {
  const campi = Object.keys(dati).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  const r = await fetch(`${baseFs()}/${percorso}?${campi}&${chiaveFs()}`, { method: "PATCH", headers: await intestazioni({ "Content-Type": "application/json" }), body: JSON.stringify({ fields: Object.fromEntries(Object.entries(dati).map(([k, v]) => [k, aFs(v)])) }) });
  if (!r.ok) throw new Error(`database: ${r.status}`);
}
// i dati pubblici del database dell'app (gli stessi che ogni telefono scarica con l'app): progetto e chiave web
export async function caricaFirebase() {
  const r = await fetch(SITO + "firebase-config.js", { cache: "no-store" });
  if (!r.ok) throw new Error("Non riesco a leggere la configurazione dell'app (" + r.status + ")");
  const t = await r.text();
  const progetto = (/projectId:\s*"([^"]+)"/.exec(t) || [])[1], chiave = (/apiKey:\s*"([^"]+)"/.exec(t) || [])[1];
  const dominio = (/DOMINIO_ACCESSO\s*=\s*"([^"]+)"/.exec(t) || [])[1] || "stanzericci.app";
  if (!progetto || !chiave) throw new Error("Configurazione dell'app incompleta");
  return { progetto, chiave, dominio };
}

// ---------------------------------------------------------------------------------- deposita nella posta (testo + file a parte)
// i messaggi gia' passati (anche dopo un riavvio del PC): cosi' lo stesso messaggio non arriva due volte a Sofia
const visti = new Set((() => { try { const a = JSON.parse(fs.readFileSync(FILE_VISTI, "utf8")); return Array.isArray(a) ? a.map(String) : []; } catch (e) { return []; } })());
let salvaVisti = null;
function ricordaVisto(id) {
  visti.add(id);
  if (visti.size > 6000) { const tieni = [...visti].slice(-3000); visti.clear(); for (const x of tieni) visti.add(x); }
  if (!salvaVisti) salvaVisti = setTimeout(() => { salvaVisti = null; try { fs.writeFileSync(FILE_VISTI, JSON.stringify([...visti].slice(-3000))); } catch (e) {} }, 4000);
}
export const giaVisto = (id) => visti.has(id);
// se il database non risponde (niente internet, Google lento) il messaggio non si perde: si riprova ogni minuto, per un'ora
const daRiprovare = []; let giroRiprova = null;
export function mettiDaRiprovare(p, scarica) {
  if (!daRiprovare.some(x => x.p.id === p.id) && daRiprovare.length < 600) daRiprovare.push({ p, scarica, volte: 0 });
  if (!giroRiprova) giroRiprova = setTimeout(riprova, Number(process.env.PONTE_RIPROVA_MS) || 60000);
}
export async function riprova() {
  giroRiprova = null;
  const lista = daRiprovare.splice(0);
  for (const x of lista) {
    try { await deposita(x.p, x.scarica); }
    catch (e) { x.volte++; if (x.volte < 60) daRiprovare.push(x); else annota("Un messaggio non è passato dopo un'ora di tentativi: " + e.message); }
  }
  if (daRiprovare.length && !giroRiprova) giroRiprova = setTimeout(riprova, Number(process.env.PONTE_RIPROVA_MS) || 60000);
}
export const inAttesa = () => daRiprovare.length;
export async function deposita(p, scarica) {
  if (visti.has(p.id)) return "visto";
  const doc = { chat: p.chat, gruppo: p.gruppo, chi: p.chi, mio: p.mio, ts: p.ts, data: p.data, ora: p.ora, tipo: p.tipo, testo: p.testo || "", ...(p.didascalia ? { didascalia: p.didascalia } : {}), ...(p.durata ? { durata: p.durata } : {}), ...(p.mime ? { mime: p.mime } : {}), ...(p.storico ? { storico: true } : {}) };
  if ((p.tipo === "audio" || p.tipo === "foto") && scarica) {
    // il file si prende da WhatsApp; se non si riesce (troppo grande, scaduto) passa una riga che lo dice.
    // Se invece non risponde il database, l'errore sale e il messaggio si riprova piu' tardi.
    let buf = null, perche = "";
    try {
      if (p.peso && p.peso > MAX_MEDIA) throw new Error("troppo grande");
      buf = await scarica();
      if (!buf || !buf.length) throw new Error("vuoto");
      if (buf.length > MAX_MEDIA) throw new Error("troppo grande");
    } catch (e) { buf = null; perche = e.message; }
    if (buf) { await fsCrea("posta_media", p.id, { mime: p.mime || "application/octet-stream", dati: buf.toString("base64"), ts: p.ts }); doc.media = true; }
    else { doc.media = false; doc.testo = p.tipo === "audio" ? `🎤 (vocale non passato: ${perche})` : `📷 (foto non passata: ${perche})${p.didascalia ? " " + p.didascalia : ""}`; }
  }
  const r = await fsCrea("posta", p.id, doc);
  ricordaVisto(p.id);
  if (r === "ok") { stato.contati++; stato.ultimo = Date.now(); annota(`${p.chat}: ${p.chi}${p.tipo === "testo" ? " ha scritto" : p.tipo === "audio" ? " ha mandato un vocale" : " ha mandato una foto"}${p.storico ? " (dei giorni scorsi)" : ""}`); if (!p.storico) dopoMessaggio(); }
  return r;
}

// ---------------------------------------------------------------------------------- WhatsApp
let sock = null, bw = null, giro = 0, faseWA = "";
const privatiVisti = new Map();        // chat (anche nel formato nuovo @lid) -> chat privata scelta nell'app
// i numeri di telefono di un indirizzo WhatsApp: quello vero (@s.whatsapp.net) o, per quelli nuovi (@lid), quello collegato
async function numeriDi(...jids) {
  const out = [];
  for (const j of jids) {
    if (!j) continue;
    if (/@s\.whatsapp\.net$/.test(j)) out.push(numero(j));
    else if (/@lid$/.test(j) && sock && sock.signalRepository && sock.signalRepository.lidMapping) {
      try { const pn = await sock.signalRepository.lidMapping.getPNForLID(j); if (pn) out.push(numero(pn)); } catch (e) {}
    }
  }
  return out;
}
// ferma WhatsApp (il ponte e' stato tolto nell'app): i messaggi restano da parte su WhatsApp e arrivano col codice nuovo
function fermaWhatsApp() {
  giro++;
  const s = sock; sock = null; faseWA = "";
  if (s) { try { s.end(undefined); } catch (e) {} }
}
const nomiGruppi = new Map();          // jid -> nome del gruppo
async function nomeGruppo(jid) {
  if (nomiGruppi.has(jid)) return nomiGruppi.get(jid);
  try { const md = await sock.groupMetadata(jid); nomiGruppi.set(jid, md.subject || ""); return md.subject || ""; } catch (e) { return ""; }
}
async function chatDi(m) {
  const jid = m.key && m.key.remoteJid; if (!jid) return null;
  if (jid === "status@broadcast" || jid.endsWith("@newsletter") || jid.endsWith("@broadcast")) return null;
  if (bw.isJidGroup(jid)) {
    const nome = await nomeGruppo(jid);
    if (nome && !stato.gruppiVisti.includes(nome)) { stato.gruppiVisti.push(nome); if (stato.gruppiVisti.length > 40) stato.gruppiVisti.shift(); }
    return chatGiusta(nome, stato.conf.gruppi) ? { chat: nome, gruppo: true } : null;
  }
  // 1.0.1: le chat private SOLO se scelte nell'app (es. Papa'), riconosciute dal numero. Tutte le altre: non si guardano.
  const privati = stato.conf.privati || [];
  if (!privati.length) return null;
  let p = privatiVisti.get(jid);
  if (!p) {
    // per i miei messaggi l'indirizzo "alt" e' il mio, non il suo: si guarda solo quello della chat
    p = privataPerNumeri(await numeriDi(jid, m.key.fromMe ? null : m.key.remoteJidAlt), privati);
    if (p) { privatiVisti.set(jid, p); if (m.key.remoteJidAlt && !m.key.fromMe) privatiVisti.set(m.key.remoteJidAlt, p); }
  }
  return p ? { chat: p.nome, gruppo: false, nomeLui: p.nome } : null;
}
// solo per le prove automatiche: un WhatsApp finto al posto di quello vero
export function _provaWA(b, s) { bw = b; sock = s; }
export async function trattaMessaggio(m, storico) {
  try {
    const dove = await chatDi(m); if (!dove) return;
    const p = daMessaggio(m, { ...dove, normalizza: bw.normalizeMessageContent, tipoDi: bw.getContentType }); if (!p) return;
    if (storico) p.storico = true;
    // chi scrive: nella chat privata e' lui (col nome scelto nell'app); nel gruppo, se il numero e' di una chat scelta, quel nome
    if (!p.mio) {
      if (dove.nomeLui) p.chi = dove.nomeLui;
      else if (dove.gruppo && (stato.conf.privati || []).length) { const x = privataPerNumeri(await numeriDi(m.key.participantAlt, m.key.participant), stato.conf.privati); if (x) p.chi = x.nome; }
    }
    if (visti.has(p.id)) return;
    const s = sock;
    const scarica = (p.tipo === "audio" || p.tipo === "foto") ? () => bw.downloadMediaMessage(m, "buffer", {}, { logger: bw.logger, reuploadRequest: s.updateMediaMessage }) : null;
    try { await deposita(p, scarica); }
    catch (e) { annota("Il database non risponde, riprovo fra un minuto: " + e.message); mettiDaRiprovare(p, scarica); }
  } catch (e) { annota("Non sono riuscito a passare un messaggio: " + e.message); }
}
async function avviaWhatsApp() {
  if (!bw) {
    const B = await import("@whiskeysockets/baileys");
    const pino = (await import("pino")).default;
    bw = { make: B.makeWASocket || B.default, useMultiFileAuthState: B.useMultiFileAuthState, DisconnectReason: B.DisconnectReason, Browsers: B.Browsers, downloadMediaMessage: B.downloadMediaMessage, normalizeMessageContent: B.normalizeMessageContent, getContentType: B.getContentType, isJidGroup: B.isJidGroup, ultimaVersione: B.fetchLatestBaileysVersion, logger: pino({ level: "silent" }) };
  }
  const mio = ++giro;
  const { state, saveCreds } = await bw.useMultiFileAuthState(CARTELLA_SESSIONE);
  if (mio !== giro) return;
  // 1.0.2: la versione di WhatsApp Web piu' recente (se non si riesce a sapere, quella della libreria)
  let versioneWA = null;
  try { const v = bw.ultimaVersione ? await Promise.race([bw.ultimaVersione(), new Promise((_, no) => setTimeout(() => no(new Error("tempo")), 8000))]) : null; if (v && Array.isArray(v.version) && v.version.length === 3) versioneWA = v.version; } catch (e) { versioneWA = null; }
  if (mio !== giro) return;
  sock = bw.make({ auth: state, logger: bw.logger, browser: bw.Browsers.windows("Ponte di Sofia"), markOnlineOnConnect: false, syncFullHistory: false, getMessage: async () => undefined, generateHighQualityLinkPreview: false, ...(versioneWA ? { version: versioneWA } : {}) });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (u) => {
    if (mio !== giro) return;                       // una connessione vecchia (fermata): non conta piu'
    if (u.qr) {
      stato.qr = u.qr; stato.fase = faseWA = "qr"; annota("Inquadra il codice con WhatsApp: Dispositivi collegati → Collega un dispositivo (lo trovi anche su http://localhost:" + PORTA + ")");
      try { const qt = (await import("qrcode-terminal")).default; qt.generate(u.qr, { small: true }); } catch (e) {}
    }
    if (u.connection === "open") { stato.fase = faseWA = "collegato"; stato.qr = ""; stato.errore = ""; stato.numero = numero(sock.user && sock.user.id); annota(`Collegato a WhatsApp. Leggo soltanto: ${cosaLeggo()}`); battito(); }
    if (u.connection === "close") {
      const codice = u.lastDisconnect && u.lastDisconnect.error && u.lastDisconnect.error.output && u.lastDisconnect.error.output.statusCode;
      if (codice === bw.DisconnectReason.loggedOut) {
        annota("WhatsApp ha scollegato il ponte: inquadra di nuovo il codice.");
        try { fs.rmSync(CARTELLA_SESSIONE, { recursive: true, force: true }); } catch (e) {}
        sock = null; stato.fase = faseWA = "qr"; setTimeout(() => { if (mio === giro) avviaWhatsApp().catch(e => { stato.fase = "errore"; stato.errore = e.message; }); }, 1500);
      } else { sock = null; stato.fase = faseWA = "ricollego"; annota("Collegamento caduto, riprovo fra poco…"); setTimeout(() => { if (mio === giro) avviaWhatsApp().catch(e => { stato.fase = "errore"; stato.errore = e.message; }); }, 5000); }
    }
  });
  sock.ev.on("messages.upsert", async ({ messages, type }) => { if (mio !== giro) return; for (const m of messages || []) await trattaMessaggio(m, type !== "notify"); });
  sock.ev.on("messaging-history.set", async ({ messages }) => {
    if (mio !== giro) return;
    const da = Date.now() - GIORNI_STORICO * 86400000;
    const scelti = (messages || []).filter(m => tsDi(m) >= da).sort((a, b) => tsDi(a) - tsDi(b)).slice(-MAX_STORICO);
    for (const m of scelti) await trattaMessaggio(m, true);
  });
  sock.ev.on("groups.update", (lista) => { for (const g of lista || []) if (g.id && g.subject) nomiGruppi.set(g.id, g.subject); });
}

// ---------------------------------------------------------------------------------- il battito (l'app vede che il ponte e' acceso) e i gruppi scelti dall'app
let tolto = 0;
function ponteTolto(perche) {
  tolto++;
  if (tolto < 2) { annota(perche + " Ricontrollo fra 5 minuti."); return; }
  annota(perche + " Mi fermo: scrivi un codice nuovo per ripartire.");
  fermaWhatsApp(); stato.fase = "codice"; stato.errore = perche + " Se vuoi rimetterlo: nell'app crea un codice nuovo e scrivilo qui.";
}
export async function battito() {
  if (!stato.conf.utente || !stato.conf.rientro || !stato.fb || stato.fase === "codice") return;
  try {
    const d = await fsLeggi(`ponti/${stato.conf.utente}`);
    if (!d) { ponteTolto("Nell'app il ponte non c'è più."); return; }
    tolto = 0;
    if (Array.isArray(d.gruppi) && d.gruppi.length) stato.conf.gruppi = d.gruppi.map(String);
    prendiPrivati(d);
    await fsAggiorna(`ponti/${stato.conf.utente}`, { vivo: Date.now(), stato: stato.fase, contati: stato.contati, numero: stato.numero ? stato.numero.slice(-4) : "", versione: VERSIONE, gruppiVisti: stato.gruppiVisti.slice(-15) });
    if (daRiprovare.length && !giroRiprova) riprova();
  } catch (e) {
    annota("Battito non riuscito: " + e.message);
    if (/non riesce più a entrare/.test(e.message)) ponteTolto("Il ponte non riesce più a entrare nel database.");
  }
}

// ---------------------------------------------------------------------------------- 1.1.0: la spinta dal PC (fa partire il giro di Sofia)
// La chiave di GitHub: solo «Actions: Read and write» del progetto pulizie-stanze-ricci. Resta solo qui (config.json): mai nel
// database, mai nella pagina, mai nel registro. GitHub dice quando scade (intestazione github-authentication-token-expiration):
// il ponte lo passa al giro, che lo scrive per l'app («la chiave scade il…»).
const intestazioniGh = (g) => ({ Authorization: "Bearer " + g, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "ponte-di-sofia/" + VERSIONE });
export function scadenzaDa(h) { const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(h || "").trim()); return m ? m[1] : ""; }
export function minutiDiRoma(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d).map(x => [x.type, x.value]));
  return (Number(p.hour) % 24) * 60 + Number(p.minute);
}
export const oraDiSpinta = (d = new Date()) => { const m = minutiDiRoma(d); return m >= 6 * 60 && m < 23 * 60; };
export const chiaveFormaGiusta = (g) => /^(github_pat_[A-Za-z0-9_]{40,}|gh[pousr]_[A-Za-z0-9]{30,})$/.test(String(g || ""));
function erroreGh(st, j) {
  if (st === 401) return "La chiave non è giusta (forse non l'hai copiata tutta, o è scaduta): rifalla e incollala di nuovo.";
  if (st === 403) return "La chiave c'è, ma non ha il permesso giusto: rifalla con «Actions: Read and write».";
  if (st === 404) return "La chiave non vede il progetto: rifalla scegliendo «Only select repositories» → pulizie-stanze-ricci.";
  if (st === 422) return "GitHub non accetta la spinta (" + String((j && j.message) || "").slice(0, 80) + ").";
  return "GitHub non risponde come dovrebbe (" + st + "): riprovo fra poco.";
}
export async function spingiGiro(perche, conChiave) {
  const g = conChiave || (stato.conf.github && stato.conf.github.gettone);
  if (!g) return { ok: false, errore: "Manca la chiave di GitHub." };
  const segnaErrore = (errore) => { if (!conChiave) { if (stato.spinta.errore !== errore) annota("Spinta dal PC non riuscita: " + errore); stato.spinta = { ...stato.spinta, errore, quandoErrore: Date.now() }; } return { ok: false, errore }; };
  try {
    const scade = (stato.conf.github && stato.conf.github.scade) || "";
    const r = await fetch(`${API_GH()}/repos/${REPO}/actions/workflows/sofia-giro.yml/dispatches`, { method: "POST", headers: { ...intestazioniGh(g), "Content-Type": "application/json" }, body: JSON.stringify({ ref: "main", inputs: { da: "ponte", scade } }) });
    if (r.status === 204 || r.status === 200) {
      const sc = scadenzaDa(r.headers.get("github-authentication-token-expiration"));
      if (sc && stato.conf.github && stato.conf.github.gettone === g && stato.conf.github.scade !== sc) { stato.conf.github = { ...stato.conf.github, scade: sc }; try { salvaConf(confDaSalvare()); } catch (e) {} }
      if (stato.spinta.errore && !conChiave) annota("Spinta dal PC: di nuovo a posto.");
      stato.spinta = { ...stato.spinta, ultima: Date.now(), perche, errore: "", quandoErrore: 0, n: (stato.spinta.n || 0) + 1 };
      return { ok: true };
    }
    const j = await r.json().catch(() => ({}));
    return segnaErrore(erroreGh(r.status, j));
  } catch (e) { return segnaErrore("Non riesco a parlare con GitHub (c'è internet?)."); }
}
// la chiave appena incollata: GitHub la riconosce e vede il giro di Sofia? Allora la salvo e faccio partire un giro di prova
export async function provaChiave(chiave) {
  const g = String(chiave || "").trim();
  if (!chiaveFormaGiusta(g)) return { ok: false, errore: g.length < 30 ? "Incolla la chiave intera: comincia con github_pat_ ed è lunga." : "Questa non sembra la chiave di GitHub: deve cominciare con github_pat_." };
  try {
    const r = await fetch(`${API_GH()}/repos/${REPO}/actions/workflows/sofia-giro.yml`, { headers: intestazioniGh(g) });
    if (r.status !== 200) { const j = await r.json().catch(() => ({})); return { ok: false, errore: erroreGh(r.status, j) }; }
    const prima = stato.conf.github || null;
    stato.conf.github = { gettone: g, scade: scadenzaDa(r.headers.get("github-authentication-token-expiration")), messa: new Date().toISOString() };
    const s = await spingiGiro("prova della chiave", g);
    if (!s.ok) { stato.conf.github = prima; return { ok: false, errore: s.errore }; }
    salvaConf(confDaSalvare());
    annota("Spinta dal PC accesa: d'ora in poi faccio partire io il giro di Sofia, ogni 10 minuti e dopo i messaggi nuovi.");
    return { ok: true, scade: stato.conf.github.scade };
  } catch (e) { return { ok: false, errore: "Non riesco a parlare con GitHub (c'è internet?)." }; }
}
// dopo un messaggio nuovo: se per 5 minuti e mezzo non ne arrivano altri, la spinta (il giro legge con 5 minuti di quiete)
let timerSpinta = null;
export function dopoMessaggio() {
  if (!stato.conf.github || !stato.conf.github.gettone) return;
  clearTimeout(timerSpinta);
  timerSpinta = setTimeout(() => { timerSpinta = null; if (oraDiSpinta()) spingiGiro("messaggi nuovi"); }, SPINTA_DOPO_MS);
}
// ogni minuto: se dall'ultima spinta sono passati 10 minuti (e siamo fra le 6 e le 23), un'altra
export function spintaPeriodica(adesso = Date.now()) {
  if (!stato.conf.github || !stato.conf.github.gettone || !oraDiSpinta(new Date(adesso))) return false;
  if (adesso - (stato.spinta.ultima || 0) < SPINTA_OGNI_MS - 30 * 1000) return false;
  if (stato.spinta.quandoErrore && adesso - stato.spinta.quandoErrore < SPINTA_OGNI_MS - 30 * 1000) return false;   // dopo un errore: fra 10 minuti
  spingiGiro("ogni 10 minuti");
  return true;
}

// ---------------------------------------------------------------------------------- 1.1.0: il ponte si aggiorna da solo
// Ogni 6 ore (e 3 minuti dopo l'avvio) guarda sul sito se c'è un ponte più nuovo. Se c'è: lo scarica accanto, controlla che
// sia un programma valido (node --check), tiene da parte quello di adesso (ponte-prima.mjs) e si ferma col codice 3: il file
// «Avvia il ponte di Sofia» lo fa ripartire (e, se servono librerie nuove, fa prima «npm install»). Se il ponte nuovo non
// parte, il .bat rimette quello di prima. Solo col .bat 1.1.0 (che lo sa fare: PONTE_BAT=2).
export function confrontaVersioni(a, b) { const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0) ? 1 : -1; } return 0; }
const controllaSintassi = (file) => new Promise((ok, no) => exec(`"${process.execPath}" --check "${file}"`, (err) => err ? no(new Error("il ponte nuovo ha un errore: non lo metto")) : ok()));
export async function controllaAggiornamento({ riavvia = true, cartella = CARTELLA } = {}) {
  if (process.env.PONTE_NO_AGGIORNA || (riavvia && Number(process.env.PONTE_BAT || 0) < 2)) return { esito: "spento" };
  stato.aggiornamento = { ...stato.aggiornamento, controllato: Date.now() };
  const nuovo = path.join(cartella, "ponte-nuovo.mjs");
  try {
    const r = await fetch(`${RAW()}/ponte.mjs`, { headers: { "Cache-Control": "no-cache" } });
    if (!r.ok) throw new Error("il sito risponde " + r.status);
    const testo = await r.text();
    const v = (/export const VERSIONE = "(\d+\.\d+\.\d+)"/.exec(testo) || [])[1];
    if (!v) throw new Error("nel ponte del sito non trovo la versione");
    if (confrontaVersioni(v, VERSIONE) <= 0) { stato.aggiornamento.errore = ""; return { esito: "aggiornato", versione: v }; }
    fs.writeFileSync(nuovo, testo);
    await controllaSintassi(nuovo);
    // le librerie: se il ponte nuovo ne vuole altre, il .bat fa «npm install» prima di farlo partire
    try {
      const pj = await fetch(`${RAW()}/package.json`, { headers: { "Cache-Control": "no-cache" } });
      if (pj.ok) {
        const t = await pj.text(); const j = JSON.parse(t);
        const ora = JSON.parse(fs.readFileSync(path.join(cartella, "package.json"), "utf8"));
        if (JSON.stringify(j.dependencies || {}) !== JSON.stringify(ora.dependencies || {})) {
          const pl = await fetch(`${RAW()}/package-lock.json`, { headers: { "Cache-Control": "no-cache" } });
          if (pl.ok) { const tl = await pl.text(); JSON.parse(tl); fs.writeFileSync(path.join(cartella, "package-lock-nuovo.json"), tl); }
          fs.writeFileSync(path.join(cartella, "package-nuovo.json"), t);
        }
      }
    } catch (e) { annota("Aggiornamento: le librerie nuove non le ho prese (" + e.message + ")."); }
    fs.copyFileSync(path.join(cartella, "ponte.mjs"), path.join(cartella, "ponte-prima.mjs"));
    fs.renameSync(nuovo, path.join(cartella, "ponte.mjs"));
    stato.aggiornamento = { ...stato.aggiornamento, nuova: v, errore: "" };
    annota(`C'è il ponte nuovo (${v}): riparto da solo fra pochi secondi.`);
    if (riavvia) setTimeout(() => { try { fermaWhatsApp(); } catch (e) {} process.exit(3); }, 3000);
    return { esito: "nuovo", versione: v };
  } catch (e) {
    try { fs.unlinkSync(nuovo); } catch (x) {}
    stato.aggiornamento = { ...stato.aggiornamento, errore: String(e.message).slice(0, 120) };
    return { esito: "errore", errore: e.message };
  }
}

// ---------------------------------------------------------------------------------- la paginetta su http://localhost:3939
const esc = (s) => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
async function paginaQr() { if (!stato.qr) return ""; try { const QR = (await import("qrcode")).default; return await QR.toDataURL(stato.qr, { margin: 1, width: 320 }); } catch (e) { return ""; } }
function pagina() {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Il ponte di Sofia</title>
<style>body{margin:0;background:#F7F5F0;color:#1C1917;font:500 17px/1.45 system-ui,Segoe UI,sans-serif}main{max-width:620px;margin:0 auto;padding:28px 18px}h1{font:800 28px/1.15 system-ui;margin:0 0 4px}.sotto{color:#6B5A3A;margin:0 0 18px}.box{background:#fff;border:1px solid #E7E2DA;border-radius:18px;padding:18px;margin:12px 0;box-shadow:0 10px 24px -18px rgba(28,25,23,.4)}.ok{border-color:#8A6D32}.big{font:800 22px system-ui}input{font:700 24px system-ui;letter-spacing:.12em;text-transform:uppercase;width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1.5px solid #8A6D32}button{margin-top:12px;min-height:52px;width:100%;border:0;border-radius:14px;background:#8A6D32;color:#fff;font:800 18px system-ui;cursor:pointer}button.chiaro{background:#fff;color:#6E542B;border:1.5px solid #8A6D32}a.bottone{display:flex;align-items:center;justify-content:center;margin-top:12px;min-height:52px;border-radius:14px;background:#8A6D32;color:#fff;font:800 18px system-ui;text-decoration:none}.gialla{margin-top:14px;padding:14px;border-radius:14px;background:#FFF4B8;border:3px solid #E8B400}.gialla label{display:block;font:800 19px system-ui;margin-bottom:8px}.gialla input{letter-spacing:0;text-transform:none;font:600 18px ui-monospace,Consolas,monospace}.okk{color:#1F7A3A;font-weight:800}img{display:block;margin:10px auto;width:300px;max-width:100%;image-rendering:pixelated}ol{padding-left:22px}li{margin:6px 0}.err{color:#B42318;font-weight:700}.reg{font:13px/1.5 ui-monospace,Consolas,monospace;color:#57534E;white-space:pre-wrap;max-height:220px;overflow:auto}</style></head>
<body><main><h1>Il ponte di Sofia</h1><p class="sotto">Legge soltanto il gruppo WhatsApp e passa i messaggi a Sofia. Non scrive mai niente.</p><div id="corpo">…</div></main>
<script>
let mostraGh = false, provaGh = false;
function preparaGh() {
  const c = document.getElementById('ghcambia'); if (c) c.onclick = () => { mostraGh = true; giro(); };
  const t = document.getElementById('ghtieni'); if (t) t.onclick = () => { mostraGh = false; giro(); };
  const i = document.getElementById('gh'); if (!i) return;
  const esito = document.getElementById('ghesito');
  const prova = async () => {
    const v = i.value.trim(); if (!v || provaGh) return;
    if (!/^(github_pat_|gh[pousr]_)/.test(v)) { esito.className = 'err'; esito.textContent = 'Questa non sembra la chiave di GitHub: deve cominciare con github_pat_'; return; }
    provaGh = true; esito.className = 'sotto'; esito.textContent = 'Controllo la chiave con GitHub...';
    try {
      const r = await fetch('/github', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gettone: v }) }); const j = await r.json();
      if (j.ok) { i.value = ''; mostraGh = false; esito.className = 'okk'; esito.textContent = '✓ Giusta! Ho fatto partire un giro di Sofia per prova. Da adesso ci penso io.'; i.blur(); setTimeout(() => { provaGh = false; giro(); }, 4000); return; }
      esito.className = 'err'; esito.textContent = j.errore || 'Non va.';
    } catch (e) { esito.className = 'err'; esito.textContent = 'Il ponte non risponde: è aperta la finestra nera?'; }
    provaGh = false;
  };
  i.addEventListener('paste', () => setTimeout(prova, 60));
  i.addEventListener('input', () => { if (i.value.trim().length >= 40) prova(); });
}
async function giro(){ try { const r = await fetch('/stato' + (mostraGh ? '?gh=1' : '')); const s = await r.json(); document.getElementById('corpo').innerHTML = s.html; preparaGh(); const f = document.getElementById('fcod'); if (f) f.onsubmit = async (e) => { e.preventDefault(); const v = document.getElementById('cod').value; const r2 = await fetch('/codice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codice: v }) }); const j = await r2.json(); if (!j.ok) alert(j.errore || 'Codice sbagliato'); giro(); }; const b = document.getElementById('avvio'); if (b) b.onclick = async () => { const r3 = await fetch('/avvio-automatico', { method: 'POST' }); const j = await r3.json(); alert(j.ok ? 'Fatto: il ponte partira da solo quando accendi il PC.' : (j.errore || 'Non ci sono riuscito')); }; } catch (e) {} }
giro(); setInterval(() => { const a = document.activeElement; if (provaGh || (a && (a.id === 'cod' || a.id === 'gh'))) return; giro(); }, 2500);
</script></body></html>`;
}
function cosaLeggo() {
  const g = (stato.conf.gruppi || []).join(", "), p = (stato.conf.privati || []).map(x => "la chat con " + x.nome).join(", ");
  return [g ? "il gruppo " + g : "", p].filter(Boolean).join(" e ");
}
// 1.1.0: il riquadro della spinta dal PC (la chiave non compare MAI nella pagina: solo se c'è, quando scade, com'è andata)
const dataBella = (iso) => { const [y, m, d] = String(iso || "").split("-"); return d && m && y ? `${d}/${m}/${y}` : String(iso || ""); };
const oraBella = (t) => new Date(t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
export function htmlSpinta(mostra = false) {
  const g = stato.conf.github, s = stato.spinta || {};
  const ce = !!(g && g.gettone);
  if (ce && !mostra) {
    const giorni = g.scade ? Math.round((Date.parse(g.scade + "T12:00:00Z") - Date.now()) / 86400000) : null;
    const scade = g.scade ? (giorni !== null && giorni <= 21 ? `<p class="err">⚠️ La chiave di GitHub ${giorni < 0 ? "è scaduta" : "scade"} il ${dataBella(g.scade)}: rifalla con il tasto qui sotto (2 minuti).</p>` : `<p class="sotto">La chiave di GitHub scade il ${dataBella(g.scade)}: qualche settimana prima te lo ricordo.</p>`) : "";
    return `<div class="box ok"><div class="big">✓ La spinta dal PC è accesa</div><p>Faccio partire io il giro di Sofia: ogni 10 minuti (dalle 6 alle 23) e 5 minuti dopo i messaggi nuovi.${s.ultima ? ` L'ultima volta alle <b>${oraBella(s.ultima)}</b>${s.perche ? ` (${esc(s.perche)})` : ""}.` : ""}</p>${s.errore ? `<p class="err">${esc(s.errore)}</p>` : ""}${scade}<button id="ghcambia" class="chiaro">Cambia la chiave di GitHub</button></div>`;
  }
  return `<div class="box" id="boxgh"><div class="big">${ce ? "Cambia la chiave di GitHub" : "Sofia sempre accesa: la spinta dal PC"}</div>
${ce ? "" : `<p>GitHub fa partire Sofia «quando può»: a volte con ore di ritardo. Con una chiave di GitHub la fa partire questo PC: ogni 10 minuti e subito dopo i messaggi nuovi.</p>`}
<ol><li>Tocca <b>«Apri GitHub»</b>: la pagina della chiave è già compilata.</li><li>Lì, in <b>Repository access</b>, scegli <b>Only select repositories</b> → <b>pulizie-stanze-ricci</b> (se non c'è già). Poi in fondo <b>Generate token</b>, e copia la chiave col tastino accanto (comincia con github_pat_).</li><li>Torna qui e <b>incollala nel riquadro giallo</b>: controllo io se è giusta.</li></ol>
<a class="bottone" href="${LINK_CHIAVE_GH}" target="_blank" rel="noopener">Apri GitHub</a>
<div class="gialla"><label for="gh">👉 Incolla qui la chiave di GitHub</label><input id="gh" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_..."></div>
<p id="ghesito" class="sotto">La chiave resta solo su questo PC: non va nell'app, né nel database.</p>${ce ? `<button id="ghtieni" class="chiaro">Lascia quella di prima</button>` : ""}</div>`;
}
async function htmlStato(opz = {}) {
  const s = stato, reg = `<div class="box"><b>Cosa è successo</b><div class="reg">${esc(s.registro.slice(-14).join("\n"))}</div></div>`;
  if (s.fase === "codice") return `<div class="box"><div class="big">1. Il codice del ponte</div><p>Nell'app: <b>Altro → Il ponte WhatsApp → Crea il codice del ponte</b>. Scrivilo qui sotto (16 lettere e numeri).</p>${s.errore ? `<p class="err">${esc(s.errore)}</p>` : ""}<form id="fcod"><input id="cod" autocomplete="off" placeholder="ABCD-EFGH-JKLM-NPQR" maxlength="24"><button>Collega</button></form></div>` + reg;
  if (s.fase === "qr") { const img = await paginaQr(); return `<div class="box"><div class="big">2. Inquadra il codice con WhatsApp</div><ol><li>Sul telefono apri WhatsApp → <b>⋮</b> → <b>Dispositivi collegati</b> → <b>Collega un dispositivo</b>.</li><li>Inquadra il quadrato qui sotto.</li></ol>${img ? `<img src="${img}" alt="codice da inquadrare">` : "<p>Preparo il codice…</p>"}<p class="sotto">Il codice cambia ogni tanto: se non va, aspetta il nuovo.</p></div>` + reg; }
  if (s.fase === "collegato") return `<div class="box ok"><div class="big">✓ Collegato</div><p>Leggo soltanto: <b>${esc(cosaLeggo())}</b>. Messaggi passati a Sofia: <b>${s.contati}</b>${s.ultimo ? ` · l'ultimo alle ${new Date(s.ultimo).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}` : ""}.</p><p>Lascia aperta la finestra nera del ponte (puoi ridurla a icona). Se spegni il PC, i messaggi aspettano e arrivano quando lo riaccendi.</p><button id="avvio" class="chiaro">Fallo partire da solo quando accendo il PC</button><p class="sotto">Ponte ${VERSIONE} · si aggiorna da solo.</p></div>` + htmlSpinta(!!opz.gh) + reg;
  if (s.fase === "errore") return `<div class="box"><p class="err">${esc(s.errore)}</p></div>` + reg;
  return `<div class="box"><div class="big">Un attimo…</div><p>${s.fase === "ricollego" ? "Mi ricollego a WhatsApp." : "Preparo il ponte."}</p></div>` + reg;
}
function avvioAutomatico() {
  return new Promise((ok) => {
    if (process.platform !== "win32") { ok({ ok: false, errore: "Si fa solo su Windows." }); return; }
    const bat = path.join(CARTELLA, "Avvia il ponte di Sofia.bat");
    const ps = `$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Startup')+'\\Ponte di Sofia.lnk'); $s.TargetPath='${bat.replace(/'/g, "''")}'; $s.WorkingDirectory='${CARTELLA.replace(/'/g, "''")}'; $s.WindowStyle=7; $s.Save()`;
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps.replace(/"/g, '\\"')}"`, (err) => ok(err ? { ok: false, errore: String(err.message).slice(0, 160) } : { ok: true }));
  });
}
function avviaPagina() {
  const srv = http.createServer(async (req, res) => {
    try {
      if (req.url === "/stato" || req.url === "/stato?gh=1") { res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify({ fase: stato.fase, html: await htmlStato({ gh: req.url.endsWith("gh=1") }) })); return; }
      if (req.url === "/github" && req.method === "POST") {
        // solo dalla pagina del ponte: JSON (un altro sito non può mandarlo senza permesso) e, se c'è, la stessa origine
        const tipo = String(req.headers["content-type"] || "").split(";")[0].trim(), orig = String(req.headers.origin || "");
        if (tipo !== "application/json" || (orig && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(orig))) { res.writeHead(403); res.end("no"); return; }
        let corpo = ""; for await (const x of req) { corpo += x; if (corpo.length > 4000) break; }
        let g = ""; try { g = String(JSON.parse(corpo || "{}").gettone || ""); } catch (e) {}
        const risp = await provaChiave(g);
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(risp)); return;
      }
      if (req.url === "/codice" && req.method === "POST") {
        let corpo = ""; for await (const p of req) corpo += p;
        const codice = String((JSON.parse(corpo || "{}").codice) || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
        const risp = await usaCodice(codice);
        res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(risp)); return;
      }
      if (req.url === "/avvio-automatico" && req.method === "POST") { const r = await avvioAutomatico(); res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(r)); return; }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(pagina());
    } catch (e) { res.writeHead(500); res.end(String(e.message)); }
  });
  // 1.1.0: se la porta è occupata riprovo qualche volta (il ponte di prima si sta fermando); se resta occupata, c'è già un ponte acceso
  return new Promise((ok, no) => {
    let volte = 0;
    srv.on("listening", () => { annota(`Pagina del ponte: http://localhost:${PORTA}`); ok(srv); });
    srv.on("error", (e) => { if (e && e.code === "EADDRINUSE" && ++volte < 5) { setTimeout(() => srv.listen(PORTA, "127.0.0.1"), 1500); return; } no(e); });
    srv.listen(PORTA, "127.0.0.1");
  });
}
// il codice creato nell'app (16 lettere e numeri): le prime 6 dicono l'utente del ponte, le altre 10 sono la sua password.
// Si entra una volta (la password va solo a Google), si legge la scheda del ponte (i gruppi da seguire) e si parte.
export function daCodice(codice, dominio) {
  const c = String(codice || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length !== 16) return null;
  const utente = "ponte-" + c.slice(0, 6).toLowerCase();
  return { utente, email: `${utente}@${dominio || "stanzericci.app"}`, password: c.slice(6) };
}
export async function usaCodice(codice) {
  const x = daCodice(codice, stato.fb && stato.fb.dominio);
  if (!x) return { ok: false, errore: "Il codice ha 16 lettere e numeri (es. ABCD-EFGH-JKLM-NPQR)." };
  try {
    const rientro = await accedi(x.email, x.password);
    stato.conf = { ...stato.conf, utente: x.utente, email: x.email, rientro };
    const d = await fsLeggi(`ponti/${x.utente}`);
    if (!d) return { ok: false, errore: "Nell'app questo ponte non c'è (o mancano le regole nuove su Firebase)." };
    stato.conf.gruppi = Array.isArray(d.gruppi) && d.gruppi.length ? d.gruppi.map(String) : ["Albergo"];
    prendiPrivati(d);
    salvaConf(confDaSalvare());
  } catch (e) { return { ok: false, errore: e.message }; }
  annota("Codice giusto: ora collego WhatsApp.");
  stato.errore = ""; tolto = 0;
  partiWhatsApp();
  return { ok: true };
}
function partiWhatsApp() {
  if (sock) { stato.fase = faseWA || "avvio"; return; }
  stato.fase = "avvio";
  if (process.env.PONTE_SENZA_WA) { if (process.env.PONTE_SENZA_WA === "collegato") stato.fase = "collegato"; return; }   // solo per le prove automatiche (senza WhatsApp vero)
  avviaWhatsApp().catch(e => { stato.fase = "errore"; stato.errore = e.message; });
}

// ---------------------------------------------------------------------------------- avvio
async function main() {
  try { fs.mkdirSync(DATI, { recursive: true }); } catch (e) {}
  annota(`Il ponte di Sofia ${VERSIONE}`);
  stato.conf = { gruppi: ["Albergo"], ...leggiConf() };
  try { await avviaPagina(); }
  catch (e) { if (e && e.code === "EADDRINUSE") { console.log("Il ponte è già acceso in un'altra finestra."); process.exit(4); } throw e; }
  // 1.1.0: la spinta dal PC (ogni minuto guardo se sono passati 10 minuti) e l'aggiornamento da solo (dopo 3 minuti, poi ogni 6 ore)
  setInterval(() => { try { spintaPeriodica(); } catch (e) {} }, 60 * 1000);
  setTimeout(() => { controllaAggiornamento().catch(() => {}); setInterval(() => controllaAggiornamento().catch(() => {}), 6 * 3600 * 1000); }, 3 * 60 * 1000);
  // partito bene da 2 minuti: il ponte di prima (tenuto da parte durante un aggiornamento) non serve più
  setTimeout(() => { try { fs.unlinkSync(path.join(CARTELLA, "ponte-prima.mjs")); } catch (e) {} }, 2 * 60 * 1000);
  if (stato.conf.github && stato.conf.github.gettone) annota("Spinta dal PC accesa: faccio partire io il giro di Sofia ogni 10 minuti e dopo i messaggi nuovi.");
  try { stato.fb = await caricaFirebase(); } catch (e) { stato.fase = "errore"; stato.errore = e.message + " (c'è internet?)"; annota(stato.errore); return; }
  if (process.platform === "win32" && !process.env.PONTE_NO_BROWSER) exec(`start "" "http://localhost:${PORTA}"`);
  setInterval(battito, 5 * 60 * 1000);
  if (!stato.conf.utente || !stato.conf.rientro) { stato.fase = "codice"; annota("Scrivi il codice del ponte nella pagina che si è aperta."); return; }
  try { await gettoneValido(); const d = await fsLeggi(`ponti/${stato.conf.utente}`); if (!d) throw new Error("Il ponte è stato tolto nell'app: scrivi un codice nuovo."); if (Array.isArray(d.gruppi) && d.gruppi.length) stato.conf.gruppi = d.gruppi.map(String); prendiPrivati(d); }
  catch (e) { stato.fase = "codice"; stato.errore = e.message; annota(e.message); return; }
  partiWhatsApp();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
