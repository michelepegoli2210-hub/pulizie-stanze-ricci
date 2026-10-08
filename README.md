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
