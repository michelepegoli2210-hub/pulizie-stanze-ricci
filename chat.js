// ============================================================================
//  LA CHAT CON LA GOVERNANTE (Michele, specifiche §11): una collaboratrice che fa domande.
//  Niente intelligenza artificiale: le domande nascono dalle regole qui sotto, guardando il prospetto, il meteo segnato,
//  le pulizie e le paghe. Ogni domanda ha 2-4 pulsanti grandi e "Dimmelo a parole". Le risposte fanno davvero qualcosa
//  nell'app (le azioni stanno in app.js: qui si decide solo COSA chiedere, QUANDO e in che ORDINE).
//  Massimo 3 domande al giorno: quelle del mattino compaiono dopo le 8, quelle del report dopo le 13, le urgenze subito.
//  "Impara": alla seconda risposta uguale alla stessa domanda chiede "la prossima volta lo faccio da sola?".
// ============================================================================
import * as L from "./logica.js";
import { CAMERE, ZONE } from "./regole.js";

export const MAX_AL_GIORNO = 3;
export const MAX_PER_TIPO = 1; // nei 3 posti del giorno, una domanda per tipo (poi si riempie col resto)
export const ORA_MATTINA = 8, ORA_REPORT = 13;
export const GIORNI_STORICO = 7;
export const TESTO_PIOGGIA = "Ha piovuto: tappeti e zerbini a posto, vetri esterni, davanzali e balconi.";
export const TESTO_FREDDO = "Arriva il freddo: coperte sui letti occupati, controllate che i termosifoni scaldino.";
export const TESTO_CALDO = "Arriva il caldo: via le coperte pesanti, filtri dei condizionatori puliti, finestre con la zanzariera.";
export const NOMI_MODI_CHAT = { tecnici: "Tecnici", operai: "Operai", booking: "Booking" };
// per queste domande la governante non propone mai di "fare da sola" (i soldi li conferma sempre Michele)
export const NON_IMPARA = new Set(["paga", "budget", "manutenzione", "regola"]);
export const BUDGET_STELLE_BASE = 400; // € al mese di stelle (Michele: l'avviso solo quando sfora davvero): la domanda 7 scatta al 90%; si cambia in Regole
export const ORA_FINE_SIGNORE = 14; // dopo quest'ora le proposte vanno al prossimo giorno di passaggio, mai a "oggi"
export const GRUPPI = { nome: "nomi", manutenzione: "manutenzioni" }; // domande che si fanno in una schermata sola, un tocco per riga, fuori dalle 3 del giorno
export const MOTIVO_PRODOTTO = /prodotto/i;

const nomeZona = (zone, z) => `Signora ${(zone && zone[z] && zone[z].breve) || z}`;
const camera = (camere, id) => (camere || CAMERE).find(c => c.id === id) || { id, nome: id, zona: "?", tipo: "camera" };
const chiaveRisposta = (tipo, k) => `${tipo}|${k}`;

