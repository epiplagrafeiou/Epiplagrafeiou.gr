// src/lib/xml-parsers/megapap-parser.ts
import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'product' || name === 'image',
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

  // Base case: We found the 'products' object containing a 'product' key.
  if (node.products && node.products.product) {
    // Ensure the result is always an array, even if there's only one product.
    return Array.isArray(node.products.product) ? node.products.product : [node.products.product];
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

export function megapapParser(xmlText: string): Omit<XmlProduct, 'category' | 'categoryId'>[] {
  console.log("DEBUG: RUNNING MEGAPAP PARSER (RECURSIVE FINDER)");
  const parsed = xmlParser.parse(xmlText);
  const productArray = findProductArray(parsed);

  if (!productArray) {
    console.error("MEGAPAP PARSER DEBUG: Parsed object keys:", Object.keys(parsed));
    throw new Error('Megapap XML parsing failed: Could not locate the product array within the XML structure.');
  }

  const products = productArray.map((p: any): Omit<XmlProduct, 'category' | 'categoryId'> => {
    const name = getText(p.name) || 'No Name';
    
    const images: string[] = [];
    const mainImage = getText(p.main_image) || null;
    if (mainImage) images.push(mainImage);

    if (p.images?.image) {
      const galleryImages = Array.isArray(p.images.image) ? p.images.image : [p.images.image];
      const extraImages = galleryImages.map((img: any) => getText(img)).filter(Boolean);
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

    return {
      id: (p.id != null ? String(p.id) : getText(p.sku)) || `megapap-${Math.random()}`,
      name,
      description: getText(p.description),
      retailPrice: retail.toString(),
      webOfferPrice: finalWebOfferPrice.toString(),
      rawCategory: [getText(p.category), getText(p.subcategory)].filter(Boolean).join(' > '),
      mainImage: images[0] || null,
      images,
      stock,
      isAvailable: stock > 0,
      sku: getText(p.sku) || undefined,
      model: getText(p.model) || undefined,
    };
  });

  return products;
}
