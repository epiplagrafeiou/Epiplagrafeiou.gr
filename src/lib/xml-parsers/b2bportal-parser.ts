
// src/lib/xml-parsers/b2bportal-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

// Safe text extractor for any node shape
function getText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim();
  }
  if (typeof node === 'object') {
    if ('__cdata' in node) return String((node as any).__cdata).trim();
    if ('_text' in node) return String((node as any)._text).trim();
    if ('#text' in node) return String((node as any)['#text']).trim();
  }
  return '';
}

export async function b2bportalParser(xmlText: string): Promise<XmlProduct[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    trimValues: true,
    parseAttributeValue: true,
    parseTagValue: true,
    textNodeName: '#text',
    cdataPropName: '__cdata',
    // Let the parser determine array types automatically for simplicity
    isArray: (name, jpath, isLeafNode, isAttribute) => {
        if (jpath === "b2bportal.products.product") return true;
        if (jpath.endsWith(".gallery.image")) return true;
        return false;
    }
  });

  const parsed = parser.parse(xmlText);

  // **THE DEFINITIVE FIX: Robustly find the product array**
  const productData = parsed?.b2bportal?.products?.product;

  if (!productData) {
    console.error('B2B Parser Error: Could not find product array. Parsed object keys:', Object.keys(parsed || {}));
    if (parsed?.b2bportal?.products) {
      console.error('Found "products" object, but no "product" key inside. Keys of products object:', Object.keys(parsed.b2bportal.products));
    }
    throw new Error(
      'B2B Portal XML does not contain products at the expected path: b2bportal.products.product'
    );
  }

  // Ensure we are always working with an array, even if there's only one product
  const productsArray = Array.isArray(productData) ? productData : [productData];

  const products: XmlProduct[] = await Promise.all(
    productsArray.map(async (p: any): Promise<XmlProduct> => {
      const idAttr = p.id;
      const id = idAttr != null ? String(idAttr) : `b2b-${Math.random().toString(36).slice(2)}`;

      const code = getText(p.code);
      const sku = getText(p.sku) || code || undefined;
      const model = getText(p.model);
      const name = getText(p.name) || 'No Name';
      const description = getText(p.descr);
      const manufacturer = getText(p.manufacturer);

      const retailPriceNum = parseFloat(getText(p.retail_price)?.replace(',', '.') || '0');
      const wholesalePriceNum = parseFloat(getText(p.price)?.replace(',', '.') || '0');

      const basePrice = wholesalePriceNum || retailPriceNum || 0;

      const retailPrice = retailPriceNum > 0 ? retailPriceNum.toString() : '0';
      const webOfferPrice = basePrice > 0 ? basePrice.toString() : '0';

      // Category: combine category + subcategory for raw
      const rawCategoryOriginal = [getText(p.category), getText(p.subcategory)]
        .filter(Boolean)
        .join(' > ');

      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryOriginal);

      // Availability & stock
      const availabilityText = getText(p.availability).toLowerCase();
      const isAvailable =
        availabilityText === '1' ||
        availabilityText.includes('διαθεσιμ') ||
        availabilityText.includes('άμεση') ||
        availabilityText.includes('παράδοση');

      const quantityNode = p.quantity ?? p.qty ?? p.stock ?? 0;
      const stock = Number(getText(quantityNode)) || (isAvailable ? 1 : 0);

      // Images
      const mainImage = getText(p.image) || getText(p.thumb) || null;

      let images: string[] = [];
      if (p.gallery?.image) {
        const galleryImages = Array.isArray(p.gallery.image)
          ? p.gallery.image
          : [p.gallery.image];
        images = galleryImages
          .map((img: any) => getText(img))
          .filter(Boolean);
      }

      if (mainImage && !images.includes(mainImage)) {
        images.unshift(mainImage);
      }

      // Attributes: here we mostly have dims/weight/volume already flattened as tags.
      const attributes: Record<string, string> = {};
      const attributeKeys = [
        'dim1',
        'dim2',
        'dim3',
        'weight',
        'volume',
        'energy_label',
      ];
      for (const key of attributeKeys) {
        if (p[key] != null) {
          const value = getText(p[key]);
          if (value) attributes[key] = value;
        }
      }

      const url = getText(p.url) || undefined;

      return {
        id,
        sku,
        model: model || undefined,
        ean: getText(p.barcode) || undefined,
        name,
        description,
        retailPrice,
        webOfferPrice,
        rawCategory,
        category,
        categoryId,
        stock,
        isAvailable,
        mainImage,
        images,
        manufacturer: manufacturer || undefined,
        url,
        attributes: Object.keys(attributes).length ? attributes : undefined,
      };
    })
  );

  return products;
}
