// ============================================================================
//  giro 1.41.0 · UN EXCEL ARRIVATO PER EMAIL SI APRE IN UN «LAVORATORE» A PARTE
//  La libreria degli Excel (SheetJS 0.18.5, la stessa che legge il prospetto dell'albergo) con un file di fuori fatto apposta
//  può sporcare gli oggetti del programma (CVE-2023-30533) o girare a vuoto (CVE-2024-22363). Per il prospetto (file nostri)
//  va bene così; per gli allegati delle email, che manda chiunque, l'Excel lo apre un lavoratore a parte (worker_threads):
//  ha i suoi oggetti, non vede niente del giro (né il database né le chiavi), restituisce solo il testo dei fogli e dopo
//  20 secondi, se non ha finito, si spegne.
// ============================================================================
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { createRequire } from "node:module";

if (!isMainThread && workerData && workerData.excelIsolato) {
  try {
    const X = createRequire(import.meta.url)("../xlsx.min.js");
    const wb = X.read(Buffer.from(workerData.buf), { type: "buffer" });
    const fogli = wb.SheetNames.slice(0, 6).map(nome => ({ nome: String(nome).slice(0, 80), csv: String(X.utils.sheet_to_csv(wb.Sheets[nome], { blankrows: false }) || "").slice(0, 30000) }));
    parentPort.postMessage({ ok: true, fogli });
  } catch (e) { parentPort.postMessage({ ok: false, errore: String((e && e.message) || e).slice(0, 200) }); }
}

// i fogli di un Excel: [{ nome, csv }], letti dal lavoratore a parte
export function fogliExcelIsolati(buf, ms = 20000) {
  return new Promise((ok, ko) => {
    let w;
    try { w = new Worker(new URL(import.meta.url), { workerData: { excelIsolato: true, buf: new Uint8Array(buf) }, resourceLimits: { maxOldGenerationSizeMb: 256, maxYoungGenerationSizeMb: 48 } }); }
    catch (e) { ko(e); return; }
    let finito = false;
    const fine = (f) => { if (finito) return; finito = true; clearTimeout(t); w.terminate().catch(() => {}); f(); };
    const t = setTimeout(() => fine(() => ko(new Error("l'Excel ci mette troppo"))), ms);
    w.once("message", (m) => fine(() => (m && m.ok ? ok(Array.isArray(m.fogli) ? m.fogli : []) : ko(new Error((m && m.errore) || "Excel illeggibile")))));
    w.once("error", (e) => fine(() => ko(e)));
    w.once("exit", (c) => fine(() => ko(new Error(`Excel: il lavoratore si è fermato (${c})`))));
  });
}
