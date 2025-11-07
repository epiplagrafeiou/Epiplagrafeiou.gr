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
      // Stop parsing when the value is a string or number.
      // This is to avoid parsing the content of the CDATA tags.
      cdataPropName: '__cdata',
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Force product to always be an array
        if (jpath === 'megapap.products.product') return true;
        return false;
      },
      // The text content of a tag with attributes is parsed as a property.
      // Set this to a specific name.
      textNodeName: '_text',
      // Trim whitespace from text nodes.
      trimValues: true,
    });
    const parsed = parser.parse(xmlText);
    
    const productArray = parsed.megapap?.products?.product;

    if (!productArray || !Array.isArray(productArray)) {
        console.error("Parsed product data is not an array or is missing:", productArray);
        throw new Error('The XML feed does not have the expected structure. Could not find a product array at `megapap.products.product`.');
    }

    const products: Product[] = productArray.map((p: any) => ({
      name: p.name || 'No Name',
      // Use web offer price if available, otherwise fall back.
      price: p.weboffer_price_with_vat || p.retail_price_with_vat || '0',
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
