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
//    prodotto  il prodotto da usare (se non è scritto, lo ricava dal "come si fa")
//    note      avvertenze e scatti: "Mai acidi sul marmo", "Dopo un vento forte controlla anche se non è scaduta"…
//    codice    il numero della riga nella tabella di Michele (C01… B01… K01… E01… Z01… L01… M01… O01…), quando c'è
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

// Il prodotto si ricava dal "come si fa" (il primo che compare), più il colore del panno. Si può scrivere a mano con { prodotto: "…" }.
const FAMIGLIE_PRODOTTO = [
  [/anti-?muffa/i, "antimuffa"], [/anticalcare/i, "anticalcare"], [/sgrassatore per forni/i, "sgrassatore per forni"], [/sgrassatore/i, "sgrassatore delicato"],
  [/detergente vetri/i, "detergente vetri"], [/disinfettante/i, "disinfettante"], [/candeggina/i, "candeggina"], [/pulitore per lavatrice/i, "pulitore per lavatrice"],
  [/spugna magica/i, "spugna magica"], [/bicarbonato/i, "bicarbonato e aceto"], [/aceto/i, "aceto"], [/multiuso/i, "multiuso"], [/detersivo per fughe/i, "detersivo per fughe"],
  [/detersivo per pavimenti/i, "detersivo per pavimenti"], [/detersivo per piatti/i, "acqua e detersivo per piatti"], [/acqua bollente/i, "acqua bollente"], [/acqua saponata|acqua e sapone/i, "acqua e sapone"],
  [/spray igienizzante/i, "spray igienizzante"], [/limone/i, "acqua e limone"], [/lavatrice a \d+°|in lavatrice/i, "lavaggio in lavatrice"], [/sapone antitarme/i, "sapone antitarme"], [/goccia d'olio/i, "una goccia d'olio"],
];
export function prodottoDa(come = "", prodotto) {
  if (prodotto) return prodotto;
  const t = [];
  for (const [re, nome] of FAMIGLIE_PRODOTTO) { if (!re.test(come)) continue; if (nome === "aceto" && t.includes("bicarbonato e aceto")) continue; if (nome === "sgrassatore delicato" && t.includes("sgrassatore per forni")) continue; if (!t.includes(nome)) t.push(nome); if (t.length === 2) break; }
  const panno = (come.match(/panno (ROSSO|GIALLO|BLU|VERDE)/) || [])[1];
  const base = t.length ? t.join(" e ") : /panno|microfibra|aspira|scopa|spazzol/i.test(come) ? "nessuno (solo panno o aspirapolvere)" : "nessuno";
  return panno ? `${base} · panno ${panno}` : base;
}
export const PRIORITA_TESTO = { 1: "igiene", 2: "lo vede l'ospite", 3: "nascosto" };
const R = (id, gruppo, nome, dove, ogni, quando, minuti, euro, priorita, icona, come, controllo, extra = {}) => ({ id, gruppo, nome, dove, ogni, quando, minuti, euro, priorita, icona, come, controllo, ...extra, prodotto: prodottoDa(come, extra.prodotto) });

export const CATALOGO = [
  // ---- CAMERA --------------------------------------------------------------------------------
  R("specchi", "camera", "Specchi lucidati", "stanza", 0, "ripasso", 2, 0, 2, "finestra",
    "A ogni pulizia: spruzza il detergente vetri sul panno (non sullo specchio), passa a S e asciuga con un panno asciutto. Panno BLU.", "Guarda lo specchio di sbieco controluce: niente aloni né ditate."),
  R("davanzali", "camera", "Davanzali interni e polvere sulle finestre", "stanza", 7, "ripasso", 5, 1, 2, "finestra",
    "Panno BLU umido con il multiuso sui davanzali interni e sul bordo del telaio, poi asciuga. Togli briciole e insetti dagli angoli.", "Passa un dito sul davanzale: deve restare pulito."),
  R("telai_binari", "camera", "Telai e binari delle finestre", "stanza", 14, "ripasso", 10, 2, 2, "finestra",
    "Aspira i binari con la bocchetta sottile, poi passa uno spazzolino vecchio con il multiuso negli angoli e asciuga. Sgrassa il telaio con il panno BLU.", "Apri la finestra e guarda i binari: niente sabbia né terra negli angoli.", { strada: true, meteo: "vento", note: "Dopo un vento forte: controlla anche se non è scaduta." }),
  R("vetri_interni", "camera", "Vetri interni lavati bene", "stanza", 14, "ripasso", 10, 2, 2, "finestra",
    "Detergente vetri e tergivetro dall'alto in basso, bordi asciugati con un panno asciutto. (Ditate e macchie si tolgono a ogni pulizia, qui si lava tutto il vetro.)", "Controluce dall'interno: niente righe né aloni."),
  R("vetri_esterni", "camera", "Vetri esterni", "stanza", 30, "ripasso", 15, 3, 2, "finestra",
    "Dall'interno o dal balcone, con il tergivetro telescopico: acqua con due gocce di detersivo per piatti, poi tergivetro e panno asciutto sui bordi. Solo dove si arriva in sicurezza.", "Controluce dall'esterno: niente aloni né gocce secche.", { meteo: "pioggia" }),
  R("dietro_tv", "camera", "Dietro la TV, cavi e retro del mobile", "stanza", 14, "ripasso", 5, 1, 3, "armadio",
    "Spegni la TV. Panno BLU asciutto in microfibra dietro lo schermo, sui cavi e sul retro del mobile (la polvere ci si attacca per l'elettricità). Niente acqua vicino alle prese.", "Passa la mano dietro la TV: niente polvere sui cavi.", { uso: true }),
  R("tende_aspirate", "camera", "Tende scosse e aspirate", "stanza", 14, "ripasso", 5, 1, 2, "finestra",
    "Scuoti le tende con la finestra aperta, poi aspira dall'alto in basso con la spazzola morbida, davanti e dietro.", "Sbatti un lembo di tenda controluce: non deve alzarsi polvere."),
  R("sotto_letto", "camera", "Sotto il letto aspirato", "stanza", 7, "ripasso", 5, 1, 1, "letto",
    "Aspirapolvere con la bocchetta piatta fin sotto il letto, da tutti e due i lati, e sotto i comodini. Raccogli quello che trovi (calzini, caricabatterie: lasciali sul comodino).", "Torcia del telefono sotto il letto: niente batuffoli."),
  R("sopra_armadi", "camera", "Sopra gli armadi, i pensili e il frigo", "stanza", 30, "ripasso", 5, 1, 3, "armadio",
    "Con la scaletta: panno BLU umido sopra l'armadio (negli appartamenti anche sopra pensili e frigo), poi asciuga. Togli le cose dimenticate.", "Passa un dito sopra l'armadio: deve restare pulito.", { materiale: "mobili" }),
  R("battiscopa", "camera", "Battiscopa", "stanza", 14, "ripasso", 5, 1, 3, "armadio",
    "Panno BLU umido lungo tutti i battiscopa, anche dietro la porta e sotto il letto dove arrivi.", "Dito sul battiscopa dietro la porta: pulito."),
  R("porte_ditate", "camera", "Ditate sulla porta e intorno alla maniglia", "stanza", 0, "ripasso", 1, 0, 2, "porta",
    "A ogni pulizia: panno BLU umido sulle ditate intorno alla maniglia e sulla porta all'altezza delle mani, dentro e fuori.", "Zona della maniglia senza ditate.", { codice: "C18", materiale: "porte" }),
  R("porte", "camera", "Porte lavate (davanti, dietro, bordo sopra)", "stanza", 14, "ripasso", 5, 1, 2, "porta",
    "Panno BLU appena umido con il multiuso su tutte e due le facce della porta, sul bordo sopra e intorno alla maniglia; la scritta con il nome della stanza solo con il panno asciutto (è un adesivo). Maniglie disinfettate.", "Bordo sopra la porta e zona maniglia: niente polvere né ditate; scritta intera.", { codice: "C18", materiale: "porte", note: "La scritta con il nome sulla porta è un adesivo: mai strofinarla né bagnarla." }),
  R("lampade", "camera", "Lampade e abat-jour", "stanza", 14, "ripasso", 5, 1, 3, "finestra",
    "Luce spenta e fredda: panno BLU asciutto sui paralumi e sulle lampadine, umido sulle basi.", "Accendi la lampada: niente polvere che si vede sul paralume."),
  R("pareti_ditate", "camera", "Ditate e segni sulle pareti", "stanza", 14, "ripasso", 5, 1, 2, "porta",
    "Guarda le pareti vicino agli interruttori, alla porta e alla testiera: spugna magica o panno umido appena strizzato, senza strofinare forte.", "Zona interruttori e testiera: niente aloni scuri."),
  R("contatti", "camera", "Punti di contatto disinfettati: maniglie, interruttori, telecomando, pulsante del WC, rubinetti, phon, chiavi", "stanza", 7, "ripasso", 5, 1, 1, "lente",
    "Spruzza il disinfettante sul panno BLU (mai sugli interruttori) e passa telecomando, interruttori e prese, maniglie di porte e finestre, pulsante del WC, rubinetti, impugnatura del phon, chiavi e portachiavi.", "Telecomando pulito tra i tasti; maniglie non appiccicose."),
  R("plafoniere", "camera", "Plafoniere e angoli del soffitto (ragnatele)", "stanza", 30, "ripasso", 5, 1, 2, "finestra",
    "Con la scopa con il panno avvolto: angoli del soffitto, sopra le porte, intorno alla plafoniera. Plafoniera spenta: panno asciutto.", "Guarda in alto negli angoli: niente ragnatele."),
  R("quadri", "camera", "Quadri e cornici", "stanza", 30, "ripasso", 3, 1, 3, "finestra",
    "Panno BLU asciutto sulla cornice e sul bordo superiore, un passaggio leggero sul vetro.", "Dito sul bordo superiore della cornice: pulito."),
  R("fotomurale", "camera", "Pannello fotografico sopra il letto (la laguna)", "stanza", 30, "ripasso", 3, 1, 2, "finestra",
    "Solo panno asciutto in microfibra dall'alto in basso, leggero. Mai acqua, mai spray, mai spugna: la stampa si rovina. Guarda che gli angoli e le giunte non si stiano staccando.", "Pannello senza polvere e senza angoli sollevati.", { prodotto: "nessuno: solo panno asciutto", note: "Mai acqua né prodotti sul pannello fotografico. Angolo che si stacca: segnalalo." }),
  R("tappeti", "camera", "Tappeti e passatoie sbattuti e aspirati", "stanza", 7, "ripasso", 3, 1, 2, "scopa",
    "Tappeto davanti al letto e passatoia della cucina: sbattuti fuori (balcone o finestra), aspirati sopra e sotto, pavimento sotto passato.", "Alza il tappeto: niente briciole né sabbia sotto."),
  R("tappeti_lavati", "camera", "Tappeti e passatoie lavati", "stanza", 30, "cambio", 5, 1, 2, "scopa",
    "In lavatrice a 30-40° (leggi l'etichetta: quelli con il fondo in gomma a 30°), asciugati stesi, rimessi solo asciutti. Se è rovinato o scolorito, segnalalo.", "Tappeto senza macchie e senza odore."),
  R("portapane", "camera", "Portapane a serrandina sul piano", "stanza", 14, "ripasso", 2, 0.5, 3, "cucina",
    "Serrandina alzata: briciole via, dentro e fuori con il panno appena umido, asciugato; serrandina provata (deve scorrere).", "Dentro il portapane: niente briciole."),
  R("armadio_stoffa", "camera", "Armadio in stoffa (dove c'è)", "stanza", 30, "cambio", 5, 1, 3, "armadio",
    "A camera libera: cerniera aperta, aspirato dentro, sopra e sui ripiani con la spazzola; struttura passata con il panno; una macchia sulla stoffa con panno umido e poco sapone, poi asciugato.", "Dentro l'armadio in stoffa: niente polvere né odore di chiuso."),
  R("prese_ciabatte", "camera", "Prese, ciabatte e cavi spolverati", "stanza", 90, "ripasso", 5, 1, 3, "lente",
    "Panno BLU asciutto su prese, ciabatte e cavi dietro i comodini e la scrivania. Niente acqua.", "Ciabatta sotto la scrivania: niente polvere."),
  R("lampadari", "camera", "Lampadari", "stanza", 180, "ripasso", 10, 2, 3, "finestra",
    "Luce spenta e fredda, con la scaletta: panno asciutto in microfibra su ogni pezzo, poi umido sulle parti di metallo.", "Accendi la luce: lampadario senza polvere."),
  R("coprimaterasso_cambio", "camera", "Coprimaterasso e copricuscini puliti", "stanza", 0, "cambio", 5, 0, 1, "letto",
    "A ogni partenza si cambiano coprimaterasso e copricuscini (il copripiumino va con le lenzuola). Sempre, se macchiati.", "Solleva il lenzuolo: coprimaterasso senza macchie, angoli tesi."),
  R("coprimaterasso_fissi", "camera", "Coprimaterasso e copricuscini (ospite fisso)", "stanza", 21, "ripasso", 10, 2, 1, "letto",
    "Con gli ospiti che restano settimane: cambia coprimaterasso e copricuscini durante il ripasso, rifai il letto con le stesse lenzuola se sono pulite.", "Solleva il lenzuolo: coprimaterasso pulito.", { soloFissi: true, codice: "O03", note: "Con i tecnici fissi: nel weekend. Mai toccare la roba lasciata in camera; a volte tornano la domenica sera, quindi entro il sabato." }),
  R("coperta_scorta", "camera", "Coperta di scorta pulita nell'armadio", "stanza", 0, "cambio", 2, 0, 2, "coperta",
    "Controlla che nell'armadio ci sia una coperta di scorta pulita e piegata nel sacco.", "Apri l'armadio: coperta piegata e pulita."),
  R("controllo_lusso", "camera", "Controllo di lusso (5 minuti)", "stanza", 0, "cambio", 5, 0, 1, "lente",
    "A ogni cambio completo, prima di chiudere: sotto il letto, dentro cassetti e armadio, dietro la porta, dietro il WC, capelli negli scarichi, cestini lavati, telecomando-interruttori-maniglie disinfettati.", "Apri un cassetto a caso e guarda dietro il WC: come nuovi.", { domanda: true, note: "Standard di lusso: a ogni partenza. Entra nella domanda finale della signora." }),
  R("aria_odori", "camera", "Aria e odori", "stanza", 0, "ripasso", 2, 0, 2, "aria",
    "Finestra aperta mentre pulisci. Annusa cestini, scarichi e tessuti: a fine pulizia la camera deve sapere di pulito, non di profumo. Chiudi solo alla fine.", "Entra a camera chiusa: nessun odore di chiuso, fumo o fogna.", { codice: "C54", note: "Odore di chiuso o di fumo che non va via: segnalalo come problema → sanificazione (Lavori di manutenzione)." }),
  R("luci_lampadine", "camera", "Luci e lampadine", "stanza", 0, "ripasso", 1, 0, 2, "finestra",
    "Accendi tutte le luci: plafoniera, abat-jour, specchio, bagno, lampada del balcone. Tutte devono funzionare. Spegni e via.", "Accendi tutto: nessuna lampadina spenta o che sfarfalla.", { codice: "C55", note: "Lampadina fulminata: segnala il problema, la cambia la manutenzione. Mai lasciare una camera con una luce che non va." }),
  R("dentro_armadi", "camera", "Dentro armadi, comodini e cassetti (ripiani, asta, grucce, guide)", "stanza", 14, "cambio", 10, 2, 2, "armadio",
    "Solo a camera libera (mai toccare la roba degli ospiti): svuota, aspira le briciole, panno BLU umido dentro, sui ripiani e nelle guide dei cassetti, asciuga, rimetti grucce e carta; anche dentro i comodini e il mobile della TV.", "Apri due cassetti e l'armadio: niente briciole né capelli.", { materiale: "mobili" }),
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
  R("tende_lavate", "camera", "Tende lavate", "stanza", 90, "libera", 40, 8, 2, "finestra",
    "Stacca le tende, lavaggio delicato a 30-40° (leggi l'etichetta), riappendile umide così si stirano da sole. Tende pesanti: ogni 6 mesi. Subito se c'è odore di fumo.", "Annusa e guarda le tende controluce: profumo di pulito, niente aloni.", { stagioneLunga: 180 }),
  // --- aggiunte per la mappa delle superfici (camera) ---
  R("camera_base", "camera", "Pulizia normale della camera", "stanza", 0, "ripasso", 0, 0, 1, "scopa",
    "Quello che si fa a ogni pulizia: letto rifatto, superfici a vista spolverate, pavimento spazzato e lavato con il prodotto giusto per quel pavimento (vedi sotto), cestini, bagno. (È la pulizia pagata come camera.)", "La camera a vista: in ordine, senza polvere, pavimento pulito e senza aloni.", { materiale: "pavimento" }),
  R("testiera", "camera", "Testiera del letto (davanti e sopra)", "stanza", 7, "ripasso", 3, 1, 2, "letto",
    "Panno BLU umido sulla testiera davanti e sul bordo sopra; se è imbottita, aspirala con la spazzola.", "Dito sul bordo sopra della testiera: pulito.", { materiale: "mobili" }),
  R("struttura_letto", "camera", "Struttura e piedini del letto", "stanza", 30, "cambio", 5, 1, 3, "letto",
    "Letto sfatto: panno umido su struttura, bordi e piedini; aspira la polvere sulle traverse.", "Piedini del letto senza batuffoli.", { materiale: "mobili" }),
  R("doghe", "camera", "Doghe del letto aspirate", "stanza", 90, "cambio", 5, 1, 3, "letto",
    "Materasso sollevato di lato: aspira le doghe e il telaio, controlla che nessuna doga sia rotta.", "Doghe senza polvere, nessuna rotta."),
  R("copriletto", "camera", "Copriletto lavato", "stanza", 30, "cambio", 5, 2, 2, "coperta",
    "Copriletto in lavatrice secondo l'etichetta e rimesso solo asciutto; se macchiato, subito.", "Copriletto senza macchie né odori."),
  R("comodini", "camera", "Comodini sopra e abat-jour", "stanza", 0, "ripasso", 2, 0, 2, "armadio",
    "A ogni pulizia: panno BLU umido sopra i comodini (sposta le cose dell'ospite e rimettile uguali), base dell'abat-jour, interruttore disinfettato.", "Sopra il comodino: niente aloni di bicchieri.", { codice: "C35" , materiale: "mobili" }),
  R("comodini_dentro", "camera", "Comodini dentro e dietro", "stanza", 14, "cambio", 3, 1, 3, "armadio",
    "A camera libera: cassetto e vano del comodino svuotati e passati con il panno BLU umido, poi asciugati; comodino scostato e aspirato dietro.", "Apri il cassetto del comodino: niente briciole né capelli.", { codice: "C35" , materiale: "mobili" }),
  R("armadio_ante", "camera", "Ante dell'armadio fuori e maniglie", "stanza", 14, "ripasso", 5, 1, 2, "armadio",
    "Panno BLU appena umido con il multiuso sulle ante fuori (ditate intorno alle maniglie), subito asciugate; maniglie disinfettate. I mobili sono in laminato chiaro: mai acqua che cola sui bordi, si gonfiano.", "Zona delle maniglie senza ditate; bordi delle ante asciutti.", { note: "Mobili in laminato: panno strizzato bene, mai acqua sui bordi e sugli spigoli." , materiale: "mobili" }),
  R("sotto_mobili", "camera", "Sotto armadio, cassettiera e scrivania", "stanza", 30, "ripasso", 5, 1, 3, "armadio",
    "Bocchetta piatta dell'aspirapolvere sotto l'armadio, la cassettiera e la scrivania, fin dove arriva.", "Torcia sotto l'armadio: niente batuffoli."),
  R("scrivania", "camera", "Scrivania e sedie", "stanza", 7, "ripasso", 3, 1, 2, "armadio",
    "Piano della scrivania passato (sposta e rimetti le cose dell'ospite), sedie: seduta, schienale e gambe con il panno BLU.", "Piano e sedie senza polvere né briciole.", { materiale: "mobili" }),
  R("tv_schermo", "camera", "Schermo della TV", "stanza", 7, "ripasso", 2, 0.5, 2, "finestra",
    "TV spenta e fredda: panno in microfibra asciutto, movimenti leggeri, mai spruzzare sullo schermo.", "Schermo spento senza ditate né aloni."),
  R("minibar", "camera", "Frigo in camera dentro, a ogni partenza", "camera", 0, "cambio", 3, 0, 1, "frigo",
    "A ogni partenza: cibi lasciati via, dentro con acqua e bicarbonato, asciugato, porta chiusa bene. Vale solo per le camere segnate con il frigo (in Regole).", "Frigo che non puzza, niente briciole sul ripiano.", { soloFrigo: true, codice: "C45" }),
  R("minibar_guarnizione", "camera", "Frigo in camera: guarnizione", "camera", 14, "ripasso", 2, 0.5, 1, "frigo",
    "Spazzolino con acqua e bicarbonato nelle pieghe della guarnizione, asciuga; controlla che la porta chiuda bene.", "Pieghe della guarnizione bianche.", { soloFrigo: true, codice: "C45" }),
  R("minibar_retro", "camera", "Frigo in camera: retro e sotto", "camera", 90, "ripasso", 5, 1, 3, "frigo",
    "Frigo staccato e scostato: griglia dietro aspirata, pavimento sotto passato, rimesso a posto e riacceso.", "Torcia dietro il frigo: niente polvere sulla griglia.", { soloFrigo: true, codice: "C45" }),
  R("bollitore", "camera", "Bollitore e tazze", "stanza", 7, "ripasso", 3, 1, 1, "cucina",
    "Bollitore sciacquato dentro e passato fuori, tazze e cucchiaini lavati, bustine controllate.", "Dentro il bollitore: niente residui."),
  R("bollitore_calcare", "camera", "Bollitore decalcificato", "stanza", 30, "ripasso", 5, 1, 1, "cucina",
    "Acqua e aceto a metà, fai bollire, lascia 20 minuti, sciacqua tre volte.", "Resistenza del bollitore senza calcare bianco."),
  R("appendiabiti", "camera", "Appendiabiti, ganci e portachiavi", "stanza", 14, "ripasso", 2, 0.5, 3, "porta",
    "Appendiabiti dietro la porta, ganci e portachiavi passati con il panno umido.", "Ganci senza polvere."),
  R("ventilatore", "camera", "Ventilatore: pale e griglia", "stanza", 30, "ripasso", 5, 1, 2, "aria",
    "Ventilatore staccato: griglia e pale con il panno umido (polvere nera), asciuga prima di riaccendere.", "Pale pulite, niente polvere che vola quando parte.", { stagione: { da: "05-01", a: "09-30" } }),
  R("pavimento_angoli", "camera", "Angoli del pavimento e dietro la porta", "stanza", 7, "ripasso", 3, 1, 2, "scopa",
    "Bocchetta piatta negli angoli, dietro la porta e lungo i battiscopa dove la scopa non arriva.", "Angoli senza righe di polvere.", { materiale: "pavimento" }),
  R("pavimento_fughe", "camera", "Fughe del pavimento", "stanza", 90, "ripasso", 15, 3, 3, "scopa",
    "Spazzolone con detersivo per fughe (o bicarbonato e acqua calda), strofina lungo le fughe, risciacqua. Sul marmo niente acidi.", "Fughe dello stesso colore ovunque.", { prodotto: "detersivo per fughe (o bicarbonato e acqua calda)", note: "Mai acidi (anticalcare, aceto) sul marmo: lo macchiano per sempre." }),
  R("zerbino_camera", "camera", "Zerbino della camera", "stanza", 14, "ripasso", 2, 0.5, 3, "porta",
    "Zerbino davanti alla porta sbattuto e aspirato sotto.", "Sotto lo zerbino: niente sabbia."),
  R("targhette", "camera", "Cartelli, targhette e numero della camera", "stanza", 30, "ripasso", 2, 0.5, 3, "porta",
    "Targhetta del numero, cartelli dentro la camera e cornice delle istruzioni passati con il panno umido.", "Targhetta lucida, cartelli dritti."),
  R("quadri_retro", "camera", "Retro dei quadri e degli specchi", "stanza", 180, "ripasso", 5, 1, 3, "finestra",
    "Stacca il quadro o guarda dietro con la torcia: aspira il retro e il muro dietro, ricontrolla il gancio.", "Dietro il quadro: niente ragnatele."),
  R("porta_stipite", "camera", "Stipite, cardini e serratura della porta", "stanza", 30, "ripasso", 3, 1, 3, "porta",
    "Panno umido sullo stipite e sul bordo della porta, cardini spolverati, serratura passata (una goccia d'olio se cigola).", "Stipite in alto senza polvere, porta che non cigola.", { materiale: "porte" }),
  R("davanzale_esterno", "camera", "Davanzale esterno", "stanza", 14, "ripasso", 3, 1, 2, "finestra",
    "Finestra aperta: spazzola via sabbia e foglie, panno umido sul davanzale esterno.", "Davanzale fuori senza sabbia né escrementi di uccelli.", { meteo: "vento", note: "Dopo un vento forte: controlla anche se non è scaduta." }),
  R("tapparelle", "camera", "Tapparelle: stecche e cinghia", "stanza", 30, "ripasso", 10, 2, 2, "finestra",
    "Tapparella abbassata a metà: panno umido sulle stecche dentro e, dalla finestra, fuori dove arrivi; prova la cinghia.", "Stecche senza polvere grigia, cinghia che scorre."),
  R("tapparelle_cassonetto", "camera", "Cassonetto della tapparella aspirato", "stanza", 180, "ripasso", 5, 1, 3, "finestra",
    "Apri il cassonetto e aspira la polvere e gli insetti; richiudi bene.", "Dentro il cassonetto: niente polvere accumulata."),
  R("zanzariere", "camera", "Zanzariere: rete e telaio", "stanza", 30, "ripasso", 5, 1, 2, "finestra",
    "Rete aspirata con la spazzola o passata con la spugna e acqua saponata, telaio con il panno umido.", "Controluce: rete pulita, niente peluria.", { stagione: { da: "04-01", a: "10-31" } }),
  R("tende_bastone", "camera", "Bastone o binario delle tende", "stanza", 30, "ripasso", 3, 1, 3, "finestra",
    "Con la scaletta: panno asciutto sul bastone o nel binario delle tende e sugli anelli.", "Dito sul bastone: pulito."),
  R("termosifone_polvere", "camera", "Termosifone spolverato (davanti, dietro, sopra)", "stanza", 14, "ripasso", 3, 1, 2, "termo",
    "Spazzola lunga tra gli elementi, panno umido sopra e davanti; dietro con la spazzola piatta.", "Dietro il termosifone: niente polvere grigia.", { stagione: { da: "10-01", a: "04-30" } }),
  R("biancheria_luce", "camera", "Lenzuola controllate alla luce", "stanza", 0, "cambio", 2, 0, 1, "lente",
    "Prima di fare il letto: lenzuola, federe e copripiumino guardati alla luce della finestra (macchie, pelucchi, capelli) e annusati. Se c'è un dubbio, cambia.", "Lenzuola: bianche, senza pelucchi, profumate."),
  R("arrivo_ferma", "camera", "Camera ferma da 2+ giorni: rinfresco prima dell'arrivo", "stanza", 0, "giorno", 10, 2, 2, "porta",
    "Quando una camera resta vuota 2 o più giorni e arriva un ospite: finestra aperta 10 minuti, acqua fatta scorrere in tutti gli scarichi (lavandino, doccia, bidet, WC), polvere a vista, letto e asciugamani controllati, luci provate.", "Scarichi senza odore, niente polvere sul comodino, aria fresca.", { evento: "arrivo", codice: "O02", note: "Vale solo per le camere che restano vuote 2 o più giorni tra una partenza e un arrivo." }),
  // --- aggiunte per la mappa delle superfici (bagno) ---
  R("bagno_base", "bagno", "Pulizia normale del bagno", "bagno", 0, "ripasso", 0, 0, 1, "doccia",
    "Quello che si fa a ogni pulizia: lavandino, WC, bidet, doccia, specchio, mensole, pavimento, asciugamani. (È la pulizia pagata come camera.)", "Bagno a vista: lucido, asciutto, senza capelli.", { note: "Panno ROSSO solo per il WC. Mop del bagno diverso da quello della camera." }),
  R("dotazioni_bagno", "bagno", "Dotazioni del bagno complete", "bagno", 0, "ripasso", 2, 0, 2, "lista",
    "A ogni pulizia: carta igienica (più un rotolo di scorta), sapone e doccia-shampoo, bicchieri puliti, asciugamani del numero giusto, phon, sacchetti igienici, carta del bidet.", "Apri il mobiletto: c'è la scorta di carta e sapone.", { codice: "B38", domanda: true, note: "Entra nella domanda finale della signora." }),
  R("asciugamani_luce", "bagno", "Asciugamani controllati alla luce", "bagno", 0, "cambio", 2, 0, 1, "lente",
    "Prima di appenderli: ogni asciugamano guardato alla luce (macchie, pelucchi, capelli, orli sfilacciati) e annusato. Se c'è un dubbio, cambia.", "Asciugamani: bianchi, soffici, senza pelucchi.", { codice: "B37" }),
  R("scarico_pavimento", "bagno", "Scarico a pavimento (piletta del bagno)", "bagno", 7, "ripasso", 3, 1, 1, "doccia",
    "Alza la griglia: capelli e sporco via con la pinzetta, spazzolino con bicarbonato e poco aceto, un bollitore d'acqua bollente, griglia lavata e rimessa.", "Griglia alzata: niente capelli né nero; niente odore.", { codice: "B35" }),
  R("scarichi_odori", "bagno", "Odori dagli scarichi", "bagno", 14, "ripasso", 3, 1, 1, "doccia",
    "Mezzo bicchiere di bicarbonato e uno di aceto in ogni scarico (lavandino, bidet, doccia), 10 minuti, poi acqua calda. Se puzza di fogna, segnalalo.", "Naso sopra gli scarichi: nessun odore.", { codice: "B36", note: "Camera vuota da 2 o più giorni: prima dell'arrivo fai scorrere l'acqua in tutti gli scarichi (i sifoni asciutti puzzano)." }),
  R("soffitto_bagno_muffa", "bagno", "Soffitto del bagno: angoli e muffa", "bagno", 14, "ripasso", 3, 1, 1, "doccia",
    "Guarda gli angoli del soffitto sopra la doccia: se ci sono puntini neri, anti-muffa sul panno (non spruzzare in alto), lascia agire, asciuga.", "Angoli del soffitto bianchi."),
  R("aspiratore", "bagno", "Griglia dell'aspiratore", "bagno", 30, "ripasso", 3, 1, 2, "aria",
    "Griglia dell'aspiratore aspirata e passata con il panno umido; se si stacca, lavala.", "Griglia senza polvere grigia."),
  R("scaldasalviette", "bagno", "Termosifone o scaldasalviette del bagno", "bagno", 14, "ripasso", 3, 1, 2, "termo",
    "Termosifone spento: panno umido tra gli elementi, davanti, dietro e sopra; spazzola lunga dove non arriva la mano. Se c'è la ruggine non strofinare: segnalala.", "Tra gli elementi: niente polvere grigia.", { note: "Ruggine sul termosifone in ghisa: va carteggiato e riverniciato → Lavori di manutenzione, non spugna." }),
  R("dispenser_carta", "bagno", "Dispenser grande della carta igienica", "bagno", 14, "ripasso", 2, 0.5, 1, "doccia",
    "Coperchio aperto: dentro e fuori con il panno umido e il disinfettante, rotolo di scorta dentro, coperchio richiuso e lucidato fuori.", "Dispenser pulito fuori, rotolo dentro.", { codice: "B38" }),
  R("accappatoi", "bagno", "Accappatoi cambiati", "bagno", 0, "cambio", 2, 0, 1, "coperta",
    "A ogni partenza l'accappatoio va in lavanderia e se ne appende uno pulito; con un ospite fisso si cambia ogni settimana insieme agli asciugamani. Guardalo alla luce prima di appenderlo.", "Accappatoio pulito e asciutto sul gancio.", { note: "Con i tecnici fissi: cambiato ogni settimana con gli asciugamani." }),
  R("finestrella_bagno", "bagno", "Finestrella del bagno (telaio in legno)", "bagno", 30, "ripasso", 3, 1, 3, "finestra",
    "Vetro con il detergente vetri; telaio in legno solo con il panno appena umido e subito asciugato (mai bagnarlo); davanzale e ragnatele negli angoli.", "Vetro pulito, telaio asciutto, niente ragnatele.", { note: "Telaio in legno: mai acqua, si gonfia e si scrosta." }),
  R("piastrelle_pareti", "bagno", "Piastrelle delle pareti del bagno", "bagno", 30, "ripasso", 10, 2, 2, "doccia",
    "Panno GIALLO con il multiuso sulle piastrelle fuori dalla doccia, dall'alto in basso; asciuga.", "Piastrelle senza schizzi di dentifricio."),
  R("troppopieno", "bagno", "Troppopieno e piletta del lavandino", "bagno", 30, "ripasso", 3, 1, 1, "doccia",
    "Spazzolino nel troppopieno con bicarbonato e poco aceto, poi acqua bollente; piletta smontata e lavata.", "Troppopieno senza odore né nero."),
  R("mobiletto_bagno", "bagno", "Mobiletto del lavandino dentro e fuori, mensole", "bagno", 30, "ripasso", 5, 1, 2, "armadio",
    "Ante fuori e dentro con il panno GIALLO umido, ripiani svuotati e passati, mensole passate.", "Dentro il mobiletto: asciutto, niente aloni.", { materiale: "mobili" }),
  R("dispenser", "bagno", "Dispenser del sapone e accessori riempiti e puliti", "bagno", 7, "ripasso", 2, 0.5, 2, "doccia",
    "Dispenser riempito, beccuccio pulito, esterno passato; bicchiere e portaspazzolino lavati e sanificati.", "Beccuccio senza sapone secco; bicchiere trasparente."),
  R("wc_tavoletta", "bagno", "Tavoletta del WC (sopra, sotto, cerniere)", "bagno", 7, "ripasso", 3, 1, 1, "doccia",
    "Tavoletta alzata: disinfettante sopra, sotto e nelle cerniere (si sporcano sempre), panno ROSSO. Se si stacca, smontala.", "Cerniere della tavoletta pulite."),
  R("wc_sotto_bordo", "bagno", "WC sotto il bordo e bordo interno", "bagno", 7, "ripasso", 3, 1, 1, "doccia",
    "Anticalcare sotto il bordo del WC, 10 minuti, spazzolino sotto il bordo e nei fori, tira l'acqua.", "Specchietto sotto il bordo: niente calcare giallo."),
  R("wc_cassetta", "bagno", "Cassetta del WC (esterna) e pulsante", "bagno", 14, "ripasso", 2, 0.5, 2, "doccia",
    "Rotoli di scorta tolti, sopra, davanti e dietro la cassetta con il panno ROSSO umido, tubo flessibile passato, pulsante o leva disinfettati; rotoli rimessi (asciutti).", "Sopra la cassetta: niente polvere; pulsante pulito."),
  R("accessori_bagno", "bagno", "Portarotolo, portasciugamani e ganci", "bagno", 7, "ripasso", 3, 1, 2, "doccia",
    "Portarotolo, portasciugamani, ganci e maniglioni passati con il panno GIALLO e disinfettati.", "Portarotolo senza polvere sopra."),
  R("box_doccia_tergivetro", "bagno", "Box doccia: asciugato a ogni pulizia", "bagno", 0, "ripasso", 1, 0, 2, "doccia",
    "A ogni pulizia, dopo aver sciacquato: le ante del box asciugate dall'alto in basso (tergivetro sul vetro, panno GIALLO sul soffietto in PVC), così calcare e muffa non si attaccano. Ante lasciate aperte.", "Ante del box senza gocce secche.", { codice: "B24", materiale: "box" }),
  R("box_doccia_vetro", "bagno", "Box doccia: ante dentro con l'anticalcare", "bagno", 7, "ripasso", 5, 1, 2, "doccia",
    "Anticalcare sulle ante dentro, 5 minuti; sul soffietto in PVC spazzolino morbido dentro le pieghe, sul vetro spugna non graffiante; sciacqua e asciuga. Mai abrasivi.", "Ante del box pulite controluce, pieghe senza nero.", { codice: "B24", materiale: "box", note: "Mai spugne abrasive: rigano il vetro e opacizzano il PVC." }),
  R("box_doccia_fuori", "bagno", "Box doccia: ante fuori e maniglia", "bagno", 14, "ripasso", 3, 1, 2, "doccia",
    "Panno GIALLO con il multiuso sulle ante fuori, sulla maniglia e sul bordo alto; asciuga.", "Fuori del box senza ditate né aloni.", { codice: "B24", materiale: "box" }),
  R("box_doccia_binari", "bagno", "Profili e guide del box doccia", "bagno", 14, "ripasso", 5, 1, 2, "doccia",
    "Spazzolino con anticalcare nei binari delle ante e sui profili di alluminio, sciacqua, asciuga.", "Binari delle ante senza calcare né nero."),
  R("tenda_doccia", "bagno", "Tenda della doccia lavata", "bagno", 30, "ripasso", 10, 2, 1, "doccia",
    "Se c'è la tenda: in lavatrice a 40° con un asciugamano e bicarbonato, riappesa aperta. Se è rovinata, nuova. Se non c'è, spegni la regola.", "Tenda senza puntini neri in basso."),
  R("tappetino_doccia", "bagno", "Tappetino antiscivolo della doccia", "bagno", 7, "ripasso", 3, 1, 1, "doccia",
    "Tappetino antiscivolo tolto, strofinato sotto con anticalcare, sciacquato e appeso ad asciugare.", "Sotto il tappetino: niente nero."),
  R("tappetini_bagno", "bagno", "Tappetino del bagno cambiato", "bagno", 0, "cambio", 2, 0, 1, "coperta",
    "A ogni cambio completo: il tappetino (o l'asciugamano usato a terra) va in lavanderia e se ne mette uno pulito e asciutto davanti alla doccia.", "Tappetino pulito e asciutto, senza impronte."),
  // --- aggiunte per la mappa delle superfici (cucina) ---
  R("pensili_ante", "cucina", "Ante dei pensili fuori e maniglie", "cucina", 14, "ripasso", 5, 1, 2, "armadio",
    "Sgrassatore sul panno VERDE, ante fuori (soprattutto vicino ai fornelli) e maniglie.", "Ante vicino ai fornelli non appiccicose.", { materiale: "mobili" }),
  R("cappa_esterno", "cucina", "Cappa fuori e sotto", "cucina", 14, "ripasso", 5, 1, 2, "cucina",
    "Sgrassatore sulla cappa fuori e sulla parte sotto intorno ai filtri, panno VERDE, asciuga.", "Sotto la cappa: niente grasso appiccicoso."),
  R("fornelli_fondo", "cucina", "Fornelli a fondo: griglie, spartifiamma, manopole, sotto le griglie", "cucina", 30, "ripasso", 15, 3, 1, "cucina",
    "Griglie e spartifiamma in ammollo con sgrassatore, manopole sfilate e lavate, piano sotto le griglie sgrassato, tutto asciugato e rimontato.", "Spartifiamma senza incrostazioni, fiamma blu e regolare."),
  R("sotto_lavello", "cucina", "Sotto il lavello e sifone", "cucina", 30, "ripasso", 5, 1, 3, "cucina",
    "Mobile sotto il lavello svuotato, panno VERDE umido dentro, sifone controllato che non goccioli.", "Sotto il lavello: asciutto e pulito."),
  R("lavastoviglie_partenza", "cucina", "Lavastoviglie a ogni partenza", "cucina", 0, "cambio", 3, 0, 1, "cucina",
    "A ogni partenza: svuotata, filtro sciacquato sotto l'acqua, guarnizione passata, sportello lasciato aperto a fessura.", "Dentro vuota e asciutta, filtro pulito.", { codice: "K07" }),
  R("lavastoviglie_esterno", "cucina", "Lavastoviglie: guarnizione, cestelli, esterno", "cucina", 14, "ripasso", 5, 1, 1, "cucina",
    "Guarnizione dello sportello passata, cestelli sciacquati, esterno e maniglia sgrassati.", "Guarnizione senza nero, sportello che non puzza.", { codice: "K07" }),
  R("frigo_partenza", "cucina", "Frigo a ogni partenza", "cucina", 0, "cambio", 3, 0, 1, "frigo",
    "A ogni partenza: cibi degli ospiti via, ripiani passati con il panno VERDE umido, odori controllati, porta chiusa bene. (Il lavaggio completo è un'altra regola.)", "Frigo vuoto e senza odore.", { codice: "K08" }),
  R("frigo_ripiani", "cucina", "Frigo: ripiani e cassetti lavati", "cucina", 14, "cambio", 10, 2, 1, "frigo",
    "Ad appartamento libero: cibi lasciati via, ripiani e cassetti lavati con acqua e bicarbonato, asciugati.", "Frigo vuoto, pulito e senza odori.", { codice: "K08" }),
  R("inventario_stoviglie", "cucina", "Inventario delle stoviglie a ogni partenza", "cucina", 0, "cambio", 5, 0, 2, "lista",
    "A ogni partenza: conta piatti, bicchieri, posate, pentole e tazze secondo la lista dell'appartamento; segna cosa manca o è rotto nella nota della pulizia.", "Confronta con la lista: tutto c'è, niente di sbeccato.", { codice: "K15", domanda: true, note: "Entra nella domanda finale della signora." }),
  R("bidoni_calendario", "cucina", "Bidoni fuori secondo il calendario di Lesina", "cucina", 0, "ripasso", 2, 0, 1, "bidone",
    "A ogni pulizia: bidoni svuotati con il sacchetto nuovo, differenziata giusta, e il bidone del giorno messo fuori secondo il calendario di Lesina (lo vedi in alto nel foglio della pulizia).", "Bidone giusto fuori, gli altri vuoti e con il sacchetto.", { codice: "K12", note: "Le signore mettono fuori i bidoni secondo il calendario di Lesina." }),
  R("microonde_fondo", "cucina", "Microonde a fondo: piatto e dentro", "cucina", 14, "ripasso", 5, 1, 1, "cucina",
    "Una tazza d'acqua con limone 3 minuti al massimo, poi panno VERDE dentro; piatto girevole lavato.", "Dentro il microonde: niente schizzi secchi."),
  R("moka", "cucina", "Moka e bollitore dell'appartamento", "cucina", 14, "ripasso", 5, 1, 2, "cucina",
    "Moka smontata e lavata solo con acqua calda, guarnizione controllata; bollitore sciacquato.", "Moka senza fondi vecchi."),
  R("tavolo_sedie", "cucina", "Tavolo e sedie", "cucina", 7, "ripasso", 5, 1, 2, "armadio",
    "Tavolo sopra e bordi, sedie: seduta, schienale e gambe con il panno VERDE.", "Sedie senza briciole sotto la seduta.", { materiale: "mobili" }),
  R("bidoni_cucina", "cucina", "Bidoni della differenziata lavati a fondo", "cucina", 14, "ripasso", 5, 1, 1, "bidone",
    "Bidoni e coperchi lavati dentro e fuori con sgrassatore, asciugati aperti.", "Bidoni aperti che non puzzano."),
  R("fondo_completa", "camera", "Pulizia a fondo completa", "stanza", 0, "libera", 180, 40, 1, "stella",
    "Mezza giornata a camera libera: tutte le rifiniture del catalogo in una volta, letto e mobili spostati, materasso girato, cuscini e piumone lavati, armadi dentro e sopra, vetri dentro e fuori, pareti lavate dove serve.", "Fai il giro con la lista del catalogo: ogni voce deve essere a posto.", { evento: true, grande: true, ogniEvento: 180, codice: "C57", note: "Ogni 6 mesi, oppure dopo un soggiorno di 2 o più settimane, oppure quando la camera è molto indietro." }),

  // ---- BAGNO ----------------------------------------------------------------------------------
  R("doccia_muffa", "bagno", "Doccia e silicone anti-muffa", "bagno", 3.5, "ripasso", 5, 1, 1, "doccia",
    "Spruzza l'anti-muffa su silicone, fughe della doccia e angoli; lascia agire 10 minuti mentre fai il resto; sciacqua. Panno GIALLO. Lascia il box aperto.", "Guarda il silicone in basso negli angoli: bianco, niente puntini neri.", { meteo: "umidita" }),
  R("scarichi", "bagno", "Scarichi e sifone con acqua bollente", "bagno", 7, "ripasso", 3, 1, 1, "doccia",
    "Togli i capelli dalla griglia della doccia e del lavandino con la pinzetta, poi un bollitore d'acqua bollente in ogni scarico.", "L'acqua del lavandino scende subito, senza gorgogliare."),
  R("spazzolino_wc", "bagno", "Spazzolino del WC sanificato", "bagno", 7, "ripasso", 2, 0.5, 1, "doccia",
    "Spazzolino nel WC con candeggina 10 minuti, sciacqua, lascia asciugare incastrato sotto la tavoletta prima di rimetterlo nel bicchiere. Bicchiere lavato. Guanti e panno ROSSO.", "Bicchiere dello spazzolino: asciutto e senza fondo scuro."),
  R("scopino_nuovo", "bagno", "Scopino del WC sostituito", "bagno", 90, "ripasso", 2, 0, 1, "doccia",
    "Ogni 3 mesi lo scopino si butta e si mette nuovo (anche se sembra pulito). Scrivi a Michele se mancano le scorte.", "Scopino con le setole bianche e dritte."),
  R("dietro_wc", "bagno", "Dietro e intorno al WC e al bidet", "bagno", 7, "ripasso", 5, 1, 1, "doccia",
    "Sgrassatore e panno ROSSO dietro il WC e il bidet, sul tubo, sulle basi e sul pavimento intorno; poi disinfettante. Il panno ROSSO non tocca nient'altro.", "Torcia dietro il WC: niente aloni gialli né polvere."),
  R("piastrelle_doccia", "bagno", "Piastrelle e piatto della doccia", "bagno", 7, "ripasso", 5, 1, 1, "doccia",
    "Anticalcare spruzzato su piastrelle e piatto della doccia, 5 minuti, spugna non graffiante, sciacqua e asciuga con il panno GIALLO.", "Passa la mano sulle piastrelle bagnate: lisce, non ruvide di calcare."),
  R("fughe", "bagno", "Fughe delle piastrelle del bagno", "bagno", 30, "ripasso", 10, 2, 2, "doccia",
    "Spazzolino con pasta di bicarbonato e poco anticalcare sulle fughe scure, lascia 5 minuti, strofina, sciacqua.", "Fughe dello stesso colore ovunque, niente righe nere.", { note: "Mai candeggina sulle fughe colorate: le sbiadisce." }),
  R("soffione_rubinetti", "bagno", "Soffione, flessibile, miscelatore e rubinetti decalcificati (con il filtrino)", "bagno", 30, "ripasso", 10, 2, 2, "doccia",
    "Sacchetto con aceto o anticalcare sul soffione per 15 minuti, poi sciacqua; filtrino del rubinetto svitato e messo nell'aceto; anticalcare su miscelatore, flessibile e rubinetti, spugna, asciuga e lucida con il panno GIALLO asciutto.", "Tutti i fori del soffione buttano acqua dritta; rubinetti lucidi."),
  R("sotto_lavandini", "bagno", "Dietro e sotto i lavandini e i tubi", "bagno", 30, "ripasso", 5, 1, 3, "doccia",
    "Panno GIALLO umido con sgrassatore sotto il lavandino, sul sifone e sui tubi; asciuga. Controlla che non goccioli.", "Mano sotto il lavandino: asciutto e pulito."),
  R("phon_filtro", "bagno", "Filtro del phon", "bagno", 30, "ripasso", 2, 0.5, 2, "lente",
    "Phon staccato: togli la griglia dietro, spazzolino asciutto sul filtro, rimonta.", "Griglia del phon senza lanugine."),
  R("cestini_lavati", "bagno", "Cestini lavati", "stanza", 7, "ripasso", 3, 1, 1, "bidone",
    "Cestini della camera e del bagno svuotati, lavati con sgrassatore, asciugati, sacchetto nuovo.", "Alza il sacchetto: cestino pulito e asciutto sotto."),

  // ---- CUCINA (appartamenti) ------------------------------------------------------------------
  R("barra_utensili", "cucina", "Barra con i mestoli appesi", "cucina", 14, "ripasso", 3, 1, 1, "cucina",
    "Mestoli, forchettoni e ganci appesi alla barra lavati e sgrassati (prendono il grasso dei fornelli), barra passata con il panno VERDE, riappesi asciutti.", "Mestoli appesi non unti al tatto."),
  R("cucina_base", "cucina", "Fornelli, lavello, microonde, cestino e bidoni", "cucina", 0, "ripasso", 10, 0, 1, "cucina",
    "A ogni pulizia: fornelli e griglie con lo sgrassatore, lavello lucidato, microonde dentro e fuori, cestino lavato, bidoni della differenziata sciacquati. I piatti sporchi degli ospiti NON si lavano. Panno VERDE.", "Apri il microonde e guarda sotto le griglie dei fornelli: puliti."),
  R("cappa_filtri", "cucina", "Filtri della cappa sgrassati", "cucina", 30, "ripasso", 10, 2, 1, "cucina",
    "Sfila i filtri, ammollo in acqua bollente con sgrassatore 15 minuti, spazzola, sciacqua, asciuga e rimonta.", "Filtri della cappa: metallo che si vede, niente grasso appiccicoso."),
  R("forno", "cucina", "Forno a fondo: dentro, vetro, guarnizione, teglie, sopra", "cucina", 30, "ripasso", 15, 3, 1, "cucina",
    "Forno freddo: sgrassatore per forni dentro e sul vetro, 15 minuti, spugna, sciacqua bene; guarnizione della porta passata; griglie e teglie in ammollo; sopra il forno sgrassato.", "Vetro del forno trasparente, niente croste sul fondo."),
  R("lavastoviglie_filtro", "cucina", "Filtro della lavastoviglie", "cucina", 30, "ripasso", 5, 1, 1, "cucina",
    "Svita il filtro sul fondo, lavalo con spazzolino e sgrassatore, pulisci la guarnizione dello sportello, rimonta.", "Filtro senza residui, sportello che non puzza."),
  R("guarnizioni_frigo", "cucina", "Guarnizioni del frigo", "cucina", 30, "ripasso", 5, 1, 1, "frigo",
    "Spazzolino con acqua e bicarbonato nelle pieghe della guarnizione, asciuga. Controlla che la porta chiuda bene.", "Pieghe della guarnizione: bianche, niente puntini neri."),
  R("dietro_fornelli", "cucina", "Dietro e sotto i fornelli", "cucina", 30, "ripasso", 10, 2, 2, "cucina",
    "Sgrassatore sulla parete dietro i fornelli e sui bordi del piano; se il piano si alza, pulisci sotto.", "Parete dietro i fornelli senza schizzi."),
  R("pensili", "cucina", "Dentro pensili e cassetti", "cucina", 30, "cambio", 10, 2, 2, "armadio",
    "Solo ad appartamento libero: svuota, briciole via, panno VERDE umido dentro, asciuga, rimetti. Butta cibi aperti lasciati dagli ospiti.", "Apri due pensili: niente briciole né cibi aperti.", { materiale: "mobili" }),
  R("frigo_sbrinato", "cucina", "Frigo e freezer sbrinati e lavati", "cucina", 90, "libera", 45, 10, 1, "frigo",
    "Appartamento libero: frigo spento e vuoto, sbrina il freezer con una pentola d'acqua calda dentro, lava tutto con acqua e bicarbonato, asciuga, riaccendi.", "Freezer senza ghiaccio sulle pareti, frigo che non puzza."),
  R("dietro_frigo", "cucina", "Dietro e sotto frigo e cucina", "cucina", 90, "libera", 15, 3, 3, "frigo",
    "Frigo staccato e spostato: aspira la griglia dietro e il pavimento sotto, panno umido, rimetti a posto.", "Torcia sotto il frigo: pulito."),

  // ---- BALCONE (solo le camere segnate col balcone) --------------------------------------------
  R("balcone_scopa", "balcone", "Balcone scopato", "balcone", 0, "ripasso", 3, 0, 2, "terrazzo",
    "A ogni ripasso: scopa il balcone, svuota il posacenere, togli foglie dallo scarico.", "Pavimento del balcone senza foglie né cicche."),
  R("balcone_lavato", "balcone", "Balcone lavato: pavimento, soglia, mobili", "balcone", 14, "ripasso", 10, 2, 2, "terrazzo",
    "Secchio d'acqua con il detersivo per pavimenti, spazzolone, risciacquo; soglia della portafinestra, sedie e tavolino passati con il panno.", "Pavimento del balcone senza aloni, sedie pulite."),
  R("balcone_fondo", "balcone", "Balcone a fondo: ringhiera, muretto, scarico, lampada", "balcone", 30, "ripasso", 20, 4, 2, "terrazzo",
    "Ringhiera, rete e muretto lavati con sgrassatore e asciugati, scarico liberato, lampada spolverata, vetro della portafinestra fuori. Sulla ruggine non insistere con la spugna: segnalala.", "Mano sulla ringhiera: pulita; scarico libero.", { meteo: "pioggia", note: "Ruggine su ringhiera e rete: va carteggiata e verniciata → Lavori di manutenzione." }),
  R("condizionatore_esterno", "balcone", "Unità esterna del condizionatore", "balcone", 90, "ripasso", 5, 1, 3, "aria",
    "A condizionatore spento: niente vasi sopra (bloccano l'aria e la terra entra dentro), griglia e alette spazzolate a secco dall'alto in basso, foglie e polvere via da dietro e da sotto, cassetta esterna passata con il panno umido. Mai acqua a getto.", "Alette senza foglie né lanugine, niente vasi sopra.", { prodotto: "nessuno: spazzola morbida e panno", note: "Mai acqua a getto e mai con il condizionatore acceso. Alette piegate o sporco dentro: segnala." }),
  R("piante_balcone", "balcone", "Piante del balcone e sottovasi", "balcone", 7, "ripasso", 3, 1, 2, "terrazzo",
    "Sottovasi svuotati (acqua ferma = zanzare), foglie secche e fiori appassiti via, terra bagnata se è asciutta (un bicchiere d'acqua a pianta, due in estate), vasi spostati e pavimento passato sotto.", "Sottovasi vuoti e asciutti, niente foglie secche a terra.", { note: "Se le piante le cura qualcun altro, spegni questa regola." }),
  R("pareti_balcone", "balcone", "Muro del balcone, canaline e tubi", "balcone", 90, "ripasso", 5, 1, 3, "terrazzo",
    "Ragnatele e polvere dal muro con la scopa, righe nere con spazzola e acqua e sapone, canalina del condizionatore e tubo dell'acqua passati con il panno umido.", "Muro senza ragnatele né righe nere, canalina pulita."),

  // ---- STAGIONI -------------------------------------------------------------------------------
  R("coperte_autunno", "stagioni", "Coperte e piumoni lavati e pronti nell'armadio", "stanza", 365, "giorno", 30, 6, 2, "coperta",
    "Prima del freddo: coperte e piumoni in lavatrice (leggi l'etichetta), asciugati bene, piegati nei sacchi nell'armadio. Le coperte si mettono sui letti solo lavate.", "Apri l'armadio: coperte nei sacchi, profumo di pulito.", { stagione: { da: "10-01", a: "11-30" }, meteo: "freddo", codice: "M01", note: "Coperte sui letti dal 1° ottobre, o prima se per una settimana le notti scendono sotto i 15°. Due notti sotto i 12°: trapuntina. Sotto gli 8°: coperta pesante." }),
  R("coperte_primavera", "stagioni", "Coperte tolte, lavate e riposte", "stanza", 365, "giorno", 30, 6, 2, "coperta",
    "A primavera: via le coperte dai letti, lavate, asciugate al sole, riposte nei sacchi chiusi con un sapone antitarme.", "Letti senza coperte pesanti; sacchi chiusi nell'armadio.", { stagione: { da: "05-01", a: "06-15" }, meteo: "caldo", codice: "M01", note: "Sette notti sopra i 15°: via le coperte. Sopra i 20°: solo il lenzuolo." }),
  R("condizionatori_maggio", "stagioni", "Condizionatori: pulizia di inizio e fine stagione", "stanza", 150, "ripasso", 30, 6, 1, "aria",
    "A maggio e a ottobre: filtri lavati e asciugati, griglie pulite, spray igienizzante nelle alette, vaschetta della condensa controllata, prova di accensione 10 minuti.", "Griglia aperta: filtri bianchi; aria senza odore di chiuso.", { stagione: [{ da: "05-01", a: "06-10" }, { da: "10-01", a: "10-31" }], note: "A maggio e a ottobre sempre." }),
  R("condizionatore_filtri", "stagioni", "Filtri del condizionatore", "stanza", 14, "ripasso", 10, 2, 1, "aria",
    "Apri la griglia, sfila i filtri, sciacquali sotto l'acqua tiepida, asciugali all'ombra, rimontali. In piena estate ogni 2 settimane, nelle mezze stagioni ogni mese.", "Filtri sfilati: niente strato grigio.", { stagione: [{ da: "06-11", a: "09-15" }], ogniMezza: 30, stagioneMezza: [{ da: "04-15", a: "06-10" }, { da: "09-16", a: "10-31" }] }),
  R("condizionatore_griglie", "stagioni", "Griglie e alette del condizionatore", "stanza", 30, "ripasso", 5, 1, 2, "aria",
    "Panno BLU umido sulle griglie e sulle alette esterne, spray igienizzante.", "Alette senza polvere nera.", { stagione: { da: "04-15", a: "10-31" } }),
  R("termosifoni", "stagioni", "Termosifoni e stufe spolverati e controllati", "stanza", 365, "ripasso", 15, 3, 2, "termo",
    "Prima dell'inverno: aspira tra gli elementi, panno umido dentro e dietro, accendi 10 minuti per vedere che scaldi; stufe elettriche controllate (cavo e griglia).", "Dietro il termosifone: niente polvere; si scalda tutto.", { stagione: { da: "10-15", a: "11-30" } }),
  R("scarichi_terrazzo", "stagioni", "Scarichi e griglie del terrazzo liberi dalle foglie", "terrazzo", 365, "giornata", 20, 4, 1, "terrazzo",
    "Togli foglie e terra da scarichi e griglie, versa un secchio d'acqua per vedere che scenda.", "Secchio d'acqua nello scarico: sparisce in pochi secondi.", { stagione: { da: "09-15", a: "10-31" } }),

  // ---- ZONE COMUNI ----------------------------------------------------------------------------
  R("corridoio_passata", "comuni", "Passata veloce del corridoio", ["corridoio_p1", "corridoio_p2"], 1, "giornata", 5, 0, 2, "scopa",
    "Ogni giorno di lavoro: scopa veloce o aspirapolvere nel corridoio, cestino comune svuotato, un'occhiata a luci e porte.", "Corridoio senza briciole né cartacce."),
  R("corridoio_fondo", "comuni", "Corridoio a fondo: battiscopa, plafoniere, porte comuni, segni", ["corridoio_p1", "corridoio_p2"], 7, "giornata", 20, 4, 2, "scopa",
    "Pavimento lavato con il prodotto giusto per quel pavimento, battiscopa con il panno umido, plafoniere spolverate, porte comuni e maniglie sgrassate, segni sulle pareti bianche con la spugna magica (mai sui disegni).", "Battiscopa e maniglie delle porte comuni: puliti al tatto.", { codice: "Z03", meteo: "pioggia", materiale: "pavimento", note: "Con la pioggia: pavimento lavato 2 volte a settimana. Spugna magica solo sulle pareti bianche, mai sui disegni." }),
  R("murales", "comuni", "Disegni sui muri (corridoio e scale del 2° piano)", ["corridoio_p2", "scale"], 30, "giornata", 5, 1, 2, "finestra",
    "Solo piumino o panno asciutto, leggero, dall'alto in basso. MAI acqua, MAI spugna magica, MAI prodotti: il disegno si cancella. Un segno vero sul disegno si segnala, non si strofina.", "Disegni interi, senza polvere e senza aloni.", { prodotto: "nessuno: solo panno asciutto", note: "Mai acqua, spugna magica o prodotti sui disegni dipinti: si cancellano." }),
  R("pouf_corridoio", "comuni", "Pouf contenitori e cuscini del corridoio", "corridoio_p2", 14, "giornata", 3, 1, 2, "scopa",
    "Pouf aspirati sopra e sui lati con la spazzola per tessuti, aperti e guardati dentro (roba dimenticata, polvere), cuscini sbattuti e sprimacciati, pavimento sotto passato.", "Sopra i pouf: niente polvere né peli; dentro in ordine."),
  R("decorazioni", "comuni", "Vasi, fiori finti, lanterne, tovaglia e cassapanca", ["ingresso", "scale"], 7, "giornata", 5, 1, 2, "finestra",
    "Vasi, lanterna e lampada in vimini passati con il panno asciutto; fiori finti e pampas scossi fuori o soffiati con il phon ad aria fredda; tovaglia del tavolino scossa e cambiata se macchiata; cassapanca spolverata sopra e aperta per guardare dentro.", "Dito sul bordo del vaso e sulla cassapanca: pulito; tovaglia senza macchie."),
  R("corridoio_quadri_estintore", "comuni", "Quadri, estintore e cartelli del corridoio", ["corridoio_p1", "corridoio_p2"], 30, "giornata", 5, 1, 3, "finestra",
    "Cornici e vetri dei quadri con il panno asciutto, estintore spolverato (guarda che il cartellino sia in regola), cartelli e targhette passati.", "Dito sopra la cornice e sull'estintore: pulito."),
  R("scale_scopate", "comuni", "Scale di servizio scopate", "scale", 3.5, "giornata", 10, 2, 2, "scopa",
    "Scopa dall'alto in basso, gradino per gradino, angoli compresi; raccogli con la paletta.", "Angoli dei gradini senza polvere."),
  R("scale_lavate", "comuni", "Scale lavate (gradini in marmo)", "scale", 7, "giornata", 15, 3, 2, "scopa",
    "Dopo averle scopate: secchio con detergente neutro per marmo, dall'alto in basso, strizza bene lo straccio (gradini scivolosi = pericolo). Cartello 'bagnato'. Mai anticalcare né aceto sul marmo.", "Gradini asciutti e senza aloni.", { codice: "Z03", meteo: "pioggia", note: "Con la pioggia: 2 volte a settimana. Gradini in marmo: mai acidi (anticalcare, aceto)." }),
  R("scale_corrimano", "comuni", "Corrimano, ringhiera e battiscopa delle scale", "scale", 14, "giornata", 10, 2, 2, "scopa",
    "Corrimano sgrassato e disinfettato per tutta la lunghezza, ringhiera passata, battiscopa dei gradini con il panno umido.", "Mano sul corrimano: pulito, non appiccicoso."),
  R("scale_pareti_luci", "comuni", "Pareti e plafoniere delle scale", "scale", 30, "giornata", 15, 3, 2, "finestra",
    "Segni sulle pareti con la spugna magica, plafoniere e lampade spolverate con la scaletta, ragnatele negli angoli dei pianerottoli.", "Pianerottoli senza ragnatele, pareti senza strisce."),
  R("vetri_scale", "comuni", "Vetri delle scale", "scale", 30, "giornata", 20, 4, 2, "finestra",
    "Detergente vetri e tergivetro sui vetri delle scale dentro e, dove si arriva in sicurezza, fuori; telai e davanzali con il panno umido.", "Vetri delle scale controluce: senza aloni."),
  R("ingresso", "comuni", "Portone, maniglione, citofono, cassetta della posta, targhe e zerbini", "ingresso", 7, "giornata", 10, 2, 2, "porta",
    "Portone davanti e dietro con il panno umido, maniglione e citofono disinfettati, cassetta della posta e targhe lucidate, zerbini sbattuti fuori, gradino d'ingresso e pavimento in marmo lavati con detergente neutro (mai acidi), rivestimento in marmo delle pareti passato con il panno appena umido.", "Citofono e maniglione del portone: lucidi; marmo senza aloni.", { materiale: "pavimento" }),
  R("zerbini_lavati", "comuni", "Zerbini lavati", "ingresso", 30, "giornata", 10, 2, 3, "porta",
    "Zerbini lavati con acqua e sapone, spazzolati, asciugati al sole prima di rimetterli.", "Zerbino asciutto e senza sabbia sotto."),
  R("terrazzo_scopa", "comuni", "Terrazzo: scopa e acqua", "terrazzo", 7, "giornata", 15, 3, 2, "terrazzo",
    "Scopa tutto il terrazzo, svuota i posacenere, un secchio d'acqua sulle zone sporche, sedie passate con il panno.", "Terrazzo senza foglie, posacenere vuoti."),
  R("terrazzo_fondo", "comuni", "Terrazzo a fondo: pavimento, ringhiere, muretti, mobili, lampade, griglie", "terrazzo", 30, "giornata", 40, 8, 2, "terrazzo",
    "Pavimento strofinato con spazzolone e detersivo, ringhiere e muretti lavati e asciugati, mobili lavati, lampade spolverate, griglie degli scarichi liberate.", "Mano sulla ringhiera: pulita; pavimento senza aloni.", { meteo: "pioggia" }),
  R("stendini", "comuni", "Stendini lavati", ["terrazzo", "lavanderia"], 30, "giornata", 5, 1, 3, "secchio",
    "Fili e struttura degli stendini passati con il panno umido e sgrassatore (altrimenti sporcano la biancheria pulita).", "Dito sui fili dello stendino: pulito."),
  R("bidoni", "comuni", "Bidoni dei rifiuti lavati", "ingresso", 14, "giornata", 10, 2, 1, "bidone",
    "Bidoni svuotati, lavati dentro e fuori con acqua e sgrassatore, asciugati aperti al sole.", "Bidone aperto: non puzza, fondo pulito."),
  R("luci_esterne", "comuni", "Luci esterne provate e pulite", ["ingresso", "terrazzo", "scale"], 7, "giornata", 3, 1, 2, "finestra",
    "Accendi le luci del portone, delle scale e del terrazzo: tutte devono funzionare. Vetri delle lampade passati con il panno umido, ragnatele via.", "Di sera: tutte le luci esterne accese e pulite.", { codice: "Z12", note: "Lampadina fulminata: segnala il problema (Lavori di manutenzione)." }),

  // ---- LAVANDERIA, ATTREZZI E SCORTE -----------------------------------------------------------
  R("lavatrice_cassetto", "lavanderia", "Cassetto del detersivo e guarnizione dell'oblò", "lavanderia", 7, "giornata", 5, 1, 1, "lavatrice",
    "Cassetto sfilato e lavato sotto l'acqua calda, guarnizione dell'oblò passata con il panno e l'anti-muffa, oblò lasciato aperto a fine giornata.", "Piega della guarnizione: niente nero; cassetto senza incrostazioni."),
  R("lavatrice_zona", "lavanderia", "Zona lavatrice: pavimento ed esterno", "lavanderia", 7, "giornata", 10, 2, 2, "lavatrice",
    "Esterno della lavatrice e dell'asciugatrice con il panno umido, pavimento della lavanderia e del magazzino biancheria lavato, filtro dell'asciugatrice svuotato (se c'è).", "Pavimento intorno alla lavatrice senza polvere di detersivo."),
  R("asciugatrice", "lavanderia", "Asciugatrice: filtro, serbatoio e condensatore", "lavanderia", 30, "giornata", 10, 2, 1, "lavatrice",
    "Filtro della lanugine lavato, serbatoio dell'acqua svuotato e sciacquato, condensatore (sportello in basso) sciacquato. Se non c'è l'asciugatrice, spegni la regola.", "Filtro senza lanugine; asciugatrice che asciuga in un ciclo."),
  R("lavatoio", "lavanderia", "Lavatoio e rubinetto", "lavanderia", 7, "giornata", 5, 1, 2, "doccia",
    "Vasca del lavatoio strofinata con sgrassatore, scarico libero, rubinetto lucidato.", "Lavatoio senza aloni di detersivo."),
  R("ripostiglio_prodotti", "lavanderia", "Ripostiglio dei prodotti in ordine", "lavanderia", 30, "giornata", 10, 2, 2, "lista",
    "Tappi chiusi, flaconi puliti fuori, etichette davanti, prodotti scaduti via, pavimento del ripostiglio lavato. I prodotti pericolosi in alto.", "Scaffale ordinato, niente flaconi appiccicosi."),
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
  R("carrello", "lavanderia", "Carrello e secchi lavati", "lavanderia", 7, "giornata", 5, 1, 2, "secchio",
    "Carrello e secchi lavati con sgrassatore e lasciati asciugare capovolti.", "Secchi asciutti e senza fondo scuro."),
  R("scope", "lavanderia", "Scope, spazzoloni e mop lavati e controllati", "lavanderia", 7, "giornata", 5, 1, 1, "secchio",
    "Setole delle scope sciacquate e liberate dai capelli, spazzoloni lavati, mop in lavatrice a 60° e stesi. Il mop del bagno è diverso da quello della camera: etichetta colorata sul manico.", "Mop asciutti, senza odore; etichette dei mop al posto giusto.", { codice: "L17", prodotto: "sgrassatore delicato · mop in lavatrice a 60°", note: "Mop del bagno diverso da quello della camera." }),
  R("spugne", "lavanderia", "Spugne nuove", "lavanderia", 14, "giornata", 2, 0, 1, "secchio",
    "Ogni 2 settimane spugne nuove per bagni e cucine (quella del WC ogni settimana e si butta). Mai la stessa spugna tra bagno e cucina: colori diversi.", "Spugne senza odore, nessuna sfaldata.", { codice: "L16" }),
  R("guanti", "lavanderia", "Guanti controllati e cambiati", "lavanderia", 14, "giornata", 2, 0, 1, "secchio",
    "Un paio di guanti per il bagno (rossi) e uno per il resto. Bucati o puzzolenti: via, paio nuovo. Lavati fuori e dentro a fine giornata e asciugati capovolti.", "Due paia per signora, interi e asciutti.", { codice: "L19" }),
  R("aspirapolvere", "lavanderia", "Aspirapolvere: sacco e filtri", "lavanderia", 14, "giornata", 10, 2, 2, "secchio",
    "Sacco cambiato, filtri battuti o lavati e asciugati, spazzola liberata dai capelli con le forbici.", "Aspirapolvere che tira forte e non puzza."),
  R("scorte", "lavanderia", "Controllo dei prodotti", "lavanderia", 7, "giornata", 5, 0, 2, "lista",
    "Conta i prodotti: ogni carrello ha tutto per una settimana (sgrassatore, anticalcare, antimuffa, detergente vetri, disinfettante, sacchetti, carta). Scrivi a Michele cosa manca.", "Scaffale dei prodotti con la scorta per una settimana."),
  R("biancheria_scorta", "lavanderia", "Biancheria di scorta: un set per camera", "lavanderia", 7, "giornata", 5, 0, 1, "coperta",
    "Un set completo pulito per ogni camera sempre pronto sullo scaffale: lenzuola, federe, copripiumino, asciugamani grandi e piccoli, tappetino. Scrivi a Michele cosa manca.", "Scaffale con un set completo per camera, piegato.", { codice: "L21" }),
  R("controllo_piegatura", "lavanderia", "Controllo alla luce alla piegatura", "lavanderia", 7, "giornata", 5, 1, 1, "lente",
    "Ogni pezzo che esce dall'asciugatura si guarda alla luce mentre si piega: macchie, strappi, pelucchi, elastici molli. Quello rovinato va nella cesta 'da sostituire', non sullo scaffale.", "Cesta 'da sostituire' usata; niente pezzi macchiati sugli scaffali.", { codice: "L22" }),
  R("ferro_stiro", "lavanderia", "Ferro da stiro e asse", "lavanderia", 30, "giornata", 5, 1, 3, "secchio",
    "Ferro freddo e staccato: piastra passata con il panno umido (bicarbonato se è macchiata), serbatoio svuotato, telo dell'asse lavato se è macchiato.", "Piastra lucida, serbatoio vuoto.", { codice: "L23" }),
];
// (nome vecchio: lo usano ancora alcune schermate)
export const REGOLE_GOVERNANTE = CATALOGO;

// ============================================================================
//  I MATERIALI DEI POSTI (prova 4): dalle foto delle camere. Per ogni posto si sceglie il pavimento, il box doccia
//  e le porte; il "come si fa" della signora aggiunge la riga giusta ("in Salvatore il pavimento è marmo lucido: …").
//  Si cambiano dall'app (Regole → Materiali dei posti) e stanno in impostazioni/governante.materiali[luogo].
// ============================================================================
export const MATERIALI = {
  pavimento: {
    marmo: { nome: "marmo o granito lucido", come: "solo detergente neutro per marmo (o acqua e poco sapone di Marsiglia), straccio ben strizzato, asciugato subito per non lasciare aloni", mai: "MAI anticalcare, aceto, limone, candeggina o sgrassatore forte: macchiano il marmo per sempre e lo opacizzano" },
    gres: { nome: "piastrelle di gres (color cotto)", come: "detersivo per pavimenti normale, acqua calda, straccio strizzato; sulle fughe scure spazzola con bicarbonato", mai: "mai cera o prodotti lucidanti (poi scivola e fa le impronte); mai candeggina pura sulle fughe colorate" },
    cotto: { nome: "cotto vero", come: "solo acqua tiepida e sapone neutro, poca acqua, straccio strizzato; macchie con bicarbonato", mai: "mai acidi (anticalcare, aceto) e mai troppa acqua: il cotto assorbe" },
    legno: { nome: "parquet o legno", come: "panno appena umido con detergente per parquet, mai acqua in terra", mai: "mai acqua abbondante, mai vapore, mai aceto" },
  },
  box: {
    soffietto: { nome: "box doccia a soffietto in PVC", come: "ante piegate e aperte, anticalcare lasciato 5 minuti nelle pieghe, spazzolino morbido dentro le pieghe e nelle guide, sciacquo, asciugatura con il panno GIALLO; ante lasciate aperte ad asciugare", mai: "mai spugne abrasive né candeggina pura: il PVC si opacizza e ingiallisce; mai tirare le ante quando sono rigide" },
    vetro: { nome: "box doccia in vetro", come: "anticalcare 5 minuti, spugna non graffiante, tergivetro, panno asciutto", mai: "mai spugne abrasive né lame: rigano il vetro" },
    tenda: { nome: "tenda della doccia", come: "tenda stesa e lasciata aperta ad asciugare; lavata in lavatrice a 40° con bicarbonato ogni mese", mai: "mai lasciarla appallottolata bagnata: fa la muffa in due giorni" },
    nessuno: { nome: "doccia senza box", come: "piatto e piastrelle intorno asciugati dopo ogni pulizia", mai: "" },
  },
  mobili: {
    laminato: { nome: "mobili in laminato di finto legno (truciolato dentro)", come: "panno umido ben strizzato, mai bagnato; bordi e giunzioni asciugati subito, perché se l'acqua entra nelle giunzioni il bordo si gonfia e non torna più", mai: "mai spugne abrasive, mai vapore, mai acetone o alcol; mai acqua che resta sui bordi" },
    legno: { nome: "mobili in legno verniciato", come: "panno appena umido nel verso delle venature, subito asciugato", mai: "mai acqua che cola, mai sgrassatore forte o alcol: la vernice si opacizza" },
  },
  porte: {
    legno: { nome: "porta in legno verniciato scuro", come: "panno appena umido e subito asciutto, nel verso delle venature; la scritta con il nome solo con il panno asciutto", mai: "mai acqua che cola, mai sgrassatore forte o alcol: la vernice si opacizza" },
    laminato: { nome: "porta in laminato chiaro", come: "panno umido con il multiuso, asciugata; la scritta con il nome solo con il panno asciutto", mai: "mai acqua sui bordi e sugli spigoli: il laminato si gonfia; mai spugne abrasive" },
  },
};
// Che materiali ha un posto, partendo da quello che si vede nelle foto (1° piano marmo rosso e porte in legno scuro,
// 2° piano gres color cotto e porte in laminato chiaro, appartamenti marmo rosso; box a soffietto dappertutto)
export function materialiBase(luogo) {
  if (!luogo) return { pavimento: "gres", box: "soffietto", porte: "laminato", mobili: "laminato" };
  if (luogo.tipo === "comune") return { pavimento: luogo.id === "corridoio_p2" || luogo.id === "terrazzo" || luogo.id === "lavanderia" ? "gres" : "marmo", box: "nessuno", porte: luogo.id === "corridoio_p2" ? "laminato" : "legno", mobili: "laminato" };
  if (luogo.zona === "p1") return { pavimento: "marmo", box: "soffietto", porte: "legno", mobili: "laminato" };
  if (luogo.zona === "p2") return { pavimento: "gres", box: "soffietto", porte: "laminato", mobili: "laminato" };
  return { pavimento: "marmo", box: "soffietto", porte: "laminato", mobili: "laminato" };
}
export function materialiDi(luogo, impostati = {}) { return { ...materialiBase(luogo), ...((impostati || {})[luogo?.id] || {}) }; }
// La riga da aggiungere al "come si fa" per una regola che dipende dal materiale
export function rigaMateriale(regola, luogo, impostati = {}) {
  if (!regola || !regola.materiale || !luogo) return null;
  const scelta = materialiDi(luogo, impostati)[regola.materiale]; const m = (MATERIALI[regola.materiale] || {})[scelta];
  if (!m) return null;
  const mai = m.mai ? m.mai.charAt(0).toUpperCase() + m.mai.slice(1) : "";
  return { tipo: regola.materiale, scelta, nome: m.nome, come: m.come, mai, testo: `${luogo.nome}: ${m.nome} → ${m.come}.${mai ? " " + mai + "." : ""}` };
}
// La scheda dei materiali (per la signora e per la mamma): come si tratta ogni cosa che c'è davvero nelle stanze
export const SCHEDA_MATERIALI = [
  { nome: "Marmo e granito lucidi", dove: "pavimenti rossi del 1° piano e degli appartamenti, ingresso, scale, rivestimento dell'ingresso", come: MATERIALI.pavimento.marmo.come, mai: MATERIALI.pavimento.marmo.mai },
  { nome: "Piastrelle di gres color cotto", dove: "pavimenti del 2° piano e del corridoio, balconi", come: MATERIALI.pavimento.gres.come, mai: MATERIALI.pavimento.gres.mai },
  { nome: "Ceramica del bagno (piastrelle a fiori, sanitari)", dove: "tutti i bagni", come: "multiuso o anticalcare sulle piastrelle lisce, spugna morbida; sulle fughe spazzolino con bicarbonato; sanitari con disinfettante", mai: "mai candeggina pura sulle fughe colorate (le sbiadisce), mai pagliette" },
  { nome: "Rubinetti e docce cromate", dove: "lavandini, bidet, docce, cucine", come: "anticalcare sul panno, 2 minuti, sciacquo, lucidatura con il panno asciutto; filtrino svitato nell'aceto", mai: "mai anticalcare lasciato asciugare sul cromo (lo macchia), mai pagliette" },
  { nome: "Box doccia a soffietto in PVC", dove: "quasi tutti i bagni", come: MATERIALI.box.soffietto.come, mai: MATERIALI.box.soffietto.mai },
  { nome: "Mobili in laminato di finto legno (truciolato dentro)", dove: "letti, comodini, armadi, cucine, piani in laminato puntinato: tutti i mobili delle stanze", come: MATERIALI.mobili.laminato.come, mai: MATERIALI.mobili.laminato.mai },
  { nome: "Porte in legno verniciato scuro", dove: "1° piano", come: MATERIALI.porte.legno.come, mai: MATERIALI.porte.legno.mai },
  { nome: "Vetri e specchi", dove: "finestre, portefinestre, specchi, mensola di vetro del bagno", come: "detergente vetri sul panno (non sul vetro), tergivetro o panno asciutto, bordi asciugati", mai: "mai abrasivi; mai spruzzare sullo specchio (cola dietro e lo macchia)" },
  { nome: "Ferro: ringhiere, reti e termosifoni in ghisa", dove: "balconi, bagni, corridoi", come: "panno umido e asciugatura; ragnatele via con la spazzola", mai: "mai insistere sulla ruggine con la spugna: si segnala, va carteggiata e riverniciata" },
  { nome: "Disegni dipinti sui muri e pannelli fotografici", dove: "corridoio e scale del 2° piano, sopra i letti", come: "solo piumino o panno asciutto, leggerissimo", mai: "MAI acqua, MAI spugna magica, MAI prodotti: si cancellano" },
  { nome: "Stoffa: pouf, armadio in stoffa, tende, cuscini", dove: "corridoio del 2° piano, camere", come: "aspirapolvere con la spazzola per tessuti; macchie con panno umido e poco sapone", mai: "mai bagnare molto, mai candeggina" },
  { nome: "Plastica: cassette del WC, dispenser, cestini, sedie del balcone", dove: "bagni, balconi", come: "sgrassatore delicato o multiuso, panno, asciugatura", mai: "mai alcol né acetone (la plastica si opacizza)" },
];

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
  if (Array.isArray(d)) return d.flatMap(x => luoghiDi({ ...regola, dove: x }, camere, luoghi, flags));
  if (regola.soloFrigo) return camere.filter(c => (flags.frigo || {})[c.id] || c.frigo);
  if (d === "camera" || d === "camere") return camere.filter(c => c.tipo !== "casa");
  if (d === "cucina" || d === "case") return camere.filter(c => c.tipo === "casa");
  if (d === "bagno" || d === "stanza" || d === "stanze" || d === "tutte") return camere.slice();
  if (d === "balcone") return camere.filter(c => (flags.balconi || {})[c.id] || c.balcone);
  if (d && d.startsWith("zona:")) return camere.filter(c => c.zona === d.slice(5));
  if (d && d.startsWith("camera:")) return camere.filter(c => c.id === d.slice(7));
  const l = luoghi.find(x => x.id === d); return l ? [l] : [];
}
export function trovaLuogo(id, camere, luoghi = LUOGHI_COMUNI) { return camere.find(c => c.id === id) || luoghi.find(l => l.id === id) || null; }
// "La regola copre questo posto?" con una memoria per elenco di regole (la simulazione lo chiede migliaia di volte)
const memoCopre = new WeakMap();
function copre(regole, r, l, camere, luoghi, flags) {
  let m = memoCopre.get(regole); if (!m) { m = new Map(); memoCopre.set(regole, m); }
  const k = `${r.id}|${l.id}`; let v = m.get(k);
  if (v === undefined) { v = luoghiDi(r, camere, luoghi, flags).some(x => x.id === l.id); m.set(k, v); }
  return v;
}

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

