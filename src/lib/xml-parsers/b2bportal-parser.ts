// src/lib/xml-parsers/b2bportal-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  isArray: (name, jpath) =>
    jpath.endsWith('.products.product') ||
    jpath.endsWith('.gallery.image'),
  textNodeName: '_text',
  trimValues: true,
  cdataPropName: '__cdata',
  parseAttributeValue: true,
  parseNodeValue: true,
  parseTrueNumberOnly: true,
});

/**
 * A bulletproof, defensive function to extract text content from a parsed XML node.
 */
function getText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim();
  }
  if (typeof node === 'object') {
    if ('__cdata' in node && node.__cdata != null) return String(node.__cdata).trim();
    if ('_text' in node && node._text != null) return String(node._text).trim();
    if ('#text' in node && node['#text'] != null) return String(node['#text']).trim();
  }
  return '';
}

/**
 * Finds the product array within the parsed XML object, no matter what the root element is.
 */
function findProductArray(parsed: any): any[] | null {
  if (!parsed || typeof parsed !== 'object') return null;

  const rootKeys = Object.keys(parsed);
  if (rootKeys.length === 0) return null;

  for (const key of rootKeys) {
    const rootElement = parsed[key];
    if (rootElement?.products?.product) {
      return Array.isArray(rootElement.products.product)
        ? rootElement.products.product
        : [rootElement.products.product];
    }
  }

  // Fallback for a direct <products> root
  if (parsed?.products?.product) {
     return Array.isArray(parsed.products.product)
      ? parsed.products.product
      : [parsed.products.product];
  }
  
  return null;
}

export async function b2bportalParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);
  const productArray = findProductArray(parsed);

  if (!productArray) {
    console.error('B2B Portal XML root keys:', Object.keys(parsed || {}));
    throw new Error(
      'B2B Portal XML parsing failed: Could not locate the product array within the XML structure.'
    );
  }
  
  const products: XmlProduct[] = await Promise.all(
    productArray.map(async (p: any): Promise<XmlProduct> => {
      const rawCategoryOriginal = [getText(p.category), getText(p.subcategory)]
        .filter(Boolean)
        .join(' > ');
      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryOriginal);

      const mainImage = getText(p.image) || getText(p.thumb) || null;
      let images: string[] = [];
      if (p.gallery?.image) {
        const galleryImages = Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image];
        images = galleryImages.map((img: any) => getText(img)).filter(Boolean);
      }
      if (mainImage && !images.includes(mainImage)) {
        images.unshift(mainImage);
      }
      
      const availabilityText = getText(p.availability).toLowerCase();
      const isAvailable = availabilityText === '1' || availabilityText.includes('διαθέσιμο') || availabilityText.includes('ναι');
      const stock = Number(getText(p.quantity) || getText(p.qty)) || (isAvailable ? 1 : 0);
      
      const retailPriceNum = parseFloat(getText(p.retail_price).replace(',', '.') || '0');
      const wholesalePriceNum = parseFloat(getText(p.price).replace(',', '.') || '0');
      const finalPrice = retailPriceNum > 0 ? retailPriceNum : wholesalePriceNum;

      return {
        id: getText(p.code) || `b2b-${Math.random()}`,
        name: getText(p.name) || 'No Name',
        description: getText(p.descr) || '',
        retailPrice: retailPriceNum.toString(),
        webOfferPrice: finalPrice.toString(),
        category,
        categoryId,
        rawCategory,
        mainImage,
        images,
        stock,
        isAvailable,
      };
    })
  );

  return products;
}
