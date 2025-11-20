
'use server';

import { XMLParser } from 'fast-xml-parser';
import type { XmlProduct } from '../types/product';
import { mapCategory } from '../category-mapper';

// Utility: strip out unwanted <script> tags
function cleanXml(xml: string): string {
  return xml.replace(/<script[\s\S]*?<\/script>/gi, "");
}

export async function zougrisParser(url: string): Promise<XmlProduct[]> {
  console.log("▶ Running Zougris parser");

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.statusText}`);
  }

  const xmlText = await response.text();
  const cleanXmlText = cleanXml(xmlText);

  const parser = new XMLParser({
    ignoreAttributes: true,
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      return jpath === 'Products.Product';
    },
    cdataPropName: '__cdata',
    trimValues: true,
    parseNodeValue: true,
    tagValueProcessor: (tagName, tagValue, jPath, isLeafNode, isAttribute) => {
        if (typeof tagValue === 'string' && tagValue.startsWith('<![CDATA[')) {
            return tagValue.substring(9, tagValue.length - 3);
        }
        return tagValue;
    }
  });

  const parsed = parser.parse(cleanXmlText);
  const productsNode = parsed?.Products?.Product;

  if (!productsNode) {
    throw new Error("❌ Zougris XML does not contain <Products><Product> nodes.");
  }

  const productArray = Array.isArray(productsNode) ? productsNode : [productsNode];

  return productArray.map((p: any) => {
    const images = [p.B2BImage, p.B2BImage2, p.B2BImage3, p.B2BImage4, p.B2BImage5].filter(Boolean);
    const rawCategory = [p.Category1, p.Category2, p.Category3].filter(Boolean).join(' > ');
    
    // Determine the most appropriate price, falling back if retail is zero
    const retailPrice = parseFloat(p.RetailPrice?.toString().replace(',', '.') || '0');
    const wholesalePrice = parseFloat(p.WholesalePrice?.toString().replace(',', '.') || '0');
    const webOfferPrice = retailPrice > 0 ? retailPrice : wholesalePrice;

    return {
        id: p.Code?.toString() || `zougris-${Math.random()}`,
        name: p.Title || 'No Name',
        retailPrice: retailPrice.toString(),
        webOfferPrice: webOfferPrice.toString(),
        description: p.Description || '',
        category: mapCategory(rawCategory),
        mainImage: images[0] || null,
        images: images,
        stock: parseInt(p.Quantity, 10) || 0,
    };
  });
}
