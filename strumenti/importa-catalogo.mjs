// Legge il catalogo di Michele (catalogo-governante.csv, separatore ;) e lo trasforma in righe pronte per il catalogo dell'app.
// Uso: node importa-catalogo.mjs <file.csv> [--json out.json] [--rapporto]
// Colonne attese (l'ordine non conta, i nomi sono tolleranti): ID; Posto; Superficie; Regola; Ogni quanto; Quando; Priorità; Minuti;
// Come si fa; Prodotto; Controllo; Note; Blocco; Profilo base
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2]; if (!file) { console.error("Manca il file"); process.exit(1); }
const testo = readFileSync(file, "utf8").replace(/^﻿/, "");
const righe = leggiCsv(testo, ";");
const intest = righe[0].map(norm);
const idx = (...nomi) => { for (const n of nomi) { const i = intest.indexOf(norm(n)); if (i >= 0) return i; } return -1; };
const col = {
  id: idx("ID"), posto: idx("Posto"), superficie: idx("Superficie"), regola: idx("Regola", "Nome"), ogni: idx("Ogni quanto", "Ogni", "Ritmo"), quando: idx("Quando"),
  priorita: idx("Priorità", "Priorita"), minuti: idx("Minuti"), come: idx("Come si fa", "Come"), prodotto: idx("Prodotto"), controllo: idx("Controllo"), note: idx("Note"),
  blocco: idx("Blocco"), profiloBase: idx("Profilo base", "Base"),
};
const mancanti = Object.entries(col).filter(([, i]) => i < 0).map(([k]) => k);
if (mancanti.length) console.error("Colonne non trovate:", mancanti.join(", "), "| intestazioni lette:", righe[0].join(" | "));

const out = [], problemi = [];
for (let r = 1; r < righe.length; r++) {
  const c = righe[r]; if (!c.length || !c.join("").trim()) continue;
  const v = k => (col[k] >= 0 ? (c[col[k]] || "").trim() : "");
  const id = v("id"); if (!id) { problemi.push(`riga ${r + 1}: senza ID`); continue; }
  const ritmi = leggiRitmo(v("ogni"));
  if (!ritmi.length) problemi.push(`${id}: ritmo non capito → "${v("ogni")}"`);
  const quando = leggiQuando(v("quando")); if (!quando) problemi.push(`${id}: quando non capito → "${v("quando")}"`);
  const priorita = Number((v("priorita").match(/\d/) || [2])[0]);
  const minuti = Number((v("minuti").match(/\d+/) || [0])[0]);
  const blocco = leggiBlocco(v("blocco")); if (v("blocco") && !blocco) problemi.push(`${id}: blocco non capito → "${v("blocco")}"`);
  const profiloBase = /^s[iì]|^x|^1|^true|^base/i.test(v("profiloBase"));
  const dove = leggiPosto(v("posto")); if (!dove) problemi.push(`${id}: posto non capito → "${v("posto")}"`);
  out.push({ id, codice: id, posto: v("posto"), dove, superficie: v("superficie"), nome: v("regola"), ogniTesto: v("ogni"), ritmi, quando, priorita, minuti, come: v("come"), prodotto: v("prodotto"), controllo: v("controllo"), note: v("note"), bloccoTesto: v("blocco"), blocco, profiloBase });
}
const perPosto = out.reduce((m, x) => (m[x.posto] = (m[x.posto] || 0) + 1, m), {});
const perBlocco = out.reduce((m, x) => (m[x.bloccoTesto || "—"] = (m[x.bloccoTesto || "—"] || 0) + 1, m), {});
console.log(`righe lette: ${out.length} · per posto:`, perPosto, "\nper blocco:", perBlocco, `\nprofilo base = sì: ${out.filter(x => x.profiloBase).length} · a più ritmi: ${out.filter(x => x.ritmi.length > 1).length}`);
if (problemi.length) { console.log(`\nDA GUARDARE (${problemi.length}):`); for (const p of problemi) console.log(" -", p); }
const j = process.argv.indexOf("--json"); if (j > 0) { writeFileSync(process.argv[j + 1], JSON.stringify(out, null, 1)); console.log("scritto", process.argv[j + 1]); }
if (process.argv.includes("--rapporto")) for (const x of out) console.log(`${x.id} · ${x.nome} · ${x.ritmi.map(r => `${r.parte ? r.parte + ": " : ""}${r.ogni === 0 ? "sempre" : "ogni " + r.ogni + "g"}`).join(" + ")} · ${x.quando} · P${x.priorita} · ${x.minuti}′ · ${x.bloccoTesto}${x.profiloBase ? " · BASE" : ""}`);

