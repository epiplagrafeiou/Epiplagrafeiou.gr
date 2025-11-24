
'use server';

import { megapapParser } from '@/lib/xml-parsers/megapap-parser';
import { b2bportalParser } from '@/lib/xml-parsers/b2bportal-parser';
import { zougrisParser } from '@/lib/xml-parsers/zougris-parser';
import type { XmlProduct } from '@/lib/types/product';
import { XMLParser } from 'fast-xml-parser';

// A map to associate supplier names (lowercase) with their specific parser functions.
const parserMap: Record<string, (json: any) => Promise<XmlProduct[]>> = {
  'zougris': zougrisParser,
  'b2b portal': b2bportalParser,
  'megapap': megapapParser,
  // Add other specific suppliers here
  'nordic designs': megapapParser,
  'milano furnishings': megapapParser,
  'office solutions inc.': megapapParser,
};

// A fallback parser for any supplier not in the specific map.
// Using megapap or b2bportal as a generic fallback.
const fallbackParser = megapapParser;

export async function syncProductsFromXml(
  url: string,
  supplierName: string
): Promise<XmlProduct[]> {
  const normalizedSupplierName = supplierName.toLowerCase().trim();

  // Find the correct parser, or use the fallback.
  const parserFn = parserMap[normalizedSupplierName] || fallbackParser;
  
  try {
    console.log(`Fetching XML from: ${url} for supplier: "${supplierName}"`);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Failed to fetch XML: ${response.status} ${response.statusText}`);
    }
    const xmlText = await response.text();

    // The initial parsing from XML to JSON happens here.
    const xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        textNodeName: '#text',
        allowBooleanAttributes: true,
        trimValues: true,
        parseAttributeValue: true,
        parseNodeValue: true,
    });
    
    const parsedJson = xmlParser.parse(xmlText);

    // The supplier-specific parser function now receives the JSON object.
    console.log(`Using parser for supplier: "${normalizedSupplierName}"`);
    return await parserFn(parsedJson);

  } catch (error: any) {
    console.error(`❌ XML sync failed for "${supplierName}":`, error);
    // Re-throw a more user-friendly error to be caught by the UI.
    throw new Error(
      `Could not process XML for "${supplierName}". Details: ${error?.message || 'Unknown error.'}`
    );
  }
}
