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
- Negli esempi (dati della prova, aiuti, commenti, registro delle versioni) solo nomi di fantasia: Rossi, Bruno, Greco…
- Sofia sui social: solo le API ufficiali di Meta, mai il mouse del PC; dice sempre che è un'assistente virtuale (AI Act).
  Dal 19/11/2026 (app 1.107.0, giro 1.40.0) la chiave di Instagram è quella «Unified login» delle app nuove di Meta (app
  «Sofia social», portfolio business «Le Stanze di Ricci», Instagram sofialestanzediricci come Tester di Instagram): non
  comincia con IG, non scade, va su graph.facebook.com (`FB`, `unificata`, `me/assigned_instagram_accounts`). La genera e
  la incolla solo Michele.
  Il 20/11/2026 Meta ha limitato il portfolio business (niente inserzioni né gruppi di pubblico) perché «creato o usato con
  un'automazione»: il giorno prima molti clic sui siti di Meta li aveva fatti Claude dal Chrome di Michele. Da allora sui siti
  di Meta (Facebook, Instagram, Meta for Developers, Business) clicca SOLO Michele, guidato con le figure; niente account o
  portfolio nuovi per aggirare il blocco. La revisione, se un giorno serve la pubblicità, la chiede lui («Stato dell'account»).
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
- I filmati senza scatti (1.90.0; Michele: «mi piace di più come adesso… queste movenze qui… l'unica cosa che non mi piace è
  che sono dei video separati, quindi fa scatti»). La Sofia rifatta da capo con Google Flow non gli è piaciuta («la mia Sofia…
  ha gli occhi molto più magnetici… lì gli occhi sono storti»): la Sofia e le movenze restano quelle dei filmati che ha già.
  Per la prima pagina i pezzi sono gli stessi, interi; tra uno e l'altro (e dove il filmato ricomincia) c'è meno di un secondo
  fatto solo coi due fotogrammi veri (`strumenti/attacco.py`, `fai-fluido.py`: niente ridisegnato da una macchina). In `app.js`:
  `FILM_SPEZZONI` (dove comincia ogni pezzo), `FILM_CODE` (dove finiscono i suoi fotogrammi veri), `FILM_FINE`. Resta il
  cambio di colpo quando comincia o smette di parlare (si passa da un filmato all'altro).
- Da ferma senza il sorriso che va e viene (1.90.2; Michele: «in alcuni frangenti sorride e torna di colpo seria, sembra una
  pazza»). Il primo pezzo di «ferma» cominciava col sorriso grande coi denti della foto e in mezzo secondo lo perdeva: a ogni
  giro del filmato e ogni volta che smetteva di parlare. Adesso comincia e ricomincia un secondo dopo, col sorriso tranquillo
  (`tagli=[24, …]` in `strumenti/fai-fluido.py`; `cons-riposo-spilla-sereno*`), e la foto di partenza è quel fotogramma
  (`cons-poster-sereno*.webp`). Quando si rifà un filmato di Sofia si guardano i visi di tutto il giro, non solo gli attacchi.
- Il saluto, e via i passaggi «da robot» (1.91.0; Michele, del video fatto da lui con Gemini: «questo è il video di sofia che
  mi manda i baci ed è bellissimo»; e: «fa ancora delle movenze che sembra un robot che si sposta, togli quello»). I «robot»
  erano i passaggi lunghi della 1.90.0 (la testa che gira e scivola per un secondo): non si fanno più. Regola: **ogni pezzo
  parte e finisce nella stessa posa coi suoi fotogrammi veri**. Un pezzo che finisce altrove va avanti e poi all'indietro
  (`strumenti/fai-giro.py`); un video nuovo si chiede a Gemini che parta e finisca nella posa della foto. Da ferma: il saluto,
  poi calma, poi da capo. Mentre parla resta dentro un pezzo solo (`FILM_GIRA`); finito di parlare torna al pezzo calmo
  (`FILM_RITORNO`). I file sono `cons-*-spilla-giro*`.
  1.91.1 (Michele: «il video del bacio è davvero straordinario invece… quando guarda laterale che fa avanti indietro è ancora
  troppo robotizzato… micro lag nei capelli… si percepisce quando attacca uno e quando attacca un altro»): un pezzo fatto andare
  avanti e poi indietro SI VEDE quando lei si muove tanto (lo sguardo di lato): si usa solo per un gesto che torna da sé (la testa
  che si inclina e torna), una volta sola per giro (mai lo stesso gesto due volte di fila: sembra di nuovo «avanti e indietro»),
  e mai con un fotogramma fermo dove gira. Nei pezzi di una volta manca qualche fotogramma (un passo doppio = un piccolo scatto):
  si cercano guardando quanto cambia l'immagine da un fotogramma all'altro e lì si mette quello a metà (`MANCA` in
  `strumenti/fai-giro.py`). I pezzi di qualità diversa messi in fila si notano: si affilano e si intonano uguali
  (`strumenti/affila.py`, la curva dei colori da `strumenti/misura-tinta.py`). La spilla dei video di Gemini viene chiara, quasi
  bianca (nella foto è d'oro): si tinge d'oro con `strumenti/tingi-spilla.py` (1.91.2), su ogni video nuovo della governante.
  La strada giusta sono i video nuovi di Gemini che partono e finiscono nella posa della foto, come quello del bacio.
  1.93.0: fatto. Da ferma (`cons-riposo-spilla-giro4*`) ci sono solo video nuovi, uno dopo l'altro e tutti in avanti: il saluto
  col bacio; collana e capelli; ferma tranquilla; guarda di lato. Li ha fatti Flow (Omni 1.2 Flash, la foto come PRIMO
  fotogramma e basta: con anche l'ultimo fotogramma gli occhi venivano storti) perché Gemini quel giorno rifiutava i video. La foto
  di partenza è la posa della foto (`cons-poster-foto*.webp`). Un video nuovo si aggiunge in `ORDINE` di `strumenti/fai-giro.py`.
  I video nuovi non tornano mai proprio nella posa di partenza: prima di attaccarli si passa il «rientro lento»
  (`strumenti/rientra.py`, spiegato in `strumenti/README.md`) e si guardano bocca e occhi fotogramma per fotogramma.
  Michele: «quando sbatte gli occhi e sorride è un po' macchinosa»: nei video di Flow il battito dura mezzo secondo (in quello
  del bacio un terzo). I pezzi da ferma hanno il nome in `FILMATI` (`oggi-ferma-1`, `oggi-capelli`, `oggi-calma`, `oggi-lato`).
  I due filmati in cui parla sono compressi un filo di più (crf 36 il ritagliato, 21,5 il piatto; gli altri 35 e 21): un file
  deve stare sotto i 10 milioni di byte.
- La copertina di Sofia influencer (1.90.1; Michele: «sofia si deve muovere già dalla copertina»): la sua stanza, quella larga in
  fondo alla prima pagina, ha sopra la foto il suo filmato (`stanzaFilmMonta`: parte quando entra nello schermo, si ferma
  quando esce; i due filmati sono quelli della sua pagina, `FILM_INFLU`). La parte di sotto della sua pagina e la Segreteria
  le ridisegna Gemini («fai ridisegnare… a gemini»): Claude prepara la richiesta con le foto della copia di prova (nomi di
  persona e di camera cambiati), Michele preme la freccia; la pagina si costruisce dal disegno, senza ridisegnare Sofia.
  (Il 17/11 la richiesta della Segreteria l'ha mandata Claude, perché Michele ha chiesto di vedere le immagini: gliel'ha detto.)

- Le chat con Sofia (1.80.2): una risposta più lunga del riquadro si ferma al suo inizio, non in fondo (`chatUltima`), con
  «Continua ▾»; il riquadro di «Parla con Sofia» non si sposta a ogni disegno (`svChatPosto`). Lì la pagina si accorcia sopra
  la tastiera (`tastieraSopra`) e a tastiera aperta davvero (`body.tastiera-su`) restano i messaggi e la casella. Nelle prove
  la tastiera si fa toccando la casella e accorciando lo schermo (412×470); il cartello «PROVA» va nascosto, se no sposta tutto.

- Il catalogo dei costi (1.81.0), Paghe → «Quanto costa ogni mansione» (`catalogoCosti`): i minuti pagati di ogni giorno
  spartiti sulla lista del lavoro di quel giorno. Serve a fare i prezzi a camera senza spendere più di adesso (li conferma
  Michele); gli extra si pagano solo se chiesti prima, col prezzo deciso prima. Niente cronometri di nascosto.
  Un giorno con la lista ma senza ore non entra: Michele risponde con «Rispondi» (1.81.1: è venuta e mette le ore, non è
  venuta, non lo sa); le risposte stanno in `impostazioni/catalogo` e non toccano né il giro né la paga. Se quel giorno
  ha fatto tutto l'altra signora, i lavori dell'assente entrano nel giorno di lei. Un orario sotto i 10 minuti non conta
  (1.81.2: è un tocco per sbaglio); i giorni con molte più ore del lavoro in lista, o pochissime, stanno in «Ore strane»
  con «Correggi». Le ore che le signore scrivono su WhatsApp non si segnano al posto suo: il tempo lo prende Michele.

- Il tempo lo prende Michele (1.82.0), Paghe → in cima «Il tempo delle signore» (`cardTempo`): per ogni signora un tasto
  che cambia, «È arrivata adesso» / «È andata via adesso» (scrivono `turnoInizio` / `turnoFine` del giorno), poi «Correggi»;
  il pomeriggio «È tornata adesso» (un turno in più, `_2…4`). Ogni tocco ha «Annulla». È l'orario del giorno di sempre: va
  in Paghe e nel catalogo dei costi, e si vede anche nell'app della signora (niente di nascosto).

- La vetrina (1.83.0), `?vetrina=1`: la prova coi nomi inventati (ospiti, ditte e signore degli esempi), da mandare a chi
  conosce Michele. Nella vetrina il telefono salva tutto sotto «vetrina:…» (`index.html`, prima del resto) e le scritte e
  la voce passano da `testoVetrina` (`db.js`). Le prove restano su `?prova=1`.

- Sofia senza sfondo anche sull'iPhone (1.84.0): dove i webm trasparenti non vanno (`ALFA_OK = "no"`: iPhone, Safari del Mac)
  ogni `-3d.webm` ha il suo gemello `-alfa.mp4` (colore sopra, trasparenza sotto, `strumenti/fa-alfa.py`) e accanto al video
  c'è la tela (`canvas.alfa-tela`, WebGL) con le stesse classi; le regole di `style.css` per `video` si copiano per la tela da
  sole (`telaRegole`). Un webm trasparente nuovo vuole anche il suo gemello. Nelle prove: `getImageData` del 16×16 finto.

- La posta dell'albergo (1.75.0, collegata il 15/11 con la 1.84.1): la casella (`casella-albergo.gs`) chiama l'API di Gmail
  con `UrlFetchApp`, quindi nel manifest serve il servizio avanzato «Gmail» (accende l'API nel progetto di Google). Il tasto
  per aprire Google con l'account dell'albergo va su `script.google.com/home/projects/create` (`script.new` dopo la scelta
  dell'account dà errore 400). Ogni mail nuova ha la sua notifica (giro 1.36.0, `notificheEmail` in `posta-giro.mjs`):
  «📧 Email da …», l'oggetto e l'inizio; di notte aspetta le 6:30; più di 3 insieme una sola. Nel registro di GitHub
  (pubblico) solo «notifica di una email»: mai chi scrive né l'oggetto.
- Le prenotazioni (1.95.0, giro 1.38.0; Michele: «il sito ciclovia io devo ricevere assolutamente… voglio che in segreteria
  ci sia un accesso diretto al calendario… quando mi arriva una prenotazione a me il telefono deve proprio vibrare, suonare…
  tutto quello che riguarda l'albergo arriva a mia consapevolezza»). Quali email sono prenotazioni lo dice UNA regola sola,
  `L.emailPrenotazione` in `logica.js` (i `CANALI`: Ciclovia Adriatica, Booking, Expedia, Airbnb; parole larghe per loro,
  strette nell'oggetto per tutti gli altri; niente IA): la usano l'app e il giro.
  App: nella Segreteria, sotto «Oggi», «Prenotazioni» (`segrPrenotazioniHtml`, `S.segrPren`): la tessera «Arrivate» si apre
  lì sotto (una scheda per email, `segrPrenRiga`), la tessera «Ciclovia» è un `<a target="_blank">` che apre il loro sito
  (il calendario): l'app resta nella Segreteria. Nell'email intera la fascia «Rispondi entro…» (`segrPrenEntro`,
  `L.scadenzaRisposta`: le 12 ore della Ciclovia contate dalle 7 alle 21, ora di Lesina) e il tasto del sito.
  Giro: `notificheEmail` dà a ogni prenotazione la sua notifica («🛎️ Richiesta di prenotazione · …», `vibra: true`: vibra e
  resta finché non la tocca); nel registro pubblico solo «notifica di una prenotazione».
  La casella versione 2 prende anche le email dei siti di prenotazione fuori da «Principale» (mai «Promozioni»): va rimessa a
  mano nel Google dell'albergo (Gestisci deployment → ✏️ → Nuova versione; l'indirizzo non cambia).
- Gli allegati delle email (app 1.108.0, giro 1.41.0, casella 3; Michele, 20/11: «essenziale è che io possa leggere anche
  tutti gli allegati dall'applicazione… e l'applicazione debba leggere anche gli allegati… negli allegati c'è proprio il
  succo del discorso»). La casella 3 (sempre e solo lettura) dà con le mail nuove l'elenco dei file (`files`: parte, nome,
  tipo, KB) e due azioni: `elenco` (le email di prima) e `allegato` (il file, base64; solo email nella Posta in arrivo, al
  massimo 30 giorni, 10 MB). Il giro (`allegati-giro.mjs`) fa leggere gli allegati a Gemini: Michele ha scelto «Tutto
  com'è», cioè PDF e foto interi (anche scansioni, coi nomi dentro); Excel, Word e testo come testo. Riassunto e testo vanno
  in `posta/<id>.allegatiLetti` e Sofia li legge insieme all'email (`L.allegatiPerLettura`). Al massimo 3 email e 5 file a
  giro, tre tentativi; nel registro pubblico solo quanti. Una casella di prima risponde «Azione sconosciuta»: il giro segna
  `casellaDaAggiornare` e la versione (`casella` in `importazioni/posta-albergo`), l'app mostra i passi per aggiornarla.
  Gli Excel di fuori li apre SEMPRE un lavoratore a parte (`excel-isolato.mjs` nel giro, `xlsx-lettore.js` nell'app): la
  libreria degli Excel del progetto (SheetJS 0.18.5) con un file fatto apposta può sporcare gli oggetti del programma
  (CVE-2023-30533). Nell'app un allegato si apre in `#allegatoVista`: PDF disegnati da PDF.js (`pdfjs/`, Apache 2.0,
  `isEvalSupported:false`), foto, tabelle, testo; tutto il resto (anche HTML e SVG) mai come pagina: resta un file da
  scaricare (`mimeSicuro`, «application/octet-stream»).
  La notifica di un'email porta `rif: "email_<id>"` e apre quell'email (`guardaAvviso`); nell'email Sofia piccola
  (`#segrMini`, fuori dal foglio come `segrFuori`) sta sopra il foglio in alto a destra (il foglio dell'email lascia il posto:
  `height: calc(100dvh - 122px)`) e legge con «Te la leggo io?» (`segrLeggiEmail`, `segrTestoDaLeggere`: chi, oggetto,
  testo senza link e indirizzi, gli allegati). `apriFoglio`/`chiudiFoglio` non ridisegnano tutto: `segrMini` e `segrFuori`
  si guardano anche lì.
- La scrittura della Segreteria e delle email (1.108.1, scelta da Michele il 20/11 tra 16 prove: senza occhiali il corsivo
  inglese si leggeva male) è Andika, le «lettere di scuola», più grandi dove c'è tanto da leggere: `font-size-adjust` .6
  (alte come prima) e .7 (un quinto più grandi), grassetti veri, niente `-webkit-text-stroke`. Per cambiarla: `--mt-font`/
  `--mt-num` su `#segrHero,.sge-foglio` e il font nella lista di sw.js. Attenzione: certi caratteri hanno la «x» dichiarata
  sbagliata (Delius: 0,085) e con `font-size-adjust` diventano giganti: misurarla prima (fontTools, il glifo «x»).
  1.108.2 (sua: «vai» a «più grande o più nera»): nei testi lunghi grassetto vero (Andika 700) e inchiostro nero.
- Allegati (1.108.3, giro 1.41.1): le email di prima della casella 3 chiedono l'elenco da sole appena aperte (niente tasto);
  elenco vuoto = «Nessun allegato da aprire» (era il logo della firma). Le immagini piccole della firma (`allegatoFirma`:
  image001.png, Outlook-….png, logo…, ≤ 60 KB; o qualunque immagine ≤ 6 KB) non si mostrano, non si contano, non vanno a
  Gemini. Sofia piccola sopra l'email è la segretaria intera (100×166, il nome sotto); il foglio lascia 160 px.
- Allegati (1.109.0, casella 4, giro 1.42.0; sua: «mi deve aprire qualsiasi allegato sul telefono»): si apre tutto dentro
  l'app (Word/PowerPoint/LibreOffice leggendo l'XML, zip col DecompressionStream, email .eml, RTF, audio, video, SVG come
  <img> data:, firma digitale .p7m aperta a mano, fattura elettronica FatturaPA leggibile); HTML ed email solo in un iframe
  sandbox="" con CSP, dopo DOMParser; il resto «⬇ Apri col telefono» col tipo giusto (mai html/svg/xml/message come tipo
  del blob). Nell'elenco anche le immagini dentro il testo (`in`), sotto «Le immagini dentro l'email»; contati e letti da
  Gemini solo gli `allegatoVero` (come prima). Indietro: una voce sola, `prima` torna dal file dentro all'elenco.
- Sofia sopra l'email (1.109.0; sua: «deve muoversi… soprattutto mi deve rispondere»): i 3 filmati della Segreteria; toccata
  o «🎤 Chiedimi una cosa» ascolta e risponde a voce sull'email e gli allegati (`segretariaSullEmail`: senza effetti
  nell'app, email e allegati a Gemini con `aCodici`); domande e risposte in memoria (`S.segrDomande`), non salvate.
- Allegati più veloci e più chiari (1.110.0; sua: «troppo lenti», «non si aprono», «vedo male»): appena apri un'email i suoi
  allegati si prendono in sottofondo (`segrPrendiPrima`, uno alla volta, prima i piccoli; coi dati del telefono meno) e restano
  nel telefono (IndexedDB «ricci-allegati», `prendiAllegato`: mai chiesto due volte; 10 giorni, 150 MB); la casella si riprova
  da sola due volte (`casellaAllegato`), la barra si riempie mentre arriva. Il registro `importazioni/diagnosi-allegati`
  (ultime 30 righe: tipo, KB, secondi, errore, telefono; MAI nomi di file o contenuti) si vede in La posta dell'albergo.
  PDF.js e le icone stanno nella cache `ricci-librerie-1` di sw.js, che resta tra le versioni. Nel visore «Scritto grande»
  (il testo nero, 30 px; del PDF lo legge PDF.js) e «Leggimelo» (`segrParla(…, "allegato")`, `segrLeggeAll`).
- Le icone 3D (1.110.0): disegnate da Gemini (la richiesta l'ha mandata Claude, e gliel'ha detto), avorio su un colore
  profondo con la cornice d'oro; due serie di 24, `all3d-l/` lucide (bombate) e `all3d-o/` meno lucide, scelte in Come si vede
  l'app (`CHIAVE_ICONE`). `icoAll(nome)`, `icoNomeFile`, `nomeTipoFile`. Tagliate dal foglio 4x2 con `taglia3d.py` (fuori dal repo).
  1.112.0 (sua: «ma i tasti dove sono?» · «quelli che abbiamo fatto con gemini» · «Anche in Segreteria»): le icone lucide sono
  anche sui TASTI della Segreteria (Parlale, Scrivile, Ascolta, Chiama, Scrivi, Documento, i tasti dei cassetti, Instagram,
  Inquadra documento, l'email, la nuvoletta): 14 icone nuove nelle due serie (matita, documento, fotocamera, piu, spunta,
  sveglia, chiave, x, fumetto, cornetta, domanda, su, annulla, calendario; «Rimetti» è «annulla» girata, `.specchio`).
  Nei pezzi che usano anche gli altri stili `segrIco(nome, prima)`: l'icona solo nella testa Premium. Restano a matita le
  tessere grandi e le figure che raccontano (persone, strisce delle camere). Un tasto nuovo della Segreteria: icona lucida.
  GRANDI (sue, viste le foto: «Sì, ma più grandi» → «Ancora più grandi» → «Sì, mettile così»): 72-88 px sui telefoni, 62-76
  sotto i 390 px; nei tasti a metà riga l'icona sopra e la parola sotto. Non rimpicciolirle. Nelle icone tagliate dalla
  riga di sotto del foglio di Gemini può restare in cima l'ombra della tessera di sopra: `ripulisci-sopra.py` (fuori dal repo).
  Si torna ai disegni a matita di prima (sua: «comunque dammi la possibilità di tornare indietro anche»): Altro → Come si vede
  l'app → «8. I tasti della Segreteria» → «A matita, come prima» (`ricci_segr_tasti` = "matita" nel telefono, `segrTastiMatita`,
  `segrTasto(nuovo, vecchio)`; il CSS nuovo vale solo con `body.segr-lucidi`). Un tasto nuovo della Segreteria: tutte e due.
- I tastoni della Segreteria lucidi con l'oro (1.113.0; sua: «concentriamoci… su quei tastoni… fammi fare delle proposte da
  Gemini»; delle 4 proposte di Gemini ha scelto la «1»): ogni tastone (Oggi, Prenotazioni, I miei cassetti, Instagram) è una
  tessera lucida del suo colore profondo con la cornice d'oro, fatta col CSS (`--l1`/`--l2`, `body.segr-lucidi`; con le icone
  «meno lucide» anche i tastoni sono più satinati, `body.icone-opache`). Il disegno avorio è una sagoma di Gemini
  (`tastoni/*.webp`, 600 px; `segrTessera(k, mat)`; tagliate con `taglia-pitto.py`, fuori dal repo). Numeri e parole
  restano quelli veri, color avorio.
- La Segreteria più calma (1.114.0; sua: «c'è troppo rumore visivo… I tasti che abbiamo fatto fare a Gemini… non vanno bene…
  il tastone sopra Sofia grande… non c'è bisogno… Sofia… più leggera, più sfumata… quando legge le email… si fa fatica a
  fermarla… gli allegati… troppi colori»; viste le foto: «togliere… i tasti, quelli rotondi, dorati, però i tastoni… mi
  piacciono… forse sono un po' troppo scuri», poi «Tastoni ancora più chiari»). I TASTI tornano a matita: `segrTastiMatita()`
  è vero se `ricci_segr_tasti` non è «lucide» (i lucidi di Gemini solo se scelti, Come si vede l'app → 8). I TASTONI lucidi
  con l'oro restano, più chiari, scelti a parte: `segrTastoniMatita()` (`ricci_segr_tastoni` = «matita»), `segrTessera`,
  `body.segr-tastoni` (il CSS della 1.113.0 era sotto `segr-lucidi`, adesso sotto `segr-tastoni`), Come si vede l'app → 9.
  A pagina intera niente «Sofia grande» (Sofia si allarga con due dita, «Indietro» rimette la pagina con lei grande); Sofia
  nel riquadrino senza cornice né striscia col nome, i bordi sfumati (maschera su `.pip-fig`), un po' trasparente.
  «Ferma» (`segrFerma`, `#segrFerma`, `segrFermaOra`): mentre Sofia della Segreteria parla (vista Segreteria o foglio
  dell'email) un tasto grande in basso la zittisce. Gli allegati: un riquadro ciascuno col numero, i disegni semplici
  (`SGA_DIS`, `sgaDis`), «tipo · peso» su una riga, quello che ha capito Sofia dentro il riquadro, «Apri l'allegato».
- I numeri dei tastoni hanno tre forze (1.115.0; sua: «i numeri… devono essere più risaltati rispetto al semplice 0»; il rosso
  dappertutto no: «troppo allarmanti… non voglio che mi mettano ansia»; la regola è sua: «Bianco è poco intenso… Azzurro è
  normale… rosso è urgente»). Il numero che c'è sta in un tondo: BIANCO (Pulizie, Ho fatto io), AZZURRO (tutti gli altri),
  ROSSO = la classe `rosso` sul tastone: la Ciclovia con una email nuova (`segrCicloviaNuove`: non ancora aperta su questo
  telefono, `ricci_segr_viste`; aprire l'email o toccare «Ciclovia» la toglie; 1.115.1: le email arrivate prima che il
  telefono avesse questa versione, `ricci_segr_viste_da`, sono rosse solo se aspettano ancora la risposta), «Da fare tu» con una cosa che scade oggi o
  che Sofia ha segnato importante (`segrUrgenteFare`; `importante` lo mette la lettura, `lettura.js`), «Ti propongo» con un
  guasto urgente (`segrUrgenteProp`). Lo zero ha la classe `zero`: piccolo e spento. Il numerino della Segreteria nella barra
  in basso è azzurro, rosso se c'è qualcosa di rosso (`segrUrgenti`), e conta anche la Ciclovia nuova. Un tastone nuovo col
  numero: `zero` quando è a zero, `rosso` solo se è davvero urgente (il rosso gli mette ansia: poco). Un «visto» nuovo
  tenuto nel telefono parte da adesso: quello che c'era già non deve uscire come nuovo la prima volta.
- La Segreteria a pagina intera (1.110.0; sua: «quando poi dopo vado giù… tutta la pagina tutta riempita di notifiche… il
  quadratino… movibile come… per alcune videochiamate… che si può restringere, che si può allargare»): scendendo più di 40 px
  nel riquadro (`segrPiena`, `#segrHero.notizie-piene`) il riquadro prende tutta la pagina e Sofia va in `#segrPip` (fuori da
  #app come segrMini): i tre filmati, col dito si sposta, con due dita o l'angolino si allarga (da 88 px fin quasi a tutto lo schermo, 1.111.0; posto e misura in
  `ricci_segr_pip`), un tocco = `sg2Mic` (se parla smette); la nuvoletta `#segrPipBolla`. «Sofia grande» e Indietro
  (`segrChiudiAperto`) la rimettono com'era. La Sofia grande coi filmati fermi intanto; il fantasmino `segrFuori` no.
  Toccando un tastone (Oggi, Prenotazioni, Instagram) si scorre con `segrScorriA(g, sopra)` (1.113.2): se serve si passa
  PRIMA a pagina intera, si aspetta il riquadro grande (340 ms) e ci si ferma sotto «Sofia grande» e il riquadrino
  (`segrSopraCoperto`); prima a metà strada comparivano loro e quello aperto finiva sotto. La pagina della Segreteria non
  scorre: la testa è alta `--h-casa + --alto-sotto` (non +80 come la prima pagina), il velo `height:100%`, il riquadro
  `overscroll-behavior:contain`.
  La proposta del 21/11, mai pubblicata (la striscia ferma in cima con «Sofia grande» e Sofia piccola, i tasti larghi a tastone aperto, le
  scritte tutte a 19 px, via il microfono e «Ascolta» piccoli accanto a Sofia): viste le foto ha scelto «Quella di adesso».
  Non rifarla senza che la chieda lui (fase19115.py e le foto restano fuori dal repo).
- Instagram nella Segreteria (1.111.0; sua: «metti nella segreteria quello che si può e il resto lo facciamo dopo ma finisci la
  segreteria»): due tessere dopo i cassetti, «Instagram» (`S.segrIg = "ig"`: come sta Sofia influencer, il prossimo post, le
  bozze con la foto) e «Foto da fare» (`"igf"`: le otto `SOC_FOTO` con «Fotografa», `capture`, o «dalla galleria»; salvano
  con `socFoto`). Niente porta via dalla Segreteria; le impostazioni restano in Altro → Sofia influencer. Ancora fuori (dopo):
  la Pagina Facebook, i messaggi privati di Instagram, Booking/Airbnb/Expedia.
  La Ciclovia (letto sul loro sito il 17/11/2026): le richieste arrivano per email, si accettano o si rifiutano entro 12 ore
  lavorative, i giorni si chiudono nel loro calendario; niente iCal, niente collegamenti. Chiudere i giorni e dire sì o no
  lo fa Michele sul loro sito: l'app mostra e porta lì, non lo fa al posto suo e non va automatizzato col mouse.
  DA FARE alla prima email vera della Ciclovia: guardare chi la manda e com'è l'oggetto, e stringere le regole. Le email
  restano una settimana in `posta/`; la prenotazione NON entra da sola nel prospetto.
- «Indietro» nella Segreteria (1.95.0; Michele: «ci sono parecchi bug nella parte Sofia segretaria, non si riesce a tornare
  indietro, quando parla»). Dalla 1.92.0 il filmato di lei, ingrandito (`--tre-scala`), aveva la cornice invisibile fin sopra
  la barra in alto: il dito su «Indietro» toccava lei (`sg2Tocca`) e lei si metteva a parlare. Adesso in `#segrHero` il
  filmato e le tele non sentono i tocchi (`pointer-events:none`); li sente il tasto `.sg2-sofia` con un `::after` grande
  quanto lei, sotto la barra; `sg2ToccoBuono` scarta un tocco dentro la barra. «Indietro» (pillola o tasto del telefono) prima
  richiude quello che Michele ha aperto nella Segreteria (`segrChiudiAperto`: è il `prima` della voce «vista» nella pila di
  `INDIETRO`; una voce col `prima` resta nella pila se il `prima` ha chiuso qualcosa), poi esce. Uscendo, `segrEsci` la
  zittisce e richiude tutto.
  REGOLA PER LE PROVE: i tasti si premono COL DITO (`locator.tap()`, `touchscreen.tap(x, y)`), non con `el.click()` dentro
  `evaluate`: un tasto coperto da qualcosa di invisibile con `el.click()` funziona, col dito no. Questo errore è passato per
  tre versioni proprio così. `t/prova1950b.cjs` guarda anche che nessun tasto sia coperto da un filmato.

- Sofia segretaria (1.85.0): i filmati sono i segr5 (480x600, fatti dai segr4 con `strumenti/fai-segr5.py`: il bordo di sotto
  uguale in tutti i fotogrammi, il giro che finisce dove ricomincia). In testa alla Segreteria il palco (`.sg2-palco`): lei
  grande in mezzo, la nuvoletta con quello che dice, «🎤 Parlale» e «✍️ Scrivile». Il fantasmino (`segrFuori`) giù nella
  pagina c'è sempre: fermo il viso con «🎤 Parlale» (tocchi: torni su e ti ascolta), mentre parla è lei (tocchi: smette).
  Solo negli altri stili: nello stile Premium (`#segrHero`) mai, Sofia c'è già, grande o nel riquadrino (1.113.1; sua: «c'è
  anche sotto una faccia di Sofia che non c'entra niente»). Il perché: entrando dalla barra in basso `vai` fa
  `S.vista = k; chiudiFoglio(); disegna();` e `chiudiFoglio` chiama `segrFuori` prima che la pagina nuova ci sia (niente
  `.sg2-sofia`): la faccina partiva; `disegna` la toglieva, ma il doppio `requestAnimationFrame` le rimetteva «su» dopo e
  il timer non la nascondeva più. Adesso conta l'ultima decisione (`f._vuoi`). Una figura nuova che entra e esce allo
  stesso modo: la stessa cosa.
- La Segreteria come la prima pagina (1.92.0; Michele, visto il disegno di Gemini: «la grafica e l'impaginazione… va benissimo
  così ma… la sua interfaccia deve essere uguale a quella di sofia governante che sta all'inizio dell'app… metti qualcosa di
  rosa, fai fare dei nuovi filmati dove… passa dal tablet al pc»). Nello stile Premium la testa della Segreteria è `#segrHero`:
  le stesse classi della testa della prima pagina (`.sofia-hero`…), quindi lo stesso stile, ma un pezzo a parte
  (`disegnaSegrHero`). Nel riquadro il disegno di Gemini: tessere col numero grande e il disegno a matita (`.sgt`; i disegni
  nuovi sono `mat-sveglia`, `mat-spunte`, `mat-busta`, `mat-arrivi`, `mat-partenze`), un tocco su un cassetto apre le sue righe.
  I filmati sono i segr6 (camicetta rosa, 540x960, fatti da Gemini col verde dietro e ritagliati con `strumenti/verde.py`):
  ogni video parte e finisce nella posa della foto. Negli altri stili resta il palco della 1.85.0.
- La Segreteria a matita, coi tasti che aprono cose utili (1.94.0; Michele: «se clicco sull'email ovviamente deve aprirmi le
  email che mi sintetizza sofia segretaria e che se voglio leggerla nello specifico clicco sopra e mi collega con l'email
  intera, e poi i tasti, esempio pulizie, mi riportano alla pagina iniziale e quindi molto senso non ne ha… devono essere
  veramente utili e straordinari» · «stile scuole elementari… chiarissime e scritte a matita… falli fare a gemini… in corsivo
  ma un corsivo veramente ultra capibile»). Nel riquadro di `#segrHero` le quattro tessere di «Oggi» (`segrOggiHtml`,
  `S.segrOggi`) NON portano più in un'altra pagina: si aprono lì sotto, una alla volta (arrivi, partenze, pulizie, email).
  Email: una scheda per email con le righe di Sofia (`segrEmailCapito`, dalle letture); un tocco apre l'email intera
  (`foglioSegrEmail`: il testo che la casella ha preso, al massimo 1800 caratteri) e «Apri nella posta» (`segrEmailLink`:
  la ricerca in Gmail per mittente e oggetto; NON è stato provato su una casella vera né sul telefono).
  Un tasto della Segreteria non deve mai portare via dalla Segreteria.
  Tutto a matita: carta a righe, tessere a pastello, disegni di Gemini (`mat-*.webp`, `strumenti/taglia-disegni.py`), scritte
  in corsivo di scuola (Playwrite IT Moderna, `--mt-font`; i numeri in Patrick Hand). Le regole stanno in fondo a `style.css`
  («1.94.0»), tutte sotto `#segrHero` e `.sge-foglio`. Niente faccine nella Segreteria: solo disegni.
  1.96.0, i cartoncini e il corsivo inclinato (Michele, scelte due proposte di Gemini: «Dei cartoncini, proposta 1, però la
  scrittura assolutamente quella della 2… si può ancora migliorare»): ogni tessera, tasto e scheda è un cartoncino (il contorno
  dello stesso colore più scuro, lo spessore a sinistra e sotto, l'ombra; toccato si abbassa, aperto resta abbassato), i
  disegni piccoli dei tasti in un tondo in rilievo, i colori della proposta 1. Le variabili: `--cc` faccia, `--cb` contorno,
  `--cs` spessore, `--sx`/`--sy` quanto sporge. Il corsivo è Playwrite HR (OFL), il più vicino alla proposta 2 tra i caratteri
  liberi, marcato col tratto della penna (`-webkit-text-stroke`); anche i numeri. Le misure restano quelle grandi.
  1.97.0 (Michele: «ancora più chiaro… da Presidente della Repubblica degli anni 40, degli anni 50… come quando si scrivevano i
  registri contabili tutto a mano» · «troppo tratteggiato sui cartoncini… l'occhio viene disperso»): il corsivo è Petit Formal
  Script (OFL, il corsivo inglese col pennino; la «x» più alta di quella di prima), scurito col tratto della penna; niente più
  tratteggio (`--mt-tratto` e `--mt-tratto2` sono `none`): i cartoncini hanno il colore pieno. Niente tratteggi nella Segreteria.
  1.98.1, i cartoncini chiarissimi (Michele: «rispetto al nero quei colori sono troppo accesi… farli un po' più smorti in modo
  tale che il nero risalti di più»; tra le prove ha scelto «chiarissimi»): la faccia è `color-mix(in srgb, var(--cc) 28%,
  #FFFDF8)` (la regola in fondo a `style.css`, con la stessa lista di cartoncini della regola che li dipinge); il contorno e lo
  spessore restano pieni. La matita è `#141417`, il grigio `#3F3F47`. Un cartoncino nuovo prende il suo `--cc` come prima e
  diventa chiaro da solo, se sta nella lista.
  I filmati sono i segr7 (da Flow): lavora (tre video in fila, 31 secondi), ti ascolta, parla: tre filmati veri
  (`strumenti/fai-segr.py`). Mentre ascolta o parla, il filmato in cui lavora torna al suo inizio e aspetta (`segrFermaSotto`).
- I filmati senza il «battito» (1.94.0; Michele: «micro lag nei capelli»): un fotogramma chiave ogni due secondi faceva cambiare
  tutta la grana insieme. Adesso i fotogrammi chiave stanno solo dove l'app salta: all'inizio di ogni pezzo nei filmati della
  Sofia di casa (`-giro5`), solo il primo in quelli di Sofia segretaria (`segr7`). Dentro un filmato si salta solo lì.
  Spiegato in `strumenti/README.md` (`codifica-liscia.sh`, `misura-chiave.py`). Quelli delle signore (`capo-*`), «com'era» e
  Sofia influencer sono ancora compressi alla vecchia maniera.
- I lampi nel ritaglio (1.95.0; Michele: «trema leggermente quando c'è il video che si mette i capelli dietro l'orecchio…
  si toglie le immagini»): per uno-tre fotogrammi il ritaglio apriva un buco dentro di lei. `strumenti/liscia-bordo.py` chiude
  solo quelli sicuri (grossi, brevi, dove la sala non si vede mai); il filmato in cui sta ferma è il `-giro6` (13 fotogrammi
  cambiati su 891, gli stessi pezzi). Prima di cambiare un ritaglio: `conta-lampi.py` e `striscia.py`, e guardare tutti i
  fotogrammi toccati. I buchini tra i riccioli restano (spiegato in `strumenti/README.md`). Il video del bacio piace a
  Michele così com'è: non «migliorarlo» oltre i lampi.

- Jarvis (1.88.0) è la pagina personale del titolare, fatta come un'app delle cose da fare (Michele: «basato sulle app di
  produttività, to do list»): in cima Jarvis (dalla 1.99.0 Sofia personal trainer, sotto) e quello che dice; «Da fare oggi» coi tondi da
  spuntare (`jvOggi`: prima quello rimasto indietro, poi oggi, poi le cose senza giorno, poi gli obiettivi di ogni giorno);
  sotto Impegni (i prossimi giorni), Obiettivi, Idee, Traguardi, Il mio piano. È chiara come le pagine di Sofia. Si apre dalla
  casetta del logo in alto nella prima pagina (`button.bo-casetta`, invisibile: «la galassia prendeva troppo occhio a Sofia»).
  Le sue cose stanno SOLO nel telefono (`localStorage`, chiave `ricci_jarvis`): il suo codice (in fondo ad `app.js`, `jarvis…`
  e `jv…`) non chiama mai l'IA, e deve restare così (lo controlla `fase1980.py`); le frasi le capisce con poche regole (`jvComando`,
  `jvCapisci`) e con `LET.promemoriaDa`. Fuori dal telefono va solo la sveglia (sotto): codici e orari nel database, e la
  «spinta» alla cassetta senza dati. Si accende telefono per telefono (`…/?jarvis=1` o l'interruttore in Altro). Il Jarvis
  dentro Gemini (1.87.0) non gli è servito: «che faccio, vado a chattare con Gemini?». Vuole le interfacce dentro l'app, come
  con Sofia.
  1.99.0, SOFIA PERSONAL TRAINER AL POSTO DELLA GALASSIA (Michele: «un bel video di sofia personal treiner che mi saluta e mi
  manda bacini di affetto come fa la mia governante» · «caricala come… l'interfaccia che ho nella prima pagina… più di mezzo
  busto con la trasparenza… che si vede pure sotto, con la possibilità di andare pure giù, con le icone… le icone le facciamo
  fare sempre a Gemini»). La pagina di Jarvis è fatta come la prima pagina: in cima LEI, Karen (dalla 1.101.0; le sue foto e i suoi
  filmati dalla 1.104.0 NON sono nel repository: vedi sotto; prima c'era Sofia trainer disegnata. Le persone che PROPONGO io
  restano MAI realistiche: «Orribile proprio. Toglila completamente»), grande, senza
  sfondo, più di mezzo busto, ferma mentre la pagina scorre (`#jvFigura`, `position:fixed` dentro `.jarvis`, sul marmo della
  prima pagina). Il riquadro (`.jv-pann`) sale sopra di lei ed è trasparente: lei si vede anche sotto. Dentro: «Sofia ti
  dice» col tasto Parla, le tessere coi disegni di Gemini (`jv-ico-*.webp`: 3D rosa, nero e oro come il suo completo;
  `strumenti/taglia-icone-jarvis.py` le taglia dal foglio 4x2 su fondo bianco), la sveglia, «Da fare oggi». A destra di lei
  il microfono e «Ascolta». Quando apri Jarvis ti manda UN bacio, si sistema i capelli dietro l'orecchio e fa gesti tranquilli (Michele: «troppi baci… soltanto un bacio»; `FILM_JV.saluto`, `jv-lei-saluto-3d.webm`, 10 s,
  dal video di Gemini col verde dietro, `ritaglia-verde.py`; il gemello `-alfa.mp4` per l'iPhone), poi resta nella posa della
  foto (`jv-lei-3d.webp` = il primo fotogramma del saluto). Toccandola (`.jv-tocca`) ti risaluta e ti dice tutto. `#jvFigura` NON si ridisegna con il resto (jarvisDisegna toglie
  e rimette solo quello che c'è dopo): il filmato non riparte quando scrivi o spunti. Nelle pagine dei riquadri il suo viso
  piccolo nel tondo (`JV_VISO`, `jv-lei-viso.webp`, fondo avorio e oro: `strumenti/fai-viso-jarvis.py`). La voce di Jarvis è da donna (`jvVoce`), solo quella del telefono.
  I filmati di Jarvis NON sono in «I filmati di Sofia» (Impostazioni): sono solo per lui, su questa pagina.
  1.103.0, IL NOME: si chiama «KAREN» (Michele: «dobbiamo chiamarla Lady Costume…» → «no va bene karen»; «probabilmente poi lo
  cambieremo il nome»; è la voce del costume di Spider-Man in Homecoming, come Jarvis è quella di Iron Man). Il nome che
  si legge e si sente è solo `JV_NOME` in app.js (più `JV_NOME_SW` in sw.js per la notifica della sveglia): titolo, «… ti dice»,
  come si presenta, i tasti, le Impostazioni, gli avvisi, al femminile. Dentro tutto resta «jarvis»/«jv» (funzioni, classi,
  chiavi dei dati, ?jarvis=…): per cambiare nome si cambiano solo quelle due righe.
  1.102.0, LEI PARLA (Michele: «ok però poi falla parlare anche»): quando la voce di Jarvis parla (`JV.parla`) si vede il filmato
  «parla» (`FILM_JV.parla`, dal 1.104.0 nel pacco: parte ferma, parla muovendo la mano destra, torna ferma), il secondo video di `#jvFigura` (`.jv-fig-p`, sopra al saluto, classe `parla-film`), che gira in tondo finché la
  voce va. Il saluto ha la precedenza (`JV_FILM.gesti`: i primi `JV_SALUTO_GESTI` secondi, il bacio e i capelli), poi parla; quando
  la voce smette una dissolvenza corta (0,35 s) la riporta ferma. Nei riquadri il filmato si ferma (`jvFilmFerma`); tornando alla
  pagina di Jarvis il saluto lasciato a metà riprende. Voce spenta (muto) = lei non parla.
  1.104.0, KAREN SOLO SUL SUO TELEFONO (Michele: «assolutamente tutta la parte di karen deve stare solo sul mio telefono»): le
  foto e i filmati di Karen (`KAREN_FILE`: jv-lei-3d.webp, jv-lei-viso.webp, jv-lei-saluto-3d.webm, jv-lei-parla-3d.webm) NON
  stanno nel repository né nel sito: MAI caricarli su GitHub. Stanno nel «pacco» karen.zip (zip senza compressione) che Michele
  carica una volta in Impostazioni → Altro («Carica il file di Karen», `karenCarica`): la cache «ricci-karen» di quel telefono,
  indirizzi blob: (`KAREN_URL`, `karenPrepara` all'apertura). Senza il pacco Karen non c'è (`jarvisPuo` vuole `karenPacco()`):
  niente casetta, non si apre (così sul PC sparisce). «Togli Karen da questo telefono» cancella la cache (le cose da fare
  restano). I filmati solo dove il webm trasparente va da sé (`ALFA_OK === "si"`): sull'iPhone la foto ferma.
  «OBIETTIVI FISICI» (Michele: «metti questo video in una parte più nascosta di karen esempio obbiettivi fisici»): in fondo alle
  Abitudini un tasto discreto (`jvVaiFisici`); la pagina (`JV.sez = "fisici"`, `jvFisiciHtml`) ha il video o la foto che sceglie
  lui dalla galleria (`karenFisiciMetti`, nella cache «ricci-karen», MAI nel repository) e i suoi obiettivi scritti (`d.fisici`).
  1.105.0: se non ne ha scelto uno, si vede il video di serie `fisici-estate.mp4` (ragazza bionda in costume intero che corre sulla
  riva, di Gemini; Michele: «questo lo puoi mettere anche tu.. perché non è osceno»): è un file dell'app, tra i FILMATI.
  1.106.0 (Michele: «premo la casetta ma non va»): la casetta del logo si vede SEMPRE (è disegnata nel logo); il tasto
  invisibile sopra non deve mai sparire mentre Karen è accesa. Senza il file (`jarvisSenzaPacco`) porta in Altro al tasto
  «Carica il file di Karen» in giallo (`karenGuida`, `KAREN_GUIDA`); caricato il file, Karen si apre da sola; segno «caricato»
  senza i file nel telefono → si toglie il segno e si torna lì. `jarvisApri` non resta mai a metà (disegno rotto → chiude).
  Prossimi filmati (Michele: «di attività che si fa in palestra… di crescita, che gioca a scacchi, che risolve un cubo…
  deve stare la continuità del video… non si deve capire»): ognuno parte e finisce nella posa della foto, e si mettono in
  fila come quelli della prima pagina (attacchi, rientro lento), così da ferma fa una cosa dopo l'altra senza scatti.
  1.100.0, JARVIS COME LE APP MIGLIORI (Michele: «per il momento vedi di ispirarti alle migliori app di produttività» · vista
  la prova disegnata: «Sì falle tutte»). Prese da Todoist, TickTick, Things, Microsoft To Do e Structured: nella pagina di
  Jarvis «Sofia ti dice» ha il giorno e l'ANELLO delle cose fatte oggi (`jvOggi`, come prima); sotto, la RIGA PER AGGIUNGERE
  (`#jvVeloce`: invio o ➜ = `jarvisSentito`, cioè come quando parli: aggiunge, oppure risponde a «cosa ho domani», «ho fatto
  …»); le RIMASTE INDIETRO (giorni passati) con «Portala a oggi» (`jvPortaAOggi`: tengono l'ora se non è già passata, se no
  diventano «oggi» senza ora e senza sveglia esatta); «La tua giornata» (`jvGiornataHtml`: rimaste indietro in rosso, poi le
  cose con l'ora in ordine con la RIGA ROSSA DI ADESSO, poi quelle senza ora, prima le importanti; la STELLA ⭐ è
  `importante` sulla cosa); «Ogni giorno» (gli obiettivi di prima, adesso «Abitudini»: un tocco = fatta oggi, la FIAMMA 🔥 coi
  giorni di fila, `jvFila`); «Concentrati 25 minuti» (`JV_FOCUS` in localStorage: la fine resta sul telefono, riaprendo
  continua; finito, Sofia lo dice, ti risaluta, vibra e manda la notifica se il permesso c'è; non esce niente); in tutte le
  pagine i TASTI IN BASSO (`jvTabHtml`: Oggi, Prossimi = impegni, Abitudini = obiettivi, Idee, Piano; i Traguardi stanno in
  fondo alle Abitudini). Le chiavi dei dati non cambiano (impegni, obiettivi, …): cambiano solo i nomi che si leggono.
  Niente rosa nelle parti nuove: Michele non lo vuole («poi lo cambiamo»).
- La sveglia di Jarvis (1.89.0, giro 1.37.0; Michele: «mi deve arrivare una sorta di notifica, una sveglia… 5-10 minuti prima…
  altrimenti non ha senso», e alla proposta «Sì»): circa 10 minuti prima di una cosa con l'ora arriva la notifica, anche ad
  app chiusa. È l'UNICA cosa di Jarvis che esce dal telefono, e Michele ha detto sì solo a questo: in
  `importazioni/jarvis-sveglie` vanno un codice e il giorno e l'ora (`telefoni.<telefono>.<codice>`, li scrive
  `jvSveglieFuori`), MAI che cosa c'è da fare. Il testo resta nel telefono, nella cache `ricci-jarvis`: quando il giro manda
  «sveglia <codice>» (`sofia-giro/sveglia-giro.mjs`, a ogni giro, entro 15 minuti dall'ora; di notte 65) il lavoratore di
  sfondo compone la notifica (`mostraSveglia` in `sw.js`). Nel registro di GitHub della sveglia non si scrive niente: l'ora
  del registro direbbe quando ha un impegno. Funziona finché gira il giro: a PC spento serve «L'orologio di Sofia».
  1.98.0 (giro 1.39.0, cassetta 4), LA SVEGLIA ALL'ORA GIUSTA (Michele: «Jarvis deve essere in pratica una sveglia… ricordami
  alle 18 di fare gli auguri a mio cognato, e alle 18 mi arriva la notifica di Jarvis»): «ricordami / avvisami / svegliami …
  alle 18» (anche col quando davanti, `JV_VERBO_SVEGLIA`) è una cosa `esatta`: la notifica arriva alle 18 («⏰ Fare gli auguri…
  · Sono le 18: me l'hai chiesto tu»). Le altre cose con l'ora suonano 10 minuti prima. Fuori: `telefoni.<telefono>` (impegni)
  ed `esatte.<telefono>` (all'ora), sempre solo codice → ora. Il giro (`sveglia-giro.mjs`) non manda più «quando passa»:
  aspetta il minuto giusto mentre fa il resto, e finisce dopo (`giro()` → `giroPassi()`; il lavoro può durare 20 minuti). Gli
  orari, e solo quelli, vanno alla cassetta (`copia-sicurezza.gs` versione 4, azione `sveglie`), che fa partire un giro 2
  minuti prima di ognuno (un trigger `.at()` solo, alla prossima): così è giusta anche di notte. Senza cassetta il giro
  aspetta fino a 11 minuti (di notte manda prima). Una sveglia tra pochi minuti: l'app chiede alla cassetta «spingi»
  (`jvSpingiSePresto`, nessun dato). La cassetta 4 va rimessa a mano nel Google dell'albergo (come la casella: Gestisci
  deployment → ✏️ → Nuova versione).
- Le notifiche coi disegni (1.98.0; Michele: «più sono inerenti coi colori, con le immagini… e meglio è»): ogni notifica ha
  l'icona della sua cosa, il disegno a matita di Gemini nel tondo colorato dei cartoncini (`notifica-*.png`, 14, fatti da
  `strumenti/fai-icone-notifiche.py`). La sceglie `iconaDi` in `sw.js` dal disegnino in testa al titolo (⏰ sveglia, 📧 email,
  🛎️ prenotazione, 💬 messaggio, 🚨 urgente…): una notifica nuova col suo disegnino in testa prende l'icona giusta da sola.

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
