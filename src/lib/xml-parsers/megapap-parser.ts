// src/lib/xml-parsers/megapap-parser.ts
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

export async function megapapParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);

  // Direct, hardcoded path based on known XML structure.
  const productArraySource = parsed?.megapap?.products?.product;

  if (!productArraySource) {
    console.error('Megapap Parser Debug: Parsed XML object keys:', Object.keys(parsed || {}));
    throw new Error(
      'Megapap XML parsing failed: Could not locate the product array within the XML structure.'
    );
  }
  
  // Ensure we are always working with an array.
  const productArray = Array.isArray(productArraySource) ? productArraySource : [productArraySource];

  const products: XmlProduct[] = [];

  for (const p of productArray) {
    const name = getText(p.name) || 'No Name';
    const rawCat = getText(p.category);
    const { category, categoryId, rawCategory } = await mapCategory(rawCat);

    const images: string[] = [];
    const mainImage = getText(p.main_image) || null;
    if (mainImage) images.push(mainImage);

    if (p.images?.image) {
      const galleryImages = Array.isArray(p.images.image) ? p.images.image : [p.images.image];
      const extraImages = galleryImages
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
