// ============================================================================
//  VOCE.JS  ·  La governante che parla ad alta voce (0.59)
//  Due motori:
//   - "google": la voce vera di Google (Gemini TTS). Costa pochissimo e sembra
//     una persona. Torna un file WAV già pronto, che suoniamo qui.
//   - "telefono": la voce che c'è già dentro il telefono. Gratis, funziona
//     anche senza internet, ma si sente che è un robot.
//  Mentre parla misuriamo quanto è forte il suono, istante per istante, e la
//  bocca della governante si apre e si chiude davvero su quello che dice.
// ============================================================================

import { stimaDurata, ProfiloVivo } from "./bocca.js";
export const VOCI = [
  { id: "Autonoe", nome: "Brillante", come: "squillante e sveglia: parla chiaro" },
  { id: "Erinome", nome: "Nitida", come: "pulita e precisa, da professionista" },
  { id: "Zephyr", nome: "Viva", come: "chiara e piena di energia" },
  { id: "Kore", nome: "Decisa", come: "ferma e sicura, da chi comanda" },
  { id: "Sulafat", nome: "Calda", come: "calda, da signora gentile" },
  { id: "Vindemiatrix", nome: "Garbata", come: "pacata, parla piano" },
  { id: "Leda", nome: "Giovane", come: "svelta e fresca" },
  { id: "Achird", nome: "Amichevole", come: "allegra e alla mano" },
];

// Come deve parlare. Lo "stile" e' un'istruzione che mandiamo a Google insieme
// al testo: non viene letta ad alta voce, dice solo con che tono leggere.
// "rate" e "pitch" servono invece alla voce del telefono: velocita' e altezza.
export const TONI = [
  { id: "chiara", nome: "Chiara", rate: 1.06, pitch: 1.06,
    stile: "clear, bright and articulate, like a sharp professional giving a crisp briefing: precise consonants, lively but controlled pace, intelligent and self-assured, courteous and warm in a professional way. NEVER breathy, NEVER slow, NEVER sultry or intimate, no whispering, no stretched vowels" },
  { id: "garbata", nome: "Garbata", rate: 1.0, pitch: 1.02,
    stile: "calm, courteous and practical, like an Italian hotel housekeeper giving you good news. Clear and well articulated, never breathy, never sultry" },
  { id: "calda", nome: "Calda", rate: 0.96, pitch: 0.98,
    stile: "warm and friendly, a half-smile in the voice, unhurried but still clear and well articulated, like a colleague you trust. Never breathy, never sultry, never whispered" },
];
export function tonoDi(c) { return TONI.find(t => t.id === ((c && c.tono) || "")) || TONI[0]; }
export const STILE_BASE = TONI[0].stile;
export const CONF_BASE = { attiva: false, motore: "google", voce: "Autonoe", modello: "", tono: "chiara", stile: STILE_BASE, v: 4 };
const CHIAVE_LOCALE = "ricci_voce";
const MAX_CARATTERI = 420; // con la voce TTS: piu' corto = risponde prima. Il testo intero resta nella chat
const MAX_CARATTERI_LIVE = 700; // col canale Live si puo' leggere di piu': genera sette volte piu' svelto di quanto parla

export function leggiVoce() {
  let salvato = {};
  try { salvato = JSON.parse(localStorage.getItem(CHIAVE_LOCALE) || "{}") || {}; } catch (e) { salvato = {}; }
  const c = { ...CONF_BASE, ...salvato };
  // chi aveva gia' salvato la voce vecchia passa da solo a quella nuova
  if (salvato.v !== 4) { c.voce = CONF_BASE.voce; c.tono = CONF_BASE.tono; c.v = 4; }
  c.stile = tonoDi(c).stile; // lo stile segue sempre il tono scelto
  return c;
}
export function salvaVoce(patch) {
  const n = { ...leggiVoce(), ...patch };
  try { localStorage.setItem(CHIAVE_LOCALE, JSON.stringify(n)); } catch (e) {}
  return n;
}

