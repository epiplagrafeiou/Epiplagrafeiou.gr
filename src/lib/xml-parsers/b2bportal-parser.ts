
'use server';
import { mapCategory } from "@/lib/mappers/categoryMapper";
import type { XmlProduct } from "../types/product";

export async function b2bportalParser(xmlJson: any): Promise<XmlProduct[]> {
  const items = xmlJson?.rss?.channel?.[0]?.item ?? [];
  const products: XmlProduct[] = [];

  for (const i of items) {
    const rawCat =
      (typeof i.category?.[0] === "string" ? i.category[0] : "") || "";

    const { category, categoryId, rawCategory } = await mapCategory(rawCat);

    const images = i["g:image_link"] ?? [];
    const mainImage = images.length ? images[0] : null;

    products.push({
      id: i["g:id"]?.[0],
      sku: i["g:id"]?.[0],
      model: i["g:brand"]?.[0] || "",
      variantGroupKey: null,
      color: i["g:color"]?.[0] || null,
      name: i.title?.[0] || "",
      description: i["g:description"]?.[0] || "",
      rawCategory,
      category,
      categoryId,
      retailPrice: i["g:price"]?.[0]?.replace(" EUR", "") || "0",
      webOfferPrice: i["g:price"]?.[0]?.replace(" EUR", "") || "0",
      stock: parseInt(i["g:quantity"]?.[0] || '0', 10),
      images,
      mainImage,
      supplierName: "B2B Portal",
    } as XmlProduct);
  }

  return products;
}
