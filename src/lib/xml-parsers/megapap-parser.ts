
// /src/lib/xml-parsers/megapap-parser.ts
'use server';

import type { XmlProduct } from '@/lib/types/product';
import { mapCategory } from '@/lib/mappers/categoryMapper';

// Safe text extractor compatible with fast-xml-parser config in actions.ts
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

export async function megapapParser(json: any): Promise<XmlProduct[]> {
  // Support being called with the full parsed JSON
  const root = json?.megapap ?? json;

  const rawProducts = root?.products?.product;

  const productsArray = Array.isArray(rawProducts)
    ? rawProducts
    : rawProducts
    ? [rawProducts]
    : [];

  if (!productsArray.length) {
    throw new Error(
      'Megapap XML does not contain products at megapap.products.product'
    );
  }

  const products: XmlProduct[] = [];

  for (const p of productsArray) {
    const id =
      getText(p.id) ||
      getText(p.sku) ||
      getText(p.model) ||
      `megapap-${Math.random().toString(36).slice(2)}`;

    const name = getText(p.name) || 'No Name';

    // Images
    let images: string[] = [];
    const mainImage = getText(p.main_image) || null;

    const galleryNode = p.images?.image;
    if (Array.isArray(galleryNode)) {
      images.push(
        ...galleryNode.map((img: any) => getText(img)).filter(Boolean)
      );
    } else {
      const singleGallery = getText(galleryNode);
      if (singleGallery) images.push(singleGallery);
    }

    if (mainImage) {
      images.unshift(mainImage);
    }

    // dedupe
    images = Array.from(new Set(images));

    // Stock
    const stockRaw =
      getText(p.quantity) ||
      getText(p.qty) ||
      getText(p.stock) ||
      getText(p.volume_item); // last fallback, usually 0
    const stock = Number(stockRaw) || 0;

    // Category
    const rawCategoryString = getText(p.category); // e.g. "Έπιπλα κήπου > Πανιά καρέκλας σκηνοθέτη"
    const { category, categoryId, rawCategory } = await mapCategory(rawCategoryString);

    // Prices
    const retailPriceStr =
      getText(p.retail_price_with_vat) || getText(p.retail_price) || '0';
    const webOfferStr =
      getText(p.weboffer_price_with_vat) ||
      getText(p.weboffer_price) ||
      retailPriceStr ||
      '0';

    let webOfferPriceNum =
      parseFloat(webOfferStr.replace(',', '.')) ||
      parseFloat(retailPriceStr.replace(',', '.')) ||
      0;

    // Extra shipping cushion for sofas (your earlier rule)
    const lowerName = name.toLowerCase();
    if (lowerName.includes('καναπ') || lowerName.includes('sofa')) {
      webOfferPriceNum += 75;
    }

    const webOfferPrice = webOfferPriceNum.toString();

    products.push({
      id,
      name,
      sku: getText(p.sku) || undefined,
      model: getText(p.model) || undefined,
      retailPrice: retailPriceStr,
      webOfferPrice,
      description: getText(p.description),
      rawCategory: rawCategory || rawCategoryString,
      category,
      categoryId,
      mainImage: images[0] || null,
      images,
      stock,
      // megapap availability is descriptive text, treat any non-empty as available
      isAvailable: Boolean(getText(p.availability)),
    });
  }

  return products;
}
