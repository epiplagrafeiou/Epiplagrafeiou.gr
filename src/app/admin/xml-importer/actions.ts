'use server';

import { XMLParser } from 'fast-xml-parser';

interface Product {
  name: string;
  price: string;
  description: string;
  category: string;
}

export async function syncProductsFromXml(url: string): Promise<Product[]> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.statusText}`);
    }
    const xmlText = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const parsed = parser.parse(xmlText);
    
    // This assumes a structure like <products><product>...</product></products>
    // You might need to adjust the path `parsed.products.product` based on the actual XML structure.
    const productArray = parsed.mywebstore?.products?.product || parsed.products?.product || [];

    if (!Array.isArray(productArray)) {
        console.error("Parsed product data is not an array:", productArray);
        throw new Error('The XML feed does not have the expected structure. Could not find a product array.');
    }

    const products: Product[] = productArray.map((p: any) => ({
      name: p.name || 'No Name',
      price: p.price_with_vat || p.price || '0',
      description: p.description || '',
      category: p.category || 'Uncategorized',
    }));

    return products;
  } catch (error) {
    console.error('Error syncing products from XML:', error);
    if (error instanceof Error) {
       throw new Error(`Could not parse XML from the provided URL. Please check the URL and the XML format. Details: ${error.message}`);
    }
    throw new Error('An unknown error occurred during XML sync.');
  }
}
