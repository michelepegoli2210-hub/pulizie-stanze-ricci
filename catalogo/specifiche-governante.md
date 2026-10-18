# Specifiche della governante — fonte unica

**Rileggi questo file dopo ogni riavvio della memoria.** Qui stanno tutte le decisioni prese con Michele sulla governante, in ordine. Se un messaggio in chat manca, vale quello che c'è scritto qui. Le domande ancora aperte sono in fondo: Michele risponde con un numero, una alla volta.

Aggiornato: 15 ottobre 2026 (**la 0.35 è costruita e online**: punti 13 e 14 fatti; in fondo al punto 14 le assunzioni da confermare).

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

### Costruito nella 0.35 (15 ottobre, notte) — da confermare con Michele
- Tutto il punto 14 è nell'app (vedi README, voce 0.35). Assunzioni mie, da confermare con un numero: (a) **il cambio del giovedì in via Zara 1° e 2° lo fa Lucia da sola, 2 ore, 20 €** (non era nella sua lista; Selena negli appartamenti non va); (b) **le 3 ore del sabato di Selena** sono "scale, ingresso, corridoi e lavanderia" (si cambia in Paghe → Orario di base); (c) **Lella** sta con chi ha il passaggio nel calendario (ripasso 20′ = 2,50 €, cambio 40′ = 5,50 €); (d) i controlli di Lucia il **sabato** sono 2 tra le cose fatte da Selena il venerdì e il sabato; (e) la **stella non fatta** costa il doppio (non pagata + lo stesso importo tolto), come detto in chat; (f) il **giro "Altre camere"** di Selena prende al massimo 2 stelle per camera e 8 al giorno, mai nelle camere con ospiti Booking dentro.
- Non ancora fatto: l'avviso "venerdì Selena ha 3 camere invece di 4" quando il prospetto cambia le ore (si vede comunque nel conto); le foto dei materiali; il meteo automatico.

## 15. La 0.36 (16 ottobre): cronometro, due signore coi nomi, si parla con la governante

- **Cronometro.** La signora vede il tempo che passa mentre pulisce; l'app salva quanto ci ha messo davvero. In Paghe → Orario di base, "I tempi veri": tempo standard accanto al tempo vero di ogni posto, e un tasto per tarare il listino. Interruttore "Cosa pago": **ore standard** (come adesso) o **tempo vero del cronometro**. Michele decide: con le ore standard chi va piano non guadagna di più; col tempo vero si pagano anche le pause.
- **Le signore sono due, coi loro nomi: Lucia (1° piano + appartamenti) e Selena (2° piano).** "Appartamenti" non è una persona. In Paghe → "Le signore" si rinomina, si mette "non lavora" e si **aggiunge una collaboratrice** (le camere che le segni diventano sue: lista, paga e controlli).
- **Si parla con la governante** (scritto o dettato col microfono della tastiera), botta e risposta, con la donnina che si muove. Capisce senza IA: le parole del catalogo, i posti e pochi verbi. Fa solo dopo il "Sì". Sa: segnare una cosa come fatta, farla fare come lavoro a parte (col prezzo), toglierla dalla settimana o spegnerla, scrivere alle signore, e rispondere a "quando è stata fatta", "quanto prende Lucia", "chi pulisce domani". Se è ambiguo chiede "quale?"; se manca il posto chiede "dove?".
- **Da dire alla governante** (stato del 16 ottobre, Michele): "ho messo i piumoni" → in tutte; "ho pulito i filtri dei condizionatori del primo piano" → solo quelle camere. Il resto dei lavori extra è ancora da fare.
- Resta da decidere: paga sulle ore standard o sul tempo vero (punto 13); la voce vera senza tastiera.

## 16. La 0.37 (16 ottobre): paga a minuto e governante viva

- **Paga a minuto (cronometro).** Michele: "sarebbe utile fare un timer, pagare proprio a minuto". Fatto: si sceglie in Paghe → Orario di base tra **ore standard** e **a minuto**. A minuto si paga il tempo misurato da "Inizia" a "Fatto": 8 € l'ora = 0,13 € al minuto in albergo, 10 € l'ora = 0,17 € negli appartamenti. Due reti contro il "premere prima o dopo": **tetto** (oltre il tempo standard + 25% non si paga) e **tempi strani** (sotto il 40% dello standard o oltre il tetto la pulizia finisce in una lista che Michele guarda). La signora vede i soldi salire mentre pulisce. In Orario di base c'è il confronto sui numeri veri: "ore standard X, a minuto Y".
- **Ancora da decidere (punto 13):** ore standard o a minuto. Adesso è su ore standard; si cambia con un tocco.
- **La governante viva.** In cima alla chat c'è lei, grande: respira, sbatte le palpebre e ha l'umore della casa ("Tutto pulito per oggi", "Ci sono 2 problemi", "Ho una cosa da chiederti"). Colore dei capelli scegliibile per ogni signora (Selena è bionda).
- **L'intelligenza artificiale vera (deciso dopo).** Michele la vuole: "deve parlarmi, suggerire, essere un tamagotchi". Fatti trovati il 16 ottobre sulle pagine ufficiali di Google: nel piano **gratuito** dell'API Gemini "Content used to improve our products" = Sì, e i termini dicono che revisori umani possono leggere input e output, con l'avviso in grassetto di non mandare informazioni personali o riservate; inoltre i termini dicono che per gli utenti nello Spazio economico europeo (Italia compresa) si devono usare i servizi a pagamento. Quindi il gratuito non va bene coi nomi degli ospiti e delle signore. Il piano a pagamento non usa i dati per addestrare: con Gemini 3.5 Flash-Lite costa 0,30 $ per milione di parole in ingresso e 2,50 $ in uscita, cioè **circa 1-2 € al mese** per l'uso di Michele. Serve una carta su Google e una chiave; la chiave va tenuta nelle impostazioni (solo proprietario), non nel codice.

## 17. La 0.38 (16 ottobre): la governante con un'intelligenza artificiale vera

Michele: *"devi assolutamente implementare un'IA molto intelligente e la governante si deve muovere bene e mi deve dare consigli, si deve muovere la faccia pure; trovami la migliore IA da implementare per farmi gestire l'albergo."*

### Quale IA (confronto vero, prezzi del 16 ottobre 2026, dalle pagine ufficiali)

| Chi | Modello piccolo | Entrata (1 milione di parole) | Uscita | Usa i tuoi dati per imparare? | Serve la carta? |
|---|---|---|---|---|---|
| **Google Gemini** | gemini-3.5-flash-lite | 0,30 $ | 2,50 $ | **Sì nel piano gratuito** (revisori umani possono leggere); no nel piano a pagamento. I termini chiedono il piano a pagamento per gli utenti nello Spazio economico europeo | No per provare, sì per il piano a pagamento |
| **OpenAI (ChatGPT)** | gpt-6-luna | 0,10 $ | 0,50 $ | **No**, mai sull'API (serve un consenso esplicito). Log antiabuso 30 giorni | Sì, 5 $ di ricarica |
| **Anthropic (Claude)** | claude-haiku-5-5 | 0,10 $ | 0,50 $ | Non dichiarato sulle pagine lette | Sì, ricarica |

**Con l'uso di Michele (qualche decina di domande al mese) costano tutti meno di 1 € al mese: il prezzo non decide.** Quello che decide è: (a) quanto è facile prendere la chiave — Gemini è la più facile, basta la mail di Google e due tocchi su aistudio.google.com/apikey, senza carta; (b) si può chiamare direttamente dal telefono, senza un server in mezzo (Gemini sì, e la chiave viaggia nell'intestazione, non nell'indirizzo).

**Scelta messa nell'app: si sceglie lui, con tre tasti (Gemini, ChatGPT, Claude).** Consiglio scritto nella cartolina: partire da Gemini perché la chiave si prende in due minuti; se vuole il massimo della riservatezza, OpenAI non usa i dati dell'API per imparare nemmeno nel piano gratuito di prova.

