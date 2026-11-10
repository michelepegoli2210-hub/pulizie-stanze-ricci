// ============================================================================
//  1.75.0 · LA POSTA DELL'ALBERGO PER SOFIA SEGRETARIA (Michele, 10/11: «essendo dell'albergo questa email Sofia deve avere
//  l'accesso h24 … anzi Sofia segretaria deve fare questo»).
//  La «casella» (casella-albergo.gs) sta nell'account Google dell'albergo e SOLO LEGGE (permesso Gmail «sola lettura»).
//  A ogni giro (ogni 10 minuti) le mail nuove della scheda «Principale» entrano nella posta di Sofia come messaggi della
//  chat «Email albergo»: Sofia segretaria le legge come le chat (nomi degli ospiti in codice, telefoni ed email mai all'IA)
//  e scrive in Segreteria cosa è arrivato e cosa c'è da fare. Non manda e non cancella niente: le risposte le manda Michele.
//  Indirizzo e segreto li salva l'app quando Michele la collega (importazioni/posta-albergo, solo i proprietari li leggono);
//  qui si scrive com'è andata (ultimoTs, ultimoGiro, quante, errore). Nel registro di GitHub, che tutti possono leggere,
//  niente indirizzi né testi: solo «posta albergo: N mail» o l'errore generico.
// ============================================================================
export const URL_CASELLA = /^https:\/\/script\.google\.com\/(?:a\/[^/]+\/)?macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;
const SEGRETO = /^[A-Za-z0-9_-]{24,80}$/;
export const CHAT_EMAIL = "Email albergo";
const ID = /^[A-Za-z0-9_-]{4,64}$/;
const MAX_TESTO = 1800, PRIMA_VOLTA_MS = 24 * 3600 * 1000;

export const casellaPronta = (c) => !!(c && c.pronta && URL_CASELLA.test(String(c.url || "")) && SEGRETO.test(String(c.segreto || "")));

async function chiedi(url, corpo, ms, fetchFn) {
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetchFn(url, { method: "POST", body: JSON.stringify(corpo), headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", signal: ac.signal });
    const testo = await r.text();
    try { const j = JSON.parse(testo); return j && typeof j === "object" ? j : { ok: false, errore: "risposta strana dalla casella" }; }
    catch (e) { return { ok: false, errore: `risposta strana dalla casella (${r.status})` }; }
  } catch (e) { return { ok: false, errore: e && e.name === "AbortError" ? "la casella non ha risposto in tempo" : "la casella non risponde" }; }
  finally { clearTimeout(tm); }
}

// data e ora di Roma di un istante (come il ponte: data «AAAA-MM-GG», ora «HH:MM»)
export function dataOraRoma(ts) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(ts)).map(x => [x.type, x.value]));
  return { data: `${p.year}-${p.month}-${p.day}`, ora: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}

// una mail della casella → un messaggio della posta di Sofia
export function mailInPosta(m) {
  const ts = Number(m && m.ts) || 0;
  if (!m || !ID.test(String(m.id || "")) || !ts) return null;
  const { data, ora } = dataOraRoma(ts);
  const chi = String(m.chi || m.dominio || "?").replace(/[<>]/g, "").slice(0, 80);
  const oggetto = String(m.oggetto || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const all = Number(m.allegati) || 0;
  const corpo = String(m.testo || "").trim();
  const testo = `✉️ ${oggetto || "(senza oggetto)"}${all ? ` · 📎 ${all} ${all === 1 ? "allegato" : "allegati"}` : ""}${corpo ? "\n" + corpo : ""}`.slice(0, MAX_TESTO + 260);
  return { id: "email_" + String(m.id), dati: { chat: CHAT_EMAIL, gruppo: true, chi, mio: false, ts, data, ora, tipo: "testo", testo, da: "email", dominio: String(m.dominio || "").slice(0, 80) } };
}

// A ogni giro: le mail nuove della casella entrano nella posta di Sofia (prima della lettura delle chat)
export async function portaPostaAlbergo({ db, adesso = new Date(), fetchFn = fetch, ms = 60000 }) {
  let c = null;
  try { c = await db.doc("importazioni", "posta-albergo"); } catch (e) { return null; }
  if (!casellaPronta(c)) return null;
  const ora = adesso.getTime();
  const da = Number(c.ultimoTs) > 0 ? Number(c.ultimoTs) : ora - PRIMA_VOLTA_MS;
  const j = await chiedi(c.url, { azione: "nuove", segreto: c.segreto, da }, ms, fetchFn);
  if (!j || !j.ok) {
    const errore = String((j && j.errore) || "la casella non risponde").slice(0, 160);
    try { await db.merge("importazioni", "posta-albergo", { ultimoGiro: adesso.toISOString(), errore, erroreQuando: adesso.toISOString() }); } catch (e) {}
    return { esito: "posta albergo: la casella non ha risposto", n: 0, errore: true };
  }
  const mail = (Array.isArray(j.mail) ? j.mail : []).filter(m => m && Number(m.ts) > da);
  const ops = mail.map(mailInPosta).filter(Boolean).map(x => ({ coll: "posta", id: x.id, dati: x.dati, merge: true }));
  if (ops.length) await db.scrivi(ops);
  const ultimo = Math.max(da, ...mail.map(m => Number(m.ts) || 0));
  await db.merge("importazioni", "posta-albergo", { ultimoTs: ultimo, ultimoGiro: adesso.toISOString(), errore: "", quante: (Number(c.quante) || 0) + ops.length, ...(ops.length ? { ultimaMail: adesso.toISOString() } : {}) });
  return { esito: ops.length ? `posta albergo: ${ops.length} ${ops.length === 1 ? "mail nuova" : "mail nuove"}` : null, n: ops.length };
}
