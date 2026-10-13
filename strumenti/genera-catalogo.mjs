// Genera catalogo.js (il modulo dati dell'app) dal catalogo di Michele:
//   catalogo/catalogo-governante-v4.csv  → RIGHE e PARTI (le regole come le usa l'app)
//   catalogo/catalogo-governante.xlsx     → CHECKLIST (foglio "Checklist signora"), CALENDARIO_VERO, LIVELLI_TESTO
// Uso (dalla cartella del repository): node strumenti/genera-catalogo.mjs   → scrive catalogo.js e stampa il rapporto.
// Serve node 18+ e python3 con openpyxl (per leggere l'Excel).
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { leggiCsv, norm, leggiRitmo, leggiQuando, leggiBlocco } from "./catalogo-lib.mjs";

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = `${DIR}/catalogo/catalogo-governante-v4.csv`, XLSX = `${DIR}/catalogo/catalogo-governante.xlsx`, OUT = `${DIR}/catalogo.js`;

// ---------------------------------------------------------------- CSV → righe
const tab = leggiCsv(readFileSync(CSV, "utf8"));
const intest = tab[0].map(norm);
const ci = n => intest.indexOf(norm(n));
const C = { id: ci("ID"), posto: ci("Posto"), sup: ci("Superficie"), regola: ci("Regola"), ogni: ci("Ogni quanto"), quando: ci("Quando"), prio: ci("Priorità"), min: ci("Minuti"), blocco: ci("Blocco"), base: ci("Profilo base"), come: ci("Come si fa"), prod: ci("Prodotto"), ctrl: ci("Controllo"), note: ci("Note") };
for (const [k, v] of Object.entries(C)) if (v < 0) throw new Error("colonna mancante: " + k);
const righe = tab.slice(1).map(c => { const v = i => (c[i] || "").trim(); return {
  id: v(C.id), posto: v(C.posto), superficie: v(C.sup), regola: v(C.regola), ogniTesto: v(C.ogni), quandoTesto: v(C.quando), prioritaTesto: v(C.prio), minuti: Number((v(C.min).match(/\d+/) || [0])[0]),
  bloccoTesto: v(C.blocco), profiloBaseTesto: v(C.base), come: v(C.come), prodotto: v(C.prod), controllo: v(C.ctrl), note: v(C.note),
}; }).filter(r => r.id);

