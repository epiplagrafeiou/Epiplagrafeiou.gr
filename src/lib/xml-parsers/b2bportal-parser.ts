
// /src/lib/xml-parsers/b2bportal-parser.ts
'use server';

import type { XmlProduct } from '@/lib/types/product';
import { mapCategory } from '@/lib/mappers/categoryMapper';

// Safe text extractor for fast-xml-parser JSON
function getText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim();
  }
  if (typeof node === 'object') {
    if (typeof node['#text'] === 'string' || typeof node['#text'] === 'number') {
      return String(node['#text']).trim();
    }
    if (typeof node._text === 'string' || typeof node._text === 'number') {
      return String(node._text).trim();
    }
    if (typeof node.__cdata === 'string' || typeof node.__cdata === 'number') {
      return String(node.__cdata).trim();
    }
  }
  return '';
}

// Normalize availability text into a boolean and stock
function computeStock(p: any): number {
  const availabilityText = getText(p.availability).toLowerCase();
  const isAvailable =
    availabilityText === 'ναι' ||
    availabilityText === 'yes' ||
    availabilityText === '1' ||
    availabilityText.includes('άμεση παραλαβή');

  const rawQty =
    getText(p.availability_qty) ||
    getText(p.stock) ||
    getText(p.qty) ||
    getText(p.quantity) ||
    '';

  let stock = Number(rawQty) || 0;
  if (!stock && isAvailable) {
    stock = 1; // fallback minimal quantity when marked as available
  }

  return stock;
}

export async function b2bportalParser(parsedJson: any): Promise<XmlProduct[]> {
  // Expected structure:
  // { b2bportal: { products: { product: [...] } } }
  // or { mywebstore: { products: { product: [...] } } }
  // or possibly { products: { product: [...] } }
  let productArray: any =
    parsedJson?.b2bportal?.products?.product ??
    parsedJson?.mywebstore?.products?.product ??
    parsedJson?.products?.product;

  if (!productArray) {
    console.error(
      'B2B Portal Parser: No products found at `b2bportal.products.product` / `mywebstore.products.product` / `products.product`',
      parsedJson
    );
    throw new Error(
      'B2B Portal XML does not contain products at b2bportal.products.product or mywebstore.products.product'
    );
  }

  if (!Array.isArray(productArray)) {
    productArray = [productArray];
  }

  const products: XmlProduct[] = await Promise.all(
    productArray.map(async (p: any) => {
      // IDs
      const idAttr = p['@_id'];
      const id =
        getText(p.code) ||
        getText(p.id) ||
        (idAttr != null ? String(idAttr).trim() : '') ||
        `b2b-${Math.random().toString(36).slice(2, 10)}`;

      const name = getText(p.name) || 'No Name';

      // Raw supplier category: we want the original supplier path,
      // combining <category> + <subcategory> (e.g. "Κουβέρτες & Ριχτάρια > Σαλόνι")
      const rawCategoryStr = [getText(p.category), getText(p.subcategory)]
        .filter(Boolean)
        .join(' > ');

      const { rawCategory, category, categoryId } = await mapCategory(rawCategoryStr);

      // Images
      const mainImage = getText(p.image) || null;

      let galleryImages: string[] = [];
      const galleryNode = p.gallery?.image;
      if (galleryNode) {
        if (Array.isArray(galleryNode)) {
          galleryImages = galleryNode.map((img: any) => getText(img)).filter(Boolean);
        } else {
          const single = getText(galleryNode);
          if (single) galleryImages.push(single);
        }
      }

      const allImages = Array.from(
        new Set<string>([mainImage, ...galleryImages].filter(Boolean) as string[])
      );

      // Stock
      const stock = computeStock(p);

      // Prices
      const retailPriceStr = getText(p.retail_price) || '0';
      const wholesalePriceStr = getText(p.price) || '0';

      const retailPrice = retailPriceStr.replace(',', '.');
      const wholesalePrice = wholesalePriceStr.replace(',', '.');

      // For XML importer, `webOfferPrice` is the supplier price we apply markup on.
      const webOfferPrice = wholesalePrice || retailPrice;

      const description = getText(p.descr);

      const sku = getText(p.sku) || undefined;
      const model = getText(p.model) || undefined;

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