### Cosa è stato fatto

- **File nuovo `ia.js`.** Parla con i tre fornitori, trova **da sola** il modello piccolo giusto (se cambia nome non si rompe niente: `trovaModello` chiede l'elenco e prende il flash-lite / luna / haiku), e legge la risposta in JSON anche se arriva sporca.
- **La fotografia della casa** (`fotografiaIA` in app.js): giorno e ora, le signore e le tariffe, il lavoro di oggi e di domani con stato e soldi, i soldi già maturati della settimana per signora, il conto del prospetto, le stelle e l'obiettivo, i controlli incrociati da fare e le cose da rifare entro sabato, le 12 cose del catalogo più in ritardo, copertura e buchi del tabellone, la manutenzione aperta, le camere occupate, il messaggio del giorno, la spesa, le domande della chat ancora aperte. **Mai i nomi degli ospiti** (c'è una prova automatica che lo verifica).
- **Le azioni restano le stesse quattro** e passano tutte dal "Sì, fallo": segnare fatta, aggiungere un lavoro col prezzo, togliere dalle stelle o spegnere, scrivere alle signore. L'IA **propone**, non fa.
- **Se non c'è la chiave, o internet non va, o la chiave scade**: torna da sola alle parole del catalogo (`parole.js`). Non si rompe niente e Michele se ne accorge solo dal bollino **IA** che sparisce dalle risposte.
- **La chiave sta solo nel telefono di Michele** (`localStorage`), mai in Firestore: le signore non la vedono e non la possono spendere.
- **Tasti veloci** nella chat: "Dammi un consiglio", "Come va oggi?", "Cosa è rimasto indietro?", "Guarda i soldi".
- **La faccia si muove davvero**: la bocca si apre e si chiude mentre parla, la testa fa sì, le sopracciglia si alzano se è contenta e si abbassano se è preoccupata, continua a respirare e a sbattere le palpebre. Nella chat è più grande (104px).
- **Dove si accende:** Governante → Regole, prima cartolina, quattro passi numerati.

### Ancora da decidere / da fare
- Paga sulle **ore standard** o **a minuto** (punto 13): deciso nulla, l'interruttore c'è.
- La voce vera (lei che parla ad alta voce e lui che risponde senza tastiera).
- Foto dei materiali, meteo automatico, avviso "venerdì Selena ha 3 camere invece di 4".

## 18. La 0.39 (16 ottobre, sera): Gemini scelto, governante più sveglia, faccia rifatta

Michele: *"vai metti Gemini ma fai tutto tu, se c'è bisogno della carta lo metto subito però guarda che qualche sito per utilizzare Gemini al massimo gratis sicuramente lo trovi. La IA la governante deve essere davvero impressionante realistica ed ultra intelligente e perspicace per le faccende dell'albergo."*

### "Un sito per usare Gemini gratis": cosa ho trovato davvero (16 ottobre 2026)

- **Il free tier di Google esiste ancora** e include i modelli Flash e Flash-Lite. I numeri esatti (quante domande al minuto e al giorno) **non sono più pubblicati**: si vedono solo entrando su `aistudio.google.com/rate-limit`.
- **Novità importante per l'Italia.** Nei termini dell'API, per chi si trova nello Spazio economico europeo, in Svizzera e nel Regno Unito le regole dati del piano a pagamento *"apply to all Services, including Google AI Studio and unpaid quota in the Gemini API"*. Cioè: **in Italia Google non usa i prompt per addestrare nemmeno sul piano gratuito.** Questo corregge quello che avevo scritto al punto 16.
- **Però** gli stessi termini dicono, in grassetto: *"You may use only Paid Services when making API Clients available to users in the European Economic Area"*. Un'app messa a disposizione di persone in Europa va sul piano a pagamento. Per questo a Michele conviene mettere la carta: prepagato minimo 5 $, che con il suo uso durano mesi.
- **Due bufale da togliere di mezzo.** (1) Il credito da 300 $ di Google Cloud **non vale più per Gemini**: *"starting March 2026, Gemini API usage costs are specifically excluded from the $300 Google Cloud Free Trial"*. (2) L'abbonamento Google AI Pro/Ultra **non dà accesso all'API**: vale solo dentro la pagina di AI Studio (*"Direct use of the Gemini API ... is billed and managed separately"*).
- **I siti che regalano "chiavi Gemini gratis": da evitare.** Usano la chiave di qualcun altro (vietato dai termini Google: *"Developer credentials ... are intended to be used by you"*), leggono in chiaro tutto quello che scrivi, e da maggio 2026 Google blocca in fretta le chiavi condivise. Non li ho messi nell'app e non li consiglio.
- Unica alternativa davvero gratuita e pulita: i modelli **Gemma** a pesi aperti (gratis su OpenRouter, 50 richieste al giorno) — ma sono parecchio meno bravi di Gemini Flash, non li ho messi.

### Prezzi veri (per un milione di parole, 16 ottobre 2026)

| Modello | Entrata | Uscita | Nel free tier? |
|---|---|---|---|
| `gemini-3.8-flash` (il più nuovo) | 0,75 $ | 3,75 $ (raddoppiano dal 1° gennaio 2027) | sì |
| `gemini-2.5-flash` | 0,30 $ | 2,50 $ | sì |
| `gemini-3.5-flash-lite` | 0,30 $ | 2,50 $ | sì |
| `gemini-2.5-flash-lite` (il più economico) | 0,10 $ | 0,40 $ | sì |
| `gemini-2.5-pro` | 1,25 $ | 10 $ | sì |

Con l'uso di Michele (qualche decina di domande al giorno, circa 8.500 parole di fotografia a domanda) **Flash nuovo costa 1-2 € al mese**. Scelto quello come predefinito: la differenza di intelligenza si sente, la differenza di prezzo no.

### Cosa ho cambiato nella 0.39

- **Interruttore "Sveglia / Risparmio"**: Sveglia prende il Flash più nuovo che la chiave vede, Risparmio il Flash-Lite. Il modello lo cerca l'app da sola, pescando sempre la versione più alta: se Google cambia i nomi non si rompe niente.
- **Istruzioni rifatte.** Adesso la governante ha vent'anni di mestiere, le regole della casa scritte (tariffe, tetto dei 100 €, stelle, controlli incrociati, sabato alle 14, i tre modi) e un **giro di controllo obbligatorio di sette cose** prima di ogni risposta: soldi sopra o sotto il tetto, controlli di oggi non fatti, cose bocciate da rifare prima di sabato, camere che partono senza pulizia, manutenzione ferma da più di una settimana, catalogo in ritardo, stelle sopra o sotto l'obiettivo. Scrive prima un "pensiero" che Michele non vede (così ragiona prima di parlare) e poi la risposta. Divieto esplicito di inventare numeri.
- **Fotografia più ricca**: il piano di tutta la settimana giorno per giorno, arrivi e partenze dei prossimi 3 giorni **con l'avviso quando una camera parte e non ha nessuna pulizia in programma**, il modo (Tecnici/Operai/Booking) di ogni camera, i ritardi del catalogo raggruppati per regola e filtrati per posto (la lavanderia non è una camera, la cucina solo negli appartamenti).
- **Il consiglio del giorno.** Quando apre la governante, lei lo saluta dicendo la situazione vera in una riga più il consiglio da fare per primo. Una sola chiamata al giorno, salvata nel telefono.
- **La faccia rifatta da zero** (solo la governante; le donnine delle signore restano come erano): sfumature su pelle, capelli e vestito, occhi veri (bianco, iride, pupilla, due luci), ciglia, sopracciglia, orecchie, naso, labbra. Divisa da governante: collo bianco, collana di perle, grembiule con i lacci, taccuino in mano. **Si muove la testa, non la statuina**: respiro sul busto, testa che gira piano, occhi che guardano in giro da soli, palpebre che sbattono due volte, ciocche e taccuino che ondeggiano. Mentre parla: tre bocche diverse che si alternano sette volte al secondo e la testa che fa sì. Con l'umore cambiano sopracciglia e bocca (sorriso, broncio).
- **Setup più facile**: tasto che apre direttamente il sito della chiave, tasto "Incolla" che la prende dagli appunti, e "Prova" che cerca il modello, lo salva e accende tutto da solo.
- Corretto un errore vecchio: nella chat delle stelle il tasto "Cambia" chiamava una funzione che non esisteva (`apriGovernante`) e non apriva niente.

