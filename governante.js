// ============================================================================
//  LA GOVERNANTE  ·  il catalogo + la testa (niente schermate qui dentro)
//  Come una governante di un hotel di lusso: guarda il prospetto (chi parte, chi arriva, quando una
//  camera è libera), il calendario e il registro "ultima volta fatto", e aggiunge alle pulizie normali
//  le RIFINITURE: 1 o 2 cose da 5-10 minuti per volta, scelte tra le più in ritardo per quella camera.
//  Così ogni camera fa il giro completo del catalogo in 6-8 settimane senza mai un blocco di ore.
//  Le poche cose "a camera libera" (materasso, letto spostato, dietro i mobili, tende, armadi) le
//  programma a parte, nei weekend o tra una partenza e un arrivo. Funziona al 100% senza IA.
//
//  IL CATALOGO: una riga per ogni singola cosa.
//    id        nome corto, unico
//    gruppo    camera · bagno · cucina · balcone · comuni · lavanderia · stagioni
//    nome      cosa si fa, preciso
//    dove      "camera" (le 10 camere) · "bagno" (camere e appartamenti) · "stanza" (camere e appartamenti)
//              "cucina" (i 3 appartamenti) · "balcone" (le camere segnate col balcone)
//              oppure l'id di una zona comune ("terrazzo", "corridoio_p1", "lavanderia"…)
//    ogni      ogni quanti giorni (ritmo base). 0 = a ogni pulizia / a ogni cambio (non ha scadenza)
//    quando    "ripasso"  = durante qualunque pulizia normale, anche a camera occupata
//              "cambio"   = solo durante un cambio completo (letto sfatto, ospite partito)
//              "libera"   = a parte, solo a camera libera (programmata nei weekend o tra partenza e arrivo)
//              "giornata" = zona comune: si attacca alla prima pulizia del giorno della signora
//              "giorno"   = lavoro a sé in un giorno di lavoro (es. coperte di una camera da lavare)
//    minuti    quanto ci vuole
//    euro      prezzo di partenza nel listino (si cambia dall'app)
//    priorita  1 igiene · 2 quello che l'ospite vede · 3 quello che non si vede
//    icona     disegno accanto alla riga
//    come      "come si fa" in 3 righe semplici, col prodotto e il colore del panno
//    controllo "come si controlla che sia fatta bene" (una riga per la controllatrice)
//    uso       true = il ritmo dipende da quanto è occupata la camera (passo 3)
//    strada    true = ritmo dimezzato nelle camere sulla strada
//    stagione  { da: "MM-GG", a: "MM-GG" } (o un elenco) = solo in quel periodo
//    meteo     "pioggia" | "freddo" | "caldo" | "umidita" = il meteo la anticipa (passo meteo)
//    soloFissi true = solo con un ospite che sta da 2+ settimane
//    evento    true = non ha un ritmo: scatta per un motivo (soggiorno lungo, cambio stagione, camera molto indietro)
// ============================================================================
import { aggiungiGiorni, giornoSettimana, giorniTra, lunediDi, soggiornoCopre, partiRoma, aISO } from "./logica.js";

// Zone comuni (non sono camere): a chi toccano si cambia qui.
export const LUOGHI_COMUNI = [
  { id: "corridoio_p1",   nome: "Corridoio 1° piano",     zona: "p1", tipo: "comune" },
  { id: "corridoio_p2",   nome: "Corridoio 2° piano",     zona: "p2", tipo: "comune" },
  { id: "scale",          nome: "Scale di servizio",      zona: "p1", tipo: "comune" },
  { id: "ingresso",       nome: "Ingresso e portone",     zona: "p1", tipo: "comune" },
  { id: "terrazzo",       nome: "Terrazzo",               zona: "p2", tipo: "comune" },
  { id: "lavanderia",     nome: "Lavanderia e attrezzi",  zona: "p1", tipo: "comune" },
];

export const PANNI = "Colori dei panni: ROSSO solo WC · GIALLO resto del bagno · BLU camera · VERDE cucina. Mai lo stesso panno dal bagno alla camera.";

const R = (id, gruppo, nome, dove, ogni, quando, minuti, euro, priorita, icona, come, controllo, extra = {}) => ({ id, gruppo, nome, dove, ogni, quando, minuti, euro, priorita, icona, come, controllo, ...extra });

