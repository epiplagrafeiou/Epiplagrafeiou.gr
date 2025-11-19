
'use server';

import { createSlug } from '@/lib/utils';
import type { Product } from './products-context';

// This function is now simplified to only return an empty array for server-side generation tasks,
// as all product data is now managed and served from Firestore via the client-side ProductsProvider.
export async function getProducts(): Promise<Product[]> {
    try {
        return [];
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
