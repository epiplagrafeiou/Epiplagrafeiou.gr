
export interface XmlProduct {
  id: string;
  name: string;
  retailPrice: string;
  webOfferPrice: string;
  description: string;
  category: string;
  categoryId: string | null;
  mainImage: string | null;
  images: string[];
  stock: number;
  isAvailable?: boolean;
  sku?: string;
  model?: string;
  variantGroupKey?: string;
  color?: string;
}
