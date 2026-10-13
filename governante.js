// ============================================================================
//  LA GOVERNANTE  ·  la testa (niente schermate qui dentro)
//  Dalla 0.26 il catalogo è il FILE di Michele: catalogo/catalogo-governante-v4.csv → catalogo.js (generato).
//  Ogni riga del file ha un Blocco che dice come va caricata:
//    normale             = è una riga della lista della signora (ripasso/totale): non è una rifinitura, non entra nel budget
//    totale              = si fa nella totale come parte del lavoro (le parti a ritmo lungo diventano rifiniture della totale)
//    normale+rotazione   = la parte "a ogni pulizia" sta nella lista, la parte col ritmo lungo è una rifinitura
//    rotazione           = le vere rifiniture: 1-3 per passaggio, dentro il budget del passaggio
//    libera              = solo a camera vuota (il venerdì dei tecnici, o tra una partenza e un arrivo)
//    zona                = corridoi, scale, lavanderia nel giorno della signora
//    meteo               = scatta col meteo o nel mese fissato
//  Il budget è PER PASSAGGIO (dal Calendario vero): ripasso 15′, totale 30′, totale a camera libera 45′; profilo Base 0′/10′.
//  Due profili: Lusso (tutto il catalogo) e Base (solo le righe con Profilo base = Sì). Tre livelli: Igiene, Albergo, Lusso pieno.
// ============================================================================
import { aggiungiGiorni, giornoSettimana, giorniTra, lunediDi, soggiornoCopre, partiRoma, aISO, oggiISO, passaggiCamera, CALENDARIO_CAMERE, regimeDi, zonaDi, modoCamera, modoSoggiorno } from "./logica.js";
import { MODI } from "./regole.js";
export { regimeDi, modoCamera, modoSoggiorno, MODI };
import { RIGHE, PARTI, CHECKLIST, CALENDARIO_VERO, LIVELLI_TESTO, BLOCCHI_LISTA } from "./catalogo.js";
export { RIGHE, CHECKLIST, CALENDARIO_VERO, LIVELLI_TESTO, BLOCCHI_LISTA };

export const LUOGHI_COMUNI = [
  { id: "corridoio_p1",   nome: "Corridoio 1° piano",     zona: "p1", tipo: "comune" },
  { id: "corridoio_p2",   nome: "Corridoio 2° piano",     zona: "p2", tipo: "comune" },
  { id: "scale",          nome: "Scale di servizio",      zona: "p2", tipo: "comune" }, // le fa la signora del 2° piano (il sabato)
  { id: "ingresso",       nome: "Ingresso e portone",     zona: "p2", tipo: "comune" },
  { id: "terrazzo",       nome: "Terrazzo",               zona: "p2", tipo: "comune" },
  { id: "lavanderia",     nome: "Lavanderia e attrezzi",  zona: "p1", tipo: "comune" },
];
export const PANNI = "Colori dei panni: ROSSO solo WC · GIALLO resto del bagno · BLU camera · VERDE cucina. Mai lo stesso panno dal bagno alla camera.";
export const MATERIALI = {
  pavimento: {
    marmo: { nome: "marmo o granito lucido", come: "solo detergente neutro per marmo (o acqua e poco sapone di Marsiglia), straccio ben strizzato, asciugato subito per non lasciare aloni", mai: "MAI anticalcare, aceto, limone, candeggina o sgrassatore forte: macchiano il marmo per sempre e lo opacizzano" },
    gres: { nome: "piastrelle di gres (color cotto)", come: "detersivo per pavimenti normale, acqua calda, straccio strizzato; sulle fughe scure spazzola con bicarbonato", mai: "mai cera o prodotti lucidanti (poi scivola e fa le impronte); mai candeggina pura sulle fughe colorate" },
    cotto: { nome: "cotto vero", come: "solo acqua tiepida e sapone neutro, poca acqua, straccio strizzato; macchie con bicarbonato", mai: "mai acidi (anticalcare, aceto) e mai troppa acqua: il cotto assorbe" },
    legno: { nome: "parquet o legno", come: "panno appena umido con detergente per parquet, mai acqua in terra", mai: "mai acqua abbondante, mai vapore, mai aceto" },
  },
  box: {
    soffietto: { nome: "box doccia a soffietto in PVC", come: "ante piegate e aperte, anticalcare lasciato 5 minuti nelle pieghe, spazzolino morbido dentro le pieghe e nelle guide, sciacquo, asciugatura con il panno GIALLO; ante lasciate aperte ad asciugare", mai: "mai spugne abrasive né candeggina pura: il PVC si opacizza e ingiallisce; mai tirare le ante quando sono rigide" },
    vetro: { nome: "box doccia in vetro", come: "anticalcare 5 minuti, spugna non graffiante, tergivetro, panno asciutto", mai: "mai spugne abrasive né lame: rigano il vetro" },
    tenda: { nome: "tenda della doccia", come: "tenda stesa e lasciata aperta ad asciugare; lavata in lavatrice a 40° con bicarbonato ogni mese", mai: "mai lasciarla appallottolata bagnata: fa la muffa in due giorni" },
    nessuno: { nome: "doccia senza box", come: "piatto e piastrelle intorno asciugati dopo ogni pulizia", mai: "" },
  },
  mobili: {
    laminato: { nome: "mobili in laminato di finto legno (truciolato dentro)", come: "panno umido ben strizzato, mai bagnato; bordi e giunzioni asciugati subito, perché se l'acqua entra nelle giunzioni il bordo si gonfia e non torna più", mai: "mai spugne abrasive, mai vapore, mai acetone o alcol; mai acqua che resta sui bordi" },
    legno: { nome: "mobili in legno verniciato", come: "panno appena umido nel verso delle venature, subito asciugato", mai: "mai acqua che cola, mai sgrassatore forte o alcol: la vernice si opacizza" },
  },
  porte: {
    legno: { nome: "porta in legno verniciato scuro", come: "panno appena umido e subito asciutto, nel verso delle venature; la scritta con il nome solo con il panno asciutto", mai: "mai acqua che cola, mai sgrassatore forte o alcol: la vernice si opacizza" },
    laminato: { nome: "porta in laminato chiaro", come: "panno umido con il multiuso, asciugata; la scritta con il nome solo con il panno asciutto", mai: "mai acqua sui bordi e sugli spigoli: il laminato si gonfia; mai spugne abrasive" },
  },
};
// Che materiali ha un posto, partendo da quello che si vede nelle foto (1° piano marmo rosso e porte in legno scuro,
// 2° piano gres color cotto e porte in laminato chiaro, appartamenti marmo rosso; box a soffietto dappertutto)
export function materialiBase(luogo) {
  if (!luogo) return { pavimento: "gres", box: "soffietto", porte: "laminato", mobili: "laminato" };
  if (luogo.tipo === "comune") return { pavimento: luogo.id === "corridoio_p2" || luogo.id === "terrazzo" || luogo.id === "lavanderia" ? "gres" : "marmo", box: "nessuno", porte: luogo.id === "corridoio_p2" ? "laminato" : "legno", mobili: "laminato" };
  if (luogo.zona === "p1") return { pavimento: "marmo", box: "soffietto", porte: "legno", mobili: "laminato" };
  if (luogo.zona === "p2") return { pavimento: "gres", box: "soffietto", porte: "laminato", mobili: "laminato" };
  return { pavimento: "marmo", box: "soffietto", porte: "laminato", mobili: "laminato" };
}
export function materialiDi(luogo, impostati = {}) { return { ...materialiBase(luogo), ...((impostati || {})[luogo?.id] || {}) }; }
// La riga da aggiungere al "come si fa" per una regola che dipende dal materiale
export function rigaMateriale(regola, luogo, impostati = {}) {
  if (!regola || !regola.materiale || !luogo) return null;
  const scelta = materialiDi(luogo, impostati)[regola.materiale]; const m = (MATERIALI[regola.materiale] || {})[scelta];
  if (!m) return null;
  const mai = m.mai ? m.mai.charAt(0).toUpperCase() + m.mai.slice(1) : "";
  return { tipo: regola.materiale, scelta, nome: m.nome, come: m.come, mai, testo: `${luogo.nome}: ${m.nome} → ${m.come}.${mai ? " " + mai + "." : ""}` };
}
// La scheda dei materiali (per la signora e per la mamma): come si tratta ogni cosa che c'è davvero nelle stanze
export const SCHEDA_MATERIALI = [
  { nome: "Marmo e granito lucidi", dove: "pavimenti rossi del 1° piano e degli appartamenti, ingresso, scale, rivestimento dell'ingresso", come: MATERIALI.pavimento.marmo.come, mai: MATERIALI.pavimento.marmo.mai },
  { nome: "Piastrelle di gres color cotto", dove: "pavimenti del 2° piano e del corridoio, balconi", come: MATERIALI.pavimento.gres.come, mai: MATERIALI.pavimento.gres.mai },
  { nome: "Ceramica del bagno (piastrelle a fiori, sanitari)", dove: "tutti i bagni", come: "multiuso o anticalcare sulle piastrelle lisce, spugna morbida; sulle fughe spazzolino con bicarbonato; sanitari con disinfettante", mai: "mai candeggina pura sulle fughe colorate (le sbiadisce), mai pagliette" },
  { nome: "Rubinetti e docce cromate", dove: "lavandini, bidet, docce, cucine", come: "anticalcare sul panno, 2 minuti, sciacquo, lucidatura con il panno asciutto; filtrino svitato nell'aceto", mai: "mai anticalcare lasciato asciugare sul cromo (lo macchia), mai pagliette" },
  { nome: "Box doccia a soffietto in PVC", dove: "quasi tutti i bagni", come: MATERIALI.box.soffietto.come, mai: MATERIALI.box.soffietto.mai },
  { nome: "Mobili in laminato di finto legno (truciolato dentro)", dove: "letti, comodini, armadi, cucine, piani in laminato puntinato: tutti i mobili delle stanze", come: MATERIALI.mobili.laminato.come, mai: MATERIALI.mobili.laminato.mai },
  { nome: "Porte in legno verniciato scuro", dove: "1° piano", come: MATERIALI.porte.legno.come, mai: MATERIALI.porte.legno.mai },
  { nome: "Vetri e specchi", dove: "finestre, portefinestre, specchi, mensola di vetro del bagno", come: "detergente vetri sul panno (non sul vetro), tergivetro o panno asciutto, bordi asciugati", mai: "mai abrasivi; mai spruzzare sullo specchio (cola dietro e lo macchia)" },
  { nome: "Ferro: ringhiere, reti e termosifoni in ghisa", dove: "balconi, bagni, corridoi", come: "panno umido e asciugatura; ragnatele via con la spazzola", mai: "mai insistere sulla ruggine con la spugna: si segnala, va carteggiata e riverniciata" },
  { nome: "Disegni dipinti sui muri e pannelli fotografici", dove: "corridoio e scale del 2° piano, sopra i letti", come: "solo piumino o panno asciutto, leggerissimo", mai: "MAI acqua, MAI spugna magica, MAI prodotti: si cancellano" },
  { nome: "Stoffa: pouf, armadio in stoffa, tende, cuscini", dove: "corridoio del 2° piano, camere", come: "aspirapolvere con la spazzola per tessuti; macchie con panno umido e poco sapone", mai: "mai bagnare molto, mai candeggina" },
  { nome: "Plastica: cassette del WC, dispenser, cestini, sedie del balcone", dove: "bagni, balconi", come: "sgrassatore delicato o multiuso, panno, asciugatura", mai: "mai alcol né acetone (la plastica si opacizza)" },
];

