
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from './megapap-parser';
import { mapCategory } from '../category-mapper';

// Utility: remove script tags
function cleanXml(xml: string): string {
  return xml.replace(/<script[\s\S]*?<\/script>/gi, "");
}

// UNIVERSAL XML TEXT EXTRACTOR
function getText(node: any): string {
  if (!node) return "";

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return getText(node[0]);
  }

  // fast-xml-parser uses these
  return (
    node.__cdata ||
    node._text ||
    node._ ||
    ""
  );
}

export async function b2bportalParser(url: string): Promise<XmlProduct[]> {
  console.log("▶ Running B2B Portal parser");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();
  const cleanText = cleanXml(xmlText);

  const parser = new XMLParser({
    ignoreAttributes: false,
    cdataPropName: "__cdata",
    textNodeName: "_text",
    trimValues: true,
    isArray: (name, jpath) => {
      // Treat all potential category tags as arrays to handle multiple occurrences
      const categoryTags = ['category', 'category1', 'category2', 'subcategory', 'category_name', 'cat', 'type', 'group', 'family', 'product_category', 'product_subcategory'];
      if (categoryTags.includes(name)) return true;

      if (jpath === "b2bportal.products.product") return true;
      if (jpath.endsWith(".gallery.image")) return true;
      return false;
    },
  });

  const parsed = parser.parse(cleanText);

  console.log("🔍 Parsed B2B ROOT KEYS:", Object.keys(parsed));

  const productArray =
    parsed.b2bportal?.products?.product ||
    parsed.mywebstore?.products?.product; // fallback for alt feeds

  if (!productArray || !Array.isArray(productArray)) {
    console.error("❌ Product array not found. Parsed structure:", parsed);
    throw new Error(
      "The XML feed does not contain a valid product array at b2bportal.products.product"
    );
  }

  // 🔥 Debug ONE product to see final XML format
  console.log(
    "🧪 Example Parsed Product:",
    JSON.stringify(productArray[0], null, 2)
  );

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

    // ROBUST CATEGORY EXTRACTION
    const potentialCategoryFields = ['subcategory', 'category', 'category1', 'category2', 'category_name', 'cat', 'type', 'group', 'family', 'product_category', 'product_subcategory'];
    const supplierCategories: string[] = [];
    potentialCategoryFields.forEach(field => {
        if (p[field]) {
            // Since we force array parsing, we can always treat it as an array
            (p[field] as any[]).forEach(catNode => {
                const text = getText(catNode);
                if (text) supplierCategories.push(text);
            });
        }
    });

    const rawCategory = Array.from(new Set(supplierCategories)).filter(Boolean).join(" > ");


    // STOCK FIX
    const availability = getText(p.availability).replace(/\D/g, "");
    const stock = availability ? Number(availability) : 0;

    // PRICE FIX
    const retailPrice = parseFloat(
      getText(p.retail_price).replace(",", ".") || "0"
    );
    const wholesalePrice = parseFloat(
      getText(p.price).replace(",", ".") || "0"
    );

    const finalPrice =
      retailPrice > 0 ? retailPrice : wholesalePrice > 0 ? wholesalePrice : 0;

    return {
      id:
        getText(p.code) ||
        getText(p.sku) ||
        `b2b-${Math.random().toString(36).slice(2)}`,
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
