# Strumenti (si usano dal computer, non dall'app)

- `genera-catalogo.mjs` — legge `catalogo/catalogo-governante-v4.csv` e i fogli "Checklist signora", "Calendario vero", "Livelli e costi" di `catalogo/catalogo-governante.xlsx` e scrive `catalogo.js`, il modulo dati che l'app carica. **Ogni volta che si cambia il catalogo o il calendario nel file, va rilanciato:** `node strumenti/genera-catalogo.mjs` (serve node e python3 con openpyxl). Stampa il rapporto: righe lette, parti create, righe scartate, codici che la checklist non nomina.
- `catalogo-lib.mjs` — il lettore del CSV (`;`), dei ritmi scritti a parole ("ogni 2 settimane", "a ogni pulizia, lavato ogni mese"), del Quando e del Blocco.
- `importa-catalogo.mjs` — rapporto di prova su un CSV: `node strumenti/importa-catalogo.mjs catalogo/catalogo-governante-v4.csv --rapporto`.
- `unisci-catalogo.py` — l'unione fatta per la 0.26: il file di Michele (163 righe) + le 15 righe dalle foto (P01-P15) + i testi delle foto uniti a 14 righe → `catalogo-governante-v4.csv`. Si è usato una volta; resta per documentare cosa è stato unito.
