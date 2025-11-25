// src/lib/xml-parsers/b2bportal-parser.ts
import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'product' || name === 'image' || name === 'item' || name === 'gallery',
  textNodeName: '_text',
  trimValues: true,
  cdataPropName: '__cdata',
});

function getText(node: any): string {
    if (node == null) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
    if (typeof node === 'object') {
        if (node.__cdata != null) return String(node.__cdata).trim();
        if (node._text != null) return String(node._text).trim();
        if (node['#text'] != null) return String(node['#text']).trim();
    }
    return '';
}

/**
 * A true recursive function to locate the product array, regardless of root element name or nesting.
 * This is the definitive, robust solution.
 */
function findProductArray(node: any): any[] | null {
  if (!node || typeof node !== 'object') return null;

  // Base case: We found an object that has a 'product' key, which holds our products.
  if (node.product) {
      // Ensure the result is always an array, even if there's only one product.
      return Array.isArray(node.product) ? node.product : [node.product];
  }

  // Recursive step: Search in all values of the current object.
  for (const key in node) {
    const result = findProductArray(node[key]);
    if (result) {
      return result; // Found it in a nested object.
    }
  }

  return null; // Not found in this branch.
}

export function b2bportalParser(xmlText: string): Omit<XmlProduct, 'category' | 'categoryId'>[] {
  console.log("DEBUG: RUNNING B2B PORTAL PARSER (RECURSIVE FINDER V2)");
  const parsed = xmlParser.parse(xmlText);
  const productArray = findProductArray(parsed);

  if (!productArray) {
    console.error("B2B PARSER DEBUG: Parsed object keys:", Object.keys(parsed));
    throw new Error('B2B Portal XML parsing failed: Could not locate the product array within the XML structure.');
  }

  const products = productArray.map((p: any): Omit<XmlProduct, 'category' | 'categoryId'> => {
    const images: string[] = [];
    const mainImageCandidate = getText(p.image) || getText(p.thumb);
    if (mainImageCandidate) images.push(mainImageCandidate);

    if (p.gallery?.image) {
      const galleryImages = Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image];
      const extra = galleryImages.map((img: any) => getText(img)).filter(Boolean);
      images.push(...extra.filter(img => !images.includes(img)));
    }

    const availabilityText = getText(p.availability).toLowerCase();
    const isAvailable = availabilityText === '1' || availabilityText.includes('διαθέσιμο') || availabilityText.includes('ναι');
    const stock = Number(getText(p.quantity) || getText(p.qty)) || (isAvailable ? 1 : 0);

    const retailPriceNum = parseFloat(getText(p.retail_price).replace(',', '.') || '0');
    const wholesalePriceNum = parseFloat(getText(p.price).replace(',', '.') || '0');
    const finalPrice = retailPriceNum > 0 ? retailPriceNum : wholesalePriceNum;

    return {
      id: p.id != null ? String(p.id) : (getText(p.code) || `b2b-${Math.random()}`),
      sku: getText(p.sku) || getText(p.code),
      model: getText(p.model) || undefined,
      ean: getText(p.barcode) || undefined,
      name: getText(p.name) || 'No Name',
      description: getText(p.descr) || '',
      retailPrice: retailPriceNum.toString(),
      webOfferPrice: finalPrice.toString(),
      rawCategory: [getText(p.category), getText(p.subcategory)].filter(Boolean).join(' > '),
      mainImage: images[0] || null,
      images,
      stock,
      isAvailable,
      manufacturer: getText(p.manufacturer) || undefined,
      url: getText(p.url) || undefined,
    };
  });

  return products;
}
