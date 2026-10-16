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
// tipo: "camera" oppure "casa". I giorni di pulizia vengono dal foglio "Calendario vero" (catalogo.js); REGOLE_BASE qui sotto
// vale per i posti che nel foglio hanno ancora una domanda aperta [CONTROLLA]
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
  { id: "zara1",       nome: "Via Zara · 1° e 2° piano", zona: "ap", tipo: "casa", lato: "A", ordine: 12, posti: 6, piani: 2 }, // un appartamento solo, su due piani (Michele, specifiche §12)
  { id: "trento",      nome: "Via Trento 47",         zona: "ap", tipo: "casa",   lato: "A", ordine: 14, posti: 4 },
];
// Posti che non esistono più: si tolgono dall'app anche se sono ancora scritti in impostazioni/camere, e i loro vecchi dati (registro,
// pulizie fatte) si leggono col nome di prima
export const CAMERE_TOLTE = { zara2: { nome: "Via Zara · 2° piano (ora unito al 1°)", unitaA: "zara1" } };

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
  // La settimana di paga chiude il sabato alle 14:00 (ora di Lesina)
  chiusuraPaga: { giorno: 6, ora: 14 },  // dalla 0.35: sabato alle 14 (fino ad allora si può rifare quello che il controllo ha bocciato)
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

