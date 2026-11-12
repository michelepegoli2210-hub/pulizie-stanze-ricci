# CLAUDE.md · Le Stanze di Ricci

Le regole per Claude quando lavora su questo progetto. Le ha chieste Michele, il titolare (10/11/2026: «le regole di
Claude per farla andare meglio»). Il repository è pubblico: qui dentro, come nel resto del codice, niente dati veri
(nomi di ospiti o signore, telefoni, email, password, chiavi).

## Con Michele
- Sempre in italiano, semplice, a passi brevi. Niente parole tecniche, o spiegate in una riga.
- Una domanda alla volta, con le risposte numerate (1, 2, 3).
- La verità, diretta: niente complimenti, niente promesse che non si possono mantenere («al 100%», risultati, guadagni).
- Fai tu tutto quello che puoi: Michele non vuole toccare niente. Chiedigli solo quello che deve fare per forza lui.
- Alla fine due o tre righe: cosa è cambiato e cosa provare. Le foto delle schermate aiutano.
- Le chiamate all'IA costano: nelle prove le risposte di Gemini sono sempre finte.
- Le schermate parlano come lui: niente percentuali, sigle o parole di mestiere («celle», «buchi», «copertura») senza dire
  cosa sono. Un numero per riga, con accanto cos'è; i dettagli chiusi sotto (1.80.1: «che sono questi buchi?»).

## Lo fa solo Michele, mai Claude
- Scrivere password, codici di verifica, numeri di carte, chiavi (GitHub, Gemini, Meta, Telegram…); creare account;
  pagare; accettare termini, consensi, «Autorizza».
- Pubblicare `firestore.rules` e tutto quello che si fa nella console di Firebase.
- Dire «Sì» a prezzi, promozioni e post: Sofia influencer non pubblica niente senza il suo Sì.
- Mandare messaggi a nome suo (WhatsApp, email): Claude prepara il testo, lui lo manda.

## Dati e privacy
- Mai scrivere direttamente nei dati veri di Firestore: si cambiano solo con i tasti dell'app.
- Leggere i dati veri solo quando serve; nei risultati solo conteggi o sì/no, mai chiavi, telefoni o email.
- All'IA gli ospiti vanno solo come codici; telefoni ed email mai. Testi e foto per Gemini: nomi veri sostituiti con
  nomi finti, camere senza persone.
- I documenti degli ospiti (Alloggiati Web) restano sul telefono: mai nel repository, mai nei log di GitHub Actions.
- Nei log di GitHub Actions (pubblici) mai URL con chiavi, segreti, nomi o testi dei messaggi.
- Le signore: niente tracciamento continuo (il QR delle presenze guarda la posizione solo mentre scansiona, e loro lo
  sanno). La loro parte dell'app resta gratis, senza IA a pagamento.
- Sofia sui social: solo le API ufficiali di Meta, mai il mouse del PC; dice sempre che è un'assistente virtuale (AI Act).
- Niente foto finte dell'albergo fatte con l'IA; niente loghi o marchi di altri nell'app; la Sofia di prima (il viso
  vecchio) non deve più comparire.

## Il progetto in breve
- App web (PWA) su GitHub Pages. `app.js` tutte le schermate, `style.css`, `sw.js` service worker e precache,
  `logica.js` conti e date (fuso Europe/Rome), `db.js` Firestore, `ia.js` Gemini, `lettura.js` letture delle chat,
  `governante.js`, `chat.js`. La tabella dei file è nel README.
- Il giro di Sofia: `sofia-giro/` (Node) con `.github/workflows/sofia-giro.yml`; legge le chat portate dal ponte
  (`ponte/`, sul PC di Michele) e il foglio Excel di papà, e aggiorna prospetto e Segreteria.
- Gli orari salvati sono in UTC: il giorno si prende con `L.oggiISO(new Date(iso))`, non con `iso.slice(0, 10)`
  (dopo mezzanotte sbaglia di un giorno).
- `specifiche-governante.md` è il registro delle versioni: una voce per versione, con le parole di Michele tra «».
- La paga è solo a ore (1.77.0, «togli completamente tutti i prezzi… soltanto un timer»): con `pagaAOre()` nell'app non si
  vede e Sofia non dice nessun prezzo a pezzo (camera, stella, controllo, Visto). Restano le ore × la tariffa e i conti
  della casa. Un giorno senza orario resta «senza orario», fuori dal totale. La paga a camera resta nel codice, nascosta.
