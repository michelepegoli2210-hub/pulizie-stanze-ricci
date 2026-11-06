// documenti.js — 1.56.0 · LA FOTO DEL DOCUMENTO → ALLOGGIATI WEB (Michele, 5/11: «la maniera per fare la foto al documento e
// compilare automaticamente Alloggiati Web»).
// Tutto succede sul telefono: la foto non va a nessuno (niente IA, niente server). Si leggono:
//  - le righe coi <<< (la «MRZ») del passaporto e della carta d'identità elettronica: cognome, nome, sesso, nascita,
//    cittadinanza, numero del documento, chi l'ha rilasciato; ogni pezzo ha la sua cifra di controllo, così un errore
//    di lettura si vede (e spesso si corregge da solo);
//  - il codice fiscale scritto sul retro della carta d'identità elettronica: dice anche il comune di nascita;
//  - (6/11, Michele: «dalla foto devi capire tutti i dati») il davanti della carta d'identità e la pagina del passaporto
//    italiano: il comune che l'ha rilasciato («COMUNE DI …», «QUESTURA DI …») e il luogo di nascita («ROMA (RM) …»).
// Poi la riga di 168 caratteri del file di Alloggiati Web (il tracciato del manuale della Polizia di Stato, CREAFILE.pdf).

// ---- la cifra di controllo delle righe MRZ (ICAO 9303: pesi 7, 3, 1) -------------------------------------------------
const valoreMrz = (c) => c === "<" ? 0 : c >= "0" && c <= "9" ? c.charCodeAt(0) - 48 : c >= "A" && c <= "Z" ? c.charCodeAt(0) - 55 : -1;
export function cifraMrz(s) {
  let t = 0; const pesi = [7, 3, 1];
  for (let i = 0; i < s.length; i++) { const v = valoreMrz(s[i]); if (v < 0) return "?"; t += v * pesi[i % 3]; }
  return String(t % 10);
}
// le lettere e i numeri che la lettura scambia più spesso
const IN_NUMERO = { O: "0", Q: "0", D: "0", U: "0", C: "0", I: "1", L: "1", T: "1", J: "1", Z: "2", E: "3", A: "4", H: "4", S: "5", G: "6", B: "8", R: "8", K: "<" };
const IN_LETTERA = { "0": "O", "1": "I", "2": "Z", "3": "E", "4": "A", "5": "S", "6": "G", "8": "B" };
const soloNumeri = (s) => s.split("").map(c => c >= "0" && c <= "9" ? c : (IN_NUMERO[c] && IN_NUMERO[c] !== "<" ? IN_NUMERO[c] : c)).join("");
const soloLettere = (s) => s.split("").map(c => IN_LETTERA[c] || c).join("");

// una riga letta dall'OCR → solo A-Z, 0-9 e <
export function pulisciRiga(r) {
  return String(r || "").toUpperCase().replace(/[«‹〈⟨≤]/g, "<").replace(/\s+/g, "").replace(/[^A-Z0-9<]/g, "");
}
// il numero del documento: se la cifra di controllo non torna, prova a cambiare le lettere/numeri che si confondono
function numeroGiusto(num, cifra, conferma) {
  const c = soloNumeri(cifra);
  if (cifraMrz(num) === c) return { num, ok: true };
  if (!conferma) return { num, ok: false };
  const posti = []; for (let i = 0; i < num.length; i++) { const ch = num[i]; if ((IN_NUMERO[ch] && IN_NUMERO[ch] !== "<") || IN_LETTERA[ch]) posti.push(i); }
  const alt = (ch) => [IN_NUMERO[ch] && IN_NUMERO[ch] !== "<" ? IN_NUMERO[ch] : null, IN_LETTERA[ch] || null].filter(Boolean);
  const cambia = (s, i, ch) => s.slice(0, i) + ch + s.slice(i + 1);
  const buoni = [];
  for (let a = 0; a < posti.length; a++) for (const x of alt(num[posti[a]])) { const n1 = cambia(num, posti[a], x); if (cifraMrz(n1) === c && conferma(n1)) buoni.push(n1); }
  if (buoni.length === 1) return { num: buoni[0], ok: true };
  if (buoni.length) return { num, ok: false };   // più di una possibilità: meglio non scegliere a caso
  for (let a = 0; a < posti.length; a++) for (const x of alt(num[posti[a]])) {
    const n1 = cambia(num, posti[a], x);
    for (let b = a + 1; b < posti.length; b++) for (const y of alt(n1[posti[b]])) { const n2 = cambia(n1, posti[b], y); if (cifraMrz(n2) === c && conferma(n2)) buoni.push(n2); }
  }
  return buoni.length === 1 ? { num: buoni[0], ok: true } : { num, ok: false };
}
function dataMrz(s, nascita) {
  const d = soloNumeri(s); if (!/^\d{6}$/.test(d)) return null;
  const yy = +d.slice(0, 2), mm = +d.slice(2, 4), gg = +d.slice(4, 6);
  if (mm < 1 || mm > 12 || gg < 1 || gg > 31) return null;
  const oraYY = new Date().getFullYear() % 100;
  const anno = nascita ? (yy > oraYY ? 1900 + yy : 2000 + yy) : 2000 + yy;
  return `${anno}-${String(mm).padStart(2, "0")}-${String(gg).padStart(2, "0")}`;
}
function nomiMrz(s) {
  // i «<» del riempimento a volte si leggono K, L, C…: si taglia dal primo «<» del pezzo finale fatto solo di quei segni
  let t = s.replace(/<+$/, "");
  const m = t.match(/[<KLCEI]+$/);
  if (m && m[0].includes("<")) t = t.slice(0, t.length - m[0].length + m[0].indexOf("<"));
  else t = t.replace(/([KLCEI])\1{3,}$/, "");
  t = t.replace(/<+$/, "");
  const [cog, ...resto] = t.split("<<");
  const pulito = (x) => soloLettere(String(x || "")).replace(/<+/g, " ").replace(/\s+/g, " ").trim();
  return { cognome: pulito(cog), nome: pulito(resto.join(" ")) };
}
const lungo = (r, n) => r.length >= n ? r.slice(0, n) : r + "<".repeat(n - r.length);

