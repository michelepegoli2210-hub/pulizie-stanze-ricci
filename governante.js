// ============================================================================
//  LA GOVERNANTE  ·  regole + testa (niente schermate qui dentro)
//  Come una governante di un hotel di lusso: guarda il prospetto (chi parte, chi arriva,
//  quando una camera è vuota), il calendario e il registro "ultima volta fatto", e decide
//  cosa va fatto a fondo oltre alle pulizie normali. Funziona al 100% senza intelligenza
//  artificiale: sono regole + un registro. L'IA (Gemini), se c'è, serve solo per parlarle.
//
//  Le regole stanno qui sotto, una per riga: aggiungerne una è banale.
//    id        nome corto, unico
//    gruppo    A prospetto · B meteo/stagioni · C camere e bagni · D appartamenti · E zone comuni · F lavanderia
//    cosa      quello che si fa (poche parole)
//    come      la riga "come si fa" per la signora (prodotto e colore del panno compresi)
//    icona     disegno accanto alla riga
//    dove      "camere" (le 10 camere), "case" (i 3 appartamenti), "stanze" (camere + case),
//              oppure l'id di una zona comune ("terrazzo", "corridoio_p1"…)
//    ogni      ogni quanti giorni (0 = ad ogni cambio completo; 365 = una volta l'anno)
//    minuti    quanto ci vuole
//    quando    "ripasso" = piccola, si attacca alla pulizia normale della camera
//              "cambio"  = si attacca a ogni cambio completo (checklist)
//              "vuota"   = grossa, solo a camera vuota (proposta a parte)
//              "giorno"  = lavoro a sé, in un giorno di lavoro della signora (zone comuni, lavanderia…)
//    priorita  1 igiene · 2 quello che l'ospite vede · 3 quello che non si vede
//    euro      prezzo di partenza (si cambia dall'app, nel listino della governante)
//    stagione  { da: "MM-GG", a: "MM-GG" } = si propone solo in quel periodo (una volta per periodo)
//    meteo     "pioggia" | "freddo" | "caldo" | "umidita" = scatta col meteo (passo 2)
// ============================================================================
import { aggiungiGiorni, giornoSettimana, giorniTra, lunediDi, soggiornoCopre, partiRoma, aISO } from "./logica.js";

// Zone comuni (non sono camere): a chi toccano si cambia qui.
export const LUOGHI_COMUNI = [
  { id: "corridoio_p1", nome: "Corridoio e scale 1° piano", zona: "p1", tipo: "comune" },
  { id: "corridoio_p2", nome: "Corridoio e scale 2° piano", zona: "p2", tipo: "comune" },
  { id: "ingresso",     nome: "Ingresso e portone",         zona: "p1", tipo: "comune" },
  { id: "terrazzo",     nome: "Terrazzo e balconi",         zona: "p2", tipo: "comune" },
  { id: "lavanderia",   nome: "Lavanderia e attrezzi",      zona: "p1", tipo: "comune" },
];

// Colori dei panni, regola da hotel (la governante li ricorda nella riga "come si fa")
export const PANNI = { rosso: "panno ROSSO (solo WC)", giallo: "panno GIALLO (resto del bagno)", blu: "panno BLU (camera)", verde: "panno VERDE (cucina)" };

