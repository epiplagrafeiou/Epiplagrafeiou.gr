export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  imageId: string;
  category: string;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Scandinavian Chair',
    slug: 'scandinavian-chair',
    price: 129.99,
    description: 'A minimalist Scandinavian-style chair with light wood and grey fabric. Perfect for modern living rooms or offices. Features a comfortable cushioned seat and a sturdy, elegant frame.',
    imageId: 'scandinavian-chair',
    category: 'Chairs',
  },
  {
    id: '2',
    name: 'Oak Dining Table',
    slug: 'oak-dining-table',
    price: 799.0,
    description: 'A solid oak dining table that comfortably seats six people. Its robust construction and timeless design make it a centerpiece for any dining room. Finished with a natural oil to protect the wood.',
    imageId: 'oak-dining-table',
    category: 'Tables',
  },
  {
    id: '3',
    name: 'Modern 3-Seater Sofa',
    slug: 'modern-sofa',
    price: 950.5,
    description: 'A comfortable three-seater modern sofa in a versatile, neutral grey color. Features deep cushions and a durable fabric, making it ideal for everyday use. Comes with two matching throw pillows.',
    imageId: 'modern-sofa',
    category: 'Sofas',
  },
  {
    id: '4',
    name: 'Industrial Bookshelf',
    slug: 'bookshelf-ladder',
    price: 349.99,
    description: 'An industrial-style ladder bookshelf made of a strong metal frame and solid wood shelves. Provides ample storage while adding a touch of urban chic to your space.',
    imageId: 'bookshelf-ladder',
    category: 'Storage',
  },
  {
    id: '5',
    name: 'Minimalist Office Desk',
    slug: 'minimalist-desk',
    price: 250.0,
    description: 'A sleek and minimalist desk with a clean white top and sturdy wooden legs. Its simple design promotes a clutter-free workspace, enhancing focus and productivity.',
    imageId: 'minimalist-desk',
    category: 'Desks',
  },
  {
    id: '6',
    name: 'Copper Pendant Light',
    slug: 'pendant-light',
    price: 89.9,
    description: 'A modern pendant light with a striking metallic copper finish. It provides warm, focused light, making it an excellent choice for kitchen islands, dining areas, or entryways.',
    imageId: 'pendant-light',
    category: 'Lighting',
  },
];

export const categories = ['Chairs', 'Tables', 'Sofas', 'Storage', 'Desks', 'Lighting'];

export const suppliers = [
  { id: 'sup1', name: 'Nordic Designs', url: 'https://example.com/nordic.xml', markup: 30, conversionRate: 0.12, profitability: 4500.20 },
  { id: 'sup2', name: 'Milano Furnishings', url: 'https://example.com/milano.xml', markup: 45, conversionRate: 0.08, profitability: 6200.75 },
  { id: 'sup3', name: 'Office Solutions Inc.', url: 'https://example.com/office.xml', markup: 25, conversionRate: 0.21, profitability: 8100.00 },
];