export const CATALOGO = [
  // ---- CAMERA --------------------------------------------------------------------------------
  R("specchi", "camera", "Specchi lucidati", "stanza", 0, "ripasso", 2, 0, 2, "finestra",
    "A ogni pulizia: spruzza il detergente vetri sul panno (non sullo specchio), passa a S e asciuga con un panno asciutto. Panno BLU.", "Guarda lo specchio di sbieco controluce: niente aloni né ditate."),
  R("davanzali", "camera", "Davanzali interni e polvere sulle finestre", "camera", 7, "ripasso", 5, 1, 2, "finestra",
    "Panno BLU umido con il multiuso sui davanzali interni e sul bordo del telaio, poi asciuga. Togli briciole e insetti dagli angoli.", "Passa un dito sul davanzale: deve restare pulito."),
  R("telai_binari", "camera", "Telai e binari delle finestre", "camera", 14, "ripasso", 10, 2, 2, "finestra",
    "Aspira i binari con la bocchetta sottile, poi passa uno spazzolino vecchio con il multiuso negli angoli e asciuga. Sgrassa il telaio con il panno BLU.", "Apri la finestra e guarda i binari: niente sabbia né terra negli angoli.", { strada: true, meteo: "vento" }),
  R("vetri_interni", "camera", "Vetri interni lavati bene", "camera", 14, "ripasso", 10, 2, 2, "finestra",
    "Detergente vetri e tergivetro dall'alto in basso, bordi asciugati con un panno asciutto. (Ditate e macchie si tolgono a ogni pulizia, qui si lava tutto il vetro.)", "Controluce dall'interno: niente righe né aloni."),
  R("vetri_esterni", "camera", "Vetri esterni", "camera", 30, "ripasso", 15, 3, 2, "finestra",
    "Dall'interno o dal balcone, con il tergivetro telescopico: acqua con due gocce di detersivo per piatti, poi tergivetro e panno asciutto sui bordi. Solo dove si arriva in sicurezza.", "Controluce dall'esterno: niente aloni né gocce secche.", { meteo: "pioggia" }),
  R("dietro_tv", "camera", "Dietro la TV, cavi e retro del mobile", "camera", 14, "ripasso", 5, 1, 3, "armadio",
    "Spegni la TV. Panno BLU asciutto in microfibra dietro lo schermo, sui cavi e sul retro del mobile (la polvere ci si attacca per l'elettricità). Niente acqua vicino alle prese.", "Passa la mano dietro la TV: niente polvere sui cavi.", { uso: true }),
  R("tende_aspirate", "camera", "Tende scosse e aspirate", "camera", 14, "ripasso", 5, 1, 2, "finestra",
    "Scuoti le tende con la finestra aperta, poi aspira dall'alto in basso con la spazzola morbida, davanti e dietro.", "Sbatti un lembo di tenda controluce: non deve alzarsi polvere."),
  R("sotto_letto", "camera", "Sotto il letto aspirato", "camera", 7, "ripasso", 5, 1, 1, "letto",
    "Aspirapolvere con la bocchetta piatta fin sotto il letto, da tutti e due i lati, e sotto i comodini. Raccogli quello che trovi (calzini, caricabatterie: lasciali sul comodino).", "Torcia del telefono sotto il letto: niente batuffoli."),
  R("sopra_armadi", "camera", "Sopra gli armadi", "camera", 30, "ripasso", 5, 1, 3, "armadio",
    "Con la scaletta: panno BLU umido sopra l'armadio e sopra la testiera alta, poi asciuga. Togli le cose dimenticate.", "Passa un dito sopra l'armadio: deve restare pulito."),
  R("battiscopa", "camera", "Battiscopa", "camera", 14, "ripasso", 5, 1, 3, "armadio",
    "Panno BLU umido lungo tutti i battiscopa, anche dietro la porta e sotto il letto dove arrivi.", "Dito sul battiscopa dietro la porta: pulito."),
  R("porte", "camera", "Porte (davanti, dietro, bordo sopra) e maniglie", "camera", 14, "ripasso", 5, 1, 2, "porta",
    "Panno BLU umido con il multiuso su tutte e due le facce della porta, sul bordo sopra e intorno alla maniglia (ditate). Maniglie disinfettate.", "Bordo sopra la porta e zona maniglia: niente polvere né ditate."),
  R("lampade", "camera", "Lampade e abat-jour", "camera", 14, "ripasso", 5, 1, 3, "finestra",
    "Luce spenta e fredda: panno BLU asciutto sui paralumi e sulle lampadine, umido sulle basi.", "Accendi la lampada: niente polvere che si vede sul paralume."),
  R("pareti_ditate", "camera", "Ditate e segni sulle pareti", "camera", 14, "ripasso", 5, 1, 2, "porta",
    "Guarda le pareti vicino agli interruttori, alla porta e alla testiera: spugna magica o panno umido appena strizzato, senza strofinare forte.", "Zona interruttori e testiera: niente aloni scuri."),
  R("contatti", "camera", "Telecomando, interruttori, maniglie e phon disinfettati", "stanza", 7, "ripasso", 5, 1, 1, "lente",
    "Spruzza il disinfettante sul panno BLU (mai sugli interruttori) e passa telecomando, interruttori, maniglie di porte e finestre, impugnatura del phon.", "Telecomando: pulito tra i tasti."),
  R("plafoniere", "camera", "Plafoniere e angoli del soffitto (ragnatele)", "stanza", 30, "ripasso", 5, 1, 2, "finestra",
    "Con la scopa con il panno avvolto: angoli del soffitto, sopra le porte, intorno alla plafoniera. Plafoniera spenta: panno asciutto.", "Guarda in alto negli angoli: niente ragnatele."),
  R("quadri", "camera", "Quadri e cornici", "camera", 30, "ripasso", 3, 1, 3, "finestra",
    "Panno BLU asciutto sulla cornice e sul bordo superiore, un passaggio leggero sul vetro.", "Dito sul bordo superiore della cornice: pulito."),
  R("prese_ciabatte", "camera", "Prese, ciabatte e cavi spolverati", "camera", 90, "ripasso", 5, 1, 3, "lente",
    "Panno BLU asciutto su prese, ciabatte e cavi dietro i comodini e la scrivania. Niente acqua.", "Ciabatta sotto la scrivania: niente polvere."),
  R("lampadari", "camera", "Lampadari", "camera", 180, "ripasso", 10, 2, 3, "finestra",
    "Luce spenta e fredda, con la scaletta: panno asciutto in microfibra su ogni pezzo, poi umido sulle parti di metallo.", "Accendi la luce: lampadario senza polvere."),
  R("coprimaterasso_cambio", "camera", "Coprimaterasso e copricuscini puliti", "stanza", 0, "cambio", 5, 0, 1, "letto",
    "A ogni partenza si cambiano coprimaterasso e copricuscini (il copripiumino va con le lenzuola). Sempre, se macchiati.", "Solleva il lenzuolo: coprimaterasso senza macchie, angoli tesi."),
  R("coprimaterasso_fissi", "camera", "Coprimaterasso e copricuscini (ospite fisso)", "stanza", 21, "ripasso", 10, 2, 1, "letto",
    "Con gli ospiti che restano settimane: cambia coprimaterasso e copricuscini durante il ripasso, rifai il letto con le stesse lenzuola se sono pulite.", "Solleva il lenzuolo: coprimaterasso pulito.", { soloFissi: true }),
  R("coperta_scorta", "camera", "Coperta di scorta pulita nell'armadio", "camera", 0, "cambio", 2, 0, 2, "coperta",
    "Controlla che nell'armadio ci sia una coperta di scorta pulita e piegata nel sacco.", "Apri l'armadio: coperta piegata e pulita."),
  R("controllo_lusso", "camera", "Controllo di lusso (5 minuti)", "stanza", 0, "cambio", 5, 0, 1, "lente",
    "A ogni cambio completo, prima di chiudere: sotto il letto, dentro cassetti e armadio, dietro la porta, dietro il WC, capelli negli scarichi, cestini lavati, telecomando-interruttori-maniglie disinfettati.", "Apri un cassetto a caso e guarda dietro il WC: come nuovi."),
  R("dentro_armadi", "camera", "Dentro armadi e cassetti", "stanza", 14, "cambio", 10, 2, 2, "armadio",
    "Solo a camera libera (mai toccare la roba degli ospiti): svuota, aspira le briciole, panno BLU umido dentro e sui ripiani, asciuga, rimetti grucce e carta.", "Apri due cassetti e l'armadio: niente briciole né capelli."),
  R("materasso_aspirato", "camera", "Materasso aspirato", "stanza", 30, "cambio", 10, 2, 1, "letto",
    "Letto sfatto: aspira il materasso sopra e sui bordi con la spazzola per tessuti, lentamente; se c'è una macchia, bicarbonato 15 minuti e aspira.", "Guarda il materasso senza coprimaterasso: niente briciole né macchie."),
  R("materasso_girato", "camera", "Materasso girato testa-piedi", "stanza", 90, "cambio", 5, 2, 1, "letto",
    "In due: gira il materasso testa-piedi (non sottosopra se ha il lato estate/inverno). Scrivi il mese con un pezzo di nastro sul bordo.", "Nastro sul bordo del materasso con il mese giusto."),
  R("cuscini_piumoni", "camera", "Cuscini e piumoni lavati", "stanza", 90, "cambio", 20, 5, 1, "coperta",
    "Cuscini e piumone in lavatrice a 60° (leggi l'etichetta) con due palline da tennis, asciugati bene al sole o in asciugatrice.", "Annusa cuscino e piumone: profumo di pulito, nessuna macchia gialla."),
  R("controllo_materassi", "camera", "Controllo di materassi e cuscini", "stanza", 180, "cambio", 5, 0, 2, "letto",
    "Guarda materasso e cuscini: avvallamenti, molle che si sentono, cuscini piatti o ingialliti. I cuscini si cambiano ogni 2 anni. Scrivilo a Michele.", "Nota scritta nella scheda: a posto, oppure cosa cambiare."),
  R("letto_spostato", "camera", "Letto spostato e pulito dietro", "stanza", 30, "libera", 15, 3, 3, "letto",
    "Sposta il letto dal muro: aspira dietro e sotto, panno BLU umido su battiscopa e testiera dietro, poi rimetti a posto.", "Torcia tra letto e muro: niente polvere."),
  R("dietro_mobili", "camera", "Dietro i mobili pesanti", "stanza", 90, "libera", 20, 4, 3, "armadio",
    "Sposta comodini, scrivania e cassettiera: aspira dietro e sotto, panno umido sul retro dei mobili e sul battiscopa, rimetti a posto senza graffiare il pavimento.", "Guarda dietro la cassettiera: pulito."),
  R("dietro_armadi", "camera", "Dietro gli armadi", "stanza", 180, "libera", 20, 4, 3, "armadio",
    "In due, se l'armadio si sposta: aspira dietro e sopra, panno umido sul retro. Se non si sposta, spazzola lunga con il panno nella fessura.", "Fessura dietro l'armadio: niente ragnatele."),
  R("tende_lavate", "camera", "Tende lavate", "camera", 90, "libera", 40, 8, 2, "finestra",
    "Stacca le tende, lavaggio delicato a 30-40° (leggi l'etichetta), riappendile umide così si stirano da sole. Tende pesanti: ogni 6 mesi. Subito se c'è odore di fumo.", "Annusa e guarda le tende controluce: profumo di pulito, niente aloni.", { stagioneLunga: 180 }),
  R("fondo_completa", "camera", "Pulizia a fondo completa", "stanza", 0, "libera", 180, 40, 1, "stella",
    "Mezza giornata a camera libera: tutte le rifiniture del catalogo in una volta, letto e mobili spostati, materasso girato, cuscini e piumone lavati, armadi dentro e sopra, vetri dentro e fuori, pareti lavate dove serve.", "Fai il giro con la lista del catalogo: ogni voce deve essere a posto.", { evento: true, grande: true }),

  // ---- BAGNO ----------------------------------------------------------------------------------
  R("doccia_muffa", "bagno", "Doccia e silicone anti-muffa", "bagno", 3.5, "ripasso", 5, 1, 1, "doccia",
    "Spruzza l'anti-muffa su silicone, fughe della doccia e angoli; lascia agire 10 minuti mentre fai il resto; sciacqua. Panno GIALLO. Lascia il box aperto.", "Guarda il silicone in basso negli angoli: bianco, niente puntini neri.", { meteo: "umidita" }),
  R("scarichi", "bagno", "Scarichi e sifone con acqua bollente", "bagno", 7, "ripasso", 3, 1, 1, "doccia",
    "Togli i capelli dalla griglia della doccia e del lavandino con la pinzetta, poi un bollitore d'acqua bollente in ogni scarico.", "L'acqua del lavandino scende subito, senza gorgogliare."),
  R("spazzolino_wc", "bagno", "Spazzolino del WC sanificato", "bagno", 7, "ripasso", 2, 0.5, 1, "doccia",
    "Spazzolino nel WC con candeggina 10 minuti, sciacqua, lascia asciugare incastrato sotto la tavoletta prima di rimetterlo nel bicchiere. Bicchiere lavato. Guanti e panno ROSSO.", "Bicchiere dello spazzolino: asciutto e senza fondo scuro."),
  R("dietro_wc", "bagno", "Dietro e intorno al WC", "bagno", 7, "ripasso", 5, 1, 1, "doccia",
    "Sgrassatore e panno ROSSO dietro il WC, sul tubo, sulla base e sul pavimento intorno; poi disinfettante. Il panno ROSSO non tocca nient'altro.", "Torcia dietro il WC: niente aloni gialli né polvere."),
  R("piastrelle_doccia", "bagno", "Piastrelle della doccia", "bagno", 7, "ripasso", 5, 1, 1, "doccia",
    "Anticalcare spruzzato sulle piastrelle e sul box, 5 minuti, spugna non graffiante, sciacqua e asciuga con il panno GIALLO.", "Passa la mano sulle piastrelle bagnate: lisce, non ruvide di calcare."),
  R("fughe", "bagno", "Fughe delle piastrelle del bagno", "bagno", 30, "ripasso", 10, 2, 2, "doccia",
    "Spazzolino con pasta di bicarbonato e poco anticalcare sulle fughe scure, lascia 5 minuti, strofina, sciacqua.", "Fughe dello stesso colore ovunque, niente righe nere."),
  R("soffione_rubinetti", "bagno", "Soffione e rubinetti decalcificati", "bagno", 30, "ripasso", 10, 2, 2, "doccia",
    "Sacchetto con aceto o anticalcare sul soffione per 15 minuti, poi sciacqua; anticalcare sui rubinetti, spugna, asciuga e lucida con il panno GIALLO asciutto.", "Tutti i fori del soffione buttano acqua dritta; rubinetti lucidi."),
  R("sotto_lavandini", "bagno", "Dietro e sotto i lavandini e i tubi", "bagno", 30, "ripasso", 5, 1, 3, "doccia",
    "Panno GIALLO umido con sgrassatore sotto il lavandino, sul sifone e sui tubi; asciuga. Controlla che non goccioli.", "Mano sotto il lavandino: asciutto e pulito."),
  R("phon_filtro", "bagno", "Filtro del phon", "bagno", 30, "ripasso", 2, 0.5, 2, "lente",
    "Phon staccato: togli la griglia dietro, spazzolino asciutto sul filtro, rimonta.", "Griglia del phon senza lanugine."),
  R("cestini_lavati", "bagno", "Cestini lavati", "stanza", 7, "ripasso", 3, 1, 1, "bidone",
    "Cestini della camera e del bagno svuotati, lavati con sgrassatore, asciugati, sacchetto nuovo.", "Alza il sacchetto: cestino pulito e asciutto sotto."),

  // ---- CUCINA (appartamenti) ------------------------------------------------------------------
  R("cucina_base", "cucina", "Fornelli, lavello, microonde, cestino e bidoni", "cucina", 0, "ripasso", 10, 0, 1, "cucina",
    "A ogni pulizia: fornelli e griglie con lo sgrassatore, lavello lucidato, microonde dentro e fuori, cestino lavato, bidoni della differenziata sciacquati. I piatti sporchi degli ospiti NON si lavano. Panno VERDE.", "Apri il microonde e guarda sotto le griglie dei fornelli: puliti."),
  R("cappa_filtri", "cucina", "Filtri della cappa sgrassati", "cucina", 30, "ripasso", 10, 2, 1, "cucina",
    "Sfila i filtri, ammollo in acqua bollente con sgrassatore 15 minuti, spazzola, sciacqua, asciuga e rimonta.", "Filtri della cappa: metallo che si vede, niente grasso appiccicoso."),
  R("forno", "cucina", "Forno a fondo", "cucina", 30, "ripasso", 15, 3, 1, "cucina",
    "Forno freddo: sgrassatore per forni dentro e sul vetro, 15 minuti, spugna, sciacqua bene. Griglie e leccarda in ammollo.", "Vetro del forno trasparente, niente croste sul fondo."),
  R("lavastoviglie_filtro", "cucina", "Filtro della lavastoviglie", "cucina", 30, "ripasso", 5, 1, 1, "cucina",
    "Svita il filtro sul fondo, lavalo con spazzolino e sgrassatore, pulisci la guarnizione dello sportello, rimonta.", "Filtro senza residui, sportello che non puzza."),
  R("guarnizioni_frigo", "cucina", "Guarnizioni del frigo", "cucina", 30, "ripasso", 5, 1, 1, "frigo",
    "Spazzolino con acqua e bicarbonato nelle pieghe della guarnizione, asciuga. Controlla che la porta chiuda bene.", "Pieghe della guarnizione: bianche, niente puntini neri."),
  R("dietro_fornelli", "cucina", "Dietro e sotto i fornelli", "cucina", 30, "ripasso", 10, 2, 2, "cucina",
    "Sgrassatore sulla parete dietro i fornelli e sui bordi del piano; se il piano si alza, pulisci sotto.", "Parete dietro i fornelli senza schizzi."),
  R("pensili", "cucina", "Dentro pensili e cassetti", "cucina", 30, "cambio", 10, 2, 2, "armadio",
    "Solo ad appartamento libero: svuota, briciole via, panno VERDE umido dentro, asciuga, rimetti. Butta cibi aperti lasciati dagli ospiti.", "Apri due pensili: niente briciole né cibi aperti."),
  R("frigo_sbrinato", "cucina", "Frigo e freezer sbrinati e lavati", "cucina", 90, "libera", 45, 10, 1, "frigo",
    "Appartamento libero: frigo spento e vuoto, sbrina il freezer con una pentola d'acqua calda dentro, lava tutto con acqua e bicarbonato, asciuga, riaccendi.", "Freezer senza ghiaccio sulle pareti, frigo che non puzza."),
  R("dietro_frigo", "cucina", "Dietro e sotto frigo e cucina", "cucina", 90, "libera", 15, 3, 3, "frigo",
    "Frigo staccato e spostato: aspira la griglia dietro e il pavimento sotto, panno umido, rimetti a posto.", "Torcia sotto il frigo: pulito."),

  // ---- BALCONE (solo le camere segnate col balcone) --------------------------------------------
  R("balcone_scopa", "balcone", "Balcone scopato", "balcone", 0, "ripasso", 3, 0, 2, "terrazzo",
    "A ogni ripasso: scopa il balcone, svuota il posacenere, togli foglie dallo scarico.", "Pavimento del balcone senza foglie né cicche."),
  R("balcone_lavato", "balcone", "Balcone lavato", "balcone", 14, "ripasso", 10, 2, 2, "terrazzo",
    "Secchio d'acqua con il detersivo per pavimenti, spazzolone, risciacquo; sedie e tavolino passati con il panno.", "Pavimento del balcone senza aloni, sedie pulite."),
  R("balcone_fondo", "balcone", "Balcone a fondo: ringhiera, scarico, mobili", "balcone", 30, "ripasso", 20, 4, 2, "terrazzo",
    "Ringhiera lavata con sgrassatore e asciugata, scarico liberato, mobili lavati, vetro della portafinestra fuori.", "Mano sulla ringhiera: pulita; scarico libero.", { meteo: "pioggia" }),

  // ---- STAGIONI -------------------------------------------------------------------------------
  R("coperte_autunno", "stagioni", "Coperte e piumoni lavati e pronti nell'armadio", "camera", 365, "giorno", 30, 6, 2, "coperta",
    "Prima del freddo: coperte e piumoni in lavatrice (leggi l'etichetta), asciugati bene, piegati nei sacchi nell'armadio. Le coperte si mettono sui letti solo lavate.", "Apri l'armadio: coperte nei sacchi, profumo di pulito.", { stagione: { da: "10-01", a: "11-30" }, meteo: "freddo" }),
  R("coperte_primavera", "stagioni", "Coperte tolte, lavate e riposte", "camera", 365, "giorno", 30, 6, 2, "coperta",
    "A primavera: via le coperte dai letti, lavate, asciugate al sole, riposte nei sacchi chiusi con un sapone antitarme.", "Letti senza coperte pesanti; sacchi chiusi nell'armadio.", { stagione: { da: "05-01", a: "06-15" }, meteo: "caldo" }),
  R("condizionatori_maggio", "stagioni", "Condizionatori pronti per l'estate", "stanza", 365, "ripasso", 30, 6, 1, "aria",
    "Filtri lavati e asciugati, griglie pulite, spray igienizzante nelle alette, prova di accensione 10 minuti.", "Griglia aperta: filtri bianchi; aria senza odore di chiuso.", { stagione: { da: "05-01", a: "06-10" } }),
  R("condizionatore_filtri", "stagioni", "Filtri del condizionatore", "stanza", 14, "ripasso", 10, 2, 1, "aria",
    "Apri la griglia, sfila i filtri, sciacquali sotto l'acqua tiepida, asciugali all'ombra, rimontali. In piena estate ogni 2 settimane, nelle mezze stagioni ogni mese.", "Filtri sfilati: niente strato grigio.", { stagione: [{ da: "06-11", a: "09-15" }], ogniMezza: 30, stagioneMezza: [{ da: "04-15", a: "06-10" }, { da: "09-16", a: "10-31" }] }),
  R("condizionatore_griglie", "stagioni", "Griglie e alette del condizionatore", "stanza", 30, "ripasso", 5, 1, 2, "aria",
    "Panno BLU umido sulle griglie e sulle alette esterne, spray igienizzante.", "Alette senza polvere nera.", { stagione: { da: "04-15", a: "10-31" } }),
  R("termosifoni", "stagioni", "Termosifoni e stufe spolverati e controllati", "stanza", 365, "ripasso", 15, 3, 2, "termo",
    "Prima dell'inverno: aspira tra gli elementi, panno umido dentro e dietro, accendi 10 minuti per vedere che scaldi; stufe elettriche controllate (cavo e griglia).", "Dietro il termosifone: niente polvere; si scalda tutto.", { stagione: { da: "10-15", a: "11-30" } }),
  R("scarichi_terrazzo", "stagioni", "Scarichi e griglie del terrazzo liberi dalle foglie", "terrazzo", 365, "giornata", 20, 4, 1, "terrazzo",
    "Togli foglie e terra da scarichi e griglie, versa un secchio d'acqua per vedere che scenda.", "Secchio d'acqua nello scarico: sparisce in pochi secondi.", { stagione: { da: "09-15", a: "10-31" } }),

  // ---- ZONE COMUNI ----------------------------------------------------------------------------
  R("corridoio_passata_p1", "comuni", "Passata veloce del corridoio", "corridoio_p1", 1, "giornata", 5, 0, 2, "scopa",
    "Ogni giorno di lavoro: scopa veloce o aspirapolvere nel corridoio, cestino comune svuotato, un'occhiata a luci e porte.", "Corridoio senza briciole né cartacce."),
  R("corridoio_passata_p2", "comuni", "Passata veloce del corridoio", "corridoio_p2", 1, "giornata", 5, 0, 2, "scopa",
    "Ogni giorno di lavoro: scopa veloce o aspirapolvere nel corridoio, cestino comune svuotato, un'occhiata a luci e porte.", "Corridoio senza briciole né cartacce."),
  R("corridoio_fondo_p1", "comuni", "Corridoio a fondo: battiscopa, plafoniere, porte comuni, segni", "corridoio_p1", 7, "giornata", 20, 4, 2, "scopa",
    "Pavimento lavato, battiscopa con il panno umido, plafoniere spolverate, porte comuni e maniglie sgrassate, segni sulle pareti con la spugna magica.", "Battiscopa e maniglie delle porte comuni: puliti al tatto."),
  R("corridoio_fondo_p2", "comuni", "Corridoio a fondo: battiscopa, plafoniere, porte comuni, segni", "corridoio_p2", 7, "giornata", 20, 4, 2, "scopa",
    "Pavimento lavato, battiscopa con il panno umido, plafoniere spolverate, porte comuni e maniglie sgrassate, segni sulle pareti con la spugna magica.", "Battiscopa e maniglie delle porte comuni: puliti al tatto."),
  R("scale_scopate", "comuni", "Scale di servizio scopate", "scale", 3.5, "giornata", 10, 2, 2, "scopa",
    "Scopa dall'alto in basso, gradino per gradino, angoli compresi; raccogli con la paletta.", "Angoli dei gradini senza polvere."),
  R("scale_lavate", "comuni", "Scale di servizio lavate", "scale", 7, "giornata", 15, 3, 2, "scopa",
    "Dopo averle scopate: secchio con detersivo per pavimenti, dall'alto in basso, strizza bene lo straccio (gradini scivolosi = pericolo). Cartello 'bagnato'.", "Gradini asciutti e senza aloni."),
  R("scale_corrimano", "comuni", "Corrimano e battiscopa delle scale", "scale", 14, "giornata", 10, 2, 2, "scopa",
    "Corrimano sgrassato e disinfettato per tutta la lunghezza, battiscopa dei gradini con il panno umido.", "Mano sul corrimano: pulito, non appiccicoso."),
  R("vetri_scale", "comuni", "Vetri delle scale", "scale", 30, "giornata", 20, 4, 2, "finestra",
    "Detergente vetri e tergivetro sui vetri delle scale dentro e, dove si arriva in sicurezza, fuori; telai e davanzali con il panno umido.", "Vetri delle scale controluce: senza aloni."),
  R("ingresso", "comuni", "Portone, citofono, targhe e zerbini", "ingresso", 7, "giornata", 10, 2, 2, "porta",
    "Portone davanti e dietro con il panno umido, citofono e targhe lucidati, zerbini sbattuti fuori, gradino d'ingresso lavato.", "Citofono e maniglia del portone: lucidi."),
  R("zerbini_lavati", "comuni", "Zerbini lavati", "ingresso", 30, "giornata", 10, 2, 3, "porta",
    "Zerbini lavati con acqua e sapone, spazzolati, asciugati al sole prima di rimetterli.", "Zerbino asciutto e senza sabbia sotto."),
  R("terrazzo_scopa", "comuni", "Terrazzo: scopa e acqua", "terrazzo", 7, "giornata", 15, 3, 2, "terrazzo",
    "Scopa tutto il terrazzo, svuota i posacenere, un secchio d'acqua sulle zone sporche, sedie passate con il panno.", "Terrazzo senza foglie, posacenere vuoti."),
  R("terrazzo_fondo", "comuni", "Terrazzo a fondo: pavimento, ringhiere, mobili, griglie", "terrazzo", 30, "giornata", 40, 8, 2, "terrazzo",
    "Pavimento strofinato con spazzolone e detersivo, ringhiere lavate e asciugate, mobili lavati, griglie degli scarichi liberate.", "Mano sulla ringhiera: pulita; pavimento senza aloni.", { meteo: "pioggia" }),
  R("bidoni", "comuni", "Bidoni dei rifiuti lavati", "ingresso", 14, "giornata", 10, 2, 1, "bidone",
    "Bidoni svuotati, lavati dentro e fuori con acqua e sgrassatore, asciugati aperti al sole.", "Bidone aperto: non puzza, fondo pulito."),

  // ---- LAVANDERIA, ATTREZZI E SCORTE -----------------------------------------------------------
  R("lavatrice_cassetto", "lavanderia", "Cassetto del detersivo e guarnizione dell'oblò", "lavanderia", 7, "giornata", 5, 1, 1, "lavatrice",
    "Cassetto sfilato e lavato sotto l'acqua calda, guarnizione dell'oblò passata con il panno e l'anti-muffa, oblò lasciato aperto a fine giornata.", "Piega della guarnizione: niente nero; cassetto senza incrostazioni."),
  R("lavatrice_zona", "lavanderia", "Zona lavatrice: pavimento ed esterno", "lavanderia", 7, "giornata", 10, 2, 2, "lavatrice",
    "Esterno della lavatrice e dell'asciugatrice con il panno umido, pavimento intorno lavato, filtro dell'asciugatrice svuotato (se c'è).", "Pavimento intorno alla lavatrice senza polvere di detersivo."),
  R("lavatrice_vuoto", "lavanderia", "Lavaggio a vuoto a 90° e filtro della lavatrice", "lavanderia", 30, "giornata", 15, 3, 1, "lavatrice",
    "Un lavaggio a vuoto a 90° con il pulitore per lavatrice, poi filtro in basso svitato e pulito (con uno straccio e una bacinella sotto).", "Oblò aperto: nessun odore di chiuso; filtro senza pelucchi."),
  R("scalinata_lavanderia", "lavanderia", "Scalinata della lavanderia", "lavanderia", 7, "giornata", 10, 2, 2, "scopa",
    "Scopata e lavata dall'alto in basso, corrimano passato.", "Gradini puliti e asciutti."),
  R("scaffali_lavanderia", "lavanderia", "Scaffali e cestoni a fondo", "lavanderia", 30, "giornata", 30, 6, 3, "scopa",
    "Scaffali svuotati e lavati, prodotti rimessi in ordine con le etichette davanti, cestoni della biancheria lavati e asciugati.", "Scaffali senza polvere, cestoni puliti dentro."),
  R("mappine", "lavanderia", "Mappine e stracci da terra nuovi", "lavanderia", 35, "giornata", 5, 0, 1, "secchio",
    "Mappine e stracci da terra si lavano a 60° ogni giorno che si usano e si asciugano stesi, mai bagnati nel secchio (è per questo che puzzano). Ogni 4-6 settimane si buttano e si prendono nuovi.", "Annusa la mappina asciutta: nessun odore."),
  R("microfibra", "lavanderia", "Panni in microfibra nuovi", "lavanderia", 75, "giornata", 5, 0, 1, "secchio",
    "I panni in microfibra si lavano a 60° senza ammorbidente e si cambiano ogni 2-3 mesi. " + PANNI, "Panni dei quattro colori presenti e non sfilacciati."),
  R("carrello", "lavanderia", "Carrello, secchi e scope lavati", "lavanderia", 7, "giornata", 10, 2, 2, "secchio",
    "Carrello, secchi e scope lavati con sgrassatore e lasciati asciugare capovolti.", "Secchi asciutti e senza fondo scuro."),
  R("aspirapolvere", "lavanderia", "Aspirapolvere: sacco e filtri", "lavanderia", 14, "giornata", 10, 2, 2, "secchio",
    "Sacco cambiato, filtri battuti o lavati e asciugati, spazzola liberata dai capelli con le forbici.", "Aspirapolvere che tira forte e non puzza."),
  R("scorte", "lavanderia", "Controllo prodotti e biancheria", "lavanderia", 7, "giornata", 10, 0, 2, "lista",
    "Conta prodotti e biancheria: almeno un ricambio pulito completo per ogni camera sempre pronto. Scrivi a Michele cosa manca.", "Scaffale con un set completo per camera."),
];
// (nome vecchio: lo usano ancora alcune schermate)
export const REGOLE_GOVERNANTE = CATALOGO;

