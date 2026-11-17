# Strumenti (si usano dal computer, non dall'app)

- `genera-catalogo.mjs` — legge `catalogo/catalogo-governante-v4.csv` e i fogli "Checklist signora", "Calendario vero", "Livelli e costi" di `catalogo/catalogo-governante.xlsx` e scrive `catalogo.js`, il modulo dati che l'app carica. **Ogni volta che si cambia il catalogo o il calendario nel file, va rilanciato:** `node strumenti/genera-catalogo.mjs` (serve node e python3 con openpyxl). Stampa il rapporto: righe lette, parti create, righe scartate, codici che la checklist non nomina.
- `catalogo-lib.mjs` — il lettore del CSV (`;`), dei ritmi scritti a parole ("ogni 2 settimane", "a ogni pulizia, lavato ogni mese"), del Quando e del Blocco.
- `importa-catalogo.mjs` — rapporto di prova su un CSV: `node strumenti/importa-catalogo.mjs catalogo/catalogo-governante-v4.csv --rapporto`.
- `unisci-catalogo.py` — l'unione fatta per la 0.26: il file di Michele (163 righe) + le 15 righe dalle foto (P01-P15) + i testi delle foto uniti a 14 righe → `catalogo-governante-v4.csv`. Si è usato una volta; resta per documentare cosa è stato unito.
- `fa-alfa.py` (1.84.0) — i filmati di Sofia per l'iPhone: da un webm trasparente (VP9 con alfa) fa il suo gemello «-alfa.mp4», un mp4 H.264 alto il doppio col colore sopra, una striscia nera di 16 righe e la trasparenza sotto in grigio; l'app lo rimette insieme con la tela (`telaPasso` in `app.js`). Serve python3 con numpy e ffmpeg con libvpx: `python3 strumenti/fa-alfa.py cons-parla-spilla-3d.webm cons-parla-spilla-alfa.mp4`. **Quando si rifà un webm trasparente, si rifà anche il suo gemello** (stesso nome, -alfa.mp4 al posto di -3d.webm) e si aggiunge a `FILMATI` in `sw.js`.
- `fai-segr5.py` (1.85.0) — i filmati di Sofia segretaria segr5 dai fotogrammi dei segr4: la sfumatura di sotto uguale per tutti
  i fotogrammi (prima lampeggiava), il tremolio del bordo dei capelli calmato, il giro che finisce dove ricomincia (12 fotogrammi
  sfumati), il taglio attorno a lei (480x600). `fa-alfa.py` dalla 1.85.0 prende la misura dal webm.
- `attacco.py` e `fai-fluido.py` (1.90.0) — i filmati di Sofia senza scatti. Dai fotogrammi di un filmato fatto di pezzi
  (ritagliati con la trasparenza e piatti con la sala) fanno lo stesso filmato coi pezzi interi e, tra la fine di un pezzo e
  l'inizio del pezzo dopo, meno di un secondo in cui Sofia passa da una posa all'altra. Niente è ridisegnato: ogni punto scivola
  dal posto che ha nell'ultimo fotogramma di un pezzo al posto che ha nel primo del pezzo dopo (prima la testa tutta insieme,
  poi il resto punto per punto), e il contorno si sposta netto. Serve python3 con numpy e opencv (con `optflow` e SIFT).
  `python3 strumenti/fai-fluido.py calmo parla` (le cartelle dei fotogrammi sono scritte in cima al file); esce anche
  `<gruppo>.json` coi numeri da mettere in `app.js` (`FILM_SPEZZONI`, `FILM_CODE`, `FILM_FINE`). Poi si codifica come sempre
  e si rifà il gemello con `fa-alfa.py`.
  Dalla 1.90.2 il filmato «ferma» comincia dal fotogramma 24 del primo pezzo (`tagli=[24, 222, 426]`): prima cominciava e
  ricominciava dal sorriso grande della foto, che in mezzo secondo perdeva. Quando si rifà un filmato si guardano i visi di
  tutto il giro, anche dove ricomincia, non solo gli attacchi.
