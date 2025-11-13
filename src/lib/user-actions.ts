
'use server';

import { doc, getDoc, updateDoc, increment, collection, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase-admin"; // Assuming you have a server-side init
import { createSlug } from '@/lib/utils';
import type { Product } from './products-context';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    points: number;
}

// Server-side function to fetch all products.
// This avoids using hooks and can be called from Server Components.
export async function getProducts(): Promise<Product[]> {
    const productsCollection = collection(firestore, 'products');
    const snapshot = await getDocs(productsCollection);
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

    // You might want to add the initial manual products here as well if they aren't in Firestore
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
}

export async function addPointsToUser(userId: string, pointsToAdd: number) {
    if (!userId || !pointsToAdd) {
        throw new Error("User ID and points to add are required.");
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
        // In a real app, you might want to check if the document exists first
        // and create it if it doesn't, or handle the error more gracefully.
        return { success: false, error: "Failed to update points." };
    }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    
    const userRef = doc(firestore, "users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
}