- L'orologio (1.78.0, giro 1.35.0) è uno, i modi per farlo partire sono due: i tasti dell'app («Sono arrivata», HO FINITO,
  «Sono tornata», «Vado via») oppure «arrivata» / «finito» scritti su WhatsApp, che `sofia-giro/orario-giro.mjs` riconosce
  senza IA (`timbroDi` in `lettura.js`). I turni passati da WhatsApp aspettano sempre il «Sì» di Michele. Il conto del
  giorno è in `turnoDelGiorno`: i turni si uniscono e i pezzi sovrapposti contano una volta; cosa fa un «Sì» lo dice
  `oreEffetto`. Le regole di Firestore non cambiano: i turni in più sono documenti `visti/<zona>_<giorno>_2…4`.
- La casa (1.79.0), tendina chiusa: due tasti grandi (ARRIVI e PARTENZE di oggi, contati a persone, `movimentiDelGiorno`), poi
  pulizie oggi, pulizie domani, camere piene e vuote, guasti (`notizieFacili`). I dettagli sono in `dettaglioFacile`:
  la piantina di chi arriva e di chi parte, il letto da preparare (`preparazioneCamera`). Michele legge male le scritte
  piccole: i tasti non si rimpiccioliscono. Ogni tasto ha un disegno che non somiglia agli altri («inequivocabili»: «deve
  capirlo anche mia nonna»): arrivi e partenze sono i cartelli IN (verde) ed EXIT (rosso) disegnati come quelli veri
  (1.79.3). Le altre figurine raccontano con le persone cosa c'è dentro (1.79.7): la signora delle pulizie col sole (oggi);
  oggi → domani cerchiato col secchio (domani); il letto con chi dorme o rifatto (camere); il rubinetto e l'operaio (da
  aggiustare); Sofia che alza la mano (domande). Nella barra in basso il tasto Segreteria è il disegno di Sofia segretaria
  al computer che Gemini ha fatto per Michele, il più nitido possibile da quello screenshot (1.79.18). Non ridisegnare
  Sofia (1.79.15: «è un'altra»); scontornata e la foto nel quadratino grande (1.79.17) non gli sono piaciute.

- I filmati di Sofia (1.80.0): l'elenco è `FILMATI` in `app.js` (14: la pagina Oggi a pezzi, la segretaria, quella delle
  signore, l'influencer). Michele li cancella e li rimette da «Impostazioni → I filmati di Sofia» (`impostazioni/filmati`,
  campo `tolti`, scritto solo da quei tasti): cancellato = l'app non lo fa vedere, resta la foto. Un filmato nuovo va
  aggiunto a `FILMATI` e alla striscia delle anteprime `filmati-anteprime.webp`, nello stesso ordine.

- Le chat con Sofia (1.80.2): una risposta più lunga del riquadro si ferma al suo inizio, non in fondo (`chatUltima`), con
  «Continua ▾»; il riquadro di «Parla con Sofia» non si sposta a ogni disegno (`svChatPosto`). Lì la pagina si accorcia sopra
  la tastiera (`tastieraSopra`) e a tastiera aperta davvero (`body.tastiera-su`) restano i messaggi e la casella. Nelle prove
  la tastiera si fa toccando la casella e accorciando lo schermo (412×470); il cartello «PROVA» va nascosto, se no sposta tutto.

## Una versione nuova
1. Le modifiche con uno script che sostituisce pezzi esatti e si ferma se il pezzo manca o c'è due volte. Commenti in
   italiano, con la versione, la data e le parole di Michele.
2. La versione cambia in due posti: `VERSIONE` in `app.js` e in `sw.js` (se no i telefoni non si aggiornano). Più la
   voce in `specifiche-governante.md`.
3. Prove in una copia locale, mai sui dati veri: `index.html?prova=1&gestione=1` dà dati finti. Playwright con
   `serviceWorkers: 'block'` e le chiamate a Gemini e GitHub finte. Misure: telefono 412 e 360 px, PC, tema scuro, stile
   «premium» (`localStorage.ricci_stile4 = "premium"`).
4. Prima di pubblicare: nessun errore in console, nessun file mancante (404), ogni pagina si apre.
5. Il CSS nuovo va in fondo a `style.css`, in un blocco con la versione; attenti alla specificità (`body.premium …`).
   La scrittura della casa (Plus Jakarta Sans) è caricata a 600 e 700: un 800 esce come il 700. Per il grassetto vero c'è
   «Jakarta Grassetto» (solo 800, 1.79.12), usata per le scritte sotto i disegni e nella barra in basso.
6. Pubblicazione: commit su `main` con messaggio in italiano. Poi sul PC di Michele la notifica «Aggiorna» dell'app, e si
   controlla che la versione sia quella nuova.

## Nel Chrome di Michele
- Una scheda nuova per il lavoro, chiusa alla fine. La pagina del ponte («Il ponte di Sofia») non si tocca.
- Banner dei cookie: rifiutare. Offerte e promozioni: «Non ora».
- I filmati di Sofia in Gemini: Claude prepara la richiesta, Michele preme Invia. Le sue chat private non si aprono.
