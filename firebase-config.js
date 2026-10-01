// ============================================================================
//  CONFIGURAZIONE FIREBASE
//  Qui si incollano i dati del progetto Firebase "stanze-ricci" (Passo 2).
//  Sono dati PUBBLICI (vanno in ogni app web): la sicurezza la fanno le
//  regole di Firestore, non questi numeri.
//
//  Finché FIREBASE_CONFIG resta null l'app parte in MODALITÀ PROVA:
//  dati di esempio, salvati solo sul telefono che li usa.
// ============================================================================
window.FIREBASE_CONFIG = null;
// Esempio di come sarà dopo il Passo 2:
// window.FIREBASE_CONFIG = {
//   apiKey: "AIza....",
//   authDomain: "stanze-ricci.firebaseapp.com",
//   projectId: "stanze-ricci",
//   storageBucket: "stanze-ricci.appspot.com",
//   messagingSenderId: "1234567890",
//   appId: "1:1234567890:web:abcdef123456"
// };

// Per entrare basta il nome: "lella" diventa lella@stanzericci.app
window.DOMINIO_ACCESSO = "stanzericci.app";
