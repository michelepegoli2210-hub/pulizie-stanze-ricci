/* Le Stanze di Ricci · LA CASELLA DI SOFIA SEGRETARIA (versione 3, 20 novembre 2026)
 *
 * Michele, 10/11: «essendo dell'albergo questa email Sofia deve avere l'accesso h24 … anzi Sofia segretaria deve fare questo».
 * Questo piccolo programma sta nell'account Google DELL'ALBERGO e SOLO LEGGE la posta: non manda, non cancella, non sposta
 * e non segna niente (Google gli dà solo il permesso «sola lettura»). Ogni 10 minuti il giro di Sofia gli chiede le mail
 * nuove della scheda «Principale» (niente Promozioni, Social, Aggiornamenti) e Sofia segretaria le legge: in Segreteria scrive
 * a Michele cosa è arrivato e cosa c'è da fare. Le risposte le prepara Sofia, ma le manda sempre Michele.
 * Risponde solo a chi conosce il «segreto» scelto dall'app quando la colleghi. Al giro manda il nome di chi scrive, il
 * dominio (es. expediagroup.com, mai l'indirizzo intero), l'oggetto e il testo (senza le risposte citate), al massimo 3 giorni.
 *
 * VERSIONE 2 (Michele, 17/11: «il sito ciclovia io devo ricevere assolutamente»): le email dei siti di prenotazione (la
 * Ciclovia Adriatica, Booking, Expedia, Airbnb) Gmail le mette spesso in «Aggiornamenti», non in «Principale»: adesso la casella
 * prende anche quelle (non la pubblicità, che sta in «Promozioni»). Per passare dalla versione 1 alla 2: nell'editor incolla
 * questo codice al posto di tutto → 💾 → Esegui il deployment → Gestisci deployment → ✏️ → Versione: «Nuova versione» → Esegui
 * il deployment (l'indirizzo resta lo stesso: nell'app non si tocca niente).
 *
 * VERSIONE 3 (Michele, 20/11: «essenziale è che io possa leggere anche tutti gli allegati dall'applicazione… e l'applicazione
 * debba leggere anche gli allegati… negli allegati c'è proprio il succo del discorso»): per ogni mail l'elenco degli allegati
 * (nome, tipo, quanto pesa) e l'azione «allegato», che dà un allegato all'app (per farlo vedere a Michele) e al giro di Sofia
 * (per farlo leggere a Gemini: Michele ha scelto «tutto com'è»). Sempre SOLO LETTURA, solo mail della posta in arrivo degli
 * ultimi 30 giorni, al massimo 10 MB. L'aggiornamento si fa come per la versione 2 (incolla, 💾, Gestisci deployment → ✏️ →
 * «Nuova versione»): l'indirizzo resta lo stesso.
 *
 * Come si mette (una volta sola, dal PC, nell'account Google dell'albergo):
 *  1. script.new → incolla questo codice al posto di tutto → 💾
 *  2. ⚙️ Impostazioni progetto → spunta «Mostra il file manifest "appsscript.json" nell'editor» → nell'editor apri
 *     appsscript.json e mettici le impostazioni che copia l'app (il permesso «sola lettura») → 💾
 *     (1.84.1: dentro c'è anche il servizio «Gmail»: così Google accende l'API di Gmail del progetto. Senza, la casella
 *     risponde «Gmail non risponde (403)».)
 *  3. Esegui il deployment → Nuovo deployment → ⚙️ App web → Esegui come: Me → Chi ha accesso: Chiunque → Esegui il deployment
 *     → Autorizza l'accesso (Google dice «app non verificata»: è la tua, Avanzate → Vai a … → Consenti)
 *  4. copia l'«URL app web» nell'app: Altro → 📬 La posta dell'albergo.
 */
