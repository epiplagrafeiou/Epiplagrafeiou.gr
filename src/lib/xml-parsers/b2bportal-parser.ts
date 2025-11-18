
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
      // Handle both possible paths for products
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
  const data = deCdata(parsed);
  // The new correct path based on your provided XML snippet
  const productArray = data.b2bportal?.products?.product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error('Parsed product data is not an array or is missing:', productArray);
    throw new Error(
      'The XML feed does not have the expected structure for b2bportal format. Could not find a product array at `b2bportal.products.product`.'
    );
  }

  const products: XmlProduct[] = productArray.map((p: any) => {
    let allImages: string[] = [];
    
    // Main image from <image> tag
    if (p.image && typeof p.image === 'string') {
        allImages.push(p.image);
    }
    
    // Gallery images
    if (p.gallery && p.gallery.image) {
      const galleryImages = (Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image])
        .map((img: any) => (typeof img === 'object' && img._text ? img._text : img))
        .filter(Boolean);
      allImages.push(...galleryImages);
    }
    
    allImages = Array.from(new Set(allImages)); 

    const mainImage = allImages[0] || null;

    const rawCategory = [p.category, p.subcategory].filter(Boolean).join(' > ');
    
    // Availability is now "1" for in stock
    const stock = p.availability === 1 ? 10 : 0;
    
    // Use the correct price field, which seems to be 'price'
    const finalWebOfferPrice = parseFloat(p.price?.toString().replace(',', '.') || '0');

    return {
      id: p.code?.toString() || p.id?.toString() || `temp-id-${Math.random()}`,
      name: p.name || 'No Name',
      retailPrice: p.retail_price?.toString().replace(',', '.') || '0',
      webOfferPrice: finalWebOfferPrice.toString(),
      description: p.descr || '',
      category: mapCategory(rawCategory),
      mainImage: mainImage,
      images: allImages,
      stock: stock,
    };
  });

  return products;
}