// ---- lettura ----
function leggiCsv(t, sep) {
  const righe = []; let riga = [], campo = "", inV = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inV) { if (ch === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else inV = false; } else campo += ch; continue; }
    if (ch === '"') { inV = true; continue; }
    if (ch === sep) { riga.push(campo); campo = ""; continue; }
    if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; riga.push(campo); righe.push(riga); riga = []; campo = ""; continue; }
    campo += ch;
  }
  if (campo.length || riga.length) { riga.push(campo); righe.push(riga); }
  return righe;
}
function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
// "ogni 2 settimane" → 14; "a ogni pulizia" → 0; "ditate a ogni pulizia, lavato ogni 2 settimane" → due ritmi con la parte
export function leggiRitmo(testo) {
  const t = String(testo || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/'/g, " ").replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim(); if (!t) return [];
  const pezzi = t.split(/[,;]|\be\b(?=\s+\w+\s+(a ogni|ogni|una volta))/).map(x => (x || "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  const out = [];
  for (const pz of pezzi) {
    const g = giorniDa(pz); if (g == null) continue;
    const parte = pz.replace(/\b(a ogni (pulizia|partenza|cambio|passaggio|arrivo)|ogni (giorno|settimana|mese|anno|\d+ (giorni|settimane|mesi|anni))|una volta (l anno|al mese|a settimana)|2 volte (a settimana|al mese)|settimanale|mensile|quindicinale|giornaliero|sempre|tutti i giorni).*$/, "").trim();
    out.push({ ogni: g, parte: parte || "" , testo: pz });
  }
  if (!out.length) { const g = giorniDa(t); if (g != null) out.push({ ogni: g, parte: "", testo: t }); }
  return out;
}
function giorniDa(t) {
  if (/a ogni (pulizia|partenza|cambio|passaggio|arrivo)|^sempre|tutti i giorni|ogni giorno|giornalier/.test(t)) return /ogni giorno|tutti i giorni|giornalier/.test(t) && !/pulizia/.test(t) ? 1 : 0;
  if (/2 volte a settimana|due volte a settimana/.test(t)) return 3.5;
  if (/ogni settimana|settimanale|una volta a settimana|1 volta a settimana/.test(t)) return 7;
  if (/quindicinale|ogni 2 settimane|ogni due settimane|ogni 15 giorni/.test(t)) return 14;
  if (/ogni 3 settimane|ogni tre settimane/.test(t)) return 21;
  if (/ogni mese|mensile|una volta al mese|1 volta al mese/.test(t)) return 30;
  if (/2 volte al mese|due volte al mese/.test(t)) return 14;
  if (/ogni 6 settimane/.test(t)) return 45;
  if (/ogni 2 mesi|ogni due mesi/.test(t)) return 60;
  if (/ogni 3 mesi|ogni tre mesi|trimestrale|ogni stagione/.test(t)) return 90;
  if (/ogni 4 mesi/.test(t)) return 120;
  if (/ogni 6 mesi|ogni sei mesi|semestrale|2 volte l anno|due volte l anno/.test(t)) return 180;
  if (/una volta l anno|ogni anno|annuale|1 volta l anno/.test(t)) return 365;
  const m = t.match(/ogni (\d+) (giorni|settimane|mesi|anni)/); if (m) return Number(m[1]) * ({ giorni: 1, settimane: 7, mesi: 30, anni: 365 })[m[2]];
  const n = t.match(/^(\d+)$/); if (n) return Number(n[1]);
  return null;
}
function leggiQuando(t) {
  const n = norm(t);
  if (/ripasso|qualunque|ogni pulizia|normale/.test(n)) return "ripasso";
  if (/cambio|totale|partenza/.test(n)) return "cambio";
  if (/libera|vuota/.test(n)) return "libera";
  if (/giornata|zona|giorno fisso/.test(n)) return "giornata";
  if (/giorno|a se|a parte/.test(n)) return "giorno";
  if (/meteo|stagion/.test(n)) return "giorno";
  return "";
}
function leggiBlocco(t) {
  const n = norm(t); if (!n) return "";
  if (/normale.*rotazione|rotazione.*normale/.test(n)) return "normale+rotazione";
  if (/pulizia normale|checklist/.test(n)) return "normale";
  if (/dentro la totale|totale/.test(n)) return "totale";
  if (/rotazione/.test(n)) return "rotazione";
  if (/camera libera|libera/.test(n)) return "libera";
  if (/giorno della zona|zona/.test(n)) return "zona";
  if (/meteo|stagion/.test(n)) return "meteo";
  return "";
}
function leggiPosto(t) {
  const n = norm(t);
  if (/^camera/.test(n)) return "stanza"; if (/^bagno/.test(n)) return "bagno"; if (/cucina/.test(n)) return "cucina"; if (/balcon/.test(n)) return "balcone";
  if (/corridoi/.test(n)) return ["corridoio_p1", "corridoio_p2"]; if (/scale/.test(n)) return "scale"; if (/ingresso|portone/.test(n)) return "ingresso"; if (/terrazz/.test(n)) return "terrazzo";
  if (/lavanderia|magazzino|ripostiglio|attrezz/.test(n)) return "lavanderia"; if (/zone comuni|comuni/.test(n)) return ["corridoio_p1", "corridoio_p2", "scale", "ingresso", "terrazzo"];
  if (/meteo|stagion|prospetto|ospiti|tutte|tutti/.test(n)) return "stanza";
  return "";
}
