// ============================================================================
//  LETTURA.JS  ·  1.18.0 · come Sofia legge le chat di WhatsApp (il prospetto di papà e il resto)
//  Prima queste funzioni stavano dentro app.js e servivano solo all'app aperta. Adesso le usa ANCHE il giro sempre
//  acceso (sofia-giro, su GitHub), che legge i messaggi del ponte quando l'app è chiusa: così la richiesta a Gemini
//  è la stessa, parola per parola, chiunque la faccia. Niente pagina, niente database: solo testo.
//  Il "contesto" (ctx) lo prepara chi chiama:
//   { oggi, camere:[{id,nome,tipo,via,zona}], soggiorni:[{camera,nome,persone,tipo,inizio,fine,nota}], clienti:{id:{nome}},
//     signore:[{id,nome}], nomeGov, nomeMio, alias:{camera:[modi di dirla]}, tipiOspite, taccuino:"testo per l'IA",
//     chatPrivate:["Papà","Selly",...] }
//  I nomi degli ospiti che l'app conosce partono come codici [O1], [O2]... (aCodici) e tornano nomi (daCodici);
//  telefoni ed email non partono mai (segnaposto [telefono1], [email]).
// ============================================================================
import * as L from "./logica.js";
import * as PAROLE from "./parole.js";

