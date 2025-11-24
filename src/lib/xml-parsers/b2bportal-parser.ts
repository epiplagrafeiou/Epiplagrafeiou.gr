// lib/xml-parsers/b2bportal-parser.ts
'use server';

import { XMLParser } from 'fast-xml-parser';
import { mapCategory } from '@/lib/category-mapper';

export interface XmlProduct {
  id: string;
  name: string;
  retailPrice: string;
  webOfferPrice: string;
  description: string;
  category: string;     // mapped
  rawCategory?: string; // supplier raw
  mainImage: string | null;
  images: string[];
  stock: number;
  isAvailable?: boolean;
}

const getText = (node: any): string => {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (typeof node === 'object') {
    if ('__cdata' in node) return String(node.__cdata).trim();
    if ('_text' in node) return String(node._text).trim();
    if ('#text' in node) return String(node['#text']).trim();
    // pick first string field
    for (const k in node) if (typeof node[k] === 'string') return node[k].trim();
  }
  return '';
};

export async function b2bportalParser(url: string): Promise<XmlProduct[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to fetch XML: ${response.statusText}`);
  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name, jpath) => jpath === 'b2bportal.products.product' || jpath === 'mywebstore.products.product' || jpath.endsWith('.gallery.image'),
    textNodeName: '_text',
    trimValues: true,
    cdataPropName: '__cdata',
    parseNodeValue: true,
    parseAttributeValue: true,
    parseTrueNumberOnly: true,
  });

  const parsed = parser.parse(xmlText);
  const productArray = parsed?.b2bportal?.products?.product || parsed?.mywebstore?.products?.product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error('b2bportal parsed invalid', productArray);
    throw new Error('B2B XML structure unexpected');
  }

  const products: XmlProduct[] = productArray.map((p: any) => {
    // images
    let allImages: string[] = [];
    if (p.image) allImages.push(getText(p.image));
    if (p.gallery?.image) {
      const gallery = Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image];
      allImages.push(...gallery.map((img: any) => getText(img)).filter(Boolean));
    }
    allImages = Array.from(new Set(allImages));
    const mainImage = allImages[0] ?? null;

    // categories
    const rawCategory = [getText(p.category), getText(p.subcategory)].filter(Boolean).join(' > ');
    const mappedCategory = mapCategory(rawCategory, getText(p.title) || getText(p.name));

    // availability / stock
    const availability = getText(p.availability).toLowerCase();
    const isAvailable = availability === 'ναι' || availability === 'yes' || availability === '1';
    let stock = 0;
    const stockQty = getText(p.stock) || getText(p.qty) || getText(p.availability_qty);
    if (stockQty) stock = Number(stockQty) || 0;
    else if (isAvailable) stock = 1;

    const retail = parseFloat((getText(p.retail_price) || '0').replace(',', '.')) || 0;
    const wholesale = parseFloat((getText(p.price) || '0').replace(',', '.')) || 0;
    const finalPrice = retail > 0 ? retail : wholesale;

    return {
      id: getText(p.code) || `b2b-${Math.random()}`,
      name: getText(p.title) || getText(p.name) || 'No Name',
      retailPrice: retail.toString(),
      webOfferPrice: finalPrice.toString(),
      description: getText(p.descr) || '',
      category: mappedCategory,
      rawCategory,
      mainImage,
      images: allImages,
      stock,
      isAvailable,
    };
  });

  return products;
}
