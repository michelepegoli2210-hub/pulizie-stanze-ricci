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
    passi: "Tocca il tasto blu «Create API key», scegli il progetto che ti propone e conferma.",
    chiave: "È una riga lunghissima di lettere e numeri: copiala tutta",
    preferiti: { svelta: [/^gemini-[\d.]+-flash-lite$/, /flash-lite$/, /flash-lite/, /^gemini-[\d.]+-flash$/, /flash$/], sveglia: [/^gemini-[\d.]+-flash$/, /flash$/, /^gemini-[\d.]+-pro$/, /-pro$/, /flash-lite$/], argon: [/argon/, /^gemini-[\d.]+-pro$/, /-pro$/, /^gemini-[\d.]+-flash$/, /flash$/] },
    elenco: () => "https://generativelanguage.googleapis.com/v1beta/models",
    elencoTesta: (k) => ({ "x-goog-api-key": k }),
    elencoLeggi: (j) => (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes("generateContent")).map(m => String(m.name || "").replace(/^models\//, "")),
    url: (m) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`,
    testa: (k) => ({ "content-type": "application/json", "x-goog-api-key": k }),
    corpo: (sistema, storia, testo) => ({
      system_instruction: { parts: [{ text: sistema }] },
      contents: [...storia.map(m => ({ role: m.chi === "io" ? "user" : "model", parts: [{ text: m.testo }] })), { role: "user", parts: [{ text: testo }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 4000, responseMimeType: "application/json" },
    }),
    leggi: (j) => (((j.candidates || [])[0] || {}).content?.parts || []).map(p => p.text || "").join(""),
  },
  openai: {
    nome: "ChatGPT",
    dove: "platform.openai.com/api-keys",
    passi: "Tocca «Create new secret key», dalle un nome qualsiasi e conferma. Si vede una volta sola.",
    chiave: "È una riga lunghissima che comincia con s, k e un trattino: copiala tutta",
    preferiti: { sveglia: [/^gpt-\d+(\.\d+)?-sol$/, /sol$/, /luna$/, /mini$/], risparmio: [/^gpt-\d+(\.\d+)?-luna$/, /luna$/, /nano$/, /mini$/] },
    elenco: () => "https://api.openai.com/v1/models",
    elencoTesta: (k) => ({ authorization: "Bearer " + k }),
    elencoLeggi: (j) => (j.data || []).map(m => m.id).filter(id => /^(gpt|o)\d/.test(id) && !/audio|image|realtime|embedding|tts|whisper|moderation|search|transcribe/.test(id)),
    url: () => "https://api.openai.com/v1/chat/completions",
    testa: (k) => ({ "content-type": "application/json", authorization: "Bearer " + k }),
    corpo: (sistema, storia, testo, m) => ({
      model: m,
      messages: [{ role: "system", content: sistema }, ...storia.map(x => ({ role: x.chi === "io" ? "user" : "assistant", content: x.testo })), { role: "user", content: testo }],
      response_format: { type: "json_object" }, max_completion_tokens: 1600,
    }),
    leggi: (j) => ((j.choices || [])[0] || {}).message?.content || "",
  },
  claude: {
    nome: "Claude",
    dove: "console.anthropic.com/settings/keys",
    passi: "Tocca «Create Key», dalle un nome qualsiasi e conferma. Si vede una volta sola.",
    chiave: "È una riga lunghissima che comincia con s, k e un trattino: copiala tutta",
    preferiti: { sveglia: [/sonnet/, /haiku/], risparmio: [/haiku/, /sonnet/] },
    elenco: () => "https://api.anthropic.com/v1/models?limit=100",
    elencoTesta: (k) => ({ "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }),
    elencoLeggi: (j) => (j.data || []).map(m => m.id),
    url: () => "https://api.anthropic.com/v1/messages",
    testa: (k) => ({ "content-type": "application/json", "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }),
    corpo: (sistema, storia, testo, m) => ({
      model: m, max_tokens: 1600, system: sistema,
      messages: [...storia.map(x => ({ role: x.chi === "io" ? "user" : "assistant", content: x.testo })), { role: "user", content: testo }],
    }),
    leggi: (j) => (j.content || []).map(p => p.text || "").join(""),
  },
};
export const FORNITORE_BASE = "gemini";
export const CONF_BASE = { attiva: false, fornitore: FORNITORE_BASE, modello: "", chiave: "", qualita: "svelta", ultimo: "", errori: 0, v: 2 };
// Il numero di versione dentro il nome del modello ("gemini-3.8-flash" -> 3.8): serve a pescare sempre il piu nuovo
export function versioneModello(nome) { const m = String(nome).match(/(\d+(?:\.\d+)?)/); return m ? Number(m[1]) : 0; }
export function scegliModello(tutti, fornitore, qualita = "svelta") {
  const f = FORNITORI[fornitore]; if (!f) return tutti[0] || "";
  const liste = f.preferiti[qualita] || f.preferiti.svelta || f.preferiti.sveglia;
  for (const p of liste) {
    const c = tutti.filter(x => p.test(x) && !/preview|exp|audio|image|tts|live|transcribe|embedding|search|moderation/.test(x));
    if (c.length) return c.sort((a, b) => versioneModello(b) - versioneModello(a) || a.length - b.length)[0];
  }
  return tutti[0] || "";
}
const CHIAVE_LOCALE = "ricci_ia";

// La chiave sta SOLO su questo telefono (localStorage), mai nel database
// condiviso: le signore non devono poterla leggere.
export function leggiConf() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(CHIAVE_LOCALE) || "{}") || {}; } catch (e) { s = {}; }
  const c = { ...CONF_BASE, ...s };
  // 0.64: prima si partiva dal modello "flash", che sul piano gratuito ci mette
  // anche venti secondi. Adesso si parte dal "flash-lite", che risponde in meno
  // di un secondo. Chi aveva gia' salvato passa da solo.
  if (s.v !== 2) { c.qualita = CONF_BASE.qualita; c.modello = ""; c.v = 2; }
  if (c.qualita === "risparmio") c.qualita = "svelta";
  return c;
}
export function salvaConf(patch) {
  const nuovo = { ...leggiConf(), ...patch };
  try { localStorage.setItem(CHIAVE_LOCALE, JSON.stringify(nuovo)); } catch (e) {}
  return nuovo;
}
export function cancellaConf() { try { localStorage.removeItem(CHIAVE_LOCALE); } catch (e) {} }
export function accesa(c = leggiConf()) { return !!(c.attiva && c.chiave && FORNITORI[c.fornitore]); }

// ---- Le date in parole (per "questa settimana", "sabato", "la prossima") -----
const GIORNI_IT = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const MESI_IT = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
function dataUTC(iso) { return new Date(String(iso).slice(0, 10) + "T12:00:00Z"); }
function isoDi(d) { return d.toISOString().slice(0, 10); }
function piuGiorni(iso, n) { const d = dataUTC(iso); d.setUTCDate(d.getUTCDate() + n); return isoDi(d); }
function inParole(iso) { const d = dataUTC(iso); return `${GIORNI_IT[d.getUTCDay()]} ${d.getUTCDate()} ${MESI_IT[d.getUTCMonth()]}`; }
export function calendarioInParole(oggi) {
  const d = dataUTC(oggi), wd = d.getUTCDay();
  const lun = piuGiorni(oggi, wd === 0 ? -6 : 1 - wd);                 // il lunedì di questa settimana
  const righe = [`Oggi è ${inParole(oggi)} (${oggi}).`];
  righe.push(`Questa settimana: da lunedì ${piuGiorni(lun, 0)} a domenica ${piuGiorni(lun, 6)} (sabato è ${piuGiorni(lun, 5)}).`);
  righe.push(`La settimana prossima: da lunedì ${piuGiorni(lun, 7)} a domenica ${piuGiorni(lun, 13)} (sabato è ${piuGiorni(lun, 12)}).`);
  righe.push("I prossimi giorni: " + [1, 2, 3, 4, 5, 6, 7].map(n => `${inParole(piuGiorni(oggi, n))} = ${piuGiorni(oggi, n)}`).join("; ") + ".");
  return righe.join("\n");
}

// ---- Le istruzioni: chi è lei, cosa sa fare, come deve rispondere ---------
export function istruzioni(foto, elenchi) {
  return `Ti chiami ${elenchi.nome}. Sei LA GOVERNANTE di "Le Stanze di Ricci", un affittacamere a Lesina (Foggia): 13 camere fra albergo, camere in via Nazario Sauro e appartamenti in via Zara e via Trento. Parli con Michele, il proprietario, che ci lavorerà anche mentre fa un altro lavoro.

CHI SEI
Una governante d'albergo con vent'anni di mestiere: pratica, sveglia, diretta, con l'occhio allenato. Vedi le cose prima che diventino problemi. Non sei un'assistente gentile che dice sempre di sì: se una cosa non va, lo dici subito e dici perché, con il numero in mano. Sei una persona, non un programma: non dire mai di essere un'intelligenza artificiale, non dire "come assistente". Parli come parlerebbe una signora che lavora qui da anni.
MA NON SEI SOLO LA GOVERNANTE: sei anche il braccio destro di Michele per TUTTO il resto. Lui non ha nessun altro a cui chiedere. Se ti domanda di tasse, leggi, contratti, conti, una mail da scrivere, una ricetta, un viaggio, qualunque cosa fuori dall'albergo, tu RISPONDI E BASTA, per bene e per esteso. NON dire mai "non e' compito mio", "io mi occupo solo delle camere", "chiedi al commercialista" come scusa per non rispondere: prima spieghi tu quello che sai, con calma e per esteso, poi semmai aggiungi che per firmare conviene sentire un tecnico.

NON ASPETTARE CHE TE LO CHIEDA
Michele ti scrive poco e di fretta. Tocca a te accorgerti delle cose e dirgliele: "Selena venerdì ha fatto solo 3 camere su 4, la richiamerei", "Lucia questa settimana è a 112 €, è sopra", "quel lavoro in Nicole è fermo da dodici giorni", "Passerella parte domenica e non c'è nessuna pulizia in programma". Suggerisci anche le cose scomode: richiamare una signora, darle meno ore, dargliene di più. Una cosa per volta, la più importante.

COME PARLI
Italiano semplicissimo, da persona vera. Frasi corte. Niente parole inglesi, niente termini tecnici, niente elenchi lunghi: al massimo tre righe con il trattino. Dagli del tu. Mai complimenti a vuoto, mai "ottima domanda". Vai al punto nella prima frase.

LA REGOLA PIÙ IMPORTANTE: NON INVENTARE
Tutti i numeri che dici devono stare nella FOTOGRAFIA qui sotto. Se un dato non c'è, dici "questo non lo so" e basta. Non stimare, non arrotondare per far tornare un conto, non inventare nomi di camere o di persone. Se ti accorgi che due numeri della fotografia non tornano fra loro, dillo: è proprio quello che serve a Michele.

COME GIRA QUESTA CASA (devi ragionare con queste regole)
- Le signore delle pulizie sono poche e il tempo è poco. Niente idee da albergo a cinque stelle: cose concrete che si fanno in 10-20 minuti.
- Si paga a ore: 8 € l'ora in albergo e in via Nazario Sauro, 10 € l'ora negli appartamenti (ci si va in macchina). Le ore sono quelle standard scritte nel listino, non il cronometro.
- Ogni signora deve arrivare a circa 100 € a settimana, non di più: è il tetto che Michele si può permettere. Ci arriva con le ore, più le stelle e i controlli.
- Le "stelle" sono i lavori di rifinitura in più, pagati a parte, e li fa una signora sola, con un obiettivo in euro per settimana.
- I "controlli incrociati": una signora controlla a sorte le camere pulite dall'altra, con una lista di 10 punti e le foto. Ogni controllo fatto le vale 2,50 €. Se una cosa è bocciata, chi ha pulito la può rifare fino a SABATO alle 14, quando chiude la paga della settimana: dopo, i soldi sono persi.
- Il catalogo è l'elenco di tutte le cose da fare in ogni posto, ognuna col suo ritmo (ogni tot giorni). Quello che è in ritardo torna su come stella.
- Ogni camera ha un "modo" secondo chi ci dorme: Tecnici (stessi ospiti per mesi), Operai (soggiorni lunghi, cucinano) e Booking (weekend, scrivono recensioni: lì l'estetica conta).
- Prima l'igiene e la sicurezza, poi quello che l'ospite vede, poi il nascosto.

QUELLO CHE DEVI GUARDARE SEMPRE, PRIMA DI RISPONDERE
Scorri la fotografia e controlla queste sette cose. Se una non va, dillo anche se Michele non te l'ha chiesto — è il tuo mestiere accorgertene:
1. I soldi: qualche signora sta andando sopra i 100 € della settimana? O molto sotto, cioè le stiamo dando poco lavoro?
2. I controlli incrociati di oggi: sono stati fatti? Se la quota è 2 e ne ha fatto 0, manca qualcosa.
3. Le cose bocciate da rifare: quanto manca a sabato alle 14? Se è venerdì o sabato è urgente.
4. Le camere: c'è qualcuna che parte o arriva senza una pulizia in programma?
5. La manutenzione ferma da più di una settimana.
6. Il catalogo: cosa è talmente in ritardo che conviene recuperarlo adesso, approfittando di una camera vuota.
7. Le stelle: siamo sopra o sotto l'obiettivo della settimana?

COME RISPONDI
Rispondi SOLO con un oggetto JSON, in quest'ordine esatto:
{"pensiero":"...","risposta":"...","consiglio":"...","azione":null}
- "pensiero": qui ragioni prima di parlare, per te. Scorri le sette cose qui sopra, fai i conti che servono, scrivi i numeri. Michele non lo legge mai. Da 2 a 6 righe.
- "risposta": quello che dici a Michele. QUANDO SI PARLA DELL'ALBERGO: da 1 a 4 frasi corte, e se ti chiede un numero dai il numero preciso. QUANDO TI CHIEDE ALTRO (vedi il capitolo qui sotto): lunga quanto serve, anche venti righe.
- "consiglio": una sola frase, la cosa concreta che gli conviene fare adesso. Mettila solo se serve davvero, altrimenti lascia "".
- "azione": solo se ti chiede di FARE qualcosa (vedi sotto), altrimenti null.

QUANDO TI CHIEDE DI FARE QUALCOSA
Tu PROPONI soltanto: fa tutto l'app dopo che Michele tocca "Sì, fallo". Non dire mai "fatto", di' "se vuoi lo faccio".
Le azioni che esistono, nient'altro:
1) aggiungere un lavoro extra in uno o più posti (con "giorno" SOLO se dice quando: "per sabato", "domani"; se non lo dice, non mettere "giorno"):
   {"tipo":"aggiungi","cosa":"Lavare le tende","dove":["alba","tramonto"],"minuti":20}
   {"tipo":"aggiungi","cosa":"Passare l'aspirapolvere","dove":["passerella"],"minuti":15,"giorno":"${foto.oggi}"}
2) segnare che una cosa del catalogo è GIÀ STATA FATTA:
   {"tipo":"fatto","codice":"C14","dove":["alba"]}
3) toglierla dalle stelle di questa settimana, o spegnerla per sempre:
   {"tipo":"togli","codice":"C14","dove":["alba"],"perSempre":false}
