// ============================================================================
//  SOFIA SEMPRE ACCESA (1.16.0) — il giro automatico che lavora anche ad app chiusa.
//  Michele, 30/10: "mettile tutte… falla diventare quasi al 100% una persona autonoma". Piano di Argon (chat del 30/10):
//  "il filtro zero-costi": qui non si chiama mai Gemini; si guarda il database e si scrive su Telegram solo quando serve.
//  Lo fa partire GitHub ogni mezz'ora (.github/workflows/sofia-giro.yml) con la chiave FIREBASE_SA che mette Michele.
//  Cosa fa (ora di Roma), ognuna una volta al giorno (segni in importazioni/giro-sofia):
//   - dalle 7 (o dall'ora scelta in Avvisi) alle 11: il piano del giorno alle signore (stesso segno "ultimoPiano" dell'app:
//     se l'ha già mandato l'app, non lo rimanda) e tre righe al titolare
//   - 12:30-13:29: se una camera dove oggi arriva un ospite non è pronta, un messaggio gentile alle signore (priorità)
//   - 13:30-14:59: se è ancora indietro, un avviso al titolare
//   - 15:00-16:59: le pulizie di oggi ancora da segnare: un promemoria gentile (mai rimproveri)
//   - dalle 20: il bollettino della sera al titolare (oggi, quello che Sofia ha fatto da sola, i guasti, domani, cosa aspetta il «Sì»)
//   - 7-21: se il ponte WhatsApp c'era e tace da più di 40 minuti, lo dice al titolare (una volta al giorno)
//  1.17.0: al titolare scrive anche (o solo) con gli AVVISI SUL TELEFONO (Web Push, importazioni/push-sofia): basta il tasto
//  «Accendi gli avvisi su questo telefono» nell'app, niente Telegram. Le iscrizioni scadute (404/410) si tolgono da sole.
//  1.17.1: gli avvisi partono tutti "urgenti" (Urgency: high): col telefono a riposo Android li consegna subito invece di
//  tenerli da parte (sono pochi al giorno). E dal tasto «Run workflow» di GitHub, con la casella «prova», parte SOLO un
//  avviso di prova a ogni telefono acceso (niente giro): serve a controllare tutta la strada fino al telefono.
//  1.18.0: SOFIA LEGGE LE CHAT ANCHE AD APP CHIUSA (lettura-giro.mjs): ogni 10 minuti, se il ponte ha portato messaggi nuovi
//  e da 5 minuti nessuno scrive, li legge con Gemini (stessa richiesta dell'app, lettura.js), mette il risultato da
//  controllare in importazioni/lettura-sofia e manda l'avviso «Ho letto… Tocca per controllare». Serve il segreto GEMINI_CHIAVE.
// ============================================================================
import { ZONE, CAMERE, CAMERE_TOLTE, SQUADRA_BASE } from "../regole.js";
import * as L from "../logica.js";
import { LUOGHI_COMUNI } from "../governante.js";
import { leggiChat } from "./lettura-giro.mjs";
import { pathToFileURL } from "node:url";

export const VERSIONE_GIRO = "1.18.0";
const MIN = (h, m = 0) => h * 60 + m;

