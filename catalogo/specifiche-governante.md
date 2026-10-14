# Specifiche della governante — fonte unica

**Rileggi questo file dopo ogni riavvio della memoria.** Qui stanno tutte le decisioni prese con Michele sulla governante, in ordine. Se un messaggio in chat manca, vale quello che c'è scritto qui. Le domande ancora aperte sono in fondo: Michele risponde con un numero, una alla volta.

Aggiornato: 14 ottobre 2026 (dopo la 0.34: via Zara è un appartamento solo, punto 12 chiuso; via Zara piano terra risposto al punto 9; **punti 13 e 14: paga a ore standard (8 € albergo, 10 € appartamenti), stelle di Selena per 27 € a settimana, controlli incrociati a 10 punti con recupero fino a sabato alle 14; tutto deciso, si costruisce la 0.35**).

---

## 1. Tre modi legati all'ospite (sostituiscono i livelli Igiene/Albergo/Lusso e i profili Lusso/Base)

- Il catalogo è uno solo. **Tutte le regole esistono in tutti i modi: cambia solo il ritmo.**
- Il modo segue **l'ospite che c'è in camera** (dal prospetto e dalla scheda cliente), non la camera. La stessa camera può essere in modo Tecnici dal lunedì al venerdì e in modo Booking nel weekend.
- Come si imposta: nella **scheda cliente** un campo "Tipo di ospite" con tre pulsanti grandi (Tecnici / Operai / Booking). Ogni soggiorno nel prospetto eredita il tipo del cliente; Michele può cambiarlo per quel soggiorno con lo stesso pulsante. Ditte già in rubrica: ferrovia = Tecnici; operai di via Zara = Operai; tutto quello che arriva da Booking, Airbnb o privati = Booking.
- I ritmi di ogni modo si cambiano con + e meno (un moltiplicatore per priorità, più l'eccezione cucina per Operai). I valori sotto sono quelli di partenza.

### Modo OPERAI (via Zara 1° e 2° piano: UN SOLO appartamento su due piani, non due; soggiorni lunghi, 3-4 persone, cucinano ogni giorno)
- Priorità 1 (igiene): ritmo pieno.
- Igiene della cucina (cappa, forno, bidoni, frigo, scarichi): **più spesso** del ritmo scritto.
- Priorità 2 (estetica): un terzo del ritmo, oppure alla partenza.
- Priorità 3 (nascosto): solo nella pulizia a fondo completa ogni 6 mesi.
- Stelle: **nessuna nel ripasso del lunedì**; nella totale del giovedì **fino a 2, solo di igiene**, dentro 25 minuti.

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
- Tetto delle stelle per tipo di passaggio: **2 in un ripasso, 3 in una totale, 5 in una totale a camera libera** (venerdì dei Tecnici: la camera resta vuota fino a lunedì, 45 minuti). Con 5 stelle il venerdì ogni superficie di una camera Tecnici viene fatta almeno una volta ogni 3 mesi; con 3 ci vogliono 4-5 mesi.
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

- Giovedì in via Zara 1° e 2°: chi preme "Fatto" e prende la paga? 1) la signora del 1° piano · 2) metà per una · 3) tutte e due per intero · 4) una per appartamento (1° piano → via Zara 1°, 2° piano → via Zara 2°). **Risposta: 4 (confermata il 13 ottobre: una per appartamento, 10 € a testa). Superata il 14 ottobre: è un appartamento solo, vedi il punto 12.**
- Materiali di Lella, Nicole, via Trento e via Zara piano terra (pavimento, porte, box doccia, mobili): Michele manda le foto.
- Via Zara piano terra: Tecnici o Booking come tipo di ospite abituale? **Risposta: 4 (14 ottobre): cambia ogni volta; la governante chiede nome per nome, come già fa. Senza risposta vale Tecnici d'inverno e Booking d'estate.**

## 10. Decisioni del 13 ottobre sera (dopo la 0.29.1)

