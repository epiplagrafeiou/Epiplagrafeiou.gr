// lib/xml-parsers/megapap-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import { mapCategory } from '@/lib/mappers/categoryMapper';
import type { XmlProduct } from '../types/product';

const extract = (val: any): string => {
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val).trim();
  if (val && typeof val === "object" && val._text) return String(val._text).trim();
  if (val && typeof val === "object" && val.__cdata) return String(val.__cdata).trim();
  return "";
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
    // images
    let allImages: string[] = [];
    if (p.images && p.images.image) {
      if (Array.isArray(p.images.image)) {
        allImages = p.images.image.map((img: any) => {
          if (typeof img === 'object') return img._text ?? img.__cdata ?? '';
          return String(img);
        }).filter(Boolean);
      } else if (typeof p.images.image === 'object') {
        allImages = [p.images.image._text ?? p.images.image.__cdata ?? ''].filter(Boolean);
      } else if (typeof p.images.image === 'string') {
        allImages = [p.images.image];
      }
    }

    const mainImage = p.main_image || allImages[0] || null;
    if (mainImage && !allImages.includes(mainImage)) allImages.unshift(mainImage);
    allImages = Array.from(new Set(allImages));

    const rawCategoryString = [extract(p.category), extract(p.subcategory)]
      .filter(Boolean)
      .join(" > ");
    
    const { category, categoryId } = await mapCategory(rawCategoryString, p.name ?? '');

    const rawStock =
      p.qty?.quantity ??
      p.qty?._text ??
      p.qty ??
      p.stock ??
      p.quantity ??
      0;
    const stock = Number(rawStock) || 0;

    const retailPriceStr = p.retail_price_with_vat ?? '0';
    let finalWebOfferPrice = parseFloat(p.weboffer_price_with_vat ?? retailPriceStr ?? '0') || 0;

    const productName = (p.name ?? '').toLowerCase();
    if (productName.includes('καναπ') || productName.includes('sofa')) {
      finalWebOfferPrice += 75;
    }

    products.push({
      id: String(p.id ?? `megapap-${Math.random()}`),
      name: p.name ?? 'No Name',
      retailPrice: String(retailPriceStr),
      webOfferPrice: finalWebOfferPrice.toString(),
      description: p.description ?? '',
      category,
      rawCategory: rawCategoryString,
      categoryId,
      mainImage,
      images: allImages,
      stock,
    });
  }

  return products;
}
