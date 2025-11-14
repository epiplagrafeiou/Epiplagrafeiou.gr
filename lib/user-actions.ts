'use server';

import { createSlug } from '@/lib/utils';
import type { Product } from './products-context';

// This function is now simplified to only return static/manual products
// for server-side generation tasks like sitemaps, avoiding problematic
// server-side Firebase connections. The client-side will have the full list.
export async function getProducts(): Promise<Omit<Product, 'slug'>[]> {
    try {
        const initialManualProducts: Omit<Product, 'slug'>[] = [
            {
            id: 'manual-001',
            name: 'Σετ 5τμχ Ρόδες Για Καρέκλα Γραφείου',
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
            price: 28.99,
            description: 'Ρόδες Pro σετ 5 τεμαχίων για καρέκλες γραφείου.Από ελαστική πολυουρεθάνη για ομαλότερη κύλιση χωρίς να αφήνει σημάδια στο δάπεδο.Κατάλληλες για καρέκλες με πείρο 11 χιλιοστών.',
            imageId: 'https://www.zougris.gr/content/images/thumbs/0010300.jpeg',
            category: 'Ανταλλακτικά Για Καρέκλες Γραφείου',
            images: ['https://www.zougris.gr/content/images/thumbs/0010300.jpeg'],
            stock: 214,
            supplierId: 'manual',
            }
        ];
        
        // Add slug to each product before returning
        return initialManualProducts.map(p => ({...p, slug: createSlug(p.name)}));

    } catch (e) {
        console.error("Could not fetch products for sitemap/server components", e);
        return [];
    }
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    points: number;
}