export const REGOLE_GOVERNANTE = [
  // ---- A · legate al prospetto -------------------------------------------------------------
  { id: "fondo_completa", gruppo: "A", cosa: "Pulizia a fondo completa", icona: "stella", dove: "stanze", ogni: 90, minuti: 180, quando: "vuota", priorita: 1, euro: 40, grande: true,
    come: "Mezza giornata a camera vuota: tutto il mensile in una volta, più materasso girato testa-piedi, cuscini e piumoni lavati, dietro i mobili, prese e ciabatte, pareti lavate dove serve. Panno BLU per la camera, GIALLO per il bagno, ROSSO solo per il WC." },
  { id: "controllo_lusso", gruppo: "A", cosa: "Controllo di lusso (5 minuti)", icona: "lente", dove: "stanze", ogni: 0, minuti: 5, quando: "cambio", priorita: 1, euro: 0,
    come: "A ogni cambio completo: sotto il letto, dentro cassetti e armadio, dietro la porta, dietro il WC, capelli negli scarichi, cestini lavati, telecomando-interruttori-maniglie disinfettati." },
  { id: "coprimaterasso_cambio", gruppo: "A", cosa: "Coprimaterasso e copricuscini puliti", icona: "letto", dove: "stanze", ogni: 0, minuti: 5, quando: "cambio", priorita: 1, euro: 0,
    come: "A ogni partenza si cambiano coprimaterasso e copricuscini (il copripiumino va con le lenzuola). Sempre, se macchiati." },
  { id: "coprimaterasso_fissi", gruppo: "A", cosa: "Coprimaterasso e copricuscini (ospite fisso)", icona: "letto", dove: "stanze", ogni: 21, minuti: 10, quando: "ripasso", priorita: 1, euro: 3, soloFissi: true,
    come: "Con gli ospiti che restano settimane: cambia coprimaterasso e copricuscini ogni 2-3 settimane durante il ripasso." },
  { id: "coperta_scorta", gruppo: "A", cosa: "Coperta di scorta pulita nell'armadio", icona: "coperta", dove: "camere", ogni: 0, minuti: 2, quando: "cambio", priorita: 2, euro: 0,
    come: "Controlla che nell'armadio ci sia una coperta di scorta pulita e piegata." },

  // ---- B · stagioni (il meteo vero arriva nel passo 2) ----------------------------------------
  { id: "coperte_autunno", gruppo: "B", cosa: "Lava coperte e piumoni e mettili pronti", icona: "coperta", dove: "camere", ogni: 365, minuti: 30, quando: "giorno", priorita: 2, euro: 8, stagione: { da: "10-01", a: "11-30" },
    come: "Prima del freddo: coperte e piumoni lavati e pronti nell'armadio. Le coperte si mettono solo lavate." },
  { id: "coperte_primavera", gruppo: "B", cosa: "Togli le coperte, lavale, riponile", icona: "coperta", dove: "camere", ogni: 365, minuti: 30, quando: "giorno", priorita: 2, euro: 8, stagione: { da: "05-01", a: "06-15" },
    come: "A primavera: via le coperte dai letti, lavate e riposte in sacchi chiusi." },
  { id: "condizionatori_maggio", gruppo: "B", cosa: "Condizionatori pronti per l'estate", icona: "aria", dove: "stanze", ogni: 365, minuti: 30, quando: "giorno", priorita: 1, euro: 8, stagione: { da: "05-01", a: "06-10" },
    come: "Filtri lavati e asciugati, griglie pulite, spray sanificante nelle alette. Panno BLU." },
  { id: "condizionatori_estate", gruppo: "B", cosa: "Filtri del condizionatore", icona: "aria", dove: "stanze", ogni: 30, minuti: 10, quando: "ripasso", priorita: 1, euro: 3, stagione: { da: "06-11", a: "09-15" },
    come: "D'estate ogni mese: filtri sciacquati e asciugati, griglia spolverata." },
  { id: "condizionatori_fine", gruppo: "B", cosa: "Filtri puliti a fine estate", icona: "aria", dove: "stanze", ogni: 365, minuti: 15, quando: "giorno", priorita: 2, euro: 4, stagione: { da: "09-16", a: "10-20" },
    come: "A fine estate: filtri lavati un'ultima volta, griglie pulite." },
  { id: "termosifoni", gruppo: "B", cosa: "Termosifoni e stufe spolverati e controllati", icona: "termo", dove: "stanze", ogni: 365, minuti: 15, quando: "giorno", priorita: 2, euro: 4, stagione: { da: "10-15", a: "11-30" },
    come: "Prima dell'inverno: termosifoni spolverati dentro e dietro, stufe controllate che funzionino." },
  { id: "scarichi_terrazzo", gruppo: "B", cosa: "Scarichi e griglie del terrazzo liberi dalle foglie", icona: "terrazzo", dove: "terrazzo", ogni: 365, minuti: 20, quando: "giorno", priorita: 1, euro: 5, stagione: { da: "09-15", a: "10-31" },
    come: "Togli foglie e terra da scarichi e griglie, versa un secchio d'acqua per vedere che scenda." },
  { id: "dopo_pioggia", gruppo: "B", cosa: "Dopo pioggia o vento: terrazzo, vetri esterni, davanzali, ringhiere, zerbini", icona: "pioggia", dove: "terrazzo", ogni: 2, minuti: 40, quando: "giorno", priorita: 2, euro: 10, meteo: "pioggia",
    come: "Entro 2 giorni: pavimento del terrazzo, vetri esterni, davanzali, ringhiere, tapparelle, zerbini sbattuti." },

  // ---- C · camere e bagni, a tempo fisso ---------------------------------------------------
  { id: "bagno_settimanale", gruppo: "C", cosa: "Bagno a fondo della settimana", icona: "doccia", dove: "stanze", ogni: 7, minuti: 10, quando: "ripasso", priorita: 1, euro: 0,
    come: "Scarichi e sifone con acqua bollente, spazzolino del WC sanificato, dietro e intorno al WC, piastrelle della doccia. Panno GIALLO; ROSSO solo per il WC." },
  { id: "doccia_muffa", gruppo: "C", cosa: "Doccia e silicone anti-muffa", icona: "doccia", dove: "stanze", ogni: 3.5, minuti: 5, quando: "ripasso", priorita: 1, euro: 0,
    come: "Due volte a settimana: spruzza l'anti-muffa su silicone e fughe della doccia, lascia agire, sciacqua. Panno GIALLO." },
  { id: "camera_settimanale", gruppo: "C", cosa: "Camera a fondo della settimana", icona: "letto", dove: "stanze", ogni: 7, minuti: 15, quando: "ripasso", priorita: 2, euro: 0,
    come: "Sotto il letto aspirato, testiera, specchi e vetri interni, telecomando-interruttori-maniglie-phon disinfettati, cestini lavati. Panno BLU." },
  { id: "quindicinale_camera", gruppo: "C", cosa: "Armadi, cassetti, porte e battiscopa", icona: "armadio", dove: "stanze", ogni: 14, minuti: 25, quando: "vuota", priorita: 3, euro: 6,
    come: "Dentro armadi e cassetti (svuotati e passati), battiscopa, porte davanti-dietro e bordo sopra, ante e maniglie, lampade e abat-jour, griglia del condizionatore o ventilatore, ditate sulle pareti. Panno BLU." },
  { id: "mensile_camera", gruppo: "C", cosa: "Pulizia mensile della camera", icona: "finestra", dove: "stanze", ogni: 30, minuti: 60, quando: "vuota", priorita: 2, euro: 15,
    come: "Vetri dentro e fuori, binari delle finestre, tapparelle e zanzariere, sopra gli armadi, dietro e sotto i lavandini e i tubi, fughe del bagno, soffione e rubinetti decalcificati, materasso aspirato, filtro del phon, plafoniere e ragnatele, quadri e cornici, dietro la TV, letto spostato e pulito dietro." },
  { id: "semestrale_camera", gruppo: "C", cosa: "Tende lavate, lampadari, dietro gli armadi", icona: "finestra", dove: "stanze", ogni: 180, minuti: 60, quando: "vuota", priorita: 3, euro: 15,
    come: "Ogni sei mesi: tende lavate, coperte di stagione, dietro gli armadi, lampadari, controllo di materassi e cuscini (cuscini da cambiare ogni 2 anni)." },

  // ---- D · appartamenti con cucina ----------------------------------------------------------
  { id: "cucina_ogni_pulizia", gruppo: "D", cosa: "Cucina: fornelli, lavello, microonde, bidoni", icona: "cucina", dove: "case", ogni: 0, minuti: 10, quando: "cambio", priorita: 1, euro: 0,
    come: "A ogni pulizia: fornelli, lavello, microonde, cestino lavato, bidoni della differenziata sciacquati (i piatti sporchi degli ospiti NON si lavano). Panno VERDE." },
  { id: "cucina_mensile", gruppo: "D", cosa: "Cucina a fondo del mese", icona: "cucina", dove: "case", ogni: 30, minuti: 45, quando: "giorno", priorita: 1, euro: 12,
    come: "Filtri della cappa sgrassati, forno a fondo, filtro della lavastoviglie, dentro pensili e cassetti, guarnizioni del frigo, dietro e sotto i fornelli. Panno VERDE." },
  { id: "frigo_trimestrale", gruppo: "D", cosa: "Frigo e freezer sbrinati e lavati", icona: "frigo", dove: "case", ogni: 90, minuti: 45, quando: "vuota", priorita: 1, euro: 12,
    come: "Frigo e freezer spenti, sbrinati, lavati con acqua e bicarbonato; dietro e sotto frigo e cucina. Panno VERDE." },

  // ---- E · zone comuni ------------------------------------------------------------------------
  { id: "corridoio_p1_sett", gruppo: "E", cosa: "Corridoio, scale e ingresso a fondo", icona: "scopa", dove: "corridoio_p1", ogni: 7, minuti: 30, quando: "giorno", priorita: 2, euro: 7,
    come: "Battiscopa, corrimano, plafoniere, porte comuni, segni sulle pareti; portone davanti e dietro, citofono e targhe lucidati, zerbini sbattuti. (La passata veloce è ogni giorno.)" },
  { id: "corridoio_p2_sett", gruppo: "E", cosa: "Corridoio e scale a fondo", icona: "scopa", dove: "corridoio_p2", ogni: 7, minuti: 20, quando: "giorno", priorita: 2, euro: 5,
    come: "Battiscopa, corrimano, plafoniere, porte comuni, segni sulle pareti. (La passata veloce è ogni giorno.)" },
  { id: "vetri_scale", gruppo: "E", cosa: "Vetri delle scale e zerbini lavati", icona: "finestra", dove: "corridoio_p1", ogni: 30, minuti: 30, quando: "giorno", priorita: 2, euro: 7,
    come: "Vetri delle scale dentro e fuori dove si arriva, telai e davanzali; zerbini lavati con acqua e sapone e asciugati al sole." },
  { id: "terrazzo_sett", gruppo: "E", cosa: "Terrazzo e balconi: scopa e acqua", icona: "terrazzo", dove: "terrazzo", ogni: 7, minuti: 15, quando: "giorno", priorita: 2, euro: 4,
    come: "Scopa e secchio d'acqua su terrazzo e balconi, posacenere svuotati." },
  { id: "terrazzo_mese", gruppo: "E", cosa: "Terrazzo a fondo", icona: "terrazzo", dove: "terrazzo", ogni: 30, minuti: 40, quando: "giorno", priorita: 2, euro: 10,
    come: "Pavimento strofinato, ringhiere, mobili, griglie degli scarichi." },
  { id: "bidoni", gruppo: "E", cosa: "Bidoni dei rifiuti lavati", icona: "bidone", dove: "ingresso", ogni: 14, minuti: 10, quando: "giorno", priorita: 1, euro: 3,
    come: "Bidoni svuotati, lavati con acqua e sgrassatore, asciugati aperti." },

  // ---- F · lavanderia, attrezzi e scorte ------------------------------------------------------
  { id: "lavanderia_sett", gruppo: "F", cosa: "Lavanderia della settimana", icona: "lavatrice", dove: "lavanderia", ogni: 7, minuti: 40, quando: "giorno", priorita: 1, euro: 8,
    come: "Lavatrice: cassetto del detersivo sfilato e lavato, guarnizione dell'oblò passata contro la muffa, esterno pulito (l'oblò resta aperto a fine giornata). Carrello, secchi e scope lavati e asciugati. Zona lavatrice, scalinata, pavimento e scaffali passati. Prodotti e biancheria contati: almeno un ricambio pulito completo per ogni camera; scrivi a Michele cosa manca." },
  { id: "lavanderia_mese", gruppo: "F", cosa: "Lavanderia del mese: lavaggio a vuoto, filtro, scaffali", icona: "lavatrice", dove: "lavanderia", ogni: 30, minuti: 45, quando: "giorno", priorita: 1, euro: 10,
    come: "Un lavaggio a vuoto a 90° con il pulitore, poi filtro svitato e pulito (con uno straccio sotto). Scaffali svuotati e lavati, cestoni della biancheria lavati e asciugati." },
  { id: "mappine", gruppo: "F", cosa: "Mappine e stracci nuovi", icona: "secchio", dove: "lavanderia", ogni: 35, minuti: 5, quando: "giorno", priorita: 1, euro: 0,
    come: "Mappine e stracci da terra si lavano a 60° ogni giorno che si usano e si asciugano stesi, mai bagnati nel secchio (è per questo che puzzano). Ogni 4-6 settimane si sostituiscono." },
  { id: "microfibra", gruppo: "F", cosa: "Panni in microfibra nuovi", icona: "secchio", dove: "lavanderia", ogni: 75, minuti: 5, quando: "giorno", priorita: 1, euro: 0,
    come: "I panni in microfibra si lavano a 60° senza ammorbidente e si sostituiscono ogni 2-3 mesi. Colori fissi: ROSSO = WC, GIALLO = resto del bagno, BLU = camera, VERDE = cucina." },
  { id: "aspirapolvere", gruppo: "F", cosa: "Aspirapolvere: sacco e filtri", icona: "secchio", dove: "lavanderia", ogni: 14, minuti: 10, quando: "giorno", priorita: 2, euro: 3,
    come: "Sacco cambiato, filtri battuti o lavati, spazzola liberata dai capelli." },
];

