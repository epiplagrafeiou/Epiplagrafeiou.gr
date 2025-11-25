import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '@/lib/types/product';

function findProductArray(node: any): any[] {
  for (const key in node) {
    if (key === 'product' && Array.isArray(node[key])) {
      return node[key];
    }
    if (key === 'product' && typeof node[key] === 'object' && node[key] !== null) {
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


export async function megapapParser(xmlText: string): Promise<Omit<XmlProduct, 'category' | 'categoryId'>[]> {
    const parser = new XMLParser({
        ignoreAttributes: true,
        isArray: (name) => name === 'product' || name === 'image',
        cdataPropName: '__cdata',
    });

    const parsed = parser.parse(xmlText);
    const productArray = findProductArray(parsed);

    if (!productArray || productArray.length === 0) {
        throw new Error('Megapap XML parsing failed: Could not locate the product array within the XML structure.');
    }
    
    const products: Omit<XmlProduct, 'category' | 'categoryId'>[] = productArray.map((p: any) => {
        let images = p.images?.image || [];
        if (p.main_image && !images.includes(p.main_image)) {
            images.unshift(p.main_image);
        }

        return {
            id: p.id.toString(),
            name: p.name,
            description: p.description,
            rawCategory: [p.category, p.subcategory].filter(Boolean).join(' > '),
            stock: Number(p.quantity || p.qty || 0),
            retailPrice: p.retail_price_with_vat,
            webOfferPrice: p.weboffer_price_with_vat,
            mainImage: images[0] || null,
            images: images,
            sku: p.id.toString(),
            ean: p.barcode,
        };
    });

    return products;
}
