/* Le Stanze di Ricci · LA CASSETTA DELLE COPIE DI SICUREZZA (versione 1, 8 novembre 2026)
 *
 * Una volta a settimana Sofia (il giro automatico) fa una copia di TUTTI i dati dell'app e la manda qui. Questo piccolo
 * programma, nel tuo account Google, la mette nel tuo Google Drive, nella cartella «Copie di sicurezza - Le Stanze di
 * Ricci», e tiene le ultime 26 copie (mezzo anno): quelle più vecchie vanno nel Cestino di Drive.
 * Risponde solo a chi conosce il «segreto» scelto la prima volta (lo sceglie l'app quando la colleghi).
 * Non legge niente del tuo Drive fuori da quella cartella e non manda niente a nessuno.
 *
 * Come si mette (una volta sola): Esegui il deployment → Nuovo deployment → ⚙️ App web → Esegui come: Me →
 * Chi ha accesso: Chiunque → Esegui il deployment → Autorizza l'accesso → copia l'«URL app web» nell'app.
 */
var CARTELLA = "Copie di sicurezza - Le Stanze di Ricci";
var TIENI = 26;
var VERSIONE = "1";
var NOME_GIUSTO = /^stanze-ricci-copia-\d{4}-\d{2}-\d{2}(-[a-z0-9]{1,12})?\.json\.gz$/;

function doGet() {
  return json_({ ok: true, cassetta: VERSIONE, impostata: !!PropertiesService.getScriptProperties().getProperty("segreto") });
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
