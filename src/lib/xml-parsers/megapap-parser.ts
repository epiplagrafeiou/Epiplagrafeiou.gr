
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

const getText = (node: any): string => {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim();
  }
  if (typeof node === 'object') {
    if ('__cdata' in node) return String((node as any).__cdata).trim();
    if ('_text' in node) return String((node as any)._text).trim();
  }
  return '';
};

export async function megapapParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);

  const productArray = parsed?.megapap?.products?.product;
  if (!Array.isArray(productArray)) {
    console.error('Megapap XML root:', Object.keys(parsed || {}));
    throw new Error('Megapap XML does not contain products at megapap.products.product');
  }

  const products: XmlProduct[] = [];

  for (const p of productArray) {
    const name = getText(p.name) || 'No Name';

    // raw supplier category
    const rawCat = getText(p.category);

    // map to your Firestore categories
    const mapped = await mapCategory(rawCat);
    const { category, categoryId, rawCategory } = mapped;

    // images
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

    // stock
    const qtyText =
      getText(p.quantity) ||
      getText(p.qty) ||
      getText(p.stock) ||
      '0';
    const stock = Number(qtyText) || 0;

    // prices
    const retail = parseFloat(getText(p.retail_price_with_vat).replace(',', '.') || '0');
    const webOffer = parseFloat(getText(p.weboffer_price_with_vat).replace(',', '.') || '0');
    const basePrice = webOffer || retail || 0;

    let finalWebOfferPrice = basePrice;

    // extra logic for sofas, etc.
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
      mainImage,
      images,
      stock,
      isAvailable: stock > 0,
      sku: getText(p.sku) || undefined,
      model: getText(p.model) || undefined,
    });
  }

  return products;
}
