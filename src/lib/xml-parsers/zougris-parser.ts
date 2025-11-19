
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from './megapap-parser';
import { mapCategory } from '../category-mapper';

export async function zougrisParser(url: string): Promise<XmlProduct[]> {
  console.log("Running Zougris parser"); // Defensive logging
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: true,
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      return jpath === 'Products.Product';
    },
    cdataPropName: '__cdata',
    trimValues: true,
    parseNodeValue: true,
    parseAttributeValue: true,
    parseTrueNumberOnly: true,
    tagValueProcessor: (tagName, tagValue, jPath, isLeafNode, isAttribute) => {
        if (typeof tagValue === 'string' && tagValue.startsWith('<![CDATA[')) {
            return tagValue.substring(9, tagValue.length - 3);
        }
        return tagValue;
    }
  });

  const parsed = parser.parse(xmlText);
  const productArray = parsed.Products?.Product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error('Zougris Parser: Parsed product data is not an array or is missing at Products.Product:', productArray);
    throw new Error(
      'The XML feed does not have the expected structure for Zougris format. Could not find a product array at `Products.Product`.'
    );
  }

  const products: XmlProduct[] = productArray.map((p: any) => {
    
    const allImages: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const imgKey = `B2BImage${i > 1 ? i : ''}`;
      if (p[imgKey] && typeof p[imgKey] === 'string') {
        allImages.push(p[imgKey]);
      }
    }

    const mainImage = allImages[0] || null;

    const rawCategoryParts = [p.Category1, p.Category2, p.Category3].filter(
      (value, index, self) => value && self.indexOf(value) === index
    );
    const rawCategory = rawCategoryParts.join(' > ');
    
    const stock = Number(p.Quantity) || 0;
    
    const retailPrice = p.RetailPrice?.toString().replace(',', '.') || '0';
    const wholesalePrice = p.WholesalePrice?.toString().replace(',', '.') || '0';
    const webOfferPrice = retailPrice !== '0' ? retailPrice : wholesalePrice;

    return {
      id: p.Code?.toString() || `temp-id-${Math.random()}`,
      name: p.Title || 'No Name',
      retailPrice: retailPrice,
      webOfferPrice: webOfferPrice,
      description: p.Description || '',
      category: mapCategory(rawCategory),
      mainImage: mainImage,
      images: allImages,
      stock: stock,
    };
  });

  return products;
}
