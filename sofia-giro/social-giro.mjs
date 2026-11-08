// ============================================================================
//  giro 1.31.0 · SOFIA SOCIAL MANAGER, IL MOTORE (Instagram). Michele, 8/11 mattina: «io faccio l'accesso a Facebook e
//  Instagram, e poi se la vede tutto completamente lei… non ci credo molto». Qui c'è il pezzo che lo fa davvero.
//   1. LA CHIAVE di Instagram (la incolla Michele nell'app → importazioni/social-chiave, solo i proprietari): il giro la
//      controlla (account professionale?), la rinnova da solo ogni 10 giorni (Instagram la tiene buona 60 giorni) e, se non
//      va più, avvisa Michele una volta sola.
//   2. I POST: martedì e sabato dalle 18:30 (le prime due settimane), poi anche il giovedì, d'estate anche la domenica.
//      Le foto sono quelle di Michele (raccolta «foto», social_…). Prima Gemini guarda la foto (niente persone, niente cose
//      degli ospiti, niente foto storte o buie) e scrive il testo (italiano + inglese, pochi hashtag giusti); poi la foto va
//      su un indirizzo pubblico (il ramo «social-foto» del progetto su GitHub) e Instagram la pubblica.
//      Le bozze dei prossimi post si preparano prima: Michele le vede nell'app («Fammi vedere la prova»), anche prima del
//      collegamento.
//   3. I COMMENTI: a ogni giro guarda i post degli ultimi 30 giorni; ai commenti nuovi risponde Gemini con le regole
//      (gentile, corto, niente prezzi o promesse inventate, firma «Sofia, assistente virtuale»: obbligo europeo dal
//      2/8/2026); quelli offensivi o pubblicità li nasconde; i reclami e le cose delicate: risposta gentile + avviso a Michele.
//  Nel registro pubblico di GitHub solo quanti: mai la chiave, mai indirizzi, mai i testi dei commenti né i nomi.
// ============================================================================
import { chiediGemini } from "./lettura-giro.mjs";

export const VERSIONE_SOCIAL = "1.0.0";
export const IG = "https://graph.instagram.com";
const GIORNO = 86400000;
export const RINNOVA_OGNI_MS = 10 * GIORNO;
export const ORA_POST = 18 * 60 + 30, ORA_FINE_POST = 22 * 60;   // minuti, ora di Roma
const STESSA_FOTO_MS = 12 * GIORNO;                              // la stessa foto non torna prima di 12 giorni
const MAX_RISPOSTE = 10;                                         // risposte ai commenti per giro

// i fatti veri che Sofia può dire: niente prezzi, niente servizi non sicuri, niente indirizzi precisi
export const FATTI = [
  "Le Stanze di Ricci: camere e appartamenti a Lesina (provincia di Foggia, Puglia), in paese, vicino alla laguna di Lesina e al Gargano.",
  "13 sistemazioni: 10 camere, ognuna con un nome (Salvatore, Aurora, Michele, Antonio, Alba, Tramonto, Passerella, Fenicotteri, Lella, Nicole), e 3 appartamenti in paese.",
  "Pulizia da albergo.",
  "La laguna di Lesina è una laguna salmastra protetta, nel Parco nazionale del Gargano: aironi, garzette, cormorani e, in certi mesi, i fenicotteri.",
  "Lesina è il paese dell'anguilla; la sera si passeggia sul lungolago.",
  "Il mare di Marina di Lesina, le spiagge e i paesi del Gargano sono a poca strada in macchina.",
  "Per informazioni e prenotazioni: il link nella bio del profilo.",
];
export const TEMI = {
  facciata: "la casa: la facciata con l'insegna", "camera-bella": "una delle camere", bagno: "un bagno pulito e in ordine",
  terrazzo: "il terrazzo", laguna: "la laguna di Lesina al tramonto", paese: "il paese di Lesina la sera",
  dettaglio: "un dettaglio che fa sentire a casa", uccelli: "gli uccelli della laguna (birdwatching)",
};
export const HASHTAG = ["#Lesina", "#LagoDiLesina", "#LagunaDiLesina", "#Gargano", "#Puglia", "#LeStanzeDiRicci", "#BedAndBreakfast", "#Birdwatching", "#ViaggiareInPuglia", "#PugliaTravel", "#Italia", "#Weekend", "#Tramonto", "#Natura", "#Relax"];
const FIRMA = { it: "— Sofia, assistente virtuale delle Stanze di Ricci", en: "— Sofia, virtual assistant of Le Stanze di Ricci", de: "— Sofia, virtuelle Assistentin von Le Stanze di Ricci", fr: "— Sofia, assistante virtuelle des Stanze di Ricci", es: "— Sofia, asistente virtual de Le Stanze di Ricci" };

