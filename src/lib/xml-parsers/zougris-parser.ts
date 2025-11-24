
'use server';

import type { XmlProduct } from '../types/product';
import { mapCategory } from '../mappers/categoryMapper';

export async function zougrisParser(xmlJson: any): Promise<XmlProduct[]> {
  const items = xmlJson?.Products?.Product ?? [];
  const products: XmlProduct[] = [];

  for (const p of items) {
    const rawCategory = [
      p.Category1,
      p.Category2,
      p.Category3,
      p.Epilogi,
    ].filter(Boolean).join(' > ');
    
    const { category, categoryId } = await mapCategory(rawCategory);

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
        rawCategory,
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
