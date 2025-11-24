
// src/lib/xml-parsers/megapap-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  // SAFE isArray function
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

export async function megapapParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);

  const productArray = findProductArray(parsed);
  if (!productArray) {
    console.error('Megapap Parser Debug: Parsed XML object keys:', Object.keys(parsed || {}));
    throw new Error(
      'Megapap XML parsing failed: Could not locate the product array within the XML structure.'
    );
  }

  const products: XmlProduct[] = [];

  for (const p of productArray) {
    const name = getText(p.name) || 'No Name';

    const rawCat = getText(p.category);
    const { category, categoryId, rawCategory } = await mapCategory(rawCat);

    const images: string[] = [];
    const mainImage = getText(p.main_image) || null;
    if (mainImage) images.push(mainImage);

    // New safe way to parse images
    if (p.images && p.images.length > 0 && p.images[0].image) {
      const galleryImages = p.images[0].image;
      const extraImages = (Array.isArray(galleryImages) ? galleryImages : [galleryImages])
          .map((img: any) => getText(img))
          .filter(Boolean);
      images.push(...extraImages.filter(img => !images.includes(img)));
    }

    const qtyText = getText(p.quantity) || getText(p.qty) || getText(p.stock) || '0';
    const stock = Number(qtyText) || 0;
    
    const retail = parseFloat(getText(p.retail_price_with_vat).replace(',', '.') || '0');
    const webOffer = parseFloat(getText(p.weboffer_price_with_vat).replace(',', '.') || '0');
    const basePrice = webOffer || retail || 0;

    let finalWebOfferPrice = basePrice;
    const lowerName = name.toLowerCase();
    if (lowerName.includes('καναπ') || lowerName.includes('sofa')) {
      finalWebOfferPrice += 75;
    }

    products.push({
      id: (p.id != null ? String(p.id) : getText(p.sku)) || `megapap-${products.length}`,
      name,
      description: getText(p.description),
      retailPrice: retail.toString(),
      webOfferPrice: finalWebOfferPrice.toString(),
      category,
      categoryId,
      rawCategory,
      mainImage: images[0] || null,
      images,
      stock,
      isAvailable: stock > 0,
      sku: getText(p.sku) || undefined,
      model: getText(p.model) || undefined,
    });
  }

  return products;
}
