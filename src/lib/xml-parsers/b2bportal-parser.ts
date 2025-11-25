// src/lib/xml-parsers/b2bportal-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  // A safe isArray function that is not path-dependent.
  isArray: (name, jpath) => {
    if (name === 'product') return true;
    if (name === 'image') return true;
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

export async function b2bportalParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);

  // Direct, hardcoded path based on known XML structure.
  const productArraySource = parsed?.b2bportal?.products?.product;

  if (!productArraySource) {
    console.error('B2B Portal Parser Debug: Parsed XML object keys:', Object.keys(parsed || {}));
    throw new Error(
      'B2B Portal XML parsing failed: Could not locate the product array at the expected path: b2bportal.products.product'
    );
  }
  
  // Ensure we are always working with an array.
  const productArray = Array.isArray(productArraySource) ? productArraySource : [productArraySource];
  
  const products: XmlProduct[] = await Promise.all(
    productArray.map(async (p: any): Promise<XmlProduct> => {
      const id = p.id != null ? String(p.id) : (getText(p.code) || `b2b-${Math.random()}`);
      
      const rawCategoryOriginal = [getText(p.category), getText(p.subcategory)]
        .filter(Boolean)
        .join(' > ');
      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryOriginal);

      let images: string[] = [];
      const mainImageCandidate = getText(p.image) || getText(p.thumb) || null;
      if (mainImageCandidate) images.push(mainImageCandidate);

      if (p.gallery?.image) {
          const galleryImages = Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image];
          const extraImages = galleryImages
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
