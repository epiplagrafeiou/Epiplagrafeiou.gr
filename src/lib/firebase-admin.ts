import * as admin from 'firebase-admin';

const serviceAccount = process.env.SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.SERVICE_ACCOUNT_JSON)
  : undefined;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export function getDb() {
  return db;
}