- `fai-giro.py` (1.91.0) — i filmati di Sofia senza i passaggi «da robot». Mette in fila i fotogrammi veri di più video in modo
  che ogni pezzo parta e finisca nella stessa posa: un pezzo va avanti e poi all'indietro (gli stessi fotogrammi, al contrario)
  e gira dove lei è quasi ferma; dove si passa da un video a un altro i due fotogrammi sono quasi uguali e bastano pochi
  fotogrammi di `attacco.py`. Le cartelle dei fotogrammi e la fila («ferma»: il saluto, poi calma; «parla»: i 5 pezzi, ognuno
  con la sua coda) sono scritte in cima al file. `python3 strumenti/fai-giro.py ferma parla`; esce `<gruppo>.json` coi numeri
  per `app.js`. Un video nuovo va bene se parte e finisce nella posa della foto (così lo fa Gemini quando glielo si chiede).
  Dalla 1.91.1: dove un pezzo gira non c'è il fotogramma fermo (rallenta, gira, riparte piano: `GIRO`); i pezzi di una volta si
  affilano e si intonano prima con `affila.py` (erano più sfocati del video del bacio e di un colore appena diverso, e messi in fila
  si vedeva dove attaccavano; la curva dei colori la misura `misura-tinta.py` sui due fotogrammi dove si attaccano); via il pezzo in
  cui guardava di lato (andava avanti e poi indietro); nel pezzo calmo un gesto solo (inclina la testa e torna), mai lo stesso gesto
  due volte di fila; dove ai pezzi di una volta manca un fotogramma (`MANCA`) si mette quello a metà. Un pezzo nuovo si chiede a
  Gemini che parta e finisca nella posa della foto.
  Dalla 1.91.2: i video che Gemini fa dalla foto hanno la spilla chiara, quasi bianca (nella foto è d'oro). `tingi-spilla.py` la
  tinge d'oro lì dov'è, fotogramma per fotogramma (non la ridisegna: resta dietro la mano quando la mano le passa davanti). Si fa
  su ogni video nuovo della governante, prima di `fai-giro.py`.
- `verde.py`, `ritaglia-verde.py`, `fai-segr.py` (1.92.0) — i filmati di Sofia segretaria col rosa (segr6). I video li fa Gemini
  dalla foto col verde dietro (chiesto apposta: «sfondo verde tinta unita»), che partono e finiscono nella posa della foto.
  `python3 strumenti/ritaglia-verde.py video.mp4 out/v1` toglie il verde e tiene tutto il resto (lei, il tablet, il bancone, il
  campanello, il computer): fotogrammi 540x960 con la trasparenza. `python3 strumenti/fai-segr.py` mette in fila i video (v1, v2,
  v3…) con due o tre fotogrammi di `attacco.py` tra uno e l'altro e fa il pezzo in cui ti guarda. Poi si codifica come gli altri
  (VP9 con la trasparenza) e si fa il gemello con `fa-alfa.py`.
  Dalla 1.93.0 il filmato in cui sta ferma è fatto solo di video nuovi (li fa Gemini / Flow dalla foto, 10 secondi, «parte e
  finisce in questa posa»): `ritaglia-gemini.py <video> <cartella> <nome>` li ritaglia come gli altri, `tingi-spilla.py` tinge la
  spilla, e in `fai-giro.py` l'elenco `ORDINE` dice quali video vanno in fila, da quale fotogramma a quale. Tutti in avanti: niente
  più pezzi fatti andare all'indietro. Il giro comincia dal secondo fotogramma del primo video e finisce sul primo.
  IL RIENTRO LENTO (`rientra.py <video> <ultimo fotogramma> <video seguente> <suo fotogramma> <da> <a> <nome>`): un video nuovo
  alla fine non torna mai proprio nella posa giusta (il busto qualche puntino di lato, la testa girata di un grado). Attaccarci
  un altro video vorrebbe dire farla «scivolare» tutta insieme: la mossa da robot. Il rientro lento sposta ogni fotogramma vero
  della coda di pochissimo, un po' di più a ogni fotogramma, MENTRE LEI SI STA ANCORA MUOVENDO (`da`..`a`: quando rigira la
  testa o abbassa il braccio), finché l'ultimo coincide col fotogramma da cui parte il video seguente (anche il colore, e nel
  filmato con la sala lo sfondo). Prima di scegliere dove attaccare due video si guardano le bocche e gli occhi fotogramma per
  fotogramma: mai un sorriso coi denti attaccato a una bocca chiusa, mai due battiti di ciglia di fila.
