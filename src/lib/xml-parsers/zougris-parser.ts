// src/lib/xml-parsers/zougris-parser.ts
import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';

// This parser is now synchronous and only responsible for converting XML text to a raw product array.
// All category mapping is handled separately for performance and reliability.

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  isArray: (name) => name === 'Product',
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

function findProductArray(parsedXml: any): any[] {
    if (parsedXml?.Products?.Product) {
        return Array.isArray(parsedXml.Products.Product) ? parsedXml.Products.Product : [parsedXml.Products.Product];
    }
    throw new Error("Zougris XML parsing failed: Could not locate the product array at `Products.Product`.");
}

export function zougrisParser(xmlText: string): Omit<XmlProduct, 'category' | 'categoryId'>[] {
  console.log("DEBUG: RUNNING ZOUGRIS PARSER (SIMPLE SYNC VERSION)");
  const parsed = xmlParser.parse(xmlText);
  const productArray = findProductArray(parsed);
  
  const products = productArray.map((p: any): Omit<XmlProduct, 'category' | 'categoryId'> => {
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
          rawCategory: [
            getText(p.Category1),
            getText(p.Category2),
            getText(p.Category3),
          ].filter(Boolean).join(' > '),
          mainImage: images[0] || null,
          images,
          stock,
          isAvailable: stock > 0,
          sku: getText(p.Code) || undefined,
          model: getText(p.Model) || undefined,
      };
    });

  return products;
}