// ---- il testo da leggere: via le faccine e le parentesi, non si leggono ----
function pulisciLettura(t) {
  return String(t || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/«|»|“|”/g, "")
    .replace(/\s*·\s*/g, ". ")
    .replace(/\s+/g, " ").trim();
}
export function daLeggere(t, max = MAX_CARATTERI) {
  const s = pulisciLettura(t);
  if (s.length <= max) return s;
  // non si taglia a meta' parola: si chiude all'ultimo punto utile
  const pezzo = s.slice(0, max);
  const fine = Math.max(pezzo.lastIndexOf(". "), pezzo.lastIndexOf("! "), pezzo.lastIndexOf("? "));
  return fine > 140 ? pezzo.slice(0, fine + 1) : pezzo;
}

// 0.99.3 (Michele: "quando parla il filmato e' troppo corto"): prima leggeva solo le prime 420-700 lettere e poi
// smetteva (voce e filmato) anche se la risposta era piu' lunga. Ora il testo si divide in PARTI (alla fine delle
// frasi) che si leggono una dopo l'altra; la parte dopo si prepara mentre lei legge quella prima, cosi' non ci sono buchi.
const MAX_TOTALE = 3200;   // circa tre minuti e mezzo: oltre, il resto si legge nella chat
export function partiDaLeggere(t, live = true) {
  const max = live ? MAX_CARATTERI_LIVE : MAX_CARATTERI;
  let s = pulisciLettura(t);
  if (s.length > MAX_TOTALE) { const p = s.slice(0, MAX_TOTALE); const k = Math.max(p.lastIndexOf(". "), p.lastIndexOf("! "), p.lastIndexOf("? ")); s = k > MAX_TOTALE / 2 ? p.slice(0, k + 1) : p; }
  if (!s) return [];
  const frasi = s.match(/[^.!?]+(?:[.!?]+["')\]]*|$)\s*/g) || [s];
  const parti = []; let cur = "";
  for (let f of frasi) {
    f = f.trim(); if (!f) continue;
    while (f.length > max) {                               // una frase lunghissima: si taglia a una virgola o a uno spazio
      let k = f.lastIndexOf(", ", max); if (k < max * 0.5) k = f.lastIndexOf(" ", max); if (k < 40) k = max;
      if (cur) { parti.push(cur); cur = ""; }
      parti.push(f.slice(0, k + 1).trim()); f = f.slice(k + 1).trim();
    }
    if (!f) continue;
    if (!cur) cur = f; else if ((cur + " " + f).length <= max) cur += " " + f; else { parti.push(cur); cur = f; }
  }
  if (cur) parti.push(cur);
  return parti;
}
// prepara l'audio di una parte (col canale Live) e lo mette nel cassetto: quando tocca a lei parte subito
export function preparaParte(testo, conf, chiave) {
  const c = conf || leggiVoce();
  if (!(c.motore === "google" && chiave && c.canale !== "tts")) return Promise.resolve(null);
  return audioDaLive(daLeggere(testo, MAX_CARATTERI_LIVE), c, chiave, { prepara: true }).catch(() => null);
}

// ---- il motore gratis: la voce del telefono --------------------------------
export function vociTelefono() {
  try { return (window.speechSynthesis?.getVoices() || []).filter(v => /^it/i.test(v.lang)); } catch (e) { return []; }
}
export function parlaTelefono(testo, { onFine, onInizio } = {}) {
  try {
    const sin = window.speechSynthesis; if (!sin) { onFine?.(); return null; }
    sin.cancel();
    const u = new SpeechSynthesisUtterance(testo);
    const to = tonoDi(leggiVoce());
    u.lang = "it-IT"; u.rate = to.rate; u.pitch = to.pitch;
    const it = vociTelefono(); if (it.length) u.voice = it.find(v => /female|donna|alice|elsa|federica/i.test(v.name)) || it[0];
    u.onstart = () => onInizio?.();
    u.onend = () => onFine?.(); u.onerror = () => onFine?.();
    sin.speak(u);
    return () => { try { sin.cancel(); } catch (e) {} };
  } catch (e) { onFine?.(); return null; }
}

// ---- il motore bello: la voce vera di Google -------------------------------
const CASSETTO = new Map(); // stesso testo = stesso audio: non si ripaga
export async function trovaModelloVoce(chiave) {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models", { headers: { "x-goog-api-key": chiave } });
  if (!r.ok) throw new Error("Non riesco a leggere l'elenco delle voci.");
  const j = await r.json();
  const tts = (j.models || []).map(m => String(m.name || "").replace(/^models\//, "")).filter(n => /-tts$/.test(n) && !/preview/.test(n));
  const num = n => { const m = String(n).match(/(\d+(?:\.\d+)?)/); return m ? Number(m[1]) : 0; };
  const lite = tts.filter(n => /lite/.test(n)).sort((a, b) => num(b) - num(a));
  if (lite.length) return lite[0];
  const alt = tts.sort((a, b) => num(b) - num(a));
  if (alt.length) return alt[0];
  const conPreview = (j.models || []).map(m => String(m.name || "").replace(/^models\//, "")).filter(n => /-tts/.test(n));
  if (conPreview.length) return conPreview.sort((a, b) => num(b) - num(a))[0];
  throw new Error("Questa chiave non ha nessuna voce.");
}
export async function audioDaGoogle(testo, conf, chiave) {
  const k = `${conf.modello}|${conf.voce}|${testo}`;
  if (CASSETTO.has(k)) return CASSETTO.get(k);
  const corpo = {
    model: conf.modello,
    input: [{ type: "user_input", content: [{ type: "text", text: testo, annotations: [{ type: "speech_metadata", style: conf.stile || STILE_BASE }] }] }],
    response_format: { type: "audio" },
    generation_config: { speech_config: [{ voice: conf.voce || "Sulafat" }] },
  };
  const stop = new AbortController(); const t = setTimeout(() => stop.abort(), 30000);
  let j, r;
  try {
    try {
      r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",
        { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": chiave }, body: JSON.stringify(corpo), signal: stop.signal });
    } catch (e) {
      // niente risposta del tutto: rete giù, oppure il telefono non lascia uscire la chiamata
      throw new Error(e && e.name === "AbortError" ? "La voce ci ha messo troppo." : "Non riesco a raggiungere il server della voce (rete o blocco del telefono).");
    }
    const txt = await r.text();
    try { j = JSON.parse(txt); } catch (e) { j = null; }
    if (!r.ok) {
      const m = (j && (j.error?.message || j.message)) || txt.slice(0, 160);
      if (r.status === 401 || r.status === 403) throw new Error("La chiave non vale per la voce. Controllala.");
      if (r.status === 404) throw new Error("Quel modello di voce non c'è più: tocca «Prova la voce» e lo ricerco.");
      if (r.status === 429) throw new Error("Hai finito le voci gratuite per adesso. Riprova tra un po'.");
      throw new Error(String(m).slice(0, 140));
    }
  } finally { clearTimeout(t); }
  const pezzi = [];
  for (const s of (j.steps || [])) if (s.type === "model_output") for (const c of (s.content || [])) if (c.type === "audio" && c.data) pezzi.push(c.data);
  const b64 = pezzi[pezzi.length - 1];
  if (!b64) throw new Error("Non è arrivato nessun audio.");
  const bin = atob(b64), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  if (CASSETTO.size > 40) CASSETTO.clear();
  CASSETTO.set(k, buf.buffer);
  return buf.buffer;
}

// ---- 0.67: la voce dal canale LIVE di Gemini ---------------------------------
// La voce "TTS" gratuita ha un tetto di DIECI frasi al giorno (letto in AI Studio,
// pagina "Rate limit", il 20/10/2026: 3 al minuto, 10 al giorno). Il canale Live,
// sempre gratis, non ha tetto giornaliero (solo 65 mila token al minuto) e parte
// prima: la prima voce arriva dopo circa un secondo e mezzo.
// Come si fa: si apre un collegamento, si manda il testo con l'ordine "leggilo
// parola per parola", si raccolgono i pezzi di audio (PCM 16 bit, 24 kHz) finche'
// il modello dice "ho finito di generare", si impacchettano come WAV e si suonano
// come prima: cosi' il labiale funziona uguale. Il modello ci restituisce anche la
// trascrizione di quello che ha letto: la usiamo per il labiale e per controllare
// che abbia letto davvero il nostro testo e non un'altra cosa.
const LIVE_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
export const LIVE_MODELLI = ["gemini-3.8-live", "gemini-3.1-flash-live-preview"];
let liveCaldo = null;    // un collegamento gia' aperto e pronto per la prossima frase
let liveInCorso = null;  // la frase che si sta generando adesso (per poterla fermare)

function istruzioneLettore(conf) {
  const stile = (conf && conf.stile) || STILE_BASE;
  return "You are a voice reader, not an assistant. Read aloud, in Italian, EXACTLY the text you receive, word for word: " +
    "do not answer it, do not comment, do not add or remove anything, do not translate. Numbers and times are read in Italian. " +
    "Voice style: " + stile + ".";
}
function wavDaPcm(pezzi, rate = 24000) {
  const n = pezzi.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(44 + n), dv = new DataView(out.buffer);
  const str = (o, x) => { for (let i = 0; i < x.length; i++) out[o + i] = x.charCodeAt(i); };
  str(0, "RIFF"); dv.setUint32(4, 36 + n, true); str(8, "WAVE"); str(12, "fmt "); dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); str(36, "data"); dv.setUint32(40, n, true);
  let o = 44; for (const p of pezzi) { out.set(p, o); o += p.length; }
  return out.buffer;
}
function apriLive(conf, chiave) {
  const ws = new WebSocket(LIVE_URL + "?key=" + encodeURIComponent(chiave));
  const L = { ws, usato: false, chiuso: false, annullato: false, voce: conf.voce, tono: conf.tono, nato: Date.now(), ascolta: null, modello: LIVE_MODELLI[0] };
  L.pronto = new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("La voce Live non risponde.")), 8000);
    ws.onopen = () => ws.send(JSON.stringify({ setup: {
      model: "models/" + L.modello,
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { languageCode: "it-IT", voiceConfig: { prebuiltVoiceConfig: { voiceName: conf.voce || CONF_BASE.voce } } } },
      systemInstruction: { parts: [{ text: istruzioneLettore(conf) }] },
      outputAudioTranscription: {},
    } }));
    ws.onmessage = async (ev) => {
      const txt = ev.data instanceof Blob ? await ev.data.text() : ev.data;
      let j; try { j = JSON.parse(txt); } catch (e) { return; }
      if (j.setupComplete) { clearTimeout(t); res(L); return; }
      if (j.error) { clearTimeout(t); rej(new Error(String(j.error.message || "errore della voce Live").slice(0, 140))); }
      if (L.ascolta) L.ascolta(j);
    };
    ws.onerror = () => { clearTimeout(t); rej(new Error("Non riesco ad aprire la voce Live (rete o chiave).")); };
    ws.onclose = (e) => {
      L.chiuso = true; clearTimeout(t);
      rej(new Error("Voce Live chiusa (" + e.code + ") " + String(e.reason || "").slice(0, 100)));
      if (L.ascolta) L.ascolta({ chiuso: true });
      if (liveCaldo === L) liveCaldo = null;
    };
  });
  L.pronto.catch(() => {});
  return L;
}
// Si apre il collegamento PRIMA che serva (quando si apre il microfono, quando parte
// la domanda all'IA): cosi' quando il testo e' pronto la voce parte subito.
export function scaldaLive(conf, chiave) {
  try {
    if (!chiave || !conf || !conf.attiva || conf.motore !== "google" || conf.canale === "tts") return;
    if (liveCaldo && !liveCaldo.chiuso && !liveCaldo.usato && liveCaldo.voce === conf.voce && liveCaldo.tono === conf.tono && Date.now() - liveCaldo.nato < 60000) return;
    // quello vecchio (o con un'altra voce) si chiude: non si lasciano collegamenti aperti a vuoto
    if (liveCaldo && !liveCaldo.usato) { try { liveCaldo.ws.close(); } catch (e) {} }
    liveCaldo = apriLive(conf, chiave);
  } catch (e) {}
}
function parole(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean); }
function quantoSimile(a, b) {
  const pa = parole(a), pb = new Set(parole(b)); if (!pa.length) return 1;
  let c = 0; for (const w of pa) if (pb.has(w)) c++;
  return c / pa.length;
}
export async function audioDaLive(testo, conf, chiave, { prepara = false } = {}) {
  const k = `live|${conf.voce}|${conf.tono}|${testo}`;
  if (CASSETTO.has(k)) return CASSETTO.get(k);
  let L = liveCaldo;
  if (!L || L.chiuso || L.usato || L.voce !== conf.voce || L.tono !== conf.tono) L = apriLive(conf, chiave);
  if (liveCaldo === L) liveCaldo = null;
  // 0.99.3: la parte preparata in anticipo NON e' "la voce in corso": se parte un'altra frase non si butta via
  L.usato = true; if (!prepara) liveInCorso = L;
  try { await L.pronto; } catch (e) { if (liveInCorso === L) liveInCorso = null; throw e; }
  const pezzi = []; let trascr = "";
  const r = await new Promise((res, rej) => {
    let finito = false;
    const pulisci = () => { clearTimeout(tMax); clearTimeout(tCoda); L.ascolta = null; try { L.ws.close(); } catch (e) {} if (liveInCorso === L) liveInCorso = null; };
    const fine = (motivo) => {
      if (finito) return; finito = true; pulisci();
      if (L.annullato) { const e = new Error("annullata"); e.annullata = true; rej(e); return; }
      if (!pezzi.length) { rej(new Error(motivo || "Dalla voce Live non e' arrivato audio.")); return; }
      res({ wav: wavDaPcm(pezzi), trascr: trascr.trim() });
    };
    const tMax = setTimeout(() => fine("La voce Live ci ha messo troppo."), 20000);
    let tCoda = null;
    L.ascolta = (j) => {
      if (j.chiuso) { fine("La voce Live si e' interrotta."); return; }
      const sc = j.serverContent; if (!sc) return;
      for (const p of (sc.modelTurn?.parts || [])) if (p.inlineData?.data) {
        const b = atob(p.inlineData.data), u = new Uint8Array(b.length);
        for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
        pezzi.push(u);
      }
      if (sc.outputTranscription?.text) trascr += sc.outputTranscription.text;
      // "generationComplete" arriva appena l'audio e' tutto generato (molto prima di
      // turnComplete, che il server manda solo a tempo scaduto): un attimo di attesa
      // per gli ultimi pezzi di trascrizione, poi si parte.
      if (sc.generationComplete && !tCoda) tCoda = setTimeout(() => fine(), 250);
      if (sc.turnComplete) fine();
    };
    try { L.ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: testo }] }], turnComplete: true } })); }
    catch (e) { fine("Non riesco a mandare il testo alla voce Live."); }
  });
  // se ha letto un'altra cosa (succede di rado: risponde invece di leggere), meglio la voce TTS
  if (r.trascr && quantoSimile(testo, r.trascr) < 0.5) { console.warn("voce live: letto altro", r.trascr.slice(0, 80)); throw new Error("La voce Live ha letto un'altra cosa."); }
  if (CASSETTO.size > 40) CASSETTO.clear();
  CASSETTO.set(k, r);
  return r;
}
// 0.67.1: la voce Live che PARTE SUBITO. Non si aspetta che l'audio sia tutto
// generato: il primo pezzo si suona appena arriva (circa un secondo) e gli altri si
// mettono in coda senza buchi. Il labiale segue un profilo "vivo" che cresce coi
// pezzi. Alla fine si restituisce anche il WAV intero, per il cassetto.
function pcmAFloat(u8) {
  const n = u8.length >> 1, out = new Float32Array(n), dv = new DataView(u8.buffer, u8.byteOffset, n * 2);
  for (let i = 0; i < n; i++) out[i] = dv.getInt16(i * 2, true) / 32768;
  return out;
}
export async function parlaLive(testo, conf, chiave, { onInizio, onBocca, onFine } = {}) {
  const ctx = sbloccaAudio(); if (!ctx) throw new Error("Qui l'audio non si apre.");
  stazitta();
  let L = liveCaldo;
  if (!L || L.chiuso || L.usato || L.voce !== conf.voce || L.tono !== conf.tono) L = apriLive(conf, chiave);
  if (liveCaldo === L) liveCaldo = null;
  L.usato = true; liveInCorso = L;
  try { await L.pronto; } catch (e) { if (liveInCorso === L) liveInCorso = null; throw e; }
  const RATE = 24000;
  const an = ctx.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = 0.45; an.connect(ctx.destination);
  const dati = new Uint8Array(an.fftSize);
  const prof = new ProfiloVivo(testo);
  const pezzi = [], fonti = [];
  let trascr = "", nextT = 0, t0 = 0, partito = false, generato = false, vivo = true;
  const ritardo = Math.min(0.25, Number(ctx.outputLatency) || 0);
  return new Promise((res) => {
    const spegni = () => {
      if (!vivo) return; vivo = false;
      clearTimeout(tMax); L.ascolta = null;
      try { L.ws.close(); } catch (e) {}
      if (liveInCorso === L) liveInCorso = null;
      tic.ferma();
      for (const f of fonti) { try { f.stop(); } catch (e) {} }
      try { an.disconnect(); } catch (e) {}
      if (fermaOra === ferma) fermaOra = null;
      onBocca?.(0, 0);
    };
    const finisci = () => { if (!vivo) return; spegni(); onFine?.(); res({ wav: wavDaPcm(pezzi), trascr: trascr.trim() }); };
    const fallisci = (msg) => { if (!vivo) return; spegni(); res({ errore: new Error(msg) }); };
    const ferma = () => { L.annullato = true; if (!vivo) return; spegni(); res({ annullata: true }); };
    const tMax = setTimeout(() => { if (!partito) fallisci("La voce Live ci ha messo troppo."); }, 12000);
    const giro = () => {
      if (!vivo) return;
      an.getByteTimeDomainData(dati);
      let s = 0; for (let i = 0; i < dati.length; i++) { const v = (dati[i] - 128) / 128; s += v * v; }
      const forza = Math.min(1, Math.sqrt(s / dati.length) * 3.4);
      onBocca?.(forza, Math.max(0, ctx.currentTime - t0 - ritardo));
      if (generato && ctx.currentTime >= nextT + 0.06) { finisci(); return; }
    };
    const tic = battito(giro);
    L.ascolta = (j) => {
      if (j.chiuso) { if (L.annullato) ferma(); else if (partito) { generato = true; prof.chiudi(); } else fallisci("La voce Live si e' interrotta."); return; }
      const sc = j.serverContent; if (!sc) return;
      for (const p of (sc.modelTurn?.parts || [])) if (p.inlineData?.data) {
        const b = atob(p.inlineData.data), u = new Uint8Array(b.length);
        for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
        pezzi.push(u);
        const f32 = pcmAFloat(u); if (!f32.length) continue;
        const ab = ctx.createBuffer(1, f32.length, RATE); ab.copyToChannel(f32, 0);
        if (!partito) {
          partito = true; t0 = ctx.currentTime + 0.18; nextT = t0;
          fermaOra = ferma;
          try { onInizio?.(prof, testo); } catch (e) { console.warn("onInizio", e); }
          tic.via();
        }
        const ora = ctx.currentTime;
        if (nextT < ora) { prof.silenzio(ora + 0.03 - nextT); nextT = ora + 0.03; } // la rete e' rimasta indietro: buco anche nel profilo
        const src = ctx.createBufferSource(); src.buffer = ab; src.connect(an); src.start(nextT); fonti.push(src); nextT += ab.duration;
        prof.aggiungi(f32, RATE);
      }
      if (sc.outputTranscription?.text) { trascr += sc.outputTranscription.text; prof.trascrizione(trascr); }
      if (sc.generationComplete || sc.turnComplete) { generato = true; prof.chiudi(); if (!partito) fallisci("Dalla voce Live non e' arrivato audio."); }
    };
    try { L.ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text: testo }] }], turnComplete: true } })); }
    catch (e) { fallisci("Non riesco a mandare il testo alla voce Live."); }
  });
}
// L'audio di una frase, pronto da suonare: prima il canale Live, poi la voce TTS.
export async function audioPronto(testo, conf, chiave) {
  if (conf.canale !== "tts") { try { return (await audioDaLive(testo, conf, chiave)).wav; } catch (e) { if (e && e.annullata) throw e; console.warn("voce live", e); } }
  if (!conf.modello) throw new Error("Manca il modello della voce.");
  return audioDaGoogle(testo, conf, chiave);
}

