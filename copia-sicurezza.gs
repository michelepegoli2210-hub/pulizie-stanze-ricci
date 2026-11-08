/* Le Stanze di Ricci · LA CASSETTA DELLE COPIE DI SICUREZZA E DEI CALENDARI (versione 2, 8 novembre 2026)
 *
 * Una volta a settimana Sofia (il giro automatico) fa una copia di TUTTI i dati dell'app e la manda qui. Questo piccolo
 * programma, nel tuo account Google, la mette nel tuo Google Drive, nella cartella «Copie di sicurezza - Le Stanze di
 * Ricci», e tiene le ultime 26 copie (mezzo anno): quelle più vecchie vanno nel Cestino di Drive.
 * Risponde solo a chi conosce il «segreto» scelto la prima volta (lo sceglie l'app quando la colleghi).
 * Non legge niente del tuo Drive fuori da quella cartella e non manda niente a nessuno.
 *
 * I CALENDARI (il channel manager gratis): Sofia le manda anche le date prese di ogni camera (solo le date, nessun nome),
 * e la cassetta le dà a Booking, Airbnb ed Expedia con un link per camera (…/exec?cal=alba&per=booking&k=…), così loro
 * chiudono da soli le date prese da te. Il link funziona solo con la chiave giusta.
 *
 * Come si mette (una volta sola): Esegui il deployment → Nuovo deployment → ⚙️ App web → Esegui come: Me →
 * Chi ha accesso: Chiunque → Esegui il deployment → Autorizza l'accesso → copia l'«URL app web» nell'app.
 */
var CARTELLA = "Copie di sicurezza - Le Stanze di Ricci";
var TIENI = 26;
var VERSIONE = "2";
var NOME_GIUSTO = /^stanze-ricci-copia-\d{4}-\d{2}-\d{2}(-[a-z0-9]{1,12})?\.json\.gz$/;

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.cal) return calendario_(String(p.cal), String(p.per || ""), String(p.k || ""));
  return json_({ ok: true, cassetta: VERSIONE, impostata: !!PropertiesService.getScriptProperties().getProperty("segreto") });
}

// il calendario di una camera (iCal), per Booking, Airbnb o Expedia: le date prese, senza le loro (per=booking non
// rimanda a Booking le prenotazioni arrivate da Booking)
function calendario_(cam, per, k) {
  var P = PropertiesService.getScriptProperties(), chiave = P.getProperty("calChiave");
  var testo = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Le Stanze di Ricci//Calendari//IT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Le Stanze di Ricci"];
  if (chiave && k === chiave && /^[a-z0-9_-]{1,40}$/i.test(cam)) {
    var lista = [];
    try { lista = JSON.parse(P.getProperty("cal_" + cam) || "[]"); } catch (x) { lista = []; }
    var adesso = Utilities.formatDate(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'");
    for (var i = 0; i < lista.length; i++) {
      var r = lista[i]; if (!r || r.length < 2 || (per && r[2] === per)) continue;
      testo.push("BEGIN:VEVENT", "UID:" + cam + "-" + r[0] + "-" + r[1] + "@lestanzediricci", "DTSTAMP:" + adesso,
        "DTSTART;VALUE=DATE:" + String(r[0]).replace(/-/g, ""), "DTEND;VALUE=DATE:" + String(r[1]).replace(/-/g, ""), "SUMMARY:Non disponibile", "END:VEVENT");
    }
  }
  testo.push("END:VCALENDAR");
  return ContentService.createTextOutput(testo.join("\r\n") + "\r\n").setMimeType(ContentService.MimeType.ICAL);
}

function doPost(e) {
  var req;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || "{}"); }
  catch (x) { return json_({ ok: false, errore: "Richiesta non valida." }); }
  try { return json_(gestisci_(req || {})); }
  catch (x) { return json_({ ok: false, errore: "Errore della cassetta: " + (x && x.message ? x.message : x) }); }
}