// ---- Le regole di domanda ----------------------------------------------------------------------------------------------
// 1. Nome nuovo nel prospetto senza tipo di ospite → "D'Agostino: chi sono?" [Tecnici] [Operai] [Booking]
export function domandeNomeNuovo(st) {
  const oggi = st.oggi, clienti = st.clienti || {}, out = {};
  for (const s of st.soggiorni || []) {
    if (!s || !s.nome || s.nome === "?" || /^sig\.?ra russo$/i.test(s.nome)) continue;
    if (s.fine < L.aggiungiGiorni(oggi, -1) || s.inizio > L.aggiungiGiorni(oggi, 21)) continue; // passati o troppo lontani: niente
    if (L.NOMI_MODI.includes(s.modo)) continue; // scelto a mano su quel soggiorno
    const nomeCl = L.nomeCliente(s.nome) || s.nome; const k = L.normNome(nomeCl); if (!k) continue;
    if (L.clienteDi(s.nome, clienti)) continue; // già in rubrica
    const d = out[k] = out[k] || { k, nome: nomeCl, camere: [], modoAttuale: L.modoSoggiorno(s, clienti), primo: s.inizio };
    const c = camera(st.camere, s.camera); if (!d.camere.includes(c.nome)) d.camere.push(c.nome);
    if (s.inizio < d.primo) d.primo = s.inizio;
  }
  return Object.values(out).map(d => ({
    id: chiaveRisposta("nome", d.k), tipo: "nome", chiave: d.k, priorita: 40, quando: "mattina", urgente: false,
    titolo: `${d.nome}: chi sono?`,
    testo: `${d.nome} (${d.camere.join(", ")}): chi sono? Per ora li tratto come ${NOMI_MODI_CHAT[d.modoAttuale] || "Tecnici"}. Lo ricordo per tutti i soggiorni con questo nome.`,
    tasti: [{ k: "tecnici", testo: "Tecnici" }, { k: "operai", testo: "Operai" }, { k: "booking", testo: "Booking" }],
    parole: true, dati: d,
  }));
}
// 2. Ha piovuto / vento forte (dal tocco in Regole) → messaggio alle signore per domani + le stelle del meteo
export function domandePioggia(st) {
  const m = (st.gov && st.gov.meteo) || {}; const fino = [m.pioggia, m.vento].filter(x => x && x >= st.oggi).sort().pop();
  if (!fino) return [];
  return [{
    id: chiaveRisposta("pioggia", fino), tipo: "pioggia", chiave: fino, priorita: 20, quando: "subito", urgente: false,
    titolo: "Ha piovuto",
    testo: `Ha piovuto (o c'è stato vento forte). Domani mando alle signore: «${TESTO_PIOGGIA}» e metto le stelle del meteo (esterni, davanzali, scarichi, balconi) fino a ${L.dataBreve(fino)}?`,
    tasti: [{ k: "si", testo: "Sì, manda" }, { k: "stelle", testo: "Solo le stelle" }, { k: "no", testo: "No" }],
    parole: true, dati: { fino, domani: L.aggiungiGiorni(st.oggi, 1) },
  }];
}
// 3. Arriva il freddo / il caldo (dal tocco in Regole) → coperte sui letti occupati (o il contrario)
export function domandeStagione(st) {
  const m = (st.gov && st.gov.meteo) || {}; const out = [];
  for (const [k, testo, titolo] of [["freddo", TESTO_FREDDO, "Arriva il freddo"], ["caldo", TESTO_CALDO, "Arriva il caldo"]]) {
    if (!m[k] || m[k] < st.oggi) continue;
    const ven = prossimoGiorno(st.oggi, 5);
    out.push({
      id: chiaveRisposta(k, m[k]), tipo: k, chiave: m[k], priorita: 30, quando: "mattina", urgente: false, titolo,
      testo: k === "freddo" ? `Arriva il freddo: coperte sui letti occupati da ${L.dataBreve(ven)}? Lo scrivo alle signore per quel giorno e le trapuntine entrano nelle totali.` : `Arriva il caldo: via le coperte pesanti da ${L.dataBreve(ven)}? Lo scrivo alle signore per quel giorno.`,
      tasti: [{ k: "si", testo: "Sì" }, { k: "dopo", testo: "Più avanti" }],
      parole: true, dati: { giorno: ven, testo },
    });
  }
  return out;
}
function prossimoGiorno(oggi, wd) { let d = oggi; for (let i = 0; i < 7; i++) { if (L.giornoSettimana(d) === wd && d > oggi) return d; d = L.aggiungiGiorni(d, 1); } return L.aggiungiGiorni(oggi, 7); }
// 4. Camera libera 2 giorni o più (e la pulizia a fondo è dovuta) → "la facciamo a fondo (3 ore, 40 €)?"
export const GIORNI_FONDO_DOVUTA = 150; // la fondo completa è ogni 6 mesi: si propone quando mancano 30 giorni o è già passata
export function domandeCameraLibera(st) {
  const oggi = st.oggi, sog = st.soggiorni || [], out = [];
  const prezzo = Number((st.listino && st.listino.fondo) || 40);
  const noDiRecente = cam => Object.values(st.chat && st.chat.risposte || {}).some(r => r.tipo === "libera" && r.dati && r.dati.camera === cam && r.risposta === "no" && r.il >= L.aggiungiGiorni(oggi, -30));
  // fin dove arriva il prospetto: dopo l'ultimo arrivo scritto non si sa niente (la settimana dopo spesso non è ancora inserita),
  // quindi una camera "libera" oltre quel giorno non conta come libera
  const orizzonte = sog.reduce((m, s) => s.inizio > m ? s.inizio : m, oggi);
  for (const c of st.camere || CAMERE) {
    if (c.tipo === "comune") continue;
    const occupata = iso => sog.some(s => s.camera === c.id && L.soggiornoCopre(s, iso));
    // la fondo è dovuta? (dal registro: ultima C57 su questa camera)
    const reg = st.registro && (st.registro[`C57|${c.id}`] || st.registro[`C57_${c.id}`]);
    const ultimaFondo = reg && reg.ultima; if (ultimaFondo && L.giorniTra(ultimaFondo, oggi) < GIORNI_FONDO_DOVUTA) continue;
    // una fondo già in programma per questa camera?
    if (Object.values(st.pulizie || {}).some(p => p.camera === c.id && p.origine === "governante" && (p.regola === "C57" || p.grande) && p.data >= oggi && p.stato !== "non_fatta")) continue;
    if (noDiRecente(c.id)) continue;
    // la prima finestra libera di almeno 2 giorni nei prossimi 7, senza contare la domenica come giorno di lavoro.
    // Dopo l'orario delle signore (dalle 14) "oggi" non vale più: si parte da domani (Michele, ritocco 2)
    const ora = st.ora != null ? st.ora : L.partiRoma(st.adesso || new Date()).h;
    const primo = ora >= ORA_FINE_SIGNORE ? L.aggiungiGiorni(oggi, 1) : oggi;
    const passaggi = new Set(L.passaggiCamera(c, st.regole).map(x => x.giorno));
    let trovata = null;
    for (let i = L.giorniTra(oggi, primo); i <= 7 && !trovata; i++) {
      const d = L.aggiungiGiorni(oggi, i); if (occupata(d)) continue;
      let n = 0, fine = d; while (!occupata(fine) && n < 14 && fine < orizzonte) { n++; fine = L.aggiungiGiorni(fine, 1); }
      if (n === 0) { i += 1; continue; }
      // il weekend normale dei Tecnici (venerdì → lunedì) non è una "camera libera": ci pensa già la totale del venerdì a camera vuota
      const haWeekend = (() => { for (let g = d, j = 0; j < n; j++, g = L.aggiungiGiorni(g, 1)) if (L.giornoSettimana(g) === 0 || L.giornoSettimana(g) === 6) return true; return false; })();
      if (n >= 2 && !(n <= 3 && haWeekend)) {
        // il giorno proposto: il primo giorno libero che è anche un giorno di passaggio della signora in quella camera; se no il primo feriale
        const liberi = []; for (let g = d; g < fine; g = L.aggiungiGiorni(g, 1)) if (L.giornoSettimana(g) !== 0) liberi.push(g);
        const giorno = liberi.find(g => passaggi.has(L.giornoSettimana(g))) || liberi[0] || d;
        trovata = { da: d, fino: fine, giorni: n, giorno };
      }
      else i += n; // salta la finestra corta
    }
    if (!trovata) continue;
    const arrivo = sog.filter(s => s.camera === c.id && s.inizio >= trovata.fino).sort((a, b) => a.inizio < b.inizio ? -1 : 1)[0];
    const finoTesto = arrivo && arrivo.inizio === trovata.fino ? `fino a ${L.dataBreve(arrivo.inizio)} (arriva ${arrivo.nome})` : `almeno fino a ${L.dataBreve(trovata.fino)}`;
    const daTesto = trovata.da <= oggi ? "è libera da oggi" : `è libera da ${L.dataBreve(trovata.da)}`;
    const urgente = false; // (una camera che si libera all'improvviso passa comunque per prima: priorità 10)
    out.push({
      id: chiaveRisposta("libera", `${c.id}|${trovata.da}`), tipo: "libera", chiave: `${c.id}|${trovata.da}`, priorita: 10, quando: urgente ? "subito" : "mattina", urgente,
      titolo: `${c.nome} è libera`,
      testo: `${c.nome} ${daTesto} ${finoTesto}: la facciamo a fondo ${L.dataBreve(trovata.giorno)} (3 ore, ${L.eur(prezzo)}, ${nomeZona(st.zone || ZONE, L.zonaDi(c, st.regole))})?${ultimaFondo ? ` L'ultima a fondo è di ${L.dataBreve(ultimaFondo)}.` : " Non risulta mai fatta a fondo."}`,
      tasti: [{ k: "si", testo: "Sì, a fondo" }, { k: "stelle", testo: "Solo le stelle in ritardo" }, { k: "no", testo: "No" }],
      parole: true, dati: { camera: c.id, nome: c.nome, da: trovata.da, fino: trovata.fino, giorno: trovata.giorno, giorni: trovata.giorni, prezzo, zona: L.zonaDi(c, st.regole) },
    });
  }
  return out.sort((a, b) => a.dati.da < b.dati.da ? -1 : 1);
}
// 11. Ogni sabato alle 13: il conto delle paghe della settimana appena chiusa e la pagella del pulito → "Pago così?"
export function domandePaga(st) {
  const chiusa = L.settimanaPrecedente(L.chiaveSettimana(st.adesso || new Date()));
  const zone = Object.entries(st.zone || ZONE).sort((a, b) => (a[1].ordine || 0) - (b[1].ordine || 0));
  const righe = [];
  for (const [z, v] of zone) {
    const t = L.totaleSettimana(st.pulizie || {}, z, chiusa, st.regole, st.controlli || {});
    if (!t.totale) continue;
    if (st.pagamenti && st.pagamenti[`${z}_${chiusa}`]) continue;
    const votati = t.lista.filter(p => p.voto != null); const media = votati.length ? Math.round(votati.reduce((s, p) => s + Number(p.voto), 0) / votati.length * 10) / 10 : null;
    righe.push({ zona: z, nome: nomeZona(st.zone || ZONE, z), totale: t.totale, pulizie: t.lista.length, bonus: t.bonus, media, controlli: votati.length });
  }
  if (!righe.length) return [];
  const tot = righe.reduce((s, r) => s + r.totale, 0);
  const testo = `Settimana ${L.etichettaSettimana(chiusa)}, le paghe: ${righe.map(r => `${r.nome} ${L.eur(r.totale)} (${r.pulizie} ${r.pulizie === 1 ? "pulizia" : "pulizie"}${r.bonus && r.bonus.importo ? `, bonus controlli` : ""}${r.media != null ? `, voto medio ${String(r.media).replace(".", ",")} su ${r.controlli} controlli` : ", nessun controllo"})`).join(" · ")}. In tutto ${L.eur(tot)}. Pago così?`;
  return [{
    id: chiaveRisposta("paga", chiusa), tipo: "paga", chiave: chiusa, priorita: 5, quando: "report", urgente: false,
    titolo: `Paghe ${L.etichettaSettimana(chiusa)}`, testo,
    tasti: [{ k: "si", testo: "Sì, pago così" }, { k: "guardo", testo: "Guardo prima" }],
    parole: true, dati: { chiusa, righe, totale: tot },
  }];
}
// 5. Il report delle 13: (a) una camera non controllata da 2 settimane, (b) una rifinitura "Non riesco" 2 volte di fila,
//    (c) una signora sotto il 90% di affidabilità (pulizie chiuse col Fatto sulle previste, ultime 4 settimane)
export const GIORNI_SENZA_CONTROLLO = 14, SETTIMANE_AFFIDABILITA = 4, SOGLIA_AFFIDABILITA = 90;
export function domandeReport(st) {
  const oggi = st.oggi, out = [], pulizie = Object.values(st.pulizie || {}), controlli = st.controlli || {};
  const da14 = L.aggiungiGiorni(oggi, -GIORNI_SENZA_CONTROLLO);
  // (a) camere pulite nelle ultime 2 settimane senza nessun controllo
  const sab = prossimoGiorno(oggi, 6);
  for (const c of st.camere || CAMERE) {
    if (c.tipo === "comune") continue;
    const fatte = pulizie.filter(p => p.camera === c.id && p.stato === "fatta" && p.data >= da14 && p.tipo !== "extra" && p.tipo !== "fondo");
    if (fatte.length < 2) continue;
    if (Object.values(controlli).some(k => k.camera === c.id && k.data >= da14 && (k.voto != null || k.votoProprietario != null))) continue;
    const ultima = fatte.sort((a, b) => a.data < b.data ? 1 : -1)[0];
    out.push({ id: chiaveRisposta("controllo", `${c.id}|${L.lunediDi(oggi)}`), tipo: "controllo", chiave: `${c.id}|${L.lunediDi(oggi)}`, priorita: 25, quando: "report", urgente: false,
      titolo: `${c.nome} non è controllata`,
      testo: `${c.nome} non è controllata da ${GIORNI_SENZA_CONTROLLO} giorni (${fatte.length} pulizie senza un voto). Che faccio?`,
      tasti: [{ k: "sabato", testo: `Falla controllare ${L.dataBreve(sab)}` }, { k: "io", testo: "La controllo io" }, { k: "lascia", testo: "Lascia stare" }],
      parole: false, dati: { camera: c.id, nome: c.nome, pulizia: ultima.id, sabato: sab, zona: ultima.zona } });
  }
  // (b) la stessa stella "non riesco" le ultime 2 volte nella stessa camera
  const eventi = {};
  for (const p of pulizie.filter(p => p.stato === "fatta" && p.data >= L.aggiungiGiorni(oggi, -45))) {
    for (const r of p.rifiniture || []) if (r.euro) (eventi[`${p.camera}|${r.regola}`] = eventi[`${p.camera}|${r.regola}`] || []).push({ data: p.data, fatta: true, nome: r.nome });
    for (const x of p.nonFatte || []) { const m = String(x.k).match(/^S(.+)$/); if (m) (eventi[`${p.camera}|${m[1]}`] = eventi[`${p.camera}|${m[1]}`] || []).push({ data: p.data, fatta: false, nome: x.testo, motivo: x.motivo || "", zona: p.zona }); }
  }
  for (const [k, ev] of Object.entries(eventi)) {
    ev.sort((a, b) => a.data < b.data ? -1 : 1); const ultimi = ev.slice(-2);
    if (ultimi.length < 2 || ultimi.some(e => e.fatta)) continue;
    const [cam, regola] = k.split("|"); const c = camera(st.camere, cam); const u = ultimi[1];
    out.push({ id: chiaveRisposta("nonriesco", `${cam}|${regola}|${u.data}`), tipo: "nonriesco", chiave: `${cam}|${regola}|${u.data}`, priorita: 28, quando: "report", urgente: false,
      titolo: `${c.nome}: «${u.nome}» non riesce`,
      testo: `In ${c.nome} la signora non riesce a fare «${u.nome}» da 2 volte di fila${u.motivo ? ` (${u.motivo.toLowerCase()})` : ""}. Che faccio?`,
      tasti: [{ k: "lavoro", testo: "Mettilo come lavoro a parte" }, { k: "riprova", testo: "Riprova la prossima volta" }, { k: "spegni", testo: "Spegni la regola" }],
      parole: true, dati: { camera: cam, nome: c.nome, regola, cosa: u.nome, motivo: u.motivo, zona: u.zona || c.zona } });
  }
  // (c) affidabilità delle signore: pulizie chiuse col Fatto sulle previste (ultime 4 settimane, fino a ieri)
  const da28 = L.aggiungiGiorni(oggi, -7 * SETTIMANE_AFFIDABILITA), ieri = L.aggiungiGiorni(oggi, -1);
  for (const [z, v] of Object.entries(st.zone || ZONE)) {
    const previste = pulizie.filter(p => p.zona === z && p.data >= da28 && p.data <= ieri && p.tipo !== "extra" && p.origine !== "governante" && p.stato !== "non_fatta");
    if (previste.length < 10) continue;
    const fatte = previste.filter(p => p.stato === "fatta").length; const perc = Math.round(fatte / previste.length * 100);
    if (perc >= SOGLIA_AFFIDABILITA) continue;
    out.push({ id: chiaveRisposta("affidabilita", `${z}|${L.lunediDi(oggi)}`), tipo: "affidabilita", chiave: `${z}|${L.lunediDi(oggi)}`, priorita: 27, quando: "report", urgente: false,
      titolo: `${nomeZona(st.zone || ZONE, z)}: ${perc}% di pulizie chiuse`,
      testo: `La ${nomeZona(st.zone || ZONE, z)} nelle ultime ${SETTIMANE_AFFIDABILITA} settimane ha chiuso col Fatto ${fatte} pulizie su ${previste.length} (${perc}%): le altre risultano ancora da fare. Che faccio?`,
      tasti: [{ k: "ricorda", testo: "Ricordaglielo nel messaggio di domani" }, { k: "io", testo: "Gliene parlo io" }, { k: "lascia", testo: "Lascia stare" }],
      parole: true, dati: { zona: z, perc, fatte, previste: previste.length, domani: L.aggiungiGiorni(oggi, 1) } });
  }
  return out;
}
// 6. Manca un prodotto (dal "Non riesco: manca il prodotto") → lista della spesa
export function domandeProdotto(st) {
  const oggi = st.oggi, out = {}, da = L.aggiungiGiorni(oggi, -14), spesa = (st.spesa && st.spesa.voci) || {};
  for (const p of Object.values(st.pulizie || {})) {
    if (p.stato !== "fatta" || p.data < da) continue;
    for (const x of p.nonFatte || []) {
      if (!MOTIVO_PRODOTTO.test(x.motivo || "")) continue;
      const m = String(x.k).match(/^S(.+)$/); const regola = m ? m[1] : null;
      const r = regola && st.catalogo ? st.catalogo.find(c => c.id === regola) : null;
      const noto = !!(r && r.prodotto && !/^(nessuno|—|-)$/i.test(r.prodotto));
      if (!noto) continue; // regola senza prodotto (si fa con un attrezzo) o sconosciuta: la risposta la riceve la signora, non Michele (ritocco 1)
      const prodotto = r.prodotto;
      const k = `${L.normNome(prodotto)}|${p.zona}`;
      if (Object.values(spesa).some(v => !v.fatto && L.normNome(v.prodotto) === L.normNome(prodotto) && v.zona === p.zona)) continue; // già in lista
      const d = out[k] = out[k] || { prodotto, noto, zona: p.zona, per: [], ultima: p.data };
      if (!d.per.includes(x.testo)) d.per.push(x.testo); if (p.data > d.ultima) d.ultima = p.data;
    }
  }
  return Object.values(out).map(d => ({
    id: chiaveRisposta("prodotto", `${L.normNome(d.prodotto)}|${d.zona}|${d.ultima}`), tipo: "prodotto", chiave: `${L.normNome(d.prodotto)}|${d.zona}|${d.ultima}`, priorita: 15, quando: "mattina", urgente: false,
    titolo: `Manca ${d.prodotto}`,
    testo: `Manca «${d.prodotto}» alla ${nomeZona(st.zone || ZONE, d.zona)} (per: ${d.per.slice(0, 3).join(", ")}). Che faccio?`,
    tasti: [{ k: "io", testo: "Lo compro io" }, { k: "papa", testo: "Lo porta papà" }, { k: "salta", testo: "Salta questa settimana" }],
    parole: true, dati: d,
  }));
}
// 7. Budget delle stelle quasi finito (90% del budget del mese)
export function domandeBudget(st) {
  const oggi = st.oggi, mese = L.meseDi(oggi), gov = st.gov || {};
  const budget = Number((gov.soglie && gov.soglie.budgetStelle) || BUDGET_STELLE_BASE);
  if (!budget) return [];
  const speso = Object.values(st.pulizie || {}).filter(p => p.stato === "fatta" && L.meseDi(p.data) === mese).reduce((s, p) => s + (Number(p.extraRifiniture) || 0) + (p.origine === "governante" ? Number(p.importo) || 0 : 0), 0);
  if (speso < budget * 0.9) return [];
  const frenoAttivo = gov.freno && gov.freno.fino >= oggi;
  return [{
    id: chiaveRisposta("budget", mese), tipo: "budget", chiave: mese, priorita: 12, quando: "mattina", urgente: false,
    titolo: `Stelle: ${L.eur(speso)} su ${L.eur(budget)}`,
    testo: `Questo mese le stelle e i lavori della governante sono a ${L.eur(Math.round(speso))} su ${L.eur(budget)} di budget${frenoAttivo ? " (freno sul nascosto già acceso)" : ""}. Che faccio?`,
    tasti: [{ k: "freno", testo: "Freno sul nascosto" }, { k: "vai", testo: "Lascio andare" }, { k: "alzo", testo: "Alzo il budget" }],
    parole: false, dati: { mese, speso: Math.round(speso), budget, fino: L.ultimoDelMese(oggi) },
  }];
}
// 8. Lavoro di manutenzione fermo da 7 giorni
export const GIORNI_MANUTENZIONE = 7;
export function domandeManutenzione(st) {
  const oggi = st.oggi, out = [];
  for (const [id, m] of Object.entries(st.manutenzione || {})) {
    if (!m || m.stato === "fatto") continue;
    const da = m.data || oggi; const giorni = L.giorniTra(da, oggi); if (giorni < GIORNI_MANUTENZIONE) continue;
    const riferimento = m.chiamato && m.chiamato > da ? m.chiamato : da; if (L.giorniTra(riferimento, oggi) < GIORNI_MANUTENZIONE) continue;
    const c = m.camera ? camera(st.camere, m.camera) : null;
    out.push({ id: chiaveRisposta("manutenzione", `${id}|${riferimento}`), tipo: "manutenzione", chiave: `${id}|${riferimento}`, priorita: 22, quando: "mattina", urgente: false,
      titolo: `${m.titolo || "Lavoro"} fermo da ${giorni} giorni`,
      testo: `«${m.titolo || "Lavoro"}»${c ? ` (${c.nome})` : ""} è segnalato da ${giorni} giorni${m.chiamato ? `, tecnico chiamato ${L.dataBreve(m.chiamato)}` : ""}${m.nota ? ` · nota: ${m.nota}` : ""}. Che faccio?`,
      tasti: [{ k: "chiamato", testo: m.chiamato ? "Richiamo il tecnico" : "Chiamo il tecnico: segna «chiamato»" }, { k: "fatto", testo: "È sistemato" }, { k: "aspetta", testo: "Aspetta ancora" }],
      parole: true, dati: { id, titolo: m.titolo || "Lavoro", camera: m.camera || null, cameraNome: c ? c.nome : "", giorni, chiamato: m.chiamato || "" } });
  }
  return out;
}
// 9. Una regola in ritardo in molte camere (dal Tabellone: celle rosse della stessa regola in 4+ camere)
export const CAMERE_REGOLA_IN_RITARDO = 4;
export function domandeRegola(st) {
  const tb = st.tabellone; if (!tb || !tb.celle) return [];
  const oggi = st.oggi, lun = L.lunediDi(oggi);
  const perRegola = {};
  for (const c of tb.celle) { if (c.colore !== "rosso" || c.tipo === "comune") continue; const x = perRegola[c.regola] = perRegola[c.regola] || { regola: c.regola, codice: c.codice, nome: c.nome, camere: new Set(), mai: 0, giorni: 0 }; x.camere.add(c.luogo); if (!c.ultima) x.mai++; else x.giorni = Math.max(x.giorni, L.giorniTra(c.ultima, oggi)); }
  const lista = Object.values(perRegola).filter(x => x.camere.size >= CAMERE_REGOLA_IN_RITARDO).sort((a, b) => b.camere.size - a.camere.size);
  if (!lista.length) return [];
  const x = lista[0];
  const quanto = x.mai === x.camere.size ? "non è mai stata fatta" : x.giorni >= 14 ? `non si fa da ${Math.round(x.giorni / 7)} settimane` : "è in ritardo";
  return [{ id: chiaveRisposta("regola", `${x.regola}|${lun}`), tipo: "regola", chiave: `${x.regola}|${lun}`, priorita: 35, quando: "mattina", urgente: false,
    titolo: `«${x.nome}» in ritardo in ${x.camere.size} camere`,
    testo: `«${x.nome}» ${quanto} in ${x.camere.size} camere e nessuna signora ci arriva nelle prossime settimane. Che faccio?`,
    tasti: [{ k: "minuti", testo: "Più minuti di stelle il venerdì" }, { k: "vabene", testo: "Va bene così" }, { k: "spegni", testo: "Spegni la regola" }],
    parole: false, dati: { regola: x.regola, codice: x.codice, nome: x.nome, camere: [...x.camere], n: x.camere.size } }];
}
// 10. Prima di una partenza Booking: domani parte un ospite Booking → "vuoi aggiungere qualcosa?"
export function domandePartenzaBooking(st) {
  const oggi = st.oggi, domani = L.aggiungiGiorni(oggi, 1), out = [], sog = st.soggiorni || [];
  for (const s of sog) {
    if (s.fine !== domani || L.modoSoggiorno(s, st.clienti || {}) !== "booking") continue;
    const c = camera(st.camere, s.camera);
    const prossimo = sog.filter(x => x.camera === s.camera && x.inizio >= domani && x.id !== s.id).sort((a, b) => a.inizio < b.inizio ? -1 : 1)[0];
    out.push({ id: chiaveRisposta("partenza", `${s.camera}|${domani}`), tipo: "partenza", chiave: `${s.camera}|${domani}`, priorita: 18, quando: "report", urgente: false,
      titolo: `Domani parte ${s.nome} (${c.nome})`,
      testo: `Domani parte ${s.nome} da ${c.nome}${prossimo ? ` e ${prossimo.inizio === domani ? "lo stesso giorno" : L.dataBreve(prossimo.inizio)} arriva ${prossimo.nome && prossimo.nome !== "?" ? prossimo.nome : "un altro ospite"}` : ""}: controllo di lusso, coprimaterasso e copricuscini sono già nella lista della signora. Vuoi aggiungere qualcosa?`,
      tasti: [{ k: "no", testo: "No, va bene così" }],
      parole: true, dati: { camera: s.camera, nome: c.nome, ospite: s.nome, data: domani, prossimo: prossimo ? prossimo.nome : "" } });
  }
  return out;
}
// "Impara": alla seconda risposta uguale alla stessa domanda → "la prossima volta lo faccio da sola?"
export function domandeImpara(st, candidate) {
  const chat = st.chat || {}, conta = chat.conta || {}, auto = chat.automatiche || {}, out = [];
  const tipi = [...new Set(Object.keys(conta).map(k => k.split("|")[0]))];
  for (const tipo of tipi) {
    if (NON_IMPARA.has(tipo) || auto[tipo] !== undefined) continue;
    const [k, n] = Object.entries(conta).filter(([kk]) => kk.startsWith(tipo + "|")).map(([kk, nn]) => [kk.split("|")[1], nn]).sort((a, b) => b[1] - a[1])[0] || [];
    if (!n || n < 2) continue;
    const esempio = candidate.find(d => d.tipo === tipo) || ultimaRisposta(chat, tipo);
    const tasto = esempio && esempio.tasti ? (esempio.tasti.find(t => t.k === k) || {}).testo : null;
    out.push({
      id: chiaveRisposta("impara", tipo), tipo: "impara", chiave: tipo, priorita: 50, quando: "mattina", urgente: false,
      titolo: "Lo faccio da sola?",
      testo: `Alla domanda «${TITOLI[tipo] || tipo}» hai risposto ${n} volte «${tasto || k}». La prossima volta lo faccio da sola, senza chiedertelo?`,
      tasti: [{ k: "si", testo: "Sì, fai da sola" }, { k: "no", testo: "No, chiedimelo sempre" }],
      parole: false, dati: { tipoDomanda: tipo, risposta: k, testoRisposta: tasto || k },
    });
  }
  return out;
}
function ultimaRisposta(chat, tipo) { return Object.values(chat.risposte || {}).filter(r => r.tipo === tipo).sort((a, b) => (a.ora || "") < (b.ora || "") ? 1 : -1)[0] || null; }
export const TITOLI_GRUPPI = {
  nomi: { titolo: "Chi sono?", testo: n => `${n === 1 ? "Un nome nel prospetto non ha" : n + " nomi nel prospetto non hanno"} il tipo di ospite: chi sono? Un tocco per nome, lo ricordo per tutti i loro soggiorni.` },
  manutenzioni: { titolo: "Lavori fermi", testo: n => `${n === 1 ? "Un lavoro di manutenzione è fermo" : n + " lavori di manutenzione sono fermi"} da più di ${GIORNI_MANUTENZIONE} giorni. Un tocco per riga.` },
};
export const TITOLI = { nome: "Nome nuovo: chi sono?", pioggia: "Ha piovuto: mando il messaggio?", freddo: "Arriva il freddo: coperte?", caldo: "Arriva il caldo: via le coperte?", libera: "Camera libera: la facciamo a fondo?", paga: "Pago così?", impara: "Lo faccio da sola?", controllo: "Camera non controllata da 2 settimane", nonriesco: "Una stella che la signora non riesce a fare", affidabilita: "Signora sotto il 90% di pulizie chiuse", prodotto: "Manca un prodotto", budget: "Budget delle stelle quasi finito", manutenzione: "Lavoro di manutenzione fermo", regola: "Una regola in ritardo in molte camere", partenza: "Prima di una partenza Booking" };

