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
const MAX_CARATTERI = 600; // oltre, si taglia: non si paga un comizio

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
export function daLeggere(t) {
  return String(t || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/«|»|“|”/g, "")
    .replace(/\s*·\s*/g, ". ")
    .replace(/\s+/g, " ").trim().slice(0, MAX_CARATTERI);
}

// ---- il motore gratis: la voce del telefono --------------------------------
export function vociTelefono() {
  try { return (window.speechSynthesis?.getVoices() || []).filter(v => /^it/i.test(v.lang)); } catch (e) { return []; }
}
export function parlaTelefono(testo, { onFine } = {}) {
  try {
    const sin = window.speechSynthesis; if (!sin) { onFine?.(); return null; }
    sin.cancel();
    const u = new SpeechSynthesisUtterance(testo);
    const to = tonoDi(leggiVoce());
    u.lang = "it-IT"; u.rate = to.rate; u.pitch = to.pitch;
    const it = vociTelefono(); if (it.length) u.voice = it.find(v => /female|donna|alice|elsa|federica/i.test(v.name)) || it[0];
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

// ---- suonare l'audio e muovere la bocca sul suono vero ---------------------
let ctxAudio = null, fermaOra = null;
export function sbloccaAudio() {
  try {
    if (!ctxAudio) ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    if (ctxAudio.state === "suspended") ctxAudio.resume();
  } catch (e) {}
  return ctxAudio;
}
export function stazitta() { try { fermaOra?.(); } catch (e) {} fermaOra = null; try { window.speechSynthesis?.cancel(); } catch (e) {} }
export function staParlando() { return !!fermaOra; }

// Suona il WAV e chiama onBocca(0..1) a ogni fotogramma: è la bocca che si apre
export async function suona(arrayBuffer, { onBocca, onFine } = {}) {
  const ctx = sbloccaAudio(); if (!ctx) { onFine?.(); return; }
  const buf = await ctx.decodeAudioData(arrayBuffer.slice(0));
  stazitta();
  const src = ctx.createBufferSource(); src.buffer = buf;
  const an = ctx.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = 0.45;
  const dati = new Uint8Array(an.fftSize);
  src.connect(an); an.connect(ctx.destination);
  let vivo = true;
  const giro = () => {
    if (!vivo) return;
    an.getByteTimeDomainData(dati);
    let s = 0; for (let i = 0; i < dati.length; i++) { const v = (dati[i] - 128) / 128; s += v * v; }
    const forza = Math.min(1, Math.sqrt(s / dati.length) * 3.4);
    onBocca?.(forza);
    requestAnimationFrame(giro);
  };
  const chiudi = () => { if (!vivo) return; vivo = false; onBocca?.(0); fermaOra = null; onFine?.(); };
  src.onended = chiudi;
  fermaOra = () => { vivo = false; try { src.stop(); } catch (e) {} onBocca?.(0); };
  src.start(); requestAnimationFrame(giro);
}

// La voce giusta, con la rete di sicurezza: Google, e se non va il telefono
export async function parla(testo, { conf, chiave, onBocca, onFine, onErrore } = {}) {
  const t = daLeggere(testo); if (!t) { onFine?.(); return; }
  const c = conf || leggiVoce();
  if (c.motore === "google" && chiave && c.modello) {
    try { const a = await audioDaGoogle(t, c, chiave); await suona(a, { onBocca, onFine }); return; }
    catch (e) { console.warn("voce google", e); onErrore?.(e); }
  }
  // ripiego: la voce del telefono (gratis, anche senza internet)
  let finto = 0; const tic = setInterval(() => { finto = finto ? 0 : 0.75; onBocca?.(finto); }, 130);
  fermaOra = () => { clearInterval(tic); onBocca?.(0); try { window.speechSynthesis?.cancel(); } catch (e) {} };
  parlaTelefono(t, { onFine: () => { clearInterval(tic); onBocca?.(0); fermaOra = null; onFine?.(); } });
}
