// ============================================================================
//  SOFIA LEGGE LE CHAT ANCHE AD APP CHIUSA (1.18.0) — il pezzo del giro sempre acceso che legge la posta del ponte
//  Michele, 31/10: "far leggere a Sofia le chat anche ad app chiusa, con un avviso «ho letto, controlla», e insegnarle
//  le assenze delle signore, i guasti, i detersivi". Prima la posta del ponte la leggeva solo il telefono «lettore» con
//  l'app aperta. Adesso, ogni 10 minuti, se sono arrivati messaggi nuovi e da 5 minuti nessuno scrive più:
//   1. si prende la posta non letta (il ponte la mette in «posta», i vocali e le foto in «posta_media»);
//   2. i vocali li trascrive Gemini (6 per volta, come l'app; la trascrizione resta nel messaggio, non si rifà);
//   3. si fa la STESSA richiesta dell'app (lettura.js): nomi degli ospiti in codice, telefoni ed email mai a Gemini;
//   4. il risultato, coi nomi veri, va in importazioni/lettura-sofia (da_controllare): lo apre qualunque telefono;
//   5. la posta si segna letta e al titolare arriva l'avviso sul telefono «Ho letto 6 messaggi: 2 cambi… Tocca per controllare».
//  Non salva MAI niente nel prospetto: quello lo fa Michele col suo «Salva». Se una lettura aspetta il controllo, la posta
//  nuova aspetta (come nell'app); dopo un giorno senza controllo si rilegge tutto insieme. Se il telefono sta leggendo
//  (in_lettura da meno di 15 minuti) il giro non tocca niente.
//  1.18.1: l'avviso «ho letto» arriva anche per le letture fatte dal telefono o dal PC con l'app aperta (prima l'avviso lo
//  mandava solo il giro per le sue): se una lettura aspetta il controllo da almeno 2 minuti, nessuno l'ha aperta e non è
//  ancora stata avvisata, parte l'avviso (una volta sola, segno «avvisata»). Gli avvisi delle letture partono solo dalle 7
//  alle 22:30: una lettura fatta di notte si avvisa al primo giro dopo le 7.
// ============================================================================
import * as L from "../logica.js";
import * as LET from "../lettura.js";
import * as IA from "../ia.js";
import { aliasPerCamera, completaRiga } from "../dettatura.js";
import { TIPI_OSPITE } from "../regole.js";

export const QUIETE_MS = 5 * 60 * 1000, LOCK_MS = 15 * 60 * 1000, SCADE_MS = 24 * 3600 * 1000, MARGINE_MS = 60 * 60 * 1000;
const MAX_VOCALI = 60, MAX_FOTO = 4;
// 1.18.1: l'avviso di una lettura fatta da un telefono parte dopo 2 minuti (se nel frattempo l'ha aperta, niente avviso);
// gli avvisi delle letture solo dalle 7 alle 22:30 (minuti dell'ora di Roma; senza ora, sempre)
export const ATTESA_AVVISO_MS = 2 * 60 * 1000, ORE_AVVISO = [7 * 60, 22 * 60 + 30];
export const oraDiAvvisi = (minuti) => minuti === undefined || minuti === null || (minuti >= ORE_AVVISO[0] && minuti < ORE_AVVISO[1]);