### Cosa NON si può fare (detto chiaro)
La governante resta un **disegno animato fatto bene**, non una persona vera dentro lo schermo. Per una faccia filmata che parla servirebbe un servizio a pagamento a parte (decine di euro al mese) e non ne vale la pena. E non parla ancora ad alta voce: si scrive, o si detta col microfono della tastiera.

## 19. La 0.40 (16 ottobre, notte): la governante parla ad alta voce

Michele: *"sì va bene voce reale, va bene Google Flash, e va bene avatar di persona reale incredibilmente reale con voce reale. Dammi le istruzioni e dimmi quanto costa e facciamo tutto."*

### La voce: fatta

- **Motore "Voce vera" (Google).** `POST https://generativelanguage.googleapis.com/v1beta/interactions`, chiave nell'intestazione `x-goog-api-key`. Corpo: `{model, input:[{type:"user_input", content:[{type:"text", text, annotations:[{type:"speech_metadata", style}]}]}], response_format:{type:"audio"}, generation_config:{speech_config:[{voice:"Sulafat"}]}}`. **Attenzione: non è la vecchia forma `generateContent` + `responseModalities`**, che nella documentazione del 12 ottobre 2026 non esiste più.
- La risposta porta l'audio in base64 in `steps[].content[].data` dove `type === "audio"`. In chiamata normale (non in streaming) è **già un WAV completo** (24 kHz, mono, 16 bit): si suona così com'è, senza costruire l'intestazione a mano.
- **Modello**: l'app cerca da sola il `-tts` più nuovo fra quelli che la chiave vede, preferendo il "lite" (oggi `gemini-3.8-flash-lite-tts`).
- **Voci**: sei fra cui scegliere, dalle 30 prebuilt di Google: Sulafat (*Warm*, è quella di partenza), Achird (*Friendly*), Vindemiatrix (*Gentle*), Achernar (*Soft*), Leda (*Youthful*), Callirrhoe (*Easy-going*). L'italiano è nella tabella delle lingue supportate con la spunta su entrambi i modelli 3.8; la lingua la riconosce da sola dal testo.
- **Stile di recitazione**: le passiamo `style: "calma, cortese e pratica, come una governante d'albergo italiana..."` nelle annotazioni.
- **Costo vero.** Il listino conta **25 token per secondo di audio**. `gemini-3.8-flash-lite-tts` costa 6 $ per milione di token in uscita → 60 s × 25 = 1.500 token = **0,009 $ al minuto parlato** (la pagina lo conferma: "Equivalent to $0.0015 per 10s audio"). Con 5 minuti di parlato al giorno: **circa 1,35 $ al mese**, cioè ~1,30 €. Dal 1° gennaio 2027 i prezzi raddoppiano (12 $/milione → ~2,60 € al mese). Sul piano gratuito è a zero.
- **Rete di sicurezza**: se Google non risponde, se manca internet o se la chiave non va, parla la **voce del telefono** (`speechSynthesis`, gratis, funziona offline). Terza posizione: "Muta".
- **Le labbra si muovono sul suono vero.** L'audio passa per un `AnalyserNode`; a ogni fotogramma si misura l'ampiezza (RMS) e si sceglie una delle tre bocche (stretta / tonda / larga) più un'apertura continua con la variabile CSS `--apri`. Non è un'animazione a tempo: è la voce che muove la bocca.
- **Risparmio**: stesso testo = stesso audio, tenuto in un cassetto in memoria (max 40). Si legge al massimo 600 caratteri per volta. Non legge il consiglio del giorno da sola: solo le risposte a quello che scrive Michele, più il tasto "Prova la voce".
- **Dove si accende**: Governante → Regole, passo 6 della cartolina. E c'è l'altoparlante in cima alla chat per zittirla al volo.

### L'avatar di persona reale: NON fatto, e perché

Ho cercato i prezzi veri dei cinque servizi che fanno parlare una faccia fotorealistica (16 ottobre 2026):

| Servizio | Tempo reale | Prezzo pubblicato |
|---|---|---|
| **Synthesia Interactive Avatars** | sì | **0,12 $ al minuto**, pay-as-you-go, 500 minuti gratis all'inizio |
| **Tavus** | sì (tutta la filiera) | Free 20 min/mese · Starter **22 $/mese** (60 min) · Builder 59 $/mese |
| **Simli** | sì | pagina prezzi rotta; "10 $ all'iscrizione + 50 minuti al mese" |
| **D-ID** | sì | nessun prezzo leggibile (tabelle che non si caricano) |
| **HeyGen** | il prodotto live sta su un altro sito | 29-149 $/mese per il video registrato |

**Il più economico sulla carta è Synthesia a 0,12 $/minuto (~11 $ al mese per 90 minuti), ma non si può usare qui**: il loro collegamento richiede un **agente LiveKit scritto in Python che gira su un server**. Questa app è un sito statico su GitHub Pages: non c'è nessun server, e metterne uno vuol dire un costo fisso al mese più una cosa in più che si può rompere. Esattamente quello che l'app non vuole essere.

