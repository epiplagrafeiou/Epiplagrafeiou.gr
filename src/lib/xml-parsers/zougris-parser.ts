
// src/lib/xml-parsers/zougris-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '@/lib/mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  isArray: (name, jpath) => jpath === 'Products.Product',
  cdataPropName: '__cdata',
  trimValues: true,
  parseNodeValue: true,
  textNodeName: '#text',
  tagValueProcessor: (tagName, tagValue) => {
    if (typeof tagValue === 'string' && tagValue.startsWith('<![CDATA[')) {
      return tagValue.substring(9, tagValue.length - 3);
    }
    return tagValue;
  },
});

function getText(node: any): string {
    if (node == null) return '';
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node).trim();
    }
    if (typeof node === 'object') {
      if ('#text' in node) return String((node as any)['#text']).trim();
    }
    return '';
}

export async function zougrisParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);
  const productsNode = parsed?.Products?.Product;

  if (!productsNode) {
    throw new Error('Zougris XML does not contain <Products><Product> nodes.');
  }

  const productArray = Array.isArray(productsNode) ? productsNode : [productsNode];

  const products: XmlProduct[] = [];

  for (const p of productArray) {
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

    products.push({
      id: getText(p.Code) || `zougris-${products.length}`,
      name: getText(p.Title) || 'No Name',
      description: getText(p.Description) || '',
      retailPrice: retailPrice.toString(),
      webOfferPrice: webOfferPrice.toString(),
      category,
      categoryId,
      rawCategory,
      mainImage: images[0] || null,
      images,
      stock: parseInt(getText(p.Quantity), 10) || 0,
      sku: getText(p.Code) || undefined,
      model: getText(p.Model) || undefined,
      isAvailable: (parseInt(getText(p.Quantity), 10) || 0) > 0,
    });
  }

  return products;
}
