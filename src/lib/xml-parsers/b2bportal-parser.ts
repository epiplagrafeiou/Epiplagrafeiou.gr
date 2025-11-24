// src/lib/xml-parsers/b2bportal-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  isArray: (name, jpath) =>
    jpath.endsWith('.products.product') || jpath.endsWith('.gallery.image'),
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
 * Finds the product array within the parsed XML object, no matter what the root element is.
 * This is the robust way to handle variations like <b2bportal> or <mywebstore>.
 */
function findProductArray(parsed: any): any[] | null {
  if (!parsed || typeof parsed !== 'object') return null;

  const rootKey = Object.keys(parsed)[0];
  if (!rootKey) return null;

  const rootElement = parsed[rootKey];
  
  if (rootElement?.products?.product) {
    const products = rootElement.products.product;
    return Array.isArray(products) ? products : [products];
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
      // The product ID is an attribute of the <product> tag
      const id = p.id != null ? String(p.id) : `b2b-${Math.random()}`;
      
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
        mainImage,
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