// Soglie di partenza (si cambiano dall'app, in "Le regole")
export const SOGLIE_BASE = { minutiGiorno: 60, camereSettimana: 2, freddoGradi: 12, minutiRoutine: 20, automatico: false };

// La scala "ogni quanto" per i tasti + e −
export const SCALA_OGNI = [3.5, 7, 14, 21, 30, 45, 60, 90, 120, 180, 365];
export function etichettaOgni(g) {
  if (!g) return "a ogni cambio completo";
  if (g <= 3.5) return "2 volte a settimana";
  if (g === 7) return "ogni settimana";
  if (g === 14) return "ogni 2 settimane";
  if (g === 21) return "ogni 3 settimane";
  if (g === 30) return "ogni mese";
  if (g === 45) return "ogni 6 settimane";
  if (g === 60) return "ogni 2 mesi";
  if (g === 90) return "ogni 3 mesi";
  if (g === 120) return "ogni 4 mesi";
  if (g === 180) return "ogni 6 mesi";
  if (g >= 365) return "una volta l'anno";
  return `ogni ${g} giorni`;
}

// Le regole con sopra le modifiche fatte dall'app (impostazioni/governante)
export function regoleAttive(imp) {
  const mod = (imp && imp.regole) || {}, personali = (imp && imp.personali) || {};
  const base = REGOLE_GOVERNANTE.map(r => ({ ...r, ...(mod[r.id] || {}) }));
  const extra = Object.values(personali).map(r => ({ priorita: 2, euro: 0, quando: "giorno", ...r, personale: true, ...(mod[r.id] || {}) }));
  return [...base, ...extra].filter(r => r.attiva !== false);
}
export function soglie(imp) { return { ...SOGLIE_BASE, ...((imp && imp.soglie) || {}) }; }