// le varianti di una riga: com'è, e con un carattere in meno o un «<» in più (l'OCR a volte ne perde o ne aggiunge uno)
function varianti(r, n) {
  const v = [lungo(r, n)];
  if (Math.abs(r.length - n) <= 3) {
    for (let i = 0; i < Math.min(r.length, n + 2); i++) v.push(lungo(r.slice(0, i) + r.slice(i + 1), n));
    for (let i = 0; i <= Math.min(r.length, n); i++) v.push(lungo(r.slice(0, i) + "<" + r.slice(i), n));
  }
  return [...new Set(v)];
}
const meglioDi = (vs, voto) => { let m = vs[0], best = -1; for (const v of vs) { const s = voto(v); if (s > best) { best = s; m = v; } } return m; };
const okData = (d, c) => cifraMrz(soloNumeri(d)) === soloNumeri(c);
// legge le righe MRZ in un testo (quello dell'OCR); restituisce i dati e quali pezzi tornano coi controlli
export function leggiMrz(testo) {
  const righe = String(testo || "").split(/\r?\n/).map(pulisciRiga).filter(r => r.length >= 20 && /</.test(r));
  // la prima riga a volte ha un pezzetto di sporco davanti: si toglie solo lì
  const inizio = (r) => { if (/^(P|[ACI][A-Z<][A-Z]{3})/.test(r)) return r; const k = r.search(/P<|[ACI][A-Z<][A-Z]{3}/); return k > 0 && k <= 3 ? r.slice(k) : r; };
  const prove = [];
  for (let i = 0; i < righe.length; i++) {
    const a = inizio(righe[i]), b = righe[i + 1], c = righe[i + 2];
    if (b && /^P/.test(a) && b.length >= 28) prove.push(["TD3", a, b]);
    if (b && c && /^[ACI]/.test(a) && a.length <= 34 && b.length <= 34 && c.length <= 34) prove.push(["TD1", a, b, c]);
    if (b && /^[ACIV]/.test(a) && a.length >= 33 && a.length <= 39 && b.length >= 33 && b.length <= 39) prove.push(["TD2", a, b]);
  }
  let meglio = null;
  for (const p of prove) { const r = interpreta(p); if (r && (!meglio || r.voto > meglio.voto)) meglio = r; }
  return meglio;
}
function interpreta([tipo, r1, r2, r3]) {
  let l1, l2, l3 = "", num, cNum, nascita, cNas, sesso, scade, cSca, naz, nomi, doc, stato, composta = null;
  if (tipo === "TD1") {
    l1 = meglioDi(varianti(r1, 30), v => (cifraMrz(v.slice(5, 14)) === v[14] ? 4 : 0) + (/^[ACI][A-Z<]/.test(v) ? 1 : 0) + (/^[A-Z<]{3}$/.test(v.slice(2, 5)) ? 1 : 0) + (v === lungo(r1, 30) ? 0.5 : 0));
    l2 = meglioDi(varianti(r2, 30), v => (okData(v.slice(0, 6), v[6]) ? 3 : 0) + (okData(v.slice(8, 14), v[14]) ? 3 : 0) + (/[MF<]/.test(v[7]) ? 1 : 0) + (v === lungo(r2, 30) ? 0.5 : 0));
    l3 = lungo(r3, 30);
    doc = l1.slice(0, 2); stato = l1.slice(2, 5); num = l1.slice(5, 14); cNum = l1[14];
    nascita = l2.slice(0, 6); cNas = l2[6]; sesso = l2[7]; scade = l2.slice(8, 14); cSca = l2[14]; naz = l2.slice(15, 18); nomi = l3;
    // numero lungo: continua nella parte facoltativa
    if (cNum === "<") { const resto = l1.slice(15).split("<")[0]; if (resto.length > 1) { num = num + resto.slice(0, -1); cNum = resto.slice(-1); } }
    composta = (n) => { const a = l1.slice(0, 5) + (n + "<".repeat(9)).slice(0, Math.max(9, n.length)) ; const x1 = n.length <= 9 ? l1.slice(0, 5) + n.padEnd(9, "<") + l1.slice(14) : l1; return cifraMrz(x1.slice(5, 30) + l2.slice(0, 7) + l2.slice(8, 15) + l2.slice(18, 29)) === soloNumeri(l2[29]); };
  } else {
    const n = tipo === "TD3" ? 44 : 36;
    l1 = lungo(r1, n);
    l2 = meglioDi(varianti(r2, n), v => (cifraMrz(v.slice(0, 9)) === v[9] ? 3 : 0) + (okData(v.slice(13, 19), v[19]) ? 3 : 0) + (okData(v.slice(21, 27), v[27]) ? 3 : 0) + (/[MF<]/.test(v[20]) ? 1 : 0) + (v === lungo(r2, n) ? 0.5 : 0));
    doc = l1.slice(0, 2); stato = l1.slice(2, 5); nomi = l1.slice(5);
    num = l2.slice(0, 9); cNum = l2[9]; naz = l2.slice(10, 13); nascita = l2.slice(13, 19); cNas = l2[19]; sesso = l2[20]; scade = l2.slice(21, 27); cSca = l2[27];
    composta = (x) => { const v = x.padEnd(9, "<").slice(0, 9) + l2.slice(9); return tipo === "TD3" ? cifraMrz(v.slice(0, 10) + v.slice(13, 20) + v.slice(21, 43)) === soloNumeri(v[43]) : cifraMrz(v.slice(0, 10) + v.slice(13, 20) + v.slice(21, 35)) === soloNumeri(v[35]); };
  }
  const grezzo = num.replace(/<+$/, "");
  let numero = grezzo, okNum = cifraMrz(num) === soloNumeri(cNum) || cifraMrz(grezzo) === soloNumeri(cNum);
  // se non torna, una correzione si accetta solo se torna anche il controllo di tutta la riga (così non se ne inventa una)
  if (!okNum) { const c = numeroGiusto(grezzo, cNum, composta); if (c.ok) { numero = c.num; okNum = true; } }
  const okNas = okData(nascita, cNas), okSca = okData(scade, cSca);
  const nas = dataMrz(nascita, true), sca = dataMrz(scade, false);
  const { cognome, nome } = nomiMrz(nomi);
  const sx = sesso === "M" ? 1 : sesso === "F" ? 2 : 0;
  const voto = (okNum ? 3 : 0) + (okNas ? 3 : 0) + (okSca ? 2 : 0) + (cognome ? 1 : 0) + (nome ? 1 : 0) + (sx ? 1 : 0) + (nas ? 1 : 0);
  if (voto < 4) return null;
  return {
    formato: tipo, passaporto: /^P/.test(doc), tipoMrz: doc.replace(/</g, ""), statoRilascio: soloLettere(stato).replace(/</g, ""), cittadinanza: soloLettere(naz).replace(/</g, ""),
    numero, cognome, nome, sesso: sx, nascita: nas, scadenza: sca,
    controlli: { numero: okNum, nascita: okNas, scadenza: okSca }, voto,
  };
}

