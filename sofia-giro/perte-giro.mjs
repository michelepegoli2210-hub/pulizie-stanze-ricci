// ============================================================================
//  «🔔 DA FARE TU» (giro 1.28.0, app 1.62.0)
//  Michele, 7/11: «se papà mi scrive "mettere le chiavi ad Aurora", mi deve arrivare un allarme con la vibrazione».
//  Le letture delle chat mettono nella scheda della Segreteria (importazioni/segreteria_<lettura>.perTe) le cose che deve
//  fare Michele in persona. Qui il giro le fa suonare sul suo telefono: notifica che vibra e resta finché non la tocchi, col
//  tasto «✅ Fatto» (sw.js 1.62.0). Subito la prima volta, poi ogni ora finché non è fatta; se c'è «entro» (es. le 15:00)
//  e manca più di un'ora, dopo la prima aspetta fino a un'ora prima. «⏰ Ricordami tra 1 ora» (nella Segreteria) sposta il
//  prossimo allarme. Solo dalle 7 alle 22:30, al massimo 12 volte, per le cose di oggi e di ieri.
//  Il giro scrive solo «perTeAvvisi» (quando e quante volte ha suonato): «perTe» (fatto, rimanda) lo scrive solo l'app.
//  1.34.0 (app 1.76.0) · Michele, 10/11 sera (il telefono aveva suonato 31 volte per 4 cose che sapeva già): «non devo
//  rileggere gli stessi messaggi che ho costruito io… qualora io ne abbia bisogno di un promemoria, glielo dico… trova un
//  escamotage, qualcosa che abbia utilità, questo ponte».
//   - Una cosa detta da lui non suona mai (le letture nuove non la mettono nemmeno: lettura.js senzaEco; per le schede di
//     prima si guarda chi l'ha detta).
//   - L'ESCAMOTAGE: i suoi messaggi CHIUDONO. Se dopo la richiesta di un altro Michele ha scritto in quella chat, l'ha
//     vista: non suona più (segnaViste scrive perTeAvvisi.<k>.visto; la cosa resta in «Da fare tu», senza suonare).
//   - I PROMEMORIA CHIESTI DA LUI (richiesto: true; «Sofia ricordamelo» in un messaggio, o detto a Sofia nell'app): suonano
//     all'ora detta (da 10 minuti prima), se c'è solo il giorno dalle 8 di quel giorno, senza ora un'ora dopo; poi ogni ora
//     finché non tocca «Fatto», come le altre.
//  1.34.1: le cose già viste si segnano a ogni giro (anche fuori dagli orari degli allarmi: suona = false); se il messaggio
//  della richiesta non si trova, vale la chat privata con chi l'ha chiesta e l'ora della lettura.
// ============================================================================
import * as L from "../logica.js";
import * as LET from "../lettura.js";

export const OGNI_MS = 60 * 60 * 1000, MAX_ALLARMI = 12, MARGINE_MS = 3 * 60 * 1000;
export const PRIMA_MIN = 10, ORA_DEL_GIORNO = 8 * 60;   // 1.34.0: i promemoria chiesti da lui
const minutiDi = (hhmm) => Number(String(hhmm).slice(0, 2)) * 60 + Number(String(hhmm).slice(3, 5));

