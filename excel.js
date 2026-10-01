// ============================================================================
//  EXCEL  ·  legge il foglio di papà con REGOLE FISSE (niente intelligenza artificiale)
//
//  Com'è fatto il foglio: un foglio per mese (nome = mese), righe = giorni
//  (riga 3 = giorno 1), colonne = camere (riga 1 = zona, riga 2 = nome camera).
//  Il colore della cella dice se la camera è occupata quella notte; il nome
//  dell'ospite è scritto nel primo giorno; il giorno di partenza NON è colorato.
//
//  Quando una cosa non è chiara, la riga finisce in "Da controllare (?)" e la
//  decide un proprietario: l'app non inventa niente.
// ============================================================================
import { CAMERE, APPOGGIO_ESTERNO, DIZIONARIO_EXCEL, COLONNE_EXCEL } from "./regole.js";
import * as L from "./logica.js";

const MESI_NOMI = { gennaio: 1, gen: 1, febbraio: 2, feb: 2, marzo: 3, mar: 3, aprile: 4, apr: 4, maggio: 5, mag: 5, giugno: 6, giu: 6, luglio: 7, lug: 7, agosto: 8, ago: 8, settembre: 9, set: 9, sett: 9, ottobre: 10, ott: 10, novembre: 11, nov: 11, dicembre: 12, dic: 12 };
const GIORNI_NOMI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