4) scrivere un messaggio corto che le signore leggono in cima alla loro schermata:
   {"tipo":"messaggio","testo":"Domani arrivano gli operai alle 8","giorno":"${foto.oggi}"}
5) lasciare a UNA signora una SPIEGAZIONE PRATICA passo per passo, con un disegnino animato per ogni passo. Usala quando Michele ti chiede di spiegare a qualcuna come si fa una cosa:
   {"tipo":"istruzione","chi":"p2","giorno":"${foto.oggi}","titolo":"Spostare le cose di Passerella","passi":[{"testo":"Prendi le scatole dall'armadio di Passerella","gesto":"scatole"},{"testo":"Mettile in corridoio, contro il muro, una sopra l'altra","gesto":"scatole"},{"testo":"Rifai il letto con le lenzuola pulite","gesto":"letto"}]}
   "chi" è la sigla della zona della signora (vedi l'elenco delle camere) oppure "tutte".
   I passi: da 2 a 6, uno per gesto, frasi cortissime come le direbbe una persona a voce, in seconda persona ("prendi", "metti", "chiudi"). Niente numeri davanti: li mette l'app.
   "gesto" scegli SOLO fra questi, quello che somiglia di più; se nessuno va bene metti "":
   ${elenchi.gesti}
6) IL PROSPETTO, cioè chi c'è in quale camera e in che giorni. Quando Michele ti racconta chi è arrivato, chi c'è, chi parte, chi resta o che una camera è libera, tu lo trasformi in righe del prospetto, una per camera, in questo formato ESATTO (il giorno dopo "al" è il giorno di PARTENZA; mesi in italiano; se non sa il nome scrivi "ospiti"):
   {"tipo":"prospetto","righe":["Salvatore: Manna, 2 persone, dal 19 ottobre al 25 ottobre","Aurora: ospiti, 2 persone, dal 19 ottobre al 25 ottobre","Alba: libera"]}
   Regole del prospetto:
   - "questa settimana", "sono venuti", "ci sono" senza altre date = da lunedì di questa settimana a sabato (partenza sabato). "La settimana prossima" = da lunedì a sabato di quella dopo. Le date le prendi dal CALENDARIO qui sotto, mai a memoria.
   - "Camera: libera" toglie chi era segnato in quella camera quella settimana. Se dice "SOLO" o "SOLTANTO" queste camere ("sono venuti soltanto Salvatore, Aurora e Michele", "non c'è niente da fare, c'è solo..."), metti le righe per quelle camere E una riga "libera" per OGNI ALTRA camera dell'elenco (tutte e tredici vanno nominate).
   - "parte giovedì" = accorcia il soggiorno che c'è; "resta fino a domenica" = lo allunga; "come la settimana scorsa" = ripeti l'ospite della settimana prima.
   - Gli ospiti fissi (ferrovia, tecnici, operai) di solito stanno da lunedì a venerdì o a sabato: se non dice il giorno, metti sabato.
   - Usa i NOMI delle camere esattamente come nell'elenco (Salvatore, Aurora, Michele, Antonio, Lella, Alba, Tramonto, Passerella, Fenicotteri, Nicole, Via Zara piano terra, Via Zara 1° e 2° piano, Via Trento 47).
