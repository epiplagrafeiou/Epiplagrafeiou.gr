
export interface XmlProduct {
  id: string;
  name: string;
  retailPrice: string;
  webOfferPrice: string;
  description: string;
  category: string;
  categoryId: string | null;
  rawCategory?: string; // Keep this optional for now
  mainImage: string | null;
  images: string[];
  stock: number;
  isAvailable?: boolean;
  sku?: string;
  model?: string;
  variantGroupKey?: string;
  color?: string;
  supplierName?: string;
}
