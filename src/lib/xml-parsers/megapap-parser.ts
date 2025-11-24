
'use server';
import { mapCategory } from "@/lib/mappers/categoryMapper";
import type { XmlProduct } from "../types/product";

export async function megapapParser(xmlJson: any): Promise<XmlProduct[]> {
  const items = xmlJson?.root?.products?.product ?? [];
  const products: XmlProduct[] = [];

  for (const item of items) {
    const rawCat = item.category || item.cat || "";

    const { category, categoryId, rawCategory } = await mapCategory(rawCat);

    const imagesNode = item.images?.image;
    let images: string[] = [];
    if (Array.isArray(imagesNode)) {
        images = imagesNode.filter(Boolean);
    } else if (typeof imagesNode === 'string') {
        images = [imagesNode];
    }
    
    const mainImage = item.main_image || images[0] || null;
    
    const webOfferPrice = item.weboffer_price_with_vat || item.price || "0";

    products.push({
      id: String(item.code || `megapap-${Math.random()}`),
      sku: item.code,
      model: item.model || "",
      variantGroupKey: item.groupId || null,
      color: item.color || null,
      name: item.name,
      description: item.description || "",
      rawCategory,
      category,
      categoryId,
      retailPrice: item.retail_price_with_vat || "0",
      webOfferPrice: webOfferPrice,
      stock: parseInt(item.stock ?? '0', 10),
      images: images,
      mainImage: mainImage,
      supplierName: "Megapap",
    } as XmlProduct);
  }

  return products;
}
