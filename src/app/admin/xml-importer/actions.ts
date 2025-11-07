
'use server';

import { XMLParser } from 'fast-xml-parser';

interface Product {
  id: string;
  name: string;
  retailPrice: string;
  webOfferPrice: string;
  description: string;
  category: string;
  images: string[];
}

export async function syncProductsFromXml(url: string): Promise<Product[]> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.statusText}`);
    }
    const xmlText = await response.text();

    const simplifiedParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        return jpath === 'megapap.products.product' || jpath.endsWith('.images.image');
      },
      textNodeName: '_text',
      trimValues: true,
      cdataPropName: '__cdata',
    });
    
    // The parser creates objects for CDATA tags. We need to flatten them.
    const deCdata = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(deCdata);
        }
        if ('__cdata' in obj) {
            return obj.__cdata;
        }
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            newObj[key] = deCdata(obj[key]);
        }
        return newObj;
    };


    const parsed = simplifiedParser.parse(xmlText);
    const productArray = deCdata(parsed).megapap?.products?.product;


    if (!productArray || !Array.isArray(productArray)) {
        console.error("Parsed product data is not an array or is missing:", productArray);
        throw new Error('The XML feed does not have the expected structure. Could not find a product array at `megapap.products.product`.');
    }

    const products: Product[] = productArray.map((p: any) => {
        let images: string[] = [];
        if (p.images && p.images.image) {
             if (Array.isArray(p.images.image)) {
                // It can be an array of strings or an array of objects with an 'id' and '_text'
                images = p.images.image.map((img: any) => (typeof img === 'object' && img._text) ? img._text : img).filter(Boolean);
            } else if (typeof p.images.image === 'object' && p.images.image._text) {
                images = [p.images.image._text];
            } else if (typeof p.images.image === 'string') {
                images = [p.images.image];
            }
        }
        
        if (images.length === 0 && p.main_image) {
            images = [p.main_image];
        }

        return {
            id: p.id || `temp-id-${Math.random()}`,
            name: p.name || 'No Name',
            retailPrice: p.retail_price_with_vat || '0',
            webOfferPrice: p.weboffer_price_with_vat || p.retail_price_with_vat || '0',
            description: p.description || '',
            category: p.category || 'Uncategorized',
            images: images,
        };
    });

    return products;
  } catch (error) {
    console.error('Error syncing products from XML:', error);
    if (error instanceof Error) {
       throw new Error(`Could not parse XML from the provided URL. Please check the URL and the XML format. Details: ${error.message}`);
    }
    throw new Error('An unknown error occurred during XML sync.');
  }
}