export function normalizza(s) {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’`´]/g, "'").replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}
function giorniNelMese(anno, mese) { return new Date(Date.UTC(anno, mese, 0)).getUTCDate(); }
function iso(anno, mese, giorno) { return `${anno}-${String(mese).padStart(2, "0")}-${String(giorno).padStart(2, "0")}`; }
function titolo(s) { return s.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1)); }

// ---------------------------------------------------------------------------
//  1) Da SheetJS a una griglia semplice: celle[r][c] = { t: testo, k: colore, f: formula }
// ---------------------------------------------------------------------------
export function daSheetJS(XLSX, wb) {
  const fogli = [];
  for (const nome of wb.SheetNames) {
    const ws = wb.Sheets[nome];
    if (!ws || !ws["!ref"]) continue;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const celle = [];
    for (let r = 0; r <= range.e.r; r++) {
      const riga = [];
      for (let c = 0; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        riga.push(cell ? { t: testoCella(cell), k: coloreCella(cell), f: cell.f || "" } : { t: "", k: null, f: "" });
      }
      celle.push(riga);
    }
    const merges = (ws["!merges"] || []).map(m => ({ r0: m.s.r, c0: m.s.c, r1: m.e.r, c1: m.e.c }));
    fogli.push({ nome, celle, merges, maxR: range.e.r, maxC: range.e.c });
  }
  return fogli;
}
function testoCella(cell) {
  if (cell.v == null) return "";
  if (typeof cell.v === "number" && !cell.f) return String(cell.v);
  if (cell.f && typeof cell.v === "string") return cell.v; // valore calcolato (es. "1 - martedì")
  return String(cell.v).replace(/\s*\n\s*/g, " / ").replace(/\s+/g, " ").trim();
}
// Chiave del colore di sfondo. null = nessun colore (o bianco) = camera libera.
export function coloreCella(cell) {
  const s = cell.s;
  if (!s || (s.patternType && s.patternType !== "solid")) return null;
  const fg = s.fgColor;
  if (!fg) return null;
  if (fg.rgb) {
    const rgb = String(fg.rgb).toUpperCase().slice(-6);
    if (rgb === "FFFFFF" || rgb === "000000" && fg.theme == null && !fg.tint) return rgb === "FFFFFF" ? null : "rgb:000000";
    if (fg.theme == null) return "rgb:" + rgb;
  }
  if (fg.theme != null) {
    const tint = Number(fg.tint || 0);
    if ((fg.theme === 0 || fg.theme === 1) && Math.abs(tint) < 0.01) return fg.theme === 0 ? null : "theme:1";
    return `theme:${fg.theme}:${tint.toFixed(2)}`;
  }
  if (fg.indexed != null) return fg.indexed === 64 || fg.indexed === 9 ? null : "idx:" + fg.indexed;
  return null;
}

// ---------------------------------------------------------------------------
//  2) Capire mese e anno di un foglio
// ---------------------------------------------------------------------------
function meseAnnoDelFoglio(foglio, opz) {
  let mese = null, anno = null;
  const n = normalizza(foglio.nome).replace(/[^a-z]/g, "");
  for (const [k, v] of Object.entries(MESI_NOMI)) if (n === k || n.startsWith(k)) { mese = v; break; }
  const m2 = normalizza(foglio.nome).match(/(20\d\d)/); if (m2) anno = Number(m2[1]);
  // la colonna A ha una formula tipo DATE(2026,9,1): è la fonte più sicura
  for (let r = 0; r < Math.min(foglio.celle.length, 8); r++) {
    const f = foglio.celle[r][0]?.f || "";
    const m = f.match(/DATE\(\s*(\d{4})\s*,\s*(\d{1,2})\s*,\s*1\s*\)/i);
    if (m) { anno = Number(m[1]); mese = Number(m[2]); break; }
  }
  if (!anno) {
    // dal testo "1 - martedì": cerco l'anno (vicino a oggi) in cui il giorno 1 cade in quel giorno della settimana
    const t = normalizza(foglio.celle[2]?.[0]?.t || "");
    const wd = GIORNI_NOMI.findIndex(g => t.includes(normalizza(g)));
    const base = opz.anno || new Date().getFullYear();
    if (mese && wd >= 0) for (const a of [base, base + 1, base - 1]) if (new Date(Date.UTC(a, mese - 1, 1)).getUTCDay() === wd) { anno = a; break; }
    if (!anno) anno = base;
  }
  return { mese, anno };
}

// ---------------------------------------------------------------------------
//  3) Le colonne: quale camera è
// ---------------------------------------------------------------------------
function etichetteColonne(foglio) {
  const righe = [[], []];
  for (let r = 0; r < 2; r++) for (let c = 0; c <= foglio.maxC; c++) righe[r][c] = foglio.celle[r]?.[c]?.t || "";
  for (const m of foglio.merges) {
    if (m.r0 > 1) continue;
    const v = foglio.celle[m.r0]?.[m.c0]?.t || "";
    for (let r = m.r0; r <= Math.min(1, m.r1); r++) for (let c = m.c0; c <= m.c1; c++) if (!righe[r][c]) righe[r][c] = v;
  }
  return righe;
}
function cameraDaEtichetta(et2, et1) {
  const prova = [et2, et1].filter(Boolean).map(normalizza);
  for (const p of prova) {
    if (COLONNE_EXCEL[p]) return { camera: COLONNE_EXCEL[p] };
    const noSp = p.replace(/\s/g, "");
    for (const [k, v] of Object.entries(COLONNE_EXCEL)) if (k.replace(/\s/g, "") === noSp) return { camera: v };
    const c = CAMERE.find(c => normalizza(c.nome) === p || normalizza(c.id) === p);
    if (c) return { camera: c.id };
  }
  for (const p of prova) {
    const e = APPOGGIO_ESTERNO.find(e => normalizza(e.nome) === p || p.startsWith(normalizza(e.nome)));
    if (e) return { esterno: e.id, etichetta: et1 || et2 };
  }
  return null;
}

// ---------------------------------------------------------------------------
//  4) Capire cosa c'è scritto in una cella
// ---------------------------------------------------------------------------
export function analizzaTesto(t) {
  const D = DIZIONARIO_EXCEL;
  const low = normalizza(t);
  const out = { originale: t, nome: "", tipo: null, persone: null, qualifica: "", negazione: false, privato: false, istruzione: "", resto: "" };
  out.negazione = (D.negazioni || []).some(p => low.includes(normalizza(p)));
  out.commento = (D.paroleCommento || []).some(p => new RegExp("(^|[^a-z])" + normalizza(p) + "([^a-z]|$)").test(low));
  out.privato = /\d{7,}/.test(low.replace(/\s/g, "")) || (D.parolePrivate || []).some(p => new RegExp("(^|[^a-z])" + normalizza(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z]|$)").test(low)) || /€/.test(t);
  const mp = low.match(/(\d+)\s*(operai|operaio|tecnici|tecnico|persone|persona|pers|ragazzi|signori|uomini)\b/);
  if (mp) { out.persone = Number(mp[1]); out.qualifica = mp[2].startsWith("tecnic") ? (out.persone === 1 ? "tecnico" : "tecnici") : mp[2].startsWith("opera") ? (out.persone === 1 ? "operaio" : "operai") : (out.persone === 1 ? "persona" : "persone"); }
  // istruzioni per le signore
  for (const p of (D.paroleIstruzioni || [])) {
    const i = low.indexOf(normalizza(p));
    if (i >= 0) { out.istruzione = t.slice(indiceOriginale(t, i)).trim(); break; }
  }
  // tipo di ospite dal dizionario
  for (const regola of (D.tipi || [])) {
    if (regola.contiene.some(p => low.includes(normalizza(p)))) { out.tipo = regola.tipo; out.nome = regola.nome || titolo(regola.contiene[0]); break; }
  }
  if (!out.nome) {
    // il nome è l'inizio del testo, fino a una parola che non fa parte del nome
    let s = low;
    if (mp) s = s.replace(mp[0], " ").trim();
    s = s.replace(/^nuovo lavoro\s+/, "").replace(/\s+nuovo lavoro.*$/, "").trim();
    for (const stop of (D.paroleStop || [])) { const i = s.indexOf(" " + normalizza(stop)); if (i > 0) { out.resto = s.slice(i + 1).trim(); s = s.slice(0, i).trim(); } }
    s = s.replace(/\d{7,}/g, "").replace(/\s+/g, " ").trim();
    if (out.istruzione) { const ii = s.indexOf(normalizza(out.istruzione).split(" ")[0]); if (ii > 0) s = s.slice(0, ii).trim(); else if (ii === 0) s = ""; }
    if ((D.nonNomi || []).includes(s)) s = "";
    out.nome = titolo(s);
    if (out.nome.length > 28) { out.resto = out.resto ? out.resto : out.nome; out.nome = titolo(s.split(" ").slice(0, 2).join(" ")); }
  } else if (mp && out.tipo) {
    // es. "2 operai nuovo lavoro d'agostino": nome = D'Agostino, persone = 2
  }
  if (!out.tipo) out.tipo = out.negazione ? "unk" : "ferr";
  return out;
}
function indiceOriginale(originale, indiceNormalizzato) {
  // la normalizzazione può cambiare la lunghezza: cerco la parola nel testo originale
  const parola = normalizza(originale).slice(indiceNormalizzato).split(" ")[0];
  const i = originale.toLowerCase().indexOf(parola);
  return i >= 0 ? i : 0;
}
function stessoOspite(a, nome, tipo) {
  if (a.tipo !== "ferr" && a.tipo !== "altro") return a.tipo === tipo;
  return normalizza(a.nome) === normalizza(nome) && a.nome !== "";
}

// ---------------------------------------------------------------------------
//  5) La lettura vera e propria
// ---------------------------------------------------------------------------
export function leggiProspetto(fogli, opz = {}) {
  const ris = { mesi: [], soggiorni: [], note: [], esterni: [], avvisi: [], colonneIgnorate: [] };
  const perCamera = {};
  for (const foglio of fogli) {
    const { mese, anno } = meseAnnoDelFoglio(foglio, opz);
    if (!mese) { ris.avvisi.push(`Il foglio "${foglio.nome}" non ha il nome di un mese: l'ho saltato.`); continue; }
    const nGiorni = giorniNelMese(anno, mese);
    // riga del giorno 1: cerco "1 - ..." nella colonna A, altrimenti riga 3
    let riga1 = 2;
    for (let r = 0; r < Math.min(foglio.celle.length, 10); r++) { const t = foglio.celle[r][0]?.t || ""; if (/^\s*1\s*-/.test(t)) { riga1 = r; break; } }
    ris.mesi.push({ foglio: foglio.nome, anno, mese, nome: `${L.MESI[mese - 1]} ${anno}`, giorni: nGiorni, da: iso(anno, mese, 1), a: iso(anno, mese, nGiorni) });
    const etic = etichetteColonne(foglio);
    for (let c = 1; c <= foglio.maxC; c++) {
      const et2 = etic[1][c], et1 = etic[0][c];
      const dove = cameraDaEtichetta(et2, et1);
      if (!dove) { if (et1 || et2) ris.colonneIgnorate.push(`${foglio.nome}: colonna "${et2 || et1}"`); continue; }
      // strisce colorate
      const strisce = []; let cur = null;
      for (let d = 1; d <= nGiorni; d++) {
        const cell = foglio.celle[riga1 + d - 1]?.[c] || { t: "", k: null };
        const k = cell.k;
        if (k && cur && cur.k === k) { cur.d1 = d; if (cell.t) cur.celle.push({ d, t: cell.t }); }
        else {
          if (cur) strisce.push(cur);
          cur = k ? { k, d0: d, d1: d, celle: cell.t ? [{ d, t: cell.t }] : [] } : null;
          if (!k && cell.t) ris.note.push(notaDa(dove, iso(anno, mese, d), cell.t, foglio.nome));
        }
      }
      if (cur) strisce.push(cur);
      if (dove.esterno) {
        ris.esterni.push({ esterno: dove.esterno, etichetta: dove.etichetta, foglio: foglio.nome, strisce: strisce.map(s => ({ inizio: iso(anno, mese, s.d0), fine: L.aggiungiGiorni(iso(anno, mese, s.d0), s.d1 - s.d0 + 1), testo: [...new Set(s.celle.map(x => x.t))].join(" · ") })) });
        continue;
      }
      const cam = dove.camera;
      perCamera[cam] = perCamera[cam] || [];
      for (const s of strisce) {
        const prev = perCamera[cam][perCamera[cam].length - 1] || null;
        const sog = interpretaStriscia(s, cam, prev, anno, mese, nGiorni, foglio.nome);
        perCamera[cam].push(sog);
        for (const n of sog.noteGiorno) ris.note.push(notaDa(dove, n.data, n.testo, foglio.nome, n.privata));
        delete sog.noteGiorno;
      }
    }
  }
  // unisco le strisce che continuano da un mese all'altro
  const mesiLetti = new Set(ris.mesi.map(m => m.da.slice(0, 7)));
  const compatibili = (a, b) => normalizza(a.nome) === normalizza(b.nome) && (a.tipo === b.tipo || (["ferr", "altro"].includes(a.tipo) && ["ferr", "altro"].includes(b.tipo)));
  for (const [cam, lista] of Object.entries(perCamera)) {
    lista.sort((a, b) => a.inizio < b.inizio ? -1 : 1);
    const out = [];
    for (const s of lista) {
      const prev = out[out.length - 1];
      if (prev && prev.fine === s.inizio && s.inizio.endsWith("-01") && (s.senzaNome || compatibili(prev, s))) {
        prev.fine = s.fine; prev.persone = s.persone || prev.persone; prev.aperto = s.aperto;
        if (!s.senzaNome && s.dubbio && !prev.dubbio) { prev.dubbio = true; prev.motivi = (prev.motivi || []).concat(s.motivi); }
        if (s.nota && !prev.nota) prev.nota = s.nota;
        prev.fogli = [...new Set([...(prev.fogli || []), ...(s.fogli || [])])];
        continue;
      }
      out.push(s);
    }
    for (const s of out) {
      delete s.senzaNome;
      if (s.aperto && !mesiLetti.has(s.fine.slice(0, 7))) s.motivi = (s.motivi || []).concat(["arriva alla fine del foglio: controlla il mese dopo"]);
      delete s.aperto;
      if (L.giorniTra(s.inizio, s.fine) > 10 && s.tipo === "ferr") s.tipo = "altro";
      ris.soggiorni.push(s);
    }
  }
  ris.soggiorni.sort((a, b) => (a.inizio + a.camera) < (b.inizio + b.camera) ? -1 : 1);
  return ris;
}

