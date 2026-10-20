// ============================================================================
//  BOCCA.JS  ·  Il labiale (0.66 → 0.69 strisce; 0.71 frasi ancorate alle pause; 0.72 alfabeto + corpo vivo; 0.73 MASCHERA DEFORMABILE; 0.74 RITMO VERO + filmato in cui parla davvero; 0.75 BOCCHE VERE dai fotogrammi)
//  Dal testo che lei dice alle forme della bocca, a tempo col suono vero.
//  Come funziona, in tre passi:
//   1. visemi(testo): ogni lettera diventa una "forma" (A E I O U, labbra chiuse
//      per M/B/P, denti per le altre consonanti, pausa per spazi e punteggiatura).
//   2. profilo(audio): si misura il suono ogni 20 millesimi e si segna dove si
//      parla davvero e dove c'è silenzio.
//   3. piano(): le forme si distribuiscono sul tempo PARLATO; nei silenzi la
//      bocca resta chiusa. Mentre l'audio suona, a ogni fotogramma si chiede
//      "che forma adesso?" e si disegna la toppa giusta sulla foto base.
//  Le toppe sono immagini della SUA bocca (lab-A.webp ecc.) appoggiate sulla
//  foto base (lab-base.webp) in un punto fisso: così il viso non si deforma.
// ============================================================================

import { Viso, Mimica } from "./viso.js";

export const FORME = ["X", "M", "A", "E", "I", "O", "U", "L", "F"];   // (vecchie lettere: restano per il disegnino SVG)
// 0.72: TUTTO L'ALFABETO. Per ogni VOCALE una striscia di fotogrammi veri dal labbro chiuso
// al massimo dell'apertura (video "A B C D E F G H I L" e "M P F V S T L R N Z" del 20/10);
// per le CONSONANTI una bocca sola: M = labbra premute (m b p), F = denti sul labbro (f v),
// T = denti, poco aperta (t d n l r s z), K = poco aperta neutra (c g q h dure), C = tonda
// piccola (ci gi sci gli gn). Ogni fotogramma e' stato ANCORATO ai punti fissi del viso
// (occhi, naso, zigomi: MediaPipe) e appoggiato sulla base: niente piu' bocca "sotto il naso".
export const STRISCE = { A: 8, E: 8, I: 6, O: 8, U: 6, M: 1, F: 1, T: 1, K: 1, C: 1 };
export const VOCALI = { A: 1, E: 1, I: 1, O: 1, U: 1 };
export const TOPPA = { w: 136, h: 118 };
export const ANCORA = { x: 186, y: 340 };      // dove si appoggia la toppa, sulla base 540x960 (base = fotogramma 92 a 24 fps del video "grazia")
export const FILE = {
  base: "lab-base.webp",
  strisce: Object.fromEntries(Object.keys(STRISCE).map(v => [v, `lab-${v}.webp`])),
  posa: "posa_parla.json",                      // 0.72: la posa della testa in ogni fotogramma del filmato "parla" (toppe)
  // 0.73: la maschera deformabile
  rig: "rig.json",                              // punti, triangoli, spostamenti di ogni forma della bocca, battito, sopracciglia
  clip: "clip_parla.json",                      // i punti del viso in ogni fotogramma del filmato "parla"
  cavita: "lab-cavita.webp",                    // l'interno della bocca (dalla A vera)
  denti: "lab-denti.webp",                      // i denti di sopra
  // 0.75: la libreria delle BOCCHE VERE (ritagli di ogni fotogramma del video in cui parla)
  bocche: "bocche.webp",
  boccheDati: "bocche.json",
};

