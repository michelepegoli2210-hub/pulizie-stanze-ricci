# Unisce il catalogo di Michele (catalogo-governante.csv, la base) con le regole nate dalle foto (0.25):
#  - le 163 righe restano con i loro ID, minuti, priorità, Blocco e Profilo base
#  - dove il testo delle foto è più preciso sulle nostre camere, entra nel "Come si fa" / "Note" della riga di Michele
#  - quello che nel file non c'è diventa una riga P01, P02… con Blocco e Profilo base dati con lo stesso criterio
# Scrive catalogo/catalogo-governante-v4.csv (stesse colonne) e stampa il conto.
import csv, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "catalogo"
src = BASE / "catalogo-governante.csv"
dst = BASE / "catalogo-governante-v4.csv"

with src.open(encoding="utf-8-sig", newline="") as f:
    r = csv.reader(f, delimiter=";")
    righe = list(r)
intest = righe[0]
col = {n: i for i, n in enumerate(intest)}
dati = [x + [""] * (len(intest) - len(x)) for x in righe[1:] if any(c.strip() for c in x)]
assert len(dati) == 163, len(dati)
per_id = {x[col["ID"]]: x for x in dati}

def imposta(id_, **campi):
    x = per_id[id_]
    for k, v in campi.items():
        chiave = {"superficie": "Superficie", "regola": "Regola", "come": "Come si fa", "prodotto": "Prodotto", "controllo": "Controllo", "note": "Note", "note_piu": "Note"}[k]
        if k == "note_piu":
            x[col[chiave]] = (x[col[chiave]].rstrip(". ") + ". " if x[col[chiave]].strip() else "") + v
        else:
            x[col[chiave]] = v

unite = []
# ---- il testo delle foto dentro le righe di Michele (stesso ID, stessi minuti, stesso Blocco) ----
imposta("B24", superficie="Doccia: box (soffietto in PVC o vetro)",
        come="A ogni pulizia, dopo aver sciacquato: ante del box asciugate dall'alto in basso (tergivetro sul vetro, panno giallo sul soffietto in PVC), ante lasciate aperte. Ogni settimana anticalcare dentro: sul soffietto spazzolino morbido nelle pieghe, sul vetro spugna non graffiante, sciacquo e asciugatura. Ogni 2 settimane ante fuori e maniglia con il multiuso.",
        prodotto="anticalcare, multiuso",
        controllo="Ante del box senza gocce secche; pieghe del soffietto senza nero",
        note="Mai spugne abrasive: rigano il vetro e opacizzano il PVC. Mai tirare le ante del soffietto quando sono rigide"); unite.append("B24")
imposta("B25", superficie="Doccia: profili, guide del soffietto, guarnizioni",
        come="Spazzolino con anticalcare nelle guide in basso e nei profili, pieghe del soffietto aperte e passate; guarnizioni con l'antimuffa; sciacquo e asciugatura.",
        prodotto="anticalcare, antimuffa"); unite.append("B25")
imposta("B19", superficie="WC: cassetta (esterna, in plastica)",
        come="Rotoli di scorta tolti; sopra, davanti e dietro la cassetta con il panno rosso umido, tubo flessibile passato, pulsante o leva disinfettati; rotoli rimessi asciutti. Dentro ogni 3 mesi: anticalcare nella cassetta, 30 minuti, poi scarico."); unite.append("B19")
imposta("B05", superficie="Termosifone in ghisa o scaldasalviette",
        come="Termosifone spento: panno umido tra gli elementi, davanti, dietro e sopra; spazzola lunga dove non arriva la mano. Sulla ruggine non strofinare: segnalala.",
        note="Ruggine alla base: va carteggiato e riverniciato (Lavori di manutenzione), non spugna"); unite.append("B05")
imposta("C10", note_piu="Ruggine: Lavori di manutenzione, non strofinare"); unite.append("C10")
imposta("C13", come="Panno appena umido con lo sgrassatore delicato su tutte e due le facce, bordo sopra, stipite e cardini; subito asciugata. La scritta con il nome della stanza è un adesivo: solo panno asciutto, mai strofinare.",
        note="La scritta con il nome sulla porta è un adesivo: mai bagnarla né strofinarla. Porte del 1° piano in legno verniciato: mai acqua che cola"); unite.append("C13")
imposta("C38", come="Maniglie disinfettate a ogni pulizia. Ante fuori ogni 2 settimane: panno appena umido con il multiuso, subito asciugate. I mobili sono in laminato: mai acqua che cola sui bordi, si gonfiano.",
        note="Mobili in laminato di finto legno: panno strizzato bene, mai acqua sui bordi e sugli spigoli"); unite.append("C38")
imposta("B04", note="Finestrella con il telaio in legno: mai bagnare il legno, panno appena umido e subito asciutto"); unite.append("B04")
imposta("E02", superficie="Ringhiera, rete, muretto, soglia",
        come="Ringhiera, rete e muretto lavati con lo sgrassatore e asciugati, soglia della portafinestra passata. Sulla ruggine non insistere con la spugna: segnalala.",
        note="Ruggine su ringhiera e rete: va carteggiata e verniciata (Lavori di manutenzione)"); unite.append("E02")
