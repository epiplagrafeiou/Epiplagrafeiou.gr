
// src/lib/category-mapper.ts
'use server';

import { getDb } from '@/lib/firebase-admin';
import type { StoreCategory } from '@/components/admin/CategoryManager';
import type { XmlProduct } from '@/lib/types/product';
import { createSlug } from './utils';

// Cache to store the category mapping rules.
let categoryMapCache: Map<string, { categoryId: string; path: string }> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Pre-defined list of mappings. This serves as the single source of truth
 * for the "Seed Categories" functionality.
 */
const PREDEFINED_MAPPINGS = [
  { raw: 'Καρέκλες Γραφείου', mapped: 'ΓΡΑΦΕΙΟ > Καρέκλες Γραφείου' },
  { raw: 'Καρέκλες Επισκέπτη', mapped: 'ΓΡΑΦΕΙΟ > Καρέκλες Επισκέπτη' },
  { raw: 'Καρέκλες Gaming', mapped: 'ΓΡΑΦΕΙΟ > Καρέκλες Gaming' },
  { raw: 'Σκαμπώ', mapped: 'ΓΡΑΦΕΙΟ > Σκαμπώ' },
  { raw: 'Γραφεία', mapped: 'ΓΡΑΦΕΙΟ > Γραφεία' },
  { raw: 'Συρταριέρες Τροχήλατες', mapped: 'ΓΡΑΦΕΙΟ > Συρταριέρες Γραφείου' },
  { raw: 'Βιβλιοθήκες', mapped: 'ΓΡΑΦΕΙΟ > Βιβλιοθήκες' },
  { raw: 'Ραφιέρες/Ράφια Τοίχου', mapped: 'ΓΡΑΦΕΙΟ > Ραφιέρες & Αποθηκευτικά Κουτιά' },
  { raw: 'Ντουλάπες', mapped: 'ΓΡΑΦΕΙΟ > Ντουλάπες' },
  { raw: 'Ανταλλακτικά Για Καρέκλες Γραφείου', mapped: 'ΓΡΑΦΕΙΟ > Ανταλλακτικά' },
  { raw: 'Γραφεία Υποδοχής/Reception', mapped: 'ΓΡΑΦΕΙΟ > Γραφεία Υποδοχής/Reception' },
  // Add all other mappings here...
];

/**
 * Returns the predefined list of category mappings.
 * This is used by the CategoryManager to seed the Firestore database.
 */
export async function getCategoryMapping(): Promise<{ raw: string; mapped: string }[]> {
    return PREDEFINED_MAPPINGS;
}


/**
 * Fetches all store categories from Firestore and builds an efficient lookup map.
 * The map uses the lowercase raw category string as a key.
 * Caches the result to avoid unnecessary Firestore reads during a large sync operation.
 */
async function getCategoryLookupMap(): Promise<Map<string, { categoryId: string; path: string }>> {
  const now = Date.now();
  if (categoryMapCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION_MS) {
    return categoryMapCache;
  }

  console.log('[CategoryMapper] Fetching and building category map from Firestore...');
  let categoriesSnap;
  try {
    const db = getDb();
    categoriesSnap = await db.collection('categories').get();
  } catch (err: any) {
    console.error('[CategoryMapper] Failed to load categories from Firestore:', err?.message || err);
    // If Firestore is unavailable (e.g., missing credentials in a preview environment),
    // continue the import with uncategorized products instead of failing the sync.
    return new Map();
  }
  
  if (categoriesSnap.empty) {
    console.warn('[CategoryMapper] No categories found in Firestore. All products will be "Uncategorized".');
    return new Map();
  }

  const allCategories: StoreCategory[] = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreCategory));
  
  const categoriesById = new Map<string, StoreCategory>(allCategories.map(c => [c.id, c]));
  const pathMap = new Map<string, string>();

  function getPath(catId: string): string {
    if (pathMap.has(catId)) return pathMap.get(catId)!;

    const cat = categoriesById.get(catId);
    if (!cat) return '';

    const parentPath = cat.parentId ? getPath(cat.parentId) : '';
    const fullPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
    
    pathMap.set(catId, fullPath);
    return fullPath;
  }
  
  const newCache = new Map<string, { categoryId: string; path: string }>();
  allCategories.forEach(cat => {
    if (cat.rawCategories) {
      cat.rawCategories.forEach(raw => {
        const fullPath = getPath(cat.id);
        if (fullPath) {
          // Key is lowercase for case-insensitive matching
          newCache.set(raw.toLowerCase(), { categoryId: cat.id, path: fullPath });
        }
      });
    }
  });

  categoryMapCache = newCache;
  cacheTimestamp = now;
  console.log(`[CategoryMapper] Cached ${newCache.size} raw-to-store category mappings.`);
  return categoryMapCache;
}

/**
 * Efficiently maps an array of raw products to products with final category information.
 * @param rawProducts An array of products parsed from XML, lacking final category info.
 * @returns A promise that resolves to the array of fully mapped products.
 */
export async function mapProductsCategories(rawProducts: Omit<XmlProduct, 'category' | 'categoryId'>[]): Promise<XmlProduct[]> {
  const categoryMap = await getCategoryLookupMap();
  
  return rawProducts.map(product => {
    const cleanRawCategory = (product.rawCategory || '').trim().toLowerCase();
    const mapping = categoryMap.get(cleanRawCategory);

    if (mapping) {
      return {
        ...product,
        category: mapping.path,
        categoryId: mapping.categoryId,
      };
    }

    // Fallback for uncategorized items
    return {
      ...product,
      category: 'Uncategorized',
      categoryId: null,
    };
  });
}
