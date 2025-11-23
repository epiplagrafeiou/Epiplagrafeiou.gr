
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../category-mapper';

// Safe text extractor
const getText = (node: any): string => {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (typeof node === 'object') {
    if ('__cdata' in node) return String(node.__cdata).trim();
    if ('_text' in node) return String(node._text).trim();
  }
  return '';
};

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
      return jpath === 'b2bportal.products.product' ||
             jpath === 'mywebstore.products.product' ||
             jpath.endsWith('.gallery.image');
    },
    textNodeName: '_text',
    trimValues: true,
    cdataPropName: '__cdata',
    parseNodeValue: true,
    parseAttributeValue: true,
    parseTrueNumberOnly: true,
  });

  const parsed = parser.parse(xmlText);

  let productArray =
    parsed?.b2bportal?.products?.product ||
    parsed?.mywebstore?.products?.product;

    if (!productArray) {
        console.warn('B2B Parser: No products found in the XML feed.');
        return [];
    }
  
    if (!Array.isArray(productArray)) {
        productArray = [productArray];
    }

  const products: XmlProduct[] = await Promise.all(productArray.map(async (p: any) => {
    let allImages: string[] = [];
    if (p.image) allImages.push(getText(p.image));
    if (p.gallery?.image) {
      const galleryImages = (Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image])
        .map((img: any) => getText(img))
        .filter(Boolean);
      allImages.push(...galleryImages);
    }
    allImages = Array.from(new Set(allImages));
    const mainImage = allImages[0] || null;

    const rawCategory = [getText(p.category), getText(p.subcategory)]
      .filter(Boolean)
      .join(' > ');
    const productName = getText(p.title) || getText(p.name) || 'No Name';
    const mappedCategory = await mapCategory(rawCategory, productName);


    const availabilityText = getText(p.availability).toLowerCase();
    const isAvailable = availabilityText === 'ναι' || availabilityText === '1';

    let stock = 0;
    const stockQty = getText(p.stock) || getText(p.qty) || getText(p.availability_qty);
    if (stockQty) {
      stock = Number(stockQty) || 0;
    } else if (isAvailable) {
        stock = 1; 
    }
    
    const retailPriceNum = parseFloat((getText(p.retail_price) || '0').replace(',', '.'));
    const wholesalePriceNum = parseFloat((getText(p.price) || '0').replace(',', '.'));
    const finalPriceNum = retailPriceNum > 0 ? retailPriceNum : wholesalePriceNum;

    return {
      id: getText(p.code) || `b2b-${Math.random()}`,
      name: productName,
      retailPrice: retailPriceNum.toString(),
      webOfferPrice: finalPriceNum.toString(),
      description: getText(p.descr) || '',
      category: mappedCategory,
      mainImage,
      images: allImages,
      stock,
      isAvailable,
    };
  }));

  return products;
}