export const GRUPPI = { camera: "Camera", bagno: "Bagno", cucina: "Cucina (appartamenti)", balcone: "Balcone", stagioni: "Stagioni e meteo", comuni: "Zone comuni", lavanderia: "Lavanderia, attrezzi e scorte", P: "Le tue regole" };

// Soglie di partenza (si cambiano dall'app, in "Regole")
export const SOGLIE_BASE = { minutiGiorno: 60, camereSettimana: 2, freddoGradi: 12, minutiRifiniture: 15, rifiniturePerPulizia: 2, automatico: false };

// La scala "ogni quanto" per i tasti + e −
export const SCALA_OGNI = [1, 3.5, 7, 14, 21, 30, 45, 60, 90, 120, 180, 365];
export function etichettaOgni(g) {
  if (!g) return "a ogni pulizia";
  if (g <= 1) return "ogni giorno di lavoro";
  if (g <= 3.5) return "2 volte a settimana";
  if (g === 7) return "ogni settimana";
  if (g === 14) return "ogni 2 settimane";
  if (g === 21) return "ogni 3 settimane";
  if (g === 30) return "ogni mese";
  if (g === 45) return "ogni 6 settimane";
  if (g === 60) return "ogni 2 mesi";
  if (g === 90) return "ogni 3 mesi";
  if (g === 120) return "ogni 4 mesi";
  if (g === 180) return "ogni 6 mesi";
  if (g >= 365) return "una volta l'anno";
  return `ogni ${g} giorni`;
}
export const QUANDO_TESTO = { ripasso: "durante la pulizia normale", cambio: "durante il cambio completo", libera: "a camera libera", giornata: "nella giornata di lavoro", giorno: "in un giorno di lavoro" };

