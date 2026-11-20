// 1.108.0 · UN EXCEL ARRIVATO PER EMAIL SI APRE QUI, IN UN «LAVORATORE» A PARTE
// La libreria degli Excel (SheetJS 0.18.5) con un file di fuori fatto apposta può sporcare gli oggetti dell'app
// (CVE-2023-30533) o girare a vuoto (CVE-2024-22363). Qui dentro non vede niente dell'app (né il database né le chiavi):
// restituisce solo le righe dei fogli, come testo. L'app lo spegne dopo 20 secondi se non ha finito.
self.onmessage = (e) => {
  try {
    if (!self.XLSX) importScripts("xlsx.min.js");
    const X = self.XLSX, wb = X.read(new Uint8Array(e.data), { type: "array" });
    const fogli = wb.SheetNames.slice(0, 8).map(nome => ({
      nome: String(nome).slice(0, 80),
      righe: X.utils.sheet_to_json(wb.Sheets[nome], { header: 1, blankrows: false, defval: "" }).slice(0, 400)
        .map(r => (Array.isArray(r) ? r : []).slice(0, 30).map(c => String(c == null ? "" : c).slice(0, 300)))
    }));
    self.postMessage({ ok: true, fogli });
  } catch (err) { self.postMessage({ ok: false, errore: String((err && err.message) || err).slice(0, 200) }); }
};
