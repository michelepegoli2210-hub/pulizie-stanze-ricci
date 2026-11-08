// ============================================================================
//  1.29.0 · LA COPIA DI SICUREZZA DI OGNI SETTIMANA (8/11, Michele: «che l'app non diventi mai a pagamento e soprattutto
//  di non perderla mai»; going with «una copia automatica dei dati ogni settimana»).
//  Il giro ha la chiave per leggere tutto il database: una volta a settimana copia TUTTE le raccolte (anche quelle che
//  nasceranno dopo, e le eventuali sotto-raccolte), comprime il file e lo manda alla «cassetta» (copia-sicurezza.gs), un
//  piccolo programma nel Google Account di Michele che lo mette nel suo Google Drive, cartella «Copie di sicurezza - Le
//  Stanze di Ricci» (tiene le ultime 26). L'indirizzo della cassetta e il «segreto» li salva l'app quando Michele la collega
//  (importazioni/copia-sicurezza); qui si scrive com'è andata (ultima, byte, quante cose).
//  Nel registro di GitHub, che tutti possono leggere, non va nessun dato né l'indirizzo della cassetta: solo
//  «copia di sicurezza: fatta (N cose, X MB)».
//  Dall'app «Fai una copia adesso» (campo subito): la fa il giro dopo, entro 10 minuti (il giro gira dalle 5 alle 23).
// ============================================================================
import { gzipSync } from "node:zlib";

export const OGNI_MS = 7 * 24 * 3600 * 1000;
export const RIPROVA_MS = 3 * 3600 * 1000;
export const PEZZO = 15 * 1024 * 1024;   // caratteri per pezzo (la cassetta di Google riceve fino a circa 50 MB per volta)
export const URL_CASSETTA = /^https:\/\/script\.google\.com\/(?:a\/[^/]+\/)?macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;
const SEGRETO = /^[A-Za-z0-9_-]{24,80}$/;

export function copiaDovuta(c, adesso) {
  if (!c || !c.pronta || !URL_CASSETTA.test(String(c.url || "")) || !SEGRETO.test(String(c.segreto || ""))) return false;
  const ora = adesso.getTime(), ultima = Date.parse(c.ultima || "") || 0, tent = Date.parse(c.tentativo || "") || 0, chiesta = Date.parse(c.subito || "") || 0;
  if (chiesta > Math.max(ultima, tent)) return true;                     // «Fai una copia adesso» dall'app
  if (tent > ultima && ora - tent < RIPROVA_MS) return false;            // l'ultima volta non è andata: riprova tra 3 ore
  return ora - ultima >= OGNI_MS - 20 * 60 * 1000;                       // una settimana (con 20 minuti di margine)
}

// i valori di Firestore che il JSON non sa scrivere: la data (Timestamp), il punto (GeoPoint), il riferimento, i byte
export function semplice(v) {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return v.map(semplice);
  if (typeof v === "number") return Number.isFinite(v) ? v : { __tipo: "numero", v: String(v) };
  if (typeof v !== "object") return v;
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return { __tipo: "byte", v: Buffer.from(v).toString("base64") };
  const nome = v.constructor && v.constructor.name;
  if (typeof v.toDate === "function" && typeof v.seconds === "number") return { __tipo: "data", v: v.toDate().toISOString(), s: v.seconds, ns: v.nanoseconds || 0 };
  if (nome === "GeoPoint" && typeof v.latitude === "number") return { __tipo: "punto", lat: v.latitude, lng: v.longitude };
  if (nome === "DocumentReference" && typeof v.path === "string") return { __tipo: "rif", v: v.path };
  if (typeof v.isEqual === "function" && typeof v.toBase64 === "function") return { __tipo: "byte", v: v.toBase64() };
  const o = {};
  for (const [k, x] of Object.entries(v)) o[k] = semplice(x);
  return o;
}

