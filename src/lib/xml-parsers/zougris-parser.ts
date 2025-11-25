import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '@/lib/types/product';

function findProductArray(node: any): any[] {
  for (const key in node) {
    if (key === 'Product' && Array.isArray(node[key])) {
      return node[key];
    }
    if (key === 'Product' && typeof node[key] === 'object' && node[key] !== null) {
      return [node[key]]; // Handle single product case
    }
    if (typeof node[key] === 'object' && node[key] !== null) {
      const result = findProductArray(node[key]);
      if (result.length > 0) {
        return result;
      }
    }
  }
  return [];
}

export async function zougrisParser(xmlText: string): Promise<Omit<XmlProduct, 'category' | 'categoryId'>[]> {
    const parser = new XMLParser({
        ignoreAttributes: true,
        isArray: (name) => name === 'Product',
        cdataPropName: '__cdata',
    });

    const parsed = parser.parse(xmlText);
    const productArray = findProductArray(parsed);

    if (!productArray || productArray.length === 0) {
        throw new Error('Zougris XML parsing failed: Could not locate the product array within the XML structure.');
    }
    
    const products: Omit<XmlProduct, 'category' | 'categoryId'>[] = productArray.map((p: any) => {
        const images = [p.B2BImage, p.B2BImage2, p.B2BImage3, p.B2BImage4, p.B2BImage5].filter(Boolean);
        const rawCategory = [p.Category1, p.Category2, p.Category3].filter(Boolean).join(' > ');
        
        const retailPrice = parseFloat(p.RetailPrice?.toString().replace(',', '.') || '0');
        const wholesalePrice = parseFloat(p.WholesalePrice?.toString().replace(',', '.') || '0');
        const webOfferPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

        return {
            id: p.Code?.toString() || `zougris-${Math.random()}`,
            name: p.Title || 'No Name',
            description: p.Description || '',
            rawCategory: rawCategory,
            stock: parseInt(p.Quantity, 10) || 0,
            retailPrice: retailPrice.toString(),
            webOfferPrice: webOfferPrice.toString(),
            mainImage: images[0] || null,
            images: images,
            sku: p.Code?.toString(),
            ean: p.Barcode,
        };
    });

    return products;
}
