// src/lib/xml-parsers/b2bportal-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  isArray: (name, jpath) =>
    jpath === 'b2bportal.products.product' ||
    jpath === 'mywebstore.products.product' ||
    jpath.endsWith('.gallery.image'),
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

export async function b2bportalParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);

  // ROBUST FIX: Check multiple possible paths for the product array.
  const productArray =
    parsed?.b2bportal?.products?.product ||
    parsed?.mywebstore?.products?.product ||
    parsed?.products?.product;

  if (!productArray || (Array.isArray(productArray) && productArray.length === 0)) {
    console.error('B2B XML root keys:', Object.keys(parsed || {}));
    throw new Error(
      'B2B Portal XML does not contain products at b2bportal.products.product or mywebstore.products.product'
    );
  }
  
  const productsRaw = Array.isArray(productArray) ? productArray : [productArray];


  const products: XmlProduct[] = [];

  for (const p of productsRaw) {
    // images
    let images: string[] = [];
    if (p.image) {
      const main = getText(p.image);
      if (main) images.push(main);
    }
    if (p.gallery?.image) {
      const arr = Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image];
      const extra = arr.map((img: any) => getText(img)).filter(Boolean);
      images = Array.from(new Set([...images, ...extra]));
    }
    const mainImage = images[0] || null;

    // category
    const rawCat = [getText(p.category), getText(p.subcategory)]
      .filter(Boolean)
      .join(' > ');

    const mapped = await mapCategory(rawCat);
    const { category, categoryId, rawCategory } = mapped;

    // availability / stock
    const availabilityText = getText(p.availability).toLowerCase();
    const isAvailable = availabilityText === '1' || availabilityText === 'ναι';

    let stock = 0;
    const stockText =
      getText(p.stock) ||
      getText(p.qty) ||
      getText(p.availability_qty) ||
      '0';
    stock = Number(stockText) || (isAvailable ? 1 : 0);

    // prices
    const retailPriceNum = parseFloat(getText(p.retail_price).replace(',', '.') || '0');
    const wholesalePriceNum = parseFloat(getText(p.price).replace(',', '.') || '0');
    const finalPrice = wholesalePriceNum > 0 ? wholesalePriceNum : retailPriceNum;


    products.push({
      id: getText(p.code) || getText(p.sku) || `b2b-${products.length}`,
      name: getText(p.name) || 'No Name',
      description: getText(p.descr),
      retailPrice: retailPriceNum.toString(),
      webOfferPrice: finalPrice.toString(),
      category,
      categoryId,
      rawCategory,
      mainImage,
      images,
      stock,
      isAvailable,
    });
  }

  return products;
}
