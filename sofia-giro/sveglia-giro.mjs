// ============================================================================
//  1.37.0 (app 1.89.0) · LA SVEGLIA DI JARVIS
//  Michele, 16/11: «io ad esempio metto un impegno, però a me mi deve arrivare una sorta di notifica, una sveglia, qualcosa
//  per ricordarmi, che so, 5-10 minuti prima di quell'impegno lì, perché altrimenti non ha senso» · alla proposta («dal
//  telefono escono solo il giorno e l'ora, che cosa devi fare resta nel telefono»): «Sì».
//  Jarvis sta nel telefono di Michele. Per suonare ad app chiusa il telefono lascia nel database (importazioni/jarvis-sveglie,
//  lo leggono solo i proprietari) SOLO un codice e il giorno e l'ora di ogni impegno:  telefoni.<telefono>.<codice> = l'ora.
//  CHE COSA c'è da fare non esce mai dal telefono: qui si manda «sveglia <codice>» e il telefono, quando la riceve, compone
//  lui la notifica con quello che sa («⏰ Tra 10 minuti: …»).
//  A ogni giro (ogni 10 minuti) parte la sveglia degli impegni che cominciano entro 15 minuti: arriva tra 15 e 5 minuti prima.
//  Di notte i giri sono uno all'ora: per gli impegni tra le 23 e le 6:15 parte fino a 65 minuti prima (meglio presto che mai).
//  Una volta sola per impegno (mandate.<telefono|codice|ora>); se l'ora cambia è una sveglia nuova. Se l'avviso non parte,
//  il segno non si mette: ci riprova il giro dopo.
//  Nel registro di GITHUB (che tutti possono leggere) NON SI SCRIVE NIENTE: nemmeno «ho mandato una sveglia», perché l'ora
//  del registro direbbe a tutti quando Michele ha un impegno.
// ============================================================================
export const PRIMA_MS = 15 * 60000, PRIMA_NOTTE_MS = 65 * 60000, DOPO_MS = 5 * 60000, TIENI_MS = 48 * 3600000;
const CODICE = /^[A-Za-z0-9_-]{1,60}$/;
const minutiRoma = (ms) => {
  const p = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(ms));
  const g = (k) => Number((p.find(x => x.type === k) || {}).value);
  return (g("hour") % 24) * 60 + g("minute");
};
// un impegno «di notte»: dalle 23 alle 6:15, quando i giri sono uno all'ora
export const diNotte = (ms) => { const m = minutiRoma(ms); return m >= 23 * 60 || m < 6 * 60 + 15; };

// le sveglie che devono partire adesso: [{ tel, codice, quando, T, chiave }], dalla più vicina
export function sveglieDaMandare(doc, adesso) {
  const ora = adesso instanceof Date ? adesso.getTime() : Number(adesso), out = [];
  const telefoni = (doc && doc.telefoni && typeof doc.telefoni === "object") ? doc.telefoni : {};
  const mandate = (doc && doc.mandate && typeof doc.mandate === "object") ? doc.mandate : {};
  for (const [tel, mappa] of Object.entries(telefoni)) {
    if (!CODICE.test(tel) || !mappa || typeof mappa !== "object") continue;
    for (const [codice, quando] of Object.entries(mappa)) {
      if (!CODICE.test(codice) || typeof quando !== "string") continue;
      const T = Date.parse(quando); if (!Number.isFinite(T)) continue;
      const chiave = `${tel}|${codice}|${quando}`;
      if (mandate[chiave]) continue;
      const prima = diNotte(T) ? PRIMA_NOTTE_MS : PRIMA_MS;
      if (ora >= T - prima && ora < T + DOPO_MS) out.push({ tel, codice, quando, T, chiave });
    }
  }
  return out.sort((a, b) => a.T - b.T);
}

// il passo del giro. Ritorna solo i conti ({ mandate, dovute }): niente che si possa scrivere in un registro.
export async function mandaSveglie({ db, push, adesso = new Date(), caricaPs = null }) {
  const doc = await db.doc("importazioni", "jarvis-sveglie");
  if (!doc) return { mandate: 0, dovute: 0 };
  const ora = adesso.getTime();
  const vecchie = (doc.mandate && typeof doc.mandate === "object") ? doc.mandate : {};
  // i segni «già mandata» si tengono due giorni, poi si tolgono
  const mandate = Object.fromEntries(Object.entries(vecchie).filter(([, q]) => { const t = Date.parse(q); return Number.isFinite(t) && ora - t < TIENI_MS; }));
  let cambiato = Object.keys(mandate).length !== Object.keys(vecchie).length, n = 0;
  const dovute = sveglieDaMandare({ telefoni: doc.telefoni, mandate }, ora);
  if (dovute.length && push) {
    const ps = caricaPs ? await caricaPs() : await db.doc("importazioni", "push-sofia");
    if (ps && ps.vapidPublic && ps.vapidPrivato) {
      for (const s of dovute) {
        const v = (ps.iscrizioni || {})[s.tel];
        if (!v || !v.sub || !v.sub.endpoint) continue;                     // su quel telefono gli avvisi non sono (più) accesi
        // titolo e testo servono solo se nel telefono c'è ancora il lavoratore di sfondo vecchio: quello nuovo li rifà lui
        const r = await push(ps, v.sub, { titolo: "⏰ Jarvis", testo: "Hai un impegno tra poco. Tocca per vederlo.", sveglia: s.codice, quando: s.quando, tag: "sveglia", vibra: true, ttl: Math.max(60, Math.round((s.T + DOPO_MS - ora) / 1000)) });
        if (r && r.ok) { mandate[s.chiave] = adesso.toISOString(); cambiato = true; n++; }
      }
    }
  }
  if (cambiato) await db.sostituisci("importazioni", "jarvis-sveglie", "mandate", mandate);
  return { mandate: n, dovute: dovute.length };
}
