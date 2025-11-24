// src/lib/xml-parsers/b2bportal-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  // SAFE isArray function as recommended
  isArray: (name, jpath) => {
    if (name === 'product') return true;
    if (name === 'image') return true;
    if (name === 'item') return true;
    if (name === 'gallery') return true;
    return false;
  },
  textNodeName: '_text',
  trimValues: true,
  cdataPropName: '__cdata',
  parseAttributeValue: true,
  parseNodeValue: true,
  parseTrueNumberOnly: true,
});

/**
 * A bulletproof, defensive function to extract text content from a parsed XML node.
 * It handles CDATA, regular text, and null/undefined values safely.
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
 * A robust, recursive function to find the product array, regardless of the root element or nesting.
 */
function findProductArray(node: any): any[] | null {
  if (!node || typeof node !== 'object') return null;

  for (const key of Object.keys(node)) {
    const value = node[key];
    if (!value) continue;

    // Direct match: <products><product>...</product></products>
    if (key === 'products' && value.product) {
      return Array.isArray(value.product) ? value.product : [value.product];
    }
    
    // Recursive search in case of deeper nesting
    const deeper = findProductArray(value);
    if (deeper) return deeper;
  }

  return null;
}


export async function b2bportalParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);
  const productArray = findProductArray(parsed);

  if (!productArray) {
    console.error('B2B Portal Parser Debug: Parsed XML object keys:', Object.keys(parsed || {}));
    throw new Error(
      'B2B Portal XML parsing failed: Could not locate the product array within the XML structure.'
    );
  }
  
  const products: XmlProduct[] = await Promise.all(
    productArray.map(async (p: any): Promise<XmlProduct> => {
      // The product ID can be an attribute
      const id = p.id != null ? String(p.id) : (getText(p.code) || `b2b-${Math.random()}`);
      
      const rawCategoryOriginal = [getText(p.category), getText(p.subcategory)]
        .filter(Boolean)
        .join(' > ');
      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryOriginal);

      let images: string[] = [];
      const mainImageCandidate = getText(p.image) || getText(p.thumb) || null;
      if (mainImageCandidate) images.push(mainImageCandidate);

      if (p.gallery && p.gallery.length > 0 && p.gallery[0].image) {
          const galleryImages = p.gallery[0].image;
          const extraImages = (Array.isArray(galleryImages) ? galleryImages : [galleryImages])
              .map((img: any) => getText(img))
              .filter(Boolean);
          images = Array.from(new Set([...images, ...extraImages]));
      }
      
      const availabilityText = getText(p.availability).toLowerCase();
      const isAvailable = availabilityText === '1' || availabilityText.includes('διαθέσιμο') || availabilityText.includes('ναι');
      const stock = Number(getText(p.quantity) || getText(p.qty)) || (isAvailable ? 1 : 0);
      
      const retailPriceNum = parseFloat(getText(p.retail_price).replace(',', '.') || '0');
      const wholesalePriceNum = parseFloat(getText(p.price).replace(',', '.') || '0');
      const finalPrice = retailPriceNum > 0 ? retailPriceNum : wholesalePriceNum;

      return {
        id,
        sku: getText(p.sku) || getText(p.code),
        model: getText(p.model) || undefined,
        ean: getText(p.barcode) || undefined,
        name: getText(p.name) || 'No Name',
        description: getText(p.descr) || '',
        retailPrice: retailPriceNum.toString(),
        webOfferPrice: finalPrice.toString(),
        category,
        categoryId,
        rawCategory,
        mainImage: images[0] || null,
        images,
        stock,
        isAvailable,
        manufacturer: getText(p.manufacturer) || undefined,
        url: getText(p.url) || undefined,
      };
    })
  );

  return products;
}
