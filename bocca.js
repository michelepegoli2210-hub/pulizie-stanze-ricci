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
export const ANCORA = { x: 180, y: 360 };      // dove si appoggia la toppa, sulla base 540x960
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

// ---- 3. il piano: a ogni istante, quale forma --------------------------------
export function piano(testo, prof) {
  const voci = visemi(testo).filter(v => v.f !== "X");
  const pesoTot = voci.reduce((s, v) => s + v.p, 0) || 1;
  let acc = 0; const bordi = voci.map(v => { acc += v.p; return acc / pesoTot; });
  let ultimo = "X";
  return {
    forma(t) {
      const i = Math.min(prof.e.length - 1, Math.max(0, Math.floor(t / prof.hop)));
      const forza = prof.max ? prof.e[i] / prof.max : 0;
      if (!prof.parlato[i]) { ultimo = "X"; return { f: "X", forza: 0 }; }
      const frac = prof.totale ? prof.cum[i] / prof.totale : 0;
      let k = 0; while (k < bordi.length - 1 && bordi[k] < frac) k++;
      let f = voci.length ? voci[k].f : "A";
      if (forza < 0.28) { if (f === "A") f = "E"; else if (f === "O") f = "U"; }
      if (forza < 0.1) f = "M";
      ultimo = f;
      return { f, forza };
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
    this.tela = null; this.ctx = null; this.pronta = false; this.formaOra = "X"; this.tUltimo = 0;
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
  disegna(f, forza = 0, t = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.tela.width, H = this.tela.height;
    this.tUltimo = t;
    // un respiro leggero e un'oscillazione minima della testa: viva, non una statua.
    // L'oscillazione va sull'orologio generale (non su quello della frase), cosi'
    // fra una frase e l'altra non ci sono scatti.
    const g = performance.now() / 1000;
    const sc = 1 + 0.004 * Math.sin(g * 0.9) + forza * 0.004;
    const dx = Math.sin(g * 1.1) * 1.6, dy = Math.sin(g * 0.7) * 1.1 + forza * 1.2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(W / 2 + dx, H * 0.3 + dy); ctx.scale(sc, sc); ctx.translate(-W / 2, -H * 0.3);
    ctx.drawImage(this.base, 0, 0);
    const tp = this.toppe[f] || this.toppe.X;
    if (tp) ctx.drawImage(tp, this.ancora.x, this.ancora.y);
    this.formaOra = f;
  }
  smonta() {
    const c = this.tela; this.tela = null; this.ctx = null; this.pronta = false;
    if (!c) return;
    c.classList.remove("vedi");
    setTimeout(() => { try { c.remove(); } catch (e) {} }, 320);
  }
}
