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
      cdataPropName: '__cdata', // Keep track of cdata, but we will process it
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
      // This is the crucial part to process CDATA
      processEntities: true,
      htmlEntities: true,
      cdataPositionChar: '\\c',
    });
    let parsed = parser.parse(xmlText);
    
    // The fast-xml-parser with the cdataPropName option wraps CDATA content
    // in an object like { __cdata: "value" }. We need to unwrap it.
    // A simple way is to just convert the parsed object back to a string and parse it again
    // without the cdataPropName which will treat CDATA as regular text content.
    const simplifiedParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        if (jpath === 'megapap.products.product') return true;
        return false;
      },
      textNodeName: '_text',
      trimValues: true,
    });

    const productArray = simplifiedParser.parse(xmlText).megapap?.products?.product;

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
