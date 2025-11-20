'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../utils/category-mapper';

// Safe text extractor
const getText = (node: any): string => {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (typeof node === 'object') {
    if ('__cdata' in node) return String(node.__cdata).trim();
    if ('_text' in node) return String(node._text).trim();
  }
  return '';
};

export async function zougrisParser(url: string): Promise<XmlProduct[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name, jpath) => jpath === 'Products.Product',
    textNodeName: '_text',
    trimValues: true,
    cdataPropName: '__cdata',
    parseNodeValue: true,
    parseAttributeValue: true,
    parseTrueNumberOnly: true,
  });

  const parsed = parser.parse(xmlText);
  const productArray = parsed?.Products?.Product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error('Parsed product data is not an array or is missing:', productArray);
    throw new Error('The XML feed does not have the expected structure at `Products.Product`.');
  }

  const products: XmlProduct[] = productArray.map((p: any) => {
    // Collect images: B2BImage, B2BImage2, B2BImage3...
    const imageKeys = Object.keys(p).filter(k => k.toLowerCase().startsWith('b2bimage'));
    const allImages = imageKeys.map(k => getText(p[k])).filter(Boolean);
    const mainImage = allImages[0] || null;

    // Category path: Category1 > Category2 > Category3 > Epilogi
    const categoryParts = [
      getText(p.Category1),
      getText(p.Category2),
      getText(p.Category3),
      getText(p.Epilogi),
    ].filter(Boolean);
    const rawCategory = categoryParts.join(' > ');

    // Stock: real quantity
    const stock = Number(getText(p.Quantity)) || 0;

    // Prices
    const retailPriceNum = parseFloat((getText(p.RetailPrice) || '0').replace(',', '.'));
    const wholesalePriceNum = parseFloat((getText(p.WholesalePrice) || '0').replace(',', '.'));
    const finalPriceNum = retailPriceNum > 0 ? retailPriceNum : wholesalePriceNum;

    return {
      id: getText(p.Code) || `zougris-${Math.random()}`,
      name: getText(p.Title) || 'No Name',
      retailPrice: retailPriceNum.toString(),
      webOfferPrice: finalPriceNum.toString(),
      description: getText(p.Description) || '',
      // 👉 If you want raw categories only, replace mapCategory(rawCategory) with rawCategory
      category: mapCategory(rawCategory),
      mainImage,
      images: allImages,
      stock,
      isAvailable: stock > 0,
    };
  });

  return products;
}
