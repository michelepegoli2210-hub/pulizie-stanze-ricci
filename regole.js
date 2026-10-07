// ============================================================================
//  REGOLE FISSE DELL'APP  ·  Le Stanze di Ricci
//  Questo file è il "dizionario" dell'app: camere, zone, regole delle pulizie,
//  cosa fare in ogni tipo di pulizia, prezzi di partenza e le regole con cui
//  si legge il foglio Excel di papà. Niente intelligenza artificiale: solo regole.
//
//  I proprietari possono cambiare prezzi e regole anche dall'app (Listino e
//  Impostazioni): quello che è salvato nell'app vince su questo file.
//  Questo file resta la base di partenza e il "ripristino" se serve.
// ============================================================================

// ---- Le zone (una signora per zona) ----------------------------------------
export const ZONE = {
  p1: { nome: "1° piano + Lella", breve: "1° piano", ordine: 1 },
  p2: { nome: "2° piano + Nicole", breve: "2° piano", ordine: 2 },
  ap: { nome: "Appartamenti", breve: "Appartamenti", ordine: 3 },
};

// ---- Le camere e le case ----------------------------------------------------
// tipo: "camera" (si pulisce mercoledì + venerdì) oppure "casa" (martedì + venerdì)
// lato: dove sta nella piantina. L = sinistra del corridoio, R = destra, S = via Nazario Sauro
// posti: letti disponibili (serve per il quadro, non per le pulizie)
export const CAMERE = [
  { id: "salvatore",   nome: "Salvatore",             zona: "p1", tipo: "camera", lato: "L", ordine: 1,  posti: 2 },
  { id: "aurora",      nome: "Aurora",                zona: "p1", tipo: "camera", lato: "R", ordine: 2,  posti: 2 },
  { id: "michele",     nome: "Michele",               zona: "p1", tipo: "camera", lato: "L", ordine: 3,  posti: 2 },
  { id: "antonio",     nome: "Antonio",               zona: "p1", tipo: "camera", lato: "R", ordine: 4,  posti: 2 },
  { id: "lella",       nome: "Lella",                 zona: "p1", tipo: "camera", lato: "S", ordine: 5,  posti: 1, via: "via Nazario Sauro" },
  { id: "alba",        nome: "Alba",                  zona: "p2", tipo: "camera", lato: "L", ordine: 6,  posti: 2 },
  { id: "tramonto",    nome: "Tramonto",              zona: "p2", tipo: "camera", lato: "R", ordine: 7,  posti: 2 },
  { id: "passerella",  nome: "Passerella",            zona: "p2", tipo: "camera", lato: "L", ordine: 8,  posti: 2 },
  { id: "fenicotteri", nome: "Fenicotteri",           zona: "p2", tipo: "camera", lato: "R", ordine: 9,  posti: 2 },
  { id: "nicole",      nome: "Nicole",                zona: "p2", tipo: "camera", lato: "S", ordine: 10, posti: 1, via: "via Nazario Sauro" },
  { id: "zarapt",      nome: "Via Zara · piano terra", zona: "ap", tipo: "casa", lato: "A", ordine: 11, posti: 4 },
  { id: "zara1",       nome: "Via Zara · 1° piano",   zona: "ap", tipo: "casa",   lato: "A", ordine: 12, posti: 4 },
  { id: "trento",      nome: "Via Trento 47",         zona: "ap", tipo: "casa",   lato: "A", ordine: 13, posti: 4 },
];

// Appoggio esterno: compare nel foglio di papà ma NON ha pulizie nostre.
export const APPOGGIO_ESTERNO = [
  { id: "liu",         nome: "Liù",          camere: 6 },
  { id: "mariagrazia", nome: "Maria Grazia", camere: 2 },
  { id: "ancona",      nome: "Via Ancona",   camere: 1 },
];