// ---- Paga a ORE STANDARD (dalla 0.35, specifiche §14) ---------------------------------------------
// Michele: il lavoro normale si paga a ore, ma a ore STANDARD (i suoi tempi), non a cronometro: il venerdì al 1° piano
// vale 3 ore e un quarto sia che si finisca in 3 sia in 4. Tariffe: 8 € l'ora in albergo e in via Nazario Sauro (Lella e
// Nicole comprese, chiunque le faccia), 10 € l'ora negli appartamenti (Lucia ci va con la macchina e porta tutto).
// importo di una pulizia = minuti standard × tariffa / 60, arrotondato ai 50 centesimi. Niente prezzi "a pezzi" per le
// signore: vedono "4 camere · 3 ore e un quarto · 26 €". Michele cambia minuti e tariffe in Paghe → Orario di base.
export const LISTINO_BASE = {
  versione: 2,                                  // 1 = prezzi in euro (fino alla 0.34); 2 = minuti standard × tariffa
  tariffe: { albergo: 8, appartamenti: 10 },    // € l'ora
  minuti: {
    ripasso:     { G: 30, P: 30 },              // camera dell'albergo, ripasso: 4 camere = 2 ore (Selena il mercoledì)
    totale:      { G: 49, P: 45 },              // cambio completo: 4 camere ≈ 3 ore – 3 ore e un quarto (venerdì)
    casa:        60,                            // appartamento, ripasso: 1 ora
    totale_casa: 120,                           // appartamento, cambio completo: 2 ore
    fondo:       180,                           // pulizia a fondo completa a camera vuota: 3 ore (proposta dalla governante)
    extra:       0,                             // i lavori extra hanno i minuti scritti a mano
  },
  // minuti diversi per un posto preciso (i tempi veri di Michele, 14 ottobre)
  perCasa: {
    nicole: { totale: 90, ripasso: 40 },        // Nicole è grande (cucina non usata): un'ora e mezza il cambio
    lella:  { totale: 40, ripasso: 20 },        // Lella ha un letto solo
    zarapt: { totale_casa: 90, casa: 60 },      // via Zara piano terra: cambio un'ora e mezza
    zara1:  { totale_casa: 120, casa: 60 },     // via Zara 1° e 2° (due piani): cambio 2 ore (Lucia da sola), ripasso 1 ora
    trento: { totale_casa: 120, casa: 60 },     // via Trento è molto grande: cambio 2 ore, ripasso 1 ora
  },
  // Camere piccole (P). Tutte le altre sono grandi (G).
  taglia: { michele: "P", aurora: "P", tramonto: "P", passerella: "P" },
  // Lavori fissi della settimana, pagati a ore standard come il resto (giorno: 0 domenica … 6 sabato)
  fissi: [
    { id: "terrazzo_p1", zona: "p1", giorno: 5, luogo: "terrazzo", titolo: "Terrazzo", minuti: 30, tariffa: "albergo", passi: ["Terrazzo spazzato e lavato", "Tavoli, sedie e portacenere puliti", "Stendini e angoli in ordine"] },
    { id: "terrazzo_p2", zona: "p2", giorno: 6, luogo: "terrazzo", titolo: "Terrazzo", minuti: 30, tariffa: "albergo", passi: ["Terrazzo spazzato e lavato", "Tavoli, sedie e portacenere puliti", "Stendini e angoli in ordine"] },
    { id: "sabato_p2",   zona: "p2", giorno: 6, luogo: "scale",    titolo: "Scale, ingresso, corridoi e lavanderia", minuti: 180, tariffa: "albergo", passi: ["Scale e ringhiera: spazzate, lavate, spolverata la ringhiera", "Ingresso e portone: pavimento lavato, zerbino battuto, vetri del portone", "Corridoi del 1° e del 2° piano: spazzati e lavati", "Lavanderia in ordine: panni e prodotti al loro posto, cestini vuoti"] },
  ],
  // Le stelle (rifiniture del catalogo): prezzo per minuti, 10 € l'ora. Le fa solo la signora delle stelle (Selena, 2° piano),
  // in tutto l'albergo, per un obiettivo di € a settimana; negli appartamenti sono spente finché Michele non le accende.
  stelle: { fino5: 1, fino10: 1.5, oltre10: 2.5 },
  zonaStelle: "p2",
  obiettivoStelle: 27,                          // € a settimana (32 se Selena non fa controlli)
  stelleAppartamenti: false,
  // Cosa si paga: "standard" = i minuti standard qui sopra (chi finisce prima prende lo stesso) · "vero" = il tempo
  // misurato dal cronometro, da "Inizia" a "Fatto", pagato al minuto (8 € l'ora = 13,3 centesimi al minuto).
  // Si cambia in Paghe → Orario di base. Col cronometro valgono due reti di sicurezza:
  //  - TETTO: non si paga più del tempo standard + tolleranza (se una si dimentica di premere Fatto, non costa 3 ore);
  //  - TEMPO STRANO: sotto il 40% del tempo standard (o oltre il tetto) la pulizia finisce nella lista "tempi strani"
  //    in Paghe, perché Michele la guardi: si paga lo stesso, ma lui lo vede.
  pagaCol: "standard",
  tolleranzaCrono: 25,   // % in più del tempo standard che il cronometro può pagare
  sogliaStrano: 40,      // % del tempo standard sotto cui il tempo è "strano"
  // I controlli incrociati: € a camera controllata, e quanti controlli al giorno per chi controlla (giorno → numero)
  controllo: 2.5,
  controlli: { p1: { 5: 2, 6: 2 }, p2: { 5: 1, 6: 1 } },
};
// Fino alla 0.34: prezzi in euro a camera. Restano per leggere i vecchi documenti e per il confronto.
export const LISTINO_VECCHIO = { totale: { G: 15, P: 10 }, ripasso: { G: 5, P: 5 }, casa: 15, totale_casa: 15, extra: 0, fondo: 40 };

