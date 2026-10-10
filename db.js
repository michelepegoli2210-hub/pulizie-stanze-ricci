// ============================================================================
//  DB  ·  dove stanno i dati
//  Due modi di funzionare, con le stesse funzioni:
//   - "firebase": i dati veri, condivisi tra tutti i telefoni (Firestore)
//   - "prova":    dati di esempio salvati solo su questo telefono (senza Firebase)
//  L'app usa sempre e solo le funzioni qui sotto: così il resto non cambia.
// ============================================================================
import { SOGGIORNI_ESEMPIO } from "./regole.js";

export async function apriDb(config) {
  const url = new URL(location.href);
  const vuoleProva = url.searchParams.get("prova") === "1";
  if (config && config.apiKey && !vuoleProva) {
    try { return await dbFirebase(config); }
    catch (e) { console.error("Firebase non parte, uso la modalità prova", e); }
  }
  return dbProva();
}

// ---------------------------------------------------------------------------
//  FIREBASE
// ---------------------------------------------------------------------------
async function dbFirebase(config) {
  const fb = await import("./firebase-bundle.js");
  const app = fb.initializeApp(config);
  const auth = fb.getAuth(app);
  let store;
  try {
    store = fb.initializeFirestore(app, {
      localCache: fb.persistentLocalCache({ tabManager: fb.persistentMultipleTabManager() }),
    });
  } catch (e) { // se la cache non si può usare (es. finestra privata) si va senza
    store = fb.initializeFirestore(app, {});
  }

  const ref = (coll, id) => fb.doc(store, coll, id);
  const pulisci = d => ({ id: d.id, ...d.data() });

  function costruisciQuery(coll, opz = {}) {
    let q = fb.collection(store, coll);
    const parti = [];
    for (const [campo, op, val] of (opz.where || [])) {
      parti.push(fb.where(campo === "__id__" ? fb.documentId() : campo, op, val));
    }
    if (opz.orderBy) parti.push(fb.orderBy(opz.orderBy));
    if (opz.limit) parti.push(fb.limit(opz.limit));
    return parti.length ? fb.query(q, ...parti) : q;
  }

  const db = {
    modalita: "firebase",
    utenteCorrente: null,

    onUtente(cb) {
      let stopDoc = null;
      return fb.onAuthStateChanged(auth, (u) => {
        if (stopDoc) { stopDoc(); stopDoc = null; }
        if (!u) { db.utenteCorrente = null; cb(null); return; }
        const email = (u.email || "").toLowerCase();
        const login = email.split("@")[0];
        const dominio = (window.DOMINIO_ACCESSO || "stanzericci.app").toLowerCase();
        const proprietarioBase = (window.PROPRIETARI_BASE || []).includes(login) && email.endsWith("@" + dominio);
        // Il ruolo sta nella raccolta "ruoli", un documento per indirizzo: lo ascoltiamo, così se cambia si aggiorna
        stopDoc = fb.onSnapshot(ref("ruoli", email), (snap) => {
          const dati = snap.exists() ? snap.data() : {};
          const ruolo = dati.ruolo || (proprietarioBase ? "proprietario" : null);
          db.utenteCorrente = { uid: u.uid, email, login, nome: dati.nome || (proprietarioBase ? login : ""), ruolo, zona: dati.zona || null, attivo: snap.exists() || proprietarioBase, senzaScheda: !snap.exists() };
          cb(db.utenteCorrente);
        }, (err) => {
          console.error("ruoli", err);
          db.utenteCorrente = { uid: u.uid, email, login, nome: proprietarioBase ? login : "", ruolo: proprietarioBase ? "proprietario" : null, zona: null, attivo: proprietarioBase, errore: err.code };
          cb(db.utenteCorrente);
        });
      });
    },
    async entra(email, password) {
      await fb.setPersistence(auth, fb.browserLocalPersistence);
      await fb.signInWithEmailAndPassword(auth, email, password);
    },
    async esci() { await fb.signOut(auth); },
    async cambiaPassword(nuova) { if (auth.currentUser) await fb.updatePassword(auth.currentUser, nuova); },

    ascolta(coll, opz, cb, onErr) {
      return fb.onSnapshot(costruisciQuery(coll, opz), (snap) => {
        const m = {}; snap.forEach(d => { m[d.id] = pulisci(d); });
        cb(m, { daCache: snap.metadata.fromCache });
      }, (err) => { console.error(coll, err); onErr && onErr(err); });
    },
    ascoltaDoc(coll, id, cb, onErr) {
      return fb.onSnapshot(ref(coll, id), (snap) => cb(snap.exists() ? pulisci(snap) : null), (err) => { console.error(coll + "/" + id, err); onErr && onErr(err); });
    },
    async leggi(coll, id) { const s = await fb.getDoc(ref(coll, id)); return s.exists() ? pulisci(s) : null; },
    async leggiTutti(coll, opz) { const s = await fb.getDocs(costruisciQuery(coll, opz)); const m = {}; s.forEach(d => { m[d.id] = pulisci(d); }); return m; },
    async salva(coll, id, dati, merge = true) { const { id: _i, ...d } = dati; await fb.setDoc(ref(coll, id), d, { merge }); },
    async aggiorna(coll, id, patch) { await fb.updateDoc(ref(coll, id), patch); },
    async cancella(coll, id) { await fb.deleteDoc(ref(coll, id)); },
    // tante scritture insieme: [{tipo:"salva"|"aggiorna"|"cancella", coll, id, dati}]
    async scrivi(ops) {
      for (let i = 0; i < ops.length; i += 400) {
        const b = fb.writeBatch(store);
        for (const op of ops.slice(i, i + 400)) {
          if (op.tipo === "cancella") b.delete(ref(op.coll, op.id));
          else if (op.tipo === "aggiorna") b.update(ref(op.coll, op.id), op.dati);
          else { const { id: _i, ...d } = op.dati; b.set(ref(op.coll, op.id), d, { merge: op.merge !== false }); }
        }
        await b.commit();
      }
    },
    adesso() { return new Date().toISOString(); },
  };
  return db;
}

