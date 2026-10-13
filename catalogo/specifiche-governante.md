# Specifiche della governante — fonte unica

**Rileggi questo file dopo ogni riavvio della memoria.** Qui stanno tutte le decisioni prese con Michele sulla governante, in ordine. Se un messaggio in chat manca, vale quello che c'è scritto qui. Le domande ancora aperte sono in fondo: Michele risponde con un numero, una alla volta.

Aggiornato: 13 ottobre 2026.

---

## 1. Tre modi legati all'ospite (sostituiscono i livelli Igiene/Albergo/Lusso e i profili Lusso/Base)

- Il catalogo è uno solo. **Tutte le regole esistono in tutti i modi: cambia solo il ritmo.**
- Il modo segue **l'ospite che c'è in camera** (dal prospetto e dalla scheda cliente), non la camera. La stessa camera può essere in modo Tecnici dal lunedì al venerdì e in modo Booking nel weekend.
- Come si imposta: nella **scheda cliente** un campo "Tipo di ospite" con tre pulsanti grandi (Tecnici / Operai / Booking). Ogni soggiorno nel prospetto eredita il tipo del cliente; Michele può cambiarlo per quel soggiorno con lo stesso pulsante. Ditte già in rubrica: ferrovia = Tecnici; operai di via Zara = Operai; tutto quello che arriva da Booking, Airbnb o privati = Booking.
- I ritmi di ogni modo si cambiano con + e meno (un moltiplicatore per priorità, più l'eccezione cucina per Operai). I valori sotto sono quelli di partenza.

### Modo OPERAI (via Zara 1° e 2°: soggiorni lunghi, 3-4 persone, cucinano ogni giorno)
- Priorità 1 (igiene): ritmo pieno.
- Igiene della cucina (cappa, forno, bidoni, frigo, scarichi): **più spesso** del ritmo scritto.
- Priorità 2 (estetica): un terzo del ritmo, oppure alla partenza.
- Priorità 3 (nascosto): solo nella pulizia a fondo completa ogni 6 mesi.
- Stelle: nessuna nel ripasso; **una sola, di igiene,** nella totale del giovedì.
- Budget: 25 minuti il giovedì, 10 il lunedì.

### Modo TECNICI (stesse persone per mesi, camera vuota nel weekend, la ditta paga a notte e non scrive recensioni)
- Priorità 1: ritmo pieno.
- Priorità 2: metà ritmo (ogni 2 settimane → ogni mese).
- Priorità 3: metà ritmo.
- Le cose "a camera libera" nel venerdì (camera vuota fino a lunedì).
- Coprimaterasso ogni 2-3 settimane invece che a ogni partenza; asciugamani doppi.
- Budget: 15 minuti nel ripasso, 45 nella totale del venerdì a camera libera.

### Modo BOOKING (weekend e soggiorni corti, ospiti privati che scrivono recensioni)
- Tutto a ritmo pieno.
- A ogni partenza: controllo di lusso, coprimaterasso e copricuscini, tutto il visibile a posto.
- Le stelle vanno **prima su quello che l'ospite vede e tocca** (vetri, specchi, odori, bagno, punti di contatto).
- Budget: 30 minuti nella totale di partenza.
- Cambio d'aria e letto rifatto anche se la camera è rimasta ferma 2 giorni prima dell'arrivo.
- D'estate: soggiorni più lunghi di 4 notti hanno un **ripasso al 4° giorno** e il cambio degli asciugamani ogni 3 notti (non solo la totale alla partenza).

### Dove si vede
- Card della governante: tre riquadri grandi con il conto della settimana e del mese calcolato dal prospetto ("Questa settimana: 9 camere Tecnici, 2 Operai, 3 partenze Booking · stelle: … €") e, sotto, il costo di un modo per camera a settimana.
- Telefono della signora: sulla targa della camera, accanto a Ripasso/Totale, una scritta piccola con il tipo di ospite (Tecnici · Operai · Ospiti Booking). Nessuna altra parola nuova.
- Tabellone: copertura e buchi calcolati col modo che la camera ha in quel giorno.

## 2. Le stagioni

- **Inverno (ottobre–maggio):** calendario vero coi giorni fissi (lunedì, mercoledì, giovedì, venerdì, sabato), due signore. Vedi il foglio "Calendario vero" dell'Excel e il file del calendario nel generatore.
- **Estate (1 giugno – 31 agosto):** niente giorni fissi. Le pulizie seguono arrivi e partenze del prospetto (comprese le prenotazioni dal channel manager, acceso solo in quei mesi). Stelle sulle pulizie di partenza: 1-2 a partenza, prima il visibile. Il passaggio da un regime all'altro avviene da solo dalle date; in Regole → "Le stagioni" tre tasti: Automatico · Estate da oggi · Inverno da oggi.
- Il modo Booking lavora quasi solo d'estate (giugno, luglio, soprattutto agosto), più qualche giorno a Pasqua e Natale. Pasqua e Natale non hanno niente di speciale: sono soggiorni di tipo Booking.
- **Due finestre di reset all'anno**, lavori a camera libera proposti nei Consigli (una camera per signora al giorno, nei giorni liberi del prospetto, senza il limite delle due a settimana):
  - M07 "Pronti al caldo", 15 maggio – 5 giugno, su tutte le 13 camere.
  - M08 "Chiusura della stagione estiva", 1–20 settembre: pulizia a fondo completa, materassi girati, tende lavate, filtri e sanificazione dei condizionatori, balconi a fondo.
- Il conto va mostrato **per stagione** (un mese d'inverno, un mese d'estate) e come totale dell'anno, mai come media.
- Tabellone e copertura si calcolano col regime del momento: d'inverno sui giorni fissi, d'estate sulle partenze.

## 3. Il catalogo e i blocchi

- Fonte: `catalogo/catalogo-governante-v4.csv` (178 righe: 163 del file di Michele + 15 dalle foto P01–P15). `catalogo.js` si genera da lì con `strumenti/genera-catalogo.mjs`.
- La colonna **Blocco** dice come va caricata ogni riga:
  - *Pulizia normale* = checklist del ripasso e della totale. Non è una rifinitura, non entra nel budget, non si paga a parte: è il lavoro da 5 e 10 euro.
  - *Dentro la totale* = si fa nella totale come parte del lavoro.
  - *Pulizia normale + rotazione* = la parte "a ogni pulizia" nella checklist, la parte col ritmo lungo in rotazione.
  - *Rotazione* = le vere rifiniture (le stelle).
  - *Camera libera* = solo a camera vuota.
  - *Giorno della zona* = corridoi, scale, lavanderia, magazzino nel loro giorno.
  - *Meteo e stagione* = scattano da sole (per ora col tocco di Michele, vedi punto 6).
- Copertura e buchi del Tabellone si calcolano solo sui blocchi Rotazione e Camera libera.
- Una totale vera con dentro le settimanali dura 60-70 minuti, non 40: deve risultare nel conto delle paghe.
- La Mappa delle superfici dice "Superfici scoperte"; "Buchi" è solo del Tabellone.

## 4. La schermata della signora: una camera, una lista, un giorno

- Una sola lista nell'ordine in cui si gira la stanza, con dentro tutto: la pulizia di oggi (ripasso o totale) e le stelle del giorno. Schizzo: `catalogo/mockup-signora.png`.
- Dall'alto: targa della camera (tipo di pulizia, minuti, chi c'è dentro, tipo di ospite); "Oggi Michele dice"; la lista "Cosa si fa"; "Sempre in questa camera" (istruzioni fisse del cliente); tasto grande FATTO, TUTTO; sotto, piccoli, "Non riesco a fare una cosa" (riga + perché con un tocco: manca il prodotto / c'è l'ospite / non c'è tempo; la stella torna un'altra volta) e "C'è un problema".
- **A blocchi, non in due schermate.** La totale (25 righe) è raggruppata in 5 blocchi con titolo grande: Letto e biancheria · Bagno · Camera · Pavimenti e controllo finale · Alla partenza. Il ripasso (12 righe) in 4 blocchi: Letto · Bagno · Camera · Pavimenti. **Ogni blocco ha un solo tasto "Fatto"**: le righe dentro si leggono, non si toccano una per una. **Le stelle si toccano singolarmente**, al loro posto nella lista. FATTO, TUTTO con un blocco non toccato chiede "Questo l'hai fatto?" per blocco.
- Massimo **3 stelle in una totale, 2 in un ripasso**.
- Parole vietate sul telefono delle signore: governante, catalogo, regole, rotazione, extra, rivista. La governante, il Tabellone, i Consigli, le Regole, i Materiali e il "Rivedi con la mamma" stanno solo dalla parte dei proprietari.
- "Le mie camere" mostra solo le camere di oggi secondo il calendario (o le partenze, d'estate), col tipo di pulizia sulla targa.
- Paga: le righe numerate sono dentro il prezzo della camera; ogni stella ha il suo prezzo dal listino e si somma ("Alba · Pulizia totale 15 € + 2 stelle 3 €").

## 5. Prezzo delle stelle

- Nel listino il prezzo di una stella è modificabile da Michele per fascia di minuti: fino a 5 min, fino a 10, oltre 10. Partenza: 1 € / 2 € / 3 €. Il conto del mese si aggiorna subito quando cambia.

## 6. Meteo

- Per ora a mano: in Regole due tasti grandi, "Ha piovuto / vento forte" e "Arriva il freddo / arriva il caldo", che fanno scattare le regole meteo come se fossero le previsioni. Automatico più avanti.

## 7. Materiali e manutenzione (già fatti nella 0.25.1)

- "Materiali dei posti" con pavimento, box doccia, porte e **mobili** (laminato di finto legno: panno strizzato, mai bagnato, bordi asciugati subito, niente abrasivi, vapore, acetone). La signora legge la riga "Qui: …".
- "Rivedi con la mamma" sta in fondo a Regole, come opzione: non è un compito.
- I 5 lavori dalle foto sono nei Lavori di manutenzione (vasi sopra le unità esterne, silicone di lavabo e WC, termosifone in ghisa, ringhiera e rete, adesivo sulla porta di Salvatore).

## 8. Cosa riportare a Michele dopo ogni versione

- Due righe su cosa provare.
- Il conto per stagione e per modo (un mese d'inverno, un mese d'estate, anno).
- Copertura e buchi del Tabellone col regime del momento.
- Le domande aperte, **una alla volta, con le risposte numerate**.

## 9. Domande aperte (Michele risponde con un numero)

- Giovedì in via Zara 1° e 2°: chi preme "Fatto" e prende la paga? 1) la signora del 1° piano · 2) metà per una · 3) tutte e due per intero · 4) una per appartamento (1° piano → via Zara 1°, 2° piano → via Zara 2°). **Risposta: …**
- Materiali di Lella, Nicole, via Trento e via Zara piano terra (pavimento, porte, box doccia, mobili): Michele manda le foto.
- Via Zara piano terra: Tecnici o Booking come tipo di ospite abituale? **Risposta: …**
