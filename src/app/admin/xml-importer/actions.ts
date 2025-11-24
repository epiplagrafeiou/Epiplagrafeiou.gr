
'use server';

import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';
import type { XmlProduct } from '@/lib/types/product';
import { XMLParser } from 'fast-xml-parser';

// Maps a supplier name (lowercase) to the correct parser function.
// NOTE: The parsers now expect the already-parsed JSON object, not a URL.
const parserMap: Record<string, (json: any) => Promise<XmlProduct[]>> = {
  'zougris': zougrisParser,
  'b2b portal': b2bportalParser,
  'megapap': megapapParser,
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
};

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  const name = supplierName.toLowerCase().trim();
  const parserFn = parserMap[name];

  // If a specific parser isn't found, we can't proceed.
  if (!parserFn) {
    throw new Error(`No parser configured for supplier: "${name}"`);
  }

  try {
    // 1. Fetch the XML from the provided URL
    console.log(`[ACTION] 📥 Fetching XML from: ${url} for ${supplierName}`);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(
        `[ACTION] Failed fetching XML: ${response.status} ${response.statusText}`
      );
    }
    const xmlText = await response.text();
    console.log(`[ACTION] ✅ XML Fetched successfully for ${supplierName}`);

    // 2. Parse the XML text into a JSON object.
    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
      cdataPropName: '__cdata',
      isArray: (name, jpath) => {
        // Define paths that should always be arrays for consistency
        return jpath.endsWith('.product') || jpath.endsWith('.images.image') || jpath.endsWith('.gallery.image');
      },
    });

    const parsedJson = xmlParser.parse(xmlText);
    
    // DEBUG: Log the exact structure to see what the parser gets.
    console.log(`===== PARSED JSON STRUCTURE for ${supplierName} =====`);
    console.dir(parsedJson, { depth: 10 });


    // 3. Call the appropriate parser with the PARSED JSON object.
    console.log(`[ACTION] 🔍 Running parser function for supplier: ${supplierName}`);
    const products = await parserFn(parsedJson);

    console.log(`[ACTION] ✅ Parser returned ${products.length} products.`);
    return products;
    
  } catch (error: any) {
    console.error(`[ACTION] ❌ XML sync failed for "${supplierName}":`, error);
    // Re-throw a clean error for the client-side to catch and display.
    throw new Error(
      `Could not process XML for "${supplierName}". Details: ${error.message}`
    );
  }
}
