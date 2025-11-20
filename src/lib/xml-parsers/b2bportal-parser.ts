
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from './megapap-parser';
import { mapCategory } from '../category-mapper';

// Utility: remove script tags
function cleanXml(xml: string): string {
  return xml.replace(/<script[\s\S]*?<\/script>/gi, "");
}

// UNIVERSAL XML TEXT EXTRACTOR
const getText = (node: any): string => {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node).trim();
  }
  if (typeof node === "object") {
    if ("__cdata" in node) return String(node.__cdata).trim();
    if ("_text" in node) return String(node._text).trim();
  }
  return "";
};


export async function b2bportalParser(url: string): Promise<XmlProduct[]> {
  console.log("▶ Running B2B Portal parser (v8 - Safe Text Extraction)");

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();
  const cleanText = cleanXml(xmlText);

  const parser = new XMLParser({
    ignoreAttributes: true,
    cdataPropName: "__cdata",
    textNodeName: "_text",
    trimValues: true,
    parseNodeValue: true,
    parseAttributeValue: true,
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      return jpath === 'b2bportal.products.product' || jpath.endsWith('.gallery.image');
    },
  });
  
  const parsed = parser.parse(cleanText);

  const productArray = parsed?.b2bportal?.products?.product;

  if (!productArray || !Array.isArray(productArray)) {
    console.error("❌ Product array not found in B2B Portal feed. Parsed structure:", parsed);
    throw new Error(
      "The XML feed does not contain a valid product array at b2bportal.products.product"
    );
  }
  
  const products: XmlProduct[] = productArray.map((p: any) => {
    
    const subcategory = getText(p.subcategory);
    const category = getText(p.category);
    const rawCategory = [subcategory, category].filter(Boolean).join(" > ");
    
    const stock = Number(p.availability) === 1 ? 1 : 0;
    
    const retailPrice = parseFloat(String(getText(p.retail_price) || '0').replace(',', '.'));
    const wholesalePrice = parseFloat(String(getText(p.price) || '0').replace(',', '.'));
    const finalPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

    const allImages = [getText(p.image), ...(Array.isArray(p.gallery?.image) ? p.gallery.image : p.gallery?.image ? [p.gallery.image] : [])].map(getText).filter(Boolean);
    const mainImage = allImages[0] || null;

    return {
      id: getText(p.code) || `b2b-${Math.random()}`,
      name: getText(p.name) || "Unnamed Product",
      retailPrice: retailPrice.toString(),
      webOfferPrice: finalPrice.toString(),
      description: getText(p.descr) || "",
      category: mapCategory(rawCategory),
      mainImage: mainImage,
      images: Array.from(new Set(allImages)),
      stock: stock,
    };
  });

  return products;
}