// ---------------------------------------------------------------- aiuti
const GRUPPO = { "camera": "camera", "bagno": "bagno", "cucina appartamenti": "cucina", "balcone": "balcone", "zone comuni": "comuni", "lavanderia e attrezzi": "lavanderia", "meteo e stagioni": "stagioni", "prospetto e ospiti": "prospetto" };
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
function doveDa(r) {
  const p = norm(r.posto), s = norm(r.superficie);
  if (p === "camera") return "stanza"; if (p === "bagno") return "bagno"; if (p.startsWith("cucina")) return "cucina"; if (p === "balcone") return "balcone";
  if (p.startsWith("lavanderia")) return "lavanderia";
  if (p === "zone comuni") {
    if (/finestre delle scale e dei corridoi/.test(s)) return ["scale", "corridoio_p1", "corridoio_p2"];
    if (/luci esterne/.test(s)) return ["ingresso", "terrazzo", "scale"];
    if (/disegni dipinti/.test(s)) return ["corridoio_p2", "scale"];
    if (/pouf/.test(s)) return "corridoio_p2";
    if (/cassapanca|lanterna/.test(s)) return ["ingresso", "scale"];
    if (/ingresso|zerbini|bidoni dei rifiuti comuni/.test(s)) return "ingresso";
    if (/scale|corrimano|pianerottoli/.test(s)) return "scale";
    if (/corridoi/.test(s)) return ["corridoio_p1", "corridoio_p2"];
    if (/terrazzo/.test(s)) return "terrazzo";
    if (/magazzino|ripostiglio/.test(s)) return "lavanderia";
    return ["corridoio_p1", "corridoio_p2"];
  }
  if (p.startsWith("meteo")) { if (/pioggia|vento|autunno|esterni/.test(s)) return ["balcone", "terrazzo"]; if (/umidita/.test(s)) return "bagno"; return "stanza"; }
  return "stanza";
}
function iconaDa(r) {
  const t = norm(r.superficie + " " + r.regola);
  if (/letto|materass|coprimat|cuscin|piumin|coperta|copriletto|biancheria|accappato|asciugamani|tappetino del bagno/.test(t)) return /biancheria|asciugamani|accappato|coperta|piumin|copriletto/.test(t) ? "coperta" : "letto";
  if (/finestra|vetro|tapparell|zanzarier|tende|quadri|pannello|specchio|plafonier|luci|lampad|disegni|soffitto/.test(t)) return "finestra";
  if (/porta|maniglie|zerbin|ingresso|appendiabiti|cartelli/.test(t)) return "porta";
  if (/doccia|wc|bidet|lavandino|rubinett|scarico|silicone|piastrelle|scopino|portarotolo|dispenser|box/.test(t)) return "doccia";
  if (/frigo|freezer/.test(t)) return "frigo";
  if (/cucina|fornelli|forno|cappa|lavello|lavastoviglie|microonde|bollitore|moka|stoviglie|mestoli|piano di lavoro|portapane/.test(t)) return "cucina";
  if (/bidon|cestin/.test(t)) return "bidone";
  if (/condizionator|aria|ventilat|aspiratore|ventola|odori/.test(t)) return "aria";
  if (/termosifon|scaldasalv|stufe/.test(t)) return "termo";
  if (/armadio|comodin|scrivania|cassett|pensili|tavolo|mobile|mobili|pouf|cassapanca/.test(t)) return "armadio";
  if (/lavatrice|asciugatrice|lavatoio|stendin|ferro/.test(t)) return "lavatrice";
  if (/carrello|secchi|mappine|mop|panni|spugne|scope|aspirapolvere|guanti|scorte|prodotti/.test(t)) return "secchio";
  if (/pavimento|battiscopa|scale|corridoi|pianerottoli|gradini|tappeti/.test(t)) return "scopa";
  if (/balcone|terrazzo|ringhiera|piante|muro|unita esterna/.test(t)) return "terrazzo";
  if (/controllo|inventario|istruzioni|stato/.test(t)) return "lente";
  return "stella";
}
function materialeDa(r) {
  const t = norm(r.superficie);
  if (/^pavimento|pavimento della|gradini|corridoi: pavimento|scale: gradini/.test(t)) return "pavimento";
  if (/box|soffietto/.test(t)) return "box";
  if (/^porta|porta: anta|porta e maniglie/.test(t) && !/porta e vetro/.test(t)) return "porte";
  if (/armadio|comodin|scrivania|cassetti|pensili|tavolo|mobiletto|testiera|letto: struttura|mobili pesanti/.test(t)) return "mobili";
  return "";
}
const FIN = (da, a) => ({ da, a });
// ritmi: dalla colonna Regola se descrive le parti ("Sopra e davanti a ogni pulizia, dentro e dietro ogni 2 settimane"), altrimenti da "Ogni quanto"
function ritmiDa(r) {
  const a = leggiRitmo(r.ogniTesto), b = leggiRitmo(r.regola);
  if (b.length > a.length) return b;
  if (b.length === a.length && b.some(x => x.parte) && !a.some(x => x.parte)) return b;
  return a;
}
const TRIGGER = /settembre|ottobre|maggio|aprile|dopo vento|dopo pioggia|con la pioggia|subito se|fine stagione|a ogni piegatura/;

