// src/lib/xml-parsers/megapap-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  isArray: (name, jpath) =>
    jpath === 'megapap.products.product' ||
    jpath.endsWith('.images.image'),
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
  // Common case: a single root element like <megapap> or <mywebstore>
  const rootElement = parsed[rootKeys[0]];
  if (rootElement?.products?.product) {
    return Array.isArray(rootElement.products.product)
      ? rootElement.products.product
      : [rootElement.products.product];
  }
  // Fallback for a direct <products> root
  if (parsed?.products?.product) {
     return Array.isArray(parsed.products.product)
      ? parsed.products.product
      : [parsed.products.product];
  }
  return null;
}


export async function megapapParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);

  const productArray = findProductArray(parsed);
  if (!productArray) {
    console.error('Megapap XML root keys:', Object.keys(parsed || {}));
    throw new Error('Megapap XML parsing failed: Could not locate the product array within the XML structure.');
  }

  const products: XmlProduct[] = [];

  for (const p of productArray) {
    const name = getText(p.name) || 'No Name';

    const rawCat = getText(p.category);
    const mapped = await mapCategory(rawCat);
    const { category, categoryId, rawCategory } = mapped;

    const images: string[] = [];
    const mainImage = getText(p.main_image) || null;
    if (mainImage) images.push(mainImage);

    if (p.images?.image) {
      const arr = Array.isArray(p.images.image) ? p.images.image : [p.images.image];
      for (const img of arr) {
        const url = getText(img);
        if (url && !images.includes(url)) images.push(url);
      }
    }

    const qtyText = getText(p.quantity) || getText(p.qty) || getText(p.stock) || '0';
    const stock = Number(qtyText) || 0;

    const retail = parseFloat(getText(p.retail_price_with_vat).replace(',', '.') || '0');
    const webOffer = parseFloat(getText(p.weboffer_price_with_vat).replace(',', '.') || '0');
    const basePrice = webOffer || retail || 0;
    
    products.push({
      id: (p.id != null ? String(p.id) : getText(p.sku)) || `megapap-${Math.random()}`,
      name,
      description: getText(p.description),
      retailPrice: retail.toString(),
      webOfferPrice: basePrice.toString(),
      category,
      categoryId,
      rawCategory,
      mainImage: images[0] || null,
      images,
      stock,
      isAvailable: stock > 0,
    });
  }

  return products;
}
