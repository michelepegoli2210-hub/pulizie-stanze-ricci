// 1.108.0 · UN EXCEL ARRIVATO PER EMAIL SI APRE QUI, IN UN «LAVORATORE» A PARTE
// La libreria degli Excel (SheetJS 0.18.5) con un file di fuori fatto apposta può sporcare gli oggetti dell'app
// (CVE-2023-30533) o girare a vuoto (CVE-2024-22363). Qui dentro non vede niente dell'app (né il database né le chiavi):
// restituisce solo le righe dei fogli, come testo. L'app lo spegne dopo 20 secondi se non ha finito.
// 1.118.0 (Michele, 27/11/2026: «nell'allegato io ho trovato soltanto le presenze addirittura del 2022»): prima dava i primi
// 8 fogli, e il file delle presenze ne ha uno per mese dal 2022. Adesso dà UN foglio, quello «di adesso» (fogli-excel.js: dal
// nome, poi quello su cui il file era aperto, poi il primo) o quello chiesto dall'app («quale»), più l'elenco dei nomi di
// tutti i fogli che si vedono (i nascosti no), così l'app li fa scegliere. Messaggio: i byte del file (come prima), oppure
// { buf, quale, oggi }.
self.onmessage = (e) => {
  try {
    if (!self.XLSX) importScripts("xlsx.min.js");
    if (!self.FogliExcel) importScripts("fogli-excel.js");
    const m = e.data && e.data.buf ? e.data : { buf: e.data };
    const X = self.XLSX, wb = X.read(new Uint8Array(m.buf), { type: "array" });
    const W = wb.Workbook || {}, nomi = (wb.SheetNames || []).map(n => String(n));
    const nascosti = nomi.map((n, i) => !!((W.Sheets || [])[i] && (W.Sheets || [])[i].Hidden));
    const vista = Array.isArray(W.WBView) && W.WBView[0] ? Number(W.WBView[0].activeTab) : NaN;
    const chiesto = Number.isInteger(m.quale) && m.quale >= 0 && m.quale < nomi.length && !nascosti[m.quale];
    const s = chiesto ? { i: m.quale, perche: "scelto" } : self.FogliExcel.sceltaFoglio({ nomi, nascosti, attivo: Number.isInteger(vista) ? vista : null, oggi: String(m.oggi || "") });
    const elenco = nomi.map((n, i) => ({ i, nome: n.slice(0, 80) })).filter(x => !nascosti[x.i]);
    const fogli = [];
    if (s.i >= 0) {
      const tutte = X.utils.sheet_to_json(wb.Sheets[nomi[s.i]], { header: 1, blankrows: false, defval: "" });
      fogli.push({ i: s.i, nome: nomi[s.i].slice(0, 80), tagliato: tutte.length > 400 || tutte.some(r => Array.isArray(r) && r.length > 30),
        righe: tutte.slice(0, 400).map(r => (Array.isArray(r) ? r : []).slice(0, 30).map(c => String(c == null ? "" : c).slice(0, 300))) });
    }
    self.postMessage({ ok: true, fogli, elenco: elenco.slice(0, 300), quanti: elenco.length, scelto: s.i, perche: s.perche });
  } catch (err) { self.postMessage({ ok: false, errore: String((err && err.message) || err).slice(0, 200) }); }
};