const NUCLEO_RE = /\s*[·,;(\/]\s*|\s+-\s+/;
export function nucleoNome(n) { return String(n || "").split(NUCLEO_RE)[0].replace(/\d.*$/, "").replace(/\s+/g, " ").trim(); }

// ---- i codici degli ospiti ---------------------------------------------------------------------------------------------
export function creaCodici(ctx) {
  const sog = ctx.soggiorni || [], cl = ctx.clienti || {};
  const via = new Set([...(ctx.camere || []).map(c => PAROLE.norm(c.nome)), ...(ctx.camere || []).map(c => PAROLE.norm(c.id)), ...(ctx.signore || []).map(z => PAROLE.norm(z.nome)), PAROLE.norm(ctx.nomeGov || ""), PAROLE.norm(ctx.nomeMio || ""),
    "michele", "papa", "ospiti", "ospite", "operai", "operaio", "tecnici", "tecnico", "booking", "famiglia", "signora", "signor", "ditta", "coppia", "libera", "libero", "zara", "trento", "via"]);
  const nuclei = new Map();
  const metti = (grezzo) => { const n = nucleoNome(grezzo); if (n.length < 2 || /^\?|^(ospit|qualcun|nessun)/i.test(n) || via.has(PAROLE.norm(n))) return; const k = PAROLE.norm(n); if (k && !nuclei.has(k)) nuclei.set(k, n); };
  for (const s of sog) metti(s.nome);
  for (const [k, v] of Object.entries(cl)) metti((v && v.nome) || k);
  const elenco = [...nuclei.entries()].sort((a, b) => a[1].localeCompare(b[1], "it"));
  const nomi = new Map(), codice = new Map();
  elenco.forEach(([k, n], i) => { const c = `[O${i + 1}]`; nomi.set(c, n); codice.set(k, c); });
  const cand = [];
  const aggiungi = (testo, c) => { const t = String(testo || "").trim(); if (t.length >= 2 && c) cand.push({ t, c }); };
  for (const [k, n] of elenco) aggiungi(n, codice.get(k));
  for (const s of sog) { const c = codice.get(PAROLE.norm(nucleoNome(s.nome))); if (c) aggiungi(String(s.nome || "").trim(), c); }
  // le parole lunghe del nome ("Rega Enzo" -> "Rega", "Enzo"), solo con la maiuscola e solo se sono di un ospite solo
  const parole = new Map();
  for (const [k, n] of elenco) for (const w of n.split(/\s+/)) {
    if (w.length < 4 || !/^[A-ZÀ-Ý]/.test(w) || via.has(PAROLE.norm(w))) continue;
    const kw = PAROLE.norm(w); if (!parole.has(kw)) parole.set(kw, { w, c: new Set() }); parole.get(kw).c.add(codice.get(k));
  }
  for (const { w, c } of parole.values()) if (c.size === 1) { const cc = [...c][0]; aggiungi(w, cc); if (w !== w.toUpperCase()) aggiungi(w.toUpperCase(), cc); }
  const visti = new Set();
  const regole = cand.filter(x => { const k = x.t + "→" + x.c; if (visti.has(k)) return false; visti.add(k); return true; })
    .sort((a, b) => b.t.length - a.t.length).map(x => {
      const e = x.t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/['’]/g, "['’]").replace(/\s+/g, "\\s+");
      const molte = /\s/.test(x.t);          // piu' parole: maiuscole o minuscole non importa; una parola sola: come e' scritta
      return { re: new RegExp(`(^|[^\\p{L}\\[])(${e})(?=$|[^\\p{L}\\]])`, molte ? "giu" : "gu"), c: x.c };
    });
  const aCodici = (t) => { let x = String(t ?? ""); if (!x) return x; for (const r of regole) x = x.replace(r.re, (m, a) => a + r.c); return x; };
  const daCodici = (t) => String(t ?? "").replace(/\[\s*O\s*(\d{1,4})\s*\]/g, (m, n) => nomi.get(`[O${n}]`) || m);
  const daCodiciProfondo = (v) => { if (typeof v === "string") return daCodici(v); if (Array.isArray(v)) return v.map(daCodiciProfondo); if (v && typeof v === "object") { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = daCodiciProfondo(x); return o; } return v; };
  return { nomi, regole, aCodici, daCodici, daCodiciProfondo };
}
// la "firma" dei codici: se non cambiano i nomi, i codici restano gli stessi (l'app li tiene da parte)
export function firmaCodici(ctx) { return (ctx.soggiorni || []).map(s => s.nome || "").join("|") + "#" + Object.keys(ctx.clienti || {}).join("|"); }

// ---- telefoni ed email: mai a Gemini ---------------------------------------------------------------------------------
export function senzaTelefoni(t) { return String(t || "").replace(/\+?\d(?:[\s.\-]?\d){7,}/g, "[telefono]").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]"); }
// 1.0.6: i telefoni diventano segnaposto numerati ([telefono1], [telefono2]...); la tabella segnaposto -> numero resta a
// chi legge, cosi' Sofia puo' dire di chi e' il numero senza mai vederlo
export function telefoniInSegnaposto(t, mappa) {
  return String(t || "").replace(/\+?\d(?:[\s.\-]?\d){7,}/g, (m) => {
    for (const [k, v] of mappa) if (v === m.trim()) return k;
    const k = `[telefono${mappa.size + 1}]`; mappa.set(k, m.trim()); return k;
  }).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]");
}
// nel JSON di Sofia: il segnaposto del campo "telefono" torna il numero vero (solo li': note e messaggi restano coi segnaposto)
export function rimettiTelefoni(j, mappa) {
  if (!j || !Array.isArray(j.soggiorni)) return j;
  for (const x of j.soggiorni) {
    if (!x || typeof x !== "object") continue;
    const m = /\[\s*telefono\s*(\d{1,3})\s*\]/i.exec(String(x.telefono || ""));
    x.telefono = m && mappa ? (mappa.get(`[telefono${m[1]}]`) || "") : "";
  }
  return j;
}
// il tipo di ospite detto a Sofia: le ditte col loro codice (sono anche clienti col nome), cosi' nessun nome esce in chiaro
export function tipoPerIA(k, ctx, codici) { const t = (ctx.tipiOspite || {})[k]; if (!t) return k || "?"; return k === "ferr" ? "tecnici" : k === "altro" ? "turisti / Booking" : k === "unk" ? "da chiarire" : codici.aCodici("ditta " + t.nome); }
// il prospetto che c'e', camera per camera, coi nomi in codice (per Sofia)
export function prospettoInCodici(ctx, codici, da, a) {
  const per = new Map();
  for (const s of (ctx.soggiorni || []).filter(s => s.fine > da && s.inizio < a).sort((x, y) => x.inizio < y.inizio ? -1 : 1)) { const l = per.get(s.camera) || []; l.push(s); per.set(s.camera, l); }
  return (ctx.camere || []).map(c => {
    const l = per.get(c.id) || [];
    return `- ${c.nome} [${c.id}]: ${l.length ? l.map(s => `${codici.aCodici(s.nome || "?")}${s.persone > 1 ? `, ${s.persone} persone` : ""}, ${tipoPerIA(s.tipo, ctx, codici)}, arriva ${L.dataMedia(s.inizio)} (${s.inizio}) → parte ${L.dataMedia(s.fine)} (${s.fine})${s.nota ? `, nota: ${codici.aCodici(s.nota)}` : ""}`).join(" · ") : "libera"}`;
  }).join("\n");
}

