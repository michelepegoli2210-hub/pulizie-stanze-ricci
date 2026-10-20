// ============================================================================
//  BOCCA.JS  ·  Il labiale (0.66)
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

export const FORME = ["X", "M", "A", "E", "I", "O", "U", "L", "F"];
export const ANCORA = { x: 207, y: 338 };      // dove si appoggia la toppa, sulla base 540x960 (0.68.1: base dal video "attesa" nuovo, bocche vere dal video "parla" del 20/10)
export const FILE = {
  base: "lab-base.webp",
  toppe: Object.fromEntries(FORME.map(f => [f, `lab-${f}.webp`])),
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
  chiudi() { this.chiuso = true; }
  get totale() {
    if (this.chiuso) return this._tot;
    const fr = Math.max(0.08, this.frazione);
    return Math.max(this._tot, this._tot / fr);
  }
}

// ---- 3. il piano: a ogni istante, quale forma --------------------------------
// 0.68: NON piu' una forma per lettera (dieci cambi al secondo: sembrava che
// tremasse). Si ragiona a SILLABE, come una persona: ogni vocale e' il cuore di una
// sillaba, le consonanti prima le appartengono. L'APERTURA della bocca segue il
// volume della voce rispetto ai suoni vicini (cosi' si chiude fra una sillaba e
// l'altra e si apre sulla vocale), la FORMA (A E I O U) cambia una volta per
// sillaba. M/B/P = labbra chiuse per un attimo all'inizio della sillaba, F/V =
// denti sul labbro.
export function sillabe(testo) {
  const t = String(testo || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const out = [];
  let cons = "", primaVocale = false;  // consonanti in attesa della prossima vocale; la lettera prima era una vocale?
  const vocale = (ch) => "aeiouy".includes(ch) ? (ch === "y" ? "I" : ch.toUpperCase()) : "";
  for (const ch of t) {
    const v = vocale(ch);
    if (v) {
      // due vocali di fila (dittongo, "buo", "pia"): la seconda e' una sillaba corta
      out.push({ v, chiusa: /[mbp]/.test(cons), denti: /[fv]/.test(cons), p: primaVocale ? 0.7 : 1 });
      cons = ""; primaVocale = true;
    } else if (ch >= "a" && ch <= "z") {
      cons += ch; primaVocale = false;
    } else {
      // spazio o punteggiatura: le consonanti rimaste (es. "con", "per") allungano la sillaba prima
      if (cons && out.length) out[out.length - 1].p += 0.25;
      cons = ""; primaVocale = false;
    }
  }
  if (cons && out.length) out[out.length - 1].p += 0.25;
  return out;
}
export function piano(testo, prof) {
  const sill = sillabe(testo);
  const pesoTot = sill.reduce((s, x) => s + x.p, 0) || 1;
  let acc = 0; const fine = sill.map(x => { acc += x.p; return acc / pesoTot; });
  const inizio = fine.map((f, k) => k ? fine[k - 1] : 0);
  const FIN = 10;                      // finestra per il massimo locale: ±200 ms
  let ultima = "X", tUltima = -1;
  return {
    forma(t) {
      const n = prof.e.length; if (!n) return { f: "X", forza: 0, ap: 0 };
      const i = Math.min(n - 1, Math.max(0, Math.floor(t / prof.hop)));
      const forza = prof.max ? Math.min(1, prof.e[i] / prof.max) : 0;
      if (!prof.parlato[i]) { ultima = "X"; return { f: "X", forza: 0, ap: 0 }; }
      // apertura: il volume di adesso rispetto ai suoni vicini
      let loc = 0; for (let j = Math.max(0, i - FIN); j <= Math.min(n - 1, i + FIN); j++) if (prof.e[j] > loc) loc = prof.e[j];
      loc = Math.max(loc, 0.35 * (prof.max || 0));
      let ap = loc ? prof.e[i] / loc : 0; ap = Math.pow(Math.max(0, Math.min(1, ap)), 1.4);
      // quale sillaba: in base a quanto parlato e' passato
      const tot = prof.totale || 0;
      const frac = tot ? prof.cum[i] / tot : 0;
      let k = 0; while (k < fine.length - 1 && fine[k] < frac) k++;
      const sl = sill[k] || { v: "A", p: 1 };
      const durS = Math.max(1e-6, (fine[k] - inizio[k]) * tot);
      const prog = Math.max(0, Math.min(1, (prof.cum[i] - inizio[k] * tot) / durS));
      let f;
      if (sl.chiusa && prog < 0.22) f = "M";
      else if (sl.denti && prog < 0.2) f = "F";
      else if (ap < 0.12) f = "X";
      else if (sl.v === "A") f = ap < 0.45 ? "E" : "A";
      else if (sl.v === "O") f = ap < 0.45 ? "U" : "O";
      else if (sl.v === "E") f = ap < 0.3 ? "I" : "E";
      else f = sl.v;                   // I, U
      // niente tremolio: una forma resta almeno 50 ms, salvo chiusure
      if (f !== ultima && ultima !== "X" && f !== "X" && f !== "M" && t - tUltima < 0.07) f = ultima;
      if (f !== ultima) { ultima = f; tUltima = t; }
      return { f, forza, ap };
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
export async function precarica(file = FILE) {
  const tutte = [file.base, ...Object.values(file.toppe)];
  await Promise.all(tutte.map(immagine));
}

export class Labiale {
  constructor(box, file = FILE, ancora = ANCORA) {
    this.box = box; this.file = file; this.ancora = ancora;
    this.tela = null; this.ctx = null; this.pronta = false; this.formaOra = "X"; this.formaPrima = "X"; this.tCambio = 0; this.tUltimo = 0;
  }
  async monta() {
    const [base, ...toppe] = await Promise.all([immagine(this.file.base), ...FORME.map(f => immagine(this.file.toppe[f]))]);
    this.base = base; this.toppe = Object.fromEntries(FORME.map((f, i) => [f, toppe[i]]));
    const c = document.createElement("canvas");
    c.width = base.naturalWidth; c.height = base.naturalHeight;
    c.className = "lab-tela";
    // stessa inquadratura del video che copre
    const v = this.box.querySelector("video");
    if (v) { const cs = getComputedStyle(v); c.style.objectFit = cs.objectFit; c.style.objectPosition = cs.objectPosition; }
    this.box.appendChild(c);
    this.tela = c; this.ctx = c.getContext("2d");
    this.disegna("X", 0, 0);
    requestAnimationFrame(() => c.classList.add("vedi"));
    this.pronta = true;
  }
  disegna(f, forza = 0, t = 0, ap = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.tela.width, H = this.tela.height;
    this.tUltimo = t;
    // un'oscillazione minima della testa, a PIXEL INTERI: se si sposta di mezzo pixel
    // o si scala dell'1%, il browser ricampiona tutta la foto e la sfoca (0.68.1).
    const g = performance.now() / 1000;
    const dx = Math.round(Math.sin(g * 1.1) * 1.6), dy = Math.round(Math.sin(g * 0.7) * 1.1 + forza * 1.2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(this.base, dx, dy);
    // 0.68.2: niente scatti secchi. Quando la forma cambia, per 80 ms la vecchia
    // sfuma nella nuova; e la forma aperta si posa SOPRA la bocca chiusa con una
    // trasparenza che segue l'apertura: cosi' la bocca si apre e si chiude per gradi.
    const ora = performance.now();
    if (f !== this.formaOra) { this.formaPrima = this.formaOra; this.tCambio = ora; this.formaOra = f; }
    const k = Math.min(1, (ora - (this.tCambio || 0)) / 80);
    const X = this.toppe.X, ax = this.ancora.x + dx, ay = this.ancora.y + dy;
    const vis = (forma) => forma === "X" || forma === "M" ? 1 : Math.max(0, Math.min(1, (ap - 0.08) / 0.32));
    if (X) ctx.drawImage(X, ax, ay);
    const pr = this.toppe[this.formaPrima];
    if (pr && k < 1 && this.formaPrima !== "X") { ctx.globalAlpha = (1 - k) * vis(this.formaPrima); ctx.drawImage(pr, ax, ay); }
    const tp = this.toppe[f];
    if (tp && f !== "X") { ctx.globalAlpha = k * vis(f); ctx.drawImage(tp, ax, ay); }
    ctx.globalAlpha = 1;
  }
  smonta() {
    const c = this.tela; this.tela = null; this.ctx = null; this.pronta = false;
    if (!c) return;
    c.classList.remove("vedi");
    setTimeout(() => { try { c.remove(); } catch (e) {} }, 320);
  }
}