// ---- il codice fiscale (sul retro della carta d'identità elettronica) --------------------------------------------------
const CF_DISPARI = { 0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21, A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23 };
const cfPari = (c) => c >= "0" && c <= "9" ? +c : c.charCodeAt(0) - 65;
export function cfValido(cf) {
  if (!/^[A-Z0-9]{16}$/.test(cf)) return false;
  let t = 0; for (let i = 0; i < 15; i++) t += i % 2 === 0 ? CF_DISPARI[cf[i]] : cfPari(cf[i]);
  return String.fromCharCode(65 + (t % 26)) === cf[15];
}
// nei posti dei numeri: le lettere che l'OCR scambia per numeri (non quelle dell'omocodia: L M N P Q R S T U V)
const CF_NUMERO = { O: "0", D: "0", I: "1", J: "1", Z: "2", E: "3", A: "4", H: "4", G: "6", B: "8" };
const OMOCODIA = { L: "0", M: "1", N: "2", P: "3", Q: "4", R: "5", S: "6", T: "7", U: "8", V: "9" };
const MESI_CF = "ABCDEHLMPRST";
const RE_CF = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;
const cfDa = (p) => p.split("").map((ch, i) => [0, 1, 2, 3, 4, 5, 8, 11, 15].includes(i) ? (IN_LETTERA[ch] || ch) : (CF_NUMERO[ch] || ch)).join("");
// tutti i codici fiscali «giusti» in un testo letto (anche con una lettera scambiata o un carattere in più)
export function candidatiCf(testo, largo = false) {
  const t = String(testo || "").toUpperCase().replace(/[^A-Z0-9\n]/g, ""), out = [];
  const prova = (p) => { const c = cfDa(p); if (RE_CF.test(c) && cfValido(c) && !out.includes(c)) out.push(c); };
  for (const riga of t.split("\n")) {
    for (let i = 0; i + 16 <= riga.length; i++) prova(riga.slice(i, i + 16));
    // con la MRZ accanto si può essere larghi: uno o due caratteri in più (tanto poi deve combaciare con la data di nascita)
    if (largo) for (let i = 0; i + 17 <= riga.length; i++) { const w = riga.slice(i, i + 17); for (let j = 1; j < 16; j++) prova(w.slice(0, j) + w.slice(j + 1)); }
    if (largo) for (let i = 0; i + 18 <= riga.length; i++) { const w = riga.slice(i, i + 18); for (let j = 1; j < 17; j++) for (let k = j + 1; k < 17; k++) prova(w.slice(0, j) + w.slice(j + 1, k) + w.slice(k + 1)); }
  }
  return out;
}
// le tre lettere del cognome (o del nome) nel codice fiscale
export function trePer(s, nome) {
  const x = testoAlloggiati(s).replace(/[^A-Z]/g, ""), cons = x.replace(/[AEIOU]/g, ""), voc = x.replace(/[^AEIOU]/g, "");
  if (nome && cons.length >= 4) return cons[0] + cons[2] + cons[3];
  return (cons + voc + "XXX").slice(0, 3);
}
// il codice fiscale combacia con le righe MRZ? (stessa data di nascita e stesso sesso: lo sporco letto a caso non combacia)
export function cfCombacia(cf, mrz) {
  const d = leggiCf(cf); if (!d || !mrz || !mrz.nascita) return false;
  const [a, m, g] = mrz.nascita.split("-").map(Number);
  return d.anno2 === a % 100 && d.mese === m && d.giorno === g && (!mrz.sesso || d.sesso === mrz.sesso);
}
// il codice fiscale da usare: quello che combacia con la MRZ; senza MRZ solo se accanto c'è scritto «codice fiscale»
export function trovaCf(testo, mrz) {
  if (mrz) {
    const c = candidatiCf(testo, true).filter(x => cfCombacia(x, mrz)); if (!c.length) return "";
    // tra quelli che combaciano, quello con le lettere del cognome e del nome giuste (se la MRZ ha i nomi)
    const atteso = mrz.cognome ? trePer(mrz.cognome) + trePer(mrz.nome || "", true) : "";
    if (!atteso) return c.length === 1 ? c[0] : "";
    const punti = (x) => x.slice(0, 6).split("").filter((ch, i) => ch === atteso[i]).length;
    c.sort((x, y) => punti(y) - punti(x));
    return punti(c[0]) >= 4 && (c.length === 1 || punti(c[0]) > punti(c[1])) ? c[0] : "";
  }
  const righe = String(testo || "").toUpperCase().split("\n");
  for (let i = 0; i < righe.length; i++) if (/FISCAL/.test(righe[i].replace(/[^A-Z]/g, ""))) { const c = candidatiCf(righe.slice(i, i + 3).join("\n")); if (c.length) return c[0]; }
  return "";
}
// cosa dice il codice fiscale: sesso, giorno e mese di nascita, il codice del comune (o dello stato estero, Z…)
export function leggiCf(cf) {
  if (!cfValido(cf)) return null;
  const n = (s) => s.split("").map(ch => OMOCODIA[ch] || ch).join("");
  const anno2 = +n(cf.slice(6, 8)), mese = MESI_CF.indexOf(cf[8]) + 1; let giorno = +n(cf.slice(9, 11));
  const sesso = giorno > 40 ? 2 : 1; if (giorno > 40) giorno -= 40;
  return { anno2, mese, giorno, sesso, belfiore: cf[11] + n(cf.slice(12, 15)), estero: cf[11] === "Z" };
}

