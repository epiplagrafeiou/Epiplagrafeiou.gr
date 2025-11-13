// Server-side Firebase Admin initialization
// DO NOT USE ON THE CLIENT

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firestore: FirebaseFirestore.Firestore;

// Provide a safe way to check admin initialization errors
let initError: Error | null = null;
export function getFirebaseAdminInitError() {
  return initError;
}

export function getDb() {
  if (firestore) return firestore;

  try {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!rawKey) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is missing. Please set it in your environment."
      );
    }

    // Detect Base64 vs raw JSON automatically
    const isBase64 = rawKey.trim().startsWith("{") === false;

    const serviceAccount = isBase64
      ? JSON.parse(Buffer.from(rawKey, "base64").toString("utf8"))
      : JSON.parse(rawKey);

    // Initialize Firebase Admin
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    firestore = getFirestore();
    return firestore;
  } catch (err: any) {
    initError = err;
    console.error("🔥 Firebase Admin initialization failed:", err.message);
    throw err;
  }
}
