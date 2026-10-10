// ============================================================================
//  APP  ·  Le Stanze di Ricci · Pulizie
//  Qui c'è tutto quello che si vede: schermate, bottoni, tabellone, soldi.
//  I dati passano sempre da db.js; le regole stanno in regole.js e logica.js.
// ============================================================================
import { ZONE, CAMERE, REGOLE_BASE, TIPI_PULIZIA, TIPI_OSPITE, RIFIUTI, APPOGGIO_ESTERNO, PERSONE_BASE } from "./regole.js";
import * as L from "./logica.js";
import { apriDb } from "./db.js";
import { daSheetJS, leggiProspetto } from "./excel.js";
import { capisciProspetto, copiaSettimanaScorsa, settimanaBaseDefault, richiestaPerIA } from "./dettatura.js";

export const VERSIONE = "0.18.5";

// Icone (SVG semplici, tratto 2px). Si usano con ICONA("nome").
const ICONE_SVG = {
  letto: '<path d="M3 18V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10"/><path d="M3 14h18"/><path d="M7 10h4v4H7z"/>',
  scopa: '<path d="M14 3l7 7"/><path d="M10 7l7 7"/><path d="M4 20c0-4 2-6 6-6l4 4c0 4-2 6-6 6H4z"/>',
  euro: '<path d="M17 6a7 7 0 1 0 0 12"/><path d="M5 10h9"/><path d="M5 14h9"/>',
  spunta: '<path d="M20 6L9 17l-5-5"/>',
  lista: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  orologio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  esci: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/>',
  entra: '<path d="M14 7l5 5-5 5"/><path d="M19 12H7"/><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/>',
  persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  nota: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
  avviso: '<path d="M12 3l10 18H2z"/><path d="M12 10v4"/><path d="M12 17.5v.5"/>',
  gioca: '<path d="M6 4l14 8-14 8z"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bidone: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3"/>',
  indietro: '<path d="M15 6l-6 6 6 6"/>',
};
const ICONA = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONE_SVG[n] || ""}</svg>`;
const STATI = {
  da_fare: { testo: "Da pulire", cls: "todo" }, in_corso: { testo: "In corso", cls: "wip" }, fatta: { testo: "Pulita", cls: "done" },
  problema: { testo: "Problema", cls: "warn" }, non_fatta: { testo: "Non fatta", cls: "skip" },
};
const BADGE = (p) => { const st = STATI[p.stato] || STATI.da_fare; return `<span class="badge ${st.cls}">${st.testo}</span>`; };

// Donnine delle pulizie stilizzate (disegni nostri, SVG). Varianti: scopa, festa, secchio, saluto.
const STELLA = (x, y, r, col = "#FFC83D") => `<path d="M${x} ${y - r} L${x + r * .28} ${y - r * .28} L${x + r} ${y} L${x + r * .28} ${y + r * .28} L${x} ${y + r} L${x - r * .28} ${y + r * .28} L${x - r} ${y} L${x - r * .28} ${y - r * .28}Z" fill="${col}"/>`;
function DONNINA(v = "scopa", cls = "") {
  const pelle = "#F7C9A5", pelle2 = "#E6AE87", capelli = "#6B4226";
  const vestito = { scopa: "#4F7BE8", festa: "#EF6F7B", secchio: "#23B5A3", saluto: "#9A6BF2" }[v] || "#4F7BE8";
  const braccio = (d) => `<path d="${d}" stroke="${pelle}" stroke-width="7.5" fill="none" stroke-linecap="round"/>`;
  const mano = (x, y) => `<circle cx="${x}" cy="${y}" r="4.6" fill="${pelle}"/>`;
  let dietro = "", davanti = "", bracciaSx = "", bracciaDx = "", bocca = `<path d="M53 52 Q60 59 67 52" stroke="#A64B52" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if (v === "scopa") {
    dietro = `<path d="M97 34 L101 112" stroke="#B57A33" stroke-width="5" stroke-linecap="round"/><path d="M90 106 L112 108 L120 134 L82 134Z" fill="#E9B949"/><path d="M90 116 L116 118 M88 124 L118 126" stroke="#C9952B" stroke-width="2"/><rect x="92" y="104" width="18" height="6" rx="2" fill="#8A5A2B"/>`;
    bracciaSx = braccio("M44 72 Q30 84 38 96") + mano(39, 97); bracciaDx = braccio("M76 72 Q92 78 96 90") + mano(97, 92);
    davanti = STELLA(18, 40, 7) + STELLA(30, 22, 4.5) + STELLA(110, 58, 5);
  } else if (v === "festa") {
    bracciaSx = braccio("M44 72 Q30 58 32 42") + mano(31, 40); bracciaDx = braccio("M76 72 Q90 58 88 42") + mano(89, 40);
    bocca = `<path d="M52 51 Q60 62 68 51Z" fill="#A64B52"/>`;
    davanti = STELLA(16, 30, 7) + STELLA(104, 26, 7) + STELLA(24, 70, 4.5) + STELLA(100, 72, 4.5) + STELLA(60, 10, 5, "#FF8FA3");
  } else if (v === "secchio") {
    dietro = `<path d="M24 102 H56 L52 128 H28Z" fill="#6FA8F5"/><path d="M40 102 H56 L52 128 H40Z" fill="rgba(0,0,0,.12)"/><rect x="21" y="98" width="38" height="7" rx="3" fill="#3F6FD8"/><path d="M27 99 Q40 80 53 99" stroke="#8A8F9A" stroke-width="3" fill="none"/><circle cx="34" cy="90" r="3" fill="#CFE6FF"/><circle cx="46" cy="84" r="2.2" fill="#CFE6FF"/>`;
    bracciaSx = braccio("M44 72 Q34 86 38 100") + mano(38, 101); bracciaDx = braccio("M76 72 Q94 70 92 56") + mano(92, 55);
    davanti = `<rect x="84" y="40" width="18" height="12" rx="3" fill="#FFD54F"/><rect x="84" y="40" width="18" height="5" rx="2" fill="#5CC07A"/>` + STELLA(110, 30, 5) + STELLA(18, 60, 4.5);
  } else {
    dietro = `<path d="M34 98 L26 70" stroke="#B57A33" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="62" r="7" fill="#F48FB1"/><circle cx="18" cy="68" r="6" fill="#F8BBD0"/><circle cx="30" cy="56" r="6" fill="#F8BBD0"/><circle cx="29" cy="68" r="5" fill="#F48FB1"/>`;
    bracciaSx = braccio("M44 72 Q32 86 36 98") + mano(36, 99); bracciaDx = braccio("M76 72 Q92 64 94 46") + mano(95, 44);
    davanti = STELLA(108, 36, 5) + STELLA(100, 20, 4);
  }
  return `<svg class="donnina ${cls}" viewBox="0 0 124 140" aria-hidden="true">
    <ellipse cx="62" cy="133" rx="36" ry="5.5" fill="rgba(15,23,42,.14)"/>
    ${dietro}
    <ellipse cx="51" cy="128" rx="7.5" ry="4.2" fill="#3B3B4F"/><ellipse cx="69" cy="128" rx="7.5" ry="4.2" fill="#3B3B4F"/>
    <rect x="47" y="112" width="8" height="14" fill="${pelle2}"/><rect x="65" y="112" width="8" height="14" fill="${pelle2}"/>
    <path d="M44 66 Q60 58 76 66 L88 120 Q60 127 32 120Z" fill="${vestito}"/>
    <path d="M60 62 Q70 61 76 66 L88 120 Q74 124 60 124Z" fill="rgba(0,0,0,.13)"/>
    <path d="M47 78 H73 L79 118 H41Z" fill="#FFFFFF"/><path d="M60 78 H73 L79 118 H60Z" fill="rgba(15,23,42,.06)"/>
    <rect x="53" y="98" width="14" height="10" rx="2.5" fill="#E4EAF5"/>
    <path d="M52 64 L60 73 L68 64 Q60 60 52 64Z" fill="#FFFFFF"/>
    ${bracciaSx}${bracciaDx}
    <rect x="55" y="56" width="10" height="9" rx="3" fill="${pelle2}"/>
    <circle cx="60" cy="42" r="19.5" fill="${pelle}"/>
    <path d="M40.5 40 a19.5 19.5 0 0 1 39 0 Q60 32 40.5 40Z" fill="${capelli}"/>
    <circle cx="81" cy="31" r="7.5" fill="${capelli}"/>
    <path d="M39 37 Q60 12 81 37 L79 43 Q60 29 41 43Z" fill="#E04E5C"/>
    <path d="M41 42 L30 36 L35 46Z" fill="#E04E5C"/>
    <path d="M44 33 Q60 20 76 33" stroke="rgba(255,255,255,.35)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="53" cy="45" r="2.4" fill="#2B2B2B"/><circle cx="67" cy="45" r="2.4" fill="#2B2B2B"/>
    <circle cx="54" cy="44" r=".8" fill="#fff"/><circle cx="68" cy="44" r=".8" fill="#fff"/>
    <circle cx="48" cy="51" r="3.4" fill="#F7A1A6" opacity=".6"/><circle cx="72" cy="51" r="3.4" fill="#F7A1A6" opacity=".6"/>
    ${bocca}
    ${davanti}
  </svg>`;
}
function saluto() { const h = Number(new Date().toLocaleString("it-IT", { hour: "2-digit", hour12: false, timeZone: "Europe/Rome" })); return h < 13 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera"; }
function nomeSignora() { const u = S.utente; return u?.nome && !/^signora/i.test(u.nome) ? u.nome : `Signora ${S.zone[u?.zona]?.breve || ""}`.trim(); }

// ---------------------------------------------------------------------------
//  Stato dell'app (tutto quello che serve per disegnare le schermate)
// ---------------------------------------------------------------------------
const S = {
  db: null, utente: null, pronto: false,
  vista: "oggi", giorno: L.oggiISO(), settimana: L.lunediDi(L.oggiISO()),
  board: { modo: "elenco", inizio: L.lunediDi(L.oggiISO()) },
  camere: CAMERE.slice(), zone: ZONE, regole: { ...REGOLE_BASE }, listino: L.listinoCompleto(null),
  pulizie: {}, pagamenti: {}, soggiorni: {}, note: {}, ruoli: {}, controlli: {}, controlliA: {}, controlliB: {}, fattiAltrui: {}, impControlli: null, messaggi: {}, avvisi: null, promemoria: {}, veroUtente: null,
  caricati: { pulizie: false, soggiorni: false, ruoli: false },
  foglio: null, online: navigator.onLine, erroreAccesso: "", attesa: false,
  stop: [], tema: localStorage.getItem("ricci_tema") || "light",
};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const eur = L.eur;

function camera(id) { return S.camere.find(c => c.id === id) || { id, nome: id, zona: "?", tipo: "camera" }; }
function camereZona(z) { return S.camere.filter(c => c.zona === z).sort((a, b) => (a.ordine || 0) - (b.ordine || 0)); }
function zoneOrdinate() { return Object.entries(S.zone).sort((a, b) => (a[1].ordine || 0) - (b[1].ordine || 0)).map(([k, v]) => ({ id: k, ...v })); }
function proprietario() { return S.utente?.ruolo === "proprietario"; }
function addetta() { return S.utente?.ruolo === "addetta"; }
function puoModificare() { return proprietario(); }
function soggiorniLista() { return Object.values(S.soggiorni); }
function pulizieDelGiorno(iso, zona) { return Object.values(S.pulizie).filter(p => p.data === iso && (!zona || p.zona === zona)).sort((a, b) => ordineCamera(a.camera) - ordineCamera(b.camera)); }
function ordineCamera(id) { return camera(id).ordine || 99; }
function statoClasse(p) { return !p ? "" : (STATI[p.stato] || STATI.da_fare).cls; }
function statoTesto(p) { return p.stato === "fatta" ? `Pulita ${L.oraBreve(p.ora)}` : p.stato === "in_corso" ? `In corso da ${L.oraBreve(p.inizio)}` : p.stato === "problema" ? "Problema" : p.stato === "non_fatta" ? "Non fatta" : p.titolo; }
function minutiPulizia(p) { if (!p.inizio || !p.ora) return null; const m = Math.round((new Date(p.ora) - new Date(p.inizio)) / 60000); return m >= 0 && m < 600 ? m : null; }
function titoloLavoro(p) { return p.tipo === "totale" || p.tipo === "totale_casa" ? "Cambio completo" : p.titolo; }
// Le cose "da fare sempre" in una camera (le scrivono i proprietari in ⋯ o nella scheda della camera): es. Salvatore → "Balcone"
function promemoriaCamera(id) { return L.spezzaRichieste(S.promemoria?.[id] || ""); }
// "venerdì 16 ott", con "oggi"/"domani" davanti quando serve
function giornoParlato(iso) { const oggi = L.oggiISO(); const d = L.giorniTra(oggi, iso); const t = L.dataGiornoLungo(iso); return d === 0 ? `oggi, ${t}` : d === 1 ? `domani, ${t}` : d === -1 ? `ieri, ${t}` : t; }
function applicaTema() { if (S.tema === "dark") document.documentElement.setAttribute("data-theme", "dark"); else document.documentElement.removeAttribute("data-theme"); }

// ---------------------------------------------------------------------------
//  Avvio
// ---------------------------------------------------------------------------
async function avvia() {
  applicaTema();
  S.db = await apriDb(window.FIREBASE_CONFIG || null);
  if (S.db.modalita === "prova") window.__prova = { S, disegna, db: S.db }; // solo per le prove automatiche
  window.addEventListener("online", () => { S.online = true; disegna(); });
  window.addEventListener("offline", () => { S.online = false; disegna(); });
  S.db.onUtente((u) => {
    const prima = S.veroUtente || S.utente;
    const stessaPersona = prima && u && prima.uid === u.uid && prima.ruolo === u.ruolo && prima.zona === u.zona;
    if (S.veroUtente && stessaPersona) { S.veroUtente = u; S.pronto = true; disegna(); return; } // sto guardando come la signora: resto lì
    S.veroUtente = null; S.utente = u;
    S.pronto = true;
    if (!stessaPersona) {
      fermaAscolto();
      if (u && u.ruolo) { S.vista = "oggi"; avviaAscolto(); }
    }
    disegna();
  });
  disegna();
}

// Un proprietario può guardare (e usare) l'app come una signora: stessi dati veri, stessa schermata.
function entraComeSignora(zona) {
  if (!proprietario() || !S.zone[zona]) return;
  S.veroUtente = S.utente;
  S.utente = { ...S.utente, ruolo: "addetta", zona, nome: `Signora ${S.zone[zona].breve}`, finta: true };
  S.vista = "oggi"; S.giorno = L.oggiISO(); S.settimana = L.lunediDi(S.giorno); S.mostraGiorni = false; chiudiFoglio();
  aggiornaAscoltoAltrui(); disegna();
  window.scrollTo(0, 0);
}
function esciComeSignora() {
  if (!S.veroUtente) return;
  S.utente = S.veroUtente; S.veroUtente = null; S.vista = "altro"; chiudiFoglio();
  aggiornaAscoltoAltrui(); disegna();
}
function fermaAscolto() { for (const f of S.stop) { try { f(); } catch (e) {} } S.stop = []; if (stopAltrui) { stopAltrui(); stopAltrui = null; } S.caricati = { pulizie: false, soggiorni: false, ruoli: false }; S.pulizie = {}; S.pagamenti = {}; S.soggiorni = {}; S.note = {}; S.ruoli = {}; S.controlli = {}; S.controlliA = {}; S.controlliB = {}; S.fattiAltrui = {}; S.impControlli = null; S.messaggi = {}; S.avvisi = null; S.promemoria = {}; }
let stopAltrui = null;
function sonoControllatrice() { return addetta() && S.impControlli?.attuale && S.impControlli.attuale === S.utente.zona; }
// La controllatrice vede le camere FATTE dalle colleghe degli ultimi giorni (solo quelle, solo mentre è di turno)
function aggiornaAscoltoAltrui() {
  const serve = sonoControllatrice();
  if (!serve && stopAltrui) { stopAltrui(); stopAltrui = null; S.fattiAltrui = {}; disegna(); }
  if (serve && !stopAltrui) {
    const oggi = L.oggiISO();
    stopAltrui = S.db.ascolta("pulizie", { where: [["stato", "==", "fatta"], ["__id__", ">=", L.aggiungiGiorni(oggi, -3)], ["__id__", "<", L.aggiungiGiorni(oggi, 3)]] }, (m) => { S.fattiAltrui = m; disegna(); }, mostraErrore);
  }
}
// I proprietari tengono aggiornato chi è la controllatrice della settimana (a turno, salvo scelta diversa)
async function aggiornaControllatrice() {
  if (!proprietario() || S.impControlli === undefined) return;
  const chiave = L.settimanaCorrente();
  const zona = L.zonaControllatrice(S.impControlli, chiave, zoneOrdinate().map(z => z.id));
  if (!zona) return;
  if (S.impControlli?.attuale === zona && S.impControlli?.settimana === chiave) return;
  try { await S.db.salva("impostazioni", "controlli", { ...(S.impControlli || {}), attuale: zona, settimana: chiave, aggiornato: S.db.adesso() }); } catch (e) { console.error(e); }
}

function avviaAscolto() {
  const db = S.db, u = S.utente;
  const oggi = L.oggiISO();
  const da = L.aggiungiGiorni(L.primoDelMese(L.aggiungiGiorni(oggi, -31)), 0); // dal mese scorso
  const a = L.aggiungiGiorni(oggi, 45);
  // impostazioni condivise
  S.stop.push(db.ascoltaDoc("impostazioni", "camere", d => { if (d?.lista?.length) S.camere = d.lista; if (d?.zone) S.zone = d.zone; disegna(); pianifica(); }));
  S.stop.push(db.ascoltaDoc("impostazioni", "controlli", d => { S.impControlli = d || null; if (d) delete S.impControlli.id; aggiornaAscoltoAltrui(); aggiornaControllatrice(); disegna(); }));
  if (addetta()) {
    S.stop.push(db.ascolta("controlli", { where: [["zonaControllata", "==", u.zona]] }, (m) => { S.controlliA = m; S.controlli = { ...S.controlliA, ...S.controlliB }; disegna(); }, mostraErrore));
    S.stop.push(db.ascolta("controlli", { where: [["zonaControllatrice", "==", u.zona]] }, (m) => { S.controlliB = m; S.controlli = { ...S.controlliA, ...S.controlliB }; disegna(); }, mostraErrore));
  } else {
    S.stop.push(db.ascolta("controlli", { where: [["data", ">=", da]] }, (m) => { S.controlli = m; disegna(); }, mostraErrore));
  }
  S.stop.push(db.ascoltaDoc("impostazioni", "regole", d => { S.regole = { ...REGOLE_BASE, ...(d || {}) }; delete S.regole.id; disegna(); pianifica(); }));
  // messaggi del giorno dei proprietari alle signore (un documento, una voce per giorno)
  S.stop.push(db.ascoltaDoc("impostazioni", "messaggi", d => { S.messaggi = { ...(d || {}) }; delete S.messaggi.id; disegna(); }));
  // cose da fare sempre, camera per camera (es. Salvatore: balcone)
  S.stop.push(db.ascoltaDoc("impostazioni", "promemoria", d => { S.promemoria = { ...(d || {}) }; delete S.promemoria.id; disegna(); }));
  // avvisi (WhatsApp con un tocco; Telegram automatico se configurato)
  S.stop.push(db.ascoltaDoc("impostazioni", "avvisi", d => { S.avvisi = d ? { ...d } : null; if (S.avvisi) delete S.avvisi.id; disegna(); pianoDelMattino(); }));
  if (!addetta()) S.stop.push(db.ascoltaDoc("impostazioni", "listino", d => { S.listino = L.listinoCompleto(d); disegna(); pianifica(); }));
  // pulizie (le signore: solo la loro zona)
  const wherePul = [["__id__", ">=", da], ["__id__", "<", L.aggiungiGiorni(a, 1)]];
  if (addetta()) wherePul.push(["zona", "==", u.zona]);
  S.stop.push(db.ascolta("pulizie", { where: wherePul }, (m) => { S.pulizie = m; S.caricati.pulizie = true; disegna(); pianifica(); pianoDelMattino(); }, mostraErrore));
  // pagamenti
  S.stop.push(db.ascolta("pagamenti", { where: addetta() ? [["zona", "==", u.zona]] : [] }, (m) => { S.pagamenti = m; disegna(); }, mostraErrore));
  if (!addetta()) {
    S.stop.push(db.ascolta("soggiorni", { where: [["fine", ">=", da]] }, (m) => { S.soggiorni = m; S.caricati.soggiorni = true; disegna(); pianifica(); }, mostraErrore));
    S.stop.push(db.ascolta("note", { where: [["data", ">=", da]] }, (m) => { S.note = m; disegna(); pianifica(); }, mostraErrore));
  S.stop.push(db.ascoltaDoc("impostazioni", "foglio", d => { S.foglioInfo = d; disegna(); }));
  }
}

let erroreMostrato = "";
function mostraErrore(err) {
  const msg = err?.code === "permission-denied" ? "Non hai il permesso di vedere questi dati: controlla il tuo ruolo con Michele." : "Problema di collegamento ai dati.";
  if (erroreMostrato !== msg) { erroreMostrato = msg; toast(msg); }
}

// ---------------------------------------------------------------------------
//  Pianificazione automatica (solo i proprietari la fanno girare)
//  Guarda il prospetto e le regole e crea/aggiorna/cancella le pulizie "da fare".
//  Non tocca mai quelle FATTE / NON FATTE / PROBLEMA né quelle aggiunte a mano.
// ---------------------------------------------------------------------------
let timerPiano = null, pianoInCorso = false;
function pianifica() {
  if (!proprietario() || !S.caricati.pulizie || !S.caricati.soggiorni) return;
  clearTimeout(timerPiano);
  timerPiano = setTimeout(eseguiPiano, 900);
}
async function eseguiPiano() {
  if (pianoInCorso) { pianifica(); return; }
  pianoInCorso = true;
  try {
    const oggi = L.oggiISO();
    const da = L.aggiungiGiorni(oggi, -(S.regole.giorniIndietro ?? 3));
    const a = L.aggiungiGiorni(oggi, S.regole.giorniAvanti ?? 14);
    const attese = L.pianoPulizie(S.camere, soggiorniLista(), S.regole, S.listino, da, a, Object.values(S.note));
    const esistenti = {};
    for (const [id, p] of Object.entries(S.pulizie)) if (p.data >= da && p.data <= a) esistenti[id] = p;
    const diff = L.differenzePiano(attese, esistenti);
    const ops = [];
    for (const c of diff.crea) ops.push({ tipo: "salva", coll: "pulizie", id: c.id, dati: { ...c, creato: S.db.adesso() }, merge: false });
    for (const u of diff.aggiorna) ops.push({ tipo: "aggiorna", coll: "pulizie", id: u.id, dati: u.patch });
    for (const id of diff.cancella) ops.push({ tipo: "cancella", coll: "pulizie", id });
    if (ops.length) await S.db.scrivi(ops);
  } catch (e) { console.error("piano", e); }
  finally { pianoInCorso = false; }
}

// ---------------------------------------------------------------------------
//  Disegno
// ---------------------------------------------------------------------------
function disegna() {
  const app = $("#app");
  if (!app) return;
  disegnaTestata();
  document.body.classList.toggle("nonna", !!(S.utente && addetta()));
  let corpo = "";
  if (!S.pronto) corpo = `<section class="card center"><p class="muted">Un attimo…</p></section>`;
  else if (!S.utente) corpo = vistaAccesso();
  else if (!S.utente.ruolo) corpo = vistaNonAttivo();
  else if (addetta()) corpo = vistaAddetta();
  else corpo = vistaProprietario();
  const sx = $(".board-wrap")?.scrollLeft, sy = $(".board-wrap")?.scrollTop;
  // se si sta scrivendo in una casella e arriva un aggiornamento, il testo non deve sparire
  const attivo = document.activeElement, idAttivo = app.contains(attivo) && attivo.id ? attivo.id : null;
  const tenuti = {}; app.querySelectorAll("[data-keep][id]").forEach(e => { tenuti[e.id] = { v: e.value, s: e.selectionStart, e: e.selectionEnd }; });
  app.innerHTML = (S.utente?.finta ? `<div class="banner finta"><span>Stai guardando l'app come la <b>${esc(S.utente.nome)}</b> (dati veri)</span><button class="btnsm" data-torna-gestione>Torna alla gestione</button></div>` : "") + (S.db?.modalita === "prova" && S.utente ? `<div class="banner info">PROVA · dati di esempio, solo su questo telefono</div>` : "") + corpo;
  for (const [id, x] of Object.entries(tenuti)) { const e = document.getElementById(id); if (e && e.hasAttribute("data-keep")) e.value = x.v; }
  if (idAttivo) { const e = document.getElementById(idAttivo); if (e) { try { e.focus({ preventScroll: true }); if (tenuti[idAttivo] && e.setSelectionRange && /^(text|search|tel|url|password|textarea)$/i.test(e.type || "")) e.setSelectionRange(tenuti[idAttivo].s, tenuti[idAttivo].e); } catch (err) {} } }
  if (sx != null && $(".board-wrap")) { $(".board-wrap").scrollLeft = sx; $(".board-wrap").scrollTop = sy; }
  collega();
  if (S.foglio) disegnaFoglio();
}

function disegnaTestata() {
  const u = S.utente;
  const sub = !u ? "Pulizie" : addetta() ? `Signora ${S.zone[u.zona]?.breve || ""}` : (u.ruolo === "lettura" ? "Solo lettura" : "Gestione") + (u.nome ? " · " + u.nome : "");
  $("#sub").textContent = sub;
  const who = $("#whoBtn");
  who.hidden = !u;
  $("#menuBtn").hidden = !(u && u.ruolo && !addetta());
  $("#menuBtn").setAttribute("aria-pressed", S.vista === "altro" ? "true" : "false");
  who.textContent = S.online ? (L.dataBreve(L.oggiISO())) : "Senza rete";
  who.className = "who" + (S.online ? "" : " off");
  // striscia dei giorni
  const el = $("#days");
  const mostra = u && u.ruolo && (["oggi", "piantine", "settimana"].includes(S.vista)) && (!addetta() || S.mostraGiorni);
  el.hidden = !mostra;
  if (!mostra) return;
  const giorni = []; for (let i = 0; i < 7; i++) giorni.push(L.aggiungiGiorni(S.settimana, i));
  const oggi = L.oggiISO();
  el.innerHTML = `<button class="day arrow" data-sett="-1" aria-label="Settimana prima">‹</button>` +
    giorni.map(g => { const has = pulizieDelGiorno(g, addetta() ? u.zona : null).length > 0;
      return `<button class="day ${has ? "has" : ""} ${g === oggi ? "oggi" : ""}" aria-pressed="${g === S.giorno}" data-g="${g}">${L.GG[L.giornoSettimana(g)]}<b>${L.giornoDelMese(g)}</b><span class="dot"></span></button>`; }).join("") +
    `<button class="day arrow" data-sett="1" aria-label="Settimana dopo">›</button>`;
}

// ---- accesso ----------------------------------------------------------------
function vistaAccesso() {
  if (S.db.modalita === "prova") {
    return `<section class="card accesso"><div class="accesso-testa"><div><h2 style="margin:0 0 4px">Ciao! Chi sei?</h2><p class="muted" style="margin:0">Modalità prova: scegli una volta sola, il telefono se lo ricorda.</p></div>${DONNINA("saluto", "media")}</div></section>
    <div class="pick">${zoneOrdinate().map(z => `<button data-prova="addetta|${z.id}|">Signora ${esc(z.breve)}<span>${camereZona(z.id).map(c => c.nome).join(", ")}</span></button>`).join("")}
    <button class="gest" data-prova="proprietario||Michele">Gestione<span>Prospetto, quadro delle signore e paghe</span></button></div>`;
  }
  return `<section class="card accesso"><div class="accesso-testa"><div><h2 style="margin:0 0 4px">Ciao! Entra</h2><p class="muted" style="margin:0">Scrivi il tuo nome e la password, poi il telefono se lo ricorda.</p></div>${DONNINA("saluto", "media")}</div>
    <form id="formAccesso" autocomplete="on">
      <div class="campo"><label for="inNome">Il tuo nome (o la tua email)</label><input id="inNome" type="text" autocapitalize="none" autocomplete="username" placeholder="es. michele oppure primopiano" value="${esc(S.nomeAccesso || "")}" required></div>
      <div class="campo"><label for="inPass">Password</label><input id="inPass" type="password" autocomplete="current-password" required></div>
      ${S.erroreAccesso ? `<div class="errore">${esc(S.erroreAccesso)}</div>` : ""}
      <button class="big main" type="submit" ${S.attesa ? "disabled" : ""}>${S.attesa ? "Un attimo…" : "Entra"}</button>
    </form>
    <p class="muted small" style="margin-top:12px">Si entra una volta sola: il telefono se lo ricorda. Se hai dimenticato la password, chiedi a Michele.</p></section>`;
}
function vistaNonAttivo() {
  return `<section class="card"><h2>Accesso non ancora attivato</h2><p>Sei entrato come <b>${esc(S.utente.login || S.utente.email || S.utente.uid)}</b>, ma non è ancora scritto chi sei (proprietario o signora delle pulizie).</p><p class="muted">Chiedi a Michele di aggiungerti in ⋯ → Persone e accessi, poi riapri l'app.</p><button class="big undo" data-esci>Esci</button></section>`;
}

// ---- schermate delle signore ---------------------------------------------------
function vistaAddetta() {
  const z = S.utente.zona;
  const ctrl = sonoControllatrice();
  const nav = `<nav class="barra"><button aria-pressed="${S.vista === "oggi" || S.vista === "settimana"}" data-vista="oggi">${ICONA("letto")}<span>Camere</span></button><button aria-pressed="${S.vista === "soldi"}" data-vista="soldi">${ICONA("euro")}<span>I miei soldi</span></button>${ctrl ? `<button aria-pressed="${S.vista === "controlli"}" data-vista="controlli">${ICONA("lista")}<span>Controlli</span></button>` : ""}</nav>`;
  let corpo;
  if (S.vista === "soldi") corpo = vistaSoldi(z) + `<section class="card center"><button class="big undo" data-esci>Esci dall'app (poi serve di nuovo la password)</button></section>`;
  else if (S.vista === "controlli" && ctrl) corpo = vistaControlliCollega(z);
  else corpo = vistaNonnaOggi(z);
  return corpo + nav;
}

// Messaggio del giorno scritto dai proprietari (impostazioni/messaggi: una voce per giorno)
function messaggioDelGiorno(iso) { const m = S.messaggi?.[iso]; return m && m.testo ? m : null; }
function quandoEtichetta(iso) { const oggi = L.oggiISO(); return iso === oggi ? "Oggi" : iso === L.aggiungiGiorni(oggi, 1) ? "Domani" : iso === L.aggiungiGiorni(oggi, -1) ? "Ieri" : L.GIORNI[L.giornoSettimana(iso)].replace(/^./, c => c.toUpperCase()); }

// La giornata della signora: saluto, numeri grandi, una camera per riquadro, INIZIA → HO FINITO.
function vistaNonnaOggi(z) {
  const iso = S.giorno, oggi = L.oggiISO();
  const lavori = pulizieDelGiorno(iso, z);
  const n = (st) => lavori.filter(p => p.stato === st).length;
  const pulite = n("fatta"), inCorso = n("in_corso"), daFare = n("da_fare");
  const quando = quandoEtichetta(iso);
  const tutteFatte = lavori.length > 0 && pulite === lavori.length;
  let frase, variante;
  if (!lavori.length) { frase = iso === oggi ? "Oggi nessuna camera per te: goditi la giornata!" : "Per questo giorno non c'è niente in programma."; variante = "saluto"; }
  else if (tutteFatte) { frase = "Tutto pulito! Sei stata bravissima."; variante = "festa"; }
  else if (!pulite && !inCorso) { frase = `${iso === oggi ? "Oggi hai" : "Ci sono"} ${lavori.length === 1 ? "una camera" : lavori.length + " camere"}. Una alla volta e si fa tutto!`; variante = "scopa"; }
  else { const resto = lavori.length - pulite; frase = resto === 1 ? "Ne manca una sola. Forza, ci sei quasi!" : `Ne mancano ${resto}. Forza, stai andando benissimo!`; variante = "secchio"; }
  const msg = messaggioDelGiorno(iso);
  const messaggio = msg ? `<div class="pro-msg dentro"><div class="pro-msg-t">${ICONA("nota")}<span>Messaggio di ${esc(msg.da || "Michele")} per ${esc(quando.toLowerCase())}</span></div><div class="pro-msg-x">${esc(msg.testo)}</div></div>` : "";
  // Testata compatta: saluto, numeri, barra, giorno; subito sotto la piantina (è lei la cosa importante)
  const testata = `<section class="pro-testa">
    <div class="pro-ciao"><div class="pro-ciao-testo"><div class="pro-saluto">${esc(saluto())}, ${esc(nomeSignora())}!</div><div class="pro-frase">${esc(frase)}</div></div>${DONNINA(variante, "media")}</div>
    <div class="pro-riepilogo"><div class="pro-num"><b>${lavori.length}</b><span>camere</span></div><div class="pro-num done"><b>${pulite}</b><span>pulite</span></div><div class="pro-num wip"><b>${inCorso}</b><span>in corso</span></div><div class="pro-num todo"><b>${daFare}</b><span>da pulire</span></div></div>
    ${lavori.length ? `<div class="bar bar-grande"><i style="width:${Math.round(pulite / lavori.length * 100)}%"></i></div>` : ""}
    <div class="pro-data-riga"><div class="pro-data">${ICONA("calendario")}<span>${["Oggi", "Domani", "Ieri"].includes(quando) ? esc(quando) + " · " + esc(L.dataLunga(iso)) : esc(L.dataLunga(iso).replace(/^./, ch => ch.toUpperCase()))}</span></div><button class="nonna-link" data-altri-giorni>${S.mostraGiorni ? "Nascondi" : "Altri giorni"}</button></div>
    ${messaggio}${tutteFatte && numeroWhatsApp() ? `<button class="pro-btn verde" style="margin-top:12px;min-height:56px;font-size:15px" data-whatsapp-finito="${iso}">${ICONA("spunta")}<span>Avvisa su WhatsApp che hai finito</span></button>` : ""}</section>`;
  const rif = RIFIUTI.find(r => r.giorno === (L.giornoSettimana(iso) + 1) % 7);
  const bidoni = rif && z === "ap" ? `<div class="pro-nota">${ICONA("bidone")}<span>Stasera fuori i bidoni: <b>${esc(rif.cosa.replace(/^./, c => c.toUpperCase()))}</b></span></div>` : "";
  // La piantina: le camere al loro posto (sinistra/destra del corridoio, poi via Nazario Sauro); si tocca una camera
  const legenda = `<div class="legenda"><span><i class="todo"></i>Da pulire</span><span><i class="wip"></i>In corso</span><span><i class="done"></i>Pulita</span><span><i class="warn"></i>Problema</span></div>`;
  const piantina = `<section class="card piantina-card">${piantinaZona(z, iso, true)}${legenda}${lavori.length ? `<p class="piantina-aiuto">Tocca una camera: si apre in grande con tutti i dettagli e il bottone per iniziare.</p>` : ""}</section>`;
  return testata + bidoni + piantina;
}

// Un riquadro-camera della piantina (per le signore e per le piantine della gestione)
function tesseraGrande(c, iso, perSignora) {
  const p = S.pulizie[`${iso}_${c.id}`] || pulizieDelGiorno(iso).find(x => x.camera === c.id);
  const osp = !perSignora ? L.ospiteIl(soggiorniLista(), c.id, iso) : null;
  const clsNome = "tess-nome" + (c.nome.replace(/[^A-Za-zÀ-ÿ]/g, " ").split(" ").some(w => w.length > 8) ? " lungo" : "");
  if (!p) return `<div class="tess idle"><span class="${clsNome}">${esc(c.nome)}</span>${osp ? `<span class="tess-osp">${esc(osp.nome)}</span>` : ""}<span class="tess-stato-idle">Niente da fare</span></div>`;
  const cls = statoClasse(p);
  const chi = p.ospite ? `${esc(p.ospite)}${p.persone ? ` · ${p.persone}` : ""}` : (p.persone ? `${p.persone} ${p.persone === 1 ? "persona" : "persone"}` : "");
  const g = iso === L.oggiISO() ? "oggi" : L.GIORNI[L.giornoSettimana(iso)];
  const flag = p.partenza ? `<span class="tess-flag out">${ICONA("esci")}Parte ${g}</span>` : p.arrivo ? `<span class="tess-flag in">${ICONA("entra")}Arriva ${g}</span>` : "";
  const stato = p.stato === "fatta" ? `Pulita ${L.oraBreve(p.ora)}` : (STATI[p.stato] || STATI.da_fare).testo;
  const azione = perSignora ? (p.stato === "da_fare" ? "Tocca per iniziare" : p.stato === "in_corso" ? "Tocca quando hai finito" : (p.stato === "problema" || p.stato === "non_fatta") ? "Tocca per cambiare" : "") : "";
  const dett = p.dettagli ? `<span class="tess-dett">${ICONA("nota")}Dettagli</span>` : "";
  const attr = perSignora ? `data-dettagli="${esc(p.id)}"` : `data-pul="${esc(p.id)}"`;
  const prezzo = !perSignora ? `<span class="tess-pr">${eur(p.importo)}</span>` : "";
  return `<button class="tess ${cls}" ${attr}>${prezzo}<span class="${clsNome}">${esc(c.nome)}</span><span class="tess-lavoro">${esc(titoloLavoro(p))}</span>${chi ? `<span class="tess-osp">${chi}</span>` : ""}${flag}${dett}<span class="badge ${cls} tess-stato">${stato}</span>${azione ? `<span class="tess-az">${azione}</span>` : ""}</button>`;
}
function piantinaZona(z, iso, perSignora) {
  const rs = camereZona(z);
  const tile = c => tesseraGrande(c, iso, perSignora);
  if (rs.every(c => c.lato === "A")) return `<div class="piano-eti">${esc(S.zone[z]?.nome || z)}</div><div class="tess-griglia">${rs.map(tile).join("")}</div>`;
  const Lc = rs.filter(c => c.lato === "L"), Rc = rs.filter(c => c.lato === "R"), Sc = rs.filter(c => c.lato !== "L" && c.lato !== "R");
  return `<div class="piano-eti">${esc(S.zone[z]?.breve || z)}</div><div class="corridoio"><div class="lato">${Lc.map(tile).join("")}</div><div class="lato">${Rc.map(tile).join("")}</div></div>` +
    (Sc.length ? `<div class="piano-eti" style="margin-top:14px">${esc(Sc[0].via || "Altre")}</div><div class="tess-griglia">${Sc.map(tile).join("")}</div>` : "");
}

// Schermata grande che si apre quando la signora preme INIZIA: tutti i dettagli a caratteri enormi.
function foglioInizio(f) {
  const p = S.pulizie[f.id];
  if (!p) return `<div class="inizio"><div class="inizio-top"><button class="inizio-indietro" data-chiudi>${ICONA("indietro")}<span>Indietro</span></button></div><h3>Lavoro non trovato</h3><p class="muted">Forse è stato tolto dal prospetto.</p></div>`;
  const c = camera(p.camera);
  const passi = (p.passi && p.passi.length ? p.passi : TIPI_PULIZIA[p.tipo]?.passi || []);
  const msg = messaggioDelGiorno(p.data);
  const rif = RIFIUTI.find(r => r.giorno === (L.giornoSettimana(p.data) + 1) % 7);
  const sempre = promemoriaCamera(p.camera);
  const haDett = !!(p.dettagli || p.istruzioni || msg || sempre.length);
  let bottone = "";
  if (p.stato === "da_fare") bottone = S.regole.richiediInizio !== false && addetta()
    ? `<button class="pro-btn blu gigante" data-comincia="${esc(p.id)}">${ICONA("gioca")}<span>Ho capito, comincio</span></button>`
    : `<button class="pro-btn verde gigante" data-fatta-foglio="${esc(p.id)}">${ICONA("spunta")}<span>Ho finito, è pulita</span></button>`;
  else if (p.stato === "in_corso") bottone = `<div class="pro-tempo">${ICONA("orologio")}<span>Iniziata alle <b>${L.oraBreve(p.inizio)}</b></span></div><button class="pro-btn verde gigante" data-fatta-foglio="${esc(p.id)}">${ICONA("spunta")}<span>Ho finito, è pulita</span></button>`;
  else if (p.stato === "fatta") bottone = `<div class="pro-tempo done">${ICONA("spunta")}<span>Pulita alle <b>${L.oraBreve(p.ora)}</b>${minutiPulizia(p) != null ? ` · ${minutiPulizia(p)} min` : ""} · brava!</span></div>${addetta() ? `<button class="nonna-link" data-stato-foglio="${esc(p.id)}|da_fare">Ho sbagliato, non è pulita</button>` : ""}`;
  else if (p.stato === "problema") bottone = `<div class="pro-tempo warn">${ICONA("avviso")}<span>Problema segnalato${p.nota ? ": " + esc(p.nota) : ""}</span></div><button class="pro-btn verde gigante" data-fatta-foglio="${esc(p.id)}">${ICONA("spunta")}<span>Adesso è pulita</span></button>${addetta() ? `<button class="nonna-link" data-stato-foglio="${esc(p.id)}|da_fare">Togli il problema, rimetti da pulire</button>` : ""}`;
  else if (p.stato === "non_fatta") bottone = `<div class="pro-tempo skip">${ICONA("avviso")}<span>Non fatta${p.nota ? ": " + esc(p.nota) : ""}</span></div><button class="pro-btn verde gigante" data-fatta-foglio="${esc(p.id)}">${ICONA("spunta")}<span>Adesso è pulita</span></button>${addetta() ? `<button class="nonna-link" data-stato-foglio="${esc(p.id)}|da_fare">Rimetti da pulire</button>` : ""}`;
  const aperta = p.stato === "da_fare" || p.stato === "in_corso";
  return `<div class="inizio">
    <div class="inizio-top"><button class="inizio-indietro" data-chiudi>${ICONA("indietro")}<span>Indietro</span></button>${BADGE(p)}</div>
    <div class="inizio-testa ${statoClasse(p)}"><div><div class="inizio-camera">${esc(c.nome)}</div><div class="inizio-lavoro">${esc(titoloLavoro(p))}</div></div>${DONNINA(p.tipo === "ripasso" ? "saluto" : "secchio", "media")}</div>
    <div class="inizio-righe">
      ${p.ospite ? `<div class="inizio-riga">${ICONA("persona")}<span>${esc(p.ospite)}${p.persone ? ` · <b>${p.persone} ${p.persone === 1 ? "persona" : "persone"}</b>` : ""}</span></div>` : (p.persone ? `<div class="inizio-riga">${ICONA("persona")}<span><b>${p.persone} ${p.persone === 1 ? "persona" : "persone"}</b></span></div>` : "")}
      ${p.partenza ? `<div class="inizio-riga out">${ICONA("esci")}<span><b>Partenza ${esc(giornoParlato(p.data))}</b> · l'ospite va via</span></div>` : (p.parteIl && p.parteIl > p.data ? `<div class="inizio-riga">${ICONA("calendario")}<span>Resta fino a <b>${esc(giornoParlato(p.parteIl))}</b> (quel giorno parte)</span></div>` : "")}
      ${p.arrivo ? `<div class="inizio-riga in">${ICONA("entra")}<span><b>Arrivo ${esc(giornoParlato(p.data))}</b> · arriva un ospite nuovo${p.ospite ? ` (${esc(p.ospite)})` : ""}</span></div>` : (p.prossimoArrivo ? `<div class="inizio-riga in">${ICONA("entra")}<span>Prossimo arrivo <b>${esc(giornoParlato(p.prossimoArrivo))}</b>${p.prossimoNome ? ` · ${esc(p.prossimoNome)}${p.prossimoPersone ? `, ${p.prossimoPersone} ${p.prossimoPersone === 1 ? "persona" : "persone"}` : ""}` : ""}</span></div>` : "")}
    </div>
    <div class="inizio-dett ${haDett ? "" : "vuoto"}">
      <div class="inizio-dett-t">${ICONA("nota")}<span>Dettagli di oggi</span></div>
      ${sempre.length ? `<div class="inizio-dett-s"><b>Sempre in ${esc(c.nome)}:</b> ${esc(sempre.join(" · "))}</div>` : ""}
      ${p.dettagli ? `<div class="inizio-dett-x">${esc(p.dettagli)}</div>` : ""}
      ${p.istruzioni ? `<div class="inizio-dett-i">${esc(p.istruzioni)}</div>` : ""}
      ${msg ? `<div class="inizio-dett-m"><b>${esc(msg.da || "Michele")} dice:</b> ${esc(msg.testo)}</div>` : ""}
      ${haDett ? "" : `<div class="inizio-dett-x">Nessun dettaglio particolare: pulizia normale!</div>`}
    </div>
    ${rif && c.tipo === "casa" ? `<div class="pro-nota">${ICONA("bidone")}<span>Stasera fuori i bidoni: <b>${esc(rif.cosa.replace(/^./, c => c.toUpperCase()))}</b></span></div>` : ""}
    ${passi.length ? `<div class="inizio-passi-t">Cosa si fa</div><ol class="steps grandi">${passi.map((x, i) => `<li><b>${i + 1}</b><span>${esc(x)}</span></li>`).join("")}</ol>` : ""}
    ${bottone}
    ${aperta && addetta() ? `<div class="pro-sec"><button class="nonna-link" data-apri-motivo="${esc(p.id)}|non_fatta">Non la posso fare</button><button class="nonna-link rosso" data-apri-motivo="${esc(p.id)}|problema">${ICONA("avviso")}C'è un problema</button></div>` : ""}
  </div>`;
}

function vistaPiantina(z, perSignora) {
  const iso = S.giorno;
  const lavori = pulizieDelGiorno(iso, z), finiti = lavori.filter(p => p.stato !== "da_fare").length;
  const rif = RIFIUTI.find(r => r.giorno === (L.giornoSettimana(iso) + 1) % 7);
  const titolo = lavori.length ? `${iso === L.oggiISO() ? "Oggi" : L.dataBreve(iso)}: ${finiti} su ${lavori.length} ${finiti === 1 ? "fatta" : "fatte"}` : `${iso === L.oggiISO() ? "Oggi" : L.dataBreve(iso)} niente da pulire qui`;
  return `<section class="card piantina-card"><h2 style="margin:0 2px 2px">${titolo}</h2>
    <p class="muted small" style="margin:0 2px 12px">${L.dataLunga(iso)} · tocca una camera per vedere cosa fare</p>
    ${rif && z === "ap" ? `<div class="pro-nota" style="margin:0 0 10px">${ICONA("bidone")}<span>Stasera fuori: <b>${esc(rif.cosa.replace(/^./, c => c.toUpperCase()))}</b></span></div>` : ""}
    ${piantinaZona(z, iso, perSignora)}
    <div class="legenda"><span><i class="todo"></i>Da fare</span><span><i class="wip"></i>In corso</span><span><i class="done"></i>Fatta</span><span><i class="skip"></i>Non fatta</span><span><i class="warn"></i>Problema</span></div></section>`;
}

function vistaSettimanaLista(z) {
  const giorni = []; for (let i = 0; i < 7; i++) giorni.push(L.aggiungiGiorni(S.settimana, i));
  const oggi = L.oggiISO();
  const blocchi = giorni.map(g => {
    const ls = pulizieDelGiorno(g, z);
    if (!ls.length) return "";
    return `<section class="card"><h2 style="${g === oggi ? "color:var(--flamingo)" : ""}">${L.dataLunga(g)}${g === oggi ? " · oggi" : ""}</h2><div class="rows">${ls.map(p => `<button class="row" data-pul="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ${esc(p.titolo)}${p.ospite ? `<br><span class="muted">${esc(p.ospite)}</span>` : ""}</span><span class="s ${statoClasse(p)}">${esc(p.stato === "da_fare" ? "da fare" : statoTesto(p))}</span></button>`).join("")}</div></section>`;
  }).join("");
  return blocchi || `<section class="card"><h2>Niente in programma questa settimana</h2><p class="muted" style="margin:0">Le pulizie compaiono qui appena il prospetto è aggiornato.</p></section>`;
}

function vistaSoldi(z) {
  const chiave = L.settimanaCorrente();
  const { lista, totale, bonus } = L.totaleSettimana(S.pulizie, z, chiave, S.regole, S.controlli);
  const pagato = S.pagamenti[`${z}_${chiave}`];
  const wallet = `<section class="wallet"><div class="lbl">Questa settimana · ${L.etichettaSettimana(chiave)}</div><div class="amt">${eur(totale)}</div>
    <div>${lista.length} ${lista.length === 1 ? "pulizia fatta" : "pulizie fatte"}${bonus.n ? ` · ${bonus.perso ? "bonus controlli perso" : "bonus controlli " + eur(bonus.importo)}` : ""} · ${pagato ? `<span class="pill paid">✓ Pagata ${esc(pagato.quando || "")}</span>` : `<span class="pill open">Si paga sabato alle 13</span>`}</div></section>`;
  const elenco = `<section class="card"><h2>Cosa hai fatto questa settimana</h2>${lista.length ? `<div class="rows">${lista.map(p => `<div class="row"><span><b>${esc(camera(p.camera).nome)}</b> · ${esc(p.titolo)}<br><span class="muted">${esc(L.dataBreve(p.data))}${p.ora ? " alle " + L.oraBreve(p.ora) : ""}</span></span><span class="s done">${eur(p.finale)}${p.voto != null ? `<br><span class="muted small">voto ${esc(p.voto)}</span>` : ""}</span>${(S.controlli[p.id]?.nonFatteProprietario?.length ? S.controlli[p.id].nonFatteProprietario : S.controlli[p.id]?.nonFatte || []).length ? `<span class="muted small" style="grid-column:1/-1">Non fatto: ${esc((S.controlli[p.id].nonFatteProprietario?.length ? S.controlli[p.id].nonFatteProprietario : S.controlli[p.id].nonFatte).join(", "))} → pagata meno</span>` : ""}</div>`).join("")}</div>` : `<p class="muted" style="margin:0">Ancora niente. Ogni camera che segni pulita compare qui con il suo importo.</p>`}</section>`;
  return wallet + elenco + vistaStorico(z);
}
function vistaStorico(z) {
  const mesi = L.storicoMensile(S.pulizie, z, S.regole, S.controlli);
  const chiavi = Object.keys(mesi).sort().reverse();
  return `<section class="card"><h2>Storico</h2>${chiavi.length ? chiavi.map(k => { const m = mesi[k], [y, mm] = k.split("-");
    return `<div class="month"><div class="row" style="background:transparent;padding:4px 0"><b style="font:800 17px var(--f-display);text-transform:capitalize">${L.MESI[+mm - 1]} ${y}</b><span class="s">${eur(m.totale)} · ${m.n} pulizie</span></div>${Object.keys(m.settimane).sort().reverse().map(sk => { const pd = S.pagamenti[`${z}_${sk}`]; return `<div class="row"><span>Settimana ${L.etichettaSettimana(sk)} ${pd ? `<span class="pill paid">pagata</span>` : `<span class="pill open">da pagare</span>`}</span><span class="s">${eur(m.settimane[sk])}</span></div>`; }).join("")}</div>`; }).join("") : `<p class="muted" style="margin:0">Lo storico si riempie da solo, settimana dopo settimana.</p>`}</section>`;
}

// ---- controlli tra colleghe ----------------------------------------------------------
function vistaControlliCollega(z) {
  const lista = Object.values(S.fattiAltrui).filter(p => p.zona !== z).sort((a, b) => (a.data + a.camera) < (b.data + b.camera) ? 1 : -1);
  const righe = lista.map(p => { const c = S.controlli[p.id]; return `<button class="row" data-controlla="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ${esc(p.titolo)}<br><span class="muted">${esc(L.dataBreve(p.data))}${p.ora ? " alle " + L.oraBreve(p.ora) : ""} · Signora ${esc(S.zone[p.zona]?.breve || p.zona)}</span></span><span class="s ${c?.voto != null ? "done" : "todo"}">${c?.voto != null ? "voto " + c.voto : "da controllare"}</span></button>`; }).join("");
  return `<section class="card"><h2>Questa settimana i controlli li fai tu</h2><p class="muted small" style="margin:0">Passa nelle camere che le colleghe hanno segnato pulite e dai il voto con la lista dei punti. Il bonus di ${eur(L.votiCompleti(S.regole).bonusControllatrice)} arriva se i tuoi voti reggono al controllo di Michele.</p></section>
  <section class="card"><h2>Camere da controllare</h2>${righe ? `<div class="rows">${righe}</div>` : `<p class="muted" style="margin:0">Per ora nessuna camera pulita dalle colleghe negli ultimi giorni.</p>`}</section>`;
}
function foglioControllo(f) {
  const p = S.pulizie[f.id] || S.fattiAltrui[f.id];
  if (!p) return `<h3>Lavoro non trovato</h3>`;
  const c = S.controlli[f.id] || {};
  const daProprietario = f.modo === "proprietario";
  const punti = f.punti || (daProprietario ? (c.puntiProprietario || {}) : (c.punti || {}));
  f.punti = punti;
  const lista = L.puntiControlloPer(p, promemoriaCamera(p.camera)), standard = lista.filter(x => !x.richiesta), richieste = lista.filter(x => x.richiesta);
  const voto = L.votoDaiPunti(punti, lista, S.regole);
  const nonFatte = L.richiesteNonFatte(punti, lista);
  const fascia = L.fasciaVoto(S.regole, voto);
  const pen = Number(L.votiCompleti(S.regole).penalitaRichiesta ?? 3);
  const cam = camera(p.camera);
  const riga = (x) => `<button class="row" data-punto="${x.id}" aria-pressed="${punti[x.id] ? "true" : "false"}" style="grid-template-columns:auto 1fr;${punti[x.id] ? "background:var(--done-bg)" : (x.richiesta ? "background:var(--wip-bg)" : "")}"><span style="font-size:22px;width:28px;text-align:center">${punti[x.id] ? "✅" : "⬜"}</span><span>${esc(x.testo)}${x.richiesta && !punti[x.id] ? ` <span class="muted small">· non fatto: −${pen} punti</span>` : ""}</span></button>`;
  return `<h3>${esc(cam.nome)}</h3><div class="muted">${esc(L.dataLunga(p.data))} · ${esc(p.titolo)} · Signora ${esc(S.zone[p.zona]?.breve || p.zona)}</div>
    ${daProprietario && c.voto != null ? `<div class="note info">Voto della controllatrice (Signora ${esc(S.zone[c.zonaControllatrice]?.breve || "")}): <b>${c.voto}</b>${c.nota ? " · " + esc(c.nota) : ""}${c.nonFatte?.length ? `<br>Non fatto: ${esc(c.nonFatte.join(", "))}` : ""}</div>` : ""}
    ${richieste.length ? `<div class="floorlabel" style="margin-top:10px">Richiesto oggi per questa camera</div><p class="muted small" style="margin:0 0 4px">Le cose scritte da ${esc(p.dettagliDa || "Michele")} nei dettagli (e le istruzioni dell'ospite). Spunta solo quelle fatte davvero: ognuna non fatta toglie ${pen} punti e la pulizia si paga meno.</p>
    <div class="rows">${richieste.map(riga).join("")}</div>` : ""}
    <div class="floorlabel" style="margin-top:10px">Controllo generale</div><p class="muted small" style="margin:0 0 4px">Spunta quello che è a posto. Il voto si calcola da solo.</p>
    <div class="rows">${standard.map(riga).join("")}</div>
    <div class="stat" style="margin-top:12px;text-align:center"><b style="font-size:34px;color:${voto >= 9 ? "var(--done)" : voto >= 6 ? "var(--fg)" : "var(--warn)"}">${voto}</b><span>voto${voto <= 4 ? " · con richiamo" : voto >= 9 ? " · ottimo" : ""}${fascia ? ` · paga al ${fascia.perc}%` : ""}${nonFatte.length ? `<br>non fatto: ${esc(nonFatte.join(", "))}` : ""}</span></div>
    <div class="campo"><label for="cNota">Due parole (facoltative)</label><input id="cNota" type="text" data-keep value="${esc(daProprietario ? (c.notaProprietario || "") : (c.nota || ""))}"></div>
    <button class="big ok" id="salvaControllo">Conferma il voto ${voto}</button>`;
}
async function salvaControllo(f) {
  const p = S.pulizie[f.id] || S.fattiAltrui[f.id]; if (!p) return;
  const lista = L.puntiControlloPer(p, promemoriaCamera(p.camera));
  const punti = f.punti || {}, voto = L.votoDaiPunti(punti, lista, S.regole), nota = ($("#cNota")?.value || "").trim();
  const nonFatte = L.richiesteNonFatte(punti, lista);
  const richieste = lista.filter(x => x.richiesta).map(x => x.testo);
  const c = S.controlli[f.id] || {};
  const base = { pulizia: p.id, camera: p.camera, data: p.data, zonaControllata: p.zona, richieste };
  let dati;
  if (f.modo === "proprietario") dati = { ...base, zonaControllatrice: c.zonaControllatrice || "proprietario", votoProprietario: voto, puntiProprietario: punti, nonFatteProprietario: nonFatte, notaProprietario: nota, proprietario: S.utente.nome || S.utente.login || "", oraProprietario: S.db.adesso() };
  else dati = { ...base, zonaControllatrice: S.utente.zona, controllatrice: S.utente.nome || S.utente.login || "", voto, punti, nonFatte, nota, ora: S.db.adesso(), settimana: L.chiaveSettimana(new Date(), S.regole.chiusuraPaga) };
  try { await S.db.salva("controlli", f.id, dati, true); chiudiFoglio(); toast(`Voto ${voto} salvato`); }
  catch (e) { erroreScrittura(e); }
}

// ---- schermate dei proprietari ---------------------------------------------------
function vistaProprietario() {
  const v = S.vista;
  const tabs = `<div class="tabs">${[["oggi", "Oggi"], ["prospetto", "Prospetto"], ["piantine", "Piantine"], ["paghe", "Paghe"]].map(([k, n]) => `<button aria-pressed="${v === k}" data-vista="${k}">${n}</button>`).join("")}</div>`;
  let corpo = "";
  if (v === "oggi") corpo = vistaOggiGestione();
  else if (v === "prospetto") corpo = vistaTabellone();
  else if (v === "piantine") corpo = zoneOrdinate().map(z => vistaPiantina(z.id, false)).join("");
  else if (v === "paghe") corpo = vistaPaghe();
  else if (v === "altro") corpo = vistaAltro();
  else if (v === "foglio") corpo = vistaFoglio();
  else corpo = vistaOggiGestione();
  return tabs + corpo;
}

function vistaOggiGestione() {
  const iso = S.giorno;
  const blocchi = zoneOrdinate().map(z => {
    const ls = pulizieDelGiorno(iso, z.id);
    if (!ls.length) return `<section class="card zone"><div class="head"><h2 style="margin:0">${esc(z.nome)}</h2><span class="muted">niente</span></div></section>`;
    const f = ls.filter(p => p.stato === "fatta").length;
    return `<section class="card zone"><div class="head"><h2 style="margin:0">${esc(z.nome)}</h2><b>${f}/${ls.length}</b></div><div class="bar"><i style="width:${Math.round(f / ls.length * 100)}%"></i></div>
      <div class="rows">${ls.map(p => `<button class="row" data-pul="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ${esc(titoloLavoro(p))}${p.ospite ? ` · <span class="muted">${esc(p.ospite)}</span>` : ""}${p.stato === "fatta" && p.ora ? `<br><span class="muted">${L.oraBreve(p.ora)}${minutiPulizia(p) != null ? " · " + minutiPulizia(p) + " min" : ""}</span>` : p.stato === "in_corso" ? `<br><span class="muted">dalle ${L.oraBreve(p.inizio)}</span>` : ""}${p.dettagli ? `<br><span class="dett-mini">${ICONA("nota")}${esc(p.dettagli)}</span>` : ""}${p.nota ? `<br><span class="muted">“${esc(p.nota)}”</span>` : ""}</span>${BADGE(p)}</button>`).join("")}</div></section>`;
  }).join("");
  const problemi = Object.values(S.pulizie).filter(p => p.stato === "problema" && p.data >= L.aggiungiGiorni(L.oggiISO(), -7));
  const avviso = problemi.length ? `<section class="card"><h2 style="color:var(--warn)">Problemi segnalati (ultimi 7 giorni)</h2><div class="rows">${problemi.sort((a, b) => a.data < b.data ? 1 : -1).map(p => `<button class="row" data-pul="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ${esc(L.dataBreve(p.data))}<br><span class="muted">${esc(p.nota || "")}</span></span><span class="s warn">!</span></button>`).join("")}</div></section>` : "";
  const bottone = puoModificare() ? `<section class="card flat"><button class="big undo" data-whatsapp-piano="${iso}">Manda il piano di ${esc(quandoEtichetta(iso).toLowerCase())} su WhatsApp</button><button class="big main" data-nuovo-lavoro>+ Aggiungi un lavoro extra</button><button class="big undo" data-dettatura>🗣️ Dimmi il prospetto (scrivi o detta chi arriva)</button></section>` : "";
  const msg = messaggioDelGiorno(iso);
  const messaggio = `<section class="card msg-card"><div class="head"><h2 style="margin:0">Messaggio alle signore</h2>${puoModificare() ? `<button class="btnsm ${msg ? "ghost" : ""}" data-msg-giorno="${iso}">${msg ? "Cambia" : "Scrivi"}</button>` : ""}</div>
    ${msg ? `<div class="pro-msg-x" style="margin-top:6px">${esc(msg.testo)}</div><p class="muted small" style="margin:6px 0 0">Scritto da ${esc(msg.da || "")}${msg.ora ? " alle " + L.oraBreve(msg.ora) : ""} · lo vedono in cima alla loro schermata</p>` : `<p class="muted small" style="margin:6px 0 0">Nessun messaggio per ${esc(quandoEtichetta(iso).toLowerCase())}. Qui puoi scrivere due righe che le signore vedono in grande (es. orari di arrivo, cose da ricordare). I dettagli di una singola camera si scrivono toccando la camera.</p>`}</section>`;
  return `<section class="card flat"><h2 style="margin:0">${L.dataLunga(iso)}</h2><p class="muted small" style="margin:0">Tocca una riga per i dettagli. Le pulizie si creano da sole dal prospetto.</p></section>` + messaggio + avviso + blocchi + bottone;
}

// ---- tabellone (prospetto) ---------------------------------------------------------
function intervalloBoard() {
  if (S.board.modo !== "mese") return [S.board.inizio, L.aggiungiGiorni(S.board.inizio, 7)];
  const p = L.primoDelMese(S.board.inizio); return [p, L.aggiungiGiorni(L.ultimoDelMese(p), 1)];
}
function vistaTabellone() {
  const [da, a] = intervalloBoard();
  const N = L.giorniTra(da, a), sett = S.board.modo !== "mese", elenco = S.board.modo === "elenco", cw = sett ? 88 : 36;
  const oggi = L.oggiISO();
  const sog = soggiorniLista();
  let html = `<div class="board" style="grid-template-columns:132px repeat(${N},${cw}px)">`;
  html += `<div class="bh" style="grid-column:1;grid-row:1;position:sticky;left:0;z-index:4">Camera</div>`;
  const giorni = []; for (let i = 0; i < N; i++) giorni.push(L.aggiungiGiorni(da, i));
  giorni.forEach((g, i) => { const wd = L.giornoSettimana(g); html += `<div class="bh ${g === oggi ? "today" : ""} ${wd === 0 || wd === 6 ? "we" : ""}" style="grid-column:${i + 2};grid-row:1">${L.GG[wd]}<b>${L.giornoDelMese(g)}</b></div>`; });
  let riga = 2;
  for (const z of zoneOrdinate()) {
    html += `<div class="rl grp" style="grid-column:1;grid-row:${riga}">${esc(z.nome)}</div><div class="gband" style="grid-row:${riga}"></div>`; riga++;
    for (const c of camereZona(z.id)) {
      html += `<div class="rl" style="grid-row:${riga};min-height:${sett ? 64 : 48}px">${esc(c.nome)}<span>${L.tagliaCamera(S.listino, c.id) === "P" ? "piccola" : c.tipo === "casa" ? "casa" : "grande"}</span></div>`;
      giorni.forEach((g, i) => { const wd = L.giornoSettimana(g); html += `<button class="gcell ${wd === 0 || wd === 6 ? "we" : ""} ${g === oggi ? "today" : ""}" style="grid-column:${i + 2};grid-row:${riga}" data-cella="${c.id}|${g}" aria-label="${esc(c.nome)} ${g}"></button>`; });
      for (const s of sog.filter(s => s.camera === c.id)) {
        const i0 = Math.max(0, L.giorniTra(da, s.inizio)), i1 = Math.min(N, L.giorniTra(da, s.fine));
        if (i1 <= i0) continue;
        const col = TIPI_OSPITE[s.tipo]?.colore || TIPI_OSPITE.altro.colore;
        const q = s.tipo === "unk" || s.dubbio;
        html += `<button class="stay ${q ? "q" : ""} ${L.giorniTra(da, s.fine) > N ? "open" : ""}" style="grid-column:${i0 + 2}/${i1 + 2};grid-row:${riga};${q ? "" : `background:${col}`}" data-sog="${esc(s.id)}" title="${esc(s.nome)}">${q ? "? " : ""}${esc(s.nome)}${s.persone > 1 ? ` · ${s.persone}` : ""}</button>`;
      }
      for (const n of Object.values(S.note).filter(n => n.camera === c.id && n.data >= da && n.data < a)) {
        html += `<button class="mk" style="grid-column:${L.giorniTra(da, n.data) + 2};grid-row:${riga}" data-nota="${esc(n.id)}" aria-label="Nota">!</button>`;
      }
      for (const p of Object.values(S.pulizie).filter(p => p.camera === c.id && p.data >= da && p.data < a)) {
        const cls = p.stato === "fatta" ? "ok" : p.stato === "problema" ? "ko" : p.stato === "non_fatta" ? "sk" : (p.tipo.startsWith("totale") ? "T" : "");
        const txt = p.stato === "fatta" ? "✓" : p.stato === "problema" ? "!" : p.stato === "non_fatta" ? "✗" : (TIPI_PULIZIA[p.tipo]?.breve || "LAV");
        html += `<span class="cl ${cls}" style="grid-column:${L.giorniTra(da, p.data) + 2};grid-row:${riga}" title="${esc(p.titolo)}">${txt}</span>`;
      }
      riga++;
    }
  }
  html += `</div>`;
  // numeri
  let notti = 0; const perTipo = {};
  for (const s of sog) { const i0 = Math.max(0, L.giorniTra(da, s.inizio)), i1 = Math.min(N, L.giorniTra(da, s.fine)); if (i1 > i0) { notti += i1 - i0; perTipo[s.tipo] = (perTipo[s.tipo] || 0) + (i1 - i0); } }
  const occOggi = S.camere.filter(c => L.ospiteIl(sog, c.id, oggi)).length;
  const dubbi = sog.filter(s => (s.tipo === "unk" || s.dubbio) && s.fine >= da && s.inizio < a);
  const titolo = sett ? `${L.dataLunga(da)} – ${L.dataLunga(L.aggiungiGiorni(a, -1))}` : L.meseLungo(da);
  const noteP = Object.values(S.note).filter(n => n.data >= da && n.data < a).sort((x, y) => x.data < y.data ? -1 : 1);
  const corpoBoard = elenco ? elencoProspetto(da, a) : `<section class="card" style="padding:10px"><div class="board-wrap">${html}</div>
    <div class="boardleg">${Object.entries(TIPI_OSPITE).map(([k, t]) => `<span><i style="${k === "unk" ? "border:2px dashed var(--c-unk)" : "background:" + t.colore}"></i>${esc(t.nome)}</span>`).join("")}<span><i style="background:var(--flamingo);border-radius:50%"></i>Nota</span><span><i style="background:var(--accent)"></i>Pulizia (RIP / TOT / CASA)</span><span><i style="background:var(--done)"></i>Fatta ✓</span></div></section>`;
  return `<div class="tabs"><button aria-pressed="${elenco}" data-board="elenco">Elenco</button><button aria-pressed="${sett && !elenco}" data-board="settimana">Tabellone</button><button aria-pressed="${!sett}" data-board="mese">Mese</button></div>
  <section class="card flat"><div class="navmese"><button data-boardnav="-1" aria-label="Indietro">‹</button><b>${esc(titolo)}</b><button data-boardnav="1" aria-label="Avanti">›</button></div>
  <div class="stats"><div class="stat"><b>${occOggi}/${S.camere.length}</b><span>camere occupate oggi</span></div><div class="stat"><b>${notti}</b><span>notti nel periodo</span></div>${Object.entries(perTipo).filter(([k]) => k !== "unk").sort((x, y) => y[1] - x[1]).slice(0, 2).map(([k, v]) => `<div class="stat"><b style="color:${TIPI_OSPITE[k]?.colore || "inherit"}">${v}</b><span>notti ${esc(TIPI_OSPITE[k]?.nome || k)}</span></div>`).join("")}</div></section>
  ${puoModificare() ? bottoniProspetto() : ""}
  ${corpoBoard}
  ${dubbi.length ? `<section class="card"><h2 style="color:var(--todo)">Da controllare (?)</h2><div class="rows">${dubbi.map(s => `<button class="row" data-sog="${esc(s.id)}"><span><b>${esc(camera(s.camera).nome)}</b> · ${esc(s.nome)}<br><span class="muted">${esc(L.dataMedia(s.inizio))} → ${esc(L.dataMedia(s.fine))}${s.notaPrivata ? " · " + esc(s.notaPrivata) : ""}</span></span><span class="s todo">?</span></button>`).join("")}</div></section>` : ""}
  <section class="card"><h2>Note del periodo</h2>${noteP.length ? `<div class="notes">${noteP.map(n => `<button class="row" data-nota="${esc(n.id)}"><span><b>${esc(L.dataMedia(n.data))}</b> · ${esc(n.camera ? camera(n.camera).nome : "Generale")}<br>${esc(n.testo)}</span>${n.privata ? `<span class="pill priv">privata</span>` : ""}</button>`).join("")}</div>` : `<p class="muted" style="margin:0">Nessuna nota in questo periodo.</p>`}${puoModificare() ? `<button class="big undo" data-nuova-nota>+ Scrivi una nota</button>` : ""}</section>`;
}

// Prospetto a elenco: una riga per camera, con chi c'è, quando arriva e quando parte (giorno della settimana per esteso)
function elencoProspetto(da, a) {
  const oggi = L.oggiISO(), domani = L.aggiungiGiorni(oggi, 1), G = L.dataGiornoLungo;
  const sog = soggiorniLista();
  const pillola = (s) => {
    if (s.fine === oggi) return `<span class="el-pill out">parte oggi</span>`;
    if (s.inizio === oggi) return `<span class="el-pill in">arriva oggi</span>`;
    if (s.fine === domani) return `<span class="el-pill out">parte domani</span>`;
    if (s.inizio === domani) return `<span class="el-pill in">arriva domani</span>`;
    if (s.inizio <= oggi && oggi < s.fine) return `<span class="el-pill now">in camera</span>`;
    return "";
  };
  return zoneOrdinate().map(z => {
    const cam = camereZona(z.id);
    let occupate = 0;
    const righe = cam.map(c => {
      const miei = sog.filter(s => s.camera === c.id && s.inizio < a && da < s.fine).sort((x, y) => x.inizio < y.inizio ? -1 : 1);
      const noteCam = Object.values(S.note).filter(n => n.camera === c.id && n.data >= da && n.data < a).sort((x, y) => x.data < y.data ? -1 : 1);
      const pul = Object.values(S.pulizie).filter(p => p.camera === c.id && p.data >= da && p.data < a).sort((x, y) => x.data < y.data ? -1 : 1);
      const pulTxt = pul.length ? `<span class="muted small">Pulizie: ${pul.map(p => `${L.GG[L.giornoSettimana(p.data)]} ${TIPI_PULIZIA[p.tipo]?.breve || "LAV"}${p.stato === "fatta" ? " ✓" : p.stato === "problema" ? " !" : ""}`).join(" · ")}</span>` : "";
      const noteTxt = noteCam.map(nn => `<br><button class="el-nota" data-nota="${esc(nn.id)}">! ${esc(L.dataGiornoLungo(nn.data))}: ${esc(nn.testo)}</button>`).join("");
      if (!miei.length) return `<div class="row el-riga vuota"><span><b class="el-camera">${esc(c.nome)}</b><br><span class="muted">Libera tutta la settimana</span>${pulTxt ? "<br>" + pulTxt : ""}${noteTxt}</span>${puoModificare() ? `<button class="btnsm ghost" data-cella="${esc(c.id)}|${da}">+ Arrivo</button>` : ""}</div>`;
      occupate++;
      return miei.map((s, i) => {
        const col = TIPI_OSPITE[s.tipo]?.colore || TIPI_OSPITE.altro.colore, q = s.tipo === "unk" || s.dubbio;
        const notti = L.giorniTra(s.inizio, s.fine);
        return `<button class="row el-riga ${q ? "q" : ""}" data-sog="${esc(s.id)}"><span>${i === 0 ? `<b class="el-camera">${esc(c.nome)}</b>` : `<span class="el-camera-ancora">${esc(c.nome)} · poi</span>`}<br>
          <span class="el-chi"><i style="background:${q ? "transparent" : col};${q ? "border:2px dashed var(--c-unk)" : ""}"></i>${esc(s.nome)}${s.persone > 1 ? ` · ${s.persone} persone` : ""}${q ? ` <span class="chip">da controllare</span>` : ""}</span><br>
          <span class="el-quando">Arriva <b>${esc(G(s.inizio))}</b> → parte <b>${esc(G(s.fine))}</b> · ${notti} ${notti === 1 ? "notte" : "notti"}</span>
          ${s.nota ? `<br><span class="muted small">📝 ${esc(s.nota)}</span>` : ""}${i === miei.length - 1 && pulTxt ? "<br>" + pulTxt : ""}${i === miei.length - 1 ? noteTxt : ""}</span>${pillola(s)}</button>`;
      }).join("");
    }).join("");
    return `<section class="card zone"><div class="head"><h2 style="margin:0">${esc(z.nome)}</h2><span class="muted">${occupate}/${cam.length} occupate</span></div><div class="rows">${righe}</div></section>`;
  }).join("");
}

// ---- paghe e listino -----------------------------------------------------------
function vistaPaghe() {
  const chiave = L.settimanaCorrente();
  const blocchi = zoneOrdinate().map(z => {
    const { lista, totale } = L.totaleSettimana(S.pulizie, z.id, chiave, S.regole, S.controlli);
    const pd = S.pagamenti[`${z.id}_${chiave}`];
    const prec = L.settimanaPrecedente(chiave), tp = L.totaleSettimana(S.pulizie, z.id, prec, S.regole, S.controlli), pp = S.pagamenti[`${z.id}_${prec}`];
    return `<section class="card zone"><div class="head"><h2 style="margin:0">Signora ${esc(z.breve)}</h2><b style="font:800 22px var(--f-display)">${eur(totale)}</b></div>
      <div class="muted">${lista.length} pulizie · settimana ${L.etichettaSettimana(chiave)}${(() => { const b = L.totaleSettimana(S.pulizie, z.id, chiave, S.regole, S.controlli).bonus; return b.n ? (b.perso ? " · bonus controlli perso" : " · bonus controlli " + eur(b.importo)) : ""; })()}</div>
      <div>${pd ? `<span class="pill paid">✓ Pagata ${esc(pd.quando || "")}</span> ${puoModificare() ? `<button class="btnsm ghost" data-unpay="${z.id}|${chiave}">Annulla</button>` : ""}` : puoModificare() ? `<button class="btnsm" data-pay="${z.id}|${chiave}" ${totale ? "" : "disabled style='opacity:.5'"}>Segna come pagata</button>` : `<span class="pill open">da pagare</span>`}</div>
      ${tp.totale && !pp ? `<div class="avviso">Settimana scorsa (${L.etichettaSettimana(prec)}): ${eur(tp.totale)} ancora da pagare ${puoModificare() ? `<button class="btnsm" data-pay="${z.id}|${prec}" style="margin-left:8px">Segna pagata</button>` : ""}</div>` : ""}
      <details><summary>Dettaglio e storico</summary>${lista.length ? `<div class="rows">${lista.map(p => `<div class="row"><span><b>${esc(camera(p.camera).nome)}</b> · ${esc(p.titolo)}<br><span class="muted">${esc(L.dataBreve(p.data))}${p.ora ? " alle " + L.oraBreve(p.ora) : ""}</span></span><span class="s done">${eur(p.finale)}${p.voto != null ? `<br><span class="muted small">voto ${esc(p.voto)}</span>` : ""}</span></div>`).join("")}</div>` : ""}${vistaStorico(z.id)}</details></section>`;
  }).join("");
  const chiaveCtrl = L.settimanaCorrente(), zonaCtrl = L.zonaControllatrice(S.impControlli, chiaveCtrl, zoneOrdinate().map(z => z.id));
  const rich = L.richiami(S.controlli, S.regole);
  const controlliCard = `<section class="card"><h2>Controlli di questa settimana</h2>
    <div class="row"><span>Controllatrice di turno</span><select data-controllatrice-sel ${puoModificare() ? "" : "disabled"}>${zoneOrdinate().map(z => `<option value="${z.id}" ${zonaCtrl === z.id ? "selected" : ""}>Signora ${esc(z.breve)}</option>`).join("")}</select></div>
    <p class="muted small" style="margin:8px 0 0">A turno ogni settimana; qui si può cambiare. Lei vede nella sua app la linguetta "Controlli" con le camere fatte dalle colleghe.</p>
    ${Object.keys(rich.controllate).length || Object.keys(rich.controllatrici).length ? `<div class="rows" style="margin-top:10px">${Object.entries(rich.controllate).map(([z, l]) => `<div class="row"><span>Richiami per voti bassi · Signora ${esc(S.zone[z]?.breve || z)}</span><span class="s warn">${l.length}</span></div>`).join("")}${Object.entries(rich.controllatrici).map(([z, l]) => `<div class="row"><span>Controlli che non corrispondono · Signora ${esc(S.zone[z]?.breve || z)}${l.length >= rich.soglia ? " · <b>richiamo</b>" : ""}</span><span class="s warn">${l.length}/${rich.soglia}</span></div>`).join("")}</div>` : ""}</section>`;
  const l = S.listino, mod = puoModificare();
  const riga = (lab, chiave, val) => `<label for="l_${chiave}">${lab}</label><input id="l_${chiave}" type="number" min="0" step="0.5" value="${val}" data-listino="${chiave}" ${mod ? "" : "disabled"}>`;
  const listino = `<section class="card"><h2>Listino</h2><p class="muted small" style="margin:0 0 10px">Il prezzo si fissa quando la signora preme "Ho finito". Se lo cambi, vale dalle prossime pulizie: quelle già fatte o pagate non cambiano.</p>
    <div class="listino">${riga("Pulizia totale · camera grande", "totale.G", l.totale.G)}${riga("Pulizia totale · camera piccola", "totale.P", l.totale.P)}${riga("Ripasso veloce · camera grande", "ripasso.G", l.ripasso.G)}${riga("Ripasso veloce · camera piccola", "ripasso.P", l.ripasso.P)}${riga("Pulizia casa (martedì)", "casa", l.casa)}${riga("Pulizia totale casa (venerdì)", "totale_casa", l.totale_casa)}</div>
    <div class="floorlabel" style="margin-top:14px">Grande o piccola?</div>
    <div class="rows">${S.camere.filter(c => c.tipo !== "casa").map(c => `<div class="row"><span>${esc(c.nome)}</span><span class="seg"><button aria-pressed="${L.tagliaCamera(l, c.id) === "G"}" data-taglia="${c.id}|G" ${mod ? "" : "disabled"}>Grande</button><button aria-pressed="${L.tagliaCamera(l, c.id) === "P"}" data-taglia="${c.id}|P" ${mod ? "" : "disabled"}>Piccola</button></span></div>`).join("")}</div></section>`;
  return blocchi + controlliCard + listino;
}

// ---- altro ---------------------------------------------------------------------------
function vistaAltro() {
  const r = S.regole;
  return `<section class="card"><h2>Regole delle pulizie</h2>
    <div class="rows">
      <div class="row"><span>Camere: ripasso il <b>${L.GIORNI[(r.camera || [])[0]?.giorno ?? 3]}</b>, pulizia totale il <b>${L.GIORNI[(r.camera || [])[1]?.giorno ?? 5]}</b></span></div>
      <div class="row"><span>Case: pulizia il <b>${L.GIORNI[(r.casa || [])[0]?.giorno ?? 2]}</b>, totale il <b>${L.GIORNI[(r.casa || [])[1]?.giorno ?? 5]}</b></span></div>
      <div class="row"><span>Pulizia totale anche il giorno in cui l'ospite parte</span><span class="seg"><button aria-pressed="${!!r.totaleAllaPartenza}" data-regola="totaleAllaPartenza|1" ${puoModificare() ? "" : "disabled"}>Sì</button><button aria-pressed="${!r.totaleAllaPartenza}" data-regola="totaleAllaPartenza|0" ${puoModificare() ? "" : "disabled"}>No</button></span></div>
      <div class="row"><span>Le signore premono prima INIZIA e poi PULIZIA FINITA (così si vede quanto ci mettono)</span><span class="seg"><button aria-pressed="${r.richiediInizio !== false}" data-regola="richiediInizio|1" ${puoModificare() ? "" : "disabled"}>Sì</button><button aria-pressed="${r.richiediInizio === false}" data-regola="richiediInizio|0" ${puoModificare() ? "" : "disabled"}>No</button></span></div>
      <div class="row"><span>Pulizie preparate in anticipo</span><span class="s">${r.giorniAvanti ?? 14} giorni</span></div>
    </div><p class="muted small" style="margin:10px 0 0">I giorni si cambiano nel file regole.js (o chiedi a Michele).</p></section>
  <section class="card"><h2>Voto delle pulizie</h2><p class="muted small" style="margin:0 0 10px">Quando una collega controllatrice dà il voto a una camera, la paga di quella pulizia diventa questa percentuale del prezzo. (I controlli arrivano in un passo successivo: qui intanto si fissano le regole.)</p>
    <div class="listino">${Object.entries(L.votiCompleti(S.regole)).filter(([k, v]) => v && typeof v === "object").map(([k, v]) => `<label for="v_${k}">${esc(v.nome)}${v.richiamo ? " · con richiamo" : ""}</label><input id="v_${k}" type="number" min="0" max="200" step="5" value="${v.perc}" data-voto="${k}" ${puoModificare() ? "" : "disabled"}>`).join("")}
      <label for="v_bonus">Bonus controllatrice (€ a settimana)</label><input id="v_bonus" type="number" min="0" step="1" value="${L.votiCompleti(S.regole).bonusControllatrice}" data-voto="bonusControllatrice" ${puoModificare() ? "" : "disabled"}>
      <label for="v_pen">Punti tolti per ogni richiesta del giorno non fatta (es. "frigorifero", "doccia muffa")</label><input id="v_pen" type="number" min="0" max="10" step="1" value="${L.votiCompleti(S.regole).penalitaRichiesta ?? 3}" data-voto="penalitaRichiesta" ${puoModificare() ? "" : "disabled"}></div>
    <p class="muted small" style="margin:8px 0 0">Esempio: 8 punti a posto ma "frigorifero" non fatto → voto 7, paga al 100% senza bonus; due richieste non fatte → voto 4, paga al 50% e richiamo.</p></section>
  <section class="card"><h2>Da fare sempre, camera per camera</h2><p class="muted small" style="margin:0 0 8px">Quello che in una camera va fatto a ogni pulizia (es. Salvatore: balcone). La signora lo vede quando apre la camera e deve spuntarlo prima di chiudere; la controllatrice lo verifica e, se manca, il voto scende.</p>
    <div class="rows">${S.camere.map(c => `<div class="row one"><span><b>${esc(c.nome)}</b><br><input type="text" data-keep id="pm_${esc(c.id)}" data-promemoria="${esc(c.id)}" value="${esc(S.promemoria?.[c.id] || "")}" placeholder="niente di particolare" ${puoModificare() ? "" : "disabled"} style="margin-top:4px"></span></div>`).join("")}</div>
    <p class="muted small" style="margin:8px 0 0">Si salva da solo quando esci dalla casella. Più cose: separale con una virgola.</p></section>
  <section class="card"><h2>Guarda l'app come la vedono le signore</h2><p class="muted small" style="margin:0 0 8px">Per provare la loro parte sul tuo telefono, con i dati veri. Attenzione: quello che tocchi lì vale davvero (una camera segnata pulita resta pulita; c'è sempre "Ho sbagliato").</p>
    <div class="pick">${zoneOrdinate().map(z => `<button class="big undo" data-come-signora="${z.id}">👩‍🔧 Signora ${esc(z.breve)}</button>`).join("")}</div>
    <p class="muted small" style="margin:8px 0 0">Per giocare senza toccare niente di vero c'è la modalità prova: apri il link dell'app con <b>?prova=1</b> alla fine.</p></section>
  ${vistaAvvisi()}
  <section class="card"><h2>Aspetto</h2><div class="seg"><button aria-pressed="${S.tema !== "dark"}" data-tema="light">Chiaro</button><button aria-pressed="${S.tema === "dark"}" data-tema="dark">Scuro</button></div></section>
  <section class="card"><h2>Foglio di papà</h2>
    ${S.foglioInfo ? `<p class="muted small" style="margin:0 0 8px">Ultimo foglio: <b>${esc(S.foglioInfo.nome || "")}</b> · ${esc(S.foglioInfo.quando || "")} · ${esc((S.foglioInfo.mesi || []).join(", "))}</p>` : `<p class="muted small" style="margin:0 0 8px">Nessun foglio caricato finora.</p>`}
    ${puoModificare() ? `<label class="big main" style="display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer">📄 Carica il foglio di papà<input id="fileFoglio" type="file" accept=".xlsx,.xls,.xlsm" hidden></label><p class="muted small" style="margin:8px 0 0">Legge il file Excel con regole fisse e ti fa controllare prima di salvare. Niente viene cambiato finché non premi "Salva nel prospetto".</p>` : ""}
  </section>
  ${vistaPersone()}
  <div class="menu">
    <button data-esporta="xlsx">Esporta in Excel<span>Pulizie, pagamenti, prospetto e note in un file .xlsx</span></button>
    <button data-esporta="json">Copia di sicurezza completa<span>Un file con tutti i dati (si può ricaricare in futuro)</span></button>
    ${S.db.modalita === "prova" ? `<button data-azzera-prova>Azzera i dati di prova<span>Ricomincia con gli esempi puliti</span></button>` : ""}
    <button data-esci>Esci<span>${esc(S.utente.email || S.utente.nome || "")}</span></button>
  </div>
  <p class="muted small center">Le Stanze di Ricci · Pulizie · versione ${VERSIONE} · ${S.db.modalita === "firebase" ? "dati condivisi" : "modalità prova"}</p>`;
}

function vistaAvvisi() {
  const a = S.avvisi || {}, mod = puoModificare();
  const attivo = !!(a.token && a.chat);
  const sw = (k, testo, def = true) => `<label class="row" style="grid-template-columns:1fr auto;cursor:pointer"><span>${testo}</span><input type="checkbox" id="av_${k}" ${(a[k] ?? def) ? "checked" : ""} ${mod ? "" : "disabled"} style="width:24px;height:24px"></label>`;
  return `<section class="card"><h2>Avvisi alle signore</h2>
    <p class="muted small" style="margin:0 0 10px"><b>WhatsApp</b>: non permette a un'app di scrivere da sola in un gruppo (serve il servizio a pagamento per aziende). Qui il messaggio arriva già scritto: in <b>Oggi</b> premi "Manda il piano su WhatsApp", scegli il gruppo Pulizie e premi Invia. Lo stesso dalla scheda di una camera e dal messaggio del giorno.</p>
    <p class="muted small" style="margin:0 0 10px"><b>Telegram</b> invece è gratis e automatico: crea un bot con @BotFather, mettilo nel gruppo delle signore e scrivi qui il token e il numero del gruppo. Da quel momento l'app scrive da sola nel gruppo e tagga la signora della zona. ${attivo ? `<b style="color:var(--done)">Attivo.</b>` : `<b>Non ancora attivo.</b>`}</p>
    <div class="campo"><label for="avWa">Numero WhatsApp che riceve gli avvisi delle signore (es. 39333 1234567)</label><input id="avWa" type="tel" data-keep value="${esc(a.whatsapp || "")}" placeholder="39…" ${mod ? "" : "disabled"}><p class="muted small" style="margin:4px 0 0">Con questo numero, quando una signora segnala un problema o finisce tutte le camere le compare il bottone "Avvisa su WhatsApp": si apre WhatsApp con il messaggio pronto verso di te, lei preme Invia.</p></div>
    <div class="campo"><label for="avToken">Token del bot (da @BotFather)</label><input id="avToken" type="text" autocapitalize="none" data-keep value="${esc(a.token || "")}" placeholder="123456789:AAH…" ${mod ? "" : "disabled"}></div>
    <div class="due"><div class="campo"><label for="avChat">Numero del gruppo (chat id)</label><input id="avChat" type="text" data-keep value="${esc(a.chat || "")}" placeholder="-100123456789" ${mod ? "" : "disabled"}></div><div class="campo"><label for="avOra">Piano del mattino dalle ore</label><input id="avOra" type="number" min="0" max="23" value="${a.oraPiano ?? 7}" ${mod ? "" : "disabled"}></div></div>
    ${mod ? `<button class="big undo" data-cerca-gruppo>Cerca il gruppo da solo (dopo aver messo il bot nel gruppo)</button><div id="gruppiTrovati" class="scelte"></div>` : ""}
    <div class="floorlabel">Chi taggare (nome Telegram con @)</div>
    <div class="due">${zoneOrdinate().map(z => `<div class="campo"><label for="avTag_${z.id}">Signora ${esc(z.breve)}</label><input id="avTag_${z.id}" type="text" autocapitalize="none" data-keep value="${esc((a.tag || {})[z.id] || "")}" placeholder="@nome" ${mod ? "" : "disabled"}></div>`).join("")}</div>
    <div class="floorlabel" style="margin-top:8px">Cosa mandare da solo</div>
    <div class="rows">${sw("pianoMattina", "Il piano della giornata, al mattino (la prima volta che un proprietario apre l'app)")}${sw("messaggio", "Il messaggio del giorno, appena lo scrivi")}${sw("dettagli", "I dettagli di una camera, appena li salvi")}${sw("problema", "Quando una signora segnala un problema o una camera non fatta")}${sw("pulita", "Quando una camera viene segnata pulita", false)}</div>
    ${mod ? `<button class="big main" data-salva-avvisi>Salva</button><div class="due"><button class="big undo" data-prova-telegram>Prova: manda un saluto</button><button class="big undo" data-prova-piano>Prova: manda il piano di oggi</button></div>` : ""}
  </section>`;
}

// ---------------------------------------------------------------------------
//  Fogli (pannelli dal basso)
// ---------------------------------------------------------------------------
function elFoglio() { let s = $(".sheet"); if (!s) { s = document.createElement("div"); s.className = "sheet"; document.body.appendChild(s); s.onclick = e => { if (e.target === s) chiudiFoglio(); }; } return s; }
function chiudiFoglio() { S.foglio = null; fotoPending = null; const s = $(".sheet"); if (s) s.remove(); }
function apriFoglio(f) { S.foglio = f; disegnaFoglio(); }

function disegnaFoglio() {
  const f = S.foglio; if (!f) return;
  const s = elFoglio();
  let html = "";
  if (f.tipo === "pulizia") html = foglioPulizia(f);
  else if (f.tipo === "inizio") html = foglioInizio(f);
  else if (f.tipo === "messaggio") html = foglioMessaggio(f);
  else if (f.tipo === "controllo") html = foglioControllo(f);
  else if (f.tipo === "soggiorno") html = foglioSoggiorno(f);
  else if (f.tipo === "nota") html = foglioNota(f);
  else if (f.tipo === "nuovoLavoro") html = foglioNuovoLavoro(f);
  else if (f.tipo === "dettatura") html = foglioDettatura(f);
  else if (f.tipo === "info") html = `<h3>${esc(f.titolo)}</h3><div class="muted">${esc(f.sotto || "")}</div><div class="note info">${esc(f.testo)}</div>`;
  else if (f.tipo === "foto") html = `<h3>${esc(f.titolo)}</h3><div class="muted">${esc(f.sotto || "")}</div><img src="${f.dati}" alt="Foto" style="width:100%;border-radius:14px;margin-top:10px">`;
  // Se la persona sta scrivendo e arriva un aggiornamento, il testo non deve sparire
  const attivo = document.activeElement, idAttivo = s.contains(attivo) && attivo.id ? attivo.id : null;
  const valori = {}; s.querySelectorAll("textarea[id],input[id]").forEach(e => { if (e.type !== "file") valori[e.id] = { v: e.value, s: e.selectionStart, e: e.selectionEnd }; });
  const pieno = f.tipo === "inizio";
  s.classList.toggle("pieno", pieno);
  const scroll = pieno ? 0 : (s.querySelector(".panel")?.scrollTop || 0);
  s.innerHTML = `<div class="panel ${pieno ? "pieno" : ""}" role="dialog">${pieno ? "" : `<div class="grip"></div>`}${html}${pieno ? "" : `<button class="big close" data-chiudi>Chiudi</button>`}</div>`;
  for (const [id, x] of Object.entries(valori)) { const e = s.querySelector("#" + CSS.escape(id)); if (e && e.hasAttribute("data-keep")) { e.value = x.v; } }
  if (idAttivo) { const e = s.querySelector("#" + CSS.escape(idAttivo)); if (e) { try { e.focus({ preventScroll: true }); if (valori[idAttivo] && e.setSelectionRange && /^(text|search|tel|url|password|textarea)$/i.test(e.type || "")) e.setSelectionRange(valori[idAttivo].s, valori[idAttivo].e); } catch (err) {} } }
  if (scroll) { const pn = s.querySelector(".panel"); if (pn) pn.scrollTop = scroll; }
  collegaFoglio();
}

// Messaggio del giorno alle signore (lo scrivono i proprietari dalla schermata "Oggi")
function foglioMessaggio(f) {
  const m = S.messaggi[f.giorno];
  return `<h3>Messaggio alle signore</h3><div class="muted">${esc(quandoEtichetta(f.giorno))} · ${esc(L.dataLunga(f.giorno))} · lo vedono in cima alla loro schermata e quando aprono una camera</div>
    <div class="campo"><label for="msgTesto">Cosa vuoi dire</label><textarea id="msgTesto" data-keep placeholder="es. Oggi arrivano i Castaldi alle 15: Salvatore pronta per le 14. Grazie!" style="min-height:120px">${esc(f.testo ?? m?.testo ?? "")}</textarea></div>
    <div class="scelte">${["Grazie di tutto!", "Oggi arrivano ospiti nel pomeriggio", "Lasciate le chiavi sul tavolo", "Asciugamani doppi per gli operai", "Controllate i frigoriferi"].map(t => `<button type="button" data-chip-testo="msgTesto|${esc(t)}">${esc(t)}</button>`).join("")}</div>
    <button class="big main" data-salva-msg>Manda alle signore</button>
    <button class="big undo" data-whatsapp-msg>Manda anche su WhatsApp</button>
    ${m ? `<button class="big undo" data-togli-msg>Togli il messaggio</button><p class="muted small" style="margin-top:8px">Scritto da ${esc(m.da || "")}${m.ora ? " alle " + L.oraBreve(m.ora) : ""}</p>` : ""}
    ${S.avvisi?.token && S.avvisi?.chat && S.avvisi?.messaggio !== false ? `<p class="muted small" style="margin-top:6px">Con "Manda alle signore" parte anche l'avviso automatico su Telegram.</p>` : ""}`;
}

function foglioPulizia(f) {
  const p = S.pulizie[f.id];
  if (!p) return `<h3>Lavoro non trovato</h3><p class="muted">Forse è stato tolto dal prospetto.</p>`;
  const c = camera(p.camera);
  const mod = addetta() || puoModificare();
  const passi = (p.passi && p.passi.length ? p.passi : TIPI_PULIZIA[p.tipo]?.passi || []);
  const rif = RIFIUTI.find(r => r.giorno === (L.giornoSettimana(p.data) + 1) % 7);
  let stato = "";
  if (p.stato === "fatta") stato = `<div class="note done">✓ Fatta ${p.ora ? "alle " + L.oraBreve(p.ora) : ""} · ${eur(p.importo)} ${addetta() ? "nei tuoi soldi" : ""}</div>${mod ? `<button class="big undo" data-stato="da_fare">Mi sono sbagliata, non è fatta</button>` : ""}`;
  else if (p.stato === "problema") stato = `<div class="note warn">Problema: ${esc(p.nota || "")}</div>${mod ? `<button class="big ok" data-stato="fatta">Adesso è pulita</button><button class="big undo" data-stato="da_fare">Togli il problema</button>` : ""}`;
  else if (p.stato === "non_fatta") stato = `<div class="note skip">Non fatta${p.nota ? ": " + esc(p.nota) : ""}</div>${mod ? `<button class="big ok" data-stato="fatta">Adesso è pulita</button><button class="big undo" data-stato="da_fare">Rimetti da fare</button>` : ""}`;
  else if (p.stato === "in_corso") stato = `<div class="note info">In corso da ${esc(L.oraBreve(p.inizio))}</div>${mod ? `<button class="big ok" data-stato="fatta">Ho finito, è pulita</button>
    <div class="due"><button class="big skip" data-apri="non_fatta">Non fatta</button><button class="big ko" data-apri="problema">Problema</button></div>
    <div id="boxMotivo" hidden style="margin-top:10px"><div class="scelte" id="scelteMotivo"></div><label for="nota" class="muted" style="display:block;margin:6px 0 4px">Scrivi due parole (puoi usare il microfono della tastiera)</label><textarea id="nota" data-keep></textarea>
      <div style="display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap"><label class="btnsm ghost" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">📷 Aggiungi una foto<input id="fotoInput" type="file" accept="image/*" capture="environment" hidden></label><span id="fotoAnteprima" class="muted small"></span></div>
      <button class="big ko" id="confermaMotivo">Conferma</button></div>` : ""}`;
  else if (mod) stato = `${S.regole.richiediInizio !== false && addetta() ? `<button class="big main" data-vai-inizio="${esc(p.id)}">Inizia la pulizia</button>` : `<button class="big ok" data-stato="fatta">Ho finito, è pulita</button>`}
    <div class="due"><button class="big skip" data-apri="non_fatta">Non fatta</button><button class="big ko" data-apri="problema">Problema</button></div>
    <div id="boxMotivo" hidden style="margin-top:10px">
      <div class="scelte" id="scelteMotivo"></div>
      <label for="nota" class="muted" style="display:block;margin:6px 0 4px">Scrivi due parole (puoi usare il microfono della tastiera)</label><textarea id="nota" data-keep></textarea>
      <div style="display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap"><label class="btnsm ghost" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">📷 Aggiungi una foto<input id="fotoInput" type="file" accept="image/*" capture="environment" hidden></label><span id="fotoAnteprima" class="muted small"></span></div>
      <button class="big ko" id="confermaMotivo">Conferma</button></div>`;
  const chiPuo = (proprietario() && p.origine === "mano" ? `<button class="big undo" data-cancella-pul>Elimina questo lavoro</button>` : "") + (p.foto ? `<button class="big undo" data-vedi-foto>📷 Vedi la foto</button>` : "");
  // Dettagli del giorno per la signora: li scrivono i proprietari (anche ogni mattina), lei li vede grandissimi
  const dettagli = proprietario()
    ? `<div class="floorlabel" style="margin-top:14px">Dettagli per la signora</div>
      <p class="muted small" style="margin:0 0 6px">Li vede in grande quando apre la camera. Puoi cambiarli quando vuoi, anche ogni mattina.${p.dettagliDa ? ` Ultimi scritti da ${esc(p.dettagliDa)}${p.dettagliOra ? " alle " + L.oraBreve(p.dettagliOra) : ""}.` : ""}</p>
      <textarea id="dettagli" data-keep placeholder="es. Asciugamani doppi, controlla il frigo, lascia la chiave sul tavolo">${esc(p.dettagli || "")}</textarea>
      <div class="scelte">${["Asciugamani doppi", "Cambia anche le coperte", "Controlla il frigo", "Lettino in più", "Pulisci il balcone", "Lascia la chiave sul tavolo", "Attenta: ospite in camera"].map(t => `<button type="button" data-chip-testo="dettagli|${esc(t)}">${esc(t)}</button>`).join("")}</div>
      <button class="big main" data-salva-dettagli>Salva i dettagli</button><div class="due">${p.dettagli ? `<button class="big undo" data-togli-dettagli>Togli i dettagli</button>` : `<span></span>`}<button class="big undo" data-whatsapp-cam="${esc(p.id)}">Manda su WhatsApp</button></div>
      <div class="floorlabel" style="margin-top:14px">Da fare sempre in ${esc(c.nome)}</div>
      <p class="muted small" style="margin:0 0 6px">Vale per tutte le pulizie di questa camera, non solo oggi (es. "balcone"). La signora lo vede ogni volta e deve spuntarlo prima di chiudere; la controllatrice lo verifica.</p>
      <input id="promemoriaCam" type="text" data-keep value="${esc(S.promemoria?.[p.camera] || "")}" placeholder="es. Balcone, dietro la TV">
      <button class="big undo" data-salva-promemoria="${esc(p.camera)}">Salva «da fare sempre»</button>`
    : (p.dettagli ? `<div class="pro-dett"><div class="pro-dett-t">${ICONA("nota")}<span>Dettagli di oggi</span></div><div class="pro-dett-x">${esc(p.dettagli)}</div></div>` : "");
  const ctrl = S.controlli[p.id];
  let controllo = "";
  if (p.stato === "fatta") {
    const righeVoto = [];
    if (ctrl?.voto != null) righeVoto.push(`Voto della controllatrice${ctrl.zonaControllatrice && ctrl.zonaControllatrice !== "proprietario" ? ` (Signora ${esc(S.zone[ctrl.zonaControllatrice]?.breve || "")})` : ""}: <b>${ctrl.voto}</b>${ctrl.nota ? " · " + esc(ctrl.nota) : ""}${ctrl.nonFatte?.length ? ` · non fatto: ${esc(ctrl.nonFatte.join(", "))}` : ""}`);
    if (ctrl?.votoProprietario != null) righeVoto.push(`Controllo di ${esc(ctrl.proprietario || "proprietario")}: <b>${ctrl.votoProprietario}</b>${ctrl.notaProprietario ? " · " + esc(ctrl.notaProprietario) : ""}${ctrl.nonFatteProprietario?.length ? ` · non fatto: ${esc(ctrl.nonFatteProprietario.join(", "))}` : ""}`);
    const nonCorr = L.controlloNonCorrisponde(ctrl, S.regole);
    const votoFinale = L.votoCheConta(ctrl);
    const fascia = votoFinale != null ? L.fasciaVoto(S.regole, votoFinale) : null;
    controllo = `<div class="floorlabel" style="margin-top:12px">Controllo</div>
      ${righeVoto.length ? `<div class="note ${nonCorr ? "warn" : "info"}">${righeVoto.join("<br>")}${nonCorr ? "<br><b>Non corrisponde</b>: la controllatrice perde il bonus di questa settimana." : ""}${fascia ? `<br>Paga di questa pulizia: ${fascia.perc}% → <b>${eur(L.importoFinale({ ...p, voto: votoFinale }, S.regole))}</b>${fascia.richiamo ? " · richiamo" : ""}` : ""}</div>` : `<p class="muted small" style="margin:0">Nessun voto ancora.</p>`}
      ${proprietario() ? `<button class="big undo" data-controlla-prop="${esc(p.id)}">${ctrl?.votoProprietario != null ? "Rifai il tuo controllo" : "Fai il tuo controllo (voto)"}</button>` : ""}
      ${sonoControllatrice() && p.zona !== S.utente.zona ? `<button class="big undo" data-controlla="${esc(p.id)}">${ctrl?.voto != null ? "Cambia il voto" : "Dai il voto a questa camera"}</button>` : ""}`;
  }
  return `<h3>${esc(c.nome)}</h3><div class="muted">${esc(L.dataLunga(p.data))}${p.ospite ? " · " + esc(p.ospite) : ""}${p.persone ? ` · ${p.persone} ${p.persone === 1 ? "persona" : "persone"}` : ""}</div>
    <span class="kind">${esc(p.titolo)}</span>${p.partenza ? `<span class="kind arrivo">Parte ${esc(L.GIORNI[L.giornoSettimana(p.data)])} ${L.giornoDelMese(p.data)}</span>` : ""}${p.arrivo ? `<span class="kind arrivo">Arriva ${esc(L.GIORNI[L.giornoSettimana(p.data)])} ${L.giornoDelMese(p.data)}</span>` : ""}${!addetta() || p.stato === "fatta" ? `<span class="kind money">${eur(p.importo)}</span>` : ""}
    ${(!p.partenza && p.parteIl && p.parteIl > p.data) || (!p.arrivo && p.prossimoArrivo) ? `<p class="muted small" style="margin:6px 0 0">${!p.partenza && p.parteIl && p.parteIl > p.data ? `Resta fino a <b>${esc(giornoParlato(p.parteIl))}</b>` : ""}${!p.partenza && p.parteIl && p.parteIl > p.data && !p.arrivo && p.prossimoArrivo ? " · " : ""}${!p.arrivo && p.prossimoArrivo ? `Prossimo arrivo <b>${esc(giornoParlato(p.prossimoArrivo))}</b>${p.prossimoNome ? ` (${esc(p.prossimoNome)})` : ""}` : ""}</p>` : ""}
    ${promemoriaCamera(p.camera).length && !proprietario() ? `<div class="note info">Sempre in ${esc(c.nome)}: <b>${esc(promemoriaCamera(p.camera).join(" · "))}</b></div>` : ""}
    ${dettagli}
    ${p.istruzioni ? `<div class="note">${esc(p.istruzioni)}</div>` : ""}
    ${rif && c.tipo === "casa" ? `<div class="note">🗑 Stasera fuori: ${esc(rif.cosa.toUpperCase())}</div>` : ""}
    ${passi.length ? `<ol class="steps">${passi.map((x, i) => `<li><b>${i + 1}</b><span>${esc(x)}</span></li>`).join("")}</ol>` : ""}
    ${p.stato === "da_fare" && p.nota ? `<div class="note info">${esc(p.nota)}</div>` : ""}
    ${stato}${controllo}${chiPuo}`;
}

function foglioSoggiorno(f) {
  const s = f.id ? S.soggiorni[f.id] : null;
  const d = s || { camera: f.camera, inizio: f.giorno, fine: L.aggiungiGiorni(f.giorno, L.giornoSettimana(f.giorno) === 0 ? 5 : L.giornoSettimana(f.giorno) < 5 ? 5 - L.giornoSettimana(f.giorno) : 7), nome: "", tipo: "ferr", persone: 1, nota: "", notaPrivata: "" };
  const c = camera(d.camera);
  const mod = puoModificare();
  const nomi = [...new Set(soggiorniLista().map(x => x.nome).filter(n => n && n !== "?"))].sort();
  return `<h3>${esc(c.nome)}</h3><div class="muted">${s ? "Cambia il soggiorno" : "Nuovo arrivo"} · la notte della partenza non si conta</div>
    <form id="formSog">
      <div class="campo"><label for="sNome">Chi c'è (nome o ditta)</label><input id="sNome" type="text" list="nomiNoti" value="${esc(d.nome)}" placeholder="es. Manna" ${mod ? "" : "disabled"} required><datalist id="nomiNoti">${nomi.map(n => `<option value="${esc(n)}">`).join("")}</datalist></div>
      <div class="due"><div class="campo"><label for="sInizio">Arriva il</label><input id="sInizio" type="date" value="${d.inizio}" ${mod ? "" : "disabled"} required></div><div class="campo"><label for="sFine">Parte il</label><input id="sFine" type="date" value="${d.fine}" ${mod ? "" : "disabled"} required></div></div>
      <div class="due"><div class="campo"><label for="sTipo">Tipo</label><select id="sTipo" ${mod ? "" : "disabled"}>${Object.entries(TIPI_OSPITE).map(([k, t]) => `<option value="${k}" ${d.tipo === k ? "selected" : ""}>${esc(t.nome)}</option>`).join("")}</select></div><div class="campo"><label for="sPers">Persone</label><input id="sPers" type="number" min="1" max="10" value="${d.persone || 1}" ${mod ? "" : "disabled"}></div></div>
      <div class="campo"><label for="sSup">Supplemento per ogni pulizia (€) — ospite impegnativo</label><input id="sSup" type="number" min="0" step="0.5" value="${d.supplemento || 0}" ${mod ? "" : "disabled"}></div>
      <div class="campo"><label for="sNota">Istruzioni per le signore (le vedono)</label><input id="sNota" type="text" value="${esc(d.nota || "")}" placeholder="es. asciugamani doppi, lettino in più" ${mod ? "" : "disabled"}></div>
      <div class="campo"><label for="sPriv">Nota privata (solo proprietari: telefoni, prezzi…)</label><input id="sPriv" type="text" value="${esc(d.notaPrivata || "")}" ${mod ? "" : "disabled"}></div>
      ${mod ? `<button class="big main" type="submit">Salva</button>` : ""}
    </form>
    ${s && mod ? `<div class="due" style="margin-top:10px"><button class="big undo" data-sog-azione="parteoggi">Parte oggi</button><button class="big undo" data-sog-azione="elimina">Non è venuto (elimina)</button></div>` : ""}`;
}

// ---------------------------------------------------------------------------
//  "Dimmi il prospetto": si scrive o si detta chi arriva, l'app capisce con regole fisse
//  e fa controllare tutto prima di salvare. Niente intelligenza artificiale.
// ---------------------------------------------------------------------------
function bottoniProspetto() {
  return `<section class="card dt-pulsanti"><h2 style="margin:0">Compila il prospetto in un attimo</h2><p class="muted small" style="margin:4px 0 0">Scrivi (o detta col microfono della tastiera) chi arriva e quando, carica il file Excel di papà, oppure ripeti la settimana scorsa. Le pulizie si creano da sole.</p>
    <button class="big main" data-dettatura>🗣️ Dimmi il prospetto</button>
    <div class="due" style="margin-top:0"><label class="big undo" style="display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;margin-top:10px">📄 Foglio di papà<input class="fileFoglio" type="file" accept=".xlsx,.xls,.xlsm" hidden></label><button class="big undo" data-dettatura-copia>🔁 Come la settimana scorsa</button></div>
    <p class="muted small" style="margin:10px 0 0">Oppure tocca una casella vuota del tabellone per segnare un arrivo, tocca una striscia per cambiarla.</p></section>`;
}
function statoDettatura() {
  if (!S.dett) S.dett = { testo: "", base: settimanaBaseDefault(L.oggiISO()), scelte: {}, comportamenti: {} };
  return S.dett;
}
function analizzaDettatura(f) {
  const d = statoDettatura();
  const ctx = { oggi: L.oggiISO(), base: d.base, soggiorni: soggiorniLista() };
  let ris;
  if (f.copia) ris = { righe: copiaSettimanaScorsa(ctx), nonCapito: [], base: d.base };
  else ris = capisciProspetto(d.testo, ctx);
  for (const r of ris.righe) {
    if (d.scelte[r.firma] != null) r.scelto = d.scelte[r.firma];
    if (d.comportamenti[r.firma]) r.comportamento = d.comportamenti[r.firma];
  }
  return ris;
}
function testoAzioneRiga(r) {
  const n = (a, b) => L.giorniTra(a, b);
  const G = L.dataGiornoLungo;
  const periodo = (a, b) => `${G(a)} → ${G(b)} (${n(a, b)} ${n(a, b) === 1 ? "notte" : "notti"})`;
  if (r.azione === "togli") return `Tolgo ${r.esistenti.map(e => `${e.nome} (${G(e.inizio)} → ${G(e.fine)})`).join(", ")}`;
  if (r.azione === "accorcia") return `Parte prima: ${G(r.fine)} invece di ${G(r.esistente.fine)}`;
  if (r.azione === "prolunga") return `Resta fino a ${G(r.fine)} (prima partiva ${G(r.esistente.fine)})`;
  if (r.azione === "aggiorna") return `Cambio: ${periodo(r.esistente.inizio, r.esistente.fine)} diventa ${periodo(r.inizio, r.fine)}`;
  if (r.azione === "niente") return "Niente da cambiare";
  return `Arriva ${G(r.inizio)} → parte ${G(r.fine)} (${n(r.inizio, r.fine)} ${n(r.inizio, r.fine) === 1 ? "notte" : "notti"})`;
}
function anteprimaDettatura(ris, f) {
  const righe = ris.righe, scelte = righe.filter(r => r.scelto && r.azione !== "niente").length;
  if (!righe.length && !ris.nonCapito.length) return `<p class="muted" style="margin:8px 0 0">${f.copia ? "Non c'è niente da copiare: le camere della settimana scelta sono già segnate (o la settimana scorsa erano vuote)." : "Appena scrivi, qui ti faccio vedere cosa ho capito."}</p>`;
  const riga = (r) => {
    const cls = r.azione === "niente" ? "off" : (r.dubbio || (r.motivi && r.motivi.length) ? "warn" : r.azione === "togli" ? "ko" : "ok");
    const persone = r.azione === "togli" || r.azione === "niente" ? "" : ` · ${r.persone} ${r.persone === 1 ? "persona" : "persone"}`;
    const tipo = r.azione === "togli" || r.azione === "niente" ? "" : ` <span class="chip">${esc(TIPI_OSPITE[r.tipo]?.nome || r.tipo)}</span>`;
    const confl = r.conflitti && r.conflitti.length && r.azione === "nuovo" ? `<br><span style="color:var(--warn)">In ${esc(camera(r.camera).nome)} c'è già ${esc(r.conflitti.map(c => `${c.nome} (${L.dataMedia(c.inizio)} → ${L.dataMedia(c.fine)})`).join(", "))}:</span> <select data-dett-comp="${esc(r.firma)}" style="min-height:36px;padding:4px 8px"><option value="sostituisci" ${r.comportamento === "sostituisci" ? "selected" : ""}>metto ${esc(r.nome)} al suo posto</option><option value="insieme" ${r.comportamento === "insieme" ? "selected" : ""}>li lascio tutti e due</option></select>` : "";
    return `<label class="row dt-riga ${cls}" style="grid-template-columns:auto 1fr;cursor:pointer;align-items:start"><input type="checkbox" data-dett-scelta="${esc(r.firma)}" ${r.scelto ? "checked" : ""} ${r.azione === "niente" ? "disabled" : ""} style="width:24px;height:24px;margin-top:2px">
      <span><b>${esc(camera(r.camera).nome)}</b>${r.azione === "togli" ? "" : ` · <b>${esc(r.nome)}</b>`}${persone}${tipo}
      <br><span class="${r.azione === "togli" ? "" : "muted"}">${esc(testoAzioneRiga(r))}</span>
      ${(r.assunti || []).map(a => `<br><span style="color:var(--wip);font-weight:600">${esc(a)}</span>`).join("")}
      ${(r.motivi || []).map(m => `<br><span style="color:var(--todo);font-weight:700">? ${esc(m)}</span>`).join("")}
      ${confl}
      ${r.nota ? `<br><span class="muted">📝 per le signore: ${esc(r.nota)}</span>` : ""}${r.notaPrivata ? `<br><span class="muted">🔒 ${esc(r.notaPrivata)}</span>` : ""}
      ${f.copia ? "" : `<br><span class="muted small">hai scritto: «${esc(r.testo)}»</span>`}</span></label>`;
  };
  return `<div class="floorlabel" style="margin-top:12px">${f.copia ? "Ti propongo" : "Ho capito così"} <span>${scelte} da salvare</span></div>
    <div class="rows">${righe.map(riga).join("")}</div>
    ${ris.nonCapito.length ? `<div class="avviso" style="margin-top:10px">Non ho capito queste righe (manca il nome della camera?):<br>${ris.nonCapito.map(t => `«${esc(t)}»`).join("<br>")}</div>` : ""}`;
}
function foglioDettatura(f) {
  const d = statoDettatura();
  const oggi = L.oggiISO(), questa = L.lunediDi(oggi), prossima = L.aggiungiGiorni(questa, 7), dopo = L.aggiungiGiorni(questa, 14);
  const etich = (b) => `${L.giornoDelMese(b)}–${L.giornoDelMese(L.aggiungiGiorni(b, 6))} ${L.MESI[L.daISO(L.aggiungiGiorni(b, 6)).getUTCMonth()].slice(0, 3)}`;
  const chip = (b, nome) => `<button type="button" aria-pressed="${d.base === b}" data-dett-base="${b}">${nome}<small>${etich(b)}</small></button>`;
  const ris = analizzaDettatura(f);
  const scelte = ris.righe.filter(r => r.scelto && r.azione !== "niente").length;
  const parla = ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) ? `<button type="button" class="btnsm ghost" data-dett-parla>🎤 Parla</button>` : "";
  return `<h3>${f.copia ? "Come la settimana scorsa" : "Dimmi il prospetto"}</h3>
    <div class="muted">${f.copia ? "Per le camere ancora vuote ripeto l'ospite della settimana prima, spostato di una settimana. Togli la spunta a chi non torna." : "Scrivi o detta chi arriva, in quale camera e quando: una riga per camera. Io capisco e ti faccio controllare prima di salvare."}</div>
    <div class="floorlabel" style="margin-top:10px">Di che settimana parliamo?</div>
    <div class="dt-sett">${chip(questa, "Questa")}${chip(prossima, "Prossima")}${chip(dopo, "Quella dopo")}</div>
    ${f.copia ? "" : `<div class="campo"><label for="dtTesto">Cosa mi dici</label><textarea id="dtTesto" data-keep rows="5" placeholder="Salvatore: Manna, 2 persone, da lunedì a venerdì
Aurora: Palazzo dal 12 al 16
Alba: Fondamenta tutto novembre
Michele: libera
Nicole: Castaldi parte giovedì">${esc(d.testo)}</textarea></div>
    <div class="dt-azioni">${parla}<button type="button" class="btnsm ghost" data-dett-incolla>📋 Incolla</button><button type="button" class="btnsm ghost" data-dett-pulisci>Pulisci</button></div>
    <p class="muted small" style="margin:6px 0 0">Sul telefono: tocca la casella e poi il microfono 🎤 della tastiera, e parla come parleresti a papà.</p>`}
    <div id="dtAnteprima">${anteprimaDettatura(ris, f)}</div>
    <button class="big main" data-dett-salva ${scelte && !S.attesa ? "" : "disabled style='opacity:.5'"}>${S.attesa ? "Salvo…" : `Salva nel prospetto (${scelte})`}</button>
    ${f.copia ? "" : `<details style="margin-top:12px"><summary>Come si scrive (esempi)</summary><div class="note info" style="white-space:pre-line;margin-top:6px">Salvatore: Manna, 2 persone, da lunedì a venerdì
Aurora: Palazzo dal 12 al 16 ottobre
Alba: Fondamenta tutto novembre
Lella: Rahhal da domenica sera a venerdì (asciugamani doppi)
Michele: libera   → tolgo chi c'era quella settimana
Nicole: Castaldi parte giovedì   → accorcio il soggiorno
Tramonto: resta fino a domenica   → allungo il soggiorno
Fenicotteri: come la settimana scorsa
Via Zara piano terra: D'Agostino, 3 operai, tutto il mese
Se non dici i giorni metto da lunedì a venerdì; se non dici il nome metto l'ultimo ospite di quella camera. Controlla sempre l'anteprima.</div></details>
    <details style="margin-top:8px"><summary>Hai una foto del prospetto di papà? Fattela leggere da un'intelligenza artificiale gratuita</summary><div class="note info" style="margin-top:6px">1) Tocca <b>Copia la richiesta</b>. 2) Apri Claude (gratis, app o claude.ai) oppure ChatGPT o Gemini, incolla la richiesta e aggiungi la <b>foto</b> del prospetto. 3) Copia la risposta e incollala qui sopra con <b>Incolla</b>: l'app la capisce da sola. L'app resta gratuita e non dipende da nessuna IA: è solo un aiuto per leggere la foto.</div><button class="big undo" data-dett-copia-ia>Copia la richiesta per l'IA</button></details>`}`;
}
function aggiornaAnteprimaDettatura(f) {
  const box = $("#dtAnteprima"); if (!box) return;
  const ris = analizzaDettatura(f);
  box.innerHTML = anteprimaDettatura(ris, f);
  const scelte = ris.righe.filter(r => r.scelto && r.azione !== "niente").length;
  const b = $("[data-dett-salva]"); if (b) { b.textContent = `Salva nel prospetto (${scelte})`; b.disabled = !scelte; b.style.opacity = scelte ? "" : ".5"; }
  collegaAnteprimaDettatura(f);
}
function collegaAnteprimaDettatura(f) {
  const d = statoDettatura();
  document.querySelectorAll("[data-dett-scelta]").forEach(c => c.onchange = () => { d.scelte[c.dataset.dettScelta] = c.checked; aggiornaAnteprimaDettatura(f); });
  document.querySelectorAll("[data-dett-comp]").forEach(s => s.onchange = () => { d.comportamenti[s.dataset.dettComp] = s.value; });
}
function aggiungiTestoDettatura(f, testo) {
  const d = statoDettatura(); const t = $("#dtTesto");
  const attuale = (t ? t.value : d.testo).replace(/\s+$/, "");
  d.testo = (attuale ? attuale + "\n" : "") + String(testo || "").trim();
  if (t) { t.value = d.testo; t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
  aggiornaAnteprimaDettatura(f);
}
let riconoscimento = null;
function parlaDettatura(f) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const b = $("[data-dett-parla]");
  if (!SR) { toast("Tocca la casella e usa il microfono 🎤 della tastiera."); return; }
  if (riconoscimento) { try { riconoscimento.stop(); } catch (e) {} riconoscimento = null; return; }
  try {
    const rec = new SR(); riconoscimento = rec;
    rec.lang = "it-IT"; rec.interimResults = false; rec.maxAlternatives = 1; rec.continuous = false;
    if (b) { b.textContent = "🎙️ Ti ascolto… parla"; b.classList.add("rec"); }
    rec.onresult = (e) => { const t = Array.from(e.results).map(r => r[0].transcript).join(" "); if (t) aggiungiTestoDettatura(f, t); };
    rec.onerror = () => toast("Non riesco a sentirti da qui: tocca la casella e usa il microfono 🎤 della tastiera.");
    rec.onend = () => { riconoscimento = null; const bb = $("[data-dett-parla]"); if (bb) { bb.textContent = "🎤 Parla"; bb.classList.remove("rec"); } };
    rec.start();
  } catch (e) { riconoscimento = null; toast("Tocca la casella e usa il microfono 🎤 della tastiera."); }
}
async function incollaDettatura(f) {
  try { const t = await navigator.clipboard.readText(); if (t && t.trim()) { aggiungiTestoDettatura(f, t); return; } toast("Negli appunti non c'è niente da incollare."); }
  catch (e) { toast("Tieni premuto dentro la casella e scegli «Incolla»."); $("#dtTesto")?.focus(); }
}
async function copiaRichiestaIA() {
  const testo = richiestaPerIA();
  try { await navigator.clipboard.writeText(testo); toast("Richiesta copiata: incollala in Claude (o ChatGPT) insieme alla foto."); }
  catch (e) { apriFoglio({ tipo: "info", titolo: "Richiesta per l'IA", sotto: "Copiala a mano e incollala insieme alla foto", testo }); }
}
async function salvaDettatura(f) {
  if (S.attesa) return;
  const ris = analizzaDettatura(f);
  const righe = ris.righe.filter(r => r.scelto && r.azione !== "niente");
  if (!righe.length) { toast("Non c'è niente da salvare."); return; }
  S.attesa = true; disegnaFoglio();
  try {
    const ops = [], adesso = S.db.adesso(), da = S.utente.nome || "";
    let n = 0;
    righe.forEach((r, i) => {
      if (r.azione === "togli") { for (const e of r.esistenti) ops.push({ tipo: "cancella", coll: "soggiorni", id: e.id }); n += r.esistenti.length; return; }
      if (r.azione === "accorcia" || r.azione === "prolunga") { ops.push({ tipo: "aggiorna", coll: "soggiorni", id: r.esistente.id, dati: { fine: r.fine, mesi: mesiCoperti(r.inizio, r.fine), modificato: adesso, da } }); n++; return; }
      if (r.azione === "aggiorna") { ops.push({ tipo: "aggiorna", coll: "soggiorni", id: r.esistente.id, dati: { inizio: r.inizio, fine: r.fine, persone: r.persone || 1, tipo: r.tipo, ...(r.nota ? { nota: r.nota } : {}), ...(r.notaPrivata ? { notaPrivata: r.notaPrivata } : {}), mesi: mesiCoperti(r.inizio, r.fine), modificato: adesso, da } }); n++; return; }
      if (r.conflitti && r.comportamento === "sostituisci") for (const c of r.conflitti) ops.push({ tipo: "cancella", coll: "soggiorni", id: c.id });
      const id = `dt_${r.camera}_${r.inizio}_${Date.now().toString(36)}${i}`;
      ops.push({ tipo: "salva", coll: "soggiorni", id, merge: false, dati: { camera: r.camera, inizio: r.inizio, fine: r.fine, nome: r.nome, tipo: r.tipo, persone: r.persone || 1, supplemento: 0, nota: r.nota || "", notaPrivata: r.notaPrivata || "", dubbio: !!r.dubbio, motivi: r.motivi || [], testoOriginale: r.testo || "", origine: r.copia ? "copia" : "dettatura", mesi: mesiCoperti(r.inizio, r.fine), modificato: adesso, da } });
      n++;
    });
    await S.db.scrivi(ops);
    const base = ris.base || statoDettatura().base;
    S.dett = { testo: "", base, scelte: {}, comportamenti: {} };
    S.attesa = false; chiudiFoglio();
    S.vista = "prospetto"; S.board = { modo: "settimana", inizio: base }; disegna();
    toast(`Prospetto aggiornato: ${n} ${n === 1 ? "cambiamento" : "cambiamenti"}. Le pulizie si aggiornano da sole.`);
  } catch (e) { S.attesa = false; disegnaFoglio(); erroreScrittura(e); }
}

function foglioNota(f) {
  const n = f.id ? S.note[f.id] : null;
  const mod = puoModificare();
  if (n && !mod) return `<h3>Nota</h3><div class="muted">${esc(L.dataLunga(n.data))} · ${esc(n.camera ? camera(n.camera).nome : "Generale")}</div><div class="note info">${esc(n.testo)}</div>`;
  const d = n || { data: f.giorno || L.oggiISO(), camera: f.camera || "", testo: "", privata: false };
  return `<h3>${n ? "Nota" : "Nuova nota"}</h3>
    <form id="formNota">
      <div class="due"><div class="campo"><label for="nData">Giorno</label><input id="nData" type="date" value="${d.data}" required></div><div class="campo"><label for="nCam">Camera</label><select id="nCam"><option value="">Generale</option>${S.camere.map(c => `<option value="${c.id}" ${d.camera === c.id ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select></div></div>
      <div class="campo"><label for="nTesto">Testo</label><textarea id="nTesto" required>${esc(d.testo)}</textarea></div>
      <div class="scelte"><button type="button" aria-pressed="${!d.privata}" data-priv="0">La vedono tutti</button><button type="button" aria-pressed="${!!d.privata}" data-priv="1">Privata (solo proprietari)</button></div>
      <button class="big main" type="submit">Salva</button>
    </form>${n ? `<button class="big undo" data-nota-elimina>Elimina la nota</button>` : ""}`;
}

function foglioNuovoLavoro(f) {
  return `<h3>Lavoro extra</h3><div class="muted">Un lavoro in più, fuori dalle regole (trapuntine, condizionatori, tende…)</div>
    <form id="formLavoro">
      <div class="campo"><label for="wCam">Camera</label><select id="wCam">${S.camere.map(c => `<option value="${c.id}" ${f.camera === c.id ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select></div>
      <div class="campo"><label for="wTit">Cosa fare</label><input id="wTit" type="text" placeholder="es. Lavare le tende" required></div>
      <div class="due"><div class="campo"><label for="wData">Giorno</label><input id="wData" type="date" value="${f.giorno || S.giorno}" required></div><div class="campo"><label for="wImp">Compenso (€)</label><input id="wImp" type="number" min="0" step="0.5" value="5" required></div></div>
      <button class="big main" type="submit">Aggiungi</button>
    </form>`;
}

// ---------------------------------------------------------------------------
//  Collegamento dei bottoni
// ---------------------------------------------------------------------------
function collega() {
  document.querySelectorAll("[data-prova]").forEach(b => b.onclick = () => { const [r, z, n] = b.dataset.prova.split("|"); S.db.entraProva(r, z || null, n); });
  const form = $("#formAccesso");
  if (form) form.onsubmit = async (e) => {
    e.preventDefault();
    let nome = $("#inNome").value.trim().toLowerCase(), pass = $("#inPass").value;
    S.nomeAccesso = nome;
    if (!nome.includes("@")) nome = nome.replace(/\s+/g, "") + "@" + (window.DOMINIO_ACCESSO || "stanzericci.app");
    S.attesa = true; S.erroreAccesso = ""; disegna();
    try { await S.db.entra(nome, pass); }
    catch (err) { S.erroreAccesso = testoErroreAccesso(err); }
    S.attesa = false; disegna();
  };
  document.querySelectorAll("[data-vista]").forEach(b => b.onclick = () => { S.vista = b.dataset.vista; disegna(); });
  document.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { S.giorno = b.dataset.g; disegna(); });
  document.querySelectorAll("[data-sett]").forEach(b => b.onclick = () => { S.settimana = L.aggiungiGiorni(S.settimana, 7 * Number(b.dataset.sett)); S.giorno = S.settimana; disegna(); });
  document.querySelectorAll("[data-pul]").forEach(b => b.onclick = () => apriFoglio({ tipo: "pulizia", id: b.dataset.pul }));
  document.querySelectorAll("[data-fatta]").forEach(b => b.onclick = () => segnaFatta(b.dataset.fatta));
  document.querySelectorAll("[data-problema]").forEach(b => b.onclick = () => apriFoglio({ tipo: "pulizia", id: b.dataset.problema, apriMotivo: "problema" }));
  // INIZIA apre la schermata grande con tutti i dettagli; da lì si preme "HO CAPITO, COMINCIO!"
  document.querySelectorAll("[data-inizia],[data-dettagli]").forEach(b => b.onclick = () => { const id = b.dataset.inizia || b.dataset.dettagli; if (S.pulizie[id]) apriFoglio({ tipo: "inizio", id }); });
  document.querySelectorAll("[data-msg-giorno]").forEach(b => b.onclick = () => apriFoglio({ tipo: "messaggio", giorno: b.dataset.msgGiorno }));
  document.querySelectorAll("[data-whatsapp-piano]").forEach(b => b.onclick = () => apriWhatsApp(testoPianoGiorno(b.dataset.whatsappPiano)));
  document.querySelectorAll("[data-whatsapp-finito]").forEach(b => b.onclick = () => { const iso = b.dataset.whatsappFinito; const n = pulizieDelGiorno(iso, S.utente.zona).length; apriWhatsApp(`✅ ${S.utente.nome || tagZona(S.utente.zona)}: tutte le camere di ${quandoEtichetta(iso).toLowerCase()} sono pulite (${n}/${n}).`, numeroWhatsApp()); });
  document.querySelectorAll("[data-salva-avvisi]").forEach(b => b.onclick = salvaAvvisi);
  document.querySelectorAll("[data-cerca-gruppo]").forEach(b => b.onclick = cercaGruppoTelegram);
  document.querySelectorAll("[data-prova-telegram]").forEach(b => b.onclick = async () => { await salvaAvvisi(); inviaTelegram(`✅ Prova riuscita: gli avvisi delle pulizie arrivano qui.\n${zoneOrdinate().map(z => tagZona(z.id)).join(" · ")}`, null, { manuale: true }); });
  document.querySelectorAll("[data-prova-piano]").forEach(b => b.onclick = async () => { await salvaAvvisi(); inviaTelegram(testoPianoGiorno(L.oggiISO()), null, { manuale: true }); });
  document.querySelectorAll("[data-stato-diretto]").forEach(b => b.onclick = () => { const [id, st] = b.dataset.statoDiretto.split("|"); const p = S.pulizie[id]; if (!p) return; if (st === "fatta") segnaFatta(id); else cambiaStato(p, st, ""); });
  document.querySelectorAll("[data-altri-giorni]").forEach(b => b.onclick = () => { S.mostraGiorni = !S.mostraGiorni; if (!S.mostraGiorni) { S.giorno = L.oggiISO(); S.settimana = L.lunediDi(S.giorno); } disegna(); });
  document.querySelectorAll("[data-controlla]").forEach(b => b.onclick = () => apriFoglio({ tipo: "controllo", id: b.dataset.controlla, modo: "collega" }));
  document.querySelectorAll("[data-controllatrice-sel]").forEach(e => e.onchange = () => { const chiave = L.settimanaCorrente(); const imp = { ...(S.impControlli || {}) }; imp.settimane = { ...(imp.settimane || {}), [chiave]: e.value }; imp.attuale = e.value; imp.settimana = chiave; S.db.salva("impostazioni", "controlli", imp).then(() => toast("Controllatrice cambiata")).catch(erroreScrittura); });
  document.querySelectorAll("[data-sog]").forEach(b => b.onclick = () => apriFoglio({ tipo: "soggiorno", id: b.dataset.sog }));
  document.querySelectorAll("[data-cella]").forEach(b => b.onclick = () => { if (!puoModificare()) return; const [cam, g] = b.dataset.cella.split("|"); const occ = L.ospiteIl(soggiorniLista(), cam, g); if (occ) apriFoglio({ tipo: "soggiorno", id: occ.id }); else apriFoglio({ tipo: "soggiorno", camera: cam, giorno: g }); });
  document.querySelectorAll("[data-nota]").forEach(b => b.onclick = () => apriFoglio({ tipo: "nota", id: b.dataset.nota }));
  document.querySelectorAll("[data-nuova-nota]").forEach(b => b.onclick = () => apriFoglio({ tipo: "nota", giorno: L.oggiISO() }));
  document.querySelectorAll("[data-nuovo-lavoro]").forEach(b => b.onclick = () => apriFoglio({ tipo: "nuovoLavoro", giorno: S.giorno }));
  document.querySelectorAll("[data-board]").forEach(b => b.onclick = () => { S.board.modo = b.dataset.board; if (S.board.modo !== "mese") S.board.inizio = L.lunediDi(S.board.inizio); disegna(); });
  document.querySelectorAll("[data-boardnav]").forEach(b => b.onclick = () => { const n = Number(b.dataset.boardnav); if (S.board.modo !== "mese") S.board.inizio = L.aggiungiGiorni(S.board.inizio, 7 * n); else { const d = L.daISO(L.primoDelMese(S.board.inizio)); d.setUTCMonth(d.getUTCMonth() + n); S.board.inizio = L.aISO(d); } caricaStorico(); disegna(); });
  document.querySelectorAll("[data-pay]").forEach(b => b.onclick = () => { const [z, k] = b.dataset.pay.split("|"); segnaPagata(z, k, true); });
  document.querySelectorAll("[data-unpay]").forEach(b => b.onclick = () => { const [z, k] = b.dataset.unpay.split("|"); segnaPagata(z, k, false); });
  document.querySelectorAll("[data-taglia]").forEach(b => b.onclick = () => { const [cam, t] = b.dataset.taglia.split("|"); const l = JSON.parse(JSON.stringify(S.listino)); l.taglia[cam] = t; salvaListino(l); });
  document.querySelectorAll("[data-listino]").forEach(i => i.onchange = () => { const l = JSON.parse(JSON.stringify(S.listino)); const v = Math.max(0, Number(i.value) || 0); const [a, b] = i.dataset.listino.split("."); if (b) l[a][b] = v; else l[a] = v; salvaListino(l); });
  document.querySelectorAll("[data-voto]").forEach(i => i.onchange = () => { const v = L.votiCompleti(S.regole); const k = i.dataset.voto; const n = Math.max(0, Number(i.value) || 0); const nuovi = JSON.parse(JSON.stringify(v)); if (k === "bonusControllatrice" || k === "penalitaRichiesta") nuovi[k] = n; else nuovi[k].perc = n; const r = { ...S.regole, voti: nuovi }; S.db.salva("impostazioni", "regole", r).then(() => toast("Regola salvata")).catch(erroreScrittura); });
  document.querySelectorAll("[data-regola]").forEach(b => b.onclick = () => { const [k, v] = b.dataset.regola.split("|"); const r = { ...S.regole, [k]: v === "1" }; S.db.salva("impostazioni", "regole", r).then(() => toast("Regola salvata")).catch(erroreScrittura); });
  document.querySelectorAll("[data-tema]").forEach(b => b.onclick = () => { S.tema = b.dataset.tema; localStorage.setItem("ricci_tema", S.tema); applicaTema(); disegna(); });
  document.querySelectorAll("[data-esci]").forEach(b => b.onclick = async () => { if (await chiedi("Vuoi uscire dall'app? Per rientrare servirà la password.", { si: "Sì, esco" })) S.db.esci(); });
  document.querySelectorAll("[data-esporta]").forEach(b => b.onclick = () => b.dataset.esporta === "xlsx" ? esportaExcel() : esportaTutto());
  document.querySelectorAll("[data-promemoria]").forEach(i => i.onchange = () => salvaPromemoria(i.dataset.promemoria, i.value));
  document.querySelectorAll("[data-come-signora]").forEach(b => b.onclick = () => entraComeSignora(b.dataset.comeSignora));
  document.querySelectorAll("[data-torna-gestione]").forEach(b => b.onclick = esciComeSignora);
  document.querySelectorAll("#fileFoglio, .fileFoglio").forEach(ff => ff.onchange = () => { if (ff.files && ff.files[0]) leggiFileExcel(ff.files[0]); });
  document.querySelectorAll("[data-dettatura]").forEach(b => b.onclick = () => { if (!puoModificare()) return; apriFoglio({ tipo: "dettatura" }); setTimeout(() => $("#dtTesto")?.focus(), 50); });
  document.querySelectorAll("[data-dettatura-copia]").forEach(b => b.onclick = () => { if (!puoModificare()) return; const d = statoDettatura(); d.scelte = {}; d.comportamenti = {}; apriFoglio({ tipo: "dettatura", copia: true }); });
  document.querySelectorAll("[data-scelta]").forEach(c => c.onchange = () => { const s = S.importazione?.ris.soggiorni[Number(c.dataset.scelta)]; if (s) { s.scelto = c.checked; disegna(); } });
  const sm = $("#sostMano"); if (sm) sm.onchange = () => { S.importazione.sostituisciMano = sm.checked; };
  document.querySelectorAll("[data-salva-foglio]").forEach(b => b.onclick = salvaImportazione);
  collegaPersone();
  document.querySelectorAll("[data-annulla-foglio]").forEach(b => b.onclick = () => { S.importazione = null; S.vista = "altro"; disegna(); });
  document.querySelectorAll("[data-azzera-prova]").forEach(b => b.onclick = async () => { if (await chiedi("Azzero i dati di prova?", { si: "Sì, azzera", pericolo: true })) S.db.azzeraProva(); });
}

function collegaFoglio() {
  const f = S.foglio; if (!f) return;
  document.querySelectorAll("[data-chiudi]").forEach(b => b.onclick = chiudiFoglio);
  if (f.tipo === "controllo") {
    document.querySelectorAll("[data-punto]").forEach(b => b.onclick = () => { f.punti = { ...(f.punti || {}) }; f.punti[b.dataset.punto] = !f.punti[b.dataset.punto]; const nota = $("#cNota")?.value; disegnaFoglio(); if (nota != null && $("#cNota")) $("#cNota").value = nota; });
    const sc = $("#salvaControllo"); if (sc) sc.onclick = () => salvaControllo(f);
    return;
  }
  document.querySelectorAll("[data-controlla]").forEach(b => b.onclick = () => apriFoglio({ tipo: "controllo", id: b.dataset.controlla, modo: "collega" }));
  document.querySelectorAll("[data-controlla-prop]").forEach(b => b.onclick = () => apriFoglio({ tipo: "controllo", id: b.dataset.controllaProp, modo: "proprietario" }));
  // frasi pronte: toccandole si aggiungono alla casella di testo indicata
  document.querySelectorAll("[data-chip-testo]").forEach(b => b.onclick = () => { const [id, testo] = b.dataset.chipTesto.split("|"); const t = document.getElementById(id); if (!t) return; t.value = (t.value.trim() ? t.value.replace(/\s+$/, "") + (/[.!?]$/.test(t.value.trim()) ? " " : ". ") : "") + testo; t.focus(); t.setSelectionRange(t.value.length, t.value.length); });
  if (f.tipo === "inizio") {
    const p = S.pulizie[f.id];
    document.querySelectorAll("[data-comincia]").forEach(b => b.onclick = () => { if (!p) return; cambiaStato(p, "in_corso", ""); toast(`Buon lavoro! Quando hai finito ${camera(p.camera).nome}, tocca la camera e premi "Ho finito".`); });
    document.querySelectorAll("[data-fatta-foglio]").forEach(b => b.onclick = () => segnaFatta(b.dataset.fattaFoglio));
    document.querySelectorAll("[data-stato-foglio]").forEach(b => b.onclick = () => { const [id, st] = b.dataset.statoFoglio.split("|"); const q = S.pulizie[id]; if (q) cambiaStato(q, st, ""); });
    document.querySelectorAll("[data-apri-motivo]").forEach(b => b.onclick = () => { const [id, st] = b.dataset.apriMotivo.split("|"); apriFoglio({ tipo: "pulizia", id, apriMotivo: st }); });
    return;
  }
  if (f.tipo === "dettatura") {
    const d = statoDettatura();
    const t = $("#dtTesto");
    let timer = null;
    if (t) t.oninput = () => { d.testo = t.value; clearTimeout(timer); timer = setTimeout(() => aggiornaAnteprimaDettatura(f), 250); };
    document.querySelectorAll("[data-dett-base]").forEach(b => b.onclick = () => { d.base = b.dataset.dettBase; d.scelte = {}; d.comportamenti = {}; disegnaFoglio(); });
    document.querySelectorAll("[data-dett-parla]").forEach(b => b.onclick = () => parlaDettatura(f));
    document.querySelectorAll("[data-dett-incolla]").forEach(b => b.onclick = () => incollaDettatura(f));
    document.querySelectorAll("[data-dett-pulisci]").forEach(b => b.onclick = () => { d.testo = ""; d.scelte = {}; d.comportamenti = {}; if (t) { t.value = ""; t.focus(); } aggiornaAnteprimaDettatura(f); });
    document.querySelectorAll("[data-dett-copia-ia]").forEach(b => b.onclick = copiaRichiestaIA);
    document.querySelectorAll("[data-dett-salva]").forEach(b => b.onclick = () => salvaDettatura(f));
    collegaAnteprimaDettatura(f);
    return;
  }
  if (f.tipo === "messaggio") {
    document.querySelectorAll("[data-salva-msg]").forEach(b => b.onclick = () => salvaMessaggio(f.giorno, $("#msgTesto").value.trim()));
    document.querySelectorAll("[data-whatsapp-msg]").forEach(b => b.onclick = () => { const t = $("#msgTesto").value.trim(); if (!t) { $("#msgTesto").focus(); return; } apriWhatsApp(testoMessaggioGiorno(f.giorno, t)); });
    document.querySelectorAll("[data-togli-msg]").forEach(b => b.onclick = async () => { if (await chiedi("Tolgo il messaggio di questo giorno?", { si: "Sì, togli", pericolo: true })) salvaMessaggio(f.giorno, ""); });
    return;
  }
  if (f.tipo === "pulizia") {
    const p = S.pulizie[f.id];
    document.querySelectorAll("[data-stato]").forEach(b => b.onclick = () => b.dataset.stato === "fatta" ? segnaFatta(p.id) : cambiaStato(p, b.dataset.stato, ""));
    document.querySelectorAll("[data-vai-inizio]").forEach(b => b.onclick = () => apriFoglio({ tipo: "inizio", id: b.dataset.vaiInizio }));
    const apriMotivo = (tipoMotivo, conFocus) => {
      const box = $("#boxMotivo"); if (!box) return; box.hidden = false; box.dataset.stato = tipoMotivo; f.motivoAperto = tipoMotivo;
      const scelte = tipoMotivo === "problema" ? ["Guasto", "Manca materiale", "Ospite in camera", "Camera molto sporca"] : ["Ospite in camera", "Camera chiusa", "Non serviva", "Non ho fatto in tempo"];
      $("#scelteMotivo").innerHTML = scelte.map(s => `<button type="button" data-motivo="${esc(s)}">${esc(s)}</button>`).join("");
      document.querySelectorAll("[data-motivo]").forEach(m => m.onclick = () => { const t = $("#nota"); t.value = (t.value.trim() ? t.value.replace(/\s+$/, "") + " · " : "") + m.dataset.motivo + " "; document.querySelectorAll("[data-motivo]").forEach(x => x.setAttribute("aria-pressed", x === m ? "true" : "false")); t.focus(); t.setSelectionRange(t.value.length, t.value.length); });
      $("#confermaMotivo").textContent = tipoMotivo === "problema" ? "Segnala il problema" : "Conferma: non fatta";
      $("#confermaMotivo").className = "big " + (tipoMotivo === "problema" ? "ko" : "skip");
      if (fotoPending && $("#fotoAnteprima")) $("#fotoAnteprima").innerHTML = `<img src="${fotoPending}" alt="" style="height:56px;border-radius:8px;vertical-align:middle"> pronta`;
      if (conFocus) $("#nota").focus();
    };
    document.querySelectorAll("[data-apri]").forEach(b => b.onclick = () => apriMotivo(b.dataset.apri, true));
    if (f.apriMotivo) { apriMotivo(f.apriMotivo, true); f.apriMotivo = null; }
    else if (f.motivoAperto) apriMotivo(f.motivoAperto, false); // ridisegno: la casella resta aperta
    const conf = $("#confermaMotivo");
    if (conf) conf.onclick = () => { const st = $("#boxMotivo").dataset.stato; const nota = $("#nota").value.trim(); if (st === "problema" && nota.length < 2 && !fotoPending) { $("#nota").focus(); return; } cambiaStato(p, st, nota); };
    const fi = $("#fotoInput");
    if (fi) fi.onchange = async () => { const file = fi.files && fi.files[0]; if (!file) return; $("#fotoAnteprima").textContent = "Preparo la foto…"; try { fotoPending = await rimpicciolisciFoto(file); $("#fotoAnteprima").innerHTML = `<img src="${fotoPending}" alt="" style="height:56px;border-radius:8px;vertical-align:middle"> pronta`; } catch (e) { console.error(e); $("#fotoAnteprima").textContent = "Non riesco a leggere la foto."; fotoPending = null; } };
    document.querySelectorAll("[data-salva-dettagli]").forEach(b => b.onclick = () => salvaDettagli(p, $("#dettagli").value.trim()));
    document.querySelectorAll("[data-salva-promemoria]").forEach(b => b.onclick = () => salvaPromemoria(b.dataset.salvaPromemoria, $("#promemoriaCam")?.value || ""));
    document.querySelectorAll("[data-whatsapp-cam]").forEach(b => b.onclick = () => apriWhatsApp(`📝 ${testoDettagliCamera({ ...p, dettagli: ($("#dettagli")?.value || p.dettagli || "").trim() })}`));
    document.querySelectorAll("[data-togli-dettagli]").forEach(b => b.onclick = () => salvaDettagli(p, ""));
    document.querySelectorAll("[data-vedi-foto]").forEach(b => b.onclick = async () => { b.textContent = "Carico…"; try { const f = await S.db.leggi("foto", p.id); if (!f) { toast("Foto non trovata"); return; } apriFoglio({ tipo: "foto", id: p.id, dati: f.dati, titolo: camera(p.camera).nome, sotto: `${L.dataLunga(p.data)}${f.ora ? " · " + L.oraBreve(f.ora) : ""}` }); } catch (e) { erroreScrittura(e); } });
    document.querySelectorAll("[data-cancella-pul]").forEach(b => b.onclick = async () => { if (await chiedi("Elimino questo lavoro?", { si: "Sì, elimina", pericolo: true })) S.db.cancella("pulizie", p.id).then(chiudiFoglio).catch(erroreScrittura); });
  }
  if (f.tipo === "soggiorno") {
    const form = $("#formSog");
    if (form) form.onsubmit = (e) => { e.preventDefault(); salvaSoggiorno(f); };
    document.querySelectorAll("[data-sog-azione]").forEach(b => b.onclick = () => azioneSoggiorno(f, b.dataset.sogAzione));
  }
  if (f.tipo === "nota") {
    let priv = f.id ? !!S.note[f.id]?.privata : false;
    document.querySelectorAll("[data-priv]").forEach(b => b.onclick = () => { priv = b.dataset.priv === "1"; document.querySelectorAll("[data-priv]").forEach(x => x.setAttribute("aria-pressed", (x.dataset.priv === "1") === priv ? "true" : "false")); });
    const form = $("#formNota");
    if (form) form.onsubmit = (e) => { e.preventDefault(); const d = { data: $("#nData").value, camera: $("#nCam").value || null, testo: $("#nTesto").value.trim(), privata: priv, da: S.utente.nome || S.utente.email || "" }; const id = f.id || `${d.data}_${Date.now().toString(36)}`; S.db.salva("note", id, d).then(() => { chiudiFoglio(); toast("Nota salvata"); }).catch(erroreScrittura); };
    document.querySelectorAll("[data-nota-elimina]").forEach(b => b.onclick = async () => { if (await chiedi("Elimino la nota?", { si: "Sì, elimina", pericolo: true })) S.db.cancella("note", f.id).then(chiudiFoglio).catch(erroreScrittura); });
  }
  if (f.tipo === "nuovoLavoro") {
    const form = $("#formLavoro");
    if (form) form.onsubmit = (e) => {
      e.preventDefault();
      const cam = camera($("#wCam").value), data = $("#wData").value;
      const id = `${data}_${cam.id}_x${Date.now().toString(36)}`;
      const d = { id, data, camera: cam.id, zona: cam.zona, tipo: "extra", titolo: $("#wTit").value.trim(), passi: [], ospite: L.ospiteIl(soggiorniLista(), cam.id, data)?.nome || "", importo: Number($("#wImp").value) || 0, stato: "da_fare", origine: "mano", creato: S.db.adesso(), da: S.utente.nome || "" };
      S.db.salva("pulizie", id, d, false).then(() => { chiudiFoglio(); toast("Lavoro aggiunto"); }).catch(erroreScrittura);
    };
  }
}

// ---------------------------------------------------------------------------
//  Avvisi alle signore: WhatsApp (testo pronto, un tocco) e Telegram (automatico)
//  WhatsApp non permette a un'app di scrivere da sola in un gruppo (serve il servizio
//  a pagamento per aziende): qui il messaggio arriva già scritto, tu scegli il gruppo e premi Invia.
//  Telegram invece ha i "bot" gratuiti: se in ⋯ → Avvisi si mettono il token e il gruppo,
//  l'app scrive da sola nel gruppo e tagga la signora della zona.
// ---------------------------------------------------------------------------
function tagZona(z) { const t = (S.avvisi?.tag || {})[z]; return t ? (t.startsWith("@") ? t : "@" + t) : `Signora ${S.zone[z]?.breve || z}`; }
function rigaCameraAvviso(p) {
  const c = camera(p.camera);
  let r = `• ${c.nome} — ${titoloLavoro(p)}`;
  if (p.ospite) r += ` (${p.ospite}${p.persone ? `, ${p.persone} ${p.persone === 1 ? "persona" : "persone"}` : ""})`;
  if (p.partenza) r += ` · PARTE ${L.GIORNI[L.giornoSettimana(p.data)].toUpperCase()}`; if (p.arrivo) r += ` · ARRIVA ${L.GIORNI[L.giornoSettimana(p.data)].toUpperCase()}`;
  if (!p.arrivo && p.prossimoArrivo) r += ` · prossimo arrivo ${L.dataGiornoLungo(p.prossimoArrivo)}`;
  const sempre = promemoriaCamera(p.camera); if (sempre.length) r += `\n   ↳ sempre: ${sempre.join(", ")}`;
  if (p.dettagli) r += `\n   ↳ ${p.dettagli}`;
  if (p.istruzioni) r += `\n   ↳ ${p.istruzioni}`;
  return r;
}
function testoPianoGiorno(iso) {
  const righe = [`🧹 Pulizie · ${L.dataLunga(iso)}`];
  const msg = messaggioDelGiorno(iso);
  if (msg) righe.push(`📣 ${msg.testo}`);
  for (const z of zoneOrdinate()) {
    const ls = pulizieDelGiorno(iso, z.id).filter(p => p.stato !== "fatta");
    if (!ls.length) continue;
    righe.push("", `${tagZona(z.id)} · ${ls.length} ${ls.length === 1 ? "camera" : "camere"}`);
    ls.forEach(p => righe.push(rigaCameraAvviso(p)));
  }
  return righe.join("\n");
}
function testoDettagliCamera(p) { return `${tagZona(p.zona)} · ${L.dataLunga(p.data)}\n${rigaCameraAvviso(p)}`; }
function testoMessaggioGiorno(iso, testo) { return `📣 ${L.dataLunga(iso)} · per tutte le signore\n${testo}`; }
function numeroWhatsApp() { return String(S.avvisi?.whatsapp || "").replace(/[^0-9]/g, ""); }
function apriWhatsApp(testo, numero) {
  const n = numero === undefined ? "" : String(numero || "").replace(/[^0-9]/g, "");
  const url = "https://wa.me/" + n + "?text=" + encodeURIComponent(testo);
  const w = window.open(url, "_blank", "noopener");
  if (!w) location.href = url;
}
// Telegram: manda un messaggio al gruppo (se configurato). Non blocca mai l'app se qualcosa va storto.
async function inviaTelegram(testo, tipo, { manuale = false } = {}) {
  const a = S.avvisi;
  if (!a || !a.token || !a.chat) { if (manuale) toast("Prima compila token e gruppo in ⋯ → Avvisi automatici."); return false; }
  if (!manuale && tipo && a[tipo] === false) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${encodeURIComponent(a.token)}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: a.chat, text: testo, disable_web_page_preview: true }) });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) { console.warn("telegram", j); if (manuale) toast("Telegram ha risposto: " + (j.description || "errore")); return false; }
    if (manuale) toast("Avviso mandato su Telegram ✓");
    return true;
  } catch (e) { console.warn("telegram", e); if (manuale) toast("Non riesco a raggiungere Telegram (rete?)."); return false; }
}
// Il piano del mattino: la prima volta che un proprietario apre l'app dopo le 7, parte da solo (se attivo)
let pianoMattinoInCorso = false;
async function pianoDelMattino() {
  const a = S.avvisi; const oggi = L.oggiISO();
  if (!a || !a.token || !a.chat || a.pianoMattina === false || !proprietario() || !S.caricati.pulizie || pianoMattinoInCorso) return;
  if (a.ultimoPiano === oggi) return;
  const ora = Number(new Date().toLocaleString("it-IT", { hour: "2-digit", hour12: false, timeZone: "Europe/Rome" }));
  if (ora < (Number(a.oraPiano) || 7)) return;
  if (!pulizieDelGiorno(oggi).length) return;
  pianoMattinoInCorso = true;
  try {
    await S.db.salva("impostazioni", "avvisi", { ultimoPiano: oggi }, true); // segno prima, così due telefoni non lo mandano due volte
    await inviaTelegram(testoPianoGiorno(oggi), "pianoMattina");
  } catch (e) { console.warn(e); } finally { pianoMattinoInCorso = false; }
}
// Chiede a Telegram in quali gruppi è stato messo il bot e fa scegliere quello giusto
async function cercaGruppoTelegram() {
  const token = ($("#avToken")?.value || "").trim(); const box = $("#gruppiTrovati");
  if (!token) { toast("Prima incolla il token del bot."); $("#avToken")?.focus(); return; }
  if (box) box.innerHTML = `<span class="muted small">Cerco…</span>`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/getUpdates`);
    const j = await r.json();
    if (!j.ok) { if (box) box.innerHTML = `<span class="muted small">Telegram dice: ${esc(j.description || "token non valido")}</span>`; return; }
    const trovati = {};
    for (const u of j.result || []) { const ch = u.message?.chat || u.my_chat_member?.chat || u.channel_post?.chat || u.edited_message?.chat; if (ch && ch.type !== "private") trovati[ch.id] = ch.title || String(ch.id); }
    const voci = Object.entries(trovati);
    if (!voci.length) { if (box) box.innerHTML = `<span class="muted small">Non vedo ancora gruppi: aggiungi il bot al gruppo delle signore (o scrivi un messaggio lì) e ripremi.</span>`; return; }
    if (voci.length === 1) { $("#avChat").value = voci[0][0]; toast(`Trovato: ${voci[0][1]}`); if (box) box.innerHTML = `<span class="muted small">Gruppo scelto: <b>${esc(voci[0][1])}</b>. Ora premi Salva.</span>`; return; }
    if (box) { box.innerHTML = voci.map(([id, t]) => `<button type="button" data-gruppo="${esc(id)}">${esc(t)}</button>`).join(""); box.querySelectorAll("[data-gruppo]").forEach(bt => bt.onclick = () => { $("#avChat").value = bt.dataset.gruppo; box.querySelectorAll("[data-gruppo]").forEach(x => x.setAttribute("aria-pressed", x === bt ? "true" : "false")); toast("Gruppo scelto: ora premi Salva"); }); }
  } catch (e) { console.warn(e); if (box) box.innerHTML = `<span class="muted small">Non riesco a raggiungere Telegram (rete?).</span>`; }
}
async function salvaAvvisi() {
  const v = id => ($("#" + id)?.value || "").trim();
  const dati = { ...(S.avvisi || {}), token: v("avToken"), chat: v("avChat"), whatsapp: v("avWa").replace(/[^0-9]/g, ""), oraPiano: Number(v("avOra")) || 7, tag: { ...(S.avvisi?.tag || {}) } };
  zoneOrdinate().forEach(z => { dati.tag[z.id] = v("avTag_" + z.id); });
  ["pianoMattina", "messaggio", "dettagli", "problema", "pulita"].forEach(k => { const el = $("#av_" + k); if (el) dati[k] = el.checked; });
  try { await S.db.salva("impostazioni", "avvisi", dati, false); toast("Avvisi salvati"); } catch (e) { erroreScrittura(e); }
}

// ---------------------------------------------------------------------------
//  Azioni (scrivono nei dati)
// ---------------------------------------------------------------------------
function erroreScrittura(e) { console.error(e); toast(e?.code === "permission-denied" ? "Non hai il permesso di fare questa modifica." : "Non sono riuscito a salvare. Riprova."); }
function testoErroreAccesso(err) {
  const c = err?.code || "";
  if (c.includes("wrong-password") || c.includes("invalid-credential") || c.includes("invalid-login")) return "Password sbagliata, oppure nome non trovato. Riprova.";
  if (c.includes("user-not-found") || c.includes("invalid-email")) return "Nome non trovato. Controlla come l'hai scritto.";
  if (c.includes("too-many-requests")) return "Troppi tentativi: aspetta qualche minuto.";
  if (c.includes("network")) return "Non c'è rete. Riprova quando torna il segnale.";
  return "Non sono riuscito a farti entrare. " + (err?.message || "");
}

let fotoPending = null;
// "HO FINITO": segna PULITA con avviso simpatico e il bottone "Ho sbagliato" per tornare indietro
async function segnaFatta(id) {
  const p = S.pulizie[id]; if (!p) return;
  const prima = p.stato;
  if (addetta() && !await confermaFinito(p)) return;
  cambiaStato(p, "fatta", "");
  const frasi = ["Bravissima!", "Ottimo lavoro!", "Grande!", "Perfetto!"];
  toast(`${frasi[Math.floor(Math.random() * frasi.length)]} ${camera(p.camera).nome} è pulita ✓`, { testo: "Ho sbagliato", fai: () => { cambiaStato(S.pulizie[p.id], prima === "fatta" ? "da_fare" : prima, ""); const t = $(".toast"); if (t) t.remove(); } });
  setTimeout(() => { const t = $(".toast"); if (t && /è pulita/.test(t.textContent)) t.remove(); }, 8000);
}
// "Sei sicura che tutto sia stato fatto al meglio?": le cose da fare sempre in quella camera + i dettagli di oggi,
// da spuntare una per una prima di chiudere la camera. Senza cose particolari resta solo la domanda.
function confermaFinito(p) {
  const c = camera(p.camera);
  const voci = L.richiesteDaVerificare(p, promemoriaCamera(p.camera));
  return new Promise((ok) => {
    const vecchio = $(".conferma"); if (vecchio) vecchio.remove();
    const el = document.createElement("div"); el.className = "conferma";
    el.innerHTML = `<div class="conferma-box chiusura" role="dialog"><div class="chiusura-t">${ICONA("spunta")}<span>Sei sicura che in <b>${esc(c.nome)}</b> tutto sia stato fatto al meglio?</span></div>
      ${voci.length ? `<p class="muted" style="margin:0 0 6px">Spunta una per una:</p><div class="chiusura-voci">${voci.map(v => `<label class="chiusura-voce"><input type="checkbox" data-voce="${esc(v.id)}"><span>${esc(v.testo)}${v.fissa ? ` <small>sempre in ${esc(c.nome)}</small>` : ` <small>oggi</small>`}</span></label>`).join("")}</div>` : ""}
      <button class="big ok" data-si ${voci.length ? "disabled" : ""}>${voci.length ? "Sì, ho fatto tutto ✓" : "Sì, è tutta a posto ✓"}</button><button class="big undo" data-no>Aspetta, controllo</button></div>`;
    document.body.appendChild(el);
    const bSi = el.querySelector("[data-si]");
    const aggiorna = () => { const tutte = [...el.querySelectorAll("[data-voce]")].every(x => x.checked); bSi.disabled = !tutte; bSi.style.opacity = tutte ? "" : ".55"; };
    el.querySelectorAll("[data-voce]").forEach(x => x.onchange = aggiorna); aggiorna();
    bSi.onclick = () => { if (bSi.disabled) return; el.remove(); ok(true); };
    el.querySelector("[data-no]").onclick = () => { el.remove(); ok(false); };
    el.onclick = (e) => { if (e.target === el) { el.remove(); ok(false); } };
  });
}
// Cose da fare sempre in una camera (solo proprietari): impostazioni/promemoria = { camera: "balcone, dietro la TV" }
async function salvaPromemoria(cameraId, testo) {
  if (!proprietario()) return;
  const nuovo = { ...(S.promemoria || {}) }; if (testo.trim()) nuovo[cameraId] = testo.trim(); else delete nuovo[cameraId];
  S.promemoria = nuovo; disegna();
  try { await S.db.salva("impostazioni", "promemoria", nuovo); toast(testo.trim() ? `Salvato: in ${camera(cameraId).nome} si fa sempre anche «${testo.trim()}».` : `Tolto il promemoria di ${camera(cameraId).nome}`); }
  catch (e) { erroreScrittura(e); }
}
// Dettagli del giorno di una camera (solo proprietari): restano sulla pulizia, il piano automatico non li tocca
async function salvaDettagli(p, testo) {
  if (!p || !proprietario()) return;
  const patch = { dettagli: testo, dettagliDa: S.utente.nome || S.utente.login || "", dettagliOra: S.db.adesso() };
  Object.assign(S.pulizie[p.id], patch); disegna();
  try { await S.db.aggiorna("pulizie", p.id, patch); chiudiFoglio(); toast(testo ? `Dettagli salvati: la signora li vede subito.` : "Dettagli tolti"); if (testo) inviaTelegram(`📝 ${testoDettagliCamera({ ...p, ...patch })}`, "dettagli"); }
  catch (e) { erroreScrittura(e); }
}
// Messaggio del giorno alle signore (impostazioni/messaggi): una voce per giorno, si tengono gli ultimi 60 giorni
async function salvaMessaggio(giorno, testo) {
  if (!proprietario()) return;
  const nuovo = {}; const limite = L.aggiungiGiorni(L.oggiISO(), -60);
  for (const [k, v] of Object.entries(S.messaggi || {})) if (k >= limite && v && typeof v === "object") nuovo[k] = v;
  if (testo) nuovo[giorno] = { testo, da: S.utente.nome || S.utente.login || "", ora: S.db.adesso() }; else delete nuovo[giorno];
  S.messaggi = nuovo; disegna();
  try { await S.db.salva("impostazioni", "messaggi", nuovo, false); chiudiFoglio(); toast(testo ? "Messaggio mandato alle signore" : "Messaggio tolto"); if (testo) inviaTelegram(testoMessaggioGiorno(giorno, testo), "messaggio"); }
  catch (e) { erroreScrittura(e); }
}
async function cambiaStato(p, stato, nota) {
  const adesso = S.db.adesso();
  const patch = { stato, nota: nota || "", ora: (stato === "da_fare" || stato === "in_corso") ? null : adesso, segnatoDa: S.utente.nome || S.utente.email || S.utente.uid };
  if (stato === "in_corso") patch.inizio = adesso;
  if (stato === "da_fare") patch.inizio = null;
  if (stato === "fatta") patch.settimana = L.chiaveSettimana(new Date(), S.regole.chiusuraPaga);
  else patch.settimana = null;
  const foto = fotoPending; fotoPending = null;
  if (foto) patch.foto = true;
  // aggiorno subito sullo schermo, poi salvo (così funziona anche senza rete)
  Object.assign(S.pulizie[p.id], patch);
  chiudiFoglio(); disegna();
  try {
    if (foto) await S.db.salva("foto", p.id, { pulizia: p.id, camera: p.camera, zona: p.zona, data: p.data, dati: foto, ora: S.db.adesso(), da: S.utente.nome || S.utente.email || "" }, false);
    await S.db.aggiorna("pulizie", p.id, patch);
    // avvisi automatici (Telegram), se configurati
    const chi = S.utente.nome || tagZona(p.zona);
    let testoWa = "";
    if (stato === "problema") { testoWa = `⚠️ Problema in ${camera(p.camera).nome} (${chi}): ${nota || "senza dettagli"}${foto ? " · c'è una foto nell'app" : ""}`; inviaTelegram(testoWa, "problema"); }
    else if (stato === "non_fatta") { testoWa = `⛔ ${camera(p.camera).nome} non fatta (${chi}): ${nota || "senza motivo"}`; inviaTelegram(testoWa, "problema"); }
    else if (stato === "fatta") inviaTelegram(`✅ ${camera(p.camera).nome} pulita alle ${L.oraBreve(adesso)} (${chi})`, "pulita");
    if (testoWa && addetta() && numeroWhatsApp()) { toast("Vuoi avvisare anche su WhatsApp?", { testo: "Avvisa", fai: () => { apriWhatsApp(testoWa, numeroWhatsApp()); const t = $(".toast"); if (t) t.remove(); } }); setTimeout(() => { const t = $(".toast"); if (t && /WhatsApp/.test(t.textContent)) t.remove(); }, 15000); }
  }
  catch (e) { erroreScrittura(e); }
}
// Riduce la foto (max 900 px, JPEG) così pesa poco e sta nel piano gratuito
function rimpicciolisciFoto(file) {
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const max = 900, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let q = 0.72, out = c.toDataURL("image/jpeg", q);
      while (out.length > 350000 && q > 0.3) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
      ok(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error("immagine non leggibile")); };
    img.src = url;
  });
}

async function segnaPagata(zona, chiave, si) {
  const id = `${zona}_${chiave}`;
  try {
    if (si) {
      const { lista, totale } = L.totaleSettimana(S.pulizie, zona, chiave, S.regole, S.controlli);
      if (!await chiedi(`Segno come pagata la settimana ${L.etichettaSettimana(chiave)} della signora ${S.zone[zona]?.breve || zona}: ${eur(totale)} per ${lista.length} pulizie?`, { si: "Sì, pagata" })) return;
      await S.db.salva("pagamenti", id, { zona, settimana: chiave, importo: totale, pulizie: lista.length, quando: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short", timeZone: "Europe/Rome" }), istante: S.db.adesso(), da: S.utente.nome || S.utente.email || "" }, false);
      toast("Segnata come pagata");
    } else { if (!await chiedi("Annullo il pagamento segnato?", { si: "Sì, annulla", pericolo: true })) return; await S.db.cancella("pagamenti", id); }
  } catch (e) { erroreScrittura(e); }
}

async function salvaListino(l) {
  const prima = S.listino; S.listino = L.listinoCompleto(l); disegna();
  try { await S.db.salva("impostazioni", "listino", { ...S.listino, aggiornato: S.db.adesso() }, false); toast("Listino salvato"); }
  catch (e) { S.listino = prima; disegna(); erroreScrittura(e); }
}

async function salvaSoggiorno(f) {
  const nome = $("#sNome").value.trim(), inizio = $("#sInizio").value, fine = $("#sFine").value;
  if (!nome || !inizio || !fine) return;
  if (fine <= inizio) { toast("Il giorno di partenza deve venire dopo l'arrivo."); return; }
  const cam = f.id ? S.soggiorni[f.id].camera : f.camera;
  const altri = soggiorniLista().filter(s => s.camera === cam && s.id !== f.id && s.inizio < fine && inizio < s.fine);
  if (altri.length && !await chiedi(`In ${camera(cam).nome} in quei giorni c'è già ${altri.map(a => a.nome).join(", ")}. Salvo lo stesso?`, { si: "Sì, salva lo stesso" })) return;
  const d = { camera: cam, inizio, fine, nome, tipo: $("#sTipo").value, persone: Number($("#sPers").value) || 1, supplemento: Math.max(0, Number($("#sSup").value) || 0), nota: $("#sNota").value.trim(), notaPrivata: $("#sPriv").value.trim(), dubbio: $("#sTipo").value === "unk", origine: f.id ? (S.soggiorni[f.id].origine || "mano") : "mano", mesi: mesiCoperti(inizio, fine), modificato: S.db.adesso(), da: S.utente.nome || "" };
  const id = f.id || `${inizio}_${cam}_${Date.now().toString(36)}`;
  try { await S.db.salva("soggiorni", id, d); chiudiFoglio(); toast("Prospetto aggiornato"); }
  catch (e) { erroreScrittura(e); }
}
function mesiCoperti(inizio, fine) { const out = []; for (let m = L.primoDelMese(inizio); m < fine; m = L.aggiungiGiorni(L.ultimoDelMese(m), 1)) out.push(L.meseDi(m)); return out; }

async function azioneSoggiorno(f, azione) {
  const s = S.soggiorni[f.id]; if (!s) return;
  try {
    if (azione === "elimina") { if (!await chiedi(`Tolgo ${s.nome} da ${camera(s.camera).nome}?`, { si: "Sì, togli", pericolo: true })) return; await S.db.cancella("soggiorni", f.id); }
    if (azione === "parteoggi") { const oggi = L.oggiISO(); if (oggi <= s.inizio) { toast("Non può partire prima di arrivare."); return; } await S.db.aggiorna("soggiorni", f.id, { fine: oggi, modificato: S.db.adesso() }); }
    chiudiFoglio(); toast("Prospetto aggiornato");
  } catch (e) { erroreScrittura(e); }
}

// Mesi vecchi del tabellone: li carico una volta sola quando servono
const storicoCaricato = new Set();
async function caricaStorico() {
  if (addetta()) return;
  const [da, a] = intervalloBoard();
  const chiave = L.meseDi(da);
  if (storicoCaricato.has(chiave)) return;
  storicoCaricato.add(chiave);
  const limite = L.aggiungiGiorni(L.primoDelMese(L.aggiungiGiorni(L.oggiISO(), -31)), 0);
  if (da >= limite) return;
  try {
    const [sog, pul, note] = await Promise.all([
      S.db.leggiTutti("soggiorni", { where: [["fine", ">=", da], ["fine", "<", L.aggiungiGiorni(limite, 40)]] }).catch(() => ({})),
      S.db.leggiTutti("pulizie", { where: [["__id__", ">=", da], ["__id__", "<", a]] }),
      S.db.leggiTutti("note", { where: [["data", ">=", da], ["data", "<", a]] }).catch(() => ({})),
    ]);
    Object.assign(S.soggiorni, sog); Object.assign(S.pulizie, pul); Object.assign(S.note, note); disegna();
  } catch (e) { console.error(e); }
}

async function esportaTutto() {
  try {
    const [sog, pul, pag, note, imp] = await Promise.all(["soggiorni", "pulizie", "pagamenti", "note", "impostazioni"].map(c => S.db.leggiTutti(c, {})));
    const dati = { esportato: new Date().toISOString(), versione: VERSIONE, soggiorni: sog, pulizie: pul, pagamenti: pag, note, impostazioni: imp };
    const blob = new Blob([JSON.stringify(dati, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `stanze-ricci-copia-${L.oggiISO()}.json`; document.body.appendChild(a); a.click(); a.remove();
    toast("Copia di sicurezza scaricata");
  } catch (e) { erroreScrittura(e); }
}

async function esportaExcel() {
  try {
    const XLSX = await caricaXLSX();
    const [sog, pul, pag, note] = await Promise.all(["soggiorni", "pulizie", "pagamenti", "note"].map(c => S.db.leggiTutti(c, {})));
    const wb = XLSX.utils.book_new();
    const righePul = Object.values(pul).sort((a, b) => (a.data + a.camera) < (b.data + b.camera) ? -1 : 1).map(p => ({ Giorno: p.data, Camera: camera(p.camera).nome, Zona: S.zone[p.zona]?.breve || p.zona, Lavoro: p.titolo, Ospite: p.ospite || "", Stato: p.stato, Ora: p.ora ? L.oraBreve(p.ora) : "", "Importo base": Number(p.importo || 0), Voto: p.voto ?? "", "Importo finale": p.stato === "fatta" ? L.importoFinale(p, S.regole) : "", "Settimana paga": p.settimana || "", Nota: p.nota || "", "Segnato da": p.segnatoDa || "" }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(righePul), "Pulizie");
    const righePag = Object.values(pag).sort((a, b) => a.settimana < b.settimana ? -1 : 1).map(x => ({ Settimana: x.settimana, Periodo: L.etichettaSettimana(x.settimana), Zona: S.zone[x.zona]?.breve || x.zona, Importo: Number(x.importo || 0), Pulizie: x.pulizie || "", "Pagata il": x.quando || "", Da: x.da || "" }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(righePag.length ? righePag : [{ Settimana: "" }]), "Pagamenti");
    const righeSog = Object.values(sog).sort((a, b) => (a.inizio + a.camera) < (b.inizio + b.camera) ? -1 : 1).map(x => ({ Camera: camera(x.camera).nome, Arriva: x.inizio, Parte: x.fine, Notti: L.giorniTra(x.inizio, x.fine), Ospite: x.nome, Tipo: TIPI_OSPITE[x.tipo]?.nome || x.tipo, Persone: x.persone || "", Supplemento: x.supplemento || 0, "Istruzioni signore": x.nota || "", "Nota privata": x.notaPrivata || "", Origine: x.origine || "", "Da controllare": x.dubbio ? "sì" : "" }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(righeSog.length ? righeSog : [{ Camera: "" }]), "Prospetto");
    const righeNote = Object.values(note).sort((a, b) => a.data < b.data ? -1 : 1).map(n => ({ Giorno: n.data, Camera: n.camera ? camera(n.camera).nome : "", Testo: n.testo, Privata: n.privata ? "sì" : "" }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(righeNote.length ? righeNote : [{ Giorno: "" }]), "Note");
    XLSX.writeFile(wb, `stanze-ricci-${L.oggiISO()}.xlsx`);
    toast("File Excel scaricato");
  } catch (e) { erroreScrittura(e); }
}

// ---------------------------------------------------------------------------
//  Persone e accessi (chi può entrare e con quale ruolo)
// ---------------------------------------------------------------------------
function emailDi(login) { return `${String(login || "").trim().toLowerCase().replace(/\s+/g, "")}@${(window.DOMINIO_ACCESSO || "stanzericci.app").toLowerCase()}`; }
let seminaFatta = false;
async function seminaPersone() {
  // La prima volta che un proprietario entra e la lista è vuota, l'app scrive le persone di base da sola.
  if (seminaFatta || !proprietario() || !S.caricati.ruoli || Object.keys(S.ruoli).length) return;
  seminaFatta = true;
  try {
    await S.db.scrivi(PERSONE_BASE.map(p => ({ tipo: "salva", coll: "ruoli", id: emailDi(p.login), dati: { login: p.login, nome: p.nome, ruolo: p.ruolo, zona: p.zona || null, creato: S.db.adesso() } })));
    toast("Ho preparato le persone di base (proprietari e signore).");
  } catch (e) { console.error(e); }
}
function vistaPersone() {
  const lista = Object.values(S.ruoli).sort((a, b) => (a.ruolo + a.login).localeCompare(b.ruolo + b.login));
  const mod = puoModificare();
  const selRuolo = (r, v) => `<select data-ruolo-sel="${esc(r.id)}" ${mod ? "" : "disabled"}>${[["proprietario", "Proprietario"], ["addetta", "Signora delle pulizie"], ["lettura", "Solo lettura"]].map(([k, n]) => `<option value="${k}" ${v === k ? "selected" : ""}>${n}</option>`).join("")}</select>`;
  const selZona = (r, v) => `<select data-zona-sel="${esc(r.id)}" ${mod ? "" : "disabled"}><option value="">— zona —</option>${zoneOrdinate().map(z => `<option value="${z.id}" ${v === z.id ? "selected" : ""}>${esc(z.nome)}</option>`).join("")}</select>`;
  return `<section class="card"><h2>Persone e accessi</h2><p class="muted small" style="margin:0 0 10px">Per entrare si scrive il nome (es. <b>primopiano</b>) e la password. La password si crea nella console Firebase (Authentication → Utenti); qui si decide <b>chi è</b> e <b>cosa vede</b>.</p>
    <div class="rows">${lista.map(r => `<div class="row one"><span><b>${esc(r.login || r.id.split("@")[0])}</b> · <input type="text" value="${esc(r.nome || "")}" data-nome-sel="${esc(r.id)}" style="width:60%;min-height:40px;padding:6px 10px;display:inline-block" ${mod ? "" : "disabled"}><br><span style="display:inline-flex;gap:6px;flex-wrap:wrap;margin-top:6px">${selRuolo(r, r.ruolo)}${r.ruolo === "addetta" ? selZona(r, r.zona) : ""}${mod ? `<button class="btnsm ghost" data-ruolo-del="${esc(r.id)}">Togli</button>` : ""}</span></span></div>`).join("") || `<p class="muted">Nessuna persona ancora.</p>`}</div>
    ${mod ? `<details style="margin-top:10px"><summary>Aggiungi una persona</summary><form id="formPersona"><div class="due"><div class="campo"><label for="pLogin">Nome per entrare (senza spazi)</label><input id="pLogin" type="text" autocapitalize="none" placeholder="es. maria" required></div><div class="campo"><label for="pNome">Come la chiamiamo</label><input id="pNome" type="text" placeholder="es. Maria" required></div></div>
      <div class="due"><div class="campo"><label for="pRuolo">Ruolo</label><select id="pRuolo"><option value="addetta">Signora delle pulizie</option><option value="proprietario">Proprietario</option><option value="lettura">Solo lettura</option></select></div><div class="campo"><label for="pZona">Zona (per le signore)</label><select id="pZona"><option value="">—</option>${zoneOrdinate().map(z => `<option value="${z.id}">${esc(z.nome)}</option>`).join("")}</select></div></div>
      <button class="big main" type="submit">Aggiungi</button><p class="muted small" style="margin:8px 0 0">Poi crea l'accesso con la stessa email (<i>nome</i>@${esc(window.DOMINIO_ACCESSO || "stanzericci.app")}) e una password nella console Firebase.</p></form></details>` : ""}</section>`;
}
function collegaPersone() {
  const salvaCampo = (id, patch) => S.db.aggiorna("ruoli", id, patch).then(() => toast("Salvato")).catch(erroreScrittura);
  document.querySelectorAll("[data-ruolo-sel]").forEach(e => e.onchange = () => salvaCampo(e.dataset.ruoloSel, { ruolo: e.value, zona: e.value === "addetta" ? (S.ruoli[e.dataset.ruoloSel]?.zona || null) : null }));
  document.querySelectorAll("[data-zona-sel]").forEach(e => e.onchange = () => salvaCampo(e.dataset.zonaSel, { zona: e.value || null }));
  document.querySelectorAll("[data-nome-sel]").forEach(e => e.onchange = () => salvaCampo(e.dataset.nomeSel, { nome: e.value.trim() }));
  document.querySelectorAll("[data-ruolo-del]").forEach(b => b.onclick = async () => { const r = S.ruoli[b.dataset.ruoloDel]; if (r && await chiedi(`Tolgo l'accesso a ${r.nome || r.login}? (L'account in Firebase resta, ma non vedrà più niente.)`, { si: "Sì, togli", pericolo: true })) S.db.cancella("ruoli", b.dataset.ruoloDel).then(() => toast("Tolto")).catch(erroreScrittura); });
  const fp = $("#formPersona");
  if (fp) fp.onsubmit = (e) => { e.preventDefault(); const login = $("#pLogin").value.trim().toLowerCase().replace(/\s+/g, ""); if (!login) return; const ruolo = $("#pRuolo").value; S.db.salva("ruoli", emailDi(login), { login, nome: $("#pNome").value.trim(), ruolo, zona: ruolo === "addetta" ? ($("#pZona").value || null) : null, creato: S.db.adesso() }, false).then(() => toast(`Aggiunta: ${login}`)).catch(erroreScrittura); };
}

// ---------------------------------------------------------------------------
//  Foglio di papà: lettura dell'Excel con regole fisse, anteprima, salvataggio
// ---------------------------------------------------------------------------
let XLSXlib = null;
function caricaXLSX() {
  if (XLSXlib) return Promise.resolve(XLSXlib);
  if (window.XLSX) return Promise.resolve(XLSXlib = window.XLSX);
  return new Promise((ok, ko) => {
    const sc = document.createElement("script"); sc.src = "xlsx.min.js";
    sc.onload = () => ok(XLSXlib = window.XLSX); sc.onerror = () => ko(new Error("Non riesco a caricare il lettore Excel (xlsx.min.js)."));
    document.head.appendChild(sc);
  });
}

async function leggiFileExcel(file) {
  toast("Leggo il foglio…");
  try {
    const XLSX = await caricaXLSX();
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellStyles: true, cellFormula: true });
    const ris = leggiProspetto(daSheetJS(XLSX, wb), {});
    if (!ris.mesi.length) { toast("In questo file non trovo fogli con il nome di un mese (es. 'settembre')."); return; }
    // conflitti con quello che c'è già nell'app (soggiorni scritti a mano)
    const esistenti = soggiorniLista();
    ris.soggiorni.forEach((s, i) => {
      s.scelto = !s.nonCreare;
      s.conflitti = esistenti.filter(e => e.camera === s.camera && (e.origine || "mano") !== "excel" && e.inizio < s.fine && s.inizio < e.fine).map(e => ({ id: e.id, nome: e.nome, inizio: e.inizio, fine: e.fine }));
    });
    S.importazione = { nomeFile: file.name, ris, sostituisciMano: true };
    S.vista = "foglio"; disegna(); window.scrollTo(0, 0);
  } catch (e) { console.error(e); toast("Non sono riuscito a leggere il file: " + (e.message || e)); }
}

function vistaFoglio() {
  const imp = S.importazione;
  if (!imp) return `<section class="card"><h2>Foglio di papà</h2><p class="muted">Nessun foglio in lettura.</p><button class="big undo" data-vista="altro">Torna indietro</button></section>`;
  const r = imp.ris;
  const dubbi = r.soggiorni.filter(s => s.dubbio);
  const sicuri = r.soggiorni.filter(s => !s.dubbio);
  const conflitti = r.soggiorni.filter(s => s.scelto && s.conflitti.length);
  const scelti = r.soggiorni.filter(s => s.scelto).length;
  const rigaSog = (s, i) => `<label class="row" style="grid-template-columns:auto 1fr;cursor:pointer;align-items:start"><input type="checkbox" data-scelta="${i}" ${s.scelto ? "checked" : ""} style="width:24px;height:24px;margin-top:2px">
      <span><b>${esc(camera(s.camera).nome)}</b> · ${esc(s.nome)}${s.persone ? ` · ${s.persone} ${s.persone === 1 ? "persona" : "persone"}` : ""} <span class="chip">${esc(TIPI_OSPITE[s.tipo]?.nome || s.tipo)}</span><br>
      <span class="muted">${esc(L.dataMedia(s.inizio))} → parte ${esc(L.dataMedia(s.fine))} (${L.giorniTra(s.inizio, s.fine)} notti)</span>
      ${s.nota ? `<br><span class="muted">📝 per le signore: ${esc(s.nota)}</span>` : ""}${s.notaPrivata ? `<br><span class="muted">🔒 ${esc(s.notaPrivata)}</span>` : ""}
      ${s.motivi.length ? `<br><span style="color:var(--todo);font-weight:700">? ${esc(s.motivi.join(" · "))}</span>` : ""}
      ${s.conflitti.length ? `<br><span style="color:var(--warn)">Nell'app c'è già: ${esc(s.conflitti.map(c => `${c.nome} (${L.dataMedia(c.inizio)}→${L.dataMedia(c.fine)})`).join(", "))}</span>` : ""}
      <br><span class="muted small">nel foglio: ${esc(s.testoOriginale || "(solo colore)")}</span></span></label>`;
  const indice = s => r.soggiorni.indexOf(s);
  return `<section class="card flat"><h2 style="margin:0">Foglio di papà · ${esc(imp.nomeFile)}</h2><p class="muted small" style="margin:0">${esc(r.mesi.map(m => m.nome).join(" e "))}. Controlla, togli la spunta a quello che non va, poi salva.</p></section>
  <section class="card"><div class="stats"><div class="stat"><b>${r.soggiorni.length}</b><span>soggiorni letti</span></div><div class="stat"><b style="color:var(--todo)">${dubbi.length}</b><span>da controllare</span></div><div class="stat"><b>${r.note.length}</b><span>note</span></div><div class="stat"><b>${scelti}</b><span>da salvare</span></div></div></section>
  ${r.avvisi.length || r.colonneIgnorate.length ? `<section class="card"><div class="avviso">${esc([...r.avvisi, ...(r.colonneIgnorate.length ? ["Colonne non riconosciute: " + r.colonneIgnorate.join(", ")] : [])].join(" "))}</div></section>` : ""}
  ${dubbi.length ? `<section class="card"><h2 style="color:var(--todo)">Da controllare (?)</h2><p class="muted small" style="margin:0 0 8px">Qui l'app non è sicura: decidi tu. Spunta = lo salvo così com'è.</p><div class="rows">${dubbi.map(s => rigaSog(s, indice(s))).join("")}</div></section>` : ""}
  ${conflitti.length ? `<section class="card"><h2 style="color:var(--warn)">Già presenti nell'app</h2><p class="muted small">Per questi giorni nell'app c'era già qualcosa scritto a mano.</p><label class="row" style="grid-template-columns:auto 1fr;cursor:pointer"><input type="checkbox" id="sostMano" ${imp.sostituisciMano ? "checked" : ""} style="width:24px;height:24px"><span>Il foglio di papà vince: sostituisci quello scritto a mano</span></label></section>` : ""}
  <section class="card"><h2>Cosa ho letto</h2><div class="rows">${sicuri.map(s => rigaSog(s, indice(s))).join("")}</div></section>
  <section class="card"><details><summary>Note trovate nel foglio (${r.note.length})</summary><div class="rows">${r.note.map(n => `<div class="row"><span><b>${esc(L.dataMedia(n.data))}</b> · ${esc(n.camera ? camera(n.camera).nome : n.esterno || "")}<br>${esc(n.testo)}</span>${n.privata ? `<span class="pill priv">privata</span>` : `<span class="pill paid">per le signore</span>`}</div>`).join("") || `<p class="muted">Nessuna</p>`}</div></details>
  <details><summary>Appoggio esterno · senza pulizie (${r.esterni.filter(e => e.strisce.length).length})</summary><div class="rows">${r.esterni.filter(e => e.strisce.length).map(e => `<div class="row one"><span><b>${esc(e.etichetta)}</b> <span class="muted small">(${esc(e.foglio)})</span><br><span class="muted">${esc(e.strisce.map(x => `${L.dataMedia(x.inizio)}→${L.dataMedia(x.fine)}: ${x.testo}`).join(" · "))}</span></span></div>`).join("")}</div></details></section>
  <section class="card flat"><button class="big main" data-salva-foglio ${S.attesa ? "disabled" : ""}>${S.attesa ? "Salvo…" : `Salva nel prospetto (${scelti})`}</button><button class="big undo" data-annulla-foglio>Annulla, non salvare niente</button></section>`;
}

async function salvaImportazione() {
  const imp = S.importazione; if (!imp || S.attesa) return;
  const r = imp.ris;
  const scelti = r.soggiorni.filter(s => s.scelto);
  if (!scelti.length && !r.note.length) { toast("Non c'è niente da salvare."); return; }
  S.attesa = true; disegna();
  try {
    const ops = [];
    const da = r.mesi.map(m => m.da).sort()[0], a = L.aggiungiGiorni(r.mesi.map(m => m.a).sort().slice(-1)[0], 1);
    // 1) via i soggiorni venuti da un foglio precedente in questi mesi (verranno riscritti)
    const vecchi = await S.db.leggiTutti("soggiorni", { where: [["fine", ">", da]] });
    for (const v of Object.values(vecchi)) if ((v.origine === "excel") && v.inizio < a) ops.push({ tipo: "cancella", coll: "soggiorni", id: v.id });
    // 2) quelli scritti a mano che si sovrappongono, se il foglio vince
    if (imp.sostituisciMano) for (const s of scelti) for (const c of s.conflitti) ops.push({ tipo: "cancella", coll: "soggiorni", id: c.id });
    // 3) i nuovi soggiorni
    for (const s of scelti) {
      const id = `xl_${s.camera}_${s.inizio}`;
      ops.push({ tipo: "salva", coll: "soggiorni", id, merge: false, dati: { camera: s.camera, inizio: s.inizio, fine: s.fine, nome: s.nome, tipo: s.tipo, persone: s.persone || 1, nota: s.nota || "", notaPrivata: s.notaPrivata || "", dubbio: !!s.dubbio, motivi: s.motivi || [], testoOriginale: s.testoOriginale || "", origine: "excel", foglio: imp.nomeFile, mesi: mesiCoperti(s.inizio, s.fine), modificato: S.db.adesso(), da: S.utente.nome || "" } });
    }
    // 4) le note (stesso nome = stessa nota: ricaricare il foglio non le raddoppia)
    r.note.forEach((n, i) => {
      const id = `xl_${n.camera || n.esterno || "gen"}_${n.data}_${i}`;
      ops.push({ tipo: "salva", coll: "note", id, merge: false, dati: { data: n.data, camera: n.camera || null, testo: n.testo, privata: !!n.privata, origine: "excel", foglio: imp.nomeFile, da: S.utente.nome || "" } });
    });
    const quando = new Date().toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
    ops.push({ tipo: "salva", coll: "impostazioni", id: "foglio", merge: false, dati: { nome: imp.nomeFile, quando, mesi: r.mesi.map(m => m.nome), letti: r.soggiorni.length, salvati: scelti.length, dubbi: r.soggiorni.filter(s => s.dubbio).length, da: S.utente.nome || "" } });
    ops.push({ tipo: "salva", coll: "importazioni", id: new Date().toISOString().replace(/[:.]/g, "-"), merge: false, dati: { nome: imp.nomeFile, quando, mesi: r.mesi, letti: r.soggiorni.length, salvati: scelti.length, esterni: r.esterni, da: S.utente.nome || "" } });
    // nei mesi letti il foglio di papà è la verità: via anche le note "excel" vecchie di quei mesi
    const vecchieNote = await S.db.leggiTutti("note", { where: [["data", ">=", da]] });
    for (const n of Object.values(vecchieNote)) if (n.origine === "excel" && n.data < a && !ops.some(o => o.coll === "note" && o.id === n.id)) ops.push({ tipo: "cancella", coll: "note", id: n.id });
    await S.db.scrivi(ops);
    S.importazione = null; S.attesa = false; S.vista = "prospetto"; S.board = { modo: "mese", inizio: L.primoDelMese(L.oggiISO()) }; disegna();
    toast(`Foglio salvato: ${scelti.length} soggiorni e ${r.note.length} note nel prospetto.`);
  } catch (e) { S.attesa = false; disegna(); erroreScrittura(e); }
}

// Domanda sì/no con due bottoni grandi (al posto della finestrina piccola del browser)
function chiedi(testo, opz = {}) {
  return new Promise((ok) => {
    const vecchio = $(".conferma"); if (vecchio) vecchio.remove();
    const el = document.createElement("div"); el.className = "conferma";
    el.innerHTML = `<div class="conferma-box" role="dialog"><p>${esc(testo)}</p><button class="big ${opz.pericolo ? "ko" : "main"}" data-si>${esc(opz.si || "Sì")}</button><button class="big undo" data-no>${esc(opz.no || "No, lascia stare")}</button></div>`;
    document.body.appendChild(el);
    el.querySelector("[data-si]").onclick = () => { el.remove(); ok(true); };
    el.querySelector("[data-no]").onclick = () => { el.remove(); ok(false); };
    el.onclick = (e) => { if (e.target === el) { el.remove(); ok(false); } };
  });
}

// ---------------------------------------------------------------------------
//  Avvisi a schermo e aggiornamenti dell'app
// ---------------------------------------------------------------------------
let toastTimer = null;
export function toast(testo, azione) {
  let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.innerHTML = esc(testo) + (azione ? `<button id="toastAz">${esc(azione.testo)}</button>` : "");
  if (azione) $("#toastAz").onclick = azione.fai;
  clearTimeout(toastTimer); if (!azione) toastTimer = setTimeout(() => t.remove(), 3500);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js");
      const proponi = (nuovo) => { if (navigator.serviceWorker.controller) toast("C'è una versione nuova dell'app.", { testo: "Aggiorna", fai: () => { nuovo.postMessage({ tipo: "attiva" }); } }); };
      const segui = (nuovo) => { if (!nuovo) return; if (nuovo.state === "installed") proponi(nuovo); else nuovo.addEventListener("statechange", () => { if (nuovo.state === "installed") proponi(nuovo); }); };
      // versione nuova già scaricata (in attesa) o in arrivo: lo dico subito
      if (reg.waiting) segui(reg.waiting);
      if (reg.installing) segui(reg.installing);
      reg.addEventListener("updatefound", () => segui(reg.installing));
      // ogni tanto (e quando si torna sull'app) controllo se c'è una versione nuova
      const controlla = () => { reg.update().catch(() => {}); };
      setInterval(controlla, 60 * 60 * 1000);
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") controlla(); });
      // Ricarico solo quando cambia una versione già installata (non alla prima apertura)
      const avevaControllo = !!navigator.serviceWorker.controller;
      let ricaricato = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => { if (avevaControllo && !ricaricato) { ricaricato = true; location.reload(); } });
    } catch (e) { console.warn("service worker", e); }
  });
}

$("#whoBtn").onclick = () => { S.giorno = L.oggiISO(); S.settimana = L.lunediDi(S.giorno); if (S.vista === "altro") S.vista = "oggi"; disegna(); };
$("#menuBtn").onclick = () => { S.vista = S.vista === "altro" ? "oggi" : "altro"; disegna(); };
avvia();
