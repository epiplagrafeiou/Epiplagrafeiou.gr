'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';   // put XmlProduct in a shared types file
import { mapCategory } from '../utils/category-mapper';

// Safe text extractor
const getText = (node: any): string => {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node).trim();
  }
  if (typeof node === "object") {
    if ("__cdata" in node) return String(node.__cdata).trim();
    if ("_text" in node) return String(node._text).trim();
  }
  return "";
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

  const productArray =
    parsed?.b2bportal?.products?.product ||
    parsed?.mywebstore?.products?.product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error('Parsed product data is not an array or is missing:', productArray);
    throw new Error(
      'The XML feed does not have the expected structure. Could not find a product array at `b2bportal.products.product` or `mywebstore.products.product`.'
    );
  }

  const products: XmlProduct[] = productArray.map((p: any) => {
    // Collect images
    let allImages: string[] = [];
    if (p.image) {
      allImages.push(getText(p.image));
    }
    if (p.gallery?.image) {
      const galleryImages = (Array.isArray(p.gallery.image) ? p.gallery.image : [p.gallery.image])
        .map((img: any) => getText(img))
        .filter(Boolean);
      allImages.push(...galleryImages);
    }
    allImages = Array.from(new Set(allImages));
    const mainImage = allImages[0] || null;

    // Category path
    const rawCategory = [getText(p.category), getText(p.subcategory)]
      .filter(Boolean)
      .join(' > ');

    // Availability and stock
    const availabilityText = getText(p.availability).toLowerCase();
    const isAvailable = availabilityText === 'ναι' || availabilityText === '1';
    let stock = 0;
    if (p.stock) {
      stock = Number(getText(p.stock)) || 0;
    } else if (p.qty) {
      stock = Number(getText(p.qty)) || 0;
    } else if (p.availability_qty) {
      stock = Number(getText(p.availability_qty)) || 0;
    } else if (isAvailable) {
      stock = 1; // fallback minimal quantity
    }

    // Price
    const retailPrice = parseFloat(getText(p.retail_price).replace(',', '.') || '0');
    const wholesalePrice = parseFloat(getText(p.price).replace(',', '.') || '0');
    const finalPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

    return {
      id: getText(p.code) || `b2b-${Math.random()}`,
      name: getText(p.name) || 'No Name',
      retailPrice: retailPrice.toString(),
      webOfferPrice: finalPrice.toString(),
      description: getText(p.descr),
      category: mapCategory(rawCategory),
      mainImage,
      images: allImages,
      stock,
      isAvailable,
    };
  });

  return products;
}