// ---- pezzetti --------------------------------------------------------------------------------------------------------
export function pulito(x) {   // per il registro e per gli errori: niente indirizzi, niente chiavi
  return String((x && x.message) || x || "").replace(/https?:\/\/\S+/g, "(indirizzo)").replace(/access_token=\S+/g, "access_token=(chiave)")
    .replace(/\bIG[A-Za-z0-9_-]{20,}/g, "(chiave)").replace(/\bEA[A-Za-z0-9]{20,}/g, "(chiave)").replace(/\s+/g, " ").slice(0, 120);
}
const giornoSett = (iso) => new Date(iso + "T12:00:00Z").getUTCDay();
export function settimanaIso(iso) {   // "2026-W45"
  const d = new Date(iso + "T12:00:00Z"), g = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - g + 3);
  const primo = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const n = 1 + Math.round(((d - primo) / GIORNO - 3 + ((primo.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(n).padStart(2, "0")}`;
}
export function giorniDiPost(mese, primi) {   // 0 = domenica
  if (primi) return [2, 6];
  if (mese >= 6 && mese <= 9) return [0, 2, 4, 6];
  return [2, 4, 6];
}
const pubblicati = (s) => (Array.isArray(s && s.pubblicati) ? s.pubblicati : []).filter(p => p && p.quando);
function primiGiorni(s, adesso) {
  const pub = pubblicati(s); if (!pub.length) return true;
  const primo = Math.min(...pub.map(p => Date.parse(p.quando) || adesso.getTime()));
  return adesso.getTime() - primo < 14 * GIORNO;
}
export function postDovuto({ s, oggi, minuti, adesso }) {
  if (pubblicati(s).some(p => p.giorno === oggi)) return false;   // uno al giorno
  if (minuti < ORA_POST || minuti >= ORA_FINE_POST) return false;
  return giorniDiPost(Number(oggi.slice(5, 7)), primiGiorni(s, adesso)).includes(giornoSett(oggi));
}
export function prossimoPost({ s, oggi, minuti, adesso }) {   // il prossimo giorno di post (per l'app)
  for (let i = 0; i < 9; i++) {
    const d = new Date(oggi + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + i); const iso = d.toISOString().slice(0, 10);
    if (i === 0 && (minuti >= ORA_FINE_POST || pubblicati(s).some(p => p.giorno === oggi))) continue;
    if (giorniDiPost(Number(iso.slice(5, 7)), primiGiorni(s, adesso)).includes(giornoSett(iso))) return { giorno: iso, ora: "18:30" };
  }
  return null;
}
const fotoDi = (s) => Object.entries((s && s.foto) || {}).filter(([k, v]) => v && v.quando && TEMI[k]);
const fotoNo = (s) => (s && s.motore && s.motore.fotoNo) || {};
const ultimoUso = (s, k) => pubblicati(s).filter(p => p.k === k).reduce((m, p) => Math.max(m, Date.parse(p.quando) || 0), 0);
export function fotoBuone(s, adesso, escluse = []) {   // dalla meno usata; non quelle scartate (finché Michele non le rifà)
  return fotoDi(s).filter(([k, v]) => !escluse.includes(k) && !(fotoNo(s)[k] && fotoNo(s)[k].quando === v.quando))
    .filter(([k]) => adesso.getTime() - ultimoUso(s, k) >= STESSA_FOTO_MS)
    .sort((a, b) => ultimoUso(s, a[0]) - ultimoUso(s, b[0]) || a[0].localeCompare(b[0])).map(([k]) => k);
}
// il testo del post: niente prezzi, niente indirizzi, niente numeri di telefono, niente @
export function pulisciTesto(t) {
  const frasi = String(t || "").replace(/\r/g, "").split(/(?<=[.!?…])\s+|\n+/);
  return frasi.filter(f => f.trim() && !/€|\beur(o|os)?\b|\$|\d+\s?(euro|eur)\b|https?:|www\.|@\w|\+?\d[\d\s]{7,}\d/i.test(f)).join(" ").replace(/\s+/g, " ").trim();
}
export function didascalia(b) {
  const tag = [...new Set((Array.isArray(b && b.tag) ? b.tag : []).map(x => String(x).trim()).filter(x => HASHTAG.includes(x)))].slice(0, 8);
  if (!tag.includes("#Lesina")) tag.unshift("#Lesina");
  const it = pulisciTesto(b && b.it), en = pulisciTesto(b && b.en);
  return [it, en ? `🇬🇧 ${en}` : "", tag.slice(0, 8).join(" ")].filter(Boolean).join("\n\n").slice(0, 2100);
}
export function jsonDa(txt) {
  const t = String(txt || "").replace(/^[\s`]*json/i, "").replace(/```/g, "").trim();
  try { return JSON.parse(t); } catch (e) {}
  const a = t.indexOf("{"), z = t.lastIndexOf("}");
  if (a >= 0 && z > a) { try { return JSON.parse(t.slice(a, z + 1)); } catch (e) {} }
  return null;
}
const regole = `REGOLE: scrivi solo cose vere, prese da questi FATTI; mai prezzi, mai sconti, mai offerte, mai orari, mai servizi che non sono nei FATTI (niente colazione, parcheggio, piscina, animali…), mai indirizzi o numeri di telefono, mai «il migliore», mai eventi o date inventate. Tono caldo e semplice, da persona del posto; al massimo 2 emoji.`;

// ---- Instagram (la strada ufficiale: «Instagram API with Instagram Login», graph.instagram.com) ----------------------
function erroreIG(e, st) { const x = new Error(pulito((e && e.message) || ("HTTP " + st))); x.codice = Number((e && e.code) || st) || 0; x.sotto = Number(e && e.error_subcode) || 0; x.ig = true; return x; }
async function chiama(rete, metodo, percorso, parametri, chiave) {
  const p = new URLSearchParams({ ...(parametri || {}), access_token: chiave });
  const r = metodo === "GET" ? await rete(`${IG}/${percorso}?${p}`, { method: "GET" })
    : await rete(`${IG}/${percorso}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: p.toString() });
  const j = (r && r.json) || {};
  if (j.error) throw erroreIG(j.error, r.status);
  if (!r || r.status >= 400) throw erroreIG(null, r ? r.status : 0);
  return j;
}
export const chiaveMorta = (e) => e && e.ig && (e.codice === 190 || e.codice === 102 || e.codice === 463 || e.codice === 467);
export async function controllaChiave(rete, chiave) {
  const j = await chiama(rete, "GET", "me", { fields: "user_id,username,account_type" }, chiave);
  return { utente: String(j.user_id || j.id || ""), nome: String(j.username || ""), tipo: String(j.account_type || "") };
}
export async function rinnovaChiave(rete, chiave) {
  const j = await chiama(rete, "GET", "refresh_access_token", { grant_type: "ig_refresh_token" }, chiave);
  if (!j.access_token) throw erroreIG({ message: "rinnovo senza chiave" }, 0);
  return { token: String(j.access_token), secondi: Number(j.expires_in) || 60 * 86400 };
}
export async function pubblicaFoto({ rete, chiave, utente, url, testo, aspetta = async () => {} }) {
  const c = await chiama(rete, "POST", `${utente}/media`, { image_url: url, caption: testo }, chiave);
  for (let i = 0; i < 6; i++) {
    const st = await chiama(rete, "GET", String(c.id), { fields: "status_code" }, chiave);
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR" || st.status_code === "EXPIRED") throw erroreIG({ message: "Instagram non ha preso la foto (" + st.status_code + ")" }, 0);
    if (i === 5) throw erroreIG({ message: "Instagram ci mette troppo a preparare la foto" }, 0);
    await aspetta(3000);
  }
  const m = await chiama(rete, "POST", `${utente}/media_publish`, { creation_id: String(c.id) }, chiave);
  let link = "";
  try { link = String((await chiama(rete, "GET", String(m.id), { fields: "permalink" }, chiave)).permalink || ""); } catch (e) {}
  return { id: String(m.id), link };
}

