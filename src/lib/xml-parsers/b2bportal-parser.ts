
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../category-mapper';

// Universal XML text extractor
function getText(node: any): string {
  if (!node) return "";

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return getText(node[0]);
  }

  // fast-xml-parser uses these for CDATA, text nodes, etc.
  return (
    node.__cdata ||
    node['#text'] || // a common pattern
    node._text ||
    node._ ||
    ""
  );
}

// Dynamically build a full category path by scanning product keys
const extractCategoryPath = (p: Record<string, any>): string => {
  const parts: { key: string; level: number; value: string }[] = [];

  for (const key of Object.keys(p)) {
    const lower = key.toLowerCase();
    const value = getText(p[key]);
    if (!value) continue;

    if (lower.startsWith('subcategory')) {
      const level = parseInt(lower.replace('subcategory', ''), 10) || 1;
      parts.push({ key, level, value });
    } else if (lower.startsWith('category')) {
      const level = parseInt(lower.replace('category', ''), 10) || 0;
      parts.push({ key, level, value });
    } else if (['group', 'type', 'family'].includes(lower)) {
        parts.push({ key, level: 0, value });
    }
  }

  // Sort: category (level 0) first, then subcategory, then subcategory2/3...
  parts.sort((a, b) => a.level - b.level);

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const orderedValues = parts
    .map(p => p.value.trim())
    .filter(v => {
      const key = v.toLowerCase();
      if (!v || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return orderedValues.join(' > ');
};


export async function b2bportalParser(url: string): Promise<XmlProduct[]> {
  console.log("▶ Running B2B Portal parser");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();
  const cleanText = xmlText.replace(/<script[\s\S]*?<\/script>/gi, "");


  const parser = new XMLParser({
    ignoreAttributes: false,
    cdataPropName: "__cdata",
    textNodeName: "_text",
    trimValues: true,
    isArray: (name, jpath) => {
      if (jpath === "b2bportal.products.product" || jpath === 'mywebstore.products.product') return true;
      if (jpath.endsWith(".gallery.image")) return true;
      if (name === "category" || name === "subcategory") return true;
      return false;
    },
  });

  const parsed = parser.parse(cleanText);

  const productArray =
    parsed.b2bportal?.products?.product ||
    parsed.mywebstore?.products?.product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error("❌ Product array not found. Parsed structure:", parsed);
    throw new Error(
      "The XML feed does not contain a valid product array at b2bportal.products.product"
    );
  }

  const products: XmlProduct[] = productArray.map((p: any) => {
    // IMAGES
    const mainImg = getText(p.image);
    const gallery = Array.isArray(p.gallery?.image)
      ? p.gallery.image.map(getText)
      : p.gallery?.image
      ? [getText(p.gallery.image)]
      : [];

    const allImages = Array.from(new Set([mainImg, ...gallery].filter(Boolean)));
    const mainImage = allImages[0] || null;

    // CATEGORY
    const rawCategory = extractCategoryPath(p);

    // STOCK
    const availability = getText(p.availability);
    const stock = availability === '1' ? 1 : 0; // Simple in-stock check

    // PRICE
    const retailPrice = parseFloat(
      getText(p.retail_price).replace(",", ".") || "0"
    );
    const wholesalePrice = parseFloat(
      getText(p.price).replace(",", ".") || "0"
    );
    const finalPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

    return {
      id: getText(p.code) || getText(p.sku) || `b2b-${Math.random().toString(36).slice(2)}`,
      name: getText(p.name) || "Unnamed Product",
      retailPrice: retailPrice.toString(),
      webOfferPrice: finalPrice.toString(),
      description: getText(p.descr) || "",
      category: mapCategory(rawCategory),
      mainImage,
      images: allImages,
      stock,
    };
  });

  return products;
}
