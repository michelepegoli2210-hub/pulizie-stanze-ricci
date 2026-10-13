# Catalogo della governante

Fonte unica delle regole della governante. Si carica da qui, non si ricostruisce dagli appunti.

## File
- `catalogo-governante.csv` — 163 regole, separatore `;`, prima riga = intestazioni, codifica UTF-8. Da qui si genera la parte "governante" di `regole.js`.
- `catalogo-governante.xlsx` — lo stesso catalogo più i fogli **Checklist signora** (le righe grandi del ripasso, della totale, delle cucine e del profilo Base), **Calendario vero** (giorni di passaggio reali delle signore), **Livelli e costi** (Igiene / Albergo / Lusso pieno) e **Legenda**.
- `mockup-signora.png` — schizzo della schermata della signora: una camera, una lista, un giorno.

## Colonne del CSV
| Colonna | Significato |
|---|---|
| ID | Codice fisso della regola (C = camera, B = bagno, K = cucina appartamenti, E = balcone, Z = zone comuni, L = lavanderia e attrezzi, M = meteo e stagioni, O = prospetto e ospiti). Le regole aggiunte dalle foto prendono ID `P01, P02…` |
| Posto | Camera = camere e stanze da letto degli appartamenti; Bagno = tutti i bagni; Cucina appartamenti = solo via Zara e via Trento; Balcone = dove c'è |
| Superficie / Regola | Una riga per ogni cosa fisica, nell'ordine del giro della stanza |
| Ogni quanto | Ritmo di partenza, scritto a parole |
| Quando | a ogni pulizia · ripasso · cambio completo · a ogni partenza · camera libera · giorno della zona · meteo · stagione |
| Priorità | 1 igiene (passa sempre per prima) · 2 lo vede l'ospite · 3 nascosto (slitta se il budget è finito) |
| Minuti | Tempo stimato: budget per passaggio e prezzo nel listino |
| **Blocco** | **Come va caricata la riga.** Pulizia normale = checklist del ripasso/totale, NON è una rifinitura, non entra nel budget, non si paga a parte · Dentro la totale = si fa nella totale come parte del lavoro · Pulizia normale + rotazione = la parte "a ogni pulizia" in checklist, la parte col ritmo lungo in rotazione · Rotazione = le vere rifiniture · Camera libera = solo a camera vuota · Giorno della zona · Meteo e stagione |
| **Profilo base** | Sì = vale anche negli appartamenti degli operai (via Zara 1° e 2°): igiene e protezione. No = solo nei posti con profilo Lusso. "—" = non è una regola per camera |
| Come si fa / Prodotto / Controllo | Testo per la signora (come si fa, prodotto) e per la controllatrice (controllo) |
| Note | Casi particolari, cose che fanno scattare la regola prima, rimandi a Lavori di manutenzione |

Copertura e Buchi del Tabellone si calcolano solo sui blocchi **Rotazione** e **Camera libera**.
