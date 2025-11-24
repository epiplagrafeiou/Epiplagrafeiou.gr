'use server';

import type { XmlProduct } from '../types/product';
import { mapCategory } from '@/lib/mappers/categoryMapper';

// Safe text extractor compatible with fast-xml-parser config in actions.ts
function getText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim();
  }
  if (typeof node === 'object') {
    if (typeof node['#text'] === 'string' || typeof node['#text'] === 'number') {
      return String(node['#text']).trim();
    }
    if (typeof node._text === 'string' || typeof node._text === 'number') {
      return String(node._text).trim();
    }
    if (typeof node.__cdata === 'string' || typeof node.__cdata === 'number') {
      return String(node.__cdata).trim();
    }
  }
  return '';
}

export async function zougrisParser(json: any): Promise<XmlProduct[]> {
  // Expect structure: { Products: { Product: [...] } }
  let productArray: any = json?.Products?.Product;

  if (!productArray) {
    console.error('Zougris Parser: No products found at `Products.Product`', json);
    throw new Error('Zougris XML does not contain products at Products.Product');
  }

  if (!Array.isArray(productArray)) {
    productArray = [productArray];
  }

  const products: XmlProduct[] = await Promise.all(
    productArray.map(async (p: any) => {
      const id = getText(p.Code) || `zougris-${Math.random().toString(36).slice(2, 10)}`;
      const name = getText(p.Title) || 'No Name';

      const rawCategoryString = [
        getText(p.Category1),
        getText(p.Category2),
        getText(p.Category3),
        getText(p.Epilogi),
      ]
        .filter(Boolean)
        .join(' > ');

      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryString);

      const imageKeys = Object.keys(p).filter(k => k.toLowerCase().startsWith('b2bimage'));
      const allImages = imageKeys.map(k => getText(p[k])).filter(Boolean);

      const stock = parseInt(getText(p.Quantity), 10) || 0;

      const retailPriceStr = getText(p.RetailPrice) || '0';
      const wholesalePriceStr = getText(p.WholesalePrice) || '0';

      const retailPrice = retailPriceStr.replace(',', '.');
      const webOfferPrice = (wholesalePriceStr || retailPrice).replace(',', '.');

      const product: XmlProduct = {
        id,
        name,
        sku: getText(p.Code) || undefined,
        model: getText(p.Model) || undefined,
        description: getText(p.Description) || '',
        rawCategory: rawCategory || rawCategoryString,
        category,
        categoryId,
        retailPrice,
        webOfferPrice,
        stock,
        isAvailable: stock > 0,
        images: allImages,
        mainImage: allImages[0] || null,
      };

      return product;
    })
  );

  return products;
}