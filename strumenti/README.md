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