export function oraRoma(d) {
  const p = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (k) => (p.find(x => x.type === k) || {}).value;
  const h = Number(g("hour")) % 24, m = Number(g("minute"));
  return { iso: `${g("year")}-${g("month")}-${g("day")}`, h, m, minuti: MIN(h, m), hhmm: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
}

// ---- lo stato della casa, letto dal database (solo quello che serve al giro di adesso) ----------------
function camereDi(camereDoc) {
  const lista = camereDoc && Array.isArray(camereDoc.lista) && camereDoc.lista.length ? camereDoc.lista : CAMERE;
  return lista.filter(c => c && !CAMERE_TOLTE[c.id]).map(c => { const b = CAMERE.find(x => x.id === c.id); return b ? { ...c, nome: b.nome } : c; });
}
function casa(st) {
  const camere = camereDi(st.camereDoc);
  const camera = (id) => !id ? { id: "", nome: "Lavoro generale", ordine: 99 } : camere.find(c => c.id === id) || LUOGHI_COMUNI.find(l => l.id === id) || (id === "stelle" ? { id, nome: "Rifiniture in altre camere", ordine: 99 } : { id, nome: id.charAt(0).toUpperCase() + id.slice(1), ordine: 99 });   // come camera() dell'app
  const squadra = {};
  for (const z of Object.keys(ZONE)) squadra[z] = { ...(SQUADRA_BASE[z] || { nome: "", attiva: true, camere: [] }), ...((st.squadra || {})[z] || {}) };
  for (const [k, v] of Object.entries(st.squadra || {})) if (!squadra[k] && v && typeof v === "object") squadra[k] = { nome: "", attiva: true, camere: [], ...v };
  const SIG = (z) => { const s = squadra[z]; if (s && s.nome) return s.nome; const p = Object.values(st.ruoli || {}).find(r => r && r.ruolo === "addetta" && r.zona === z && r.nome && !/^signora/i.test(r.nome)); if (p) return p.nome; return `Signora ${(ZONE[z] || {}).breve || z}`; };
  const signore = () => Object.entries(ZONE).sort((a, b) => (a[1].ordine || 0) - (b[1].ordine || 0)).map(([id, v]) => ({ id, ...v })).filter(z => squadra[z.id] && squadra[z.id].attiva !== false);
  const tag = (z) => { const t = ((st.avvisi || {}).tag || {})[z]; return t ? (String(t).startsWith("@") ? t : "@" + t) : SIG(z); };
  const ordine = (id) => camera(id).ordine || 99;
  const visibile = (p) => p && p.tipo !== "stelle";      // il giro delle rifiniture lo vedono nell'app (qui non si ricalcola)
  const delGiorno = (iso, z) => Object.values(st.pulizie || {}).filter(p => p && p.data === iso && (!z || p.zona === z) && visibile(p)).sort((a, b) => ordine(a.camera) - ordine(b.camera));
  const titolo = (p) => (p.tipo === "totale" || p.tipo === "totale_casa" ? "Cambio completo" : (p.titolo || "Pulizia")) + (p.parte && L.PARTE_TESTO[p.parte] ? ` · ${L.PARTE_TESTO[p.parte]}` : "");
  const sempre = (id) => { try { return L.spezzaRichieste((st.promemoria || {})[id] || ""); } catch (e) { return []; } };
  const riga = (p) => {
    const c = camera(p.camera);
    let r = `• ${c.nome} — ${p.origine === "governante" ? "⭐ " : ""}${titolo(p)}${p.origine === "governante" && p.minuti ? ` (${p.minuti} min)` : ""}`;
    if (p.origine === "governante" && p.come) r += `\n   ↳ ${p.come}`;
    if (p.ospite) r += ` (${p.ospite}${p.persone ? `, ${p.persone} ${p.persone === 1 ? "persona" : "persone"}` : ""})`;
    if (p.partenza) r += ` · PARTE ${L.GIORNI[L.giornoSettimana(p.data)].toUpperCase()}`;
    if (p.arrivo) r += ` · ARRIVA ${L.GIORNI[L.giornoSettimana(p.data)].toUpperCase()}`;
    if (!p.arrivo && p.prossimoArrivo) r += ` · prossimo arrivo ${L.dataGiornoLungo(p.prossimoArrivo)}`;
    const s = sempre(p.camera); if (s.length) r += `\n   ↳ sempre: ${s.join(", ")}`;
    if (p.dettagli) r += `\n   ↳ ${p.dettagli}`;
    if (p.istruzioni) r += `\n   ↳ ${p.istruzioni}`;
    return r;
  };
  const messaggio = (iso) => { const m = (st.messaggi || {})[iso]; return m && m.testo ? m : null; };
  const arriviDi = (iso) => Object.values(st.soggiorni || {}).filter(s => s && s.inizio === iso && s.camera).map(s => s.camera);
  const aperta = (p) => p && p.stato !== "fatta" && p.stato !== "non_fatta";
  return { camere, camera, SIG, signore, tag, delGiorno, riga, messaggio, arriviDi, aperta, titolo };
}
export function testoPianoGiorno(st, iso) {
  const k = casa(st), righe = [`🧹 Pulizie · ${L.dataLunga(iso)}`];
  const msg = k.messaggio(iso); if (msg) righe.push(`📣 ${msg.testo}`);
  for (const z of k.signore()) {
    const ls = k.delGiorno(iso, z.id).filter(p => p.stato !== "fatta");
    if (!ls.length) continue;
    righe.push("", `${k.tag(z.id)} · ${ls.length} ${ls.length === 1 ? "camera" : "camere"}`);
    ls.forEach(p => righe.push(k.riga(p)));
  }
  return righe.join("\n");
}
// le camere dove oggi arriva un ospite e la pulizia di oggi non è ancora fatta
function arriviNonPronti(st, oggi) {
  const k = casa(st), arrivi = new Set(k.arriviDi(oggi));
  return k.delGiorno(oggi).filter(p => arrivi.has(p.camera) && k.aperta(p) && p.stato !== "problema");
}
function oreMinuti(min) { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h${m ? " " + String(m).padStart(2, "0") : ""}` : `${m} min`; }
export function testoBollettino(st, oggi, domani) {
  const k = casa(st), righe = [`🌙 Il bollettino di Sofia · ${L.dataLunga(oggi)}`];
  // oggi
  const pezzi = k.signore().map(z => { const ls = k.delGiorno(oggi, z.id); if (!ls.length) return ""; const fatte = ls.filter(p => p.stato === "fatta"), manca = ls.filter(p => k.aperta(p)); return `${k.SIG(z.id)} ${fatte.length} su ${ls.length}${manca.length ? ` (manca: ${manca.map(p => k.camera(p.camera).nome).join(", ")})` : " ✓"}`; }).filter(Boolean);
  righe.push(pezzi.length ? `Oggi: ${pezzi.join(" · ")}` : "Oggi: nessuna pulizia.");
  // quello che ha fatto da sola
  const reg = ((st.registro || {}).voci || []).filter(v => v && v.giorno === oggi);
  if (reg.length) {
    const ann = reg.filter(v => v.annullata).length;
    righe.push("", `Ho fatto da sola: ${reg.length} ${reg.length === 1 ? "cosa" : "cose"}${ann ? ` (${ann} annullat${ann === 1 ? "a" : "e"} da te)` : ""}`);
    reg.slice(-5).forEach(v => righe.push(` • ${String(v.testo || "").slice(0, 120)}${v.annullata ? " (annullata)" : ""}`));
  }
  // i guasti
  const guasti = Object.values(st.manutenzione || {}).filter(m => m && m.stato !== "fatto");
  if (guasti.length) {
    const arrivi2 = new Set([...k.arriviDi(oggi), ...k.arriviDi(domani)]);
    const urg = guasti.filter(m => m.gravita === "urgente" || (m.camera && arrivi2.has(m.camera)));
    righe.push("", `Guasti aperti: ${guasti.length}${urg.length ? ` — da guardare subito: ${urg.slice(0, 3).map(m => `${m.camera ? k.camera(m.camera).nome + ": " : ""}${m.titolo || "lavoro"}${m.camera && arrivi2.has(m.camera) ? " (arriva un ospite)" : ""}`).join(" · ")}` : ""}`);
  }
  // domani
  const carico = k.signore().map(z => { const ls = k.delGiorno(domani, z.id); return { z, n: ls.length, min: ls.reduce((s, p) => s + (Number(p.minuti) || 0), 0) }; }).filter(x => x.n);
  if (carico.length) {
    righe.push("", `Domani: ${carico.map(x => `${k.SIG(x.z.id)} ${x.n} ${x.n === 1 ? "pulizia" : "pulizie"}${x.min ? ` (${oreMinuti(x.min)})` : ""}`).join(" · ")}`);
    if (carico.length >= 2) { const s = [...carico].sort((a, b) => b.min - a.min); if (s[0].min - s[s.length - 1].min > 45) righe.push(`  ${k.SIG(s[0].z.id)} ha ${oreMinuti(s[0].min - s[s.length - 1].min)} di lavoro in più: se vuoi, di' a Sofia di spostarne una a ${k.SIG(s[s.length - 1].z.id)}.`); }
  } else righe.push("", "Domani: nessuna pulizia in programma.");
  const arrDom = [...new Set(k.arriviDi(domani))]; if (arrDom.length) righe.push(`Arrivi domani: ${arrDom.map(c => k.camera(c).nome).join(", ")}`);
  const mDom = k.messaggio(domani); if (mDom) righe.push(`Messaggio per domani alle signore: «${String(mDom.testo).slice(0, 120)}»`);
  // cosa aspetta il suo «Sì»
  const conv = Array.isArray((st.chat || {}).conversazione) ? st.chat.conversazione : [];
  const aspetta = conv.slice(-30).filter(m => m && m.chi === "gov" && Array.isArray(m.tasti) && m.tasti.some(t => t && t.k === "si") && !m.scelto).length;
  if (aspetta) righe.push("", `Aspettano il tuo «Sì»: ${aspetta} ${aspetta === 1 ? "proposta" : "proposte"} di Sofia (apri l'app per vederle).`);
  return righe.join("\n");
}