// ---- Quando si pulisce ------------------------------------------------------
// giorno: 0 = domenica, 1 = lunedì, 2 = martedì, 3 = mercoledì, 4 = giovedì, 5 = venerdì, 6 = sabato
export const REGOLE_BASE = {
  camera: [
    { giorno: 3, tipo: "ripasso" },      // mercoledì: ripasso veloce
    { giorno: 5, tipo: "totale" },       // venerdì: pulizia totale
  ],
  casa: [
    { giorno: 2, tipo: "casa" },         // martedì: pulizia casa
    { giorno: 5, tipo: "totale_casa" },  // venerdì: pulizia totale casa
  ],
  // Il giorno in cui l'ospite parte si fa comunque la pulizia totale
  // (così la camera è pronta per chi arriva). Mettere false per spegnere la regola.
  totaleAllaPartenza: true,
  // Le signore premono prima "Inizia la pulizia" e poi "Pulizia finita" (si vede quanto ci mettono)
  richiediInizio: true,
  // Quanti giorni avanti l'app prepara le pulizie, e quanti indietro le tiene aggiornate
  giorniAvanti: 14,
  giorniIndietro: 3,
  // La settimana di paga chiude il sabato alle 13:00 (ora di Lesina)
  chiusuraPaga: { giorno: 6, ora: 13 },
};

// ---- Cosa si fa in ogni tipo di pulizia ------------------------------------
// prezzo: quale voce del listino si usa
export const TIPI_PULIZIA = {
  ripasso: {
    titolo: "Ripasso veloce", breve: "RIP", prezzo: "ripasso",
    passi: ["Bagno veloce", "Spazzare", "Svuotare i cestini"],
  },
  totale: {
    titolo: "Pulizia totale", breve: "TOT", prezzo: "totale",
    passi: ["Cambio lenzuola", "Asciugamani (doppi per tecnici e operai)", "Bagno completo", "Pavimenti", "Cestini"],
  },
  casa: {
    titolo: "Pulizia casa", breve: "CASA", prezzo: "casa",
    passi: ["Bagno e cucina (padelle e piatti sporchi NON si lavano)", "Pavimenti", "Cestini e bidoni"],
  },
  totale_casa: {
    titolo: "Pulizia totale casa", breve: "TOT", prezzo: "totale_casa",
    passi: ["Cambio lenzuola", "Asciugamani doppi", "Bagno e cucina", "Pavimenti", "Cestini e bidoni"],
  },
  extra: {
    titolo: "Lavoro extra", breve: "EXTRA", prezzo: "extra",
    passi: [],
  },
};

// ---- Prezzi di partenza (si cambiano dal Listino nell'app) -----------------
// G = camera grande, P = camera piccola. taglia: quali camere sono piccole.
export const LISTINO_BASE = {
  totale:      { G: 15, P: 10 },   // pulizia totale (cambio completo): camera grande / piccola
  ripasso:     { G: 5, P: 5 },     // ripasso veloce del mercoledì: prezzo base
  casa:        15,                 // pulizia casa del martedì
  totale_casa: 15,                 // pulizia totale casa del venerdì
  extra:       0,                  // i lavori extra hanno il prezzo scritto a mano
  // Camere piccole (P). Tutte le altre sono grandi (G).
  taglia:      { michele: "P", aurora: "P", tramonto: "P", passerella: "P" },
};

// ---- Il voto delle pulizie (controlli tra colleghe) --------------------------
// Quando una collega "controllatrice" dà il voto a una camera, la paga di quella
// pulizia cambia così (percentuale del prezzo base). Si cambia dall'app (Regole).
export const VOTI_BASE = {
  ottimo:  { daVoto: 9, perc: 120, nome: "Voto 9–10" },              // es. 10 € → 12 €
  normale: { daVoto: 6, perc: 100, nome: "Voto 6–8" },
  scarso:  { daVoto: 5, perc: 80,  nome: "Voto 5" },                 // es. 10 € → 8 €
  pessimo: { daVoto: 0, perc: 50,  nome: "Voto 1–4", richiamo: true }, // es. 10 € → 5 € + richiamo
  bonusControllatrice: 5,   // € a settimana a chi fa i controlli, se i voti reggono al controllo di Michele
  scartoMassimo: 2,         // se il voto di Michele differisce di più di così, il controllo "non corrisponde"
  richiamoDopo: 3,          // al terzo controllo che non corrisponde, richiamo anche alla controllatrice
  penalitaRichiesta: 3,     // punti tolti al voto per ogni richiesta del giorno (dettagli) non fatta
};

