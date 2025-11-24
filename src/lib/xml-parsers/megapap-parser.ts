
// src/lib/xml-parsers/megapap-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '@/lib/types/product';
import { mapCategory } from '@/lib/mappers/categoryMapper';

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

export async function megapapParser(url: string): Promise<XmlProduct[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch Megapap XML: ${response.status} ${response.statusText}`);
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
    isArray: (name, jpath) => jpath.endsWith('.image') || jpath.endsWith('.attribute'),
  });

  const parsed = parser.parse(xmlText);

  const productArray = parsed?.megapap?.products?.product;
  if (!productArray) {
    throw new Error('Megapap XML does not contain products at megapap.products.product');
  }

  const productsRaw = Array.isArray(productArray) ? productArray : [productArray];

  const products: XmlProduct[] = await Promise.all(
    productsRaw.map(async (p: any): Promise<XmlProduct> => {
      // ID (attribute on <product id="..."> or fallback)
      const idAttr = p.id; // because attributeNamePrefix: '' -> id is a normal prop
      const id = idAttr != null ? String(idAttr) : `megapap-${Math.random().toString(36).slice(2)}`;

      const name = getText(p.name) || 'No Name';
      const description = getText(p.description);

      const sku = getText(p.sku);
      const model = getText(p.model);
      const ean = getText(p.ean);
      const manufacturer = getText(p.manufacturer);

      // Prices
      const retailPriceNum = parseFloat(getText(p.retail_price_with_vat).replace(',', '.')) || 0;
      const offerPriceNum =
        parseFloat(getText(p.weboffer_price_with_vat).replace(',', '.')) ||
        retailPriceNum ||
        0;

      const retailPrice = retailPriceNum > 0 ? retailPriceNum.toString() : '0';
      const webOfferPrice = offerPriceNum > 0 ? offerPriceNum.toString() : '0';

      // Category
      const rawCategoryOriginal = getText(p.category); // e.g. "Έπιπλα κήπου > Πανιά καρέκλας σκηνοθέτη"
      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryOriginal);

      // Stock
      const quantityNode = p.quantity ?? p.qty ?? p.stock ?? 0;
      const stock = Number(getText(quantityNode)) || 0;

      const availabilityText = getText(p.availability).toLowerCase();
      const isAvailable =
        availabilityText.includes('άμεση') ||
        availabilityText.includes('διαθεσιμ') ||
        availabilityText === '1';

      // Images
      const mainImage = getText(p.main_image) || null;

      let images: string[] = [];
      if (p.images?.image) {
        const imagesNode = Array.isArray(p.images.image)
          ? p.images.image
          : [p.images.image];
        images = imagesNode
          .map((img: any) => getText(img))
          .filter(Boolean);
      }

      // Ensure mainImage is first
      if (mainImage && !images.includes(mainImage)) {
        images.unshift(mainImage);
      }
       images = Array.from(new Set(images));


      // Attributes (flatten <attributes><attribute id="x">value</attribute></attributes>)
      const attributes: Record<string, string> = {};
      if (p.attributes?.attribute) {
        const attrs = Array.isArray(p.attributes.attribute)
          ? p.attributes.attribute
          : [p.attributes.attribute];
        attrs.forEach((a: any) => {
          const key = a?.id != null ? String(a.id) : undefined;
          const value = getText(a);
          if (key && value) {
            attributes[key] = value;
          }
        });
      }
      
      const variantGroupKey = attributes['variant_group_key'] || undefined;
      const color = attributes['color'] || undefined;

      return {
        id,
        sku: sku || undefined,
        model: model || undefined,
        ean: ean || undefined,
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
        url: undefined,
        attributes: Object.keys(attributes).length ? attributes : undefined,
        variantGroupKey,
        color,
      };
    })
  );

  return products;
}