// Le regole con sopra le modifiche fatte dall'app (impostazioni/governante)
export function regoleAttive(imp) {
  const mod = (imp && imp.regole) || {}, personali = (imp && imp.personali) || {};
  const base = CATALOGO.map(r => ({ ...r, ...(mod[r.id] || {}) }));
  const extra = Object.values(personali).map(r => ({ priorita: 2, euro: 0, quando: "ripasso", gruppo: "P", icona: "stella", controllo: "", ...r, personale: true, ...(mod[r.id] || {}) }));
  return [...base, ...extra].filter(r => r.attiva !== false);
}
export function soglie(imp) { return { ...SOGLIE_BASE, ...((imp && imp.soglie) || {}) }; }

// A quali luoghi si applica una regola. flags = { balconi: {camera:true}, strada: {camera:true} }
export function luoghiDi(regola, camere, luoghi = LUOGHI_COMUNI, flags = {}) {
  const d = regola.dove;
  if (d === "camera" || d === "camere") return camere.filter(c => c.tipo !== "casa");
  if (d === "cucina" || d === "case") return camere.filter(c => c.tipo === "casa");
  if (d === "bagno" || d === "stanza" || d === "stanze" || d === "tutte") return camere.slice();
  if (d === "balcone") return camere.filter(c => (flags.balconi || {})[c.id] || c.balcone);
  if (d && d.startsWith("zona:")) return camere.filter(c => c.zona === d.slice(5));
  if (d && d.startsWith("camera:")) return camere.filter(c => c.id === d.slice(7));
  const l = luoghi.find(x => x.id === d); return l ? [l] : [];
}
export function trovaLuogo(id, camere, luoghi = LUOGHI_COMUNI) { return camere.find(c => c.id === id) || luoghi.find(l => l.id === id) || null; }