// ---- la riga di Alloggiati Web (168 caratteri, CREAFILE.pdf) -----------------------------------------------------------
// i nomi senza accenti e in maiuscolo (D'AGOSTINO, NICOLO')
export function testoAlloggiati(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9' -]/g, " ").replace(/\s+/g, " ").trim();
}
const campo = (s, n) => String(s || "").padEnd(n, " ").slice(0, n);
const dataIt = (iso) => { const [a, m, g] = String(iso || "").split("-"); return a && m && g ? `${g}/${m}/${a}` : ""; };
// o: { tipo (16 ospite singolo, 17 capofamiglia, 18 capogruppo, 19 familiare, 20 membro gruppo), arrivo, giorni, cognome,
// nome, sesso (1/2), nascita, comuneNascita (codice), provNascita, statoNascita (codice), cittadinanza (codice),
// tipoDoc, numDoc, luogoRilascio (codice comune o stato) }
export function rigaAlloggiati(o) {
  const conDoc = [16, 17, 18].includes(Number(o.tipo));
  const r = campo(String(o.tipo), 2) + campo(dataIt(o.arrivo), 10) + campo(String(Math.max(1, Math.min(30, Number(o.giorni) || 1))).padStart(2, "0"), 2)
    + campo(testoAlloggiati(o.cognome), 50) + campo(testoAlloggiati(o.nome), 30) + campo(String(o.sesso || ""), 1) + campo(dataIt(o.nascita), 10)
    + campo(o.comuneNascita, 9) + campo(o.provNascita, 2) + campo(o.statoNascita, 9) + campo(o.cittadinanza, 9)
    + (conDoc ? campo(o.tipoDoc, 5) + campo(testoAlloggiati(o.numDoc).replace(/[^A-Z0-9]/g, ""), 20) + campo(o.luogoRilascio, 9) : " ".repeat(34));
  return r;
}
// il file: una riga per persona, CR LF tra una riga e l'altra (non dopo l'ultima); i familiari subito dopo il capofamiglia
export function fileAlloggiati(righe) { return righe.join("\r\n"); }
// cosa manca a una persona perché la riga sia giusta (le frasi per la signora/Michele)
export function cosaManca(o) {
  const m = [], conDoc = [16, 17, 18].includes(Number(o.tipo));
  if (!o.cognome) m.push("il cognome"); if (!o.nome) m.push("il nome"); if (!o.sesso) m.push("il sesso"); if (!o.nascita) m.push("la data di nascita");
  if (!o.statoNascita) m.push("lo stato di nascita"); else if (o.natoInItalia && !o.comuneNascita) m.push("il comune di nascita");
  if (!o.cittadinanza) m.push("la cittadinanza");
  if (conDoc) { if (!o.tipoDoc) m.push("il tipo di documento"); if (!o.numDoc) m.push("il numero del documento"); if (!o.luogoRilascio) m.push("dove è stato rilasciato il documento"); }
  return m;
}

