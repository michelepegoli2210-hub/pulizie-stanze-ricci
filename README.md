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

- **proprietario**: vede e cambia tutto (prospetto, pulizie, paghe, listino, note, utenti).
- **addetta**: vede solo la sua zona e i suoi soldi; può solo premere Fatta / Non fatta / Problema.
- **lettura**: vede tutto, non cambia niente.

Il ruolo si scrive nella raccolta `utenti` di Firestore, in un documento che ha come nome l'**UID** dell'account
(lo si copia da Authentication). Campi: `nome`, `ruolo`, `zona` (per le signore: `p1`, `p2` oppure `ap`).
