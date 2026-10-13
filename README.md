# Pulizie · Le Stanze di Ricci

App gratuita per le pulizie, il prospetto e le paghe de **Le Stanze di Ricci** (Lesina).
Funziona su iPhone e Android aprendo un link e mettendola in Home. Niente abbonamenti.

**Link dell'app:** https://michelepegoli2210-hub.github.io/pulizie-stanze-ricci/

## Com'è fatta (in parole semplici)

| Pezzo | A cosa serve |
|---|---|
| **GitHub Pages** (questo repository) | Tiene i file dell'app e li mostra al link qui sopra. Gratis. |
| **Firebase – Firestore** | Il magazzino dei dati: prospetto, pulizie, Fatta/Non fatta/Problema, pagamenti, listino, note. Gratis (piano Spark). |
| **Firebase – Authentication** | Gli accessi con nome e password. I proprietari creano gli account dalla console. |
| **SheetJS** (`xlsx.min.js`) | Legge il foglio Excel di papà dentro al telefono, con regole fisse. Niente intelligenza artificiale. |

## I file

| File | Cosa contiene | Quando si tocca |
|---|---|---|
| `index.html` | La pagina (scheletro) | Quasi mai |
| `style.css` | I colori e la grafica ("Laguna profonda", chiaro e scuro) | Per cambiare l'aspetto |
| `app.js` | Le schermate e i bottoni | Per cambiare come funziona |
| `logica.js` | Date, settimana di paga (sabato ore 13), prezzi, piano delle pulizie | Per cambiare i conti |
| `regole.js` | **Il dizionario**: camere, zone, giorni di riserva delle pulizie, cosa si fa, prezzi di partenza, regole per leggere l'Excel | Per cambiare le regole |
| `catalogo/` | **La fonte delle regole della governante**: `catalogo-governante-v4.csv` (il catalogo, una riga per cosa), `catalogo-governante.xlsx` (checklist della signora, calendario vero, livelli), `mockup-signora.png` | Qui si cambiano catalogo e calendario; poi si rilancia `strumenti/genera-catalogo.mjs` |
| `catalogo.js` | Il catalogo tradotto per l'app (**generato**, non si tocca a mano) | Mai a mano: lo scrive `strumenti/genera-catalogo.mjs` |
| `governante.js` | La testa della governante: stelle per passaggio, calendario, i tre modi (Tecnici · Operai · Booking), tabellone, conto per stagione, mappa, materiali | Per cambiare come ragiona |
| `strumenti/` | Gli script da computer: genera il catalogo, legge il CSV, l'unione fatta per la 0.26 | Quando cambia il file del catalogo |
| `db.js` | Il collegamento ai dati (Firebase, oppure modalità prova) | Quasi mai |
| `firebase-config.js` | I dati del progetto Firebase (pubblici) | Una volta sola, al Passo 2 |
| `firestore.rules` | Le regole di sicurezza da incollare nella console Firebase | Al Passo 4 |
| `sw.js`, `manifest.json`, icone | Fanno funzionare l'app in Home e senza rete | Quando si pubblica una versione nuova si cambia il numero in `sw.js` |
| `firebase-bundle.js`, `xlsx.min.js` | Librerie già pronte (non si modificano a mano) | Mai |

## Come si aggiorna l'app

1. Apri il repository su GitHub, entra nel file da cambiare, tocca la matita, incolla il nuovo contenuto, **Commit changes**.
   Oppure: **Add file → Upload files**, trascina i file nuovi, **Commit changes** (i file con lo stesso nome vengono sostituiti).
2. Entro un paio di minuti GitHub Pages pubblica la nuova versione.
3. Sui telefoni compare "C'è una versione nuova dell'app · Aggiorna" (se in `sw.js` è stato cambiato il numero di versione).

## Modalità prova

Finché in `firebase-config.js` non ci sono i dati di Firebase, l'app parte in **modalità prova**: dati di esempio,
salvati solo sul telefono che li usa. Si può forzare anche dopo aprendo il link con `?prova=1` alla fine.

## Ruoli

- **proprietario**: vede e cambia tutto (prospetto, pulizie, paghe, listino, note, persone e accessi).
- **addetta**: vede solo la sua zona e i suoi soldi; può solo premere Fatta / Non fatta / Problema.
- **lettura**: vede tutto, non cambia niente.

Il ruolo sta nella raccolta `ruoli` di Firestore, in un documento che ha come nome l'**email** della persona
(es. `primopiano@stanzericci.app`). Campi: `login`, `nome`, `ruolo`, `zona` (per le signore: `p1`, `p2` oppure `ap`).
Si gestisce dall'app: ⋯ → **Persone e accessi**. La password invece si crea nella console Firebase
(Authentication → Utenti → Aggiungi utente) con la stessa email.
I quattro proprietari di base (`michele`, `papa`, `mamma`, `michelesantucci`) entrano sempre, anche se la raccolta fosse vuota.

## Dettagli del giorno e messaggio alle signore (dalla versione 0.8)

