'use server';

import { createSlug } from '@/lib/utils';
import type { Product } from './products-context';

// This function is now simplified to only return an empty array
// for server-side generation tasks like sitemaps, avoiding problematic
// server-side Firebase connections. The client-side will have the full list.
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