// ---------------------------------------------------------------- righe → parti (le regole come le usa l'app)
const SPECIALI = {
  C03: p => Object.assign(p, { ogni: 14, stagione: [FIN("06-11", "09-15")], ogniMezza: 30, stagioneMezza: [FIN("04-15", "06-10"), FIN("09-16", "10-31")] }),
  C10: p => Object.assign(p, { ogni: 30, ogniMezza: 14, stagioneMezza: [FIN("11-01", "03-31")] }),
  C21: p => Object.assign(p, { ogni: 30, stagione: [FIN("04-01", "10-31")] }),
  C50: p => Object.assign(p, { ogni: 14, stagione: [FIN("05-01", "09-30")] }),
  C17: p => Object.assign(p, { strada: true }),
  C43: p => Object.assign(p, { uso: true }),
  C45: p => Object.assign(p, { soloFrigo: true }),
  E04: p => Object.assign(p, { meteo: "vento" }),
  E01: p => Object.assign(p, { meteo: "pioggia" }),
  B01: p => Object.assign(p, { meteo: "umidita" }),
};
const parti = [], scartate = [];
for (const r of righe) {
  const blocco = leggiBlocco(r.bloccoTesto), quandoRiga = leggiQuando(r.quandoTesto) || "ripasso";
  const priorita = Number((r.prioritaTesto.match(/\d/) || [2])[0]);
  const profiloBase = /^s[iì]/i.test(r.profiloBaseTesto);
  const opz = /\(se c'?e|\(se ci sono|se c'?è\)/i.test(r.superficie);
  const base = { codice: r.id, posto: r.posto, gruppo: GRUPPO[norm(r.posto)] || "camera", superficie: r.superficie, regola: r.regola, priorita, minutiRiga: r.minuti, come: r.come, prodotto: r.prodotto || "nessuno", controllo: r.controllo, note: r.note, blocco, bloccoTesto: r.bloccoTesto, profiloBase, dove: doveDa(r), icona: iconaDa(r), opz, materiale: materialeDa(r) || undefined, euroMinuto: true };
  const mk = (extra) => { const p = { ...base, ...extra }; if (!p.materiale) delete p.materiale; return p; };
  if (/^O0/.test(r.id)) { scartate.push(`${r.id}: comportamento del prospetto, non una regola (${r.superficie})`); continue; }
  if (/^M0/.test(r.id)) { // meteo e stagione
    const m = { M01: { quando: "meteo", meteoTrigger: "freddo", ogni: 0 }, M02: { quando: "giorno", ogni: 150, stagione: [FIN("05-01", "05-31"), FIN("10-01", "10-31")] }, M03: { quando: "giorno", ogni: 150, stagione: [FIN("10-01", "10-31"), FIN("04-01", "04-30")] },
      M04: { quando: "meteo", meteoTrigger: "pioggia", ogni: 0 }, M05: { quando: "meteo", meteoTrigger: "umidita", ogni: 0 }, M06: { quando: "giorno", ogni: 365, stagione: [FIN("09-01", "09-30")] },
      // le due finestre di reset dell'anno: lavori a camera libera su tutte le camere, mezza giornata, uno per signora al giorno, senza il limite settimanale delle fondo complete
      M07: { quando: "libera", ogni: 365, stagione: [FIN("05-15", "06-05")], grande: true, reset: true, dove: "stanza" }, M08: { quando: "libera", ogni: 365, stagione: [FIN("09-01", "09-20")], grande: true, reset: true, dove: "stanza" } }[r.id];
    if (!m) { scartate.push(`${r.id}: regola meteo/stagione non prevista dal generatore`); continue; }
    parti.push(mk({ id: r.id, nome: r.superficie, tipo: "rotazione", minuti: r.minuti, ...m })); continue;
  }
  let ritmi = ritmiDa(r);
  if (r.id === "C57") { parti.push(mk({ id: "C57", nome: r.superficie, tipo: "rotazione", quando: "libera", ogni: 180, minuti: r.minuti, evento: true, grande: true, ogniEvento: 180 })); continue; }
  const lista = ritmi.filter(x => x.ogni === 0 && !TRIGGER.test(x.testo)), trig = ritmi.filter(x => x.ogni === 0 && TRIGGER.test(x.testo));
  let rot = ritmi.filter(x => x.ogni > 0);
  // righe con un ritmo che cambia con la stagione (C03 estate/mezze stagioni, C10 inverno): una parte sola, la stagione la mette SPECIALI
  if ((r.id === "C03" || r.id === "C10") && rot.length > 1) rot = [{ ...rot[0], parte: "" }];
  if (blocco === "normale") rot = [];                       // la checklist copre tutto, i ritmi dentro sono già nelle righe grandi
  if (blocco === "totale") rot = rot.filter(x => x.ogni > 7); // nella totale di ogni settimana ci sta tutto quello che è settimanale
  if (blocco === "zona" || blocco === "libera" || blocco === "rotazione") { /* tutte le parti a ritmo */ }
  const haLista = blocco === "normale" || blocco === "totale" || (blocco === "normale+rotazione" && (lista.length > 0 || /a ogni pulizia/.test(norm(r.ogniTesto + " " + r.regola)))) || (lista.length > 0 && blocco !== "zona");
  const nRot = rot.length;
  const quandoRot = blocco === "libera" ? "libera" : blocco === "zona" ? "giornata" : blocco === "totale" ? "cambio" : (quandoRiga === "cambio" ? "cambio" : quandoRiga === "libera" ? "libera" : quandoRiga === "giornata" ? "giornata" : "ripasso");
  if (haLista && blocco !== "zona") {
    const quandoLista = blocco === "totale" || quandoRiga === "cambio" || (blocco === "rotazione" && lista.length && /partenza|cambio/.test(lista[0].testo)) ? "cambio" : "ripasso";
    parti.push(mk({ id: nRot ? `${r.id}_0` : r.id, nome: r.superficie, parte: lista.map(x => x.parte).filter(Boolean).join(", ") || (blocco === "totale" ? "nella totale" : "a ogni pulizia"), tipo: "lista", quando: quandoLista, ogni: 0, minuti: 0, sempre: true }));
  }
  rot.forEach((x, i) => {
    const id = nRot === 1 ? r.id : `${r.id}_${i + 1}`;
    const p = mk({ id, nome: r.superficie + (x.parte ? " — " + x.parte : ""), parte: x.parte, tipo: "rotazione", quando: quandoRot, ogni: x.ogni, minuti: nRot > 1 ? Math.max(2, Math.round(r.minuti / nRot)) : r.minuti, sempre: blocco === "zona" && x.ogni <= 1 });
    if (/tecnici fissi/.test(x.testo) || (r.id === "C30" && x.ogni === 18) || (r.id === "P08" && x.ogni === 7)) p.soloFissi = true;
    if (SPECIALI[r.id]) SPECIALI[r.id](p);
    if (trig.length) p.scatti = trig.map(t => t.testo);
    parti.push(p);
  });
  if (blocco === "zona" && !rot.length && (lista.length || !ritmi.length)) parti.push(mk({ id: r.id, nome: r.superficie, parte: lista.map(x => x.parte).filter(Boolean).join(", "), tipo: "rotazione", quando: "giornata", ogni: 1, minuti: r.minuti, sempre: true }));
  if (!haLista && !rot.length && blocco !== "zona") scartate.push(`${r.id}: nessun ritmo capito ("${r.ogniTesto}" / "${r.regola}")`);
}

