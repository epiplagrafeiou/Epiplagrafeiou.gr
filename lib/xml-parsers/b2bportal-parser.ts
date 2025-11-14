
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
      return jpath === 'mywebstore.products.product' || jpath.endsWith('.gallery.image');
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
  const productArray = deCdata(parsed).mywebstore?.products?.product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error('Parsed product data is not an array or is missing:', productArray);
    throw new Error(
      'The XML feed does not have the expected structure for b2bportal format. Could not find a product array at `mywebstore.products.product`.'
    );
  }

  const products: XmlProduct[] = productArray.map((p: any) => {
    let allImages: string[] = [];
    
    if (p.image_url && typeof p.image_url === 'string') {
        allImages.push(p.image_url);
    }
    
    if (p.extra_images && p.extra_images.image) {
      const galleryImages = (Array.isArray(p.extra_images.image) ? p.extra_images.image : [p.extra_images.image])
        .map((img: any) => (typeof img === 'object' && img._text ? img._text : img))
        .filter(Boolean);
      allImages.push(...galleryImages);
    }
    
    allImages = Array.from(new Set(allImages)); 

    const mainImage = allImages[0] || null;

    const rawCategory = [p.category_name, p.subcategory_name].filter(Boolean).join(' > ');
    
    const stock = p.availability?.toLowerCase() === 'ναι' ? 10 : 0;
    
    const finalWebOfferPrice = parseFloat(p.price_vat?.toString().replace(',', '.') || '0');

    return {
      id: p.product_code?.toString() || `temp-id-${Math.random()}`,
      name: p.product_name || 'No Name',
      retailPrice: p.price_vat?.toString().replace(',', '.') || '0',
      webOfferPrice: finalWebOfferPrice.toString(),
      description: p.product_description || '',
      category: mapCategory(rawCategory),
      mainImage: mainImage,
      images: allImages,
      stock: stock,
    };
  });

  return products;
}

    