// È dentro la stagione? (stagione: {da,a} oppure un elenco di finestre)
function inFinestra(f, iso) { const mg = iso.slice(5); return f.da <= f.a ? (mg >= f.da && mg <= f.a) : (mg >= f.da || mg <= f.a); }
export function inStagione(regola, iso) {
  const fin = finestre(regola); if (!fin.length) return true;
  return fin.some(f => inFinestra(f, iso));
}
function finestre(regola) { const a = regola.stagione ? (Array.isArray(regola.stagione) ? regola.stagione : [regola.stagione]) : []; const b = regola.stagioneMezza ? regola.stagioneMezza : []; return [...a, ...b]; }
// Il ritmo "giusto" in questo momento (mezze stagioni, camere sulla strada)
export function ogniAttuale(regola, iso, luogo, flags = {}) {
  let g = regola.ogni || 0;
  if (regola.stagioneMezza && regola.ogniMezza && regola.stagioneMezza.some(f => inFinestra(f, iso))) g = regola.ogniMezza;
  if (regola.strada && luogo && ((flags.strada || {})[luogo.id] || luogo.strada)) g = Math.max(1, g / 2);
  return g;
}

// Quanto è "scaduto" un lavoro: 0 = appena fatto, 1 = scaduto adesso, >1 = in ritardo. Infinity = mai fatto.
export function rapportoScadenza(regola, ultima, oggi, ogni) {
  const g = ogni ?? regola.ogni;
  if (!g) return null;
  if (!ultima) return Infinity;
  return giorniTra(ultima, oggi) / g;
}
export function coloreScadenza(rapporto) { return rapporto === Infinity || rapporto == null || rapporto >= 1 ? "rosso" : rapporto >= 0.75 ? "giallo" : "verde"; }
export function testoUltima(ultima, oggi) {
  if (!ultima) return "mai";
  const g = giorniTra(ultima, oggi);
  if (g <= 0) return "oggi"; if (g === 1) return "ieri"; if (g < 7) return `${g} giorni fa`;
  if (g < 30) return `${Math.round(g / 7)} settimane fa`;
  if (g < 365) { const m = Math.round(g / 30); return m === 1 ? "1 mese fa" : `${m} mesi fa`; }
  return "più di un anno fa";
}

