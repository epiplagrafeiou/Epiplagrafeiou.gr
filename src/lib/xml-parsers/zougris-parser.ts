
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  // A safe, universal array handling configuration
  isArray: (name) => {
    return name === 'Product' || name === 'image' || name === 'item';
  },
  trimValues: true,
  textNodeName: '_text',
  cdataPropName: '__cdata',
  tagValueProcessor: (tagName, tagValue) => {
    if (typeof tagValue === 'string' && tagValue.startsWith('<![CDATA[')) {
      return tagValue.substring(9, tagValue.length - 3);
    }
    return tagValue;
  }
});

function getText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (typeof node === 'object' && ('_text' in node || '__cdata' in node)) {
    return String(node._text || node.__cdata).trim();
  }
  return '';
};

export async function zougrisParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);
  
  // Direct and simple product array retrieval
  const productsNode = parsed?.Products?.Product;

  if (!productsNode) {
    console.error('Zougris Parser Debug: Parsed XML object keys:', Object.keys(parsed || {}));
    throw new Error("Zougris XML parsing failed: Could not locate the product array at the expected path: Products.Product");
  }

  // Guaranteed to be an array for safe iteration
  const productArray = Array.isArray(productsNode) ? productsNode : [productsNode];
  
  const products: XmlProduct[] = await Promise.all(
    productArray.map(async (p: any): Promise<XmlProduct> => {
      const rawCategoryString = [
        getText(p.Category1),
        getText(p.Category2),
        getText(p.Category3),
      ].filter(Boolean).join(' > ');
      
      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryString);

      const images = [
        getText(p.B2BImage),
        getText(p.B2BImage2),
        getText(p.B2BImage3),
        getText(p.B2BImage4),
        getText(p.B2BImage5),
      ].filter(Boolean);

      const retailPrice = parseFloat(getText(p.RetailPrice)?.replace(',', '.') || '0');
      const wholesalePrice = parseFloat(getText(p.WholesalePrice)?.replace(',', '.') || '0');
      const webOfferPrice = wholesalePrice || retailPrice;

      const stock = parseInt(getText(p.Quantity), 10) || 0;

      return {
          id: getText(p.Code) || `zougris-${Math.random()}`,
          name: getText(p.Title) || 'No Name',
          description: getText(p.Description) || '',
          retailPrice: retailPrice.toString(),
          webOfferPrice: webOfferPrice.toString(),
          category,
          categoryId,
          rawCategory,
          mainImage: images[0] || null,
          images,
          stock,
          isAvailable: stock > 0,
          sku: getText(p.Code) || undefined,
          model: getText(p.Model) || undefined,
      };
    })
  );
  return products;
}
