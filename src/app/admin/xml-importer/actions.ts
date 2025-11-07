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
      attributeNamePrefix: '', // Remove @ prefix for easier access
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Force product to always be an array
        if (jpath === 'mywebstore.products.product') return true;
        return false;
      }
    });
    const parsed = parser.parse(xmlText);
    
    // Adjusted path for cs-cart feed structure.
    const productArray = parsed.mywebstore?.products?.product;

    if (!productArray || !Array.isArray(productArray)) {
        console.error("Parsed product data is not an array or is missing:", productArray);
        throw new Error('The XML feed does not have the expected structure. Could not find a product array at `mywebstore.products.product`.');
    }

    const products: Product[] = productArray.map((p: any) => ({
      name: p.name || 'No Name',
      // Prioritize price_with_vat for cs-cart feeds
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
