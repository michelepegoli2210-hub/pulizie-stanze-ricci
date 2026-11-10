/* Le Stanze di Ricci · LA CASELLA DI SOFIA SEGRETARIA (versione 1, 10 novembre 2026)
 *
 * Michele, 10/11: «essendo dell'albergo questa email Sofia deve avere l'accesso h24 … anzi Sofia segretaria deve fare questo».
 * Questo piccolo programma sta nell'account Google DELL'ALBERGO e SOLO LEGGE la posta: non manda, non cancella, non sposta
 * e non segna niente (Google gli dà solo il permesso «sola lettura»). Ogni 10 minuti il giro di Sofia gli chiede le mail
 * nuove della scheda «Principale» (niente Promozioni, Social, Aggiornamenti) e Sofia segretaria le legge: in Segreteria scrive
 * a Michele cosa è arrivato e cosa c'è da fare. Le risposte le prepara Sofia, ma le manda sempre Michele.
 * Risponde solo a chi conosce il «segreto» scelto dall'app quando la colleghi. Al giro manda il nome di chi scrive, il
 * dominio (es. expediagroup.com, mai l'indirizzo intero), l'oggetto e il testo (senza le risposte citate), al massimo 3 giorni.
 *
 * Come si mette (una volta sola, dal PC, nell'account Google dell'albergo):
 *  1. script.new → incolla questo codice al posto di tutto → 💾
 *  2. ⚙️ Impostazioni progetto → spunta «Mostra il file manifest "appsscript.json" nell'editor» → nell'editor apri
 *     appsscript.json e mettici le impostazioni che copia l'app (il permesso «sola lettura») → 💾
 *  3. Esegui il deployment → Nuovo deployment → ⚙️ App web → Esegui come: Me → Chi ha accesso: Chiunque → Esegui il deployment
 *     → Autorizza l'accesso (Google dice «app non verificata»: è la tua, Avanzate → Vai a … → Consenti)
 *  4. copia l'«URL app web» nell'app: Altro → 📬 La posta dell'albergo.
 */
var VERSIONE = "1";
var MAX = 25, MAX_TESTO = 1800, GIORNI = 3;

function doGet() {
  return json_({ ok: true, casella: VERSIONE, collegata: !!PropertiesService.getScriptProperties().getProperty("segreto") });
}
function doPost(e) {
  var req = {};
  try { req = JSON.parse((e && e.postData && e.postData.contents) || "{}") || {}; } catch (x) { req = {}; }
  var r;
  try { r = gestisci_(req); } catch (x) { r = { ok: false, errore: "La casella ha avuto un problema: " + String(x && x.message || x).slice(0, 120) }; }
  return json_(r);
}
function gestisci_(req) {
  var P = PropertiesService.getScriptProperties(), segreto = P.getProperty("segreto"), azione = String(req.azione || "");
  if (azione === "collega") {
    if (segreto && req.segreto !== segreto) return { ok: false, errore: "Questa casella è già collegata a un'altra app." };
    if (!/^[A-Za-z0-9_-]{24,80}$/.test(String(req.segreto || ""))) return { ok: false, errore: "Segreto non valido." };
    var prof = api_("profile");
    P.setProperty("segreto", String(req.segreto));
    return { ok: true, casella: VERSIONE, indirizzo: String(prof.emailAddress || ""), messaggi: Number(prof.messagesTotal) || 0 };
  }
  if (!segreto) return { ok: false, errore: "La casella non è ancora collegata." };
  if (req.segreto !== segreto) return { ok: false, errore: "Segreto sbagliato." };
  if (azione === "prova") { var p = api_("profile"); return { ok: true, casella: VERSIONE, indirizzo: String(p.emailAddress || ""), messaggi: Number(p.messagesTotal) || 0 }; }
  if (azione === "nuove") return nuove_(Number(req.da) || 0);
  if (azione === "scollega") { P.deleteProperty("segreto"); return { ok: true }; }
  return { ok: false, errore: "Azione sconosciuta." };
}
// la posta si legge con l'API di Gmail (permesso «sola lettura», nel manifest)
function api_(percorso) {
  var r = UrlFetchApp.fetch("https://gmail.googleapis.com/gmail/v1/users/me/" + percorso, {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) throw new Error("Gmail non risponde (" + r.getResponseCode() + ")");
  return JSON.parse(r.getContentText());
}
function nuove_(da) {
  var dopo = Math.floor(Math.max(da - 3600 * 1000, Date.now() - GIORNI * 24 * 3600 * 1000) / 1000);
  var q = encodeURIComponent("in:inbox category:primary after:" + dopo);
  var lista = api_("messages?maxResults=" + MAX + "&q=" + q).messages || [];
  var out = [];
  for (var i = 0; i < lista.length; i++) {
    var m = api_("messages/" + lista[i].id + "?format=full");
    var ts = Number(m.internalDate) || 0;
    if (ts <= da) continue;
    var h = {};
    ((m.payload && m.payload.headers) || []).forEach(function (x) { h[String(x.name).toLowerCase()] = String(x.value || ""); });
    var mitt = h.from || "";
    var nome = mitt.replace(/<[^>]*>/g, "").replace(/"/g, "").trim();
    var dom = (mitt.match(/@([A-Za-z0-9.-]+)/) || [])[1] || "";
    if (/@/.test(nome)) nome = "";                       // niente indirizzi interi: al loro posto il dominio
    out.push({ id: String(m.id), ts: ts, chi: (nome || dom).slice(0, 80), dominio: dom.toLowerCase().slice(0, 80),
      oggetto: (h.subject || "").slice(0, 200), testo: pulisci_(testo_(m.payload)).slice(0, MAX_TESTO), allegati: allegati_(m.payload) });
  }
  out.sort(function (a, b) { return a.ts - b.ts; });
  return { ok: true, casella: VERSIONE, mail: out };
}
function decodifica_(d) {
  var s = String(d || "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Utilities.newBlob(Utilities.base64Decode(s)).getDataAsString("UTF-8");
}
function testo_(p) {
  var piano = "", html = "";
  (function giro(x) {
    if (!x) return;
    var mt = String(x.mimeType || "");
    if (x.body && x.body.data && !x.filename) {
      if (!piano && mt === "text/plain") piano = decodifica_(x.body.data);
      else if (!html && mt === "text/html") html = decodifica_(x.body.data);
    }
    (x.parts || []).forEach(giro);
  })(p);
  if (piano) return piano;
  return html.replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
// via le risposte citate (la mail di prima, sotto) e le righe vuote in più
function pulisci_(t) {
  var righe = String(t || "").replace(/\r/g, "").split("\n"), out = [];
  for (var i = 0; i < righe.length; i++) {
    var r = righe[i];
    if (/^\s*>/.test(r)) continue;
    if (/^\s*(Il giorno .{4,120} ha scritto:?|On .{4,120} wrote:?|-{2,}\s*(Messaggio originale|Original Message)|Da:\s.+|From:\s.+)\s*$/i.test(r)) break;
    out.push(r.replace(/[ \t]+/g, " ").trim());
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
function allegati_(p) {
  var n = 0;
  (function giro(x) { if (!x) return; if (x.filename) n++; (x.parts || []).forEach(giro); })(p);
  return n;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