// ---------------------------------------------------------------- XLSX → checklist, calendario, livelli (via python)
const py = spawnSync("python3", ["-c", `
import json, openpyxl
wb = openpyxl.load_workbook(${JSON.stringify(XLSX)}, data_only=True)
out = {}
for name in ["Checklist signora", "Calendario vero", "Livelli e costi"]:
    ws = wb[name]; righe = []
    for row in ws.iter_rows(values_only=True):
        if any(v not in (None, "") for v in row): righe.append(["" if v is None else str(v) for v in row])
    out[name] = righe
print(json.dumps(out, ensure_ascii=False))
`], { encoding: "utf8" });
if (py.status !== 0) throw new Error("xlsx: " + py.stderr);
const fogli = JSON.parse(py.stdout);

// I blocchi della schermata della signora (colonna "Blocco (schermata)" del foglio): un titolo grande e un solo tasto Fatto per blocco
const BLOCCHI_LISTA = [
  { id: "letto", nome: "Letto e biancheria", breve: "Letto" }, { id: "bagno", nome: "Bagno", breve: "Bagno" }, { id: "camera", nome: "Camera", breve: "Camera" },
  { id: "cucina", nome: "Cucina", breve: "Cucina" }, { id: "sopra", nome: "Piano di sopra: camere e bagno", breve: "Piano di sopra", piani: 2 }, { id: "partenza", nome: "Alla partenza", breve: "Alla partenza" }, { id: "pavimenti", nome: "Pavimenti e controllo finale", breve: "Pavimenti" },
];
function bloccoDa(testo) { const n = norm(testo); if (!n) return ""; if (/piano di sopra|sopra/.test(n)) return "sopra"; if (/letto/.test(n)) return "letto"; if (/bagno/.test(n)) return "bagno"; if (/cucina/.test(n)) return "cucina"; if (/partenza/.test(n)) return "partenza"; if (/paviment|controllo/.test(n)) return "pavimenti"; if (/camera/.test(n)) return "camera"; console.error("blocco non riconosciuto:", testo); return ""; }
const LISTE = { "ripasso camera": "ripasso", "totale camera ripasso": "totale", "appartamento aggiunte cucina": "cucina", "base ripasso via zara 1 e 2 operai": "base_ripasso", "base totale giovedi": "base_totale" };
const checklist = [];
for (const row of fogli["Checklist signora"].slice(1)) {
  const [lista, n, testo, codici, minuti, bloccoTesto] = row; const k = LISTE[norm(lista)];
  if (!k) { console.error("lista non riconosciuta:", lista); continue; }
  const voce = { lista: k, n: Number(n), testo: String(testo).trim(), codici: String(codici).split(/[,;]/).map(x => x.trim()).filter(Boolean), minuti: Number(minuti) || 0, blocco: bloccoDa(bloccoTesto) };
  if (/^alla partenza/i.test(voce.testo)) voce.soloPartenza = true;
  if (/^al cambio totale/i.test(voce.testo)) voce.soloTotale = true;
  if (/a rotazione \(una per volta\)/i.test(voce.testo)) voce.slot = true;
  checklist.push(voce);
}
const NOMI = { "via trento 47": "trento", "via zara 1 e 2 piano": "zara1", "via zara 1 piano": "zara1", "via zara 2 piano": "zara1", "via zara piano terra": "zarapt", salvatore: "salvatore", aurora: "aurora", michele: "michele", antonio: "antonio", lella: "lella", alba: "alba", tramonto: "tramonto", passerella: "passerella", fenicotteri: "fenicotteri", nicole: "nicole" };
const GIORNI = { lunedi: 1, martedi: 2, mercoledi: 3, giovedi: 4, venerdi: 5, sabato: 6, domenica: 0 };
const calendario = [];
for (const row of fogli["Calendario vero"].slice(1)) {
  const [giorno, posto, tipo, signora, rif, note] = row;
  const g = GIORNI[norm(giorno)]; if (g == null) continue;
  // "· piano di sotto" / "· piano di sopra": la parte dell'appartamento su due piani (via Zara 1° e 2°) che fa quella signora
  const parte = /piano di sopra/i.test(String(posto)) ? "sopra" : /piano di sotto/i.test(String(posto)) ? "sotto" : "";
  const nomi = String(posto).replace(/·\s*piano di (sotto|sopra)/gi, "").split(/,|\boppure\b/).map(x => norm(x)).filter(Boolean);
  const posti = [...new Set(nomi.map(n => NOMI[n]).filter(Boolean))];
  const t = norm(tipo); const tipoP = /cambio totale|totale/.test(t) ? "totale" : /ripasso/.test(t) ? "ripasso" : "";
  const base = /base/.test(t); const ns = norm(signora); const zona = /^signora 1 piano/.test(ns) ? "p1" : /^signora 2 piano/.test(ns) ? "p2" : /appartamenti/.test(ns) ? "ap" : null;
  const insieme = /insieme/.test(ns) ? (/insieme alla signora del 2 piano/.test(ns) ? "p2" : /insieme alla signora del 1 piano/.test(ns) ? "p1" : "si") : "";
  const budget = Number((String(rif).match(/\d+/) || [0])[0]); const libera = /camera vuota|camera libera/i.test(String(rif));
  const controlla = /\[(CONTROLLA|DECIDI|COMPLETA)/i.test(String(signora) + String(note) + String(posto)) ? (String(note) + " " + String(signora)).match(/\[[^\]]*\]/g)?.join(" ") || "da controllare" : "";
  calendario.push({ giorno: g, posto: String(posto), posti, tipo: tipoP, base, zona, budget, libera, parte, oppure: /oppure/i.test(String(posto)), controlla, insieme, note: String(note || "").replace(/\[[^\]]*\]/g, "").trim() });
}
const livelli = fogli["Livelli e costi"].slice(1).map(([livello, cosa, min, eurSett, eurMese, ciSta]) => ({ livello, cosa, minuti: min, euroSettimana: eurSett, euroMese: eurMese, ciSta }));