// ---- il DAVANTI (6/11): chi ha rilasciato il documento e dove è nata la persona, cercati nell'elenco ufficiale dei comuni --
// righe dei comuni: [codice, nome, provincia, codice catastale, cessato (0/1), fine validità "AAAA-MM-GG" o ""]
const PAROLE_DAVANTI = ["REPUBBLICA", "ITALIANA", "COMUNE", "MUNICIPALITY", "IDENTITA", "IDENTITY", "COGNOME", "SURNAME", "NASCITA", "BIRTH", "PASSAPORTO", "PASSPORT", "QUESTURA", "CITTADINANZA", "NATIONALITY", "SCADENZA", "EXPIRY", "EMISSIONE"];
export function sembraDavanti(t) {
  const s = String(t || "").toUpperCase(); if (/<<<</.test(s)) return false;
  const x = s.replace(/[^A-Z]/g, ""); return PAROLE_DAVANTI.filter(p => x.includes(p)).length >= 2;
}
const nt = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
// quante lettere cambiano tra due parole (si ferma appena supera «max»)
function distanza(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prima = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const ora = [i]; let min = i;
    for (let j = 1; j <= b.length; j++) { const v = Math.min(prima[j] + 1, ora[j - 1] + 1, prima[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); ora.push(v); if (v < min) min = v; }
    if (min > max) return max + 1;
    prima = ora;
  }
  return prima[b.length];
}
let indiceDi = null, indiceC = null;
function indice(comuni) {
  if (indiceDi === comuni && indiceC) return indiceC;
  const perNome = new Map(), perProv = new Map(), perBelfiore = new Map();
  for (const r of comuni) {
    const k = nt(r[1]); if (!perNome.has(k)) perNome.set(k, []); perNome.get(k).push(r);
    if (r[2]) { if (!perProv.has(r[2])) perProv.set(r[2], new Set()); perProv.get(r[2]).add(k); }
    if (r[3]) { if (!perBelfiore.has(r[3])) perBelfiore.set(r[3], []); perBelfiore.get(r[3]).push(r); }
  }
  indiceDi = comuni; indiceC = { perNome, perProv, perBelfiore, nomi: [...perNome.keys()], province: new Set([...perProv.keys()].filter(p => /^[A-Z]{2}$/.test(p) && p !== "ES")) };
  return indiceC;
}
// la riga giusta per una data: un comune che ha cambiato provincia ha più righe (la fine validità dice fino a quando valeva)
export function rigaPerData(righe, iso) {
  const vive = righe.filter(r => !r[4]);
  if (iso) { const valide = righe.filter(r => r[5] && r[5] >= iso).sort((a, b) => (a[5] < b[5] ? -1 : 1)); if (valide.length) return valide[0]; }
  return vive[0] || righe[0] || null;
}
// un nome di comune (anche con una lettera letta male, due se è lungo); con la provincia si cerca solo lì
function cercaNome(pezzo, idx, prov) {
  const cifre = (pezzo.match(/\d/g) || []).length;
  if (pezzo.replace(/ /g, "").length < 3 || cifre * 2 > pezzo.replace(/ /g, "").length) return null;
  if (cifre) pezzo = pezzo.replace(/0/g, "O").replace(/1/g, "I").replace(/5/g, "S").replace(/8/g, "B");   // «SEVER0» letto con lo zero
  const filtra = (rr) => rr.filter(r => !prov || r[2] === prov);
  const esatte = filtra(idx.perNome.get(pezzo) || []);
  if (esatte.length) return { righe: esatte, err: 0 };
  if (pezzo.length < 5) return null;
  const max = pezzo.length >= 9 ? 2 : 1; let dmin = max + 1, trovati = [];
  for (const nome of prov ? (idx.perProv.get(prov) || []) : idx.nomi) {
    const d = distanza(pezzo, nome, max);
    if (d < dmin) { dmin = d; trovati = [nome]; } else if (d === dmin && d <= max) trovati.push(nome);
  }
  if (dmin > max || trovati.length !== 1) return null;
  const rr = filtra(idx.perNome.get(trovati[0]) || []);
  return rr.length ? { righe: rr, err: dmin } : null;
}
// tutte le righe dello stesso comune (stesso codice catastale: anche quelle di quando era in un'altra provincia)
const stessoComune = (idx, righe) => { const b = righe[0] && righe[0][3]; return b && righe.every(r => r[3] === b) ? (idx.perBelfiore.get(b) || righe) : righe; };
const righeDi = (t) => String(t || "").split(/\n+/).map(nt).filter(Boolean);
const NON_NOMI = new Set(["MUNICIPALITY", "MUNICIPALITE", "COMMUNE", "AUTHORITY", "AUTORITA", "AUTORITE", "ISSUING", "AUTHORITE"]);
// «COMUNE DI LESINA» (carta d'identità) o «QUESTURA DI FOGGIA» (passaporto italiano) → la riga del comune
export function trovaRilascio(testo, comuni) {
  const idx = indice(comuni), righe = righeDi(testo);
  for (let i = 0; i < righe.length; i++) {
    const m = righe[i].match(/(?:C[O0]MUNE|QUESTURA) ?D[I1L] ?(.*)$/); if (!m) continue;
    const parole = `${m[1]} ${righe[i + 1] || ""}`.split(" ").filter(p => p && !NON_NOMI.has(p)).slice(0, 8);
    let meglio = null;
    for (let a = 0; a < parole.length && a < 4; a++) for (let n = Math.min(5, parole.length - a); n >= 1; n--) {
      const r = cercaNome(parole.slice(a, a + n).join(" "), idx, "");
      if (!r) continue;
      const vive = r.righe.filter(x => !x[4]), usa = vive.length ? vive : r.righe;
      if (new Set(usa.map(x => x[3] || x[0])).size !== 1) continue;   // due comuni con lo stesso nome (CASTRO BG e LE): non tiro a indovinare
      const cand = { riga: rigaPerData(usa, ""), err: r.err, len: n };
      if (!meglio || cand.err < meglio.err || (cand.err === meglio.err && cand.len > meglio.len)) meglio = cand;
      break;
    }
    if (meglio) return meglio.riga;
  }
  return null;
}
// il luogo di nascita italiano: «NOME (PR)» dopo «NASCITA»/«BIRTH», oppure sulla riga con la data di nascita
export function trovaNascita(testo, comuni, nascitaISO) {
  const idx = indice(comuni), righe = righeDi(testo);
  const coppie = (parole) => {
    let meglio = null;
    for (let j = 1; j < parole.length; j++) {
      const prov = parole[j]; if (!idx.province.has(prov)) continue;
      for (let k = Math.min(5, j); k >= 1; k--) {
        const r = cercaNome(parole.slice(j - k, j).join(" "), idx, prov); if (!r) continue;
        const cand = { riga: rigaPerData(stessoComune(idx, r.righe), nascitaISO || ""), err: r.err, len: k };
        if (!meglio || cand.err < meglio.err || (cand.err === meglio.err && cand.len > meglio.len)) meglio = cand;
        break;
      }
    }
    return meglio;
  };
  for (let i = 0; i < righe.length; i++) {
    if (!/NASCITA|BIRTH/.test(righe[i])) continue;
    const dopo = righe[i].replace(/^.*?(?:NASCITA|BIRTH)/, "");
    const m = coppie(`${dopo} ${righe[i + 1] || ""} ${righe[i + 2] || ""}`.split(" ").filter(Boolean));
    if (m) return m.riga;
  }
  if (nascitaISO) {
    const [a, mm, g] = nascitaISO.split("-"), re = new RegExp(`\\b${g} ?${mm} ?(?:${a}|${a.slice(2)})\\b`);
    for (const r of righe) if (re.test(r)) { const m = coppie(r.split(" ")); if (m) return m.riga; }
  }
  return null;
}
// dal davanti della carta d'identità elettronica: il numero (CA12345AB) e che è una carta d'identità italiana
export function altroDavanti(testo) {
  const t = String(testo || "").toUpperCase(), x = t.replace(/[^A-Z0-9]/g, " ");
  const num = (x.match(/\b([A-Z]{2}\d{5}[A-Z]{2})\b/) || [])[1] || "";
  const cie = /CARTA ?D[I1] ?IDENTIT|IDENTITY ?CARD/.test(t.replace(/[^A-Z ]/g, "")) && /REPUBBLICA ?ITALIANA|ITALIANA/.test(t.replace(/[^A-Z ]/g, ""));
  return { numero: num, cie };
}

