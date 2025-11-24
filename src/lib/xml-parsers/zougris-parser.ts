
// src/lib/xml-parsers/zougris-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '@/lib/mappers/categoryMapper';

// Safe text extractor for any node shape
function getText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim();
  }
  if (typeof node === 'object') {
    if ('__cdata' in node) return String((node as any).__cdata).trim();
    if ('_text' in node) return String((node as any)._text).trim();
    if ('#text' in node) return String((node as any)['#text']).trim();
  }
  return '';
}

export async function zougrisParser(url: string): Promise<XmlProduct[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch Zougris XML: ${response.status} ${response.statusText}`);
  }

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
    parseTagValue: true,
    textNodeName: '#text',
    cdataPropName: '__cdata',
    isArray: (name, jpath) => jpath === 'Products.Product',
  });
  
  const parsed = parser.parse(xmlText);
  
  const productArray = parsed?.Products?.Product;
  if (!productArray) {
    throw new Error('Zougris XML does not contain products at Products.Product');
  }

  const productsRaw = Array.isArray(productArray) ? productArray : [productArray];

  const products: XmlProduct[] = await Promise.all(
    productsRaw.map(async (p: any): Promise<XmlProduct> => {
      const id = getText(p.Code) || `zougris-${Math.random().toString(36).slice(2)}`;
      const name = getText(p.Title) || 'No Name';
      
      const rawCategoryString = [
        getText(p.Category1),
        getText(p.Category2),
        getText(p.Category3),
        getText(p.Epilogi),
      ].filter(Boolean).join(' > ');
      
      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryString);

      const allImages = Object.keys(p)
        .filter(k => k.toLowerCase().startsWith('b2bimage'))
        .map(k => getText(p[k]))
        .filter(Boolean);

      const stock = parseInt(getText(p.Quantity), 10) || 0;
      
      const retailPriceStr = getText(p.RetailPrice) || '0';
      const wholesalePriceStr = getText(p.WholesalePrice) || '0';
      const retailPriceNum = parseFloat(retailPriceStr.replace(',', '.')) || 0;
      const wholesalePriceNum = parseFloat(wholesalePriceStr.replace(',', '.')) || 0;
      
      const basePrice = wholesalePriceNum || retailPriceNum || 0;
      const retailPrice = retailPriceNum > 0 ? retailPriceNum.toString() : '0';
      const webOfferPrice = basePrice > 0 ? basePrice.toString() : '0';

      return {
        id,
        name,
        sku: getText(p.Code) || undefined,
        model: getText(p.Model) || undefined,
        description: getText(p.Description) || '',
        rawCategory,
        category,
        categoryId,
        retailPrice,
        webOfferPrice,
        stock,
        isAvailable: stock > 0,
        images: allImages,
        mainImage: allImages[0] || null,
      };
    })
  );

  return products;
}
