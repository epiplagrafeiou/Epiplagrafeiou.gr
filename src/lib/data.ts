
export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  imageId: string;
  category: string;
  images?: string[];
  stock?: number;
}

export const products: Product[] = [];

export const categories = ['Chairs', 'Tables', 'Sofas', 'Storage', 'Desks', 'Lighting'];

export const suppliers = [
  { id: 'sup1', name: 'Nordic Designs', url: 'https://example.com/nordic.xml', markup: 30, conversionRate: 0.12, profitability: 4500.20 },
  { id: 'sup2', name: 'Milano Furnishings', url: 'https://example.com/milano.xml', markup: 45, conversionRate: 0.08, profitability: 6200.75 },
  { id: 'sup3', name: 'Office Solutions Inc.', url: 'https://example.com/office.xml', markup: 25, conversionRate: 0.21, profitability: 8100.00 },
];