// A quali luoghi si applica una regola
export function luoghiDi(regola, camere, luoghi = LUOGHI_COMUNI) {
  const d = regola.dove;
  if (d === "camere") return camere.filter(c => c.tipo !== "casa");
  if (d === "case") return camere.filter(c => c.tipo === "casa");
  if (d === "stanze" || d === "tutte") return camere.slice();
  if (d && d.startsWith("zona:")) return camere.filter(c => c.zona === d.slice(5));
  if (d && d.startsWith("camera:")) return camere.filter(c => c.id === d.slice(7));
  const l = luoghi.find(x => x.id === d); return l ? [l] : [];
}
export function trovaLuogo(id, camere, luoghi = LUOGHI_COMUNI) { return camere.find(c => c.id === id) || luoghi.find(l => l.id === id) || null; }

// È dentro la stagione? (stagione: {da:"MM-GG", a:"MM-GG"})
export function inStagione(regola, iso) {
  if (!regola.stagione) return true;
  const mg = iso.slice(5), { da, a } = regola.stagione;
  return da <= a ? (mg >= da && mg <= a) : (mg >= da || mg <= a);
}

// Quanto è "scaduto" un lavoro: 0 = appena fatto, 1 = scaduto adesso, >1 = in ritardo. null = mai fatto.
export function rapportoScadenza(regola, ultima, oggi) {
  if (!regola.ogni) return null;
  if (!ultima) return Infinity;
  return giorniTra(ultima, oggi) / regola.ogni;
}
export function coloreScadenza(rapporto) { return rapporto === Infinity || rapporto == null || rapporto >= 1 ? "rosso" : rapporto >= 0.75 ? "giallo" : "verde"; }
export function testoUltima(ultima, oggi) {
  if (!ultima) return "mai";
  const g = giorniTra(ultima, oggi);
  if (g <= 0) return "oggi"; if (g === 1) return "ieri"; if (g < 7) return `${g} giorni fa`;
  if (g < 30) return `${Math.round(g / 7)} settimane fa`;
  if (g < 365) { const m = Math.round(g / 30); return m === 1 ? "1 mese fa" : `${m} mesi fa`; }
  return "più di un anno fa";
}

