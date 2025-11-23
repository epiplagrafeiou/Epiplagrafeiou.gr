
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../category-mapper';

// Gets the variant group key from SKU (e.g., GP037-0029,1 -> GP037-0029)
function getVariantGroupKey(sku: string): string {
  if (!sku) return '';
  return sku.includes(',') ? sku.split(',')[0] : sku;
}

// Extracts the color from the filters string, now safely handling non-string inputs.
function getColorFromFilters(filters: any): string | undefined {
    if (typeof filters !== 'string' || !filters) {
        return undefined;
    }
    const colorFilter = filters.split(';').find(f => f.startsWith('ΧΡΩΜΑ:'));
    if (!colorFilter) return undefined;
    return colorFilter.split(':')[1]?.trim();
}

export async function megapapParser(url: string): Promise<XmlProduct[]> {
    console.log("▶ Running Megapap parser");
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.statusText}`);
    }

    const xmlText = await response.text();

    const simplifiedParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        return jpath === 'megapap.products.product' || jpath.endsWith('.images.image');
      },
      textNodeName: '_text',
      trimValues: true,
      cdataPropName: '__cdata',
      parseNodeValue: true,
      parseAttributeValue: true,
      parseTrueNumberOnly: true,
    });

    const deCdata = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (Array.isArray(obj)) return obj.map(deCdata);
      if ('__cdata' in obj) return obj.__cdata;
      if ('_text' in obj) return obj._text;
      const newObj: Record<string, any> = {};
      for (const key in obj) newObj[key] = deCdata(obj[key]);
      return newObj;
    };

    const parsed = simplifiedParser.parse(xmlText);
    let productArray = deCdata(parsed).megapap?.products?.product;

    if (!productArray) {
        console.warn('Megapap Parser: No products found in the XML feed.');
        return [];
    }
    
    if (!Array.isArray(productArray)) {
        productArray = [productArray];
    }
    
    const products: XmlProduct[] = await Promise.all(productArray.map(async (p: any) => {
      let allImages: string[] = [];
      if (p.images && p.images.image) {
        if (Array.isArray(p.images.image)) {
          allImages = p.images.image
            .map((img: any) =>
              typeof img === 'object' && img._text ? img._text : img
            )
            .filter(Boolean);
        } else if (typeof p.images.image === 'object' && p.images.image._text) {
          allImages = [p.images.image._text];
        } else if (typeof p.images.image === 'string') {
          allImages = [p.images.image];
        }
      }

      const mainImage = p.main_image || null;
      if (mainImage && !allImages.includes(mainImage)) {
        allImages.unshift(mainImage);
      }

      const rawStock =
        p.qty?.quantity ??
        p.qty?._text ??
        p.qty ??
        p.stock ??
        p.quantity ??
        0;
      const stock = Number(rawStock) || 0;
      
      const rawCategory = [p.category, p.subcategory].filter(Boolean).map(c => typeof c === 'object' ? c._text || '' : c).join(' > ');
      const productName = p.name || 'No Name';
      
      const sku = p.id?.toString() || `temp-id-${Math.random()}`;
      
      let finalWebOfferPrice = parseFloat(p.weboffer_price_with_vat || p.retail_price_with_vat || '0');
      const productNameLower = productName.toLowerCase();
      if (productNameLower.includes('καναπ') || productNameLower.includes('sofa')) {
        finalWebOfferPrice += 75;
      }
      
      const mappedCategory = await mapCategory(rawCategory, productName);

      return {
        id: sku,
        sku: sku,
        model: p.model,
        variantGroupKey: getVariantGroupKey(sku),
        color: getColorFromFilters(p.filters),
        name: productName,
        retailPrice: p.retail_price_with_vat || '0',
        webOfferPrice: finalWebOfferPrice.toString(),
        description: p.description || '',
        category: mappedCategory,
        mainImage,
        images: allImages,
        stock,
      };
    }));

    return products;
}