// ============================================================================
//  IL CATALOGO: le parti del file, con il prezzo a minuto
// ============================================================================
export const EURO_MINUTO = 0.25; // (fino alla 0.26: prezzo a minuto; dalla 0.27 si usa il listino a fasce qui sotto)
// Il listino delle stelle: Michele lo cambia in Paghe → Listino (impostazioni/governante.prezziStelle); tre fasce di minuti
export const PREZZI_STELLE_BASE = { fino5: 1, fino10: 2, oltre10: 3 };
export function prezziStelle(imp) { return { ...PREZZI_STELLE_BASE, ...((imp && imp.prezziStelle) || {}) }; }
export function prezzoStella(minuti, prezzi = PREZZI_STELLE_BASE) { const m = Number(minuti) || 0; return Number(m <= 5 ? prezzi.fino5 : m <= 10 ? prezzi.fino10 : prezzi.oltre10) || 0; }
export const CATALOGO = PARTI.map(p => ({ ...p, euro: prezzoStella(p.minuti) }));
export const REGOLE_GOVERNANTE = CATALOGO;
export const RIGA_DI = Object.fromEntries(RIGHE.map(r => [r.id, r]));
export const GRUPPI = { camera: "Camera", bagno: "Bagno", cucina: "Cucina (appartamenti)", balcone: "Balcone", stagioni: "Meteo e stagioni", comuni: "Zone comuni", lavanderia: "Lavanderia e attrezzi", P: "Le tue regole" };
export const PRIORITA_TESTO = { 1: "igiene", 2: "lo vede l'ospite", 3: "nascosto" };
export const BLOCCHI_TESTO = { normale: "nella lista della signora", totale: "nella totale", "normale+rotazione": "lista + rifinitura", rotazione: "rifinitura", libera: "a camera libera", zona: "giorno della zona", meteo: "meteo e stagione" };
export const QUANDO_TESTO = { ripasso: "in qualunque passaggio", cambio: "nella totale", libera: "a camera libera", giornata: "nel giorno della zona", giorno: "lavoro a sé", meteo: "quando scatta il meteo" };
// Gli id delle regole prima della 0.26 (nomi corti) → il codice della riga di Michele: serve per il registro vecchio e per la mappa
export const VECCHI_ID = {
  "specchi": "C46",
  "davanzali": "C16",
  "telai_binari": "C17",
  "vetri_interni": "C18",
  "vetri_esterni": "C19",
  "dietro_tv": "C43",
  "tende_aspirate": "C22",
  "sotto_letto": "C24",
  "sopra_armadi": "C37",
  "battiscopa": "C11",
  "porte": "C13",
  "porte_ditate": "C12",
  "lampade": "C36",
  "pareti_ditate": "C06",
  "contatti": "C05",
  "plafoniere": "C01",
  "quadri": "C08",
  "prese_ciabatte": "C44",
  "lampadari": "C02",
  "coprimaterasso_cambio": "C30",
  "coprimaterasso_fissi": "C30",
  "coperta_scorta": "C34",
  "controllo_lusso": "C56",
  "dentro_armadi": "C39",
  "materasso_aspirato": "C28",
  "materasso_girato": "C29",
  "cuscini_piumoni": "C31",
  "controllo_materassi": "P06",
  "letto_spostato": "C27",
  "dietro_mobili": "C58",
  "dietro_armadi": "C58",
  "tende_lavate": "C23",
  "camera_base": "C52",
  "testiera": "C25",
  "struttura_letto": "C26",
  "doghe": "C26",
  "copriletto": "C33",
  "comodini": "C35",
  "comodini_dentro": "C35",
  "armadio_ante": "C38",
  "sotto_mobili": "C58",
  "scrivania": "C41",
  "tv_schermo": "C42",
  "minibar": "C45",
  "minibar_guarnizione": "C45",
  "minibar_retro": "C45",
  "bollitore": "C48",
  "bollitore_calcare": "C48",
  "appendiabiti": "C49",
  "ventilatore": "C50",
  "pavimento_angoli": "C52",
  "pavimento_fughe": "C52",
  "zerbino_camera": "C53",
  "tappeti": "C53",
  "tappeti_lavati": "C53",
  "targhette": "C14",
  "quadri_retro": "C08",
  "porta_stipite": "C13",
  "davanzale_esterno": "C19",
  "tapparelle": "C20",
  "tapparelle_cassonetto": "P04",
  "zanzariere": "C21",
  "tende_bastone": "P05",
  "termosifone_polvere": "C10",
  "biancheria_luce": "B37",
  "aria_odori": "C54",
  "luci_lampadine": "C55",
  "fotomurale": "P01",
  "portapane": "P02",
  "armadio_stoffa": "P03",
  "fondo_completa": "C57",
  "arrivo_ferma": "O02",
  "bagno_base": "B34",
  "dotazioni_bagno": "B38",
  "asciugamani_luce": "B37",
  "scarico_pavimento": "B35",
  "scarichi_odori": "B36",
  "soffitto_bagno_muffa": "B01",
  "aspiratore": "B03",
  "scaldasalviette": "B05",
  "piastrelle_pareti": "B06",
  "troppopieno": "B13",
  "mobiletto_bagno": "B14",
  "dispenser": "B16",
  "wc_tavoletta": "B17",
  "wc_sotto_bordo": "B17",
  "wc_cassetta": "B19",
  "accessori_bagno": "B31",
  "box_doccia_tergivetro": "B24",
  "box_doccia_vetro": "B24",
  "box_doccia_fuori": "B24",
  "box_doccia_binari": "B25",
  "tenda_doccia": "B29",
  "tappetino_doccia": "B30",
  "tappetini_bagno": "B33",
  "doccia_muffa": "B08",
  "scarichi": "B36",
  "spazzolino_wc": "B20",
  "scopino_nuovo": "B20",
  "dietro_wc": "B18",
  "piastrelle_doccia": "B06",
  "fughe": "B07",
  "soffione_rubinetti": "B26",
  "sotto_lavandini": "B14",
  "phon_filtro": "C47",
  "cestini_lavati": "C51",
  "dispenser_carta": "P07",
  "accappatoi": "P08",
  "finestrella_bagno": "B04",
  "pensili_ante": "K01",
  "pensili": "K01",
  "cappa_esterno": "K02",
  "cappa_filtri": "K02",
  "fornelli_fondo": "K03",
  "sotto_lavello": "K06",
  "lavastoviglie_partenza": "K07",
  "lavastoviglie_esterno": "K07",
  "lavastoviglie_filtro": "K07",
  "frigo_partenza": "K08",
  "frigo_ripiani": "K08",
  "guarnizioni_frigo": "K08",
  "frigo_sbrinato": "K08",
  "dietro_frigo": "K08",
  "microonde_fondo": "K09",
  "moka": "K10",
  "tavolo_sedie": "K11",
  "bidoni_cucina": "K12",
  "bidoni_calendario": "K12",
  "forno": "K04",
  "dietro_fornelli": "K14",
  "cucina_base": "K05",
  "inventario_stoviglie": "K15",
  "barra_utensili": "P09",
  "balcone_scopa": "E01",
  "balcone_lavato": "E01",
  "balcone_fondo": "E02",
  "condizionatore_esterno": "P10",
  "piante_balcone": "P11",
  "pareti_balcone": "P12",
  "coperte_autunno": "M01",
  "coperte_primavera": "M01",
  "condizionatori_maggio": "M02",
  "condizionatore_filtri": "C03",
  "condizionatore_griglie": "C04",
  "termosifoni": "M03",
  "scarichi_terrazzo": "Z10",
  "corridoio_passata": "Z08",
  "corridoio_fondo": "Z08",
  "corridoio_quadri_estintore": "Z09",
  "scale_scopate": "Z03",
  "scale_lavate": "Z03",
  "scale_corrimano": "Z05",
  "scale_pareti_luci": "Z06",
  "vetri_scale": "Z07",
  "ingresso": "Z01",
  "zerbini_lavati": "Z02",
  "terrazzo_scopa": "Z10",
  "terrazzo_fondo": "Z10",
  "stendini": "L11",
  "bidoni": "Z11",
  "luci_esterne": "Z12",
  "murales": "P13",
  "pouf_corridoio": "P14",
  "decorazioni": "P15",
  "lavatrice_cassetto": "L01",
  "lavatrice_zona": "L05",
  "asciugatrice": "L06",
  "lavatoio": "L07",
  "ripostiglio_prodotti": "Z14",
  "lavatrice_vuoto": "L04",
  "scalinata_lavanderia": "L10",
  "scaffali_lavanderia": "L08",
  "mappine": "L14",
  "microfibra": "L15",
  "carrello": "L12",
  "scope": "L17",
  "spugne": "L16",
  "guanti": "L19",
  "aspirapolvere": "L18",
  "scorte": "L20",
  "biancheria_scorta": "L21",
  "controllo_piegatura": "L22",
  "ferro_stiro": "L23"
};
export function nuovoId(vecchio) {
  if (!vecchio) return vecchio;
  if (CATALOGO.some(p => p.id === vecchio)) return vecchio;
  const codice = VECCHI_ID[vecchio]; if (!codice) return vecchio;
  const parti = CATALOGO.filter(p => p.codice === codice && p.tipo === "rotazione");
  return parti.length ? parti[0].id : codice;
}
// Soglie di partenza (si cambiano dall'app)
export const SOGLIE_BASE = { camereSettimana: 2, freddoGradi: 12, automatico: false, zonaMinuti: 20, budgetStelle: 350 };
export const BUDGET_BASE = { ripasso: 15, totale: 30, libera: 45, baseRipasso: 10, baseTotale: 25 }; // (i budget veri stanno nei MODI)
export const STELLE_MAX = { ripasso: 2, totale: 3, libera: 5 }; // il tetto lo decide il tipo di passaggio (Michele, specifiche §10): 2 ripasso · 3 totale · 5 totale a camera libera; il modo può solo abbassarlo
export const SCALA_OGNI = [1, 3.5, 7, 14, 21, 30, 45, 60, 90, 120, 180, 365];
export function etichettaOgni(g) {
  if (!g) return "a ogni pulizia";
  if (g <= 1) return "ogni giorno di lavoro";
  if (g <= 3.5) return "2 volte a settimana";
  if (g === 7) return "ogni settimana";
  if (g === 14) return "ogni 2 settimane";
  if (g === 18) return "ogni 2-3 settimane";
  if (g === 21) return "ogni 3 settimane";
  if (g === 30) return "ogni mese";
  if (g === 35) return "ogni 4-6 settimane";
  if (g === 45) return "ogni 6 settimane";
  if (g === 60) return "ogni 2 mesi";
  if (g === 75) return "ogni 2-3 mesi";
  if (g === 90) return "ogni 3 mesi";
  if (g === 120) return "ogni 4 mesi";
  if (g === 150) return "due volte l'anno";
  if (g === 180) return "ogni 6 mesi";
  if (g >= 365) return "una volta l'anno";
  return `ogni ${g} giorni`;
}

// ============================================================================
//  I TRE MODI legati all'ospite (Michele, specifiche §1): il catalogo è uno, cambia solo il ritmo.
//  OPERAI: igiene a ritmo pieno (cucina più spesso), estetica a un terzo, nascosto solo nella fondo completa; stelle: nessuna nel
//  ripasso, fino a 2 di igiene nella totale del giovedì. TECNICI: igiene piena, estetica e nascosto a metà ritmo. BOOKING: tutto a ritmo pieno,
//  stelle prima su quello che l'ospite vede e tocca. I moltiplicatori si cambiano con + e − (impostazioni/governante.modi).
// ============================================================================
export const MODI_BASE = {
  operai:  { p1: 1, p2: 3, p3: 0, cucina: 0.5, budget: { ripasso: 10, totale: 25, libera: 25 }, stelle: { ripasso: 0, totale: 2, libera: 2 }, soloIgiene: true, visibilePrima: false },
  tecnici: { p1: 1, p2: 2, p3: 2, cucina: 1,   budget: { ripasso: 15, totale: 30, libera: 45 }, stelle: { ripasso: 2, totale: 3, libera: 5 }, soloIgiene: false, visibilePrima: false },
  booking: { p1: 1, p2: 1, p3: 1, cucina: 1,   budget: { ripasso: 15, totale: 30, libera: 30 }, stelle: { ripasso: 2, totale: 2, libera: 2 }, soloIgiene: false, visibilePrima: true },
};
export const NOMI_MODI = ["tecnici", "operai", "booking"];
// l'igiene della cucina che negli appartamenti degli operai va più spesso del ritmo scritto: cappa, forno, bidoni, frigo, scarichi
export const IGIENE_CUCINA = new Set(["K02", "K04", "K12", "K08", "K06", "B36", "K07"]);
export const MOLTIPLICATORI = [0, 0.5, 1, 2, 3];
export function modiDi(imp, oggi = oggiISO()) {
  const m = (imp && imp.modi) || {}; const out = {};
  for (const k of NOMI_MODI) out[k] = { ...MODI_BASE[k], ...(m[k] || {}), budget: { ...MODI_BASE[k].budget, ...((m[k] || {}).budget || {}) }, stelle: { ...MODI_BASE[k].stelle, ...((m[k] || {}).stelle || {}) } };
  // il "freno sul nascosto" (dalla chat, domanda 7): fino a quella data la priorità 3 non entra come stella in nessun modo
  const fr = imp && imp.freno; if (fr && fr.fino && oggi && fr.fino >= oggi) for (const k of NOMI_MODI) out[k].p3 = 0;
  return out;
}
export function modoValido(m) { return NOMI_MODI.includes(m) ? m : "tecnici"; }
// La regola in quel modo: fuoriModo = non si fa come stella in quel modo (solo nella pulizia a fondo completa); grigio chiaro nel Tabellone
export function applicaModo(r, modo, modi) {
  if (r.tipo !== "rotazione" || r.quando === "giornata" || r.sempre || r.personale) return { ...r, modo };
  const m = modi[modoValido(modo)]; const pr = r.priorita || 2;
  let k = pr === 1 ? m.p1 : pr === 2 ? m.p2 : m.p3;
  if (pr === 1 && m.cucina !== 1 && IGIENE_CUCINA.has(r.codice)) k = m.cucina;
  if (!k) return { ...r, modo, fuoriModo: true, fuoriLivello: true };
  if (k === 1 || !r.ogni) return { ...r, modo };
  return { ...r, modo, ogni: Math.round(r.ogni * k * 10) / 10, ogniScritto: r.ogni, ogniMezza: r.ogniMezza ? Math.round(r.ogniMezza * k * 10) / 10 : r.ogniMezza };
}
// Le regole con sopra le modifiche fatte dall'app (impostazioni/governante) e, se si chiede un modo, i suoi ritmi
export function regoleAttive(imp, opz = {}) {
  const mod = (imp && imp.regole) || {}, personali = (imp && imp.personali) || {};
  const prezzi = prezziStelle(imp);
  const base = CATALOGO.map(r => { const m = { ...(mod[r.codice] || {}), ...(mod[r.id] || {}) }; delete m.dentroTotale; const x = { ...r, ...m, euro: prezzoStella(m.minuti ?? r.minuti, prezzi) }; if (mod[r.codice]?.attiva === false) x.attiva = false; return x; });
  const extra = Object.values(personali).map(r => ({ priorita: 2, euro: 0, quando: "ripasso", gruppo: "P", icona: "stella", controllo: "", tipo: "rotazione", blocco: "rotazione", ...r, codice: r.id, personale: true, ...(mod[r.id] || {}) }));
  const tutte = [...base, ...extra].filter(r => r.attiva !== false);
  if (!opz.modo) return tutte;
  const modi = opz.modi || modiDi(imp, opz.oggi);
  return tutte.map(r => applicaModo(r, opz.modo, modi));
}
// le regole di ogni modo, calcolate una volta per contesto
export function regolePerModo(ctx, modo) { const k = modoValido(modo); ctx._regoleModo = ctx._regoleModo || {}; if (!ctx._regoleModo[k]) ctx._regoleModo[k] = regoleAttive(ctx.imp, { modo: k, oggi: ctx.oggi }); return ctx._regoleModo[k]; }
// Il modo di un posto in un giorno (dal prospetto): per le zone comuni non ha senso → tecnici
export function modoDi(l, iso, ctx) { if (!l || l.tipo === "comune") return "tecnici"; return modoValido(modoCamera(l, iso, ctx.soggiorni || [], ctx.clienti || {}, ctx.regoleBase)); }
export function soglie(imp) { return { ...SOGLIE_BASE, ...((imp && imp.soglie) || {}) }; }

