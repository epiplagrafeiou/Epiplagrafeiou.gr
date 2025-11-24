
// /src/lib/xml-parsers/b2bportal-parser.ts
'use server';

import type { XmlProduct } from '@/lib/types/product';
import { mapCategory } from '@/lib/mappers/categoryMapper';

// Same helper as in megapap parser
function getText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim();
  }
  if (typeof node === 'object') {
    if ('#text' in node) return String((node as any)['#text']).trim();
    if ('__cdata' in node) return String((node as any)['__cdata']).trim();
    if ('_text' in node) return String((node as any)['_text']).trim();
  }
  return '';
}

export async function b2bportalParser(json: any): Promise<XmlProduct[]> {
  const root = json?.b2bportal ?? json;

  const rawProducts = root?.products?.product;

  const productsArray = Array.isArray(rawProducts)
    ? rawProducts
    : rawProducts
    ? [rawProducts]
    : [];

  if (!productsArray.length) {
    throw new Error(
      'B2B Portal XML does not contain products at b2bportal.products.product'
    );
  }

  const products: XmlProduct[] = [];

  for (const p of productsArray) {
    const id =
      getText(p.code) ||
      getText(p.id) ||
      getText(p.sku) ||
      `b2b-${Math.random().toString(36).slice(2)}`;

    const name = getText(p.name) || 'No Name';

    // Images
    let images: string[] = [];
    const mainImage = getText(p.image) || null;

    const galleryNode = p.gallery?.image;
    if (Array.isArray(galleryNode)) {
      images.push(
        ...galleryNode.map((img: any) => getText(img)).filter(Boolean)
      );
    } else {
      const singleGallery = getText(galleryNode);
      if (singleGallery) images.push(singleGallery);
    }

    if (mainImage) images.unshift(mainImage);
    images = Array.from(new Set(images));

    // Availability / stock
    const availabilityText = getText(p.availability).toLowerCase();
    const isAvailable =
      availabilityText === '1' ||
      availabilityText === 'ναι' ||
      availabilityText === 'yes';

    let stock = 0;
    if (p.stock) {
      stock = Number(getText(p.stock)) || 0;
    } else if (p.qty) {
      stock = Number(getText(p.qty)) || 0;
    } else if (p.quantity) {
      stock = Number(getText(p.quantity)) || 0;
    } else if (isAvailable) {
      stock = 1;
    }

    // Category from <category> + <subcategory>
    const rawCategoryString = [getText(p.category), getText(p.subcategory)]
      .filter(Boolean)
      .join(' > ');

    const { category, categoryId, rawCategory } = await mapCategory(rawCategoryString);

    // Prices
    const retailPriceStr = getText(p.retail_price) || '0';
    const priceStr = getText(p.price) || retailPriceStr || '0';

    // This is the "supplier base" that your markup rules will start from
    const webOfferPrice =
      parseFloat(priceStr.replace(',', '.')).toString() ||
      parseFloat(retailPriceStr.replace(',', '.')).toString() ||
      '0';

    products.push({
      id,
      name,
      sku: getText(p.sku) || undefined,
      model: getText(p.model) || undefined,
      retailPrice: retailPriceStr,
      webOfferPrice,
      description: getText(p.descr),
      rawCategory: rawCategory || rawCategoryString,
      category,
      categoryId,
      mainImage: images[0] || null,
      images,
      stock,
      isAvailable,
    });
  }

  return products;
}
