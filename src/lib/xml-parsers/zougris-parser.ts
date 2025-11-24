
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../category-mapper';

// Utility: strip out unwanted <script> tags
function cleanXml(xml: string): string {
  return xml.replace(/<script[\s\S]*?<\/script>/gi, "");
}

// Safe text extractor
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

export async function zougrisParser(url: string): Promise<XmlProduct[]> {
  console.log("▶ Running Zougris parser");

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();
  const cleanXmlText = cleanXml(xmlText);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name, jpath) => jpath === 'Products.Product',
    textNodeName: '_text',
    trimValues: true,
    cdataPropName: '__cdata',
    parseNodeValue: true,
    parseAttributeValue: true,
    parseTrueNumberOnly: true,
  });

  const parsed = parser.parse(cleanXmlText);
  let productArray = parsed?.Products?.Product;

  if (!productArray) {
    console.warn('Zougris Parser: No products found in the XML feed.');
    return [];
  }

  if (!Array.isArray(productArray)) {
    productArray = [productArray];
  }

  const products: XmlProduct[] = await Promise.all(productArray.map(async (p: any) => {
    const imageKeys = Object.keys(p).filter(k => k.toLowerCase().startsWith('b2bimage'));
    const allImages = imageKeys.map(k => getText(p[k])).filter(Boolean);
    const mainImage = allImages[0] || null;

    const categoryParts = [
      getText(p.Category1),
      getText(p.Category2),
      getText(p.Category3),
      getText(p.Epilogi),
    ].filter(Boolean);
    const rawCategory = categoryParts.join(' > ');
    const productName = getText(p.Title) || 'No Name';
    const { category, categoryId } = await mapCategory(rawCategory, productName);

    const stock = Number(getText(p.Quantity)) || 0;

    const retailPriceNum = parseFloat((getText(p.RetailPrice) || '0').replace(',', '.'));
    const wholesalePriceNum = parseFloat((getText(p.WholesalePrice) || '0').replace(',', '.'));
    const finalPriceNum = retailPriceNum > 0 ? retailPriceNum : wholesalePriceNum;

    return {
        id: getText(p.Code) || `zougris-${Math.random()}`,
        name: productName,
        retailPrice: retailPriceNum.toString(),
        webOfferPrice: finalPriceNum.toString(),
        description: getText(p.Description) || '',
        category,
        categoryId,
        mainImage,
        images: allImages,
        stock,
        isAvailable: stock > 0,
    };
  }));

  return products;
}