// ============================================================================
//  IL CALENDARIO VERO: i passaggi delle signore, camera per camera (dal foglio "Calendario vero")
//  passaggio = { giorno 0-6, tipo ripasso|totale, budget minuti di rifiniture, libera (camera vuota dopo), base, zona, daConfermare }
// ============================================================================
export const CALENDARIO = (() => {
  const out = {};
  for (const v of CALENDARIO_VERO) { if (!v.tipo || !v.posti.length) continue; for (const id of v.posti) (out[id] = out[id] || []).push({ giorno: v.giorno, tipo: v.tipo, budget: v.budget, libera: !!v.libera, base: !!v.base, zona: v.zona, daConfermare: !!v.controlla, oppure: !!v.oppure, insieme: v.insieme || "" }); }
  return out;
})();
export function passiDi(cameraId) { return CALENDARIO[cameraId] || []; }
// Il passaggio di una pulizia: dal calendario se c'è, altrimenti dal tipo di pulizia
export function passoDi(p, camera, imp, regoleBase, ctx = {}) {
  const tipo = p.tipo === "totale" || p.tipo === "totale_casa" ? "totale" : "ripasso";
  const regime = p.regime || regimeDi(p.data, regoleBase);
  const modo = modoValido(p.modo || modoCamera(camera, p.data, ctx.soggiorni || [], ctx.clienti || {}, regoleBase));
  const m = modiDi(imp)[modo];
  // camera vuota dopo la pulizia: l'ospite parte e non arriva nessuno, oppure la pulizia è stata messa a mano su una camera senza nessuno
  const vuotaDopo = p.partenza ? !p.arrivo : (p.soggiorno === null && !p.ospite);
  const libera = tipo === "totale" && vuotaDopo;
  const fascia = tipo === "ripasso" ? "ripasso" : libera ? "libera" : "totale";
  const cal = regime === "estate" ? null : (passiDi(p.camera).find(x => x.giorno === giornoSettimana(p.data) && x.tipo === tipo) || null);
  const budget = cal && cal.libera === libera ? cal.budget : m.budget[fascia];
  const stelle = Math.min(STELLE_MAX[fascia], m.stelle[fascia]);
  return { tipo, budget, libera, modo, base: modo === "operai", soloIgiene: !!m.soloIgiene, visibilePrima: !!m.visibilePrima, stelle, daCalendario: !!cal, daConfermare: !!(cal && cal.daConfermare), aperto: !!(CALENDARIO_CAMERE[p.camera] && CALENDARIO_CAMERE[p.camera].aperto), regime, estate: regime === "estate", insieme: (cal && cal.insieme) || p.insieme || "" };
}

// ============================================================================
//  LA LISTA DELLA SIGNORA: le righe grandi del foglio "Checklist signora" per quel passaggio
// ============================================================================
// L'ordine dei blocchi sullo schermo: letto · bagno · camera · cucina · alla partenza · pavimenti e controllo finale (il controllo chiude la camera)
export const ORDINE_BLOCCHI = BLOCCHI_LISTA.map(b => b.id);
export const BLOCCO_DI = Object.fromEntries(BLOCCHI_LISTA.map(b => [b.id, b]));
export function righeLista(passo, casa, partenza) {
  const prendi = (lista) => CHECKLIST.filter(c => c.lista === lista && !c.slot && (!c.soloPartenza || partenza) && (!c.soloTotale || passo.tipo === "totale"));
  let righe;
  if (passo.base) righe = passo.tipo === "totale" ? [...prendi("base_ripasso"), ...prendi("base_totale")] : prendi("base_ripasso");
  else { righe = prendi("ripasso"); if (passo.tipo === "totale") righe = [...righe, ...prendi("totale")]; if (casa) righe = [...righe, ...prendi("cucina")]; }
  // dentro ogni blocco l'ordine del foglio; "Prima di chiudere" sempre per ultima
  const ord = c => ORDINE_BLOCCHI.indexOf(c.blocco || "camera");
  return righe.map((c, i) => ({ ...c, _i: i })).sort((a, b) => (ord(a) - ord(b)) || (/^prima di chiudere/i.test(a.testo) - /^prima di chiudere/i.test(b.testo)) || (a._i - b._i)).map(({ _i, ...c }) => c);
}
// A quale blocco va una stella: letto per le cose del letto, bagno per i codici B, cucina per i K, camera per il resto
const CODICI_LETTO = new Set(["C24", "C25", "C26", "C27", "C28", "C29", "C30", "C31", "C32", "C33", "C34", "B37", "P06", "M01"]);
export function bloccoStella(s) { const c = String(s.codice || ""); if (CODICI_LETTO.has(c)) return "letto"; if (c[0] === "B") return "bagno"; if (c[0] === "K") return "cucina"; if (/bagno/i.test(s.posto || "")) return "bagno"; if (/cucina/i.test(s.posto || "")) return "cucina"; return "camera"; }
export function codiciLista(passo, casa, partenza) { return new Set(righeLista(passo, casa, partenza).flatMap(c => c.codici)); }
export function minutiLista(passo, casa, partenza) { return righeLista(passo, casa, partenza).reduce((s, c) => s + (c.minuti || 0), 0); }
// La riga "Una cosa di igiene a rotazione (una per volta)" del profilo Base: da quali cose si pesca per prima
export function slotBase(passo) { const c = CHECKLIST.find(x => x.slot && x.lista === (passo.tipo === "totale" ? "base_totale" : "base_ripasso")); return c ? new Set(c.codici) : null; }
// Una parte a ritmo corto (entro la settimana) è già fatta dalla lista del passaggio se una riga grande nomina il suo codice
// e, quando la parte ha un nome ("lavato", "a bagno"), anche quella parola: "Cestini svuotati" non copre "Cestino — lavato"
const radice = w => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 5);
export function copertaDallaLista(r, righe) {
  if (r.tipo !== "rotazione" || !r.ogni || r.ogni > 7) return false;
  const mie = righe.filter(c => c.codici.includes(r.codice)); if (!mie.length) return false;
  const parole = String(r.parte || "").split(/[^a-zà-ú]+/i).filter(w => w.length >= 4).map(radice);
  if (!parole.length) return true;
  return mie.some(c => { const testo = c.testo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); return parole.every(w => testo.includes(w)); });
}
// Tutte le parti che un passaggio fatto per intero copre: le voci della lista e le parti a ritmo corto nominate dalla lista
export function coperteDalPasso(p, camera, ctx) {
  const regole = ctx.regole || regoleAttive(ctx.imp); const passo = passoDi(p, camera, ctx.imp || null, ctx.regoleBase, ctx);
  const righe = righeLista(passo, camera.tipo === "casa", !!p.partenza); const codici = new Set(righe.flatMap(c => c.codici));
  return regole.filter(r => (r.tipo === "lista" && codici.has(r.codice) && (r.quando !== "cambio" || passo.tipo === "totale")) || copertaDallaLista(r, righe)).map(r => r.id);
}

// ============================================================================
//  DOVE VALE UNA REGOLA, STAGIONI, SCADENZE, REGISTRO
// ============================================================================
export function luoghiDi(regola, camere, luoghi = LUOGHI_COMUNI, flags = {}) {
  const d = regola.dove;
  if (Array.isArray(d)) return d.flatMap(x => luoghiDi({ ...regola, dove: x }, camere, luoghi, flags));
  if (regola.soloFrigo) return camere.filter(c => (flags.frigo || {})[c.id] || c.frigo);
  if (d === "camera" || d === "camere") return camere.filter(c => c.tipo !== "casa");
  if (d === "cucina" || d === "case") return camere.filter(c => c.tipo === "casa");
  if (d === "bagno" || d === "stanza" || d === "stanze" || d === "tutte") return camere.slice();
  if (d === "balcone") return camere.filter(c => (flags.balconi || {})[c.id] || c.balcone);
  if (d && d.startsWith("zona:")) return camere.filter(c => c.zona === d.slice(5));
  if (d && d.startsWith("camera:")) return camere.filter(c => c.id === d.slice(7));
  const l = luoghi.find(x => x.id === d); return l ? [l] : [];
}
export function trovaLuogo(id, camere, luoghi = LUOGHI_COMUNI) { return camere.find(c => c.id === id) || luoghi.find(l => l.id === id) || null; }
const memoCopre = new WeakMap();
function copre(regole, r, l, camere, luoghi, flags) {
  let m = memoCopre.get(regole); if (!m) { m = new Map(); memoCopre.set(regole, m); }
  const k = `${r.id}|${l.id}`; let v = m.get(k);
  if (v === undefined) { v = luoghiDi(r, camere, luoghi, flags).some(x => x.id === l.id); m.set(k, v); }
  return v;
}
function inFinestra(f, iso) { const mg = iso.slice(5); return f.da <= f.a ? (mg >= f.da && mg <= f.a) : (mg >= f.da || mg <= f.a); }
function finestre(regola) { const a = regola.stagione ? (Array.isArray(regola.stagione) ? regola.stagione : [regola.stagione]) : []; const b = regola.stagioneMezza ? regola.stagioneMezza : []; return [...a, ...b]; }
export function inStagione(regola, iso) { const fin = finestre(regola); if (!fin.length) return true; return fin.some(f => inFinestra(f, iso)); }
export function ogniAttuale(regola, iso, luogo, flags = {}) {
  let g = regola.ogni || 0;
  if (regola.stagioneMezza && regola.ogniMezza && regola.stagioneMezza.some(f => inFinestra(f, iso))) g = regola.ogniMezza;
  if (regola.strada && luogo && ((flags.strada || {})[luogo.id] || luogo.strada)) g = Math.max(1, g / 2);
  return g;
}
export function rapportoScadenza(regola, ultima, oggi, ogni) { const g = ogni ?? regola.ogni; if (!g) return null; if (!ultima) return Infinity; return giorniTra(ultima, oggi) / g; }
export function coloreScadenza(rapporto) { return rapporto === Infinity || rapporto == null || rapporto >= 1 ? "rosso" : rapporto >= 0.75 ? "giallo" : "verde"; }
export function testoUltima(ultima, oggi) {
  if (!ultima) return "mai";
  const g = giorniTra(ultima, oggi);
  if (g <= 0) return "oggi"; if (g === 1) return "ieri"; if (g < 7) return `${g} giorni fa`;
  if (g < 30) return `${Math.round(g / 7)} settimane fa`;
  if (g < 365) { const m = Math.round(g / 30); return m === 1 ? "1 mese fa" : `${m} mesi fa`; }
  return "più di un anno fa";
}
export function chiaveRegistro(regola, luogo) { return `${regola}|${luogo}`; }
export function ultimaVolta(registro, regola, luogo) { return (registro && registro[chiaveRegistro(regola, luogo)]) || null; }
export function inizioGovernante(ctx) { if (ctx.inizio) return ctx.inizio; const date = Object.values(ctx.registro || {}).map(v => v && v.ultima).filter(Boolean).sort(); return date[0] || ctx.oggi; }
// Urgenza: più alta = prima. Una cosa mai registrata vale come fatta il giorno in cui la governante è partita.
// L'urgenza di una cella: quanto è scaduta rispetto al suo ritmo, con il pavimento del "giro completo" (Michele, specifiche §10: tutto almeno
// una volta ogni 90 giorni): una cosa a ritmo lungo diventa urgente comunque man mano che si avvicina ai 90 giorni dall'ultima volta.
function urgenza(ogni, ultima, oggi, inizio) { if (!ogni) return 99; if (ultima) { const d = giorniTra(ultima, oggi); return Math.max(d / ogni, d / GIORNI_GIRO); } const d0 = Math.max(0, giorniTra(inizio, oggi)); return 1 + Math.max(d0 / ogni, d0 / GIORNI_GIRO); }
// Il meteo segnato da Michele: { pioggia: "AAAA-MM-GG fino", umidita, freddo, caldo, vento }
function meteoAttivo(ctx, trigger, iso) { const m = ctx.meteo || {}; const chiavi = trigger === "pioggia" ? ["pioggia", "vento"] : trigger === "freddo" || trigger === "caldo" ? ["freddo", "caldo"] : trigger === "vento" ? ["vento", "pioggia"] : [trigger]; return chiavi.some(k => m[k] && m[k] >= iso); }

function liberaLaNotte(soggiorni, camera, iso) { return !soggiorni.some(s => s.camera === camera && soggiornoCopre(s, iso)); }
function nottiDiFila(soggiorni, camera, iso) { const s = soggiorni.find(x => x.camera === camera && soggiornoCopre(x, iso)); return s ? giorniTra(s.inizio, iso) : 0; }
const CAMBIO = p => p.tipo === "totale" || p.tipo === "totale_casa";
const NORMALE = p => p && p.origine !== "governante" && p.tipo !== "extra" && p.tipo !== "fondo";
function perche(r, reg, oggi, ogni) { if (!ogni) return [r.quando === "cambio" ? "nella totale" : "a ogni pulizia"]; return [etichettaOgni(ogni), reg?.ultima ? `ultima volta ${testoUltima(reg.ultima, oggi)}` : "prima volta"]; }
function stella(r, l, reg, data, ogni, extra = {}) {
  return { regola: r.id, codice: r.codice, nome: r.nome, parte: r.parte || "", superficie: r.superficie || r.nome, come: r.come, controllo: r.controllo || "", prodotto: r.prodotto || "", note: r.note || "", icona: r.icona, minuti: r.minuti, euro: r.euro || 0, priorita: r.priorita || 2, posto: r.posto || "", gruppo: r.gruppo, quando: r.quando, sempre: !!r.sempre || !ogni, ogni, rapporto: ogni ? rapportoScadenza(r, reg?.ultima || null, data, ogni) : null, ultima: reg?.ultima || null, luogo: l.id, luogoNome: l.nome, perche: perche(r, reg, data, ogni), ...extra };
}