// ---- suonare l'audio e muovere la bocca sul suono vero ---------------------
let ctxAudio = null, fermaOra = null;
export function sbloccaAudio() {
  try {
    if (!ctxAudio) ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    if (ctxAudio.state === "suspended") ctxAudio.resume();
  } catch (e) {}
  return ctxAudio;
}
export function stazitta() {
  try { fermaOra?.(); } catch (e) {} fermaOra = null;
  try { window.speechSynthesis?.cancel(); } catch (e) {}
  try { if (liveInCorso) { liveInCorso.annullato = true; liveInCorso.ws.close(); liveInCorso = null; } } catch (e) {}
}
export function staParlando() { return !!fermaOra; }

// Suona il WAV e chiama onBocca(forza 0..1, secondi dall'inizio) a ogni fotogramma.
// 0.66: prima di partire chiama onInizio(audioDecodificato): e' li' che il labiale
// (bocca.js) legge tutto il suono e prepara il piano delle forme della bocca.
export async function suona(arrayBuffer, { onBocca, onFine, onInizio } = {}) {
  const ctx = sbloccaAudio(); if (!ctx) { onFine?.(); return; }
  const buf = await ctx.decodeAudioData(arrayBuffer.slice(0));
  stazitta();
  try { onInizio?.(buf); } catch (e) { console.warn("onInizio", e); }
  const src = ctx.createBufferSource(); src.buffer = buf;
  const an = ctx.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = 0.45;
  const dati = new Uint8Array(an.fftSize);
  src.connect(an); an.connect(ctx.destination);
  let vivo = true;
  // il tempo si misura sull'orologio dell'audio, non su quello dello schermo:
  // cosi' la bocca segue il suono anche se il telefono e' lento o va a scatti.
  const ritardo = Math.min(0.25, Number(ctx.outputLatency) || 0);
  let t0 = ctx.currentTime;
  const giro = () => {
    if (!vivo) return;
    an.getByteTimeDomainData(dati);
    let s = 0; for (let i = 0; i < dati.length; i++) { const v = (dati[i] - 128) / 128; s += v * v; }
    const forza = Math.min(1, Math.sqrt(s / dati.length) * 3.4);
    onBocca?.(forza, Math.max(0, ctx.currentTime - t0 - ritardo));
  };
  const tic = battito(giro);
  const chiudi = () => { if (!vivo) return; vivo = false; tic.ferma(); onBocca?.(0, buf.duration); fermaOra = null; onFine?.(); };
  src.onended = chiudi;
  fermaOra = () => { vivo = false; tic.ferma(); try { src.stop(); } catch (e) {} onBocca?.(0, 0); };
  t0 = ctx.currentTime;
  src.start(); tic.via();
}
// 0.68.3: il battito del labiale. requestAnimationFrame da solo NON basta: se la
// finestra e' coperta o il telefono risparmia, scende a 1-2 al secondo e la bocca
// resta ferma (visto dal vivo: 2 fotogrammi al secondo con la pagina "visibile").
// Si usa anche un timer a 25 ms; chi dei due arriva prima disegna, l'altro aspetta.
function battito(fn) {
  let vivo = false, ultimo = 0, raf = 0, iv = 0;
  const tick = () => { if (!vivo) return; const ora = performance.now(); if (ora - ultimo >= 12) { ultimo = ora; try { fn(); } catch (e) { console.warn("battito", e); } } };
  const loop = () => { if (!vivo) return; tick(); raf = requestAnimationFrame(loop); };
  return {
    via() { vivo = true; iv = setInterval(tick, 25); raf = requestAnimationFrame(loop); },
    ferma() { vivo = false; clearInterval(iv); cancelAnimationFrame(raf); },
  };
}

