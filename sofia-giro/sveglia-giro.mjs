// ============================================================================
//  1.37.0 (app 1.89.0) · LA SVEGLIA DI JARVIS
//  Michele, 16/11: «io ad esempio metto un impegno, però a me mi deve arrivare una sorta di notifica, una sveglia, qualcosa
//  per ricordarmi, che so, 5-10 minuti prima di quell'impegno lì, perché altrimenti non ha senso» · alla proposta («dal
//  telefono escono solo il giorno e l'ora, che cosa devi fare resta nel telefono»): «Sì».
//  Jarvis sta nel telefono di Michele. Per suonare ad app chiusa il telefono lascia nel database (importazioni/jarvis-sveglie,
//  lo leggono solo i proprietari) SOLO un codice e il giorno e l'ora di ogni impegno:  telefoni.<telefono>.<codice> = l'ora.
//  CHE COSA c'è da fare non esce mai dal telefono: qui si manda «sveglia <codice>» e il telefono, quando la riceve, compone
//  lui la notifica con quello che sa («⏰ Tra 10 minuti: …»).
//  Una volta sola per sveglia (mandate.<telefono|codice|ora>); se l'ora cambia è una sveglia nuova. Se l'avviso non parte,
//  il segno non si mette: ci riprova il giro dopo.
//  Nel registro di GITHUB (che tutti possono leggere) NON SI SCRIVE NIENTE: nemmeno «ho mandato una sveglia», perché l'ora
//  del registro direbbe a tutti quando Michele ha un impegno.
//
//  1.39.0 (app 1.98.0) · ALL'ORA GIUSTA. Michele, 18/11: «Jarvis deve essere in pratica una sveglia che io devo scrivere, che
//  so, ricordami alle 18 di fare gli auguri a mio cognato, e alle 18 mi arriva la notifica di Jarvis, capisci?».
//   - Due tipi: gli IMPEGNI (telefoni.<telefono>.<codice> = l'ora dell'impegno) suonano 10 minuti prima; i «RICORDAMI ALLE…»
//     (esatte.<telefono>.<codice> = l'ora) suonano all'ora detta.
//   - Il giro non manda più «quando passa»: se la sveglia è fra poco, ASPETTA il minuto giusto e la manda allora (mentre
//     intanto fa il resto: giro.mjs aspetta le sveglie prima di finire).
//   - LA CASSETTA (copia-sicurezza.gs, versione 4, nel Google dell'albergo) riceve dal giro SOLO gli orari delle sveglie (né
//     codici né telefoni) e fa partire un giro 2 minuti prima di ognuna: così è giusta anche di notte e a PC spento. Allora il
//     giro aspetta al massimo 5 minuti. Se la cassetta non c'è, è vecchia o non ha la lista giusta: di giorno aspetta fino a
//     11 minuti (i giri sono ogni 10), di notte (giri uno all'ora) manda fino a 65 minuti prima: meglio presto che mai.
//   - In ritardo (il giro non è partito in tempo): un impegno si manda fino a 5 minuti dopo l'inizio, un «ricordami» fino a
//     2 ore dopo (il telefono scrive «Era per le 18»).
//   - La firma degli orari mandati alla cassetta sta in cassettaFirma (e quando, in cassettaQuando): se non cambia non si
//     rimanda (al massimo ogni 6 ore, per sicurezza). Se la cassetta dice di no, la stessa lista si riprova dopo mezz'ora
//     (cassettaNo, cassettaNoFirma); una lista nuova subito.
// ============================================================================
export const PRIMA_MS = 10 * 60000;                    // impegni: la sveglia 10 minuti prima
export const AVANTI_MS = 5 * 60000;                    // con la cassetta: il giro aspetta le sveglie dei prossimi 5 minuti
export const AVANTI_SENZA_MS = 11 * 60000;             // senza la cassetta: fino a 11 minuti (i giri sono ogni 10)
export const PRIMA_NOTTE_MS = 65 * 60000;              // senza la cassetta, di notte: fino a 65 minuti prima dell'impegno
export const DOPO_MS = 5 * 60000;                      // un impegno: ancora fino a 5 minuti dopo l'inizio
export const DOPO_ESATTA_MS = 2 * 3600000;             // un «ricordami alle…»: ancora fino a 2 ore dopo
export const TIENI_MS = 48 * 3600000;                  // i segni «già mandata» si tengono due giorni
export const CASSETTA_OGNI_MS = 6 * 3600000, CASSETTA_RIPROVA_MS = 30 * 60000, MAX_ORARI = 80;
const CODICE = /^[A-Za-z0-9_-]{1,60}$/;
const ogg = (x) => (x && typeof x === "object" ? x : {});
const minutiRoma = (ms) => {
  const p = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(ms));
  const g = (k) => Number((p.find(x => x.type === k) || {}).value);
  return (g("hour") % 24) * 60 + g("minute");
};
// un momento «di notte»: dalle 23 alle 6:15, quando i giri sono uno all'ora
export const diNotte = (ms) => { const m = minutiRoma(ms); return m >= 23 * 60 || m < 6 * 60 + 15; };