imposta("Z03", superficie="Scale: gradini (marmo)",
        come="Scopati ogni giorno dall'alto in basso; lavati ogni settimana con detergente neutro per marmo, straccio ben strizzato, cartello 'bagnato'. Mai anticalcare né aceto sul marmo. Con la pioggia: 2 volte.",
        prodotto="detergente neutro per marmo", note="Gradini in marmo: mai acidi (anticalcare, aceto, limone)"); unite.append("Z03")
imposta("Z01", come=per_id["Z01"][col["Come si fa"]].rstrip(". ") + ". Pavimento e rivestimento in marmo dell'ingresso: detergente neutro, mai acidi.",
        note_piu="Marmo dell'ingresso: mai acidi"); unite.append("Z01")
imposta("Z08", come="Scopati ogni giorno, lavati ogni settimana con il prodotto giusto: 1° piano marmo rosso (detergente neutro, mai acidi), 2° piano gres (detersivo per pavimenti).",
        note="Prodotto secondo il materiale del piano"); unite.append("Z08")
imposta("Z06", note_piu="Mai spugna magica né acqua sui disegni dipinti delle scale: solo panno asciutto (vedi P13)"); unite.append("Z06")
imposta("Z09", note_piu="Spugna magica solo sulle pareti bianche, mai sui disegni dipinti del corridoio del 2° piano (vedi P13)"); unite.append("Z09")

