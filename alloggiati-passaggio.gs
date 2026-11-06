/* Le Stanze di Ricci · «IL PASSAGGIO» PER ALLOGGIATI WEB (versione 1, 6 novembre 2026)
 *
 * L'app delle pulizie non può parlare direttamente col servizio della Polizia (il sito blocca le richieste che arrivano
 * dalle app nel browser). Questo piccolo programma, nel tuo account Google, fa da passaggio:
 *  - tiene nome utente, password e chiave WSKEY di Alloggiati Web nelle «Proprietà dello script» (solo qui, mai nell'app);
 *  - riceve dall'app le schedine (le righe di 168 caratteri), le fa controllare alla Polizia (Test) e poi le manda (Send);
 *  - prende la ricevuta del giorno (PDF).
 * Risponde solo all'app che conosce il «segreto» scelto la prima volta. Non salva le schedine da nessuna parte.
 *
 * Come si mette (una volta sola): Esegui il deployment → Nuovo deployment → ⚙️ App web → Esegui come: Me →
 * Chi ha accesso: Chiunque → Esegui il deployment → Autorizza l'accesso → copia l'«URL app web» nell'app.
 */
var SERVIZIO = "https://alloggiatiweb.poliziadistato.it/service/service.asmx";
var VERSIONE = "1";

function doGet() {
  return json_({ ok: true, passaggio: VERSIONE, impostato: !!prop_("utente") });
}

function doPost(e) {
  var req;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || "{}"); }
  catch (x) { return json_({ ok: false, errore: "Richiesta non valida." }); }
  try { return json_(gestisci_(req || {})); }
  catch (x) { return json_({ ok: false, errore: "Errore del passaggio: " + (x && x.message ? x.message : x) }); }
}

function gestisci_(req) {
  var P = PropertiesService.getScriptProperties(), segreto = P.getProperty("segreto"), azione = String(req.azione || "");
  if (azione === "imposta") {
    if (segreto && req.segreto !== segreto) return { ok: false, errore: "Questo passaggio è già collegato a un'altra app." };
    if (!/^[A-Za-z0-9_-]{24,80}$/.test(String(req.segreto || ""))) return { ok: false, errore: "Segreto non valido." };
    var u = String(req.utente || "").trim(), pw = String(req.password || ""), k = String(req.wskey || "").trim();
    if (!u || !pw || !k) return { ok: false, errore: "Mancano il nome utente, la password o la chiave WSKEY." };
    var t = generaToken_(u, pw, k);
    if (!t.ok) return { ok: false, errore: "La Polizia non accetta questi dati: " + t.errore };
    var a = autenticazione_(u, t.token);
    if (!a.ok) return { ok: false, errore: "La Polizia non conferma l'accesso: " + a.errore };
    P.setProperties({ utente: u, password: pw, wskey: k, segreto: String(req.segreto) });
    tieniToken_(t);
    return { ok: true, passaggio: VERSIONE };
  }
  if (!segreto) return { ok: false, errore: "Il passaggio non è ancora impostato." };
  if (req.segreto !== segreto) return { ok: false, errore: "Segreto sbagliato." };
  if (azione === "togli") { P.deleteAllProperties(); CacheService.getScriptCache().remove("token"); return { ok: true }; }
  var utente = P.getProperty("utente"), tok = token_(false);
  if (!tok.ok) return { ok: false, errore: tok.errore };
  if (azione === "prova") {
    var aa = autenticazione_(utente, tok.token);
    if (!aa.ok) { tok = token_(true); if (!tok.ok) return { ok: false, errore: tok.errore }; aa = autenticazione_(utente, tok.token); }
    return aa.ok ? { ok: true, passaggio: VERSIONE } : { ok: false, errore: aa.errore };
  }
  if (azione === "manda" || azione === "controlla") {
    var righe = req.righe;
    if (!Array.isArray(righe) || !righe.length || righe.length > 300) return { ok: false, errore: "Nessuna schedina da mandare." };
    for (var i = 0; i < righe.length; i++) if (typeof righe[i] !== "string" || righe[i].length !== 168) return { ok: false, errore: "La schedina " + (i + 1) + " non è lunga 168 caratteri." };
    var c = schedine_("Test", utente, tok.token, righe);
    if (!c.ok && !c.righe.length) { tok = token_(true); if (!tok.ok) return { ok: false, errore: tok.errore }; c = schedine_("Test", utente, tok.token, righe); }   // il token era scaduto?
    if (!c.ok || c.valide !== righe.length) return { ok: false, fase: "controllo", valide: c.valide, righe: c.righe, errore: c.errore || "La Polizia ha trovato errori nelle schedine." };
    if (azione === "controlla") return { ok: true, fase: "controllo", valide: c.valide, righe: c.righe };
    var s = schedine_("Send", utente, tok.token, righe);
    return { ok: s.ok && s.valide === righe.length, fase: "invio", valide: s.valide, righe: s.righe, errore: s.ok ? (s.valide === righe.length ? "" : "La Polizia ne ha prese " + s.valide + " su " + righe.length + ".") : s.errore };
  }
  if (azione === "ricevuta") {
    var data = String(req.data || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false, errore: "Data non valida." };
    var x = chiama_("Ricevuta", "<Utente>" + esc_(utente) + "</Utente><token>" + esc_(tok.token) + "</token><Data>" + data + "T00:00:00</Data><PDF />");
    if (x.errore) return { ok: false, errore: x.errore };
    var es = esito_(blocco_(x.xml, "RicevutaResult")), pdf = valore_(x.xml, "PDF").replace(/\s+/g, "");
    if ((es.letto && !es.ok) || !pdf) return { ok: false, errore: es.errore || "La ricevuta di quel giorno non c'è (ancora)." };
    return { ok: true, pdf: pdf };
  }
  return { ok: false, errore: "Azione sconosciuta." };
}

