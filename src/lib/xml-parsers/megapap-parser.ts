// lib/xml-parsers/megapap-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import { mapCategory } from '@/lib/mappers/categoryMapper';
import type { XmlProduct } from '../types/product';

// SAFE extractor for any Megapap text node (handles CDATA, numbers, nulls)
const safeText = (val: any): string => {
  if (!val) return "";
  if (typeof val === "string" || typeof val === "number") return String(val).trim();
  if (typeof val === "object") {
    if ("__cdata" in val) return String(val.__cdata ?? "").trim();
    if ("#text" in val) return String(val["#text"] ?? "").trim();
    if ("_text" in val) return String(val._text ?? "").trim();
  }
  return "";
};

// Megapap category extraction
const extractCategory = (p: any): string => {
  const raw = safeText(p.category);
  return raw; // no splitting here — raw category is what user must see
};

export async function megapapParser(url: string): Promise<XmlProduct[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to fetch XML for Megapap: ${response.statusText}`);

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name, jpath) => jpath === 'megapap.products.product' || jpath.endsWith('.images.image'),
    textNodeName: '_text',
    trimValues: true,
    cdataPropName: '__cdata',
    parseNodeValue: true,
    parseAttributeValue: true,
    parseTrueNumberOnly: true,
  });

  const parsed = parser.parse(xmlText);

  const productArray = parsed?.megapap?.products?.product;
  if (!productArray || !Array.isArray(productArray)) {
    console.error('megapap parsed product array invalid', productArray);
    throw new Error('Megapap XML structure unexpected');
  }

  const products: XmlProduct[] = [];

  for (const p of productArray) {
    let allImages: string[] = [];
    if (p.images && p.images.image) {
      if (Array.isArray(p.images.image)) {
        allImages = p.images.image.map((img: any) => safeText(img)).filter(Boolean);
      } else {
        allImages = [safeText(p.images.image)].filter(Boolean);
      }
    }

    const mainImage = safeText(p.main_image) || allImages[0] || null;
    if (mainImage && !allImages.includes(mainImage)) allImages.unshift(mainImage);
    allImages = Array.from(new Set(allImages));

    const rawCategoryString = extractCategory(p);
    
    // The mapping will happen later, for now, we pass the raw category
    const { category, categoryId } = await mapCategory(rawCategoryString);

    const stock = Number(safeText(p.qty)) || 0;

    const retailPriceStr = safeText(p.retail_price_with_vat) || '0';
    let finalWebOfferPrice = parseFloat(safeText(p.weboffer_price_with_vat) || retailPriceStr) || 0;

    const productName = (safeText(p.name) ?? '').toLowerCase();
    if (productName.includes('καναπ') || productName.includes('sofa')) {
      finalWebOfferPrice += 75;
    }

    products.push({
      id: safeText(p.id) || `megapap-${Math.random()}`,
      sku: safeText(p.id),
      model: safeText(p.model),
      name: safeText(p.name) || 'No Name',
      description: safeText(p.description) || '',
      rawCategory: rawCategoryString,
      category,
      categoryId,
      webOfferPrice: finalWebOfferPrice.toString(),
      retailPrice: retailPriceStr,
      stock,
      images: allImages,
      mainImage: mainImage,
      supplierId: "megapap",
      variantGroupKey: safeText(p.groupId) || undefined,
      color: safeText(p.color) || undefined,
    });
  }

  return products;
}
