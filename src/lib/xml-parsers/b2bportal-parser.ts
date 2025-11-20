
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from './megapap-parser';
import { mapCategory } from '../category-mapper';

export async function b2bportalParser(url: string): Promise<XmlProduct[]> {
  console.log("▶ Running B2B Portal parser");
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: true,
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      return jpath === 'b2bportal.products.product' || jpath.endsWith('.image');
    },
    cdataPropName: '__cdata',
    trimValues: true,
    parseNodeValue: true,
    tagValueProcessor: (tagName, tagValue, jPath, isLeafNode, isAttribute) => {
      if (typeof tagValue === 'string' && tagValue.startsWith('<![CDATA[')) {
        return tagValue.substring(9, tagValue.length - 3);
      }
      return tagValue;
    }
  });

  const parsed = parser.parse(xmlText);
  const productArray = parsed.b2bportal?.products?.product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error('B2B Portal Parser: Parsed product data is not an array or is missing at b2bportal.products.product:', productArray);
    throw new Error(
      'The XML feed does not have the expected structure for b2bportal format. Could not find a product array at `b2bportal.products.product`.'
    );
  }

  const products: XmlProduct[] = productArray.map((p: any) => {
    let allImages: string[] = [];
    
    // Correctly map the image fields
    if (p.image_url && typeof p.image_url === 'string') {
        allImages.push(p.image_url);
    }
    
    if (p.extra_images && p.extra_images.image) {
      const galleryImages = (Array.isArray(p.extra_images.image) ? p.extra_images.image : [p.extra_images.image])
        .map((img: any) => (typeof img === 'object' && img['#text'] ? img['#text'] : img))
        .filter(Boolean);
      allImages.push(...galleryImages);
    }
    
    allImages = Array.from(new Set(allImages)); 

    const mainImage = allImages[0] || null;

    const rawCategory = [p.category_name, p.subcategory_name].filter(Boolean).join(' > ');
    
    // Correctly handle numeric availability
    const stock = Number(p.availability) > 0 ? 10 : 0;
    
    // Correctly map the price field
    const finalWebOfferPrice = parseFloat(p.price_vat?.toString().replace(',', '.') || '0');

    return {
      // Correctly map the ID and name fields
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