// Registro: { "regola|luogo": { ultima: "AAAA-MM-GG", da, n } }
export function chiaveRegistro(regola, luogo) { return `${regola}|${luogo}`; }
export function ultimaVolta(registro, regola, luogo) { return (registro && registro[chiaveRegistro(regola, luogo)]) || null; }

// --- la stanza è libera quella notte? (nessun soggiorno copre la notte) ---------------------
function liberaLaNotte(soggiorni, camera, iso) { return !soggiorni.some(s => s.camera === camera && soggiornoCopre(s, iso)); }
function nottiDiFila(soggiorni, camera, iso) { // da quante notti dorme lì lo stesso ospite (0 = libera)
  const s = soggiorni.find(x => x.camera === camera && soggiornoCopre(x, iso)); return s ? giorniTra(s.inizio, iso) : 0;
}

// Giorni della settimana in cui una stanza si può fare "a fondo": vuota quella notte, non domenica,
// non lo stesso giorno di un cambio completo (se c'è un giorno migliore). Ritorna [{iso, punti, perche}]
function giorniVuoti(camera, lun, soggiorni, pulizie, oggi) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const iso = aggiungiGiorni(lun, i);
    if (iso < oggi || giornoSettimana(iso) === 0) continue;
    if (!liberaLaNotte(soggiorni, camera.id, iso)) continue;
    const parte = soggiorni.find(s => s.camera === camera.id && s.fine === iso);
    const cambio = Object.values(pulizie).some(p => p.data === iso && p.camera === camera.id && (p.tipo === "totale" || p.tipo === "totale_casa"));
    const liberaAnchePrima = liberaLaNotte(soggiorni, camera.id, aggiungiGiorni(iso, -1));
    let punti = 10, perche = "";
    if (cambio) { punti -= 4; perche = "dopo la pulizia totale"; }
    if (parte && !liberaAnchePrima) { punti -= 2; perche = perche || `${parte.nome || "l'ospite"} parte quel giorno`; }
    if (liberaAnchePrima && !cambio) perche = perche || "camera libera";
    if (giornoSettimana(iso) === 6) punti += 1; // sabato mattina: il giorno ideale per le camere dei tecnici
    out.push({ iso, punti, perche, parte: !!parte, cambio, prossimo: soggiorni.filter(s => s.camera === camera.id && s.inizio > iso).map(s => s.inizio).sort()[0] || null });
  }
  return out.sort((a, b) => b.punti - a.punti || (a.iso < b.iso ? -1 : 1));
}

