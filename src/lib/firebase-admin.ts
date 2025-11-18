import * as admin from 'firebase-admin';

// When running in a Google Cloud environment like Firebase App Hosting,
// the Admin SDK can automatically detect the service account credentials
// without needing an explicit configuration object.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.error('Firebase Admin SDK initialization failed.', e);
    // For local development, it might still be useful to use a service account file.
    // This fallback logic can be added if needed, but for App Hosting,
    // the parameter-less initializeApp() is preferred.
    const serviceAccount = process.env.SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.SERVICE_ACCOUNT_JSON)
      : undefined;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }
}

const db = admin.firestore();

export function getDb() {
  return db;
}
