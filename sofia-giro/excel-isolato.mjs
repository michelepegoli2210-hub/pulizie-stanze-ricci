// ============================================================================
//  giro 1.41.0 · UN EXCEL ARRIVATO PER EMAIL SI APRE IN UN «LAVORATORE» A PARTE
//  La libreria degli Excel (SheetJS 0.18.5, la stessa che legge il prospetto dell'albergo) con un file di fuori fatto apposta
//  può sporcare gli oggetti del programma (CVE-2023-30533) o girare a vuoto (CVE-2024-22363). Per il prospetto (file nostri)
//  va bene così; per gli allegati delle email, che manda chiunque, l'Excel lo apre un lavoratore a parte (worker_threads):
//  ha i suoi oggetti, non vede niente del giro (né il database né le chiavi), restituisce solo il testo dei fogli e dopo
//  20 secondi, se non ha finito, si spegne.
//  giro 1.44.0 (app 1.118.0; Michele, 27/11/2026: «nell'allegato io ho trovato soltanto le presenze addirittura del 2022»):
//  prima dava i primi 6 fogli, e il file delle presenze ne ha uno per mese dal 2022. Adesso, se i fogli che si vedono sono
//  più di 6, dà quello «di adesso» (../fogli-excel.js, lo stesso dell'app) e i tre vicini; fino a 6 li dà tutti, come prima.
//  Risponde come prima la lista dei fogli [{ nome, csv, scelto }]; in più, sulla lista: .quanti (i fogli del file) e .perche.
// ============================================================================
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { createRequire } from "node:module";

if (!isMainThread && workerData && workerData.excelIsolato) {
  try {
    const richiedi = createRequire(import.meta.url), X = richiedi("../xlsx.min.js"), F = richiedi("../fogli-excel.js");
    const wb = X.read(Buffer.from(workerData.buf), { type: "buffer" });
    const W = wb.Workbook || {}, nomi = (wb.SheetNames || []).map(n => String(n));
    const nascosti = nomi.map((n, i) => !!((W.Sheets || [])[i] && (W.Sheets || [])[i].Hidden));
    const vista = Array.isArray(W.WBView) && W.WBView[0] ? Number(W.WBView[0].activeTab) : NaN;
    const visibili = nomi.map((n, i) => i).filter(i => !nascosti[i]);
    const s = F.sceltaFoglio({ nomi, nascosti, attivo: Number.isInteger(vista) ? vista : null, oggi: String(workerData.oggi || "") });
    const quali = visibili.length > 6 && s.i >= 0 ? F.viciniFoglio(s.i, nascosti, nomi.length, 4) : visibili.slice(0, 6);
    const fogli = quali.map(i => ({ nome: nomi[i].slice(0, 80), scelto: i === s.i, csv: String(X.utils.sheet_to_csv(wb.Sheets[nomi[i]], { blankrows: false }) || "").slice(0, 30000) }));
    parentPort.postMessage({ ok: true, fogli, quanti: visibili.length, perche: s.perche });
  } catch (e) { parentPort.postMessage({ ok: false, errore: String((e && e.message) || e).slice(0, 200) }); }
}

// i fogli di un Excel, letti dal lavoratore a parte: [{ nome, csv, scelto }], con sopra .quanti (quanti fogli ha il file) e .perche
export function fogliExcelIsolati(buf, ms = 20000, oggi = "") {
  return new Promise((ok, ko) => {
    let w;
    try { w = new Worker(new URL(import.meta.url), { workerData: { excelIsolato: true, buf: new Uint8Array(buf), oggi: String(oggi || "") }, resourceLimits: { maxOldGenerationSizeMb: 256, maxYoungGenerationSizeMb: 48 } }); }
    catch (e) { ko(e); return; }
    let finito = false;
    const fine = (f) => { if (finito) return; finito = true; clearTimeout(t); w.terminate().catch(() => {}); f(); };
    const t = setTimeout(() => fine(() => ko(new Error("l'Excel ci mette troppo"))), ms);
    w.once("message", (m) => fine(() => { if (!(m && m.ok)) { ko(new Error((m && m.errore) || "Excel illeggibile")); return; } const l = Array.isArray(m.fogli) ? m.fogli : []; l.quanti = Number(m.quanti) || l.length; l.perche = String(m.perche || ""); ok(l); }));
    w.once("error", (e) => fine(() => ko(e)));
    w.once("exit", (c) => fine(() => ko(new Error(`Excel: il lavoratore si è fermato (${c})`))));
  });
}