// ---- il token della Polizia (dura un po': si tiene nella cache dello script) ------------------------------------------
function token_(nuovo) {
  var C = CacheService.getScriptCache();
  if (!nuovo) { var v = C.get("token"); if (v) { try { var j = JSON.parse(v); if (j && j.token) return { ok: true, token: j.token }; } catch (x) {} } }
  var P = PropertiesService.getScriptProperties();
  var t = generaToken_(P.getProperty("utente"), P.getProperty("password"), P.getProperty("wskey"));
  if (!t.ok) return { ok: false, errore: "La Polizia non dà l'accesso: " + t.errore };
  tieniToken_(t);
  return { ok: true, token: t.token };
}
function tieniToken_(t) { CacheService.getScriptCache().put("token", JSON.stringify({ token: t.token }), Math.max(60, Math.min(21600, t.secondi - 60))); }
function generaToken_(u, pw, k) {
  var x = chiama_("GenerateToken", "<Utente>" + esc_(u) + "</Utente><Password>" + esc_(pw) + "</Password><WsKey>" + esc_(k) + "</WsKey><result />");
  if (x.errore) return { ok: false, errore: x.errore };
  var r = blocco_(x.xml, "GenerateTokenResult"), token = valore_(r, "token"), es = esito_(blocco_(x.xml, "result"));
  if (!token || (es.letto && !es.ok)) return { ok: false, errore: es.errore || "nessun token" };
  var scade = Date.parse(valore_(r, "expires")), secondi = isNaN(scade) ? 1200 : Math.floor((scade - Date.now()) / 1000);
  return { ok: true, token: token, secondi: secondi > 120 ? secondi : 1200 };
}
function autenticazione_(u, token) {
  var x = chiama_("Authentication_Test", "<Utente>" + esc_(u) + "</Utente><token>" + esc_(token) + "</token>");
  if (x.errore) return { ok: false, errore: x.errore };
  var es = esito_(blocco_(x.xml, "Authentication_TestResult"));
  return es.letto ? es : { ok: false, errore: "risposta senza esito" };
}
// Test e Send: una riga di 168 caratteri per persona; la Polizia risponde quante sono valide e, riga per riga, gli errori
function schedine_(op, utente, token, righe) {
  var corpo = "<Utente>" + esc_(utente) + "</Utente><token>" + esc_(token) + "</token><ElencoSchedine>"
    + righe.map(function (r) { return "<string>" + esc_(r) + "</string>"; }).join("") + "</ElencoSchedine><result />";
  var x = chiama_(op, corpo);
  if (x.errore) return { ok: false, valide: 0, righe: [], errore: x.errore };
  var top = esito_(blocco_(x.xml, op + "Result")), res = blocco_(x.xml, "result");
  var dett = blocchi_(blocco_(res, "Dettaglio"), "EsitoOperazioneServizio").map(function (d) { var q = esito_(d); return { ok: q.ok, errore: q.errore }; });
  return { ok: top.letto ? top.ok : false, valide: parseInt(valore_(res, "SchedineValide"), 10) || 0, righe: dett, errore: top.errore || (top.letto ? "" : "risposta senza esito") };
}

// ---- la chiamata SOAP 1.1 (spazio dei nomi «AlloggiatiService», come nelle pagine del servizio) -----------------------
function chiama_(op, corpo) {
  var env = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>'
    + "<" + op + ' xmlns="AlloggiatiService">' + corpo + "</" + op + "></soap:Body></soap:Envelope>";
  var r;
  try { r = UrlFetchApp.fetch(SERVIZIO, { method: "post", contentType: "text/xml; charset=utf-8", headers: { SOAPAction: '"AlloggiatiService/' + op + '"' }, payload: env, muteHttpExceptions: true }); }
  catch (x) { return { errore: "il servizio della Polizia non risponde (" + (x && x.message ? x.message : x) + ")" }; }
  var testo = r.getContentText("UTF-8"), codice = r.getResponseCode();
  if (codice !== 200) return { errore: valore_(testo, "faultstring") || ("la Polizia ha risposto " + codice) };
  return { xml: testo };
}
function esito_(x) {
  if (!x) return { letto: false, ok: false, errore: "" };
  var e = valore_(x, "esito").toLowerCase(), cod = valore_(x, "ErroreCod"), des = valore_(x, "ErroreDes"), det = valore_(x, "ErroreDettaglio");
  var ok = e === "true";
  return { letto: e !== "", ok: ok, errore: ok ? "" : ([des, det].filter(function (s) { return s; }).join(" · ") + (cod ? " (" + cod + ")" : "")) };
}
function blocco_(xml, tag) {
  var m = new RegExp("<(?:[\\w.-]+:)?" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?" + tag + ">").exec(xml || "");
  return m ? m[1] : "";
}
function blocchi_(xml, tag) {
  var re = new RegExp("<(?:[\\w.-]+:)?" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?" + tag + ">", "g"), out = [], m;
  while ((m = re.exec(xml || ""))) out.push(m[1]);
  return out;
}
function valore_(xml, tag) { return deEsc_(blocco_(xml, tag)).trim(); }
function esc_(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function deEsc_(s) {
  return String(s || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); }).replace(/&amp;/g, "&");
}
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