// La voce giusta, con la rete di sicurezza: Google, e se non va il telefono
export async function parla(testo, { conf, chiave, onBocca, onFine, onErrore, onInizio } = {}) {
  const c = conf || leggiVoce();
  const live = c.motore === "google" && !!chiave && c.canale !== "tts";
  const t = daLeggere(testo, live ? MAX_CARATTERI_LIVE : MAX_CARATTERI); if (!t) { onFine?.(); return; }
  if (c.motore === "google" && chiave) {
    // onInizio riceve anche il testo LETTO davvero (tagliato come fa daLeggere, o la
    // trascrizione del canale Live): e' quello che il labiale deve seguire.
    // 0.67: prima il canale Live (gratis, senza tetto giornaliero), poi la voce TTS
    // (gratis ma dieci al giorno), poi la voce del telefono.
    if (live) {
      const k = `live|${c.voce}|${c.tono}|${t}`;
      try {
        if (CASSETTO.has(k)) { const r = CASSETTO.get(k); await suona(r.wav, { onBocca, onFine, onInizio: (buf) => onInizio?.(buf, r.trascr || t) }); return; }
        const r = await parlaLive(t, c, chiave, { onInizio, onBocca, onFine });
        if (r.annullata) return;
        if (r.errore) throw r.errore;
        // nel cassetto solo se ha letto davvero il nostro testo
        if (r.wav && (!r.trascr || quantoSimile(t, r.trascr) >= 0.5)) { if (CASSETTO.size > 40) CASSETTO.clear(); CASSETTO.set(k, r); }
        else if (r.trascr) console.warn("voce live: letto altro", r.trascr.slice(0, 80));
        return;
      } catch (e) { if (e && e.annullata) { onFine?.(); return; } console.warn("voce live", e); }
    }
    if (c.modello) {
      const tt = daLeggere(t);
      try { const a = await audioDaGoogle(tt, c, chiave); await suona(a, { onBocca, onFine, onInizio: (buf) => onInizio?.(buf, tt) }); return; }
      catch (e) { console.warn("voce google", e); onErrore?.(e); }
    }
  }
  // ripiego: la voce del telefono (gratis, anche senza internet)
  // 0.66: anche qui il labiale segue il testo. Non c'e' un audio da leggere, quindi
  // la durata si stima dalle lettere (bocca.js) e il tempo parte quando il telefono
  // comincia davvero a parlare (onstart), con una rete se l'evento non arriva.
  const durata = stimaDurata(t, tonoDi(c).rate);
  let t0 = 0, vivo = true, tic = null;
  const parti = () => {
    if (!vivo || t0) return;
    t0 = performance.now();
    try { onInizio?.(null, t, durata); } catch (e) { console.warn("onInizio", e); }
    tic = setInterval(() => { if (!vivo) return; onBocca?.(0.7, (performance.now() - t0) / 1000); }, 33);
  };
  const chiudi = () => { if (!vivo) return; vivo = false; clearInterval(tic); onBocca?.(0, durata); fermaOra = null; onFine?.(); };
  fermaOra = () => { vivo = false; clearInterval(tic); onBocca?.(0, 0); try { window.speechSynthesis?.cancel(); } catch (e) {} };
  setTimeout(parti, 1500);
  parlaTelefono(t, { onInizio: parti, onFine: chiudi });
}
