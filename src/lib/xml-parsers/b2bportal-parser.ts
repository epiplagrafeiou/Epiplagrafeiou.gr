
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from './megapap-parser';
import { mapCategory } from '../category-mapper';

// Helper function to safely extract text from a node that might be a string or a CDATA object
function getText(node: any): string {
    if (typeof node === 'string') {
        return node;
    }
    if (node && typeof node === 'object') {
        // fast-xml-parser can produce __cdata or _text depending on configuration and input
        return node.__cdata || node._text || '';
    }
    return '';
}


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
      return jpath === 'b2bportal.products.product' || jpath.endsWith('.gallery.image');
    },
    cdataPropName: '__cdata',
    textNodeName: '_text',
    trimValues: true,
    parseNodeValue: true,
    parseAttributeValue: true,
    removeNSPrefix: true,
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
    
    const mainImg = getText(p.image);
    if (mainImg) {
        allImages.push(mainImg);
    }
    
    if (p.gallery && p.gallery.image) {
      const galleryImages = (Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image])
        .map(getText) // Use helper to safely extract text
        .filter(Boolean);
      allImages.push(...galleryImages);
    }
    
    allImages = Array.from(new Set(allImages)); 

    const mainImage = allImages[0] || null;

    const subcategory = getText(p.subcategory);
    const category = getText(p.category);
    
    const rawCategory = [subcategory, category].filter(Boolean).join(' > ');
    
    const availabilityText = getText(p.availability);
    const stock = Number(availabilityText) > 0 ? Number(availabilityText) : 0;
    
    const retailPriceText = getText(p.retail_price);
    const wholesalePriceText = getText(p.price);

    const retailPrice = parseFloat(retailPriceText.replace(',', '.') || '0');
    const wholesalePrice = parseFloat(wholesalePriceText.replace(',', '.') || '0');
    
    const webOfferPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

    return {
      id: getText(p.code) || getText(p.sku) || `b2b-id-${Math.random()}`,
      name: getText(p.name) || 'No Name',
      retailPrice: retailPrice.toString(),
      webOfferPrice: webOfferPrice.toString(),
      description: getText(p.descr) || '',
      category: mapCategory(rawCategory),
      mainImage: mainImage,
      images: allImages,
      stock: stock,
    };
  });

  return products;
}