// Quanti cambi completi ha la signora quel giorno (per scegliere i giorni tranquilli)
function cambiDelGiorno(pulizie, zona, iso) { return Object.values(pulizie).filter(p => p.data === iso && p.zona === zona && (p.tipo === "totale" || p.tipo === "totale_casa")).length; }

// ============================================================================
//  LE PROPOSTE DELLA SETTIMANA
//  ctx: { lun, oggi, camere, luoghi, soggiorni, pulizie, regole, registro, soglie, rinvii }
//  Ritorna { proposte: [...], scartate: n, inRitardo: [...] }
//  proposta: { id, regola, luogo, zona, data, minuti, euro, grande, priorita, perche:[], rapporto }
// ============================================================================
export function proposteSettimana(ctx) {
  const { lun, oggi, camere, soggiorni, pulizie, registro, rinvii = {} } = ctx;
  const luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = ctx.regole || regoleAttive(null), sg = { ...SOGLIE_BASE, ...(ctx.soglie || {}) };
  const fine = aggiungiGiorni(lun, 6);
  const giorniLavoro = []; for (let i = 0; i < 7; i++) { const g = aggiungiGiorni(lun, i); if (g >= oggi && giornoSettimana(g) !== 0) giorniLavoro.push(g); }
  const candidati = [];
  for (const r of regole) {
    if (r.quando === "cambio" || r.quando === "ripasso" || r.meteo) continue; // quelle si attaccano alle pulizie normali (o aspettano il meteo)
    if (!inStagione(r, lun) && !inStagione(r, fine)) continue;
    for (const l of luoghiDi(r, camere, luoghi)) {
      const k = chiaveRegistro(r.id, l.id);
      const ult = registro?.[k]?.ultima || null;
      // già in programma (accettata) e non ancora fatta → non la ripropongo
      const giaInProgramma = Object.values(pulizie).some(p => p.origine === "governante" && p.regola === r.id && p.camera === l.id && p.stato !== "fatta" && p.data >= aggiungiGiorni(oggi, -14));
      if (giaInProgramma) continue;
      const rinvio = rinvii[k]; if (rinvio && rinvio.fino > fine) continue;
      let rapporto = rapportoScadenza(r, ult, fine);
      if (r.stagione && ult && inStagione(r, ult) && giorniTra(ult, fine) < 300) continue; // già fatta in questa stagione
      if (r.stagione && r.ogni >= 365) rapporto = ult ? rapporto : Infinity;
      if (r.soloFissi && !(nottiDiFila(soggiorni, l.id, lun) >= 14 || nottiDiFila(soggiorni, l.id, fine) >= 14)) continue;
      // quando "scade" davvero: ultima + ogni quanto. Se scade dopo questa settimana, non la propongo ancora
      const prossima = ult && r.ogni ? aggiungiGiorni(ult, Math.round(r.ogni)) : null;
      if (prossima && aggiungiGiorni(prossima, r.quando === "vuota" ? -7 : -1) > fine) continue;
      const nonPrima = prossima && prossima > oggi ? aggiungiGiorni(prossima, r.quando === "vuota" ? -7 : -1) : oggi;
      const soglia = r.quando === "vuota" ? 0.85 : 0.95;
      // dopo un soggiorno lungo (2 settimane o più) che finisce questa settimana: a fondo completa obbligatoria
      const lungo = r.id === "fondo_completa" ? soggiorni.find(s => s.camera === l.id && s.fine >= Math.max(lun, oggi) && s.fine <= fine && giorniTra(s.inizio, s.fine) >= 14) : null;
      if (rapporto !== Infinity && rapporto < soglia && !lungo) continue;
      // il giorno: a camera vuota per le grosse, un giorno tranquillo per le altre
      let data = null, perche = [];
      if (r.quando === "vuota") {
        const vuoti = giorniVuoti(l, lun, soggiorni, pulizie, oggi).filter(g => g.iso >= nonPrima);
        if (!vuoti.length) continue;
        const g = vuoti[0]; data = g.iso; if (g.perche) perche.push(g.perche);
        if (g.prossimo) perche.push(`prossimo arrivo ${g.prossimo === aggiungiGiorni(g.iso, 1) ? "il giorno dopo" : "il " + g.prossimo.slice(8) + "/" + g.prossimo.slice(5, 7)}`);
      } else {
        // giorno di lavoro della signora con meno cambi completi; appartamenti nei giorni di pulizia (martedì/venerdì)
        const zona = l.zona;
        let giorni = giorniLavoro.filter(g => g >= nonPrima);
        if (l.tipo === "casa") { const gp = giorni.filter(g => [2, 5].includes(giornoSettimana(g))); if (gp.length) giorni = gp; }
        giorni.sort((a, b) => cambiDelGiorno(pulizie, zona, a) - cambiDelGiorno(pulizie, zona, b) || (a < b ? -1 : 1));
        data = giorni[0]; if (!data) continue;
      }
      if (lungo) perche.unshift(`${lungo.nome || "l'ospite"} ha dormito qui ${giorniTra(lungo.inizio, lungo.fine)} notti`);
      if (rapporto === Infinity) perche.unshift(r.stagione ? "non risulta fatto quest'anno" : "non risulta mai fatto");
      else perche.unshift(`ultima volta ${testoUltima(ult, oggi)}`);
      if (r.stagione) perche.push("è il periodo giusto");
      if (r.soloFissi) perche.push("ospite fisso da più di 2 settimane");
      if (lungo) rapporto = Infinity;
      candidati.push({ id: `${r.id}|${l.id}|${data}`, regola: r.id, cosa: r.cosa, icona: r.icona, come: r.come, luogo: l.id, luogoNome: l.nome, luogoTipo: l.tipo, zona: l.zona, data, minuti: r.minuti, euro: r.euro || 0, grande: !!r.grande || r.quando === "vuota", priorita: r.priorita || 2, perche, rapporto: rapporto === Infinity ? 99 : rapporto, chiave: k });
    }
  }
  // ordine: più scadute prima, poi igiene > visibile > invisibile, poi le grosse
  candidati.sort((a, b) => (b.rapporto - a.rapporto) || (a.priorita - b.priorita) || (a.data < b.data ? -1 : 1));
  // carico di lavoro: massimo N minuti al giorno per signora (le "grande" contano a parte: max camereSettimana a settimana)
  const minutiGiorno = {}, grandi = { n: 0 }, perLuogo = {}, scelte = [];
  let scartate = 0;
  for (const c of candidati) {
    if (scelte.length >= 8) { scartate++; continue; }
    if ((perLuogo[c.luogo] || 0) >= 2) { scartate++; continue; } // non più di due cose nello stesso posto a settimana
    perLuogo[c.luogo] = (perLuogo[c.luogo] || 0) + 1;
    if (c.grande) {
      if (grandi.n >= sg.camereSettimana) { scartate++; continue; }
      // una grossa per signora al giorno, e solo in un giorno con al massimo 1 cambio completo
      if (scelte.some(s => s.grande && s.zona === c.zona && s.data === c.data) || cambiDelGiorno(pulizie, c.zona, c.data) > 1) { scartate++; continue; }
      grandi.n++; scelte.push(c); continue;
    }
    const kk = `${c.zona}|${c.data}`;
    if ((minutiGiorno[kk] || 0) + c.minuti > sg.minutiGiorno) {
      // provo un altro giorno della settimana
      const alt = giorniLavoro.find(g => g !== c.data && (minutiGiorno[`${c.zona}|${g}`] || 0) + c.minuti <= sg.minutiGiorno && (c.luogoTipo !== "casa" || [2, 5].includes(giornoSettimana(g))));
      if (!alt) { scartate++; continue; }
      c.data = alt; c.id = `${c.regola}|${c.luogo}|${alt}`;
    }
    minutiGiorno[`${c.zona}|${c.data}`] = (minutiGiorno[`${c.zona}|${c.data}`] || 0) + c.minuti;
    scelte.push(c);
  }
  scelte.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0) || (a.zona < b.zona ? -1 : 1));
  // in ritardo: lavori della governante accettati, col giorno passato e non fatti
  const inRitardo = Object.values(pulizie).filter(p => p.origine === "governante" && p.stato !== "fatta" && p.data < oggi).sort((a, b) => a.data < b.data ? -1 : 1);
  return { proposte: scelte, scartate, inRitardo };
}

