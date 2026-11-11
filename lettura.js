// ============================================================================
//  LETTURA.JS  ·  1.18.0 · come Sofia legge le chat di WhatsApp (il prospetto di papà e il resto)
//  Prima queste funzioni stavano dentro app.js e servivano solo all'app aperta. Adesso le usa ANCHE il giro sempre
//  acceso (sofia-giro, su GitHub), che legge i messaggi del ponte quando l'app è chiusa: così la richiesta a Gemini
//  è la stessa, parola per parola, chiunque la faccia. Niente pagina, niente database: solo testo.
//  Il "contesto" (ctx) lo prepara chi chiama:
//   { oggi, camere:[{id,nome,tipo,via,zona}], soggiorni:[{camera,nome,persone,tipo,inizio,fine,nota}], clienti:{id:{nome}},
//     signore:[{id,nome}], nomeGov, nomeMio, alias:{camera:[modi di dirla]}, tipiOspite, taccuino:"testo per l'IA",
//     chatPrivate:["Papà","Selly",...] }
//  I nomi degli ospiti che l'app conosce partono come codici [O1], [O2]... (aCodici) e tornano nomi (daCodici);
//  telefoni ed email non partono mai (segnaposto [telefono1], [email]).
// ============================================================================
import * as L from "./logica.js";
import * as PAROLE from "./parole.js";

