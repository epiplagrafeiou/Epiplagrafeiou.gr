
// /lib/mappers/categoryMapper.ts
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

  const db = getDb();
  const snap = await db.collection('categories').get();

  const all: StoreCategory[] = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as StoreCategory[];

  categoryCache = all;
  cacheTimestamp = now;

  return all;
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

  const all = await getCategories();
  const match = findCategoryByRaw(all, cleanRaw);

  if (!match) {
    // fallback
    return {
      rawCategory: cleanRaw,
      category: 'Uncategorized',
      categoryId: null,
    };
  }

  const path = getCategoryPath(all, match.id);

  return {
    rawCategory: cleanRaw,
    category: path,
    categoryId: match.id,
  };
}

/** Recursively finds category by checking rawCategories array */
function findCategoryByRaw(categories: StoreCategory[], raw: string): StoreCategory | null {
  for (const cat of categories) {
    if (cat.rawCategories?.some((r) => r.toLowerCase() === raw.toLowerCase())) {
      return cat;
    }
    if (cat.children?.length) {
      const sub = findCategoryByRaw(cat.children, raw);
      if (sub) return sub;
    }
  }
  return null;
}

/** Builds readable category path: "Furniture > Chairs > Office Chairs" */
function getCategoryPath(all: StoreCategory[], id: string): string {
  const findById = (items: StoreCategory[], targetId: string): StoreCategory | null => {
    for (const c of items) {
      if (c.id === targetId) return c;
      if (c.children?.length) {
        const sub = findById(c.children, targetId);
        if (sub) return sub;
      }
    }
    return null;
  };

  const recPath = (targetId: string, root: StoreCategory[]): string[] => {
    const node = findById(root, targetId);
    if (!node) return [];
    if (!node.parentId) return [node.name];
    const parent = findById(root, node.parentId);
    //This is a simplified version of finding parent path, assumes parent is always in the root for now for simplicity
    if(parent){
       const parentPath = recPath(node.parentId, root);
       return [...parentPath, node.name];
    }
    return [node.name];
  };

  return recPath(id, all).join(' > ');
}