# ---- le righe P dalle foto (ID;Posto;Superficie;Regola;Ogni quanto;Quando;Priorità;Minuti;Blocco;Profilo base;Come si fa;Prodotto;Controllo;Note) ----
P = [
 ["P01","Camera","Pannello fotografico sopra il letto","Solo panno asciutto","ogni mese","ripasso","2 lo vede l'ospite","3","Rotazione","No","Solo panno asciutto in microfibra dall'alto in basso, leggero. Mai acqua, mai spray, mai spugna: la stampa si rovina. Guarda che gli angoli e le giunte non si stiano staccando.","nessuno","Pannello senza polvere e senza angoli sollevati","Mai acqua né prodotti sul pannello fotografico. Angolo che si stacca: Lavori di manutenzione"],
 ["P02","Camera","Portapane a serrandina (se c'è)","Dentro e fuori","ogni 2 settimane","ripasso","3 nascosto","2","Rotazione","No","Serrandina alzata: briciole via, dentro e fuori con il panno appena umido, asciugato; serrandina provata (deve scorrere).","nessuno","Dentro il portapane: niente briciole",""],
 ["P03","Camera","Armadio in stoffa (se c'è)","Dentro, sopra e struttura","ogni mese","camera libera","3 nascosto","5","Camera libera","No","A camera libera: cerniera aperta, aspirato dentro, sopra e sui ripiani con la spazzola; struttura passata con il panno; una macchia sulla stoffa con panno umido e poco sapone, poi asciugato.","sapone neutro","Dentro l'armadio in stoffa: niente polvere né odore di chiuso","Mai bagnare molto la stoffa"],
 ["P04","Camera","Tapparella: cassonetto","Aspirato dentro","ogni 6 mesi","ripasso","3 nascosto","5","Rotazione","No","Apri il cassonetto e aspira la polvere e gli insetti; richiudi bene.","nessuno","Dentro il cassonetto: niente polvere accumulata",""],
 ["P05","Camera","Tende: bastone o binario","Spolverati","ogni mese","ripasso","3 nascosto","3","Rotazione","No","Con la scaletta: panno asciutto sul bastone o nel binario delle tende e sugli anelli.","nessuno","Dito sul bastone: pulito",""],
 ["P06","Camera","Materasso e cuscini: stato","Controllo di avvallamenti, molle, cuscini piatti o ingialliti","ogni 6 mesi","cambio completo","2 lo vede l'ospite","5","Dentro la totale","Sì","Guarda materasso e cuscini senza coprimaterasso: avvallamenti, molle che si sentono, cuscini piatti o ingialliti. I cuscini si cambiano ogni 2 anni. Scrivilo nella nota della pulizia.","nessuno","Nota scritta: a posto, oppure cosa cambiare","Materasso o cuscini da cambiare: Lavori di manutenzione"],
 ["P07","Bagno","Dispenser grande della carta igienica","Dentro e fuori, scorta","ogni 2 settimane","ripasso","1 igiene","2","Rotazione","Sì","Coperchio aperto: dentro e fuori con il panno umido e il disinfettante, rotolo di scorta dentro, coperchio richiuso e lucidato fuori.","disinfettante","Dispenser pulito fuori, rotolo dentro",""],
 ["P08","Bagno","Accappatoi","Cambiati","a ogni partenza, con i tecnici fissi ogni settimana","cambio completo","1 igiene","2","Dentro la totale","No","A ogni partenza l'accappatoio va in lavanderia e se ne appende uno pulito; con un ospite fisso si cambia ogni settimana insieme agli asciugamani. Guardalo alla luce prima di appenderlo.","detersivo 60 gradi","Accappatoio pulito e asciutto sul gancio","Con i tecnici fissi: cambiato ogni settimana con gli asciugamani"],
 ["P09","Cucina appartamenti","Barra con i mestoli appesi","Mestoli, forchettoni e ganci sgrassati","ogni 2 settimane","ripasso","1 igiene","3","Rotazione","Sì","Mestoli, forchettoni e ganci appesi alla barra lavati e sgrassati (prendono il grasso dei fornelli), barra passata con il panno verde, riappesi asciutti.","sgrassatore","Mestoli appesi non unti al tatto",""],
 ["P10","Balcone","Unità esterna del condizionatore","Griglia e alette spazzolate, niente vasi sopra","ogni 3 mesi","ripasso","3 nascosto","5","Rotazione","Sì","A condizionatore spento: niente vasi sopra (bloccano l'aria e la terra entra dentro), griglia e alette spazzolate a secco dall'alto in basso, foglie e polvere via da dietro e da sotto, cassetta esterna passata con il panno umido. Mai acqua a getto.","nessuno","Alette senza foglie né lanugine, niente vasi sopra","Mai acqua a getto e mai con il condizionatore acceso. Alette piegate o sporco dentro: Lavori di manutenzione"],
 ["P11","Balcone","Piante e sottovasi","Sottovasi vuoti, foglie secche via, acqua se serve","ogni settimana","ripasso","2 lo vede l'ospite","3","Rotazione","No","Sottovasi svuotati (acqua ferma = zanzare), foglie secche e fiori appassiti via, terra bagnata se è asciutta (un bicchiere d'acqua a pianta, due in estate), vasi spostati e pavimento passato sotto.","nessuno","Sottovasi vuoti e asciutti, niente foglie secche a terra","Se le piante le cura qualcun altro, spegnere la regola"],
 ["P12","Balcone","Muro, canaline e tubi","Ragnatele, righe nere, canalina del condizionatore","ogni 3 mesi","ripasso","3 nascosto","5","Rotazione","No","Ragnatele e polvere dal muro con la scopa, righe nere con spazzola e acqua e sapone, canalina del condizionatore e tubo dell'acqua passati con il panno umido.","sapone neutro","Muro senza ragnatele né righe nere, canalina pulita",""],
 ["P13","Zone comuni","Disegni dipinti sui muri (corridoio e scale del 2° piano)","Solo spolverati","ogni mese","giorno della zona","2 lo vede l'ospite","5","Giorno della zona","—","Solo piumino o panno asciutto, leggero, dall'alto in basso. MAI acqua, MAI spugna magica, MAI prodotti: il disegno si cancella. Un segno vero sul disegno si segnala, non si strofina.","nessuno","Disegni interi, senza polvere e senza aloni","Mai acqua, spugna magica o prodotti sui disegni dipinti: si cancellano"],
 ["P14","Zone comuni","Pouf contenitori e cuscini del corridoio (2° piano)","Aspirati, aperti, cuscini sprimacciati","ogni 2 settimane","giorno della zona","2 lo vede l'ospite","3","Giorno della zona","—","Pouf aspirati sopra e sui lati con la spazzola per tessuti, aperti e guardati dentro (roba dimenticata, polvere), cuscini sbattuti e sprimacciati, pavimento sotto passato.","nessuno","Sopra i pouf: niente polvere né peli; dentro in ordine",""],
 ["P15","Zone comuni","Cassapanca, lanterna, vasi, fiori finti, tovaglia del tavolino (ingresso e scale)","Spolverati, tovaglia cambiata se macchiata","ogni settimana","giorno della zona","2 lo vede l'ospite","5","Giorno della zona","—","Vasi, lanterna e lampada in vimini passati con il panno asciutto; fiori finti e pampas scossi fuori o soffiati con il phon ad aria fredda; tovaglia del tavolino scossa e cambiata se macchiata; cassapanca spolverata sopra e aperta per guardare dentro.","nessuno","Dito sul bordo del vaso e sulla cassapanca: pulito; tovaglia senza macchie",""],
]
ordine = ["ID","Posto","Superficie","Regola","Ogni quanto","Quando","Priorità","Minuti","Blocco","Profilo base","Come si fa","Prodotto","Controllo","Note"]
assert intest == ordine, intest
for p in P: assert len(p) == len(ordine), p[0]

with dst.open("w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, delimiter=";", quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
    w.writerow(intest)
    for x in dati: w.writerow(x)
    for p in P: w.writerow(p)
print(f"righe totali: {len(dati) + len(P)} · dal file: {len(dati)} · P dalle foto: {len(P)} · righe del file con il testo delle foto unito: {len(unite)} ({', '.join(unite)})")
