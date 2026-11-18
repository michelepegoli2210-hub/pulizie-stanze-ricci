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
  produttività, to do list»): in cima Jarvis (la galassia, `canvas.jv-gal`) e quello che dice; «Da fare oggi» coi tondi da
  spuntare (`jvOggi`: prima quello rimasto indietro, poi oggi, poi le cose senza giorno, poi gli obiettivi di ogni giorno);
  sotto Impegni (i prossimi giorni), Obiettivi, Idee, Traguardi, Il mio piano. È chiara come le pagine di Sofia. Si apre dalla
  casetta del logo in alto nella prima pagina (`button.bo-casetta`, invisibile: «la galassia prendeva troppo occhio a Sofia»).
  Le sue cose stanno SOLO nel telefono (`localStorage`, chiave `ricci_jarvis`): il suo codice (in fondo ad `app.js`, `jarvis…`
  e `jv…`) non chiama mai l'IA, e deve restare così (lo controlla `fase1980.py`); le frasi le capisce con poche regole (`jvComando`,
  `jvCapisci`) e con `LET.promemoriaDa`. Fuori dal telefono va solo la sveglia (sotto): codici e orari nel database, e la
  «spinta» alla cassetta senza dati. Si accende telefono per telefono (`…/?jarvis=1` o l'interruttore in Altro). Il Jarvis
  dentro Gemini (1.87.0) non gli è servito: «che faccio, vado a chattare con Gemini?». Vuole le interfacce dentro l'app, come
  con Sofia. La galassia è un disegno nostro, fatto coi numeri: niente disegni, marchi o voci presi da altri.
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
