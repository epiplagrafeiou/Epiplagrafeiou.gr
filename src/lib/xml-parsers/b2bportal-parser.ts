
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
    ignoreAttributes: false, // Keep attributes to get product ID
    attributeNamePrefix: '',
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      return jpath === 'b2bportal.products.product' || jpath.endsWith('.gallery.image');
    },
    cdataPropName: '__cdata', // Handle CDATA sections
    trimValues: true,
    parseNodeValue: true,
    tagValueProcessor: (tagName, tagValue, jPath, isLeafNode, isAttribute) => {
        if (typeof tagValue === 'string' && tagValue.startsWith('<![CDATA[')) {
            return tagValue.substring(9, tagValue.length - 3).trim();
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
    
    if (p.image) {
        allImages.push(p.image);
    }
    
    if (p.gallery && p.gallery.image) {
      const galleryImages = (Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image])
        .filter(Boolean);
      allImages.push(...galleryImages);
    }
    
    allImages = Array.from(new Set(allImages)); 

    const mainImage = allImages[0] || null;

    // Combine category and subcategory from the correct fields
    const rawCategory = [p.subcategory, p.category].filter(Boolean).join(' > ');
    
    const stock = Number(p.availability) > 0 ? Number(p.availability) : 0;
    
    const retailPrice = parseFloat(p.retail_price?.toString().replace(',', '.') || '0');
    const wholesalePrice = parseFloat(p.price?.toString().replace(',', '.') || '0');
    
    // Use retail_price as the primary price, fallback to wholesale price if needed
    const finalWebOfferPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

    return {
      id: p.code?.toString() || p.id?.toString() || `b2b-id-${Math.random()}`,
      name: p.name || 'No Name',
      retailPrice: retailPrice.toString(),
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
