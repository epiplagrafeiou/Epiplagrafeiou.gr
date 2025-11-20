
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from './megapap-parser';
import { mapCategory } from '../category-mapper';

// Utility: strip out unwanted <script> tags
function cleanXml(xml: string): string {
  return xml.replace(/<script[\s\S]*?<\/script>/gi, "");
}

// Helper function to safely extract text from a node that might be a string, a CDATA object, or an array.
// This makes the parser resilient to variations in the XML structure.
function getText(node: any): string {
    if (!node) {
        return "";
    }
    if (Array.isArray(node)) {
        // If it's an array, recursively call getText on the first element.
        return getText(node[0]);
    }
    if (typeof node === 'object') {
        // fast-xml-parser uses '__cdata' or '_text' for text content within tags.
        // We check for both to be safe.
        return node.__cdata || node._text || '';
    }
    // If it's already a string or number, convert it to a string.
    return String(node);
}

export async function b2bportalParser(url: string): Promise<XmlProduct[]> {
  console.log("▶ Running B2B Portal parser");
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();
  const cleanXmlText = cleanXml(xmlText);

  const parser = new XMLParser({
    ignoreAttributes: true, // Switched to true as we are not using attributes like `id` from the product tag.
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      // Ensure products and gallery images are always arrays.
      return jpath === 'b2bportal.products.product' || jpath.endsWith('.gallery.image');
    },
    cdataPropName: '__cdata', // The property name for CDATA content.
    textNodeName: '_text', // The property name for regular text content.
    trimValues: true,
    parseNodeValue: true,
    parseAttributeValue: true,
    removeNSPrefix: true,
  });

  const parsed = parser.parse(cleanXmlText);
  const productArray = parsed.b2bportal?.products?.product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error('B2B Portal Parser: Parsed product data is not an array or is missing at b2bportal.products.product:', productArray);
    throw new Error(
      'The XML feed does not have the expected structure for b2bportal format. Could not find a product array at `b2bportal.products.product`.'
    );
  }

  const products: XmlProduct[] = productArray.map((p: any) => {
    // Use the robust `getText` helper for all fields
    const mainImg = getText(p.image);
    let allImages: string[] = [];
    if (mainImg) {
        allImages.push(mainImg);
    }
    
    if (p.gallery && p.gallery.image) {
      const galleryImages = (Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image])
        .map(getText) // Use helper for gallery images as well
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
    
    // Use retail price if available, otherwise fall back to wholesale.
    const webOfferPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

    return {
      id: getText(p.code) || getText(p.sku) || `b2b-id-${Math.random()}`,
      name: getText(p.name) || 'No Name',
      retailPrice: retailPrice.toString(),
      webOfferPrice: webOfferPrice.toString(),
      description: getText(p.descr) || '',
      category: mapCategory(rawCategory), // mapCategory returns a unified string
      mainImage: mainImage,
      images: allImages,
      stock: stock,
    };
  });

  return products;
}
