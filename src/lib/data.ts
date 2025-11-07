
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

export const products: Product[] = [
  {
    id: '1',
    name: 'Scandinavian Chair',
    slug: 'scandinavian-chair',
    price: 129.99,
    description: 'A minimalist Scandinavian-style chair with light wood and grey fabric. Perfect for modern living rooms or offices. Features a comfortable cushioned seat and a sturdy, elegant frame.',
    imageId: 'scandinavian-chair',
    category: 'Chairs',
    images: ['https://images.unsplash.com/photo-1624345690966-db232a144397?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxzY2FuZGluYXZpYW4lMjBjaGFpcnxlbnwwfHx8fDE3NjI1MDk1NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080'],
    stock: 22,
  },
  {
    id: '2',
    name: 'Oak Dining Table',
    slug: 'oak-dining-table',
    price: 799.0,
    description: 'A solid oak dining table that comfortably seats six people. Its robust construction and timeless design make it a centerpiece for any dining room. Finished with a natural oil to protect the wood.',
    imageId: 'oak-dining-table',
    category: 'Tables',
    images: ['https://images.unsplash.com/photo-1707749522047-47be5e1ec97d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxvYWslMjB0YWJsZXxlbnwwfHx8fDE3NjI1MDk1NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080'],
    stock: 10,
  },
  {
    id: '3',
    name: 'Modern 3-Seater Sofa',
    slug: 'modern-sofa',
    price: 950.5,
    description: 'A comfortable three-seater modern sofa in a versatile, neutral grey color. Features deep cushions and a durable fabric, making it ideal for everyday use. Comes with two matching throw pillows.',
    imageId: 'modern-sofa',
    category: 'Sofas',
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBzb2ZhfGVufDB8fHx8MTc2MjQ1ODY3M3ww&ixlib=rb-4.1.0&q=80&w=1080'],
    stock: 5,
  },
  {
    id: '4',
    name: 'Industrial Bookshelf',
    slug: 'bookshelf-ladder',
    price: 349.99,
    description: 'An industrial-style ladder bookshelf made of a strong metal frame and solid wood shelves. Provides ample storage while adding a touch of urban chic to your space.',
    imageId: 'bookshelf-ladder',
    category: 'Storage',
    images: ['https://images.unsplash.com/photo-1589816634282-bf08f4e43ba6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHx3b29kJTIwYm9va3NoZWxmfGVufDB8fHx8MTc2MjUwOTU3Nnww&ixlib=rb-4.1.0&q=80&w=1080'],
    stock: 15,
  },
  {
    id: '5',
    name: 'Minimalist Office Desk',
    slug: 'minimalist-desk',
    price: 250.0,
    description: 'A sleek and minimalist desk with a clean white top and sturdy wooden legs. Its simple design promotes a clutter-free workspace, enhancing focus and productivity.',
    imageId: 'minimalist-desk',
    category: 'Desks',
    images: ['https://images.unsplash.com/photo-1528297506728-9533d2ac3fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8bWluaW1hbGlzdCUyMGRlc2t8ZW58MHx8fHwxNzYyNTAzMjE1fDA&ixlib=rb-4.1.0&q=80&w=1080'],
    stock: 30,
  },
  {
    id: '6',
    name: 'Copper Pendant Light',
    slug: 'pendant-light',
    price: 89.9,
    description: 'A modern pendant light with a striking metallic copper finish. It provides warm, focused light, making it an excellent choice for kitchen islands, dining areas, or entryways.',
    imageId: 'pendant-light',
    category: 'Lighting',
    images: ['https://images.unsplash.com/photo-1656402887556-e727ffe1f6d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxwZW5kYW50JTIwbGlnaHR8ZW58MHx8fHwxNzYyNDYxODg1fDA&ixlib=rb-4.1.0&q=80&w=1080'],
    stock: 50,
  },
];

export const categories = ['Chairs', 'Tables', 'Sofas', 'Storage', 'Desks', 'Lighting'];

export const suppliers = [
  { id: 'sup1', name: 'Nordic Designs', url: 'https://example.com/nordic.xml', markup: 30, conversionRate: 0.12, profitability: 4500.20 },
  { id: 'sup2', name: 'Milano Furnishings', url: 'https://example.com/milano.xml', markup: 45, conversionRate: 0.08, profitability: 6200.75 },
  { id: 'sup3', name: 'Office Solutions Inc.', url: 'https://example.com/office.xml', markup: 25, conversionRate: 0.21, profitability: 8100.00 },
];