- **Tetto delle stelle per tipo di passaggio**: ripasso 2, totale 3, totale a camera libera 5 (vedi punto 4). Il tetto lo decide il passaggio, poi il modo dell'ospite può solo abbassarlo (Operai: 0 nel ripasso, 2 di igiene nella totale).
- **Due numeri nel Tabellone, non uno.** "Copertura" resta quella severa (celle in regola col ritmo scritto). Accanto va aggiunto **"Giro completo"**: la percentuale di celle (posto × regola di Rotazione e Camera libera) fatte **almeno una volta negli ultimi 90 giorni**, e per ogni camera "superfici mai fatte da 90 giorni: N". È questo il numero che conta per Michele: tutto almeno una volta a trimestre, l'igiene al suo ritmo. L'ordine delle stelle resta "prima la più scaduta", che è quello che fa girare tutto.
- Il conto va mostrato con le due letture: "cosa spendo" (col tetto) e "cosa costerebbe tutto in regola", come già fa la 0.29.
- D'Agostino nel prospetto: Michele decide il tipo (Tecnici o Operai) con "Sempre per questo nome". **Risposta: Tecnici in albergo; Operai solo in via Zara 1° e 2° (chi è Tecnici altrove, lì conta come Operai).**
- Giovedì in via Zara: 1) una per appartamento, 10 € a testa · 2) tutte e due in tutti e due, 20 € a signora · 3) insieme, paga solo a chi preme Fatto. **Risposta: 1. Superata il 14 ottobre dal punto 12 (un appartamento solo): tutte e due insieme, 10 € a testa, ognuna sul proprio piano.**

## 11. La chat con la governante (decisa il 13 ottobre sera): una collaboratrice che fa domande

Principio: quando alla governante manca un'informazione, o succede qualcosa (meteo, camera libera, problema, budget), **è lei a chiedere a Michele**, una cosa alla volta, con le risposte già scritte su pulsanti grandi. Michele non deve più andare a cercare le impostazioni: risponde ai tocchi. Funziona al 100% senza intelligenza artificiale (è una lista di domande generate dalle regole); l'IA a voce (Gemini, se e quando Michele dirà sì) si aggiunge sopra solo per capire le frasi libere.

### Dove sta
- In "Oggi", in cima, una card **"La governante ti chiede"** con il numero di domande aperte (pallino rosso solo se ce n'è una urgente). Si apre come una chat: ogni domanda è un messaggio della governante con 2-4 pulsanti grandi e un pulsante piccolo "Dimmelo a parole" (testo o dettatura dalla tastiera). Sotto ogni domanda, dopo la risposta, una riga "Fatto: …" che dice cosa ha cambiato.
- Massimo **3 domande al giorno**, le più importanti prima; il resto aspetta. Le domande arrivano in due momenti: alle 8 (per la giornata) e alle 13 (col report del giorno). Un'urgenza (problema grave, camera che si libera all'improvviso) passa subito.
- Ogni risposta **fa davvero qualcosa** nell'app (cambia il tipo di ospite, scrive il messaggio alle signore, mette le stelle, sposta un lavoro) e lo dice.

### Quando chiede (le prime regole di domanda; se ne aggiungono con lo stesso schema)
1. **Nome nuovo nel prospetto senza tipo di ospite** → "D'Agostino: chi sono? [Tecnici] [Operai] [Booking]" → imposta il tipo "sempre per questo nome".
2. **Ha piovuto / vento forte** (per ora dal tocco in Regole, poi dal meteo) → "Ha piovuto. Domani mando alle signore: 'tappeti e zerbini a posto, vetri esterni e balconi' e metto le stelle? [Sì, manda] [Solo le stelle] [No]" → scrive il messaggio del giorno e lo propone su WhatsApp con un tasto "Manda".
3. **Freddo in arrivo / caldo** → "Arriva il freddo: coperte sui letti occupati da venerdì? [Sì] [Più avanti]".
4. **Camera libera 2 giorni o più** → "Alba è libera fino a giovedì: la facciamo a fondo (3 ore, 40 €)? [Sì] [Solo le stelle in ritardo] [No]".
5. **Report delle 13**: una camera non controllata da 2 settimane, una rifinitura "Non riesco" 2 volte di fila, una signora sotto il 90% di affidabilità → "Aurora non è controllata da 2 settimane: [Fallo controllare sabato] [Lo controllo io] [Lascia stare]".
6. **Manca un prodotto** (dal "Non riesco: manca il prodotto") → "Manca l'antimuffa al 2° piano: [Lo compro io] [Lo porta pap&agrave;] [Salta questa settimana]" → aggiorna la lista della spesa.
7. **Budget quasi finito** → "Questo mese le stelle sono a 230 € su 250: [Freno sul nascosto] [Lascio andare] [Alzo il budget]".
8. **Lavoro di manutenzione fermo da 7 giorni** → "La doccia di Tramonto è segnalata da 9 giorni: [Chiamo l'idraulico, segna 'chiamato'] [È sistemata] [Aspetta ancora]".
9. **Una regola in ritardo in molte camere** → "Dietro la TV non si fa da 6 settimane in 5 camere: [Più stelle il venerdì] [Va bene così] [Spegni la regola]".
10. **Prima di una partenza Booking** → "Domani parte la coppia di Alba e sabato arriva un'altra: controllo di lusso e coprimaterasso già messi; vuoi aggiungere qualcosa? [No] [Dimmelo a parole]".
11. **Ogni sabato alle 13**: il conto delle paghe e la pagella del pulito, con una sola domanda: "Pago così? [Sì] [Guardo prima]".