function gestisci_(req) {
  var P = PropertiesService.getScriptProperties(), segreto = P.getProperty("segreto"), azione = String(req.azione || "");
  if (azione === "imposta") {
    if (segreto && req.segreto !== segreto) return { ok: false, errore: "Questa cassetta è già collegata a un'altra app." };
    if (!/^[A-Za-z0-9_-]{24,80}$/.test(String(req.segreto || ""))) return { ok: false, errore: "Segreto non valido." };
    var c = cartella_();
    P.setProperty("segreto", String(req.segreto));
    return { ok: true, cassetta: VERSIONE, cartella: c.getName(), link: c.getUrl(), copie: copie_(c).length };
  }
  if (!segreto) return { ok: false, errore: "La cassetta non è ancora collegata." };
  if (req.segreto !== segreto) return { ok: false, errore: "Segreto sbagliato." };
  if (azione === "prova") {
    var c2 = cartella_(), l = copie_(c2);
    return { ok: true, cassetta: VERSIONE, link: c2.getUrl(), copie: l.length, ultima: l.length ? l[0].getName() : "" };
  }
  if (azione === "metti") {
    var nome = String(req.nome || ""), parte = Number(req.parte || 1), di = Number(req.di || 1), dati = String(req.dati || "");
    if (!NOME_GIUSTO.test(nome)) return { ok: false, errore: "Nome del file non valido." };
    if (!(parte >= 1 && di >= 1 && parte <= di && di <= 20)) return { ok: false, errore: "Pezzo non valido." };
    if (!dati || !/^[A-Za-z0-9+\/=]+$/.test(dati)) return { ok: false, errore: "Copia vuota o rovinata." };
    var bytes = Utilities.base64Decode(dati);
    var cc = cartella_(), nomeFile = di > 1 ? nome + ".pezzo-" + parte + "-di-" + di : nome;
    if (parte === 1) {   // la copia rifatta lo stesso giorno: vale l'ultima (via anche i pezzi di quella di prima)
      var it = cc.getFiles();
      while (it.hasNext()) { var v = it.next(); if (v.getName().indexOf(nome) === 0) v.setTrashed(true); }
    }
    var f = cc.createFile(Utilities.newBlob(bytes, "application/gzip", nomeFile));
    var tolte = parte === di ? pulisci_(cc) : 0;
    return { ok: true, id: f.getId(), byte: bytes.length, link: cc.getUrl(), tolte: tolte };
  }
  if (azione === "calendari") {
    var camere = req.camere || {}, chiaveC = String(req.chiave || "");
    if (!/^[A-Za-z0-9_-]{24,80}$/.test(chiaveC)) return { ok: false, errore: "Chiave dei calendari non valida." };
    var nomi = Object.keys(camere), vecchie = P.getKeys();
    if (nomi.length > 40) return { ok: false, errore: "Troppe camere." };
    for (var v = 0; v < vecchie.length; v++) if (vecchie[v].indexOf("cal_") === 0 && !camere.hasOwnProperty(vecchie[v].slice(4))) P.deleteProperty(vecchie[v]);
    for (var n = 0; n < nomi.length; n++) {
      if (!/^[a-z0-9_-]{1,40}$/i.test(nomi[n])) continue;
      var righe = (camere[nomi[n]] || []).filter(function (r) { return r && /^\d{4}-\d{2}-\d{2}$/.test(r[0]) && /^\d{4}-\d{2}-\d{2}$/.test(r[1]); }).slice(0, 150);
      P.setProperty("cal_" + nomi[n], JSON.stringify(righe));
    }
    P.setProperty("calChiave", chiaveC);
    return { ok: true, camere: nomi.length };
  }
  if (azione === "togli") { P.deleteProperty("segreto"); return { ok: true }; }
  return { ok: false, errore: "Non so fare: " + azione };
}

function cartella_() {
  var it = DriveApp.getFoldersByName(CARTELLA);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CARTELLA);
}

// le copie nella cartella, dalla più nuova (il giorno è nel nome)
function copie_(c) {
  var l = [], it = c.getFiles();
  while (it.hasNext()) { var f = it.next(); if (/^stanze-ricci-copia-\d{4}-\d{2}-\d{2}/.test(f.getName())) l.push(f); }
  l.sort(function (a, b) { return a.getName() < b.getName() ? 1 : a.getName() > b.getName() ? -1 : 0; });
  return l;
}

// tiene le ultime TIENI copie (una copia in più pezzi conta una volta sola); le altre nel Cestino di Drive
function pulisci_(c) {
  var giorni = {}, l = copie_(c), n = 0;
  for (var i = 0; i < l.length; i++) { var g = l[i].getName().slice(19, 29); (giorni[g] = giorni[g] || []).push(l[i]); }
  var chiavi = Object.keys(giorni).sort().reverse();
  for (var k = TIENI; k < chiavi.length; k++) for (var j = 0; j < giorni[chiavi[k]].length; j++) { giorni[chiavi[k]][j].setTrashed(true); n++; }
  return n;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
