
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from './megapap-parser';
import { mapCategory } from '../category-mapper';

export async function b2bportalParser(url: string): Promise<XmlProduct[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      return jpath === 'b2bportal.products.product' || jpath.endsWith('.gallery.image');
    },
    textNodeName: '_text',
    trimValues: true,
    cdataPropName: '__cdata',
    parseNodeValue: true,
    parseAttributeValue: true,
    parseTrueNumberOnly: true,
  });

  const deCdata = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(deCdata);
    if ('__cdata' in obj) return obj.__cdata;
    const newObj: Record<string, any> = {};
    for (const key in obj) newObj[key] = deCdata(obj[key]);
    return newObj;
  };

  const parsed = parser.parse(xmlText);
  const productArray = deCdata(parsed).b2bportal?.products?.product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error('Parsed product data is not an array or is missing:', productArray);
    throw new Error(
      'The XML feed does not have the expected structure for b2bportal format. Could not find a product array at `b2bportal.products.product`.'
    );
  }

  const products: XmlProduct[] = productArray.map((p: any) => {
    let allImages: string[] = [];
    
    // Main image
    if (p.image && typeof p.image === 'string') {
        allImages.push(p.image);
    }

    // Gallery images
    if (p.gallery && p.gallery.image) {
      if (Array.isArray(p.gallery.image)) {
        const galleryImages = p.gallery.image
          .map((img: any) => (typeof img === 'object' && img._text ? img._text : img))
          .filter(Boolean);
        allImages.push(...galleryImages);
      } else if (typeof p.gallery.image === 'string') {
        allImages.push(p.gallery.image);
      }
    }
    
    // Ensure thumb is included if it exists
    if(p.thumb && !allImages.includes(p.thumb)){
        allImages.unshift(p.thumb);
    }
    
    allImages = Array.from(new Set(allImages)); // Remove duplicates

    const mainImage = allImages[0] || null;

    // The logic for category is to combine subcategory and category
    const rawCategory = [p.subcategory, p.category].filter(Boolean).join(' > ');

    return {
      id: p.id?.toString() || `temp-id-${Math.random()}`,
      name: p.name || 'No Name',
      retailPrice: p.retail_price?.toString() || '0',
      webOfferPrice: p.retail_price?.toString() || '0',
      description: p.descr || '',
      category: mapCategory(rawCategory),
      mainImage: mainImage,
      images: allImages,
      stock: Number(p.availability) || 0,
    };
  });

  return products;
}
