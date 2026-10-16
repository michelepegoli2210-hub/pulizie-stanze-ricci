// ============================================================================
//  PAROLE — capire quello che Michele scrive o detta alla governante (Michele, 16 ottobre:
//  "devo poter parlare liberamente con la governante tramite botta e risposta").
//  NIENTE intelligenza artificiale: si riconoscono le parole del catalogo, i posti e pochi verbi.
//  Qui si capisce soltanto; a fare le cose ci pensa app.js (eseguiParole), e prima chiede conferma.
// ============================================================================
import * as L from "./logica.js";

export function norm(t) {
  return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9°'\s]/g, " ").replace(/\s+/g, " ").trim();
}
// parole che non contano
export const STOP = new Set("il lo la i gli le un uno una di a da in con su per tra fra del dello della dei degli delle al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella nei negli nelle sul sullo sulla sui sugli sulle e ed o oppure ma se che chi cosa come quando dove perche poi anche pure gia ancora tutto tutta tutti tutte sono sei siamo siete stato stata stati state essere avere ho hai ha abbiamo avete hanno mi ti ci vi si me te se lui lei noi voi loro questo questa questi queste quel quella quelli quelle piu meno molto poco bene male si no non ok va vai fare fatto nella nelle sulla delle pulire pulita pulito puliti pulite lavare lavata lavato lavati lavate mettere messo messa messi messe stella stelle lavoro lavori settimana oggi domani ieri adesso subito stamattina favore scusa bisogna voglio devono deve falle fagli fammi aggiungi metti programma segna".split(" "));
// le parole di Michele tradotte in parole del catalogo
export const SINONIMI = {
  piumone: "piumino", piumoni: "piumino", trapunte: "trapunta", trapuntine: "trapunta", coperta: "coperte",
  filtro: "filtri condizionatore", filtri: "filtri condizionatore", condizionatori: "condizionatore", clima: "condizionatore", aria: "condizionatore",
  tenda: "tende", tendaggi: "tende", materassi: "materasso", frigorifero: "frigo", freezer: "frigo",
  vetri: "vetro finestra", vetro: "vetro finestra", finestre: "finestra", persiane: "persiana", tapparelle: "tapparella",
  asciugacapelli: "phon", scalinata: "scale", scala: "scale", termosifoni: "termosifone", caloriferi: "termosifone",
  cestini: "cestino", pattumiera: "bidone", bidoni: "bidone", immondizia: "bidone", spazzatura: "bidone",
  water: "wc", gabinetto: "wc", tazza: "wc", lavandini: "lavandino", rubinetti: "rubinetto",
  fornelli: "fornelli piastre", piastre: "piastre", cappa: "cappa", armadi: "armadio", cassetti: "cassetto",
  battiscopa: "battiscopa zoccolino", zoccolini: "battiscopa zoccolino", zoccolino: "battiscopa zoccolino",
  lampade: "lampada", lampadario: "lampada", luci: "lampada interruttore", specchi: "specchio",
  televisione: "tv", televisore: "tv", pavimenti: "pavimento", terra: "pavimento", balconi: "balcone",
  terrazza: "terrazzo", lenzuola: "lenzuola letto", asciugamani: "asciugamani", docce: "doccia", silicone: "silicone",
  muffa: "muffa", calcare: "calcare", ragnatele: "ragnatele", polvere: "polvere", spifferi: "guarnizione",
};
export const CORTE = new Set(["tv", "wc"]); // parole corte che contano lo stesso
export function parole(t) {
  const out = [];
  for (const w of norm(t).split(" ")) {
    if (!w || STOP.has(w) || (w.length < 3 && !CORTE.has(w))) continue;
    out.push(w);
    const sin = SINONIMI[w];
    if (sin) for (const x of sin.split(" ")) if (!out.includes(x)) out.push(x);
  }
  return [...new Set(out)];
}
const radice = (w) => w.length > 5 ? w.slice(0, -2) : w.length > 4 ? w.slice(0, -1) : w;
function contiene(testoNorm, w) { const r = radice(w); return testoNorm.includes(r); }