function notaDa(dove, data, testo, foglio, privata) {
  const a = analizzaTesto(testo);
  return { camera: dove.camera || null, esterno: dove.esterno || null, data, testo, privata: privata != null ? privata : (a.privato || !a.istruzione), foglio };
}

function interpretaStriscia(s, cam, prev, anno, mese, nGiorni, nomeFoglio) {
  const inizio = iso(anno, mese, s.d0);
  const fine = s.d1 >= nGiorni ? L.aggiungiGiorni(iso(anno, mese, nGiorni), 1) : iso(anno, mese, s.d1 + 1);
  const sog = { camera: cam, inizio, fine, nome: "", tipo: "ferr", persone: null, nota: "", notaPrivata: "", dubbio: false, motivi: [], noteGiorno: [], testoOriginale: s.celle.map(x => `${x.d}: «${x.t}»`).join(" · "), colore: s.k, fogli: [nomeFoglio], aperto: s.d1 >= nGiorni, senzaNome: false };
  const testi = s.celle.filter(x => x.t);
  if (!testi.length) {
    sog.senzaNome = true;
    if (prev && L.giorniTra(prev.fine, inizio) <= 3 && prev.nome && prev.nome !== "?") {
      sog.nome = prev.nome; sog.tipo = prev.tipo; sog.persone = prev.persone; sog.dubbio = true;
      sog.motivi.push(`senza nome nel foglio: ho messo «${prev.nome}» come la volta prima`);
    } else { sog.nome = "?"; sog.tipo = "unk"; sog.dubbio = true; sog.motivi.push("senza nome nel foglio"); }
    return sog;
  }
  // Prima casella con testo. Se è solo una nota (istruzione, commento, telefono), il nome sta nella casella dopo.
  let iNome = 0;
  const soloNota = a => (a.istruzione && normalizza(a.istruzione) === normalizza(a.originale)) || a.commento || a.privato || (!a.nome && !a.negazione);
  while (iNome < testi.length && iNome < 3 && soloNota(analizzaTesto(testi[iNome].t)) && !analizzaTesto(testi[iNome].t).negazione) iNome++;
  if (iNome >= testi.length || iNome >= 3) iNome = 0;
  for (let i = 0; i < iNome; i++) { const a = analizzaTesto(testi[i].t); sog.noteGiorno.push({ data: iso(anno, mese, testi[i].d), testo: testi[i].t, privata: a.privato || !a.istruzione }); }
  const primo = testi[iNome], an = analizzaTesto(primo.t);
  sog.nome = an.nome || "?"; sog.tipo = an.tipo; sog.persone = an.persone;
  if (an.negazione) { sog.dubbio = true; sog.tipo = "unk"; sog.motivi.push(`il foglio dice «${primo.t}»`); sog.nonCreare = true; }
  else if (an.privato) { sog.noteGiorno.push({ data: iso(anno, mese, primo.d), testo: primo.t, privata: true }); if (!an.nome) { sog.nome = "?"; sog.dubbio = true; sog.motivi.push("nella prima casella c'è solo una nota"); } }
  if (an.resto && !an.negazione) sog.notaPrivata = an.resto;
  if (an.istruzione && !an.negazione && normalizza(an.istruzione) !== normalizza(primo.t)) sog.nota = an.istruzione;
  if (!an.nome && !an.negazione && !an.privato) { sog.nome = "?"; sog.dubbio = true; sog.motivi.push(`non capisco il nome in «${primo.t}»`); }
  testi.splice(0, iNome + 1);
  for (const x of testi) {
    const a = analizzaTesto(x.t), data = iso(anno, mese, x.d);
    if (a.privato || a.commento) { sog.noteGiorno.push({ data, testo: x.t, privata: true }); continue; }
    if (stessoOspite(a, sog.nome, sog.tipo)) {
      if (a.persone && a.persone !== sog.persone) { sog.noteGiorno.push({ data, testo: `Da oggi ${a.persone} ${a.qualifica}${sog.persone ? ` (prima ${sog.persone})` : ""}`, privata: false }); sog.persone = a.persone; }
      if (a.istruzione) sog.noteGiorno.push({ data, testo: a.istruzione, privata: false });
      continue;
    }
    if (a.istruzione) { sog.noteGiorno.push({ data, testo: x.t, privata: false }); continue; }
    if (a.negazione) { sog.noteGiorno.push({ data, testo: x.t, privata: true }); sog.dubbio = true; sog.motivi.push(`il ${x.d} c'è scritto «${x.t}»`); continue; }
    sog.noteGiorno.push({ data, testo: x.t, privata: true });
    sog.dubbio = true; sog.motivi.push(`il ${x.d} c'è scritto «${x.t}»: è un altro ospite o una nota?`);
  }
  return sog;
}