- **Dettagli di una camera**: in Gestione → Oggi si tocca la camera e si scrivono i "Dettagli per la signora"
  (anche ogni mattina). Restano scritti sulla pulizia di quel giorno (campo `dettagli` in `pulizie`); il piano
  automatico non li tocca. La signora li vede nel riquadro giallo e, grandissimi, nella schermata che si apre con
  **INIZIA LA PULIZIA** (bottone "HO CAPITO, COMINCIO!").
- **Messaggio del giorno**: in Gestione → Oggi, riquadro "Messaggio alle signore" → Scrivi. Sta in
  `impostazioni/messaggi` (una voce per giorno, si tengono gli ultimi 60 giorni). Lo vedono tutte le signore in cima
  alla loro schermata e nella schermata grande.
- **Sfondo**: dietro a tutto c'è la laguna di Lesina disegnata in `sfondo-laguna.svg` (cielo, Gargano, acqua, canne,
  fenicotteri). Per cambiarla basta sostituire quel file (stesso nome) nel repository.
- **Piantina** (dalla 0.10): la schermata delle signore è la piantina del loro piano (camere a sinistra e a destra del
  corridoio, poi via Nazario Sauro; per gli appartamenti le tre case). Ogni camera è un riquadro colorato per stato; si
  tocca e si apre la schermata grande. La posizione delle camere si cambia in `regole.js` (campo `lato`: L, R, S, A).
- **Avvisi alle signore** (dalla 0.12): su **WhatsApp** l'app prepara il testo (piano del giorno, dettagli di una
  camera, messaggio del giorno) e apre WhatsApp: si sceglie il gruppo e si preme Invia (WhatsApp non permette invii
  automatici gratuiti). Su **Telegram** gli avvisi partono da soli: in ⋯ → "Avvisi alle signore" si mettono il token
  del bot (da @BotFather) e il gruppo ("Cerca il gruppo da solo"), più il nome Telegram di ogni signora per taggarla.
  Tutto sta in `impostazioni/avvisi`. Il piano del mattino parte la prima volta che un proprietario apre l'app dopo
  l'ora scelta (campo `ultimoPiano` per non mandarlo due volte).
- **Richieste del giorno nel controllo** (dalla 0.16): i dettagli scritti per una camera ("frigorifero, doccia
  muffa") e le istruzioni dell'ospite diventano caselle da verificare nella scheda del controllo (controllatrice e
  proprietari). Ogni richiesta non spuntata toglie punti al voto (regola "penalitaRichiesta", di base 3) e quindi la
  pulizia si paga meno (voto 7 → 100% senza bonus, voto 4 → 50% + richiamo). Nel controllo si salvano `richieste`
  e `nonFatte` (regole di sicurezza aggiornate di conseguenza).
- **WhatsApp per le signore**: in ⋯ → Avvisi si mette il numero che riceve gli avvisi; alla signora compare "Avvisa su
  WhatsApp" dopo un problema / camera non fatta e quando ha finito tutte le camere.

## Compilare il prospetto in un attimo (dalla versione 0.17)

In Gestione → Prospetto (e in Oggi) ci sono tre modi veloci, tutti senza intelligenza artificiale:

- **🗣️ Dimmi il prospetto**: si scrive o si detta (microfono della tastiera, o il bottone "Parla" dove il telefono lo
  permette) chi arriva, in quale camera e quando, **una riga per camera**. Il file `dettatura.js` capisce le frasi con
  regole fisse e fa vedere l'anteprima ("Ho capito così") prima di salvare. Esempi: `Salvatore: Manna, 2 persone, da
  lunedì a venerdì` · `Aurora: Palazzo dal 12 al 16 ottobre` · `Alba: Fondamenta tutto novembre` · `Michele: libera`
  (toglie chi c'era) · `Nicole: Castaldi parte giovedì` (accorcia) · `Lella: Rahhal resta fino a domenica` (allunga) ·
  `Fenicotteri come la settimana scorsa` · `settimana prossima` da sola in una riga. Se mancano i giorni mette da lunedì
  a venerdì; se manca il nome mette l'ultimo ospite di quella camera (sempre segnalato in arancione nell'anteprima).
  In alto si sceglie la settimana di cui si parla (questa / prossima / quella dopo); di venerdì, sabato e domenica
  è già selezionata la prossima. I soggiorni salvati così hanno `origine: "dettatura"`.
- **📄 Foglio di papà**: il file Excel letto con le regole di `excel.js` (come prima, ora anche dal Prospetto).
- **🔁 Come la settimana scorsa**: per le camere ancora vuote ripropone l'ospite della settimana prima spostato di
  7 giorni (solo soggiorni corti; i mensili restano). Si toglie la spunta a chi non torna e si salva (`origine: "copia"`).
- **Foto del prospetto**: dentro "Dimmi il prospetto" c'è "Copia la richiesta per l'IA": si incolla in un'IA gratuita
  (Claude, ChatGPT, Gemini) insieme alla foto del foglio; la risposta arriva già nel formato "Camera: Nome, N persone,
  dal GG mese al GG mese" e si incolla nell'app. L'app non chiama nessuna IA: è solo un aiuto esterno per leggere la foto.

Dopo il salvataggio le pulizie dei prossimi 14 giorni si ricalcolano da sole (come sempre).

## Giorni per esteso, "da fare sempre" e domanda di chiusura (dalla versione 0.18)

- **Prospetto a elenco**: in Gestione → Prospetto la vista predefinita è ora **Elenco**: una riga per camera con chi c'è,
  "Arriva venerdì 16 ott → parte domenica 18 ott · 2 notti", le etichette *parte oggi / arriva domani / in camera*, le note
  e le pulizie della settimana. Il tabellone a griglia resta nelle linguette **Tabellone** e **Mese**.
- **Giorno della settimana sempre scritto**: arrivi e partenze compaiono ovunque con il giorno per esteso (riquadri delle
  signore, schermata grande, scheda della camera, avvisi WhatsApp/Telegram, anteprima di "Dimmi il prospetto"). Le pulizie
  portano con sé anche `parteIl` (quando parte l'ospite) e `prossimoArrivo/prossimoNome/prossimoPersone` (chi arriva dopo),
  così le signore li vedono senza avere accesso al prospetto.
- **Da fare sempre, camera per camera** (`impostazioni/promemoria`, es. `{ salvatore: "Balcone" }`): si scrive in ⋯ oppure
  nella scheda della camera. La signora lo vede in grande quando apre la camera ("Sempre in Salvatore: Balcone"), nella
  domanda di chiusura e la controllatrice lo trova tra le cose da verificare (punti `s0, s1…`; ogni cosa non spuntata
  toglie i punti della regola "penalitaRichiesta").
- **Domanda di chiusura**: quando una signora preme "Ho finito" compare "Sei sicura che in Salvatore tutto sia stato fatto
  al meglio?" con le cose da spuntare una per una (quelle fisse della camera + i dettagli del giorno + le istruzioni
  dell'ospite). Il bottone verde si accende solo dopo tutte le spunte; senza cose particolari resta solo la domanda.
- **Guarda l'app come la vedono le signore**: in ⋯ i proprietari possono aprire l'app come "Signora 1° piano / 2° piano /
  appartamenti" con i dati veri (banner nero in alto, "Torna alla gestione"). Per giocare senza toccare dati veri c'è sempre
  la modalità prova (`?prova=1`).

## Grafica "piastre", link di prova diretti, LED e sezioni nuove (versioni 0.18.1 – 0.20)

- **Grafica**: tutto è fatto di piastre di metallo satinato scuro (colori presi dall'iPhone 18 Pro: argento per i riquadri
  neutri, Light Blue per giorni/linguette/barra, Burgundy per "problema" e per il giorno scelto, rosso Ferrari per "da pulire",
  Cosmic Orange per "in corso", verde per "pulita", blu per i bottoni principali). I riquadri bianchi sono bianco panna.
  Le finiture stanno tutte in `style.css` nel blocco "PIASTRE" (variabili `--al1…--al5`, `--gloss`, `--lucido`, `--sp`).
- **Link di prova diretti** (dati finti, solo sul telefono che li apre): `index.html?prova=1&signora=1` (1° piano), `&signora=2`
  (2° piano), `&signora=3` (appartamenti), `&gestione=1` (proprietario). La prova prepara da sola le pulizie dei prossimi
  giorni e almeno tre camere da fare oggi per zona (`db.js`, `datiIniziali`). Chiave dei dati di prova: `ricci_prova_db_v5`.
- **LED rosso**: dove c'è un problema ancora aperto lampeggia solo un pallino rosso (sulla targhetta della camera, sul giorno
  nella striscia in alto, accanto al nome della zona, sull'avatar della signora e sul tasto "Lavori di manutenzione").
- **Lavori di manutenzione** (raccolta `manutenzione`, documenti `pul_<idPulizia>` per i problemi segnalati e `man_<tempo>`
  per quelli aggiunti a mano): ogni problema segnalato da una signora crea da solo una voce che resta anche dopo che la
  camera viene ripulita. I proprietari aprono la sezione dal tasto in cima a "Oggi", scrivono note, segnano "Fatto,
  sistemato" o cancellano. Le regole Firestore permettono alle signore solo di AGGIUNGERE voci per la loro zona.
  Sfondo: `sfondo-manutenzione.svg` (officina).
- **La signora, settimana per settimana**: in cima a "Oggi" ci sono gli avatar delle tre signore; toccandone una si vede
  tutto quello che fa e deve fare nella settimana (giorno per giorno, con stato, orari, paga della settimana, problemi),
  con i bottoni "Mandale il piano della settimana su WhatsApp", "Aggiungi un lavoro extra" e "Guarda l'app come la vede lei".
  Sfondo: laguna + bolle di sapone (`sfondo-bolle.svg`).

## La governante (dalla versione 0.21, rifatta nella 0.22)

Una governante come in un hotel di lusso, **senza intelligenza artificiale**: catalogo + calendario + registro "ultima volta fatto".
- **Il catalogo** sta in `governante.js` (`CATALOGO`): una riga per ogni singola cosa (183 voci nella 0.25), con nome preciso, dove, ogni quanto,
  quando (`ripasso` = durante qualunque pulizia, `cambio` = solo nel cambio completo, `libera` = a camera libera, `giornata` = zona
  comune alla prima pulizia del giorno, `giorno` = lavoro a sé), minuti, prezzo, "come si fa" in 3 righe con prodotto e colore del
  panno, "come si controlla" per la controllatrice, stagione/meteo. Le zone comuni sono in `LUOGHI_COMUNI`. Le modifiche fatte
  dall'app (ritmi con + e −, interruttori, soglie, regole nuove, camere con balcone/sulla strada, "più avanti"/"no") stanno in
  `impostazioni/governante`.
- **Il metodo: le RIFINITURE dentro le pulizie normali** (`rifinitureDelGiorno`). A ogni pulizia normale la governante aggiunge le
  cose "a ogni pulizia" più 1-2 rifiniture da 5-10 minuti scelte tra le più in ritardo per quella camera, entro le soglie (minuti per
  pulizia, rifiniture per pulizia, minuti al giorno per signora). Le zone comuni vanno alla prima pulizia del giorno. La signora le
  vede nella tessera ("+2 rifiniture · 10 min"), nella schermata grande (nome, minuti, come si fa, "Non posso" con motivo), nella
  domanda finale; la controllatrice le trova nella checklist. Ogni rifinitura ha un prezzo piccolo che si somma alla camera
  (`rifiniture`, `extraRifiniture` sulla pulizia; `importoFinale` li conta).
- **Il registro** è la raccolta `governante_registro` (una voce per cosa+posto: `ultima`, `da`, `n`, e `saltata`/`motivo` per il
  "Non posso"). Lo scrive chi segna "fatto"; i proprietari anche a mano dal Calendario del pulito.
- **I consigli della settimana** (`proposteSettimana`): solo le cose a camera libera, i lavori a sé e gli eventi (pulizia a fondo
  completa dopo un soggiorno di 2+ settimane o per una camera molto indietro). Massimo 8, al massimo 2 per posto e 3 per regola,
  entro i minuti al giorno rifiniture comprese; la fondo completa fa eccezione (mezza giornata, N a settimana). "Va bene" crea una
  pulizia `tipo: "fondo"`, `origine: "governante"`. Automatico acceso = le piccole entrano da sole.
- **Copertura** (`simulaCopertura`): in Regole, con le soglie attuali, quanto del catalogo resta in regola ripetendo per 8 settimane
  le pulizie di questa settimana. È il modo onesto di vedere se le soglie bastano per il ritmo scritto nel catalogo.
- **Calendario del pulito** (`calendarioPulito`): per ogni posto, ogni voce con ultima volta e colore (verde/giallo/rosso).
- **Mappa delle superfici** (dalla 0.23, `SUPERFICI` in `governante.js`): per ogni tipo di posto (camera, bagno, cucina, balcone,
  ingresso, scale, corridoi, terrazzo, lavanderia) tutte le superfici nell'ordine in cui si gira la stanza, ognuna collegata alle
  regole del catalogo che la coprono (`mappaSuperfici`). Una superficie senza regola attiva è un BUCO (rosso, contato in cima e
  sulla card della governante). Le regole personali possono agganciarsi a una superficie (`superfici: [id]`).
  **Giro con la mamma**: si sceglie un posto, si gira superficie per superficie ("C'è" / "Manca qualcosa"); quello che manca diventa
  una regola personale e una superficie nuova della mappa (`impostazioni/governante.superficiExtra`, `giri`).
- **Dalla 0.24 — catalogo con prodotto e avvertenze, tabellone di copertura, prova dei 90 giorni.**
  Ogni regola ha `prodotto` (se non è scritto a mano lo ricava dal "come si fa": `prodottoDa`), `note` (avvertenze e scatti: "Mai
  acidi sul marmo", "Dopo un vento forte controlla anche se non è scaduta", "Entra nella domanda finale"…), `codice` (il numero della
  riga nella tabella di Michele, quando c'è) e `domanda: true` per le poche cose "sempre" che entrano nella domanda finale della
  signora. Le righe a più ritmi della tabella sono spezzate in regole sorelle (porte: ditate a ogni pulizia + lavate ogni 2
  settimane; comodini: sopra sempre + dentro/dietro ogni 2 settimane; frigo in camera: dentro a ogni partenza + guarnizione + retro;
  box doccia: tergivetro sempre + anticalcare ogni settimana + fuori ogni 2; lavastoviglie e frigo degli appartamenti a ogni
  partenza + a fondo). Regole nuove: aria e odori, luci e lampadine, dotazioni del bagno, asciugamani alla luce, scarico a
  pavimento, odori dagli scarichi, inventario stoviglie, bidoni col calendario di Lesina, luci esterne, scope e mop, spugne, guanti,
  biancheria di scorta, controllo alla piegatura, ferro da stiro, condizionatori a maggio e ottobre, soglie delle coperte (M01) nelle
  note, "camera ferma da 2+ giorni: rinfresco prima dell'arrivo" (evento `arrivo`), fondo completa anche ogni 6 mesi (`ogniEvento`).
  La **partenza grigia**: una cosa mai registrata vale come fatta il giorno in cui la governante è partita (`impostazioni/
  governante.inizio`, `inizioGovernante`), così le cose a ritmo corto passano avanti e quelle a ritmo lungo aspettano; l'urgenza pesa
  la priorità (igiene 1,5 · ospite 1 · nascosto 0,6). La pulizia a fondo completa segna fatte tutte le regole della camera
  (`regoleDellaFondoCompleta`). I consigli accettati occupano il budget dei minuti del giorno della signora.
  **Tabellone di copertura** (`tabellone`, scheda Tabellone): una cella per ogni posto × regola; verde fatta e in regola, giallo quasi
  scaduta o scaduta ma in programma, grigio mai fatta ma in programma (con la data), rosso = buco: nessuno ci arriva nelle prossime
  13 settimane, con il motivo (non entra nei minuti, solo al cambio e niente cambi, camera mai libera, dura più dei minuti per
  pulizia, in coda nei consigli…). In cima **Copertura %** e **Buchi**; "Il conto" dice quanti minuti a settimana chiede il catalogo
  per signora e quanti ne danno le soglie (rifiniture + pulizie a fondo complete). Filtri grandi: per posto (un quadratino per gruppo),
  per regola, i buchi raggruppati per motivo, per signora, solo rosse; ✓ segna una cosa fatta oggi. Il tasto "Metti le settimanali
  dentro la totale" sposta le regole di camera/bagno/cucina con ritmo ≤ 7 giorni dentro la pulizia totale del venerdì (senza extra:
  `dentroTotale` in `impostazioni/governante.regole`), e si può tornare indietro; nelle Regole c'è lo stesso tasto regola per regola.
  **Prova la governante per 90 giorni** (`simulaGovernante` + `prova90`): ripete le pulizie di questa settimana e il prospetto per 13
  settimane con tutti i consigli accettati e risponde in 5 righe (rifiniture, minuti al giorno mai sopra il limite e mai di domenica,
  cosa entra a camera libera, a quanto arriva il catalogo, cosa resta indietro).
- **Dalla 0.25 — le foto delle camere diventano regole, materiali per posto e "Rivedi con la mamma" (prova 4).**
  Dalle foto di Michele: regole nuove (pannello fotografico sopra il letto, tappeti e passatoie, portapane, armadio in stoffa,
  dispenser grande della carta, accappatoi, finestrella del bagno in legno, barra dei mestoli, unità esterna del condizionatore,
  piante e sottovasi, muro del balcone, disegni dipinti sui muri, pouf del corridoio, decorazioni dell'ingresso e delle scale) e regole
  adattate (box doccia a soffietto in PVC, cassetta esterna del WC, termosifone in ghisa del bagno, laminato chiaro, scritta con il nome
  sulla porta, marmo di scale e ingresso); la mappa segna "se c'è" quello che nelle foto non si vede (zanzariere, bollitore,
  ventilatore, tappetino antiscivolo). **Materiali dei posti** (`MATERIALI`, `materialiBase`, `materialiDi`, `rigaMateriale`): per ogni
  posto pavimento (marmo lucido · gres · cotto · legno), box doccia (soffietto PVC · vetro · tenda · niente) e porte (legno · laminato),
  con i valori di partenza dalle foto e i cambi in `impostazioni/governante.materiali[luogo]`; le regole con `materiale:` mostrano alla
  signora la riga "Qui: <posto>: <materiale> → come si fa. Mai …". `SCHEDA_MATERIALI` è la scheda di come si tratta ogni cosa.
  **Rivedi con la mamma**: in Regole il contatore "Regole riviste: N su M" con le prossime da rivedere; per ogni regola il foglio con il
  "come si fa" modificabile: "Va bene così" o "Salva come dice la mamma" (il testo della mamma va in `regole[id].come` e lo leggono le
  signore; "Torna al testo di prima" lo toglie); `riviste[id] = { data, da, cambiata }`.
- **0.25.1** — il nome delle regole del catalogo nella scheda Regole (prima restava vuoto), la vista di copertura rinominata
  `vistaTabelloneCopertura` (si scontrava con il tabellone del prospetto), i 5 lavori di manutenzione visti nelle foto messi nei Lavori.
- **Dalla 0.26 — il catalogo è il FILE di Michele, calendario vero, profili Lusso/Base, la lista della signora, i livelli.**
  **Fonte unica**: `catalogo/catalogo-governante-v4.csv` (il file di Michele, 163 righe, unito alle 15 righe dalle foto P01-P15 e ai
  testi delle foto su 14 righe: box a soffietto, cassetta esterna, termosifone in ghisa, marmo…) e `catalogo/catalogo-governante.xlsx`
  (fogli "Checklist signora", "Calendario vero", "Livelli e costi"). `strumenti/genera-catalogo.mjs` li legge e scrive **`catalogo.js`**
  (generato, non si tocca a mano): `RIGHE` (le righe così come sono), `PARTI` (le regole come le usa l'app: una riga a più ritmi diventa
  più parti, "a ogni pulizia" = voce della lista, i ritmi lunghi = rifiniture), `CHECKLIST`, `CALENDARIO_VERO`, `LIVELLI_TESTO`.
  Il **Blocco** della riga decide come viene caricata: *Pulizia normale* = riga della lista della signora (non è una rifinitura, niente
  budget, niente extra); *Dentro la totale* = parte del lavoro della totale (i ritmi lunghi diventano stelle della totale); *Pulizia
  normale + rotazione* = lista + stella; *Rotazione* e *Camera libera* = le vere rifiniture; *Giorno della zona*; *Meteo e stagione*.
  **Copertura e Buchi del Tabellone si contano solo sui blocchi Rotazione e Camera libera** (`CELLA`); la Mappa dice "Superfici
  scoperte", che è un'altra cosa. `VECCHI_ID`/`nuovoId` traducono il registro scritto con i nomi vecchi delle regole.
  **Calendario vero** (`logica.CALENDARIO_CAMERE`, `passaggiCamera`): i giorni di pulizia vengono dal foglio, posto per posto (Trento
  e via Zara 1°/2° lunedì ripasso + giovedì totale, via Zara piano terra sabato); dove nel foglio c'è ancora una domanda
  ([CONTROLLA], [COMPLETA], "oppure") quel posto resta con REGOLE_BASE finché Michele non risponde: l'app non inventa. Camera nuova
  `zara2` (Via Zara · 2° piano). Le stelle entrano solo nei passaggi veri, con il **budget per passaggio** (`passoDi`: ripasso 15′ e 1-2
  stelle, totale 30′, totale a camera vuota 45′, Base 0′/10′ e una sola), riempito per priorità 1 → 2 → 3 e poi la più in ritardo;
  le parti a ritmo corto che la lista di quel passaggio nomina non diventano stelle (`copertaDallaLista`) e la lista fatta le registra
  (`coperteDalPasso`). **Profili** (`profiloDi`, `PROFILI_BASE`, `impostazioni/governante.profili`): Lusso = tutto il catalogo; Base
  (via Zara 1° e 2°, operai) = solo le righe con Profilo base = Sì, nella totale del giovedì una sola cosa di igiene a rotazione
  pescando prima dalla riga "una per volta" della checklist (`slotBase`); le celle fuori profilo non esistono nel Tabellone.
  **Livelli** (`LIVELLI`, `livelloDi`, `applicaLivello`, `soglie.livello`, si parte da Igiene): Igiene = solo priorità 1; Albergo =
  igiene ai ritmi scritti, il resto a metà ritmo; Lusso pieno = tutto. Le regole fuori livello restano in catalogo spente
  (`fuoriLivello`): nel Tabellone sono grigio chiaro "non previsto a questo livello", non buchi. `contoLivelli` dà per ogni livello
  minuti a settimana per camera, € al mese (quello che ci sta nel calendario e il pieno) e quanto ci sta; nelle Regole tre carte per
  scegliere, nel Tabellone "Il conto" con le tre colonne. Meteo segnato a mano in Regole (`governante.meteo`: pioggia/vento,
  umidità, freddo, fino a una data) finché non c'è un meteo gratis. Via le soglie minutiGiorno/rifiniturePerPulizia/minutiRifiniture e
  il tasto "dentro la totale" (il blocco del file decide).
  **La schermata della signora** (`foglioInizio`, `listaDelGiorno`, `righeLista`): una camera, una lista, un giorno, come lo schizzo
  `catalogo/mockup-signora.png`. Targa con camera, tipo, minuti, ospite; "Oggi Michele dice" (dettagli del giorno, istruzioni
  dell'ospite, messaggio del giorno); le righe grandi del foglio "Checklist signora" (12 ripasso, 25 totale, 7 cucina, 4+4 Base) con i
  numeri blu, le stelle oro al punto giusto (dopo l'ultima riga di quel posto) con "Come si fa", prodotto, "Qui:" (materiale), ⚠ note;
  le zone comuni in un riquadro a parte ("Come ogni giorno" in una riga sola + quelle a ritmo); "Sempre in questa camera"; si tocca
  ogni riga quando è fatta (verde; le spunte restano sul telefono, `localStorage ricci_spunte`, finché non si chiude); un tasto solo
  **FATTO, TUTTO** (se restano righe non toccate chiede "Le hai fatte?": tutte sì, oppure chiudi lo stesso e quelle senza spunta
  diventano non fatte); "Non riesco a fare una cosa" (riga con un tocco + perché con un tocco: la stella va nel registro come saltata e
  la governante la rimette un'altra volta); "C'è un problema". Sulla pulizia si salvano `rifiniture` (stelle fatte, prezzo
  minuti × 0,25 €), `extraRifiniture`, `spuntate`, `nonFatte` (regole Firestore aggiornate). Una pulizia chiusa mostra le stelle che
  aveva davvero (`stelleSalvate`). "Le mie camere" mostra solo le camere di oggi, con il tipo sulla targa. Paghe e Soldi: "Alba ·
  Pulizia totale 15 € + 6 stelle 5,75 €". Sul telefono delle signore non compaiono mai le parole governante, catalogo, regole,
  rotazione, extra, rivista (la prova `prova-lista-signora.mjs` le cerca). Nella scheda della pulizia della gestione: la lista di oggi
  con le spunte della signora.
- **0.27 — la lista a blocchi, budget Base, prezzo delle stelle a fasce, meteo con due tasti.**
  **Blocchi**: le righe grandi della signora stanno sotto un titolo grande con UN solo tasto "Fatto" per blocco (colonna "Blocco
  (schermata)" nel foglio "Checklist signora": Letto e biancheria · Bagno · Camera · Cucina · Alla partenza · Pavimenti e controllo
  finale, in quest'ordine: il controllo chiude la camera; `BLOCCHI_LISTA`, `ORDINE_BLOCCHI`, `righeLista` ordina per blocco,
  `listaDelGiorno` restituisce `blocchi` con righe e stelle); le righe dentro si leggono, le **stelle** si toccano una per una e stanno
  in fondo al loro blocco (`bloccoStella`: letto / bagno / cucina / camera). Massimo **2 stelle in un ripasso, 3 in una totale**
  (`STELLE_MAX`). "Fatto, tutto" con un blocco non toccato chiede "Questo l'hai fatto?" per blocco; "Non riesco a fare una cosa"
  sceglie un blocco o una stella. Sulla pulizia `spuntate`/`nonFatte` portano le chiavi dei blocchi (`B:letto`…) e delle stelle;
  la lista fatta copre le voci dei blocchi fatti (`coperteDalPasso` + filtro per blocco). **Budget Base** (via Zara 1° e 2°, dal
  foglio "Calendario vero"): lunedì 10′, giovedì 25′ (prima 0′/10′), con gli stessi limiti di stelle; la riga "una per volta" resta
  la prima da cui si pesca. **Prezzo delle stelle a fasce** (`PREZZI_STELLE_BASE` 1 € fino a 5 min · 2 € fino a 10 · 3 € oltre;
  `prezzoStella`, `prezziStelle`, in `impostazioni/governante.prezziStelle`, si cambia in Paghe → Listino): vale per la paga e per
  "Il conto" dei tre livelli, che si aggiorna subito. **Meteo con due tasti** in Regole: "Ha piovuto / vento forte" (pioggia + vento
  per 2 giorni, umidità per 3) e "Arriva il freddo / arriva il caldo" (scelta con un tocco, 7 giorni; M01 scatta in tutti e due i sensi).
- **0.28 — le stagioni e il calendario vero a due signore.**
  **Calendario vero** (dalle risposte di Michele, nel foglio "Calendario vero"): d'inverno ci sono **due signore**. La signora del
  1° piano: lunedì ripasso in via Zara 1° e 2° (Base, leggerissimo) e via Trento; giovedì cambio totale in via Trento e in via Zara 1° e
  2° (insieme alla signora del 2° piano); venerdì Salvatore, Aurora, Michele, Antonio (camera libera); sabato Nicole e via Zara piano
  terra. La signora del 2° piano: mercoledì ripasso Alba, Tramonto, Passerella, Fenicotteri e Lella (solo le camere occupate); giovedì
  in via Zara con la collega; venerdì Alba, Tramonto, Fenicotteri; sabato Passerella e Lella più scalinata, ingresso e zone comuni.
  Niente ripasso del mercoledì al 1° piano. La **zona della pulizia è quella della signora del calendario**, non del posto
  (`logica.zonaDi`, `passaggiCamera` restituisce `zona` e `insieme`, `pulizia_prevista`/`pianoPulizie` la scrivono sulla pulizia:
  così la signora del 1° piano vede gli appartamenti nelle sue camere); le tessere della signora si costruiscono dalle pulizie della
  sua zona. Scale e ingresso passano alla zona del 2° piano. Resta aperto il profilo di via Zara piano terra ([DECIDI]).
  **Stagioni** (`logica.regimeDi`, `impostazioni/regole.regime = { modo: auto|estate|inverno }`, carta "Le stagioni" in Regole):
  **inverno** (ottobre–maggio) = i giorni fissi; **estate** (1 giugno – 31 agosto, o forzata a mano) = nessun giorno fisso, le
  pulizie seguono arrivi e partenze del prospetto (`passaggiCamera` vuoto, resta `totaleAllaPartenza`), la governante mette **2
  stelle a partenza, prima il visibile** (`passoDi` con `estate: true`, ordine di priorità 2 → 1 → 3). Il Tabellone e la copertura
  usano il regime del giorno: d'estate il modello è "un cambio ogni 3 notti per camera" (`NOTTI_ESTATE`, `modelloCalendario`).
  **Il conto per stagione** (`contoLivelli`: `inverno`, `estate`, `anno` = 9 mesi d'inverno + 3 d'estate) nelle carte dei livelli e
  nel Tabellone. **Due finestre di reset** come lavori a camera libera su tutte le camere, senza i limiti settimanali (`reset: true`,
  una camera per signora al giorno, nei giorni liberi del prospetto): **M07** "Pronti al caldo" (15 maggio – 5 giugno, ora su tutte le
  camere) e la nuova **M08** "Chiusura della stagione estiva" (1–20 settembre: fondo completa, materasso girato, tende lavate, filtri e
  sanificazione dei condizionatori, balconi a fondo; registra tutto il catalogo della camera come la fondo completa). M08 è nel CSV v4
  (179 righe).
- **0.29 — i tre modi legati all'ospite** (specifiche in `catalogo/specifiche-governante.md`, §1: da qui in poi quel file è la
  fonte delle decisioni). I livelli Igiene/Albergo/Lusso e i profili Lusso/Base **non ci sono più**: il catalogo è uno e in ogni modo
  esistono tutte le regole, cambia solo il ritmo. **Il modo segue l'ospite**, non la camera (`logica.modoSoggiorno`: `modo` scritto
  sul soggiorno → `impostazioni/clienti[normNome(nome)].modo` → `MODO_DA_TIPO` dal tipo: ferrovia = Tecnici, D'Agostino = Operai,
  altro = Booking; `logica.modoCamera`: chi dorme o chi parte quel giorno, senza nessuno `MODO_CAMERA_BASE` (via Zara 1° e 2° =
  Operai) o Tecnici, d'estate Booking). Nella **scheda del soggiorno** tre pulsanti grandi (Tecnici · Operai · Booking) con "Sempre
  per questo nome" (si salva in `impostazioni/clienti`, il soggiorno eredita) o "Solo per questo soggiorno" (`soggiorno.modo`);
  scrivendo un nome noto il pulsante si mette da solo. Le pulizie portano il loro `modo` (`pianoPulizie(..., clienti)`), così le
  signore non hanno bisogno del prospetto. **I ritmi dei modi** (`governante.MODI_BASE`, `applicaModo`, `regolePerModo`, in
  `impostazioni/governante.modi` i cambi): un moltiplicatore per priorità su `ogni` (`MOLTIPLICATORI` 0 · ½ · 1 · 2 · 3; 0 = mai come
  stella, solo nella fondo completa = `fuoriModo`), più l'eccezione cucina per Operai (`IGIENE_CUCINA` ×½). Partenza: **Operai** p1
  pieno, cucina ×½, p2 ÷3, p3 mai, budget 10′/25′, stelle 0 nel ripasso e 1 di igiene nella totale (`soloIgiene`); **Tecnici** p1
  pieno, p2 ÷2, p3 ÷2, budget 15′/30′/45′, stelle 2/3/3; **Booking** tutto pieno, budget 15′/30′/30′, stelle 2/2/2, prima il visibile
  (`visibilePrima`). `passoDi` prende budget e tetto dal modo (il foglio "Calendario vero" vince d'inverno se dice un budget), mai
  sopra `STELLE_MAX` 2/3/3. Regole speciali Booking in `pulizia_prevista`: "Arrivo: aria e letto" (camera ferma 2+ giorni prima di un
  arrivo) e d'estate "Ripasso e asciugamani" (soggiorni > 4 notti: 4° giorno, poi ogni 3). **Dove si vede**: in Regole la carta
  "I tre modi" (descrizione, camere di oggi, budget, €/camera/settimana, e dentro "Cambia i ritmi" i + e − di priorità, cucina, minuti
  e stelle, con "Torna ai valori di partenza"); ogni riga del catalogo dice il suo ritmo nei tre modi; nei Consigli la carta "Questa
  settimana" con i tre riquadri (`contoSettimana`: camere per modo dal prospetto vero, partenze Booking, stelle ed euro della
  settimana) e il conto per stagione; nel Tabellone le celle hanno il modo della camera di oggi (`tabellone().modi`, celle grigio
  chiaro "solo nella fondo completa"), **"Il conto"** è per stagione (un mese d'inverno, un mese d'estate, l'anno) e per modo
  (`contoModi`: €/camera-settimana da 13 settimane simulate; `contoLivelli` è solo un alias); sulla targa della signora una parola
  piccola col tipo di ospite (Tecnici · Operai · Ospiti Booking). **Listino**: via Zara 1° e 2° il giovedì 10 € a signora, una per
  appartamento (`LISTINO_BASE.perCasa`, righe in Paghe → Listino; nel foglio il giovedì di via Zara 2° è della signora del 2° piano).
  Risultato nei dati di prova: un mese d'inverno 275 € (era 539 € a livello Igiene), un mese d'estate 307 €, anno 3.396 €.
- Passi successivi previsti: le foto dei materiali di Lella, Nicole, via Trento e via Zara, il tipo di ospite abituale di via Zara
  piano terra, ritmi che imparano dai controlli ("gli occhi"), meteo di Lesina automatico, pagella del sabato.