// ---- I posti -------------------------------------------------------------------------------------------------------
// "al primo piano", "in alba", "negli appartamenti", "in tutte", "via trento"
export function trovaLuoghi(testo, ctx) {
  const t = norm(testo), camere = ctx.camere || [], zone = ctx.zone || {};
  const perZona = (z) => camere.filter(c => c.zona === z).map(c => c.id); // il piano è il piano: "primo piano" sono le camere del 1°, non le camere di Lucia
  if (/\b(tutte|tutti|dappertutto|ovunque|tutta la casa|tutto l albergo)\b/.test(t)) return { camere: camere.map(c => c.id), etichetta: "tutte le camere", esplicito: true };
  const trovate = [];
  for (const c of camere) {
    const n = norm(c.nome).replace(/^via /, "");
    const chiavi = [norm(c.nome), n, n.split(" ")[0]].filter(x => x.length > 3);
    if (chiavi.some(k => t.includes(k))) trovate.push(c.id);
  }
  if (/\b(1|1°|primo) piano\b/.test(t) || /\bprimo\b/.test(t)) { for (const id of perZona("p1")) if (!trovate.includes(id)) trovate.push(id); }
  if (/\b(2|2°|secondo) piano\b/.test(t) || /\bsecondo\b/.test(t)) { for (const id of perZona("p2")) if (!trovate.includes(id)) trovate.push(id); }
  if (/\bappartament/.test(t)) for (const c of camere) if (c.tipo === "casa" && !trovate.includes(c.id)) trovate.push(c.id);
  if (/\balbergo\b/.test(t) && !trovate.length) for (const c of camere) if (c.tipo !== "casa") trovate.push(c.id);
  const nomi = trovate.map(id => (camere.find(c => c.id === id) || {}).nome).filter(Boolean);
  return { camere: trovate, etichetta: trovate.length > 4 ? `${trovate.length} posti` : nomi.join(", "), esplicito: trovate.length > 0 };
}
// ---- Le regole del catalogo ----------------------------------------------------------------------------------------
export function trovaRegole(testo, regole, max = 4) {
  const ps = parole(testo); if (!ps.length) return [];
  const t = norm(testo);
  const out = [];
  for (const r of regole) {
    if (r.tipo === "pulizia" || r.fuoriLivello) continue;
    const sup = norm(r.superficie || r.nome || ""), parte = norm(r.parte || ""), desc = norm(r.regola || r.come || "");
    let punti = 0, forte = false;
    for (const w of ps) {
      if (contiene(sup, w)) { punti += 3; forte = true; }
      else if (parte && contiene(parte, w)) { punti += 2; forte = true; }
      else if (desc && contiene(desc, w)) punti += 0.7;
    }
    // la frase nomina tutta la superficie ("coperte e piumoni" dentro "Piumino, trapunta, coperte")
    if (sup && sup.split(" ").filter(w => w.length > 3).every(w => t.includes(radice(w)))) { punti += 2; forte = true; }
    // meno parole "di troppo" ha la superficie, più la frase la indica davvero
    const paroleSup = sup.split(" ").filter(w => w.length > 3 && !STOP.has(w));
    const nonDette = paroleSup.filter(w => !ps.some(x => contiene(w, x) || contiene(x, w))).length;
    punti -= nonDette * 0.4;
    if (forte && punti >= 2) out.push({ r, punti });
  }
  out.sort((a, b) => b.punti - a.punti || (a.r.minuti || 0) - (b.r.minuti || 0));
  // tengo la migliore per codice (le "parti" della stessa superficie non si ripetono)
  const visti = new Set(), scelte = [];
  for (const x of out) { if (visti.has(x.r.codice)) continue; visti.add(x.r.codice); scelte.push(x); if (scelte.length >= max) break; }
  return scelte;
}
// ---- Che cosa vuole ---------------------------------------------------------------------------------------------
const RE = {
  aggiungi: /(^|\s)(aggiungi|aggiungimi|fai|falle|fagli|fammi|metti|mettile|mettigli|programma|voglio|bisogna|devono|deve|facciano|faccia|pulisci|lava|cambia)\b/,
  fatto: /\b(ho|abbiamo|ha|hanno|sono|e|era|erano|gia)\b.*\b(fatt\w+|mess\w+|pulit\w+|lavat\w+|cambiat\w+|sistemat\w+|finit\w+|a posto)\b|\b(fatt\w+|mess\w+|pulit\w+|lavat\w+|cambiat\w+|sistemat\w+|finit\w+)\b.*\b(oggi|ieri|stamattina|adesso|appena|gia|ultimamente|questa settimana)\b|^\s*(fatt\w+|mess\w+|pulit\w+|lavat\w+|cambiat\w+)\b/,
  togli: /\b(togli|toglimi|non (fare|farla|farlo|farle|farli)|lascia stare|salta|rimanda|basta con|annulla|cancella|elimina|leva)\b/,
  messaggio: /\b(di'? alle signore|dì alle signore|dillo alle signore|scrivi alle signore|avvisa le signore|manda un messaggio|messaggio alle signore|digli|dille|di'? a)\b/,
  quando: /^\s*(quando|da quanto|l ultima volta|ultima volta)\b|\bquando (e|è) stat\w+|\bquando abbiamo\b|\bquando hanno\b/,
  quanto: /\bquanto\b.*\b(spendo|costa|costano|prende|pago|paghiamo|viene)\b|\bquanto\b\s*$|\bquanto (spendo|costa|prende|pago)\b/,
  piano: /\b(chi (pulisce|fa|viene|lavora))\b|\bcosa (si fa|fanno|fa)\b|\bche cosa si fa\b|\bche si fa\b|\bprogramma di\b/,
  saluto: /^\s*(ciao|buongiorno|buonasera|buonanotte|grazie|ok|va bene|perfetto|bene|brava|salve)\b/,
};
export function capisci(testo, ctx) {
  const t = norm(testo);
  if (!t) return { tipo: "boh", testo: "Non ho sentito niente. Riprova: scrivi o tieni premuto il microfono della tastiera." };
  const regole = ctx.regole || [], luoghi = trovaLuoghi(testo, ctx);
  const match = trovaRegole(testo, regole);
  const prima = match[0];

  if (RE.saluto.test(t) && t.split(" ").length <= 4)
    return { tipo: "saluto", testo: pescaSaluto(t, ctx) };

  if (RE.messaggio.test(t)) {
    const dopo = testo.replace(/^.*?(signore|digli|dille)\b[:,]?\s*/i, "").replace(/^che\s+/i, "").trim() || testo.trim();
    const giorno = /\bdomani\b/.test(t) ? L.aggiungiGiorni(ctx.oggi, 1) : ctx.oggi;
    return { tipo: "messaggio", testo: `Scrivo alle signore per ${giorno === ctx.oggi ? "oggi" : "domani"}: «${dopo}». Lo vedono in cima alla loro schermata. Mando?`,
      azione: { tipo: "messaggio", giorno, testo: dopo }, tasti: [{ k: "si", testo: "Sì, scrivilo" }, { k: "no", testo: "No, lascia" }] };
  }
  if (RE.quando.test(t)) {
    if (!prima) return { tipo: "boh", testo: "Di che cosa? Dimmi il nome della cosa (per esempio «quando abbiamo fatto le tende di Alba»).", suggerimenti: match };
    return { tipo: "quando", testo: "", azione: { tipo: "quando", regola: prima.r, camere: luoghi.camere }, chiedi: { regola: prima.r, luoghi } };
  }
  if (RE.quanto.test(t)) return { tipo: "conto", testo: "", azione: { tipo: "conto", chi: chiNomi(testo, ctx) } };
  if (RE.piano.test(t)) {
    const giorno = /\bdomani\b/.test(t) ? L.aggiungiGiorni(ctx.oggi, 1) : /\bieri\b/.test(t) ? L.aggiungiGiorni(ctx.oggi, -1) : ctx.oggi;
    return { tipo: "piano", testo: "", azione: { tipo: "piano", giorno, chi: chiNomi(testo, ctx) } };
  }
  if (RE.togli.test(t)) {
    if (!prima) return { tipo: "boh", testo: "Che cosa tolgo? Dimmi il nome della cosa (per esempio «non fare i condizionatori questa settimana»).", suggerimenti: match };
    const q = quale(match, "togli", luoghi); if (q) return q;
    const perSempre = /\b(per sempre|mai piu|non (la|lo|le|li) voglio|togli la regola|spegni)\b/.test(t);
    return { tipo: "togli", testo: perSempre
        ? `Spengo la regola «${prima.r.nome}»: non la propongo più finché non me lo dici tu. Confermo?`
        : `Tolgo «${prima.r.nome}»${luoghi.esplicito ? ` da ${luoghi.etichetta}` : ""} dalle stelle di questa settimana: al suo posto entra la prossima più in ritardo. Confermo?`,
      azione: { tipo: "togli", regola: prima.r, camere: luoghi.camere, perSempre },
      tasti: [{ k: "si", testo: perSempre ? "Sì, spegnila" : "Sì, togli" }, { k: "no", testo: "No, lascia" }] };
  }
  if (RE.aggiungi.test(t) && !RE.fatto.test(t)) {
    const cosa = prima ? prima.r.nome : ripulisciCosa(testo);
    if (!luoghi.esplicito) return { tipo: "boh", testo: `«${cosa}» dove? Dimmi la camera (per esempio «in Alba», «al 2° piano», «in tutte»).`, azioneParziale: { tipo: "aggiungi", regola: prima ? prima.r : null, cosa } };
    const q = quale(match, "aggiungi", luoghi); if (q) return q;
    const minuti = prima ? (prima.r.minuti || 10) : 15;
    return { tipo: "aggiungi", testo: "", azione: { tipo: "aggiungi", regola: prima ? prima.r : null, cosa, camere: luoghi.camere, minuti }, chiedi: { luoghi } };
  }
  if (RE.fatto.test(t)) {
    const q = quale(match, "fatto", luoghi); if (q) return q;
    if (!prima) return { tipo: "boh", testo: "Che cosa avete fatto? Dimmi il nome della cosa, come la chiama il catalogo (per esempio «i piumoni», «i filtri dei condizionatori»).", suggerimenti: match };
    const quando = /\bieri\b/.test(t) ? L.aggiungiGiorni(ctx.oggi, -1) : ctx.oggi;
    return { tipo: "fatto", testo: "", azione: { tipo: "fatto", regola: prima.r, altre: match.slice(1, 3).map(x => x.r), camere: luoghi.camere, giorno: quando }, chiedi: { luoghi } };
  }
  // niente verbo: se ha nominato una cosa del catalogo, chiedo che cosa vuole farne
  if (prima) return { tipo: "scelta", testo: `«${prima.r.nome}»${luoghi.esplicito ? ` in ${luoghi.etichetta}` : ""}: che faccio?`,
    azione: null, scelte: { regola: prima.r, camere: luoghi.camere },
    tasti: [{ k: "fatto", testo: "È già fatta" }, { k: "aggiungi", testo: "Falla fare" }, { k: "quando", testo: "Quando è stata fatta?" }, { k: "no", testo: "Niente" }] };
  return { tipo: "boh", testo: "Non ho capito. Posso: segnare una cosa come fatta, farla mettere alle signore, toglierla, scrivere un messaggio alle signore, dirti quando è stata fatta l'ultima volta o quanto spendi. Dimmelo con parole semplici, per esempio «ho fatto i piumoni», «fai lavare le tende in Alba», «quanto prende Lucia?»." };
}
// Quando due cose del catalogo si somigliano ("i condizionatori": filtri? griglia? telecomando?), la governante chiede quale.
function quale(match, tipo, luoghi) {
  if (match.length < 2 || match[0].punti - match[1].punti > 0.8) return null;
  // due righe che si chiamano uguale non sono una scelta: non ha senso chiedere "Tende o Tende?"
  const visti = new Set();
  const vicine = match.filter(x => match[0].punti - x.punti <= 0.8).filter(x => { const n = norm(x.r.nome); if (visti.has(n)) return false; visti.add(n); return true; }).slice(0, 3);
  if (vicine.length < 2) return null;
  const verbo = tipo === "fatto" ? "Quale avete fatto" : tipo === "togli" ? "Quale tolgo" : "Quale faccio fare";
  return { tipo: "quale", testo: `${verbo}?${luoghi.esplicito ? ` (${luoghi.etichetta})` : ""}`,
    scelteRegole: { tipo, regole: vicine.map(x => x.r), camere: luoghi.camere },
    tasti: [...vicine.map((x, i) => ({ k: "r" + i, testo: x.r.nome })), ...(vicine.length > 1 ? [{ k: "tutte", testo: "Tutte e " + (vicine.length === 2 ? "due" : vicine.length) }] : []), { k: "no", testo: "Nessuna" }] };
}
function ripulisciCosa(testo) {
  return String(testo).replace(/^\s*(aggiungi|aggiungimi|fai fare|fai pulire|fai lavare|fai mettere|fai|falle|fagli|fammi|metti in programma|metti|programma|segna di fare|voglio che|bisogna)\b\s*/i, "")
    .replace(/\b(una stella|un lavoro|un extra)\b[:,]?\s*/i, "").replace(/\s*\b(in|a|al|alla|negli|nelle|nel|per)\s+[a-zà-ù'° ]+$/i, "").trim() || String(testo).trim();
}
function chiNomi(testo, ctx) {
  const t = norm(testo);
  for (const [z, v] of Object.entries(ctx.zone || {})) { const n = norm(v.persona || v.nome || ""); if (n && n.length > 2 && t.includes(n.split(" ")[0])) return z; }
  return null;
}
function pescaSaluto(t, ctx) {
  if (/grazie|brava|perfetto|bene|ok|va bene/.test(t)) return ["Grazie a te!", "Quando vuoi.", "Di niente: sono qui."][Math.floor(Math.random() * 3)];
  const ora = ctx.ora != null ? ctx.ora : 10;
  const s = ora < 13 ? "Buongiorno" : ora < 18 ? "Buon pomeriggio" : "Buonasera";
  return `${s}, Michele! Dimmi pure: posso segnare una cosa come fatta, farla fare alle signore, toglierla, o dirti quanto spendi.`;
}