// il nome di Sofia, come lo mostra l'app (tutto maiuscolo → normale)
export function nomeGovDa(gov) {
  const n = (gov && String(gov.nome || "").trim()) || "";
  if (n && n === n.toUpperCase() && n !== n.toLowerCase()) return n.split(/(\s+)/).map(w => w.charAt(0) + w.slice(1).toLowerCase()).join("");
  return n || "Consuela";
}
export function testoRiassunto(r) {
  const p = (n, uno, tanti) => n ? `${n} ${n === 1 ? uno : tanti}` : "";
  return [p(r.cambi, "cambio nel prospetto", "cambi nel prospetto"), p(r.indicazioni, "indicazione per le signore", "indicazioni per le signore"), p(r.assenze, "assenza", "assenze"), p(r.guasti, "guasto", "guasti"), p(r.spesa, "cosa da comprare", "cose da comprare"), p(r.note, "cosa da sapere", "cose da sapere")].filter(Boolean).join(" · ");
}
// 1.18.1: il testo dell'avviso «ho letto» (lo stesso per le letture del giro e per quelle del telefono)
export function avvisoLettura(x, nomeGov) {
  const n = Number(x && x.n) || 0, cosa = testoRiassunto((x && x.riassunto) || {});
  const chats = [...new Set((Array.isArray(x && x.fonte && x.fonte.chats) ? x.fonte.chats : []).map(c => String(c).replace(/^chat con /, "")).filter(Boolean))].slice(0, 3).join(", ");
  return { titolo: `${nomeGov || "Sofia"} · ho letto WhatsApp`, testo: `Ho letto ${n === 1 ? "un messaggio" : n ? n + " messaggi" : "i messaggi"}${chats ? ` (${chats})` : ""}${cosa ? `: ${cosa}` : ""}. Tocca per controllare e salvare.` };
}
const dIso = (x) => /^\d{4}-\d{2}-\d{2}$/.test(String(x || "").trim()) ? String(x).trim() : "";
function cameraDa(x, ctx) {
  const t = String(x || "").trim(); if (!t) return null;
  const n = t.toLowerCase();
  const c = ctx.camere.find(c => c.id === t || c.id.toLowerCase() === n || String(c.nome).toLowerCase() === n);
  if (c) return c.id;
  for (const [id, lista] of Object.entries(ctx.alias || {})) if (lista.some(a => a === n)) return ctx.camere.some(c => c.id === id) ? id : null;
  return null;
}
// quante cose cambiano davvero (stesso confronto dell'app: completaRiga) — serve solo per il testo dell'avviso
export function riassuntoGiro(j, ctx) {
  const sog = ctx.soggiorni || [], oggi = ctx.oggi;
  let cambi = 0;
  for (const x of (Array.isArray(j.soggiorni) ? j.soggiorni : []).slice(0, 80)) {
    const camera = cameraDa(x && x.camera, ctx), inizio = dIso(x && x.arrivo), fine = dIso(x && x.partenza);
    if (!camera || !inizio || !fine || fine <= inizio) continue;
    const tipo = TIPI_OSPITE[x.tipo] ? x.tipo : null;
    const r = { camera, testo: "", azione: "nuovo", nome: String(x.nome || "?").slice(0, 48), persone: Math.max(1, Math.min(12, Math.round(Number(x.persone) || 0))) || null, tipo, inizio, fine, nota: String(x.nota || "").slice(0, 160), notaPrivata: "", telefono: "", dubbio: false, motivi: [], assunti: [], scelto: true, base: L.lunediDi(inizio), inizioDetto: true, fineDetta: true, tipoDetto: !!tipo, durata: null, comeScorsa: false, libera: false, haParoleParte: false, haParoleProlunga: false, daSofia: true };
    try { completaRiga(r, { oggi, soggiorni: sog, nomeCamera: (id) => (ctx.camere.find(c => c.id === id) || { nome: id }).nome }); } catch (e) {}
    if (r.azione !== "niente") cambi++;
  }
  for (const x of (Array.isArray(j.togli) ? j.togli : []).slice(0, 30)) {
    const camera = cameraDa(x && x.camera, ctx), nome = LET.nucleoNome(String((x && x.nome) || "")).toLowerCase();
    if (camera && nome && sog.some(s => s.camera === camera && LET.nucleoNome(s.nome).toLowerCase() === nome && s.fine >= L.aggiungiGiorni(oggi, -3))) cambi++;
  }
  const n = (k) => (Array.isArray(j[k]) ? j[k] : []).filter(Boolean).length;
  return { cambi, indicazioni: n("indicazioni"), assenze: n("assenze"), guasti: n("guasti"), spesa: n("spesa"), note: n("note") };
}
// Gemini: prima Argon, poi il modello sveglio, poi lo svelto (come l'app)
export async function chiediGemini(gemini, dom) {
  if (typeof gemini.chiedi === "function") return gemini.chiedi(dom);   // le prove
  let errore = null;
  for (const qualita of ["argon", "sveglia", "svelta"]) {
    try {
      gemini.modelli = gemini.modelli || {};
      const conf = { fornitore: "gemini", chiave: gemini.chiave, qualita, modello: gemini.modelli[qualita] || "" };
      if (!conf.modello) { const t = await IA.trovaModello(conf); conf.modello = t.modello; gemini.modelli[qualita] = t.modello; }
      const r = await IA.chiedi({ ...dom, conf });
      return { r, ripiego: qualita !== "argon" };
    } catch (e) { errore = e; console.warn("gemini/" + qualita + ":", e && e.message); }
  }
  throw errore || new Error("nessun modello risponde");
}
// il contesto della lettura, dal database (le stesse cose che l'app prende dalla sua memoria)
export async function ctxDalDatabase(db, { oggi, camere, signore }) {
  const [sog, cl, gov, tac] = await Promise.all([db.soggiorniDa(L.aggiungiGiorni(oggi, -14)), db.tutti("clienti"), db.doc("impostazioni", "governante"), db.doc("importazioni", "taccuino-sofia")]);
  const soggiorni = Object.values(sog || {}).filter(s => s && s.camera && s.inizio && s.fine).sort((a, b) => (a.inizio < b.inizio ? -1 : 1));
  const clienti = {}; for (const [k, v] of Object.entries(cl || {})) { const { id, ...resto } = v || {}; clienti[k] = resto; }
  const ctx = { oggi, camere, soggiorni, clienti, signore, nomeGov: nomeGovDa(gov), nomeMio: "Michele", alias: aliasPerCamera(), tipiOspite: TIPI_OSPITE };
  ctx.taccuino = LET.taccuinoPerIA((tac && Array.isArray(tac.voci)) ? tac.voci : [], ctx);
  return ctx;
}

