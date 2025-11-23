
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../category-mapper';

function extractCategoryValue(value: any): string {
  if (!value) return '';

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    return value
      .map(v => extractCategoryValue(v))
      .filter(Boolean)
      .join(' > ');
  }

  if (typeof value === 'object') {
    if (value.__cdata) return String(value.__cdata).trim();
    if (value._text) return String(value._text).trim();
    if (value['#text']) return String(value['#text']).trim();

    return Object.values(value)
      .map(v => extractCategoryValue(v))
      .filter(Boolean)
      .join(' > ');
  }

  return '';
}

const getText = (node: any): string => {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();

  if (typeof node === 'object') {
    if (node.__cdata) return String(node.__cdata).trim();
    if (node._text) return String(node._text).trim();
    if (node['#text']) return String(node['#text']).trim();
    for (const key in node) {
      if (typeof node[key] === 'string') return node[key].trim();
    }
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
    isArray: (name, jpath) =>
      jpath === 'b2bportal.products.product' ||
      jpath === 'mywebstore.products.product' ||
      jpath === 'products.product' ||
      jpath.endsWith('.gallery.image'),
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
    parsed?.mywebstore?.products?.product ||
    parsed?.products?.product;


  if (!productArray) {
    console.warn('B2B Parser: No products found in the XML feed.');
    return [];
  }

  if (!Array.isArray(productArray)) {
    productArray = [productArray];
  }

  const products: XmlProduct[] = await Promise.all(
    productArray.map(async (p: any) => {
      let allImages: string[] = [];
      if (p.image) allImages.push(getText(p.image));
      if (p.gallery?.image) {
        const galleryImages = (Array.isArray(p.gallery.image)
          ? p.gallery.image
          : [p.gallery.image])
          .map((img: any) => getText(img))
          .filter(Boolean);
        allImages.push(...galleryImages);
      }

      allImages = Array.from(new Set(allImages));
      const mainImage = allImages[0] || null;

      const rawCategory = extractCategoryValue(p.category);
      const rawSubCategory = extractCategoryValue(p.subcategory);

      const combinedCategory = [rawCategory, rawSubCategory]
        .filter(Boolean)
        .join(' > ');

      const productName =
        getText(p.title) || getText(p.name) || 'No Name';

      const { category, categoryId } = await mapCategory(combinedCategory, productName);

      const availabilityText = getText(p.availability).toLowerCase();
      const isAvailable =
        availabilityText === 'ναι' ||
        availabilityText === 'yes' ||
        availabilityText === '1';

      let stock = 0;
      const stockQty =
        getText(p.stock) ||
        getText(p.qty) ||
        getText(p.availability_qty);

      if (stockQty) {
        stock = Number(stockQty) || 0;
      } else if (isAvailable) {
        stock = 1;
      }

      const retailPriceNum = parseFloat(
        (getText(p.retail_price) || '0').replace(',', '.')
      );
      const wholesalePriceNum = parseFloat(
        (getText(p.price) || '0').replace(',', '.')
      );
      const finalPriceNum =
        retailPriceNum > 0 ? retailPriceNum : wholesalePriceNum;

      return {
        id: getText(p.code) || `b2b-${Math.random()}`,
        name: productName,
        retailPrice: retailPriceNum.toString(),
        webOfferPrice: finalPriceNum.toString(),
        description: getText(p.descr) || '',
        category: category,
        categoryId: categoryId,
        mainImage,
        images: allImages,
        stock,
        isAvailable,
      };
    })
  );

  return products;
}

    