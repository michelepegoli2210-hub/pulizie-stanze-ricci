// ============================================================================
//  L'OROLOGIO: IL TASTO DELL'APP OPPURE «ARRIVATA» / «FINITO» SU WHATSAPP (giro 1.35.0, app 1.78.0)
//  Michele, 11/11: «non possiamo pagare così, così arrotondati sempre. Dobbiamo pagare più precisamente, o almeno i
//  controlli» · «va bene orologio di WhatsApp… però ci deve stare una sorta di timer» · «anche dall'applicazione possono
//  premere il timer, oppure "sono arrivata all'albergo"».
//  L'orologio è uno, i modi per farlo partire sono due: il tasto «Sono arrivata» dell'app, oppure «arrivata» scritto su
//  WhatsApp (e «finito» quando si va via), mattina e pomeriggio, in qualsiasi casa. A ogni giro, senza IA:
//   - si guardano solo i messaggi dell'ultima ora (di solito nessuno); i timbri di oggi e di ieri restano scritti nel registro
//     del giro (importazioni/giro-sofia.orario), così non si rilegge tutta la posta. Si rilegge tutto oggi e ieri una volta al
//     giorno dopo le 7, se il ponte è tornato dopo una pausa, e ogni mezz'ora finché c'è un turno a metà (il ponte può portare
//     un messaggio in ritardo, con la sua ora di allora);
//   - i timbri si mettono in coppia insieme ai tasti dell'app (visti/<zona>_<giorno>: arrivoOra, finitoOra): «Sono arrivata»
//     nell'app e «finito» su WhatsApp fanno un turno, e viceversa. Un turno fatto tutto coi tasti dell'app si conta già da solo;
//   - per ogni turno passato da WhatsApp nasce UNA scheda della Segreteria (importazioni/segreteria_or_…) con UNA proposta:
//     «9:07 → 10:52 = 1 ora e 45 min», coi minuti esatti. Resta il «Sì» di Michele: i soldi non si toccano da soli. Il
//     lavoro di quel giorno accanto alle ore (il controllo) lo scrive l'app. Niente foto: Michele non le vuole;
//   - «una sorta di timer»: in impostazioni/timer-wa (lo leggono anche le signore) i turni di oggi passati da WhatsApp e
//     quello ancora aperto: la loro app mostra «Dalle 9:07» col tempo che scorre. È solo da vedere;
//   - «finito» senza «arrivata», o «arrivata» senza «finito» (il giorno dopo, dalle 7): una cosa in «Da fare tu» che suona
//     UNA volta sola («Metti tu le ore di …»).
//  Per le proposte non manda notifiche (basta il numerino della Segreteria). Nel registro pubblico solo quanti: mai nomi.
// ============================================================================
import * as L from "../logica.js";
import * as LET from "../lettura.js";

export const MARGINE_MS = 60 * 60 * 1000;      // i messaggi che il ponte porta in ritardo: si riguarda fino a un'ora prima dell'ultimo visto
export const PIENO_OGNI_MS = 30 * 60 * 1000;   // dopo una pausa del ponte si rilegge tutto oggi e ieri, al massimo ogni mezz'ora
export const ORA_CONTROLLO = 7 * 60;           // dalle 7 si chiudono i conti di ieri
export const ASPETTA_MS = 15 * 60 * 1000;      // un «finito» senza «arrivata» aspetta un quarto d'ora (l'«arrivata» può arrivare dopo)
export const TOLLERA_MS = 5 * 60 * 1000;       // un turno che il timer dell'app ha già (quasi) tutto non si propone
const idDoc = (s) => String(s || "").replace(/[^A-Za-z0-9_-]/g, "").slice(-40) || "x";
export const oreTesto = (m) => { m = Math.round(Number(m) || 0); const h = Math.floor(m / 60), r = m % 60; return h ? `${h} ${h === 1 ? "ora" : "ore"}${r ? ` e ${r} min` : ""}` : `${r} min`; };
const giornoParola = (g) => L.dataMedia(g);   // il giorno scritto per intero («mer 11 nov»): la scheda si legge anche nei giorni dopo
const iso = (ms) => new Date(ms).toISOString();
const msgDi = (x, nome) => ({ id: String(x.id || ""), chat: x.fonte === "app" ? "app" : (x.chat || ""), chi: nome, mio: false, data: x.giorno || "", ora: x.ora || "", tipo: "testo", testo: x.fonte === "app" ? (x.tipo === "arrivo" ? "(tasto «Sono arrivata» dell'app)" : "(tasto HO FINITO dell'app)") : String(x.testo || "").slice(0, 200) });