// ============================================================================
//  LE RIFINITURE (le stelle) DI OGNI PASSAGGIO
//  rifinitureDelGiorno(zona, iso, ctx) → { [idPulizia]: [stella…] }
//  Per ogni pulizia normale del giorno: il budget del passaggio (dal calendario), le candidate (rifiniture a ritmo che valgono
//  per quel posto, nel modo dell'ospite di quel giorno, e che toccano), in ordine priorità 1 → 2 → 3 e, a pari priorità, la più scaduta.
//  Le cose coperte dalla lista di quel passaggio (stesso codice, ritmo entro la settimana) non diventano stelle.
//  Le zone comuni vanno alla prima pulizia del giorno della signora (una a ritmo + quelle di ogni giorno).
// ============================================================================
export function rifinitureDelGiorno(zona, iso, ctx) {
  const { camere, registro, soggiorni = [] } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = ctx.regole || regoleAttive(ctx.imp), sg = { ...SOGLIE_BASE, ...(ctx.soglie || {}) }, flags = ctx.flags || {}, imp = ctx.imp || null;
  const inizio = inizioGovernante(ctx);
  const pulizie = Object.values(ctx.pulizie || {}).filter(p => p.data === iso && p.zona === zona && NORMALE(p) && p.stato !== "non_fatta")
    .sort((a, b) => ((camere.find(c => c.id === a.camera) || {}).ordine || 99) - ((camere.find(c => c.id === b.camera) || {}).ordine || 99));
  const out = {}; if (!pulizie.length) return out;
  for (const p of pulizie) {
    const l = trovaLuogo(p.camera, camere, luoghi); if (!l) continue;
    const passo = passoDi(p, l, imp, ctx.regoleBase, ctx);
    const fisso = nottiDiFila(soggiorni, p.camera, p.data) >= 14;
    const regoleModo = regolePerModo(ctx, passo.modo);
    const righe = righeLista(passo, l.tipo === "casa", !!p.partenza), slot = passo.base ? slotBase(passo) : null;
    const cand = [];
    for (const r of regoleModo) {
      if (r.tipo !== "rotazione" || r.fuoriLivello || r.evento || r.sempre) continue;
      if (r.quando === "giornata" || r.quando === "giorno") continue;
      if (r.quando === "cambio" && passo.tipo !== "totale") continue;
      if (r.quando === "libera" && !passo.libera) continue;
      if (r.quando === "meteo" && !meteoAttivo(ctx, r.meteoTrigger, p.data)) continue;
      if (passo.soloIgiene && r.priorita !== 1) continue;
      if (!copre(regoleModo, r, l, camere, luoghi, flags)) continue;
      if (!inStagione(r, p.data)) continue;
      if (r.soloFissi && !fisso) continue;
      const reg = registro?.[chiaveRegistro(r.id, l.id)] || null;
      if (reg?.saltata === p.data && reg?.saltataPer === p.id) continue;
      const ogni = ogniAttuale(r, p.data, l, flags);
      if (copertaDallaLista(r, righe)) continue; // la lista di questo passaggio la fa già
      const rapporto = ogni ? rapportoScadenza(r, reg?.ultima || null, p.data, ogni) : Infinity;
      if (ogni && reg?.ultima && rapporto < 0.9) continue;
      if (r.quando === "meteo" && reg?.ultima && giorniTra(reg.ultima, p.data) < 3) continue;
      cand.push(stella(r, l, reg, p.data, ogni || 0, { urgenza: r.quando === "meteo" ? 50 : urgenza(ogni, reg?.ultima || null, p.data, inizio), sempre: false, slot: slot ? (slot.has(r.codice) ? 0 : 1) : 0 }));
    }
    // L'ORDINE (Michele, specifiche §10): PRIMA LA PIÙ SCADUTA. L'urgenza è "quanto è scaduta rispetto al suo ritmo" col pavimento dei 90 giorni
    // (vedi urgenza()): una cosa mai fatta sale finché non tocca a lei, l'igiene torna in cima quando è più scaduta delle altre. A parità la priorità
    // (igiene, poi quello che l'ospite vede, poi il nascosto). Booking: prima quello che l'ospite vede e tocca. Operai: prima lo slot "una per volta".
    // (Provato anche "prima l'igiene scaduta, poi il giro dei 90 giorni": tiene l'igiene al ritmo ma il giro completo scende dal 77% al 48%.)
    const ordinePrio = passo.visibilePrima ? { 2: 0, 1: 1, 3: 2 } : { 1: 0, 2: 1, 3: 2 };
    const prio = (a, b) => (ordinePrio[a.priorita] ?? 3) - (ordinePrio[b.priorita] ?? 3);
    if (passo.visibilePrima) cand.sort((a, b) => prio(a, b) || (a.slot - b.slot) || (b.urgenza - a.urgenza) || (a.minuti - b.minuti));
    else cand.sort((a, b) => (a.slot - b.slot) || (b.urgenza - a.urgenza) || prio(a, b) || (a.minuti - b.minuti));
    const scelte = []; let min = 0;
    for (const c of cand) { if (scelte.length >= passo.stelle) break; if (min + c.minuti > passo.budget) continue; scelte.push(c); min += c.minuti; }
    out[p.id] = scelte;
  }
  // le zone comuni della signora: alla prima pulizia del giorno (quelle di ogni giorno + una a ritmo entro zonaMinuti)
  const prima = pulizie[0], comuni = [];
  for (const r of regole) {
    if (r.tipo !== "rotazione" || r.quando !== "giornata" || r.fuoriLivello) continue;
    for (const l of luoghiDi(r, camere, luoghi, flags)) {
      if (l.zona !== zona || !inStagione(r, iso)) continue;
      const reg = registro?.[chiaveRegistro(r.id, l.id)] || null;
      if (reg?.saltata === iso) continue;
      const ogni = ogniAttuale(r, iso, l, flags);
      const rapporto = ogni ? rapportoScadenza(r, reg?.ultima || null, iso, ogni) : Infinity;
      if (ogni > 1 && reg?.ultima && rapporto < 0.9) continue;
      if (ogni <= 1 && reg?.ultima === iso) continue;
      comuni.push(stella(r, l, reg, iso, ogni, { comune: true, sempre: ogni <= 1, euro: ogni <= 1 ? 0 : r.euro || 0, urgenza: urgenza(ogni > 1 ? ogni : 0, reg?.ultima || null, iso, inizio) }));
    }
  }
  comuni.sort((a, b) => (b.sempre - a.sempre) || (a.priorita - b.priorita) || (b.urgenza - a.urgenza));
  const sceltiComuni = []; let minZ = 0, nZ = 0;
  for (const c of comuni) { if (c.sempre) { sceltiComuni.push(c); continue; } if (nZ >= 1 || minZ + c.minuti > sg.zonaMinuti) continue; sceltiComuni.push(c); minZ += c.minuti; nZ++; }
  if (sceltiComuni.length) out[prima.id] = [...(out[prima.id] || []), ...sceltiComuni];
  return out;
}
export function rifiniturePer(p, ctx) { if (!NORMALE(p)) return []; return rifinitureDelGiorno(p.zona, p.data, ctx)[p.id] || []; }
export const routinePer = rifiniturePer;

// ============================================================================
//  LA LISTA DEL GIORNO PER LA SIGNORA: una camera, una lista, un giorno
//  listaDelGiorno(p, ctx) → { passo, righe: [{k, tipo:"riga"|"stella", n, testo, sotto, codici, minuti, stella}], minuti, stelle }
//  Le stelle entrano al punto giusto: dopo l'ultima riga della lista che parla dello stesso posto (C camera, B bagno, K cucina).
// ============================================================================
export function listaDelGiorno(p, ctx) {
  const camere = ctx.camere, l = trovaLuogo(p.camera, camere, ctx.luoghi || LUOGHI_COMUNI) || { id: p.camera, nome: p.camera, tipo: "camera" };
  const passo = passoDi(p, l, ctx.imp || null, ctx.regoleBase, ctx);
  const base = righeLista(passo, l.tipo === "casa", !!p.partenza).map((c) => { const m = c.testo.match(/^(.*?)\s*\(([^)]+)\)\s*$/); return { k: `L${c.lista}${c.n}`, tipo: "riga", testo: m ? m[1] : c.testo, sotto: m ? m[2] : "", codici: c.codici, minuti: c.minuti, lista: c.lista, blocco: c.blocco || "camera" }; });
  const tutte = ctx.stelle || rifiniturePer(p, ctx);
  const stelle = tutte.filter(s => !s.sempre && !s.comune), zona = tutte.filter(s => s.comune);
  const azione = s => { const r = RIGA_DI[s.codice]; const a = r && r.regola ? r.regola.replace(/\s*\(.*$/, "").trim() : ""; return a && a.length <= 60 ? a : ""; };
  const rigaStella = s => ({ k: `S${s.regola}`, tipo: "stella", testo: s.parte ? `${s.superficie}: ${s.parte}` : s.superficie || s.nome, azione: s.parte ? "" : azione(s), sotto: `${s.minuti} min${s.prodotto && !/^nessuno/.test(s.prodotto) ? " · " + s.prodotto : ""}`, codici: [s.codice], minuti: s.minuti, stella: s, blocco: bloccoStella(s) });
  // i blocchi: un titolo grande, le righe dentro si leggono, le stelle del blocco in fondo al blocco e si toccano una per una
  const blocchi = [];
  const trova = id => { let b = blocchi.find(x => x.id === id); if (!b) { const def = BLOCCO_DI[id] || { id, nome: id, breve: id }; b = { id, k: `B:${id}`, nome: def.nome, breve: def.breve, righe: [], stelle: [], codici: [], minuti: 0 }; blocchi.push(b); } return b; };
  for (const r of base) { const b = trova(r.blocco); b.righe.push(r); b.codici.push(...r.codici); b.minuti += r.minuti || 0; }
  for (const s of stelle) { const r = rigaStella(s); let b = blocchi.find(x => x.id === r.blocco); if (!b) { b = trova(r.blocco); } b.stelle.push(r); }
  blocchi.sort((a, b) => ORDINE_BLOCCHI.indexOf(a.id) - ORDINE_BLOCCHI.indexOf(b.id));
  for (const b of blocchi) { const breveTot = BLOCCO_DI[b.id]; if (breveTot && passo.tipo !== "totale") b.nome = breveTot.breve; }
  const righe = blocchi.flatMap(b => [...b.righe, ...b.stelle]);
  righe.forEach((r, i) => r.n = i + 1);
  const righeZona = zona.map(s => ({ ...rigaStella(s), k: `Z${s.regola}|${s.luogo}`, luogo: s.luogo, luogoNome: s.luogoNome, sempre: !!s.sempre, blocco: "zona" }));
  const euro = xs => Math.round(xs.reduce((s, x) => s + (x.euro || 0), 0) * 100) / 100;
  return { passo, blocchi, righe, minuti: righe.reduce((s, r) => s + (r.minuti || 0), 0), stelle: stelle.length, euroStelle: euro(stelle), zona: righeZona, minutiZona: zona.reduce((s, x) => s + (x.minuti || 0), 0), euroZona: euro(zona.filter(s => !s.sempre)) };
}