// ---- la lettura --------------------------------------------------------------------------------------------------------
// ritorna { esito, ts (fin dove ha guardato la posta), riassunto?, n?, avvisa?: {titolo, testo}, avvisataLid?, credito? }
// minuti: l'ora di Roma in minuti (1.18.1: gli avvisi delle letture solo dalle 7 alle 22:30)
export async function leggiChat({ db, gemini, adesso = new Date(), a = {}, letturaTs = 0, oggi, prendiBase, minuti }) {
  if (a.giroLettura === false) return { esito: "spenta", ts: letturaTs };
  if (!gemini || (!gemini.chiave && typeof gemini.chiedi !== "function")) return { esito: "senza chiave", ts: letturaTs };
  const ora = adesso.getTime(), t0 = Date.now(), finito = () => new Date(ora + (Date.now() - t0)).toISOString();
  const lett = await db.doc("importazioni", "lettura-sofia");
  let vecchie = [];
  if (lett && lett.stato === "da_controllare") {
    const eta = ora - Date.parse(lett.quando || 0);
    if (eta < SCADE_MS) {
      // 1.18.1: se non l'ha ancora aperta nessuno e l'avviso non è partito (lettura del telefono/PC, o fatta di notte), lo mando io
      if (lett.lid && !lett.avvisata && !lett.vista && eta >= ATTESA_AVVISO_MS && oraDiAvvisi(minuti)) {
        const gov = await db.doc("impostazioni", "governante");
        return { esito: "aspetta il tuo controllo", ts: letturaTs, avvisa: avvisoLettura(lett, nomeGovDa(gov)), avvisataLid: lett.lid };
      }
      return { esito: "aspetta il tuo controllo", ts: letturaTs };
    }
    vecchie = Array.isArray(lett.postaIds) ? lett.postaIds : [];      // ferma da più di un giorno: la rileggo insieme alla nuova
  }
  if (lett && lett.stato === "in_lettura" && ora - Date.parse(lett.quando || 0) < LOCK_MS) return { esito: "la sta leggendo il telefono", ts: letturaTs };
  const da = letturaTs ? letturaTs - MARGINE_MS : ora - SCADE_MS;
  const nuove = Object.values((await db.postaDa(da)) || {}).filter(p => p && p.id && !p.letto && (p.tipo === "testo" || p.tipo === "audio" || p.tipo === "foto"));
  if (!nuove.length && !vecchie.length) return { esito: "niente di nuovo", ts: letturaTs };
  if (nuove.some(p => ora - (Number(p.ts) || 0) < QUIETE_MS)) return { esito: "aspetto che finiscano di scrivere", ts: letturaTs };
  const ultimoTs = Math.max(letturaTs || 0, ...nuove.map(p => Number(p.ts) || 0));
  const tutte = [...nuove];
  for (const id of vecchie) if (!tutte.some(p => p.id === id)) { const p = await db.doc("posta", id); if (p) tutte.push(p); }
  if (!tutte.length) return { esito: "niente di nuovo", ts: ultimoTs };
  const ids = tutte.map(p => p.id), id = "giro_" + ora.toString(36);
  await db.salva("importazioni", "lettura-sofia", { lid: id, stato: "in_lettura", da: "giro", quando: adesso.toISOString(), postaIds: ids });
  try {
    const base = await prendiBase();      // camere e signore (si leggono solo quando c'è davvero da leggere)
    // le chat: col nome davanti se sono più di una (come l'app)
    const chats = new Map();
    for (const p of tutte) { const nome = p.chat || "Albergo"; if (!chats.has(nome)) chats.set(nome, p.gruppo !== false); }
    const piu = chats.size > 1;
    const msgs = tutte.map(p => { const nome = p.chat || "Albergo"; return { id: p.id, data: p.data || oggi, ora: p.ora || "", chi: p.chi || "", testo: p.testo || "", tipo: p.tipo, media: !!p.media, didascalia: p.didascalia || "", trascrizione: p.trascrizione || "", chat: piu ? (chats.get(nome) ? nome : "chat con " + nome) : "" }; })
      .sort((x, y) => ((x.data || "") + (x.ora || "")).localeCompare((y.data || "") + (y.ora || "")));
    // i vocali: quelli già trascritti si usano, gli altri si trascrivono (6 per volta)
    const daTrascrivere = msgs.filter(m => m.tipo === "audio" && m.media && !m.trascrizione).slice(-MAX_VOCALI);
    for (const m of msgs) if (m.tipo === "audio" && m.trascrizione) m.testo = `🎤 (vocale) ${m.trascrizione}`;
    const nomiCamere = base.camere.map(c => String(c.nome).replace(" · ", " ")).join(", ");
    for (let i = 0; i < daTrascrivere.length; i += 6) {
      const lotto = daTrascrivere.slice(i, i + 6), parti = [];
      for (const m of lotto) { const x = await db.doc("posta_media", m.id); if (x && x.dati && x.dati.length < 8e6) parti.push({ m, mime: x.mime || "audio/ogg", dati: x.dati }); }
      if (!parti.length) continue;
      try {
        const { r } = await chiediGemini(gemini, { sistema: LET.istruzioniTrascrizione(nomiCamere, parti.length), storia: [], testo: LET.testoTrascrizione(parti.length), immagine: parti.map(p => ({ mime: p.mime, dati: p.dati })), secondi: 120, maxToken: 8000 });
        const j = LET.jsonDaRisposta(r.grezzo), lista = j && Array.isArray(j.vocali) ? j.vocali : [];
        for (const [k, p] of parti.entries()) {
          const t = String(lista[k] || "").trim();
          p.m.testo = t ? `🎤 (vocale) ${t}` : "🎤 (un vocale che non ho capito)";
          if (t) { p.m.trascrizione = t; try { await db.merge("posta", p.m.id, { trascrizione: t.slice(0, 7000) }); } catch (e) {} }
        }
      } catch (e) { console.warn("trascrizione:", e && e.message); for (const p of parti) p.m.testo = "🎤 (un vocale che non sono riuscita ad ascoltare)"; if (/credito|402|prepay/i.test(String(e && e.message))) throw e; }
    }
    // le foto: le ultime 4 le guarda insieme ai messaggi
    const did = (m) => (m.didascalia ? " " + m.didascalia : "");
    const immagini = [];
    for (const m of msgs.filter(m => m.tipo === "foto" && m.media).slice(-MAX_FOTO)) { const x = await db.doc("posta_media", m.id); if (x && x.dati) { immagini.push({ mime: x.mime || "image/jpeg", dati: x.dati }); m.testo = `📷 (foto n. ${immagini.length}: la vedi tra le immagini)${did(m)}`; } }
    for (const m of msgs) if (!m.testo) m.testo = m.tipo === "audio" ? "🎤 (un vocale che non ho ascoltato)" : m.tipo === "foto" ? "📷 (una foto)" + did(m) : "";
    const scelti = msgs.filter(m => m.testo);
    if (!scelti.length) {
      for (const pid of ids) { try { await db.merge("posta", pid, { letto: true }); } catch (e) {} }
      await db.salva("importazioni", "lettura-sofia", { lid: id, stato: "vuota", da: "giro", quando: adesso.toISOString(), postaIds: ids, n: 0 });
      return { esito: "niente da leggere", ts: ultimoTs };
    }
    // chi fa il prospetto: «Papà» (il nome che il ponte dà alla sua chat)
    const papa = scelti.some(m => m.chi === "Papà") ? "Papà" : "";
    const ctx = await ctxDalDatabase(db, { ...base, oggi });
    ctx.persone = [...new Set(scelti.flatMap(m => [m.chi, m.chat && String(m.chat).replace(/^chat con /, "")]).filter(Boolean))];
    const codici = LET.creaCodici(ctx);
    const { testo, tagliati, telefoni } = LET.testoPerLettura(scelti, papa, ctx, codici);
    const { r, ripiego } = await chiediGemini(gemini, { sistema: LET.istruzioniLettura(ctx, codici), storia: [], testo: `${immagini.length ? `Ti mando anche ${immagini.length === 1 ? "una foto" : immagini.length + " foto"} della chat (numerate nell'ordine, nei messaggi trovi "foto n. 1"...): se sono il prospetto scritto a mano o stampato, leggile come il resto.\n` : ""}ECCO I MESSAGGI (${scelti.length}${tagliati ? `, i ${tagliati} più vecchi li ho lasciati fuori` : ""}):\n${testo}`, immagine: immagini.length ? immagini : null, secondi: 150, maxToken: 16000 });
    const j0 = LET.rimettiTelefoni(LET.jsonDaRisposta(r.grezzo), telefoni);
    if (!j0 || typeof j0 !== "object") throw new Error("Gemini ha risposto in un modo che non capisco");
    const j = codici.daCodiciProfondo(j0);
    const riassunto = riassuntoGiro(j, ctx), ha = !!(riassunto.cambi || riassunto.indicazioni || riassunto.assenze || riassunto.guasti || riassunto.spesa || riassunto.note);
    const testoPapa = scelti.filter(m => m.testo && (!papa || m.chi === papa)).map(m => m.testo).join("\n");
    const etichette = [...chats.entries()].map(([nome, gruppo]) => gruppo ? nome : "chat con " + nome);
    const fonte = { tipo: "whatsapp", come: "chat", messaggi: scelti.length, chi: papa ? [papa] : [], chats: etichette, data: (scelti[scelti.length - 1] || {}).data || "", tolte: 0, intestazioni: true, rif: "", posta: true, giro: true };
    const avvisoOra = ha && oraDiAvvisi(minuti);      // 1.18.1: di notte niente avviso: parte al primo giro dopo le 7
    await db.salva("importazioni", "lettura-sofia", { lid: id, stato: ha ? "da_controllare" : "vuota", da: "giro", quando: finito(), j, modello: r.modello || "", ripiego: !!ripiego, n: scelti.length, testo: testoPapa.slice(0, 20000), fonte, postaIds: ids, riassunto, ...(avvisoOra ? { avvisata: adesso.toISOString() } : {}) });
    for (const pid of ids) { try { await db.merge("posta", pid, { letto: true }); } catch (e) {} }
    return {
      esito: ha ? "letto" : "letto, niente da cambiare", ts: ultimoTs, n: scelti.length, riassunto, modello: r.modello || "",
      avvisa: avvisoOra ? avvisoLettura({ n: scelti.length, riassunto, fonte: { chats: [...chats.keys()] } }, ctx.nomeGov) : null,
    };
  } catch (e) {
    const msg = String((e && e.message) || e).slice(0, 200);
    try { await db.salva("importazioni", "lettura-sofia", { lid: id, stato: "errore", da: "giro", quando: finito(), errore: msg, postaIds: ids }); } catch (e2) {}
    return { esito: "non riuscita: " + msg, ts: letturaTs, credito: /credito|402|prepay|billing/i.test(msg) };
  }
}
