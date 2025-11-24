// lib/xml-parsers/megapap-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import { mapCategory } from '@/lib/category-mapper';

export interface XmlProduct {
  id: string;
  name: string;
  retailPrice: string;
  webOfferPrice: string;
  description: string;
  category: string;     // mapped path
  rawCategory?: string; // supplier raw
  mainImage: string | null;
  images: string[];
  stock: number;
}

export async function megapapParser(url: string): Promise<XmlProduct[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to fetch XML: ${response.statusText}`);

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

  const products: XmlProduct[] = productArray.map((p: any) => {
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

    const rawCategory = p.category ?? '';
    const mappedCategory = mapCategory(rawCategory, p.name ?? '');

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

    // small price tweak logic (you had it earlier)
    const productName = (p.name ?? '').toLowerCase();
    if (productName.includes('καναπ') || productName.includes('sofa')) {
      finalWebOfferPrice += 75;
    }

    return {
      id: String(p.id ?? `megapap-${Math.random()}`),
      name: p.name ?? 'No Name',
      retailPrice: String(retailPriceStr),
      webOfferPrice: finalWebOfferPrice.toString(),
      description: p.description ?? '',
      category: mappedCategory,
      rawCategory: String(rawCategory ?? ''),
      mainImage,
      images: allImages,
      stock,
    };
  });

  return products;
}
