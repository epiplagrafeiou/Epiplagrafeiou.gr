import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '@/lib/types/product';
import { getText, findProductArray } from './parser-utils';

export async function b2bportalParser(xmlText: string): Promise<Omit<XmlProduct, 'category' | 'categoryId'>[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseAttributeValue: true,
    trimValues: true,
    cdataPropName: "__cdata",
    isArray: (name, jpath) => {
        return jpath.endsWith('.product') || jpath.endsWith('.image');
    }
  });

  const parsed = parser.parse(xmlText);
  const productArray = findProductArray(parsed);

  if (!productArray || productArray.length === 0) {
    throw new Error('B2B Portal XML parsing failed: Could not locate the product array within the XML structure.');
  }

  const products: Omit<XmlProduct, 'category' | 'categoryId'>[] = productArray.map((p: any) => {
    const images = (Array.isArray(p.gallery?.image) ? p.gallery.image : [p.gallery?.image]).map(getText).filter(Boolean);
    const mainImage = getText(p.image);
    if (mainImage && !images.includes(mainImage)) {
        images.unshift(mainImage);
    }
    
    return {
      id: getText(p.code),
      name: getText(p.name),
      description: getText(p.descr),
      rawCategory: getText(p.category),
      stock: parseInt(getText(p.availability), 10) || 0,
      retailPrice: getText(p.retail_price),
      webOfferPrice: getText(p.price),
      mainImage: images[0] || null,
      images: images,
      sku: getText(p.sku),
      model: getText(p.model),
      ean: getText(p.barcode),
    };
  });

  return products;
}