// Registro: { "regola|luogo": { ultima: "AAAA-MM-GG", da, n, saltata, motivo } }
export function chiaveRegistro(regola, luogo) { return `${regola}|${luogo}`; }
export function ultimaVolta(registro, regola, luogo) { return (registro && registro[chiaveRegistro(regola, luogo)]) || null; }

// --- la stanza è libera quella notte? -------------------------------------------------------------
function liberaLaNotte(soggiorni, camera, iso) { return !soggiorni.some(s => s.camera === camera && soggiornoCopre(s, iso)); }
function nottiDiFila(soggiorni, camera, iso) { const s = soggiorni.find(x => x.camera === camera && soggiornoCopre(x, iso)); return s ? giorniTra(s.inizio, iso) : 0; }
const CAMBIO = p => p.tipo === "totale" || p.tipo === "totale_casa";
const NORMALE = p => p && p.origine !== "governante" && p.tipo !== "extra" && p.tipo !== "fondo";

// Giorni della settimana in cui una stanza si può fare "a camera libera": vuota quella notte, non domenica,
// meglio se non lo stesso giorno di un cambio completo. Ritorna [{iso, punti, perche, prossimo}]
function giorniLiberi(camera, lun, soggiorni, pulizie, oggi) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const iso = aggiungiGiorni(lun, i);
    if (iso < oggi || giornoSettimana(iso) === 0) continue;
    if (!liberaLaNotte(soggiorni, camera.id, iso)) continue;
    const parte = soggiorni.find(s => s.camera === camera.id && s.fine === iso);
    const cambio = Object.values(pulizie).some(p => p.data === iso && p.camera === camera.id && CAMBIO(p));
    const liberaAnchePrima = liberaLaNotte(soggiorni, camera.id, aggiungiGiorni(iso, -1));
    let punti = 10, perche = "";
    if (cambio) { punti -= 4; perche = "dopo la pulizia totale"; }
    if (parte && !liberaAnchePrima) { punti -= 2; perche = perche || `${parte.nome || "l'ospite"} parte quel giorno`; }
    if (liberaAnchePrima && !cambio) perche = perche || "camera libera";
    if (giornoSettimana(iso) === 6) punti += 1;
    out.push({ iso, punti, perche, parte: !!parte, cambio, prossimo: soggiorni.filter(s => s.camera === camera.id && s.inizio > iso).map(s => s.inizio).sort()[0] || null });
  }
  return out.sort((a, b) => b.punti - a.punti || (a.iso < b.iso ? -1 : 1));
}
function cambiDelGiorno(pulizie, zona, iso) { return Object.values(pulizie).filter(p => p.data === iso && p.zona === zona && CAMBIO(p)).length; }

// ============================================================================
//  LE RIFINITURE DENTRO LE PULIZIE NORMALI (il metodo)
//  rifinitureDelGiorno(zona, iso, ctx) → { [idPulizia]: [rifinitura…] }
//  A ogni pulizia normale: le cose "a ogni pulizia" (sempre) + 1-2 rifiniture da 5-10 minuti scelte tra le più in
//  ritardo per quella camera (entro minutiRifiniture a pulizia e minutiGiorno al giorno per signora).
//  Le zone comuni ("giornata") si attaccano alla prima pulizia del giorno della signora.
// ============================================================================
export function rifinitureDelGiorno(zona, iso, ctx) {
  const { camere, registro, soggiorni = [] } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = ctx.regole || regoleAttive(null), sg = { ...SOGLIE_BASE, ...(ctx.soglie || {}) }, flags = ctx.flags || {};
  const pulizie = Object.values(ctx.pulizie || {}).filter(p => p.data === iso && p.zona === zona && NORMALE(p) && p.stato !== "non_fatta")
    .sort((a, b) => ((camere.find(c => c.id === a.camera) || {}).ordine || 99) - ((camere.find(c => c.id === b.camera) || {}).ordine || 99));
  const out = {}; if (!pulizie.length) return out;
  let minutiGiorno = 0;
  // 1) camera per camera
  for (const p of pulizie) {
    const l = trovaLuogo(p.camera, camere, luoghi); if (!l) continue;
    const cambio = CAMBIO(p), fisso = nottiDiFila(soggiorni, p.camera, p.data) >= 14;
    const cand = [];
    for (const r of regole) {
      if (r.quando !== "ripasso" && r.quando !== "cambio") continue;
      if (r.evento) continue;
      if (!luoghiDi(r, camere, luoghi, flags).some(x => x.id === l.id)) continue;
      if (!inStagione(r, p.data)) continue;
      if (r.quando === "cambio" && !cambio) continue;
      if (r.soloFissi && !fisso) continue;
      const reg = registro?.[chiaveRegistro(r.id, l.id)] || null;
      if (reg?.saltata === p.data && reg?.saltataPer === p.id) continue; // "non la posso fare" oggi: alla pulizia dopo
      const ogni = ogniAttuale(r, p.data, l, flags);
      const rapporto = ogni ? rapportoScadenza(r, reg?.ultima || null, p.data, ogni) : Infinity;
      if (ogni && rapporto < 0.9) continue;
      cand.push({ regola: r.id, nome: r.nome, come: r.come, controllo: r.controllo || "", icona: r.icona, minuti: r.minuti, euro: r.euro || 0, priorita: r.priorita || 2, sempre: !ogni, ogni, rapporto, ultima: reg?.ultima || null, luogo: l.id, luogoNome: l.nome, perche: perche(r, reg, p.data, ogni) });
    }
    cand.sort((a, b) => (b.sempre - a.sempre) || (b.rapporto - a.rapporto) || (a.priorita - b.priorita));
    const scelte = []; let min = 0, n = 0;
    for (const c of cand) {
      if (c.sempre) { scelte.push(c); continue; }
      if (n >= sg.rifiniturePerPulizia) continue;
      if (min + c.minuti > sg.minutiRifiniture) continue;
      if (minutiGiorno + min + c.minuti > sg.minutiGiorno) continue;
      scelte.push(c); min += c.minuti; n++;
    }
    minutiGiorno += min;
    out[p.id] = scelte;
  }
  // 2) le zone comuni della signora: alla prima pulizia del giorno (una "a ritmo" + quelle di ogni giorno)
  const prima = pulizie[0];
  const comuni = [];
  for (const r of regole) {
    if (r.quando !== "giornata" || r.evento) continue;
    for (const l of luoghiDi(r, camere, luoghi, flags)) {
      if (l.zona !== zona || !inStagione(r, iso)) continue;
      const reg = registro?.[chiaveRegistro(r.id, l.id)] || null;
      if (reg?.saltata === iso) continue;
      const ogni = ogniAttuale(r, iso, l, flags);
      const rapporto = ogni ? rapportoScadenza(r, reg?.ultima || null, iso, ogni) : Infinity;
      if (ogni > 1 && rapporto < 0.9) continue;
      if (ogni <= 1 && reg?.ultima === iso) continue;
      comuni.push({ regola: r.id, nome: r.nome, come: r.come, controllo: r.controllo || "", icona: r.icona, minuti: r.minuti, euro: r.euro || 0, priorita: r.priorita || 2, sempre: ogni <= 1, ogni, rapporto, ultima: reg?.ultima || null, luogo: l.id, luogoNome: l.nome, comune: true, perche: perche(r, reg, iso, ogni) });
    }
  }
  comuni.sort((a, b) => (b.sempre - a.sempre) || (b.rapporto - a.rapporto) || (a.priorita - b.priorita));
  const sceltiComuni = []; let n = 0;
  for (const c of comuni) { if (c.sempre) { sceltiComuni.push(c); continue; } if (n >= 1 || minutiGiorno + c.minuti > sg.minutiGiorno) continue; sceltiComuni.push(c); minutiGiorno += c.minuti; n++; }
  if (sceltiComuni.length) out[prima.id] = [...(out[prima.id] || []), ...sceltiComuni];
  return out;
}
export function rifiniturePer(p, ctx) { if (!NORMALE(p)) return []; return rifinitureDelGiorno(p.zona, p.data, ctx)[p.id] || []; }
function perche(r, reg, oggi, ogni) {
  const parti = [];
  if (!ogni) return [r.quando === "cambio" ? "a ogni cambio completo" : "a ogni pulizia"];
  parti.push(etichettaOgni(ogni));
  parti.push(reg?.ultima ? `ultima volta ${testoUltima(reg.ultima, oggi)}` : "mai registrata");
  return parti;
}

