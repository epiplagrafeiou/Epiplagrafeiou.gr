
'use server';

import { XMLParser } from 'fast-xml-parser';
import { mapCategory } from '../category-mapper';
import type { XmlProduct } from '../types/product';

export async function megapapParser(url: string): Promise<XmlProduct[]> {
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
      const newObj: Record<string, any> = {};
      for (const key in obj) newObj[key] = deCdata(obj[key]);
      return newObj;
    };

    const parsed = simplifiedParser.parse(xmlText);
    const productArray = deCdata(parsed).megapap?.products?.product;

    if (!productArray || !Array.isArray(productArray)) {
      console.error('Megapap Parser: Parsed product data is not an array or is missing at megapap.products.product:', productArray);
      throw new Error(
        'The XML feed does not have the expected structure for Megapap format. Could not find a product array at `megapap.products.product`.'
      );
    }
    
    const productsToParse = Array.isArray(productArray) ? productArray : [productArray];

    const products: XmlProduct[] = await Promise.all(productsToParse.map(async (p: any) => {
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
      
      const rawCategory = [p.category, p.subcategory].filter(Boolean).join(' > ');
      const productName = p.name || 'No Name';
      const { category, categoryId } = await mapCategory(rawCategory, productName);


      let finalWebOfferPrice = parseFloat(p.weboffer_price_with_vat || p.retail_price_with_vat || '0');
      
      const productNameLower = productName.toLowerCase();
      if (productNameLower.includes('καναπ') || productNameLower.includes('sofa')) {
        finalWebOfferPrice += 75;
      }

      return {
        id: p.id?.toString() || `temp-id-${Math.random()}`,
        name: productName,
        retailPrice: p.retail_price_with_vat || '0',
        webOfferPrice: finalWebOfferPrice.toString(),
        description: p.description || '',
        category,
        categoryId,
        rawCategory,
        mainImage,
        images: allImages,
        stock,
      };
    }));

    return products;
}

    