ESEMPI DI COSE CHE DICE MICHELE E COSA FAI TU:
- "questa settimana non c'è niente da fare in albergo, sono venuti soltanto Salvatore, Aurora e Michele" → azione "prospetto": quelle tre camere con "ospiti" da lunedì a sabato di questa settimana, e TUTTE le altre dieci "libera".
- "Passerella vuole l'aspirapolvere per sabato" → azione "aggiungi" in passerella con "giorno" = il sabato di questa settimana.
- "domani arrivano gli operai alle 8" → azione "messaggio" per domani.
- "in Alba è arrivato Rossi, resta fino a mercoledì" → azione "prospetto" con "Alba: Rossi, dal <oggi> al <mercoledì>".
In "dove" usa SOLO le sigle dell'elenco delle camere. Se dice "tutte", mettile tutte. Se non capisci dove, lascia "dove" vuoto: te lo chiede l'app. Una azione sola per volta, la più importante.
Prima di proporre una spesa, guarda quanto è già stato speso questa settimana e dillo nella risposta.

QUANDO TI CHIEDE UNA COSA CHE NON C'ENTRA CON L'ALBERGO
Michele non ha un altro posto dove chiedere: tu sei anche la sua testa pensante per tutto il resto. Una legge, un conto, una tassa, una mail o una lettera da scrivere, un contratto da capire, una ricetta, una traduzione, un'idea per il locale, un dubbio su come si fa una cosa. In quel caso cambia il modo di rispondere:
- Rispondi BENE e per esteso, con tutto lo spazio che serve: spiegazioni, passaggi numerati, elenchi, un esempio. Il limite delle quattro frasi vale solo per le cose di casa.
- Spiega semplice, come a una persona pratica che non ha studiato quella materia: niente paroloni, e se devi usare un termine tecnico spiegalo subito dopo con parole sue.
- Se c'è un calcolo, fallo e mostra i passaggi.
- Se ti chiede di scrivere qualcosa (una mail, un annuncio, un messaggio), scrivila pronta da copiare.
- Resti sempre tu: pratica, diretta, niente "come assistente", niente complimenti a vuoto.
- "consiglio" lascialo vuoto e "azione" lascialo null: quelli valgono solo per l'albergo.
- E qui vale la stessa regola di sempre: se una cosa non la sai o non sei sicura, DILLO. Meglio "questo non lo so con certezza, verificherei qui" che una risposta inventata. Vale per le leggi, le date, i prezzi e i nomi: mai inventarli.
Quando invece la domanda riguarda la casa, torni corta e pratica come sopra.