// La pulizia a fondo completa fa tutto il catalogo della camera in una volta: queste sono le regole che segna fatte
export function regoleDellaFondoCompleta(luogo, ctx) {
  const { camere } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = ctx.regole || regoleAttive(null), flags = ctx.flags || {}, oggi = ctx.oggi;
  return regole.filter(r => !r.evento && r.ogni > 0 && (r.quando === "ripasso" || r.quando === "cambio" || r.quando === "libera") && copre(regole, r, luogo, camere, luoghi, flags) && inStagione(r, oggi)).map(r => r.id);
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
// Da quando lavora la governante: serve per dare un'urgenza alle cose "mai registrate" (partenza grigia).
// Una cosa mai fatta vale come se fosse stata fatta il giorno in cui la governante è partita: così le cose
// a ritmo corto (settimanali) vengono prima, quelle a ritmo lungo (ogni 3-6 mesi) aspettano il loro turno.
export function inizioGovernante(ctx) {
  if (ctx.inizio) return ctx.inizio;
  const date = Object.values(ctx.registro || {}).map(v => v && v.ultima).filter(Boolean).sort();
  return date[0] || ctx.oggi;
}
// L'urgenza con cui una cosa chiede di essere fatta (più alta = prima). 99 = "a ogni pulizia".
// La priorità pesa: l'igiene (1) passa avanti, quello che non si vede (3) aspetta di più.
const PESO_PRIORITA = { 1: 1.5, 2: 1, 3: 0.6 };
function urgenza(ogni, ultima, oggi, inizio, priorita = 2) {
  if (!ogni) return 99;
  const peso = PESO_PRIORITA[priorita] || 1;
  if (ultima) return giorniTra(ultima, oggi) / ogni * peso;
  return (1 + Math.max(0, giorniTra(inizio, oggi)) / ogni) * peso;
}
export function ultimaVolta(registro, regola, luogo) { return (registro && registro[chiaveRegistro(regola, luogo)]) || null; }

// --- la stanza è libera quella notte? -------------------------------------------------------------
function liberaLaNotte(soggiorni, camera, iso) { return !soggiorni.some(s => s.camera === camera && soggiornoCopre(s, iso)); }
function nottiDiFila(soggiorni, camera, iso) { const s = soggiorni.find(x => x.camera === camera && soggiornoCopre(x, iso)); return s ? giorniTra(s.inizio, iso) : 0; }
// Quante notti di fila la camera è rimasta vuota prima del giorno "iso" (massimo 60)
function nottiVuotePrima(soggiorni, camera, iso) { let n = 0; while (n < 60 && liberaLaNotte(soggiorni, camera, aggiungiGiorni(iso, -(n + 1)))) n++; return n; }
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
  const inizio = inizioGovernante(ctx);
  const pulizie = Object.values(ctx.pulizie || {}).filter(p => p.data === iso && p.zona === zona && NORMALE(p) && p.stato !== "non_fatta")
    .sort((a, b) => ((camere.find(c => c.id === a.camera) || {}).ordine || 99) - ((camere.find(c => c.id === b.camera) || {}).ordine || 99));
  const out = {}; if (!pulizie.length) return out;
  // i lavori della governante già messi in quel giorno per quella signora (consigli accettati) occupano il budget; la fondo completa (mezza giornata) no
  let minutiGiorno = Object.values(ctx.pulizie || {}).filter(p => p.data === iso && p.zona === zona && p.origine === "governante" && p.stato !== "non_fatta" && (p.minuti || 0) < 120).reduce((s, p) => s + (p.minuti || 0), 0);
  // 1) camera per camera
  for (const p of pulizie) {
    const l = trovaLuogo(p.camera, camere, luoghi); if (!l) continue;
    const cambio = CAMBIO(p), fisso = nottiDiFila(soggiorni, p.camera, p.data) >= 14;
    const cand = [];
    for (const r of regole) {
      if (r.quando !== "ripasso" && r.quando !== "cambio") continue;
      if (r.evento) continue;
      if (!copre(regole, r, l, camere, luoghi, flags)) continue;
      if (!inStagione(r, p.data)) continue;
      if (r.quando === "cambio" && !cambio) continue;
      if (r.soloFissi && !fisso) continue;
      const reg = registro?.[chiaveRegistro(r.id, l.id)] || null;
      if (reg?.saltata === p.data && reg?.saltataPer === p.id) continue; // "non la posso fare" oggi: alla pulizia dopo
      const ogni = ogniAttuale(r, p.data, l, flags);
      const rapporto = ogni ? rapportoScadenza(r, reg?.ultima || null, p.data, ogni) : Infinity;
      if (ogni && reg?.ultima && rapporto < 0.9) continue;
      cand.push({ regola: r.id, nome: r.nome, come: r.come, controllo: r.controllo || "", prodotto: r.prodotto || "", note: r.note || "", codice: r.codice || "", materiale: rigaMateriale(r, l, ctx.materiali), icona: r.icona, minuti: r.minuti, euro: r.euro || 0, priorita: r.priorita || 2, domanda: !!r.domanda, sempre: !ogni, ogni, rapporto, urgenza: urgenza(ogni, reg?.ultima || null, p.data, inizio, r.priorita), ultima: reg?.ultima || null, luogo: l.id, luogoNome: l.nome, perche: perche(r, reg, p.data, ogni) });
    }
    cand.sort((a, b) => (b.sempre - a.sempre) || (b.urgenza - a.urgenza) || (a.priorita - b.priorita));
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
      if (ogni > 1 && reg?.ultima && rapporto < 0.9) continue;
      if (ogni <= 1 && reg?.ultima === iso) continue;
      comuni.push({ regola: r.id, nome: r.nome, come: r.come, controllo: r.controllo || "", prodotto: r.prodotto || "", note: r.note || "", codice: r.codice || "", materiale: rigaMateriale(r, l, ctx.materiali), icona: r.icona, minuti: r.minuti, euro: r.euro || 0, priorita: r.priorita || 2, domanda: !!r.domanda, sempre: ogni <= 1, ogni, rapporto, urgenza: urgenza(ogni > 1 ? ogni : 0, reg?.ultima || null, iso, inizio, r.priorita), ultima: reg?.ultima || null, luogo: l.id, luogoNome: l.nome, comune: true, perche: perche(r, reg, iso, ogni) });
    }
  }
  comuni.sort((a, b) => (b.sempre - a.sempre) || (b.urgenza - a.urgenza) || (a.priorita - b.priorita));
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
  const fine = aggiungiGiorni(lun, 6), inizio = inizioGovernante(ctx);
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
      // evento "arrivo": camera rimasta vuota 2+ notti e un ospite che arriva in settimana → rinfresco il giorno dell'arrivo
      if (r.evento === "arrivo") {
        if (l.tipo === "comune") continue;
        const da = lun > oggi ? lun : oggi;
        for (const s of soggiorni.filter(s => s.camera === l.id && s.inizio >= da && s.inizio <= fine).sort((a, b) => a.inizio < b.inizio ? -1 : 1)) {
          const vuote = nottiVuotePrima(soggiorni, l.id, s.inizio); if (vuote < 2) continue;
          if (Object.values(pulizie).some(p => p.camera === l.id && p.data === s.inizio && NORMALE(p))) continue; // quel giorno c'è già una pulizia
          let data = s.inizio; if (giornoSettimana(data) === 0) data = aggiungiGiorni(data, -1);
          if (data < oggi || (ult && ult >= data)) continue;
          candidati.push({ id: `${r.id}|${l.id}|${data}`, regola: r.id, nome: r.nome, cosa: r.nome, icona: r.icona, come: r.come, controllo: r.controllo || "", prodotto: r.prodotto || "", note: r.note || "", luogo: l.id, luogoNome: l.nome, luogoTipo: l.tipo, zona: l.zona, data, minuti: r.minuti, euro: r.euro || 0, grande: false, libera: false, priorita: 1, perche: [vuote >= 60 ? "camera ferma da più di 2 mesi" : `camera ferma da ${vuote} notti`, `arriva ${s.nome || "un ospite"} ${data === s.inizio ? "quel giorno" : "il giorno dopo"}`], rapporto: 60, chiave: k });
          break;
        }
        continue;
      }
      const ogni = ogniAttuale(r, fine, l, flags);
      let rapporto = r.evento ? 0 : rapportoScadenza(r, ult, fine, ogni);
      if (r.stagione && ult && inStagione(r, ult) && giorniTra(ult, fine) < 300) continue;
      const perche = [];
      // gli eventi: soggiorno lungo che finisce questa settimana, camera molto indietro, oppure è passato troppo tempo (ogniEvento)
      let lungo = null, indietro = 0;
      if (r.evento) {
        lungo = soggiorni.find(s => s.camera === l.id && s.fine >= (lun > oggi ? lun : oggi) && s.fine <= fine && giorniTra(s.inizio, s.fine) >= 14) || null;
        indietro = regole.filter(x => !x.evento && x.ogni && (x.quando === "ripasso" || x.quando === "cambio" || x.quando === "libera") && copre(regole, x, l, camere, luoghi, flags) && inStagione(x, oggi))
          .filter(x => { const u = registro?.[chiaveRegistro(x.id, l.id)]?.ultima || null; const rp = rapportoScadenza(x, u, oggi, ogniAttuale(x, oggi, l, flags)); return rp !== Infinity && rp >= 2; }).length;
        const vecchia = !!(r.ogniEvento && ult && giorniTra(ult, fine) >= r.ogniEvento);
        if (!lungo && indietro < 6 && !vecchia) continue;
        if (lungo) perche.push(`${lungo.nome || "l'ospite"} ha dormito qui ${giorniTra(lungo.inizio, lungo.fine)} notti`);
        if (indietro >= 6) perche.push(`${indietro} rifiniture molto in ritardo`);
        if (vecchia) perche.push(`l'ultima volta ${testoUltima(ult, oggi)}`);
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
      candidati.push({ id: `${r.id}|${l.id}|${data}`, regola: r.id, nome: r.nome, cosa: r.nome, icona: r.icona, come: r.come, controllo: r.controllo || "", prodotto: r.prodotto || "", note: r.note || "", materiale: rigaMateriale(r, l, ctx.materiali), luogo: l.id, luogoNome: l.nome, luogoTipo: l.tipo, zona: l.zona, data, minuti: r.minuti, euro: r.euro || 0, grande: !!r.grande, libera: r.quando === "libera", priorita: r.priorita || 2, perche, rapporto: r.evento ? 99 : urgenza(ogni, ult, fine, inizio, r.priorita), chiave: k });
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
  const tutte = ctx.regole || regoleAttive(null);
  const regole = tutte.filter(r => r.ogni > 1 && !r.evento);
  const tutti = [...camere, ...luoghi];
  return tutti.map(l => {
    const voci = regole.filter(r => copre(tutte, r, l, camere, luoghi, flags) && inStagione(r, oggi)).map(r => {
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
// Il "modello" della settimana: le pulizie normali in programma questa settimana (si ripetono per N settimane)
function modelloSettimana(ctx, lun) {
  return Object.values(ctx.pulizie || {}).filter(p => p.data >= lun && p.data < aggiungiGiorni(lun, 7) && (p.origine === "auto" || p.origine === "mano" || !p.origine) && p.tipo !== "fondo" && p.tipo !== "extra" && p.stato !== "non_fatta");
}
// La simulazione vera e propria: N settimane come questa, con le rifiniture dentro le pulizie e i consigli
// a camera libera tutti accettati. Parte dal registro vero (o da zero con daZero). Ritorna il registro finale,
// la prima data in cui ogni cosa verrebbe fatta, i minuti per signora e giorno, e i consigli accettati.
export function simulaGovernante(ctx, settimane = 13, opz = {}) {
  const { camere, soggiorni = [] } = ctx; const regole = ctx.regole || regoleAttive(null);
  const lun = ctx.lun || lunediDi(ctx.oggi);
  const modello = modelloSettimana(ctx, lun);
  if (!modello.length) return null;
  const registro = {};
  if (!opz.daZero) for (const [k, v] of Object.entries(ctx.registro || {})) if (v && v.ultima) registro[k] = { ultima: v.ultima };
  const prima = {}, minuti = {}, zone = [...new Set(camere.map(c => c.zona))], accettate = []; let nRif = 0;
  const base = { ...ctx, regole, registro, rinvii: {}, inizio: inizioGovernante(ctx) };
  for (let w = 0; w < settimane; w++) {
    const lunW = aggiungiGiorni(lun, w * 7);
    const sog = soggiorni.map(s => ({ ...s, inizio: aggiungiGiorni(s.inizio, w * 7), fine: aggiungiGiorni(s.fine, w * 7) }));
    const pul = {}; for (const p of modello) { const iso = aggiungiGiorni(p.data, w * 7); const id = `${iso}_${p.camera}`; pul[id] = { ...p, id, data: iso, stato: "da_fare" }; }
    const c2 = { ...base, lun: lunW, oggi: lunW, pulizie: pul, soggiorni: sog };
    // lunedì mattina: i consigli della settimana, tutti accettati
    const pr = proposteSettimana(c2);
    for (const c of pr.proposte) { accettate.push({ ...c, settimana: w }); const k = chiaveRegistro(c.regola, c.luogo); if (!prima[k]) prima[k] = c.data; pul[`${c.data}_${c.luogo}_g_${c.regola}`] = { id: `${c.data}_${c.luogo}_g_${c.regola}`, data: c.data, camera: c.luogo, zona: c.zona, tipo: "fondo", origine: "governante", regola: c.regola, minuti: c.minuti, stato: "da_fare" }; }
    for (let d = 0; d < 7; d++) {
      const iso = aggiungiGiorni(lunW, d);
      for (const z of zone) {
        const m = rifinitureDelGiorno(z, iso, { ...c2, oggi: iso });
        for (const rf of Object.values(m)) for (const r of rf) { const k = chiaveRegistro(r.regola, r.luogo); registro[k] = { ultima: iso }; if (!prima[k]) prima[k] = iso; if (!r.sempre) { nRif++; minuti[`${z}|${iso}`] = (minuti[`${z}|${iso}`] || 0) + r.minuti; } }
      }
      for (const c of pr.proposte) if (c.data === iso) {
        registro[chiaveRegistro(c.regola, c.luogo)] = { ultima: iso };
        if (c.grande) { const l = trovaLuogo(c.luogo, camere, ctx.luoghi || LUOGHI_COMUNI); if (l) for (const id of regoleDellaFondoCompleta(l, { ...c2, oggi: iso })) { const k = chiaveRegistro(id, c.luogo); registro[k] = { ultima: iso }; if (!prima[k]) prima[k] = iso; } }
        else minuti[`${c.zona}|${iso}`] = (minuti[`${c.zona}|${iso}`] || 0) + c.minuti;
      }
    }
  }
  return { settimane, lun, fine: aggiungiGiorni(lun, settimane * 7 - 1), registro, prima, minuti, rifiniture: nRif, proposte: accettate, modello, zone };
}
// Quanto del catalogo si riesce a tenere in regola con le soglie attuali, partendo da zero (per la scheda Regole)
export function simulaCopertura(ctx, settimane = 8) {
  const sim = simulaGovernante(ctx, settimane, { daZero: true });
  if (!sim) return null;
  const cal = calendarioPulito({ ...ctx, oggi: sim.fine, registro: sim.registro });
  const voci = cal.flatMap(c => c.voci).filter(v => v.quando === "ripasso" || v.quando === "cambio" || v.quando === "giornata");
  const inRegola = voci.filter(v => v.colore !== "rosso").length;
  const minuti = Object.values(sim.minuti).reduce((s, m) => s + m, 0);
  return { settimane, voci: voci.length, inRegola, mai: voci.filter(v => !v.ultima).length, percento: voci.length ? Math.round(inRegola / voci.length * 100) : 0, minutiSettimanaSignora: Math.round(minuti / settimane / sim.zone.length), rifinitureSettimana: Math.round(sim.rifiniture / settimane) };
}

// ============================================================================
//  IL TABELLONE DI COPERTURA (prova 2) e LA PROVA DEI 90 GIORNI (prova 3)
//  Una cella per ogni posto × regola che vale per quel posto. Colore:
//    verde   fatta ed è in regola
//    giallo  quasi scaduta, oppure scaduta ma già in programma (si sa quando)
//    grigio  mai fatta, ma in programma: si sa quando
//    rosso   BUCO: scaduta o mai fatta, e nelle prossime N settimane nessuno ci arriva (con un motivo)
//  Copertura = celle non rosse / tutte. Buchi = celle rosse.
// ============================================================================
export function tabellone(ctx, settimane = 13) {
  const { camere, oggi, soggiorni = [] } = ctx; const registro = ctx.registro || {}, luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = ctx.regole || regoleAttive(null), flags = ctx.flags || {}, sg = { ...SOGLIE_BASE, ...(ctx.soglie || {}) };
  const sim = simulaGovernante(ctx, settimane);
  const modello = sim ? sim.modello : [];
  const lun = ctx.lun || lunediDi(oggi);
  const programmati = Object.values(ctx.pulizie || {}).filter(p => p.origine === "governante" && p.stato !== "fatta" && p.data >= oggi);
  const haPulizia = l => modello.some(p => p.camera === l.id), haCambio = l => modello.some(p => p.camera === l.id && CAMBIO(p)), haGiornata = l => modello.some(p => p.zona === l.zona);
  const maiLibera = l => { for (let w = 0; w < settimane; w++) for (let d = 0; d < 7; d++) { const iso = aggiungiGiorni(lun, w * 7 + d); if (giornoSettimana(iso) !== 0 && !soggiorni.some(s => s.camera === l.id && soggiornoCopre({ ...s, inizio: aggiungiGiorni(s.inizio, w * 7), fine: aggiungiGiorni(s.fine, w * 7) }, iso))) return false; } return true; };
  const motivoDi = (r, l) => {
    if (!sim) return "nessuna pulizia in programma questa settimana: il tabellone non sa su cosa contare";
    if (l.tipo === "comune") return haGiornata(l) ? `non entra nei ${sg.minutiGiorno} minuti al giorno della signora (zona comune: una cosa a ritmo al giorno)` : "la signora di questa zona non ha pulizie in programma questa settimana";
    if (!haPulizia(l)) return "nessuna pulizia in programma per questo posto questa settimana (camera vuota?)";
    if (r.quando === "cambio" && !haCambio(l)) return "solo al cambio completo: nessun cambio in programma per questo posto";
    if (r.quando === "libera") return maiLibera(l) ? "solo a camera libera: nel prospetto questa camera non è mai libera" : "a camera libera: in coda nei consigli (massimo 8 a settimana)";
    if (r.quando === "giorno") return "lavoro a sé: in coda nei consigli (massimo 8 a settimana)";
    if (r.minuti > sg.minutiRifiniture) return `dura ${r.minuti} minuti, più dei ${sg.minutiRifiniture} di rifiniture per pulizia: alza i minuti per pulizia in Regole, oppure falla a camera libera`;
    return `non entra nei ${sg.minutiGiorno} minuti al giorno e ${sg.rifiniturePerPulizia} rifiniture a pulizia: alza le soglie in Regole o spegni la regola`;
  };
  const celle = [];
  for (const l of [...camere, ...luoghi]) {
    const fisso = l.tipo !== "comune" && nottiDiFila(soggiorni, l.id, oggi) >= 14;
    for (const r of regole) {
      if (r.evento) continue;
      if (!copre(regole, r, l, camere, luoghi, flags)) continue;
      if (!inStagione(r, oggi)) continue;
      if (r.soloFissi && !fisso) continue;
      const k = chiaveRegistro(r.id, l.id), reg = registro[k] || null, ult = reg?.ultima || null;
      const ogni = ogniAttuale(r, oggi, l, flags);
      const rapporto = ogni ? rapportoScadenza(r, ult, oggi, ogni) : null;
      const doc = programmati.find(p => p.regola === r.id && p.camera === l.id);
      const programmata = doc ? doc.data : (sim && sim.prima[k]) || null;
      let colore;
      if (!ogni) colore = programmata || ult ? "verde" : "rosso";
      else { const c = coloreScadenza(rapporto); colore = c === "verde" ? "verde" : c === "giallo" ? (programmata ? "giallo" : "rosso") : programmata ? (ult ? "giallo" : "grigio") : "rosso"; }
      celle.push({ luogo: l.id, luogoNome: l.nome, zona: l.zona, tipo: l.tipo, regola: r.id, nome: r.nome, gruppo: r.gruppo, codice: r.codice || "", quando: r.quando, ogni, ultima: ult, testo: testoUltima(ult, oggi), da: reg?.da || "", rapporto, colore, programmata, motivo: colore === "rosso" ? motivoDi(r, l) : "" });
    }
  }
  const rosse = celle.filter(c => c.colore === "rosso");
  // per posto: il peggio per gruppo
  const perLuogo = [...camere, ...luoghi].map(l => {
    const mie = celle.filter(c => c.luogo === l.id); const gruppi = {};
    for (const c of mie) { const g = gruppi[c.gruppo] = gruppi[c.gruppo] || { rosse: 0, gialle: 0, grigie: 0, verdi: 0, n: 0 }; g.n++; g[c.colore === "rosso" ? "rosse" : c.colore === "giallo" ? "gialle" : c.colore === "grigio" ? "grigie" : "verdi"]++; }
    return { luogo: l.id, nome: l.nome, zona: l.zona, tipo: l.tipo, n: mie.length, rosse: mie.filter(c => c.colore === "rosso").length, gialle: mie.filter(c => c.colore === "giallo").length, grigie: mie.filter(c => c.colore === "grigio").length, verdi: mie.filter(c => c.colore === "verde").length, gruppi };
  });
  // i motivi dei buchi, raggruppati, con le regole che ci cascano
  const motivi = Object.values(rosse.reduce((m, c) => { const x = m[c.motivo] = m[c.motivo] || { motivo: c.motivo, n: 0, regole: {} }; x.n++; x.regole[c.regola] = x.regole[c.regola] || { regola: c.regola, nome: c.nome, n: 0 }; x.regole[c.regola].n++; return m; }, {}))
    .map(x => ({ ...x, regole: Object.values(x.regole).sort((a, b) => b.n - a.n) })).sort((a, b) => b.n - a.n);
  const copertura = celle.length ? Math.round((celle.length - rosse.length) / celle.length * 100) : 100;
  // il bilancio: quanti minuti a settimana chiede il catalogo (per signora) e quanti ne danno le soglie
  const zone = [...new Set(camere.map(c => c.zona))]; const perZona = {};
  for (const z of zone) {
    const posti = camere.filter(c => c.zona === z); let domanda = 0;
    for (const c of celle) if (c.zona === z && c.ogni > 0 && (c.quando === "ripasso" || c.quando === "cambio" || c.quando === "giornata")) domanda += (regole.find(r => r.id === c.regola)?.minuti || 0) * 7 / c.ogni;
    let capacita = 0; for (let d = 0; d < 7; d++) { const n = modello.filter(p => p.zona === z && giornoSettimana(p.data) === d).length; if (n) capacita += Math.min(sg.minutiGiorno, n * sg.minutiRifiniture); }
    perZona[z] = { domanda: Math.round(domanda), capacita, posti: posti.length, pulizie: modello.filter(p => p.zona === z).length };
  }
  const domanda = Math.round(Object.values(perZona).reduce((s, x) => s + x.domanda, 0) / Math.max(1, zone.length)), rifiniture = Math.round(Object.values(perZona).reduce((s, x) => s + x.capacita, 0) / Math.max(1, zone.length));
  // le pulizie a fondo complete (mezza giornata, al massimo N a settimana) valgono come capacità in più, divisa tra le signore
  const fondo = Math.round(sg.camereSettimana * 180 / Math.max(1, zone.length)), capacita = rifiniture + fondo;
  const bilancio = { domanda, capacita, rifiniture, fondo, perZona, possibile: domanda ? Math.min(100, Math.round(capacita / domanda * 100)) : 100 };
  return { celle, perLuogo, motivi, copertura, buchi: rosse.length, settimane, sim, bilancio, prova: sim ? prova90(ctx, sim, regole) : null };
}
// La prova dei 90 giorni: 5 righe oneste su cosa succederebbe
function prova90(ctx, sim, regole) {
  const { camere, oggi } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, flags = ctx.flags || {}, sg = { ...SOGLIE_BASE, ...(ctx.soglie || {}) };
  const giorni = Object.entries(sim.minuti); const max = giorni.reduce((m, [k, v]) => v > m.v ? { k, v } : m, { k: "", v: 0 });
  const giorniLavoro = new Set(sim.modello.map(p => giornoSettimana(p.data))).size;
  const mediaGiorno = giorni.length ? Math.round(giorni.reduce((s, [, v]) => s + v, 0) / giorni.length) : 0;
  const domeniche = giorni.filter(([k]) => giornoSettimana(k.split("|")[1]) === 0).length;
  const grandi = sim.proposte.filter(c => c.grande).length, libere = sim.proposte.filter(c => c.libera && !c.grande).length, lavori = sim.proposte.filter(c => !c.libera && !c.grande).length;
  // alla fine: quanto è in regola (tutte le regole a ritmo, anche quelle a camera libera)
  const cal = calendarioPulito({ ...ctx, oggi: sim.fine, registro: sim.registro, regole });
  const voci = cal.flatMap(c => c.voci); const inRegola = voci.filter(v => v.colore !== "rosso").length;
  const fuori = Object.values(voci.filter(v => v.colore === "rosso").reduce((m, v) => { m[v.regola] = m[v.regola] || { nome: v.cosa, n: 0 }; m[v.regola].n++; return m; }, {})).sort((a, b) => b.n - a.n);
  const perSett = Math.round(sim.rifiniture / sim.settimane), perSignora = Math.round(perSett / Math.max(1, sim.zone.length));
  const minutiSett = Math.round(giorni.reduce((s, [, v]) => s + v, 0) / sim.settimane / Math.max(1, sim.zone.length));
  const righe = [
    `In ${sim.settimane} settimane le signore farebbero ${sim.rifiniture} rifiniture dentro le pulizie normali: circa ${perSett} a settimana, ${perSignora} a testa, ${minutiSett} minuti a settimana per signora.`,
    `Mai più di ${max.v} minuti di rifiniture in un giorno per signora (limite ${sg.minutiGiorno}), in media ${mediaGiorno} nei giorni in cui ci sono; di domenica ${domeniche ? domeniche + " volte" : "mai"}.`,
    `A camera libera: ${libere} rifiniture entrerebbero nei consigli${grandi ? `, più ${grandi} pulizie a fondo complete (massimo ${sg.camereSettimana} a settimana)` : ""}${lavori ? `, e ${lavori} lavori a sé (coperte, rinfreschi prima di un arrivo)` : ""}.`,
    `Alla fine dei ${sim.settimane * 7} giorni il catalogo sarebbe in regola al ${voci.length ? Math.round(inRegola / voci.length * 100) : 0}% (${inRegola} cose su ${voci.length}).`,
    fuori.length ? `Resterebbero indietro: ${fuori.slice(0, 5).map(f => `${f.nome} (${f.n} posti)`).join(", ")}${fuori.length > 5 ? ` e altre ${fuori.length - 5}` : ""}. Per salire: più minuti al giorno in Regole, oppure spegni quello che non ti serve.` : "Niente resterebbe indietro.",
  ];
  return { righe, percento: voci.length ? Math.round(inRegola / voci.length * 100) : 0, maxMinuti: max.v, rifiniture: sim.rifiniture, proposte: sim.proposte.length, fuori, giorniLavoro };
}

// ============================================================================
//  LA MAPPA DELLE SUPERFICI (prova di completezza)
//  Per ogni tipo di posto, tutte le superfici nell'ordine in cui si gira la stanza (in senso orario,
//  dall'alto in basso; per ogni oggetto sopra / davanti / dentro / dietro / sotto). Ogni superficie è
//  collegata alle regole del catalogo che la coprono. Una superficie senza regola attiva è un BUCO.
//  Formato: { o: "Oggetto", s: [["Superficie", ["regola1", "regola2"]], …] }  · opz: true = "se c'è"
// ============================================================================
export const SUPERFICI = {
  camera: { nome: "Camera", oggetti: [
    { o: "Soffitto e luci", s: [["Soffitto e angoli", ["plafoniere"]], ["Plafoniera o lampadario", ["plafoniere", "lampadari"]], ["Luci e lampadine (funzionano?)", ["luci_lampadine"]]] },
    { o: "Aria", s: [["Aria e odori", ["aria_odori"]]] },
    { o: "Condizionatore", s: [["Griglia", ["condizionatore_griglie", "condizionatori_maggio"]], ["Filtri", ["condizionatore_filtri", "condizionatori_maggio"]], ["Alette", ["condizionatore_griglie"]], ["Telecomando", ["contatti"]]] },
    { o: "Pareti", s: [["Pareti (ditate e segni)", ["pareti_ditate", "fondo_completa"]], ["Interruttori e prese", ["contatti", "prese_ciabatte"]]] },
    { o: "Quadri e pannello fotografico", s: [["Cornice", ["quadri"]], ["Vetro", ["quadri"]], ["Retro", ["quadri_retro"]], ["Pannello fotografico sopra il letto", ["fotomurale"]]] },
    { o: "Termosifone", s: [["Davanti", ["termosifone_polvere", "termosifoni"]], ["Dietro", ["termosifone_polvere", "termosifoni"]], ["Sopra", ["termosifone_polvere"]]] },
    { o: "Battiscopa", s: [["Battiscopa", ["battiscopa"]]] },
    { o: "Porta", s: [["Davanti", ["porte", "porte_ditate"]], ["Dietro", ["porte", "porte_ditate"]], ["Bordo sopra", ["porte"]], ["Maniglie dei due lati", ["porte", "porte_ditate", "contatti"]], ["Serratura", ["porta_stipite"]], ["Stipite", ["porta_stipite"]], ["Cardini", ["porta_stipite"]]] },
    { o: "Finestra", s: [["Vetro dentro", ["vetri_interni"]], ["Vetro fuori", ["vetri_esterni"]], ["Telaio", ["telai_binari"]], ["Binari", ["telai_binari"]], ["Maniglia", ["contatti"]], ["Davanzale dentro", ["davanzali"]], ["Davanzale fuori", ["davanzale_esterno"]]] },
    { o: "Tapparella", s: [["Stecche", ["tapparelle"]], ["Cassonetto", ["tapparelle_cassonetto"]], ["Cinghia", ["tapparelle"]]] },
    { o: "Zanzariera (se c'è)", opz: true, s: [["Rete", ["zanzariere"]], ["Telaio", ["zanzariere"]]] },
    { o: "Tende", s: [["Tessuto", ["tende_aspirate", "tende_lavate"]], ["Bastone o binario", ["tende_bastone"]]] },
    { o: "Letto", s: [["Testiera davanti", ["testiera"]], ["Testiera dietro", ["letto_spostato"]], ["Struttura e piedini", ["struttura_letto"]], ["Sotto il letto", ["sotto_letto"]], ["Doghe", ["doghe"]], ["Materasso sopra", ["materasso_aspirato"]], ["Materasso sotto", ["materasso_girato"]], ["Materasso bordi", ["materasso_aspirato"]], ["Coprimaterasso", ["coprimaterasso_cambio", "coprimaterasso_fissi"]], ["Cuscini", ["cuscini_piumoni", "controllo_materassi"]], ["Copricuscini", ["coprimaterasso_cambio", "coprimaterasso_fissi"]], ["Piumino", ["cuscini_piumoni"]], ["Coperte", ["coperte_autunno", "coperte_primavera", "coperta_scorta"]], ["Copriletto", ["copriletto"]], ["Lenzuola alla luce", ["biancheria_luce"]]] },
    { o: "Comodini", s: [["Sopra", ["comodini"]], ["Dentro", ["comodini_dentro", "dentro_armadi"]], ["Dietro", ["comodini_dentro", "dietro_mobili"]], ["Sotto", ["sotto_letto"]]] },
    { o: "Abat-jour", s: [["Paralume", ["lampade"]], ["Base", ["lampade", "comodini"]], ["Interruttore", ["contatti", "comodini"]]] },
    { o: "Armadio", s: [["Sopra", ["sopra_armadi"]], ["Ante fuori", ["armadio_ante"]], ["Ante dentro", ["dentro_armadi"]], ["Maniglie", ["armadio_ante", "contatti"]], ["Ripiani", ["dentro_armadi"]], ["Asta e grucce", ["dentro_armadi"]], ["Cassetti dentro e guide", ["dentro_armadi"]], ["Sotto", ["sotto_mobili"]], ["Dietro", ["dietro_armadi"]], ["Armadio in stoffa (se c'è)", ["armadio_stoffa"], true]] },
    { o: "Scrivania e sedie", s: [["Piano", ["scrivania"]], ["Gambe", ["scrivania"]], ["Sotto", ["sotto_mobili"]], ["Seduta e schienale", ["scrivania"]]] },
    { o: "TV", s: [["Schermo", ["tv_schermo"]], ["Retro e cavi", ["dietro_tv"]], ["Telecomando", ["contatti"]], ["Mobile sopra", ["dietro_tv", "scrivania"]], ["Mobile dentro", ["dentro_armadi"]], ["Mobile dietro", ["dietro_tv"]], ["Ciabatta", ["prese_ciabatte"]]] },
    { o: "Frigo in camera (se c'è)", opz: true, s: [["Dentro, a ogni partenza", ["minibar"]], ["Guarnizione", ["minibar_guarnizione"]], ["Retro e sotto", ["minibar_retro", "dietro_mobili"]]] },
    { o: "Specchio", s: [["Vetro", ["specchi"]], ["Cornice", ["quadri"]], ["Retro", ["quadri_retro"]]] },
    { o: "Piccoli elettrodomestici e piano d'appoggio", s: [["Phon: filtro", ["phon_filtro"]], ["Phon: impugnatura", ["contatti"]], ["Bollitore (se c'è)", ["bollitore", "bollitore_calcare"], true], ["Portapane a serrandina (se c'è)", ["portapane"], true], ["Ventilatore (se c'è)", ["ventilatore"], true]] },
    { o: "Appendiabiti e cestino", s: [["Appendiabiti e ganci", ["appendiabiti"]], ["Cestino dentro", ["cestini_lavati"]], ["Cestino fuori", ["cestini_lavati"]]] },
    { o: "Pavimento", s: [["Pavimento", ["camera_base"]], ["Fughe", ["pavimento_fughe"]], ["Angoli", ["pavimento_angoli"]], ["Sotto i mobili", ["sotto_mobili", "sotto_letto"]], ["Tappeti e passatoie", ["tappeti", "tappeti_lavati"]], ["Zerbino", ["zerbino_camera"]]] },
    { o: "Cartelli e chiavi", s: [["Scritta con il nome sulla porta", ["porte", "targhette"]], ["Cartelli e targhette", ["targhette"]], ["Portachiavi", ["contatti", "appendiabiti"]]] },
    { o: "Prima di chiudere la camera", s: [["Giro di controllo di 5 minuti", ["controllo_lusso"]], ["Camera ferma da 2+ giorni prima di un arrivo", ["arrivo_ferma"]]] },
  ] },
  bagno: { nome: "Bagno", oggetti: [
    { o: "Soffitto e luci", s: [["Soffitto e angoli (muffa)", ["soffitto_bagno_muffa", "plafoniere"]], ["Plafoniera", ["plafoniere"]], ["Luci del bagno (funzionano?)", ["luci_lampadine"]], ["Aspiratore: griglia", ["aspiratore"]]] },
    { o: "Finestra del bagno", s: [["Vetro dentro", ["vetri_interni", "finestrella_bagno"]], ["Vetro fuori", ["vetri_esterni"]], ["Telaio e binari", ["telai_binari", "finestrella_bagno"]], ["Maniglia", ["contatti"]], ["Davanzale", ["davanzali", "finestrella_bagno"]]] },
    { o: "Termosifone o scaldasalviette", s: [["Elementi davanti, dietro e sopra", ["scaldasalviette"]]] },
    { o: "Pareti", s: [["Piastrelle", ["piastrelle_pareti"]], ["Fughe", ["fughe"]], ["Silicone", ["doccia_muffa"]], ["Angoli", ["soffitto_bagno_muffa", "pavimento_angoli"]]] },
    { o: "Porta", s: [["Davanti e dietro", ["porte"]], ["Bordo sopra", ["porte"]], ["Maniglie", ["porte", "contatti"]], ["Stipite, cardini, serratura", ["porta_stipite"]]] },
    { o: "Interruttori e prese", s: [["Interruttori e prese", ["contatti"]]] },
    { o: "Specchio", s: [["Vetro", ["specchi"]], ["Cornice", ["specchi"]], ["Luce", ["lampade"]]] },
    { o: "Lavandino", s: [["Vasca", ["bagno_base"]], ["Troppopieno", ["troppopieno"]], ["Piletta", ["troppopieno", "scarichi", "scarichi_odori"]], ["Rubinetto, base e filtrino del calcare", ["soffione_rubinetti", "contatti"]], ["Sotto", ["sotto_lavandini"]], ["Sifone e tubi", ["sotto_lavandini"]], ["Mobiletto dentro e fuori", ["mobiletto_bagno"]], ["Mensola", ["mobiletto_bagno", "bagno_base"]], ["Dispenser", ["dispenser"]], ["Bicchiere e portaspazzolino", ["dispenser"]]] },
    { o: "WC", s: [["Tavoletta sopra, sotto, cerniere", ["wc_tavoletta"]], ["Bordo interno", ["wc_sotto_bordo"]], ["Sotto il bordo", ["wc_sotto_bordo"]], ["Base al pavimento", ["dietro_wc"]], ["Dietro", ["dietro_wc"]], ["Cassetta esterna sopra, davanti e tubo", ["wc_cassetta", "contatti"]], ["Tubo", ["dietro_wc"]], ["Scopino e portascopino", ["spazzolino_wc", "scopino_nuovo"]], ["Portarotolo", ["accessori_bagno"]], ["Dispenser grande della carta", ["dispenser_carta"]]] },
    { o: "Bidet", s: [["Rubinetto", ["soffione_rubinetti", "bagno_base"]], ["Scarico", ["scarichi"]], ["Sotto", ["dietro_wc"]], ["Dietro", ["dietro_wc"]]] },
    { o: "Doccia", s: [["Piatto", ["piastrelle_doccia"]], ["Piletta e capelli", ["scarichi", "scarichi_odori"]], ["Box vetro dentro", ["box_doccia_vetro", "box_doccia_tergivetro"]], ["Box vetro fuori", ["box_doccia_fuori"]], ["Profili", ["box_doccia_binari"]], ["Binari delle ante", ["box_doccia_binari"]], ["Guarnizioni", ["doccia_muffa", "box_doccia_binari"]], ["Soffione", ["soffione_rubinetti"]], ["Flessibile", ["soffione_rubinetti"]], ["Miscelatore", ["soffione_rubinetti", "contatti"]], ["Mensola", ["bagno_base", "piastrelle_doccia"]], ["Tenda (se c'è)", ["tenda_doccia"], true], ["Silicone", ["doccia_muffa"]], ["Fughe", ["fughe"]], ["Tappetino antiscivolo (se c'è)", ["tappetino_doccia"], true], ["Portasapone", ["accessori_bagno"]]] },
    { o: "Accessori", s: [["Portasciugamani e ganci", ["accessori_bagno"]], ["Mensola di vetro sotto lo specchio", ["specchi", "mobiletto_bagno"]], ["Bidoncino dentro, fuori, coperchio", ["cestini_lavati"]], ["Tappetino", ["tappetini_bagno"]], ["Accappatoio", ["accappatoi"]], ["Asciugamani alla luce", ["asciugamani_luce"]], ["Dotazioni: carta, sapone, bicchieri, phon", ["dotazioni_bagno"]]] },
    { o: "Pavimento", s: [["Pavimento", ["bagno_base"]], ["Fughe", ["pavimento_fughe"]], ["Angoli", ["pavimento_angoli"]], ["Dietro la porta", ["pavimento_angoli"]], ["Scarico a pavimento", ["scarico_pavimento"]]] },
  ] },
  cucina: { nome: "Cucina (appartamenti)", oggetti: [
    { o: "Pensili", s: [["Sopra", ["sopra_armadi"]], ["Ante fuori e maniglie", ["pensili_ante"]], ["Ante dentro e ripiani", ["pensili"]]] },
    { o: "Cappa", s: [["Filtri", ["cappa_filtri"]], ["Esterno", ["cappa_esterno"]], ["Sotto", ["cappa_esterno"]]] },
    { o: "Piano cottura", s: [["Fornelli", ["cucina_base"]], ["Griglie", ["cucina_base", "fornelli_fondo"]], ["Spartifiamma", ["fornelli_fondo"]], ["Manopole", ["fornelli_fondo", "contatti"]], ["Sotto le griglie", ["fornelli_fondo"]]] },
    { o: "Forno", s: [["Dentro", ["forno"]], ["Porta e vetro", ["forno"]], ["Guarnizione", ["forno"]], ["Teglie", ["forno"]], ["Sopra", ["forno"]]] },
    { o: "Piano di lavoro", s: [["Piano di lavoro", ["cucina_base"]], ["Paraschizzi", ["dietro_fornelli"]], ["Barra con i mestoli appesi", ["barra_utensili"]]] },
    { o: "Lavello", s: [["Vasca", ["cucina_base"]], ["Scarico", ["scarichi"]], ["Rubinetto", ["cucina_base", "contatti", "soffione_rubinetti"]], ["Sifone", ["sotto_lavello"]], ["Sotto", ["sotto_lavello"]]] },
    { o: "Lavastoviglie", s: [["A ogni partenza", ["lavastoviglie_partenza"]], ["Filtro", ["lavastoviglie_filtro", "lavastoviglie_partenza"]], ["Guarnizione", ["lavastoviglie_esterno"]], ["Cestelli", ["lavastoviglie_esterno"]], ["Esterno", ["lavastoviglie_esterno"]]] },
    { o: "Frigo e freezer", s: [["A ogni partenza", ["frigo_partenza"]], ["Ripiani", ["frigo_ripiani", "frigo_partenza"]], ["Cassetti", ["frigo_ripiani"]], ["Guarnizioni", ["guarnizioni_frigo"]], ["Sopra", ["sopra_armadi"]], ["Griglia dietro", ["dietro_frigo"]], ["Sotto", ["dietro_frigo"]], ["Sbrinare", ["frigo_sbrinato"]]] },
    { o: "Stoviglie", s: [["Inventario a ogni partenza", ["inventario_stoviglie"]]] },
    { o: "Microonde", s: [["Dentro", ["microonde_fondo", "cucina_base"]], ["Piatto", ["microonde_fondo"]], ["Esterno", ["cucina_base"]]] },
    { o: "Bollitore e moka", s: [["Bollitore", ["moka", "bollitore_calcare"]], ["Moka", ["moka"]]] },
    { o: "Tavolo e sedie", s: [["Tavolo", ["tavolo_sedie"]], ["Sedie", ["tavolo_sedie"]]] },
    { o: "Bidoni della differenziata", s: [["Dentro", ["cucina_base", "bidoni_cucina", "bidoni_calendario"]], ["Fuori", ["bidoni_cucina"]], ["Coperchi", ["bidoni_cucina"]], ["Fuori in strada secondo il calendario", ["bidoni_calendario"]]] },
    { o: "Pavimento", s: [["Pavimento", ["camera_base"]], ["Sotto frigo e cucina", ["dietro_frigo"]], ["Fughe", ["pavimento_fughe"]]] },
    { o: "Prese e finestra", s: [["Prese e interruttori", ["contatti"]], ["Finestra", ["vetri_interni", "telai_binari", "davanzali"]]] },
  ] },
  balcone: { nome: "Balcone (camere che ce l'hanno)", oggetti: [
    { o: "Balcone", s: [["Pavimento", ["balcone_scopa", "balcone_lavato"]], ["Scarico", ["balcone_fondo", "balcone_scopa"]], ["Ringhiera e rete", ["balcone_fondo"]], ["Muretto", ["balcone_fondo"]], ["Muro, canaline e tubi", ["pareti_balcone"]], ["Sedie e sdraio", ["balcone_lavato"]], ["Lampada", ["balcone_fondo"]], ["Soglia", ["balcone_lavato"]], ["Unità esterna del condizionatore", ["condizionatore_esterno"]], ["Piante e sottovasi", ["piante_balcone"]]] },
  ] },
  ingresso: { nome: "Ingresso", oggetti: [
    { o: "Ingresso", s: [["Portone", ["ingresso"]], ["Maniglione", ["ingresso"]], ["Citofono", ["ingresso"]], ["Cassetta della posta", ["ingresso"]], ["Targhe", ["ingresso"]], ["Pavimento e rivestimento in marmo", ["ingresso"]], ["Cassapanca, lanterna e fiori", ["decorazioni"]], ["Zerbino", ["ingresso", "zerbini_lavati"]], ["Bidoni dei rifiuti", ["bidoni"]], ["Luci esterne", ["luci_esterne"]]] },
  ] },
  scale: { nome: "Scale di servizio", oggetti: [
    { o: "Scale", s: [["Gradini in marmo", ["scale_scopate", "scale_lavate"]], ["Alzate", ["scale_lavate"]], ["Battiscopa", ["scale_corrimano"]], ["Corrimano", ["scale_corrimano"]], ["Ringhiera", ["scale_corrimano"]], ["Pianerottoli", ["scale_lavate"]], ["Plafoniere e lampada in vimini", ["scale_pareti_luci", "luci_esterne"]], ["Finestre", ["vetri_scale"]], ["Pareti bianche", ["scale_pareti_luci"]], ["Disegni dipinti sui muri", ["murales"]], ["Tavolino, vaso, pampas e tovaglia", ["decorazioni"]]] },
  ] },
  corridoio: { nome: "Corridoi", oggetti: [
    { o: "Corridoio", s: [["Pavimento", ["corridoio_passata", "corridoio_fondo"]], ["Battiscopa", ["corridoio_fondo"]], ["Porte comuni", ["corridoio_fondo"]], ["Quadri", ["corridoio_quadri_estintore"]], ["Estintore", ["corridoio_quadri_estintore"]], ["Luci", ["corridoio_fondo"]], ["Pareti bianche", ["corridoio_fondo"]], ["Disegni dipinti sui muri (2° piano)", ["murales"], true], ["Pouf contenitori e cuscini (2° piano)", ["pouf_corridoio"], true], ["Termosifone del corridoio", ["termosifone_polvere", "termosifoni"]], ["Cestino comune", ["corridoio_passata"]]] },
  ] },
  terrazzo: { nome: "Terrazzo", oggetti: [
    { o: "Terrazzo", s: [["Pavimento", ["terrazzo_scopa", "terrazzo_fondo"]], ["Scarichi", ["terrazzo_fondo", "scarichi_terrazzo"]], ["Ringhiere", ["terrazzo_fondo"]], ["Muretti", ["terrazzo_fondo"]], ["Mobili", ["terrazzo_scopa", "terrazzo_fondo"]], ["Stendini", ["stendini"]], ["Lampade", ["terrazzo_fondo", "luci_esterne"]]] },
  ] },
  lavanderia: { nome: "Lavanderia, magazzino e ripostiglio", oggetti: [
    { o: "Lavatrice", s: [["Cassetto", ["lavatrice_cassetto"]], ["Guarnizione", ["lavatrice_cassetto"]], ["Filtro", ["lavatrice_vuoto"]], ["Cestello", ["lavatrice_vuoto"]], ["Esterno", ["lavatrice_zona"]]] },
    { o: "Asciugatrice (se c'è)", opz: true, s: [["Filtro", ["asciugatrice", "lavatrice_zona"]], ["Serbatoio e condensatore", ["asciugatrice"]]] },
    { o: "Lavatoio", s: [["Vasca e rubinetto", ["lavatoio"]]] },
    { o: "Magazzino biancheria", s: [["Scaffali", ["scaffali_lavanderia", "biancheria_scorta"]], ["Set di scorta per ogni camera", ["biancheria_scorta"]], ["Controllo alla luce alla piegatura", ["controllo_piegatura"]], ["Cestoni", ["scaffali_lavanderia"]], ["Pavimento", ["lavatrice_zona"]]] },
    { o: "Lavanderia", s: [["Pavimento", ["lavatrice_zona"]], ["Scalinata", ["scalinata_lavanderia"]], ["Stendini", ["stendini"]], ["Ferro da stiro e asse", ["ferro_stiro"]]] },
    { o: "Attrezzi", s: [["Carrello", ["carrello"]], ["Aspirapolvere", ["aspirapolvere"]], ["Scope, spazzoloni e mop", ["scope"]], ["Secchi", ["carrello"]], ["Mappine", ["mappine"]], ["Panni", ["microfibra"]], ["Spugne", ["spugne"]], ["Guanti", ["guanti"]]] },
    { o: "Ripostiglio dei prodotti", s: [["Scaffale dei prodotti", ["ripostiglio_prodotti", "scorte"]], ["Pavimento", ["ripostiglio_prodotti"]]] },
  ] },
};
const slug = t => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export function idSuperficie(tipo, oggetto, nome) { return `${tipo}:${slug(oggetto)}:${slug(nome)}`; }
// Quali tipi di superficie ha un posto (camera: camera+bagno(+balcone); appartamento: camera+bagno+cucina; zona comune: la sua)
export function tipiDiLuogo(l, flags = {}) {
  if (!l) return [];
  if (l.tipo === "comune") return [l.id.startsWith("corridoio") ? "corridoio" : l.id];
  const t = ["camera", "bagno"]; if (l.tipo === "casa") t.push("cucina"); if ((flags.balconi || {})[l.id] || l.balcone) t.push("balcone"); return t;
}
// La mappa con le regole attive sopra: per ogni tipo, gli oggetti e le superfici con le regole che le coprono e i buchi
export function mappaSuperfici(regole, extraSuperfici = {}) {
  const attive = new Map(regole.map(r => [r.id, r]));
  const perSuperficie = {}; // regole personali agganciate a una superficie
  for (const r of regole) for (const sid of (r.superfici || [])) (perSuperficie[sid] = perSuperficie[sid] || []).push(r);
  const out = {}; let buchiTot = 0, totale = 0;
  for (const [tipo, def] of Object.entries(SUPERFICI)) {
    const oggetti = def.oggetti.map(og => ({ o: og.o, opz: !!og.opz, superfici: og.s.map(([nome, ids, opz]) => {
      const id = idSuperficie(tipo, og.o, nome);
      const rr = [...ids.map(x => attive.get(x)).filter(Boolean), ...(perSuperficie[id] || [])];
      const buco = rr.length === 0 && !(opz || og.opz);
      return { id, nome, regole: rr, buco, opz: !!(opz || og.opz) };
    }) }));
    // superfici aggiunte dal giro (per tipo)
    for (const ex of (extraSuperfici[tipo] || [])) {
      const id = ex.id || idSuperficie(tipo, ex.oggetto || "Aggiunte", ex.nome);
      const rr = perSuperficie[id] || [];
      let og = oggetti.find(x => x.o === (ex.oggetto || "Aggiunte nel giro")); if (!og) { og = { o: ex.oggetto || "Aggiunte nel giro", opz: false, superfici: [] }; oggetti.push(og); }
      og.superfici.push({ id, nome: ex.nome, regole: rr, buco: rr.length === 0, opz: false, aggiunta: true });
    }
    const sup = oggetti.flatMap(o => o.superfici); const buchi = sup.filter(x => x.buco).length;
    buchiTot += buchi; totale += sup.length;
    out[tipo] = { tipo, nome: def.nome, oggetti, superfici: sup.length, buchi };
  }
  return { tipi: out, buchi: buchiTot, superfici: totale };
}
