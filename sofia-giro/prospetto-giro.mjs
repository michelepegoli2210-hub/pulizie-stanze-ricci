// ============================================================================
//  IL FOGLIO DI PAPÀ LO LEGGE ARGON (giro 1.27.0)
//  Michele, 7/11: «il prospetto lo devi interpretare con Argon massima intelligenza e anche contestualizzarlo rispetto ai
//  messaggi che ci sono, anche quelli vecchi, anche il prospetto vecchio… e il prospetto lo deve aggiornare in automatico
//  da solo nella sezione prospetto… deve essere tutta una cascata che deve partire dal prospetto».
//  Come va:
//   1. il ponte sul PC (1.2.0) porta il file Excel che papà manda nel gruppo: posta/<id> (tipo «excel») + posta_media/<id>;
//   2. a ogni giro, se c'è un foglio nuovo, lo si apre con lo stesso lettore dell'app (xlsx.min.js + excel.js) e lo si legge
//      prima con le REGOLE FISSE (come «📄 Carica il foglio di papà» in Altro);
//   3. ARGON al massimo (thinkingLevel «high») riceve: il foglio camera per camera (le strisce colorate e le scritte), come
//      l'hanno lette le regole fisse, il prospetto che c'è adesso nell'app (chi l'ha scritto e quando), il taccuino di Sofia e
//      i messaggi del gruppo e di papà delle ultime tre settimane (anche quelli già letti). I nomi degli ospiti vanno SOLO in
//      codice ([O1]…), mai telefoni ed email. Argon scrive il prospetto giusto per il periodo: da tre giorni fa a due mesi e
//      mezzo avanti, solo nei mesi che il foglio ha;
//   4. si confronta col prospetto dell'app e si scrivono SOLO i cambi (nuovi, cambiati, tolti) nei soggiorni, e le note del
//      foglio: la sezione Prospetto si aggiorna da sola e, a cascata, l'app del titolare rifà le pulizie e le stelle
//      (pianifica, a ogni cambio dei soggiorni). Quello scritto A MANO che il foglio non ha non si toglie mai da solo: lo si dice;
//   5. in Segreteria (importazioni/segreteria_xl<id>) una riga per ogni cambio, ognuna col suo «↩ Annulla» (le «voci»
//      prima/dopo, come le letture delle chat), il riassunto e le cose di cui Sofia non è sicura;
//   6. se Argon non risponde (o risponde una cosa che non torna) si riprova al giro dopo; alla terza volta lo legge il modello
//      di riserva (il più sveglio dopo Argon) e, se nemmeno lui, il foglio si mette con le regole fisse; lo si dice sempre.
//  Più fogli insieme (il PC era spento): uno più vecchio coi mesi coperti da uno più nuovo è «superato»; gli altri uno per giro,
//  dal più vecchio (così vince sempre il più nuovo).
// ============================================================================
import { createRequire } from "node:module";
import * as L from "../logica.js";
import * as LET from "../lettura.js";
import { daSheetJS, leggiProspetto, etichetteColonne, cameraDaEtichetta, normalizza } from "../excel.js";
import { TIPI_OSPITE, DIZIONARIO_EXCEL } from "../regole.js";
import { aliasPerCamera } from "../dettatura.js";
import { chiediGemini, nomeGovDa } from "./lettura-giro.mjs";

const richiedi = createRequire(import.meta.url);
let XLSX = null;
export const lettoreExcel = () => XLSX || (XLSX = richiedi("../xlsx.min.js"));

export const INDIETRO = 3, AVANTI = 75;           // il periodo che si riscrive: da tre giorni fa (come le pulizie) a due mesi e mezzo avanti
export const BLOCCO_MS = 20 * 60 * 1000;          // un foglio «in lettura» da più di 20 minuti si riprende (il giro di prima si è fermato)
export const MAX_TENTATIVI = 3;                   // Argon non risponde 3 volte: il foglio si mette con le regole fisse
export const GIORNI_MESSAGGI = 21, MAX_MESSAGGI = 220;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ORDINE_ARGON = ["argon"];                   // il foglio lo legge solo Argon (Michele: «massima intelligenza»)

// ---- 1) quali fogli leggere ----------------------------------------------------------------------------------------------
export function fogliDaLeggere(posta, adesso = new Date()) {
  const t = adesso.getTime();
  return Object.values(posta || {}).filter(p => p && p.id && p.tipo === "excel" && (!p.prospetto || p.prospetto === "riprova"
    || (p.prospetto === "in_lettura" && t - (Date.parse(p.prospettoDa || "") || 0) > BLOCCO_MS)))
    .sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0));
}
// 1.32.0: dove si segna come è andata: il foglio dal gruppo nella posta, quello caricato dall'app nel suo documento
export const collDi = (p) => (p && p.__coll) || "posta";
export const nomeDelFile = (p) => String((p && p.didascalia) || "foglio.xlsx").split(" — ")[0].trim().slice(0, 120) || "foglio.xlsx";

// ---- 2) il periodo da riscrivere: dentro i mesi del foglio, di seguito, da tre giorni fa a due mesi e mezzo avanti ---------
export function periodoDelFoglio(ris, oggi) {
  const da0 = L.aggiungiGiorni(oggi, -INDIETRO), a0 = L.aggiungiGiorni(oggi, AVANTI);
  const mesi = [...((ris && ris.mesi) || [])].filter(m => m.a >= da0 && m.da < a0).sort((x, y) => (x.da < y.da ? -1 : 1));
  if (!mesi.length) return null;
  const seguiti = [mesi[0]];   // solo i mesi uno dopo l'altro: un buco nel foglio non deve cancellare quel mese nell'app
  for (const m of mesi.slice(1)) { if (m.da === L.aggiungiGiorni(seguiti[seguiti.length - 1].a, 1)) seguiti.push(m); else break; }
  const da = seguiti[0].da > da0 ? seguiti[0].da : da0;
  const fineMesi = L.aggiungiGiorni(seguiti[seguiti.length - 1].a, 1);
  return { da, a: fineMesi < a0 ? fineMesi : a0, mesi: seguiti.map(m => ({ nome: m.nome, da: m.da, a: m.a, foglio: m.foglio, anno: m.anno, mese: m.mese, giorni: m.giorni })) };   // [da, a)
}
export const dentro = (s, p) => !!s && s.inizio < p.a && s.fine > p.da;

// ---- 3) i codici dei nomi: anche quelli del foglio, anche scritti tutto minuscolo ----------------------------------------
const PAROLE_NON_NOME = new Set([...(DIZIONARIO_EXCEL.nonNomi || []), ...(DIZIONARIO_EXCEL.paroleStop || []), ...(DIZIONARIO_EXCEL.paroleCommento || []), ...(DIZIONARIO_EXCEL.paroleIstruzioni || []),
  "forse", "booking", "ospite", "ospiti", "operai", "operaio", "tecnici", "tecnico", "persone", "persona", "camera", "libera", "pulire", "cambio"].map(normalizza));