// ---- Gemini: guarda la foto e scrive il post --------------------------------------------------------------------------
export async function scriviPost({ gemini, k, dati, oggi }) {
  const mese = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"][Number(oggi.slice(5, 7)) - 1];
  const sistema = `Sei Sofia, la social manager delle Stanze di Ricci. Scrivi il testo di un post Instagram per la foto allegata.\nFATTI:\n- ${FATTI.join("\n- ")}\n${regole}`;
  const testo = `La foto dovrebbe mostrare: ${TEMI[k]}. Siamo a ${mese}.\nPRIMA controlla la foto: deve andare bene per Instagram. NON va bene se si vedono persone o facce, cose personali degli ospiti (valigie, vestiti, oggetti), targhe o documenti leggibili, disordine o sporco, se è buia, mossa o storta, o se non c'entra col tema.\nPoi scrivi il post: in italiano 2-4 frasi (al massimo 450 caratteri), poi la stessa cosa in inglese, più corta. Scegli da 5 a 8 hashtag SOLO da questa lista: ${HASHTAG.join(" ")}.\nRispondi SOLO con JSON: {"ok": true/false, "motivo": "se non va: perché, in poche parole per Michele", "it": "...", "en": "...", "tag": ["#..."]}`;
  const { r } = await chiediGemini(gemini, { sistema, testo, immagine: { dati, mime: "image/jpeg" }, secondi: 60 });
  const j = jsonDa(r && r.grezzo);
  if (!j || typeof j.ok !== "boolean") throw new Error("Gemini non ha risposto col post");
  if (!j.ok) return { ok: false, motivo: String(j.motivo || "la foto non va bene").replace(/\s+/g, " ").slice(0, 140) };
  const b = { ok: true, it: pulisciTesto(j.it), en: pulisciTesto(j.en), tag: Array.isArray(j.tag) ? j.tag.map(String).slice(0, 12) : [] };
  if (b.it.length < 20) throw new Error("Gemini ha scritto un post vuoto");
  return b;
}
// ---- Gemini: risponde ai commenti -------------------------------------------------------------------------------------
export async function rispondiCommenti({ gemini, lista }) {
  const sistema = `Sei Sofia, l'assistente virtuale delle Stanze di Ricci, e rispondi ai commenti sotto i post Instagram dell'albergo.\nFATTI:\n- ${FATTI.join("\n- ")}\n${regole}\nPer ogni commento scegli l'azione:\n- "rispondi": una risposta corta (al massimo 220 caratteri), gentile, nella lingua del commento; se chiedono prezzi, disponibilità o prenotazioni: «trovi tutto nel link in bio» (mai cifre);\n- "passa": reclami, problemi, richieste delicate o cose che non sai: rispondi con gentilezza che Michele li ricontatta, e scrivi per Michele una riga in italiano;\n- "nascondi": insulti, volgarità, pubblicità o spam (niente risposta);\n- "ignora": emoji sole o tag di amici, dove una risposta non serve.\nNon firmare: la firma la aggiungo io.`;
  const testo = `I commenti (il testo del post è tra parentesi):\n${lista.map((c, i) => `${i + 1}. id ${c.id} (post: «${String(c.post || "").slice(0, 160)}»): «${String(c.testo || "").slice(0, 500)}»`).join("\n")}\nRispondi SOLO con JSON: {"risposte": [{"id": "...", "azione": "rispondi|passa|nascondi|ignora", "lingua": "it|en|de|fr|es|…", "risposta": "...", "perMichele": "..."}]}`;
  const { r } = await chiediGemini(gemini, { sistema, testo, secondi: 60 });
  const j = jsonDa(r && r.grezzo);
  const ris = Array.isArray(j && j.risposte) ? j.risposte : null;
  if (!ris) throw new Error("Gemini non ha risposto ai commenti");
  return ris.filter(x => x && x.id && ["rispondi", "passa", "nascondi", "ignora"].includes(x.azione));
}
export function conFirma(testo, lingua) {
  const t = pulisciTesto(testo).slice(0, 260);
  return t ? `${t}\n${FIRMA[String(lingua || "").slice(0, 2)] || FIRMA.en}` : "";
}

