// Funzioni per leggere il catalogo di Michele (CSV con ;) e capire ritmi, quando, blocco e posto scritti a parole.
export function leggiCsv(t, sep = ";") {
  const righe = []; let riga = [], campo = "", inV = false;
  t = t.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inV) { if (ch === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else inV = false; } else campo += ch; continue; }
    if (ch === '"') { inV = true; continue; }
    if (ch === sep) { riga.push(campo); campo = ""; continue; }
    if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; riga.push(campo); righe.push(riga); riga = []; campo = ""; continue; }
    campo += ch;
  }
  if (campo.length || riga.length) { riga.push(campo); righe.push(riga); }
  return righe.filter(r => r.some(c => String(c).trim()));
}
export function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }

// "ogni 2 settimane" → [{ogni:14}]; "ditate a ogni pulizia, lavato ogni 2 settimane" → due parti con l'etichetta
export function leggiRitmo(testo) {
  const t = String(testo || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/'/g, " ").replace(/\s+/g, " ").trim(); if (!t) return [];
  const senzaParentesi = t.replace(/\([^)]*\)/g, " ");
  // prima le virgole; poi, dentro un pezzo con due ritmi uniti da "e" ("a ogni pulizia e ogni 2 settimane"), si taglia prima del secondo ritmo
  const RITMO = /(a ogni (pulizia|partenza|cambio|passaggio|arrivo|uso|piegatura|ripasso)|ogni (giorno|settimana|mese|anno|\d+ (giorni|settimane|mesi|anni))|una volta (l anno|al mese|a settimana)|2 volte (a settimana|al mese)|due volte (a settimana|al mese)|settimanale|mensile|quindicinale|giornaliero|tutti i giorni)/g;
  const pezzi = [];
  for (const grezzo of senzaParentesi.split(/[,;]/)) {
    const pz = grezzo.replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); if (!pz) continue;
    const pos = [...pz.matchAll(RITMO)].map(m => m.index);
    if (pos.length < 2) { pezzi.push(pz); continue; }
    let inizio = 0;
    for (let i = 1; i < pos.length; i++) { const taglio = pz.lastIndexOf(" e ", pos[i]); const q = taglio > inizio ? taglio : pos[i]; pezzi.push(pz.slice(inizio, q).trim()); inizio = taglio > inizio ? taglio + 3 : pos[i]; }
    pezzi.push(pz.slice(inizio).trim());
  }
  const out = [];
  for (const pz of pezzi) {
    const g = giorniDa(pz); if (g == null) continue;
    const parte = pz.replace(/\b(a ogni (pulizia|partenza|cambio( completo)?|passaggio|arrivo|uso|piegatura|ripasso)|ogni (giorno( d uso)?|settimana|mese|anno|\d+ (giorni|settimane|mesi|anni))|una volta (l anno|al mese|a settimana)|2 volte (a settimana|al mese)|due volte (a settimana|al mese)|settimanale|mensile|quindicinale|giornaliero|sempre|tutti i giorni)\b.*$/, "").replace(/\b(in (estate|inverno|stagione|uso)|nelle mezze stagioni|altrimenti|subito se.*|con i tecnici fissi.*|poi)\b.*$/, "").trim();
    out.push({ ogni: g, parte, testo: pz });
  }
  if (!out.length) { const g = giorniDa(senzaParentesi.replace(/[^a-z0-9 ]+/g, " ")); if (g != null) out.push({ ogni: g, parte: "", testo: t }); }
  return out;
}
export function giorniDa(t) {
  if (/a ogni piegatura|ogni giorno d uso/.test(t)) return 1;
  if (/a ogni (pulizia|partenza|cambio|passaggio|arrivo|uso|ripasso)|^sempre|a ogni cambio/.test(t)) return 0;
  if (/ogni giorno|tutti i giorni|giornalier/.test(t)) return 1;
  if (/2 volte a settimana|due volte a settimana/.test(t)) return 3.5;
  if (/ogni settimana|settimanale|una volta a settimana|1 volta a settimana/.test(t)) return 7;
  if (/quindicinale|ogni 2 settimane|ogni due settimane|ogni 15 giorni|2 volte al mese|due volte al mese/.test(t)) return 14;
  if (/ogni 2 3 settimane/.test(t)) return 18;
  if (/ogni 3 settimane|ogni tre settimane/.test(t)) return 21;
  if (/ogni mese|mensile|una volta al mese|1 volta al mese/.test(t)) return 30;
  if (/ogni 4 6 settimane/.test(t)) return 35;
  if (/ogni 6 settimane/.test(t)) return 45;
  if (/ogni 2 mesi|ogni due mesi/.test(t)) return 60;
  if (/ogni 2 3 mesi/.test(t)) return 75;
  if (/ogni 3 mesi|ogni tre mesi|trimestrale|ogni stagione/.test(t)) return 90;
  if (/ogni 4 mesi/.test(t)) return 120;
  if (/ogni 6 mesi|ogni sei mesi|semestrale|2 volte l anno|due volte l anno|a fine stagione/.test(t)) return 180;
  if (/una volta l anno|ogni anno|annuale|1 volta l anno/.test(t)) return 365;
  const m = t.match(/ogni (\d+) (giorni|settimane|mesi|anni)/); if (m) return Number(m[1]) * ({ giorni: 1, settimane: 7, mesi: 30, anni: 365 })[m[2]];
  return null;
}
export function leggiQuando(t) {
  const n = norm(t);
  if (/camera libera|libera|vuota/.test(n)) return "libera";
  if (/cambio|partenza/.test(n)) return "cambio";
  if (/giorno della zona|zona/.test(n)) return "giornata";
  if (/meteo|stagion/.test(n)) return "giorno";
  if (/ripasso|qualunque|ogni pulizia|normale/.test(n)) return "ripasso";
  if (/giorno|a se|a parte/.test(n)) return "giorno";
  return "";
}
export function leggiBlocco(t) {
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
