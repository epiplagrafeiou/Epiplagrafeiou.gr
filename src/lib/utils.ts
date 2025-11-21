
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { StoreCategory } from "@/components/admin/CategoryManager";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "EUR") {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

// Helper to create a URL-friendly slug that supports Greek characters by default.
export const createSlug = (name: string) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^a-z0-9α-ωά-ώ\s-]/g, '') // Remove special characters but keep Greek
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
};


// Safe category normalizer - DEPRECATED for display, still used by parsers
export function normalizeCategory(cat?: string): string {
    if (!cat) return "Uncategorized";
    return cat
        .split('>')
        .map(c => c.trim())
        .filter(Boolean)
        .join(' > ');
}

// New function to recursively find the category path
export function findCategoryPath(categoryId: string | null, categories: StoreCategory[]): StoreCategory[] {
    if (!categoryId) return [];
    
    let path: StoreCategory[] = [];
    
    const find = (cats: StoreCategory[], currentPath: StoreCategory[]): boolean => {
        for (const cat of cats) {
            const newPath = [...currentPath, cat];
            if (cat.id === categoryId) {
                path = newPath;
                return true;
            }
            if (cat.children && find(cat.children, newPath)) {
                return true;
            }
        }
        return false;
    }
    
    find(categories, []);
    return path;
}
