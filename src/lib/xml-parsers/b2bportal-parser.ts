// src/lib/xml-parsers/b2bportal-parser.ts
import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '@/lib/types/product';
import { mapProductsCategories } from '@/lib/mappers/categoryMapper';

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

export async function b2bportalParser(xmlText: string): Promise<Omit<XmlProduct, 'category' | 'categoryId'>[]> {
  console.log("🔥 B2BPORTAL PARSER LOADED — VERSION X1");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseAttributeValue: true,
    trimValues: true,
    cdataPropName: "__cdata",
    isArray: (name, jpath) => {
        // Defines which tags should always be treated as arrays
        return jpath.endsWith('.product') || jpath.endsWith('.image');
    }
  });

  const parsed = parser.parse(xmlText);
  console.log("🧩 findProductArray CALLED");
  const productArray = findProductArray(parsed);

  if (!productArray || productArray.length === 0) {
    throw new Error('B2B Portal XML parsing failed: Could not locate the product array within the XML structure.');
  }

  const products: Omit<XmlProduct, 'category' | 'categoryId'>[] = productArray.map((p: any) => {
    const images = (p.gallery?.image || []).map((img: any) => img?.['#text'] || img).filter(Boolean);
    if (p.image && !images.includes(p.image)) {
        images.unshift(p.image);
    }
    
    return {
      id: p.code,
      name: p.name,
      description: p.descr,
      rawCategory: p.category,
      stock: parseInt(p.availability, 10) || 0,
      retailPrice: p.retail_price,
      webOfferPrice: p.price,
      mainImage: images[0] || null,
      images: images,
      sku: p.sku,
      model: p.model,
      ean: p.barcode,
    };
  });

  return products;
}