// ---- il giro ------------------------------------------------------------------------------------------
export async function giro({ db, telegram, push = null, adesso = new Date(), gemini = null }) {
  const t = oraRoma(adesso), oggi = t.iso, domani = L.aggiungiGiorni(oggi, 1);
  const esiti = [];
  const [stato0, avvisi] = await Promise.all([db.doc("importazioni", "giro-sofia"), db.doc("impostazioni", "avvisi")]);
  const fatti = stato0 && stato0.giorno === oggi ? { ...(stato0.fatti || {}) } : {};
  const a = avvisi || {};
  const puoGruppo = !!(a.token && a.chat), tgMe = !!(a.token && a.chatMio);
  const manda = async (dove, testo, cosa) => { const okk = await telegram(a.token, dove, testo); esiti.push(`${cosa}${okk ? "" : " (Telegram non ha risposto)"}`); return okk; };
  // 1.17.0: gli avvisi sul telefono del titolare (si legge il documento solo se c'è qualcosa da dirgli)
  let ps = null;
  const iscrizioni = () => Object.entries((ps && ps.iscrizioni) || {}).filter(([, v]) => v && v.sub && v.sub.endpoint && (v.chi || "titolare") === "titolare");
  const mandaMe = async (testo, cosa, titolo = "Sofia", urgente = false, extra = {}) => {
    let okk = false;
    if (tgMe) okk = (await telegram(a.token, a.chatMio, testo)) || okk;
    if (push && ps && ps.vapidPublic && ps.vapidPrivato) {
      const finite = [];
      for (const [id, v] of iscrizioni()) { const r = await push(ps, v.sub, { titolo, testo, urgente, ...extra }); if (r && r.ok) okk = true; else if (r && r.finita) finite.push(id); }
      if (finite.length) { const resto = Object.fromEntries(Object.entries(ps.iscrizioni || {}).filter(([id]) => !finite.includes(id))); await db.sostituisci("importazioni", "push-sofia", "iscrizioni", resto); ps.iscrizioni = resto; esiti.push(`tolte ${finite.length} iscrizioni scadute`); }
    }
    esiti.push(`${cosa}${okk ? "" : " (non è arrivato)"}`); return okk;
  };
  const oraPiano = MIN(Number(a.oraPiano) || 7);
  const dentro = (da, a2) => t.minuti >= da && t.minuti < a2;
  const serve = {
    piano: !fatti.piano && dentro(oraPiano, MIN(11)),
    arrivi: !fatti.arrivi && dentro(MIN(12, 30), MIN(13, 30)),
    allarme: !fatti.allarme && dentro(MIN(13, 30), MIN(15)),
    chiusura: !fatti.chiusura && dentro(MIN(15), MIN(17)),
    bollettino: !fatti.bollettino && t.minuti >= MIN(20),
    ponte: !fatti.ponte && dentro(MIN(7), MIN(21)),
  };
  // filtro zero-costi: se non c'è niente da fare a quest'ora, si legge solo il segno del giro
  if (Object.values(serve).some(Boolean)) {
    const st = { avvisi: a };
    const carica = async (...cose) => {
      const p = [];
      if (cose.includes("base")) p.push(db.doc("impostazioni", "squadra").then(x => st.squadra = x), db.doc("impostazioni", "camere").then(x => st.camereDoc = x), db.tutti("ruoli").then(x => st.ruoli = x), db.pulizieDi([oggi, domani]).then(x => st.pulizie = x), db.soggiorniDa(oggi).then(x => st.soggiorni = x));
      if (cose.includes("piano")) p.push(db.doc("impostazioni", "messaggi").then(x => st.messaggi = x), db.doc("impostazioni", "promemoria").then(x => st.promemoria = x));
      if (cose.includes("sera")) p.push(db.doc("impostazioni", "messaggi").then(x => st.messaggi = x), db.doc("importazioni", "registro-sofia").then(x => st.registro = x), db.guastiAperti().then(x => st.manutenzione = x), db.doc("impostazioni", "chat").then(x => st.chat = x));
      if (cose.includes("argon")) p.push(db.doc("impostazioni", "argon").then(x => st.argon = x));
      await Promise.all(p);
    };
    if (serve.piano || serve.allarme || serve.bollettino || serve.ponte) ps = await db.doc("importazioni", "push-sofia");
    const puoMe = tgMe || (!!push && !!ps && !!ps.vapidPublic && iscrizioni().length > 0);
    const servono = new Set(["base"]);
    if (serve.piano) servono.add("piano");
    if (serve.chiusura) servono.add("argon");
    if (serve.bollettino) servono.add("sera");
    if (serve.piano || serve.arrivi || serve.allarme || serve.chiusura || serve.bollettino) await carica(...servono);
    const k = st.pulizie ? casa(st) : null;

    if (serve.piano) {
      const alGruppo = puoGruppo && a.pianoMattina !== false;
      if (a.ultimoPiano === oggi) { fatti.piano = "app"; }
      else if (!k.delGiorno(oggi).length) { fatti.piano = "vuoto"; }
      else if (!alGruppo && !puoMe) { fatti.piano = "spento"; }
      else {
        if (alGruppo) {
          await db.merge("impostazioni", "avvisi", { ultimoPiano: oggi });   // prima il segno, come l'app: niente doppioni
          await manda(a.chat, testoPianoGiorno(st, oggi), "piano del giorno alle signore");
        }
        fatti.piano = t.hhmm;
        if (puoMe) {
          const n = k.signore().map(z => { const c = k.delGiorno(oggi, z.id).filter(p => p.stato !== "fatta").length; return c ? `${k.SIG(z.id)} ${c}` : ""; }).filter(Boolean).join(", ");
          const arr = [...new Set(k.arriviDi(oggi))].map(c => k.camera(c).nome);
          await mandaMe(`${alGruppo ? "☀️ Piano mandato alle signore" : "☀️ Oggi"}: ${n}.${arr.length ? ` Arrivi oggi: ${arr.join(", ")}.` : ""}`, "tre righe al titolare", "Sofia · il piano di oggi");
        }
      }
    }
    if (serve.arrivi) {
      const ls = arriviNonPronti(st, oggi);
      if (ls.length && puoGruppo && a.giroSolleciti !== false) {
        const chi = [...new Set(ls.map(p => p.zona).filter(Boolean))].map(z => k.tag(z));
        await manda(a.chat, `${chi.length ? chi.join(" ") + " " : ""}per prima cosa: ${ls.map(p => k.camera(p.camera).nome).join(", ")} — oggi ${ls.length === 1 ? "arriva un ospite" : "arrivano ospiti"}. Le camere che restano vuote stanotte possono aspettare. Grazie! 🙂`, "priorità agli arrivi di oggi");
      }
      fatti.arrivi = ls.length ? t.hhmm : "niente";
    }
    if (serve.allarme) {
      const ls = arriviNonPronti(st, oggi);
      if (ls.length && puoMe) await mandaMe(`⚠️ ${ls.map(p => k.camera(p.camera).nome).join(", ")}: oggi ${ls.length === 1 ? "arriva un ospite e la camera non risulta" : "arrivano ospiti e le camere non risultano"} ancora ${ls.length === 1 ? "pronta" : "pronte"}.`, "avviso arrivi al titolare", "Sofia · camera non pronta", true);
      fatti.allarme = ls.length ? t.hhmm : "niente";
    }
    if (serve.chiusura) {
      const argon = !!(st.argon && st.argon.attivo);
      const perZona = {};
      for (const p of k.delGiorno(oggi)) if ((p.stato === "da_fare" || p.stato === "in_corso" || !p.stato) && p.zona) (perZona[p.zona] = perZona[p.zona] || []).push(k.camera(p.camera).nome);
      const righe = Object.entries(perZona).map(([z, cs]) => `${k.tag(z)} ti ${cs.length === 1 ? "risulta" : "risultano"} ancora da segnare: ${[...new Set(cs)].join(", ")}.`);
      if (righe.length && puoGruppo && a.giroSolleciti !== false) await manda(a.chat, `${righe.join("\n")}\nSe ${righe.length === 1 && Object.values(perZona)[0].length === 1 ? "l'hai finita" : "le hai finite"}, tocca ${argon ? "«HO FINITO»" : "«Fatto»"} nell'app, così ti si segna il lavoro 🙂`, "promemoria delle pulizie da segnare");
      fatti.chiusura = righe.length ? t.hhmm : "niente";
    }
    if (serve.bollettino) {
      if (puoMe && a.giroBollettino !== false) await mandaMe(testoBollettino(st, oggi, domani), "bollettino della sera", "Sofia · il bollettino della sera");
      fatti.bollettino = puoMe ? t.hhmm : "spento";
    }
    if (serve.ponte) {
      const ponti = Object.values(await db.tutti("ponti") || {}).filter(p => p && Number(p.vivo));
      if (ponti.length) {
        const vivo = Math.max(...ponti.map(p => Number(p.vivo)));
        if (adesso.getTime() - vivo > 40 * 60 * 1000) {
          if (puoMe) await mandaMe(`📵 Il ponte WhatsApp non dà segni dalle ${oraRoma(new Date(vivo)).hhmm}: il PC è acceso? Finché è spento, i messaggi del gruppo aspettano.`, "avviso ponte spento", "Sofia · il ponte WhatsApp");
          fatti.ponte = t.hhmm;
        }
      } else fatti.ponte = "nessun ponte";
    }
  }
  // 1.18.0: Sofia legge le chat anche ad app chiusa (a ogni giro, se il ponte ha portato posta nuova)
  let lettura = null;
  try {
    const prendiBase = async () => {
      const [camereDoc, squadra, ruoli] = await Promise.all([db.doc("impostazioni", "camere"), db.doc("impostazioni", "squadra"), db.tutti("ruoli")]);
      const k = casa({ camereDoc, squadra, ruoli, avvisi: a });
      return { camere: k.camere, signore: k.signore().map(z => ({ id: z.id, nome: k.SIG(z.id), zona: z.nome || "" })) };
    };
    lettura = await leggiChat({ db, gemini, adesso, a, letturaTs: Number(stato0 && stato0.letturaTs) || 0, oggi, prendiBase });
    if (lettura.avvisa) { if (!ps) ps = await db.doc("importazioni", "push-sofia"); await mandaMe(lettura.avvisa.testo, "lettura delle chat", lettura.avvisa.titolo, true, { url: "./index.html?lettura=1", lettura: true, tag: "sofia-lettura" }); }
    else if (lettura.esito && /^(letto|niente da leggere|non riuscita)/.test(lettura.esito)) esiti.push(`lettura delle chat: ${lettura.esito}`);
    if (lettura.credito && fatti.creditoAvvisato !== oggi) {
      if (!ps) ps = await db.doc("importazioni", "push-sofia");
      await mandaMe("Non riesco a leggere le chat: il credito di Gemini è finito. Ricaricalo su aistudio.google.com/billing (intanto i messaggi aspettano).", "avviso credito finito", "Sofia · credito finito", true);
      fatti.creditoAvvisato = oggi;
    }
  } catch (e) { console.warn("lettura delle chat:", e && e.message); esiti.push("lettura delle chat: errore " + String((e && e.message) || e).slice(0, 80)); }
  const vecchi = Array.isArray(stato0 && stato0.esiti) ? stato0.esiti : [];
  const notevole = lettura && !/^(niente di nuovo|aspetto|aspetta|la sta leggendo)/.test(lettura.esito || "");
  const letturaInfo = notevole ? { quando: adesso.toISOString(), esito: lettura.esito, n: lettura.n || 0 } : ((stato0 && stato0.lettura) || null);
  await db.merge("importazioni", "giro-sofia", { giorno: oggi, fatti, ultimo: adesso.toISOString(), versione: VERSIONE_GIRO, letturaTs: lettura && lettura.ts ? lettura.ts : (Number(stato0 && stato0.letturaTs) || 0), ...(letturaInfo ? { lettura: letturaInfo } : {}), esiti: [...vecchi, ...esiti.map(cosa => ({ quando: adesso.toISOString(), cosa }))].slice(-30) });
  return { ora: t.hhmm, giorno: oggi, fatti, esiti, lettura: lettura ? lettura.esito : null };
}

