// This file is for server-side Firebase initialization only.
// Do not import it in client-side components.

import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config'; 

// IMPORTANT: You need to download your service account key JSON file from the Firebase console
// and place it in your project. For Vercel/Next.js, it's common to store this
// as a base64-encoded environment variable.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8'))
  : undefined;

if (!getApps().length) {
  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  });
}

const firestore = getFirestore();

export { firestore };
