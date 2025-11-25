
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // A safe, universal array handling configuration
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

export async function b2bportalParser(xmlText: string): Promise<XmlProduct[]> {
  const parsed = xmlParser.parse(xmlText);
  
  // Direct and simple product array retrieval
  const productsNode = parsed?.b2bportal?.products?.product;

  if (!productsNode) {
     console.error('B2B Portal Parser Debug: Parsed XML object keys:', Object.keys(parsed?.b2bportal || {}));
     throw new Error('B2B Portal XML parsing failed: Could not locate the product array at the expected path: b2bportal.products.product');
  }

  // Guaranteed to be an array for safe iteration
  const productArray = Array.isArray(productsNode) ? productsNode : [productsNode];

  const products: XmlProduct[] = await Promise.all(
    productArray.map(async (p: any): Promise<XmlProduct> => {
      const id = p.id != null ? String(p.id) : (getText(p.code) || `b2b-${Math.random()}`);

      const rawCategoryOriginal = [getText(p.category), getText(p.subcategory)]
        .filter(Boolean)
        .join(' > ');

      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryOriginal);

      let images: string[] = [];
      const mainImageCandidate = getText(p.image) || getText(p.thumb);
      if (mainImageCandidate) images.push(mainImageCandidate);

      if (p.gallery?.image) {
        const galleryImages = Array.isArray(p.gallery.image)
          ? p.gallery.image
          : [p.gallery.image];

        const extra = galleryImages.map((img: any) => getText(img)).filter(Boolean);
        images = Array.from(new Set([...images, ...extra]));
      }

      const availabilityText = getText(p.availability).toLowerCase();
      const isAvailable =
        availabilityText === '1' ||
        availabilityText.includes('διαθέσιμο') ||
        availabilityText.includes('ναι');

      const stock =
        Number(getText(p.quantity) || getText(p.qty)) || (isAvailable ? 1 : 0);

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
