// /src/lib/xml-parsers/megapap-parser.ts
'use server';

import type { XmlProduct } from '@/lib/types/product';
import { mapCategory } from '@/lib/mappers/categoryMapper';

// Safely extract text from nodes created by fast-xml-parser
function getText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim();
  }
  if (typeof node === 'object') {
    // When parsed with textNodeName: '#text'
    if (typeof node['#text'] === 'string' || typeof node['#text'] === 'number') {
      return String(node['#text']).trim();
    }
    // Other possible keys (fallbacks)
    if (typeof node._text === 'string' || typeof node._text === 'number') {
      return String(node._text).trim();
    }
    if (typeof node.__cdata === 'string' || typeof node.__cdata === 'number') {
      return String(node.__cdata).trim();
    }
  }
  return '';
}

export async function megapapParser(json: any): Promise<XmlProduct[]> {
  // Expect structure: { megapap: { products: { product: [...] } } }
  let productArray: any = json?.megapap?.products?.product;

  if (!productArray) {
    console.error('Megapap Parser: No products found at `megapap.products.product`', json);
    throw new Error('Megapap XML does not contain products at megapap.products.product');
  }

  if (!Array.isArray(productArray)) {
    productArray = [productArray];
  }

  const products: XmlProduct[] = await Promise.all(
    productArray.map(async (p: any) => {
      // ID: prefer product id attribute / id / model / sku
      const idAttr = p['@_id'];
      const id =
        getText(p.id) ||
        (idAttr != null ? String(idAttr).trim() : '') ||
        getText(p.model) ||
        getText(p.sku) ||
        `megapap-${Math.random().toString(36).slice(2, 10)}`;

      const name = getText(p.name) || 'No Name';

      // Raw category from supplier (we combine category and subcategory just in case)
      const rawCategoryStr = [getText(p.category), getText(p.subcategory)]
        .filter(Boolean)
        .join(' > ');

      // Map to your store category using Firestore categories
      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryStr);

      // Images
      const mainImage = getText(p.main_image) || null;

      let extraImages: string[] = [];
      const imagesNode = p.images?.image;
      if (imagesNode) {
        if (Array.isArray(imagesNode)) {
          extraImages = imagesNode.map((img: any) => getText(img)).filter(Boolean);
        } else {
          const single = getText(imagesNode);
          if (single) extraImages.push(single);
        }
      }

      const allImages = Array.from(
        new Set<string>([mainImage, ...extraImages].filter(Boolean) as string[])
      );

      // Stock
      const stockRaw =
        getText(p.quantity) ||
        getText(p.qty) ||
        getText(p.stock) ||
        getText(p.quantity_item) ||
        '0';
      const stock = Number(stockRaw) || 0;

      // Prices
      const retailPriceStr = getText(p.retail_price_with_vat) || '0';
      const webOfferStr = getText(p.weboffer_price_with_vat) || retailPriceStr;

      const retailPrice = retailPriceStr.replace(',', '.');
      const webOfferPrice = webOfferStr.replace(',', '.');

      // Extra fields (used by your Product model)
      const sku = getText(p.sku) || undefined;
      const model = getText(p.model) || undefined;

      const description = getText(p.description);

      const product: XmlProduct = {
        id,
        name,
        sku,
        model,
        retailPrice,
        webOfferPrice,
        description,
        rawCategory,
        category,
        categoryId,
        mainImage: allImages[0] || null,
        images: allImages,
        stock,
      };

      return product;
    })
  );

  return products;
}