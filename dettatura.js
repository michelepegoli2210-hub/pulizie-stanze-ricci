// ============================================================================
//  DETTATURA  ·  capisce il prospetto scritto o dettato in italiano, con REGOLE FISSE
//  (niente intelligenza artificiale: tutto quello che capisce lo mostra prima di salvare)
//
//  Esempi che capisce (una riga per camera):
//    Salvatore: Manna, 2 persone, da lunedì a venerdì
//    Aurora Palazzo dal 12 al 16 ottobre
//    Alba: Fondamenta tutto novembre
//    Nicole: Castaldi parte giovedì                      (accorcia il soggiorno che c'è già)
//    Lella: Rahhal resta fino a domenica                 (allunga il soggiorno che c'è già)
//    Michele libera                                     (toglie chi c'era segnato quella settimana)
//    Fenicotteri come la settimana scorsa                (copia l'ospite della settimana prima)
//    settimana prossima                                 (da sola in una riga: quello che segue vale per la settimana dopo)
// ============================================================================
import { CAMERE, COLONNE_EXCEL, DIZIONARIO_EXCEL } from "./regole.js";
import * as L from "./logica.js";

// ---- parole che l'app conosce ------------------------------------------------
const GIOR = { lunedi: 1, lun: 1, martedi: 2, mar: 2, mercoledi: 3, mer: 3, giovedi: 4, gio: 4, venerdi: 5, ven: 5, sabato: 6, sab: 6, domenica: 0, dom: 0 };
const GIOR_FULL = "lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica";
const GIOR_ABBR = "lun|mar|mer|gio|ven|sab|dom";
const MESI = { gennaio: 1, gen: 1, febbraio: 2, feb: 2, marzo: 3, aprile: 4, apr: 4, maggio: 5, mag: 5, giugno: 6, giu: 6, luglio: 7, lug: 7, agosto: 8, ago: 8, settembre: 9, set: 9, sett: 9, ottobre: 10, ott: 10, novembre: 11, nov: 11, dicembre: 12, dic: 12 };
const MESE_RE = "gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|apr|mag|giu|lug|ago|sett|set|ott|nov|dic";
const NUMERI = { un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, quindici: 15, venti: 20, trenta: 30 };
const REL = { oggi: 0, stasera: 0, stamattina: 0, stanotte: 0, domani: 1, dopodomani: 2, ieri: -1 };
// parole di contorno che non fanno parte del nome dell'ospite
const RIEMPITIVI = new Set(("c'e ce ci sono c e arriva arrivano arrivo arrivi entra entrano viene vengono venuto venuti parte partono partenza resta restano rimane rimangono " +
  "da dal dalla dallo dai al alla allo ai a il lo la i gli le l di del della dello dei degli delle con per in nel nella nello e ed poi fino sera mattina pomeriggio notte notti giorno giorni " +
  "settimana settimane prossima prossimo questa questo tutta tutto intera intero mese mesi camera stanza signor signora signori sig sigra ditta persona persone tecnico tecnici operaio operai " +
  "ospite ospiti ragazzo ragazzi ragazza ragazze pax posti letti uomini nuovo nuova nuovi solito soliti stessa stesso stessi come sempre ok va bene metti segna scrivi mettere segnare " +
  "anche pure ancora dentro occupata occupato arrivato arrivata arrivati arrivate oggi domani dopodomani stasera stamattina stanotte ieri x volta sono sta stanno " +
  "quella quello quelli quelle li ne che si no un uno una tel cell telefono cellulare numero num alle ore circa verso dalle entro dopo prima pranzo cena").split(/\s+/));
// parole dopo le quali, se segue il nome di una camera, comincia una camera nuova (utile quando si detta senza virgole)
const FINE_FRASE = new Set(("persone persona pax notti notte giorni giorno settimana scorsa prossima mese libera libero vuota vuoto oggi domani sera mattina solito sempre uguale intera " +
  "lunedi martedi mercoledi giovedi venerdi sabato domenica gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre poi invece mentre camera stanza in nella nell' e ed anche la il lo a").split(/\s+/));