// tutte le raccolte, con i documenti; le sotto-raccolte (se un giorno ci saranno) col loro percorso «raccolta/doc/sotto»
async function aPacchi(lista, quanti, fn) { for (let i = 0; i < lista.length; i += quanti) await Promise.all(lista.slice(i, i + quanti).map(fn)); }
// 1.31.0: le chiavi non vanno nella copia (la chiave di Instagram: se serve, Michele la rifà in 2 minuti)
const SEGRETI = new Set(["social-chiave"]);
async function leggiRaccolta(ref, raccolte, conti, profondita) {
  const s = await ref.get();
  const docs = {};
  for (const d of s.docs) {
    if (ref.path === "importazioni" && SEGRETI.has(d.id)) continue;   // 1.31.0: le chiavi no
    const x = semplice(d.data());
    if (ref.path === "visti" && /_foto$/.test(d.id) && x && typeof x === "object" && x.img) { x.img = null; x.fotoTolta = true; }   // 1.31.2: le foto a sorpresa no (pesano)
    docs[d.id] = x;
  }
  raccolte[ref.path] = docs; conti[ref.path] = Object.keys(docs).length;
  if (profondita >= 3) return;
  const sotto = [];
  await aPacchi(s.docs, 25, async (d) => { try { if (d.ref && typeof d.ref.listCollections === "function") for (const sc of await d.ref.listCollections()) sotto.push(sc); } catch (e) {} });
  for (const sc of sotto) await leggiRaccolta(sc, raccolte, conti, profondita + 1);
}
export async function leggiTutto(fs) {
  const raccolte = {}, conti = {};
  for (const r of await fs.listCollections()) await leggiRaccolta(r, raccolte, conti, 0);
  return { raccolte, conti };
}

export const mb = (b) => b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0).replace(".", ",")} MB`;
// mai l'indirizzo della cassetta (né altri indirizzi) nei messaggi che finiscono nel registro di GitHub
export const pulito = (e) => String((e && e.message) || e || "").replace(/https?:\/\/\S+/g, "(indirizzo)").slice(0, 120);

export async function faiCopia({ fs, db, adesso, manda, conf, giorno }) {
  const iso = adesso.toISOString();
  try {
    const { raccolte, conti } = await leggiTutto(fs);
    const cose = Object.values(conti).reduce((t, n) => t + n, 0);
    const dati = { tipo: "copia di sicurezza · Le Stanze di Ricci", versione: 1, creata: iso, conti, raccolte };
    const gz = gzipSync(Buffer.from(JSON.stringify(dati), "utf8"), { level: 9 });
    const b64 = gz.toString("base64"), pezzi = [];
    for (let i = 0; i < b64.length; i += PEZZO) pezzi.push(b64.slice(i, i + PEZZO));
    if (pezzi.length > 20) throw new Error(`copia troppo grande (${mb(gz.length)})`);
    const nome = `stanze-ricci-copia-${/^\d{4}-\d{2}-\d{2}$/.test(String(giorno || "")) ? giorno : iso.slice(0, 10)}.json.gz`;
    let link = "", tolte = 0;
    for (let i = 0; i < pezzi.length; i++) {
      const r = await manda(conf.url, { azione: "metti", segreto: conf.segreto, nome, parte: i + 1, di: pezzi.length, dati: pezzi[i] });
      if (!r || !r.ok) throw new Error((r && r.errore) || "la cassetta non ha risposto");
      link = (r && r.link) || link; tolte += Number((r && r.tolte) || 0);
    }
    await db.merge("importazioni", "copia-sicurezza", { ultima: iso, tentativo: iso, esito: "ok", errore: "", file: nome, byte: gz.length, cose, raccolte: Object.keys(conti).length, pezzi: pezzi.length, conti, ...(link && /^https:\/\/drive\.google\.com\//.test(link) ? { link } : {}) });
    return { ok: true, esito: `copia di sicurezza: fatta (${cose} cose, ${mb(gz.length)}${tolte ? `, ${tolte} vecchie nel cestino` : ""})`, cose, byte: gz.length };
  } catch (e) {
    const msg = pulito(e);
    try { await db.merge("importazioni", "copia-sicurezza", { tentativo: iso, esito: "errore", errore: msg }); } catch (x) {}
    return { ok: false, esito: `copia di sicurezza: non riuscita (${msg})` };
  }
}

// la cassetta vera (Google Apps Script): testo semplice, Google risponde con un rimando che si segue
export async function mandaCassetta(url, corpo, ms = 180000) {
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { method: "POST", body: JSON.stringify(corpo), headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", signal: ac.signal });
    const testo = await r.text();
    try { const j = JSON.parse(testo); return j && typeof j === "object" ? j : { ok: false, errore: "risposta strana dalla cassetta" }; }
    catch (e) { return { ok: false, errore: `risposta strana dalla cassetta (${r.status})` }; }
  } catch (e) { return { ok: false, errore: e && e.name === "AbortError" ? "la cassetta non ha risposto in tempo" : "la cassetta non risponde" }; }
  finally { clearTimeout(tm); }
}
