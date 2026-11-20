// ============================================================================
//  giro 1.41.0 (app 1.108.0) · GLI ALLEGATI DELLE EMAIL: LI LEGGE SOFIA
//  Michele, 20/11: «essenziale è che io possa leggere anche tutti gli allegati dall'applicazione… e l'applicazione debba
//  leggere anche gli allegati… perché negli allegati c'è proprio il succo del discorso». Alla domanda su cosa dare a Gemini
//  (che è di Google) ha scelto «Tutto com'è»: Gemini riceve gli allegati interi, anche scansioni e foto, coi nomi dentro.
//  A ogni giro, dopo la posta nuova: per le email arrivate con allegati (la casella 3 dà l'elenco, posta-giro.mjs li segna
//  «da-leggere») il giro chiede alla casella ogni allegato e lo fa leggere a Gemini:
//   - PDF e foto (jpg, png, webp, heic): interi, come sono (Gemini legge anche le scansioni);
//   - Excel (xlsx, xls, ods): le tabelle in righe di testo; Word (docx, odt): il testo; testo, csv, html, xml: il testo.
//  Per ognuno Gemini scrive un riassunto (2-3 frasi: cos'è e cosa dice di importante) e il testo (al massimo 6000 caratteri):
//  vanno nell'email (posta/<id>.allegatiLetti), li vede Michele nell'app e li legge Sofia insieme all'email (logica.js,
//  allegatiPerLettura). Al massimo 3 email e 5 allegati per email a giro, 10 MB l'uno; tre tentativi, poi basta.
//  Nel registro pubblico di GitHub solo quanti: mai nomi di file, mai cosa c'è dentro.
// ============================================================================
import { inflateRawSync } from "node:zlib";
import { chiediGemini } from "./lettura-giro.mjs";
import { fogliExcelIsolati } from "./excel-isolato.mjs";   // l'Excel di fuori si apre in un lavoratore a parte
import { CHAT_EMAIL, casellaPronta, chiediCasella, allegatoVero } from "./posta-giro.mjs";

export const MAX_MAIL = 3, MAX_FILE_MAIL = 5, MAX_KB = 10 * 1024, MAX_TENTATIVI = 3, MAX_TESTO = 6000;
const GIORNO = 24 * 3600 * 1000;
// gli ordini dei modelli: prima quello svelto e bravo coi documenti, poi il più bravo, poi l'economico
const ORDINE = ["sveglia", "argon", "svelta"];

export function tipoAllegato(f) {
  const t = String((f && f.t) || "").toLowerCase(), n = String((f && f.n) || "").toLowerCase(), ext = (n.match(/\.([a-z0-9]{1,5})$/) || [])[1] || "";
  if (t === "application/pdf" || ext === "pdf") return "pdf";
  if (/^image\/(jpeg|jpg|pjpeg|png|webp|heic|heif)$/.test(t) || /^(jpe?g|png|webp|heic|heif)$/.test(ext)) return "foto";
  if (/csv/.test(t) || ext === "csv") return "testo";
  if (/spreadsheetml|ms-excel|opendocument\.spreadsheet/.test(t) || /^(xlsx|xlsm|xls|ods)$/.test(ext)) return "excel";
  if (/wordprocessingml|opendocument\.text/.test(t) || /^(docx|odt)$/.test(ext)) return "word";
  if (/^text\//.test(t) || /\/(xml|json)$/.test(t) || /^(txt|html?|xml|json|ics)$/.test(ext)) return "testo";
  return "";
}
export function mimeFoto(f) {
  const t = String((f && f.t) || "").toLowerCase(), n = String((f && f.n) || "").toLowerCase();
  if (/^image\/(jpeg|png|webp|heic|heif)$/.test(t)) return t;
  if (t === "image/jpg" || t === "image/pjpeg" || /\.jpe?g$/.test(n)) return "image/jpeg";
  const m = n.match(/\.(png|webp|heic|heif)$/); return m ? "image/" + m[1] : "image/jpeg";
}

// ---- un file dentro uno zip (docx, odt): cerco nel «catalogo» in fondo al file; deflate col zlib di Node ------------------
export function fileNelloZip(buf, nome) {
  const u = Buffer.from(buf);
  let e = u.length - 22; while (e >= 0 && u.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) return null;
  const n = u.readUInt16LE(e + 10); let p = u.readUInt32LE(e + 16);
  for (let i = 0; i < n && p + 46 <= u.length; i++) {
    if (u.readUInt32LE(p) !== 0x02014b50) break;
    const metodo = u.readUInt16LE(p + 10), csize = u.readUInt32LE(p + 20), nl = u.readUInt16LE(p + 28), el = u.readUInt16LE(p + 30), cl = u.readUInt16LE(p + 32), off = u.readUInt32LE(p + 42);
    if (u.slice(p + 46, p + 46 + nl).toString("utf8") === nome) {
      if (off + 30 > u.length) return null;
      const ini = off + 30 + u.readUInt16LE(off + 26) + u.readUInt16LE(off + 28), dati = u.slice(ini, ini + csize);
      return metodo === 0 ? dati : metodo === 8 ? inflateRawSync(dati) : null;
    }
    p += 46 + nl + el + cl;
  }
  return null;
}
const entita = (s) => String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, "&");
export function testoWord(buf) {
  const docx = fileNelloZip(buf, "word/document.xml");
  const x = docx || fileNelloZip(buf, "content.xml");   // odt
  if (!x) return "";
  let s = x.toString("utf8").replace(/>\s*\r?\n\s*</g, "><");   // gli a capo dell'XML non sono a capo del testo
  s = docx ? s.replace(/<w:tab\/>/g, "\t").replace(/<w:br[^>]*\/>/g, "\n").replace(/<\/w:p>/g, "\n")
    : s.replace(/<text:tab\/>/g, "\t").replace(/<text:line-break\/>/g, "\n").replace(/<\/text:(p|h)>/g, "\n");
  return entita(s.replace(/<[^>]+>/g, "")).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
export async function testoExcel(buf) {
  const fogli = await fogliExcelIsolati(buf);   // excel-isolato.mjs: la libreria degli Excel non tocca niente del giro
  let s = "";
  for (const { nome, csv: tutto } of fogli) {
    const csv = String(tutto || "").split("\n").filter(r => r.replace(/,/g, "").trim()).join("\n");
    if (csv) s += `--- Foglio «${nome}» ---\n${csv}\n`;
    if (s.length > 20000) break;
  }
  return s.slice(0, 20000).trim();
}
export function testoSemplice(buf, f) {
  let s = Buffer.from(buf).toString("utf8");
  if (/html|xml/.test(String((f && f.t) || "")) || /\.(html?|xml)$/i.test(String((f && f.n) || ""))) s = entita(s.replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>|<\/li>/gi, "\n").replace(/<[^>]+>/g, " "));
  return s.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, 20000);
}