// ============================================================================
//  I CONSIGLI DELLA SETTIMANA: le cose a camera libera dove il calendario non ha un passaggio a camera vuota,
//  i lavori di stagione (maggio, settembre, ottobre, aprile) e la pulizia a fondo completa (evento)
// ============================================================================
const MINUTI_PROPOSTE_GIORNO = 60;
function giorniLiberi(camera, lun, soggiorni, pulizie, oggi) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const iso = aggiungiGiorni(lun, i);
    if (iso < oggi || giornoSettimana(iso) === 0) continue;
    if (!liberaLaNotte(soggiorni, camera.id, iso)) continue;
    const parte = soggiorni.find(s => s.camera === camera.id && s.fine === iso);
    const cambio = Object.values(pulizie).some(p => p.data === iso && p.camera === camera.id && CAMBIO(p));
    const liberaAnchePrima = liberaLaNotte(soggiorni, camera.id, aggiungiGiorni(iso, -1));
    let punti = 10, perche = "";
    if (cambio) { punti -= 4; perche = "dopo la pulizia totale"; }
    if (parte && !liberaAnchePrima) { punti -= 2; perche = perche || `${parte.nome || "l'ospite"} parte quel giorno`; }
    if (liberaAnchePrima && !cambio) perche = perche || "camera libera";
    if (giornoSettimana(iso) === 6) punti += 1;
    out.push({ iso, punti, perche, parte: !!parte, cambio, prossimo: soggiorni.filter(s => s.camera === camera.id && s.inizio > iso).map(s => s.inizio).sort()[0] || null });
  }
  return out.sort((a, b) => b.punti - a.punti || (a.iso < b.iso ? -1 : 1));
}
function cambiDelGiorno(pulizie, zona, iso) { return Object.values(pulizie).filter(p => p.data === iso && p.zona === zona && CAMBIO(p)).length; }
export function regoleDellaFondoCompleta(luogo, ctx) {
  const { camere } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = ctx.regole || regoleAttive(ctx.imp), flags = ctx.flags || {}, oggi = ctx.oggi;
  return regole.filter(r => r.tipo === "rotazione" && !r.evento && r.ogni > 0 && (r.quando === "ripasso" || r.quando === "cambio" || r.quando === "libera") && copre(regole, r, luogo, camere, luoghi, flags) && inStagione(r, oggi)).map(r => r.id);
}
export function proposteSettimana(ctx) {
  const { lun, oggi, camere, soggiorni, pulizie, registro, rinvii = {} } = ctx;
  const luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = ctx.regole || regoleAttive(ctx.imp), sg = { ...SOGLIE_BASE, ...(ctx.soglie || {}) }, flags = ctx.flags || {}, imp = ctx.imp || null;
  const fine = aggiungiGiorni(lun, 6), inizio = inizioGovernante(ctx);
  const giorniLavoro = []; for (let i = 0; i < 7; i++) { const g = aggiungiGiorni(lun, i); if (g >= oggi && giornoSettimana(g) !== 0) giorniLavoro.push(g); }
  const candidati = [];
  // le camere che hanno già un passaggio a camera vuota nel calendario (i tecnici il venerdì) non hanno bisogno dei consigli "libera"
  const haPassoLibero = c => passiDi(c.id).some(x => x.libera);
  for (const r0 of regole) {
    if (r0.tipo !== "rotazione") continue;
    if (!(r0.quando === "libera" || r0.quando === "giorno")) continue;
    if (!inStagione(r0, lun) && !inStagione(r0, fine)) continue;
    for (const l of luoghiDi(r0, camere, luoghi, flags)) {
      // la regola nel modo di quel posto (ritmo e fuoriModo); i reset (M07/M08) e la fondo completa valgono in tutti i modi
      const r = (l.tipo === "comune" || r0.reset || r0.evento) ? r0 : (regolePerModo(ctx, modoDi(l, lun, ctx)).find(x => x.id === r0.id) || r0);
      if (r.fuoriLivello) continue;
      if (r.quando === "libera" && !r.evento && l.tipo !== "comune" && haPassoLibero(l)) continue;
      const k = chiaveRegistro(r.id, l.id);
      const reg = registro?.[k] || null, ult = reg?.ultima || null;
      const giaInProgramma = Object.values(pulizie).some(p => p.origine === "governante" && p.regola === r.id && p.camera === l.id && p.stato !== "fatta" && p.data >= aggiungiGiorni(oggi, -14));
      if (giaInProgramma) continue;
      const rinvio = rinvii[k]; if (rinvio && rinvio.fino > fine) continue;
      const ogni = ogniAttuale(r, fine, l, flags);
      let rapporto = r.evento ? 0 : rapportoScadenza(r, ult, fine, ogni);
      if (r.stagione && ult && inStagione(r, ult) && giorniTra(ult, fine) < 300) continue;
      const perche = [];
      let lungo = null, indietro = 0;
      if (r.evento) {
        lungo = soggiorni.find(s => s.camera === l.id && s.fine >= (lun > oggi ? lun : oggi) && s.fine <= fine && giorniTra(s.inizio, s.fine) >= 14) || null;
        indietro = regole.filter(x => x.tipo === "rotazione" && !x.evento && x.ogni && !x.fuoriLivello && (x.quando === "ripasso" || x.quando === "cambio" || x.quando === "libera") && copre(regole, x, l, camere, luoghi, flags) && inStagione(x, oggi))
          .filter(x => { const u = registro?.[chiaveRegistro(x.id, l.id)]?.ultima || null; const rp = rapportoScadenza(x, u, oggi, ogniAttuale(x, oggi, l, flags)); return rp !== Infinity && rp >= 2; }).length;
        const vecchia = !!(r.ogniEvento && ult && giorniTra(ult, fine) >= r.ogniEvento);
        if (!lungo && indietro < 6 && !vecchia) continue;
        if (lungo) perche.push(`${lungo.nome || "l'ospite"} ha dormito qui ${giorniTra(lungo.inizio, lungo.fine)} notti`);
        if (indietro >= 6) perche.push(`${indietro} rifiniture molto in ritardo`);
        if (vecchia) perche.push(`l'ultima volta ${testoUltima(ult, oggi)}`);
        rapporto = 99;
      } else {
        const prossima = ult && ogni ? aggiungiGiorni(ult, Math.round(ogni)) : null;
        if (prossima && aggiungiGiorni(prossima, -7) > fine) continue;
        if (rapporto !== Infinity && rapporto < 0.85) continue;
      }
      const nonPrima = (!r.evento && ult && ogni) ? (() => { const pr = aggiungiGiorni(ult, Math.round(ogni)); return pr > oggi ? aggiungiGiorni(pr, -7) : oggi; })() : oggi;
      let data = null;
      if (r.quando === "libera") {
        const vuoti = giorniLiberi(l, lun, soggiorni, pulizie, oggi).filter(g => g.iso >= nonPrima && inStagione(r, g.iso));
        if (!vuoti.length) continue;
        const g = vuoti[0]; data = g.iso; if (g.perche) perche.push(g.perche); var giorniVuoti = vuoti.map(x => x.iso);
        if (g.prossimo) perche.push(`prossimo arrivo ${g.prossimo === aggiungiGiorni(g.iso, 1) ? "il giorno dopo" : "il " + g.prossimo.slice(8) + "/" + g.prossimo.slice(5, 7)}`);
      } else {
        let giorni = giorniLavoro.filter(g => g >= nonPrima);
        const passi = passiDi(l.id).map(x => x.giorno); if (passi.length) { const gp = giorni.filter(g => passi.includes(giornoSettimana(g))); if (gp.length) giorni = gp; }
        giorni.sort((a, b) => cambiDelGiorno(pulizie, l.zona, a) - cambiDelGiorno(pulizie, l.zona, b) || (a < b ? -1 : 1));
        data = giorni[0]; if (!data) continue;
      }
      if (!r.evento) perche.unshift(ult ? `${etichettaOgni(ogni)} · ultima volta ${testoUltima(ult, oggi)}` : `${etichettaOgni(ogni)} · prima volta`);
      if (r.stagione) perche.push("è il periodo giusto");
      candidati.push({ id: `${r.id}|${l.id}|${data}`, regola: r.id, codice: r.codice, nome: r.nome, cosa: r.nome, icona: r.icona, come: r.come, controllo: r.controllo || "", prodotto: r.prodotto || "", note: r.note || "", materiale: rigaMateriale(r, l, ctx.materiali), luogo: l.id, luogoNome: l.nome, luogoTipo: l.tipo, zona: l.tipo === "comune" ? l.zona : zonaDi(l, ctx.regoleBase), data, minuti: r.minuti, euro: r.euro || 0, grande: !!r.grande, reset: !!r.reset, giorniLiberi: r.quando === "libera" ? giorniVuoti : [], libera: r.quando === "libera", priorita: r.priorita || 2, perche, rapporto: r.evento ? 99 : urgenza(ogni, ult, fine, inizio), chiave: k });
    }
  }
  candidati.sort((a, b) => (a.priorita - b.priorita) || (b.rapporto - a.rapporto) || (a.data < b.data ? -1 : 1));
  const minuti = {}, grandi = { n: 0 }, perLuogo = {}, perRegola = {}, scelte = [];
  let scartate = 0;
  for (const c of candidati) {
    // le finestre di reset (fine maggio, settembre) non hanno i limiti settimanali: una camera per signora al giorno, tutte le camere
    if (!c.reset && scelte.length >= 8) { scartate++; continue; }
    if ((perLuogo[c.luogo] || 0) >= 2) { scartate++; continue; }
    if (!c.reset && (perRegola[c.regola] || 0) >= 3) { scartate++; continue; }
    perRegola[c.regola] = (perRegola[c.regola] || 0) + 1;
    if (c.grande) {
      if (!c.reset && grandi.n >= sg.camereSettimana) { scartate++; continue; }
      const libero = g => !scelte.some(s => s.grande && s.zona === c.zona && s.data === g) && cambiDelGiorno(pulizie, c.zona, g) <= 1;
      if (!libero(c.data)) { const alt = (c.giorniLiberi || []).find(g => g !== c.data && libero(g)); if (!alt) { scartate++; continue; } c.data = alt; c.id = `${c.regola}|${c.luogo}|${alt}`; }
      grandi.n++; perLuogo[c.luogo] = (perLuogo[c.luogo] || 0) + 1; scelte.push(c); continue;
    }
    const kk = `${c.zona}|${c.data}`;
    if ((minuti[kk] || 0) + c.minuti > MINUTI_PROPOSTE_GIORNO) {
      const alt = giorniLavoro.find(g => g !== c.data && (minuti[`${c.zona}|${g}`] || 0) + c.minuti <= MINUTI_PROPOSTE_GIORNO && (!c.libera || giorniLiberi(trovaLuogo(c.luogo, camere, luoghi), lun, soggiorni, pulizie, oggi).some(x => x.iso === g)));
      if (!alt) { scartate++; continue; }
      c.data = alt; c.id = `${c.regola}|${c.luogo}|${alt}`;
    }
    minuti[`${c.zona}|${c.data}`] = (minuti[`${c.zona}|${c.data}`] || 0) + c.minuti;
    perLuogo[c.luogo] = (perLuogo[c.luogo] || 0) + 1;
    scelte.push(c);
  }
  scelte.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0) || (a.zona < b.zona ? -1 : 1));
  const inRitardo = Object.values(pulizie).filter(p => p.origine === "governante" && p.stato !== "fatta" && p.data < oggi).sort((a, b) => a.data < b.data ? -1 : 1);
  return { proposte: scelte, scartate, inRitardo, impegno: minuti };
}

// ============================================================================
//  IL CALENDARIO DEL PULITO: per ogni posto, le rifiniture con "ultima volta" e il colore
// ============================================================================
export function calendarioPulito(ctx) {
  const { camere, registro, oggi } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, flags = ctx.flags || {}, imp = ctx.imp || null;
  return [...camere, ...luoghi].map(l => {
    const modo = modoDi(l, oggi, ctx), tutte = l.tipo === "comune" ? (ctx.regole || regoleAttive(imp)) : regolePerModo(ctx, modo);
    const regole = tutte.filter(r => r.tipo === "rotazione" && r.ogni > 1 && !r.evento && !r.fuoriLivello);
    const profilo = modo, fisso = nottiDiFila(ctx.soggiorni || [], l.id, oggi) >= 14;
    const voci = regole.filter(r => copre(tutte, r, l, camere, luoghi, flags) && inStagione(r, oggi) && (!r.soloFissi || fisso)).map(r => {
      const reg = registro?.[chiaveRegistro(r.id, l.id)] || null; const ogni = ogniAttuale(r, oggi, l, flags); const rapporto = rapportoScadenza(r, reg?.ultima || null, oggi, ogni);
      return { regola: r.id, codice: r.codice, nome: r.nome, cosa: r.nome, icona: r.icona, ogni, quando: r.quando, blocco: r.blocco, ultima: reg?.ultima || null, da: reg?.da || "", rapporto, colore: coloreScadenza(rapporto), testo: testoUltima(reg?.ultima || null, oggi) };
    }).sort((a, b) => (b.rapporto === Infinity ? 99 : b.rapporto) - (a.rapporto === Infinity ? 99 : a.rapporto));
    const peggio = voci[0] || null;
    const punteggio = voci.reduce((s, v) => s + Math.min(3, v.rapporto === Infinity ? 3 : v.rapporto), 0) / Math.max(1, voci.length);
    return { luogo: l.id, nome: l.nome, zona: l.zona, tipo: l.tipo, profilo, modo, voci, peggio, punteggio, rossi: voci.filter(v => v.colore === "rosso").length, gialli: voci.filter(v => v.colore === "giallo").length, verdi: voci.filter(v => v.colore === "verde").length, mai: voci.filter(v => !v.ultima).length };
  }).sort((a, b) => b.punteggio - a.punteggio);
}
export function settimanaGovernante(adesso = new Date()) {
  const p = partiRoma(adesso);
  const iso = aISO(new Date(Date.UTC(p.y, p.m - 1, p.d, 12)));
  const lun = lunediDi(iso);
  if (p.wd === 0 || (p.wd === 6 && p.h >= 13)) return aggiungiGiorni(lun, 7);
  return lun;
}

// ============================================================================
//  LA SIMULAZIONE: N settimane con il calendario vero (i passaggi delle signore), le stelle di ogni passaggio e i consigli accettati
// ============================================================================
// Una settimana tipo: gli stessi passaggi che l'app programma davvero (calendario vero, o REGOLE_BASE dove c'è una domanda aperta)
export const NOTTI_ESTATE = 3; // d'estate (modo Booking) si stima un cambio ogni 3 notti per camera
export function modelloCalendario(camere, lun, regoleBase, ctx = {}) {
  const out = [];
  if (regimeDi(lun, regoleBase) === "estate") {
    // ESTATE: nessun giorno fisso; una partenza ogni 3 notti per camera (sfalsate), con un arrivo subito dopo; mai di domenica
    for (const c of camere) for (let d = 0; d < 7; d++) {
      if ((d + (c.ordine || 0)) % NOTTI_ESTATE !== 0) continue;
      const data = aggiungiGiorni(lun, d); if (giornoSettimana(data) === 0) continue;
      out.push({ id: `${data}_${c.id}`, data, camera: c.id, zona: zonaDi(c, regoleBase), tipo: c.tipo === "casa" ? "totale_casa" : "totale", partenza: true, arrivo: true, origine: "auto", stato: "da_fare", titolo: "Cambio completo", regime: "estate", modo: "booking" });
    }
    return out;
  }
  for (const c of camere) for (const x of passaggiCamera(c, regoleBase)) {
    const giorno = x.giorno === 0 ? 6 : x.giorno - 1; const data = aggiungiGiorni(lun, giorno);
    const totale = x.tipo === "totale" || x.tipo === "totale_casa";
    const cal = passiDi(c.id).find(y => y.giorno === x.giorno && y.tipo === (totale ? "totale" : "ripasso"));
    const libera = totale && !!(cal && cal.libera);
    out.push({ id: `${data}_${c.id}`, data, camera: c.id, zona: x.zona || c.zona, tipo: x.tipo, partenza: libera, arrivo: false, origine: "auto", stato: "da_fare", titolo: totale ? "Cambio completo" : "Ripasso", insieme: x.insieme || "", regime: "inverno", modo: modoValido(modoCamera(c, data, ctx.soggiorni || [], ctx.clienti || {}, regoleBase)) });
  }
  return out;
}
export function simulaGovernante(ctx, settimane = 13, opz = {}) {
  const { camere, soggiorni = [] } = ctx; const regole = ctx.regole || regoleAttive(ctx.imp);
  const lun = ctx.lun || lunediDi(ctx.oggi);
  const modello = opz.modello || modelloCalendario(camere, lun, ctx.regoleBase, ctx);
  if (!modello.length) return null;
  const registro = {};
  if (!opz.daZero) for (const [k, v] of Object.entries(ctx.registro || {})) if (v && v.ultima) registro[k] = { ultima: v.ultima };
  const prima = {}, minuti = {}, perPasso = [], zone = [...new Set([...modello.map(p => p.zona), ...camere.map(c => c.zona)])], accettate = []; let nRif = 0;
  const base = { ...ctx, regole, registro, rinvii: {}, inizio: inizioGovernante(ctx) };
  for (let w = 0; w < settimane; w++) {
    const lunW = aggiungiGiorni(lun, w * 7);
    const sog = soggiorni.map(s => ({ ...s, inizio: aggiungiGiorni(s.inizio, w * 7), fine: aggiungiGiorni(s.fine, w * 7) }));
    const pul = {}; for (const p of modello) { const iso = aggiungiGiorni(p.data, w * 7); const id = `${iso}_${p.camera}`; pul[id] = { ...p, id, data: iso, stato: "da_fare" }; }
    const c2 = { ...base, lun: lunW, oggi: lunW, pulizie: pul, soggiorni: sog };
    const pr = proposteSettimana(c2);
    for (const c of pr.proposte) { accettate.push({ ...c, settimana: w }); const k = chiaveRegistro(c.regola, c.luogo); if (!prima[k]) prima[k] = c.data; pul[`${c.data}_${c.luogo}_g_${c.regola}`] = { id: `${c.data}_${c.luogo}_g_${c.regola}`, data: c.data, camera: c.luogo, zona: c.zona, tipo: "fondo", origine: "governante", regola: c.regola, minuti: c.minuti, stato: "da_fare" }; }
    for (let d = 0; d < 7; d++) {
      const iso = aggiungiGiorni(lunW, d);
      for (const z of zone) {
        const m = rifinitureDelGiorno(z, iso, { ...c2, oggi: iso });
        for (const [pid, rf] of Object.entries(m)) { let minP = 0; for (const r of rf) { const k = chiaveRegistro(r.regola, r.luogo); registro[k] = { ultima: iso }; if (!prima[k]) prima[k] = iso; if (!r.sempre) { nRif++; minuti[`${z}|${iso}`] = (minuti[`${z}|${iso}`] || 0) + r.minuti; if (!r.comune) minP += r.minuti; } } const p = pul[pid]; if (p) { perPasso.push({ camera: p.camera, tipo: p.tipo, modo: p.modo || "", settimana: w, minuti: minP, stelle: rf.filter(r => !r.sempre && !r.comune).length, euro: rf.filter(r => !r.sempre).reduce((s, r) => s + (r.euro || 0), 0) }); const l = camere.find(c => c.id === p.camera); if (l) for (const id of coperteDalPasso(p, l, c2)) { const k = chiaveRegistro(id, l.id); registro[k] = { ultima: iso }; if (!prima[k]) prima[k] = iso; } } }
        // anche i passaggi senza stelle coprono la loro lista
        for (const p of Object.values(pul)) if (p.data === iso && p.zona === z && NORMALE(p) && !m[p.id]) { perPasso.push({ camera: p.camera, tipo: p.tipo, modo: p.modo || "", settimana: w, minuti: 0, stelle: 0, euro: 0 }); const l = camere.find(c => c.id === p.camera); if (l) for (const id of coperteDalPasso(p, l, c2)) { const k = chiaveRegistro(id, l.id); registro[k] = { ultima: iso }; if (!prima[k]) prima[k] = iso; } }
      }
      for (const c of pr.proposte) if (c.data === iso) {
        registro[chiaveRegistro(c.regola, c.luogo)] = { ultima: iso };
        if (c.grande) { const l = trovaLuogo(c.luogo, camere, ctx.luoghi || LUOGHI_COMUNI); if (l) for (const id of regoleDellaFondoCompleta(l, { ...c2, oggi: iso })) { const k = chiaveRegistro(id, c.luogo); registro[k] = { ultima: iso }; if (!prima[k]) prima[k] = iso; } }
        else minuti[`${c.zona}|${iso}`] = (minuti[`${c.zona}|${iso}`] || 0) + c.minuti;
      }
    }
  }
  return { settimane, lun, fine: aggiungiGiorni(lun, settimane * 7 - 1), registro, prima, minuti, perPasso, rifiniture: nRif, proposte: accettate, modello, zone };
}
export function simulaCopertura(ctx, settimane = 8) {
  const sim = simulaGovernante(ctx, settimane, { daZero: true });
  if (!sim) return null;
  const cal = calendarioPulito({ ...ctx, oggi: sim.fine, registro: sim.registro });
  const voci = cal.flatMap(c => c.voci).filter(v => v.quando === "ripasso" || v.quando === "cambio" || v.quando === "libera");
  const inRegola = voci.filter(v => v.colore !== "rosso").length;
  const minuti = Object.values(sim.minuti).reduce((s, m) => s + m, 0);
  return { settimane, voci: voci.length, inRegola, mai: voci.filter(v => !v.ultima).length, percento: voci.length ? Math.round(inRegola / voci.length * 100) : 0, minutiSettimanaSignora: Math.round(minuti / settimane / sim.zone.length), rifinitureSettimana: Math.round(sim.rifiniture / settimane) };
}