// ============================================================================
//  LE PROPOSTE DELLA SETTIMANA: solo le cose "a camera libera", gli eventi e i lavori "giorno"
//  ctx: { lun, oggi, camere, luoghi, soggiorni, pulizie, regole, registro, soglie, rinvii, flags }
// ============================================================================
export function proposteSettimana(ctx) {
  const { lun, oggi, camere, soggiorni, pulizie, registro, rinvii = {} } = ctx;
  const luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = ctx.regole || regoleAttive(null), sg = { ...SOGLIE_BASE, ...(ctx.soglie || {}) }, flags = ctx.flags || {};
  const fine = aggiungiGiorni(lun, 6);
  const giorniLavoro = []; for (let i = 0; i < 7; i++) { const g = aggiungiGiorni(lun, i); if (g >= oggi && giornoSettimana(g) !== 0) giorniLavoro.push(g); }
  const candidati = [];
  // minuti già impegnati dalle rifiniture dentro le pulizie, per signora e giorno
  const impegno = {};
  for (const g of giorniLavoro) for (const z of new Set(camere.map(c => c.zona))) { const m = rifinitureDelGiorno(z, g, ctx); impegno[`${z}|${g}`] = Object.values(m).flat().reduce((s, r) => s + (r.sempre ? 0 : r.minuti), 0); }
  for (const r of regole) {
    if (!(r.quando === "libera" || r.quando === "giorno")) continue;
    if (r.meteo && !r.stagione) continue; // solo meteo: aspetta il passo meteo
    if (!inStagione(r, lun) && !inStagione(r, fine)) continue;
    for (const l of luoghiDi(r, camere, luoghi, flags)) {
      const k = chiaveRegistro(r.id, l.id);
      const reg = registro?.[k] || null, ult = reg?.ultima || null;
      const giaInProgramma = Object.values(pulizie).some(p => p.origine === "governante" && p.regola === r.id && p.camera === l.id && p.stato !== "fatta" && p.data >= aggiungiGiorni(oggi, -14));
      if (giaInProgramma) continue;
      const rinvio = rinvii[k]; if (rinvio && rinvio.fino > fine) continue;
      const ogni = ogniAttuale(r, fine, l, flags);
      let rapporto = r.evento ? 0 : rapportoScadenza(r, ult, fine, ogni);
      if (r.stagione && ult && inStagione(r, ult) && giorniTra(ult, fine) < 300) continue;
      const perche = [];
      // gli eventi: soggiorno lungo che finisce questa settimana, oppure camera molto indietro
      let lungo = null, indietro = 0;
      if (r.evento) {
        lungo = soggiorni.find(s => s.camera === l.id && s.fine >= (lun > oggi ? lun : oggi) && s.fine <= fine && giorniTra(s.inizio, s.fine) >= 14) || null;
        indietro = regole.filter(x => !x.evento && x.ogni && (x.quando === "ripasso" || x.quando === "cambio" || x.quando === "libera") && luoghiDi(x, camere, luoghi, flags).some(y => y.id === l.id) && inStagione(x, oggi))
          .filter(x => { const u = registro?.[chiaveRegistro(x.id, l.id)]?.ultima || null; const rp = rapportoScadenza(x, u, oggi, ogniAttuale(x, oggi, l, flags)); return rp !== Infinity && rp >= 2; }).length;
        if (!lungo && indietro < 6) continue;
        if (lungo) perche.push(`${lungo.nome || "l'ospite"} ha dormito qui ${giorniTra(lungo.inizio, lungo.fine)} notti`);
        if (indietro >= 6) perche.push(`${indietro} rifiniture molto in ritardo`);
        rapporto = 99;
      } else {
        const prossima = ult && ogni ? aggiungiGiorni(ult, Math.round(ogni)) : null;
        if (prossima && aggiungiGiorni(prossima, -7) > fine) continue;
        if (rapporto !== Infinity && rapporto < 0.85) continue;
      }
      const nonPrima = (!r.evento && ult && ogni) ? (() => { const pr = aggiungiGiorni(ult, Math.round(ogni)); return pr > oggi ? aggiungiGiorni(pr, -7) : oggi; })() : oggi;
      let data = null;
      if (r.quando === "libera") {
        const vuoti = giorniLiberi(l, lun, soggiorni, pulizie, oggi).filter(g => g.iso >= nonPrima);
        if (!vuoti.length) continue;
        const g = vuoti[0]; data = g.iso; if (g.perche) perche.push(g.perche);
        if (g.prossimo) perche.push(`prossimo arrivo ${g.prossimo === aggiungiGiorni(g.iso, 1) ? "il giorno dopo" : "il " + g.prossimo.slice(8) + "/" + g.prossimo.slice(5, 7)}`);
      } else {
        let giorni = giorniLavoro.filter(g => g >= nonPrima);
        if (l.tipo === "casa") { const gp = giorni.filter(g => [2, 5].includes(giornoSettimana(g))); if (gp.length) giorni = gp; }
        giorni.sort((a, b) => cambiDelGiorno(pulizie, l.zona, a) - cambiDelGiorno(pulizie, l.zona, b) || (a < b ? -1 : 1));
        data = giorni[0]; if (!data) continue;
      }
      if (!r.evento) perche.unshift(ult ? `${etichettaOgni(ogni)} · ultima volta ${testoUltima(ult, oggi)}` : `${etichettaOgni(ogni)} · mai registrata`);
      if (r.stagione) perche.push("è il periodo giusto");
      candidati.push({ id: `${r.id}|${l.id}|${data}`, regola: r.id, nome: r.nome, cosa: r.nome, icona: r.icona, come: r.come, controllo: r.controllo || "", luogo: l.id, luogoNome: l.nome, luogoTipo: l.tipo, zona: l.zona, data, minuti: r.minuti, euro: r.euro || 0, grande: !!r.grande, libera: r.quando === "libera", priorita: r.priorita || 2, perche, rapporto: rapporto === Infinity ? 50 : rapporto, chiave: k });
    }
  }
  candidati.sort((a, b) => (b.rapporto - a.rapporto) || (a.priorita - b.priorita) || (a.data < b.data ? -1 : 1));
  const minuti = { ...impegno }, grandi = { n: 0 }, perLuogo = {}, perRegola = {}, scelte = [];
  let scartate = 0;
  for (const c of candidati) {
    if (scelte.length >= 8) { scartate++; continue; }
    if ((perLuogo[c.luogo] || 0) >= 2) { scartate++; continue; }
    if ((perRegola[c.regola] || 0) >= 3) { scartate++; continue; } // la stessa cosa al massimo tre volte a settimana (es. coperte: 3 camere per volta)
    perRegola[c.regola] = (perRegola[c.regola] || 0) + 1;
    if (c.grande) { // la pulizia a fondo completa fa eccezione ai 60 minuti: mezza giornata, al massimo N a settimana
      if (grandi.n >= sg.camereSettimana || scelte.some(s => s.grande && s.zona === c.zona && s.data === c.data) || cambiDelGiorno(pulizie, c.zona, c.data) > 1) { scartate++; continue; }
      grandi.n++; perLuogo[c.luogo] = (perLuogo[c.luogo] || 0) + 1; scelte.push(c); continue;
    }
    const kk = `${c.zona}|${c.data}`;
    if ((minuti[kk] || 0) + c.minuti > sg.minutiGiorno) {
      const alt = giorniLavoro.find(g => g !== c.data && (minuti[`${c.zona}|${g}`] || 0) + c.minuti <= sg.minutiGiorno && (c.luogoTipo !== "casa" || [2, 5].includes(giornoSettimana(g))) && (!c.libera || giorniLiberi(trovaLuogo(c.luogo, camere, luoghi), lun, soggiorni, pulizie, oggi).some(x => x.iso === g)));
      if (!alt) { scartate++; continue; }
      c.data = alt; c.id = `${c.regola}|${c.luogo}|${alt}`;
    }
    minuti[`${c.zona}|${c.data}`] = (minuti[`${c.zona}|${c.data}`] || 0) + c.minuti;
    perLuogo[c.luogo] = (perLuogo[c.luogo] || 0) + 1;
    scelte.push(c);
  }
  scelte.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0) || (a.zona < b.zona ? -1 : 1));
  const inRitardo = Object.values(pulizie).filter(p => p.origine === "governante" && p.stato !== "fatta" && p.data < oggi).sort((a, b) => a.data < b.data ? -1 : 1);
  return { proposte: scelte, scartate, inRitardo, impegno };
}
// (nome vecchio)
export const routinePer = rifiniturePer;