const PREFISSI_NON_NOME = (DIZIONARIO_EXCEL.negazioni || []).filter(p => !/\s/.test(p)).map(normalizza);   // disdett, annullat, cancellat
// «Rossi disdetto» → «Rossi»: le parole che non sono del nome non diventano un codice (Argon deve leggerle)
export function nomePerCodici(nome) {
  return String(nome || "").split(/\s+/).filter(w => { const n = normalizza(w); return n.length >= 2 && !/^\d/.test(n) && !PAROLE_NON_NOME.has(n) && !PREFISSI_NON_NOME.some(p => n.startsWith(p)); }).join(" ").trim();
}
export function codiciFoglio(ctx, nomiFoglio = []) {
  const extra = [...new Set(nomiFoglio.map(nomePerCodici).filter(n => n && n !== "?"))].map(nome => ({ nome }));
  const codici = LET.creaCodici({ ...ctx, soggiorni: [...(ctx.soggiorni || []), ...extra] });
  // le parole dei nomi scritte con le maiuscole sbagliate («rossi», «ROSSI»): le riporto come nel nome, così il codice le prende
  const via = new Set([...(ctx.camere || []).flatMap(c => [normalizza(c.nome), normalizza(c.id)]), ...(ctx.signore || []).map(z => normalizza(z.nome)), normalizza(ctx.nomeGov || ""), "michele", "papa", "lucia", "selena", "sofia", "albergo"]);
  const forma = new Map();
  for (const n of codici.nomi.values()) for (const w of String(n).split(/\s+/)) {
    const k = normalizza(w); if (k.length < 4 || via.has(k) || PAROLE_NON_NOME.has(k) || !/^\p{Lu}/u.test(w)) continue;
    forma.set(k, forma.has(k) && forma.get(k) !== w ? null : w);
  }
  const aCodici = (t) => codici.aCodici(String(t ?? "").replace(/\p{L}[\p{L}'’]*/gu, (w) => { const f = forma.get(normalizza(w)); return f && f !== w ? f : w; }));
  return { ...codici, aCodici };
}

// ---- 4) il foglio in parole per Argon: camera per camera, le strisce colorate (un colore = una lettera) e le scritte -------
export function grigliaFoglio(fogli, periodo, camere, cod = (t) => t) {
  const nomeCam = (id) => { const c = camere.find(x => x.id === id); return c ? `${c.nome} [${c.id}]` : `[${id}]`; };
  const pulito = (t) => cod(LET.senzaTelefoni(String(t || "").replace(/\s+/g, " ").trim()));
  const righe = [];
  for (const m of periodo.mesi) {
    const foglio = fogli.find(f => f.nome === m.foglio); if (!foglio) continue;
    let riga1 = 2;   // la riga del giorno 1 (come le regole fisse)
    for (let r = 0; r < Math.min(foglio.celle.length, 10); r++) { const t = foglio.celle[r][0]?.t || ""; if (/^\s*1\s*-/.test(t)) { riga1 = r; break; } }
    const etic = etichetteColonne(foglio), colori = new Map(), lettera = (k) => { if (!colori.has(k)) colori.set(k, String.fromCharCode(65 + (colori.size % 26))); return colori.get(k); };
    righe.push(`FOGLIO «${foglio.nome}» = ${m.nome} (${m.giorni} giorni)`);
    for (let c = 1; c <= foglio.maxC; c++) {
      const dove = cameraDaEtichetta(etic[1][c], etic[0][c]);
      if (!dove || !dove.camera) continue;
      const pezzi = []; let cur = null;
      const chiudi = () => { if (!cur) return; const testi = cur.celle.map(x => `il ${x.d}: «${pulito(x.t)}»`).join(", "); pezzi.push(`${cur.d0}→${cur.d1} colore ${lettera(cur.k)}${testi ? " (" + testi + ")" : " (senza scritte)"}`); cur = null; };
      for (let d = 1; d <= m.giorni; d++) {
        const cell = foglio.celle[riga1 + d - 1]?.[c] || { t: "", k: null };
        if (cell.k && cur && cur.k === cell.k) { cur.d1 = d; if (cell.t) cur.celle.push({ d, t: cell.t }); continue; }
        chiudi();
        if (cell.k) cur = { k: cell.k, d0: d, d1: d, celle: cell.t ? [{ d, t: cell.t }] : [] };
        else if (cell.t) pezzi.push(`il ${d} scritto senza colore: «${pulito(cell.t)}»`);
      }
      chiudi();
      righe.push(`- ${nomeCam(dove.camera)}: ${pezzi.length ? pezzi.join(" · ") : "vuota tutto il mese"}`);
    }
  }
  return righe.join("\n");
}

// ---- 5) le altre parti del testo per Argon ---------------------------------------------------------------------------
const gg = (iso) => `${L.dataMedia(iso)} (${iso})`;
const DA_CHI = { excel: "dal foglio di prima", mano: "a mano da Michele", sofia: "da Sofia (chat o dettatura)", governante: "dalla governante" };
export function soggiornoInParole(s, ctx, codici, extra = "") {
  const p = Number(s.persone) || 0;
  return `${codici.aCodici(s.nome || "?")}${p > 1 ? `, ${p} persone` : ""}, ${LET.tipoPerIA(s.tipo, ctx, codici)}, arriva ${gg(s.inizio)} → parte ${gg(s.fine)}${s.nota ? `, nota per le signore: «${codici.aCodici(LET.senzaTelefoni(s.nota))}»` : ""}${s.dubbio ? " (❓ da controllare)" : ""}${extra}`;
}
export function perCameraInParole(lista, ctx, codici, extra = () => "") {
  const per = new Map();
  for (const s of [...lista].sort((x, y) => (x.inizio < y.inizio ? -1 : 1))) { const l = per.get(s.camera) || []; l.push(s); per.set(s.camera, l); }
  return (ctx.camere || []).map(c => `- ${c.nome} [${c.id}]: ${(per.get(c.id) || []).map(s => soggiornoInParole(s, ctx, codici, extra(s))).join(" ; ") || "libera"}`).join("\n");
}
export function scrittoDa(s) {
  const quando = ISO.test(String(s.modificato || "").slice(0, 10)) ? ` il ${L.dataMedia(String(s.modificato).slice(0, 10))}` : "";
  return ` [scritto ${DA_CHI[s.origine] || "a mano"}${quando}]`;
}
export function messaggiInParole(msgs, codici) {
  return msgs.map(m => `[${m.data || "?"} ${m.ora || ""}] ${m.chat ? m.chat + " · " : ""}${codici.aCodici(m.chi || "?")}: ${codici.aCodici(LET.senzaTelefoni(String(m.testo || "").replace(/\s+/g, " ").slice(0, 600)))}`).join("\n");
}
export function istruzioniFoglio(ctx, codici) {
  const camere = (ctx.camere || []).map(c => `- ${c.id} = ${c.nome}${c.zona === "p1" ? " (1° piano)" : c.zona === "p2" ? " (2° piano)" : c.tipo === "casa" ? " (appartamento)" : ""}`).join("\n");
  const tipi = Object.keys(TIPI_OSPITE).map(k => `${k} = ${LET.tipoPerIA(k, ctx, codici)}`).join("; ");
  return `Sei ${ctx.nomeGov}, la segretaria de "Le Stanze di Ricci" a Lesina. Il PAPÀ di Michele tiene il PROSPETTO delle camere (chi dorme in quale camera e da che giorno a che giorno) in un FOGLIO EXCEL e lo manda nel gruppo WhatsApp quando cambia. Devi leggerlo con la massima attenzione e scrivere il prospetto GIUSTO per il periodo che ti dico, tenendo conto del prospetto che c'è adesso nell'app e dei messaggi del gruppo e di papà (anche quelli vecchi). Dal tuo prospetto l'app rifà da sola le pulizie delle signore: sbagliare un arrivo o una partenza vuol dire una camera sporca o una pulizia inutile.

COM'È FATTO IL FOGLIO: un foglio per mese, righe = giorni, colonne = camere. Una cella COLORATA = la camera è occupata quella NOTTE. Il nome dell'ospite o della ditta è scritto di solito nel primo giorno. Il giorno di PARTENZA NON è colorato: chi ha colorati i giorni dal 2 al 6 arriva il 2 e parte la mattina del 7 (fine = 7). Lo stesso colore di seguito è lo stesso soggiorno; due colori diversi attaccati sono due soggiorni diversi (uno parte e l'altro arriva lo stesso giorno). Nelle celle ci possono essere anche note: persone («2 operai», «x2»), istruzioni per le signore («cambio lenzuola», «asciugamani», «lettino»), «?», «forse», «no», «disdetto», commenti di papà. Un soggiorno che arriva all'ultimo giorno del mese e continua dal primo del mese dopo con lo stesso ospite è un soggiorno solo.

I NOMI DEGLI OSPITI E DELLE DITTE sono in codice ([O1], [O2]…): scrivili ESATTAMENTE così, non inventarne e non metterci altre parole. Se un ospite non ha nome scrivi "?". Le camere nel JSON solo coi codici qui sotto.

LE CAMERE:
${camere}

TIPI DI OSPITE (campo "tipo"): ${tipi}.

LE COSE CHE SAI GIÀ (il tuo taccuino):
${ctx.taccuino || "(vuoto)"}

COME DECIDERE:
1. Il FOGLIO è la base: quello che dice il foglio vale.
2. I MESSAGGI correggono il foglio solo se sono PIÙ RECENTI del foglio e dicono chiaro una cosa diversa (es. «[O4] arriva martedì e non lunedì», «la ditta in Alba è disdetta»): allora segui il messaggio e scrivi il perché nel campo "perche". I messaggi vecchi ti servono a capire chi è chi, le abitudini, i nomi scritti male.
3. Il PROSPETTO DI ADESSO nell'app ti serve per capire cosa è cambiato e per riconoscere gli stessi ospiti. Un soggiorno scritto dal foglio di prima che il foglio nuovo non ha più va TOLTO: mettilo in "tolti". Un soggiorno scritto A MANO da Michele (o da Sofia) che il foglio non ha: se il foglio è più vecchio di quello che ha scritto Michele, o non è chiaro, tienilo com'è (scrivilo nei soggiorni uguale all'app). NON fare domande: Michele non ha tempo di rispondere.
4. Se una cosa non è chiara (punto di domanda, «forse», colore senza nome, scritta che non capisci) decidi tu la più probabile guardando i messaggi, il prospetto di adesso e le abitudini; se proprio non si capisce, scrivi il soggiorno come lo dice il foglio con "dubbio": true e in "motivo" cosa non è chiaro. NON fare domande: "dubbi" resta vuoto.
5. Scrivi TUTTI i soggiorni che toccano il periodo, anche quelli che non cambiano e quelli che cominciano prima del periodo ma continuano dentro (con le date vere). Niente soggiorni fuori dal periodo.
6. "fine" è il giorno in cui l'ospite lascia la camera (la notte di "fine" la camera è libera). "persone" scrivilo solo se lo sai. "nota" è solo un'istruzione per le signore scritta nel foglio o in un messaggio (copiala com'è, corta); i commenti di papà no.
7. Per tenere corta la risposta: non scrivere i campi vuoti ("nota", "motivo", "perche") e "dubbio" quando è false.

RISPONDI SOLO CON QUESTO JSON (niente altro testo):
{"riassunto": "una o due frasi semplici per Michele: cosa è cambiato nel prospetto",
 "soggiorni": [{"camera": "aurora", "inizio": "AAAA-MM-GG", "fine": "AAAA-MM-GG", "nome": "[O3]", "tipo": "ferr", "persone": 2, "nota": "", "dubbio": true, "motivo": "", "perche": ""}],
 "tolti": [{"camera": "alba", "nome": "[O5]", "inizio": "AAAA-MM-GG", "perche": "nel foglio non c'è più"}],
 "dubbi": []}`;
}
export function testoFoglio({ oggi, periodo, nomeFile, arrivo, prima, griglia, regole, attuale, messaggi }) {
  return `OGGI è ${L.dataGiornoLungo(oggi)} (${oggi}).
IL PERIODO DA SCRIVERE: dal ${gg(periodo.da)} fino al ${gg(L.aggiungiGiorni(periodo.a, -1))} compreso (mesi del foglio: ${periodo.mesi.map(m => m.nome).join(", ")}).

A) IL FOGLIO NUOVO «${nomeFile}» (arrivato ${arrivo}):
${griglia || "(vuoto)"}

B) COME LO LEGGONO LE REGOLE FISSE DELL'APP (possono sbagliare: controlla tu):
${regole || "(niente)"}

C) IL PROSPETTO DI ADESSO NELL'APP, nel periodo${prima ? ` (il foglio di prima era «${prima}»)` : ""}:
${attuale || "(vuoto)"}

D) I MESSAGGI DEL GRUPPO E DI PAPÀ (dal più vecchio al più nuovo):
${messaggi || "(nessun messaggio)"}`;
}

// ---- 6) la risposta di Argon: nomi veri, camere e date giuste, solo nel periodo -------------------------------------------
const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const parole = (t) => norm(t).split(" ").filter(Boolean);
// «Rossi» e «Rossi Mario» sono lo stesso ospite (le parole del nome più corto stanno tutte nell'altro)
export function stessoNome(a, b) {
  const x = parole(a), y = parole(b); if (!x.length || !y.length) return norm(a) === norm(b);
  const [corto, lungo] = x.length <= y.length ? [x, y] : [y, x];
  return corto.every(w => lungo.includes(w));
}
const camereDa = (camere) => { const perId = new Map(camere.map(c => [c.id, c.id])), perNome = new Map(camere.map(c => [norm(c.nome), c.id])); return (x) => { const k = String(x || "").replace(/[[\]]/g, "").trim(); return perId.get(k) || perId.get(k.toLowerCase()) || perNome.get(norm(k)) || null; }; };
export function soggiorniDaArgon(j, { camere, periodo, codici, regole = [] }) {
  const cameraDi = camereDa(camere), out = [];
  for (const s of (j && Array.isArray(j.soggiorni) ? j.soggiorni : [])) {
    if (!s || typeof s !== "object") continue;
    const camera = cameraDi(s.camera); if (!camera) continue;
    const inizio = String(s.inizio || "").slice(0, 10), fine = String(s.fine || "").slice(0, 10);
    if (!ISO.test(inizio) || !ISO.test(fine) || fine <= inizio || L.giorniTra(inizio, fine) > 120) continue;
    if (!dentro({ inizio, fine }, periodo)) continue;
    const nome = LET.puliziaNome(codici.daCodici(String(s.nome || "").trim())).slice(0, 60) || "?";
    const dubbio = s.dubbio === true || /^(si|sì|true)$/i.test(String(s.dubbio || ""));
    const n = Math.round(Number(s.persone));
    const r = regole.find(x => x.camera === camera && x.inizio === inizio) || regole.find(x => x.camera === camera && x.inizio < fine && inizio < x.fine && stessoNome(x.nome, nome)) || null;
    out.push({ camera, inizio, fine, nome, tipo: TIPI_OSPITE[s.tipo] ? s.tipo : "unk", persone: n >= 1 && n <= 12 ? n : null,
      nota: codici.daCodici(String(s.nota || "")).replace(/\s+/g, " ").trim().slice(0, 200), dubbio, motivi: dubbio && s.motivo ? [codici.daCodici(String(s.motivo)).slice(0, 200)] : [],
      perche: codici.daCodici(String(s.perche || "")).replace(/\s+/g, " ").trim().slice(0, 140), testoOriginale: r ? String(r.testoOriginale || "").slice(0, 500) : "", notaPrivata: r ? String(r.notaPrivata || "").slice(0, 200) : "" });
  }
  // due soggiorni nella stessa camera che si accavallano: resta il primo (Argon ha sbagliato a contare)
  const tenuti = [];
  for (const s of out.sort((a, b) => (a.camera + a.inizio < b.camera + b.inizio ? -1 : 1))) { if (tenuti.some(t => t.camera === s.camera && t.inizio < s.fine && s.inizio < t.fine)) continue; tenuti.push(s); }
  return tenuti;
}
// le regole fisse come ripiego (Argon non ha risposto 3 volte): i soggiorni del periodo, tranne quelli che il foglio dice di non fare
export function soggiorniDaRegole(ris, periodo) {
  return (ris.soggiorni || []).filter(s => !s.nonCreare && dentro(s, periodo)).map(s => ({ camera: s.camera, inizio: s.inizio, fine: s.fine, nome: s.nome || "?", tipo: TIPI_OSPITE[s.tipo] ? s.tipo : "unk", persone: s.persone || null, nota: s.nota || "", dubbio: !!s.dubbio, motivi: s.motivi || [], perche: "", testoOriginale: s.testoOriginale || "", notaPrivata: s.notaPrivata || "" }));
}

// ---- 7) il confronto col prospetto dell'app: nuovi, cambiati, tolti (gli uguali non si toccano) -----------------------------
// quello che Argon non dice (persone, nota) resta come nell'app; il nome dell'app resta se è lo stesso ospite scritto più lungo
export function unisci(c, f) {
  return { ...f, nome: stessoNome(c.nome, f.nome) && parole(c.nome).length >= parole(f.nome).length ? c.nome : f.nome, tipo: f.tipo === "unk" && TIPI_OSPITE[c.tipo] ? c.tipo : f.tipo, persone: f.persone || Number(c.persone) || 1, nota: f.nota || c.nota || "" };
}
export function uguale(c, d) {
  return c.camera === d.camera && c.inizio === d.inizio && c.fine === d.fine && stessoNome(c.nome, d.nome) && c.tipo === d.tipo && (Number(c.persone) || 1) === (Number(d.persone) || 1) && norm(c.nota) === norm(d.nota) && !!c.dubbio === !!d.dubbio;
}
export function confronta(attuali, finali, periodo) {
  const restanti = attuali.filter(s => dentro(s, periodo)).map(s => ({ ...s }));
  const nuovi = [], cambiati = [], uguali = [];
  const prendi = (f, prova) => { const i = restanti.findIndex(c => c.camera === f.camera && prova(c)); return i >= 0 ? restanti.splice(i, 1)[0] : null; };
  const accavalla = (c, f) => c.inizio < f.fine && f.inizio < c.fine;
  for (const f of finali) {
    const c = prendi(f, c => c.inizio === f.inizio && stessoNome(c.nome, f.nome)) || prendi(f, c => c.inizio === f.inizio)
      || prendi(f, c => accavalla(c, f) && stessoNome(c.nome, f.nome))
      || prendi(f, c => accavalla(c, f) && c.fine === f.fine);
    if (!c) { nuovi.push({ ...f, persone: f.persone || 1 }); continue; }
    const d = unisci(c, f);
    if (uguale(c, d)) uguali.push(c); else cambiati.push({ prima: c, dopo: d });
  }
  return { nuovi, cambiati, tolti: restanti, uguali };
}

// ---- 8) le scritture e le righe della Segreteria (con le voci per «↩ Annulla», come le letture delle chat) -------------------
const senzaId = (s) => { const { id, ...r } = s || {}; return r; };
const quando = (iso) => L.dataMedia(iso);
export function mesiCoperti(inizio, fine) { const out = []; for (let m = L.primoDelMese(inizio); m < fine; m = L.aggiungiGiorni(L.ultimoDelMese(m), 1)) out.push(L.meseDi(m)); return out; }
export function cosaCambia(p, d) {
  const pezzi = [];
  if (!stessoNome(p.nome, d.nome)) pezzi.push(`adesso c'è ${d.nome} (prima ${p.nome || "?"})`);
  if (p.inizio !== d.inizio) pezzi.push(`arriva ${quando(d.inizio)} invece di ${quando(p.inizio)}`);
  if (p.fine !== d.fine) pezzi.push(`parte ${quando(d.fine)} invece di ${quando(p.fine)}`);
  if ((Number(p.persone) || 1) !== (Number(d.persone) || 1)) pezzi.push(`${d.persone} ${d.persone === 1 ? "persona" : "persone"} invece di ${Number(p.persone) || 1}`);
  if (p.tipo !== d.tipo && TIPI_OSPITE[d.tipo]) pezzi.push(`adesso è «${TIPI_OSPITE[d.tipo].nome}»`);
  if (norm(p.nota) !== norm(d.nota)) pezzi.push(d.nota ? `nota per le signore: «${d.nota}»` : "tolta la nota per le signore");
  if (!!p.dubbio !== !!d.dubbio) pezzi.push(d.dubbio ? "non sono sicura (❓)" : "adesso è sicuro");
  return pezzi.join(", ") || "sistemato";
}
export function scritture(cmp, { camere, nomeFile, adesso, nomeGov = "Sofia", modo = "argon", perTolti = [], idOccupati = new Set() }) {
  const nomeCam = (id) => (camere.find(c => c.id === id) || { nome: id }).nome;
  const ora = adesso.toISOString(), ops = [], fatti = [], tenuti = [];
  const dati = (f, base = {}) => ({ ...base, camera: f.camera, inizio: f.inizio, fine: f.fine, nome: f.nome, tipo: f.tipo, persone: f.persone || 1, nota: f.nota || "", notaPrivata: f.notaPrivata || base.notaPrivata || "", dubbio: !!f.dubbio, motivi: f.motivi || [], testoOriginale: f.testoOriginale || base.testoOriginale || "", origine: "excel", foglio: nomeFile, mesi: mesiCoperti(f.inizio, f.fine), modificato: ora, da: nomeGov, sofia: modo });
  const perche = (t) => t ? ` — ${t}` : "";
  const righe = [];
  for (const f of cmp.nuovi) {
    let id = `xl_${f.camera}_${f.inizio}`, n = 2; while (idOccupati.has(id)) id = `xl_${f.camera}_${f.inizio}_${n++}`; idOccupati.add(id);
    const d = dati(f);
    ops.push({ tipo: "salva", coll: "soggiorni", id, dati: d });
    righe.push({ q: f.inizio + f.camera, testo: `📅 ${nomeCam(f.camera)}: ${f.nome}${f.persone > 1 ? ` (${f.persone})` : ""}, arriva ${quando(f.inizio)} → parte ${quando(f.fine)}${f.dubbio ? " ❓" : ""}${perche(f.perche)}`, voci: [{ coll: "soggiorni", id, prima: null, dopo: JSON.stringify(d) }] });
  }
  for (const { prima: p, dopo: f } of cmp.cambiati) {
    const prima = senzaId(p), d = dati(f, prima);
    ops.push({ tipo: "salva", coll: "soggiorni", id: p.id, dati: d });
    righe.push({ q: f.inizio + f.camera, testo: `📅 ${nomeCam(f.camera)}: ${f.nome} — ${cosaCambia(p, f)}${perche(f.perche)}`, voci: [{ coll: "soggiorni", id: p.id, prima: JSON.stringify(prima), dopo: JSON.stringify(d) }] });
  }
  for (const p of cmp.tolti) {
    const t = perTolti.find(x => x.camera === p.camera && (x.inizio === p.inizio || stessoNome(x.nome, p.nome))) || null;
    // scritto a mano (o da Sofia) e il foglio non ce l'ha: non lo tolgo da sola, lo dico
    if (p.origine !== "excel") { tenuti.push(`❓ ${nomeCam(p.camera)}: ${p.nome || "?"} (${quando(p.inizio)} → ${quando(p.fine)}) non è nel foglio, ma l'${p.origine === "sofia" ? "ha scritto Sofia" : "hai scritto tu"}: l'ho lasciato. Se non c'è più, toglilo dal prospetto.`); continue; }
    ops.push({ tipo: "cancella", coll: "soggiorni", id: p.id });
    righe.push({ q: p.inizio + p.camera, testo: `📅 ${nomeCam(p.camera)}: tolto ${p.nome || "?"} (${quando(p.inizio)} → ${quando(p.fine)})${perche((t && t.perche) || "nel foglio non c'è più")}`, voci: [{ coll: "soggiorni", id: p.id, prima: JSON.stringify(senzaId(p)), dopo: null }] });
  }
  righe.sort((a, b) => (a.q < b.q ? -1 : a.q > b.q ? 1 : 0));
  righe.forEach((r, i) => fatti.push({ k: "f" + i, tipo: "prospetto", testo: r.testo.slice(0, 300), esito: "", voci: r.voci, annullato: false }));
  return { ops, fatti, tenuti };
}
// le note del foglio (istruzioni per le signore e note private) nel periodo: come «Carica il foglio di papà», una riga sola in Segreteria
export function scrittureNote(vecchie, nuove, { camere, nomeFile, nomeGov = "Sofia", k = 0 }) {
  const chiave = (n) => `${n.camera || ""}|${n.data}|${norm(n.testo)}|${n.privata ? 1 : 0}`;
  const nuoveK = new Map(nuove.map(n => [chiave(n), n])), vecchieK = new Map(vecchie.map(n => [chiave(n), n]));
  const ops = [], voci = [], usati = new Set(vecchie.map(n => n.id)), messe = [], tolte = [];
  for (const [kk, n] of nuoveK) {
    if (vecchieK.has(kk)) continue;
    const base = `xl_${n.camera || n.esterno || "gen"}_${n.data}_`; let i = 0; while (usati.has(base + i)) i++; usati.add(base + i);
    const d = { data: n.data, camera: n.camera || null, testo: String(n.testo || "").slice(0, 500), privata: !!n.privata, origine: "excel", foglio: nomeFile, da: nomeGov };
    ops.push({ tipo: "salva", coll: "note", id: base + i, dati: d }); voci.push({ coll: "note", id: base + i, prima: null, dopo: JSON.stringify(d) }); messe.push(n);
  }
  for (const [kk, n] of vecchieK) {
    if (nuoveK.has(kk)) continue;
    ops.push({ tipo: "cancella", coll: "note", id: n.id }); voci.push({ coll: "note", id: n.id, prima: JSON.stringify(senzaId(n)), dopo: null }); tolte.push(n);
  }
  if (!voci.length) return { ops, fatto: null };
  const nomeCam = (id) => (camere.find(c => c.id === id) || { nome: id || "casa" }).nome;
  const es = messe.find(n => !n.privata) || messe[0];
  const testo = `📝 Note del foglio: ${messe.length ? `${messe.length} ${messe.length === 1 ? "nuova" : "nuove"}` : ""}${messe.length && tolte.length ? ", " : ""}${tolte.length ? `${tolte.length} ${tolte.length === 1 ? "tolta" : "tolte"}` : ""}${es ? ` (es. ${nomeCam(es.camera)} ${quando(es.data)}: «${String(es.testo).slice(0, 60)}»)` : ""}`;
  return { ops, fatto: { k: "f" + k, tipo: "note", testo: testo.slice(0, 300), esito: "", voci, annullato: false } };
}

// ---- 9) i messaggi per il contesto: la posta e le letture della Segreteria delle ultime settimane (anche già letti) -----------
export function messaggiContesto(posta, letture, adesso = new Date()) {
  const da = adesso.getTime() - GIORNI_MESSAGGI * 86400000, daIso = new Date(da).toISOString().slice(0, 10), per = new Map();
  const metti = (m) => { if (!m || !m.testo || /^📊/.test(m.testo)) return; const k = m.id || `${m.data}|${m.ora}|${m.chi}|${m.testo}`; if (!per.has(k)) per.set(k, m); };
  for (const p of Object.values(posta || {})) {
    if (!p || p.tipo === "excel" || (Number(p.ts) || 0) < da) continue;
    const testo = p.tipo === "audio" ? (p.trascrizione ? `🎤 ${p.trascrizione}` : "") : p.tipo === "foto" ? `📷 (una foto)${p.didascalia ? " " + p.didascalia : ""}` : p.testo;
    metti({ id: p.id, data: p.data, ora: p.ora, chi: p.chi, chat: p.chat, testo });
  }
  for (const x of Object.values(letture || {})) for (const m of (x && Array.isArray(x.messaggi) ? x.messaggi : [])) if (m && String(m.data || "") >= daIso) metti(m);
  return [...per.values()].sort((a, b) => `${a.data} ${a.ora}`.localeCompare(`${b.data} ${b.ora}`)).slice(-MAX_MESSAGGI);
}

// ---- 10) aprire un foglio (le regole fisse: non costa niente) ---------------------------------------------------------------
export async function apriFoglio(db, p, oggi) {
  const x = { p, nomeFile: nomeDelFile(p), fogli: null, ris: null, periodo: null, problema: "" };
  const media = p.__coll === "importazioni" ? (p.dati ? { dati: p.dati } : null) : p.media ? await db.doc("posta_media", p.id) : null;   // 1.32.0
  if (!media || !media.dati) { x.problema = "senza file"; return x; }
  try {
    const X = lettoreExcel();
    const wb = X.read(Buffer.from(String(media.dati), "base64"), { type: "buffer", cellStyles: true, cellFormula: true });
    x.fogli = daSheetJS(X, wb);
    x.ris = leggiProspetto(x.fogli, { anno: Number(oggi.slice(0, 4)) });
  } catch (e) { x.problema = "illeggibile"; return x; }
  x.periodo = x.ris.mesi.length ? periodoDelFoglio(x.ris, oggi) : null;
  if (!x.periodo) x.problema = x.ris.mesi.length ? "fuori periodo" : "non è il prospetto";
  return x;
}
// un foglio è «superato» se i suoi mesi li ha tutti un foglio arrivato dopo
export function superati(aperti) {
  const con = aperti.filter(x => x.periodo), out = new Set();
  con.forEach((x, i) => { const dopo = new Set(con.slice(i + 1).flatMap(y => y.periodo.mesi.map(m => m.da))); if (dopo.size && x.periodo.mesi.every(m => dopo.has(m.da))) out.add(x.p.id); });
  return out;
}

// ---- 11) tutto insieme ------------------------------------------------------------------------------------------------------
export async function leggiFogliPapa({ db, gemini, oggi, adesso = new Date(), prendiBase }) {
  // 1.32.0 (app 1.71.0): anche i fogli caricati dall'app col tasto «📄 Foglio» del Prospetto (importazioni/foglio_app_*)
  const tutti = { ...(await db.postaExcel()) };
  if (db.fogliApp) for (const [k, v] of Object.entries(await db.fogliApp())) if (v) tutti["app:" + k] = { ...v, id: v.id || k, tipo: "excel", media: true, __coll: "importazioni" };
  const pendenti = fogliDaLeggere(tutti, adesso);
  if (!pendenti.length) return null;
  const aperti = [];
  for (const p of pendenti) { try { aperti.push(await apriFoglio(db, p, oggi)); } catch (e) { aperti.push({ p, nomeFile: nomeDelFile(p), problema: "illeggibile" }); } }
  const esiti = [];
  const segreteria = async (p, nomeFile, dati) => { const lid = "xl" + p.id; await db.salva("importazioni", "segreteria_" + lid, { lid, quando: adesso.toISOString(), da: "giro", nome: "", n: 1, messaggi: [{ id: p.id, chat: p.chat || "", chi: p.chi || "", data: p.data || oggi, ora: p.ora || "", tipo: "excel", testo: `📊 Foglio Excel «${nomeFile}»` }], proposte: [], domande: [], fatti: [], non: [], ...dati }); return lid; };
  // i fogli che non si possono mettere nel prospetto: lo dico in Segreteria (niente intelligenza artificiale)
  for (const x of aperti.filter(y => y.problema)) {
    const r = x.problema === "senza file" ? `Il foglio «${x.nomeFile}» non mi è arrivato intero${/troppo grande/.test(String(x.p.testo || "")) ? " (è troppo grande)" : ""}: caricalo tu in Altro → «📄 Carica il foglio di papà».`
      : x.problema === "illeggibile" ? `Il foglio «${x.nomeFile}» non riesco ad aprirlo: caricalo tu in Altro → «📄 Carica il foglio di papà».`
      : x.problema === "fuori periodo" ? `Il foglio «${x.nomeFile}» ha solo mesi passati o troppo avanti: il prospetto non l'ho toccato.`
      : `«${x.nomeFile}» non è il prospetto (non ha fogli coi nomi dei mesi): non ho toccato niente.`;
    try { const lid = await segreteria(x.p, x.nomeFile, { esito: "vuota", capito: { risposta: r } }); await db.merge(collDi(x.p), x.p.id, { prospetto: x.problema, prospettoLid: lid, letto: true }); esiti.push(`foglio «${x.nomeFile}»: ${x.problema}`); } catch (e) { console.warn("foglio di papà:", e && e.message); }
  }
  const buoni = aperti.filter(y => !y.problema), via = superati(buoni);
  for (const x of buoni.filter(y => via.has(y.p.id))) { try { await db.merge(collDi(x.p), x.p.id, { prospetto: "superato", letto: true }); esiti.push(`foglio «${x.nomeFile}»: superato da uno più nuovo`); } catch (e) {} }
  const x = buoni.find(y => !via.has(y.p.id));
  if (!x) return { esito: esiti.join(" · ") || "niente" };
  const r = await leggiUnFoglio({ db, gemini, oggi, adesso, prendiBase, x, segreteria });
  return { ...r, esito: [...esiti, r.esito].filter(Boolean).join(" · ") };
}

export async function leggiUnFoglio({ db, gemini, oggi, adesso, prendiBase, x, segreteria }) {
  const { p, nomeFile, fogli, ris, periodo } = x;
  // il segno «lo sto leggendo» (se un altro giro l'ha preso nel frattempo, niente)
  const ok = await db.segnaSe(collDi(p), p.id, "prospettoDa", p.prospettoDa, { prospetto: "in_lettura", prospettoDa: adesso.toISOString() });
  if (!ok) return { esito: `foglio «${nomeFile}»: lo sta leggendo un altro giro` };
  const tentativi = (Number(p.prospettoTentativi) || 0) + 1;
  try {
    // il contesto: il prospetto dell'app (anche un po' prima, per riconoscere gli ospiti), i clienti, il taccuino, i messaggi
    const base = await prendiBase();
    const [sog, cl, gov, tac, posta, letture, foglioPrima, noteDb] = await Promise.all([db.soggiorniDa(L.aggiungiGiorni(periodo.da, -60)), db.tutti("clienti"), db.doc("impostazioni", "governante"), db.doc("importazioni", "taccuino-sofia"),
      db.postaDa(adesso.getTime() - GIORNI_MESSAGGI * 86400000), db.importazioniDa(L.aggiungiGiorni(oggi, -GIORNI_MESSAGGI)), db.doc("impostazioni", "foglio"), db.noteDa(periodo.da)]);
    const attuali = Object.values(sog || {}).filter(s => s && s.id && s.camera && ISO.test(String(s.inizio || "")) && ISO.test(String(s.fine || "")));
    const clienti = {}; for (const [k, v] of Object.entries(cl || {})) { const { id, ...resto } = v || {}; clienti[k] = resto; }
    const nomeGov = nomeGovDa(gov);
    const ctx = { oggi, camere: base.camere, signore: base.signore, soggiorni: attuali, clienti, nomeGov, nomeMio: "Michele", alias: aliasPerCamera(), tipiOspite: TIPI_OSPITE };
    ctx.taccuino = LET.taccuinoPerIA((tac && Array.isArray(tac.voci)) ? tac.voci : [], ctx);
    const codici = codiciFoglio(ctx, [...(ris.soggiorni || []).map(s => s.nome), ...Object.entries(TIPI_OSPITE).filter(([k]) => k === "fond" || k === "dago").map(([, v]) => v.nome)]);   // anche le ditte in codice
    const nelPeriodo = attuali.filter(s => dentro(s, periodo));
    const regoleP = ris.soggiorni.filter(s => dentro(s, periodo));
    const msgs = messaggiContesto(posta, Object.fromEntries(Object.entries(letture || {}).filter(([id]) => String(id).startsWith("segreteria_") && !String(id).startsWith("segreteria_xl"))), adesso);
    // Argon al massimo; se non risponde (o risponde una cosa che non torna) si riprova al giro dopo; alla terza volta il modello
    // di riserva (il più sveglio dopo Argon: legge lo stesso coi messaggi), e se nemmeno lui, le regole fisse
    let finali = null, j = null, modello = "", modo = "argon", credito = false, perche = "";
    const senzaChiave = !gemini || (!gemini.chiave && typeof gemini.chiedi !== "function");
    const chiedi = async (ordine, livello, secondi) => {
      const testo = testoFoglio({
        oggi, periodo, nomeFile, arrivo: `il ${L.dataMedia(p.data || oggi)} alle ${p.ora || "?"} da ${codici.aCodici(p.chi || "?")}${p.chat ? ` nella chat «${p.chat}»` : ""}`,
        prima: foglioPrima && foglioPrima.nome ? `${foglioPrima.nome}${foglioPrima.quando ? ", messo il " + foglioPrima.quando : ""}` : "",
        griglia: grigliaFoglio(fogli, periodo, base.camere, codici.aCodici),
        regole: perCameraInParole(regoleP, ctx, codici, s => `${s.dubbio && (s.motivi || []).length ? ` [DUBBIO: ${codici.aCodici(LET.senzaTelefoni(s.motivi.join("; ")))}]` : ""}${s.nonCreare ? " [il foglio dice di NON metterlo]" : ""}`),
        attuale: perCameraInParole(nelPeriodo, ctx, codici, scrittoDa),
        messaggi: messaggiInParole(msgs, codici),
      });
      const { r } = await chiediGemini(gemini, { sistema: istruzioniFoglio(ctx, codici), storia: [], testo, livello, secondi, maxToken: 30000 }, ordine);
      const jj = LET.jsonDaRisposta(r && r.grezzo);
      if (!jj || !Array.isArray(jj.soggiorni)) throw new Error("la risposta non si legge");
      const ff = soggiorniDaArgon(jj, { camere: base.camere, periodo, codici, regole: regoleP });
      // il controllo: Argon non deve togliere molto più di quanto tolgono le regole fisse (se no ha sbagliato a leggere)
      const daArgon = confronta(nelPeriodo, ff, periodo), daRegole = confronta(nelPeriodo, soggiorniDaRegole(ris, periodo), periodo);
      const tolti = (c) => new Set(c.tolti.filter(s => s.origine === "excel").map(s => s.id)), tR = tolti(daRegole);
      const soloArgon = [...tolti(daArgon)].filter(id => !tR.has(id)).length;   // tolti da Argon ma che il foglio (letto con le regole) ha
      if (!ff.length && regoleP.filter(s => !s.nonCreare).length > 2) throw new Error("la risposta è senza soggiorni");
      if (soloArgon > 2) throw new Error(`toglie ${soloArgon} soggiorni che nel foglio ci sono: non torna`);
      return { finali: ff, j: jj, modello: (r && r.modello) || "" };
    };
    if (!senzaChiave) {
      try { ({ finali, j, modello } = await chiedi(ORDINE_ARGON, "high", 300)); }
      catch (e) {
        credito = /credito|402|prepay|billing|credit/i.test(String(e && e.message));
        if (tentativi < MAX_TENTATIVI) {
          await db.merge(collDi(p), p.id, { prospetto: "riprova", prospettoTentativi: tentativi, prospettoErrore: ("Argon: " + String((e && e.message) || e)).slice(0, 160) });
          return { esito: `foglio «${nomeFile}»: Argon non ha risposto (tentativo ${tentativi}), riprovo al prossimo giro`, credito };
        }
        perche = "Argon non ha risposto tre volte"; finali = null; j = null;
        try { ({ finali, j, modello } = await chiedi(["sveglia"], "", 180)); modo = "riserva"; }
        catch (e2) { console.warn("foglio di papà, modello di riserva:", e2 && e2.message); finali = null; j = null; modello = ""; }
      }
    } else perche = "nel giro manca la chiave di Gemini";
    if (!finali) { finali = soggiorniDaRegole(ris, periodo); modo = "regole"; }
    // il confronto e le scritture
    const cmp = confronta(nelPeriodo, finali, periodo);
    const perTolti = (j && Array.isArray(j.tolti) ? j.tolti : []).filter(t => t && t.camera).map(t => ({ camera: camereDa(base.camere)(t.camera), inizio: String(t.inizio || "").slice(0, 10), nome: codici.daCodici(String(t.nome || "")), perche: codici.daCodici(String(t.perche || "")).replace(/\s+/g, " ").trim().slice(0, 140) }));
    const { ops, fatti, tenuti } = scritture(cmp, { camere: base.camere, nomeFile, adesso, nomeGov, modo, perTolti, idOccupati: new Set(attuali.map(s => s.id)) });
    const vecchieNote = Object.values(noteDb || {}).filter(n => n && n.id && n.origine === "excel" && String(n.data || "") >= periodo.da && String(n.data || "") < periodo.a);
    const nuoveNote = (ris.note || []).filter(n => n && n.data >= periodo.da && n.data < periodo.a && n.testo);
    const nt = scrittureNote(vecchieNote, nuoveNote, { camere: base.camere, nomeFile, nomeGov, k: fatti.length });
    ops.push(...nt.ops); if (nt.fatto) fatti.push(nt.fatto);
    const nomeCam = (id) => (base.camere.find(c => c.id === id) || { nome: id }).nome;
    const domandeArgon = (j && Array.isArray(j.dubbi) ? j.dubbi : []).map(d => d && d.domanda ? `❓ ${codici.daCodici(String(d.domanda)).replace(/\s+/g, " ").slice(0, 200)}` : "").filter(Boolean);
    const camereConDomanda = new Set((j && Array.isArray(j.dubbi) ? j.dubbi : []).map(d => camereDa(base.camere)(d && d.camera)).filter(Boolean));
    const dubbi = [...domandeArgon, ...tenuti,
      ...finali.filter(s => s.dubbio && !camereConDomanda.has(s.camera)).map(s => `❓ ${nomeCam(s.camera)}: ${s.nome} (${quando(s.inizio)} → ${quando(s.fine)})${s.motivi.length ? ` — ${s.motivi[0]}` : ": non sono sicura"}`)].slice(0, 14);
    const quandoTxt = new Date(adesso).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
    const conChi = modo === "argon" ? "con Argon" : modo === "riserva" ? "col modello di riserva" : "con le regole fisse";
    ops.push({ tipo: "salva", coll: "impostazioni", id: "foglio", dati: { nome: nomeFile, quando: quandoTxt, mesi: periodo.mesi.map(m => m.nome), letti: ris.soggiorni.length, salvati: finali.length, dubbi: finali.filter(s => s.dubbio).length, da: `${nomeGov} ${conChi} (dal gruppo)`, dalGruppo: true } });
    await db.scrivi(ops);
    const nCambi = fatti.filter(f => f.tipo === "prospetto").length;
    const cambiTxt = nCambi ? `${nCambi} ${nCambi === 1 ? "cambio" : "cambi"} nel prospetto` : "il prospetto era già giusto";
    const riassunto = modo === "regole" ? `Ho messo nel prospetto il foglio «${nomeFile}» con le regole fisse (${perche}): ${cambiTxt}. Controlla le righe con ❓.`
      : `${modo === "riserva" ? `(${perche}: l'ho letto col modello di riserva) ` : ""}${j && j.riassunto ? codici.daCodici(String(j.riassunto)).replace(/\s+/g, " ").trim().slice(0, 400) : `Ho letto il foglio «${nomeFile}»: ${cambiTxt}.`}`;
    const lid = await segreteria(p, nomeFile, { esito: fatti.length ? "fatta" : "vuota", capito: { risposta: riassunto }, fatti, non: dubbi, modello, ripiego: modo !== "argon", applicata: adesso.toISOString(), applicataDa: "giro",
      prospetto: { foglio: nomeFile, modo, da: periodo.da, a: periodo.a, mesi: periodo.mesi.map(m => m.nome), nuovi: cmp.nuovi.length, cambiati: cmp.cambiati.length, tolti: cmp.tolti.length - tenuti.length, tenuti: tenuti.length, uguali: cmp.uguali.length } });
    await db.merge(collDi(p), p.id, { prospetto: "fatto", prospettoLid: lid, prospettoTentativi: tentativi, letto: true });
    // l'avviso per Michele (lo manda il giro, negli orari degli avvisi): solo se è cambiato il prospetto (i dubbi da soli stanno
    // in Segreteria: lo stesso foglio rimandato non deve riavvisare gli stessi dubbi)
    const nD = dubbi.length;
    const avviso = nCambi ? { titolo: `📊 Foglio di papà: ${nCambi ? cambiTxt : "niente da cambiare"}${nD ? ` · ${nD === 1 ? "un dubbio" : nD + " dubbi"}` : ""}`,
      testo: `${riassunto.length > 320 ? riassunto.slice(0, 317).replace(/\s+\S*$/, "") + "…" : riassunto}\n${nD ? `👉 ${nD === 1 ? "C'è una cosa" : `Ci sono ${nD} cose`} di cui non sono sicura: tocca per vedere.` : "👉 Tocca per vedere (ogni cambio ha il suo «Annulla»)."}`,
      extra: { url: "./index.html?segreteria=lettura", segreteria: "lettura", tag: "sofia-foglio" } } : null;
    return { esito: `foglio «${nomeFile}» letto ${modo === "argon" ? "da Argon" : modo === "riserva" ? "col modello di riserva" : "con le regole fisse"}: ${cmp.nuovi.length} nuovi, ${cmp.cambiati.length} cambiati, ${cmp.tolti.length - tenuti.length} tolti${tenuti.length ? `, ${tenuti.length} lasciati` : ""}${nt.fatto ? ", note aggiornate" : ""}`, lid, credito, avviso };
  } catch (e) {
    console.warn("foglio di papà:", e && e.message);
    const finito = tentativi >= MAX_TENTATIVI;
    try {
      let lid = "";
      if (finito) lid = await segreteria(p, nomeFile, { esito: "vuota", capito: { risposta: `Il foglio «${nomeFile}» non sono riuscita a metterlo nel prospetto (tre prove andate male): caricalo tu in Altro → «📄 Carica il foglio di papà».` } });
      await db.merge(collDi(p), p.id, { prospetto: finito ? "errore" : "riprova", prospettoTentativi: tentativi, prospettoErrore: String((e && e.message) || e).slice(0, 160), ...(finito ? { prospettoLid: lid, letto: true } : {}) });
    } catch (e2) {}
    return { esito: `foglio «${nomeFile}»: errore ${String((e && e.message) || e).slice(0, 80)}${finito ? " (lasciato stare)" : ""}` };
  }
}