const TIPO_PAROLE = [
  ["fond", /fondam/], ["dago", /agostin/], ["ferr", /tecnic|ferrov|(?:^|[^a-z])rfi(?![a-z])|ditta|operai/], ["altro", /(?:^|[^a-z])(?:turist|coppia|famigl|booking|airbnb|vacanz|week ?-?end|fine settimana|sposi(?![a-z]))/],
];
const ABBREVIAZIONI = new Set(["sig", "sigra", "dott", "ing", "avv", "fam", "n", "tel", "cell", "ecc", "es", "pt", "p", "gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "sett", "ott", "nov", "dic", "lun", "mer", "gio", "ven", "sab", "dom"]);

// Il testo normalizzato ha la STESSA lunghezza dell'originale: così dal pezzo normalizzato si risale al testo vero (per i nomi).
export function normalizzaAllineato(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\n") { out += "\n"; continue; }
    if (/[0-9]/.test(c)) { out += c; continue; }
    if (/['’`´]/.test(c)) { out += "'"; continue; }
    if (/[\/:;,.()\-–—?+→]/.test(c)) { out += c === "–" || c === "—" ? "-" : c; continue; }
    const b = c.normalize("NFD")[0].toLowerCase();
    out += /[a-z]/.test(b) ? b : " ";
  }
  return out;
}
function titolo(s) { return s.replace(/[a-zà-ÿ]+/gi, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).replace(/\bD'([a-z])/g, (m, c) => "D'" + c.toUpperCase()); }
function pulisci(s) { return String(s || "").replace(/\s+/g, " ").replace(/^[\s,.:;\-]+|[\s,.:;\-]+$/g, "").trim(); }

// ---- camere: tutti i modi in cui si può dire una camera ---------------------
function aliasCamere() {
  const m = {};
  for (const c of CAMERE) m[normalizzaAllineato(c.nome).replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim()] = c.id;
  for (const [k, v] of Object.entries(COLONNE_EXCEL)) m[k] = v;
  Object.assign(m, {
    "zara piano terra": "zarapt", "zara pt": "zarapt", "zara terra": "zarapt", "zara sotto": "zarapt", "zara giu": "zarapt", "zara pianterreno": "zarapt", "zara piano terreno": "zarapt", "via zara sotto": "zarapt", "via zara giu": "zarapt", "via zara pianterreno": "zarapt", "via zara piano terreno": "zarapt", "zara pianoterra": "zarapt", "via zara pianoterra": "zarapt",
    "zara primo piano": "zara1", "zara primo": "zara1", "zara 1 piano": "zara1", "zara 1": "zara1", "zara sopra": "zara1", "zara su": "zara1", "via zara sopra": "zara1", "via zara su": "zara1", "via zara primo": "zara1", "via zara 1 piano": "zara1",
    "via zara": "zara?", "zara": "zara?",
    "trento": "trento", "via trento": "trento", "trento 47": "trento", "via trento 47": "trento",
    "fenicottero": "fenicotteri", "passerelle": "passerella",
  });
  return m;
}
let _alias = null, _aliasRe = null;
function aliasRe() {
  if (_aliasRe) return _aliasRe;
  _alias = aliasCamere();
  const chiavi = Object.keys(_alias).map(k => k.trim()).filter(Boolean).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"));
  _aliasRe = new RegExp(`(^|[^a-z0-9])(${chiavi.join("|")})(?![a-z0-9])`, "g");
  return _aliasRe;
}
function cameraDaAlias(txt) { return _alias[txt.replace(/\s+/g, " ").trim()] || null; }

// ---- date ---------------------------------------------------------------------
function iso(a, m, g) { return `${a}-${String(m).padStart(2, "0")}-${String(g).padStart(2, "0")}`; }
function annoGiusto(mese, giorno, oggi) {
  const a = Number(oggi.slice(0, 4));
  for (const anno of [a, a + 1, a - 1]) {
    const d = L.giorniTra(oggi, iso(anno, mese, giorno));
    if (d >= -60 && d <= 330) return iso(anno, mese, giorno);
  }
  return iso(a, mese, giorno);
}
function dataNumero(giorno, mese, anno, base, oggi) {
  giorno = Number(giorno);
  if (!giorno || giorno > 31) return null;
  if (anno) { anno = Number(anno); if (anno < 100) anno += 2000; const m = /^\d+$/.test(String(mese)) ? Number(mese) : MESI[mese]; if (!m) return null; return iso(anno, m, giorno); }
  if (mese) { const m = /^\d+$/.test(String(mese)) ? Number(mese) : MESI[mese]; if (!m || m > 12) return null; return annoGiusto(m, giorno, oggi); }
  // senza mese: il mese della settimana di riferimento; se il giorno è già passato, il mese dopo
  const b = L.daISO(base);
  let m = b.getUTCMonth() + 1, a = b.getUTCFullYear();
  if (giorno < b.getUTCDate() - 2) { m++; if (m > 12) { m = 1; a++; } }
  const gg = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return iso(a, m, Math.min(giorno, gg));
}
function dataGiorno(nomeGiorno, base, comeInizio) {
  const g = GIOR[nomeGiorno];
  if (g == null) return null;
  if (g === 0) return L.aggiungiGiorni(base, comeInizio ? -1 : 6); // domenica: prima della settimana se è un arrivo, alla fine se è una partenza
  return L.aggiungiGiorni(base, g - 1);
}
function primoDelMeseDopo(d) { return L.aggiungiGiorni(L.ultimoDelMese(d), 1); }
function meseDaNome(nome, oggi) { const m = MESI[nome]; if (!m) return null; return annoGiusto(m, 1, oggi); }

// ---- il cuore: una riga di testo → cosa vuole dire ----------------------------
const RE_NUM = `(\\d{1,2})(?:\\s*[\\/.]\\s*(\\d{1,2})(?:\\s*[\\/.]\\s*(\\d{2,4}))?|\\s+(${MESE_RE})(?![a-z])(?:\\s+(\\d{4}))?)?`;
const RE_DATA_SINGOLA = `(?:${RE_NUM}|(${GIOR_FULL})(?![a-z])(?:\\s+(?:sera|mattina|pomeriggio|notte))?|(oggi|domani|dopodomani|stasera|stamattina|stanotte|ieri)(?![a-z]))`;

function capisciRiga(seg, ctx) {
  // seg = { n: testo normalizzato, o: testo originale (stessa lunghezza), camera, base }
  const oggi = ctx.oggi;
  let base = seg.base;
  const n = seg.n;
  let w = n; // copia di lavoro: i pezzi già capiti diventano spazi
  const consuma = (m, da = 0, a = null) => { const i0 = m.index + da, i1 = a == null ? m.index + m[0].length : a; w = w.slice(0, i0) + " ".repeat(i1 - i0) + w.slice(i1); };
  const consumaDa = (i) => { w = w.slice(0, i) + " ".repeat(w.length - i); };
  const motivi = [], assunti = [];
  const r = { camera: seg.camera, testo: pulisci(seg.o), azione: "nuovo", nome: "", persone: null, tipo: null, inizio: null, fine: null, nota: "", notaPrivata: "", dubbio: false, motivi, assunti, scelto: true, base };
  const cerca = (re) => { re.lastIndex = 0; return re.exec(w); };
  const cercaTutti = (re) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(w))) out.push(m); return out; };
  let durata = null, haParoleProlunga = false, haParoleParte = false, comeScorsa = false, libera = false;
  let m;

  // 0) settimana di riferimento detta nella riga
  if ((m = cerca(/(?:la\s+)?(?:settimana\s+prossima|prossima\s+settimana|settimana\s+dopo|settimana\s+che\s+viene)/g))) { base = L.aggiungiGiorni(L.lunediDi(oggi), 7); r.base = base; consuma(m); }
  else if ((m = cerca(/(?:questa\s+settimana|settimana\s+corrente)/g))) { base = L.lunediDi(oggi); r.base = base; consuma(m); }
  if ((m = cerca(/tra\s+(?:due|2)\s+settimane/g))) { base = L.aggiungiGiorni(L.lunediDi(oggi), 14); r.base = base; consuma(m); }

  // 1) parole speciali
  if ((m = cerca(/(?:^|[^a-z])(libera|libero|vuota|vuoto|niente|nessuno|non\s+viene|non\s+vengono|non\s+arriva|non\s+arrivano|non\s+torna|non\s+tornano|disdett[oa]|annullat[oa]|cancellat[oa]|salta|saltano|chiusa|chiuso)(?![a-z])/g))) { libera = true; consuma(m); }
  if ((m = cerca(/(?:come|uguale\s+a|uguale|stess[oiae]\s+(?:di|del|della))\s+(?:la\s+)?(?:settimana\s+scorsa|settimana\s+passata|settimana\s+prima|l'altra\s+settimana)|(?:^|[^a-z])(?:uguale|come\s+sempre|come\s+al\s+solito|come\s+prima|i\s+soliti|il\s+solito|la\s+solita|stessi\s+di\s+prima)(?![a-z])/g))) { comeScorsa = true; consuma(m); }
  if (cerca(/(?:^|[^a-z])(?:resta|restano|rimane|rimangono|prolunga|prolungano|si\s+ferma|si\s+fermano|ancora|continua|continuano|allunga|allungano|trattiene|trattengono|proroga)(?![a-z])/g)) haParoleProlunga = true;
  if (cerca(/(?:^|[^a-z])(?:parte|partono|partenza|va\s+via|vanno\s+via|esce|escono|lascia|lasciano|finisce|finiscono|se\s+ne\s+va|se\s+ne\s+vanno)(?![a-z])/g)) haParoleParte = true;

  // 1a) tra parentesi: una nota (per le signore, oppure privata se parla di soldi/telefoni); non se dentro c'è una data
  for (const mm of cercaTutti(/\(([^)]*)\)/g)) {
    let t = pulisci(seg.o.slice(mm.index + 1, mm.index + mm[0].length - 1));
    const tn = normalizzaAllineato(t);
    if (/(^|[^a-z])(dal|al|da|a)\s+\d|\d{1,2}\s*[\/.]\s*\d|lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|notti|settiman/.test(tn) && !/privat|riservat|euro|prezzo|paga|tel|cell/.test(tn)) continue;
    const priv = /^(privat[oa]|riservato|solo per noi)\s*:?/.test(tn) || DIZIONARIO_EXCEL.parolePrivate.some(pp => new RegExp(`(^|[^a-z])${pp}`).test(tn)) || /\d(?:[\s.]?\d){7,}/.test(tn);
    t = t.replace(/^(privat[oa]|riservato|solo per noi)\s*:?\s*/i, "");
    if (t) { if (priv) r.notaPrivata = (r.notaPrivata ? r.notaPrivata + " · " : "") + t; else r.nota = (r.nota ? r.nota + " · " : "") + t; }
    consuma(mm);
  }
  // 1b) telefoni e prezzi: sono privati, e non devono essere scambiati per date
  for (const mm of cercaTutti(/\+?\d(?:[\s.]?\d){7,}/g)) { r.notaPrivata = (r.notaPrivata ? r.notaPrivata + " · " : "") + "tel. " + pulisci(seg.o.slice(mm.index, mm.index + mm[0].length)); consuma(mm); }
  for (const mm of cercaTutti(/(\d+(?:[.,]\d+)?)\s*(?:euro|eur|€)(?![a-z])/g)) { r.notaPrivata = (r.notaPrivata ? r.notaPrivata + " · " : "") + pulisci(seg.o.slice(mm.index, mm.index + mm[0].length)); consuma(mm); }

  // 2) date: prima i periodi espliciti (da … a …), poi i pezzi singoli
  // 2a) numeri: "dal 12 al 16", "dal 12 al 16 ottobre", "dal 12/10 al 16/10", "dal 30 ottobre al 2 novembre", "12-16 ottobre"
  const reNumRange = new RegExp(`(?:^|[^a-z0-9\\/.])(?:dal|dalla|dallo|da|dai)?\\s*${RE_NUM}\\s*(?:al|alla|allo|a|fino\\s+al|fino\\s+a|-|→)\\s*${RE_NUM}`, "g");
  for (const mm of cercaTutti(reNumRange)) {
    const [g1, m1, a1, mn1, an1, g2, m2, a2, mn2, an2] = mm.slice(1);
    if (!g1 || !g2) continue;
    const dopo = w.slice(mm.index + mm[0].length).trimStart();
    if (/^(person|pax|tecnic|opera|ragazz|ospit|posti|letti|notti|notte|giorni|giorno|settiman|mes[ei])/.test(dopo) && !m1 && !mn1 && !m2 && !mn2 && !/\b(dal|da)\b/.test(mm[0])) continue; // "da 2 a 3 persone"
    let mese1 = m1 || mn1, mese2 = m2 || mn2;
    if (!mese1 && mese2) mese1 = mese2; if (!mese2 && mese1) mese2 = mese1;
    let i0 = dataNumero(g1, mese1, a1 || an1, base, oggi), i1 = dataNumero(g2, mese2, a2 || an2, base, oggi);
    if (!i0 || !i1) continue;
    if (i1 <= i0) { const d = L.daISO(i1); d.setUTCMonth(d.getUTCMonth() + 1); i1 = L.aISO(d); } // "dal 30 al 2": il 2 è del mese dopo
    r.inizio = i0; r.fine = i1; consuma(mm); break;
  }
  // 2b) giorni della settimana: "da lunedì a venerdì", "lun-ven", "da domenica sera a venerdì", "sabato e domenica"
  if (!r.inizio) {
    const reG = new RegExp(`(?:^|[^a-z])(?:dal|dalla|da|dalle)?\\s*(${GIOR_FULL}|${GIOR_ABBR})(?![a-z])(?:\\s+(?:sera|mattina|pomeriggio|notte))?\\s*(?:al|alla|a|fino\\s+al|fino\\s+a|-|→|e)\\s*(?:il\\s+|la\\s+)?(${GIOR_FULL}|${GIOR_ABBR})(?![a-z])(?:\\s+(?:sera|mattina|pomeriggio|notte))?`, "g");
    const mm = cerca(reG);
    if (mm) {
      const unione = /\se\s/.test(mm[0]) && !/\s(a|al|alla|fino)\s/.test(mm[0]) && !/-/.test(mm[0]);
      let i0 = dataGiorno(mm[1], base, true), i1 = dataGiorno(mm[2], base, false);
      if (unione) i1 = L.aggiungiGiorni(i1, 1); // "sabato e domenica" = le notti di sabato e di domenica
      if (i1 <= i0) i1 = L.aggiungiGiorni(i1, 7);
      r.inizio = i0; r.fine = i1; consuma(mm);
    }
  }
  // 2c) "tutto ottobre", "tutto il mese", "per tutto il mese di novembre", "fino a fine mese", "weekend", "tutta la settimana"
  if ((m = cerca(new RegExp(`(?:per\\s+)?tutt[oa]\\s+(?:il\\s+)?(?:mese\\s+(?:di\\s+)?)?(${MESE_RE})(?![a-z])`, "g")))) {
    const p = meseDaNome(m[1], oggi); if (p) { r.inizio = p; r.fine = primoDelMeseDopo(p); consuma(m); }
  } else if ((m = cerca(/(?:per\s+)?tutto\s+il\s+mese(?![a-z])/g))) { const p = L.primoDelMese(base); r.inizio = p; r.fine = primoDelMeseDopo(p); consuma(m); }
  if ((m = cerca(new RegExp(`(?:fino\\s+a|fino\\s+alla|a|entro)\\s+fine\\s+(?:del\\s+)?(?:mese|(${MESE_RE}))(?![a-z])`, "g")))) {
    const p = m[1] ? meseDaNome(m[1], oggi) : L.primoDelMese(base); if (p) { r.fine = primoDelMeseDopo(p); consuma(m); }
  }
  if ((m = cerca(/(?:per\s+)?(?:il\s+|questo\s+|nel\s+)?(?:week\s*-?\s*end|fine\s+settimana)(?![a-z])/g))) { if (!r.inizio) { r.inizio = L.aggiungiGiorni(base, 4); r.fine = L.aggiungiGiorni(base, 6); } consuma(m); }
  if ((m = cerca(/tutta\s+la\s+settimana(?:\s+prossima)?(?![a-z])|settimana\s+intera|per\s+tutta\s+la\s+settimana/g))) {
    if (/prossima/.test(m[0])) { base = L.aggiungiGiorni(L.lunediDi(oggi), 7); r.base = base; }
    if (!r.inizio) { r.inizio = base; r.fine = L.aggiungiGiorni(base, 4); assunti.push("tutta la settimana = da lunedì a venerdì"); }
    consuma(m);
  }
  // 2d) durata: "3 notti", "due settimane", "un mese", "per 5 giorni"
  if ((m = cerca(/(?:per\s+)?(\d{1,2}|un|una|uno|due|tre|quattro|cinque|sei|sette|otto|dieci|quindici|venti|trenta)\s+(nott[ei]|giorn[oi]|settiman[ae]|mes[ei])(?![a-z])/g))) {
    const q = /^\d/.test(m[1]) ? Number(m[1]) : NUMERI[m[1]];
    durata = { q, u: m[2][0] }; consuma(m);
  }
  // 2e) pezzi singoli: "arriva lunedì", "dal 12", "parte giovedì", "fino al 20", "il 12 ottobre"
  const reInizio = new RegExp(`(?:^|[^a-z])(?:arriva|arrivano|arrivo|arrivi|entra|entrano|viene|vengono|dal|dalla|dallo|da|a\\s+partire\\s+da|inizia|inizio|torna|tornano|rientra|rientrano)\\s+(?:il\\s+|lo\\s+|la\\s+|di\\s+)?${RE_DATA_SINGOLA}`, "g");
  const reFine = new RegExp(`(?:^|[^a-z])(?:parte|partono|partenza|va\\s+via|vanno\\s+via|esce|escono|lascia|lasciano|finisce|finiscono|fino\\s+a|fino\\s+al|fino\\s+alla|al|entro|resta\\s+fino\\s+a|restano\\s+fino\\s+a|rimane\\s+fino\\s+a|rimangono\\s+fino\\s+a|prolunga\\s+fino\\s+a|si\\s+ferma\\s+fino\\s+a|si\\s+fermano\\s+fino\\s+a|se\\s+ne\\s+va|se\\s+ne\\s+vanno)\\s+(?:il\\s+|lo\\s+|la\\s+|di\\s+)?${RE_DATA_SINGOLA}`, "g");
  const risolvi = (mm, comeInizio) => {
    const [g, mes, an, mn, an2, gior, rel] = mm.slice(1);
    if (gior) return dataGiorno(gior, base, comeInizio);
    if (rel) return L.aggiungiGiorni(oggi, REL[rel]);
    if (g) return dataNumero(g, mes || mn, an || an2, base, oggi);
    return null;
  };
  let inizioDetto = !!r.inizio, fineDetta = !!r.fine;
  if (!r.inizio) { const mm = cerca(reInizio); if (mm) { const d = risolvi(mm, true); if (d) { r.inizio = d; inizioDetto = true; consuma(mm); } } }
  if (!r.fine) { const mm = cerca(reFine); if (mm) { const d = risolvi(mm, false); if (d) { r.fine = d; fineDetta = true; consuma(mm); } } }
  // una data da sola ("Manna 12 ottobre", "Manna lunedì") = arrivo
  if (!r.inizio) {
    const reSola = new RegExp(`(?:^|[^a-z0-9\\/.])(?:il\\s+|lo\\s+)?${RE_DATA_SINGOLA}`, "g");
    for (const mm of cercaTutti(reSola)) {
      const dopo = w.slice(mm.index + mm[0].length).trimStart();
      if (/^(person|pax|tecnic|opera|ragazz|ospit|posti|letti|p(?![a-z]))/.test(dopo) && !mm[2] && !mm[4] && !mm[6] && !mm[7]) continue; // "2 persone"
      if (mm[1] && !mm[2] && !mm[4] && Number(mm[1]) < 10 && !/\b(il|lo)\s*$/.test(w.slice(0, mm.index + mm[0].length - mm[1].length))) continue; // "Rega 2" = due persone, non il giorno 2
      const d = risolvi(mm, true); if (d) { r.inizio = d; inizioDetto = true; consuma(mm); break; }
    }
  }

  // 3) persone
  if ((m = cerca(/(?:^|[^a-z0-9])(\d{1,2}|un|una|uno|due|tre|quattro|cinque|sei)\s*(?:person[ae]|pax|tecnic[oi]|opera[io]|ragazz[oiae]|ospit[ie]|signor[ie]|uomini|posti|letti|p)(?![a-z])/g))) { r.persone = /^\d/.test(m[1]) ? Number(m[1]) : NUMERI[m[1]]; consuma(m); }
  else if ((m = cerca(/(?:^|[^a-z0-9])(?:in|x|per)\s*(\d{1,2}|due|tre|quattro|cinque|sei)(?![a-z0-9\/.])/g))) { r.persone = /^\d/.test(m[1]) ? Number(m[1]) : NUMERI[m[1]]; consuma(m); }
  else if ((m = cerca(/(?:^|[^a-z])(coppia|in\s+coppia|marito\s+e\s+moglie|sposi)(?![a-z])/g))) { r.persone = 2; consuma(m); }
  else if ((m = cerca(/(?:^|[^a-z])(da\s+sol[oa]|singol[oa]|uno\s+solo)(?![a-z])/g))) { r.persone = 1; consuma(m); }
  else if ((m = cerca(/(?:^|[^a-z])(famiglia|famigliola|famiglie)(?![a-z])/g))) { r.persone = 3; assunti.push("famiglia = 3 persone"); }
  else if ((m = cerca(/(?:^|[^a-z0-9\/.])([1-6])(?![a-z0-9\/.])/g))) { r.persone = Number(m[1]); consuma(m); }
  if (r.persone != null && (r.persone < 1 || r.persone > 12)) r.persone = null;

  // 4) note: dopo "nota:" (per le signore) o "privato:" (solo per noi)
  if ((m = cerca(/(?:^|[^a-z])(?:privat[oa]|riservato|solo\s+per\s+noi)\s*:\s*/g))) { const t = pulisci(seg.o.slice(m.index + m[0].length)); if (t) r.notaPrivata = (r.notaPrivata ? r.notaPrivata + " · " : "") + t; consumaDa(m.index); }
  if ((m = cerca(/(?:^|[^a-z])(?:nota|note|istruzioni|per\s+le\s+signore|dire\s+alle\s+signore|di'\s+alle\s+signore|alle\s+signore)\s*:\s*/g))) { const t = pulisci(seg.o.slice(m.index + m[0].length)); if (t) r.nota = (r.nota ? r.nota + " · " : "") + t; consumaDa(m.index); }
  // istruzioni per le signore scritte nel testo (asciugamani doppi, lettino…): dalla parola in poi va nella nota
  const istr = new RegExp(`(?:^|[^a-z])(${DIZIONARIO_EXCEL.paroleIstruzioni.map(p => p.replace(/\s+/g, "\\s+")).join("|")}|asciugaman[oi]|lettin[oi]|cull[ae]|lenzuol[ao]|cambio|pulizia\\s+extra|antimuffa|tende)(?![a-z])`, "g");
  if ((m = cerca(istr))) {
    const t = pulisci(seg.o.slice(m.index + (m[0].length - m[1].length)).replace(/[,;:].*$/, "")); // fino alla prossima virgola
    if (t.length > 3) { r.nota = (r.nota ? r.nota + " · " : "") + t; consumaDa(m.index); }
  }

  // 5) tipo di ospite dalle parole
  for (const [tipo, re] of TIPO_PAROLE) { if (re.test(n)) { r.tipo = tipo; break; } }
  r.tipoDetto = !!r.tipo;

  // 6) il nome: quello che resta, senza le parole di contorno
  let resto = "";
  for (let i = 0; i < w.length; i++) resto += w[i] === " " ? " " : seg.o[i];
  resto = resto.replace(/[,:;()\-→\/]/g, " ");
  const parole = resto.split(/\s+/).filter(Boolean).filter(x => { const k = normalizzaAllineato(x).trim().replace(/[^a-z0-9'?]/g, ""); return k && !RIEMPITIVI.has(k) && !/^\d+$/.test(k); });
  let nome = pulisci(parole.join(" "));
  if (/\?/.test(nome) || /\?/.test(n)) { r.dubbio = true; nome = pulisci(nome.replace(/\?/g, "")); motivi.push("c'è un punto di domanda: da controllare"); }
  nome = titolo(nome);
  if (nome.length > 40) nome = nome.slice(0, 40).trim();
  r.nome = nome;
  Object.assign(r, { durata, haParoleProlunga, haParoleParte, comeScorsa, libera, inizioDetto, fineDetta });
  return r;
}

// ---- completa la riga guardando il prospetto che c'è già ----------------------
function completa(r, ctx) {
  const oggi = ctx.oggi, base = r.base;
  const sog = (ctx.soggiorni || []).filter(s => s.camera === r.camera);
  const inSettimana = sog.filter(s => s.inizio < L.aggiungiGiorni(base, 7) && base < s.fine);
  const stessoNome = (s) => r.nome && s.nome && normalizzaAllineato(s.nome).trim() === normalizzaAllineato(r.nome).trim();
  const notti = (a, b) => L.giorniTra(a, b);

  // camera libera / non viene → tolgo quello che c'è quella settimana
  if (r.libera) {
    const lista = r.nome && inSettimana.some(stessoNome) ? inSettimana.filter(stessoNome) : inSettimana;
    if (lista.length) { r.azione = "togli"; r.esistenti = lista.map(s => ({ id: s.id, nome: s.nome, inizio: s.inizio, fine: s.fine })); }
    else { r.azione = "niente"; r.scelto = false; r.motivi.push(`in ${ctx.nomeCamera(r.camera)} non c'era niente segnato quella settimana`); }
    return r;
  }
  // "come la settimana scorsa" → copio l'ultimo soggiorno della settimana prima
  if (r.comeScorsa) {
    const prima = sog.filter(s => s.inizio < base && s.fine > L.aggiungiGiorni(base, -8) && notti(s.inizio, s.fine) <= 9).sort((a, b) => a.inizio < b.inizio ? 1 : -1)[0];
    if (prima) {
      if (!r.nome) r.nome = prima.nome;
      if (!r.inizio) r.inizio = L.aggiungiGiorni(prima.inizio, 7);
      if (!r.fine) r.fine = L.aggiungiGiorni(prima.fine, 7);
      if (r.persone == null) r.persone = prima.persone || 1;
      if (!r.tipo) r.tipo = prima.tipo;
      if (!r.nota && prima.nota) r.nota = prima.nota;
      r.assunti.push(`come la settimana scorsa (${prima.nome}, ${L.dataMedia(prima.inizio)} → ${L.dataMedia(prima.fine)})`);
    } else { r.motivi.push("la settimana scorsa non c'era nessuno segnato: scrivi il nome e i giorni"); if (!r.nome) r.dubbio = true; }
  }
  // partenza anticipata / prolungamento di un soggiorno che c'è già
  if (r.fine && !r.inizio) {
    const conNome = sog.filter(s => (!r.nome || stessoNome(s)));
    const copertura = conNome.find(s => s.inizio < r.fine && r.fine < s.fine) || conNome.find(s => s.inizio < r.fine && s.fine === r.fine);
    const daAllungare = conNome.filter(s => s.fine <= r.fine && s.fine >= L.aggiungiGiorni(oggi, -7) && s.inizio < r.fine).sort((a, b) => a.fine < b.fine ? 1 : -1)[0];
    if (copertura && (r.haParoleParte || !r.haParoleProlunga)) {
      r.azione = "accorcia"; r.esistente = { id: copertura.id, nome: copertura.nome, inizio: copertura.inizio, fine: copertura.fine }; r.inizio = copertura.inizio; r.nome = r.nome || copertura.nome; r.persone = r.persone ?? copertura.persone; r.tipo = r.tipo || copertura.tipo;
      if (copertura.fine === r.fine) { r.azione = "niente"; r.scelto = false; r.motivi.push("partiva già quel giorno"); }
      return r;
    }
    if (daAllungare && (r.haParoleProlunga || !r.haParoleParte)) {
      r.azione = daAllungare.fine === r.fine ? "niente" : "prolunga";
      if (r.azione === "niente") { r.scelto = false; r.motivi.push("partiva già quel giorno"); }
      r.esistente = { id: daAllungare.id, nome: daAllungare.nome, inizio: daAllungare.inizio, fine: daAllungare.fine }; r.inizio = daAllungare.inizio; r.nome = r.nome || daAllungare.nome; r.persone = r.persone ?? daAllungare.persone; r.tipo = r.tipo || daAllungare.tipo;
      return r;
    }
  }
  // nuovo soggiorno: completo i pezzi mancanti con le abitudini della casa
  if (!r.inizio && r.fine) {
    const wd = L.giornoSettimana(r.fine);
    r.inizio = wd === 1 ? L.aggiungiGiorni(r.fine, -3) : (base < r.fine ? base : L.lunediDi(r.fine));
    r.assunti.push("arrivo non detto → " + L.dataMedia(r.inizio));
  }
  if (!r.inizio) { r.inizio = base; if (!r.durata) { r.fine = L.aggiungiGiorni(base, 4); r.assunti.push("giorni non detti → da lunedì a venerdì"); } else r.assunti.push("arrivo non detto → lunedì"); }
  if (!r.fine) {
    if (r.durata) {
      const { q, u } = r.durata;
      if (u === "n" || u === "g") r.fine = L.aggiungiGiorni(r.inizio, q);
      else if (u === "s") r.fine = L.aggiungiGiorni(r.inizio, 7 * q);
      else { const d = L.daISO(r.inizio); d.setUTCMonth(d.getUTCMonth() + q); r.fine = L.aISO(d); }
    } else {
      const wd = L.giornoSettimana(r.inizio);
      if (wd === 5) r.fine = L.aggiungiGiorni(r.inizio, 2);
      else if (wd === 6) r.fine = L.aggiungiGiorni(r.inizio, 1);
      else r.fine = L.aggiungiGiorni(r.inizio, (5 - wd + 7) % 7 || 7);
      r.assunti.push("partenza non detta → " + L.dataMedia(r.fine));
    }
  }
  if (r.fine <= r.inizio) { r.fine = L.aggiungiGiorni(r.inizio, 1); r.motivi.push("partenza prima dell'arrivo: ho messo una notte"); r.dubbio = true; }
  // nome mancante → l'ultimo ospite di quella camera
  if (!r.nome) {
    const ultimo = sog.filter(s => s.inizio < r.inizio && s.nome && s.nome !== "?").sort((a, b) => a.inizio < b.inizio ? 1 : -1)[0];
    if (ultimo) { r.nome = ultimo.nome; r.assunti.push(`nome non detto → ${ultimo.nome} (l'ultimo ospite di questa camera)`); if (r.persone == null) r.persone = ultimo.persone || 1; if (!r.tipo) r.tipo = ultimo.tipo; }
    else { r.nome = "?"; r.dubbio = true; r.motivi.push("manca il nome dell'ospite"); }
  }
  const personeDette = r.persone != null;
  if (r.persone == null) r.persone = 1;
  if (!r.tipo) {
    const nn = normalizzaAllineato(r.nome);
    for (const t of DIZIONARIO_EXCEL.tipi) if (t.contiene.some(k => nn.includes(k))) r.tipo = t.tipo;
  }
  if (!r.tipo) {
    const nottiTot = notti(r.inizio, r.fine);
    let weekend = false; for (let d = r.inizio; d < r.fine; d = L.aggiungiGiorni(d, 1)) { const wd = L.giornoSettimana(d); if (wd === 5 || wd === 6) weekend = true; }
    r.tipo = r.nome === "?" ? "unk" : (nottiTot <= 3 && weekend ? "altro" : "ferr");
  }
  // soggiorni che si accavallano
  let sovrapposti = sog.filter(s => s.inizio < r.fine && r.inizio < s.fine);
  let uguali = sovrapposti.filter(stessoNome);
  if (!r.inizioDetto && !r.fineDetta && !r.durata && !r.comeScorsa && uguali.length === 1) {
    // non ha detto i giorni e quell'ospite c'è già: tengo i suoi giorni (cambio solo persone/note)
    const e = uguali[0]; r.inizio = e.inizio; r.fine = e.fine; r.assunti = r.assunti.filter(a => !/giorni non detti|partenza non detta|arrivo non detto/.test(a));
    sovrapposti = [e]; uguali = [e];
  }
  if (uguali.length === 1 && sovrapposti.length === 1) {
    const e = uguali[0];
    if (!personeDette) r.persone = e.persone || 1;
    if (!r.tipoDetto && e.tipo) r.tipo = e.tipo;
    if (e.inizio === r.inizio && e.fine === r.fine && (e.persone || 1) === r.persone && (!r.nota || (e.nota || "") === r.nota)) { r.azione = "niente"; r.scelto = false; r.motivi.push("era già segnato così"); }
    else { r.azione = "aggiorna"; r.esistente = { id: e.id, nome: e.nome, inizio: e.inizio, fine: e.fine }; }
    return r;
  }
  if (sovrapposti.length) {
    r.conflitti = sovrapposti.map(s => ({ id: s.id, nome: s.nome, inizio: s.inizio, fine: s.fine, notti: notti(s.inizio, s.fine) }));
    r.comportamento = r.conflitti.every(c => c.notti <= 9) ? "sostituisci" : "insieme";
  }
  return r;
}

// ---- dal testo intero alle righe capite -----------------------------------------
export function settimanaBaseDefault(oggi) {
  const wd = L.giornoSettimana(oggi); // venerdì, sabato e domenica si parla già della settimana dopo
  return wd === 5 || wd === 6 || wd === 0 ? L.aggiungiGiorni(L.lunediDi(oggi), 7) : L.lunediDi(oggi);
}

function spezzaFrasi(testo) {
  // a capo, punto e virgola, punto (ma non il punto tra due cifre "12.10", né dopo un'abbreviazione "sig.")
  const out = []; let cur = "", curStart = 0;
  for (let i = 0; i < testo.length; i++) {
    const c = testo[i];
    let sep = c === "\n" || c === ";";
    if (c === "." ) {
      const prima = (testo.slice(Math.max(0, i - 8), i).match(/([a-zà-ÿ]+)$/i) || [])[1] || "";
      const traCifre = /\d/.test(testo[i - 1] || "") && /\d/.test(testo[i + 1] || "");
      sep = !traCifre && !(prima && (ABBREVIAZIONI.has(prima.toLowerCase()) || prima.length === 1));
    }
    if (sep) { out.push({ t: cur, i: curStart }); cur = ""; curStart = i + 1; } else cur += c;
  }
  out.push({ t: cur, i: curStart });
  return out.filter(f => f.t.trim());
}

export function capisciProspetto(testo, ctx) {
  const oggi = ctx.oggi || L.oggiISO();
  let base = ctx.base || settimanaBaseDefault(oggi);
  const nomeCamera = (id) => (CAMERE.find(c => c.id === id) || { nome: id }).nome;
  const c2 = { ...ctx, oggi, nomeCamera };
  const righe = [], nonCapito = [];
  const re = aliasRe();
  for (const frase of spezzaFrasi(testo || "")) {
    const o = frase.t, n = normalizzaAllineato(o);
    // direttive da sole in una riga
    const nn = n.trim().replace(/\s+/g, " ");
    if (/^(?:la )?(?:settimana prossima|prossima settimana|settimana dopo)\s*:?$/.test(nn)) { base = L.aggiungiGiorni(L.lunediDi(oggi), 7); continue; }
    if (/^(?:questa settimana|settimana corrente)\s*:?$/.test(nn)) { base = L.lunediDi(oggi); continue; }
    if (/^tra (?:due|2) settimane\s*:?$/.test(nn)) { base = L.aggiungiGiorni(L.lunediDi(oggi), 14); continue; }
    if (/^(?:tutto|tutte|tutti) (?:come|uguale a|uguale) (?:la )?settimana scorsa\s*:?$/.test(nn) || /^(?:tutto )?(?:uguale|come sempre|come al solito|stessa settimana)\s*:?$/.test(nn)) { for (const r of copiaSettimanaScorsa({ ...c2, base })) righe.push(r); continue; }
    // dove cominciano le camere
    const starts = [];
    re.lastIndex = 0; let m;
    while ((m = re.exec(n))) {
      const i = m.index + m[1].length;
      const prima = n.slice(0, i).replace(/\s+$/, "");
      const ultimaParola = (prima.match(/([a-z']+)$/) || [])[1] || "";
      const nomeDiPersona = /:$/.test(prima) || /(signor|signora|sig|ditta|famiglia|coppia|ospite|nome)$/.test(ultimaParola);
      const inizioBuono = prima === "" || /[,;.\d]$/.test(prima) || FINE_FRASE.has(ultimaParola);
      if (!nomeDiPersona && (inizioBuono || starts.length === 0)) starts.push({ i, fine: m.index + m[0].length, id: cameraDaAlias(m[2]) });
      re.lastIndex = m.index + m[0].length;
    }
    if (!starts.length) { nonCapito.push(pulisci(o)); continue; }
    starts.forEach((s, k) => {
      const a = k === 0 ? 0 : s.i, b = k + 1 < starts.length ? starts[k + 1].i : n.length;
      const nSeg = n.slice(a, s.i) + " ".repeat(s.fine - s.i) + n.slice(s.fine, b); // tolgo il nome della camera dal pezzo
      let camera = s.id, dubbioCamera = false;
      if (camera === "zara?") { camera = "zarapt"; dubbioCamera = true; }
      const r = capisciRiga({ n: nSeg, o: o.slice(a, b), camera, base }, c2);
      if (dubbioCamera) { r.dubbio = true; r.motivi.push("Via Zara: piano terra o primo piano? Ho messo piano terra"); }
      completa(r, c2);
      righe.push(r);
    });
  }
  righe.forEach((r, i) => { r.id = "d" + i; r.firma = `${r.azione}|${r.camera}|${r.inizio}|${r.fine}|${r.nome}`; });
  return { righe, nonCapito, base };
}

// Copia della settimana scorsa: per ogni camera senza nessuno nella settimana di riferimento,
// ripropone l'ospite della settimana prima spostato di 7 giorni (solo soggiorni corti, non quelli mensili).
export function copiaSettimanaScorsa(ctx) {
  const oggi = ctx.oggi || L.oggiISO();
  const base = ctx.base || settimanaBaseDefault(oggi);
  const out = [];
  for (const c of CAMERE) {
    const sog = (ctx.soggiorni || []).filter(s => s.camera === c.id);
    if (sog.some(s => s.inizio < L.aggiungiGiorni(base, 5) && base < s.fine)) continue;
    const prima = sog.filter(s => s.inizio < base && s.fine > L.aggiungiGiorni(base, -8) && L.giorniTra(s.inizio, s.fine) <= 9 && s.nome && s.nome !== "?").sort((a, b) => a.inizio < b.inizio ? 1 : -1)[0];
    if (!prima) continue;
    const r = { camera: c.id, testo: `${c.nome}: come la settimana scorsa`, azione: "nuovo", nome: prima.nome, persone: prima.persone || 1, tipo: prima.tipo || "ferr", inizio: L.aggiungiGiorni(prima.inizio, 7), fine: L.aggiungiGiorni(prima.fine, 7), nota: prima.nota || "", notaPrivata: "", dubbio: false, motivi: [], assunti: [`come la settimana scorsa (${L.dataMedia(prima.inizio)} → ${L.dataMedia(prima.fine)})`], scelto: true, base, copia: true };
    const sovrapposti = sog.filter(s => s.inizio < r.fine && r.inizio < s.fine);
    if (sovrapposti.length) { r.conflitti = sovrapposti.map(s => ({ id: s.id, nome: s.nome, inizio: s.inizio, fine: s.fine, notti: L.giorniTra(s.inizio, s.fine) })); r.comportamento = "insieme"; }
    out.push(r);
  }
  out.forEach((r, i) => { r.id = "c" + i; r.firma = `${r.azione}|${r.camera}|${r.inizio}|${r.fine}|${r.nome}`; });
  return out;
}

// La richiesta da incollare in un'intelligenza artificiale gratuita (Claude, ChatGPT, Gemini…) insieme alla FOTO
// del prospetto di papà: la risposta arriva già nel formato che questa app capisce.
export function richiestaPerIA() {
  const nomi = CAMERE.map(c => c.nome.replace(" · ", " ")).join(", ");
  return `Guarda la foto (o il file) del prospetto delle camere e scrivimi SOLO un elenco, una riga per camera, in questo formato esatto:
Camera: Nome ospite, N persone, dal GG mese al GG mese
(il giorno dopo "al" è il giorno di PARTENZA; usa i nomi dei mesi in italiano).
Le camere si chiamano esattamente: ${nomi}.
Se una camera è libera scrivi "Camera: libera". Se non sei sicuro di un nome o di una data metti un punto di domanda accanto.
Non aggiungere nient'altro: niente spiegazioni, niente tabelle.`;
}