// ============================================================================
//  IL CALENDARIO DEL PULITO: per ogni luogo, tutte le regole con "ultima volta" e il colore
// ============================================================================
export function calendarioPulito(ctx) {
  const { camere, registro, oggi } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, flags = ctx.flags || {};
  const regole = (ctx.regole || regoleAttive(null)).filter(r => r.ogni > 1 && !r.evento);
  const tutti = [...camere, ...luoghi];
  return tutti.map(l => {
    const voci = regole.filter(r => luoghiDi(r, camere, luoghi, flags).some(x => x.id === l.id) && inStagione(r, oggi)).map(r => {
      const reg = registro?.[chiaveRegistro(r.id, l.id)] || null; const ogni = ogniAttuale(r, oggi, l, flags); const rapporto = rapportoScadenza(r, reg?.ultima || null, oggi, ogni);
      return { regola: r.id, nome: r.nome, cosa: r.nome, icona: r.icona, ogni, quando: r.quando, ultima: reg?.ultima || null, da: reg?.da || "", rapporto, colore: coloreScadenza(rapporto), testo: testoUltima(reg?.ultima || null, oggi) };
    }).sort((a, b) => (b.rapporto === Infinity ? 99 : b.rapporto) - (a.rapporto === Infinity ? 99 : a.rapporto));
    const peggio = voci[0] || null;
    const punteggio = voci.reduce((s, v) => s + Math.min(3, v.rapporto === Infinity ? 3 : v.rapporto), 0) / Math.max(1, voci.length);
    return { luogo: l.id, nome: l.nome, zona: l.zona, tipo: l.tipo, voci, peggio, punteggio, rossi: voci.filter(v => v.colore === "rosso").length, gialli: voci.filter(v => v.colore === "giallo").length, verdi: voci.filter(v => v.colore === "verde").length, mai: voci.filter(v => !v.ultima).length };
  }).sort((a, b) => b.punteggio - a.punteggio);
}

// La settimana che la governante prepara: quella in corso; da sabato alle 13 in poi, la prossima
export function settimanaGovernante(adesso = new Date()) {
  const p = partiRoma(adesso);
  const iso = aISO(new Date(Date.UTC(p.y, p.m - 1, p.d, 12)));
  const lun = lunediDi(iso);
  if (p.wd === 0 || (p.wd === 6 && p.h >= 13)) return aggiungiGiorni(lun, 7);
  return lun;
}

// ============================================================================
//  COPERTURA: quanto del catalogo si riesce a tenere in regola con le soglie attuali
//  Simula N settimane di pulizie come quelle in programma questa settimana (ripetute), applicando le
//  rifiniture come farebbe la governante, e conta quante voci restano in regola alla fine.
//  Serve a dire la verità: "con 60 minuti al giorno arrivi al 40%, con 120 al 65%".
// ============================================================================
export function simulaCopertura(ctx, settimane = 8) {
  const { camere, soggiorni = [] } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = ctx.regole || regoleAttive(null), flags = ctx.flags || {};
  const lun = ctx.lun || lunediDi(ctx.oggi);
  // le pulizie della settimana in corso, ripetute (stesso giorno della settimana) per N settimane
  const modello = Object.values(ctx.pulizie || {}).filter(p => p.data >= lun && p.data < aggiungiGiorni(lun, 7) && (p.origine === "auto" || p.origine === "mano" || !p.origine) && p.tipo !== "fondo");
  if (!modello.length) return null;
  const registro = {}; let minuti = 0, n = 0;
  const zone = [...new Set(camere.map(c => c.zona))];
  for (let w = 0; w < settimane; w++) for (let d = 0; d < 7; d++) {
    const iso = aggiungiGiorni(lun, w * 7 + d);
    const pul = {}; for (const p of modello) if (giornoSettimana(p.data) === giornoSettimana(iso)) { const id = `${iso}_${p.camera}`; pul[id] = { ...p, id, data: iso, stato: "da_fare" }; }
    if (!Object.keys(pul).length) continue;
    const sog = soggiorni.map(s => ({ ...s, inizio: aggiungiGiorni(s.inizio, w * 7), fine: aggiungiGiorni(s.fine, w * 7) }));
    for (const z of zone) { const m = rifinitureDelGiorno(z, iso, { ...ctx, oggi: iso, pulizie: pul, soggiorni: sog, registro }); for (const rf of Object.values(m)) for (const r of rf) { registro[chiaveRegistro(r.regola, r.luogo)] = { ultima: iso }; if (!r.sempre) { minuti += r.minuti; n++; } } }
  }
  const fine = aggiungiGiorni(lun, settimane * 7 - 1);
  const cal = calendarioPulito({ ...ctx, oggi: fine, registro });
  const voci = cal.flatMap(c => c.voci).filter(v => v.quando === "ripasso" || v.quando === "cambio" || v.quando === "giornata");
  const inRegola = voci.filter(v => v.colore !== "rosso").length;
  return { settimane, voci: voci.length, inRegola, mai: voci.filter(v => !v.ultima).length, percento: voci.length ? Math.round(inRegola / voci.length * 100) : 0, minutiSettimanaSignora: Math.round(minuti / settimane / zone.length), rifinitureSettimana: Math.round(n / settimane) };
}