// ============================================================================
//  LE PICCOLE COSE "A FONDO" DA ATTACCARE A UNA PULIZIA NORMALE (ripasso / cambio completo)
//  Ritorna le regole da fare in quella pulizia, entro soglie.minutiRoutine, con i rapporti di scadenza.
// ============================================================================
export function routinePer(p, ctx) {
  if (!p || p.origine === "governante" || p.tipo === "extra") return [];
  const { camere, registro, oggi } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = ctx.regole || regoleAttive(null), sg = { ...SOGLIE_BASE, ...(ctx.soglie || {}) };
  const l = trovaLuogo(p.camera, camere, luoghi); if (!l) return [];
  const cambio = p.tipo === "totale" || p.tipo === "totale_casa";
  const fisso = ctx.soggiorni ? nottiDiFila(ctx.soggiorni, p.camera, p.data) >= 14 : false;
  const out = [];
  for (const r of regole) {
    if (!(r.quando === "cambio" || r.quando === "ripasso")) continue;
    if (!luoghiDi(r, camere, luoghi).some(x => x.id === l.id)) continue;
    if (!inStagione(r, p.data)) continue;
    if (r.quando === "cambio" && !cambio) continue;
    if (r.soloFissi && !fisso) continue;
    const ult = registro?.[chiaveRegistro(r.id, l.id)]?.ultima || null;
    const rapporto = r.ogni ? rapportoScadenza(r, ult, p.data) : Infinity;
    if (r.ogni && rapporto < 0.9) continue;
    out.push({ regola: r.id, cosa: r.cosa, come: r.come, icona: r.icona, minuti: r.minuti, priorita: r.priorita || 2, sempre: !r.ogni, rapporto, ultima: ult });
  }
  // prima quelle "ad ogni cambio", poi le più scadute; entro il tempo massimo (le "sempre" non contano)
  out.sort((a, b) => (b.sempre - a.sempre) || (b.rapporto - a.rapporto) || (a.priorita - b.priorita));
  let min = 0; return out.filter(x => { if (x.sempre) return true; if (min + x.minuti > sg.minutiRoutine) return false; min += x.minuti; return true; });
}

