
// src/lib/xml-parsers/b2bportal-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '@/lib/types/product';
import { mapCategory } from '@/lib/mappers/categoryMapper';

// Reuse the same safe text extractor
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

export async function b2bportalParser(url: string): Promise<XmlProduct[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch B2B Portal XML: ${response.status} ${response.statusText}`);
  }

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    trimValues: true,
    parseAttributeValue: true,
    parseTagValue: true,
    textNodeName: '#text',
    cdataPropName: '__cdata',
    isArray: (name, jpath) => jpath.endsWith('.image'),
  });

  const parsed = parser.parse(xmlText);

  const productArray = parsed?.b2bportal?.products?.product;
  if (!productArray) {
    throw new Error(
      'B2B Portal XML does not contain products at b2bportal.products.product'
    );
  }

  const productsRaw = Array.isArray(productArray) ? productArray : [productArray];

  const products: XmlProduct[] = await Promise.all(
    productsRaw.map(async (p: any): Promise<XmlProduct> => {
      const idAttr = p.id;
      const id = idAttr != null ? String(idAttr) : `b2b-${Math.random().toString(36).slice(2)}`;

      const code = getText(p.code);
      const sku = getText(p.sku) || code || undefined;
      const model = getText(p.model);
      const name = getText(p.name) || 'No Name';
      const description = getText(p.descr);
      const manufacturer = getText(p.manufacturer);

      const retailPriceNum = parseFloat(getText(p.retail_price).replace(',', '.')) || 0;
      const wholesalePriceNum = parseFloat(getText(p.price).replace(',', '.')) || 0;

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
      images = Array.from(new Set(images));

      // Attributes: here we mostly have dims/weight/volume already flattened as tags.
      const attributes: Record<string, string> = {};
      const attributeKeys = [
        'dim1',
        'dim2',
        'dim3',
        'weight',
        'volume',
        'energy_label',
        'variant_group_key',
        'color',
      ];
      for (const key of attributeKeys) {
        if (p[key] != null) {
          const value = getText(p[key]);
          if (value) attributes[key] = value;
        }
      }

      const productUrl = getText(p.url) || undefined;
      const variantGroupKey = attributes['variant_group_key'] || undefined;
      const color = attributes['color'] || undefined;

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
        url: productUrl,
        attributes: Object.keys(attributes).length ? attributes : undefined,
        variantGroupKey,
        color,
      };
    })
  );

  return products;
}