// tutte le sveglie del documento, dalla prima: [{ tel, codice, quando, T (l'ora della cosa), A (l'ora della notifica), esatta, chiave }]
export function tutteLeSveglie(doc) {
  const out = [];
  for (const [campo, esatta] of [["telefoni", false], ["esatte", true]]) {
    for (const [tel, mappa] of Object.entries(ogg(doc && doc[campo]))) {
      if (!CODICE.test(tel) || !mappa || typeof mappa !== "object") continue;
      for (const [codice, quando] of Object.entries(mappa)) {
        if (!CODICE.test(codice) || typeof quando !== "string") continue;
        const T = Date.parse(quando); if (!Number.isFinite(T)) continue;
        out.push({ tel, codice, quando, T, A: esatta ? T : T - PRIMA_MS, esatta, chiave: `${tel}|${codice}|${quando}${esatta ? "|x" : ""}` });
      }
    }
  }
  return out.sort((a, b) => a.A - b.A);
}
// gli orari per la cassetta: le notifiche ancora da mandare, da adesso ai prossimi 40 giorni. SOLO gli orari.
export function orariPerCassetta(lista, mandate, adesso) {
  const visti = new Set();
  for (const s of lista) if (!mandate[s.chiave] && s.A > adesso - 60000 && s.A < adesso + 40 * 86400000) visti.add(new Date(s.A).toISOString());
  return [...visti].sort().slice(0, MAX_ORARI);
}
// la firma di una lista di orari (la stessa lista = la stessa firma)
export function firmaOrari(orari) {
  let h = 2166136261; const s = (orari || []).join(",");
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return `${(orari || []).length}-${h.toString(36)}`;
}
// le sveglie da mandare adesso o da aspettare: [{ ...sveglia, aspetta (ms) }]. «puntuale» = la cassetta ha la lista giusta.
export function sveglieDaMandare(lista, mandate, adesso, puntuale) {
  const out = [], avanti = puntuale ? AVANTI_MS : AVANTI_SENZA_MS;
  for (const s of lista) {
    if (mandate[s.chiave]) continue;
    if (adesso >= s.T + (s.esatta ? DOPO_ESATTA_MS : DOPO_MS)) continue;                    // troppo tardi
    if (s.A <= adesso) out.push({ ...s, aspetta: 0 });                                        // è l'ora (o è in ritardo)
    else if (s.A - adesso <= avanti) out.push({ ...s, aspetta: s.A - adesso });               // fra poco: il giro aspetta
    else if (!puntuale && diNotte(s.A) && s.T - adesso <= PRIMA_NOTTE_MS) out.push({ ...s, aspetta: 0 });   // di notte senza cassetta
  }
  return out.sort((a, b) => a.A - b.A);
}

