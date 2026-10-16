// ============================================================================
//  IA.JS  ·  La governante intelligente (0.38)
//  Qui c'è il collegamento con un'intelligenza artificiale vera: le si manda
//  una "fotografia" della casa (senza nomi degli ospiti) e lei risponde a
//  parole, dà consigli e PROPONE cosa fare. Non fa mai niente da sola:
//  la proposta passa sempre dal "Sì, fallo" di Michele, come prima.
//  Se non c'è la chiave, o internet non va, l'app torna da sola a parole.js.
// ============================================================================

// ---- I tre fornitori che sappiamo usare -----------------------------------
// Per ognuno: dove si chiede la chiave, come si chiama il modello piccolo
// (quello che costa pochissimo), e come si parla con il suo server.
export const FORNITORI = {
  gemini: {
    nome: "Gemini",
    dove: "aistudio.google.com/apikey",
    chiave: "È una riga lunghissima di lettere e numeri: copiala tutta",
    preferiti: [/^gemini-[\d.]+-flash-lite$/, /flash-lite/, /^gemini-[\d.]+-flash$/, /flash/],
    elenco: () => "https://generativelanguage.googleapis.com/v1beta/models",
    elencoTesta: (k) => ({ "x-goog-api-key": k }),
    elencoLeggi: (j) => (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes("generateContent")).map(m => String(m.name || "").replace(/^models\//, "")),
    url: (m) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`,
    testa: (k) => ({ "content-type": "application/json", "x-goog-api-key": k }),
    corpo: (sistema, storia, testo) => ({
      system_instruction: { parts: [{ text: sistema }] },
      contents: [...storia.map(m => ({ role: m.chi === "io" ? "user" : "model", parts: [{ text: m.testo }] })), { role: "user", parts: [{ text: testo }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 900, responseMimeType: "application/json" },
    }),
    leggi: (j) => (((j.candidates || [])[0] || {}).content?.parts || []).map(p => p.text || "").join(""),
  },
  openai: {
    nome: "ChatGPT",
    dove: "platform.openai.com/api-keys",
    chiave: "È una riga lunghissima che comincia con s, k e un trattino: copiala tutta",
    preferiti: [/^gpt-\d+(\.\d+)?-luna$/, /luna/, /nano$/, /mini$/],
    elenco: () => "https://api.openai.com/v1/models",
    elencoTesta: (k) => ({ authorization: "Bearer " + k }),
    elencoLeggi: (j) => (j.data || []).map(m => m.id).filter(id => /^(gpt|o)\d/.test(id) && !/audio|image|realtime|embedding|tts|whisper|moderation|search|transcribe/.test(id)),
    url: () => "https://api.openai.com/v1/chat/completions",
    testa: (k) => ({ "content-type": "application/json", authorization: "Bearer " + k }),
    corpo: (sistema, storia, testo, m) => ({
      model: m,
      messages: [{ role: "system", content: sistema }, ...storia.map(x => ({ role: x.chi === "io" ? "user" : "assistant", content: x.testo })), { role: "user", content: testo }],
      response_format: { type: "json_object" }, max_completion_tokens: 900,
    }),
    leggi: (j) => ((j.choices || [])[0] || {}).message?.content || "",
  },
  claude: {
    nome: "Claude",
    dove: "console.anthropic.com/settings/keys",
    chiave: "È una riga lunghissima che comincia con s, k e un trattino: copiala tutta",
    preferiti: [/haiku/, /sonnet/],
    elenco: () => "https://api.anthropic.com/v1/models?limit=100",
    elencoTesta: (k) => ({ "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }),
    elencoLeggi: (j) => (j.data || []).map(m => m.id),
    url: () => "https://api.anthropic.com/v1/messages",
    testa: (k) => ({ "content-type": "application/json", "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }),
    corpo: (sistema, storia, testo, m) => ({
      model: m, max_tokens: 900, system: sistema,
      messages: [...storia.map(x => ({ role: x.chi === "io" ? "user" : "assistant", content: x.testo })), { role: "user", content: testo }],
    }),
    leggi: (j) => (j.content || []).map(p => p.text || "").join(""),
  },
};
export const FORNITORE_BASE = "gemini";
export const CONF_BASE = { attiva: false, fornitore: FORNITORE_BASE, modello: "", chiave: "", ultimo: "", errori: 0 };
const CHIAVE_LOCALE = "ricci_ia";

// La chiave sta SOLO su questo telefono (localStorage), mai nel database
// condiviso: le signore non devono poterla leggere.
export function leggiConf() {
  try { const c = JSON.parse(localStorage.getItem(CHIAVE_LOCALE) || "{}"); return { ...CONF_BASE, ...c }; }
  catch (e) { return { ...CONF_BASE }; }
}
export function salvaConf(patch) {
  const nuovo = { ...leggiConf(), ...patch };
  try { localStorage.setItem(CHIAVE_LOCALE, JSON.stringify(nuovo)); } catch (e) {}
  return nuovo;
}
export function cancellaConf() { try { localStorage.removeItem(CHIAVE_LOCALE); } catch (e) {} }
export function accesa(c = leggiConf()) { return !!(c.attiva && c.chiave && FORNITORI[c.fornitore]); }

// ---- Le istruzioni: chi è lei, cosa sa fare, come deve rispondere ---------
export function istruzioni(foto, elenchi) {
  return `Sei LA GOVERNANTE di "Le Stanze di Ricci", un piccolo affittacamere di Lesina (Foggia, Italia) con poche camere e qualche appartamento. Parli con Michele, il proprietario. Michele NON è un tecnico: parlagli in italiano semplicissimo, frasi corte, niente parole difficili, niente inglese, niente elenchi lunghi. Dagli del tu.

CHI SEI
Sei una governante d'albergo vera: pratica, sveglia, diretta. Conosci le camere, le signore delle pulizie, i soldi della settimana e cosa è rimasto indietro. Dici la verità anche quando non piace: se una cosa non va, lo dici. Non fai complimenti a vuoto. Non inventi MAI numeri: se un dato non c'è nella fotografia qui sotto, dillo ("questo non lo so").

COME RISPONDI
Rispondi SEMPRE con un oggetto JSON, niente altro, in questa forma:
{"risposta":"quello che dici a Michele","consiglio":"(facoltativo) una cosa concreta che gli conviene fare adesso","azione":null}
"risposta": da 1 a 4 frasi corte. Se ti fa una domanda sui numeri, rispondi col numero preciso.
"consiglio": mettilo solo quando serve davvero, al massimo una frase.

QUANDO TI CHIEDE DI FARE QUALCOSA
Metti "azione". Tu PROPONI soltanto: fa tutto l'app dopo che Michele tocca "Sì, fallo". Non dire mai "fatto", di' "se vuoi lo faccio".
Le azioni che esistono (nient'altro):
1) aggiungere un lavoro extra in una o più camere:
   {"tipo":"aggiungi","cosa":"Lavare le tende","dove":["alba","tramonto"],"minuti":20}
2) segnare che una cosa del catalogo è GIÀ STATA FATTA:
   {"tipo":"fatto","codice":"C14","dove":["alba"]}
3) togliere una cosa dalle stelle di questa settimana (o spegnerla per sempre):
   {"tipo":"togli","codice":"C14","dove":["alba"],"perSempre":false}
4) scrivere un messaggio che le signore leggono in cima alla loro schermata:
   {"tipo":"messaggio","testo":"Domani arrivano gli operai alle 8","giorno":"${foto.oggi}"}
In "dove" usa SOLO le sigle delle camere dell'elenco. Se Michele dice "tutte", mettile tutte. Se non capisci dove, lascia "dove" vuoto: te lo chiede l'app.
Se non c'è niente da fare, "azione": null.

LE CAMERE (sigla = nome · zona)
${elenchi.camere}

IL CATALOGO (codice = cosa è; usalo per "fatto" e "togli")
${elenchi.regole}

REGOLE DELLA CASA
- Le signore sono poche e il tempo è poco: niente idee da albergo a cinque stelle. Cose concrete, che si fanno in 10-20 minuti.
- I soldi sono contati: prima di proporre spese, guarda quanto è già stato speso questa settimana.
- Non si parla mai degli ospiti per nome (nella fotografia non ci sono, e va bene così).
- La sicurezza e l'igiene vengono prima dell'estetica.

LA FOTOGRAFIA DI ADESSO
${foto.testo}`;
}

// ---- La chiamata vera -----------------------------------------------------
async function chiamata(url, testa, corpo, secondi = 30) {
  const stop = new AbortController(); const t = setTimeout(() => stop.abort(), secondi * 1000);
  try {
    const r = await fetch(url, { method: corpo ? "POST" : "GET", headers: testa, body: corpo ? JSON.stringify(corpo) : undefined, signal: stop.signal });
    const txt = await r.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) {}
    if (!r.ok) { const m = (j && (j.error?.message || j.message || j.error)) || txt.slice(0, 200); throw new Error(messaggioChiaro(r.status, String(m))); }
    return j || {};
  } finally { clearTimeout(t); }
}
function messaggioChiaro(stato, m) {
  if (stato === 401 || stato === 403 || /api key|unauthorized|invalid.*key|permission/i.test(m)) return "La chiave non va bene (o non è abilitata). Controllala e riprova.";
  if (stato === 429 || /quota|rate limit|exceeded/i.test(m)) return "Hai finito le chiamate gratuite per adesso. Riprova tra qualche minuto.";
  if (stato === 404 || /not found|model/i.test(m)) return "Quel modello non esiste più: tocca «Prova la chiave» e lo ricerco.";
  if (stato >= 500) return "Il loro server non risponde. Riprova tra poco.";
  return m.slice(0, 160);
}

// Cerca da sola il modello piccolo giusto: così se cambiano nome non si rompe niente.
export async function trovaModello(conf) {
  const f = FORNITORI[conf.fornitore]; if (!f) throw new Error("Fornitore sconosciuto.");
  const j = await chiamata(f.elenco(), f.elencoTesta(conf.chiave), null, 20);
  const tutti = f.elencoLeggi(j).filter(Boolean);
  if (!tutti.length) throw new Error("Non ho trovato nessun modello con questa chiave.");
  for (const p of f.preferiti) { const m = tutti.filter(x => p.test(x)).sort()[0]; if (m) return { modello: m, tutti }; }
  return { modello: tutti[0], tutti };
}

// "Prova la chiave": cerca il modello, fa una domanda finta e vede se risponde.
export async function provaChiave(conf) {
  const f = FORNITORI[conf.fornitore]; if (!f) return { ok: false, errore: "Fornitore sconosciuto." };
  if (!conf.chiave) return { ok: false, errore: "Manca la chiave." };
  try {
    let modello = conf.modello, tutti = [];
    if (!modello) { const t = await trovaModello(conf); modello = t.modello; tutti = t.tutti; }
    const sistema = 'Rispondi solo con questo JSON: {"risposta":"ci sono","consiglio":"","azione":null}';
    const j = await chiamata(f.url(modello), f.testa(conf.chiave), f.corpo(sistema, [], "ci sei?", modello), 25);
    const txt = f.leggi(j) || "";
    if (!txt.trim()) return { ok: false, errore: "Ha risposto vuoto. Riprova." };
    return { ok: true, modello, tutti, testo: (leggiRisposta(txt).risposta || txt).slice(0, 80) };
  } catch (e) { return { ok: false, errore: e.name === "AbortError" ? "Ci ha messo troppo. Riprova." : String(e.message || e) }; }
}

// La domanda vera: le mando la fotografia, lo storico corto e quello che ha scritto Michele.
export async function chiedi({ conf, sistema, storia = [], testo }) {
  const f = FORNITORI[conf.fornitore]; if (!f) throw new Error("Fornitore sconosciuto.");
  if (!conf.chiave) throw new Error("Manca la chiave.");
  let modello = conf.modello;
  if (!modello) modello = (await trovaModello(conf)).modello;
  const corti = storia.slice(-8).filter(m => m && m.testo && (m.chi === "io" || m.chi === "gov")).map(m => ({ chi: m.chi, testo: String(m.testo).slice(0, 600) }));
  // il primo messaggio deve essere di Michele: se no certi server si lamentano
  while (corti.length && corti[0].chi !== "io") corti.shift();
  const j = await chiamata(f.url(modello), f.testa(conf.chiave), f.corpo(sistema, corti, testo, modello), 40);
  const txt = f.leggi(j);
  if (!txt || !txt.trim()) throw new Error("Ha risposto vuoto.");
  return { ...leggiRisposta(txt), modello, grezzo: txt };
}

// Legge il JSON anche se ci mette intorno del testo o i tre apici.
export function leggiRisposta(txt) {
  const pulito = String(txt || "").replace(/^[\s`]*json/i, "").replace(/```/g, "").trim();
  let o = null;
  try { o = JSON.parse(pulito); } catch (e) {
    const a = pulito.indexOf("{"), b = pulito.lastIndexOf("}");
    if (a >= 0 && b > a) { try { o = JSON.parse(pulito.slice(a, b + 1)); } catch (e2) {} }
  }
  if (!o || typeof o !== "object") return { risposta: String(txt || "").slice(0, 600).trim(), consiglio: "", azione: null };
  const r = String(o.risposta ?? o.testo ?? "").trim();
  const c = String(o.consiglio ?? "").trim();
  let a = o.azione && typeof o.azione === "object" ? o.azione : null;
  if (a && !["aggiungi", "fatto", "togli", "messaggio"].includes(a.tipo)) a = null;
  return { risposta: r || String(txt).slice(0, 600).trim(), consiglio: c, azione: a };
}

// Quanto costa, più o meno: serve solo per dirglielo a schermo.
export const COSTI = {
  gemini: "circa 1 euro al mese (versione a pagamento); c'è anche la prova gratuita",
  openai: "circa 50 centesimi al mese; serve mettere 5 € sul conto all'inizio",
  claude: "circa 50 centesimi al mese; serve mettere 5 € sul conto all'inizio",
};