// la scheda con la proposta di un turno. «eventi» = l'arrivo e la fine (per far vedere i messaggi)
export function schedaTurno(tu, { nome, adesso, oggi, eventi = [] }) {
  const daApp = tu.fonteInizio === "app" ? "inizio" : tu.fonteFine === "app" ? "fine" : "";
  const lid = "or_" + idDoc(daApp === "fine" ? tu.idArrivo : tu.idFine) + (daApp === "fine" ? "_t" : "");
  const v = { k: "or0", zona: tu.zona, giorno: tu.giorno, minuti: tu.minuti, suoi: tu.minuti, lid, timbro: true, inizio: iso(tu.inizio), fine: iso(tu.fine), dalle: tu.dalle, alle: tu.alle, ...(daApp ? { daApp } : {}), dove: "", chi: nome, messaggio: `${tu.dalle}–${tu.alle}`, scelta: true };
  const messaggi = eventi.filter(Boolean).map(x => msgDi(x, nome));
  return { lid, doc: { lid, quando: adesso.toISOString(), da: "giro", orologio: true, esito: "fatta", n: messaggi.length, messaggi, capito: { risposta: "", righe: [] }, fatti: [], domande: [], non: [], perTe: [],
    proposte: [{ k: "p0", testo: `⏱️ ${nome} ${giornoParola(tu.giorno)}: ${tu.dalle} → ${tu.alle} = ${oreTesto(tu.minuti)}`, perche: "Le metto nella paga di quel giorno?", ore: JSON.stringify(v), esito: "" }] } };
}
// la scheda di un timbro rimasto solo: una cosa in «Da fare tu», che suona una volta
export function schedaSolo(x, { nome, adesso, oggi, cosa }) {
  const lid = "or_" + idDoc(x.id) + (cosa === "aperto" ? "_a" : "_f");
  const quando = giornoParola(x.giorno);
  const testo = cosa === "aperto" ? `Metti tu le ore di ${nome} di ${quando}: è arrivata alle ${x.ora} ma non ha scritto «finito»` : `Metti tu le ore di ${nome} di ${quando}: ha scritto «finito» alle ${x.ora} ma non «arrivata»`;
  const messaggi = [msgDi(x, nome)];
  return { lid, doc: { lid, quando: adesso.toISOString(), da: "giro", orologio: true, esito: "fatta", n: messaggi.length, messaggi, capito: { risposta: "", righe: [] }, fatti: [], proposte: [], domande: [], non: [],
    perTe: [{ k: "t0", testo, entro: "", chi: "", msg: "", fatto: "", rimanda: "", unaVolta: true, creato: adesso.toISOString(), orario: { zona: x.zona, giorno: x.giorno } }] } };
}
// i tasti dell'app di una signora in un giorno (il primo turno e i «Sono tornata»): gli eventi e i turni già interi
export async function eventiApp(db, z, g) {
  const eventi = [], chiusi = [], base = L.idVisto(z, g);
  for (const n of [1, 2, 3, 4]) {
    const id = n === 1 ? base : `${base}_${n}`; let v = null;
    try { v = await db.doc("visti", id); } catch (e) {}
    if (!v) { if (n === 1) continue; break; }   // il documento del giorno può mancare (o averlo creato Michele, senza tasti): il «Sono tornata» si guarda lo stesso
    const a = Date.parse(v.arrivoOra || "") || 0, f = Date.parse(v.finitoOra || "") || 0;
    if (a) eventi.push({ zona: z, giorno: g, tipo: "arrivo", ts: a, ora: L.oraBreve(iso(a)), id: `app-${id}-a`, testo: "", fonte: "app" });
    if (f) eventi.push({ zona: z, giorno: g, tipo: "fine", ts: f, ora: L.oraBreve(iso(f)), id: `app-${id}-f`, testo: "", fonte: "app" });
    if (a && f && f > a) chiusi.push([a, f]);
  }
  return { eventi, chiusi };
}
// a ogni giro. «stato» = importazioni/giro-sofia.orario del giro di prima: { ts, dal, ieri, pieno, timbri, chiusi, sospesi, incompleti, mostra }
export async function orarioSignore({ db, adesso, t, prendiBase, stato = null, a = {} }) {
  const s0 = stato && typeof stato === "object" ? stato : {};
  if (a.giroOrario === false) return { esito: "", stato: s0 };
  const ora = adesso.getTime(), oggi = t.iso, ieri = L.aggiungiGiorni(oggi, -1), minutiOggi = Number(t.minuti) || 0;
  // LA PRIMA VOLTA non si guarda indietro: i «finito» scritti prima che le signore sapessero dell'orologio non sono timbri. Si
  // segna solo da quando si parte («dal»): tutto quello che è stato scritto prima non conta, nemmeno nelle riletture complete.
  if (!Number(s0.ts)) return { esito: "", stato: { ts: ora, dal: ora, ieri: oggi, pieno: ora, sospesi: 0, incompleti: 0, mostra: "", timbri: [], chiusi: [] } };
  const prima = { ts: Number(s0.ts) || 0, dal: Number(s0.dal) || 0, ieri: String(s0.ieri || ""), pieno: Number(s0.pieno) || 0, sospesi: Number(s0.sospesi) || 0, incompleti: Number(s0.incompleti) || 0, mostra: String(s0.mostra || ""),
    timbri: (Array.isArray(s0.timbri) ? s0.timbri : []).filter(x => x && x.id && x.zona && Number(x.ts) && x.giorno >= ieri && x.giorno <= oggi),
    chiusi: (Array.isArray(s0.chiusi) ? s0.chiusi : []).map(String).slice(-80) };
  const controllaIeri = prima.ieri !== oggi && minutiOggi >= ORA_CONTROLLO;   // una volta al giorno, dal primo giro dopo le 7
  const inizioIeri = ora - (minutiOggi + 24 * 60 + 5) * 60000;
  // 1) i messaggi nuovi: dall'ultimo visto meno un'ora. Tutto oggi e ieri: la prima volta, una volta al giorno, dopo una pausa
  //    del ponte e, al massimo ogni mezz'ora, finché c'è un turno a metà (un'«arrivata» aperta, un «finito» solo): il ponte può
  //    portare un messaggio vecchio in ritardo, con la sua ora di allora
  let tutto = !prima.ts || controllaIeri || ((prima.sospesi > 0 || prima.incompleti > 0) && ora - prima.pieno >= PIENO_OGNI_MS);
  let posta = Object.values((await db.postaDa(tutto ? inizioIeri : Math.max(inizioIeri, prima.ts - MARGINE_MS))) || {}).filter(Boolean);
  if (!tutto && posta.some(p => p.storico && !p.mio) && ora - prima.pieno >= PIENO_OGNI_MS) { tutto = true; posta = Object.values((await db.postaDa(inizioIeri)) || {}).filter(Boolean); }
  const ultimoTs = Math.max(prima.ts, ...posta.map(p => Number(p.ts) || 0));
  const noti = new Set(prima.timbri.map(x => String(x.id)));
  const candidati = posta.filter(p => p.id && !p.mio && Number(p.ts) >= prima.dal && !noti.has(String(p.id)) && LET.timbroDi(p.tipo === "testo" ? p.testo : p.tipo === "audio" ? p.trascrizione : ""));
  const s1 = { ...prima, ts: ultimoTs, ...(tutto ? { pieno: ora } : {}), ...(controllaIeri ? { ieri: oggi } : {}) };
  if (!candidati.length && !prima.sospesi && !controllaIeri) return { esito: "", stato: s1 };
  // 2) chi sono le signore, i timbri di oggi e di ieri
  let base = null; const signore = async () => ((base || (base = (await prendiBase()) || {})).signore) || [];
  const nomeDi = async (z) => ((await signore()).find(s => s.id === z) || {}).nome || z;
  const nuovi = candidati.length ? LET.timbriDa(candidati, await signore()).filter(x => x.giorno >= ieri && x.giorno <= oggi) : [];
  const timbri = [...prima.timbri, ...nuovi.map(x => ({ id: x.id, zona: x.zona, giorno: x.giorno, tipo: x.tipo, ts: x.ts, ora: x.ora, testo: x.testo, chat: x.chat, fonte: "wa", ...(x.voce ? { voce: true } : {}) }))].sort((x, y) => x.ts - y.ts);
  // 3) le coppie: prima solo WhatsApp, poi insieme ai tasti dell'app dove serve (un turno nuovo, un arrivo aperto, un «finito» solo)
  const chiusi = new Set(prima.chiusi);
  const lidTurno = (tu) => schedaTurno(tu, { nome: "", adesso, oggi }).lid;
  let r = LET.turniDaTimbri(timbri);
  const servono = [...new Set([...r.aperti, ...r.orfani, ...r.turni.filter(tu => !chiusi.has(lidTurno(tu)))].filter(x => x.giorno >= ieri).map(x => `${x.zona}|${x.giorno}`))];
  const app = [], appChiusi = {};
  for (const k of servono) { const [z, g] = k.split("|"); const e = await eventiApp(db, z, g); app.push(...e.eventi); appChiusi[k] = e.chiusi; }
  if (app.length) r = LET.turniDaTimbri([...timbri, ...app]);
  const evento = (id) => [...timbri, ...app].find(x => x.id === id) || null;
  const esiste = async (lid) => { if (chiusi.has(lid)) return true; let d = null; try { d = await db.doc("importazioni", "segreteria_" + lid); } catch (e) {} if (d) chiusi.add(lid); return !!d; };
  const nuove = [], ritira = []; let sospesi = 0;
  for (const tu of r.turni) {
    if (tu.giorno < ieri || (tu.fonteInizio === "app" && tu.fonteFine === "app")) continue;   // tutto coi tasti dell'app: si conta già da solo
    const k = `${tu.zona}|${tu.giorno}`;
    if ((appChiusi[k] || []).some(([a1, b1]) => Math.min(tu.fine, b1) - Math.max(tu.inizio, a1) >= (tu.fine - tu.inizio) - TOLLERA_MS)) { chiusi.add(lidTurno(tu)); continue; }   // lo stesso turno segnato due volte: il timer dell'app l'ha già
    const s = schedaTurno(tu, { nome: await nomeDi(tu.zona), adesso, oggi, eventi: [evento(tu.idArrivo), evento(tu.idFine)] });
    if (await esiste(s.lid)) continue;
    nuove.push(s); chiusi.add(s.lid);
    for (const vecchia of ["or_" + idDoc(tu.idFine) + "_f", "or_" + idDoc(tu.idArrivo) + "_a"]) if (chiusi.has(vecchia)) ritira.push(vecchia);   // era nato un avviso «manca…»: non serve più
  }
  for (const x of r.orfani) {
    if (x.fonte === "app" || x.giorno < ieri) continue;
    if (ora - x.ts < ASPETTA_MS) { sospesi++; continue; }
    const s = schedaSolo(x, { nome: await nomeDi(x.zona), adesso, oggi, cosa: "orfano" });
    if (await esiste(s.lid)) continue;
    nuove.push(s); chiusi.add(s.lid);
  }
  for (const x of r.aperti) {
    if (x.fonte === "app" || x.giorno < ieri) continue;
    if (x.giorno === oggi) { sospesi++; continue; }   // è al lavoro: si riguarda al prossimo giro (può toccare HO FINITO nell'app)
    if (minutiOggi < ORA_CONTROLLO) { sospesi++; continue; }
    const s = schedaSolo(x, { nome: await nomeDi(x.zona), adesso, oggi, cosa: "aperto" });
    if (await esiste(s.lid)) continue;
    nuove.push(s); chiusi.add(s.lid);
  }
  // 4) il timer da far vedere nell'app delle signore: i turni di oggi passati da WhatsApp e quello ancora aperto
  const wa = {};
  for (const tu of r.turni) if (tu.giorno === oggi && !(tu.fonteInizio === "app" && tu.fonteFine === "app")) (wa[tu.zona] = wa[tu.zona] || { turni: [], aperto: null }).turni.push({ dalle: tu.dalle, alle: tu.alle, minuti: tu.minuti, inizio: iso(tu.inizio), fine: iso(tu.fine) });
  for (const x of r.aperti) {
    if (x.giorno !== oggi || x.fonte === "app") continue;
    const dopo = r.turni.some(tu => tu.zona === x.zona && tu.giorno === oggi && tu.inizio > x.ts) || r.aperti.some(y => y !== x && y.zona === x.zona && y.giorno === oggi && y.ts > x.ts);
    if (!dopo) (wa[x.zona] = wa[x.zona] || { turni: [], aperto: null }).aperto = { dalle: x.ora, inizio: iso(x.ts) };
  }
  const mostra = JSON.stringify({ giorno: oggi, wa });
  let n = 0;
  for (const s of nuove) { try { await db.salva("importazioni", "segreteria_" + s.lid, s.doc); n++; } catch (e) { chiusi.delete(s.lid); console.warn("turni:", e && e.message); } }
  for (const lid of ritira) { try { await db.merge("importazioni", "segreteria_" + lid, { perTe: [], esito: "sostituita" }); } catch (e) { console.warn("turni/ritira:", e && e.message); } }
  let mostrato = prima.mostra;
  if (mostra !== prima.mostra) { try { await db.salva("impostazioni", "timer-wa", { giorno: oggi, wa, agg: adesso.toISOString() }); mostrato = mostra; } catch (e) { console.warn("turni/timer:", e && e.message); } }
  const nt = nuove.filter(s => s.doc.proposte.length).length, ni = nuove.length - nt;
  const esito = nuove.length ? `turni delle signore: ${[nt ? `${nt} ${nt === 1 ? "turno da confermare" : "turni da confermare"}` : "", ni ? `${ni} ${ni === 1 ? "turno incompleto" : "turni incompleti"}` : ""].filter(Boolean).join(", ")}` : "";
  const incompleti = r.orfani.filter(x => x.fonte !== "app" && x.giorno === oggi).length;
  return { esito, n, stato: { ...s1, timbri: timbri.slice(-60), chiusi: [...chiusi].slice(-80), sospesi, incompleti, mostra: mostrato } };
}
