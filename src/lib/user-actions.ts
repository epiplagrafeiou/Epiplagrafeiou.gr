
'use server';

import { doc, getDoc, updateDoc, increment, collection, getDocs } from "firebase/firestore";
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createSlug } from '@/lib/utils';
import type { Product } from './products-context';

let firestore: FirebaseFirestore.Firestore;

export function getDb() {
  if (firestore) return firestore;
  
  // This is a workaround for environments where service account key isn't available
  // It should be replaced with a proper secure way to fetch data on the server
  if (getApps().length) {
    firestore = getFirestore();
  }
  return firestore;
}


export interface UserProfile {
    id: string;
    email: string;
    name: string;
    points: number;
}


export async function getProducts(): Promise<Product[]> {
    try {
        const db = getDb();
        if(!db) {
             console.warn("Firestore not initialized for server action 'getProducts'. Returning empty array.");
             return [];
        }
        const productsCollection = collection(db, 'products');
        const snapshot = await getDocs(productsCollection);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

        const initialManualProducts: Product[] = [
            {
            id: 'manual-001',
            name: 'Σετ 5τμχ Ρόδες Για Καρέκλα Γραφείου',
            slug: createSlug('Σετ 5τμχ Ρόδες Για Καρέκλα Γραφείου'),
            price: 12.99,
            originalPrice: 13.99,
            description: 'Ρόδες σετ 5 τεμαχίων για καρέκλες γραφείου.',
            imageId: 'https://www.zougris.gr/content/images/thumbs/0008329.jpeg',
            category: 'Ανταλλακτικά Για Καρέκλες Γραφείου',
            images: ['https://www.zougris.gr/content/images/thumbs/0008329.jpeg'],
            stock: 177,
            supplierId: 'manual',
            },
            {
            id: '11.2213',
            name: 'ΑΜΟΡΤΙΣΕΡ ΜΑΥΡΟ ΚΑΡ.ΓΡΑΦΕΙΟΥ 26/35εκ.',
            slug: createSlug('ΑΜΟΡΤΙΣΕΡ ΜΑΥΡΟ ΚΑΡ.ΓΡΑΦΕΙΟΥ 26/35εκ.'),
            price: 18.99,
            description: 'Αμορτισέρ μαύρο για καρέκλες γραφείου 26/35εκ.',
            imageId: 'https://www.zougris.gr/content/images/thumbs/0004662.jpeg',
            category: 'Ανταλλακτικά Για Καρέκλες Γραφείου',
            images: ['https://www.zougris.gr/content/images/thumbs/0004662.jpeg'],
            stock: 350,
            supplierId: 'manual',
            },
            {
            id: '01.0942',
            name: 'ΠΟΔΙ Φ62εκ. ΧΡΩΜΙΟΥ ΓΙΑ ΚΑΡΕΚΛΑ ΓΡΑΦΕΙΟΥ',
            slug: createSlug('ΠΟΔΙ Φ62εκ. ΧΡΩΜΙΟΥ ΓΙΑ ΚΑΡΕΚΛΑ ΓΡΑΦΕΙΟΥ'),
            price: 28.99,
            description: 'Πόδι χρωμίου Φ62εκ. για απόλυτη ανθεκτικότητα στο βάρος.',
            imageId: 'https://www.zougris.gr/content/images/thumbs/0010615.jpeg',
            category: 'Ανταλλακτικά Για Καρέκλες Γραφείου',
            images: ['https://www.zougris.gr/content/images/thumbs/0010615.jpeg', 'https://www.zougris.gr/content/images/thumbs/0010616.jpeg'],
            stock: 98,
            supplierId: 'manual',
            },
            {
            id: 'manual-pelmata',
            name: 'Σέτ 5τμχ Πέλματα Για Καρέκλα Γραφείου',
            slug: createSlug('Σέτ 5τμχ Πέλματα Για Καρέκλα Γραφείου'),
            price: 12.99,
            description: 'Πέλματα, κάντε τις καρέκλες σας σταθερές αντικαθιστώντας εύκολα τις ρόδες με τα πέλματα.',
            imageId: 'https://www.zougris.gr/content/images/thumbs/0008499.jpeg',
            category: 'Ανταλλακτικά Για Καρέκλες Γραφείου',
            images: ['https://www.zougris.gr/content/images/thumbs/0008499.jpeg'],
            stock: 61,
            supplierId: 'manual',
            },
            {
            id: 'manual-pro-wheels',
            name: 'Σετ 5τμχ Ρόδες Pro 63χιλ. Ελαστικής Πολυουρεθάνης Για Καρέκλα Γραφείου',
            slug: createSlug('Σετ 5τμχ Ρόδες Pro 63χιλ. Ελαστικής Πολυουρεθάνης Για Καρέκλα Γραφείου'),
            price: 28.99,
            description: 'Ρόδες Pro σετ 5 τεμαχίων για καρέκλες γραφείου.Από ελαστική πολυουρεθάνη για ομαλότερη κύλιση χωρίς να αφήνει σημάδια στο δάπεδο.Κατάλληλες για καρέκλες με πείρο 11 χιλιοστών.',
            imageId: 'https://www.zougris.gr/content/images/thumbs/0010300.jpeg',
            category: 'Ανταλλακτικά Για Καρέκλες Γραφείου',
            images: ['https://www.zougris.gr/content/images/thumbs/0010300.jpeg'],
            stock: 214,
            supplierId: 'manual',
            }
        ];

        const combined = [...initialManualProducts, ...products];
        const uniqueProducts = Array.from(new Map(combined.map(p => [p.id, p])).values());
        return uniqueProducts;

    } catch (e) {
        console.error("Could not fetch products for sitemap/server components", e);
        return [];
    }
}

export async function addPointsToUser(userId: string, pointsToAdd: number) {
    if (!userId || !pointsToAdd) {
        throw new Error("User ID and points to add are required.");
    }
    const firestore = getDb();
    if(!firestore) {
        console.error("Firestore not available to add points");
        return { success: false, error: "Firestore not available." };
    }
    const userRef = doc(firestore, "users", userId);

    try {
        await updateDoc(userRef, {
            points: increment(pointsToAdd)
        });
        console.log(`Successfully added ${pointsToAdd} points to user ${userId}`);
        return { success: true };
    } catch (error) {
        console.error("Error adding points:", error);
        return { success: false, error: "Failed to update points." };
    }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    
    const firestore = getDb();
     if(!firestore) {
        console.error("Firestore not available to get user profile");
        return null;
    }
    const userRef = doc(firestore, "users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
}
