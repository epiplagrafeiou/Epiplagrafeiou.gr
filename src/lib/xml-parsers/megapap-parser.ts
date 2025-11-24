'use server';
import { mapCategory } from "@/lib/mappers/categoryMapper";
import type { XmlProduct } from "../types/product";

export async function megapapParser(xmlJson: any) {
  const items = xmlJson?.root?.products?.product ?? [];
  const products: XmlProduct[] = [];

  for (const item of items) {
    const rawCat = item.category || item.cat || "";

    const { category, categoryId, rawCategory } = await mapCategory(rawCat);

    const images = Array.isArray(item.images?.image) ? item.images.image : item.images?.image ? [item.images.image] : [];
    const mainImage = images.length ? images[0] : null;

    products.push({
      id: item.code,
      sku: item.code,
      model: item.model || "",
      variantGroupKey: item.groupId || null,
      color: item.color || null,
      name: item.name,
      description: item.description || "",
      rawCategory,
      category,
      categoryId,
      webOfferPrice: item.price,
      stock: parseInt(item.stock ?? 0),
      images: images,
      mainImage: mainImage,
      supplierName: "Megapap",
    } as XmlProduct);
  }

  return products;
}