// ---- il giro ------------------------------------------------------------------------------------------------------------
//  rete(url, {method, headers, body}) → {status, json}; carica({percorso, base64}) → {url}; avvisa({titolo, testo, urgente, tag})
export async function giroSocial({ db, adesso = new Date(), oggi, minuti, gemini = null, rete, carica = null, avvisa = async () => false, aspetta = async () => {} }) {
  const [s0, ch0] = await Promise.all([db.doc("importazioni", "social"), db.doc("importazioni", "social-chiave")]);
  const s = s0 || {}, ch = ch0 || {};
  const prima = JSON.stringify(s.motore || null);
  const m = { ...(s.motore || {}), versione: VERSIONE_SOCIAL, stato: "", fotoNo: { ...fotoNo(s) }, avvisi: { ...((s.motore && s.motore.avvisi) || {}) } };
  const scritte = {};   // le altre cose da salvare in importazioni/social (bozze, pubblicati, conti)
  const fatto = [];
  const ora = adesso.toISOString();
  const avvisaUnaVolta = async (k, x, ogniMs = Infinity) => {   // una volta sola (o una volta ogni tanto)
    const t = Date.parse(m.avvisi[k] || "");
    if (t && adesso.getTime() - t < ogniMs) return false;
    m.avvisi[k] = ora; try { return await avvisa(x); } catch (e) { return false; }
  };
  let chiave = String(ch.token || "").trim(), ok = false;
  const morta = async () => {   // la chiave non va più (scaduta, tolta, password cambiata)
    ok = false; m.stato = "chiave"; m.chiaveControllata = ora;
    await db.segnaSe("importazioni", "social-chiave", "token", chiave, { stato: "scaduta", controllata: ora });
    await avvisaUnaVolta("chiave", { titolo: "📣 Instagram: la chiave non va più", testo: "La chiave di Instagram è scaduta o è stata tolta: non posso pubblicare né rispondere. Rifalla dal PC (2 minuti): Altro → Sofia social manager → Il collegamento.", urgente: true, tag: "sofia-social-chiave" }, 3 * GIORNO);
  };

  // 1) la chiave: nuova o da ricontrollare (una volta al giorno); il rinnovo ogni 10 giorni (anche se Sofia è ferma)
  if (chiave) {
    try {
      const giaVista = ch.stato === "ok" && adesso.getTime() - (Date.parse(ch.controllata || "") || 0) < GIORNO;
      if (!giaVista) {
        const io = await controllaChiave(rete, chiave);
        m.chiaveControllata = ora;   // l'app sa che la chiave nuova l'ho guardata
        const professionale = /^(BUSINESS|MEDIA_CREATOR|CREATOR)$/i.test(io.tipo);
        const scade = ch.scade || new Date(Date.parse(ch.messa || ora) + 60 * GIORNO).toISOString();
        const dati = { stato: professionale ? "ok" : "personale", controllata: ora, utente: io.utente, nome: io.nome, tipo: io.tipo, scade };
        await db.segnaSe("importazioni", "social-chiave", "token", chiave, dati);
        Object.assign(ch, dati);
        if (!professionale) await avvisaUnaVolta("personale", { titolo: "📣 Instagram: serve l'account professionale", testo: "Il tuo Instagram è ancora «personale»: così Instagram non mi fa pubblicare. Sul telefono: Impostazioni → Tipo di account → Passa all'account professionale → Azienda. Poi faccio io.", tag: "sofia-social-chiave" }, GIORNO);
      }
      ok = ch.stato === "ok";
    } catch (e) { if (chiaveMorta(e)) await morta(); else { m.errore = { quando: ora, testo: "chiave: " + pulito(e) }; fatto.push("chiave: Instagram non risponde"); } }
    if (ok && adesso.getTime() - (Date.parse(ch.rinnovata || ch.messa || "") || 0) >= RINNOVA_OGNI_MS) {
      try {
        const n = await rinnovaChiave(rete, chiave);
        const scade = new Date(adesso.getTime() + n.secondi * 1000).toISOString();
        if (await db.segnaSe("importazioni", "social-chiave", "token", chiave, { token: n.token, rinnovata: ora, scade })) { chiave = n.token; ch.scade = scade; ch.rinnovata = ora; fatto.push("chiave rinnovata"); }
      } catch (e) {
        if (chiaveMorta(e)) await morta();
        else if (Date.parse(ch.scade || "") - adesso.getTime() < 5 * GIORNO) await avvisaUnaVolta("rinnovo", { titolo: "📣 Instagram: la chiave sta per scadere", testo: `Non riesco a rinnovare la chiave di Instagram («${pulito(e)}») e scade fra pochi giorni. Se non ci riesco entro domani, rifalla dal PC (2 minuti).`, tag: "sofia-social-chiave" }, GIORNO);
      }
    }
    if (ok) m.ig = { nome: ch.nome || "", tipo: ch.tipo || "", scade: ch.scade || "", controllata: ch.controllata || "" };
  }
  if (s.fermo) { m.stato = "ferma"; m.prossimo = null; return await chiudi(); }

  // 2) le bozze: pronte prima (anche senza collegamento: è «la prova» che vede Michele), una per giro
  const bozze = (Array.isArray(s.bozze) ? s.bozze : []).filter(b => b && b.k && (s.foto || {})[b.k] && s.foto[b.k].quando === b.fotoQuando && !(m.fotoNo[b.k] && m.fotoNo[b.k].quando === b.fotoQuando));
  let bozzeCambiate = bozze.length !== (Array.isArray(s.bozze) ? s.bozze.length : 0);
  const scarta = async (k, motivo) => {
    m.fotoNo[k] = { quando: s.foto[k].quando, motivo }; fatto.push("1 foto da rifare");
    await avvisaUnaVolta("foto-" + k + "-" + s.foto[k].quando, { titolo: "📷 Una foto da rifare", testo: `La foto «${TEMI[k]}» non la pubblico: ${motivo}. Rifalla quando puoi (Altro → Sofia social manager → Le foto).`, tag: "sofia-social-foto" });
  };
  const leggiFoto = async (k) => {
    const f = await db.doc("foto", `social_${k}`); const d = String((f && f.dati) || "");
    return { dati: d.startsWith("data:image/jpeg;base64,") ? d.slice(23) : "", w: Number(f && f.w) || 0, h: Number(f && f.h) || 0 };
  };
  const conBuone = () => { const b = new Set(fotoBuone({ ...s, motore: m }, adesso)); return b; };
  if (gemini && minuti >= 8 * 60 && minuti < 22 * 60 && bozze.length < 3) {
    const k = fotoBuone({ ...s, motore: m }, adesso, bozze.map(b => b.k))[0];
    if (k) {
      try {
        const f = await leggiFoto(k), r = f.w && f.h ? f.w / f.h : 1;
        if (!f.dati) await scarta(k, "non riesco a leggerla");
        else if (r < 0.8 || r > 1.91) await scarta(k, "è troppo stretta o troppo lunga per Instagram: rifalla in orizzontale");
        else {
          const b = await scriviPost({ gemini, k, dati: f.dati, oggi });
          if (!b.ok) await scarta(k, b.motivo);
          else { bozze.push({ k, fotoQuando: s.foto[k].quando, it: b.it, en: b.en, tag: b.tag, testo: didascalia(b), quando: ora }); fatto.push("1 bozza pronta"); }
        }
        bozzeCambiate = true;
      } catch (e) { m.errore = { quando: ora, testo: "bozza: " + pulito(e) }; fatto.push("bozza: non riuscita"); }
    }
  }

  // 3) il post di oggi
  const pub = pubblicati(s);
  if (ok && carica && postDovuto({ s, oggi, minuti, adesso })) {
    const buone = conBuone(), b = bozze.find(x => buone.has(x.k));
    if (!b) {
      if (!buone.size) { m.stato = "foto"; await avvisaUnaVolta("poche-foto", { titolo: "📷 Mi servono foto nuove", testo: "Per Instagram ho finito le foto da usare (o sono uscite da poco). Quando puoi: Altro → Sofia social manager → Le foto, anche solo una o due.", tag: "sofia-social-foto" }, 7 * GIORNO); }
    } else {
      try {
        // se oggi su Instagram c'è già un post (uscito ma non segnato, o messo a mano), non ne faccio un altro
        const ult = await chiama(rete, "GET", `${ch.utente || "me"}/media`, { fields: "id,timestamp,permalink", limit: "1" }, chiave);
        const u = Array.isArray(ult.data) && ult.data[0];
        if (u && adesso.getTime() - (Date.parse(u.timestamp || "") || 0) < 6 * 3600000) {
          pub.push({ quando: u.timestamp, giorno: oggi, k: "", id: String(u.id), link: String(u.permalink || ""), tipo: "già" }); scritte.pubblicati = pub.slice(-40);
        } else {
          const f = await leggiFoto(b.k);
          if (!f.dati) throw new Error("la foto non si legge");
          const percorso = `social/${b.k}-${String(b.fotoQuando).replace(/[^0-9]/g, "").slice(0, 14)}.jpg`;
          const { url } = await carica({ percorso, base64: f.dati });
          const r = await pubblicaFoto({ rete, chiave, utente: ch.utente || "me", url, testo: b.testo || didascalia(b), aspetta });
          pub.push({ quando: ora, giorno: oggi, k: b.k, id: r.id, link: r.link, tipo: "foto" });
          scritte.pubblicati = pub.slice(-40);
          bozze.splice(bozze.indexOf(b), 1); bozzeCambiate = true;
          m.errori = 0; m.errore = null;   // null e non delete: in Firestore il merge non toglie i campi
          fatto.push(`pubblicato 1 post (${b.k})`);
          if (pub.filter(p => p.tipo === "foto").length === 1) await avvisaUnaVolta("primo-post", { titolo: "📣 Il primo post è su Instagram", testo: `Ho pubblicato il primo post (${TEMI[b.k]}). Da adesso vado da sola: 2 post a settimana per cominciare, poi 3. Il link è in Altro → Sofia social manager.`, tag: "sofia-social-primo" });
        }
      } catch (e) {
        if (chiaveMorta(e)) await morta();
        else {
          m.errori = (Number(m.errori) || 0) + 1; m.errore = { quando: ora, testo: pulito(e) };
          fatto.push("post non riuscito");
          if (m.errori >= 3) await avvisaUnaVolta("errore-post", { titolo: "📣 Instagram non mi fa pubblicare", testo: `Ci ho provato ${m.errori} volte: «${pulito(e)}». Riprovo io; se continua te lo dico.`, tag: "sofia-social-errore" }, GIORNO);
        }
      }
    }
  }

  // 4) i commenti nuovi (post degli ultimi 30 giorni)
  if (ok && gemini) {
    try {
      const vc = (await db.doc("importazioni", "social-commenti")) || {};
      const visti = { ...(vc.visti || {}) };
      const media = await chiama(rete, "GET", `${ch.utente || "me"}/media`, { fields: "id,caption,timestamp,comments_count", limit: "12" }, chiave);
      const nuovi = [], io = String(ch.nome || "").toLowerCase();
      const di = (x) => String((x && (x.username || (x.from && x.from.username))) || "").toLowerCase();
      for (const md of (Array.isArray(media.data) ? media.data : [])) {
        if (!md || !md.id || !(Number(md.comments_count) > 0) || adesso.getTime() - (Date.parse(md.timestamp || "") || 0) > 30 * GIORNO) continue;
        const cc = await chiama(rete, "GET", `${md.id}/comments`, { fields: "id,text,timestamp,username,from,replies{id,username,from}", limit: "50" }, chiave);
        for (const c of (Array.isArray(cc.data) ? cc.data : [])) {
          if (!c || !c.id || visti[c.id]) continue;
          if (io && di(c) === io) { visti[c.id] = "mio"; continue; }
          if (io && ((c.replies && Array.isArray(c.replies.data)) ? c.replies.data : []).some(x => di(x) === io)) { visti[c.id] = "r"; continue; }
          if (adesso.getTime() - (Date.parse(c.timestamp || "") || adesso.getTime()) > 7 * GIORNO) { visti[c.id] = "vecchio"; continue; }
          nuovi.push({ id: String(c.id), testo: String(c.text || ""), post: String(md.caption || "").split("\n")[0] });
        }
      }
      let risposte = 0, nascosti = 0, passati = 0;
      if (nuovi.length) {
        const giro = nuovi.slice(0, MAX_RISPOSTE);
        const decisi = await rispondiCommenti({ gemini, lista: giro });
        for (const c of giro) {
          const d = decisi.find(x => String(x.id) === c.id);
          if (!d) { visti[c.id] = "s"; continue; }
          if (d.azione === "rispondi" || d.azione === "passa") {
            const msg = conFirma(d.risposta, d.lingua);
            if (msg) { await chiama(rete, "POST", `${c.id}/replies`, { message: msg }, chiave); risposte++; }
            if (d.azione === "passa") {
              passati++;
              try { await avvisa({ titolo: "📣 Un commento da guardare", testo: `Su Instagram: «${String(c.testo).replace(/\s+/g, " ").slice(0, 160)}». ${String(d.perMichele || "").replace(/\s+/g, " ").slice(0, 160)} Ho risposto con gentilezza che lo ricontatti tu.`.replace(/\s+/g, " ").trim(), tag: "sofia-social-commento" }); } catch (e) {}
            }
          } else if (d.azione === "nascondi") {
            try { await chiama(rete, "POST", c.id, { hide: "true" }, chiave); nascosti++; } catch (e) { if (chiaveMorta(e)) throw e; }
          }
          visti[c.id] = d.azione[0];
        }
      }
      const tieni = Object.entries(visti).slice(-400);
      if (JSON.stringify(tieni) !== JSON.stringify(Object.entries(vc.visti || {}).slice(-400))) await db.salva("importazioni", "social-commenti", { visti: Object.fromEntries(tieni), quando: ora });   // salva (non merge): così ne restano 400
      if (risposte || nascosti) {
        const conti = contiDi(s, oggi); conti.risposte += risposte; conti.totRisposte = (Number(conti.totRisposte) || 0) + risposte; scritte.conti = conti;
        fatto.push(`${risposte} ${risposte === 1 ? "risposta" : "risposte"} ai commenti${nascosti ? `, ${nascosti} ${nascosti === 1 ? "nascosto" : "nascosti"}` : ""}${passati ? `, ${passati} a Michele` : ""}`);
      }
    } catch (e) { if (chiaveMorta(e)) await morta(); else { m.errore = { quando: ora, testo: "commenti: " + pulito(e) }; fatto.push("commenti: non riuscito"); } }
  }

  // lo stato per l'app
  if (!m.stato) m.stato = !chiave ? (fotoDi(s).length ? "aspetta-chiave" : "aspetta-foto") : ch.stato === "personale" ? "personale" : ch.stato === "scaduta" ? "chiave" : !ok ? "controllo" : !fotoDi(s).length ? "aspetta-foto" : "al-lavoro";
  if (scritte.pubblicati && fatto.some(f => /^pubblicato/.test(f))) { const conti = scritte.conti || contiDi(s, oggi); conti.post += 1; conti.totPost = (Number(conti.totPost) || 0) + 1; scritte.conti = conti; }
  m.prossimo = prossimoPost({ s: { ...s, pubblicati: scritte.pubblicati || s.pubblicati }, oggi, minuti, adesso });
  if (bozzeCambiate) scritte.bozze = bozze.slice(0, 3);
  return await chiudi();

  async function chiudi() {
    const dati = { ...scritte };
    if (fatto.length) m.quando = ora;
    if (JSON.stringify(m) !== prima) dati.motore = m;
    if (Object.keys(dati).length) await db.merge("importazioni", "social", dati);
    return fatto.length ? { esito: "social: " + fatto.join(", ") } : null;
  }
}
function contiDi(s, oggi) {
  const w = settimanaIso(oggi), c = (s && s.conti) || {};
  return c.settimana === w ? { ...c } : { settimana: w, post: 0, risposte: 0, totPost: Number(c.totPost) || 0, totRisposte: Number(c.totRisposte) || 0 };
}