// il passo del giro. Ritorna solo i conti ({ mandate, dovute }): niente che si possa scrivere in un registro.
// «cassetta(orari)» manda alla cassetta gli orari (null = la cassetta non c'è); «ora» e «dormi» si cambiano nelle prove.
export async function mandaSveglie({ db, push, adesso = new Date(), caricaPs = null, cassetta = null, ora = null, dormi = (ms) => new Promise(r => setTimeout(r, ms)) }) {
  if (!ora) { const da = adesso.getTime() - Date.now(); ora = () => Date.now() + da; }   // l'orologio parte da «adesso» e va avanti
  let doc = await db.doc("importazioni", "jarvis-sveglie");
  if (!doc) return { mandate: 0, dovute: 0 };
  const t0 = adesso.getTime();
  const vecchie = ogg(doc.mandate);
  // i segni «già mandata» si tengono due giorni, poi si tolgono
  const mandate = Object.fromEntries(Object.entries(vecchie).filter(([, q]) => { const t = Date.parse(q); return Number.isFinite(t) && t0 - t < TIENI_MS; }));
  if (Object.keys(mandate).length !== Object.keys(vecchie).length) await db.sostituisci("importazioni", "jarvis-sveglie", "mandate", mandate);
  let lista = tutteLeSveglie(doc);
  // la cassetta: gli orari (solo quelli), quando cambiano
  let puntuale = false;
  if (cassetta) {
    const orari = orariPerCassetta(lista, mandate, t0), firma = firmaOrari(orari);
    const fresca = doc.cassettaFirma === firma && t0 - (Date.parse(doc.cassettaQuando || "") || 0) < CASSETTA_OGNI_MS;
    const rifiutata = doc.cassettaNoFirma === firma && t0 - (Date.parse(doc.cassettaNo || "") || 0) < CASSETTA_RIPROVA_MS;   // la stessa lista, rifiutata da poco
    if (fresca) puntuale = true;
    else if (!rifiutata) {
      let r = null; try { r = await cassetta(orari); } catch (e) { r = null; }
      if (r && r.ok) { puntuale = true; await db.merge("importazioni", "jarvis-sveglie", { cassettaFirma: firma, cassettaQuando: new Date(t0).toISOString(), cassettaNo: "", cassettaNoFirma: "" }); }
      else if (r) await db.merge("importazioni", "jarvis-sveglie", { cassettaNo: new Date(t0).toISOString(), cassettaNoFirma: firma });   // r = null: la cassetta non c'è
    }
  }
  let dovute = sveglieDaMandare(lista, mandate, ora(), puntuale);
  if (!dovute.length || !push) return { mandate: 0, dovute: dovute.length };
  let ps = null, n = 0, giri = 0; const fatte = new Set(), quante = dovute.length, fine = t0 + 14 * 60000;   // il giro non aspetta oltre 14 minuti
  const manda = async (s) => {
    if (!ps) ps = caricaPs ? await caricaPs() : await db.doc("importazioni", "push-sofia");
    if (!ps || !ps.vapidPublic || !ps.vapidPrivato) return false;
    const v = ogg(ps.iscrizioni)[s.tel];
    if (!v || !v.sub || !v.sub.endpoint) return false;                                  // su quel telefono gli avvisi non sono (più) accesi
    // titolo e testo servono solo se nel telefono c'è ancora il lavoratore di sfondo vecchio: quello nuovo li rifà lui
    const r = await push(ps, v.sub, { titolo: "⏰ Jarvis", testo: s.esatta ? "È l'ora del tuo promemoria. Tocca per vederlo." : "Hai un impegno tra poco. Tocca per vederlo.", sveglia: s.codice, quando: s.quando, ...(s.esatta ? { esatta: true } : {}), tag: "sveglia", vibra: true, ttl: Math.max(60, Math.round((s.T + (s.esatta ? DOPO_ESATTA_MS : DOPO_MS) - ora()) / 1000)) });
    if (!(r && r.ok)) return false;
    const q = new Date(ora()).toISOString(); mandate[s.chiave] = q;
    await db.merge("importazioni", "jarvis-sveglie", { mandate: { [s.chiave]: q } });
    return true;
  };
  // una alla volta, ognuna al suo minuto; poi si rilegge una volta (una sveglia segnata intanto, per i prossimi minuti)
  while (dovute.length && giri < 3) {
    giri++;
    for (const s of dovute) {
      if (fatte.has(s.chiave) || s.A > fine) continue;                                    // oltre: ci pensa il giro dopo
      const attesa = s.A - ora(); if (attesa > 0) await dormi(attesa);
      fatte.add(s.chiave);
      try { if (await manda(s)) n++; } catch (e) {}
    }
    doc = await db.doc("importazioni", "jarvis-sveglie"); lista = tutteLeSveglie(doc || {});
    dovute = sveglieDaMandare(lista, { ...ogg(doc && doc.mandate), ...mandate }, ora(), puntuale).filter(s => !fatte.has(s.chiave));
  }
  return { mandate: n, dovute: quante };
}