// ============================================================================
//  IL TABELLONE DI COPERTURA: una cella per posto × rifinitura (blocchi Rotazione e Camera libera). Profilo Base: solo le righe
//  di igiene (modo Operai). Le regole fuori modo sono grigio chiaro ("solo nella fondo completa"), non buchi.
// ============================================================================
// Stella possibile = una parte a ritmo che può entrare in un passaggio. Cella del Tabellone = solo blocchi Rotazione e Camera libera (regola di Michele)
export const STELLA_POSSIBILE = r => r.tipo === "rotazione" && !r.evento && !r.sempre && (r.quando === "ripasso" || r.quando === "cambio" || r.quando === "libera");
const CELLA = r => STELLA_POSSIBILE(r) && (r.blocco === "rotazione" || r.blocco === "libera" || r.personale);
export const GIORNI_GIRO = 90; // "Giro completo": ogni cella fatta almeno una volta a trimestre (Michele, specifiche §10)
export function tabellone(ctx, settimane = 13) {
  const { camere, oggi, soggiorni = [] } = ctx; const registro = ctx.registro || {}, luoghi = ctx.luoghi || LUOGHI_COMUNI, imp = ctx.imp || null, flags = ctx.flags || {};
  const regole = ctx.regole || regoleAttive(imp);
  const sim = simulaGovernante(ctx, settimane);
  const modello = sim ? sim.modello : [];
  const lun = ctx.lun || lunediDi(oggi);
  const programmati = Object.values(ctx.pulizie || {}).filter(p => p.origine === "governante" && p.stato !== "fatta" && p.data >= oggi);
  const haPasso = l => modello.some(p => p.camera === l.id), haTotale = l => modello.some(p => p.camera === l.id && CAMBIO(p)), haLibera = l => estate ? false : passiDi(l.id).some(x => x.libera);
  const maiLibera = l => { for (let w = 0; w < settimane; w++) for (let d = 0; d < 7; d++) { const iso = aggiungiGiorni(lun, w * 7 + d); if (giornoSettimana(iso) !== 0 && !soggiorni.some(s => s.camera === l.id && soggiornoCopre({ ...s, inizio: aggiungiGiorni(s.inizio, w * 7), fine: aggiungiGiorni(s.fine, w * 7) }, iso))) return false; } return true; };
  const estate = regimeDi(oggi, ctx.regoleBase) === "estate";
  const budgetSett = l => estate ? Math.round(7 / NOTTI_ESTATE * BUDGET_BASE.totale) : passiDi(l.id).reduce((s, x) => s + (x.budget || 0), 0);
  const motivoDi = (r, l) => {
    if (!haPasso(l)) return "questo posto non ha passaggi nel calendario vero";
    if (r.quando === "cambio" && !haTotale(l)) return "solo nella totale: questo posto non ha una totale nel calendario";
    if (r.quando === "libera") return haLibera(l) ? "a camera vuota: non entra nei 45 minuti del passaggio a camera vuota" : maiLibera(l) ? "solo a camera libera: nel prospetto questa camera non è mai libera" : "a camera libera: in coda nei consigli (massimo 8 a settimana)";
    const b = budgetSett(l); if (r.minuti > Math.max(...passiDi(l.id).map(x => x.budget || 0), 0)) return `dura ${r.minuti} minuti, più del budget di un passaggio (${passiDi(l.id).map(x => x.budget).join("/")}′)`;
    return `non entra nei ${b} minuti a settimana dei passaggi di questo posto: alza i minuti di stelle del modo (o del foglio "Calendario vero") se accetti il costo, allenta il ritmo del modo con −, oppure spegni la regola`;
  };
  const celle = [], modoLuogo = {};
  for (const l of camere) {
    const modo = modoDi(l, oggi, ctx), regoleModo = regolePerModo(ctx, modo), profilo = modo, fisso = nottiDiFila(soggiorni, l.id, oggi) >= 14;
    modoLuogo[l.id] = modo;
    for (const r of regoleModo) {
      if (!CELLA(r)) continue;
      if (!copre(regoleModo, r, l, camere, luoghi, flags)) continue;
      if (!inStagione(r, oggi)) continue;
      if (r.soloFissi && !fisso) continue;
      const k = chiaveRegistro(r.id, l.id), reg = registro[k] || null, ult = reg?.ultima || null;
      const ogni = ogniAttuale(r, oggi, l, flags);
      const rapporto = ogni ? rapportoScadenza(r, ult, oggi, ogni) : null;
      const doc = programmati.find(p => p.regola === r.id && p.camera === l.id);
      const programmata = doc ? doc.data : (sim && sim.prima[k]) || null;
      let colore;
      if (r.fuoriLivello) colore = "fuori";
      else { const c = coloreScadenza(rapporto); colore = c === "verde" ? "verde" : c === "giallo" ? (programmata ? "giallo" : "rosso") : programmata ? (ult ? "giallo" : "grigio") : "rosso"; }
      // mai fatta e non in programma, ma scade dopo la fine della simulazione (ritmi lunghi: 4-12 mesi): non è un buco, è "più avanti"
      if (colore === "rosso" && !ult && ogni && sim && aggiungiGiorni(inizioGovernante(ctx), Math.round(ogni)) > sim.fine) colore = "grigio";
      // il "giro completo" (Michele, specifiche §10): fatta almeno una volta negli ultimi 90 giorni, oggi e alla fine della prova simulata
      const fatta90 = !!(ult && ult >= aggiungiGiorni(oggi, -GIORNI_GIRO));
      const simUlt = sim && sim.registro[k] ? sim.registro[k].ultima : null;
      const fatta90Prova = !!(simUlt && sim && simUlt >= aggiungiGiorni(sim.fine, -GIORNI_GIRO));
      celle.push({ luogo: l.id, luogoNome: l.nome, zona: l.zona, tipo: l.tipo, profilo, modo, regola: r.id, codice: r.codice, nome: r.nome, gruppo: r.gruppo, quando: r.quando, blocco: r.blocco, priorita: r.priorita, ogni, ultima: ult, testo: testoUltima(ult, oggi), da: reg?.da || "", rapporto, colore, programmata, motivo: colore === "rosso" ? motivoDi(r, l) : "", fatta90, fatta90Prova });
    }
  }
  const conteggiate = celle.filter(c => c.colore !== "fuori"), rosse = celle.filter(c => c.colore === "rosso");
  const perLuogo = camere.map(l => {
    const mie = celle.filter(c => c.luogo === l.id); const gruppi = {};
    for (const c of mie) { const g = gruppi[c.gruppo] = gruppi[c.gruppo] || { rosse: 0, gialle: 0, grigie: 0, verdi: 0, fuori: 0, n: 0 }; g.n++; g[c.colore === "rosso" ? "rosse" : c.colore === "giallo" ? "gialle" : c.colore === "grigio" ? "grigie" : c.colore === "fuori" ? "fuori" : "verdi"]++; }
    const contate = mie.filter(c => c.colore !== "fuori");
    return { luogo: l.id, nome: l.nome, zona: l.zona, tipo: l.tipo, profilo: modoLuogo[l.id], modo: modoLuogo[l.id], n: mie.length, rosse: mie.filter(c => c.colore === "rosso").length, gialle: mie.filter(c => c.colore === "giallo").length, grigie: mie.filter(c => c.colore === "grigio").length, verdi: mie.filter(c => c.colore === "verde").length, fuori: mie.filter(c => c.colore === "fuori").length, gruppi, budget: budgetSett(l), contate: contate.length, mai90: contate.filter(c => !c.fatta90).length, mai90Prova: contate.filter(c => !c.fatta90Prova).length };
  });
  const motivi = Object.values(rosse.reduce((m, c) => { const x = m[c.motivo] = m[c.motivo] || { motivo: c.motivo, n: 0, regole: {} }; x.n++; x.regole[c.regola] = x.regole[c.regola] || { regola: c.regola, nome: c.nome, n: 0 }; x.regole[c.regola].n++; return m; }, {}))
    .map(x => ({ ...x, regole: Object.values(x.regole).sort((a, b) => b.n - a.n) })).sort((a, b) => b.n - a.n);
  const copertura = conteggiate.length ? Math.round((conteggiate.length - rosse.length) / conteggiate.length * 100) : 100;
  const pct = n => conteggiate.length ? Math.round(n / conteggiate.length * 100) : 100;
  const fatte90 = conteggiate.filter(c => c.fatta90).length, fatte90Prova = conteggiate.filter(c => c.fatta90Prova).length;
  const giro = { giorni: GIORNI_GIRO, percento: pct(fatte90), fatte: fatte90, totale: conteggiate.length, mai: conteggiate.length - fatte90, prova: sim ? { percento: pct(fatte90Prova), fatte: fatte90Prova, totale: conteggiate.length, mai: conteggiate.length - fatte90Prova, fine: sim.fine } : null };
  return { celle, perLuogo, motivi, copertura, buchi: rosse.length, celleContate: conteggiate.length, fuoriLivello: celle.length - conteggiate.length, settimane, sim, modi: modoLuogo, regime: regimeDi(oggi, ctx.regoleBase), conto: contoModi(ctx, sim), giro, prova: sim ? prova90(ctx, sim, regole) : null };
}
// Il conto (Michele, specifiche §1 e §2): per MODO il costo di una camera a settimana (dalla simulazione: le stelle che entrano davvero,
// col tetto di 2/3 stelle e il listino a fasce), e per STAGIONE: un mese d'inverno (calendario vero, i modi del prospetto),
// un mese d'estate (modo Booking, un cambio ogni 3 notti), l'anno = 9 mesi d'inverno + 3 d'estate. Mai una media dell'anno.
export function contoModi(ctx, simData) {
  const { camere } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, imp = ctx.imp || null, flags = ctx.flags || {}, oggi = ctx.oggi;
  const prezzi = prezziStelle(imp), lun = ctx.lun || lunediDi(oggi);
  const forza = modo => ({ ...(ctx.regoleBase || {}), regime: { modo } });
  const regimeOggi = regimeDi(oggi, ctx.regoleBase);
  const simInv = regimeOggi === "inverno" && simData ? simData : simulaGovernante({ ...ctx, regoleBase: forza("inverno") }, 13);
  const simEst = regimeOggi === "estate" && simData ? simData : simulaGovernante({ ...ctx, regoleBase: forza("estate") }, 13);
  const mese = sim => sim ? Math.round(sim.perPasso.reduce((s, p) => s + (p.euro || 0), 0) / sim.settimane * 52 / 12) : 0;
  const stelleSett = sim => sim ? Math.round(sim.perPasso.reduce((s, p) => s + (p.stelle || 0), 0) / sim.settimane) : 0;
  // per modo: euro di stelle per camera-settimana (una camera-settimana = una camera che in quella settimana ha avuto passaggi in quel modo)
  const perModo = {};
  for (const k of NOMI_MODI) perModo[k] = { modo: k, ...MODI[k], euroCameraSettimana: 0, stelleCameraSettimana: 0, camereSettimana: 0 };
  const conta = (sim) => { if (!sim) return; const cs = {}; for (const p of sim.perPasso) { const k = modoValido(p.modo); const id = `${k}|${p.camera}|${p.settimana}`; cs[id] = cs[id] || { modo: k, euro: 0, stelle: 0 }; cs[id].euro += p.euro || 0; cs[id].stelle += p.stelle || 0; } for (const x of Object.values(cs)) { const m = perModo[x.modo]; m.camereSettimana++; m.euroCameraSettimana += x.euro; m.stelleCameraSettimana += x.stelle; } };
  conta(simInv); conta(simEst);
  for (const m of Object.values(perModo)) { if (m.camereSettimana) { m.euroCameraSettimana = Math.round(m.euroCameraSettimana / m.camereSettimana * 10) / 10; m.stelleCameraSettimana = Math.round(m.stelleCameraSettimana / m.camereSettimana * 10) / 10; } }
  // "tutto in regola": quanto costerebbe fare ogni stella al suo ritmo, posto per posto col modo che ha oggi (inverno) e in modo Booking (estate)
  const pieno = (modoDiPosto) => { let euroSett = 0; for (const l of camere) { const modo = modoDiPosto(l); const regole = regolePerModo(ctx, modo).filter(r => STELLA_POSSIBILE(r) && !r.fuoriLivello); for (const r of regole) { if (!copre(regole, r, l, camere, luoghi, flags) || !inStagione(r, oggi) || r.soloFissi) continue; euroSett += prezzoStella(r.minuti, prezzi) * 7 / ogniAttuale(r, oggi, l, flags); } } return Math.round(euroSett * 52 / 12); };
  const inverno = { euroMese: mese(simInv), stelleSettimana: stelleSett(simInv), euroMesePieno: pieno(l => modoDi(l, oggi, ctx)) };
  const estate = { euroMese: mese(simEst), stelleSettimana: stelleSett(simEst), euroMesePieno: pieno(() => "booking") };
  return { modi: perModo, inverno, estate, anno: inverno.euroMese * 9 + estate.euroMese * 3, annoPieno: inverno.euroMesePieno * 9 + estate.euroMesePieno * 3, prezzi, regime: regimeOggi };
}
export function contoLivelli(ctx) { return contoModi(ctx); } // nome vecchio
// Il conto della settimana dal prospetto vero: quante camere per modo, quante partenze Booking, quante stelle e quanti euro
export function contoSettimana(ctx, lun) {
  const da = lun || ctx.lun || lunediDi(ctx.oggi), a = aggiungiGiorni(da, 6);
  const pulizie = Object.values(ctx.pulizie || {}).filter(p => p.data >= da && p.data <= a && NORMALE(p) && p.stato !== "non_fatta");
  const camereModo = { tecnici: new Set(), operai: new Set(), booking: new Set() }; let partenzeBooking = 0, stelle = 0, euro = 0;
  const giorni = [...new Set(pulizie.map(p => p.data))], zone = [...new Set(pulizie.map(p => p.zona))];
  const stelleDi = {}; for (const g of giorni) for (const z of zone) { const m = rifinitureDelGiorno(z, g, { ...ctx, oggi: g }); for (const [id, rf] of Object.entries(m)) stelleDi[id] = rf; }
  for (const p of pulizie) {
    const modo = modoValido(p.modo || modoCamera({ id: p.camera, tipo: "camera" }, p.data, ctx.soggiorni || [], ctx.clienti || {}, ctx.regoleBase));
    camereModo[modo].add(p.camera); if (modo === "booking" && p.partenza) partenzeBooking++;
    const rf = p.stato === "fatta" ? (p.rifiniture || []).filter(r => r.euro).map(r => ({ euro: r.euro, sempre: false })) : (stelleDi[p.id] || []).filter(r => !r.sempre);
    stelle += rf.length; euro += rf.reduce((s, r) => s + (r.euro || 0), 0);
  }
  return { da, a, pulizie: pulizie.length, tecnici: camereModo.tecnici.size, operai: camereModo.operai.size, booking: camereModo.booking.size, partenzeBooking, stelle, euro: Math.round(euro * 100) / 100 };
}
function prova90(ctx, sim, regole) {
  const sg = { ...SOGLIE_BASE, ...(ctx.soglie || {}) };
  const giorni = Object.entries(sim.minuti); const max = giorni.reduce((m, [k, v]) => v > m.v ? { k, v } : m, { k: "", v: 0 });
  const domeniche = giorni.filter(([k]) => giornoSettimana(k.split("|")[1]) === 0).length;
  const passi = sim.perPasso.filter(p => p.stelle || p.minuti); const maxPasso = passi.reduce((m, p) => Math.max(m, p.minuti), 0);
  const sopra = sim.perPasso.filter(p => p.minuti > (p.tipo === "ripasso" ? BUDGET_BASE.ripasso : BUDGET_BASE.libera)).length;
  const grandi = sim.proposte.filter(c => c.grande).length, libere = sim.proposte.filter(c => c.libera && !c.grande).length, lavori = sim.proposte.filter(c => !c.libera && !c.grande).length;
  const cal = calendarioPulito({ ...ctx, oggi: sim.fine, registro: sim.registro, regole });
  const voci = cal.flatMap(c => c.voci).filter(v => v.quando !== "giornata"); const inRegola = voci.filter(v => v.colore !== "rosso").length;
  const fuori = Object.values(voci.filter(v => v.colore === "rosso").reduce((m, v) => { m[v.regola] = m[v.regola] || { nome: v.cosa, n: 0 }; m[v.regola].n++; return m; }, {})).sort((a, b) => b.n - a.n);
  const perSett = Math.round(sim.rifiniture / sim.settimane), perSignora = Math.round(perSett / Math.max(1, sim.zone.length));
  const minutiSett = Math.round(giorni.reduce((s, [, v]) => s + v, 0) / sim.settimane / Math.max(1, sim.zone.length));
  const righe = [
    `In ${sim.settimane} settimane le signore farebbero ${sim.rifiniture} stelle dentro i loro passaggi: circa ${perSett} a settimana, ${perSignora} a testa, ${minutiSett} minuti a settimana per signora.`,
    `Mai più del budget del passaggio: al massimo ${maxPasso} minuti di stelle in una camera (ripasso 15, totale 30, totale a camera vuota 45)${sopra ? ` — ${sopra} passaggi sopra il budget` : ""}; di domenica ${domeniche ? domeniche + " volte" : "mai"}.`,
    `A camera libera: ${libere} cose entrerebbero nei consigli${grandi ? `, più ${grandi} pulizie a fondo complete (massimo ${sg.camereSettimana} a settimana)` : ""}${lavori ? `, e ${lavori} lavori di stagione` : ""}.`,
    `Alla fine dei ${sim.settimane * 7} giorni le rifiniture sarebbero in regola al ${voci.length ? Math.round(inRegola / voci.length * 100) : 0}% (${inRegola} su ${voci.length}).`,
    fuori.length ? `Resterebbero indietro: ${fuori.slice(0, 5).map(f => `${f.nome} (${f.n} posti)`).join(", ")}${fuori.length > 5 ? ` e altre ${fuori.length - 5}` : ""}.` : "Niente resterebbe indietro.",
  ];
  return { righe, percento: voci.length ? Math.round(inRegola / voci.length * 100) : 0, maxPasso, rifiniture: sim.rifiniture, proposte: sim.proposte.length, fuori };
}

