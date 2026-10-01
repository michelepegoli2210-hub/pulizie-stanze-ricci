// ============================================================================
//  CONFIGURAZIONE FIREBASE  ·  progetto "LE STANZE DI RICCI" (le-stanze-di-ricci)
//  Questi dati sono PUBBLICI (stanno in ogni app web): la sicurezza la fanno
//  le regole di Firestore (file firestore.rules), non questi numeri.
//
//  Se si mette FIREBASE_CONFIG = null l'app torna in MODALITÀ PROVA
//  (dati di esempio, solo sul telefono). Si può forzare anche con ?prova=1.
// ============================================================================
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCK5MoCmQ5va1eJIvn4ZvAzCexGo0xFvLc",
  authDomain: "le-stanze-di-ricci.firebaseapp.com",
  projectId: "le-stanze-di-ricci",
  storageBucket: "le-stanze-di-ricci.firebasestorage.app",
  messagingSenderId: "795231354902",
  appId: "1:795231354902:web:3f87025b8ea03004203537",
};

// Per entrare basta il nome: "michele" diventa michele@stanzericci.app
window.DOMINIO_ACCESSO = "stanzericci.app";

// I proprietari "di sicurezza": anche se nella raccolta "ruoli" non ci fosse
// ancora niente, questi nomi entrano sempre come proprietari (stessa lista
// scritta dentro firestore.rules).
window.PROPRIETARI_BASE = ["michele", "papa", "mamma", "michelesantucci"];
