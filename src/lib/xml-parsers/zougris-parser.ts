
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '@/lib/mappers/categoryMapper';

export async function zougrisParser(url: string): Promise<XmlProduct[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML for Zougris: ${response.statusText}`);
  }

  const xmlText = await response.text();

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

  const parsed = parser.parse(xmlText);
  const productArray = parsed?.Products?.Product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error('Zougris parsed product data is not an array or is missing:', productArray);
    throw new Error('The Zougris XML feed does not have the expected structure at `Products.Product`.');
  }

  const products: XmlProduct[] = [];

  for(const p of productArray) {
    const rawCat = [
      p.Category1,
      p.Category2,
      p.Category3,
      p.Epilogi,
    ].filter(Boolean).join(' > ');
    
    const { category, categoryId, rawCategory } = await mapCategory(rawCat);

    const imageKeys = Object.keys(p).filter(k => k.toLowerCase().startsWith('b2bimage'));
    const allImages = imageKeys.map(k => p[k]).filter(Boolean);
    const mainImage = allImages[0] || null;

    const stock = parseInt(p.Quantity, 10) || 0;
    
    const retailPriceNum = parseFloat((p.RetailPrice || '0').replace(',', '.'));
    const wholesalePriceNum = parseFloat((p.WholesalePrice || '0').replace(',', '.'));
    const finalPriceNum = retailPriceNum > 0 ? retailPriceNum : wholesalePriceNum;

    products.push({
      id: p.Code?.toString() || `zougris-${Math.random()}`,
      name: p.Title || 'No Name',
      description: p.Description || '',
      sku: p.Code?.toString(),
      model: p.Model?.toString() || '',
      rawCategory: rawCategory,
      category,
      categoryId,
      retailPrice: retailPriceNum.toString(),
      webOfferPrice: finalPriceNum.toString(),
      stock,
      isAvailable: stock > 0,
      images: allImages,
      mainImage,
      supplierName: "Zougris",
    });
  }
  
  return products;
}