const NUCLEO_RE = /\s*[·,;(\/]\s*|\s+-\s+/;
export function nucleoNome(n) { return String(n || "").split(NUCLEO_RE)[0].replace(/\d.*$/, "").replace(/\s+/g, " ").trim(); }

// ---- i codici degli ospiti ---------------------------------------------------------------------------------------------
// 1.51.0: come SUONA un nome (senza h, senza doppie): «Rahhal», «Raal» → «ral». Serve per i cognomi sbagliati nei vocali trascritti
export function chiaveSuono(w) { return PAROLE.norm(w).replace(/[^a-z]/g, "").replace(/h/g, "").replace(/k/g, "c").replace(/[yj]/g, "i").replace(/w/g, "v").replace(/(.)\1+/g, "$1"); }
function distanzaParole(a, b) { const m = a.length, n = b.length; if (Math.abs(m - n) > 1) return 2; const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
const PAROLE_COMUNI = new Set(["ciao", "allora", "domani", "oggi", "ieri", "senti", "grazie", "buongiorno", "buonasera", "buonanotte", "mamma", "papa", "michele", "lucia", "selena", "sele", "selly", "ok", "okay", "va", "bene", "si", "no", "eh", "ah", "mo", "uè", "ue", "come", "quando", "dove", "perche", "anche", "pero", "quindi", "poi", "prima", "dopo", "sono", "sta", "stanno", "fammi", "dimmi", "fatti", "vedi", "lascia", "metti"]);
export function creaCodici(ctx) {
  const sog = ctx.soggiorni || [], cl = ctx.clienti || {};
  const via = new Set([...(ctx.camere || []).map(c => PAROLE.norm(c.nome)), ...(ctx.camere || []).map(c => PAROLE.norm(c.id)), ...(ctx.signore || []).map(z => PAROLE.norm(z.nome)), PAROLE.norm(ctx.nomeGov || ""), PAROLE.norm(ctx.nomeMio || ""),
    "michele", "papa", "ospiti", "ospite", "operai", "operaio", "tecnici", "tecnico", "booking", "famiglia", "signora", "signor", "ditta", "coppia", "libera", "libero", "zara", "trento", "via"]);
  const nuclei = new Map();
  const metti = (grezzo) => { const n = nucleoNome(grezzo); if (n.length < 2 || /^\?|^(ospit|qualcun|nessun)/i.test(n) || via.has(PAROLE.norm(n))) return; const k = PAROLE.norm(n); if (k && !nuclei.has(k)) nuclei.set(k, n); };
  for (const s of sog) metti(s.nome);
  for (const [k, v] of Object.entries(cl)) metti((v && v.nome) || k);
  const elenco = [...nuclei.entries()].sort((a, b) => a[1].localeCompare(b[1], "it"));
  const nomi = new Map(), codice = new Map();
  elenco.forEach(([k, n], i) => { const c = `[O${i + 1}]`; nomi.set(c, n); codice.set(k, c); });
  const cand = [];
  const aggiungi = (testo, c) => { const t = String(testo || "").trim(); if (t.length >= 2 && c) cand.push({ t, c }); };
  for (const [k, n] of elenco) aggiungi(n, codice.get(k));
  for (const s of sog) { const c = codice.get(PAROLE.norm(nucleoNome(s.nome))); if (c) aggiungi(String(s.nome || "").trim(), c); }
  // le parole lunghe del nome ("Rega Enzo" -> "Rega", "Enzo"), solo con la maiuscola e solo se sono di un ospite solo
  const parole = new Map();
  for (const [k, n] of elenco) for (const w of n.split(/\s+/)) {
    if (w.length < 4 || !/^[A-ZÀ-Ý]/.test(w) || via.has(PAROLE.norm(w))) continue;
    const kw = PAROLE.norm(w); if (!parole.has(kw)) parole.set(kw, { w, c: new Set() }); parole.get(kw).c.add(codice.get(k));
  }
  for (const { w, c } of parole.values()) if (c.size === 1) { const cc = [...c][0]; aggiungi(w, cc); if (w !== w.toUpperCase()) aggiungi(w.toUpperCase(), cc); }
  const visti = new Set();
  const regole = cand.filter(x => { const k = x.t + "→" + x.c; if (visti.has(k)) return false; visti.add(k); return true; })
    .sort((a, b) => b.t.length - a.t.length).map(x => {
      const e = x.t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/['’]/g, "['’]").replace(/\s+/g, "\\s+");
      const molte = /\s/.test(x.t);          // piu' parole: maiuscole o minuscole non importa; una parola sola: come e' scritta
      return { re: new RegExp(`(^|[^\\p{L}\\[])(${e})(?=$|[^\\p{L}\\]])`, molte ? "giu" : "gu"), c: x.c };
    });
  // 1.51.0: i cognomi «come suonano», solo se sono di un ospite solo (la camera e le persone note non si toccano mai)
  for (const lista of Object.values(ctx.alias || {})) for (const al of (lista || [])) via.add(PAROLE.norm(al));
  const suoni = new Map();
  for (const [k, n] of elenco) for (const w of n.split(/\s+/)) {
    const pulita = w.replace(/[^\p{L}]/gu, ""); if (pulita.length < 4 || via.has(PAROLE.norm(pulita))) continue;
    const s = chiaveSuono(pulita); if (s.length < 3) continue;
    const c = codice.get(k); suoni.set(s, suoni.has(s) && suoni.get(s) !== c ? null : c);
  }
  const perSuono = (w) => {
    const n = PAROLE.norm(w); if (!n || via.has(n) || PAROLE_COMUNI.has(n) || (PAROLE.STOP && PAROLE.STOP.has && PAROLE.STOP.has(n))) return null;
    const s = chiaveSuono(w); if (s.length < 3) return null;
    if (suoni.get(s)) return suoni.get(s);
    if (/^[aeiou]/.test(n) && suoni.get(chiaveSuono(w.slice(1)))) return suoni.get(chiaveSuono(w.slice(1)));   // «Aral» = «a Rahhal»
    if (s.length >= 6 && !NON_NOME.has(n)) { let trovato = null; for (const [k2, c2] of suoni) if (c2 && k2.length >= 6 && distanzaParole(k2, s) <= 1) { if (trovato && trovato !== c2) return null; trovato = c2; } return trovato; }
    return null;
  };
  const aCodici = (t) => {
    let x = String(t ?? ""); if (!x) return x;
    for (const r of regole) x = x.replace(r.re, (m, a) => a + r.c);
    if (suoni.size) x = x.replace(/(^|[^\p{L}\[])(\p{Lu}[\p{L}'’]{2,})(?=$|[^\p{L}\]])/gu, (m, a, w) => { const c = perSuono(w); return c ? a + c : m; });
    return x;
  };
  const daCodici = (t) => String(t ?? "").replace(/\[\s*O\s*(\d{1,4})\s*\]/g, (m, n) => nomi.get(`[O${n}]`) || m);
  const daCodiciProfondo = (v) => { if (typeof v === "string") return daCodici(v); if (Array.isArray(v)) return v.map(daCodiciProfondo); if (v && typeof v === "object") { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = daCodiciProfondo(x); return o; } return v; };
  return { nomi, regole, aCodici, daCodici, daCodiciProfondo };
}
// la "firma" dei codici: se non cambiano i nomi, i codici restano gli stessi (l'app li tiene da parte)
export function firmaCodici(ctx) { return (ctx.soggiorni || []).map(s => s.nome || "").join("|") + "#" + Object.keys(ctx.clienti || {}).join("|"); }

// ---- 1.38.0: un nome che NON è un nome -----------------------------------------------------------------------------------
// Nel prospetto vero di Michele erano finiti «Allora Cambiato Abbiamo Messo» e «Mi Sai Dire Quando O Se Lunedì»: pezzi di
// vocale messi nel campo "nome" dal modello svelto. Un nome di ospite è 1-3 parole (cognome, nome, ditta), senza le parole
// del parlato. Se sembra una frase, l'app mette "?" e chiede a Michele chi è.
const ARTICOLI_NOME = new Set(["la", "lo", "le", "li", "di", "de", "del", "della", "dello", "dei", "degli", "delle", "da", "d", "e", "el", "al", "van", "von", "san", "santa"]);
const NON_NOME = new Set([...PAROLE.STOP, "allora", "cambiato", "cambia", "cambiamo", "cambiano", "sai", "dire", "dimmi", "dici", "dico", "lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato", "domenica", "dopodomani", "stasera", "sera", "mattina", "notte", "dopo", "prima", "cioe", "quindi", "forse", "arriva", "arrivano", "arrivato", "arrivati", "arrivare", "parte", "partono", "partito", "partiti", "partire", "viene", "vengono", "venuto", "venuti", "venire", "andare", "vanno", "andato", "resta", "restano", "rimane", "rimangono", "rimasto", "torna", "tornano", "tornato", "camera", "stanza", "stanze", "camere", "giorno", "giorni", "mese", "perche", "pero", "quello", "quella", "questi", "altro", "altra", "altri", "stesso", "stessa", "niente", "nulla", "okay", "ecco", "dunque", "insomma", "praticamente", "comunque", "magari", "appunto", "libera", "libero", "occupata", "occupato", "lenzuola", "asciugamani", "chiavi", "chiave", "persone", "persona", "ragazzi", "ragazzo", "telefono", "numero", "chiamato", "chiamata", "chiama", "chiamare", "sentito", "sento", "detto", "dice", "dicono", "vediamo", "vedere", "vedi", "visto", "penso", "credo", "sembra", "dovrebbe", "dovrebbero", "possono", "puo", "posso", "potrebbe", "sta", "stanno", "stare", "sempre", "mai", "quasi", "ora", "volta", "volte", "sopra", "sotto", "dentro", "fuori", "piano", "terra", "zara", "trento", "albergo", "appartamento", "casa", "quando", "mettiamo", "mettere", "messo", "metti", "fatto", "fare", "facciamo", "abbiamo", "siamo", "sono", "hanno", "avevo", "aveva", "avevano", "era", "erano", "sara", "saranno", "tecnico", "tecnici", "operaio", "operai", "cliente", "clienti", "ospite", "ospiti", "signore", "signora", "signori", "uomo", "donna", "tizio", "tipo", "ragazza", "gruppo", "squadra", "so", "boh", "nessuno", "qualcuno", "qualcuna", "altre", "stessi", "nuovo", "nuova", "nuovi", "vecchio", "solito", "soliti", "solita", "ditta"]);
export function nomeSospetto(nome) {
  const n = String(nome || "").trim(); if (!n || n === "?") return false;
  if (/\d{3,}/.test(n) || /[?!]$/.test(n)) return true;
  const p = PAROLE.norm(n).split(" ").filter(Boolean); if (!p.length) return true;
  if (/^(sig|sigra|signora|signor|famiglia|fam|ditta|coppia|dott|ing|avv)$/.test(p[0])) p.shift();
  const vere = p.filter(w => !ARTICOLI_NOME.has(w)), brutte = vere.filter(w => NON_NOME.has(w)).length;
  return p.length >= 6 || brutte >= 2 || (brutte >= 1 && vere.length >= 3) || vere.length >= 5;
}
// il nome ripulito: spazi doppi, punteggiatura in fondo, TUTTO MAIUSCOLO → Nome Cognome
export function puliziaNome(nome) {
  let n = String(nome || "").replace(/\s+/g, " ").replace(/[\s.,;:!]+$/, "").trim();
  if (n.length > 3 && n === n.toUpperCase() && n !== n.toLowerCase()) n = n.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  return n;
}

// ---- telefoni ed email: mai a Gemini ---------------------------------------------------------------------------------
export function senzaTelefoni(t) { return String(t || "").replace(/\+?\d(?:[\s.\-]?\d){7,}/g, "[telefono]").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]"); }
// 1.0.6: i telefoni diventano segnaposto numerati ([telefono1], [telefono2]...); la tabella segnaposto -> numero resta a
// chi legge, cosi' Sofia puo' dire di chi e' il numero senza mai vederlo
export function telefoniInSegnaposto(t, mappa) {
  return String(t || "").replace(/\+?\d(?:[\s.\-]?\d){7,}/g, (m) => {
    for (const [k, v] of mappa) if (v === m.trim()) return k;
    const k = `[telefono${mappa.size + 1}]`; mappa.set(k, m.trim()); return k;
  }).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]");
}
// nel JSON di Sofia: il segnaposto del campo "telefono" torna il numero vero (solo li': note e messaggi restano coi segnaposto)
export function rimettiTelefoni(j, mappa) {
  if (!j || typeof j !== "object") return j;
  const vero = (x) => { const m = /\[\s*telefono\s*(\d{1,3})\s*\]/i.exec(String(x || "")); return m && mappa ? (mappa.get(`[telefono${m[1]}]`) || "") : ""; };
  for (const k of ["soggiorni", "telefoni"]) if (Array.isArray(j[k])) for (const x of j[k]) { if (x && typeof x === "object") x.telefono = vero(x.telefono); }   // 1.38.0: anche la rubrica
  if (Array.isArray(j.perTe) && mappa) for (const x of j.perTe) { if (x && typeof x === "object" && x.cosa) x.cosa = String(x.cosa).replace(/\[\s*telefono\s*(\d{1,3})\s*\]/gi, (m, n) => mappa.get(`[telefono${n}]`) || m); }   // 1.62.0
  return j;
}
// il tipo di ospite detto a Sofia: le ditte col loro codice (sono anche clienti col nome), cosi' nessun nome esce in chiaro
export function tipoPerIA(k, ctx, codici) { const t = (ctx.tipiOspite || {})[k]; if (!t) return k || "?"; return k === "ferr" ? "tecnici" : k === "altro" ? "turisti / Booking" : k === "unk" ? "da chiarire" : codici.aCodici("ditta " + t.nome); }
// il prospetto che c'e', camera per camera, coi nomi in codice (per Sofia)
export function prospettoInCodici(ctx, codici, da, a) {
  const per = new Map();
  for (const s of (ctx.soggiorni || []).filter(s => s.fine > da && s.inizio < a).sort((x, y) => x.inizio < y.inizio ? -1 : 1)) { const l = per.get(s.camera) || []; l.push(s); per.set(s.camera, l); }
  return (ctx.camere || []).map(c => {
    const l = per.get(c.id) || [];
    return `- ${c.nome} [${c.id}]: ${l.length ? l.map(s => `${codici.aCodici(s.nome || "?")}${s.persone > 1 ? `, ${s.persone} persone` : ""}, ${tipoPerIA(s.tipo, ctx, codici)}, arriva ${L.dataMedia(s.inizio)} (${s.inizio}) → parte ${L.dataMedia(s.fine)} (${s.fine})${s.nota ? `, nota: ${codici.aCodici(s.nota)}` : ""}`).join(" · ") : "libera"}`;
  }).join("\n");
}

// ---- 1.39.0: la Segreteria: quello che Sofia ha capito, nella forma che resta da parte (coi nomi veri: la raccolta è dei titolari)
export function perSegreteria(j) {
  const x = j && typeof j === "object" ? j : {};
  const p = (k, n) => (Array.isArray(x[k]) ? x[k] : []).filter(v => v && typeof v === "object").slice(0, n).map(v => { const o = {}; for (const [a, b] of Object.entries(v)) { if (b === undefined || b === null) continue; if (Array.isArray(b)) { const l = b.filter(z => z !== null && typeof z !== "object").slice(0, 14).map(z => typeof z === "string" ? z.slice(0, 80) : z); if (l.length) o[a] = l; } else if (typeof b !== "object") o[a] = typeof b === "string" ? b.slice(0, 400) : b; } return o; });   // 1.51.0: anche le liste
  return { risposta: String(x.risposta || "").slice(0, 700), soggiorni: p("soggiorni", 60), togli: p("togli", 20), indicazioni: p("indicazioni", 20), assenze: p("assenze", 10), guasti: p("guasti", 10), spesa: p("spesa", 10), note: p("note", 10), ore: p("ore", 14), telefoni: p("telefoni", 10),
    ...(Array.isArray(x.azioni) ? { azioni: p("azioni", 24), proposte: p("proposte", 12) } : {}),   // 1.51.0
    ...(Array.isArray(x.perTe) ? { perTe: p("perTe", 8) } : {}), ...(Array.isArray(x.capito) ? { righe: p("capito", 30) } : {}),   // 1.62.0
    dubbi: (Array.isArray(x.dubbi) ? x.dubbi : []).slice(0, 12).map(d => ({ domanda: String(d && typeof d === "object" ? (d.domanda || d.testo || "") : d || "").slice(0, 200), risposte: d && typeof d === "object" && Array.isArray(d.risposte) ? d.risposte.slice(0, 4).map(r => String(r).slice(0, 40)) : [], ...(d && typeof d === "object" && d.chi ? { chi: String(d.chi).slice(0, 40) } : {}) })).filter(d => d.domanda) };
}
// 1.62.0 (Segreteria nuova): «🔔 Da fare tu» — le cose che deve fare Michele in persona, con lo stato (fatto, rimanda) che
// segna l'app e che il giro guarda per l'allarme. «entro»: «AAAA-MM-GGTHH:MM» (ora di Lesina), «AAAA-MM-GG» o vuoto.
export function entroDa(t, oggi) {
  const s = String(t || "").trim(); let m;
  const ok = (h, mi) => Number(h) <= 23 && Number(mi) <= 59;
  if ((m = /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2})[:.](\d{2})/.exec(s)) && ok(m[2], m[3])) return `${m[1]}T${m[2].padStart(2, "0")}:${m[3]}`;
  if ((m = /^(\d{1,2})[:.](\d{2})$/.exec(s)) && oggi && ok(m[1], m[2])) return `${oggi}T${m[1].padStart(2, "0")}:${m[2]}`;
  if ((m = /^(\d{4}-\d{2}-\d{2})$/.exec(s))) return m[1];
  return "";
}
export function perTeDa(j, oggi) {
  return (Array.isArray(j && j.perTe) ? j.perTe : []).filter(x => x && typeof x === "object" && String(x.cosa || "").trim()).slice(0, 8).map((x, i) => ({
    k: "t" + i, testo: String(x.cosa).replace(/\s+/g, " ").trim().slice(0, 160), entro: entroDa(x.entro, oggi), chi: String(x.chi || "").replace(/\s+/g, " ").trim().slice(0, 40),
    msg: String(x.messaggio || "").replace(/\s+/g, " ").trim().slice(0, 200), fatto: "", rimanda: "",
    // 1.76.0: se l'ha chiesta lui a Sofia, se l'ha già vista (ha scritto dopo in quella chat), e da dove viene (chat e ora del messaggio)
    ...(x.richiesto === true ? { richiesto: true } : {}), ...(x.visto === true ? { visto: true } : {}),
    ...(x.chat ? { chat: String(x.chat).slice(0, 60) } : {}), ...(x.mdata ? { mdata: String(x.mdata).slice(0, 10) } : {}), ...(x.mora ? { mora: String(x.mora).slice(0, 5) } : {}), ...(Number(x.mts) ? { mts: Number(x.mts) } : {}) }));
}
// rileggendo (con una correzione) le cose già fatte restano fatte
const nPerTe = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
export function perTeTieni(nuove, vecchie) {
  return (nuove || []).map(t => { const v = (vecchie || []).find(y => y && nPerTe(y.testo) === nPerTe(t.testo)); return v ? { ...t, fatto: v.fatto || "", rimanda: v.rimanda || "" } : t; });
}
// e quante volte ha già suonato (il giro): così una rilettura non la fa risuonare subito
export function perTeAvvisiTieni(nuove, vecchie, avvisi) {
  const out = {};
  for (const t of (nuove || [])) { const v = (vecchie || []).find(y => y && nPerTe(y.testo) === nPerTe(t.testo)); if (v && avvisi && avvisi[v.k]) out[t.k] = avvisi[v.k]; }
  return out;
}

// ---- il taccuino senza nomi di ospiti ---------------------------------------------------------------------------------
export function nomiOspiti(ctx) {
  const via = new Set([...(ctx.camere || []).map(c => PAROLE.norm(c.nome)), ...(ctx.signore || []).map(z => PAROLE.norm(z.nome)), PAROLE.norm(ctx.nomeGov || ""), PAROLE.norm(ctx.nomeMio || ""), "michele", "ospiti", "ospite", "operai", "tecnici", "booking"]);
  const interi = new Set(), parole = new Set();
  const metti = (grezzo) => {
    const n = String(grezzo || "").split(/\s*[·,;(\/]\s*|\s+-\s+/)[0].replace(/\d.*$/, "").trim();
    if (n.length < 3 || /^(ospit|qualcun|nessun|\?)/i.test(n) || via.has(PAROLE.norm(n))) return;
    interi.add(n);
    for (const w of n.split(/\s+/)) if (w.length >= 4 && /^[A-ZÀ-Ý]/.test(w) && !via.has(PAROLE.norm(w))) parole.add(w);
  };
  for (const x of (ctx.soggiorni || [])) metti(x.nome);
  for (const k of Object.keys(ctx.clienti || {})) metti(k);
  const lungo = (a, b) => b.length - a.length;
  return { interi: [...interi].sort(lungo), parole: [...parole].filter(w => !interi.has(w)).sort(lungo) };
}
export function senzaNomiOspiti(t, ctx, nomi = nomiOspiti(ctx)) {
  let x = String(t || "");
  const { interi, parole } = nomi;
  const sost = (n, flag) => { const e = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]"); x = x.replace(new RegExp(`(^|[^\\p{L}])${e}(?=$|[^\\p{L}])`, flag), "$1l'ospite"); };
  for (const n of interi) sost(n, "giu");
  for (const w of parole) sost(w, "gu");
  return x;
}
export function taccuinoPerIA(voci, ctx) {
  const v = (Array.isArray(voci) ? voci : []).filter(y => y && y.testo);
  if (!v.length) return "Ancora vuoto: comincia a segnare le cose che valgono anche in futuro (azione \"ricorda\").";
  const nomi = nomiOspiti(ctx);
  return v.map((y, i) => `M${i + 1} (${L.dataBreve(y.quando)}${y.da === "michele" ? ", scritta da Michele" : ""}): ${senzaNomiOspiti(y.testo, ctx, nomi)}`).join("\n");
}

// ---- le istruzioni per Sofia --------------------------------------------------------------------------------------------
// 1.18.0: le signore coi loro codici; e chi scrive nelle chat con un nome diverso (soprannome, nome e cognome)
export function signoreInParole(ctx) {
  const sig = (ctx.signore || []).filter(z => z && z.id && z.nome);
  if (!sig.length) return "LE SIGNORE DELLE PULIZIE: nessuna segnata nell'app.";
  const righe = sig.map(z => `- ${z.id} = ${z.nome}${z.zona ? ` (${z.zona})` : ""}`);
  const nomiChat = [...new Set((ctx.persone || []).map(x => String(x || "").trim()).filter(x => x && !/^pap[aà]$/i.test(x) && !/michele/i.test(x)))];
  const prime = (s) => PAROLE.norm(s).replace(/\s+/g, "").slice(0, 3);
  const somiglia = [];
  for (const n of nomiChat) {
    const kn = PAROLE.norm(n);
    const z = sig.find(z => { const kz = PAROLE.norm(z.nome); return kz && (kn === kz || kn.split(" ").includes(kz) || (prime(n).length === 3 && prime(n) === prime(z.nome))); });
    if (z && PAROLE.norm(z.nome) !== kn) somiglia.push(`«${n}» è probabilmente ${z.nome} (${z.id})`);
  }
  return `LE SIGNORE DELLE PULIZIE (nel JSON usa questi codici):\n${righe.join("\n")}${somiglia.length ? `\nNelle chat possono avere un altro nome: ${somiglia.join("; ")}.` : ""}`;
}
export function istruzioniLettura(ctx, codici = creaCodici(ctx)) {
  if (ctx.prospettoChat === false) return istruzioniLetturaChat(ctx, codici);   // 1.51.0: le chat di WhatsApp (modo nuovo)
  const oggi = ctx.oggi, alias = ctx.alias || {};
  const soloExcel = ctx.prospettoChat === false;   // 1.49.0: il prospetto arriva dal foglio Excel di papà, non dalle chat
  const camere = (ctx.camere || []).map(c => `- ${c.id} = ${c.nome} (${c.tipo === "casa" ? "appartamento" : "camera"}${c.via ? ", " + c.via : ""}${c.zona === "p1" ? ", 1° piano" : c.zona === "p2" ? ", 2° piano" : ""}; si dice anche: ${[...new Set((alias[c.id] || []).filter(x => x !== PAROLE.norm(c.nome)))].slice(0, 7).join(", ") || "—"})`).join("\n");
  const tipi = Object.keys(ctx.tipiOspite || {}).map(k => `${k} = ${tipoPerIA(k, ctx, codici)}`).join("; ");
  const da = L.aggiungiGiorni(oggi, -14), a = L.aggiungiGiorni(oggi, 60);
  const tacc = String(ctx.taccuino || "");
  return `Sei ${ctx.nomeGov}, la governante de "Le Stanze di Ricci" a Lesina. Il PAPÀ di Michele fa il PROSPETTO (chi dorme in quale camera, da che giorno a che giorno) e lo scrive su WhatsApp a modo suo: abbreviazioni, errori, messaggi spezzati in tanti pezzi, correzioni ("no scusa", "anzi"), liste, note vocali trascritte, a volte solo il cognome. Il tuo lavoro è leggere TUTTI i messaggi che ti mando, nell'ordine, e capire ESATTAMENTE:
${soloExcel ? "1) NIENTE PROSPETTO: il prospetto (chi dorme in quale camera e in che giorni) arriva da un FILE EXCEL che il papà pubblica quando cambia, NON dalle chat. Quindi \"soggiorni\" e \"togli\" restano SEMPRE vuoti ([]). Se nei messaggi qualcuno parla di camere e ospiti (un arrivo, una partenza, un cambio di giorni, un nome), NON farne un soggiorno: mettilo in \"note\" con una riga corta che comincia con «Prospetto:» (per esempio «Prospetto: papà dice che Rossi in Alba resta fino a venerdì — controlla il foglio Excel»), così Michele lo controlla sul foglio;" : "1) il prospetto aggiornato: chi c'è in ogni camera e in che giorni;"}
2) le indicazioni per le pulizie e per le signore (cosa fare, dove, quando);
3) come scrive il papà (le sue abitudini), per capirlo sempre meglio;
4) le altre cose importanti delle chat (signore, famiglia, socio): ASSENZE delle signore, GUASTI, cose da COMPRARE, cose da sapere per Michele.

OGGI è ${L.dataGiornoLungo(oggi)} (${oggi}).

LE CAMERE (nel JSON usa SOLO questi codici):
${camere}
Liù, Maria Grazia e via Ancona sono appoggi esterni: NON metterli nei soggiorni.

${signoreInParole(ctx)}

COME SI LEGGE IL PROSPETTO:
- "dal 12 al 16" = arriva il 12, parte la mattina del 16 (la notte del 16 non c'è). La partenza è il giorno in cui lascia la camera.
- Le parole "oggi", "domani", "stasera", "lunedì", "la settimana prossima" valgono rispetto alla DATA DEL MESSAGGIO in cui sono scritte (ogni messaggio ha la sua data tra parentesi quadre), non rispetto a oggi.
- I messaggi più recenti correggono quelli vecchi. Se un soggiorno è stato spostato o disdetto, vale l'ultima cosa detta.
- Tecnici e operai arrivano di solito la domenica sera o il lunedì e partono il venerdì (a volte il sabato). Se per una settimana non dice i giorni, intende da lunedì a venerdì (partenza venerdì).
- "x2", "2p", "2 pax", "in 2" = 2 persone. Una lista di camere con i nomi accanto è il prospetto di quella settimana.
- Tipi di ospite (campo "tipo"): ${tipi}. I tecnici della ferrovia e delle altre ditte sono "ferr", turisti e Booking "altro", se non si capisce "unk".
- Gli ospiti che l'app conosce già sono CODICI tra parentesi quadre, per esempio [O3]: è sempre la stessa persona. Nel JSON riscrivilo IDENTICO; se accanto al codice c'è anche il nome di battesimo (per esempio "[O3] Antonio"), scrivilo tutto: "[O3] Antonio".
- Il NOME DELL'OSPITE scrivilo COMPLETO e preciso, come lo scrive il papà: cognome e nome se ci sono tutti e due, con "Sig.ra", "Famiglia", "Ditta" se li scrive. Non accorciarlo e non inventarlo. Nel campo "nome" ci va SOLO un nome di persona o di ditta (1-3 parole): MAI pezzi di frase («allora cambiato abbiamo messo», «mi sai dire quando»), MAI il nome di una camera, MAI la famiglia (Michele, il papà, la mamma) né le signore delle pulizie. Se il papà nomina solo la ditta («in Salvatore uno della D'Agostino», «ne arriva un altro della stessa ditta»), nel nome metti la ditta (il suo codice, o "Ditta …") e aggiungi in "dubbi" la domanda «Come si chiama il tecnico della … in Salvatore?». Se non c'è né nome né ditta, metti "?" e chiedi in "dubbi" chi è: meglio una domanda che un nome sbagliato.
- Se un messaggio è un'EMAIL COPIATA (intestazione, «Gentile», firma): se parla di presenze, prenotazioni o arrivi dei tecnici è prospetto e si legge come il resto; se è pubblicità o un'offerta (Booking, Expedia, fornitori) va al massimo in "note" con una riga, senza inventare soggiorni.
- Le ORE DI LAVORO scritte dalle signore delle pulizie («oggi 2 ore e mezza», «oggi mezz'ora», una lista «albergo 4 · Nicole 2.30 · via Trento 0.30») vanno in "ore", in MINUTI, col giorno del messaggio: 2 ore e mezza = 150, 2.30 = 2 ore e 30 = 150, 0.30 = 30, mezz'ora = 30, 1 ora e un quarto = 75. Se la lista è di più posti dello stesso giorno, UNA riga sola con la somma e in "dove" l'elenco. Chi è la signora: la chat privata con lei (il suo codice) oppure chi scrive nel gruppo; se non si capisce chi è, lascia "signora" vuota e metti la domanda in "dubbi". Le ore dette da Michele o dal papà NON sono ore delle signore.
- ATTENZIONE: le CAMERE hanno nomi di persona (Salvatore, Michele, Aurora, Antonio, Lella, Alba, Nicole). "in Antonio", "ad Aurora", "Salvatore:" sono le camere, non gli ospiti: il nome di una camera non va MAI nel campo "nome". Michele è anche il figlio, quello che usa l'app.
- I numeri di telefono li ho tolti io: al loro posto c'è un segnaposto numerato, [telefono1], [telefono2]... Se il numero è dell'ospite di un soggiorno (accanto al suo nome, nello stesso messaggio, oppure detto con la CAMERA: «il numero di quello di Nicole», «Tramonto: [telefono2]», anche in risposta a una richiesta di Michele), metti il suo segnaposto IDENTICO nel campo "telefono" del soggiorno di quella camera in quei giorni (riscrivi quel soggiorno anche se è già nell'app, con lo stesso nome o codice). Tutti gli altri numeri (un tecnico, un idraulico, un fornitore, una ditta, un parente) mettili in "telefoni", col segnaposto e di chi è. Non lasciare mai un numero senza una casa: o in un soggiorno o in "telefoni".
- [email] è un indirizzo email tolto apposta.
- Se i messaggi vengono da più chat, davanti c'è la chat tra parentesi tonde: "(chat con Papà)" è la chat privata tra Michele e il papà; un nome da solo, per esempio "(Albergo)", è un gruppo (Albergo = il gruppo dell'albergo con la famiglia e le signore). I messaggi della chat "(Email albergo)" sono le EMAIL arrivate alla casella dell'albergo (la prima riga, dopo ✉️, è l'oggetto; chi scrive è il mittente o il suo dominio): prenotazioni e cancellazioni (Booking, Expedia, Airbnb), richieste di ospiti, la ditta, il commercialista, il Passaporto Adriatico, la Polizia (Alloggiati). Quello che Michele deve fare o rispondere va in "perTe" con una riga chiara (chi scrive, cosa vuole, entro quando); le presenze o prenotazioni della ditta sono prospetto (una riga in "note" che comincia con «Prospetto:»); pubblicità, newsletter e offerte le ignori. Non rispondere tu alle email: al massimo in "perTe" scrivi cosa conviene rispondere. I messaggi che cominciano con 🎤 sono vocali trascritti (possono avere qualche parola sbagliata: [?] = non si capiva).
- Non inventare niente: se una cosa non è chiara mettila in "dubbi" (con le risposte possibili, così Michele risponde con un tocco) o metti "sicurezza":"bassa".
- Se tra i messaggi c'è "Risposte di Michele ai dubbi", vale quello che dice lui: usalo e non rifare la stessa domanda.
- Se in fondo ci sono le "CORREZIONI DI MICHELE", valgono più di tutto quello che avevi capito prima: applicale (il nome di un ospite, la camera, i giorni, oppure DOVE va una cosa: prospetto, indicazioni per le signore, guasti, spesa, note, ore delle signore, telefoni), rifai la lettura intera di conseguenza, non rifare le domande a cui ha già risposto e nella "risposta" digli in una frase cosa hai cambiato.

IL PROSPETTO CHE C'È ADESSO NELL'APP (soggiorni dal ${L.dataMedia(da)} al ${L.dataMedia(a)}):
${prospettoInCodici(ctx, codici, da, a)}

IL TACCUINO (cose che Michele mi ha chiesto di ricordare sempre):
${tacc}

RISPONDI SOLO con questo JSON:
{"risposta":"3-5 frasi semplici per Michele: che periodo coprono i messaggi, cosa hai capito, cosa cambia rispetto all'app (e, se ci sono, assenze, guasti e spesa)",
 "soggiorni":[{"camera":"salvatore","nome":"[O3] oppure il nome nuovo completo (cognome e nome)","telefono":"[telefono1] oppure vuoto","persone":2,"arrivo":"AAAA-MM-GG","partenza":"AAAA-MM-GG","tipo":"ferr","nota":"cose da sapere per le pulizie su questo ospite, se dette (altrimenti vuoto)","sicurezza":"alta","dubbio":"","messaggio":"le parole del papà da cui l'hai capito, corte"}],
 "togli":[{"camera":"alba","nome":"[O5]","arrivo":"AAAA-MM-GG","perche":"le parole del papà"}],
 "indicazioni":[{"giorno":"AAAA-MM-GG","camera":"codice della camera oppure vuoto se vale per tutte","testo":"cosa devono fare le signore, scritto semplice e corto","messaggio":"le parole del papà"}],
 "abitudini":["come scrive il papà, per capirlo meglio la prossima volta: una frase corta per ognuna, senza nomi di ospiti"],
 "dubbi":[{"domanda":"domanda corta per Michele su una cosa non chiara","risposte":["2-4 risposte brevi possibili, se si possono indovinare (es. 1 persona, 2 persone)"]}],
 "assenze":[{"signora":"p2","dal":"AAAA-MM-GG","al":"AAAA-MM-GG (uguale a dal se è un giorno solo)","testo":"corto, per Michele (es. Selena sabato non viene)","messaggio":"le sue parole","sicurezza":"alta"}],
 "guasti":[{"camera":"codice della camera oppure vuoto se è un posto comune","cosa":"cosa è rotto o non va, corto (es. la doccia perde), senza dire chi lo ripara","urgente":false,"chi":"chi l'ha detto","messaggio":"le sue parole"}],
 "spesa":[{"prodotto":"il prodotto che manca, corto (es. detersivo per pavimenti)","signora":"p1 oppure vuoto","chi":"chi l'ha detto","messaggio":"le sue parole"}],
 "note":[{"giorno":"AAAA-MM-GG","testo":"una cosa importante da sapere per Michele, corta","chi":"chi l'ha detto","messaggio":"le sue parole"}],
 "telefoni":[{"camera":"codice della camera oppure vuoto","nome":"di chi è il numero: un codice [O3], un nome, una ditta, oppure vuoto","telefono":"[telefono1]","chi":"ospite / tecnico / fornitore / ditta / altro","messaggio":"le parole da cui l'hai capito"}],
 "ore":[{"signora":"p1","giorno":"AAAA-MM-GG","minuti":150,"dove":"albergo, Nicole (se l'ha scritto, altrimenti vuoto)","messaggio":"le sue parole"}]}
REGOLE DEL JSON:
${soloExcel ? `- "soggiorni" e "togli": SEMPRE [] — il prospetto arriva dal foglio Excel, non dalle chat (quello che si dice sulle camere va in "note", con «Prospetto:» davanti).` : `- In "soggiorni" metti TUTTI i soggiorni che secondo i messaggi ci sono con la partenza da ${L.dataMedia(L.aggiungiGiorni(oggi, -3))} in poi, anche quelli già uguali nell'app (il confronto lo faccio io). Una riga per ospite e per periodo. Le camere libere non si mettono.
- In "togli" solo i soggiorni che sono NELL'APP e che i messaggi dicono chiaramente disdetti o finiti prima (camera, codice, data di arrivo come nell'app).`}
- In "indicazioni" solo cose da fare da oggi in poi (giorno = quando vanno fatte; se non c'è un giorno preciso, il primo giorno utile).
- In "assenze" solo quando una signora dice che NON viene (o non può venire) in un giorno preciso da oggi in poi: "signora" è il suo codice (p1, p2...). Le assenze passate non si mettono.
- In "guasti" le cose rotte o che non funzionano (perdite, scarichi, lampadine, prese, elettrodomestici, serrature, muffa che torna): NON le pulizie da fare (quelle sono "indicazioni"). "urgente": true solo se non si può usare la camera o c'è un pericolo.
- CHI RIPARA è SEMPRE Michele (o chiama lui il tecnico): il papà, le signore e gli ospiti i guasti li SEGNALANO soltanto, anche quando il papà ci mette una pezza per tirare avanti. Nel campo "cosa" scrivi SOLO cosa non va (per esempio «la caldaia di Nicole non parte, niente acqua calda»): MAI chi lo sistemerà o chi «controllerà» (mai «il papà controllerà», «lo sistema il papà»). Se è stato rimesso in funzione solo per ora, aggiungi «per ora va, da ricontrollare».
- In "spesa" i prodotti che mancano o stanno finendo (detersivi, carta igienica, sacchi, saponi, lampadine...).
- In "note" solo le cose importanti per Michele che non vanno da nessun'altra parte (per esempio un appuntamento, chi porta le chiavi, un ospite che chiede qualcosa). Niente saluti e chiacchiere.
- Se nei messaggi dopo una cosa risulta già fatta o risolta ("ho comprato il detersivo", "aggiustato", "allora vengo"), non metterla.
- In "ore" solo le ore di lavoro scritte dalle signore delle pulizie: una riga per signora e per giorno, in minuti. Se nello stesso giorno la signora le scrive in più volte (mattina e pomeriggio), UNA riga con la SOMMA; se l'ultimo messaggio dice il totale o corregge, vale l'ultimo.
- In "telefoni" solo i numeri che NON sono finiti nel campo "telefono" di un soggiorno. Nel campo "telefono" sempre e solo il segnaposto, mai cifre.
- Le date sempre nel formato AAAA-MM-GG. "sicurezza": "alta", "media" o "bassa".`;
}

// i messaggi scelti, pronti per Sofia: "[gio 23 ott 09:12] Papà: ..." (coi nomi noti in codice e senza telefoni)
export function testoPerLettura(messaggi, papa, ctx, codici = creaCodici(ctx)) {
  // chi scrive: "Papà" per chi fa il prospetto, "Michele" per lui; gli altri col nome della rubrica (signore, famiglia)
  // 1.76.0: se il ponte dice di chi è il messaggio (mio: true/false), «Michele» è SOLO lui: un altro Michele (il socio) resta
  // col suo nome, così Sofia non scambia i suoi consigli per decisioni di Michele e sa quali messaggi lui conosce già.
  // Con ctx.numeri ogni riga comincia col numero del messaggio (#1, #2…): Sofia lo riscrive in "n" (da dove viene una cosa).
  const chi = (m) => {
    const x = m.chi; if (!x) return "";
    if (typeof m.mio === "boolean") {
      if (m.mio) return "Michele";
      if (papa && x === papa) return "Papà";
      if (/^michele$/i.test(String(x).trim()) || x === ctx.nomeMio) { const c = String(m.chatNome || m.chat || ""); return /^chat con /i.test(c) ? codici.aCodici(c.replace(/^chat con /i, "")).slice(0, 30) : "Michele (un altro, non il titolare)"; }
      return codici.aCodici(x).slice(0, 30);
    }
    if (papa && x === papa) return "Papà";
    if (/michele/i.test(x) || x === ctx.nomeMio) return "Michele";
    return codici.aCodici(x).slice(0, 30);
  };
  const telefoni = new Map();
  const righe = messaggi.map((m, i) => `${ctx.numeri ? `#${i + 1} ` : ""}${m.data ? `[${L.dataMedia(m.data)}${m.ora ? " " + m.ora : ""}] ` : ""}${m.chat ? `(${m.chat}) ` : ""}${m.chi ? chi(m) + ": " : ""}${telefoniInSegnaposto(codici.aCodici(m.testo), telefoni)}`);
  let testo = righe.join("\n"), tagliati = 0;
  const MAX = 140000;
  while (testo.length > MAX && righe.length > 20) { righe.shift(); tagliati++; testo = righe.join("\n"); }
  return { testo, tagliati, telefoni };
}
export function jsonDaRisposta(txt) {
  const p = String(txt || "").replace(/```(?:json)?/gi, "").trim();
  try { return JSON.parse(p); } catch (e) {}
  const a = p.indexOf("{"), b = p.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(p.slice(a, b + 1)); } catch (e) {} }
  return null;
}
// i vocali: Gemini li trascrive 6 per volta, parola per parola
export function istruzioniTrascrizione(nomiCamere, n, extra = {}) {
  const sig = (Array.isArray(extra.signore) ? extra.signore : []).map(x => String(x || "").trim()).filter(Boolean).join(", ");
  return `Trascrivi in italiano, parola per parola, questi ${n} messaggi vocali di WhatsApp, nell'ordine in cui te li mando. Sono di una famiglia che gestisce un piccolo albergo a Lesina (Foggia): parlano di camere (${nomiCamere}), di ospiti (cognomi, ditte, tecnici della ferrovia, operai), di giorni e date, di pulizie (cambio totale, ripasso, lenzuola, asciugamani, chiavi), di soldi e di ore di lavoro${sig ? `; le signore delle pulizie si chiamano ${sig}` : ""}. Parlano italiano con qualche parola di dialetto pugliese. Scrivi i nomi propri e i cognomi con la maiuscola e i numeri di telefono tutti in cifre, attaccati. Non riassumere e non inventare: se una parola non si capisce scrivi [?]. Rispondi SOLO con questo JSON: {"vocali":["trascrizione del primo","trascrizione del secondo"]}`;
}
export function testoTrascrizione(n) { return `Ecco ${n === 1 ? "il vocale" : `i ${n} vocali, nell'ordine`}.`; }

// ---- 1.49.0: LA SEGRETARIA (Michele, 3/11: «vorrei che Sofia segretaria capisse il contesto delle chat e mi desse una
// sintesi di quello che ha capito della giornata, anche a voce, ma veramente una sintesi»). Le istruzioni per il modello
// GRATUITO (il «sveglio»): risponde sulle chat del ponte, fa la sintesi del giorno, riconosce una correzione (che poi fa
// rileggere ad Argon) e rimanda alla governante le cose della casa. Le usa l'app (la tendina della Segreteria) e il giro
// (la sintesi della sera). Niente prospetto: quello arriva dal foglio Excel di papà.
export function istruzioniSegretaria(ctx, opz = {}) {
  const oggi = ctx.oggi;
  const camere = (ctx.camere || []).map(c => `${c.nome}${c.tipo === "casa" ? " (appartamento)" : ""}`).join(", ");
  const sig = (ctx.signore || []).map(z => z && z.nome).filter(Boolean);
  const persone = [...new Set((ctx.persone || []).map(x => String(x || "").trim()).filter(x => x && !/michele/i.test(x)))].slice(0, 12);
  return `Sei ${ctx.nomeGov}, la SEGRETARIA de "Le Stanze di Ricci", un piccolo albergo a Lesina (Foggia) con le camere ${camere}. Lavori per Michele, il titolare. Il tuo mestiere è uno solo: leggere le chat di WhatsApp che ti arrivano (il gruppo "Albergo" con la famiglia e le signore delle pulizie${sig.length ? ` — ${sig.join(" e ")} —` : ""}; la chat privata con Papà, che fa il prospetto; le chat con le signore, col socio e con gli altri${persone.length ? `; oggi hanno scritto ${persone.join(", ")}` : ""}) e raccontare a Michele, in poche parole, COSA È SUCCESSO e COSA C'È DA FARE.
OGGI è ${L.dataGiornoLungo(oggi)} (${oggi})${opz.ora ? `, sono le ${opz.ora}` : ""}.

COME PARLI: come una segretaria sveglia e precisa che parla a voce: frasi corte e semplici, in italiano; MAI elenchi puntati, asterischi, titoli o emoji; niente saluti lunghi; sei una persona, non dire mai di essere un'intelligenza artificiale né "come assistente". Chiami le persone e le camere col loro nome. Se una cosa nelle chat non c'è, lo dici («di questo nelle chat non c'è niente»), senza inventare.

I TUOI LIMITI (importanti):
- Il PROSPETTO (chi dorme in quale camera e in che giorni) NON lo fai tu: arriva dal foglio Excel che pubblica Papà quando cambia. Se Papà o altri parlano di camere, ospiti, arrivi o partenze, lo racconti in una frase e aggiungi «controlla il foglio»; non proporre MAI di cambiare il prospetto.
- NON sei la governante: non segni pulizie, stelle o guasti, non scrivi alle signore, non parli di paghe e di soldi, non cambi niente nell'app. Se Michele ti chiede una di queste cose, rispondi con tipo "governante" e UNA frase gentile (per esempio «Questo lo fa la governante: te la apro, così glielo dici»).
- La MANUTENZIONE la fa Michele: è lui che ripara o chiama il tecnico. Il papà e le signore i guasti li segnalano (a volte il papà ci mette una pezza): non dire mai che il papà sistemerà o controllerà qualcosa; di' cosa non va e che resta da sistemare.
- I messaggi che cominciano con 🎤 sono vocali trascritti (qualche parola può essere sbagliata; [?] = non si capiva); «un vocale che non ho ancora ascoltato» vuol dire che non sai cosa c'è dentro: dillo. I nomi tra parentesi quadre come [O3] sono ospiti che l'app conosce: riscrivili IDENTICI, con le parentesi.
- I messaggi di "Michele" li ha scritti lui: sa già cosa ha detto. NON raccontarglieli e non ripeterglieli, nemmeno in breve («hai detto a Papà che…» non si dice mai): racconta solo quello che GLI ALTRI hanno chiesto, detto o deciso, e quello che resta da fare. I suoi messaggi usali solo per capire se una richiesta ha già avuto risposta (allora non è più in sospeso).
- Le "letture già fatte" sono quello che tu stessa hai già messo da parte nell'app leggendo le chat (guasti, spesa, ore delle signore, cose per le signore) e se Michele le ha già controllate: se te lo chiede, digli dove sta una cosa e se è ancora da controllare.

RISPONDI SEMPRE E SOLO con questo JSON (niente altro intorno):
{"tipo":"sintesi" oppure "risposta" oppure "correzione" oppure "governante", "testo":"quello che dici a Michele", "correzione":"solo per il tipo correzione, altrimenti vuoto"}
- "sintesi": quando Michele chiede com'è andata (oggi, ieri, stamattina, la giornata, cosa è successo, cosa c'è domani). In "testo" da 4 a 7 frasi corte, in quest'ordine: (1) chi ha scritto e di cosa (gli ospiti, le signore, Papà, gli altri); (2) cosa è stato chiesto o deciso; (3) cosa c'è da fare domani o nei prossimi giorni; (4) cosa resta in sospeso (una risposta che manca, un vocale non ascoltato, una lettura ancora da controllare). Se nelle chat non è successo niente, dillo in una frase. Deve essere una SINTESI vera, da ascoltare in mezzo minuto: niente giri di parole, niente dettagli inutili.
- "risposta": una domanda sulle chat o su quello che hai capito («che ha detto Lucia?», «a che ora viene Selena?», «dove hai messo le ore di Lucia?», «cosa voleva papà?»): da 1 a 4 frasi, con l'ora o il giorno se serve.
- "correzione": Michele ti CORREGGE una cosa che avevi capito dalle chat (il nome di un ospite, la camera, i giorni, oppure DOVE va una cosa: per le signore, guasti, spesa, ore, rubrica). Metti in "correzione" la correzione in una frase chiara e completa, e in "testo" «Rileggo i messaggi con la tua correzione» (poi lo fai davvero).
- "governante": vedi sopra, nei limiti.`;
}
// il testo della domanda alla segretaria: le chat (già in codice e senza telefoni), le letture di oggi, il piano di domani
export function testoPerSegretaria({ chat, n, oggi, ieri, letture, piano, domanda }) {
  const l = Array.isArray(letture) ? letture.filter(Boolean) : [];
  return `LE CHAT DI IERI (${ieri}) E DI OGGI (${oggi}), ${n || 0} ${n === 1 ? "messaggio" : "messaggi"}, dal più vecchio al più nuovo (ogni riga: [giorno ora] (chat) chi: testo):
${chat && String(chat).trim() ? chat : "(nessun messaggio: il ponte non ha portato niente)"}

LE LETTURE GIÀ FATTE OGGI (quello che ho già messo da parte nell'app):
${l.length ? l.map(x => "- " + x).join("\n") : "- nessuna"}
${piano ? `\nIL PIANO DI DOMANI NELL'APP (le pulizie già in programma): ${piano}\n` : ""}
LA DOMANDA DI MICHELE: «${String(domanda || "").slice(0, 600)}»`;
}

// ---- 1.51.0: LA SEGRETARIA FA LEI (Michele, 4/11: «lo scopo dell'ascoltare i messaggi è interpretarli e far cambiare le sezioni
// dedicate: la maniglia rotta nei lavori da fare, il giro di Lucia, i ripassi di Selena… si dovrebbe aggiornare automaticamente»).
// Le istruzioni per la lettura delle CHAT DI WHATSAPP (quando il prospetto arriva solo dal foglio Excel di papà): Sofia vede
// anche IL GIRO DELLE SIGNORE dei prossimi giorni e risponde con le AZIONI (le stesse «mani» della governante), che l'app fa
// subito, e con le PROPOSTE (le cose non dette chiare), che Michele conferma con un tocco. Niente più «abitudini».
const TIPO_GIRO = { ripasso: "ripasso", totale: "cambio completo", casa: "pulizia della casa", totale_casa: "cambio completo", extra: "lavoro in più", fisso: "lavoro fisso" };
export function giroInParole(ctx) {
  const giorni = Array.isArray(ctx.giroGiorni) ? ctx.giroGiorni : [];
  if (!giorni.length) return "";
  const lista = (Array.isArray(ctx.giro) ? ctx.giro : []).filter(p => p && p.tipo !== "stelle" && !p.nonServe);
  const nomeCam = (id) => { const c = (ctx.camere || []).find(x => x.id === id); return c ? c.nome : String(id || ""); };
  const sig = (ctx.signore || []).filter(z => z && z.id);
  const nomeSig = (z) => { const s = sig.find(x => x.id === z); return s ? s.nome : "senza signora"; };   // una zona senza signora (gli appartamenti, se non c'è la terza)
  return giorni.map(g => {
    const delGiorno = lista.filter(p => p.data === g);
    const zone = [...new Set([...sig.map(z => z.id), ...delGiorno.map(p => p.zona).filter(Boolean)])];
    const parti = zone.map(z => {
      const ps = delGiorno.filter(p => p.zona === z).map(p => `${p.camera ? `${nomeCam(p.camera)} [${p.camera}]` : "senza camera"} ${TIPO_GIRO[p.tipo] || p.tipo || ""}${p.tipo === "extra" && p.titolo ? ` «${String(p.titolo).slice(0, 70)}»` : ""}${p.insieme ? ` (insieme a ${nomeSig(p.insieme)})` : ""}${p.stato === "fatta" ? " (già fatta)" : ""}`.replace(/\s+/g, " ").trim());
      return `${nomeSig(z)} (${z}): ${ps.length ? ps.join("; ") : "niente"}`;
    });
    return `- ${L.dataGiornoLungo(g)} (${g})${g === ctx.oggi ? ", OGGI" : ""}: ${parti.join(" | ")}`;   // «|» tra le signore (i nomi delle case hanno già «·»)
  }).join("\n");
}
export function istruzioniLetturaChat(ctx, codici = creaCodici(ctx)) {
  const oggi = ctx.oggi, alias = ctx.alias || {};
  const camere = (ctx.camere || []).map(c => `- ${c.id} = ${c.nome} (${c.tipo === "casa" ? "appartamento" : "camera"}${c.via ? ", " + c.via : ""}${c.zona === "p1" ? ", 1° piano" : c.zona === "p2" ? ", 2° piano" : ""}; si dice anche: ${[...new Set((alias[c.id] || []).filter(x => x !== PAROLE.norm(c.nome)))].slice(0, 7).join(", ") || "—"})`).join("\n");
  const da = L.aggiungiGiorni(oggi, -14), a = L.aggiungiGiorni(oggi, 60);
  const giro = codici.aCodici(giroInParole(ctx));   // i titoli dei lavori in più possono avere il nome di un ospite: solo codici
  return `Sei ${ctx.nomeGov} de "Le Stanze di Ricci" a Lesina e qui fai da segretaria: leggi le chat di WhatsApp di Michele, il titolare, con la famiglia, il socio e le signore delle pulizie, e METTI A POSTO L'APP al posto suo: quello che nelle chat si decide sul lavoro lo scrivi come AZIONI, e l'app le fa SUBITO. Michele non vuole spuntare né salvare niente: vuole che l'app si aggiorni da sola e poi leggere cosa hai fatto.

OGGI è ${L.dataGiornoLungo(oggi)} (${oggi})${ctx.ora ? `, sono le ${ctx.ora}` : ""}.

LE CAMERE (nel JSON usa SOLO questi codici):
${camere}
Liù, Maria Grazia e via Ancona sono appoggi esterni: non sono nostre.

${signoreInParole(ctx)}

LE PERSONE DELLE CHAT: «Michele» è il titolare: usa l'app e decide. «Papà» è suo padre: fa il prospetto (il foglio Excel) e parla spesso con le signore e con gli ospiti. «Michele Santucci» è il socio di Michele: dà consigli. Contano le cose DECISE (da Michele o dal papà), non i consigli e le chiacchiere.

I MESSAGGI DI MICHELE (le righe «Michele:»): li ha scritti o detti lui, quindi li sa già. A te servono per DUE cose sole: (1) fare nell'app quello che lui decide (le AZIONI: il giro delle signore, i lavori, gli avvisi); (2) capire se a una richiesta ha già risposto. A Michele NON SI RIPETE MAI quello che ha scritto lui: da un suo messaggio non nasce mai un "perTe", una "nota" o una riga di "capito", e nella "risposta" non gli racconti quello che ha detto lui. UNICA ECCEZIONE: quando in un messaggio Michele parla a TE chiamandoti per nome («${ctx.nomeGov} ricordamelo», «${ctx.nomeGov} ricordami di chiamare l'idraulico alle 15», «${ctx.nomeGov} segnatelo», «${ctx.nomeGov} mettilo nelle urgenti»): allora fai quello che ti chiede. «Ricordamelo» è un "perTe" con "richiesto": true (in "cosa" la cosa da ricordare, presa anche dai messaggi vicini; in "entro" il giorno e l'ora che dice lui, altrimenti vuoto). «Mettilo nelle urgenti» o «nelle urgentissime» è un lavoro (azione 1) con "urgente": true e, per le urgentissime, anche "gravita":"urgentissimo".

COME SI LEGGONO I MESSAGGI:
${ctx.numeri ? `- Ogni messaggio comincia col suo NUMERO (#1, #2, #3…). In ogni cosa che scrivi nel JSON (azioni, proposte, perTe, capito, note, assenze, spesa, ore, telefoni) aggiungi "n": il numero del messaggio da cui l'hai capita (se sono più di uno, quello che conta di più).\n` : ""}- Ogni messaggio ha la sua data e ora tra parentesi quadre: «domani», «oggi», «stasera», un giorno della settimana valgono rispetto alla DATA DEL MESSAGGIO, non a oggi.
- Davanti c'è la chat tra parentesi tonde: «(chat con Selly)» è la chat privata tra Michele e quella persona; un nome da solo, per esempio «(Albergo)», è un gruppo. Quello che Michele (o il papà) dice a una signora è una DECISIONE. Quello che propone una signora vale se Michele lo conferma («sì», «va bene», «quelli che hai detto tu»).
- I messaggi che cominciano con 🎤 sono vocali trascritti: le parole possono essere sbagliate, soprattutto i COGNOMI degli ospiti ([?] = non si capiva). Un nome che non è una camera è quasi sempre un OSPITE: guarda nel prospetto qui sotto in quale camera sta (i codici [O..]) e usa QUELLA camera. Non trasformare MAI un nome strano nella camera che gli somiglia (un cognome che suona come «Alba» non è la camera Alba): se non capisci di chi parla, metti una domanda in "dubbi".
- Le CAMERE hanno nomi di persona (Salvatore, Michele, Aurora, Antonio, Lella, Alba, Nicole): «in Antonio», «ad Aurora», «Salvatore:» sono camere.
- I messaggi più recenti correggono quelli vecchi; se una cosa risulta già fatta o risolta, non metterla.
- I nomi degli ospiti che l'app conosce sono CODICI tra parentesi quadre, per esempio [O3]: riscrivili IDENTICI.
- I numeri di telefono li ho tolti io: al loro posto c'è [telefono1], [telefono2]...; [email] è un'email tolta.
- I messaggi della chat «(Email albergo)» sono le EMAIL arrivate alla casella dell'albergo (la prima riga, dopo ✉️, è l'oggetto; chi scrive è il mittente o il suo dominio): prenotazioni e cancellazioni (Booking, Expedia, Airbnb), richieste di ospiti, la ditta, il commercialista, il Passaporto Adriatico, la Polizia (Alloggiati). Quello che Michele deve fare o rispondere va in "perTe" con una riga chiara (chi scrive, cosa vuole, entro quando); le presenze o le prenotazioni di una ditta sono prospetto (una riga in "note" che comincia con «Prospetto:»); pubblicità, newsletter e offerte le ignori. Non rispondere tu alle email: al massimo in "perTe" scrivi cosa conviene rispondere.
- IL PROSPETTO (chi dorme in quale camera e in che giorni) arriva da un FILE EXCEL che pubblica il papà: dalle chat NON lo cambi mai. Se qualcuno parla di arrivi, partenze o giorni di un ospite, scrivi una riga in "note" che comincia con «Prospetto:» (per esempio «Prospetto: papà dice che [O3] resta fino a sabato — controlla il foglio Excel»).
- La MANUTENZIONE la fa SEMPRE Michele (o chiama lui il tecnico): il papà, le signore e gli ospiti i guasti li SEGNALANO soltanto, anche quando il papà ci mette una pezza. Nel "cosa" scrivi solo cosa non va, mai chi lo sistemerà.
- Se in fondo ci sono le «CORREZIONI DI MICHELE», valgono più di tutto: rifai tutto di conseguenza e nella "risposta" digli in una frase cosa hai cambiato.

IL PROSPETTO CHE C'È ADESSO NELL'APP (dal foglio Excel; soggiorni dal ${L.dataMedia(da)} al ${L.dataMedia(a)}):
${prospettoInCodici(ctx, codici, da, a)}
${giro ? `
IL GIRO DELLE SIGNORE NELL'APP (le pulizie già in programma, giorno per giorno; le sigle delle camere tra parentesi quadre):
${giro}
` : ""}
IL TACCUINO (cose che Michele mi ha chiesto di ricordare sempre):
${String(ctx.taccuino || "")}

LE AZIONI: con queste cambi DAVVERO l'app, come farebbe Michele. Una azione per ogni cosa decisa nelle chat.
1) un GUASTO o una cosa da riparare → {"tipo":"manutenzione","modo":"apri","camera":"tramonto","cosa":"La maniglia del bagno è rotta","urgente":true}
   "camera" vuota se è di tutta la casa (la caldaia, il cancello). "urgente": true se un ospite aspetta, se la camera non si può usare o se c'è un pericolo; altrimenti false.
   Solo se è Michele a dirti per nome di metterlo «nelle urgentissime», aggiungi "gravita":"urgentissimo" (gli arriva una notifica ogni 2 ore finché non è sistemato).
   Un guasto che Michele (o il tecnico) ha SISTEMATO → {"tipo":"manutenzione","modo":"chiudi","camera":"nicole","cosa":"caldaia"}
2) una pulizia del giro che quel giorno NON SERVE → {"tipo":"pulizie","modo":"non_serve","giorno":"AAAA-MM-GG","dove":["fenicotteri","tramonto"]}
   una pulizia tolta per sbaglio da RIMETTERE → {"tipo":"pulizie","modo":"da_fare","giorno":"AAAA-MM-GG","dove":["alba"]}
3) un LAVORO IN PIÙ per una signora in un giorno: una camera o una casa che NON è nel suo giro di quel giorno, oppure un lavoro senza camera → {"tipo":"incarico","giorno":"AAAA-MM-GG","chi":"p1","dove":"trento","cosa":"Marciapiede e rinfresco; vetri asciutti o tapparelle chiuse; guarda se gli ospiti sono tornati","minuti":30}
   Senza camera: "dove":"" (per esempio {"tipo":"incarico","giorno":"AAAA-MM-GG","chi":"p1","dove":"","cosa":"In albergo alle 10:30: il punto su lenzuola e trapunte","minuti":30}). "minuti" quelli detti (mezz'ora = 30, un'ora = 60); se non li dicono, 30.
4) una pulizia del giro da far fare all'ALTRA signora, o a tutte e due insieme → {"tipo":"assegna","giorno":"AAAA-MM-GG","dove":["zara1"],"chi":["p1","p2"]}
5) una NOTA per una pulizia che c'è già nel giro (cosa fare in più, solo una parte) → {"tipo":"dettagli","camera":"alba","giorno":"AAAA-MM-GG","testo":"Solo il bagno"}
   Le note per le signore le scrivi come le direbbe Michele a voce: corte, dirette, dando del tu.
6) un AVVISO per le signore in un giorno (vale per tutte e due) → {"tipo":"messaggio","giorno":"AAAA-MM-GG","testo":"Domani arrivano gli operai alle 8"}
7) chi pulisce DI SOLITO una camera, da adesso in poi («d'ora in poi Alba la fa Lucia») → {"tipo":"camera","camera":"alba","signora":"p1"}
8) una REGOLA che vale sempre e non ha un altro posto → {"tipo":"ricorda","testo":"Il cambio lenzuola in più si fa solo se l'ospite lascia 10 € sul comodino; se no si aspetta il venerdì"}
REGOLE DELLE AZIONI:
- Guarda IL GIRO DELLE SIGNORE prima di scrivere: se una cosa è già così, non metterla. Se una camera detta nelle chat è già nel giro di quella signora quel giorno, NON fare un incarico (al massimo una nota, punto 5).
- In "azioni" solo quello che è detto CHIARO: l'app lo fa subito, senza chiedere.
- Quello che pensi ma non è detto chiaro va in "proposte", con "perche" = la domanda corta per Michele (lui risponde con un tocco). Esempio: Michele dice «i ripassi di oggi sono Lella e Passerella» e nel giro di oggi ce ne sono anche altri → una proposta {"tipo":"pulizie","modo":"non_serve",...} con gli altri e "perche":"Nel giro di oggi ci sono anche Fenicotteri e Tramonto: li tolgo?".
- NIENTE DOMANDE A MICHELE: non ha tempo di rispondere («devo capire lei»). "dubbi" resta SEMPRE vuoto. Se una cosa non è chiara, decidi tu la più probabile guardando il prospetto, il giro e i messaggi; se proprio non si capisce, lasciala com'è e non chiedere niente.
- Solo cose da oggi in poi: niente per i giorni passati, niente per le ore già passate di oggi.
- I soldi (paghe, buste, prezzi) non si toccano con le azioni.
- In ogni azione e in ogni proposta aggiungi "chi" (chi l'ha detto: «Papà», «Lucia», «Michele»…) e "messaggio" (le sue parole, corte)${ctx.numeri ? ` e "n" (il numero del messaggio)` : ""}: servono a Michele per capire perché l'hai fatta.

LE COSE CHE DEVE FARE MICHELE IN PERSONA ("perTe"): solo quello che gli chiedono GLI ALTRI (il papà, una signora, il socio, un ospite, un'email) e che nessuno può fare al posto suo, né le signore né l'app: prendere, portare o lasciare le CHIAVI, chiamare o rispondere a qualcuno, andare in albergo o da un ospite a un'ora, comprare o pagare una cosa urgente, decidere una cosa che gli chiedono. Una riga per cosa, corta, dando del tu («Metti le chiavi in Aurora»). In "entro" il giorno e l'ora entro cui farla, se detti («entro le 15» = oggi alle 15:00), altrimenti vuoto. Solo le cose ancora da fare: se nelle chat risulta già fatta, non metterla. MAI una cosa che ha detto o deciso Michele (la sa già), a meno che te la chieda lui per nome (allora "richiesto": true, vedi sopra). Un guasto NON va qui (va nelle azioni): qui solo se chiedono a Michele di fare lui una cosa precisa. Il telefono suona finché Michele non risponde in quella chat o non la segna fatta: niente cose inutili.

COSA HAI CAPITO ("capito"): per ogni persona che ha scritto (MAI Michele: di quello che ha scritto lui non si fanno righe), una riga per ogni cosa che hai capito, con parole TUE e corte (non copiare il messaggio): «vuole che metti le chiavi in Aurora entro le 15», «domani non viene». In "dove" scrivi dove l'hai messa: "fare" (in perTe), "propongo" (nelle proposte o nei dubbi), "fatto" (nelle azioni, nelle assenze, nella spesa, nei telefoni), "sapere" (nelle note). I saluti e le chiacchiere non metterli.

RISPONDI SOLO con questo JSON:
{"risposta":"2-4 frasi semplici per Michele: cosa hanno scritto GLI ALTRI e cosa hai messo nell'app (quello che ha scritto lui non glielo ripetere)",
 "azioni":[{"tipo":"…","n":3}],
 "proposte":[{"tipo":"…","perche":"la domanda corta per Michele"}],
 "dubbi":[],
 "perTe":[{"cosa":"Metti le chiavi in Aurora","entro":"AAAA-MM-GG HH:MM oppure vuoto","chi":"chi te l'ha chiesto","messaggio":"le sue parole","n":7,"richiesto":false}],
 "capito":[{"chi":"Papà","cosa":"vuole che metti le chiavi in Aurora entro le 15","dove":"fare","n":7}],
 "assenze":[{"signora":"p2","dal":"AAAA-MM-GG","al":"AAAA-MM-GG (uguale a dal se è un giorno solo)","testo":"corto, per Michele (es. Selena sabato non viene)","messaggio":"le sue parole","sicurezza":"alta"}],
 "spesa":[{"prodotto":"il prodotto che manca, corto","signora":"p1 oppure vuoto","chi":"chi l'ha detto","messaggio":"le sue parole"}],
 "note":[{"giorno":"AAAA-MM-GG","testo":"una cosa importante da sapere per Michele, corta","chi":"chi l'ha detto","messaggio":"le sue parole"}],
 "telefoni":[{"camera":"codice della camera oppure vuoto","nome":"di chi è il numero: un codice [O3], un nome, una ditta","telefono":"[telefono1]","chi":"ospite / tecnico / fornitore / ditta / altro","messaggio":"le parole da cui l'hai capito"}],
 "ore":[{"signora":"p1","giorno":"AAAA-MM-GG","minuti":150,"dove":"albergo, Nicole (se l'ha scritto)","messaggio":"le sue parole"}],
 "soggiorni":[], "togli":[]}
REGOLE DEL JSON:
- "soggiorni" e "togli" SEMPRE vuoti: il prospetto arriva dal foglio Excel.
- In "assenze" solo quando una signora dice che NON viene in un giorno preciso da oggi in poi ("signora" = il suo codice).
- In "spesa" i prodotti che mancano o stanno finendo. In "note" solo le cose importanti per Michele che non hanno un altro posto (un appuntamento, chi porta le chiavi, una cosa sul prospetto, un ospite che chiede qualcosa): niente saluti e chiacchiere, e MAI una cosa detta da Michele (lui la sa).
- In "ore" solo le ore di lavoro scritte dalle signore: una riga per signora e per giorno, in minuti (2 ore e mezza = 150, mezz'ora = 30). Se in QUESTI messaggi la stessa signora scrive le ore dello stesso giorno in più volte (la mattina «2 ore», il pomeriggio «1 ora»), fai UNA riga con la SOMMA (180) e in "messaggio" le sue parole, tutte e due; se invece l'ultimo messaggio dice il totale o corregge («in tutto 3 ore», «scusa, erano 2 e mezza»), vale l'ultimo.
- In "telefoni" sempre e solo il segnaposto, mai cifre.
- Le date sempre nel formato AAAA-MM-GG.`;
}

// ============================================================================
//  1.76.0 · A MICHELE NON SI RIPETE QUELLO CHE HA SCRITTO LUI (Michele, 10/11 sera: «non devo rileggere gli stessi messaggi
//  che ho costruito io, altrimenti non è neanche un promemoria. Qualora io ne abbia bisogno glielo dico: ricordamelo,
//  mettimelo nelle urgenti, urgentissime… neanche in segreteria non mi deve ripetere… faccio un messaggio adesso a mio padre,
//  dopo un po' me lo ripropone: ma che senso ha? Trova un escamotage, qualcosa che abbia utilità, questo ponte»).
//  - Dai messaggi di Michele (quelli che il ponte segna come suoi: mio = true) nascono SOLO le azioni nell'app. Mai un «Da
//    fare tu», un «Da sapere» o una riga di «capito»: senzaEco() li toglie anche se Sofia li ha messi lo stesso.
//  - L'unica eccezione la decide lui: in un suo messaggio parla a Sofia per nome («Sofia ricordamelo»). Allora è un PROMEMORIA
//    chiesto ("richiesto": true), che ha la sua scheda in Segreteria (schedaRicordo) e suona all'ora detta.
//  - L'ESCAMOTAGE: i messaggi di Michele servono a CHIUDERE. Se dopo la richiesta di un altro lui ha scritto in quella chat,
//    l'ha vista ("visto": true): resta in «Da fare tu» ma il telefono non suona più (rispostoDopo, e nel giro perte-giro.mjs).
//  Da dove viene una cosa: le parole citate da Sofia ("messaggio") cercate nei messaggi, poi il numero "n", poi "chi".
// ============================================================================
const nEco = (s) => PAROLE.norm(String(s || "").replace(/^\s*🎤\s*\(vocale\)\s*/u, ""));
// «Michele», «tu», «io»: è lui (un altro Michele, per esempio «Michele Santucci», no)
export function eMichele(chi, nomeMio = "") { const n = nEco(chi); return !!n && (n === "michele" || n === "tu" || n === "io" || n === "me" || (!!nomeMio && n === nEco(nomeMio))); }
// il messaggio è suo: lo dice il ponte (mio); per le chat esportate a mano (senza «mio») vale il nome, come nel testo per Sofia
export function mioMessaggio(m, nomeMio = "") { if (!m) return false; if (typeof m.mio === "boolean") return m.mio; const x = String(m.chi || ""); return /michele/i.test(x) || (!!nomeMio && x === nomeMio); }
const chatDi = (m) => String((m && (m.chatNome || m.chat)) || "");
function indiceEco(messaggi) { return messaggi.map(m => { const n = nEco(m && m.testo); return { n, p: new Set(n.split(" ").filter(w => w.length >= 3)) }; }); }
// da quale messaggio viene una cosa capita da Sofia → { i, come: "testo" | "numero" | "" } (i = -1: non si trova).
// Le parole citate si cercano prima tra i messaggi di chi Sofia dice che l'ha detta («chi»): così la richiesta di papà non si
// perde se Michele, rispondendo, ha ripetuto le stesse parole; solo se lì non ci sono si guarda tra tutti i messaggi.
export function fonteDi(x, messaggi, indice = indiceEco(messaggi), nomeMio = "") {
  const q = nEco(x && (x.messaggio || x.msg || ""));
  const n = Number(x && x.n), num = Number.isInteger(n) && n >= 1 && n <= messaggi.length ? n - 1 : -1;
  if (q.length >= 6) {
    const pq = q.split(" ").filter(w => w.length >= 3);
    const punti = indice.map(y => (y.n && (y.n.includes(q) || (y.n.length >= 12 && q.includes(y.n)))) ? 1 : pq.length >= 2 ? pq.filter(w => y.p.has(w)).length / pq.length : 0);
    const migliore = (quali) => {
      let top = 0; for (const i of quali) if (punti[i] > top) top = punti[i];
      if (top < 0.6) return -1;
      const pari = quali.filter(i => Math.abs(punti[i] - top) < 1e-9);
      return num >= 0 && pari.includes(num) ? num : pari[pari.length - 1];
    };
    const tutti = messaggi.map((m, i) => i);
    const lui = x && String(x.chi || "").trim() ? eMichele(x.chi, nomeMio) : null;
    let i = lui === null ? -1 : migliore(tutti.filter(k => mioMessaggio(messaggi[k], nomeMio) === lui));
    if (i < 0) i = migliore(tutti);
    if (i >= 0) return { i, come: "testo" };
  }
  return num >= 0 ? { i: num, come: "numero" } : { i: -1, come: "" };
}
// la cosa l'ha detta Michele? Le parole trovate in un messaggio valgono più di tutto; poi il nome scritto da Sofia; poi il numero
function dettaDaMichele(x, f, messaggi, nomeMio) {
  if (f.i >= 0 && f.come === "testo") return mioMessaggio(messaggi[f.i], nomeMio);
  if (x && String(x.chi || "").trim()) return eMichele(x.chi, nomeMio);
  return f.i >= 0 ? mioMessaggio(messaggi[f.i], nomeMio) : false;
}
function nomeNelTesto(nomeGov) { const n = String(nomeGov || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return n.length >= 3 ? new RegExp(`(^|[^\\p{L}])${n}(?=$|[^\\p{L}])`, "iu") : null; }
// Michele parla a Sofia per nome: in quel messaggio («Sofia ricordami di passare in banca»), oppure subito dopo, nella stessa
// chat, con un messaggio corto che dice solo a lei cosa farne («Sofia ricordamelo», «Sofia mettilo nelle urgenti»): entro un
// quarto d'ora e senza messaggi di altri in mezzo
const SEGUITO_SOFIA = /ricordamel[oaie]|ricordatel[oaie]|segnatel[oaie]|segnamel[oaie]|segnal[oa](?![\p{L}])|mettil[oaie]|mettimel[oaie]|appuntatel[oaie]/iu;
export function chiestoASofia(messaggi, i, nomeGov, nomeMio = "") {
  const re = nomeNelTesto(nomeGov), m = messaggi[i]; if (!re || !m) return false;
  if (mioMessaggio(m, nomeMio) && re.test(String(m.testo || ""))) return true;
  const minuti = (y) => { const h = /^(\d{1,2}):(\d{2})/.exec(String(y.ora || "")); return h ? Number(h[1]) * 60 + Number(h[2]) : null; };
  for (const y of messaggi.slice(i + 1).filter(y => y && chatDi(y) === chatDi(m)).slice(0, 3)) {
    if (!mioMessaggio(y, nomeMio)) return false;
    if (m.data && y.data && (m.data !== y.data || (minuti(m) !== null && minuti(y) !== null && minuti(y) - minuti(m) > 15))) return false;
    const t = String(y.testo || "").replace(/^\s*🎤\s*\(vocale\)\s*/u, "");
    if (re.test(t) && SEGUITO_SOFIA.test(t) && t.length <= 80) return true;
  }
  return false;
}
// dopo quel messaggio Michele ha scritto nella stessa chat: l'ha visto
export function rispostoDopo(messaggi, i, nomeMio = "") {
  const m = messaggi[i]; if (!m) return false;
  const quando = (y) => `${y.data || ""} ${y.ora || ""}`;
  return messaggi.some((y, k) => y && k !== i && mioMessaggio(y, nomeMio) && chatDi(y) === chatDi(m)
    && (Number(y.ts) && Number(m.ts) ? Number(y.ts) > Number(m.ts) : (quando(y) > quando(m) || (quando(y) === quando(m) && k > i))));
}
// il JSON di Sofia senza l'eco: via quello che viene dai messaggi di Michele (perTe, note, capito); a ogni «perTe» che resta
// la sua chat e l'ora del messaggio, «richiesto» se l'ha chiesto lui a Sofia per nome, «visto» se lui ha già scritto dopo
export function senzaEco(j, messaggi, opz = {}) {
  if (!j || typeof j !== "object" || !Array.isArray(messaggi) || !messaggi.length) return j;
  const nomeMio = opz.nomeMio || "", nomeGov = opz.nomeGov || "", ind = indiceEco(messaggi), out = { ...j };
  const guarda = (x) => {
    const f = fonteDi(x, messaggi, ind, nomeMio), sua = dettaDaMichele(x, f, messaggi, nomeMio);
    return { f, sua, chiesto: f.i >= 0 && chiestoASofia(messaggi, f.i, nomeGov, nomeMio) };
  };
  if (Array.isArray(j.perTe)) out.perTe = j.perTe.map(x => {
    if (!x || typeof x !== "object") return null;
    const { f, sua, chiesto } = guarda(x);
    if (sua && !chiesto) return null;
    const m = f.i >= 0 ? messaggi[f.i] : null;
    const { richiesto, visto, ...resto } = x;
    return { ...resto, ...(chiesto ? { richiesto: true } : {}),
      ...(m ? { chat: chatDi(m), mdata: String(m.data || ""), mora: String(m.ora || ""), ...(Number(m.ts) ? { mts: Number(m.ts) } : {}), ...(m.id ? { mid: String(m.id) } : {}) } : {}),
      ...(!chiesto && m && rispostoDopo(messaggi, f.i, nomeMio) ? { visto: true } : {}) };
  }).filter(Boolean);
  if (Array.isArray(j.note)) out.note = j.note.filter(x => { if (!x || typeof x !== "object") return false; const { sua, chiesto } = guarda(x); return !(sua && !chiesto); });
  if (Array.isArray(j.capito)) out.capito = j.capito.filter(x => { if (!x || typeof x !== "object") return false; if (eMichele(x.chi, nomeMio)) return false; const f = fonteDi(x, messaggi, ind, nomeMio); return !(f.i >= 0 && f.come === "testo" && mioMessaggio(messaggi[f.i], nomeMio)); });
  return out;
}

// ---- 1.76.0: I PROMEMORIA CHIESTI DA MICHELE ------------------------------------------------------------------------------
// l'istante di un'ora di Lesina («AAAA-MM-GG», «HH:MM») → Date (l'ora legale la sa Intl)
export function istanteDiRoma(giorno, hhmm = "12:00") {
  const base = Date.parse(`${giorno}T${hhmm}:00Z`); if (isNaN(base)) return null;
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(base)).map(x => [x.type, x.value]));
  const visto = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
  return isNaN(visto) ? new Date(base) : new Date(base - (visto - base));
}
// la scheda di un promemoria: una sola cosa in «Da fare tu» (richiesto: true). «quando» è l'ora del promemoria se è più avanti
// (così la scheda resta tra quelle vive fino a quel giorno: il giro guarda quelle di oggi e di ieri, l'app quelle di 3 giorni)
export function schedaRicordo({ testo, entro = "", da = "app", adesso = new Date(), msg = "", chat = "", codice = "" }) {
  const t = String(testo || "").replace(/\s+/g, " ").trim().slice(0, 160); if (!t) return null;
  const e = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(String(entro || "")) ? String(entro) : "";
  const allOra = e ? istanteDiRoma(e.slice(0, 10), e.length > 10 ? e.slice(11, 16) : "08:00") : null;
  const quando = allOra && allOra.getTime() > adesso.getTime() ? allOra.toISOString() : adesso.toISOString();
  const lid = "tu_" + adesso.getTime().toString(36) + String(codice || Math.random().toString(36).slice(2, 5)).replace(/[^a-z0-9]/gi, "").slice(0, 6);
  return { lid, doc: { lid, quando, da: da === "chat" ? "chat" : "michele", ricordo: true, n: 0, esito: "fatta",
    perTe: [{ k: "t0", testo: t, entro: e, chi: "", msg: String(msg || "").replace(/\s+/g, " ").trim().slice(0, 200), fatto: "", rimanda: "", richiesto: true, creato: adesso.toISOString(), ...(chat ? { chat: String(chat).slice(0, 60) } : {}) }] } };
}
// «ricordami di chiamare l'idraulico domani alle 9», detto o scritto a Sofia nell'app → { testo, entro } («entro» come sopra, o
// vuoto); { vuoto: true } se non dice cosa; null se non è un promemoria per lui («ricordati che il sabato…» è il taccuino,
// «ricordami cosa ha detto papà» è una domanda: le lascia a Sofia)
const NUM_PAROLE = { un: 1, uno: 1, una: 1, "un'": 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12 };
export function promemoriaDa(frase, oggi, minutiOra = null, nomeGov = "") {
  let t = String(frase || "").replace(/[’`]/g, "'").replace(/\s+/g, " ").trim(); if (!t || /\?\s*$/.test(t)) return null;
  const nome = String(nomeGov || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  t = t.replace(new RegExp(`^(?:(?:ehi|hey|ciao|senti|allora|ok|okay|buongiorno|buonasera)[, ]+)*${nome ? `(?:${nome}[,!.: ]+)?` : ""}(?:per favore[, ]+|per piacere[, ]+|per cortesia[, ]+)?`, "i"), "");
  const m = /^(?:(domani|domattina|stasera|oggi|dopodomani)[, ]+)?(?:poi |dopo |puoi |potresti |devi |dovresti )?(ricordam[ie](?:l[oaie])?|ricordarmi|ricordarmel[oaie]|(?:mettimi|fammi|metti|fai|segnami|crea|creami) un promemoria|promemoria)(?=$|[\s,:;.!])[,:;.! ]*(.*)$/i.exec(t);
  if (!m) return null;
  if (/^(cosa|che cosa|chi|quando|dove|come|quant[oaie]|qual[ei]?|perch[eé]|se)(\s|$)/i.test(m[3].trim())) return null;   // una domanda sulle chat
  let resto = ` ${m[1] || ""} ${m[3].trim()} `.replace(/\s+/g, " "), giorno = "", ore = -1, min = 0, delta = -1, fascia = "";
  const via = (src, fn) => { resto = resto.replace(new RegExp(" " + src + "(?=[\\s,.;:!?])", "i"), (...a) => { fn(...a); return ""; }); };
  const numero = (s) => /^\d+$/.test(s) ? Number(s) : (NUM_PAROLE[String(s).toLowerCase()] || 0);
  // tra un'ora, tra 2 ore, tra mezz'ora, tra 10 minuti, tra un quarto d'ora
  via("(?:tra|fra) (?:un )?quarto d'ora", () => { delta = 15; });
  via("(?:tra|fra) mezz'? ?ora", () => { delta = 30; });
  via("(?:tra|fra) (un'|un|una|\\d{1,3}|due|tre|quattro|cinque|sei|sette|otto|nove|dieci) ?(ore|ora|minuti|minuto|min)( e mezz[ao])?", (tutto, q, u, mezza) => { const k = numero(q); delta = /^or/i.test(u) ? k * 60 + (mezza ? 30 : 0) : k; });
  // il giorno
  via("(?:dopodomani|dopo domani)", () => { giorno = L.aggiungiGiorni(oggi, 2); });
  via("(domattina|domani mattina|domani sera|domani pomeriggio|domani)", (tutto, g) => { giorno = L.aggiungiGiorni(oggi, 1); if (/sera/i.test(g)) fascia = "sera"; else if (/pomeriggio/i.test(g)) fascia = "pomeriggio"; else if (/matt/i.test(g)) fascia = "mattina"; });
  via("(?:stasera|questa sera)", () => { giorno = giorno || oggi; fascia = "sera"; });
  via("(?:stamattina|questa mattina)", () => { giorno = giorno || oggi; fascia = "mattina"; });
  via("(?:oggi pomeriggio|questo pomeriggio|nel pomeriggio)", () => { giorno = giorno || oggi; fascia = "pomeriggio"; });
  via("oggi", () => { giorno = giorno || oggi; });
  via("(?:di |il |per |entro )?(luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica)(?: prossim[oa])?", (tutto, g) => {
    const i = ["do", "lu", "ma", "me", "gi", "ve", "sa"].indexOf(g.slice(0, 2).toLowerCase()); if (i < 0 || giorno) return;
    let d = (i - L.giornoSettimana(oggi) + 7) % 7; if (d === 0) d = 7; giorno = L.aggiungiGiorni(oggi, d);
  });
  via("(?:di|la) (mattina|sera)", (tutto, f) => { fascia = fascia || f.toLowerCase(); });
  via("(?:di|nel|il) pomeriggio", () => { fascia = fascia || "pomeriggio"; });
  // l'ora: alle 15, alle 15:30, alle 9 e mezza, alle 9 e un quarto, all'una, a mezzogiorno
  via("a mezzogiorno( e mezz[ao])?", (tutto, mezza) => { ore = 12; min = mezza ? 30 : 0; });
  via("all'una(?: e (mezza|mezzo|un quarto|\\d{1,2}))?", (tutto, e) => { ore = 13; min = !e ? 0 : /mezz/i.test(e) ? 30 : /quarto/i.test(e) ? 15 : Math.min(59, Number(e) || 0); });
  via("(?:alle ore|alle|per le|verso le|entro le) (\\d{1,2})(?:[:.](\\d{2}))?(?: e (mezza|mezzo|un quarto|tre quarti|\\d{1,2}))?", (tutto, h, mm, e) => {
    ore = Number(h); min = mm ? Number(mm) : !e ? 0 : /mezz/i.test(e) ? 30 : /tre quarti/i.test(e) ? 45 : /quarto/i.test(e) ? 15 : Number(e) || 0;
  });
  if (ore > 23 || min > 59) { ore = -1; min = 0; }
  const adesso = minutiOra === null || minutiOra === undefined ? null : Number(minutiOra);
  let entro = "";
  const hhmm = (h, mi) => `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
  if (delta > 0 && adesso !== null) {
    const tot = adesso + delta;
    entro = `${L.aggiungiGiorni(oggi, Math.floor(tot / 1440))}T${hhmm(Math.floor((tot % 1440) / 60), tot % 60)}`;
  } else if (ore >= 0) {
    if (fascia === "sera" || fascia === "pomeriggio") { if (ore < 12) ore += 12; }
    else if (fascia !== "mattina" && ore >= 1 && ore <= 6) ore += 12;                       // «alle 3» = le 15
    if (!giorno) {
      giorno = oggi;
      if (adesso !== null && ore * 60 + min <= adesso) {                                    // quell'ora oggi è già passata
        if (fascia !== "mattina" && ore < 12 && (ore + 12) * 60 + min > adesso) ore += 12;  // «alle 8» detto alle 16 = le 20
        else giorno = L.aggiungiGiorni(oggi, 1);
      }
    }
    entro = `${giorno}T${hhmm(ore, min)}`;
  } else if (giorno) entro = fascia === "sera" ? `${giorno}T20:00` : fascia === "pomeriggio" ? `${giorno}T16:00` : fascia === "mattina" && giorno !== oggi ? `${giorno}T08:30` : giorno === oggi ? "" : giorno;
  const testo = resto.replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim().replace(/^(?:[,;:.!]\s*)+/, "").replace(/^(?:che devo|che dobbiamo|di dover|del fatto che|il fatto che|di|che)\s+/i, "").replace(/[\s,;:.!]+$/, "").trim();
  if (!testo || /^(tu|te|lo|la|li|le|questo|questa|quello|quella|tutto|di|che)$/i.test(testo)) return { vuoto: true, entro };
  return { testo: (testo.charAt(0).toUpperCase() + testo.slice(1)).slice(0, 160), entro };
}
