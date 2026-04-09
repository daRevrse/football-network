const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function test() {
  try {
    console.log("Checking connection...");
    const snapshot = await db.collection('matches').limit(1).get();
    console.log("Success! Found " + snapshot.size + " docs.");
  } catch (error) {
    console.error("Firestore Error:", error);
  } finally {
    process.exit();
  }
}

test();