**Il più realistico da fare davvero è Tavus a 22 $/mese** (circa 20 € — 240 € l'anno, più di quello che una signora prende in due settimane), e comunque: la chiave finirebbe nel browser come quella di Gemini, ma lì vale 22 $ al mese invece di centesimi; nessuno dei cinque dichiara l'italiano nelle lingue (tutti dicono solo "30-175 lingue"), e il labiale di questi servizi è quasi sempre tarato sull'inglese; servirebbe video in streaming, quindi niente da fare con poca linea nei corridoi e niente da fare offline, mentre adesso l'app funziona anche senza rete.

**Quindi non l'ho fatto, e non lo consiglio.** Con la voce vera di Google più le labbra che si muovono sul suono vero si prende quasi tutta la sensazione di "persona dentro lo schermo" a **circa 1,30 € al mese invece di 240 € l'anno**. Se Michele dopo averlo provato vuole comunque la faccia filmata, la strada è Tavus Starter e va detto chiaro che è un abbonamento fisso.

## 20. La 0.41 (16 ottobre): Anna — l'entità che parla a Michele e spiega alle signore

Michele: *"non va bene farlo troppo realistico... rimaniamo che lo facciamo animato, come quello della lingua [Duolingo]... io devo interagire con questo cartone animato... la cosa che voglio è interagire con un'entità. Questa entità mi deve fare impressione... mi deve dire come mai questa persona non ha fatto, ti suggerisco di richiamarla, ti suggerisco di metterle più ore... 'Anna ascolta, vedi che è arrivato domenica, bisogna spostare le cose di Passerella... manda un messaggio a Selena e spiegagli con praticità questo passaggio. Fagli un piccolo video, che così magari capisce pure come le deve mettere, un piccolo gesto, deve prendere le scatole'... anche loro devono avere questo tipo di interazione."*

### Il chiarimento sui soldi (Michele ricordava 20 € al mese)

Sono due cose diverse, e ricordava bene un prezzo che però non è il nostro:
- **Google AI Pro = 19,99 $ al mese.** È l'abbonamento per usare Gemini come chat sul sito di Google. **Non include l'API** (pagina ufficiale: i vantaggi "apply only within the Google AI Studio web interface"; "Direct use of the Gemini API ... is billed and managed separately"). **Non ci serve, non va comprato.**
- **Quello che usiamo noi è a consumo**, senza abbonamento: ~1-2 € al mese per il cervello, ~1,30 € per la voce. Si prepagano 5 $ e durano mesi.

Michele aveva anche nominato **ElevenLabs** e **Neets**. Verificato oggi: ElevenLabs costa **0,04 $ al minuto** nel modello più economico (v4 Turbo), cioè **4,4 volte** Google, più un abbonamento minimo di 6 $ al mese. **Neets.ai ha chiuso il 28 febbraio 2025** e non esiste più. Google resta il più economico e senza canone.

### Cosa è stato fatto

- **La governante ha un nome: Anna** (si cambia in un tocco, Governante → Regole, passo 0 della cartolina). Il nome compare dappertutto: nella chat, nella testata, nelle spiegazioni alle signore. Nelle istruzioni all'IA: *"Ti chiami Anna... Sei una persona, non un programma: non dire mai di essere un'intelligenza artificiale."*
- **Non aspetta che le si chieda.** Nuovo blocco nelle istruzioni: deve accorgersi da sola e dire le cose scomode — "Selena venerdì ha fatto 3 camere su 4, la richiamerei", "Lucia è a 112 €, è sopra", "Passerella parte domenica e non c'è nessuna pulizia". Una cosa per volta, la più importante.
- **Azione nuova: `istruzione`.** Michele le dice a parole "spiega a Selena come spostare le cose di Passerella" e lei prepara una **spiegazione passo per passo** (da 2 a 6 passi, frasi cortissime in seconda persona), la propone con il solito "Confermo?", e dopo il Sì la signora se la trova in cima alla sua schermata.
- **Il "piccolo video": disegnini animati** (`gesti.js`). Non sono video — sono disegni che si muovono in tondo, come i cartoni delle app per imparare le lingue. Otto gesti: **scatole** (le mani che prendono la scatola e la posano sulla pila), **letto** (il lenzuolo che si stende), **asciugamani** (l'asciugamano che si piega), **spray** (lo spruzzo e il panno che passa), **finestra** (l'anta che si apre e l'aria che entra), **pavimento** (il mop che va avanti e indietro), **armadio** (l'anta che scorre), **bidone** (il sacco che esce). L'IA sceglie il gesto giusto per ogni passo da questo elenco.
- **Anche le signore hanno l'interazione.** Sulla loro schermata: Anna disegnata, il titolo, i passi numerati con il disegnino sotto ognuno, e il tasto **altoparlante** che glieli legge ad alta voce. Per le signore parla **la voce gratis del telefono** (non hanno la chiave e non devono costare niente).
- Dove stanno: dentro `impostazioni/messaggi`, sotto il giorno, campo `istruzioni`. Le signore leggono già `impostazioni` e i proprietari ci scrivono: **nessuna modifica alle regole di sicurezza di Firestore**.

### Cosa resta da fare
- Michele deve ancora prendere la chiave (i quattro tocchi del punto 18).
- La signora non può ancora segnare "fatto" su una spiegazione.
- I gesti sono otto: se ne servono altri si aggiungono in `gesti.js`, uno per volta.

## 21. La 0.42 (16 ottobre, sera): si chiama Rosa, le si parla col microfono, e ti scrive sul telefono

Michele ha creato la chiave (16 ott 2026, progetto `gen-lang-client-0380052006`, livello gratuito) e ha chiesto tre cose.

### 1. "Quale numero devo mettere nella fatturazione?"
**5 $.** È il minimo prepagato che Google accetta (pagina ufficiale: *"The minimum purchase is $5"*, massimo 5.000 $). Con il suo uso durano mesi. Dopo, su `aistudio.google.com/apikey` il "Livello di fatturazione" smette di dire "Livello gratuito" e si sblocca il piano a pagamento, che serve perché i termini chiedono il piano a pagamento per un'app a disposizione di utenti europei.

### 2. Il nome: non più Anna
Michele: *"ho avuto una fidanzata che si chiamava Anna e quindi la mia ragazza si può innervosire molto"*. Il nome di partenza diventa **Rosa**, e nella cartolina ci sono sei nomi da toccare — Rosa, Carmela, Mimma, Gilda, Assunta, Stella — più la casella per scriverne uno qualsiasi. Avviso scritto: non usare il nome di una delle signore.

### 3. Parlarle col microfono (niente tastiera)
Tasto rotondo col microfono accanto alla freccia di invio: si tocca, si parla, lei scrive quello che sente mentre lo dici e appena smetti manda da sola. Motore: `SpeechRecognition` del browser, lingua `it-IT`, gratis, nessuna chiave. **Funziona su Android** (il telefono di Michele). **Su iPhone il motore non esiste**: l'app se ne accorge e scrive "usa il microfono della tastiera". Mentre ascolta il tasto diventa rosso e pulsa, e **Rosa inclina la testa e alza le sopracciglia**: si vede che sta ascoltando.

### 4. Le notifiche sul telefono
Non serve niente di nuovo: l'app ha già **Telegram** (⋯ → Avvisi automatici). Aggiunto un campo: **"La TUA chat col bot"**, separato dal gruppo delle signore, con il tasto che la cerca da sola (basta scrivere «ciao» al bot). Da lì passano i messaggi che Rosa manda **solo a Michele**: il consiglio del giorno arriva come notifica sul telefono, firmato col suo nome. Interruttore dedicato nell'elenco "Cosa mandare da solo".

**Limite da dire chiaro:** senza un server, Telegram parte quando Michele apre l'app (come già il piano del mattino). Una notifica che arriva da sola a app chiusa richiederebbe un server acceso sempre, con il suo costo fisso. Tutti gli avvisi che già esistono (problema, camera non fatta, camera pulita, messaggio del giorno, spiegazioni alle signore) continuano a partire nel momento in cui succedono.

## 22. La 0.43 (17 ottobre): si chiama Consuela, ha la faccia da mascotte e ti accoglie lei

Michele: *"quello che voglio io è che CONSUELA la governante debba avere un avatar uguale a quelli che hanno quell'app delle lingue, e forse se si può anche la stessa voce. Io devo aprire l'app ed deve risaltare e deve essere molto evidente la sua presenza, mi deve dire buongiorno e buonasera Michele, un po' di elogi, una frase motivazionale e poi mi deve parlare di quello che mi deve dire dell'albergo. Ma è essenziale che ci sia un avatar come quello."*

### Il limite da dire chiaro (e come l'ho risolto)
I personaggi di quell'app sono **suoi**: disegnarne una copia non si può fare, e la loro voce è una voce registrata loro. Quello che **si può** fare, e che ho fatto, è disegnare un personaggio **nostro nello stesso registro grafico** — uno stile non è di nessuno. Risultato: contorni spessi, tinte piatte senza sfumature, testa grossa, **occhi enormi** con bianco, iride, pupilla e due luci, guance rosa, corpo semplificato e braccia a capsula con le mani tonde. È la stessa famiglia visiva, ma è Consuela e non somiglia a nessun personaggio esistente.

### Cosa è cambiato
- **Nome di partenza: Consuela** (resta cambiabile: Rosa, Carmela, Mimma, Gilda, Stella, o uno scritto a mano).
- **Avatar rifatto da mascotte**, al posto del disegno a sfumature della 0.39. Si muove come una mascotte: **rimbalzo** con schiacciamento e allungamento al posto del respiro, **saluto con la mano** ogni sei secondi e mezzo, braccio sinistro che dondola, testa che gira, occhi che guardano in giro, palpebre a due battiti, ciocche e taccuino che ondeggiano. Mentre parla restano le tre bocche guidate dal suono vero.
- **La cartolina grande in cima a Oggi.** Appena Michele apre l'app vede lei a 116 px che lo saluta per nome secondo l'ora ("Buongiorno, Michele!"), poi la situazione vera in una riga, poi una spinta. Tocchi e si apre la chat; c'è l'altoparlante per fartela leggere.
- **Il saluto lo scrive lei**, con l'IA accesa: nuovo campo `saluto` nel JSON della chiamata del giorno. Nelle istruzioni: il merito si dice **solo se c'è davvero**, con il fatto preciso ("tutte le camere chiuse", "il controllo è andato bene"); se non c'è niente di meritato **non deve inventare complimenti**, mette una spinta pratica. Massimo 18 parole. È il contrario dell'adulazione: Michele vuole la verità, non le pacche sulle spalle.
- **Senza chiave funziona lo stesso**: saluto costruito dall'app, la riga dell'umore della casa e una delle sette spinte, scelta dal giorno (uguale per tutta la giornata).
- Il saluto entra anche nella notifica Telegram del mattino.

### Sulla voce
La voce di quei personaggi è la loro. La nostra è una delle 30 voci di Google: di partenza **Sulafat**, quella che il listino chiama *Warm*. Si cambia fra sei caratteri nella cartolina, passo 6.

## 23. La 0.44 (17 ottobre): HeyGen e D-ID guardati davvero, e la faccia che sceglie Michele

Michele: *"non mi piace, prova con HeyGen o D-ID però tutto gratuito o quasi."*

### I prezzi veri, letti sulle pagine aperte nel browser (17 ottobre 2026)

Ieri quelle pagine non si lasciavano leggere da fuori (sono costruite dal javascript). Oggi le ho aperte nel Chrome di Michele e lette renderizzate.

**HeyGen** (heygen.com/pricing):
- **Gratuito 0 $/mese**: "3 video al mese", "video fino a 1 minuto", "oltre 500 avatar video di repertorio", "1 avatar video personalizzato", "oltre 30 lingue".
- **Creatore 29 $/mese**: 600 crediti, video fino a 30 minuti, 1080p, e — questa è la riga che conta — **"Rimozione della filigrana"** compare qui. Quindi **sul piano gratuito la filigrana c'è**.
- Pro 49 $/mese.

**D-ID** (d-id.com/pricing/api):
- **Prova 0 $**: "Prova di 14 giorni", "fino a 3 minuti di video", "fino a 10 minuti di video in streaming", **"Filigrana a schermo intero"**. Dopo 14 giorni finisce.
- **Costruire 14,4 $/mese** (172,8 $ l'anno): 64 crediti, 16 minuti di video — e comunque **"Filigrana D-ID"**.
- **Lancio 35 $/mese** (420 $ l'anno): 45 minuti, licenza commerciale, ma la riga dice ancora **"Filigrana AI"**.
- Scala 138,6 $/mese.

**Conclusione, senza giri di parole: una faccia fotorealistica che parla, gratis, non esiste.** Il gratuito di HeyGen sono 3 video al mese col marchio sopra; quello di D-ID dura due settimane col marchio a schermo intero. Il primo piano davvero pulito è HeyGen Creatore a **29 $/mese, cioè circa 320 € l'anno**. E restano i problemi strutturali già scritti al punto 19: niente server, chiave costosa dentro al telefono, italiano non dichiarato da nessuno, niente uso senza rete.

### Cosa ho fatto invece: la faccia la sceglie lui

Nella cartolina, **passo 0b — La sua faccia**: due tasti, *Disegno* o *La tua foto*. Con "Scegli una foto" Michele prende un'immagine dal telefono: l'app la ritaglia quadrata, la rimpicciolisce a 420 px, la salva in JPEG dentro `localStorage` (**mai in Firestore**: è pesante e alle signore non serve) e da quel momento Consuela ha quella faccia dappertutto — cartolina grande di Oggi, chat, bollicine, piastre.

La foto **respira** (zoom lentissimo), e **quando parla** si illumina con un anello verde la cui grandezza segue l'ampiezza del suono vero, più una leggera oscillazione. Non c'è il labiale — per quello servirebbe il video a pagamento — ma c'è una faccia vera che saluta per nome con una voce vera, gratis, senza filigrana, senza canone e anche senza rete.

Avviso scritto nella cartolina: usare una foto propria o una fatta con l'intelligenza artificiale, **non la foto di una persona vera senza il suo permesso**.

Con un tocco su *Disegno* si torna alla mascotte: niente è perso.

### Limite da sapere
La foto sta solo sul telefono di Michele. Nelle spiegazioni che vedono le signore resta il disegno.

## 24. La 0.45 (17 ottobre): lo stile piatto, quello giusto

Michele: *"a me mi serve più un avatar come ti ho detto, come l'applicazione di linguaggio. Cerca di trovare un modo per farmi avere quello che ti ho chiesto."*

### Dov'era l'errore
Alla 0.43 avevo fatto una mascotte **col contorno nero spesso e gli occhi grandi lucidi**. È il registro delle icone da catalogo, non quello delle app per imparare le lingue. La differenza vera di quello stile non sono gli occhi: è che **il contorno non c'è proprio**.

Le regole di quel linguaggio grafico, che ho applicato:
- **nessun tratto, nessun contorno**: solo forme piene, una accanto all'altra;
- **geometria semplice**: rettangoli stondati e cerchi, niente curve complicate;
- **pochi colori pieni**, due tonalità per pezzo al massimo (una chiara e una in ombra);
- **occhi a fagiolo scuri** con un punto di luce — non occhi grandi col bianco;
- **mani a manopola**, senza dita; **niente collo**;
- **capelli come una macchia grafica sola**, con la frangia a svolazzo e due ciocche ai lati;
- silhouette che si riconosce anche piccolissima.

Il personaggio è **nostro**: lo stile non è di nessuno, i personaggi di quell'app sì.

### Tre facce, si cambia con un tocco
Cartolina → passo 0b, **La sua faccia**: **Piatta** (quella nuova, di partenza) · **Contornata** (la mascotte della 0.43, se gli piaceva di più) · **Foto** (una sua immagine, dalla 0.44). Tutte e tre usano lo stesso meccanismo: rimbalzo, saluto con la mano, palpebre, occhi che si muovono, e la bocca che segue il suono vero della voce.

### Sul motore
Michele ha confermato: **Gemini Flash è la scelta chiusa** e basta per quello che deve fare adesso. Quando arriveranno compiti nuovi si rivaluta — niente da cambiare oggi.

## 25. La 0.46 (17 ottobre): il pupazzo a immagini — come fa Praktika

Michele ha mandato due schermate di **Praktika** (app di pratica linguistica): a destra una ragazza in 3D stile Pixar che parla. *"Quello voglio come Consuela mia."* Ha anche chiesto se può usare OpenArt o le immagini di ChatGPT.

### Il trucco, guardando bene le sue due schermate
Nelle due immagini **la posa è identica**: stessa inquadratura, stessa mano sotto il mento, stessa luce, stesso sfondo. Cambiano **solo la bocca e gli occhi** (nella prima bocca chiusa e occhi aperti, nella seconda bocca a «o» e occhi chiusi). Non è un 3D calcolato sul telefono: è un personaggio reso una volta e **scambiato a strati**. Quello si può rifare esattamente, gratis.

### Cosa è stato fatto
- La "foto" della 0.44 diventa un **set di quattro immagini**: *Faccia normale* (l'unica obbligatoria), *Bocca socchiusa*, *Bocca aperta*, *Occhi chiusi*.
- Sono **impilate** una sull'altra nello stesso tondo. L'`AnalyserNode` che già misura la voce vera decide quale accendere, fotogramma per fotogramma: silenzio → faccia normale, voce bassa → bocca socchiusa, voce alta → bocca aperta. È lo stesso meccanismo delle tre bocche del disegno, applicato a immagini vere.
- **Le palpebre**: l'immagine a occhi chiusi lampeggia per 1,6 decimi di secondo ogni 5,4 secondi quando sta ferma, e si spegne mentre parla (lì comanda la bocca).
- Se ci sono solo la prima immagine, si comporta come prima (respira e si illumina): niente si rompe.
- Nella cartolina ci sono **i testi pronti da incollare** nel sito che disegna, uno per posa, col tasto Copia. Il consiglio scritto: fare la prima immagine, poi chiedere le altre **sulla stessa immagine** ("cambia solo la bocca"), se no esce un'altra persona.
- Tutto in `localStorage` (4 × ~60 KB), **mai in Firestore**.

### Risposta alla domanda su OpenArt / ChatGPT
Vanno bene entrambi, e anche Gemini. La parte difficile non è fare una bella immagine: è farne **quattro della stessa persona**. Per questo serve partire da una e chiedere le varianti come modifica di quella, non come disegno nuovo.

### Cosa resta diverso da Praktika
Loro hanno un modello 3D vero mosso in tempo reale: la testa gira, le sopracciglia si alzano, il labiale segue i suoni uno per uno. Qui sono quattro fotogrammi scambiati sull'ampiezza della voce. A schermo, in un tondo da 112 px che saluta, la differenza si vede poco; in un primo piano grande si vedrebbe.

## 26. La 0.47 (18 ottobre): Consuela e' dentro l'app, non piu' da caricare a mano

### Cosa ha chiesto Michele
«Fallo tu direttamente apri il sito e fallo tu e poi mettila nella nostra app».

### Come sono nate le 4 immagini
OpenArt chiedeva di creare un account: non si puo' fare. Si e' usato **Gemini** (gemini.google.com), dove Michele e' gia' dentro, e li' le immagini si fanno gratis.
Prima immagine: ritratto 3D stile Pixar, donna italiana sui 35 anni, divisa blu notte con colletto bianco, sfondo blu scuro liscio, 1024x1024.
Poi tre modifiche della STESSA immagine, una per volta, ripartendo sempre dalla prima: bocca socchiusa, bocca aperta (la «A»), occhi chiusi.
Controllo fatto col computer: fra una immagine e l'altra cambia solo l'1-2,5% dei pixel. Vuol dire che la posa e' identica e il pupazzo non «salta».

### Dove stanno adesso
Quattro file dentro il deposito, non piu' dentro il telefono:
`consuela-base.jpg`, `consuela-m1.jpg`, `consuela-m2.jpg`, `consuela-occhi.jpg` — 512x512, 34 KB l'uno.
Sono anche nella lista di `sw.js`, cosi' l'app li tiene da parte e funzionano pure senza internet.

### Cosa cambia nel codice (poco, ma importante)
- `FACCE_PRONTE`: la lista dei quattro file gia' pronti.
- `facceGov()`: se Michele non ha caricato niente di suo, usa quelli. Prima restava vuoto e si vedeva il disegno.
- `stileGov()`: di partenza adesso vale `"consuela"` (prima `"piatta"`).
- `salvaFaccia()`: legge solo quello che e' stato caricato davvero, cosi' se Michele mette una sua foto NON resta mischiata con le bocche di Consuela.
- Nel passo 0b c'e' un bottone in piu': **Consuela**. Piatta / Contornata / Consuela / Foto.

### Il difetto trovato e aggiustato (0.47.1)
La card grande di Consuela su Oggi diventava scura se il telefono o il computer era in modo scuro, ma il testo restava nero: non si leggeva niente.
Nel `style.css` c'erano tre pezzi che seguivano il modo scuro del telefono invece di quello scelto dentro l'app (Aspetto: Chiaro / Scuro). Tolti tutti e tre. Adesso comanda solo il bottone dentro l'app.

### Come si torna indietro
Regole della governante, passo 0b: si tocca **Piatta** o **Contornata** e torna il disegno; si tocca **Consuela** e torna lei.

### Cosa resta da fare
La chiave di Gemini la deve incollare Michele (passo 4): le chiavi non le scrive l'assistente.

## 27. La 0.48 (18 ottobre): Consuela rifatta, grande e che si muove davvero

### Cosa ha chiesto Michele
Piu giovane, piu sorridente, piu bella. Riquadro molto piu grande, la prima cosa che si vede aprendo l'app. E che si muova tanto, faccia e corpo, come l'avatar di Praktika.

### Le sette facce (una sola posa, cambia solo quello che serve)
Fatte su Gemini, sempre partendo dalla prima immagine e cambiando una cosa per volta:
`consuela-base.jpg` (sorriso normale), `-m1` (bocca socchiusa), `-m3` (bocca a O), `-m2` (bocca aperta, la A), `-occhi` (occhi chiusi), `-felice` (risata), `-pensa` (pensierosa, guarda di lato).
640x640, 54 KB l'una, 380 KB in tutto. Controllo col computer: fra una e l'altra cambia il 2,5-7% dei pixel, quindi la testa non si sposta.

### Il trucco della finestra
Prima la foto era un cerchio e basta. Adesso il cerchio e' una FINESTRA (`.gf-vetro`) e dentro ci sono due strati che si muovono:
- `.gf-corpo` = il respiro (si alza e si abbassa, 4,6 secondi)
- `.gf-testa` = l'ondeggio della testa (11 secondi) e, quando parla, il cenno del capo (1,9 secondi)
Cosi' lei si muove DENTRO al riquadro, come un personaggio vero, e il bordo bianco resta fermo.

### La bocca che segue la voce
Il volume della voce diventa quattro livelli: chiusa, socchiusa, a O, aperta. Erano tre, adesso le forme sono piu varie e sembra che parli davvero.

### Gli occhi che sbattono anche mentre parla
Difetto vecchio: la foto con gli occhi chiusi copriva tutta la faccia, quindi se sbatteva le ciglia mentre parlava la bocca si fermava.
Aggiustato con una maschera: la foto degli occhi dipinge solo la meta' di sopra (fino al 52%). Sotto resta la bocca che sta parlando.

### Le espressioni
- Umore della giornata (lo decide gia' `umoreGov()`): contenta = risata, attenta o preoccupata = pensierosa, serena = normale.
- Micro-espressioni: ogni 6,5 secondi circa `vitaGov()` puo' cambiarle faccia per un secondo e mezzo (normale, risata, pensierosa). Non lo fa mentre parla.

### Il riquadro grande
Sul telefono: foto tonda da 60% della larghezza (massimo 240 px) in cima, testo sotto, tutto centrato. Sul computer: 260 px a sinistra e testo a destra. Saluto da 27-32 px.

### Difetto trovato e aggiustato (0.48.2)
Nelle bollette della chat la foto veniva ovale (40x45) per una vecchia regola fatta per il disegno. Messo `aspect-ratio:1/1`: adesso e' sempre un cerchio.

### Cosa ancora non e' come Praktika
Non gira la testa in 3D e non muove le braccia: sono sette immagini che si scambiano dentro una finestra, piu respiro e ondeggio fatti dal telefono. Per il 3D vero servirebbe un video generato, che si paga.

## 28. La 0.49 (18 ottobre): Consuela a figura intera, con i gesti

### Cosa ha chiesto Michele
Piu bella ancora, si deve vedere quasi tutto il corpo, e si deve muovere venti volte di piu.

### Il personaggio
Rifatto da zero su Gemini: ragazza di 24 anni, capelli castani lunghi e mossi, divisa blu notte, inquadratura dai fianchi in su, mani aperte e ben visibili.
Trucco importante: generata su SFONDO VERDE pieno (#00B140), come al cinema. Poi col computer il verde e stato tolto, cosi lei sta dentro la card senza nessun riquadro intorno.

### Come si ottengono pose davvero identiche
La chat di Gemini si confondeva e tornava sempre alla prima immagine. Soluzione: chat nuova, la foto base CARICATA come allegato, e ogni volta "riparti dalla foto che ti ho caricato". Cosi tutte le pose tornano uguali.

### I dieci pezzi (110 KB in tutto, formato WEBP)
- Tre pose intere: cons-base (braccia aperte), cons-saluto (braccio alzato che saluta), cons-riposo (braccia giu).
- Cinque TOPPE trasparenti che coprono solo un pezzetto di faccia: cons-b1 (bocca socchiusa), cons-b2 (bocca A), cons-b3 (bocca O), cons-occhi (occhi chiusi), cons-felice (risata).
- Due teste tonde per le bollette della chat: cons-testa, cons-testa-occhi.
Le toppe hanno i bordi sfumati (rettangolo arrotondato + sfocatura 11 px): si incollano sopra senza che si veda il taglio. Controllo col computer: lo scarto fra una posa e l altra e di 0-1 pixel, quindi combacia tutto.

### Il motore dei movimenti
Due strati uno dentro l altro, con tempi diversi apposta, cosi il movimento non si ripete mai uguale:
- cg-giro: ondeggia a destra e sinistra, 7 secondi, rotazione fino a 2,5 gradi
- cg-salto: respiro e saltello, 2,9 secondi
Quando parla diventano 3,6 e 1,4 secondi: si muove quasi il doppio piu veloce.
Ogni cambio di posa fa anche uno scatto (cgScatto, 0,6 s) che la fa saltare un po: cosi il cambio sembra un gesto e non una dissolvenza.

### Quanto si muove adesso
- gestoGov() ogni 2,4 secondi: 58% cambia posa (saluta, apre le braccia, le abbassa), 26% fa una risata.
- battiGov() ogni 1,8-4,4 secondi: sbatte le palpebre, a volte due volte di fila.
Prima succedeva qualcosa ogni 6,5 secondi e solo con la faccia. Adesso succede qualcosa quasi ogni secondo e mezzo, e muove anche le braccia.

### La card
Telefono: testo in alto, Consuela sotto larga fino a 360 px, appoggiata al bordo basso della card. Computer: lei a sinistra 340 px, testo a destra.

### Cosa ancora non e come Praktika
Le braccia cambiano a scatti fra tre pose, non si muovono in modo continuo: per quello servirebbe un vero scheletro 3D o un video generato, che si paga.

## 29. Dalla 0.50 alla 0.53 (18 ottobre): dal pupazzo di immagini al VIDEO VERO

### 0.50 - sei gesti, occhi vivi, sfondo
Aggiunte tre pose (indica, mani sul cuore, pollice su) e tre toppe per gli occhi (guarda a sinistra, a destra, sopracciglia alzate). Lo sguardo cambia ogni 0,9-2,6 secondi, i gesti ogni 1,9 secondi. Sfondo della hall disegnato col computer (gradienti sfocati), 4,8 KB.

### 0.51 - Argon nel motore dell app
In ia.js la lista "sveglia" adesso cerca in ordine: argon, poi pro, poi flash. Tolto "thinking" dalla lista di esclusione, cosi i modelli che ragionano non vengono piu scartati.
ATTENZIONE, cosa importante da ricordare: l abbonamento Google AI Pro (21,99 euro al mese, fatto il 18 ottobre) vale SOLO per il Gemini dove scrive Michele. NON paga l intelligenza dell app: quella usa l API con la chiave di AI Studio, che e un altro prodotto e si paga a consumo.

### 0.52 - Consuela diventa un video
Con l abbonamento Pro si e sbloccato "Crea video" (Veo 3.1 Lite) dentro Gemini. Fatti tre filmati partendo dalla foto del personaggio.
I video NON si possono scaricare dal lato assistente: il link di Google e firmato e funziona solo dentro il browser di Michele (provato: il proxy blocca l host, e il fetch da un altra origine lo blocca il CORS). Quindi il giro e: Michele tocca la freccia di download in Gemini e attacca il file nella chat.
Montaggio fatto col computer (ffmpeg):
- cons-attesa.mp4: tagliato il primo secondo e tre (partiva ancora con lo sfondo verde della foto), rimpicciolito a 720 px, poi avanti e indietro (reverse) per avere un giro perfetto da 17,4 secondi. 168 KB.
- cons-parla.mp4: 10 secondi, 163 KB.
- cons-poster.webp: primo fotogramma, 14 KB.
Nell app: due elementi video sovrapposti che si sfumano l uno nell altro (nessun lampo nero), un controllo ogni 450 ms che guarda se la card ha la classe "parla" e cambia filmato.

### 0.53 - il difetto piu importante trovato finora
La scheda di Consuela con la casella della CHIAVE API stava dentro vistaRegoleGov(), cioe nella vista della governante, a cui NON si arriva toccando nessun bottone (ci si va solo da un azione dell IA). Michele non poteva incollare la chiave nemmeno volendo.
Aggiustato: vistaAltro() adesso comincia con cardIA(), quindi la scheda sta in cima al menu dei tre puntini. Il campo e #iaChiave, con accanto il bottone Incolla che legge dagli appunti.

### I numeri veri dei limiti video (visti il 18 ottobre su gemini.google.com/usage)
- Tre video di fila portano l "utilizzo attuale" al 99%. Si resetta ogni 5 ore circa.
- Il limite SETTIMANALE con tre video era solo al 5%. Quindi di video se ne possono fare tanti in una settimana, bastano 3 alla volta ogni 5 ore.
- AI Ultra (99,99 euro al mese) darebbe 5 volte tanto: non serve.

### La chiave API: come stanno le cose davvero
Michele ce l ha gia, creata il 16 ottobre (finisce con Dx7g, progetto Default Gemini Project). Il livello scritto e "Prova senza costi": piano GRATUITO. Per un albergo basta.
PostePay non e accettata da Google e PayPal chiede un minimo di 30 dollari: non servono, perche sul piano gratuito non si paga niente.
Le chiavi non le scrive mai l assistente: Michele copia da aistudio.google.com/apikey e tocca Incolla nel passo 4.

## 30. Dalla 0.54 alla 0.58 (18 ottobre): la governante diventa Sofia e si parla dalla prima pagina

### 0.54 - un errore mio, scritto qui perche non si ripeta
Nella 0.51 avevo messo l app a preferire Argon e Pro. Quei modelli NON hanno chiamate gratuite via API: la prima chiamata di Michele ha risposto 429 e l app diceva "Hai finito le chiamate gratuite". Non era vero, non ne aveva mai fatta una.
Rimesso l ordine giusto in ia.js: PRIMA flash, poi argon, poi pro, poi flash-lite. Argon resta disponibile ma non e piu il primo.
Cambiato anche il messaggio del 429, che prima dava la colpa a Michele: adesso dice "Questo modello non ha chiamate gratuite, oppure le hai finite per adesso. Vai al passo 2 e metti Risparmio, poi riprova."
REGOLA: con la chiave gratuita di AI Studio funzionano i modelli flash. Pro e Argon vogliono la carta.

### 0.55 - il microfono sulla prima pagina
Michele: "io devo poterci parlare da subito e non che devo andare nella chat".
Sotto la faccia di Sofia, nella card della prima pagina, c e un bottone tondo col microfono. Usa il riconoscimento vocale del telefono (it-IT). Mentre lui parla, sotto compare quello che sta dicendo in grigio chiaro; quando finisce, il testo va a parlaGov(), cioe lo stesso cervello della chat.
La card cambia bordo: verde mentre ascolta, ambra mentre pensa, rosso se qualcosa non va. E document.body prende un attributo che dice in che stato e, cosi anche il video sa che deve cambiare.

### 0.56 e 0.57 - il video anche nella chat
Prima, entrando nella chat, Sofia si riduceva a un bollino tondo da 45 px: Michele ha detto "non la vedo piu".
Adesso il filmato resta grande anche nella chat (meta schermo in larghezza, forma 3:4) e sta attaccato in alto mentre i messaggi scorrono sotto.

### 0.58 - lo zoom quando parla
Quando Sofia parla, il video si avvicina (ingrandimento 1,5 nella chat, 1,46 nella card), con una transizione morbida di mezzo secondo. Quando ascolta, 1,4. E il modo di Praktika: in primo piano mentre parla, un po piu indietro quando sta ferma.

### 0.58.1 - il nome
Michele: "Consuela non tanto mi piace". Cercato un nome piu adatto al posto; alla fine ha scelto lui: SOFIA. Aggiunto in cima alla lista dei nomi nel passo 0.
Nel codice le variabili si chiamano ancora cons-qualcosa (cons-attesa.mp4, FACCE_PRONTE, cardConsuela): e solo il nome interno dei file, quello che si legge a schermo lo decide il passo 0.

### Le regole dei video, dette da Michele guardando Praktika
Queste valgono per tutti i video che si generano da qui in avanti:
- PRIMO PIANO: testa e spalle che riempiono l inquadratura.
- SGUARDO FISSO IN CAMERA, negli occhi, SEMPRE, anche quando sta zitta.
- Le espressioni stanno sul VISO (bocca, sopracciglia, occhi, piccoli cenni del capo), NON sulle mani. Ha detto che gesticolava troppo e a vuoto.
- Elegante, composta, bella, professionale.
Il riferimento da caricare su Gemini e /home/claude/dev/c4/nuova.png.

## 31. La 0.59 (18 ottobre): la voce sensuale

### Cosa ha chiesto Michele
"la voce deve essere molto molto piu sensuale".

### Due cose diverse: QUALE voce e COME parla
- QUALE voce: e il nome del timbro che si chiede a Google. Prima era Sulafat (calda). Adesso la lista parte dalle tre piu basse e morbide: Despina (Vellutata, quella di partenza), Achernar (Sussurrata, soffiata), Gacrux (Profonda). Poi restano Sulafat, Vindemiatrix, Callirrhoe, Leda, Achird.
- COME parla: e lo "stile", un pezzo di testo che si manda a Google insieme alla frase e che NON viene letto ad alta voce, dice solo con che tono leggere. Adesso ce ne sono tre, scegliibili nel passo 6 sotto la scritta "Come deve parlare": Garbata, Calda, Sensuale. Di partenza e Sensuale.
Lo stile Sensuale, parola per parola: voce molto bassa, vellutata e un filo soffiata, lenta, vicina al microfono come se confidasse qualcosa all orecchio, vocali allungate, una piccola pausa tra le frasi, il tono che scende alla fine di ogni frase; mai squillante, mai allegra, mai forte.
Lo stile e scritto in inglese apposta: e la lingua degli esempi nella documentazione di Google ed e quella che il modello segue meglio. La frase letta resta in italiano.

### Anche la voce del telefono
Il ripiego gratuito (quando manca internet o la chiave) adesso segue lo stesso tono: Sensuale = velocita 0,84 e altezza 0,74, cioe molto piu lenta e piu bassa di prima (era 1,02 e 1,04).

### Il difetto trovato subito (0.59.1)
Per far passare alla voce nuova anche chi aveva gia salvato quella vecchia avevo messo un contrassegno v:2 nella configurazione. Ma il controllo guardava la configurazione gia mescolata con quella di base, che il v:2 ce l aveva sempre: quindi il passaggio non avveniva mai e restava Sulafat. Aggiustato: adesso il controllo guarda SOLO quello che c e scritto in memoria.
REGOLA GENERALE: quando si controlla se una cosa era gia salvata, si guarda il salvato grezzo, mai quello gia unito ai valori di partenza.

### Provato davvero
Chiamata vera a Google dal telefono di Michele: Despina, Achernar e Gacrux rispondono e tornano l audio (modello gemini-3.8-flash-lite-tts). Le altre non le ho potute provare perche dopo tre chiamate di fila il piano gratuito dice 429.
COSA SAPERE: se si tocca "Prova la voce" tre o quattro volte di seguito arriva "Hai finito le voci gratuite per adesso". Non e finita niente: e solo il limite al minuto. Si aspetta un paio di minuti e riparte.

### Dove si cambia
Tre puntini in alto a destra -> passo 6 "La voce". Prima riga: quale voce. Seconda riga: come deve parlare. Poi "Prova la voce" per sentirla.

## 32. La 0.60 (18 ottobre, sera): LA SCHERMATA DI CASA

### Cosa ha chiesto Michele
"deve essere proprio l'unica cosa che si deve vedere quando apro l'app e poi tutto magari sotto, affianco, oppure se si puo' aprire un'altra pagina dove c'e' il resto delle macro informazioni, prospetto, giornate, signore e quant'altro".
Gli ho dato tre scelte e ha scelto la terza: solo lei all'apertura, con sotto una striscia piccola con le cose di oggi, PIU' il tasto che porta a tutto il resto.

### Com'e' fatta
Una sezione nuova, #sofiaHero, che NON sta dentro #app: viene infilata nel corpo della pagina PRIMA dell'intestazione. Cosi' il resto dell'app non e' stato toccato: sta tutto sotto, uguale a prima, e si raggiunge scorrendo col dito o col tasto "Le mie giornate".
Altezza 100svh (svh e non vh: cosi' la barra del browser del telefono non mangia il tasto in basso).
Dentro: il filmato a tutto schermo, un velo scuro sfumato in basso per leggere il testo, in alto il nome della struttura e i tre puntini, in basso il saluto, la riga della giornata, il microfono grande, "Scrivile", le pasticche con i numeri di oggi e il tasto "Le mie giornate".

### Le funzioni nuove in app.js
- casaAttiva(): dice se la schermata va mostrata (proprietario, vista "oggi", giorno = oggi, dati caricati, faccia FOTO).
- casaOssatura(): il guscio, costruito UNA VOLTA SOLA. Importante: se si ricostruisse a ogni disegno, il video ripartirebbe da capo a ogni aggiornamento.
- casaAggiorna(h): cambia solo i testi e le pasticche.
- disegnaCasa(): crea o toglie la sezione. Chiamata dentro disegna(), prima di collega(), cosi' i tasti data-vista e data-chat-apri vengono collegati come tutti gli altri.
Quando la schermata di casa c'e', vistaOggiGestione() NON disegna piu' cardConsuela(): altrimenti ci sarebbero due #consSotto con lo stesso id.

### Il trucco dello schermo largo
Il filmato e' 9:16, in piedi. Su un telefono riempie tutto, giusto. Su un computer (schermo largo) "cover" tagliava tutto tranne la fronte.
Aggiunta la regola @media (min-aspect-ratio:9/16): se lo schermo e' piu' largo di una foto in piedi, il filmato si vede INTERO al centro (object-fit:contain) e ai lati si mette la stessa immagine sfocata (il poster, con blur 44px e luminosita' 45%). Niente barre nere.

### I tre filmati (dai video della notte del 18 ottobre)
Montati con ffmpeg a 540x960, senza audio (-an: i video di Veo hanno il sonoro e non serve), crf 30.
- cons-attesa.mp4 (415 KB, 20 s): 10 secondi presi dal clip lungo, poi avanti-e-indietro (boomerang) per un giro perfetto senza stacco.
- cons-parla.mp4 (245 KB, 10 s): il clip con piu' movimento della bocca.
- cons-ascolta.mp4 (212 KB, 10 s): NUOVO, prima non c'era. Adesso mentre il microfono ascolta lei annuisce davvero.
- cons-poster.webp (17 KB): il primo fotogramma, serve anche come sfondo sfocato.
COME HO CAPITO QUALE ERA QUALE: i tre file arrivano senza nome. Ho misurato col computer quanto si muove la bocca (ritaglio 170x100 sulla bocca, differenza media fra un fotogramma e il successivo): piu' movimento = parla, meno movimento = attesa.

### Il motore dei filmati adesso ha tre stati
filmVigila() guarda document.body.dataset.cons: "parla" -> cons-parla, "ascolto" -> cons-ascolta, altrimenti cons-attesa. statoCons() scrive quel valore e marca sia .card.consuela sia .sofia-hero.
Provato dal vivo: attesa -> ascolta -> parla -> attesa, i filmati si scambiano davvero.