// ---------------------------------------------------------------- scrittura
const testa = `// ============================================================================
//  CATALOGO DELLA GOVERNANTE · GENERATO, NON MODIFICARE A MANO
//  Fonte: catalogo/catalogo-governante-v4.csv e catalogo/catalogo-governante.xlsx (fogli Checklist signora, Calendario vero,
//  Livelli e costi). Per rigenerarlo: node strumenti/genera-catalogo.mjs. Generato il ${new Date().toISOString().slice(0, 10)}.
//  RIGHE = le righe del CSV così come sono · PARTI = le regole come le usa l'app (una riga a più ritmi diventa più parti:
//  la parte "a ogni pulizia" è una voce della lista, le parti a ritmo sono rifiniture) · CHECKLIST = le righe grandi della signora
// ============================================================================
`;
const js = v => JSON.stringify(v, null, 0);
writeFileSync(OUT, testa + `export const RIGHE = ${JSON.stringify(righe)};\nexport const PARTI = ${JSON.stringify(parti)};\nexport const CHECKLIST = ${JSON.stringify(checklist)};\nexport const CALENDARIO_VERO = ${JSON.stringify(calendario)};\nexport const LIVELLI_TESTO = ${JSON.stringify(livelli)};\nexport const BLOCCHI_LISTA = ${JSON.stringify(BLOCCHI_LISTA)};\n`);

