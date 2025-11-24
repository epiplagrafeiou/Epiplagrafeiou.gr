
'use server';

import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';
import type { XmlProduct } from '@/lib/types/product';
import { XMLParser } from 'fast-xml-parser';

// Define a consistent signature for all parsers: they accept parsed JSON
const parserMap: Record<string, (json: any) => Promise<XmlProduct[]>> = {
  megapap: megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
  'b2b portal': b2bportalParser,
  // Zougris is special, it expects the URL, not parsed JSON, so we handle it separately.
};

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  const name = supplierName.toLowerCase().trim();

  // Special handling for Zougris parser which does its own fetch
  if (name === 'zougris') {
      console.log(`[ACTION] 🔍 Running Zougris parser directly for supplier: ${supplierName}`);
      return await zougrisParser(url);
  }

  const parserFn = parserMap[name];

  if (!parserFn) {
    throw new Error(`No parser configured for supplier: ${supplierName}`);
  }

  try {
    console.log(`[ACTION] 📥 Fetching XML from: ${url} for ${supplierName}`);
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
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
      cdataPropName: '__cdata',
      isArray: (name, jpath) => {
        // Define paths that should always be arrays
        return (
          jpath.endsWith('.product') ||
          jpath.endsWith('.images.image') ||
          jpath.endsWith('.gallery.image')
        );
      },
    });

    const parsedJson = xmlParser.parse(xmlText);

    // DEBUG: Log the structure to verify the parser's output
    console.log(`[ACTION] ===== PARSED JSON STRUCTURE for ${supplierName} =====`);
    console.dir(parsedJson, { depth: 10 });

    console.log(`[ACTION] 🔍 Running parser function for supplier: ${supplierName}`);
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