// ---- Tutte le candidate, poi la selezione del giorno ---------------------------------------------------------------------
export function domandeCandidate(st) {
  const base = [...domandePaga(st), ...domandeCameraLibera(st), ...domandeBudget(st), ...domandeProdotto(st), ...domandePartenzaBooking(st), ...domandePioggia(st), ...domandeManutenzione(st), ...domandeReport(st), ...domandeStagione(st), ...domandeRegola(st), ...domandeNomeNuovo(st)];
  return [...base, ...domandeImpara(st, base)];
}
// Lo stato della chat: le domande da mostrare oggi (massimo 3 al giorno, le urgenze passano), quelle in attesa, lo storico
export function statoChat(st) {
  const chat = st.chat || {}, risposte = chat.risposte || {}, oggi = st.oggi;
  const ora = st.ora != null ? st.ora : L.partiRoma(st.adesso || new Date()).h;
  const auto = chat.automatiche || {};
  const risposta = d => { const r = risposte[d.id]; return r && !(r.scade && r.scade <= oggi); }; // "più avanti" scade: si richiede
  const tutte = domandeCandidate(st).filter(d => !risposta(d));
  const rilasciata = d => d.urgente || d.quando === "subito" || (d.quando === "mattina" ? ora >= ORA_MATTINA : ora >= ORA_REPORT);
  const ordina = (a, b) => (b.urgente - a.urgente) || (a.priorita - b.priorita) || (a.id < b.id ? -1 : 1);
  // quelle che la governante fa da sola (impara): escono dalla lista, l'app le esegue e scrive "Fatto da sola"
  const daSole = tutte.filter(d => auto[d.tipo] && d.tasti.some(t => t.k === auto[d.tipo]) && rilasciata(d)).map(d => ({ ...d, auto: auto[d.tipo] }));
  // le domande "a gruppo" (nomi nuovi, lavori di manutenzione fermi): una schermata sola, un tocco per riga, fuori dalle 3 del giorno (ritocco 3)
  const gruppi = [];
  for (const [tipo, nomeGruppo] of Object.entries(GRUPPI)) {
    const righe = tutte.filter(d => d.tipo === tipo && !daSole.includes(d) && !(auto[d.tipo] && d.tasti.some(t => t.k === auto[d.tipo])) && rilasciata(d)).sort(ordina).map(d => ({ ...d, gruppo: nomeGruppo }));
    if (righe.length) gruppi.push({ id: `gruppo|${nomeGruppo}`, tipo: nomeGruppo, titolo: TITOLI_GRUPPI[nomeGruppo].titolo, testo: TITOLI_GRUPPI[nomeGruppo].testo(righe.length), righe });
  }
  const inGruppo = new Set(gruppi.flatMap(g => g.righe.map(d => d.id)));
  const daChiedere = tutte.filter(d => !daSole.includes(d) && !inGruppo.has(d.id) && !(auto[d.tipo] && d.tasti.some(t => t.k === auto[d.tipo]))).sort(ordina);
  const risposteOggi = Object.values(risposte).filter(r => r.il === oggi && !r.auto && !r.fuoriConto); // le urgenze e le domande nate da un tuo tocco non contano nei 3
  let posti = Math.max(0, MAX_AL_GIORNO - risposteOggi.length);
  const aperte = [], inAttesa = [], nonAncora = [];
  // varietà: nei 3 posti del giorno al massimo UNA domanda per tipo (già contando quelle a cui hai risposto oggi); se avanzano posti, si riempiono
  const perTipo = {}; for (const r of risposteOggi) perTipo[r.tipo] = (perTipo[r.tipo] || 0) + 1;
  const resto = [];
  for (const d of daChiedere) {
    if (!rilasciata(d)) { nonAncora.push(d); continue; }
    if (d.urgente || d.quando === "subito") { aperte.push(d); continue; }
    if (posti > 0 && !(perTipo[d.tipo] >= MAX_PER_TIPO)) { aperte.push(d); posti--; perTipo[d.tipo] = (perTipo[d.tipo] || 0) + 1; } else resto.push(d);
  }
  for (const d of resto) { if (posti > 0) { aperte.push(d); posti--; } else inAttesa.push(d); }
  aperte.sort(ordina);
  const storico = Object.values(risposte).filter(r => r.il >= L.aggiungiGiorni(oggi, -GIORNI_STORICO)).sort((a, b) => (a.ora || "") < (b.ora || "") ? -1 : 1);
  const prossime = nonAncora.length ? (nonAncora.some(d => d.quando === "mattina") && ora < ORA_MATTINA ? `${nonAncora.length} alle 8` : `${nonAncora.filter(d => d.quando === "report").length} alle 13`) : "";
  return { aperte, inAttesa, nonAncora, daSole, gruppi, storico, risposteOggi, urgenti: aperte.filter(d => d.urgente).length, prossime, ora };
}
// La risposta da registrare (l'azione la fa l'app): aggiorna anche il conteggio per "impara"
export function registraRisposta(chat, d, k, extra = {}) {
  const c = { risposte: { ...(chat && chat.risposte || {}) }, conta: { ...(chat && chat.conta || {}) }, automatiche: { ...(chat && chat.automatiche || {}) } };
  const tasto = (d.tasti || []).find(t => t.k === k);
  const gruppo = d.gruppo || GRUPPI[d.tipo] || "";
  c.risposte[d.id] = { id: d.id, tipo: d.tipo, chiave: d.chiave, titolo: d.titolo, testo: d.testo, risposta: k, testoRisposta: tasto ? tasto.testo : (k === "parole" ? "a parole" : k), il: extra.il, ora: extra.ora, fatto: extra.fatto || "", parole: extra.parole || "", auto: !!extra.auto, fuoriConto: !!(d.urgente || d.quando === "subito" || gruppo), gruppo, dati: d.dati || {} };
  if (d.tipo === "impara") { c.automatiche[d.dati.tipoDomanda] = k === "si" ? d.dati.risposta : false; }
  else if (k !== "parole" && !extra.auto) { const kk = `${d.tipo}|${k}`; c.conta[kk] = (c.conta[kk] || 0) + 1; }
  // pulizia: via le risposte più vecchie di 60 giorni
  const limite = L.aggiungiGiorni(extra.il || L.oggiISO(), -60);
  for (const [id, r] of Object.entries(c.risposte)) if (r.il && r.il < limite) delete c.risposte[id];
  return c;
}