// ---- Il voto delle pulizie (controlli tra colleghe) --------------------------
// Quando una collega "controllatrice" dà il voto a una camera, la paga di quella
// pulizia cambia così (percentuale del prezzo base). Si cambia dall'app (Regole).
export const VOTI_BASE = {
  // Dalla 0.35 l'esito del controllo lo fa l'app contando i "no" della lista (vedi PUNTI_CONTROLLO in logica.js):
  // 0 punti = Bene (tutto pagato), 1–2 = Così così (quella camera −20%), 3 o più = Male (−50% e richiamo).
  esiti: {
    bene:     { perc: 100, nome: "Bene" },
    cosicosi: { perc: 80,  nome: "Così così" },
    male:     { perc: 50,  nome: "Male", richiamo: true },
  },
  sogliaCosicosi: 1, sogliaMale: 3,  // punti (i "no" gravi valgono 2)
  // (voti da 1 a 10 dei controlli fino alla 0.34: restano per leggere i vecchi controlli)
  ottimo:  { daVoto: 9, perc: 100, nome: "Voto 9–10" },
  normale: { daVoto: 6, perc: 100, nome: "Voto 6–8" },
  scarso:  { daVoto: 5, perc: 80,  nome: "Voto 5" },
  pessimo: { daVoto: 0, perc: 50,  nome: "Voto 1–4", richiamo: true },
  bonusControllatrice: 0,   // (fino alla 0.34: 5 € a settimana; ora si paga a camera controllata, LISTINO_BASE.controllo)
  scartoMassimo: 2,
  richiamoDopo: 3,          // alla terza smentita di Michele in un mese, i controlli di quella signora si fermano per un mese
  penalitaRichiesta: 3,
  terzoMale: 3,             // al terzo Male nel mese la chat lo chiede a Michele
};

// ---- Le signore (Michele, 15 ottobre: "di signore ce ne sono solo 2") ------------------------------------
// Le zone di lavoro sono due, una per signora, col suo nome. "Appartamenti" non è una persona: gli appartamenti
// li fa Lucia (col calendario vero). Si cambia tutto in Paghe → "Le signore": nome, attiva o no, e le camere
// che passano a una collaboratrice nuova (quelle camere diventano sue: lista, paga e controlli).
export const SQUADRA_BASE = {
  p1: { nome: "Lucia",  attiva: true,  camere: [] },  // 1° piano, Lella e gli appartamenti
  p2: { nome: "Selena", attiva: true,  camere: [] },  // 2° piano, Nicole, scale e ingresso
  ap: { nome: "",       attiva: false, camere: [] },  // non è una persona (resta per le vecchie paghe)
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

// ---- I tre modi della governante, legati all'OSPITE (non alla camera) -------
// Il modo decide i ritmi delle rifiniture e il budget delle stelle. Lo si imposta sul soggiorno (tre pulsanti grandi) o si eredita
// dal nome del cliente (impostazioni/clienti) o dal tipo di ospite: ferrovia = Tecnici, operai di via Zara = Operai, il resto = Booking.
export const MODI = {
  tecnici: { nome: "Tecnici", lungo: "Tecnici (stesse persone per mesi, camera vuota nel weekend)", breve: "Tecnici" },
  operai:  { nome: "Operai",  lungo: "Operai (soggiorni lunghi, cucinano ogni giorno)", breve: "Operai" },
  booking: { nome: "Booking", lungo: "Ospiti Booking / Airbnb / privati (soggiorni corti, scrivono recensioni)", breve: "Ospiti Booking" },
};
export const MODO_DA_TIPO = { ferr: "tecnici", fond: "tecnici", dago: "tecnici", altro: "booking", unk: "booking" }; // D'Agostino: tecnici in albergo, operai solo in via Zara 1° e 2° (vedi logica.modoCamera)
// Senza nessuno dentro: gli appartamenti di via Zara 1° e 2° sono degli operai, il resto dei tecnici (d'estate tutto Booking)
export const MODO_CAMERA_BASE = { zara1: "operai" };

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
  "via zara 1 piano": "zara1", "via zara 1piano": "zara1", "via zara primo piano": "zara1", "zara 1 piano": "zara1", "via zara 1": "zara1", "via zara 1 e 2 piano": "zara1", "via zara 1 e 2": "zara1",
  "via zara 2 piano": "zara1", "via zara 2piano": "zara1", "via zara secondo piano": "zara1", "zara 2 piano": "zara1", "via zara 2": "zara1",
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
  ["zara1",       "2026-09-28", "2026-10-17", "D'Agostino · 3 operai", "dago"],
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