### Impara
- Se Michele risponde allo stesso modo 2 volte alla stessa domanda, la governante chiede: "La prossima volta lo faccio da sola? [Sì] [No, chiedimelo sempre]". Con Sì, quella domanda diventa una regola automatica (si vede in Regole, si spegne con un tocco).

### Cosa NON fa
- Non chiede cose che può decidere da sola col catalogo e col calendario. Non chiede due volte la stessa cosa nella stessa settimana. Non usa parole tecniche. Non manda niente alle signore senza il tasto "Manda" di Michele (finché l'Automatico è spento).

### Meteo automatico
- I servizi meteo gratuiti sono per uso non commerciale; per un'attività serve un piano piccolo a pagamento o si resta al tocco a mano ("Ha piovuto", "Arriva il freddo"), che è una cosa da 2 secondi. Per ora a mano; la domanda 2 e 3 partono dal tocco.

### Ritocchi del 13 ottobre sera (dopo la 0.32, fatti nella 0.33)
- **Budget delle stelle del mese: 400 €** (Regole → Due soglie piccole). L'avviso "budget quasi finito" arriva al 90%, cioè solo quando si sfora davvero (i conti dicono 306 € un mese d'inverno, 310 € d'estate).
- **Mai "da sola" per paghe, budget, manutenzione e regole**: su queste la governante chiede sempre; "la prossima volta lo faccio da sola?" vale per le altre.
- **Regole senza prodotto (Prodotto = "nessuno", es. Soffitto e angoli: asta e panno).** Sul telefono della signora il tasto non dice "Manca il prodotto" ma **"Manca l'attrezzo"**, e la risposta va a lei: "Qui non serve un prodotto: si fa con l'asta telescopica e un panno. Gli attrezzi stanno in lavanderia", con "Va bene, la faccio" (niente segnato) o "Non riesco lo stesso". Per queste righe **niente domanda nella chat di Michele** e niente lista della spesa.
- **Dopo l'orario delle signore (dalle 14 in poi) niente proposte per "oggi"**: la pulizia a fondo, i lavori a parte e i consigli vanno al prossimo giorno di passaggio di quella camera (il primo giorno libero che è anche un giorno della signora in quella camera; se no il primo feriale), mai a oggi.
- **Domande a elenco, una schermata sola, un tocco per riga**: quando la stessa domanda vale per più nomi ("chi sono?" per tutti i nomi senza tipo di ospite) o per più lavori di manutenzione fermi, la chat le mostra in un unico messaggio con l'elenco e i pulsanti per riga (tre per nome: Tecnici · Operai · Booking; tre per lavoro: Chiamato · Sistemato · Aspetta). **Non contano nelle 3 domande del giorno.**

## 12. Correzione del 13 ottobre sera: via Zara è un appartamento solo

- Via Zara 1° piano e 2° piano sono **lo stesso appartamento**, su due piani: un posto solo nell'app ("Via Zara · 1° e 2° piano"), una pulizia, una paga, un Tabellone. La "camera" separata "Via Zara · 2° piano" creata nella 0.28 va tolta e le sue celle unite. Via Zara piano terra resta un posto a parte.
- Nella lista della signora, il piano di sopra è un blocco in più ("Piano di sopra: camere e bagno"), non una camera a parte.
- Il giovedì in via Zara: **tutte e due le signore insieme, 10 € a testa, ognuna preme Fatto sul proprio piano** (risposta 2 di Michele, 14 ottobre). La Signora 1° piano fa il piano di sotto, con le stelle (fino a 2 di igiene, modo Operai); la Signora 2° piano fa il piano di sopra, senza stelle. Il lunedì il ripasso resta alla Signora 1° piano, 15 €. Fatto nella 0.34.
- In Paghe, in cima, "Il conto dal prospetto": "Pulizie: … € + stelle: … € = … €" per la settimana e per il mese, coi lavori a parte (consigli accettati, pulizie a fondo, extra) su una riga sotto. Fatto nella 0.34.

## 13. Le paghe vere e il budget (14 ottobre): si spende troppo

- Michele vuole **ridimensionare di molto il budget delle pulizie**. Oggi le ragazze prendono circa **90–100 € a testa a settimana**.
- Lucia (Signora 1° piano; prima faceva solo gli appartamenti, l'ultima settimana anche l'albergo), ore fatte per settimana:
  - via Trento 3 · via Zara 3.30 · 1°/2° piano 2.30 (= 9 ore)
  - via Trento 2.30 · piano terra 1.15 · 1°/2° piano 4 · Lella 0.30 (= 8 ore e un quarto)
  - piano terra 2 · 1°/2° piano 4 · via Trento 2.30 · albergo 2.30 · Nicole 2 (= 13 ore)
  - in 3 settimane circa 300 € (≈ 10 € l'ora).
- L'altra signora: ripasso 1 ora, 2 al massimo; venerdì circa 3 ore; sabato circa 3 ore.
- Il conto dell'app col listino di adesso, settimana 12–18 ottobre: pulizie 232 € + stelle 57 € = 289 €, più 284 € di lavori a parte accettati dai consigli = 573 €. Nella realtà si pagano circa 200 € a settimana. Quindi le pulizie normali dell'app sono più o meno in linea (un po' sopra), mentre **le stelle (≈ 250 € al mese) e i consigli accettati sono tutta spesa in più** che prima non c'era. Il budget stelle di 400 € al mese (punto 11) va rivisto molto al ribasso.
- Le ore vere servono anche a tarare i minuti dell'app: via Zara 1° e 2° (lunedì + giovedì) 3.30–4 ore, via Trento 2.30–3, piano terra 1.15–2: molto più dei minuti stimati dal catalogo.
- Oggi Michele paga **10 € l'ora** e continua così finché l'app non è pronta. Le 13 ore di Lucia erano una settimana particolare (cambio di operai: via Zara 1° e 2° circa 4 volte); una settimana normale sua sta sulle 8–9 ore.
- Le stelle, così come sono (prezzo a stella, 400 € al mese), **costano troppo: Michele non se le può permettere**.
- **Decisione del 14 ottobre: si paga a mansione (a blocco della lista), non a ore e non a camera.** Motivi di Michele: paga il lavoro fatto davvero e non il tempo (a ore viene fregato: caffè alla macchinetta, ore gonfiate), e la qualità la controlla col controllo incrociato. Il letto si paga a letto usato; nel cambio si cambiano tutti i letti usati e gli asciugamani; nel ripasso si lavano anche i pavimenti, corridoio e un po' di scale. Se il sistema non regge si torna alla tariffa oraria.
- **Le due signore (settimana vera del 12–18 ottobre).** Selena = Signora 2° piano: 85 € per 8 ore e mezza. Lucia = Signora 1° piano + tutti gli appartamenti: 105 € per 10 ore e mezza–11: lunedì ripasso via Trento 1 ora e via Zara 1° e 2° 1 ora; giovedì cambio via Trento 2 ore; venerdì Salvatore, Aurora, Michele, Antonio 3 ore–3 e mezza; sabato via Zara piano terra cambio 1 ora e mezza e Nicole cambio 1 ora e mezza. Da aggiungere il terrazzo, mezz'ora ciascuna. Nicole è grande, con cucina non usata: un'ora basta. Via Trento è molto grande e deve essere sempre molto pulito. Bagni: via Zara piano terra 1, via Zara 1° e 2° 2. Selena negli appartamenti non va mai: Lucia ci va con la macchina e porta detersivi, biancheria sporca e pulita, immondizia (lavoro che altrimenti farebbe Michele). Lucia è più brava e più svelta; Selena (con Michele da quasi 4 anni) va seguita.
- **Strada fatta il 14 ottobre notte:** prima "a blocchi" (prezzo per Letto, Bagno, Camera, Pavimenti), poi Michele l'ha scartata: "ci complichiamo la vita, le paghiamo di più e loro capiscono che prendono poco". Il lavoro normale si paga **a ore standard** (vedi punto 14).
- **Deciso il 15 ottobre, notte (Michele: "va benissimo così tutto, implementa"). Il sistema finale è al punto 14.**

## 14. Il sistema deciso (14–15 ottobre, notte): ore standard, stelle di Selena, controlli a punti

Michele: "va benissimo così tutto, implementa tutto, a prova di mia nonna". Spesa accettata: circa 207 € a settimana (oggi 190).

### La paga del lavoro normale: ore standard, non cronometro
- **8 € l'ora in albergo e in via Nazario Sauro (Lella e Nicole comprese, chiunque le faccia); 10 € l'ora in tutti gli appartamenti** (Lucia ci va con la macchina, porta detersivi, biancheria e immondizia).
- Le ore sono **quelle standard decise da Michele**, non il tempo misurato: il venerdì al 1° piano vale 3 ore e un quarto, 26 €, sia che si finisca in 3 sia in 4. Nell'app la signora vede "Venerdì · 1° piano · 4 camere · 3 ore e un quarto · 26 €": niente prezzi a pezzi, niente blocchi pagati (i blocchi restano solo per leggere la lista).
- Ore standard (Michele, settimana vera): **Selena** (Signora 2° piano) mercoledì ripasso 2° piano 2 ore (16 €), venerdì cambio 2° piano 3 ore (24 €), sabato 3 ore (24 €), terrazzo mezz'ora (4 €) = 8 ore e mezza, **68 €**. **Lucia** (Signora 1° piano + appartamenti) lunedì ripasso via Trento 1 ora (10 €) e via Zara 1° e 2° 1 ora (10 €), giovedì cambio via Trento 2 ore (20 €), venerdì 1° piano Salvatore-Aurora-Michele-Antonio 3 ore e un quarto (26 €), sabato via Zara piano terra cambio 1 ora e mezza (15 €) e Nicole cambio 1 ora e mezza (12 €), terrazzo mezz'ora (4 €) = **97 €** (42 albergo + 55 appartamenti).
- Per camera (serve per i tagli dei controlli): camera dell'albergo ripasso 30 minuti (4 €), cambio 45–49 minuti (6–6,50 €); Nicole cambio 90 minuti (12 €); Lella cambio 40 minuti (5,50 €), ripasso 20 (2,50 €); via Trento ripasso 60 (10 €), cambio 120 (20 €); via Zara 1° e 2° ripasso 60 (10 €), cambio 120 (20 €); via Zara piano terra cambio 90 (15 €), ripasso 60 (10 €). L'orario di base (giorni, lavori, minuti, tariffe) sta in Regole e Michele lo cambia quando vuole.
- **Da confermare con Michele (assunzioni della 0.35):** il cambio del giovedì in via Zara 1° e 2° non era nella lista di Lucia: nella 0.35 lo fa **Lucia da sola, 2 ore, 20 €** (Selena negli appartamenti non va mai); le 3 ore del sabato di Selena sono scritte come "scale, ingresso, corridoi, lavanderia e ripassi del 2° piano"; Lella sta con Lucia il venerdì quando è occupata (5,50 €). Con il giovedì di via Zara, Lucia arriva a 117 € + 10 di controlli = 127, non 107.

### Le stelle: solo Selena, 27 € a settimana
- Le stelle (rifiniture del catalogo) le fa **solo Selena**, in tutto l'albergo: 2° piano, 1° piano, Lella, Nicole. Lucia in albergo non ha stelle; negli appartamenti le stelle sono spente (Michele può accenderle).
- Ogni lunedì la governante prepara la lista della settimana di Selena per **27 €** (obiettivo in Regole; 32 se Selena non controlla), scegliendo le superfici più in ritardo (prima l'igiene, poi il resto), divise nei suoi giorni e preferendo le camere che pulisce quel giorno; le altre camere nei giorni in cui sono vuote. **Oltre l'obiettivo la governante non propone nulla.** Niente lusso: cose di mantenimento, "la governante sa cosa mettere".
- Prezzo a stella per minuti: fino a 5′ 1 €, fino a 10′ 1,50 €, oltre 2,50 € (10 € l'ora). Selena così arriva a 68 + 27 + 5 di controlli = **100 €**.
- Il lunedì alle 8 la chat chiede a Michele: "Le stelle di Selena questa settimana, 27 €: … [Va bene] [Cambia]".

### I controlli incrociati: 10 punti sì/no, il voto lo fa l'app
- **Lucia controlla Selena**: 4 a settimana, 2,50 € l'uno (10 €): venerdì 2 camere tra le 4 del cambio, sabato 2 cose tra quelle del sabato (preferendo dove ci sono stelle). **Selena controlla Lucia**: 2 a settimana, 2,50 € l'uno (5 €): venerdì 1 camera del 1° piano, sabato Nicole. Mai negli appartamenti (lì controlla Michele). Le camere le sceglie l'app **a sorte la mattina stessa**, e lo dice solo alla controllatrice.
- **La lista del controllo, uguale per tutte le camere (sì o no, foto obbligatoria su ogni no):** 1 Letto: biancheria tesa, senza capelli né macchie; nel cambio lenzuola pulite davvero. 2 WC pulito dentro, sotto il bordo e fuori, senza odore. 3 Lavandino, rubinetti e specchio senza aloni e schizzi. 4 Doccia: niente capelli nella piletta, niente calcare su vetro e piastrelle. 5 Asciugamani puliti e nel numero giusto, carta igienica e sapone al posto loro. 6 Cestini vuoti col sacchetto nuovo, camera e bagno. 7 Superfici senza polvere (comodini, scrivania, TV, mensole: si passa il dito). 8 Pavimento lavato, niente briciole o capelli negli angoli e sotto il letto. 9 Davanzale e vetro senza impronte evidenti, balcone spazzato dove c'è. 10 Le richieste del giorno di Michele eseguite. **Gravi (valgono doppio): 1, 2, 4, 6.**
- **Il voto lo fa l'app:** ogni no 1 punto, i gravi 2. **0 punti = Bene** (tutto pagato) · **1–2 = Così così** (quella camera −20%) · **3 o più = Male** (quella camera −50% e richiamo scritto; al terzo Male nel mese la chat chiede a Michele che fare). La camera vale la sua quota di ore standard (es. venerdì 2° piano 24 €/4 = 6 € a camera: Così così −1,20, Male −3).
- **Le stelle si controllano uguale:** nella camera controllata, sotto i 10 punti, le stelle che Selena ha segnato fatte, ognuna con la riga del catalogo "com'è fatta bene", pulsanti Fatta / Non fatta (foto sul no). Stella non fatta: non pagata e tolta una seconda volta (costa il doppio) e torna tra le cose da fare.
- **Recupero fino a sabato alle 14:** ogni no compare alla signora in cima al telefono ("Da rifare entro sabato alle 14: Fenicotteri, lavandino con aloni (foto)"); lei rifà, preme Rifatto e manda la foto: il taglio sparisce e la stella si paga; resta scritto nella pagella (al terzo rifacimento nel mese la governante lo dice a Michele). Dopo sabato alle 14 la settimana si chiude, i tagli diventano definitivi e la paga esce ("Pago così?" alle 14).
- **Michele sopra tutte e due:** vede ogni controllo con le foto; "La controllo io" rifà il controllo e vale il suo; se trova un Bene che non lo era, chi ha controllato perde i 2,50 di quella camera; alla terza volta nel mese i suoi controlli si fermano per un mese (la chat lo chiede). Il mercoledì (Lucia non c'è) la governante ricorda a Michele di guardare una camera di Selena.
- **Pagella del sabato** per ognuna: camere controllate, Bene/Così così/Male, stelle confermate e non, rifacimenti, controlli fatti e soldi dei controlli. Niente più voti da 1 a 10 né bonus 120%.

### La governante che chiede (collaborazione settimanale)
- Domenica sera: "Settimana prossima: Selena mercoledì, venerdì e sabato; Lucia lunedì, giovedì, venerdì e sabato, come sempre? [Sì] [Cambia]" (con due Sì smette di chiedere e lo dice soltanto).
- Lunedì 8: le stelle di Selena della settimana. Quando il prospetto cambia le ore di un giorno: "Venerdì Selena ha 3 camere, 2 ore e un quarto, 18 €". Sabato 14: "Pago così?" con le due paghe già fatte.
- Tutto a prova di nonna: pulsanti grandi, disegnini per i 10 punti, sì/no, foto con un tocco. Niente messaggi alle signore finché Michele non vede la 0.35.
