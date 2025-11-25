// src/lib/xml-parsers/zougris-parser.ts
import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  isArray: (name) => name === 'Product',
  textNodeName: '_text',
  trimValues: true,
  cdataPropName: '__cdata',
});

function getText(node: any): string {
    if (node == null) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
    if (typeof node === 'object' && ('_text' in node || '__cdata' in node)) {
        return String(node._text || node.__cdata).trim();
    }
    return '';
};

function findProductArray(parsedXml: any): any[] | null {
    if (parsedXml?.Products?.Product) {
        return Array.isArray(parsedXml.Products.Product) ? parsedXml.Products.Product : [parsedXml.Products.Product];
    }
    return null;
}

export async function zougrisParser(xmlText: string): Promise<Omit<XmlProduct, 'category' | 'categoryId'>[]> {
  console.log("DEBUG: RUNNING ZOUGRIS PARSER (PROMISE VERSION)");
  const parsed = xmlParser.parse(xmlText);
  const productArray = findProductArray(parsed);

  if (!productArray) {
    throw new Error("Zougris XML parsing failed: Could not locate the product array at `Products.Product`.");
  }
  
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
