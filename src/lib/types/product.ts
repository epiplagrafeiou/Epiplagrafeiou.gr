// src/lib/types/product.ts
export interface XmlProduct {
  // Identification
  id: string;           // Supplier’s unique product ID
  sku?: string;
  model?: string;
  ean?: string;

  // Basic info
  name: string;
  description: string;

  // Prices as strings (because XML gives strings)
  retailPrice: string;      // Supplier retail / SRP
  webOfferPrice: string;    // Base price used for markup (usually wholesale/web offer)

  // Categories
  rawCategory: string;      // Supplier raw category path, e.g. "Έπιπλα κήπου > Πανιά ..."
  category: string;         // Mapped store category path, e.g. "ΕΞΩΤΕΡΙΚΟΣ ΧΩΡΟΣ > Καρέκλες κήπου" or "Uncategorized"
  categoryId: string | null;

  // Stock / availability
  stock: number;
  isAvailable?: boolean;

  // Images
  mainImage: string | null;
  images: string[];

  // Optional extra info
  manufacturer?: string;
  url?: string;                     // Supplier product page
  attributes?: Record<string, string>;
}
