
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from './megapap-parser';
import { mapCategory } from '../category-mapper';

// Utility: remove script tags
function cleanXml(xml: string): string {
  return xml.replace(/<script[\s\S]*?<\/script>/gi, "");
}

export async function b2bportalParser(url: string): Promise<XmlProduct[]> {
  console.log("▶ Running B2B Portal parser (v4 - Final Corrected Version)");

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();
  const cleanText = cleanXml(xmlText);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    cdataPropName: "__cdata",
    textNodeName: "_text",
    trimValues: true,
    parseNodeValue: true,
    parseAttributeValue: true,
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      if (jpath === "b2bportal.products.product" || jpath.endsWith(".gallery.image")) {
        return true;
      }
      return false;
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
    // Helper to safely extract text from CDATA or plain text nodes
    const getText = (node: any): string => {
        if (!node) return "";
        if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
        return (node.__cdata || node._text || "").trim();
    }
    
    // Combine subcategory and category for a full path
    const subcategory = getText(p.subcategory);
    const category = getText(p.category);
    const rawCategory = [subcategory, category].filter(Boolean).join(" > ");
    
    // Correctly determine stock status
    const stock = Number(p.availability) === 1 ? 10 : 0;
    
    // Correctly parse prices, with fallback
    const retailPrice = parseFloat(String(p.retail_price || '0').replace(',', '.'));
    const wholesalePrice = parseFloat(String(p.price || '0').replace(',', '.'));
    const finalPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

    // Collect all images
    const allImages = [p.image, ...(Array.isArray(p.gallery?.image) ? p.gallery.image : p.gallery?.image ? [p.gallery.image] : [])].filter(Boolean);
    const mainImage = allImages[0] || null;

    return {
      id: getText(p.code) || `b2b-${p.id}`,
      name: getText(p.name) || "Unnamed Product",
      retailPrice: retailPrice.toString(),
      webOfferPrice: finalPrice.toString(),
      description: getText(p.descr) || "",
      category: mapCategory(rawCategory), // Use the external mapper
      mainImage: mainImage,
      images: Array.from(new Set(allImages)),
      stock: stock,
    };
  });

  return products;
}
