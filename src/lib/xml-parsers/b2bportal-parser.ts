// src/lib/xml-parsers/b2bportal-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '#text',
  cdataPropName: '__cdata',
  trimValues: true,
  parseAttributeValue: true,
  parseNodeValue: true,
  parseTrueNumberOnly: true,
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    // This configuration helps ensure product and image nodes are always arrays
    return jpath.endsWith('.products.product') || jpath.endsWith('.gallery.image');
  },
});

/**
 * A bulletproof, defensive function to extract text content from a parsed XML node,
 * regardless of its structure (string, number, CDATA, or text node).
 */
function getText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim();
  }
  if (typeof node === 'object') {
    if ('__cdata' in node && node.__cdata != null) return String(node.__cdata).trim();
    if ('#text' in node && node['#text'] != null) return String(node['#text']).trim();
    if ('_text' in node && node._text != null) return String(node._text).trim();
  }
  return '';
}

/**
 * Finds the product array within the parsed XML object, no matter what the root element is called.
 * @param parsed The parsed XML object.
 * @returns An array of product objects, or null if not found.
 */
function findProductArray(parsed: any): any[] | null {
  if (!parsed || typeof parsed !== 'object') return null;

  // Case 1: Standard paths we've seen before
  if (parsed?.b2bportal?.products?.product) return parsed.b2bportal.products.product;
  if (parsed?.mywebstore?.products?.product) return parsed.mywebstore.products.product;
  
  // Case 2: Dynamically search for a 'products' object at the root
  const rootKeys = Object.keys(parsed);
  if (rootKeys.length === 1) {
    const rootElement = parsed[rootKeys[0]];
    if (rootElement?.products?.product) {
      return rootElement.products.product;
    }
  }

  // Case 3: A direct <products> root
  if (parsed?.products?.product) {
    return parsed.products.product;
  }
  
  console.error('[b2bportal-parser] Could not find a "products.product" structure. Top-level keys are:', rootKeys.join(', '));
  return null;
}

export async function b2bportalParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);
  const productArray = findProductArray(parsed);

  if (!productArray) {
    throw new Error(
      'B2B Portal XML parsing failed: Could not locate the product array within the XML structure.'
    );
  }
  
  // Ensure we are always working with an array.
  const productsRaw = Array.isArray(productArray) ? productArray : [productArray];

  const products: XmlProduct[] = await Promise.all(
    productsRaw.map(async (p: any): Promise<XmlProduct> => {
      const id = (p.id != null ? String(p.id) : getText(p.code)) || `b2b-${Math.random()}`;

      const retailPriceNum = parseFloat(getText(p.retail_price).replace(',', '.') || '0');
      const wholesalePriceNum = parseFloat(getText(p.price).replace(',', '.') || '0');
      const finalPrice = retailPriceNum > 0 ? retailPriceNum : wholesalePriceNum;

      const rawCategoryOriginal = [getText(p.category), getText(p.subcategory)]
        .filter(Boolean)
        .join(' > ');
      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryOriginal);

      const availabilityText = getText(p.availability).toLowerCase();
      const isAvailable = availabilityText === '1' || availabilityText.includes('διαθέσιμο') || availabilityText.includes('ναι');
      const stock = Number(getText(p.quantity) || getText(p.qty)) || (isAvailable ? 1 : 0);

      const mainImage = getText(p.image) || getText(p.thumb) || null;
      let images: string[] = [];
      if (p.gallery?.image) {
        const galleryImages = Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image];
        images = galleryImages.map((img: any) => getText(img)).filter(Boolean);
      }
      if (mainImage && !images.includes(mainImage)) {
        images.unshift(mainImage);
      }

      return {
        id,
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
        sku: getText(p.sku) || getText(p.code) || undefined,
        model: getText(p.model) || undefined,
        ean: getText(p.barcode) || undefined,
        manufacturer: getText(p.manufacturer) || undefined,
      };
    })
  );

  return products;
}
