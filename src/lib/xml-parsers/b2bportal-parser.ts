
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../category-mapper';

// Safe text extractor
const getText = (node: any): string => {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (typeof node === 'object') {
    if ('__cdata' in node) return String((node as any).__cdata).trim();
    if ('_text' in node) return String((node as any)._text).trim();
  }
  return '';
};

// Build a full category path by scanning product keys
const extractCategoryPath = (p: Record<string, any>): string => {
  const parts: { key: string; level: number; value: string }[] = [];

  for (const key of Object.keys(p)) {
    const lower = key.toLowerCase();

    // Match keys like "category", "category_name"
    if (lower === 'category' || lower === 'category_name') {
      const v = getText(p[key]);
      if (v) parts.push({ key, level: 0, value: v });
      continue;
    }

    // Match "subcategory", "subcategory_name"
    if (lower === 'subcategory' || lower === 'subcategory_name') {
      const v = getText(p[key]);
      if (v) parts.push({ key, level: 1, value: v });
      continue;
    }

    // Match "subcategory2", "subcategory_level2", etc.
    const subNumMatch = lower.match(/^subcategory(\d+)$/);
    if (subNumMatch) {
      const lvl = Number(subNumMatch[1]);
      const v = getText(p[key]);
      if (v) parts.push({ key, level: lvl, value: v });
      continue;
    }

    const subLevelMatch = lower.match(/^subcategory[_-]?level(\d+)$/);
    if (subLevelMatch) {
      const lvl = Number(subLevelMatch[1]);
      const v = getText(p[key]);
      if (v) parts.push({ key, level: lvl, value: v });
      continue;
    }
  }

  // Sort: category (level 0) first, then subcategory, then subcategory2/3...
  parts.sort((a, b) => a.level - b.level);

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const orderedValues = parts
    .map(p => p.value)
    .filter(v => {
      const key = v.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return orderedValues.join(' > ');
};

export async function b2bportalParser(url: string): Promise<XmlProduct[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name, jpath) => {
      return jpath === 'b2bportal.products.product' ||
             jpath === 'mywebstore.products.product' ||
             jpath.endsWith('.gallery.image');
    },
    textNodeName: '_text',
    trimValues: true,
    cdataPropName: '__cdata',
    parseNodeValue: true,
    parseAttributeValue: true,
    parseTrueNumberOnly: true,
  });

  const parsed = parser.parse(xmlText);

  let productArray =
    parsed?.b2bportal?.products?.product ||
    parsed?.mywebstore?.products?.product;

  if (!productArray) {
    console.warn('B2B Parser: No products found in the XML feed.');
    return [];
  }
  
  // DEFENSIVE FIX: Ensure productArray is always an array
  if (!Array.isArray(productArray)) {
    productArray = [productArray];
  }


  const products: XmlProduct[] = await Promise.all(productArray.map(async (p: any) => {
    // Images: main + gallery
    let allImages: string[] = [];
    if (p.image) allImages.push(getText(p.image));
    if (p.gallery?.image) {
      const galleryImages = (Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image])
        .map((img: any) => getText(img))
        .filter(Boolean);
      allImages.push(...galleryImages);
    }
    allImages = Array.from(new Set(allImages));
    const mainImage = allImages[0] || null;

    // Category path (dynamic)
    const rawCategory = extractCategoryPath(p);
    const productName = getText(p.name) || 'No Name';

    // Availability (keep as a boolean; don't fake stock)
    const availabilityText = getText(p.availability).toLowerCase();
    const isAvailable = availabilityText === 'ναι' || availabilityText === '1';

    // Stock: use numeric fields only if present
    let stock = 0;
    if (p.stock) stock = Number(getText(p.stock)) || 0;
    else if (p.qty) stock = Number(getText(p.qty)) || 0;
    else if (p.availability_qty) stock = Number(getText(p.availability_qty)) || 0;
    
    // Prices
    const retailPriceNum = parseFloat((getText(p.retail_price) || '0').replace(',', '.'));
    const wholesalePriceNum = parseFloat((getText(p.price) || '0').replace(',', '.'));
    const finalPriceNum = retailPriceNum > 0 ? retailPriceNum : wholesalePriceNum;

    return {
      id: getText(p.code) || `b2b-${Math.random()}`,
      name: productName,
      retailPrice: retailPriceNum.toString(),
      webOfferPrice: finalPriceNum.toString(),
      description: getText(p.descr) || '',
      category: await mapCategory(rawCategory, productName), // Use the mapper
      mainImage,
      images: allImages,
      stock,
      isAvailable,
    };
  }));

  return products;
}
