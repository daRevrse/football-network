const admin = require('firebase-admin');
const path = require('path');

// Optionnel: utiliser dotenv pour récupérer le chemin si on veut
require('dotenv').config();

try {
  // Tente d'importer le fichier contenant les credentials de Firebase
  // ATTENTION : Le fichier firebase-service-account.json doit être téléchargé 
  // depuis la Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
  const serviceAccount = require('../firebase-service-account.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "koppafoot.firebasestorage.app"
  });

  console.log('🔥 Firebase Admin SDK initialized successfully.');

} catch (error) {
  console.error("❌ Firebase Admin SDK Setup Error:");
  console.error("Veuillez vous assurer que le fichier 'firebase-service-account.json' est présent à la racine du backend.");
  console.error(error.message);
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  storage
};
