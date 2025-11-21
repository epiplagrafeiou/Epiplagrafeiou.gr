
export interface XmlProduct {
  id: string;
  name: string;
  retailPrice: string;
  webOfferPrice: string;
  description: string;
  category: string; // This will now hold the MAPPED category
  mainImage: string | null;
  images: string[];
  stock: number;
  isAvailable?: boolean; // Optional, for feeds that provide it
  sku?: string;
  model?: string;
  variantGroupKey?: string;
  color?: string;
}
