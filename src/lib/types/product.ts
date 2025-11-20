
export interface XmlProduct {
  id: string;
  name: string;
  retailPrice: string;
  webOfferPrice: string;
  description: string;
  category: string;
  mainImage: string | null;
  images: string[];
  stock: number;
  isAvailable?: boolean; // Optional, for feeds that provide it
}