// ---- il mondo vero: Firestore (firebase-admin) e Telegram ----------------------------------------------
export function dbAdmin(fs) {
  const comeOggetto = (s) => { const o = {}; s.forEach(d => { o[d.id] = { id: d.id, ...d.data() }; }); return o; };
  return {
    doc: async (c, id) => { const s = await fs.collection(c).doc(id).get(); return s.exists ? { id: s.id, ...s.data() } : null; },
    tutti: async (c) => comeOggetto(await fs.collection(c).get()),
    pulizieDi: async (giorni) => comeOggetto(await fs.collection("pulizie").where("data", "in", giorni).get()),
    soggiorniDa: async (iso) => comeOggetto(await fs.collection("soggiorni").where("fine", ">=", iso).get()),
    guastiAperti: async () => comeOggetto(await fs.collection("manutenzione").where("stato", "!=", "fatto").get()),
    merge: (c, id, dati) => fs.collection(c).doc(id).set(dati, { merge: true }),
    salva: (c, id, dati) => fs.collection(c).doc(id).set(dati),
    postaDa: async (ts) => comeOggetto(await fs.collection("posta").where("ts", ">=", ts).get()),   // 1.18.0
    sostituisci: (c, id, campo, valore) => fs.collection(c).doc(id).update({ [campo]: valore }),
  };
}
// 1.17.0: un avviso sul telefono (Web Push). Le chiavi VAPID le ha create l'app nel telefono del titolare (importazioni/push-sofia).
export function pushVero(webpush) {
  return async (chiavi, sub, dati) => {
    try {
      // 1.17.1: sempre "high": con "normal" Android, a telefono fermo, può tenere l'avviso da parte anche per ore
      const r = await webpush.sendNotification(sub, JSON.stringify({ titolo: dati.titolo, testo: String(dati.testo || "").slice(0, 1800), ...(dati.url ? { url: dati.url } : {}), ...(dati.lettura ? { lettura: true } : {}), ...(dati.tag ? { tag: dati.tag } : {}) }), { TTL: 6 * 3600, urgency: "high", vapidDetails: { subject: "https://michelepegoli2210-hub.github.io/pulizie-stanze-ricci/", publicKey: chiavi.vapidPublic, privateKey: chiavi.vapidPrivato } });
      return { ok: true, stato: (r && r.statusCode) || null };
    } catch (e) { const s = e && e.statusCode; console.warn("avviso sul telefono:", s || (e && e.message), e && e.body ? String(e.body).slice(0, 200) : ""); return { ok: false, finita: s === 404 || s === 410, stato: s || null }; }
  };
}
// 1.17.1: «solo un avviso di prova» a ogni telefono del titolare (dal tasto Run workflow, casella «prova»). Niente giro.
export async function provaAvviso({ db, push, adesso = new Date() }) {
  const t = oraRoma(adesso);
  const ps = await db.doc("importazioni", "push-sofia");
  const lista = Object.entries((ps && ps.iscrizioni) || {}).filter(([, v]) => v && v.sub && v.sub.endpoint && (v.chi || "titolare") === "titolare");
  if (!ps || !ps.vapidPublic || !ps.vapidPrivato || !lista.length) return { ora: t.hhmm, prova: "nessun telefono con gli avvisi accesi" };
  const esiti = [], finite = [];
  for (const [id, v] of lista) {
    const r = await push(ps, v.sub, { titolo: "Sofia · prova", testo: `🔔 Prova delle ${t.hhmm}: se leggi questo, gli avvisi automatici di Sofia arrivano su questo telefono.`, urgente: true });
    esiti.push({ telefono: v.nome || id, ok: !!(r && r.ok), stato: (r && r.stato) || null });
    if (r && r.finita) finite.push(id);
  }
  if (finite.length) await db.sostituisci("importazioni", "push-sofia", "iscrizioni", Object.fromEntries(Object.entries(ps.iscrizioni || {}).filter(([id]) => !finite.includes(id))));
  const st = await db.doc("importazioni", "giro-sofia");
  const vecchi = Array.isArray(st && st.esiti) ? st.esiti : [];
  await db.merge("importazioni", "giro-sofia", { esiti: [...vecchi, { quando: adesso.toISOString(), cosa: `prova avviso: partiti ${esiti.filter(e => e.ok).length} su ${esiti.length}` }].slice(-30) });
  return { ora: t.hhmm, prova: esiti, tolte: finite.length };
}
export async function telegramVero(token, chat, testo) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: testo, disable_web_page_preview: true }) });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) console.warn("telegram:", j.description || r.status);
    return !!j.ok;
  } catch (e) { console.warn("telegram:", e.message); return false; }
}
async function main() {
  const sa = String(process.env.FIREBASE_SA || "").trim();
  if (!sa) { console.log("Sofia sempre accesa: manca la chiave FIREBASE_SA (GitHub → Settings → Secrets and variables → Actions). Il giro non parte."); return; }
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  initializeApp({ credential: cert(JSON.parse(sa)) });
  const webpush = (await import("web-push")).default;
  if (String(process.env.PROVA_AVVISO || "") === "true") {
    const r = await provaAvviso({ db: dbAdmin(getFirestore()), push: pushVero(webpush) });
    console.log("Sofia sempre accesa (solo avviso di prova):", JSON.stringify(r));
    return;
  }
  const chiave = String(process.env.GEMINI_CHIAVE || "").trim();
  const esito = await giro({ db: dbAdmin(getFirestore()), telegram: telegramVero, push: pushVero(webpush), adesso: new Date(), gemini: chiave ? { chiave } : null });
  console.log("Sofia sempre accesa:", JSON.stringify(esito));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error("Sofia sempre accesa: errore", e && e.message); process.exitCode = 1; });