// ---------------------------------------------------------------- rapporto
const perTipo = parti.reduce((m, p) => (m[p.tipo + "/" + p.quando] = (m[p.tipo + "/" + p.quando] || 0) + 1, m), {});
console.log(`righe: ${righe.length} → parti: ${parti.length}`, perTipo);
console.log("scartate:", scartate);
const codiciLista = new Set(checklist.flatMap(c => c.codici));
const coperteSoloDaLista = righe.filter(r => ["normale", "totale", "normale+rotazione"].includes(leggiBlocco(r.bloccoTesto)) && !codiciLista.has(r.id)).map(r => r.id);
console.log("righe 'Pulizia normale / Dentro la totale / +rotazione' che nessuna riga grande della checklist nomina:", coperteSoloDaLista.join(" "));
console.log("checklist:", Object.entries(checklist.reduce((m, c) => (m[c.lista] = (m[c.lista] || 0) + 1, m), {})));
console.log("calendario:", calendario.map(c => `${c.giorno}:${c.posti.join("+") || "?"} ${c.tipo}${c.base ? "(base)" : ""} ${c.zona || "?"} +${c.budget}${c.libera ? " libera" : ""}${c.controlla ? " [" + c.controlla + "]" : ""}`).join("\n  "));
console.log("rotazione+libera parti:", parti.filter(p => p.tipo === "rotazione" && (p.quando !== "giornata")).length, "| con stagione:", parti.filter(p => p.stagione).length, "| soloFissi:", parti.filter(p => p.soloFissi).map(p => p.id).join(" "));
console.log("esempi:", ["C18", "C35", "K08", "B08", "B24", "C30", "Z03", "L22", "C53"].map(id => parti.filter(p => p.codice === id).map(p => `${p.id}[${p.tipo}/${p.quando}/${p.ogni}′${p.minuti}m${p.parte ? " " + p.parte : ""}]`).join(" ")).join("\n  "));