var VERSIONE = "3";
var SITI = ["cicloviaadriatica.eu", "booking.com", "expedia.com", "expediagroup.com", "expediapartnercentral.com", "airbnb.com", "airbnb.it"];   // i siti di prenotazione
var MAX = 25, MAX_TESTO = 1800, GIORNI = 3;
var MAX_FILE = 10 * 1024 * 1024, GIORNI_FILE = 30, MAX_ELENCO = 10;   // versione 3: gli allegati

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
  if (azione === "elenco") return elenco_(String(req.id || ""));            // versione 3: gli allegati di una mail
  if (azione === "allegato") return allegato_(String(req.id || ""), String(req.parte || ""));
  if (azione === "scollega") { P.deleteProperty("segreto"); return { ok: true }; }
  return { ok: false, errore: "Azione sconosciuta." };
}
// la posta si legge con l'API di Gmail (permesso «sola lettura», nel manifest)
function api_(percorso) {
  var r = UrlFetchApp.fetch("https://gmail.googleapis.com/gmail/v1/users/me/" + percorso, {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) {
    var msg = ""; try { msg = String((JSON.parse(r.getContentText()).error || {}).message || ""); } catch (x) {}
    throw new Error("Gmail non risponde (" + r.getResponseCode() + ")" + (msg ? ": " + msg.slice(0, 160) : ""));
  }
  return JSON.parse(r.getContentText());
}
function nuove_(da) {
  var dopo = Math.floor(Math.max(da - 3600 * 1000, Date.now() - GIORNI * 24 * 3600 * 1000) / 1000);
  var q = encodeURIComponent("in:inbox category:primary after:" + dopo);
  var lista = api_("messages?maxResults=" + MAX + "&q=" + q).messages || [];
  // versione 2: anche le email dei siti di prenotazione che Gmail ha messo fuori da «Principale» (mai quelle in «Promozioni»)
  var q2 = encodeURIComponent("in:inbox -category:primary -category:promotions after:" + dopo + " {" + SITI.map(function (s) { return "from:" + s; }).join(" ") + "}");
  var gia = {}; lista.forEach(function (x) { gia[x.id] = true; });
  (api_("messages?maxResults=" + MAX + "&q=" + q2).messages || []).forEach(function (x) { if (!gia[x.id]) { gia[x.id] = true; lista.push(x); } });
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
      oggetto: (h.subject || "").slice(0, 200), testo: pulisci_(testo_(m.payload)).slice(0, MAX_TESTO), allegati: allegati_(m.payload), files: files_(m.payload) });
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
// versione 3: gli allegati (nome, tipo, quanto pesa, e la «parte» che serve per chiederlo); le immagini dentro il testo no
function files_(p) {
  var out = [];
  (function giro(x) {
    if (!x || out.length >= MAX_ELENCO) return;
    if (x.filename && x.body && (x.body.attachmentId || x.body.data)) {
      var dentro = /^inline/i.test(intestazione_(x, "content-disposition")) && /^image\//i.test(String(x.mimeType || "")) && Number(x.body.size || 0) < 60 * 1024;
      if (!dentro) out.push({ p: String(x.partId || ""), n: String(x.filename).slice(0, 120), t: String(x.mimeType || "").slice(0, 80), kb: Math.ceil(Number(x.body.size || 0) / 1024) });
    }
    (x.parts || []).forEach(giro);
  })(p);
  return out;
}
function intestazione_(x, nome) {
  var v = ""; ((x && x.headers) || []).forEach(function (h) { if (String(h.name).toLowerCase() === nome) v = String(h.value || ""); });
  return v;
}
function mailRecente_(id) {
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(id)) return { errore: "Mail sconosciuta." };
  var m = api_("messages/" + id + "?format=full");
  if ((m.labelIds || []).indexOf("INBOX") < 0) return { errore: "Questa mail non è nella posta in arrivo." };
  if ((Number(m.internalDate) || 0) < Date.now() - GIORNI_FILE * 24 * 3600 * 1000) return { errore: "La mail è più vecchia di " + GIORNI_FILE + " giorni: aprila nella posta." };
  return { m: m };
}
function elenco_(id) {
  var x = mailRecente_(id); if (x.errore) return { ok: false, errore: x.errore };
  return { ok: true, casella: VERSIONE, files: files_(x.m.payload) };
}
function allegato_(id, parte) {
  if (!/^[0-9.]{1,20}$/.test(parte)) return { ok: false, errore: "Allegato sconosciuto." };
  var x = mailRecente_(id); if (x.errore) return { ok: false, errore: x.errore };
  var trovata = null;
  (function giro(y) { if (!y || trovata) return; if (String(y.partId || "") === parte) { trovata = y; return; } (y.parts || []).forEach(giro); })(x.m.payload);
  if (!trovata || !trovata.filename || !trovata.body) return { ok: false, errore: "Allegato sconosciuto." };
  if (Number(trovata.body.size || 0) > MAX_FILE) return { ok: false, errore: "L'allegato è troppo grande per l'app (più di 10 MB): aprilo nella posta.", grande: true };
  var dati = trovata.body.data || (trovata.body.attachmentId ? api_("messages/" + id + "/attachments/" + trovata.body.attachmentId).data : "");
  if (!dati) return { ok: false, errore: "L'allegato è vuoto." };
  dati = String(dati).replace(/-/g, "+").replace(/_/g, "/"); while (dati.length % 4) dati += "=";
  return { ok: true, casella: VERSIONE, nome: String(trovata.filename).slice(0, 120), tipo: String(trovata.mimeType || ""), kb: Math.ceil(Number(trovata.body.size || 0) / 1024), dati: dati };
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