// ---------------------------------------------------------------------------
//  PROVA  (senza Firebase: dati di esempio, salvati solo su questo telefono)
// ---------------------------------------------------------------------------
function dbProva() {
  const CHIAVE = "ricci_prova_db_v2";
  let dati = null;
  try { dati = JSON.parse(localStorage.getItem(CHIAVE) || "null"); } catch (e) { dati = null; }
  if (!dati || !dati.soggiorni) dati = datiIniziali();
  const salvaTutto = () => { try { localStorage.setItem(CHIAVE, JSON.stringify(dati)); } catch (e) {} };
  const ascoltatori = new Set();
  const avvisa = () => { for (const a of [...ascoltatori]) { try { a(); } catch (e) { console.error(e); } } };
  let utente = null;
  try { utente = JSON.parse(localStorage.getItem("ricci_prova_utente") || "null"); } catch (e) {}
  // Link diretto: ?prova=1&signora=1 (1° piano), 2 (2° piano), 3 (appartamenti) oppure &gestione=1 → si entra subito, senza scegliere
  try {
    const q = new URL(location.href).searchParams;
    const SIG = { "1": ["p1", "Signora 1° piano"], "2": ["p2", "Signora 2° piano"], "3": ["ap", "Signora appartamenti"], "p1": ["p1", "Signora 1° piano"], "p2": ["p2", "Signora 2° piano"], "ap": ["ap", "Signora appartamenti"] };
    const sig = q.get("signora");
    if (sig && SIG[sig]) { const [zona, nome] = SIG[sig]; utente = { uid: "prova_" + zona, email: "", nome, ruolo: "addetta", zona, attivo: true }; localStorage.setItem("ricci_prova_utente", JSON.stringify(utente)); }
    else if (q.get("gestione") === "1") { utente = { uid: "prova_proprietario", email: "", nome: "Michele", ruolo: "proprietario", zona: null, attivo: true }; localStorage.setItem("ricci_prova_utente", JSON.stringify(utente)); }
  } catch (e) {}
  const cbUtente = new Set();

  function filtra(coll, opz = {}) {
    const tutti = Object.entries(dati[coll] || {});
    const ok = tutti.filter(([id, d]) => (opz.where || []).every(([campo, op, val]) => {
      const v = campo === "__id__" ? id : d[campo];
      switch (op) {
        case "==": return v === val;
        case "!=": return v !== val;
        case ">=": return v >= val;
        case ">": return v > val;
        case "<=": return v <= val;
        case "<": return v < val;
        case "in": return (val || []).includes(v);
        case "array-contains": return Array.isArray(v) && v.includes(val);
        default: return true;
      }
    }));
    const m = {}; for (const [id, d] of ok) m[id] = { id, ...d }; return m;
  }

  const db = {
    modalita: "prova",
    utenteCorrente: utente,
    onUtente(cb) { cbUtente.add(cb); setTimeout(() => cb(utente), 0); return () => cbUtente.delete(cb); },
    // Nella prova si entra scegliendo chi si è
    async entraProva(ruolo, zona, nome) {
      utente = { uid: "prova_" + (zona || ruolo), email: "", nome, ruolo, zona: zona || null, attivo: true };
      db.utenteCorrente = utente;
      try { localStorage.setItem("ricci_prova_utente", JSON.stringify(utente)); } catch (e) {}
      for (const cb of cbUtente) cb(utente);
    },
    async entra() { throw new Error("In modalità prova si entra scegliendo chi sei."); },
    async esci() { utente = null; db.utenteCorrente = null; try { localStorage.removeItem("ricci_prova_utente"); } catch (e) {} for (const cb of cbUtente) cb(null); },
    async cambiaPassword() {},
    ascolta(coll, opz, cb) {
      const f = () => cb(filtra(coll, opz), { daCache: false });
      ascoltatori.add(f); setTimeout(f, 0);
      return () => ascoltatori.delete(f);
    },
    ascoltaDoc(coll, id, cb) {
      const f = () => cb(dati[coll]?.[id] ? { id, ...dati[coll][id] } : null);
      ascoltatori.add(f); setTimeout(f, 0);
      return () => ascoltatori.delete(f);
    },
    async leggi(coll, id) { return dati[coll]?.[id] ? { id, ...dati[coll][id] } : null; },
    async leggiTutti(coll, opz) { return filtra(coll, opz); },
    async salva(coll, id, d, merge = true) {
      dati[coll] = dati[coll] || {};
      const { id: _i, ...pulito } = d;
      dati[coll][id] = merge ? { ...(dati[coll][id] || {}), ...pulito } : pulito;
      salvaTutto(); avvisa();
    },
    async aggiorna(coll, id, patch) { if (!dati[coll]?.[id]) throw new Error("non esiste"); Object.assign(dati[coll][id], patch); salvaTutto(); avvisa(); },
    async cancella(coll, id) { if (dati[coll]) delete dati[coll][id]; salvaTutto(); avvisa(); },
    async scrivi(ops) {
      for (const op of ops) {
        dati[op.coll] = dati[op.coll] || {};
        if (op.tipo === "cancella") delete dati[op.coll][op.id];
        else if (op.tipo === "aggiorna") Object.assign(dati[op.coll][op.id] = dati[op.coll][op.id] || {}, op.dati);
        else { const { id: _i, ...d } = op.dati; dati[op.coll][op.id] = op.merge === false ? d : { ...(dati[op.coll][op.id] || {}), ...d }; }
      }
      salvaTutto(); avvisa();
    },
    adesso() { return new Date().toISOString(); },
    azzeraProva() { dati = datiIniziali(); salvaTutto(); avvisa(); },
  };
  return db;

  // Gli esempi sono scritti sulla settimana del 28 settembre 2026: li sposto di settimane intere
  // fino alla settimana di oggi, così la prova ha sempre camere piene (stessi giorni della settimana).
  function datiIniziali() {
    const oggi = new Date(); const wd = (oggi.getDay() + 6) % 7;
    const lunedi = new Date(Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() - wd));
    const base = Date.UTC(2026, 8, 28);
    const settimane = Math.round((lunedi - base) / (7 * 864e5));
    const sposta = (iso) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + settimane * 7); return d.toISOString().slice(0, 10); };
    const soggiorni = {};
    SOGGIORNI_ESEMPIO.forEach(([camera, inizio, fine, nome, tipo], i) => {
      const id = `es_${i}_${camera}`;
      soggiorni[id] = { camera, inizio: sposta(inizio), fine: sposta(fine), nome, tipo, persone: 1, origine: "esempio", dubbio: tipo === "unk" };
    });
    return { soggiorni, pulizie: {}, pagamenti: {}, impostazioni: {}, note: {}, ruoli: {} };
  }
}