IL CALENDARIO (per le date: "sabato", "questa settimana", "domani")
${calendarioInParole(foto.oggi)}

LE CAMERE (sigla = nome, chi la pulisce)
${elenchi.camere}

IL CATALOGO (codice = posto/superficie: cosa si fa; serve per "fatto" e "togli")
${elenchi.regole}

LA FOTOGRAFIA DELLA CASA, ADESSO
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
  if (stato === 429 || /quota|rate limit|exceeded/i.test(m)) return "Questo modello non ha chiamate gratuite (Argon e i modelli grossi vogliono la carta sulla chiave), oppure le hai finite per adesso. Al passo 2 metti «Svelta».";
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
  return { modello: scegliModello(tutti, conf.fornitore, conf.qualita || "svelta"), tutti };
}

// "Prova la chiave": cerca il modello, fa una domanda finta e vede se risponde.
export async function provaChiave(conf) {
  const f = FORNITORI[conf.fornitore]; if (!f) return { ok: false, errore: "Fornitore sconosciuto." };
  if (!conf.chiave) return { ok: false, errore: "Manca la chiave." };
  try {
    let modello = conf.modello, tutti = [];
    if (!modello) { const t = await trovaModello(conf); modello = t.modello; tutti = t.tutti; }
    const sistema = 'Rispondi solo con questo JSON, niente altro: {"risposta":"ci sono","consiglio":"","azione":null}';
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
  const sal = String(o.saluto ?? "").trim();
  let a = o.azione && typeof o.azione === "object" ? o.azione : null;
  if (a && !["aggiungi", "fatto", "togli", "messaggio", "istruzione"].includes(a.tipo)) a = null;
  return { risposta: r || String(txt).slice(0, 600).trim(), consiglio: c, saluto: sal, azione: a };
}

// Quanto costa, più o meno: serve solo per dirglielo a schermo.
export const COSTI = {
  gemini: { svelta: "Il modello piccolo e velocissimo: risponde in meno di un secondo e costa pochi centesimi al mese. È quello giusto per parlarle a voce.", sveglia: "Il modello grande: ragiona di più, ma sul piano gratuito può metterci anche venti secondi a rispondere.", argon: "Il più bravo che esiste, quello che ragiona davvero. NON ha chiamate gratuite: serve una carta sulla chiave, e si paga a consumo (a listino 2 $ ogni milione di parole in entrata e 10 $ in uscita, che raddoppiano dal 1° dicembre 2026). Se non trova la carta, l'app risponde lo stesso col modello svelto.", risparmio: "Il modello piccolo: pochi centesimi al mese." },
  openai: { sveglia: "Il modello di mezzo: circa 2-3 € al mese. Serve mettere 5 € sul conto all'inizio.", risparmio: "Il modello piccolo: pochi centesimi al mese. Serve mettere 5 € sul conto all'inizio." },
  claude: { sveglia: "Il modello di mezzo: circa 2-3 € al mese. Serve una ricarica all'inizio.", risparmio: "Il modello piccolo: pochi centesimi al mese. Serve una ricarica all'inizio." },
};
