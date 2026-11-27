// ============================================================================
//  1.118.0 (giro 1.44.0) · QUALE FOGLIO DI UN EXCEL FAR VEDERE PER PRIMO
//  Michele, 27/11/2026: «nell'email mi diceva che erano le presenze di questa settimana, mentre invece nell'allegato io ho
//  trovato soltanto le presenze addirittura del 2022». Il file delle presenze ha un foglio per mese dal 2022: l'app ne
//  mostrava i primi 8 e Sofia ne leggeva i primi 6, tutti del 2022. Qui si sceglie il foglio «di adesso»:
//   1) quello che nel NOME ha il periodo in cui cade oggi («NOVEMBRE 2026», «Marzo_2022», «nov 26», «11-2026», «23-27 nov»,
//      «30 nov-4 dic», «settimana 48», «2026»). Se il file è stato salvato aperto su un foglio che comincia entro 10 giorni
//      (le presenze della settimana prossima), vale quello. Se oggi non cade in nessun foglio: quello che comincia entro
//      10 giorni, se no l'ultimo già passato;
//   2) se dai nomi non si capisce niente: il foglio su cui il file era aperto quando è stato salvato;
//   3) se no il primo, come prima.
//  I fogli nascosti non si contano. Lo usano il lavoratore dell'app (xlsx-lettore.js, con importScripts) e quello del giro
//  (sofia-giro/excel-isolato.mjs, con require). Niente dipendenze e niente dati: solo nomi di fogli e giorni.
// ============================================================================
(function (radice) {
  "use strict";
  var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var due = function (n) { return (n < 10 ? "0" : "") + n; };
  var iso = function (a, m, g) { return a + "-" + due(m) + "-" + due(g); };
  var giorniDelMese = function (a, m) { return new Date(Date.UTC(a, m, 0)).getUTCDate(); };
  var vero = function (a, m, g) { return a >= 2000 && a <= 2099 && m >= 1 && m <= 12 && g >= 1 && g <= giorniDelMese(a, m); };
  var piu = function (giorno, n) { var d = new Date(giorno + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  var tra = function (a, b) { return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000); };
  var anno4 = function (s) { var n = Number(s); return s.length === 4 ? n : 2000 + n; };

  // «novembre», «nov», «nov.», «sett» → 11, 11, 11, 9. Devono essere l'inizio del nome di un mese.
  function meseDa(parola) {
    var p = String(parola || "").toLowerCase().replace(/\.$/, "");
    if (p === "sett" || p === "set") return 9;
    if (p.length !== 3 && p.length < 5) return 0;   // tre lettere («nov»), oppure almeno cinque: «otto», «nove», «apri», «dice» sono altre parole
    for (var i = 0; i < 12; i++) if (MESI[i].indexOf(p) === 0) return i + 1;
    return 0;
  }
  // l'anno che manca: quello che mette il periodo più vicino a oggi
  function annoVicino(oggi, m, g) {
    var a0 = Number(String(oggi).slice(0, 4)), meglio = a0, dist = Infinity;
    for (var a = a0 - 1; a <= a0 + 1; a++) {
      var gg = Math.min(g || 15, giorniDelMese(a, m)), d = Math.abs(tra(oggi, iso(a, m, gg)));
      if (d < dist) { dist = d; meglio = a; }
    }
    return meglio;
  }
  // il lunedì della settimana n (come la contano in Europa: la prima è quella col 4 gennaio)
  function lunediDellaSettimana(a, n) {
    var g4 = new Date(Date.UTC(a, 0, 4)), dow = (g4.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(a, 0, 4 - dow + (n - 1) * 7)).toISOString().slice(0, 10);
  }

  // Il periodo scritto nel nome di un foglio: { da, a } (giorni «2026-11-01»), oppure null.
  // settMese: «sett 26» vuol dire settembre 2026 (vero quando gli altri fogli sono mesi), se no la settimana 26.
  function periodoDelNome(nome, oggi, settMese) {
    var t = " " + String(nome || "").toLowerCase().replace(/[_]+/g, " ").replace(/\s+/g, " ") + " ";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(oggi || ""))) return null;
    var m, a, g1, g2, m1, m2;
    var W = "([a-zà-ù]{3,9})\\.?";   // una parola che può essere un mese
    // «settimana 48», «sett. 48», «sett 48 2026»
    m = /\b(settimana|sett\.?|week|wk)\s*(\d{1,2})(?:\s+(\d{4}))?\b/.exec(t);
    if (m && Number(m[2]) >= 1 && Number(m[2]) <= 53 && (m[1].indexOf("settimana") === 0 || m[1] === "week" || m[1] === "wk" || (!settMese && !m[3]))) {
      var aw = m[3] ? Number(m[3]) : Number(oggi.slice(0, 4)), lun = lunediDellaSettimana(aw, Number(m[2]));
      return { da: lun, a: piu(lun, 6) };
    }
    // «30 nov - 4 dic 2026», «dal 30 novembre al 4 dicembre»
    m = new RegExp("\\b(\\d{1,2})\\s*" + W + "\\s*(?:-|–|—|al?|/)\\s*(\\d{1,2})\\s*" + W + "(?:\\s+(\\d{4}|\\d{2}))?\\b").exec(t);
    if (m && (m1 = meseDa(m[2])) && (m2 = meseDa(m[4]))) {
      g1 = Number(m[1]); g2 = Number(m[3]); a = m[5] ? anno4(m[5]) : annoVicino(oggi, m1, g1);
      var a2 = m2 < m1 ? a + 1 : a;
      if (vero(a, m1, g1) && vero(a2, m2, g2)) return { da: iso(a, m1, g1), a: iso(a2, m2, g2) };
    }
    // «23-27 nov», «dal 23 al 27 novembre 2026»
    m = new RegExp("\\b(\\d{1,2})\\s*(?:-|–|—|al?|/)\\s*(\\d{1,2})\\s*" + W + "(?:\\s+(\\d{4}|\\d{2}))?\\b").exec(t);
    if (m && (m1 = meseDa(m[3]))) {
      g1 = Number(m[1]); g2 = Number(m[2]); a = m[4] ? anno4(m[4]) : annoVicino(oggi, m1, g1);
      if (g1 <= g2 && vero(a, m1, g1) && vero(a, m1, g2)) return { da: iso(a, m1, g1), a: iso(a, m1, g2) };
    }
    // «23/11 - 27/11», «23.11-27.11.2026»
    m = /\b(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{4}|\d{2}))?\s*(?:-|–|—|al?)\s*(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{4}|\d{2}))?\b/.exec(t);
    if (m) {
      g1 = Number(m[1]); m1 = Number(m[2]); g2 = Number(m[4]); m2 = Number(m[5]);
      if (m1 >= 1 && m1 <= 12 && m2 >= 1 && m2 <= 12) {
        var af = m[6] ? anno4(m[6]) : m[3] ? anno4(m[3]) : annoVicino(oggi, m2, g2), ai = m[3] ? anno4(m[3]) : (m1 > m2 ? af - 1 : af);
        if (vero(ai, m1, g1) && vero(af, m2, g2) && iso(ai, m1, g1) <= iso(af, m2, g2)) return { da: iso(ai, m1, g1), a: iso(af, m2, g2) };
      }
    }
    // un giorno solo: «27-11-2026», «27/11/26», «27.11», «2026-11-27»
    m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(t);
    if (m && vero(Number(m[1]), Number(m[2]), Number(m[3]))) return { da: iso(Number(m[1]), Number(m[2]), Number(m[3])), a: iso(Number(m[1]), Number(m[2]), Number(m[3])) };
    m = /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\b/.exec(t) || /\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{2})\b/.exec(t);
    if (m && vero(anno4(m[3]), Number(m[2]), Number(m[1]))) return { da: iso(anno4(m[3]), Number(m[2]), Number(m[1])), a: iso(anno4(m[3]), Number(m[2]), Number(m[1])) };
    // «27 novembre 2026», «27 nov»
    m = new RegExp("\\b(\\d{1,2})\\s*" + W + "(?:\\s+(\\d{4}))?\\b").exec(t);
    if (m && (m1 = meseDa(m[2])) && Number(m[1]) <= 31 && (m[3] || !/\b\d{4}\b/.test(t))) {
      g1 = Number(m[1]); a = m[3] ? Number(m[3]) : annoVicino(oggi, m1, g1);
      if (vero(a, m1, g1)) return { da: iso(a, m1, g1), a: iso(a, m1, g1) };
    }
    // un mese: «novembre 2026», «nov 26», «nov-26», «2026 novembre»; senza l'anno: «novembre»
    var re = new RegExp("(?:^|[^a-zà-ù])" + W + "(?=[^a-zà-ù]|$)", "g"), mese = 0, dove = -1, x;
    while ((x = re.exec(t))) { var k = meseDa(x[1]); if (k) { mese = k; dove = x.index; break; } }
    if (mese) {
      var dopo = t.slice(dove), an = /\b(20\d{2})\b/.exec(t), a2c = /^[^0-9]*?[a-zà-ù.]+[\s\-'’]*(\d{2})(?!\d)/.exec(dopo);
      a = an ? Number(an[1]) : a2c && Number(a2c[1]) >= 20 && Number(a2c[1]) <= 99 ? 2000 + Number(a2c[1]) : annoVicino(oggi, mese, 15);
      if (vero(a, mese, 1)) return { da: iso(a, mese, 1), a: iso(a, mese, giorniDelMese(a, mese)) };
    }
    // «11-2026», «11/2026», «2026-11», «2026_11»
    m = /\b(\d{1,2})[\/.\-](20\d{2})\b/.exec(t);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) return { da: iso(Number(m[2]), Number(m[1]), 1), a: iso(Number(m[2]), Number(m[1]), giorniDelMese(Number(m[2]), Number(m[1]))) };
    m = /\b(20\d{2})[\/.\- ](\d{1,2})\b/.exec(t);
    if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { da: iso(Number(m[1]), Number(m[2]), 1), a: iso(Number(m[1]), Number(m[2]), giorniDelMese(Number(m[1]), Number(m[2]))) };
    // solo l'anno: «Presenze 2026»
    m = /\b(20\d{2})\b/.exec(t);
    if (m) return { da: m[1] + "-01-01", a: m[1] + "-12-31" };
    return null;
  }

  // Quale foglio: { i, perche } con perche = "solo" | "adesso" | "prossimo" | "ultimo" | "aperto" | "primo" ("" se non ce ne sono)
  function sceltaFoglio(dati) {
    var nomi = (dati && dati.nomi) || [], nascosti = (dati && dati.nascosti) || [], oggi = String((dati && dati.oggi) || "");
    var attivo = dati && typeof dati.attivo === "number" && dati.attivo >= 0 && dati.attivo < nomi.length && !nascosti[dati.attivo] ? dati.attivo : -1;
    var vis = []; for (var i = 0; i < nomi.length; i++) if (!nascosti[i]) vis.push(i);
    if (!vis.length) return { i: -1, perche: "" };
    if (vis.length === 1) return { i: vis[0], perche: "solo" };
    // «sett 26»: settembre se nel file ci sono almeno due fogli col nome di un altro mese
    var mesiVisti = 0;
    vis.forEach(function (j) { var p = String(nomi[j]).toLowerCase().split(/[^a-zà-ù]+/); for (var q = 0; q < p.length; q++) { var k = meseDa(p[q]); if (k && k !== 9) { mesiVisti++; break; } } });
    var P = {}, conData = [];
    vis.forEach(function (j) { var p = periodoDelNome(nomi[j], oggi, mesiVisti >= 2); if (p) { P[j] = p; conData.push(j); } });
    if (conData.length) {
      var lungo = function (j) { return tra(P[j].da, P[j].a); };
      var dentro = conData.filter(function (j) { return P[j].da <= oggi && oggi <= P[j].a; })
        .sort(function (x, y) { return lungo(x) - lungo(y) || (y === attivo) - (x === attivo) || y - x; });   // il periodo più corto; a parità quello aperto, poi l'ultimo
      var presto = conData.filter(function (j) { return P[j].da > oggi && P[j].da <= piu(oggi, 10); })
        .sort(function (x, y) { return P[x].da < P[y].da ? -1 : P[x].da > P[y].da ? 1 : y - x; });
      if (attivo >= 0 && presto.indexOf(attivo) >= 0) return { i: attivo, perche: "prossimo" };
      if (dentro.length) return { i: dentro[0], perche: "adesso" };
      if (presto.length) return { i: presto[0], perche: "prossimo" };
      var passati = conData.filter(function (j) { return P[j].a < oggi; }).sort(function (x, y) { return P[x].a > P[y].a ? -1 : P[x].a < P[y].a ? 1 : y - x; });
      if (passati.length) return { i: passati[0], perche: "ultimo" };
    }
    if (attivo >= 0) return { i: attivo, perche: "aperto" };
    return { i: vis[0], perche: "primo" };
  }

  // Il foglio scelto e i suoi vicini (prima quello dopo, poi quello prima…), tra i fogli che si vedono: al massimo «quanti»
  function viciniFoglio(i, nascosti, totale, quanti) {
    var vis = []; for (var j = 0; j < totale; j++) if (!(nascosti || [])[j]) vis.push(j);
    var k = vis.indexOf(i), out = [];
    if (k < 0) return vis.slice(0, quanti);
    out.push(vis[k]);
    for (var d = 1; out.length < quanti && (k + d < vis.length || k - d >= 0); d++) {
      if (k + d < vis.length && out.length < quanti) out.push(vis[k + d]);
      if (k - d >= 0 && out.length < quanti) out.push(vis[k - d]);
    }
    return out;
  }

  var FogliExcel = { MESI: MESI, meseDa: meseDa, periodoDelNome: periodoDelNome, sceltaFoglio: sceltaFoglio, viciniFoglio: viciniFoglio };
  if (typeof module !== "undefined" && module.exports) module.exports = FogliExcel;
  if (radice) radice.FogliExcel = FogliExcel;
})(typeof self !== "undefined" ? self : typeof globalThis !== "undefined" ? globalThis : null);
