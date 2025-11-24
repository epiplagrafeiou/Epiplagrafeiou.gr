
'use server';

import { XMLParser } from 'fast-xml-parser';
import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';
import type { XmlProduct } from '@/lib/types/product';

const parserMap: Record<string, (json: any) => Promise<XmlProduct[]>> = {
  megapap: megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
  zougris: zougrisParser,
  'b2b portal': b2bportalParser,
};


export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  const name = supplierName.toLowerCase().trim();
  const parserFn = parserMap[name] || megapapParser; // Fallback to megapap

  try {
    console.log(`[ACTION] 📥 Fetching XML from: ${url}`);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(
        `[ACTION] Failed fetching XML: ${response.status} ${response.statusText}`
      );
    }
    const xmlText = await response.text();
    console.log(`[ACTION] ✅ XML Fetched successfully for ${supplierName}`);

    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '#text',
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
      cdataPropName: '__cdata',
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Define paths that should always be arrays
        return (
          jpath === 'megapap.products.product' ||
          jpath === 'b2bportal.products.product' ||
          jpath === 'mywebstore.products.product' ||
          jpath === 'Products.Product' ||
          jpath.endsWith('.images.image') ||
          jpath.endsWith('.gallery.image')
        );
      },
    });

    const parsedJson = xmlParser.parse(xmlText);
    
    console.log('===== PARSED JSON STRUCTURE =====');
    console.dir(parsedJson, { depth: 10 });

    console.log(`[ACTION] 🔍 Running parser for supplier: ${supplierName}`);
    const products = await parserFn(parsedJson);

    console.log(`[ACTION] ✅ Parser returned ${products.length} products.`);
    return products;
  } catch (error: any) {
    console.error(`[ACTION] ❌ XML sync failed for "${supplierName}":`, error);
    // Re-throw the error so the client-side transition can catch it
    throw new Error(
      `Could not process XML for "${supplierName}". Details: ${error.message}`
    );
  }
}