// ---- Le persone che entrano nell'app (nome per entrare → chi è) ----------
// Il nome per entrare diventa un indirizzo: "michele" → michele@stanzericci.app
// ruolo: "proprietario" (fa tutto), "addetta" (solo la sua zona), "lettura" (guarda e basta)
export const PERSONE_BASE = [
  { login: "michele",         nome: "Michele",              ruolo: "proprietario" },
  { login: "papa",            nome: "Papà",                 ruolo: "proprietario" },
  { login: "mamma",           nome: "Mamma",                ruolo: "proprietario" },
  { login: "michelesantucci", nome: "Michele Santucci",     ruolo: "proprietario" },
  { login: "primopiano",      nome: "Signora 1° piano",     ruolo: "addetta", zona: "p1" },
  { login: "secondopiano",    nome: "Signora 2° piano",     ruolo: "addetta", zona: "p2" },
  { login: "appartamenti",    nome: "Signora appartamenti", ruolo: "addetta", zona: "ap" },
];

// ---- Calendario rifiuti di Lesina (utenza domestica) ------------------------
// Si espone la sera prima. giorno = giorno del RITIRO.
export const RIFIUTI = [
  { giorno: 1, cosa: "Umido" },
  { giorno: 2, cosa: "Plastica" },
  { giorno: 3, cosa: "Umido + indifferenziato" },
  { giorno: 4, cosa: "Carta" },
  { giorno: 5, cosa: "Vetro" },
  { giorno: 6, cosa: "Umido" },
];

// ---- Tipi di ospite (colori del tabellone) --------------------------------
export const TIPI_OSPITE = {
  ferr:  { nome: "Tecnici settimanali", colore: "var(--c-ferr)" },
  fond:  { nome: "Fondamenta",          colore: "var(--c-fond)" },
  dago:  { nome: "D'Agostino",          colore: "var(--c-dago)" },
  altro: { nome: "Altro ospite",        colore: "var(--c-altro)" },
  unk:   { nome: "Da chiarire (?)",     colore: "var(--c-unk)" },
};

// ---- Dizionario per leggere il foglio Excel di papà ------------------------
// Si usa nel Passo 5 (importazione). Le regole sono fisse: niente IA.
export const DIZIONARIO_EXCEL = {
  // Come riconoscere il tipo di ospite dal testo scritto nella cella (e il nome pulito da mostrare)
  tipi: [
    { contiene: ["fondam"],                                   tipo: "fond", nome: "Fondamenta" },
    { contiene: ["d'agostin", "dagostin", "d agostin", "agostin"], tipo: "dago", nome: "D'Agostino" },
  ],
  // Se nella cella c'è una di queste parole, quel giorno NON c'è nessuno (va in "Da controllare")
  negazioni: ["non viene", "non vengono", "non e venuto", "non è venuto", "non sono venuti", "disdett", "annullat", "cancellat"],
  // Parole che rendono una nota PRIVATA (non si mostra alle signore). I numeri di telefono sono privati sempre.
  parolePrivate: ["tel", "cell", "euro", "prezzo", "prezzi", "chiuso", "paga", "pagato", "pagano", "acconto", "contanti", "fattura", "malattia", "malato"],
  // Parole che fanno capire che il testo è un'ISTRUZIONE per le signore (si mostra a loro)
  paroleIstruzioni: ["cambiare", "cambia", "aggiungere", "aggiungi", "aggiunto", "lettino", "culla", "lenzuola", "asciugamani", "pulire", "rimettere", "mettere", "portare", "lavare", "togliere", "stanza piccola", "stanza grande"],
  // Parole da commento: se un testo le contiene è una nota di papà, non un nuovo ospite (resta privata)
  paroleCommento: ["partiti", "partito", "partita", "partite", "partono", "parte", "arrivano", "arrivati", "arrivato", "arriva", "circa", "alle", "ore", "stamattina", "stasera", "domani", "ieri", "telefonato", "chiamato", "avvisato", "detto"],
  // Dopo queste parole finisce il nome e comincia un commento (va nella nota privata)
  paroleStop: ["che", "stava", "stavano", "non", "per", "x", "segnato", "segnata", "nuovo", "nuova", "vedi", "forse"],
  // Testi che non sono nomi di ospiti
  nonNomi: ["libera", "libero", "vuota", "vuoto", "chiusa", "chiuso", "x", "-", "—", "?", "no", "si", "sì", "ok"],
};

