const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK
// If the app is running in a Firebase environment (like Cloud Functions),
// it will automatically use the project's service account.
// Otherwise, it will look for the GOOGLE_APPLICATION_CREDENTIALS env var.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

module.exports = { db };