// la risposta di Gemini: JSON {riassunto, testo}; se arriva rotto, quel che si salva
export function rispostaAllegato(grezzo) {
  const t = String(grezzo || "").replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  let j = null; try { j = JSON.parse(t); } catch (e) { const a = t.indexOf("{"), b = t.lastIndexOf("}"); if (a >= 0 && b > a) { try { j = JSON.parse(t.slice(a, b + 1)); } catch (e2) {} } }
  if (j && typeof j === "object") return { riassunto: String(j.riassunto || "").replace(/\s+/g, " ").trim().slice(0, 600), testo: String(j.testo || "").trim().slice(0, MAX_TESTO) };
  const m = t.match(/"riassunto"\s*:\s*"((?:[^"\\]|\\.)*)/);
  return { riassunto: (m ? m[1].replace(/\\n/g, " ").replace(/\\"/g, '"') : t).replace(/\s+/g, " ").trim().slice(0, 600), testo: "" };
}

// un allegato → Gemini (interi PDF e foto; il testo per Excel, Word e testo)
export async function leggiUnAllegato({ gemini, f, tipo, mime, dati, mail }) {
  const sistema = "Sei la segretaria delle Stanze di Ricci, un piccolo albergo a Lesina (Puglia). Leggi tutto l'allegato di un'email arrivata all'albergo e dì a Michele, il titolare, cosa c'è dentro. Scrivi in italiano semplice, senza parole tecniche.";
  const chiedi = `L'email è di ${String((mail && mail.chi) || "qualcuno").slice(0, 80)}, oggetto «${String((mail && mail.oggetto) || "").slice(0, 160)}». L'allegato si chiama «${f.n}».\n` +
    `Rispondi SOLO con JSON: {"riassunto": "1-3 frasi: che cos'è e cosa dice di importante (date, nomi, camere, cifre, scadenze, cosa chiedono di fare)", "testo": "quello che c'è scritto, completo ma al massimo ${MAX_TESTO} caratteri; le tabelle una riga per riga"}`;
  let dom;
  if (tipo === "pdf" || tipo === "foto") dom = { sistema, testo: chiedi, immagine: [{ dati, mime: tipo === "pdf" ? "application/pdf" : mime }], secondi: 120, maxToken: 8000 };
  else {
    const buf = Buffer.from(dati, "base64");
    const dentro = tipo === "excel" ? await testoExcel(buf) : tipo === "word" ? testoWord(buf) : testoSemplice(buf, f);
    if (!dentro) return { riassunto: "L'allegato è vuoto (o non riesco a leggerne il testo).", testo: "" };
    dom = { sistema, testo: `${chiedi}\n\nIL CONTENUTO DELL'ALLEGATO:\n${dentro}`, secondi: 90, maxToken: 8000 };
  }
  const { r } = await chiediGemini(gemini, dom, ORDINE);
  const x = rispostaAllegato(r && r.grezzo);
  if (!x.riassunto && !x.testo) throw new Error("Gemini non ha detto niente sull'allegato");
  return x;
}

// A ogni giro, dopo la posta nuova
export async function leggiAllegati({ db, gemini, adesso = new Date(), fetchFn = fetch, ms = 90000 }) {
  if (!gemini) return null;
  let c = null; try { c = await db.doc("importazioni", "posta-albergo"); } catch (e) { return null; }
  if (!casellaPronta(c)) return null;
  const posta = await db.postaDa(adesso.getTime() - 3 * GIORNO);
  const mail = Object.entries(posta || {}).map(([id, p]) => ({ ...(p || {}), id: String((p && p.id) || id) }))
    .filter(p => p.chat === CHAT_EMAIL && p.allegatiStato === "da-leggere" && Array.isArray(p.files) && p.files.length && /^email_[A-Za-z0-9_-]{4,64}$/.test(p.id))
    .sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0)).slice(0, MAX_MAIL);
  if (!mail.length) return null;
  let letti = 0, saltati = 0, errori = 0;
  for (const p of mail) {
    const gid = p.id.slice(6), prima = new Map((Array.isArray(p.allegatiLetti) ? p.allegatiLetti : []).filter(a => a && a.letto).map(a => [String(a.p), a]));
    const lista = []; let sbagli = 0;
    const oggetto = String(p.testo || "").split("\n")[0].replace(/^✉️\s*/, "").replace(/\s·\s📎.*$/, "");
    for (const f of p.files.filter(allegatoVero).slice(0, MAX_FILE_MAIL)) {   // 1.41.1: i loghi della firma no; 1.42.0: né le immagini piccole dentro il testo
      if (prima.has(String(f.p))) { lista.push(prima.get(String(f.p))); continue; }
      const base = { p: String(f.p), n: String(f.n || "").slice(0, 120), t: String(f.t || "").slice(0, 80), kb: Number(f.kb) || 0 };
      const tipo = tipoAllegato(f);
      if (!tipo) { lista.push({ ...base, letto: false, perche: "questo tipo di file non lo so leggere: aprilo tu" }); saltati++; continue; }
      if ((Number(f.kb) || 0) > MAX_KB) { lista.push({ ...base, letto: false, perche: "è troppo grande perché lo legga io (più di 10 MB): aprilo tu, toccandolo" }); saltati++; continue; }
      const j = await chiediCasella(c.url, { azione: "allegato", segreto: c.segreto, id: gid, parte: String(f.p) }, ms, fetchFn);
      if (!j || !j.ok) {
        if (/^Azione sconosciuta/i.test(String((j && j.errore) || ""))) {   // la casella è ancora la 2: non sa dare gli allegati
          try { await db.merge("importazioni", "posta-albergo", { casellaDaAggiornare: adesso.toISOString() }); } catch (e) {}
          return { esito: "allegati: la casella è da aggiornare", letti, vecchia: true };
        }
        if (j && j.grande) { lista.push({ ...base, letto: false, perche: "è troppo grande perché lo legga io (più di 10 MB): aprilo tu, toccandolo" }); saltati++; continue; }
        sbagli++; continue;
      }
      try {
        const x = await leggiUnAllegato({ gemini, f: base, tipo, mime: tipo === "foto" ? mimeFoto({ t: j.tipo || f.t, n: f.n }) : "", dati: String(j.dati || ""), mail: { chi: p.chi, oggetto } });
        lista.push({ ...base, letto: true, riassunto: x.riassunto, testo: x.testo, quando: adesso.toISOString() }); letti++;
      } catch (e) { console.warn("allegato:", e && e.message); sbagli++; }
    }
    const tentativi = (Number(p.allegatiTentativi) || 0) + (sbagli ? 1 : 0);
    const stato = sbagli && tentativi < MAX_TENTATIVI ? "da-leggere" : "letti";
    errori += sbagli;
    await db.merge("posta", p.id, { allegatiLetti: lista, allegatiStato: stato, allegatiTentativi: tentativi, allegatiQuando: adesso.toISOString() });
  }
  const pezzi = [letti ? `${letti} ${letti === 1 ? "letto" : "letti"}` : "", saltati ? `${saltati} non ${saltati === 1 ? "leggibile" : "leggibili"}` : "", errori ? `${errori} da riprovare` : ""].filter(Boolean);
  return { esito: pezzi.length ? "allegati: " + pezzi.join(", ") : null, letti };
}