// le cose che devono suonare adesso. «t» = l'ora di Lesina del giro ({ iso: "AAAA-MM-GG", minuti })
export function allarmiDovuti(letture, adesso, t) {
  const ora = adesso.getTime(), ieri = L.aggiungiGiorni(t.iso, -1), out = [];
  for (const x of Object.values(letture || {})) {
    if (!x || !x.lid || ["scartata", "sostituita"].includes(x.esito) || String(x.quando || "").slice(0, 10) < ieri) continue;
    const avvisi = x.perTeAvvisi || {};
    for (const p of (Array.isArray(x.perTe) ? x.perTe : [])) {
      if (!p || !p.k || !p.testo || p.fatto) continue;
      const a = avvisi[p.k] || {}, n = Number(a.n) || 0, ultimo = Date.parse(a.ultimo || "") || 0;
      if (!p.richiesto && (LET.eMichele(p.chi) || p.visto || a.visto)) continue;   // 1.34.0: detta da lui, oppure l'ha già vista (ha scritto dopo in quella chat)
      if (n >= MAX_ALLARMI) continue;
      if (p.unaVolta && n >= 1) continue;                                           // 1.35.0: «Metti tu le ore di …» suona una volta sola
      if (p.rimanda && Date.parse(p.rimanda) > ora) continue;                       // «Ricordami tra 1 ora»
      if (ultimo && ora - ultimo < OGNI_MS - MARGINE_MS) continue;                  // ha già suonato da meno di un'ora
      if (p.richiesto) {                                                            // 1.34.0: un promemoria chiesto da lui: all'ora detta
        if (p.entro) {
          const g = String(p.entro).slice(0, 10), hm = String(p.entro).slice(11, 16);
          if (g > t.iso || (g === t.iso && t.minuti < (hm ? minutiDi(hm) - PRIMA_MIN : ORA_DEL_GIORNO))) continue;
        } else if (!p.rimanda && ora - (Date.parse(p.creato || x.quando || "") || 0) < OGNI_MS - MARGINE_MS) continue;   // senza ora: un'ora dopo
      } else if (n > 0 && p.entro) {                                                // c'è tempo: aspetta fino a un'ora prima
        const g = String(p.entro).slice(0, 10), hm = String(p.entro).slice(11, 16);
        if (g > t.iso || (g === t.iso && hm && t.minuti < minutiDi(hm) - 60)) continue;
      }
      out.push({ lid: x.lid, x, p, n });
    }
  }
  return out.sort((a, b) => String(a.p.entro || "9").localeCompare(String(b.p.entro || "9")));
}
// il testo dell'allarme
export function testoAllarme(p, x, t, n) {
  const g = String(p.entro || "").slice(0, 10), hm = String(p.entro || "").slice(11, 16);
  const tardi = p.entro && hm && (g < t.iso || (g === t.iso && t.minuti > minutiDi(hm)));
  if (p.richiesto) {   // 1.34.0
    return {
      titolo: `⏰ Promemoria: ${p.testo}`.slice(0, 80),
      testo: [hm ? (tardi ? `Era per le ${hm}.` : `Per le ${hm}.`) : "", "Me l'hai chiesto tu.", n ? `(te lo ricordo ogni ora finché non tocchi «✅ Fatto»)` : "Tocca «✅ Fatto» quando l'hai fatto."].filter(Boolean).join("\n"),
    };
  }
  const quando = !p.entro ? "" : g === t.iso ? (hm ? `entro le ${hm}` : "oggi") : g === L.aggiungiGiorni(t.iso, 1) ? `entro domani${hm ? " alle " + hm : ""}` : `entro ${L.dataMedia(g)}${hm ? " alle " + hm : ""}`;
  const chi = p.chi ? `L'ha chiesto ${p.chi}${p.msg ? `: «${String(p.msg).slice(0, 120)}»` : ""}.` : "";
  const wa = !!p.chat && !/^email/i.test(String(p.chat));   // 1.34.0: se so in che chat è stata chiesta, basta rispondere lì (alle email no: non le vedo)
  return {
    titolo: `🔔 Da fare: ${p.testo}`.slice(0, 80),
    testo: [quando ? `${tardi ? "⏰ Era " : ""}${quando}${tardi ? ": è già passata l'ora" : ""}.` : "", chi,
      n ? (wa ? `(te lo ricordo ogni ora finché non rispondi su WhatsApp o tocchi «✅ Fatto»)` : `(te lo ricordo ogni ora finché non tocchi «✅ Fatto»)`) : (wa ? "Rispondi su WhatsApp oppure tocca «✅ Fatto»: smetto di suonare." : "Tocca «✅ Fatto» quando l'hai fatto.")].filter(Boolean).join("\n"),
  };
}
// 1.34.0: dove e quando è stata chiesta una cosa: dai campi nuovi (la chat e l'ora del messaggio); per le schede di prima,
// cercando le parole citate tra i messaggi della scheda (se il messaggio era di Michele, «mio»)
export function fontePerTe(p, x) {
  if (p.chat && (Number(p.mts) || p.mdata)) return { chat: String(p.chat), ts: Number(p.mts) || 0, quando: `${p.mdata || ""} ${p.mora || ""}` };
  const msgs = Array.isArray(x && x.messaggi) ? x.messaggi : [];
  if (msgs.length && p.msg) {
    const f = LET.fonteDi({ messaggio: p.msg, chi: p.chi }, msgs);
    if (f.i >= 0 && f.come === "testo") { const m = msgs[f.i]; return { chat: String(m.chat || ""), ts: 0, quando: `${m.data || ""} ${m.ora || ""}`, mio: !!m.mio }; }
  }
  // 1.34.1: il messaggio non si trova (Sofia l'ha riassunto con parole sue). Se la cosa l'ha chiesta una persona, vale la chat
  // privata con lei e l'ora della LETTURA (la richiesta è di prima): se dopo Michele le ha scritto lì, l'ha vista
  const chi = String(p.chi || "").trim(), letta = Date.parse((x && x.quando) || "") || 0;
  if (chi && letta && !LET.eMichele(chi)) return { chat: "chat con " + chi, ts: letta, quando: "", perNome: true };
  return null;
}
const nomeChat = (q) => { const n = q.chat || "Albergo"; return q.gruppo === false ? "chat con " + n : n; };
// 1.34.0: le cose che Michele ha già visto (ha scritto dopo, in quella chat): si segna perTeAvvisi.<k>.visto, e non suonano più
export async function segnaViste({ db, letture, adesso, t }) {
  if (!db || typeof db.postaDa !== "function") return 0;
  const ieri = L.aggiungiGiorni(t.iso, -1), aperte = [];
  for (const x of Object.values(letture || {})) {
    if (!x || !x.lid || ["scartata", "sostituita"].includes(x.esito) || String(x.quando || "").slice(0, 10) < ieri) continue;
    const avvisi = x.perTeAvvisi || {};
    for (const p of (Array.isArray(x.perTe) ? x.perTe : [])) {
      if (!p || !p.k || !p.testo || p.fatto || p.richiesto || p.visto || (avvisi[p.k] || {}).visto || LET.eMichele(p.chi)) continue;
      const f = fontePerTe(p, x); if (!f || (!f.chat && !f.mio)) continue;
      aperte.push({ x, p, f });
    }
  }
  if (!aperte.length) return 0;
  let mie = null, n = 0;
  for (const { x, p, f } of aperte) {
    let vista = f.mio === true;   // (schede di prima) veniva da un suo messaggio: non era una richiesta
    if (!vista) {
      if (!mie) mie = Object.values((await db.postaDa(adesso.getTime() - ((Number(t.minuti) || 0) + 24 * 60 + 60) * 60000)) || {}).filter(q => q && q.mio);   // i suoi messaggi da ieri
      const stessa = (q) => f.perNome ? nomeChat(q).toLowerCase() === f.chat.toLowerCase() : nomeChat(q) === f.chat;   // 1.34.1
      vista = mie.some(q => stessa(q) && (f.ts && Number(q.ts) ? Number(q.ts) > f.ts : !f.perNome && `${q.data || ""} ${q.ora || ""}` > f.quando));
    }
    if (!vista) continue;
    const avvisi = { ...(x.perTeAvvisi || {}), [p.k]: { ...((x.perTeAvvisi || {})[p.k] || {}), visto: adesso.toISOString(), ...(f.mio === true ? { sua: true } : {}) } };
    x.perTeAvvisi = avvisi;
    try { await db.merge("importazioni", "segreteria_" + x.lid, { perTeAvvisi: avvisi }); } catch (e) { console.warn("da fare/vista:", e && e.message); }
    n++;
  }
  return n;
}
// a ogni giro: fa suonare quelle dovute e segna quando
export async function allarmiPerTe({ db, adesso, t, manda, suona = true }) {
  const letture = Object.fromEntries(Object.entries((await db.importazioniDa(L.aggiungiGiorni(t.iso, -1))) || {}).filter(([id]) => String(id).startsWith("segreteria_") && !String(id).startsWith("segreteria_xl")));
  try { await segnaViste({ db, letture, adesso, t }); } catch (e) { console.warn("da fare/viste:", e && e.message); }   // 1.34.0
  if (!suona) return 0;   // 1.34.1: fuori orario (22:30–7) si segna solo quello che ha già visto; non si suona
  const dovuti = allarmiDovuti(letture, adesso, t);
  let n = 0;
  for (const d of dovuti.slice(0, 4)) {
    const { titolo, testo } = testoAllarme(d.p, d.x, t, d.n);
    const ok = await manda(testo, titolo, { vibra: true, azioni: "fattoTu", rif: `${d.lid}--${d.p.k}`.slice(0, 80), dove: "segreteria", segreteria: true, url: "./index.html?segreteria=1", tag: ("sofia-fare-" + (d.lid + d.p.k).replace(/[^a-z0-9]/gi, "").slice(-24)) });
    const { nonArrivato, ...prima } = ((d.x && d.x.perTeAvvisi) || {})[d.p.k] || {};
    const avvisi = { ...((d.x && d.x.perTeAvvisi) || {}), [d.p.k]: { ...prima, ultimo: adesso.toISOString(), n: d.n + 1, ...(ok ? {} : { nonArrivato: true }) } };
    if (d.x) d.x.perTeAvvisi = avvisi;
    try { await db.merge("importazioni", "segreteria_" + d.lid, { perTeAvvisi: avvisi }); } catch (e) { console.warn("da fare:", e && e.message); }
    n++;
  }
  return n;
}