// ============================================================================
//  IL CALENDARIO DEL PULITO: per ogni luogo, tutte le regole con "ultima volta" e il colore
// ============================================================================
export function calendarioPulito(ctx) {
  const { camere, registro, oggi } = ctx; const luoghi = ctx.luoghi || LUOGHI_COMUNI, regole = (ctx.regole || regoleAttive(null)).filter(r => r.ogni > 0 && !r.meteo);
  const tutti = [...camere, ...luoghi];
  return tutti.map(l => {
    const voci = regole.filter(r => luoghiDi(r, camere, luoghi).some(x => x.id === l.id) && (!r.stagione || inStagione(r, oggi))).map(r => {
      const reg = registro?.[chiaveRegistro(r.id, l.id)] || null; const rapporto = rapportoScadenza(r, reg?.ultima || null, oggi);
      return { regola: r.id, cosa: r.cosa, icona: r.icona, ogni: r.ogni, ultima: reg?.ultima || null, da: reg?.da || "", rapporto, colore: coloreScadenza(rapporto), testo: testoUltima(reg?.ultima || null, oggi) };
    }).sort((a, b) => (b.rapporto === Infinity ? 99 : b.rapporto) - (a.rapporto === Infinity ? 99 : a.rapporto));
    const fondo = voci.find(v => v.regola === "fondo_completa");
    const peggio = voci[0] || null;
    const punteggio = voci.reduce((s, v) => s + Math.min(3, v.rapporto === Infinity ? 3 : v.rapporto), 0) / Math.max(1, voci.length);
    return { luogo: l.id, nome: l.nome, zona: l.zona, tipo: l.tipo, voci, fondo, peggio, punteggio, rossi: voci.filter(v => v.colore === "rosso").length, gialli: voci.filter(v => v.colore === "giallo").length };
  }).sort((a, b) => b.punteggio - a.punteggio);
}

// La settimana che la governante prepara: quella in corso; da sabato alle 13 in poi, la prossima
export function settimanaGovernante(adesso = new Date()) {
  const p = partiRoma(adesso);
  const iso = aISO(new Date(Date.UTC(p.y, p.m - 1, p.d, 12)));
  const lun = lunediDi(iso);
  if (p.wd === 0 || (p.wd === 6 && p.h >= 13)) return aggiungiGiorni(lun, 7);
  return lun;
}