// ---- il taccuino senza nomi di ospiti ---------------------------------------------------------------------------------
export function nomiOspiti(ctx) {
  const via = new Set([...(ctx.camere || []).map(c => PAROLE.norm(c.nome)), ...(ctx.signore || []).map(z => PAROLE.norm(z.nome)), PAROLE.norm(ctx.nomeGov || ""), PAROLE.norm(ctx.nomeMio || ""), "michele", "ospiti", "ospite", "operai", "tecnici", "booking"]);
  const interi = new Set(), parole = new Set();
  const metti = (grezzo) => {
    const n = String(grezzo || "").split(/\s*[·,;(\/]\s*|\s+-\s+/)[0].replace(/\d.*$/, "").trim();
    if (n.length < 3 || /^(ospit|qualcun|nessun|\?)/i.test(n) || via.has(PAROLE.norm(n))) return;
    interi.add(n);
    for (const w of n.split(/\s+/)) if (w.length >= 4 && /^[A-ZÀ-Ý]/.test(w) && !via.has(PAROLE.norm(w))) parole.add(w);
  };
  for (const x of (ctx.soggiorni || [])) metti(x.nome);
  for (const k of Object.keys(ctx.clienti || {})) metti(k);
  const lungo = (a, b) => b.length - a.length;
  return { interi: [...interi].sort(lungo), parole: [...parole].filter(w => !interi.has(w)).sort(lungo) };
}
export function senzaNomiOspiti(t, ctx, nomi = nomiOspiti(ctx)) {
  let x = String(t || "");
  const { interi, parole } = nomi;
  const sost = (n, flag) => { const e = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]"); x = x.replace(new RegExp(`(^|[^\\p{L}])${e}(?=$|[^\\p{L}])`, flag), "$1l'ospite"); };
  for (const n of interi) sost(n, "giu");
  for (const w of parole) sost(w, "gu");
  return x;
}
export function taccuinoPerIA(voci, ctx) {
  const v = (Array.isArray(voci) ? voci : []).filter(y => y && y.testo);
  if (!v.length) return "Ancora vuoto: comincia a segnare le cose che valgono anche in futuro (azione \"ricorda\").";
  const nomi = nomiOspiti(ctx);
  return v.map((y, i) => `M${i + 1} (${L.dataBreve(y.quando)}${y.da === "michele" ? ", scritta da Michele" : ""}): ${senzaNomiOspiti(y.testo, ctx, nomi)}`).join("\n");
}

// ---- le istruzioni per Sofia --------------------------------------------------------------------------------------------
// 1.18.0: le signore coi loro codici; e chi scrive nelle chat con un nome diverso (soprannome, nome e cognome)
export function signoreInParole(ctx) {
  const sig = (ctx.signore || []).filter(z => z && z.id && z.nome);
  if (!sig.length) return "LE SIGNORE DELLE PULIZIE: nessuna segnata nell'app.";
  const righe = sig.map(z => `- ${z.id} = ${z.nome}${z.zona ? ` (${z.zona})` : ""}`);
  const nomiChat = [...new Set((ctx.persone || []).map(x => String(x || "").trim()).filter(x => x && !/^pap[aà]$/i.test(x) && !/michele/i.test(x)))];
  const prime = (s) => PAROLE.norm(s).replace(/\s+/g, "").slice(0, 3);
  const somiglia = [];
  for (const n of nomiChat) {
    const kn = PAROLE.norm(n);
    const z = sig.find(z => { const kz = PAROLE.norm(z.nome); return kz && (kn === kz || kn.split(" ").includes(kz) || (prime(n).length === 3 && prime(n) === prime(z.nome))); });
    if (z && PAROLE.norm(z.nome) !== kn) somiglia.push(`«${n}» è probabilmente ${z.nome} (${z.id})`);
  }
  return `LE SIGNORE DELLE PULIZIE (nel JSON usa questi codici):\n${righe.join("\n")}${somiglia.length ? `\nNelle chat possono avere un altro nome: ${somiglia.join("; ")}.` : ""}`;
}
export function istruzioniLettura(ctx, codici = creaCodici(ctx)) {
  const oggi = ctx.oggi, alias = ctx.alias || {};
  const camere = (ctx.camere || []).map(c => `- ${c.id} = ${c.nome} (${c.tipo === "casa" ? "appartamento" : "camera"}${c.via ? ", " + c.via : ""}${c.zona === "p1" ? ", 1° piano" : c.zona === "p2" ? ", 2° piano" : ""}; si dice anche: ${[...new Set((alias[c.id] || []).filter(x => x !== PAROLE.norm(c.nome)))].slice(0, 7).join(", ") || "—"})`).join("\n");
  const tipi = Object.keys(ctx.tipiOspite || {}).map(k => `${k} = ${tipoPerIA(k, ctx, codici)}`).join("; ");
  const da = L.aggiungiGiorni(oggi, -14), a = L.aggiungiGiorni(oggi, 60);
  const tacc = String(ctx.taccuino || "");
  return `Sei ${ctx.nomeGov}, la governante de "Le Stanze di Ricci" a Lesina. Il PAPÀ di Michele fa il PROSPETTO (chi dorme in quale camera, da che giorno a che giorno) e lo scrive su WhatsApp a modo suo: abbreviazioni, errori, messaggi spezzati in tanti pezzi, correzioni ("no scusa", "anzi"), liste, note vocali trascritte, a volte solo il cognome. Il tuo lavoro è leggere TUTTI i messaggi che ti mando, nell'ordine, e capire ESATTAMENTE:
1) il prospetto aggiornato: chi c'è in ogni camera e in che giorni;
2) le indicazioni per le pulizie e per le signore (cosa fare, dove, quando);
3) come scrive il papà (le sue abitudini), per capirlo sempre meglio;
4) le altre cose importanti delle chat (signore, famiglia, socio): ASSENZE delle signore, GUASTI, cose da COMPRARE, cose da sapere per Michele.

OGGI è ${L.dataGiornoLungo(oggi)} (${oggi}).

LE CAMERE (nel JSON usa SOLO questi codici):
${camere}
Liù, Maria Grazia e via Ancona sono appoggi esterni: NON metterli nei soggiorni.

${signoreInParole(ctx)}

COME SI LEGGE IL PROSPETTO:
- "dal 12 al 16" = arriva il 12, parte la mattina del 16 (la notte del 16 non c'è). La partenza è il giorno in cui lascia la camera.
- Le parole "oggi", "domani", "stasera", "lunedì", "la settimana prossima" valgono rispetto alla DATA DEL MESSAGGIO in cui sono scritte (ogni messaggio ha la sua data tra parentesi quadre), non rispetto a oggi.
- I messaggi più recenti correggono quelli vecchi. Se un soggiorno è stato spostato o disdetto, vale l'ultima cosa detta.
- Tecnici e operai arrivano di solito la domenica sera o il lunedì e partono il venerdì (a volte il sabato). Se per una settimana non dice i giorni, intende da lunedì a venerdì (partenza venerdì).
- "x2", "2p", "2 pax", "in 2" = 2 persone. Una lista di camere con i nomi accanto è il prospetto di quella settimana.
- Tipi di ospite (campo "tipo"): ${tipi}. I tecnici della ferrovia e delle altre ditte sono "ferr", turisti e Booking "altro", se non si capisce "unk".
- Gli ospiti che l'app conosce già sono CODICI tra parentesi quadre, per esempio [O3]: è sempre la stessa persona. Nel JSON riscrivilo IDENTICO; se accanto al codice c'è anche il nome di battesimo (per esempio "[O3] Antonio"), scrivilo tutto: "[O3] Antonio".
- Il NOME DELL'OSPITE scrivilo COMPLETO e preciso, come lo scrive il papà: cognome e nome se ci sono tutti e due, con "Sig.ra", "Famiglia", "Ditta" se li scrive. Non accorciarlo e non inventarlo.
- ATTENZIONE: le CAMERE hanno nomi di persona (Salvatore, Michele, Aurora, Antonio, Lella, Alba, Nicole). "in Antonio", "ad Aurora", "Salvatore:" sono le camere, non gli ospiti: il nome di una camera non va MAI nel campo "nome". Michele è anche il figlio, quello che usa l'app.
- I numeri di telefono li ho tolti io: al loro posto c'è un segnaposto numerato, [telefono1], [telefono2]... Se il telefono è dell'ospite di un soggiorno (scritto accanto al suo nome o nello stesso messaggio), metti il suo segnaposto IDENTICO nel campo "telefono" di quel soggiorno; altrimenti lascia "telefono" vuoto.
- [email] è un indirizzo email tolto apposta.
- Se i messaggi vengono da più chat, davanti c'è la chat tra parentesi tonde: "(chat con Papà)" è la chat privata tra Michele e il papà; un nome da solo, per esempio "(Albergo)", è un gruppo (Albergo = il gruppo dell'albergo con la famiglia e le signore). I messaggi che cominciano con 🎤 sono vocali trascritti (possono avere qualche parola sbagliata: [?] = non si capiva).
- Non inventare niente: se una cosa non è chiara mettila in "dubbi" (con le risposte possibili, così Michele risponde con un tocco) o metti "sicurezza":"bassa".
- Se tra i messaggi c'è "Risposte di Michele ai dubbi", vale quello che dice lui: usalo e non rifare la stessa domanda.

IL PROSPETTO CHE C'È ADESSO NELL'APP (soggiorni dal ${L.dataMedia(da)} al ${L.dataMedia(a)}):
${prospettoInCodici(ctx, codici, da, a)}

IL TACCUINO (cose che Michele mi ha chiesto di ricordare sempre):
${tacc}

RISPONDI SOLO con questo JSON:
{"risposta":"3-5 frasi semplici per Michele: che periodo coprono i messaggi, cosa hai capito, cosa cambia rispetto all'app (e, se ci sono, assenze, guasti e spesa)",
 "soggiorni":[{"camera":"salvatore","nome":"[O3] oppure il nome nuovo completo (cognome e nome)","telefono":"[telefono1] oppure vuoto","persone":2,"arrivo":"AAAA-MM-GG","partenza":"AAAA-MM-GG","tipo":"ferr","nota":"cose da sapere per le pulizie su questo ospite, se dette (altrimenti vuoto)","sicurezza":"alta","dubbio":"","messaggio":"le parole del papà da cui l'hai capito, corte"}],
 "togli":[{"camera":"alba","nome":"[O5]","arrivo":"AAAA-MM-GG","perche":"le parole del papà"}],
 "indicazioni":[{"giorno":"AAAA-MM-GG","camera":"codice della camera oppure vuoto se vale per tutte","testo":"cosa devono fare le signore, scritto semplice e corto","messaggio":"le parole del papà"}],
 "abitudini":["come scrive il papà, per capirlo meglio la prossima volta: una frase corta per ognuna, senza nomi di ospiti"],
 "dubbi":[{"domanda":"domanda corta per Michele su una cosa non chiara","risposte":["2-4 risposte brevi possibili, se si possono indovinare (es. 1 persona, 2 persone)"]}],
 "assenze":[{"signora":"p2","dal":"AAAA-MM-GG","al":"AAAA-MM-GG (uguale a dal se è un giorno solo)","testo":"corto, per Michele (es. Selena sabato non viene)","messaggio":"le sue parole","sicurezza":"alta"}],
 "guasti":[{"camera":"codice della camera oppure vuoto se è un posto comune","cosa":"cosa è rotto o non va, corto (es. la doccia perde)","urgente":false,"chi":"chi l'ha detto","messaggio":"le sue parole"}],
 "spesa":[{"prodotto":"il prodotto che manca, corto (es. detersivo per pavimenti)","signora":"p1 oppure vuoto","chi":"chi l'ha detto","messaggio":"le sue parole"}],
 "note":[{"giorno":"AAAA-MM-GG","testo":"una cosa importante da sapere per Michele, corta","chi":"chi l'ha detto","messaggio":"le sue parole"}]}
REGOLE DEL JSON:
- In "soggiorni" metti TUTTI i soggiorni che secondo i messaggi ci sono con la partenza da ${L.dataMedia(L.aggiungiGiorni(oggi, -3))} in poi, anche quelli già uguali nell'app (il confronto lo faccio io). Una riga per ospite e per periodo. Le camere libere non si mettono.
- In "togli" solo i soggiorni che sono NELL'APP e che i messaggi dicono chiaramente disdetti o finiti prima (camera, codice, data di arrivo come nell'app).
- In "indicazioni" solo cose da fare da oggi in poi (giorno = quando vanno fatte; se non c'è un giorno preciso, il primo giorno utile).
- In "assenze" solo quando una signora dice che NON viene (o non può venire) in un giorno preciso da oggi in poi: "signora" è il suo codice (p1, p2...). Le assenze passate non si mettono.
- In "guasti" le cose rotte o che non funzionano (perdite, scarichi, lampadine, prese, elettrodomestici, serrature, muffa che torna): NON le pulizie da fare (quelle sono "indicazioni"). "urgente": true solo se non si può usare la camera o c'è un pericolo.
- In "spesa" i prodotti che mancano o stanno finendo (detersivi, carta igienica, sacchi, saponi, lampadine...).
- In "note" solo le cose importanti per Michele che non vanno da nessun'altra parte (per esempio un appuntamento, chi porta le chiavi, un ospite che chiede qualcosa). Niente saluti e chiacchiere.
- Se nei messaggi dopo una cosa risulta già fatta o risolta ("ho comprato il detersivo", "aggiustato", "allora vengo"), non metterla.
- Le date sempre nel formato AAAA-MM-GG. "sicurezza": "alta", "media" o "bassa".`;
}

// i messaggi scelti, pronti per Sofia: "[gio 23 ott 09:12] Papà: ..." (coi nomi noti in codice e senza telefoni)
export function testoPerLettura(messaggi, papa, ctx, codici = creaCodici(ctx)) {
  // chi scrive: "Papà" per chi fa il prospetto, "Michele" per lui; gli altri col nome della rubrica (signore, famiglia)
  const chi = (x) => {
    if (!x) return "";
    if (papa && x === papa) return "Papà";
    if (/michele/i.test(x) || x === ctx.nomeMio) return "Michele";
    return codici.aCodici(x).slice(0, 30);
  };
  const telefoni = new Map();
  const righe = messaggi.map(m => `${m.data ? `[${L.dataMedia(m.data)}${m.ora ? " " + m.ora : ""}] ` : ""}${m.chat ? `(${m.chat}) ` : ""}${m.chi ? chi(m.chi) + ": " : ""}${telefoniInSegnaposto(codici.aCodici(m.testo), telefoni)}`);
  let testo = righe.join("\n"), tagliati = 0;
  const MAX = 140000;
  while (testo.length > MAX && righe.length > 20) { righe.shift(); tagliati++; testo = righe.join("\n"); }
  return { testo, tagliati, telefoni };
}
export function jsonDaRisposta(txt) {
  const p = String(txt || "").replace(/```(?:json)?/gi, "").trim();
  try { return JSON.parse(p); } catch (e) {}
  const a = p.indexOf("{"), b = p.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(p.slice(a, b + 1)); } catch (e) {} }
  return null;
}
// i vocali: Gemini li trascrive 6 per volta, parola per parola
export function istruzioniTrascrizione(nomiCamere, n) {
  return `Trascrivi in italiano, parola per parola, questi ${n} messaggi vocali di WhatsApp, nell'ordine in cui te li mando. Sono di una famiglia che gestisce un piccolo albergo a Lesina: parlano di camere (${nomiCamere}), di ospiti (cognomi), di giorni, date, pulizie. Non riassumere e non inventare: se una parola non si capisce scrivi [?]. Rispondi SOLO con questo JSON: {"vocali":["trascrizione del primo","trascrizione del secondo"]}`;
}
export function testoTrascrizione(n) { return `Ecco ${n === 1 ? "il vocale" : `i ${n} vocali, nell'ordine`}.`; }