// ---- 1. dal testo alle forme -------------------------------------------------
export function visemi(testo) {
  const t = String(testo || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const out = [];
  const metti = (f, p) => { const u = out[out.length - 1]; if (u && u.f === f) u.p += p; else out.push({ f, p }); };
  for (const ch of t) {
    if (ch === "a") metti("A", 2);
    else if (ch === "e") metti("E", 2);
    else if (ch === "i" || ch === "y") metti("I", 1.6);
    else if (ch === "o") metti("O", 2);
    else if (ch === "u" || ch === "w") metti("U", 2);
    else if ("mbp".includes(ch)) metti("M", 1.1);
    else if ("fv".includes(ch)) metti("F", 1);
    else if (ch >= "a" && ch <= "z") metti("L", 0.9);
    else if (".!?".includes(ch)) metti("X", 4);
    else if (",;:".includes(ch)) metti("X", 2.2);
    else if (/\s/.test(ch)) metti("X", 0.7);
  }
  return out;
}

// ---- 2. il profilo del suono -------------------------------------------------
export function profilo(audioBuffer) {
  const d = audioBuffer.getChannelData(0), sr = audioBuffer.sampleRate;
  const hop = Math.max(1, Math.round(sr * 0.02)), n = Math.max(1, Math.floor(d.length / hop));
  const e = new Float32Array(n); let max = 0;
  for (let i = 0; i < n; i++) {
    let s = 0; const a = i * hop, b = a + hop;
    for (let j = a; j < b; j++) s += d[j] * d[j];
    e[i] = Math.sqrt(s / hop); if (e[i] > max) max = e[i];
  }
  const soglia = max * 0.12;
  const parlato = new Uint8Array(n);
  for (let i = 0; i < n; i++) parlato[i] = e[i] > soglia ? 1 : 0;
  for (let i = 1; i < n - 1; i++) if (!parlato[i] && parlato[i - 1] && parlato[i + 1]) parlato[i] = 1; // buchi di 20 ms: chiusi
  const cum = new Float32Array(n); let c = 0;
  for (let i = 0; i < n; i++) { if (parlato[i]) c += 0.02; cum[i] = c; }
  return { hop: 0.02, e, max, parlato, cum, totale: c, durata: audioBuffer.duration };
}

// ---- 2b. quando l'audio non c'e' (voce del telefono): un profilo stimato -------
// Il telefono non ci da' il suono da leggere: si stima quanto dura la frase dalle
// lettere e si distribuiscono le forme nel tempo, con le pause sulla punteggiatura
// e un ritmo di sillabe finto. Meno preciso della voce vera, ma segue il testo.
export function stimaDurata(testo, rate = 1) {
  const t = String(testo || "");
  const lettere = (t.match(/[a-zà-ú]/gi) || []).length;
  const punti = (t.match(/[.!?]/g) || []).length, virgole = (t.match(/[,;:]/g) || []).length;
  return Math.max(0.6, (lettere * 0.072 + punti * 0.38 + virgole * 0.2 + 0.25) / (Number(rate) || 1));
}
export function profiloFinto(testo, durata) {
  const v = visemi(testo), pesoTot = v.reduce((s, x) => s + x.p, 0) || 1;
  const hop = 0.02, n = Math.max(1, Math.round((Number(durata) || stimaDurata(testo)) / hop));
  const e = new Float32Array(n), parlato = new Uint8Array(n), cum = new Float32Array(n);
  let acc = 0; const bordi = v.map(x => { acc += x.p; return { fine: acc / pesoTot, f: x.f }; });
  let k = 0, c = 0;
  for (let i = 0; i < n; i++) {
    const frac = (i + 0.5) / n;
    while (k < bordi.length - 1 && bordi[k].fine < frac) k++;
    const f = bordi.length ? bordi[k].f : "X", t = i * hop;
    parlato[i] = f === "X" ? 0 : 1;
    e[i] = parlato[i] ? 0.35 + 0.55 * Math.abs(Math.sin(t * 17)) : 0;
    if (parlato[i]) c += hop; cum[i] = c;
  }
  return { hop, e, max: 0.9, parlato, cum, totale: c, durata: n * hop, finto: true };
}

// ---- 2c. il profilo "vivo": cresce mentre l'audio arriva a pezzi (voce Live) ----
// Con il canale Live la voce parte prima che l'audio sia tutto arrivato. Il profilo
// si costruisce pezzo per pezzo; finche' non e' finito, il totale del parlato si
// STIMA da quanta parte del testo e' gia' stata letta (la trascrizione che arriva
// insieme all'audio). Quando il modello dice "finito", il totale diventa esatto.
export class ProfiloVivo {
  constructor(testo) {
    this.vivo = true; this.hop = 0.02; this.e = []; this.parlato = []; this.cum = [];
    this.max = 0; this._tot = 0; this.durata = 0; this.chiuso = false; this.frazione = 0;
    this.resto = new Float32Array(0);
    this.lettere = Math.max(1, (String(testo || "").match(/[a-zà-ú0-9]/gi) || []).length);
    // 0.71: quanto parlato ci si aspetta da questo testo, col ritmo imparato dalle frasi
    // precedenti (lettere per secondo di PARLATO, pause escluse). Serve nei primi istanti,
    // quando la trascrizione non e' ancora arrivata e la stima "a frazione" sballa.
    this.previsto = this.lettere / ProfiloVivo.ritmo;
  }
  _quadro(v) {
    if (v > this.max) this.max = v;
    const p = v > this.max * 0.12 ? 1 : 0;
    this.e.push(v); this.parlato.push(p); if (p) this._tot += this.hop; this.cum.push(this._tot); this.durata += this.hop;
  }
  aggiungi(f32, sr) {
    const hop = Math.max(1, Math.round(sr * this.hop));
    let d = f32;
    if (this.resto.length) { const m = new Float32Array(this.resto.length + f32.length); m.set(this.resto); m.set(f32, this.resto.length); d = m; }
    const n = Math.floor(d.length / hop);
    for (let i = 0; i < n; i++) { let s = 0; const a = i * hop; for (let j = a; j < a + hop; j++) s += d[j] * d[j]; this._quadro(Math.sqrt(s / hop)); }
    this.resto = d.slice(n * hop);
  }
  silenzio(sec) { const n = Math.round((Number(sec) || 0) / this.hop); for (let i = 0; i < n; i++) this._quadro(0); }
  trascrizione(t) { const l = (String(t || "").match(/[a-zà-ú0-9]/gi) || []).length; this.frazione = Math.min(1, l / this.lettere); }
  chiudi() {
    this.chiuso = true;
    // si impara il ritmo di questa voce per la prossima frase (media mobile, solo su frasi lunghe)
    if (this._tot > 2.5 && this.lettere > 30) { const r = this.lettere / this._tot; if (r > 8 && r < 30) ProfiloVivo.ritmo = 0.7 * ProfiloVivo.ritmo + 0.3 * r; }
  }
  get totale() {
    if (this.chiuso) return this._tot;
    // 0.71: finche' la trascrizione copre poco testo, ci si fida della previsione dal
    // ritmo; dopo, della frazione trascritta. Mai meno del parlato gia' arrivato.
    const fr = this.frazione;
    const stima = fr >= 0.3 ? this._tot / fr : this.previsto;
    return Math.max(this._tot, stima);
  }
}
ProfiloVivo.ritmo = 18;   // lettere per secondo di parlato (misurato il 20/10 sulla voce Live: ~18)

// ---- 3. il piano: a ogni istante, quale forma --------------------------------
// 0.68: NON piu' una forma per lettera (dieci cambi al secondo: sembrava che
// tremasse). Si ragiona a SILLABE, come una persona: ogni vocale e' il cuore di una
// sillaba, le consonanti prima le appartengono. L'APERTURA della bocca segue il
// volume della voce rispetto ai suoni vicini (cosi' si chiude fra una sillaba e
// l'altra e si apre sulla vocale), la FORMA (A E I O U) cambia una volta per
// sillaba. M/B/P = labbra chiuse per un attimo all'inizio della sillaba, F/V =
// denti sul labbro.
// 0.72: la BOCCA della consonante che apre la sillaba (si guarda l'ultima consonante del
// gruppo, quella attaccata alla vocale: in "stra" e' la r, in "scia" la sc).
export function classeCons(cons, vocale) {
  if (!cons) return "";
  const c = cons.slice(-1), c2 = cons.slice(-2);
  if (/^(sc|gl|gn)$/.test(c2) && /[ei]/.test(vocale)) return "C";
  if (c2 === "gl" || c2 === "gn") return "C";
  if (/[mbp]/.test(c)) return "M";
  if (/[fv]/.test(c)) return "F";
  if (/[cg]/.test(c)) return /[ei]/.test(vocale) ? "C" : "K";
  if (/[qkhj]/.test(c)) return "K";
  if (/[tdnlrsz]/.test(c)) return "T";
  return "T";
}
export function sillabe(testo) {
  const t = String(testo || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const out = [];
  let cons = "", primaVocale = false;  // consonanti in attesa della prossima vocale; la lettera prima era una vocale?
  const vocale = (ch) => "aeiouy".includes(ch) ? (ch === "y" ? "I" : ch.toUpperCase()) : "";
  for (const ch of t) {
    const v = vocale(ch);
    if (v) {
      // due vocali di fila (dittongo, "buo", "pia"): la seconda e' una sillaba corta
      out.push({ v, c: classeCons(cons, ch), chiusa: /[mbp]/.test(cons), denti: /[fv]/.test(cons), p: primaVocale ? 0.7 : 1 });
      cons = ""; primaVocale = true;
    } else if (ch >= "a" && ch <= "z") {
      cons += ch; primaVocale = false;
    } else {
      // spazio o punteggiatura: le consonanti rimaste (es. "con", "per") allungano la sillaba prima
      if (cons && out.length) out[out.length - 1].p += 0.25;
      // 0.71: sulla punteggiatura la voce fa una pausa: e' un punto di ancoraggio fra testo e suono
      if (/[.,;:!?…]/.test(ch) && out.length) out[out.length - 1].stacco = true;
      cons = ""; primaVocale = false;
    }
  }
  if (cons && out.length) out[out.length - 1].p += 0.25;
  return out;
}

// ---- 2d. le ancore: le pause del suono agganciate alla punteggiatura del testo ----
// 0.71: prima le sillabe erano spalmate in proporzione sul tempo parlato TOTALE: se la
// voce diceva una frase piu' in fretta dell'altra, le vocali scivolavano di una o due
// sillabe. Ora i segmenti di parlato fra due pause vere (>= 140 ms di silenzio) si
// agganciano agli spezzoni di testo fra due segni di punteggiatura (allineamento monotono
// a costo minimo, vedi sotto); dentro ogni tratto resta la proporzione.
// Risultato: a ogni virgola e punto il labiale si "riallinea" col suono.
export function ancore(prof, fineFrasi) {
  const n = prof.e.length, tot = prof.totale || 0;
  const pause = [];                              // frazione del parlato a cui FINISCE ogni segmento
  if (tot > 0 && n) {
    let inParola = false, zitto = 0, cumFine = 0;
    for (let i = 0; i < n; i++) {
      if (prof.parlato[i]) { if (!inParola) { inParola = true; } zitto = 0; cumFine = prof.cum[i]; }
      else if (inParola && ++zitto >= 7) { inParola = false; pause.push(cumFine / tot); }
    }
  }
  // allineamento monotono a costo minimo (programmazione dinamica): ogni coppia costa la
  // distanza fra le due frazioni, saltare una pausa o uno stacco costa 0,05. Cosi' se le
  // pause sono tante quante le frasi si accoppiano tutte, anche con scarti del 10-15%;
  // se la voce ha fatto una pausa in piu' (o in meno) quella resta senza compagna.
  const P = fineFrasi.length, S = pause.length, SALTO = 0.05;
  const costo = [], via = [];
  for (let j = 0; j <= P; j++) { costo.push(new Float64Array(S + 1)); via.push(new Int8Array(S + 1)); }
  for (let j = 0; j <= P; j++) for (let k = 0; k <= S; k++) {
    if (!j && !k) { costo[j][k] = 0; continue; }
    let best = Infinity, b = 0;
    if (j && k) { const v = costo[j - 1][k - 1] + Math.abs(fineFrasi[j - 1] - pause[k - 1]); if (v < best) { best = v; b = 1; } }
    if (j) { const v = costo[j - 1][k] + SALTO; if (v < best) { best = v; b = 2; } }
    if (k) { const v = costo[j][k - 1] + SALTO; if (v < best) { best = v; b = 3; } }
    costo[j][k] = best; via[j][k] = b;
  }
  const coppie = [];
  for (let j = P, k = S; j || k;) {
    const b = via[j][k];
    if (b === 1) { if (Math.abs(fineFrasi[j - 1] - pause[k - 1]) <= 0.18) coppie.push([pause[k - 1], fineFrasi[j - 1]]); j--; k--; }
    else if (b === 2) j--; else k--;
  }
  coppie.reverse();
  const out = [[0, 0]];
  for (const [c, a] of coppie) if (c > out[out.length - 1][0] + 0.01 && a > out[out.length - 1][1] + 0.01 && c < 0.99 && a < 0.99) out.push([c, a]);
  out.push([1, 1]);
  return out;                                    // coppie [frazione del suono, frazione del testo], crescenti
}
function conAncore(anc, frac) {
  for (let i = 1; i < anc.length; i++) {
    if (frac <= anc[i][0]) {
      const [c0, a0] = anc[i - 1], [c1, a1] = anc[i];
      return c1 > c0 ? a0 + (a1 - a0) * (frac - c0) / (c1 - c0) : a0;
    }
  }
  return 1;
}
export function piano(testo, prof) {
  const sill = sillabe(testo);
  const pesoTot = sill.reduce((s, x) => s + x.p, 0) || 1;
  let acc = 0; const fine = sill.map(x => { acc += x.p; return acc / pesoTot; });
  const inizio = fine.map((f, k) => k ? fine[k - 1] : 0);
  const fineFrasi = fine.filter((f, k) => sill[k].stacco && f < 0.995);
  const FIN = 25;                      // finestra per il massimo locale: ±500 ms (0.73; era ±200)
  let ultima = "X", tUltima = -1;
  let anc = [[0, 0], [1, 1]], ancN = -1, ancTot = -1;
  return {
    get ancore() { return anc; },
    forma(t) {
      const n = prof.e.length; if (!n) return { f: "X", forza: 0, ap: 0, v: null };
      const i = Math.min(n - 1, Math.max(0, Math.floor(t / prof.hop)));
      const forza = prof.max ? Math.min(1, prof.e[i] / prof.max) : 0;
      if (!prof.parlato[i]) { ultima = "X"; return { f: "X", forza: 0, ap: 0, v: null }; }
      // apertura: il volume di adesso rispetto ai suoni vicini
      let loc = 0; for (let j = Math.max(0, i - FIN); j <= Math.min(n - 1, i + FIN); j++) if (prof.e[j] > loc) loc = prof.e[j];
      loc = Math.max(loc, 0.35 * (prof.max || 0));
      // 0.73: finestra piu' larga (±500 ms) e una base minima: le sillabe deboli aprono meno,
      // la bocca non torna a zero fra una sillaba e l'altra (come una bocca vera).
      // 0.74: IL RITMO VERO. Misurato sul video in cui Sofia parla davvero (240 fotogrammi,
      // MediaPipe): i picchi di apertura stanno fra 0,09 e 0,23 "distanze fra gli occhi"
      // (mediana 0,135), la nostra A tutta aperta e' 0,28: il tetto scende a 0,88.
      const rel = loc ? prof.e[i] / loc : 0;
      let ap = 0.05 + 0.86 * Math.pow(Math.max(0, Math.min(1, rel)), 1.5);
      // quale sillaba: in base a quanto parlato e' passato, riallineato alle pause (0.71)
      const tot = prof.totale || 0;
      if (fineFrasi.length && (n !== ancN || tot !== ancTot)) { anc = ancore(prof, fineFrasi); ancN = n; ancTot = tot; }
      const frac = tot ? conAncore(anc, prof.cum[i] / tot) : 0;
      let k = 0; while (k < fine.length - 1 && fine[k] < frac) k++;
      const sl = sill[k] || { v: "A", p: 1 };
      const durS = Math.max(1e-6, fine[k] - inizio[k]);
      const prog = Math.max(0, Math.min(1, (frac - inizio[k]) / durS));
      // 0.69: la vocale della sillaba e l'apertura, e basta. Le consonanti si vedono
      // nell'apertura: M/B/P = labbra chiuse all'inizio della sillaba, F/V = quasi chiuse.
      // 0.72: la consonante occupa l'inizio della sillaba (circa 70 ms, mai oltre il 35%).
      // 0.74: la consonante NON e' piu' una bocca intera che scatta: e' un PESO (cw) con cui
      // la sua forma si mescola alla vocale. M/B/P chiudono davvero le labbra (peso 1),
      // F/V quasi (0,85), le altre (t d n l r s z c g) solo a meta' (0,5): nel video vero
      // la mascella non si richiude a ogni consonante, si vede appena un filo di denti.
      const durSec = durS * tot;                         // durata vera della sillaba in secondi
      const quotaCons = sl.c ? Math.min(0.35, Math.max(0.15, 0.07 / Math.max(0.05, durSec))) : 0;
      let f, vis, cw = 0;
      if (sl.c && prog < quotaCons) {
        vis = sl.c; cw = sl.c === "M" ? 1 : sl.c === "F" ? 0.85 : 0.5;
        f = sl.c === "M" ? "M" : sl.c === "F" ? "F" : "L";
        if (sl.c === "M") ap = 0; else if (sl.c === "F") ap = Math.min(ap, 0.2); else ap *= 0.7;
      } else {
        vis = sl.v;
        if (ap < 0.12) f = "X";
        else if (sl.v === "A") f = ap < 0.45 ? "E" : "A";
        else if (sl.v === "O") f = ap < 0.45 ? "U" : "O";
        else if (sl.v === "E") f = ap < 0.3 ? "I" : "E";
        else f = sl.v;
      }
      if (f !== ultima && ultima !== "X" && f !== "X" && f !== "M" && t - tUltima < 0.07) f = ultima;
      if (f !== ultima) { ultima = f; tUltima = t; }
      return { f, forza, ap, v: vis, voc: sl.v, cw };
    },
  };
}

// ---- il disegno sulla tela ---------------------------------------------------
const CACHE = new Map();
function immagine(src) {
  if (CACHE.has(src)) return CACHE.get(src);
  const p = new Promise((res, rej) => { const im = new Image(); im.decoding = "async"; im.onload = () => res(im); im.onerror = () => rej(new Error("manca " + src)); im.src = src; });
  CACHE.set(src, p); return p;
}
const POSE = new Map();
function posaDi(src) {
  if (POSE.has(src)) return POSE.get(src);
  const p = fetch(src, { cache: "force-cache" }).then(r => r.ok ? r.json() : null).catch(() => null);
  POSE.set(src, p); return p;
}
export async function precarica(file = FILE) {
  const tutte = [file.base, file.cavita, file.denti, file.bocche].filter(Boolean);
  await Promise.all([...tutte.map(immagine), file.rig ? posaDi(file.rig) : null, file.clip ? posaDi(file.clip) : null, file.boccheDati ? posaDi(file.boccheDati) : null]);
}

// ============================================================================
// 0.75: LE BOCCHE VERE. Non si deforma piu' la bocca della foto: a ogni istante si SCEGLIE, fra i
// fotogrammi del video in cui Sofia parla davvero, quello con la bocca piu' simile a quella che
// serve (apertura, larghezza, sorriso) e si disegna QUEL pezzo di video sopra il viso: labbra,
// denti e lingua veri. Si preferisce proseguire col fotogramma successivo (come scorre il video
// vero), e si cambia sequenza solo quando la forma lo chiede; fra due sequenze c'e' una
// dissolvenza di 90 ms. Si sceglie 24 volte al secondo, come il video.
// ============================================================================
export class Bocche {
  constructor(frames) {
    this.f = frames; this.k = -1; this.k2 = -1; this.a = 1; this.tCambio = 0; this.tScelta = -1e9; this.scala = 1;
    // la bocca chiusa "di riposo": la meno aperta, col sorriso piu' vicino alla base
    let best = -1, bc = Infinity;
    frames.forEach((g, j) => { const c = g.ap * 30 + Math.abs(g.sorr) * 10; if (c < bc) { bc = c; best = j; } });
    this.riposo = best;
  }
  // apT = apertura voluta (in "distanze fra gli occhi"), wT = larghezza voluta, sorrT = sorriso del
  // fotogramma sotto (per non incollare una bocca seria su guance che ridono), apVel = se si sta
  // aprendo (+) o chiudendo (-), ora in ms
  scegli(apT, wT, sorrT, apVel, ora) {
    if (ora - this.tScelta < 40) return;              // 24 scelte al secondo, come il video
    this.tScelta = ora;
    const f = this.f, p = this.k, n = f.length; let best = -1, bc = Infinity;
    const lp = p >= 0 ? f[p].lum : 0, dir = apVel > 0.25 ? 1 : apVel < -0.25 ? -1 : 0;
    for (let j = 0; j < n; j++) {
      const g = f[j];
      const da = (g.ap - apT) / 0.025, dw = (g.w - wT) / 0.06, ds = (g.sorr - sorrT) / 0.04;
      let c = da * da + dw * dw + 0.5 * ds * ds;
      // la sequenza deve andare nel verso giusto: se la bocca si sta aprendo, il fotogramma dopo deve essere piu' aperto
      if (dir && j + 1 < n) { const d2 = f[j + 1].ap - g.ap; if (d2 * dir < -0.004) c += 0.8; }
      // continuita': proseguire col fotogramma dopo e' gratis, saltare altrove costa (e costa di piu'
      // se cambia la luce dentro la bocca: denti/lingua che compaiono e spariscono)
      if (p >= 0) { if (j === p + 1) c -= 0.5; else if (j === p || j === p + 2) c += 0; else { const dl = (g.lum - lp) / 50; c += 2.5 + dl * dl; } }
      if (c < bc) { bc = c; best = j; }
    }
    if (best < 0) return;
    // la forma si adatta all'apertura voluta: i punti si allungano in verticale (poco)
    const ak = f[best].ap; this.scala = ak > 0.015 ? Math.max(0.6, Math.min(1.5, apT / ak)) : 1;
    if (best === this.k) return;
    if (p >= 0 && best !== p + 1 && best !== p + 2) { this.k2 = this.k; this.a = 0; this.tCambio = ora; }   // salto: dissolvenza
    else { this.k2 = -1; this.a = 1; }
    this.k = best;
  }
  stato(ora) {
    if (this.k2 >= 0) { this.a = Math.min(1, (ora - this.tCambio) / 110); if (this.a >= 1) this.k2 = -1; }
    return { k: this.k, a: this.a, k2: this.k2, a2: this.k2 >= 0 ? 1 : 0, scala: this.scala };
  }
}

// (0.69-0.72, RISERVA se manca WebGL) NIENTE SCATTI. La bocca non salta fra otto disegni: scorre lungo i fotogrammi
// veri della vocale che sta dicendo, spinta dall'apertura (il volume della voce).
// 0.72: IL CORPO VIVO. Sotto la bocca non c'e' piu' la foto ferma ma il FILMATO "parla"
// (testa che si muove, mano alla collana, capelli): a ogni disegno si copia sulla tela il
// fotogramma che il video sta mostrando e la bocca si appoggia seguendo la posa della
// testa di QUEL fotogramma (posa_parla.json: una trasformazione per fotogramma, calcolata
// dai punti del viso). Se il filmato non e' pronto, si torna alla foto base come prima.
// Nei silenzi la toppa sfuma via e si vede la bocca vera del filmato.
export class Labiale2D {
  constructor(box, file = FILE, ancora = ANCORA) {
    this.box = box; this.file = file; this.ancora = ancora;
    this.tela = null; this.ctx = null; this.pronta = false; this.tUltimo = 0;
    this.vVis = "A"; this.vPrima = null; this.tCambio = 0; this.apVis = 0; this.tDisegno = 0;
    this.alfa = 0;            // quanto si vede la toppa (0 = bocca vera del filmato)
    this.posa = null; this.video = null; this.fotogramma = 0; this.fps = 24; this.rvfc = 0;
    this.ultimaFonte = "";
  }
  async monta() {
    const chiavi = Object.keys(STRISCE);
    const [base, posa, ...strisce] = await Promise.all([immagine(this.file.base), this.file.posa ? posaDi(this.file.posa) : null, ...chiavi.map(v => immagine(this.file.strisce[v]))]);
    // 0.74: posa_parla.json puo' essere { posa: [...], parlante: true } (filmato in cui lei parla davvero:
    // la toppa chiusa resta sempre sopra, anche nei silenzi, se no si vedrebbe la sua bocca che parla)
    const lista = Array.isArray(posa) ? posa : (posa && Array.isArray(posa.posa) ? posa.posa : null);
    this.base = base; this.posa = lista && lista.length ? lista : null; this.parlante = !!(posa && !Array.isArray(posa) && posa.parlante);
    this.strisce = Object.fromEntries(chiavi.map((v, i) => [v, strisce[i]]));
    const c = document.createElement("canvas");
    c.width = base.naturalWidth; c.height = base.naturalHeight;
    c.className = "lab-tela";
    c.style.transition = "opacity .25s ease";
    this.box.appendChild(c);
    this.tela = c; this.ctx = c.getContext("2d");
    this._specchiaStile(this._videoVisibile());
    this.disegna(null, 0, 0, 0);
    requestAnimationFrame(() => c.classList.add("vedi"));
    this.pronta = true;
  }
  // il video che si vede adesso nella casella
  _videoVisibile() {
    if (!this.box) return null;
    const vs = [...this.box.querySelectorAll("video")];
    return vs.find(x => !x.classList.contains("giu")) || vs[0] || null;
  }
  // 0.72: la tela copia OGNI VOLTA posizione, zoom e ritaglio del video sotto (anche a meta'
  // di una transizione): cosi' quando compare o sparisce l'immagine non salta.
  _specchiaStile(v) {
    if (!v || !this.tela) return;
    const cs = getComputedStyle(v), st = this.tela.style;
    if (st.transform !== cs.transform) st.transform = cs.transform;
    if (st.transformOrigin !== cs.transformOrigin) st.transformOrigin = cs.transformOrigin;
    if (st.objectFit !== cs.objectFit) st.objectFit = cs.objectFit;
    if (st.objectPosition !== cs.objectPosition) st.objectPosition = cs.objectPosition;
  }
  // il video del filmato "parla" che si vede adesso nella casella (null se non e' lui)
  _videoParla() {
    if (!this.box) return null;
    let v = null;
    if (this.box.dataset.film === "parla") v = this._videoVisibile();
    // 0.74: mentre il filmato "parla" sfuma verso quello di riposo, si continua a seguirlo
    // finche' scorre (la tela sta gia' sfumando via: cosi' non salta alla foto)
    else v = [...this.box.querySelectorAll("video")].find(x => /cons-parla\./.test(x.currentSrc || x.src || "") && !x.paused && !x.ended) || null;
    if (!v || v.readyState < 2 || !v.videoWidth) return null;
    if (v !== this.video) {
      this.video = v; this.fotogramma = Math.round((v.currentTime || 0) * this.fps);
      if (typeof v.requestVideoFrameCallback === "function") {
        const me = this, vid = v;
        const giro = (ora, meta) => {
          if (me.video !== vid || !me.tela) return;
          me.fotogramma = Math.round((meta.mediaTime || 0) * me.fps);
          me.rvfc = vid.requestVideoFrameCallback(giro);
        };
        this.rvfc = v.requestVideoFrameCallback(giro);
      }
    } else if (typeof v.requestVideoFrameCallback !== "function") {
      this.fotogramma = Math.round((v.currentTime || 0) * this.fps);
    }
    return v;
  }
  // la posa della testa nel fotogramma che il video sta mostrando (base -> fotogramma)
  _posaOra() {
    if (!this.posa) return null;
    const n = this.posa.length, i = ((this.fotogramma % n) + n) % n;
    return this.posa[i];
  }
  // un fotogramma della striscia (indice anche frazionario: si fa la media fra i due vicini)
  _toppa(v, livello, alfa, ax, ay) {
    const im = this.strisce[v]; if (!im || alfa <= 0.003) return;
    const n = STRISCE[v], w = TOPPA.w, h = TOPPA.h;
    const L = Math.max(0, Math.min(n - 1, livello));
    const i0 = Math.floor(L), fr = L - i0;
    this.ctx.globalAlpha = alfa;
    this.ctx.drawImage(im, i0 * w, 0, w, h, ax, ay, w, h);
    if (fr > 0.02 && i0 + 1 < n) { this.ctx.globalAlpha = alfa * fr; this.ctx.drawImage(im, (i0 + 1) * w, 0, w, h, ax, ay, w, h); }
    this.ctx.globalAlpha = 1;
  }
  disegna(v, ap = 0, forza = 0, t = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.tela.width, H = this.tela.height;
    const ora = performance.now();
    const dt = this.tDisegno ? Math.min(50, ora - this.tDisegno) : 16; this.tDisegno = ora;
    this.tUltimo = t;
    // apertura disegnata: insegue quella vera. Si apre svelta (fino al 20% ogni 16 ms:
    // da chiusa a tutta aperta in 80 ms, come una bocca vera) e si chiude un po' piu'
    // morbida (14%). Senza questo freno tremava; con un freno piu' forte arrivava in ritardo.
    const mira = Math.max(0, Math.min(1, Number(ap) || 0));
    const su = 0.20 * (dt / 16), giu = 0.14 * (dt / 16);
    this.apVis += Math.max(-giu, Math.min(su, mira - this.apVis));
    if (this.apVis < 0.004) this.apVis = 0;
    // la toppa si vede quando c'e' qualcosa da dire (vocale o consonante); nei silenzi
    // sfuma via in ~150 ms e resta la bocca vera del filmato (o della foto)
    const miraAlfa = (v && STRISCE[v]) || (this.parlante && this.ultimaFonte === "video") ? 1 : 0;
    const passoAlfa = (miraAlfa > this.alfa ? 0.25 : 0.11) * (dt / 16);
    this.alfa += Math.max(-passoAlfa, Math.min(passoAlfa, miraAlfa - this.alfa));
    if (this.alfa < 0.01) this.alfa = 0; if (this.alfa > 0.99) this.alfa = 1;
    // cambio di bocca: fra due vocali quasi chiuse e' immediato (i primi fotogrammi sono
    // uguali); altrimenti la vecchia sfuma nella nuova in 110 ms (90 ms per le consonanti)
    if (v && STRISCE[v] && v !== this.vVis) {
      if (this.apVis < 0.25 && VOCALI[v] && VOCALI[this.vVis]) { this.vVis = v; this.vPrima = null; }
      else { this.vPrima = this.vVis; this.vVis = v; this.tCambio = ora; }
    }
    const durCambio = VOCALI[this.vVis] && (!this.vPrima || VOCALI[this.vPrima]) ? 110 : 90;
    const k = this.vPrima ? Math.min(1, (ora - this.tCambio) / durCambio) : 1;
    if (k >= 1) this.vPrima = null;
    // lo sfondo: il filmato "parla" (col corpo che si muove) se c'e', altrimenti la foto
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this._specchiaStile(this._videoVisibile());
    const vid = this._videoParla();
    let posa = null;
    if (vid) {
      try { ctx.drawImage(vid, 0, 0, W, H); posa = this._posaOra(); this.ultimaFonte = "video"; }
      catch (e) { ctx.drawImage(this.base, 0, 0); this.ultimaFonte = "foto"; }
    } else { ctx.drawImage(this.base, 0, 0); this.ultimaFonte = "foto"; }
    if (this.alfa <= 0) return;
    // la bocca: appoggiata seguendo la posa della testa di questo fotogramma
    if (posa) ctx.setTransform(posa[0], posa[1], posa[2], posa[3], posa[4], posa[5]);
    const ax = this.ancora.x, ay = this.ancora.y;
    const liv = (vv) => this.apVis * (STRISCE[vv] - 1);
    // sotto, sempre la bocca chiusa (fotogramma 0 della vocale): copre i bordi di qualunque dissolvenza
    const sotto = VOCALI[this.vVis] ? this.vVis : (this.vPrima && VOCALI[this.vPrima] ? this.vPrima : "A");
    this._toppa(sotto, 0, this.alfa, ax, ay);
    if (this.vPrima && k < 1) this._toppa(this.vPrima, liv(this.vPrima), this.alfa * (1 - k), ax, ay);
    this._toppa(this.vVis, liv(this.vVis), this.alfa * (this.vPrima ? k : 1), ax, ay);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  smonta() {
    const c = this.tela; this.tela = null; this.ctx = null; this.pronta = false;
    if (this.video && this.rvfc && typeof this.video.cancelVideoFrameCallback === "function") { try { this.video.cancelVideoFrameCallback(this.rvfc); } catch (e) {} }
    this.video = null;
    if (!c) return;
    c.classList.remove("vedi");
    setTimeout(() => { try { c.remove(); } catch (e) {} }, 320);
  }
}

// ============================================================================
// 0.73: LA MASCHERA DEFORMABILE (vedi viso.js). Non si incolla piu' una bocca: si
// deforma tutto il viso. Qui c'e' il "regista": riceve dal piano la bocca (vocale o
// consonante) e l'apertura, decide battito di ciglia e sopracciglia, trova il fotogramma
// del filmato sotto e chiede a Viso di disegnare. Se WebGL non c'e', si usa Labiale2D.
// ============================================================================
export class Labiale {
  constructor(box, file = FILE) {
    this.box = box; this.file = file;
    this.tela = null; this.pronta = false; this.tUltimo = 0; this.tDisegno = 0;
    this.vVis = null; this.vPrima = null; this.tCambio = 0; this.apVis = 0; this.apVel = 0;
    this.battito = 0; this.tBattito = 0; this.prossimoBattito = 0; this.sopr = 0;
    this.video = null; this.fotogramma = 0; this.fps = 24; this.rvfc = 0; this.ultimaFonte = "";
    this.riserva = null; this.forme = []; this.bocche = null; this.boccaOra = null; this.sorrOra = 0;
  }
  async monta() {
    const f = this.file;
    const [rig, clip, base, cavita, denti, atlante, lib] = await Promise.all([posaDi(f.rig), posaDi(f.clip), immagine(f.base), immagine(f.cavita), immagine(f.denti),
      f.bocche ? immagine(f.bocche).catch(() => null) : null, f.boccheDati ? posaDi(f.boccheDati) : null]);
    if (!rig || !rig.base) throw new Error("manca rig.json");
    const c = document.createElement("canvas");
    c.width = rig.w; c.height = rig.h; c.className = "lab-tela"; c.style.transition = "opacity .25s ease";
    let viso = null;
    try { viso = new Viso(c, rig, { base, cavita, denti }); }
    catch (e) {
      console.warn("WebGL non disponibile, uso le toppe", e);
      this.riserva = new Labiale2D(this.box, f); await this.riserva.monta(); this.pronta = true; return;
    }
    this.viso = viso; this.mimica = new Mimica(rig); this.rig = rig;
    // 0.75: le bocche vere (se l'atlante c'e' e la scheda grafica lo regge; altrimenti le forme 0.73)
    this.bocche = null;
    try { if (atlante && lib && viso.impostaBocche(atlante, lib, rig.peso)) this.bocche = new Bocche(viso.bocche.frames); }
    catch (e) { console.warn("bocche vere", e); this.bocche = null; }
    // i punti del viso in ogni fotogramma del filmato "parla": base spostata con la posa + residuo
    this.clip = null;
    if (clip && clip.posa && clip.res) {
      // 0.74: il filmato "parla" e' un video in cui lei PARLA DAVVERO (testa, occhi, sopracciglia,
      // spalle: tutto vero). La sua bocca pero' direbbe altre parole: per ogni fotogramma si
      // tengono i punti VERI (fonti: da li' si prende l'immagine) e i punti NEUTRI (neutri: la
      // zona della bocca riportata alla base chiusa, col peso rig.peso), da cui partono le
      // nostre forme. Fuori dalla zona della bocca neutri = fonti: la sua espressione resta.
      const N = rig.n, q = clip.q || 4, fonti = [], neutri = [], lin = [], peso = rig.peso || null;
      for (let i = 0; i < clip.posa.length; i++) {
        const P = clip.posa[i], r = clip.res[i], L = new Float32Array(N * 2), Nn = peso ? new Float32Array(N * 2) : null;
        for (let k = 0; k < N; k++) {
          const x = rig.base[k][0], y = rig.base[k][1];
          const bx = P[0] * x + P[2] * y + P[4], by = P[1] * x + P[3] * y + P[5];
          L[2 * k] = bx + r[k][0] / q; L[2 * k + 1] = by + r[k][1] / q;
          if (Nn) { const w = 1 - (peso[k] || 0); Nn[2 * k] = bx + w * r[k][0] / q; Nn[2 * k + 1] = by + w * r[k][1] / q; }
        }
        fonti.push(L); neutri.push(Nn || L); lin.push([P[0], P[1], P[2], P[3]]);
      }
      this.clip = { seq: clip.seq, fonti, neutri, lin, sorr: clip.sorr || null, fps: clip.fps || 24, parlante: !!(peso && clip.parlante) };
      this.fps = this.clip.fps;
    }
    this.box.appendChild(c);
    this.tela = c;
    this._specchiaStile(this._videoVisibile());
    this.prossimoBattito = performance.now() + 900;
    this.disegna(null, 0, 0, 0);
    requestAnimationFrame(() => c.classList.add("vedi"));
    this.pronta = true;
  }
  _videoVisibile() { return Labiale2D.prototype._videoVisibile.call(this); }
  _specchiaStile(v) { return Labiale2D.prototype._specchiaStile.call(this, v); }
  _videoParla() { return Labiale2D.prototype._videoParla.call(this); }
  // 0.74: dal piano (la forma di adesso: r = { v, voc, cw, ap }) al delta dei punti. E' separato
  // da disegna() per poterlo provare "a tavolino" (simulazione in Node) con gli stessi numeri.
  passo(r, ora, dt, mimica) {
    const mim = mimica || this.mimica;
    // 1) l'apertura: una massa con molla e smorzamento critico, costante 50 ms (dal 10 al 90%
    //    in ~170 ms: la mascella vera misurata sale in 167 ms, scende in 208)
    const mira = Math.max(0, Math.min(1, Number(r && r.ap) || 0));
    let resto = Math.max(1, Math.min(90, dt));
    while (resto > 0) { const h = Math.min(12, resto) / 1000, tau = 0.05; resto -= 12; this.apVel += ((mira - this.apVis) / (tau * tau) - 2 * this.apVel / tau) * h; this.apVis += this.apVel * h; }
    if (this.apVis < 0) { this.apVis = 0; if (this.apVel < 0) this.apVel = 0; }
    if (this.apVis > 1) { this.apVis = 1; if (this.apVel > 0) this.apVel = 0; }
    // 2) le forme: la vocale della sillaba al livello dell'apertura; se siamo sulla consonante
    //    iniziale, la sua bocca si MESCOLA alla vocale col suo peso (M=1, F=0,85, altre 0,5)
    const vis = mim.vis, forme = this.forme; forme.length = 0;
    // (O e U: le labbra si arrotondano anche a bocca poco aperta: il livello parte dal 30%)
    const liv = (v) => ((v === "O" || v === "U") ? 0.3 + 0.7 * this.apVis : this.apVis) * ((vis[v] ? vis[v].length : 1) - 1);
    const voc = r && r.voc && VOCALI[r.voc] && vis[r.voc] ? r.voc : (r && r.v && VOCALI[r.v] ? r.v : null);
    const cons = r && r.v && !VOCALI[r.v] && vis[r.v] ? r.v : null;
    const cw = cons ? Math.max(0, Math.min(1, r.cw === undefined ? 1 : Number(r.cw) || 0)) : 0;
    if (cons && cw > 0) forme.push({ v: cons, L: 0, w: cw });
    if (voc && cw < 1) forme.push({ v: voc, L: liv(voc), w: 1 - cw });
    this.vVis = cons || voc;                       // (in silenzio: nessuna forma, i punti tornano alla posa neutra)
    // 0.75: con la libreria delle bocche vere, la forma non viene dalle strisce ma dal fotogramma scelto
    let res = null, res2 = null, aRes = 1;
    if (this.bocche) {
      const LARG = { A: 0.58, E: 0.56, I: 0.57, O: 0.44, U: 0.43 };
      let apT = this.apVis * 0.29, wT = voc ? (LARG[voc] || 0.55) : 0.50;
      if (cons) { const wc = cons === "M" ? 0.50 : cons === "F" ? 0.52 : 0.50; wT = wT * (1 - cw) + wc * cw; if (cons === "M") apT = Math.min(apT, 0.01 + 0.03 * (1 - cw)); else if (cons === "F") apT = Math.min(apT, 0.05); }
      if (!voc && !cons) { apT = Math.min(apT, 0.012); wT = 0.50; }
      const sorrT = this.sorrOra || 0;
      this.bocche.scegli(apT, wT, sorrT, this.apVel * 0.29, ora);
      const st = this.bocche.stato(ora); this.boccaOra = st;
      const F = this.viso.bocche.frames;
      res = F[st.k] ? F[st.k].res : null; res2 = st.k2 >= 0 && F[st.k2] ? F[st.k2].res : null; aRes = st.a;
      forme.length = 0;                            // niente strisce: la forma e' quella della bocca vera
    } else this.boccaOra = null;
    // 3) battito di ciglia e sopracciglia: SOLO sulla foto ferma. Sotto il filmato parlante
    //    gli occhi e le sopracciglia sono quelli veri del video (0.74).
    const foto = this.ultimaFonte !== "video";
    if (foto) {
      if (!this.tBattito && ora >= this.prossimoBattito) { this.tBattito = ora; this.prossimoBattito = ora + 1800 + Math.random() * 2200; }
      if (this.tBattito) {
        const e = ora - this.tBattito;
        this.battito = e < 80 ? e / 80 : e < 120 ? 1 : e < 250 ? 1 - (e - 120) / 130 : 0;
        if (e >= 250) { this.tBattito = 0; this.battito = 0; }
      }
    } else { this.battito = 0; this.tBattito = 0; this.prossimoBattito = ora + 1200; }
    const miraSopr = foto ? 0.35 * this.apVis * this.apVis : 0;
    this.sopr += (miraSopr - this.sopr) * (1 - Math.exp(-dt / 150));
    const lib = !!(this.bocche && res);
    return mim.aggiorna({ forme, res, res2, a: aRes, scala: this.boccaOra ? this.boccaOra.scala : 1, tauX: lib ? 0.030 : 0, tauY: lib ? 0.022 : 0, battito: this.battito, sopracciglia: this.sopr }, dt);
  }
  disegna(v, ap = 0, forza = 0, t = 0, r = null) {
    if (this.riserva) return this.riserva.disegna(v, ap, forza, t);
    if (!this.tela || !this.viso) return;
    const ora = performance.now();
    const dt = this.tDisegno ? Math.min(90, ora - this.tDisegno) : 16; this.tDisegno = ora;
    this.tUltimo = t;
    if (!r) r = { v, ap, voc: v && VOCALI[v] ? v : null, cw: v && !VOCALI[v] ? 1 : 0 };
    const delta = this.passo(r, ora, dt, this.mimica);
    // lo sfondo: il filmato "parla" se c'e' (coi suoi punti e la sua posa), altrimenti la foto
    this._specchiaStile(this._videoVisibile());
    const vid = this._videoParla();
    if (vid && this.clip) {
      const n = this.clip.seq.length, j = ((this.fotogramma % n) + n) % n, i = this.clip.seq[j];
      this.sorrOra = this.clip.sorr ? this.clip.sorr[i] : 0;
      this.viso.disegna(delta, vid, this.clip.fonti[i], this.clip.lin[i], this.clip.neutri[i], this.boccaOra); this.ultimaFonte = "video";
    } else { this.sorrOra = 0; this.viso.disegna(delta, null, null, null, null, this.boccaOra); this.ultimaFonte = "foto"; }
  }
  smonta() {
    if (this.riserva) { this.riserva.smonta(); this.riserva = null; this.pronta = false; return; }
    const c = this.tela; this.tela = null; this.pronta = false;
    if (this.video && this.rvfc && typeof this.video.cancelVideoFrameCallback === "function") { try { this.video.cancelVideoFrameCallback(this.rvfc); } catch (e) {} }
    this.video = null;
    if (!c) return;
    c.classList.remove("vedi");
    setTimeout(() => { try { const gl = c.getContext("webgl"); if (gl && gl.getExtension("WEBGL_lose_context")) gl.getExtension("WEBGL_lose_context").loseContext(); } catch (e) {} try { c.remove(); } catch (e) {} }, 320);
  }
}