- I FILMATI SENZA IL «BATTITO» (1.94.0): `codifica-liscia.sh`, `misura-chiave.py`, `fa-alfa.py` (ha un quinto argomento).
  Fino alla 1.93.0 i filmati avevano un fotogramma chiave ogni due secondi (`-g 48`; i gemelli per l'iPhone ogni secondo). Un
  fotogramma chiave è rifatto tutto da capo: in quel momento la grana di tutta la figura cambia insieme, e nei capelli si vede
  come un tremolio piccolo, a ogni due secondi (Michele: «micro lag nei capelli»). `python3 strumenti/misura-chiave.py
  filmato.webm` lo misura: il cambio che porta a un fotogramma chiave contro quello dei fotogrammi vicini (dove lei è ferma era
  1,07 contro 0,09). Adesso si codifica con `-g 9999` e i fotogrammi chiave si mettono SOLO dove l'app salta
  (`-force_key_frames`): dove comincia ogni pezzo dei filmati della Sofia di casa (-giro5); nei filmati di Sofia segretaria
  (segr7) solo il primo, e lì dentro l'app salta solo all'inizio. Un filmato con un solo fotogramma chiave che finisce nella
  stessa immagine da cui parte ricomincia senza che si veda niente. Il gemello per l'iPhone si fa con
  `fa-alfa.py entrata.webm uscita.mp4 23 9999 <secondi dei fotogrammi chiave, con le virgole>`. Chi rifà un filmato NON rimetta
  `-g 48`.
- `fai-segr.py`, `misura-segr.py`, `controlla-segr.py` (1.94.0) — i tre filmati di Sofia segretaria (segr7) dai cinque video
  di Flow (v1, v2, v3 = lavora; ascolta; parla), ritagliati con `ritaglia-verde.py` in `out/<nome>`. `misura-segr.py v3 parla
  ascolta` dice quanto si muove, dove sbatte gli occhi e quanto è lontana dalla posa della foto; `misura-segr.py --capi
  v3:239,v1:0 …` misura la distanza vera tra la fine di un video e l'inizio di un altro (qui meno di un puntino: non serve il
  rientro lento). `fai-segr.py` li mette in fila: `FERMA` = i video in cui lavora; `GIRI` = i filmati che girano su se stessi, con
  l'ultimo fotogramma che si tiene (parla: 194, dove ha finito di parlare ed è tornata al sorriso della foto; dopo chiudeva la
  bocca). Tra un video e l'altro mette 6-7 fotogrammi di `attacco.py`: i due fotogrammi sono nello stesso posto, ma la grana è
  diversa e con due soli fotogrammi cambiava in un ottavo di secondo. `controlla-segr.py` guarda che attorno agli attacchi non
  ci sia un gradino.
- `taglia-disegni.py` (1.94.0) — i disegnini a matita della Segreteria. Gemini fa un foglio solo con tutti i disegni su fondo
  bianco (12, quattro per riga); il foglio si riprende dallo schermo a strisce e questo lo rimette insieme, trova i disegni,
  toglie il bianco di fuori (non quello dentro: il foglio della lettera, i denti) e scrive i `mat-<nome>.webp`, 240x240.
