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
| `regole.js` | **Il dizionario**: camere, zone, giorni delle pulizie, cosa si fa, prezzi di partenza, regole per leggere l'Excel | Per cambiare le regole |
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
- **Il catalogo** sta in `governante.js` (`CATALOGO`): una riga per ogni singola cosa (84 voci), con nome preciso, dove, ogni quanto,
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
- Passi successivi previsti: tabellone di copertura (posti × regole) con filtri, simulazione di 90 giorni, materiali per posto e
  "Rivedi con la mamma" sui "come si fa", ritmi che imparano dai controlli, meteo di Lesina, pagella del sabato, voce con Gemini.
