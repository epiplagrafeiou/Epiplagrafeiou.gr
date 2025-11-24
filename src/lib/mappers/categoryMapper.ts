
// /src/lib/mappers/categoryMapper.ts
'use server';

import { getDb } from '@/lib/firebase-admin';
import type { StoreCategory } from '@/components/admin/CategoryManager';

// Cache categories to avoid hitting Firestore on every single product mapping within a sync.
let categoryCache: StoreCategory[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCategories(): Promise<StoreCategory[]> {
  const now = Date.now();
  if (categoryCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
    return categoryCache;
  }

  console.log('[CategoryMapper] Fetching categories from Firestore...');
  const db = getDb();
  const snap = await db.collection('categories').get();

  const all: StoreCategory[] = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as StoreCategory[];

  // This function builds the tree structure, which we don't need for mapping,
  // but it's good practice if you were to use it elsewhere.
  const categoriesById: Record<string, StoreCategory> = {};
  const rootCategories: StoreCategory[] = [];

  all.forEach(cat => {
      categoriesById[cat.id] = { ...cat, children: [] };
  });

  all.forEach(cat => {
      if (cat.parentId && categoriesById[cat.parentId]) {
          categoriesById[cat.parentId].children.push(categoriesById[cat.id]);
      } else {
          rootCategories.push(categoriesById[cat.id]);
      }
  });


  categoryCache = all; // We cache the flat list for easier searching
  cacheTimestamp = now;
  console.log(`[CategoryMapper] Cached ${all.length} categories.`);

  return categoryCache;
}

/**
 * Maps raw supplier category → your store category.
 */
export async function mapCategory(rawCategory: string) {
  const cleanRaw = (rawCategory || '').trim();
  if (!cleanRaw) {
    return {
      rawCategory: '',
      category: 'Uncategorized',
      categoryId: null,
    };
  }

  const allCategories = await getCategories();
  let match: StoreCategory | null = null;

  // Find a category where our raw string is listed
  for (const cat of allCategories) {
    if (cat.rawCategories?.some((r) => r.toLowerCase() === cleanRaw.toLowerCase())) {
      match = cat;
      break;
    }
  }

  if (!match) {
    return {
      rawCategory: cleanRaw,
      category: 'Uncategorized',
      categoryId: null,
    };
  }

  // If we have a match, construct its full path for display
  const path = getCategoryPath(allCategories, match.id);

  return {
    rawCategory: cleanRaw,
    category: path,
    categoryId: match.id,
  };
}

/** Builds readable category path: "Furniture > Chairs > Office Chairs" */
function getCategoryPath(all: StoreCategory[], leafId: string): string {
  const path: string[] = [];
  let currentId: string | null = leafId;

  while (currentId) {
    const currentCat = all.find(c => c.id === currentId);
    if (!currentCat) {
      break; 
    }
    path.unshift(currentCat.name);
    currentId = currentCat.parentId;
  }
  
  return path.join(' > ');
}
