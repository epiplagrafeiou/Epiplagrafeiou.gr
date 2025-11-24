// /lib/mappers/categoryMapper.ts
'use server';
import { collection, getDocs } from "firebase/firestore";
import type { StoreCategory } from "@/components/admin/CategoryManager";
import { db } from "@/firebase/client"; // Use client-side db for server components

/**
 * Maps raw supplier category → your store category.
 */
export async function mapCategory(rawCategory: string) {
  const cleanRaw = (rawCategory || "").trim();
  if (!cleanRaw) {
    return {
      rawCategory: "",
      category: "Uncategorized",
      categoryId: null,
    };
  }

  // 1) Load categories from Firestore
  const snap = await getDocs(collection(db, "categories"));
  const all: StoreCategory[] = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as StoreCategory[];

  const match = findCategoryByRaw(all, cleanRaw);

  if (!match) {
    // fallback
    return {
      rawCategory: cleanRaw,
      category: "Uncategorized",
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
  const findById = (items: StoreCategory[], id: string): StoreCategory | null => {
    for (const c of items) {
      if (c.id === id) return c;
      if (c.children?.length) {
        const sub = findById(c.children, id);
        if (sub) return sub;
      }
    }
    return null;
  };

  const recPath = (id: string, root: StoreCategory[]): string[] => {
    const node = findById(root, id);
    if (!node) return [];
    if (!node.parentId) return [node.name];
    return [...recPath(node.parentId, root), node.name];
  };

  return recPath(id, all).join(" > ");
}