// ============================================================================
//  LA MAPPA DELLE SUPERFICI: ogni superficie collegata alle righe del catalogo che la coprono (per codice)
// ============================================================================
export const SUPERFICI = {
  camera: { nome: "Camera", oggetti: [
    { o: "Soffitto e luci", s: [["Soffitto e angoli", ["C01"]], ["Plafoniera o lampadario", ["C01", "C02"]], ["Luci e lampadine (funzionano?)", ["C55"]]] },
    { o: "Aria", s: [["Aria e odori", ["C54"]]] },
    { o: "Condizionatore", s: [["Griglia", ["C04", "M02"]], ["Filtri", ["C03", "M02", "M07"]], ["Alette", ["C04"]], ["Telecomando", ["C05"]]] },
    { o: "Pareti", s: [["Pareti (ditate e segni)", ["C06", "C07", "C57"]], ["Interruttori e prese", ["C09", "C05", "C44"]]] },
    { o: "Quadri e pannello fotografico", s: [["Cornice", ["C08"]], ["Vetro", ["C08"]], ["Retro", ["C08"]], ["Pannello fotografico sopra il letto", ["P01"]]] },
    { o: "Termosifone", s: [["Davanti", ["C10", "M03"]], ["Dietro", ["C10", "M03"]], ["Sopra", ["C10"]]] },
    { o: "Battiscopa", s: [["Battiscopa", ["C11"]]] },
    { o: "Porta", s: [["Davanti", ["C13", "C12"]], ["Dietro", ["C13", "C12"]], ["Bordo sopra", ["C13"]], ["Maniglie dei due lati", ["C13", "C12", "C05"]], ["Serratura", ["C13"]], ["Stipite", ["C13"]], ["Cardini", ["C13"]]] },
    { o: "Finestra", s: [["Vetro dentro", ["C18"]], ["Vetro fuori", ["C19"]], ["Telaio", ["C17"]], ["Binari", ["C17"]], ["Maniglia", ["C15", "C05"]], ["Davanzale dentro", ["C16"]], ["Davanzale fuori", ["C19"]]] },
    { o: "Tapparella", s: [["Stecche", ["C20"]], ["Cassonetto", ["P04"]], ["Cinghia", ["C20"]]] },
    { o: "Zanzariera (se c'è)", opz: true, s: [["Rete", ["C21"]], ["Telaio", ["C21"]]] },
    { o: "Tende", s: [["Tessuto", ["C22", "C23"]], ["Bastone o binario", ["P05"]]] },
    { o: "Letto", s: [["Testiera davanti", ["C25"]], ["Testiera dietro", ["C27"]], ["Struttura e piedini", ["C26"]], ["Sotto il letto", ["C24"]], ["Doghe", ["C26"]], ["Materasso sopra", ["C28"]], ["Materasso sotto", ["C29"]], ["Materasso bordi", ["C28"]], ["Coprimaterasso", ["C30"]], ["Cuscini", ["C31", "P06"]], ["Copricuscini", ["C30"]], ["Piumino", ["C31", "C32"]], ["Coperte", ["C32", "M01", "C34", "M07"]], ["Copriletto", ["C33"]], ["Lenzuola alla luce", ["B37"]]] },
    { o: "Comodini", s: [["Sopra", ["C35"]], ["Dentro", ["C35", "C39", "C40"]], ["Dietro", ["C35", "C58"]], ["Sotto", ["C24"]]] },
    { o: "Abat-jour", s: [["Paralume", ["C36"]], ["Base", ["C36", "C35"]], ["Interruttore", ["C05", "C35"]]] },
    { o: "Armadio", s: [["Sopra", ["C37"]], ["Ante fuori", ["C38"]], ["Ante dentro", ["C39"]], ["Maniglie", ["C38", "C05"]], ["Ripiani", ["C39"]], ["Asta e grucce", ["C39"]], ["Cassetti dentro e guide", ["C40", "C39"]], ["Sotto", ["C58"]], ["Dietro", ["C58"]], ["Armadio in stoffa (se c'è)", ["P03"], true]] },
    { o: "Scrivania e sedie", s: [["Piano", ["C41"]], ["Gambe", ["C41"]], ["Sotto", ["C58"]], ["Seduta e schienale", ["C41"]]] },
    { o: "TV", s: [["Schermo", ["C42"]], ["Retro e cavi", ["C43"]], ["Telecomando", ["C05"]], ["Mobile sopra", ["C43", "C41"]], ["Mobile dentro", ["C39"]], ["Mobile dietro", ["C43"]], ["Ciabatta", ["C44"]]] },
    { o: "Frigo in camera (se c'è)", opz: true, s: [["Dentro, a ogni partenza", ["C45"]], ["Guarnizione", ["C45"]], ["Retro e sotto", ["C45", "C58"]]] },
    { o: "Specchio", s: [["Vetro", ["C46"]], ["Cornice", ["C08"]], ["Retro", ["C08"]]] },
    { o: "Piccoli elettrodomestici e piano d'appoggio", s: [["Phon: filtro", ["C47"]], ["Phon: impugnatura", ["C05"]], ["Bollitore (se c'è)", ["C48"], true], ["Portapane a serrandina (se c'è)", ["P02"], true], ["Ventilatore (se c'è)", ["C50"], true]] },
    { o: "Appendiabiti e cestino", s: [["Appendiabiti e ganci", ["C49"]], ["Cestino dentro", ["C51"]], ["Cestino fuori", ["C51"]]] },
    { o: "Pavimento", s: [["Pavimento", ["C52"]], ["Fughe", ["C52"]], ["Angoli", ["C52"]], ["Sotto i mobili", ["C58", "C24"]], ["Tappeti e passatoie", ["C53"]], ["Zerbino", ["C53"]]] },
    { o: "Cartelli e chiavi", s: [["Scritta con il nome sulla porta", ["C13", "C14"]], ["Cartelli e targhette", ["C14"]], ["Portachiavi", ["C05", "C49"]]] },
    { o: "Prima di chiudere la camera", s: [["Giro di controllo di 5 minuti", ["C56"]], ["Istruzioni fisse della camera e del cliente", ["O01"]], ["Camera ferma da 2+ giorni prima di un arrivo", ["O02", "C56"]], ["Camere dei tecnici fissi: lavori a camera libera nel weekend", ["O03", "C30"]]] },
  ] },
  bagno: { nome: "Bagno", oggetti: [
    { o: "Soffitto e luci", s: [["Soffitto e angoli (muffa)", ["B01", "C01", "M05"]], ["Plafoniera", ["B02", "C01"]], ["Luci del bagno (funzionano?)", ["C55"]], ["Aspiratore: griglia", ["B03"]]] },
    { o: "Finestra del bagno", s: [["Vetro dentro", ["C18", "B04"]], ["Vetro fuori", ["C19"]], ["Telaio e binari", ["C17", "B04"]], ["Maniglia", ["C05"]], ["Davanzale", ["C16", "B04"]]] },
    { o: "Termosifone o scaldasalviette", s: [["Elementi davanti, dietro e sopra", ["B05"]]] },
    { o: "Pareti", s: [["Piastrelle", ["B06"]], ["Fughe", ["B07"]], ["Silicone", ["B08"]], ["Angoli", ["B01", "C52"]]] },
    { o: "Porta", s: [["Davanti e dietro", ["B09", "C13"]], ["Bordo sopra", ["B09", "C13"]], ["Maniglie", ["B09", "C13", "C05"]], ["Stipite, cardini, serratura", ["B09", "C13"]]] },
    { o: "Interruttori e prese", s: [["Interruttori e prese", ["B10", "C05"]]] },
    { o: "Specchio", s: [["Vetro", ["B11", "C46"]], ["Cornice", ["B11", "C46"]], ["Luce", ["B02", "C36"]]] },
    { o: "Lavandino", s: [["Vasca", ["B12", "B34"]], ["Troppopieno", ["B13"]], ["Piletta", ["B13", "B36"]], ["Rubinetto, base e filtrino del calcare", ["B12", "B15", "B26", "C05"]], ["Sotto", ["B14"]], ["Sifone e tubi", ["B14"]], ["Mobiletto dentro e fuori", ["B14"]], ["Mensola", ["B14", "B34"]], ["Dispenser", ["B16"]], ["Bicchiere e portaspazzolino", ["B16"]]] },
    { o: "WC", s: [["Tavoletta sopra, sotto, cerniere", ["B17"]], ["Bordo interno", ["B17"]], ["Sotto il bordo", ["B17"]], ["Base al pavimento", ["B18"]], ["Dietro", ["B18"]], ["Cassetta esterna sopra, davanti e tubo", ["B19", "C05"]], ["Tubo", ["B18"]], ["Scopino e portascopino", ["B20"]], ["Portarotolo", ["B21", "B31"]], ["Dispenser grande della carta", ["P07"]]] },
    { o: "Bidet", s: [["Vasca", ["B22"]], ["Rubinetto", ["B22", "B15", "B26"]], ["Scarico", ["B36"]], ["Sotto", ["B18"]], ["Dietro", ["B18"]]] },
    { o: "Doccia", s: [["Piatto", ["B23", "B06"]], ["Piletta e capelli", ["B23", "B36"]], ["Box vetro dentro", ["B24"]], ["Box vetro fuori", ["B24"]], ["Profili", ["B25"]], ["Binari delle ante", ["B25"]], ["Guarnizioni", ["B08", "B25"]], ["Soffione", ["B26"]], ["Flessibile", ["B26"]], ["Miscelatore", ["B27", "B15", "B26", "C05"]], ["Mensola", ["B28", "B34", "B06"]], ["Tenda (se c'è)", ["B29"], true], ["Silicone", ["B08", "M05"]], ["Fughe", ["B07"]], ["Tappetino antiscivolo (se c'è)", ["B30"], true], ["Portasapone", ["B28", "B31"]]] },
    { o: "Accessori", s: [["Portasciugamani e ganci", ["B31"]], ["Mensola di vetro sotto lo specchio", ["C46", "B14"]], ["Bidoncino dentro, fuori, coperchio", ["B32", "C51"]], ["Tappetino", ["B33"]], ["Accappatoio", ["P08"]], ["Asciugamani alla luce", ["B37"]], ["Dotazioni: carta, sapone, bicchieri, phon", ["B38"]]] },
    { o: "Pavimento", s: [["Pavimento", ["B34"]], ["Fughe", ["C52"]], ["Angoli", ["C52"]], ["Dietro la porta", ["C52"]], ["Scarico a pavimento", ["B35"]]] },
  ] },
  cucina: { nome: "Cucina (appartamenti)", oggetti: [
    { o: "Pensili", s: [["Sopra", ["C37"]], ["Ante fuori e maniglie", ["K01", "K16"]], ["Ante dentro e ripiani", ["K01"]]] },
    { o: "Cappa", s: [["Filtri", ["K02"]], ["Esterno", ["K02"]], ["Sotto", ["K02"]]] },
    { o: "Piano cottura", s: [["Fornelli", ["K05"]], ["Griglie", ["K05", "K03"]], ["Spartifiamma", ["K03"]], ["Manopole", ["K03", "C05"]], ["Sotto le griglie", ["K03"]]] },
    { o: "Forno", s: [["Dentro", ["K04"]], ["Porta e vetro", ["K04"]], ["Guarnizione", ["K04"]], ["Teglie", ["K04"]], ["Sopra", ["K04"]]] },
    { o: "Piano di lavoro", s: [["Piano di lavoro", ["K05"]], ["Paraschizzi", ["K14"]], ["Barra con i mestoli appesi", ["P09"]]] },
    { o: "Lavello", s: [["Vasca", ["K05"]], ["Scarico", ["B36"]], ["Rubinetto", ["K05", "C05", "B26"]], ["Sifone", ["K06"]], ["Sotto", ["K06"]]] },
    { o: "Lavastoviglie", s: [["A ogni partenza", ["K07"]], ["Filtro", ["K07"]], ["Guarnizione", ["K07"]], ["Cestelli", ["K07"]], ["Esterno", ["K07"]]] },
    { o: "Frigo e freezer", s: [["A ogni partenza", ["K08"]], ["Ripiani", ["K08"]], ["Cassetti", ["K08"]], ["Guarnizioni", ["K08"]], ["Sopra", ["C37"]], ["Griglia dietro", ["K08"]], ["Sotto", ["K08"]], ["Sbrinare", ["K08"]]] },
    { o: "Stoviglie", s: [["Inventario a ogni partenza", ["K15"]]] },
    { o: "Microonde", s: [["Dentro", ["K09", "K05"]], ["Piatto", ["K09"]], ["Esterno", ["K05"]]] },
    { o: "Bollitore e moka", s: [["Bollitore", ["K10", "C48"]], ["Moka", ["K10"]]] },
    { o: "Tavolo e sedie", s: [["Tavolo", ["K11"]], ["Sedie", ["K11"]]] },
    { o: "Bidoni della differenziata", s: [["Dentro", ["K05", "K12"]], ["Fuori", ["K12"]], ["Coperchi", ["K12"]], ["Fuori in strada secondo il calendario", ["K12"]]] },
    { o: "Pavimento", s: [["Pavimento", ["K13", "C52"]], ["Sotto frigo e cucina", ["K08"]], ["Fughe", ["K13", "C52"]]] },
    { o: "Prese e finestra", s: [["Prese e interruttori", ["K16", "C05"]], ["Finestra", ["C18", "C17", "C16"]]] },
  ] },
  balcone: { nome: "Balcone (camere che ce l'hanno)", oggetti: [
    { o: "Balcone", s: [["Pavimento", ["E01", "M04"]], ["Scarico", ["E04", "M06", "M04"]], ["Ringhiera e rete", ["E02"]], ["Muretto", ["E02"]], ["Muro, canaline e tubi", ["P12"]], ["Sedie, sdraio e stendino", ["E03", "M06"]], ["Lampada", ["E03"]], ["Soglia", ["E02", "E01"]], ["Unità esterna del condizionatore", ["P10"]], ["Piante e sottovasi", ["P11"]]] },
  ] },
  ingresso: { nome: "Ingresso", oggetti: [
    { o: "Ingresso", s: [["Portone", ["Z01"]], ["Maniglione", ["Z01"]], ["Citofono", ["Z01"]], ["Cassetta della posta", ["Z01"]], ["Targhe", ["Z01"]], ["Pavimento e rivestimento in marmo", ["Z01"]], ["Cassapanca, lanterna e fiori", ["P15"]], ["Zerbino", ["Z01", "Z02"]], ["Bidoni dei rifiuti", ["Z11"]], ["Luci esterne", ["Z12"]]] },
  ] },
  scale: { nome: "Scale di servizio", oggetti: [
    { o: "Scale", s: [["Gradini in marmo", ["Z03"]], ["Alzate", ["Z04"]], ["Battiscopa", ["Z04"]], ["Corrimano", ["Z05"]], ["Ringhiera", ["Z05"]], ["Pianerottoli", ["Z03"]], ["Plafoniere e lampada in vimini", ["Z06", "Z12"]], ["Finestre", ["Z07"]], ["Pareti bianche", ["Z06"]], ["Disegni dipinti sui muri", ["P13"]], ["Tavolino, vaso, pampas e tovaglia", ["P15"]]] },
  ] },
  corridoio: { nome: "Corridoi", oggetti: [
    { o: "Corridoio", s: [["Pavimento", ["Z08"]], ["Battiscopa", ["Z08"]], ["Porte comuni", ["Z08"]], ["Quadri", ["Z09"]], ["Estintore", ["Z09"]], ["Luci", ["Z08"]], ["Pareti bianche", ["Z08"]], ["Disegni dipinti sui muri (2° piano)", ["P13"], true], ["Pouf contenitori e cuscini (2° piano)", ["P14"], true], ["Termosifone del corridoio", ["C10", "M03"]], ["Cestino comune", ["Z08"]]] },
  ] },
  terrazzo: { nome: "Terrazzo", oggetti: [
    { o: "Terrazzo", s: [["Pavimento", ["Z10", "M04"]], ["Scarichi", ["Z10", "M06"]], ["Ringhiere", ["Z10"]], ["Muretti", ["Z10"]], ["Mobili", ["Z10"]], ["Stendini", ["L11"]], ["Lampade", ["Z10", "Z12"]]] },
  ] },
  lavanderia: { nome: "Lavanderia, magazzino e ripostiglio", oggetti: [
    { o: "Lavatrice", s: [["Cassetto", ["L01"]], ["Guarnizione", ["L02"]], ["Filtro", ["L03"]], ["Cestello", ["L04"]], ["Esterno", ["L05"]]] },
    { o: "Asciugatrice (se c'è)", opz: true, s: [["Filtro", ["L06", "L05"]], ["Serbatoio e condensatore", ["L06"]]] },
    { o: "Lavatoio", s: [["Vasca e rubinetto", ["L07"]]] },
    { o: "Magazzino biancheria", s: [["Scaffali", ["Z13", "L08", "L21"]], ["Set di scorta per ogni camera", ["L21"]], ["Controllo alla luce alla piegatura", ["L22"]], ["Cestoni", ["L09", "Z13"]], ["Pavimento", ["Z13", "L10"]]] },
    { o: "Lavanderia", s: [["Pavimento", ["L10"]], ["Scalinata", ["L10"]], ["Stendini", ["L11"]], ["Ferro da stiro e asse", ["L23"]]] },
    { o: "Attrezzi", s: [["Carrello", ["L12"]], ["Aspirapolvere", ["L18"]], ["Scope, spazzoloni e mop", ["L17"]], ["Secchi", ["L13"]], ["Mappine", ["L14"]], ["Panni", ["L15"]], ["Spugne", ["L16"]], ["Guanti", ["L19"]]] },
    { o: "Ripostiglio dei prodotti", s: [["Scaffale dei prodotti", ["Z14", "L20"]], ["Pavimento", ["Z14"]]] },
  ] },
};
const slug = t => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export function idSuperficie(tipo, oggetto, nome) { return `${tipo}:${slug(oggetto)}:${slug(nome)}`; }
export function tipiDiLuogo(l, flags = {}) {
  if (!l) return [];
  if (l.tipo === "comune") return [l.id.startsWith("corridoio") ? "corridoio" : l.id];
  const t = ["camera", "bagno"]; if (l.tipo === "casa") t.push("cucina"); if ((flags.balconi || {})[l.id] || l.balcone) t.push("balcone"); return t;
}
// Le righe del file che sono un modo di lavorare e non una pulizia (O01 istruzioni fisse, O02 camera ferma, O03 tecnici fissi): coprono la superficie senza essere parti
export const COMPORTAMENTI = new Set(RIGHE.filter(r => !PARTI.some(p => p.codice === r.id)).map(r => r.id));
export function mappaSuperfici(regole, extraSuperfici = {}) {
  const attive = new Map(); for (const r of regole) { if (!attive.has(r.codice)) attive.set(r.codice, { codice: r.codice, nome: r.superficie || r.nome, regola: r.regola || "", ogni: r.ogni, quando: r.quando, blocco: r.blocco, come: r.come, prodotto: r.prodotto, note: r.note, minuti: r.minuti, icona: r.icona, parti: [] }); attive.get(r.codice).parti.push(r); if (!attive.has(r.id)) attive.set(r.id, attive.get(r.codice)); }
  for (const id of COMPORTAMENTI) { const r = RIGA_DI[id]; if (r && !attive.has(id)) attive.set(id, { codice: id, nome: r.superficie, regola: r.regola, ogni: 0, quando: "", blocco: r.bloccoTesto, come: r.come, prodotto: r.prodotto, note: r.note, minuti: r.minuti || 0, icona: "stella", comportamento: true, parti: [] }); }
  const perSuperficie = {};
  for (const r of regole) for (const sid of (r.superfici || [])) (perSuperficie[sid] = perSuperficie[sid] || []).push(r);
  const out = {}; let buchiTot = 0, totale = 0;
  for (const [tipo, def] of Object.entries(SUPERFICI)) {
    const oggetti = def.oggetti.map(og => ({ o: og.o, opz: !!og.opz, superfici: og.s.map(([nome, ids, opz]) => {
      const id = idSuperficie(tipo, og.o, nome);
      const visti = new Set(); const rr = [...ids.map(x => attive.get(x)).filter(Boolean).filter(x => !visti.has(x.codice) && visti.add(x.codice)), ...(perSuperficie[id] || [])];
      const buco = rr.length === 0 && !(opz || og.opz);
      return { id, nome, regole: rr, buco, opz: !!(opz || og.opz) };
    }) }));
    for (const ex of (extraSuperfici[tipo] || [])) {
      const id = ex.id || idSuperficie(tipo, ex.oggetto || "Aggiunte", ex.nome);
      const rr = perSuperficie[id] || [];
      let og = oggetti.find(x => x.o === (ex.oggetto || "Aggiunte nel giro")); if (!og) { og = { o: ex.oggetto || "Aggiunte nel giro", opz: false, superfici: [] }; oggetti.push(og); }
      og.superfici.push({ id, nome: ex.nome, regole: rr, buco: rr.length === 0, opz: false, aggiunta: true });
    }
    const sup = oggetti.flatMap(o => o.superfici); const buchi = sup.filter(x => x.buco).length;
    buchiTot += buchi; totale += sup.length;
    out[tipo] = { tipo, nome: def.nome, oggetti, superfici: sup.length, buchi };
  }
  return { tipi: out, buchi: buchiTot, superfici: totale };
}
