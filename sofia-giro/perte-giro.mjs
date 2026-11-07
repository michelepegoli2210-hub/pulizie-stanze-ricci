// ============================================================================
//  «🔔 DA FARE TU» (giro 1.28.0, app 1.62.0)
//  Michele, 7/11: «se papà mi scrive "mettere le chiavi ad Aurora", mi deve arrivare un allarme con la vibrazione».
//  Le letture delle chat mettono nella scheda della Segreteria (importazioni/segreteria_<lettura>.perTe) le cose che deve
//  fare Michele in persona. Qui il giro le fa suonare sul suo telefono: notifica che vibra e resta finché non la tocchi, col
//  tasto «✅ Fatto» (sw.js 1.62.0). Subito la prima volta, poi ogni ora finché non è fatta; se c'è «entro» (es. le 15:00)
//  e manca più di un'ora, dopo la prima aspetta fino a un'ora prima. «⏰ Ricordami tra 1 ora» (nella Segreteria) sposta il
//  prossimo allarme. Solo dalle 7 alle 22:30, al massimo 12 volte, per le cose di oggi e di ieri.
//  Il giro scrive solo «perTeAvvisi» (quando e quante volte ha suonato): «perTe» (fatto, rimanda) lo scrive solo l'app.
// ============================================================================
import * as L from "../logica.js";

export const OGNI_MS = 60 * 60 * 1000, MAX_ALLARMI = 12, MARGINE_MS = 3 * 60 * 1000;
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
      if (n >= MAX_ALLARMI) continue;
      if (p.rimanda && Date.parse(p.rimanda) > ora) continue;                       // «Ricordami tra 1 ora»
      if (ultimo && ora - ultimo < OGNI_MS - MARGINE_MS) continue;                  // ha già suonato da meno di un'ora
      if (n > 0 && p.entro) {                                                       // c'è tempo: aspetta fino a un'ora prima
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
  const quando = !p.entro ? "" : g === t.iso ? (hm ? `entro le ${hm}` : "oggi") : g === L.aggiungiGiorni(t.iso, 1) ? `entro domani${hm ? " alle " + hm : ""}` : `entro ${L.dataMedia(g)}${hm ? " alle " + hm : ""}`;
  const tardi = p.entro && hm && (g < t.iso || (g === t.iso && t.minuti > minutiDi(hm)));
  const chi = p.chi ? `L'ha chiesto ${p.chi}${p.msg ? `: «${String(p.msg).slice(0, 120)}»` : ""}.` : "";
  return {
    titolo: `🔔 Da fare: ${p.testo}`.slice(0, 80),
    testo: [quando ? `${tardi ? "⏰ Era " : ""}${quando}${tardi ? ": è già passata l'ora" : ""}.` : "", chi, n ? `(te lo ricordo ogni ora finché non tocchi «✅ Fatto»)` : "Tocca «✅ Fatto» quando l'hai fatto."].filter(Boolean).join("\n"),
  };
}
// a ogni giro: fa suonare quelle dovute e segna quando
export async function allarmiPerTe({ db, adesso, t, manda }) {
  const letture = Object.fromEntries(Object.entries((await db.importazioniDa(L.aggiungiGiorni(t.iso, -1))) || {}).filter(([id]) => String(id).startsWith("segreteria_") && !String(id).startsWith("segreteria_xl")));
  const dovuti = allarmiDovuti(letture, adesso, t);
  let n = 0;
  for (const d of dovuti.slice(0, 4)) {
    const { titolo, testo } = testoAllarme(d.p, d.x, t, d.n);
    const ok = await manda(testo, titolo, { vibra: true, azioni: "fattoTu", rif: `${d.lid}--${d.p.k}`.slice(0, 80), dove: "segreteria", segreteria: true, url: "./index.html?segreteria=1", tag: ("sofia-fare-" + (d.lid + d.p.k).replace(/[^a-z0-9]/gi, "").slice(-24)) });
    const avvisi = { ...((d.x && d.x.perTeAvvisi) || {}), [d.p.k]: { ultimo: adesso.toISOString(), n: d.n + 1, ...(ok ? {} : { nonArrivato: true }) } };
    if (d.x) d.x.perTeAvvisi = avvisi;
    try { await db.merge("importazioni", "segreteria_" + d.lid, { perTeAvvisi: avvisi }); } catch (e) { console.warn("da fare:", e && e.message); }
    n++;
  }
  return n;
}