// ---- il mondo vero ------------------------------------------------------------------------------------------------------
export async function reteVera(url, opz = {}) {
  const r = await fetch(url, { ...opz, signal: AbortSignal.timeout(30000) });
  let json = null; try { json = await r.json(); } catch (e) {}
  return { status: r.status, json };
}
// la foto su un indirizzo pubblico: il ramo «social-foto» del progetto su GitHub (la chiave è quella del giro, GITHUB_TOKEN)
export function caricaGithub({ repo = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN, ramo = "social-foto", aspetta = (ms) => new Promise(r => setTimeout(r, ms)) } = {}) {
  const api = `https://api.github.com/repos/${repo}`;
  const testa = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "sofia-giro" };
  return async ({ percorso, base64 }) => {
    if (!repo || !token) throw new Error("manca la chiave del giro per caricare la foto");
    const g = async (u, o = {}) => { const r = await fetch(u, { ...o, headers: { ...testa, ...(o.headers || {}) }, signal: AbortSignal.timeout(30000) }); let j = null; try { j = await r.json(); } catch (e) {} return { st: r.status, j }; };
    let rf = await g(`${api}/git/ref/heads/${ramo}`);
    if (rf.st === 404) {
      const mn = await g(`${api}/git/ref/heads/main`);
      if (mn.st !== 200) throw new Error("GitHub: non trovo il ramo principale (" + mn.st + ")");
      rf = await g(`${api}/git/refs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: `refs/heads/${ramo}`, sha: mn.j.object.sha }) });
      if (rf.st !== 201) throw new Error("GitHub: non riesco a fare il ramo delle foto (" + rf.st + ")");
    }
    const c = await g(`${api}/contents/${percorso}?ref=${ramo}`);
    if (c.st !== 200) {
      const p = await g(`${api}/contents/${percorso}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `Sofia social: foto ${percorso.split("/").pop()}`, content: base64, branch: ramo }) });
      if (p.st !== 201 && p.st !== 200) throw new Error("GitHub: non riesco a caricare la foto (" + p.st + ")");
    }
    const url = `https://raw.githubusercontent.com/${repo}/${ramo}/${percorso}`;
    for (let i = 0; i < 8; i++) { try { const h = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15000) }); if (h.ok) return { url }; } catch (e) {} await aspetta(2500); }
    throw new Error("la foto non è ancora raggiungibile");
  };
}
