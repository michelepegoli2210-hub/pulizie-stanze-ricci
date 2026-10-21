// ============================================================================
//  APP  ·  Le Stanze di Ricci · Pulizie
//  Qui c'è tutto quello che si vede: schermate, bottoni, tabellone, soldi.
//  I dati passano sempre da db.js; le regole stanno in regole.js e logica.js.
// ============================================================================
import { ZONE, CAMERE, CAMERE_TOLTE, REGOLE_BASE, TIPI_PULIZIA, TIPI_OSPITE, RIFIUTI, APPOGGIO_ESTERNO, PERSONE_BASE, SQUADRA_BASE } from "./regole.js";
import * as L from "./logica.js";
import { apriDb } from "./db.js";
import { daSheetJS, leggiProspetto } from "./excel.js";
import { capisciProspetto, copiaSettimanaScorsa, settimanaBaseDefault, richiestaPerIA } from "./dettatura.js";
import * as G from "./governante.js";
import * as CH from "./chat.js";
import * as PAROLE from "./parole.js";
import * as IA from "./ia.js";
import * as VOCE from "./voce.js";
import * as GESTI from "./gesti.js";
import * as BOCCA from "./bocca.js";

export const VERSIONE = "0.81.0";

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
  attrezzi: '<path d="M14.7 6.3a4 4 0 0 0 5 5L9 22l-3-3 10.7-10.7z"/><path d="M14.7 6.3L17 4l3 3-2.3 2.3"/><path d="M4 5l4 4"/><path d="M3 9l5-5"/>',
  bolle: '<circle cx="9" cy="10" r="6"/><circle cx="17.5" cy="6.5" r="2.5"/><circle cx="17" cy="16" r="3.5"/>',
  settimana: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h3M14 14h3M7 18h3"/>',
  stella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  lente: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  coperta: '<path d="M4 8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9H4z"/><path d="M4 13h16M8 5v12"/>',
  aria: '<rect x="3" y="6" width="18" height="7" rx="2"/><path d="M7 17c1 1 2 1 3 0s2-1 3 0 2 1 3 0"/><path d="M6 10h12"/>',
  termo: '<path d="M6 4v16M10 4v16M14 4v16M18 4v16"/><path d="M4 9h16M4 15h16"/>',
  terrazzo: '<path d="M3 12l9-7 9 7"/><path d="M5 12v8h14v-8"/><path d="M8 20v-5h8v5"/><path d="M12 12v3"/>',
  pioggia: '<path d="M7 15a4 4 0 0 1 .5-8 5 5 0 0 1 9.6 1.3A3.5 3.5 0 0 1 17 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
  doccia: '<path d="M4 20V8a4 4 0 0 1 8 0v1"/><path d="M8 9h8"/><path d="M9 13v1M12 13v1M15 13v1M10 17v1M14 17v1"/>',
  armadio: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M9 12v2M15 12v2"/>',
  finestra: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 12h16M12 3v18"/>',
  cucina: '<rect x="3" y="10" width="18" height="10" rx="1"/><path d="M3 14h18M8 10V6M16 10V6M7 6h2M15 6h2"/><circle cx="8" cy="17" r="1"/><circle cx="16" cy="17" r="1"/>',
  frigo: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/>',
  porta: '<rect x="5" y="3" width="14" height="18" rx="1"/><circle cx="15" cy="12" r="1"/>',
  lavatrice: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M4 7h16M7 5h2"/>',
  secchio: '<path d="M5 8h14l-1.5 12h-11z"/><path d="M8 8a4 4 0 0 1 8 0"/>',
  altoparlante: '<path d="M4 9h3l5-4v14l-5-4H4z"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7"/><path d="M19 6a8 8 0 0 1 0 12"/>',
  muto: '<path d="M4 9h3l5-4v14l-5-4H4z"/><path d="M17 10l4 4M21 10l-4 4"/>',
};
const ICONA = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONE_SVG[n] || ""}</svg>`;
const STATI = {
  da_fare: { testo: "Da pulire", cls: "todo" }, in_corso: { testo: "In corso", cls: "wip" }, fatta: { testo: "Pulita", cls: "done" },
  problema: { testo: "Problema", cls: "warn" }, non_fatta: { testo: "Non fatta", cls: "skip" },
};
const BADGE = (p) => { const st = STATI[p.stato] || STATI.da_fare; return `<span class="badge ${st.cls}">${st.testo}</span>`; };

// Donnine delle pulizie stilizzate (disegni nostri, SVG). Varianti: scopa, festa, secchio, saluto.
const STELLA = (x, y, r, col = "#FFC83D") => `<path d="M${x} ${y - r} L${x + r * .28} ${y - r * .28} L${x + r} ${y} L${x + r * .28} ${y + r * .28} L${x} ${y + r} L${x - r * .28} ${y + r * .28} L${x - r} ${y} L${x - r * .28} ${y - r * .28}Z" fill="${col}"/>`;
const CAPELLI = { castana: "#6B4226", bionda: "#D9A441", mora: "#2E2A28", rossa: "#B4522B", grigia: "#9AA0A6" };
// --- 0.39: la governante disegnata bene -------------------------------------
// Non è una fotografia (per una faccia vera servirebbe un servizio a pagamento):
// è un disegno fatto a strati, con le ombre, gli occhi veri (bianco, iride,
// pupilla, luce) e la bocca che cambia forma mentre parla. Si muove la testa,
// non tutta la figura: così sembra viva e non una statuina che dondola.
// 0.44: la faccia di Consuela può essere una foto scelta da Michele, al posto del disegno.
// Sta solo su questo telefono (è pesante e non serve alle signore).
// 0.46: la faccia di Consuela come la fa Praktika — stesso personaggio, stessa posa,
// cambiano solo bocca e occhi. Michele porta 2-4 immagini, l'app le scambia a tempo
// con la voce vera. Stanno solo su questo telefono (sono pesanti e alle signore non servono).
const CHIAVE_FACCE = "ricci_gov_facce";
const FACCE_PRONTE = { base: "cons-testa.webp", occhi: "cons-testa-occhi.webp" };
const CORPO_PRONTO = { corpo: "cons-base.webp", saluto: "cons-saluto.webp", riposo: "cons-riposo.webp", indica: "cons-indica.webp", cuore: "cons-cuore.webp", pollice: "cons-pollice.webp", b1: "cons-b1.webp", b2: "cons-b2.webp", b3: "cons-b3.webp", felice: "cons-felice.webp", occhi: "cons-occhi.webp", osx: "cons-osx.webp", odx: "cons-odx.webp", osu: "cons-osu.webp" };
const FILM_PRONTO = { parla: "cons-parla.mp4", riposo: "cons-riposo.mp4", poster: "cons-poster.webp" };
// 0.80: SOLO FILMATI (decisione di Michele del 21 ottobre: "lascia stare la sincronia della bocca,
// metti soltanto i filmati"). Niente piu' maschera ne' labiale: quando parla si vede un video in cui
// lei parla davvero, quando ascolta o non fa niente uno in cui sta li' (ascolta, annuisce, pose).
// 0.81: DUE FILMATI LUNGHI SOLTANTO (Michele, 21 ottobre: "un filmato di una quarantina di secondi
// dove parla ed e' sempre quello... e uno di una quarantina di secondi dove sta ferma, ascolta, annuisce").
//  - cons-parla.mp4  (38,5 s): quattro spezzoni in cui parla, si tocca i capelli, sorride, fusi in dissolvenza
//  - cons-riposo.mp4 (42,8 s): pose, annuisce, ascolta, si tocca il petto, fusi in dissolvenza
// Ogni filmato si vede per intero, in avanti; quando sta per finire riparte da capo con una dissolvenza di
// mezzo secondo. Tutti i video partono dalla stessa foto, quindi hanno la stessa inquadratura.
const FILM_GRUPPI = {
  parla: ["parla"],      // lei che parla
  ascolta: ["riposo"],   // mentre si parla a lei
  pensa: ["riposo"],     // mentre aspetta la risposta
  riposo: ["riposo"],    // quando non succede niente
};
const FILM_DISSOLVENZA = 520;                               // ms (come lo stile .gov-film video)
function FILM_CONS(cls) {
  const f = FILM_PRONTO;
  return `<span class="donnina gov-fig gov-film ${cls}" role="img" aria-label="${esc(nomeGov())}" data-film="riposo">
    <video class="cf-v" src="${f.riposo}" poster="${f.poster}" autoplay muted playsinline preload="auto"></video>
    <video class="cf-v giu" poster="${f.poster}" muted playsinline preload="none"></video>
  </span>`;
}
let filmTimer = null;
function filmGov(quale, soloBox) {
  const caselle = soloBox ? [soloBox] : [...document.querySelectorAll(".gov-film")];
  for (const b of caselle) filmUno(quale, b, true);
}
// il prossimo filmato del gruppo, diverso da quello in corso (a giro)
function filmProssimo(lista, corrente) {
  if (!lista || !lista.length) return null;
  const i = lista.indexOf(corrente);
  if (i < 0) return lista[0] === corrente && lista.length > 1 ? lista[1] : lista[0];
  return lista[(i + 1) % lista.length];
}
// quanto manca alla fine del filmato in corso (secondi; 0 se fermo o finito)
function filmResto(v) {
  const d = Number(v.duration) || 0, t = Number(v.currentTime) || 0;
  if (!d || v.paused || v.ended) return 0;
  return Math.max(0, d - t);
}
// Prepara il filmato `quale` nel video nascosto e, quando `subito` e' vero (o il filmato in corso e'
// agli sgoccioli), lo manda in dissolvenza al posto di quello in corso.
function filmUno(quale, box, subito, ancheUguale) {
  if (!box || !FILM_PRONTO[quale] || box.dataset.occupato === "1") return;
  if (box.dataset.film === quale && !ancheUguale) { box._prep = null; return; }
  const vs = [...box.querySelectorAll("video")];
  if (vs.length < 2) return;
  const su = vs.find(v => !v.classList.contains("giu")) || vs[0];
  const giu = vs.find(v => v !== su);
  let p = box._prep;
  if (!p || p.quale !== quale) {
    p = box._prep = { quale, pronto: false, da: Date.now() };
    giu.src = FILM_PRONTO[quale];
    giu.loop = false;
    try { giu.playbackRate = 1; } catch (e) {}
    giu.load();
    giu.addEventListener("canplay", () => { if (box._prep === p) p.pronto = true; }, { once: true });
  }
  const pronto = p.pronto || giu.readyState >= 3 || Date.now() - p.da > 2500;
  if (!pronto) return;                        // ci riprova filmVigila fra 150 ms
  if (!subito && filmResto(su) > 0.6) {          // si aspetta la fine del filmato in corso...
    const t = Number(su.currentTime) || 0;
    if (p.ultimoT !== t) { p.ultimoT = t; p.fermoDa = Date.now(); }
    if (Date.now() - (p.fermoDa || Date.now()) < 6000) return;   // ...finche' avanza; se resta bloccato 6 s si cambia lo stesso
  }
  box.dataset.occupato = "1"; box._prep = null;
  try { if (giu.currentTime > 0.05) giu.currentTime = 0; } catch (e) {}
  giu.play().catch(() => {});
  giu.classList.remove("giu");
  su.classList.add("giu");
  box.dataset.film = quale;
  setTimeout(() => { try { su.pause(); } catch (e) {} box.dataset.occupato = ""; }, FILM_DISSOLVENZA + 80);
}
function filmVigila() {
  if (filmTimer) return;
  filmTimer = setInterval(() => {
    if (document.hidden) return;
    const forzato = document.body.dataset.cons || "";
    let suono = false; try { suono = VOCE.staParlando(); } catch (e) {}
    for (const b of document.querySelectorAll(".gov-film")) {
      const vuole = forzato === "parla" || b.classList.contains("parla") || !!b.closest(".sta-parlando");
      const parla = vuole && (suono || voceInCorso);
      const ascolta = !parla && forzato === "ascolto";
      const pensa = !parla && !ascolta && forzato === "pensa";
      const gruppo = parla ? "parla" : ascolta ? "ascolta" : pensa ? "pensa" : "riposo";
      const lista = FILM_GRUPPI[gruppo] || FILM_GRUPPI.riposo;
      const corrente = b.dataset.film || "";
      const dentro = lista.includes(corrente);
      const su = [...b.querySelectorAll("video")].find(v => !v.classList.contains("giu"));
      if (su && su.paused && !su.ended && !b.dataset.occupato && su.readyState >= 2 && filmResto(su) === 0 && (su.currentTime || 0) < 0.2) su.play().catch(() => {});
      const resto = su ? filmResto(su) : 0;
      // fuori dal gruppo giusto: si cambia subito; dentro: si cambia quando il filmato sta per finire
      // (si prepara il prossimo 2,5 s prima, cosi' la dissolvenza parte in tempo e non si vede mai fermo)
      const prossimo = filmProssimo(lista, corrente);
      if (!dentro) filmUno(prossimo, b, true);
      else if (resto < 2.5) filmUno(prossimo, b, false, prossimo === corrente);   // (gruppo con un filmato solo: riparte lo stesso, in dissolvenza)
    }
  }, 150);
}
filmVigila();
let micCasa = null, micAttivo = false;
function statoCons(s) {
  document.querySelectorAll(".card.consuela, .sofia-hero").forEach(c => {
    c.dataset.stato = s || "";
    c.classList.toggle("sta-parlando", s === "parla");
  });
  document.body.dataset.cons = (s === "parla") ? "parla" : (s === "ascolto") ? "ascolto" : (s === "pensa") ? "pensa" : "";
}
function sottoCons(t, fantasma) {
  const z = document.getElementById("consSotto");
  if (!z) return;
  z.textContent = t || "";
  z.classList.toggle("fantasma", !!fantasma);
  z.classList.toggle("vedi", !!t);
  clearTimeout(z._t);
  if (t && !fantasma) z._t = setTimeout(() => z.classList.remove("vedi"), 9000);
}
function ultimaDiLei() {
  try {
    const c = conversazione();
    for (let i = c.length - 1; i >= 0; i--) {
      const x = c[i];
      const chi = x && (x.chi || x.da || x.ruolo);
      if (chi && /gov|lei|ia|assist/i.test(String(chi))) return String(x.testo || x.msg || x.t || "");
    }
  } catch (e) {}
  return "";
}
// "Un attimo…" gia' pronto: si prepara mentre Michele sta ancora parlando, cosi'
// quando smette lei risponde SUBITO qualcosa e non resta muta ad aspettare l'IA.
let vocePronta = null, voceInPreparazione = false;
async function scaldaRisposta() {
  const vc = VOCE.leggiVoce(), c = confIA();
  if (!vc.attiva || vc.motore !== "google" || !c.chiave) return;
  if (vocePronta || voceInPreparazione) { VOCE.scaldaLive(vc, c.chiave); return; }
  voceInPreparazione = true;
  try { vocePronta = await VOCE.audioPronto("Un attimo.", vc, c.chiave); } catch (e) {}
  voceInPreparazione = false;
  VOCE.scaldaLive(vc, c.chiave); // il collegamento per la risposta vera, gia' aperto
}
function diciUnAttimo() {
  if (!vocePronta) return false;
  try {
    statoCons("parla");
    VOCE.suona(vocePronta, { onInizio: (buf) => labialeAvvia(buf, "Un attimo."), onBocca: (f, t) => { applicaBocca(f); labialeTick(f, t); },
      onFine: () => { applicaBocca(0); labialeFerma(); statoCons("pensa"); } });
    return true;
  } catch (e) { return false; }
}
// Lo scaldamotore: la prima domanda non deve pagare la ricerca del modello
setTimeout(async () => {
  try {
    const c = confIA();
    if (!c.chiave || !IA.accesa(c) || c.modello) return;
    const t = await IA.trovaModello(c);
    if (t && t.modello) IA.salvaConf({ modello: t.modello });
  } catch (e) { console.warn("scaldamotore", e); }
}, 2500);
function micCasaVai() {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) { toast("Qui il microfono non si apre: usa quello della tastiera"); return; }
  if (micAttivo && micCasa) { try { micCasa.stop(); } catch (e) {} return; }
  const r = new R();
  micCasa = r; micAttivo = true;
  r.lang = "it-IT"; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  let finale = "";
  statoCons("ascolto"); sottoCons("ti ascolto…", true); scaldaRisposta();
  r.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const x = e.results[i][0].transcript;
      if (e.results[i].isFinal) finale += x; else interim += x;
    }
    sottoCons((finale + interim).trim() || "ti ascolto…", true);
  };
  r.onerror = () => {
    micAttivo = false;
    statoCons("errore"); sottoCons("Non ho sentito bene, riprova.");
    setTimeout(() => statoCons("ferma"), 2600);
  };
  r.onend = async () => {
    micAttivo = false;
    const t = finale.trim();
    if (!t) { statoCons("ferma"); sottoCons(""); return; }
    statoCons("pensa"); sottoCons("ci penso…", true);
    diciUnAttimo();
    try {
      await parlaGov(t);
      statoCons("parla");
      sottoCons(ultimaDiLei() || "Ti ho risposto nella chat.");
    } catch (e) {
      statoCons("errore"); sottoCons("Non sono riuscita a rispondere.");
    }
    setTimeout(() => statoCons("ferma"), 3200);
  };
  try { r.start(); } catch (e) { micAttivo = false; statoCons("ferma"); sottoCons(""); }
}
document.addEventListener("click", (e) => {
  const b = e.target && e.target.closest && e.target.closest("[data-cons-mic]");
  if (!b) return;
  e.preventDefault(); e.stopPropagation();
  micCasaVai();
}, true);
// il tasto che porta giu', dalla schermata di Sofia a tutto il resto
document.addEventListener("click", (e) => {
  const g = e.target && e.target.closest && e.target.closest("[data-casa-giu]");
  if (!g) return;
  e.preventDefault();
  const h = document.getElementById("sofiaHero");
  window.scrollTo({ top: h ? h.offsetHeight : window.innerHeight, behavior: "smooth" });
}, true);
document.addEventListener("click", (e) => {
  const t = e.target && e.target.closest && e.target.closest("[data-casa-parla]");
  if (!t) return;
  e.preventDefault(); e.stopPropagation();
  benvenutoSofia();
}, true);
function corpoPronto() { const f = facceGov(); return f.base === FACCE_PRONTE.base ? CORPO_PRONTO : null; }
function CORPO_CONS(cls) {
  const c = CORPO_PRONTO, im = (k, n) => `<img class="${n}" src="${c[k]}" alt="">`;
  return `<span class="donnina gov-fig gov-corpo ${cls}" role="img" aria-label="${esc(nomeGov())}">
    <span class="cg-giro"><span class="cg-salto">
      <span class="cg-pose">${im("corpo", "cg-p cg-base")}${im("saluto", "cg-p cg-saluto")}${im("riposo", "cg-p cg-riposo")}${im("indica", "cg-p cg-indica")}${im("cuore", "cg-p cg-cuore")}${im("pollice", "cg-p cg-pollice")}</span>
      ${im("b1", "cg-t cg-b1")}${im("b3", "cg-t cg-b3")}${im("b2", "cg-t cg-b2")}${im("felice", "cg-t cg-felice")}${im("osu", "cg-t cg-osu")}${im("osx", "cg-t cg-osx")}${im("odx", "cg-t cg-odx")}${im("occhi", "cg-t cg-occhi")}
    </span></span></span>`;
}
const POSE = [
  { k: "base", nome: "Faccia normale", aiuto: "bocca chiusa, occhi aperti. Questa serve sempre." },
  { k: "m1", nome: "Bocca socchiusa", aiuto: "stessa posa, labbra appena aperte." },
  { k: "m2", nome: "Bocca aperta", aiuto: "stessa posa, bocca aperta come quando dice «a»." },
  { k: "occhi", nome: "Occhi chiusi", aiuto: "stessa posa, occhi chiusi: serve per farla sbattere le palpebre." },
];
let facceCache = null;
function facceGov() {
  if (facceCache) return facceCache;
  let f = {};
  try { f = JSON.parse(localStorage.getItem(CHIAVE_FACCE) || "{}") || {}; } catch (e) { f = {}; }
  if (!f.base) { try { const vecchia = localStorage.getItem("ricci_gov_foto"); if (vecchia) f.base = vecchia; } catch (e) {} }
  try { if (!Object.keys(f).length && stileGov() === "consuela") f = { ...FACCE_PRONTE }; } catch (e) {}
  facceCache = f; return f;
}
function fotoGov() { return facceGov().base || ""; }
function salvaFaccia(k, dataUrl) {
  let f = {};
  try { f = JSON.parse(localStorage.getItem(CHIAVE_FACCE) || "{}") || {}; } catch (e) { f = {}; }
  if (dataUrl) f[k] = dataUrl; else delete f[k];
  if (k === "base" && !dataUrl) { try { localStorage.removeItem("ricci_gov_foto"); } catch (e) {} }
  try { localStorage.setItem(CHIAVE_FACCE, JSON.stringify(f)); facceCache = f; return true; }
  catch (e) { console.warn("facce", e); return false; }
}
function togliFacce() { try { localStorage.removeItem(CHIAVE_FACCE); localStorage.removeItem("ricci_gov_foto"); } catch (e) {} facceCache = null; }
function salvaFotoGov(d) { return d ? salvaFaccia("base", d) : (togliFacce(), true); }
// La foto ritagliata quadrata e rimpicciolita: 460 px, così pesa poco e si vede bene
function rimpicciolisci(file, lato = 460) {
  return new Promise((ok, no) => {
    const fr = new FileReader();
    fr.onerror = () => no(new Error("Non riesco a leggere la foto."));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => no(new Error("Questa non è una foto che so leggere."));
      im.onload = () => {
        const m = Math.min(im.width, im.height), sx = (im.width - m) / 2, sy = (im.height - m) / 2;
        const cv = document.createElement("canvas"); cv.width = cv.height = lato;
        const cx = cv.getContext("2d"); cx.drawImage(im, sx, sy, m, m, 0, 0, lato, lato);
        ok(cv.toDataURL("image/jpeg", 0.85));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
// Il pupazzo: tutte le facce impilate, si accende quella giusta
function FACCIA_FOTO(cls = "") {
  const f = facceGov();
  if (/grande|film/.test(cls) && corpoPronto()) return FILM_PRONTO.riposo ? FILM_CONS(cls) : CORPO_CONS(cls);
  const strato = (k, c) => f[k] ? `<img class="${c}" src="${f[k]}" alt="">` : "";
  return `<span class="donnina gov-fig gov-foto ${f.m1 || f.m2 ? "parlante" : ""} ${cls}" role="img" aria-label="${esc(nomeGov())}">
    <span class="gf-vetro"><span class="gf-corpo"><span class="gf-testa">${strato("base", "f-base")}${strato("m1", "f-m1")}${strato("m3", "f-m3")}${strato("m2", "f-m2")}${strato("felice", "f-felice")}${strato("pensa", "f-pensa")}${strato("occhi", "f-occhi")}</span></span></span><i class="gov-alone"></i></span>`;
}
const PROMPT_FACCIA = `3D animated character portrait, stylized realism, Pixar and Disney style CGI render. A friendly Italian woman, about 35 years old, warm brown eyes, dark brown hair pulled back in a neat low bun with a few loose strands framing her face, light olive skin with soft subsurface scattering, subtle freckles, glossy natural lips, long detailed eyelashes, gentle closed-mouth smile. She wears a navy blue housekeeper uniform with a crisp white collar. Head and shoulders, facing the camera straight on, centered. Soft cinematic studio lighting, warm key light and a cool rim light on the hair. Plain smooth dark blue gradient background, slightly out of focus. Ultra detailed hair strands, clean skin shading, high quality 3D render, square 1:1, sharp focus on the eyes. No text, no watermark, one person only, no hands in frame.`;
const STESSA = "Keep everything exactly the same: same character, same face, same hairstyle, same clothes, same pose, same camera angle, same lighting, same background.";
const PROMPT_VARIANTI = [
  STESSA + " Change ONLY the mouth: lips slightly parted, as if she is starting to speak. Eyes stay open and identical.",
  STESSA + " Change ONLY the mouth: open in a relaxed oval, as if saying the vowel AH, upper teeth slightly visible. Eyes stay open and identical.",
  STESSA + " Change ONLY the eyes: both eyes gently closed, eyelashes resting down. Mouth stays closed and identical.",
];
function stileGov() { const v = (S.gov && S.gov.stile) || ""; return v === "contorno" ? "contorno" : v === "piatta" ? "piatta" : "consuela"; }
let CONTA_DONNINA = 0;
function tinta(hex, d) {
  const h = String(hex).replace("#", ""), pieno = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(pieno, 16) || 0, cl = v => Math.max(0, Math.min(255, Math.round(v)));
  const r = cl((n >> 16 & 255) + d), g = cl((n >> 8 & 255) + d), b = cl((n & 255) + d);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
// --- Stile "piatta": come le mascotte delle app per le lingue --------------
// La differenza vera non è la faccia: è che NON c'è nessun contorno nero,
// le forme sono geometriche (rettangoli stondati e cerchi), i colori sono
// pochi e pieni, gli occhi sono due fagioli scuri e le mani sono manopole.
function GOVERNANTE_PIATTA(cls = "", colore = null) {
  const cap = CAPELLI[colore] || colore || "#4A2E1F", capS = tinta(cap, -22);
  const PEL = "#F6CBA6", PELS = "#E3AE85", AB = "#3E7BD6", ABS = "#2F63B4";
  const BIA = "#FFFFFF", BIA2 = "#E8EDF5", SC = "#2B3A55", OCC = "#2A2320", ORO = "#FFC93C";
  return `<svg class="donnina gov-fig gov-piatta ${cls}" viewBox="0 0 124 140" aria-hidden="true">
  <ellipse cx="62" cy="133" rx="27" ry="4" fill="rgba(43,58,85,.14)"/>
  <g class="busto">
    <rect x="51" y="110" width="9" height="16" rx="4.5" fill="${PELS}"/><rect x="64" y="110" width="9" height="16" rx="4.5" fill="${PELS}"/>
    <rect x="45" y="122" width="18" height="9" rx="4.5" fill="${SC}"/><rect x="61" y="122" width="18" height="9" rx="4.5" fill="${SC}"/>
    <path d="M62 70c-12 0-19 5-20 12l-5 28c-1 5 10 7 25 7s26-2 25-7l-5-28c-1-7-8-12-20-12Z" fill="${AB}"/>
    <path d="M62 70c12 0 19 5 20 12l5 28c1 5-10 7-25 7Z" fill="${ABS}"/>
    <rect x="50" y="90" width="24" height="26" rx="7" fill="${BIA}"/>
    <rect x="50" y="90" width="24" height="5" rx="2.5" fill="${BIA2}"/>
    <rect x="56" y="101" width="12" height="9" rx="3" fill="${BIA2}"/>
    <path d="M54 69h16l-8 10Z" fill="${BIA}"/>
    <circle cx="62" cy="80" r="3" fill="${ORO}"/>
    <g class="braccio-sx"><rect x="31" y="77" width="11" height="27" rx="5.5" fill="${AB}"/>
      <circle cx="36.5" cy="106" r="7" fill="${PEL}"/></g>
    <g class="braccio-dx">
      <g class="taccuino"><rect x="83" y="58" width="25" height="29" rx="5" fill="${BIA}"/>
        <rect x="83" y="58" width="25" height="7" rx="3.5" fill="${ORO}"/>
        <rect x="88" y="70" width="15" height="3.4" rx="1.7" fill="${BIA2}"/><rect x="88" y="76" width="15" height="3.4" rx="1.7" fill="${BIA2}"/><rect x="88" y="82" width="10" height="3.4" rx="1.7" fill="${BIA2}"/></g>
      <rect x="82" y="76" width="11" height="22" rx="5.5" fill="${ABS}"/>
      <circle cx="87.5" cy="90" r="7" fill="${PEL}"/></g>
  </g>
  <g class="testa">
    <rect x="34" y="14" width="56" height="44" rx="22" fill="${cap}"/>
    <circle cx="62" cy="15" r="11" fill="${cap}"/>
    <rect x="37" y="16" width="50" height="52" rx="24" fill="${PEL}"/>
    <path d="M37 32c0-10 7-16 25-16s25 6 25 16c-2-7-9-10-15-9-5 3-11 4-15 2-10-1-18 1-20 7Z" fill="${cap}"/>
    <g class="ciocca"><rect x="34" y="30" width="6.5" height="22" rx="3.2" fill="${capS}"/><rect x="83.5" y="30" width="6.5" height="20" rx="3.2" fill="${capS}"/></g>
    <circle cx="46" cy="53" r="5" fill="#F79AA4" opacity=".5"/><circle cx="78" cy="53" r="5" fill="#F79AA4" opacity=".5"/>
    <g class="occhi">
      <g class="pupille">
        <rect x="50" y="40" width="7.6" height="12" rx="3.8" fill="${OCC}"/><rect x="66.4" y="40" width="7.6" height="12" rx="3.8" fill="${OCC}"/>
        <circle cx="52.4" cy="43.4" r="1.8" fill="#fff"/><circle cx="68.8" cy="43.4" r="1.8" fill="#fff"/>
      </g>
    </g>
    <g class="palpebre"><rect x="48.4" y="43.6" width="10.8" height="4.8" rx="2.4" fill="${PEL}"/><rect x="64.8" y="43.6" width="10.8" height="4.8" rx="2.4" fill="${PEL}"/></g>
    <g class="sopracciglia"><rect x="48.4" y="34" width="10.8" height="3.4" rx="1.7" fill="${capS}"/><rect x="64.8" y="34" width="10.8" height="3.4" rx="1.7" fill="${capS}"/></g>
    <g class="bocca"><path d="M56 57c1.8 3.6 4 5.4 6 5.4s4.2-1.8 6-5.4Z" fill="${OCC}"/></g>
    <g class="bocca-parla">
      <g class="vA"><rect x="55" y="55" width="14" height="11" rx="5.5" fill="${OCC}"/><rect x="58" y="61" width="8" height="3.4" rx="1.7" fill="#E07C88"/></g>
      <g class="vB"><rect x="57.5" y="55" width="9" height="10" rx="4.5" fill="${OCC}"/></g>
      <g class="vC"><rect x="55" y="57" width="14" height="5" rx="2.5" fill="${OCC}"/></g>
    </g>
    <path class="sorriso" d="M53.5 56c2.6 6 5.6 8 8.5 8s5.9-2 8.5-8Z" fill="${OCC}"/>
    <rect class="broncio" x="55" y="59" width="14" height="3.6" rx="1.8" fill="${OCC}" transform="rotate(-4 62 61)"/>
  </g>
</svg>`;
}
function GOVERNANTE(cls = "", colore = null) {
  const u = "gv" + (++CONTA_DONNINA);
  const cap = CAPELLI[colore] || colore || "#6B3F26", capS = tinta(cap, -34), capL = tinta(cap, 30);
  const occhio = colore === "bionda" ? "#2E7FA8" : colore === "rossa" ? "#4E8A4A" : "#5A3418";
  // Stile "mascotte": tinte piatte, contorno grosso, occhi grandi, niente sfumature.
  const T = "#22313B", PEL = "#F8C9A4", PELS = "#E7A87C";
  const AB = "#2E6FB8", ABS = "#245A99", BIA = "#FDFCF8", ORO = "#F2C14E";
  const l = (d, w = 3) => `stroke="${T}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg class="donnina gov-fig ${cls}" viewBox="0 0 124 140" aria-hidden="true">
  <ellipse cx="62" cy="134" rx="30" ry="4.5" fill="rgba(34,49,59,.18)"/>
  <g class="busto">
    <path d="M50 116h10v12H50z" fill="${PELS}" ${l("", 2.6)}/><path d="M64 116h10v12H64z" fill="${PELS}" ${l("", 2.6)}/>
    <path d="M44 126h20a4 4 0 0 1 0 8H44a4 4 0 0 1 0-8Z" fill="${T}"/>
    <path d="M60 126h20a4 4 0 0 1 0 8H60a4 4 0 0 1 0-8Z" fill="${T}"/>
    <path d="M62 70c-14 0-21 6-22 14l-4 30c-1 6 6 8 26 8s27-2 26-8l-4-30c-1-8-8-14-22-14Z" fill="${AB}" ${l("")}/>
    <path d="M62 70c14 0 21 6 22 14l4 30c1 6-6 8-26 8Z" fill="${ABS}" opacity=".45"/>
    <path d="M50 94h24c2 0 3 1 3 3l2 21c0 2-6 3-15 3s-15-1-15-3l2-21c0-2 1-3 3-3Z" fill="${BIA}" ${l("", 2.6)}/>
    <path d="M47 97c-5 1-8 3-10 5M77 97c5 1 8 3 10 5" fill="none" ${l("", 2.6)}/>
    <path d="M49 100h26" fill="none" stroke="${T}" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>
    <rect x="56" y="106" width="14" height="9" rx="2" fill="none" stroke="${T}" stroke-width="2.2" opacity=".45"/>
    <path d="M52 70c3 6 6 9 10 9s7-3 10-9c-4-2-14-2-20 0Z" fill="${BIA}" ${l("", 2.6)}/>
    <circle cx="62" cy="80" r="3.4" fill="${ORO}" ${l("", 2.2)}/>
    <g class="braccio-sx"><path d="M43 80c-10 4-16 13-16 24" fill="none" stroke="${T}" stroke-width="10.5" stroke-linecap="round"/>
      <path d="M43 80c-10 4-16 13-16 24" fill="none" stroke="${AB}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="27" cy="109" r="7" fill="${PEL}" ${l("", 2.6)}/></g>
    <g class="braccio-dx"><path d="M81 80c11 3 17 10 17 19" fill="none" stroke="${T}" stroke-width="10.5" stroke-linecap="round"/>
      <path d="M81 80c11 3 17 10 17 19" fill="none" stroke="${AB}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="98" cy="101" r="7" fill="${PEL}" ${l("", 2.6)}/>
      <g class="taccuino"><rect x="90" y="74" width="23" height="27" rx="4" fill="${BIA}" ${l("", 2.6)}/>
        <path d="M95 83h13M95 89h13M95 95h9" fill="none" stroke="${T}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
        <rect x="90" y="74" width="23" height="6" rx="3" fill="${ORO}" ${l("", 2.2)}/></g></g>
    <path d="M56 64h12v10H56z" fill="${PELS}" ${l("", 2.6)}/>
  </g>
  <g class="testa">
    <path d="M62 10c-18 0-29 12-29 28 0 4 1 8 2 11h54c1-3 2-7 2-11 0-16-11-28-29-28Z" fill="${cap}" ${l("")}/>
    <circle cx="62" cy="13" r="10" fill="${cap}" ${l("")}/>
    <path d="M57 8c3-2 7-2 10 1" fill="none" stroke="${capL}" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="34" cy="46" rx="5" ry="6.5" fill="${PEL}" ${l("", 2.6)}/><ellipse cx="90" cy="46" rx="5" ry="6.5" fill="${PEL}" ${l("", 2.6)}/>
    <circle cx="62" cy="43" r="27" fill="${PEL}" ${l("")}/>
    <path d="M35 39c1-16 12-26 27-26s26 10 27 26c-4-9-13-13-20-12-4 4-11 5-16 3-8 0-15 3-18 9Z" fill="${cap}" ${l("")}/>
    <g class="ciocca"><path d="M36 38c-4 7-5 14-4 20" fill="none" stroke="${cap}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M88 38c4 7 5 13 4 19" fill="none" stroke="${cap}" stroke-width="5" stroke-linecap="round"/></g>
    <circle cx="45" cy="55" r="5.5" fill="#F79AA0" opacity=".65"/><circle cx="79" cy="55" r="5.5" fill="#F79AA0" opacity=".65"/>
    <g class="occhi">
      <ellipse cx="51" cy="45" rx="8.4" ry="9.4" fill="${BIA}" ${l("", 2.8)}/>
      <ellipse cx="73" cy="45" rx="8.4" ry="9.4" fill="${BIA}" ${l("", 2.8)}/>
      <g class="pupille">
        <circle cx="51.6" cy="46" r="5.2" fill="${occhio}"/><circle cx="73.6" cy="46" r="5.2" fill="${occhio}"/>
        <circle cx="51.6" cy="46" r="2.8" fill="#15202A"/><circle cx="73.6" cy="46" r="2.8" fill="#15202A"/>
        <circle cx="49.6" cy="43.4" r="2.2" fill="#fff"/><circle cx="71.6" cy="43.4" r="2.2" fill="#fff"/>
        <circle cx="53.6" cy="48.4" r="1" fill="#fff" opacity=".8"/><circle cx="75.6" cy="48.4" r="1" fill="#fff" opacity=".8"/>
      </g>
    </g>
    <g class="palpebre">
      <path d="M42.6 45a8.4 9.4 0 0 1 16.8 0Z" fill="${PEL}" ${l("", 2.8)}/>
      <path d="M64.6 45a8.4 9.4 0 0 1 16.8 0Z" fill="${PEL}" ${l("", 2.8)}/>
    </g>
    <g class="sopracciglia">
      <path d="M43 32.5c3-3.4 9-3.8 13-1" fill="none" stroke="${capS}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M68 31.5c4-2.8 10-2.4 13 1" fill="none" stroke="${capS}" stroke-width="3.4" stroke-linecap="round"/>
    </g>
    <path d="M62 48c-1.6 3-2.6 4.6-1 5.6" fill="none" stroke="${PELS}" stroke-width="2.4" stroke-linecap="round"/>
    <g class="bocca"><path d="M55 58c2.6 3.6 5 5 7 5s4.4-1.4 7-5" fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round"/></g>
    <g class="bocca-parla">
      <g class="vA"><ellipse cx="62" cy="60" rx="8" ry="6" fill="#8E3B44" ${l("", 2.6)}/><path d="M55.4 57.6c4.4-1.6 8.8-1.6 13.2 0-4.4 1.4-8.8 1.4-13.2 0Z" fill="${BIA}"/><ellipse cx="62" cy="63.4" rx="4" ry="2.2" fill="#E0828C"/></g>
      <g class="vB"><ellipse cx="62" cy="60" rx="4.6" ry="5.6" fill="#8E3B44" ${l("", 2.6)}/><ellipse cx="62" cy="62" rx="2.4" ry="1.6" fill="#E0828C"/></g>
      <g class="vC"><ellipse cx="62" cy="59" rx="7.4" ry="2.6" fill="#8E3B44" ${l("", 2.6)}/></g>
    </g>
    <path class="sorriso" d="M52 56c3.6 6 7 8 10 8s6.4-2 10-8c-6 2.4-14 2.4-20 0Z" fill="#8E3B44" ${l("", 2.8)}/>
    <path class="broncio" d="M55 62c2.6-3.6 5-5 7-5s4.4 1.4 7 5" fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;
}
function DONNINA(v = "scopa", cls = "", colore = null) {
  if (v === "governante") return fotoGov() ? FACCIA_FOTO(cls) : (stileGov() === "contorno" ? GOVERNANTE(cls, colore) : GOVERNANTE_PIATTA(cls, colore));
  const pelle = "#F7C9A5", pelle2 = "#E6AE87", capelli = CAPELLI[colore] || colore || "#6B4226";
  const vestito = { scopa: "#4F7BE8", festa: "#EF6F7B", secchio: "#23B5A3", saluto: "#9A6BF2", governante: "#1F2A44" }[v] || "#4F7BE8";
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
  } else if (v === "governante") {
    // la governante dell'hotel: vestito scuro, colletto e guanti bianchi, chignon, perle e il taccuino delle ispezioni
    bracciaSx = braccio("M44 72 Q30 86 36 100") + `<circle cx="36" cy="101" r="5.2" fill="#FFFFFF" stroke="#D8D8E0" stroke-width="1"/>`;
    bracciaDx = braccio("M76 72 Q94 66 96 50") + `<circle cx="97" cy="48" r="5.2" fill="#FFFFFF" stroke="#D8D8E0" stroke-width="1"/>`;
    davanti = `<rect x="86" y="40" width="20" height="26" rx="3" fill="#F6F1E4" stroke="#B9A77C" stroke-width="1.5"/><path d="M90 48h12M90 54h12M90 60h8" stroke="#8C7A52" stroke-width="1.6" stroke-linecap="round"/><path d="M46 70 Q60 80 74 70" stroke="#FFFFFF" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-dasharray="0.1 5"/>` + STELLA(18, 36, 5, "#E7C56A") + STELLA(110, 24, 4, "#E7C56A");
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
    ${v === "governante" ? `<path d="M50 66 L60 76 L70 66 Q60 70 50 66Z" fill="#FFFFFF"/><rect x="56" y="98" width="8" height="2.5" rx="1" fill="#E7C56A"/>` : `<path d="M47 78 H73 L79 118 H41Z" fill="#FFFFFF"/><path d="M60 78 H73 L79 118 H60Z" fill="rgba(15,23,42,.06)"/>
    <rect x="53" y="98" width="14" height="10" rx="2.5" fill="#E4EAF5"/>
    <path d="M52 64 L60 73 L68 64 Q60 60 52 64Z" fill="#FFFFFF"/>`}
    ${bracciaSx}${bracciaDx}
    <rect x="55" y="56" width="10" height="9" rx="3" fill="${pelle2}"/>
    <circle cx="60" cy="42" r="19.5" fill="${pelle}"/>
    <path d="M40.5 40 a19.5 19.5 0 0 1 39 0 Q60 32 40.5 40Z" fill="${capelli}"/>
    ${v === "governante" ? `<circle cx="60" cy="22" r="8" fill="${capelli}"/><path d="M40 40 Q60 24 80 40" stroke="${capelli}" stroke-width="6" fill="none"/>` : `<circle cx="81" cy="31" r="7.5" fill="${capelli}"/>
    <path d="M39 37 Q60 12 81 37 L79 43 Q60 29 41 43Z" fill="#E04E5C"/>
    <path d="M41 42 L30 36 L35 46Z" fill="#E04E5C"/>`}
    <path d="M44 33 Q60 20 76 33" stroke="rgba(255,255,255,.35)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g class="sopracciglia"><path d="M46.5 37.5 Q53 33.8 58.5 36.6" stroke="${capelli}" stroke-width="2.3" fill="none" stroke-linecap="round"/><path d="M61.5 36.6 Q67 33.8 73.5 37.5" stroke="${capelli}" stroke-width="2.3" fill="none" stroke-linecap="round"/></g>
    <g class="occhi"><circle cx="53" cy="45" r="2.4" fill="#2B2B2B"/><circle cx="67" cy="45" r="2.4" fill="#2B2B2B"/>
    <circle cx="54" cy="44" r=".8" fill="#fff"/><circle cx="68" cy="44" r=".8" fill="#fff"/></g>
    <g class="palpebre"><rect x="50" y="41" width="6" height="5" rx="2.4" fill="${pelle}"/><rect x="64" y="41" width="6" height="5" rx="2.4" fill="${pelle}"/></g>
    <circle cx="48" cy="51" r="3.4" fill="#F7A1A6" opacity=".6"/><circle cx="72" cy="51" r="3.4" fill="#F7A1A6" opacity=".6"/>
    <g class="bocca">${bocca}</g>
    <g class="bocca-parla"><ellipse cx="60" cy="54" rx="6.2" ry="4.4" fill="#8E3B42"/><ellipse cx="60" cy="57" rx="3.4" ry="1.8" fill="#E8838F"/><path d="M54.5 51.6 Q60 50 65.5 51.6" stroke="#FFFFFF" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
    ${davanti}
  </svg>`;
}
function saluto() { const h = Number(new Date().toLocaleString("it-IT", { hour: "2-digit", hour12: false, timeZone: "Europe/Rome" })); return h < 13 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera"; }
function nomeSignora() { const u = S.utente; if (u?.zona) { const n = SIG(u.zona); if (n && !/^signora/i.test(n)) return n; } return u?.nome && !/^signora/i.test(u.nome) ? u.nome : `Signora ${S.zone[u?.zona]?.breve || ""}`.trim(); }

// ---------------------------------------------------------------------------
//  Stato dell'app (tutto quello che serve per disegnare le schermate)
// ---------------------------------------------------------------------------
const S = {
  db: null, utente: null, pronto: false,
  vista: "oggi", giorno: L.oggiISO(), settimana: L.lunediDi(L.oggiISO()),
  board: { modo: "elenco", inizio: L.lunediDi(L.oggiISO()) },
  camere: CAMERE.slice(), zone: ZONE, squadra: null, regole: { ...REGOLE_BASE }, listino: L.listinoCompleto(null),
  pulizie: {}, pagamenti: {}, soggiorni: {}, note: {}, ruoli: {}, controlli: {}, controlliA: {}, controlliB: {}, fattiAltrui: {}, impControlli: null, messaggi: {}, avvisi: null, promemoria: {}, veroUtente: null,
  manutenzione: {}, sigZona: null, sigSett: L.lunediDi(L.oggiISO()),
  gov: null, clienti: {}, chat: { risposte: {}, conta: {}, automatiche: {}, conversazione: [] }, spesa: { voci: {} }, registro: {}, govSett: G.settimanaGovernante(), govTab: "consigli", tab: { vista: "posti", zona: "", regola: "", soloRosse: false, prova: false },
  spunte: (() => { try { return JSON.parse(localStorage.getItem("ricci_spunte") || "{}"); } catch (e) { return {}; } })(),
  caricati: { pulizie: false, soggiorni: false, ruoli: false, manutenzione: false, gov: false },
  foglio: null, online: navigator.onLine, erroreAccesso: "", attesa: false,
  stop: [], tema: localStorage.getItem("ricci_tema") || "light",
};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const eur = L.eur;

function camera(id) { return S.camere.find(c => c.id === id) || G.LUOGHI_COMUNI.find(l => l.id === id) || (id === "stelle" ? { id, nome: "Stelle in altre camere", zona: L.listinoCompleto(S.listino).zonaStelle, tipo: "comune" } : CAMERE_TOLTE[id] ? { id, nome: CAMERE_TOLTE[id].nome, zona: "ap", tipo: "casa", tolta: true } : { id, nome: id, zona: "?", tipo: "camera" }); }
function camereZona(z) { return S.camere.filter(c => c.zona === z).sort((a, b) => (a.ordine || 0) - (b.ordine || 0)); }
function zoneOrdinate() { return Object.entries(S.zone).sort((a, b) => (a[1].ordine || 0) - (b[1].ordine || 0)).map(([k, v]) => ({ id: k, ...v })); }
// ---- Le signore (0.36): una per zona di lavoro, col suo nome. Michele le cambia in Paghe → "Le signore".
function squadra() { const out = {}; for (const z of Object.keys(S.zone)) out[z] = { ...(SQUADRA_BASE[z] || { nome: "", attiva: true, camere: [] }), ...((S.squadra || {})[z] || {}) }; for (const [k, v] of Object.entries(S.squadra || {})) if (!out[k] && v) out[k] = { nome: "", attiva: true, camere: [], ...v }; return out; }
// Le signore che lavorano adesso (quelle attive), in ordine
function signore() { const sq = squadra(); return zoneOrdinate().filter(z => sq[z.id] && sq[z.id].attiva !== false).map(z => ({ ...z, ...sq[z.id], nome: SIG(z.id), zonaNome: z.nome })); }
// Il nome di una signora: quello scritto da Michele, poi quello della persona che entra con quella zona, poi "Signora 1° piano"
function SIG(z) { const sq = squadra()[z]; if (sq && sq.nome) return sq.nome; const p = Object.values(S.ruoli || {}).find(r => r.ruolo === "addetta" && r.zona === z && r.nome && !/^signora/i.test(r.nome)); if (p) return p.nome; return `Signora ${S.zone[z]?.breve || z}`; }
// La signora di una camera: se una collaboratrice ha quella camera, è sua; altrimenti quella del calendario
function signoraDiCamera(cameraId) { const sq = squadra(); for (const [z, v] of Object.entries(sq)) if (v.attiva !== false && (v.camere || []).includes(cameraId)) return z; return null; }
function proprietario() { return S.utente?.ruolo === "proprietario"; }
function addetta() { return S.utente?.ruolo === "addetta"; }
function puoModificare() { return proprietario(); }
function soggiorniLista() { return Object.values(S.soggiorni); }
function pulizieDelGiorno(iso, zona) { return Object.values(S.pulizie).filter(p => p.data === iso && (!zona || p.zona === zona) && giroVisibile(p)).sort((a, b) => ordineCamera(a.camera) - ordineCamera(b.camera)); }
// il giro delle stelle nelle altre camere compare solo se la governante ci ha messo qualcosa (o se è già stato fatto)
function giroVisibile(p) { if (!p || p.tipo !== "stelle") return true; if (p.stato === "fatta") return (p.rifiniture || []).length > 0; try { return rifinitureDi(p).length > 0; } catch (e) { return false; } }
function ordineCamera(id) { return camera(id).ordine || 99; }
function statoClasse(p) { return !p ? "" : (STATI[p.stato] || STATI.da_fare).cls; }
function statoTesto(p) { return p.stato === "fatta" ? `Pulita ${L.oraBreve(p.ora)}` : p.stato === "in_corso" ? `In corso da ${L.oraBreve(p.inizio)}` : p.stato === "problema" ? "Problema" : p.stato === "non_fatta" ? "Non fatta" : p.titolo; }
// Il cronometro (0.36): mentre la signora pulisce, il tempo che passa, grande, accanto al tempo standard pagato.
// Il cronometro serve a vedere i tempi veri e tarare l'orario di base: la paga resta sulle ore standard (si cambia in Paghe).
function cronometroHtml(p) {
  const std = Number(p.minuti) || 0, l = L.listinoCompleto(S.listino), aMinuto = l.pagaCol === "vero" && std;
  const tariffa = L.tariffaDi(S.listino, camera(p.camera)), tetto = std ? Math.round(std * (1 + (Number(l.tolleranzaCrono) || 0) / 100)) : 0;
  return `<div class="crono ${aMinuto ? "soldi" : ""}" data-crono="${esc(p.inizio || "")}" data-crono-std="${std}" data-crono-tetto="${tetto}" data-crono-euro="${aMinuto ? tariffa / 60 : 0}">
    <div class="crono-t">${ICONA("orologio")}<b class="crono-n">${esc(testoCrono(p.inizio))}</b>${aMinuto ? `<b class="crono-e">${eur(0)}</b>` : ""}</div>
    <div class="crono-s">Hai iniziato alle ${esc(L.oraBreve(p.inizio))}${aMinuto
      ? ` · si paga il tempo che ci metti (${(tariffa / 60).toFixed(2).replace(".", ",")} € al minuto)${tetto ? `, fino a ${esc(L.testoOre(tetto))}` : ""}`
      : std ? ` · tempo pagato <b>${esc(L.testoOre(std))}</b> (${eur(p.importo)}), finisci prima e prendi lo stesso` : ""}</div></div>`;
}
function testoCrono(inizio) { if (!inizio) return "0:00"; const sec = Math.max(0, Math.round((Date.now() - new Date(inizio)) / 1000)); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, ss = sec % 60; return h ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`; }
let tickCrono = null;
function avviaCronometri() {
  if (tickCrono) { clearInterval(tickCrono); tickCrono = null; }
  const giro = () => { const el = document.querySelectorAll("[data-crono]"); if (!el.length) { clearInterval(tickCrono); tickCrono = null; return; }
    el.forEach(d => { const n = d.querySelector(".crono-n"); if (n) n.textContent = testoCrono(d.dataset.crono);
      const std = Number(d.dataset.cronoStd) || 0, tetto = Number(d.dataset.cronoTetto) || 0, euroMin = Number(d.dataset.cronoEuro) || 0;
      const min = (Date.now() - new Date(d.dataset.crono)) / 60000;
      const e = d.querySelector(".crono-e"); if (e && euroMin) e.textContent = eur(Math.round(Math.min(min, tetto || min) * euroMin * 20) / 20);
      d.classList.toggle("oltre", (tetto ? min > tetto : std > 0 && min > std)); }); };
  if (document.querySelector("[data-crono]")) { giro(); tickCrono = setInterval(giro, 1000); }
}
function minutiPulizia(p) { if (p.minutiVeri != null) return Number(p.minutiVeri); if (!p.inizio || !p.ora) return null; const m = Math.round((new Date(p.ora) - new Date(p.inizio)) / 60000); return m >= 0 && m < 600 ? m : null; }
function titoloBase(p) { return p.tipo === "totale" || p.tipo === "totale_casa" ? "Cambio completo" : p.titolo; }
function parteTesto(p) { return p.parte && L.PARTE_TESTO[p.parte] ? ` · ${L.PARTE_TESTO[p.parte]}` : ""; } // via Zara 1° e 2°: "piano di sotto" / "piano di sopra"
function titoloLavoro(p) { return titoloBase(p) + parteTesto(p); }
// Un problema "aperto": la camera è in stato problema e nessuno ha ancora segnato il lavoro come fatto in Manutenzione
function problemaAperto(p) { return !!p && p.stato === "problema" && S.manutenzione[`pul_${p.id}`]?.stato !== "fatto"; }
function lavoriAperti() { return Object.values(S.manutenzione).filter(m => m.stato !== "fatto").sort((a, b) => (a.data || "") < (b.data || "") ? 1 : -1); }
function lavoriFatti() { return Object.values(S.manutenzione).filter(m => m.stato === "fatto").sort((a, b) => (a.fatto || "") < (b.fatto || "") ? 1 : -1); }
// Avatar della signora (le donnine: una diversa per zona)
function avatarZona(z, cls = "piccola") { const v = ["scopa", "secchio", "saluto", "festa"][zoneOrdinate().findIndex(x => x.id === z)] || "scopa"; const col = (squadra()[z] || {}).capelli || null; return DONNINA(v, cls, col); }
// Ogni problema segnalato finisce nell'elenco dei lavori di manutenzione (che resta anche dopo che la camera viene ripulita)
function vocePerProblema(p) {
  const chi = p.segnatoDa && !/^prova_|@/.test(p.segnatoDa) ? p.segnatoDa : SIG(p.zona);
  return { pulizia: p.id, camera: p.camera, zona: p.zona, data: p.data, titolo: p.nota || "Problema segnalato", nota: "", da: chi, fonte: "signora", foto: !!p.foto, stato: "aperto", creato: S.db.adesso(), fatto: null, fattoDa: "" };
}
const allineati = new Set();
async function allineaManutenzione() {
  if (!proprietario() || S.utente?.finta || !S.caricati.pulizie || !S.caricati.manutenzione) return;
  const mancanti = Object.values(S.pulizie).filter(p => p.stato === "problema" && !S.manutenzione[`pul_${p.id}`] && !allineati.has(p.id));
  if (!mancanti.length) return;
  mancanti.forEach(p => allineati.add(p.id));
  try { await S.db.scrivi(mancanti.map(p => ({ tipo: "salva", coll: "manutenzione", id: `pul_${p.id}`, dati: vocePerProblema(p) }))); }
  catch (e) { console.error("manutenzione", e); }
}
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
  S.utente = { ...S.utente, ruolo: "addetta", zona, nome: SIG(zona), finta: true };
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
// Dalla 0.35 i controlli li decide l'orario di base (LISTINO.controlli): oggi ho controlli se la mia zona ha una quota per questo giorno
function pulizieTutte() { return { ...S.fattiAltrui, ...S.pulizie }; }
function controlliOggi(zona = S.utente?.zona, iso = L.oggiISO()) { return L.controlliDaFare({ zona, iso, listino: S.listino, pulizie: pulizieTutte(), controlli: S.controlli, camere: S.camere, regole: S.regole, adesso: new Date() }); }
function sonoControllatrice() { if (!addetta()) return false; const l = L.listinoCompleto(S.listino); const q = (l.controlli || {})[S.utente.zona] || {}; return Object.values(q).some(n => Number(n) > 0); }
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
  const zona = L.zonaControllatrice(S.impControlli, chiave, signore().map(z => z.id));
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
  S.stop.push(db.ascoltaDoc("impostazioni", "camere", d => { if (d?.lista?.length) { const lista = d.lista.filter(c => !CAMERE_TOLTE[c.id]).map(c => { const b = CAMERE.find(x => x.id === c.id); return b ? { ...c, nome: b.nome, piani: b.piani, posti: b.posti ?? c.posti } : c; }); S.camere = [...lista, ...CAMERE.filter(c => !lista.some(x => x.id === c.id))]; } if (d?.zone) S.zone = d.zone; disegna(); pianifica(); }));
  S.stop.push(db.ascoltaDoc("impostazioni", "controlli", d => { S.impControlli = d || null; if (d) delete S.impControlli.id; aggiornaAscoltoAltrui(); aggiornaControllatrice(); disegna(); }));
  if (addetta()) {
    S.stop.push(db.ascolta("controlli", { where: [["zonaControllata", "==", u.zona]] }, (m) => { S.controlliA = m; S.controlli = { ...S.controlliA, ...S.controlliB }; disegna(); }, mostraErrore));
    S.stop.push(db.ascolta("controlli", { where: [["zonaControllatrice", "==", u.zona]] }, (m) => { S.controlliB = m; S.controlli = { ...S.controlliA, ...S.controlliB }; disegna(); }, mostraErrore));
  } else {
    S.stop.push(db.ascolta("controlli", { where: [["data", ">=", da]] }, (m) => { S.controlli = m; disegna(); }, mostraErrore));
  }
  S.stop.push(db.ascoltaDoc("impostazioni", "regole", d => { S.regole = { ...REGOLE_BASE, ...(d || {}) }; delete S.regole.id; disegna(); pianifica(); }));
  // i clienti: il tipo di ospite ricordato per nome (Tecnici · Operai · Booking), scelto nella scheda del soggiorno
  S.stop.push(db.ascoltaDoc("impostazioni", "clienti", d => { S.clienti = { ...(d || {}) }; delete S.clienti.id; disegna(); pianifica(); }));
  // la chat con la governante: le risposte date, i conteggi per "impara", le cose che fa da sola
  S.stop.push(db.ascoltaDoc("impostazioni", "spesa", d => { const x = { ...(d || {}) }; delete x.id; S.spesa = { voci: x.voci || {} }; disegna(); }));
  S.stop.push(db.ascoltaDoc("impostazioni", "chat", d => { const x = { ...(d || {}) }; delete x.id; S.chat = { risposte: x.risposte || {}, conta: x.conta || {}, automatiche: x.automatiche || {}, conversazione: Array.isArray(x.conversazione) ? x.conversazione : [] }; disegna(); governanteDaSola(); }));
  // messaggi del giorno dei proprietari alle signore (un documento, una voce per giorno)
  S.stop.push(db.ascoltaDoc("impostazioni", "messaggi", d => { S.messaggi = { ...(d || {}) }; delete S.messaggi.id; disegna(); }));
  // cose da fare sempre, camera per camera (es. Salvatore: balcone)
  S.stop.push(db.ascoltaDoc("impostazioni", "promemoria", d => { S.promemoria = { ...(d || {}) }; delete S.promemoria.id; disegna(); }));
  // la governante: regole modificate, soglie, rinvii (tutti) e il registro "ultima volta fatto"
  S.stop.push(db.ascoltaDoc("impostazioni", "governante", d => { S.gov = d ? { ...d } : null; if (S.gov) delete S.gov.id; S.caricati.gov = true; disegna(); governanteAutomatica(); segnaInizioGovernante(); }));
  S.stop.push(db.ascolta("governante_registro", { where: addetta() ? [["zona", "==", u.zona]] : [] }, (m) => { S.registro = {}; const daUnire = []; for (const r of Object.values(m)) { const tolta = CAMERE_TOLTE[r.luogo]; const luogo = tolta ? tolta.unitaA : r.luogo; if (tolta) daUnire.push(r); const k = G.chiaveRegistro(G.nuovoId(r.regola), luogo); const prev = S.registro[k]; if (!prev || (r.ultima || "") > (prev.ultima || "")) S.registro[k] = { ...r, regola: G.nuovoId(r.regola), luogo }; } disegna(); governanteAutomatica(); unisciRegistroTolte(daUnire); }, mostraErrore));
  // avvisi (WhatsApp con un tocco; Telegram automatico se configurato)
  S.stop.push(db.ascoltaDoc("impostazioni", "avvisi", d => { S.avvisi = d ? { ...d } : null; if (S.avvisi) delete S.avvisi.id; disegna(); pianoDelMattino(); }));
  S.stop.push(db.ascoltaDoc("impostazioni", "listino", d => { S.listino = L.listinoCompleto(d); disegna(); pianifica(); }));
  S.stop.push(db.ascoltaDoc("impostazioni", "squadra", d => { const x = { ...(d || {}) }; delete x.id; delete x.aggiornato; S.squadra = Object.keys(x).length ? x : null; disegna(); pianifica(); })); // le signore: nomi, attive, camere loro // anche le signore: serve per contare ore, stelle e controlli
  // pulizie (le signore: solo la loro zona)
  const wherePul = [["__id__", ">=", da], ["__id__", "<", L.aggiungiGiorni(a, 1)]];
  if (addetta()) wherePul.push(["zona", "==", u.zona]);
  S.stop.push(db.ascolta("pulizie", { where: wherePul }, (m) => { S.pulizie = m; S.caricati.pulizie = true; disegna(); pianifica(); pianoDelMattino(); allineaManutenzione(); governanteDaSola(); }, mostraErrore));
  // pagamenti
  S.stop.push(db.ascolta("pagamenti", { where: addetta() ? [["zona", "==", u.zona]] : [] }, (m) => { S.pagamenti = m; disegna(); }, mostraErrore));
  if (!addetta()) {
    S.stop.push(db.ascolta("soggiorni", { where: [["fine", ">=", da]] }, (m) => { S.soggiorni = m; S.caricati.soggiorni = true; disegna(); pianifica(); governanteDaSola(); }, mostraErrore));
    S.stop.push(db.ascolta("note", { where: [["data", ">=", da]] }, (m) => { S.note = m; disegna(); pianifica(); }, mostraErrore));
  S.stop.push(db.ascoltaDoc("impostazioni", "foglio", d => { S.foglioInfo = d; disegna(); }));
    // lavori di manutenzione (problemi segnalati + lavori aggiunti a mano)
    S.stop.push(db.ascolta("manutenzione", {}, (m) => { S.manutenzione = m; S.caricati.manutenzione = true; disegna(); allineaManutenzione(); }, mostraErrore));
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
    const attese = L.pianoPulizie(S.camere, soggiorniLista(), S.regole, S.listino, da, a, Object.values(S.note), S.clienti);
    // le camere date a una collaboratrice passano a lei (Paghe → Le signore): la pulizia, la paga e i controlli
    for (const p of attese) { const z = signoraDiCamera(p.camera); if (z && z !== p.zona) { p.zona = z; p.insieme = ""; } }
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
  memoProposte = new Map(); memoRif = new Map(); memoLista = new Map(); ctxMemo = null;
  disegnaTestata();
  document.body.classList.toggle("nonna", !!(S.utente && addetta()));
  document.body.classList.toggle("vista-manutenzione", !!(S.utente && !addetta() && S.vista === "manutenzione"));
  document.body.classList.toggle("vista-signora", !!(S.utente && !addetta() && (S.vista === "signora" || S.vista === "governante")));
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
  disegnaCasa();
  collega();
  if (S.foglio) disegnaFoglio();
  avviaCronometri();
}

function disegnaTestata() {
  const u = S.utente;
  const sub = !u ? "Pulizie" : addetta() ? SIG(u.zona) : (u.ruolo === "lettura" ? "Solo lettura" : "Gestione") + (u.nome ? " · " + u.nome : "");
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
    giorni.map(g => { const del = pulizieDelGiorno(g, addetta() ? u.zona : null); const has = del.length > 0; const prob = del.some(p => problemaAperto(p));
      return `<button class="day ${has ? "has" : ""} ${prob ? "problema" : ""} ${g === oggi ? "oggi" : ""}" aria-pressed="${g === S.giorno}" data-g="${g}">${L.GG[L.giornoSettimana(g)]}<b>${L.giornoDelMese(g)}</b><span class="dot"></span></button>`; }).join("") +
    `<button class="day arrow" data-sett="1" aria-label="Settimana dopo">›</button>`;
}

// ---- accesso ----------------------------------------------------------------
function vistaAccesso() {
  if (S.db.modalita === "prova") {
    return `<section class="card accesso"><div class="accesso-testa"><div><h2 style="margin:0 0 4px">Ciao! Chi sei?</h2><p class="muted" style="margin:0">Modalità prova: scegli una volta sola, il telefono se lo ricorda.</p></div>${DONNINA("saluto", "media")}</div></section>
    <div class="pick">${signore().map(z => `<button data-prova="addetta|${z.id}|">${esc(SIG(z.id))}<span>${camereZona(z.id).map(c => c.nome).join(", ")}</span></button>`).join("")}
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
// 0.41: le istruzioni pratiche che la governante lascia a una signora per un giorno
function istruzioniDelGiorno(iso, zona) {
  const l = (S.messaggi?.[iso]?.istruzioni) || [];
  return l.filter(x => x && x.passi && x.passi.length && (!zona || !x.zona || x.zona === "tutte" || x.zona === zona));
}
function cardIstruzione(x, i) {
  const passi = (x.passi || []).map((pz, n) => `<li><div class="istr-testo"><b>${n + 1}.</b> ${esc(pz.testo)}</div>${pz.gesto && GESTI.GESTI[pz.gesto] ? GESTI.disegnoGesto(pz.gesto) : ""}</li>`).join("");
  const parlato = [x.titolo, ...(x.passi || []).map((pz, n) => `${n + 1}. ${pz.testo}`)].join(". ");
  return `<section class="card istr-card"><div class="istr-testa">${DONNINA("governante", "piccola")}<div><b>${esc(nomeGov())} ti spiega</b><span>${esc(x.titolo || "Una cosa da fare")}</span></div>
      <button class="chat-voce" data-istr-voce="${esc(String(i))}" aria-label="Ascolta">${ICONA("altoparlante")}</button></div>
    <ol class="istr-passi">${passi}</ol>
    <p class="muted small" style="margin:8px 0 0">Te l'ha lasciata ${esc(x.da || "la governante")}${x.ora ? " alle " + L.oraBreve(x.ora) : ""}. Tocca l'altoparlante e te la legge.</p>
    <span hidden data-istr-testo="${esc(String(i))}">${esc(parlato)}</span></section>`;
}
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
    ${(() => { const std = lavori.filter(p => p.minuti && p.origine !== "governante" && p.tipo !== "extra"); const min = std.reduce((s, p) => s + (Number(p.minuti) || 0), 0), eu = std.reduce((s, p) => s + (Number(p.importo) || 0), 0); return min ? `<div class="pro-ore">${ICONA("orologio")}<span>${esc(L.testoOre(min))} standard · <b>${eur(eu)}</b>${lavori.some(p => rifinitureDi(p).some(r => r.euro)) ? " + le stelle" : ""}</span></div>` : ""; })()}
    ${lavori.length ? `<div class="bar bar-grande"><i style="width:${Math.round(pulite / lavori.length * 100)}%"></i></div>` : ""}
    <div class="pro-data-riga"><div class="pro-data">${ICONA("calendario")}<span>${["Oggi", "Domani", "Ieri"].includes(quando) ? esc(quando) + " · " + esc(L.dataLunga(iso)) : esc(L.dataLunga(iso).replace(/^./, ch => ch.toUpperCase()))}</span></div><button class="nonna-link" data-altri-giorni>${S.mostraGiorni ? "Nascondi" : "Altri giorni"}</button></div>
    ${messaggio}${istruzioniDelGiorno(iso, z).length ? `<div class="pro-msg dentro istr-avviso">${ICONA("stella")}<span><b>${esc(nomeGov())} ti ha lasciato ${istruzioniDelGiorno(iso, z).length === 1 ? "una spiegazione" : istruzioniDelGiorno(iso, z).length + " spiegazioni"}</b>: le trovi qui sotto, coi disegni.</span></div>` : ""}${tutteFatte && numeroWhatsApp() ? `<button class="pro-btn verde" style="margin-top:12px;min-height:56px;font-size:15px" data-whatsapp-finito="${iso}">${ICONA("spunta")}<span>Avvisa su WhatsApp che hai finito</span></button>` : ""}</section>`;
  const rif = RIFIUTI.find(r => r.giorno === (L.giornoSettimana(iso) + 1) % 7);
  const bidoni = rif && z === "ap" ? `<div class="pro-nota">${ICONA("bidone")}<span>Stasera fuori i bidoni: <b>${esc(rif.cosa.replace(/^./, c => c.toUpperCase()))}</b></span></div>` : "";
  // La piantina: le camere al loro posto (sinistra/destra del corridoio, poi via Nazario Sauro); si tocca una camera
  const legenda = `<div class="legenda"><span><i class="todo"></i>Da pulire</span><span><i class="wip"></i>In corso</span><span><i class="done"></i>Pulita</span><span><i class="warn"></i>Problema</span></div>`;
  const piantina = `<section class="card piantina-card"><div class="floorlabel" style="margin:0 2px 6px"><span>Le mie camere</span><span class="muted small">${lavori.length ? `${lavori.length} ${lavori.length === 1 ? "camera" : "camere"}` : ""}</span></div>${piantinaZona(z, iso, true)}${legenda}${lavori.length ? `<p class="piantina-aiuto">Tocca una camera: si apre la lista di oggi, riga per riga.</p>` : ""}</section>`;
  const spiegazioni = istruzioniDelGiorno(iso, z).map((x, i) => cardIstruzione(x, i)).join("");
  return testata + spiegazioni + cardDaRifare(z) + cardControlliOggi(z) + bidoni + piantina;
}

// Un riquadro-camera della piantina (per le signore e per le piantine della gestione)
function tesseraGrande(c, iso, perSignora) {
  const p = (perSignora && addetta() ? pulizieDelGiorno(iso, S.utente.zona).find(x => x.camera === c.id) : null) || S.pulizie[`${iso}_${c.id}`] || pulizieDelGiorno(iso).find(x => x.camera === c.id);
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
  return `<button class="tess ${cls}" ${attr}>${prezzo}<span class="${clsNome}">${esc(c.nome)}</span><span class="tess-lavoro">${p.origine === "governante" ? "⭐ " : ""}${esc(titoloLavoro(p))}</span>${chi ? `<span class="tess-osp">${chi}</span>` : ""}${testoRifiniture(p) ? `<span class="tess-rif">⭐ ${esc(testoRifiniture(p))}</span>` : ""}${flag}${dett}<span class="badge ${cls} tess-stato">${stato}</span>${azione ? `<span class="tess-az">${azione}</span>` : ""}</button>`;
}
// Lavori del giorno che non stanno in una casella della piantina (lavori extra e lavori della governante)
function lavoriInPiu(z, iso, rs) {
  const primari = new Set((rs || camereZona(z)).map(c => (S.pulizie[`${iso}_${c.id}`] || pulizieDelGiorno(iso).find(x => x.camera === c.id))?.id).filter(Boolean));
  return pulizieDelGiorno(iso, z).filter(p => !primari.has(p.id));
}
function tesseraLavoro(p, perSignora) {
  const c = camera(p.camera), cls = statoClasse(p), fondo = p.origine === "governante";
  if (p.tipo === "stelle") { const rg = p.stato === "fatta" ? (p.rifiniture || []).filter(r => r.euro) : rifinitureDi(p); const euroG = p.stato === "fatta" ? Number(p.extraRifiniture) || 0 : rg.reduce((x, r) => x + (r.euro || 0), 0); const stato = p.stato === "fatta" ? `Fatte ${L.oraBreve(p.ora)}` : (STATI[p.stato] || STATI.da_fare).testo; const attr = perSignora ? `data-dettagli="${esc(p.id)}"` : `data-pul="${esc(p.id)}"`;
    return `<button class="tess ${cls} fondo" ${attr}>${!perSignora ? `<span class="tess-pr">${eur(euroG)}</span>` : ""}<span class="tess-nome">⭐ Altre camere</span><span class="tess-lavoro">${rg.length} ${rg.length === 1 ? "stella" : "stelle"}${perSignora && euroG ? ` · ${eur(euroG)}` : ""}</span><span class="tess-osp">${esc([...new Set(rg.map(r => r.luogoNome || camera(r.luogo).nome))].slice(0, 3).join(", "))}</span><span class="badge ${cls} tess-stato">${stato}</span>${perSignora && p.stato !== "fatta" ? `<span class="tess-az">Tocca per vedere</span>` : ""}</button>`; }
  const stato = p.stato === "fatta" ? `Pulita ${L.oraBreve(p.ora)}` : (STATI[p.stato] || STATI.da_fare).testo;
  const azione = perSignora ? (p.stato === "da_fare" ? "Tocca per iniziare" : p.stato === "in_corso" ? "Tocca quando hai finito" : "") : "";
  const attr = perSignora ? `data-dettagli="${esc(p.id)}"` : `data-pul="${esc(p.id)}"`;
  return `<button class="tess ${cls} ${fondo ? "fondo" : ""}" ${attr}>${!perSignora ? `<span class="tess-pr">${eur(p.importo)}</span>` : ""}<span class="tess-nome">${esc(c.nome)}</span><span class="tess-lavoro">${fondo ? "⭐ " : ""}${esc(p.titolo)}</span>${p.minuti ? `<span class="tess-osp">${esc(L.testoOre(p.minuti))}</span>` : ""}<span class="badge ${cls} tess-stato">${stato}</span>${azione ? `<span class="tess-az">${azione}</span>` : ""}</button>`;
}
function piantinaZona(z, iso, perSignora) {
  const rs = perSignora ? [...new Set(pulizieDelGiorno(iso, z).map(p => p.camera))].map(id => camera(id)).sort((a, b) => (a.ordine || 99) - (b.ordine || 99)) : camereZona(z);
  const tile = c => tesseraGrande(c, iso, perSignora);
  const extra = lavoriInPiu(z, iso, rs);
  const inPiu = extra.length ? `<div class="piano-eti" style="margin-top:14px">${perSignora ? "⭐ Altri lavori di oggi" : "⭐ Rifiniture a camera libera e lavori extra"}</div><div class="tess-griglia">${extra.map(p => tesseraLavoro(p, perSignora)).join("")}</div>` : "";
  if (!rs.length && perSignora) return `<div class="piano-eti">${esc(S.zone[z]?.breve || z)}</div><p class="muted" style="margin:6px 2px 0">Nessuna camera per questo giorno.</p>` + inPiu;
  if (rs.every(c => c.lato === "A")) return `<div class="piano-eti">${esc(S.zone[z]?.nome || z)}</div><div class="tess-griglia">${rs.map(tile).join("")}</div>` + inPiu;
  const Lc = rs.filter(c => c.lato === "L"), Rc = rs.filter(c => c.lato === "R"), Sc = rs.filter(c => c.lato !== "L" && c.lato !== "R");
  return `<div class="piano-eti">${esc(S.zone[z]?.breve || z)}</div><div class="corridoio"><div class="lato">${Lc.map(tile).join("")}</div><div class="lato">${Rc.map(tile).join("")}</div></div>` +
    (Sc.length ? `<div class="piano-eti" style="margin-top:14px">${esc(Sc[0].via || "Altre")}</div><div class="tess-griglia">${Sc.map(tile).join("")}</div>` : "") + inPiu;
}

// La schermata della signora: una camera, una lista, un giorno (lo schizzo di Michele).
// Numeri blu = la pulizia di oggi (sempre uguale); stelle oro = le 1-2 cose in più scelte per oggi, con "come si fa" sotto.
// Si tocca ogni riga quando è fatta; un tasto solo: FATTO, TUTTO. Qui non compaiono mai le parole della gestione.
function rigaSignora(r, p, stato, aperta, nonMotivo) {
  const stella = r.tipo === "stella", s = r.stella || null;
  const num = stato === "fatta" ? `<span class="sig-num fatta">${ICONA("spunta")}</span>` : stato === "non" ? `<span class="sig-num non">✕</span>` : stella ? `<span class="sig-num stella">★</span>` : `<span class="sig-num">${r.n}</span>`;
  let come = "";
  if (stella && s && stato !== "fatta") {
    const regola = regoleGov().find(x => x.id === s.regola); const mat = regola ? G.rigaMateriale(regola, camera(s.luogo || p.camera), (S.gov && S.gov.materiali) || {}) : null;
    come = `<div class="sig-come"><b>Come si fa:</b> ${esc(s.come || "")}${s.controllo ? ` <span class="sig-ctrl">(è a posto se: ${esc(s.controllo.charAt(0).toLowerCase() + s.controllo.slice(1))})</span>` : ""}${s.prodotto && !/^nessuno/.test(s.prodotto) ? `<div><b>Prodotto:</b> ${esc(s.prodotto)}</div>` : ""}${mat ? `<div><b>Qui:</b> ${esc(mat.testo)}</div>` : ""}${s.note ? `<div class="sig-nota">⚠ ${esc(s.note)}</div>` : ""}</div>`;
  }
  const sotto = [r.azione, r.sotto, r.luogoNome].filter(Boolean).join(" · ");
  const dentro = `<span class="sig-n">${num}</span><span class="sig-testo"><b>${esc(r.testo)}</b>${sotto ? `<small>${esc(sotto)}</small>` : ""}${stato === "non" ? `<small class="sig-non-perche">non fatta${nonMotivo ? ": " + esc(nonMotivo) : ""}</small>` : ""}</span>`;
  // le righe grandi dentro un blocco si leggono (il tasto è quello del blocco); le stelle e le zone si toccano una per una
  if (r.tipo === "riga" && r.blocco && r.blocco !== "zona") return `<div class="sig-riga letta ${stato || ""}">${dentro}</div>`;
  return `<button class="sig-riga ${stato || ""} ${stella ? "stella" : ""}" data-spunta="${esc(p.id)}|${esc(r.k)}" ${aperta ? "" : "disabled"} aria-pressed="${stato === "fatta"}">${dentro}</button>${come}`;
}
// Un blocco della lista: titolo grande, un solo tasto Fatto, le righe dentro, poi le stelle del blocco (da toccare una per una)
function bloccoSignora(b, p, statoRiga, motivoRiga, aperta) {
  const st = statoRiga(b.k), motivo = motivoRiga(b.k);
  const tasto = b.righe.length ? `<button class="sig-blocco-fatto ${st || ""}" data-spunta="${esc(p.id)}|${esc(b.k)}" ${aperta ? "" : "disabled"} aria-pressed="${st === "fatta"}">${st === "fatta" ? `${ICONA("spunta")}<span>Fatto</span>` : st === "non" ? `<span>✕ Non fatto</span>` : `<span>Fatto</span>`}</button>` : "";
  return `<section class="sig-box sig-blocco ${st || ""}"><div class="sig-blocco-t"><div><div class="sig-sez-t">${esc(b.nome)}</div>${st === "non" && motivo ? `<div class="sig-non-perche">${esc(motivo)}</div>` : ""}</div>${tasto}</div>
    <div class="sig-lista">${b.righe.map(r => rigaSignora(r, p, st, aperta, "")).join("")}${b.stelle.map(r => rigaSignora(r, p, statoRiga(r.k), aperta, motivoRiga(r.k))).join("")}</div></section>`;
}
function foglioInizio(f) {
  const p = S.pulizie[f.id];
  if (!p) return `<div class="inizio"><div class="inizio-top"><button class="inizio-indietro" data-chiudi>${ICONA("indietro")}<span>Le mie camere</span></button></div><h3>Lavoro non trovato</h3><p class="muted">Forse è stato tolto dal prospetto.</p></div>`;
  const c = camera(p.camera);
  const msg = messaggioDelGiorno(p.data);
  const rif = RIFIUTI.find(r => r.giorno === (L.giornoSettimana(p.data) + 1) % 7);
  const sempre = promemoriaCamera(p.camera);
  const fondo = p.origine === "governante", extra = p.tipo === "extra";
  const lista = listaDi(p), sp = spunteDi(p.id);
  const aperta = (p.stato === "da_fare" || p.stato === "in_corso") && addetta();
  const chiusa = p.stato === "fatta";
  const salvate = new Set(p.spuntate || []), nonSalvate = Object.fromEntries((p.nonFatte || []).map(x => [x.k, x.motivo || ""]));
  const statoRiga = k => chiusa ? (nonSalvate[k] != null ? "non" : salvate.has(k) || !(p.spuntate || []).length ? "fatta" : "") : sp.non[k] ? "non" : sp.fatte[k] ? "fatta" : "";
  const motivoRiga = k => chiusa ? nonSalvate[k] : sp.non[k];
  // la targa: camera, tipo di pulizia, minuti, ospite
  const tipoTesto = (fondo ? `⭐ ${p.titolo}` : extra ? p.titolo : lista ? (lista.passo.tipo === "totale" ? "Cambio completo" : c.tipo === "casa" ? "Pulizia della casa" : "Ripasso") : titoloBase(p)) + parteTesto(p);
  const minuti = lista ? lista.minuti + lista.minutiZona : (p.minuti || 0);
  // le ore standard (la paga: 8 € l'ora in albergo, 10 negli appartamenti), non il cronometro né la stima del catalogo
  const oreStd = p.minuti && p.origine !== "governante" && !extra ? `${L.testoOre(p.minuti)} · ${eur(p.importo)}` : "";
  const chi = p.ospite ? p.ospite : "";
  const quando = p.partenza ? `${chi || "l'ospite"} parte ${giornoParlato(p.data).replace(/^oggi,.*$/, "oggi")}` : (p.parteIl && p.parteIl > p.data ? `${chi || "l'ospite"} resta fino a ${L.GIORNI[L.giornoSettimana(p.parteIl)]}` : chi);
  const arrivo = p.arrivo ? `arriva ${p.ospite || "un ospite"}` : (p.prossimoArrivo && p.partenza ? `${p.prossimoArrivo === L.aggiungiGiorni(p.data, 1) ? "domani" : "il " + L.dataBreve(p.prossimoArrivo)} arriva ${p.prossimoNome || "un altro ospite"}` : "");
  const insieme = p.insieme && S.zone[p.insieme] ? `insieme a ${SIG(p.insieme)}` : "";
  // il tipo di ospite, piccolo, accanto al tipo di pulizia (Tecnici · Operai · Ospiti Booking): nessun'altra parola nuova
  const modoP = !fondo && !extra && c.tipo !== "comune" ? (lista?.passo?.modo || p.modo || "") : "";
  const modoTesto = modoP && G.MODI[modoP] ? G.MODI[modoP].breve : "";
  const sottoTarga = [tipoTesto, modoTesto, oreStd || (minuti ? `circa ${minuti} minuti` : ""), quando, arrivo, p.persone && !chi ? `${p.persone} ${p.persone === 1 ? "persona" : "persone"}` : "", insieme].filter(Boolean).join(" · ");
  // "Oggi Michele dice": i dettagli del giorno, le istruzioni dell'ospite, il messaggio del giorno
  const dice = [p.dettagli, p.istruzioni].filter(Boolean);
  const diceHtml = dice.length || msg ? `<section class="sig-box"><div class="sig-sez-t">Oggi ${esc(p.dettagliDa || msg?.da || "Michele")} dice</div>${dice.map(x => `<div class="sig-dice">${esc(x)}</div>`).join("")}${msg ? `<div class="sig-dice ${dice.length ? "secondo" : ""}">${esc(msg.testo)}</div>` : ""}</section>` : "";
  // la lista a blocchi
  let listaHtml = "";
  if (lista) {
    const nStelle = lista.stelle;
    listaHtml = `<div class="sig-guida">Cosa si fa · un tasto <b>Fatto</b> per ogni blocco${nStelle ? `, le <b>★ stelle</b> si toccano una per una` : ""}</div>` + lista.blocchi.map(b => bloccoSignora(b, p, statoRiga, motivoRiga, aperta)).join("");
    if (lista.zona.length) listaHtml += `<section class="sig-box"><div class="sig-sez-t">Scale, corridoio e lavanderia · oggi</div><div class="sig-lista">${righeZona(lista).map(r => rigaSignora(r, p, statoRiga(r.k), aperta, motivoRiga(r.k))).join("")}</div></section>`;
  } else if (p.tipo === "stelle") {
    const rg = righeGiro(p); const euroG = rg.reduce((x, r) => x + (r.stella.euro || 0), 0);
    listaHtml = `<div class="sig-guida">Le ★ stelle di oggi nelle altre camere: entra, fai la cosa scritta, tocca la riga. Niente da pulire oltre questo.${euroG ? ` In tutto <b>${eur(euroG)}</b>.` : ""}</div><section class="sig-box"><div class="sig-sez-t">Camera per camera</div><div class="sig-lista">${rg.map(r => rigaSignora(r, p, statoRiga(r.k), aperta, motivoRiga(r.k))).join("")}</div></section>`;
  } else if (fondo) {
    const r = { k: "G0", tipo: "stella", n: 1, testo: p.titolo, sotto: `${p.minuti || 0} min`, codici: [], stella: { regola: p.regola, luogo: p.camera, come: p.come || "", controllo: "", prodotto: "", note: "" } };
    listaHtml = `<section class="sig-box"><div class="sig-sez-t">Oggi in questa camera · a camera vuota${p.perche?.length ? ` · ${esc(p.perche[0])}` : ""}</div><div class="sig-lista">${rigaSignora(r, p, statoRiga("G0"), aperta, motivoRiga("G0"))}</div></section>`;
  } else {
    const passi = (p.passi && p.passi.length ? p.passi : TIPI_PULIZIA[p.tipo]?.passi || []);
    listaHtml = passi.length ? `<section class="sig-box"><div class="sig-sez-t">Cosa si fa</div><div class="sig-lista">${passi.map((x, i) => rigaSignora({ k: `P${i}`, tipo: "riga", n: i + 1, testo: x, sotto: "", codici: [] }, p, statoRiga(`P${i}`), aperta, motivoRiga(`P${i}`))).join("")}</div></section>` : "";
  }
  const sempreHtml = sempre.length ? `<section class="sig-box"><div class="sig-sez-t">Sempre in questa camera</div><div class="sig-sempre">${esc(sempre.join(" · "))}</div></section>` : "";
  const bidoni = rif && c.tipo === "casa" ? `<div class="pro-nota">${ICONA("bidone")}<span>Stasera fuori i bidoni: <b>${esc(rif.cosa.replace(/^./, ch => ch.toUpperCase()))}</b></span></div>` : "";
  let bottone = "";
  if (p.stato === "da_fare") bottone = S.regole.richiediInizio !== false && addetta()
    ? `<button class="pro-btn blu gigante" data-comincia="${esc(p.id)}">${ICONA("gioca")}<span>Comincio</span></button>`
    : `<button class="pro-btn verde gigante" data-fatta-foglio="${esc(p.id)}">${ICONA("spunta")}<span>Fatto, tutto</span></button>`;
  else if (p.stato === "in_corso") bottone = cronometroHtml(p) + `<button class="pro-btn verde gigante" data-fatta-foglio="${esc(p.id)}">${ICONA("spunta")}<span>Fatto, tutto</span></button>`;
  else if (p.stato === "fatta") bottone = `<div class="pro-tempo done">${ICONA("spunta")}<span>Pulita alle <b>${L.oraBreve(p.ora)}</b>${minutiPulizia(p) != null ? ` · ci hai messo ${esc(L.testoOre(minutiPulizia(p)))}` : ""}${p.minuti ? ` · pagata ${esc(L.testoOre(p.minuti))}, ${eur(p.importo)}` : ""} · brava!</span></div>${addetta() ? `<button class="nonna-link" data-stato-foglio="${esc(p.id)}|da_fare">Ho sbagliato, non è pulita</button>` : ""}`;
  else if (p.stato === "problema") bottone = `<div class="pro-tempo warn">${ICONA("avviso")}<span>Problema segnalato${p.nota ? ": " + esc(p.nota) : ""}</span></div><button class="pro-btn verde gigante" data-fatta-foglio="${esc(p.id)}">${ICONA("spunta")}<span>Adesso è pulita</span></button>${addetta() ? `<button class="nonna-link" data-stato-foglio="${esc(p.id)}|da_fare">Togli il problema, rimetti da pulire</button>` : ""}`;
  else if (p.stato === "non_fatta") bottone = `<div class="pro-tempo skip">${ICONA("avviso")}<span>Non fatta${p.nota ? ": " + esc(p.nota) : ""}</span></div><button class="pro-btn verde gigante" data-fatta-foglio="${esc(p.id)}">${ICONA("spunta")}<span>Adesso è pulita</span></button>${addetta() ? `<button class="nonna-link" data-stato-foglio="${esc(p.id)}|da_fare">Rimetti da pulire</button>` : ""}`;
  return `<div class="inizio sig">
    <div class="inizio-top"><button class="inizio-indietro" data-chiudi>${ICONA("indietro")}<span>Le mie camere</span></button><span class="sig-data">${esc(L.dataBreve(p.data))}</span></div>
    <div class="inizio-testa ${statoClasse(p)}"><div><div class="inizio-camera">${esc(p.tipo === "stelle" ? "⭐ Altre camere" : c.nome)}</div><div class="inizio-lavoro">${esc(p.tipo === "stelle" ? (() => { const rg = righeGiro(p); return `Le stelle di oggi · ${rg.length} ${rg.length === 1 ? "stella" : "stelle"} · ${eur(rg.reduce((x, r) => x + (r.stella.euro || 0), 0))}`; })() : sottoTarga)}</div></div>${BADGE(p)}</div>
    ${diceHtml}${listaHtml}${sempreHtml}${bidoni}
    ${bottone}
    ${aperta ? `<div class="pro-sec"><button class="nonna-link" data-non-riesco="${esc(p.id)}">Non riesco a fare una cosa</button><button class="nonna-link rosso" data-apri-motivo="${esc(p.id)}|problema">${ICONA("avviso")}C'è un problema</button></div>` : ""}
  </div>`;
}
// "Non riesco a fare una cosa": si sceglie la riga con un tocco, poi il perché con un tocco
function scegliRigaNonRiesco(p) {
  const sp = spunteDi(p.id); const righe = righeDi(p).filter(r => !sp.fatte[r.k] && !sp.non[r.k]);
  return new Promise((ok) => {
    const vecchio = $(".conferma"); if (vecchio) vecchio.remove();
    const el = document.createElement("div"); el.className = "conferma";
    el.innerHTML = `<div class="conferma-box chiusura" role="dialog"><div class="chiusura-t">${ICONA("avviso")}<span>Quale cosa non riesci a fare?</span></div>${righe.length ? `<div class="chiusura-voci sig-scelta">${righe.map(r => `<button class="big undo" data-r="${esc(r.k)}">${r.tipo === "stella" ? "★ " : r.tipo === "blocco" ? "Blocco: " : ""}${esc(r.testo)}</button>`).join("")}</div>` : `<p class="muted">Hai già toccato tutto.</p>`}<button class="big close" data-no>Lascia stare</button></div>`;
    document.body.appendChild(el);
    el.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { el.remove(); ok(b.dataset.r); });
    el.querySelector("[data-no]").onclick = () => { el.remove(); ok(null); };
    el.onclick = (e) => { if (e.target === el) { el.remove(); ok(null); } };
  });
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
    return `<section class="card"><h2 style="${g === oggi ? "color:var(--flamingo)" : ""}">${L.dataLunga(g)}${g === oggi ? " · oggi" : ""}</h2><div class="rows">${ls.map(p => `<button class="row" data-pul="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ${p.origine === "governante" ? "⭐ " : ""}${esc(p.titolo)}${p.ospite ? `<br><span class="muted">${esc(p.ospite)}</span>` : ""}</span><span class="s ${statoClasse(p)}">${esc(p.stato === "da_fare" ? "da fare" : statoTesto(p))}</span></button>`).join("")}</div></section>`;
  }).join("");
  return blocchi || `<section class="card"><h2>Niente in programma questa settimana</h2><p class="muted" style="margin:0">Le pulizie compaiono qui appena il prospetto è aggiornato.</p></section>`;
}

function vistaSoldi(z) {
  const chiave = L.settimanaCorrente();
  const t = L.totaleSettimana(S.pulizie, z, chiave, S.regole, S.controlli, S.listino), { lista, totale } = t;
  const pagato = S.pagamenti[`${z}_${chiave}`];
  const tariffa = L.listinoCompleto(S.listino).tariffe;
  const wallet = `<section class="wallet"><div class="lbl">Questa settimana · ${L.etichettaSettimana(chiave)}</div><div class="amt">${eur(totale)}</div>
    <div>${lista.length} ${lista.length === 1 ? "pulizia fatta" : "pulizie fatte"}${t.minuti ? ` · ${esc(L.testoOre(t.minuti))} standard` : ""} · ${pagato ? `<span class="pill paid">✓ Pagata ${esc(pagato.quando || "")}</span>` : `<span class="pill open">Si paga sabato alle 14</span>`}</div>
    <div class="small" style="margin-top:6px;opacity:.92">${rigaConto(t)}</div></section>`;
  const spiega = `<section class="card"><h2 style="margin:0 0 4px">Come si conta</h2><p class="muted small" style="margin:0">Ogni camera vale le sue ore standard: ${eur(tariffa.albergo)} l'ora in albergo${z === "ap" || zoneOrdinate().some(x => x.id === z && /appart/i.test(x.nome)) ? `, ${eur(tariffa.appartamenti)} l'ora negli appartamenti` : ""}. Finisci prima, prendi lo stesso. Le stelle ⭐ si pagano una a una. Se un controllo trova qualcosa non fatto, lo puoi rifare entro sabato alle 14 e non perdi niente.</p></section>`;
  const elenco = `<section class="card"><h2>Cosa hai fatto questa settimana</h2>${lista.length ? `<div class="rows">${lista.map(p => rigaPagaPulizia(p)).join("")}</div>` : `<p class="muted" style="margin:0">Ancora niente. Ogni camera che segni pulita compare qui con le sue ore e il suo importo.</p>`}</section>`;
  return wallet + elenco + spiega + vistaStorico(z);
}
function vistaStorico(z) {
  const mesi = L.storicoMensile(S.pulizie, z, S.regole, S.controlli, S.listino);
  const chiavi = Object.keys(mesi).sort().reverse();
  return `<section class="card"><h2>Storico</h2>${chiavi.length ? chiavi.map(k => { const m = mesi[k], [y, mm] = k.split("-");
    return `<div class="month"><div class="row" style="background:transparent;padding:4px 0"><b style="font:800 17px var(--f-display);text-transform:capitalize">${L.MESI[+mm - 1]} ${y}</b><span class="s">${eur(m.totale)} · ${m.n} pulizie</span></div>${Object.keys(m.settimane).sort().reverse().map(sk => { const pd = S.pagamenti[`${z}_${sk}`]; return `<div class="row"><span>Settimana ${L.etichettaSettimana(sk)} ${pd ? `<span class="pill paid">pagata</span>` : `<span class="pill open">da pagare</span>`}</span><span class="s">${eur(m.settimane[sk])}</span></div>`; }).join("")}</div>`; }).join("") : `<p class="muted" style="margin:0">Lo storico si riempie da solo, settimana dopo settimana.</p>`}</section>`;
}

// ---- controlli tra colleghe ----------------------------------------------------------
function vistaControlliCollega(z) {
  const oggi = L.oggiISO(), c = controlliOggi(z, oggi), l = L.listinoCompleto(S.listino);
  const riga = (p, fatto) => { const k = S.controlli[p.id]; const e = k ? L.esitoChePaga(k, S.regole) : null; return `<button class="row ctrl-riga ${fatto ? "fatta" : ""}" data-controlla="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ${esc(titoloLavoro(p))}<br><span class="muted">${esc(L.dataBreve(p.data))}${p.ora ? " alle " + L.oraBreve(p.ora) : ""} · ${esc(SIG(p.zona))}${(p.rifiniture || []).some(r => r.euro) ? ` · ⭐ ${(p.rifiniture || []).filter(r => r.euro).length}` : ""}</span></span><span class="s ${fatto ? "done" : "todo"}">${fatto && e ? esc(L.nomeEsito(e.esito, S.regole)) : fatto ? "fatto" : "da controllare"}</span></button>`; };
  const fatteOggi = c.fattiOggi.map(k => pulizieTutte()[k.pulizia]).filter(Boolean);
  const quando = (() => { const q = (l.controlli || {})[z] || {}; const gg = Object.entries(q).filter(([, n]) => n > 0).map(([d, n]) => `${L.GIORNI[+d]} ${n}`); return gg.join(", "); })();
  const spiega = `<section class="card"><h2 style="margin:0 0 4px">I controlli li fai tu</h2><p class="muted small" style="margin:0">Guardi le camere che la collega ha segnato pulite e rispondi SÌ o NO a una lista fissa, con la foto quando dici NO. Il voto lo fa l'app. Prendi ${eur(l.controllo)} per ogni camera controllata. Giorni: ${esc(quando || "nessuno")}.</p></section>`;
  let corpo;
  if (!c.quota && !fatteOggi.length) corpo = `<section class="card"><h2>Oggi niente controlli</h2><p class="muted" style="margin:0">I tuoi controlli sono ${esc(quando || "da decidere")}. Le camere te le dice l'app quella mattina.</p></section>`;
  else corpo = `<section class="card"><h2>Oggi controlli ${c.daFare.length + fatteOggi.length ? `(${fatteOggi.length} su ${c.quota})` : ""}</h2>${c.daFare.length ? `<p class="muted small" style="margin:0 0 6px">Scelte a sorte stamattina. Tocca una camera e rispondi alle domande.</p><div class="rows">${c.daFare.map(p => riga(p, false)).join("")}</div>` : fatteOggi.length >= c.quota ? `<p class="muted" style="margin:0">Controlli di oggi fatti. Grazie!</p>` : `<p class="muted" style="margin:0">Appena la collega segna pulita una camera, qui compare quale controllare.</p>`}${fatteOggi.length ? `<div class="floorlabel" style="margin-top:10px">Fatti oggi</div><div class="rows">${fatteOggi.map(p => riga(p, true)).join("")}</div>` : ""}</section>`;
  return spiega + corpo;
}
// La card in cima alla giornata della signora: "Oggi controlli: Alba e Fenicotteri"
function cardControlliOggi(z) {
  if (!sonoControllatrice()) return "";
  const c = controlliOggi(z, L.oggiISO()); if (!c.quota) return "";
  const n = c.daFare.length;
  if (!n) return c.fattiOggi.length ? `<section class="card ctrl-card fatta"><div class="ctrl-card-t">${ICONA("spunta")}<b>Controlli di oggi fatti</b></div><div class="muted small">${c.fattiOggi.length} su ${c.quota}. Grazie!</div></section>` : `<section class="card ctrl-card"><div class="ctrl-card-t">${ICONA("lista")}<b>Oggi hai ${c.quota} ${c.quota === 1 ? "controllo" : "controlli"} da fare</b></div><div class="muted small">Appena la collega segna pulita una camera, qui ti dico quale guardare.</div></section>`;
  return `<section class="card ctrl-card"><div class="ctrl-card-t">${ICONA("lista")}<b>Oggi controlli: ${esc(c.daFare.map(p => camera(p.camera).nome).join(" e "))}</b></div><div class="muted small" style="margin-bottom:8px">Scelte a sorte stamattina. ${eur(L.listinoCompleto(S.listino).controllo)} l'una.</div><div class="rows">${c.daFare.map(p => `<button class="row" data-controlla="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ${esc(titoloLavoro(p))}<br><span class="muted">${esc(SIG(p.zona))} · ${esc(L.dataBreve(p.data))}${(p.rifiniture || []).some(r => r.euro) ? ` · ⭐ ${(p.rifiniture || []).filter(r => r.euro).length} stelle da confermare` : ""}</span></span><span class="s todo">Controlla</span></button>`).join("")}</div></section>`;
}
// Le icone dei punti del controllo (disegnini grandi, a prova di nonna)
const ICONE_PUNTI = { letto: "🛏️", wc: "🚽", lavandino: "🚰", doccia: "🚿", asciugamani: "🧻", cestino: "🗑️", polvere: "🧽", pavimento: "🧹", finestra: "🪟", scale: "🪜", porta: "🚪", richiesta: "📝", stella: "⭐" };
// Le stelle che la signora ha segnato fatte in quella pulizia, con la riga del catalogo "com'è fatta bene"
function stelleDaControllare(p) {
  return (p.rifiniture || []).filter(r => r.regola).map(r => { const reg = regoleGov().find(x => x.id === r.regola) || G.CATALOGO.find(x => x.id === r.regola) || {}; return { k: `${r.regola}|${r.luogo || p.camera}`, regola: r.regola, nome: r.nome || reg.nome || r.regola, euro: Number(r.euro) || 0, come: reg.controllo || reg.come || "", luogo: r.luogo || p.camera }; });
}
function foglioControllo(f) {
  const p = S.pulizie[f.id] || S.fattiAltrui[f.id];
  if (!p) return `<h3>Lavoro non trovato</h3>`;
  const c = S.controlli[f.id] || {};
  const mio = f.modo === "proprietario";
  if (!f.punti) f.punti = { ...(mio ? (c.puntiProprietario || c.punti || {}) : (c.punti || {})) };
  if (!f.stelle) f.stelle = JSON.parse(JSON.stringify(mio ? (c.stelleProprietario || c.stelle || {}) : (c.stelle || {})));
  f.foto = f.foto || {};
  const lista = L.puntiControlloPer(p, sempreDi(p)), standard = lista.filter(x => !x.richiesta), richieste = lista.filter(x => x.richiesta);
  const stelle = stelleDaControllare(p);
  const punteggio = L.punteggioControllo(f.punti, lista), esito = L.esitoDaPunteggio(punteggio, S.regole);
  const senzaRisposta = L.puntiSenzaRisposta(f.punti, lista).length + richieste.filter(x => f.punti[x.id] == null).length + stelle.filter(st => !f.stelle[st.k] || f.stelle[st.k].ok == null).length;
  const fotoManca = [...lista.filter(x => (x.richiesta ? f.punti[x.id] === false : f.punti[x.id] === false) && !f.foto[x.id] && !(c.foto || {})[x.id]).map(x => x.id), ...stelle.filter(st => f.stelle[st.k] && f.stelle[st.k].ok === false && !f.foto["stella:" + st.k] && !(c.foto || {})["stella:" + st.k]).map(st => "stella:" + st.k)];
  const cam = camera(p.camera);
  const perc = L.percEsito(esito, S.regole), quota = Number(p.importo) || 0;
  const riga = (x) => { const v = f.punti[x.id]; const no = v === false, si = v === true; const fid = x.id; const haFoto = !!f.foto[fid] || !!(c.foto || {})[fid];
    return `<div class="ctrl-punto ${si ? "si" : no ? "no" : ""}"><div class="ctrl-icona">${ICONE_PUNTI[x.icona || (x.richiesta ? "richiesta" : "")] || "✔️"}</div><div class="ctrl-testo"><b>${esc(x.breve || (x.richiesta ? "Richiesta di Michele" : ""))}${x.grave ? ` <span class="ctrl-grave">grave</span>` : ""}</b><div>${esc(x.testo)}</div>${no ? `<div class="ctrl-foto">${haFoto ? `<span class="ctrl-foto-ok">📷 foto fatta</span>` : `<label class="pro-btn rosso piccolo">📷 Fai la foto<input type="file" accept="image/*" capture="environment" hidden data-foto-punto="${esc(fid)}"></label><span class="muted small">senza foto il NO non vale</span>`}</div>` : ""}</div><div class="ctrl-sino"><button class="ctrl-si ${si ? "on" : ""}" data-punto-si="${esc(x.id)}">SÌ</button><button class="ctrl-no ${no ? "on" : ""}" data-punto-no="${esc(x.id)}">NO</button></div></div>`; };
  const rigaStella = (st) => { const v = f.stelle[st.k]; const ok = v && v.ok === true, ko = v && v.ok === false; const fid = "stella:" + st.k; const haFoto = !!f.foto[fid] || !!(c.foto || {})[fid];
    return `<div class="ctrl-punto stella ${ok ? "si" : ko ? "no" : ""}"><div class="ctrl-icona">⭐</div><div class="ctrl-testo"><b>${esc(st.nome)}${st.euro ? ` · ${eur(st.euro)}` : ""}</b><div>${esc(st.come || "Com'è fatta bene: guarda che sia davvero fatta")}</div>${ko ? `<div class="ctrl-foto">${haFoto ? `<span class="ctrl-foto-ok">📷 foto fatta</span>` : `<label class="pro-btn rosso piccolo">📷 Fai la foto<input type="file" accept="image/*" capture="environment" hidden data-foto-punto="${esc(fid)}"></label><span class="muted small">senza foto non vale</span>`}</div>` : ""}</div><div class="ctrl-sino"><button class="ctrl-si ${ok ? "on" : ""}" data-stella-si="${esc(st.k)}">Fatta</button><button class="ctrl-no ${ko ? "on" : ""}" data-stella-no="${esc(st.k)}">Non fatta</button></div></div>`; };
  const esitoTesto = esito === "bene" ? `Bene: tutto pagato (${eur(quota)})` : esito === "cosicosi" ? `Così così: questa camera vale il 20% in meno (${eur(Math.round(quota * perc) / 100)} invece di ${eur(quota)})` : `Male: questa camera vale la metà (${eur(Math.round(quota * perc) / 100)} invece di ${eur(quota)}) e c'è il richiamo`;
  const stelleKo = stelle.filter(st => f.stelle[st.k] && f.stelle[st.k].ok === false);
  const pronto = !senzaRisposta && !fotoManca.length;
  const prima = !mio && c.esito ? `<div class="note info">Controllo già fatto da ${esc(SIG(c.zonaControllatrice))}: ${esc(L.nomeEsito(L.esitoChePaga(c, S.regole).esito, S.regole))}. Se lo rifai, vale il tuo.</div>` : mio && c.esito ? `<div class="note info">La collega (Signora ${esc(S.zone[c.zonaControllatrice]?.breve || "")}) ha detto: <b>${esc(L.nomeEsito(c.esito, S.regole))}</b>${c.punteggio ? ` (${c.punteggio} punti)` : ""}. Il tuo controllo vale sopra il suo: se tu trovi dei NO dove lei ha detto Bene, lei perde ${eur(L.listinoCompleto(S.listino).controllo)}.</div>` : "";
  return `<div class="ctrl-top"><h3 style="margin:0">${esc(cam.nome)}</h3><div class="muted">${esc(L.dataLunga(p.data))} · ${esc(titoloLavoro(p))} · pulita da ${esc(SIG(p.zona))}${p.ora ? " alle " + L.oraBreve(p.ora) : ""}</div></div>
    ${prima}
    <p class="ctrl-aiuto">Guarda e rispondi: <b>SÌ</b> se è a posto, <b>NO</b> se non lo è. Quando dici NO, fai la foto. Il voto lo calcola l'app.</p>
    <div class="ctrl-lista">${standard.map(riga).join("")}</div>
    ${richieste.length ? `<div class="floorlabel" style="margin-top:12px">Le richieste di Michele per questa camera</div><div class="ctrl-lista">${richieste.map(riga).join("")}</div>` : ""}
    ${stelle.length ? `<div class="floorlabel" style="margin-top:12px">Le stelle che ha segnato fatte</div><p class="muted small" style="margin:0 0 6px">Per ognuna c'è scritto com'è fatta bene. Una stella non fatta non si paga e si toglie una seconda volta (se non la rifà entro sabato alle 14).</p><div class="ctrl-lista">${stelle.map(rigaStella).join("")}</div>` : ""}
    <div class="ctrl-esito ${esito}"><div class="ctrl-esito-t">${senzaRisposta ? `Mancano ${senzaRisposta} risposte` : esito === "bene" ? "✅ Bene" : esito === "cosicosi" ? "🟡 Così così" : "🔴 Male"}</div><div class="small">${senzaRisposta ? "Rispondi a tutte le righe." : esc(esitoTesto)}${!senzaRisposta && punteggio ? ` · ${punteggio} ${punteggio === 1 ? "punto" : "punti"}` : ""}${stelleKo.length ? ` · ${stelleKo.length} ${stelleKo.length === 1 ? "stella non fatta" : "stelle non fatte"} (−${eur(stelleKo.reduce((x, st) => x + 2 * st.euro, 0))})` : ""}${fotoManca.length ? `<br><b>Manca la foto</b> su ${fotoManca.length} NO.` : ""}</div></div>
    <button class="big ok" id="salvaControllo" ${pronto ? "" : "disabled"}>${mio ? "Conferma il mio controllo" : "Conferma il controllo"}</button>`;
}
async function salvaControllo(f) {
  const p = S.pulizie[f.id] || S.fattiAltrui[f.id]; if (!p) return;
  const lista = L.puntiControlloPer(p, sempreDi(p));
  const punti = f.punti || {}, stelle = f.stelle || {};
  const punteggio = L.punteggioControllo(punti, lista), esito = L.esitoDaPunteggio(punteggio, S.regole);
  const nonFatte = L.richiesteNonFatte(punti, lista);
  const c = S.controlli[f.id] || {};
  const listaSalvata = lista.map(x => ({ id: x.id, testo: x.testo, breve: x.breve || "", grave: !!x.grave, richiesta: !!x.richiesta }));
  const fotoRef = { ...(c.foto || {}) }; for (const k of Object.keys(f.foto || {})) fotoRef[k] = true;
  const votoEq = esito === "bene" ? 10 : esito === "cosicosi" ? 6 : 3; // per leggere i vecchi riepiloghi
  const base = { pulizia: p.id, camera: p.camera, data: p.data, zonaControllata: p.zona, richieste: lista.filter(x => x.richiesta).map(x => x.testo), lista: listaSalvata, foto: fotoRef };
  let dati;
  if (f.modo === "proprietario") {
    const smentito = !!(c.esito === "bene" && esito !== "bene") || !!(c.esito && c.esito !== "male" && esito === "male");
    dati = { ...base, zonaControllatrice: c.zonaControllatrice || "proprietario", puntiProprietario: punti, stelleProprietario: stelle, punteggioProprietario: punteggio, esitoProprietario: esito, votoProprietario: votoEq, nonFatteProprietario: nonFatte, proprietario: S.utente.nome || S.utente.login || "", oraProprietario: S.db.adesso(), smentito: smentito || !!c.smentito, smentitaOra: smentito ? S.db.adesso() : (c.smentitaOra || null) };
  } else dati = { ...base, zonaControllatrice: S.utente.zona, controllatrice: S.utente.nome || S.utente.login || "", punti, stelle, punteggio, esito, voto: votoEq, nonFatte, ora: S.db.adesso(), settimana: L.chiaveSettimana(new Date(), S.regole.chiusuraPaga) };
  try {
    for (const [k, dataUrl] of Object.entries(f.foto || {})) await S.db.salva("foto", `ctrl_${p.id}_${k.replace(/[^A-Za-z0-9_|:-]/g, "")}`, { pulizia: p.id, camera: p.camera, zona: p.zona, data: p.data, punto: k, dati: dataUrl, ora: S.db.adesso(), da: S.utente.nome || S.utente.email || "" }, false);
    await S.db.salva("controlli", f.id, dati, true); chiudiFoglio();
    toast(esito === "bene" ? "Controllo salvato: Bene" : esito === "cosicosi" ? "Controllo salvato: Così così" : "Controllo salvato: Male");
    if (S.impControlli && S.impControlli.daControllare && S.impControlli.daControllare[p.camera] && proprietario()) { const dc = { ...S.impControlli.daControllare }; delete dc[p.camera]; S.db.salva("impostazioni", "controlli", { ...S.impControlli, daControllare: dc }, true).catch(() => {}); } }
  catch (e) { erroreScrittura(e); }
}
// La signora controllata rifà quello che è stato bocciato: "Rifatto" con la foto, entro sabato alle 14
async function segnaRifatto(controlloId, voce, dataUrl) {
  const c = S.controlli[controlloId]; if (!c) return;
  try {
    if (dataUrl) await S.db.salva("foto", `rif_${controlloId}_${voce.replace(/[^A-Za-z0-9_|:-]/g, "")}`, { pulizia: controlloId, camera: c.camera, zona: c.zonaControllata, data: c.data, punto: voce, dati: dataUrl, ora: S.db.adesso(), da: S.utente.nome || S.utente.email || "" }, false);
    await S.db.salva("controlli", controlloId, { rifatti: { ...(c.rifatti || {}), [voce]: { ora: S.db.adesso(), foto: !!dataUrl, da: S.utente.nome || "" } } }, true);
    toast("Segnato come rifatto. Grazie!");
  } catch (e) { erroreScrittura(e); }
}
// La card "Da rifare entro sabato alle 14" in cima alla giornata della signora
function cardDaRifare(z) {
  const lista = L.daRifare(S.controlli, z, S.regole, new Date()); if (!lista.length) return "";
  const righe = lista.map(({ controllo: c, voci, scade }) => `<div class="rif-blocco"><div class="rif-t"><b>${esc(camera(c.camera).nome)}</b> · ${esc(L.dataBreve(c.data))} · entro ${esc(L.GIORNI[scade.getDay()])} alle ${scade.getHours()}</div>${voci.map(v => `<div class="rif-voce"><span>${v.tipo === "stella" ? "⭐ " : ""}${esc(v.testo)}${v.euro ? ` <span class="muted small">(${eur(v.euro)})</span>` : ""}<br><span class="muted small">${v.tipo === "stella" ? "non fatta: rifalla e fai la foto" : "non a posto: sistemalo e fai la foto"}</span></span><label class="pro-btn verde piccolo">📷 Rifatto<input type="file" accept="image/*" capture="environment" hidden data-rifatto="${esc(c.pulizia)}|${esc(v.id)}"></label></div>`).join("")}</div>`).join("");
  return `<section class="card rif-card"><div class="ctrl-card-t">${ICONA("avviso")}<b>Da rifare entro sabato alle 14</b></div><p class="muted small" style="margin:0 0 8px">Il controllo ha trovato queste cose non a posto. Se le rifai in tempo e mandi la foto, non perdi niente.</p>${righe}</section>`;
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
  else if (v === "manutenzione") corpo = vistaManutenzione();
  else if (v === "governante") corpo = vistaGovernante();
  else if (v === "signora") corpo = vistaSignora(S.sigZona || zoneOrdinate()[0].id);
  else corpo = vistaOggiGestione();
  return tabs + corpo;
}

function vistaOggiGestione() {
  const iso = S.giorno;
  const blocchi = signore().map(z => {
    const ls = pulizieDelGiorno(iso, z.id);
    if (!ls.length) return `<section class="card zone"><div class="head"><h2 style="margin:0">${esc(z.nome)}</h2><span class="muted">niente</span></div></section>`;
    const f = ls.filter(p => p.stato === "fatta").length;
    return `<section class="card zone"><div class="head"><h2 style="margin:0">${esc(z.nome)}${ls.some(p => problemaAperto(p)) ? `<span class="led" role="img" aria-label="c'è un problema"></span>` : ""}</h2><b>${f}/${ls.length}</b></div><div class="bar"><i style="width:${Math.round(f / ls.length * 100)}%"></i></div>
      <div class="rows">${ls.map(p => `<button class="row" data-pul="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ${p.origine === "governante" ? "⭐ " : ""}${esc(titoloLavoro(p))}${p.ospite ? ` · <span class="muted">${esc(p.ospite)}</span>` : ""}${p.stato === "fatta" && p.ora ? `<br><span class="muted">${L.oraBreve(p.ora)}${minutiPulizia(p) != null ? " · " + minutiPulizia(p) + " min" : ""}</span>` : p.stato === "in_corso" ? `<br><span class="muted">dalle ${L.oraBreve(p.inizio)}</span>` : ""}${p.dettagli ? `<br><span class="dett-mini">${ICONA("nota")}${esc(p.dettagli)}</span>` : ""}${p.nota ? `<br><span class="muted">“${esc(p.nota)}”</span>` : ""}</span>${BADGE(p)}</button>`).join("")}</div></section>`;
  }).join("");
  const avviso = bloccoSignoreELavori(iso);
  const bottone = puoModificare() ? `<section class="card flat"><button class="big undo" data-whatsapp-piano="${iso}">Manda il piano di ${esc(quandoEtichetta(iso).toLowerCase())} su WhatsApp</button><button class="big main" data-nuovo-lavoro>+ Aggiungi un lavoro extra</button><button class="big undo" data-dettatura>🗣️ Dimmi il prospetto (scrivi o detta chi arriva)</button></section>` : "";
  const msg = messaggioDelGiorno(iso);
  const messaggio = `<section class="card msg-card"><div class="head"><h2 style="margin:0">Messaggio alle signore</h2>${puoModificare() ? `<button class="btnsm ${msg ? "ghost" : ""}" data-msg-giorno="${iso}">${msg ? "Cambia" : "Scrivi"}</button>` : ""}</div>
    ${msg ? `<div class="pro-msg-x" style="margin-top:6px">${esc(msg.testo)}</div><p class="muted small" style="margin:6px 0 0">Scritto da ${esc(msg.da || "")}${msg.ora ? " alle " + L.oraBreve(msg.ora) : ""} · lo vedono in cima alla loro schermata</p>` : `<p class="muted small" style="margin:6px 0 0">Nessun messaggio per ${esc(quandoEtichetta(iso).toLowerCase())}. Qui puoi scrivere due righe che le signore vedono in grande (es. orari di arrivo, cose da ricordare). I dettagli di una singola camera si scrivono toccando la camera.</p>`}</section>`;
  return `<section class="card flat"><h2 style="margin:0">${L.dataLunga(iso)}</h2><p class="muted small" style="margin:0">Tocca una riga per i dettagli. Le pulizie si creano da sole dal prospetto.</p></section>` + (puoModificare() && iso === L.oggiISO() ? (casaAttiva() ? "" : cardConsuela()) + cardChat() : "") + messaggio + avviso + blocchi + bottone;
}

// ---- le signore (avatar) e i lavori di manutenzione, in cima a Oggi ----------------------
function bloccoSignoreELavori(iso) {
  const aperti = lavoriAperti();
  const chi = signore().map(z => {
    const ls = pulizieDelGiorno(iso, z.id), f = ls.filter(p => p.stato === "fatta").length;
    const prob = ls.some(p => problemaAperto(p)) || aperti.some(m => m.zona === z.id && m.fonte === "signora" && m.data >= L.aggiungiGiorni(L.oggiISO(), -7));
    return `<button class="piastra sig-plate" data-signora="${z.id}" aria-label="${esc(SIG(z.id))}: cosa fa questa settimana">${avatarZona(z.id, "piccola")}<span class="sig-nome">${esc(SIG(z.id))}</span><span class="sig-sotto">${ls.length ? `${f}/${ls.length} ${quandoEtichetta(iso) === "Oggi" ? "oggi" : L.dataBreve(iso)}` : "libera"}${prob ? `<span class="led mini" role="img" aria-label="problema"></span>` : ""}</span></button>`;
  }).join("");
  return `<section class="card flat sig-blocco"><div class="sig-griglia">${chi}</div>
    ${plateGovernante()}
    <button class="piastra p-grafite man-plate" data-vista="manutenzione">${ICONA("attrezzi")}<span class="man-testo"><b>Lavori di manutenzione</b><span>${aperti.length ? `${aperti.length} da fare` : "niente in sospeso"}</span></span>${aperti.length ? `<span class="led" role="img" aria-label="lavori da fare"></span>` : ""}<span class="man-freccia">›</span></button></section>`;
}

// ---- Manutenzione: tutti i problemi e i lavori da fare, in un posto solo -----------------
function vistaManutenzione() {
  const aperti = lavoriAperti(), fatti = lavoriFatti();
  const riga = (m) => { const c = m.camera ? camera(m.camera) : null; const p = m.pulizia ? S.pulizie[m.pulizia] : null;
    return `<button class="row man-riga" data-man="${esc(m.id)}"><span>${c ? `<b>${esc(c.nome)}</b> · ` : ""}<b>${esc(m.titolo || "Lavoro")}</b>${m.nota ? `<br><span class="muted">${esc(m.nota)}</span>` : ""}<br><span class="muted small">${m.stato === "fatto" ? `Fatto ${m.fatto ? esc(L.dataGiornoLungo(m.fatto.slice(0, 10))) : ""}${m.fattoDa ? " da " + esc(m.fattoDa) : ""} · ` : ""}segnalato ${esc(L.dataGiornoLungo(m.data || m.creato?.slice(0, 10) || L.oggiISO()))}${m.da ? " da " + esc(m.da) : ""}${m.foto ? " · 📷 foto" : ""}${p && p.stato !== "problema" ? " · camera poi ripulita" : ""}</span></span>${m.stato === "fatto" ? `<span class="badge done">Fatto</span>` : `<span class="badge warn">Da fare</span>`}</button>`; };
  return `<section class="card flat man-testa"><button class="nonna-link indietro" data-vista="oggi">${ICONA("indietro")}Oggi</button><h2 style="margin:8px 0 0">${ICONA("attrezzi")} Lavori di manutenzione</h2><p class="muted small" style="margin:2px 0 0">Qui finisce tutto quello che si rompe o va sistemato: i problemi che segnalano le signore (restano anche dopo che la camera è stata ripulita) e i lavori che aggiungi tu. Tocca una riga per i dettagli e per segnarla fatta.</p></section>
  <section class="card"><div class="head" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 style="margin:0">${aperti.length ? `<span class="led" role="img" aria-label="da fare"></span>` : ""}Da fare <span class="muted">· ${aperti.length}</span></h2>${puoModificare() ? `<button class="btnsm" data-nuovo-man>+ Lavoro</button>` : ""}</div>
    ${aperti.length ? `<div class="rows" style="margin-top:10px">${aperti.map(riga).join("")}</div>` : `<p class="muted" style="margin:10px 0 0">Niente da sistemare. Quando una signora segnala un problema, compare qui.</p>`}</section>
  ${fatti.length ? `<section class="card"><details><summary>Fatti (${fatti.length})</summary><div class="rows" style="margin-top:8px">${fatti.slice(0, 40).map(riga).join("")}</div></details></section>` : ""}`;
}
function foglioManutenzione(f) {
  const m = S.manutenzione[f.id]; if (!m) return `<h3>Lavoro</h3><p class="muted">Non c'è più.</p>`;
  const c = m.camera ? camera(m.camera) : null, p = m.pulizia ? S.pulizie[m.pulizia] : null;
  const foto = f.foto === undefined && m.foto && m.pulizia ? (caricaFotoManutenzione(f), `<p class="muted small">Carico la foto…</p>`) : f.foto ? `<img src="${f.foto}" alt="Foto del problema" style="width:100%;border-radius:14px;margin:8px 0">` : "";
  return `<h3>${c ? esc(c.nome) : "Lavoro"}</h3><div class="muted">${esc(m.titolo || "")}</div>
    <div class="kind ${m.stato === "fatto" ? "money" : ""}">${m.stato === "fatto" ? `✓ Fatto ${m.fatto ? esc(L.dataGiornoLungo(m.fatto.slice(0, 10))) : ""}${m.fattoDa ? " da " + esc(m.fattoDa) : ""}` : m.stato === "chiamato" ? `Tecnico chiamato ${m.chiamato ? esc(L.dataBreve(m.chiamato)) : ""}` : "Da fare"}</div><span class="kind info">segnalato ${esc(L.dataGiornoLungo(m.data || L.oggiISO()))}${m.da ? " da " + esc(m.da) : ""}</span>
    ${p ? `<p class="muted small" style="margin:8px 0 0">Camera ${p.stato === "problema" ? "ancora ferma sul problema" : "poi ripulita (" + esc(statoTesto(p)) + ")"} · <button class="nonna-link" style="min-height:0;padding:4px 10px;margin:0" data-pul="${esc(p.id)}">apri la pulizia</button></p>` : ""}
    ${foto}
    <div class="campo"><label for="manNota">Note (cosa serve, chi chiamare, cosa hai fatto)</label><textarea id="manNota" data-keep placeholder="es. chiamato l'idraulico, viene martedì">${esc(m.nota || "")}</textarea></div>
    ${puoModificare() ? `<button class="big undo" data-man-salva-nota="${esc(m.id)}">Salva le note</button>
    ${m.stato === "fatto" ? `<button class="big skip" data-man-riapri="${esc(m.id)}">Riapri: non è a posto</button>` : `<button class="big ok" data-man-riparato="${esc(m.id)}">${ICONA("spunta")} Fatto, sistemato</button>`}
    <button class="big undo" data-man-cancella="${esc(m.id)}">Cancella questa voce</button>` : ""}`;
}
async function caricaFotoManutenzione(f) {
  try { const d = await S.db.leggi("foto", S.manutenzione[f.id]?.pulizia); f.foto = d?.dati || ""; } catch (e) { f.foto = ""; }
  if (S.foglio === f) disegnaFoglio();
}
function foglioNuovoLavoroMan(f) {
  return `<h3>Nuovo lavoro di manutenzione</h3><div class="muted">Qualcosa da riparare o sistemare (non una pulizia: per quelle c'è "lavoro extra").</div>
    <form id="formMan">
      <div class="campo"><label for="mTit">Cosa c'è da fare</label><input id="mTit" type="text" placeholder="es. Cambiare la lampadina del bagno" required></div>
      <div class="campo"><label for="mCam">Dove</label><select id="mCam"><option value="">— nessuna camera in particolare —</option>${S.camere.map(c => `<option value="${c.id}" ${f.camera === c.id ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select></div>
      <div class="campo"><label for="mNota">Note</label><textarea id="mNota" placeholder="facoltative"></textarea></div>
      <button class="big main" type="submit">Aggiungi</button>
    </form>`;
}
async function salvaNuovoLavoroMan() {
  const titolo = $("#mTit").value.trim(); if (!titolo) return;
  const cam = $("#mCam").value; const c = cam ? camera(cam) : null;
  const id = `man_${Date.now()}`;
  const voce = { pulizia: null, camera: cam || null, zona: c ? c.zona : null, data: L.oggiISO(), titolo, nota: $("#mNota").value.trim(), da: S.utente.nome || "", fonte: "mano", foto: false, stato: "aperto", creato: S.db.adesso(), fatto: null, fattoDa: "" };
  chiudiFoglio();
  try { await S.db.salva("manutenzione", id, voce, false); toast("Lavoro aggiunto"); } catch (e) { erroreScrittura(e); }
}
async function aggiornaManutenzione(id, patch, msg) {
  if (!S.manutenzione[id]) return;
  Object.assign(S.manutenzione[id], patch); disegna();
  try { await S.db.aggiorna("manutenzione", id, patch); if (msg) toast(msg); } catch (e) { erroreScrittura(e); }
}

// ---- La signora: cosa fa e cosa deve fare questa settimana ------------------------------
function vistaSignora(z) {
  const zona = S.zone[z] || { nome: z, breve: z }; const lun = S.sigSett; const oggi = L.oggiISO();
  const giorni = []; for (let i = 0; i < 7; i++) giorni.push(L.aggiungiGiorni(lun, i));
  const tutte = giorni.flatMap(g => pulizieDelGiorno(g, z));
  const fatte = tutte.filter(p => p.stato === "fatta").length, problemi = tutte.filter(p => problemaAperto(p)).length;
  const chiavePaga = L.chiaveSettimana(new Date(giorni[3] + "T12:00:00"), S.regole.chiusuraPaga);
  const paga = L.totaleSettimana(S.pulizie, z, chiavePaga, S.regole, S.controlli);
  const ctrl = L.zonaControllatrice(S.impControlli, chiavePaga, signore().map(x => x.id)) === z;
  const camere = camereZona(z).map(c => c.nome).join(", ");
  const giornoCard = (g) => { const ls = pulizieDelGiorno(g, z); const msg = messaggioDelGiorno(g); const et = quandoEtichetta(g);
    return `<section class="card sig-giorno ${g === oggi ? "oggi" : ""} ${g < oggi ? "passato" : ""}"><div class="head" style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="margin:0">${esc(L.dataLunga(g).replace(/^./, ch => ch.toUpperCase()))}${["Oggi", "Domani", "Ieri"].includes(et) ? ` <span class="muted">· ${et.toLowerCase()}</span>` : ""}</h2>${ls.length ? `<b>${ls.filter(p => p.stato === "fatta").length}/${ls.length}</b>` : `<span class="muted">niente</span>`}</div>
      ${msg ? `<div class="note info" style="margin:8px 0 0">📣 ${esc(msg.testo)}</div>` : ""}
      ${ls.length ? `<div class="rows" style="margin-top:8px">${ls.map(p => `<button class="row" data-pul="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ${p.origine === "governante" ? "⭐ " : ""}${esc(titoloLavoro(p))}${p.minuti && p.origine === "governante" ? ` <span class="muted">· ${p.minuti} min</span>` : ""}${p.stato !== "fatta" && testoRifiniture(p) ? ` <span class="muted">· ${esc(testoRifiniture(p))}</span>` : testoStelleFatte(p) ? ` <span class="muted">· ${esc(testoStelleFatte(p))}</span>` : ""}${p.ospite ? ` · <span class="muted">${esc(p.ospite)}</span>` : ""}${p.partenza ? ` <span class="el-pill out">parte</span>` : ""}${p.arrivo ? ` <span class="el-pill in">arriva</span>` : ""}${p.stato === "fatta" && p.ora ? `<br><span class="muted">alle ${L.oraBreve(p.ora)}${minutiPulizia(p) != null ? " · " + minutiPulizia(p) + " min" : ""} · ${eur(p.importo)}</span>` : ""}${p.dettagli ? `<br><span class="dett-mini">${ICONA("nota")}${esc(p.dettagli)}</span>` : ""}${p.nota ? `<br><span class="muted">“${esc(p.nota)}”</span>` : ""}</span>${BADGE(p)}</button>`).join("")}</div>` : ""}</section>`; };
  return `<section class="card flat"><button class="nonna-link indietro" data-vista="oggi">${ICONA("indietro")}Oggi</button></section>
  <section class="pro-testa sig-testa"><div class="pro-ciao"><div class="pro-ciao-testo"><div class="pro-saluto">${esc(SIG(zona.id))}</div><div class="pro-frase">${esc(camere)}${ctrl ? `<br>Questa settimana è lei la controllatrice.` : ""}</div></div>${avatarZona(z, "media")}</div>
    <div class="pro-riepilogo"><div class="pro-num">${"<b>" + tutte.length + "</b>"}<span>camere</span></div><div class="pro-num done"><b>${fatte}</b><span>pulite</span></div><div class="pro-num todo"><b>${tutte.length - fatte}</b><span>da fare</span></div><div class="pro-num ${problemi ? "warn" : ""}"><b>${problemi}</b><span>problemi</span></div></div>
    <div class="pro-data-riga"><div class="pro-data">${ICONA("euro")}<span>Paga della settimana: <b>${eur(paga.totale)}</b>${paga.bonus?.importo ? ` (con bonus controlli)` : ""}</span></div></div></section>
  <section class="card flat"><div class="navmese"><button data-sig-sett="-1" aria-label="Settimana prima">‹</button><b style="text-transform:none">${esc(L.etichettaSettimana(L.aggiungiGiorni(lun, 6)))}</b><button data-sig-sett="1" aria-label="Settimana dopo">›</button></div></section>
  ${giorni.map(giornoCard).join("")}
  ${puoModificare() ? `<section class="card flat"><button class="big main" data-whatsapp-settimana="${z}">Mandale il piano della settimana su WhatsApp</button><button class="big undo" data-nuovo-lavoro-zona="${z}">+ Aggiungi un lavoro extra</button><button class="big undo" data-come-signora="${z}">👩‍🔧 Guarda l'app come la vede lei</button></section>` : ""}`;
}
function testoPianoSettimana(z, lun) {
  const righe = [`🧹 Piano della settimana ${L.etichettaSettimana(L.aggiungiGiorni(lun, 6))} · ${tagZona(z)}`];
  for (let i = 0; i < 7; i++) { const g = L.aggiungiGiorni(lun, i); const ls = pulizieDelGiorno(g, z); if (!ls.length) continue; righe.push("", `📅 ${L.dataLunga(g)}`); const msg = messaggioDelGiorno(g); if (msg) righe.push(`📣 ${msg.testo}`); ls.forEach(p => righe.push(rigaCameraAvviso(p))); }
  if (righe.length === 1) righe.push("", "Nessuna pulizia in programma.");
  return righe.join("\n");
}

// ============================================================================
//  LA GOVERNANTE (schermate). La testa sta in governante.js.
// ============================================================================
function regoleGov() { return G.regoleAttive(S.gov); }
// 0.41: la governante ha un nome. Michele glielo cambia in Governante → Regole.
const NOMI_GOV = ["Sofia", "Sveva", "Lesia", "Daunia", "Perla", "Consuela", "Rosa", "Stella"];
function nomeGov() { const n = (S.gov && String(S.gov.nome || "").trim()) || ""; return n || "Consuela"; }
// Il nome di chi è entrato, per il saluto ("Buongiorno Michele!")
function nomeMio() { const n = String(S.utente?.nome || "").trim().split(/\s+/)[0]; const v = n && !/^prova/i.test(n) ? n : "Michele"; return v.charAt(0).toUpperCase() + v.slice(1); }
// Una spinta al giorno, senza IA: la stessa per tutta la giornata
const SPINTE = [
  "Una camera alla volta e la giornata si chiude da sola.",
  "Se finite prima delle due, il resto del pomeriggio è tuo.",
  "Le cose fatte bene oggi non tornano indietro domani.",
  "Guarda i numeri una volta sola, poi lascia lavorare le ragazze.",
  "Meglio tre cose fatte per bene che dieci di corsa.",
  "La casa in ordine si vede dal primo passo nel corridoio.",
  "Oggi scegli una cosa in ritardo e portala a casa.",
];
function spintaDelGiorno() { const d = L.oggiISO(); let h = 0; for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0; return SPINTE[h % SPINTE.length]; }
function soglieGov() { return G.soglie(S.gov); }
function flagsGov() { return { balconi: (S.gov && S.gov.balconi) || { salvatore: true }, strada: (S.gov && S.gov.strada) || {}, frigo: (S.gov && S.gov.frigo) || {} }; }
let ctxMemo = null;
function escluseStelle() { const w = L.settimanaCorrente(); const e = (S.gov && S.gov.stelleEscluse && S.gov.stelleEscluse[w]) || []; return new Set(Array.isArray(e) ? e : []); }
function ctxGov(lun) { if (!lun && ctxMemo) return ctxMemo; const c = ctxGovNuovo(lun); if (!lun) ctxMemo = c; return c; }
function ctxGovNuovo(lun) { return { listino: L.listinoCompleto(S.listino), escluse: escluseStelle(), lun: lun || S.govSett, oggi: L.oggiISO(), camere: S.camere, luoghi: G.LUOGHI_COMUNI, soggiorni: soggiorniLista(), pulizie: S.pulizie, regole: regoleGov(), registro: S.registro, soglie: soglieGov(), rinvii: (S.gov && S.gov.rinvii) || {}, flags: flagsGov(), inizio: (S.gov && S.gov.inizio) || null, materiali: (S.gov && S.gov.materiali) || {}, imp: S.gov, meteo: (S.gov && S.gov.meteo) || {}, regoleBase: S.regole, clienti: S.clienti, ora: oraRoma() }; }
let memoProposte = new Map(), memoRif = new Map(), memoLista = new Map();
function proposteGov(lun) { const k = lun || S.govSett; if (!memoProposte.has(k)) memoProposte.set(k, G.proposteSettimana(ctxGov(k))); return memoProposte.get(k); }
// le rifiniture dentro una pulizia normale (per la signora, per la controllatrice e per la paga)
function rifinitureDi(p) { if (!p || p.origine === "governante" || p.tipo === "extra" || p.tipo === "fisso") return []; const k = `${p.zona}|${p.data}`; if (!memoRif.has(k)) memoRif.set(k, G.rifinitureDelGiorno(p.zona, p.data, ctxGov())); return memoRif.get(k)[p.id] || []; }
function routineDi(p) { return rifinitureDi(p); }
// La lista del giorno della signora (righe grandi + stelle al punto giusto + zone comuni), una per pulizia
function listaDi(p) { if (!p || p.origine === "governante" || p.tipo === "extra" || p.tipo === "fondo" || p.tipo === "fisso" || p.tipo === "stelle") return null; const k = `L|${p.id}`; if (!memoLista.has(k)) { let v = null; try { v = G.listaDelGiorno(p, { ...ctxGov(), stelle: p.stato === "fatta" && p.rifiniture ? stelleSalvate(p) : rifinitureDi(p) }); } catch (e) { console.warn("lista", e); } memoLista.set(k, v); } return memoLista.get(k); }
// Una pulizia chiusa mostra le stelle che aveva davvero (salvate con FATTO), non quelle ricalcolate oggi
function stelleSalvate(p) {
  const out = [];
  const daRegola = (regola, luogo, extra) => { const r = regoleGov().find(x => x.id === regola) || G.CATALOGO.find(x => x.id === regola) || null; const l = camera(luogo || p.camera); return { regola, codice: r?.codice || regola, nome: r?.nome || extra.nome || regola, superficie: r?.superficie || extra.nome || regola, parte: r?.parte || "", come: r?.come || "", controllo: r?.controllo || "", prodotto: r?.prodotto || "", note: r?.note || "", posto: r?.posto || "", quando: r?.quando || "", minuti: extra.minuti ?? r?.minuti ?? 0, euro: extra.euro ?? 0, luogo: l.id, luogoNome: l.nome, comune: l.id !== p.camera, sempre: !!extra.sempre }; };
  for (const x of p.rifiniture || []) out.push(daRegola(x.regola, x.luogo, { nome: x.nome, minuti: x.minuti, euro: x.euro, sempre: !x.euro && !!x.luogo && x.luogo !== p.camera }));
  for (const x of p.nonFatte || []) { const m = String(x.k).match(/^S(.+)$/) || String(x.k).match(/^Z(.+)\|(.+)$/); if (m && !out.some(s => s.regola === m[1] && (!m[2] || s.luogo === m[2]))) out.push(daRegola(m[1], m[2] || p.camera, { nome: x.testo, euro: 0 })); }
  return out;
}
// le righe delle zone comuni come le vede la signora: quelle di ogni giorno in una riga sola ("Come ogni giorno"), poi quelle a ritmo
function righeZona(l) { if (!l || !l.zona.length) return []; const giorno = l.zona.filter(r => r.sempre), ritmo = l.zona.filter(r => !r.sempre); return [...(giorno.length ? [{ k: "Zgiorno", tipo: "riga", n: "✓", testo: "Come ogni giorno", sotto: giorno.map(r => r.testo.toLowerCase()).join(", "), codici: [], minuti: giorno.reduce((s, r) => s + (r.minuti || 0), 0) }] : []), ...ritmo]; }
// Le cose che la signora tocca: i BLOCCHI (un tasto Fatto per blocco: le righe dentro si leggono), le STELLE una per una, le zone comuni
// le righe del giro delle stelle: una per stella, col nome della camera davanti
function righeGiro(p) { return rifinitureDi(p).map((st, i) => ({ k: chiaveStella(st), tipo: "stella", n: i + 1, testo: `${st.luogoNome || camera(st.luogo).nome}: ${st.parte ? `${st.superficie}: ${st.parte}` : st.superficie || st.nome}`, sotto: `${st.minuti} min${st.euro ? " · " + eur(st.euro) : ""}${st.prodotto && !/^nessuno/.test(st.prodotto) ? " · " + st.prodotto : ""}`, codici: [st.codice], minuti: st.minuti, stella: st, luogo: st.luogo, blocco: "giro" })); }
function unitaDi(p) { if (p && p.tipo === "stelle") return righeGiro(p); const l = listaDi(p); if (!l) return []; return [...l.blocchi.filter(b => b.righe.length).map(b => ({ k: b.k, tipo: "blocco", testo: b.nome, codici: b.codici, n: b.righe.length, minuti: b.minuti, blocco: b.id })), ...l.blocchi.flatMap(b => b.stelle), ...righeZona(l)]; }
function righeDi(p) { return unitaDi(p); }
// Le spunte della signora su una camera aperta: restano sul telefono finché non preme FATTO (poi si salvano sulla pulizia)
function spunteDi(id) { if (!S.spunte[id]) S.spunte[id] = { fatte: {}, non: {} }; return S.spunte[id]; }
function salvaSpunte() { try { const oggi = L.oggiISO(); for (const k of Object.keys(S.spunte)) if (k.slice(0, 10) < L.aggiungiGiorni(oggi, -2)) delete S.spunte[k]; localStorage.setItem("ricci_spunte", JSON.stringify(S.spunte)); } catch (e) {} }
function chiaveStella(r) { return r.comune ? (r.sempre ? "Zgiorno" : `Z${r.regola}|${r.luogo}`) : r.giro ? `S${r.regola}|${r.luogo}` : `S${r.regola}`; }
// nella domanda finale e nella lista della controllatrice: le istruzioni fisse, le rifiniture a ritmo e le poche cose "sempre" segnate per la domanda
function sempreDi(p) { return [...promemoriaCamera(p.camera), ...rifinitureDi(p).filter(r => !r.sempre || r.domanda).map(r => `⭐ ${r.nome}`)]; }
function testoRifiniture(p) { const rf = rifinitureDi(p).filter(r => !r.sempre && !r.comune); return rf.length ? `${rf.length} ${rf.length === 1 ? "stella" : "stelle"} · ${rf.reduce((n, r) => n + r.minuti, 0)} min` : ""; }
function testoStelleFatte(p) { const n = (p.rifiniture || []).filter(r => r.euro).length; return n ? `${n} ${n === 1 ? "stella" : "stelle"}` : ""; }
function idPuliziaGov(c) { return `${c.data}_${c.luogo}_g_${c.regola}`; }
function haProposteNuove() { try { return localStorage.getItem("ricci_gov_visto") !== S.govSett; } catch (e) { return true; } }
function ledGovernante() { if (!proprietario()) return false; const r = proposteGov(G.settimanaGovernante()); return r.inRitardo.length > 0 || (r.proposte.length > 0 && haProposteNuove()) || mappaGov().buchi > 0; }
async function salvaGov(patch) {
  const nuovo = { ...(S.gov || {}), ...patch }; S.gov = nuovo; disegna();
  try { await S.db.salva("impostazioni", "governante", nuovo, false); } catch (e) { erroreScrittura(e); }
}
// "Va bene": il consiglio diventa un lavoro nella settimana della signora (una pulizia come le altre, tipo "fondo")
async function accettaProposte(lista) {
  const ops = lista.map(c => ({ tipo: "salva", coll: "pulizie", id: idPuliziaGov(c), merge: false, dati: { id: idPuliziaGov(c), data: c.data, camera: c.luogo, zona: c.zona, tipo: "fondo", titolo: c.cosa, passi: [], come: c.come, minuti: c.minuti, icona: c.icona, perche: c.perche, importo: c.grande ? L.prezzoFondo(S.listino, camera(c.luogo)) : (c.euro || 0), grande: !!c.grande, stato: "da_fare", origine: "governante", regola: c.regola, creato: S.db.adesso(), da: S.utente.nome || "" } }));
  if (!ops.length) return;
  for (const op of ops) S.pulizie[op.id] = op.dati;
  disegna();
  try { await S.db.scrivi(ops); toast(ops.length === 1 ? `Messo nella settimana di ${SIG(lista[0].zona)}` : `${ops.length} lavori messi nelle settimane delle signore`); } catch (e) { erroreScrittura(e); }
}
// "Più avanti" (1-2 settimane) e "No" (per un bel po': 3 mesi)
async function rinviaProposta(c, tipo) {
  const rinvii = { ...((S.gov && S.gov.rinvii) || {}) };
  rinvii[c.chiave] = { fino: L.aggiungiGiorni(c.data, tipo === "no" ? 90 : 10), tipo, quando: L.oggiISO() };
  await salvaGov({ rinvii }); toast(tipo === "no" ? "Va bene, non te lo ripropongo per tre mesi" : "Te lo ripropongo fra una o due settimane");
}
// Automatico: i lavori piccoli entrano da soli nelle settimane delle signore (quelli grossi chiedono sempre)
let autoFatto = "";
async function governanteAutomatica() {
  if (!proprietario() || S.utente?.finta || !S.caricati.pulizie || !S.caricati.soggiorni || !S.caricati.gov || !soglieGov().automatico) return;
  const lun = G.settimanaGovernante(); const chiave = `${lun}|${Object.keys(S.pulizie).length}`; if (autoFatto === chiave) return; autoFatto = chiave;
  const piccole = proposteGov(lun).proposte.filter(c => !c.grande && !S.pulizie[idPuliziaGov(c)]);
  if (piccole.length) await accettaProposte(piccole);
}
// Le celle di un posto tolto (via Zara 2° piano) passano al posto a cui è stato unito: le scrive il proprietario una volta sola, poi cancella le vecchie
let unioneInCorso = false;
async function unisciRegistroTolte(vecchie) {
  if (!vecchie.length || !proprietario() || S.utente?.finta || unioneInCorso) return; unioneInCorso = true;
  try {
    const ops = [];
    for (const r of vecchie) { const a = CAMERE_TOLTE[r.luogo].unitaA; const regola = G.nuovoId(r.regola); const k = G.chiaveRegistro(regola, a); const cur = S.registro[k]; const id = `${regola}_${a}`;
      if (!cur || cur.luogo !== a || (r.ultima || "") >= (cur.ultima || "")) ops.push({ tipo: "salva", coll: "governante_registro", id, dati: { ...r, regola, luogo: a, zona: r.zona || "ap", unitoDa: r.luogo }, merge: true });
      ops.push({ tipo: "cancella", coll: "governante_registro", id: `${r.regola}_${r.luogo}` }); }
    if (ops.length) { await S.db.scrivi(ops); console.info("registro: unite", vecchie.length, "celle del posto tolto"); }
  } catch (e) { console.warn("unione registro", e); } finally { unioneInCorso = false; }
}
// il registro "ultima volta fatto": lo scrive chi segna fatto (signora o proprietario)
async function registraFatto(regola, luogo, zona, data) {
  const k = G.chiaveRegistro(regola, luogo), prev = S.registro[k] || {};
  if (prev.ultima && prev.ultima >= data) return;
  const voce = { regola, luogo, zona, ultima: data, da: S.utente.nome || (addetta() ? SIG(S.utente.zona) : ""), ora: S.db.adesso(), n: (prev.n || 0) + 1 };
  S.registro[k] = voce;
  try { await S.db.salva("governante_registro", `${regola}_${luogo}`, voce, true); } catch (e) { console.warn("registro", e?.code || e); }
}
// Il giorno in cui la governante è partita (serve per dare un ordine alle cose mai registrate): si scrive una volta sola
let inizioSegnato = false;
function segnaInizioGovernante() { if (inizioSegnato || !proprietario() || S.utente?.finta || !S.caricati.gov || (S.gov && S.gov.inizio)) return; inizioSegnato = true; salvaGov({ inizio: L.oggiISO() }); }
let rifiniturePending = null;
function registraPuliziaFatta(p) {
  if (!p) return;
  if (p.origine === "governante" && p.regola) {
    registraFatto(p.regola, p.camera, p.zona, p.data);
    // la pulizia a fondo completa fa tutto il catalogo della camera: segna fatte tutte le sue regole
    const r = regoleGov().find(x => x.id === p.regola);
    if (r && r.grande) { const l = camera(p.camera); for (const id of G.regoleDellaFondoCompleta(l, { ...ctxGov(), oggi: p.data })) registraFatto(id, p.camera, p.zona, p.data); }
    return;
  }
  const rf = rifinitureDi(p), sp = spunteDi(p.id), righe = righeDi(p), l = camera(p.camera);
  const fatte = rf.filter(r => !sp.non[chiaveStella(r)]), saltate = rf.filter(r => sp.non[chiaveStella(r)]);
  for (const r of fatte) registraFatto(r.regola, r.luogo || p.camera, p.zona, p.data);
  for (const r of saltate) saltaRifinitura(p, r.regola, r.luogo || p.camera, sp.non[chiaveStella(r)] || "non fatta");
  // la lista fatta per intero copre le sue voci e le cose a ritmo corto che nomina (tranne le righe segnate "non fatta")
  try {
    const codiciNon = new Set(righe.filter(r => r.tipo === "blocco" && sp.non[r.k]).flatMap(r => r.codici)), codiciFatte = new Set(righe.filter(r => r.tipo === "blocco" && !sp.non[r.k]).flatMap(r => r.codici));
    for (const id of G.coperteDalPasso(p, l, ctxGov())) { const r = regoleGov().find(x => x.id === id); if (r && codiciNon.has(r.codice) && !codiciFatte.has(r.codice)) continue; registraFatto(id, p.camera, p.zona, p.data); }
  } catch (e) { console.warn("coperte", e); }
  const pagate = fatte.filter(r => !r.sempre && r.euro);
  rifiniturePending = { rifiniture: fatte.map(r => ({ regola: r.regola, nome: r.nome, minuti: r.minuti, euro: r.sempre ? 0 : r.euro, luogo: r.luogo || p.camera })), extraRifiniture: Math.round(pagate.reduce((n, r) => n + r.euro, 0) * 100) / 100,
    spuntate: righe.filter(r => sp.fatte[r.k]).map(r => r.k), nonFatte: righe.filter(r => sp.non[r.k]).map(r => ({ k: r.k, testo: r.testo, motivo: sp.non[r.k] })) };
  delete S.spunte[p.id]; salvaSpunte();
}
// "Non la posso fare" su una rifinitura: motivo con un tocco, la governante la rimette alla pulizia dopo
async function saltaRifinitura(p, regola, luogo, motivo) {
  const k = G.chiaveRegistro(regola, luogo), prev = S.registro[k] || {};
  const voce = { ...prev, regola, luogo, zona: p.zona, saltata: p.data, saltataPer: p.id, motivo, saltataDa: S.utente.nome || "" };
  if (!voce.ultima) voce.ultima = null;
  S.registro[k] = voce; disegna(); if (S.foglio) disegnaFoglio();
  try { await S.db.salva("governante_registro", `${regola}_${luogo}`, voce, true); } catch (e) { console.warn("registro", e?.code || e); }
}
function etichettaSettimanaLun(lun) { return L.etichettaSettimana(L.aggiungiGiorni(lun, 6)); }
function nomeZonaBreve(z) { return SIG(z); }

// ============================================================================
//  LA CHAT CON LA GOVERNANTE (specifiche §11): "La governante ti chiede". Le domande nascono dalle regole in chat.js;
//  qui c'è quello che si vede (card in Oggi, foglio a chat) e quello che OGNI RISPOSTA FA DAVVERO nell'app ("Fatto: …").
// ============================================================================
// l'ora di Roma; in modalità prova si può fissare (localStorage ricci_prova_ora) per provare la chat a qualunque ora
function oraRoma() { if (S.db && S.db.modalita !== "firebase") { try { const o = localStorage.getItem("ricci_prova_ora"); if (o != null && o !== "") return Number(o); } catch (e) {} } return L.partiRoma(new Date()).h; }
// Le stelle della signora delle stelle in questa settimana di paga: quelle già fatte e quelle in programma da oggi (per la chat del lunedì e la card)
function stelleSettimanaApp() {
  const l = L.listinoCompleto(S.listino), zona = l.zonaStelle; if (!zona || !(Number(l.obiettivoStelle) > 0)) return null;
  const oggi = L.oggiISO(), chiave = L.chiaveSettimana(oggi + "T12:00:00", S.regole.chiusuraPaga), giorni = G.giorniSettimanaPaga(oggi);
  const righe = [], fatte = []; let euro = 0;
  for (const d of giorni) {
    const ps = Object.values(S.pulizie).filter(p => p.data === d && p.zona === zona && p.stato !== "non_fatta" && (p.tipo === "stelle" || (p.origine !== "governante" && p.tipo !== "extra" && p.tipo !== "fondo" && p.tipo !== "fisso")));
    if (!ps.length) continue;
    for (const p of ps) {
      if (p.stato === "fatta") { for (const r of (p.rifiniture || []).filter(r => r.euro)) { fatte.push({ k: `${r.regola}|${r.luogo || p.camera}`, regola: r.regola, luogo: r.luogo || p.camera, luogoNome: camera(r.luogo || p.camera).nome, nome: r.nome, euro: r.euro, giorno: d, fatta: true }); euro += Number(r.euro) || 0; } continue; }
      if (d < oggi) continue;
      for (const r of rifinitureDi(p).filter(r => !r.sempre && r.euro)) { righe.push({ k: `${r.regola}|${r.luogo || p.camera}`, regola: r.regola, luogo: r.luogo || p.camera, luogoNome: r.luogoNome || camera(r.luogo || p.camera).nome, nome: r.superficie || r.nome, euro: r.euro, minuti: r.minuti, giorno: d, pulizia: p.id }); euro += Number(r.euro) || 0; }
    }
  }
  return { zona, nome: nomeZonaBreve(zona), settimana: chiave, obiettivo: Number(l.obiettivoStelle), euro: Math.round(euro * 100) / 100, righe, fatte, escluse: [...escluseStelle()] };
}
function statoChatApp() {
  let tab = null; try { tab = tabellone(); } catch (e) {}
  let ss = null; try { ss = stelleSettimanaApp(); } catch (e) { console.warn("stelle settimana", e); }
  const zoneChat = {}; for (const z of signore()) zoneChat[z.id] = { ...S.zone[z.id], persona: SIG(z.id) };
  const st = { oggi: L.oggiISO(), adesso: new Date(), ora: oraRoma(), camere: S.camere, zone: zoneChat, soggiorni: soggiorniLista(), pulizie: S.pulizie, clienti: S.clienti, gov: S.gov, pagamenti: S.pagamenti, regole: S.regole, controlli: S.controlli, listino: S.listino, chat: S.chat, registro: S.registro, manutenzione: S.manutenzione, impControlli: S.impControlli, tabellone: tab, spesa: S.spesa, catalogo: G.CATALOGO, stelleSettimana: ss };
  try { return CH.statoChat(st); } catch (e) { console.warn("chat", e); return { aperte: [], inAttesa: [], nonAncora: [], daSole: [], storico: [], risposteOggi: [], urgenti: 0, prossime: "" }; }
}
// 0.43: Michele apre l'app e la prima cosa che vede è lei, grande, che lo saluta per nome.
// ---------------------------------------------------------------------------
//  LA SCHERMATA DI CASA (0.60): quando apri l'app vedi SOLO lei, a tutto schermo.
//  Sta fuori da #app, sopra l'intestazione: scorrendo in giu' si trova tutto il
//  resto esattamente com'era. Il tasto "Le mie giornate" fa la stessa cosa.
// ---------------------------------------------------------------------------
const CASA_MIC = `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>`;
function casaAttiva() {
  try {
    return !!(S.pronto && S.utente && S.utente.ruolo && proprietario()
      && S.vista === "oggi" && S.giorno === L.oggiISO()
      && S.caricati.soggiorni && S.caricati.pulizie && FILM_PRONTO.riposo && corpoPronto());
  } catch (e) { return false; }
}
const CASA_ICO = {
  mic: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/></svg>`,
  giu: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  onda: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4"/><path d="M8 6v12"/><path d="M12 9v6"/><path d="M16 4v16"/><path d="M20 10v4"/></svg>`,
  voceSi: `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`,
  voceNo: `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6"/><path d="m21 9-5 6"/></svg>`,
};
function casaOssatura() {
  return `<div class="casa-testa"><span class="casa-nome">Le Stanze di Ricci</span></div>
    <div class="casa-card">
      ${FILM_CONS("casa-fig")}
      <span class="casa-tondi">
        <button type="button" class="casa-tondo casa-voce" data-voce-tasto aria-label="Voce"></button>
        <button type="button" class="casa-tondo" data-vista="altro" aria-label="Altro">\u22ef</button>
      </span>
    </div>
    <div class="casa-testo">
      <b class="casa-sal"></b>
      <p class="casa-riga"></p>
      <p class="casa-spinta"></p>
      <div class="casa-sotto" id="consSotto"></div>
      <p class="casa-info"></p>
    </div>
    <div class="casa-barra">
      <button type="button" class="casa-t casa-t-voce" data-casa-parla>${CASA_ICO.onda}<span>Parlami</span></button>
      <button type="button" class="casa-t casa-t-mic" data-cons-mic aria-label="Dille qualcosa">${CASA_ICO.mic}<span>Dimmi</span></button>
      <button type="button" class="casa-t" data-casa-giu>${CASA_ICO.giu}<span>Giornate</span></button>
    </div>`;
}
function casaAggiorna(h) {
  const c = consiglioOggi(), u = umoreGov();
  if (iaAccesa() && !c) setTimeout(chiediConsiglioDelGiorno, 400);
  const oggi = L.oggiISO();
  const ls = pulizieDelGiorno(oggi), fatte = ls.filter(p => p.stato === "fatta").length;
  const man = lavoriAperti().length;
  let dom = 0; try { dom = statoChatApp().aperte.length; } catch (e) {}
  const voci = [ls.length ? `${fatte}/${ls.length} pulizie oggi` : "nessuna pulizia oggi"];
  if (man) voci.push(`${man} ${man === 1 ? "lavoro" : "lavori"} da fare`);
  if (dom) voci.push(`${dom} ${dom === 1 ? "domanda" : "domande"} per te`);
  const q = (s) => h.querySelector(s);
  const sal = q(".casa-sal"), riga = q(".casa-riga"), spinta = q(".casa-spinta"), info = q(".casa-info");
  if (sal) { const t = c && c.saluto ? c.saluto : `${saluto()}, ${nomeMio()}!`; sal.textContent = t; sal.classList.toggle("lunga", t.length > 58); }
  if (riga) riga.textContent = c && c.testo ? c.testo : u.testo;
  if (spinta) spinta.textContent = c && c.consiglio ? c.consiglio : spintaDelGiorno();
  if (info) info.textContent = voci.join(" \u00b7 ");
  const mic = q(".casa-t-mic");
  if (mic) mic.setAttribute("aria-label", "Dillo a " + nomeGov());
  const bv = q(".casa-voce"), su = voceAccesa();
  if (bv) {
    bv.innerHTML = su ? CASA_ICO.voceSi : CASA_ICO.voceNo;
    bv.setAttribute("aria-pressed", su ? "true" : "false");
    bv.setAttribute("aria-label", su ? "Voce accesa: tocca per mettere muto" : "Muto: tocca per accendere la voce");
    bv.classList.toggle("spenta", !su);
  }
  h.dataset.umore = u.v;
  h.classList.toggle("sta-parlando", !!voceInCorso);
  h.classList.toggle("con-ia", !!c);
}
// ---- lei ti parla appena apri l'app -------------------------------------
// I telefoni non lasciano partire un suono da soli: se il browser dice di no,
// compare la striscia gialla e basta un tocco qualsiasi per farla partire.
let salutoDetto = false, salutoArmato = false;
function testoBenvenuto() {
  const c = consiglioOggi(), u = umoreGov();
  const sal = c && c.saluto ? c.saluto : `${saluto()}, ${nomeMio()}!`;
  const riga = c && c.testo ? c.testo : u.testo;
  const spinta = c && c.consiglio ? c.consiglio : spintaDelGiorno();
  return [sal, riga, spinta].filter(Boolean).join(" ");
}
function casaTocca(mostra) {
  const h = document.getElementById("sofiaHero");
  if (h) h.classList.toggle("muta", !!mostra);
}
// Da 0.62 NON parla piu' da sola quando apri l'app: lei sta li' e lavora.
// Parla solo quando tocchi "Parlami". Se la voce era spenta, la riaccende:
// toccare quel tasto vuol dire proprio che la vuoi sentire.
async function benvenutoSofia() {
  if (!document.getElementById("sofiaHero")) return;
  if (VOCE.staParlando()) { zittisciVoce(); return; }
  if (!voceAccesa()) {
    const v = VOCE.leggiVoce();
    VOCE.salvaVoce({ attiva: true, motore: iaAccesa() ? "google" : "telefono" });
  }
  try { VOCE.sbloccaAudio(); } catch (e) {}
  try { await parlaConVoce(testoBenvenuto()); } catch (e) { console.warn("benvenuto", e); }
}
// ---- lo stile della prima pagina: lo sceglie Michele, resta su questo telefono ----
const CHIAVE_STILE_CASA = "ricci_casa_stile";
const STILI_CASA = [
  { id: "basso", nome: "Tasti in fondo", come: "I tre tasti restano in fondo allo schermo, il testo sta sotto la foto." },
  { id: "sotto", nome: "Tasti sotto la foto", come: "I tre tasti stanno subito sotto la foto, il testo scende in fondo." },
  { id: "tondi", nome: "Tre tondi, senza scritte", come: "Solo tre cerchi con l'icona, sotto la foto. Il piu' pulito." },
];
function stileCasa() {
  try { const v = localStorage.getItem(CHIAVE_STILE_CASA); return STILI_CASA.some(s => s.id === v) ? v : "basso"; }
  catch (e) { return "basso"; }
}
function cambiaStileCasa(v) {
  try { localStorage.setItem(CHIAVE_STILE_CASA, v); } catch (e) {}
  const h = document.getElementById("sofiaHero"); if (h) h.dataset.stile = stileCasa();
  disegna();
}
function disegnaCasa() {
  let h = document.getElementById("sofiaHero");
  if (!casaAttiva()) {
    if (h) { h.remove(); window.scrollTo(0, 0); }
    document.body.classList.remove("ha-casa");
    return;
  }
  if (!h) {
    h = document.createElement("section");
    h.id = "sofiaHero";
    h.className = "sofia-hero";
    h.innerHTML = casaOssatura();
    const t = document.querySelector("header");
    document.body.insertBefore(h, t || document.body.firstChild);
    window.scrollTo(0, 0);
  }
  document.body.classList.add("ha-casa");
  h.dataset.stile = stileCasa();
  casaAggiorna(h);
}

// ---------------------------------------------------------------------------
//  RICOMINCIA DA ZERO (0.63)
//  Michele ha fatto delle prove: camere segnate pulite per vedere come andava,
//  stelle proposte per cose gia' fatte davvero. Questo tasto ripulisce il
//  lavoro registrato e fa ripartire i conti dal giorno in cui e' pronto.
//  NON tocca camere, signore, regole, prezzi: quelli sono la casa, non il lavoro.
// ---------------------------------------------------------------------------
const AZZERABILI = [
  { id: "pulizie", nome: "Le pulizie di tutti i giorni", come: "fatte, da fare, extra. Si rifanno da sole dal prospetto, come nuove.", base: true },
  { id: "manutenzione", nome: "I lavori di manutenzione", come: "problemi segnalati e lavori aggiunti a mano.", base: true },
  { id: "controlli", nome: "I controlli e i pagamenti", come: "i voti delle camere e le ore gia' contate alle signore.", base: true },
  { id: "catalogo", nome: "Le stelle della governante", come: "riparte come se il catalogo fosse tutto in pari da oggi: non ti ripropone cose gia' fatte.", base: true },
  { id: "chat", nome: "Quello che vi siete detti", come: "la chat con lei, le sue risposte e il consiglio del giorno.", base: true },
  { id: "prospetto", nome: "Il prospetto: chi dorme qui", come: "arrivi e partenze. Toglilo solo se vuoi rifare anche quello.", base: false },
];
let azzScelte = Object.fromEntries(AZZERABILI.map(x => [x.id, x.base]));
let azzChiesto = false, azzInCorso = false;
async function azzeraDavvero() {
  if (azzInCorso) return;
  const s = azzScelte, oggi = L.oggiISO(), ops = [];
  const togli = (coll, obj) => { for (const v of Object.values(obj || {})) { const id = v && v.id; if (id) ops.push({ tipo: "cancella", coll, id }); } };
  if (s.pulizie) togli("pulizie", S.pulizie);
  if (s.manutenzione) togli("manutenzione", S.manutenzione);
  if (s.controlli) { togli("controlli", S.controlli); togli("pagamenti", S.pagamenti); }
  if (s.prospetto) { togli("soggiorni", S.soggiorni); togli("note", S.note); }
  if (s.catalogo) for (const v of Object.values(S.registro || {})) {
    if (!v || !v.regola || !v.luogo) continue;
    ops.push({ tipo: "salva", coll: "governante_registro", id: `${v.regola}_${v.luogo}`, dati: { ...v, ultima: oggi, ora: S.db.adesso() } });
  }
  azzInCorso = true; disegna();
  try {
    if (ops.length) await S.db.scrivi(ops);
    if (s.chat) { await salvaChat({ risposte: {}, conta: {}, automatiche: {}, conversazione: [] }); try { localStorage.removeItem(CHIAVE_CONSIGLIO); } catch (e) {} }
    if (s.catalogo) await salvaGov({ inizio: oggi, stelleEscluse: {} });
    toast("Fatto: si riparte da oggi.");
  } catch (e) { erroreScrittura(e); }
  azzInCorso = false; azzChiesto = false; disegna();
}
function cardAzzera() {
  if (!proprietario() || S.utente?.finta) return "";
  const righe = AZZERABILI.map(x => `<label class="row azz-riga" for="azz_${x.id}"><span><b>${esc(x.nome)}</b><br><span class="muted small">${esc(x.come)}</span></span><input type="checkbox" id="azz_${x.id}" data-azz="${x.id}" ${azzScelte[x.id] ? "checked" : ""}></label>`).join("");
  const quante = AZZERABILI.filter(x => azzScelte[x.id]).length;
  return `<section class="card azzera">
    <h2>Ricomincia da zero</h2>
    <p class="muted small" style="margin:0 0 10px">Cancella il lavoro registrato finora, cosi' i conti partono dal giorno in cui sei pronto davvero. Le camere, le signore, le regole e i prezzi NON si toccano: resta tutto com'e'.<br><b>Prima fatti una copia di sicurezza</b> (il tasto sta qui sotto, in fondo): se poi ti serve qualcosa, da li' si recupera.</p>
    <div class="rows">${righe}</div>
    ${azzChiesto
      ? `<div class="azz-conferma"><p><b>Sicuro?</b> Cancello ${quante === 1 ? "la cosa scelta" : "le " + quante + " cose scelte"} qui sopra. Non si torna indietro, se non dalla copia di sicurezza.</p>
         <div class="azz-tasti"><button type="button" class="big warn" data-azzera-si ${azzInCorso ? "disabled" : ""}>${azzInCorso ? "Sto azzerando…" : "Sì, azzera adesso"}</button><button type="button" class="big undo" data-azzera-no>No, lascia stare</button></div></div>`
      : `<button type="button" class="big warn" data-azzera-chiedi ${quante ? "" : "disabled"}>Azzera quello che ho scelto</button>`}
  </section>`;
}
function cardStileCasa() {
  if (!proprietario()) return "";
  const ora = stileCasa();
  const anteprima = (id) => `<span class="st-prev st-${id}"><i class="st-card"></i><i class="st-bar"></i><i class="st-bar"></i><i class="st-bar"></i></span>`;
  return `<section class="card">
    <h2>Prima pagina</h2>
    <p class="muted small" style="margin:0 0 10px">Dove stanno i tasti sotto ${esc(nomeGov())}. Tocca e cambia subito: puoi tornare indietro quando vuoi.</p>
    <div class="st-scelte">${STILI_CASA.map(s => `<button type="button" class="st-opt" aria-pressed="${ora === s.id}" data-casa-stile="${s.id}">${anteprima(s.id)}<b>${esc(s.nome)}</b><span class="muted small">${esc(s.come)}</span></button>`).join("")}</div>
  </section>`;
}
function cardConsuela() {
  if (!proprietario()) return "";
  if (!S.caricati.soggiorni || !S.caricati.pulizie) return "";
  const c = consiglioOggi(), u = umoreGov();
  if (iaAccesa() && !c) setTimeout(chiediConsiglioDelGiorno, 400);
  const muove = govScrive || voceInCorso;
  const sal = c && c.saluto ? c.saluto : `${saluto()}, ${nomeMio()}!`;
  const riga = c && c.testo ? c.testo : u.testo;
  const spinta = c && c.consiglio ? c.consiglio : spintaDelGiorno();
  return `<section class="card consuela ${u.v}${muove ? " sta-parlando" : ""}">
    <button class="cons-apri" data-chat-apri aria-label="Parla con ${esc(nomeGov())}">
      <span class="cons-fig">${DONNINA("governante", "viva grande" + (muove ? " parla" : ""))}</span>
      <span class="cons-testo">
        <b class="cons-sal">${esc(sal)}</b>
        <span class="cons-riga">${esc(riga)}</span>
        ${spinta ? `<span class="cons-spinta">${esc(spinta)}</span>` : ""}
        <span class="cons-az"><span class="cons-chip">${esc(nomeGov())} · parlale ›</span>${c ? `<span class="ia-bollo">IA</span>` : ""}</span>
      </span></button>
    <div class="cons-parlaci"><button type="button" class="cons-mic" data-cons-mic aria-label="Parla con ${esc(nomeGov())}"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg></button><div class="cons-sotto" id="consSotto"></div></div>
    ${voceAccesa() ? `<button class="cons-voce" data-cons-voce aria-label="Fatti leggere il saluto">${ICONA("altoparlante")}</button>` : ""}
  </section>`;
}
function cardChat() {
  if (!S.caricati.soggiorni || !S.caricati.pulizie) return "";
  const c = statoChatApp(); const n = c.aperte.length, g = (c.gruppi || []).reduce((s, x) => s + x.righe.length, 0);
  const gruppiTesto = (c.gruppi || []).map(x => `${x.righe.length} ${x.tipo === "nomi" ? (x.righe.length === 1 ? "nome da sistemare" : "nomi da sistemare") : (x.righe.length === 1 ? "lavoro fermo" : "lavori fermi")}`).join(" · ");
  const sotto = [n ? `${n === 1 ? "una domanda" : n + " domande"} per te${c.inAttesa.length ? ` · altre ${c.inAttesa.length} domani` : ""}` : "", gruppiTesto].filter(Boolean).join(" · ") || (c.prossime ? `le prossime arrivano ${c.prossime.replace(/^\d+ /, "")}` : c.risposteOggi.length ? "per oggi ho finito, grazie" : "niente da chiedere, per ora");
  const prima = c.aperte[0] || (c.gruppi || [])[0];
  return `<section class="card chat-card ${n || g ? "" : "quiete"}"><button class="chat-plate" data-chat-apri aria-label="Apri la chat con la governante">${DONNINA("governante", "piccola")}<span class="chat-plate-testo"><b>${esc(nomeGov())} ti chiede${n + g ? ` · ${n + g}` : ""}</b><span>${esc(sotto)}</span>${prima ? `<span class="chat-anteprima">“${esc(prima.titolo)}”</span>` : ""}</span>${c.urgenti ? `<span class="led" role="img" aria-label="urgente"></span>` : ""}<span class="man-freccia">›</span></button></section>`;
}
// L'umore della governante: guarda come sta la casa e lo dice in una riga (e si vede in faccia)
function umoreGov() {
  const oggi = L.oggiISO();
  const problemi = Object.values(S.pulizie).filter(p => p.data === oggi && p.stato === "problema").length;
  const lavori = lavoriAperti().filter(m => m.data <= L.aggiungiGiorni(oggi, -7)).length;
  let tab = null; try { tab = tabellone(); } catch (e) {}
  const rosse = tab ? tab.buchi : 0, copertura = tab ? tab.copertura : null;
  const ls = pulizieDelGiorno(oggi), fatte = ls.filter(p => p.stato === "fatta").length;
  const chat = (() => { try { return statoChatApp().aperte.length; } catch (e) { return 0; } })();
  if (problemi) return { v: "preoccupata", testo: problemi === 1 ? "C'è un problema in una camera: guardalo quando puoi." : `Ci sono ${problemi} problemi nelle camere.` };
  if (lavori >= 3) return { v: "preoccupata", testo: `${lavori} lavori di manutenzione sono fermi da più di una settimana.` };
  if (ls.length && fatte === ls.length) return { v: "contenta", testo: "Tutto pulito per oggi: le ragazze hanno finito." };
  if (chat) return { v: "attenta", testo: chat === 1 ? "Ho una cosa da chiederti." : `Ho ${chat} cose da chiederti.` };
  if (copertura != null && copertura >= 70) return { v: "contenta", testo: `La casa è in ordine: copertura ${copertura}%.` };
  if (ls.length) return { v: "attenta", testo: `Oggi ci sono ${ls.length} ${ls.length === 1 ? "lavoro" : "lavori"}: ${fatte} ${fatte === 1 ? "fatto" : "fatti"} finora.` };
  return { v: "serena", testo: "Oggi è tranquilla. Se ti serve qualcosa, dimmelo." };
}
// La governante grande, viva: respira, sbatte le palpebre, cambia faccia con l'umore
function testataGov() {
  const u = umoreGov(), c = consiglioOggi();
  if (iaAccesa() && !c) setTimeout(chiediConsiglioDelGiorno, 400);
  const testo = c && c.testo ? c.testo : u.testo;
  const muove = govScrive || voceInCorso;
  return `<div class="gov-viva ${u.v}${muove ? " sta-parlando" : ""}">${DONNINA("governante", "viva film" + (muove ? " parla" : ""))}<div class="gov-viva-t"><b>${esc(nomeGov())}${c ? ` <span class="ia-bollo">IA</span>` : ""}</b><span>${esc(testo)}</span>${c && c.consiglio ? `<span class="gov-consiglio">💡 ${esc(c.consiglio)}</span>` : ""}</div></div>`;
}
const escNl = s => esc(s).replace(/\n/g, "<br>");
function bollaGov(testo, extra = "") { return `<div class="chat-msg gov">${DONNINA("governante", "mini")}<div class="chat-bolla">${testo}${extra}</div></div>`; }
function foglioChat(f) {
  const c = statoChatApp(); const mod = puoModificare();
  const storico = c.storico.slice(-8);
  const vecchie = storico.map(r => `${bollaGov(esc(r.testo || r.titolo))}<div class="chat-msg me"><div class="chat-bolla">${esc(r.auto ? "(fatto da sola)" : r.testoRisposta || r.risposta)}${r.parole ? `<br><i>«${esc(r.parole)}»</i>` : ""}</div></div>${r.fatto ? `<div class="chat-fatto">${r.auto ? "Fatto da sola" : "Fatto"}: ${esc(r.fatto)}${r.whatsapp ? ` <button class="btnsm" data-chat-wa="${esc(r.id)}">Manda su WhatsApp</button>` : ""}</div>` : ""}<div class="chat-quando">${esc(L.dataBreve(r.il))}${r.ora ? " · " + L.oraBreve(r.ora) : ""}</div>`).join("");
  const aperte = c.aperte.map(d => bollaGov(`${d.urgente ? `<span class="chat-urgente">Urgente</span> ` : ""}${esc(d.testo)}`, mod ? `<div class="chat-tasti ${d.tasti.length === 1 ? "uno" : d.tasti.length === 2 ? "due" : d.tasti.length === 4 ? "quattro" : ""}">${d.tasti.map(t => `<button type="button" class="chat-tasto" data-chat-risposta="${esc(d.id)}|${esc(t.k)}">${esc(t.testo)}</button>`).join("")}</div>${d.parole ? `<button type="button" class="chat-parole" data-chat-parole="${esc(d.id)}">Dimmelo a parole</button><div class="chat-scrivi" id="cp_${esc(d.id)}" hidden><input type="text" data-keep id="ci_${esc(d.id)}" placeholder="Scrivi o detta col microfono della tastiera" autocomplete="off"><button type="button" class="btnsm" data-chat-invia="${esc(d.id)}">Invia</button></div>` : ""}` : "")).join("");
  const gruppi = (c.gruppi || []).map(g => bollaGov(esc(g.testo), `<div class="chat-gruppo">${g.righe.map(d => `<div class="chat-riga"><div class="chat-riga-t"><b>${esc(g.tipo === "nomi" ? d.dati.nome : d.dati.titolo)}</b><span class="muted small">${esc(g.tipo === "nomi" ? d.dati.camere.join(", ") : `${d.dati.cameraNome ? d.dati.cameraNome + " · " : ""}${d.dati.giorni} giorni${d.dati.chiamato ? " · chiamato " + L.dataBreve(d.dati.chiamato) : ""}`)}</span></div>${mod ? `<div class="chat-tasti mini ${d.tasti.length === 2 ? "due" : ""}">${d.tasti.map(t => `<button type="button" class="chat-tasto" data-chat-risposta="${esc(d.id)}|${esc(t.k)}">${esc(g.tipo === "manutenzioni" ? ({ chiamato: d.dati.chiamato ? "Richiamo" : "Chiamato", fatto: "Sistemato", aspetta: "Aspetta" })[t.k] || t.testo : t.testo)}</button>`).join("")}</div>` : ""}</div>`).join("")}</div>`)).join("");
  const piede = c.aperte.length || (c.gruppi || []).length ? `<p class="muted small center" style="margin:8px 0 0">${c.risposteOggi.length ? `Oggi hai risposto a ${c.risposteOggi.length} su ${CH.MAX_AL_GIORNO}. ` : ""}${c.inAttesa.length ? `Altre ${c.inAttesa.length} domande aspettano domani (massimo ${CH.MAX_AL_GIORNO} al giorno).` : ""}${c.prossime ? ` Le prossime arrivano ${esc(c.prossime.replace(/^\d+ /, ""))}.` : ""}${(c.gruppi || []).length ? " Le schermate a elenco (nomi, lavori fermi) non contano nelle 3 del giorno." : ""}</p>` : bollaGov(c.risposteOggi.length ? "Per oggi ho finito, grazie. Se succede qualcosa di urgente ti chiamo subito." : c.prossime ? `Niente per adesso: le prossime domande arrivano ${esc(c.prossime.replace(/^\d+ /, ""))}.` : "Niente da chiedere: il prospetto, il meteo e le paghe sono a posto. Se succede qualcosa ti chiamo subito.") + (c.inAttesa.length ? `<p class="muted small center" style="margin:8px 0 0">Altre ${c.inAttesa.length} domande aspettano domani (massimo ${CH.MAX_AL_GIORNO} al giorno).</p>` : "");
  const auto = Object.entries(S.chat.automatiche || {}).filter(([, v]) => v);
  const conv = conversazione().map((m, i) => m.chi === "io"
    ? `<div class="chat-msg me"><div class="chat-bolla">${esc(m.testo)}</div></div>`
    : m.fatto ? `<div class="chat-fatto">${esc(m.testo)}</div>`
    : bollaGov(`${m.ia ? `<span class="ia-bollo" title="risposta dell'intelligenza artificiale">IA</span>` : ""}${escNl(m.testo)}`, (m.tasti && m.tasti.length) ? `<div class="chat-tasti ${m.tasti.length === 2 ? "due" : m.tasti.length === 4 ? "quattro" : ""}">${m.tasti.map(t => `<button type="button" class="chat-tasto" data-conv="${i}|${esc(t.k)}">${esc(t.testo)}</button>`).join("")}</div>` : (m.scelto ? `<div class="chat-scelto">→ ${esc(m.scelto)}</div>` : ""))).join("");
  const scrive = govScrive ? bollaGov(`<span class="chat-punti"><i></i><i></i><i></i></span>`) : "";
  const parla = mod ? `<form class="chat-parla" id="formParla"><textarea id="parlaGov" rows="1" placeholder="Scrivi, o tocca il microfono e parla…" data-keep aria-label="Scrivi a ${esc(nomeGov())}"></textarea><button class="chat-mic" type="button" data-mic aria-pressed="false" aria-label="Parla con ${esc(nomeGov())}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg></button><button class="chat-invia" type="submit" aria-label="Manda a ${esc(nomeGov())}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button></form>
    ${iaAccesa() ? `<div class="chat-veloci">${VELOCI_IA.map((v, i) => `<button type="button" class="chat-veloce" data-ia-veloce="${i}">${esc(v.tasto)}</button>`).join("")}</div>` : ""}
    <p class="muted small center" style="margin:6px 0 0">${micDisponibile() ? "Tocca il microfono e parlale come parleresti a una persona. " : "Per dettare usa il microfono della tastiera. "}Per esempio: «ho messo i piumoni» · «fai lavare le tende in Alba» · «quanto prende ${esc(SIG(signore()[0]?.id || "p1"))}?» · «di' alle signore che domani arrivano gli operai»</p>` : "";
  return `<div class="inizio chat"><div class="inizio-top"><button class="inizio-indietro" data-chiudi>${ICONA("indietro")}<span>Oggi</span></button><span class="chat-titolo">${esc(nomeGov())}</span>${mod ? `<button class="chat-voce" data-voce-tasto aria-pressed="${voceAccesa()}" aria-label="${voceAccesa() ? "Spegni la voce" : "Accendi la voce"}">${ICONA(voceAccesa() ? "altoparlante" : "muto")}</button>` : ""}</div>
    ${testataGov()}
    <div class="chat-corpo">${vecchie}${aperte}${gruppi}${piede}${conv}${scrive}</div>
    ${parla}
    <p class="muted small center" style="margin:10px 0 0">Rispondo con i pulsanti o "Dimmelo a parole". Ogni risposta cambia davvero qualcosa nell'app e lo scrivo sotto.${auto.length ? ` Cose che faccio da sola: ${auto.length} (in Regole le spegni).` : ""}</p></div>`;
}
// ============================================================================
//  PARLARE CON LA GOVERNANTE (0.36): botta e risposta libero, scritto o dettato col microfono della tastiera.
//  Lei capisce con le parole del catalogo (parole.js), propone, e fa solo dopo il tuo "Sì".
// ============================================================================
let govScrive = false;
function conversazione() { return (S.chat && Array.isArray(S.chat.conversazione)) ? S.chat.conversazione : []; }
function ctxParole() {
  const zone = {}; for (const z of signore()) zone[z.id] = { ...S.zone[z.id], persona: SIG(z.id) };
  return { camere: S.camere, zone, regole: regoleGov(), oggi: L.oggiISO(), ora: oraRoma(), listino: S.listino };
}
async function salvaConversazione(righe) {
  const conv = righe.slice(-40);
  await salvaChat({ ...S.chat, conversazione: conv });
}
// Michele scrive o detta: lei capisce, risponde, e se c'è da fare qualcosa chiede conferma
async function parlaGov(testo, perIA) {
  const t = String(testo || "").trim(); if (!t) return;
  const conv = [...conversazione(), { chi: "io", testo: t, ora: S.db.adesso() }];
  salvaConversazione(conv); // non si aspetta: a schermo compare subito
  govScrive = true; disegna();
  if (voceAccesa()) { try { VOCE.scaldaLive(VOCE.leggiVoce(), confIA().chiave); } catch (e) {} }
  let msg = null;
  // prima prova la governante intelligente; se non c'è o non risponde, si torna alle parole del catalogo
  if (iaAccesa()) {
    try { msg = await rispostaIA(perIA || t, conv); }
    catch (e) { console.warn("ia", e); msg = null; toast("La governante intelligente non risponde: " + String(e.message || e)); }
  }
  if (!msg) {
    let r;
    try { r = PAROLE.capisci(t, ctxParole()); } catch (e) { console.warn("parole", e); r = { tipo: "boh", testo: "Mi sono persa. Riprova con parole semplici." }; }
    msg = await rispostaGov(r);
  }
  govScrive = false;
  salvaConversazione([...conversazione(), msg]); // idem: prima si vede, poi si salva
  if (voceAccesa() && msg && msg.testo) parlaConVoce(msg.testo);
}
// La risposta della governante: per le domande risponde subito, per le cose da fare chiede conferma
async function rispostaGov(r) {
  const base = { chi: "gov", ora: S.db.adesso() };
  if (r.tipo === "quando") return { ...base, testo: testoQuando(r.azione.regola, r.azione.camere) };
  if (r.tipo === "conto") return { ...base, testo: testoConto(r.azione.chi) };
  if (r.tipo === "piano") return { ...base, testo: testoPiano(r.azione.giorno, r.azione.chi) };
  if (r.tipo === "quale") return { ...base, testo: r.testo, tasti: r.tasti, scelteRegole: r.scelteRegole };
  if (r.tipo === "scelta") return { ...base, testo: r.testo, tasti: r.tasti, scelte: r.scelte };
  if (r.tipo === "fatto" || r.tipo === "aggiungi" || r.tipo === "togli" || r.tipo === "messaggio") {
    const a = r.azione;
    if ((r.tipo === "fatto" || r.tipo === "aggiungi") && !(a.camere || []).length) return { ...base, testo: `«${a.regola ? a.regola.nome : a.cosa}» dove?`, tasti: tastiDove(), azioneDove: a };
    return { ...base, testo: r.testo || testoProposta(a), tasti: r.tasti || [{ k: "si", testo: "Sì, fallo" }, { k: "no", testo: "No, lascia" }], azione: a };
  }
  return { ...base, testo: r.testo };
}
function tastiDove() { return [...signore().map(z => ({ k: "zona:" + z.id, testo: "Camere di " + SIG(z.id) })), { k: "tutte", testo: "In tutte" }, { k: "no", testo: "Lascia stare" }]; }
// Che cosa sto per fare, in parole e in euro
function testoTogli(a) {
  const regole = a.regole || [a.regola];
  return a.perSempre ? `Spengo «${regole.map(r => r.nome).join(", ")}»: non la propongo più finché non me lo dici tu. Confermo?`
    : `Tolgo «${regole.map(r => r.nome).join(", ")}»${(a.camere || []).length ? ` da ${a.camere.length} posti` : ""} dalle stelle di questa settimana: al suo posto entra la prossima più in ritardo. Confermo?`;
}
function testoProposta(a) {
  if (a.tipo === "fatto") {
    const n = a.camere.length, nomi = a.camere.slice(0, 4).map(id => camera(id).nome).join(", ");
    const altre = (a.altre || []).length ? ` (e anche ${a.altre.map(r => r.nome).join(", ")}, se le avete fatte)` : "";
    return `Segno «${a.regola.nome}» fatta ${a.giorno === L.oggiISO() ? "oggi" : L.dataBreve(a.giorno)} in ${n === 1 ? nomi : `${n} posti: ${nomi}${n > 4 ? "…" : ""}`}${altre}. Così non la richiedo più per un po'. Confermo?`;
  }
  if (a.tipo === "aggiungi") {
    const prezzi = G.prezziStelle(S.gov), euro = G.prezzoStella(a.minuti, prezzi), n = a.camere.length;
    const dove = a.camere.slice(0, 4).map(id => camera(id).nome).join(", ");
    return `Metto «${a.cosa || a.regola.nome}» da fare in ${n === 1 ? dove : `${n} posti: ${dove}${n > 4 ? "…" : ""}`}, ${a.minuti} minuti l'una, ${eur(euro)} l'una: in tutto ${eur(euro * n)}. Lo trovano nelle loro camere del prossimo passaggio. Confermo?`;
  }
  return "Confermo?";
}
// Le risposte "a voce" alle domande
function testoQuando(regola, camere) {
  const lista = (camere && camere.length ? camere : S.camere.map(c => c.id)).map(id => {
    const k = G.chiaveRegistro(regola.id, id), reg = S.registro[k];
    return { nome: camera(id).nome, ultima: reg && reg.ultima ? reg.ultima : null };
  }).filter(x => camere && camere.length ? true : x.ultima);
  if (!lista.length) return `«${regola.nome}» non risulta ancora fatta da nessuna parte: non ho niente nel registro.`;
  const oggi = L.oggiISO();
  const dette = lista.slice(0, 8).map(x => x.ultima ? `${x.nome}: ${L.dataBreve(x.ultima)} (${L.giorniTra(x.ultima, oggi)} giorni fa)` : `${x.nome}: mai`).join(" · ");
  const ogni = regola.ogni ? ` Si rifà ${G.etichettaOgni(regola.ogni).toLowerCase()}.` : "";
  return `«${regola.nome}» — ${dette}.${ogni}`;
}
function testoConto(chi) {
  const chiave = L.settimanaCorrente(), righe = signore().filter(z => !chi || z.id === chi).map(z => {
    const t = L.totaleSettimana(S.pulizie, z.id, chiave, S.regole, S.controlli, S.listino);
    return `${SIG(z.id)} ${eur(t.totale)} (${t.lista.length} ${t.lista.length === 1 ? "lavoro" : "lavori"}${t.stelle ? `, stelle ${eur(t.stelle)}` : ""})`;
  });
  const c = contoProspetto(L.lunediDi(L.oggiISO()), L.aggiungiGiorni(L.lunediDi(L.oggiISO()), 6));
  return `${righe.join(" · ")} — finora, questa settimana. Dal prospetto, la settimana intera viene ${eur(c.pulizie + c.stelle)}${c.lavori ? ` più ${eur(c.lavori)} di lavori a parte` : ""}.`;
}
function testoPiano(giorno, chi) {
  const righe = signore().filter(z => !chi || z.id === chi).map(z => {
    const ls = pulizieDelGiorno(giorno, z.id);
    if (!ls.length) return `${SIG(z.id)}: niente`;
    const min = ls.reduce((n, p) => n + (Number(p.minuti) || 0), 0);
    return `${SIG(z.id)}: ${ls.map(p => camera(p.camera).nome).join(", ")}${min ? ` (${L.testoOre(min)})` : ""}`;
  });
  return `${L.dataGiornoLungo(giorno).replace(/^./, c => c.toUpperCase())} — ${righe.join(" · ")}.`;
}
// Il tocco su un pulsante della conversazione
async function rispondiParole(i, k) {
  const conv = conversazione(); const msg = conv[i]; if (!msg) return;
  const chiudi = async (testo, fatto) => { const nuovo = [...conv]; nuovo[i] = { ...msg, tasti: null, scelto: testo }; if (fatto) nuovo.push({ chi: "gov", testo: fatto, fatto: true, ora: S.db.adesso() }); await salvaConversazione(nuovo); };
  if (k === "no") return chiudi("No", "Va bene, non faccio niente.");
  // "quale?" → scelgo la regola e rifaccio la proposta
  if (msg.scelteRegole) {
    const sc = msg.scelteRegole, regole = k === "tutte" ? sc.regole : [sc.regole[Number(String(k).slice(1)) || 0]];
    const a = sc.tipo === "aggiungi"
      ? { tipo: "aggiungi", regola: regole[0], cosa: regole.map(r => r.nome).join(" + "), camere: sc.camere, minuti: regole.reduce((n, r) => n + (r.minuti || 10), 0), regole }
      : sc.tipo === "togli" ? { tipo: "togli", regola: regole[0], regole, camere: sc.camere, perSempre: false }
      : { tipo: "fatto", regola: regole[0], altre: regole.slice(1), camere: sc.camere, giorno: L.oggiISO() };
    const nuovo = [...conv]; nuovo[i] = { ...msg, tasti: null, scelto: k === "tutte" ? "Tutte" : regole[0].nome };
    const serveDove = (a.tipo === "fatto" || a.tipo === "aggiungi") && !(a.camere || []).length;
    if (serveDove) nuovo.push({ chi: "gov", testo: `«${a.regola.nome}» dove?`, tasti: tastiDove(), azioneDove: a, ora: S.db.adesso() });
    else nuovo.push({ chi: "gov", testo: a.tipo === "togli" ? testoTogli(a) : testoProposta(a), tasti: [{ k: "si", testo: "Sì, fallo" }, { k: "no", testo: "No, lascia" }], azione: a, ora: S.db.adesso() });
    return salvaConversazione(nuovo);
  }
  // "che faccio?" sul nome di una cosa
  if (msg.scelte) {
    const sc = msg.scelte;
    if (k === "quando") return chiudi("Quando?", testoQuando(sc.regola, sc.camere));
    const a = k === "fatto" ? { tipo: "fatto", regola: sc.regola, altre: [], camere: sc.camere, giorno: L.oggiISO() }
      : { tipo: "aggiungi", regola: sc.regola, cosa: sc.regola.nome, camere: sc.camere, minuti: sc.regola.minuti || 10 };
    const nuovo = [...conv]; nuovo[i] = { ...msg, tasti: null, scelto: k === "fatto" ? "È già fatta" : "Falla fare" };
    if ((a.camere || []).length) nuovo.push({ chi: "gov", testo: testoProposta(a), tasti: [{ k: "si", testo: "Sì, fallo" }, { k: "no", testo: "No, lascia" }], azione: a, ora: S.db.adesso() });
    else nuovo.push({ chi: "gov", testo: `«${sc.regola.nome}» dove?`, tasti: tastiDove(), azioneDove: a, ora: S.db.adesso() });
    return salvaConversazione(nuovo);
  }
  // "dove?" → scelgo le camere e rifaccio la proposta
  if (msg.azioneDove) {
    const a = { ...msg.azioneDove };
    a.camere = k === "tutte" ? S.camere.map(c => c.id) : String(k).startsWith("zona:") ? S.camere.filter(c => (signoraDiCamera(c.id) || L.zonaDi(c, S.regole)) === k.slice(5)).map(c => c.id) : [];
    const nuovo = [...conv]; nuovo[i] = { ...msg, tasti: null, scelto: k === "tutte" ? "In tutte" : "Camere di " + SIG(k.slice(5)) };
    nuovo.push({ chi: "gov", testo: testoProposta(a), tasti: [{ k: "si", testo: "Sì, fallo" }, { k: "no", testo: "No, lascia" }], azione: a, ora: S.db.adesso() });
    return salvaConversazione(nuovo);
  }
  // conferma: lo faccio davvero
  if (msg.azione && k === "si") {
    let fatto = "";
    try { fatto = await eseguiParole(msg.azione); } catch (e) { console.warn("parole/azione", e); fatto = "Non ci sono riuscita, riprova tra un attimo."; }
    return chiudi("Sì", fatto);
  }
}
// Qui la governante fa davvero le cose
async function eseguiParole(a) {
  if (a.tipo === "messaggio") { await scriviMessaggio(a.giorno, a.testo); return `Fatto: le signore lo leggono ${a.giorno === L.oggiISO() ? "oggi" : L.dataBreve(a.giorno)} in cima alla loro schermata.`; }
  if (a.tipo === "fatto") {
    const regole = [a.regola, ...(a.altre || [])], n = [];
    for (const r of regole) for (const id of a.camere) { const c = camera(id); await registraFatto(r.id, id, signoraDiCamera(id) || c.zona, a.giorno); n.push(id); }
    return `Fatto: segnata «${regole.map(r => r.nome).join(", ")}» in ${a.camere.length} ${a.camere.length === 1 ? "posto" : "posti"} il ${L.dataBreve(a.giorno)}. Non la richiedo più finché non torna il suo turno.`;
  }
  if (a.tipo === "togli") {
    const regole = a.regole || [a.regola];
    if (a.perSempre) { const regoleImp = { ...((S.gov && S.gov.regole) || {}) }; for (const r of regole) regoleImp[r.codice] = { ...(regoleImp[r.codice] || {}), attiva: false }; await salvaGov({ regole: regoleImp });
      return `Fatto: «${regole.map(r => r.nome).join(", ")}» spenta. La riaccendi in Governante → Regole quando vuoi.`; }
    const w = L.settimanaCorrente(), cur = (S.gov && S.gov.stelleEscluse) || {}, lista = new Set(cur[w] || []);
    const camere = (a.camere || []).length ? a.camere : S.camere.map(c => c.id);
    for (const r of regole) for (const id of camere) lista.add(`${r.id}|${id}`);
    await salvaGov({ stelleEscluse: { ...cur, [w]: [...lista] } });
    return `Fatto: tolta dalle stelle di questa settimana. Al suo posto entra la prossima più in ritardo.`;
  }
  if (a.tipo === "istruzione") {
    const chi = a.zona === "tutte" ? "tutte le signore" : SIG(a.zona);
    await salvaIstruzione(a);
    return `Fatto: ${chi} ${a.zona === "tutte" ? "la trovano" : "la trova"} ${a.giorno === L.oggiISO() ? "oggi" : L.dataBreve(a.giorno)} in cima alla sua schermata, coi ${a.passi.length} passi e i disegnini.`;
  }
  if (a.tipo === "aggiungi") {
    const prezzi = G.prezziStelle(S.gov), euro = G.prezzoStella(a.minuti, prezzi), oggi = L.oggiISO();
    const ops = []; let n = 0; const quando = [];
    for (const id of a.camere) {
      const cam = camera(id);
      const prossima = Object.values(S.pulizie).filter(p => p.camera === id && p.data > oggi && p.origine !== "governante" && p.tipo !== "extra" && p.stato === "da_fare").sort((x, y) => x.data < y.data ? -1 : 1)[0];
      const data = prossima ? prossima.data : L.aggiungiGiorni(oggi, 1);
      const zona = prossima ? prossima.zona : (signoraDiCamera(id) || L.zonaDi(cam, S.regole));
      const pid = `${data}_${id}_x${Date.now().toString(36)}${n}`;
      ops.push({ tipo: "salva", coll: "pulizie", id: pid, dati: { id: pid, data, camera: id, zona, tipo: "extra", titolo: a.cosa || a.regola.nome, passi: a.regola && a.regola.come ? [a.regola.come] : [], regola: a.regola ? a.regola.id : null, minuti: a.minuti, importo: euro, stato: "da_fare", origine: "mano", creato: S.db.adesso(), da: "la governante" } });
      quando.push(`${cam.nome} ${L.dataBreve(data)}`); n++;
    }
    await S.db.scrivi(ops);
    for (const o of ops) S.pulizie[o.id] = o.dati;
    disegna();
    return `Fatto: ${n} ${n === 1 ? "lavoro messo" : "lavori messi"} (${quando.slice(0, 4).join(", ")}${n > 4 ? "…" : ""}), ${eur(euro * n)} in tutto. Le signore lo vedono nelle loro camere di quel giorno.`;
  }
  return "Fatto.";
}
// ============================================================================
//  LA GOVERNANTE INTELLIGENTE (0.38)
//  Dietro c'è un'intelligenza artificiale vera (Gemini, ChatGPT o Claude, a
//  scelta tua). Le mandiamo una "fotografia" della casa — senza i nomi degli
//  ospiti — e lei risponde, consiglia e PROPONE. Non fa mai niente da sola:
//  la proposta passa sempre dal tuo "Sì, fallo", come prima.
//  Senza chiave, o se internet non va, l'app torna da sola alle parole del
//  catalogo (parole.js) e non si accorge nessuno.
// ============================================================================
const VELOCI_IA = [
  { tasto: "Dammi un consiglio", chiedo: "Dammi un consiglio", testo: "Guarda la fotografia della casa e dimmi le 2 o 3 cose più importanti da fare adesso, in ordine. Se c'è qualcosa da far fare alle signore, proponimela." },
  { tasto: "Come va oggi?", chiedo: "Come va oggi?", testo: "Raccontami com'è andata oggi: cosa è fatto, cosa manca e quanto stiamo spendendo questa settimana. Corto." },
  { tasto: "Cosa è rimasto indietro?", chiedo: "Cosa è rimasto indietro?", testo: "Dimmi le cose del catalogo più in ritardo e quali conviene recuperare per prime, coi giorni." },
  { tasto: "Guarda i soldi", chiedo: "Guarda i soldi", testo: "Guarda i soldi di questa settimana: quanto prende ogni signora, se siamo sopra o sotto i 100 € a testa che spendo di solito, e se c'è qualcosa di strano." },
];
// La bocca si apre e si chiude su quanto è forte la voce, istante per istante.
let voceInCorso = false, provaVoce = null, voceInProva = false, cercaModelloVoce = null;
function applicaBocca(forza) {
  const f = Math.max(0, Math.min(1, Number(forza) || 0));
  const v = f < 0.07 ? "" : f < 0.24 ? "c" : f < 0.52 ? "b" : "a";
  document.querySelectorAll(".donnina.gov-fig").forEach(svg => { svg.dataset.v = v; svg.style.setProperty("--apri", f.toFixed(2)); });
  boccaFilm(f);
}
// Il filmato "parla" va avanti solo mentre c'e' voce, e va piu' svelto quando lei
// alza il tono: non e' un vero labiale (il filmato e' gia' girato), ma la bocca si
// ferma nei silenzi e si muove sulle parole, cosi' sembra sincronizzata.
let boccaSuono = 0;
// 0.80: SOLO FILMATI. Il labiale (maschera, bocche vere, sincronia) e' SPENTO: il filmato "parla"
// scorre normale mentre lei parla. Il codice resta (bocca.js, viso.js) per poterlo riaccendere.
const LABIALE_ACCESO = false;
function boccaFilm(f) {
  if (!LABIALE_ACCESO) return;               // 0.80: il filmato non si ferma piu' nelle pause ne' cambia velocita'

  if (labiali.some(l => l.pronta)) return;   // 0.72: con la tela attiva il filmato deve scorrere normale: e' lo sfondo vivo della bocca
  const ora = Date.now();
  if (f >= 0.06) boccaSuono = ora;
  // una pausa corta fra due sillabe non deve bloccare il filmato: aspetto 220 ms
  const fermo = (ora - boccaSuono) > 220;
  for (const box of document.querySelectorAll(".gov-film")) {
    if (box.dataset.film !== "parla") continue;
    const v = [...box.querySelectorAll("video")].find(x => !x.classList.contains("giu"));
    if (!v) continue;
    if (fermo !== v.paused) { if (fermo) { try { v.pause(); } catch (e) {} } else { v.play().catch(() => {}); } }
    if (!fermo) {
      const r = Math.max(0.6, Math.min(1.7, 0.6 + f * 1.8));
      if (Math.abs((v.playbackRate || 1) - r) > 0.12) { try { v.playbackRate = r; } catch (e) {} }
    }
  }
}
let vitaGovTimer = null, vitaOcchiTimer = null, vitaSguardoTimer = null, vitaPosa = "base";
function sguardoGov() {
  const f = document.querySelector(".gov-corpo.viva");
  if (f && !document.hidden) {
    const s = ["", "sx", "dx", "su", "sx", "dx", "", "su"][Math.floor(Math.random() * 8)];
    f.dataset.sg = s;
  }
  vitaSguardoTimer = setTimeout(sguardoGov, 900 + Math.random() * 1700);
}
function vivaGov() { return document.querySelector(".gov-corpo.viva") || document.querySelector(".gov-foto.viva.grande"); }
function gestoGov() {
  const f = vivaGov(); if (!f || document.hidden) return;
  const r = Math.random();
  if (r < 0.58) {
    const p = ["base", "saluto", "riposo", "indica", "cuore", "pollice", "base", "indica", "saluto"];
    let n = p[Math.floor(Math.random() * p.length)];
    if (n === vitaPosa) n = vitaPosa === "base" ? "saluto" : "base";
    vitaPosa = n; f.dataset.posa = n;
    f.classList.remove("scatto"); void f.offsetWidth; f.classList.add("scatto");
    setTimeout(() => { if (f.isConnected) f.classList.remove("scatto"); }, 640);
  } else if (r < 0.84 && !f.classList.contains("parla")) {
    f.dataset.um = "felice";
    setTimeout(() => { if (f.isConnected) f.dataset.um = ""; }, 1100 + Math.random() * 700);
  }
}
function battiGov() {
  const f = vivaGov();
  if (f && !document.hidden) {
    const doppio = Math.random() < 0.38;
    f.classList.add("batte");
    setTimeout(() => {
      f.classList.remove("batte");
      if (doppio) setTimeout(() => { f.classList.add("batte"); setTimeout(() => f.classList.remove("batte"), 95); }, 95);
    }, 115);
  }
  vitaOcchiTimer = setTimeout(battiGov, 1500 + Math.random() * 2300);
}
function vitaGov() {
  if (vitaGovTimer) return;
  vitaGovTimer = setInterval(gestoGov, 1900);
  battiGov();
  sguardoGov();
}
vitaGov();
function voceAccesa() { return !!VOCE.leggiVoce().attiva; }
// ---- 0.66: IL LABIALE VERO ------------------------------------------------
// Quando parte l'audio della voce vera, bocca.js legge tutto il suono, lo mette
// in fila col testo letto e decide, istante per istante, che forma deve avere la
// bocca. Sopra il filmato si appoggia una tela con la sua foto e la bocca giusta:
// si apre sulle vocali, si chiude su M/B/P, sta ferma nei silenzi. Quando la
// frase finisce la tela sparisce e torna il filmato.
let labiali = [], labPiano = null, labSpegni = null, labCerca = 0, labRotto = false;
function labialeBox() { return [...document.querySelectorAll(".gov-film")].filter(b => b.offsetWidth > 0 && b.offsetHeight > 0); }
function labialeMonta() {
  if (!LABIALE_ACCESO || labRotto) return;
  labiali = labiali.filter(l => l.tela && l.tela.isConnected || l.riserva || (l._montando && Date.now() - l._montando < 8000));
  for (const box of labialeBox()) {
    if (labiali.some(l => l.box === box)) continue;
    const l = new BOCCA.Labiale(box); l._montando = Date.now();
    labiali.push(l);
    l.monta().then(() => { l._montando = 0; labialeVitaVia(); }).catch(e => { console.warn("labiale", e); labRotto = true; labiali = labiali.filter(x => x !== l); });
  }
  if (labiali.length) labialeVitaVia();
}
// 0.74: la maschera si monta e si smonta seguendo il FILMATO (vedi filmVigila), non la voce.
// Mentre e' su, un "battito" la ridisegna anche senza voce: bocca chiusa, viso che segue il
// video (testa, occhi, sopracciglia veri). Quando arriva la voce, labialeTick la guida.
let labVita = null, labTick = null, labFine = 0;
// 0.78: la FLUIDITA' misurata (disegni al secondo mentre parla, e il buco piu' lungo): alla fine
// di ogni frase si mostra un avviso discreto, cosi' Michele puo' dirmi che numero vede sul telefono
let labStat = null;
function labStatConta(ora) { if (!labPiano) return; if (!labStat) labStat = { n: 0, t0: ora, ultimo: ora, buco: 0 }; labStat.n++; const g = ora - labStat.ultimo; if (g > labStat.buco) labStat.buco = g; labStat.ultimo = ora; }
function labStatMostra() {
  const s = labStat; labStat = null; if (!s || s.n < 10) return;
  const sec = (s.ultimo - s.t0) / 1000; if (sec < 1.5) return;
  const al = Math.round(s.n / sec), buco = Math.round(s.buco);
  try { toast(`Fluidità: ${al} disegni al secondo, buco più lungo ${buco} ms`); } catch (e) {}
}
function labialeTieni(box, si) {
  if (!LABIALE_ACCESO || labRotto || !box) return;
  labiali = labiali.filter(l => l.tela && l.tela.isConnected || l.riserva || (l._montando && Date.now() - l._montando < 8000));
  const c = labiali.find(l => l.box === box);
  if (si && !c) {
    if (!(box.offsetWidth > 0 && box.offsetHeight > 0)) return;
    const l = new BOCCA.Labiale(box); l._montando = Date.now();
    labiali.push(l);
    l.monta().then(() => { l._montando = 0; labialeVitaVia(); }).catch(e => { console.warn("labiale", e); labRotto = true; labiali = labiali.filter(x => x !== l); });
  } else if (!si && c) {
    labiali = labiali.filter(x => x !== c);
    try { c.smonta(); } catch (e) {}
  }
  if (!labiali.length) labialeVitaFerma();
}
function labialeVitaVia() {
  if (labVita) return;
  let ultimo = 0;
  const tick = () => {
    if (!labVita) return;
    const ora = performance.now();
    if (ora - ultimo < 14 || document.hidden) return; ultimo = ora;
    let vivi = 0;
    for (const l of labiali) {
      if (!l.pronta) { vivi++; continue; }
      vivi++;
      if (ora - (l.tDisegno || 0) < 40) continue;              // ha appena disegnato col tick della voce
      // 0.78: a riposo (niente voce da almeno 0,7 s) si ridisegna solo quando il filmato cambia
      // fotogramma (24 volte al secondo, non 60): meno lavoro per il telefono
      const riposo = !labPiano && ora - labFine > 700;
      if (riposo && l.ultimaFonte === "video" && l.fotogramma === l._frDisegnato) continue;
      let r = null;
      if (labPiano && labTick) {
        // fra un tick della voce e l'altro si stima dove siamo nel piano
        const t = labTick.t + (ora - labTick.quando) / 1000;
        try { r = labPiano.forma(t + 0.04 + labAnticipo() / 1000); } catch (e) { r = null; }
      }
      l.disegna(r ? (r.v || null) : null, r ? (r.ap || 0) : 0, 0, l.tUltimo || 0, r);
      l._frDisegnato = l.fotogramma;
      labStatConta(ora);
    }
    if (!vivi) labialeVitaFerma();
  };
  labVita = { iv: setInterval(tick, 25), raf: 0 };
  const loop = () => { if (!labVita) return; tick(); labVita.raf = requestAnimationFrame(loop); };
  labVita.raf = requestAnimationFrame(loop);
}
function labialeVitaFerma() { if (!labVita) return; clearInterval(labVita.iv); cancelAnimationFrame(labVita.raf); labVita = null; }
function labialeAvvia(buf, testoLetto, durata) {
  if (!LABIALE_ACCESO) return;
  clearTimeout(labSpegni); labSpegni = null;
  try {
    // con la voce vera si legge il suono; con quella del telefono si stima dal testo
    const prof = buf && buf.vivo ? buf : buf && typeof buf.getChannelData === "function" ? BOCCA.profilo(buf) : BOCCA.profiloFinto(testoLetto, durata);
    labPiano = BOCCA.piano(testoLetto, prof);
  } catch (e) { console.warn("labiale piano", e); labPiano = null; return; }
  labialeMonta();
}
function labialeTick(forza, t) {
  if (!LABIALE_ACCESO || !labPiano) return;
  const ora = Date.now();
  if (ora - labCerca > 500) { labCerca = ora; labialeMonta(); }   // se la pagina si e' ridisegnata, la tela si rimette
  // 0.69: si guarda 40 ms AVANTI nel piano: la bocca disegnata insegue con un piccolo
  // ritardo, cosi' arriva in tempo col suono (la bocca che anticipa di poco non si
  // nota, quella in ritardo si').
  // 0.72: piu' l'ANTICIPO scelto da Michele nelle impostazioni (in millesimi, anche negativo):
  // ogni telefono e ogni cassa Bluetooth ritardano il suono in modo diverso.
  const r = labPiano.forma((t || 0) + 0.04 + labAnticipo() / 1000);
  labTick = { t: t || 0, quando: performance.now() };
  for (const l of labiali) if (l.pronta) { l.disegna(r.v || null, r.ap == null ? 0 : r.ap, Math.max(r.forza, Number(forza) || 0), t || 0, r); l._frDisegnato = l.fotogramma; labStatConta(performance.now()); }   // 0.69: vocale + apertura; 0.74: tutto il piano (r)
}
let labAntCache = { t: 0, v: 0 };
function labAnticipo() {
  const ora = Date.now();
  if (ora - labAntCache.t > 1000) { const a = Number(VOCE.leggiVoce().anticipo); labAntCache = { t: ora, v: Number.isFinite(a) ? Math.max(-400, Math.min(400, a)) : 0 }; }
  return labAntCache.v;
}
function labialeFerma(subito) {
  if (!LABIALE_ACCESO) return;
  // 0.74: finisce solo la VOCE: la maschera resta su (bocca che si chiude da sola col suo
  // battito) finche' il filmato "parla" non lascia il posto a quello di riposo (filmVigila).
  labStatMostra();
  labPiano = null; labTick = null; labFine = performance.now();
  for (const l of labiali) if (l.pronta) l.disegna(null, 0, 0, l.tUltimo || 0, null);
  clearTimeout(labSpegni); labSpegni = null;
  if (labiali.length) labialeVitaVia();
}
if (LABIALE_ACCESO) setTimeout(() => { try { BOCCA.precarica().catch(() => {}); } catch (e) {} }, 4000);
async function parlaConVoce(testo) {
  let vc = VOCE.leggiVoce(); if (!vc.attiva) return;
  // il modello della voce TTS (la riserva del canale Live) si cerca una volta sola, senza
  // far aspettare la frase: 0.67, la frase parte col canale Live anche senza modello
  if (vc.motore === "google" && !vc.modello && confIA().chiave && !cercaModelloVoce) {
    cercaModelloVoce = VOCE.trovaModelloVoce(confIA().chiave).then(m => VOCE.salvaVoce({ modello: m })).catch(e => console.warn("modello voce", e)).finally(() => { cercaModelloVoce = null; });
  }
  voceInCorso = true; statoCons("parla"); disegna();
  await VOCE.parla(testo, { conf: vc, chiave: confIA().chiave,
    onInizio: (buf, letto, durata) => labialeAvvia(buf, letto, durata),
    onBocca: (f, t) => { applicaBocca(f); labialeTick(f, t); },
    onFine: () => { voceInCorso = false; applicaBocca(0); labialeFerma(); if (document.body.dataset.cons === "parla") statoCons("ferma"); disegna(); },
    onErrore: (e) => toast(String(e && e.message || "Voce vera non disponibile") + " Per ora parla il telefono.") });
}
function zittisciVoce() { VOCE.stazitta(); voceInCorso = false; applicaBocca(0); labialeFerma(true); }

// 0.42: parlarle col microfono, senza tastiera. Su Android funziona dentro l'app;
// su iPhone il motore non c'è e si usa il microfono della tastiera (glielo diciamo).
let ascolto = null;
function micDisponibile() { try { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); } catch (e) { return false; } }
function segnaMic(on) {
  document.querySelectorAll("[data-mic]").forEach(b => { b.classList.toggle("ascolta", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
  document.querySelectorAll(".gov-viva").forEach(g => g.classList.toggle("ascolta", on));
}
function microfono() {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return toast("Qui dentro non posso aprire il microfono: usa quello della tastiera, accanto alla barra spaziatrice");
  if (ascolto) { try { ascolto.stop(); } catch (e) {} return; }
  zittisciVoce();
  const ta = document.getElementById("parlaGov");
  const r = new R(); r.lang = "it-IT"; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  let finale = "";
  r.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) finale += t; else interim += t; }
    if (ta) { ta.value = (finale + interim).trim(); ta.style.height = "auto"; ta.style.height = Math.min(120, ta.scrollHeight) + "px"; }
  };
  r.onerror = (e) => { ascolto = null; segnaMic(false); if (e.error === "not-allowed" || e.error === "service-not-allowed") toast("Il telefono non mi dà il microfono: dallo a questa app nelle impostazioni"); else if (e.error !== "aborted" && e.error !== "no-speech") toast("Non ti ho sentito, riprova"); };
  r.onend = () => {
    ascolto = null; segnaMic(false);
    const t = (ta?.value || "").trim();
    if (t) { ta.value = ""; ta.style.height = "auto"; parlaGov(t); }
  };
  try { r.start(); ascolto = r; segnaMic(true); VOCE.sbloccaAudio(); } catch (e) { ascolto = null; segnaMic(false); toast("Microfono non disponibile"); }
}

let provaIA = null;      // il risultato dell'ultimo "Prova la chiave"
let iaInCorso = false;   // sta pensando

function confIA() { return IA.leggiConf(); }
function iaAccesa() { return proprietario() && IA.accesa(confIA()); }

// --- l'elenco delle sigle che l'IA può usare -------------------------------
function postiIA() { return [...S.camere, ...G.LUOGHI_COMUNI]; }
function elenchiIA() {
  const camere = postiIA().map(c => {
    const z = signoraDiCamera(c.id) || c.zona;
    const che = c.tipo === "casa" ? "appartamento" : c.tipo === "comune" ? "zona comune" : "camera";
    let modo = ""; try { if (c.tipo !== "comune") modo = ", modo " + G.MODI[G.modoDi(c, L.oggiISO(), ctxGov())].nome; } catch (e) {}
    return `${c.id} = ${c.nome} (${che}, ${S.zone[z]?.nome || z}${SIG(z) ? ", la pulisce " + SIG(z) : ""}${modo})`;
  }).join("\n");
  const regole = regoleGov().map(r => `${r.codice} ${r.posto}/${r.superficie}${r.regola && r.regola !== r.superficie ? ": " + r.regola : ""}${r.ogni ? ` (${G.etichettaOgni(r.ogni).toLowerCase()})` : ""}`).join("\n");
  return { camere, regole, nome: nomeGov(), gesti: GESTI.ELENCO_GESTI };
}

// --- la fotografia della casa, adesso (mai i nomi degli ospiti) ------------
function fotografiaIA() {
  const oggi = L.oggiISO(), ora = oraRoma(), l = L.listinoCompleto(S.listino), R = [];
  const prova = (etichetta, f) => { try { const t = f(); if (t) R.push(t); } catch (e) { console.warn("foto/" + etichetta, e); } };
  R.push(`OGGI è ${L.dataGiornoLungo(oggi)} (${oggi}), ore ${ora}:00 circa. La paga della settimana chiude sabato alle ${(S.regole.chiusuraPaga || {}).ora || 14}.`);
  prova("signore", () => `LE SIGNORE: ${signore().map(z => `${SIG(z.id)} (${z.zonaNome})`).join(" · ")}. Si paga ${eur(l.tariffe.albergo)} l'ora in albergo e in via Nazario Sauro (Lella e Nicole), ${eur(l.tariffe.appartamenti)} l'ora negli appartamenti, sulle ore standard${l.pagaCol === "vero" ? " — ma adesso è acceso il pagamento a minuto col cronometro" : ""}. Le stelle in più le fa solo ${SIG(l.zonaStelle)}; i controlli incrociati valgono ${eur(l.controllo)} l'uno.`);
  prova("lavoro", () => {
    const ls = pulizieDelGiorno(oggi);
    if (!ls.length) return "LAVORO DI OGGI: niente in programma.";
    return "LAVORO DI OGGI:\n" + ls.map(p => `- ${camera(p.camera).nome}: ${titoloLavoro(p)}${Number(p.minuti) ? ", " + p.minuti + " minuti" : ""}, ${eur(p.importo)}, ${SIG(p.zona)} — ${p.stato === "fatta" ? "FATTA alle " + L.oraBreve(p.ora) : p.stato === "in_corso" ? "in corso da " + L.oraBreve(p.inizio) : p.stato === "problema" ? "PROBLEMA: " + (p.nota || "segnalato") : p.stato === "non_fatta" ? "non fatta" : "da fare"}`).join("\n");
  });
  prova("domani", () => {
    const d = L.aggiungiGiorni(oggi, 1), ls = pulizieDelGiorno(d);
    return `DOMANI (${L.dataGiornoLungo(d)}): ${ls.length ? ls.map(p => `${camera(p.camera).nome} (${SIG(p.zona)})`).join(", ") : "niente"}.`;
  });
  prova("settimana", () => {
    const chiave = L.settimanaCorrente();
    return "SOLDI GIÀ MATURATI QUESTA SETTIMANA: " + signore().map(z => {
      const t = L.totaleSettimana(S.pulizie, z.id, chiave, S.regole, S.controlli, S.listino);
      return `${SIG(z.id)} ${eur(t.totale)} (ore ${eur(t.ore)}${t.stelle ? ", stelle " + eur(t.stelle) : ""}${t.controlliFatti && t.controlliFatti.importo ? ", controlli " + eur(t.controlliFatti.importo) : ""}${t.tagli ? ", tagliati " + eur(t.tagli) : ""})`;
    }).join(" · ") + ". Di solito spendo circa 100 € a testa a settimana: è il tetto.";
  });
  prova("prospetto", () => {
    const lun = L.lunediDi(oggi), c = contoProspetto(lun, L.aggiungiGiorni(lun, 6));
    return `DAL PROSPETTO, LA SETTIMANA INTERA: pulizie ${eur(c.pulizie)} + stelle ${eur(c.stelle)} = ${eur(c.pulizie + c.stelle)}${c.lavori ? `, più ${eur(c.lavori)} di lavori a parte` : ""}.`;
  });
  prova("stelle", () => {
    const ss = stelleSettimanaApp(); if (!ss) return "";
    return `STELLE DI ${String(SIG(ss.zona)).toUpperCase()}: obiettivo ${eur(ss.obiettivo)} a settimana, adesso siamo a ${eur(ss.euro)}${ss.fatte.length ? ` (${ss.fatte.length} già fatte)` : ""}. In programma da qui a sabato: ${ss.righe.slice(0, 8).map(r => `${r.luogoNome}/${r.nome}`).join(", ") || "niente"}.`;
  });
  prova("controlli", () => {
    const righe = [];
    for (const z of signore()) {
      const co = L.controlliDaFare({ zona: z.id, iso: oggi, listino: S.listino, pulizie: S.pulizie, controlli: S.controlli, camere: S.camere, regole: S.regole, adesso: new Date() });
      if (co.quota) righe.push(`${SIG(z.id)} oggi deve controllare ${co.quota} ${co.quota === 1 ? "camera" : "camere"} (ne ha fatte ${co.fattiOggi.length}${co.daFare.length ? `, da fare: ${co.daFare.map(p => camera(p.camera).nome).join(", ")}` : ""})`);
      const rif = L.daRifare(S.controlli, z.id, S.regole, new Date());
      if (rif.length) righe.push(`${SIG(z.id)} ha ${rif.reduce((n, x) => n + x.voci.length, 0)} cose bocciate da rifare entro sabato alle 14 (${rif.slice(0, 3).map(x => camera(x.controllo.camera).nome).join(", ")})`);
    }
    return righe.length ? "CONTROLLI INCROCIATI: " + righe.join(" · ") + "." : "";
  });
  prova("indietro", () => {
    const g = indietroIA(10);
    return g.length ? "PIÙ IN RITARDO NEL CATALOGO (raggruppato per regola):\n" + g.map(x =>
      `- ${x.codice} ${x.nome} (si rifà ${G.etichettaOgni(x.ogni).toLowerCase()}): ${x.mai.length ? `mai fatta in ${x.mai.length} ${x.mai.length === 1 ? "posto" : "posti"} (${x.mai.slice(0, 5).join(", ")}${x.mai.length > 5 ? "…" : ""})` : ""}${x.mai.length && x.tardi.length ? "; " : ""}${x.tardi.length ? `in ritardo: ${x.tardi.slice(0, 5).map(t => `${t.nome} ${t.giorni} gg fa`).join(", ")}${x.tardi.length > 5 ? "…" : ""}` : ""}`).join("\n") : "";
  });
  prova("tabellone", () => { const t = tabellone(); return t ? `TABELLONE: copertura ${t.copertura}%, buchi ${t.buchi}.` : ""; });
  prova("manutenzione", () => {
    const ap = lavoriAperti(); if (!ap.length) return "MANUTENZIONE: niente aperto.";
    return `MANUTENZIONE APERTA (${ap.length}): ` + ap.slice(0, 6).map(m => `${m.titolo}${m.camera ? " in " + camera(m.camera).nome : ""} (da ${L.giorniTra(m.data, oggi)} giorni)`).join(" · ") + ".";
  });
  prova("occupate", () => {
    const dentro = soggiorniLista().filter(x => x.inizio <= oggi && x.fine > oggi).map(x => camera(x.camera).nome);
    const parte = soggiorniLista().filter(x => x.fine === oggi).map(x => camera(x.camera).nome);
    return `CAMERE OCCUPATE OGGI: ${dentro.length ? dentro.join(", ") : "nessuna"}${parte.length ? ` · partono oggi: ${parte.join(", ")}` : ""}. (I nomi degli ospiti non te li mando mai.)`;
  });
  prova("settimanaPiano", () => {
    const lun = L.lunediDi(oggi), righe = [];
    for (let i = 0; i < 7; i++) {
      const d = L.aggiungiGiorni(lun, i), ls = pulizieDelGiorno(d);
      if (!ls.length) { righe.push(`${L.dataGiornoLungo(d)}${d === oggi ? " (OGGI)" : ""}: niente`); continue; }
      const per = {};
      for (const x of ls) { const z = x.zona; per[z] = per[z] || { n: 0, min: 0 }; per[z].n++; per[z].min += Number(x.minuti) || 0; }
      righe.push(`${L.dataGiornoLungo(d)}${d === oggi ? " (OGGI)" : ""}: ` + Object.entries(per).map(([z, v]) => `${SIG(z)} ${v.n} ${v.n === 1 ? "posto" : "posti"}${v.min ? ", " + L.testoOre(v.min) : ""}`).join(" · "));
    }
    return "LA SETTIMANA INTERA DAL PROSPETTO:\n" + righe.map(r => "- " + r).join("\n");
  });
  prova("partenze", () => {
    const righe = [];
    for (let i = 0; i <= 3; i++) {
      const d = L.aggiungiGiorni(oggi, i);
      const part = soggiorniLista().filter(x => x.fine === d), arr = soggiorniLista().filter(x => x.inizio === d);
      if (!part.length && !arr.length) continue;
      const senza = part.filter(x => !Object.values(S.pulizie).some(pp => pp.camera === x.camera && pp.data === d && pp.stato !== "non_fatta"));
      righe.push(`${L.dataGiornoLungo(d)}: partono ${part.length ? part.map(x => camera(x.camera).nome).join(", ") : "nessuna"}; arrivano ${arr.length ? arr.map(x => camera(x.camera).nome).join(", ") : "nessuna"}${senza.length ? ` — ATTENZIONE: ${senza.map(x => camera(x.camera).nome).join(", ")} ${senza.length === 1 ? "parte" : "partono"} e non c'è nessuna pulizia in programma quel giorno` : ""}`);
    }
    return righe.length ? "ARRIVI E PARTENZE DEI PROSSIMI GIORNI (senza nomi):\n" + righe.map(r => "- " + r).join("\n") : "";
  });
  prova("messaggio", () => { const m = (S.messaggi || {})[oggi]; return m && m.testo ? `MESSAGGIO DI OGGI ALLE SIGNORE: «${m.testo}»` : ""; });
  prova("spesa", () => {
    const voci = Object.values((S.spesa || {}).voci || {}).filter(v => v && !v.fatto);
    return voci.length ? `DA COMPRARE: ${voci.slice(0, 8).map(v => v.nome || v.cosa).join(", ")}.` : "";
  });
  prova("chat", () => { const n = statoChatApp().aperte.length; return n ? `DOMANDE CHE TI HO GIÀ FATTO E ASPETTANO RISPOSTA: ${n}.` : ""; });
  return R.join("\n");
}
// Le cose del catalogo più in ritardo, raggruppate per regola: le peggiori prima
function indietroIA(max = 10) {
  const oggi = L.oggiISO(), per = {}, visti = new Set(), fl = flagsGov();
  // una regola non vale dappertutto: la lavanderia è un posto solo, la cucina solo negli appartamenti
  const vale = (r, c) => {
    const g = r.gruppo || "";
    if (g === "lavanderia") return c.id === "lavanderia";
    if (g === "comuni") return c.tipo === "comune";
    if (c.tipo === "comune") return g === "comuni";
    if (g === "cucina") return c.tipo === "casa";
    if (g === "balcone") return !!(fl.balconi || {})[c.id];
    return true;
  };
  for (const r of regoleGov()) {
    if (!r.ogni || r.ogni < 3) continue; // le cose di tutti i giorni non sono "indietro": sono la routine
    for (const c of postiIA()) {
      if (!vale(r, c)) continue;
      const k = r.codice || r.id, kk = k + "|" + c.id;
      if (visti.has(kk)) continue; visti.add(kk);
      const reg = S.registro[G.chiaveRegistro(r.id, c.id)], ultima = reg && reg.ultima;
      const giorni = ultima ? L.giorniTra(ultima, oggi) : Math.round(r.ogni * 3);
      if (giorni <= r.ogni) continue;
      per[k] = per[k] || { codice: k, nome: `${r.posto}/${r.superficie}`, ogni: r.ogni, mai: [], tardi: [], peggio: 0 };
      if (ultima) per[k].tardi.push({ nome: c.nome, giorni }); else per[k].mai.push(c.nome);
      per[k].peggio = Math.max(per[k].peggio, giorni / r.ogni);
    }
  }
  return Object.values(per).sort((a, b) => b.peggio - a.peggio || a.ogni - b.ogni).slice(0, max);
}
function sistemaIA() { return IA.istruzioni({ oggi: L.oggiISO(), testo: fotografiaIA() }, elenchiIA()); }

// --- da quello che dice l'IA a un'azione vera dell'app ---------------------
function camereDaIA(dove) {
  const lista = Array.isArray(dove) ? dove : dove ? [dove] : [];
  const tutte = postiIA(), ids = new Set();
  for (const d of lista) {
    const s = String(d || "").trim(); if (!s) continue;
    if (/^tutt/i.test(s)) { tutte.forEach(c => ids.add(c.id)); continue; }
    const per = tutte.find(c => c.id === s) || tutte.find(c => PAROLE.norm(c.nome) === PAROLE.norm(s));
    if (per) { ids.add(per.id); continue; }
    try { for (const id of PAROLE.trovaLuoghi(s, ctxParole())) ids.add(id); } catch (e) {}
  }
  return [...ids];
}
function regolaDaIA(codice, nome) {
  const rs = regoleGov(), cod = String(codice || "").trim().toUpperCase();
  return rs.find(r => String(r.codice).toUpperCase() === cod) || rs.find(r => String(r.id).toUpperCase() === cod)
    || (nome ? rs.find(r => PAROLE.norm(r.nome) === PAROLE.norm(nome)) : null) || null;
}
const dataBuona = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || "")) ? d : L.oggiISO();
function azioneDaIA(a) {
  if (!a || !a.tipo) return null;
  if (a.tipo === "messaggio") { const t = String(a.testo || "").trim(); return t ? { tipo: "messaggio", giorno: dataBuona(a.giorno), testo: t.slice(0, 300) } : null; }
  if (a.tipo === "istruzione") {
    const passi = (Array.isArray(a.passi) ? a.passi : []).map(x => ({
      testo: String((x && (x.testo || x)) || "").trim().slice(0, 180),
      gesto: GESTI.gestoValido(String((x && x.gesto) || "")),
    })).filter(x => x.testo).slice(0, 8);
    if (!passi.length) return null;
    const zone = Object.keys(S.zone);
    let chi = String(a.chi || a.zona || "").trim();
    if (!zone.includes(chi) && chi !== "tutte") { const z = signore().find(x => PAROLE.norm(SIG(x.id)) === PAROLE.norm(chi)); chi = z ? z.id : "tutte"; }
    return { tipo: "istruzione", zona: chi, giorno: dataBuona(a.giorno), titolo: String(a.titolo || "Una cosa da fare").trim().slice(0, 90), passi };
  }
  const camere = camereDaIA(a.dove || a.camere);
  if (a.tipo === "aggiungi") {
    const r = regolaDaIA(a.codice, a.cosa || a.nome), cosa = String(a.cosa || a.nome || (r && r.nome) || "").trim();
    if (!cosa) return null;
    return { tipo: "aggiungi", regola: r, cosa, camere, minuti: Math.max(1, Math.min(120, Math.round(Number(a.minuti) || (r && r.minuti) || 10))) };
  }
  const r = regolaDaIA(a.codice, a.cosa || a.nome); if (!r) return null;
  if (a.tipo === "fatto") return { tipo: "fatto", regola: r, altre: [], camere, giorno: dataBuona(a.giorno) };
  if (a.tipo === "togli") return { tipo: "togli", regola: r, regole: [r], camere, perSempre: !!a.perSempre };
  return null;
}
// La risposta dell'IA, pronta per la chat (col "Sì, fallo" se propone qualcosa)
let argonAvvisato = false;
async function rispostaIA(testo, conv) {
  const c = confIA();
  const sis = sistemaIA(), storia = conv.slice(0, -1);
  let r, ripiego = false;
  try { r = await IA.chiedi({ conf: c, sistema: sis, storia, testo }); }
  catch (e) {
    // Argon e i modelli grossi non hanno chiamate gratuite: invece di lasciare
    // Michele senza risposta, rispondo lo stesso col modello svelto e glielo dico.
    const m = String((e && e.message) || "");
    if (!/gratuite|quota|429|carta/i.test(m) || c.qualita === "svelta") throw e;
    const veloce = { ...c, qualita: "svelta", modello: "" };
    const t = await IA.trovaModello(veloce);
    r = await IA.chiedi({ conf: { ...veloce, modello: t.modello }, sistema: sis, storia, testo });
    ripiego = true;
    if (!argonAvvisato) { argonAvvisato = true; toast("Argon non risponde senza carta sulla chiave: ti ho risposto col modello svelto."); }
  }
  if (!ripiego && r.modello && r.modello !== c.modello) IA.salvaConf({ modello: r.modello });
  IA.salvaConf({ errori: 0, ultimo: new Date().toISOString() });
  const base = { chi: "gov", ora: S.db.adesso(), ia: true };
  const dice = [r.risposta, r.consiglio && r.consiglio !== r.risposta ? "💡 " + r.consiglio : ""].filter(Boolean).join("\n\n");
  const a = azioneDaIA(r.azione);
  if (!a) return { ...base, testo: dice };
  if ((a.tipo === "fatto" || a.tipo === "aggiungi") && !a.camere.length)
    return { ...base, testo: `${dice}\n\n«${a.regola ? a.regola.nome : a.cosa}» dove?`, tasti: tastiDove(), azioneDove: a };
  const prop = a.tipo === "togli" ? testoTogli(a)
    : a.tipo === "messaggio" ? `Scrivo alle signore, per ${a.giorno === L.oggiISO() ? "oggi" : L.dataBreve(a.giorno)}: «${a.testo}». Confermo?`
    : a.tipo === "istruzione" ? `Lascio a ${a.zona === "tutte" ? "tutte le signore" : SIG(a.zona)}, per ${a.giorno === L.oggiISO() ? "oggi" : L.dataBreve(a.giorno)}, la spiegazione «${a.titolo}» in ${a.passi.length} ${a.passi.length === 1 ? "passo" : "passi"}:\n${a.passi.map((x, i) => `${i + 1}. ${x.testo}`).join("\n")}\nCon i disegnini che fanno vedere il gesto. Confermo?`
    : testoProposta(a);
  return { ...base, testo: `${dice}\n\n${prop}`, tasti: [{ k: "si", testo: "Sì, fallo" }, { k: "no", testo: "No, lascia" }], azione: a };
}

// --- il consiglio del giorno: lei guarda la casa e dice la sua, una volta al giorno
const CHIAVE_CONSIGLIO = "ricci_ia_consiglio";
function consiglioOggi() {
  try { const c = JSON.parse(localStorage.getItem(CHIAVE_CONSIGLIO) || "null"); return c && c.giorno === L.oggiISO() ? c : null; } catch (e) { return null; }
}
let consiglioInCorso = false;
async function chiediConsiglioDelGiorno() {
  if (consiglioInCorso || !iaAccesa() || consiglioOggi()) return;
  if (!S.caricati.pulizie || !S.caricati.soggiorni) return;
  consiglioInCorso = true;
  try {
    const r = await IA.chiedi({ conf: confIA(), sistema: sistemaIA(), storia: [],
      testo: `Fai il tuo giro di controllo delle sette cose, poi rispondi con questo JSON: {"pensiero":"...","saluto":"...","risposta":"...","consiglio":"...","azione":null}.
"saluto": una riga sola che apre la giornata. Comincia con ${saluto()} e il mio nome (${nomeMio()}). Se c'è qualcosa di VERAMENTE meritato nella fotografia (tutte le camere chiuse, un controllo andato bene, una settimana in ordine) dillo in mezza frase, con il fatto preciso. Se non c'è niente di meritato NON inventare complimenti: metti invece una spinta corta e pratica per oggi. Massimo 18 parole.
"risposta": in UNA frase corta com'è la situazione adesso, la cosa più importante, col numero.
"consiglio": la cosa da fare per prima.` });
    const c = { giorno: L.oggiISO(), saluto: String(r.saluto || "").slice(0, 160), testo: String(r.risposta || "").slice(0, 220), consiglio: String(r.consiglio || "").slice(0, 220), ora: new Date().toISOString() };
    if (c.testo) {
      try { localStorage.setItem(CHIAVE_CONSIGLIO, JSON.stringify(c)); } catch (e) {}
      disegna();
      inviaTelegram(`👩 ${nomeGov()}${c.saluto ? ` — ${c.saluto}` : ""}\n${c.testo}${c.consiglio ? `\n💡 ${c.consiglio}` : ""}`, "anna", { aMe: true });
    }
  } catch (e) { console.warn("consiglio", e); }
  consiglioInCorso = false;
}

// --- la cartolina delle impostazioni, a prova di nonna ---------------------
function cardIA() {
  if (!proprietario()) return "";
  const c = confIA(), f = IA.FORNITORI[c.fornitore] || IA.FORNITORI[IA.FORNITORE_BASE], q = c.qualita || "sveglia", vc = VOCE.leggiVoce();
  const su = IA.accesa(c);
  const stato = su ? `<span class="ia-stato on">Accesa</span>` : c.chiave ? `<span class="ia-stato off">Spenta</span>` : `<span class="ia-stato off">Non ancora pronta</span>`;
  const esito = provaIA ? (provaIA.ok
    ? `<div class="note ok" style="margin:8px 0 0">Funziona. Ha risposto: «${esc(provaIA.testo || "ci sono")}». Sta usando <b>${esc(provaIA.modello)}</b>.</div>`
    : `<div class="note warn" style="margin:8px 0 0">Non ha funzionato: ${esc(provaIA.errore)}</div>`) : "";
  const scelta = Object.entries(IA.FORNITORI).map(([k, v]) => `<button type="button" aria-pressed="${c.fornitore === k}" data-ia-fornitore="${k}">${esc(v.nome)}</button>`).join("");
  return `<section class="card ia-card"><div class="ia-testa"><h2 style="margin:0">La governante intelligente</h2>${stato}</div>
    <p class="muted small" style="margin:6px 0 10px">Senza chiave la governante capisce solo le parole del catalogo: funziona, ma è un elenco, non un cervello. Con una <b>chiave</b> dietro ci pensa un'intelligenza artificiale vera: legge i numeri della casa, si accorge delle cose da sola e ti dà consigli. Decide sempre tu: lei chiede «Confermo?» e non fa niente finché non tocchi <b>Sì</b>.</p>
    <div class="ia-passo"><b>0.</b> Come si chiama
      <div class="voce-scelte">${NOMI_GOV.map(n => `<button type="button" class="voce-chip" aria-pressed="${nomeGov() === n}" data-gov-nome="${esc(n)}">${esc(n)}</button>`).join("")}</div>
      <div class="ia-riga"><input type="text" id="iaNome" data-keep value="${esc(nomeGov())}" placeholder="il nome che vuoi" maxlength="18" autocomplete="off"><button type="button" class="btnsm" data-ia-nome>Salva</button></div>
      <span class="small muted">È lei che ti parla e che lascia le spiegazioni alle signore. Tocca un nome o scrivine uno tuo: lo usa dappertutto. Non mettere il nome di una delle signore, se no vi confondete.</span></div>
    <div class="ia-passo"><b>0b.</b> La sua faccia
      <div class="seg"><button type="button" aria-pressed="${!fotoGov() && stileGov() === "piatta"}" data-faccia="piatta">Piatta</button><button type="button" aria-pressed="${!fotoGov() && stileGov() === "contorno"}" data-faccia="contorno">Contornata</button><button type="button" aria-pressed="${stileGov() === "consuela"}" data-faccia="consuela">Consuela</button><button type="button" aria-pressed="${!!fotoGov() && stileGov() !== "consuela"}" data-faccia="foto" ${fotoGov() ? "" : "disabled"}>Foto</button></div>
      <div class="facce-griglia">${POSE.map((x, i) => { const c = facceGov()[x.k]; return `<div class="faccia-slot ${c ? "piena" : ""}">
        <label class="faccia-box">${c ? `<img src="${c}" alt="">` : `<span class="faccia-vuoto">${i + 1}</span>`}<input type="file" accept="image/*" data-posa="${x.k}" hidden></label>
        <b>${esc(x.nome)}</b><span class="small muted">${esc(x.aiuto)}</span>
        ${c ? `<button type="button" class="nonna-link" style="min-height:0;padding:2px 8px;margin-top:2px" data-posa-togli="${x.k}">togli</button>` : ""}</div>`; }).join("")}</div>
      <span class="small muted">Serve solo la prima. Se ci metti anche la <b>bocca socchiusa</b> e la <b>bocca aperta</b>, quando parla l'app le scambia a tempo con la voce e sembra che parli davvero — è lo stesso trucco di quell'app che mi hai fatto vedere: stesso personaggio, stessa posa, cambia solo la bocca. Con gli <b>occhi chiusi</b> sbatte anche le palpebre.</span>
      <details class="gov-dett" style="margin-top:8px"><summary class="small">Come me le faccio, queste immagini?</summary>
        <p class="muted small" style="margin:6px 0 0">Su <b>openart.ai</b> (o con le immagini di ChatGPT o Gemini): entra nel <b>nuovo spazio di lavoro</b>, <b>Crea immagine</b>, incolla il primo testo e genera. Quando la ragazza ti piace, <b>non generarne altre</b>: usa <b>Modifica immagine</b> (o "Chatta per modificare") sulla stessa, e incolla gli altri tre testi uno per volta. Se le generi da capo esce un'altra persona.</p>
        <div class="prompt-box"><code id="promptFaccia">${esc(PROMPT_FACCIA)}</code><button type="button" class="btnsm" data-copia-prompt="base">Copia</button></div>
        ${PROMPT_VARIANTI.map((t, i) => `<div class="prompt-box"><code>${esc(POSE[i + 1].nome)}: ${esc(t)}</code><button type="button" class="btnsm ghost" data-copia-prompt="${i}">Copia</button></div>`).join("")}
        <p class="muted small" style="margin:6px 0 0">Poi scarichi le immagini sul telefono e le metti nei quattro riquadri qui sopra.</p></details>
      <span class="small muted" style="margin-top:6px">Stanno solo su questo telefono, non le vedono le signore. Usa un personaggio inventato o una foto tua — non la foto di una persona vera senza il suo permesso.</span></div>
    <div class="ia-passo"><b>1.</b> Chi le presta il cervello<div class="seg ia-seg">${scelta}</div></div>
    <div class="ia-passo"><b>2.</b> Quanto deve essere sveglia
      <div class="seg"><button type="button" aria-pressed="${q === "svelta"}" data-ia-qualita="svelta">Svelta</button><button type="button" aria-pressed="${q === "sveglia"}" data-ia-qualita="sveglia">Pensa di più</button><button type="button" aria-pressed="${q === "argon"}" data-ia-qualita="argon">Argon</button></div>
      <span class="small muted">${esc(IA.COSTI[c.fornitore]?.[q] || "pochi centesimi al mese")}</span></div>
    <div class="ia-passo"><b>3.</b> Prendi la chiave su <b>${esc(f.dove)}</b>: entra con la tua mail e falla creare. ${esc(f.passi)}
      <button type="button" class="ia-vai" data-ia-apri="${esc(f.dove)}">Apri ${esc(f.dove.split("/")[0])} ↗</button>
      <span class="small muted">${esc(f.chiave)}</span></div>
    <div class="ia-passo"><b>4.</b> Incollala qui
      <div class="ia-riga"><input type="password" id="iaChiave" data-keep placeholder="incolla qui la chiave" value="${esc(c.chiave || "")}" autocomplete="off" spellcheck="false"><button type="button" class="btnsm ghost" data-ia-incolla>Incolla</button><button type="button" class="btnsm" data-ia-prova ${iaInCorso ? "disabled" : ""}>${iaInCorso ? "Provo…" : "Prova"}</button></div>
      ${c.modello ? `<span class="small muted">Sta usando ${esc(c.modello)} · <button type="button" class="nonna-link" style="min-height:0;padding:2px 8px" data-ia-rimodello>cercane un altro</button></span>` : ""}${esito}</div>
    <div class="ia-passo"><b>5.</b> Accendila<div class="seg"><button type="button" aria-pressed="${su}" data-ia-accendi="1" ${c.chiave ? "" : "disabled"}>Accesa</button><button type="button" aria-pressed="${!su}" data-ia-accendi="0">Spenta</button></div></div>
    <div class="ia-passo"><b>6.</b> La voce: te la legge ad alta voce
      <div class="seg"><button type="button" aria-pressed="${vc.attiva && vc.motore === "google"}" data-voce-motore="google">Voce vera</button><button type="button" aria-pressed="${vc.attiva && vc.motore === "telefono"}" data-voce-motore="telefono">Voce del telefono</button><button type="button" aria-pressed="${!vc.attiva}" data-voce-motore="">Muta</button></div>
      ${vc.attiva && vc.motore === "google" ? `<div class="voce-scelte">${VOCE.VOCI.map(v => `<button type="button" class="voce-chip" aria-pressed="${vc.voce === v.id}" data-voce-nome="${esc(v.id)}" title="${esc(v.come)}">${esc(v.nome)}</button>`).join("")}</div>` : ""}
      ${vc.attiva ? `<div class="voce-toni"><span class="small muted">Come deve parlare:</span><div class="voce-scelte">${VOCE.TONI.map(t => `<button type="button" class="voce-chip" aria-pressed="${VOCE.tonoDi(vc).id === t.id}" data-voce-tono="${esc(t.id)}">${esc(t.nome)}</button>`).join("")}</div></div>` : ""}
      ${vc.attiva ? `<div class="ia-riga"><button type="button" class="btnsm" data-voce-prova ${voceInProva ? "disabled" : ""}>${voceInProva ? "Provo…" : "Prova la voce"}</button>${provaVoce ? `<span class="small ${provaVoce.ok ? "" : "muted"}">${esc(provaVoce.testo)}</span>` : ""}</div>` : ""}
      ${vc.attiva ? `<div class="voce-toni"><span class="small muted">Se la bocca non va a tempo con la voce, spostala:</span><div class="voce-scelte">${[[200, "molto prima"], [100, "un po' prima"], [0, "così va bene"], [-100, "un po' dopo"], [-200, "molto dopo"]].map(([ms, nome]) => `<button type="button" class="voce-chip" aria-pressed="${(Number(vc.anticipo) || 0) === ms}" data-voce-anticipo="${ms}">${nome}</button>`).join("")}</div></div>` : ""}
      <span class="small muted">${vc.attiva && vc.motore === "google"
        ? "La voce vera di Google: sembra una persona. Costa meno di un centesimo al minuto parlato — con il tuo uso, circa 1,50 € al mese in tutto. Serve internet e la stessa chiave di sopra. Se non parte, parla il telefono."
        : vc.attiva ? "La voce che c'è già nel telefono: gratis, funziona anche senza internet, ma si sente che è un robot." : "Adesso la governante scrive e basta."}</span></div>
    <details class="gov-dett" style="margin-top:10px"><summary class="small">Le cose da sapere, in chiaro</summary>
      <p class="muted small" style="margin:6px 0 0"><b>I nomi degli ospiti non escono mai.</b> Le mando camere, lavori, giorni, soldi e ritardi: mai un nome di chi dorme qui. C'è una prova automatica che lo controlla a ogni versione.</p>
      <p class="muted small" style="margin:6px 0 0"><b>La chiave resta su questo telefono.</b> Non va nel database: le signore non la vedono e non la possono spendere. Se cambi telefono la devi rimettere.</p>
      <p class="muted small" style="margin:6px 0 0"><b>Se cade, non si rompe niente.</b> Senza internet o con la chiave scaduta torna da sola alle parole del catalogo. Lo vedi perché sparisce il bollino IA.</p>
      <p class="muted small" style="margin:6px 0 0"><b>Gratis o a pagamento.</b> In Italia, anche col piano gratuito, Google dice di trattare i dati come quelli a pagamento (non li usa per imparare). Però le loro condizioni dicono che un'app messa a disposizione di persone in Europa deve stare sul piano a pagamento. Per questo conviene mettere la carta: si prepaga 5 € e durano mesi.</p>
      <p class="muted small" style="margin:6px 0 0"><b>Due bufale da evitare.</b> Il credito da 300 $ di Google Cloud da marzo 2026 non vale più per Gemini. E i siti che regalano "chiavi Gemini gratis" usano la chiave di qualcun altro, leggono tutto quello che scrivi e smettono di funzionare dopo pochi giorni: non usarli.</p></details>
    ${c.chiave ? `<button class="nonna-link" style="margin:8px 0 0" data-ia-cancella>Cancella la chiave da questo telefono</button>` : ""}</section>`;
}
function collegaIA() {
  document.querySelectorAll("[data-faccia]").forEach(b => b.onclick = () => {
    const k = b.dataset.faccia;
    if (k === "foto") return document.querySelector("[data-posa='base']")?.click();
    if (fotoGov()) togliFacce();
    salvaGov({ stile: k }).then(() => toast(k === "piatta" ? "Stile piatto, come le app delle lingue" : k === "contorno" ? "Stile col contorno" : "Eccomi, sono Consuela"));
    disegna();
  });
  document.querySelectorAll("[data-faccia-togli]").forEach(b => b.onclick = () => { togliFacce(); disegna(); toast("Tolte: torna il disegno"); });
  document.querySelectorAll("[data-posa]").forEach(i => i.onchange = async () => {
    const f = i.files && i.files[0], k = i.dataset.posa; i.value = "";
    if (!f) return;
    if (!/^image\//.test(f.type)) return toast("Scegli un'immagine");
    try {
      const d = await rimpicciolisci(f);
      if (!salvaFaccia(k, d)) return toast("Il telefono non ha spazio: togli un'immagine");
      disegna(); toast(k === "base" ? "Fatto: adesso ha questa faccia" : "Messa");
    } catch (e) { toast(String(e.message || "Non riesco a usare questa immagine")); }
  });
  document.querySelectorAll("[data-posa-togli]").forEach(b => b.onclick = () => { salvaFaccia(b.dataset.posaTogli, ""); disegna(); toast("Tolta"); });
  document.querySelectorAll("[data-copia-prompt]").forEach(b => b.onclick = async () => {
    const k = b.dataset.copiaPrompt;
    const t = k === "base" ? PROMPT_FACCIA : PROMPT_VARIANTI[Number(k)];
    try { await navigator.clipboard.writeText(t); toast("Copiato: incollalo nel sito che disegna"); }
    catch (e) { toast("Tieni premuto sul testo e copia a mano"); }
  });
  document.querySelectorAll("[data-gov-nome]").forEach(b => b.onclick = () => {
    const n = b.dataset.govNome;
    const inp = document.getElementById("iaNome"); if (inp) inp.value = n; // la casella "si ricorda" quello che c'era: la aggiorno a mano
    salvaGov({ nome: n }).then(() => { try { localStorage.removeItem(CHIAVE_CONSIGLIO); } catch (e) {} const i2 = document.getElementById("iaNome"); if (i2) i2.value = n; toast(`Da adesso si chiama ${n}`); });
  });
  document.querySelectorAll("[data-ia-nome]").forEach(b => b.onclick = () => {
    const n = (document.getElementById("iaNome")?.value || "").trim().slice(0, 18);
    salvaGov({ nome: n }).then(() => { try { localStorage.removeItem(CHIAVE_CONSIGLIO); } catch (e) {} toast(n ? `Da adesso si chiama ${n}` : "Nome tolto: torna «Anna»"); });
  });
  document.querySelectorAll("[data-ia-fornitore]").forEach(b => b.onclick = () => { IA.salvaConf({ fornitore: b.dataset.iaFornitore, modello: "" }); provaIA = null; disegna(); });
  document.querySelectorAll("[data-ia-qualita]").forEach(b => b.onclick = () => { IA.salvaConf({ qualita: b.dataset.iaQualita, modello: "" }); provaIA = null; disegna(); toast("Cerco il modello giusto: tocca «Prova»"); });
  document.querySelectorAll("[data-ia-apri]").forEach(b => b.onclick = () => { window.open("https://" + b.dataset.iaApri, "_blank", "noopener"); });
  document.querySelectorAll("[data-ia-incolla]").forEach(b => b.onclick = async () => {
    try { const t = (await navigator.clipboard.readText() || "").trim(); if (!t) return toast("Non ho trovato niente da incollare");
      const inp = document.getElementById("iaChiave"); if (inp) { inp.value = t; IA.salvaConf({ chiave: t }); toast("Incollata: adesso tocca «Prova»"); } }
    catch (e) { toast("Il telefono non mi fa incollare: tienila premuta nella casella e scegli Incolla"); }
  });
  document.querySelectorAll("[data-ia-accendi]").forEach(b => b.onclick = () => {
    const su = b.dataset.iaAccendi === "1";
    if (su && !(document.getElementById("iaChiave")?.value || "").trim()) return toast("Prima incolla la chiave");
    IA.salvaConf({ attiva: su, chiave: (document.getElementById("iaChiave")?.value || "").trim() });
    disegna(); toast(su ? "Governante intelligente accesa" : "Spenta: torna alle parole del catalogo");
  });
  document.querySelectorAll("[data-ia-cancella]").forEach(b => b.onclick = () => { IA.cancellaConf(); provaIA = null; try { localStorage.removeItem(CHIAVE_CONSIGLIO); } catch (e) {} disegna(); toast("Chiave cancellata da questo telefono"); });
  document.querySelectorAll("[data-ia-rimodello]").forEach(b => b.onclick = () => { IA.salvaConf({ modello: "" }); provaIA = null; disegna(); toast("Cerco di nuovo il modello: tocca «Prova»"); });
  document.querySelectorAll("[data-ia-prova]").forEach(b => b.onclick = async () => {
    const chiave = (document.getElementById("iaChiave")?.value || "").trim();
    if (!chiave) return toast("Incolla prima la chiave");
    IA.salvaConf({ chiave }); iaInCorso = true; provaIA = null; disegna();
    const r = await IA.provaChiave({ ...confIA(), chiave });
    iaInCorso = false; provaIA = r;
    if (r.ok) { IA.salvaConf({ modello: r.modello, attiva: true }); try { localStorage.removeItem(CHIAVE_CONSIGLIO); } catch (e) {} }
    disegna(); toast(r.ok ? "Funziona: governante intelligente accesa" : "Non ha funzionato");
  });
  document.querySelectorAll("[data-ia-veloce]").forEach(b => b.onclick = () => { VOCE.sbloccaAudio(); const v = VELOCI_IA[Number(b.dataset.iaVeloce)]; if (v) { b.disabled = true; parlaGov(v.chiedo, v.testo); } });
  // --- la voce ---
  document.querySelectorAll("[data-cons-voce]").forEach(b => b.onclick = (e) => {
    e.stopPropagation(); VOCE.sbloccaAudio();
    if (VOCE.staParlando()) return zittisciVoce();
    const c = consiglioOggi();
    parlaConVoce([c && c.saluto ? c.saluto : `${saluto()}, ${nomeMio()}!`, c && c.testo ? c.testo : umoreGov().testo, c && c.consiglio ? c.consiglio : spintaDelGiorno()].join(" "));
  });
  document.querySelectorAll("[data-mic]").forEach(b => b.onclick = () => microfono());
  document.querySelectorAll("[data-istr-voce]").forEach(b => b.onclick = () => {
    VOCE.sbloccaAudio();
    const t = document.querySelector(`[data-istr-testo="${b.dataset.istrVoce}"]`)?.textContent || "";
    if (!t) return;
    if (VOCE.staParlando()) { zittisciVoce(); return; }
    // le signore non hanno la chiave: per loro parla il telefono, gratis
    voceInCorso = true; disegna();
    VOCE.parla(t, { conf: { ...VOCE.leggiVoce(), motore: proprietario() ? VOCE.leggiVoce().motore : "telefono", attiva: true }, chiave: proprietario() ? confIA().chiave : "",
      onInizio: (buf, letto, durata) => labialeAvvia(buf, letto, durata),
      onBocca: (f, tt) => { applicaBocca(f); labialeTick(f, tt); }, onFine: () => { voceInCorso = false; applicaBocca(0); labialeFerma(); disegna(); } });
  });
  document.querySelectorAll("[data-voce-motore]").forEach(b => b.onclick = () => {
    VOCE.sbloccaAudio(); zittisciVoce();
    const m = b.dataset.voceMotore;
    VOCE.salvaVoce(m ? { attiva: true, motore: m } : { attiva: false });
    provaVoce = null; disegna();
    toast(m === "google" ? "Voce vera: tocca «Prova la voce»" : m ? "Voce del telefono accesa" : "Voce spenta");
  });
  document.querySelectorAll("[data-voce-nome]").forEach(b => b.onclick = () => { VOCE.sbloccaAudio(); zittisciVoce(); VOCE.salvaVoce({ voce: b.dataset.voceNome }); provaVoce = null; disegna(); });
  document.querySelectorAll("[data-voce-tono]").forEach(b => b.onclick = () => { VOCE.sbloccaAudio(); zittisciVoce(); VOCE.salvaVoce({ tono: b.dataset.voceTono }); provaVoce = null; disegna(); });
  document.querySelectorAll("[data-voce-anticipo]").forEach(b => b.onclick = () => { VOCE.salvaVoce({ anticipo: Number(b.dataset.voceAnticipo) || 0 }); disegna(); toast("Fatto: alla prossima frase la bocca si sposta di " + (Math.abs(Number(b.dataset.voceAnticipo) || 0) / 1000).toString().replace(".", ",") + " secondi"); });
  document.querySelectorAll("[data-casa-stile]").forEach(b => b.onclick = () => { cambiaStileCasa(b.dataset.casaStile); toast("Guarda la prima pagina: tocca «oggi» in alto"); });
  document.querySelectorAll("[data-azz]").forEach(b => b.onchange = () => { azzScelte[b.dataset.azz] = b.checked; azzChiesto = false; disegna(); });
  document.querySelectorAll("[data-azzera-chiedi]").forEach(b => b.onclick = () => { azzChiesto = true; disegna(); });
  document.querySelectorAll("[data-azzera-no]").forEach(b => b.onclick = () => { azzChiesto = false; disegna(); });
  document.querySelectorAll("[data-azzera-si]").forEach(b => b.onclick = () => azzeraDavvero());
  document.querySelectorAll("[data-voce-tasto]").forEach(b => b.onclick = () => {
    VOCE.sbloccaAudio();
    const v = VOCE.leggiVoce();
    if (v.attiva) { zittisciVoce(); VOCE.salvaVoce({ attiva: false }); disegna(); return toast("Voce spenta"); }
    VOCE.salvaVoce({ attiva: true, motore: IA.accesa(confIA()) ? "google" : "telefono" }); disegna(); toast("Voce accesa");
  });
  document.querySelectorAll("[data-voce-prova]").forEach(b => b.onclick = async () => {
    VOCE.sbloccaAudio(); zittisciVoce();
    let v = VOCE.leggiVoce();
    if (v.motore === "google") {
      const chiave = confIA().chiave;
      if (!chiave) { provaVoce = { ok: false, testo: "Prima metti la chiave qui sopra." }; return disegna(); }
      if (!v.modello && !cercaModelloVoce) {
        cercaModelloVoce = VOCE.trovaModelloVoce(chiave).then(m => VOCE.salvaVoce({ modello: m })).catch(e => console.warn("modello voce", e)).finally(() => { cercaModelloVoce = null; });
      }
    }
    provaVoce = { ok: true, testo: v.motore === "google" ? (v.canale === "tts" ? "Sta usando " + (v.modello || "la voce TTS") : "Voce Live di Gemini (" + VOCE.LIVE_MODELLI[0] + ")") : "Voce del telefono" }; disegna();
    parlaConVoce(`Ciao Michele... sono ${nomeGov()}. Oggi ci sono ${pulizieDelGiorno(L.oggiISO()).length} lavori in programma. Ci penso io: tu stai tranquillo.`);
  });
}

function collegaChat() {
  collegaIA(); // i tasti veloci della governante intelligente stanno dentro il foglio della chat
  document.querySelectorAll("[data-chat-risposta]").forEach(b => b.onclick = () => { const parti = b.dataset.chatRisposta.split("|"); const k = parti.pop(); rispondiChat(parti.join("|"), k); });
  document.querySelectorAll("[data-chat-parole]").forEach(b => b.onclick = () => { const box = document.getElementById("cp_" + b.dataset.chatParole); if (!box) return; box.hidden = !box.hidden; if (!box.hidden) box.querySelector("input")?.focus(); });
  document.querySelectorAll("[data-chat-invia]").forEach(b => b.onclick = () => { const id = b.dataset.chatInvia; const inp = document.getElementById("ci_" + id); const t = (inp?.value || "").trim(); if (!t) { inp?.focus(); return; } rispondiChat(id, "parole", t); });
  document.querySelectorAll(".chat-scrivi input").forEach(i => i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); i.closest(".chat-scrivi").querySelector("[data-chat-invia]")?.click(); } });
  document.querySelectorAll("[data-chat-wa]").forEach(b => b.onclick = () => { const r = S.chat.risposte[b.dataset.chatWa]; if (r && r.whatsapp) apriWhatsApp(r.whatsapp); });
  document.querySelectorAll("[data-conv]").forEach(b => b.onclick = () => { const [i, k] = b.dataset.conv.split("|"); b.disabled = true; rispondiParole(Number(i), k); });
  const fp = document.getElementById("formParla");
  if (fp) { const ta = document.getElementById("parlaGov");
    const cresci = () => { ta.style.height = "auto"; ta.style.height = Math.min(120, ta.scrollHeight) + "px"; };
    ta.oninput = cresci; cresci();
    ta.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); fp.requestSubmit(); } };
    fp.onsubmit = (e) => { e.preventDefault(); const t = ta.value.trim(); if (!t) { ta.focus(); return; } ta.value = ""; ta.style.height = "auto"; parlaGov(t); };
  }
  const corpo = document.querySelector(".chat-corpo"); if (corpo && !corpo.dataset.scrollato) { corpo.dataset.scrollato = "1"; requestAnimationFrame(() => { corpo.scrollTop = corpo.scrollHeight; }); }
}
function salvaModo(k, patch) { const modi = { ...((S.gov && S.gov.modi) || {}) }; const cur = modi[k] || {}; modi[k] = { ...cur, ...patch, budget: { ...(cur.budget || {}), ...(patch.budget || {}) }, stelle: { ...(cur.stelle || {}), ...(patch.stelle || {}) } }; return salvaGov({ modi }); }
async function salvaSpesa(nuovo) { S.spesa = nuovo; disegna(); try { await S.db.salva("impostazioni", "spesa", nuovo, false); } catch (e) { erroreScrittura(e); } }
async function salvaChat(nuovo) {
  S.chat = nuovo; disegna(); if (S.foglio && S.foglio.tipo === "chat") disegnaFoglio();
  try { await S.db.salva("impostazioni", "chat", nuovo, false); } catch (e) { erroreScrittura(e); }
}
// Il messaggio alle signore di un giorno, scritto dalla governante (senza chiudere il foglio)
async function scriviMessaggio(giorno, testo) {
  const nuovo = {}; const limite = L.aggiungiGiorni(L.oggiISO(), -60);
  for (const [k, v] of Object.entries(S.messaggi || {})) if (k >= limite && v && typeof v === "object") nuovo[k] = v;
  nuovo[giorno] = { testo, da: "la governante", ora: S.db.adesso() };
  S.messaggi = nuovo;
  await S.db.salva("impostazioni", "messaggi", nuovo, false);
  inviaTelegram(testoMessaggioGiorno(giorno, testo), "messaggio");
}
// 0.41: la spiegazione pratica che la governante lascia a una signora (sta dentro impostazioni/messaggi, che le signore leggono)
async function salvaIstruzione(a) {
  const nuovo = {}; const limite = L.aggiungiGiorni(L.oggiISO(), -60);
  for (const [k, v] of Object.entries(S.messaggi || {})) if (k >= limite && v && typeof v === "object") nuovo[k] = v;
  const g = nuovo[a.giorno] || {};
  const lista = [...((g.istruzioni) || []), { id: "i" + Date.now().toString(36), zona: a.zona, titolo: a.titolo, passi: a.passi, da: nomeGov(), ora: S.db.adesso() }].slice(-6);
  nuovo[a.giorno] = { ...g, istruzioni: lista };
  S.messaggi = nuovo;
  await S.db.salva("impostazioni", "messaggi", nuovo, false);
  inviaTelegram(`📋 ${a.titolo}\n` + a.passi.map((x, i) => `${i + 1}. ${x.testo}`).join("\n"), "istruzione");
}
// i dettagli di una pulizia scritti dalla governante (senza chiudere il foglio della chat)
async function salvaDettagliSilenzioso(p, testo) {
  const patch = { dettagli: testo, dettagliDa: "la governante", dettagliOra: S.db.adesso() };
  Object.assign(S.pulizie[p.id], patch); await S.db.aggiorna("pulizie", p.id, patch); if (testo) inviaTelegram(`📝 ${testoDettagliCamera({ ...p, ...patch })}`, "dettagli");
}
async function notaDellaGovernante(giorno, camera, testo, privata) {
  const id = `${giorno}_gov_${Date.now().toString(36)}`;
  await S.db.salva("note", id, { data: giorno, camera: camera || null, testo, privata: !!privata, da: "la governante" });
}
// Le azioni: cosa fa davvero ogni risposta. Tornano il testo "Fatto: …" (e, se serve, il testo per WhatsApp)
const AZIONI_CHAT = {
  // 12. settimana prossima come sempre?
  async settimana(d, k, parole) {
    if (k === "si") return { fatto: "va bene: settimana come sempre, le camere le prendo dal prospetto." };
    if (k === "parole") { await notaDellaGovernante(L.oggiISO(), null, `Settimana prossima: ${parole}`, true); return { fatto: `segnato nelle tue note: «${parole}». Se cambiano i giorni o le ore, mettili in Paghe → Orario di base.` }; }
    S.vista = "paghe"; setTimeout(() => { const el = [...document.querySelectorAll("h2")].find(h => /Orario di base/.test(h.textContent)); if (el) el.scrollIntoView({ block: "start" }); }, 300);
    return { fatto: "ti ho aperto Paghe → Orario di base: cambia i giorni, i lavori o i minuti, e la settimana si rifà da sola." };
  },
  // 13. le stelle della settimana
  async stelle(d, k, parole) {
    if (k === "ok") return { fatto: `va bene: le stelle di ${nomeZonaBreve(d.dati.zona)} restano queste. Le trova nelle sue camere, giorno per giorno.` };
    if (k === "parole") { await notaDellaGovernante(L.oggiISO(), null, `Stelle della settimana: ${parole}`, true); return { fatto: `segnato: «${parole}». Per toglierne una tocca "Togli" nella card delle stelle della settimana (Governante → Consigli).` }; }
    S.vista = "governante"; S.govTab = "consigli"; setTimeout(() => { const el = document.querySelector(".stelle-sett"); if (el) el.scrollIntoView({ block: "start" }); }, 400);
    return { fatto: "ti ho aperto le stelle della settimana: togli quelle che non vuoi con un tocco, le altre restano." };
  },
  // 14. guardi tu una camera di Selena?
  async controllami(d, k) {
    if (k === "no") return { fatto: "va bene, oggi niente controllo." };
    const p = S.pulizie[k]; if (!p) return { fatto: "quella pulizia non c'è più." };
    setTimeout(() => apriFoglio({ tipo: "controllo", id: k, modo: "proprietario" }), 200);
    return { fatto: `ti ho aperto il controllo di ${camera(p.camera).nome}: rispondi SÌ o NO alle righe, il voto lo faccio io.` };
  },
  // 15. terzo Male del mese
  async terzomale(d, k, parole) {
    const dd = d.dati, nz = nomeZonaBreve(dd.zona);
    if (k === "lascia") return { fatto: "va bene, lascio stare.", scade: L.aggiungiGiorni(L.oggiISO(), 30) };
    if (k === "parlo") { await notaDellaGovernante(L.oggiISO(), null, `Parlare con ${nz}: ${dd.n} controlli "Male" questo mese`, true); return { fatto: `segnato nelle tue note di oggi: parlare con la ${nz}.` }; }
    const domani = L.aggiungiGiorni(L.oggiISO(), 1);
    const testo = k === "parole" ? parole : `${nz}: questo mese i controlli hanno trovato ${dd.n} camere "Male". Da adesso le camere vanno rifatte bene: WC, doccia, letto e cestini sono le cose che si vedono per prime.`;
    await scriviMessaggio(domani, testo);
    return { fatto: `richiamo scritto nel messaggio di ${L.dataBreve(domani)}: «${testo}».`, whatsapp: testoMessaggioGiorno(domani, testo) };
  },
  // 16. i controlli di una signora non reggono: li fa Michele per un mese
  async smentite(d, k, parole) {
    const dd = d.dati, nz = nomeZonaBreve(dd.zona);
    if (k === "lascia") return { fatto: "va bene, lascio stare.", scade: L.aggiungiGiorni(L.oggiISO(), 30) };
    if (k === "parole") { await notaDellaGovernante(L.oggiISO(), null, `Controlli di ${nz}: ${parole}`, true); return { fatto: `segnato: «${parole}».` }; }
    const fino = L.aggiungiGiorni(L.oggiISO(), 30); const l = JSON.parse(JSON.stringify(S.listino)); l.sospesi = { ...(l.sospesi || {}), [dd.zona]: fino }; await salvaListino(l);
    return { fatto: `i controlli di ${nz} sono fermi fino a ${L.dataBreve(fino)}: in quei giorni te li chiedo io nel report delle 13.` };
  },
  async nome(d, k, parole) {
    const dd = d.dati; const chiave = dd.k;
    if (k === "parole") { S.clienti = { ...S.clienti, [chiave]: { ...(S.clienti[chiave] || {}), nome: dd.nome, nota: parole, aggiornato: L.oggiISO() } }; await S.db.salva("impostazioni", "clienti", { [chiave]: S.clienti[chiave] }, true); return { fatto: `ho segnato le tue parole su ${dd.nome}. Il tipo di ospite resta ${CH.NOMI_MODI_CHAT[dd.modoAttuale] || "Tecnici"}: per cambiarlo tocca un pulsante nella scheda del soggiorno.` }; }
    S.clienti = { ...S.clienti, [chiave]: { ...(S.clienti[chiave] || {}), modo: k, nome: dd.nome, aggiornato: L.oggiISO() } };
    await S.db.salva("impostazioni", "clienti", { [chiave]: S.clienti[chiave] }, true); pianifica();
    return { fatto: `${dd.nome} → ${CH.NOMI_MODI_CHAT[k]}, per tutti i soggiorni con questo nome (adesso in ${dd.camere.join(", ")}). Le liste delle signore cambiano da sole.` };
  },
  async pioggia(d, k, parole) {
    const { fino, domani } = d.dati;
    if (k === "no") { const meteo = { ...((S.gov && S.gov.meteo) || {}) }; delete meteo.pioggia; delete meteo.vento; await salvaGov({ meteo }); return { fatto: "tolto: niente messaggio e niente stelle del meteo." }; }
    if (k === "stelle") return { fatto: `niente messaggio. Le stelle del meteo (esterni, davanzali, scarichi, balconi) entrano da sole nei passaggi fino a ${L.dataBreve(fino)}.` };
    const testo = k === "parole" ? parole : CH.TESTO_PIOGGIA;
    await scriviMessaggio(domani, testo);
    return { fatto: `messaggio di ${L.dataBreve(domani)} alle signore: «${testo}». Lo vedono in cima alla loro schermata. Stelle del meteo accese fino a ${L.dataBreve(fino)}.`, whatsapp: testoMessaggioGiorno(domani, testo) };
  },
  async freddo(d, k, parole) { return AZIONI_CHAT.stagione(d, k, parole); },
  async caldo(d, k, parole) { return AZIONI_CHAT.stagione(d, k, parole); },
  async stagione(d, k, parole) {
    const { giorno, testo } = d.dati;
    if (k === "dopo") return { fatto: "va bene, te lo richiedo tra una settimana.", scade: L.aggiungiGiorni(L.oggiISO(), 7) };
    const t = k === "parole" ? parole : testo;
    await scriviMessaggio(giorno, t);
    return { fatto: `messaggio di ${L.dataBreve(giorno)} alle signore: «${t}».`, whatsapp: testoMessaggioGiorno(giorno, t) };
  },
  async libera(d, k, parole) {
    const dd = d.dati; const cam = camera(dd.camera);
    if (k === "no") return { fatto: `va bene, ${dd.nome} resta com'è.` };
    if (k === "parole") { await notaDellaGovernante(dd.giorno, dd.camera, parole, false); return { fatto: `ho scritto alle signore per ${dd.nome}, ${L.dataBreve(dd.giorno)}: «${parole}».` }; }
    if (k === "si") {
      const r = G.CATALOGO.find(x => x.codice === "C57") || {};
      const c = { regola: r.id || "C57", codice: "C57", luogo: dd.camera, luogoNome: cam.nome, zona: dd.zona, data: dd.giorno, cosa: "Pulizia a fondo completa", come: r.come || "Tutto il catalogo della camera in una volta, a camera vuota.", minuti: 180, icona: r.icona || "stella", perche: ["camera libera", dd.giorni + " giorni liberi"], euro: dd.prezzo, grande: true, libera: true };
      await accettaProposte([c]);
      return { fatto: `pulizia a fondo di ${dd.nome} messa ${L.dataGiornoLungo(dd.giorno)} per la ${nomeZonaBreve(dd.zona)} · 3 ore · ${eur(dd.prezzo)}. Sta nelle sue camere di quel giorno.` };
    }
    // solo le stelle in ritardo: le cose a camera libera che la governante ha in coda per questa camera, nelle sue giornate libere
    const lun = L.lunediDi(L.oggiISO());
    const cand = [...proposteGov(lun).proposte, ...proposteGov(L.aggiungiGiorni(lun, 7)).proposte].filter(c => c.luogo === dd.camera && !c.grande && !S.pulizie[idPuliziaGov(c)]);
    const miei = cand.filter(c => c.data >= dd.da && c.data < dd.fino);
    const scelte = miei.length ? miei : cand.slice(0, 4).map(c => ({ ...c, data: dd.giorno }));
    if (!scelte.length) return { fatto: `per ${dd.nome} non c'è niente in ritardo da fare a camera libera: resta tutto in regola.` };
    await accettaProposte(scelte);
    return { fatto: `${scelte.length} ${scelte.length === 1 ? "cosa messa" : "cose messe"} per ${dd.nome} ${L.dataBreve(scelte[0].data)}: ${scelte.map(c => c.cosa).join(", ")}.` };
  },
  async paga(d, k, parole) {
    const dd = d.dati;
    if (k === "guardo") { S.vista = "paghe"; chiudiFoglio(); disegna(); window.scrollTo(0, 0); return { fatto: "ti ho aperto le Paghe: lì segni pagata ogni signora quando hai finito." }; }
    if (k === "parole") { await notaDellaGovernante(L.oggiISO(), null, `Paghe ${L.etichettaSettimana(dd.chiusa)}: ${parole}`, true); return { fatto: `segnato nelle note: «${parole}». Le paghe restano da confermare in Paghe.` }; }
    const fatte = [];
    for (const r of dd.righe) { const id = `${r.zona}_${dd.chiusa}`; if (S.pagamenti[id]) continue; await S.db.salva("pagamenti", id, { zona: r.zona, settimana: dd.chiusa, importo: r.totale, pulizie: r.pulizie, quando: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short", timeZone: "Europe/Rome" }), istante: S.db.adesso(), da: S.utente.nome || S.utente.email || "" }, false); fatte.push(`${r.nome} ${eur(r.totale)}`); }
    return { fatto: fatte.length ? `segnate pagate: ${fatte.join(", ")} (settimana ${L.etichettaSettimana(dd.chiusa)}). Le trovi in Paghe.` : "erano già tutte segnate pagate." };
  },
  // 5a. camera non controllata da 2 settimane
  async controllo(d, k) {
    const dd = d.dati;
    if (k === "lascia") return { fatto: `va bene, ${dd.nome} la lascio stare per due settimane.`, scade: L.aggiungiGiorni(L.oggiISO(), 14) };
    if (k === "io") { chiudiFoglio(); apriFoglio({ tipo: "controllo", id: dd.pulizia, modo: "proprietario" }); return { fatto: `ti ho aperto il controllo di ${dd.nome} (l'ultima pulizia): dai il voto con la lista dei punti.` }; }
    const dc = { ...((S.impControlli && S.impControlli.daControllare) || {}) }; dc[dd.camera] = { chiesto: L.oggiISO(), entro: dd.sabato, da: S.utente.nome || "Michele" };
    await S.db.salva("impostazioni", "controlli", { ...(S.impControlli || {}), daControllare: dc }, true);
    return { fatto: `${dd.nome} è in cima alla lista della controllatrice di turno, con scritto "chiesto da Michele", entro ${L.dataBreve(dd.sabato)}.` };
  },
  // 5b. una stella che la signora non riesce a fare da 2 volte
  async nonriesco(d, k, parole) {
    const dd = d.dati; const oggi = L.oggiISO();
    if (k === "riprova") return { fatto: "va bene: la stella torna nella lista la prossima volta.", scade: L.aggiungiGiorni(oggi, 14) };
    const r = regoleGov().find(x => x.id === dd.regola) || G.CATALOGO.find(x => x.id === dd.regola) || null;
    if (k === "spegni") { const regole = { ...((S.gov && S.gov.regole) || {}) }; const codice = (r && r.codice) || dd.regola; regole[codice] = { ...(regole[codice] || {}), attiva: false }; await salvaGov({ regole }); return { fatto: `regola «${dd.cosa}» spenta per tutte le camere (in Regole la riaccendi con Sì).` }; }
    const daQuando = oraRoma() >= CH.ORA_FINE_SIGNORE ? L.aggiungiGiorni(oggi, 1) : oggi; // dopo le 14 mai "oggi"
    const prossima = Object.values(S.pulizie).filter(p => p.camera === dd.camera && p.data >= daQuando && p.origine !== "governante" && p.tipo !== "extra" && p.stato !== "fatta").sort((a, b) => a.data < b.data ? -1 : 1)[0];
    const data = prossima ? prossima.data : L.aggiungiGiorni(oggi, 1);
    if (k === "parole") { if (prossima) await salvaDettagliSilenzioso(prossima, parole); else await notaDellaGovernante(data, dd.camera, parole, false); return { fatto: `scritto per la signora su ${dd.nome}, ${L.dataBreve(data)}: «${parole}».` }; }
    const importo = Math.max(1, Number((r && r.euro) || 2)); const id = `${data}_${dd.camera}_x${Date.now().toString(36)}`;
    const doc = { id, data, camera: dd.camera, zona: dd.zona || camera(dd.camera).zona, tipo: "extra", titolo: dd.cosa, passi: r && r.come ? [r.come] : [], ospite: L.ospiteIl(soggiorniLista(), dd.camera, data)?.nome || "", importo, stato: "da_fare", origine: "mano", creato: S.db.adesso(), da: "la governante" };
    await S.db.salva("pulizie", id, doc); S.pulizie[id] = doc;
    return { fatto: `«${dd.cosa}» è un lavoro a parte per ${dd.nome}, ${L.dataBreve(data)}, pagato ${eur(importo)}: la signora lo vede nelle sue camere di quel giorno.` };
  },
  // 5c. signora sotto il 90% di pulizie chiuse col Fatto
  async affidabilita(d, k, parole) {
    const dd = d.dati; const nz = nomeZonaBreve(dd.zona);
    if (k === "lascia") return { fatto: "va bene, lascio stare per due settimane.", scade: L.aggiungiGiorni(L.oggiISO(), 14) };
    if (k === "io") { await notaDellaGovernante(L.oggiISO(), null, `Parlare con ${nz}: ha chiuso col Fatto ${dd.fatte} pulizie su ${dd.previste} nelle ultime 4 settimane`, true); return { fatto: `segnato nelle tue note di oggi: parlare con la ${nz}.` }; }
    const testo = k === "parole" ? parole : "Ricordatevi di premere FATTO, TUTTO quando finite una camera: così la paga è giusta e Michele vede che è pulita.";
    await scriviMessaggio(dd.domani, testo);
    return { fatto: `messaggio di ${L.dataBreve(dd.domani)} alle signore: «${testo}».`, whatsapp: testoMessaggioGiorno(dd.domani, testo) };
  },
  // 6. manca un prodotto → lista della spesa
  async prodotto(d, k, parole) {
    const dd = d.dati;
    if (k === "salta") return { fatto: `va bene: questa settimana «${dd.prodotto}» si salta; te lo richiedo tra 7 giorni se manca ancora.`, scade: L.aggiungiGiorni(L.oggiISO(), 7) };
    const chi = k === "papa" ? "papà" : k === "parole" ? parole : (S.utente.nome || "Michele");
    const voci = { ...((S.spesa && S.spesa.voci) || {}) }; const id = `${L.oggiISO()}_${L.normNome(dd.prodotto).replace(/ /g, "-")}_${dd.zona}`;
    voci[id] = { prodotto: dd.prodotto, zona: dd.zona, chi, quando: L.oggiISO(), fatto: false, per: dd.per || [] };
    await salvaSpesa({ voci });
    return { fatto: `${dd.noto === false ? dd.prodotto : `«${dd.prodotto}»`} è nella lista della spesa (lo porta ${chi}) per la ${nomeZonaBreve(dd.zona)}. La lista sta in Governante → Consigli; quando arriva tocca "Comprato".` };
  },
  // 7. budget delle stelle quasi finito
  async budget(d, k) {
    const dd = d.dati;
    if (k === "vai") return { fatto: "va bene, lascio andare fino a fine mese." };
    if (k === "alzo") { const nuovo = Math.ceil((dd.speso + 50) / 10) * 10; await salvaGov({ soglie: { ...soglieGov(), budgetStelle: nuovo } }); return { fatto: `budget del mese alzato a ${eur(nuovo)} (in Regole → Due soglie piccole lo cambi quando vuoi).` }; }
    await salvaGov({ freno: { fino: dd.fino, da: L.oggiISO() } });
    return { fatto: `freno sul nascosto fino a ${L.dataBreve(dd.fino)}: le cose di priorità 3 (il nascosto) non entrano come stelle fino a fine mese, poi riparte tutto. Lo togli in Regole → I tre modi.` };
  },
  // 8. lavoro di manutenzione fermo
  async manutenzione(d, k, parole) {
    const dd = d.dati;
    if (k === "aspetta") return { fatto: "va bene, aspetto ancora una settimana.", scade: L.aggiungiGiorni(L.oggiISO(), 7) };
    if (k === "fatto") { await aggiornaManutenzione(dd.id, { stato: "fatto", fatto: S.db.adesso(), fattoDa: S.utente.nome || "" }); return { fatto: `«${dd.titolo}» segnato come sistemato.` }; }
    if (k === "parole") { await aggiornaManutenzione(dd.id, { nota: parole }); return { fatto: `nota scritta su «${dd.titolo}»: «${parole}».` }; }
    await aggiornaManutenzione(dd.id, { stato: "chiamato", chiamato: L.oggiISO() });
    return { fatto: `«${dd.titolo}»: segnato "tecnico chiamato" ${L.dataBreve(L.oggiISO())}. Se tra 7 giorni è ancora fermo te lo richiedo.` };
  },
  // 9. una regola in ritardo in molte camere
  async regola(d, k) {
    const dd = d.dati;
    if (k === "vabene") return { fatto: "va bene così: te lo richiedo tra un mese se resta indietro.", scade: L.aggiungiGiorni(L.oggiISO(), 30) };
    if (k === "spegni") { const regole = { ...((S.gov && S.gov.regole) || {}) }; regole[dd.codice] = { ...(regole[dd.codice] || {}), attiva: false }; await salvaGov({ regole }); return { fatto: `regola «${dd.nome}» spenta: sparisce dal Tabellone e dalle liste. In Regole la riaccendi con Sì.` }; }
    const m = G.modiDi(S.gov).tecnici; const lib = Math.min(90, m.budget.libera + 15), tot = Math.min(60, m.budget.totale + 10);
    await salvaModo("tecnici", { budget: { libera: lib, totale: tot } });
    return { fatto: `Tecnici: ${lib}′ di stelle nella totale a camera vuota (prima ${m.budget.libera}′) e ${tot}′ nella totale (prima ${m.budget.totale}′): il venerdì entrano più cose. In Regole → I tre modi lo rivedi.` };
  },
  // 10. prima di una partenza Booking
  async partenza(d, k, parole) {
    const dd = d.dati;
    if (k === "no") return { fatto: "va bene, niente da aggiungere." };
    const p = S.pulizie[`${dd.data}_${dd.camera}`];
    if (p) await salvaDettagliSilenzioso(p, [p.dettagli, parole].filter(Boolean).join(" · ")); else await notaDellaGovernante(dd.data, dd.camera, parole, false);
    return { fatto: `scritto per la signora su ${dd.nome}, ${L.dataBreve(dd.data)}: «${parole}». Lo vede in "Oggi Michele dice".` };
  },
  async impara(d, k) {
    const t = d.dati;
    return { fatto: k === "si" ? `d'ora in poi «${CH.TITOLI[t.tipoDomanda] || t.tipoDomanda}» lo faccio da sola: ${t.testoRisposta}. Lo vedi in Regole → "Cose che faccio da sola", e lo spegni con un tocco.` : "va bene, te lo chiedo sempre." };
  },
};
let chatInCorso = false;
async function rispondiChat(id, k, parole = "") {
  if (chatInCorso || !puoModificare()) return; chatInCorso = true;
  try {
    const c = statoChatApp(); const d = c.aperte.find(x => x.id === id) || (c.gruppi || []).flatMap(g => g.righe).find(x => x.id === id) || c.inAttesa.find(x => x.id === id) || c.nonAncora.find(x => x.id === id);
    if (!d) return;
    const az = AZIONI_CHAT[d.tipo]; let esito = { fatto: "" };
    try { esito = await az(d, k, parole) || esito; } catch (e) { console.error("chat azione", e); erroreScrittura(e); return; }
    const nuovo = CH.registraRisposta(S.chat, d, k, { il: L.oggiISO(), ora: S.db.adesso(), fatto: esito.fatto, parole, scade: esito.scade });
    if (esito.whatsapp) nuovo.risposte[d.id].whatsapp = esito.whatsapp;
    if (esito.scade) nuovo.risposte[d.id].scade = esito.scade;
    await salvaChat(nuovo);
  } finally { chatInCorso = false; }
}
// Le cose che la governante fa da sola (dopo "la prossima volta lo faccio da sola? Sì"): le esegue e scrive "Fatto da sola"
let daSolaInCorso = false;
async function governanteDaSola() {
  if (daSolaInCorso || !proprietario() || S.utente?.finta || !S.caricati.pulizie || !S.caricati.soggiorni) return;
  // le richieste "falla controllare" già soddisfatte (c'è un controllo dopo la richiesta) si tolgono da sole
  try { const dc = (S.impControlli && S.impControlli.daControllare) || {}; const resta = {}; let cambiato = false; for (const [cam, q] of Object.entries(dc)) { const fatta = Object.values(S.controlli).some(k => k.camera === cam && (k.data || "") >= (q.chiesto || "")); if (fatta || (q.chiesto && q.chiesto < L.aggiungiGiorni(L.oggiISO(), -21))) cambiato = true; else resta[cam] = q; } if (cambiato) await S.db.salva("impostazioni", "controlli", { ...S.impControlli, daControllare: resta }, true); } catch (e) { console.warn("daControllare", e); }
  const c = statoChatApp(); if (!c.daSole.length) return;
  daSolaInCorso = true;
  try {
    let nuovo = S.chat;
    for (const d of c.daSole) { let esito = { fatto: "" }; try { esito = await AZIONI_CHAT[d.tipo](d, d.auto, "") || esito; } catch (e) { console.error("da sola", e); continue; } nuovo = CH.registraRisposta(nuovo, d, d.auto, { il: L.oggiISO(), ora: S.db.adesso(), fatto: esito.fatto, auto: true }); if (esito.whatsapp) nuovo.risposte[d.id].whatsapp = esito.whatsapp; }
    await salvaChat(nuovo);
  } finally { daSolaInCorso = false; }
}

// --- la card in "Oggi" ---
function plateGovernante() {
  const r = proposteGov(G.settimanaGovernante());
  const n = r.proposte.length, rit = r.inRitardo.length;
  const buchi = mappaGov().buchi;
  const sotto = buchi ? `${buchi} ${buchi === 1 ? "superficie scoperta nella mappa" : "superfici scoperte nella mappa"}${rit ? ` · ${rit} in ritardo` : ""}` : rit ? `${rit} in ritardo${n ? ` · ${n} consigli` : ""}` : n ? `${n} consigli per ${G.settimanaGovernante() === L.lunediDi(L.oggiISO()) ? "questa settimana" : "la settimana prossima"}` : "tutto in ordine";
  return `<button class="piastra gov-plate" data-vista="governante">${DONNINA("governante", "piccola")}<span class="man-testo"><b>${esc(nomeGov())}</b><span>${esc(sotto)}</span></span>${ledGovernante() ? `<span class="led" role="img" aria-label="novità"></span>` : ""}<span class="man-freccia">›</span></button>`;
}

// --- la sezione ---
function vistaGovernante() {
  const tab = S.govTab;
  const testa = `<section class="card flat"><button class="nonna-link indietro" data-vista="oggi">${ICONA("indietro")}Oggi</button></section>
  <section class="pro-testa gov-testa">${testataGov()}<p class="muted small" style="margin:0">Guarda il prospetto, il calendario e il registro, e decide cosa va fatto a fondo oltre alle pulizie normali.</p>
    <div class="seg gov-seg" style="margin-top:12px;display:flex"><button aria-pressed="${tab === "consigli"}" data-gov-tab="consigli">Consigli</button><button aria-pressed="${tab === "calendario"}" data-gov-tab="calendario">Calendario</button><button aria-pressed="${tab === "tabellone"}" data-gov-tab="tabellone">Tabellone</button><button aria-pressed="${tab === "regole"}" data-gov-tab="regole">Regole</button><button aria-pressed="${tab === "mappa"}" data-gov-tab="mappa">Mappa</button></div></section>`;
  if (tab === "calendario") return testa + vistaCalendarioPulito();
  if (tab === "tabellone") return testa + vistaTabelloneCopertura();
  if (tab === "regole") return testa + vistaRegoleGov();
  if (tab === "mappa") return testa + vistaMappaSuperfici();
  return testa + vistaConsigliGov();
}
function rigaProposta(c, conTasti = true) {
  return `<div class="gov-riga" data-gov-riga="${esc(c.id)}">
    <div class="gov-ic ${c.grande ? "grande" : ""}">${ICONA(c.icona || "stella")}</div>
    <div class="gov-corpo"><div class="gov-cosa">${esc(c.cosa)}${c.grande ? ` <span class="el-pill out">mezza giornata</span>` : c.libera ? ` <span class="el-pill now">a camera libera</span>` : ""}</div>
      <div class="gov-dove"><b>${esc(c.luogoNome)}</b> · ${esc(nomeZonaBreve(c.zona))} · <b>${esc(L.dataGiornoLungo(c.data))}</b> · ${c.minuti >= 60 ? `${Math.round(c.minuti / 60 * 10) / 10} ore`.replace(".", ",") : `${c.minuti} min`}${c.euro ? ` · ${eur(c.euro)}` : ""}</div>
      <div class="gov-perche">${esc((c.perche || []).join(" · "))}</div>
      ${conTasti && puoModificare() ? `<div class="gov-tasti"><button class="btnsm" data-gov-ok="${esc(c.id)}">Va bene</button><button class="btnsm ghost" data-gov-dopo="${esc(c.id)}">Più avanti</button><button class="btnsm ghost" data-gov-no="${esc(c.id)}">No</button></div>` : ""}</div></div>`;
}
function vistaConsigliGov() {
  const lun = S.govSett, r = proposteGov(lun), sg = soglieGov();
  try { if (lun === G.settimanaGovernante()) localStorage.setItem("ricci_gov_visto", lun); } catch (e) {}
  const nav = `<section class="card flat"><div class="navmese"><button data-gov-sett="-1" aria-label="Settimana prima">‹</button><b>${esc(etichettaSettimanaLun(lun))}</b><button data-gov-sett="1" aria-label="Settimana dopo">›</button></div></section>`;
  const ritardo = r.inRitardo.length ? `<section class="card gov-ritardo"><h2 style="margin:0 0 6px;color:var(--warn)"><span class="led" role="img" aria-label="in ritardo"></span>In ritardo · ${r.inRitardo.length}</h2><p class="muted small" style="margin:0 0 8px">Dovevano essere fatti e non risultano fatti. Tocca per aprire.</p><div class="rows">${r.inRitardo.map(p => `<button class="row" data-pul="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ⭐ ${esc(p.titolo)}<br><span class="muted">${esc(nomeZonaBreve(p.zona))} · era per ${esc(L.dataGiornoLungo(p.data))}</span></span>${BADGE(p)}</button>`).join("")}</div></section>` : "";
  const auto = `<section class="card"><div class="head" style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><h2 style="margin:0">Automatico</h2><p class="muted small" style="margin:2px 0 0">${sg.automatico ? "Acceso: i lavori piccoli entrano da soli nelle settimane delle signore; ti chiedo solo per quelli grossi (più di un'ora o a camera vuota)." : "Spento: ti propongo tutto e decidi tu con \"Va bene\". Accendilo quando ti fidi."}</p></div><span class="seg"><button aria-pressed="${!!sg.automatico}" data-gov-auto="1" ${puoModificare() ? "" : "disabled"}>Sì</button><button aria-pressed="${!sg.automatico}" data-gov-auto="0" ${puoModificare() ? "" : "disabled"}>No</button></span></div></section>`;
  const programmati = Object.values(S.pulizie).filter(p => p.origine === "governante" && p.data >= lun && p.data <= L.aggiungiGiorni(lun, 6)).sort((a, b) => a.data < b.data ? -1 : 1);
  const lista = r.proposte.length ? `<section class="card gov-card"><div class="head" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 style="margin:0">Ti consiglio · ${r.proposte.length}</h2>${puoModificare() && r.proposte.length > 1 ? `<button class="btnsm" data-gov-tutto>Va bene a tutto</button>` : ""}</div><p class="muted small" style="margin:4px 0 10px">Qui solo le cose a camera libera (dove il calendario vero non ha un passaggio a camera vuota) e i lavori di stagione: le stelle piccole stanno già dentro i passaggi delle signore (sotto). Massimo 8 a settimana, mai di domenica. Fa eccezione la pulizia a fondo completa: mezza giornata, al massimo ${sg.camereSettimana} a settimana.${r.scartate ? ` Altre ${r.scartate} aspettano il loro turno.` : ""}</p>${r.proposte.map(c => rigaProposta(c)).join("")}</section>`
    : `<section class="card gov-card"><h2 style="margin:0">Niente a camera libera da consigliare</h2><p class="muted" style="margin:6px 0 0">${programmati.length ? "Le rifiniture a camera libera sono già nelle settimane delle signore (qui sotto)." : "Le rifiniture di questa settimana sono dentro le pulizie normali (qui sotto)."}</p></section>`;
  const rifSett = cardRifinitureSettimana(lun);
  const modiSett = cardModiSettimana(lun);
  const prog = programmati.length ? `<section class="card"><h2 style="margin:0 0 8px">Già nelle settimane delle signore · ${programmati.length}</h2><div class="rows">${programmati.map(p => `<button class="row" data-pul="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ⭐ ${esc(p.titolo)}<br><span class="muted">${esc(nomeZonaBreve(p.zona))} · ${esc(L.dataGiornoLungo(p.data))}${p.minuti ? ` · ${p.minuti} min` : ""}</span></span>${BADGE(p)}</button>`).join("")}</div></section>` : "";
  return nav + cardStelleSettimana() + modiSett + cardSpesa() + ritardo + lista + rifSett + prog + auto;
}
// Le stelle della signora delle stelle in questa settimana: la lista che la chat propone il lunedì, con "Togli" per ognuna
function cardStelleSettimana() {
  let ss = null; try { ss = stelleSettimanaApp(); } catch (e) { return ""; }
  if (!ss) return "";
  const perGiorno = {}; for (const r of ss.righe) (perGiorno[r.giorno] = perGiorno[r.giorno] || []).push(r);
  const giorni = Object.keys(perGiorno).sort();
  const righe = giorni.map(g => `<div class="floorlabel" style="margin-top:8px">${esc(L.dataGiornoLungo(g))}</div><div class="rows">${perGiorno[g].map(r => `<div class="row"><span><b>${esc(r.luogoNome)}</b> · ${esc(r.nome)}<br><span class="muted small">${r.minuti} min · ${eur(r.euro)}</span></span>${puoModificare() ? `<button class="btnsm ghost" data-stella-togli="${esc(r.k)}">Togli</button>` : ""}</div>`).join("")}</div>`).join("");
  const fatte = ss.fatte.length ? `<p class="muted small" style="margin:8px 0 0">Già fatte questa settimana: ${ss.fatte.map(r => `${esc(r.luogoNome)} ${esc(r.nome.toLowerCase())}`).join(", ")}.</p>` : "";
  const escl = ss.escluse.length ? `<p class="muted small" style="margin:8px 0 0">Tolte da te questa settimana: ${ss.escluse.length}. ${puoModificare() ? `<button class="btnsm ghost" data-stella-ripristina>Rimettile</button>` : ""}</p>` : "";
  return `<section class="card stelle-sett"><h2 style="margin:0 0 4px">Le stelle di ${esc(ss.nome)} questa settimana</h2><p class="muted small" style="margin:0 0 6px">${eur(ss.euro)} su ${eur(ss.obiettivo)} di obiettivo (l'obiettivo si cambia in Paghe → Orario di base). Le scelgo io tra le superfici più in ritardo, nei suoi giorni; le trova dentro le sue camere e nel riquadro “Altre camere”. Oltre l'obiettivo non propongo niente.</p>${righe || `<p class="muted" style="margin:0">Niente in programma da oggi a sabato.</p>`}${fatte}${escl}</section>`;
}
// La lista della spesa (dalla chat: "Manca un prodotto")
function cardSpesa() {
  const voci = Object.entries((S.spesa && S.spesa.voci) || {}).filter(([, v]) => !v.fatto).sort((a, b) => a[1].quando < b[1].quando ? -1 : 1);
  if (!voci.length) return "";
  return `<section class="card"><h2 style="margin:0 0 4px">Lista della spesa · ${voci.length}</h2><p class="muted small" style="margin:0 0 8px">Dalla chat: i prodotti che mancano alle signore. Tocca "Comprato" quando arriva.</p><div class="rows">${voci.map(([id, v]) => `<div class="row"><span><b>${esc(v.prodotto)}</b> · ${esc(nomeZonaBreve(v.zona))}<br><span class="muted small">lo porta ${esc(v.chi || "")} · chiesto ${esc(L.dataBreve(v.quando))}${v.per && v.per.length ? ` · per: ${esc(v.per.slice(0, 2).join(", "))}` : ""}</span></span>${puoModificare() ? `<button class="btnsm" data-spesa-fatto="${esc(id)}">Comprato</button>` : ""}</div>`).join("")}</div></section>`;
}
// La card dei tre modi (specifiche §1): il conto della settimana dal prospetto vero e, sotto, quanto costa un modo per camera a settimana
function cardModiSettimana(lun) {
  let cs = null, c3 = null; try { cs = G.contoSettimana(ctxGov(lun), lun); c3 = (tabellone() && tabellone().conto) || null; } catch (e) { console.warn("contoSettimana", e); }
  if (!cs) return "";
  const n = { tecnici: cs.tecnici, operai: cs.operai, booking: cs.booking };
  const box = k => `<div class="modo-box modo-${k}"><strong>${n[k]}</strong><b>${n[k] === 1 ? "camera" : "camere"} ${esc(G.MODI[k].nome)}</b><span>${k === "booking" && cs.partenzeBooking ? `${cs.partenzeBooking} ${cs.partenzeBooking === 1 ? "partenza" : "partenze"}` : ""}${c3 && c3.modi[k] && c3.modi[k].camereSettimana ? `${k === "booking" && cs.partenzeBooking ? " · " : ""}${eur(c3.modi[k].euroCameraSettimana)} a camera a settimana` : ""}</span></div>`;
  const quando = lun === L.lunediDi(L.oggiISO()) ? "Questa settimana" : `La settimana del ${L.dataBreve(lun)}`;
  return `<section class="card"><h2 style="margin:0 0 4px">${quando}</h2><p class="muted small" style="margin:0 0 8px">Dal prospetto: ${cs.pulizie} ${cs.pulizie === 1 ? "pulizia" : "pulizie"} · stelle: ${cs.stelle} per <b>${eur(cs.euro)}</b>.</p><div class="modi-box">${box("tecnici")}${box("operai")}${box("booking")}</div>${c3 ? `<p class="muted small" style="margin:8px 0 0">Un mese d'inverno <b>${eur(c3.inverno.euroMese)}</b> · un mese d'estate <b>${eur(c3.estate.euroMese)}</b> · l'anno <b>${eur(c3.anno)}</b> (il dettaglio è nel Tabellone).</p>` : ""}</section>`;
}
// Le rifiniture che la governante ha già messo dentro le pulizie normali della settimana, signora per signora
function cardRifinitureSettimana(lun) {
  const giorni = []; for (let i = 0; i < 7; i++) giorni.push(L.aggiungiGiorni(lun, i));
  const righe = zoneOrdinate().map(z => {
    let n = 0, min = 0, pulizie = 0; const perGiorno = [];
    for (const g of giorni) { const m = G.rifinitureDelGiorno(z.id, g, ctxGov()); const rf = Object.values(m).flat().filter(r => !r.sempre); const k = Object.keys(m).length; if (rf.length) perGiorno.push(`${L.GG[L.giornoSettimana(g)]} ${rf.reduce((s, r) => s + r.minuti, 0)}′`); n += rf.length; min += rf.reduce((s, r) => s + r.minuti, 0); pulizie += k; }
    return `<button class="row" data-signora="${z.id}"><span><b>${esc(nomeZonaBreve(z.id))}</b><br><span class="muted small">${n ? `${n} rifiniture in ${pulizie} pulizie · ${perGiorno.join(" · ")}` : "nessuna pulizia in programma"}</span></span><span class="s">${min ? `${min} min` : "—"}</span></button>`;
  }).join("");
  return `<section class="card"><h2 style="margin:0 0 4px">Rifiniture dentro le pulizie</h2><p class="muted small" style="margin:0 0 8px">A ogni passaggio la governante mette le stelle che ci stanno nel budget del modo dell'ospite (Tecnici: ripasso 15′, totale a camera vuota 45′, fino a 2/3 stelle; Operai: una sola stella di igiene nella totale del giovedì; Booking: 30′ alla partenza, prima il visibile), partendo dalla cosa più scaduta e a parità dall'igiene; le zone comuni vanno alla prima camera del giorno. Tocca una signora per vederle giorno per giorno.</p><div class="rows">${righe}</div></section>`;
}
function vistaCalendarioPulito() {
  const cal = G.calendarioPulito(ctxGov()), oggi = L.oggiISO();
  const peggio = cal[0];
  const testa = `<section class="card"><h2 style="margin:0">Calendario del pulito</h2><p class="muted small" style="margin:4px 0 0">Per ogni posto, quando è stata fatta l'ultima volta ogni cosa a fondo. <span class="pall verde"></span> fresco · <span class="pall giallo"></span> quasi scaduto · <span class="pall rosso"></span> scaduto o mai fatto.</p>
    ${peggio ? `<div class="note warn" style="margin:10px 0 0">La più indietro: <b>${esc(peggio.nome)}</b> · ${esc(peggio.peggio?.nome || "")} (${esc(peggio.peggio?.testo || "")}) · ${peggio.rossi} rifiniture scadute</div>` : ""}</section>`;
  const righe = cal.map(c => `<button class="row cal-riga" data-gov-luogo="${esc(c.luogo)}"><span><b>${esc(c.nome)}</b> <span class="muted">· ${esc(nomeZonaBreve(c.zona))}</span><br><span class="muted small">più indietro: ${esc(c.peggio?.nome || "")} (${esc(c.peggio?.testo || "")})${c.mai ? ` · ${c.mai} mai registrate` : ""}</span><br><span class="cal-palle">${c.voci.map(v => `<i class="pall ${v.colore}" title="${esc(v.cosa)}"></i>`).join("")}</span></span><span class="s ${c.rossi ? "warn" : c.gialli ? "wip" : "done"}">${c.rossi ? `${c.rossi} rosse` : c.gialli ? `${c.gialli} gialle` : "ok"}</span></button>`).join("");
  return testa + `<section class="card"><div class="rows">${righe}</div></section>`;
}
function foglioLuogoPulito(f) {
  const cal = G.calendarioPulito(ctxGov()).find(c => c.luogo === f.luogo); if (!cal) return `<h3>Posto</h3>`;
  return `<h3>${esc(cal.nome)}</h3><div class="muted">${esc(nomeZonaBreve(cal.zona))} · ${cal.rossi} scadute, ${cal.gialli} quasi</div>
    <div class="rows" style="margin-top:10px">${cal.voci.map(v => `<div class="row"><span><span class="pall ${v.colore}"></span> <b>${esc(v.cosa)}</b><br><span class="muted small">${esc(G.etichettaOgni(v.ogni))} · ultima volta: <b>${esc(v.testo)}</b>${v.da ? ` (${esc(v.da)})` : ""}</span></span></div>`).join("")}</div>
    ${puoModificare() ? `<p class="muted small" style="margin:10px 0 0">Per segnare a mano una cosa come fatta oggi (es. l'hai fatta tu), tocca qui sotto.</p><div class="scelte">${cal.voci.filter(v => v.colore !== "verde").slice(0, 8).map(v => `<button type="button" data-gov-fatto="${esc(v.regola)}|${esc(cal.luogo)}|${esc(cal.zona)}">✓ ${esc(v.cosa)}</button>`).join("")}</div>` : ""}`;
}
const GRUPPI_GOV = G.GRUPPI;

// ============================================================================
//  TABELLONE DI COPERTURA (prova 2) + PROVA DEI 90 GIORNI (prova 3)
// ============================================================================
let memoTab = { chiave: "", valore: null };
function tabellone() {
  const chiave = JSON.stringify([S.gov?.regole, S.gov?.soglie, S.gov?.personali, S.gov?.balconi, S.gov?.strada, S.gov?.frigo, S.gov?.inizio, S.gov?.modi, S.gov?.freno, S.gov?.meteo, S.gov?.prezziStelle, S.regole, S.clienti, S.camere.length, Object.keys(S.registro).length, Object.values(S.registro).map(r => r.ultima).join(","), L.oggiISO(), Object.keys(S.pulizie).length, Object.values(S.pulizie).filter(p => p.origine === "governante").length, soggiorniLista().length]);
  if (memoTab.chiave !== chiave) { let v = null; try { v = G.tabellone(ctxGov(L.lunediDi(L.oggiISO()))); } catch (e) { console.warn("tabellone", e); } memoTab = { chiave, valore: v }; }
  return memoTab.valore;
}
const COLORE_PEGGIO = g => g.rosse ? "rosso" : g.gialle ? "giallo" : g.grigie ? "grigio" : g.verdi ? "verde" : "fuori";
const SIGLA_GRUPPO = { camera: "Cam", bagno: "Bag", cucina: "Cuc", balcone: "Bal", stagioni: "Stag", comuni: "Com", lavanderia: "Lav", P: "Tue" };
function vistaTabelloneCopertura() {
  const t = tabellone(); const f = S.tab, mod = puoModificare();
  if (!t) return `<section class="card"><h2 style="margin:0">Tabellone</h2><p class="muted">Un attimo…</p></section>`;
  const sg = soglieGov(), c3 = t.conto || null, pz = G.prezziStelle(S.gov);
  const nModi = { tecnici: 0, operai: 0, booking: 0 }; for (const m of Object.values(t.modi || {})) if (nModi[m] != null) nModi[m]++;
  const modiTesto = G.NOMI_MODI.filter(k => nModi[k]).map(k => `${nModi[k]} ${esc(G.MODI[k].nome)}`).join(", ");
  const g = t.giro || null;
  const testa = `<section class="card"><div class="buchi ${t.buchi ? "rossi" : "zero"}"><div class="buchi-due"><b>Copertura: ${t.copertura}%</b><b>Buchi: ${t.buchi}</b></div>${g ? `<div class="buchi-due giro"><b>Giro completo: ${g.percento}%</b><b>${g.prova ? `a fine prova: ${g.prova.percento}%` : ""}</b></div><span><strong>Giro completo</strong> = celle fatte almeno una volta negli ultimi ${g.giorni} giorni (${g.fatte} su ${g.totale}, mai fatte da ${g.giorni} giorni: ${g.mai}); "a fine prova" = come sarebbe tra ${t.settimane} settimane ripetendo il prospetto di adesso con tutti i consigli accettati (${g.prova ? `${g.prova.fatte} su ${g.prova.totale}` : "—"}). Copertura = le celle in regola col loro ritmo scritto, quella severa.</span>` : ""}<span>${t.regime === "estate" ? "Estate: calcolato sulle partenze (un cambio ogni 3 notti, modo Booking)" : "Inverno: calcolato sui giorni fissi del calendario vero"} · camere oggi: ${modiTesto || "—"} · ${t.celleContate} celle (posti × rifiniture dei blocchi Rotazione e Camera libera, col modo che ogni camera ha oggi)${t.fuoriLivello ? ` · ${t.fuoriLivello} solo nella fondo completa, non contate` : ""} · ${t.buchi ? "le celle rosse non hanno nessuno che ci arrivi nelle prossime " + t.settimane + " settimane" : "ogni cosa è fatta o in programma"}</span></div>
    <p class="muted small" style="margin:10px 0 0"><span class="pall verde"></span> fatta, in regola · <span class="pall giallo"></span> quasi scaduta, o scaduta ma in programma · <span class="pall grigio"></span> mai fatta, in programma o più avanti (ritmi lunghi) · <span class="pall rosso"></span> buco: scaduta o mai fatta, e nessuno ci arriva · <span class="pall fuori"></span> in questo modo non è una stella: si fa solo nella pulizia a fondo completa. Il tabellone ripete i passaggi del calendario vero per ${t.settimane} settimane col modo che ogni camera ha oggi dal prospetto (Tecnici, Operai o Booking). Le righe della lista della signora non sono celle: sono il lavoro normale. (Le "superfici scoperte" della Mappa sono un'altra cosa.)</p></section>`;
  const conto = c3 ? `<section class="card"><h2 style="margin:0 0 4px">Il conto</h2><p class="muted small" style="margin:0">Quanto costano le stelle con il listino di adesso (fino a 5 min ${eur(pz.fino5)} · fino a 10 ${eur(pz.fino10)} · oltre ${eur(pz.oltre10)}, si cambia in Paghe → Listino): quello che le signore riescono a fare nei loro passaggi, col tetto di 3 stelle in una totale e 2 in un ripasso, e quanto costerebbe tenere tutto in regola.</p>
    <div class="conto-stagioni">${cardConto("Un mese d'inverno", c3.inverno.euroMese, `${c3.inverno.stelleSettimana} stelle a settimana`, c3.inverno.euroMesePieno)}${cardConto("Un mese d'estate", c3.estate.euroMese, `${c3.estate.stelleSettimana} stelle a settimana`, c3.estate.euroMesePieno)}${cardConto("L'anno", c3.anno, "9 mesi d'inverno + 3 d'estate", c3.annoPieno)}</div>
    <p class="muted small" style="margin:10px 0 0">Un modo, per camera, a settimana:</p>
    <div class="conto-modi">${G.NOMI_MODI.map(k => { const m = c3.modi[k]; return `<div class="modo-${k}"><b>${esc(m.nome)}</b><strong>${eur(m.euroCameraSettimana)}</strong><span>${m.camereSettimana ? `${String(m.stelleCameraSettimana).replace(".", ",")} ${m.stelleCameraSettimana === 1 ? "stella" : "stelle"} a settimana per camera` : "nessuna camera in questo modo nel prospetto"}</span></div>`; }).join("")}</div>
    <p class="muted small" style="margin:8px 0 0">Inverno = i passaggi del calendario vero coi modi del prospetto, 9 mesi. Estate = modo Booking, 3 mesi: stimato un cambio ogni 3 notti per camera (quando entra il prospetto estivo vero, il conto usa quello). Mai una media dell'anno.</p>
    <p class="muted small" style="margin:8px 0 0">Le leve: i ritmi dei tre modi (in Regole, con + e −), spegnere le regole che non ti servono, o alzare il budget dei passaggi nel foglio "Calendario vero".</p>
    ${mod ? `<div class="scelte" style="margin-top:8px"><button type="button" data-gov-tab="regole">Cambia i modi</button></div>` : ""}</section>` : `<section class="card"><h2 style="margin:0 0 4px">Il conto</h2><p class="muted small" style="margin:0">Questa settimana non ci sono pulizie in programma: il tabellone non sa su cosa contare. Appena c'è il prospetto, qui compaiono i numeri.</p></section>`;
  const prova = t.prova ? `<section class="card"><div class="head" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 style="margin:0">Prova la governante per 90 giorni</h2><button class="btnsm ${f.prova ? "ghost" : ""}" data-gov-prova90>${f.prova ? "Chiudi" : "Prova"}</button></div>${f.prova ? `<p class="muted small" style="margin:4px 0 8px">Ripetendo i passaggi del calendario vero e il prospetto di adesso per ${t.settimane} settimane, coi modi del prospetto di adesso, con tutti i consigli accettati:</p><ol class="prova90">${t.prova.righe.map(r => `<li>${esc(r)}</li>`).join("")}${g && g.prova ? `<li>Giro completo a fine prova: <b>${g.prova.percento}%</b> delle celle fatte almeno una volta (${g.prova.fatte} su ${g.prova.totale}; oggi ${g.percento}%).</li>` : ""}</ol>` : `<p class="muted small" style="margin:4px 0 0">Cinque righe: quante stelle, mai sopra il budget del passaggio, mai di domenica, cosa entra a camera libera, a quanto arriva il catalogo e cosa resta indietro.</p>`}</section>` : "";
  const zone = zoneOrdinate();
  const filtri = `<section class="card flat"><div class="seg tab-seg" style="display:flex"><button aria-pressed="${f.vista === "posti"}" data-tab-vista="posti">Per posto</button><button aria-pressed="${f.vista === "regole"}" data-tab-vista="regole">Per regola</button><button aria-pressed="${f.vista === "buchi"}" data-tab-vista="buchi">I buchi</button></div>
    <div class="scelte tab-zone" style="margin-top:8px"><button type="button" aria-pressed="${!f.zona}" data-tab-zona="">Tutte</button>${zone.map(z => `<button type="button" aria-pressed="${f.zona === z.id}" data-tab-zona="${z.id}">${esc(nomeZonaBreve(z.id))}</button>`).join("")}<button type="button" aria-pressed="${!!f.soloRosse}" data-tab-rosse="${f.soloRosse ? 0 : 1}">Solo rosse</button></div></section>`;
  let corpo = "";
  if (f.vista === "posti") {
    const righe = t.perLuogo.filter(l => !f.zona || l.zona === f.zona).filter(l => !f.soloRosse || l.rosse).map(l => `<button class="row tab-riga" data-tab-luogo="${esc(l.luogo)}"><span><b>${esc(l.nome)}</b> <span class="muted">· ${esc(nomeZonaBreve(l.zona))}${l.tipo !== "comune" && l.modo ? ` · ${esc(G.MODI[l.modo]?.nome || l.modo)}` : ""}</span><br><span class="tab-celle">${Object.entries(GRUPPI_GOV).filter(([g]) => l.gruppi[g]).map(([g, nome]) => `<i class="tab-cella ${COLORE_PEGGIO(l.gruppi[g])}" title="${esc(nome)}"><small>${esc(SIGLA_GRUPPO[g] || nome.slice(0, 3))}</small><b>${l.gruppi[g].rosse || "✓"}</b></i>`).join("")}</span><br><span class="muted small">mai fatte da ${G.GIORNI_GIRO} giorni: <b>${l.mai90}</b> su ${l.contate}${l.mai90Prova != null ? ` · a fine prova ${l.mai90Prova}` : ""}</span></span><span class="s ${l.rosse ? "warn" : l.gialle ? "wip" : "done"}">${l.rosse ? `${l.rosse} rosse` : l.grigie ? `${l.grigie} in programma` : "ok"}</span></button>`).join("");
    corpo = `<section class="card"><p class="muted small" style="margin:0 0 8px">Una riga per posto, un quadratino per gruppo di regole (${Object.values(GRUPPI_GOV).filter(x => x !== "Le tue regole").join(", ")}): il colore è il peggiore del gruppo, il numero sono le rosse. Sotto, le superfici mai fatte da ${G.GIORNI_GIRO} giorni (e come sarebbero a fine prova). Tocca per vedere regola per regola.</p><div class="rows">${righe || `<div class="row"><span class="muted">Niente da mostrare con questi filtri.</span></div>`}</div></section>`;
  } else if (f.vista === "regole") {
    const inTab = new Set(t.celle.map(c => c.regola)); const regole = regoleGov().filter(r => !r.evento && inTab.has(r.id));
    const rosseDi = {}; for (const c of t.celle) if (c.colore === "rosso") rosseDi[c.regola] = (rosseDi[c.regola] || 0) + 1;
    const scelta = f.regola && regole.some(r => r.id === f.regola) ? f.regola : (t.celle.find(c => c.colore === "rosso")?.regola || regole[0]?.id);
    const sel = `<div class="campo"><label for="tabRegola">Regola</label><select id="tabRegola" data-tab-regola>${Object.entries(GRUPPI_GOV).map(([g, nome]) => { const rr = regole.filter(r => r.gruppo === g); return rr.length ? `<optgroup label="${esc(nome)}">${rr.map(r => `<option value="${esc(r.id)}" ${r.id === scelta ? "selected" : ""}>${esc(r.nome)}${rosseDi[r.id] ? ` · ${rosseDi[r.id]} rosse` : ""}</option>`).join("")}</optgroup>` : ""; }).join("")}</select></div>`;
    const celle = t.celle.filter(c => c.regola === scelta).filter(c => !f.zona || c.zona === f.zona).filter(c => !f.soloRosse || c.colore === "rosso");
    const r = regole.find(x => x.id === scelta);
    corpo = `<section class="card">${sel}${r ? `<p class="muted small" style="margin:0 0 8px">${esc(G.etichettaOgni(r.ogni))} · ${esc(G.QUANDO_TESTO[r.quando] || r.quando)} · ${r.minuti} min${r.prodotto ? ` · ${esc(r.prodotto)}` : ""}${r.fuoriLivello ? " · solo nella fondo completa" : ""}</p>` : ""}<div class="rows">${celle.map(c => rigaCella(c, true)).join("") || `<div class="row"><span class="muted">Niente da mostrare con questi filtri.</span></div>`}</div></section>`;
  } else {
    const motivi = t.motivi.map(m => { const celle = t.celle.filter(c => c.colore === "rosso" && c.motivo === m.motivo && (!f.zona || c.zona === f.zona)); if (!celle.length) return ""; const perRegola = {}; for (const c of celle) perRegola[c.regola] = (perRegola[c.regola] || { nome: c.nome, n: 0 }), perRegola[c.regola].n++;
      return `<section class="card gov-ritardo"><h2 style="margin:0 0 6px;display:flex;gap:8px;align-items:flex-start"><span class="led" style="margin:7px 0 0" aria-hidden="true"></span><span>${esc(m.motivo.charAt(0).toUpperCase() + m.motivo.slice(1))}</span></h2><p class="muted small" style="margin:0 0 8px"><b>${celle.length}</b> ${celle.length === 1 ? "cella" : "celle"}${f.zona ? ` da ${esc(nomeZonaBreve(f.zona))}` : ""}.</p><div class="scelte">${Object.entries(perRegola).sort((a, b) => b[1].n - a[1].n).slice(0, 12).map(([id, x]) => `<button type="button" data-tab-apri-regola="${esc(id)}">${esc(x.nome)} · ${x.n}</button>`).join("")}${Object.keys(perRegola).length > 12 ? `<span class="muted small">e altre ${Object.keys(perRegola).length - 12} regole</span>` : ""}</div></section>`; }).join("");
    corpo = motivi || `<section class="card"><h2 style="margin:0">Nessun buco</h2><p class="muted" style="margin:6px 0 0">Ogni cosa del catalogo è fatta o ha una data in programma.</p></section>`;
  }
  return testa + conto + prova + filtri + corpo;
}
function cardConto(titolo, euro, sotto, pieno) { return `<div><b>${esc(titolo)}</b><strong>${eur(euro)}</strong><span>${esc(sotto)}${pieno > euro ? ` · tutto in regola ${eur(pieno)}` : ""}</span></div>`; }
function rigaCella(c, conLuogo) {
  const prog = c.programmata ? `in programma ${esc(L.dataGiornoLungo(c.programmata))}` : (c.colore === "grigio" && !c.ultima ? "più avanti" : "");
  return `<div class="row tab-cella-riga"><span><span class="pall ${c.colore}"></span> <b>${esc(conLuogo ? c.luogoNome : c.nome)}</b>${conLuogo ? ` <span class="muted">· ${esc(nomeZonaBreve(c.zona))}</span>` : c.codice ? ` <span class="el-pill out gov-codice">${esc(c.codice)}</span>` : ""}<br><span class="muted small">${c.colore === "fuori" ? `in modo ${esc(G.MODI[c.modo]?.nome || c.modo)} non è una stella: solo nella fondo completa` : c.ogni ? `ultima volta: <b>${esc(c.testo)}</b>${c.da ? ` (${esc(c.da)})` : ""}` : (c.quando === "cambio" ? "a ogni cambio completo" : "a ogni pulizia")}${prog && c.colore !== "fuori" ? ` · ${prog}` : ""}${c.colore !== "fuori" && !c.fatta90 ? ` · <span style="color:var(--warn)">mai da ${G.GIORNI_GIRO} giorni</span>` : ""}</span>${c.motivo ? `<br><span class="small" style="color:var(--warn)">● ${esc(c.motivo)}</span>` : ""}</span>${puoModificare() && c.colore !== "verde" && c.colore !== "fuori" && c.ogni ? `<button class="btnsm ghost" data-gov-fatto="${esc(c.regola)}|${esc(c.luogo)}|${esc(c.zona)}" aria-label="segna fatta oggi">✓</button>` : ""}</div>`;
}
function foglioTabLuogo(f) {
  const t = tabellone(); if (!t) return `<h3>Posto</h3>`;
  const l = t.perLuogo.find(x => x.luogo === f.luogo); if (!l) return `<h3>Posto</h3>`;
  const celle = t.celle.filter(c => c.luogo === f.luogo);
  const ORD = { rosso: 0, giallo: 1, grigio: 2, verde: 3, fuori: 4 };
  const gruppi = Object.entries(GRUPPI_GOV).map(([g, nome]) => { const cc = celle.filter(c => c.gruppo === g); if (!cc.length) return ""; const contate = cc.filter(c => c.colore !== "fuori"); return `<h2 style="margin:12px 0 6px">${esc(nome)} <span class="muted small">· ${cc.filter(c => c.colore === "rosso").length} rosse su ${contate.length}${cc.length - contate.length ? ` · ${cc.length - contate.length} solo nella fondo completa` : ""}</span></h2><div class="rows">${cc.sort((a, b) => ORD[a.colore] - ORD[b.colore]).map(c => rigaCella(c, false)).join("")}</div>`; }).join("");
  return `<h3>${esc(l.nome)}</h3><div class="muted">${esc(nomeZonaBreve(l.zona))}${l.tipo !== "comune" && l.modo ? ` · oggi modo ${esc(G.MODI[l.modo]?.nome || l.modo)}` : ""} · ${l.verdi} verdi · ${l.gialle} gialle · ${l.grigie} in programma · <b>${l.rosse} rosse</b>${l.fuori ? ` · ${l.fuori} solo nella fondo completa` : ""} · mai fatte da ${G.GIORNI_GIRO} giorni: <b>${l.mai90}</b> su ${l.contate}${l.mai90Prova != null ? ` (a fine prova ${l.mai90Prova})` : ""}</div>${gruppi}${puoModificare() ? `<p class="muted small" style="margin:10px 0 0">✓ = l'hai fatta tu oggi (o l'hai vista fatta): va nel registro.</p>` : ""}`;
}

// ============================================================================
//  MAPPA DELLE SUPERFICI (prova di completezza) e GIRO CON LA MAMMA
// ============================================================================
function mappaGov() { return G.mappaSuperfici(regoleGov(), (S.gov && S.gov.superficiExtra) || {}); }
function vistaMappaSuperfici() {
  const m = mappaGov(), giri = (S.gov && S.gov.giri) || [];
  const testa = `<section class="card"><div class="buchi ${m.buchi ? "rossi" : "zero"}"><b>Superfici scoperte: ${m.buchi}</b><span>${m.superfici} superfici in ${Object.keys(m.tipi).length} tipi di posto · ${m.buchi ? "le superfici in rosso non hanno nessuna regola attiva" : "ogni superficie ha almeno una regola del catalogo"} (i "Buchi" del Tabellone sono un'altra cosa: regole che nessuno farà in tempo)</span></div>
    <p class="muted small" style="margin:10px 0 0">Per ogni tipo di posto, tutte le superfici nell'ordine in cui si gira la stanza: in senso orario, dall'alto in basso, e per ogni oggetto sopra / davanti / dentro / dietro / sotto. Tocca una superficie per vedere le regole che la coprono o per aggiungerne una. Se spegni una regola e una superficie resta scoperta, qui diventa rossa.</p>
    ${puoModificare() ? `<button class="big main" data-giro-scegli>${ICONA("lente")} Giro con la mamma</button><p class="muted small" style="margin:6px 0 0">Si gira un posto vero, una superficie per volta: "C'è" oppure "Manca qualcosa", e quello che manca diventa una regola al volo.</p>` : ""}
    ${giri.length ? `<div class="rows" style="margin-top:10px">${giri.slice(-5).reverse().map(g => `<div class="row"><span><b>Giro fatto in ${esc(camera(g.luogo).nome)}</b> il ${esc(L.dataGiornoLungo(g.data))}<br><span class="muted small">${g.viste} superfici viste · ${g.aggiunte} aggiunte${g.nomi?.length ? ": " + esc(g.nomi.join(", ")) : ""}</span></span></div>`).join("")}</div>` : ""}</section>`;
  const tipi = Object.values(m.tipi).map(t => `<section class="card"><details ${t.buchi ? "open" : ""}><summary style="display:flex;justify-content:space-between;align-items:center;gap:8px;color:var(--fg)"><span><b style="font:700 18px var(--f-display)">${esc(t.nome)}</b><br><span class="muted small">${t.superfici} superfici</span></span><span class="badge ${t.buchi ? "warn" : "done"}">${t.buchi ? `${t.buchi} scoperte` : "tutte coperte"}</span></summary>
    ${t.oggetti.map(o => `<div class="mappa-ogg"><div class="mappa-ogg-t">${esc(o.o)}</div>${o.superfici.map(x => `<button class="row mappa-sup ${x.buco ? "buco" : ""}" data-superficie="${esc(x.id)}" data-tipo="${esc(t.tipo)}"><span>${esc(x.nome)}${x.aggiunta ? ` <span class="el-pill now">aggiunta</span>` : ""}<br><span class="muted small">${x.buco ? `<b style="color:var(--warn)">nessuna regola</b>` : x.opz && !x.regole.length ? "se c'è" : esc(x.regole.slice(0, 2).map(r => r.nome).join(" · ")) + (x.regole.length > 2 ? ` · +${x.regole.length - 2}` : "")}</span></span><span class="pall ${x.buco ? "rosso" : x.regole.length ? "verde" : "grigio"}"></span></button>`).join("")}</div>`).join("")}</details></section>`).join("");
  return testa + tipi;
}
function foglioSuperficie(f) {
  const m = mappaGov(); const t = m.tipi[f.tipoSup]; const x = t && t.oggetti.flatMap(o => o.superfici.map(s => ({ ...s, oggetto: o.o }))).find(s => s.id === f.id);
  if (!x) return `<h3>Superficie</h3>`;
  return `<h3>${esc(x.nome)}</h3><div class="muted">${esc(t.nome)} · ${esc(x.oggetto)}</div>
    ${x.regole.length ? `<div class="rows" style="margin-top:10px">${x.regole.map(r => `<div class="row"><span><span class="gov-ic mini">${ICONA(r.icona || "stella")}</span><b>${esc(r.nome)}</b><br><span class="muted small">${esc(G.etichettaOgni(r.ogni))} · ${esc(G.QUANDO_TESTO[r.quando] || r.quando)} · ${r.minuti} min${r.prodotto ? ` · ${esc(r.prodotto)}` : ""}</span><br><span class="muted small">${esc(r.come)}</span>${r.note ? `<br><span class="small" style="color:var(--warn)">⚠ ${esc(r.note)}</span>` : ""}</span></div>`).join("")}</div>` : `<div class="note warn" style="margin-top:10px">${x.opz ? "Vale solo se c'è: nessuna regola attiva." : "Scoperta: nessuna regola copre questa superficie."}</div>`}
    ${puoModificare() ? `<button class="big main" data-gov-regola-superficie="${esc(f.tipoSup)}|${esc(f.id)}|${esc(x.oggetto)}|${esc(x.nome)}">+ Regola per questa superficie</button>` : ""}`;
}
// --- il giro ---
function doveDaTipo(tipo, luogo) { return tipo === "camera" ? "stanza" : tipo === "bagno" ? "bagno" : tipo === "cucina" ? "cucina" : tipo === "balcone" ? "balcone" : tipo === "corridoio" ? ["corridoio_p1", "corridoio_p2"] : (luogo?.id || tipo); }
function iniziaGiro(luogoId) {
  const l = camera(luogoId); const tipi = G.tipiDiLuogo(l, flagsGov()); const m = mappaGov();
  const lista = tipi.flatMap(t => (m.tipi[t]?.oggetti || []).flatMap(o => o.superfici.map(x => ({ tipo: t, tipoNome: m.tipi[t].nome, oggetto: o.o, ...x }))));
  S.giro = { luogo: luogoId, tipi, lista, i: 0, aggiunte: [], viste: 0, manca: false };
  apriFoglio({ tipo: "giro" });
}
function foglioGiro(f) {
  const g = S.giro; if (!g) return "";
  const l = camera(g.luogo);
  if (g.i >= g.lista.length) {
    return `<div class="inizio"><div class="inizio-top"><button class="inizio-indietro" data-giro-fine>${ICONA("indietro")}<span>Chiudi</span></button></div>
      <div class="inizio-testa done"><div><div class="inizio-camera">Giro fatto</div><div class="inizio-lavoro">${esc(l.nome)} · ${esc(L.dataGiornoLungo(L.oggiISO()))}</div></div>${DONNINA("festa", "media")}</div>
      <div class="inizio-dett"><div class="inizio-dett-t">${ICONA("lente")}<span>Risultato</span></div><div class="inizio-dett-x">${g.viste} superfici viste · <b>${g.aggiunte.length} aggiunte</b></div>${g.aggiunte.length ? `<div class="inizio-dett-i">${esc(g.aggiunte.join(" · "))}</div>` : `<div class="inizio-dett-i">Niente da aggiungere: la mappa copre tutto quello che la mamma ha trovato. Ripeti il giro tra qualche mese.</div>`}</div>
      <button class="pro-btn blu gigante" data-giro-fine>${ICONA("spunta")}<span>Chiudi</span></button></div>`;
  }
  const x = g.lista[g.i];
  const form = g.manca ? `<div class="inizio-dett"><div class="inizio-dett-t">${ICONA("stella")}<span>Cosa manca qui?</span></div>
      <div class="campo"><label for="giCosa">Cosa si deve fare (puoi dettarlo col microfono della tastiera)</label><input id="giCosa" type="text" data-keep placeholder="es. Lavare il copriletto" autocomplete="off"></div>
      <div class="due"><div class="campo"><label for="giOgni">Ogni quanto</label><select id="giOgni">${G.SCALA_OGNI.filter(v => v >= 3.5).map(v => `<option value="${v}" ${v === 30 ? "selected" : ""}>${esc(G.etichettaOgni(v))}</option>`).join("")}</select></div><div class="campo"><label for="giMin">Minuti</label><input id="giMin" type="number" min="1" max="120" value="5"></div></div>
      <div class="campo"><label for="giQuando">Quando</label><select id="giQuando"><option value="ripasso">Durante la pulizia normale</option><option value="cambio">Durante il cambio completo</option><option value="libera">Solo a camera libera</option>${x.tipo === "camera" || x.tipo === "bagno" || x.tipo === "cucina" || x.tipo === "balcone" ? "" : `<option value="giornata" selected>Nella giornata di lavoro</option>`}</select></div>
      <div class="campo"><label for="giCome">Come si fa (il trucco della mamma, 2 righe)</label><textarea id="giCome" data-keep placeholder="es. Panno umido e poi asciutto, mai il detersivo sul legno"></textarea></div>
      <button class="pro-btn verde" data-giro-aggiungi>${ICONA("spunta")}<span>Aggiungi e avanti</span></button><button class="nonna-link" data-giro-annulla-manca>Lascia stare</button></div>`
    : `<button class="pro-btn blu gigante" data-giro-ce>${ICONA("spunta")}<span>C'è</span></button><button class="pro-btn verde" data-giro-manca>${ICONA("stella")}<span>Manca qualcosa</span></button>`;
  return `<div class="inizio"><div class="inizio-top"><button class="inizio-indietro" data-giro-fine>${ICONA("indietro")}<span>Interrompi</span></button><span class="badge skip">${g.i + 1} / ${g.lista.length}</span></div>
    <div class="inizio-testa skip"><div><div class="inizio-camera">${esc(x.oggetto)}</div><div class="inizio-lavoro">${esc(x.nome)}</div></div>${DONNINA("governante", "media")}</div>
    <div class="muted small" style="margin:6px 2px 0">${esc(l.nome)} · ${esc(x.tipoNome)}</div>
    <div class="inizio-dett"><div class="inizio-dett-t">${ICONA("lista")}<span>${x.regole.length ? "Chi se ne occupa" : "Nessuna regola"}</span></div>${x.regole.length ? x.regole.map(r => `<div class="inizio-dett-x" style="font-size:18px"><b>${esc(r.nome)}</b> <span class="muted">· ${esc(G.etichettaOgni(r.ogni))}</span></div>`).join("") : `<div class="inizio-dett-x" style="color:var(--warn)">${x.opz ? "Vale solo se c'è." : "Scoperta: aggiungi una regola."}</div>`}</div>
    ${form}
    <div class="pro-sec"><button class="nonna-link" data-giro-salta-oggetto>Salta "${esc(x.oggetto)}"</button></div></div>`;
}
async function giroAggiungi() {
  const g = S.giro; if (!g) return; const x = g.lista[g.i];
  const cosa = ($("#giCosa")?.value || "").trim(); if (!cosa) { $("#giCosa")?.focus(); return; }
  const l = camera(g.luogo); const id = "p_" + Date.now().toString(36);
  const quando = $("#giQuando")?.value || "ripasso";
  // la cosa che manca diventa una superficie nuova della mappa (sotto lo stesso oggetto) con la sua regola
  const sid = `${x.tipo}:x:${id}`;
  const r = { id, cosa, nome: cosa, dove: doveDaTipo(x.tipo, l), ogni: Number($("#giOgni")?.value) || 30, minuti: Number($("#giMin")?.value) || 5, quando, euro: 1, come: ($("#giCome")?.value || "").trim(), controllo: "", icona: "stella", priorita: 2, gruppo: "P", superfici: [sid, x.id], daGiro: { luogo: g.luogo, data: L.oggiISO() } };
  const personali = { ...(S.gov?.personali || {}), [id]: r };
  const superficiExtra = { ...((S.gov && S.gov.superficiExtra) || {}) }; superficiExtra[x.tipo] = [...(superficiExtra[x.tipo] || []), { id: sid, nome: cosa, oggetto: x.oggetto, luogo: g.luogo, data: L.oggiISO() }];
  g.aggiunte.push(cosa); g.manca = false; g.viste++; g.i++;
  await salvaGov({ personali, superficiExtra });
  g.lista[g.i - 1] = { ...x, regole: [...x.regole, r], buco: false };
  disegnaFoglio();
}
async function giroFine() {
  const g = S.giro; if (!g) { chiudiFoglio(); return; }
  if (g.viste > 0 || g.i >= g.lista.length) {
    const giri = [...((S.gov && S.gov.giri) || []).slice(-19), { luogo: g.luogo, data: L.oggiISO(), viste: g.viste, aggiunte: g.aggiunte.length, nomi: g.aggiunte.slice(0, 6), completo: g.i >= g.lista.length }];
    S.giro = null; chiudiFoglio(); await salvaGov({ giri });
  } else { S.giro = null; chiudiFoglio(); }
}
function vistaRegoleGov() {
  const sg = soglieGov(), mod = puoModificare(), imp = S.gov || {};
  const fl = flagsGov();
  let conto = null; try { conto = (tabellone() && tabellone().conto) || G.contoModi(ctxGov()); } catch (e) { console.warn("conto", e); }
  // 1. i tre modi legati all'ospite: il catalogo è uno, cambia solo il ritmo (specifiche §1)
  const modi = G.modiDi(S.gov), oggiIso0 = L.oggiISO(), ctx0 = ctxGov();
  const camereModo = { tecnici: [], operai: [], booking: [] }; for (const c of S.camere) camereModo[G.modoDi(c, oggiIso0, ctx0)].push(c.nome);
  const K_TESTO = { 0: "mai come stella: solo nella fondo completa", 0.5: "il doppio del ritmo scritto", 1: "ritmo pieno", 2: "metà ritmo", 3: "un terzo del ritmo" };
  const kRiga = (k, campo, testo) => { const v = modi[k][campo]; const cambiato = v !== G.MODI_BASE[k][campo]; return `<div class="row one modo-riga"><span>${testo}<br><span class="small ${cambiato ? "" : "muted"}">${esc(K_TESTO[v] || `ritmo × ${v}`)}${cambiato ? " · cambiato" : ""}</span></span><span class="gov-pm"><button class="btnsm ghost" data-gov-modo-k="${k}|${campo}|-1" ${mod ? "" : "disabled"} aria-label="meno spesso">−</button><b>${v === 0 ? "mai" : v === 1 ? "pieno" : v < 1 ? "×" + (1 / v) : "÷" + v}</b><button class="btnsm ghost" data-gov-modo-k="${k}|${campo}|1" ${mod ? "" : "disabled"} aria-label="più spesso">+</button></span></div>`; };
  const bRiga = (k, fascia, testo) => `<div class="row one modo-riga"><span>${testo}</span><span class="gov-pm"><button class="btnsm ghost" data-gov-modo-budget="${k}|${fascia}|-5" ${mod ? "" : "disabled"} aria-label="meno minuti">−</button><b>${modi[k].budget[fascia]}′</b><button class="btnsm ghost" data-gov-modo-budget="${k}|${fascia}|5" ${mod ? "" : "disabled"} aria-label="più minuti">+</button></span></div>`;
  const sRiga = (k, fascia, testo) => `<div class="row one modo-riga"><span>${testo}</span><span class="gov-pm"><button class="btnsm ghost" data-gov-modo-stelle="${k}|${fascia}|-1" ${mod ? "" : "disabled"} aria-label="una stella in meno">−</button><b>${modi[k].stelle[fascia] === 0 ? "nessuna" : modi[k].stelle[fascia] === 1 ? "1 stella" : modi[k].stelle[fascia] + " stelle"}</b><button class="btnsm ghost" data-gov-modo-stelle="${k}|${fascia}|1" ${mod ? "" : "disabled"} aria-label="una stella in più">+</button></span></div>`;
  const DESCR = {
    operai: "Soggiorni lunghi, 3-4 persone, cucinano ogni giorno. Igiene a ritmo pieno e la cucina (cappa, forno, bidoni, frigo, scarichi) più spesso; l'estetica a un terzo; il nascosto solo nella fondo completa. Nessuna stella nel ripasso del lunedì, fino a 2 di igiene nella totale del giovedì (25 minuti).",
    tecnici: "Stesse persone per mesi, camera vuota nel weekend, la ditta non scrive recensioni. Igiene piena, estetica e nascosto a metà ritmo. Il venerdì la totale a camera vuota (fino a lunedì): 45 minuti e fino a 5 stelle, così ogni superficie torna almeno una volta ogni 3 mesi; coprimaterasso ogni 2-3 settimane.",
    booking: "Weekend e soggiorni corti, ospiti che scrivono recensioni. Tutto a ritmo pieno; a ogni partenza controllo di lusso, coprimaterasso e copricuscini; le stelle prima su quello che l'ospite vede e tocca. Cambio d'aria e letto rifatto se la camera è rimasta ferma 2 giorni; d'estate ripasso al 4° giorno e asciugamani ogni 3 notti.",
  };
  const cardModo = k => { const m = modi[k], c = conto && conto.modi && conto.modi[k]; const cambiato = JSON.stringify(m) !== JSON.stringify(G.modiDi(null)[k]);
    return `<div class="modo-card modo-${k}"><div class="modo-testa"><b>${esc(G.MODI[k].nome)}</b><span class="modo-euro">${c ? `${eur(c.euroCameraSettimana)} <small>a camera a settimana</small>` : ""}</span></div><span class="small modo-descr">${esc(DESCR[k])}</span>
      <span class="small"><b>Oggi:</b> ${camereModo[k].length ? esc(camereModo[k].join(", ")) : "nessuna camera"}</span>
      <span class="small muted">Budget delle stelle: ripasso ${m.budget.ripasso}′ · totale ${m.budget.totale}′ · a camera vuota ${m.budget.libera}′ · al massimo ${m.stelle.ripasso}/${m.stelle.totale}/${m.stelle.libera} stelle${k === "booking" ? " · prima il visibile" : k === "operai" ? " · solo igiene" : ""}</span>
      <details class="gov-dett"><summary class="small">Cambia i ritmi di questo modo${cambiato ? " · cambiati" : ""}</summary><div class="rows" style="margin-top:6px">${kRiga(k, "p1", "Igiene (priorità 1)")}${k === "operai" || m.cucina !== 1 ? kRiga(k, "cucina", "Igiene della cucina (cappa, forno, bidoni, frigo, scarichi)") : ""}${kRiga(k, "p2", "Quello che l'ospite vede (priorità 2)")}${kRiga(k, "p3", "Il nascosto (priorità 3)")}${bRiga(k, "ripasso", "Minuti di stelle nel ripasso")}${bRiga(k, "totale", "Minuti di stelle nella totale")}${bRiga(k, "libera", "Minuti di stelle nella totale a camera vuota")}${sRiga(k, "ripasso", `Stelle nel ripasso (massimo ${G.STELLE_MAX.ripasso})`)}${sRiga(k, "totale", `Stelle nella totale (massimo ${G.STELLE_MAX.totale})`)}${sRiga(k, "libera", `Stelle nella totale a camera vuota (massimo ${G.STELLE_MAX.libera})`)}</div>${cambiato && mod ? `<button class="nonna-link" style="min-height:0;padding:4px 10px;margin:6px 0 0" data-gov-modo-reset="${k}">Torna ai valori di partenza</button>` : ""}</details></div>`; };
  const frenoOn = imp.freno && imp.freno.fino >= oggiIso0;
  const frenoHtml = frenoOn ? `<div class="note warn" style="margin:0 0 8px">Freno sul nascosto fino a <b>${esc(L.dataBreve(imp.freno.fino))}</b> (dalla chat): le cose di priorità 3 non entrano come stelle. ${mod ? `<button class="btnsm ghost" data-gov-freno-off style="margin-left:6px">Togli il freno</button>` : ""}</div>` : "";
  const livelli = `<section class="card"><h2 style="margin:0 0 4px">I tre modi</h2>${frenoHtml}<p class="muted small" style="margin:0 0 8px">Il catalogo è uno solo: tutte le regole esistono in tutti i modi, cambia solo il ritmo. Il modo segue <b>l'ospite che c'è in camera</b> (dal prospetto), non la camera: la stessa camera può essere Tecnici dal lunedì al venerdì e Booking nel weekend. Si sceglie nella scheda del soggiorno con tre pulsanti; l'app se lo ricorda per quel nome. Senza nessuno dentro: via Zara 1° e 2° sono Operai, le altre Tecnici, d'estate Booking.</p>
    <div class="modi">${G.NOMI_MODI.map(cardModo).join("")}</div>
    <p class="muted small" style="margin:8px 0 0">Il tetto delle stelle lo decide il passaggio: ${G.STELLE_MAX.ripasso} in un ripasso, ${G.STELLE_MAX.totale} in una totale, ${G.STELLE_MAX.libera} in una totale a camera vuota; il modo può solo abbassarlo. Il budget si riempie partendo dalla cosa <b>più scaduta</b> (una mai fatta sale finché non tocca a lei: così tutto gira almeno una volta ogni ${G.GIORNI_GIRO} giorni), a parità prima l'igiene; Booking: prima quello che l'ospite vede e tocca. Le righe "mai come stella" restano nel catalogo: nel Tabellone sono grigio chiaro, non buchi, e si fanno nella pulizia a fondo completa.</p></section>`;
  const profili = "";
  // 3. il calendario vero: i passaggi delle signore, posto per posto, con il budget delle stelle
  const calendario = `<section class="card"><h2 style="margin:0 0 4px">Il calendario vero</h2><p class="muted small" style="margin:0 0 8px">Dal foglio "Calendario vero" nella cartella catalogo (è lì che si cambia). Le stelle entrano solo nei giorni in cui una signora passa davvero, dentro il budget del passaggio. Dove nel foglio c'è ancora una domanda, quel posto resta con i giorni di prima finché Michele non risponde: l'app non inventa.</p>
    <div class="rows">${S.camere.map(c => { const cal = L.CALENDARIO_CAMERE[c.id]; const passi = L.passaggiCamera(c, S.regole); const txt = passi.map(x => `${L.GIORNI[x.giorno]} ${x.tipo === "ripasso" || x.tipo === "casa" ? "ripasso" : "totale"}${x.parte ? ` (${L.PARTE_TESTO[x.parte] || x.parte}, ${nomeZonaBreve(x.zona)})` : ""}`).join(" · ") || "nessun passaggio"; const bud = G.passiDi(c.id).map(x => `${L.GG[x.giorno]} ${x.budget}′${x.libera ? " (camera vuota)" : ""}`).join(" · ");
      return `<div class="row one"><b>${esc(c.nome)} <span class="muted small">· oggi ${esc(G.MODI[G.modoDi(c, oggiIso0, ctx0)]?.nome || "")}</span></b><span class="small">${esc(txt)}${bud ? ` <span class="muted">· stelle: ${esc(bud)}</span>` : ""}</span>${cal?.aperto ? `<span class="small" style="color:var(--warn)">● da confermare: ${esc(cal.domande.join(" · ").replace(/\[|\]/g, ""))}${passi.some(x => !x.daCalendario) ? " → per ora come prima" : ""}</span>` : ""}</div>`; }).join("")}</div>
    <p class="muted small" style="margin:8px 0 0">Mai di domenica. Le zone comuni (scale, corridoio, lavanderia) vanno alla prima camera del giorno della signora: le cose di ogni giorno più una a ritmo entro ${sg.zonaMinuti} minuti.</p></section>`;
  // 3b. le stagioni: inverno (giorni fissi) ed estate (arrivi e partenze), con l'interruttore per anticipare o posticipare
  const oggiIso = L.oggiISO(), regime = L.regimeDi(oggiIso, S.regole), rg = S.regole.regime || {};
  const cardStagioni = `<section class="card"><h2 style="margin:0 0 4px">Le stagioni</h2><p class="muted small" style="margin:0 0 8px"><b>Inverno</b> (da ottobre a maggio): i giorni fissi del calendario vero. <b>Estate</b> (dal 1° giugno al 31 agosto): niente giorni fissi, le pulizie seguono arrivi e partenze del prospetto (anche quelle del channel manager) e le stelle vanno sulle pulizie di partenza, 1-2 a partenza, prima il visibile. Il passaggio lo fa l'app dalle date; qui lo anticipi o lo posticipi.</p>
    <div class="note ${regime === "estate" ? "info" : "done"}" style="margin:0 0 8px">Adesso: <b>${esc(L.regimeTesto(regime))}</b>${rg.modo && rg.modo !== "auto" ? ` · forzato a mano (${esc(rg.modo)})` : " · automatico"}</div>
    <div class="scelte"><button type="button" aria-pressed="${!rg.modo || rg.modo === "auto"}" data-regime="auto" ${mod ? "" : "disabled"}>Automatico (1 giugno – 31 agosto)</button><button type="button" aria-pressed="${rg.modo === "estate"}" data-regime="estate" ${mod ? "" : "disabled"}>Estate da oggi</button><button type="button" aria-pressed="${rg.modo === "inverno"}" data-regime="inverno" ${mod ? "" : "disabled"}>Inverno da oggi</button></div>
    <p class="muted small" style="margin:8px 0 0">Due finestre di reset all'anno, proposte nei Consigli come lavori a camera libera su tutte le camere: <b>fine maggio</b> (M07, pronti al caldo) e <b>inizio settembre</b> (M08, chiusura della stagione estiva: fondo completa, materassi girati, tende lavate, filtri e sanificazione dei condizionatori, balconi a fondo). La finestra la trova dal prospetto.</p></section>`;
  // 4. il meteo segnato a mano
  const meteo = imp.meteo || {}, oggi = L.oggiISO();
  const attivo = k => meteo[k] && meteo[k] >= oggi ? meteo[k] : null;
  const pioggiaOn = attivo("pioggia") || attivo("vento"), freddoOn = attivo("freddo"), caldoOn = attivo("caldo");
  const cardMeteo = `<section class="card"><h2 style="margin:0 0 4px">Il meteo di Lesina</h2><p class="muted small" style="margin:0 0 8px">Il meteo automatico gratis non c'è ancora: lo segni tu, e le regole del meteo scattano come se fossero le previsioni (esterni e scarichi dopo pioggia o vento forte, antimuffa con l'umidità, coperte e trapuntine quando cambia la stagione). Tocca di nuovo per spegnere.</p>
    <div class="meteo-tasti"><button class="pro-btn ${pioggiaOn ? "blu" : ""}" data-gov-meteo-pioggia="${pioggiaOn ? 0 : 1}" ${mod ? "" : "disabled"}>${ICONA("pioggia")}<span>Ha piovuto / vento forte${pioggiaOn ? ` · fino a ${esc(L.dataBreve(pioggiaOn))}` : ""}</span></button>
    <button class="pro-btn ${freddoOn || caldoOn ? "blu" : ""}" data-gov-meteo-stagione="1" ${mod ? "" : "disabled"}>${ICONA("coperta")}<span>${freddoOn ? `Arriva il freddo · fino a ${esc(L.dataBreve(freddoOn))}` : caldoOn ? `Arriva il caldo · fino a ${esc(L.dataBreve(caldoOn))}` : "Arriva il freddo / arriva il caldo"}</span></button></div></section>`;
  // 5. le righe del file, posto per posto (Sì/No per codice, ritmo delle parti a ritmo, badge del blocco)
  const attive = regoleGov(), modRegole = imp.regole || {}, riv = imp.riviste || {};
  const partiDi = codice => G.CATALOGO.filter(p => p.codice === codice);
  const BLOCCO_CLS = { rotazione: "rot", libera: "lib", "normale+rotazione": "rot" };
  const rigaFile = r => {
    const parti = partiDi(r.id), rot = parti.filter(p => p.tipo === "rotazione"), spenta = modRegole[r.id]?.attiva === false || (parti.length && parti.every(p => modRegole[p.id]?.attiva === false));
    const att = attive.filter(a => a.codice === r.id), fuori = !spenta && rot.length > 0 && att.length > 0 && att.filter(a => a.tipo === "rotazione").every(a => a.fuoriLivello);
    const prima = rot[0] ? (att.find(a => a.id === rot[0].id) || rot[0]) : null;
    const blocco = parti[0]?.blocco || "";
    const ritmo = rot.length ? rot.map(p => { const a = att.find(x => x.id === p.id) || p; return `${p.parte ? p.parte + " " : ""}${G.etichettaOgni(a.ogni)}${a.ogniMezza ? ` (mezze stagioni ${G.etichettaOgni(a.ogniMezza)})` : ""}`; }).join(", ") : r.ogniTesto;
    // lo stesso ritmo nei tre modi (cambia solo il moltiplicatore del modo)
    const perModo = prima && prima.ogni && !prima.evento && !prima.sempre ? G.NOMI_MODI.map(k => { const a = G.regolePerModo(ctx0, k).find(x => x.id === prima.id); return a ? `${G.MODI[k].nome}: ${a.fuoriModo ? "solo nella fondo completa" : G.etichettaOgni(a.ogni)}` : ""; }).filter(Boolean) : [];
    const modiTxt = perModo.length && new Set(perModo.map(x => x.split(": ")[1])).size > 1 ? `<span class="muted small gov-regola-modi">${esc(perModo.join(" · "))}</span>` : "";
    return `<div class="row one gov-regola ${spenta ? "spenta" : ""} ${fuori ? "fuori" : ""}"><span class="gov-regola-testa"><span class="el-pill out gov-codice">${esc(r.id)}</span><b>${esc(r.superficie)}</b><span class="gov-blocco ${BLOCCO_CLS[blocco] || ""}">${esc(r.bloccoTesto)}</span><span class="seg" style="margin-left:auto"><button aria-pressed="${!spenta}" data-gov-attiva="${esc(r.id)}|1" ${mod ? "" : "disabled"}>Sì</button><button aria-pressed="${spenta}" data-gov-attiva="${esc(r.id)}|0" ${mod ? "" : "disabled"}>No</button></span></span>
      <span class="small gov-regola-dove">${esc(r.regola)} · <b>${esc(ritmo)}</b> · ${esc(r.quandoTesto)} · ${esc(r.prioritaTesto.toLowerCase())} · ${r.minuti} min${fuori ? ` · <span class="gov-fuori">solo nella fondo completa</span>` : ""}</span>${modiTxt}
      ${prima && prima.ogni && !prima.evento ? `<span class="gov-pm"><button class="btnsm ghost" data-gov-ogni="${esc(prima.id)}|-1" ${mod ? "" : "disabled"} aria-label="meno spesso">−</button><b>${esc(G.etichettaOgni(prima.ogni))}</b><button class="btnsm ghost" data-gov-ogni="${esc(prima.id)}|1" ${mod ? "" : "disabled"} aria-label="più spesso">+</button></span>` : ""}
      <details class="gov-dett"><summary class="small">come si fa · prodotto · controllo</summary><span class="small" style="display:block;margin-top:4px">${esc(modRegole[r.id]?.come || r.come)}</span>${r.prodotto ? `<span class="muted small gov-regola-prod"><b>Prodotto:</b> ${esc(r.prodotto)}</span>` : ""}${r.controllo ? `<span class="muted small gov-regola-ctrl">${ICONA("lente")} ${esc(r.controllo)}</span>` : ""}${r.note ? `<span class="small gov-regola-nota">⚠ ${esc(r.note)}</span>` : ""}
      ${mod ? `<button class="nonna-link gov-rivedi ${riv[r.id] ? "fatta" : ""}" data-gov-rivedi="${esc(r.id)}">${riv[r.id] ? `✓ Rivista con la mamma il ${esc(L.dataGiornoLungo(riv[r.id].data))}${riv[r.id].cambiata ? " · come si fa cambiato" : ""}` : "Rivedi con la mamma"}</button>` : riv[r.id] ? `<span class="muted small">✓ rivista con la mamma il ${esc(L.dataGiornoLungo(riv[r.id].data))}</span>` : ""}</details></div>`;
  };
  const posti = [...new Set(G.RIGHE.map(r => r.posto))];
  const gruppi = posti.map(posto => { const righe = G.RIGHE.filter(r => r.posto === posto); const spente = righe.filter(r => modRegole[r.id]?.attiva === false).length;
    return `<section class="card"><details><summary style="color:var(--fg)"><b style="font:700 18px var(--f-display)">${esc(posto)}</b> <span class="muted small">· ${righe.length} righe${spente ? ` · ${spente} spente` : ""}</span></summary><div class="rows" style="margin-top:8px">${righe.map(rigaFile).join("")}</div></details></section>`; }).join("");
  const personali = Object.values(imp.personali || {});
  const tue = personali.length ? `<section class="card"><h2 style="margin:0 0 6px">Le tue regole</h2><div class="rows">${personali.map(r => { const m = modRegole[r.id] || {}; const x = { ...r, ...m }; return `<div class="row one gov-regola ${x.attiva === false ? "spenta" : ""}"><span class="gov-regola-testa"><span class="gov-ic mini">${ICONA("stella")}</span><b>${esc(x.nome || x.cosa)}</b><span class="seg" style="margin-left:auto"><button aria-pressed="${x.attiva !== false}" data-gov-attiva="${esc(r.id)}|1" ${mod ? "" : "disabled"}>Sì</button><button aria-pressed="${x.attiva === false}" data-gov-attiva="${esc(r.id)}|0" ${mod ? "" : "disabled"}>No</button></span></span>
      <span class="muted small gov-regola-dove">${esc(doveTesto(x))} · ${x.minuti} min · ${esc(G.QUANDO_TESTO[x.quando] || x.quando)}${stagioneTesto(x)}</span>
      ${x.ogni ? `<span class="gov-pm"><button class="btnsm ghost" data-gov-ogni="${esc(r.id)}|-1" ${mod ? "" : "disabled"} aria-label="meno spesso">−</button><b>${esc(G.etichettaOgni(x.ogni))}</b><button class="btnsm ghost" data-gov-ogni="${esc(r.id)}|1" ${mod ? "" : "disabled"} aria-label="più spesso">+</button></span>` : ""}
      ${x.come ? `<span class="small">${esc(x.come)}</span>` : ""}${mod ? `<button class="nonna-link" style="min-height:0;padding:4px 10px;margin:4px 0 0" data-gov-cancella-regola="${esc(r.id)}">Cancella questa regola</button>` : ""}</div>`; }).join("")}</div></section>` : "";
  const nuova = mod ? `<section class="card flat"><button class="big main" data-gov-nuova-regola>+ Nuova regola</button><p class="muted small center" style="margin:6px 0 0">Il catalogo vero è il file nella cartella catalogo: le regole aggiunte qui valgono finché Michele non le porta nel file. Le signore non possono toccare le regole.</p></section>` : "";
  // 6. materiali, istruzioni fisse, camere con balcone/strada/frigo, soglie piccole, rivedi con la mamma (in fondo, non è un compito)
  const segCam = (k, titolo, testo) => `<section class="card"><h2 style="margin:0 0 4px">${titolo}</h2><p class="muted small" style="margin:0 0 8px">${testo}</p><div class="rows">${S.camere.filter(c => c.tipo !== "casa").map(c => `<div class="row"><span>${esc(c.nome)}</span><span class="seg"><button aria-pressed="${!!(fl[k] || {})[c.id]}" data-gov-flag="${k}|${c.id}|1" ${mod ? "" : "disabled"}>Sì</button><button aria-pressed="${!(fl[k] || {})[c.id]}" data-gov-flag="${k}|${c.id}|0" ${mod ? "" : "disabled"}>No</button></span></div>`).join("")}</div></section>`;
  const camereFlag = segCam("balconi", "Camere con il balcone", "Le regole del balcone valgono solo per queste.") + segCam("strada", "Camere sulla strada", "Telai e binari delle finestre ogni settimana invece che ogni due.") + segCam("frigo", "Camere con il frigo", "La regola del frigo in camera vale solo per queste.");
  const fisse = `<section class="card"><h2 style="margin:0 0 4px">Istruzioni fisse delle camere</h2><p class="muted small" style="margin:0 0 8px">Quello che in una camera va fatto a ogni pulizia (es. Salvatore: balcone). La signora lo vede in fondo alla lista, "Sempre in questa camera", e la controllatrice lo verifica.</p>
    <div class="rows">${S.camere.map(c => `<div class="row one"><span><b>${esc(c.nome)}</b><br><input type="text" data-keep id="pmg_${esc(c.id)}" data-promemoria="${esc(c.id)}" value="${esc(S.promemoria?.[c.id] || "")}" placeholder="niente di particolare" ${mod ? "" : "disabled"} style="margin-top:4px"></span></div>`).join("")}</div><p class="muted small" style="margin:8px 0 0">Si salva da solo quando esci dalla casella. Più cose: separale con una virgola.</p></section>`;
  const sogliaRiga = (k, testo, step, min, max, unita) => `<div class="row"><span>${testo}</span><span class="gov-pm"><button class="btnsm ghost" data-gov-soglia="${k}|${-step}" ${mod ? "" : "disabled"} aria-label="meno">−</button><b>${sg[k]}${unita}</b><button class="btnsm ghost" data-gov-soglia="${k}|${step}" ${mod ? "" : "disabled"} aria-label="più">+</button></span></div>`;
  const soglie = `<section class="card"><h2 style="margin:0 0 6px">Due soglie piccole</h2><div class="rows">${sogliaRiga("camereSettimana", "Pulizie a fondo complete a settimana (mezza giornata, a camera vuota)", 1, 1, 5, "")}${sogliaRiga("zonaMinuti", "Minuti a ritmo per le zone comuni nel giorno della signora", 5, 5, 60, "′")}${sogliaRiga("budgetStelle", "Budget delle stelle al mese (la governante ti avvisa al 90%)", 10, 100, 2000, " €")}</div><p class="muted small" style="margin:8px 0 0">Il budget delle stelle per passaggio sta nel foglio "Calendario vero" e, dove il foglio non dice niente, nel modo dell'ospite (sopra, "I tre modi").</p></section>`;
  const matImp = imp.materiali || {};
  const selMat = (l, tipo, etichetta) => { const m = G.materialiDi(l, matImp); return `<label class="gov-mat"><span>${etichetta}</span><select data-gov-materiale="${esc(l.id)}|${tipo}" ${mod ? "" : "disabled"}>${Object.entries(G.MATERIALI[tipo]).map(([k, v]) => `<option value="${k}" ${m[tipo] === k ? "selected" : ""}>${esc(v.nome)}</option>`).join("")}</select></label>`; };
  const daFoto = new Set(["lella", "nicole", "trento", "zarapt", "zara1"]);
  const materiali = `<section class="card"><h2 style="margin:0 0 4px">Materiali dei posti</h2><p class="muted small" style="margin:0 0 8px">Dalle foto: 1° piano e appartamenti con il pavimento in marmo rosso lucido e porte in legno scuro, 2° piano con il gres color cotto e le porte in laminato chiaro, box doccia a soffietto in PVC quasi ovunque, mobili in laminato di finto legno dappertutto. Per Lella, Nicole, via Trento e via Zara non ho foto: sono messi come il piano a cui somigliano, finché Michele non manda le foto. La signora legge la riga giusta per quel posto ("Qui: …").</p>
    <div class="rows">${[...S.camere, ...G.LUOGHI_COMUNI].map(l => `<div class="row one"><b>${esc(l.nome)}${daFoto.has(l.id) ? ` <span class="el-pill out">MICHELE: foto?</span>` : ""}</b><div class="gov-mat-riga">${selMat(l, "pavimento", "Pavimento")}${l.tipo !== "comune" ? selMat(l, "box", "Box doccia") : ""}${selMat(l, "porte", "Porte")}${l.tipo !== "comune" ? selMat(l, "mobili", "Mobili") : ""}</div></div>`).join("")}</div>
    <details style="margin-top:10px"><summary class="nonna-link" style="display:inline-flex">Come si trattano i materiali (la scheda)</summary><div class="rows" style="margin-top:8px">${G.SCHEDA_MATERIALI.map(m => `<div class="row one"><b>${esc(m.nome)}</b><span class="muted small">${esc(m.dove)}</span><span class="small">${esc(m.come)}.</span>${m.mai ? `<span class="small gov-regola-nota">⚠ ${esc(m.mai)}.</span>` : ""}</div>`).join("")}</div></details></section>`;
  const daRivedere = G.RIGHE.filter(r => modRegole[r.id]?.attiva !== false && !riv[r.id]);
  const mamma = `<section class="card"><h2 style="margin:0 0 4px">Vuoi rivedere una regola con chi conosce le camere?</h2><p class="muted small" style="margin:0 0 8px">Non è un compito: se non ne rivedete nessuna, le signore leggono i testi del catalogo e va bene così. Serve quando un "come si fa" vi sembra sbagliato: lo aprite, la mamma dice come si fa davvero, lo correggete e da quel momento le signore leggono il suo. Finora riviste: <b>${G.RIGHE.length - daRivedere.length}</b> su ${G.RIGHE.length}.</p>
    ${daRivedere.length ? `<div class="scelte">${daRivedere.slice(0, 6).map(r => `<button type="button" data-gov-rivedi="${esc(r.id)}">${esc(r.superficie)}</button>`).join("")}</div>` : ""}</section>`;
  // 1b. le cose che la governante fa da sola (dalla chat: "la prossima volta lo faccio da sola? Sì")
  const auto = Object.entries((S.chat && S.chat.automatiche) || {}).filter(([, v]) => v);
  const daSola = `<section class="card"><h2 style="margin:0 0 4px">Cose che la governante fa da sola</h2><p class="muted small" style="margin:0 0 8px">Quando a una domanda della chat rispondi due volte allo stesso modo, la governante chiede "la prossima volta lo faccio da sola?". Quelle a cui hai detto sì stanno qui: le fa senza chiedere e scrive "Fatto da sola" nella chat. Un tocco e torna a chiedertelo.</p>
    ${auto.length ? `<div class="rows">${auto.map(([tipo, v]) => `<div class="row"><span><b>${esc(CH.TITOLI[tipo] || tipo)}</b><br><span class="muted small">risponde sempre: ${esc(String(v))}</span></span>${mod ? `<button class="btnsm ghost" data-chat-auto-off="${esc(tipo)}">Chiedimelo</button>` : ""}</div>`).join("")}</div>` : `<p class="muted small" style="margin:0">Per ora niente: ti chiede tutto.</p>`}</section>`;
  return cardIA() + livelli + daSola + profili + calendario + cardStagioni + cardMeteo + gruppi + tue + nuova + soglie + materiali + fisse + camereFlag + mamma;
}
// --- Rivedi con la mamma: si legge il "come si fa", lei conferma o lo corregge ---
function foglioRivedi(f) {
  const riga = G.RIGA_DI[f.id] || null;
  const r = riga ? { ...riga, id: riga.id, nome: riga.superficie, come: (S.gov?.regole?.[riga.id]?.come) || riga.come, ogni: (G.CATALOGO.find(p => p.codice === riga.id && p.tipo === "rotazione") || {}).ogni || 0, dove: (G.CATALOGO.find(p => p.codice === riga.id) || {}).dove || "stanza" } : (regoleGov().find(x => x.id === f.id) || G.CATALOGO.find(x => x.id === f.id)); if (!r) return `<h3>Regola</h3>`;
  const riv = ((S.gov && S.gov.riviste) || {})[r.id]; const base = riga || G.CATALOGO.find(x => x.id === r.id); const cambiato = !!(base && r.come !== base.come);
  return `<h3>${esc(r.nome || r.cosa)}</h3><div class="muted">${riga ? esc(riga.regola) + " · " : ""}${esc(doveTesto(r))} · ${esc(riga ? riga.ogniTesto : G.etichettaOgni(r.ogni))} · ${r.minuti} min${r.prodotto ? ` · ${esc(r.prodotto)}` : ""}</div>
    ${riv ? `<div class="note done" style="margin-top:8px">Rivista con la mamma il ${esc(L.dataGiornoLungo(riv.data))}${riv.da ? ` (${esc(riv.da)})` : ""}${riv.cambiata ? " · il come si fa è il suo" : ""}.</div>` : `<div class="note info" style="margin-top:8px">Leggile il "come si fa". Se va bene, tocca "Va bene così". Se lei lo fa in un altro modo, scrivilo (o dettalo col microfono della tastiera) e salva: le signore leggono il suo.</div>`}
    <div class="campo" style="margin-top:10px"><label for="rvCome">Come si fa (lo legge la signora)</label><textarea id="rvCome" data-keep rows="6">${esc(r.come)}</textarea></div>
    ${r.note ? `<div class="small gov-regola-nota">⚠ ${esc(r.note)}</div>` : ""}
    ${r.controllo ? `<div class="muted small" style="margin-top:6px">${ICONA("lente")} Come si controlla: ${esc(r.controllo)}</div>` : ""}
    <button class="big main" data-gov-rivedi-ok="${esc(r.id)}">✓ Va bene così (rivista)</button>
    <button class="big ok" data-gov-rivedi-salva="${esc(r.id)}">Salva come dice la mamma</button>
    ${cambiato ? `<button class="nonna-link" data-gov-rivedi-base="${esc(r.id)}">Torna al testo di prima</button>` : ""}`;
}
async function salvaRivista(id, come) {
  const riviste = { ...((S.gov && S.gov.riviste) || {}) }, regole = { ...((S.gov && S.gov.regole) || {}) };
  const base = G.RIGA_DI[id] || G.CATALOGO.find(x => x.id === id); const attuale = regoleGov().find(x => x.codice === id || x.id === id);
  let cambiata = false;
  if (come != null) { const t = come.trim(); if (t && t !== (regole[id]?.come || attuale?.come || "")) { regole[id] = { ...(regole[id] || {}), come: t }; cambiata = true; if (base && t === base.come) delete regole[id].come; } }
  riviste[id] = { data: L.oggiISO(), da: S.utente.nome || "", cambiata: cambiata || !!(riviste[id]?.cambiata) };
  chiudiFoglio(); await salvaGov({ riviste, regole }); toast(cambiata ? "Salvato: le signore leggono il come si fa della mamma" : "Segnata come rivista con la mamma");
}
function stagioneTesto(r) { const f = r.stagione ? (Array.isArray(r.stagione) ? r.stagione : [r.stagione]) : []; if (!f.length) return ""; const gm = x => `${x.slice(3)}/${x.slice(0, 2)}`; return " · " + f.map(x => `dal ${gm(x.da)} al ${gm(x.a)}`).join(" e "); }
function doveTesto(r) { const d = r.dove; if (Array.isArray(d)) return d.map(x => doveTesto({ dove: x })).join(" e "); if (r.soloFrigo) return "camere con il frigo"; if (d === "camera" || d === "camere") return "tutte le camere"; if (d === "cucina" || d === "case") return "gli appartamenti"; if (d === "bagno") return "tutti i bagni"; if (d === "balcone") return "camere con il balcone"; if (d === "stanza" || d === "stanze" || d === "tutte") return "camere e appartamenti"; if (d?.startsWith("zona:")) return nomeZonaBreve(d.slice(5)); if (d?.startsWith("camera:")) return camera(d.slice(7)).nome; return camera(d).nome; }
function foglioNuovaRegola(f) {
  const dove = [["stanza", "Camere e appartamenti"], ["camera", "Solo le camere"], ["bagno", "Tutti i bagni"], ["cucina", "Solo gli appartamenti (cucina)"], ["balcone", "Camere con il balcone"], ...G.LUOGHI_COMUNI.map(l => [l.id, l.nome]), ...S.camere.map(c => ["camera:" + c.id, "Solo " + c.nome])];
  const doveDef = f.tipoSup ? (Array.isArray(doveDaTipo(f.tipoSup, null)) ? "corridoio_p1" : doveDaTipo(f.tipoSup, null)) : "stanza";
  return `<h3>Nuova regola</h3><div class="muted">${f.superficie ? `Per la superficie <b>${esc(f.nomeSup || "")}</b> (${esc(f.oggetto || "")}).` : "Sei cose semplici. La governante la mette in programma da sola."}</div>
    <form id="formRegola">
      <div class="campo"><label for="rgCosa">Cosa</label><input id="rgCosa" type="text" placeholder="es. Lavare le tende" required></div>
      <div class="campo"><label for="rgDove">Dove</label><select id="rgDove">${dove.map(([v, n]) => `<option value="${esc(v)}" ${v === doveDef ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
      <div class="due"><div class="campo"><label for="rgOgni">Ogni quanto</label><select id="rgOgni">${G.SCALA_OGNI.map(g => `<option value="${g}" ${g === 30 ? "selected" : ""}>${esc(G.etichettaOgni(g))}</option>`).join("")}</select></div><div class="campo"><label for="rgMin">Minuti</label><input id="rgMin" type="number" min="5" max="480" step="5" value="30"></div></div>
      <div class="due"><div class="campo"><label for="rgQuando">Quando</label><select id="rgQuando"><option value="ripasso">Durante la pulizia normale</option><option value="cambio">Durante il cambio completo</option><option value="libera">Solo a camera libera</option><option value="giornata">Zona comune, nella giornata</option><option value="giorno">Lavoro a sé, in un giorno</option></select></div><div class="campo"><label for="rgEuro">Compenso (€)</label><input id="rgEuro" type="number" min="0" step="0.5" value="2"></div></div>
      <div class="campo"><label for="rgCome">Come si fa (lo legge la signora)</label><textarea id="rgCome" placeholder="es. Tende staccate, lavate a 40°, riappese umide. Panno BLU."></textarea></div>
      <div class="campo"><label for="rgCtrl">Come si controlla (lo legge la controllatrice)</label><input id="rgCtrl" type="text" placeholder="es. Tende controluce: niente aloni"></div>
      <div class="due"><div class="campo"><label for="rgDa">Solo dal (giorno/mese, facoltativo)</label><input id="rgDa" type="text" placeholder="es. 01/10" pattern="\\d{2}/\\d{2}"></div><div class="campo"><label for="rgA">al</label><input id="rgA" type="text" placeholder="es. 30/11" pattern="\\d{2}/\\d{2}"></div></div>
      <button class="big main" type="submit">Aggiungi la regola</button>
    </form>`;
}
async function salvaNuovaRegola() {
  const cosa = $("#rgCosa").value.trim(); if (!cosa) return;
  const id = "p_" + Date.now().toString(36);
  const sup = S.foglio?.superficie;
  const gm = (v) => { const m = String(v || "").trim().match(/^(\d{2})\/(\d{2})$/); return m ? `${m[2]}-${m[1]}` : null; };
  const da = gm($("#rgDa").value), a = gm($("#rgA").value);
  const r = { id, cosa, nome: cosa, dove: $("#rgDove").value, ogni: Number($("#rgOgni").value) || 30, minuti: Number($("#rgMin").value) || 30, quando: $("#rgQuando").value, euro: Number($("#rgEuro").value) || 0, come: $("#rgCome").value.trim(), controllo: $("#rgCtrl").value.trim(), icona: "stella", priorita: 2, gruppo: "P" };
  if (sup) r.superfici = [sup];
  if (r.quando === "cambio") r.ogni = 0;
  if (da && a) r.stagione = { da, a };
  chiudiFoglio();
  await salvaGov({ personali: { ...(S.gov?.personali || {}), [id]: r } }); toast("Regola aggiunta");
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
// Il conto dal prospetto (Michele): "Pulizie: … € + stelle: … € = … €" per la settimana e per il mese, pulizie previste e fatte
function contoProspetto(da, a) {
  const ps = Object.values(S.pulizie).filter(p => p.data >= da && p.data <= a && p.stato !== "non_fatta");
  let pulizie = 0, stelle = 0, lavori = 0, n = 0, ultimo = "";
  for (const p of ps) {
    if (p.data > ultimo) ultimo = p.data;
    if (p.origine === "governante" || p.tipo === "extra") { lavori += Number(p.importo) || 0; continue; }
    n++; pulizie += Number(p.importo) || 0;
    stelle += p.stato === "fatta" ? (Number(p.extraRifiniture) || 0) : rifinitureDi(p).filter(r => !r.sempre && !r.comune).reduce((x, r) => x + (r.euro || 0), 0);
  }
  const r2 = x => Math.round(x * 100) / 100;
  return { pulizie: r2(pulizie), stelle: r2(stelle), lavori: r2(lavori), totale: r2(pulizie + stelle + lavori), n, ultimo };
}
function cardContoProspetto() {
  const r2 = x => Math.round(x * 100) / 100;
  const oggi = L.oggiISO(), lun = L.lunediDi(oggi), dom = L.aggiungiGiorni(lun, 6);
  const sett = contoProspetto(lun, dom);
  const m1 = L.primoDelMese(oggi), m2 = L.ultimoDelMese(oggi), mese = contoProspetto(m1, m2);
  const giorniMese = L.giorniTra(m1, m2) + 1, copertoFino = mese.ultimo && mese.ultimo < m2 ? mese.ultimo : m2;
  // la riga che vuole Michele: "Pulizie: … € + stelle: … € = … €"; i lavori a parte (consigli accettati, pulizie a fondo, lavori extra) stanno su una riga sotto
  const riga = (c) => `Pulizie: <b>${eur(c.pulizie)}</b> + stelle: <b>${eur(c.stelle)}</b> = <b>${eur(r2(c.pulizie + c.stelle))}</b>${c.lavori ? `<br><span class="muted small">Lavori a parte (consigli accettati, pulizie a fondo, extra): ${eur(c.lavori)} · in tutto ${eur(c.totale)}</span>` : ""}`;
  // stima del mese: pulizie e stelle al ritmo dei giorni già coperti dal prospetto, più i lavori a parte così come sono scritti
  const giorniCoperti = L.giorniTra(m1, copertoFino) + 1;
  const stima = copertoFino < m2 && giorniCoperti > 0 && (mese.pulizie + mese.stelle) ? Math.round((mese.pulizie + mese.stelle) / giorniCoperti * giorniMese + mese.lavori) : 0;
  return `<section class="card conto-prospetto"><h2 style="margin:0 0 4px">Il conto dal prospetto</h2><p class="muted small" style="margin:0 0 8px">Quello che costano le pulizie normali (ore standard × tariffa: 8 € in albergo, 10 € negli appartamenti) e le stelle scritte nel prospetto di adesso, fatte e da fare. Non sono le paghe già pagate: quelle stanno sotto, signora per signora.</p>
    <div class="row one"><b>Questa settimana</b> <span class="muted small">${esc(L.dataBreve(lun))} – ${esc(L.dataBreve(dom))} · ${sett.n} pulizie</span><span>${riga(sett)}</span></div>
    <div class="row one"><b>${esc(L.meseLungo(oggi).replace(/^./, ch => ch.toUpperCase()))}</b> <span class="muted small">dal prospetto che c'è${copertoFino < m2 ? `, fino a ${esc(L.dataBreve(copertoFino))}` : ""} · ${mese.n} pulizie</span><span>${riga(mese)}</span>${copertoFino < m2 && stima ? `<span class="muted small">Se il resto del mese va come i giorni già coperti, il mese intero viene circa <b>${eur(stima)}</b>.</span>` : ""}</div></section>`;
}
function vistaPaghe() {
  const chiave = L.settimanaCorrente();
  const blocchi = signore().map(z => {
    const t = L.totaleSettimana(S.pulizie, z.id, chiave, S.regole, S.controlli, S.listino), { lista, totale } = t;
    const pd = S.pagamenti[`${z.id}_${chiave}`];
    const prec = L.settimanaPrecedente(chiave), tp = L.totaleSettimana(S.pulizie, z.id, prec, S.regole, S.controlli, S.listino), pp = S.pagamenti[`${z.id}_${prec}`];
    return `<section class="card zone"><div class="head"><h2 style="margin:0">${esc(SIG(z.id))}</h2><b style="font:800 22px var(--f-display)">${eur(totale)}</b></div>
      <div class="muted">${lista.length} ${lista.length === 1 ? "pulizia" : "pulizie"} · settimana ${L.etichettaSettimana(chiave)}</div>
      <div class="muted small" style="margin:2px 0 6px">${rigaConto(t)}</div>
      <div>${pd ? `<span class="pill paid">✓ Pagata ${esc(pd.quando || "")}</span> ${puoModificare() ? `<button class="btnsm ghost" data-unpay="${z.id}|${chiave}">Annulla</button>` : ""}` : puoModificare() ? `<button class="btnsm" data-pay="${z.id}|${chiave}" ${totale ? "" : "disabled style='opacity:.5'"}>Segna come pagata</button>` : `<span class="pill open">da pagare</span>`}</div>
      ${tp.totale && !pp ? `<div class="avviso">Settimana scorsa (${L.etichettaSettimana(prec)}): ${eur(tp.totale)} ancora da pagare ${puoModificare() ? `<button class="btnsm" data-pay="${z.id}|${prec}" style="margin-left:8px">Segna pagata</button>` : ""}</div>` : ""}
      <details><summary>Dettaglio e storico</summary>${lista.length ? `<div class="rows">${lista.map(p => rigaPagaPulizia(p)).join("")}</div>` : ""}${vistaStorico(z.id)}</details></section>`;
  }).join("");
  return (puoModificare() ? cardContoProspetto() : "") + blocchi + cardControlliSettimana() + cardSignore() + cardOrarioBase();
}
// "68 € di ore standard (8 ore e mezza) + stelle 27 € + 2 controlli 5 € − tagli 1,20 € = 98,80 €"
function rigaConto(t) {
  const pezzi = [`<b>${eur(t.ore)}</b> di ore standard${t.minuti ? ` (${esc(L.testoOre(t.minuti))})` : ""}`];
  if (t.stelle) pezzi.push(`stelle <b>${eur(t.stelle)}</b>`);
  if (t.controlliFatti && t.controlliFatti.n) pezzi.push(`${t.controlliFatti.n} ${t.controlliFatti.n === 1 ? "controllo" : "controlli"} <b>${eur(t.controlliFatti.importo)}</b>${t.controlliFatti.smentiti ? ` (${t.controlliFatti.smentiti} smentit${t.controlliFatti.smentiti === 1 ? "o" : "i"})` : ""}`);
  if (t.bonus && t.bonus.importo) pezzi.push(`bonus <b>${eur(t.bonus.importo)}</b>`);
  let r = pezzi.join(" + ");
  if (t.tagli) r += ` − tagli dei controlli <b>${eur(t.tagli)}</b>`;
  return r + ` = <b>${eur(t.totale)}</b>`;
}
// Una riga della paga: posto, lavoro, ore standard · €, stelle, esito del controllo
function rigaPagaPulizia(p) {
  const e = p.esito;
  const esitoHtml = e ? `<br><span class="small" style="color:${e.esito === "bene" ? "var(--done)" : "var(--warn)"}">Controllo: ${esc(L.nomeEsito(e.esito, S.regole))}${e.recuperato && e.esitoScritto !== e.esito ? " (rifatto in tempo)" : ""}${e.stelleNonFatte.length ? ` · ${e.stelleNonFatte.length} ${e.stelleNonFatte.length === 1 ? "stella non fatta" : "stelle non fatte"} −${eur(e.penaleStelle)}` : ""}</span>` : (p.voto != null ? `<br><span class="muted small">voto ${esc(p.voto)}</span>` : "");
  return `<div class="row"><span><b>${esc(camera(p.camera).nome)}</b> · ${esc(titoloLavoro(p))}<br><span class="muted">${p.minuti ? esc(L.testoOre(p.minuti)) + " · " : ""}${eur(p.importo)}${minutiPulizia(p) != null && p.minuti ? ` <span class="small">(ci ha messo ${esc(L.testoOre(minutiPulizia(p)))})</span>` : ""}${p.extraRifiniture ? ` + ${esc(testoStelleFatte(p))} ${eur(p.extraRifiniture)}` : ""} · ${esc(L.dataBreve(p.data))}${p.ora ? " alle " + L.oraBreve(p.ora) : ""}</span>${p.nonFatte?.length ? `<br><span class="small" style="color:var(--warn)">Non fatto: ${esc(p.nonFatte.map(x => x.testo + (x.motivo ? " (" + x.motivo + ")" : "")).join(", "))}</span>` : ""}${esitoHtml}</span><span class="s done">${eur(p.finale)}</span></div>`;
}
// I controlli della settimana, signora per signora: ricevuti (con gli esiti) e fatti (con i soldi)
function cardControlliSettimana() {
  const chiave = L.settimanaCorrente();
  const righe = signore().map(z => {
    const ricevuti = Object.values(S.controlli).filter(c => c.zonaControllata === z.id && (c.esito || c.voto != null) && (c.settimana || L.chiaveSettimana(c.ora || c.data + "T12:00:00", S.regole.chiusuraPaga)) === chiave);
    const esiti = { bene: 0, cosicosi: 0, male: 0 }; let stelleNo = 0, daRifare = 0;
    for (const c of ricevuti) { const e = L.esitoChePaga(c, S.regole); if (e.esito) esiti[e.esito]++; stelleNo += e.stelleNonFatte.length; if (e.punteggio || e.stelleNonFatte.length) daRifare++; }
    const fatti = L.controlliFattiSettimana(S.controlli, z.id, chiave, S.listino);
    return `<div class="row"><span><b>${esc(SIG(z.id))}</b><br><span class="muted small">controllata ${ricevuti.length} ${ricevuti.length === 1 ? "volta" : "volte"}${ricevuti.length ? `: ${esiti.bene} bene · ${esiti.cosicosi} così così · ${esiti.male} male${stelleNo ? ` · ${stelleNo} ${stelleNo === 1 ? "stella non fatta" : "stelle non fatte"}` : ""}${daRifare ? ` · ${daRifare} da rifare entro sabato alle 14` : ""}` : ""}</span><br><span class="muted small">ha controllato ${fatti.n} ${fatti.n === 1 ? "camera" : "camere"}${fatti.n ? ` · ${eur(fatti.importo)}` : ""}${fatti.smentiti ? ` · ${fatti.smentiti} smentit${fatti.smentiti === 1 ? "a" : "e"} da te` : ""}</span></span></div>`;
  }).join("");
  const l = S.listino, q = l.controlli || {};
  const chi = (z) => esc(SIG(z));
  const regola = Object.entries(q).map(([z, g]) => `${chi(z)}: ${Object.entries(g).filter(([, n]) => n > 0).map(([d, n]) => `${n} ${L.GIORNI[+d]}`).join(", ")}`).join(" · ");
  const mese = L.meseDi(L.oggiISO());
  const pagella = signore().map(z => {
    const ric = Object.values(S.controlli).filter(c => c.zonaControllata === z.id && (c.esito || c.esitoProprietario) && L.meseDi(c.data || "") === mese);
    if (!ric.length) return "";
    const e = { bene: 0, cosicosi: 0, male: 0 }; let stOk = 0, stNo = 0, rif = 0;
    for (const c of ric) { const x = L.esitoChePaga(c, S.regole); e[x.esito]++; const st = c.esitoProprietario != null && c.stelleProprietario ? c.stelleProprietario : (c.stelle || {}); for (const v of Object.values(st)) { if (v && v.ok === true) stOk++; else if (v && v.ok === false) stNo++; } rif += Object.keys(c.rifatti || {}).length; }
    return `<div class="row"><span><b>${esc(SIG(z.id))}</b> · ${esc(L.meseLungo(L.oggiISO()))}<br><span class="muted small">${ric.length} controlli: ${e.bene} bene, ${e.cosicosi} così così, ${e.male} male${stOk + stNo ? ` · stelle: ${stOk} confermate, ${stNo} non fatte` : ""}${rif ? ` · ${rif} rifacimenti` : ""}</span></span><span class="s ${e.male ? "warn" : "done"}">${ric.length ? Math.round(e.bene / ric.length * 100) : 0}% bene</span></div>`;
  }).join("");
  return `<section class="card"><h2 style="margin:0 0 4px">Controlli incrociati</h2><p class="muted small" style="margin:0 0 8px">Le camere le sceglie l'app a sorte la mattina stessa e le dice solo a chi controlla. ${esc(regola)}. Ogni controllo vale ${eur(l.controllo)}; il voto lo fa l'app contando i "no" (0 Bene · 1–2 Così così, −20% · 3 o più Male, −50%); quello che è bocciato si può rifare entro sabato alle 14. Tu puoi rifare qualsiasi controllo dalla camera con "La controllo io": se smentisci un Bene, chi ha controllato perde ${eur(l.controllo)}.</p>
    <div class="rows">${righe}</div>${pagella ? `<div class="floorlabel" style="margin-top:10px">La pagella del mese</div><div class="rows">${pagella}</div>` : ""}</section>`;
}
// I tempi veri misurati dal cronometro, confrontati con l'orario di base: così i minuti standard si tarano sui fatti
function tempiVeri(giorni = 60) {
  const da = L.aggiungiGiorni(L.oggiISO(), -giorni), l = L.listinoCompleto(S.listino), out = {};
  for (const p of Object.values(S.pulizie)) {
    const v = minutiPulizia(p);
    if (p.stato !== "fatta" || v == null || p.data < da || !p.minuti || p.origine === "governante" || p.tipo === "extra") continue;
    const c = camera(p.camera), voce = TIPI_PULIZIA[p.tipo]?.prezzo || p.tipo, k = `${p.camera}|${p.tipo}`;
    const x = out[k] = out[k] || { camera: p.camera, nome: c.nome, tipo: p.tipo, voce, std: Number(p.minuti), veri: [], tariffa: L.tariffaDi(S.listino, c) };
    x.veri.push(v);
  }
  const lista = Object.values(out).filter(x => x.veri.length >= 2).map(x => {
    const ord = [...x.veri].sort((a, b) => a - b), mediano = ord.length % 2 ? ord[(ord.length - 1) / 2] : Math.round((ord[ord.length / 2 - 1] + ord[ord.length / 2]) / 2);
    const prop = Math.max(5, Math.round(mediano / 5) * 5);
    return { ...x, n: x.veri.length, mediano, prop, diff: mediano - x.std, lontano: Math.abs(mediano - x.std) >= Math.max(8, x.std * 0.15) };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  return lista;
}
// Quanto cambierebbe la paga col cronometro, sui tempi già misurati: il numero per decidere con i fatti
function confrontoPaga(giorni = 60) {
  const da = L.aggiungiGiorni(L.oggiISO(), -giorni);
  let std = 0, crono = 0, n = 0, lunghi = 0, corti = 0;
  for (const p of Object.values(S.pulizie)) {
    const v = minutiPulizia(p);
    if (p.stato !== "fatta" || v == null || p.data < da || !p.minuti || p.origine === "governante" || p.tipo === "extra") continue;
    const c = L.pagaCronometro(S.listino, camera(p.camera), p.minuti, v);
    std += L.euroDaMinuti(p.minuti, L.tariffaDi(S.listino, camera(p.camera))); crono += c.importo; n++;
    if (c.strano === "lungo") lunghi++; if (c.strano === "corto") corti++;
  }
  return { n, std: Math.round(std * 100) / 100, crono: Math.round(crono * 100) / 100, diff: Math.round((crono - std) * 100) / 100, lunghi, corti };
}
function cardTempiVeri() {
  const lista = tempiVeri(), mod = puoModificare();
  if (!lista.length) return `<div class="floorlabel" style="margin-top:14px">I tempi veri</div><p class="muted small" style="margin:0">Appena le signore premono "Inizia" e "Fatto", il cronometro misura quanto ci mettono davvero e qui te lo scrivo accanto ai minuti standard: così li tari sui fatti, non a occhio. (Servono almeno due volte sullo stesso posto.)</p>`;
  const riga = (x) => {
    const chiave = x.camera === "stelle" ? "" : (L.listinoCompleto(S.listino).perCasa[x.camera] ? `perCasa.${x.camera}.${x.voce}` : (x.voce === "ripasso" || x.voce === "totale") ? `minuti.${x.voce}.${L.tagliaCamera(S.listino, x.camera)}` : `minuti.${x.voce}`);
    const perCasa = `perCasa.${x.camera}.${x.voce}`;
    return `<div class="row"><span><b>${esc(x.nome)}</b> · ${esc(x.tipo === "ripasso" || x.tipo === "casa" ? "ripasso" : "cambio completo")}<br><span class="muted small">standard ${esc(L.testoOre(x.std))} · davvero ${esc(L.testoOre(x.mediano))} (${x.n} volte${x.veri.length > 2 ? ", valore di mezzo" : ""})${x.diff ? ` · ${x.diff > 0 ? "+" : "−"}${Math.abs(x.diff)} min` : ""}</span></span>${mod && x.lontano ? `<button class="btnsm" data-tara="${esc(perCasa)}|${x.prop}">Metti ${x.prop}′</button>` : `<span class="s ${x.lontano ? "warn" : "done"}">${x.lontano ? "da tarare" : "ok"}</span>`}</div>`;
  };
  const fuori = lista.filter(x => x.lontano).length;
  return `<div class="floorlabel" style="margin-top:14px">I tempi veri (cronometro)</div>
    <p class="muted small" style="margin:0 0 6px">Quanto ci mettono davvero, da "Inizia" a "Fatto", negli ultimi 2 mesi. ${fuori ? `${fuori} ${fuori === 1 ? "posto è lontano" : "posti sono lontani"} dal tempo standard: con un tocco metti il tempo vero (la paga di quel posto cambia di conseguenza).` : "Tutto in linea con l'orario di base."}</p>
    <div class="rows">${lista.slice(0, 12).map(riga).join("")}</div>`;
}
// Paghe → Le signore: chi sono (col loro nome), chi lavora adesso, e le camere di una collaboratrice nuova
function cardSignore() {
  const mod = puoModificare(), sq = squadra(), zone = zoneOrdinate();
  const chiave = L.settimanaCorrente();
  const riga = (z) => {
    const v = sq[z.id] || {}, attiva = v.attiva !== false;
    const t = attiva ? L.totaleSettimana(S.pulizie, z.id, chiave, S.regole, S.controlli, S.listino) : null;
    const sue = (v.camere || []).map(id => camera(id).nome);
    const lav = attiva ? Object.values(S.pulizie).filter(p => p.zona === z.id && p.data >= L.aggiungiGiorni(L.oggiISO(), -1) && p.data <= L.aggiungiGiorni(L.oggiISO(), 6)) : [];
    const camereSett = [...new Set(lav.map(p => camera(p.camera).nome))];
    return `<div class="sig-riga-ed ${attiva ? "" : "spenta"}">
      <div class="sig-riga-top">${avatarZona(z.id, "mini")}<input type="text" value="${esc(v.nome || "")}" placeholder="${esc("Signora " + (z.breve || z.id))}" data-sig-nome="${z.id}" ${mod ? "" : "disabled"} aria-label="Nome">
        <span class="seg"><button aria-pressed="${attiva}" data-sig-attiva="${z.id}|1" ${mod ? "" : "disabled"}>Lavora</button><button aria-pressed="${!attiva}" data-sig-attiva="${z.id}|0" ${mod ? "" : "disabled"}>No</button></span></div>
      ${attiva && mod ? `<div class="sig-capelli">Capelli: ${["castana", "bionda", "mora", "rossa", "grigia"].map(c => `<button class="cap ${c}" aria-pressed="${(v.capelli || "castana") === c}" data-sig-capelli="${z.id}|${c}" title="${c}" aria-label="${c}"></button>`).join("")}</div>` : ""}
      <div class="muted small">${esc(z.nome)}${attiva ? ` · questa settimana ${camereSett.length} ${camereSett.length === 1 ? "posto" : "posti"}${t && t.totale ? ` · ${eur(t.totale)} finora` : ""}` : " · non lavora: le sue camere le fanno le altre"}</div>
      ${attiva && sue.length ? `<div class="muted small">Camere sue: ${esc(sue.join(", "))}</div>` : ""}
      ${attiva && mod ? `<details><summary>Quali camere fa lei</summary><p class="muted small" style="margin:6px 0">Di solito le camere le decide il calendario. Qui si spostano a mano: quelle che segni passano a lei (lista, paga e controlli), dalle prossime pulizie.</p>
        <div class="rows">${S.camere.map(c => { const mia = (v.camere || []).includes(c.id); const altra = signoraDiCamera(c.id); return `<div class="row"><span>${esc(c.nome)}${!mia && altra ? ` <span class="muted small">(di ${esc(SIG(altra))})</span>` : ""}</span><span class="seg"><button aria-pressed="${mia}" data-sig-camera="${z.id}|${c.id}|1">Sua</button><button aria-pressed="${!mia}" data-sig-camera="${z.id}|${c.id}|0">No</button></span></div>`; }).join("")}</div></details>` : ""}
    </div>`;
  };
  const attive = zone.filter(z => (sq[z.id] || {}).attiva !== false).length;
  return `<section class="card signore-card"><h2 style="margin:0 0 4px">Le signore</h2><p class="muted small" style="margin:0 0 10px">Adesso sono ${attive}. Scrivi il loro nome: l'app le chiama così dappertutto (paghe, controlli, messaggi). Se una non lavora più, metti "No". Per una collaboratrice nuova tocca "Aggiungi una signora" e segna le camere che fa lei.</p>
    ${zone.map(riga).join("")}
    ${mod ? `<details style="margin-top:10px"><summary>Aggiungi una signora</summary><form id="formSignora"><div class="campo"><label for="sgNome">Come si chiama</label><input id="sgNome" type="text" placeholder="es. Maria" required></div>
      <p class="muted small" style="margin:0 0 8px">Nasce senza camere: segnale tu qui sotto, oppure lasciale e dalle i lavori a mano. Per farla entrare nell'app serve anche l'accesso (⋯ → Persone: nome per entrare e password).</p>
      <button class="big main" type="submit">Aggiungi</button></form></details>` : ""}</section>`;
}
// Paghe → Orario di base e tariffe: i minuti standard, le tariffe orarie, i lavori fissi, le stelle, i controlli
function cardOrarioBase() {
  const l = S.listino, mod = puoModificare();
  const num = (lab, chiave, val, step = 5, unita = "min") => `<label for="l_${chiave}">${lab}</label><span class="unita"><input id="l_${chiave}" type="number" min="0" step="${step}" value="${val}" data-listino="${chiave}" ${mod ? "" : "disabled"}><small>${unita}</small></span>`;
  const pz = G.prezziStelle(S.gov);
  const rigaStella = (lab, k) => `<label for="ps_${k}">${lab}</label><span class="unita"><input id="ps_${k}" type="number" min="0" step="0.5" value="${pz[k]}" data-prezzo-stella="${k}" ${mod ? "" : "disabled"}><small>€</small></span>`;
  const cam = id => S.camere.find(c => c.id === id) || CAMERE.find(c => c.id === id) || { id, nome: id, tipo: "camera" };
  const esempio = (id, tipo) => { const c = cam(id); const m = L.minutiPulizia(l, c, tipo); return `${esc(c.nome)} ${tipo === "ripasso" || tipo === "casa" ? "ripasso" : "cambio"}: ${esc(L.testoOre(m))} · ${eur(L.prezzoPulizia(l, c, tipo))}`; };
  const giorniSel = (chiave, val) => `<select data-listino-sel="${chiave}" ${mod ? "" : "disabled"}>${[1, 2, 3, 4, 5, 6, 0].map(d => `<option value="${d}" ${+val === d ? "selected" : ""}>${L.GIORNI[d]}</option>`).join("")}</select>`;
  const zoneSel = (chiave, val) => `<select data-listino-sel="${chiave}" ${mod ? "" : "disabled"}>${signore().map(z => `<option value="${z.id}" ${val === z.id ? "selected" : ""}>${esc(SIG(z.id))}</option>`).join("")}</select>`;
  const fissi = (l.fissi || []).map((f, i) => `<div class="row" style="grid-template-columns:1fr auto;gap:6px"><span><b>${esc(f.titolo)}</b><br><span class="muted small">${eur(L.euroDaMinuti(f.minuti, l.tariffe[f.tariffa || "albergo"]))} · ${esc(L.testoOre(f.minuti))}</span></span><span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">${giorniSel(`fissi.${i}.giorno`, f.giorno)}${zoneSel(`fissi.${i}.zona`, f.zona)}<input type="number" min="0" step="5" value="${f.minuti}" data-listino="fissi.${i}.minuti" style="width:72px" ${mod ? "" : "disabled"}><small>min</small></span></div>`).join("");
  return `<section class="card"><h2>Orario di base e tariffe</h2><p class="muted small" style="margin:0 0 10px">Il lavoro normale si paga a ore standard (i tuoi tempi), non a cronometro: ogni pulizia vale i suoi minuti per la tariffa dell'ora. Se cambi qualcosa vale dalle prossime pulizie: quelle già fatte o pagate non cambiano.</p>
    <div class="floorlabel">Tariffa dell'ora</div>
    <div class="listino">${num("Albergo e via Nazario Sauro (Lella e Nicole comprese)", "tariffe.albergo", l.tariffe.albergo, 0.5, "€/ora")}${num("Appartamenti (via Zara, via Trento)", "tariffe.appartamenti", l.tariffe.appartamenti, 0.5, "€/ora")}</div>
    <div class="floorlabel" style="margin-top:14px">Minuti standard · camere dell'albergo</div>
    <div class="listino">${num("Ripasso · camera grande", "minuti.ripasso.G", l.minuti.ripasso.G)}${num("Ripasso · camera piccola", "minuti.ripasso.P", l.minuti.ripasso.P)}${num("Cambio completo · camera grande", "minuti.totale.G", l.minuti.totale.G)}${num("Cambio completo · camera piccola", "minuti.totale.P", l.minuti.totale.P)}${num("Nicole · cambio completo", "perCasa.nicole.totale", l.perCasa.nicole?.totale ?? l.minuti.totale.G)}${num("Nicole · ripasso", "perCasa.nicole.ripasso", l.perCasa.nicole?.ripasso ?? l.minuti.ripasso.G)}${num("Lella · cambio completo", "perCasa.lella.totale", l.perCasa.lella?.totale ?? l.minuti.totale.G)}${num("Lella · ripasso", "perCasa.lella.ripasso", l.perCasa.lella?.ripasso ?? l.minuti.ripasso.G)}</div>
    <p class="muted small" style="margin:6px 0 0">Per esempio: ${esempio("salvatore", "totale")} · ${esempio("aurora", "totale")} · ${esempio("alba", "ripasso")} · ${esempio("nicole", "totale")}.</p>
    <div class="floorlabel" style="margin-top:14px">Minuti standard · appartamenti</div>
    <div class="listino">${num("Via Trento · cambio completo", "perCasa.trento.totale_casa", l.perCasa.trento?.totale_casa ?? l.minuti.totale_casa)}${num("Via Trento · ripasso", "perCasa.trento.casa", l.perCasa.trento?.casa ?? l.minuti.casa)}${num("Via Zara 1° e 2° · cambio completo (due piani)", "perCasa.zara1.totale_casa", l.perCasa.zara1?.totale_casa ?? l.minuti.totale_casa)}${num("Via Zara 1° e 2° · ripasso", "perCasa.zara1.casa", l.perCasa.zara1?.casa ?? l.minuti.casa)}${num("Via Zara piano terra · cambio completo", "perCasa.zarapt.totale_casa", l.perCasa.zarapt?.totale_casa ?? l.minuti.totale_casa)}${num("Via Zara piano terra · ripasso", "perCasa.zarapt.casa", l.perCasa.zarapt?.casa ?? l.minuti.casa)}${num("Pulizia a fondo completa (a camera vuota)", "minuti.fondo", l.minuti.fondo)}</div>
    <p class="muted small" style="margin:6px 0 0">Per esempio: ${esempio("trento", "totale_casa")} · ${esempio("zara1", "totale_casa")} · ${esempio("zarapt", "totale_casa")} · ${esempio("trento", "casa")}.</p>
    <div class="floorlabel" style="margin-top:14px">Lavori fissi della settimana</div>
    <p class="muted small" style="margin:0 0 6px">Pagati a ore standard come il resto (tariffa dell'albergo). Il giorno, la signora e i minuti si cambiano qui.</p>
    <div class="rows">${fissi}</div>
    <div class="floorlabel" style="margin-top:14px">Le stelle</div>
    <p class="muted small" style="margin:0 0 6px">Le fa solo una signora, in tutto l'albergo, per un obiettivo di euro a settimana: oltre quello la governante non propone niente. Il prezzo di una stella dipende da quanto dura.</p>
    <div class="listino">${num("Obiettivo di stelle a settimana", "obiettivoStelle", l.obiettivoStelle, 1, "€")}${rigaStella("Stella fino a 5 minuti", "fino5")}${rigaStella("Stella fino a 10 minuti", "fino10")}${rigaStella("Stella oltre 10 minuti", "oltre10")}</div>
    <div class="row" style="margin-top:6px"><span>Chi fa le stelle in albergo</span>${zoneSel("zonaStelle", l.zonaStelle)}</div>
    <div class="row"><span>Stelle negli appartamenti (le fa chi ci va)</span><span class="seg"><button aria-pressed="${!!l.stelleAppartamenti}" data-listino-flag="stelleAppartamenti|1" ${mod ? "" : "disabled"}>Accese</button><button aria-pressed="${!l.stelleAppartamenti}" data-listino-flag="stelleAppartamenti|0" ${mod ? "" : "disabled"}>Spente</button></span></div>
    <div class="floorlabel" style="margin-top:14px">I controlli</div>
    <div class="listino">${num("Paga per ogni camera controllata", "controllo", l.controllo, 0.5, "€")}${signore().map(z => [5, 6].map(d => num(`${esc(SIG(z.id))} · controlli ${L.GIORNI[d]}`, `controlli.${z.id}.${d}`, (l.controlli[z.id] || {})[d] ?? 0, 1, "camere")).join("")).join("")}</div>
    <div class="floorlabel" style="margin-top:14px">Il cronometro</div>
    <p class="muted small" style="margin:0 0 6px">La signora preme "Inizia" e vede il tempo che passa; quando preme "Fatto" l'app segna quanto ci ha messo davvero. Con <b>ore standard</b> la camera vale sempre i suoi minuti (finisce prima, prende lo stesso). Con <b>a minuto</b> si paga il cronometro: ${eur(l.tariffe.albergo)} l'ora in albergo fanno ${(l.tariffe.albergo / 60).toFixed(2).replace(".", ",")} € al minuto, ${eur(l.tariffe.appartamenti)} l'ora negli appartamenti ${(l.tariffe.appartamenti / 60).toFixed(2).replace(".", ",")} € al minuto. Due reti di sicurezza: non pago mai più del tempo standard più la tolleranza qui sotto (se una scorda il Fatto non costa tre ore), e i tempi troppo corti o troppo lunghi finiscono nella lista qui sotto perché tu li veda.</p>
    <div class="row"><span>Cosa pago</span><span class="seg"><button aria-pressed="${(l.pagaCol || "standard") === "standard"}" data-listino-paga="standard" ${mod ? "" : "disabled"}>Ore standard</button><button aria-pressed="${l.pagaCol === "vero"}" data-listino-paga="vero" ${mod ? "" : "disabled"}>A minuto (cronometro)</button></span></div>
    ${(() => { const c = confrontoPaga(); if (!c.n) return `<p class="muted small" style="margin:6px 0 0">Appena ci sono dei tempi misurati ti scrivo qui quanto cambierebbe pagare a minuto invece che a ore standard, sui tuoi numeri veri.</p>`;
      return `<div class="row one"><span><b>Se pagassi a minuto</b> <span class="muted small">(su ${c.n} pulizie col cronometro, ultimi 2 mesi)</span><br><span class="muted small">ore standard ${eur(c.std)} · a minuto ${eur(c.crono)} → <b style="color:${c.diff > 0 ? "var(--warn)" : "var(--done)"}">${c.diff > 0 ? "+" : ""}${eur(c.diff)}</b>${c.lunghi ? ` · ${c.lunghi} ${c.lunghi === 1 ? "volta è andata" : "volte sono andate"} oltre il tetto` : ""}${c.corti ? ` · ${c.corti} ${c.corti === 1 ? "volta troppo veloce" : "volte troppo veloci"}` : ""}</span></span></div>`; })()}
    <div class="listino" style="margin-top:6px">${num("Tetto: non pago più del tempo standard più…", "tolleranzaCrono", l.tolleranzaCrono, 5, "%")}${num("Segnalami i tempi sotto il…", "sogliaStrano", l.sogliaStrano, 5, "% dello standard")}</div>
    ${(() => { const strani = Object.values(S.pulizie).filter(p => p.strano && p.data >= L.aggiungiGiorni(L.oggiISO(), -30)).sort((a, b) => a.data < b.data ? 1 : -1).slice(0, 6);
      if (!strani.length) return ""; return `<div class="floorlabel" style="margin-top:10px">Tempi strani da guardare</div><div class="rows">${strani.map(p => `<button class="row" data-pul="${esc(p.id)}"><span><b>${esc(camera(p.camera).nome)}</b> · ${esc(L.dataBreve(p.data))}<br><span class="muted small">standard ${esc(L.testoOre(p.minuti))} · ci ha messo ${esc(L.testoOre(minutiPulizia(p)))} · ${p.strano === "lungo" ? "pagato il tetto" : "troppo veloce"}</span></span><span class="s warn">${eur(p.importo)}</span></button>`).join("")}</div>`; })()}
    ${cardTempiVeri()}
    <div class="floorlabel" style="margin-top:14px">Grande o piccola?</div>
    <div class="rows">${S.camere.filter(c => c.tipo !== "casa").map(c => `<div class="row"><span>${esc(c.nome)}</span><span class="seg"><button aria-pressed="${L.tagliaCamera(l, c.id) === "G"}" data-taglia="${c.id}|G" ${mod ? "" : "disabled"}>Grande</button><button aria-pressed="${L.tagliaCamera(l, c.id) === "P"}" data-taglia="${c.id}|P" ${mod ? "" : "disabled"}>Piccola</button></span></div>`).join("")}</div></section>`;
}

// ---- altro ---------------------------------------------------------------------------
function vistaAltro() {
  const r = S.regole;
  return cardStileCasa() + cardIA() + `<section class="card"><h2>Regole delle pulizie</h2>
    <div class="rows">
      <div class="row"><span>Camere: ripasso il <b>${L.GIORNI[(r.camera || [])[0]?.giorno ?? 3]}</b>, pulizia totale il <b>${L.GIORNI[(r.camera || [])[1]?.giorno ?? 5]}</b></span></div>
      <div class="row"><span>Case: pulizia il <b>${L.GIORNI[(r.casa || [])[0]?.giorno ?? 2]}</b>, totale il <b>${L.GIORNI[(r.casa || [])[1]?.giorno ?? 5]}</b></span></div>
      <div class="row"><span>Pulizia totale anche il giorno in cui l'ospite parte</span><span class="seg"><button aria-pressed="${!!r.totaleAllaPartenza}" data-regola="totaleAllaPartenza|1" ${puoModificare() ? "" : "disabled"}>Sì</button><button aria-pressed="${!r.totaleAllaPartenza}" data-regola="totaleAllaPartenza|0" ${puoModificare() ? "" : "disabled"}>No</button></span></div>
      <div class="row"><span>Le signore premono prima INIZIA e poi PULIZIA FINITA (così si vede quanto ci mettono)</span><span class="seg"><button aria-pressed="${r.richiediInizio !== false}" data-regola="richiediInizio|1" ${puoModificare() ? "" : "disabled"}>Sì</button><button aria-pressed="${r.richiediInizio === false}" data-regola="richiediInizio|0" ${puoModificare() ? "" : "disabled"}>No</button></span></div>
      <div class="row"><span>Pulizie preparate in anticipo</span><span class="s">${r.giorniAvanti ?? 14} giorni</span></div>
    </div><p class="muted small" style="margin:10px 0 0">I giorni si cambiano nel file regole.js (o chiedi a Michele).</p></section>
  <section class="card"><h2>L'esito dei controlli</h2><p class="muted small" style="margin:0 0 10px">Il voto lo fa l'app contando i "no" della lista (i quattro punti gravi valgono doppio): 0 punti = Bene, da 1 a 2 = Così così, da 3 in su = Male. Qui si decide quanto si paga quella camera in ogni caso (percentuale delle sue ore standard) e le soglie. Quello che è bocciato si può rifare entro sabato alle 14 senza perdere niente.</p>
    <div class="listino">${(() => { const v = L.votiCompleti(S.regole); return Object.entries(v.esiti).map(([k, e]) => `<label for="v_${k}">${esc(e.nome)}${e.richiamo ? " · con richiamo" : ""}</label><span class="unita"><input id="v_${k}" type="number" min="0" max="100" step="5" value="${e.perc}" data-voto="esito.${k}" ${puoModificare() ? "" : "disabled"}><small>%</small></span>`).join("") + `<label for="v_sc">Così così da … punti</label><span class="unita"><input id="v_sc" type="number" min="1" max="10" step="1" value="${v.sogliaCosicosi ?? 1}" data-voto="sogliaCosicosi" ${puoModificare() ? "" : "disabled"}><small>punti</small></span><label for="v_sm">Male da … punti</label><span class="unita"><input id="v_sm" type="number" min="1" max="20" step="1" value="${v.sogliaMale ?? 3}" data-voto="sogliaMale" ${puoModificare() ? "" : "disabled"}><small>punti</small></span><label for="v_pen">Punti per ogni richiesta del giorno non fatta</label><span class="unita"><input id="v_pen" type="number" min="0" max="10" step="1" value="${v.penalitaRichiesta ?? 3}" data-voto="penalitaRichiesta" ${puoModificare() ? "" : "disabled"}><small>punti</small></span>`; })()}</div></section>
  <section class="card"><h2>Da fare sempre, camera per camera</h2><p class="muted small" style="margin:0 0 8px">Quello che in una camera va fatto a ogni pulizia (es. Salvatore: balcone). La signora lo vede quando apre la camera e deve spuntarlo prima di chiudere; la controllatrice lo verifica e, se manca, il voto scende.</p>
    <div class="rows">${S.camere.map(c => `<div class="row one"><span><b>${esc(c.nome)}</b><br><input type="text" data-keep id="pm_${esc(c.id)}" data-promemoria="${esc(c.id)}" value="${esc(S.promemoria?.[c.id] || "")}" placeholder="niente di particolare" ${puoModificare() ? "" : "disabled"} style="margin-top:4px"></span></div>`).join("")}</div>
    <p class="muted small" style="margin:8px 0 0">Si salva da solo quando esci dalla casella. Più cose: separale con una virgola.</p></section>
  <section class="card"><h2>Guarda l'app come la vedono le signore</h2><p class="muted small" style="margin:0 0 8px">Per provare la loro parte sul tuo telefono, con i dati veri. Attenzione: quello che tocchi lì vale davvero (una camera segnata pulita resta pulita; c'è sempre "Ho sbagliato").</p>
    <div class="pick">${signore().map(z => `<button class="big undo" data-come-signora="${z.id}">👩‍🔧 ${esc(SIG(z.id))}</button>`).join("")}</div>
    <p class="muted small" style="margin:8px 0 0">Per giocare senza toccare niente di vero c'è la modalità prova: apri il link dell'app con <b>?prova=1</b> alla fine.</p></section>
  ${vistaAvvisi()}
  <section class="card"><h2>Aspetto</h2><div class="seg"><button aria-pressed="${S.tema !== "dark"}" data-tema="light">Chiaro</button><button aria-pressed="${S.tema === "dark"}" data-tema="dark">Scuro</button></div></section>
  <section class="card"><h2>Foglio di papà</h2>
    ${S.foglioInfo ? `<p class="muted small" style="margin:0 0 8px">Ultimo foglio: <b>${esc(S.foglioInfo.nome || "")}</b> · ${esc(S.foglioInfo.quando || "")} · ${esc((S.foglioInfo.mesi || []).join(", "))}</p>` : `<p class="muted small" style="margin:0 0 8px">Nessun foglio caricato finora.</p>`}
    ${puoModificare() ? `<label class="big main" style="display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer">📄 Carica il foglio di papà<input id="fileFoglio" type="file" accept=".xlsx,.xls,.xlsm" hidden></label><p class="muted small" style="margin:8px 0 0">Legge il file Excel con regole fisse e ti fa controllare prima di salvare. Niente viene cambiato finché non premi "Salva nel prospetto".</p>` : ""}
  </section>
  ${vistaPersone()}
  ${cardAzzera()}
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
    <div class="due"><div class="campo"><label for="avChat">Numero del gruppo (chat id)</label><input id="avChat" type="text" data-keep value="${esc(a.chat || "")}" placeholder="-100123456789" ${mod ? "" : "disabled"}></div>
      <div class="campo"><label for="avChatMio">La TUA chat col bot (per i messaggi solo a te)</label><input id="avChatMio" type="text" data-keep value="${esc(a.chatMio || "")}" placeholder="scrivi «ciao» al bot, poi cerca" ${mod ? "" : "disabled"}></div></div>
    <div class="due" style="margin-bottom:8px"><div class="campo"><label for="avOra">Piano del mattino dalle ore</label><input id="avOra" type="number" min="0" max="23" value="${a.oraPiano ?? 7}" ${mod ? "" : "disabled"}></div></div>
    ${mod ? `<button class="big undo" data-cerca-gruppo>Cerca il gruppo da solo (dopo aver messo il bot nel gruppo)</button><button class="big undo" data-cerca-mia>Cerca la mia chat (dopo aver scritto «ciao» al bot)</button><div id="gruppiTrovati" class="scelte"></div>` : ""}
    <div class="floorlabel">Chi taggare (nome Telegram con @)</div>
    <div class="due">${signore().map(z => `<div class="campo"><label for="avTag_${z.id}">${esc(SIG(z.id))}</label><input id="avTag_${z.id}" type="text" autocapitalize="none" data-keep value="${esc((a.tag || {})[z.id] || "")}" placeholder="@nome" ${mod ? "" : "disabled"}></div>`).join("")}</div>
    <div class="floorlabel" style="margin-top:8px">Cosa mandare da solo</div>
    <div class="rows">${sw("pianoMattina", "Il piano della giornata, al mattino (la prima volta che un proprietario apre l'app)")}${sw("messaggio", "Il messaggio del giorno, appena lo scrivi")}${sw("dettagli", "I dettagli di una camera, appena li salvi")}${sw("problema", "Quando una signora segnala un problema o una camera non fatta")}${sw("pulita", "Quando una camera viene segnata pulita", false)}${sw("anna", `I consigli di ${esc(nomeGov())}, sul telefono, solo a te (serve la TUA chat qui sopra)`)}</div>
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
  else if (f.tipo === "manutenzione") html = foglioManutenzione(f);
  else if (f.tipo === "nuovoMan") html = foglioNuovoLavoroMan(f);
  else if (f.tipo === "luogoPulito") html = foglioLuogoPulito(f);
  else if (f.tipo === "tabLuogo") html = foglioTabLuogo(f);
  else if (f.tipo === "rivedi") html = foglioRivedi(f);
  else if (f.tipo === "nuovaRegola") html = foglioNuovaRegola(f);
  else if (f.tipo === "superficie") html = foglioSuperficie(f);
  else if (f.tipo === "giro") html = foglioGiro(f);
  else if (f.tipo === "giroScegli") html = `<h3>Giro con la mamma</h3><div class="muted">Scegli il posto che girate insieme, superficie per superficie.</div><div class="pick" style="margin-top:10px">${[...S.camere, ...G.LUOGHI_COMUNI].map(l => `<button class="big undo" data-giro-inizia="${esc(l.id)}">${esc(l.nome)}</button>`).join("")}</div>`;
  else if (f.tipo === "chat") html = foglioChat(f);
  else if (f.tipo === "info") html = `<h3>${esc(f.titolo)}</h3><div class="muted">${esc(f.sotto || "")}</div><div class="note info">${esc(f.testo)}</div>`;
  else if (f.tipo === "foto") html = `<h3>${esc(f.titolo)}</h3><div class="muted">${esc(f.sotto || "")}</div><img src="${f.dati}" alt="Foto" style="width:100%;border-radius:14px;margin-top:10px">`;
  // Se la persona sta scrivendo e arriva un aggiornamento, il testo non deve sparire
  const attivo = document.activeElement, idAttivo = s.contains(attivo) && attivo.id ? attivo.id : null;
  const valori = {}; s.querySelectorAll("textarea[id],input[id]").forEach(e => { if (e.type !== "file") valori[e.id] = { v: e.value, s: e.selectionStart, e: e.selectionEnd }; });
  const pieno = f.tipo === "inizio" || f.tipo === "giro" || f.tipo === "chat";
  s.classList.toggle("pieno", pieno); s.classList.toggle("chat-sheet", f.tipo === "chat");
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
    const nuovo = !!(ctrl && (ctrl.esito || ctrl.esitoProprietario));
    if (nuovo) {
      const e = L.esitoChePaga(ctrl, S.regole);
      const descr = (punti, lista, stelle) => { const no = (lista || []).filter(x => x.richiesta ? !punti[x.id] : punti[x.id] === false).map(x => x.breve || x.testo); const stNo = Object.values(stelle || {}).filter(v => v && v.ok === false).map(v => v.testo); return [no.length ? `non a posto: ${esc(no.join(", "))}` : "tutto a posto", stNo.length ? `stelle non fatte: ${esc(stNo.join(", "))}` : ""].filter(Boolean).join(" · "); };
      if (ctrl.esito) righeVoto.push(`Controllo di ${esc(SIG(ctrl.zonaControllatrice))}${ctrl.ora ? " alle " + L.oraBreve(ctrl.ora) : ""}: <b>${esc(L.nomeEsito(ctrl.esito, S.regole))}</b> (${ctrl.punteggio || 0} punti) · ${descr(ctrl.punti || {}, ctrl.lista, ctrl.stelle)}`);
      if (ctrl.esitoProprietario) righeVoto.push(`Controllo di ${esc(ctrl.proprietario || "Michele")}: <b>${esc(L.nomeEsito(ctrl.esitoProprietario, S.regole))}</b> (${ctrl.punteggioProprietario || 0} punti) · ${descr(ctrl.puntiProprietario || {}, ctrl.lista, ctrl.stelleProprietario)}${ctrl.smentito ? " · <b>smentita</b>: la collega perde la paga di questo controllo" : ""}`);
      if (ctrl.rifatti && Object.keys(ctrl.rifatti).length) righeVoto.push(`Rifatto dalla signora: ${esc(Object.keys(ctrl.rifatti).map(k => k.startsWith("stella:") ? "⭐ " + ((ctrl.stelle || {})[k.slice(7)]?.testo || k) : ((ctrl.lista || []).find(x => x.id === k)?.breve || k)).join(", "))}`);
      righeVoto.push(`Per la paga vale: <b>${esc(L.nomeEsito(e.esito, S.regole))}</b>${e.recuperato && e.esitoScritto !== e.esito ? " (rifatto in tempo)" : ""} → <b>${eur(L.importoFinale(p, S.regole, ctrl))}</b>${e.penaleStelle ? ` (stelle non fatte −${eur(e.penaleStelle)})` : ""}${L.recuperoAperto(p, S.regole) && (e.punteggio || e.stelleNonFatte.length) ? " · si può ancora rifare entro sabato alle 14" : ""}`);
    } else {
      if (ctrl?.voto != null) righeVoto.push(`Voto della controllatrice${ctrl.zonaControllatrice && ctrl.zonaControllatrice !== "proprietario" ? ` (${esc(SIG(ctrl.zonaControllatrice))})` : ""}: <b>${ctrl.voto}</b>${ctrl.nota ? " · " + esc(ctrl.nota) : ""}${ctrl.nonFatte?.length ? ` · non fatto: ${esc(ctrl.nonFatte.join(", "))}` : ""}`);
      if (ctrl?.votoProprietario != null) righeVoto.push(`Controllo di ${esc(ctrl.proprietario || "proprietario")}: <b>${ctrl.votoProprietario}</b>${ctrl.notaProprietario ? " · " + esc(ctrl.notaProprietario) : ""}${ctrl.nonFatteProprietario?.length ? ` · non fatto: ${esc(ctrl.nonFatteProprietario.join(", "))}` : ""}`);
    }
    const nonCorr = !nuovo && L.controlloNonCorrisponde(ctrl, S.regole);
    const votoFinale = !nuovo ? L.votoCheConta(ctrl) : null;
    const fascia = votoFinale != null ? L.fasciaVoto(S.regole, votoFinale) : null;
    controllo = `<div class="floorlabel" style="margin-top:12px">Controllo</div>
      ${righeVoto.length ? `<div class="note ${nonCorr || ctrl?.smentito ? "warn" : "info"}">${righeVoto.join("<br>")}${nonCorr ? "<br><b>Non corrisponde</b>: la controllatrice perde il bonus di questa settimana." : ""}${fascia ? `<br>Paga di questa pulizia: ${fascia.perc}% → <b>${eur(L.importoFinale({ ...p, voto: votoFinale }, S.regole))}</b>${fascia.richiamo ? " · richiamo" : ""}` : ""}</div>` : `<p class="muted small" style="margin:0">Nessun controllo ancora.</p>`}
      ${proprietario() ? `<button class="big undo" data-controlla-prop="${esc(p.id)}">${ctrl?.esitoProprietario || ctrl?.votoProprietario != null ? "Rifai il tuo controllo" : "La controllo io"}</button>` : ""}
      ${sonoControllatrice() && p.zona !== S.utente.zona ? `<button class="big undo" data-controlla="${esc(p.id)}">${ctrl?.esito ? "Rifai il controllo" : "Controlla questa camera"}</button>` : ""}`;
  }
  return `<h3>${esc(c.nome)}</h3><div class="muted">${esc(L.dataLunga(p.data))}${p.ospite ? " · " + esc(p.ospite) : ""}${p.persone ? ` · ${p.persone} ${p.persone === 1 ? "persona" : "persone"}` : ""}</div>
    <span class="kind">${esc(p.titolo)}</span>${p.partenza ? `<span class="kind arrivo">Parte ${esc(L.GIORNI[L.giornoSettimana(p.data)])} ${L.giornoDelMese(p.data)}</span>` : ""}${p.arrivo ? `<span class="kind arrivo">Arriva ${esc(L.GIORNI[L.giornoSettimana(p.data)])} ${L.giornoDelMese(p.data)}</span>` : ""}${!addetta() || p.stato === "fatta" ? `<span class="kind money">${eur(p.importo)}</span>` : ""}
    ${(!p.partenza && p.parteIl && p.parteIl > p.data) || (!p.arrivo && p.prossimoArrivo) ? `<p class="muted small" style="margin:6px 0 0">${!p.partenza && p.parteIl && p.parteIl > p.data ? `Resta fino a <b>${esc(giornoParlato(p.parteIl))}</b>` : ""}${!p.partenza && p.parteIl && p.parteIl > p.data && !p.arrivo && p.prossimoArrivo ? " · " : ""}${!p.arrivo && p.prossimoArrivo ? `Prossimo arrivo <b>${esc(giornoParlato(p.prossimoArrivo))}</b>${p.prossimoNome ? ` (${esc(p.prossimoNome)})` : ""}` : ""}</p>` : ""}
    ${promemoriaCamera(p.camera).length && !proprietario() ? `<div class="note info">Sempre in ${esc(c.nome)}: <b>${esc(promemoriaCamera(p.camera).join(" · "))}</b></div>` : ""}
    ${dettagli}
    ${p.istruzioni ? `<div class="note">${esc(p.istruzioni)}</div>` : ""}
    ${rif && c.tipo === "casa" ? `<div class="note">🗑 Stasera fuori: ${esc(rif.cosa.toUpperCase())}</div>` : ""}
    ${listaGestione(p, passi)}
    ${p.stato === "da_fare" && p.nota ? `<div class="note info">${esc(p.nota)}</div>` : ""}
    ${stato}${controllo}${chiPuo}`;
}

// La lista di oggi vista dalla gestione: righe grandi compatte, stelle con minuti e prezzo, zone comuni, cosa ha spuntato la signora
function listaGestione(p, passi) {
  const l = listaDi(p);
  if (!l) return passi.length ? `<ol class="steps">${passi.map((x, i) => `<li><b>${i + 1}</b><span>${esc(x)}</span></li>`).join("")}</ol>` : "";
  const fatta = p.stato === "fatta", spuntate = new Set(p.spuntate || []), non = Object.fromEntries((p.nonFatte || []).map(x => [x.k, x.motivo || "non fatta"]));
  const segno = r => fatta ? (non[r.k] != null ? `<span style="color:var(--warn)">✕</span>` : spuntate.has(r.k) ? `<span style="color:var(--done)">✓</span>` : `<span class="muted">·</span>`) : (r.tipo === "stella" ? `<span style="color:#C98A00">★</span>` : `<b style="color:var(--accent)">${r.n}</b>`);
  const riga = r => `<li style="${r.tipo === "stella" ? "background:#FFF7DC;color:#3D2F00" : ""}">${segno(r)}<span>${esc(r.testo)}${r.tipo === "stella" && r.stella ? ` <span class="muted small">· ${r.stella.minuti} min · ${eur(r.stella.euro || 0)}${r.stella.luogoNome && r.stella.comune ? " · " + esc(r.stella.luogoNome) : ""}</span>` : r.sotto ? ` <span class="muted small">· ${esc(r.sotto)}</span>` : ""}${non[r.k] ? ` <span class="small" style="color:var(--warn)">non fatta: ${esc(non[r.k])}</span>` : ""}</span></li>`;
  const stelle = l.righe.filter(r => r.tipo === "stella");
  const segnoBlocco = b => fatta ? (non[b.k] != null ? `<span style="color:var(--warn)">✕ non fatto${non[b.k] ? ": " + esc(non[b.k]) : ""}</span>` : spuntate.has(b.k) ? `<span style="color:var(--done)">✓ fatto</span>` : `<span class="muted">·</span>`) : "";
  return `<div class="floorlabel" style="margin-top:12px"><span>La lista di oggi · ${l.righe.length} ${l.righe.length === 1 ? "riga" : "righe"} in ${l.blocchi.length} ${l.blocchi.length === 1 ? "blocco" : "blocchi"} · circa ${l.minuti} min</span><span>${stelle.length ? `${stelle.length} ${stelle.length === 1 ? "stella" : "stelle"} · ${eur(l.euroStelle)}` : "nessuna stella"}</span></div>
    ${l.blocchi.map(b => `<div class="floorlabel" style="margin-top:8px"><span>${esc(b.nome)}</span>${segnoBlocco(b)}</div><ol class="steps" style="gap:4px">${[...b.righe, ...b.stelle].map(riga).join("")}</ol>`).join("")}
    ${l.zona.length ? `<div class="floorlabel"><span>Zone comuni di oggi (alla prima camera della signora)</span><span>${l.euroZona ? eur(l.euroZona) : ""}</span></div><ol class="steps" style="gap:4px">${l.zona.map(riga).join("")}</ol>` : ""}`;
}

const MODO_BREVE = { tecnici: "ditte, stesse persone per mesi", operai: "soggiorni lunghi, cucinano", booking: "Booking, Airbnb, privati" };
function foglioSoggiorno(f) {
  const s = f.id ? S.soggiorni[f.id] : null;
  const d = s || { camera: f.camera, inizio: f.giorno, fine: L.aggiungiGiorni(f.giorno, L.giornoSettimana(f.giorno) === 0 ? 5 : L.giornoSettimana(f.giorno) < 5 ? 5 - L.giornoSettimana(f.giorno) : 7), nome: "", tipo: "ferr", persone: 1, nota: "", notaPrivata: "" };
  const c = camera(d.camera);
  const mod = puoModificare();
  const nomi = [...new Set(soggiorniLista().map(x => x.nome).filter(n => n && n !== "?"))].sort();
  const clienteNoto = d.nome ? L.clienteDi(d.nome, S.clienti) : null, nomeCl = L.nomeCliente(d.nome) || "";
  const modoSog = L.modoSoggiorno(d, S.clienti), ricordaSog = !L.NOMI_MODI.includes(d.modo);
  return `<h3>${esc(c.nome)}</h3><div class="muted">${s ? "Cambia il soggiorno" : "Nuovo arrivo"} · la notte della partenza non si conta</div>
    <form id="formSog">
      <div class="campo"><label for="sNome">Chi c'è (nome o ditta)</label><input id="sNome" type="text" list="nomiNoti" value="${esc(d.nome)}" placeholder="es. Manna" ${mod ? "" : "disabled"} required><datalist id="nomiNoti">${nomi.map(n => `<option value="${esc(n)}">`).join("")}</datalist></div>
      <div class="due"><div class="campo"><label for="sInizio">Arriva il</label><input id="sInizio" type="date" value="${d.inizio}" ${mod ? "" : "disabled"} required></div><div class="campo"><label for="sFine">Parte il</label><input id="sFine" type="date" value="${d.fine}" ${mod ? "" : "disabled"} required></div></div>
      <div class="due"><div class="campo"><label for="sTipo">Tipo</label><select id="sTipo" ${mod ? "" : "disabled"}>${Object.entries(TIPI_OSPITE).map(([k, t]) => `<option value="${k}" ${d.tipo === k ? "selected" : ""}>${esc(t.nome)}</option>`).join("")}</select></div><div class="campo"><label for="sPers">Persone</label><input id="sPers" type="number" min="1" max="10" value="${d.persone || 1}" ${mod ? "" : "disabled"}></div></div>
      <div class="campo"><label>Tipo di ospite per le pulizie</label><div class="modi-scelta">${L.NOMI_MODI.map(k => `<button type="button" class="modo-btn modo-${k}" aria-pressed="${modoSog === k}" data-sog-modo="${k}" ${mod ? "" : "disabled"}><b>${esc(G.MODI[k].nome)}</b><span>${esc(MODO_BREVE[k])}</span></button>`).join("")}</div>
        <div class="seg" style="margin-top:8px;display:flex"><button type="button" aria-pressed="${ricordaSog}" data-sog-ricorda="1" ${mod ? "" : "disabled"}>Sempre per ${esc(nomeCl || "questo nome")}</button><button type="button" aria-pressed="${!ricordaSog}" data-sog-ricorda="0" ${mod ? "" : "disabled"}>Solo per questo soggiorno</button></div>
        <p class="muted small" style="margin:6px 0 0">${clienteNoto ? `Per ${esc(clienteNoto.nome || nomeCl)} l'app ricorda: <b>${esc(G.MODI[clienteNoto.modo]?.nome || clienteNoto.modo)}</b>.` : "Decide i ritmi delle rifiniture e le stelle della camera finché c'è questo ospite."}${/zara1|zara2/.test(c.id) ? " In via Zara 1° e 2° chi è Tecnici altrove conta come Operai." : ""}</p></div>
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
  document.querySelectorAll("[data-vista]").forEach(b => b.onclick = () => { S.vista = b.dataset.vista; if (b.classList.contains("man-plate") || b.classList.contains("nonna-link")) window.scrollTo(0, 0); disegna(); });
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
  document.querySelectorAll("[data-cerca-mia]").forEach(b => b.onclick = () => cercaGruppoTelegram(true));
  document.querySelectorAll("[data-prova-telegram]").forEach(b => b.onclick = async () => { await salvaAvvisi(); inviaTelegram(`✅ Prova riuscita: gli avvisi delle pulizie arrivano qui.\n${zoneOrdinate().map(z => tagZona(z.id)).join(" · ")}`, null, { manuale: true }); });
  document.querySelectorAll("[data-prova-piano]").forEach(b => b.onclick = async () => { await salvaAvvisi(); inviaTelegram(testoPianoGiorno(L.oggiISO()), null, { manuale: true }); });
  document.querySelectorAll("[data-stato-diretto]").forEach(b => b.onclick = () => { const [id, st] = b.dataset.statoDiretto.split("|"); const p = S.pulizie[id]; if (!p) return; if (st === "fatta") segnaFatta(id); else cambiaStato(p, st, ""); });
  document.querySelectorAll("[data-altri-giorni]").forEach(b => b.onclick = () => { S.mostraGiorni = !S.mostraGiorni; if (!S.mostraGiorni) { S.giorno = L.oggiISO(); S.settimana = L.lunediDi(S.giorno); } disegna(); });
  document.querySelectorAll("[data-controlla]").forEach(b => b.onclick = () => apriFoglio({ tipo: "controllo", id: b.dataset.controlla, modo: "collega" }));
  document.querySelectorAll("[data-listino-paga]").forEach(b => b.onclick = () => { const l = JSON.parse(JSON.stringify(S.listino)); l.pagaCol = b.dataset.listinoPaga; salvaListino(l); toast(b.dataset.listinoPaga === "vero" ? "Da ora pago il tempo vero del cronometro" : "Pago le ore standard"); });
  document.querySelectorAll("[data-tara]").forEach(b => b.onclick = () => { const [chiave, v] = b.dataset.tara.split("|"); const l = JSON.parse(JSON.stringify(S.listino)); const parti = chiave.split("."); let o = l; for (let j = 0; j < parti.length - 1; j++) o = o[parti[j]] = o[parti[j]] || {}; o[parti[parti.length - 1]] = Number(v); salvaListino(l); toast(`Messo ${v} minuti: la paga di quel posto si aggiorna dalle prossime pulizie`); });
  document.querySelectorAll("[data-sig-nome]").forEach(i => i.onchange = () => salvaSquadra(i.dataset.sigNome, { nome: i.value.trim() }));
  document.querySelectorAll("[data-sig-capelli]").forEach(b => b.onclick = () => { const [z, c] = b.dataset.sigCapelli.split("|"); salvaSquadra(z, { capelli: c }); });
  document.querySelectorAll("[data-sig-attiva]").forEach(b => b.onclick = () => { const [z, v] = b.dataset.sigAttiva.split("|"); salvaSquadra(z, { attiva: v === "1" }); });
  document.querySelectorAll("[data-sig-camera]").forEach(b => b.onclick = () => { const [z, c, v] = b.dataset.sigCamera.split("|"); const sq = squadra(); const cur = new Set((sq[z]?.camere) || []); if (v === "1") cur.add(c); else cur.delete(c); salvaSquadra(z, { camere: [...cur] }); });
  const fs = $("#formSignora");
  if (fs) fs.onsubmit = (e) => { e.preventDefault(); const nome = $("#sgNome").value.trim(); if (!nome) return; const id = "s" + (Date.now() % 100000); const ord = Math.max(...zoneOrdinate().map(z => z.ordine || 0), 0) + 1;
    const zone = { ...S.zone, [id]: { nome, breve: nome, ordine: ord } };
    S.db.salva("impostazioni", "camere", { zone }, true).then(() => salvaSquadra(id, { nome, attiva: true, camere: [] })).then(() => toast(`${nome} aggiunta: ora segna le camere che fa lei`)).catch(erroreScrittura); };
  document.querySelectorAll("[data-stella-togli]").forEach(b => b.onclick = async () => { const w = L.settimanaCorrente(); const cur = (S.gov && S.gov.stelleEscluse) || {}; const lista = [...new Set([...(cur[w] || []), b.dataset.stellaTogli])]; await salvaGov({ stelleEscluse: { ...cur, [w]: lista } }); toast("Tolta: al suo posto entra la prossima in ritardo"); });
  document.querySelectorAll("[data-stella-ripristina]").forEach(b => b.onclick = async () => { const w = L.settimanaCorrente(); const cur = (S.gov && S.gov.stelleEscluse) || {}; await salvaGov({ stelleEscluse: { ...cur, [w]: [] } }); toast("Rimesse"); });
  document.querySelectorAll("[data-rifatto]").forEach(i => i.onchange = async () => { const file = i.files && i.files[0]; if (!file) return; const sep = i.dataset.rifatto.indexOf("|"), id = i.dataset.rifatto.slice(0, sep), voce = i.dataset.rifatto.slice(sep + 1); toast("Preparo la foto…"); try { const dataUrl = await rimpicciolisciFoto(file); await segnaRifatto(id, voce, dataUrl); } catch (e) { toast("Non riesco a leggere la foto"); } });
  document.querySelectorAll("[data-controllatrice-sel]").forEach(e => e.onchange = () => { const chiave = L.settimanaCorrente(); const imp = { ...(S.impControlli || {}) }; imp.settimane = { ...(imp.settimane || {}), [chiave]: e.value }; imp.attuale = e.value; imp.settimana = chiave; S.db.salva("impostazioni", "controlli", imp).then(() => toast("Controllatrice cambiata")).catch(erroreScrittura); });
  document.querySelectorAll("[data-sog]").forEach(b => b.onclick = () => apriFoglio({ tipo: "soggiorno", id: b.dataset.sog }));
  document.querySelectorAll("[data-cella]").forEach(b => b.onclick = () => { if (!puoModificare()) return; const [cam, g] = b.dataset.cella.split("|"); const occ = L.ospiteIl(soggiorniLista(), cam, g); if (occ) apriFoglio({ tipo: "soggiorno", id: occ.id }); else apriFoglio({ tipo: "soggiorno", camera: cam, giorno: g }); });
  document.querySelectorAll("[data-nota]").forEach(b => b.onclick = () => apriFoglio({ tipo: "nota", id: b.dataset.nota }));
  document.querySelectorAll("[data-nuova-nota]").forEach(b => b.onclick = () => apriFoglio({ tipo: "nota", giorno: L.oggiISO() }));
  document.querySelectorAll("[data-nuovo-lavoro]").forEach(b => b.onclick = () => apriFoglio({ tipo: "nuovoLavoro", giorno: S.giorno }));
  document.querySelectorAll("[data-nuovo-lavoro-zona]").forEach(b => b.onclick = () => apriFoglio({ tipo: "nuovoLavoro", giorno: S.giorno < S.sigSett || S.giorno > L.aggiungiGiorni(S.sigSett, 6) ? S.sigSett : S.giorno, camera: camereZona(b.dataset.nuovoLavoroZona)[0]?.id }));
  document.querySelectorAll("[data-signora]").forEach(b => b.onclick = () => { S.sigZona = b.dataset.signora; S.sigSett = L.lunediDi(S.giorno); S.vista = "signora"; window.scrollTo(0, 0); disegna(); });
  document.querySelectorAll("[data-sig-sett]").forEach(b => b.onclick = () => { S.sigSett = L.aggiungiGiorni(S.sigSett, 7 * Number(b.dataset.sigSett)); disegna(); });
  document.querySelectorAll("[data-whatsapp-settimana]").forEach(b => b.onclick = () => apriWhatsApp(testoPianoSettimana(b.dataset.whatsappSettimana, S.sigSett)));
  document.querySelectorAll("[data-man]").forEach(b => b.onclick = () => apriFoglio({ tipo: "manutenzione", id: b.dataset.man }));
  document.querySelectorAll("[data-nuovo-man]").forEach(b => b.onclick = () => apriFoglio({ tipo: "nuovoMan" }));
  // la governante
  document.querySelectorAll("[data-gov-tab]").forEach(b => b.onclick = () => { S.govTab = b.dataset.govTab; disegna(); });
  collegaIA();
  document.querySelectorAll("[data-chat-apri]").forEach(b => b.onclick = () => apriFoglio({ tipo: "chat" }));
  document.querySelectorAll("[data-spesa-fatto]").forEach(b => b.onclick = () => { const voci = { ...((S.spesa && S.spesa.voci) || {}) }; if (voci[b.dataset.spesaFatto]) voci[b.dataset.spesaFatto] = { ...voci[b.dataset.spesaFatto], fatto: true, fattoIl: L.oggiISO() }; salvaSpesa({ voci }).then(() => toast("Segnato come comprato")); });
  document.querySelectorAll("[data-gov-freno-off]").forEach(b => b.onclick = () => salvaGov({ freno: null }).then(() => toast("Freno tolto: il nascosto torna nelle stelle")));
  document.querySelectorAll("[data-chat-auto-off]").forEach(b => b.onclick = () => { const auto = { ...(S.chat.automatiche || {}) }; delete auto[b.dataset.chatAutoOff]; salvaChat({ ...S.chat, automatiche: auto }).then(() => toast("Da adesso te lo chiedo di nuovo")); });
  document.querySelectorAll("[data-gov-sett]").forEach(b => b.onclick = () => { S.govSett = L.aggiungiGiorni(S.govSett, 7 * Number(b.dataset.govSett)); disegna(); });
  const trovaProposta = (id) => proposteGov(S.govSett).proposte.find(c => c.id === id);
  document.querySelectorAll("[data-gov-ok]").forEach(b => b.onclick = () => { const c = trovaProposta(b.dataset.govOk); if (c) accettaProposte([c]); });
  document.querySelectorAll("[data-gov-tutto]").forEach(b => b.onclick = async () => { const r = proposteGov(S.govSett); if (await chiedi(`Metto tutti e ${r.proposte.length} i lavori nelle settimane delle signore?`, { si: "Sì, va bene a tutto" })) accettaProposte(r.proposte); });
  document.querySelectorAll("[data-gov-dopo]").forEach(b => b.onclick = () => { const c = trovaProposta(b.dataset.govDopo); if (c) rinviaProposta(c, "dopo"); });
  document.querySelectorAll("[data-gov-no]").forEach(b => b.onclick = () => { const c = trovaProposta(b.dataset.govNo); if (c) rinviaProposta(c, "no"); });
  document.querySelectorAll("[data-gov-auto]").forEach(b => b.onclick = () => salvaGov({ soglie: { ...soglieGov(), automatico: b.dataset.govAuto === "1" } }).then(() => { autoFatto = ""; governanteAutomatica(); }));
  document.querySelectorAll("[data-gov-soglia]").forEach(b => b.onclick = () => { const [k, d] = b.dataset.govSoglia.split("|"); const sg = soglieGov(); const lim = { camereSettimana: [1, 5], zonaMinuti: [5, 60], freddoGradi: [5, 18] }[k] || [0, 999]; const v = Math.min(lim[1], Math.max(lim[0], (sg[k] || 0) + Number(d))); salvaGov({ soglie: { ...sg, [k]: v } }); });
  // i tre modi: ritmi (+ = più spesso), budget dei minuti e tetto delle stelle, per modo
  document.querySelectorAll("[data-gov-modo-k]").forEach(b => b.onclick = () => { const [k, campo, d] = b.dataset.govModoK.split("|"); const v = G.modiDi(S.gov)[k][campo]; let i = G.MOLTIPLICATORI.indexOf(v); if (i < 0) i = 2; i = Math.min(G.MOLTIPLICATORI.length - 1, Math.max(0, i - Number(d))); salvaModo(k, { [campo]: G.MOLTIPLICATORI[i] }); });
  document.querySelectorAll("[data-gov-modo-budget]").forEach(b => b.onclick = () => { const [k, fascia, d] = b.dataset.govModoBudget.split("|"); const v = G.modiDi(S.gov)[k].budget[fascia]; salvaModo(k, { budget: { [fascia]: Math.min(60, Math.max(0, v + Number(d))) } }); });
  document.querySelectorAll("[data-gov-modo-stelle]").forEach(b => b.onclick = () => { const [k, fascia, d] = b.dataset.govModoStelle.split("|"); const v = G.modiDi(S.gov)[k].stelle[fascia]; salvaModo(k, { stelle: { [fascia]: Math.min(G.STELLE_MAX[fascia], Math.max(0, v + Number(d))) } }); });
  document.querySelectorAll("[data-gov-modo-reset]").forEach(b => b.onclick = () => { const modi = { ...((S.gov && S.gov.modi) || {}) }; delete modi[b.dataset.govModoReset]; salvaGov({ modi }).then(() => toast(`${G.MODI[b.dataset.govModoReset].nome}: valori di partenza`)); });
  document.querySelectorAll("[data-regime]").forEach(b => b.onclick = () => { const modo = b.dataset.regime; const r = { ...S.regole, regime: modo === "auto" ? { modo: "auto" } : { modo, dal: L.oggiISO() } }; S.db.salva("impostazioni", "regole", r).then(() => toast(modo === "auto" ? "Stagione automatica dalle date" : modo === "estate" ? "Estate da oggi: le pulizie seguono arrivi e partenze" : "Inverno da oggi: tornano i giorni fissi")).catch(erroreScrittura); });
  document.querySelectorAll("[data-gov-meteo-pioggia]").forEach(b => b.onclick = () => { const on = b.dataset.govMeteoPioggia === "1"; const meteo = { ...((S.gov && S.gov.meteo) || {}) }; const oggi = L.oggiISO(); if (on) { meteo.pioggia = L.aggiungiGiorni(oggi, 2); meteo.vento = L.aggiungiGiorni(oggi, 2); meteo.umidita = L.aggiungiGiorni(oggi, 3); } else { delete meteo.pioggia; delete meteo.vento; delete meteo.umidita; } salvaGov({ meteo }).then(() => toast(on ? "Segnato: per due giorni esterni e scarichi entrano nelle liste, antimuffa per tre" : "Tolto")); });
  document.querySelectorAll("[data-gov-meteo-stagione]").forEach(b => b.onclick = async () => { const scelta = await scegliTra("Che tempo arriva?", [["freddo", "Arriva il freddo"], ["caldo", "Arriva il caldo"], ["", "Né l'uno né l'altro (spegni)"]]); if (scelta === null) return; const meteo = { ...((S.gov && S.gov.meteo) || {}) }; delete meteo.freddo; delete meteo.caldo; if (scelta) meteo[scelta] = L.aggiungiGiorni(L.oggiISO(), 7); salvaGov({ meteo }).then(() => toast(scelta ? "Segnato: per una settimana coperte e trapuntine entrano nelle liste" : "Tolto")); });
  document.querySelectorAll("[data-gov-attiva]").forEach(b => b.onclick = () => { const [id, v] = b.dataset.govAttiva.split("|"); const regole = { ...(S.gov?.regole || {}) }; regole[id] = { ...(regole[id] || {}), attiva: v === "1" }; salvaGov({ regole }); });
  document.querySelectorAll("[data-gov-ogni]").forEach(b => b.onclick = () => { const [id, d] = b.dataset.govOgni.split("|"); const r = regoleGov().find(x => x.id === id) || G.CATALOGO.find(x => x.id === id) || (S.gov?.personali || {})[id]; if (!r) return; const sc = G.SCALA_OGNI.filter(x => x >= 3.5); let i = sc.findIndex(x => x >= r.ogni); if (i < 0) i = sc.length - 1; i = Math.min(sc.length - 1, Math.max(0, i - Number(d))); const regole = { ...(S.gov?.regole || {}) }; regole[id] = { ...(regole[id] || {}), ogni: sc[i] }; salvaGov({ regole }); });
  document.querySelectorAll("[data-gov-cancella-regola]").forEach(b => b.onclick = async () => { const id = b.dataset.govCancellaRegola; if (await chiedi("Cancello questa regola?", { si: "Sì, cancella", pericolo: true })) { const personali = { ...(S.gov?.personali || {}) }; delete personali[id]; salvaGov({ personali }); } });
  document.querySelectorAll("[data-gov-nuova-regola]").forEach(b => b.onclick = () => apriFoglio({ tipo: "nuovaRegola" }));
  document.querySelectorAll("[data-gov-flag]").forEach(b => b.onclick = () => { const [k, cam, v] = b.dataset.govFlag.split("|"); const f = { ...(flagsGov()[k] || {}) }; if (v === "1") f[cam] = true; else delete f[cam]; salvaGov({ [k]: f }); });
  document.querySelectorAll("[data-gov-luogo]").forEach(b => b.onclick = () => apriFoglio({ tipo: "luogoPulito", luogo: b.dataset.govLuogo }));
  document.querySelectorAll("[data-gov-rivedi]").forEach(b => b.onclick = () => apriFoglio({ tipo: "rivedi", id: b.dataset.govRivedi }));
  document.querySelectorAll("[data-gov-materiale]").forEach(sel => sel.onchange = () => { const [luogo, tipo] = sel.dataset.govMateriale.split("|"); const materiali = { ...((S.gov && S.gov.materiali) || {}) }; materiali[luogo] = { ...(materiali[luogo] || {}), [tipo]: sel.value }; salvaGov({ materiali }); });
  document.querySelectorAll("[data-gov-prova90]").forEach(b => b.onclick = () => { S.tab.prova = !S.tab.prova; disegna(); });
  document.querySelectorAll("[data-tab-vista]").forEach(b => b.onclick = () => { S.tab.vista = b.dataset.tabVista; disegna(); });
  document.querySelectorAll("[data-tab-zona]").forEach(b => b.onclick = () => { S.tab.zona = b.dataset.tabZona; disegna(); });
  document.querySelectorAll("[data-tab-rosse]").forEach(b => b.onclick = () => { S.tab.soloRosse = b.dataset.tabRosse === "1"; disegna(); });
  document.querySelectorAll("[data-tab-regola]").forEach(sel => sel.onchange = () => { S.tab.regola = sel.value; disegna(); });
  document.querySelectorAll("[data-tab-apri-regola]").forEach(b => b.onclick = () => { S.tab.regola = b.dataset.tabApriRegola; S.tab.vista = "regole"; S.tab.soloRosse = true; disegna(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-tab-luogo]").forEach(b => b.onclick = () => apriFoglio({ tipo: "tabLuogo", luogo: b.dataset.tabLuogo }));
  document.querySelectorAll("#app [data-gov-fatto]").forEach(b => b.onclick = async () => { const [regola, luogo, zona] = b.dataset.govFatto.split("|"); await registraFatto(regola, luogo, zona, L.oggiISO()); toast("Segnato come fatto oggi"); disegna(); });
  document.querySelectorAll("[data-superficie]").forEach(b => b.onclick = () => apriFoglio({ tipo: "superficie", id: b.dataset.superficie, tipoSup: b.dataset.tipo }));
  document.querySelectorAll("[data-giro-scegli]").forEach(b => b.onclick = () => apriFoglio({ tipo: "giroScegli" }));
  document.querySelectorAll("[data-board]").forEach(b => b.onclick = () => { S.board.modo = b.dataset.board; if (S.board.modo !== "mese") S.board.inizio = L.lunediDi(S.board.inizio); disegna(); });
  document.querySelectorAll("[data-boardnav]").forEach(b => b.onclick = () => { const n = Number(b.dataset.boardnav); if (S.board.modo !== "mese") S.board.inizio = L.aggiungiGiorni(S.board.inizio, 7 * n); else { const d = L.daISO(L.primoDelMese(S.board.inizio)); d.setUTCMonth(d.getUTCMonth() + n); S.board.inizio = L.aISO(d); } caricaStorico(); disegna(); });
  document.querySelectorAll("[data-pay]").forEach(b => b.onclick = () => { const [z, k] = b.dataset.pay.split("|"); segnaPagata(z, k, true); });
  document.querySelectorAll("[data-unpay]").forEach(b => b.onclick = () => { const [z, k] = b.dataset.unpay.split("|"); segnaPagata(z, k, false); });
  document.querySelectorAll("[data-taglia]").forEach(b => b.onclick = () => { const [cam, t] = b.dataset.taglia.split("|"); const l = JSON.parse(JSON.stringify(S.listino)); l.taglia[cam] = t; salvaListino(l); });
  document.querySelectorAll("[data-prezzo-stella]").forEach(i => i.onchange = () => { const k = i.dataset.prezzoStella; const v = Math.max(0, Number(i.value) || 0); salvaGov({ prezziStelle: { ...G.prezziStelle(S.gov), [k]: v } }).then(() => toast("Prezzo delle stelle salvato: i costi dei livelli sono aggiornati")); });
  document.querySelectorAll("[data-listino]").forEach(i => i.onchange = () => { const l = JSON.parse(JSON.stringify(S.listino)); const v = Math.max(0, Number(i.value) || 0); const parti = i.dataset.listino.split("."); let o = l; for (let j = 0; j < parti.length - 1; j++) o = o[parti[j]] = o[parti[j]] || {}; o[parti[parti.length - 1]] = v; salvaListino(l); });
  document.querySelectorAll("[data-listino-sel]").forEach(i => i.onchange = () => { const l = JSON.parse(JSON.stringify(S.listino)); const parti = i.dataset.listinoSel.split("."); let o = l; for (let j = 0; j < parti.length - 1; j++) o = o[parti[j]] = o[parti[j]] || {}; const v = i.value; o[parti[parti.length - 1]] = /^\d+$/.test(v) && parti[parti.length - 1] === "giorno" ? Number(v) : v; salvaListino(l); });
  document.querySelectorAll("[data-listino-flag]").forEach(b => b.onclick = () => { const [k, v] = b.dataset.listinoFlag.split("|"); const l = JSON.parse(JSON.stringify(S.listino)); l[k] = v === "1"; salvaListino(l); });
  document.querySelectorAll("[data-voto]").forEach(i => i.onchange = () => { const v = L.votiCompleti(S.regole); const k = i.dataset.voto; const n = Math.max(0, Number(i.value) || 0); const nuovi = JSON.parse(JSON.stringify(v)); if (k.startsWith("esito.")) nuovi.esiti[k.slice(6)].perc = n; else if (k === "bonusControllatrice" || k === "penalitaRichiesta" || k === "sogliaCosicosi" || k === "sogliaMale") nuovi[k] = n; else if (nuovi[k] && typeof nuovi[k] === "object") nuovi[k].perc = n; const r = { ...S.regole, voti: nuovi }; S.db.salva("impostazioni", "regole", r).then(() => toast("Regola salvata")).catch(erroreScrittura); });
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
  avviaCronometri();
  if (S.foglio && S.foglio.tipo === "chat") collegaChat();
  const f = S.foglio; if (!f) return;
  document.querySelectorAll("[data-chiudi]").forEach(b => b.onclick = chiudiFoglio);
  document.querySelectorAll("[data-rif-no]").forEach(b => b.onclick = async () => { const [id, regola, luogo] = b.dataset.rifNo.split("|"); const p = S.pulizie[id]; if (!p) return; const stella = rifinitureDi(p).find(r => r.regola === regola && (r.luogo || p.camera) === luogo) || null; const motivo = await scegliMotivoRifinitura(stella); if (motivo) saltaRifinitura(p, regola, luogo, motivo); });
  document.querySelectorAll("[data-giro-inizia]").forEach(b => b.onclick = () => iniziaGiro(b.dataset.giroInizia));
  if (f.tipo === "giro") {
    document.querySelectorAll("[data-giro-ce]").forEach(b => b.onclick = () => { S.giro.viste++; S.giro.i++; S.giro.manca = false; disegnaFoglio(); });
    document.querySelectorAll("[data-giro-manca]").forEach(b => b.onclick = () => { S.giro.manca = true; disegnaFoglio(); setTimeout(() => $("#giCosa")?.focus(), 50); });
    document.querySelectorAll("[data-giro-annulla-manca]").forEach(b => b.onclick = () => { S.giro.manca = false; disegnaFoglio(); });
    document.querySelectorAll("[data-giro-aggiungi]").forEach(b => b.onclick = giroAggiungi);
    document.querySelectorAll("[data-giro-salta-oggetto]").forEach(b => b.onclick = () => { const g = S.giro; const o = g.lista[g.i].oggetto, t = g.lista[g.i].tipo; while (g.i < g.lista.length && g.lista[g.i].oggetto === o && g.lista[g.i].tipo === t) g.i++; g.manca = false; disegnaFoglio(); });
    document.querySelectorAll("[data-giro-fine]").forEach(b => b.onclick = giroFine);
  }
  if (f.tipo === "superficie") document.querySelectorAll("[data-gov-regola-superficie]").forEach(b => b.onclick = () => { const [tipo, sid, oggetto, nome] = b.dataset.govRegolaSuperficie.split("|"); apriFoglio({ tipo: "nuovaRegola", superficie: sid, tipoSup: tipo, oggetto, nomeSup: nome }); });
  if (f.tipo === "nuovaRegola") { const fr = $("#formRegola"); if (fr) fr.onsubmit = (e) => { e.preventDefault(); salvaNuovaRegola(); }; }
  if (f.tipo === "rivedi") {
    document.querySelectorAll("[data-gov-rivedi-ok]").forEach(b => b.onclick = () => salvaRivista(b.dataset.govRivediOk, null));
    document.querySelectorAll("[data-gov-rivedi-salva]").forEach(b => b.onclick = () => salvaRivista(b.dataset.govRivediSalva, $("#rvCome")?.value || ""));
    document.querySelectorAll("[data-gov-rivedi-base]").forEach(b => b.onclick = async () => { const id = b.dataset.govRivediBase; const regole = { ...((S.gov && S.gov.regole) || {}) }; if (regole[id]) { regole[id] = { ...regole[id] }; delete regole[id].come; } const riviste = { ...((S.gov && S.gov.riviste) || {}) }; if (riviste[id]) riviste[id] = { ...riviste[id], cambiata: false }; chiudiFoglio(); await salvaGov({ regole, riviste }); toast("Rimesso il testo di prima"); });
  }
  if (f.tipo === "luogoPulito" || f.tipo === "tabLuogo") document.querySelectorAll("[data-gov-fatto]").forEach(b => b.onclick = async () => { const [regola, luogo, zona] = b.dataset.govFatto.split("|"); await registraFatto(regola, luogo, zona, L.oggiISO()); toast("Segnato come fatto oggi"); disegna(); disegnaFoglio(); });
  if (f.tipo === "manutenzione" || f.tipo === "nuovoMan") {
    const fm = $("#formMan"); if (fm) fm.onsubmit = (e) => { e.preventDefault(); salvaNuovoLavoroMan(); };
    document.querySelectorAll("[data-man-riparato]").forEach(b => b.onclick = () => { aggiornaManutenzione(b.dataset.manRiparato, { stato: "fatto", fatto: S.db.adesso(), fattoDa: S.utente.nome || "", nota: $("#manNota")?.value.trim() ?? S.manutenzione[b.dataset.manRiparato]?.nota ?? "" }, "Segnato come fatto"); chiudiFoglio(); });
    document.querySelectorAll("[data-man-riapri]").forEach(b => b.onclick = () => { aggiornaManutenzione(b.dataset.manRiapri, { stato: "aperto", fatto: null, fattoDa: "" }, "Riaperto"); chiudiFoglio(); });
    document.querySelectorAll("[data-man-salva-nota]").forEach(b => b.onclick = () => aggiornaManutenzione(b.dataset.manSalvaNota, { nota: $("#manNota")?.value.trim() || "" }, "Note salvate"));
    document.querySelectorAll("[data-man-cancella]").forEach(b => b.onclick = async () => { const id = b.dataset.manCancella; if (await chiedi("Cancello questa voce dai lavori? (La pulizia e la foto restano.)", { si: "Sì, cancella", pericolo: true })) { delete S.manutenzione[id]; chiudiFoglio(); disegna(); try { await S.db.cancella("manutenzione", id); } catch (e) { erroreScrittura(e); } } });
    document.querySelectorAll(".sheet [data-pul]").forEach(b => b.onclick = () => apriFoglio({ tipo: "pulizia", id: b.dataset.pul }));
  }
  if (f.tipo === "controllo") {
    const ridisegna = () => { const y = document.querySelector(".sheet")?.scrollTop || 0; disegnaFoglio(); const sh = document.querySelector(".sheet"); if (sh) sh.scrollTop = y; };
    document.querySelectorAll("[data-punto-si]").forEach(b => b.onclick = () => { f.punti = { ...(f.punti || {}) }; f.punti[b.dataset.puntoSi] = true; ridisegna(); });
    document.querySelectorAll("[data-punto-no]").forEach(b => b.onclick = () => { f.punti = { ...(f.punti || {}) }; f.punti[b.dataset.puntoNo] = false; ridisegna(); });
    document.querySelectorAll("[data-stella-si]").forEach(b => b.onclick = () => { const st = stelleDaControllare(S.pulizie[f.id] || S.fattiAltrui[f.id]).find(x => x.k === b.dataset.stellaSi); f.stelle = { ...(f.stelle || {}), [b.dataset.stellaSi]: { ok: true, euro: st ? st.euro : 0, testo: st ? st.nome : "" } }; ridisegna(); });
    document.querySelectorAll("[data-stella-no]").forEach(b => b.onclick = () => { const st = stelleDaControllare(S.pulizie[f.id] || S.fattiAltrui[f.id]).find(x => x.k === b.dataset.stellaNo); f.stelle = { ...(f.stelle || {}), [b.dataset.stellaNo]: { ok: false, euro: st ? st.euro : 0, testo: st ? st.nome : "" } }; ridisegna(); });
    document.querySelectorAll("[data-foto-punto]").forEach(i => i.onchange = async () => { const file = i.files && i.files[0]; if (!file) return; try { f.foto = { ...(f.foto || {}), [i.dataset.fotoPunto]: await rimpicciolisciFoto(file) }; ridisegna(); } catch (e) { toast("Non riesco a leggere la foto"); } });
    const sc = $("#salvaControllo"); if (sc) sc.onclick = () => salvaControllo(f);
    return;
  }
  document.querySelectorAll("[data-controlla]").forEach(b => b.onclick = () => apriFoglio({ tipo: "controllo", id: b.dataset.controlla, modo: "collega" }));
  document.querySelectorAll("[data-controlla-prop]").forEach(b => b.onclick = () => apriFoglio({ tipo: "controllo", id: b.dataset.controllaProp, modo: "proprietario" }));
  // frasi pronte: toccandole si aggiungono alla casella di testo indicata
  document.querySelectorAll("[data-chip-testo]").forEach(b => b.onclick = () => { const [id, testo] = b.dataset.chipTesto.split("|"); const t = document.getElementById(id); if (!t) return; t.value = (t.value.trim() ? t.value.replace(/\s+$/, "") + (/[.!?]$/.test(t.value.trim()) ? " " : ". ") : "") + testo; t.focus(); t.setSelectionRange(t.value.length, t.value.length); });
  if (f.tipo === "inizio") {
    const p = S.pulizie[f.id];
    document.querySelectorAll("[data-comincia]").forEach(b => b.onclick = () => { if (!p) return; cambiaStato(p, "in_corso", "", { tieniFoglio: true }); toast(`Buon lavoro! Premi "Fatto" su ogni blocco e tocca le stelle; alla fine "Fatto, tutto".`); });
    document.querySelectorAll("[data-spunta]").forEach(b => b.onclick = () => { const [id, k] = b.dataset.spunta.split("|"); const sp = spunteDi(id); if (sp.non[k]) { delete sp.non[k]; sp.fatte[k] = true; } else if (sp.fatte[k]) delete sp.fatte[k]; else sp.fatte[k] = true; salvaSpunte(); disegnaFoglio(); });
    document.querySelectorAll("[data-non-riesco]").forEach(b => b.onclick = async () => { const q = S.pulizie[b.dataset.nonRiesco]; if (!q) return; const k = await scegliRigaNonRiesco(q); if (!k) return; const stella = (unitaDi(q).find(r => r.k === k) || {}).stella || null; const motivo = await scegliMotivoRifinitura(stella); if (!motivo) return; const sp = spunteDi(q.id); sp.non[k] = motivo; delete sp.fatte[k]; salvaSpunte(); disegnaFoglio(); toast("Va bene: la rimetto un'altra volta"); });
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
    let toccato = false;
    const premiModo = k => document.querySelectorAll("[data-sog-modo]").forEach(x => x.setAttribute("aria-pressed", x.dataset.sogModo === k ? "true" : "false"));
    document.querySelectorAll("[data-sog-modo]").forEach(b => b.onclick = () => { toccato = true; premiModo(b.dataset.sogModo); });
    document.querySelectorAll("[data-sog-ricorda]").forEach(b => b.onclick = () => document.querySelectorAll("[data-sog-ricorda]").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false")));
    // scrivendo un nome già noto, il tipo di ospite si mette da solo (finché non lo tocchi tu)
    const nomeIn = $("#sNome"); if (nomeIn) nomeIn.oninput = () => { if (toccato) return; const cl = L.clienteDi(nomeIn.value, S.clienti); if (cl && L.NOMI_MODI.includes(cl.modo)) premiModo(cl.modo); };
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
function tagZona(z) { const t = (S.avvisi?.tag || {})[z]; return t ? (t.startsWith("@") ? t : "@" + t) : SIG(z); }
function rigaCameraAvviso(p) {
  const c = camera(p.camera);
  let r = `• ${c.nome} — ${p.origine === "governante" ? "⭐ " : ""}${titoloLavoro(p)}${p.origine === "governante" && p.minuti ? ` (${p.minuti} min)` : ""}`;
  if (p.origine === "governante" && p.come) r += `\n   ↳ ${p.come}`;
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
  for (const z of signore()) {
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
async function inviaTelegram(testo, tipo, { manuale = false, aMe = false } = {}) {
  const a = S.avvisi;
  const dove = aMe ? (a && a.chatMio) : (a && a.chat);
  if (!a || !a.token || !dove) { if (manuale) toast(aMe ? "Prima metti la TUA chat in ⋯ → Avvisi automatici." : "Prima compila token e gruppo in ⋯ → Avvisi automatici."); return false; }
  if (!manuale && tipo && a[tipo] === false) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${encodeURIComponent(a.token)}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: dove, text: testo, disable_web_page_preview: true }) });
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
async function cercaGruppoTelegram(privata = false) {
  const token = ($("#avToken")?.value || "").trim(); const box = $("#gruppiTrovati");
  const campo = privata ? "#avChatMio" : "#avChat";
  if (!token) { toast("Prima incolla il token del bot."); $("#avToken")?.focus(); return; }
  if (box) box.innerHTML = `<span class="muted small">Cerco…</span>`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/getUpdates`);
    const j = await r.json();
    if (!j.ok) { if (box) box.innerHTML = `<span class="muted small">Telegram dice: ${esc(j.description || "token non valido")}</span>`; return; }
    const trovati = {};
    for (const u of j.result || []) { const ch = u.message?.chat || u.my_chat_member?.chat || u.channel_post?.chat || u.edited_message?.chat; if (!ch) continue; const priv = ch.type === "private"; if (priv !== privata) continue; trovati[ch.id] = ch.title || [ch.first_name, ch.last_name].filter(Boolean).join(" ") || ch.username || String(ch.id); }
    const voci = Object.entries(trovati);
    if (!voci.length) { if (box) box.innerHTML = `<span class="muted small">${privata ? "Non vedo ancora la tua chat: apri Telegram, cerca il bot, scrivigli «ciao» e ripremi." : "Non vedo ancora gruppi: aggiungi il bot al gruppo delle signore (o scrivi un messaggio lì) e ripremi."}</span>`; return; }
    if (voci.length === 1) { $(campo).value = voci[0][0]; toast(`Trovato: ${voci[0][1]}`); if (box) box.innerHTML = `<span class="muted small">${privata ? "La tua chat" : "Gruppo"}: <b>${esc(voci[0][1])}</b>. Ora premi Salva.</span>`; return; }
    if (box) { box.innerHTML = voci.map(([id, t]) => `<button type="button" data-gruppo="${esc(id)}">${esc(t)}</button>`).join(""); box.querySelectorAll("[data-gruppo]").forEach(bt => bt.onclick = () => { $(campo).value = bt.dataset.gruppo; box.querySelectorAll("[data-gruppo]").forEach(x => x.setAttribute("aria-pressed", x === bt ? "true" : "false")); toast("Scelto: ora premi Salva"); }); }
  } catch (e) { console.warn(e); if (box) box.innerHTML = `<span class="muted small">Non riesco a raggiungere Telegram (rete?).</span>`; }
}
async function salvaAvvisi() {
  const v = id => ($("#" + id)?.value || "").trim();
  const dati = { ...(S.avvisi || {}), token: v("avToken"), chat: v("avChat"), chatMio: v("avChatMio"), whatsapp: v("avWa").replace(/[^0-9]/g, ""), oraPiano: Number(v("avOra")) || 7, tag: { ...(S.avvisi?.tag || {}) } };
  zoneOrdinate().forEach(z => { dati.tag[z.id] = v("avTag_" + z.id); });
  dati.chatMio = v("avChatMio");
  ["pianoMattina", "messaggio", "dettagli", "problema", "pulita", "anna"].forEach(k => { const el = $("#av_" + k); if (el) dati[k] = el.checked; });
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
  registraPuliziaFatta(p);
  cambiaStato(p, "fatta", "");
  const frasi = ["Bravissima!", "Ottimo lavoro!", "Grande!", "Perfetto!"];
  toast(`${frasi[Math.floor(Math.random() * frasi.length)]} ${camera(p.camera).nome} è pulita ✓`, { testo: "Ho sbagliato", fai: () => { cambiaStato(S.pulizie[p.id], prima === "fatta" ? "da_fare" : prima, ""); const t = $(".toast"); if (t) t.remove(); } });
  setTimeout(() => { const t = $(".toast"); if (t && /è pulita/.test(t.textContent)) t.remove(); }, 8000);
}
// "Sei sicura che tutto sia stato fatto al meglio?": le cose da fare sempre in quella camera + i dettagli di oggi,
// da spuntare una per una prima di chiudere la camera. Senza cose particolari resta solo la domanda.
function confermaFinito(p) {
  const c = camera(p.camera);
  const lista = listaDi(p), sp = spunteDi(p.id);
  const righe = righeDi(p);
  // con la lista: si chiede solo delle righe non toccate; senza lista (lavori a parte): le vecchie richieste da spuntare
  const voci = lista ? righe.filter(r => !sp.fatte[r.k] && !sp.non[r.k]).map(r => ({ id: r.k, testo: r.testo, stella: r.tipo === "stella", blocco: r.tipo === "blocco" }))
    : p.origine === "governante" ? [{ id: "G0", testo: `⭐ ${p.titolo}`, fissa: true }] : L.richiesteDaVerificare(p, sempreDi(p));
  if (lista && !voci.length) return Promise.resolve(true);
  return new Promise((ok) => {
    const vecchio = $(".conferma"); if (vecchio) vecchio.remove();
    const el = document.createElement("div"); el.className = "conferma";
    el.innerHTML = `<div class="conferma-box chiusura" role="dialog"><div class="chiusura-t">${ICONA("spunta")}<span>${lista ? (voci.length === 1 ? `In <b>${esc(c.nome)}</b> manca un tocco: ${voci[0].blocco ? "questo blocco l'hai fatto?" : "questa l'hai fatta?"}` : `In <b>${esc(c.nome)}</b> non hai toccato tutto. Questi li hai fatti?`) : `Sei sicura che in <b>${esc(c.nome)}</b> tutto sia stato fatto al meglio?`}</span></div>
      ${voci.length ? `<p class="muted" style="margin:0 0 6px">${lista ? "Tocca quelle che hai fatto:" : "Spunta una per una:"}</p><div class="chiusura-voci">${voci.map(v => `<label class="chiusura-voce"><input type="checkbox" data-voce="${esc(v.id)}"><span>${esc(v.testo)}${v.stella || /^⭐/.test(v.testo) ? ` <small>stella</small>` : v.blocco ? ` <small>blocco</small>` : v.fissa ? ` <small>sempre in ${esc(c.nome)}</small>` : lista ? "" : ` <small>oggi</small>`}</span></label>`).join("")}</div>` : ""}
      <button class="big ok" data-si ${voci.length && !lista ? "disabled" : ""}>${voci.length ? "Sì, le ho fatte tutte ✓" : "Sì, è tutta a posto ✓"}</button>${lista ? `<button class="big skip" data-parte>Chiudi lo stesso: quelle senza spunta non le ho fatte</button>` : ""}<button class="big undo" data-no>Aspetta, controllo</button></div>`;
    document.body.appendChild(el);
    const bSi = el.querySelector("[data-si]"), bParte = el.querySelector("[data-parte]");
    const aggiorna = () => { if (lista) return; const tutte = [...el.querySelectorAll("[data-voce]")].every(x => x.checked); bSi.disabled = !tutte; bSi.style.opacity = tutte ? "" : ".55"; };
    el.querySelectorAll("[data-voce]").forEach(x => x.onchange = aggiorna); aggiorna();
    bSi.onclick = () => { if (bSi.disabled) return; if (lista) for (const v of voci) { sp.fatte[v.id] = true; delete sp.non[v.id]; } el.remove(); ok(true); };
    if (bParte) bParte.onclick = () => { for (const x of el.querySelectorAll("[data-voce]")) { if (x.checked) { sp.fatte[x.dataset.voce] = true; delete sp.non[x.dataset.voce]; } else if (!sp.fatte[x.dataset.voce]) sp.non[x.dataset.voce] = "non fatta"; } el.remove(); ok(true); };
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
async function cambiaStato(p, stato, nota, opz = {}) {
  const adesso = S.db.adesso();
  const patch = { stato, nota: nota || "", ora: (stato === "da_fare" || stato === "in_corso") ? null : adesso, segnatoDa: S.utente.nome || S.utente.email || S.utente.uid };
  if (stato === "in_corso") patch.inizio = adesso;
  if (stato === "da_fare") patch.inizio = null;
  if (stato === "fatta") { patch.settimana = L.chiaveSettimana(new Date(), S.regole.chiusuraPaga);
    // il cronometro: quanto ci ha messo davvero (da "Inizia" a "Fatto"); la paga resta sulle ore standard, se Michele non la mette sul tempo vero
    const veri = p.inizio ? Math.round((new Date(adesso) - new Date(p.inizio)) / 60000) : null;
    if (veri != null && veri >= 0 && veri < 600) { patch.minutiVeri = veri;
      if (L.listinoCompleto(S.listino).pagaCol === "vero" && p.tipo !== "extra" && p.origine !== "governante" && p.minuti) {
        const c = L.pagaCronometro(S.listino, camera(p.camera), p.minuti, veri);
        patch.importo = c.importo; patch.minutiPagati = c.minuti; patch.strano = c.strano === "ok" ? null : c.strano;
      } }
  }
  else patch.settimana = null;
  const foto = fotoPending; fotoPending = null;
  if (foto) patch.foto = true;
  if (stato === "fatta" && rifiniturePending) { patch.rifiniture = rifiniturePending.rifiniture; patch.extraRifiniture = rifiniturePending.extraRifiniture; patch.spuntate = rifiniturePending.spuntate || []; patch.nonFatte = rifiniturePending.nonFatte || []; }
  if (stato !== "fatta") { patch.rifiniture = []; patch.extraRifiniture = 0; patch.spuntate = []; patch.nonFatte = []; }
  rifiniturePending = null;
  // aggiorno subito sullo schermo, poi salvo (così funziona anche senza rete)
  Object.assign(S.pulizie[p.id], patch);
  if (opz.tieniFoglio) disegna(); else { chiudiFoglio(); disegna(); }
  try {
    if (foto) await S.db.salva("foto", p.id, { pulizia: p.id, camera: p.camera, zona: p.zona, data: p.data, dati: foto, ora: S.db.adesso(), da: S.utente.nome || S.utente.email || "" }, false);
    await S.db.aggiorna("pulizie", p.id, patch);
    // il problema finisce anche nei lavori di manutenzione del proprietario (se la voce esiste già non si tocca)
    if (stato === "problema") { try { await S.db.salva("manutenzione", `pul_${p.id}`, vocePerProblema({ ...p, ...patch, foto: !!foto || !!p.foto }), false); } catch (e) { console.warn("manutenzione", e?.code || e); } }
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

async function salvaSquadra(zona, patch) {
  const sq = squadra(); const nuovo = { ...(S.squadra || {}) }; nuovo[zona] = { ...(sq[zona] || {}), ...patch };
  S.squadra = nuovo; disegna();
  try { await S.db.salva("impostazioni", "squadra", { ...nuovo, aggiornato: S.db.adesso() }, false); pianifica(); }
  catch (e) { erroreScrittura(e); }
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
  const modo = document.querySelector('[data-sog-modo][aria-pressed="true"]')?.dataset.sogModo || "", ricorda = document.querySelector('[data-sog-ricorda][aria-pressed="true"]')?.dataset.sogRicorda !== "0";
  const d = { camera: cam, inizio, fine, nome, tipo: $("#sTipo").value, persone: Number($("#sPers").value) || 1, supplemento: Math.max(0, Number($("#sSup").value) || 0), nota: $("#sNota").value.trim(), notaPrivata: $("#sPriv").value.trim(), dubbio: $("#sTipo").value === "unk", origine: f.id ? (S.soggiorni[f.id].origine || "mano") : "mano", mesi: mesiCoperti(inizio, fine), modificato: S.db.adesso(), da: S.utente.nome || "" };
  // il tipo di ospite: sul soggiorno se è solo per stavolta, altrimenti ricordato per quel nome (e il soggiorno lo eredita)
  if (L.NOMI_MODI.includes(modo)) { if (ricorda) { const nomeCl = L.nomeCliente(nome) || nome, k = L.normNome(nomeCl); if (k && (L.clienteDi(nome, S.clienti)?.modo !== modo)) { S.clienti = { ...S.clienti, [k]: { modo, nome: nomeCl, aggiornato: L.oggiISO() } }; try { await S.db.salva("impostazioni", "clienti", { [k]: S.clienti[k] }, true); } catch (e) { erroreScrittura(e); } } d.modo = ""; } else d.modo = modo; }
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
// Motivo con un tocco per una rifinitura che non si può fare
// Se la riga non ha un prodotto (si fa con un attrezzo: asta, panno, spazzola) il tasto dice "Manca l'attrezzo" e la risposta va
// alla signora: come si fa e dove stanno gli attrezzi (in lavanderia). Niente domanda nella chat di Michele (ritocco 1).
function senzaProdotto(stella) { return !!stella && (!stella.prodotto || /^(nessuno|—|-)$/i.test(String(stella.prodotto).trim())); }
function rispostaAttrezzo(stella) {
  const come = String(stella.come || "").split(/[.:]/)[0].trim();
  return new Promise((ok) => {
    const el = document.createElement("div"); el.className = "conferma";
    el.innerHTML = `<div class="conferma-box" role="dialog"><p>Qui non serve un prodotto${come ? `: si fa con <b>${esc(come.charAt(0).toLowerCase() + come.slice(1))}</b>` : ""}. Gli attrezzi stanno in lavanderia.</p><button class="big main" data-si>Va bene, la faccio</button><button class="big undo" data-m="Manca l'attrezzo">Non riesco lo stesso</button></div>`;
    document.body.appendChild(el);
    el.querySelector("[data-si]").onclick = () => { el.remove(); ok(null); };
    el.querySelector("[data-m]").onclick = () => { el.remove(); ok("Manca l'attrezzo"); };
  });
}
function scegliMotivoRifinitura(stella) {
  const attrezzo = senzaProdotto(stella);
  return new Promise((ok) => {
    const vecchio = $(".conferma"); if (vecchio) vecchio.remove();
    const el = document.createElement("div"); el.className = "conferma";
    el.innerHTML = `<div class="conferma-box" role="dialog"><p>Perché non riesci a farla?</p>${[attrezzo ? "Manca l'attrezzo" : "Manca il prodotto", "C'è l'ospite", "Non c'è tempo", "Non so come si fa"].map(m => `<button class="big undo" data-m="${esc(m)}">${esc(m)}</button>`).join("")}<button class="big close" data-no>Lascia stare</button></div>`;
    document.body.appendChild(el);
    el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { el.remove(); if (attrezzo && b.dataset.m === "Manca l'attrezzo") { rispostaAttrezzo(stella).then(ok); return; } ok(b.dataset.m); });
    el.querySelector("[data-no]").onclick = () => { el.remove(); ok(null); };
    el.onclick = (e) => { if (e.target === el) { el.remove(); ok(null); } };
  });
}
// Scelta con un tocco tra poche cose: scegliTra("Che tempo arriva?", [["freddo", "Arriva il freddo"], …]) → valore, oppure null se lascia stare
function scegliTra(testo, scelte) {
  return new Promise((ok) => {
    const vecchio = $(".conferma"); if (vecchio) vecchio.remove();
    const el = document.createElement("div"); el.className = "conferma";
    el.innerHTML = `<div class="conferma-box" role="dialog"><p>${esc(testo)}</p>${scelte.map(([v, t]) => `<button class="big undo" data-v="${esc(v)}">${esc(t)}</button>`).join("")}<button class="big close" data-no>Lascia stare</button></div>`;
    document.body.appendChild(el);
    el.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { el.remove(); ok(b.dataset.v); });
    el.querySelector("[data-no]").onclick = () => { el.remove(); ok(null); };
    el.onclick = (e) => { if (e.target === el) { el.remove(); ok(null); } };
  });
}
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
