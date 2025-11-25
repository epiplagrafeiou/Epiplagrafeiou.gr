
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  // SAFE universal array handling based on user feedback
  isArray: (name) => {
    return name === 'product' || name === 'image' || name === 'item';
  },
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

function findProductArray(node: any): any[] | null {
  if (!node || typeof node !== 'object') return null;

  for (const key of Object.keys(node)) {
    const value = node[key];
    if (key === 'products' && value?.product) {
      return Array.isArray(value.product) ? value.product : [value.product];
    }
    if (typeof value === 'object') {
      const result = findProductArray(value);
      if (result) return result;
    }
  }
  return null;
}

export async function megapapParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);
  const productArray = findProductArray(parsed);

  if (!productArray) {
    console.error('Megapap Parser Debug: Parsed XML object keys:', Object.keys(parsed || {}));
    throw new Error('Megapap XML parsing failed: Could not locate the product array within the XML structure.');
  }

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