// ---- la lettura della foto (Tesseract, dentro il telefono; si scarica solo la prima volta, circa 7 MB) ---------------
let lettore = null, lettoreInCarico = null;
const WL_MRZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<", WL_DAVANTI = WL_MRZ + "()./'-, ";
function caricaScript(src) { return new Promise((ok, ko) => { if (window.Tesseract) return ok(); const s = document.createElement("script"); s.src = src; s.onload = () => ok(); s.onerror = () => ko(new Error("non riesco a scaricare il lettore dei documenti")); document.head.appendChild(s); }); }
export async function preparaLettore(avanza) {
  if (lettore) return lettore;
  if (lettoreInCarico) return lettoreInCarico;
  lettoreInCarico = (async () => {
    await caricaScript("ocr/tesseract.min.js");
    let simd = false; try { simd = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); } catch (e) {}
    const w = await window.Tesseract.createWorker("eng", 1, {
      workerPath: "ocr/worker.min.js", corePath: simd ? "ocr/tesseract-core-simd-lstm.wasm.js" : "ocr/tesseract-core-lstm.wasm.js", langPath: "ocr", gzip: true,
      logger: (m) => { try { if (avanza && m && m.status) avanza(m.status, m.progress || 0); } catch (e) {} },
    });
    await w.setParameters({ tessedit_char_whitelist: WL_MRZ, tessedit_pageseg_mode: "6", preserve_interword_spaces: "0" });
    lettore = w; return w;
  })();
  try { return await lettoreInCarico; } finally { lettoreInCarico = null; }
}
// quanto è storta la foto: le righe di testo, viste di traverso, fanno le «strisce» più nette quando l'angolo è giusto
// (si guardano solo i segni scuri rispetto a quello che hanno intorno: il tavolo e le ombre non contano)
function angoloStorto(src) {
  const k = Math.min(1, 640 / Math.max(src.width, src.height)), w = Math.max(1, Math.round(src.width * k)), h = Math.max(1, Math.round(src.height * k));
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(src, 0, 0, w, h);
  const p = x.getImageData(0, 0, w, h).data, g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = p[i * 4];
  const I = new Float64Array((w + 1) * (h + 1));   // immagine integrale: la media intorno a ogni punto in un attimo
  for (let y = 0; y < h; y++) { let r = 0; for (let xx = 0; xx < w; xx++) { r += g[y * w + xx]; I[(y + 1) * (w + 1) + xx + 1] = I[y * (w + 1) + xx + 1] + r; } }
  const R = 7, pts = [];
  for (let y = R; y < h - R; y++) for (let xx = R; xx < w - R; xx++) {
    const s = I[(y + R + 1) * (w + 1) + xx + R + 1] - I[(y - R) * (w + 1) + xx + R + 1] - I[(y + R + 1) * (w + 1) + xx - R] + I[(y - R) * (w + 1) + xx - R];
    if (g[y * w + xx] < s / ((2 * R + 1) * (2 * R + 1)) - 28) pts.push(xx, y);
  }
  if (pts.length < 400) return 0;
  const passo = Math.max(1, Math.floor(pts.length / 2 / 30000)) * 2;
  let meglio = 0, top = -1;
  for (let a = -15; a <= 15; a += 0.5) {
    const r = a * Math.PI / 180, s = Math.sin(r), co = Math.cos(r), off = w + 2, hist = new Float32Array(h + 2 * w + 4);
    for (let i = 0; i < pts.length; i += passo) hist[Math.round(-pts[i] * s + pts[i + 1] * co) + off]++;
    let e = 0; for (let i = 0; i < hist.length; i++) e += hist[i] * hist[i];
    if (e > top) { top = e; meglio = a; }
  }
  return meglio;
}
// la foto → una tela in grigio, grande abbastanza, girata come serve e raddrizzata
async function tela(file, giro = 0) {
  const img = await createImageBitmap(file, { imageOrientation: "from-image" });
  const lato = Math.max(img.width, img.height), scala = Math.min(1, 2400 / lato) * (lato < 1400 ? 1400 / lato : 1);
  const w = Math.round(img.width * scala), h = Math.round(img.height * scala);
  const giraTela = (src, gradi) => {
    const r = gradi * Math.PI / 180, cw = Math.round(Math.abs(src.width * Math.cos(r)) + Math.abs(src.height * Math.sin(r))), ch = Math.round(Math.abs(src.width * Math.sin(r)) + Math.abs(src.height * Math.cos(r)));
    const c = document.createElement("canvas"); c.width = cw; c.height = ch; const x = c.getContext("2d", { willReadFrequently: true });
    x.fillStyle = "#808080"; x.fillRect(0, 0, cw, ch); x.translate(cw / 2, ch / 2); x.rotate(r); x.drawImage(src, -src.width / 2, -src.height / 2, src.width, src.height); return c;
  };
  const base = document.createElement("canvas"); base.width = w; base.height = h; base.getContext("2d").drawImage(img, 0, 0, w, h);
  try { img.close(); } catch (e) {}
  let c = giro ? giraTela(base, giro) : base;
  const storta = angoloStorto(c);
  if (Math.abs(storta) >= 0.75) c = giraTela(c, -storta);
  // grigio e contrasto (la MRZ è nera su fondo chiaro)
  const x = c.getContext("2d", { willReadFrequently: true });
  const d = x.getImageData(0, 0, c.width, c.height), p = d.data; let min = 255, max = 0;
  for (let i = 0; i < p.length; i += 4) { const gg = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; p[i] = gg; if (gg < min) min = gg; if (gg > max) max = gg; }
  const k = 255 / Math.max(40, max - min);
  for (let i = 0; i < p.length; i += 4) { const gg = Math.max(0, Math.min(255, (p[i] - min) * k)); p[i] = p[i + 1] = p[i + 2] = gg; }
  x.putImageData(d, 0, 0);
  c.storta = storta;
  return c;
}
// il codice a barre del codice fiscale (sui telefoni Android il lettore c'è già nel browser)
async function codiceABarre(file) {
  try {
    if (!("BarcodeDetector" in window)) return "";
    const formati = await window.BarcodeDetector.getSupportedFormats();
    const d = new window.BarcodeDetector({ formats: formati.filter(f => ["code_39", "code_128", "pdf417", "qr_code", "data_matrix", "code_93"].includes(f)) });
    const img = await createImageBitmap(file, { imageOrientation: "from-image" });
    const trovati = await d.detect(img); try { img.close(); } catch (e) {}
    for (const b of trovati) { const c = candidatiCf(b.rawValue || ""); if (c.length) return c[0]; }
  } catch (e) {}
  return "";
}
// legge una foto: prova dritta, poi capovolta e di lato finché non trova le righe MRZ o il codice fiscale
export async function leggiFoto(file, avanza) {
  const w = await preparaLettore(avanza);
  let mrz = null, testi = [], giroMrz = 0, giroDavanti = null;
  const barre = await codiceABarre(file);
  for (const giro of [0, 180, 90, 270]) {
    if (avanza) avanza("leggo", 0);
    const c = await tela(file, giro);
    const { data } = await w.recognize(c);
    const t = data && data.text || ""; testi.push(t);
    const m = leggiMrz(t); if (m && (!mrz || m.voto > mrz.voto)) { mrz = m; giroMrz = giro; }
    if (mrz && mrz.voto >= 10) break;
    if (!mrz && sembraDavanti(t)) { giroDavanti = giro; break; }   // 6/11: il davanti di una carta (senza <<<), già dritto
  }
  const tutto = testi.join("\n");
  const cf = barre && (!mrz || cfCombacia(barre, mrz)) ? barre : trovaCf(tutto, mrz);
  // 6/11: la seconda lettura senza il filtro della MRZ, per il davanti della carta d'identità e la pagina del passaporto
  // italiano (chi l'ha rilasciato, il luogo di nascita); per il retro della carta d'identità non serve
  let davanti = "";
  if (!mrz || (mrz.passaporto && mrz.statoRilascio === "ITA")) {
    try {
      if (avanza) avanza("davanti", 0);
      await w.setParameters({ tessedit_char_whitelist: WL_DAVANTI, tessedit_pageseg_mode: "3" });
      const { data } = await w.recognize(await tela(file, giroDavanti ?? giroMrz));
      davanti = data && data.text || "";
    } catch (e) {}
    finally { try { await w.setParameters({ tessedit_char_whitelist: WL_MRZ, tessedit_pageseg_mode: "6" }); } catch (e) {} }
  }
  return { mrz, cf, testo: tutto, davanti };
}
