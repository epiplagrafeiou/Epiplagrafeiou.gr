
import * as admin from 'firebase-admin';

// When running in a Google Cloud environment like Firebase App Hosting,
// the Admin SDK can automatically detect the service account credentials
// without needing an explicit configuration object.
if (!admin.apps.length) {
  try {
    // Attempt to initialize with default credentials, best for cloud environments.
    admin.initializeApp();
  } catch (e: any) {
    console.error('Default Firebase Admin SDK initialization failed:', e.message);
    
    // Fallback for local development if SERVICE_ACCOUNT_JSON is provided.
    // This allows the same codebase to work in both environments.
    const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
        try {
            const serviceAccount = JSON.parse(serviceAccountJson);
            console.log('Attempting to initialize with SERVICE_ACCOUNT_JSON...');
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } catch(parseError: any) {
             console.error('Failed to parse SERVICE_ACCOUNT_JSON or initialize with it:', parseError.message);
        }
    } else {
        console.warn('Firebase Admin SDK could not be initialized. Default credentials failed and SERVICE_ACCOUNT_JSON is not set.');
    }
  }
}

const db = admin.firestore();

export function getDb() {
  if (!admin.apps.length) {
      // This case should ideally not be hit if initialization logic is sound.
      throw new Error("Firebase Admin SDK has not been initialized.");
  }
  return db;
}