// Come si chiamano le colonne nel foglio di papà (riga 2, oppure riga 1) → camera dell'app.
// Scritte in minuscolo, senza accenti e simboli: l'app confronta così.
export const COLONNE_EXCEL = {
  "salvatore": "salvatore", "aurora": "aurora", "michele": "michele", "antonio": "antonio",
  "alba": "alba", "tramonto": "tramonto", "passerella": "passerella", "fenicotteri": "fenicotteri",
  "lella": "lella", "nicole": "nicole",
  "via zara piano terra": "zarapt", "via zara pt": "zarapt", "zara piano terra": "zarapt", "zara pt": "zarapt",
  "via zara 1 piano": "zara1", "via zara 1piano": "zara1", "via zara primo piano": "zara1", "zara 1 piano": "zara1", "via zara 1": "zara1",
  "via trento 47": "trento", "via trento": "trento", "trento 47": "trento", "trento": "trento",
};

// ---- Dati di esempio per la modalità PROVA (senza Firebase) ----------------
// Servono solo per vedere l'app funzionare prima di collegare i dati veri.
export const SOGGIORNI_ESEMPIO = [
  // camera, inizio (ISO), fine = giorno di PARTENZA (quella notte non si conta), nome, tipo
  ["salvatore",   "2026-09-27", "2026-10-02", "Manna",             "ferr"],
  ["aurora",      "2026-09-28", "2026-10-02", "Palazzo",           "ferr"],
  ["michele",     "2026-09-27", "2026-10-02", "Pignatelli",        "ferr"],
  ["antonio",     "2026-09-27", "2026-10-02", "Rega Enzo",         "ferr"],
  ["lella",       "2026-09-28", "2026-10-02", "Rahhal",            "ferr"],
  ["alba",        "2026-10-01", "2026-11-01", "Fondamenta",        "fond"],
  ["tramonto",    "2026-10-01", "2026-11-01", "Fondamenta",        "fond"],
  ["passerella",  "2026-09-28", "2026-10-02", "Francesco",         "ferr"],
  ["fenicotteri", "2026-09-28", "2026-10-02", "Salerno",           "ferr"],
  ["nicole",      "2026-09-28", "2026-10-02", "Castaldi",          "ferr"],
  ["zarapt",      "2026-09-27", "2026-10-10", "Rega Ugo · 1 tecnico", "ferr"],
  ["zara1",       "2026-09-28", "2026-10-10", "D'Agostino · 1 operaio", "dago"],
  ["trento",      "2026-10-01", "2026-11-01", "Fondamenta",        "fond"],
  ["salvatore",   "2026-10-04", "2026-10-09", "Manna",             "ferr"],
  ["aurora",      "2026-10-05", "2026-10-09", "Palazzo",           "ferr"],
  ["michele",     "2026-10-04", "2026-10-09", "Pignatelli",        "ferr"],
  ["antonio",     "2026-10-04", "2026-10-09", "Rega Enzo",         "ferr"],
  ["lella",       "2026-10-05", "2026-10-09", "Rahhal",            "ferr"],
  ["passerella",  "2026-10-05", "2026-10-09", "Francesco",         "ferr"],
  ["fenicotteri", "2026-10-05", "2026-10-09", "Salerno",           "ferr"],
  ["nicole",      "2026-10-05", "2026-10-09", "?",                 "unk"],
];
